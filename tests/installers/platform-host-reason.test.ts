// v16.0 Phase 67 T3 — `resolveHostWithReason()`: the host resolution WITH the
// precedence rule that decided it.
//
// Why the seam exists: Phase 67's `checkpoint adopt` hard-refuses when `--from`
// names the host it already resolved to, and that refusal has to name WHY the host
// resolved that way (ADR 0043 / D8). Re-deriving the 5-branch ladder inside
// adoptSlot.ts would be a guaranteed drift site — the same shape as the dep-free
// `repoKey` replica that silently diverged from its original (findings F2).
//
// The reason is STRUCTURED DATA, not a sentence: `src/cli/checkpoint.ts` carries
// zero `t()` calls, so checkpoint's user-facing English lives at the call site and
// the rendering stays there too.
//
// TDD order: the `detectPlatform` ladder describe below was written and run GREEN
// against the PRE-refactor platform.ts — it pins the five rules and the two
// fall-throughs independently of the new export, so it proves the refactor is
// behavior-preserving rather than merely self-consistent. The reason describe was
// then added RED (no such export) and driven to green.
//
// Sandboxing: resolution is exercised through the existing `home` parameter seam
// (`detectPlatform(home)` / `claudeDescriptor(home)` / `codexDescriptor(home)`) with
// per-test tmpdirs rather than stubbing `os.homedir`, and every env var is
// stubbed/restored, so no cell can read or write the real ~/.claude or ~/.codex.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  claudeDescriptor,
  codexDescriptor,
  detectPlatform,
  resolveHostWithReason,
} from '../../src/platform/platform.js'

const HOST_ENV = [
  'HARNESSED_ROOT_OVERRIDE',
  'HARNESSED_PLATFORM',
  'CLAUDE_CODE_SESSION_ID',
  'CODEX_SESSION_ID',
] as const

let home: string

/** Write a `.platform` pin at the given host's OWN stateRoot (never under an
 *  override — pins are read at the hosts' own roots, by design). */
function pinAt(host: 'claude' | 'codex', id: string): string {
  const root = (host === 'claude' ? claudeDescriptor(home) : codexDescriptor(home)).stateRoot
  mkdirSync(root, { recursive: true })
  const p = join(root, '.platform')
  writeFileSync(p, `${id}\n`, 'utf8')
  return p
}

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'harnessed-hostreason-'))
  for (const k of HOST_ENV) vi.stubEnv(k, undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

// ── Rule-by-rule ladder lock, asserted through the pre-existing public API ──

describe('detectPlatform ladder — the five rules + two fall-throughs (Phase 67 T3)', () => {
  it('rule 1: HARNESSED_PLATFORM names the host', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    expect(detectPlatform(home)).toEqual(codexDescriptor(home))
  })

  it('rule 2: exactly one session env names the host', () => {
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    expect(detectPlatform(home)).toEqual(codexDescriptor(home))
  })

  it('rule 3: `.platform` pin decides (codex stateRoot read before claude)', () => {
    pinAt('codex', 'codex')
    pinAt('claude', 'claude')
    expect(detectPlatform(home)).toEqual(codexDescriptor(home))
  })

  it('rule 4: directory probe, claude home wins as incumbent', () => {
    mkdirSync(join(home, '.claude'), { recursive: true })
    mkdirSync(join(home, '.codex'), { recursive: true })
    expect(detectPlatform(home)).toEqual(claudeDescriptor(home))
  })

  it('rule 4: directory probe picks codex when only its home exists', () => {
    mkdirSync(join(home, '.codex'), { recursive: true })
    expect(detectPlatform(home)).toEqual(codexDescriptor(home))
  })

  it('rule 5: nothing on disk, nothing in env → claude fallback', () => {
    expect(detectPlatform(home)).toEqual(claudeDescriptor(home))
  })

  it('fall-through: an unknown HARNESSED_PLATFORM value does not throw and does not decide', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'bogus')
    mkdirSync(join(home, '.codex'), { recursive: true })
    // falls past rule 1 all the way to the directory probe
    expect(detectPlatform(home)).toEqual(codexDescriptor(home))
  })

  it('fall-through: both session envs set is ambiguous and does not decide', () => {
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'a')
    vi.stubEnv('CODEX_SESSION_ID', 'b')
    pinAt('codex', 'codex')
    // nested launch → neither env wins; the pin decides
    expect(detectPlatform(home)).toEqual(codexDescriptor(home))
  })
})

// ── The new seam: same decisions, plus the rule that made them ──

describe('resolveHostWithReason — names the deciding rule (Phase 67 T3)', () => {
  it('rule 1 → env-platform, carrying the env var and its value', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(codexDescriptor(home))
    expect(r.reason).toEqual({ kind: 'env-platform', envVar: 'HARNESSED_PLATFORM', value: 'codex' })
    expect(r.skipped).toEqual([])
  })

  it('rule 2 → host-session-env, carrying which session env was set', () => {
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(codexDescriptor(home))
    expect(r.reason).toEqual({ kind: 'host-session-env', envVar: 'CODEX_SESSION_ID' })
  })

  it('rule 2 → claude side names CLAUDE_CODE_SESSION_ID', () => {
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'sess-1')
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(claudeDescriptor(home))
    expect(r.reason).toEqual({ kind: 'host-session-env', envVar: 'CLAUDE_CODE_SESSION_ID' })
  })

  it('rule 3 → platform-pin, carrying the pin path actually read and its content', () => {
    const codexPin = pinAt('codex', 'codex')
    pinAt('claude', 'claude')
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(codexDescriptor(home))
    // the codex stateRoot pin is read first — so it, not the claude one, is named
    expect(r.reason).toEqual({ kind: 'platform-pin', pinPath: codexPin, value: 'codex' })
  })

  it('rule 4 → directory-probe, carrying the directory whose existence decided', () => {
    mkdirSync(join(home, '.claude'), { recursive: true })
    mkdirSync(join(home, '.codex'), { recursive: true })
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(claudeDescriptor(home))
    expect(r.reason).toEqual({ kind: 'directory-probe', probedDir: join(home, '.claude') })
  })

  it('rule 4 → directory-probe names the codex home when that is what existed', () => {
    mkdirSync(join(home, '.codex'), { recursive: true })
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(codexDescriptor(home))
    expect(r.reason).toEqual({ kind: 'directory-probe', probedDir: join(home, '.codex') })
  })

  it('rule 5 → fallback', () => {
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(claudeDescriptor(home))
    expect(r.reason).toEqual({ kind: 'fallback' })
    expect(r.skipped).toEqual([])
  })

  it('records an attempted-and-rejected unknown HARNESSED_PLATFORM without letting it decide', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'bogus')
    mkdirSync(join(home, '.codex'), { recursive: true })
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(codexDescriptor(home))
    expect(r.reason).toEqual({ kind: 'directory-probe', probedDir: join(home, '.codex') })
    expect(r.skipped).toEqual([
      { kind: 'env-platform-unknown', envVar: 'HARNESSED_PLATFORM', value: 'bogus' },
    ])
  })

  it('records the ambiguous both-session-envs case without letting it decide', () => {
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'a')
    vi.stubEnv('CODEX_SESSION_ID', 'b')
    const codexPin = pinAt('codex', 'codex')
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(codexDescriptor(home))
    expect(r.reason).toEqual({ kind: 'platform-pin', pinPath: codexPin, value: 'codex' })
    expect(r.skipped).toEqual([{ kind: 'host-session-env-ambiguous' }])
  })

  it('records a pin that was read but named nothing known, then keeps descending', () => {
    const codexPin = pinAt('codex', 'vim')
    const claudePin = pinAt('claude', 'claude')
    const r = resolveHostWithReason(home)
    expect(r.descriptor).toEqual(claudeDescriptor(home))
    expect(r.reason).toEqual({ kind: 'platform-pin', pinPath: claudePin, value: 'claude' })
    expect(r.skipped).toEqual([{ kind: 'platform-pin-unknown', pinPath: codexPin, value: 'vim' }])
  })

  it('an ABSENT pin is not an attempted rule — the common path reports no skips', () => {
    mkdirSync(join(home, '.claude'), { recursive: true })
    expect(resolveHostWithReason(home).skipped).toEqual([])
  })

  // HARNESSED_ROOT_OVERRIDE is applied by detectPlatform AFTER resolution and only
  // to stateRoot. resolveHostWithReason is the resolution itself, so it reports the
  // host's own stateRoot — which is what a cross-root reader needs (an override in
  // effect must not make `adopt` believe the other host lives under it).
  it('does not apply HARNESSED_ROOT_OVERRIDE (that is detectPlatform, post-resolution)', () => {
    const ovr = join(home, 'ovr')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', ovr)
    mkdirSync(join(home, '.claude'), { recursive: true })
    expect(resolveHostWithReason(home).descriptor).toEqual(claudeDescriptor(home))
    expect(detectPlatform(home).stateRoot).toBe(ovr)
  })

  it('defaults `home` to homedir(), matching its sibling descriptor factories', () => {
    // Read-only on both sides (the pin branch catches ENOENT, the probe is
    // existsSync), so this cell cannot create anything in the real home.
    expect(resolveHostWithReason().descriptor).toEqual(resolveHostWithReason(homedir()).descriptor)
  })
})
