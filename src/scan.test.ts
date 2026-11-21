// Balayage des dossiers gérés : tout se passe dans des projets temporaires.
import { chmod, mkdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { contentHash } from './fsops'
import { scanWorkspace } from './scan'
import { tempDir, writeSkill } from './test-fixtures'

test('lists handwritten skills with their front matter', async () => {
  const root = tempDir('scan-basic')
  writeSkill(root, '.claude/skills', 'beta', 'name: Beta Skill\ndescription: Does beta')
  writeSkill(root, '.claude/skills', 'alpha', 'description: Only a description')
  const { skills, unsafeDirs } = await scanWorkspace(root)
  assert.deepEqual(unsafeDirs, [])
  assert.deepEqual(
    skills.map((skill) => [skill.folder, skill.displayName, skill.description]),
    [
      ['alpha', 'alpha', 'Only a description'],
      ['beta', 'Beta Skill', 'Does beta']
    ]
  )
  const [alpha] = skills
  assert.equal(alpha!.copies.length, 1)
  assert.equal(alpha!.copies[0]!.dir, '.claude/skills')
  assert.equal(alpha!.copies[0]!.kind, 'dir')
  assert.equal(alpha!.copies[0]!.path, join(root, '.claude/skills', 'alpha'))
  assert.match(alpha!.copies[0]!.hash, /^[0-9a-f]{64}$/)
})

test('works on a project with no managed dir at all', async () => {
  const root = tempDir('scan-empty')
  assert.deepEqual(await scanWorkspace(root), { skills: [], unsafeDirs: [] })
})

test('merges copies of one folder across dirs', async () => {
  const root = tempDir('scan-merge')
  writeSkill(root, '.agents/skills', 'x', 'name: x\ndescription: Same', 'Same\n')
  writeSkill(root, '.claude/skills', 'x', 'name: x\ndescription: Same', 'Same\n')
  const { skills } = await scanWorkspace(root)
  assert.equal(skills.length, 1)
  assert.deepEqual(
    skills[0]!.copies.map((copy) => copy.dir),
    ['.agents/skills', '.claude/skills']
  )
  assert.equal(skills[0]!.copies[0]!.hash, skills[0]!.copies[1]!.hash)
})

test('keeps different hashes when copies of one folder differ', async () => {
  const root = tempDir('scan-diverge')
  writeSkill(root, '.agents/skills', 'x', 'name: x', 'Version A\n')
  writeSkill(root, '.claude/skills', 'x', 'name: x', 'Version B\n')
  const { skills } = await scanWorkspace(root)
  assert.equal(skills.length, 1)
  assert.notEqual(skills[0]!.copies[0]!.hash, skills[0]!.copies[1]!.hash)
})

test('reads the nested two-level managed dir', async () => {
  const root = tempDir('scan-prime')
  writeSkill(root, '.prime/agent/skills', 'deep')
  const { skills } = await scanWorkspace(root)
  assert.deepEqual(
    skills.map((skill) => [skill.folder, skill.copies[0]!.dir]),
    [['deep', '.prime/agent/skills']]
  )
})

test('ignores the root skills dir', async () => {
  const root = tempDir('scan-root-skills')
  writeSkill(root, 'skills', 'x')
  const { skills, unsafeDirs } = await scanWorkspace(root)
  assert.deepEqual(skills, [])
  assert.deepEqual(unsafeDirs, [])
})

test('ignores entries without SKILL.md and .DS_Store', async () => {
  const root = tempDir('scan-noise')
  writeSkill(root, '.claude/skills', 'real')
  await mkdir(join(root, '.claude/skills', 'empty'))
  await writeFile(join(root, '.claude/skills', 'stray.md'), 'not a skill')
  await writeFile(join(root, '.claude/skills', '.DS_Store'), 'noise')
  const { skills } = await scanWorkspace(root)
  assert.deepEqual(
    skills.map((skill) => skill.folder),
    ['real']
  )
})

test('flags a managed dir that resolves outside the project', async () => {
  const root = tempDir('scan-unsafe-root')
  const outside = tempDir('scan-unsafe-outside')
  writeSkill(outside, '.claude/skills', 'leaked')
  await symlink(join(outside, '.claude'), join(root, '.claude'))
  writeSkill(root, '.agents/skills', 'kept')
  const { skills, unsafeDirs } = await scanWorkspace(root)
  assert.deepEqual(unsafeDirs, ['.claude/skills'])
  assert.deepEqual(
    skills.map((skill) => skill.folder),
    ['kept']
  )
})

test('does not flag dirs when the root itself is reached through a symlink', async () => {
  const parent = tempDir('scan-root-link')
  const real = join(parent, 'my project')
  await mkdir(real)
  writeSkill(real, '.claude/skills', 'x')
  const viaLink = join(parent, 'link to project')
  await symlink(real, viaLink)
  for (const root of [real, viaLink]) {
    const { skills, unsafeDirs } = await scanWorkspace(root)
    assert.deepEqual(unsafeDirs, [], root)
    assert.deepEqual(
      skills.map((skill) => skill.folder),
      ['x'],
      root
    )
  }
})

test('classifies internal and external links', async () => {
  const root = tempDir('scan-links')
  const outside = tempDir('scan-links-outside')
  const target = writeSkill(root, '.agents/skills', 'x')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink('../../.agents/skills/x', join(root, '.claude/skills/x'))
  const foreign = writeSkill(outside, 'lib', 'y')
  await symlink(foreign, join(root, '.claude/skills/y'))
  const { skills } = await scanWorkspace(root)
  assert.deepEqual(
    skills.map((skill) => skill.folder),
    ['x', 'y']
  )
  const x = skills.find((skill) => skill.folder === 'x')!
  assert.deepEqual(
    x.copies.map((copy) => [copy.dir, copy.kind]),
    [
      ['.agents/skills', 'dir'],
      ['.claude/skills', 'internal-link']
    ]
  )
  const hash = await contentHash(target)
  assert.ok(x.copies.every((copy) => copy.hash === hash))
  const link = x.copies[1]!
  assert.equal(link.path, join(root, '.claude/skills/x'))
  assert.equal(link.realPath, await realpath(target))
  const y = skills.find((skill) => skill.folder === 'y')!
  assert.equal(y.copies[0]!.kind, 'external-link')
})

test('a link into the project outside managed dirs is external', async () => {
  const root = tempDir('scan-published')
  writeSkill(root, 'skills', 'x')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink('../../skills/x', join(root, '.claude/skills/x'))
  const { skills } = await scanWorkspace(root)
  assert.equal(skills.length, 1)
  assert.equal(skills[0]!.copies[0]!.kind, 'external-link')
})

test('a link named differently from its managed target is external', async () => {
  const root = tempDir('scan-renamed')
  writeSkill(root, '.agents/skills', 'y')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink('../../.agents/skills/y', join(root, '.claude/skills/x'))
  const { skills } = await scanWorkspace(root)
  const x = skills.find((skill) => skill.folder === 'x')!
  assert.equal(x.copies[0]!.kind, 'external-link')
})

test('skips a broken link', async () => {
  const root = tempDir('scan-broken')
  await mkdir(join(root, '.claude/skills'), { recursive: true })
  await symlink(join(root, 'nowhere'), join(root, '.claude/skills/ghost'))
  writeSkill(root, '.claude/skills', 'alive')
  const { skills } = await scanWorkspace(root)
  assert.deepEqual(
    skills.map((skill) => skill.folder),
    ['alive']
  )
})

test('flags a managed dir aliased to the published skills dir of the project', async () => {
  const root = tempDir('scan-alias-published')
  writeSkill(root, 'skills', 'x')
  await mkdir(join(root, '.claude'))
  await symlink('../skills', join(root, '.claude/skills'))
  const { skills, unsafeDirs } = await scanWorkspace(root)
  assert.deepEqual(unsafeDirs, ['.claude/skills'])
  assert.deepEqual(skills, [])
})

test('flags a managed dir aliased to another managed dir, without doubling skills', async () => {
  const root = tempDir('scan-alias-managed')
  writeSkill(root, '.agents/skills', 'x')
  await mkdir(join(root, '.claude'))
  await symlink('../.agents/skills', join(root, '.claude/skills'))
  const { skills, unsafeDirs } = await scanWorkspace(root)
  assert.deepEqual(unsafeDirs, ['.claude/skills'])
  assert.equal(skills.length, 1)
  assert.deepEqual(
    skills[0]!.copies.map((copy) => copy.dir),
    ['.agents/skills']
  )
})

test('flags a managed dir whose parent dir is a link inside the project', async () => {
  const root = tempDir('scan-alias-parent')
  writeSkill(root, 'shared/skills', 'x')
  await symlink('shared', join(root, '.claude'))
  const { skills, unsafeDirs } = await scanWorkspace(root)
  assert.deepEqual(unsafeDirs, ['.claude/skills'])
  assert.deepEqual(skills, [])
})

test('skips an entry that cannot be read and keeps listing the others', async () => {
  // Sous Windows, `chmod 0o000` ne retire pas le droit de lecture : l'entrée resterait lisible.
  if (process.platform === 'win32') return
  const root = tempDir('scan-unreadable')
  writeSkill(root, '.claude/skills', 'good')
  const locked = writeSkill(root, '.claude/skills', 'locked')
  writeSkill(root, '.claude/skills', 'also-good')
  const skillFile = join(locked, 'SKILL.md')
  await chmod(skillFile, 0o000)
  try {
    const { skills } = await scanWorkspace(root)
    assert.deepEqual(
      skills.map((skill) => skill.folder),
      ['also-good', 'good']
    )
  } finally {
    await chmod(skillFile, 0o644)
  }
})
