# SPIKE-REPORT-2 — Phase 1.5 Wave 1 Spike: Kahn DAG Topology + XML Promise Wrapper Feasibility

**Date**: 2026-05-14
**Author**: gsd-executor (phase-1.5 batch 1)
**Spike script**: `scripts/spike/dag-and-promise-xml.sh`
**Status**: COMPLETE — GO verdict

---

## § 1 Spike Goal

Phase 1.5 Wave 1 spike covers two independent feasibility questions before committing to core
implementation tasks in Wave 2 (T3.1 `dag.ts`) and Wave 4 (T5.1 `systemPrompt.ts` + T5.2
`ralphLoop.ts`):

**Goal 1 — Kahn DAG Topology (D1.5-1)**

Confirm that Kahn's algorithm (BFS + indegree queue), self-implemented in ≤ 200L pure TypeScript
without external graph library deps, correctly:
- Produces a valid topological order for acyclic graphs (linear chain / diamond / multi-root /
  single node)
- Detects cycles and returns the offending node set (enabling E_DAG_CYCLE friendly error)

The spike uses Node.js inline to execute the algorithm logic before the `src/lib/dag.ts` file
exists, verifying the approach is sound at algorithm level. Karpathy YAGNI lock (D1.5-1): no
`graphlib` / `@dagrejs/graphlib` / `toposort` — 30L self-impl is sufficient for ≤ 50 manifest
dependency graphs.

**Goal 2 — XML Promise Wrapper Regex (D1.5-8)**

Confirm that the `/<promise>([^<]+)<\/promise>/` regex:
- Correctly extracts the promise tag content ("COMPLETE") from text that also contains
  think-out-loud prose
- Does NOT trigger a false-positive when text contains "COMPLETE" inline (not in a tag)
- Demonstrates that the raw `/^COMPLETE$/m` regex WOULD false-positive on a bare `COMPLETE`
  line mid-think-out-loud — confirming the XML wrapper is necessary

The spike also validates that the hard-split design (`src/lib/promiseExtract.ts` ~30L) is safe:
the regex is simple enough to isolate in a small helper, keeping `ralphLoop.ts` ≤ 50L.

---

## § 2 Kahn Algorithm Results

Spike run: `bash scripts/spike/dag-and-promise-xml.sh` on 2026-05-14, Node.js v24.15.0,
Windows 11 / bash (Git Bash). All 5 graph test cases passed.

### Test Case 1 — Linear Chain (A → B → C → D)

```
Input:  nodes=[A,B,C,D]  edges=[(A,B),(B,C),(C,D)]
Result: order:A,B,C,D
```

**PASS** — topological order A,B,C,D is the unique valid ordering for a linear chain. Kahn
processes A (in-degree 0) first, exposing B, then C, then D. Correct.

### Test Case 2 — Diamond (A → B, A → C, B → D, C → D)

```
Input:  nodes=[A,B,C,D]  edges=[(A,B),(A,C),(B,D),(C,D)]
Result: order:A,B,C,D
```

**PASS** — valid topological order (A before B,C; both B and C before D). Two valid orderings
exist (A,B,C,D or A,C,B,D); the spike produces A,B,C,D (alphabetical queue sort). Correct.

### Test Case 3 — Multi-Root (A → D, B → D, C → D)

```
Input:  nodes=[A,B,C,D]  edges=[(A,D),(B,D),(C,D)]
Result: order:A,B,C,D
```

**PASS** — D has in-degree 3; A/B/C all have in-degree 0 (three roots). D must appear last.
Result A,B,C,D has D last. Correct.

### Test Case 4 — Single Node (X, no edges)

```
Input:  nodes=[X]  edges=[]
Result: order:X
```

**PASS** — trivial case: single node with no edges, in-degree 0, immediately queued and
output. Correct.

### Test Case 5 — Cycle (A → B → C → A)

```
Input:  nodes=[A,B,C]  edges=[(A,B),(B,C),(C,A)]
Result: cycle:A,B,C
```

**PASS** — Kahn processes the queue; all three nodes have in-degree ≥ 1 after start (cycle
means no node can reach in-degree 0). After queue exhausts with 0 nodes processed, remaining
nodes (in-degree > 0) are returned as cycle members: [A,B,C]. E_DAG_CYCLE detection confirmed.

### Kahn Algorithm Summary

| test case | nodes | edges | expected | result | status |
|-----------|-------|-------|----------|--------|--------|
| linear chain | A,B,C,D | 3 linear | order A,B,C,D | A,B,C,D | PASS |
| diamond | A,B,C,D | 4 diamond | valid order (D last) | A,B,C,D | PASS |
| multi-root | A,B,C,D | 3 → D | D last | A,B,C,D | PASS |
| single node | X | — | order X | X | PASS |
| cycle | A,B,C | 3-cycle | cycle detected | cycle:A,B,C | PASS |

**5/5 PASS** — Kahn iterative algorithm confirmed feasible for `src/lib/dag.ts` T3.1.

---

## § 3 XML Promise Wrapper Results

All 3 regex test cases (8 individual assertions) passed.

### Test Case 6 — XML Wrapper in Think-Out-Loud Text (no bare COMPLETE line)

```
Input text:
  "I have finished the task and I should signal completion now.
   The work is done.
   <promise>COMPLETE</promise>
   No more steps remain."

XML regex /<promise>([^<]+)<\/promise>/ → extracted: "COMPLETE"
Raw regex /^COMPLETE$/m               → matched: false
```

**PASS (both assertions):**
- XML regex correctly extracts "COMPLETE" from the `<promise>` tag
- Raw `/^COMPLETE$/m` does NOT false-positive (no bare `COMPLETE` line exists in this text)

This confirms the primary use-case: agent outputs think-out-loud prose followed by the XML
wrapper tag; the extractor correctly identifies the completion signal.

### Test Case 7 — Bare COMPLETE in Think-Out-Loud Text (false-positive demonstration)

```
Input text:
  "I should output COMPLETE to signal done.
   Actually let me reconsider.
   COMPLETE
   Wait I am not done yet."

XML regex /<promise>([^<]+)<\/promise>/ → extracted: null
Raw regex /^COMPLETE$/m               → matched: true
```

**PASS (both assertions):**
- XML regex correctly returns `null` (no wrapper tag present) — no false-positive
- Raw `/^COMPLETE$/m` WOULD match the bare `COMPLETE` line — this is the false-positive risk
  that the XML wrapper eliminates

This is the critical motivating case: an agent in a mid-thought state writes "COMPLETE" on its
own line while still processing. The XML wrapper eliminates this ambiguity entirely.

### Test Case 8 — XML Wrapper with Non-COMPLETE Content

```
Input text:
  "Working on it.
   <promise>IN_PROGRESS</promise>
   Not done yet."

XML regex /<promise>([^<]+)<\/promise>/ → extracted: "IN_PROGRESS"
```

**PASS** — regex extracts the tag content correctly regardless of value; caller checks
`match[1] === 'COMPLETE'`. Non-COMPLETE values do not trigger false completion. The
`extractPromise(text): string | null` interface (returning `match[1]` or `null`) correctly
supports this multi-value future extension (e.g. `ABORT`, `RETRY` tags).

### XML Promise Wrapper Summary

| test | input | xml_extracted | raw_matched | assertion | status |
|------|-------|--------------|-------------|-----------|--------|
| T6a | think-out-loud + `<promise>COMPLETE</promise>` | "COMPLETE" | false | xml=COMPLETE | PASS |
| T6b | same text | — | false | raw no false-pos | PASS |
| T7a | bare COMPLETE line (no tag) | null | — | xml=null safe | PASS |
| T7b | same text | — | true | raw false-pos confirmed | PASS |
| T8 | `<promise>IN_PROGRESS</promise>` | "IN_PROGRESS" | — | xml≠COMPLETE safe | PASS |

**5/5 regex assertions PASS** — XML promise wrapper confirmed feasible.

---

## § 4 Anchor Decisions

The spike results lock the following decisions for Wave 2+ implementation:

### D1.5-1 — Kahn Iterative Algorithm Confirmed

**Decision locked**: `src/lib/dag.ts` uses Kahn's BFS + indegree queue, self-implemented,
≤ 200L hard limit. No external graph library dependencies.

**Evidence**: 5/5 graph test cases correct including cycle detection. The algorithm in 30L
of Node.js inline handles all edge cases needed for the manifest DAG resolver:
- Linear chain (sequential wave execution)
- Diamond (parallel waves converging)
- Multi-root (multiple independent entry points)
- Single node (trivial single-plugin install)
- Cycle (E_DAG_CYCLE error — reject with cycle node list)

**Implication for T3.1**: Implement `resolveDag(nodes, edges): string[] | E_DAG_CYCLE` with
alphabetical queue sort for deterministic output. ≤ 200L total including type exports, error
class, and JSDoc comments.

### D1.5-8a — XML Promise Wrapper Regex Confirmed

**Decision locked**: `/<promise>([^<]+)<\/promise>/` is the extraction regex for both
`src/lib/promiseExtract.ts` and `src/routing/ralphLoop.ts`. The `match[1] === 'COMPLETE'`
check is the completion signal gate.

**Evidence**: Test Cases 6-8 confirm:
- Correct extraction when tag is present (COMPLETE)
- No false-positive when tag is absent (raw COMPLETE line)
- Correct non-COMPLETE extraction (IN_PROGRESS) — caller controls final check

**Implication for T5.1/T5.2**: `systemPrompt.ts` COMPLETE_INSTRUCTION replaces `COMPLETE`
bare token with verbatim `<promise>COMPLETE</promise>` instruction text. `promiseExtract.ts`
exports `extractPromise(text: string): string | null`.

### D1.5-8b — `promiseExtract.ts` Hard Split Confirmed

**Decision locked**: PLAN-CHECK W-2 absorption confirmed. `ralphLoop.ts` (currently 66L,
over D1.4-3 ≤ 50L wedge) gets hard split via `src/lib/promiseExtract.ts` (~30L). The XML
regex logic is simple enough to isolate in a single-purpose helper. `ralphLoop.ts` main body
returns to ≤ 50L by replacing inline regex with `extractPromise()` import call.

**Evidence**: The regex is 1 line of logic + 1 check. A ~30L file is sufficient:
`export function extractPromise(text: string): string | null` — regex match + null guard.
No additional complexity needed in the helper.

**Implication for T5.2**: Create `src/lib/promiseExtract.ts` (~30L) as part of the XML wrapper
upgrade. `ralphLoop.ts` imports and uses it. T6.x adds ≥ 5 unit test cells for `extractPromise`.

---

## § 5 Verdict: GO

**Verdict**: **GO** — proceed to Wave 2 (T3.1 `dag.ts` + T3.2 `semanticRouter.ts` + T3.3
engine hook-in) and Wave 4 (T5.1 `systemPrompt.ts` + T5.2 `ralphLoop.ts` + `promiseExtract.ts`
hard split).

**Spike run**: 10/10 assertions PASS on Node.js v24.15.0 / Windows 11 / bash.

**No blockers found**:
- Kahn algorithm: 5/5 graph cases correct including E_DAG_CYCLE detection
- XML wrapper regex: 5/5 regex assertions correct including false-positive elimination
- Hard-split design: confirmed feasible (~30L helper sufficient)

**Risk register update**:
- R2 (DAG cycle unguarded): MITIGATED — Kahn cycle detection confirmed in spike
- D1.5-1 (Kahn algorithm): CONFIRMED — direct path to T3.1 implementation
- D1.5-8 (XML wrapper): CONFIRMED — direct path to T5.1/T5.2 implementation
- W-2 (ralphLoop.ts overflow): ABSORBED — hard split via promiseExtract.ts confirmed

**Next wave tasks unlocked by this spike**:
- T3.1: `src/lib/dag.ts` — Kahn implementation (D1.5-1 confirmed)
- T3.2: `src/routing/semanticRouter.ts` — semantic stub (D1.5-2 no-dep confirmed)
- T5.1: `src/routing/systemPrompt.ts` — XML wrapper upgrade (D1.5-8a confirmed)
- T5.2: `src/lib/ralphLoop.ts` + `src/lib/promiseExtract.ts` hard split (D1.5-8b confirmed)

---

**Checker**: gsd-executor (phase-1.5 batch 1, Wave 1)
**Spike script**: `scripts/spike/dag-and-promise-xml.sh` (NOT in CI — spike probe only)
**End of SPIKE-REPORT-2**.
