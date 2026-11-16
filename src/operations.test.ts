// Gestes : tout se passe dans des projets temporaires, avec une bibliothèque et une Corbeille factices.
import { lstat, mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { contentHash } from './fsops'
import { addSkills, keepVersion, propagate, removeFromDir, removeSkill, type OpContext, type OpResult } from './operations'
import type { ManagedDir } from './skill-dirs'
import { fakeSkillsLib, fakeTrasher, ROMAIN_AGENTS, tempDir, writeSkill } from './test-fixtures'

const WRITE_DIRS: ManagedDir[] = ['.agents/skills', '.claude/skills', '.grok/skills', '.openclaude/skills']

const exists = async (path: string) => (await lstat(path).catch(() => null)) !== null
const hashOf = (root: string, dir: string, folder: string) => contentHash(join(root, dir, folder))
const skillText = (root: string, dir: string, folder: string) => readFile(join(root, dir, folder, 'SKILL.md'), 'utf8')

function setup(label: string, writeDirs: readonly ManagedDir[] = WRITE_DIRS) {
  const root = tempDir(`ops-${label}`)
  const lib = fakeSkillsLib()
  const trash = fakeTrasher()
  const ctx: OpContext = { root, home: '/home/test', lib, trash, tmpdir: tempDir(`ops-${label}-tmp`), writeDirs, active: ROMAIN_AGENTS }
  const source = lib.source([
    { name: 'alpha', body: 'Alpha v1\n' },
    { name: 'Beta Skill', body: 'Beta v1\n' }
  ])
  return { root, lib, trash, ctx, source }
}

/** Dossier hors projet avec une skill `alpha` dedans (cible d'un lien externe). */
async function outsideSkill(label: string, body = 'Outside\n'): Promise<string> {
  const outside = tempDir(`ops-${label}-outside`)
  writeSkill(outside, 'skills', 'alpha', 'name: alpha\ndescription: Outside', body)
  return outside
}

function failure(result: OpResult) {
  assert.equal(result.ok, false)
  if (result.ok) throw new Error('unreachable')
  return result.error
}

function success(result: OpResult) {
  assert.equal(result.ok, true, result.ok ? '' : JSON.stringify(result.error))
  if (!result.ok) throw new Error('unreachable')
  return result
}

test('adds into the write dirs and copies into copy-only dirs', async () => {
  const { root, lib, ctx, source } = setup('add')
  const result = success(await addSkills(ctx, source, ['alpha'], false))
  assert.deepEqual(result.warnings, [])
  assert.deepEqual(lib.calls.install.length, 1)
  assert.deepEqual(lib.calls.install[0]!.libAgents, ['universal', 'claude-code', 'grok'])
  const reference = await hashOf(root, '.agents/skills', 'alpha')
  for (const dir of WRITE_DIRS) assert.equal(await hashOf(root, dir, 'alpha'), reference, dir)
  assert.equal((await lstat(join(root, '.openclaude/skills/alpha'))).isSymbolicLink(), false)
  assert.equal(lib.lock.get('alpha')?.libName, 'alpha')
})

test('detects a collision on the sanitized folder name', async () => {
  const { root, lib, trash, ctx, source } = setup('collision')
  writeSkill(root, '.claude/skills', 'beta-skill', 'name: Mine\ndescription: Handwritten', 'My own\n')
  const before = await hashOf(root, '.claude/skills', 'beta-skill')
  const result = await addSkills(ctx, source, ['Beta Skill'], false)
  assert.deepEqual(result, { ok: false, error: { code: 'collision', folders: ['beta-skill'] } })
  assert.equal(await hashOf(root, '.claude/skills', 'beta-skill'), before)
  assert.equal(lib.calls.install.length, 0)
  assert.deepEqual(trash.trashed, [])
  assert.equal(await exists(join(root, '.agents')), false)
})

test('detects a collision on a folder the scan would not list', async () => {
  const { root, ctx, source } = setup('collision-bare')
  // Un dossier sans SKILL.md : le balayage l'ignore, mais l'installation l'écraserait.
  await mkdir(join(root, '.claude/skills/alpha'), { recursive: true })
  await writeFile(join(root, '.claude/skills/alpha/notes.txt'), 'precious')
  const error = failure(await addSkills(ctx, source, ['alpha'], false))
  assert.deepEqual(error, { code: 'collision', folders: ['alpha'] })
  assert.equal(await readFile(join(root, '.claude/skills/alpha/notes.txt'), 'utf8'), 'precious')
})

test('replace trashes the existing copies before installing', async () => {
  const { root, lib, trash, ctx, source } = setup('replace')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha\ndescription: Old', 'Old content\n')
  success(await addSkills(ctx, source, ['alpha'], true))
  const old = join(root, '.claude/skills/alpha')
  assert.deepEqual(trash.trashed, [old])
  // L'ancien contenu est bien arrivé à la Corbeille avant l'installation.
  assert.match(await readFile(join(trash.moved.get(old)!, 'SKILL.md'), 'utf8'), /Old content/)
  assert.match(await skillText(root, '.claude/skills', 'alpha'), /Alpha v1/)
  assert.equal(lib.calls.install.length, 1)
})

test('replace trashes only the link of an external link, never its target', async () => {
  const { root, trash, ctx, source } = setup('replace-link')
  const outside = await outsideSkill('replace-link')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(outside, 'skills/alpha'), join(root, '.claude/skills/alpha'))
  assert.deepEqual(failure(await addSkills(ctx, source, ['alpha'], false)), { code: 'collision', folders: ['alpha'] })
  success(await addSkills(ctx, source, ['alpha'], true))
  assert.deepEqual(trash.trashed, [join(root, '.claude/skills/alpha')])
  assert.match(await readFile(join(outside, 'skills/alpha/SKILL.md'), 'utf8'), /Outside/)
})

test('replace without a trash is refused', async () => {
  const { root, lib, ctx, source } = setup('replace-no-trash')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha', 'Old content\n')
  const before = await hashOf(root, '.claude/skills', 'alpha')
  const error = failure(await addSkills({ ...ctx, trash: null }, source, ['alpha'], true))
  assert.equal(error.code, 'no-trash')
  assert.equal(await hashOf(root, '.claude/skills', 'alpha'), before)
  assert.equal(lib.calls.install.length, 0)
})

test('an install failing after the trash says so', async () => {
  const { root, lib, ctx, source } = setup('install-fails')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha', 'Old content\n')
  lib.failInstall = Object.assign(new Error('boom'), { code: 'SKILLS_NETWORK' })
  const error = failure(await addSkills(ctx, source, ['alpha'], true))
  assert.equal(error.code, 'lib')
  assert.equal(error.trashed, true)
  assert.deepEqual(error.diagnostics, [{ code: 'SKILLS_NETWORK', message: 'boom' }])
  assert.equal(await exists(join(root, '.claude/skills/alpha')), false)
})

test('an install failing before any trash does not claim a trash', async () => {
  const { lib, ctx, source } = setup('install-fails-clean')
  lib.failInstall = new Error('boom')
  const error = failure(await addSkills(ctx, source, ['alpha'], false))
  assert.equal(error.code, 'lib')
  assert.equal(error.trashed, undefined)
})

test('add stops on an unreadable lock before trashing anything', async () => {
  const { root, lib, trash, ctx, source } = setup('bad-lock')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha', 'Old content\n')
  await writeFile(join(root, 'skills-lock.json'), '{ not json')
  const before = await hashOf(root, '.claude/skills', 'alpha')
  const error = failure(await addSkills(ctx, source, ['alpha'], true))
  assert.equal(error.code, 'lib')
  assert.equal(error.diagnostics?.[0]?.code, 'SKILLS_INVALID_LOCAL_LOCK')
  assert.equal(error.trashed, undefined)
  assert.deepEqual(trash.trashed, [])
  assert.equal(lib.calls.install.length, 0)
  assert.equal(await hashOf(root, '.claude/skills', 'alpha'), before)
})

test('add with only copy-only dirs copies from the staging dir', async () => {
  const { root, lib, ctx, source } = setup('copy-only', ['.openclaude/skills'])
  const result = success(await addSkills(ctx, source, ['alpha', 'Beta Skill'], false))
  assert.equal(lib.calls.install.length, 0)
  assert.match(await skillText(root, '.openclaude/skills', 'alpha'), /Alpha v1/)
  assert.match(await skillText(root, '.openclaude/skills', 'beta-skill'), /Beta v1/)
  assert.deepEqual(result.warnings.map((warning) => warning.code), ['PLUGIN_NOT_TRACKED'])
  assert.equal(await exists(join(root, 'skills-lock.json')), false)
  // Le dossier d'essai ne laisse rien derrière lui.
  assert.deepEqual(await readdir(ctx.tmpdir), [])
})

test('add with no write dir is no-target', async () => {
  const { lib, ctx, source } = setup('no-target', [])
  assert.deepEqual(await addSkills(ctx, source, ['alpha'], false), { ok: false, error: { code: 'no-target' } })
  assert.equal(lib.calls.stage.length, 0)
})

test('add skips an unsafe write dir with a warning and writes nowhere outside', async () => {
  const { root, lib, ctx, source } = setup('add-unsafe', ['.agents/skills', '.claude/skills'])
  const outside = tempDir('ops-add-unsafe-outside')
  await mkdir(join(outside, 'skills'), { recursive: true })
  await symlink(outside, join(root, '.claude'))
  const result = success(await addSkills(ctx, source, ['alpha'], false))
  assert.deepEqual(result.warnings.map((warning) => warning.code), ['PLUGIN_UNSAFE_DIR'])
  assert.deepEqual(lib.calls.install[0]!.libAgents, ['universal'])
  assert.deepEqual(await readdir(join(outside, 'skills')), [])
  assert.equal(await exists(join(root, '.agents/skills/alpha')), true)
})

test('add refuses when every write dir is unsafe', async () => {
  const { root, lib, ctx, source } = setup('add-all-unsafe', ['.claude/skills'])
  const outside = tempDir('ops-add-all-unsafe-outside')
  await mkdir(join(outside, 'skills'), { recursive: true })
  await symlink(outside, join(root, '.claude'))
  assert.deepEqual(failure(await addSkills(ctx, source, ['alpha'], false)), { code: 'unsafe-dir', dirs: ['.claude/skills'] })
  assert.equal(lib.calls.install.length, 0)
})

test('add refuses a write dir behind a dangling link', async () => {
  const { root, lib, ctx, source } = setup('add-dangling', ['.claude/skills'])
  const outside = tempDir('ops-add-dangling-outside')
  // La cible du lien n'existe pas : le balayage ne voit rien, mais écrire dedans créerait des fichiers hors du projet.
  await symlink(join(outside, 'missing'), join(root, '.claude'))
  assert.deepEqual(failure(await addSkills(ctx, source, ['alpha'], false)), { code: 'unsafe-dir', dirs: ['.claude/skills'] })
  assert.equal(lib.calls.install.length, 0)
  assert.equal(await exists(join(outside, 'missing')), false)
})

test('propagate copies a skill into the target dir of each agent', async () => {
  const { root, lib, ctx } = setup('propagate')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha\ndescription: A', 'Alpha body\n')
  const result = success(await propagate(ctx, 'alpha', ['codex', 'opencode', 'grok']))
  assert.deepEqual(result.warnings, [])
  const reference = await hashOf(root, '.claude/skills', 'alpha')
  assert.equal(await hashOf(root, '.agents/skills', 'alpha'), reference)
  assert.equal(await hashOf(root, '.grok/skills', 'alpha'), reference)
  assert.equal(await exists(join(root, 'skills-lock.json')), false)
  assert.equal(lib.calls.install.length, 0)
  assert.equal(lib.calls.untrack.length, 0)
})

test('propagate skips a dir that already carries the skill and never overwrites it', async () => {
  const { root, trash, ctx } = setup('propagate-skip')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha', 'Claude version\n')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha', 'Agents version\n')
  const before = await hashOf(root, '.agents/skills', 'alpha')
  success(await propagate(ctx, 'alpha', ['codex', 'grok']))
  assert.equal(await hashOf(root, '.agents/skills', 'alpha'), before)
  assert.equal(await exists(join(root, '.grok/skills/alpha')), true)
  assert.deepEqual(trash.trashed, [])
})

test('propagate takes the target of a link when no real copy exists', async () => {
  const { root, ctx } = setup('propagate-link')
  const outside = await outsideSkill('propagate-link', 'From outside\n')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(outside, 'skills/alpha'), join(root, '.claude/skills/alpha'))
  success(await propagate(ctx, 'alpha', ['grok']))
  const copy = join(root, '.grok/skills/alpha')
  assert.equal((await lstat(copy)).isSymbolicLink(), false)
  assert.match(await readFile(join(copy, 'SKILL.md'), 'utf8'), /From outside/)
})

test('propagate never writes into an unsafe dir', async () => {
  const { root, ctx } = setup('propagate-unsafe')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  const outside = tempDir('ops-propagate-unsafe-outside')
  await mkdir(join(outside, 'skills'), { recursive: true })
  await symlink(outside, join(root, '.grok'))
  const result = success(await propagate(ctx, 'alpha', ['codex', 'grok']))
  assert.deepEqual(result.warnings.map((warning) => warning.code), ['PLUGIN_UNSAFE_DIR'])
  assert.deepEqual(await readdir(join(outside, 'skills')), [])
  assert.equal(await exists(join(root, '.agents/skills/alpha')), true)
  // Tous les dossiers visés sont dangereux : refus net.
  assert.deepEqual(failure(await propagate(ctx, 'alpha', ['grok'])), { code: 'unsafe-dir', dirs: ['.grok/skills'] })
})

test('propagate refuses an agent without a skills dir and a vanished skill', async () => {
  const { root, ctx } = setup('propagate-edge')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  assert.equal(failure(await propagate(ctx, 'alpha', ['aider'])).code, 'no-target')
  assert.equal(failure(await propagate(ctx, 'ghost', ['codex'])).code, 'gone')
})

test('keepVersion copies the chosen version over the others after trashing them', async () => {
  const { root, trash, ctx } = setup('keep')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha', 'v1\n')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha', 'v2\n')
  writeSkill(root, '.grok/skills', 'alpha', 'name: alpha', 'v2\n')
  const chosen = await hashOf(root, '.claude/skills', 'alpha')
  const result = success(await keepVersion(ctx, 'alpha', chosen))
  assert.deepEqual(result.lostAgents, [])
  assert.deepEqual(trash.trashed, [join(root, '.agents/skills/alpha')])
  assert.match(await readFile(join(trash.moved.get(join(root, '.agents/skills/alpha'))!, 'SKILL.md'), 'utf8'), /v1/)
  for (const dir of ['.agents/skills', '.claude/skills', '.grok/skills']) assert.equal(await hashOf(root, dir, 'alpha'), chosen, dir)
})

test('keepVersion leaves an external link untouched', async () => {
  const { root, trash, ctx } = setup('keep-link')
  const outside = await outsideSkill('keep-link', 'Linked\n')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha', 'v1\n')
  writeSkill(root, '.grok/skills', 'alpha', 'name: alpha', 'v2\n')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(outside, 'skills/alpha'), join(root, '.claude/skills/alpha'))
  success(await keepVersion(ctx, 'alpha', await hashOf(root, '.grok/skills', 'alpha')))
  assert.deepEqual(trash.trashed, [join(root, '.agents/skills/alpha')])
  assert.equal((await lstat(join(root, '.claude/skills/alpha'))).isSymbolicLink(), true)
  assert.match(await readFile(join(outside, 'skills/alpha/SKILL.md'), 'utf8'), /Linked/)
})

test('keepVersion refuses without a trash and on an unknown version', async () => {
  const { root, trash, ctx } = setup('keep-edge')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha', 'v1\n')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha', 'v2\n')
  const v2 = await hashOf(root, '.claude/skills', 'alpha')
  const before = await hashOf(root, '.agents/skills', 'alpha')
  assert.equal(failure(await keepVersion({ ...ctx, trash: null }, 'alpha', v2)).code, 'no-trash')
  assert.equal(failure(await keepVersion(ctx, 'alpha', 'f'.repeat(64))).code, 'gone')
  assert.equal(failure(await keepVersion(ctx, 'ghost', v2)).code, 'gone')
  assert.equal(await hashOf(root, '.agents/skills', 'alpha'), before)
  assert.deepEqual(trash.trashed, [])
})

test('removeSkill trashes every copy and untracks a locked skill', async () => {
  const { root, lib, trash, ctx } = setup('remove')
  for (const dir of ['.agents/skills', '.claude/skills', '.grok/skills']) writeSkill(root, dir, 'alpha', 'name: alpha')
  lib.lock.set('alpha', { source: 'owner/repo', libName: 'alpha' })
  const result = success(await removeSkill(ctx, 'alpha'))
  assert.deepEqual(result.warnings, [])
  assert.deepEqual(
    [...trash.trashed].sort(),
    ['.agents/skills', '.claude/skills', '.grok/skills'].map((dir) => join(root, dir, 'alpha')).sort()
  )
  assert.deepEqual(lib.calls.untrack, [
    { libNames: ['alpha'], cwd: root, libAgents: ['universal', 'claude-code', 'grok', 'kiro-cli', 'qoder', 'codebuddy', 'zcode', 'trae'] }
  ])
  assert.equal(lib.lock.has('alpha'), false)
})

test('removeSkill trashes a handwritten skill without calling untrack', async () => {
  const { root, lib, trash, ctx } = setup('remove-handwritten')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  success(await removeSkill(ctx, 'alpha'))
  assert.deepEqual(trash.trashed, [join(root, '.claude/skills/alpha')])
  assert.equal(lib.calls.untrack.length, 0)
})

test('removeSkill without a trash touches nothing', async () => {
  const { root, lib, ctx } = setup('remove-no-trash')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  lib.lock.set('alpha', { source: 'owner/repo', libName: 'alpha' })
  assert.equal(failure(await removeSkill({ ...ctx, trash: null }, 'alpha')).code, 'no-trash')
  assert.equal(await exists(join(root, '.claude/skills/alpha')), true)
  assert.equal(lib.calls.untrack.length, 0)
  assert.equal(failure(await removeSkill(ctx, 'ghost')).code, 'gone')
})

test('removeSkill trashes a link, never its external target', async () => {
  const { root, trash, ctx } = setup('remove-link')
  const outside = await outsideSkill('remove-link')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(outside, 'skills/alpha'), join(root, '.claude/skills/alpha'))
  success(await removeSkill(ctx, 'alpha'))
  assert.equal(trash.trashed.includes(join(root, '.claude/skills/alpha')), true)
  assert.equal(trash.trashed.some((path) => path.startsWith(outside)), false)
  assert.equal(await exists(join(root, '.claude/skills/alpha')), false)
  assert.match(await readFile(join(outside, 'skills/alpha/SKILL.md'), 'utf8'), /Outside/)
})

test('removeSkill trashes an internal link and its target', async () => {
  const { root, trash, ctx } = setup('remove-internal')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(root, '.agents/skills/alpha'), join(root, '.claude/skills/alpha'))
  success(await removeSkill(ctx, 'alpha'))
  assert.deepEqual(
    [...trash.trashed].sort(),
    [join(root, '.agents/skills/alpha'), join(root, '.claude/skills/alpha')].sort()
  )
  assert.equal(await exists(join(root, '.agents/skills/alpha')), false)
  assert.equal(await exists(join(root, '.claude/skills/alpha')), false)
})

test('remove skips untrack when .agents is unsafe', async () => {
  const { root, lib, trash, ctx } = setup('remove-unsafe')
  const outside = tempDir('ops-remove-unsafe-outside')
  writeSkill(outside, 'skills', 'alpha', 'name: alpha', 'Outside copy\n')
  await symlink(outside, join(root, '.agents'))
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  lib.lock.set('alpha', { source: 'owner/repo', libName: 'alpha' })
  const result = success(await removeSkill(ctx, 'alpha'))
  assert.deepEqual(result.warnings.map((warning) => warning.code), ['PLUGIN_UNSAFE_DIR'])
  assert.deepEqual(trash.trashed, [join(root, '.claude/skills/alpha')])
  assert.equal(lib.calls.untrack.length, 0)
  assert.equal(lib.lock.has('alpha'), true)
  assert.match(await readFile(join(outside, 'skills/alpha/SKILL.md'), 'utf8'), /Outside copy/)
})

test('remove passes only the agents of safe dirs to untrack', async () => {
  const { root, lib, ctx } = setup('remove-partial-unsafe')
  const outside = tempDir('ops-remove-partial-outside')
  await mkdir(join(outside, 'skills'), { recursive: true })
  await symlink(outside, join(root, '.grok'))
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  lib.lock.set('alpha', { source: 'owner/repo', libName: 'alpha' })
  success(await removeSkill(ctx, 'alpha'))
  assert.equal(lib.calls.untrack[0]!.libAgents.includes('grok'), false)
  assert.equal(lib.calls.untrack[0]!.libAgents.includes('universal'), true)
})

test('remove reports a trash failure without untracking', async () => {
  const { root, lib, trash, ctx } = setup('remove-trash-fails')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  lib.lock.set('alpha', { source: 'owner/repo', libName: 'alpha' })
  trash.failWith = new Error('trash broke')
  const error = failure(await removeSkill(ctx, 'alpha'))
  assert.equal(error.code, 'lib')
  assert.equal(error.diagnostics?.[0]?.message, 'trash broke')
  assert.equal(error.trashed, undefined)
  assert.equal(lib.calls.untrack.length, 0)
  assert.equal(await exists(join(root, '.claude/skills/alpha')), true)
})

test('removeFromDir reports the agents that lost the skill', async () => {
  const { root, lib, trash, ctx } = setup('remove-from-dir')
  for (const dir of ['.agents/skills', '.claude/skills', '.grok/skills']) writeSkill(root, dir, 'alpha', 'name: alpha')
  const result = success(await removeFromDir(ctx, 'alpha', '.grok/skills'))
  assert.deepEqual(result.lostAgents, ['grok'])
  assert.deepEqual(trash.trashed, [join(root, '.grok/skills/alpha')])
  assert.equal(await exists(join(root, '.agents/skills/alpha')), true)
  assert.equal(lib.calls.untrack.length, 0)
})

test('removeFromDir lists every agent that read only that dir', async () => {
  const { root, ctx } = setup('remove-from-dir-many')
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha')
  // `.agents` est lu par codex, opencode, pi, antigravity, dsh ; opencode lit aussi `.claude` et reste servi.
  const result = success(await removeFromDir(ctx, 'alpha', '.agents/skills'))
  assert.deepEqual(result.lostAgents, ['codex', 'pi', 'antigravity', 'dsh'])
})

test('removeFromDir refuses a dir another copy links to', async () => {
  const { root, trash, ctx } = setup('remove-from-dir-linked')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(root, '.agents/skills/alpha'), join(root, '.claude/skills/alpha'))
  const error = failure(await removeFromDir(ctx, 'alpha', '.agents/skills'))
  assert.deepEqual(error, { code: 'linked-target', dirs: ['.claude/skills'] })
  assert.deepEqual(trash.trashed, [])
  assert.equal(await exists(join(root, '.agents/skills/alpha')), true)
})

test('removeFromDir trashes a link itself, never its external target', async () => {
  const { root, trash, ctx } = setup('remove-from-dir-link')
  const outside = await outsideSkill('remove-from-dir-link')
  writeSkill(root, '.agents/skills', 'alpha', 'name: alpha')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(outside, 'skills/alpha'), join(root, '.claude/skills/alpha'))
  success(await removeFromDir(ctx, 'alpha', '.claude/skills'))
  assert.deepEqual(trash.trashed, [join(root, '.claude/skills/alpha')])
  assert.match(await readFile(join(outside, 'skills/alpha/SKILL.md'), 'utf8'), /Outside/)
})

test('removeFromDir refuses an unsafe dir, a missing copy and a missing trash', async () => {
  const { root, trash, ctx } = setup('remove-from-dir-edge')
  const outside = tempDir('ops-remove-from-dir-outside')
  writeSkill(outside, 'skills', 'alpha', 'name: alpha')
  await symlink(outside, join(root, '.grok'))
  writeSkill(root, '.claude/skills', 'alpha', 'name: alpha')
  assert.deepEqual(failure(await removeFromDir(ctx, 'alpha', '.grok/skills')), { code: 'unsafe-dir', dirs: ['.grok/skills'] })
  assert.equal(failure(await removeFromDir(ctx, 'alpha', '.agents/skills')).code, 'gone')
  assert.equal(failure(await removeFromDir({ ...ctx, trash: null }, 'alpha', '.claude/skills')).code, 'no-trash')
  assert.deepEqual(trash.trashed, [])
  assert.equal(await exists(join(outside, 'skills/alpha/SKILL.md')), true)
})
