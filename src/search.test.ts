// Recherche skills.sh : serveur node:http local, jamais le réseau.
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { assert, test } from 'orca/testing'
import { formatInstalls, SEARCH_LIMIT, SearchError, searchSkills, SKILLS_SH } from './search'

type Handler = (req: IncomingMessage, res: ServerResponse) => void

async function withServer<T>(handler: Handler, body: (base: string) => Promise<T>): Promise<T> {
  const server: Server = createServer(handler)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    return await body(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

const sample = readFileSync(new URL('./testdata/skills-sh-search.sample.json', import.meta.url), 'utf8')

test('constants point at skills.sh with a 20 hit limit', () => {
  assert.equal(SKILLS_SH, 'https://skills.sh')
  assert.equal(SEARCH_LIMIT, 20)
})

test('search asks skills.sh and sorts by installs', async () => {
  const lines: string[] = []
  const hits = await withServer(
    (req, res) => {
      lines.push(`${req.method} ${req.url} HTTP/${req.httpVersion}`)
      res.setHeader('content-type', 'application/json')
      res.end(sample)
    },
    (base) => searchSkills('mo tion', { base, fetch })
  )
  assert.deepEqual(lines, ['GET /api/search?q=mo+tion&limit=20 HTTP/1.1'])
  const raw = JSON.parse(sample).skills as Array<{ installs: number; source: string; skillId: string; name: string }>
  assert.equal(hits.length, raw.length)
  assert.ok(hits.length > 1)
  for (let index = 1; index < hits.length; index += 1) {
    assert.ok(hits[index - 1].installs >= hits[index].installs, 'sorted by decreasing installs')
  }
  assert.deepEqual(Object.keys(hits[0]).sort(), ['installs', 'name', 'skillId', 'source'])
  const first = raw.reduce((best, hit) => (hit.installs > best.installs ? hit : best))
  assert.deepEqual(hits[0], { name: first.name, source: first.source, skillId: first.skillId, installs: first.installs })
})

test('search drops malformed entries and tolerates a missing skills array', async () => {
  const body = JSON.stringify({ skills: [{ name: 'ok', source: 'a/b', skillId: 'ok', installs: 5 }, { name: 'no-source' }, null, 7] })
  const hits = await withServer((_req, res) => res.end(body), (base) => searchSkills('x', { base, fetch }))
  assert.deepEqual(hits, [{ name: 'ok', source: 'a/b', skillId: 'ok', installs: 5 }])
  const none = await withServer((_req, res) => res.end('{}'), (base) => searchSkills('x', { base, fetch }))
  assert.deepEqual(none, [])
})

test('search reports an unreachable server', async () => {
  // Un port fermé : on ouvre un serveur, on le ferme, on réutilise son port.
  const base = await withServer(() => undefined, async (url) => url)
  await assert.rejects(searchSkills('x', { base, fetch }), (error: unknown) => error instanceof SearchError && error.code === 'unreachable')
})

test('search reports an unreadable answer', async () => {
  await withServer(
    (_req, res) => res.end('<html>'),
    async (base) => {
      await assert.rejects(searchSkills('x', { base, fetch }), (error: unknown) => error instanceof SearchError && error.code === 'unreadable')
    }
  )
})

test('search reports an http error status', async () => {
  await withServer(
    (_req, res) => {
      res.statusCode = 500
      res.end('boom')
    },
    async (base) => {
      await assert.rejects(searchSkills('x', { base, fetch }), (error: unknown) => error instanceof SearchError && error.code === 'http')
    }
  )
})

test('search propagates an abort as unreachable', async () => {
  const controller = new AbortController()
  controller.abort()
  await withServer(
    (_req, res) => res.end(sample),
    async (base) => {
      await assert.rejects(searchSkills('x', { base, fetch, signal: controller.signal }), (error: unknown) => error instanceof SearchError && error.code === 'unreachable')
    }
  )
})

test('formats install counts per locale', () => {
  assert.equal(formatInstalls(999, 'fr'), '999')
  assert.equal(formatInstalls(514493, 'fr'), '514,5K')
  assert.equal(formatInstalls(624501, 'en'), '624.5K')
  assert.equal(formatInstalls(1000000, 'fr'), '1M')
  assert.equal(formatInstalls(999960, 'en'), '1M')
  assert.equal(formatInstalls(1250000, 'fr'), '1,3M')
  assert.equal(formatInstalls(0, 'en'), '0')
  assert.equal(formatInstalls(1000, 'en'), '1K')
})
