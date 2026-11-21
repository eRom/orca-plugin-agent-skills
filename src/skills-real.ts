// Seul import d'exécution de la bibliothèque `skills`. Chargé par le worker empaqueté, jamais par les tests.
import * as skills from 'skills'
import { createSkillsLib } from './skills-lib'

export const realSkillsLib = createSkillsLib(skills)

/**
 * Identifiants skills.sh des agents que la bibliothèque détecte dans le `home` (ses dossiers de config). `cwd: home` :
 * la détection ne dépend pas du projet ouvert, et les signaux « de projet » de la bibliothèque ne comptent pas.
 */
export async function realLibAgents(home: string): Promise<ReadonlySet<string>> {
  const { agents } = await skills.detectAgents({ cwd: home, config: { telemetry: false } })
  return new Set(agents.map((agent) => agent.id))
}
