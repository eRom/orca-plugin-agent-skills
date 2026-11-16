// Découpage et quoting de lignes de commande shell, repris de launch.ts d'agent-profiles (seules ces deux fonctions servent l'inventaire).

export type Word = { value: string; start: number; end: number }

/**
 * Découpe une ligne de commande en mots shell, avec leur position brute. Orca met chaque argument
 * entre guillemets simples (`claude '--model' 'x'`, capturé le 15/11/2026 sur Orca 1.4.259).
 */
export function splitWords(command: string): Word[] {
  const words: Word[] = []
  let i = 0
  while (i < command.length) {
    while (i < command.length && /\s/.test(command[i]!)) i++
    if (i >= command.length) break
    const start = i
    let value = ''
    while (i < command.length && !/\s/.test(command[i]!)) {
      const char = command[i]!
      if (char === "'") {
        const close = command.indexOf("'", i + 1)
        const stop = close === -1 ? command.length : close
        value += command.slice(i + 1, stop)
        i = stop + 1
      } else if (char === '"') {
        i++
        while (i < command.length && command[i] !== '"') {
          if (command[i] === '\\' && i + 1 < command.length) i++
          value += command[i]
          i++
        }
        i++
      } else if (char === '\\' && i + 1 < command.length) {
        value += command[i + 1]
        i += 2
      } else {
        value += char
        i++
      }
    }
    words.push({ value, start, end: Math.min(i, command.length) })
  }
  return words
}

/** Guillemets simples : `[1m]` non protégé est un motif de glob pour zsh (« no matches found »). */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
