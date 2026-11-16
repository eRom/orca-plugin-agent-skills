// Le champ unique et ce qu'il commande : résultats de skills.sh, ajout depuis un dossier, confirmation de remplacement.
import { Badge, Box, Button, Callout, Checkbox, Code, IconButton, Input, Row, Spinner, Stack, Text } from 'orca'
import type { Locale, Messages } from './copy'
import { renderNote, renderProgress } from './panel-row'
import {
  addHit,
  cancelConfirmation,
  clearQuery,
  onQueryChange,
  pickFolder,
  readPath,
  startOp,
  submitQuery,
  toggleSkill,
  type AddFlow,
  type PathCheck,
  type Confirm,
  type SearchView
} from './panel-state'
import type { OpRequest, PanelState } from './protocol'
import { formatInstalls } from './search'

export function renderSearchField(state: PanelState, text: string, m: Messages) {
  return (
    <Row gap="xs" align="center">
      <Box key="search-field" grow minWidth={0}>
        <Input label={m.searchLabel} labelHidden type="search" placeholder={m.searchPlaceholder} value={text} onChange={onQueryChange} onSubmit={submitQuery} />
      </Box>
      {text !== '' ? <IconButton icon="close" label={m.clearSearchLabel} variant="ghost" size="sm" onPress={clearQuery} /> : null}
      {state.capabilities.folderPicker ? <IconButton icon="folder" label={m.pickFolderLabel} variant="ghost" size="sm" onPress={pickFolder} /> : null}
    </Row>
  )
}

/** Résultats de skills.sh : groupe, lignes, « Installée » ou « Ajouter », ou le message de l'échec. */
export function renderResults(view: SearchView, busy: OpRequest | null, loadingFlow: boolean, locale: Locale, m: Messages) {
  switch (view.status) {
    case 'idle':
      return null
    case 'loading':
      return (
        <Row gap="xs" align="center">
          <Spinner label={m.searching} labelHidden />
          <Text muted size="xs">
            {m.searching}
          </Text>
        </Row>
      )
    case 'failed':
      return (
        <Text tone="danger" size="sm">
          {view.error === 'unreadable' ? m.searchUnreadable : m.searchUnreachable}
        </Text>
      )
    case 'done': {
      // L'API peut répéter un résultat : une clé en double refuserait tout le rendu.
      const seen = new Set<string>()
      const hits = view.hits.filter((hit) => {
        const key = `${hit.source}/${hit.skillId}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      if (hits.length === 0) {
        return (
          <Text muted size="sm">
            {m.noResults}
          </Text>
        )
      }
      return (
        <Stack gap="sm">
          <Text muted size="xs" weight="semibold">
            {m.searchGroup(hits.length)}
          </Text>
          {hits.map((hit) => (
            <Row key={`hit-${hit.source}/${hit.skillId}`} justify="between" align="center" gap="sm">
              <Box key={`hit-text-${hit.source}/${hit.skillId}`} grow minWidth={0}>
                <Text weight="semibold" truncate>
                  {hit.name}
                </Text>
                <Text muted size="xs" truncate>
                  {`${hit.source} · ${formatInstalls(hit.installs, locale)}`}
                </Text>
              </Box>
              <Box key={`hit-action-${hit.source}/${hit.skillId}`} shrink={false}>
                {hit.installed ? (
                  <Badge tone="success">{m.installed}</Badge>
                ) : (
                  <Button key={`add-${hit.source}/${hit.skillId}`} variant="outline" size="sm" disabled={busy !== null || loadingFlow} onPress={() => addHit(hit)}>
                    {m.add}
                  </Button>
                )}
              </Box>
            </Row>
          ))}
        </Stack>
      )
    }
  }
}

const sourceText = (label: Extract<AddFlow, { status: 'ready' }>['label']): string =>
  label.kind === 'local' ? label.path : label.kind === 'remote' ? label.source : ''

/** Ce que le worker a lu d'une source : une ligne « Ajouter depuis ce dossier », ou la liste à cases quand elle porte plusieurs skills. */
export function renderAddFlow(flow: AddFlow | null, busy: OpRequest | null, m: Messages) {
  if (flow === null) return null
  if (flow.status === 'loading') {
    // Un ajout depuis skills.sh lit la source avant de s'engager ; un chemin se lit pendant la frappe.
    return renderProgress('add-flow-loading', flow.origin === 'hit' ? m.adding : m.reading)
  }
  if (flow.status === 'failed') {
    if (flow.error?.code === 'path-not-found') {
      return (
        <Text tone="danger" size="sm">
          {m.folderNotFound}
        </Text>
      )
    }
    return renderNote('add-flow-failed', { error: flow.error, message: flow.message, warnings: [] }, m)
  }
  const count = flow.selected.length
  return (
    <Box key="add-flow" border radius="md" padding="sm" gap="sm" background="muted">
      <Text weight="semibold" size="sm">
        {m.addFromFolder}
      </Text>
      <Code>{sourceText(flow.label)}</Code>
      {flow.skills.map((skill) => (
          <Checkbox key={`check-${skill.name}`} label={skill.name} description={skill.description === '' ? undefined : skill.description} checked={flow.selected.includes(skill.name)} disabled={busy !== null} onChange={(checked) => toggleSkill(skill.name, checked)} />
      ))}
      <Row>
        <Button
          key="add-path"
          size="sm"
          disabled={busy !== null || count === 0}
          onPress={() => startOp({ kind: 'add', previewId: flow.previewId, names: flow.selected, replace: false })}
        >
          {m.addCount(count)}
        </Button>
      </Row>
    </Box>
  )
}

/** « Remplacer <nom> ? » en ligne, sous le champ : Annuler n'envoie rien. */
export function renderReplaceConfirm(confirm: Confirm | null, m: Messages) {
  if (confirm?.kind !== 'replace') return null
  return (
    <Callout key="confirm-replace" tone="warning">
      <Stack gap="sm">
        <Text size="xs">{m.replaceAsk(confirm.folders.length > 0 ? confirm.folders.join(', ') : confirm.names.join(', '))}</Text>
        <Row gap="sm">
          <Button variant="outline" size="sm" onPress={cancelConfirmation}>
            {m.cancel}
          </Button>
          <Button size="sm" onPress={() => startOp({ kind: 'add', previewId: confirm.previewId, names: confirm.names, replace: true })}>
            {m.replaceConfirm}
          </Button>
        </Row>
      </Stack>
    </Callout>
  )
}

/**
 * Un chemin tapé : une seule ligne « Ajouter depuis ce dossier » avec le chemin, ou « Dossier introuvable » sans geste.
 * La source n'est lue qu'à l'appui sur la ligne (ou Entrée).
 */
export function renderPathLine(check: PathCheck | null, busy: OpRequest | null, m: Messages) {
  if (check === null || check.status === 'checking') return null
  if (check.status === 'missing') {
    return (
      <Text tone="danger" size="sm">
        {m.folderNotFound}
      </Text>
    )
  }
  return (
    <Box key="path-line" border radius="md" padding="sm" gap="sm" background="muted">
      <Text weight="semibold" size="sm">
        {m.addFromFolder}
      </Text>
      <Code>{check.text}</Code>
      <Row>
        <Button key="read-path" size="sm" disabled={busy !== null} onPress={() => readPath(check.text)}>
          {m.add}
        </Button>
      </Row>
    </Box>
  )
}
