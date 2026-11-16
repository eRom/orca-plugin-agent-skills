// Panneau Skills : les skills du projet ouvert et ce que chaque agent d'Orca en voit.
// Aucun CSS ni DOM : Orca dessine les composants. Le worker lit le disque et écrit ; ici, on montre et on demande.
import { Button, Callout, EmptyState, IconButton, read, Row, Skeleton, Stack, Text, Box } from 'orca'
import { currentLocale, copy } from './panel-copy'
import { renderProgress, renderNote, renderRow, type RowContext } from './panel-row'
import { renderAddFlow, renderPathLine, renderReplaceConfirm, renderResults, renderSearchField } from './panel-search'
import {
  addFlow,
  addNote,
  confirmation,
  loadError,
  loadState,
  MIN_QUERY_LENGTH,
  notes,
  panelState,
  pathCheck,
  pending,
  query,
  refreshing,
  refreshState,
  searchView
} from './panel-state'
import { isPathInput } from './path-input'
import type { PanelState } from './protocol'

export { setup } from './panel-state'

function renderHeader(state: PanelState | null) {
  const m = copy()
  const workspace = state?.workspace
  const title = workspace?.status === 'ready' ? (workspace.branch ? `${workspace.name} · ${workspace.branch}` : workspace.name) : 'Skills'
  return (
    <Row justify="between" align="center" gap="sm">
      <Box key="header-title" grow minWidth={0}>
        <Text weight="semibold" truncate>
          {title}
        </Text>
      </Box>
      <Box key="header-refresh" shrink={false}>
        <IconButton icon="refresh" label={m.refreshLabel} variant="ghost" size="sm" disabled={read(refreshing)} onPress={refreshState} />
      </Box>
    </Row>
  )
}

/** Les corps des espaces inutilisables : un message, aucun geste. */
function workspaceMessage(state: PanelState): string | null {
  const m = copy()
  switch (state.workspace.status) {
    case 'none':
      return m.noWorkspace
    case 'remote':
      return m.remoteWorkspace
    case 'missing':
      return m.missingWorkspace
    case 'home':
      return m.homeWorkspace
    case 'ready':
      return null
  }
}

/** Notes dont la ligne a disparu (un retrait réussi) : elles ne doivent pas se perdre avec elle. */
function renderOrphanNotes(state: PanelState) {
  const m = copy()
  const known = new Set(state.rows.map((row) => row.folder))
  return Object.entries(read(notes))
    .filter(([folder]) => !known.has(folder))
    .map(([folder, note]) => renderNote(`orphan-${folder}`, note, m))
}

function renderList(state: PanelState, ctx: RowContext) {
  const m = ctx.m
  if (state.rows.length === 0) return <EmptyState icon="puzzle" title={m.emptyTitle} description={m.emptyHint} />
  return (
    <Stack gap="sm">
      <Text muted size="xs" weight="semibold">
        {`${m.inProject} · ${state.rows.length}`}
      </Text>
      {state.rows.map((row) => renderRow(row, ctx))}
    </Stack>
  )
}

function renderReady(state: PanelState) {
  const m = copy()
  const text = read(query)
  const flow = read(addFlow)
  const busy = read(pending) ?? state.busy
  const ctx: RowContext = { state, m, busy, confirm: read(confirmation) }
  const typing = text.trim().length >= MIN_QUERY_LENGTH
  return (
    <Stack gap="md">
      {state.inventory === 'fallback' ? (
        <Text muted size="xs">
          {m.fallbackNote}
        </Text>
      ) : null}
      {state.workspace.status === 'ready' && state.workspace.linkedWorktree ? (
        <Text muted size="xs">
          {m.worktreeNote}
        </Text>
      ) : null}
      {state.unsafeDirs.map((dir) => (
        <Callout key={`unsafe-${dir}`} tone="danger">
          {m.outsideProject(dir)}
        </Callout>
      ))}
      {state.lockUnreadable ? <Callout tone="warning">{m.lockUnreadable}</Callout> : null}
      {state.capabilities.trash ? null : <Callout tone="warning">{m.trashUnavailable}</Callout>}
      {renderSearchField(state, text, m)}
      {busy?.kind === 'add' ? renderProgress('add-progress', m.adding) : null}
      {renderReplaceConfirm(ctx.confirm, m)}
      {renderNote('add-note', read(addNote), m)}
      {renderOrphanNotes(state)}
      {renderAddFlow(flow, busy, m)}
      {flow === null ? renderPathLine(read(pathCheck), busy, m) : null}
      {/* Ce que le champ contient décide du corps : rien, la liste du projet ; un chemin, la ligne d'ajout ci-dessus ; sinon les résultats. */}
      {typing ? (isPathInput(text.trim()) ? null : renderResults(read(searchView), busy, flow?.status === 'loading', currentLocale(), m)) : renderList(state, ctx)}
    </Stack>
  )
}

export default function Panel() {
  const m = copy()
  const state = read(panelState)
  if (state === null) {
    const failed = read(loadError)
    return (
      <Stack gap="md">
        {renderHeader(null)}
        {failed === null ? (
          <Skeleton lines={3} label={m.loading} />
        ) : (
          <Stack gap="sm">
            <Callout tone="danger" title={m.loadFailed}>
              {failed}
            </Callout>
            <Row>
              <Button variant="outline" onPress={() => loadState()}>
                {m.retry}
              </Button>
            </Row>
          </Stack>
        )}
      </Stack>
    )
  }
  const message = workspaceMessage(state)
  // Une relecture qui échoue garde l'état affiché, mais ne passe pas sous silence.
  const staleReason = read(loadError)
  return (
    <Stack gap="md">
      {renderHeader(state)}
      {staleReason === null ? null : (
        <Callout tone="danger" title={m.loadFailed}>
          {staleReason}
        </Callout>
      )}
      {message === null ? renderReady(state) : <Callout tone="neutral">{message}</Callout>}
    </Stack>
  )
}
