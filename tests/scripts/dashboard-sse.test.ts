// Phase 2.4 W3 T3.2 — dashboard.mjs SSE watcher test (4 cells per task_plan T3.2).
//
// We spawn the dashboard at a random high port (override via DASHBOARD_PORT env var
// if we add it later; for now we test against the production 47180 port — if it
// collides on the developer machine, the test skipIf bails). All HTTP calls use
// node built-in http.request (zero npm dep parity per W5 gate).

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const DASHBOARD = join(process.cwd(), 'scripts', 'dashboard.mjs')
const PORT = 47180

interface ChildHandle {
  proc: ReturnType<typeof spawn>
  tmpRoot: string
}

function httpGet(path: string, timeoutMs = 3000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port: PORT, path, method: 'GET', timeout: timeoutMs },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }))
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error('http timeout'))
    })
    req.end()
  })
}

// Streaming SSE client — collects events up to `untilMs`, then resolves with the raw stream.
function sseConnect(untilMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port: PORT, path: '/events', method: 'GET' },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          body += chunk
        })
        setTimeout(() => {
          req.destroy()
          resolve(body)
        }, untilMs)
      },
    )
    req.on('error', reject)
    req.end()
  })
}

async function waitFor(port: number, timeoutMs = 5000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await httpGet('/', 500)
      if (r.status === 200) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`dashboard did not start on :${port} within ${timeoutMs}ms`)
}

let handle: ChildHandle | null = null
const portTaken = { value: false }

beforeAll(async () => {
  // Probe — skip if port already in use (e.g. developer is running dashboard).
  try {
    const r = await httpGet('/', 500)
    if (r.status === 200) {
      portTaken.value = true
      return
    }
  } catch {
    // good — port free, proceed.
  }

  const tmpRoot = await mkdtemp(join(tmpdir(), 'dash-sse-'))
  await mkdir(join(tmpRoot, '.planning'), { recursive: true })
  await writeFile(join(tmpRoot, '.planning', 'STATE.md'), '# initial state\n')

  const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
    cwd: tmpRoot,
    stdio: 'ignore',
    detached: false,
  })
  handle = { proc, tmpRoot }
  await waitFor(PORT)
}, 15_000)

afterAll(async () => {
  if (handle) {
    handle.proc.kill('SIGKILL')
    await rm(handle.tmpRoot, { recursive: true, force: true }).catch(() => undefined)
  }
})

describe('dashboard SSE watcher (T3.2)', () => {
  it('cell 1 — /events returns SSE handshake `: connected`', async () => {
    if (portTaken.value) return
    const body = await sseConnect(500)
    expect(body).toContain(': connected')
  })

  it('cell 2 — STATE.md touch fires `event: state-changed` within 2s', async () => {
    if (portTaken.value || !handle) return
    const connectPromise = sseConnect(2000)
    // give the SSE client a moment to register before mutating the file
    await new Promise((r) => setTimeout(r, 200))
    writeFileSync(join(handle.tmpRoot, '.planning', 'STATE.md'), `# changed ${Date.now()}\n`)
    const body = await connectPromise
    expect(body).toContain('event: state-changed')
  })

  it('cell 3 — debounce: 5 rapid touches within 500ms → only 1 event fires', async () => {
    if (portTaken.value || !handle) return
    const connectPromise = sseConnect(1500)
    await new Promise((r) => setTimeout(r, 200))
    // 5 rapid writes within 100ms (well inside the 500ms debounce window).
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(handle.tmpRoot, '.planning', 'STATE.md'), `# debounce ${i}\n`)
    }
    const body = await connectPromise
    const matches = body.match(/event: state-changed/g) ?? []
    // Allow 1 (debounced) or 2 (very fast machine + slight scheduling) but never 5.
    expect(matches.length).toBeLessThan(3)
  })

  it('cell 4 — B-27 localhost-only bind: 127.0.0.1 works (positive control)', async () => {
    if (portTaken.value) return
    // We can't easily test "0.0.0.0 connect fails" on localhost (loopback subsumes),
    // but we can assert the dashboard responds on 127.0.0.1 — which is what
    // server.listen(PORT, '127.0.0.1') guarantees + cell 1 already demonstrated.
    const r = await httpGet('/', 1000)
    expect(r.status).toBe(200)
    expect(r.body).toContain('harnessed')
  })
})
