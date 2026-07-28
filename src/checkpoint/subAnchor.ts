// src/checkpoint/subAnchor.ts — single source for the sub-ordering mid anchor.
//
// architecture review #11 — this constant was copy-pasted into THREE files
// (masterOrchestrator.ts, ledger.ts, eval/record.ts), each carrying a "mirror
// of …" comment. A magic 50 duplicated across the serial/parallel split
// (orchestrator), the serial-order guard (ledger), and the record→replay
// reconstruction (eval) is a latent divergence: bump it in one place and the
// three silently disagree on where the parallel band sits. Hoisted here so all
// three import the ONE value.
//
// Zero dependencies BY DESIGN: ledger.ts (which imports this) is bundled into
// the dep-free per-turn hook (bin/harnessed-inject-state.mjs), so this module
// must never pull typebox or any runtime dep — it is a bare literal + doc only.

/** Parallel subs carry no explicit `order`; they execute BETWEEN serial-leading
 *  (`order` < 50) and serial-trailing (`order` ≥ 50) subs. Consumers:
 *   - masterOrchestrator: splits fired clauses into serial-leading / parallel /
 *     serial-trailing bands for the spawn sequence.
 *   - ledger.findSerialBlockers: effective order for an unordered (parallel)
 *     entry when checking the serial-order guard.
 *   - eval/record: the reconstructed `checkpoint complete` order clears the
 *     serial-order guard by placing unordered subs at this anchor. */
export const PARALLEL_MID_ANCHOR = 50
