// External review M13 — a spawn timeout killed only the direct child (the shell),
// so the real installer work it had started kept running as an orphan.
//
// Real processes, no mocks: the child is a shell, the grandchild is a node
// process that records its pid and idles. `&& node -e 0` keeps POSIX shells
// from exec-replacing themselves with the grandchild (which would hide the bug).

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'

const dirs: string[] = []
const strays: number[] = []

afterEach(() => {
  for (const pid of strays.splice(0)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // already gone
    }
  }
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('spawnCmd timeout kills the whole process tree (M13)', () => {
  it('the grandchild started by the shell does not outlive the timeout', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'harnessed-killtree-'))
    dirs.push(dir)
    const pidFile = join(dir, 'grandchild.pid')
    const script = join(dir, 'grandchild.cjs')
    writeFileSync(
      script,
      `require('fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setInterval(() => {}, 1000)`,
    )
    const ctx = {
      manifest: { metadata: { name: 'killtree' }, spec: { install: {} } } as unknown as Manifest,
      opts: {},
      level: 'L4',
      cwd: dir,
    } as unknown as InstallContext

    const result = spawnCmd(ctx, 'node', [script, '&&', 'node', '-e', '0'], 2_500)
    let gpid = 0
    for (let i = 0; i < 40 && !gpid; i++) {
      await sleep(50)
      try {
        gpid = Number(readFileSync(pidFile, 'utf8'))
      } catch {
        // not written yet
      }
    }
    expect(gpid).toBeGreaterThan(0)
    strays.push(gpid)

    const r = await result
    expect(r).toMatchObject({ ok: false, error: { keyword: 'spawn-timeout' } })
    // Give the OS a moment to reap.
    for (let i = 0; i < 20 && isAlive(gpid); i++) await sleep(50)
    expect(isAlive(gpid)).toBe(false)
  }, 15_000)
})
