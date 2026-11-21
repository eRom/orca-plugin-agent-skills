// Textes : mêmes clés dans les deux langues, aucun tiret cadratin, traduction des erreurs du worker.
import { assert, test } from 'orca/testing'
import { LOCALES, localeOf, MESSAGES, messagesFor, describeError, type Messages } from './copy'

/** Chemins de toutes les entrées, objets imbriqués compris (`errors.busy`). */
function paths(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === 'object' && entry !== null ? paths(entry, `${prefix}${key}.`) : [`${prefix}${key}:${typeof entry}`]
  )
}

test('both locales define every message, functions included', () => {
  const [reference, ...others] = LOCALES.map((locale) => paths(MESSAGES[locale]).sort())
  assert.ok(reference && reference.length > 0)
  for (const other of others) assert.deepEqual(other, reference)
})

/** Appelle chaque fonction du dictionnaire avec des arguments d'exemple. */
function everyText(messages: Messages): string[] {
  const sample = (entry: unknown): string[] => {
    if (typeof entry === 'string') return [entry]
    if (typeof entry === 'function') return ['Name', 0, 1, 3].map((arg) => String((entry as (arg: unknown) => string)(arg)))
    if (typeof entry === 'object' && entry !== null) return Object.values(entry).flatMap(sample)
    return []
  }
  return sample(messages)
}

test('no message is empty, in any language', () => {
  for (const locale of LOCALES) {
    for (const text of everyText(MESSAGES[locale])) assert.ok(text.trim() !== '', `${locale}: empty text`)
  }
})

/** Construit par son code : un tiret cadratin tapé dans ce fichier le contredirait. */
const EM_DASH = String.fromCharCode(0x2014)

test('no message contains an em dash', () => {
  for (const locale of LOCALES) {
    for (const text of everyText(MESSAGES[locale])) assert.ok(!text.includes(EM_DASH), `${locale}: em dash in "${text}"`)
  }
})

test('French variants pick French, every other language picks English', () => {
  for (const tag of ['fr', 'fr-FR', 'fr-CA', 'fr_BE', 'FR-fr']) assert.equal(localeOf(tag), 'fr', tag)
  for (const tag of ['en', 'en-US', 'de-DE', 'zh-Hans', 'frisian', '']) assert.equal(localeOf(tag), 'en', tag)
  assert.equal(messagesFor('fr-FR'), MESSAGES.fr)
  assert.equal(messagesFor('ja-JP'), MESSAGES.en)
})

test('the texts fixed by the spec are the French ones', () => {
  const fr = MESSAGES.fr
  assert.equal(fr.remoteWorkspace, 'Espace distant : non pris en charge.')
  assert.equal(fr.noWorkspace, 'Ouvrez un espace de travail.')
  assert.equal(fr.wslWorkspace, "Espace WSL non pris en charge pour l'instant.")
  assert.equal(MESSAGES.en.wslWorkspace, 'WSL workspaces are not supported yet.')
  assert.equal(fr.replaceAsk('x'), "Remplacer x ? L'actuelle part à la Corbeille.")
  assert.equal(fr.removeAsk('x'), 'Retirer x du projet ? Elle disparaît pour tous les agents. Une copie part à la Corbeille.')
  assert.equal(fr.pointsHere('.claude/skills'), ".claude/skills pointe ici : retirez-le d'abord")
  assert.equal(fr.addCount(3), 'Ajouter (3)')
})

test('describeError translates every operation error code, in both languages', () => {
  for (const locale of LOCALES) {
    const m = MESSAGES[locale]
    for (const code of ['busy', 'no-workspace', 'no-trash', 'gone', 'preview-expired', 'path-not-found', 'no-target', 'workspace-changed', 'source-in-project'] as const) {
      const text = describeError({ code }, m)
      assert.ok(text.trim() !== '', `${locale} ${code}`)
      assert.notEqual(text, code)
    }
    assert.ok(describeError({ code: 'collision', folders: ['alpha', 'beta'] }, m).includes('alpha, beta'))
    assert.ok(describeError({ code: 'unsafe-dir', dirs: ['.claude/skills'] }, m).includes('.claude/skills'))
    assert.ok(describeError({ code: 'linked-target', dirs: ['.claude/skills'] }, m).includes('.claude/skills'))
  }
})

test('describeError translates library and plugin diagnostics by code', () => {
  const diagnostic = (code: string) => ({ code, message: 'RAW MESSAGE' })
  for (const locale of LOCALES) {
    const m = MESSAGES[locale]
    for (const code of [
      'SKILLS_LOCAL_PATH_NOT_FOUND',
      'SKILLS_GIT_AUTH_FAILED',
      'SKILLS_GIT_CLONE_TIMEOUT',
      'SKILLS_NO_VALID_SKILLS',
      'SKILLS_NO_MATCHING_SKILLS',
      'SKILLS_DUPLICATE_SKILL_NAME',
      'SKILLS_INVALID_LOCAL_LOCK',
      'SKILLS_LOCK_WRITE_FAILED',
      'SKILLS_SKILL_SKIPPED',
      'PLUGIN_EXCLUSIONS_FAILED',
      'PLUGIN_LOCK_KEPT',
      'PLUGIN_UNSAFE_DIR',
      'PLUGIN_NOT_TRACKED',
      'PLUGIN_STAGE_INCOMPLETE'
    ]) {
      const text = describeError(diagnostic(code), m)
      assert.ok(!text.includes('RAW MESSAGE'), `${locale} ${code} stays untranslated`)
      assert.ok(text.trim() !== '')
    }
  }
})

test('describeError shows the raw message of an unknown code', () => {
  assert.equal(describeError({ code: 'SKILLS_SOMETHING_NEW', message: 'Something new happened' }, MESSAGES.fr), 'Something new happened')
  // Un nom hérité d'Object ne doit pas passer pour un code connu.
  assert.equal(describeError({ code: 'constructor', message: 'raw' }, MESSAGES.fr), 'raw')
})

test('describeError joins the diagnostics of a library failure and says when the Trash holds the old version', () => {
  const error = {
    code: 'lib' as const,
    diagnostics: [
      { code: 'SKILLS_INSTALL_FAILED', message: 'boom' },
      { code: 'SKILLS_NEW', message: 'second line' }
    ],
    trashed: true
  }
  const fr = describeError(error, MESSAGES.fr)
  assert.ok(fr.includes('second line'))
  assert.ok(fr.includes(MESSAGES.fr.trashed))
  assert.ok(!describeError({ ...error, trashed: false }, MESSAGES.fr).includes(MESSAGES.fr.trashed))
})
