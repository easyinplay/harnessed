# Transparency Verdict Checklist

> **Purpose**: structurally root-cause the recurring "CLOSED / 100% / 全绿" transparency
> anti-pattern. A closure verdict claimed without specific counts + an explicit miss list
> has recurred 2 phases running (phase 1.4 T1 — "100% hit" actually 70%; phase 1.5 H1/M1).
> This checklist defines a **structured verdict-marker convention** + a **narrow CI gate**
> (`scripts/check-transparency-verdicts.mjs`) that makes the inaccurate claim structurally
> unship-able. Same philosophy as the existing A7 baseline-tag CI step — mechanical
> enforcement of a documented contract.

## Background — why a checklist alone is not enough

The 1.4 → 1.5 recurrence proves the problem is **not** "the agent didn't know the rule" —
the agent *intended* to be accurate and still wasn't. Nothing *mechanically* blocked the
inaccurate claim from shipping. So this is a **hybrid**: the markdown checklist is the
contract (defines what a valid closure claim looks like), and a deliberately narrow CI
gate enforces the machine-checkable subset.

## The verdict-marker convention

Any **closure verdict** in a planning doc MUST be written as a **structured marker line**.
A marker line starts (after optional markdown bold `*` wrapping) with one of these tokens:

- `Verdict:`
- `状态:`
- `Closure:`

Every marker line MUST carry **both**:

1. **A count ratio** — an explicit `N/N` (e.g. `28/30`, `9/9`, `14/14`). Not "all", not
   "100%", not "全绿" alone — an actual digit-slash-digit ratio.
2. **A miss declaration** — an explicit `miss:` clause. Either `miss: none` (verified zero
   misses) or `miss: <list>` enumerating exactly which units missed.

### Valid marker lines

```
Verdict: CLOSED (28/30 specific-match, miss: search-3 / engineering-2)
状态: 全绿 — 14/14, miss: none
**Closure:** PASS (9/9 acceptance bars, miss: none)
Verdict: PARTIAL (6/9 tasks, miss: T1.7 / T1.8 / T1.9)
```

The marker may be wrapped in 0–2 markdown bold `*` characters — `**Verdict:**` and
`Verdict:` are both legal markers. The CI gate tolerates the bold wrapping.

### Invalid marker lines (CI gate flags these)

```
Verdict: CLOSED                          ← no N/N ratio, no miss declaration
状态: 全绿                                ← no ratio, no miss
**Verdict:** 100% green                  ← "100%" is not an N/N ratio; no miss clause
Closure: PASS — all tasks done           ← no ratio, no miss
```

## Scope boundary — the false-positive mitigation

The CI gate scans **only marker lines** in a **narrow set of verdict documents**:

- `.planning/**/PLAN-CHECK.md`
- `.planning/**/*-AUDIT.md`
- `.planning/**/VERIFICATION.md`

Free prose never matches — "the bug is now CLOSED", section headers, "100% of the unit
tests pass" in a paragraph — because none of those are on a line that *starts* with a
marker token. This narrow scope IS the false-positive mitigation: a noisy gate gets
suppressed, and a suppressed gate is no gate.

## Human-judgment parts the gate cannot check

The CI gate verifies the marker line is *structurally* complete (has a ratio + a miss
clause). It **cannot** verify:

- [ ] Is the count **correct**? (Did you actually run 30 samples, or assume 30?)
- [ ] Is the miss list **complete**? (Did you enumerate *every* miss, or stop at the
      first 2 you noticed?)
- [ ] Does the ratio's denominator match the real total? (28/30 — is the universe
      really 30, or 32?)
- [ ] Is `miss: none` actually *verified*, or aspirational?

These remain the verify-phase agent's responsibility. The checklist makes them explicit;
the gate makes the *structure* unship-able without them.

## W3 — warn-only round 1

`scripts/check-transparency-verdicts.mjs` ships with `const ENFORCE = false` for round 1.
Historical verdict docs (phase 1.x PLAN-CHECK / v0.1.0-MILESTONE-AUDIT / each phase
VERIFICATION) were written *before* this gate existed and mostly use free-prose
conclusions — enforcing on round 1 would red-CI on history. So round 1 is **warn-only**:
the script prints every violation it finds, then `process.exit(0)`.

The `ENFORCE` flag **flips to `true` in phase 2.2**, by which point all new verdict docs
(phase 2.1+ PLAN-CHECK / VERIFICATION) already follow the marker convention. From phase
2.2 onward a bare `状态: 全绿` in a verdict line fails CI.

## How to add a compliant verdict

1. Write the closure conclusion as a marker line (`Verdict:` / `状态:` / `Closure:`).
2. Include an explicit `N/N` ratio — count the real total, count the real passes.
3. Include `miss: none` (verified) or `miss: <full enumerated list>`.
4. Run `node scripts/check-transparency-verdicts.mjs` locally — fix any flagged lines.
5. Manually self-check the human-judgment items above before claiming closure.

## Status freshness markers

Phase 2.2 T0.4/T0.5 extends the gate with a **front-matter freshness check**. Top-level
project docs (`README.md` and `PROJECT-SPEC.md`) MUST carry a `Status:` (or `状态:`) marker
within their first 50 lines whose content includes the latest shipped milestone token from
`.planning/ROADMAP.md` (e.g. `v0.1.0`). The gate scans for a line matching
`STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m` (the optional
leading `>` and bold `**` tolerate blockquote / bold wrapping — B-17 false-positive
mitigation). `getLatestShippedToken()` finds the latest `## vN.N.N — ... ✅ SHIPPED` header
in ROADMAP.md and the marker text must contain that version token. Scope is narrow —
`FRONT_MATTER_DOCS = ['README.md', 'PROJECT-SPEC.md']` only — so other docs are unaffected.
Update the marker whenever a new milestone ships (same time you bump ROADMAP top-level).
Sub-phase tokens (e.g. `Phase 2.1 shipped`) may be appended alongside the milestone token
for narrative clarity; only the milestone token is mechanically enforced.
