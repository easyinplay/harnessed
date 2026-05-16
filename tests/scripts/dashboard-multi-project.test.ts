// Phase 2.4 W3 T3.3 — dashboard.mjs /api/projects + /api/project/<id>/state test (4 cells).
// Reuses sister T3.2 pattern (spawn dashboard / probe via http.request / skipIf port-taken).
// HOME-scope harnessed-projects.json — we override HOME env so the test doesn't pollute
// the developer's real ~/.claude/harnessed-projects.json.

import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const DASHBOARD = join(process.cwd(), 'scripts', 'dashboard.mjs')
const PORT = 47180

interface Handle {
  proc: ReturnType<typeof spawn>
  tmpRoot: string
  fakeHome: string
}

function httpGet(path: string, timeoutMs = 3000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port: PORT, path, method: 'GET', timeout: timeoutMs },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => {
          body += c
        })
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }))
      },
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('http timeout')))
    req.end()
  })
}

async function waitFor(timeoutMs = 5000): Promise<void> {
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
  throw new Error(`dashboard did not start on :${PORT} within ${timeoutMs}ms`)
}

let handle: Handle | null = null
const portTaken = { value: false }

beforeAll(async () => {
  // Skip if port taken by developer's running dashboard.
  try {
    const r = await httpGet('/', 500)
    if (r.status === 200) {
      portTaken.value = true
      return
    }
  } catch {
    // good
  }

  const tmpRoot = await mkdtemp(join(tmpdir(), 'dash-mp-'))
  const fakeHome = await mkdtemp(join(tmpdir(), 'dash-mp-home-'))
  await mkdir(join(tmpRoot, '.planning'), { recursive: true })
  await writeFile(join(tmpRoot, '.planning', 'STATE.md'), '# tmp root state\n')

  const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
    cwd: tmpRoot,
    stdio: 'ignore',
    env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome },
  })
  handle = { proc, tmpRoot, fakeHome }
  await waitFor()
}, 15_000)

afterAll(async () => {
  if (handle) {
    handle.proc.kill('SIGKILL')
    await rm(handle.tmpRoot, { recursive: true, force: true }).catch(() => undefined)
    await rm(handle.fakeHome, { recursive: true, force: true }).catch(() => undefined)
  }
})

describe('dashboard multi-project (T3.3)', () => {
  it('cell 1 — /api/projects auto-inits with cwd as default project (O7 MIN)', async () => {
    if (portTaken.value) return
    const r = await httpGet('/api/projects')
    expect(r.status).toBe(200)
    const cfg = JSON.parse(r.body)
    expect(cfg.schemaVersion).toBe(1)
    expect(cfg.projects).toHaveLength(1)
    expect(cfg.projects[0].name).toBe('default')
  })

  it('cell 2 — /api/project/0/state returns the project STATE.md content', async () => {
    if (portTaken.value) return
    const r = await httpGet('/api/project/0/state')
    expect(r.status).toBe(200)
    expect(r.body).toContain('tmp root state')
  })

  it('cell 3 — /api/project/99/state returns 404 (out-of-bounds idx)', async () => {
    if (portTaken.value) return
    const r = await httpGet('/api/project/99/state')
    expect(r.status).toBe(404)
  })

  it('cell 4 — SHELL HTML contains proj-sel + loadProject (client UI present)', async () => {
    if (portTaken.value) return
    const r = await httpGet('/')
    expect(r.status).toBe(200)
    expect(r.body).toContain('proj-sel')
    expect(r.body).toContain('loadProject')
    expect(r.body).toContain('/api/projects')
  })
})
