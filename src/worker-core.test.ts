// Joue le worker comme Orca le ferait : requêtes du panneau et évènements, sur de vrais projets temporaires, avec une
// bibliothèque `skills`, une Corbeille et un réseau factices. Jamais la vraie sonde des agents ni la vraie Corbeille.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assert, mockHost, mountWorker, test } from 'orca/testing'
import { EXCLUSIONS_KEY } from './exclusions'
import type { InventoryDeps, OrcaSettings } from './inventory'
import type { OpFinished, OpRequest, PanelState } from './protocol'
import { fakeSkillsLib, fakeTrasher, tempDir, writeSkill, type FakeSkillsLib, type FakeTrasher } from './test-fixtures'
import { activateWith, type WorkerDeps } from './worker-core'

/** Commandes des agents de Romain : Claude, Codex, Grok, OpenCode, Pi, Antigravity, DeepSeek Harness. */
const ROMAIN_COMMANDS = ['claude', 'codex', 'grok', 'opencode', 'pi', 'agy', 'dsh-tui', 'dsh']
const SETTINGS: OrcaSettings = { disabled: [], overrides: {} }

type Probe = { calls: number }

function inventoryDeps(found: readonly string[] = ROMAIN_COMMANDS, settings: OrcaSettings | null = SETTINGS): { deps: InventoryDeps; probe: Probe } {
  const probe: Probe = { calls: 0 }
  const deps: InventoryDeps = {
    readSettings: () => settings,
    findCommands: async () => {
      probe.calls++
      return new Set(found)
    },
    now: Date.now
  }
  return { deps, probe }
}

type Row = { id: string; kind: 'worktree'; name: string; projectId: string; path: string; branch: string; hostId: string }
const rowOf = (path: string, over: Partial<Row> = {}): Row => ({
  id: 'identity:x',
  kind: 'worktree',
  name: 'feature',
  projectId: 'p1',
  path,
  branch: 'feat/x',
  hostId: 'local',
  ...over
})
const contextOf = (workspaceId: string) => ({ workspaceId, branch: 'feat/x', displayName: 'feature', terminals: [] })

type Setup = {
  root: string
  home: string
  lib: FakeSkillsLib
  trash: FakeTrasher
  host: ReturnType<typeof mockHost>
  worker: Awaited<ReturnType<typeof mountWorker>>
  probe: Probe
  /** Change l'espace focalisé et la table de `workspace.list`. */
  focus(id: string, rows: Row[]): void
}

type SetupOptions = {
  storage?: NonNullable<Parameters<typeof mockHost>[0]>['storage']
  found?: readonly string[]
  settings?: OrcaSettings | null
  deps?: Partial<WorkerDeps>
  rows?: (root: string) => Row[]
  /** Hôte déjà monté (pour un second `mountWorker` sur le même stockage). */
  host?: ReturnType<typeof mockHost>
  root?: string
}

async function boot(options: SetupOptions = {}): Promise<Setup> {
  const root = options.root ?? tempDir('worker-project')
  const home = tempDir('worker-home')
  const lib = fakeSkillsLib()
  const trash = fakeTrasher()
  const { deps: inventory, probe } = inventoryDeps(options.found, options.settings)
  let rows = options.rows ? options.rows(root) : [rowOf(root)]
  let focused = 'identity:x'
  const host =
    options.host ??
    mockHost({
      storage: options.storage,
      results: {
        'workspace.readContext': () => contextOf(focused),
        'workspace.list': () => ({ workspaces: rows, truncated: false })
      }
    })
  const deps: WorkerDeps = {
    lib,
    inventory,
    trash,
    pickFolder: null,
    fetch: async () => {
      throw new Error('the network must not be reached')
    },
    searchBase: 'https://skills.test',
    home,
    tmpdir: tempDir('worker-tmp'),
    ...options.deps
  }
  const worker = await mountWorker({ default: (orca) => activateWith(orca, deps) }, { host })
  return {
    root,
    home,
    lib,
    trash,
    host,
    worker,
    probe,
    focus(id, next) {
      focused = id
      rows = next
    }
  }
}

async function waitFor(condition: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 300; i++) {
    if (condition()) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`timed out waiting for ${what}`)
}

type Worker = Setup['worker']
const finishedOps = (worker: Worker): OpFinished[] => worker.posts.filter((post) => post.event === 'op.finished').map((post) => post.payload as OpFinished)
const stateOf = async (worker: Worker): Promise<PanelState> => worker.request('state.get')

/** Attend `op.finished` puis l'`state.changed` qui le suit : le geste est alors entièrement terminé. */
async function settled(worker: Worker, count = 1): Promise<OpFinished> {
  await waitFor(() => finishedOps(worker).length >= count, 'op.finished')
  const index = worker.posts.map((post) => post.event).lastIndexOf('op.finished')
  await waitFor(() => worker.posts.slice(index + 1).some((post) => post.event === 'state.changed'), 'state.changed after op.finished')
  return finishedOps(worker)[count - 1]!
}

const storedExclusions = (host: ReturnType<typeof mockHost>): unknown => host.data().storage[EXCLUSIONS_KEY]

function agentState(state: PanelState, folder: string, agent: string): string | undefined {
  return state.rows.find((row) => row.folder === folder)?.agents.find((candidate) => candidate.agent === agent)?.state
}

/** Skill locale à ajouter : le dossier existe, la bibliothèque factice en fait une source. */
function previewable(setup: Setup, names: readonly string[]): { source: ReturnType<FakeSkillsLib['source']>; dir: string } {
  const dir = tempDir('worker-source')
  const source = setup.lib.source(names.map((name) => ({ name })))
  setup.lib.resolve = async () => source
  return { source, dir }
}

async function previewAdd(setup: Setup, names: readonly string[]): Promise<string> {
  const { dir } = previewable(setup, names)
  const answer = await setup.worker.request('source.preview', { kind: 'path', text: dir })
  assert.equal(answer.ok, true)
  if (!answer.ok) throw new Error('unreachable')
  return answer.previewId
}

/** Rend `install` bloquant jusqu'à `release()` : un ajout en cours. */
function gateInstall(lib: FakeSkillsLib): { release(): void } {
  let release = (): void => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const original = lib.install.bind(lib)
  lib.install = async (...args) => {
    await gate
    return original(...args)
  }
  return { release }
}

const ADD = (previewId: string, names: string[], replace = false): { op: OpRequest } => ({ op: { kind: 'add', previewId, names, replace } })

test('state for a focused local worktree lists its skills and Romain agents', async () => {
  const setup = await boot({ deps: { pickFolder: async () => null } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  writeSkill(setup.root, '.agents/skills', 'beta')
  const state = await stateOf(setup.worker)
  assert.deepEqual(state.workspace, { status: 'ready', name: 'feature', branch: 'feat/x', linkedWorktree: false })
  assert.deepEqual(
    state.agents.map((agent) => agent.id),
    ['claude', 'codex', 'grok', 'opencode', 'dsh', 'pi', 'antigravity']
  )
  assert.deepEqual(state.agents[0], { id: 'claude', label: 'Claude', icon: 'agent-icons/claude.png', trust: null })
  assert.equal(state.inventory, 'detected')
  assert.deepEqual(
    state.rows.map((row) => row.folder),
    ['alpha', 'beta']
  )
  assert.equal(agentState(state, 'alpha', 'claude'), 'sees')
  assert.equal(agentState(state, 'alpha', 'codex'), 'absent')
  assert.equal(agentState(state, 'beta', 'codex'), 'sees')
  assert.deepEqual(state.unsafeDirs, [])
  assert.equal(state.lockUnreadable, false)
  assert.deepEqual(state.capabilities, { trash: true, folderPicker: true })
  assert.equal(state.busy, null)
  await setup.worker.deactivate()
})

test('trust-gated agents carry their trust marker', async () => {
  const setup = await boot({ found: ['codex', 'hermes', 'vibe'] })
  const state = await stateOf(setup.worker)
  assert.deepEqual(
    state.agents.map((agent) => [agent.id, agent.trust]),
    [
      ['codex', null],
      ['mistral-vibe', 'vibe'],
      ['hermes', 'hermes']
    ]
  )
  await setup.worker.deactivate()
})

test('remote, missing, home and no workspace states', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.claude/skills', 'alpha')
  const here = rowOf(setup.root)

  setup.focus('identity:x', [{ ...here, hostId: 'ssh:box' }])
  assert.deepEqual((await stateOf(setup.worker)).workspace, { status: 'remote' })
  assert.deepEqual((await stateOf(setup.worker)).rows, [], 'a remote workspace is never scanned')

  setup.focus('identity:x', [{ ...here, path: join(setup.root, 'gone') }])
  assert.deepEqual((await stateOf(setup.worker)).workspace, { status: 'missing' })

  setup.focus('identity:x', [{ ...here, path: setup.home }])
  assert.deepEqual((await stateOf(setup.worker)).workspace, { status: 'home' })

  setup.focus('identity:none', [])
  const none = await stateOf(setup.worker)
  assert.deepEqual(none.workspace, { status: 'none' })
  assert.deepEqual(none.rows, [])
  await setup.worker.deactivate()
})

test('a gesture without a usable workspace is refused', async () => {
  const setup = await boot()
  setup.focus('identity:none', [])
  const answer = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' } })
  assert.deepEqual(answer, { ok: false, error: { code: 'no-workspace' } })
  await setup.worker.deactivate()
})

test('falls back to .agents and .claude when no agent is detected', async () => {
  const setup = await boot({ found: [] })
  const state = await stateOf(setup.worker)
  assert.equal(state.inventory, 'fallback')
  assert.deepEqual(state.agents, [])

  const previewId = await previewAdd(setup, ['alpha'])
  const answer = await setup.worker.request('op.start', ADD(previewId, ['alpha']))
  assert.equal(answer.ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(setup.lib.calls.install[0]!.libAgents, ['universal', 'claude-code'])
  await setup.worker.deactivate()
})

test('unreadable Orca settings fall back too', async () => {
  const setup = await boot({ settings: null })
  const state = await stateOf(setup.worker)
  assert.equal(state.inventory, 'fallback')
  assert.deepEqual(state.agents, [])
  await setup.worker.deactivate()
})

test('state.get serves the inventory from cache and state.refresh probes again', async () => {
  const setup = await boot()
  await stateOf(setup.worker)
  await stateOf(setup.worker)
  assert.equal(setup.probe.calls, 1)
  await setup.worker.request('state.refresh')
  assert.equal(setup.probe.calls, 2)
  await setup.worker.deactivate()
})

test('a workspace change posts the new state', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.claude/skills', 'alpha')
  await setup.worker.emit('workspace.changed', { context: contextOf('identity:x') })
  const posted = setup.worker.posts.filter((post) => post.event === 'state.changed')
  assert.equal(posted.length, 1)
  const state = posted[0]!.payload as PanelState
  assert.equal(state.workspace.status, 'ready')
  assert.deepEqual(
    state.rows.map((row) => row.folder),
    ['alpha']
  )
  await setup.worker.deactivate()
})

test('op.start answers before a long install finishes', async () => {
  const setup = await boot()
  const gate = gateInstall(setup.lib)
  const previewId = await previewAdd(setup, ['alpha'])
  const answer = await setup.worker.request('op.start', ADD(previewId, ['alpha']))
  assert.equal(answer.ok, true)
  assert.equal(finishedOps(setup.worker).length, 0, 'the install is still running')
  const during = await stateOf(setup.worker)
  assert.deepEqual(during.busy, { kind: 'add', previewId, names: ['alpha'], replace: false })

  gate.release()
  const finished = await settled(setup.worker)
  assert.equal(finished.ok, true)
  assert.equal(finished.opId, answer.ok ? answer.opId : '')
  assert.equal((await stateOf(setup.worker)).busy, null)
  assert.equal((await readFile(join(setup.root, '.claude/skills/alpha/SKILL.md'), 'utf8')).includes('alpha'), true)
  await setup.worker.deactivate()
})

test('a second gesture while one runs is busy', async () => {
  const setup = await boot()
  const gate = gateInstall(setup.lib)
  writeSkill(setup.root, '.claude/skills', 'beta')
  const previewId = await previewAdd(setup, ['alpha'])
  await setup.worker.request('op.start', ADD(previewId, ['alpha']))
  const second = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'beta' } })
  assert.deepEqual(second, { ok: false, error: { code: 'busy' } })
  gate.release()
  await settled(setup.worker)
  const third = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'beta' } })
  assert.equal(third.ok, true)
  await settled(setup.worker, 2)
  await setup.worker.deactivate()
})

test('add reports collisions before starting', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.claude/skills', 'alpha', undefined, 'Mine\n')
  const previewId = await previewAdd(setup, ['alpha', 'beta'])
  const answer = await setup.worker.request('op.start', ADD(previewId, ['alpha', 'beta']))
  assert.deepEqual(answer, { ok: false, error: { code: 'collision', folders: ['alpha'] } })
  assert.equal(setup.lib.calls.install.length, 0)
  assert.equal(finishedOps(setup.worker).length, 0)
  assert.equal((await stateOf(setup.worker)).busy, null, 'a refused start leaves the worker free')

  // Même aperçu, avec `replace` : la copie existante part à la Corbeille puis l'ajout se fait.
  const retry = await setup.worker.request('op.start', ADD(previewId, ['alpha', 'beta'], true))
  assert.equal(retry.ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(setup.trash.trashed, [join(setup.root, '.claude/skills/alpha')])
  assert.match(await readFile(join(setup.root, '.claude/skills/alpha/SKILL.md'), 'utf8'), /Body of alpha/)
  await setup.worker.deactivate()
})

test('replace without a trash is refused before starting', async () => {
  const setup = await boot({ deps: { trash: null } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  const previewId = await previewAdd(setup, ['alpha'])
  const answer = await setup.worker.request('op.start', ADD(previewId, ['alpha'], true))
  assert.deepEqual(answer, { ok: false, error: { code: 'no-trash' } })
  await setup.worker.deactivate()
})

test('an add with an unknown or expired preview is refused', async () => {
  const setup = await boot()
  const answer = await setup.worker.request('op.start', ADD('missing', ['alpha']))
  assert.deepEqual(answer, { ok: false, error: { code: 'preview-expired' } })
  await setup.worker.deactivate()
})

test('an add whose trial fails is a lib error before starting', async () => {
  const setup = await boot()
  const previewId = await previewAdd(setup, ['alpha'])
  const answer = await setup.worker.request('op.start', ADD(previewId, ['nope']))
  assert.equal(answer.ok, false)
  if (!answer.ok) {
    assert.equal(answer.error.code, 'lib')
    assert.equal(answer.error.diagnostics?.[0]?.code, 'SKILLS_NO_MATCHING_SKILLS')
  }
  assert.equal((await stateOf(setup.worker)).busy, null)
  await setup.worker.deactivate()
})

test('remove-dir excludes the agents that lost the skill, per project', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.agents/skills', 'alpha')
  writeSkill(setup.root, '.grok/skills', 'alpha')
  assert.equal(agentState(await stateOf(setup.worker), 'alpha', 'grok'), 'sees')

  const answer = await setup.worker.request('op.start', { op: { kind: 'remove-dir', folder: 'alpha', dir: '.grok/skills' } })
  assert.equal(answer.ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(storedExclusions(setup.host), { p1: { alpha: ['grok'] } })
  assert.equal(agentState(await stateOf(setup.worker), 'alpha', 'grok'), 'excluded')
  await setup.worker.deactivate()

  // Un nouveau worker sur le même stockage : l'exclusion survit.
  const again = await boot({ host: setup.host, root: setup.root })
  assert.equal(agentState(await stateOf(again.worker), 'alpha', 'grok'), 'excluded')
  await again.worker.deactivate()

  // Un second espace du même projet (autre identifiant, même `projectId`) la voit aussi.
  const second = tempDir('worker-second')
  writeSkill(second, '.agents/skills', 'alpha')
  setup.focus('identity:y', [rowOf(second, { id: 'identity:y' })])
  const other = await boot({ host: setup.host, root: second })
  assert.equal(agentState(await stateOf(other.worker), 'alpha', 'grok'), 'excluded')
  await other.worker.deactivate()
})

test('removing the last copy from a folder clears the exclusions like a full remove', async () => {
  const setup = await boot({ storage: { [EXCLUSIONS_KEY]: { p1: { alpha: ['grok'], beta: ['codex'] } } } })
  writeSkill(setup.root, '.agents/skills', 'alpha')
  await stateOf(setup.worker)
  const answer = await setup.worker.request('op.start', { op: { kind: 'remove-dir', folder: 'alpha', dir: '.agents/skills' } })
  assert.equal(answer.ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(storedExclusions(setup.host), { p1: { beta: ['codex'] } })
  await setup.worker.deactivate()
})

test('reinstate copies into the target dir and lifts the exclusion', async () => {
  const setup = await boot({ storage: { [EXCLUSIONS_KEY]: { p1: { alpha: ['grok'] } } } })
  writeSkill(setup.root, '.agents/skills', 'alpha')
  assert.equal(agentState(await stateOf(setup.worker), 'alpha', 'grok'), 'excluded')
  const answer = await setup.worker.request('op.start', { op: { kind: 'reinstate', folder: 'alpha', agent: 'grok' } })
  assert.equal(answer.ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.match(await readFile(join(setup.root, '.grok/skills/alpha/SKILL.md'), 'utf8'), /alpha/)
  assert.deepEqual(storedExclusions(setup.host), {})
  assert.equal(agentState(await stateOf(setup.worker), 'alpha', 'grok'), 'sees')
  await setup.worker.deactivate()
})

test('propagate lifts the exclusion of the agents it feeds', async () => {
  const setup = await boot({ storage: { [EXCLUSIONS_KEY]: { p1: { alpha: ['grok', 'codex'] } } } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  await setup.worker.request('op.start', { op: { kind: 'propagate', folder: 'alpha', agents: ['grok'] } })
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(storedExclusions(setup.host), { p1: { alpha: ['codex'] } })
  await setup.worker.deactivate()
})

test('remove clears the exclusions of the skill', async () => {
  const setup = await boot({ storage: { [EXCLUSIONS_KEY]: { p1: { alpha: ['grok'], beta: ['codex'] } } } })
  writeSkill(setup.root, '.agents/skills', 'alpha')
  await stateOf(setup.worker)
  await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' } })
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(setup.trash.trashed, [join(setup.root, '.agents/skills/alpha')])
  assert.deepEqual(storedExclusions(setup.host), { p1: { beta: ['codex'] } })
  await setup.worker.deactivate()
})

test('remove succeeds when a copy vanished after the last scan', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.agents/skills', 'alpha')
  writeSkill(setup.root, '.claude/skills', 'alpha')
  assert.equal((await stateOf(setup.worker)).rows[0]!.copies.length, 2)
  rmSync(join(setup.root, '.claude/skills/alpha'), { recursive: true })
  await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' } })
  const finished = await settled(setup.worker)
  assert.equal(finished.ok, true)
  assert.deepEqual(setup.trash.trashed, [join(setup.root, '.agents/skills/alpha')])
  await setup.worker.deactivate()
})

test('keep rewrites the other copies from the chosen version', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.agents/skills', 'alpha', undefined, 'One\n')
  writeSkill(setup.root, '.claude/skills', 'alpha', undefined, 'Two\n')
  const state = await stateOf(setup.worker)
  const chosen = state.rows[0]!.versions.find((version) => version.dirs.includes('.claude/skills'))!
  await setup.worker.request('op.start', { op: { kind: 'keep', folder: 'alpha', hash: chosen.hash } })
  assert.equal((await settled(setup.worker)).ok, true)
  assert.match(await readFile(join(setup.root, '.agents/skills/alpha/SKILL.md'), 'utf8'), /Two/)
  await setup.worker.deactivate()
})

test('lists skills when the lock cannot be read', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.claude/skills', 'alpha')
  writeFileSync(join(setup.root, 'skills-lock.json'), '{ not json')
  const state = await stateOf(setup.worker)
  assert.equal(state.lockUnreadable, true)
  assert.deepEqual(state.rows[0]!.source, { kind: 'handwritten' })
  assert.equal(state.rows.length, 1)
  assert.ok(setup.worker.logs.some((line) => line.includes('SKILLS_INVALID_LOCAL_LOCK')), 'the unreadable lock is logged')
  await setup.worker.deactivate()
})

test('search marks installed hits', async () => {
  const urls: string[] = []
  const hits = [
    { name: 'gamma', source: 'owner/repo', skillId: 'gamma', installs: 3 },
    { name: 'alpha', source: 'owner/repo', skillId: 'alpha', installs: 50 },
    { name: 'alpha', source: 'other/repo', skillId: 'alpha', installs: 1 }
  ]
  const fetchStub = (async (url: string | URL | Request) => {
    urls.push(String(url))
    return new Response(JSON.stringify({ skills: hits }))
  }) as typeof fetch
  const setup = await boot({ deps: { fetch: fetchStub } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  setup.lib.lock.set('alpha', { source: 'owner/repo', libName: 'alpha' })
  const answer = await setup.worker.request('search', { query: 'alp' })
  assert.equal(answer.ok, true)
  if (!answer.ok) return
  assert.deepEqual(
    answer.hits.map((hit) => [hit.skillId, hit.source, hit.installed]),
    [
      ['alpha', 'owner/repo', true],
      ['gamma', 'owner/repo', false],
      ['alpha', 'other/repo', false]
    ]
  )
  assert.ok(urls[0]!.startsWith('https://skills.test/api/search?'))
  await setup.worker.deactivate()
})

test('search reports an unreachable catalogue and ignores a blank query', async () => {
  const setup = await boot()
  assert.deepEqual(await setup.worker.request('search', { query: '   ' }), { ok: true, hits: [] })
  assert.deepEqual(await setup.worker.request('search', { query: 'alp' }), { ok: false, error: 'unreachable' })
  await setup.worker.deactivate()
})

test('preview of a local folder lists its skills, preselected', async () => {
  const setup = await boot()
  const { dir } = previewable(setup, ['alpha', 'Beta Skill'])
  const answer = await setup.worker.request('source.preview', { kind: 'path', text: dir })
  assert.equal(answer.ok, true)
  if (!answer.ok) return
  assert.deepEqual(answer.label, { kind: 'local', path: dir })
  assert.deepEqual(answer.skills, [
    { name: 'alpha', description: '' },
    { name: 'Beta Skill', description: '' }
  ])
  assert.deepEqual(answer.preselected, ['alpha', 'Beta Skill'])
  await setup.worker.deactivate()
})

test('preview resolves ~ and relative paths and reports a missing folder', async () => {
  const setup = await boot()
  const inside = join(setup.root, 'local-skills')
  mkdirSync(inside)
  const seen: string[] = []
  const source = setup.lib.source([{ name: 'alpha' }])
  setup.lib.resolve = async (input) => {
    seen.push(input)
    return source
  }
  assert.equal((await setup.worker.request('source.preview', { kind: 'path', text: './local-skills' })).ok, true)
  mkdirSync(join(setup.home, 'mine'))
  const homeAnswer = await setup.worker.request('source.preview', { kind: 'path', text: '~/mine' })
  assert.equal(homeAnswer.ok, true)
  if (homeAnswer.ok) assert.deepEqual(homeAnswer.label, { kind: 'local', path: '~/mine' })
  assert.deepEqual(seen, [inside, join(setup.home, 'mine')])
  assert.deepEqual(await setup.worker.request('source.preview', { kind: 'path', text: '/no/such/folder' }), {
    ok: false,
    error: { code: 'path-not-found' }
  })
  await setup.worker.deactivate()
})

test('preview of a skills.sh hit keeps only that skill', async () => {
  const setup = await boot()
  const source = setup.lib.source([{ name: 'alpha' }, { name: 'Beta Skill', description: 'Does beta' }])
  setup.lib.resolve = async () => source
  const answer = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'beta-skill' })
  assert.equal(answer.ok, true)
  if (!answer.ok) return
  assert.deepEqual(answer.label, { kind: 'remote', source: 'owner/repo' })
  assert.deepEqual(answer.skills, [{ name: 'Beta Skill', description: 'Does beta' }])
  assert.deepEqual(answer.preselected, ['Beta Skill'])
  await setup.worker.deactivate()
})

test('preview of a skills.sh hit missing from its repo is a lib error', async () => {
  const setup = await boot()
  let disposed = 0
  const source = setup.lib.source([{ name: 'alpha' }])
  source.dispose = async () => {
    disposed++
  }
  setup.lib.resolve = async () => source
  const answer = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'ghost' })
  assert.equal(answer.ok, false)
  if (!answer.ok) {
    assert.equal(answer.error.code, 'lib')
    assert.equal(answer.error.diagnostics?.[0]?.code, 'SKILLS_NO_MATCHING_SKILLS')
  }
  assert.equal(disposed, 1, 'the resolved source is released')
  await setup.worker.deactivate()
})

test('a library failure while resolving is a lib error', async () => {
  const setup = await boot()
  setup.lib.resolve = async () => {
    throw Object.assign(new Error('clone failed'), { code: 'SKILLS_GIT_CLONE_TIMEOUT' })
  }
  const answer = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'alpha' })
  assert.deepEqual(answer, { ok: false, error: { code: 'lib', diagnostics: [{ code: 'SKILLS_GIT_CLONE_TIMEOUT', message: 'clone failed' }] } })
  await setup.worker.deactivate()
})

test('a new preview releases the previous source, and an add releases its own', async () => {
  const setup = await boot()
  const disposed: string[] = []
  const make = (label: string) => {
    const source = setup.lib.source([{ name: 'alpha' }])
    source.dispose = async () => {
      disposed.push(label)
    }
    return source
  }
  const dir = tempDir('worker-source')
  setup.lib.resolve = async () => make('first')
  const first = await setup.worker.request('source.preview', { kind: 'path', text: dir })
  setup.lib.resolve = async () => make('second')
  const second = await setup.worker.request('source.preview', { kind: 'path', text: dir })
  assert.deepEqual(disposed, ['first'])
  assert.equal(first.ok && second.ok, true)
  if (!first.ok || !second.ok) return

  // L'aperçu remplacé n'est plus utilisable.
  assert.deepEqual(await setup.worker.request('op.start', ADD(first.previewId, ['alpha'])), { ok: false, error: { code: 'preview-expired' } })
  assert.equal((await setup.worker.request('op.start', ADD(second.previewId, ['alpha']))).ok, true)
  await settled(setup.worker)
  assert.deepEqual(disposed, ['first', 'second'])
  await setup.worker.deactivate()
})

test('errors and warnings are logged on one line with code and folder', async () => {
  const setup = await boot()
  await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'ghost' } })
  const finished = await settled(setup.worker)
  assert.equal(finished.ok, false)
  assert.deepEqual(finished.error, { code: 'gone' })
  const line = setup.worker.logs.find((entry) => entry.includes('gone'))
  assert.ok(line, 'the error is logged')
  assert.ok(line.includes('ghost') && !line.includes('\n'))
  await setup.worker.deactivate()
})

test('a worker restarted mid-gesture posts a free state', async () => {
  const setup = await boot()
  const gate = gateInstall(setup.lib)
  const previewId = await previewAdd(setup, ['alpha'])
  await setup.worker.request('op.start', ADD(previewId, ['alpha']))
  assert.notEqual((await stateOf(setup.worker)).busy, null)
  const restarted = await boot({ host: setup.host, root: setup.root })
  assert.equal((await stateOf(restarted.worker)).busy, null)
  gate.release()
  await settled(setup.worker)
  await setup.worker.deactivate()
  await restarted.worker.deactivate()
})

test('concurrent state reads never drop an exclusion written by a gesture', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.agents/skills', 'alpha')
  writeSkill(setup.root, '.grok/skills', 'alpha')
  await stateOf(setup.worker)
  await setup.worker.request('op.start', { op: { kind: 'remove-dir', folder: 'alpha', dir: '.grok/skills' } })
  const reads = Array.from({ length: 6 }, () => stateOf(setup.worker))
  await settled(setup.worker)
  await Promise.all(reads)
  assert.deepEqual(storedExclusions(setup.host), { p1: { alpha: ['grok'] } })
  await setup.worker.deactivate()
})

test('folder.pick returns the chosen path, null when cancelled or unavailable', async () => {
  const chosen = await boot({ deps: { pickFolder: async () => '/Users/me/skills' } })
  assert.deepEqual(await chosen.worker.request('folder.pick'), { path: '/Users/me/skills' })
  await chosen.worker.deactivate()

  const cancelled = await boot({ deps: { pickFolder: async () => null } })
  assert.deepEqual(await cancelled.worker.request('folder.pick'), { path: null })
  await cancelled.worker.deactivate()

  const broken = await boot({
    deps: {
      pickFolder: async () => {
        throw new Error('osascript failed')
      }
    }
  })
  assert.deepEqual(await broken.worker.request('folder.pick'), { path: null })
  assert.ok(broken.worker.logs.some((line) => line.includes('osascript failed')))
  await broken.worker.deactivate()

  const none = await boot()
  assert.deepEqual(await none.worker.request('folder.pick'), { path: null })
  await none.worker.deactivate()
})
