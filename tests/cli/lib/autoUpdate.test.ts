// Phase 84 T5 — the auto-update ORCHESTRATION.
//
// The whole decision tree runs on fake dependencies: no network, no real
// binary, no filesystem outside a tmpdir. What is under test is the ORDER of
// the decisions (the contract in CONTEXT.md R1/R2/R5/R6/R7) and the records
// the orchestration leaves behind:
//
//   AC1  consent off   → no self-update AND no status file
//   AC5  npm channel   → skipped + npm-channel
//   AC9  lock busy     → skipped + busy
//   AC4  integrity     → failed + integrity, and the next round is blocked
//   R5   a resumable failure → the 24 h quota is NOT consumed
//   AC10 critical      → swap-critical + the consent is turned off
//
// Plus the two ordering rules that are easy to get wrong: the writability
// pre-flight runs BEFORE the lock (the lock anchor lives in the same
// directory), and the lock target is the exec path.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type AutoUpdateDeps,
  type AutoUpdateSelfUpdateOutcome,
  runAutoUpdate,
} from '../../../src/cli/lib/autoUpdate.js'
import { readAutoUpdateStatus } from '../../../src/cli/lib/autoUpdateStatus.js'
import { readUpdateReminderPreferencesFile } from '../../../src/cli/lib/updateReminderPreferences.js'
import type { HostInstallContext } from '../../../src/platform/hostInstallContext.js'

const INSTALLED = '5.0.12'
const LATEST = '5.0.13'
const NOW = 1_800_000_000_000

interface HarnessOptions {
  autoUpdate?: boolean
  schemaVersion?: number | null
  channel?: 'binary' | 'npm' | 'bun' | 'node'
  writable?: boolean
  busy?: boolean
  outcome?: AutoUpdateSelfUpdateOutcome
  handover?: { ok: boolean; error?: string }
  now?: number
}

function createHarness(options: HarnessOptions = {}) {
  const root = mkdtempSync(join(tmpdir(), 'harnessed-auto-update-'))
  const statusPath = join(root, 'auto-update-status.json')
  const preferencesPath = join(root, 'update-reminder-preferences.json')
  const consent = options.autoUpdate ?? true
  const schemaVersion = options.schemaVersion === undefined ? 1 : options.schemaVersion
  writeFileSync(
    preferencesPath,
    JSON.stringify({ schemaVersion, enabled: true, autoUpdate: consent }),
    'utf8',
  )
  const calls = {
    selfUpdate: 0,
    handover: [] as Array<{ from: string; to: string; statusPath: string }>,
    lockTargets: [] as string[],
    lockStateRoots: [] as string[],
  }
  let now = options.now ?? NOW
  const outcome: AutoUpdateSelfUpdateOutcome = options.outcome ?? {
    status: 'updated',
    from: INSTALLED,
    to: LATEST,
  }
  const deps: AutoUpdateDeps = {
    // The REAL consent reader: the consent semantics (missing file, corrupt
    // file, unknown schema version) are part of what is under test.
    readPreferences: () => {
      const { preferences, document } = readUpdateReminderPreferencesFile(preferencesPath)
      const version = typeof document?.schemaVersion === 'number' ? document.schemaVersion : null
      return { ...preferences, schemaVersion: version }
    },
    channel: () => options.channel ?? 'binary',
    installedVersion: () => INSTALLED,
    context: () => ({ platform: { stateRoot: root } }) as unknown as HostInstallContext,
    target: () => join(root, 'harnessed.exe'),
    execDirWritable: () => options.writable ?? true,
    withLock: async <T>(input: { stateRoot: string; target: string }, work: () => Promise<T>) => {
      calls.lockTargets.push(input.target)
      calls.lockStateRoots.push(input.stateRoot)
      if (options.busy) return { status: 'busy' as const }
      return { status: 'completed' as const, value: await work() }
    },
    selfUpdate: async () => {
      calls.selfUpdate += 1
      return outcome
    },
    handover: async (input) => {
      calls.handover.push(input)
      return options.handover ?? { ok: true }
    },
    statusPath: () => statusPath,
    readStatus: () => readAutoUpdateStatus(statusPath),
    writeStatus: (status) => {
      writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8')
    },
    preferencesPath: () => preferencesPath,
    now: () => now,
    log: () => {},
  }
  return {
    deps,
    calls,
    statusPath,
    preferencesPath,
    root,
    setNow: (value: number) => {
      now = value
    },
  }
}

describe('runAutoUpdate', () => {
  it('AC1: consent off → no self-update and NO status file is written', async () => {
    const harness = createHarness({ autoUpdate: false })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'skipped', reason: 'consent-off' })
    expect(harness.calls.selfUpdate).toBe(0)
    expect(existsSync(harness.statusPath)).toBe(false)
  })

  it('an UNKNOWN schema version is fail-closed: no self-update and no status file', async () => {
    const harness = createHarness({ schemaVersion: 2 })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'skipped', reason: 'consent-off' })
    expect(harness.calls.selfUpdate).toBe(0)
    expect(existsSync(harness.statusPath)).toBe(false)
  })

  it('a MISSING preferences file is fail-closed', async () => {
    const harness = createHarness()
    rmSync(harness.preferencesPath, { force: true })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'skipped', reason: 'consent-off' })
    expect(harness.calls.selfUpdate).toBe(0)
  })

  it('AC5: the npm channel never self-replaces and records skipped/npm-channel', async () => {
    const harness = createHarness({ channel: 'npm' })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'skipped', reason: 'npm-channel' })
    expect(harness.calls.selfUpdate).toBe(0)
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({ status: 'skipped', reason: 'npm-channel' })
  })

  it('AC9: a busy lock skips the round without downloading', async () => {
    const harness = createHarness({ busy: true })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'skipped', reason: 'busy' })
    expect(harness.calls.selfUpdate).toBe(0)
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({ status: 'skipped', reason: 'busy' })
  })

  it('R6: a read-only exec directory stops BEFORE the lock and records it', async () => {
    const harness = createHarness({ writable: false })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'error', reason: 'exec-dir-readonly' })
    expect(harness.calls.lockTargets).toEqual([])
    expect(harness.calls.selfUpdate).toBe(0)
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({ status: 'failed', reason: 'exec-dir-readonly' })
  })

  it('R1: the lock is taken with the exec path as its target', async () => {
    const harness = createHarness()

    await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(harness.calls.lockTargets).toEqual([join(harness.root, 'harnessed.exe')])
    expect(harness.calls.lockStateRoots).toEqual([harness.root])
  })

  it('AC4: an integrity failure is recorded and blocks the next round for 24h', async () => {
    const harness = createHarness({
      outcome: { status: 'error', message: 'integrity verification failed: sha256 mismatch' },
    })

    const first = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(first).toMatchObject({ status: 'error', reason: 'integrity' })
    expect(harness.calls.selfUpdate).toBe(1)
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({
      status: 'failed',
      reason: 'integrity',
      version: LATEST,
    })

    const second = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(second).toMatchObject({ status: 'skipped', reason: 'rate-limited' })
    expect(harness.calls.selfUpdate).toBe(1)
  })

  it('AC4: the quota is per version — a different target version is not blocked', async () => {
    const harness = createHarness({
      outcome: { status: 'error', message: 'integrity verification failed: sha256 mismatch' },
    })

    await runAutoUpdate(harness.deps, { targetVersion: LATEST })
    const other = await runAutoUpdate(harness.deps, { targetVersion: '5.0.14' })

    expect(other.status).not.toBe('skipped')
    expect(harness.calls.selfUpdate).toBe(2)
  })

  it('R5: a failure that carries download progress does NOT consume the quota', async () => {
    const harness = createHarness({
      outcome: {
        status: 'error',
        message:
          'download failed: the download stalled — no data for 120 s (1048576 bytes received)',
        progressed: true,
      },
    })

    const first = await runAutoUpdate(harness.deps, { targetVersion: LATEST })
    expect(first).toMatchObject({ status: 'error', reason: 'network' })
    expect(harness.calls.selfUpdate).toBe(1)

    const second = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(second.status).not.toBe('skipped')
    expect(harness.calls.selfUpdate).toBe(2)
  })

  it('AC10: a CRITICAL failure is recorded and the auto-update consent is turned off', async () => {
    const harness = createHarness({
      outcome: {
        status: 'error',
        message: 'CRITICAL: swap failed AND rollback failed. Restore manually: copy "a" "b"',
        critical: true,
      },
    })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'error', reason: 'swap-critical' })
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({ status: 'failed', reason: 'swap-critical' })
    expect(status?.lastResult?.message).toContain('Restore manually')

    const preferences = JSON.parse(readFileSync(harness.preferencesPath, 'utf8'))
    expect(preferences.autoUpdate).toBe(false)
    // the other keys survive the read-modify-write
    expect(preferences.enabled).toBe(true)
    expect(preferences.schemaVersion).toBe(1)
  })

  it('records a successful update and hands over to the new binary', async () => {
    const harness = createHarness()

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'updated', version: LATEST })
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({ status: 'updated', version: LATEST })
    // The notice stays PENDING: `to` (and the changelog, and the restart
    // hint) are filled in by the handover — the hook must not print a
    // half-written notice.
    expect(status?.notice).toMatchObject({ from: INSTALLED, to: '', changelog: '', restart: '' })
    expect(harness.calls.handover).toEqual([
      { from: INSTALLED, to: LATEST, statusPath: harness.statusPath },
    ])
  })

  it('a failed handover keeps the update recorded and reports the handover', async () => {
    const harness = createHarness({
      handover: { ok: false, error: 'the owned refresh exited with code 1' },
    })

    const outcome = await runAutoUpdate(harness.deps, { targetVersion: LATEST })

    expect(outcome).toMatchObject({ status: 'updated', reason: 'handover' })
    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.lastResult).toMatchObject({ status: 'updated', reason: 'handover' })
    expect(status?.history.some((entry) => entry.status === 'updated')).toBe(true)
  })

  it('AC8: the history keeps only the newest 10 entries', async () => {
    const harness = createHarness({
      outcome: { status: 'error', message: 'integrity verification failed: sha256 mismatch' },
    })

    for (let attempt = 0; attempt < 12; attempt++) {
      harness.setNow(NOW + attempt * 60_000)
      // A fresh version per round: the quota is keyed by version, so each
      // round is a real attempt.
      await runAutoUpdate(harness.deps, { targetVersion: `5.1.${attempt}` })
    }

    const status = readAutoUpdateStatus(harness.statusPath)
    expect(status?.history).toHaveLength(10)
    expect(status?.history[0]?.version).toBe('5.1.2')
    expect(status?.history[9]?.version).toBe('5.1.11')
  })
})
