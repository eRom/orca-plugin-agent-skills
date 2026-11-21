// Joue le worker comme Orca le ferait : requêtes du panneau et évènements, sur de vrais projets temporaires, avec une
// bibliothèque `skills`, une Corbeille et un réseau factices. Jamais la vraie sonde des agents ni la vraie Corbeille.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assert, hostError, mockHost, mountWorker, test } from 'orca/testing'
import { HIDDEN_AGENTS_KEY } from './hidden-agents'
import type { InventoryDeps } from './inventory'
import type { OpFinished, OpRequest, PanelState } from './protocol'
import { fakeSkillsLib, fakeTrasher, sessionOf, tempDir, writeSkill, type FakeSkillsLib, type FakeTrasher } from './test-fixtures'
import { activateWith, deactivate, type WorkerDeps } from './worker-core'

/** Historique réel de Romain (Orca 1.4.268, 2026-11-21, `limit: 200`) : les agents des sessions rendues. */
const ROMAIN_HISTORY = ['antigravity', 'claude', 'codex', 'grok', 'omp', 'opencode2', 'pi']
/** DeepSeek Harness n'est pas dans l'historique d'Orca : il vient de son dossier de config. */
const ROMAIN_DIRS = ['.dsh']
type Probe = { calls: number }

/** `libAgents` factice (compté) et `exists` factice : seuls les dossiers de `dirs` existent, sous `home`. */
function inventoryDeps(home: string, lib: readonly string[], dirs: readonly string[]): { deps: InventoryDeps; probe: Probe } {
  const probe: Probe = { calls: 0 }
  const existing = new Set(dirs.map((dir) => join(home, dir)))
  const deps: InventoryDeps = {
    libAgents: async () => {
      probe.calls++
      return new Set(lib)
    },
    exists: (path) => existing.has(path),
    now: () => Date.now() + clockSkew
  }
  return { deps, probe }
}

/** Avance l'horloge de l'inventaire seulement (pas celle du harnais) : de quoi vieillir le cache. */
let clockSkew = 0

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

/** Leviers du test sur ce que le worker voit : stockage lent, et les gestionnaires de requêtes (pour passer un `signal`). */
type Controls = {
  /** Appelé après chaque lecture du stockage ; la valeur lue est rendue après l'attente (donc périmée). */
  afterStorageGet?: (key: string) => Promise<void>
  /** Appelé avant que `workspace.list` réponde : de quoi faire attendre une requête à l'hôte. */
  beforeWorkspaceList?: () => Promise<void>
  handlers: Map<string, (input: unknown, context: { panel: unknown; signal: AbortSignal }) => Promise<unknown>>
}

type Setup = {
  controls: Controls
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
  /** Agents des sessions que `agent.listSessions` rend (défaut : l'historique de Romain ; `[]` : historique vide). */
  history?: readonly string[] | null
  /** Identifiants skills.sh que la bibliothèque détecte (défaut : aucun). */
  lib?: readonly string[]
  /** Dossiers de config qui existent dans le home (défaut : `.dsh`, comme chez Romain). */
  dirs?: readonly string[]
  /** Capacités accordées à l'hôte simulé (défaut : celles du manifeste). */
  capabilities?: readonly string[]
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
  const { deps: inventory, probe } = inventoryDeps(home, options.lib ?? [], options.dirs ?? ROMAIN_DIRS)
  const history = options.history === undefined ? ROMAIN_HISTORY : options.history
  let rows = options.rows ? options.rows(root) : [rowOf(root)]
  let focused = 'identity:x'
  const controls: Controls = { handlers: new Map() }
  const host =
    options.host ??
    mockHost({
      storage: options.storage,
      capabilities: options.capabilities,
      results: {
        // `null` : l'hôte annonce `agent.listSessions` mais l'appel est rejeté en `unknown_method`.
        'agent.listSessions': () => {
          if (history === null) throw hostError('unknown_method')
          return { sessions: history.map((agent, index) => sessionOf(agent, index)), truncated: false }
        },
        'workspace.readContext': () => contextOf(focused),
        'workspace.list': async () => {
          await controls.beforeWorkspaceList?.()
          return { workspaces: rows, truncated: false }
        }
      }
    })
  const deps: WorkerDeps = {
    lib,
    inventory,
    trash,
    trashStatus: 'ready',
    pickFolder: null,
    fetch: async () => {
      throw new Error('the network must not be reached')
    },
    searchBase: 'https://skills.test',
    home,
    tmpdir: tempDir('worker-tmp'),
    platform: 'darwin',
    env: {},
    ...options.deps
  }
  // L'objet `orca` du harnais est figé : on en fait une copie dont le stockage et les gestionnaires passent par `controls`.
  const worker = await mountWorker(
    {
      default: (orca) =>
        activateWith(
          {
            ...orca,
            storage: {
              ...orca.storage,
              get: async (key: string) => {
                const value = await orca.storage.get(key)
                await controls.afterStorageGet?.(key)
                return value
              }
            },
            panels: {
              ...orca.panels,
              handle: ((name: string, handler: never) => {
                controls.handlers.set(name, handler)
                return (orca.panels.handle as (n: string, h: never) => unknown)(name, handler)
              }) as typeof orca.panels.handle
            }
          },
          deps
        ),
      deactivate
    },
    { host }
  )
  return {
    controls,
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

/**
 * Appelle le gestionnaire du worker sans passer par `request` : celui-ci attend la fin de tous les appels à l'hôte en
 * vol, y compris celui qu'un test retient exprès, et se bloquerait. Permet aussi de fournir son propre `signal`.
 */
const callHandler = (setup: Setup, name: string, input: unknown, signal: AbortSignal = new AbortController().signal): Promise<unknown> =>
  setup.controls.handlers.get(name)!(input, { panel: {}, signal })

async function previewAdd(setup: Setup, names: readonly string[]): Promise<string> {
  const { dir } = previewable(setup, names)
  const answer = await setup.worker.request('source.preview', { kind: 'path', text: dir, workspaceId: WS })
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

/** Identifiant de l'espace focalisé par défaut (`rowOf`) : celui que le panneau renvoie avec chaque demande. */
const WS = 'identity:x'
const ADD = (previewId: string, names: string[], replace = false): { op: OpRequest; workspaceId: string } => ({ op: { kind: 'add', previewId, names, replace }, workspaceId: WS })

test('state for a focused local worktree lists its skills and Romain agents', async () => {
  const setup = await boot({ deps: { pickFolder: async () => null } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  writeSkill(setup.root, '.agents/skills', 'beta')
  const state = await stateOf(setup.worker)
  assert.deepEqual(state.workspace, { status: 'ready', id: 'identity:x', name: 'feature', branch: 'feat/x', linkedWorktree: false, network: false })
  // Par ordre alphabétique des libellés : Antigravity, Claude, Codex, DeepSeek Harness, Grok, OMP, OpenCode 2, Pi.
  assert.deepEqual(
    state.agents.map((agent) => agent.id),
    ['antigravity', 'claude', 'codex', 'dsh', 'grok', 'omp', 'opencode2', 'pi']
  )
  assert.deepEqual(
    state.agents.find((agent) => agent.id === 'claude'),
    { id: 'claude', label: 'Claude', icon: 'agent-icons/claude.png', trust: null }
  )
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
  assert.deepEqual(state.capabilities, { trash: 'ready', folderPicker: true })
  assert.equal(state.platform, 'darwin')
  assert.equal(state.busy, null)
  await setup.worker.deactivate()
})

test('trust-gated agents carry their trust marker', async () => {
  const setup = await boot({ history: ['codex', 'hermes'], lib: ['mistral-vibe'], dirs: [] })
  const state = await stateOf(setup.worker)
  assert.deepEqual(
    state.agents.map((agent) => [agent.id, agent.trust]),
    [
      ['codex', null],
      ['hermes', 'hermes'],
      ['mistral-vibe', 'vibe']
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
  const answer = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' }, workspaceId: WS })
  assert.deepEqual(answer, { ok: false, error: { code: 'no-workspace' } })
  await setup.worker.deactivate()
})

test('a hidden agent loses its chip and its folder in every project, and stays hidden after a restart', async () => {
  const setup = await boot()
  const before = await stateOf(setup.worker)
  assert.ok(before.agents.some((agent) => agent.id === 'grok'))

  const after = await setup.worker.request('agents.setHidden', { agent: 'grok', hidden: true })
  assert.ok(!after.agents.some((agent) => agent.id === 'grok'), 'grok is no longer an active agent')
  assert.equal(after.detected.find((agent) => agent.id === 'grok')?.hidden, true)
  assert.deepEqual(setup.host.data().storage[HIDDEN_AGENTS_KEY], ['grok'])

  // Un ajout n'écrit plus pour Grok : son dossier propre n'est plus dans l'ensemble d'écriture.
  const previewId = await previewAdd(setup, ['alpha'])
  assert.equal((await setup.worker.request('op.start', ADD(previewId, ['alpha']))).ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.deepEqual(setup.lib.calls.install[0]!.libAgents, ['universal', 'claude-code'])
  await setup.worker.deactivate()

  // Le réglage vit dans le stockage du plugin : un worker neuf le relit.
  const again = await boot({ host: setup.host, root: setup.root })
  assert.ok(!(await stateOf(again.worker)).agents.some((agent) => agent.id === 'grok'))
  const shown = await again.worker.request('agents.setHidden', { agent: 'grok', hidden: false })
  assert.ok(shown.agents.some((agent) => agent.id === 'grok'))
  await again.worker.deactivate()
})

test('an unreadable storage fails the toggle instead of forgetting the hidden agents', async () => {
  const setup = await boot({ storage: { [HIDDEN_AGENTS_KEY]: ['codex', 'pi'] } })
  await stateOf(setup.worker)
  setup.controls.afterStorageGet = async (key) => {
    if (key === HIDDEN_AGENTS_KEY) throw new Error('storage unavailable')
  }
  await assert.rejects(setup.worker.request('agents.setHidden', { agent: 'grok', hidden: true }))
  assert.deepEqual(setup.host.data().storage[HIDDEN_AGENTS_KEY], ['codex', 'pi'])
  setup.controls.afterStorageGet = undefined
  await setup.worker.deactivate()
})

test('a toggle reuses the known inventory, however old, instead of detecting again', async () => {
  const setup = await boot()
  await stateOf(setup.worker)
  const probes = setup.probe.calls
  // Plus vieux que le délai de 10 s : `state.get` relancerait la détection, la bascule non.
  clockSkew = 60_000
  try {
    await setup.worker.request('agents.setHidden', { agent: 'grok', hidden: true })
    assert.equal(setup.probe.calls, probes)
    // Témoin : une simple lecture, elle, relance bien la détection sur un cache périmé.
    await stateOf(setup.worker)
    assert.equal(setup.probe.calls, probes + 1)
  } finally {
    clockSkew = 0
  }
  await setup.worker.deactivate()
})

test('refuses to hide the last visible agent', async () => {
  const setup = await boot({ history: ['claude'], dirs: [] })
  const state = await setup.worker.request('agents.setHidden', { agent: 'claude', hidden: true })
  assert.deepEqual(state.agents.map((agent) => agent.id), ['claude'])
  assert.equal(state.inventory, 'detected')
  assert.equal(setup.host.data().storage[HIDDEN_AGENTS_KEY], undefined)
  await setup.worker.deactivate()
})

test('nothing detected falls back to .agents and .claude', async () => {
  const setup = await boot({ history: [], dirs: [] })
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

test('history source keeps hidden agents hidden', async () => {
  const setup = await boot({ storage: { [HIDDEN_AGENTS_KEY]: ['grok'] } })
  const state = await stateOf(setup.worker)
  assert.equal(state.detected.find((agent) => agent.id === 'grok')?.hidden, true)
  assert.ok(!state.agents.some((agent) => agent.id === 'grok'))
  assert.ok(state.agents.some((agent) => agent.id === 'claude'))
  assert.ok(setup.worker.logs.some((line) => line.startsWith('inventory source=history agents=')))
  await setup.worker.deactivate()
})

test('the agents of the history and the config dirs of the others are all detected', async () => {
  const setup = await boot()
  const state = await stateOf(setup.worker)
  assert.deepEqual(
    state.detected.map((agent) => agent.id),
    ['antigravity', 'claude', 'codex', 'dsh', 'grok', 'omp', 'opencode2', 'pi']
  )
  assert.ok(!setup.worker.logs.some((line) => line.includes('SECRET-TITLE')), 'no session title is logged')
  await setup.worker.deactivate()
})

test('denied history falls back to config dirs and keeps hidden agents hidden', async () => {
  const setup = await boot({
    capabilities: ['workspace:read', 'storage:own'],
    storage: { [HIDDEN_AGENTS_KEY]: ['codex'] },
    lib: ['claude-code', 'codex'],
    dirs: []
  })
  const state = await stateOf(setup.worker)
  assert.deepEqual(state.agents.map((agent) => agent.id), ['claude'])
  assert.equal(state.detected.find((agent) => agent.id === 'codex')?.hidden, true)
  assert.equal(state.inventory, 'detected')
  assert.ok(setup.worker.logs.includes('history unavailable reason=capability_denied'))
  assert.ok(setup.worker.logs.some((line) => line.startsWith('inventory source=dirs agents=2')))
  await setup.worker.deactivate()
})

test('an Orca without agent.listSessions (unknown_method) falls back to config dirs', async () => {
  const setup = await boot({ history: null, lib: ['claude-code'], dirs: [] })
  const state = await stateOf(setup.worker)
  assert.deepEqual(state.agents.map((agent) => agent.id), ['claude'])
  assert.ok(setup.worker.logs.includes('history unavailable reason=unknown_method'))
  assert.ok(setup.worker.logs.some((line) => line.startsWith('inventory source=dirs agents=1')))
  await setup.worker.deactivate()
})

test('the agent ids of the history are logged, never a title', async () => {
  const setup = await boot({ history: ['codex', 'claude', 'claude'], dirs: [] })
  await stateOf(setup.worker)
  assert.ok(setup.worker.logs.includes('history agents=claude,codex'), 'catalogue ids, sorted, without duplicates')
  assert.ok(!setup.worker.logs.some((line) => line.includes('SECRET-TITLE')))
  await setup.worker.deactivate()
})

test('startup logs which environment variables arrived', async () => {
  const setup = await boot({ deps: { env: { HOME: 'x', APPDATA: undefined, SECRET_TOKEN: 'never-logged' } } })
  await stateOf(setup.worker)
  assert.ok(setup.worker.logs.includes('env present=HOME'))
  assert.ok(!setup.worker.logs.some((line) => line.includes('never-logged') || line.includes('SECRET_TOKEN')))
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
  const second = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'beta' }, workspaceId: WS })
  assert.deepEqual(second, { ok: false, error: { code: 'busy' } })
  gate.release()
  await settled(setup.worker)
  const third = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'beta' }, workspaceId: WS })
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
  const setup = await boot({ deps: { trash: null, trashStatus: 'missing' } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  const previewId = await previewAdd(setup, ['alpha'])
  const answer = await setup.worker.request('op.start', ADD(previewId, ['alpha'], true))
  assert.deepEqual(answer, { ok: false, error: { code: 'no-trash' } })
  await setup.worker.deactivate()
})

test('unverified trash refuses removal with its own code', async () => {
  const setup = await boot({ deps: { trash: null, trashStatus: 'unverified', platform: 'linux' } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  assert.equal((await stateOf(setup.worker)).capabilities.trash, 'unverified')
  const started = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' }, workspaceId: WS })
  assert.equal(started.ok, true)
  const finished = await settled(setup.worker)
  assert.deepEqual(finished.ok ? null : finished.error, { code: 'trash-unverified' })
  // Un remplacement est refusé avant de démarrer, avec le même code.
  const previewId = await previewAdd(setup, ['alpha'])
  assert.deepEqual(await setup.worker.request('op.start', ADD(previewId, ['alpha'], true)), { ok: false, error: { code: 'trash-unverified' } })
  assert.ok(existsSync(join(setup.root, '.claude/skills/alpha')), 'the skill is still on disk')
  assert.equal(setup.lib.calls.untrack.length, 0)
  assert.equal(setup.lib.calls.install.length, 0)
  assert.ok(setup.worker.logs.some((line) => line.includes('op=remove folder=alpha error=trash-unverified')))
  await setup.worker.deactivate()
})

test('network workspace refuses removal before any trash call', async () => {
  const unc = '\\\\srv\\share\\project'
  // La racine UNC n'existe pas sur ce Mac : `realpath` est simulé pour que l'espace soit prêt, comme sous Windows.
  const setup = await boot({ deps: { platform: 'win32', realpath: async (path) => path }, rows: () => [rowOf(unc)] })
  const state = await stateOf(setup.worker)
  assert.equal(state.workspace.status === 'ready' ? state.workspace.network : null, true)
  assert.equal(state.capabilities.trash, 'network')
  // Une Corbeille est pourtant disponible (`fakeTrasher`) : le contexte du geste n'y a pas accès.
  assert.equal((await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' }, workspaceId: WS })).ok, true)
  const removed = await settled(setup.worker)
  assert.deepEqual(removed.ok ? null : removed.error, { code: 'network-path' })
  assert.deepEqual(setup.trash.trashed, [], 'the trasher is never called')
  assert.equal(setup.lib.calls.untrack.length, 0)
  assert.ok(setup.worker.logs.some((line) => line.includes('op=remove folder=alpha error=network-path')))
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

test('propagate copies the skill into the target dir of the agent and it then sees it', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.claude/skills', 'alpha')
  assert.equal(agentState(await stateOf(setup.worker), 'alpha', 'grok'), 'absent')
  const answer = await setup.worker.request('op.start', { op: { kind: 'propagate', folder: 'alpha', agents: ['grok'] }, workspaceId: WS })
  assert.equal(answer.ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
  assert.match(await readFile(join(setup.root, '.grok/skills/alpha/SKILL.md'), 'utf8'), /alpha/)
  assert.equal(agentState(await stateOf(setup.worker), 'alpha', 'grok'), 'sees')
  await setup.worker.deactivate()
})

test('exclusions stored by v0.1 are ignored: the agent is absent, nothing is read as an error', async () => {
  // Le nom de la clé de la v0.1 est gelé ici à dessein : le plugin ne la lit plus, ne la migre pas et ne l'efface pas.
  const legacy = { p1: { alpha: ['grok'] } }
  const setup = await boot({ storage: { 'exclusions.v1': legacy } })
  writeSkill(setup.root, '.claude/skills', 'alpha')
  const state = await stateOf(setup.worker)
  assert.equal(agentState(state, 'alpha', 'grok'), 'absent')
  assert.ok(state.rows[0]!.missingFor.includes('grok'))
  assert.deepEqual(
    ['claude', 'grok'].map((agent) => [agent, agentState(state, 'alpha', agent)]),
    [
      ['claude', 'sees'],
      ['grok', 'absent']
    ]
  )
  assert.deepEqual(setup.host.data().storage['exclusions.v1'], legacy, 'the stored value is left untouched')
  await setup.worker.deactivate()
})

test('remove succeeds when a copy vanished after the last scan', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.agents/skills', 'alpha')
  writeSkill(setup.root, '.claude/skills', 'alpha')
  assert.equal((await stateOf(setup.worker)).rows[0]!.copies.length, 2)
  rmSync(join(setup.root, '.claude/skills/alpha'), { recursive: true })
  await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' }, workspaceId: WS })
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
  await setup.worker.request('op.start', { op: { kind: 'keep', folder: 'alpha', hash: chosen.hash }, workspaceId: WS })
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
  const answer = await setup.worker.request('source.preview', { kind: 'path', text: dir, workspaceId: WS })
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
  assert.equal((await setup.worker.request('source.preview', { kind: 'path', text: './local-skills', workspaceId: WS })).ok, true)
  mkdirSync(join(setup.home, 'mine'))
  const homeAnswer = await setup.worker.request('source.preview', { kind: 'path', text: '~/mine', workspaceId: WS })
  assert.equal(homeAnswer.ok, true)
  if (homeAnswer.ok) assert.deepEqual(homeAnswer.label, { kind: 'local', path: '~/mine' })
  assert.deepEqual(seen, [inside, join(setup.home, 'mine')])
  assert.deepEqual(await setup.worker.request('source.preview', { kind: 'path', text: '/no/such/folder', workspaceId: WS }), {
    ok: false,
    error: { code: 'path-not-found' }
  })
  await setup.worker.deactivate()
})

test('preview of a skills.sh hit keeps only that skill', async () => {
  const setup = await boot()
  const source = setup.lib.source([{ name: 'alpha' }, { name: 'Beta Skill', description: 'Does beta' }])
  setup.lib.resolve = async () => source
  const answer = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'beta-skill', workspaceId: WS })
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
  const answer = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'ghost', workspaceId: WS })
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
  const answer = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'alpha', workspaceId: WS })
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
  const first = await setup.worker.request('source.preview', { kind: 'path', text: dir, workspaceId: WS })
  setup.lib.resolve = async () => make('second')
  const second = await setup.worker.request('source.preview', { kind: 'path', text: dir, workspaceId: WS })
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
  await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'ghost' }, workspaceId: WS })
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

test('a preview that waited on the host cannot release the source an add took meanwhile', async () => {
  const setup = await boot()
  const first = setup.lib.source([{ name: 'alpha' }])
  let disposed = 0
  first.dispose = async () => {
    disposed++
  }
  setup.lib.resolve = async () => first
  const dir = tempDir('worker-source')
  const opened = await setup.worker.request('source.preview', { kind: 'path', text: dir, workspaceId: WS })
  assert.equal(opened.ok, true)
  if (!opened.ok) return

  // Le second aperçu attend l'hôte (`workspace.list`) ; pendant ce temps, l'ajout démarre et prend la source du premier.
  let resolves = 0
  setup.lib.resolve = async () => {
    resolves++
    return setup.lib.source([{ name: 'other' }])
  }
  let releaseHost = (): void => {}
  let hostReached = (): void => {}
  const reached = new Promise<void>((resolve) => {
    hostReached = resolve
  })
  setup.controls.beforeWorkspaceList = async () => {
    setup.controls.beforeWorkspaceList = undefined
    hostReached()
    await new Promise<void>((resolve) => {
      releaseHost = resolve
    })
  }
  const waiting = callHandler(setup, 'source.preview', { kind: 'path', text: dir, workspaceId: WS })
  await reached
  const gate = gateInstall(setup.lib)
  const add = await callHandler(setup, 'op.start', ADD(opened.previewId, ['alpha']))
  assert.equal((add as { ok: boolean }).ok, true)

  releaseHost()
  assert.deepEqual(await waiting, { ok: false, error: { code: 'busy' } })
  assert.equal(resolves, 0, 'the refused preview never read a source')
  assert.equal(disposed, 0, 'the add still holds its source')

  gate.release()
  assert.equal((await settled(setup.worker)).ok, true)
  assert.equal(disposed, 1, 'the add releases its own source once, when it ends')
  await setup.worker.deactivate()
})

test('an aborted preview releases its source instead of keeping it', async () => {
  const setup = await boot()
  const source = setup.lib.source([{ name: 'alpha' }])
  let disposed = 0
  source.dispose = async () => {
    disposed++
  }
  let release = (): void => {}
  let resolveStarted = (): void => {}
  const started = new Promise<void>((resolve) => {
    resolveStarted = resolve
  })
  setup.lib.resolve = async () => {
    resolveStarted()
    await new Promise<void>((resolve) => {
      release = resolve
    })
    return source
  }
  // Le harnais ne sait pas annuler une requête : on appelle le gestionnaire du worker avec notre propre signal.
  const controller = new AbortController()

  const pending = callHandler(setup, 'source.preview', { kind: 'path', text: tempDir('worker-source'), workspaceId: WS }, controller.signal)
  await started
  controller.abort()
  release()
  assert.deepEqual(await pending, { ok: false, error: { code: 'preview-expired' } })
  assert.equal(disposed, 1)
  await setup.worker.deactivate()
  assert.equal(disposed, 1, 'nothing was kept to release again')
  assert.ok(setup.worker.logs.some((line) => line.includes('op=preview error=preview-expired')))
})

test('deactivate releases an open preview', async () => {
  const setup = await boot()
  const source = setup.lib.source([{ name: 'alpha' }])
  let disposed = 0
  source.dispose = async () => {
    disposed++
  }
  setup.lib.resolve = async () => source
  assert.equal((await setup.worker.request('source.preview', { kind: 'path', text: tempDir('worker-source'), workspaceId: WS })).ok, true)
  assert.equal(disposed, 0)
  await setup.worker.deactivate()
  assert.equal(disposed, 1)
})

test('every refused preview and start is logged on one line', async () => {
  const setup = await boot()
  const logged = (needle: string): boolean => setup.worker.logs.some((line) => line.includes(needle) && !line.includes('\n'))

  await setup.worker.request('source.preview', { kind: 'path', text: '/no/such/folder', workspaceId: WS })
  assert.ok(logged('op=preview error=path-not-found'))

  setup.lib.resolve = async () => setup.lib.source([{ name: 'alpha' }])
  await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'ghost', workspaceId: WS })
  assert.ok(logged('op=preview error=lib lib=SKILLS_NO_MATCHING_SKILLS'))

  const gate = gateInstall(setup.lib)
  writeSkill(setup.root, '.claude/skills', 'beta')
  const previewId = await previewAdd(setup, ['alpha'])
  await setup.worker.request('op.start', ADD(previewId, ['alpha']))
  await setup.worker.request('source.preview', { kind: 'path', text: tempDir('worker-source'), workspaceId: WS })
  assert.ok(logged('op=preview error=busy'))
  await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'beta' }, workspaceId: WS })
  assert.ok(logged('op=remove folder=beta error=busy'))
  gate.release()
  await settled(setup.worker)

  setup.focus('identity:none', [])
  await setup.worker.request('source.preview', { kind: 'path', text: tempDir('worker-source'), workspaceId: WS })
  assert.ok(logged('op=preview error=no-workspace'))
  await setup.worker.deactivate()
})

test('a search that fails in an unexpected way is logged before it is rethrown', async () => {
  const broken = (async () => ({
    get ok(): boolean {
      throw new Error('weird response')
    }
  })) as unknown as typeof fetch
  const setup = await boot({ deps: { fetch: broken } })
  await assert.rejects(setup.worker.request('search', { query: 'alp' }))
  assert.ok(setup.worker.logs.some((line) => line.includes('search failed: weird response')))
  await setup.worker.deactivate()
})

test('an add that throws after its trial disposes the trial and keeps the preview', async () => {
  const setup = await boot()
  const previewId = await previewAdd(setup, ['alpha'])
  const original = setup.lib.stage.bind(setup.lib)
  let trialsDisposed = 0
  setup.lib.stage = async (...args) => {
    const real = await original(...args)
    return {
      get staged(): never {
        throw new Error('staged list unreadable')
      },
      dispose: async () => {
        trialsDisposed++
        await real.dispose()
      }
    }
  }
  const answer = await setup.worker.request('op.start', ADD(previewId, ['alpha']))
  assert.equal(answer.ok, false)
  if (!answer.ok) assert.equal(answer.error.code, 'lib')
  assert.equal(trialsDisposed, 1, 'the trial folder is released')
  assert.equal((await stateOf(setup.worker)).busy, null)
  assert.ok(setup.worker.logs.some((line) => line.includes('op=add') && line.includes('error=lib')))

  // L'aperçu est toujours là : le même ajout, l'essai rétabli, réussit.
  setup.lib.stage = original
  assert.equal((await setup.worker.request('op.start', ADD(previewId, ['alpha']))).ok, true)
  assert.equal((await settled(setup.worker)).ok, true)
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

test('path.check says whether a typed path is a folder, without reading it as a source', async () => {
  const setup = await boot()
  mkdirSync(join(setup.root, 'skills-here'))
  writeFileSync(join(setup.root, 'a-file.txt'), 'x')
  mkdirSync(join(setup.home, 'dev'))
  const check = (text: string) => setup.worker.request('path.check', { text, workspaceId: WS })
  assert.deepEqual(await check('./skills-here'), { exists: true })
  assert.deepEqual(await check(join(setup.root, 'skills-here')), { exists: true })
  assert.deepEqual(await check('~/dev'), { exists: true })
  assert.deepEqual(await check(`  ${join(setup.home, 'dev')}/  `), { exists: true })
  assert.deepEqual(await check('./nowhere'), { exists: false })
  assert.deepEqual(await check('./a-file.txt'), { exists: false })
  // Rien n'est résolu ni copié : la bibliothèque n'est pas touchée.
  assert.deepEqual(setup.lib.calls.stage, [])
  setup.focus('identity:none', [])
  assert.deepEqual(await check('./skills-here'), { exists: false })
  await setup.worker.deactivate()
})

/** Un second espace (`identity:b`, autre projet) vers lequel le focus bascule, avec son propre `alpha`. */
function moveFocusToB(setup: Setup): string {
  const rootB = tempDir('worker-project-b')
  writeSkill(rootB, '.claude/skills', 'alpha')
  setup.focus('identity:b', [rowOf(setup.root), rowOf(rootB, { id: 'identity:b', projectId: 'p2', name: 'other' })])
  return rootB
}

test('a confirmed removal decided in workspace A touches nothing once the focus is on B', async () => {
  const setup = await boot()
  writeSkill(setup.root, '.claude/skills', 'alpha')
  const rootB = moveFocusToB(setup)
  const answer = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' }, workspaceId: WS })
  assert.deepEqual(answer, { ok: false, error: { code: 'workspace-changed' } })
  assert.equal(setup.trash.trashed.length, 0)
  assert.equal(setup.lib.calls.untrack.length, 0)
  assert.equal(finishedOps(setup.worker).length, 0)
  assert.deepEqual(readdirSync(join(rootB, '.claude/skills')), ['alpha'])
  assert.deepEqual(readdirSync(join(setup.root, '.claude/skills')), ['alpha'])
  assert.ok(setup.worker.logs.some((line) => line.includes('op=remove folder=alpha error=workspace-changed')))
  // Le même geste, décidé sur l'espace montré maintenant, passe.
  const retry = await setup.worker.request('op.start', { op: { kind: 'remove', folder: 'alpha' }, workspaceId: 'identity:b' })
  assert.equal(retry.ok, true)
  await settled(setup.worker)
  await setup.worker.deactivate()
})

test('the state tells the id of the focused workspace', async () => {
  const setup = await boot()
  const state = await stateOf(setup.worker)
  assert.equal(state.workspace.status === 'ready' ? state.workspace.id : null, WS)
  await setup.worker.deactivate()
})

test('a preview asked for a workspace that is no longer focused opens nothing', async () => {
  const setup = await boot()
  const { dir } = previewable(setup, ['alpha'])
  let resolved = 0
  const resolve = setup.lib.resolve
  setup.lib.resolve = async (...args) => {
    resolved++
    return resolve(...args)
  }
  moveFocusToB(setup)
  const answer = await setup.worker.request('source.preview', { kind: 'path', text: dir, workspaceId: WS })
  assert.deepEqual(answer, { ok: false, error: { code: 'workspace-changed' } })
  assert.equal(resolved, 0)
  const remote = await setup.worker.request('source.preview', { kind: 'remote', source: 'owner/repo', skillId: 'alpha', workspaceId: WS })
  assert.deepEqual(remote, { ok: false, error: { code: 'workspace-changed' } })
  assert.equal(resolved, 0)
  await setup.worker.deactivate()
})

test('a preview made in A is never installed into B', async () => {
  const setup = await boot()
  const previewId = await previewAdd(setup, ['beta'])
  const rootB = moveFocusToB(setup)
  // Ni avec l'identifiant de A (le focus a bougé), ni avec celui de B (l'aperçu a été lu pour A).
  assert.deepEqual(await setup.worker.request('op.start', ADD(previewId, ['beta'])), { ok: false, error: { code: 'workspace-changed' } })
  assert.deepEqual(await setup.worker.request('op.start', { ...ADD(previewId, ['beta']), workspaceId: 'identity:b' }), { ok: false, error: { code: 'workspace-changed' } })
  assert.equal(setup.lib.calls.install.length, 0)
  assert.equal(setup.lib.calls.stage.length, 0)
  assert.deepEqual(readdirSync(join(rootB, '.claude/skills')), ['alpha'])
  assert.equal(existsSync(join(setup.root, '.claude/skills/beta')), false)
  // L'aperçu de A a été rendu avec le refus.
  assert.deepEqual(await setup.worker.request('op.start', { ...ADD(previewId, ['beta']), workspaceId: 'identity:b' }), { ok: false, error: { code: 'preview-expired' } })
  await setup.worker.deactivate()
})

test('a path check asked for a workspace that is no longer focused is refused', async () => {
  const setup = await boot()
  const dir = tempDir('worker-source')
  moveFocusToB(setup)
  assert.deepEqual(await setup.worker.request('path.check', { text: dir, workspaceId: WS }), { exists: false, error: { code: 'workspace-changed' } })
  assert.deepEqual(await setup.worker.request('path.check', { text: dir, workspaceId: 'identity:b' }), { exists: true })
  await setup.worker.deactivate()
})

test('a source inside a managed folder of the project is refused before it is read', async () => {
  const setup = await boot()
  const inside = join(writeSkill(setup.root, '.claude/skills', 'alpha'), '..')
  let resolved = 0
  setup.lib.resolve = async () => {
    resolved++
    return setup.lib.source([{ name: 'alpha' }])
  }
  const sub = writeSkill(setup.root, '.agents/skills', 'beta')
  // Dessous un dossier géré, ou le contenant : la racine du projet, `.claude`, `.`, le parent du projet.
  const containing = ['.', './.claude', './.agents', '..', setup.root, join(setup.root, '..'), join(setup.root, '.claude'), join(setup.root, '.claude/skills')]
  for (const text of [inside, sub, join(setup.root, '.claude/skills/alpha'), '.claude/skills', ...containing]) {
    assert.deepEqual(await setup.worker.request('source.preview', { kind: 'path', text, workspaceId: WS }), { ok: false, error: { code: 'source-in-project' } }, text)
  }
  assert.equal(resolved, 0)
  assert.equal(setup.trash.trashed.length, 0)
  assert.equal(setup.lib.calls.stage.length + setup.lib.calls.install.length, 0)
  assert.ok(existsSync(join(setup.root, '.claude/skills/alpha')))
  assert.ok(setup.worker.logs.some((line) => line.includes('op=preview error=source-in-project')))
  // Un dossier du projet hors des dossiers gérés reste une source valable.
  const outside = join(setup.root, 'my-skills')
  mkdirSync(outside)
  assert.equal((await setup.worker.request('source.preview', { kind: 'path', text: outside, workspaceId: WS })).ok, true)
  await setup.worker.deactivate()
})

test('a WSL workspace on Windows is explained, never scanned, and its shape is logged only when it changes', async () => {
  const setup = await boot({ deps: { platform: 'win32' } })
  setup.focus('identity:x', [rowOf('/home/r/p')])
  const first = await stateOf(setup.worker)
  assert.deepEqual(first.workspace, { status: 'wsl' })
  assert.deepEqual(first.rows, [])
  await stateOf(setup.worker)
  assert.deepEqual(
    setup.worker.logs.filter((line) => line.startsWith('workspace root shape=')),
    ['workspace root shape=posix'],
    'an unchanged shape is not logged again, and the path is never logged'
  )
  await setup.worker.deactivate()
})

test('refocusing from a drive-letter workspace to a UNC one logs the new shape', async () => {
  const setup = await boot({ deps: { platform: 'win32' } })
  setup.focus('identity:x', [rowOf('C:\\dev\\p')])
  await stateOf(setup.worker)
  await stateOf(setup.worker)
  setup.focus('identity:x', [rowOf('\\\\srv\\share\\p')])
  await stateOf(setup.worker)
  await stateOf(setup.worker)
  assert.deepEqual(
    setup.worker.logs.filter((line) => line.startsWith('workspace root shape=')),
    ['workspace root shape=drive', 'workspace root shape=unc']
  )
  await setup.worker.deactivate()
})
