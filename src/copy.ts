// Tout le texte affiché par le panneau, en un seul endroit, en anglais et en français.
// Module pur (sans 'orca') : le panneau, les tests et le worker peuvent l'importer. Aucun tiret cadratin : un test le vérifie.
import type { OpError } from './operations'
import type { LibDiagnostic } from './skills-lib'

export type Locale = 'en' | 'fr'

export const LOCALES: readonly Locale[] = ['en', 'fr']

export type Messages = {
  // Espace de travail.
  remoteWorkspace: string
  wslWorkspace: string
  noWorkspace: string
  missingWorkspace: string
  homeWorkspace: string
  worktreeNote: string
  refreshLabel: string
  fallbackNote: string
  fallbackHiddenNote: string
  agentsOpenLabel: string
  agentsCloseLabel: string
  agentsTitle: string
  agentsHint: string
  agentsNone: string
  loading: string
  loadFailed: string
  retry: string

  // Champ de recherche.
  searchLabel: string
  searchPlaceholder: string
  pickFolderLabel: string
  clearSearchLabel: string

  // Liste du projet.
  inProject: string
  emptyTitle: string
  emptyHint: string
  handwritten: string
  externalLink: string
  absentFor: (agents: string) => string
  propagate: string
  removeSkillLabel: (name: string) => string
  expandLabel: (name: string) => string
  collapseLabel: (name: string) => string
  agentSees: (agent: string, dirs: string) => string
  agentAbsent: (agent: string) => string
  chipsSummary: (seen: number, total: number) => string
  chipsFold: string

  // Ligne dépliée.
  readBy: (agents: string) => string
  readByNobody: string
  differs: string
  versionLabel: (n: number) => string
  keepThis: string
  trustHermes: string
  trustVibe: string

  // Confirmations en ligne.
  cancel: string
  replaceAsk: (name: string) => string
  replaceConfirm: string
  removeAsk: (name: string) => string
  removeConfirm: string

  // Recherche et ajout.
  searching: string
  reading: string
  searchGroup: (count: number) => string
  noResults: string
  searchUnreachable: string
  searchUnreadable: string
  add: string
  installed: string
  addFromFolder: string
  folderNotFound: string
  addCount: (count: number) => string

  // Geste en cours.
  adding: string
  removing: string
  copying: string

  // Bandeaux et erreurs.
  outsideProject: (dir: string) => string
  trashUnavailable: string
  trashUnverified: (os: string) => string
  trashNetwork: string
  lockUnreadable: string
  trashed: string
  errors: {
    busy: string
    noWorkspace: string
    collision: (folders: string) => string
    noTrash: string
    trashUnverified: (os: string) => string
    networkPath: string
    unsafeDir: (dirs: string) => string
    gone: string
    previewExpired: string
    workspaceChanged: string
    sourceInProject: string
    pathNotFound: string
    noTarget: string
    lib: string
  }
  /** Codes de la bibliothèque `skills` et du plugin ; un code absent d'ici montre le message de la bibliothèque tel quel. */
  lib: {
    SKILLS_LOCAL_PATH_NOT_FOUND: string
    SKILLS_GIT_AUTH_FAILED: string
    SKILLS_GIT_CLONE_TIMEOUT: string
    SKILLS_GIT_CLONE_FAILED: string
    SKILLS_GIT_SAML_SSO_BLOCKED: string
    SKILLS_NO_VALID_SKILLS: string
    SKILLS_NO_MATCHING_SKILLS: string
    SKILLS_DUPLICATE_SKILL_NAME: string
    SKILLS_INVALID_LOCAL_LOCK: string
    SKILLS_LOCK_WRITE_FAILED: string
    SKILLS_SKILL_SKIPPED: string
    SKILLS_SKILL_CONTAINS_SYMLINKS: string
    SKILLS_SOURCE_FETCH_FAILED: string
    SKILLS_DOWNLOAD_HTTP_ERROR: string
    SKILLS_INSTALL_FAILED: string
    SKILLS_REMOVE_FAILED: string
    SKILLS_BROKEN_SYMLINK: string
    SKILLS_SYMLINK_CYCLE: string
    SKILLS_SYMLINK_OUTSIDE_SKILL: string
    PLUGIN_LOCK_KEPT: string
    PLUGIN_UNSAFE_DIR: string
    PLUGIN_NOT_TRACKED: string
    PLUGIN_STAGE_INCOMPLETE: string
    PLUGIN_TRASH_FAILED: string
  }
}

const en: Messages = {
  remoteWorkspace: 'Remote workspace: not supported.',
  wslWorkspace: 'WSL workspaces are not supported yet.',
  noWorkspace: 'Open a workspace.',
  missingWorkspace: 'The folder of this workspace no longer exists.',
  homeWorkspace: 'The home folder is not a project.',
  worktreeNote: 'A skill added here reaches the other worktrees only once committed.',
  refreshLabel: 'Refresh',
  fallbackNote: 'No agent detected: adding for .agents and .claude',
  agentsOpenLabel: 'Choose agents',
  agentsCloseLabel: 'Close agents',
  agentsTitle: 'Agents on this computer',
  agentsHint: 'A hidden agent loses its icons, and an addition no longer writes for it, in every project. One agent always stays visible.',
  fallbackHiddenNote: 'Every detected agent is hidden: adding for .agents and .claude',
  agentsNone: 'No agent that reads skills was found on this computer.',
  loading: 'Loading skills',
  loadFailed: 'Could not read the skills of this project.',
  retry: 'Retry',

  searchLabel: 'Search skills',
  searchPlaceholder: 'Search skills.sh, or paste a path',
  pickFolderLabel: 'Choose a folder',
  clearSearchLabel: 'Clear the search',

  inProject: 'In this project',
  emptyTitle: 'No skill in this project.',
  emptyHint: 'Search skills.sh or paste the path of a folder.',
  handwritten: 'handwritten',
  externalLink: 'external link',
  absentFor: (agents) => `Missing for ${agents}`,
  propagate: 'Propagate',
  removeSkillLabel: (name) => `Remove ${name}`,
  expandLabel: (name) => `Show details of ${name}`,
  collapseLabel: (name) => `Hide details of ${name}`,
  agentSees: (agent, dirs) => `${agent} · via ${dirs}`,
  agentAbsent: (agent) => `${agent} · missing`,
  chipsSummary: (seen, total) => `${seen}/${total} agents`,
  chipsFold: 'Fold agents',

  readBy: (agents) => `Read by ${agents}`,
  readByNobody: 'Read by no active agent',
  differs: 'Different from one folder to another',
  versionLabel: (n) => `Version ${n}`,
  keepThis: 'Keep this one',
  trustHermes: 'Hermes reads the skills of a project only once the folder is trusted (hermes skills trust).',
  trustVibe: 'Mistral Vibe reads the skills of a project only when the folder is marked as trusted.',

  cancel: 'Cancel',
  replaceAsk: (name) => `Replace ${name}? The current one goes to the Trash.`,
  replaceConfirm: 'Replace',
  removeAsk: (name) => `Remove ${name} from the project? It disappears for every agent. A copy goes to the Trash.`,
  removeConfirm: 'Remove',

  searching: 'Searching...',
  reading: 'Reading the folder...',
  searchGroup: (count) => `skills.sh · ${count}`,
  noResults: 'No result',
  searchUnreachable: 'skills.sh is not answering',
  searchUnreadable: 'skills.sh sent an answer that could not be read',
  add: 'Add',
  installed: 'Installed',
  addFromFolder: 'Add from this folder',
  folderNotFound: 'Folder not found',
  addCount: (count) => `Add (${count})`,

  adding: 'Adding...',
  removing: 'Removing...',
  copying: 'Copying...',

  outsideProject: (dir) => `${dir} points outside this project: nothing is written to it or removed from it.`,
  trashUnavailable: 'The Trash is unavailable: replacing and removing are refused.',
  trashUnverified: (os) => `The Trash is not verified on ${os} yet: replacing and removing are refused.`,
  trashNetwork: 'Workspace on a network path: no Trash, replacing and removing are refused.',
  lockUnreadable: 'skills-lock.json cannot be read: sources are not shown and an add may fail.',
  trashed: 'The replaced version is in the Trash.',
  errors: {
    busy: 'Another gesture is already running.',
    noWorkspace: 'No usable workspace.',
    collision: (folders) => `A skill with the same name already exists: ${folders}.`,
    noTrash: 'The Trash is unavailable: nothing was replaced or removed.',
    trashUnverified: (os) => `The Trash is not verified on ${os} yet: nothing was replaced or removed.`,
    networkPath: 'No Trash on a network path: nothing was replaced or removed.',
    unsafeDir: (dirs) => `${dirs} points outside the project: nothing was written there.`,
    gone: 'This skill no longer exists on disk.',
    previewExpired: 'The preview of the source expired: start again.',
    workspaceChanged: 'The focused workspace changed: nothing was done. Try again here.',
    sourceInProject: 'This folder is inside the skills folders of the project: pick a folder outside of them.',
    pathNotFound: 'Folder not found.',
    noTarget: 'No target folder for these agents.',
    lib: 'The skills library failed.'
  },
  lib: {
    SKILLS_LOCAL_PATH_NOT_FOUND: 'Folder not found.',
    SKILLS_GIT_AUTH_FAILED: 'Access to the repository was refused: check the address or your git credentials.',
    SKILLS_GIT_CLONE_TIMEOUT: 'Cloning the repository took too long.',
    SKILLS_GIT_CLONE_FAILED: 'Cloning the repository failed.',
    SKILLS_GIT_SAML_SSO_BLOCKED: 'The repository requires a SAML SSO authorisation.',
    SKILLS_NO_VALID_SKILLS: 'No valid skill in this source.',
    SKILLS_NO_MATCHING_SKILLS: 'No skill matches in this source.',
    SKILLS_DUPLICATE_SKILL_NAME: 'Several folders of this source declare the same skill name.',
    SKILLS_INVALID_LOCAL_LOCK: 'skills-lock.json is unreadable or invalid.',
    SKILLS_LOCK_WRITE_FAILED: 'skills-lock.json could not be written.',
    SKILLS_SKILL_SKIPPED: 'A skill was skipped (unsafe or unreadable link).',
    SKILLS_SKILL_CONTAINS_SYMLINKS: 'This skill contains symbolic links: refused.',
    SKILLS_SOURCE_FETCH_FAILED: 'The source could not be reached.',
    SKILLS_DOWNLOAD_HTTP_ERROR: 'The download failed.',
    SKILLS_INSTALL_FAILED: 'The install failed.',
    SKILLS_REMOVE_FAILED: 'The removal failed.',
    SKILLS_BROKEN_SYMLINK: 'A link in this skill is broken: skipped.',
    SKILLS_SYMLINK_CYCLE: 'A link in this skill loops: skipped.',
    SKILLS_SYMLINK_OUTSIDE_SKILL: 'A link in this skill points outside it: skipped.',
    PLUGIN_LOCK_KEPT: 'The lock entry was kept: a copy remains for an agent that was not targeted.',
    PLUGIN_UNSAFE_DIR: 'A skills folder points outside the project: left untouched.',
    PLUGIN_NOT_TRACKED: 'Copied without a lock entry: no target folder is known to the skills library.',
    PLUGIN_STAGE_INCOMPLETE: 'The trial install did not drop every requested skill.',
    PLUGIN_TRASH_FAILED: 'The Trash failed.'
  }
}

const fr: Messages = {
  remoteWorkspace: 'Espace distant : non pris en charge.',
  wslWorkspace: "Espace WSL non pris en charge pour l'instant.",
  noWorkspace: 'Ouvrez un espace de travail.',
  missingWorkspace: "Le dossier de cet espace n'existe plus.",
  homeWorkspace: "Le dossier personnel n'est pas un projet.",
  worktreeNote: "Ajoutée ici, une skill n'arrive dans les autres worktrees qu'une fois commitée.",
  refreshLabel: 'Actualiser',
  fallbackNote: 'Aucun agent détecté : ajout pour .agents et .claude',
  agentsOpenLabel: 'Choisir les agents',
  agentsCloseLabel: 'Fermer les agents',
  agentsTitle: 'Agents sur cet ordinateur',
  agentsHint: "Un agent masqué perd ses icônes et un ajout n'écrit plus pour lui, dans tous les projets. Un agent reste toujours visible.",
  fallbackHiddenNote: 'Tous les agents détectés sont masqués : ajout pour .agents et .claude',
  agentsNone: "Aucun agent qui lit les skills n'a été trouvé sur cet ordinateur.",
  loading: 'Chargement des skills',
  loadFailed: 'Impossible de lire les skills de ce projet.',
  retry: 'Réessayer',

  searchLabel: 'Chercher une skill',
  searchPlaceholder: 'Chercher sur skills.sh, ou coller un chemin',
  pickFolderLabel: 'Choisir un dossier',
  clearSearchLabel: 'Effacer la recherche',

  inProject: 'Dans ce projet',
  emptyTitle: 'Aucune skill dans ce projet.',
  emptyHint: "Cherchez sur skills.sh ou collez le chemin d'un dossier.",
  handwritten: 'écrite à la main',
  externalLink: 'lien externe',
  absentFor: (agents) => `Absente pour ${agents}`,
  propagate: 'Propager',
  removeSkillLabel: (name) => `Retirer ${name}`,
  expandLabel: (name) => `Afficher le détail de ${name}`,
  collapseLabel: (name) => `Masquer le détail de ${name}`,
  agentSees: (agent, dirs) => `${agent} · via ${dirs}`,
  agentAbsent: (agent) => `${agent} · absente`,
  chipsSummary: (seen, total) => `${seen}/${total} agents`,
  chipsFold: 'Replier les agents',

  readBy: (agents) => `Lue par ${agents}`,
  readByNobody: 'Lue par aucun agent actif',
  differs: 'Différente selon les dossiers',
  versionLabel: (n) => `Version ${n}`,
  keepThis: 'Garder celle-ci',
  trustHermes: "Hermes ne lit les skills d'un projet qu'une fois le dossier approuvé (hermes skills trust).",
  trustVibe: "Mistral Vibe ne lit les skills d'un projet que si le dossier est marqué « trusted ».",

  cancel: 'Annuler',
  replaceAsk: (name) => `Remplacer ${name} ? L'actuelle part à la Corbeille.`,
  replaceConfirm: 'Remplacer',
  removeAsk: (name) => `Retirer ${name} du projet ? Elle disparaît pour tous les agents. Une copie part à la Corbeille.`,
  removeConfirm: 'Retirer',

  searching: 'Recherche…',
  reading: 'Lecture du dossier…',
  searchGroup: (count) => `skills.sh · ${count}`,
  noResults: 'Aucun résultat',
  searchUnreachable: 'skills.sh ne répond pas',
  searchUnreadable: 'skills.sh a envoyé une réponse illisible',
  add: 'Ajouter',
  installed: 'Installée',
  addFromFolder: 'Ajouter depuis ce dossier',
  folderNotFound: 'Dossier introuvable',
  addCount: (count) => `Ajouter (${count})`,

  adding: 'Ajout…',
  removing: 'Retrait…',
  copying: 'Copie…',

  outsideProject: (dir) => `${dir} pointe hors du projet : rien n'y est écrit ni retiré.`,
  trashUnavailable: 'La Corbeille est indisponible : remplacer et retirer sont refusés.',
  trashUnverified: (os) => `Corbeille pas encore vérifiée sous ${os} : remplacer et retirer sont refusés.`,
  trashNetwork: 'Espace sur un chemin réseau : pas de Corbeille, remplacer et retirer sont refusés.',
  lockUnreadable: "skills-lock.json est illisible : les sources ne s'affichent pas et un ajout peut échouer.",
  trashed: 'La version remplacée est dans la Corbeille.',
  errors: {
    busy: 'Un autre geste est déjà en cours.',
    noWorkspace: 'Aucun espace de travail utilisable.',
    collision: (folders) => `Une skill du même nom existe déjà : ${folders}.`,
    noTrash: "La Corbeille est indisponible : rien n'a été remplacé ni retiré.",
    trashUnverified: (os) => `Corbeille pas encore vérifiée sous ${os} : rien n'a été remplacé ni retiré.`,
    networkPath: "Pas de Corbeille sur un chemin réseau : rien n'a été remplacé ni retiré.",
    unsafeDir: (dirs) => `${dirs} pointe hors du projet : rien n'y a été écrit.`,
    gone: "Cette skill n'existe plus sur le disque.",
    previewExpired: "L'aperçu de la source a expiré : recommencez.",
    workspaceChanged: "L'espace actif a changé : rien n'a été fait. Recommencez ici.",
    sourceInProject: 'Ce dossier est dans les dossiers de skills du projet : choisissez un dossier en dehors.',
    pathNotFound: 'Dossier introuvable.',
    noTarget: 'Aucun dossier cible pour ces agents.',
    lib: 'La bibliothèque skills a échoué.'
  },
  lib: {
    SKILLS_LOCAL_PATH_NOT_FOUND: 'Dossier introuvable.',
    SKILLS_GIT_AUTH_FAILED: "Accès refusé au dépôt : vérifiez l'adresse ou vos identifiants git.",
    SKILLS_GIT_CLONE_TIMEOUT: 'Le clonage du dépôt a pris trop de temps.',
    SKILLS_GIT_CLONE_FAILED: 'Le clonage du dépôt a échoué.',
    SKILLS_GIT_SAML_SSO_BLOCKED: 'Le dépôt exige une autorisation SSO SAML.',
    SKILLS_NO_VALID_SKILLS: 'Aucune skill valide dans cette source.',
    SKILLS_NO_MATCHING_SKILLS: 'Aucune skill ne correspond dans cette source.',
    SKILLS_DUPLICATE_SKILL_NAME: 'Plusieurs dossiers de cette source déclarent le même nom de skill.',
    SKILLS_INVALID_LOCAL_LOCK: 'skills-lock.json est illisible ou invalide.',
    SKILLS_LOCK_WRITE_FAILED: "skills-lock.json n'a pas pu être écrit.",
    SKILLS_SKILL_SKIPPED: 'Une skill a été ignorée (lien dangereux ou illisible).',
    SKILLS_SKILL_CONTAINS_SYMLINKS: 'Cette skill contient des liens symboliques : refusée.',
    SKILLS_SOURCE_FETCH_FAILED: "La source n'a pas pu être jointe.",
    SKILLS_DOWNLOAD_HTTP_ERROR: 'Le téléchargement a échoué.',
    SKILLS_INSTALL_FAILED: "L'installation a échoué.",
    SKILLS_REMOVE_FAILED: 'Le retrait a échoué.',
    SKILLS_BROKEN_SYMLINK: 'Un lien de cette skill est cassé : ignoré.',
    SKILLS_SYMLINK_CYCLE: 'Un lien de cette skill boucle : ignoré.',
    SKILLS_SYMLINK_OUTSIDE_SKILL: 'Un lien de cette skill sort de la skill : ignoré.',
    PLUGIN_LOCK_KEPT: "L'entrée du lock est gardée : une copie subsiste chez un agent non visé.",
    PLUGIN_UNSAFE_DIR: 'Un dossier de skills pointe hors du projet : laissé intact.',
    PLUGIN_NOT_TRACKED: "Copiée sans entrée au lock : aucun dossier cible n'est connu de la bibliothèque.",
    PLUGIN_STAGE_INCOMPLETE: "L'installation d'essai n'a pas déposé toutes les skills demandées.",
    PLUGIN_TRASH_FAILED: 'La Corbeille a échoué.'
  }
}

export const MESSAGES: Record<Locale, Messages> = { en, fr }

/** Le français pour toute variante de `fr` (`fr-CA`, `fr_BE`), l'anglais pour le reste. */
export function localeOf(tag: string): Locale {
  return /^fr(?![a-z])/i.test(tag) ? 'fr' : 'en'
}

export const messagesFor = (tag: string): Messages => MESSAGES[localeOf(tag)]

const OP_ERROR_CODES: ReadonlySet<string> = new Set<OpError['code']>([
  'busy',
  'no-workspace',
  'workspace-changed',
  'source-in-project',
  'collision',
  'no-trash',
  'trash-unverified',
  'network-path',
  'unsafe-dir',
  'gone',
  'preview-expired',
  'path-not-found',
  'no-target',
  'lib'
])

const isOpError = (error: OpError | LibDiagnostic): error is OpError => OP_ERROR_CODES.has(error.code) && !('message' in error)

/** Un code connu se traduit (le dossier ou la skill visés s'ajoutent), un code inconnu garde le message de la bibliothèque. */
function describeDiagnostic(diagnostic: LibDiagnostic, m: Messages): string {
  if (!Object.prototype.hasOwnProperty.call(m.lib, diagnostic.code)) return diagnostic.message
  const text = m.lib[diagnostic.code as keyof Messages['lib']]
  return diagnostic.skill ? `${text} (${diagnostic.skill})` : text
}

/** Le nom d'un OS tel que l'utilisateur le dit (`process.platform` pour les autres). */
export function osLabel(platform: string): string {
  switch (platform) {
    case 'win32':
      return 'Windows'
    case 'linux':
      return 'Linux'
    case 'darwin':
      return 'macOS'
    default:
      return platform
  }
}

/** Les diagnostics d'une erreur, un par ligne : le panneau n'en montre que trois. `platform` : celui du worker, pour nommer l'OS. */
export function describeErrorLines(error: OpError | LibDiagnostic, m: Messages, platform: string): string[] {
  if (!isOpError(error)) return [describeDiagnostic(error, m)]
  const lines = ((): string[] => {
    switch (error.code) {
      case 'busy':
        return [m.errors.busy]
      case 'no-workspace':
        return [m.errors.noWorkspace]
      case 'workspace-changed':
        return [m.errors.workspaceChanged]
      case 'source-in-project':
        return [m.errors.sourceInProject]
      case 'collision':
        return [m.errors.collision((error.folders ?? []).join(', '))]
      case 'no-trash':
        return [m.errors.noTrash]
      case 'trash-unverified':
        return [m.errors.trashUnverified(osLabel(platform))]
      case 'network-path':
        return [m.errors.networkPath]
      case 'unsafe-dir':
        return [m.errors.unsafeDir((error.dirs ?? []).join(', '))]
      case 'gone':
        return [m.errors.gone]
      case 'preview-expired':
        return [m.errors.previewExpired]
      case 'path-not-found':
        return [m.errors.pathNotFound]
      case 'no-target':
        return [m.errors.noTarget]
      case 'lib': {
        const diagnostics = (error.diagnostics ?? []).map((diagnostic) => describeDiagnostic(diagnostic, m))
        return diagnostics.length > 0 ? diagnostics : [m.errors.lib]
      }
    }
  })()
  // Un échec après la mise à la Corbeille le dit : l'ancienne version n'est pas perdue.
  return error.trashed ? [...lines, m.trashed] : lines
}

/** Le texte d'une erreur en une chaîne (lignes jointes par un espace). */
export const describeError = (error: OpError | LibDiagnostic, m: Messages, platform: string): string => describeErrorLines(error, m, platform).join(' ')
