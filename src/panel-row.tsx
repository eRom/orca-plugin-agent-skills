// Une skill du projet : nom, source, pastilles d'agents, bandeaux, puis le détail déplié.
// Les composants du catalogue n'ont ni survol ni image cliquable : les gestes par agent et par dossier vivent dans la ligne dépliée.
import { Box, Button, Callout, Code, env, IconButton, Image, read, Row, Spinner, Stack, Text } from 'orca'
import { describeErrorLines, type Messages } from './copy'
import { dimIcon, themedIcon } from './icons'
import { askConfirmation, cancelConfirmation, expandedRows, notes, startOp, toggleChips, toggleExpanded, unfoldedChips, type Confirm, type Note } from './panel-state'
import type { AgentView, OpRequest, PanelState } from './protocol'
import type { ManagedDir } from './skill-dirs'
import type { SkillRow } from './visibility'

/** Au-delà de ce nombre d'agents actifs, les pastilles se replient en un résumé (seuil choisi : ce que la largeur tient). */
export const MAX_CHIPS = 12
/** Lignes de bandeau montrées au plus : le reste est au journal du worker. */
const MAX_LINES = 3

export type RowContext = {
  state: PanelState
  m: Messages
  /** Le geste en cours (celui du panneau, sinon celui du worker) : tous les boutons de gestes se grisent. */
  busy: OpRequest | null
  confirm: Confirm | null
}

/** Les lignes d'une note, trois au plus ; quand l'ancienne version est à la Corbeille, cette ligne reste. */
export function noteLines(note: Note, m: Messages): string[] {
  const error = note.error
  const lines = error ? describeErrorLines(error, m) : note.message === null ? [] : [note.message]
  return error?.trashed && lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES - 1), lines[lines.length - 1]!] : lines.slice(0, MAX_LINES)
}

function warningLines(note: Note, m: Messages): string[] {
  return note.warnings.flatMap((warning) => describeErrorLines(warning, m)).slice(0, MAX_LINES)
}

function renderLines(key: string, lines: string[]) {
  return (
    <Stack key={key} gap="xs">
      {lines.map((line, index) => (
        <Text key={`line-${index}`} size="xs">
          {line}
        </Text>
      ))}
    </Stack>
  )
}

/** Erreur et avertissements d'un geste, en bandeaux ; rien quand la note est vide. */
export function renderNote(key: string, note: Note | null | undefined, m: Messages) {
  if (!note) return null
  const errors = noteLines(note, m)
  const warnings = warningLines(note, m)
  if (errors.length === 0 && warnings.length === 0) return null
  return (
    <Stack key={key} gap="xs">
      {errors.length > 0 ? <Callout tone="danger">{renderLines(`${key}-errors`, errors)}</Callout> : null}
      {warnings.length > 0 ? <Callout tone="warning">{renderLines(`${key}-warnings`, warnings)}</Callout> : null}
    </Stack>
  )
}

const labelOf = (state: PanelState, id: string): string => state.agents.find((agent) => agent.id === id)?.label ?? id
const labelsOf = (state: PanelState, ids: readonly string[]): string => ids.map((id) => labelOf(state, id)).join(', ')

function renderSource(row: SkillRow, m: Messages) {
  switch (row.source.kind) {
    case 'remote':
      return <Code>{row.source.source}</Code>
    case 'local':
      return <Code>{row.source.path}</Code>
    case 'handwritten':
      return (
        <Text muted size="xs">
          {m.handwritten}
        </Text>
      )
  }
}

/** Une pastille par agent actif : pleine s'il voit la skill, estompée sinon ; un agent exclu n'en a pas (ligne à part). */
function renderChips(row: SkillRow, ctx: RowContext) {
  const { state, m } = ctx
  const scheme = env.theme.colorScheme
  const total = row.agents.length
  const seen = row.agents.filter((agent) => agent.state === 'sees').length
  const folded = total > MAX_CHIPS && !read(unfoldedChips).includes(row.folder)
  if (folded) {
    return (
      <Row key={`chips-${row.folder}`}>
        <Button variant="ghost" size="sm" onPress={() => toggleChips(row.folder)}>
          {m.chipsSummary(seen, total)}
        </Button>
      </Row>
    )
  }
  const views = new Map<string, AgentView>(state.agents.map((agent) => [agent.id, agent]))
  return (
    <Box key={`chips-${row.folder}`} direction="row" wrap gap="xs" align="center">
      {row.agents.flatMap((agent) => {
        const view = views.get(agent.agent)
        if (!view || agent.state === 'excluded') return []
        return agent.state === 'sees'
          ? [<Image key={agent.agent} src={themedIcon(view.icon, scheme)} alt={m.agentSees(view.label, agent.via.join(', '))} size="xs" />]
          : [<Image key={agent.agent} src={dimIcon(themedIcon(view.icon, scheme))} alt={m.agentAbsent(view.label)} size="xs" />]
      })}
      {total > MAX_CHIPS ? (
        <Button variant="ghost" size="sm" onPress={() => toggleChips(row.folder)}>
          {m.chipsFold}
        </Button>
      ) : null}
    </Box>
  )
}

/** Libellé du geste en cours sur cette ligne. */
function progressLabel(op: OpRequest, m: Messages): string {
  switch (op.kind) {
    case 'add':
      return m.adding
    case 'remove':
    case 'remove-dir':
      return m.removing
    case 'propagate':
    case 'keep':
    case 'reinstate':
      return m.copying
  }
}

export function renderProgress(key: string, label: string) {
  return (
    <Row key={key} gap="xs" align="center">
      <Spinner label={label} labelHidden />
      <Text muted size="xs">
        {label}
      </Text>
    </Row>
  )
}

/** Agents qui perdent la skill, et ceux qui la voient encore par un autre dossier, quand on retire `dir`. */
function sightAfterRemoving(row: SkillRow, dir: ManagedDir, state: PanelState): { lost: string[]; kept: string[] } {
  const lost: string[] = []
  const kept: string[] = []
  for (const agent of row.agents) {
    if (!agent.via.includes(dir)) continue
    ;(agent.via.length === 1 ? lost : kept).push(labelOf(state, agent.agent))
  }
  return { lost, kept }
}

function renderConfirm(row: SkillRow, ctx: RowContext) {
  const { confirm, m, state } = ctx
  if (!confirm || confirm.kind === 'replace' || confirm.folder !== row.folder) return null
  const op: OpRequest = confirm.kind === 'remove' ? { kind: 'remove', folder: row.folder } : { kind: 'remove-dir', folder: row.folder, dir: confirm.dir }
  const lines =
    confirm.kind === 'remove'
      ? [m.removeAsk(row.displayName)]
      : (() => {
          const { lost, kept } = sightAfterRemoving(row, confirm.dir, state)
          return [m.removeDirAsk(row.displayName, confirm.dir), ...(lost.length > 0 ? [m.losesSight(lost.join(', '))] : []), ...(kept.length > 0 ? [m.keepsSight(kept.join(', '))] : [])]
        })()
  return (
    <Callout key={`confirm-${row.folder}`} tone="danger">
      <Stack gap="sm">
        {renderLines(`confirm-lines-${row.folder}`, lines)}
        <Row gap="sm">
          <Button variant="outline" size="sm" onPress={cancelConfirmation}>
            {m.cancel}
          </Button>
          <Button tone="danger" size="sm" onPress={() => startOp(op)}>
            {m.removeConfirm}
          </Button>
        </Row>
      </Stack>
    </Callout>
  )
}

function renderCopy(row: SkillRow, copy: SkillRow['copies'][number], ctx: RowContext) {
  const { m, state, busy } = ctx
  const linked = copy.linkedFrom.length > 0
  return (
    <Box key={`copy-${row.folder}-${copy.dir}`} gap="xs">
      <Row justify="between" align="center" gap="sm">
        <Box key={`copy-name-${row.folder}-${copy.dir}`} direction="row" align="center" gap="xs" grow minWidth={0}>
          <Code>{copy.dir}</Code>
          {copy.kind === 'external-link' ? (
            <Text muted size="xs">
              {m.externalLink}
            </Text>
          ) : null}
        </Box>
        <Box key={`copy-remove-${row.folder}-${copy.dir}`} shrink={false}>
          <Button variant="outline" size="sm" disabled={busy !== null || linked} onPress={() => askConfirmation({ kind: 'remove-dir', folder: row.folder, dir: copy.dir })}>
            {m.removeFromDir}
          </Button>
        </Box>
      </Row>
      <Text muted size="xs">
        {copy.feeds.length > 0 ? m.readBy(labelsOf(state, copy.feeds)) : m.readByNobody}
      </Text>
      {linked ? (
        <Text muted size="xs">
          {m.pointsHere(copy.linkedFrom.join(', '))}
        </Text>
      ) : null}
    </Box>
  )
}

function renderVersions(row: SkillRow, ctx: RowContext) {
  const { m, state, busy } = ctx
  if (row.versions.length < 2) return null
  return (
    <Stack key={`versions-${row.folder}`} gap="sm">
      {row.versions.map((version, index) => {
        const feeds = [...new Set(row.copies.filter((copy) => version.dirs.includes(copy.dir)).flatMap((copy) => copy.feeds))]
        return (
          <Box key={`version-${row.folder}-${version.hash}`} border radius="sm" padding="sm" gap="xs">
            <Text weight="medium" size="xs">
              {m.versionLabel(index + 1)}
            </Text>
            <Box key={`version-dirs-${row.folder}-${version.hash}`} direction="row" wrap gap="xs">
              {version.dirs.map((dir) => (
                <Code key={dir}>{dir}</Code>
              ))}
            </Box>
            <Text muted size="xs">
              {feeds.length > 0 ? m.readBy(labelsOf(state, feeds)) : m.readByNobody}
            </Text>
            <Row>
              <Button variant="outline" size="sm" disabled={busy !== null} onPress={() => startOp({ kind: 'keep', folder: row.folder, hash: version.hash })}>
                {m.keepThis}
              </Button>
            </Row>
          </Box>
        )
      })}
    </Stack>
  )
}

/** Le détail : description, dossiers, gestes par agent, versions, approbations. */
function renderDetails(row: SkillRow, ctx: RowContext) {
  const { m, state, busy } = ctx
  const absent = row.agents.filter((agent) => agent.state === 'absent')
  const excluded = row.agents.filter((agent) => agent.state === 'excluded')
  const trusts = new Set(state.agents.filter((agent) => row.agents.some((entry) => entry.agent === agent.id && entry.state !== 'excluded')).flatMap((agent) => (agent.trust ? [agent.trust] : [])))
  return (
    <Stack key={`details-${row.folder}`} gap="sm">
      {row.description !== '' ? (
        <Text muted size="xs">
          {row.description}
        </Text>
      ) : null}
      {row.copies.map((copy) => renderCopy(row, copy, ctx))}
      {absent.length + excluded.length > 0 ? (
        <Box key={`agent-actions-${row.folder}`} direction="row" wrap gap="xs">
          {absent.map((agent) => (
            <Button key={`add-${agent.agent}`} variant="outline" size="sm" disabled={busy !== null} onPress={() => startOp({ kind: 'propagate', folder: row.folder, agents: [agent.agent] })}>
              {m.addFor(labelOf(state, agent.agent))}
            </Button>
          ))}
          {excluded.map((agent) => (
            <Button key={`reinstate-${agent.agent}`} variant="outline" size="sm" disabled={busy !== null} onPress={() => startOp({ kind: 'reinstate', folder: row.folder, agent: agent.agent })}>
              {m.reinstate(labelOf(state, agent.agent))}
            </Button>
          ))}
        </Box>
      ) : null}
      {renderVersions(row, ctx)}
      {trusts.has('hermes') ? (
        <Text muted size="xs">
          {m.trustHermes}
        </Text>
      ) : null}
      {trusts.has('vibe') ? (
        <Text muted size="xs">
          {m.trustVibe}
        </Text>
      ) : null}
    </Stack>
  )
}

export function renderRow(row: SkillRow, ctx: RowContext) {
  const { m, state, busy } = ctx
  const open = read(expandedRows).includes(row.folder)
  const note = read(notes)[row.folder]
  const missing = row.agents.filter((agent) => agent.state === 'absent').map((agent) => labelOf(state, agent.agent))
  const excluded = row.agents.filter((agent) => agent.state === 'excluded').map((agent) => labelOf(state, agent.agent))
  // Seule la ligne visée par le geste montre sa progression (un ajout n'a pas de ligne : son progrès est sous le champ).
  const running = busy !== null && busy.kind !== 'add' && busy.folder === row.folder ? busy : null
  return (
    <Box key={`row-${row.folder}`} border radius="md" padding="sm" gap="sm" background="muted">
      <Row justify="between" align="center" gap="sm">
        <Box key={`title-${row.folder}`} grow minWidth={0}>
          <Text weight="semibold" truncate>
            {row.displayName}
          </Text>
          {renderSource(row, m)}
        </Box>
        <Box key={`actions-${row.folder}`} direction="row" gap="xs" shrink={false}>
          <IconButton
            icon={open ? 'collapse' : 'expand'}
            label={open ? m.collapseLabel(row.displayName) : m.expandLabel(row.displayName)}
            variant="ghost"
            size="sm"
            onPress={() => toggleExpanded(row.folder)}
          />
          <IconButton
            icon="delete"
            label={m.removeSkillLabel(row.displayName)}
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onPress={() => askConfirmation({ kind: 'remove', folder: row.folder })}
          />
        </Box>
      </Row>
      {renderChips(row, ctx)}
      {excluded.length > 0 ? (
        <Text muted size="xs">
          {m.excludedFor(excluded.join(', '))}
        </Text>
      ) : null}
      {missing.length > 0 ? (
        <Callout tone="warning">
          <Stack gap="sm">
            <Text size="xs">{m.absentFor(missing.join(', '))}</Text>
            <Row>
              <Button size="sm" variant="outline" disabled={busy !== null} onPress={() => startOp({ kind: 'propagate', folder: row.folder, agents: row.missingFor })}>
                {m.propagate}
              </Button>
            </Row>
          </Stack>
        </Callout>
      ) : null}
      {row.versions.length > 1 ? (
        <Callout tone="warning">
          <Text size="xs">{m.differs}</Text>
        </Callout>
      ) : null}
      {running ? renderProgress(`progress-${row.folder}`, progressLabel(running, m)) : null}
      {renderConfirm(row, ctx)}
      {renderNote(`note-${row.folder}`, note, m)}
      {open ? renderDetails(row, ctx) : null}
    </Box>
  )
}
