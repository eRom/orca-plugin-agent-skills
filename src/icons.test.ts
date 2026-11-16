// Icônes : la table des variantes colle au disque dans les deux sens, chaque icône a sa version estompée.
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assert, test } from 'orca/testing'
import { AGENTS } from './agents'
import { type ColorScheme, dimIcon, ICON_VARIANTS, themedIcon } from './icons'

const pluginFile = (relative: string): string => fileURLToPath(new URL(`../${relative}`, import.meta.url))
const SCHEMES: ColorScheme[] = ['light', 'dark']

test('every agent icon exists on disk', () => {
  for (const agent of AGENTS) {
    assert.match(agent.icon, /^agent-icons\/[a-z0-9-]+\.png$/)
    assert.ok(existsSync(pluginFile(agent.icon)), agent.icon)
  }
})

test('every declared variant exists on disk, and so does its base image', () => {
  for (const scheme of SCHEMES) {
    for (const base of ICON_VARIANTS[scheme]) {
      assert.ok(existsSync(pluginFile(base)), `base ${base}`)
      assert.ok(existsSync(pluginFile(themedIcon(base, scheme))), `variant of ${base}`)
    }
  }
})

test('every variant file on disk is declared in the table', () => {
  for (const scheme of SCHEMES) {
    // Seuls les PNG comptent : Finder sème un `.DS_Store` dans tout dossier ouvert.
    for (const file of readdirSync(pluginFile(`agent-icons/on-${scheme}`)).filter((name) => name.endsWith('.png'))) {
      assert.ok(ICON_VARIANTS[scheme].includes(`agent-icons/${file}`), `on-${scheme}/${file} is declared`)
    }
  }
})

test('a declared variant is used for its theme only, and the base path is the answer everywhere else', () => {
  for (const scheme of SCHEMES) {
    const other = scheme === 'light' ? 'dark' : 'light'
    for (const base of ICON_VARIANTS[scheme]) {
      assert.equal(themedIcon(base, scheme), base.replace('agent-icons/', `agent-icons/on-${scheme}/`))
      if (!ICON_VARIANTS[other].includes(base)) assert.equal(themedIcon(base, other), base)
    }
  }
})

test('images without a variant and unknown paths come back unchanged', () => {
  for (const scheme of SCHEMES) {
    for (const path of ['agent-icons/claude.png', 'avatars/codex.png', 'agent-icons/missing.png', '', 'codex.png']) {
      assert.equal(themedIcon(path, scheme), path)
    }
  }
})

test('dimIcon maps base and themed icons under agent-icons/dim', () => {
  assert.equal(dimIcon('agent-icons/claude.png'), 'agent-icons/dim/claude.png')
  assert.equal(dimIcon('agent-icons/on-light/codex.png'), 'agent-icons/dim/on-light/codex.png')
  assert.equal(dimIcon('agent-icons/on-dark/kilo.png'), 'agent-icons/dim/on-dark/kilo.png')
})

test('the dimmed version of every icon and every variant exists on disk', () => {
  for (const agent of AGENTS) {
    assert.ok(existsSync(pluginFile(dimIcon(agent.icon))), `dim of ${agent.icon}`)
    for (const scheme of SCHEMES) {
      assert.ok(existsSync(pluginFile(dimIcon(themedIcon(agent.icon, scheme)))), `dim of ${agent.icon} on ${scheme}`)
    }
  }
})
