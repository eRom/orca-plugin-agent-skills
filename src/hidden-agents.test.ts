// Agents masqués : relecture du stockage et règle du dernier agent visible.
import { assert, test } from 'orca/testing'
import { parseHiddenAgents, setHidden } from './hidden-agents'

test('reads a list of agent ids, without duplicates; anything else hides nothing', () => {
  assert.deepEqual(parseHiddenAgents(['gemini', 'cursor', 'gemini']), ['gemini', 'cursor'])
  assert.deepEqual(parseHiddenAgents(null), [])
  assert.deepEqual(parseHiddenAgents({ gemini: true }), [])
  assert.deepEqual(parseHiddenAgents(['gemini', 3]), [])
})

test('hides an installed agent and shows it again', () => {
  const installed = ['claude', 'codex', 'gemini']
  const hidden = setHidden([], installed, 'gemini', true)
  assert.deepEqual(hidden, ['gemini'])
  assert.deepEqual(setHidden(hidden, installed, 'gemini', false), [])
})

test('never hides the last visible agent, nor an agent that is not installed', () => {
  const installed = ['claude', 'gemini']
  const hidden = ['gemini']
  assert.equal(setHidden(hidden, installed, 'claude', true), hidden)
  assert.equal(setHidden([], installed, 'cursor', true).length, 0)
})

test('an agent hidden before it was uninstalled can still be shown again', () => {
  assert.deepEqual(setHidden(['cursor'], ['claude'], 'cursor', false), [])
})
