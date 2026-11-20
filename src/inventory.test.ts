// Inventaire : commandes trouvées par un shell simulé, jamais de lecture des fichiers d'Orca.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { AGENTS } from './agents'
import { findCommands, installedAgents, listInstalledAgents, parseShellProbe, probeTokens } from './inventory'

const ROMAIN_FOUND = new Set(['claude', 'codex', 'agy', 'grok', 'opencode', 'pi', 'dsh-tui', 'dsh', 'gemini'])

test('keeps every installed agent, in Orca catalog order', () => {
  const agents = installedAgents(ROMAIN_FOUND)
  const catalogIds = AGENTS.map((agent) => agent.id)
  const indexes = agents.map((id) => catalogIds.indexOf(id))
  assert.ok(indexes.every((index) => index >= 0), 'every result is a catalog agent')
  assert.ok(indexes.every((index, i) => i === 0 || index > indexes[i - 1]!), 'result follows catalog order')
  for (const id of ['claude', 'codex', 'antigravity', 'dsh', 'gemini']) assert.ok(agents.includes(id), `${id} is installed`)
  assert.ok(!agents.includes('claude-agent-teams'), 'an agent missing a required command is dropped')
  for (const id of agents) {
    const spec = AGENTS.find((agent) => agent.id === id)!
    assert.ok(spec.commands.some((command) => ROMAIN_FOUND.has(command)), `${id} has an installed command`)
  }
})

test('requires the commands an agent depends on', () => {
  assert.deepEqual(installedAgents(new Set(['dsh-tui'])), [])
})

test('probes every command and dependency of the catalog', () => {
  const tokens = new Set(probeTokens())
  for (const agent of AGENTS) {
    for (const command of [...agent.commands, ...agent.requiredCommands]) assert.ok(tokens.has(command), `${command} is probed`)
  }
})

test('the inventory is the installed agents, stamped with the detection time', async () => {
  const inventory = await listInstalledAgents({ findCommands: async () => new Set(['claude', 'gemini']), now: () => 42 })
  assert.deepEqual(inventory, { agents: ['claude', 'gemini'], detectedAt: 42 })
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
