// Aides de test : dossiers temporaires et skills écrites sur le disque. Jamais de dossier réel de l'utilisateur.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
