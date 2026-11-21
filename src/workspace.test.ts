// Résolution de l'espace focalisé : l'hôte est simulé, les dossiers sont de vrais dossiers temporaires.
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { tempDir } from './test-fixtures'
import { classifyRoot, resolveWorkspace, type HostCall } from './workspace'

type Row = { id: string; kind: 'worktree' | 'folder'; name: string; projectId?: string | null; path: string; branch: string | null; hostId: string | null }
type Context = { workspaceId?: string; branch: string; displayName: string; terminals: [] } | null

/** Hôte factice : `readContext` et `workspace.list` répondent ce qu'on leur donne. */
const hostOf = (context: Context, rows: Row[]): HostCall =>
  (async (method: string) => {
    if (method === 'workspace.readContext') return context
    if (method === 'workspace.list') return { workspaces: rows, truncated: false }
    throw new Error(`unexpected host call ${method}`)
  }) as unknown as HostCall

const context = (workspaceId?: string): Context => ({ workspaceId, branch: 'main', displayName: 'x', terminals: [] })
const row = (path: string, over: Partial<Row> = {}): Row => ({
  id: 'identity:x',
  kind: 'worktree',
  name: 'feature',
  projectId: 'p1',
  path,
  branch: 'feat/x',
  hostId: 'local',
  ...over
})

/** `resolveWorkspace` sous macOS : le cas des tests historiques. */
const onDarwin = (call: HostCall, home: string, log?: (line: string) => void) => resolveWorkspace(call, home, 'darwin', log)

test('a local worktree is ready, with the branch', async () => {
  const root = tempDir('ws-ready')
  const result = await onDarwin(hostOf(context('identity:x'), [row(root)]), tempDir('ws-home'))
  assert.deepEqual(result, {
    root,
    view: { status: 'ready', id: 'identity:x', name: 'feature', branch: 'feat/x', linkedWorktree: false, network: false }
  })
})

test('the branch falls back to the context one', async () => {
  const root = tempDir('ws-fallback')
  const result = await onDarwin(hostOf(context('identity:x'), [row(root, { projectId: null, branch: null, hostId: null })]), tempDir('ws-home'))
  assert.ok('root' in result)
  assert.deepEqual(result.view, { status: 'ready', id: 'identity:x', name: 'feature', branch: 'main', linkedWorktree: false, network: false })
})

test('a .git file marks a linked worktree, a .git folder does not', async () => {
  const linked = tempDir('ws-linked')
  writeFileSync(join(linked, '.git'), 'gitdir: /elsewhere/.git/worktrees/x\n')
  const main = tempDir('ws-main')
  mkdirSync(join(main, '.git'))
  const home = tempDir('ws-home')
  const a = await onDarwin(hostOf(context('identity:x'), [row(linked)]), home)
  const b = await onDarwin(hostOf(context('identity:x'), [row(main)]), home)
  assert.ok('root' in a && 'root' in b)
  assert.equal(a.view.status === 'ready' && a.view.linkedWorktree, true)
  assert.equal(b.view.status === 'ready' && b.view.linkedWorktree, false)
})

test('no context, no workspace id and an unlisted id are all none', async () => {
  const root = tempDir('ws-none')
  const home = tempDir('ws-home')
  assert.deepEqual(await onDarwin(hostOf(null, [row(root)]), home), { view: { status: 'none' } })
  assert.deepEqual(await onDarwin(hostOf(context(), [row(root)]), home), { view: { status: 'none' } })
  assert.deepEqual(await onDarwin(hostOf(context('identity:other'), [row(root)]), home), { view: { status: 'none' } })
})

test('ssh and runtime hosts are remote and never touch the path', async () => {
  const home = tempDir('ws-home')
  for (const hostId of ['ssh:box', 'runtime:cloud']) {
    const result = await onDarwin(hostOf(context('identity:x'), [row('/does/not/exist', { hostId })]), home)
    assert.deepEqual(result, { view: { status: 'remote' } })
  }
})

test('a path that is not on disk is missing', async () => {
  const result = await onDarwin(hostOf(context('identity:x'), [row('/does/not/exist/anywhere')]), tempDir('ws-home'))
  assert.deepEqual(result, { view: { status: 'missing' } })
})

test('the home folder is refused, also through a symlink', async () => {
  const home = tempDir('ws-home')
  const link = join(tempDir('ws-links'), 'home-link')
  symlinkSync(home, link)
  assert.deepEqual(await onDarwin(hostOf(context('identity:x'), [row(home)]), home), { view: { status: 'home' } })
  assert.deepEqual(await onDarwin(hostOf(context('identity:x'), [row(link)]), home), { view: { status: 'home' } })
})

test('an unlisted id is logged only when the host list was truncated', async () => {
  const root = tempDir('ws-truncated')
  const home = tempDir('ws-home')
  const hostWith = (truncated: boolean): HostCall =>
    (async (method: string) =>
      method === 'workspace.readContext' ? context('identity:other') : { workspaces: [row(root)], truncated }) as unknown as HostCall
  const lines: string[] = []
  assert.deepEqual(await onDarwin(hostWith(true), home, (line) => lines.push(line)), { view: { status: 'none' } })
  assert.equal(lines.length, 1)
  assert.match(lines[0]!, /truncated/)
  await onDarwin(hostWith(false), home, (line) => lines.push(line))
  assert.equal(lines.length, 1, 'a complete list that lacks the id is not worth a line')
})

test('classifies the shape of a workspace root', () => {
  assert.equal(classifyRoot('C:\\p', 'win32'), 'drive')
  assert.equal(classifyRoot('c:/p', 'win32'), 'drive')
  assert.equal(classifyRoot('\\\\wsl.localhost\\U\\p', 'win32'), 'unc')
  assert.equal(classifyRoot('\\\\server\\share', 'win32'), 'unc')
  assert.equal(classifyRoot('/home/r/p', 'win32'), 'posix')
  assert.equal(classifyRoot('p', 'win32'), 'other')
  assert.equal(classifyRoot('/Users/me/p', 'darwin'), 'posix')
})

test('on Windows, a POSIX root is a WSL workspace and the path is never read', async () => {
  let reads = 0
  const realpathFn = async (path: string): Promise<string> => {
    reads += 1
    return path
  }
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row('/home/r/p')]), tempDir('ws-home'), 'win32', undefined, realpathFn)
  assert.deepEqual(result, { view: { status: 'wsl' } })
  assert.equal(reads, 0)
})

test('on Windows, a UNC root is ready and flagged as a network workspace', async () => {
  const unc = '\\\\wsl.localhost\\U\\home\\r\\p'
  const home = tempDir('ws-home')
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row(unc)]), home, 'win32', undefined, async (path) => path)
  assert.deepEqual(result, {
    root: unc,
    view: { status: 'ready', id: 'identity:x', name: 'feature', branch: 'feat/x', linkedWorktree: false, network: true }
  })
})

test('on Windows, a drive root is a plain local workspace', async () => {
  const drive = 'C:\\dev\\p'
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row(drive)]), tempDir('ws-home'), 'win32', undefined, async (path) => path)
  assert.ok('root' in result && result.view.status === 'ready')
  assert.equal(result.view.network, false)
})

test('on Windows, an unreadable relative root stays missing', async () => {
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row('p')]), tempDir('ws-home'), 'win32', undefined, async () => {
    throw new Error('ENOENT')
  })
  assert.deepEqual(result, { view: { status: 'missing' } })
})

test('on macOS a real folder is never a network workspace, and a leading slash is no WSL', async () => {
  const root = tempDir('ws-posix')
  const result = await onDarwin(hostOf(context('identity:x'), [row(root)]), tempDir('ws-home'))
  assert.ok('root' in result && result.view.status === 'ready')
  assert.equal(result.view.network, false)
})

test('the root shape is logged without the path, before the remote check', async () => {
  const unc = '\\\\wsl.localhost\\U\\home\\r\\SECRET-PROJECT'
  const lines: string[] = []
  await resolveWorkspace(hostOf(context('identity:x'), [row(unc)]), tempDir('ws-home'), 'win32', (line) => lines.push(line), async (path) => path)
  assert.deepEqual(lines, ['workspace root shape=unc'])
  const remote: string[] = []
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row('/srv/p', { hostId: 'ssh:box' })]), tempDir('ws-home'), 'win32', (line) => remote.push(line))
  assert.deepEqual(result, { view: { status: 'remote' } })
  assert.deepEqual(remote, ['workspace root shape=posix'], 'a remote workspace is classified before the early return')
})
