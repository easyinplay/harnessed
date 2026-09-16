// External review L7 — the hook bins resolved the state root as
// "HARNESSED_ROOT_OVERRIDE else ~/.claude/harnessed", while the CLI goes through
// detectPlatform() (env, `.platform` pin, auto-probe). Under a codex pin the two
// roots diverged and the per-turn injection went silently empty.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hookStateRoot } from '../../src/checkpoint/hookStateRoot.js'
import { detectPlatform } from '../../src/platform/platform.js'

let home: string

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'harnessed-hookroot-'))
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  vi.stubEnv('HARNESSED_PLATFORM', '')
})
afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

function pin(id: string): void {
  mkdirSync(join(home, '.claude', 'harnessed'), { recursive: true })
  writeFileSync(join(home, '.claude', 'harnessed', '.platform'), `${id}\n`)
}

describe('hookStateRoot matches detectPlatform().stateRoot', () => {
  const cases: Array<[string, () => void]> = [
    ['nothing on disk', () => {}],
    ['only ~/.claude', () => mkdirSync(join(home, '.claude'))],
    ['only ~/.codex (auto-probe)', () => mkdirSync(join(home, '.codex'))],
    [
      'both homes, no pin',
      () => {
        mkdirSync(join(home, '.claude'))
        mkdirSync(join(home, '.codex'))
      },
    ],
    ['.platform pin = codex', () => pin('codex')],
    ['.platform pin = claude', () => pin('claude')],
    ['.platform pin = garbage', () => pin('vim')],
    [
      'HARNESSED_PLATFORM=codex beats a claude pin',
      () => {
        pin('claude')
        vi.stubEnv('HARNESSED_PLATFORM', 'codex')
      },
    ],
    [
      'HARNESSED_ROOT_OVERRIDE beats everything',
      () => {
        pin('codex')
        vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(home, 'override'))
      },
    ],
  ]
  it.each(cases)('%s', (_name, arrange) => {
    arrange()
    expect(hookStateRoot(home)).toBe(detectPlatform(home).stateRoot)
  })
})

describe('bin/harnessed-inject-state.mjs follows a codex pin', () => {
  it('--invalidate drops the inject cache under ~/.codex/harnessed, where the CLI writes', () => {
    pin('codex')
    const codexCache = join(home, '.codex', 'harnessed', 'inject-cache')
    mkdirSync(codexCache, { recursive: true })
    writeFileSync(join(codexCache, 'entry.json'), '{}')
    const env: Record<string, string | undefined> = {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
    }
    delete env.HARNESSED_ROOT_OVERRIDE
    delete env.HARNESSED_PLATFORM
    delete env.HARNESSED_OFF
    execFileSync(
      'node',
      [join(process.cwd(), 'bin', 'harnessed-inject-state.mjs'), '--invalidate'],
      {
        encoding: 'utf8',
        env,
      },
    )
    expect(existsSync(codexCache)).toBe(false)
  })
})
