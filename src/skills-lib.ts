// Adaptateur de la bibliothèque `skills` (logique pure, l'API est injectée : voir `SkillsApi`).
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { SkillSource } from 'skills'
import type { LockEntry } from './visibility'

/**
 * L'API de la bibliothèque `skills`, injectée : `orca plugin test` refuse un `import 'skills'` hors d'un fichier de test.
 * Seul `skills-real.ts` l'importe à l'exécution (le worker est empaqueté) ; les tests injectent le vrai module.
 */
export type SkillsApi = Pick<typeof import('skills'), 'installSkills' | 'listSkills' | 'removeSkills' | 'resolveSource'>

export type LibDiagnostic = { code: string; message: string; skill?: string; agent?: string }

export type ResolvedSource = {
  input: string
  type: string
  url: string
  skills: readonly { name: string; description: string }[]
  dispose(): Promise<void>
}

/** `path` : dossier réel de la skill déposée dans le dossier d'essai (source d'une copie). */
export type StagedSkill = { name: string; folder: string; path: string }

/**
 * Nom de dossier que la bibliothèque donne à une skill (`sanitizeName` de `skills`, vérifié par sonde). Elle fait
 * `rm -rf <dossier>/<ce nom>` à la suppression : un geste ne passe un nom à `untrack` que si ce nom est celui du dossier.
 */
export function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._]+/g, '-').replace(/^[.\-]+|[.\-]+$/g, '').substring(0, 255) || 'unnamed-skill'
}

export type SkillsLib = {
  resolve(input: string, cwd: string): Promise<ResolvedSource>
  stage(
    source: ResolvedSource,
    names: readonly string[],
    tmpdir: string,
  ): Promise<{ staged: StagedSkill[]; dispose(): Promise<void> }>
  install(
    source: ResolvedSource,
    opts: {
      cwd: string
      names: readonly string[]
      libAgents: readonly string[]
      onWarning(w: LibDiagnostic): void
    },
  ): Promise<{ failed: LibDiagnostic[] }>
  lockEntries(cwd: string): Promise<Map<string, LockEntry>>
  /**
   * Efface les skills du lock et les copies des agents visés. Attention : `removeSkills` fait aussi `rm -rf` de la copie
   * canonique `.agents/skills/<nom>` dès qu'aucun agent détecté non visé ne détient encore la skill, quels que soient
   * les `agents` passés, et il suit les liens symboliques. L'appelant met donc d'abord à la Corbeille toutes les copies
   * gérées et ne passe que les agents de dossiers gérés ET sûrs (jamais un dossier qui sort du projet).
   */
  untrack(libNames: readonly string[], cwd: string, libAgents: readonly string[]): Promise<{ failed: LibDiagnostic[] }>
}

/** Code posé par ce plugin quand la bibliothèque garde l'entrée du lock (une copie survit chez un agent non visé). */
export const PLUGIN_LOCK_KEPT = 'PLUGIN_LOCK_KEPT'

/** Code posé par ce plugin quand `stage` n'a pas déposé toutes les skills demandées. */
export const PLUGIN_STAGE_INCOMPLETE = 'PLUGIN_STAGE_INCOMPLETE'

/**
 * Traduit une erreur en diagnostic. Une erreur de la bibliothèque porte un `code` `SKILLS_*` (ou `PLUGIN_*` si elle vient de ce module) ;
 * on le teste par typage de canard : `isDiagnostic(error)` sans code renvoie toujours `false`.
 */
export function toLibDiagnostic(error: unknown): LibDiagnostic {
  const message = error instanceof Error ? error.message : String(error)
  const code = (error as { code?: unknown } | null)?.code
  if (typeof code === 'string' && (code.startsWith('SKILLS_') || code.startsWith('PLUGIN_'))) return { code, message }
  return { code: 'UNKNOWN', message }
}

/** Les objets `SkillSource` de la bibliothèque, gardés hors de `ResolvedSource` pour qu'il reste un simple descripteur. */
const librarySources = new WeakMap<ResolvedSource, SkillSource>()

function libraryOf(source: ResolvedSource): SkillSource {
  const library = librarySources.get(source)
  if (!library) throw new Error('Source was not created by realSkillsLib.resolve')
  return library
}

function toDiagnostic(failure: { code: string; message: string; skill?: string; agent?: string }): LibDiagnostic {
  const out: LibDiagnostic = { code: failure.code, message: failure.message }
  if (failure.skill !== undefined) out.skill = failure.skill
  if (failure.agent !== undefined) out.agent = failure.agent
  return out
}

/**
 * Lit `<cwd>/skills-lock.json` : `listSkills` avale un lock illisible, on le refuse donc ici.
 * Renvoie les clés du lock (vide si le fichier est absent).
 */
async function readLockKeys(cwd: string): Promise<string[]> {
  const path = join(cwd, 'skills-lock.json')
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw invalidLock(path, (error as Error).message)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw invalidLock(path, (error as Error).message)
  }
  // Même validation que la bibliothèque : `version` numérique valant 1 ou 2, et un objet `skills`.
  const lock = parsed as { version?: unknown; skills?: unknown } | null
  if (typeof lock?.version !== 'number' || typeof lock.skills !== 'object' || lock.skills === null || Array.isArray(lock.skills)) {
    throw invalidLock(path, 'expected an object with "version" and "skills"')
  }
  if (lock.version !== 1 && lock.version !== 2) throw invalidLock(path, `unsupported lock version ${lock.version}`)
  return Object.keys(lock.skills)
}

function invalidLock(path: string, reason: string): Error {
  return Object.assign(new Error(`Invalid skills lock ${path}: ${reason}`), { code: 'SKILLS_INVALID_LOCAL_LOCK' })
}

async function readLockEntries(api: SkillsApi, cwd: string): Promise<Map<string, LockEntry>> {
  const entries = new Map<string, LockEntry>()
  await readLockKeys(cwd)
  const { skills } = await api.listSkills({ cwd, scope: 'project' })
  for (const skill of skills) {
    if (skill.source === undefined) continue
    entries.set(basename(skill.path), { source: skill.source, libName: skill.name })
  }
  return entries
}

export function createSkillsLib(api: SkillsApi): SkillsLib {
  return {
    async resolve(input, cwd) {
      const library = await api.resolveSource(input, { cwd })
      const resolved: ResolvedSource = {
        input: library.source.input,
        type: library.source.type,
        url: library.source.url,
        skills: library.skills.map((skill) => ({ name: skill.name, description: skill.description })),
        dispose: () => library.dispose(),
      }
      librarySources.set(resolved, library)
      return resolved
    },

    async stage(source, names, tmpdir) {
      const root = await mkdtemp(join(tmpdir, 'stage-'))
      try {
        const result = await api.installSkills(libraryOf(source), {
          cwd: root,
          skills: names,
          agents: ['universal'],
          mode: 'copy',
          lockfile: false,
          telemetry: false,
          duplicates: 'error',
        })
        // Un échec ou un oubli ne doit jamais passer pour un dépôt complet : on s'arrête avant d'écrire chez l'utilisateur.
        const failure = result.failed[0]
        if (failure) throw Object.assign(new Error(failure.message), { code: failure.code })
        const staged = result.installed.map((target) => ({ name: target.skill, folder: basename(target.path), path: target.path }))
        const requested = new Set(names).size
        if (staged.length !== requested) {
          throw Object.assign(
            new Error(`Staged ${staged.length} of ${requested} requested skills (skipped: ${result.skipped.length})`),
            { code: PLUGIN_STAGE_INCOMPLETE },
          )
        }
        return { staged, dispose: () => rm(root, { recursive: true, force: true }) }
      } catch (error) {
        await rm(root, { recursive: true, force: true })
        throw error
      }
    },

    async install(source, { cwd, names, libAgents, onWarning }) {
      const result = await api.installSkills(libraryOf(source), {
        cwd,
        skills: names,
        agents: libAgents,
        mode: 'copy',
        duplicates: 'error',
        onWarning: (warning) => onWarning(toLibDiagnostic(warning)),
      })
      return { failed: result.failed.map(toDiagnostic) }
    },

    lockEntries: (cwd) => readLockEntries(api, cwd),

    async untrack(libNames, cwd, libAgents) {
      const result = await api.removeSkills(libNames, { cwd, scope: 'project', agents: libAgents })
      const failed = result.failed.map(toDiagnostic)
      // La bibliothèque garde l'entrée quand une copie survit chez un agent non visé : on le signale.
      const remaining = new Set(await readLockKeys(cwd))
      for (const name of libNames) {
        if (remaining.has(name)) {
          failed.push({
            code: PLUGIN_LOCK_KEPT,
            message: `The lock entry for ${name} was kept: a copy survives in a directory that was not targeted`,
            skill: name,
          })
        }
      }
      return { failed }
    },
  }
}
