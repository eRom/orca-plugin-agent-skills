// Table des dossiers de skills de projet : invariants, aucun compte figé (sauf les valeurs de Romain, vérifiées à la main).
import { assert, test } from 'orca/testing'
import { AGENTS } from './agents'
import {
  AGENT_READS,
  COPY_ONLY_DIRS,
  FALLBACK_DIRS,
  LIB_AGENT_BY_DIR,
  MANAGED_DIRS,
  type ManagedDir,
  readers,
  skillCapable,
  targetDirOf,
  TRUST_GATED,
  writeSet
} from './skill-dirs'

const ROMAIN = ['claude', 'codex', 'grok', 'opencode', 'pi', 'antigravity', 'dsh']

test('every Orca agent has a read entry and every entry is an Orca agent', () => {
  assert.deepEqual(Object.keys(AGENT_READS).sort(), AGENTS.map((agent) => agent.id).sort())
})

test('reads only managed dirs', () => {
  for (const [agent, dirs] of Object.entries(AGENT_READS)) {
    for (const dir of dirs ?? []) assert.ok(MANAGED_DIRS.includes(dir), `${agent} reads ${dir}`)
  }
})

test('never manages the root skills dir', () => {
  assert.ok(!MANAGED_DIRS.includes('skills' as ManagedDir))
  assert.ok(!MANAGED_DIRS.includes('/skills' as ManagedDir))
})

test('every skill-capable agent has a target the plugin can write', () => {
  const writable = new Set<string>([...Object.keys(LIB_AGENT_BY_DIR), ...COPY_ONLY_DIRS])
  for (const agent of skillCapable(AGENTS.map((spec) => spec.id))) {
    const target = targetDirOf(agent)
    assert.ok(target !== null, `${agent} has a target`)
    assert.ok(writable.has(target!), `${agent} target ${target} is writable`)
  }
  assert.equal(targetDirOf('aider'), null)
})

test('every managed dir is writable, the library and the plain copy never overlap', () => {
  for (const dir of MANAGED_DIRS) {
    assert.ok(dir in LIB_AGENT_BY_DIR || COPY_ONLY_DIRS.includes(dir), `${dir} is writable`)
    assert.ok(!(dir in LIB_AGENT_BY_DIR && COPY_ONLY_DIRS.includes(dir)), `${dir} has one writer only`)
  }
  for (const dir of FALLBACK_DIRS) assert.ok(MANAGED_DIRS.includes(dir), `${dir} is managed`)
})

test('trust-gated agents are Orca agents that read a managed dir', () => {
  for (const agent of Object.keys(TRUST_GATED)) {
    assert.ok((AGENT_READS[agent] ?? []).length > 0, `${agent} reads a dir`)
  }
})

test('prefers .agents, then .claude, then the own dir', () => {
  assert.equal(targetDirOf('codex'), '.agents/skills')
  assert.equal(targetDirOf('claude'), '.claude/skills')
  assert.equal(targetDirOf('continue'), '.claude/skills')
  assert.equal(targetDirOf('grok'), '.grok/skills')
  assert.equal(targetDirOf('openclaude'), '.openclaude/skills')
  assert.equal(targetDirOf('prime-agent'), '.prime/agent/skills')
})

test('write set for Romain is .agents, .claude, .grok', () => {
  assert.deepEqual(writeSet(ROMAIN), ['.agents/skills', '.claude/skills', '.grok/skills'])
})

test('write set follows the managed dir order whatever the agent order', () => {
  assert.deepEqual(writeSet(['grok', 'claude', 'codex']), ['.agents/skills', '.claude/skills', '.grok/skills'])
  assert.deepEqual(writeSet(['aider']), [])
})

test('readers of .agents among Romain agents', () => {
  assert.deepEqual(readers('.agents/skills', ROMAIN), ['codex', 'opencode', 'pi', 'antigravity', 'dsh'])
})

test('aider is not skill capable', () => {
  assert.deepEqual(skillCapable(['claude', 'aider']), ['claude'])
})
