// Exclusions par projet : fonctions pures sur la valeur du stockage.
import { assert, test } from 'orca/testing'
import { exclude, EXCLUSIONS_KEY, excludedOf, include, parseExclusions, type Exclusions } from './exclusions'

test('the storage key is versioned', () => {
  assert.equal(EXCLUSIONS_KEY, 'exclusions.v1')
})

test('parse keeps a valid shape', () => {
  const raw = { p1: { alpha: ['grok', 'pi'] }, p2: { beta: ['codex'] } }
  assert.deepEqual(parseExclusions(raw), raw)
})

test('parse falls back to empty on any invalid shape', () => {
  for (const raw of [undefined, null, 42, 'x', [], [['p1']], { p1: 'alpha' }, { p1: [] }, { p1: { alpha: 'grok' } }, { p1: { alpha: [1] } }, { p1: { alpha: [null] } }]) {
    assert.deepEqual(parseExclusions(raw), {}, JSON.stringify(raw))
  }
})

test('parse drops empty lists and duplicates', () => {
  assert.deepEqual(parseExclusions({ p1: { alpha: ['grok', 'grok'], beta: [] }, p2: {} }), { p1: { alpha: ['grok'] } })
})

test('parse survives a key named __proto__', () => {
  const raw = JSON.parse('{"__proto__":{"alpha":["grok"]}}')
  const parsed = parseExclusions(raw)
  assert.deepEqual(excludedOf(parsed, '__proto__', 'alpha'), ['grok'])
  assert.deepEqual(excludedOf(parsed, 'other', 'alpha'), [])
  assert.equal(({} as Record<string, unknown>).alpha, undefined)
})

test('excludedOf reads one skill of one project, empty otherwise', () => {
  const ex: Exclusions = { p1: { alpha: ['grok'] } }
  assert.deepEqual(excludedOf(ex, 'p1', 'alpha'), ['grok'])
  assert.deepEqual(excludedOf(ex, 'p1', 'beta'), [])
  assert.deepEqual(excludedOf(ex, 'p2', 'alpha'), [])
})

test('exclude then include round-trips and never mutates its input', () => {
  const start: Exclusions = { p1: { alpha: ['grok'] } }
  const snapshot = JSON.stringify(start)
  const withPi = exclude(start, 'p1', 'alpha', ['pi', 'grok'])
  assert.deepEqual(excludedOf(withPi, 'p1', 'alpha'), ['grok', 'pi'])
  assert.equal(JSON.stringify(start), snapshot)

  const back = include(withPi, 'p1', 'alpha', ['pi'])
  assert.deepEqual(back, start)
  assert.deepEqual(excludedOf(withPi, 'p1', 'alpha'), ['grok', 'pi'])

  const fresh = exclude({}, 'p9', 'zeta', ['codex'])
  assert.deepEqual(fresh, { p9: { zeta: ['codex'] } })
})

test('exclude keeps other skills and other projects untouched', () => {
  const start: Exclusions = { p1: { alpha: ['grok'], beta: ['pi'] }, p2: { alpha: ['codex'] } }
  const next = exclude(start, 'p1', 'alpha', ['dsh'])
  assert.deepEqual(next, { p1: { alpha: ['grok', 'dsh'], beta: ['pi'] }, p2: { alpha: ['codex'] } })
})

test('include without agents clears the skill', () => {
  const start: Exclusions = { p1: { alpha: ['grok', 'pi'], beta: ['codex'] } }
  assert.deepEqual(include(start, 'p1', 'alpha'), { p1: { beta: ['codex'] } })
})

test('include removes empty entries up to the project', () => {
  assert.deepEqual(include({ p1: { alpha: ['grok'] } }, 'p1', 'alpha'), {})
  assert.deepEqual(include({ p1: { alpha: ['grok'] } }, 'p1', 'alpha', ['grok']), {})
})

test('include on an unknown skill or project changes nothing', () => {
  const start: Exclusions = { p1: { alpha: ['grok'] } }
  assert.deepEqual(include(start, 'p1', 'beta'), start)
  assert.deepEqual(include(start, 'p2', 'alpha', ['grok']), start)
})
