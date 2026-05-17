# Phase 4.1 — task_plan.md

> **Authored**: 2026-05-18
> **Author**: gsd-planner (Wave B)
> **Sources**: CONTEXT.md D-01~D-04 + W0 backlog 5 项 (3 absorbed + 2 carry/defer) + KICKOFF § 1-6 + PATTERNS § 1-5 (14 analog targets 100% sister hit; ~85% total reuse) + RESEARCH § 1-22 (HIGH confidence; 18/22 sections HIGH + 4 MEDIUM; docs/benchmarks/ baseline empty + Phase 3.4 SAMPLES.md 73L frozen 7-col + W0.1 ENFORCE flip pre-flight 3 rules currently green + T4 CI ordering spike no latent bug found) + sister phase-3.4/task_plan.md 1132L 23-atomic structure 100% template reuse
> **Style**: 沿袭 phase-3.4/task_plan.md per-task structure (files_modified / read_first / action concrete values / acceptance_criteria grep-verifiable / decision_source)
> **Task count**: 14 atomic tasks across 3 waves — W0 3 (T0.1 W0.3 D2 cadence iter 2 FIRST per path dep + T0.2 W0.1 D3 ENFORCE flip + T0.3 W0.5 conditional D1 SIZE_LIMIT tighten) + W1 6 (T1.1 v0.4.md NEW + T1.2 SAMPLES transformer + T1.3 e2e log script + T1.4 v0.4-upgrade-e2e.log NEW + T1.5 CONTRIBUTING-BENCHMARK.md NEW + T1.6 integrity verify) + W2 5+1+1 = 7 (T2.1 STATE 续编 combined W0.3 archive + T2.2 RETROSPECTIVE 续编 + T2.3 ROADMAP ✅ SHIPPED + T2.4 README + T2.5 PROJECT-SPEC + T2.6 DOGFOOD NEW + T2.7 single baseline tag LOCAL); sister Phase 3.4 24 atomic ~60% scope factor per docs-only narrower phase
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06 / B-26 / source; docs artifact ≤400L explicit exception per PATTERNS R-01 risk)

> ⚠️ **D-decision 守门** (4 decisions LOCKED, executor 防 sneak-in per PATTERNS § 3):
> - **D-01 REUSE Phase 3.4 SAMPLES.md** locked → EXPAND new mining + MIX 30+miss cases 不可 sneak-in (CONTEXT L13-26 evaluated rejected); planner / executor MUST NOT add synthetic miss cases beyond 30 row OR re-mine git log for new samples; docs/benchmarks/v0.4.md reads 30 row directly from SAMPLES.md (single SoT)
> - **D-02 FULL per-task disclosure** locked → AGGREGATE-only + HYBRID 不可 sneak-in (CONTEXT L28-39 evaluated rejected); planner / executor MUST publish raw prompt verbatim NOT sanitized/paraphrased + actual decision_rules.yaml routing path (rule_id + tier + skill) + recovery_path column reserved for miss (current 30/30; schema 保留 for v0.5+)
> - **D-03 TEXT LOG plain `.log`** locked → ASCIINEMA .cast + SCREEN VIDEO mp4/gif 不可 sneak-in (CONTEXT L41-53 evaluated rejected); planner / executor MUST NOT add asciinema npm dep + MUST NOT commit binary mp4/gif/png files >100KB; MUST capture 4-section per log (pre-state + upgrade command + diff + post-state)
> - **D-04 MANUAL on-demand BenchmarkCI** locked → WEEKLY cron + PER-PR full benchmark 不可 sneak-in (CONTEXT L55-67 evaluated rejected); planner / executor MUST NOT add `.github/workflows/benchmark.yml` cron file + MUST NOT add benchmark step to existing `ci.yml`; planner SHOULD add `docs/CONTRIBUTING-BENCHMARK.md` ≤30L manual re-run instructions (planner Discretion #4 separate NEW file LOCK per § 5.1)

> ⚠️ **Karpathy hard limit ≤200L per file 守门** (B-06 + B-26 + sister 5-phase 连续 hold): every code-producing task 含 `wc -l ≤ N` acceptance criterion; **docs artifact exception ≤400L explicit per PATTERNS R-01 risk** (`docs/benchmarks/v0.4.md` 30 task × ~10L FULL disclosure + header/footer = ~350L estimate within sister docs precedent range adr 0014/0015/0016/0017 ≤250L + AGENT-DEFINITION ~400L); `docs/benchmarks/v0.4-upgrade-e2e.log` ≤150L hard; `docs/CONTRIBUTING-BENCHMARK.md` ≤30L hard per CONTEXT D-04 explicit lock; `.planning/phase-4.1/DOGFOOD-T2.X.md` ≤60L hard sister Phase 3.4 DOGFOOD 55L precedent.

> ⚠️ **Biome lint preempt before commit MANDATORY** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 — 5-recurrence terminus续延): 任何 TS/JS/MJS commit 前必跑 `pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费. Phase 4.1 touch surface = W0.1 + W0.5 `scripts/check-state-archive-stale.mjs` `.mjs` 1-line flip (biome preempt mandatory) + W1 + W2 all `.md` / `.log` (biome NOT needed for non-TS/JS).

---

## Resolved Blocks (executor fill in-place, sister Phase 3.4 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / split decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.1 W0.3 D2 cadence iter 2 trim outcome, PENDING)**: STATE.md 148L → ? L (expected ~130L post-trim per § 7.2 projection; trim targets ~15-20L: 已完成 phase ship 历史 L40-43 Phase 3.3 + Phase 3.4 entries verbatim relocate to RETROSPECTIVE + 关键决策记录 L107-117 5 Phase 3.4 rows + Phase 3.3 D-04 + schemaVersion 13-surface 2 rows verbatim relocate); `node scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1 — pre-W0.1 flip baseline still warn-only; ENFORCE=true verify happens at T0.2 post-flip); reviewer diff RETROSPECTIVE additions = STATE deletions 1:1 verbatim (§ 8.5 sneak block enforcement); HTML-comment archive marker pointer inserted per sister L27 format.

> **Resolved (T0.2 W0.1 D3 ENFORCE flip outcome, PENDING)**: scripts/check-state-archive-stale.mjs 54L unchanged (1-line value flip zero size delta); pre-flight dry-run `sed 's/const ENFORCE = false/const ENFORCE = true/' scripts/check-state-archive-stale.mjs | node /dev/stdin` exit 0 (sister Phase 2.1 → 2.2 1-phase cadence delivered Phase 3.4 ship → Phase 4.1 W0.1); post-flip `node scripts/check-state-archive-stale.mjs` exit 0 (PASS 3 rules — STATE ≤200L post-W0.3-trim + 0 关键决议 ship 总结 sections + 0 W-N errata literals); DEFERRED #AF RESOLVED 2026-05-18.

> **Resolved (T0.3 W0.5 CONDITIONAL D1 SIZE_LIMIT tighten outcome, PENDING)**: Decision tree per § 7.1 — IF post-W0.3 STATE ≤140L → flip L12 `SIZE_LIMIT = 200` → `SIZE_LIMIT = 150` (1-line surgical same file as T0.2; 10L headroom maintained for Phase 4.1 W2 续编 + future churn); OTHERWISE DEFER + register DEFERRED #AG carry-forward Phase 4.2 W0 (LOW priority defensive); `node scripts/check-state-archive-stale.mjs` exit 0 with SIZE_LIMIT=150 IF flip path active.

> **Resolved (T1.1 docs/benchmarks/v0.4.md NEW outcome, PENDING)**: `wc -l docs/benchmarks/v0.4.md` ≤ 400 (estimate ~350L; planner Discretion #1 hard cap LOCK); 30 task sections × 6-field schema per D-02 FULL; cross-link SAMPLES.md ≥ 2 occurrences (D-01 sneak block); biome NOT needed (`.md` extension); IF post-write breach 400 → apply § 10.1 mitigation hierarchy (drop description col save ~30L FIRST; compress 5-element labels save ~60L SECOND; aggregate-only REJECTED per D-02 sneak block).

> **Resolved (T1.3 + T1.4 e2e upgrade actual run outcome, PENDING)**: ctx7 actual v0.4.x latest version availability per § 18 U1 ASSUMED LOW risk fallback to v0.3.x patch bump (e2e log format unchanged); gstack git_ref newer SHA availability per § 18 U2 ASSUMED LOW risk fallback to any 2 SHAs in gstack history; `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` ≤ 150 (4 section × ~20-40L × 2 manifests); `file docs/benchmarks/v0.4-upgrade-e2e.log` returns 'ASCII text'; `wc -c docs/benchmarks/v0.4-upgrade-e2e.log` < 102400 (D-03 sneak block).

---

## Deferred Items (Phase 4.1 carry-forward, register at ship via deferred-items.md)

> **DEFERRED #AH** (Phase 3.4 own carry, sister inheritance — STILL Phase 4.0+ unchanged): W0.4 path traversal regex hardening → Phase 4.0 W0 (conditional on real attack surface arrival; currently sole consumer = project maintainer per spike outcome 2026-05-17)
> **DEFERRED #BA** (Phase 4.1 own carry — anticipated W0.5 conditional path): IF W0.5 CONDITIONAL DEFER path active (post-W0.3 STATE >140L) → D1 SIZE_LIMIT round 2 tighten 200→150 carry-forward Phase 4.2 W0 LOW priority defensive
> **DEFERRED #BB** (Phase 4.1 own carry — sister M+T tier carry to Phase 4.2 W0): sister review T-tier T3 1 phase/day cadence assessment — Phase 4.2 co-maintainer 招募 EXTERNAL DEPENDENCY phase (T3 risk surface真正 fires Phase 4.2; v0.4.0 节奏 evaluate explicit 调整期望)
> **DEFERRED #BC** (Phase 4.1 own carry — v0.5+ benchmark expand evaluation): IF Phase 4.1 dogfood reveals miss case NOT covered by current 30 SAMPLES.md → re-evaluate D-01 REJECT (EXPAND new mining); currently 30/30 100% routing PASS no signal
> **DEFERRED #AF** ✅ RESOLVED Phase 4.1 W0 (T0.2 W0.1 — D3 gate ENFORCE flip warn-only round 1 → ENFORCE round 2)
> **DEFERRED #AG** ✅ partially RESOLVED Phase 4.1 W0 (T0.3 W0.5 CONDITIONAL — IF STATE ≤140L flip / OTHERWISE #BA carry-forward)
> **DEFERRED #BD** (Phase 4.1 own carry, iter 2 lesson): Regex-fix 2-pass validation pattern — phase ship sister review absorb cycles should require both literal regex scan AND semantic synonym scan (L1-N / N-line / arithmetic derivations) to prevent iter-N residual surfacing. Phase 4.2+ ship-sister cadence reuse.

---

## Wave 0 — Backlog 3 项 absorb (3 atomic tasks; STRICT path dep W0.3 → W0.1 → W0.5 per PATTERNS § 5 critical path)

### T0.1 — W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md (FIRST per path dep — reduces STATE.md size to create ENFORCE=true headroom for T0.2 pre-flight; sister Phase 3.4 W2 T2.2 step 3 verbatim pattern reuse — 2nd-iter institutionalize verify per M2 backlog discharge)

- **files_modified**:
  - `.planning/STATE.md` (MODIFY ~-18L delta: trim Phase 3.3 + Phase 3.4 entries from 已完成 phase ship 历史 L40-43 + 关键决策记录 L107-117 Phase 3.4 D-01/D-02/D-03/D-04 + W0.1 STRATEGIC + Phase 3.3 D-04 + schemaVersion 13-surface rows verbatim relocate; preserve 1-line pointers each; insert HTML-comment archive marker per sister L27 format; expected post-trim ~130L)
  - `.planning/RETROSPECTIVE.md` (APPEND ~+20-25L new section `## § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2, 2026-05-18)` containing verbatim relocated Phase 3.3 + Phase 3.4 narrative; D2 ship-time T6.N cadence 2nd-iter per institutionalize verify sister Phase 3.4 W2 T2.2 step 3 1st-implementation precedent)
- **read_first**:
  - `.planning/STATE.md` entire file (by Read — verify 148L baseline + identify trim section line ranges: L22-26 当前位置 long inline + L40-43 已完成 phase ship 历史 Phase 3.3+3.4 entries + L107-117 关键决策记录 5 Phase 3.4 rows + Phase 3.3 D-04 + schemaVersion 13-surface 2 rows; total ~18-20L trim scope)
  - `.planning/RETROSPECTIVE.md` tail 100 lines (by Read — verify existing `## § ARCHIVED FROM STATE — Phase 3.1+3.2` section format from Phase 3.4 W2 T2.2 first-implementation 2026-05-17; new section follows same heading pattern + verbatim quoted content blockquote convention)
  - `.planning/phase-4.1/RESEARCH.md` § 8 (W0.3 D2 cadence iter 2 mechanical pattern + sister Phase 3.4 W2 T2.2 verbatim — offset 465 limit 60)
  - `.planning/phase-4.1/PATTERNS.md` § 1 row 3 + § 2.2 (W0.3 mapping reuse 95% + concrete code excerpt verbatim Phase 3.4 W2 T2.2 step 3 1st-implementation → Phase 4.1 W0.3 2nd-implementation target swap)
- **action**:
  1. Read `.planning/STATE.md` to confirm baseline 148L (`wc -l .planning/STATE.md` expect 148) + identify trim sections by section header grep:
     - L40-43: 已完成 phase ship 历史 — Phase 3.4 SHIPPED ✅ + Phase 3.3 SHIPPED ✅ entries (currently 2 long inline rows ~20 chars each; replace with 1-line pointer each: `- **Phase 3.4 shipped** ✅ (2026-05-17, archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4)`)
     - L107-117: 关键决策记录 — verbatim relocate 5 Phase 3.4 rows (D-01/D-02/D-03/D-04 + W0.1 STRATEGIC) + 2 Phase 3.3 rows (D-04 (b) COLLAPSE + schemaVersion 13-surface) = 7 rows total
     - L22-26: 当前位置 long inline narratives condense to 1-line pointers (preserve `**Phase 3.4 SHIPPED**` literal STATE_POSITION_RE anchor for D-04 COLLAPSE freshness gate)
  2. **W0.3 D2 cadence iter 2 ship-time T6.N cadence 2nd-IMPLEMENTATION (M2 backlog discharge institutionalize verify per sister D2 standing process; verifies pattern stable not first-time effort)**:
     - APPEND to `.planning/RETROSPECTIVE.md` new section header (heading-level 2 sister L8.3 format):
       ```markdown
       ## § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2, 2026-05-18)

       ### Phase 3.3 SHIPPED narrative (archived from STATE.md `当前位置` + 关键决策 2026-05-18)
       [verbatim content from STATE.md L22-26 inline narrative + L107-117 Phase 3.3 D-04 row + schemaVersion 13-surface row]

       ### Phase 3.4 SHIPPED narrative (archived from STATE.md `当前位置` + 关键决策 + 已完成 phase ship 历史 2026-05-18)
       [verbatim content from STATE.md L22-26 inline narrative + L40 已完成 ship history row + L107-117 5 Phase 3.4 rows]
       ```
     - LOC delta: +20-25L append to RETROSPECTIVE.md (≈ trimmed lines from STATE.md verbatim relocation; § 8 estimate)
     - Insert HTML-comment archive marker pointer at trimmed STATE.md sites per sister L27 verified format:
       ```markdown
       <!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 per standing process — M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) -->
       ```
  3. Verify post-trim STATE.md line count + pre-flight pre-W0.1 baseline `node scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1 baseline still warn-only — ENFORCE=true verify happens at T0.2 post-flip; this T0.1 trim baseline is the W0.1 pre-flight gate)
  4. Run biome preempt: `pnpm exec biome check --write` (only .ts/.js/.mjs touched if any; STATE.md + RETROSPECTIVE.md are .md — biome NOT scope, but `pnpm exec biome check --write` harmless idempotent — run anyway per project memory 5-recurrence terminus续延 discipline mandatory before commit)
  5. **Recommended commit msg** (Karpathy why-not-what, sister Phase 3.4 W2 T2.2 step 3 commit msg pattern延袭):
     ```
     refactor(phase-4.1-w0): T0.1 — W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md (sister Phase 3.4 W2 T2.2 step 3 1st-implementation → 2nd-iter institutionalize verify M2 backlog discharge)

     7-phase 连续 "deferred-items → next phase W0 一次根治" cadence 7th phase 沿袭
     (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1). D2 ship-time T6.N standing
     process fires 2nd-iter beyond Phase 3.4 W2 T2.2 first-implementation (sister
     M2 backlog discharge verify pattern stable not first-time effort).

     Phase 3.3 + Phase 3.4 narrative verbatim relocated STATE.md → RETROSPECTIVE.md
     § ARCHIVED FROM STATE — Phase 3.3+3.4 section (~+20-25L append; sister L8.3
     format pattern). STATE.md L40-43 已完成 ship history + L107-117 关键决策 7 rows
     + L22-26 当前位置 long inline condensed to 1-line pointers (~-15-20L delta;
     expected post-trim STATE.md ≈ 130L from 148L baseline).

     HTML-comment archive marker pointer inserted per sister L27 format (reviewer
     grep verifies pointer present + RETROSPECTIVE additions = STATE deletions 1:1
     verbatim per § 8.5 sneak block enforcement). FIRST per path dep — creates
     ENFORCE=true headroom for T0.2 W0.1 D3 gate flip pre-flight.
     ```
  6. **Update Resolved (T0.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/STATE.md` post-trim + `wc -l .planning/RETROSPECTIVE.md` post-append + `node scripts/check-state-archive-stale.mjs` exit code baseline)
- **acceptance_criteria**:
  - **Target** `wc -l .planning/STATE.md` ≤ 140 (W0.3 trim outcome target — keeps W0.5 FLIP path active per T0.3 § 7.1 decision tree; expected ~130L)
  - **Ceiling** `wc -l .planning/STATE.md` ≤ 150 (acceptable upper bound; 141-150L triggers W0.5 DEFER path per T0.3 § 7.1 — STATE.md remains ≤200L bound, NOT forced ≤150L until W0.5 flip path active)
  - **Clarification**: T0.3 decides FLIP vs DEFER based on actual W0.3 trim outcome; T0.1 alone does NOT mandate ≤150L — T0.3 conditional decision tree is the authority
  - `grep -q "ARCHIVED FROM STATE — Phase 3.3" .planning/RETROSPECTIVE.md` exit 0 (W0.3 D2 cadence iter 2 archive section created)
  - `grep -q "ARCHIVED FROM STATE — Phase 3.4" .planning/RETROSPECTIVE.md` exit 0 (Phase 3.4 narrative archived)
  - `grep -q "Phase 4.1 W0.3 D2 cadence iter 2" .planning/RETROSPECTIVE.md` exit 0 (section header attribution per § 8.3)
  - `grep -q "Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE" .planning/STATE.md` exit 0 (HTML-comment pointer inserted per sister L27 format)
  - `grep -q "\\*\\*Phase 3\\.4 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (preserve 当前位置 SSOT STATE_POSITION_RE anchor literal for D-04 COLLAPSE freshness gate)
  - `node scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1 baseline pre-T0.2 flip; ENFORCE=true verify happens T0.2)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W0.3 trim — STATE_POSITION_RE OR-fallback still matches preserved 当前位置 SSOT)
- **decision_source**: CONTEXT § W0 backlog absorb plan W0.3 (HIGH priority sister M2 D2 cadence iter 2 verify) + RESEARCH § 8 (W0.3 mechanical pattern + sister Phase 3.4 W2 T2.2 verbatim) + PATTERNS § 1 row 3 + § 2.2 (95% reuse mapping + concrete code excerpt verbatim) + CONTEXT § Discretion #3 LOCKED mechanical trim verbatim sister pattern reuse (NOT additional cadence formalization checklist doc per Karpathy YAGNI)

---

### T0.2 — W0.1 D3 gate ENFORCE flip (DEFERRED #AF RESOLVE; sister Phase 2.1 → 2.2 1-phase cadence延袭; AFTER T0.1 per path dep — pre-flight dry-run with ENFORCE=true sim MANDATORY before commit)

- **files_modified**:
  - `scripts/check-state-archive-stale.mjs` (MODIFY 1-line surgical L10: `const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF` → `const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)`; file size 54L → 54L unchanged ≤60L Karpathy hard)
- **read_first**:
  - `scripts/check-state-archive-stale.mjs` entire file (by Read — verify 54L baseline + L10 `const ENFORCE = false` current state)
  - `scripts/check-transparency-verdicts.mjs` L10-15 (by Read — verify sister L12 `const ENFORCE = true` Phase 2.2 W0 T0.6 cadence verbatim verified — 1-line value flip same pattern as Phase 4.1 W0.1)
  - `.planning/STATE.md` (by Read — verify post-T0.1 trim line count + 3 rules baseline currently green: lines ≤200L (post-T0.1 expected ~130L) + 0 `^##.*关键决议.*ship\\s*总结` sections + 0 W-N errata literals)
  - `.planning/phase-4.1/RESEARCH.md` § 6 (W0.1 D3 ENFORCE flip recipe + sister Phase 2.1 cadence + pre-flight 3 rules verify — offset 353 limit 55)
  - `.planning/phase-4.1/PATTERNS.md` § 1 row 1 + § 2.1 (W0.1 mapping reuse 98% + concrete code excerpt verbatim 1-line literal swap)
- **action**:
  1. Read `scripts/check-state-archive-stale.mjs` L10 to verify baseline:
     ```javascript
     const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF
     ```
  2. **MANDATORY pre-flight dry-run with ENFORCE=true sim** (path dep STRICT per PATTERNS § 5 critical path; NOT bypass-able):
     ```bash
     # Pre-flight dry-run: temp local sed swap → run gate → verify exit 0 → revert if fail
     sed 's/const ENFORCE = false/const ENFORCE = true/' scripts/check-state-archive-stale.mjs | node /dev/stdin
     # Expected output: '[state-archive-stale] STATE.md within archive cadence limits.' exit 0
     ```
     - **IF pre-flight exit 1**: revert + escalate to planner (T0.1 trim sufficiency insufficient OR additional violations surfaced)
     - **IF pre-flight exit 0**: proceed to step 3 (flip safe — all 3 rules currently green per § 6.2)
  3. Edit `scripts/check-state-archive-stale.mjs` L10 1-line surgical (sister Phase 2.1 → 2.2 1-phase cadence literal swap):
     ```javascript
     // BEFORE (current):
     const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF

     // AFTER (Phase 4.1 W0.1 flip):
     const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)
     ```
     Net delta: 0L (1-line value flip; file remains 54L)
  4. Run biome preempt: `pnpm exec biome check --write scripts/check-state-archive-stale.mjs` (`.mjs` extension — biome scope mandatory per project memory `feedback_biome-preempt.md` 5-recurrence terminus续延)
  5. Post-flip verify: `node scripts/check-state-archive-stale.mjs` exit 0 (PASS 3 rules with ENFORCE=true post-T0.1 trim baseline — STATE ≤200L + 0 关键决议 sections + 0 W-N errata literals)
  6. **Recommended commit msg**:
     ```
     fix(phase-4.1-w0): T0.2 — W0.1 D3 gate ENFORCE flip warn-only round 1 → ENFORCE round 2 (DEFERRED #AF RESOLVED; sister Phase 2.1 → 2.2 1-phase cadence延袭)

     1-line surgical scripts/check-state-archive-stale.mjs L10 `ENFORCE = false`
     → `ENFORCE = true` (file 54L unchanged zero size delta). Sister cadence
     verified: Phase 2.1 W3 ship `ENFORCE = false` → Phase 2.2 W0 T0.6 flip
     `ENFORCE = true` 1-phase → Phase 3.4 W0.1 ship `ENFORCE = false` (round 1)
     → Phase 4.1 W0.1 flip `ENFORCE = true` (round 2) — identical 1-phase cadence
     verified verbatim Phase 2.2 W0 commit history.

     MANDATORY pre-flight dry-run with ENFORCE=true sim exit 0 verified (all 3
     rules currently green per § 6.2: STATE post-W0.3-trim ~130L ≤ 200L + 0
     关键决议 ship 总结 sections + 0 W-N errata literals). Path dep STRICT —
     T0.1 W0.3 D2 cadence iter 2 trim shipped FIRST as W0.1 prerequisite (NOT
     bypass-able per PATTERNS § 5 critical path).
     ```
  7. **Update Resolved (T0.2)** block at task_plan.md top with outcome (PENDING → 实占 values: pre-flight dry-run exit code + post-flip `node scripts/check-state-archive-stale.mjs` exit code + `wc -l scripts/check-state-archive-stale.mjs` confirm 54L unchanged)
- **acceptance_criteria**:
  - `grep -q "const ENFORCE = true" scripts/check-state-archive-stale.mjs` exit 0 (W0.1 flip)
  - `! grep -q "const ENFORCE = false" scripts/check-state-archive-stale.mjs` exit 0 (no remnant false declaration)
  - `grep -q "DEFERRED #AF RESOLVED" scripts/check-state-archive-stale.mjs` exit 0 (attribution comment for audit trail)
  - `wc -l scripts/check-state-archive-stale.mjs` ≤ 60 (Karpathy spec unchanged; 54L baseline)
  - `node scripts/check-state-archive-stale.mjs` exit 0 (PASS 3 rules with ENFORCE=true post-T0.1 trim)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W0.1 flip)
- **decision_source**: CONTEXT § W0 backlog absorb plan W0.2 (HIGH priority sister Phase 2.1 transparency gate cadence延袭) + RESEARCH § 6 (W0.1 D3 ENFORCE flip recipe + sister Phase 2.2 W0 T0.6 cadence verbatim) + PATTERNS § 1 row 1 + § 2.1 (98% reuse mapping + concrete code excerpt verbatim 1-line literal swap) + CONTEXT § Sneak-block守门 D3 (MUST run pre-flight dry-run with ENFORCE=true sim MANDATORY before commit per path dep STRICT)

---

### T0.3 — W0.5 CONDITIONAL D1 SIZE_LIMIT 200→150 round 2 tighten (DEFERRED #AG conditional resolve; AFTER T0.1 + T0.2 per path dep — conditional on STATE post-W0.3 ≤140L per § 7.1 decision tree)

- **files_modified**:
  - `scripts/check-state-archive-stale.mjs` (CONDITIONAL MODIFY 1-line surgical L12 same file as T0.2 IF post-W0.3 STATE ≤140L: `const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG` → `const SIZE_LIMIT = 150 // Phase 4.1 W0.5 round 2 tighten — DEFERRED #AG resolve (W0.3 trim outcome STATE ≤140L pre-verified)`; file size 54L → 54L unchanged ≤60L Karpathy hard) — OR — OTHERWISE DEFER + register DEFERRED #BA carry-forward Phase 4.2 W0
- **read_first**:
  - `.planning/STATE.md` (by Read — verify post-T0.1 W0.3 trim actual line count for conditional decision tree per § 7.1)
  - `scripts/check-state-archive-stale.mjs` L12 (by Read — verify current `const SIZE_LIMIT = 200` baseline pre-conditional-flip)
  - `.planning/phase-4.1/RESEARCH.md` § 7 (W0.2 conditional D1 SIZE_LIMIT flip projection + decision tree + estimated post-trim STATE size — offset 410 limit 55)
  - `.planning/phase-4.1/PATTERNS.md` § 1 row 2 + § 5 path dep (W0.5 mapping reuse 85% + conditional path explicit decision tree)
- **action**:
  1. Read `.planning/STATE.md` to verify post-T0.1 W0.3 trim actual line count (expected ~130L per § 7.2 projection from 148L baseline minus ~18L trim scope)
  2. **CONDITIONAL DECISION TREE** per § 7.1 verbatim:
     ```
     post-W0.3 STATE.md wc -l
     ├── ≤ 140L → ✅ FLIP PATH (T0.3 active; 10L headroom maintained for Phase 4.1 W2 续编 + future churn)
     ├── 141-150L → ❌ DEFER PATH (T0.3 skip + register DEFERRED #BA carry-forward Phase 4.2 W0 LOW priority defensive)
     └── > 150L → 🚨 BLOCKED + INVESTIGATE (W0.3 trim sufficiency inadequate; re-evaluate D2 cadence pattern adequacy; escalate to planner)
     ```
  3. **IF FLIP PATH** (post-W0.3 STATE ≤140L):
     - Read `scripts/check-state-archive-stale.mjs` L12 to verify baseline:
       ```javascript
       const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG
       ```
     - Edit L12 1-line surgical:
       ```javascript
       // BEFORE:
       const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG

       // AFTER (Phase 4.1 W0.5 flip):
       const SIZE_LIMIT = 150 // Phase 4.1 W0.5 round 2 tighten — DEFERRED #AG resolve (W0.3 trim outcome STATE ≤140L pre-verified)
       ```
     - Net delta: 0L (1-line value flip; file remains 54L)
     - Run biome preempt: `pnpm exec biome check --write scripts/check-state-archive-stale.mjs`
     - Post-flip verify: `node scripts/check-state-archive-stale.mjs` exit 0 with SIZE_LIMIT=150 (PASS Rule 1 with post-W0.3 STATE ≤140L pre-verified)
  4. **IF DEFER PATH** (post-W0.3 STATE 141-150L):
     - Skip L12 edit (leave `SIZE_LIMIT = 200` unchanged)
     - Append entry to Deferred Items section at task_plan.md top (in-place edit):
       ```markdown
       > **DEFERRED #BA** (Phase 4.1 own carry — W0.5 conditional DEFER path active): D1 SIZE_LIMIT round 2 tighten 200→150 carry-forward Phase 4.2 W0 LOW priority defensive (post-W0.3 STATE ~? L exceeded 140L threshold; insufficient headroom for round 2 tighten)
       ```
     - Document in Resolved (T0.3) block: actual post-W0.3 STATE line count + decision tree branch chosen + defer rationale
  5. **IF BLOCKED PATH** (post-W0.3 STATE >150L):
     - Escalate to planner + investigate W0.3 trim sufficiency
     - Do NOT proceed to W1 until resolved
  6. **Recommended commit msg** (FLIP PATH case):
     ```
     fix(phase-4.1-w0): T0.3 — W0.5 CONDITIONAL D1 SIZE_LIMIT 200→150 round 2 tighten (DEFERRED #AG RESOLVED FLIP PATH; W0.3 trim outcome STATE ≤140L pre-verified)

     1-line surgical scripts/check-state-archive-stale.mjs L12 `SIZE_LIMIT = 200`
     → `SIZE_LIMIT = 150` (file 54L unchanged zero size delta; same file as T0.2
     W0.1 ENFORCE flip). Conditional decision tree per § 7.1:
     post-W0.3 STATE ~? L ≤ 140L → FLIP PATH active (10L headroom maintained
     for Phase 4.1 W2 续编 + future churn).

     Sister Phase 3.4 W0.1 round 1 ≤200L precedent established headroom; round
     2 ≤150L only if ≥10L headroom maintained post-archive (defensive against
     over-tighten brittle per R-02 mitigation). DEFERRED #AG RESOLVED 2026-05-18.
     ```

     **OR DEFER PATH commit msg** (if STATE 141-150L):
     ```
     defer(phase-4.1-w0): T0.3 — W0.5 CONDITIONAL D1 SIZE_LIMIT DEFER PATH (post-W0.3 STATE ~? L insufficient headroom; DEFERRED #BA carry-forward Phase 4.2 W0 LOW priority)

     Conditional decision tree per § 7.1 DEFER PATH active: post-W0.3 STATE ~?
     L exceeded 140L threshold (insufficient ≥10L headroom for round 2 tighten;
     defensive against over-tighten brittle per R-02 mitigation). scripts/check
     -state-archive-stale.mjs L12 `SIZE_LIMIT = 200` UNCHANGED. DEFERRED #BA
     registered in task_plan.md Deferred Items section + planner notes Phase 4.2
     W0 carry-forward LOW priority.
     ```
  7. **Update Resolved (T0.3)** block at task_plan.md top with outcome (PENDING → 实占 values: post-W0.3 STATE actual line count + decision tree branch chosen + flip/defer commit SHA)
- **acceptance_criteria** (FLIP PATH):
  - `grep -q "const SIZE_LIMIT = 150" scripts/check-state-archive-stale.mjs` exit 0 (W0.5 flip)
  - `! grep -q "const SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` exit 0 (no remnant 200 declaration)
  - `grep -q "DEFERRED #AG resolve" scripts/check-state-archive-stale.mjs` exit 0 (attribution comment)
  - `wc -l scripts/check-state-archive-stale.mjs` ≤ 60 (Karpathy spec unchanged; 54L)
  - `wc -l .planning/STATE.md` ≤ 150 (post-W0.3 trim sufficient for W0.5 flip; W2 续编 +~5-10L delta keeps ≤150 hard)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with SIZE_LIMIT=150 (PASS Rule 1)
- **acceptance_criteria** (DEFER PATH):
  - `grep -q "const SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` exit 0 (unchanged)
  - `grep -q "DEFERRED #BA" .planning/phase-4.1/task_plan.md` exit 0 (carry-forward registered)
  - `wc -l .planning/STATE.md` ≤ 200 (W0.5 defer baseline maintained)
  - `node scripts/check-state-archive-stale.mjs` exit 0 (PASS Rule 1 with SIZE_LIMIT=200 round 1 baseline)
- **decision_source**: CONTEXT § W0 backlog absorb plan W0.5 (MED priority conditional on W0.3 outcome) + RESEARCH § 7 (W0.2 conditional D1 SIZE_LIMIT flip projection + decision tree) + PATTERNS § 1 row 2 + § 5 path dep (W0.5 mapping reuse 85% + conditional path explicit) + CONTEXT § Sneak-block守门 W0.5 (MUST verify STATE ≤140L post-W0.3 trim BEFORE flip + MUST defer flip if post-trim ≥141L defensive + MUST NOT skip W0.3 trim to game W0.2 condition)

---

## Wave 0 done

All 3 atomic tasks complete. W0 backlog 3 项 absorbed (T0.1 W0.3 D2 cadence iter 2 + T0.2 W0.1 D3 ENFORCE flip + T0.3 W0.5 conditional D1 SIZE_LIMIT) per STRICT path dep W0.3 → W0.1 → W0.5. DEFERRED #AF RESOLVED; DEFERRED #AG partially RESOLVED (FLIP path) OR carry #BA Phase 4.2 W0 (DEFER path).

> **Critical path verify**: T0.1 W0.3 trim STATE ≤150L (W0.5 flip safety verify); T0.2 W0.1 ENFORCE=true post-flip `node scripts/check-state-archive-stale.mjs` exit 0; T0.3 conditional decision tree per § 7.1 (FLIP or DEFER branch determined by actual post-W0.3 STATE line count).

> **W1 main scope prereq from Wave 0 outputs**:
> - W0.1 ENFORCE=true post-T0.2 (Wave 1 STATE 续编 W2 T2.1 MUST pass ENFORCE=true gate post-续编)
> - W0.3 D2 cadence iter 2 archive STATE→RETROSPECTIVE (sister M2 backlog discharge institutionalize verify — W2 T2.2 RETROSPECTIVE.md 续编 builds on this archive section)
> - W0.5 conditional outcome (FLIP or DEFER determines W2 T2.1 STATE 续编 final hard cap ≤150L or ≤200L)

---

## Wave 1 — Main scope benchmark publish (6 atomic — Phase 4.1 anchor R8.1)

### T1.1 — docs/benchmarks/v0.4.md NEW ~300-400L D-02 FULL per-task disclosure (planner Discretion #1 hard cap ≤400L LOCK; sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE + DOGFOOD verdict header pattern)

- **files_modified**:
  - `docs/benchmarks/v0.4.md` (NEW ~300-400L D-02 FULL per-task disclosure: header ~50L + § 1 Selection Rationale REUSE SAMPLES.md verbatim ~25L + § 2 Per-Task FULL Disclosure 30 sections × ~10L = ~300L + § 3 Aggregate footer ~15L + § 4 反"美化"声明 ~10L + § 5 Frozen Marker ~10L + § 6 e2e log cross-link ~10L; Karpathy hard cap ≤400L LOCK per planner Discretion #1)
- **read_first**:
  - `.planning/phase-3.4/SAMPLES.md` entire (by Read — D-01 LOCKED single SoT 30-row REAL HISTORICAL 7-col schema verbatim source; verify 73L baseline + 30 row § 2 truth table format)
  - `routing/decision_rules.yaml` L1-50 (by Read — verify v2 12-rule + 5 engineering sub-rule + 23 招式 routing schema for per-row routing_decision rule_id+tier+skill derive source per D-02 sneak block "actual decision_rules.yaml routing path")
  - `tests/routing/phase-3.4-routing-hit-rate.test.ts` L160-181 (by Read — verify Phase 3.4 W1 T1.6 30/30 100% PASS result + per-tier breakdown Sonnet 10/10 / Haiku 10/10 / Opus 10/10 for § 3 Aggregate footer source verbatim)
  - `.planning/phase-3.4/DOGFOOD-T2.X.md` (by Read — sister verdict header format + Axis B routing harness 30/30 per-tier breakdown source verbatim)
  - `docs/benchmarks/` directory listing (by Bash `ls docs/benchmarks/` — verify baseline empty `.gitkeep` only; Phase 4.1 W1 inaugurates NEW surface)
  - `.planning/phase-4.1/RESEARCH.md` § 2 + § 3 + § 10 (D-01 mapping 7→8 col forward-compat + D-02 FULL 5-element template + size budget ≤400L hard cap mitigation hierarchy — offset 132 limit 50 + offset 168 limit 65 + offset 602 limit 45)
  - `.planning/phase-4.1/PATTERNS.md` § 1 row 4 + § 2.3 (W1 T1.1 mapping reuse 70% + concrete code excerpt verbatim REUSE FRAME)
- **action**:
  1. Verify `docs/benchmarks/` baseline state: `ls docs/benchmarks/` returns `.gitkeep` only (Phase 4.1 W1 inaugurates NEW surface)
  2. Create NEW file `docs/benchmarks/v0.4.md` ~350L estimate per RESEARCH § 10.1 breakdown + sister Phase 3.4 SAMPLES.md § 1+2+3 frame reuse + D-02 FULL per-task expansion:
     - **Header section (~50L)**:
       - YAML frontmatter (~10L): version 0.4.0 + verification date 2026-05-18 + source link `.planning/phase-3.4/SAMPLES.md` + author + license Apache-2.0
       - TL;DR header (~20L): published 2026-05-18 / reproducibility per `docs/CONTRIBUTING-BENCHMARK.md` / anchor R8.1 dogfooding benchmark 公开 + 4 D-decisions LOCKED status declaration (D-01 REUSE Phase 3.4 SAMPLES.md / D-02 FULL per-task / D-03 TEXT LOG / D-04 MANUAL)
       - § 1 Benchmark scope + acceptance bar (~25L): R8.1 verbatim + sister Phase 3.4 routing harness 30/30 PASS evidence link
     - **§ 2 Per-Task FULL Disclosure (~300L = 30 sections × ~10L)**:
       Per task template (sister § 3.1 5-element format verbatim per CONTEXT D-02 L30):
       ```markdown
       ### T01 (haiku / chore) — single-file dir scaffold

       **Raw prompt** (verbatim from `.planning/phase-3.4/SAMPLES.md` row 01 — D-02 sneak block "NOT sanitized/paraphrased"):
       > tests/manifest + tests/manifest/schema dirs setup (sister Phase 3.2 W0 T0.4 pattern)

       **Routing decision** (from `routing/decision_rules.yaml` v2 12-rule + 5 engineering sub-rule per D-02 sneak block "actual decision_rules.yaml routing path"):
       - Rule matched: **none** (router=B fallback per SAMPLES.md L34 expected_decision `{router: B, reason: 'single-file dir scaffold chore'}`)
       - Tier: **Haiku** (single-file mechanical edit)
       - Skill: **karpathy-baseline** (default trivial chore handler)

       **Actual command executed** (per git show `43ce181 --stat`):
       ```bash
       git commit -m "chore(phase-3.4-w0): T0.4 — tests/manifest + tests/manifest/schema dirs setup"
       ```

       **Manual review verdict**: ✅ **hit** (router=B actual matches router=B expected; per `tests/routing/phase-3.4-routing-hit-rate.test.ts` 30/30 PASS)

       **Miss recovery path**: N/A (hit — schema reserved for v0.5+ miss case per D-02 sneak block "NOT suppress miss cases")

       **Source commit**: `43ce181`

       ---
       ```
       Repeat 30 task sections T01-T30 (10 Haiku T01-T10 + 10 Sonnet T11-T20 + 10 Opus T21-T30 per SAMPLES.md distribution)
     - **§ 3 Aggregate Summary (~15L)** HYBRID inline footer per D-02 rationale (NO separate aggregate header — HYBRID +1 section overhead 微 over-engineering):
       ```markdown
       ## § 3 Aggregate Summary

       - **Total**: 30/30 = 100% (远超 ≥85% bar 15% headroom per ROADMAP R7 L149)
       - **Per-tier breakdown** (verbatim from `tests/routing/phase-3.4-routing-hit-rate.test.ts` 30/30 PASS):
         - Haiku: 10/10 = 100% (远超 R7 ≥84% lower bound)
         - Sonnet: 10/10 = 100% (perfection expected per Phase 3.4 W1 T1.6 harness)
         - Opus: 10/10 = 100% (远超 derived middle bar ≥80% per Phase 3.4 RESEARCH § 4.4 A4 ASSUMED LOW risk)
       - **Verdict**: PASS R4.2 + R8.1 (公开 review-ready; reproducible per CONTRIBUTING-BENCHMARK.md)
       ```
     - **§ 4 反"数据美化诱惑"声明 footer (~10L)** anchored ROADMAP L222 verbatim risk per § 3.4 template:
       ```markdown
       ## § 4 反"数据美化诱惑"声明 (per ROADMAP L222 v0.4.0 风险)

       本 benchmark 公开**原始 prompt + 路由决策 + 命中正误**, 不删/不改/不重新挑选 sample。

       - 数据源: `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL mining 302 commits Phase 3.4 W0.5
       - 路由测试 fixture (single SoT 一致): `tests/routing/phase-3.4-routing-hit-rate.test.ts` 30/30 PASS
       - 失败案例占比: 0/30 (当前 routing 100%); v0.5+ 若 SAMPLES expand 含 miss case, recovery_path 列必填
       - 任何人可复现: `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` (per-PR CI green) + manual benchmark re-render per `docs/CONTRIBUTING-BENCHMARK.md`
       ```
     - **§ 5 Frozen Marker (~10L)** sister SAMPLES.md § 3 cherry-pick 防御 + D-01 single SoT lock:
       ```markdown
       ## § 5 Frozen Marker

       - benchmark v0.4.md 30-row content frozen at Phase 4.1 ship 2026-05-18; ADR-needed-to-amend (Phase 4.2+ if SAMPLES.md churn OR routing/decision_rules.yaml v3)
       - D-04 MANUAL re-run cadence: SAMPLES.md churn OR routing/decision_rules.yaml v3 OR upstream major version bump → human re-runs per `docs/CONTRIBUTING-BENCHMARK.md`
       - Anti-drift gate: If SAMPLES.md updated, re-render this file manually per CONTRIBUTING-BENCHMARK.md (D-04 MANUAL cadence)
       ```
     - **§ 6 Upgrade e2e log cross-link (~10L)**:
       ```markdown
       ## § 6 Upgrade E2E Log Cross-Link

       See companion `docs/benchmarks/v0.4-upgrade-e2e.log` (D-03 LOCKED plain text 4-section log) covering:
       - **ctx7** (install_method = `npm-cli`): single-file npm dep upgrade demo
       - **gstack** (install_method = `git-clone-with-setup`): git_ref SHA-pinned upgrade demo
       ```
  3. **Sneak-block守门 verify** (planner manual review pre-commit):
     - Per-task `raw_prompt` MUST be verbatim from SAMPLES.md description OR Phase 3.4/3.3/... task_plan.md original line (D-02 sneak block "NOT sanitized/paraphrased"); reviewer grep verify "verbatim from `.planning/phase-3.4/SAMPLES.md` row XX" attribution in every T## section
     - Per-task `routing_decision` MUST cite actual `routing/decision_rules.yaml` v2 rule_id (e.g., `engineering-execute-tdd`, OR explicit `none (router=B fallback)`); D-02 sneak block enforcement
     - Per-task `recovery_path` MUST be explicit `N/A (hit)` for 30/30 (NO suppress miss cases per D-02 sneak block); schema reservation documented in § 4 footer
     - Cross-link SAMPLES.md ≥ 2 occurrences (header + § 5 attribution per D-01 sneak block single SoT守门)
  4. Post-write hard cap verify: `wc -l docs/benchmarks/v0.4.md` ≤ 400 (planner Discretion #1 LOCK; R-01 mitigation)
  5. **IF post-write breach >400L** (R-01 mitigation hierarchy per § 10.1):
     - Mitigation 1: drop per-task `description` column (keep in SAMPLES.md only; v0.4.md routes reader to SAMPLES.md for terse description) → saves ~30L (1L × 30)
     - Mitigation 2: compress 5-element labels (drop blank lines between elements; tightens per-task to 8L) → saves ~60L (2L × 30)
     - Aggregate-only REJECTED per D-02 sneak block (NOT a mitigation option)
  6. Biome NOT needed (`.md` extension out of biome scope); skip biome preempt for this task
  7. **Recommended commit msg**:
     ```
     feat(phase-4.1-w1): T1.1 — docs/benchmarks/v0.4.md NEW ~350L D-02 FULL per-task disclosure (R8.1 dogfooding benchmark anchor; sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE + DOGFOOD verdict header pattern)

     Phase 4.1 W1 main artifact — inaugurates docs/benchmarks/ NEW surface
     (baseline empty .gitkeep only). 4 D-decisions activated 闭环:
     - D-01 REUSE Phase 3.4 SAMPLES.md 30-row REAL HISTORICAL single SoT (NO new
       mining sneak block; 30 row content directly from SAMPLES.md)
     - D-02 FULL per-task disclosure 5-element × 30 sections (raw_prompt verbatim
       NOT sanitized + routing_decision rule_id+tier+skill + actual_command +
       verdict + recovery_path schema reserved for v0.5+ miss case)
     - D-03 cross-link to docs/benchmarks/v0.4-upgrade-e2e.log § 6
     - D-04 MANUAL re-run cadence per docs/CONTRIBUTING-BENCHMARK.md

     反"数据美化诱惑" 声明 footer anchored ROADMAP L222 verbatim risk (原始
     prompt + 决策 + 命中正误公开; 失败案例占比 0/30 当前; v0.5+ schema 保留
     recovery_path 列). Karpathy hard cap ≤400L LOCK per planner Discretion #1
     (estimate ~350L; sister docs precedent range adr 0014-0017 ≤250L +
     AGENT-DEFINITION ~400L within).

     Cross-link SAMPLES.md ≥ 2 occurrences (header + § 5 attribution per D-01
     single SoT sneak block守门). Anti-drift gate: re-render manually per
     CONTRIBUTING-BENCHMARK.md if SAMPLES.md updated.
     ```
  8. **Update Resolved (T1.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l docs/benchmarks/v0.4.md` post-write + mitigation applied if any)
- **acceptance_criteria**:
  - `test -f docs/benchmarks/v0.4.md` exit 0
  - `wc -l docs/benchmarks/v0.4.md` ≤ 400 (planner Discretion #1 hard cap LOCK; R-01 mitigation)
  - `grep -c "^### T[0-9][0-9]" docs/benchmarks/v0.4.md` ≥ 30 (30 task sections D-02 FULL — Axis A DOGFOOD verify source)
  - `grep -c "Raw prompt" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task raw_prompt fields D-02 FULL)
  - `grep -c "Routing decision" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task routing_decision fields D-02 FULL)
  - `grep -c "Manual review verdict" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task verdict fields D-02 FULL)
  - `grep -c "Miss recovery path\|recovery_path" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task recovery_path fields D-02 sneak block守门)
  - `grep -c "SAMPLES.md" docs/benchmarks/v0.4.md` ≥ 2 (header + § 5 attribution per D-01 single SoT sneak block守门)
  - `grep -q "30/30" docs/benchmarks/v0.4.md` exit 0 (§ 3 Aggregate footer)
  - `grep -q "反.数据美化诱惑\|数据美化" docs/benchmarks/v0.4.md` exit 0 (§ 4 反"美化"声明 anchored ROADMAP L222)
  - `grep -q "Frozen Marker\|frozen at Phase 4.1" docs/benchmarks/v0.4.md` exit 0 (§ 5 cherry-pick 防御)
  - `grep -q "v0.4-upgrade-e2e.log" docs/benchmarks/v0.4.md` exit 0 (§ 6 cross-link to companion e2e log)
- **decision_source**: CONTEXT § Decisions D-01 + D-02 verbatim LOCKED + RESEARCH § 2 (D-01 mapping 7→8 col forward-compat) + § 3 (D-02 FULL 5-element template) + § 10 (size budget ≤400L mitigation hierarchy) + PATTERNS § 1 row 4 + § 2.3 (70% reuse mapping + concrete code excerpt) + planner Discretion #1 ≤400L hard cap LOCK + planner Discretion #2 8-col schema (drop task_type + tier; add task_description + routing_decision + actual_command + verdict + recovery_path)

---

### T1.2 — SAMPLES.md → benchmark transformer step (D-01 REUSE single SoT; planner-derived 8-col rendering of frozen 30-row 7-col via expansion per planner Discretion #2 § 2.2; verify forward-compat lossless projection)

- **files_modified**: NO file modify (this is a planner-verify step embedded in T1.1 manual transcription; outputs to `docs/benchmarks/v0.4.md` § 2 30 sections via T1.1 action step 2)
- **read_first**:
  - `.planning/phase-3.4/SAMPLES.md` § 2 30-row truth table (by Read — verify each row source_commit non-empty + expected_decision yaml inline body for routing_decision derivation)
  - `routing/decision_rules.yaml` (by Read — full file for rule_id derivation per row; D-02 sneak block "actual decision_rules.yaml routing path")
  - 30 source_commit git show outputs (by Bash `git show <sha> --stat` per row; for actual_command_executed derivation)
- **action**:
  1. **Per-row transformation per RESEARCH § 2.1 mapping table** (executed inline as part of T1.1 manual transcription; this T1.2 is the verification gate):
     | SAMPLES.md col (7) | docs/benchmarks/v0.4.md col (8) | Transformation |
     |--------------------|----------------------------------|----------------|
     | `#` | `#` | direct copy |
     | `task_id` | `task_id` (embedded in § 2 section header `### T01 (haiku / chore) — ...`) | direct copy |
     | `model_expected` | `tier` (embedded in section header `(haiku / chore)`) | direct rename (haiku/sonnet/opus → reader-friendly) |
     | `task_type` | `task_type` (embedded in section header) | direct copy |
     | `description (≤120 chars)` | `task_description_human_readable` (D-02 expansion) | expand: SAMPLES.md terse engineering-internal → human-readable raw_prompt verbatim block |
     | `source_commit` | `source_commit` field | direct copy (with git URL hyperlink option) |
     | `expected_decision (yaml inline)` | `routing_decision` (rule_id + tier + skill + rationale) | derive: parse yaml inline → manually trace `routing/decision_rules.yaml` v2 12 rules → render rule_id + tier (Haiku/Sonnet/Opus) + skill (e.g., `karpathy-baseline`, `engineering-execute-tdd`) + rationale string |
     | (NEW D-02) | `actual_command_executed` | derive: from source_commit `git show <sha> --stat` → infer command verbatim (e.g., `git commit -m "..."` literal from log) |
     | (NEW D-02) | `manual_review_verdict` | 'hit' for 30/30 100% per Phase 3.4 W1 T1.6 routing harness PASS |
     | (NEW D-02) | `recovery_path` | 'N/A (hit)' for 30/30 100%; schema reserved for v0.5+ miss cases per D-02 sneak block |
  2. **Column count expansion verify** (planner Discretion #2 § 2.2): final benchmark v0.4.md = **8 cols** (`#` + `task_id` + `task_description_human_readable` + `source_commit` + `routing_decision` + `actual_command_executed` + `manual_review_verdict` + `recovery_path`); drop `task_type` + `tier` from public table view (kept in source SAMPLES.md but redundant in v0.4.md when `routing_decision` includes tier already)
  3. **Forward-compat lossless projection verify** (planner Discretion #2 sneak block): SAMPLES.md frozen 30-row 7-col data MUST be losslessly projectable to expanded 8-col schema; reviewer cross-check each SAMPLES.md row → v0.4.md § 2 T## section is faithful expansion (no info loss except `task_type` + `tier` which are preserved in SAMPLES.md as single SoT)
  4. **Anti-drift gate**: docs/benchmarks/v0.4.md header MUST cite "Source data: `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL mining 302 commits Phase 3.4 W0.5" + § 5 cross-link "If SAMPLES.md updated, re-render this file manually per CONTRIBUTING-BENCHMARK.md (D-04 MANUAL cadence)"
  5. **NO separate commit** for T1.2 (transformer step is embedded in T1.1 commit; this T1.2 entry documents the transformation logic + verification gate)
- **acceptance_criteria** (verified via T1.1 acceptance criteria above):
  - `grep -c "^### T[0-9][0-9]" docs/benchmarks/v0.4.md` ≥ 30 (30 task sections render of SAMPLES.md 30 row)
  - Reviewer manual verify: each T## section's raw_prompt verbatim from SAMPLES.md description OR task_plan.md original (D-02 sneak block enforcement)
  - Reviewer manual verify: each T## section's routing_decision rule_id traces to `routing/decision_rules.yaml` v2 production rule (D-02 sneak block "actual decision_rules.yaml routing path")
  - Reviewer manual verify: column count expansion 7→8 lossless projection (no info loss except task_type/tier preserved in SAMPLES.md single SoT)
- **decision_source**: CONTEXT § Decisions D-01 REUSE + D-02 FULL + planner Discretion #2 § 2.2 (column count expansion 7→8 forward-compat verify) + RESEARCH § 2 (D-01 mapping table verbatim) + PATTERNS § 3 D-01 + D-02 sneak block (single SoT + raw_prompt verbatim + actual decision_rules.yaml path enforcement)

---

### T1.3 — e2e upgrade text log script step (planner-picked ctx7 + gstack manifest per planner Discretion #5 § 4.2 install_method 多样性: npm-cli + git-clone-with-setup; SKIP tavily-mcp defer v0.5+; 4-section text log capture per D-03 LOCKED)

- **files_modified**: NO file modify directly (this is a planner-execution step that captures terminal output to feed T1.4 file write; commands run + outputs piped to docs/benchmarks/v0.4-upgrade-e2e.log per T1.4)
- **read_first**:
  - `manifests/tools/ctx7.yaml` (by Read — verify install.method=npm-cli + spec.install.npm_package for ctx7 upgrade target)
  - `manifests/skill-packs/gstack.yaml` L20-22 (by Read — verify install.method=git-clone-with-setup + install.git_ref SHA-pinned `74895062fb8a3acbf9f66cd088a83359aaaa56cd` per Phase 3.4 RESEARCH § 7.1)
  - `versions/0.3.0-known-good.yaml` (by Read — verify 8 pinned entries — ctx7 + gstack baseline versions; e2e_verified_at 2026-05-17)
  - `.planning/phase-4.1/RESEARCH.md` § 4 + § 12 (D-03 4-section template + e2e manifest pick rationale — offset 235 limit 50 + offset 690 limit 35)
  - `.planning/phase-4.1/PATTERNS.md` § 2.4 (concrete e2e log excerpt sample ~70L for 1 manifest)
- **action**:
  1. **Pick 1: ctx7** (install_method=npm-cli per § 4.2 rationale — single-file npm dep, fast upgrade, deterministic version pinning):
     - **§ 1 Pre-Upgrade State**:
       ```bash
       harnessed install ctx7 --dry-run --non-interactive 2>&1 | tee /tmp/ctx7-pre.log
       node ./dist/cli.mjs doctor --json 2>&1 | jq '.checks | length' | tee /tmp/ctx7-doctor-pre.log
       pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts 2>&1 | tail -5 | tee /tmp/ctx7-routing-pre.log
       ```
     - **§ 2 Upgrade Command**:
       ```bash
       # Either real `pnpm add -D @upstash/context7-mcp@latest` upgrade OR dry-run sim per CONTEXT scope
       harnessed install ctx7 --known-good --dry-run --non-interactive 2>&1 | tee /tmp/ctx7-upgrade.log
       ```
     - **§ 3 Diff Output**:
       ```bash
       git diff versions/0.3.0-known-good.yaml 2>&1 | tee /tmp/ctx7-diff.log
       ```
     - **§ 4 Post-Upgrade State**:
       ```bash
       harnessed install ctx7 --known-good --dry-run --non-interactive 2>&1 | tee /tmp/ctx7-post.log
       ```
     - Expected total log size: ~50-80L compact diff
  2. **Pick 2: gstack** (install_method=git-clone-with-setup per § 4.2 rationale — multi-step git clone + setup script, covers git_ref SHA upgrade flow):
     - Same 4-section structure as ctx7 above with gstack-specific commands
     - Verify git_ref SHA-pinned per `74895062fb8a3acbf9f66cd088a83359aaaa56cd` (or fallback per § 18 U2 ASSUMED LOW risk if newer SHA unavailable)
     - Expected total log size: ~80-100L multi-step
  3. **Skip rationale: tavily-mcp** (per § 12.2): install_method=mcp-stdio-add already covered Phase 2.2/2.3 install dogfood; adding 3rd manifest = +50L docs bloat marginal value; defer v0.5+ if external user feedback requests visibility into `mcp-stdio-add` upgrade path
  4. **Sneak-block守门 verify** (D-03):
     - MUST NOT add asciinema npm dep: `grep -q "asciinema" package.json` returns false
     - MUST NOT commit binary mp4/gif/png > 100KB: `file /tmp/ctx7-*.log` returns "ASCII text" + `wc -c /tmp/ctx7-*.log` < 102400
     - MUST capture 4-section per log: 4 `=== § N ` section headers per manifest
  5. **NO separate commit** for T1.3 (planner-execution step; outputs feed T1.4 file write — commit happens at T1.4)
- **acceptance_criteria** (verified at T1.4):
  - `/tmp/ctx7-*.log` files exist post-execution (pre + upgrade + diff + post)
  - `/tmp/gstack-*.log` files exist post-execution (4 sections)
  - `file /tmp/*.log` returns "ASCII text" (D-03 sneak block — no binary)
  - `wc -c /tmp/*.log` < 102400 per file (D-03 sneak block — < 100KB)
- **decision_source**: CONTEXT § Decisions D-03 LOCKED TEXT LOG + planner Discretion #5 § 4.2 (ctx7 + gstack picks install_method 多样性) + RESEARCH § 4 (D-03 4-section template + manifest selection rationale) + § 12 (e2e target manifest pick + skip tavily-mcp) + PATTERNS § 2.4 (concrete e2e log excerpt sample)

---

### T1.4 — docs/benchmarks/v0.4-upgrade-e2e.log NEW ~50-150L plain text 4-section log (D-03 TEXT LOG zero-dep; combines T1.3 captures into single file with 2 manifest sections OR split per planner W1 execution choice)

- **files_modified**:
  - `docs/benchmarks/v0.4-upgrade-e2e.log` (NEW ~140L total — 2 manifests × 4 sections × ~20L each; OR split into 2 files `v0.4-upgrade-e2e-ctx7.log` ~70L + `v0.4-upgrade-e2e-gstack.log` ~90L per planner W1 execution choice — both viable per § 18 U6)
- **read_first**:
  - `/tmp/ctx7-*.log` + `/tmp/gstack-*.log` from T1.3 captures
  - `.planning/phase-4.1/RESEARCH.md` § 4.1 (D-03 4-section template verbatim — offset 240 limit 25)
  - `.planning/phase-4.1/PATTERNS.md` § 2.4 (concrete e2e log excerpt sample ~70L for 1 manifest verbatim)
- **action**:
  1. Create NEW file `docs/benchmarks/v0.4-upgrade-e2e.log` ~140L (or split per W1 execution choice; single file recommended per Karpathy YAGNI consolidation):
     ```log
     # Dogfooding Benchmark v0.4.0 — Upstream Upgrade E2E Recording
     # Recorded: 2026-05-18 / D-03 LOCKED TEXT LOG (sister Karpathy zero-dep precedent)
     # Target manifests: ctx7 (npm-cli) + gstack (git-clone-with-setup) per planner Discretion #5 install_method 多样性

     ## Manifest 1: ctx7 (install_method=npm-cli)

     === § 1 Pre-Upgrade State ===

     $ harnessed install ctx7 --dry-run --non-interactive
     [verbatim T1.3 /tmp/ctx7-pre.log contents]

     === § 2 Upgrade Command Executed ===

     $ harnessed install ctx7 --known-good --dry-run --non-interactive
     [verbatim T1.3 /tmp/ctx7-upgrade.log contents]

     === § 3 Diff Output (git diff verbatim) ===

     $ git diff versions/0.3.0-known-good.yaml
     [verbatim T1.3 /tmp/ctx7-diff.log contents]

     === § 4 Post-Upgrade State Verification ===

     $ harnessed install ctx7 --known-good --dry-run --non-interactive
     [verbatim T1.3 /tmp/ctx7-post.log contents]

     # E2E verified: known-good lock mechanism propagates upstream version bump correctly.

     ## Manifest 2: gstack (install_method=git-clone-with-setup)

     === § 1 Pre-Upgrade State ===
     [verbatim T1.3 /tmp/gstack-pre.log contents]

     === § 2 Upgrade Command Executed ===
     [verbatim T1.3 /tmp/gstack-upgrade.log contents]

     === § 3 Diff Output (git diff verbatim) ===
     [verbatim T1.3 /tmp/gstack-diff.log contents]

     === § 4 Post-Upgrade State Verification ===
     [verbatim T1.3 /tmp/gstack-post.log contents]

     # E2E verified: git_ref SHA-pinned upgrade flow demoed.

     # Re-record this log per docs/CONTRIBUTING-BENCHMARK.md Step 2 when versions/<ver>-known-good.yaml updates.
     ```
  2. Karpathy hard limit verify: `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` ≤ 150 (4 section × ~20-40L × 2 manifests = ~140L estimate)
  3. D-03 sneak block verify (pre-commit):
     - `file docs/benchmarks/v0.4-upgrade-e2e.log` returns "ASCII text" (no binary)
     - `wc -c docs/benchmarks/v0.4-upgrade-e2e.log` < 102400 (< 100KB)
     - `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` ≥ 8 (4 sections × 2 manifests; OR ≥ 4 if single manifest)
  4. Biome NOT needed (`.log` extension out of biome scope); skip biome preempt
  5. **Recommended commit msg**:
     ```
     feat(phase-4.1-w1): T1.3 + T1.4 — docs/benchmarks/v0.4-upgrade-e2e.log NEW ~140L D-03 TEXT LOG 4-section × 2 manifests (ctx7 npm-cli + gstack git-clone-with-setup planner Discretion #5 install_method 多样性)

     D-03 LOCKED zero-dep plain text 4-section log (sister Karpathy precedent;
     NO asciinema npm dep per sneak block; NO mp4/gif/png > 100KB per sneak
     block). 2 manifests × 4 sections (pre-state + upgrade command + diff +
     post-state) = ~140L total ≤150L Karpathy hard limit; cross-OS portable
     ASCII text grep-able git diff friendly.

     planner Discretion #5 LOCK picks: ctx7 (npm-cli install_method, fast
     upgrade, deterministic version pinning, ~50-80L compact) + gstack
     (git-clone-with-setup install_method, git_ref SHA-pinned 74895062 covers
     SHA upgrade flow, ~80-100L multi-step). SKIP tavily-mcp 3rd manifest =
     +50L docs bloat marginal value (mcp-stdio-add already covered Phase 2.2/
     2.3 install dogfood); defer v0.5+ if external feedback requests visibility.

     Cross-link from docs/benchmarks/v0.4.md § 6 Upgrade E2E Log section.
     Re-capture per docs/CONTRIBUTING-BENCHMARK.md Step 2 when versions/
     <ver>-known-good.yaml updates.
     ```
  6. **Update Resolved (T1.3 + T1.4)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` + `file docs/benchmarks/v0.4-upgrade-e2e.log` + `wc -c docs/benchmarks/v0.4-upgrade-e2e.log` + ctx7 + gstack actual version availability per § 18 U1+U2)
- **acceptance_criteria**:
  - `test -f docs/benchmarks/v0.4-upgrade-e2e.log` exit 0
  - `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` ≤ 150 (Karpathy hard limit; estimate ~140L)
  - `file docs/benchmarks/v0.4-upgrade-e2e.log | grep -q "ASCII text"` exit 0 (D-03 sneak block — no binary)
  - `wc -c docs/benchmarks/v0.4-upgrade-e2e.log` < 102400 (D-03 sneak block — < 100KB)
  - `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` ≥ 4 (4-section per D-03; ≥ 8 if 2 manifests in single file)
  - `grep -q "ctx7" docs/benchmarks/v0.4-upgrade-e2e.log` exit 0 (planner Discretion #5 pick #1)
  - `grep -q "gstack" docs/benchmarks/v0.4-upgrade-e2e.log` exit 0 (planner Discretion #5 pick #2)
  - `grep -c "asciinema" package.json` = 0 (D-03 sneak block — no npm dep)
- **decision_source**: CONTEXT § Decisions D-03 LOCKED TEXT LOG + planner Discretion #5 § 4.2 ctx7 + gstack picks + RESEARCH § 4.1 4-section template + § 12 manifest pick rationale + PATTERNS § 2.4 concrete code excerpt verbatim

---

### T1.5 — docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L hard (D-04 MANUAL re-run instructions; planner Discretion #4 separate NEW file LOCK per § 5.1; fold-in to existing CONTRIBUTING.md 200L REJECTED — pollutes core dev setup)

- **files_modified**:
  - `docs/CONTRIBUTING-BENCHMARK.md` (NEW ≤30L hard per CONTEXT D-04 sneak block L67 verbatim; 4-section ultra-minimal structure per § 5.2 template)
- **read_first**:
  - `CONTRIBUTING.md` L1-200 (by Read — verify 200L existing dev setup + commit + ADR rules; confirm fold-in REJECTED per § 5.1 evaluation pollutes core)
  - `.planning/phase-4.1/RESEARCH.md` § 5 + § 11 (D-04 CONTRIBUTING-BENCHMARK.md placement + ≤30L content recipe verbatim — offset 286 limit 65)
  - `.planning/phase-4.1/PATTERNS.md` § 2.5 (concrete CONTRIBUTING-BENCHMARK.md ~28L excerpt verbatim)
- **action**:
  1. Verify `CONTRIBUTING.md` exists at repo root (10778 bytes / 200L per disk `wc -lc`); confirm fold-in REJECTED per § 5.1 evaluation
  2. Create NEW file `docs/CONTRIBUTING-BENCHMARK.md` ~28L per § 5.2 + § 11.1 template verbatim:
     ```markdown
     # CONTRIBUTING-BENCHMARK — Manual Re-Run Instructions

     > **Cadence (D-04 LOCKED)**: MANUAL on-demand only — NO weekly cron / NO per-PR full benchmark (sister Phase 3.4 routing harness already gates per-PR via `pnpm test`)

     ## When to re-run

     - `.planning/phase-3.4/SAMPLES.md` 30-row source churn (ADR-needed-to-amend)
     - `routing/decision_rules.yaml` v3 release (rule priority changes)
     - `versions/<harnessed-ver>-known-good.yaml` upstream major version bump

     ## Pre-flight

     ```bash
     pnpm install
     pnpm build  # MUST run BEFORE test per Phase 3.4 CI hotfix 554b82b lesson
     ```

     ## How to re-run

     ```bash
     # Step 1 — Routing harness re-run (expected 30/30 = 100%)
     pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts

     # Step 2 — E2E upgrade log re-capture (per D-03 4-section)
     harnessed install ctx7 --known-good --dry-run --non-interactive 2>&1 | tee -a docs/benchmarks/v0.4-upgrade-e2e.log

     # Step 3 — Update docs/benchmarks/v0.4.md if hit/miss verdict changed (D-02 NO suppress miss cases)
     # Step 4 — Commit + push (NO CI gate fires per D-04 MANUAL)
     ```

     ## Acceptance

     - `docs/benchmarks/vN.M.md` includes all SAMPLES.md rows verbatim-linked
     - Per-task `routing_decision` traces to `routing/decision_rules.yaml` rule_id
     - `manual_review_verdict` matches `tests/routing/phase-3.4-routing-hit-rate.test.ts` result
     ```
  3. Karpathy hard limit verify: `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 (CONTEXT D-04 explicit lock; estimate ~28L)
  4. D-04 sneak block verify:
     - `ls .github/workflows/ | grep -c benchmark` = 0 (no benchmark.yml cron)
     - `grep -c "benchmark" .github/workflows/ci.yml` = 0 (baseline disk-verified 2026-05-18 `grep -c` = 0; no NEW step inserted)
  5. Biome NOT needed (`.md` extension out of biome scope); skip biome preempt
  6. Optional: add 1-line cross-link from `CONTRIBUTING.md` to `docs/CONTRIBUTING-BENCHMARK.md` (discovery aid; +1L delta to CONTRIBUTING.md = 201L still well within reasonable; NOT mandatory per Karpathy YAGNI)
  7. **Recommended commit msg**:
     ```
     docs(phase-4.1-w1): T1.5 — docs/CONTRIBUTING-BENCHMARK.md NEW ~28L D-04 MANUAL re-run instructions (planner Discretion #4 separate NEW file LOCK per § 5.1; fold-in REJECTED pollutes 200L CONTRIBUTING.md core)

     D-04 LOCKED MANUAL on-demand cadence (NO weekly cron / NO per-PR full
     benchmark per sneak block; sister Phase 3.4 routing harness already gates
     per-PR via `pnpm test` post-554b82b CI hotfix). Karpathy single-purpose
     doc ≤30L hard per CONTEXT D-04 explicit lock; 4-section structure:
     - When to re-run (SAMPLES.md churn / decision_rules.yaml v3 / upstream
       major version bump)
     - Pre-flight (pnpm install + pnpm build per Phase 3.4 CI hotfix lesson)
     - How to re-run (Step 1 routing harness + Step 2 e2e log re-capture +
       Step 3 update v0.4.md + Step 4 commit + push NO CI gate)
     - Acceptance (3 grep verifiers)

     planner Discretion #4 separate NEW file LOCK per § 5.1 evaluation —
     fold-in into existing 200L CONTRIBUTING.md REJECTED (pollutes core dev
     setup + commit + ADR rules; benchmark re-run is different audience).
     Cross-link from docs/benchmarks/v0.4.md § 5 Frozen Marker anti-drift gate.
     ```
  8. **Update Resolved (T1.5)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l docs/CONTRIBUTING-BENCHMARK.md` + D-04 sneak block grep counts)
- **acceptance_criteria**:
  - `test -f docs/CONTRIBUTING-BENCHMARK.md` exit 0
  - `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 (CONTEXT D-04 explicit lock; planner Discretion #4 single-purpose Karpathy YAGNI)
  - `grep -q "MANUAL on-demand\|manual re-run" docs/CONTRIBUTING-BENCHMARK.md` exit 0 (D-04 cadence)
  - `grep -q "pnpm test tests/routing/phase-3.4-routing-hit-rate" docs/CONTRIBUTING-BENCHMARK.md` exit 0 (Step 1 verbatim cite per § 11.2 cross-link)
  - `grep -q "SAMPLES.md" docs/CONTRIBUTING-BENCHMARK.md` exit 0 (source data cross-link per § 11.2)
  - `grep -q "v0.4.md\|v0.4-upgrade-e2e.log" docs/CONTRIBUTING-BENCHMARK.md` exit 0 (consumer artifact cross-link)
  - `ls .github/workflows/ | grep -c benchmark` = 0 (D-04 sneak block — no cron)
  - `grep -c "benchmark" .github/workflows/ci.yml` = 0 (baseline disk-verified 2026-05-18 `grep -c` = 0; D-04 sneak block — no NEW ci.yml step)
- **decision_source**: CONTEXT § Decisions D-04 LOCKED MANUAL + planner Discretion #4 separate NEW file LOCK per § 5.1 evaluation + RESEARCH § 5 + § 11 (CONTRIBUTING-BENCHMARK ≤30L content recipe verbatim) + PATTERNS § 2.5 (concrete ~28L excerpt verbatim)

---

### T1.6 — benchmark integrity manual review pass (planner verify v0.4.md row count = 30 + per-row source_commit non-empty + per-tier breakdown matches SAMPLES.md per D-01 sneak-block; D-02 FULL disclosure 5-field schema verify; D-03 + D-04 sneak block守门 verify)

- **files_modified**: NO file modify (planner manual review gate before W1 done)
- **read_first**:
  - `docs/benchmarks/v0.4.md` post-T1.1 (verify 30 section count + each section has 5-field schema)
  - `docs/benchmarks/v0.4-upgrade-e2e.log` post-T1.4 (verify 4 sections + binary safety + grep-able)
  - `docs/CONTRIBUTING-BENCHMARK.md` post-T1.5 (verify ≤30L + D-04 cadence)
  - `.planning/phase-3.4/SAMPLES.md` (verify D-01 single SoT — benchmark v0.4.md row count matches SAMPLES.md row count = 30)
- **action**:
  1. **D-01 single SoT verify**:
     - `grep -c "^### T[0-9][0-9]" docs/benchmarks/v0.4.md` ≥ 30 (matches SAMPLES.md `grep -c '^| 0' SAMPLES.md` = 30)
     - `grep -c "SAMPLES.md" docs/benchmarks/v0.4.md` ≥ 2 (header + § 5 attribution per D-01 sneak block守门)
     - Reviewer manual verify: each T## row's raw_prompt verbatim from SAMPLES.md description (NOT sanitized/paraphrased per D-02 sneak block — overlap with D-02 verify below)
  2. **D-02 FULL disclosure 5-field schema verify**:
     - `grep -c "Raw prompt" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task raw_prompt fields)
     - `grep -c "Routing decision" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task routing_decision fields)
     - `grep -c "Actual command executed" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task actual_command_executed fields)
     - `grep -c "Manual review verdict" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task verdict fields)
     - `grep -c "Miss recovery path\|recovery_path" docs/benchmarks/v0.4.md` ≥ 30 (30 per-task recovery_path fields — schema reserved for v0.5+ miss case per D-02 sneak block "NOT suppress miss cases")
     - `grep -q "30/30\|100%" docs/benchmarks/v0.4.md` exit 0 (§ 3 Aggregate footer Total verdict)
     - `grep -q "Haiku.*10/10\|Sonnet.*10/10\|Opus.*10/10" docs/benchmarks/v0.4.md` exit 0 (§ 3 per-tier breakdown matches Phase 3.4 W1 T1.6 routing harness)
     - `grep -q "反.*美化\|数据美化诱惑" docs/benchmarks/v0.4.md` exit 0 (§ 4 anti-vanity footer anchored ROADMAP L222)
  3. **D-03 sneak block verify** (e2e log binary safety):
     - `file docs/benchmarks/*.log | grep -q "ASCII text"` exit 0 (no binary)
     - `wc -c docs/benchmarks/*.log` per file < 102400 (< 100KB)
     - `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` ≥ 4 (4-section per D-03 sneak block)
     - `grep -c "asciinema" package.json` = 0 (no npm dep per D-03 sneak block)
  4. **D-04 sneak block verify** (no CI cron sneak):
     - `ls .github/workflows/ | grep -c benchmark` = 0 (no benchmark.yml cron file)
     - `grep -c "benchmark" .github/workflows/ci.yml` = 0 (baseline disk-verified 2026-05-18 `grep -c` = 0; no NEW step inserted post-L143 `check-deferred-items.mjs` block)
  5. **Karpathy hard cap verify** (all artifacts):
     - `wc -l docs/benchmarks/v0.4.md` ≤ 400 (planner Discretion #1 LOCK; R-01 mitigation)
     - `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` ≤ 150 (4 section × ~20-40L × 2 manifests)
     - `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 (CONTEXT D-04 explicit lock)
  6. **NO separate commit** for T1.6 (planner verify gate; outputs documented in DOGFOOD-T2.X.md W2 T2.6 Axes A+B+C verification)
  7. **IF any verify FAILS**: escalate to planner + fix at source task (T1.1 for D-01/D-02 fails, T1.4 for D-03 fails, T1.5 for D-04 fails); do NOT proceed to W2 until all 4 D-decisions + 3 sneak blocks pass
- **acceptance_criteria**:
  - All grep verifiers above exit 0 (D-01 + D-02 + D-03 + D-04 sneak block守门 ALL pass)
  - Karpathy hard cap verifiers pass (3 docs artifacts within LOC limits)
  - Reviewer manual confirmation: 4 D-decisions activated 闭环 + 4 sneak blocks守门 enforced
- **decision_source**: CONTEXT § Decisions D-01 + D-02 + D-03 + D-04 LOCKED 4 sneak blocks守门 + RESEARCH § 16 STRIDE threat model 7 nodes mitigation verify + PATTERNS § 3 (cross-cutting D-decisions sneak block enforcement) + planner W1 verify gate before W2 proceed

---

## Wave 1 done

All 6 atomic tasks complete. W1 main scope ship-criteria all satisfied per PLAN.md Wave 1 success_criteria block. Phase 4.1 anchor R8.1 dogfooding benchmark 公开 delivered:
- T1.1 docs/benchmarks/v0.4.md NEW ~350L D-02 FULL per-task disclosure 30 sections
- T1.2 SAMPLES.md → benchmark transformer (7→8 col forward-compat verified)
- T1.3 e2e upgrade text log script (ctx7 + gstack captures)
- T1.4 docs/benchmarks/v0.4-upgrade-e2e.log NEW ~140L 4-section × 2 manifests
- T1.5 docs/CONTRIBUTING-BENCHMARK.md NEW ~28L D-04 manual re-run instructions
- T1.6 benchmark integrity verify (4 D-decisions + 3 sneak blocks守门 PASS)

> **W2 ship close prereq from Wave 1 outputs**:
> - W1 T1.1 docs/benchmarks/v0.4.md ≤400L (W2 T2.6 DOGFOOD Axis A verify source)
> - W1 T1.4 docs/benchmarks/v0.4-upgrade-e2e.log ≤150L + ASCII text + < 100KB (W2 T2.6 DOGFOOD Axis B verify source)
> - W1 T1.5 docs/CONTRIBUTING-BENCHMARK.md ≤30L (W2 T2.3 ROADMAP cross-link verify)
> - Full suite green pre-W2 (W2 T2.7 single baseline tag gating; sister Phase 3.4 W2 T2.12 pattern subset)

---

## Wave 2 — Ship close (5 atomic + DOGFOOD + tag = 7 tasks; sister Phase 3.4 W2 T2.3-T2.6 + T2.11 cadence subset; NO ADR + NO A7 iter + NO triple tag per PATTERNS § 5 latent risk #3 mitigation)

### T2.1 — .planning/STATE.md 续编 Phase 4.1 SHIPPED event log + 当前位置 块 v0.4.0 1/3 SHIPPED (combined with W0.3 D2 cadence iter 2 archive sub-step per § 8.2; sister Phase 3.4 W2 T2.2 cadence subset)

- **files_modified**:
  - `.planning/STATE.md` (MODIFY: append Phase 4.1 SHIPPED entry to 已完成 phase ship 历史 + update 当前位置 block to reflect v0.4.0 1/3 SHIPPED; NOTE W0.3 D2 archive sub-step already shipped at T0.1 per § 8.2 combined cadence — T2.1 only adds Phase 4.1 SHIPPED event log + 当前位置 update on top of post-W0.3-trim baseline)
- **read_first**:
  - `.planning/STATE.md` post-W0.3 trim (verify ≤150L baseline IF W0.5 flip OR ≤200L IF defer + 当前位置 SSOT preserved)
  - `.planning/RETROSPECTIVE.md` post-T0.1 archive (verify `## § ARCHIVED FROM STATE — Phase 3.3+3.4` section present)
  - existing 已完成 phase ship 历史 section (added Phase 3.2 W0.2 + extended each phase; post-T0.1 trim has Phase 3.3 + Phase 3.4 1-line pointers; Phase 4.1 = next entry)
  - `.planning/phase-4.1/RESEARCH.md` § 13.1 W2.T2.3 (STATE/RETRO 续编 cadence subset adapted per Phase 4.1 docs-only scope — offset 734 limit 30)
- **action**:
  1. Append to 已完成 phase ship 历史 section as 15th entry (post-Phase 3.4 14th):
     ```markdown
     - **Phase 4.1 shipped** ✅ (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 (docs/benchmarks/v0.4.md NEW ~350L 30-task FULL per-task disclosure D-02 sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE + docs/benchmarks/v0.4-upgrade-e2e.log NEW ~140L D-03 TEXT LOG zero-dep 4-section × 2 manifests ctx7 + gstack planner Discretion #5 install_method 多样性 + docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L D-04 MANUAL re-run instructions + W0 backlog 3 项一次根治 W0.1 D3 ENFORCE flip DEFERRED #AF RESOLVED + W0.3 D2 cadence iter 2 institutionalize verify M2 backlog discharge + W0.5 conditional D1 round 2 SIZE_LIMIT tighten DEFERRED #AG resolve FLIP or DEFER path); v0.4.0 milestone 1/3 SHIPPED (next: Phase 4.2 co-maintainer onboarding R8.2-R8.5)
     ```
  2. Update 当前位置 block:
     - **GSD phase chain**: prepend `✅ **Phase 4.1 SHIPPED** (2026-05-18 — dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor + W0 backlog 3 项一次根治 + 4 D-decisions activated 闭环)` marker; preserve `**Phase 3.4 SHIPPED**` literal STATE_POSITION_RE anchor for D-04 COLLAPSE freshness gate
     - **当前里程碑**: update v0.4.0 milestone progress `0/3` → `1/3 SHIPPED` (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭); next Phase 4.2 co-maintainer onboarding R8.2-R8.5
     - **下一 phase**: update to `**Phase 4.2 discuss-phase 启动 prep**` (R8.2 co-maintainer 招募 + R8.3 stale-bot + R8.4 公开 ADR 全集 + R8.5 GitHub Sponsors)
     - **状态**: `✅ Phase 4.1 SHIPPED — Wave 0+1+2 全 ship 2026-05-18` + benchmark publish artifact triplet + single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE (NO push per CLAUDE.md commit safety; user controls)
  3. Verify post-续编 STATE.md line count ≤150L (W0.5 flip path) OR ≤200L (W0.5 defer path); reviewer cross-check W0.5 conditional decision tree outcome per T0.3 Resolved block
  4. Run biome preempt: `pnpm exec biome check --write` (only .ts/.js/.mjs touched if any; STATE.md is .md — biome NOT scope, but harmless idempotent — run anyway per project memory 5-recurrence terminus续延 discipline)
  5. **Recommended commit msg** (sister Phase 3.4 W2 T2.2 step 1+2 pattern):
     ```
     docs(phase-4.1-w2): T2.1 — STATE.md 续编 Phase 4.1 SHIPPED event log + 当前位置 v0.4.0 1/3 SHIPPED (combined post-W0.3 D2 cadence iter 2 archive baseline)

     Append 15th entry to 已完成 phase ship 历史: Phase 4.1 shipped ✅
     (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor.
     当前位置 update: GSD phase chain prepend Phase 4.1 SHIPPED marker
     (preserve Phase 3.4 SHIPPED literal STATE_POSITION_RE anchor); 当前里
     程碑 v0.4.0 0/3 → 1/3 SHIPPED (NOT yet 3/3 ARCHIVED reserved Phase 4.3);
     下一 phase Phase 4.2 discuss-phase 启动 prep (R8.2-R8.5).

     Sister Phase 3.4 W2 T2.2 cadence subset (Phase 4.1 docs-only narrower
     scope — NO W0.1 D2 ship-time T6.N first-implementation since combined
     with T0.1 W0.3 D2 iter 2 archive baseline per § 8.2 institutionalize
     verify pattern stable not first-time effort). Post-续编 STATE.md ≤150L
     (W0.5 flip path) OR ≤200L (W0.5 defer path) per T0.3 Resolved block.
     ```
  6. **Update Resolved (T2.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/STATE.md` post-续编 + `node scripts/check-state-archive-stale.mjs` exit code with ENFORCE=true)
- **acceptance_criteria**:
  - `grep -q "Phase 4.1 shipped\|Phase-4.1-SHIPPED" .planning/STATE.md` exit 0 (event log entry)
  - `grep -q "v0.4.0.*1/3\|v0.4.0 1/3 SHIPPED" .planning/STATE.md` exit 0 (milestone block updated)
  - `grep -q "\\*\\*Phase 3\\.4 SHIPPED\\*\\*\\|\\*\\*Phase 4\\.1 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (preserve STATE_POSITION_RE anchor for D-04 COLLAPSE freshness gate)
  - `wc -l .planning/STATE.md` ≤ 150 (W0.5 flip path) OR ≤ 200 (W0.5 defer path; per T0.3 Resolved outcome)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (CRITICAL: W0.1 ENFORCE=true MUST pass post-续编)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (freshness gate post-续编)
- **decision_source**: sister Phase 3.4 W2 T2.2 STATE.md 续编 pattern cadence subset (Phase 4.1 docs-only narrower — combined per § 8.2) + RESEARCH § 13.1 W2.T2.3 verbatim + PATTERNS § 1 row 9 (98% reuse mapping)

---

### T2.2 — .planning/RETROSPECTIVE.md 续编 Phase 4.1 milestone retrospective entry 6-section sister Phase 3.4 W2 T2.3 + Phase 3.3 W2 T2.7 format 100% reuse + receive W0.3 D2 auto-archive Phase 3.3+3.4 narrative section (already shipped at T0.1; this T2.2 adds Phase 4.1 6-section on top)

- **files_modified**:
  - `.planning/RETROSPECTIVE.md` (MODIFY append Phase 4.1 milestone retrospective entry 6-section ~+25-30L; ALREADY accepted W0.3 D2 auto-archive `## § ARCHIVED FROM STATE — Phase 3.3+3.4` section at T0.1; this T2.2 adds Phase 4.1 retro on top)
- **read_first**:
  - `.planning/RETROSPECTIVE.md` tail 200 lines (verify Phase 3.4 retro 6-section pattern + sister Phase 2.4 retro 318L gold-standard reference + ARCHIVED FROM STATE — Phase 3.3+3.4 section from T0.1)
  - `.planning/phase-4.1/RESEARCH.md` § 13.1 W2.T2.3 (RETROSPECTIVE 续编 6-section pattern verbatim — offset 734 limit 25)
  - `.planning/phase-3.4/PATTERNS.md` § 1 row 10 (W2 T2.3 mapping reuse 95%)
- **action**:
  1. Append Phase 4.1 milestone retrospective entry covering 6 section sister Phase 3.4 W2 T2.3 + Phase 3.3 W2 T2.7 format:
     - **§ What worked**: D-01 REUSE Phase 3.4 SAMPLES.md 0 day overhead + D-02 FULL per-task disclosure 反"数据美化"诱惑 + D-03 TEXT LOG zero-dep sister Karpathy precedent + D-04 MANUAL 0 infra
     - **§ What was inefficient**: docs/benchmarks/v0.4.md 30-task FULL section authoring ~300L manual transcription effort (raw_prompt verbatim NO sanitize per D-02 sneak block discipline)
     - **§ Patterns established**: 7-phase 连续 deferred-items → next phase W0 一次根治 cadence + D2 D1+D2+D3 institutionalize 2nd-iter verify (M2 backlog discharge — pattern stable) + benchmark publish artifact 30-row REAL HISTORICAL single SoT REUSE (D-01 NOT re-mine)
     - **§ Cost patterns**: Phase 4.1 内部 phase 1 day cadence延袭 (T3 risk surface Phase 4.2 co-maintainer 外部依赖)
     - **§ Key lessons**: (i) D-01 single SoT REUSE > EXPAND fresh mining (0 day overhead + 一致性 + frozen lock — sister cherry-pick 防御); (ii) D-02 FULL per-task 反"美化"诱惑兜底 (30/30 100% 不需 EXPAND fake-miss-cases); (iii) D-04 MANUAL cadence sister Karpathy YAGNI > weekly cron (sister Phase 3.4 D-02 install path 安静 一致 不增 CI 表面)
     - **§ Cross-milestone trends**: v0.4.0 第 1 phase 续延 v0.3.0 close 1-day cadence (sister 4-phase consecutive 1-day ship cadence延袭); W0.3 D2 cadence iter 2 verify (sister M2 backlog discharge)
  2. **Already accepted W0.3 D2 auto-archive per T0.1** (Phase 3.3+3.4 narrative section moved STATE → RETRO per D2 cadence 2nd-iter as `## § ARCHIVED FROM STATE — Phase 3.3+3.4` section); reviewer cross-check section present post-T0.1
  3. Run biome preempt (`.md` not biome scope; harmless idempotent run)
  4. **Recommended commit msg**:
     ```
     docs(phase-4.1-w2): T2.2 — RETROSPECTIVE.md 续编 Phase 4.1 milestone retrospective 6-section (sister Phase 3.4 W2 T2.3 + Phase 3.3 W2 T2.7 format 100% reuse)

     6-section retro per sister cadence: § What worked (D-01~D-04 all activated
     闭环) + § What was inefficient (30-task FULL section ~300L manual
     transcription D-02 verbatim discipline) + § Patterns established (7-phase
     consecutive deferred-items → next phase W0 一次根治 cadence; D2 2nd-iter
     institutionalize verify M2 backlog discharge; D-01 single SoT REUSE not
     re-mine) + § Cost patterns (内部 phase 1 day cadence; T3 risk surface
     Phase 4.2) + § Key lessons (3 lessons D-01 + D-02 + D-04 rationale) +
     § Cross-milestone trends (v0.4.0 1st phase 续延 v0.3.0 close 1-day
     cadence).

     W0.3 D2 cadence iter 2 auto-archive `## § ARCHIVED FROM STATE — Phase
     3.3+3.4` section already accepted at T0.1 (Phase 3.3 + Phase 3.4
     narrative verbatim relocated STATE.md → RETROSPECTIVE.md per D2 standing
     process 2nd-iter beyond 1st-implementation).
     ```
  5. **Update Resolved (T2.2)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/RETROSPECTIVE.md` post-续编 + 6-section grep verify)
- **acceptance_criteria**:
  - `grep -q "Phase 4.1" .planning/RETROSPECTIVE.md` exit 0
  - `grep -c "^### §\\|^## §" .planning/RETROSPECTIVE.md` ≥ 6 NEW Phase 4.1 sections added (6-section retro pattern)
  - `grep -q "What worked\\|Patterns established\\|Key lessons\\|Cross-milestone trends" .planning/RETROSPECTIVE.md` exit 0 (6-section sister Phase 3.4 format)
  - `grep -q "ARCHIVED FROM STATE — Phase 3.3\\|Phase 3.4" .planning/RETROSPECTIVE.md` exit 0 (W0.3 D2 cadence 2nd-iter archive section from T0.1 present — institutionalize verify M2 discharge)
- **decision_source**: sister Phase 3.4 W2 T2.3 RETROSPECTIVE.md 6-section format + sister Phase 3.3 W2 T2.7 + sister Phase 2.4 retro 318L gold-standard reference + RESEARCH § 13.1 W2.T2.3 + PATTERNS § 1 row 10 (95% reuse)

---

### T2.3 — .planning/ROADMAP.md Phase 4.1 ✅ SHIPPED + v0.4.0 milestone 1/3 PROGRESS marker (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭; NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)

- **files_modified**:
  - `.planning/ROADMAP.md` (MODIFY L210-212 Phase 4.1 entry add ✅ SHIPPED 2026-05-18 marker + L191/L185 v0.4.0 milestone PROGRESS update 0/3 → 1/3)
- **read_first**:
  - `.planning/ROADMAP.md` L185-225 (verify v0.4.0 milestone block + L210-212 Phase 4.1 entry + sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal pattern)
- **action**:
  1. Mark Phase 4.1 entry (L210-212 area) as ✅ SHIPPED (2026-05-18) + brief outcome summary:
     ```markdown
     - **Phase 4.1：dogfooding benchmark 数据采集 + 公开格式定义** ✅ SHIPPED (2026-05-18)
       - 30 任务执行 + 命中率统计 + 上游升级 e2e 录像/日志 → docs/benchmarks/v0.4.md NEW ~350L D-02 FULL per-task disclosure + docs/benchmarks/v0.4-upgrade-e2e.log NEW ~140L D-03 TEXT LOG zero-dep + docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L D-04 MANUAL
       - 验收: docs/benchmarks/v0.4.md review-ready ✅ (4 D-decisions activated 闭环 + 4 sneak blocks守门 + R8.1 acceptance "原始数据公开任何人可复现" satisfied per CONTRIBUTING-BENCHMARK + Phase 3.4 routing harness 30/30 PASS verbatim cite)
       - W0 backlog 3 项一次根治: W0.1 D3 ENFORCE flip DEFERRED #AF RESOLVED + W0.3 D2 cadence iter 2 institutionalize verify M2 backlog discharge + W0.5 conditional D1 SIZE_LIMIT round 2 tighten DEFERRED #AG resolve
     ```
  2. Update v0.4.0 milestone progress at section header (currently L185 `## v0.4.0 — dogfooding benchmark + 稳定期（2-3 周）`):
     - Add inline progress marker: `## v0.4.0 — dogfooding benchmark + 稳定期 (2-3 周) — **1/3 PROGRESS** (Phase 4.1 SHIPPED 2026-05-18)`
     - NOTE: NO `SHIPPED ARCHIVED` marker yet (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 reserved for milestone close = Phase 4.3 ship)
  3. Add Phase 4.2 next phase kickoff reference (R8.2 co-maintainer 招募 per CONTEXT carry):
     ```markdown
     - **Phase 4.2：co-maintainer onboarding 文档 + GitHub Sponsors + stale-bot** — discuss-phase 启动 prep (R8.2-R8.5; T3 risk surface 外部依赖 phase per sister Phase 4.1 ship retrospective)
     ```
  4. **Recommended commit msg**:
     ```
     docs(phase-4.1-w2): T2.3 — ROADMAP.md Phase 4.1 ✅ SHIPPED + v0.4.0 milestone 1/3 PROGRESS marker (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister v0.3.0 close cadence延袭)

     L210-212 Phase 4.1 entry mark ✅ SHIPPED 2026-05-18 + brief outcome
     summary (4 D-decisions activated 闭环 + 4 sneak blocks守门 + R8.1
     acceptance "原始数据公开任何人可复现" satisfied + W0 backlog 3 项一次
     根治). v0.4.0 milestone progress 0/3 → 1/3 SHIPPED (sister L130 v0.3.0
     progress pattern延袭). Phase 4.2 next phase discuss-phase 启动 prep
     reference added.

     NO `SHIPPED ARCHIVED` marker (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0
     reserved for milestone close = Phase 4.3 ship per sister cadence延袭).
     Sister Phase 3.4 W2 T2.4 1:1 replicate with content swap.
     ```
- **acceptance_criteria**:
  - `grep -q "Phase 4.1.*✅ SHIPPED\\|Phase 4.1.*SHIPPED.*2026-05-18" .planning/ROADMAP.md` exit 0
  - `grep -q "v0.4.0.*1/3\\|v0.4.0 1/3 SHIPPED" .planning/ROADMAP.md` exit 0
  - `! grep -q "v0.4.0.*SHIPPED ARCHIVED" .planning/ROADMAP.md` exit 0 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)
  - `grep -q "Phase 4.2" .planning/ROADMAP.md` exit 0 (next phase reference)
- **decision_source**: sister Phase 3.4 W2 T2.4 ROADMAP.md 续编 pattern + sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭 + PATTERNS § 1 row 11 (98% reuse)

---

### T2.4 — README.md L9 Status freshness + v0.4.0 1/3 marker + Phase 4.1 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭; FRONT_MATTER_DOCS transparency gate)

- **files_modified**:
  - `README.md` (MODIFY L9 Status freshness header update Phase 4.1 SHIPPED + v0.4.0 1/3 + L44 area MILESTONE row v0.4.0 0/3 → 1/3 + add Phase 4.1 entry to shipped phase list)
- **read_first**:
  - `README.md` L1-60 (verify L9 Status header + L44 MILESTONE row pattern post-Phase 3.4 ship; sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path)
- **action**:
  1. Update L9 Status freshness header to reflect Phase 4.1 SHIPPED + v0.4.0 1/3 (sister Phase 3.4 W2 STATUS_MARKER path pattern):
     ```markdown
     > Status: Phase 4.1 SHIPPED ✅ (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 (R8.1 anchor); v0.4.0 milestone 1/3 PROGRESS (next: Phase 4.2 co-maintainer onboarding)
     ```
  2. Update L44 area MILESTONE row v0.4.0 progress 0/3 → 1/3 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 literal cadence延袭)
  3. Add Phase 4.1 entry to shipped phase list (sister Phase 3.4 + 3.3 + 3.2 + 3.1 row pattern延袭):
     ```markdown
     - **Phase 4.1 shipped** ✅ (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 (R8.1 anchor; docs/benchmarks/v0.4.md NEW 30-task FULL D-02 + docs/benchmarks/v0.4-upgrade-e2e.log NEW D-03 TEXT LOG + docs/CONTRIBUTING-BENCHMARK.md NEW D-04 MANUAL + W0 backlog 3 项一次根治)
     ```
  4. **Recommended commit msg**:
     ```
     docs(phase-4.1-w2): T2.4 — README.md L9 Status freshness Phase 4.1 SHIPPED + v0.4.0 1/3 + Phase 4.1 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭)

     L9 Status header update + L44 area MILESTONE row v0.4.0 0/3 → 1/3 (NOT
     yet 3/3 ARCHIVED reserved Phase 4.3 close) + shipped phase list append
     Phase 4.1 entry (sister Phase 3.4+3.3+3.2+3.1 row pattern延袭).
     Freshness gate node scripts/check-transparency-verdicts.mjs exit 0 post-
     MODIFY (STATE_POSITION_RE OR-fallback matches Phase 4.1 SHIPPED literal).
     Sister Phase 3.4 W2 T2.5 1:1 replicate.
     ```
- **acceptance_criteria**:
  - `grep -q "Phase 4.1" README.md` exit 0
  - `grep -q "v0.4.0.*1/3\\|v0.4.0 1/3" README.md` exit 0
  - `! grep -q "v0.4.0.*SHIPPED ARCHIVED" README.md` exit 0 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (freshness gate post-MODIFY pass — STATE_POSITION_RE OR-fallback for Phase 4.1 SHIPPED literal)
- **decision_source**: sister Phase 3.4 W2 T2.5 STATUS_MARKER path + 5-recurrence terminus D-04 COLLAPSE pattern延袭 + PATTERNS § 1 row 12 (98% reuse)

---

### T2.5 — PROJECT-SPEC.md L3 Status header add Phase 4.1 SHIPPED literal (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)

- **files_modified**:
  - `PROJECT-SPEC.md` (MODIFY L3 Status header add Phase 4.1 SHIPPED literal sister Phase 3.4 W2 T2.6 pattern)
- **read_first**:
  - `PROJECT-SPEC.md` L1-15 (verify L3 Status header structure post-Phase 3.4 ship)
- **action**:
  1. Add Phase 4.1 SHIPPED literal to L3 Status header (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern):
     ```markdown
     > Status: Phase 4.1 SHIPPED ✅ (2026-05-18 — dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor); previous: Phase 3.4 SHIPPED ✅ (2026-05-17 — routing 命中率 ≥ 85% 验收 + token budget doctor 8th check + v0.3.0 milestone close)
     ```
  2. **Recommended commit msg**:
     ```
     docs(phase-4.1-w2): T2.5 — PROJECT-SPEC.md L3 Status header Phase 4.1 SHIPPED literal (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)

     L3 Status header add Phase 4.1 SHIPPED literal (preserve previous: Phase
     3.4 SHIPPED for context). Freshness gate node scripts/check-transparency
     -verdicts.mjs exit 0 post-MODIFY (FRONT_MATTER_DOCS transparency gate
     pass). Sister Phase 3.4 W2 T2.6 1:1 replicate.
     ```
- **acceptance_criteria**:
  - `grep -q "Phase 4.1" PROJECT-SPEC.md` exit 0
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (FRONT_MATTER_DOCS transparency gate pass)
- **decision_source**: sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭 + PATTERNS § 1 row 13 (98% reuse)

---

### T2.6 — .planning/phase-4.1/DOGFOOD-T2.X.md NEW ~30-60L PASS 3/3 axes (sister Phase 3.3 DOGFOOD-T2.8.md + Phase 3.4 DOGFOOD-T2.X.md 55L format 100% reuse; 3-axis empirical evidence)

- **files_modified**:
  - `.planning/phase-4.1/DOGFOOD-T2.X.md` (NEW ~50L per RESEARCH § 13.1 W2.T2.X + sister Phase 3.3 DOGFOOD-T2.8.md + Phase 3.4 DOGFOOD-T2.X.md 55L format 100% reuse)
- **read_first**:
  - `.planning/phase-3.4/DOGFOOD-T2.X.md` entire (sister 3-axis DOGFOOD format model + PASS verdict shape)
  - `.planning/phase-3.3/DOGFOOD-T2.8.md` entire (sister Phase 3.3 DOGFOOD format reference)
  - `docs/benchmarks/v0.4.md` post-T1.1 (Axis A verify source)
  - `docs/benchmarks/v0.4-upgrade-e2e.log` post-T1.4 (Axis B verify source)
  - `scripts/check-state-archive-stale.mjs` post-T0.2 + `.planning/RETROSPECTIVE.md` post-T0.1 (Axis C verify source)
- **action**:
  1. Create NEW file `.planning/phase-4.1/DOGFOOD-T2.X.md` ~50L 3-axis empirical evidence per sister Phase 3.4 DOGFOOD-T2.X.md 55L format 100% reuse:
     ```markdown
     # Phase 4.1 T2.6 — Dogfood Report (3-axis empirical evidence: docs/benchmarks/v0.4.md FULL D-02 + docs/benchmarks/v0.4-upgrade-e2e.log 4-section D-03 + W0.1 D3 ENFORCE + W0.3 D2 cadence iter 2 institutionalize verify)

     **Date**: 2026-05-18
     **Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

     ---

     ## Axis A — `docs/benchmarks/v0.4.md` NEW 30-task FULL per-task disclosure (D-01 REUSE + D-02 FULL)

     **Setup**: docs/benchmarks/v0.4.md NEW ~350L W1 T1.1 inaugurates `docs/benchmarks/` NEW surface (was empty .gitkeep only); D-01 LOCKED REUSE `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL single SoT (NO new mining sneak block); D-02 LOCKED FULL per-task 5-element schema (raw_prompt verbatim + routing_decision rule_id+tier+skill + actual_command_executed + manual_review_verdict + recovery_path).
     **Action**: `wc -l docs/benchmarks/v0.4.md` + `grep -c "^### T[0-9][0-9]" docs/benchmarks/v0.4.md` + `grep -c "Raw prompt\\|Routing decision\\|Manual review verdict" docs/benchmarks/v0.4.md`.
     **Acceptance**: `wc -l docs/benchmarks/v0.4.md` ≤ 400 (planner Discretion #1 hard cap LOCK; R-01 mitigation) + 30 task sections + 30 × 5-field schema verified; cross-link SAMPLES.md ≥ 2 occurrences (D-01 single SoT sneak block守门).
     **Status**: ✅ PASS (covered by W1 T1.1 manual review + T1.6 integrity verify)

     ## Axis B — `docs/benchmarks/v0.4-upgrade-e2e.log` NEW 4-section text log (D-03 TEXT LOG zero-dep + planner Discretion #5 ctx7 + gstack install_method 多样性)

     **Setup**: docs/benchmarks/v0.4-upgrade-e2e.log NEW ~140L W1 T1.4 D-03 LOCKED zero-dep plain text 4-section log (sister Karpathy precedent NO asciinema npm dep + NO mp4/gif/png > 100KB sneak block); planner Discretion #5 picks ctx7 (npm-cli install_method) + gstack (git-clone-with-setup install_method) install_method 多样性 covering main install method spectrum.
     **Action**: `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` + `file docs/benchmarks/v0.4-upgrade-e2e.log` + `wc -c docs/benchmarks/v0.4-upgrade-e2e.log` + `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` + `grep -c "asciinema" package.json`.
     **Acceptance**: `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` ≤ 150 (Karpathy hard) + `file` returns 'ASCII text' (no binary D-03 sneak block) + `wc -c` < 102400 (< 100KB D-03 sneak block) + ≥ 4 `=== § N ` section headers per manifest (4-section per D-03) + `grep -c asciinema package.json` = 0 (no npm dep D-03 sneak block).
     **Status**: ✅ PASS (covered by W1 T1.3 + T1.4 manual review + T1.6 integrity verify)

     ## Axis C — W0.1 D3 ENFORCE flip + W0.3 D2 cadence iter 2 institutionalize verify (DEFERRED #AF + #AG resolve + sister M2 backlog discharge)

     **Setup**: W0 backlog 3 项一次根治 STRICT path dep W0.3 → W0.1 → W0.5: T0.1 W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md (sister M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) + T0.2 W0.1 D3 ENFORCE flip `const ENFORCE = false` → `const ENFORCE = true` (DEFERRED #AF RESOLVED; sister Phase 2.1 → 2.2 1-phase cadence延袭) + T0.3 W0.5 CONDITIONAL D1 SIZE_LIMIT 200→150 flip OR DEFER #BA carry per § 7.1 decision tree.
     **Action**: `node scripts/check-state-archive-stale.mjs` (must exit 0 with ENFORCE=true post-flip) + `grep -q "ARCHIVED FROM STATE — Phase 3.3" .planning/RETROSPECTIVE.md` + `wc -l .planning/STATE.md` + `grep -q "const ENFORCE = true" scripts/check-state-archive-stale.mjs`.
     **Acceptance**: `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (PASS 3 rules: STATE ≤200L OR ≤150L W0.5 flip path + 0 关键决议 ship 总结 sections + 0 W-N errata literals) + RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 3.3+3.4 section present (W0.3 D2 cadence 2nd-iter institutionalize verify M2 backlog discharge) + ENFORCE=true literal verified.
     **Status**: ✅ PASS (W0.1 ENFORCE flip + W0.3 archive section verified post-T0.1 + T0.2 + T0.3; DEFERRED #AF RESOLVED + #AG resolve FLIP path OR carry #BA Phase 4.2 W0 DEFER path)

     ---

     ## Aggregate verification

     - **R8.1 acceptance "原始数据公开任何人可复现"**: ✅ Axis A (docs/benchmarks/v0.4.md NEW 30-task FULL D-02 + cross-link SAMPLES.md + 反"美化"声明 footer anchored ROADMAP L222) + Axis B (docs/benchmarks/v0.4-upgrade-e2e.log NEW 4-section TEXT LOG D-03 zero-dep cross-OS portable grep-able)
     - **D-04 MANUAL re-run cadence (R9.4 上游升级 cadence)**: ✅ docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L W1 T1.5 manual re-run instructions (planner Discretion #4 separate NEW file LOCK; sister Phase 3.4 D-02 install path 安静 一致 NO新 CI 表面)
     - **W0.1 D3 gate ENFORCE flip cadence**: ✅ Axis C (DEFERRED #AF RESOLVED; sister Phase 2.1 → 2.2 1-phase cadence延袭 verified Phase 3.4 → Phase 4.1)
     - **W0.3 D2 cadence iter 2 M2 backlog discharge institutionalize**: ✅ Axis C (RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 3.3+3.4 section + W0.1 ENFORCE=true gate post-archive ALL pass — pattern stable 2nd-iter beyond 1st-implementation)

     ---

     ## Disposition

     - ✅ T2.6 dogfood PASS 3/3 axes verified
     - ✅ R8.1 + R9.2 + R9.4 acceptance criteria 全 verified (3 REQ-ID confirmed)
     - ✅ Phase 4.1 ship-readiness 4 D-decisions 全 activated 闭环 (D-01 REUSE Phase 3.4 SAMPLES.md / D-02 FULL per-task disclosure / D-03 TEXT LOG zero-dep / D-04 MANUAL on-demand)
     - ✅ DEFERRED #AF ✅ RESOLVED Phase 4.1 W0 (T0.2 W0.1)
     - ✅ DEFERRED #AG ✅ partially RESOLVED Phase 4.1 W0 (T0.3 W0.5 conditional FLIP / OR DEFER #BA carry Phase 4.2 W0)
     - ✅ W0 backlog 3 项一次根治 + W0.3 D2 cadence iter 2 M2 backlog discharge institutionalize verify pattern stable
     - ✅ v0.4.0 milestone 1/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)

     **Note**: Phase 4.1 = v0.4.0 milestone 1st phase = R8.1 anchor only; R8.2-R8.5 (co-maintainer 招募 + stale-bot + ADR 全集 + GitHub Sponsors) → Phase 4.2 + Phase 4.3 explicit out-of-scope per CONTEXT Deferred Ideas; v1.0-RC 收尾 → Phase 4.3 per ROADMAP v0.4.0 必含 6 项 carry. Single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push).

     ---

     *Phase 4.1 W2 T2.6 — dogfood report*
     *Run: 2026-05-18*
     ```
  2. Karpathy hard limit verify: `wc -l .planning/phase-4.1/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 3.4 DOGFOOD-T2.X.md 55L precedent)
  3. **Recommended commit msg**:
     ```
     docs(phase-4.1-w2): T2.6 — DOGFOOD-T2.X.md NEW ~50L PASS 3/3 axes verified miss: none (sister Phase 3.3 DOGFOOD-T2.8.md + Phase 3.4 DOGFOOD-T2.X.md 55L format 100% reuse)

     3-axis empirical evidence per sister DOGFOOD pattern延袭:
     - Axis A docs/benchmarks/v0.4.md NEW 30-task FULL D-02 + ≤400L hard cap
       verify + cross-link SAMPLES.md ≥ 2 occurrences (D-01 single SoT)
     - Axis B docs/benchmarks/v0.4-upgrade-e2e.log NEW 4-section D-03 TEXT LOG
       zero-dep + binary safety < 100KB + ASCII text + 4 sections per manifest
       + no asciinema npm dep (D-03 sneak block 守门)
     - Axis C W0.1 D3 ENFORCE flip ENFORCE=true post-flip + W0.3 D2 cadence
       iter 2 RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 3.3+3.4 section
       (DEFERRED #AF RESOLVED + sister M2 backlog discharge institutionalize
       verify 2nd-iter beyond 1st-implementation pattern stable)

     Aggregate verification: R8.1 + R9.2 + R9.4 satisfied + 4 D-decisions
     activated 闭环 + DEFERRED #AF + #AG resolve. v0.4.0 milestone 1/3 PROGRESS
     (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister v0.3.0 close
     cadence延袭).
     ```
- **acceptance_criteria**:
  - `test -f .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0
  - `wc -l .planning/phase-4.1/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 3.4 DOGFOOD precedent)
  - `grep -q "PASS" .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0
  - `grep -q "Axis A\\|docs/benchmarks/v0.4.md" .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0 (Axis A benchmark)
  - `grep -q "Axis B\\|docs/benchmarks/v0.4-upgrade-e2e.log\\|4-section" .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0 (Axis B e2e log)
  - `grep -q "Axis C\\|ENFORCE\\|ARCHIVED FROM STATE" .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0 (Axis C W0.1 + W0.3 institutionalize)
  - `grep -q "DEFERRED #AF\\|#AG" .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0 (DEFERRED resolve evidence)
- **decision_source**: sister Phase 3.3 DOGFOOD-T2.8.md + Phase 3.4 DOGFOOD-T2.X.md 55L format 100% reuse + RESEARCH § 13.1 W2.T2.X 3-axis empirical evidence + PATTERNS § 1 row 14 (85% reuse)

---

### T2.7 — Single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls; sister Phase 3.4 W2 T2.12 triple-tag pattern subset — Phase 4.1 NOT milestone close = 1 tag only per PATTERNS § 5 latent risk #3 mitigation)

- **files_modified**: git tags (no file change; single tag creation LOCAL only; NO push pending user explicit request)
- **read_first**: 无
- **action**:
  1. **PRE-TAG VERIFY GATES** (all must pass before tag creation):
     - All preceding W2 tasks T2.1-T2.6 complete
     - Full test suite green: `pnpm test 2>&1 | tail -5 | grep -E "Tests.*passed|0 failed"` exit 0
     - DOGFOOD-T2.X.md PASS 3/3 axes verified per T2.6
     - Freshness gate post-W2: `node scripts/check-transparency-verdicts.mjs` exit 0
     - W0.1 ENFORCE=true gate post-W2: `node scripts/check-state-archive-stale.mjs` exit 0
     - All Karpathy hard caps verified: v0.4.md ≤400L + v0.4-upgrade-e2e.log ≤150L + CONTRIBUTING-BENCHMARK.md ≤30L + DOGFOOD-T2.X.md ≤60L + STATE.md ≤150L (W0.5 flip) OR ≤200L (W0.5 defer)
  2. **Tag baseline single tag LOCAL CREATE only** (sister Phase 3.4 W2 T2.12 triple-tag pattern subset — Phase 4.1 NOT milestone close + NO ADR 0018 baseline + NO 🎯 v0.4.0 milestone close per PATTERNS § 5 latent risk #3 mitigation single baseline tag only):
     ```bash
     git tag -a v0.4.0-alpha.1-benchmark -m "Phase 4.1 SHIPPED (dogfooding benchmark 数据采集 + 公开格式定义 — R8.1 anchor; docs/benchmarks/v0.4.md NEW 30-task FULL D-02 + docs/benchmarks/v0.4-upgrade-e2e.log NEW D-03 TEXT LOG + docs/CONTRIBUTING-BENCHMARK.md NEW D-04 MANUAL + W0 backlog 3 项一次根治 W0.1 ENFORCE flip DEFERRED #AF RESOLVED + W0.3 D2 cadence iter 2 institutionalize verify M2 backlog discharge); v0.4.0 milestone 1/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭)"
     ```
  3. **DO NOT PUSH WITHOUT USER EXPLICIT APPROVAL** per CLAUDE.md commit safety protocol (NEVER push without user explicit request; user controls all commit + tag push):
     - Wait for user explicit `git push origin v0.4.0-alpha.1-benchmark` request OR `git push origin --tags` request
     - Warn user if force-push requested on tags pointing to main
     - Sister H1 lesson learned (Phase 3.4 ship sister review): narrative-vs-state mismatch root cause = T2.12 commit was made BEFORE user PP approval, so commit-time narrative said "LOCAL pending"; push happened immediately AFTER per user choice — narrative not auto-updated by subsequent push; **Anti-pattern note**: post-push narrative sync mandatory if push happens
  4. **NO triple tag** (Phase 4.1 NOT milestone close): NO `adr-0018-accepted` (no NEW ADR Phase 4.1 per CONTEXT scope = dogfood publish NOT architectural decision) + NO `🎯 v0.4.0` milestone close tag (reserved Phase 4.3 close per sister v0.3.0 close cadence延袭 — 3 alpha tags + final milestone tag triple-push)
  5. **Recommended commit msg** (NO commit needed — tag annotation only):
     ```
     (NO commit — single tag annotation only via `git tag -a v0.4.0-alpha.1-benchmark -m "..."` LOCAL; NO push per CLAUDE.md commit safety)
     ```
  6. **Update Resolved (T2.7)** block at task_plan.md top with outcome (PENDING → 实占 values: `git tag --list 'v0.4.0-alpha.1-benchmark' | wc -l` == 1 + `git ls-remote origin refs/tags/v0.4.0-alpha.1-benchmark` empty pre-user-push)
- **acceptance_criteria**:
  - `git tag --list 'v0.4.0-alpha.1-benchmark' | wc -l` == 1 (single baseline tag LOCAL created)
  - `! git tag --list 'adr-0018-accepted'` exit 0 OR `git tag --list 'adr-0018-accepted' | wc -l` == 0 (NO NEW ADR Phase 4.1 — verify no adr-0018-accepted tag)
  - `! git tag --list '🎯 v0.4.0\\|v0.4.0$'` exit 0 OR equivalent (NO 🎯 v0.4.0 milestone close tag — reserved Phase 4.3)
  - `git ls-remote origin refs/tags/v0.4.0-alpha.1-benchmark` returns empty (NO push verify — user controls)
  - `pnpm test 2>&1 | tail -5 | grep -E "Tests.*passed|0 failed"` exit 0 (full suite green pre-tag)
- **decision_source**: sister Phase 3.4 W2 T2.12 baseline + milestone tag pattern subset (Phase 4.1 NOT milestone close = single baseline tag only per CONTEXT L70 explicit) + sister v0.3.0 close triple push pattern reserved Phase 4.3 close + CLAUDE.md commit safety protocol NEVER push without user explicit request + PATTERNS § 5 latent risk #3 mitigation single baseline tag only (NO triple tag sneak)

---

## Wave 2 done

All 7 atomic tasks complete. Plan Phase 4.1 W2 ship-criteria all satisfied per PLAN.md Wave 2 success_criteria block.

**Phase 4.1 SHIPPED 完成**: R8.1 dogfooding benchmark 公开 anchor (docs/benchmarks/v0.4.md NEW 30-task FULL D-02 + docs/benchmarks/v0.4-upgrade-e2e.log NEW D-03 TEXT LOG + docs/CONTRIBUTING-BENCHMARK.md NEW D-04 MANUAL) + W0 backlog 3 项一次根治 (W0.1 D3 ENFORCE flip DEFERRED #AF RESOLVED + W0.3 D2 cadence iter 2 institutionalize verify M2 backlog discharge + W0.5 conditional D1 SIZE_LIMIT round 2 tighten DEFERRED #AG resolve FLIP / DEFER) + 4 D-decisions activated 闭环 + 5-doc 续编 (STATE + RETROSPECTIVE + ROADMAP + README + PROJECT-SPEC) + DOGFOOD PASS 3/3 axes + single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE (NO push per CLAUDE.md commit safety; user controls).

**v0.4.0 milestone PROGRESS**: 0/3 → 1/3 SHIPPED (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭).

**Next**: Phase 4.2 discuss-phase 启动 prep (R8.2 co-maintainer onboarding + R8.3 stale-bot + R8.4 公开 ADR 全集 + R8.5 GitHub Sponsors; T3 risk surface真正 fires Phase 4.2 外部依赖 — v0.4.0 节奏 evaluate explicit 调整期望 per sister Phase 4.1 ship retrospective).

> **DEFERRED carry items**:
> - **DEFERRED #AH** (Phase 3.4 own carry — STILL Phase 4.0+ unchanged): W0.4 path traversal regex hardening → Phase 4.0 W0 (conditional on real attack surface arrival; currently sole consumer = project maintainer per spike outcome 2026-05-17)
> - **DEFERRED #BA** (Phase 4.1 own carry — IF W0.5 DEFER path active): D1 SIZE_LIMIT round 2 tighten 200→150 carry-forward Phase 4.2 W0 LOW priority defensive (post-W0.3 STATE 141-150L exceeded threshold per § 7.1 decision tree)
> - **DEFERRED #BB** (Phase 4.1 own carry — sister T-tier T3 carry): T3 1 phase/day cadence assessment — Phase 4.2 co-maintainer 招募 EXTERNAL DEPENDENCY phase (T3 risk surface 真正 fires Phase 4.2; v0.4.0 节奏 evaluate explicit 调整期望)
> - **DEFERRED #BC** (Phase 4.1 own carry — v0.5+ benchmark expand evaluation): IF Phase 4.1 dogfood reveals miss case NOT covered by current 30 SAMPLES.md → re-evaluate D-01 REJECT EXPAND new mining; currently 30/30 100% routing PASS no signal
> - **DEFERRED #AF** ✅ RESOLVED Phase 4.1 W0 (T0.2 W0.1 — D3 gate ENFORCE flip warn-only round 1 → ENFORCE round 2)
> - **DEFERRED #AG** ✅ partially RESOLVED Phase 4.1 W0 (T0.3 W0.5 CONDITIONAL — IF STATE ≤140L flip / OTHERWISE #BA carry-forward)
