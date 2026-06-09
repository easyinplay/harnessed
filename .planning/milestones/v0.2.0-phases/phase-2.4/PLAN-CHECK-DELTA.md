# Phase 2.4 — PLAN-CHECK DELTA

> **Verdict:** APPROVED (0 BLOCKER / 0 WARNING / 2 SUGGESTION, miss: none) — 2026-05-16
> **Checker**: gsd-plan-checker (Claude Opus 4.7, 1M ctx)
> **Scope**: CC fix integration (commit 69e0a0f) re-verify
> **Base**: original Wave C PLAN-CHECK c4c5a30 (APPROVED WITH CONDITIONS — 2B/6W/5S)
> **Delta**: 13 plan-layer fixes (B1 + B2 + W1-W6 + S1-S5)
> **Method**: goal-backward — for each fix, ask does it actually close the original finding
> **Read-only audit** — 0 source files modified; only PLAN-CHECK-DELTA.md Written.
> **Tool usage**: ~18 (well under 25 hard cap)

---

## Summary

Commit 69e0a0f applied 13 fixes across 4 files (+153 / -46: REQUIREMENTS.md +49, PATTERNS.md +40/-22, PLAN.md +6/-3, task_plan.md +104/-46). Delta re-verify confirms **2/2 BLOCKER closed + 6/6 WARNING closed + 5/5 SUGGESTION integrated**, plus A7 + SSOT cross-cut both PASS. No new BLOCKER or WARNING introduced. 2 advisory SUGGESTION carry-overs surfaced (executor watch-items, not fix gaps).

**Key real-state evidence**:
- **B1**: live regex on current README — SHIPPED=3 / BARS=3 / L44=3 — all three match — CI gate will PASS first push (root cause closed)
- **B2**: grep R2.4.[1-7] heading on REQUIREMENTS.md = 7 — PLAN frontmatter R2.4.1~R2.4.7 all real (file_references_verified self-check no longer self-reflexive)
- **A7**: git diff on ADR 0001-0012 main body wc -l = 0 — ADR 0001-0012 untouched
- **SSOT**: 0 literal ADR 0013 enforcement introduced; all references either historical 不预占 0013 annotations OR placeholder with discipline note

---

## 13 CC Fix Delta Checks

### Fix B1 — README counter grep regex 精度 + pre-flight FIX
- **Status**: PASS
- **Evidence**:
  - task_plan.md:100 — acceptance SHIPPED grep with line-start anchor + bold escape + scope 2.[1-9] regex
  - task_plan.md:112 — CI yaml step embedded with same regex
  - task_plan.md:107 — step 2 在 transparency/provenance step 后加 README counter integrity gate
  - task_plan.md:126 — verify grep README counter integrity gate in .github/workflows/ci.yml | wc -l == 1
  - **Real-state**: live regex on current README — SHIPPED=3, BARS=3, L44=3 — triple match, first push will not red
- **Closes B1**: YES — root cause (regex 不分行界 + L44 enumeration 误命中) eliminated by line-start + bold anchor; pre-flight FIX path also encoded

### Fix B2 — REQUIREMENTS.md R2.4.1~R2.4.7 expand + T0.5 verify
- **Status**: PASS
- **Evidence**:
  - REQUIREMENTS.md:88-130 — 7 new entries (R2.4.1 doctor / R2.4.2 EE-4 plan-checker / R2.4.3 README counter / R2.4.4 SessionStart hook / R2.4.5 SSE watcher / R2.4.6 multi-project / R2.4.7 ralph-loop Win) — sister R6.1-R6.5 / R7.1-R7.6 expand pattern followed
  - task_plan.md:174 — T0.5 verify grep R2.4.[1-7] heading on REQUIREMENTS.md == 7
  - PLAN.md:45-52 — frontmatter requirements block 7 IDs unchanged — align maintained
  - **Real-state**: grep on REQUIREMENTS.md = 7 confirmed
- **Closes B2**: YES — plan-checker self-check file_references_verified no longer self-reflexive (all 7 IDs exist)

### Fix W1 — mkdir tests/installers + tests/scripts
- **Status**: PASS
- **Evidence**:
  - task_plan.md:164 — T0.5 step 5 explicit mkdir -p tests/installers tests/scripts annotated as W1 plan-check fix with Wave 3 T3.1/T3.2/T3.3 prerequisite rationale
- **Closes W1**: YES — vitest NEW test file write will not fail

### Fix W2 — PATTERNS § 2.5/2.6/2.7 ccHookInstaller → ccHookAdd cleanup
- **Status**: PASS
- **Evidence**:
  - PATTERNS.md:33 — RESOLVED marker: W2 plan-check fix (2026-05-16) § 2.5 + § 2.6 + § 2.7 全 sed-replace ccHookInstaller → ccHookAdd + cc-hook → cc-hook-add per D-WP-4 (b) lock
  - PATTERNS.md:23 — § 1 row 8 now reads installMethods/ccHookAdd.ts (NEW)
  - PATTERNS.md:426 — D-WP-4 § 3 header annotated RESOLVED via (b) ccHookAdd.ts per B-20 (proposal text retained as decision record)
  - PATTERNS.md:431 — line 431 ccHookInstaller.ts retained ONLY in D-WP-4 § 3 option (a) historical proposal text — explicitly annotated as decision record (not import cleanup target)
  - Live grep ccHookInstaller outside D-WP-4 § 3: 0 occurrence in § 2.5/2.6/2.7
- **Closes W2**: YES — Wave 3 executor copy PATTERNS § 2.5/2.6/2.7 will not produce import error; D-WP-4 historical proposal preserved with RESOLVED marker

### Fix W3 — T1.2 doctor.ts ≤215L acceptance + R1 fallback
- **Status**: PASS (single-file path commitment + measurable gate)
- **Evidence**:
  - task_plan.md:302 — T1.2 acceptance wc -l src/cli/doctor.ts ≤ 215 (5% 超 hard limit 容忍 per B-03)
  - task_plan.md:302 — explicit >215L 触发 R1 split fallback
  - PLAN R1 risk + task_plan T1.2 commit to (a) single-file ≤215L (default ship) with (b) R1 fallback path documented
- **Note**: Base W3 advised proactive split (抽 check-result.ts). Applied fix instead commits to single-file ≤215L gate + R1 reactive fallback. Deliberate planner choice (sister Phase 2.3 W4 was reactive too); carry-over as SUGGESTION-C1 below.
- **Closes W3**: PARTIAL — measurable gate + fallback path encoded; original proactive split recommendation not adopted (deliberate decision, not gap)

### Fix W4 — task_plan 顶部 Resolved Blocks skeleton (4 placeholder)
- **Status**: PASS
- **Evidence**:
  - task_plan.md:14 — ## Resolved Blocks (executor fill in-place, sister Phase 2.3 task_plan precedent)
  - task_plan.md:16 — annotation W4 plan-check fix — task_plan 顶部 Resolved 区设 skeleton (4 spike/decision block)
  - 4 placeholders present: Resolved (T0.1) + Resolved (T2.0) + Resolved (T3.4) + Resolved (T6.4) (line 20-26)
  - Each placeholder has PENDING — Wave N TX fill pattern
- **Closes W4**: YES — T0.1/T2.0/T3.4/T6.4 Resolved fill blocks have explicit home + grep-verifiable anchor

### Fix W5 — T3.2 dashboard zero-dep grep gate
- **Status**: PASS
- **Evidence**:
  - task_plan.md:767 — step 3.5 explicit W5 plan-check fix — zero-dep grep gate (Phase 2.2 dashboard.mjs L11 Zero external deps promise 维持)
  - task_plan.md:791 — acceptance grep negates 7 npm dep candidates (ws/socket.io/express/fastify/cors/helmet/body-parser) — count == 0
- **Closes W5**: YES — Wave 3 pre-commit hard-fail if any npm import added

### Fix W6 — T2.2 walker multi-line regex + anchor refs
- **Status**: PASS
- **Evidence**:
  - task_plan.md:459 — comment W6 plan-check fix — multi-line regex aware: decision_source 块可跨多行
  - task_plan.md:460 — explicit 加 B-NN / Phase X.Y / § X / ADR N / R-NN anchor pattern 防 false-pass
  - task_plan.md:461 — strategy step (1) capture .md path refs (existsSync check) (2) ALSO count anchor refs as structural refs
- **Closes W6**: YES — false-pass risk (RESEARCH § 2.2.2 edge case 0/0 = 1.0) explicitly anchored + strategy spelled out

### Fix S1 — T3.2 SSE reconnect re-fetch
- Status: PASS
- Evidence:
  - task_plan.md:768 — step 3.6 S1 plan-check fix SSE reconnect re-fetch (RESEARCH 3.2.2 reconnect-period state-changed loss compensation path)
  - task_plan.md:772 — client-side es.onopen handler triggers loadPage(currentPage) re-fetch
  - task_plan.md:775 — explicit Last-Event-Id reservation note for v0.3.0 enhancement
  - task_plan.md:792 — acceptance grep es.onopen and loadPage current page on scripts/dashboard.mjs count ge 1
- Closes S1: YES — reconnect-period event loss compensation path encoded with measurable acceptance

### Fix S2 — T3.1 cc-hook uninstall 4-step
- Status: PASS
- Evidence:
  - task_plan.md:658-664 — uninstallCcHookAdd skeleton annotated S2 plan-check fix uninstall 4 step detail
  - find hooks block by hook_command match then splice then backup then write then re-verify removed plus provenance state.json updateInstalled removal
  - Sister 6 installer uninstall pattern referenced
- Closes S2: YES — 4-step JSON deep-delete pattern detailed for Wave 3 executor

### Fix S3 — T6.4 v0.2.0 tag fallback decision tree
- Status: PASS
- Evidence:
  - task_plan.md:1135 — step 1 explicit S3 plan-check fix fallback decision tree
  - Decision tree present with 3 paths: a) tag absent proceed create / b) tag exists fallback with sub-paths b.1 historical mis-occupation use v0.2.0-final / b.2 phase-2.4 ship use v0.2.0-extension / b.3 executor judgment
  - task_plan.md:1141 — Resolved (T6.4) block top records fallback decision
  - task_plan.md:1155-1158 — git tag commands annotated for b.1 historical mis-occupation fallback
- Closes S3: YES — 3-branch decision tree spelled out, executor has explicit guidance

### Fix S4 — T2.0 + PLAN W2 phase-2.{2,3}/task_plan path verify
- Status: PASS
- Evidence:
  - task_plan.md:348 — T2.0 step 1.5 S4 plan-check fix multi-plan path verify (T2.0 spike pre-flight) ls phase-2.{2,3}/task_plan.md
  - explicit multi-plan-NN handling (task_plan-01.md / task_plan-02.md) select most complete 1 baseline OR run all average
  - PLAN.md section 7 Wave 2 checkpoint row updated with S4 plan-check fix phase-2.2/2.3 task_plan path verify
- Closes S4: YES — path existence check + multi-plan fallback encoded before T2.0 spike runs

### Fix S5 — F8 reproduction + R12 reconcile (v0.2.0 glob)
- Status: PASS
- Evidence:
  - PLAN.md:334 — R12 mitigation updated git tag --list v0.2.0 glob form + S3 fallback decision tree + F8 reproduction tag glob consistent
  - PLAN.md:352 (F8 reproduction line) — git tag --list adr-N-accepted v0.2.0-alpha.4-doctor v0.2.0 glob form
  - F8 pass criteria — accept v0.2.0 main path OR v0.2.0-final / v0.2.0-extension fallback per S3 + R12 decision tree — tag glob compatible with fallback
- Closes S5: YES — F8 acceptance + R12 risk fully reconciled via glob; fallback paths still count toward acceptance ge 3

---

## Cross-cut Checks

### A7 守恒
- Status: PASS
- Command: git diff 69e0a0f-caret-dotdot-69e0a0f on docs/adr/0001 through 0012 main body | wc -l
- Result: 0 (zero lines diff)
- Interpretation: CC fix touched NO existing ADR (0001-0012) main body. Pure plan-layer fixes (REQUIREMENTS.md + PATTERNS.md + PLAN.md + task_plan.md). A7 invariant preserved.

### SSOT 引用纪律
- Status: PASS
- Live grep: grep -rn 0013 .planning/phase-2.4/ around 16 matches
  - All matches are either:
    - (a) discussion-doc historical annotations explicitly marked 不预占 0013 (KICKOFF / CONTEXT / DISCUSSION-LOG / RESEARCH)
    - (b) placeholder with 预期 0013 但绝不预占 discipline (task_plan.md / PLAN.md)
    - (c) PLAN-CHECK.md base review reference to existing ADR ls (T0.1 max-plus-1 = 0013 但不预占)
  - 0 literal ADR 0013 enforcement that would conflict with sed-replace discipline
- Interpretation: CC fix did NOT introduce any new literal 0013 enforcement. SSOT discipline holds — all placeholder uses preserved, sed-replace step in T0.1 still gates first commit.

---

## Findings

### BLOCKER (must fix before execute-phase)

(none — both base BLOCKERs closed by B1 + B2 fix)

### WARNING (should fix)

(none — all 6 base WARNINGs closed by W1-W6 fix)

### SUGGESTION (advisory, optional for execute-phase)

**SUGGESTION-C1 — W3 fix elected reactive split path over proactive split (deliberate planner decision)**
- Location: task_plan T1.2 acceptance + R1 risk
- Issue (carry-over): Original W3 advised proactive split (abstract status enum into src/cli/lib/check-result.ts ~20L) to keep doctor.ts ~180L main body. Applied fix instead commits to single-file le 215L gate + R1 reactive fallback. Sister Phase 2.3 W4 path was reactive too. If doctor.ts hits 215L wc gate, Wave 1 mid-task pivot to split is more disruptive than pre-planned split.
- Severity: SUGGESTION (not BLOCKER — gate is measurable; reactive split path documented in R1)
- Recommendation: Wave 1 T1.2 executor pre-flight wc -l src/cli/doctor.ts early in implementation; if growth trajectory above 200L mid-implementation, proactive abstract check-result helper before completion to avoid R1 fallback cost.

**SUGGESTION-C2 — D-WP-4 section 3 historical proposal text retained (intentional decision record, not residue)**
- Location: PATTERNS.md L431 (D-WP-4 section 3 option a ccHookInstaller.ts)
- Issue (informational): Line 431 retains ccHookInstaller.ts in D-WP-4 section 3 historical options block. PATTERNS section 3 W2 annotation (L33) and D-WP-4 header (L426) both explicitly mark this as decision record (RESOLVED via b), not import cleanup target. Correct decision-archive discipline (sister Phase 2.3 PATTERNS decision-archive pattern), but executor reading section 3 in isolation might confuse — recommend cross-reference RESOLVED marker.
- Severity: SUGGESTION (informational, not gap)
- Recommendation: Wave 3 T3.1 executor read PATTERNS section 3 D-WP-4 with awareness that section 3 is decision history, not active import target. Section 2.5-2.7 is the cleaned source of truth.

---

## Verdict

**APPROVED — 0 BLOCKER / 0 WARNING / 2 SUGGESTION (2026-05-16)**

**Rationale**:
- 13/13 CC fixes closed source findings: B1 (real-state verify confirms regex precision works) + B2 (REQUIREMENTS.md expanded + grep verify) + W1-W6 (each warning closed with grep-verifiable acceptance) + S1-S5 (each suggestion integrated with executor-actionable steps)
- A7 cross-cut PASS: ADR 0001-0012 main body 0 diff (pure plan-layer fix, no source code touched)
- SSOT cross-cut PASS: 0 literal ADR 0013 introduced; placeholder discipline preserved
- No new BLOCKER/WARNING introduced: Only 2 advisory SUGGESTION carry-overs (C1 W3 deliberate single-file path + C2 D-WP-4 decision-archive convention). Both are informational, not gaps.
- Ready for execute-phase Wave 0: YES — execute-phase can now proceed without revision-loop.

**Sister cadence comparison**:
- Phase 2.3 PLAN-CHECK delta: c4c5a30 base then 1 fix then delta verify then APPROVED (sister precedent)
- Phase 2.4 PLAN-CHECK delta: c4c5a30 base (2B/6W/5S) then 13 fixes in 69e0a0f then delta verify then APPROVED (0B/0W/2S)
- 沿袭模式: CC fix closes ge 1 BLOCKER + multiple warnings; delta verify confirms integration; 2-3 advisory SUGGESTION carry-overs typical

**Repair cost actuals**: PLAN-CHECK base estimated P0+P1 around 70 min. CC fix commit 69e0a0f integrates 13 fixes +153/-46 across 4 files. Plan-layer discipline maintained: zero ADR 0001-0012 touch, zero 0013 literal introduction, zero new file-system path violation, zero new circular dependency.

**Recommended next step**: /gsd-execute-phase 2.4 — Wave 0 first (T0.1 to T0.6, around 1 工作日), then Wave 1+2 parallel, then Wave 3, Wave 4, Wave 5, Wave 6 ship + v0.2.0 4/4 close milestone.

---

*Phase 2.4 PLAN-CHECK-DELTA complete — 13 CC fix delta checks + A7 + SSOT cross-cut + 2 SUGGESTION carry-overs + final verdict APPROVED (0B/0W/2S) ready for execute-phase Wave 0. 沿袭 Phase 2.3 PLAN-CHECK-DELTA around 140L format.*
