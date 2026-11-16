// Découpage et quoting des lignes de commande shell : reprises des tests de launch d'agent-profiles.
import { assert, test } from 'orca/testing'
import { shellQuote, splitWords } from './shell-words'

const words = (command: string): string[] => splitWords(command).map((word) => word.value)

test('splits the single-quoted words Orca writes, keeping raw positions', () => {
  const command = "claude '--model' 'deepseek-v4.1-flash:cloud[1m]' 'Reponds uniquement: OK'"
  assert.deepEqual(words(command), ['claude', '--model', 'deepseek-v4.1-flash:cloud[1m]', 'Reponds uniquement: OK'])
  const [binary, flag] = splitWords(command)
  assert.deepEqual([binary!.start, binary!.end, flag!.start, flag!.end], [0, 6, 7, 16])
})

test('understands double quotes, backslash escapes and extra whitespace', () => {
  assert.deepEqual(words('  agy   "a \\"b\\" c"  d\\ e  '), ['agy', 'a "b" c', 'd e'])
  assert.deepEqual(words(''), [])
})

test('an unterminated single quote swallows the rest instead of looping', () => {
  assert.deepEqual(words("claude 'oops"), ['claude', 'oops'])
})

test('shellQuote keeps a value with metacharacters as one word', () => {
  assert.equal(shellQuote('plain'), "'plain'")
  assert.equal(shellQuote('[1m]'), "'[1m]'")
  const value = "it's a [1m]"
  assert.equal(shellQuote(value), `'it'\\''s a [1m]'`)
  assert.deepEqual(words(`cmd ${shellQuote(value)}`), ['cmd', value])
})
