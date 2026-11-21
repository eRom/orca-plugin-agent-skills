// Historique d'Orca (`agent.listSessions`, capacité `history:read`) : on n'en lit que le champ `agent` des sessions.
// Un titre peut contenir le début d'un message : il ne va jamais dans un journal, un stockage ou un état.
import type { HostCall } from './workspace'

/** Maximum accepté par Orca (un `limit` de 201 donne `invalid_params`, relevé le 2026-11-21 sur Orca 1.4.268). */
const HISTORY_LIMIT = 200

const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' ? code : 'error'
}

/**
 * Les agents qui ont au moins une session dans l'historique d'Orca, ou `null` quand l'historique ne sert pas : méthode
 * absente, capacité refusée, erreur, ou aucune session. Les sessions les plus récentes viennent d'abord ; `limit: 200`
 * évite qu'une rafale de sessions d'un agent en fasse sortir un autre de la fenêtre (le défaut d'Orca est 50).
 */
export async function listHistoryAgents(
  call: HostCall,
  has: (method: string) => boolean,
  log: (line: string) => void
): Promise<ReadonlySet<string> | null> {
  if (!has('agent.listSessions')) {
    log('history unavailable reason=no-method')
    return null
  }
  let sessions: readonly { agent: string }[]
  try {
    try {
      sessions = (await call('agent.listSessions', { limit: HISTORY_LIMIT })).sessions
    } catch (error) {
      if (codeOf(error) !== 'invalid_params') throw error
      // Un Orca qui refuse le paramètre : une seconde fois avec son défaut.
      sessions = (await call('agent.listSessions')).sessions
    }
  } catch (error) {
    log(`history unavailable reason=${codeOf(error)}`)
    return null
  }
  const agents = new Set<string>()
  for (const session of sessions) if (typeof session.agent === 'string') agents.add(session.agent)
  return agents.size === 0 ? null : agents
}
