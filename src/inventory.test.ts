// Inventaire : historique d'Orca d'abord, dossiers de config ensuite. Tout est simulé, jamais de shell ni de fichier d'Orca.
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { AGENTS } from './agents'
import { detectAgents, installedAgents, type InventoryDeps } from './inventory'

const noDir = () => false
const set = (...ids: string[]): ReadonlySet<string> => new Set(ids)

test('history decides for history agents', () => {
  // Kiro et Qoder sont dans l'historique d'Orca : leurs dossiers ne comptent pas.
  const result = installedAgents(set('claude', 'codex'), set('kiro-cli', 'qoder'), noDir)
  assert.deepEqual(result, { agents: ['claude', 'codex'], source: 'history' })
})

test('config dirs decide for agents the history cannot see', () => {
  const result = installedAgents(set('claude'), set('trae'), (dir) => dir === '.dsh')
  assert.deepEqual(result, { agents: ['claude', 'trae', 'dsh'], source: 'history' })
})

test('empty history falls back to config dirs for everyone', () => {
  const result = installedAgents(null, set('claude-code', 'kiro-cli'), noDir)
  assert.deepEqual(result, { agents: ['claude', 'kiro'], source: 'dirs' })
})

test('unknown history ids are ignored, known ones count', () => {
  const result = installedAgents(set('claude', 'foo', 'dsh'), set(), noDir)
  assert.ok(result.agents.includes('claude'))
  assert.ok(result.agents.includes('dsh'), 'an agent of the catalogue counts even outside the history list')
  assert.ok(!result.agents.includes('foo'))
  assert.equal(result.source, 'history')
})

test('claude agent teams never comes from a config dir', () => {
  const result = installedAgents(null, set('claude-code'), () => true)
  assert.ok(!result.agents.includes('claude-agent-teams'))
  assert.ok(result.agents.includes('claude'))
})

test('a history of unknown agents only counts as empty', () => {
  const result = installedAgents(set('foo'), set('claude-code'), noDir)
  assert.deepEqual(result, { agents: ['claude'], source: 'dirs' })
})

test('the result follows the order of the Orca catalogue', () => {
  const result = installedAgents(null, set('kiro-cli', 'codex', 'claude-code'), (dir) => dir === '.dsh')
  const catalogIds = AGENTS.map((agent) => agent.id)
  const indexes = result.agents.map((id) => catalogIds.indexOf(id))
  assert.ok(indexes.every((index) => index >= 0))
  assert.ok(indexes.every((index, i) => i === 0 || index > indexes[i - 1]!))
  assert.deepEqual(result.agents, ['claude', 'codex', 'dsh', 'kiro'])
})

function depsOf(over: Partial<InventoryDeps> = {}): InventoryDeps {
  return { libAgents: async () => new Set(), exists: noDir, now: () => 42, ...over }
}

test('detectAgents stamps the inventory and looks for config dirs under the home', async () => {
  const seen: string[] = []
  const deps = depsOf({
    exists: (path) => {
      seen.push(path)
      return path === join('/home/me', '.dsh')
    }
  })
  const inventory = await detectAgents(deps, '/home/me', async () => null, () => {})
  assert.deepEqual(inventory, { agents: ['dsh'], source: 'dirs', detectedAt: 42 })
  assert.ok(seen.includes(join('/home/me', '.omp')), 'dirs are resolved against the home')
})

test('a failing library keeps what the history found', async () => {
  const lines: string[] = []
  const deps = depsOf({
    libAgents: async () => {
      throw new Error('boom')
    }
  })
  const inventory = await detectAgents(deps, '/home/me', async () => set('claude', 'codex'), (line) => lines.push(line))
  assert.deepEqual(inventory.agents, ['claude', 'codex'])
  assert.equal(inventory.source, 'history')
  assert.ok(lines.includes('config dirs: library detection failed'))
})

test('a failing library with no history leaves only the dirs the plugin knows', async () => {
  const lines: string[] = []
  const deps = depsOf({
    libAgents: async () => {
      throw new Error('boom')
    },
    exists: (path) => path === join('/home/me', '.jcode')
  })
  const inventory = await detectAgents(deps, '/home/me', async () => null, (line) => lines.push(line))
  assert.deepEqual(inventory.agents, ['jcode'])
  assert.equal(inventory.source, 'dirs')
  assert.ok(lines.includes('config dirs: library detection failed'))
})
