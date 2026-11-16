// Modèle de visibilité : des ScanResult construits à la main, aucun accès disque.
import { assert, test } from 'orca/testing'
import type { CopyKind, DiskSkill, ScanResult, SkillCopy } from './scan'
import type { ManagedDir } from './skill-dirs'
import { ROMAIN_AGENTS } from './test-fixtures'
import { buildRows, sourceLabel, type LockEntry } from './visibility'

const ROOT = '/work/project'
const HOME = '/Users/me'
const NO_EXCLUSIONS = (): readonly string[] => []
const NO_LOCK = new Map<string, LockEntry>()

function copy(dir: ManagedDir, folder: string, hash: string, kind: CopyKind = 'dir', realPath?: string): SkillCopy {
  return { dir, path: `${ROOT}/${dir}/${folder}`, kind, realPath: realPath ?? `${ROOT}/${dir}/${folder}`, hash }
}

function skill(folder: string, copies: SkillCopy[]): DiskSkill {
  return { folder, displayName: folder, description: `Skill ${folder}`, copies }
}

function scanOf(...skills: DiskSkill[]): ScanResult {
  return { skills, unsafeDirs: [] }
}

function stateOf(agents: { agent: string; state: string }[]): Record<string, string> {
  return Object.fromEntries(agents.map((a) => [a.agent, a.state]))
}

test('handwritten skills in .claude only: Claude and OpenCode see them, the rest is missing', () => {
  const scan = scanOf(skill('alpha', [copy('.claude/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(
    row!.agents.map((a) => [a.agent, a.state]),
    [
      ['claude', 'sees'],
      ['codex', 'absent'],
      ['grok', 'absent'],
      ['opencode', 'sees'],
      ['pi', 'absent'],
      ['antigravity', 'absent'],
      ['dsh', 'absent']
    ]
  )
  assert.deepEqual(row!.agents[0]!.via, ['.claude/skills'])
  assert.deepEqual(row!.agents[3]!.via, ['.claude/skills'])
  assert.deepEqual(row!.agents[1]!.via, [])
  assert.deepEqual(row!.missingFor, ['codex', 'grok', 'pi', 'antigravity', 'dsh'])
  assert.deepEqual(row!.excluded, [])
  assert.deepEqual(row!.source, { kind: 'handwritten' })
  assert.equal(row!.folder, 'alpha')
  assert.equal(row!.displayName, 'alpha')
  assert.equal(row!.description, 'Skill alpha')
})

test('copies in .agents, .claude and .grok make every agent see it', () => {
  // Claude ne lit que .claude : sans cette copie il resterait absent (le brief ne citait que .agents et .grok).
  const scan = scanOf(
    skill('alpha', [copy('.agents/skills', 'alpha', 'h1'), copy('.claude/skills', 'alpha', 'h1'), copy('.grok/skills', 'alpha', 'h1')])
  )
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(row!.missingFor, [])
  assert.ok(row!.agents.every((a) => a.state === 'sees'))
  assert.deepEqual(row!.agents.find((a) => a.agent === 'opencode')!.via, ['.agents/skills', '.claude/skills'])
  assert.deepEqual(row!.agents.find((a) => a.agent === 'grok')!.via, ['.grok/skills'])
})

test('via lists every managed dir holding a copy the agent reads, in MANAGED_DIRS order', () => {
  const scan = scanOf(skill('alpha', [copy('.claude/skills', 'alpha', 'h1'), copy('.agents/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(row!.agents.find((a) => a.agent === 'opencode')!.via, ['.agents/skills', '.claude/skills'])
})

test('two contents give two versions with their dirs', () => {
  const scan = scanOf(
    skill('alpha', [copy('.claude/skills', 'alpha', 'h2'), copy('.agents/skills', 'alpha', 'h1'), copy('.grok/skills', 'alpha', 'h2')])
  )
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(row!.versions, [
    { hash: 'h1', dirs: ['.agents/skills'] },
    { hash: 'h2', dirs: ['.claude/skills', '.grok/skills'] }
  ])
})

test('an internal link never makes a second version', () => {
  const target = copy('.agents/skills', 'alpha', 'h1')
  // Le lien interne vise la copie de .agents ; son hash est celui du contenu réel.
  const link = copy('.claude/skills', 'alpha', 'h1', 'internal-link', target.realPath)
  const [row] = buildRows(scanOf(skill('alpha', [target, link])), NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.equal(row!.versions.length, 1)
  assert.deepEqual(row!.versions[0], { hash: 'h1', dirs: ['.agents/skills', '.claude/skills'] })
})

test('an internal link follows the version of its target even if its own hash differs', () => {
  const target = copy('.agents/skills', 'alpha', 'h1')
  const link = copy('.claude/skills', 'alpha', 'stale', 'internal-link', target.realPath)
  const [row] = buildRows(scanOf(skill('alpha', [target, link])), NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.equal(row!.versions.length, 1)
})

test('an external link counts as its own version', () => {
  const dirCopy = copy('.agents/skills', 'alpha', 'h1')
  const external = copy('.claude/skills', 'alpha', 'h9', 'external-link', '/elsewhere/alpha')
  const [row] = buildRows(scanOf(skill('alpha', [dirCopy, external])), NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.equal(row!.versions.length, 2)
})

test('an excluded agent is excluded, not missing', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, () => ['grok'], HOME)
  assert.equal(stateOf(row!.agents).grok, 'excluded')
  assert.deepEqual(row!.agents.find((a) => a.agent === 'grok')!.via, [])
  assert.deepEqual(row!.excluded, ['grok'])
  // Claude n'est pas exclu : il reste manquant ; grok n'y figure pas.
  assert.deepEqual(row!.missingFor, ['claude'])
})

test('the disk wins over an exclusion', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1'), copy('.grok/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, () => ['grok'], HOME)
  assert.equal(stateOf(row!.agents).grok, 'sees')
  assert.deepEqual(row!.excluded, [])
})

test('exclusions of agents that are not active are ignored', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ['codex', 'claude'], () => ['grok', 'claude'], HOME)
  assert.deepEqual(row!.excluded, ['claude'])
  assert.deepEqual(
    row!.agents.map((a) => a.agent),
    ['codex', 'claude']
  )
})

test('copies list the active agents they feed', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1'), copy('.claude/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  const feeds = Object.fromEntries(row!.copies.map((c) => [c.dir, c.feeds]))
  assert.deepEqual(feeds['.agents/skills'], ['codex', 'opencode', 'pi', 'antigravity', 'dsh'])
  assert.deepEqual(feeds['.claude/skills'], ['claude', 'opencode'])
})

test('copies are listed in MANAGED_DIRS order with their kind', () => {
  const scan = scanOf(skill('alpha', [copy('.grok/skills', 'alpha', 'h1'), copy('.agents/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(
    row!.copies.map((c) => [c.dir, c.kind]),
    [
      ['.agents/skills', 'dir'],
      ['.grok/skills', 'dir']
    ]
  )
})

test('a copy knows which dirs link to it', () => {
  const target = copy('.agents/skills', 'alpha', 'h1')
  const link = copy('.claude/skills', 'alpha', 'h1', 'internal-link', target.realPath)
  const other = copy('.grok/skills', 'alpha', 'h1')
  const [row] = buildRows(scanOf(skill('alpha', [target, link, other])), NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  const byDir = Object.fromEntries(row!.copies.map((c) => [c.dir, c]))
  assert.deepEqual(byDir['.agents/skills']!.linkedFrom, ['.claude/skills'])
  assert.deepEqual(byDir['.claude/skills']!.linkedFrom, [])
  assert.deepEqual(byDir['.grok/skills']!.linkedFrom, [])
  assert.equal(byDir['.claude/skills']!.kind, 'internal-link')
})

test('labels sources: remote, local abbreviated, handwritten', () => {
  assert.deepEqual(sourceLabel({ source: 'vercel-labs/skills', libName: 'find-skills' }, HOME), {
    kind: 'remote',
    source: 'vercel-labs/skills'
  })
  assert.deepEqual(sourceLabel({ source: '/Users/me/dev/x', libName: 'x' }, HOME), { kind: 'local', path: '~/dev/x' })
  assert.deepEqual(sourceLabel({ source: '/opt/skills', libName: 'x' }, HOME), { kind: 'local', path: '/opt/skills' })
  assert.deepEqual(sourceLabel(undefined, HOME), { kind: 'handwritten' })
})

test('buildRows labels each skill from the lock entry of its folder', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1')]), skill('beta', [copy('.agents/skills', 'beta', 'h2')]))
  const lock = new Map<string, LockEntry>([['alpha', { source: 'owner/repo', libName: 'alpha' }]])
  const rows = buildRows(scan, lock, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(rows[0]!.source, { kind: 'remote', source: 'owner/repo' })
  assert.deepEqual(rows[1]!.source, { kind: 'handwritten' })
})

test('agents without skills support are not shown', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1')]))
  const [row] = buildRows(scan, NO_LOCK, ['codex', 'aider', 'unknown-agent'], NO_EXCLUSIONS, HOME)
  assert.deepEqual(
    row!.agents.map((a) => a.agent),
    ['codex']
  )
  assert.deepEqual(row!.missingFor, [])
})

test('rows keep the order of the scan', () => {
  const scan = scanOf(skill('alpha', [copy('.agents/skills', 'alpha', 'h1')]), skill('beta', [copy('.agents/skills', 'beta', 'h2')]))
  const rows = buildRows(scan, NO_LOCK, ROMAIN_AGENTS, NO_EXCLUSIONS, HOME)
  assert.deepEqual(
    rows.map((r) => r.folder),
    ['alpha', 'beta']
  )
})
