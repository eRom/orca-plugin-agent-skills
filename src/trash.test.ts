// Corbeille macOS : le Trasher est testé avec un ExecRunner factice, jamais avec la vraie corbeille.
import { assert, test } from 'orca/testing'
import { execRunner, systemTrasher, TRASH_BIN, type ExecRunner } from './trash'

type Call = { file: string; args: readonly string[] }

function fakeRunner(result: { code: number; stdout: string; stderr: string }): { run: ExecRunner; calls: Call[] } {
  const calls: Call[] = []
  const run: ExecRunner = async (file, args) => {
    calls.push({ file, args })
    return result
  }
  return { run, calls }
}

test('no trasher off macOS or without /usr/bin/trash', () => {
  const { run } = fakeRunner({ code: 0, stdout: '', stderr: '' })
  assert.equal(systemTrasher('linux', () => true, run), null)
  assert.equal(systemTrasher('win32', () => true, run), null)
  assert.equal(systemTrasher('darwin', () => false, run), null)
  assert.equal(TRASH_BIN, '/usr/bin/trash')
  assert.notEqual(systemTrasher('darwin', (p) => p === TRASH_BIN, run), null)
})

test('trasher passes absolute paths to /usr/bin/trash', async () => {
  const { run, calls } = fakeRunner({ code: 0, stdout: '', stderr: '' })
  const trasher = systemTrasher('darwin', () => true, run)
  assert.ok(trasher)
  await trasher(['/a/one', '/b/two'])
  assert.deepEqual(calls, [{ file: '/usr/bin/trash', args: ['/a/one', '/b/two'] }])
})

test('trasher rejects with stderr on a non-zero exit', async () => {
  const { run } = fakeRunner({ code: 1, stdout: '', stderr: 'trash: permission denied' })
  const trasher = systemTrasher('darwin', () => true, run)
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
