// Génère les icônes estompées (alpha x 0.35) : `agent-icons/dim/<même chemin relatif>` pour chaque PNG de
// `agent-icons/`, `agent-icons/on-light/` et `agent-icons/on-dark/`. Usage : `bun scripts/dim-icons.ts` (ImageMagick requis).
import { mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dir, '..', 'agent-icons')
const SOURCE_FOLDERS = ['', 'on-light', 'on-dark']

for (const folder of SOURCE_FOLDERS) {
  const inputDir = join(ROOT, folder)
  for (const file of readdirSync(inputDir).filter((name) => name.endsWith('.png'))) {
    const input = join(inputDir, file)
    const output = join(ROOT, 'dim', folder, file)
    mkdirSync(dirname(output), { recursive: true })
    const process = Bun.spawn(['magick', input, '-alpha', 'set', '-channel', 'A', '-evaluate', 'multiply', '0.35', '+channel', output], {
      stdout: 'inherit',
      stderr: 'inherit'
    })
    const code = await process.exited
    if (code !== 0) throw new Error(`magick failed (${code}) on ${input}`)
  }
}
