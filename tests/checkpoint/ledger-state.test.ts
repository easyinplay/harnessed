// v5.0 Spec 1 (ADR-0033) — Phase 4 integration tests for the sub-progress ledger
// read-modify-write wired through `src/checkpoint/state.ts`. Unlike the unit
// suites (`ledger.test.ts` pure fns, `state-lock.test.ts` mocked proper-lockfile),
// this suite exercises the REAL filesystem + REAL proper-lockfile under a per-test
// tmpdir, isolated via the supported `HARNESSED_ROOT_OVERRIDE` env var (sister
// pattern: tests/integration/phase-3.1-e2e.test.ts L35-60). It verifies that
// `mutateSubProgress` (single-lock RMW) correctly seeds, flips, and — critically —
// does not lost-update under concurrent calls (pre-v4 review C5).

import { mkdtempSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type GatesPlan, markSub, seedLedger } from '../../src/checkpoint/ledger.js'
import {
  activate,
  mutateSubProgress,
  readCurrentWorkflow,
  writeCurrentWorkflow,
} from '../../src/checkpoint/state.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// ---- tmpdir + HARNESSED_ROOT_OVERRIDE isolation -----------------------------
let tmp: string
let originalOverride: string | undefined

beforeEach(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'ledger-state-'))
  originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
  // withLock mkdir's the root, but pre-create so the very first read is clean.
  await mkdir(join(tmp, '.claude', 'harnessed'), { recursive: true })
})

afterEach(() => {
  if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
  rmSync(tmp, { recursive: true, force: true })
})

const PLAN: GatesPlan = {
  master: 'task',
  fire: [
    { sub: 'task-code', order: 1, mode: 'tdd' },
    { sub: 'task-review', order: 2 },
  ],
  skip: [{ sub: 'task-design', reason: 'trivial CRUD, known pattern' }],
}

describe('ledger ⇄ state RMW integration (v5.0 Spec 1 Phase 4 — real fs)', () => {
  it('1. activate + seedLedger → sub_progress seeded (fire→pending/gate_fired, skip→skipped/reason)', async () => {
    await activate('task')
    await mutateSubProgress(() => seedLedger(PLAN))

    const s = await readCurrentWorkflow()
    expect(s).not.toBeNull()
    if (!s) throw new Error('unreachable')
    expect(s.phase).toBe('task')
    expect(s.status).toBe('active')

    const sp = s.sub_progress
    expect(sp).toBeDefined()
    if (!sp) throw new Error('unreachable')
    expect(sp).toHaveLength(3)

    const code = sp.find((e) => e.sub === 'task-code')
    expect(code).toMatchObject({ status: 'pending', gate_fired: true })
    expect(code?.reason).toBeUndefined()

    const review = sp.find((e) => e.sub === 'task-review')
    expect(review).toMatchObject({ status: 'pending', gate_fired: true })

    const design = sp.find((e) => e.sub === 'task-design')
    expect(design).toMatchObject({
      status: 'skipped',
      gate_fired: false,
      reason: 'trivial CRUD, known pattern',
    })
  })

  it('2. markSub done + evidence + evidence_status → persisted via RMW', async () => {
    await activate('task')
    await mutateSubProgress(() => seedLedger(PLAN))

    const evidence = [{ path: 'src/foo.ts', sha256: 'abc123' }]
    await mutateSubProgress((e) =>
      markSub(e, 'task-code', 'done', { evidence, evidence_status: 'verified' }),
    )

    const s = await readCurrentWorkflow()
    const code = s?.sub_progress?.find((e) => e.sub === 'task-code')
    expect(code?.status).toBe('done')
    expect(code?.evidence).toEqual(evidence)
    expect(code?.evidence_status).toBe('verified')
    // other entries untouched
    expect(s?.sub_progress?.find((e) => e.sub === 'task-review')?.status).toBe('pending')
  })

  it('3. markSub failed → persisted via RMW', async () => {
    await activate('task')
    await mutateSubProgress(() => seedLedger(PLAN))

    await mutateSubProgress((e) => markSub(e, 'task-review', 'failed'))

    const s = await readCurrentWorkflow()
    expect(s?.sub_progress?.find((e) => e.sub === 'task-review')?.status).toBe('failed')
  })

  it('4. no active record → mutateSubProgress is a silent no-op (no throw, no file created)', async () => {
    // NOTE: no activate() first.
    await expect(mutateSubProgress(() => seedLedger(PLAN))).resolves.toBeUndefined()
    const s = await readCurrentWorkflow()
    expect(s).toBeNull()
  })

  it('5. concurrent mutateSubProgress does not lost-update (C5 single-lock RMW)', async () => {
    await activate('task')
    await mutateSubProgress(() => seedLedger(PLAN))

    // Two concurrent flips of DIFFERENT subs. A lost-update bug (locking only the
    // write, not the read) would drop one of them; the single-lock RMW must keep both.
    await Promise.all([
      mutateSubProgress((e) => markSub(e, 'task-code', 'done')),
      mutateSubProgress((e) => markSub(e, 'task-review', 'done')),
    ])

    const s = await readCurrentWorkflow()
    expect(s?.sub_progress?.find((e) => e.sub === 'task-code')?.status).toBe('done')
    expect(s?.sub_progress?.find((e) => e.sub === 'task-review')?.status).toBe('done')
  })

  it('6. regression — writeCurrentWorkflow / readCurrentWorkflow round-trip with NO sub_progress', async () => {
    const wf = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'legacy',
      status: 'active' as const,
      last_checkpoint_path: null,
      started_at: new Date().toISOString(),
    }
    await writeCurrentWorkflow(wf)

    const s = await readCurrentWorkflow()
    expect(s).not.toBeNull()
    expect(s?.phase).toBe('legacy')
    expect(s?.status).toBe('active')
    expect(s?.sub_progress).toBeUndefined()
  })
})
