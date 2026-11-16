// Résolution de l'espace focalisé : l'hôte est simulé, les dossiers sont de vrais dossiers temporaires.
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assert, test } from 'orca/testing'
import { tempDir } from './test-fixtures'
import { resolveWorkspace, type HostCall } from './workspace'

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

test('a local worktree is ready, with the project key and the branch', async () => {
  const root = tempDir('ws-ready')
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row(root)]), tempDir('ws-home'))
  assert.deepEqual(result, {
    root,
    projectKey: 'p1',
    view: { status: 'ready', name: 'feature', branch: 'feat/x', linkedWorktree: false }
  })
})

test('the project key falls back to the workspace id, the branch to the context one', async () => {
  const root = tempDir('ws-fallback')
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row(root, { projectId: null, branch: null, hostId: null })]), tempDir('ws-home'))
  assert.ok('root' in result)
  assert.equal(result.projectKey, 'identity:x')
  assert.deepEqual(result.view, { status: 'ready', name: 'feature', branch: 'main', linkedWorktree: false })
})

test('a .git file marks a linked worktree, a .git folder does not', async () => {
  const linked = tempDir('ws-linked')
  writeFileSync(join(linked, '.git'), 'gitdir: /elsewhere/.git/worktrees/x\n')
  const main = tempDir('ws-main')
  mkdirSync(join(main, '.git'))
  const home = tempDir('ws-home')
  const a = await resolveWorkspace(hostOf(context('identity:x'), [row(linked)]), home)
  const b = await resolveWorkspace(hostOf(context('identity:x'), [row(main)]), home)
  assert.ok('root' in a && 'root' in b)
  assert.equal(a.view.status === 'ready' && a.view.linkedWorktree, true)
  assert.equal(b.view.status === 'ready' && b.view.linkedWorktree, false)
})

test('no context, no workspace id and an unlisted id are all none', async () => {
  const root = tempDir('ws-none')
  const home = tempDir('ws-home')
  assert.deepEqual(await resolveWorkspace(hostOf(null, [row(root)]), home), { view: { status: 'none' } })
  assert.deepEqual(await resolveWorkspace(hostOf(context(), [row(root)]), home), { view: { status: 'none' } })
  assert.deepEqual(await resolveWorkspace(hostOf(context('identity:other'), [row(root)]), home), { view: { status: 'none' } })
})

test('ssh and runtime hosts are remote and never touch the path', async () => {
  const home = tempDir('ws-home')
  for (const hostId of ['ssh:box', 'runtime:cloud']) {
    const result = await resolveWorkspace(hostOf(context('identity:x'), [row('/does/not/exist', { hostId })]), home)
    assert.deepEqual(result, { view: { status: 'remote' } })
  }
})

test('a path that is not on disk is missing', async () => {
  const result = await resolveWorkspace(hostOf(context('identity:x'), [row('/does/not/exist/anywhere')]), tempDir('ws-home'))
  assert.deepEqual(result, { view: { status: 'missing' } })
})

test('the home folder is refused, also through a symlink', async () => {
  const home = tempDir('ws-home')
  const link = join(tempDir('ws-links'), 'home-link')
  symlinkSync(home, link)
  assert.deepEqual(await resolveWorkspace(hostOf(context('identity:x'), [row(home)]), home), { view: { status: 'home' } })
  assert.deepEqual(await resolveWorkspace(hostOf(context('identity:x'), [row(link)]), home), { view: { status: 'home' } })
})

test('an unlisted id is logged only when the host list was truncated', async () => {
  const root = tempDir('ws-truncated')
  const home = tempDir('ws-home')
  const hostWith = (truncated: boolean): HostCall =>
    (async (method: string) =>
      method === 'workspace.readContext' ? context('identity:other') : { workspaces: [row(root)], truncated }) as unknown as HostCall
  const lines: string[] = []
  assert.deepEqual(await resolveWorkspace(hostWith(true), home, (line) => lines.push(line)), { view: { status: 'none' } })
  assert.equal(lines.length, 1)
  assert.match(lines[0]!, /truncated/)
  await resolveWorkspace(hostWith(false), home, (line) => lines.push(line))
  assert.equal(lines.length, 1, 'a complete list that lacks the id is not worth a line')
})
