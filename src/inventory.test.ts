// Inventaire : réglages lus dans une base SQLite temporaire, commandes trouvées par un shell simulé.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { assert, test } from 'orca/testing'
import { AGENTS } from './agents'
import { enabledAgents,findCommands, listEnabledAgents, overrideToken, parseShellProbe, readOrcaSettings } from './inventory'

const ROMAIN_FOUND = new Set(['claude', 'codex', 'agy', 'grok', 'opencode', 'pi', 'dsh-tui', 'dsh', 'gemini'])

test('keeps installed agents that are not disabled, in Orca catalog order', () => {
  const agents = enabledAgents(ROMAIN_FOUND, { disabled: ['gemini'], overrides: {} })
  const catalogIds = AGENTS.map((agent) => agent.id)
  const indexes = agents.map((id) => catalogIds.indexOf(id))
  assert.ok(indexes.every((index) => index >= 0), 'every result is a catalog agent')
  assert.ok(indexes.every((index, i) => i === 0 || index > indexes[i - 1]!), 'result follows catalog order')
  for (const id of ['claude', 'codex', 'antigravity', 'dsh']) assert.ok(agents.includes(id), `${id} is enabled`)
  assert.ok(!agents.includes('gemini'), 'a disabled agent is dropped')
  assert.ok(!agents.includes('claude-agent-teams'), 'an agent missing a required command is dropped')
  for (const id of agents) {
    const spec = AGENTS.find((agent) => agent.id === id)!
    assert.ok(spec.commands.some((command) => ROMAIN_FOUND.has(command)), `${id} has an installed command`)
  }
})

test('requires the commands an agent depends on', () => {
  const found = new Set(['dsh-tui'])
  assert.deepEqual(enabledAgents(found, { disabled: [], overrides: {} }), [])
})

test('an override that resolves counts as installed', () => {
  const agents = enabledAgents(new Set(['opencode']), { disabled: [], overrides: { opencode2: 'opencode' } })
  assert.deepEqual(agents, ['opencode2', 'opencode'])
  assert.equal(overrideToken('~/bin/agy --flag'), join(homedir(), 'bin/agy'))
  assert.equal(overrideToken('  '), null)
})

test('unreadable settings show every installed agent and say so', async () => {
  const inventory = await listEnabledAgents({
    readSettings: () => null,
    findCommands: async () => new Set(['claude', 'gemini']),
    now: () => 42
  })
  assert.deepEqual(inventory, { agents: ['claude', 'gemini'], settingsReadable: false, detectedAt: 42 })
})

function orcaUserData(payload: unknown): string {
  const root = mkdtempSync(join(tmpdir(), 'agent-profiles-orca-'))
  writeFileSync(join(root, 'orca-profile-index.json'), JSON.stringify({ activeProfileId: 'p1' }))
  mkdirSync(join(root, 'profiles', 'p1'), { recursive: true })
  const db = new DatabaseSync(join(root, 'profiles', 'p1', 'profile-state.db'))
  db.exec('create table profile_state_documents (domain text, payload text)')
  db.prepare('insert into profile_state_documents values (?, ?)').run('settings', JSON.stringify(payload))
  db.close()
  return root
}

test('reads the disabled agents and command overrides from Orca settings', () => {
  const root = orcaUserData({ disabledTuiAgents: ['gemini'], agentCmdOverrides: { opencode2: 'opencode' }, theme: 'dark' })
  try {
    assert.deepEqual(readOrcaSettings(root), { disabled: ['gemini'], overrides: { opencode2: 'opencode' } })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('settings without disabledTuiAgents, or no Orca at all, read as unreadable', () => {
  const root = orcaUserData({ theme: 'dark' })
  try {
    assert.equal(readOrcaSettings(root), null)
    assert.equal(readOrcaSettings(join(root, 'missing')), null)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('reads the shell probe between its markers only', () => {
  const stdout = "(eval):1: can't change option: zle\n__AGENT_PROFILES__\nclaude=/u/.local/bin/claude\nagy=/u/.local/bin/agy\n__AGENT_PROFILES__\nbye\n"
  assert.deepEqual(parseShellProbe(stdout), new Set(['claude', 'agy']))
  assert.equal(parseShellProbe('no markers here'), null)
})

test('falls back to the PATH when the login shell fails', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'agent-profiles-path-'))
  try {
    writeFileSync(join(dir, 'fakeagent'), '#!/bin/sh\n', { mode: 0o755 })
    const found = await findCommands(['fakeagent', 'absent-agent', join(dir, 'fakeagent')], async () => ({ ok: false, stdout: '' }), dir)
    assert.deepEqual(found, new Set(['fakeagent', join(dir, 'fakeagent')]))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('tells the caller when the login shell failed and the PATH answered instead', async () => {
  let fallbacks = 0
  await findCommands(['fakeagent'], async () => ({ ok: false, stdout: '' }), '', () => fallbacks++)
  assert.equal(fallbacks, 1)
  // Une sortie sans marqueurs vaut un échec du shell.
  await findCommands(['fakeagent'], async () => ({ ok: true, stdout: 'noise' }), '', () => fallbacks++)
  assert.equal(fallbacks, 2)
})

test('does not call the fallback hook when the login shell answered', async () => {
  let fallbacks = 0
  const stdout = '__AGENT_PROFILES__\nclaude=/u/bin/claude\n__AGENT_PROFILES__\n'
  const found = await findCommands(['claude'], async () => ({ ok: true, stdout }), '', () => fallbacks++)
  assert.deepEqual(found, new Set(['claude']))
  assert.equal(fallbacks, 0)
})
