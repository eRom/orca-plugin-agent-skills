// Point d'entrée du worker (empaqueté dans dist/worker.mjs) : les vraies dépendances, injectées dans le cœur.
// Seul fichier avec `skills-real.ts` à importer la bibliothèque `skills` ; le cœur et les tests ne l'importent jamais.
import { existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import type { OrcaWorkerApi } from 'orca/worker'
import { folderPicker } from './folder-picker'
import { SKILLS_SH } from './search'
import { realLibAgents, realSkillsLib } from './skills-real'
import { execRunner, systemTrasher } from './trash'
import { activateWith } from './worker-core'

export { deactivate } from './worker-core'

export default function activate(orca: OrcaWorkerApi): Promise<void> {
  return activateWith(orca, {
    lib: realSkillsLib,
    inventory: { libAgents: realLibAgents, exists: existsSync, now: Date.now },
    trash: systemTrasher(process.platform, existsSync, execRunner),
    pickFolder: folderPicker(process.platform, execRunner),
    fetch,
    searchBase: SKILLS_SH,
    home: homedir(),
    tmpdir: tmpdir(),
    platform: process.platform,
    env: process.env
  })
}
