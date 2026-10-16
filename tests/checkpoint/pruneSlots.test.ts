// v16.0 Phase 67 T7 (F10) — ledger slot pruning for `harnessed gc` and the shared
// staleness predicate adopt uses to ignore dead session slots.
//
// TDD: written RED (src/checkpoint/pruneSlots.ts absent), driven to GREEN.
//
// Data deletion, so every NEVER-delete rule has its own test. The ledger lives in a
// tmpdir reached ONLY through HARNESSED_ROOT_OVERRIDE; `nowMs` is injected so no
// test depends on the wall clock.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_STALE_MS,
  isStaleSessionSlot,
  pruneSlots,
} from '../../src/checkpoint/pruneSlots.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { repoKey, type WorkflowStoreV1Type } from '../../src/checkpoint/workflowStore.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const DAY = 86_400_000
const NOW = Date.parse('2026-10-16T00:00:00.000Z')
const ago = (ms: number): string => new Date(NOW - ms).toISOString()
const OLD = ago(40 * DAY)
const FRESH = ago(2 * DAY)
const PAST = new Date('2020-01-01T00:00:00.000Z')

let root: string
let repo: string
let base: string
let ledger: string

type Store = Omit<WorkflowStoreV1Type, 'schemaVersion'>

function slot(over: Partial<CurrentWorkflowV1Type> = {}): CurrentWorkflowV1Type {
  return {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'phase-1',
    status: 'complete',
    last_checkpoint_path: null,
    started_at: OLD,
    updated_at: OLD,
    ...over,
  }
}

function seed(store: Store): void {
  writeFileSync(
    ledger,
    JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.workflowStore, ...store }, null, 2),
    'utf8',
  )
  utimesSync(ledger, PAST, PAST)
}

const readLedger = (): WorkflowStoreV1Type => JSON.parse(readFileSync(ledger, 'utf8'))
const keysOf = (): string[] => Object.keys(readLedger().workflows).sort()
const run = (over: Parameters<typeof pruneSlots>[0] = {}) =>
  pruneSlots({ nowMs: NOW, olderThanMs: DEFAULT_STALE_MS, cwd: repo, ...over })

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'prune-root-')))
  repo = realpathSync(mkdtempSync(join(tmpdir(), 'prune-repo-')))
  mkdirSync(join(repo, '.git'))
  base = repoKey(repo)
  ledger = join(root, 'workflows.json')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', root)
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('CLAUDE_CODE_SESSION_ID', undefined)
  vi.stubEnv('CODEX_SESSION_ID', undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(root, { recursive: true, force: true })
  rmSync(repo, { recursive: true, force: true })
})

describe('pruneSlots — delete rules', () => {
  it('deletes a complete <repoKey>::<sid> slot older than the threshold', async () => {
    seed({ workflows: { [`${base}::old`]: slot(), [`${base}::new`]: slot({ updated_at: FRESH }) } })
    const r = await run()
    expect(r.pruned).toEqual([`${base}::old`])
    expect(keysOf()).toEqual([`${base}::new`])
    expect(r.keptCount).toBe(1)
  })

  it('applies to every repo in the ledger, not just the current one', async () => {
    seed({
      workflows: { '/other/repo::s1': slot(), '/other/repo::s2': slot({ updated_at: FRESH }) },
    })
    const r = await run()
    expect(r.pruned).toEqual(['/other/repo::s1'])
  })

  it('deletes archive keys regardless of status once old (displaced + premigrate)', async () => {
    seed({
      workflows: {
        [`${base}::displaced-2026-08-01T00:00:00.000Z`]: slot({ status: 'paused' }),
        [`${base}::premigrate-abc123`]: slot({ status: 'active' }),
      },
    })
    const r = await run()
    expect(r.pruned.sort()).toEqual(
      [`${base}::displaced-2026-08-01T00:00:00.000Z`, `${base}::premigrate-abc123`].sort(),
    )
    expect(keysOf()).toEqual([])
  })

  it('keeps FRESH archive keys', async () => {
    seed({ workflows: { [`${base}::displaced-x`]: slot({ updated_at: FRESH, status: 'paused' }) } })
    const r = await run()
    expect(r.pruned).toEqual([])
  })

  it('threshold boundary: age === threshold is pruned, 1 ms younger is kept', async () => {
    const t = 10 * DAY
    seed({
      workflows: {
        [`${base}::edge`]: slot({ updated_at: ago(t) }),
        [`${base}::inside`]: slot({ updated_at: ago(t - 1) }),
      },
    })
    const r = await run({ olderThanMs: t })
    expect(r.pruned).toEqual([`${base}::edge`])
  })

  it('timestamp fallback: updated_at, then completed_at, then started_at', async () => {
    const noUpdated = (over: Partial<CurrentWorkflowV1Type>) => {
      const s = slot(over)
      delete s.updated_at
      return s
    }
    seed({
      workflows: {
        // updated_at wins over an old started_at -> fresh -> kept
        [`${base}::a`]: slot({ updated_at: FRESH, started_at: OLD }),
        // no updated_at, old completed_at wins over a fresh started_at -> pruned
        [`${base}::b`]: noUpdated({ completed_at: OLD, started_at: FRESH }),
        // no updated_at / completed_at -> started_at -> old -> pruned
        [`${base}::c`]: noUpdated({ started_at: OLD }),
        // no updated_at / completed_at -> started_at -> fresh -> kept
        [`${base}::d`]: noUpdated({ started_at: FRESH }),
      },
    })
    const r = await run()
    expect(r.pruned.sort()).toEqual([`${base}::b`, `${base}::c`])
  })
})

describe('pruneSlots — NEVER-delete rules', () => {
  it('never deletes active or paused slots, however old', async () => {
    seed({
      workflows: {
        [`${base}::act`]: slot({ status: 'active', updated_at: ago(900 * DAY) }),
        [`${base}::pau`]: slot({ status: 'paused', updated_at: ago(900 * DAY) }),
      },
    })
    const r = await run()
    expect(r.pruned).toEqual([])
    expect(keysOf()).toEqual([`${base}::act`, `${base}::pau`])
  })

  it('never deletes a bare repoKey slot, even complete and ancient', async () => {
    seed({ workflows: { [base]: slot({ updated_at: ago(900 * DAY) }) } })
    const r = await run()
    expect(r.pruned).toEqual([])
    expect(keysOf()).toEqual([base])
  })

  it('never deletes the current session slot (activeKey), even complete and ancient', async () => {
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'mine')
    seed({
      workflows: {
        [`${base}::mine`]: slot({ updated_at: ago(900 * DAY) }),
        [`${base}::theirs`]: slot({ updated_at: ago(900 * DAY) }),
      },
    })
    const r = await run()
    expect(r.pruned).toEqual([`${base}::theirs`])
    expect(keysOf()).toEqual([`${base}::mine`])
  })

  it('keeps slots whose age cannot be determined (unparseable timestamps)', async () => {
    seed({
      workflows: {
        [`${base}::garbage`]: slot({ updated_at: 'not-a-date', started_at: OLD }),
        [`${base}::garbage2`]: slot({ updated_at: undefined, started_at: 'nope' }),
        [`${base}::displaced-garbage`]: slot({ updated_at: 'zzz', status: 'paused' }),
      },
    })
    const r = await run()
    expect(r.pruned).toEqual([])
    expect(keysOf()).toHaveLength(3)
  })

  it('leaves non-two-segment keys alone (three segments, empty session segment)', async () => {
    seed({
      workflows: {
        [`${base}::a::b`]: slot(),
        [`${base}::`]: slot(),
      },
    })
    const r = await run()
    expect(r.pruned).toEqual([])
  })
})

describe('pruneSlots — sidecar cascade', () => {
  it('drops retro_meta/intents ONLY under pruned composite keys', async () => {
    seed({
      workflows: {
        [`${base}::old`]: slot(),
        [`${base}::new`]: slot({ updated_at: FRESH }),
        [base]: slot({ updated_at: ago(900 * DAY) }),
      },
      retro_meta: {
        [base]: { phases_since_retro: 3 },
        [`${base}::old`]: { phases_since_retro: 1 },
        [`${base}::new`]: { phases_since_retro: 2 },
      },
      intents: {
        [base]: { master: 'auto', ts: OLD },
        [`${base}::old`]: { master: 'auto', ts: OLD },
        [`${base}::new`]: { master: 'auto', ts: FRESH },
      },
    })
    await run()
    const after = readLedger()
    expect(Object.keys(after.retro_meta ?? {}).sort()).toEqual([base, `${base}::new`].sort())
    expect(Object.keys(after.intents ?? {}).sort()).toEqual([base, `${base}::new`].sort())
  })

  it('does not touch a bare-keyed retro_meta when nothing is pruned', async () => {
    seed({
      workflows: { [base]: slot({ updated_at: ago(900 * DAY) }) },
      retro_meta: { [base]: { phases_since_retro: 7 } },
    })
    const r = await run()
    expect(r.pruned).toEqual([])
    expect(readLedger().retro_meta).toEqual({ [base]: { phases_since_retro: 7 } })
  })
})

describe('pruneSlots — write discipline', () => {
  it('preserves schemaVersion and every kept slot verbatim', async () => {
    const keep = slot({ status: 'active', phase: 'keep-me', updated_at: OLD })
    seed({ workflows: { [`${base}::old`]: slot(), [`${base}::keep`]: keep } })
    await run()
    const after = readLedger()
    expect(after.schemaVersion).toBe(SCHEMA_VERSIONS.workflowStore)
    expect(after.workflows[`${base}::keep`]).toEqual(keep)
  })

  it('--dry-run reports the plan, writes nothing, and takes no lock', async () => {
    seed({ workflows: { [`${base}::old`]: slot() } })
    const bytesBefore = readFileSync(ledger, 'utf8')
    const mtimeBefore = statSync(ledger).mtimeMs
    const dirBefore = readdirSync(root).sort()
    const r = await run({ dryRun: true })
    expect(r.pruned).toEqual([`${base}::old`])
    expect(r.dryRun).toBe(true)
    expect(readFileSync(ledger, 'utf8')).toBe(bytesBefore)
    expect(statSync(ledger).mtimeMs).toBe(mtimeBefore)
    // withLock mkdirs/creates a lock artifact next to the ledger; dry-run must not.
    expect(readdirSync(root).sort()).toEqual(dirBefore)
  })

  it('no-op fast path: nothing qualifies -> file untouched (mtime frozen)', async () => {
    seed({ workflows: { [`${base}::new`]: slot({ updated_at: FRESH }) } })
    const mtimeBefore = statSync(ledger).mtimeMs
    const r = await run()
    expect(r.pruned).toEqual([])
    expect(statSync(ledger).mtimeMs).toBe(mtimeBefore)
  })

  it('idempotent: the second run prunes nothing and does not write', async () => {
    seed({ workflows: { [`${base}::old`]: slot(), [`${base}::new`]: slot({ updated_at: FRESH }) } })
    await run()
    utimesSync(ledger, PAST, PAST)
    const bytes = readFileSync(ledger, 'utf8')
    const mtime = statSync(ledger).mtimeMs
    const again = await run()
    expect(again.pruned).toEqual([])
    expect(readFileSync(ledger, 'utf8')).toBe(bytes)
    expect(statSync(ledger).mtimeMs).toBe(mtime)
  })

  it('missing ledger -> empty result, no file created', async () => {
    const r = await run()
    expect(r.pruned).toEqual([])
    expect(existsSync(ledger)).toBe(false)
  })

  it('re-evaluates INSIDE the lock: a slot refreshed after planning is kept (TOCTOU)', async () => {
    seed({
      workflows: {
        [`${base}::raced`]: slot(),
        [`${base}::stale`]: slot(),
      },
    })
    const r = await run({
      // Test seam: runs between the lock-free plan and the locked write — a
      // concurrent session touching its slot lands exactly here.
      onPlanned: (plan) => {
        expect(plan.sort()).toEqual([`${base}::raced`, `${base}::stale`])
        seed({
          workflows: {
            [`${base}::raced`]: slot({ updated_at: FRESH }),
            [`${base}::stale`]: slot(),
          },
        })
      },
    })
    expect(r.pruned).toEqual([`${base}::stale`])
    expect(keysOf()).toEqual([`${base}::raced`])
  })
})

describe('isStaleSessionSlot — the predicate adopt shares', () => {
  const k = '/r'
  it('true only for complete, old, two-segment session slots', () => {
    expect(isStaleSessionSlot(`${k}::s`, slot(), NOW, DEFAULT_STALE_MS)).toBe(true)
  })
  it('false for fresh, active, paused, bare, archive, undeterminable', () => {
    const t = (key: string, s: CurrentWorkflowV1Type) =>
      isStaleSessionSlot(key, s, NOW, DEFAULT_STALE_MS)
    expect(t(`${k}::s`, slot({ updated_at: FRESH }))).toBe(false)
    expect(t(`${k}::s`, slot({ status: 'active' }))).toBe(false)
    expect(t(`${k}::s`, slot({ status: 'paused' }))).toBe(false)
    expect(t(k, slot())).toBe(false)
    expect(t(`${k}::displaced-x`, slot())).toBe(false)
    expect(t(`${k}::premigrate-x`, slot())).toBe(false)
    expect(t(`${k}::s`, slot({ updated_at: 'bad' }))).toBe(false)
  })
  it('DEFAULT_STALE_MS is 30 days', () => {
    expect(DEFAULT_STALE_MS).toBe(30 * DAY)
  })
})
