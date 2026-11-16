// Front matter YAML de SKILL.md : `name` et `description`, en lecture seule. Cas repris d'IdemA (skills_section.rs).

export type Frontmatter = { name?: string; description?: string }

const KEYS = ['name', 'description'] as const

/** Retire une paire de guillemets simples ou doubles autour de la valeur. */
function unquote(value: string): string {
  for (const quote of ['"', "'"]) {
    if (value.length >= 2 && value.startsWith(quote) && value.endsWith(quote)) return value.slice(1, -1)
  }
  return value
}

/** `name` et `description` du front matter : valeur sur la ligne, entre guillemets, ou bloc `>` (replié) / `|` (littéral). */
export function parseFrontmatter(text: string): Frontmatter {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  if (lines[0]?.trimEnd() !== '---') return {}
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === '---')
  if (end === -1) return {} // pas de `---` de fermeture : ce qui suit est du corps, pas du front matter
  const block = lines.slice(1, end)
  const result: Frontmatter = {}
  for (let i = 0; i < block.length; i++) {
    const line = block[i]!
    const key = KEYS.find((candidate) => line.startsWith(`${candidate}:`))
    if (!key) continue
    const value = line.slice(key.length + 1).trim()
    if (value.startsWith('>') || value.startsWith('|')) {
      const parts: string[] = []
      while (i + 1 < block.length) {
        const next = block[i + 1]!
        if (!/^[ \t]/.test(next) && next.trim() !== '') break
        parts.push(next.trim())
        i++
      }
      const kept = value.startsWith('>') ? parts.filter((part) => part !== '') : parts
      result[key] = kept.join(value.startsWith('>') ? ' ' : '\n').trim()
    } else {
      result[key] = unquote(value)
    }
  }
  return result
}
