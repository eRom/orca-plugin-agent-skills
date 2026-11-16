// Sélecteur de dossier macOS : ExecRunner factice, jamais de vraie boîte de dialogue.
import { assert, test } from 'orca/testing'
import type { ExecRunner } from './trash'
import { folderPicker } from './folder-picker'

type Call = { file: string; args: readonly string[] }

function fakeRunner(result: { code: number; stdout: string; stderr: string }): { run: ExecRunner; calls: Call[] } {
  const calls: Call[] = []
  const run: ExecRunner = async (file, args) => {
    calls.push({ file, args })
    return result
  }
  return { run, calls }
}

test('no folder picker off macOS', () => {
  const { run } = fakeRunner({ code: 0, stdout: '', stderr: '' })
  assert.equal(folderPicker('linux', run), null)
  assert.equal(folderPicker('win32', run), null)
  assert.notEqual(folderPicker('darwin', run), null)
})

test('folder picker returns the chosen POSIX path', async () => {
  const { run, calls } = fakeRunner({ code: 0, stdout: '/Users/me/dev/project/\n', stderr: '' })
  const pick = folderPicker('darwin', run)
  assert.ok(pick)
  assert.equal(await pick(), '/Users/me/dev/project/')
  assert.deepEqual(calls, [{ file: '/usr/bin/osascript', args: ['-e', 'POSIX path of (choose folder)'] }])
})

test('folder picker cancelled returns null', async () => {
  // stderr localisé : on détecte le code (-128), jamais le texte.
  const { run } = fakeRunner({ code: 1, stdout: '', stderr: '0:17: execution error: Annulé par l’utilisateur. (-128)\n' })
  const pick = folderPicker('darwin', run)
  assert.ok(pick)
  assert.equal(await pick(), null)
})

test('folder picker rejects on any other failure', async () => {
  const { run } = fakeRunner({ code: 1, stdout: '', stderr: 'osascript: something broke (-1708)' })
  const pick = folderPicker('darwin', run)
  assert.ok(pick)
  await assert.rejects(pick(), /-1708/)
})
