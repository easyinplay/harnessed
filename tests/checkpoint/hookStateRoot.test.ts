// External review L7 — the hook bins resolved the state root as
// "HARNESSED_ROOT_OVERRIDE else ~/.claude/harnessed", while the CLI goes through
// detectPlatform() (env, `.platform` pin, auto-probe). Under a codex pin the two
// roots diverged and the per-turn injection went silently empty.
//
// v16.0 Phase 63 T4 — the dependency-free replica (src/checkpoint/hookStateRoot.ts)
// is gone: the hook entries import detectPlatform() from src/platform/platform.ts
// (itself node:-builtins only), so the bins cannot drift from the CLI. These tests
// drive the GENERATED bin end-to-end and assert the bundle stays typebox-free.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const INJECT_BIN = join(process.cwd(), 'bin', 'harnessed-inject-state.mjs')
const STOP_BIN = join(process.cwd(), 'bin', 'harnessed-stop-hook.mjs')

let home: string

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'harnessed-hookroot-'))
  // dual-host machine: both homes exist, so the directory probe alone says claude.
  mkdirSync(join(home, '.claude'), { recursive: true })
  mkdirSync(join(home, '.codex'), { recursive: true })
})
afterEach(() => {
  rmSync(home, { recursive: true, force: true })
})

function seedCache(host: '.claude' | '.codex'): string {
  const dir = join(home, host, 'harnessed', 'inject-cache')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'entry.json'), '{}')
  return dir
}

function runInvalidate(extra: Record<string, string> = {}): void {
  const env: Record<string, string | undefined> = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    ...extra,
  }
  for (const k of ['HARNESSED_ROOT_OVERRIDE', 'HARNESSED_PLATFORM', 'HARNESSED_OFF']) {
    if (!(k in extra)) delete env[k]
  }
  for (const k of Object.keys(env)) {
    if ((k.startsWith('CODEX_') || k === 'CLAUDE_CODE_SESSION_ID') && !(k in extra)) delete env[k]
  }
  execFileSync('node', [INJECT_BIN, '--invalidate'], { encoding: 'utf8', env })
}

describe('bin/harnessed-inject-state.mjs resolves the root through detectPlatform', () => {
  it('codex pin at the codex stateRoot → invalidates ~/.codex/harnessed', () => {
    mkdirSync(join(home, '.codex', 'harnessed'), { recursive: true })
    writeFileSync(join(home, '.codex', 'harnessed', '.platform'), 'codex\n')
    const codexCache = seedCache('.codex')
    const claudeCache = seedCache('.claude')
    runInvalidate()
    expect(existsSync(codexCache)).toBe(false)
    expect(existsSync(claudeCache)).toBe(true)
  })

  it('legacy codex pin at the claude stateRoot is still honoured', () => {
    mkdirSync(join(home, '.claude', 'harnessed'), { recursive: true })
    writeFileSync(join(home, '.claude', 'harnessed', '.platform'), 'codex\n')
    const codexCache = seedCache('.codex')
    runInvalidate()
    expect(existsSync(codexCache)).toBe(false)
  })

  it('CODEX_SESSION_ID alone (codex hook / shell) → ~/.codex/harnessed', () => {
    const codexCache = seedCache('.codex')
    const claudeCache = seedCache('.claude')
    runInvalidate({ CODEX_SESSION_ID: 'sess-1' })
    expect(existsSync(codexCache)).toBe(false)
    expect(existsSync(claudeCache)).toBe(true)
  })

  it('no env, no pin → claude (incumbent) root, unchanged', () => {
    const codexCache = seedCache('.codex')
    const claudeCache = seedCache('.claude')
    runInvalidate()
    expect(existsSync(claudeCache)).toBe(false)
    expect(existsSync(codexCache)).toBe(true)
  })
})

describe('hook bins stay dependency-free', () => {
  it.each([INJECT_BIN, STOP_BIN])('%s bundles no typebox', (bin) => {
    expect(readFileSync(bin, 'utf8')).not.toMatch(/typebox/i)
  })

  it('the precedence replica is gone from the bundle (single SoT: detectPlatform)', () => {
    const src = readFileSync(INJECT_BIN, 'utf8')
    expect(src).not.toMatch(/function hookStateRoot\b/)
    expect(src).not.toMatch(/function sessionIdEnvName\b/)
    expect(src).toMatch(/CODEX_SESSION_ID/)
  })
})
