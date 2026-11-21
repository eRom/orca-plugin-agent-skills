// Historique d'Orca : l'hôte est simulé, seul le champ `agent` des sessions est lu.
import { assert, hostError, test } from 'orca/testing'
import { listHistoryAgents } from './history'
import { sessionOf } from './test-fixtures'
import type { HostCall } from './workspace'

type Call = { method: string; params: unknown }

/** Hôte factice : chaque appel passe par `answer`, qui rend la réponse ou lève `hostError(...)`. */
function hostOf(answer: (params: unknown, index: number) => unknown): { call: HostCall; calls: Call[] } {
  const calls: Call[] = []
  const call = (async (method: string, params?: unknown) => {
    calls.push({ method, params })
    return answer(params, calls.length - 1)
  }) as unknown as HostCall
  return { call, calls }
}

const present = () => true

test('reads only the agent field', async () => {
  const host = hostOf(() => ({ sessions: [sessionOf('claude', 0), sessionOf('claude', 1), sessionOf('codex', 2)], truncated: false }))
  const lines: string[] = []
  const agents = await listHistoryAgents(host.call, present, (line) => lines.push(line))
  assert.deepEqual(agents, new Set(['claude', 'codex']))
  assert.ok(!lines.join('\n').includes('SECRET-TITLE'), 'no title ever reaches the log')
  assert.deepEqual(host.calls, [{ method: 'agent.listSessions', params: { limit: 200 } }])
})

test('retries once without limit on invalid_params', async () => {
  const host = hostOf((_params, index) => {
    if (index === 0) throw hostError('invalid_params')
    return { sessions: [sessionOf('codex')], truncated: false }
  })
  const agents = await listHistoryAgents(host.call, present, () => {})
  assert.deepEqual(agents, new Set(['codex']))
  assert.equal(host.calls.length, 2)
  assert.deepEqual(host.calls[0]!.params, { limit: 200 })
  assert.equal(host.calls[1]!.params, undefined)
})

test('returns null when the method is missing, denied or empty', async () => {
  const missingLines: string[] = []
  const missing = hostOf(() => ({ sessions: [], truncated: false }))
  assert.equal(await listHistoryAgents(missing.call, () => false, (line) => missingLines.push(line)), null)
  assert.equal(missing.calls.length, 0, 'the host is not called when the method is missing')
  assert.ok(missingLines.includes('history unavailable reason=no-method'))

  const deniedLines: string[] = []
  const denied = hostOf(() => {
    throw hostError('capability_denied')
  })
  assert.equal(await listHistoryAgents(denied.call, present, (line) => deniedLines.push(line)), null)
  assert.ok(deniedLines.includes('history unavailable reason=capability_denied'))

  const empty = hostOf(() => ({ sessions: [], truncated: false }))
  assert.equal(await listHistoryAgents(empty.call, present, () => {}), null)
})

test('a failing retry is unavailable too', async () => {
  const lines: string[] = []
  const host = hostOf(() => {
    throw hostError('invalid_params')
  })
  assert.equal(await listHistoryAgents(host.call, present, (line) => lines.push(line)), null)
  assert.equal(host.calls.length, 2)
  assert.ok(lines.includes('history unavailable reason=invalid_params'))
})

test('a burst of claude sessions keeps claude only', async () => {
  const sessions = Array.from({ length: 200 }, (_, index) => sessionOf('claude', index))
  const host = hostOf(() => ({ sessions, truncated: true }))
  assert.deepEqual(await listHistoryAgents(host.call, present, () => {}), new Set(['claude']))
})

test('a malformed answer is unavailable, not a crash', async () => {
  for (const answer of [{ sessions: null }, { sessions: [null] }, {}]) {
    const lines: string[] = []
    const host = hostOf(() => answer)
    assert.equal(await listHistoryAgents(host.call, present, (line) => lines.push(line)), null, JSON.stringify(answer))
    assert.ok(lines.includes('history unavailable reason=malformed'), JSON.stringify(answer))
  }
})

test('an entry without a string agent is ignored', async () => {
  const host = hostOf(() => ({ sessions: [{ agent: 3 }], truncated: false }))
  assert.equal(await listHistoryAgents(host.call, present, () => {}), null)
})

test('a missing agent.listSessions (unknown_method) is unavailable', async () => {
  const lines: string[] = []
  const host = hostOf(() => {
    throw hostError('unknown_method')
  })
  assert.equal(await listHistoryAgents(host.call, present, (line) => lines.push(line)), null)
  assert.ok(lines.includes('history unavailable reason=unknown_method'))
})
