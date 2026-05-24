// v3.4.4 Phase 6 — hoisted from src/routing/lib/promiseExtract.ts (sister Phase 2 sdkSpawn + Phase 3 ralphLoop relocation pattern).
//
// Phase 1.5 T5.2 — `<promise>...</promise>` XML wrapper extract (hard split).
//
// IMPL NOTE — implements ADR 0009 § Decision Errata 3 + D1.5-4 sub-item 3 +
// PLAN-CHECK W-2 absorption (D1.5-8b). phase 1.4 shipped ralphLoop.ts at 66L,
// already over the D1.4-3 ≤50L wedge principle by 16L. Rather than swelling it
// further with the XML wrapper upgrade, the promise-extraction logic is hard
// split into this single-purpose helper (~30L) so ralphLoop.ts main body
// returns toward ≤50L. SPIKE-REPORT-2.md § D1.5-8b confirmed the regex is
// simple enough to isolate.
//
// The XML wrapper `<promise>([^<]+)</promise>` disambiguates think-out-loud
// text (e.g. "I think the task is COMPLETE in nature") from the actual
// completion signal — the phase 1.4 raw `^COMPLETE$/m` regex was prone to that
// false positive. `extractPromise` returns the wrapped content (e.g.
// "COMPLETE") or null; callers check `=== "COMPLETE"`. The capture-group design
// also supports future status values (PARTIAL / BLOCKED) without an interface
// change — phase 1.5 still only accepts "COMPLETE".

/** Matches the first `<promise>...</promise>` wrapper; group 1 is the content. */
export const PROMISE_PATTERN = /<promise>([^<]+)<\/promise>/

/**
 * Extract the content of the first `<promise>...</promise>` XML wrapper.
 *
 * @param text - the (possibly think-out-loud) agent output to scan.
 * @returns the wrapped content (e.g. `"COMPLETE"`), or `null` when no wrapper
 *          is present.
 */
export function extractPromise(text: string): string | null {
  const match = text.match(PROMISE_PATTERN)
  return match ? (match[1] as string) : null
}
