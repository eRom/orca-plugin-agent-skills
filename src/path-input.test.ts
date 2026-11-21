// Reconnaissance d'un chemin tapé : formes POSIX partout, formes Windows seulement sous Windows.
import { assert, test } from 'orca/testing'
import { isPathInput } from './path-input'

test('on win32, recognises Windows and POSIX path forms', () => {
  for (const text of ['C:\\x', 'C:/x', '\\\\srv\\share', '.\\x', '..\\x', '~\\x', '~/x', '~', './x', '/x']) {
    assert.equal(isPathInput(text, 'win32'), true, text)
  }
})

test('on win32, owner/repo sources and half-typed drives stay search text', () => {
  for (const text of ['owner/repo', 'C:', 'C:skills', '~user']) assert.equal(isPathInput(text, 'win32'), false, text)
})

test('on darwin, Windows forms are not paths and POSIX forms are unchanged', () => {
  for (const text of ['C:\\x', '.\\x', '\\\\srv\\share', '~\\x']) assert.equal(isPathInput(text, 'darwin'), false, text)
  for (const text of ['/x', '~', '~/x', './x', '../x']) assert.equal(isPathInput(text, 'darwin'), true, text)
  for (const text of ['owner/repo', 'motion', '~x', '']) assert.equal(isPathInput(text, 'darwin'), false, text)
})

test("the panel's pre-state value 'posix' accepts POSIX forms only", () => {
  for (const text of ['/x', '~', '~/x', './x', '../x']) assert.equal(isPathInput(text, 'posix'), true, text)
  for (const text of ['C:\\x', '.\\x', 'owner/repo']) assert.equal(isPathInput(text, 'posix'), false, text)
})
