// Quoting shell, repris de launch.ts d'agent-profiles : sert la sonde des agents de l'inventaire.

/** Guillemets simples : `[1m]` non protégé est un motif de glob pour zsh (« no matches found »). */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
