import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  expandNestedMaster,
  findSerialBlockers,
  type GatesPlan,
  nextPending,
} from '../../src/checkpoint/ledger.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { readCurrentWorkflow, writeCurrentWorkflow } from '../../src/checkpoint/state.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const rootLedger = (): SubProgressEntryType[] => [
  { sub: 'discuss', status: 'done', gate_fired: true, mode: 'serial', order: 1 },
  { sub: 'plan', status: 'pending', gate_fired: true, mode: 'serial', order: 2 },
  { sub: 'task', status: 'pending', gate_fired: true, mode: 'serial', order: 3 },
]

const plan: GatesPlan = {
  master: 'plan',
  fire: [
    { sub: 'architecture', mode: 'serial', order: 1 },
    { sub: 'phase', mode: 'serial', order: 2 },
  ],
  skip: [{ sub: 'spec', reason: 'not required' }],
}

describe('expandNestedMaster — issue #22', () => {
  it('replaces the pending parent in place while preserving root siblings', () => {
    const result = expandNestedMaster(rootLedger(), 'plan', plan)

    expect(result.matched).toBe(true)
    expect(result.entries.map((entry) => entry.sub)).toEqual([
      'discuss',
      'architecture',
      'phase',
      'spec',
      'task',
    ])
    expect(result.entries.find((entry) => entry.sub === 'plan')).toBeUndefined()
    expect(result.entries[0]).toEqual(rootLedger()[0])
    expect(result.entries.at(-1)).toEqual({ ...rootLedger().at(-1), order: 5 })
  })

  it('renumbers the expanded ledger with stable integer sequence positions', () => {
    const result = expandNestedMaster(rootLedger(), 'plan', plan)

    expect(result.entries.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5])
    expect(findSerialBlockers(result.entries, 'task')).toEqual(['architecture', 'phase'])
  })

  it('keeps array order and integer order aligned across parallel work and a serial tail', () => {
    const entries: SubProgressEntryType[] = [
      { sub: 'head', status: 'done', gate_fired: true, mode: 'serial', order: 1 },
      { sub: 'plan', status: 'pending', gate_fired: true, mode: 'serial', order: 2 },
      { sub: 'tail', status: 'pending', gate_fired: true, mode: 'serial', order: 99 },
      { sub: 'review', status: 'pending', gate_fired: true, mode: 'parallel' },
    ]

    const result = expandNestedMaster(entries, 'plan', plan)

    expect(result.entries.map((entry) => entry.sub)).toEqual([
      'head',
      'architecture',
      'phase',
      'spec',
      'review',
      'tail',
    ])
    expect(result.entries.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(findSerialBlockers(result.entries, 'tail')).toEqual(['architecture', 'phase', 'review'])

    const childrenDone = result.entries.map((entry) =>
      entry.sub === 'architecture' || entry.sub === 'phase'
        ? { ...entry, status: 'done' as const }
        : entry,
    )
    expect(nextPending(childrenDone)).toBe('review')
  })

  it('orders mixed parallel children before their serial tail', () => {
    const mixedPlan: GatesPlan = {
      master: 'plan',
      fire: [
        { sub: 'child-head', mode: 'serial', order: 1 },
        { sub: 'child-tail', mode: 'serial', order: 99 },
        { sub: 'child-review', mode: 'parallel' },
      ],
      skip: [],
    }

    const result = expandNestedMaster(rootLedger(), 'plan', mixedPlan)

    expect(result.entries.map((entry) => entry.sub)).toEqual([
      'discuss',
      'child-head',
      'child-review',
      'child-tail',
      'task',
    ])
    expect(result.entries.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5])
  })

  it('orders parallel work before a serial tail at the exact anchor boundary', () => {
    const boundaryPlan: GatesPlan = {
      master: 'plan',
      fire: [
        { sub: 'child-tail', mode: 'serial', order: 50 },
        { sub: 'child-review', mode: 'parallel' },
      ],
      skip: [],
    }

    const result = expandNestedMaster(rootLedger(), 'plan', boundaryPlan)

    expect(result.entries.map((entry) => entry.sub)).toEqual([
      'discuss',
      'child-review',
      'child-tail',
      'task',
    ])
  })

  it('roundtrips the complete expanded ledger through the real current-workflow writer', async () => {
    const root = mkdtempSync(join(tmpdir(), 'harnessed-nested-master-'))
    const originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
    process.env.HARNESSED_ROOT_OVERRIDE = root

    try {
      const result = expandNestedMaster(
        [
          { sub: 'head', status: 'done', gate_fired: true, mode: 'serial', order: 1 },
          { sub: 'plan', status: 'pending', gate_fired: true, mode: 'serial', order: 2 },
          { sub: 'tail', status: 'pending', gate_fired: true, mode: 'serial', order: 99 },
          { sub: 'review', status: 'pending', gate_fired: true, mode: 'parallel' },
        ],
        'plan',
        plan,
      )
      await writeCurrentWorkflow({
        schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
        phase: 'root',
        status: 'active',
        last_checkpoint_path: null,
        started_at: new Date().toISOString(),
        sub_progress: result.entries,
      })

      const persisted = await readCurrentWorkflow()
      expect(persisted?.sub_progress).toEqual(result.entries)
    } finally {
      if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
      else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('is idempotent and does not reset child progress on repeated start', () => {
    const first = expandNestedMaster(rootLedger(), 'plan', plan)
    const progressed = first.entries.map((entry) =>
      entry.sub === 'architecture' ? { ...entry, status: 'done' as const } : entry,
    )
    const second = expandNestedMaster(progressed, 'plan', plan)

    expect(second.matched).toBe(true)
    expect(second.entries).toBe(progressed)
    expect(second.entries.find((entry) => entry.sub === 'architecture')?.status).toBe('done')
  })

  it('keeps later nested replay metadata valid when an earlier sibling expands', () => {
    const entries: SubProgressEntryType[] = [
      { sub: 'discuss', status: 'pending', gate_fired: true, mode: 'serial', order: 1 },
      { sub: 'plan', status: 'pending', gate_fired: true, mode: 'serial', order: 2 },
      { sub: 'task', status: 'pending', gate_fired: true, mode: 'serial', order: 3 },
    ]
    const discussPlan: GatesPlan = {
      master: 'discuss',
      fire: [
        { sub: 'scope', mode: 'serial', order: 1 },
        { sub: 'research', mode: 'serial', order: 2 },
      ],
      skip: [],
    }

    const planExpanded = expandNestedMaster(entries, 'plan', plan)
    const discussExpanded = expandNestedMaster(planExpanded.entries, 'discuss', discussPlan)
    const replayedPlan = expandNestedMaster(discussExpanded.entries, 'plan', plan)

    expect(replayedPlan.matched).toBe(true)
    expect(replayedPlan.entries).toBe(discussExpanded.entries)
    expect(replayedPlan.entries.map((entry) => entry.sub)).toEqual([
      'scope',
      'research',
      'architecture',
      'phase',
      'spec',
      'task',
    ])
    expect(replayedPlan.entries.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(
      replayedPlan.entries.find((entry) => entry.sub === 'architecture')?.nested_expansion,
    ).toMatchObject({ parent: 'plan', start: 2 })
  })

  it('does not treat an accidental child-shaped segment at the wrong position as replay', () => {
    const entries: SubProgressEntryType[] = [
      { sub: 'unrelated', status: 'done', gate_fired: true, mode: 'serial', order: 1 },
      { sub: 'architecture', status: 'pending', gate_fired: true, mode: 'serial', order: 1 },
      { sub: 'phase', status: 'pending', gate_fired: true, mode: 'serial', order: 2 },
      {
        sub: 'spec',
        status: 'skipped',
        gate_fired: false,
        reason: 'not required',
        order: 3,
      },
    ]

    const result = expandNestedMaster(entries, 'plan', plan)

    expect(result).toEqual({ entries, matched: false })
  })

  it('does not treat structurally different child identities as replay', () => {
    const entries: SubProgressEntryType[] = [
      { sub: 'architecture', status: 'pending', gate_fired: true, mode: 'parallel', order: 1 },
      { sub: 'phase', status: 'pending', gate_fired: true, mode: 'serial', order: 2 },
      {
        sub: 'spec',
        status: 'skipped',
        gate_fired: false,
        reason: 'different reason',
        order: 3,
      },
    ]

    const result = expandNestedMaster(entries, 'plan', plan)

    expect(result).toEqual({ entries, matched: false })
  })

  it('does not replay-match a shorter plan against an old expansion prefix', () => {
    const entries = expandNestedMaster(rootLedger(), 'plan', plan).entries
    const shorterPlan: GatesPlan = {
      master: 'plan',
      fire: [{ sub: 'architecture', mode: 'serial', order: 1 }],
      skip: [],
    }

    expect(expandNestedMaster(entries, 'plan', shorterPlan)).toEqual({ entries, matched: false })
  })

  it('does not replay-match a child segment moved away from the original parent slot', () => {
    const expanded = expandNestedMaster(rootLedger(), 'plan', plan).entries
    const head = expanded[0]
    const tail = expanded.at(-1)
    if (!head || !tail) throw new Error('expected expanded root siblings')
    const children = expanded.slice(1, -1)
    const moved: SubProgressEntryType[] = [...children, head, tail].map((entry, index) => ({
      ...entry,
      order: index + 1,
    }))

    expect(expandNestedMaster(moved, 'plan', plan)).toEqual({ entries: moved, matched: false })
  })

  it('does not report replay while the parent identity still exists', () => {
    const expanded = expandNestedMaster(rootLedger(), 'plan', plan).entries
    const entries: SubProgressEntryType[] = [
      { sub: 'plan', status: 'done', gate_fired: true, mode: 'serial', order: 1 },
      ...expanded.map((entry, index) => ({ ...entry, order: index + 2 })),
    ]

    expect(expandNestedMaster(entries, 'plan', plan)).toEqual({ entries, matched: false })
  })

  it('does not report replay for an empty child plan', () => {
    const emptyPlan: GatesPlan = { master: 'plan', fire: [], skip: [] }
    const entries = rootLedger().filter((entry) => entry.sub !== 'plan')

    expect(expandNestedMaster(entries, 'plan', emptyPlan)).toEqual({ entries, matched: false })
  })

  it('keeps the root workflow pending until expanded children and later siblings resolve', () => {
    const result = expandNestedMaster(rootLedger(), 'plan', plan)
    const oneChildDone = result.entries.map((entry) =>
      entry.sub === 'architecture' ? { ...entry, status: 'done' as const } : entry,
    )

    expect(nextPending(oneChildDone)).toBe('phase')
  })

  it('refuses expansion when a child reuses a root sibling identity', () => {
    const conflictingPlan: GatesPlan = {
      master: 'plan',
      fire: [{ sub: 'task', mode: 'serial', order: 1 }],
      skip: [],
    }
    const entries = rootLedger()

    expect(() => expandNestedMaster(entries, 'plan', conflictingPlan)).toThrow(
      /child sub 'task' conflicts with an existing ledger identity/,
    )
    expect(entries).toEqual(rootLedger())
  })

  it('refuses expansion when a child reuses the parent identity', () => {
    const conflictingPlan: GatesPlan = {
      master: 'plan',
      fire: [{ sub: 'plan', mode: 'serial', order: 1 }],
      skip: [],
    }

    expect(() => expandNestedMaster(rootLedger(), 'plan', conflictingPlan)).toThrow(
      /child sub 'plan' conflicts with the parent ledger identity/,
    )
  })

  it('refuses expansion when the nested plan repeats a child identity', () => {
    const conflictingPlan: GatesPlan = {
      master: 'plan',
      fire: [
        { sub: 'phase', mode: 'serial', order: 1 },
        { sub: 'phase', mode: 'serial', order: 2 },
      ],
      skip: [],
    }

    expect(() => expandNestedMaster(rootLedger(), 'plan', conflictingPlan)).toThrow(
      /child sub 'phase' conflicts with an existing ledger identity/,
    )
  })
})
