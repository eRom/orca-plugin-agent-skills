// Chemins saisis : reconnaissance, résolution, abréviation du home, appartenance à un dossier.
import { win32 } from 'node:path'
import { assert, test } from 'orca/testing'
import { abbreviateHome, isInside, isNetworkPath, isPathInput, resolveInputPath } from './paths'

const HOME = '/Users/me'

test('recognises typed paths', () => {
  for (const text of ['/x', '~', '~/x', './x', '../x']) assert.equal(isPathInput(text, 'darwin'), true, text)
  for (const text of ['owner/repo', 'motion', '~x', '']) assert.equal(isPathInput(text, 'darwin'), false, text)
})

test('resolves Windows typed paths with the win32 path API', () => {
  assert.equal(resolveInputPath('~\\src', 'C:\\p', 'C:\\Users\\r', win32), 'C:\\Users\\r\\src')
  assert.equal(resolveInputPath('~/src', 'C:\\p', 'C:\\Users\\r', win32), 'C:\\Users\\r\\src')
  assert.equal(resolveInputPath('~', 'C:\\p', 'C:\\Users\\r', win32), 'C:\\Users\\r')
  assert.equal(resolveInputPath('.\\src', 'C:\\p', 'C:\\Users\\r', win32), 'C:\\p\\src')
  assert.equal(resolveInputPath('D:\\x\\', 'C:\\p', 'C:\\Users\\r', win32), 'D:\\x')
})

test('abbreviates the Windows home dir, whatever the case of the drive letter', () => {
  assert.equal(abbreviateHome('C:\\Users\\r\\x', 'C:\\Users\\r', win32), '~\\x')
  assert.equal(abbreviateHome('c:\\Users\\r\\x', 'C:\\Users\\r', win32), '~\\x')
  assert.equal(abbreviateHome('C:\\Users\\r', 'C:\\Users\\r', win32), '~')
  assert.equal(abbreviateHome('C:\\Users\\rob\\x', 'C:\\Users\\r', win32), 'C:\\Users\\rob\\x')
})

test('a network path is a UNC path, and only on Windows', () => {
  assert.equal(isNetworkPath('\\\\wsl.localhost\\U\\p', 'win32'), true)
  assert.equal(isNetworkPath('\\\\wsl.localhost\\U\\p', 'linux'), false)
  assert.equal(isNetworkPath('C:\\x', 'win32'), false)
})

test('resolves typed paths', () => {
  assert.equal(resolveInputPath('~/dev/a/', '/p', HOME), '/Users/me/dev/a')
  assert.equal(resolveInputPath('~', '/p', HOME), '/Users/me')
  assert.equal(resolveInputPath('./s', '/p', HOME), '/p/s')
  assert.equal(resolveInputPath('../s', '/p/q', HOME), '/p/s')
  assert.equal(resolveInputPath('/abs/x/', '/p', HOME), '/abs/x')
})

test('abbreviates the home dir only on a path boundary', () => {
  assert.equal(abbreviateHome('/Users/me/dev/x', HOME), '~/dev/x')
  assert.equal(abbreviateHome('/Users/me', HOME), '~')
  assert.equal(abbreviateHome('/Users/meow/x', HOME), '/Users/meow/x')
  assert.equal(abbreviateHome('/users/me/x', HOME), '/users/me/x', 'POSIX paths stay case-sensitive')
})

test('isInside respects path boundaries', () => {
  assert.equal(isInside('/a/b', '/a'), true)
  assert.equal(isInside('/ab', '/a'), false)
  assert.equal(isInside('/a', '/a'), true)
  assert.equal(isInside('/a/..b', '/a'), true)
  assert.equal(isInside('/', '/a'), false)
})
