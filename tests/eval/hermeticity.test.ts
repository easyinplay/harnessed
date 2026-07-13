// 4.31.1 — eval runner hermeticity vs ANCESTOR git repos (regression for the
// 3-OS CI red on eval's FIRST CI run, 2026-07-13). `checkpoint complete` shells
// out `defaultShipReady(process.cwd())`; the scenario cwd is a bare tmpdir, but
// git walks UP parent directories — on the recording machine the user's HOME
// (an ancestor of os.tmpdir()) was itself a git repo with 1 commit and no
// release tag, so goldens captured ship_ready:true while CI (no ancestor repo)
// saw fail-soft false. The runner now pins GIT_CEILING_DIRECTORIES to the tmp
// root; this test poisons the tmp root's ancestry ON PURPOSE and asserts the
// scenario still matches its committed golden (ship_ready:false).

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runEvalSuite } from '../../src/eval/runner.js'

const saved: Record<string, string | undefined> = {}
const TMP_KEYS = ['TMPDIR', 'TMP', 'TEMP'] as const

afterEach(() => {
  for (const k of TMP_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('eval runner hermeticity (ancestor git repo must not leak into goldens)', () => {
  it('scenario PASSes its golden even when os.tmpdir() sits inside a git repo', async () => {
    // Build a git repo (1 commit, no release tags — the exact ambient shape
    // that leaked ship_ready:true) and point the OS temp dir INSIDE it.
    const repo = mkdtempSync(join(tmpdir(), 'eval-ancestor-repo-'))
    const g = (...args: string[]) => execFileSync('git', ['-C', repo, ...args], { stdio: 'pipe' })
    g('init', '-q')
    writeFileSync(join(repo, 'seed.txt'), 'seed')
    g('add', 'seed.txt')
    g('-c', 'user.name=eval', '-c', 'user.email=eval@test', 'commit', '-q', '-m', 'seed')
    const innerTmp = join(repo, 'tmp')
    mkdirSync(innerTmp)
    for (const k of TMP_KEYS) {
      saved[k] = process.env[k]
      process.env[k] = innerTmp
    }

    try {
      const dir = join(process.cwd(), 'fixtures', 'eval')
      const suite = await runEvalSuite(dir, { filter: 'serial-order-guard' })
      const r = suite.results.find((x) => x.name === 'serial-order-guard')
      expect(r, 'serial-order-guard scenario must exist').toBeDefined()
      // Golden commits ship_ready:false — a PASS here proves the ancestor repo
      // did not leak (pre-fix this reproduced the CI failure locally).
      expect(`${r?.status}: ${(r?.detail ?? []).join(' | ')}`).toBe('PASS: ')
    } finally {
      for (const k of TMP_KEYS) {
        if (saved[k] === undefined) delete process.env[k]
        else process.env[k] = saved[k]
      }
      rmSync(repo, { recursive: true, force: true })
    }
  }, 60_000)
})
