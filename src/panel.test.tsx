// Le panneau Skills tourne ici avec le vrai runtime d'Orca ; le worker est remplacé par des réponses simulées.
import { assert, hostError, mockHost, mount, test } from 'orca/testing'
import { agentById } from './agents'
import { MESSAGES } from './copy'
import * as panel from './panel'
import type { AgentView, OpFinished, OpRequest, PanelState, PreviewAnswer, PreviewRequest, SearchAnswer, StartAnswer } from './protocol'
import type { CopyKind, DiskSkill, SkillCopy } from './scan'
import type { ManagedDir } from './skill-dirs'
import { TRUST_GATED } from './skill-dirs'
import { buildRows, type LockEntry } from './visibility'

const FR = MESSAGES.fr
const EN = MESSAGES.en

const ROOT = '/work/project'
const HOME = '/Users/me'
/** Les agents de Romain, dans l'ordre de l'inventaire d'Orca. */
const ROMAIN = ['claude', 'codex', 'grok', 'opencode', 'pi', 'antigravity', 'dsh']
/** Plus de douze agents actifs : les pastilles se replient. */
const MANY = [...ROMAIN, 'gemini', 'goose', 'amp', 'kilo', 'kiro', 'cursor', 'droid']

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
/** Plus que le délai de 300 ms de la recherche. */
const DEBOUNCE = 380

/** Laisse passer la pause de frappe, puis le rendu que la réponse du worker déclenche (hors d'un geste du test). */
async function afterPause(view: { settled(): Promise<void> }): Promise<void> {
  await sleep(DEBOUNCE)
  await view.settled()
}

function agentViews(ids: readonly string[]): AgentView[] {
  return ids.map((id) => {
    const spec = agentById(id)!
    return { id, label: spec.label, icon: spec.icon, trust: TRUST_GATED[id] ?? null }
  })
}

function copyOf(dir: ManagedDir, folder: string, hash = 'h1', kind: CopyKind = 'dir', realPath?: string): SkillCopy {
  return { dir, path: `${ROOT}/${dir}/${folder}`, kind, realPath: realPath ?? `${ROOT}/${dir}/${folder}`, hash }
}

function diskSkill(folder: string, copies: SkillCopy[], description = `Skill ${folder}`): DiskSkill {
  return { folder, displayName: folder, description, copies }
}

type StateOptions = {
  agents?: readonly string[]
  skills?: DiskSkill[]
  lock?: Record<string, LockEntry>
  excluded?: Record<string, string[]>
  workspace?: PanelState['workspace']
  overrides?: Partial<PanelState>
}

function stateOf(options: StateOptions = {}): PanelState {
  const agents = options.agents ?? ROMAIN
  const rows = buildRows(
    { skills: options.skills ?? [], unsafeDirs: [] },
    new Map(Object.entries(options.lock ?? {})),
    agents,
    (folder) => options.excluded?.[folder] ?? [],
    HOME
  )
  return {
    workspace: options.workspace ?? { status: 'ready', name: 'erom-tool', branch: 'feat/skills', linkedWorktree: true },
    agents: agentViews(agents),
    inventory: 'detected',
    rows,
    unsafeDirs: [],
    lockUnreadable: false,
    capabilities: { trash: true, folderPicker: true },
    busy: null,
    ...options.overrides
  }
}

/** Une skill écrite à la main dans `.claude/skills` seulement : Claude et OpenCode la voient. */
const HANDWRITTEN = diskSkill('motion-context', [copyOf('.claude/skills', 'motion-context')], 'Context for motion work')

type Setup = {
  state?: PanelState
  search?: (input: { query: string }) => SearchAnswer | Promise<SearchAnswer>
  preview?: (input: PreviewRequest) => PreviewAnswer | Promise<PreviewAnswer>
  start?: (input: { op: OpRequest }) => StartAnswer | Promise<StartAnswer>
  pick?: () => { path: string | null }
  pathCheck?: (input: { text: string }) => { exists: boolean }
  refresh?: () => PanelState | Promise<PanelState>
  locale?: string
  theme?: 'light' | 'dark'
}

const ONE_SKILL = (name: string): PreviewAnswer => ({
  ok: true,
  previewId: 'p1',
  label: { kind: 'local', path: '~/dev/skills' },
  skills: [{ name, description: `About ${name}` }],
  preselected: [name]
})

async function open(setup: Setup = {}) {
  const log = {
    searches: [] as string[],
    previews: [] as PreviewRequest[],
    pathChecks: [] as string[],
    ops: [] as OpRequest[],
    stateReads: [] as string[]
  }
  let current = setup.state ?? stateOf({ skills: [HANDWRITTEN] })
  const host = mockHost({
    requests: {
      'state.get': () => {
        log.stateReads.push('state.get')
        return current
      },
      'state.refresh': () => {
        log.stateReads.push('state.refresh')
        return setup.refresh ? setup.refresh() : current
      },
      search: (input: { query: string }) => {
        log.searches.push(input.query)
        return setup.search ? setup.search(input) : { ok: true as const, hits: [] }
      },
      'path.check': (input: { text: string }) => {
        log.pathChecks.push(input.text)
        return setup.pathCheck ? setup.pathCheck(input) : { exists: true }
      },
      'source.preview': (input: PreviewRequest) => {
        log.previews.push(input)
        return setup.preview ? setup.preview(input) : ONE_SKILL('alpha')
      },
      'op.start': (input: { op: OpRequest }) => {
        log.ops.push(input.op)
        return setup.start ? setup.start(input) : { ok: true as const, opId: `op-${log.ops.length}` }
      },
      'folder.pick': () => (setup.pick ? setup.pick() : { path: null })
    }
  })
  const view = await mount(panel, { host, locale: setup.locale ?? 'fr-FR', theme: setup.theme })
  return {
    view,
    host,
    log,
    /** Remplace l'état que `state.get` rend. */
    setState: (next: PanelState) => {
      current = next
    }
  }
}

type View = Awaited<ReturnType<typeof open>>['view']

async function expectClean(view: View): Promise<void> {
  assert.deepEqual(view.errors, [])
  assert.deepEqual(view.refusals, [])
  assert.deepEqual(view.warnings, [])
  await view.unmount()
}

const HIT_A = { name: 'motion', source: 'acme/motion-kit', skillId: 'motion', installs: 1_000_000, installed: false }
const HIT_B = { name: 'motion-audio', source: 'acme/audio', skillId: 'motion-audio', installs: 916_900, installed: true }

const SEARCH_FIELD = { label: FR.searchLabel }

test('shows the skills of the project with agent chips', async () => {
  // AC-1 : Claude et OpenCode voient la skill, les autres sont estompés.
  const { view } = await open()
  assert.notEqual(view.find({ text: 'erom-tool · feat/skills' }), null)
  assert.notEqual(view.find({ text: FR.worktreeNote }), null)
  assert.notEqual(view.find({ text: `${FR.inProject} · 1` }), null)
  assert.notEqual(view.find({ text: 'motion-context' }), null)
  assert.notEqual(view.find({ text: FR.handwritten }), null)

  const chips = view.findAll({ type: 'Image' }).map((image) => [image.props.src, image.props.size])
  assert.deepEqual(chips, [
    ['agent-icons/claude.png', 'xs'],
    ['agent-icons/dim/codex.png', 'xs'],
    ['agent-icons/dim/grok.png', 'xs'],
    ['agent-icons/opencode.png', 'xs'],
    ['agent-icons/dim/pi.png', 'xs'],
    ['agent-icons/dim/antigravity.png', 'xs'],
    ['agent-icons/dim/dsh.png', 'xs']
  ])
  assert.notEqual(view.find({ type: 'Callout', text: new RegExp(FR.absentFor('Codex, Grok, Pi, Antigravity, DeepSeek Harness')) }), null)
  await expectClean(view)
})

test('uses the light variant of an icon on a light theme', async () => {
  const { view } = await open({ theme: 'light' })
  const sources = view.findAll({ type: 'Image' }).map((image) => String(image.props.src))
  // Codex est dessiné en `currentColor` : sa variante claire, estompée aussi quand l'agent est absent.
  assert.ok(sources.includes('agent-icons/dim/on-light/codex.png'), sources.join())
  await expectClean(view)
})

test('shows the source of a skill: owner/repo, a local path, or handwritten', async () => {
  const state = stateOf({
    skills: [
      diskSkill('remote-skill', [copyOf('.claude/skills', 'remote-skill')]),
      diskSkill('local-skill', [copyOf('.claude/skills', 'local-skill')]),
      HANDWRITTEN
    ],
    lock: {
      'remote-skill': { source: 'acme/motion-kit', libName: 'remote-skill' },
      'local-skill': { source: `${HOME}/dev/tools/skills`, libName: 'local-skill' }
    }
  })
  const { view } = await open({ state })
  assert.notEqual(view.find({ type: 'Code', text: 'acme/motion-kit' }), null)
  assert.notEqual(view.find({ type: 'Code', text: '~/dev/tools/skills' }), null)
  assert.equal(view.findAll({ text: FR.handwritten }).length, 1)
  await expectClean(view)
})

test('Propager sends the missing agents', async () => {
  const { view, log } = await open()
  await view.press({ text: FR.propagate })
  assert.deepEqual(log.ops, [{ kind: 'propagate', folder: 'motion-context', agents: ['codex', 'grok', 'pi', 'antigravity', 'dsh'] }])
  await expectClean(view)
})

test('does not warn when every agent sees the skill', async () => {
  const everywhere = diskSkill('alpha', [copyOf('.claude/skills', 'alpha'), copyOf('.agents/skills', 'alpha'), copyOf('.grok/skills', 'alpha')])
  const { view } = await open({ state: stateOf({ skills: [everywhere] }) })
  assert.equal(view.find({ text: FR.propagate }), null)
  assert.equal(view.findAll({ type: 'Image' }).filter((image) => String(image.props.src).includes('/dim/')).length, 0)
  await expectClean(view)
})

test('searches after two characters and marks installed hits', async () => {
  const { view, log } = await open({ search: () => ({ ok: true, hits: [HIT_A, HIT_B] }) })
  await view.type(SEARCH_FIELD, 'm')
  await afterPause(view)
  assert.deepEqual(log.searches, [])
  await view.type(SEARCH_FIELD, 'o')
  assert.deepEqual(log.searches, [], 'nothing is sent before the typing pauses')
  await afterPause(view)
  assert.deepEqual(log.searches, ['mo'])

  assert.notEqual(view.find({ text: `${FR.searchGroup(2)}` }), null)
  assert.notEqual(view.find({ text: 'acme/motion-kit · 1M' }), null)
  assert.notEqual(view.find({ text: 'acme/audio · 916,9K' }), null)
  // Le premier se propose, le second est déjà dans le projet.
  assert.notEqual(view.find({ testId: 'add-acme/motion-kit/motion' }), null)
  assert.equal(view.find({ testId: 'add-acme/audio/motion-audio' }), null)
  assert.equal(view.findAll({ type: 'Badge', text: FR.installed }).length, 1)
  // Les skills du projet cèdent la place aux résultats.
  assert.equal(view.find({ text: 'motion-context' }), null)
  await expectClean(view)
})

test('shows a message when nothing matches and when skills.sh does not answer', async () => {
  let answer: SearchAnswer = { ok: true, hits: [] }
  const { view } = await open({ search: () => answer })
  await view.type(SEARCH_FIELD, 'zz')
  await afterPause(view)
  assert.notEqual(view.find({ text: FR.noResults }), null)
  answer = { ok: false, error: 'unreachable' }
  await view.type(SEARCH_FIELD, 'z')
  await afterPause(view)
  assert.notEqual(view.find({ text: FR.searchUnreachable }), null)
  assert.equal(view.find({ text: FR.noResults }), null)
  await expectClean(view)
})

test('ignores a search answer that arrives after a newer query', async () => {
  let releaseSlow: () => void = () => undefined
  const slow = new Promise<void>((resolve) => {
    releaseSlow = resolve
  })
  const { view, log } = await open({
    search: async ({ query }) => {
      if (query === 'ab') {
        await slow
        return { ok: true, hits: [{ ...HIT_A, name: 'stale', skillId: 'stale', source: 'old/answer' }] }
      }
      return { ok: true, hits: [{ ...HIT_B, installed: false, name: 'fresh', skillId: 'fresh', source: 'new/answer' }] }
    }
  })
  await view.type(SEARCH_FIELD, 'ab')
  // Pas de `settled` ici : il attendrait la réponse lente.
  await sleep(DEBOUNCE)
  // Non attendu : tant que la requête lente est en vol, le test ne se pose pas.
  const second = view.type(SEARCH_FIELD, 'c')
  await sleep(DEBOUNCE)
  assert.deepEqual(log.searches, ['ab', 'abc'])
  releaseSlow()
  await second
  await view.settled()
  assert.equal(view.find({ text: /old\/answer/ }), null)
  assert.notEqual(view.find({ text: /new\/answer/ }), null)
  await expectClean(view)
})

test('a failure of a superseded search is not shown', async () => {
  let failSlow: () => void = () => undefined
  const slow = new Promise<void>((_, reject) => {
    failSlow = () => reject(new Error('socket closed'))
  })
  const { view } = await open({
    search: async ({ query }) => {
      if (query === 'ab') await slow
      return { ok: true, hits: [HIT_A] }
    }
  })
  await view.type(SEARCH_FIELD, 'ab')
  await sleep(DEBOUNCE)
  const second = view.type(SEARCH_FIELD, 'c')
  await sleep(DEBOUNCE)
  failSlow()
  await second
  await view.settled()
  assert.equal(view.find({ text: FR.searchUnreachable }), null)
  assert.notEqual(view.find({ type: 'Text', text: 'acme/motion-kit · 1M' }), null)
  await expectClean(view)
})

test('the cross empties the field and brings the project list back', async () => {
  const { view } = await open({ search: () => ({ ok: true, hits: [HIT_A] }) })
  assert.equal(view.find({ label: FR.clearSearchLabel }), null)
  await view.type(SEARCH_FIELD, 'mo')
  assert.notEqual(view.find({ label: FR.clearSearchLabel }), null)
  await afterPause(view)
  assert.notEqual(view.find({ text: FR.searchGroup(1) }), null)
  await view.press({ label: FR.clearSearchLabel })
  assert.equal(view.valueOf(SEARCH_FIELD), '')
  assert.notEqual(view.find({ text: 'motion-context' }), null)
  assert.equal(view.find({ text: FR.searchGroup(1) }), null)
  await expectClean(view)
})

test('adding a skills.sh hit previews it, then adds it', async () => {
  const { view, log, host } = await open({ search: () => ({ ok: true, hits: [HIT_A] }), preview: () => ONE_SKILL('motion') })
  await view.type(SEARCH_FIELD, 'mo')
  await afterPause(view)
  await view.press({ testId: 'add-acme/motion-kit/motion' })
  assert.deepEqual(log.previews, [{ kind: 'remote', source: 'acme/motion-kit', skillId: 'motion' }])
  assert.deepEqual(log.ops, [{ kind: 'add', previewId: 'p1', names: ['motion'], replace: false }])
  // Aperçu et geste partent avec le délai long : le worker peut cloner un dépôt.
  const requests = host.callsOf('plugin.request') as { name: string; timeoutMs?: number }[]
  for (const name of ['source.preview', 'op.start']) {
    assert.equal(requests.find((request) => request.name === name)?.timeoutMs, 120000, name)
  }
  await expectClean(view)
})

test('a typed path offers to add from that folder, and reads nothing until pressed', async () => {
  const { view, log, host } = await open({
    preview: () => ({ ok: true, previewId: 'p7', label: { kind: 'local', path: '~/dev/tools/skills/alpha' }, skills: [{ name: 'alpha', description: 'About alpha' }], preselected: ['alpha'] })
  })
  await view.type(SEARCH_FIELD, '~/dev/tools/skills/alpha')
  await afterPause(view)
  // Un chemin n'est jamais cherché sur skills.sh, et sa source n'est pas lue pendant la frappe : un `stat` suffit.
  assert.deepEqual(log.pathChecks, ['~/dev/tools/skills/alpha'])
  assert.deepEqual(log.previews, [])
  assert.equal(log.searches.length, 0)
  assert.notEqual(view.find({ text: FR.addFromFolder }), null)
  assert.notEqual(view.find({ type: 'Code', text: '~/dev/tools/skills/alpha' }), null)
  assert.deepEqual(log.ops, [])
  // L'appui sur la ligne lit la source, puis ajoute directement la skill unique.
  await view.press({ testId: 'read-path' })
  assert.deepEqual(log.previews, [{ kind: 'path', text: '~/dev/tools/skills/alpha' }])
  assert.deepEqual(log.ops, [{ kind: 'add', previewId: 'p7', names: ['alpha'], replace: false }])
  const read = (host.callsOf('plugin.request') as { name: string; timeoutMs?: number }[]).find((request) => request.name === 'source.preview')
  assert.equal(read?.timeoutMs, 120000)
  await expectClean(view)
})

test('Enter on a path reads it like a press on the line', async () => {
  const { view, log } = await open()
  await view.type(SEARCH_FIELD, '~/dev/tools/skills/alpha', { submit: true })
  assert.deepEqual(log.previews, [{ kind: 'path', text: '~/dev/tools/skills/alpha' }])
  assert.deepEqual(log.ops, [{ kind: 'add', previewId: 'p1', names: ['alpha'], replace: false }])
  await expectClean(view)
})

test('a folder read in flight shows a reading text, not the search one', async () => {
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const { view } = await open({
    preview: async () => {
      await gate
      return ONE_SKILL('alpha')
    }
  })
  await view.type(SEARCH_FIELD, '~/dev/skills')
  await afterPause(view)
  const pressed = view.press({ testId: 'read-path' })
  await sleep(50)
  assert.notEqual(view.find({ text: FR.reading }), null)
  assert.equal(view.find({ text: FR.searching }), null)
  release()
  await pressed
  assert.equal(view.find({ text: FR.reading }), null)
  await expectClean(view)
})

test('a typed owner/repo is a search, not a path', async () => {
  const { view, log } = await open()
  await view.type(SEARCH_FIELD, 'acme/motion-kit')
  await afterPause(view)
  assert.deepEqual(log.searches, ['acme/motion-kit'])
  assert.deepEqual(log.previews, [])
  assert.deepEqual(log.pathChecks, [])
  await expectClean(view)
})

test('a path that does not exist says so and cannot be added', async () => {
  const { view, log } = await open({ pathCheck: () => ({ exists: false }) })
  await view.type(SEARCH_FIELD, '/nowhere/at/all')
  await afterPause(view)
  assert.notEqual(view.find({ text: FR.folderNotFound }), null)
  assert.equal(view.find({ testId: 'read-path' }), null)
  assert.deepEqual(log.previews, [])
  await expectClean(view)
})

test('a multi-skill source shows checkboxes, all checked', async () => {
  // AC-6 : décocher une skill l'écarte de l'ajout.
  const { view, log } = await open({
    preview: () => ({
      ok: true,
      previewId: 'p9',
      label: { kind: 'local', path: '~/dev/tools/skills' },
      skills: [
        { name: 'alpha', description: 'About alpha' },
        { name: 'beta', description: 'About beta' },
        { name: 'gamma', description: 'About gamma' }
      ],
      preselected: ['alpha', 'beta', 'gamma']
    })
  })
  await view.type(SEARCH_FIELD, '~/dev/tools/skills')
  await afterPause(view)
  await view.press({ testId: 'read-path' })
  for (const name of ['alpha', 'beta', 'gamma']) assert.equal(view.valueOf({ label: name }), true, name)
  assert.notEqual(view.find({ text: FR.addCount(3) }), null)
  await view.toggle({ label: 'beta' })
  assert.equal(view.valueOf({ label: 'beta' }), false)
  assert.notEqual(view.find({ text: FR.addCount(2) }), null)
  await view.press({ text: FR.addCount(2) })
  assert.deepEqual(log.ops, [{ kind: 'add', previewId: 'p9', names: ['alpha', 'gamma'], replace: false }])
  await expectClean(view)
})

test('nothing can be added with every box unchecked', async () => {
  const { view, log } = await open({
    preview: () => ({
      ok: true,
      previewId: 'p9',
      label: { kind: 'local', path: '~/dev/tools/skills' },
      skills: [
        { name: 'alpha', description: '' },
        { name: 'beta', description: '' }
      ],
      preselected: ['alpha', 'beta']
    })
  })
  await view.type(SEARCH_FIELD, '~/dev/tools/skills')
  await afterPause(view)
  await view.press({ testId: 'read-path' })
  await view.toggle({ label: 'alpha' })
  await view.toggle({ label: 'beta' })
  assert.equal(view.find({ text: FR.addCount(0) })!.disabled, true)
  assert.deepEqual(log.ops, [])
  await expectClean(view)
})

async function collide(setup: Setup = {}) {
  let attempt = 0
  const opened = await open({
    search: () => ({ ok: true, hits: [HIT_A] }),
    preview: () => ONE_SKILL('motion'),
    start: ({ op }) => {
      attempt += 1
      if (op.kind === 'add' && !op.replace) return { ok: false, error: { code: 'collision', folders: ['motion'] } }
      return { ok: true, opId: `op-${attempt}` }
    },
    ...setup
  })
  await opened.view.type(SEARCH_FIELD, 'mo')
  await afterPause(opened.view)
  await opened.view.press({ testId: 'add-acme/motion-kit/motion' })
  return opened
}

test('a collision asks to replace, cancel sends nothing', async () => {
  // AC-7.
  const { view, log } = await collide()
  assert.notEqual(view.find({ text: FR.replaceAsk('motion') }), null)
  assert.equal(log.ops.length, 1)
  await view.press({ text: FR.cancel })
  assert.equal(view.find({ text: FR.replaceAsk('motion') }), null)
  assert.equal(log.ops.length, 1, 'cancelling starts no second gesture')
  await expectClean(view)
})

test('confirming a collision adds again with replace', async () => {
  const { view, log } = await collide()
  await view.press({ text: FR.replaceConfirm })
  assert.deepEqual(log.ops, [
    { kind: 'add', previewId: 'p1', names: ['motion'], replace: false },
    { kind: 'add', previewId: 'p1', names: ['motion'], replace: true }
  ])
  assert.equal(view.find({ text: FR.replaceAsk('motion') }), null)
  await expectClean(view)
})

test('the folder button fills the field with the picked path and shows the line, like a typed path', async () => {
  const { view, log, host } = await open({ pick: () => ({ path: '/Users/me/dev/skills/alpha' }) })
  await view.press({ label: FR.pickFolderLabel })
  assert.equal(view.valueOf(SEARCH_FIELD), '/Users/me/dev/skills/alpha')
  await afterPause(view)
  assert.deepEqual(log.pathChecks, ['/Users/me/dev/skills/alpha'])
  assert.deepEqual(log.previews, [])
  assert.notEqual(view.find({ testId: 'read-path' }), null)
  const pick = (host.callsOf('plugin.request') as { name: string; timeoutMs?: number }[]).find((request) => request.name === 'folder.pick')
  assert.equal(pick?.timeoutMs, 120000)
  await expectClean(view)
})

test('cancelling the folder dialog leaves the field alone, and a timeout stays silent', async () => {
  const cancelled = await open({ pick: () => ({ path: null }) })
  await cancelled.view.press({ label: FR.pickFolderLabel })
  assert.equal(cancelled.view.valueOf(SEARCH_FIELD), '')
  await expectClean(cancelled.view)

  const timedOut = await open({
    pick: () => {
      throw hostError('timeout')
    }
  })
  await timedOut.view.press({ label: FR.pickFolderLabel })
  assert.equal(timedOut.view.findAll({ type: 'Callout' }).filter((callout) => callout.props.tone === 'danger').length, 0)
  assert.equal(timedOut.view.valueOf(SEARCH_FIELD), '')
  await timedOut.view.unmount()
})

test('hides the folder button when the worker cannot open the dialog', async () => {
  const state = stateOf({ skills: [HANDWRITTEN], overrides: { capabilities: { trash: true, folderPicker: false } } })
  const { view } = await open({ state })
  assert.equal(view.find({ label: FR.pickFolderLabel }), null)
  await expectClean(view)
})

test('remove asks for confirmation with the spec text', async () => {
  // AC-8 : le texte vient de la spec, Annuler n'envoie rien, confirmer envoie `remove`.
  const { view, log } = await open()
  await view.press({ label: FR.removeSkillLabel('motion-context') })
  assert.notEqual(view.find({ text: FR.removeAsk('motion-context') }), null)
  assert.deepEqual(log.ops, [])
  await view.press({ text: FR.cancel })
  assert.equal(view.find({ text: FR.removeAsk('motion-context') }), null)
  assert.deepEqual(log.ops, [])

  await view.press({ label: FR.removeSkillLabel('motion-context') })
  await view.press({ text: FR.removeConfirm })
  assert.deepEqual(log.ops, [{ kind: 'remove', folder: 'motion-context' }])
  await expectClean(view)
})

const SPREAD = [
  diskSkill('alpha', [copyOf('.claude/skills', 'alpha', 'h1'), copyOf('.agents/skills', 'alpha', 'h1')], 'About alpha'),
  diskSkill('motion-context', [copyOf('.claude/skills', 'motion-context')], 'Context for motion work')
]

test('the expanded row lists dirs, the agents they feed and reinstate', async () => {
  // Grok est exclu de la skill ; Codex, Pi, Antigravity et DeepSeek Harness la voient par `.agents/skills`.
  const state = stateOf({ skills: [SPREAD[1]!], excluded: { 'motion-context': ['grok'] } })
  const { view, log } = await open({ state })
  assert.equal(view.find({ text: FR.readBy('Claude, OpenCode') }), null, 'folded row hides its dirs')
  await view.press({ label: FR.expandLabel('motion-context') })
  assert.notEqual(view.find({ type: 'Code', text: '.claude/skills' }), null)
  assert.notEqual(view.find({ text: FR.readBy('Claude, OpenCode') }), null)
  assert.notEqual(view.find({ text: FR.removeFromDir }), null)
  assert.notEqual(view.find({ label: FR.collapseLabel('motion-context') }), null)
  // Un agent absent s'ajoute à la main, un agent exclu se réintègre.
  assert.notEqual(view.find({ text: FR.addFor('Codex') }), null)
  assert.equal(view.find({ text: FR.addFor('Grok') }), null)
  await view.press({ text: FR.reinstate('Grok') })
  // Un seul geste à la fois : le suivant attend la fin du premier.
  await view.post('op.finished', { opId: 'op-1', op: { kind: 'reinstate', folder: 'motion-context', agent: 'grok' }, ok: true, warnings: [] })
  await view.press({ text: FR.addFor('Codex') })
  assert.deepEqual(log.ops, [
    { kind: 'reinstate', folder: 'motion-context', agent: 'grok' },
    { kind: 'propagate', folder: 'motion-context', agents: ['codex'] }
  ])
  await expectClean(view)
})

test('removing from a dir names who loses the skill and who still sees it', async () => {
  const state = stateOf({ skills: [SPREAD[0]!] })
  const { view, log } = await open({ state })
  await view.press({ label: FR.expandLabel('alpha') })
  const removeButtons = view.findAll({ type: 'Button', text: FR.removeFromDir })
  assert.equal(removeButtons.length, 2, 'one per dir')
  // Les copies suivent l'ordre des dossiers gérés : `.agents/skills`, puis `.claude/skills`.
  await view.press(removeButtons[1]!)
  // `.claude/skills` : Claude la perd ; OpenCode la voit encore par `.agents/skills`.
  assert.notEqual(view.find({ text: FR.losesSight('Claude') }), null)
  assert.notEqual(view.find({ text: FR.keepsSight('OpenCode') }), null)
  await view.press({ text: FR.removeConfirm })
  assert.deepEqual(log.ops, [{ kind: 'remove-dir', folder: 'alpha', dir: '.claude/skills' }])
  await expectClean(view)
})

test('the expanded row shows the description', async () => {
  const { view } = await open()
  assert.equal(view.find({ text: 'Context for motion work' }), null)
  await view.press({ label: FR.expandLabel('motion-context') })
  assert.notEqual(view.find({ type: 'Text', text: 'Context for motion work' }), null)
  await view.press({ label: FR.collapseLabel('motion-context') })
  assert.equal(view.find({ text: 'Context for motion work' }), null)
  await expectClean(view)
})

test('a divergent skill warns, and its expanded row offers to keep one version', async () => {
  // AC-9 : rien n'est écrit avant « Garder celle-ci ».
  const divergent = diskSkill('x', [copyOf('.claude/skills', 'x', 'hash-claude'), copyOf('.agents/skills', 'x', 'hash-agents')])
  const { view, log } = await open({ state: stateOf({ skills: [divergent] }) })
  assert.notEqual(view.find({ type: 'Callout', text: new RegExp(FR.differs) }), null)
  assert.deepEqual(log.ops, [])
  await view.press({ label: FR.expandLabel('x') })
  const keeps = view.findAll({ type: 'Button', text: FR.keepThis })
  assert.equal(keeps.length, 2)
  // Les versions suivent l'ordre des dossiers gérés : `.agents/skills` d'abord.
  await view.press(keeps[0]!)
  assert.deepEqual(log.ops, [{ kind: 'keep', folder: 'x', hash: 'hash-agents' }])
  await expectClean(view)
})

test('an excluded agent is listed apart, not as a chip', async () => {
  // AC-16 : « Exclue pour Grok », pas d'Image Grok, pas de bandeau orange pour lui.
  const state = stateOf({ skills: [HANDWRITTEN], excluded: { 'motion-context': ['grok'] } })
  const { view } = await open({ state })
  assert.notEqual(view.find({ text: FR.excludedFor('Grok') }), null)
  const alts = view.findAll({ type: 'Image' }).map((image) => String(image.props.alt))
  assert.equal(alts.some((alt) => alt.startsWith('Grok')), false)
  assert.equal(alts.length, ROMAIN.length - 1)
  const warning = view.find({ type: 'Callout', text: new RegExp(FR.absentFor('')) })
  assert.ok(warning && !warning.text.includes('Grok'))
  await expectClean(view)
})

test('folds many chips into a summary', async () => {
  const wide = diskSkill('wide', [copyOf('.claude/skills', 'wide'), copyOf('.agents/skills', 'wide')])
  const { view } = await open({ state: stateOf({ agents: MANY, skills: [wide] }) })
  // Quatorze agents actifs : Grok et Kiro n'ont que leur propre dossier, les douze autres voient la skill.
  const seeing = buildRows({ skills: [wide], unsafeDirs: [] }, new Map(), MANY, () => [], HOME)[0]!.agents.filter((a) => a.state === 'sees').length
  const summary = FR.chipsSummary(seeing, MANY.length)
  assert.equal(view.findAll({ type: 'Image' }).length, 0)
  await view.press({ text: summary })
  assert.equal(view.findAll({ type: 'Image' }).length, MANY.length)
  await view.press({ text: FR.chipsFold })
  assert.equal(view.findAll({ type: 'Image' }).length, 0)
  await expectClean(view)
})

test('keeps the chips of exactly twelve agents unfolded', async () => {
  const twelve = MANY.slice(0, 12)
  const { view } = await open({ state: stateOf({ agents: twelve, skills: [HANDWRITTEN] }) })
  assert.equal(view.findAll({ type: 'Image' }).length, 12)
  await expectClean(view)
})

test('workspace states show their message and nothing else', async () => {
  const cases: [PanelState['workspace'], string][] = [
    [{ status: 'none' }, FR.noWorkspace],
    [{ status: 'remote' }, FR.remoteWorkspace],
    [{ status: 'missing' }, FR.missingWorkspace],
    [{ status: 'home' }, FR.homeWorkspace]
  ]
  for (const [workspace, message] of cases) {
    const { view } = await open({ state: stateOf({ workspace }) })
    assert.notEqual(view.find({ text: message }), null, workspace.status)
    assert.equal(view.find(SEARCH_FIELD), null, `${workspace.status}: no search field`)
    await expectClean(view)
  }
})

test('an empty project invites to search or paste a folder', async () => {
  const { view } = await open({ state: stateOf({ skills: [] }) })
  assert.notEqual(view.find({ label: FR.emptyTitle }), null)
  const empty = view.find({ type: 'EmptyState' })
  assert.ok(empty?.text.includes(FR.emptyHint), empty?.text)
  await expectClean(view)
})

test('busy gestures disable the buttons and show progress', async () => {
  const busy: OpRequest = { kind: 'propagate', folder: 'motion-context', agents: ['codex'] }
  const { view } = await open({ state: stateOf({ skills: [HANDWRITTEN], overrides: { busy } }) })
  assert.notEqual(view.find({ text: FR.copying }), null)
  assert.equal(view.find({ text: FR.propagate })!.disabled, true)
  assert.equal(view.find({ label: FR.removeSkillLabel('motion-context') })!.disabled, true)
  await expectClean(view)
})

test('the label of the progress follows the gesture', async () => {
  const cases: [OpRequest, string][] = [
    [{ kind: 'remove', folder: 'motion-context' }, FR.removing],
    [{ kind: 'remove-dir', folder: 'motion-context', dir: '.claude/skills' }, FR.removing],
    [{ kind: 'keep', folder: 'motion-context', hash: 'h' }, FR.copying],
    [{ kind: 'add', previewId: 'p', names: ['alpha'], replace: false }, FR.adding]
  ]
  for (const [busy, label] of cases) {
    const { view } = await open({ state: stateOf({ skills: [HANDWRITTEN], overrides: { busy } }) })
    assert.notEqual(view.find({ text: label }), null, busy.kind)
    await expectClean(view)
  }
})

test('while a gesture runs, other rows and the search keep their buttons off too', async () => {
  const busy: OpRequest = { kind: 'remove', folder: 'alpha' }
  const { view } = await open({ state: stateOf({ skills: SPREAD, overrides: { busy } }) })
  assert.equal(view.find({ label: FR.removeSkillLabel('motion-context') })!.disabled, true)
  assert.equal(view.find({ text: FR.propagate })!.disabled, true)
  assert.equal(view.findAll({ text: FR.removing }).length, 1, 'only the concerned row shows progress')
  await expectClean(view)
})

test('a gesture refused at start shows its localised error under the row', async () => {
  const { view } = await open({ start: () => ({ ok: false, error: { code: 'gone' } }) })
  await view.press({ text: FR.propagate })
  assert.notEqual(view.find({ type: 'Callout', text: new RegExp(FR.errors.gone) }), null)
  // Le geste n'a pas démarré : les boutons sont libres.
  assert.equal(view.find({ text: FR.propagate })!.disabled, false)
  await expectClean(view)
})

test('a failed gesture shows its localised error under the row', async () => {
  const { view } = await open()
  await view.press({ text: FR.propagate })
  const finished: OpFinished = {
    opId: 'op-1',
    op: { kind: 'propagate', folder: 'motion-context', agents: ['codex'] },
    ok: false,
    error: { code: 'lib', diagnostics: [{ code: 'SKILLS_INSTALL_FAILED', message: 'boom' }] },
    warnings: []
  }
  await view.post('op.finished', finished)
  assert.notEqual(view.find({ type: 'Callout', text: new RegExp(FR.lib.SKILLS_INSTALL_FAILED) }), null)
  assert.equal(view.find({ text: /boom/ }), null, 'the raw message of a known code is not shown')
  // Le geste est fini : les boutons sont libres, et l'état a été relu.
  assert.equal(view.find({ text: FR.propagate })!.disabled, false)
  await expectClean(view)
})

test('a failure after the trash says the old version is in the Trash', async () => {
  const { view } = await open()
  const finished: OpFinished = {
    opId: 'op-1',
    op: { kind: 'keep', folder: 'motion-context', hash: 'h' },
    ok: false,
    error: { code: 'lib', diagnostics: [{ code: 'SKILLS_INSTALL_FAILED', message: 'boom' }], trashed: true },
    warnings: []
  }
  await view.post('op.finished', finished)
  assert.equal(FR.trashed, 'La version remplacée est dans la Corbeille.')
  assert.notEqual(view.find({ text: FR.trashed }), null)
  await expectClean(view)
})

test('an unknown error code shows the raw message', async () => {
  const { view } = await open()
  const finished: OpFinished = {
    opId: 'op-1',
    op: { kind: 'propagate', folder: 'motion-context', agents: ['codex'] },
    ok: false,
    error: { code: 'lib', diagnostics: [{ code: 'SKILLS_FROM_THE_FUTURE', message: 'Library said something new' }] },
    warnings: []
  }
  await view.post('op.finished', finished)
  assert.notEqual(view.find({ text: /Library said something new/ }), null)
  await expectClean(view)
})

test('shows at most three lines of an error', async () => {
  const { view } = await open()
  const diagnostics = ['one', 'two', 'three', 'four', 'five'].map((word) => ({ code: 'SKILLS_UNKNOWN_X', message: `line ${word}` }))
  await view.post('op.finished', {
    opId: 'op-1',
    op: { kind: 'propagate', folder: 'motion-context', agents: ['codex'] },
    ok: false,
    error: { code: 'lib', diagnostics },
    warnings: []
  })
  assert.equal(view.findAll({ text: /^line / }).length, 3)
  await expectClean(view)
})

test('warnings of a gesture are shown under the row', async () => {
  const { view } = await open()
  await view.post('op.finished', {
    opId: 'op-1',
    op: { kind: 'propagate', folder: 'motion-context', agents: ['codex'] },
    ok: true,
    warnings: [{ code: 'PLUGIN_EXCLUSIONS_FAILED', message: 'disk full' }]
  })
  assert.notEqual(view.find({ type: 'Callout', text: new RegExp(FR.lib.PLUGIN_EXCLUSIONS_FAILED) }), null)
  await expectClean(view)
})

test('the warnings and errors of an add show under the field', async () => {
  const { view } = await open()
  await view.post('op.finished', {
    opId: 'op-1',
    op: { kind: 'add', previewId: 'p1', names: ['alpha'], replace: false },
    ok: false,
    error: { code: 'lib', diagnostics: [{ code: 'SKILLS_NO_VALID_SKILLS', message: 'none' }] },
    warnings: []
  })
  assert.notEqual(view.find({ text: FR.lib.SKILLS_NO_VALID_SKILLS }), null)
  await expectClean(view)
})

test('a finished gesture reads the state again, and state.changed redraws the list', async () => {
  const { view, log, setState } = await open()
  const before = log.stateReads.length
  setState(stateOf({ skills: SPREAD }))
  await view.post('op.finished', {
    opId: 'op-1',
    op: { kind: 'propagate', folder: 'motion-context', agents: ['codex'] },
    ok: true,
    warnings: []
  })
  assert.equal(log.stateReads.length, before + 1)
  assert.notEqual(view.find({ text: 'alpha' }), null)
  await view.post('state.changed', stateOf({ skills: [] }))
  assert.equal(view.find({ text: 'alpha' }), null)
  assert.notEqual(view.find({ label: FR.emptyTitle }), null)
  await expectClean(view)
})

test('the refresh button asks for a fresh probe', async () => {
  const { view, log } = await open()
  await view.press({ label: FR.refreshLabel })
  assert.ok(log.stateReads.includes('state.refresh'))
  await expectClean(view)
})

test('a failed state read shows a retry', async () => {
  let attempts = 0
  const host = mockHost({
    requests: {
      'state.get': () => {
        attempts += 1
        if (attempts === 1) throw new Error('worker down')
        return stateOf({ skills: [HANDWRITTEN] })
      }
    }
  })
  const view = await mount(panel, { host, locale: 'fr-FR' })
  assert.notEqual(view.find({ text: /worker down/ }), null)
  await view.press({ text: FR.retry })
  assert.notEqual(view.find({ text: 'motion-context' }), null)
  await expectClean(view)
})

test('a switch of workspace drops the half-typed add', async () => {
  // Un aperçu pris dans un espace ne doit jamais s'ajouter dans le suivant.
  const { view } = await open({
    preview: () => ({ ok: true, previewId: 'p1', label: { kind: 'local', path: '~/x' }, skills: [{ name: 'alpha', description: '' }], preselected: ['alpha'] })
  })
  await view.type(SEARCH_FIELD, '~/x')
  await afterPause(view)
  assert.notEqual(view.find({ testId: 'read-path' }), null)
  await view.post('state.changed', stateOf({ workspace: { status: 'ready', name: 'other', branch: 'main', linkedWorktree: false } }))
  assert.equal(view.find({ testId: 'read-path' }), null)
  assert.equal(view.valueOf(SEARCH_FIELD), '')
  await expectClean(view)
})

test('shows the inventory fallback, the unsafe dirs, the unreadable lock and the missing Trash', async () => {
  const state = stateOf({
    skills: [HANDWRITTEN],
    overrides: {
      inventory: 'fallback',
      unsafeDirs: ['.claude/skills'],
      lockUnreadable: true,
      capabilities: { trash: false, folderPicker: true }
    }
  })
  const { view } = await open({ state })
  assert.notEqual(view.find({ text: FR.fallbackNote }), null)
  assert.equal(view.find({ type: 'Callout', text: FR.outsideProject('.claude/skills') })!.props.tone, 'danger')
  assert.notEqual(view.find({ text: FR.lockUnreadable }), null)
  assert.notEqual(view.find({ text: FR.trashUnavailable }), null)
  await expectClean(view)
})

test('says which agents read a project dir only once trusted', async () => {
  const state = stateOf({ agents: ['claude', 'hermes', 'mistral-vibe'], skills: [diskSkill('alpha', [copyOf('.agents/skills', 'alpha')])] })
  const { view } = await open({ state })
  assert.equal(view.find({ text: FR.trustHermes }), null, 'folded row keeps it short')
  await view.press({ label: FR.expandLabel('alpha') })
  assert.notEqual(view.find({ text: FR.trustHermes }), null)
  assert.notEqual(view.find({ text: FR.trustVibe }), null)
  await expectClean(view)
})

test('marks an external link and refuses to remove a dir a link points to', async () => {
  const linked = diskSkill('x', [
    copyOf('.agents/skills', 'x', 'h1'),
    { dir: '.claude/skills', path: `${ROOT}/.claude/skills/x`, kind: 'internal-link', realPath: `${ROOT}/.agents/skills/x`, hash: 'h1' },
    { dir: '.grok/skills', path: `${ROOT}/.grok/skills/x`, kind: 'external-link', realPath: '/elsewhere/x', hash: 'h2' }
  ])
  const { view, log } = await open({ state: stateOf({ skills: [linked] }) })
  await view.press({ label: FR.expandLabel('x') })
  assert.notEqual(view.find({ text: FR.externalLink }), null)
  // `.agents/skills/x` est la cible d'un lien de `.claude/skills` : le geste ne part pas, la ligne dit pourquoi.
  assert.notEqual(view.find({ text: FR.pointsHere('.claude/skills') }), null)
  assert.deepEqual(log.ops, [])
  await expectClean(view)
})

test('speaks English when Orca is in English', async () => {
  const { view } = await open({ locale: 'en-US' })
  assert.notEqual(view.find({ text: EN.propagate }), null)
  assert.notEqual(view.find({ text: EN.handwritten }), null)
  assert.notEqual(view.find({ text: EN.worktreeNote }), null)
  assert.equal(view.find({ text: FR.propagate }), null)
  assert.notEqual(view.find({ label: EN.searchLabel }), null)
  await expectClean(view)
})

test('speaks English for a language Orca has no translation for', async () => {
  const { view } = await open({ locale: 'ja-JP' })
  assert.notEqual(view.find({ text: EN.propagate }), null)
  await expectClean(view)
})

test('formats installs with the decimal comma in French and a point in English', async () => {
  const answer = (): SearchAnswer => ({ ok: true, hits: [HIT_B] })
  const fr = await open({ search: answer })
  await fr.view.type(SEARCH_FIELD, 'mo')
  await afterPause(fr.view)
  assert.notEqual(fr.view.find({ text: 'acme/audio · 916,9K' }), null)
  await expectClean(fr.view)
  const en = await open({ search: answer, locale: 'en-US' })
  await en.view.type({ label: EN.searchLabel }, 'mo')
  await afterPause(en.view)
  assert.notEqual(en.view.find({ text: 'acme/audio · 916.9K' }), null)
  await expectClean(en.view)
})

test('a pushed state without a running gesture frees the buttons', async () => {
  // Le worker a redémarré en plein geste : plus personne ne dira `op.finished`.
  const { view } = await open()
  await view.press({ text: FR.propagate })
  assert.equal(view.find({ text: FR.propagate })!.disabled, true)
  await view.post('state.changed', stateOf({ skills: [HANDWRITTEN] }))
  assert.equal(view.find({ text: FR.propagate })!.disabled, false)
  assert.equal(view.find({ label: FR.removeSkillLabel('motion-context') })!.disabled, false)
  await expectClean(view)
})

test('a pushed state that still holds the gesture keeps the buttons off', async () => {
  const { view } = await open()
  await view.press({ text: FR.propagate })
  const busy: OpRequest = { kind: 'propagate', folder: 'motion-context', agents: ['codex', 'grok', 'pi', 'antigravity', 'dsh'] }
  await view.post('state.changed', stateOf({ skills: [HANDWRITTEN], overrides: { busy } }))
  assert.equal(view.find({ text: FR.propagate })!.disabled, true)
  await expectClean(view)
})

test('an older state read cannot overwrite a newer pushed state', async () => {
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const { view } = await open({
    refresh: async () => {
      await gate
      return stateOf({ skills: [HANDWRITTEN] })
    }
  })
  // La relecture part, le worker pousse un état plus récent, puis la relecture (périmée) répond.
  const refreshing = view.press({ label: FR.refreshLabel })
  await sleep(50)
  const pushed = view.post('state.changed', stateOf({ skills: [] }))
  await sleep(50)
  release()
  await refreshing
  await pushed
  assert.notEqual(view.find({ label: FR.emptyTitle }), null)
  assert.equal(view.find({ text: 'motion-context' }), null)
  await expectClean(view)
})
