// Phase 84 / T6 — the "you were updated" notice (D11 / R16 / R25).
//
// The notice is the user-facing half of the auto-update: the new binary
// writes it into the status file during the handover, and the SessionStart
// hook of the NEXT session prints it — exactly once.
//
// Covered here:
//   - the human text carries the version change, the changelog excerpt and
//     the restart hint (and the codex trust hint),
//   - a half-written notice (`to` empty) is never printable (R25),
//   - consuming stamps `consumedAt` and a second consume is a no-op (R16),
//   - the consume keeps every field the worker owns (progress / lastResult /
//     history) — R16's merge contract.

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  consumeAutoUpdateNotice,
  formatAutoUpdateNotice,
  isPrintableAutoUpdateNotice,
  readAutoUpdateNotice,
  writeAutoUpdateNotice,
} from '../../../src/cli/lib/autoUpdateNotice.js'

const NOTICE = {
  from: '5.0.12',
  to: '5.0.13',
  changelog: '## [5.0.13] - 2026-11-04\n\n### Added\n\n- the auto-update notice.',
  restart: 'Claude Code',
  at: 1_800_000_000_000,
  consumedAt: 0,
}

/** A status file shaped like the one the worker leaves behind. */
function writeStatus(notice: unknown, extra: Record<string, unknown> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'auto-update-notice-'))
  const path = join(dir, 'auto-update-status.json')
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        consent: { autoUpdate: true, enabled: true },
        channel: 'binary',
        installed: '5.0.12',
        latest: '5.0.13',
        state: 'updated',
        progress: { received: 42, total: 99, updatedAt: 1_800_000_000_000 },
        lastResult: { version: '5.0.13', status: 'updated', at: 1_800_000_000_000 },
        history: [{ version: '5.0.13', status: 'updated', at: 1_800_000_000_000 }],
        notice,
        ...extra,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  return path
}

function readStatus(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

describe('readAutoUpdateNotice', () => {
  it('returns the notice of the status file', () => {
    const path = writeStatus(NOTICE)
    expect(readAutoUpdateNotice(path)).toEqual(NOTICE)
  })

  it('returns null for a missing or malformed status file', () => {
    expect(readAutoUpdateNotice(join(tmpdir(), 'does-not-exist-auto-update.json'))).toBeNull()
    const dir = mkdtempSync(join(tmpdir(), 'auto-update-broken-'))
    const path = join(dir, 'auto-update-status.json')
    writeFileSync(path, '{not json', 'utf8')
    expect(readAutoUpdateNotice(path)).toBeNull()
  })

  it('treats a missing consumedAt as "never printed" (older writers)', () => {
    const { consumedAt: _dropped, ...withoutConsumedAt } = NOTICE
    const path = writeStatus(withoutConsumedAt)
    expect(readAutoUpdateNotice(path)?.consumedAt).toBe(0)
  })
})

describe('formatAutoUpdateNotice', () => {
  it('carries the version change, the changelog excerpt and the restart hint', () => {
    const text = formatAutoUpdateNotice(NOTICE)
    expect(text).toContain('harnessed updated 5.0.12 -> 5.0.13.')
    expect(text).toContain('the auto-update notice.')
    expect(text).toContain('Restart Claude Code so the new version + hooks take effect.')
  })

  it('omits an empty changelog excerpt', () => {
    const text = formatAutoUpdateNotice({ ...NOTICE, changelog: '' })
    expect(text).toContain('harnessed updated 5.0.12 -> 5.0.13.')
    expect(text).not.toContain('## [')
  })

  it('adds the trust hint for codex (the hook re-registration needs approval)', () => {
    const text = formatAutoUpdateNotice({ ...NOTICE, restart: 'Codex' })
    expect(text).toContain('Restart Codex so the new version + hooks take effect.')
    expect(text.toLowerCase()).toContain('trust')
  })
})

describe('printability', () => {
  it('a complete, unconsumed notice is printable', () => {
    expect(isPrintableAutoUpdateNotice(readAutoUpdateNotice(writeStatus(NOTICE)))).toBe(true)
  })

  it('a half-written notice (empty `to`) is never printable but stays a diagnostic', () => {
    const path = writeStatus({ ...NOTICE, to: '' })
    const notice = readAutoUpdateNotice(path)
    expect(notice).not.toBeNull()
    expect(isPrintableAutoUpdateNotice(notice)).toBe(false)
  })

  it('a consumed notice is not printable any more', () => {
    const path = writeStatus({ ...NOTICE, consumedAt: 1_800_000_000_001 })
    expect(isPrintableAutoUpdateNotice(readAutoUpdateNotice(path))).toBe(false)
  })
})

describe('consumeAutoUpdateNotice', () => {
  it('stamps consumedAt and a second consume is a no-op', () => {
    const path = writeStatus(NOTICE)
    expect(consumeAutoUpdateNotice(path, 1_800_000_000_500)).toBe(true)
    const after = readStatus(path) as { notice: { consumedAt: number } }
    expect(after.notice.consumedAt).toBe(1_800_000_000_500)
    expect(consumeAutoUpdateNotice(path, 1_800_000_000_600)).toBe(false)
    const again = readStatus(path) as { notice: { consumedAt: number } }
    expect(again.notice.consumedAt).toBe(1_800_000_000_500)
  })

  it('keeps the fields the worker owns (progress / lastResult / history)', () => {
    const path = writeStatus(NOTICE)
    expect(consumeAutoUpdateNotice(path, 1_800_000_000_500)).toBe(true)
    const after = readStatus(path)
    expect(after.progress).toEqual({ received: 42, total: 99, updatedAt: 1_800_000_000_000 })
    expect(after.lastResult).toEqual({
      version: '5.0.13',
      status: 'updated',
      at: 1_800_000_000_000,
    })
    expect(after.history).toHaveLength(1)
    expect(after.state).toBe('updated')
  })

  it('is a no-op without a notice', () => {
    const path = writeStatus(null)
    expect(consumeAutoUpdateNotice(path, 1_800_000_000_500)).toBe(false)
  })
})

describe('writeAutoUpdateNotice', () => {
  it('merges the notice into the status file without dropping the worker fields', () => {
    const path = writeStatus(null)
    expect(writeAutoUpdateNotice(path, { ...NOTICE, consumedAt: 0 })).toBe(true)
    const after = readStatus(path)
    expect((after.notice as typeof NOTICE).to).toBe('5.0.13')
    expect(after.progress).toEqual({ received: 42, total: 99, updatedAt: 1_800_000_000_000 })
  })

  it('never throws when the status file cannot be written', () => {
    const dir = mkdtempSync(join(tmpdir(), 'auto-update-ro-'))
    const path = join(dir, 'auto-update-status.json')
    // A directory in place of the file → the atomic rename cannot succeed.
    mkdtempSync(path)
    expect(writeAutoUpdateNotice(path, { ...NOTICE })).toBe(false)
  })
})
