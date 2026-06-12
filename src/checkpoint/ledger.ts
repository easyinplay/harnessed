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
    (f, i): { order: number; idx: number; entry: SubProgressEntryType } => ({
      // missing order → Infinity so explicitly-ordered subs sort ahead while
      // unordered ones retain relative input order (stabilized by idx).
      order: f.order ?? Number.POSITIVE_INFINITY,
      idx: i,
      entry: { sub: f.sub, status: 'pending', gate_fired: true },
    }),
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
