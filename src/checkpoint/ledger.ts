// src/checkpoint/ledger.ts — pure ledger functions (NO I/O) over the v5.0
// sub-progress ledger (ADR-0033 D1). seedLedger maps a `harnessed gates` JSON
// plan into the ledger; markSub returns a new array with one entry flipped;
// nextPending finds the first still-pending sub.
//
// Per STATE-MACHINE-CORE-DESIGN.md §9 component isolation: this file depends on
// schema TYPES only — zero fs/crypto/yaml, zero CLI imports. All fs/crypto lives
// in evidence.ts; orchestration lives in checkpoint.ts.

import type { EvidenceRefType, SubProgressEntryType } from './schema/currentWorkflow.v1.js'

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

  const next = entries.slice()
  next[idx] = updated
  return next
}

/** First sub still awaiting work (status === 'pending'), or null when none
 *  remain. Skipped/done/failed entries are ignored. */
export function nextPending(entries: SubProgressEntryType[]): string | null {
  return entries.find((e) => e.status === 'pending')?.sub ?? null
}

/** Mirror of masterOrchestrator's PARALLEL_MID_ANCHOR: parallel subs (which
 *  carry no explicit order) execute between serial-leading (<50) and
 *  serial-trailing (≥50) entries. The ledger ARRAY position cannot be used for
 *  sequence checks — seedLedger sorts missing-order entries last (Infinity),
 *  which puts parallel members after a serial tail like `simplify` order 99. */
const PARALLEL_MID_ANCHOR = 50

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
