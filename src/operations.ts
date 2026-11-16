// Gestes sur les skills du projet : ajouter, propager, garder une version, retirer, retirer d'un dossier.
// Couche destructive : toute mise à la Corbeille ou tout écrasement dans le projet passe par le `Trasher` injecté, et
// rien n'est jamais écrit ni retiré hors du projet (un dossier géré dont le chemin réel sort du projet est ignoré).
import { lstat, mkdir, mkdtemp, readdir, realpath, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { copySkill } from './fsops'
import { COPY_ONLY_DIRS, LIB_AGENT_BY_DIR, MANAGED_DIRS, targetDirOf, type ManagedDir } from './skill-dirs'
import { scanWorkspace, type DiskSkill, type ScanResult } from './scan'
import { PLUGIN_LOCK_KEPT, PLUGIN_STAGE_INCOMPLETE, toLibDiagnostic, type LibDiagnostic, type ResolvedSource, type SkillsLib } from './skills-lib'
import type { Trasher } from './trash'
import { buildRows, type LockEntry } from './visibility'

export type OpError = {
  code:
    | 'busy'
    | 'no-workspace'
    | 'collision'
    | 'no-trash'
    | 'unsafe-dir'
    | 'linked-target'
    | 'gone'
    | 'preview-expired'
    | 'path-not-found'
    | 'no-target'
    | 'lib'
  folders?: string[]
  dirs?: ManagedDir[]
  diagnostics?: LibDiagnostic[]
  /** Vrai quand l'échec survient après une mise à la Corbeille : le panneau le dit à l'utilisateur. */
  trashed?: boolean
}

export type OpResult = { ok: true; warnings: LibDiagnostic[]; lostAgents: string[] } | { ok: false; error: OpError }

export type OpContext = {
  root: string
  home: string
  lib: SkillsLib
  /** `null` : pas de Corbeille sur cette machine, tout geste qui retire ou écrase est refusé. */
  trash: Trasher | null
  tmpdir: string
  writeDirs: readonly ManagedDir[]
  active: readonly string[]
}

const fail = (error: OpError): OpResult => ({ ok: false, error })
const done = (warnings: LibDiagnostic[], lostAgents: string[] = []): OpResult => ({ ok: true, warnings, lostAgents })

function libError(error: unknown, trashed = false): OpError {
  return { code: 'lib', diagnostics: [toLibDiagnostic(error)], ...(trashed ? { trashed: true } : {}) }
}

function unsafeWarning(dir: ManagedDir, lockKept = false): LibDiagnostic {
  const tail = lockKept ? ' The lock entry was kept.' : ''
  return { code: 'PLUGIN_UNSAFE_DIR', message: `${dir} resolves outside this project, it was left untouched.${tail}` }
}

type Disk = { scan: ScanResult; unsafe: ManagedDir[] }

/** Un dossier géré est aliasé si un de ses niveaux existants est un lien (même cassé) ou n'est pas un dossier. */
async function isAliased(rootReal: string, dir: string): Promise<boolean> {
  let current = rootReal
  for (const part of dir.split('/')) {
    current = join(current, part)
    const info = await lstat(current).catch(() => null)
    if (info === null) return false
    if (info.isSymbolicLink() || !info.isDirectory()) return true
  }
  return false
}

/**
 * Relit le disque : balayage + dossiers dangereux. Au-delà du balayage (qui ne voit pas un lien cassé), un lien cassé sur
 * un dossier géré est dangereux aussi : y écrire créerait des fichiers hors du projet. `null` si le projet est introuvable.
 */
async function readDisk(root: string): Promise<Disk | null> {
  const rootReal = await realpath(root).catch(() => null)
  if (rootReal === null) return null
  const scan = await scanWorkspace(root)
  const unsafe: ManagedDir[] = []
  for (const dir of MANAGED_DIRS) {
    if (scan.unsafeDirs.includes(dir) || (await isAliased(rootReal, dir))) unsafe.push(dir)
  }
  return { scan, unsafe }
}

const skillOf = (scan: ScanResult, folder: string): DiskSkill | undefined => scan.skills.find((skill) => skill.folder === folder)

/** Agents actifs qui voient la skill `folder` sur ce balayage. */
function agentsSeeing(scan: ScanResult, ctx: OpContext, folder: string): string[] {
  const row = buildRows(scan, new Map(), ctx.active, () => [], ctx.home).find((candidate) => candidate.folder === folder)
  return row ? row.agents.filter((agent) => agent.state === 'sees').map((agent) => agent.agent) : []
}

/** Met à la Corbeille. Un échec dit s'il a déjà emporté une partie des chemins (`trashed`). */
async function moveToTrash(trash: Trasher, paths: readonly string[]): Promise<OpError | null> {
  if (paths.length === 0) return null
  try {
    await trash(paths)
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const gone = await Promise.all(paths.map(async (path) => (await lstat(path).catch(() => null)) === null))
    return {
      code: 'lib',
      diagnostics: [{ code: 'PLUGIN_TRASH_FAILED', message }],
      ...(gone.some(Boolean) ? { trashed: true } : {})
    }
  }
}

/** Dossier réel de la skill déposée par `stage` : `<racine d'essai>/.agents/skills/<dossier>` (agent universel). */
async function stagedPathOf(work: string, folder: string): Promise<string> {
  for (const entry of await readdir(work)) {
    const candidate = join(work, entry, '.agents/skills', folder)
    if ((await lstat(candidate).catch(() => null))?.isDirectory()) return candidate
  }
  throw Object.assign(new Error(`Staged skill ${folder} was not found in the staging dir`), { code: PLUGIN_STAGE_INCOMPLETE })
}

const isPlainFolderName = (folder: string): boolean => folder !== '' && folder !== '.' && folder !== '..' && basename(folder) === folder

/**
 * Ajoute des skills d'une source. Collision = un dossier réel déjà présent dans un dossier d'écriture sûr (relu sur le
 * disque, nom assaini par la bibliothèque : l'installation écraserait sans demander). Avec `replace`, les copies en
 * collision partent à la Corbeille avant l'installation.
 */
export async function addSkills(
  ctx: OpContext,
  source: ResolvedSource,
  names: readonly string[],
  replace: boolean
): Promise<OpResult> {
  if (ctx.writeDirs.length === 0) return fail({ code: 'no-target' })
  const disk = await readDisk(ctx.root)
  if (!disk) return fail({ code: 'no-workspace' })
  const unsafe = new Set(disk.unsafe)
  const dirs = ctx.writeDirs.filter((dir) => !unsafe.has(dir))
  const skipped = ctx.writeDirs.filter((dir) => unsafe.has(dir))
  if (dirs.length === 0) return fail({ code: 'unsafe-dir', dirs: [...skipped] })
  const warnings: LibDiagnostic[] = skipped.map((dir) => unsafeWarning(dir))

  // Un lock illisible arrête le geste avant toute mise à la Corbeille.
  try {
    await ctx.lib.lockEntries(ctx.root)
  } catch (error) {
    return fail(libError(error))
  }

  await mkdir(ctx.tmpdir, { recursive: true })
  const work = await mkdtemp(join(ctx.tmpdir, 'op-'))
  let disposeStage: (() => Promise<void>) | null = null
  try {
    let stage: Awaited<ReturnType<SkillsLib['stage']>>
    try {
      stage = await ctx.lib.stage(source, names, work)
    } catch (error) {
      return fail(libError(error))
    }
    disposeStage = stage.dispose
    const folders = [...new Set(stage.staged.map((entry) => entry.folder))]
    if (folders.some((folder) => !isPlainFolderName(folder))) {
      return fail(libError(Object.assign(new Error('The library returned an invalid folder name'), { code: PLUGIN_STAGE_INCOMPLETE })))
    }

    // Collision : tout ce qui occupe déjà un chemin d'écriture, même sans SKILL.md (l'installation l'écraserait).
    const collidingFolders: string[] = []
    const collidingPaths: string[] = []
    for (const folder of folders) {
      for (const dir of dirs) {
        const path = join(ctx.root, dir, folder)
        if ((await lstat(path).catch(() => null)) === null) continue
        if (!collidingFolders.includes(folder)) collidingFolders.push(folder)
        collidingPaths.push(path)
      }
    }
    let trashed = false
    if (collidingPaths.length > 0) {
      if (!replace) return fail({ code: 'collision', folders: collidingFolders })
      if (!ctx.trash) return fail({ code: 'no-trash' })
      const trashError = await moveToTrash(ctx.trash, collidingPaths)
      if (trashError) return fail(trashError)
      trashed = true
    }

    const libDirs = dirs.filter((dir) => LIB_AGENT_BY_DIR[dir] !== undefined)
    const copyDirs = dirs.filter((dir) => COPY_ONLY_DIRS.includes(dir))
    if (libDirs.length > 0) {
      const libAgents = libDirs.map((dir) => LIB_AGENT_BY_DIR[dir]!)
      try {
        const { failed } = await ctx.lib.install(source, { cwd: ctx.root, names, libAgents, onWarning: (w) => warnings.push(w) })
        if (failed.length > 0) return fail({ code: 'lib', diagnostics: failed, ...(trashed ? { trashed } : {}) })
      } catch (error) {
        return fail(libError(error, trashed))
      }
    } else {
      // La bibliothèque ne connaît aucun dossier visé : rien n'est suivi dans le lock.
      warnings.push({ code: 'PLUGIN_NOT_TRACKED', message: 'These skills were copied without a lock entry: no targeted dir is known to the skills library.' })
    }

    try {
      for (const folder of folders) {
        // Les dossiers que la bibliothèque ne connaît pas sont copiés depuis la première copie installée, à défaut depuis l'essai.
        const from = libDirs.length > 0 ? join(ctx.root, libDirs[0]!, folder) : await stagedPathOf(work, folder)
        for (const dir of copyDirs) await copySkill(from, join(ctx.root, dir, folder))
      }
    } catch (error) {
      return fail(libError(error, trashed))
    }
    return done(warnings)
  } finally {
    await disposeStage?.().catch(() => {})
    await rm(work, { recursive: true, force: true })
  }
}

/** Copie la skill vers le dossier d'écriture de chaque agent, sans rien écraser ni créer de lien ni toucher au lock. */
export async function propagate(ctx: OpContext, folder: string, agents: readonly string[]): Promise<OpResult> {
  const disk = await readDisk(ctx.root)
  if (!disk) return fail({ code: 'no-workspace' })
  const skill = skillOf(disk.scan, folder)
  if (!skill) return fail({ code: 'gone' })

  const targets = [...new Set(agents.map(targetDirOf).filter((dir): dir is ManagedDir => dir !== null))]
  if (targets.length === 0) return fail({ code: 'no-target' })
  const unsafe = new Set(disk.unsafe)
  const unsafeTargets = targets.filter((dir) => unsafe.has(dir))
  const safeTargets = targets.filter((dir) => !unsafe.has(dir))
  if (safeTargets.length === 0) return fail({ code: 'unsafe-dir', dirs: unsafeTargets })
  const warnings = unsafeTargets.map((dir) => unsafeWarning(dir))

  // Source : une vraie copie, à défaut la cible d'un lien (lue seulement, jamais modifiée).
  const real = skill.copies.find((copy) => copy.kind === 'dir')
  const from = real ? real.path : skill.copies[0]!.realPath
  for (const dir of safeTargets) {
    if (skill.copies.some((copy) => copy.dir === dir)) continue
    try {
      await copySkill(from, join(ctx.root, dir, folder))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return fail({ code: 'collision', folders: [folder] })
      return fail(libError(error))
    }
  }
  return done(warnings)
}

/** Garde la version `hash` : les vraies copies différentes partent à la Corbeille puis sont recopiées. Liens jamais touchés. */
export async function keepVersion(ctx: OpContext, folder: string, hash: string): Promise<OpResult> {
  const disk = await readDisk(ctx.root)
  if (!disk) return fail({ code: 'no-workspace' })
  const skill = skillOf(disk.scan, folder)
  if (!skill) return fail({ code: 'gone' })
  const chosen =
    skill.copies.find((copy) => copy.kind === 'dir' && copy.hash === hash) ??
    skill.copies.find((copy) => copy.kind === 'external-link' && copy.hash === hash)
  if (!chosen) return fail({ code: 'gone' })

  // Un lien interne suit sa cible, un lien externe n'est jamais écrit : seules les vraies copies différentes sont remplacées.
  const stale = skill.copies.filter((copy) => copy.kind === 'dir' && copy.hash !== hash)
  if (stale.length === 0) return done([])
  if (!ctx.trash) return fail({ code: 'no-trash' })
  const trashError = await moveToTrash(
    ctx.trash,
    stale.map((copy) => copy.path)
  )
  if (trashError) return fail(trashError)
  const from = chosen.kind === 'dir' ? chosen.path : chosen.realPath
  try {
    for (const copy of stale) await copySkill(from, copy.path)
  } catch (error) {
    return fail(libError(error, true))
  }
  return done([])
}

/**
 * Retire la skill du projet : toutes les copies gérées (liens compris) vont à la Corbeille, puis, si la skill est dans
 * le lock, `untrack`. `untrack` ne reçoit que les agents des dossiers sûrs et jamais rien si `.agents/skills` est
 * dangereux : la bibliothèque y fait un `rm -rf` définitif qui suit les liens.
 */
export async function removeSkill(ctx: OpContext, folder: string): Promise<OpResult> {
  if (!ctx.trash) return fail({ code: 'no-trash' })
  const disk = await readDisk(ctx.root)
  if (!disk) return fail({ code: 'no-workspace' })
  const skill = skillOf(disk.scan, folder)
  if (!skill) return fail({ code: 'gone' })

  // Lock illisible : on s'arrête avant de toucher à quoi que ce soit.
  let entry: LockEntry | undefined
  try {
    entry = (await ctx.lib.lockEntries(ctx.root)).get(folder)
  } catch (error) {
    return fail(libError(error))
  }

  const agentsUnsafe = disk.unsafe.includes('.agents/skills')
  const warnings = disk.unsafe.map((dir) => unsafeWarning(dir, dir === '.agents/skills' && entry !== undefined))

  // `copy.path` est l'entrée elle-même : pour un lien, le lien (jamais sa cible externe).
  const trashError = await moveToTrash(
    ctx.trash,
    skill.copies.map((copy) => copy.path)
  )
  if (trashError) return fail(trashError)
  if (!entry || agentsUnsafe) return done(warnings)

  const unsafe = new Set(disk.unsafe)
  const libAgents = MANAGED_DIRS.filter((dir) => !unsafe.has(dir)).flatMap((dir) => LIB_AGENT_BY_DIR[dir] ?? [])
  try {
    const { failed } = await ctx.lib.untrack([entry.libName], ctx.root, libAgents)
    // Une entrée gardée parce qu'une copie survit ailleurs est un avertissement, pas un échec.
    warnings.push(...failed.filter((diagnostic) => diagnostic.code === PLUGIN_LOCK_KEPT))
    const errors = failed.filter((diagnostic) => diagnostic.code !== PLUGIN_LOCK_KEPT)
    if (errors.length > 0) return fail({ code: 'lib', diagnostics: errors, trashed: true })
  } catch (error) {
    return fail(libError(error, true))
  }
  return done(warnings)
}

/** Retire la copie d'un seul dossier géré (jamais `untrack`) et dit quels agents actifs ne voient plus la skill. */
export async function removeFromDir(ctx: OpContext, folder: string, dir: ManagedDir): Promise<OpResult> {
  if (!ctx.trash) return fail({ code: 'no-trash' })
  const disk = await readDisk(ctx.root)
  if (!disk) return fail({ code: 'no-workspace' })
  if (disk.unsafe.includes(dir)) return fail({ code: 'unsafe-dir', dirs: [dir] })
  const skill = skillOf(disk.scan, folder)
  const copy = skill?.copies.find((candidate) => candidate.dir === dir)
  if (!skill || !copy) return fail({ code: 'gone' })

  // Une vraie copie vers laquelle un autre dossier pointe : la retirer casserait ce lien.
  if (copy.kind === 'dir') {
    const linkedFrom = skill.copies
      .filter((other) => other.kind === 'internal-link' && other.realPath === copy.realPath && other.dir !== dir)
      .map((other) => other.dir)
    if (linkedFrom.length > 0) return fail({ code: 'linked-target', dirs: linkedFrom })
  }

  const before = agentsSeeing(disk.scan, ctx, folder)
  const trashError = await moveToTrash(ctx.trash, [copy.path])
  if (trashError) return fail(trashError)
  const after = agentsSeeing(await scanWorkspace(ctx.root), ctx, folder)
  return done([], before.filter((agent) => !after.includes(agent)))
}
