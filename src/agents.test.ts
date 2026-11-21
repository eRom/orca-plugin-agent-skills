// Invariants de la table des agents : chaque agent qui lit des skills a un signal de détection ou est déclaré non détecté.
import { getSupportedAgents } from 'skills'
import { assert, test } from 'orca/testing'
import { AGENTS, HISTORY_AGENTS, UNDETECTED_AGENTS, byLabel } from './agents'
import { AGENT_READS } from './skill-dirs'

const hasSignal = (id: string): boolean => {
  const spec = AGENTS.find((agent) => agent.id === id)!
  return spec.libIds.length > 0 || spec.configDirs.length > 0
}

test('every libId is a real skills.sh agent', () => {
  const known = new Set(getSupportedAgents().map((agent) => agent.id))
  for (const spec of AGENTS) {
    for (const libId of spec.libIds) assert.ok(known.has(libId), `${spec.id}: ${libId} is a skills.sh agent`)
  }
})

test('every skill-capable agent has a config-dir signal or is listed undetected', () => {
  for (const spec of AGENTS) {
    const reads = AGENT_READS[spec.id]
    if (!reads || reads.length === 0 || spec.id === 'claude-agent-teams') continue
    assert.ok(
      hasSignal(spec.id) !== UNDETECTED_AGENTS.includes(spec.id),
      `${spec.id}: exactly one of "has a signal" and "listed undetected"`
    )
  }
  const teams = AGENTS.find((agent) => agent.id === 'claude-agent-teams')!
  assert.deepEqual([teams.libIds, teams.configDirs], [[], []], 'claude-agent-teams is served by the Claude row')
  assert.ok(!UNDETECTED_AGENTS.includes('claude-agent-teams'))
})

test('undetected agents are catalogue agents that read skills', () => {
  for (const id of UNDETECTED_AGENTS) {
    assert.ok(AGENTS.some((agent) => agent.id === id), `${id} is a catalogue agent`)
    assert.ok((AGENT_READS[id] ?? []).length > 0, `${id} reads skills`)
  }
})

test('byLabel sorts agent ids by their label, ignoring case', () => {
  // Libellés : Trae, Qwen Code, Claude Agent Teams, Claude, Codex, Charm (crush).
  assert.deepEqual(byLabel(['trae', 'qwen-code', 'claude-agent-teams', 'claude', 'codex', 'crush']), [
    'crush',
    'claude',
    'claude-agent-teams',
    'codex',
    'qwen-code',
    'trae'
  ])
})

test('byLabel ignores case: a byte sort would put the capital first', () => {
  // Ids inconnus, donc triés par l'id lui-même : « Beta » < « alpha » à l'octet, mais « alpha » < « Beta » sans la casse.
  assert.deepEqual(byLabel(['Beta', 'alpha']), ['alpha', 'Beta'])
})

test('byLabel keeps an unknown id, sorted by the id itself', () => {
  assert.deepEqual(byLabel(['zzz-unknown', 'claude']), ['claude', 'zzz-unknown'])
})

test('history agents are catalogue agents', () => {
  const ids = new Set(AGENTS.map((agent) => agent.id))
  for (const id of HISTORY_AGENTS) assert.ok(ids.has(id), `${id} is a catalogue agent`)
})

test('config dirs are home-relative', () => {
  for (const spec of AGENTS) {
    for (const dir of spec.configDirs) {
      assert.ok(!dir.startsWith('/') && !/^[A-Za-z]:/.test(dir), `${spec.id}: ${dir} is not absolute`)
      assert.ok(!dir.split(/[\\/]/).includes('..'), `${spec.id}: ${dir} does not climb out of the home`)
    }
  }
})
