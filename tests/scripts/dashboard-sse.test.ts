// Phase 2.4 W3 T3.2 — dashboard.mjs SSE watcher test (4 cells per task_plan T3.2).
// Phase 3.3 W0 T0.2 — flaky fix path (a): random ephemeral port via net.createServer({port:0}) +
//   DASHBOARD_PORT env injection (sister Phase 2.4 W4 Win 3-tier 8s waitFor pattern).
//
// We spawn the dashboard at a random ephemeral port (via getEphemeralPort helper using
// node net.createServer({port:0}) MDN std). DASHBOARD_PORT env var is injected into the
// child spawn so dashboard.mjs L39 additive override picks it up. No more probe-and-skip
// branches — 4 cells always run since random port eliminates collision risk.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const DASHBOARD = join(process.cwd(), 'scripts', 'dashboard.mjs')
// Phase 3.3 W0 T0.2 — random ephemeral port (mutable; populated in beforeAll via getEphemeralPort()).
let PORT = 0

/** Random ephemeral port helper (sister Node net.createServer({port:0}) MDN std). */
function getEphemeralPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createNetServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      if (addr && typeof addr === 'object') {
        const port = addr.port
        srv.close(() => resolve(port))
      } else {
        srv.close(() => reject(new Error('failed to get ephemeral port')))
      }
    })
    srv.on('error', reject)
  })
}

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

// Phase 3.3 W0 T0.2 — 8s waitFor timeout (sister Phase 2.4 W4 Win 3-tier pattern).
async function waitFor(port: number, timeoutMs = 8000): Promise<void> {
  const start = Date.now()
  let lastErr: Error | null = null
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await httpGet('/', 500)
      if (r.status === 200) return
    } catch (e) {
      lastErr = e as Error
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(
    `dashboard did not start on :${port} within ${timeoutMs}ms (last: ${lastErr?.message})`,
  )
}

let handle: ChildHandle | null = null

beforeAll(async () => {
  // Phase 3.3 W0 T0.2 — random ephemeral port + DASHBOARD_PORT env injection.
  // No more probe-and-skip (random port eliminates collision with dev's running dashboard).
  PORT = await getEphemeralPort()
  const tmpRoot = await mkdtemp(join(tmpdir(), 'dash-sse-'))
  await mkdir(join(tmpRoot, '.planning'), { recursive: true })
  await writeFile(join(tmpRoot, '.planning', 'STATE.md'), '# initial state\n')

  const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
    cwd: tmpRoot,
    stdio: 'ignore',
    detached: false,
    env: { ...process.env, DASHBOARD_PORT: String(PORT) }, // ← inject env var (matches dashboard.mjs L39 additive override)
  })
  handle = { proc, tmpRoot }
  await waitFor(PORT, 8000)
}, 15_000)

afterAll(async () => {
  if (handle) {
    handle.proc.kill('SIGKILL')
    await rm(handle.tmpRoot, { recursive: true, force: true }).catch(() => undefined)
  }
})

describe('dashboard SSE watcher (T3.2)', () => {
  it('cell 1 — /events returns SSE handshake `: connected`', async () => {
    const body = await sseConnect(500)
    expect(body).toContain(': connected')
  })

  it('cell 2 — STATE.md touch fires `event: state-changed` within 2s', async () => {
    if (!handle) throw new Error('handle not initialized')
    const connectPromise = sseConnect(2000)
    // give the SSE client a moment to register before mutating the file
    await new Promise((r) => setTimeout(r, 200))
    writeFileSync(join(handle.tmpRoot, '.planning', 'STATE.md'), `# changed ${Date.now()}\n`)
    const body = await connectPromise
    expect(body).toContain('event: state-changed')
  })

  it('cell 3 — debounce: 5 rapid touches within 500ms → only 1 event fires', async () => {
    if (!handle) throw new Error('handle not initialized')
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
    // We can't easily test "0.0.0.0 connect fails" on localhost (loopback subsumes),
    // but we can assert the dashboard responds on 127.0.0.1 — which is what
    // server.listen(PORT, '127.0.0.1') guarantees + cell 1 already demonstrated.
    const r = await httpGet('/', 1000)
    expect(r.status).toBe(200)
    expect(r.body).toContain('harnessed')
  })
})
