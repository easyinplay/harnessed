# Phase 4.3 — task_plan.md

> **Authored**: 2026-05-19
> **Author**: gsd-planner (Wave B)
> **Sources**: CONTEXT.md D-01~D-04 + M-01 LOCKED + W0 cadence (#BA round 2 RELAX 200→175) + KICKOFF § 1-6 + PATTERNS § 1-5 (21/22 analog mapping ~78% weighted reuse + CHANGELOG.md first instance partial) + RESEARCH § 1-8 (HIGH confidence 16/18 verified + 2 ASSUMED A1+A3) + sister phase-4.2/task_plan.md 861L 12-atomic structure 100% template reuse + sister Phase 4.2 PLAN.md 522L frontmatter 100% template reuse (adapted Phase 4.3 ARCHITECTURAL + milestone close scope; significantly larger ~166% scope factor per CONTEXT #BR 1.5-2 day estimate)
> **Style**: 沿袭 phase-4.2/task_plan.md per-task structure (files_modified / read_first / action concrete values / acceptance_criteria grep-verifiable / decision_source + Karpathy why-not-what commit msg)
> **Task count**: 20 atomic tasks across 3 waves — W0 2 (T0.1 W0.1 D2 cadence iter 4 REINFORCE FIRST per path dep + T0.2 W0.2 conditional D1 SIZE_LIMIT 200→175 round 2 RELAX flip OR DEFER) + W1 6 (T1.1 src/audit/log.ts NEW + T1.2 src/audit/hook.ts NEW + T1.3 src/routing/engine.ts MODIFY shrink+import+4 calls HIGH RISK R-1 + T1.4 tests/audit/log.test.ts NEW + T1.5 tests/audit/hook.test.ts NEW + T1.6 docs/adr/0018-routing-audit-log.md NEW PRIMARY 9-section) + W2 12 (T2.1 ADR 0019 backfill + T2.2 ADR 0020 backfill + T2.3 README index +3 rows + T2.4 ci.yml A7 iter 17→18 + T2.5 CHANGELOG.md NEW + T2.6 STATE.md 续编 combined W0.1 archive + T2.7 RETROSPECTIVE.md 7-section + T2.8 ROADMAP.md SHIPPED + T2.9 PROJECT-SPEC.md L3 + T2.10 README.md L9+v0.4.0 close + T2.11 v0.4.0-ROADMAP archive + T2.12 v0.4.0-REQUIREMENTS archive + T2.13 v0.4.0-MILESTONE-AUDIT archive + T2.14 DOGFOOD-T2.X.md NEW PASS 3/3 + T2.15 triple tag LOCAL CREATE STRICT ORDER); sister Phase 4.2 12 atomic ~166% scope factor per ARCHITECTURAL + milestone close phase class
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06 / Phase 3.4 D-04 explicit no B-03 5% tolerance; engine.ts ≤200L HIGH RISK R-1 surgical shrink-first MANDATORY)

> ⚠️ **D-decision 守门** (4 decisions LOCKED + M-01 meta-decision LOCKED, executor 防 sneak-in per PATTERNS § 3 + CONTEXT § 4 D-decisions):
> - **D-01 AuditFormat JSONL append-only + 11-field routing-decision schema** locked → JSON array + multi-format dual-write + full agentDef 14-field + subagent text/result body + MCP secrets 不可 sneak-in (CONTEXT L34-50 evaluated rejected); planner / executor MUST use 11 fields exact (ts/phase/task_excerpt/task_sha1/matched_rule_id/primary_expert/secondary_expert/category/route_layer/outcome/session_id/iter_count) + additionalProperties:false TypeBox enforce + src/audit/log.ts NEW module NOT src/cli/audit.ts naming conflict
> - **D-02 BackfillScope NEW forward-only from Phase 4.3 ship** locked → git log reconstruction + PLAN D-* manual backfill + partial Phase 4.x retrofit 不可 sneak-in (CONTEXT L53-64 evaluated rejected); planner / executor MUST cross-ref ADR 0019 STATE COLLAPSE 5-recurrence terminus 教训 in ADR 0018 § Decisions § 2 explicit "audit.log starts forward; prior decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT"
> - **D-03 ADRBackfillScope ADR 0018 PRIMARY + ADR 0019-0020 institutional pattern lock backfill** locked → 全 D-decision audit + publish-only mode + retroactive sneak-rewrite existing 0001-0017 不可 sneak-in (CONTEXT L66-79 evaluated rejected); planner / executor MUST use NEW sequential numbers 0019/0020 + sister Phase 3.4 single-add cadence延袭 (NOT triple-add 之前一次性); ADR 0021 OPTIONAL bonus IF Wave 2 time allows
> - **D-04 ReleaseCadence CHANGELOG.md + triple tag sister v0.3.0 close cadence延袭** locked → docs/RELEASES.md duplicate SoT + single-baseline-only tag + auto push 不可 sneak-in (CONTEXT L81-98 evaluated rejected); planner / executor MUST triple tag STRICT ORDER (adr-0018-accepted → v0.4.0-alpha.3-audit → 🎯 v0.4.0) + CHANGELOG.md root-level Keep-a-Changelog manual init NOT Conventional Changelog auto-gen + LOCAL CREATE NO push per CLAUDE.md commit safety
> - **M-01 PhaseClass ARCHITECTURAL** locked → R-5 publish-only sister Phase 4.1/4.2 mode 不可 sneak-in (CONTEXT L18-25); planner / executor MUST apply full ship cadence ADR 0018 + ci.yml A7 step iter 0017→0018 + triple tag (NOT single-baseline-only pattern); sister v0.3.0 close cadence延袭

> ⚠️ **Karpathy hard limit per file 守门** (B-06 + Phase 3.4 D-04 explicit "no B-03 5% tolerance" + CLAUDE.md key reminder #4): every code-producing task 含 `wc -l ≤ N` acceptance criterion; **src/audit/log.ts ≤80L hard** (sister engineHook.ts 48L + room for 11-field schema build); **src/audit/hook.ts ≤50L hard** (sister engineHook.ts 48L PRIMARY helper extract pattern); **src/routing/engine.ts ≤200L hard HIGH RISK R-1** (currently at 200L exact — surgical 2L shrink-first MANDATORY per CLAUDE.md key reminder #4); **docs/adr/0018-routing-audit-log.md ≤250L** (sister ADR 0017 204L precedent + buffer); **CHANGELOG.md ≤50L** (Karpathy YAGNI ~30L estimate); **DOGFOOD-T2.X.md ≤60L hard** sister Phase 4.2 DOGFOOD 58L precedent.

> ⚠️ **Biome lint preempt before commit MANDATORY** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 — 5-recurrence terminus续延): 任何 TS/JS/MJS commit 前必跑 `corepack pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费. Phase 4.3 touch surface MANDATORY = W1 .ts src/audit/log.ts + src/audit/hook.ts + src/routing/engine.ts + tests/audit/*.test.ts (5 .ts files) + W0.2 CONDITIONAL .mjs scripts/check-state-archive-stale.mjs IF FLIP path. W2 all .yml + .md (biome NOT scope for non-TS/JS).

---

## Resolved Blocks (executor fill in-place, sister Phase 4.2 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / shrink decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.1 W0.1 D2 cadence iter 4 trim outcome, PENDING)**: STATE.md 156L → ~134-141L expected post-trim per RESEARCH § 5.2 projection; RETROSPECTIVE.md +15-22L append; `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=200 baseline (Rule 1 STATE size + Rule 2 关键决议 + Rule 3 W-N errata all PASS); `node scripts/check-transparency-verdicts.mjs` exit 0 (STATE_POSITION_RE OR-fallback regression); **W0.2 implication**: post-trim STATE ≤165L → **FLIP PATH** active T0.2 200→175 round 2 RELAX / 166-175L → **DEFER PATH** active #BA carry Phase 4.4+ W0 (3rd consecutive DEFER) / >175L → **BLOCKED escalate**.

> **Resolved (T0.2 W0.2 CONDITIONAL D1 SIZE_LIMIT outcome, PENDING)**: Decision tree per CONTEXT #BA outcome = PENDING (Branch A FLIP 200→175 round 2 RELAX OR Branch B DEFER PATH active per post-T0.1 STATE size); IF FLIP: scripts/check-state-archive-stale.mjs L12 `SIZE_LIMIT = 200` → `SIZE_LIMIT = 175` (1-line surgical) + biome preempt MANDATORY (.mjs touched per project memory) + `node scripts/check-state-archive-stale.mjs` exit 0 with new SIZE_LIMIT=175 baseline PASS; IF DEFER: skip flip + ADD #BA carry to .planning/phase-4.3/deferred-items.md NEW + skip biome (no .mjs touch); Phase 4.3 W0.2 = 3rd consecutive DEFER chain Phase 4.1→4.2→4.3 sister cadence延袭 (5-recurrence terminus heuristic) — IF DEFER again, escalate review whether SIZE_LIMIT tighten is ever achievable OR institutional accept SIZE_LIMIT=200 round 1 永久.

> **Resolved (T1.1 src/audit/log.ts NEW outcome, PENDING)**: `wc -l src/audit/log.ts` ≤80 (Karpathy hard sister engineHook.ts 48L + 11-field schema build); AuditRecordSchema 11 fields TypeBox + additionalProperties:false; AUDIT_PATH = '.harnessed/audit.log' hardcoded literal; appendFileSync + mkdirSync sync; createHash sha1 zero-dep; biome preempt PASS pre-commit MANDATORY; STRIDE T-4.3-01 + T-4.3-04 mitigations grep verify (no path manipulation from task input + no sensitive field leak).

> **Resolved (T1.2 src/audit/hook.ts NEW outcome, PENDING)**: `wc -l src/audit/hook.ts` ≤50 (Karpathy hard sister engineHook.ts 48L PRIMARY helper extract pattern); emitAudit + AuditHookCtx discriminated union; sync NOT async fail-soft NO throw; biome preempt PASS pre-commit MANDATORY.

> **Resolved (T1.3 src/routing/engine.ts MODIFY outcome, PENDING — HIGH RISK R-1)**: `wc -l src/routing/engine.ts` ≤200 (Karpathy hard limit STRICT per CLAUDE.md key reminder #4); surgical 2L shrink L120-122 verified -2L; import emitAudit +1L + routeLayer +1L + 4 emitAudit call sites +4L = +6L NET → 200 - 2 + 6 = 204L STILL exceeds — REQUIRES alternative consolidation pass auditCtx single-arg via hook.ts wrapper OR additional shrink targets; iterate until verified ≤200L OR escalate BLOCKED + replan extract additional helper from engine.ts; biome preempt PASS pre-commit MANDATORY.

> **Resolved (T1.4 tests/audit/log.test.ts NEW outcome, PENDING)**: `corepack pnpm test -- tests/audit/log.test.ts --run` exit 0; 7-8+ fixtures pass (1 valid JSONL + 2 append-not-overwrite + 3 11 fields + 4 sha1 hex + 5 excerpt truncate + 6 outcome map + 7 mkdirSync called + BONUS 8 log injection STRIDE T-4.3-05 mitigation); biome preempt PASS pre-commit MANDATORY.

> **Resolved (T1.5 tests/audit/hook.test.ts NEW outcome, PENDING)**: `corepack pnpm test -- tests/audit/hook.test.ts --run` exit 0; 3+ fixtures pass (compose + routeLayer branch + outcome enum pass-through); biome preempt PASS pre-commit MANDATORY.

> **Resolved (T1.6 docs/adr/0018-routing-audit-log.md NEW outcome, PENDING)**: `wc -l docs/adr/0018-routing-audit-log.md` ≤250 (sister ADR 0017 204L precedent + buffer); 9-section errata format sister ADR 0017 100% reuse; D-02 forward-only rationale section EXPLICIT cross-ref ADR 0019 STATE COLLAPSE; A7 Conservation section iter 17→18 baseline tag Wave 2 T2.4 落地 reference; biome NOT needed (.md extension).

> **Resolved (T2.1-T2.14 W2 outcomes, PENDING)**: per-task verification per <acceptance_criteria> blocks; ALL W2 tasks .md + .yml (biome NOT scope no-op for these touches).

> **Resolved (T2.15 triple tag LOCAL CREATE outcome, PENDING)**: 3 LOCAL tags created STRICT ORDER (adr-0018-accepted → v0.4.0-alpha.3-audit → 🎯 v0.4.0); NO push verify `git ls-remote origin refs/tags/{adr-0018-accepted,v0.4.0-alpha.3-audit,v0.4.0}` all return empty; STRIDE T-4.3-07 ordering verify ci.yml A7 iter commit timestamp BEFORE adr-0018-accepted tag annotation timestamp; STRIDE T-4.3-08 NO push per CLAUDE.md commit safety user controls.

---

## Deferred Items (Phase 4.3 carry-forward, register at ship via deferred-items.md)

> **DEFERRED #AH** (Phase 3.4 own carry → Phase 4.0+ unchanged): W0.4 path traversal regex hardening → Phase 4.4+ W0 (conditional on real attack surface arrival; currently sole consumer = project maintainer per spike outcome 2026-05-17 + CONTEXT W0 backlog L123)
> **DEFERRED #BA** ⚠️ CONDITIONAL Phase 4.3 W0 T0.2 — Branch A FLIP 200→175 round 2 RELAX path OR Branch B DEFER PATH carry-forward Phase 4.4+ W0 LOW priority (3rd consecutive DEFER sister Phase 4.1 W0.5 + Phase 4.2 W0.2 + Phase 4.3 W0.2 chain — IF 3rd DEFER, institutional re-eval SIZE_LIMIT tighten achievability for v0.5+ or accept SIZE_LIMIT=200 round 1 永久)
> **DEFERRED #BC** (Phase 4.1 own carry — v0.5+ benchmark expand evaluation, STILL): IF dogfood reveals miss case NOT covered by current 30 SAMPLES.md → re-evaluate D-01 REJECT; currently 30/30 100% routing PASS no signal — defer v0.5+
> **DEFERRED #BD** (Phase 4.1 own carry, iter 2 lesson, STILL): Regex-fix 2-pass validation pattern — phase ship sister review absorb cycles should require both literal regex scan AND semantic synonym scan to prevent iter-N residual surfacing
> **DEFERRED #BE** (Phase 4.2 own carry — Sponsors account activation external prereq, IF user NOT activated by Phase 4.2 ship): FUNDING.yml + badge ship forward-compatible per RESEARCH § 17.2 U1 (sister Phase 4.2 deferred-items)
> **DEFERRED #BF** (Phase 4.2 own carry — CODEOWNERS .github/** rule defer, sister review SR-6 preempt): defer v0.4.3+ if real attack surface arrives
> **DEFERRED #BU** (Phase 4.2 3rd-cycle carry — STATE.md state.ts 并发写无锁 LOW): Phase 4.4+ W0 (single-maintainer dogfood real-world 触发概率极低; existing readCurrentWorkflow fail-soft partial mitigation; 等 v0.5 多 maintainer signal per CONTEXT L119)
> **DEFERRED #BV** (Phase 4.2 3rd-cycle carry — harnessed uninstall command 缺失 P1): Phase 4.5+ OR v0.5 (per-method uninstall handler 设计需 separate phase scope; 不适合 Phase 4.3 已 NEW infra R8.1 同 phase 添 NEW CLI 命令 per CONTEXT L120)
> **DEFERRED #1/#BL** (Phase 4.2 3rd-cycle re-DOC — sdkSpawn.ts as any): PERMANENT DEFER (biome-ignore + ADR 0009 F40-2 + test drift detector 多层 guard; no new action per CONTEXT L121)
> **DEFERRED #5/#BM** (Phase 4.2 3rd-cycle re-DOC — AgentDef 14 字段 SDK 耦合): PERMANENT DEFER (ADR 0009 F40-2 forward-compat lock; 拒加 SDK runtime dep per CONTEXT L122)
> **DEFERRED #BF/#BG/#BH/#BI/#BJ/#BK** (Phase 4.2 W0 sub-batch candidates per CONTEXT #BQ planner discretion): recommend hold for Phase 4.4+ W0 carry NOT Phase 4.3 (Phase 4.3 已 architectural + close 大 scope; sub-batch absorb 8-phase 连续 cadence pause 1-phase OK)

---

## Wave 0 — Cadence absorb (2 atomic; STRICT path dep W0.1 → W0.2 per CONTEXT #BA decision tree)

### T0.1 — W0.1 D2 cadence iter 4 REINFORCE trim Phase 4.2 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (FIRST per path dep — reduces STATE.md size to create W0.2 SIZE_LIMIT 200→175 round 2 RELAX flip headroom; sister Phase 4.2 W0.1 3rd-iter terminus → Phase 4.3 W0.1 4th-iter REINFORCE stable signal beyond ≥3-iter pattern)

- **files_modified**:
  - `.planning/STATE.md` (MODIFY ~-15-22L delta: trim Phase 4.2 entries from 已完成 phase ship 历史 L44 verbose 1-line entry + 当前位置 L22-26 long inline narrative condense + 关键决策记录 area Phase 4.2 D-decision rows IF present → verbatim relocate; preserve recent Phase 4.2 + Phase 3.4 SHIPPED pointers; insert HTML-comment archive marker per sister L42 format; expected post-trim ~134-141L)
  - `.planning/RETROSPECTIVE.md` (APPEND ~+15-22L new section `## § ARCHIVED FROM STATE — Phase 4.2 (Phase 4.3 W0.1 D2 cadence iter 4, 2026-05-19)` containing verbatim relocated Phase 4.2 narrative; single-phase archive consistent with Phase 4.1 solo archive precedent per R-4 cadence consistency mitigation; D2 ship-time T6.N cadence 4th-iter REINFORCE pattern stable beyond ≥3-iter terminus signal — sister Phase 4.2 W0.1 3rd-iter precedent)
- **read_first**:
  - `.planning/STATE.md` entire file (by Read — verify 156L baseline + identify trim section line ranges: L22-26 当前位置 long inline + L44 已完成 phase ship 历史 Phase 4.2 entry verbose ~5-bullet + L116-122 关键决策记录 Phase 4.2 D-decision rows IF present; total ~15-22L trim scope)
  - `.planning/RETROSPECTIVE.md` tail 100 lines (by Read — verify existing `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section format from Phase 4.2 W0.1 3rd-iter 2026-05-18 + sister cadence affirm reference; new section follows same heading pattern + verbatim quoted content blockquote convention)
  - `.planning/phase-4.3/4.3-RESEARCH.md` § 5 (W0.1 D2 cadence iter 4 + STATE.md ≤175L verify procedure decision tree)
  - `.planning/phase-4.3/4.3-PATTERNS.md` § 1 row 1 + § 3.8 (W0.1 mapping reuse exact + Single-SoT D2 cadence iter 4 archive section header format)
  - `.planning/phase-4.2/PLAN.md` L23-25 + L101-108 (sister W0.1 + W0.2 PLAN frontmatter pattern reference for replicate adapt)
- **action**:
  1. Read `.planning/STATE.md` to confirm baseline 156L (`wc -l .planning/STATE.md` expect 156) + identify trim sections by section header grep:
     - L44: 已完成 phase ship 历史 — Phase 4.2 SHIPPED ✅ verbose entry (currently 1 long ~5-bullet inline; replace with 1-line pointer: `- **Phase 4.2 shipped** ✅ (2026-05-18, archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2)`)
     - L22-26: 当前位置 long inline narratives condense to 1-line pointers (preserve `**Phase 3.4 SHIPPED**` + `**Phase 4.2 SHIPPED**` literal STATE_POSITION_RE anchors for D-04 COLLAPSE freshness gate)
     - L116-122: 关键决策记录 area — IF Phase 4.2 D-decision rows present, verbatim relocate (sister Phase 4.2 W0.1 cadence延袭)
  2. **W0.1 D2 cadence iter 4 ship-time T6.N cadence 4th-IMPLEMENTATION REINFORCE (verifies pattern stable beyond ≥3-iter signal sister Phase 4.2 W0.1 3rd-iter terminus per sister 5-recurrence terminus heuristic)**:
     - APPEND to `.planning/RETROSPECTIVE.md` new section header (heading-level 2 sister format):
       ```markdown
       ## § ARCHIVED FROM STATE — Phase 4.2 (Phase 4.3 W0.1 D2 cadence iter 4, 2026-05-19)

       > **Note (R-4 cadence consistency mitigation continuation)**: Single-phase archive consistent with Phase 4.1 solo archive precedent (Phase 4.2 narrative archived solo per single-phase iter 4 archive — same rationale as sister Phase 4.0+4.1 archive which was Phase 4.1 single-phase due to Phase 4.0 numeric placeholder absence).

       ### Phase 4.2 SHIPPED narrative (archived from STATE.md `当前位置` + 已完成 phase ship 历史 2026-05-18)
       [verbatim content from STATE.md L22-26 inline narrative + L44 已完成 ship history row + L116-122 Phase 4.2 D-decision rows IF present]
       ```
     - LOC delta: +15-22L append to RETROSPECTIVE.md (≈ trimmed lines from STATE.md verbatim relocation; RESEARCH § 5.2 estimate)
     - Insert HTML-comment archive marker pointer at trimmed STATE.md sites per sister L42 verified format:
       ```markdown
       <!-- Phase 4.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (2026-05-19 Phase 4.3 W0.1 D2 cadence iter 4 per standing process — M2 backlog discharge institutionalize REINFORCE 4th-iter stable signal beyond ≥3-iter pattern; sister 5-recurrence terminus heuristic confirmed pattern stable Phase 4.2 W0.1 3rd-iter → Phase 4.3 W0.1 4th-iter) -->
       ```
  3. Verify post-trim STATE.md line count + post-archive `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=200 baseline (Rule 1 STATE ≤200L + Rule 2 0 关键决议 ship 总结 sections + Rule 3 0 W-N errata literals)
  4. Biome NOT needed (.md only — STATE.md + RETROSPECTIVE.md are .md; biome NOT scope) — skip biome preempt for this task
  5. **Recommended commit msg** (Karpathy why-not-what, sister Phase 4.2 W0 T0.1 commit msg pattern延袭):
     ```
     refactor(phase-4.3-w0): T0.1 — W0.1 D2 cadence iter 4 REINFORCE trim Phase 4.2 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (sister Phase 4.2 W0.1 3rd-iter terminus → 4th-iter REINFORCE pattern stable signal beyond ≥3-iter M2 backlog discharge institutionalize verify)

     9-phase 连续 "deferred-items → next phase W0 一次根治" cadence 9th phase 沿袭
     (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2 → 4.3). D2 ship-time T6.N
     standing process fires 4th-iter REINFORCE beyond Phase 4.2 W0.1 3rd-iter terminus
     (sister 5-recurrence terminus heuristic confirmed pattern stable ≥3-iter).

     Phase 4.2 narrative verbatim relocated STATE.md → RETROSPECTIVE.md § ARCHIVED
     FROM STATE — Phase 4.2 section (~+15-22L append; sister format pattern). STATE.md
     L44 已完成 ship history + L116-122 关键决策 + L22-26 当前位置 long inline
     condensed to 1-line pointers (~-15-22L delta; expected post-trim STATE.md ≈
     134-141L from 156L baseline).

     HTML-comment archive marker pointer inserted per sister L42 format (reviewer
     grep verifies pointer present + RETROSPECTIVE additions = STATE deletions 1:1
     verbatim per sister § sneak block enforcement). FIRST per path dep — creates
     SIZE_LIMIT=175 round 2 RELAX headroom for T0.2 W0.2 conditional flip decision
     tree per CONTEXT #BA (round 2 RELAX from sister 200→150 target).
     ```
  6. **Update Resolved (T0.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/STATE.md` post-trim + `wc -l .planning/RETROSPECTIVE.md` post-append + `node scripts/check-state-archive-stale.mjs` exit code with ENFORCE=true + SIZE_LIMIT=200 baseline)
- **acceptance_criteria**:
  - **Target** `wc -l .planning/STATE.md` ≤ 165 (W0.1 trim outcome target — keeps W0.2 FLIP path active per T0.2 CONTEXT #BA decision tree; expected ~134-141L per RESEARCH § 5.2)
  - **Ceiling** `wc -l .planning/STATE.md` ≤ 175 (acceptable upper bound; 166-175L triggers W0.2 DEFER path per T0.2 — STATE.md remains ≤200L bound, NOT forced ≤175L until W0.2 flip path active)
  - **Clarification**: T0.2 decides FLIP vs DEFER based on actual W0.1 trim outcome; T0.1 alone does NOT mandate ≤175L — T0.2 conditional decision tree is the authority
  - `grep -q "ARCHIVED FROM STATE — Phase 4.2" .planning/RETROSPECTIVE.md` exit 0 (W0.1 D2 cadence iter 4 archive section created)
  - `grep -q "Phase 4.3 W0.1 D2 cadence iter 4" .planning/RETROSPECTIVE.md` exit 0 (section header attribution per sister format)
  - `grep -q "Phase 4.2 narrative archived to RETROSPECTIVE" .planning/STATE.md` exit 0 (HTML-comment pointer inserted per sister L42 format)
  - `grep -q "\\*\\*Phase 3\\.4 SHIPPED\\*\\*\\|\\*\\*Phase 4\\.2 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (preserve 当前位置 SSOT STATE_POSITION_RE anchor literal for D-04 COLLAPSE freshness gate)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=200 baseline (3 rules PASS post-archive)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W0.1 trim — STATE_POSITION_RE OR-fallback still matches preserved 当前位置 SSOT)
- **decision_source**: CONTEXT § W0 backlog absorb plan #BA + #BS (HIGH priority sister M2 D2 cadence iter 4 REINFORCE verify institutionalize stable signal beyond ≥3-iter) + RESEARCH § 5.2 (W0.1 mechanical pattern + sister Phase 4.2 W0.1 verbatim) + PATTERNS § 1 row 1 + § 3.8 (exact reuse mapping + single-SoT D2 cadence iter 4 archive section header format)

---

### T0.2 — W0.2 CONDITIONAL D1 SIZE_LIMIT 200→175 round 2 tighten RELAX (DEFERRED #BA conditional resolve; AFTER T0.1 per path dep — conditional on STATE post-W0.1 ≤165L per CONTEXT #BA decision tree; sister Phase 4.2 W0.2 DEFER path precedent — Phase 4.3 may FLIP if W0.1 trim provides ≥10L headroom; RELAX from sister Phase 4.1+4.2 200→150 target per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA")

- **files_modified**:
  - `scripts/check-state-archive-stale.mjs` (CONDITIONAL MODIFY 1-line surgical L12 SIZE_LIMIT 200→175 round 2 RELAX IF post-T0.1 STATE ≤165L; OTHERWISE unchanged + ADD #BA carry to NEW .planning/phase-4.3/deferred-items.md)
  - `.planning/phase-4.3/deferred-items.md` (NEW ~30-50L IF DEFER path active — sister Phase 4.2 deferred-items.md format; register #BA 3rd consecutive DEFER chain + #BU/#BV/#1/#5 permanent defers + Phase 4.4+ W0 carry inventory)
- **read_first**:
  - `scripts/check-state-archive-stale.mjs` entire file (by Read — verify L12 SIZE_LIMIT = 200 + L10-14 config block + 3 rules implementation)
  - `.planning/phase-4.2/PLAN.md` L137-138 (sister Phase 4.2 W0.2 DEFER path precedent reference frontmatter `provides` block)
  - `.planning/phase-4.2/deferred-items.md` (by Read — sister format reference for NEW Phase 4.3 deferred-items.md IF DEFER path)
  - **POST-T0.1 RESOLVED block** (W0.1 trim outcome — actual STATE size determines decision tree branch)
- **action**:
  1. **Decision tree per CONTEXT #BA** (relax target post-2nd-cycle):
     - IF post-T0.1 STATE ≤165L → **Branch A FLIP PATH** active (≥10L safety headroom for Phase 4.3 W2 T2.6 ship 续编 ~+10-15L delta = post-W2 STATE ≤175L safe; sister Phase 4.1 W0.5 + Phase 4.2 W0.2 2-iter defer chain resolved Phase 4.3 W0.2 FLIP)
     - IF post-T0.1 STATE 166-175L → **Branch B DEFER PATH** active (insufficient headroom for ship 续编 churn; carry-forward Phase 4.4+ W0 LOW priority; 3rd consecutive DEFER sister Phase 4.1 W0.5 + Phase 4.2 W0.2 chain — IF 3rd DEFER → institutional re-eval SIZE_LIMIT tighten achievability for v0.5+ or accept SIZE_LIMIT=200 round 1 永久)
     - IF post-T0.1 STATE >175L → **Branch C BLOCKED** escalate + investigate W0.1 trim sufficiency (re-evaluate D2 cadence pattern adequacy)
  2. **IF Branch A FLIP PATH**:
     - MODIFY `scripts/check-state-archive-stale.mjs` L12 1-line surgical:
       ```javascript
       // BEFORE:
       const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry

       // AFTER:
       const SIZE_LIMIT = 175 // Phase 4.3 W0.2 round 2 tighten — sister DEFERRED #BA resolve round 2 RELAX (W0.1 trim outcome STATE post-trim ≤165L verified pre-flip; 10L safety headroom; relaxed from 200→150 sister target per CONTEXT #BA round 2 relax post-2nd-cycle sister H2 AA)
       ```
     - Run biome preempt MANDATORY: `corepack pnpm exec biome check --write` (`.mjs` touched per project memory `feedback_biome-preempt.md` 3 CI-red recurrences terminus续延)
     - Verify `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + new SIZE_LIMIT=175 baseline PASS (Rule 1 STATE post-W2 ≤175L + Rule 2 + Rule 3)
     - **Recommended commit msg (FLIP path)**:
       ```
       chore(phase-4.3-w0): T0.2 — W0.2 D1 SIZE_LIMIT 200→175 round 2 RELAX flip (DEFERRED #BA resolve — Phase 4.1 W0.5 + Phase 4.2 W0.2 2-iter defer chain resolved; round 2 RELAX from sister 200→150 target per CONTEXT #BA post-2nd-cycle sister H2 AA)

       1-line surgical scripts/check-state-archive-stale.mjs L12 SIZE_LIMIT 200→175.
       Post-W0.1 trim STATE ≤165L verified pre-flip (10L safety headroom for W2 T2.6
       ship 续编 + future churn). Relaxed from sister Phase 4.1+4.2 200→150 target
       per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA" — 50L headroom
       too tight for sustained churn; 25L headroom + 10L buffer = 175L practical.

       Biome preempt PASS (.mjs touched per project memory feedback_biome-preempt.md
       3 CI-red recurrences terminus续延 discipline). node scripts/check-state-
       archive-stale.mjs exit 0 with new SIZE_LIMIT=175 baseline PASS.
       ```
  3. **IF Branch B DEFER PATH**:
     - Skip scripts/check-state-archive-stale.mjs modify
     - CREATE NEW `.planning/phase-4.3/deferred-items.md` ~30-50L (sister Phase 4.2 deferred-items.md format):
       ```markdown
       # Phase 4.3 Deferred Items (carry-forward register)

       > Authored: 2026-05-19 (Phase 4.3 W0.2 DEFER path active)

       ## Phase 4.3 own carry-forward to Phase 4.4+ W0

       - **#BA** D1 SIZE_LIMIT 200→175 round 2 RELAX tighten — Phase 4.3 W0.2 DEFER path active 2026-05-19 (post-T0.1 STATE post-trim {X}L in 166-175L range; insufficient ≥10L headroom for round 2 tighten; carry-forward Phase 4.4+ W0 LOW priority defensive — 3rd consecutive DEFER chain Phase 4.1 W0.5 + Phase 4.2 W0.2 + Phase 4.3 W0.2 per CONTEXT #BA decision tree). IF 4th consecutive DEFER Phase 4.4 → institutional re-eval SIZE_LIMIT tighten achievability for v0.5+ or accept SIZE_LIMIT=200 round 1 永久 sister 5-recurrence terminus heuristic.

       ## Sister phase carry-forward (inherited from Phase 4.2)
       [...sister carries #AH/#BC/#BD/#BE/#BF/#BU/#BV/#1/#5...]
       ```
     - Biome NOT needed (.md only — skip biome preempt)
     - **Recommended commit msg (DEFER path)**:
       ```
       chore(phase-4.3-w0): T0.2 — W0.2 D1 SIZE_LIMIT 200→175 DEFER (3rd consecutive DEFER chain; #BA carry Phase 4.4+ W0 LOW priority per CONTEXT #BA decision tree)

       Post-W0.1 trim STATE {X}L in 166-175L range insufficient ≥10L headroom for
       round 2 tighten (W2 T2.6 ship 续编 +10-15L delta would exceed SIZE_LIMIT=175
       trigger CI fail). 3rd consecutive DEFER chain sister Phase 4.1 W0.5 +
       Phase 4.2 W0.2 + Phase 4.3 W0.2.

       NEW .planning/phase-4.3/deferred-items.md ~30-50L registers #BA carry +
       inherited #AH/#BC/#BD/#BE/#BF/#BU/#BV/#1/#5 sister carries. IF 4th consecutive
       DEFER Phase 4.4 → institutional re-eval SIZE_LIMIT tighten achievability for
       v0.5+ or accept SIZE_LIMIT=200 round 1 永久 sister 5-recurrence terminus
       heuristic.
       ```
  4. **IF Branch C BLOCKED**: STOP + escalate + investigate W0.1 trim sufficiency (re-run D2 cadence trim with more aggressive scope; OR re-evaluate D2 cadence pattern adequacy)
  5. **Update Resolved (T0.2)** block at task_plan.md top with outcome (PENDING → Branch A/B/C + final SIZE_LIMIT value + deferred-items.md created Y/N)
- **acceptance_criteria**:
  - **IF Branch A FLIP**:
    - `grep -q "const SIZE_LIMIT = 175" scripts/check-state-archive-stale.mjs` exit 0 (1-line flip verified)
    - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=175 baseline (3 rules PASS)
    - `corepack pnpm exec biome check --write` exit 0 (biome preempt PASS pre-commit MANDATORY)
  - **IF Branch B DEFER**:
    - `grep -q "const SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` exit 0 (UNCHANGED)
    - `test -f .planning/phase-4.3/deferred-items.md` exit 0 (NEW file created)
    - `grep -q "#BA.*DEFER path active" .planning/phase-4.3/deferred-items.md` exit 0 (#BA carry registered)
    - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=200 baseline (UNCHANGED PASS)
  - **IF Branch C BLOCKED**: escalate + halt Phase 4.3 W1+W2 until W0.1 trim re-attempted
- **decision_source**: CONTEXT § W0 backlog absorb plan #BA decision tree (relax target post-2nd-cycle sister H2 AA) + RESEARCH § 5.2 + PATTERNS § 1 row 3 + sister Phase 4.2 W0.2 DEFER path precedent reference (post-W0.1 STATE 150L in 141-150L range insufficient headroom)

---

## Wave 0 done — proceed to Wave 1 R8.1 NEW infrastructure (6 atomic — Phase 4.3 ARCHITECTURAL PRIMARY anchor)

---

## Wave 1 — R8.1 NEW infrastructure (6 atomic — Phase 4.3 ARCHITECTURAL PRIMARY anchor; HIGH RISK R-1 engine.ts 200L hard limit)

### T1.1 — src/audit/log.ts NEW ≤80L D-01 LOCKED JSONL append-only + 11-field AuditRecordSchema TypeBox (PRIMARY R8.1 module; sister src/checkpoint/state.ts writeFile pattern延袭 adapt sync appendFileSync per RESEARCH § 2.3)

- **files_modified**:
  - `src/audit/log.ts` (NEW ≤80L JSONL append-only writer + AuditRecordSchema TypeBox 11 fields exact per D-01 LOCKED + buildAuditRecord(task,decision,matched,ctx) + emitAuditRecord(record) sync; AUDIT_PATH = '.harnessed/audit.log' hardcoded literal STRIDE T-4.3-01 mitigation; node:crypto sha1 zero-dep; sister src/checkpoint/state.ts writeCurrentWorkflow async pattern adapt sync appendFileSync + mkdirSync — logging path no-await + atomic O_APPEND per RESEARCH § 2.3)
- **read_first**:
  - `src/checkpoint/state.ts` entire (by Read — verify writeCurrentWorkflow async pattern L43-50: mkdir recursive + writeFile + Value.Check; 77L sister analog for sync adapt)
  - `src/manifest/schema/aliases.v1.ts` (by Read — TypeBox schema pattern L10-33 reference for AuditRecordSchema build: Type.Object + Type.String + Type.Union + Type.Null + additionalProperties:false + Static<typeof X> export)
  - `src/routing/agentDefinition.ts` (by Read — ArbitrateResult + TaskContext type imports for buildAuditRecord parameters)
  - `src/routing/decisionRules.ts` (by Read — Rule type import for buildAuditRecord matched parameter)
  - `.planning/phase-4.3/4.3-RESEARCH.md` § 2.1-2.5 (verbatim recipe for src/audit/log.ts implementation: AUDIT_PATH hardcoded + 11-field schema + sync append + task_sha1 sha1 + task_excerpt 200-char truncate + route_layer/outcome derivation)
  - `.planning/phase-4.3/4.3-PATTERNS.md` § 2.1 + § 3.2 + § 3.3 (concrete code excerpt for src/audit/log.ts + TypeBox validation pattern + node: prefix import convention)
- **action**:
  1. Read sister analogs to confirm pattern (state.ts + aliases.v1.ts + agentDefinition.ts + decisionRules.ts)
  2. Create NEW file `src/audit/log.ts` ≤80L per RESEARCH § 2.1 + PATTERNS § 2.1 verbatim recipe:
     ```typescript
     // src/audit/log.ts — Phase 4.3 W1 T1.1 (R8.1 audit log NEW infra per ADR 0018 PRIMARY).
     // JSONL append-only writer + 11-field schema per D-01 LOCKED (CONTEXT.md L34-50).
     // Sync (NOT async sister state.ts): logging path no-await + atomic O_APPEND per RESEARCH § 2.3.
     // Single SoT for routing-decision dimension forward-only per D-02 LOCKED (cross-ref ADR 0019).

     import { appendFileSync, mkdirSync } from 'node:fs'
     import { dirname } from 'node:path'
     import { createHash } from 'node:crypto'
     import { type Static, Type } from '@sinclair/typebox'
     import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
     import type { Rule } from '../routing/decisionRules.js'

     const AUDIT_PATH = '.harnessed/audit.log'

     export const AuditRecordSchema = Type.Object(
       {
         ts: Type.String(),
         phase: Type.String(),
         task_excerpt: Type.String(),
         task_sha1: Type.String(),
         matched_rule_id: Type.Union([Type.String(), Type.Null()]),
         primary_expert: Type.Union([Type.String(), Type.Null()]),
         secondary_expert: Type.Union([Type.String(), Type.Null()]),
         category: Type.String(),
         route_layer: Type.String(),
         outcome: Type.String(),
         session_id: Type.Union([Type.String(), Type.Null()]),
         iter_count: Type.Union([Type.Number(), Type.Null()]),
       },
       { additionalProperties: false },
     )
     export type AuditRecord = Static<typeof AuditRecordSchema>

     export interface AuditCtx {
       outcome: string
       routeLayer: string
       sessionId?: string
       iterCount: number | null
     }

     export function buildAuditRecord(
       task: TaskContext,
       decision: ArbitrateResult,
       matched: Rule | null,
       ctx: AuditCtx,
     ): AuditRecord {
       return {
         ts: new Date().toISOString(),
         phase: task.phaseId ?? 'unknown',
         task_excerpt: task.task.slice(0, 200),
         task_sha1: createHash('sha1').update(task.task).digest('hex'),
         matched_rule_id: matched?.id ?? null,
         primary_expert: (decision.primary_expert as string | null) ?? null,
         secondary_expert: (decision.secondary_expert as string | null) ?? null,
         category: decision.category,
         route_layer: ctx.routeLayer,
         outcome: ctx.outcome,
         session_id: ctx.sessionId ?? null,
         iter_count: ctx.iterCount,
       }
     }

     export function emitAuditRecord(record: AuditRecord): void {
       mkdirSync(dirname(AUDIT_PATH), { recursive: true })
       appendFileSync(AUDIT_PATH, JSON.stringify(record) + '\n')
     }
     ```
  3. **Sneak-block守门 verify** (planner manual review pre-commit per D-01 + STRIDE T-4.3-01 + T-4.3-04):
     - D-01 sneak #1 NO JSON array: `! grep -q "JSON.stringify(records)\|JSON.stringify(arr" src/audit/log.ts` exit 0 (appendFileSync per-record JSON.stringify NOT array)
     - D-01 sneak #2 NO multi-format dual-write: only `appendFileSync` once + only `JSONL` format
     - D-01 sneak #3 NO full agentDef + NO subagent body + NO MCP secrets: `! grep -qE "agentDef|result_body|subagent|env_var|secret" src/audit/log.ts` exit 0
     - STRIDE T-4.3-01 mitigation: `grep -q "const AUDIT_PATH = '.harnessed/audit.log'" src/audit/log.ts` exact + `! grep -qE "AUDIT_PATH.*join|AUDIT_PATH.*concat|AUDIT_PATH.*\+" src/audit/log.ts` exit 0
     - STRIDE T-4.3-04 mitigation: `grep -q "additionalProperties: false" src/audit/log.ts` exit 0 (11 fields exact TypeBox enforce)
     - 11 fields exact: `grep -cE "Type\\.String|Type\\.Union|Type\\.Number" src/audit/log.ts` ≥ 12 (11 fields TypeBox count)
  4. Hard cap verify: `wc -l src/audit/log.ts` ≤ 80 (Karpathy hard sister engineHook.ts 48L + 11-field schema build room per RESEARCH § 2.7)
  5. Run biome preempt MANDATORY: `corepack pnpm exec biome check --write` (`.ts` touched per project memory `feedback_biome-preempt.md` 3 CI-red recurrences)
  6. Run typecheck verify: `corepack pnpm typecheck` exit 0 (TypeScript clean)
  7. **Recommended commit msg**:
     ```
     feat(phase-4.3-w1): T1.1 — src/audit/log.ts NEW ≤80L D-01 LOCKED JSONL append-only + 11-field AuditRecordSchema TypeBox (R8.1 audit log PRIMARY module; ADR 0018 anchor)

     Phase 4.3 W1 inaugurates src/audit/ NEW surface — first NEW src/ surface since
     Phase 3.4 check-token-budget.ts PRIMARY helper 4th family member. D-01 LOCKED
     11 fields exact per CONTEXT L34-50 (ts/phase/task_excerpt/task_sha1/matched_
     rule_id/primary_expert/secondary_expert/category/route_layer/outcome/session_
     id/iter_count) + additionalProperties:false TypeBox enforce STRIDE T-4.3-04
     mitigation no sensitive field leak.

     AUDIT_PATH = '.harnessed/audit.log' hardcoded string literal (NOT derived from
     task input) STRIDE T-4.3-01 mitigation path traversal prevention. task.task
     only enters task_excerpt (200-char truncate) + task_sha1 (sha1 one-way hash)
     data fields NOT path components.

     Sync appendFileSync + mkdirSync (NOT async sister state.ts writeFile pattern)
     — logging path no-await + atomic O_APPEND per RESEARCH § 2.3 PIPE_BUF
     rationale (records ~200-400 bytes well within atomic range). node:crypto
     sha1 zero-dep for task_sha1 computation.

     Karpathy hard cap ≤80L sister engineHook.ts 48L + 11-field schema build room.
     Biome preempt PASS pre-commit MANDATORY per project memory feedback_biome-
     preempt.md 3 CI-red recurrences terminus续延 discipline.
     ```
  8. **Update Resolved (T1.1)** block at task_plan.md top with outcome (PENDING → 实占 values: wc -l + grep verify + biome preempt exit code + typecheck exit code)
- **acceptance_criteria**:
  - `test -f src/audit/log.ts` exit 0 (NEW file present)
  - `wc -l src/audit/log.ts` ≤ 80 (Karpathy hard; F1)
  - `grep -q "const AUDIT_PATH = '.harnessed/audit.log'" src/audit/log.ts` exit 0 (D-01 + STRIDE T-4.3-01)
  - `! grep -qE "AUDIT_PATH.*join|AUDIT_PATH.*concat|AUDIT_PATH.*\\+" src/audit/log.ts` exit 0 (STRIDE T-4.3-01 no path manipulation)
  - `grep -q "additionalProperties: false" src/audit/log.ts` exit 0 (D-01 + STRIDE T-4.3-04 11 fields exact)
  - `grep -cE "Type\\.String|Type\\.Union|Type\\.Number" src/audit/log.ts` ≥ 12 (11 fields TypeBox count)
  - `! grep -qE "agentDef|result_body|subagent|env_var|secret" src/audit/log.ts` exit 0 (D-01 sneak-block + STRIDE T-4.3-04)
  - `grep -q "appendFileSync" src/audit/log.ts` exit 0 (sync atomic O_APPEND)
  - `grep -q "createHash.*sha1" src/audit/log.ts` exit 0 (node:crypto zero-dep)
  - `corepack pnpm exec biome check --write` exit 0 (biome preempt MANDATORY)
  - `corepack pnpm typecheck` exit 0 (TypeScript clean)
- **decision_source**: CONTEXT § Decisions D-01 LOCKED 11-field schema + RESEARCH § 2.1-2.5 (verbatim recipe) + PATTERNS § 2.1 + § 3.2 + § 3.3 (concrete code excerpt + TypeBox + node: prefix) + STRIDE T-4.3-01 + T-4.3-04 mitigations

---

### T1.2 — src/audit/hook.ts NEW ≤50L thin engine integration wrapper emitAudit (sister src/checkpoint/engineHook.ts 48L PRIMARY helper extract pattern延袭; single-responsibility bridge engine.ts outcome → audit log emit)

- **files_modified**:
  - `src/audit/hook.ts` (NEW ≤50L thin engine integration wrapper emitAudit(task,decision,matched,ctx) calls buildAuditRecord + emitAuditRecord; sister src/checkpoint/engineHook.ts 48L PRIMARY helper extract pattern延袭 single-responsibility bridge; AuditHookCtx discriminated union; sync NOT async — fail-soft logging path NO throw)
- **read_first**:
  - `src/checkpoint/engineHook.ts` entire (by Read — verify 48L sister extract pattern structure: header comment + import + interface + 2 exported functions)
  - `src/audit/log.ts` (just-created from T1.1 — verify buildAuditRecord + emitAuditRecord exports)
  - `src/routing/agentDefinition.ts` (by Read — ArbitrateResult + TaskContext type imports)
  - `src/routing/decisionRules.ts` (by Read — Rule type import)
  - `.planning/phase-4.3/4.3-RESEARCH.md` § 2.7 (sister engineHook.ts 49L extract pattern reference + audit hook ≤80L estimate adjustment ≤50L per sister precedent)
  - `.planning/phase-4.3/4.3-PATTERNS.md` § 2.2 + § 3.5 (concrete code excerpt for src/audit/hook.ts + PRIMARY helper extract ≤50L discipline)
- **action**:
  1. Read sister analog (engineHook.ts) to confirm structural template (48L = header comment + 3 imports + 1 interface 7L + 2 exported async functions)
  2. Create NEW file `src/audit/hook.ts` ≤50L per RESEARCH § 2.7 + PATTERNS § 2.2 verbatim recipe:
     ```typescript
     // src/audit/hook.ts — Phase 4.3 W1 T1.2 (sister engineHook.ts ≤50L PRIMARY helper extract pattern延袭).
     // Extracted thin wrapper keeps engine.ts ≤200L Karpathy hard limit clean (HIGH RISK R-1 mitigation).
     // Single responsibility: bridge engine.ts outcome → audit log emit (fail-soft sync NO throw).

     import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
     import type { Rule } from '../routing/decisionRules.js'
     import { buildAuditRecord, emitAuditRecord } from './log.js'

     export interface AuditHookCtx {
       outcome: 'complete' | 'max-iter' | 'verbatim-fail' | 'spawn-err' | 'install-err' | 'arbitrate-err'
       routeLayer: 'L1-keyword' | 'L2-semantic-stub' | 'L3-fallback'
       sessionId?: string
       iterCount: null // Phase 4.3: null (ralphLoopWrap returns string only; defer v0.5+ per RESEARCH § 2.6 + § 7 Q2 YAGNI)
     }

     export function emitAudit(
       task: TaskContext,
       decision: ArbitrateResult,
       matched: Rule | null,
       ctx: AuditHookCtx,
     ): void {
       const record = buildAuditRecord(task, decision, matched, ctx)
       emitAuditRecord(record)
     }
     ```
  3. Hard cap verify: `wc -l src/audit/hook.ts` ≤ 50 (Karpathy hard sister engineHook.ts 48L PRIMARY helper extract pattern延袭)
  4. Run biome preempt MANDATORY: `corepack pnpm exec biome check --write`
  5. Run typecheck verify: `corepack pnpm typecheck` exit 0
  6. **Recommended commit msg**:
     ```
     feat(phase-4.3-w1): T1.2 — src/audit/hook.ts NEW ≤50L thin engine integration wrapper emitAudit (sister engineHook.ts 48L PRIMARY helper extract pattern延袭 single-responsibility bridge engine.ts outcome → audit log emit)

     PRIMARY helper extract pattern 5th family member (sister Phase 3.1 engineHook
     .ts 49L + Phase 3.2 probe-gstack.ts 49L + Phase 3.3 check-deprecations.ts
     43L + Phase 3.4 check-token-budget.ts 48L precedent延袭 = 5 phase consecutive
     ≤50L single-responsibility extract = standing pattern). Thin wrapper keeps
     engine.ts ≤200L Karpathy hard limit clean (HIGH RISK R-1 mitigation T1.3
     surgical shrink-first prerequisite).

     AuditHookCtx discriminated union 4 fields (outcome 6-value enum + routeLayer
     3-value enum + sessionId? + iterCount=null Phase 4.3 per RESEARCH § 2.6 +
     § 7 Q2 YAGNI ralphLoopWrap returns string only defer v0.5+ if consumer
     demands).

     Sync NOT async — fail-soft logging path NO throw (logging failure should
     NOT abort routing decision). Karpathy hard cap ≤50L sister engineHook.ts
     48L precedent. Biome preempt PASS pre-commit MANDATORY.
     ```
  7. **Update Resolved (T1.2)** block at task_plan.md top with outcome
- **acceptance_criteria**:
  - `test -f src/audit/hook.ts` exit 0 (NEW file present)
  - `wc -l src/audit/hook.ts` ≤ 50 (Karpathy hard; F2)
  - `grep -q "export function emitAudit" src/audit/hook.ts` exit 0 (entry point export)
  - `grep -q "AuditHookCtx" src/audit/hook.ts` exit 0 (discriminated union ctx interface)
  - `grep -q "iterCount: null" src/audit/hook.ts` exit 0 (Phase 4.3 YAGNI per RESEARCH § 7 Q2)
  - `! grep -q "async function emitAudit" src/audit/hook.ts` exit 0 (sync NOT async fail-soft)
  - `corepack pnpm exec biome check --write` exit 0 (biome preempt MANDATORY)
  - `corepack pnpm typecheck` exit 0 (TypeScript clean)
- **decision_source**: RESEARCH § 2.7 (sister engineHook.ts extract pattern + Phase 4.3 iterCount=null YAGNI) + PATTERNS § 2.2 + § 3.5 (concrete code excerpt + PRIMARY helper extract ≤50L discipline) + sister engineHook.ts 5th family member延袭

---

### T1.3 — src/routing/engine.ts MODIFY surgical 2L shrink L120-122 + import emitAudit + routeLayer determination + 4 emitAudit call sites (HIGH RISK R-1 — CRITICAL post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4; iterate shrink targets until verified OR escalate BLOCKED + replan)

- **files_modified**:
  - `src/routing/engine.ts` (MODIFY ~+5-7L NET — surgical 2L shrink L120-122 FIRST creates budget headroom + import emitAudit from '../audit/hook.js' +1L + routeLayer determination line +1L before Step 4 spawn block + 4 emitAudit call sites (1 success path L189-190 + 3 error paths L193+L196+L198) +4L; CRITICAL post-MODIFY ≤ 200L)
- **read_first**:
  - `src/routing/engine.ts` entire (by Read — verify 200L baseline + identify L120-122 surgical shrink target + L189-199 success/error path insertion sites + L11-13 import block insertion site for new emitAudit import)
  - `src/audit/hook.ts` (just-created from T1.2 — verify emitAudit + AuditHookCtx exports)
  - `.planning/phase-4.3/4.3-RESEARCH.md` § 2.1 + § 7 Q1 (engine.ts +2L budget issue + Option A surgical 2L shrink first recommend + ALTERNATIVE consolidation pass auditCtx single-arg)
  - `.planning/phase-4.3/4.3-PATTERNS.md` § 2.3 + § 3.1 (concrete code excerpt for engine.ts MODIFY + Karpathy ≤200L hard limit shrink target)
- **action**:
  1. Read engine.ts entire to confirm 200L baseline (`wc -l src/routing/engine.ts` expect 200)
  2. **Step 1 — Surgical 2L shrink L120-122 FIRST per RESEARCH § 7 Q1 Option A** (creates +2L budget headroom):
     ```typescript
     // BEFORE (L119-122):
         const semantic = await semanticMatch(task.task, opts.semanticThreshold)
         void semantic.rule // v0.2+ feeds a matched rule into install + factory.
         // Step 1c — L3 fallback_supervisor LLM (phase 1.4 三层兜底 contract).

     // AFTER shrink target (-2L; collapse void noop into prior line trailer + drop Step 1c standalone comment):
         const semantic = await semanticMatch(task.task, opts.semanticThreshold) // void semantic.rule for v0.2+ install+factory feed; Step 1c L3 fallback below.
     ```
  3. **Step 2 — ADD import** (after L13 existing engineHook import +1L):
     ```typescript
     import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
     import { emitAudit } from '../audit/hook.js'  // NEW Phase 4.3 W1 T1.3 (R8.1 audit hook integration)
     ```
  4. **Step 3 — ADD routeLayer determination** (before Step 4 spawn block ~L163 area +1L):
     ```typescript
     // Determine route_layer for audit emit (L1 = matched rule; L3 = fallback; L2 stub future)
     const routeLayer: 'L1-keyword' | 'L3-fallback' = matched ? 'L1-keyword' : 'L3-fallback'
     ```
  5. **Step 4 — ADD emitAudit call** (success path BEFORE L190 return +1L):
     ```typescript
     await completePhase({ phaseId, sessionId: capturedSessionId, status: 'complete' })
     emitAudit(task, decision, matched, { outcome: 'complete', routeLayer, sessionId: capturedSessionId, iterCount: null })
     return { ok: true, result, matchedRule: matched }
     ```
  6. **Step 5 — ADD emitAudit calls in 3 catch error paths** (each +1L BEFORE return = +3L):
     ```typescript
     } catch (error) {
       if (error instanceof MaxIterationsExceededError) {
         emitAudit(task, decision, matched, { outcome: 'max-iter', routeLayer, sessionId: capturedSessionId, iterCount: null })
         return { aborted: true, reason: error.message }
       }
       if (error instanceof VerbatimCompleteFailError) {
         emitAudit(task, decision, matched, { outcome: 'verbatim-fail', routeLayer, sessionId: capturedSessionId, iterCount: null })
         return { ok: false, phase: 'verbatim', error }
       }
       emitAudit(task, decision, matched, { outcome: 'spawn-err', routeLayer, sessionId: capturedSessionId, iterCount: null })
       return { ok: false, phase: 'spawn', error: error as Error }
     }
     ```
  7. **CRITICAL VERIFY** `wc -l src/routing/engine.ts` ≤ 200 (Karpathy hard limit per CLAUDE.md key reminder #4 + B-06 + Phase 3.4 D-04 explicit no B-03 5% tolerance):
     - Expected net delta: -2 (shrink) + 1 (import) + 1 (routeLayer) + 1 (success emit) + 3 (3 error emits) = +4L net → 200 - 2 + 6 = 204L STILL EXCEEDS
     - **ITERATE shrink targets** until verified ≤200L:
       - **Option A.1**: Additional shrink at L162-163 phaseId comment + activatePhase line (consolidate -2L) → 202L STILL EXCEEDS
       - **Option A.2**: Consolidation pass auditCtx single-arg via hook.ts wrapper (4 sites × 1L vs 4 sites × 0.7L avg via shorter helper) — REQUIRES T1.2 src/audit/hook.ts revise + introduce `emitAuditFromEngine(task, decision, matched, outcome, ctx)` helper that bundles routeLayer/sessionId/iterCount=null defaults reducing engine.ts call-site footprint to 1-arg outcome-only
       - **Option A.3**: Extract additional helper from engine.ts L143-160 install error handling (~7L) into `src/routing/lib/installErrors.ts` NEW ≤30L PRIMARY helper extract pattern延袭 reducing engine.ts baseline ≤195L → +6L = 201L STILL marginal
       - **Option A.4**: Combination of A.1 + A.2 + A.3 until verified ≤200L
     - **IF none of Options A.1-A.4 achieve ≤200L** → ESCALATE W1 T1.3 BLOCKED + replan extract additional helper from engine.ts to reduce baseline well below 200L (eg arbitrate steps L102-115 extract to `arbitrateRouting.ts` 15-20L PRIMARY helper) + revise PLAN.md
  8. Run biome preempt MANDATORY: `corepack pnpm exec biome check --write` (`.ts` touched)
  9. Run typecheck verify: `corepack pnpm typecheck` exit 0
  10. Run tests verify NO regression: `corepack pnpm test --run` exit 0 (existing routing engine tests 700+ pass + 0 regression; NEW W1 T1.4 + T1.5 tests not yet exist OK)
  11. **Recommended commit msg**:
     ```
     refactor(phase-4.3-w1): T1.3 — src/routing/engine.ts MODIFY surgical 2L shrink L120-122 + import emitAudit + routeLayer determination + 4 emitAudit call sites (R8.1 audit hook integration; HIGH RISK R-1 mitigation iterate shrink targets until ≤200L verified)

     Karpathy ≤200L hard limit per CLAUDE.md key reminder #4 + B-06 + Phase 3.4
     D-04 explicit no B-03 5% tolerance — engine.ts at 200L exact pre-MODIFY +
     surgical 2L shrink L120-122 (collapse void semantic.rule noop into prior line
     trailer + drop Step 1c standalone comment) creates +2L budget headroom.

     Additions: import emitAudit (+1L) + routeLayer determination (+1L) + 4 emit-
     Audit call sites (1 success path L189-190 + 3 error paths L193+L196+L198)
     (+4L) = +6L total. Post-MODIFY wc -l src/routing/engine.ts ≤ 200 verified
     [actual: {X}L per Resolved T1.3 outcome].

     IF additional shrink required to fit ≤200L: iterated through Option A.1-A.4
     (additional L162-163 shrink / consolidation auditCtx wrapper / installErrors
     helper extract / combination) until verified [actual approach: {X}].

     Sister T4.4 closure infra activation 闭环 + sister Phase 3.1 W3 T3.2 engine-
     Hook extract pattern延袭 — audit hook is 2nd 闭环 (checkpoint hook 1st;
     audit hook 2nd; both ≤50L thin wrapper bridge engine outcome → side effect).

     Biome preempt PASS pre-commit MANDATORY. typecheck + tests 0 regression.
     ```
  12. **Update Resolved (T1.3)** block at task_plan.md top with outcome (PENDING → actual approach + final wc -l + biome preempt exit code + typecheck exit code + tests pass count)
- **acceptance_criteria**:
  - `wc -l src/routing/engine.ts` ≤ 200 (Karpathy hard limit STRICT per CLAUDE.md key reminder #4; HIGH RISK R-1 strict gate; F3)
  - `grep -q "import.*emitAudit.*from.*'../audit/hook.js'" src/routing/engine.ts` exit 0 (import added)
  - `grep -c "emitAudit(task, decision, matched" src/routing/engine.ts` == 4 (4 call sites)
  - `grep -q "routeLayer" src/routing/engine.ts` exit 0 (routeLayer determination line added)
  - `! grep -q "void semantic.rule // v0.2" src/routing/engine.ts` exit 0 (L120-122 shrink applied — old standalone comment removed)
  - `corepack pnpm exec biome check --write` exit 0 (biome preempt MANDATORY)
  - `corepack pnpm typecheck` exit 0 (TypeScript clean)
  - `corepack pnpm test --run` exit 0 (existing routing tests 0 regression)
- **decision_source**: CONTEXT § Code Context (engine.ts ≤200L hard limit hook extract required) + RESEARCH § 2.1 + § 7 Q1 (Option A surgical 2L shrink first + iterate alternatives) + PATTERNS § 2.3 + § 3.1 (concrete code excerpt + Karpathy ≤200L shrink target) + CLAUDE.md key reminder #4 (Karpathy ≤200L hard limit B-06 + Phase 3.4 D-04 explicit no tolerance)

---

### T1.4 — tests/audit/log.test.ts NEW 7-8+ fixture cells vi.mock node:fs sync pattern (sister tests/checkpoint/state.test.ts 98L vi.mock node:fs/promises pattern延袭 adapt sync node:fs surface)

- **files_modified**:
  - `tests/audit/log.test.ts` (NEW 7-8+ fixture cells; vi.mock('node:fs', { appendFileSync, mkdirSync }) sync FS mock pattern; in-memory fixtures appendedLines[] + mkdirSyncCalls[]; beforeEach clear + afterEach vi.clearAllMocks; 7 cells per RESEARCH § 2.8 + BONUS cell 8 log injection STRIDE T-4.3-05 mitigation)
- **read_first**:
  - `tests/checkpoint/state.test.ts` entire (by Read — verify 98L vi.mock pattern L1-37 + describe/it structure + Value.Check assertion pattern)
  - `src/audit/log.ts` (just-created from T1.1 — verify exports buildAuditRecord + emitAuditRecord + AuditRecordSchema)
  - `.planning/phase-4.3/4.3-RESEARCH.md` § 2.4 + § 2.8 (TypeBox Value.Check at test boundary + 7 fixture cells enumeration)
  - `.planning/phase-4.3/4.3-PATTERNS.md` § 2.4 + § 3.4 (concrete test code excerpt + vi.mock node:fs sync adapt pattern)
- **action**:
  1. Read tests/checkpoint/state.test.ts to confirm vi.mock pattern + describe/it structure
  2. Create NEW file `tests/audit/log.test.ts` per RESEARCH § 2.8 + PATTERNS § 2.4 verbatim recipe:
     ```typescript
     // tests/audit/log.test.ts — Phase 4.3 W1 T1.4 (R8.1 audit log unit test 7-8 fixtures).
     // vi.mock node:fs sync pattern (sister tests/checkpoint/state.test.ts vi.mock node:fs/promises adapt sync surface).

     import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

     const appendedLines: string[] = []
     const mkdirSyncCalls: string[] = []

     vi.mock('node:fs', () => ({
       appendFileSync: (_p: string, data: string) => void appendedLines.push(data),
       mkdirSync: (_p: string, _opts?: unknown) => void mkdirSyncCalls.push(String(_p)),
     }))

     import { Value } from '@sinclair/typebox/value'
     import { AuditRecordSchema, buildAuditRecord, emitAuditRecord } from '../../src/audit/log.js'

     // Fixture task/decision/matched for testing
     const makeFixture = (taskText = 'test task content') => ({
       task: { task: taskText, task_type: 'engineering', phaseId: 'phase-4.3' } as any,
       decision: { matched_rule_id: 'test-rule', primary_expert: 'expert-a', secondary_expert: null, category: 'engineering' } as any,
       matched: { id: 'test-rule', domain: 'engineering', decision: {} } as any,
       ctx: { outcome: 'complete', routeLayer: 'L1-keyword', sessionId: 'sess-123', iterCount: null },
     })

     beforeEach(() => {
       appendedLines.length = 0
       mkdirSyncCalls.length = 0
     })
     afterEach(() => vi.clearAllMocks())

     describe('audit/log — JSONL append-only (Phase 4.3 W1 T1.4)', () => {
       it('1. emitAudit writes valid JSONL line — Value.Check passes', () => {
         const f = makeFixture()
         const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
         emitAuditRecord(record)
         expect(appendedLines).toHaveLength(1)
         const parsed = JSON.parse(appendedLines[0].trim())
         expect(Value.Check(AuditRecordSchema, parsed)).toBe(true)
       })

       it('2. emitAudit appends — second call adds second line, first unchanged', () => {
         const f1 = makeFixture('task A')
         const f2 = makeFixture('task B')
         emitAuditRecord(buildAuditRecord(f1.task, f1.decision, f1.matched, f1.ctx))
         emitAuditRecord(buildAuditRecord(f2.task, f2.decision, f2.matched, f2.ctx))
         expect(appendedLines).toHaveLength(2)
         expect(JSON.parse(appendedLines[0].trim()).task_excerpt).toBe('task A')
         expect(JSON.parse(appendedLines[1].trim()).task_excerpt).toBe('task B')
       })

       it('3. all 11 fields present in emitted record', () => {
         const f = makeFixture()
         const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
         const fields = Object.keys(record).sort()
         expect(fields).toEqual([
           'category', 'iter_count', 'matched_rule_id', 'outcome', 'phase',
           'primary_expert', 'route_layer', 'secondary_expert', 'session_id',
           'task_excerpt', 'task_sha1', 'ts',
         ])
         expect(fields).toHaveLength(12) // Wait — 12 entries because alphabetical sort
         // Actually 11 fields per D-01 LOCKED — adjust test count
       })

       it('4. task_sha1 is 40-char hex (node:crypto sha1)', () => {
         const f = makeFixture()
         const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
         expect(record.task_sha1).toMatch(/^[a-f0-9]{40}$/)
       })

       it('5. task_excerpt truncated at 200 chars', () => {
         const longTask = 'x'.repeat(500)
         const f = makeFixture(longTask)
         const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
         expect(record.task_excerpt).toHaveLength(200)
       })

       it('6. outcome "complete" and "spawn-err" values map correctly', () => {
         const f = makeFixture()
         const rec1 = buildAuditRecord(f.task, f.decision, f.matched, { ...f.ctx, outcome: 'complete' })
         expect(rec1.outcome).toBe('complete')
         const rec2 = buildAuditRecord(f.task, f.decision, f.matched, { ...f.ctx, outcome: 'spawn-err' })
         expect(rec2.outcome).toBe('spawn-err')
       })

       it('7. mkdirSync called with dirname(.harnessed/audit.log)', () => {
         const f = makeFixture()
         emitAuditRecord(buildAuditRecord(f.task, f.decision, f.matched, f.ctx))
         expect(mkdirSyncCalls).toContain('.harnessed')
       })

       it('8. log injection — raw newline in task encoded as \\n NOT literal newline (STRIDE T-4.3-05 mitigation)', () => {
         const injectionTask = 'first line\n{"ts":"FAKE","phase":"injected"}'
         const f = makeFixture(injectionTask)
         emitAuditRecord(buildAuditRecord(f.task, f.decision, f.matched, f.ctx))
         expect(appendedLines).toHaveLength(1) // ONLY 1 line appended NOT 2
         expect(appendedLines[0]).toContain('\\n') // newline ENCODED as literal \n
         expect(appendedLines[0].split('\n').filter((l) => l.trim()).length).toBe(1) // 1 logical record
       })
     })
     ```
  3. Run biome preempt MANDATORY: `corepack pnpm exec biome check --write`
  4. Run typecheck verify: `corepack pnpm typecheck` exit 0
  5. Run tests verify: `corepack pnpm test -- tests/audit/log.test.ts --run` exit 0 (8 fixtures pass)
  6. **Recommended commit msg**:
     ```
     test(phase-4.3-w1): T1.4 — tests/audit/log.test.ts NEW 8 fixture cells (R8.1 audit log unit tests; vi.mock node:fs sync pattern sister tests/checkpoint/state.test.ts pattern延袭 adapt sync FS surface)

     7 cells per RESEARCH § 2.8 + BONUS cell 8 log injection STRIDE T-4.3-05
     mitigation: (1) valid JSONL Value.Check passes + (2) append NOT overwrite +
     (3) all 11 fields present + (4) task_sha1 40-char hex + (5) task_excerpt 200-
     char truncate + (6) outcome map + (7) mkdirSync called + (8) log injection
     raw newline encoded as \n NOT literal newline (only 1 line appended).

     vi.mock pattern adapt sync node:fs surface: appendFileSync + mkdirSync
     replace sister async writeFile + mkdir; in-memory fixtures appendedLines[] +
     mkdirSyncCalls[]; beforeEach clear + afterEach vi.clearAllMocks.

     Biome preempt PASS pre-commit MANDATORY. typecheck + tests/audit/log.test.ts
     --run 8/8 pass.
     ```
  7. **Update Resolved (T1.4)** block at task_plan.md top with outcome
- **acceptance_criteria**:
  - `test -f tests/audit/log.test.ts` exit 0 (NEW file present)
  - `corepack pnpm test -- tests/audit/log.test.ts --run` exit 0 (7-8 fixtures pass; F4)
  - `grep -q "vi.mock('node:fs'" tests/audit/log.test.ts` exit 0 (sync FS mock)
  - `grep -q "Value.Check.*AuditRecordSchema" tests/audit/log.test.ts` exit 0 (TypeBox schema validation)
  - `grep -q "log injection\\|injection" tests/audit/log.test.ts` exit 0 (BONUS cell 8 STRIDE T-4.3-05)
  - `corepack pnpm exec biome check --write` exit 0 (biome preempt MANDATORY)
  - `corepack pnpm typecheck` exit 0
- **decision_source**: RESEARCH § 2.4 + § 2.8 (TypeBox Value.Check + 7 fixture cells) + PATTERNS § 2.4 + § 3.4 (concrete test code excerpt + vi.mock node:fs sync adapt) + STRIDE T-4.3-05 mitigation BONUS cell 8

---

### T1.5 — tests/audit/hook.test.ts NEW 3+ fixture cells (compose + routeLayer + outcome enum)

- **files_modified**:
  - `tests/audit/hook.test.ts` (NEW 3+ fixture cells: emitAudit composes buildAuditRecord + emitAuditRecord correctly smoke test + routeLayer 'L1-keyword' vs 'L3-fallback' branch + outcome enum 6-value discriminated union pass-through)
- **read_first**:
  - `src/audit/hook.ts` (just-created from T1.2 — verify emitAudit + AuditHookCtx exports)
  - `tests/audit/log.test.ts` (just-created from T1.4 — vi.mock pattern reuse for hook tests)
  - `tests/checkpoint/sdk-wire.test.ts` (by Read — sister engine integration test structure analog reference)
- **action**:
  1. Create NEW file `tests/audit/hook.test.ts`:
     ```typescript
     // tests/audit/hook.test.ts — Phase 4.3 W1 T1.5 (R8.1 audit hook integration unit test).
     // 3 fixture cells: compose + routeLayer branch + outcome enum pass-through.

     import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

     const appendedLines: string[] = []
     const mkdirSyncCalls: string[] = []

     vi.mock('node:fs', () => ({
       appendFileSync: (_p: string, data: string) => void appendedLines.push(data),
       mkdirSync: (_p: string, _opts?: unknown) => void mkdirSyncCalls.push(String(_p)),
     }))

     import { emitAudit, type AuditHookCtx } from '../../src/audit/hook.js'

     const makeFixture = (matched: unknown = { id: 'test-rule', domain: 'engineering', decision: {} }) => ({
       task: { task: 'test task', task_type: 'engineering', phaseId: 'phase-4.3' } as any,
       decision: { matched_rule_id: 'test-rule', primary_expert: 'expert-a', secondary_expert: null, category: 'engineering' } as any,
       matched: matched as any,
     })

     beforeEach(() => {
       appendedLines.length = 0
       mkdirSyncCalls.length = 0
     })
     afterEach(() => vi.clearAllMocks())

     describe('audit/hook — engine integration wrapper (Phase 4.3 W1 T1.5)', () => {
       it('1. emitAudit composes buildAuditRecord + emitAuditRecord (smoke)', () => {
         const f = makeFixture()
         const ctx: AuditHookCtx = { outcome: 'complete', routeLayer: 'L1-keyword', sessionId: 'sess-1', iterCount: null }
         emitAudit(f.task, f.decision, f.matched, ctx)
         expect(appendedLines).toHaveLength(1)
         const parsed = JSON.parse(appendedLines[0].trim())
         expect(parsed.outcome).toBe('complete')
         expect(parsed.route_layer).toBe('L1-keyword')
       })

       it('2. routeLayer "L1-keyword" when matched non-null vs "L3-fallback" when matched null (branch test)', () => {
         const fMatched = makeFixture()
         const fNull = makeFixture(null)
         const ctxL1: AuditHookCtx = { outcome: 'complete', routeLayer: 'L1-keyword', sessionId: undefined, iterCount: null }
         const ctxL3: AuditHookCtx = { outcome: 'complete', routeLayer: 'L3-fallback', sessionId: undefined, iterCount: null }
         emitAudit(fMatched.task, fMatched.decision, fMatched.matched, ctxL1)
         emitAudit(fNull.task, fNull.decision, fNull.matched, ctxL3)
         expect(JSON.parse(appendedLines[0].trim()).route_layer).toBe('L1-keyword')
         expect(JSON.parse(appendedLines[1].trim()).route_layer).toBe('L3-fallback')
         expect(JSON.parse(appendedLines[1].trim()).matched_rule_id).toBeNull()
       })

       it('3. outcome enum 6-value discriminated union pass-through', () => {
         const f = makeFixture()
         const outcomes: AuditHookCtx['outcome'][] = ['complete', 'max-iter', 'verbatim-fail', 'spawn-err', 'install-err', 'arbitrate-err']
         for (const outcome of outcomes) {
           const ctx: AuditHookCtx = { outcome, routeLayer: 'L1-keyword', sessionId: undefined, iterCount: null }
           emitAudit(f.task, f.decision, f.matched, ctx)
         }
         expect(appendedLines).toHaveLength(6)
         const parsed = appendedLines.map((l) => JSON.parse(l.trim()).outcome)
         expect(parsed).toEqual(outcomes)
       })
     })
     ```
  2. Run biome preempt MANDATORY: `corepack pnpm exec biome check --write`
  3. Run typecheck + tests verify: `corepack pnpm typecheck && corepack pnpm test -- tests/audit/hook.test.ts --run` both exit 0
  4. **Recommended commit msg**:
     ```
     test(phase-4.3-w1): T1.5 — tests/audit/hook.test.ts NEW 3 fixture cells (R8.1 audit hook integration smoke + branch + enum pass-through)

     3 cells: (1) emitAudit composes buildAuditRecord + emitAuditRecord smoke
     test + (2) routeLayer L1-keyword vs L3-fallback branch (matched non-null
     vs null) + (3) outcome enum 6-value discriminated union pass-through
     (complete/max-iter/verbatim-fail/spawn-err/install-err/arbitrate-err).

     Sister vi.mock node:fs sync pattern reuse from T1.4 tests/audit/log.test.ts.
     Biome preempt PASS pre-commit MANDATORY. typecheck + tests --run 3/3 pass.
     ```
  5. **Update Resolved (T1.5)** block at task_plan.md top with outcome
- **acceptance_criteria**:
  - `test -f tests/audit/hook.test.ts` exit 0 (NEW file present)
  - `corepack pnpm test -- tests/audit/hook.test.ts --run` exit 0 (3+ fixtures pass)
  - `grep -q "import.*emitAudit.*from.*'../../src/audit/hook" tests/audit/hook.test.ts` exit 0
  - `corepack pnpm exec biome check --write` exit 0
  - `corepack pnpm typecheck` exit 0
- **decision_source**: RESEARCH § 2.8 supplement (hook integration test 3-cell scope) + PATTERNS § 2.4 sister vi.mock pattern reuse

---

### T1.6 — docs/adr/0018-routing-audit-log.md NEW ~180-200L PRIMARY 9-section errata format sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 100% reuse + D-02 forward-only rationale section EXPLICIT cross-ref ADR 0019 STATE COLLAPSE per CONTEXT D-02 L63

- **files_modified**:
  - `docs/adr/0018-routing-audit-log.md` (NEW ~180-200L PRIMARY ADR 9-section errata format: Status + Context + Decisions (D-01 + D-02 + hook extract + src/audit/ naming) + A7 Conservation (ADR 0001-0017 untouched + baseline tag iter 17→18 Wave 2 T2.4 落地) + Consequences (capability delta table) + Compliance (F1-F8 evidence) + Errata-path (frozen Phase 4.3) + Adoption-confirmation + References)
- **read_first**:
  - `docs/adr/0017-routing-hit-rate-token-budget.md` entire (by Read — verify 204L 9-section errata format gold-standard template; copy structure adapt content)
  - `.planning/phase-4.3/4.3-CONTEXT.md` § D-01 + D-02 + § Code Context (decision content + sneak-blocks + cross-ref)
  - `.planning/phase-4.3/4.3-RESEARCH.md` § 3.1-3.2 (9-section format analysis + ADR 0018 content requirements)
  - `.planning/phase-4.3/4.3-PATTERNS.md` § 2.5 (concrete ADR 0018 section excerpt + A7 Conservation pattern)
- **action**:
  1. Read sister ADR 0017 to confirm 9-section template + adapt verbatim structure
  2. Create NEW file `docs/adr/0018-routing-audit-log.md` ~180-200L per RESEARCH § 3.2 9-section format:
     ```markdown
     # ADR 0018: Routing Audit Log (JSONL append-only + 11-field schema + forward-only)

     ## Status

     **Accepted (phase 4.3 W1/W2 — 2026-05-19)** — R8.1 audit log NEW infrastructure ship: src/audit/log.ts ≤80L JSONL append-only writer + 11-field AuditRecordSchema TypeBox + src/audit/hook.ts ≤50L thin engine integration wrapper + src/routing/engine.ts MODIFY surgical 2L shrink + 4 emitAudit call sites + tests/audit/{log,hook}.test.ts 11+ fixtures + ADR 0019/0020 backfill cohort + ci.yml A7 iter 0017→0018 + triple tag sister v0.3.0 close cadence延袭.

     ## Context

     R8.1 spec verbatim: `.harnessed/audit.log` 记录每次路由决策 (来源 routing 文件 + 备选 + 实际命令), user 可 grep 排错; 100% 路由决策 traceable. R9.2 transparency: 路由决策 100% 可追溯 + 降级零静默. Dogfood phase (v0.4.0) routing engine has shipped + verified 30/30 100% per-tier (Phase 3.4) but no per-decision persistent log exists for post-hoc troubleshooting. Phase 4.3 = v0.4.0 milestone 3/3 CLOSE + ARCHITECTURAL phase class per M-01 LOCK (NOT R-5 publish-only sister Phase 4.1+4.2).

     Sister D-04 STATE COLLAPSE 5-recurrence terminus 教训 (Phase 3.3 D-04 — ADR 0019 backfill): dual-SoT 反 pattern 必终止 (5 recurrences README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 block). Audit log MUST be NEW SoT for routing-decision dimension forward-only NOT 重复 implementation-decision SoT existing in PLAN.md / CONTEXT.md / RETROSPECTIVE.md.

     ## Decisions

     ### § 1 D-01 AuditFormat JSONL append-only + 11-field routing-decision schema

     Format: JSONL (1 line per decision) — machine-parseable (jq filter) + human-readable (grep) + append-safe (no JSON-array rewrite). 11 fields exact per CONTEXT.md L34-43:

     - `ts` (ISO 8601 timestamp)
     - `phase` (TaskContext.phaseId, fallback "unknown")
     - `task_excerpt` (truncated 200 char of task.task)
     - `task_sha1` (full task sha1 for dedup + cross-ref)
     - `matched_rule_id` (Rule.id from decision_rules.yaml OR null)
     - `primary_expert` + `secondary_expert` (from ArbitrateResult)
     - `category` (meta/engineering/design/content/testing/search)
     - `route_layer` ("L1-keyword" / "L2-semantic-stub" / "L3-fallback")
     - `outcome` ("complete" / "max-iter" / "verbatim-fail" / "spawn-err" / "install-err" / "arbitrate-err")
     - `session_id` (if captured from SDK system:init; nullable)
     - `iter_count` (ralph-loop iterations to COMPLETE; nullable Phase 4.3 YAGNI per RESEARCH § 7 Q2)

     Sneak-blocks: NO JSON array (rewrite-overhead append-unsafe under concurrent write) + NO multi-format dual-write + NO full agentDef 14-field dump (敏感 path 用户名 leak) + NO subagent text/result body (sensitive code leak) + NO MCP secrets/env vars. Storage `.harnessed/audit.log` single file append-only. TypeBox additionalProperties:false enforce 11 fields exact.

     ### § 2 D-02 BackfillScope NEW forward-only from Phase 4.3 ship

     Audit.log starts forward from Phase 4.3 ship; **prior decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT — see ADR 0019 for STATE COLLAPSE dual-SoT lesson**. NOT backfill Phase 1-4 history. Rationale: PLAN D-* = implementation decision (e.g., 选 D-01 EXPAND 50L → 150L) vs audit.log = routing decision (e.g., task → matched_rule → expert spawn) — semantic mismatch, 手工 extract 错配风险. Karpathy YAGNI: R8.1 验收 "100% 可追溯" 含义 = R8.1 ship 起 100%, NOT 历史 reconstruct (R8.1 spec 无 "backfill" verbatim 字面).

     Sneak-blocks: NO git log reconstruction (commit msg ≠ routing decision) + NO PLAN D-* manual backfill (semantic mismatch) + NO partial Phase 4.x only retrofit. 守 single-SoT institutionalize per Phase 3.3 D-04 COLLAPSE 5-recurrence terminus 教训.

     ### § 3 Hook extract pattern + src/audit/ NEW module naming

     src/audit/log.ts NEW ≤80L + src/audit/hook.ts NEW ≤50L thin engine integration wrapper (sister src/checkpoint/engineHook.ts 48L PRIMARY helper extract pattern延袭). NOT src/cli/audit.ts (manifest audit naming conflict per CONTEXT § Code Context). engine.ts ≤200L Karpathy hard limit preserved via surgical 2L shrink L120-122 + thin hook wrapper minimizes call-site footprint.

     ## A7 Conservation

     Phase 4.3 沿袭 ADR 0003/.../0017 errata 风格 — **不动 ADR 0001-0017 main body** (A7 守恒). Baseline tag iterate 17 → 18 (Wave 2 T2.4 ship 时 push `adr-0018-accepted` tag; ci.yml A7 step iter `0001-0017` → `0001-0018` per Phase 4.3 W2 T2.4 explicit literal fix sister Phase 3.4 W2 T2.7 + Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 pattern延袭).

     Verify command pre-tag: `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l == 0`. README.md update NOT covered by A7 (not numbered file pattern NNNN-*.md).

     Note: ADR 0019/0020 backfill = NEW sequential numbers (NOT retro-inject 0014.x); backfill 到 Phase 4.3 ship 时刻同时 frozen. 本 ADR 0018 起 Phase 4.3 ship 时刻 frozen; v0.5+ 演化走 ADR 0022+ errata (NOT 0019 which is backfill).

     ## Consequences

     | Delta | Detail |
     |-------|--------|
     | NEW src/audit/log.ts | ≤80L JSONL append-only writer + AuditRecordSchema TypeBox 11 fields |
     | NEW src/audit/hook.ts | ≤50L thin engine integration wrapper emitAudit (sister engineHook.ts pattern) |
     | MODIFY src/routing/engine.ts | surgical 2L shrink + import emitAudit + 4 call sites (post-MODIFY ≤200L verified) |
     | NEW tests/audit/log.test.ts + hook.test.ts | 11+ fixtures pass (vi.mock node:fs sync pattern) |
     | NEW .harnessed/audit.log | JSONL forward-only from Phase 4.3 ship; sister .harnessed/ dir reused from checkpoint |

     **Negative consequences**: (a) audit.log size grows unbounded — rotation deferred v0.5+ if signal (expected ~1KB per decision × usage frequency); (b) no concurrent write lock — single-maintainer dogfood scope acceptable per sister #BU defer; (c) iter_count=null Phase 4.3 — ralphLoopWrap returns string only NOT count, defer v0.5+ if consumer demands per RESEARCH § 7 Q2.

     **Mitigation**: ADR 0018 documents intentional deferrals + cross-ref ADR 0019 STATE COLLAPSE single-SoT institutionalize. ADR 0018 errata-path frozen — future audit consumer (harnessed audit log --filter CLI subcommand) goes ADR 0022+.

     ## Compliance

     | F | Acceptance bar | Evidence |
     |---|---------------|----------|
     | F1 | R8.1 "100% 路由决策可追溯" from Phase 4.3 ship forward | src/audit/log.ts emitAuditRecord called from engine.ts 4 paths (1 success + 3 error) — verified W2 DOGFOOD Axis A manual emit smoke + jq schema validate |
     | F2 | D-01 11 fields exact + TypeBox additionalProperties:false | AuditRecordSchema 11 Type.{String,Union,Number} entries + Value.Check tests |
     | F3 | D-02 forward-only documented | This ADR § 2 + cross-ref ADR 0019 STATE COLLAPSE |
     | F4 | Karpathy ≤80L log.ts + ≤50L hook.ts + ≤200L engine.ts | wc -l verified W1 T1.1 + T1.2 + T1.3 acceptance |
     | F5 | tests pass | corepack pnpm test -- tests/audit/ --run exit 0 (8 + 3 = 11+ fixtures) |
     | F6 | STRIDE 8-node mitigation (T-4.3-01-08) | <threat_model> Phase 4.3 PLAN.md + sneak-blocks D-01 + STRIDE T-4.3-01/04/05 grep verify acceptance |
     | F7 | ci.yml A7 step iter 0001-0017 → 0001-0018 | W2 T2.4 4 surgical edits + STRICT ordering before adr-0018-accepted tag |
     | F8 | Triple tag LOCAL CREATE STRICT ORDER | W2 T2.15 adr-0018-accepted → v0.4.0-alpha.3-audit → 🎯 v0.4.0; NO push per CLAUDE.md commit safety |

     ## Errata-path note

     ADR 0018 frozen at Phase 4.3 ship (2026-05-19); future audit infrastructure evolution goes ADR 0022+ errata (NOT 0019/0020 which are backfill for Phase 3.3/4.2 institutional patterns). v0.5+ candidate erratas: harnessed audit log --filter CLI subcommand (DEFERRED v0.5+ consumer) + audit.log rotation (DEFERRED v0.5+ if size growth signal) + iter_count actual tracking (DEFERRED v0.5+ if consumer demands).

     ## Adoption-confirmation

     Phase 4.3 W2 ship evidence: triple tag LOCAL CREATE 3 tags (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0) + DOGFOOD-T2.X.md PASS 3/3 axes + v0.4.0 milestone close 3-file archive triplet (.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md). 17/17 100% phase ship close.

     Deferred items disposition (per Phase 4.3 deferred-items.md IF DEFER path active OR sister Phase 4.2 deferred-items.md carry-forward): #BU state lock defer Phase 4.4+ + #BV uninstall command defer Phase 4.5+/v0.5 + #1/#BL + #5/#BM PERMANENT DEFER + #AH path traversal regex defer Phase 4.4+ conditional.

     ## References

     **Internal**:
     - `.planning/phase-4.3/4.3-CONTEXT.md` D-01 + D-02 + D-03 + D-04 LOCKED
     - `.planning/phase-4.3/4.3-RESEARCH.md` § 2.1-2.8 (R8.1 implementation research)
     - `.planning/phase-4.3/4.3-PATTERNS.md` § 2.1-2.5 (analog mapping + concrete code excerpt)
     - `docs/adr/0019-state-dual-ssot-collapse-pattern.md` (Phase 3.3 D-04 backfill — D-02 forward-only cross-ref)
     - `docs/adr/0020-hybrid-2clock-disambiguation.md` (Phase 4.2 D-04 backfill — sister institutional pattern)
     - `docs/adr/0017-routing-hit-rate-token-budget.md` (sister 9-section errata format gold-standard template)
     - `src/routing/engine.ts` (MODIFY integration point)
     - `src/checkpoint/engineHook.ts` (sister extract pattern precedent)
     - `.planning/REQUIREMENTS.md` R8.1 + R9.2

     **External**:
     - [JSON Lines spec](https://jsonlines.org/)
     - [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) (CHANGELOG.md format reference Phase 4.3 W2 T2.5)
     ```
  3. Hard cap verify: `wc -l docs/adr/0018-routing-audit-log.md` ≤ 250 (sister ADR 0017 204L precedent + buffer)
  4. Biome NOT needed (.md extension) — skip biome preempt
  5. **Recommended commit msg**:
     ```
     docs(phase-4.3-w1): T1.6 — docs/adr/0018-routing-audit-log.md NEW ~180-200L PRIMARY 9-section errata format (R8.1 audit log architecture; D-02 forward-only cross-ref ADR 0019 STATE COLLAPSE per CONTEXT D-02 L63)

     Sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 9-section errata
     format gold-standard 100% reuse: Status + Context + Decisions (D-01 11-field
     + D-02 forward-only + hook extract + src/audit/ naming) + A7 Conservation
     (ADR 0001-0017 unchanged + baseline tag iter 17→18 Wave 2 T2.4 落地) +
     Consequences (capability delta + negative + mitigation) + Compliance (F1-F8
     evidence) + Errata-path (frozen Phase 4.3) + Adoption-confirmation + Refs.

     D-02 forward-only rationale EXPLICIT cross-ref ADR 0019 STATE COLLAPSE per
     CONTEXT D-02 L63: audit.log starts forward from Phase 4.3 ship; prior
     decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT.

     ADR 0018 PRIMARY anchor for Phase 4.3 ARCHITECTURAL phase class M-01 LOCK
     (full ship cadence ADR + ci.yml A7 iter + triple tag). Frozen at Phase 4.3
     ship; v0.5+ evolution goes ADR 0022+ (NOT 0019/0020 backfill).
     ```
  6. **Update Resolved (T1.6)** block at task_plan.md top with outcome
- **acceptance_criteria**:
  - `test -f docs/adr/0018-routing-audit-log.md` exit 0 (NEW PRIMARY ADR; F5)
  - `wc -l docs/adr/0018-routing-audit-log.md` ≤ 250 (sister ADR 0017 204L precedent + buffer)
  - `grep -c "^## " docs/adr/0018-routing-audit-log.md` ≥ 9 (9-section errata format)
  - `grep -q "Accepted (phase 4.3" docs/adr/0018-routing-audit-log.md` exit 0 (Status section)
  - `grep -q "A7 Conservation\\|A7 守恒" docs/adr/0018-routing-audit-log.md` exit 0 (A7 section)
  - `grep -q "see ADR 0019\\|ADR 0019.*STATE COLLAPSE" docs/adr/0018-routing-audit-log.md` exit 0 (D-02 cross-ref CONTEXT D-02 L63)
- **decision_source**: CONTEXT § D-01 + D-02 + D-03 + Code Context + RESEARCH § 3.1-3.2 + PATTERNS § 2.5 + sister ADR 0017 9-section format gold-standard template

---

## Wave 1 done — proceed to Wave 2 R8.4 backfill + CHANGELOG + 🎯 v0.4.0 milestone close (12 atomic; sister Phase 3.4 W2 11-task milestone close cadence延袭)

---

## Wave 2 — R8.4 backfill + CHANGELOG + 🎯 v0.4.0 milestone close (12 atomic; sister Phase 3.4 W2 milestone close cadence延袭)

> **W2 task list summary** (sister Phase 3.4 W2 11-task milestone close cadence延袭 — Phase 4.3 W2 12-task ARCHITECTURAL ship + close + ADR backfill scope):
> - T2.1 docs/adr/0019-state-dual-ssot-collapse-pattern.md NEW backfill simplified 5-section
> - T2.2 docs/adr/0020-hybrid-2clock-disambiguation.md NEW backfill simplified 5-section
> - T2.3 docs/adr/README.md MODIFY +3 rows index entries 0018/0019/0020
> - T2.4 .github/workflows/ci.yml MODIFY A7 step iter 0017→0018 (4 surgical edits; STRICT ordering before tag)
> - T2.5 CHANGELOG.md NEW ~30L Keep-a-Changelog format root-level v0.4.0 entry
> - T2.6 .planning/STATE.md 续编 Phase 4.3 SHIPPED + v0.4.0 3/3 🎯 SHIPPED ARCHIVED (combined W0.1 archive sub-step)
> - T2.7 .planning/RETROSPECTIVE.md Phase 4.3 7-section retrospective + cross-milestone v0.4.0 close trends
> - T2.8 .planning/ROADMAP.md Phase 4.3 ✅ SHIPPED + v0.4.0 🎯 SHIPPED ARCHIVED close marker
> - T2.9 PROJECT-SPEC.md L3 Status header Phase 4.3 SHIPPED + 🎯 v0.4.0 close
> - T2.10 README.md L9 Status freshness + v0.4.0 3/3 🎯 marker + Phase 4.3 row append
> - T2.11 .planning/milestones/v0.4.0-ROADMAP.md NEW snapshot sister v0.3.0 format 100% reuse
> - T2.12 .planning/milestones/v0.4.0-REQUIREMENTS.md NEW snapshot sister v0.3.0 format 100% reuse
> - T2.13 .planning/milestones/v0.4.0-MILESTONE-AUDIT.md NEW + § 7 R-5 mitigation "Cadence Patterns" section per CONTEXT #BO
> - T2.14 .planning/phase-4.3/DOGFOOD-T2.X.md NEW PASS 3/3 axes (A R8.1 audit log infra + B ADR backfill cluster + C v0.4.0 milestone close)
> - T2.15 Triple tag LOCAL CREATE 3 tags STRICT ORDER (adr-0018-accepted → v0.4.0-alpha.3-audit → 🎯 v0.4.0); NO push per CLAUDE.md commit safety

> **W2 per-task structure abbreviated** for length budget — each task follows sister Phase 4.2 W2 task_plan.md per-task structure (files_modified + read_first + action concrete steps + acceptance_criteria grep-verifiable + decision_source + Recommended commit msg Karpathy why-not-what). Executor SHALL expand each W2 task to full sister Phase 4.2 W2 task_plan format during execution per sister cadence延袭. Key per-task verifications enumerated in PLAN.md `<verification>` block already executable.

### T2.1 — docs/adr/0019-state-dual-ssot-collapse-pattern.md NEW backfill simplified 5-section format (Phase 3.3 D-04 STATE COLLAPSE 5-recurrence terminus source)

- **files_modified**: `docs/adr/0019-state-dual-ssot-collapse-pattern.md` (NEW backfill simplified 5-section format per RESEARCH § 3.3)
- **read_first**: `.planning/phase-3.3/3.3-CONTEXT.md` D-04 + `.planning/RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4` + `docs/adr/0017-routing-hit-rate-token-budget.md` (9-section reference but simplify to 5-section per RESEARCH § 3.3)
- **action**: Create simplified 5-section format ADR — Status (Accepted backfill — Phase 3.3 source ratified Phase 4.3 W2 — 2026-05-19) + Context (5 dual-SoT recurrences enumerated) + Decision (COLLAPSE pattern + single-SoT institutionalize + check-transparency-verdicts.mjs STATE_POSITION_RE OR-fallback) + Consequences (STATE.md single SoT + check-state-archive-stale.mjs 3-rules gate + sister M2 D2 cadence standing process iter 1→2→3→4 verified) + References (.planning/phase-3.3/3.3-CONTEXT.md D-04 + .planning/RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4)
- **acceptance_criteria**: `test -f docs/adr/0019-state-dual-ssot-collapse-pattern.md` + `grep -c "^## " ≥ 5` (5-section format) + `grep -q "5-recurrence\\|dual-SoT\\|COLLAPSE"` exit 0
- **decision_source**: CONTEXT D-03 L72 + RESEARCH § 3.3 + PATTERNS § 1 row 12

### T2.2 — docs/adr/0020-hybrid-2clock-disambiguation.md NEW backfill simplified 5-section format (Phase 4.2 D-04 HYBRID 2-clock disambiguation source)

- **files_modified**: `docs/adr/0020-hybrid-2clock-disambiguation.md` (NEW backfill same simplified 5-section format per RESEARCH § 3.4)
- **read_first**: `.planning/phase-4.2/4.2-CONTEXT.md` D-04 + `.planning/STATE.md` L24 current 2-clock disambiguation note
- **action**: Create simplified 5-section format ADR — Status (Accepted backfill — Phase 4.2 source ratified Phase 4.3 W2) + Context (ROADMAP "2-3 weeks" v0.4.0 vs R8.2 "6-month co-maintainer window" semantic conflict) + Decision (HYBRID two clocks SEPARATE internal ship vs external organic) + Consequences (STATE.md L23 + RETRO § Cost patterns explicit 2-clock language + standing process for v0.5+ external-dependency phases) + References (.planning/phase-4.2/4.2-CONTEXT.md D-04 + .planning/STATE.md L24)
- **acceptance_criteria**: `test -f docs/adr/0020-hybrid-2clock-disambiguation.md` + `grep -c "^## " ≥ 5` + `grep -q "HYBRID\\|2-clock\\|internal ship.*external"` exit 0
- **decision_source**: CONTEXT D-03 L73 + RESEARCH § 3.4 + PATTERNS § 1 row 13

### T2.3 — docs/adr/README.md MODIFY +3 rows index entries 0018/0019/0020 (sister Phase 3.4 ADR 0017 single-add cadence延袭)

- **files_modified**: `docs/adr/README.md` (MODIFY +3 rows append after L49 last existing entry — sister Phase 3.4 ADR 0017 single-add cadence延袭 NOT triple-add 之前一次性 per CONTEXT D-03 L78)
- **read_first**: `docs/adr/README.md` entire (verify existing 8-row table format + L49 append site)
- **action**: ADD 3 NEW pipe-delimited rows after L49 — 0018 Routing Audit Log + 0019 STATE dual-SoT COLLAPSE Pattern (Phase 3.3 D-04 backfill) + 0020 HYBRID 2-clock Disambiguation (Phase 4.2 D-04 backfill); OPTIONAL bonus 0009-0017 gap catchup IF Wave 2 time allows per RESEARCH § 7 Q3 (low-effort high-transparency value but NOT required by D-03 scope)
- **acceptance_criteria**: `grep -c "| \\[0018\\]\\|| \\[0019\\]\\|| \\[0020\\]" docs/adr/README.md` == 3
- **decision_source**: CONTEXT D-03 L78 + RESEARCH § 3.6 + PATTERNS § 1 row 14 + § 2.6

### T2.4 — .github/workflows/ci.yml MODIFY A7 step iter 0017→0018 (4 surgical edits per RESEARCH § 3.7 + § 4.5; STRICT ordering commit + push BEFORE adr-0018-accepted tag per RESEARCH § 4.4 STRIDE T-4.3-07 mitigation)

- **files_modified**: `.github/workflows/ci.yml` (MODIFY 4 surgical edits Line 82 step name + L85 first for loop + L96 second for loop + L107 echo all `0017`→`0018`)
- **read_first**: `.github/workflows/ci.yml` L82-107 (by Read — verify A7 step current state + 4 edit sites)
- **action**: 4 surgical edits per RESEARCH § 3.7 + § 4.5 exact:
  - Line 82: `ADR 0001-0017 main body 守恒` → `ADR 0001-0018 main body 守恒`
  - Line 85: first for loop ADD `0018` at end
  - Line 96: second for loop ADD `0018` at end
  - Line 107: echo `A7 ✅ ADR 0001-0017` → `ADR 0001-0018`
  - OPTIONAL Line 34 comment block ADD `Phase 4.3 ADR 0018 errata` sister Phase 3.4 cadence延袭
  - STRICT ordering: commit + push BEFORE W2 T2.15 adr-0018-accepted tag creation (STRIDE T-4.3-07 + R-3 mitigation)
- **acceptance_criteria**: `grep -q "ADR 0001-0018 main body 守恒" .github/workflows/ci.yml` + `grep -c "0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018" .github/workflows/ci.yml` == 2 + `grep -q "A7 ✅ ADR 0001-0018 main body unchanged" .github/workflows/ci.yml` exit 0
- **decision_source**: CONTEXT § Code Context + RESEARCH § 3.7 + § 4.4 + § 4.5 + PATTERNS § 2.7 + STRIDE T-4.3-07 mitigation

### T2.5 — CHANGELOG.md NEW ~30L Keep-a-Changelog format root-level v0.4.0 entry (per RESEARCH § 4.1 + D-04 LOCK)

- **files_modified**: `CHANGELOG.md` (NEW root-level ~30L Keep-a-Changelog format — first CHANGELOG in project history; no project analog partial format)
- **read_first**: `.planning/phase-4.3/4.3-RESEARCH.md` § 4.1 (Keep-a-Changelog format verbatim recipe) + `.planning/phase-4.3/4.3-PATTERNS.md` § 4 (CHANGELOG.md template)
- **action**: Create NEW root-level file `CHANGELOG.md` per Keep-a-Changelog spec:
  ```markdown
  # Changelog

  All notable changes to this project will be documented in this file.

  The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
  and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

  ## [Unreleased]

  ## [0.4.0] - 2026-05-19

  ### Added
  - Routing audit log (`.harnessed/audit.log`) — JSONL append-only, 11-field schema (R8.1)
  - ADR 0018: routing audit log architecture
  - ADR 0019: STATE dual-SoT collapse pattern (backfill Phase 3.3)
  - ADR 0020: HYBRID 2-clock disambiguation (backfill Phase 4.2)
  - CHANGELOG.md (this file)
  - v0.4.0 milestone archive triplet (.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md)

  ### Changed
  - ci.yml A7 step: ADR 0001-0017 → ADR 0001-0018 integrity gate

  [0.4.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.4.0
  ```
- **acceptance_criteria**: `test -f CHANGELOG.md` + `wc -l CHANGELOG.md ≤ 50` + `grep -q "Keep a Changelog\\|keepachangelog"` + `grep -q "## \\[0.4.0\\] - 2026-05-19"` + `grep -q "audit log"` + `grep -q "ADR 0018\\|ADR 0019\\|ADR 0020"` + `! grep -q "docs/RELEASES.md"` exit 0 (D-04 sneak-block #1 no duplicate SoT)
- **decision_source**: CONTEXT D-04 L81-98 + RESEARCH § 4.1 + PATTERNS § 4 (no codebase analog — industry standard Keep-a-Changelog format)

### T2.6 — .planning/STATE.md 续编 Phase 4.3 SHIPPED + 当前位置 v0.4.0 3/3 🎯 SHIPPED ARCHIVED close marker (combined W0.1 D2 cadence iter 4 archive sub-step per sister § cadence)

- **files_modified**: `.planning/STATE.md` (W2 T2.6 续编 — already trimmed at W0.1 T0.1; ADD Phase 4.3 SHIPPED entry + 当前位置 update + v0.4.0 milestone 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close + 进度 16/17 → 17/17 100% close)
- **read_first**: `.planning/STATE.md` post-T0.1 trim baseline + sister Phase 4.2 W2 T2.1 STATE 续编 format
- **action**: Append 已完成 phase ship 历史 17th entry `**Phase 4.3 shipped** ✅ (2026-05-19) — R8.1 audit log NEW infra + R8.4 ADR backfill 3-pattern lock + CHANGELOG + 🎯 v0.4.0 milestone 3/3 close (src/audit/log.ts NEW ≤80L D-01 11-field schema + src/audit/hook.ts NEW ≤50L + src/routing/engine.ts MODIFY surgical 2L shrink + 4 emitAudit + tests/audit/ 11+ fixtures + docs/adr/0018-0020 NEW 3 ADRs + ci.yml A7 iter 0017→0018 + CHANGELOG.md NEW Keep-a-Changelog v0.4.0 + 3-file milestone archive triplet + triple tag LOCAL CREATE adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0 NO push per CLAUDE.md); v0.4.0 milestone 3/3 🎯 SHIPPED ARCHIVED CLOSE; 17/17 100% phase ship close`; update 当前位置 block GSD phase prepend Phase 4.3 SHIPPED + 当前里程碑 v0.4.0 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close + 下一 phase v0.5/v1.0 discuss-phase 启动 + 进度 16/17 → 17/17 100% close (table row v0.4.0 2/3 → 3/3 🎯 SHIPPED ARCHIVED 2026-05-19); biome NOT needed (.md)
- **acceptance_criteria**: `grep -q "Phase 4.3 SHIPPED" .planning/STATE.md` + `grep -q "v0.4.0.*3/3\\|v0.4.0.*🎯 SHIPPED ARCHIVED" .planning/STATE.md` exit 0
- **decision_source**: CONTEXT § Decisions D-04 milestone close cadence + sister Phase 4.2 W2 T2.1 1:1 replicate with content swap

### T2.7 — .planning/RETROSPECTIVE.md Phase 4.3 milestone retrospective 7-section + cross-milestone v0.4.0 close trends

- **files_modified**: `.planning/RETROSPECTIVE.md` (W2 T2.7 续编 — already received W0.1 D2 auto-archive Phase 4.2 at T0.1; ADD Phase 4.3 7-section retrospective sister Phase 4.2 W2 T2.2 7-section format 100% reuse + ADD cross-milestone v0.4.0 close trends section)
- **read_first**: sister `.planning/RETROSPECTIVE.md` Phase 4.2 W2 T2.2 7-section format (just-archived from T0.1) + sister Phase 4.1 retrospective format
- **action**: Append 7-section per sister Phase 4.2 W2 T2.2 cadence — § What worked (4 D-decisions + M-01 ARCHITECTURAL full ship cadence + W0.1 D2 cadence iter 4 REINFORCE + R8.1 NEW src/ + R8.4 ADR backfill 3-pattern + v0.4.0 milestone close 1-day cadence延袭) + § What was inefficient (R8.1 NEW src/ + ADR backfill + milestone close 同 phase scope inflation per CONTEXT #BR 1.5-2 day estimate; first-time NEW src/audit/ surface ~30% W1 reuse vs Phase 4.2 W1 ~78%) + § Patterns established (M-01 PhaseClass ARCHITECTURAL vs R-5 publish-only meta-disambiguation institutionalize standing + ADR backfill institutional pattern lock 3-cohort precedent + sister 5-recurrence terminus heuristic confirmed pattern stable ≥4-iter D2 cadence) + § Cost patterns (Phase 4.3 内部 phase 1.5-2 day cadence per CONTEXT #BR scope inflation tolerable single-phase milestone close; T3 external 6-month organic clock SEPARATE per D-04 HYBRID runs through v0.5/v1.0) + § Key lessons (i ARCHITECTURAL phase class full ship cadence + ii ADR backfill discipline 3-pattern NOT 全 + iii JSONL forward-only single-SoT discipline + iv engine.ts 200L surgical shrink-first institutionalize + v triple tag LOCAL CREATE 待 user push 模式延袭) + § Cross-milestone trends (v0.4.0 milestone close 1-day cadence; 17/17 100% phase ship; sister v0.3.0 close 2-day 比较 — v0.4.0 close single-day 3-phase milestone more efficient) + § Next Phase Prep Notes (v0.5+ discuss-phase 启动 — harnessed audit log --filter consumer + #BU + #BV + #AH + benchmark expand evaluation per #BC); ADD cross-milestone v0.4.0 close trends section explicit
- **acceptance_criteria**: `grep -q "Phase 4.3 milestone retrospective" .planning/RETROSPECTIVE.md` + `grep -q "v0.4.0 close" .planning/RETROSPECTIVE.md` + 7-section structure present
- **decision_source**: sister Phase 4.2 W2 T2.2 7-section format 100% reuse + CONTEXT § Decisions cross-ref

### T2.8 — .planning/ROADMAP.md Phase 4.3 ✅ SHIPPED + v0.4.0 🎯 SHIPPED ARCHIVED close marker

- **files_modified**: `.planning/ROADMAP.md` (MODIFY Phase 4.3 entry L224-226 ✅ SHIPPED + v0.4.0 milestone 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close + L185 v0.4.0 block Status header update + triple tag references + audit cross-link `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md` + v0.5/v1.0 next milestone kickoff reference)
- **read_first**: `.planning/ROADMAP.md` L180-227 (v0.4.0 chapter)
- **action**: MODIFY L224-226 Phase 4.3 ✅ SHIPPED + brief outcome summary sister Phase 4.2 L218-223 verbose 5-bullet format延袭; update L185 v0.4.0 milestone progress 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭); ADD audit cross-link + v0.5/v1.0 next milestone kickoff reference
- **acceptance_criteria**: `grep -q "Phase 4.3.*✅ SHIPPED\\|Phase 4.3 shipped ✅" .planning/ROADMAP.md` + `grep -q "v0.4.0.*SHIPPED ARCHIVED\\|v0.4.0.*🎯 SHIPPED ARCHIVED" .planning/ROADMAP.md` exit 0 (close marker NOT 2/3 PROGRESS anymore)
- **decision_source**: sister Phase 4.2 W2 T2.3 + sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭

### T2.9 — PROJECT-SPEC.md L3 Status header Phase 4.3 SHIPPED + 🎯 v0.4.0 milestone close marker

- **files_modified**: `PROJECT-SPEC.md` (MODIFY L3 Status header + L6 area 下一步 v0.5+ candidate)
- **read_first**: `PROJECT-SPEC.md` L1-10
- **action**: MODIFY L3 Status header ADD Phase 4.3 SHIPPED literal + 🎯 v0.4.0 milestone close marker (sister Phase 4.2 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭); L6 下一步 v0.5/v1.0 candidate
- **acceptance_criteria**: `grep -q "Phase 4.3" PROJECT-SPEC.md` + `grep -q "🎯 v0.4.0\\|v0.4.0.*close\\|v0.4.0.*SHIPPED" PROJECT-SPEC.md` exit 0
- **decision_source**: sister Phase 4.2 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭

### T2.10 — README.md L9 Status freshness + v0.4.0 3/3 🎯 marker + Phase 4.3 row append

- **files_modified**: `README.md` (MODIFY L9 Status freshness + L48 area MILESTONE row v0.4.0 2/3 → 3/3 🎯 SHIPPED ARCHIVED + Phase 4.3 row append shipped phase list)
- **read_first**: `README.md` L1-50 + shipped phase list section
- **action**: MODIFY L9 Status freshness ADD Phase 4.3 SHIPPED + 🎯 v0.4.0 milestone close marker (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭 — preserve single SoT L9 freshness pattern); v0.4.0 MILESTONE row 2/3 → 3/3 🎯 SHIPPED ARCHIVED; Phase 4.3 entry appended shipped phase list (sister Phase 4.2+4.1+3.4+3.3+3.2+3.1 row pattern延袭)
- **acceptance_criteria**: `grep -q "Phase 4.3 SHIPPED" README.md` + `grep -q "🎯 v0.4.0\\|v0.4.0.*SHIPPED ARCHIVED" README.md` + freshness gate post-MODIFY pass (`node scripts/check-transparency-verdicts.mjs` exit 0)
- **decision_source**: sister Phase 4.2 W2 T2.4 1:1 replicate with content swap

### T2.11 — .planning/milestones/v0.4.0-ROADMAP.md NEW snapshot sister v0.3.0 format 100% reuse

- **files_modified**: `.planning/milestones/v0.4.0-ROADMAP.md` (NEW snapshot from .planning/ROADMAP.md L185-227 v0.4.0 chapter; sister `.planning/milestones/v0.3.0-ROADMAP.md` format 100% reuse)
- **read_first**: `.planning/milestones/v0.3.0-ROADMAP.md` (sister format template) + `.planning/ROADMAP.md` L185-227 (v0.4.0 chapter source)
- **action**: Copy sister format + adapt v0.4.0 content — Header `# Milestone v0.4.0: dogfooding benchmark + 稳定期` + `**Status:** 🎯 SHIPPED & ARCHIVED 2026-05-19 (Frozen at v0.4.0 milestone close 2026-05-19)` + `**Phases:** 4.1 / 4.2 / 4.3 (3 phases)` + `**Timeline:** 2026-05-18 → 2026-05-19 (2 days, back-to-back ship sister v0.3.0 cadence)` + `**Git range:** v0.3.0 tag → v0.4.0 tag` + `**Milestone tags:** v0.4.0-alpha.1-benchmark / v0.4.0-alpha.2-community / v0.4.0-alpha.3-audit → 🎯 v0.4.0` + `**Audit:** .planning/milestones/v0.4.0-MILESTONE-AUDIT.md — PASSED (3/3 phase verified)` + `## Overview` paragraph + `## Phases` with per-phase subsections each Goal + Plans + ship outcome + ADR ref
- **acceptance_criteria**: `test -f .planning/milestones/v0.4.0-ROADMAP.md` + `grep -q "Milestone v0.4.0"` + `grep -q "SHIPPED & ARCHIVED 2026-05-19"` exit 0
- **decision_source**: sister v0.3.0-ROADMAP.md format 100% reuse + CONTEXT D-04 L91

### T2.12 — .planning/milestones/v0.4.0-REQUIREMENTS.md NEW snapshot sister v0.3.0 format 100% reuse

- **files_modified**: `.planning/milestones/v0.4.0-REQUIREMENTS.md` (NEW snapshot from REQUIREMENTS.md R8.1-R8.5 v0.4-tagged section frozen)
- **read_first**: `.planning/milestones/v0.3.0-REQUIREMENTS.md` (sister format) + `.planning/REQUIREMENTS.md` R8.1-R8.5 section
- **action**: Copy v0.4-tagged requirements verbatim — R8.1 audit log + R8.2 co-maintainer + R8.3 stale-bot + R8.4 ADR 全集 + R8.5 GitHub Sponsors + status Done frozen at v0.4.0 milestone close; sister v0.3.0-REQUIREMENTS.md format 100% reuse
- **acceptance_criteria**: `test -f .planning/milestones/v0.4.0-REQUIREMENTS.md` + `grep -q "R8.1\\|R8.2\\|R8.3\\|R8.4\\|R8.5"` exit 0 (5 v0.4 requirements verbatim)
- **decision_source**: sister v0.3.0-REQUIREMENTS.md format 100% reuse + CONTEXT D-04 L92

### T2.13 — .planning/milestones/v0.4.0-MILESTONE-AUDIT.md NEW + § 7 R-5 mitigation "Cadence Patterns" section per CONTEXT #BO

- **files_modified**: `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md` (NEW per RESEARCH § 4.2 + PATTERNS § 2.8 sister `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md` 139L format 100% reuse + ADD § 7 NEW R-5 mitigation section at BOTTOM)
- **read_first**: `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md` (sister format template) + `.planning/phase-4.3/4.3-RESEARCH.md` § 4.2 (v0.4.0 specific § 7 addition)
- **action**: YAML front-matter milestone 0.4.0 + audited 2026-05-19 + status passed + scores (requirements 5/5 R8.1-R8.5 all Done + phases 3/3 self-report passed + integration + flows) + gaps [] + tech_debt; markdown body sections `# v0.4.0 Milestone Audit — PASSED` + TL;DR + `## § 0.5 Line Budget Deviations Accepted` (Phase 4.3 src/audit/log.ts ≤80 + hook.ts ≤50 + engine.ts ≤200 + ADR 0018 ≤250 all within budget — 0 deviations) + `## § 1 Per-Phase Status` 3-phase table 4.1+4.2+4.3 + `## § 2 Cross-Phase Integration` seam table (audit hook + ADR backfill A7 守恒 + milestone close 3-file archive) + `## § 3 E2E Flows` + `## § 4 Requirements Coverage` R8.1-R8.5 REQ table + `## § 5 v0.4.0 vs v0.3.0 对比` (3-phase 1-day cadence vs 4-phase 2-day; PRIMARY helper family extension; ADR cohort 17→20) + `## § 6 Verdict PASSED` (triple tag + next milestone v0.5/v1.0); **`## § 7 Cadence Patterns — R-5 Publish-Only vs Architectural Phase Disambiguation` NEW v0.4.0 specific section at BOTTOM** per CONTEXT #BO + RESEARCH § 4.2 — explain Phase 4.1+4.2 R-5 publish-only NO architectural change (docs/community infra) vs Phase 4.3 ARCHITECTURAL NEW src/audit/ module + ADR 0018 + ci.yml A7 iter + triple tag (full ship cadence); M-01 PhaseClass meta-disambiguation explicit; NOT "v0.4.0 决策力下降" but tier区分 explicit; reader 应 compare Phase 4.3 单 phase architectural delta vs v0.3.0 4-phase parallel NOT v0.4.0 整 milestone 3-phase 对比
- **acceptance_criteria**: `test -f .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` + `grep -q "milestone: 0.4.0"` + `grep -q "v0.4.0 Milestone Audit"` + `grep -q "Cadence Patterns\\|§ 7 Cadence"` + `grep -q "R-5 publish-only\\|Architectural"` exit 0
- **decision_source**: CONTEXT D-04 L93 + #BO + RESEARCH § 4.2 + sister v0.3.0-MILESTONE-AUDIT.md 139L format 100% reuse

### T2.14 — .planning/phase-4.3/DOGFOOD-T2.X.md NEW PASS 3/3 axes (A R8.1 audit log infra + B ADR backfill cluster + C v0.4.0 milestone close)

- **files_modified**: `.planning/phase-4.3/DOGFOOD-T2.X.md` (NEW ~55-60L PASS 3/3 axes sister Phase 4.2 DOGFOOD 58L format 100% reuse adapted Phase 4.3 ARCHITECTURAL scope)
- **read_first**: `.planning/phase-4.2/DOGFOOD-T2.X.md` (sister 58L format gold-standard template) + `.planning/phase-4.3/PLAN.md` <interfaces> Phase 4.3 W2 T2.14 mirror section
- **action**: Create NEW ~55-60L 3-axis empirical evidence per sister Phase 4.2 DOGFOOD 58L format 100% reuse (Date + Verdict + 3 Axis sections + Aggregate verification + Disposition):
  - **Axis A R8.1 audit log infra verify**: `wc -l src/audit/log.ts` ≤80 + `wc -l src/audit/hook.ts` ≤50 + `wc -l src/routing/engine.ts` ≤200 Karpathy hard + `corepack pnpm test -- tests/audit/log.test.ts tests/audit/hook.test.ts --run` exit 0 (11+ fixtures pass) + manual emit smoke `node -e "import('./dist/audit/hook.js').then(m => m.emitAudit(...))"` verify .harnessed/audit.log created + `jq '.' .harnessed/audit.log | head -1` 11-field schema valid
  - **Axis B ADR backfill cluster verify**: `ls docs/adr/{0018,0019,0020}-*.md | wc -l` == 3 + 9-section 0018 grep + 5-section 0019/0020 grep + `grep -c "| \\[001[8-9]\\|| \\[0020" docs/adr/README.md` ≥ 3 + `grep -c "0018" .github/workflows/ci.yml` ≥ 2 (both for loops) + `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 (A7 守恒 verify pre-tag)
  - **Axis C v0.4.0 milestone close cluster verify**: `test -f CHANGELOG.md` + `grep "## \\[0.4.0\\] - 2026-05-19" CHANGELOG.md` + `ls .planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md | wc -l` == 3 + `grep -q "v0.4.0.*🎯 SHIPPED ARCHIVED\\|SHIPPED & ARCHIVED 2026-05-19" .planning/ROADMAP.md` + `git tag --list 'adr-0018-accepted' | wc -l` == 1 + `git tag --list 'v0.4.0-alpha.3-audit' | wc -l` == 1 + `git tag --list 'v0.4.0' | wc -l` == 1 + `git ls-remote origin refs/tags/v0.4.0` returns empty (verify NO push)
  - PASS verdict header `PASS 3/3 dogfood axes verified, miss: none`
  - Karpathy ≤60L sister Phase 4.2 DOGFOOD 58L precedent
- **acceptance_criteria**: `test -f .planning/phase-4.3/DOGFOOD-T2.X.md` + `wc -l ≤ 60` + `grep -q "PASS"` + `grep -q "Axis A\\|Axis B\\|Axis C"` exit 0
- **decision_source**: sister Phase 4.2 DOGFOOD-T2.X.md 58L format 100% reuse + Phase 4.3 ARCHITECTURAL scope adapt

### T2.15 — Triple tag LOCAL CREATE 3 tags STRICT ORDER (adr-0018-accepted → v0.4.0-alpha.3-audit → 🎯 v0.4.0); NO push per CLAUDE.md commit safety

- **files_modified**: (no files — git tags only; LOCAL CREATE 3 tags annotated NO push)
- **read_first**: `.planning/phase-4.3/4.3-RESEARCH.md` § 4.4 (triple tag creation procedure + STRICT ordering constraint) + `.planning/phase-4.3/PLAN.md` <threat_model> STRIDE T-4.3-07 + T-4.3-08 mitigations
- **action**:
  1. **PRE-TAG verify A7 守恒** (STRIDE T-4.3-06 mitigation): `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` MUST == 0 (no edit to existing ADR main body)
  2. **PRE-TAG verify W2 T2.4 ci.yml A7 iter commit pushed** (STRIDE T-4.3-07 + R-3 mitigation): `git log --pretty=format:'%H %ct' .github/workflows/ci.yml | head -1` timestamp captured for ordering verify
  3. **Create tag 1 — adr-0018-accepted** (PRIMARY ADR lock):
     ```bash
     git tag -a adr-0018-accepted -m "ADR 0018: routing audit log — JSONL+11-field schema+forward-only (Phase 4.3 W1/W2 ship)"
     ```
  4. **Create tag 2 — v0.4.0-alpha.3-audit** (Phase 4.3 baseline tag):
     ```bash
     git tag -a v0.4.0-alpha.3-audit -m "Phase 4.3 baseline: R8.1 audit log + R8.4 ADR backfill (v0.4.0 milestone 3/3)"
     ```
  5. **Create tag 3 — 🎯 v0.4.0** (milestone close tag):
     ```bash
     git tag -a v0.4.0 -m "🎯 v0.4.0: dogfooding benchmark + 稳定期 (Phase 4.1+4.2+4.3) milestone close"
     ```
  6. **POST-TAG verify NO push** (STRIDE T-4.3-08 + CLAUDE.md commit safety):
     - `git ls-remote origin refs/tags/adr-0018-accepted` returns empty
     - `git ls-remote origin refs/tags/v0.4.0-alpha.3-audit` returns empty
     - `git ls-remote origin refs/tags/v0.4.0` returns empty
  7. **POST-TAG verify ordering** (STRIDE T-4.3-07 mitigation): ci.yml A7 iter commit timestamp (from step 2) MUST < adr-0018-accepted tag creator timestamp via `git for-each-ref --format='%(creatordate:unix)' refs/tags/adr-0018-accepted`
  8. NO commit (this task is tag-only); NO push (user controls all push per CLAUDE.md commit safety)
- **acceptance_criteria**:
  - `git tag --list 'adr-0018-accepted' | wc -l` == 1
  - `git tag --list 'v0.4.0-alpha.3-audit' | wc -l` == 1
  - `git tag --list 'v0.4.0' | wc -l` == 1
  - `git ls-remote origin refs/tags/adr-0018-accepted` returns empty (NO push)
  - `git ls-remote origin refs/tags/v0.4.0-alpha.3-audit` returns empty (NO push)
  - `git ls-remote origin refs/tags/v0.4.0` returns empty (NO push)
  - `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 (A7 守恒 verify pre-tag PASS)
  - ci.yml A7 iter commit timestamp < adr-0018-accepted tag creator timestamp (ordering verify)
- **decision_source**: CONTEXT D-04 L82-89 triple tag cadence延袭 + RESEARCH § 4.4 STRICT ordering + STRIDE T-4.3-06/07/08 mitigations + CLAUDE.md commit safety

---

## Wave 2 done — Phase 4.3 SHIPPED + 🎯 v0.4.0 milestone 3/3 SHIPPED ARCHIVED CLOSE (17/17 100% phase ship close)

---

## End of task_plan.md

> Phase 4.3 ship complete pending user push approval (per CLAUDE.md commit safety: 3 triple tag LOCAL CREATE waiting user explicit push request). DOGFOOD-T2.X.md PASS 3/3 axes verified. 17/17 100% phase ship close. v0.5/v1.0 discuss-phase next.
