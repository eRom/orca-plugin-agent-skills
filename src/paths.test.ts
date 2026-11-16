// Chemins saisis : reconnaissance, résolution, abréviation du home, appartenance à un dossier.
import { assert, test } from 'orca/testing'
import { abbreviateHome, isInside, isPathInput, resolveInputPath } from './paths'

const HOME = '/Users/me'

test('recognises typed paths', () => {
  for (const text of ['/x', '~', '~/x', './x', '../x']) assert.equal(isPathInput(text), true, text)
  for (const text of ['owner/repo', 'motion', '~x', '']) assert.equal(isPathInput(text), false, text)
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
})

test('isInside respects path boundaries', () => {
  assert.equal(isInside('/a/b', '/a'), true)
  assert.equal(isInside('/ab', '/a'), false)
  assert.equal(isInside('/a', '/a'), true)
  assert.equal(isInside('/a/..b', '/a'), true)
  assert.equal(isInside('/', '/a'), false)
})
