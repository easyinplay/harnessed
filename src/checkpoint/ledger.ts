// src/checkpoint/ledger.ts — pure ledger functions (NO I/O) over the v5.0
// sub-progress ledger (ADR-0033 D1). seedLedger maps a `harnessed gates` JSON
// plan into the ledger; markSub returns a new array with one entry flipped;
// nextPending finds the first still-pending sub.
//
// Per STATE-MACHINE-CORE-DESIGN.md §9 component isolation: this file depends on
// schema TYPES only — zero fs/crypto/yaml, zero CLI imports. All fs/crypto lives
// in evidence.ts; orchestration lives in checkpoint.ts.

import type { EvidenceRefType, SubProgressEntryType } from './schema/currentWorkflow.v1.js'
import { PARALLEL_MID_ANCHOR } from './subAnchor.js'

/** A single fired sub in the `gates` plan. Mirrors gates.ts FireEntry. */
export interface GatesPlanFireEntry {
  sub: string
  order?: number
  mode?: string
  gate?: string
  is_master?: boolean
}

/** A single skipped sub in the `gates` plan. Mirrors gates.ts SkipEntry. */
export interface GatesPlanSkipEntry {
  sub: string
  reason: string
}

/** The `harnessed gates <master>` JSON plan (verbatim). Local interface — does
 *  NOT import the CLI layer. */
export interface GatesPlan {
  master?: string
  fire: GatesPlanFireEntry[]
  skip: GatesPlanSkipEntry[]
  parallelism?: { escalate_to_teams: boolean; reason: string | null }
}

export type SubStatus = SubProgressEntryType['status']

export interface MarkSubOpts {
  evidence?: EvidenceRefType[]
  evidence_status?: SubProgressEntryType['evidence_status']
  // T2.7 — loop-guarantee fields (see currentWorkflow.v1.ts). Each is written only
  // when the caller has something to say; `undefined` leaves the prior value intact
  // so a later mark never erases an earlier attempt's damping state.
  completion_claim?: SubProgressEntryType['completion_claim']
  progress?: SubProgressEntryType['progress']
  attempt_budget?: SubProgressEntryType['attempt_budget']
  // v16.0 Phase 66 T4 — which of the five named spawn failures ended the attempt.
  // Same undefined-never-erases rule as the three above.
  spawn_failure?: SubProgressEntryType['spawn_failure']
}

/** Seed the ledger from a `harnessed gates` plan (Q5 seed-upfront). Fired subs
 *  become `pending` (gate_fired:true); skipped subs become `skipped`
 *  (gate_fired:false) carrying their reason. Fire entries are emitted first,
 *  sorted by `order` (entries without an order keep their input position via a
 *  stable sort); skip entries follow in input order. */
export function seedLedger(plan: GatesPlan): SubProgressEntryType[] {
  const fireEntries = plan.fire.map(
    (f, i): { order: number; idx: number; entry: SubProgressEntryType } => {
      const entry: SubProgressEntryType = { sub: f.sub, status: 'pending', gate_fired: true }
      // 4.26.0 (A3) — persist the plan's serial/parallel semantics so the
      // serial-order guard can enforce sequence at complete/fail time. The plan's
      // `mode` is a plain string; only the schema's 2-enum values are carried.
      if (f.mode === 'serial' || f.mode === 'parallel') entry.mode = f.mode
      if (f.order !== undefined) entry.order = f.order
      return {
        // missing order → Infinity so explicitly-ordered subs sort ahead while
        // unordered ones retain relative input order (stabilized by idx).
        order: f.order ?? Number.POSITIVE_INFINITY,
        idx: i,
        entry,
      }
    },
  )
  fireEntries.sort((a, b) => a.order - b.order || a.idx - b.idx)

  const skipEntries = plan.skip.map(
    (s): SubProgressEntryType => ({
      sub: s.sub,
      status: 'skipped',
      gate_fired: false,
      reason: s.reason,
    }),
  )

  return [...fireEntries.map((e) => e.entry), ...skipEntries]
}

export interface ExpandNestedMasterResult {
  entries: SubProgressEntryType[]
  matched: boolean
}

function orderBySequence(entries: SubProgressEntryType[]): SubProgressEntryType[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const orderDelta =
        (left.entry.order ?? PARALLEL_MID_ANCHOR) - (right.entry.order ?? PARALLEL_MID_ANCHOR)
      if (orderDelta !== 0) return orderDelta
      if ((left.entry.order === undefined) !== (right.entry.order === undefined)) {
        return left.entry.order === undefined ? -1 : 1
      }
      return left.index - right.index
    })
    .map(({ entry }) => entry)
}

function renumberSequence(entries: SubProgressEntryType[]): SubProgressEntryType[] {
  return entries.map((entry, index) => ({
    ...entry,
    order: index + 1,
    ...(entry.nested_expansion
      ? {
          nested_expansion: {
            ...entry.nested_expansion,
            start: index - entry.nested_expansion.index,
          },
        }
      : {}),
  }))
}

function isEquivalentReplay(
  entries: SubProgressEntryType[],
  children: SubProgressEntryType[],
  parent: string,
): boolean {
  if (children.length === 0) return false
  if (entries.some((entry, index) => entry.order !== index + 1)) return false

  const childSubs = new Set(children.map((entry) => entry.sub))
  if (entries.filter((entry) => childSubs.has(entry.sub)).length !== children.length) return false

  return entries.some((_, start) =>
    children.every((expected, offset) => {
      const actual = entries[start + offset]
      if (!actual) return false
      if (
        actual.sub !== expected.sub ||
        actual.gate_fired !== expected.gate_fired ||
        actual.mode !== expected.mode ||
        actual.order !== start + offset + 1 ||
        actual.nested_expansion?.parent !== parent ||
        actual.nested_expansion.index !== offset ||
        actual.nested_expansion.length !== children.length ||
        actual.nested_expansion.start !== start
      ) {
        return false
      }
      return (
        expected.status !== 'skipped' ||
        (actual.status === 'skipped' && actual.reason === expected.reason)
      )
    }),
  )
}

/** Replace a pending master entry with its child plan without replacing the
 * owning workflow envelope. Existing effective sequence order is stabilized,
 * the parent slot is replaced in place, then array positions become the sole
 * integer order. Replaying the same start is an identity operation only when the
 * complete child segment still has the same identities and sequence position. */
export function expandNestedMaster(
  entries: SubProgressEntryType[],
  parent: string,
  plan: GatesPlan,
): ExpandNestedMasterResult {
  const seededChildren = orderBySequence(seedLedger(plan))
  const childSubs = seededChildren.map((entry) => entry.sub)
  if (childSubs.includes(parent)) {
    throw new Error(
      `expandNestedMaster: child sub '${parent}' conflicts with the parent ledger identity; ` +
        `nested expansion for '${parent}' was refused.`,
    )
  }
  const duplicateChild = childSubs.find((sub, index) => childSubs.indexOf(sub) !== index)
  if (duplicateChild) {
    throw new Error(
      `expandNestedMaster: child sub '${duplicateChild}' conflicts with an existing ledger identity; ` +
        `nested expansion for '${parent}' was refused.`,
    )
  }
  const parentIndex = entries.findIndex(
    (entry) => entry.sub === parent && entry.status === 'pending',
  )

  if (parentIndex === -1) {
    if (entries.some((entry) => entry.sub === parent)) return { entries, matched: false }
    return { entries, matched: isEquivalentReplay(entries, seededChildren, parent) }
  }

  const conflictingSibling = entries.find(
    (entry, index) => index !== parentIndex && childSubs.includes(entry.sub),
  )
  if (conflictingSibling) {
    throw new Error(
      `expandNestedMaster: child sub '${conflictingSibling.sub}' conflicts with an existing ledger identity; ` +
        `nested expansion for '${parent}' was refused.`,
    )
  }

  const orderedEntries = orderBySequence(entries)
  const orderedParentIndex = orderedEntries.findIndex(
    (entry) => entry.sub === parent && entry.status === 'pending',
  )
  const children = seededChildren.map((entry, index) => ({
    ...entry,
    nested_expansion: {
      parent,
      index,
      length: seededChildren.length,
      start: orderedParentIndex,
    },
  }))
  const expanded = [
    ...orderedEntries.slice(0, orderedParentIndex),
    ...children,
    ...orderedEntries.slice(orderedParentIndex + 1),
  ]

  return {
    entries: renumberSequence(expanded),
    matched: true,
  }
}

/** Return a NEW ledger array with the named sub's entry flipped to `status`,
 *  optionally attaching evidence + evidence_status. Input array and its entries
 *  are never mutated. Throws if `sub` is not present in the ledger. */
export function markSub(
  entries: SubProgressEntryType[],
  sub: string,
  status: SubStatus,
  opts?: MarkSubOpts,
): SubProgressEntryType[] {
  const idx = entries.findIndex((e) => e.sub === sub)
  if (idx === -1) {
    throw new Error(
      `markSub: sub '${sub}' not found in ledger (${entries.length} entries). ` +
        'It must be seeded before it can be marked.',
    )
  }
  const current = entries[idx] as SubProgressEntryType
  const updated: SubProgressEntryType = { ...current, status }
  // G6 — count repeated failures of the same sub (drives detectLoop). Only the
  // ->failed transition bumps the counter; other transitions carry it forward.
  if (status === 'failed') updated.fail_count = (current.fail_count ?? 0) + 1
  if (opts?.evidence !== undefined) updated.evidence = opts.evidence
  if (opts?.evidence_status !== undefined) updated.evidence_status = opts.evidence_status
  if (opts?.completion_claim !== undefined) updated.completion_claim = opts.completion_claim
  if (opts?.progress !== undefined) updated.progress = opts.progress
  if (opts?.attempt_budget !== undefined) updated.attempt_budget = opts.attempt_budget
  if (opts?.spawn_failure !== undefined) updated.spawn_failure = opts.spawn_failure

  const next = entries.slice()
  next[idx] = updated
  return next
}

/**
 * v16.0 Phase 66 T4 — record WHICH of the five named spawn failures happened,
 * without asserting a status transition.
 *
 * Separate from `markSub` on purpose, for the one caller that has a
 * classification but no business flipping the entry: `src/workflow/run.ts`'s
 * `harnessed run` loop. It already records its own terminal checkpoint through
 * `completePhase` and has never marked the ledger; routing it through
 * `markSub(entries, sub, 'failed', …)` would bump `fail_count` a second time for
 * the same attempt (and so mislead BREAK-LOOP / BUDGET-EXHAUSTED, whose only
 * counting source is that field). The status-carrying write stays with
 * `markSub`, which the checkpoint CLI uses.
 *
 * No-op — not a throw — when the sub was never seeded, matching
 * `markIfSeeded`'s rule that the ledger is an additive overlay and never a hard
 * gate. Returns the SAME array reference in that case so a caller can tell
 * nothing happened.
 */
export function annotateSpawnFailure(
  entries: SubProgressEntryType[],
  sub: string,
  failure: NonNullable<SubProgressEntryType['spawn_failure']>,
): SubProgressEntryType[] {
  const idx = entries.findIndex((e) => e.sub === sub)
  if (idx === -1) return entries
  const next = entries.slice()
  next[idx] = { ...(entries[idx] as SubProgressEntryType), spawn_failure: failure }
  return next
}

/**
 * 4.38.0 — send a RESOLVED sub back for rework. The edge verify never had: the
 * three `checkpoint fail` stopping reasons all mean STOP, so "this came back
 * wrong, do it again" had no machine transition and lived in SKILL.md prose.
 *
 * Deliberately NOT the 'rejected' status — that one is a terminal decline and
 * documents itself as not touching fail_count. Rework is an attempt: it counts,
 * so a verify that bounces the same sub repeatedly walks into the SAME
 * BUDGET-EXHAUSTED / BREAK-LOOP machinery a repeatedly failing sub does, with no
 * second counter to keep in sync.
 *
 * The evidence of the rejected attempt is dropped. A pending entry carrying
 * `evidence_status: 'verified'` is a ledger that claims the work now being redone
 * was already verified; the guard re-checks artifacts at the next `complete`
 * anyway, so nothing is lost by clearing it and a false claim is avoided.
 *
 * Throws on the two operator errors — unknown sub (parity with markSub: it must
 * be seeded first) and an already-pending sub (nothing was resolved to send
 * back). Callers surface these as exit 1; a silent no-op would look like success.
 */
export function reopenSub(
  entries: SubProgressEntryType[],
  sub: string,
  reason: string,
): SubProgressEntryType[] {
  const idx = entries.findIndex((e) => e.sub === sub)
  if (idx === -1) {
    throw new Error(
      `reopenSub: sub '${sub}' not found in ledger (${entries.length} entries). ` +
        'It must be seeded before it can be reopened.',
    )
  }
  const current = entries[idx] as SubProgressEntryType
  if (current.status === 'pending') {
    throw new Error(`reopenSub: sub '${sub}' is already pending — nothing to send back.`)
  }
  const { evidence, evidence_status, completion_claim, ...rest } = current
  const next = entries.slice()
  next[idx] = {
    ...rest,
    status: 'pending',
    fail_count: (current.fail_count ?? 0) + 1,
    reason,
  }
  return next
}

/** First sub still awaiting work (status === 'pending'), or null when none
 *  remain. Skipped/done/failed entries are ignored. */
export function nextPending(entries: SubProgressEntryType[]): string | null {
  return entries.find((e) => e.status === 'pending')?.sub ?? null
}

// PARALLEL_MID_ANCHOR (imported): the ledger ARRAY position cannot be used for
// sequence checks — seedLedger sorts missing-order entries last (Infinity), which
// puts parallel members after a serial tail like `simplify` order 99; the anchor
// gives unordered (parallel) subs an effective mid position instead.

/** 4.26.0 (A3 serial-order guard) — pending subs whose sequence position comes
 *  BEFORE `sub`, making its complete/fail a sequence jump (comet 0.3.9
 *  phase-skip lesson). Effective order = entry.order, or the mid anchor for
 *  unordered (parallel) entries; serial entries always carry an explicit order
 *  (K9 invariant).
 *  - target mode 'serial'   → every pending known-mode entry ordered before it
 *    blocks (the serial tail waits for the whole preceding chain, parallel
 *    members included);
 *  - target 'parallel'/unknown → only pending SERIAL entries ordered before it
 *    block (parallel group members legitimately resolve in any order).
 *  Entries without a `mode` field are never counted (pre-4.26.0 ledger →
 *  back-compat no-op); unknown target sub → [] (markSub owns that error). */
export function findSerialBlockers(entries: SubProgressEntryType[], sub: string): string[] {
  const target = entries.find((e) => e.sub === sub)
  if (!target) return []
  const eff = (e: SubProgressEntryType): number => e.order ?? PARALLEL_MID_ANCHOR
  const counts =
    target.mode === 'serial'
      ? (e: SubProgressEntryType) => e.mode === 'serial' || e.mode === 'parallel'
      : (e: SubProgressEntryType) => e.mode === 'serial'
  return entries
    .filter((e) => e.sub !== sub && e.status === 'pending' && counts(e) && eff(e) < eff(target))
    .map((e) => e.sub)
}
