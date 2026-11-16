// Adaptateur de la bibliothèque `skills` : tests de la vraie bibliothèque, sources locales et projets temporaires seulement.
import { lstat, mkdir, readdir, readFile, rename, symlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import * as skills from 'skills'
import { createSkillsLib, toLibDiagnostic, type LibDiagnostic } from './skills-lib'
import { tempDir } from './test-fixtures'

/** La vraie bibliothèque, injectée : un fichier de test peut importer `skills`, le module de production non. */
const realSkillsLib = createSkillsLib(skills)

const MULTI = fileURLToPath(new URL('./testdata/sources/multi', import.meta.url))
const DUP = fileURLToPath(new URL('./testdata/sources/dup', import.meta.url))
const LIB_AGENTS = ['universal', 'claude-code', 'grok']

const isDir = async (path: string) => (await lstat(path).catch(() => null))?.isDirectory() === true
const exists = async (path: string) => (await lstat(path).catch(() => null)) !== null

/** Installe `alpha` depuis la source locale dans un projet temporaire. */
async function installAlpha(cwd: string, libAgents: readonly string[] = LIB_AGENTS) {
  const source = await realSkillsLib.resolve(MULTI, cwd)
  try {
    return await realSkillsLib.install(source, { cwd, names: ['alpha'], libAgents, onWarning: () => {} })
  } finally {
    await source.dispose()
  }
}

/** Clés du lock lues sur le disque : `lockEntries` ne voit que les skills encore présentes, pas les entrées orphelines. */
async function rawLockKeys(cwd: string): Promise<string[]> {
  const raw = await readFile(join(cwd, 'skills-lock.json'), 'utf8').catch(() => null)
  return raw === null ? [] : Object.keys(JSON.parse(raw).skills)
}

/** Prédicat pour `assert.rejects` : l'erreur est un diagnostic de ce code. */
const hasDiagnosticCode = (code: string) => (error: unknown) => toLibDiagnostic(error).code === code

test('resolves a local folder with several skills', async () => {
  const cwd = tempDir('lib-resolve')
  const source = await realSkillsLib.resolve(MULTI, cwd)
  try {
    assert.equal(source.type, 'local')
    assert.equal(source.input, MULTI)
    assert.equal(source.url, MULTI)
    assert.deepEqual(
      source.skills.map((skill) => skill.name).sort(),
      ['Beta Skill', 'alpha'],
    )
    assert.equal(source.skills.find((skill) => skill.name === 'alpha')?.description, 'First test skill')
  } finally {
    await source.dispose()
  }
})

test('stage reveals the sanitized folder names', async () => {
  const cwd = tempDir('lib-stage')
  const staging = tempDir('lib-stage-root')
  const source = await realSkillsLib.resolve(MULTI, cwd)
  try {
    const { staged, dispose } = await realSkillsLib.stage(source, ['alpha', 'Beta Skill'], staging)
    try {
      const byName = new Map(staged.map((entry) => [entry.name, entry.folder]))
      assert.equal(byName.get('alpha'), 'alpha')
      assert.equal(byName.get('Beta Skill'), 'beta-skill')
      assert.equal(staged.length, 2)
    } finally {
      await dispose()
    }
    // Rien n'a été écrit dans le projet de l'utilisateur.
    assert.equal(await exists(join(cwd, '.agents')), false)
    assert.equal(await exists(join(cwd, 'skills-lock.json')), false)
  } finally {
    await source.dispose()
  }
})

test('install copies into the requested dirs and writes the lock', async () => {
  const cwd = tempDir('lib-install')
  const result = await installAlpha(cwd)
  assert.deepEqual(result.failed, [])
  for (const dir of ['.agents/skills/alpha', '.claude/skills/alpha', '.grok/skills/alpha']) {
    const path = join(cwd, dir)
    const stat = await lstat(path)
    assert.equal(stat.isDirectory() && !stat.isSymbolicLink(), true, `${dir} is a real directory`)
    assert.match(await readFile(join(path, 'SKILL.md'), 'utf8'), /Alpha body/)
  }
  const entry = (await realSkillsLib.lockEntries(cwd)).get('alpha')
  assert.equal(entry?.source, MULTI)
  assert.equal(entry?.libName, 'alpha')
})

test('untrack clears the lock entry once the copies are gone', async () => {
  const cwd = tempDir('lib-untrack')
  const bin = tempDir('lib-untrack-bin')
  await installAlpha(cwd)
  assert.equal((await realSkillsLib.lockEntries(cwd)).has('alpha'), true)
  // Simule la Corbeille : les trois copies quittent le projet avant `untrack`.
  await rename(join(cwd, '.agents/skills/alpha'), join(bin, 'universal'))
  await rename(join(cwd, '.claude/skills/alpha'), join(bin, 'claude'))
  await rename(join(cwd, '.grok/skills/alpha'), join(bin, 'grok'))
  const result = await realSkillsLib.untrack(['alpha'], cwd, LIB_AGENTS)
  assert.deepEqual(result.failed, [])
  assert.equal((await realSkillsLib.lockEntries(cwd)).has('alpha'), false)
  assert.equal((await rawLockKeys(cwd)).includes('alpha'), false, 'no orphan entry left in the lock file')
})

test('untrack leaves a same-named folder in an unmanaged dir alone', async () => {
  const cwd = tempDir('lib-unmanaged')
  const bin = tempDir('lib-unmanaged-bin')
  await installAlpha(cwd)
  const vibe = join(cwd, '.vibe/skills/alpha')
  await mkdir(vibe, { recursive: true })
  await writeFile(join(vibe, 'SKILL.md'), '---\nname: alpha\ndescription: by hand\n---\nMine\n')
  await rename(join(cwd, '.agents/skills/alpha'), join(bin, 'universal'))
  await rename(join(cwd, '.claude/skills/alpha'), join(bin, 'claude'))
  await rename(join(cwd, '.grok/skills/alpha'), join(bin, 'grok'))
  const result = await realSkillsLib.untrack(['alpha'], cwd, LIB_AGENTS)
  assert.equal(await isDir(vibe), true, 'the unmanaged copy survives')
  assert.match(await readFile(join(vibe, 'SKILL.md'), 'utf8'), /Mine/)
  // Le lock est soit nettoyé, soit signalé : jamais silencieusement incohérent.
  const kept = (await rawLockKeys(cwd)).includes('alpha')
  if (kept) assert.equal(result.failed.some((failure) => failure.code === 'PLUGIN_LOCK_KEPT'), true)
  else assert.deepEqual(result.failed, [])
})

test('untrack never touches a managed dir that links outside the project', async () => {
  const cwd = tempDir('lib-outside')
  const outside = tempDir('lib-outside-target')
  await installAlpha(cwd, ['universal'])
  // `.claude` pointe hors du projet et contient une copie : elle ne doit jamais être effacée.
  await mkdir(join(outside, '.claude/alpha'), { recursive: true })
  await writeFile(join(outside, '.claude/alpha/SKILL.md'), '---\nname: alpha\ndescription: outside\n---\nOutside\n')
  await symlink(join(outside, '.claude'), join(cwd, '.claude'))
  await realSkillsLib.untrack(['alpha'], cwd, ['universal'])
  assert.match(await readFile(join(outside, '.claude/alpha/SKILL.md'), 'utf8'), /Outside/)
  assert.deepEqual(await readdir(join(outside, '.claude')), ['alpha'])
})

test('a corrupt lock is reported as SKILLS_INVALID_LOCAL_LOCK', async () => {
  const cwd = tempDir('lib-corrupt')
  await writeFile(join(cwd, 'skills-lock.json'), '{oops')
  await assert.rejects(realSkillsLib.lockEntries(cwd), hasDiagnosticCode('SKILLS_INVALID_LOCAL_LOCK'))
  // Un JSON valide mais sans objet `skills` est refusé aussi.
  await writeFile(join(cwd, 'skills-lock.json'), '{"version":1}')
  await assert.rejects(realSkillsLib.lockEntries(cwd), hasDiagnosticCode('SKILLS_INVALID_LOCAL_LOCK'))
})

test('an absent lock gives an empty map', async () => {
  const cwd = tempDir('lib-nolock')
  assert.equal((await realSkillsLib.lockEntries(cwd)).size, 0)
})

test('duplicate names are refused before writing', async () => {
  const cwd = tempDir('lib-dup')
  const source = await realSkillsLib.resolve(DUP, cwd)
  try {
    await assert.rejects(
      realSkillsLib.install(source, { cwd, names: ['twin'], libAgents: ['universal'], onWarning: () => {} }),
      hasDiagnosticCode('SKILLS_DUPLICATE_SKILL_NAME'),
    )
    assert.equal(await exists(join(cwd, '.agents')), false)
    assert.equal(await exists(join(cwd, 'skills-lock.json')), false)
  } finally {
    await source.dispose()
  }
})

test('a missing local path is a SKILLS_LOCAL_PATH_NOT_FOUND diagnostic', async () => {
  const cwd = tempDir('lib-missing')
  let caught: unknown
  try {
    await realSkillsLib.resolve(join(cwd, 'nope'), cwd)
  } catch (error) {
    caught = error
  }
  const diagnostic: LibDiagnostic = toLibDiagnostic(caught)
  assert.equal(diagnostic.code, 'SKILLS_LOCAL_PATH_NOT_FOUND')
  assert.notEqual(diagnostic.message, '')
})

test('toLibDiagnostic keeps SKILLS_ codes and degrades anything else to UNKNOWN', () => {
  const coded = Object.assign(new Error('boom'), { code: 'SKILLS_NO_VALID_SKILLS' })
  assert.deepEqual(toLibDiagnostic(coded), { code: 'SKILLS_NO_VALID_SKILLS', message: 'boom' })
  assert.deepEqual(toLibDiagnostic(Object.assign(new Error('fs'), { code: 'ENOENT' })), { code: 'UNKNOWN', message: 'fs' })
  assert.deepEqual(toLibDiagnostic(new Error('plain')), { code: 'UNKNOWN', message: 'plain' })
  assert.deepEqual(toLibDiagnostic('text'), { code: 'UNKNOWN', message: 'text' })
})
