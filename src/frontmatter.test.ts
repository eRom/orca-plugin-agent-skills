// Front matter de SKILL.md : cas repris d'IdemA (skills_section.rs).
import { assert, test } from 'orca/testing'
import { parseFrontmatter } from './frontmatter'

test('reads plain, quoted, folded and literal descriptions', () => {
  assert.equal(parseFrontmatter('---\nname: zeta\ndescription: Last one\n---\nbody').description, 'Last one')
  assert.equal(parseFrontmatter('---\ndescription: "Quoted"\n---\n').description, 'Quoted')
  assert.equal(parseFrontmatter("---\ndescription: 'Single'\n---\n").description, 'Single')
  assert.deepEqual(parseFrontmatter('---\ndescription: >\n  Folded\n  text\nname: linked\n---\n'), {
    name: 'linked',
    description: 'Folded text'
  })
  assert.equal(parseFrontmatter('---\ndescription: |\n  Line one\n  Line two\n---\n').description, 'Line one\nLine two')
  assert.equal(parseFrontmatter('---\ndescription: >-\n  Chomped\n  too\n---\n').description, 'Chomped too')
})

test('tolerates a BOM, CRLF and keys in any order', () => {
  const text = '﻿---\r\ndescription: Hello\r\nname: "Fancy"\r\n---\r\nbody\r\n'
  assert.deepEqual(parseFrontmatter(text), { name: 'Fancy', description: 'Hello' })
  assert.deepEqual(parseFrontmatter('---\nname: only\n---\n'), { name: 'only' })
})

test('ignores keys that live in the body, after the closing fence', () => {
  assert.deepEqual(parseFrontmatter('---\nname: a\n---\ndescription: not me\n'), { name: 'a' })
})

test('returns nothing when the closing fence is missing', () => {
  assert.deepEqual(parseFrontmatter('---\nname: a\ndescription: b\nstill the body'), {})
})

test('returns nothing without front matter', () => {
  assert.deepEqual(parseFrontmatter('no front matter'), {})
  assert.deepEqual(parseFrontmatter('name: x\ndescription: y'), {})
  assert.deepEqual(parseFrontmatter(''), {})
})
