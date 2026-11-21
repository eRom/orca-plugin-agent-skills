// `orca plugin check` dessine le panneau une fois par scénario, en sombre puis en clair ; le worker est remplacé par un état figé.
import { defineCheck } from 'orca/testing'
import type { AgentView, PanelState } from './protocol'
import type { CopyKind } from './scan'
import type { ManagedDir } from './skill-dirs'
import type { SkillRow } from './visibility'

// Triés par libellé, comme le worker les sert au panneau.
const AGENTS: AgentView[] = [
  { id: 'antigravity', label: 'Antigravity', icon: 'agent-icons/antigravity.png', trust: null },
  { id: 'claude', label: 'Claude', icon: 'agent-icons/claude.png', trust: null },
  { id: 'codex', label: 'Codex', icon: 'agent-icons/codex.png', trust: null },
  { id: 'dsh', label: 'DeepSeek Harness', icon: 'agent-icons/dsh.png', trust: null },
  { id: 'grok', label: 'Grok', icon: 'agent-icons/grok.png', trust: null },
  { id: 'opencode', label: 'OpenCode', icon: 'agent-icons/opencode.png', trust: null },
  { id: 'pi', label: 'Pi', icon: 'agent-icons/pi.png', trust: null }
]

/** Qui lit quel dossier, pour les sept agents de Romain. */
const READERS: Record<ManagedDir, string[]> = {
  '.agents/skills': ['codex', 'opencode', 'pi', 'antigravity', 'dsh'],
  '.claude/skills': ['claude', 'opencode'],
  '.grok/skills': ['grok'],
  '.kiro/skills': [],
  '.qoder/skills': [],
  '.codebuddy/skills': [],
  '.zcode/skills': [],
  '.trae/skills': [],
  '.openclaude/skills': [],
  '.prime/agent/skills': []
}

function row(folder: string, description: string, source: SkillRow['source'], copies: [ManagedDir, string][]): SkillRow {
  const seeing = new Set(copies.flatMap(([dir]) => READERS[dir]))
  const agents = AGENTS.map((agent) => ({
    agent: agent.id,
    state: seeing.has(agent.id) ? ('sees' as const) : ('absent' as const),
    via: copies.map(([dir]) => dir).filter((dir) => READERS[dir].includes(agent.id))
  }))
  const hashes = [...new Set(copies.map(([, hash]) => hash))]
  return {
    folder,
    displayName: folder,
    description,
    source,
    agents,
    missingFor: agents.filter((a) => a.state === 'absent').map((a) => a.agent),
    external: false,
    versions: hashes.map((hash) => ({ hash, dirs: copies.filter(([, each]) => each === hash).map(([dir]) => dir) })),
    copies: copies.map(([dir]) => ({ dir, kind: 'dir' as CopyKind, feeds: READERS[dir] }))
  }
}

const READY_ROWS: SkillRow[] = [
  row('sonniss-catalog-audio-fx', 'Catalogue de sons pour le montage', { kind: 'local', path: '~/dev/motion-design-tools/plugin/skills' }, [
    ['.agents/skills', 'a'],
    ['.claude/skills', 'a'],
    ['.grok/skills', 'a']
  ]),
  row('motion-context', 'Contexte des projets de motion design', { kind: 'handwritten' }, [['.claude/skills', 'b']]),
  // Deux contenus distincts : le bandeau de divergence.
  row('frontend-design', 'Interfaces soignées', { kind: 'remote', source: 'anthropics/skills' }, [
    ['.claude/skills', 'c1'],
    ['.agents/skills', 'c2']
  ])
]

function stateOf(overrides: Partial<PanelState>): PanelState {
  return {
    workspace: { status: 'ready', id: 'identity:idema', name: 'erom-tool-idema', branch: 'feat/skills', linkedWorktree: true, network: false },
    agents: AGENTS,
    detected: AGENTS.map((agent) => ({ ...agent, hidden: false })),
    inventory: 'detected',
    rows: READY_ROWS,
    unsafeDirs: [],
    lockUnreadable: false,
    capabilities: { trash: 'ready', folderPicker: true },
    platform: 'darwin',
    busy: null,
    ...overrides
  }
}

const SCENARIOS: Record<string, PanelState> = {
  ready: stateOf({}),
  fallback: stateOf({ inventory: 'fallback', agents: [], rows: READY_ROWS.map((r) => ({ ...r, agents: [], missingFor: [] })) }),
  remote: stateOf({ workspace: { status: 'remote' }, rows: [] }),
  noWorkspace: stateOf({ workspace: { status: 'none' }, rows: [] }),
  // Windows : racine POSIX d'une distribution WSL, aucun geste.
  wsl: stateOf({ workspace: { status: 'wsl' }, rows: [], capabilities: { trash: 'unverified', folderPicker: false }, platform: 'win32' }),
  // Windows : la Corbeille n'a aucun moyen en v0.2, le bandeau dit que remplacer et retirer sont refusés.
  trashUnverified: stateOf({ capabilities: { trash: 'unverified', folderPicker: false }, platform: 'win32' }),
  // Espace sur un partage réseau : pas de Corbeille, remplacer et retirer sont refusés.
  trashNetwork: stateOf({
    workspace: { status: 'ready', id: 'identity:share', name: 'shared-project', branch: 'main', linkedWorktree: false, network: true },
    capabilities: { trash: 'network', folderPicker: false },
    platform: 'win32'
  })
}

/** Chaque état en sombre, puis en clair (c'est le thème clair qui sert les variantes d'icônes `on-light/`). */
export default defineCheck(
  Object.fromEntries(
    Object.entries(SCENARIOS).flatMap(([name, state]) =>
      (['dark', 'light'] as const).map((theme) => [theme === 'dark' ? name : `${name}Light`, { theme, requests: { 'state.get': state, 'state.refresh': state } }] as const)
    )
  )
)
