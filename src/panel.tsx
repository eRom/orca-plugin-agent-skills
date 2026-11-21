// Panneau Skills : les skills du projet ouvert et ce que chaque agent d'Orca en voit.
// Aucun CSS ni DOM : Orca dessine les composants. Le worker lit le disque et écrit ; ici, on montre et on demande.
import { Button, Callout, EmptyState, env, IconButton, Image, read, Row, Separator, Skeleton, Stack, Switch, Text, Box } from 'orca'
import { dimIcon, themedIcon } from './icons'
import { osLabel, type Messages } from './copy'
import { currentLocale, copy } from './panel-copy'
import { CHIP_SLOT_WIDTH, renderProgress, renderNote, renderRow, type RowContext } from './panel-row'
import { renderAddFlow, renderPathLine, renderReplaceConfirm, renderResults, renderSearchField } from './panel-search'
import {
  addFlow,
  addNote,
  agentsOpen,
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
  savingAgent,
  searchView,
  setAgentHidden,
  toggleAgents
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
      {state === null ? null : (
        <Box key="header-agents" shrink={false}>
          <IconButton
            icon="agent"
            label={read(agentsOpen) ? m.agentsCloseLabel : m.agentsOpenLabel}
            variant="ghost"
            tone={read(agentsOpen) ? 'accent' : 'neutral'}
            size="sm"
            onPress={toggleAgents}
          />
        </Box>
      )}
      <Box key="header-refresh" shrink={false}>
        <IconButton icon="refresh" label={m.refreshLabel} variant="ghost" size="sm" disabled={read(refreshing)} onPress={refreshState} />
      </Box>
    </Row>
  )
}

/** Section « Agents » : chaque agent installé, avec un interrupteur pour le masquer dans tous les projets. */
function renderAgents(state: PanelState) {
  const m = copy()
  const scheme = env.theme.colorScheme
  const saving = read(savingAgent)
  const visible = state.detected.filter((agent) => !agent.hidden).length
  return (
    <Stack gap="sm">
      <Stack gap="xs">
        <Text muted size="xs" weight="semibold">
          {`${m.agentsTitle} · ${visible}/${state.detected.length}`}
        </Text>
        <Text muted size="xs">
          {state.detected.length === 0 ? m.agentsNone : m.agentsHint}
        </Text>
      </Stack>
      {state.detected.map((agent) => (
        <Row key={`agent-${agent.id}`} gap="sm" align="center">
          <Box key={`agent-icon-${agent.id}`} width={CHIP_SLOT_WIDTH} shrink={false} align="center" justify="center">
            <Image src={agent.hidden ? dimIcon(themedIcon(agent.icon, scheme)) : themedIcon(agent.icon, scheme)} alt="" size="xs" />
          </Box>
          <Box key={`agent-switch-${agent.id}`} grow minWidth={0}>
            <Switch
              label={agent.label}
              checked={!agent.hidden}
              // Le dernier agent visible reste visible : sans agent, aucun dossier où écrire.
              disabled={saving !== null || (!agent.hidden && visible === 1)}
              onChange={(checked) => void setAgentHidden(agent.id, !checked)}
            />
          </Box>
        </Row>
      ))}
      <Separator />
    </Stack>
  )
}

/** Le bandeau de la Corbeille : `ready` n'en a pas. Le `switch` est exhaustif, un statut ajouté sans bandeau ne compile pas. */
function trashBanner(state: PanelState, m: Messages): string | null {
  switch (state.capabilities.trash) {
    case 'ready':
      return null
    case 'missing':
      return m.trashUnavailable
    case 'unverified':
      return m.trashUnverified(osLabel(state.platform))
    case 'network':
      return m.trashNetwork
  }
}

/** Les corps des espaces inutilisables : un message, aucun geste. */
function workspaceMessage(state: PanelState): string | null {
  const m = copy()
  switch (state.workspace.status) {
    case 'none':
      return m.noWorkspace
    case 'wsl':
      return m.wslWorkspace
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
    .map(([folder, note]) => renderNote(`orphan-${folder}`, note, m, state.platform))
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
  const trashText = trashBanner(state, m)
  return (
    <Stack gap="md">
      {state.inventory === 'fallback' ? (
        <Text muted size="xs">
          {state.detected.length > 0 ? m.fallbackHiddenNote : m.fallbackNote}
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
      {trashText === null ? null : <Callout tone="warning">{trashText}</Callout>}
      {renderSearchField(state, text, m)}
      {busy?.kind === 'add' ? renderProgress('add-progress', m.adding) : null}
      {renderReplaceConfirm(ctx.confirm, m)}
      {renderNote('add-note', read(addNote), m, state.platform)}
      {renderOrphanNotes(state)}
      {renderAddFlow(flow, busy, m, state.platform)}
      {flow === null ? renderPathLine(read(pathCheck), busy, m) : null}
      {/* Ce que le champ contient décide du corps : rien, la liste du projet ; un chemin, la ligne d'ajout ci-dessus ; sinon les résultats. */}
      {typing ? (isPathInput(text.trim(), state.platform) ? null : renderResults(read(searchView), busy, flow?.status === 'loading', currentLocale(), m)) : renderList(state, ctx)}
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
      {read(agentsOpen) ? renderAgents(state) : null}
      {staleReason === null ? null : (
        <Callout tone="danger" title={m.loadFailed}>
          {staleReason}
        </Callout>
      )}
      {message === null ? renderReady(state) : <Callout tone="neutral">{message}</Callout>}
    </Stack>
  )
}
