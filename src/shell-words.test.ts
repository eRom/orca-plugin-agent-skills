// Quoting des lignes de commande shell : repris des tests de launch d'agent-profiles.
import { assert, test } from 'orca/testing'
import { shellQuote } from './shell-words'

test('shellQuote keeps a value with metacharacters as one word', () => {
  assert.equal(shellQuote('plain'), "'plain'")
  assert.equal(shellQuote('[1m]'), "'[1m]'")
  assert.equal(shellQuote("it's a [1m]"), `'it'\\''s a [1m]'`)
})
