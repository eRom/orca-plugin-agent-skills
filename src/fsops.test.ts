// Opérations disque : empreinte de contenu et copie réelle. Tout se passe dans des dossiers temporaires.
import { lstat, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { contentHash, copySkill } from './fsops'
import { tempDir, writeSkill } from './test-fixtures'

/** Prédicat pour `assert.rejects` : l'erreur porte ce `code` système. */
const hasCode = (code: string) => (error: unknown) => (error as NodeJS.ErrnoException).code === code

test('hash is equal for equal trees and ignores .DS_Store', async () => {
  const root = tempDir('hash-equal')
  const a = writeSkill(root, 'one', 'x', 'name: x', 'Same\n')
  const b = writeSkill(root, 'two', 'x', 'name: x', 'Same\n')
  await writeFile(join(a, '.DS_Store'), 'noise')
  await mkdir(join(b, 'sub'))
  await mkdir(join(a, 'sub'))
  await writeFile(join(a, 'sub', '.DS_Store'), 'other noise')
  assert.equal(await contentHash(a), await contentHash(b))
  assert.match(await contentHash(a), /^[0-9a-f]{64}$/)
})

test('hash changes when one byte changes', async () => {
  const root = tempDir('hash-change')
  const a = writeSkill(root, 'one', 'x', 'name: x', 'Body A\n')
  const b = writeSkill(root, 'two', 'x', 'name: x', 'Body B\n')
  assert.notEqual(await contentHash(a), await contentHash(b))
  const before = await contentHash(a)
  await writeFile(join(a, 'extra.md'), 'new file')
  assert.notEqual(await contentHash(a), before, 'an added file changes the hash')
})

test('hash survives a symlink cycle inside a skill', async () => {
  const root = tempDir('hash-cycle')
  const skill = writeSkill(root, 'one', 'x')
  await symlink('.', join(skill, 'loop'))
  const hash = await contentHash(skill)
  assert.match(hash, /^[0-9a-f]{64}$/)
  assert.equal(await contentHash(skill), hash, 'stable on a second pass')
})

test('hash stops at depth 24 on a deep tree', async () => {
  const root = tempDir('hash-deep')
  const skill = writeSkill(root, 'one', 'x')
  const deep = Array.from({ length: 40 }, () => 'd')
  await mkdir(join(skill, ...deep), { recursive: true })
  await writeFile(join(skill, ...deep, 'leaf.txt'), 'too deep to count')
  const reference = tempDir('hash-deep-ref')
  const shallow = writeSkill(reference, 'one', 'x')
  await mkdir(join(shallow, ...deep.slice(0, 24)), { recursive: true })
  assert.equal(await contentHash(skill), await contentHash(shallow))
})

test('copySkill writes a real directory even from a link', async () => {
  const root = tempDir('copy-link')
  const source = writeSkill(root, 'lib', 'x', 'name: x', 'Hello\n')
  await mkdir(join(source, 'scripts'))
  await writeFile(join(source, 'scripts', 'run.sh'), 'echo hi\n')
  await mkdir(join(root, 'links'))
  const link = join(root, 'links', 'x')
  await symlink(source, link)
  const target = join(root, 'out', '.claude', 'skills', 'x')
  await copySkill(link, target)
  assert.equal((await lstat(target)).isSymbolicLink(), false)
  assert.equal((await lstat(target)).isDirectory(), true)
  assert.equal(await readFile(join(target, 'scripts', 'run.sh'), 'utf8'), 'echo hi\n')
  assert.equal(await contentHash(target), await contentHash(source))
})

test('copySkill never creates symlinks and skips links that leave the skill', async () => {
  const root = tempDir('copy-nested')
  const source = writeSkill(root, 'lib', 'x', 'name: x', 'Hello\n')
  const outside = join(root, 'outside.txt')
  await writeFile(outside, 'secret')
  await writeFile(join(source, 'real.txt'), 'inside')
  await symlink('real.txt', join(source, 'alias.txt'))
  await symlink(outside, join(source, 'escape.txt'))
  await symlink('.', join(source, 'loop'))
  const target = join(root, 'out', 'x')
  await copySkill(source, target)
  assert.equal((await lstat(join(target, 'alias.txt'))).isSymbolicLink(), false)
  assert.equal(await readFile(join(target, 'alias.txt'), 'utf8'), 'inside')
  await assert.rejects(lstat(join(target, 'escape.txt')), hasCode('ENOENT'))
  await assert.rejects(lstat(join(target, 'loop')), hasCode('ENOENT'))
})

test('copySkill refuses an existing destination', async () => {
  const root = tempDir('copy-exists')
  const source = writeSkill(root, 'lib', 'x')
  const target = writeSkill(root, 'out', 'x', 'name: precious', 'Do not touch\n')
  await assert.rejects(copySkill(source, target), hasCode('EEXIST'))
  assert.match(await readFile(join(target, 'SKILL.md'), 'utf8'), /precious/)
  const dangling = join(root, 'out', 'dangling')
  await symlink(join(root, 'nowhere'), dangling)
  await assert.rejects(copySkill(source, dangling), hasCode('EEXIST'))
})
