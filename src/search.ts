// Recherche dans le catalogue skills.sh (même API que le CLI `skills find`).

export type SearchHit = { name: string; source: string; skillId: string; installs: number }

export const SKILLS_SH = 'https://skills.sh'
export const SEARCH_LIMIT = 20

export class SearchError extends Error {
  readonly code: 'unreachable' | 'http' | 'unreadable'
  constructor(code: 'unreachable' | 'http' | 'unreadable', message: string) {
    super(message)
    this.name = 'SearchError'
    this.code = code
  }
}

function asHit(raw: unknown): SearchHit | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { name, source, skillId, installs } = raw as Record<string, unknown>
  if (typeof name !== 'string' || typeof source !== 'string' || typeof skillId !== 'string') return null
  return { name, source, skillId, installs: typeof installs === 'number' && Number.isFinite(installs) ? installs : 0 }
}

/** Interroge `<base>/api/search`. L'API ne trie pas : le tri par installs décroissants est fait ici, comme le CLI. */
export async function searchSkills(query: string, opts: { base: string; fetch: typeof fetch; signal?: AbortSignal }): Promise<SearchHit[]> {
  const url = `${opts.base}/api/search?${new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) })}`
  let response: Response
  try {
    response = await opts.fetch(url, { signal: opts.signal })
  } catch (error) {
    throw new SearchError('unreachable', error instanceof Error ? error.message : String(error))
  }
  if (!response.ok) throw new SearchError('http', `HTTP ${response.status}`)
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new SearchError('unreadable', 'response is not JSON')
  }
  const skills = (body as { skills?: unknown } | null)?.skills
  if (skills === undefined) return []
  if (!Array.isArray(skills)) throw new SearchError('unreadable', 'skills is not an array')
  const hits: SearchHit[] = []
  for (const raw of skills) {
    const hit = asHit(raw)
    if (hit) hits.push(hit)
  }
  return hits.sort((a, b) => b.installs - a.installs)
}

/** Décimale à un chiffre, sans « .0 », virgule en français. */
function compact(value: number, suffix: string, locale: 'en' | 'fr'): string {
  const text = String(value).replace(/\.0$/, '')
  return `${locale === 'fr' ? text.replace('.', ',') : text}${suffix}`
}

/** Nombre d'installations abrégé : 999, 514,5K, 1,3M. */
export function formatInstalls(n: number, locale: 'en' | 'fr'): string {
  if (n < 1000) return String(n)
  const thousands = Math.round(n / 100) / 10
  if (thousands < 1000) return compact(thousands, 'K', locale)
  return compact(Math.round(n / 100000) / 10, 'M', locale)
}
