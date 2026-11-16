// Aides de test : dossiers temporaires et skills écrites sur le disque. Jamais de dossier réel de l'utilisateur.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { LIB_AGENT_BY_DIR } from './skill-dirs'
import type { ResolvedSource, SkillsLib } from './skills-lib'
import type { Trasher } from './trash'
import type { LockEntry } from './visibility'

/** Les agents de Romain (valeurs vérifiées à la main, voir skill-dirs.test.ts). */
export const ROMAIN_AGENTS = ['claude', 'codex', 'grok', 'opencode', 'pi', 'antigravity', 'dsh']

const created: string[] = []
process.on('exit', () => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true })
})

/** Crée un dossier temporaire propre à un test ; il disparaît à la fin du processus. */
export function tempDir(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `agent-skills-${label}-`))
  created.push(dir)
  return dir
}

/** Écrit `<root>/<dir>/<folder>/SKILL.md` et renvoie le dossier de la skill. */
export function writeSkill(root: string, dir: string, folder: string, frontmatter?: string, body = 'Body\n'): string {
  const skillDir = join(root, dir, folder)
  mkdirSync(skillDir, { recursive: true })
  const header = frontmatter ?? `name: ${folder}\ndescription: Skill ${folder}`
  writeFileSync(join(skillDir, 'SKILL.md'), `---\n${header}\n---\n${body}`)
  return skillDir
}

// Fausses dépendances des gestes : la bibliothèque `skills` et la Corbeille. Elles écrivent de vrais dossiers.

/** Même règle d'assainissement que la vraie bibliothèque (vérifiée à la main dans les sondes de la tâche 6). */
export function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._]+/g, '-').replace(/^[.\-]+|[.\-]+$/g, '').substring(0, 255) || 'unnamed-skill'
}

export type FakeSkill = { name: string; description?: string; body?: string }

export type FakeSkillsLib = SkillsLib & {
  /** Appels reçus, dans l'ordre. */
  calls: {
    stage: { names: readonly string[] }[]
    install: { cwd: string; names: readonly string[]; libAgents: readonly string[] }[]
    untrack: { libNames: readonly string[]; cwd: string; libAgents: readonly string[] }[]
  }
  /** Lock en mémoire, indexé par nom de dossier. */
  lock: Map<string, LockEntry>
  /** Si posé, `install` lève cette erreur (après avoir peut-être laissé des copies : ici, avant d'écrire). */
  failInstall: Error | null
  /** Source factice : les noms sont ceux de la bibliothèque, les dossiers sont assainis. */
  source(skills: readonly FakeSkill[]): ResolvedSource
}

/**
 * Bibliothèque factice. `install` écrase sans demander un dossier existant (comme `-y` dans la vraie bibliothèque) :
 * seule la détection de collision des gestes protège l'utilisateur, les tests le vérifient donc par le contenu du disque.
 */
export function fakeSkillsLib(): FakeSkillsLib {
  const contents = new WeakMap<ResolvedSource, ReadonlyMap<string, FakeSkill>>()
  let stageCount = 0
  const skillFile = (skill: FakeSkill): string =>
    `---\nname: ${skill.name}\ndescription: ${skill.description ?? `Skill ${skill.name}`}\n---\n${skill.body ?? `Body of ${skill.name}\n`}`
  const pick = (source: ResolvedSource, names: readonly string[]): FakeSkill[] => {
    const known = contents.get(source)
    if (!known) throw new Error('Source was not created by fakeSkillsLib.source')
    return names.map((name) => {
      const skill = known.get(name)
      if (!skill) throw Object.assign(new Error(`No matching skill: ${name}`), { code: 'SKILLS_NO_MATCHING_SKILLS' })
      return skill
    })
  }
  const lib: FakeSkillsLib = {
    calls: { stage: [], install: [], untrack: [] },
    lock: new Map(),
    failInstall: null,
    source(skills) {
      const resolved: ResolvedSource = {
        input: '/fake/source',
        type: 'local',
        url: '/fake/source',
        skills: skills.map((skill) => ({ name: skill.name, description: skill.description ?? '' })),
        dispose: async () => {}
      }
      contents.set(resolved, new Map(skills.map((skill) => [skill.name, skill])))
      return resolved
    },
    async resolve() {
      throw new Error('fakeSkillsLib.resolve is not used: build a source with lib.source()')
    },
    async stage(source, names, tmpdir) {
      lib.calls.stage.push({ names })
      const picked = pick(source, names)
      const root = join(tmpdir, `stage-fake-${stageCount++}`)
      const staged = new Map<string, { name: string; folder: string }>()
      for (const skill of picked) {
        const folder = sanitizeName(skill.name)
        // Même disposition que la vraie bibliothèque : agent universel, `.agents/skills/<dossier>`.
        mkdirSync(join(root, '.agents/skills', folder), { recursive: true })
        writeFileSync(join(root, '.agents/skills', folder, 'SKILL.md'), skillFile(skill))
        staged.set(folder, { name: skill.name, folder })
      }
      return { staged: [...staged.values()], dispose: async () => rmSync(root, { recursive: true, force: true }) }
    },
    async install(source, { cwd, names, libAgents }) {
      lib.calls.install.push({ cwd, names, libAgents })
      if (lib.failInstall) throw lib.failInstall
      for (const skill of pick(source, names)) {
        const folder = sanitizeName(skill.name)
        for (const [dir, agent] of Object.entries(LIB_AGENT_BY_DIR)) {
          if (!libAgents.includes(agent)) continue
          const target = join(cwd, dir, folder)
          rmSync(target, { recursive: true, force: true })
          mkdirSync(target, { recursive: true })
          writeFileSync(join(target, 'SKILL.md'), skillFile(skill))
        }
        lib.lock.set(folder, { source: source.input, libName: skill.name })
      }
      return { failed: [] }
    },
    async lockEntries(cwd) {
      const raw = existsSync(join(cwd, 'skills-lock.json')) ? readFileSync(join(cwd, 'skills-lock.json'), 'utf8') : null
      if (raw !== null) {
        try {
          JSON.parse(raw)
        } catch {
          throw Object.assign(new Error('Invalid skills lock'), { code: 'SKILLS_INVALID_LOCAL_LOCK' })
        }
      }
      return new Map(lib.lock)
    },
    async untrack(libNames, cwd, libAgents) {
      lib.calls.untrack.push({ libNames, cwd, libAgents })
      for (const [folder, entry] of lib.lock) if (libNames.includes(entry.libName)) lib.lock.delete(folder)
      return { failed: [] }
    }
  }
  return lib
}

export type FakeTrasher = Trasher & {
  /** Chemins mis à la Corbeille, dans l'ordre. */
  trashed: string[]
  /** Chemin d'origine -> où l'entrée a été déplacée (le contenu y reste lisible). */
  moved: Map<string, string>
  /** Si posé, le trasher lève cette erreur sans rien déplacer. */
  failWith: Error | null
}

/** Corbeille factice : déplace l'entrée elle-même (un lien reste un lien) dans un dossier temporaire. */
export function fakeTrasher(): FakeTrasher {
  const bin = tempDir('trash-bin')
  let count = 0
  const trasher = (async (paths) => {
    if (trasher.failWith) throw trasher.failWith
    for (const path of paths) {
      const slot = join(bin, String(count++))
      mkdirSync(slot)
      renameSync(path, join(slot, basename(path)))
      trasher.trashed.push(path)
      trasher.moved.set(path, join(slot, basename(path)))
    }
  }) as FakeTrasher
  trasher.trashed = []
  trasher.moved = new Map()
  trasher.failWith = null
  return trasher
}
