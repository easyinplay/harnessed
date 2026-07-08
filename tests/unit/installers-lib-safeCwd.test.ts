// v4.20.1 — getNeutralSpawnCwd (EBADDEVENGINES 环境污染免疫).
//
// dogfood v4.20.0: user ran setup from a home dir whose package.json declared
// `devEngines: { runtime: { name: 'bun' } }` (bun-generated) — npm exec walks
// cwd upward to the nearest package.json and hard-fails EBADDEVENGINES for any
// npx-based install. Neutral spawn cwd = <stateRoot>/.spawn/ WITH a sentinel
// package.json (name-only) that terminates npm's upward walk.
//
// Real fs against tmp dirs via HARNESSED_ROOT_OVERRIDE (sister ledger-state
// isolation pattern). The global vitest setup pins HARNESSED_SPAWN_CWD for all
// other suites — this suite deletes it per-test to exercise the fs logic.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getNeutralSpawnCwd } from '../../src/installers/lib/safeCwd.js'

let tmp: string
let savedSpawnCwd: string | undefined
let savedRootOverride: string | undefined

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'hns-safecwd-'))
  savedSpawnCwd = process.env.HARNESSED_SPAWN_CWD
  savedRootOverride = process.env.HARNESSED_ROOT_OVERRIDE
  delete process.env.HARNESSED_SPAWN_CWD
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, 'state-root')
})

afterEach(() => {
  if (savedSpawnCwd === undefined) delete process.env.HARNESSED_SPAWN_CWD
  else process.env.HARNESSED_SPAWN_CWD = savedSpawnCwd
  if (savedRootOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = savedRootOverride
  rmSync(tmp, { recursive: true, force: true })
})

describe('getNeutralSpawnCwd (v4.20.1)', () => {
  it('honors HARNESSED_SPAWN_CWD verbatim (no fs side effects)', () => {
    process.env.HARNESSED_SPAWN_CWD = '  X:/neutral-spot  '
    expect(getNeutralSpawnCwd()).toBe('X:/neutral-spot')
  })

  it('creates <stateRoot>/.spawn with a sentinel package.json', () => {
    const dir = getNeutralSpawnCwd()
    expect(dir).toBe(join(tmp, 'state-root', '.spawn'))
    const sentinel = JSON.parse(readFileSync(join(dir as string, 'package.json'), 'utf8')) as {
      name: string
      private: boolean
      devEngines?: unknown
    }
    expect(sentinel.name).toBe('harnessed-neutral-spawn')
    expect(sentinel.private).toBe(true)
    // The whole point: the sentinel must NOT itself declare devEngines.
    expect(sentinel.devEngines).toBeUndefined()
  })

  it('does not overwrite an existing sentinel', () => {
    const first = getNeutralSpawnCwd() as string
    const custom = '{"name":"user-touched","private":true}\n'
    writeFileSync(join(first, 'package.json'), custom, 'utf8')
    const second = getNeutralSpawnCwd()
    expect(second).toBe(first)
    expect(readFileSync(join(first, 'package.json'), 'utf8')).toBe(custom)
  })

  it('returns null when the neutral dir cannot be created (fail-open to ctx.cwd)', () => {
    // Point stateRoot UNDER an existing regular file — mkdir must fail.
    const blocker = join(tmp, 'blocker')
    writeFileSync(blocker, 'not a dir', 'utf8')
    process.env.HARNESSED_ROOT_OVERRIDE = join(blocker, 'nested')
    expect(getNeutralSpawnCwd()).toBeNull()
  })
})
