// Agents masqués par l'utilisateur : installés sur la machine, mais qu'il n'utilise pas. Réglage global du plugin,
// valable pour tous les projets. Remplace la lecture des agents désactivés dans Orca (revue de l'annuaire, issue #1).
// Pur, sans accès au stockage.

/** Clé du stockage du plugin (`storage:own`). */
export const HIDDEN_AGENTS_KEY = 'hiddenAgents'

/** Relit la valeur du stockage ; toute forme invalide donne `[]` (aucun agent masqué). Retire les doublons. */
export function parseHiddenAgents(raw: unknown): string[] {
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === 'string')) return []
  return [...new Set(raw as string[])]
}

/**
 * Masque ou montre `agent` parmi les agents installés. Refuse (rend `hidden` inchangé) de masquer le dernier agent
 * visible : sans agent, le panneau n'aurait plus personne pour qui écrire.
 */
export function setHidden(hidden: readonly string[], installed: readonly string[], agent: string, hide: boolean): readonly string[] {
  const has = hidden.includes(agent)
  if (!hide) return has ? hidden.filter((id) => id !== agent) : hidden
  if (has || !installed.includes(agent)) return hidden
  const visible = installed.filter((id) => id !== agent && !hidden.includes(id))
  return visible.length === 0 ? hidden : [...hidden, agent]
}
