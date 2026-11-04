// Phase 84 / T2 — auto-update status file contract (R12, AC6, AC8).
// Real fs in a tmpdir; no network.

import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type AutoUpdateResult,
  type AutoUpdateStatus,
  appendAutoUpdateHistory,
  formatAutoUpdateStatus,
  hasResumableAutoUpdateWork,
  readAutoUpdateStatus,
  writeAutoUpdateStatus,
} from '../../../src/cli/lib/autoUpdateStatus.js'

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'autoupdate-status-'))
}

function baseStatus(overrides: Partial<AutoUpdateStatus> = {}): AutoUpdateStatus {
  return {
    schemaVersion: 1,
    consent: { autoUpdate: false, enabled: true },
    channel: 'binary',
    installed: '5.0.12',
    latest: '5.0.13',
    state: 'idle',
    progress: { received: 0, total: 0, updatedAt: 0 },
    lastResult: null,
    history: [],
    notice: null,
    ...overrides,
  }
}

function result(version: string, at: number): AutoUpdateResult {
  return { version, status: 'failed', reason: 'integrity', at }
}

describe('readAutoUpdateStatus', () => {
  it('missing file → null', () => {
    const dir = tmpDir()
    expect(readAutoUpdateStatus(join(dir, 'auto-update-status.json'))).toBe(null)
  })

  it('corrupt JSON → null', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    writeFileSync(path, '{not json')
    expect(readAutoUpdateStatus(path)).toBe(null)
  })

  it('wrong schemaVersion → null', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    writeFileSync(path, JSON.stringify({ ...baseStatus(), schemaVersion: 2 }))
    expect(readAutoUpdateStatus(path)).toBe(null)
  })

  it('wrong field types → null', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    const broken = {
      ...baseStatus(),
      state: 'nope',
      progress: { received: 'x', total: 0, updatedAt: 0 },
    }
    writeFileSync(path, JSON.stringify(broken))
    expect(readAutoUpdateStatus(path)).toBe(null)
  })

  it('non-finite number → null', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    // 1e999 parses to Infinity — JSON has no NaN/Infinity literal.
    const broken = JSON.stringify(baseStatus()).replace('"updatedAt":0', '"updatedAt":1e999')
    writeFileSync(path, broken)
    expect(readAutoUpdateStatus(path)).toBe(null)
  })

  it('valid file → parsed value', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    const status = baseStatus({ state: 'downloading', latest: '5.0.13' })
    writeFileSync(path, JSON.stringify(status))
    expect(readAutoUpdateStatus(path)).toEqual(status)
  })
})

describe('writeAutoUpdateStatus', () => {
  it('writes and can be read back', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    const status = baseStatus({ state: 'failed', lastResult: result('5.0.13', 1_000) })
    writeAutoUpdateStatus(path, status)
    expect(readAutoUpdateStatus(path)).toEqual(status)
  })

  it('creates the parent directory when missing', () => {
    const dir = tmpDir()
    const path = join(dir, 'nested', 'deeper', 'auto-update-status.json')
    writeAutoUpdateStatus(path, baseStatus())
    expect(readAutoUpdateStatus(path)).not.toBe(null)
  })

  it('leaves no temp file behind', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    writeAutoUpdateStatus(path, baseStatus())
    expect(readdirSync(dir)).toEqual(['auto-update-status.json'])
  })

  it('overwrites an existing status file', () => {
    const dir = tmpDir()
    const path = join(dir, 'auto-update-status.json')
    writeAutoUpdateStatus(path, baseStatus({ state: 'downloading' }))
    writeAutoUpdateStatus(path, baseStatus({ state: 'updated' }))
    expect(readAutoUpdateStatus(path)?.state).toBe('updated')
    expect(readdirSync(dir)).toEqual(['auto-update-status.json'])
  })
})

describe('appendAutoUpdateHistory', () => {
  it('12 appends → keeps the newest 10 in order', () => {
    let status = baseStatus()
    for (let i = 0; i < 12; i++) status = appendAutoUpdateHistory(status, result(`5.0.${i}`, i))
    expect(status.history).toHaveLength(10)
    expect(status.history.map((entry) => entry.version)).toEqual([
      '5.0.2',
      '5.0.3',
      '5.0.4',
      '5.0.5',
      '5.0.6',
      '5.0.7',
      '5.0.8',
      '5.0.9',
      '5.0.10',
      '5.0.11',
    ])
  })

  it('does not mutate the input status', () => {
    const input = baseStatus()
    const output = appendAutoUpdateHistory(input, result('5.0.1', 1))
    expect(input.history).toHaveLength(0)
    expect(input.lastResult).toBe(null)
    expect(output).not.toBe(input)
    expect(output.history).not.toBe(input.history)
  })

  it('sets lastResult to the appended entry', () => {
    const entry = result('5.0.9', 42)
    const output = appendAutoUpdateHistory(baseStatus(), entry)
    expect(output.lastResult).toEqual(entry)
  })
})

describe('hasResumableAutoUpdateWork', () => {
  it('a resumable failure in the history → true', () => {
    const status = baseStatus({
      state: 'failed',
      lastResult: {
        version: '5.0.13',
        status: 'failed',
        reason: 'network',
        message: '[resumable] transfer stalled after 120s',
        at: 1_000_000_000_000,
      },
    })
    expect(hasResumableAutoUpdateWork(status)).toBe(true)
  })

  it('a complete failure → false', () => {
    const status = baseStatus({
      state: 'failed',
      lastResult: {
        version: '5.0.13',
        status: 'failed',
        reason: 'integrity',
        message: 'sha256 mismatch',
        at: 1_000_000_000_000,
      },
    })
    expect(hasResumableAutoUpdateWork(status)).toBe(false)
  })

  it('an interrupted round with bytes on disk → true', () => {
    const status = baseStatus({
      state: 'downloading',
      progress: { received: 4096, total: 100_000, updatedAt: 1_000_000_000_000 },
    })
    expect(hasResumableAutoUpdateWork(status)).toBe(true)
  })

  it('an interrupted round with zero bytes → false', () => {
    const status = baseStatus({
      state: 'downloading',
      progress: { received: 0, total: 100_000, updatedAt: 1_000_000_000_000 },
    })
    expect(hasResumableAutoUpdateWork(status)).toBe(false)
  })

  it('a stale in-progress state is still resumable (the fragment outlives the clock)', () => {
    const status = baseStatus({
      state: 'downloading',
      progress: { received: 4096, total: 100_000, updatedAt: 1_000_000_000_000 - 86_400_000 },
    })
    expect(hasResumableAutoUpdateWork(status)).toBe(true)
  })

  it('idle / null → false', () => {
    expect(hasResumableAutoUpdateWork(baseStatus())).toBe(false)
    expect(hasResumableAutoUpdateWork(null)).toBe(false)
  })
})

describe('formatAutoUpdateStatus', () => {
  it('renders the exact 3-line contract output', () => {
    const status = baseStatus({
      state: 'downloading',
      progress: { received: 44_145_050, total: 103_809_024, updatedAt: 1_000 },
      lastResult: {
        version: '5.0.13',
        status: 'failed',
        reason: 'integrity',
        at: Date.parse('2026-11-04T03:12:00Z'),
      },
    })
    expect(formatAutoUpdateStatus(status, 2_000)).toBe(
      [
        'auto-update: off',
        'installed: 5.0.12   latest: 5.0.13   state: downloading (42.1 MB / 99.0 MB)',
        'last: failed 5.0.13 (integrity) at 2026-11-04T03:12:00Z',
      ].join('\n'),
    )
  })

  it('null status → exactly two lines', () => {
    expect(formatAutoUpdateStatus(null, 2_000)).toBe(
      ['auto-update: off', 'installed: unknown   latest: unknown   state: idle'].join('\n'),
    )
  })

  it('names the binary-channel requirement on the npm channel (D3)', () => {
    const status = baseStatus({
      state: 'skipped',
      lastResult: {
        version: '5.0.13',
        status: 'skipped',
        reason: 'npm-channel',
        at: Date.parse('2026-11-04T03:12:00Z'),
      },
    })
    expect(formatAutoUpdateStatus(status, 2_000)).toContain(
      'last: skipped 5.0.13 (npm channel — auto-update needs the binary channel) at 2026-11-04T03:12:00Z',
    )
  })

  it('no lastResult → exactly two lines', () => {
    expect(formatAutoUpdateStatus(baseStatus(), 2_000)).toBe(
      ['auto-update: off', 'installed: 5.0.12   latest: 5.0.13   state: idle'].join('\n'),
    )
  })

  it('consent on → line 1 says on', () => {
    const status = baseStatus({ consent: { autoUpdate: true, enabled: true } })
    expect(formatAutoUpdateStatus(status, 2_000).split('\n')[0]).toBe('auto-update: on')
  })

  it('unknown latest → "unknown"; no progress → no size suffix', () => {
    const status = baseStatus({ latest: null })
    expect(formatAutoUpdateStatus(status, 2_000).split('\n')[1]).toBe(
      'installed: 5.0.12   latest: unknown   state: idle',
    )
  })

  it('lastResult without reason → (ok)', () => {
    const status = baseStatus({
      lastResult: { version: '5.0.13', status: 'updated', at: Date.parse('2026-11-04T03:12:00Z') },
    })
    expect(formatAutoUpdateStatus(status, 2_000).split('\n')[2]).toBe(
      'last: updated 5.0.13 (ok) at 2026-11-04T03:12:00Z',
    )
  })
})
