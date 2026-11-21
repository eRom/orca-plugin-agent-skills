// Corbeille par OS : le Trasher est testé avec un ExecRunner factice, jamais avec la vraie corbeille.
import { assert, test } from 'orca/testing'
import { execRunner, GIO_BIN, systemTrasher, TRASH_BIN, TRASH_VERIFIED, type ExecRunner } from './trash'

type Call = { file: string; args: readonly string[] }

function fakeRunner(result: { code: number; stdout: string; stderr: string }): { run: ExecRunner; calls: Call[] } {
  const calls: Call[] = []
  const run: ExecRunner = async (file, args) => {
    calls.push({ file, args })
    return result
  }
  return { run, calls }
}

const OK = { code: 0, stdout: '', stderr: '' }

test('only macOS is verified in this version', () => {
  assert.deepEqual([...TRASH_VERIFIED], ['darwin'])
})

test('darwin keeps /usr/bin/trash', async () => {
  const { run, calls } = fakeRunner(OK)
  const { trasher, status } = systemTrasher('darwin', (p) => p === TRASH_BIN, run)
  assert.equal(status, 'ready')
  assert.ok(trasher)
  await trasher(['/a/one', '/b/two'])
  assert.deepEqual(calls, [{ file: '/usr/bin/trash', args: ['/a/one', '/b/two'] }])
})

test('linux calls gio trash with -- before the paths', async () => {
  const { run, calls } = fakeRunner(OK)
  const { trasher, status } = systemTrasher('linux', (p) => p === GIO_BIN, run, new Set(['darwin', 'linux']))
  assert.equal(status, 'ready')
  assert.ok(trasher)
  await trasher(['/a/-rf', '/b/two'])
  assert.deepEqual(calls, [{ file: '/usr/bin/gio', args: ['trash', '--', '/a/-rf', '/b/two'] }])
})

test('linux is unverified by default', () => {
  const { run, calls } = fakeRunner(OK)
  const result = systemTrasher('linux', () => true, run)
  assert.deepEqual(result, { trasher: null, status: 'unverified' })
  assert.equal(calls.length, 0)
})

test('windows has no trash in this version', () => {
  const { run, calls } = fakeRunner(OK)
  assert.deepEqual(systemTrasher('win32', () => true, run), { trasher: null, status: 'unverified' })
  // Même si l'OS figurait dans la liste des OS vérifiés : aucun moyen n'existe, rien n'est lancé.
  assert.deepEqual(systemTrasher('win32', () => true, run, new Set(['win32'])), { trasher: null, status: 'unverified' })
  assert.equal(calls.length, 0)
})

test('other platforms have no trash', () => {
  const { run, calls } = fakeRunner(OK)
  assert.deepEqual(systemTrasher('freebsd', () => true, run), { trasher: null, status: 'missing' })
  assert.deepEqual(systemTrasher('freebsd', () => true, run, new Set(['freebsd'])), { trasher: null, status: 'missing' })
  assert.equal(calls.length, 0)
})

test('missing binary gives missing', () => {
  const { run } = fakeRunner(OK)
  assert.deepEqual(systemTrasher('darwin', () => false, run), { trasher: null, status: 'missing' })
  assert.deepEqual(systemTrasher('linux', () => false, run, new Set(['linux'])), { trasher: null, status: 'missing' })
})

test('trasher rejects with stderr on a non-zero exit', async () => {
  const { run } = fakeRunner({ code: 1, stdout: '', stderr: 'trash: permission denied' })
  const { trasher } = systemTrasher('darwin', () => true, run)
  assert.ok(trasher)
  await assert.rejects(trasher(['/a/one']), /permission denied/)
})

test('execRunner runs a binary without a shell and returns its output', async () => {
  const result = await execRunner('/bin/echo', ['$HOME; echo injected'])
  assert.deepEqual(result, { code: 0, stdout: '$HOME; echo injected\n', stderr: '' })
})

test('execRunner reports a failing exit code instead of throwing', async () => {
  const result = await execRunner('/bin/ls', ['/nonexistent-agent-skills-path'])
  assert.notEqual(result.code, 0)
  assert.ok(result.stderr.length > 0)
})
