// Cœur du worker : seul écrivain du stockage, il répond au panneau, tient la file des gestes et les exclusions par projet.
// Toutes les dépendances (bibliothèque `skills`, Corbeille, sélecteur, réseau, inventaire) sont injectées : voir `worker.ts`
// pour les vraies, et les tests pour les factices. Aucune surveillance du disque en V1 : l'état est relu à l'ouverture du
// panneau, au changement d'espace, après chaque geste et sur demande (spec §5.2).
import { randomUUID } from 'node:crypto'
import { lstat, mkdir, realpath, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { JsonValue, OrcaWorkerApi } from 'orca/worker'
import { agentById, byLabel } from './agents'
import { EXCLUSIONS_KEY, exclude, excludedOf, include, parseExclusions, type Exclusions } from './exclusions'
import { HIDDEN_AGENTS_KEY, parseHiddenAgents, setHidden } from './hidden-agents'
import { listHistoryAgents } from './history'
import { detectAgents, type Inventory, type InventoryDeps } from './inventory'
import { addSkills, keepVersion, propagate, removeFromDir, removeSkill, type OpContext, type OpError, type OpResult } from './operations'
import { abbreviateHome, isInside, resolveInputPath } from './paths'
import type { AgentView, OpFinished, OpRequest, PanelState, PreviewAnswer, PreviewRequest, SearchAnswer, StartAnswer } from './protocol'
import { scanWorkspace } from './scan'
import { searchSkills, SearchError } from './search'
import { FALLBACK_DIRS, MANAGED_DIRS, skillCapable, TRUST_GATED, writeSet, type ManagedDir } from './skill-dirs'
import { sanitizeName, toLibDiagnostic, type LibDiagnostic, type ResolvedSource, type SkillsLib } from './skills-lib'
import type { Trasher, TrashStatus } from './trash'
import { buildRows, type LockEntry, type SourceLabel } from './visibility'
import { resolveWorkspace, type FocusedWorkspace, type HostCall, type WorkspaceView } from './workspace'

export type WorkerDeps = {
  lib: SkillsLib
  inventory: InventoryDeps
  /** `null` : pas de Corbeille sur cette machine. */
  trash: Trasher | null
  /** Pourquoi il n'y a pas de Corbeille quand `trash` est `null` : absente (`missing`) ou OS non vérifié (`unverified`). */
  trashStatus: Exclude<TrashStatus, 'network'>
  /** Test seul : remplace `realpath` pour résoudre l'espace focalisé (le worker réel utilise celui de `node:fs`). */
  realpath?: (path: string) => Promise<string>
  /** `null` : pas de sélecteur de dossier natif sur cette machine. */
  pickFolder: (() => Promise<string | null>) | null
  fetch: typeof fetch
  /** Base de l'API de recherche (`https://skills.sh` dans le worker réel, un serveur local dans les tests). */
  searchBase: string
  home: string
  tmpdir: string
  /** `process.platform` dans le worker réel. */
  platform: string
  /** `process.env` dans le worker réel : on n'en lit que la présence de quelques noms, pour le journal. */
  env: Readonly<Record<string, string | undefined>>
}

/** Variables d'environnement dont la présence aide à diagnostiquer un home ou une config déplacés. */
const ENV_NAMES = ['HOME', 'USERPROFILE', 'APPDATA', 'XDG_CONFIG_HOME', 'CLAUDE_CONFIG_DIR', 'CODEX_HOME']

/** Âge maximal d'un inventaire servi par `state.get` sans nouvelle sonde. */
const INVENTORY_TTL_MS = 10_000
/** Délai au bout duquel un aperçu abandonné libère sa source. */
const PREVIEW_TTL_MS = 10 * 60_000

type Stage = Awaited<ReturnType<SkillsLib['stage']>>
/** `workspaceId` et `root` : l'espace pour lequel la source a été lue ; un ajout n'écrit jamais ailleurs. */
type Preview = { id: string; source: ResolvedSource; workspaceId: string; root: string; timer: ReturnType<typeof setTimeout> | null }
/** `installed` : agents détectés qui gèrent les skills ; `hidden` : ceux que l'utilisateur a masqués ; `active` : les autres. */
type Agents = { installed: string[]; hidden: readonly string[]; active: string[]; fallback: boolean; writeDirs: readonly ManagedDir[] }

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const codeOf = (error: unknown): string => toLibDiagnostic(error).code
const libFailure = (error: unknown): OpError => ({ code: 'lib', diagnostics: [toLibDiagnostic(error)] })
/** `error=<code> lib=<codes>` : la fin commune des lignes de journal d'une erreur. */
function describeError(error: OpError): string {
  const codes = (error.diagnostics ?? []).map((diagnostic) => diagnostic.code).join(',')
  return `error=${error.code}${codes ? ` lib=${codes}` : ''}${error.trashed ? ' trashed' : ''}`
}
const folderOf = (op: OpRequest): string => (op.kind === 'add' ? op.names.join(',') : op.folder)
const WORKSPACE_CHANGED: OpError = { code: 'workspace-changed' }

/** Vrai si l'espace prêt est sur un chemin réseau (UNC sous Windows). */
const onNetwork = (view: WorkspaceView): boolean => view.status === 'ready' && view.network

/** Vrai si l'espace focalisé est celui que le panneau montrait (même identifiant) : tout autre focus refuse le geste. */
const isShownWorkspace = (focused: FocusedWorkspace, workspaceId: string): boolean => focused.view.status === 'ready' && focused.view.id === workspaceId

/**
 * Vrai si la source `path` recouvre les dossiers gérés du projet : elle est dessous, ou elle est la racine du projet, un
 * de ses ancêtres, ou un ancêtre d'un dossier géré. La bibliothèque cherche des skills dans la source et dans chaque
 * dossier de skills d'agent : une source qui les contient listerait les skills du projet, et un remplacement les
 * mettrait à la Corbeille avant d'installer depuis la copie mise à la Corbeille.
 */
async function overlapsManagedDirs(path: string, root: string): Promise<boolean> {
  const rootReal = await realpath(root).catch(() => null)
  const pathReal = await realpath(path).catch(() => null)
  if (rootReal === null || pathReal === null) return false
  // Racine du projet ou ancêtre de la racine : couvre aussi tout ancêtre d'un dossier géré situé sous la racine.
  if (isInside(rootReal, pathReal)) return true
  for (const dir of MANAGED_DIRS) {
    const expected = join(rootReal, dir)
    const candidates = [expected, await realpath(expected).catch(() => null)]
    for (const candidate of candidates) {
      if (candidate !== null && (isInside(pathReal, candidate) || isInside(candidate, pathReal))) return true
    }
  }
  return false
}

/** Dernière activation : `deactivate` libère ce qu'elle tient (aperçu ouvert, minuteur). */
let teardown: (() => Promise<void>) | null = null

export async function deactivate(): Promise<void> {
  await teardown?.()
}

/** Une `bibliothèque` dont le prochain `stage` rend l'essai déjà fait : le geste ne recopie pas la source une seconde fois. */
function reusingTrial(lib: SkillsLib, trial: Stage): SkillsLib {
  let spent = false
  return {
    ...lib,
    stage: (...args) => {
      if (spent) return lib.stage(...args)
      spent = true
      return Promise.resolve(trial)
    }
  }
}

export async function activateWith(orca: OrcaWorkerApi, deps: WorkerDeps): Promise<void> {
  const hostCall = orca.host.call.bind(orca.host) as unknown as HostCall
  // `resolveWorkspace` tourne à chaque lecture d'état : la forme de la racine n'est journalisée que quand elle change
  // (pas une fois par espace : un retour à une forme déjà vue après une autre est journalisé de nouveau).
  let lastShapeLine = ''
  const focusedWorkspace = () =>
    resolveWorkspace(
      hostCall,
      deps.home,
      deps.platform,
      (line) => {
        if (line.startsWith('workspace root shape=')) {
          if (line === lastShapeLine) return
          lastShapeLine = line
        }
        orca.log(line)
      },
      deps.realpath
    )
  let inventory: Inventory | null = null
  let probing: Promise<Inventory> | null = null
  let writing: Promise<unknown> = Promise.resolve()
  let current: OpRequest | null = null
  let preview: Preview | null = null
  /** Numéro du dernier aperçu demandé : un aperçu plus ancien qui finit après ne doit rien garder. */
  let previewTicket = 0
  /** Numéro du dernier état calculé pour un envoi : un état plus ancien qui finit après n'est pas posté. */
  let stateTicket = 0

  // --- Inventaire des agents (même cache de 10 s qu'Agent Profiles) ---

  function probe(): Promise<Inventory> {
    const log = (line: string) => orca.log(line)
    const readHistory = async () => {
      const seen = await listHistoryAgents(hostCall, (method) => orca.host.has(method), log)
      // Les seuls identifiants du catalogue, triés : jamais un titre de session.
      if (seen) log(`history agents=${[...seen].filter((id) => agentById(id) !== undefined).sort().join(',')}`)
      return seen
    }
    const run: Promise<Inventory> = detectAgents(deps.inventory, deps.home, readHistory, log)
      .then((next) => {
        inventory = next
        orca.log(`inventory source=${next.source} agents=${next.agents.length}`)
        return next
      })
      .finally(() => {
        if (probing === run) probing = null
      })
    probing = run
    return run
  }

  /**
   * Une demande de nouvelle sonde (`force`) n'attend pas une sonde déjà en vol : elle pourrait dater d'avant la demande.
   * `anyAge` : un inventaire déjà connu sert, même plus vieux que le délai (geste qui ne dépend pas d'une installation récente).
   */
  function listInventory(force: boolean, anyAge = false): Promise<Inventory> {
    if (!force && probing) return probing
    if (!force && inventory && (anyAge || deps.inventory.now() - inventory.detectedAt < INVENTORY_TTL_MS)) return Promise.resolve(inventory)
    return probe()
  }

  /** Agents actifs : installés et non masqués. Inventaire vide ou sans agent qui gère les skills : repli sur `.agents` et `.claude`. */
  async function agentsOf(force = false, anyAge = false): Promise<Agents> {
    let found: Inventory | null = null
    try {
      found = await listInventory(force, anyAge)
    } catch (error) {
      orca.log(`inventory failed: ${messageOf(error)}`)
    }
    // Ordre alphabétique des libellés : une liste de 16 agents dans l'ordre du catalogue d'Orca se parcourt mal.
    const installed = found ? byLabel(skillCapable(found.agents)) : []
    const hidden = await readHidden()
    const active = installed.filter((id) => !hidden.includes(id))
    if (active.length === 0) return { installed, hidden, active: [], fallback: true, writeDirs: FALLBACK_DIRS }
    return { installed, hidden, active, fallback: false, writeDirs: writeSet(active) }
  }

  // Les noms seuls des variables d'environnement utiles à la détection, jamais leurs valeurs (diagnostic multi-OS).
  const present = ENV_NAMES.filter((name) => deps.env[name] !== undefined)
  orca.log(`env present=${present.length > 0 ? present.join(',') : 'none'}`)

  // Au démarrage, sans bloquer l'activation : le premier état attend déjà la détection en cours.
  listInventory(false).catch((error: unknown) => orca.log(`inventory failed: ${messageOf(error)}`))

  // --- Stockage : une seule file pour toute écriture ---

  /** Les écritures passent une par une (lecture puis écriture des exclusions) : pas d'exclusion perdue. */
  function serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = writing.then(task)
    writing = run.catch(() => undefined)
    return run
  }

  const readExclusions = async (): Promise<Exclusions> => parseExclusions(await orca.storage.get(EXCLUSIONS_KEY))
  const writeExclusions = (next: Exclusions): Promise<void> => orca.storage.set(EXCLUSIONS_KEY, next as unknown as JsonValue)
  /** Un stockage illisible ne doit pas casser l'état : aucun agent masqué, et le journal le dit. */
  async function readHidden(): Promise<readonly string[]> {
    try {
      return parseHiddenAgents(await orca.storage.get(HIDDEN_AGENTS_KEY))
    } catch (error) {
      orca.log(`hidden agents unreadable: ${messageOf(error)}`)
      return []
    }
  }

  function updateExclusions(change: (current: Exclusions) => Exclusions): Promise<void> {
    return serialize(async () => {
      const current = await readExclusions()
      const next = change(current)
      if (next !== current) await writeExclusions(next)
    })
  }

  // --- État du panneau ---

  async function readLock(root: string): Promise<{ lock: ReadonlyMap<string, LockEntry>; unreadable: boolean }> {
    try {
      return { lock: await deps.lib.lockEntries(root), unreadable: false }
    } catch (error) {
      orca.log(`lock unreadable code=${codeOf(error)}`)
      return { lock: new Map(), unreadable: true }
    }
  }

  const agentViews = (active: readonly string[]): AgentView[] =>
    active.flatMap((id) => {
      const spec = agentById(id)
      return spec ? [{ id, label: spec.label, icon: spec.icon, trust: TRUST_GATED[id] ?? null }] : []
    })

  /** L'état est relu sur le disque ; une lecture n'écrit jamais : une exclusion ne tombe que par un geste (spec §5.4). */
  async function currentState(force = false, anyAge = false): Promise<PanelState> {
    const focused = await focusedWorkspace()
    const agents = await agentsOf(force, anyAge)
    const base = {
      workspace: focused.view,
      agents: agentViews(agents.active),
      detected: agentViews(agents.installed).map((view) => ({ ...view, hidden: agents.hidden.includes(view.id) })),
      inventory: agents.fallback ? ('fallback' as const) : ('detected' as const),
      capabilities: { trash: (onNetwork(focused.view) ? 'network' : deps.trashStatus) as TrashStatus, folderPicker: deps.pickFolder !== null },
      platform: deps.platform
    }
    if (!('root' in focused)) return { ...base, rows: [], unsafeDirs: [], lockUnreadable: false, busy: current }

    const { root, projectKey } = focused
    const scan = await scanWorkspace(root)
    const { lock, unreadable } = await readLock(root)
    const stored = await readExclusions()
    // Le disque prime à l'affichage (un agent qui voit la skill n'est jamais « exclu ») sans que le stockage change.
    const rows = buildRows(scan, lock, agents.active, (folder) => excludedOf(stored, projectKey, folder), deps.home)
    return { ...base, rows, unsafeDirs: scan.unsafeDirs, lockUnreadable: unreadable, busy: current }
  }

  /** Poste l'état au panneau ; un calcul plus récent lancé entre-temps prime. */
  async function postState(): Promise<void> {
    const ticket = ++stateTicket
    const state = await currentState()
    if (ticket === stateTicket) orca.panels.post('state.changed', state)
  }

  const postStateSafely = (): Promise<void> => postState().catch((error: unknown) => orca.log(`state failed: ${messageOf(error)}`))

  orca.panels.handle('state.get', () => currentState())
  orca.panels.handle('state.refresh', () => currentState(true))
  // Masquer ou montrer un agent : passe par la file des écritures, puis rend l'état recalculé (lu dans le cache d'inventaire).
  // Le cache sert quel que soit son âge : relancer la sonde (environ 2 s) à chaque bascule n'apporte rien à ce geste.
  orca.panels.handle('agents.setHidden', async ({ agent, hidden }) => {
    await serialize(async () => {
      // Lecture sans filet : un stockage illisible doit faire échouer le geste, pas réécrire la liste à partir de rien.
      const current = parseHiddenAgents(await orca.storage.get(HIDDEN_AGENTS_KEY))
      const { installed } = await agentsOf(false, true)
      const next = setHidden(current, installed, agent, hidden)
      if (next !== current) await orca.storage.set(HIDDEN_AGENTS_KEY, [...next])
    })
    return currentState(false, true)
  })
  orca.events.on('workspace.changed', () => postStateSafely())

  // --- Aperçu d'une source ---

  function releasePreview(): void {
    if (!preview) return
    if (preview.timer) clearTimeout(preview.timer)
    const { source } = preview
    preview = null
    source.dispose().catch((error: unknown) => orca.log(`preview dispose failed: ${messageOf(error)}`))
  }

  function armPreview(held: Preview): void {
    if (held.timer) clearTimeout(held.timer)
    held.timer = setTimeout(() => {
      if (preview === held) releasePreview()
    }, PREVIEW_TTL_MS)
    // Un minuteur en attente ne doit pas retenir le processus du worker.
    held.timer.unref?.()
  }

  /** La skill de la source que désigne un résultat de skills.sh : même nom sans tenir compte de la casse, sinon même nom assaini. */
  function pickByHit(source: ResolvedSource, skillId: string): { name: string; description: string } | undefined {
    return (
      source.skills.find((skill) => skill.name.toLowerCase() === skillId.toLowerCase()) ??
      source.skills.find((skill) => sanitizeName(skill.name) === sanitizeName(skillId))
    )
  }

  /** Une fonction plutôt qu'un test en ligne : TypeScript ne doit pas garder `current` rétréci à travers un `await`. */
  const addRunning = (): boolean => current?.kind === 'add'

  async function previewSource(request: PreviewRequest, signal: AbortSignal): Promise<PreviewAnswer> {
    // Un ajout en cours tient la source de l'aperçu : on n'en ouvre pas un autre par-dessus.
    if (addRunning()) return { ok: false, error: { code: 'busy' } }
    const focused = await focusedWorkspace()
    if (!('root' in focused)) return { ok: false, error: { code: 'no-workspace' } }
    if (!isShownWorkspace(focused, request.workspaceId)) return { ok: false, error: WORKSPACE_CHANGED }
    // Un ajout a pu démarrer pendant l'attente ci-dessus et prendre la source courante : le contrôle est refait, de façon
    // synchrone avec la libération, pour qu'aucun `await` ne s'intercale entre les deux.
    if (addRunning()) return { ok: false, error: { code: 'busy' } }

    const ticket = ++previewTicket
    releasePreview()
    let input: string
    let label: SourceLabel
    if (request.kind === 'path') {
      input = resolveInputPath(request.text.trim(), focused.root, deps.home)
      if (!(await stat(input).catch(() => null))) return { ok: false, error: { code: 'path-not-found' } }
      if (await overlapsManagedDirs(input, focused.root)) return { ok: false, error: { code: 'source-in-project' } }
      label = { kind: 'local', path: abbreviateHome(input, deps.home) }
    } else {
      input = request.source
      label = { kind: 'remote', source: request.source }
    }

    let source: ResolvedSource
    try {
      source = await deps.lib.resolve(input, focused.root)
    } catch (error) {
      return { ok: false, error: libFailure(error) }
    }

    let skills = source.skills.map(({ name, description }) => ({ name, description }))
    if (request.kind === 'remote') {
      const hit = pickByHit(source, request.skillId)
      if (!hit) {
        await source.dispose().catch(() => undefined)
        const missing = new Error(`No skill matches ${request.skillId} in ${request.source}`)
        return { ok: false, error: libFailure(Object.assign(missing, { code: 'SKILLS_NO_MATCHING_SKILLS' })) }
      }
      skills = [{ name: hit.name, description: hit.description }]
    }
    // Requête abandonnée (délai du panneau dépassé, panneau fermé) ou aperçu plus récent demandé pendant la lecture :
    // personne n'attend plus celui-ci, sa source est rendue au lieu d'être gardée orpheline.
    if (signal.aborted || ticket !== previewTicket) {
      await source.dispose().catch(() => undefined)
      return { ok: false, error: { code: 'preview-expired' } }
    }
    const held: Preview = { id: randomUUID(), source, workspaceId: request.workspaceId, root: focused.root, timer: null }
    armPreview(held)
    preview = held
    return { ok: true, previewId: held.id, label, skills, preselected: skills.map((skill) => skill.name) }
  }

  orca.panels.handle('source.preview', async (request, context) => {
    try {
      const answer = await previewSource(request, context.signal)
      if (!answer.ok) orca.log(`op=preview ${describeError(answer.error)}`)
      return answer
    } catch (error) {
      orca.log(`op=preview failed: ${messageOf(error)}`)
      throw error
    }
  })

  // --- Recherche ---

  /** Clés `dossier + source` des skills du projet suivies au lock : de quoi marquer un résultat « installé ». */
  async function installedKeys(): Promise<Set<string>> {
    try {
      const focused = await focusedWorkspace()
      if (!('root' in focused)) return new Set()
      const [scan, { lock }] = await Promise.all([scanWorkspace(focused.root), readLock(focused.root)])
      const keys = new Set<string>()
      for (const skill of scan.skills) {
        const entry = lock.get(skill.folder)
        if (entry) keys.add(`${skill.folder}\n${entry.source}`)
      }
      return keys
    } catch (error) {
      orca.log(`installed lookup failed: ${messageOf(error)}`)
      return new Set()
    }
  }

  orca.panels.handle('search', async ({ query }, context): Promise<SearchAnswer> => {
    if (query.trim() === '') return { ok: true, hits: [] }
    try {
      const hits = await searchSkills(query, { base: deps.searchBase, fetch: deps.fetch, signal: context.signal })
      const installed = await installedKeys()
      return { ok: true, hits: hits.map((hit) => ({ ...hit, installed: installed.has(`${hit.skillId}\n${hit.source}`) })) }
    } catch (error) {
      if (!(error instanceof SearchError)) {
        orca.log(`search failed: ${messageOf(error)}`)
        throw error
      }
      orca.log(`search failed code=${error.code}`)
      return { ok: false, error: error.code }
    }
  })

  orca.panels.handle('path.check', async ({ text, workspaceId }) => {
    const focused = await focusedWorkspace()
    if (!('root' in focused)) return { exists: false }
    if (!isShownWorkspace(focused, workspaceId)) return { exists: false, error: WORKSPACE_CHANGED }
    const info = await stat(resolveInputPath(text.trim(), focused.root, deps.home)).catch(() => null)
    return { exists: info?.isDirectory() ?? false }
  })

  orca.panels.handle('folder.pick', async () => {
    if (!deps.pickFolder) return { path: null }
    try {
      return { path: await deps.pickFolder() }
    } catch (error) {
      orca.log(`folder picker failed: ${messageOf(error)}`)
      return { path: null }
    }
  })

  // --- Gestes ---

  /** Une ligne par erreur ou avertissement, avec le code et le dossier : de quoi retrouver le geste sans ouvrir le panneau. */
  function logError(op: OpRequest, error: OpError): void {
    orca.log(`op=${op.kind} folder=${folderOf(op)} ${describeError(error)}`)
  }

  function logWarnings(op: OpRequest, warnings: readonly LibDiagnostic[]): void {
    for (const warning of warnings) orca.log(`op=${op.kind} folder=${folderOf(op)} warning=${warning.code}`)
  }

  /** Change des exclusions que le résultat d'un geste réussi impose, ou `null` quand le geste n'y touche pas. */
  function exclusionChange(op: OpRequest, result: Extract<OpResult, { ok: true }>, projectKey: string): ((ex: Exclusions) => Exclusions) | null {
    switch (op.kind) {
      case 'remove-dir':
        // La dernière copie retirée vaut un retrait complet : plus rien à exclure.
        return result.removedAll
          ? (ex) => include(ex, projectKey, op.folder)
          : (ex) => exclude(ex, projectKey, op.folder, result.lostAgents)
      case 'propagate':
        return (ex) => include(ex, projectKey, op.folder, op.agents)
      case 'reinstate':
        return (ex) => include(ex, projectKey, op.folder, [op.agent])
      case 'remove':
        return (ex) => include(ex, projectKey, op.folder)
      case 'add':
      case 'keep':
        return null
    }
  }

  /**
   * Essai et contrôle de collision d'un ajout, avant de répondre. L'essai (`stage`) sert de source au geste : la
   * bibliothèque rendue ne le refait pas. Renvoie l'erreur à répondre, ou le contexte du geste.
   */
  async function prepareAdd(
    op: Extract<OpRequest, { kind: 'add' }>,
    ctx: OpContext,
    held: Preview
  ): Promise<{ error: OpError } | { ctx: OpContext }> {
    await mkdir(ctx.tmpdir, { recursive: true })
    let trial: Stage
    try {
      trial = await ctx.lib.stage(held.source, op.names, ctx.tmpdir)
    } catch (error) {
      return { error: libFailure(error) }
    }
    const refuse = async (error: OpError) => {
      await trial.dispose().catch(() => undefined)
      return { error }
    }

    // Une exception après l'essai ne doit pas laisser son dossier : l'appelant répond l'erreur, nous rendons l'essai.
    try {
      const unsafe = new Set((await scanWorkspace(ctx.root)).unsafeDirs)
      const dirs = ctx.writeDirs.filter((dir) => !unsafe.has(dir))
      const colliding: string[] = []
      for (const { folder } of trial.staged) {
        for (const dir of dirs) {
          if ((await lstat(join(ctx.root, dir, folder)).catch(() => null)) === null) continue
          if (!colliding.includes(folder)) colliding.push(folder)
        }
      }
      if (colliding.length > 0) {
        if (!op.replace) return await refuse({ code: 'collision', folders: colliding })
        if (!ctx.trash) return await refuse({ code: ctx.noTrashCode })
      }
      return { ctx: { ...ctx, lib: reusingTrial(ctx.lib, trial) } }
    } catch (error) {
      await trial.dispose().catch(() => undefined)
      throw error
    }
  }

  function runOp(op: OpRequest, ctx: OpContext, held: Preview | null): Promise<OpResult> {
    switch (op.kind) {
      case 'add':
        return addSkills(ctx, held!.source, op.names, op.replace)
      case 'propagate':
        return propagate(ctx, op.folder, op.agents)
      case 'keep':
        return keepVersion(ctx, op.folder, op.hash)
      case 'remove':
        return removeSkill(ctx, op.folder)
      case 'remove-dir':
        return removeFromDir(ctx, op.folder, op.dir)
      case 'reinstate':
        return propagate(ctx, op.folder, [op.agent])
    }
  }

  /** Le geste, détaché de la requête : son `signal` ne l'arrête jamais. À la fin, exclusions, `op.finished`, puis l'état. */
  async function execute(opId: string, op: OpRequest, ctx: OpContext, held: Preview | null, projectKey: string): Promise<void> {
    let result: OpResult
    try {
      result = await runOp(op, ctx, held)
    } catch (error) {
      result = { ok: false, error: libFailure(error) }
    }
    // Seule la source tenue par ce geste est rendue : un aperçu plus récent n'est pas le sien.
    if (op.kind === 'add' && held && preview === held) releasePreview()
    // Le geste a réussi mais les exclusions n'ont pas pu être écrites : succès, avec un avertissement que le panneau montre.
    const extra: LibDiagnostic[] = []
    try {
      const change = result.ok ? exclusionChange(op, result, projectKey) : null
      if (change) await updateExclusions(change)
    } catch (error) {
      orca.log(`op=${op.kind} folder=${folderOf(op)} warning=PLUGIN_EXCLUSIONS_FAILED`)
      extra.push({ code: 'PLUGIN_EXCLUSIONS_FAILED', message: messageOf(error) })
    }
    if (result.ok) logWarnings(op, result.warnings)
    else logError(op, result.error)
    current = null
    const finished: OpFinished = result.ok
      ? { opId, op, ok: true, warnings: [...result.warnings, ...extra] }
      : { opId, op, ok: false, error: result.error, warnings: [] }
    orca.panels.post('op.finished', finished)
    await postStateSafely()
  }

  async function startOp(op: OpRequest, workspaceId: string): Promise<StartAnswer> {
    const refuse = (error: OpError): StartAnswer => {
      logError(op, error)
      return { ok: false, error }
    }
    const focused = await focusedWorkspace()
    if (!('root' in focused)) return refuse({ code: 'no-workspace' })
    // Le geste a été décidé sur l'espace que le panneau montrait : si le focus a bougé depuis, rien n'est touché.
    if (!isShownWorkspace(focused, workspaceId)) return refuse(WORKSPACE_CHANGED)
    const agents = await agentsOf()
    const network = onNetwork(focused.view)
    let ctx: OpContext = {
      root: focused.root,
      home: deps.home,
      lib: deps.lib,
      // Sur un chemin réseau, la Corbeille système n'atteint pas le partage : aucun geste destructif, avant tout appel.
      trash: network ? null : deps.trash,
      noTrashCode: network ? 'network-path' : deps.trashStatus === 'unverified' ? 'trash-unverified' : 'no-trash',
      tmpdir: deps.tmpdir,
      writeDirs: agents.writeDirs,
      active: agents.active
    }

    let held: Preview | null = null
    if (op.kind === 'add') {
      held = preview?.id === op.previewId ? preview : null
      if (!held) return refuse({ code: 'preview-expired' })
      // Un aperçu lu pour un autre espace n'est jamais ajouté ici : il est rendu avec le refus.
      if (held.workspaceId !== workspaceId || held.root !== focused.root) {
        releasePreview()
        return refuse(WORKSPACE_CHANGED)
      }
      // Le minuteur ne doit pas rendre la source en plein geste ; un refus le réarme.
      if (held.timer) clearTimeout(held.timer)
      let prepared: Awaited<ReturnType<typeof prepareAdd>>
      try {
        prepared = await prepareAdd(op, ctx, held)
      } catch (error) {
        armPreview(held)
        return refuse(libFailure(error))
      }
      if ('error' in prepared) {
        armPreview(held)
        return refuse(prepared.error)
      }
      ctx = prepared.ctx
    }

    const opId = randomUUID()
    execute(opId, op, ctx, held, focused.projectKey).catch((error: unknown) => {
      current = null
      orca.log(`op=${op.kind} folder=${folderOf(op)} failed: ${messageOf(error)}`)
    })
    return { ok: true, opId }
  }

  orca.panels.handle('op.start', async ({ op, workspaceId }): Promise<StartAnswer> => {
    if (current) {
      logError(op, { code: 'busy' })
      return { ok: false, error: { code: 'busy' } }
    }
    // Pris avant tout `await` : deux requêtes rapprochées ne passent jamais toutes les deux.
    current = op
    let started = false
    try {
      const answer = await startOp(op, workspaceId)
      started = answer.ok
      return answer
    } catch (error) {
      orca.log(`op=${op.kind} folder=${folderOf(op)} failed: ${messageOf(error)}`)
      throw error
    } finally {
      if (!started) current = null
    }
  })

  teardown = async () => {
    releasePreview()
  }
}

