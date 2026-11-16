// État du panneau Skills et gestes : atomes, requêtes au worker, recherche avec compteur de génération.
// Aucun rendu ici : panel.tsx, panel-row.tsx et panel-search.tsx dessinent ce que ce module tient.
import { atom, plugin, set, update, type PanelContext } from 'orca'
import type { OpError } from './operations'
import { isPathInput } from './path-input'
import type { OpFinished, OpRequest, PanelState, PreviewAnswer, PreviewRequest, SearchAnswer, StartAnswer } from './protocol'
import type { ManagedDir } from './skill-dirs'
import type { LibDiagnostic } from './skills-lib'
import type { SourceLabel } from './visibility'

/** Pause de frappe avant une recherche ou un aperçu de chemin. */
export const SEARCH_DELAY_MS = 300
/** Nombre minimal de caractères pour chercher ou lire un chemin. */
export const MIN_QUERY_LENGTH = 2
/** Aperçu, geste et sélecteur de dossier : le worker peut cloner un dépôt ou attendre l'utilisateur. */
const LONG_TIMEOUT_MS = 120000

type Hit = Extract<SearchAnswer, { ok: true }>['hits'][number]

export type SearchView =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; hits: Hit[] }
  | { status: 'failed'; error: 'unreachable' | 'http' | 'unreadable' }

/** Ce que le worker a lu d'une source, en attente du clic « Ajouter ». `origin` : le champ (chemin) ou un résultat de skills.sh. */
export type AddFlow =
  | { status: 'loading'; origin: 'path' | 'hit' }
  | { status: 'failed'; error: OpError | null; message: string | null }
  | { status: 'ready'; origin: 'path' | 'hit'; previewId: string; label: SourceLabel; skills: { name: string; description: string }[]; selected: string[] }

export type PathCheck = { status: 'checking' } | { status: 'found'; text: string } | { status: 'missing' }

/** Confirmation en ligne : un seul geste destructeur à la fois attend un oui. */
export type Confirm =
  | { kind: 'replace'; previewId: string; names: string[]; folders: string[] }
  | { kind: 'remove'; folder: string }
  | { kind: 'remove-dir'; folder: string; dir: ManagedDir }

/** Ce qu'un geste laisse sous sa ligne : une erreur (ou un message brut de l'hôte) et des avertissements. */
export type Note = { error: OpError | null; message: string | null; warnings: LibDiagnostic[] }

/** Dernier état annoncé par le worker ; `null` tant qu'il n'a pas répondu. */
export const panelState = atom<PanelState | null>(null)
/** Pourquoi la lecture de l'état a échoué, le cas échéant. */
export const loadError = atom<string | null>(null)
/** Vrai tant qu'une demande ⟳ attend la sonde du worker. */
export const refreshing = atom(false)
/** Texte du champ : ce qu'il contient décide de ce que montre la liste. */
export const query = atom('')
export const searchView = atom<SearchView>({ status: 'idle' })
export const addFlow = atom<AddFlow | null>(null)
/** Ce que `path.check` a répondu pour le chemin tapé : la ligne « Ajouter depuis ce dossier » ou « Dossier introuvable ». */
export const pathCheck = atom<PathCheck | null>(null)
export const confirmation = atom<Confirm | null>(null)
/** Le geste lancé par ce panneau, de l'appui jusqu'à `op.finished` ; `panelState.busy` dit celui du worker. */
export const pending = atom<OpRequest | null>(null)
/** Notes par dossier de skill. */
export const notes = atom<Record<string, Note>>({})
/** Note des ajouts, sous le champ. */
export const addNote = atom<Note | null>(null)
/** Dossiers dont la ligne est dépliée. */
export const expandedRows = atom<string[]>([])
/** Dossiers dont les pastilles repliées en résumé sont dépliées. */
export const unfoldedChips = atom<string[]>([])

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const errorCodeOf = (error: unknown): string | undefined => (error as { code?: string } | null)?.code
const emptyNote = (): Note => ({ error: null, message: null, warnings: [] })

// --- Variables de module : tout ce qui ne se dessine pas ---

/** Incrémenté à chaque frappe : une réponse qui revient avec un autre numéro est périmée et ignorée. */
let generation = 0
let searchTimer: ReturnType<typeof setTimeout> | null = null
/** Texte du champ, pour les gestionnaires qui ne lisent pas les atomes. */
let currentQuery = ''
/** Identité de l'espace de la dernière lecture : un autre espace efface ce que le champ préparait. */
let workspaceKey: string | null = null
/** Identifiant de l'espace montré : chaque demande au worker le renvoie, pour qu'il refuse d'agir sur un autre espace. */
let shownWorkspaceId = ''
/** Numéro de la dernière lecture d'état demandée : une lecture plus ancienne qui finit après n'est pas gardée. */
let stateTicket = 0
/** Vrai entre l'appui et la réponse de `op.start` : un état poussé alors ne dit rien du geste qui part. */
let starting = false

function stopTimer(): void {
  if (searchTimer !== null) clearTimeout(searchTimer)
  searchTimer = null
}

/** Annule la recherche ou l'aperçu en cours : leur réponse sera ignorée. */
function supersede(): number {
  stopTimer()
  generation += 1
  return generation
}

function resetField(): void {
  supersede()
  set(pathCheck, null)
  currentQuery = ''
  set(query, '')
  set(searchView, { status: 'idle' })
  set(addFlow, null)
  set(addNote, null)
  update(confirmation, (current) => (current?.kind === 'replace' ? null : current))
}

/** Un autre espace : rien de ce qui était préparé pour le précédent ne doit partir dans celui-ci. */
function resetAll(): void {
  resetField()
  set(confirmation, null)
  set(notes, {})
  set(expandedRows, [])
  set(unfoldedChips, [])
}

// --- État ---

function applyState(next: PanelState): void {
  // Le worker ne tient aucun geste (redémarré en plein geste, ou fini sans que `op.finished` nous soit parvenu) : ne plus attendre.
  if (next.busy === null && !starting) set(pending, null)
  const key = JSON.stringify(next.workspace)
  if (workspaceKey !== null && key !== workspaceKey) resetAll()
  workspaceKey = key
  shownWorkspaceId = next.workspace.status === 'ready' ? next.workspace.id : ''
  set(panelState, next)
  set(loadError, null)
}

/** Un état poussé par le worker est plus récent que toute lecture encore en vol : celle-ci ne doit pas l'écraser. */
function applyPushed(next: PanelState): void {
  stateTicket += 1
  applyState(next)
}

export async function loadState(request: 'state.get' | 'state.refresh' = 'state.get'): Promise<void> {
  const ticket = ++stateTicket
  try {
    const next = await plugin.request(request)
    if (ticket === stateTicket) applyState(next)
  } catch (error) {
    if (ticket === stateTicket) set(loadError, messageOf(error))
  }
}

export async function refreshState(): Promise<void> {
  set(refreshing, true)
  try {
    await loadState('state.refresh')
  } finally {
    set(refreshing, false)
  }
}

// --- Champ : recherche et aperçu d'un chemin ---

async function runSearch(text: string, gen: number): Promise<void> {
  set(searchView, { status: 'loading' })
  try {
    const answer = await plugin.request('search', { query: text })
    if (gen !== generation) return
    set(searchView, answer.ok ? { status: 'done', hits: answer.hits } : { status: 'failed', error: answer.error })
  } catch {
    // Une réponse d'une requête dépassée ne dit rien de la requête courante.
    if (gen !== generation) return
    set(searchView, { status: 'failed', error: 'unreachable' })
  }
}

/** Un chemin tapé n'est pas lu comme une source : un `stat` côté worker dit seulement si le dossier existe. */
async function runPathCheck(text: string, gen: number): Promise<void> {
  set(pathCheck, { status: 'checking' })
  try {
    const answer = await plugin.request('path.check', { text, workspaceId: shownWorkspaceId })
    if (gen !== generation) return
    if (answer.error) {
      set(pathCheck, null)
      set(addNote, { ...emptyNote(), error: answer.error })
      return
    }
    set(pathCheck, answer.exists ? { status: 'found', text } : { status: 'missing' })
  } catch (error) {
    if (gen !== generation) return
    set(pathCheck, null)
    set(addNote, { ...emptyNote(), message: messageOf(error) })
  }
}

function run(text: string, gen: number): void {
  void (isPathInput(text) ? runPathCheck(text, gen) : runSearch(text, gen))
}

/** Lance la recherche ou l'aperçu pour le texte du champ, après `delay` ms ; en dessous du minimum, la liste du projet revient. */
function schedule(value: string, delay: number): void {
  const gen = supersede()
  set(searchView, { status: 'idle' })
  set(pathCheck, null)
  set(addFlow, null)
  const text = value.trim()
  if (text.length < MIN_QUERY_LENGTH) return
  if (delay <= 0) return run(text, gen)
  searchTimer = setTimeout(() => {
    searchTimer = null
    run(text, gen)
  }, delay)
}

export function onQueryChange(value: string): void {
  currentQuery = value
  set(query, value)
  set(addNote, null)
  update(confirmation, (current) => (current?.kind === 'replace' ? null : current))
  schedule(value, SEARCH_DELAY_MS)
}

/** Entrée : sans attendre la pause de frappe ; sur un chemin, comme un appui sur la ligne « Ajouter depuis ce dossier ». */
export function submitQuery(value: string): void {
  currentQuery = value
  const text = value.trim()
  if (text.length >= MIN_QUERY_LENGTH && isPathInput(text)) {
    void readPath(text)
    return
  }
  schedule(value, 0)
}

export function clearQuery(): void {
  resetField()
}

/** Bouton dossier : le chemin choisi va dans le champ, la ligne « Ajouter depuis ce dossier » apparaît (comme après une frappe). */
export async function pickFolder(): Promise<void> {
  try {
    const answer = await plugin.request('folder.pick', undefined, { timeoutMs: LONG_TIMEOUT_MS })
    if (answer.path === null) return
    currentQuery = answer.path
    set(query, answer.path)
    set(addNote, null)
    schedule(answer.path, 0)
  } catch (error) {
    // Le délai de l'utilisateur dépassé n'est pas une erreur à lui montrer.
    if (errorCodeOf(error) === 'timeout') return
    set(addNote, { ...emptyNote(), message: messageOf(error) })
  }
}

export function toggleSkill(name: string, checked: boolean): void {
  update(addFlow, (flow) => {
    if (flow?.status !== 'ready') return flow
    const wanted = new Set(flow.selected)
    if (checked) wanted.add(name)
    else wanted.delete(name)
    // L'ordre de la source, pas celui des clics.
    return { ...flow, selected: flow.skills.map((skill) => skill.name).filter((each) => wanted.has(each)) }
  })
  // Un « Remplacer » en attente portait l'ancienne sélection : changer les cases l'annule, le prochain appui sur « Ajouter » refait le contrôle.
  update(confirmation, (current) => (current?.kind === 'replace' ? null : current))
}

// --- Gestes ---

const folderOf = (op: OpRequest): string | null => (op.kind === 'add' ? null : op.folder)

function putNote(folder: string | null, note: Note | null): void {
  if (folder === null) return set(addNote, note)
  update(notes, (all) => {
    const { [folder]: _dropped, ...rest } = all
    return note === null ? rest : { ...rest, [folder]: note }
  })
}

/** Lance un geste. Le panneau tient `pending` dès l'appui : `op.finished` peut arriver avant la réponse. */
export async function startOp(op: OpRequest): Promise<void> {
  set(pending, op)
  set(confirmation, null)
  putNote(folderOf(op), null)
  let answer: StartAnswer
  starting = true
  try {
    answer = await plugin.request('op.start', { op, workspaceId: shownWorkspaceId }, { timeoutMs: LONG_TIMEOUT_MS })
  } catch (error) {
    starting = false
    set(pending, null)
    putNote(folderOf(op), { ...emptyNote(), message: messageOf(error) })
    return
  }
  starting = false
  if (answer.ok) return
  set(pending, null)
  if (op.kind === 'add' && answer.error.code === 'collision') {
    set(confirmation, { kind: 'replace', previewId: op.previewId, names: op.names, folders: answer.error.folders ?? [] })
    return
  }
  putNote(folderOf(op), { ...emptyNote(), error: answer.error })
}

/**
 * Lit une source (appui sur la ligne d'un chemin, ou « Ajouter » d'un résultat de skills.sh) : ajout direct quand elle ne porte
 * qu'une skill, liste à cases quand elle en porte plusieurs. Un chemin garde son échec dans le champ, un résultat sous le champ.
 */
async function readSource(request: PreviewRequest, origin: 'path' | 'hit'): Promise<void> {
  const gen = supersede()
  set(addNote, null)
  set(pathCheck, null)
  set(addFlow, { status: 'loading', origin })
  const fail = (error: OpError | null, message: string | null): void => {
    if (origin === 'path') set(addFlow, { status: 'failed', error, message })
    else {
      set(addFlow, null)
      set(addNote, { ...emptyNote(), error, message })
    }
  }
  let answer: PreviewAnswer
  try {
    answer = await plugin.request('source.preview', request, { timeoutMs: LONG_TIMEOUT_MS })
  } catch (error) {
    if (gen === generation) fail(null, messageOf(error))
    return
  }
  if (gen !== generation) return
  if (!answer.ok) return fail(answer.error, null)
  const [only] = answer.skills
  if (only && answer.skills.length === 1) {
    set(addFlow, null)
    await startOp({ kind: 'add', previewId: answer.previewId, names: [only.name], replace: false })
    return
  }
  set(addFlow, { status: 'ready', origin, previewId: answer.previewId, label: answer.label, skills: answer.skills, selected: answer.preselected })
}

export const addHit = (hit: { source: string; skillId: string }): Promise<void> => readSource({ kind: 'remote', source: hit.source, skillId: hit.skillId, workspaceId: shownWorkspaceId }, 'hit')

/** Appui sur la ligne « Ajouter depuis ce dossier ». */
export const readPath = (text: string): Promise<void> => readSource({ kind: 'path', text, workspaceId: shownWorkspaceId }, 'path')

function applyFinished(finished: OpFinished): void {
  set(pending, null)
  update(panelState, (state) => (state ? { ...state, busy: null } : state))
  set(confirmation, null)
  const note: Note = { error: finished.ok ? null : (finished.error ?? null), message: null, warnings: finished.warnings }
  const hasNote = note.error !== null || note.warnings.length > 0
  const { op } = finished
  if (op.kind === 'add') {
    if (finished.ok) {
      resetField()
      putNote(null, hasNote ? note : null)
    } else {
      // L'aperçu est rendu avec le geste : un chemin se relit, une source de skills.sh se choisit de nouveau.
      const text = currentQuery
      set(addFlow, null)
      putNote(null, note)
      if (isPathInput(text.trim())) schedule(text, 0)
    }
  } else {
    putNote(op.folder, hasNote ? note : null)
  }
  void loadState()
}

// --- Lignes ---

export function toggleExpanded(folder: string): void {
  update(expandedRows, (open) => (open.includes(folder) ? open.filter((each) => each !== folder) : [...open, folder]))
}

export function toggleChips(folder: string): void {
  update(unfoldedChips, (open) => (open.includes(folder) ? open.filter((each) => each !== folder) : [...open, folder]))
}

export const askConfirmation = (next: Confirm): void => set(confirmation, next)
export const cancelConfirmation = (): void => {
  let wasReplace = false
  update(confirmation, (current) => {
    wasReplace = current?.kind === 'replace'
    return null
  })
  // Le « Remplacer » annulé a laissé le champ sur son chemin : la ligne « Ajouter depuis ce dossier » revient.
  if (wasReplace && isPathInput(currentQuery.trim())) schedule(currentQuery, 0)
}

/** Tourne une fois avant le premier rendu ; ce qui est poussé dans `subscriptions` s'arrête avec le panneau. */
export function setup(ctx: PanelContext): void {
  generation = 0
  currentQuery = ''
  workspaceKey = null
  shownWorkspaceId = ''
  stateTicket = 0
  starting = false
  stopTimer()
  ctx.subscriptions.push(plugin.on('state.changed', applyPushed))
  ctx.subscriptions.push(plugin.on('op.finished', applyFinished))
  // Une frappe encore en attente ne doit pas parler à un panneau fermé.
  ctx.subscriptions.push({ dispose: () => void supersede() })
  void loadState()
}
