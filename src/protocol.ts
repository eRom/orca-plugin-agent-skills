// Contrat panneau <-> worker, déclaré une fois par fusion de déclarations sur `orca` (gabarit worker-panel d'Orca).
import type { OpError } from './operations'
import type { SearchError, SearchHit } from './search'
import type { ManagedDir } from './skill-dirs'
import type { LibDiagnostic } from './skills-lib'
import type { SkillRow, SourceLabel } from './visibility'
import type { WorkspaceView } from './workspace'

/** `trust` : l'agent ne lit le dossier que sous condition (Hermes, Mistral Vibe) ; le panneau le dit. */
export type AgentView = { id: string; label: string; icon: string; trust: 'hermes' | 'vibe' | null }

/** Tout ce que le panneau affiche. `busy` : le geste en cours, `null` au repos (et après un redémarrage du worker). */
export type PanelState = {
  workspace: WorkspaceView
  /** Agents actifs : installés et non masqués. */
  agents: AgentView[]
  /** Tous les agents installés qui gèrent les skills, masqués compris : la liste du réglage « Agents ». */
  detected: (AgentView & { hidden: boolean })[]
  inventory: 'detected' | 'fallback'
  rows: SkillRow[]
  unsafeDirs: ManagedDir[]
  lockUnreadable: boolean
  capabilities: { trash: boolean; folderPicker: boolean }
  /** `process.platform` du worker : le panneau en tire les formes de chemin qu'il reconnaît dans le champ. */
  platform: string
  busy: OpRequest | null
}

export type SearchAnswer = { ok: true; hits: (SearchHit & { installed: boolean })[] } | { ok: false; error: SearchError['code'] }

/** `workspaceId` : l'espace que le panneau montrait ; le worker refuse (`workspace-changed`) si le focus a bougé depuis. */
export type PreviewRequest = { workspaceId: string } & ({ kind: 'remote'; source: string; skillId: string } | { kind: 'path'; text: string })

export type PreviewAnswer =
  | { ok: true; previewId: string; label: SourceLabel; skills: { name: string; description: string }[]; preselected: string[] }
  | { ok: false; error: OpError }

export type OpRequest =
  | { kind: 'add'; previewId: string; names: string[]; replace: boolean }
  | { kind: 'propagate'; folder: string; agents: string[] }
  | { kind: 'keep'; folder: string; hash: string }
  | { kind: 'remove'; folder: string }
  | { kind: 'remove-dir'; folder: string; dir: ManagedDir }
  | { kind: 'reinstate'; folder: string; agent: string }

/** `opId` : identifie le geste dont `op.finished` rendra compte, après la réponse. */
export type StartAnswer = { ok: true; opId: string } | { ok: false; error: OpError }

export type OpFinished = { opId: string; op: OpRequest; ok: boolean; error?: OpError; warnings: LibDiagnostic[] }

declare module 'orca' {
  interface PluginRequests {
    /** État complet, relu sur le disque (inventaire des agents servi depuis le cache de 10 s). */
    'state.get': { output: PanelState }
    /** Comme `state.get`, avec une nouvelle sonde des agents. */
    'state.refresh': { output: PanelState }
    'search': { input: { query: string }; output: SearchAnswer }
    'source.preview': { input: PreviewRequest; output: PreviewAnswer }
    /** Répond tout de suite (sauf pour `add`, dont l'essai et le contrôle de collision précèdent la réponse) ; `op.finished` suit. */
    'op.start': { input: { op: OpRequest; workspaceId: string }; output: StartAnswer }
    'folder.pick': { output: { path: string | null } }
    /** Masque ou montre un agent pour tous les projets ; refuse en silence de masquer le dernier visible. Rend l'état. */
    'agents.setHidden': { input: { agent: string; hidden: boolean }; output: PanelState }
    /** Vrai si le texte tapé désigne un dossier (relatif à l'espace, ou `~`) : un `stat`, la source n'est pas lue. `error` : l'espace a changé. */
    'path.check': { input: { text: string; workspaceId: string }; output: { exists: boolean; error?: OpError } }
  }
  interface PluginPanelEvents {
    'state.changed': PanelState
    'op.finished': OpFinished
  }
}
