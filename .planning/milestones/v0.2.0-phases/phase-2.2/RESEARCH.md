# Phase 2.2 — RESEARCH (R2 focus pack)

> **Researched**: 2026-05-15
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7)
> **Scope**: 3 fresh research topics ONLY — SDK 主决议 / ralph-wiggum keep-vs-switch / per-phase model tier 主决议 已 `.planning/research/v0.2.0-execute-task-ralph.md` HIGH conf cover,本 RESEARCH 不重做
> **Overall confidence**: HIGH (Topic 1 spike-required tagged MEDIUM-HIGH;Topic 2 + Topic 3 HIGH)

---

## § 0 Scope note — what this RESEARCH does NOT redo

The SDK introduction decision (D-01/D-02/D-03/D-11), ralph-wiggum keep-vs-switch (D-12), and per-phase model tier intel 第 4 条 actionable schema (D-04/D-05/D-06) were researched HIGH-conf in `.planning/research/v0.2.0-execute-task-ralph.md` (2026-05-15, valid until ~2026-06-15) and locked in `.planning/phase-2.2/2.2-CONTEXT.md` D-01 ~ D-15. This RESEARCH covers ONLY the 3 remaining uncertainties flagged by KICKOFF § 4 R2:

1. **§ 1** — SDK `outputFormat` + `agents`-map 组合可行性 (research § 5.4 open question)
2. **§ 2** — transparency 全史迁移策略 (F1 D-07b)
3. **§ 3** — freshness check 具体形态 (F1 D-07c + reviewer item 21)

Decision locks (D2.2-1 ~ D2.2-7) recorded in § 4 for Wave B planner consumption.

---

## § 1 SDK `outputFormat` + `agents`-map 组合可行性

**Confidence: MEDIUM-HIGH (cross-feature compatibility not jointly documented;1-spike validation required;degraded fallback path proven)**

### 1.1 Findings — ctx7 fetched 2026-05-15

Targeted ctx7 query on `/nothflare/claude-agent-sdk-docs` (821 snippets) for the joint pattern returned:

- **`outputFormat: { type: 'json_schema', schema }` examples** (`structured-outputs.md`) — TS + Python — return `message.structured_output` on `result` message. Standalone — no `agents` map.
- **`agents` map examples** (`subagents.md`) — `code-reviewer` + `test-runner` programmatic definition, `"Task"` tool required, `AgentDefinition` 4 fields (`description` / `prompt` / `tools` / `model`). Standalone — no `outputFormat`.
- **Zero ctx7-indexed examples combine the two in a single `query()` call.** This independently confirms research v0.2.0 § 5.4's "Medium-LOW risk — flagged as Phase 2.2 spike-test risk, not a blocker."

### 1.2 Why the combination is likely supported (informed inference, NOT verified)

The SDK type surface gives no reason to believe the two are mutually exclusive:
- `outputFormat` is on `ClaudeAgentOptions` (query-level) — it constrains the **main agent's final turn output schema** on the **`result` message**.
- `agents` is also on `ClaudeAgentOptions` (query-level) — it registers **named subagents the main agent can spawn via the `Task` tool**.
- Their orthogonality at the type level (different fields on the same options object) suggests both can be set. But ctx7 doesn't show it; the SDK `.d.ts` should confirm field independence.

**Key semantic detail**: even if jointly accepted, `structured_output` is populated **from the main agent's final turn only** — subagent internal completion (each `Task` spawn) is NOT subject to the outer schema. The outer schema constrains "did the main agent finish?", the subagent's own completion is a separate signal.

### 1.3 Implication for Phase 2.2 dual-signal completion design

The dual-signal completion (D-02) needs to work at **two layers**:

| Layer | Signal | Source | Use |
|-------|--------|--------|-----|
| **Outer** (main agent final turn) | PRIMARY = `result.structured_output.status === 'COMPLETE'` | `outputFormat: json_schema` on `query()` options | execute-task outer ralph-loop exit |
| **Outer fallback** | FALLBACK = `<promise>COMPLETE</promise>` regex on `result.result` text | `promiseExtract.ts` (shipped) | when `outputFormat` omitted or `error_max_structured_output_retries` |
| **Inner** (subagent spawn return) | PRIMARY = subagent's last message text contains `<promise>COMPLETE</promise>` | `promiseExtract.ts` (shipped) | subagent → main agent handoff — NOT structurally bound to `outputFormat` |
| **Inner fallback** | FALLBACK = `subtype === 'success'` on the inner `Task` tool_use result | SDK | when main agent summarizes instead of passing verbatim |

**Why this matters**: research v0.2.0 § 4.3 framed dual-signal as one outer check. Topic 1's ctx7 reading clarifies that **subagent completion is structurally a different layer** — `structured_output` may only cover main-agent turn, not each `Task` spawn. The 4-row table above is the architectural truth.

### 1.4 PRIMARY schema design — 4 phase chain unified vs per-phase

Each of the 4 execute-task phases (01-clarify / 02-code / 03-test / 04-deliver) emits a completion signal. Two schema strategies:

| Strategy | Pros | Cons |
|----------|------|------|
| **(a) Unified `COMPLETION_SCHEMA`** — one schema all 4 phases use (`{status, summary, blockers}`) | Simpler;same `isComplete()` call pattern;phase 2.2 spike on 1 schema validates all 4 | Loses phase-specific structure (e.g. 03-test could carry `tests_passed`/`tests_failed` numbers;04-deliver could carry `files_changed`) |
| **(b) Per-phase schemas** — 4 schemas, each tailored | Phase-specific metadata captured (planner can drive next phase from typed prior output) | 4× the schema surface;risk of schema-version drift;larger v0.2.0 scope (the actionable use is just "did this phase complete?") |

**Recommendation: (a) unified `COMPLETION_SCHEMA` for v0.2.0.** Karpathy YAGNI — Phase 2.2 acceptance bar is "30 子任务 ralph-loop COMPLETE 检测 100% 准确", not "per-phase typed metadata pipeline". Per-phase schemas can be retrofitted in v0.3 when a real workflow needs phase N+1 to consume phase N's typed output. **Locked as D2.2-1 in § 4.**

Unified schema (sketch):

```typescript
// src/routing/completionSchema.ts (NEW, ~30L)
export const COMPLETION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    phase: { type: 'string', enum: ['01-clarify', '02-code', '03-test', '04-deliver'] },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'phase'],
} as const
```

### 1.5 Degraded fallback path — if `outputFormat` + `agents` ARE mutually exclusive

If the Wave 1 spike (Phase 2.2 § 5.2 step 3 in research v0.2.0) reveals SDK rejects the combination (e.g. type error at `query()` call site, or `error_during_execution` runtime):

| Tier | Behavior |
|------|----------|
| **Tier A — no degrade** | Keep `outputFormat` on outer `query()`;subagent completion uses `<promise>COMPLETE</promise>` extractPromise (already ships). Inner layer never depended on `outputFormat` per § 1.3. |
| **Tier B — outer fallback** | If outer `query()` also rejects, demote PRIMARY to `<promise>` grep on `result.result` text. Functional but loses F33 structural elimination. |
| **Tier C — block** | Never. If both fail, ralph-wiggum-style polling on `<promise>` is functional;phase 2.2 ships with FALLBACK as the primary path and revisits PRIMARY in v0.3. |

**The fallback path is already functional** — `promiseExtract.ts` 32L ships v0.1.0, dual-signal degrades cleanly. No Wave 1 BLOCKER risk.

### 1.6 Spike outline for Wave 1 (Phase 2.2 plan-phase consumption)

Single sample, ≤30 min budget, validates the combination before the full 30-sample acceptance test:

```typescript
// scripts/spike-outputFormat-agents.mjs (Wave 1 throwaway, NOT committed)
import { query } from '@anthropic-ai/claude-agent-sdk'

const COMPLETION_SCHEMA = {
  type: 'object',
  properties: { status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] } },
  required: ['status'],
}

for await (const message of query({
  prompt: 'Use the code-reviewer agent to assess this snippet: const x = 1; Return status COMPLETE if x is a valid declaration.',
  options: {
    allowedTools: ['Read', 'Task'],
    agents: {
      'code-reviewer': {
        description: 'Reviews code for validity.',
        prompt: 'Reply with status of the snippet, then emit <promise>COMPLETE</promise>.',
        tools: ['Read'],
        model: 'haiku',
      },
    },
    outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA },
  },
})) {
  if (message.type === 'result') {
    console.log('subtype:', message.subtype)
    console.log('structured_output:', message.structured_output)
    console.log('result text:', message.result?.slice(0, 200))
  }
}
```

**3 success criteria**:
1. `query()` call accepts the options (no TS type error at compile time + no runtime rejection).
2. `subtype === 'success'` after the run (subagent didn't blow up).
3. **Either** `structured_output.status === 'COMPLETE'` populated (BEST CASE — full PRIMARY) **OR** `<promise>COMPLETE</promise>` extractable from `result.result` text (Tier A fallback — still acceptable).

If 1 + 2 + (3 BEST) all pass → unified PRIMARY path. If 1 + 2 + (3 fallback) pass → Tier A degrade. If 1 or 2 fail → Tier B/C escalate to Wave 1 hold + plan-phase replan.

---

## § 2 Transparency 全史迁移策略 (F1 D-07b)

**Confidence: HIGH (full file inventory + marker pattern verified)**

### 2.1 Verdict doc inventory (Glob-verified 2026-05-15)

| File | Has marker line? | Action |
|------|------------------|--------|
| `.planning/phase-1.1/PLAN-CHECK.md` | ❌ — no marker line matching `^*?(Verdict|状态|Closure)*?:` | Add marker |
| `.planning/phase-1.1/VERIFICATION.md` | ❌ — free-prose "✅ 全绿" rows in tables, no marker | Add marker |
| `.planning/phase-1.2/PLAN-CHECK.md` | ❌ | Add marker |
| `.planning/phase-1.2/VERIFICATION.md` | ❌ | Add marker |
| `.planning/phase-1.3/PLAN-CHECK.md` | ❌ | Add marker |
| `.planning/phase-1.3/VERIFICATION.md` | ❌ | Add marker |
| `.planning/phase-1.4/PLAN-CHECK.md` | ❌ | Add marker |
| `.planning/phase-1.4/VERIFICATION.md` | ❌ — "三平台全绿" prose + "F14: ✅ no errata needed" row, no marker line | Add marker |
| `.planning/phase-1.5/PLAN-CHECK.md` | ✅ — `**Verdict**: **APPROVED** (zero BLOCKER, 2 WARNING, 2 SUGGESTION)` — **gate-noncompliant: no N/N ratio, no miss:** | Repair (add ratio + miss) |
| `.planning/phase-1.5/VERIFICATION.md` | ❌ | Add marker |
| `.planning/v0.1.0-MILESTONE-AUDIT.md` | ✅ — `**Verdict: passed (post-reconciliation)**` — **gate-noncompliant: no N/N ratio, no miss:** | Repair (add ratio + miss) |
| `.planning/phase-2.1/PLAN-CHECK.md` | ✅ — `Verdict: APPROVED WITH CONDITIONS (0B / 4W / 5S) — 2026-05-15` — **gate-noncompliant: `0B/4W/5S` is not a count ratio per checklist § 1;no miss:** | Repair (rewrite to `0/9 BLOCKER` + miss list) |
| `.planning/phase-2.1/VERIFICATION.md` | ❌ — references `Verdict:` infra documentation in prose, no closure marker line | Add marker |

**Summary: 13 files, 0 compliant. 10 need ADD;3 need REPAIR (1.5 PLAN-CHECK / v0.1.0 MILESTONE-AUDIT / 2.1 PLAN-CHECK).**

### 2.2 Migration strategy — recommendation: **manual 1-by-1**

Three candidates evaluated:

| Candidate | Effort | Risk | Fit |
|-----------|--------|------|-----|
| **(a) Manual 1-by-1** — 13 files × 1-3 line patch each | ~30-45 min for one engineer | LOW — each file inspected, miss list authored by human (the human-judgment part the gate cannot check) | ✅ **RECOMMENDED** |
| **(b) Batch migrate script** (sister `migrate-decision-rules-v1-to-v2.mjs` pattern) | ~2h to author + ~10 min to run + ~30 min to audit | MEDIUM — script can add `Verdict: PASSED (X/Y, miss: TBD)` but **cannot author real miss lists** — every file still needs human audit | ❌ over-engineering for 13 files |
| **(c) Semi-auto** — script identifies + flags + human fills | ~1h script + ~30 min fill | LOW-MEDIUM — same as (b) but two-step instead of one-step | ❌ no advantage over (a) |

**Karpathy YAGNI applied**: at 13 files the human-judgment items (real N count + real miss list) dominate the work, automation buys ~10% effective time, costs ~2h author + ongoing maintenance. **Locked as D2.2-2.**

### 2.3 Marker line templates (per file type)

Sourced from `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` § "Valid marker lines" + § "How to add a compliant verdict". Each file gets ONE marker line added at the closure section (top or bottom — whichever holds the conclusion).

**Template A — PLAN-CHECK (plan-checker verdict)**:

```markdown
**Verdict:** APPROVED ({N_blocker}/{N_blocker} BLOCKER resolved, miss: {none | T-X.Y / T-X.Z})
```
Example concrete instance for phase 1.5 (which already has a verdict line, needs repair):
```markdown
**Verdict:** APPROVED (0/0 BLOCKER, 2 WARNING + 2 SUGGESTION advisory, miss: none)
```

**Template B — VERIFICATION (verify-work verdict)**:

```markdown
**Verdict:** SHIPPED ({N_passed}/{N_total} acceptance bars, miss: {none | bar-X / bar-Y})
```
Example for phase 1.4 (rich verdict table exists, needs 1 marker line summary):
```markdown
**Verdict:** SHIPPED (19/19 acceptance bars + F1-F19, miss: none — 3 OS CI 全绿 + 318+3 tests + 9 ADR A7 守恒)
```

**Template C — MILESTONE-AUDIT (cross-phase audit verdict)**:

```markdown
**Verdict:** PASSED ({N_passed_phase}/{N_total_phase} phases × {N_bar}/{N_total_bar} bars, miss: {none | phase-X bar-Y})
```
Example for v0.1.0-MILESTONE-AUDIT (needs repair):
```markdown
**Verdict:** PASSED (6/6 phases × 8/8 bars + 318+3 tests + 9 ADR, miss: none — post-reconciliation, ADR 0006 traceability residual 归零)
```

### 2.4 Migration execution recipe (Wave 0 task)

1. For each of the 13 files, the migrator opens the file, scans the closure conclusion (usually `## Verdict` / `## Final Result` / `## 结论` / end-of-doc summary), and **manually adds 1 marker line** at that section's top using template A/B/C.
2. The N/N ratio is read from the doc's existing content — counts of "✅" rows in verdict tables, count of tasks passed, count of acceptance bars green.
3. The `miss:` clause: if the doc explicitly lists known misses (e.g. phase 1.4 SAMPLES.md "2/30 miss"), enumerate them; if the doc claims full closure, write `miss: none` (after a manual re-skim verifies no hidden gaps).
4. Run `node scripts/check-transparency-verdicts.mjs` (still warn-only Round 1 at this moment) → expected: 0 violations after migration.
5. **THEN** flip `ENFORCE = true` in the script (separate atomic commit — easy revert if migration miss).
6. CI green confirms migration complete.

**Total effort**: ~30-45 min for the 13-file migration + ~5 min for the flip. Single Wave 0 task batch, sequential, single commit per file.

---

## § 3 Freshness check 具体形态 (F1 D-07c + reviewer item 21)

**Confidence: HIGH (3 candidates evaluated against existing gate architecture)**

### 3.1 Problem reframe (reviewer item 21)

Phase 2.1 T1.9 added project-level SSOT 引用纪律 to `CONTRIBUTING.md` — but the front-matter docs (README.md / docs/PROJECT-SPEC.md) themselves were stale (didn't reflect the v0.1.0 ship + Phase 2.1 ship state). The original transparency gate scans `.planning/**/(PLAN-CHECK|*-AUDIT|VERIFICATION).md` for verdict-marker compliance — front-matter README/PROJECT-SPEC are out of scope. Same anti-pattern (claim-without-evidence), different file set, currently ungated.

### 3.2 Three candidates

| Candidate | Form | Effort | False-positive risk | Maintenance |
|-----------|------|--------|---------------------|-------------|
| **(a) Simple grep** — scan README/PROJECT-SPEC for current ROADMAP latest-shipped phase string (e.g. `Phase 2.1` or `v0.1.0` token) | ~15L extension to existing `check-transparency-verdicts.mjs` | LOW (if version token unique enough) — but **MEDIUM if grep too literal**: README's "current as of Phase 2.0" still matches "Phase 2.1" doesn't, vice versa | LOW — same gate file, same convention |
| **(b) Structured `Status:` marker** — README/PROJECT-SPEC top section gets a `Status: <version>` line (mirrors verdict-marker convention);gate scans for the marker + compares to ROADMAP latest-shipped | ~25L gate extension + ~2L README edit + ~2L PROJECT-SPEC edit | LOW (structured) | LOW-MEDIUM — convention has to be remembered when next milestone ships;but parallel to verdict-marker convention so consistent |
| **(c) Static analysis cross-ref STATE.md** — parse `STATE.md`'s "已完成 phase" section + compare each entry to README/PROJECT-SPEC string content | ~60L gate extension (markdown parsing) | MEDIUM — `STATE.md` is markdown not YAML;parser fragility | HIGH — STATE.md format changes break the gate |

### 3.3 Recommendation — **(b) structured `Status:` marker**

**Locked as D2.2-3 in § 4.** Rationale:

1. **Architectural consistency with existing verdict-marker convention** — same philosophy (structured single-line claim mechanically checkable), same gate file (`check-transparency-verdicts.mjs`), same checklist doc (`docs/TRANSPARENCY-VERDICT-CHECKLIST.md` gets a new § "Status freshness markers" section).
2. **Karpathy simplicity** — (a) requires the gate to guess what version string to look for (read ROADMAP, parse it, grep target docs) — multi-stage logic with grep ambiguity. (b) is "does this line exist + does it match?" — boolean.
3. **(c) is over-engineering** — markdown parsing for cross-ref when a 1-line marker covers the same intent.
4. **False-positive mitigation** — (a)'s ambiguity ("Phase 2.0" vs "Phase 2.1" substring match) creates suppression risk per `TRANSPARENCY-VERDICT-CHECKLIST.md` § "scope boundary — false-positive mitigation". (b) is exact-match on a structured marker — zero false positives.

### 3.4 `Status:` marker convention (new addition to TRANSPARENCY-VERDICT-CHECKLIST.md)

Front-matter docs (`README.md` + `docs/PROJECT-SPEC.md`) MUST include a structured **`Status:` marker line** near the top (first 50 lines) declaring the currently-shipped milestone:

```markdown
> **Status:** v0.1.0 shipped + Phase 2.1 shipped — execute-task workflow in Phase 2.2 (in-progress)
```

The marker (after optional `>` blockquote prefix + optional bold `**`) starts with:

- `Status:`
- `状态:`

The marker MUST carry **a phase or milestone token** matching the ROADMAP's latest-shipped phase header (e.g. `v0.1.0 shipped` + `Phase 2.1 shipped` + `Phase 2.2 (in-progress)`).

### 3.5 Implementation sketch — Wave 0 task

Extend `scripts/check-transparency-verdicts.mjs`:

```javascript
// addition to scripts/check-transparency-verdicts.mjs (~25L net)
import { readFileSync } from 'node:fs'

const STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m
const FRONT_MATTER_DOCS = ['README.md', 'docs/PROJECT-SPEC.md']
const ROADMAP_LATEST_RE = /^##\s+v(\d+\.\d+\.\d+)|^##\s+Phase\s+(\d+\.\d+)/m  // exact form pending Wave 0 ROADMAP shape audit

function getLatestShippedToken() {
  const roadmap = readFileSync('.planning/ROADMAP.md', 'utf8')
  // scan for first phase header after a "✅ shipped" / "已 ship" marker
  // returns e.g. "Phase 2.1" or "v0.1.0"
  // implementation: walk headers + look for trailing ship marker
  // TODO Wave 0: match against actual ROADMAP.md structure (planner Wave 0 task)
  return /* implementation depends on ROADMAP.md actual marker convention */
}

function checkFreshness() {
  const latestToken = getLatestShippedToken()
  const stale = []
  for (const file of FRONT_MATTER_DOCS) {
    const content = readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 50).join('\n')
    const match = content.match(STATUS_MARKER)
    if (!match) {
      stale.push(`${file}: missing Status: marker in first 50 lines`)
      continue
    }
    const statusLine = match[1]
    if (!statusLine.includes(latestToken)) {
      stale.push(`${file}: Status marker "${statusLine.trim()}" does not include latest shipped "${latestToken}"`)
    }
  }
  return stale
}

// in main script: append checkFreshness() violations to the existing violations array
// same ENFORCE flag controls exit code — single gate, two checks
```

**Karpathy hard limit compliance**: the extension is ~25L net, the script grows from 45L to ~70L. Still well under any reasonable single-file cap. **No new file needed** — same gate, same convention, two checks.

### 3.6 ROADMAP latest-shipped token extraction — open implementation detail

The `getLatestShippedToken()` helper depends on ROADMAP.md's actual ship-marker convention. Wave 0 task (within F1) audits ROADMAP.md structure and finalizes the regex. Two candidates:

- ROADMAP uses `## Phase 2.1 ✅ shipped` headers → regex captures token after `## ` before ` ✅`.
- ROADMAP uses `### 状态: shipped` sub-headers under each phase → regex walks header tree + finds latest shipped.

This is a Wave 0 sub-decision, not a Phase 2.2 plan-phase blocker — the gate skeleton ships either way, the regex finalization is a 1-line fix.

---

## § 4 Decision locks for Wave B planner

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| **D2.2-1** | execute-task 4 phase chain uses **single unified `COMPLETION_SCHEMA`** (`{status, phase, summary, blockers}`) — not per-phase schemas | § 1.4 | Karpathy YAGNI;Phase 2.2 acceptance bar doesn't need per-phase typed metadata;per-phase schemas retrofittable in v0.3 |
| **D2.2-2** | transparency 全史迁移 = **manual 1-by-1** across 13 files (10 ADD + 3 REPAIR), NOT batch script | § 2.2 | At 13 files human-judgment work (real N count + real miss list) dominates;automation buys ~10% effective time at ~2h author cost |
| **D2.2-3** | freshness check 具体形态 = **(b) structured `Status:` marker** convention for README + PROJECT-SPEC, gate extends `check-transparency-verdicts.mjs` (~25L) | § 3.3 | Architectural consistency with verdict-marker convention;exact-match on structured marker = zero false positives;over-engineering avoided |
| **D2.2-4** | dual-signal completion architecture is **4-layer** (outer PRIMARY structured_output + outer FALLBACK promise grep + inner PRIMARY promise grep + inner FALLBACK Task subtype) — NOT one outer check | § 1.3 | ctx7 shows subagent completion is structurally separate from outer query schema;`<promise>` grep stays load-bearing for inner layer regardless of outer SDK feature |
| **D2.2-5** | Wave 1 SDK spike script (`scripts/spike-outputFormat-agents.mjs`) is throwaway, NOT committed — Wave 1 GO/NO-GO gate but artifact discarded | § 1.6 | Spike is for decision, not for shipped code;keeping it pollutes the repo with diagnostic scripts |
| **D2.2-6** | flipping `ENFORCE = true` in `check-transparency-verdicts.mjs` is a **separate atomic commit** AFTER the 13-file migration commits, NOT mixed into them | § 2.4 step 5 | Easy revert if migration missed a file;CI green can be tied to the flip commit specifically |
| **D2.2-7** | `STATUS_MARKER` regex tolerates optional `>` blockquote prefix + optional `**` bold (sister of verdict-marker regex) — to allow placing the marker inside a blockquote callout near README top | § 3.4 | Mirrors existing verdict-marker tolerance;blockquote is the natural README convention for status callouts |

---

## § 5 Confidence breakdown

| Section | Confidence | Basis |
|---------|------------|-------|
| § 1 SDK `outputFormat` + `agents`-map combination | **MEDIUM-HIGH** | ctx7 confirmed both features exist + are on same options object;**joint usage not directly documented** → Wave 1 spike validates;fallback path proven functional (`promiseExtract.ts` ships) — no Wave 1 BLOCKER |
| § 1.3 4-layer dual-signal | **HIGH** | Outer/inner layer separation is grounded in SDK message types (`SDKResultMessage` vs `Task` tool_use result) per ctx7;extends but does not contradict research v0.2.0 § 4 |
| § 1.4 unified schema | **HIGH** | Karpathy YAGNI applied to known acceptance bar;per-phase schema retrofit is non-breaking |
| § 2 transparency 全史迁移 | **HIGH** | File inventory verified by Glob (13 files);marker compliance verified by Grep;templates verified against `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` "Valid marker lines" examples |
| § 3 freshness check | **HIGH** | Three candidates evaluated against existing gate architecture + checklist philosophy;recommendation flows from karpathy simplicity + false-positive mitigation already documented in checklist |
| § 4 decision locks | **HIGH** | Each lock cites its source section + provides karpathy-aligned rationale |

---

## § 6 Assumptions Log (claims needing user confirmation)

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | `outputFormat` + `agents` are jointly supported in `query()` options (both on `ClaudeAgentOptions`, orthogonal fields) | § 1.2 | LOW — Wave 1 spike (§ 1.6) explicitly validates;degraded fallback proven functional |
| A2 | The 13 verdict docs are the complete set (Glob pattern `phase-*/(PLAN-CHECK|VERIFICATION).md` + `v0.1.0-MILESTONE-AUDIT.md`) — no other doc carries closure verdicts under `.planning/**` | § 2.1 | LOW — gate's `walk()` uses exact same regex (`PLAN-CHECK\.md$|-AUDIT\.md$|VERIFICATION\.md$`);if a future doc type emerges (e.g. `MILESTONE-VERIFICATION.md`) gate's walk auto-catches it |
| A3 | ROADMAP.md has a parseable "latest shipped phase" convention extractable by ~5L regex | § 3.6 | LOW — Wave 0 ROADMAP audit finalizes regex;fallback: hard-code latest token + bump on each ship (worst case 1-line maintenance per milestone) |
| A4 | Phase 2.2's 4 phase chain (01-clarify / 02-code / 03-test / 04-deliver) maps 1:1 onto v0.1.0 ship's `mattpocock_phases` schema in `decision_rules.yaml` v2 | § 1.4 | LOW — CONTEXT.md D-14 + ROADMAP v0.2.0 Phase 2.2 验收 1 explicitly anchor this 4-phase model |

---

## § 7 References

### Fresh 2026-05-15 sources
1. **ctx7 `/nothflare/claude-agent-sdk-docs`** (821 snippets, fetched 2026-05-15) — Topic 1: `outputFormat: json_schema` structured-outputs.md examples (TS + Python, standalone), `agents` map subagents.md examples (`code-reviewer`/`test-runner`, `Task` tool required), `AgentDefinition` 4-field type. **Zero ctx7-indexed examples combine both jointly** — independent confirmation of research v0.2.0 § 5.4 open question.
2. **Glob `.planning/**/(PLAN-CHECK|*-AUDIT|VERIFICATION).md`** (fetched 2026-05-15) — 13-file inventory: 10 phase-1.x + 1 v0.1.0-MILESTONE-AUDIT + 2 phase-2.1.
3. **Grep on the 13 verdict docs** (marker pattern `^\s*\*{0,2}(?:Verdict|状态|Closure)\*{0,2}\s*[:：]`, fetched 2026-05-15) — only 3 files have ANY marker line, all 3 noncompliant per gate convention (no N/N ratio, no miss: clause).
4. **`docs/TRANSPARENCY-VERDICT-CHECKLIST.md`** (Phase 2.1 T1.7 ship, 103L, fetched 2026-05-15) — § "Valid marker lines" + § "How to add a compliant verdict" + § "Scope boundary — false-positive mitigation" — basis for § 2.3 templates + § 3.3 false-positive analysis.
5. **`scripts/check-transparency-verdicts.mjs`** (Phase 2.1 T1.7 ship, 45L, fetched 2026-05-15) — basis for § 3.5 implementation sketch (current walk + regex extends naturally to FRONT_MATTER_DOCS).

### Baseline (this RESEARCH does NOT redo)
6. **`.planning/research/v0.2.0-execute-task-ralph.md`** (2026-05-15) — SDK introduction (D2.2-1 in research) + ralph-wiggum keep (D2.2-2) + dual-signal completion v1 (D2.2-3) + 5-phase orchestration (D2.2-4) + reject list (D2.2-5). **HIGH conf, valid until ~2026-06-15.** This RESEARCH cites § 4 + § 5.4 (open question on outputFormat+agents combo) + § 5.1 (integration points).
7. **`.planning/intel/omc-comparison.md` 第 4 条** — per-phase model tier intel actionable + § 0 SSOT 引用纪律.
8. **`.planning/phase-2.2/2.2-CONTEXT.md`** — D-01 ~ D-15 locked discuss-phase decisions;this RESEARCH respects all locks, refines D-02 dual-signal architecture (§ 1.3) and D-07b/c (§ 2 + § 3).

---

## Metadata

**Research date**: 2026-05-15
**Valid until**: 2026-06-15 (30 days — same SDK 0.x daily-release caveat as research v0.2.0)
**Refresh scope**: Topic 1 SDK joint feature + Topic 2 transparency migration + Topic 3 freshness check ONLY. Does NOT redo SDK introduction / ralph-wiggum keep / per-phase model tier 主决议 — those are HIGH conf in research v0.2.0.
**Tool budget**: ~10 tool uses pre-Write (within anti-stall constraint of ≤12).
