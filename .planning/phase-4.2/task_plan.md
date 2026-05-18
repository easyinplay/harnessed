# Phase 4.2 — task_plan.md

> **Authored**: 2026-05-18
> **Author**: gsd-planner (Wave B)
> **Sources**: CONTEXT.md D-01~D-04 + W0 backlog 1 项 conditional (#BA) + 4 项 carry/defer + KICKOFF § 1-6 + PATTERNS § 1-5 (13 analog targets ~78% weighted reuse) + RESEARCH § 1-22 (HIGH confidence 15/18 sections; MEDIUM § 12 STRIDE narrow + § 14 single-day plausibility + § 16 task count) + sister phase-4.1/task_plan.md 1116L 14-atomic structure 100% template reuse + sister Phase 4.1 PLAN.md 519L frontmatter 100% template reuse (adapted Phase 4.2 community-infra-publish scope)
> **Style**: 沿袭 phase-4.1/task_plan.md per-task structure (files_modified / read_first / action concrete values / acceptance_criteria grep-verifiable / decision_source + Karpathy why-not-what commit msg)
> **Task count**: 12 atomic tasks across 3 waves — W0 2 (T0.1 W0.1 D2 cadence iter 3 FIRST per path dep + T0.2 W0.2 conditional D1 SIZE_LIMIT 200→150 flip OR DEFER) + W1 4 (T1.1 MAINTAINER-ONBOARDING EXPAND + T1.2 stale.yml NEW + T1.3 ISSUE_TEMPLATE 4-file batch + T1.4 FUNDING.yml + README badge+footer combined) + W2 5+1+1 = 7 (T2.1 STATE 续编 combined W0.1 archive baseline + T2.2 RETROSPECTIVE 7-section + T2.3 ROADMAP ✅ SHIPPED + T2.4 README L9+L48+badge+footer combined + T2.5 PROJECT-SPEC L3 + T2.6 ci.yml VERIFY 0 diff sneak-block verify-only NO commit + T2.7 DOGFOOD NEW + single baseline tag LOCAL); sister Phase 4.1 14 atomic ~85-100% scope factor per community-infra-publish phase
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06 / B-26 / source; docs artifact ≤150L per CLAUDE.md docs convention — MAINTAINER-ONBOARDING strict)

> ⚠️ **D-decision 守门** (4 decisions LOCKED, executor 防 sneak-in per PATTERNS § 3):
> - **D-01 EXPAND existing 50L stub → 100-150L production-ready** locked → SPLIT into multiple files + CHECKLIST-only format + FULL REWRITE 不可 sneak-in (CONTEXT L10-17 evaluated rejected); planner / executor MUST preserve existing 6+2 sections verbatim (additive expand NOT full rewrite) + cap ≤150L hard per CLAUDE.md docs convention; if breach drop section F FIRST (Upstream Drift Monitoring lowest acceptance value per § 2.2 mitigation hierarchy)
> - **D-02 StaleBotPolicy 90-day default + issue+PR** locked → 60-day stricter + 120-day lenient + issue-only 不可 sneak-in (CONTEXT L19-24 evaluated rejected); planner / executor MUST pin `actions/stale@v10` (NOT @v9 outdated per R2 § 2 finding correction; NOT @main floating risk) + 60+30 split semantic (mark stale day 60 + close day 90 per R8.3 spec verbatim) + BOTH issue + PR scope + exempt-issue-labels defensive list + operations-per-run 30 rate limit
> - **D-03 SponsorsTier Single tier $1+ minimal Karpathy YAGNI** locked → multi-tier 3-level ($5/$25/$100) + link-only no-tier + custom: array URL 不可 sneak-in (CONTEXT L26-30 evaluated rejected); planner / executor MUST use `github: easyinplay` single-line config per [CITED: docs.github.com/sponsors] minimum example + NO `patreon:` / `open_collective:` / `ko_fi:` / `custom:` keys; user manual prereq Sponsors account activation acknowledged (FALLBACK ship config forward-compatible per RESEARCH § 17.2 U1)
> - **D-04 CadenceExpect HYBRID 2-week internal + 6-month organic external** locked → FROZEN 6-month + ACCELERATED 2-week external PR 不可 sneak-in (CONTEXT L32-37 evaluated rejected); planner / executor MUST document BOTH clocks separately (T3 transparency) — STATE.md L23 + RETROSPECTIVE.md § Cost patterns both literal phrases "Internal infra ship clock" + "External co-maintainer organic clock" per RESEARCH § 7.3 R-3 mitigation; verification at process-level NOT artifact-level

> ⚠️ **Karpathy hard limit per file 守门** (B-06 + B-26 + sister 7-phase 连续 hold): every code-producing task 含 `wc -l ≤ N` acceptance criterion; **docs artifact ≤150L hard** (`docs/MAINTAINER-ONBOARDING.md` per CLAUDE.md docs convention D-01 strict); `.github/FUNDING.yml` ≤8L hard per D-03 Karpathy YAGNI; `.github/workflows/stale.yml` ≤60L hard per D-02 Karpathy YAGNI; `.github/ISSUE_TEMPLATE/*.yml` ≤80L per file hard per § 6.6 sneak block; `.planning/phase-4.2/DOGFOOD-T2.X.md` ≤60L hard sister Phase 4.1 DOGFOOD 58L precedent; `README.md` ≤200L hard sister 6-phase 连续 hold (mitigation condense footer IF breach).

> ⚠️ **Biome lint preempt before commit MANDATORY** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 — 5-recurrence terminus续延): 任何 TS/JS/MJS commit 前必跑 `pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费. Phase 4.2 touch surface = W0.2 CONDITIONAL `scripts/check-state-archive-stale.mjs` `.mjs` 1-line flip IF FLIP path (biome preempt mandatory IF flip) + W1 + W2 all `.yml` / `.md` (biome NOT scope for non-TS/JS).

---

## Resolved Blocks (executor fill in-place, sister Phase 4.1 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / split decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.1 W0.1 D2 cadence iter 3 trim outcome, PENDING)**: STATE.md 151L → ~?L (-12-18L expected per § 8.3 projection; Phase 4.1 narrative trim scope — single-phase due to Phase 4.0 absence); RETROSPECTIVE.md → +15-20L (verbatim relocation including R-4 disambiguation footer); `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (Phase 4.1 W0.1 already shipped; verify post-archive Rule 1 + Rule 2 + Rule 3 all PASS); HTML-comment archive marker pointer inserted per sister L27 format (R-4 cadence consistency mitigation — section header literal preserves "Phase 4.0+4.1"). **W0.2 implication**: IF post-trim STATE ≤140L → FLIP path active T0.2 / IF 141-150L → DEFER path active T0.2 #BA carry-forward Phase 4.3 W0 / IF >150L → BLOCKED + investigate W0.1 trim sufficiency.

> **Resolved (T0.2 W0.2 CONDITIONAL D1 SIZE_LIMIT outcome, PENDING)**: Decision tree per § 8.2 — execute branch based on actual T0.1 outcome. IF FLIP PATH (post-W0.1 STATE ≤140L): `scripts/check-state-archive-stale.mjs` L12 `SIZE_LIMIT = 200` → `SIZE_LIMIT = 150` 1-line surgical (54L unchanged); `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=150 (PASS Rule 1 with post-W0.1 STATE ≤140L pre-verified + W2 T2.1 续编 +5-10L delta keeps ≤150 final); biome preempt PASS `.mjs` scope mandatory; DEFERRED #BA RESOLVED. IF DEFER PATH (post-W0.1 STATE 141-150L): skip L12 edit + register DEFERRED #BA carry-forward Phase 4.3 W0 LOW priority (sister Phase 4.1 W0.5 DEFER path precedent).

> **Resolved (T1.1 docs/MAINTAINER-ONBOARDING.md EXPAND outcome, PENDING)**: `wc -l docs/MAINTAINER-ONBOARDING.md` ≥100 ≤150 (D-01 hard cap per CLAUDE.md docs convention; estimate ~125-145L per § 2.2); preserve 6+2 sections + ADD 6 NEW sections A-F; cross-link `CONTRIBUTING.md` ≥ 3 occurrences (D-01 sneak block #3 Karpathy DRY reference NOT duplicate); biome NOT needed (`.md` extension); IF post-write breach 150L → apply § 2.2 mitigation hierarchy (drop section F Upstream Drift FIRST save ~12L; OR drop section E Manifest Schema SOP save ~10L; keep A+B+C+D essential R8.2 verbs).

> **Resolved (T1.2 stale.yml NEW outcome, PENDING)**: `wc -l .github/workflows/stale.yml` ≤ 60 (Karpathy YAGNI hard); `actions/stale@v10` pinned per R2 § 2 finding correction (NOT @v9); 60+30 split semantic 4 directives (issue-stale + issue-close + pr-stale + pr-close); `yq eval` YAML parse PASS local pre-commit verify; biome NOT needed (`.yml` extension out of biome scope).

> **Resolved (T1.3 ISSUE_TEMPLATE batch outcome, PENDING)**: 4 NEW yml files (01-bug.yml + 02-feature.yml + 03-question.yml + config.yml); per-file `wc -l` ≤ 80 (§ 6.6 sneak block #3); `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` == 4; `grep 'blank_issues_enabled: false' config.yml` exit 0; `yq eval` YAML parse PASS per file; biome NOT needed.

> **Resolved (T1.4 FUNDING.yml + README badge+footer combined outcome, PENDING)**: `wc -l .github/FUNDING.yml` ≤ 8 (Karpathy YAGNI hard); `grep '^github: easyinplay' .github/FUNDING.yml` exit 0; README L8 Sponsors badge insertion + L190-192 footer EXPAND ~3L → ~7L; README total ≤200L hard (estimate 196 → 200-201L approaches cap; mitigation condense footer 7L → 6L IF breach); biome NOT needed; user manual prereq Sponsors account activation external (FALLBACK ship config forward-compatible per RESEARCH § 17.2 U1 — DOGFOOD Axis C verifies infra NOT button render).

---

## Deferred Items (Phase 4.2 carry-forward, register at ship via deferred-items.md)

> **DEFERRED #AH** (Phase 3.4 own carry, sister inheritance — STILL Phase 4.0+ unchanged): W0.4 path traversal regex hardening → Phase 4.0+ W0 (conditional on real attack surface arrival; currently sole consumer = project maintainer per spike outcome 2026-05-17)
> **DEFERRED #BA** ⚠️ CONDITIONAL Phase 4.2 W0 T0.2 — FLIP PATH RESOLVED 2026-05-18 (post-W0.1 STATE ≤140L verify) OR DEFER PATH carry-forward Phase 4.3 W0 LOW priority defensive (per § 8.2 decision tree)
> **DEFERRED #BB** ✅ pre-RESOLVED Phase 4.2 discuss-phase (HYBRID 2-clock LOCKED D-04; sister T3 external dependency cadence assessment institutionalized for v0.5+ external-dependency phases)
> **DEFERRED #BC** (Phase 4.1 own carry — v0.5+ benchmark expand evaluation, STILL): IF Phase 4.1 dogfood reveals miss case NOT covered by current 30 SAMPLES.md → re-evaluate D-01 REJECT; currently 30/30 100% routing PASS no signal — defer v0.5+
> **DEFERRED #BD** (Phase 4.1 own carry, iter 2 lesson, STILL): Regex-fix 2-pass validation pattern — phase ship sister review absorb cycles should require both literal regex scan AND semantic synonym scan to prevent iter-N residual surfacing
> **DEFERRED #BE** (Phase 4.2 own carry — Sponsors account activation external prereq, IF user NOT activated by Phase 4.2 ship): FUNDING.yml + badge ship forward-compatible per RESEARCH § 17.2 U1; Sponsor button render on repo page requires user manual Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state); DOGFOOD Axis C verifies infra NOT button render
> **DEFERRED #BF** (Phase 4.2 own carry — CODEOWNERS .github/** rule defer, sister review SR-6 preempt): STRIDE T1 (FUNDING.yml repo tamper) currently mitigated by branch protection only; CODEOWNERS adds explicit reviewer — defer v0.4.3+ if real attack surface arrives (sister #AH defer pattern延袭)

---

## Wave 0 — Backlog 2 项 absorb conditional (2 atomic tasks; STRICT path dep W0.1 → W0.2 per PATTERNS § 5 critical path)

### T0.1 — W0.1 D2 cadence iter 3 trim Phase 4.1 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (FIRST per path dep — reduces STATE.md size to create W0.2 SIZE_LIMIT flip headroom; sister Phase 4.1 W0 T0.1 1st-implementation → 2nd-iter institutionalize → Phase 4.2 3rd-iter terminus stable signal ≥3-iter)

- **files_modified**:
  - `.planning/STATE.md` (MODIFY ~-12-18L delta: trim Phase 4.1 entries from 已完成 phase ship 历史 L43 verbose 1-line entry + 当前位置 L22-26 long inline narrative condense + 关键决策记录 L116-122 area Phase 4.1 D-decision rows IF present → verbatim relocate; preserve recent Phase 4.1 + Phase 3.4 SHIPPED pointers; insert HTML-comment archive marker per sister L27 format with R-4 disambiguation; expected post-trim ~135-140L)
  - `.planning/RETROSPECTIVE.md` (APPEND ~+15-20L new section `## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0.1 D2 cadence iter 3, 2026-05-18)` containing verbatim relocated Phase 4.1 narrative + R-4 disambiguation footer note "Phase 4.0 was a numeric placeholder NOT a real shipped phase; Phase 4.1 narrative archived solo per single-phase iter 3 archive"; D2 ship-time T6.N cadence 3rd-iter per institutionalize verify terminus stable ≥3-iter pattern signal per sister 5-recurrence terminus heuristic — sister Phase 4.1 W0.3 2nd-iter precedent)
- **read_first**:
  - `.planning/STATE.md` entire file (by Read — verify 151L baseline + identify trim section line ranges: L22-26 当前位置 long inline + L43 已完成 phase ship 历史 Phase 4.1 entry verbose ~5-bullet + L116-122 关键决策记录 Phase 4.1 D-decision rows IF present; total ~12-18L trim scope)
  - `.planning/RETROSPECTIVE.md` tail 100 lines (by Read — verify existing `## § ARCHIVED FROM STATE — Phase 3.3+3.4` section format from Phase 4.1 W0.3 2nd-iter 2026-05-18 + sister cadence affirm L640 reference; new section follows same heading pattern + verbatim quoted content blockquote convention)
  - `.planning/phase-4.2/RESEARCH.md` § 8 (W0.1 D2 cadence iter 3 mechanical pattern + sister Phase 4.1 W0.3 verbatim + R-4 Phase 4.0 absence disambiguation — offset 705 limit 80)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 1 + § 2 (W0.1 mapping reuse ~92% + R-4 disambiguation explicit "section header literal preserved for cadence consistency, content reflects Phase 4.1 only")
- **action**:
  1. Read `.planning/STATE.md` to confirm baseline 151L (`wc -l .planning/STATE.md` expect 151) + identify trim sections by section header grep:
     - L43: 已完成 phase ship 历史 — Phase 4.1 SHIPPED ✅ verbose entry (currently 1 long ~5-bullet inline; replace with 1-line pointer: `- **Phase 4.1 shipped** ✅ (2026-05-18, archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1)`)
     - L22-26: 当前位置 long inline narratives condense to 1-line pointers (preserve `**Phase 3.4 SHIPPED**` + `**Phase 4.1 SHIPPED**` literal STATE_POSITION_RE anchors for D-04 COLLAPSE freshness gate)
     - L116-122: 关键决策记录 area — IF Phase 4.1 D-decision rows present, verbatim relocate (sister Phase 4.1 W0.3 cadence延袭 archived Phase 3.3+3.4 D-decisions; Phase 4.2 W0.1 archive Phase 4.1 D-decisions IF present)
  2. **W0.1 D2 cadence iter 3 ship-time T6.N cadence 3rd-IMPLEMENTATION (M2 backlog discharge institutionalize verify terminus stable signal ≥3-iter per sister 5-recurrence terminus heuristic; verifies pattern stable beyond 2nd-iter Phase 4.1 W0.3)**:
     - APPEND to `.planning/RETROSPECTIVE.md` new section header (heading-level 2 sister L8.3 format with R-4 disambiguation):
       ```markdown
       ## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0.1 D2 cadence iter 3, 2026-05-18)

       > **Note (R-4 cadence consistency mitigation)**: Section header literal preserves "Phase 4.0+4.1" per sister Phase 4.1 W0 T0.1 cadence affirm L640 "Next § ARCHIVED FROM STATE — Phase 4.0+4.1 will be created by Phase 4.2 ship-time per D2 standing process cadence iter 3" — header literal preserved for cadence consistency even though **Phase 4.0 was a numeric placeholder NOT a real shipped phase** (v0.3.0 closed Phase 3.4 → v0.4.0 opened Phase 4.1 directly per ROADMAP L185-220). Content body reflects Phase 4.1 single-phase archive (sister single-phase iter 3 archive per R-4 cadence consistency).

       ### Phase 4.1 SHIPPED narrative (archived from STATE.md `当前位置` + 已完成 phase ship 历史 2026-05-18)
       [verbatim content from STATE.md L22-26 inline narrative + L43 已完成 ship history row + L116-122 Phase 4.1 D-decision rows IF present]
       ```
     - LOC delta: +15-20L append to RETROSPECTIVE.md (≈ trimmed lines from STATE.md verbatim relocation; § 8 estimate)
     - Insert HTML-comment archive marker pointer at trimmed STATE.md sites per sister L27 verified format with R-4 disambiguation:
       ```markdown
       <!-- Phase 4.0 + 4.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (2026-05-18 Phase 4.2 W0.1 D2 cadence iter 3 per standing process — M2 backlog discharge institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal beyond 2nd-iter Phase 4.1 W0.3; Phase 4.0 was numeric placeholder NOT real shipped phase — Phase 4.1 single-phase archive per R-4 cadence consistency mitigation) -->
       ```
  3. Verify post-trim STATE.md line count + post-archive `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (Phase 4.1 W0.1 already shipped — verify 3 rules PASS: Rule 1 STATE ≤200L baseline + Rule 2 0 关键决议 ship 总结 sections + Rule 3 0 W-N errata literals)
  4. Run biome preempt: `pnpm exec biome check --write` (only .ts/.js/.mjs touched if any; STATE.md + RETROSPECTIVE.md are .md — biome NOT scope, but `pnpm exec biome check --write` harmless idempotent — run anyway per project memory 5-recurrence terminus续延 discipline mandatory before commit)
  5. **Recommended commit msg** (Karpathy why-not-what, sister Phase 4.1 W0 T0.1 commit msg pattern延袭):
     ```
     refactor(phase-4.2-w0): T0.1 — W0.1 D2 cadence iter 3 trim Phase 4.1 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (sister Phase 4.1 W0.3 2nd-iter → 3rd-iter terminus stable signal M2 backlog discharge institutionalize verify ≥3-iter)

     8-phase 连续 "deferred-items → next phase W0 一次根治" cadence 8th phase 沿袭
     (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2). D2 ship-time T6.N
     standing process fires 3rd-iter beyond Phase 4.1 W0.3 2nd-iter institutionalize
     (sister M2 backlog discharge verify pattern stable terminus signal ≥3-iter per
     sister 5-recurrence terminus heuristic).

     Phase 4.1 narrative verbatim relocated STATE.md → RETROSPECTIVE.md § ARCHIVED
     FROM STATE — Phase 4.0+4.1 section (~+15-20L append; sister L8.3 format pattern).
     STATE.md L43 已完成 ship history + L116-122 关键决策 + L22-26 当前位置 long
     inline condensed to 1-line pointers (~-12-18L delta; expected post-trim STATE.md
     ≈ 135-140L from 151L baseline).

     **R-4 cadence consistency mitigation**: Section header literal preserves
     "Phase 4.0+4.1" per sister Phase 4.1 W0 T0.1 cadence affirm L640 — even though
     Phase 4.0 was numeric placeholder NOT real shipped phase (v0.3.0 closed Phase
     3.4 → v0.4.0 opened Phase 4.1 directly). Content body footer note disambiguates
     Phase 4.0 absence + Phase 4.1 single-phase archive.

     HTML-comment archive marker pointer inserted per sister L27 format (reviewer
     grep verifies pointer present + RETROSPECTIVE additions = STATE deletions 1:1
     verbatim per sister § 8.5 sneak block enforcement). FIRST per path dep — creates
     SIZE_LIMIT=150 headroom for T0.2 W0.2 conditional flip decision tree.
     ```
  6. **Update Resolved (T0.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/STATE.md` post-trim + `wc -l .planning/RETROSPECTIVE.md` post-append + `node scripts/check-state-archive-stale.mjs` exit code with ENFORCE=true)
- **acceptance_criteria**:
  - **Target** `wc -l .planning/STATE.md` ≤ 140 (W0.1 trim outcome target — keeps W0.2 FLIP path active per T0.2 § 8.2 decision tree; expected ~135-140L)
  - **Ceiling** `wc -l .planning/STATE.md` ≤ 150 (acceptable upper bound; 141-150L triggers W0.2 DEFER path per T0.2 § 8.2 — STATE.md remains ≤200L bound, NOT forced ≤150L until W0.2 flip path active)
  - **Clarification**: T0.2 decides FLIP vs DEFER based on actual W0.1 trim outcome; T0.1 alone does NOT mandate ≤150L — T0.2 conditional decision tree is the authority
  - `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1" .planning/RETROSPECTIVE.md` exit 0 (W0.1 D2 cadence iter 3 archive section created)
  - `grep -q "Phase 4.2 W0.1 D2 cadence iter 3" .planning/RETROSPECTIVE.md` exit 0 (section header attribution per § 8.3)
  - `grep -q "Phase 4.0 was a numeric placeholder\|Phase 4.0 was numeric placeholder" .planning/RETROSPECTIVE.md` exit 0 (R-4 cadence consistency disambiguation footer)
  - `grep -q "Phase 4.0 + 4.1 narrative archived to RETROSPECTIVE" .planning/STATE.md` exit 0 (HTML-comment pointer inserted per sister L27 format)
  - `grep -q "\\*\\*Phase 3\\.4 SHIPPED\\*\\*\\|\\*\\*Phase 4\\.1 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (preserve 当前位置 SSOT STATE_POSITION_RE anchor literal for D-04 COLLAPSE freshness gate)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (Phase 4.1 W0.1 ENFORCE=true already shipped; verify 3 rules PASS post-archive)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W0.1 trim — STATE_POSITION_RE OR-fallback still matches preserved 当前位置 SSOT)
- **decision_source**: CONTEXT § W0 backlog absorb plan W0.1 (HIGH priority sister M2 D2 cadence iter 3 verify institutionalize terminus stable signal ≥3-iter) + RESEARCH § 8 (W0.1 mechanical pattern + sister Phase 4.1 W0.3 verbatim + R-4 Phase 4.0 absence disambiguation) + PATTERNS § 1 row 1 + § 2 (~92% reuse mapping + R-4 cadence consistency mitigation explicit) + CONTEXT § Discretion #6 LOCKED Phase 4.0 absence disambiguation Phase 4.1 single-phase archive

---

### T0.2 — W0.2 CONDITIONAL D1 SIZE_LIMIT 200→150 round 2 tighten (DEFERRED #BA conditional resolve; AFTER T0.1 per path dep — conditional on STATE post-W0.1 ≤140L per § 8.2 decision tree; sister Phase 4.1 W0.5 DEFER path precedent — Phase 4.2 may FLIP if W0.1 trim provides ≥10L headroom)

- **files_modified**:
  - `scripts/check-state-archive-stale.mjs` (CONDITIONAL MODIFY 1-line surgical L12 same file as Phase 4.1 W0.1 ENFORCE flip IF post-W0.1 STATE ≤140L: `const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry` → `const SIZE_LIMIT = 150 // Phase 4.2 W0.2 round 2 tighten — sister DEFERRED #BA resolve (W0.1 trim outcome STATE post-trim ≤140L verified pre-flip; Phase 4.1 W0.5 DEFER path resolved)`; file size 54L → 54L unchanged ≤60L Karpathy hard) — OR — OTHERWISE DEFER + register DEFERRED #BA carry-forward Phase 4.3 W0
- **read_first**:
  - `.planning/STATE.md` (by Read — verify post-T0.1 W0.1 trim actual line count for conditional decision tree per § 8.2)
  - `scripts/check-state-archive-stale.mjs` L12 (by Read — verify current `const SIZE_LIMIT = 200` baseline pre-conditional-flip + L10 `const ENFORCE = true` Phase 4.1 W0.1 ship state)
  - `.planning/phase-4.2/RESEARCH.md` § 8 (W0.2 conditional D1 SIZE_LIMIT flip projection + decision tree + estimated post-trim STATE size — offset 705 limit 80)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 2 + § 5 path dep (W0.2 mapping reuse ~95% + conditional path explicit decision tree)
- **action**:
  1. Read `.planning/STATE.md` to verify post-T0.1 W0.1 trim actual line count (expected ~135-140L per § 8.3 projection from 151L baseline minus ~14L trim scope)
  2. **CONDITIONAL DECISION TREE** per § 8.2 verbatim:
     ```
     post-W0.1 STATE.md wc -l
     ├── ≤ 140L → ✅ FLIP PATH (T0.2 active; 10L headroom maintained for Phase 4.2 W2 续编 + future churn)
     ├── 141-150L → ❌ DEFER PATH (T0.2 skip + register DEFERRED #BA carry-forward Phase 4.3 W0 LOW priority defensive)
     └── > 150L → 🚨 BLOCKED + INVESTIGATE (W0.1 trim sufficiency inadequate; re-evaluate D2 cadence pattern adequacy; escalate to planner)
     ```
  3. **IF FLIP PATH** (post-W0.1 STATE ≤140L):
     - Read `scripts/check-state-archive-stale.mjs` L12 to verify baseline:
       ```javascript
       const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry
       ```
     - Edit L12 1-line surgical (sister Phase 4.1 W0.5 1-line cadence延袭):
       ```javascript
       // BEFORE:
       const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry

       // AFTER (Phase 4.2 W0.2 flip):
       const SIZE_LIMIT = 150 // Phase 4.2 W0.2 round 2 tighten — sister DEFERRED #BA resolve (W0.1 trim outcome STATE post-trim ≤140L verified pre-flip; Phase 4.1 W0.5 DEFER path resolved)
       ```
     - Net delta: 0L (1-line value flip; file remains 54L)
     - Run biome preempt: `pnpm exec biome check --write scripts/check-state-archive-stale.mjs` (`.mjs` extension — biome scope mandatory per project memory `feedback_biome-preempt.md` 5-recurrence terminus续延)
     - Post-flip verify: `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=150 (PASS Rule 1 with post-W0.1 STATE ≤140L pre-verified + headroom for W2 T2.1 续编 +5-10L delta keeps ≤150 final)
  4. **IF DEFER PATH** (post-W0.1 STATE 141-150L):
     - Skip L12 edit (leave `SIZE_LIMIT = 200` unchanged)
     - Append entry to Deferred Items section at task_plan.md top (in-place edit):
       ```markdown
       > **DEFERRED #BA** (Phase 4.2 own carry — W0.2 conditional DEFER path active): D1 SIZE_LIMIT round 2 tighten 200→150 carry-forward Phase 4.3 W0 LOW priority defensive (post-W0.1 STATE ~? L exceeded 140L threshold; insufficient ≥10L headroom for round 2 tighten — sister Phase 4.1 W0.5 DEFER path precedent active)
       ```
     - Document in Resolved (T0.2) block: actual post-W0.1 STATE line count + decision tree branch chosen + defer rationale
  5. **IF BLOCKED PATH** (post-W0.1 STATE >150L):
     - Escalate to planner + investigate W0.1 trim sufficiency
     - Do NOT proceed to W1 until resolved
  6. **Recommended commit msg** (FLIP PATH case):
     ```
     fix(phase-4.2-w0): T0.2 — W0.2 CONDITIONAL D1 SIZE_LIMIT 200→150 round 2 tighten (DEFERRED #BA RESOLVED FLIP PATH; W0.1 trim outcome STATE ≤140L pre-verified)

     1-line surgical scripts/check-state-archive-stale.mjs L12 `SIZE_LIMIT = 200`
     → `SIZE_LIMIT = 150` (file 54L unchanged zero size delta; same file as Phase
     4.1 W0.1 ENFORCE flip). Conditional decision tree per § 8.2:
     post-W0.1 STATE ~? L ≤ 140L → FLIP PATH active (10L headroom maintained
     for Phase 4.2 W2 续编 + future churn).

     Sister Phase 4.1 W0.5 DEFER path precedent (post-W0.3 STATE 143L in 141-150L
     range; FLIP carry-forward as #BA) — Phase 4.2 W0.2 RESOLVES #BA via FLIP path
     when W0.1 D2 cadence iter 3 trim provides ≥10L headroom. DEFERRED #BA
     RESOLVED 2026-05-18.

     biome preempt PASS `.mjs` scope mandatory per project memory `feedback_biome
     -preempt.md` 5-recurrence terminus续延. Post-flip verify exit 0 with
     ENFORCE=true (Phase 4.1 W0.1 already shipped) + SIZE_LIMIT=150 (PASS Rule 1).
     ```

     **OR DEFER PATH commit msg** (if STATE 141-150L):
     ```
     defer(phase-4.2-w0): T0.2 — W0.2 CONDITIONAL D1 SIZE_LIMIT DEFER PATH (post-W0.1 STATE ~? L insufficient headroom; DEFERRED #BA carry-forward Phase 4.3 W0 LOW priority)

     Conditional decision tree per § 8.2 DEFER PATH active: post-W0.1 STATE ~?
     L exceeded 140L threshold (insufficient ≥10L headroom for round 2 tighten;
     defensive against over-tighten brittle per R-02 mitigation). scripts/check
     -state-archive-stale.mjs L12 `SIZE_LIMIT = 200` UNCHANGED. DEFERRED #BA
     carry-forward Phase 4.3 W0 LOW priority (sister Phase 4.1 W0.5 DEFER path
     precedent延袭; Phase 4.3 W0 re-evaluate post-Phase-4.2 ship STATE + W2 续编 delta).
     ```
  7. **Update Resolved (T0.2)** block at task_plan.md top with outcome (PENDING → 实占 values: post-W0.1 STATE actual line count + decision tree branch chosen + flip/defer commit SHA)
- **acceptance_criteria** (FLIP PATH):
  - `grep -q "const SIZE_LIMIT = 150" scripts/check-state-archive-stale.mjs` exit 0 (W0.2 flip)
  - `! grep -q "const SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` exit 0 (no remnant 200 declaration)
  - `grep -q "DEFERRED #BA resolve\|DEFERRED #BA RESOLVED" scripts/check-state-archive-stale.mjs` exit 0 (attribution comment)
  - `wc -l scripts/check-state-archive-stale.mjs` ≤ 60 (Karpathy spec unchanged; 54L)
  - `wc -l .planning/STATE.md` ≤ 150 (post-W0.1 trim sufficient for W0.2 flip; W2 续编 +~5-10L delta keeps ≤150 hard)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=150 (PASS Rule 1)
- **acceptance_criteria** (DEFER PATH):
  - `grep -q "const SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` exit 0 (unchanged)
  - `grep -q "DEFERRED #BA" .planning/phase-4.2/task_plan.md` exit 0 (carry-forward registered)
  - `wc -l .planning/STATE.md` ≤ 200 (W0.2 defer baseline maintained)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + SIZE_LIMIT=200 (PASS Rule 1)
- **decision_source**: CONTEXT § W0 backlog absorb plan #BA (MED priority conditional on W0.1 outcome) + RESEARCH § 8 (W0.2 conditional D1 SIZE_LIMIT flip projection + decision tree) + PATTERNS § 1 row 2 + § 5 path dep (~95% reuse mapping + conditional path explicit) + CONTEXT § Sneak-block守门 W0.2 (MUST verify STATE ≤140L post-W0.1 trim BEFORE flip + MUST defer flip if post-trim ≥141L defensive + MUST NOT skip W0.1 trim to game W0.2 condition)

---

## Wave 0 done

All 2 atomic tasks complete. W0 backlog 1 项 #BA conditional absorbed (T0.1 W0.1 D2 cadence iter 3 + T0.2 W0.2 conditional D1 SIZE_LIMIT) per STRICT path dep W0.1 → W0.2. DEFERRED #BA RESOLVED FLIP path OR carry-forward Phase 4.3 W0 DEFER path.

> **Critical path verify**: T0.1 W0.1 trim STATE ≤150L (W0.2 flip safety verify; expected ~135-140L); T0.2 W0.2 conditional decision tree per § 8.2 (FLIP or DEFER branch determined by actual post-W0.1 STATE line count).

> **W1 main scope prereq from Wave 0 outputs**:
> - W0.1 D2 cadence iter 3 archive STATE→RETROSPECTIVE (sister M2 backlog discharge institutionalize verify 3rd-iter terminus stable signal ≥3-iter — W2 T2.2 RETROSPECTIVE.md 续编 builds on this archive section)
> - W0.2 conditional outcome (FLIP or DEFER determines W2 T2.1 STATE 续编 final hard cap ≤150L or ≤200L)
> - Phase 4.1 W0.1 ENFORCE=true already shipped — W1 + W2 续编 MUST pass ENFORCE=true gate

---

## Wave 1 — Main scope community infra (4 atomic — Phase 4.2 anchors R8.2 + R8.3 + R8.5)

### T1.1 — docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive (preserve existing 6+2 sections verbatim + ADD 6 NEW sections A-F per § 2.2 ordering; Karpathy hard cap ≤150L docs convention per CLAUDE.md)

- **files_modified**:
  - `docs/MAINTAINER-ONBOARDING.md` (MODIFY EXPAND 50L → ~125-145L additive: preserve all 6+2 existing sections L1-49 verbatim with minimal updates (Status v0.1 → v0.4 activated + 招募窗口 启动 v0.4 ship 实际 NOT future + v0.4 启动前 TODO check off Sponsors ✓ + stale-bot ✓ + issue template ✓ delivered Phase 4.2 W1) + ADD 6 NEW sections A-F per § 2.2 ordering inserted between 必读文档 L31 and v0.4 启动前 TODO L33; section count post-expand 8 existing + 6 NEW = 14; Karpathy hard cap ≤150L)
- **read_first**:
  - `docs/MAINTAINER-ONBOARDING.md` entire (by Read — verify 50L baseline + 8-section structure verbatim per § 1.2; identify EXPAND insertion site L31 after 必读文档 and L33 before v0.4 启动前 TODO)
  - `CONTRIBUTING.md` L1-200 (by Read — cross-link target source for D-01 sneak block #3 Karpathy DRY reference; Section A Dev Quickstart → § Prerequisites + § Setup; Section B Commit → Commit Message 格式; Section C ADR → ADR 写作规则)
  - `.planning/phase-4.2/RESEARCH.md` § 2 (D-01 EXPAND section preservation map + NEW section ADD recipe + sneak block enforcement)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 3 + § 2.1 (T1.1 mapping reuse ~70% + concrete code excerpt verbatim D-01 ADDITIVE EXPAND pattern)
- **action**:
  1. Read `docs/MAINTAINER-ONBOARDING.md` to confirm 50L baseline + 8 existing sections (Status L1-4 + 目标 L6-8 + 招募窗口 L10-14 + Co-maintainer 角色定位 L16-20 + 必读文档 L22-31 + v0.4 启动前 TODO L33-39 + 风险 L41-45 + References L47-49)
  2. **Minimal updates to existing 6+2 sections** (R-1 mitigation per CONTEXT § Discretion #5 minor wording polish allowed within ADDITIVE EXPAND scope NOT full rewrite):
     - L2 Status: change 占位文档 v0.1 marker to v0.4 activated (Phase 4.2 SHIPPED 2026-05-18) — co-maintainer 招募窗口已开启
     - L12 招募窗口 启动: change v0.4 ship 时正式发布 to v0.4.0 ship 2026-05-19 Phase 4.3 close (6-month organic external clock per D-04 HYBRID)
     - L23-30 必读文档: ADD ADR 0014-0017 cross-link rows + DOGFOOD docs cross-link (sister Phase 3.1-3.4 ADR addition delta)
     - L34-39 v0.4 启动前 TODO: check off Sponsors ✓ + stale-bot ✓ + issue template ✓ (3 delivered Phase 4.2 W1); good-first-issue + 招募贴文 remain organic external clock items per D-04 HYBRID
  3. **ADD 6 NEW sections inserted between L31 必读文档 and L33 v0.4 启动前 TODO** per § 2.2 ordering + RESEARCH § 2.2 verbatim recipe:
     - **Section A Dev environment setup** (30-min quickstart per R8.2 acceptance, ~18L): cross-link CONTRIBUTING.md § Prerequisites + § Setup (NOT recopy per Karpathy DRY); 4-step checkpoint (Node ≥22 + Git / corepack enable + Windows ACL fallback / corepack pnpm install --frozen-lockfile + pnpm test first cycle ≤5min M2 class / node dist/cli.mjs --version smoke post-build)
     - **Section B Commit conventions** (~10L): Conventional Commits format (type-scope-summary sister Phase 1.X+ all commits 遵循) + Karpathy ≤200L hard / ≤150L docs hard (sister B-06 + B-26 + Phase 3.4 D-04 explicit) + Biome preempt before commit MANDATORY per project memory feedback_biome-preempt.md 3 CI-red recurrences terminus
     - **Section C ADR review checklist** (~15L): 9 章节 errata format sister ADR 0001-0017 main body 0 diff per A7 守恒 + REQ-ID anchor sister Phase 3.4 W2 T2.7 iter 1-0017 cadence + Decision Lock + Sneak-block clauses + Rationale sister Phase X.Y CONTEXT.md D-decisions 模板 + Cross-reference ADR 0005 errata precedent + biome preempt before commit
     - **Section D Cross-OS CI maintenance** (~10L): .github/workflows/ci.yml matrix ubuntu-latest + macos-latest + windows-latest + Windows-specific bash flavor sentinel sister Phase 2.4 W4 ralph-loop Win sentinel + RESEARCH-guided net.createServer port:0 ephemeral port sister Phase 3.3 W0.2 dashboard-sse fix + Build-before-test Win pattern sister Phase 3.4 hotfix 554b82b pnpm build mandatory pre-vitest on Win
     - **Section E Manifest schema 守门** (~10L): ADR 0001 v1 frozen + ADR 0007 errata extension categorization 3-field + ADR 0003 install method count errata + schemaVersion 13-surface registry sister Phase 3.3 W0.3 manifest-domain colocation 3rd consumer 闭环 + Colocation domain rule
     - **Section F Upstream drift monitoring** (~12L): versions known-good.yaml lazy lock per Phase 3.3 D-03 8-entry sample shipped v0.3.0 + Manifest churn signal heuristics + Weekly harnessed doctor 8-check sister Phase 4.1 v0.4-upgrade-e2e.log template precedent + Escalation when upstream stops shipping → maintenance-only mode per § 风险 sister fallback
  4. **Sneak-block守门 verify** (planner manual review pre-commit):
     - D-01 sneak #1 NO split: `ls docs/ONBOARDING*` returns ONLY MAINTAINER-ONBOARDING.md (no ONBOARDING-QUICKSTART.md etc.)
     - D-01 sneak #2 NO checklist-only: section count ≥ 8 with prose paragraphs (existing 8 + 6 NEW = 14 narrative-rich)
     - D-01 sneak #3 preserve existing 6+2 verbatim: git diff shows existing sections L1-50 minimal updates ONLY (TODO check-off + Status version bump + 招募窗口 启动 marker)
     - D-01 sneak #4 NO redundant copy from CONTRIBUTING.md: Section A Dev Environment delegates to existing CONTRIBUTING § Prerequisites + § Setup (reference link only per Karpathy DRY); reviewer grep CONTRIBUTING.md ≥ 3 occurrences in NEW sections
  5. Post-write hard cap verify: `wc -l docs/MAINTAINER-ONBOARDING.md` ≥ 100 AND ≤ 150 (D-01 hard cap per CLAUDE.md docs convention)
  6. **IF post-write breach >150L** (R-1 mitigation hierarchy per § 2.2):
     - Mitigation 1: drop section F Upstream Drift Monitoring (lowest acceptance value) → saves ~12L → estimate ~113L
     - Mitigation 2: drop section E Manifest Schema SOP → saves ~10L → estimate ~115L
     - KEEP A+B+C+D essential R8.2 verbs (Dev environment + Commit + ADR + CI)
  7. Biome NOT needed (.md extension out of biome scope); skip biome preempt for this task
  8. **Recommended commit msg** (Karpathy why-not-what, sister Phase 4.1 W1 T1.1 commit msg pattern延袭):
     - Subject: `docs(phase-4.2-w1): T1.1 — docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive (R8.2 anchor outer 30-min quickstart; preserve 6+2 existing sections verbatim + ADD 6 NEW sections A-F per § 2.2 ordering)`
     - Body: D-01 ADDITIVE EXPAND preserves all 8 existing sections verbatim with minor wording polish (Status v0.1 → v0.4 activated per R-1 mitigation; 招募窗口 启动 v0.4.0 ship 2026-05-19 实际 NOT future; 必读文档 ADD ADR 0014-0017 + DOGFOOD cross-link rows; v0.4 启动前 TODO check off Sponsors+stale-bot+issue template ✓ delivered Phase 4.2 W1). 6 NEW sections inserted between 必读文档 L31 and v0.4 启动前 TODO L33 per § 2.2 ordering (A Dev environment 30-min quickstart cross-link CONTRIBUTING.md NOT duplicate per Karpathy DRY + B Commit conventions + C ADR review checklist 5-point + D Cross-OS CI maintenance sister Phase 3.4 build-before-test 554b82b + E Manifest schema 守门 + F Upstream drift monitoring). Section count post-expand 8 + 6 = 14 narrative-rich (NOT bare checklist per D-01 sneak #2); Karpathy hard cap ≤150L per CLAUDE.md docs convention (estimate ~125-145L within); cross-link CONTRIBUTING.md ≥ 3 occurrences (D-01 sneak #3 Karpathy DRY reference NOT duplicate).
  9. **Update Resolved (T1.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l docs/MAINTAINER-ONBOARDING.md` post-expand + section count + cross-link count + breach mitigation outcome)
- **acceptance_criteria**:
  - `wc -l docs/MAINTAINER-ONBOARDING.md` ≥ 100 AND ≤ 150 (D-01 hard cap LOCK; F1)
  - `grep -c "^## " docs/MAINTAINER-ONBOARDING.md` ≥ 12 (preserve 8 + add 6)
  - `grep -q "Dev environment\|Commit conventions\|ADR review\|Cross-OS CI\|Manifest schema\|Upstream drift" docs/MAINTAINER-ONBOARDING.md` exit 0 (6 NEW sections present per § 2.2)
  - `grep -c "CONTRIBUTING.md" docs/MAINTAINER-ONBOARDING.md` ≥ 3 (D-01 sneak #3 Karpathy DRY reference NOT duplicate)
  - `! ls docs/ONBOARDING-QUICKSTART.md 2>/dev/null` exit 0 OR file does not exist (D-01 sneak #1 NO split)
  - `grep -q "v0.4 activated\|Phase 4.2 SHIPPED" docs/MAINTAINER-ONBOARDING.md` exit 0 (Status update v0.1 → v0.4 activated)
- **decision_source**: CONTEXT § Decisions D-01 LOCKED ADDITIVE EXPAND + RESEARCH § 2 (D-01 implementation verbatim recipe) + PATTERNS § 1 row 3 + § 2.1 (~70% reuse mapping; concrete code excerpt verbatim ADDITIVE EXPAND pattern) + R8.2 acceptance verb literal + CONTEXT § Discretion #5 v0.1 stub quality acceptable + R-1 mitigation minor wording polish allowed

---

### T1.2 — .github/workflows/stale.yml NEW ~45L D-02 LOCKED actions/stale@v10 recipe (per R2 § 2 finding correction NOT @v9 outdated; 60+30 split 90-day total per R8.3 spec verbatim; issue+PR scope per D-02 sneak block #3)

- **files_modified**:
  - `.github/workflows/stale.yml` (NEW ~45L D-02 LOCKED recipe per RESEARCH § 3.1 verbatim: name + on schedule cron daily 1:30 UTC + workflow_dispatch + permissions block minimal scope + jobs.stale ubuntu-latest + uses actions/stale@v10 + with-block 60+30 split issue+PR + exempt-issue-labels defensive list + exempt-pr-labels + operations-per-run 30; Karpathy hard ≤60L)
- **read_first**:
  - `.github/workflows/ci.yml` L1-50 (by Read — sister workflow structural template name/on/jobs/steps schema reference)
  - `.github/workflows/perf-bench.yml` (by Read — sister 短 workflow precedent Phase 2.3 M3 perf gate nightly cron)
  - `.planning/phase-4.2/RESEARCH.md` § 3 (D-02 stale.yml verbatim recipe + 60+30 split semantic + cron Discretion #2 + sneak-block enforcement)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 5 + § 2.3 (T1.2 mapping reuse ~55% + concrete code excerpt verbatim actions/stale recipe)
- **action**:
  1. Verify `.github/workflows/` baseline state: `ls .github/workflows/` returns only `ci.yml + perf-bench.yml` (Phase 4.2 W1 inaugurates `stale.yml` NEW community-infra workflow)
  2. Create NEW file `.github/workflows/stale.yml` ~45L estimate per RESEARCH § 3.1 verbatim recipe:
     - Header comment block (~5L): `# .github/workflows/stale.yml` + `# Phase 4.2 R8.3 — stale-bot 90-day auto-close issue + PR` + `# D-02 LOCKED: 90-day default, issue+PR scope, mark-stale-at-60 + close-at-90 semantic` + `# actions/stale@v10 verified current (v10.2.0 Feb 2026 per R2 § 2 finding correction; NOT @v9 outdated per CONTEXT D-02 reference)`
     - `name: 'Close stale issues and PRs'`
     - `on: schedule: - cron: '30 1 * * *'` (daily 1:30 UTC actions/stale README default per planner Discretion #2) + `workflow_dispatch:` (manual trigger for testing)
     - `permissions: { issues: write, pull-requests: write }` minimal scope (STRIDE E mitigation — NOT contents/actions per § 12.1 T6)
     - `jobs.stale.runs-on: ubuntu-latest` + `steps: - uses: actions/stale@v10` (pin @v10 per R2 finding; NOT @v9 outdated; NOT @main floating)
     - `with:` block (4 directives 60+30 split + labels + messages + exemptions):
       - `days-before-issue-stale: 60` + `days-before-issue-close: 30` (60+30 = 90-day total per R8.3 spec verbatim "mark stale at day 60 → close at day 90")
       - `days-before-pr-stale: 60` + `days-before-pr-close: 30` (parallel for PR scope per D-02 sneak #3 BOTH issue + PR)
       - `stale-issue-label: 'stale'` + `stale-pr-label: 'stale'`
       - `stale-issue-message: |` (friendly multi-line "automatically marked as stale ... 30 days if no further activity ... Reactivation see docs/MAINTAINER-ONBOARDING.md for revival path")
       - `close-issue-message: |` (multi-line "closed because stale for 90 days ... Reopen anytime with new context")
       - `stale-pr-message: |` + `close-pr-message: |` (parallel for PR)
       - `exempt-issue-labels: 'pinned,security,good first issue,help wanted'` (STRIDE D defensive list per actions/stale README recommendation)
       - `exempt-pr-labels: 'pinned,security,blocked'` (PR exemption symmetric)
       - `operations-per-run: 30` (STRIDE D rate limit default; raise if backlog grows)
  3. **Sneak-block守门 verify** (planner manual review pre-commit):
     - D-02 sneak #1 NO 60-day stricter: `grep -E "days-before-(issue|pr)-(stale|close)"` returns exactly 60 + 30 + 60 + 30 (NOT lower values; fail if any < 60)
     - D-02 sneak #2 NO 120-day lenient: `grep` no values > 90 (fail if any directive > 90)
     - D-02 sneak #3 BOTH issue + PR: `grep -c "days-before-pr"` ≥ 2 (pr-stale + pr-close both present)
     - D-02 sneak #4 pin @v10 NOT @v9 (R2 § 2 finding correction): `grep "actions/stale@v"` returns `@v10` exact + `! grep "actions/stale@v9"` exit 0 (no @v9 sneak)
     - D-02 sneak #5 exempt-issue-labels defensive: `grep "exempt-issue-labels"` returns line containing `pinned` + `security`
     - STRIDE E mitigation: `grep "permissions:"` block returns ONLY `issues: write` + `pull-requests: write` (NOT `contents: write` or `actions: write` — verify via grep no `contents:` or `actions:` in permissions block)
  4. Local YAML parse verify: `npx yq eval . .github/workflows/stale.yml` exit 0 (valid YAML) OR `node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/stale.yml','utf8'))"` (fallback if yq not available)
  5. Hard cap verify: `wc -l .github/workflows/stale.yml` ≤ 60 (Karpathy YAGNI hard)
  6. Biome NOT needed (.yml extension out of biome scope); skip biome preempt for this task
  7. **Recommended commit msg**:
     - Subject: `feat(phase-4.2-w1): T1.2 — .github/workflows/stale.yml NEW ~45L D-02 LOCKED actions/stale@v10 recipe (R8.3 anchor 90-day issue+PR auto-close; R2 § 2 finding correction NOT @v9 outdated)`
     - Body: Phase 4.2 W1 inaugurates .github/workflows/ community-infra stale-bot surface. D-02 LOCKED 60+30 split semantic 4 directives (issue-stale 60 + issue-close 30 + pr-stale 60 + pr-close 30) net 90-day total per R8.3 spec verbatim mark stale at day 60 → close at day 90. **R2 § 2 finding correction CRITICAL**: pin actions/stale@v10 (v10.2.0 Feb 2026 current per VERIFIED github.com/actions/stale README) NOT @v9 outdated per CONTEXT D-02 reference. STRIDE E mitigation permissions block scoped issues:write + pull-requests:write minimal (NOT contents/actions). STRIDE D mitigation operations-per-run 30 rate limit default + exempt-issue-labels pinned,security,good first issue,help wanted defensive list per actions/stale README recommendation. Cron daily 1:30 UTC actions/stale README default per planner Discretion #2 (off-peak GitHub Actions queue). workflow_dispatch manual trigger for testing pre-90-day. Karpathy YAGNI hard ≤60L.
  8. **Update Resolved (T1.2)** block at task_plan.md top with outcome (PENDING → 实占 values: wc -l + grep @v10 verify + 4 directives count + YAML parse exit code)
- **acceptance_criteria**:
  - `test -f .github/workflows/stale.yml` exit 0 (NEW file present)
  - `wc -l .github/workflows/stale.yml` ≤ 60 (Karpathy hard; F2)
  - `grep -q "actions/stale@v10" .github/workflows/stale.yml` exit 0 (R2 finding correction; NOT @v9)
  - `! grep -q "actions/stale@v9" .github/workflows/stale.yml` exit 0 (no @v9 sneak per R2)
  - `grep -E "days-before-(issue|pr)-(stale|close)" .github/workflows/stale.yml | wc -l` == 4 (60+30 split issue+PR per D-02 sneak #3)
  - `grep -q "days-before-issue-stale: 60" .github/workflows/stale.yml` exit 0
  - `grep -q "days-before-issue-close: 30" .github/workflows/stale.yml` exit 0
  - `grep -q "exempt-issue-labels" .github/workflows/stale.yml` exit 0 (STRIDE D defensive list)
  - `grep -q "operations-per-run" .github/workflows/stale.yml` exit 0 (STRIDE D rate limit)
  - `grep -q "permissions:" .github/workflows/stale.yml` exit 0 AND `! grep -E "^\s+(contents|actions):" .github/workflows/stale.yml` exit 0 (STRIDE E minimal scope)
  - YAML parse exit 0 (local yq eval OR node js-yaml fallback)
- **decision_source**: CONTEXT § Decisions D-02 LOCKED 90-day + issue+PR + RESEARCH § 3 (D-02 stale.yml verbatim recipe; R2 § 2 finding correction actions/stale@v10) + PATTERNS § 1 row 5 + § 2.3 (~55% reuse mapping NEW community-infra surface; concrete code excerpt verbatim) + R8.3 spec verbatim "stale-bot 自动关闭 90 天无活动 issue" + planner Discretion #2 cron daily 1:30 UTC reuse actions/stale README default + STRIDE E + D mitigation per RESEARCH § 12.1

---

### T1.3 — .github/ISSUE_TEMPLATE/ 4 NEW yml files (01-bug.yml + 02-feature.yml + 03-question.yml + config.yml) D-03 supporting infra per planner Discretion #3 yml form-based (NOT classical .md per [CITED: docs.github.com/communities] 2026 best practice)

- **files_modified**:
  - `.github/ISSUE_TEMPLATE/01-bug.yml` (NEW ~55-60L form-based YAML per RESEARCH § 6.2 verbatim: OS dropdown + Node version + harnessed version + reproduce/expected/actual textareas + DO NOT credentials warning STRIDE I mitigation + labels [bug, triage])
  - `.github/ISSUE_TEMPLATE/02-feature.yml` (NEW ~40-45L per RESEARCH § 6.3 verbatim: problem/proposal/alternatives + R9.5 三问 checkboxes defending 范围蔓延 + labels [enhancement, triage])
  - `.github/ISSUE_TEMPLATE/03-question.yml` (NEW ~30-35L per RESEARCH § 6.4 verbatim: header redirect MAINTAINER-ONBOARDING + question/tried textareas + labels [question])
  - `.github/ISSUE_TEMPLATE/config.yml` (NEW ~12L per RESEARCH § 6.5 verbatim: blank_issues_enabled: false R8.3 80% adoption defender + 2 contact_links MAINTAINER-ONBOARDING + ROADMAP v1.0 拒绝清单)
- **read_first**:
  - `.planning/phase-4.2/RESEARCH.md` § 6 (ISSUE_TEMPLATE 4-file verbatim recipes + planner Discretion #3 yml form-based rationale + sneak block enforcement)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 6 + § 2.4 (T1.3 mapping reuse ~40% + concrete code excerpt verbatim bug.yml skeleton + sister feature.yml + question.yml structure)
  - `CONTRIBUTING.md` (by Read — sister contributor-facing docs cluster structural reference for cross-link MAINTAINER-ONBOARDING + ROADMAP from config.yml contact_links)
- **action**:
  1. Verify `.github/ISSUE_TEMPLATE/` baseline state: `ls .github/ISSUE_TEMPLATE/` exit 1 (directory does not exist; Phase 4.2 W1 inaugurates NEW directory)
  2. Create directory `.github/ISSUE_TEMPLATE/` (mkdir -p)
  3. Create NEW file `.github/ISSUE_TEMPLATE/01-bug.yml` per RESEARCH § 6.2 verbatim recipe (~55-60L):
     - Header comment block (~3L): purpose + form-based YAML 2026 best practice + STRIDE I mitigation note DO NOT credentials
     - `name: Bug Report` + `description: Report a defect in harnessed (installer / router / checkpoint / doctor / CLI)` + `title: "[Bug]: "` + `labels: ["bug", "triage"]`
     - `body:` with 7 elements:
       - `type: markdown attributes.value:` (intro with DO NOT include API keys/credentials/secrets warning per STRIDE I mitigation + cross-link MAINTAINER-ONBOARDING per § 1.2)
       - `type: input id: harnessed-version` (required, placeholder e.g. 0.4.0)
       - `type: dropdown id: os` (required, options Windows/macOS/Linux Ubuntu/Linux other/WSL2)
       - `type: input id: node-version` (required, ≥22 placeholder e.g. 22.11.0)
       - `type: textarea id: reproduce` (required, minimal repro recipe placeholder)
       - `type: textarea id: expected` (required)
       - `type: textarea id: actual` (required, include error messages / stack traces / harnessed doctor output)
       - `type: textarea id: additional` (optional, routing decision context + harnessed doctor output + audit.log v0.4.3+)
  4. Create NEW file `.github/ISSUE_TEMPLATE/02-feature.yml` per RESEARCH § 6.3 verbatim recipe (~40-45L):
     - Header comment + `name: Feature Request` + `description` + `title: "[Feature]: "` + `labels: ["enhancement", "triage"]`
     - `body:` with 4 elements:
       - `type: markdown attributes.value:` (header "Before submitting, please check R9.5 范围蔓延防御 三问 below. See [.planning/ROADMAP.md](../../.planning/ROADMAP.md) for v1.0 拒绝清单")
       - `type: textarea id: problem` (required, what user pain to solve)
       - `type: textarea id: proposal` (required, proposed solution)
       - `type: textarea id: alternatives` (optional, what other approaches evaluated)
       - `type: checkboxes id: r95-triage` (label "R9.5 范围蔓延防御 三问 (required)" + 3 options ALL required: packaging vs PM problem / NOT wrap of upstream API / NOT one-time escape hatch sufficient) per R9.5 范围蔓延 defense
  5. Create NEW file `.github/ISSUE_TEMPLATE/03-question.yml` per RESEARCH § 6.4 verbatim recipe (~30-35L):
     - Header comment + `name: Question` + `description` + `title: "[Question]: "` + `labels: ["question"]`
     - `body:` with 3 elements:
       - `type: markdown attributes.value:` (header "For getting started, see [docs/MAINTAINER-ONBOARDING.md](../../docs/MAINTAINER-ONBOARDING.md) 30-min Quickstart first")
       - `type: textarea id: question` (required)
       - `type: textarea id: tried` (optional, commands run + docs read + error messages seen)
       - `type: input id: harnessed-version` (optional, placeholder e.g. 0.4.0)
  6. Create NEW file `.github/ISSUE_TEMPLATE/config.yml` per RESEARCH § 6.5 verbatim recipe (~12L):
     - Header comment + `blank_issues_enabled: false` (R8.3 80% adoption defender per § 6.6 sneak block #2 enforce template usage 100%)
     - `contact_links:` with 2 entries:
       - name: "Documentation (Onboarding + 30-min Quickstart)" + url: github.com/easyinplay/harnessed/blob/main/docs/MAINTAINER-ONBOARDING.md + about: "New contributor? Start here for dev environment setup and onboarding."
       - name: "Roadmap + v1.0 拒绝清单" + url: github.com/easyinplay/harnessed/blob/main/.planning/ROADMAP.md + about: "Check the roadmap and 拒绝清单 before requesting new workflow types or wrappers."
  7. **Sneak-block守门 verify** (planner manual review pre-commit per § 6.6):
     - sneak #1 yml form-based NOT .md classical: `ls .github/ISSUE_TEMPLATE/*.md` returns 0 files; `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` == 4
     - sneak #2 blank_issues_enabled false: `grep "blank_issues_enabled: false" .github/ISSUE_TEMPLATE/config.yml` exit 0 (R8.3 80% adoption defender)
     - sneak #3 per-file ≤ 80L Karpathy YAGNI: `wc -l .github/ISSUE_TEMPLATE/*.yml` per file ≤ 80 (long forms = friction)
     - sneak #4 cross-link MAINTAINER-ONBOARDING in config.yml: `grep "MAINTAINER-ONBOARDING" .github/ISSUE_TEMPLATE/config.yml` ≥ 1 match
     - STRIDE I mitigation: `grep "DO NOT.*credentials\|do not.*credentials\|API keys" .github/ISSUE_TEMPLATE/01-bug.yml` exit 0 (markdown intro warning)
     - filename prefix 01-/02-/03- ordering per [CITED: docs.github.com/communities] alphanumeric sort
  8. Local YAML parse verify per file: `for f in .github/ISSUE_TEMPLATE/*.yml; do npx yq eval . "$f"; done` all exit 0 (valid YAML) OR node js-yaml fallback
  9. Biome NOT needed (.yml extension out of biome scope); skip biome preempt for this task
  10. **Recommended commit msg**:
     - Subject: `feat(phase-4.2-w1): T1.3 — .github/ISSUE_TEMPLATE/ 4 NEW yml files D-03 supporting infra (R8.3 anchor issue templates standardization; planner Discretion #3 yml form-based per CITED docs.github.com/communities 2026 best practice)`
     - Body: Phase 4.2 W1 inaugurates .github/ISSUE_TEMPLATE/ directory NEW community-infra surface. 4 files per planner Discretion #3 yml form-based (NOT classical .md): 01-bug.yml ~55-60L form-based (OS dropdown + Node version + harnessed version + reproduce/expected/actual + DO NOT credentials warning STRIDE I mitigation + labels bug + triage) + 02-feature.yml ~40-45L (problem/proposal/alternatives + R9.5 三问 checkboxes 范围蔓延 defense + labels enhancement + triage) + 03-question.yml ~30-35L (header redirect MAINTAINER-ONBOARDING 30-min Quickstart + labels question) + config.yml ~12L (blank_issues_enabled false R8.3 80% adoption defender enforce template usage 100% + 2 contact_links MAINTAINER-ONBOARDING + ROADMAP v1.0 拒绝清单). Filename prefix 01-/02-/03- ordering per CITED docs.github.com/communities alphanumeric sort. Per-file ≤80L Karpathy YAGNI hard (long forms = friction). R9.5 三问 checkboxes defend 范围蔓延 per sister ROADMAP L227 verb (packaging vs PM problem / NOT wrap of upstream API / NOT one-time escape hatch sufficient — 3 boxes ALL required).
  11. **Update Resolved (T1.3)** block at task_plan.md top with outcome (PENDING → 实占 values: 4 file present + per-file wc -l + YAML parse all exit 0 + blank_issues_enabled false verify)
- **acceptance_criteria**:
  - `test -d .github/ISSUE_TEMPLATE` exit 0 (NEW directory present)
  - `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` == 4 (3 templates + config.yml; F3)
  - `ls .github/ISSUE_TEMPLATE/*.md 2>/dev/null | wc -l` == 0 (sneak #1 yml NOT .md classical)
  - per-file `wc -l .github/ISSUE_TEMPLATE/*.yml` ≤ 80 (sneak #3 Karpathy YAGNI)
  - `grep -q "blank_issues_enabled: false" .github/ISSUE_TEMPLATE/config.yml` exit 0 (R8.3 80% adoption defender)
  - `grep -q "MAINTAINER-ONBOARDING" .github/ISSUE_TEMPLATE/config.yml` exit 0 (sneak #4 cross-link)
  - `grep -lE "labels:" .github/ISSUE_TEMPLATE/0[1-3]-*.yml | wc -l` == 3 (auto-apply labels all 3 templates)
  - `grep -qE "DO NOT.*credentials|do not.*credentials|API keys" .github/ISSUE_TEMPLATE/01-bug.yml` exit 0 (STRIDE I mitigation)
  - `grep -q "R9.5\|范围蔓延" .github/ISSUE_TEMPLATE/02-feature.yml` exit 0 (R9.5 三问 checkboxes defense)
  - YAML parse exit 0 per file
- **decision_source**: CONTEXT § Decisions D-03 supporting infra + RESEARCH § 6 (ISSUE_TEMPLATE 4-file verbatim recipes) + PATTERNS § 1 row 6 + § 2.4 (~40% reuse mapping NEW community-infra surface; concrete code excerpt verbatim bug.yml + sister feature/question structure) + planner Discretion #3 yml form-based per [CITED: docs.github.com/communities] 2026 best practice + R8.3 verbatim "issue templates standardization" + STRIDE I mitigation per RESEARCH § 12.1 T4

---

### T1.4 — .github/FUNDING.yml NEW + README L8 Sponsors badge + L190-192 footer EXPAND (combined per planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1; D-03 LOCKED single tier $1+ Karpathy YAGNI; W2 T2.4 README freshness 后续 combined separately)

- **files_modified**:
  - `.github/FUNDING.yml` (NEW ~3-8L per RESEARCH § 4.1 verbatim recipe: 2-3 line header comment Phase 4.2 W1 D-03 LOCKED + `github: easyinplay` single-line directive per [CITED: docs.github.com/sponsors] minimum example; NO multi-tier pricing per D-03 sneak #1 + NO `custom:` array URL per sneak #3; Karpathy YAGNI hard ≤8L)
  - `README.md` (MODIFY W1 portion ONLY this task: L8 ADD Sponsors badge between L7 Status badge and L9 Status block + L190-192 footer Sponsor section EXPAND ~3L → ~7L per RESEARCH § 5.2 verbatim; W2 T2.4 separately updates L9 Status freshness + L48 MILESTONE row + Phase 4.2 row append in single combined commit)
- **read_first**:
  - `.planning/phase-4.2/RESEARCH.md` § 4 + § 5 (D-03 FUNDING.yml verbatim recipe + README badge insertion site Discretion #1 + footer EXPAND ~3-4L delta + sneak block enforcement + user manual prereq external)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 4 + row 7 + § 2.2 + § 2 (T1.4 mapping reuse ~30% FUNDING NEW + ~85% README badge cluster reuse + concrete code excerpt verbatim)
  - `README.md` L1-12 + L188-196 (by Read — verify L6-7 badge cluster + L190-192 footer Sponsor section baseline structure for D-03 sneak #2 link-only no-tier check)
- **action**:
  1. Verify `.github/FUNDING.yml` baseline state: `ls .github/FUNDING.yml 2>/dev/null` exit 1 (file does not exist; Phase 4.2 W1 inaugurates NEW community-infra Sponsors config)
  2. Create NEW file `.github/FUNDING.yml` per RESEARCH § 4.1 verbatim recipe (~3-8L total):
     - Header comment block (~3L): `# .github/FUNDING.yml` + `# Phase 4.2 R8.5 — GitHub Sponsors enable, single tier Karpathy YAGNI` + `# D-03 LOCKED single tier $1+ minimal; defer multi-tier pricing (3-level $5/$25/$100) to v0.5+ pending community signal; defer custom: URL array to v0.5+ pending alternative funding venue signal`
     - `github: easyinplay` (1-line directive per [CITED: docs.github.com/sponsors] minimum example; single user NOT list per D-03 sneak #1)
  3. MODIFY `README.md` L8 ADD Sponsors badge between L7 Status badge and L9 Status block:
     - Current L6-7 badge cluster:
       ```
       [![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
       [![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)
       ```
     - ADD L8 (between L7 and L9):
       ```
       [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
       ```
     - Net LOC delta: +1L badge line (README 196L → 197L)
  4. MODIFY `README.md` L190-192 footer Sponsor section EXPAND per RESEARCH § 5.2 verbatim:
     - Current (L190-192):
       ```
       ## Sponsor / Co-maintainer

       GitHub Sponsors 启用 + co-maintainer 招募窗口在 v0.4 开启（参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)）。
       ```
     - EXPAND to (~7L total, +4L delta):
       ```
       ## Sponsor / Co-maintainer

       GitHub Sponsors **已启用** (Phase 4.2 SHIPPED v0.4.0) — [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay) 或直接访问 [github.com/sponsors/easyinplay](https://github.com/sponsors/easyinplay).

       Co-maintainer 6 月招募窗口已开启 — 完整入门指引参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)（30 分钟可跑通 dev 环境 per R8.2 验收）.

       stale-bot 已上线 — 90 天无活动 issue/PR 自动关闭 (`.github/workflows/stale.yml`); issue 模板见 `.github/ISSUE_TEMPLATE/`。
       ```
     - Net LOC delta: +4L footer EXPAND (README 197L → 201L approaches ≤200L hard cap)
  5. **Hard cap mitigation** (README total approaches ≤200L per CLAUDE.md sister 6-phase 连续 hold):
     - IF post-write `wc -l README.md` > 200 → condense footer 7L → 6L by merging Sponsor badge link inline (planner Discretion mitigation per RESEARCH § 5.2)
     - Target: ≤200L hard maintained
  6. **Sneak-block守门 verify** (planner manual review pre-commit per § 4.4 + § 5.4):
     - D-03 sneak #1 NO multi-tier pricing: `grep -E "(patreon|open_collective|ko_fi|tier)" .github/FUNDING.yml` exit 1 (only `github` key per D-03)
     - D-03 sneak #2 NO link-only no-tier: README footer contains `[Sponsor` badge AND `github.com/sponsors/easyinplay` URL (actionable not just text)
     - D-03 sneak #3 NO custom: array: `grep "custom:" .github/FUNDING.yml` exit 1 (no custom array per Karpathy YAGNI)
     - § 4.4 enforcement #1: `wc -l .github/FUNDING.yml` ≤ 5-8 + `grep -c "^github:" .github/FUNDING.yml` == 1 (single user NOT list)
     - § 5.4 enforcement #1 preserve L6-7 badge: `git diff README.md` L6-7 unchanged + L8 Sponsor badge appended
     - § 5.4 enforcement #2 preserve footer section header: `git diff README.md` L190 `## Sponsor / Co-maintainer` header unchanged + content expanded additively
     - § 5.4 enforcement #3 ≤200L hard: `wc -l README.md` ≤ 200 (mitigation condense footer IF breach)
     - § 5.4 enforcement #4 cross-link footer 5 references: footer contains FUNDING.yml (indirect via badge) + Sponsors URL + MAINTAINER-ONBOARDING + stale.yml + ISSUE_TEMPLATE all referenced
     - `grep -c "sponsors/easyinplay" README.md` ≥ 2 (L8 badge + L190+ footer per § 5.4 sneak #4)
  7. **User manual prerequisite acknowledgment** (per RESEARCH § 4.2 + § 17.2 U1):
     - Sponsors button render on repo page REQUIRES user manual Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state)
     - Phase 4.2 ships config + DOGFOOD W2 T2.7 Axis C verifies infra NOT button render
     - FALLBACK ACCEPTED: ship FUNDING.yml + badge forward-compatible IF user account NOT yet Active by Phase 4.2 ship; STATE.md L23 user TODO list captures activation as external action
     - DEFERRED #BE registered IF user NOT activated by ship time (per Deferred Items section)
  8. Biome NOT needed (.yml + .md extensions out of biome scope); skip biome preempt for this task
  9. **Recommended commit msg**:
     - Subject: `feat(phase-4.2-w1): T1.4 — .github/FUNDING.yml NEW + README L8 Sponsors badge + L190-192 footer EXPAND combined (R8.5 anchor GitHub Sponsors enable; D-03 LOCKED single tier $1+ Karpathy YAGNI per CITED docs.github.com/sponsors minimum example)`
     - Body: Phase 4.2 W1 inaugurates .github/FUNDING.yml NEW community-infra Sponsors config + README badge cluster + footer Sponsor section EXPAND combined per planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1. FUNDING.yml ~3-8L per CITED docs.github.com/sponsors minimum example github: easyinplay single-line directive (D-03 LOCKED single user NOT list per sneak #1; NO patreon/open_collective/ko_fi/custom keys per sneak #1 + #3; Karpathy YAGNI hard ≤8L). README L8 Sponsors badge insertion shields.io standard dynamic count badge zero maintenance + L190-192 footer EXPAND ~3L → ~7L (badge inline + Sponsors URL + Co-maintainer 6 月窗口 cross-link MAINTAINER-ONBOARDING + stale-bot 操作 note + issue template reference). Cross-link footer 5 references per § 5.4 sneak #4. README total 196 → 200-201L approaches ≤200L hard cap per CLAUDE.md sister 6-phase 连续 hold; mitigation condense footer IF breach. **User manual prerequisite per RESEARCH § 4.2 + § 17.2 U1**: Sponsors button render on repo page REQUIRES user manual Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state); Phase 4.2 ships config + DOGFOOD Axis C verifies infra NOT button render; FALLBACK ACCEPTED ship forward-compatible. **W2 T2.4 separately combines** L9 Status freshness Phase 4.2 SHIPPED + L48 MILESTONE row v0.4.0 2/3 + Phase 4.2 row append per sister Phase 4.1 W2 T2.4 STATUS_MARKER path延袭 (single commit deliverable).
  10. **Update Resolved (T1.4)** block at task_plan.md top with outcome (PENDING → 实占 values: wc -l FUNDING.yml + wc -l README.md + badge insertion verify + footer EXPAND verify + 2 cross-link occurrences + user prereq note)
- **acceptance_criteria**:
  - `test -f .github/FUNDING.yml` exit 0 (NEW file present)
  - `wc -l .github/FUNDING.yml` ≤ 8 (Karpathy YAGNI hard; F4)
  - `grep -q "^github: easyinplay" .github/FUNDING.yml` exit 0 (D-03 LOCKED single-line)
  - `! grep -qE "patreon|open_collective|ko_fi|custom|tier" .github/FUNDING.yml` exit 0 (D-03 sneak #1 + #3)
  - `grep -q "img.shields.io/github/sponsors/easyinplay" README.md` exit 0 (Sponsors badge insertion; F5)
  - `grep -c "sponsors/easyinplay" README.md` ≥ 2 (badge L8 + footer L190+ per § 5.4 sneak #4)
  - `wc -l README.md` ≤ 200 (Karpathy hard sister 6-phase 连续 hold; mitigation condense IF breach)
  - `grep -q "MAINTAINER-ONBOARDING" README.md` exit 0 (footer cross-link preserved)
  - `grep -q "stale-bot\|stale.yml" README.md` exit 0 (footer cross-link added)
  - YAML parse exit 0 (.github/FUNDING.yml)
- **decision_source**: CONTEXT § Decisions D-03 LOCKED single tier $1+ + RESEARCH § 4 (D-03 FUNDING.yml verbatim recipe + user manual prereq external) + RESEARCH § 5 (README badge insertion Discretion #1 + footer EXPAND delta arithmetic) + PATTERNS § 1 row 4 + row 7 + § 2.2 (~30% FUNDING NEW + ~85% README badge cluster reuse) + planner Discretion #1 TOP + FOOTER both + R8.5 verbatim "Sponsors 链接公开 + 可接受捐赠" + RESEARCH § 17.2 U1 FALLBACK forward-compatible

---

## Wave 1 done

All 4 atomic tasks complete. W1 main scope community infra ship-criteria all satisfied per PLAN.md Wave 1 success_criteria block. Phase 4.2 anchors R8.2 + R8.3 + R8.5 community infra delivered:
- T1.1 docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive (R8.2 anchor)
- T1.2 .github/workflows/stale.yml NEW ~45L D-02 LOCKED actions/stale@v10 60+30 split issue+PR (R8.3 anchor + R2 finding correction)
- T1.3 .github/ISSUE_TEMPLATE/ 4 NEW yml files D-03 supporting infra yml form-based (R8.3 anchor)
- T1.4 .github/FUNDING.yml NEW + README L8 badge + L190-192 footer EXPAND D-03 single tier $1+ (R8.5 anchor + planner Discretion #1 TOP + FOOTER both)

> **W2 ship close prereq from Wave 1 outputs**:
> - W1 T1.1 docs/MAINTAINER-ONBOARDING.md ≤150L (W2 T2.7 DOGFOOD Axis A verify source)
> - W1 T1.2 stale.yml + T1.3 ISSUE_TEMPLATE + T1.4 FUNDING.yml (W2 T2.7 DOGFOOD Axis B verify source — `.github/` NEW infra cluster)
> - W1 T1.4 README L8 badge + L190-192 footer (W2 T2.7 DOGFOOD Axis C verify source + W2 T2.4 combined deliverable)
> - Full test suite green pre-W2 (W2 T2.7 single baseline tag gating; sister Phase 4.1 cadence subset pattern)

---

## Wave 2 — Ship close (5 atomic + DOGFOOD + tag = 7 tasks; sister Phase 4.1 W2 7-task cadence subset 1:1 reuse; NO ADR 0018 + NO A7 iter + NO triple tag per PATTERNS § 5 R-5 mitigation延袭)

### T2.1 — .planning/STATE.md 续编 Phase 4.2 SHIPPED event log + 当前位置 块 v0.4.0 2/3 PROGRESS + L23 explicit 2-clock disambiguation note R-3 mitigation (combined with W0.1 D2 cadence iter 3 archive sub-step per sister § 8.2; sister Phase 4.1 W2 T2.1 cadence subset)

- **files_modified**:
  - `.planning/STATE.md` (MODIFY: append Phase 4.2 SHIPPED entry to 已完成 phase ship 历史 as 16th entry + update 当前位置 block v0.4.0 2/3 PROGRESS + L23 ADD explicit 2-clock disambiguation note "6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID — SEPARATE from v0.4.0 internal ship timeline)" per R-3 mitigation; NOTE W0.1 D2 archive sub-step already shipped at T0.1 per sister § 8.2 combined cadence — T2.1 only adds Phase 4.2 SHIPPED event log + 当前位置 update + L23 2-clock note on top of post-W0.1-trim baseline)
- **read_first**:
  - `.planning/STATE.md` post-W0.1 trim (verify ≤150L baseline IF W0.2 flip OR ≤200L IF defer + 当前位置 SSOT preserved)
  - `.planning/RETROSPECTIVE.md` post-T0.1 archive (verify `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section present per W0.1 archive)
  - existing 已完成 phase ship 历史 section (post-T0.1 trim has Phase 4.1 1-line pointer; Phase 4.2 = next entry as 16th)
  - `.planning/phase-4.2/RESEARCH.md` § 9.1 W2.T2.1 (sister Phase 4.1 W2 STATE.md 续编 cadence subset adapted per Phase 4.2 docs-only scope)
- **action**:
  1. Append to 已完成 phase ship 历史 section as 16th entry (post-Phase 4.1 15th):
     ```
     - **Phase 4.2 shipped** ✅ (2026-05-18) — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors (docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive preserve 6+2 sections + ADD 6 NEW sections A-F + .github/FUNDING.yml NEW D-03 single tier $1+ + .github/workflows/stale.yml NEW D-02 90-day issue+PR actions/stale@v10 R2 finding correction + .github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml + config.yml 4 NEW form-based + README L8 Sponsors badge + L190-192 footer EXPAND planner Discretion #1 TOP + FOOTER both + W0.1 D2 cadence iter 3 institutionalize Phase 4.0+4.1 → RETROSPECTIVE 3rd-iter terminus stable signal ≥3-iter + W0.2 conditional SIZE_LIMIT {200→150 FLIP DEFERRED #BA RESOLVED OR 200 DEFER #BA carry Phase 4.3 W0} per § 8.2 decision tree); v0.4.0 milestone 2/3 PROGRESS (next: Phase 4.3 v1.0-RC close R8.1 audit log + R8.4 ADR 全集 + milestone close 3-file archive triplet + 🎯 v0.4.0 close); NO ADR 0018 + NO triple tag per PATTERNS § 5 R-5 mitigation延袭; single baseline tag v0.4.0-alpha.2-community LOCAL (NO push)
     ```
  2. Update 当前位置 block:
     - **GSD phase chain**: prepend `✅ **Phase 4.2 SHIPPED** (2026-05-18 — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors + W0 backlog 1 项 #BA conditional + 4 D-decisions activated 闭环)` marker; preserve `**Phase 3.4 SHIPPED**` + `**Phase 4.1 SHIPPED**` literal STATE_POSITION_RE anchors for D-04 COLLAPSE freshness gate
     - **当前里程碑**: update v0.4.0 milestone progress `1/3 PROGRESS` → `2/3 PROGRESS` (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭); next Phase 4.3 v1.0-RC close R8.1 + R8.4
     - **下一 phase**: update to `**Phase 4.3 plan-phase 启动 prep**` (v0.4.0 milestone close + R8.1 audit log + R8.4 公开 ADR 全集 + v1.0-RC 收尾; sister Phase 3.4 W2 v0.3.0 close cadence延袭 — 3-file archive triplet + 🎯 v0.4.0 milestone close triple tag)
     - **状态**: `✅ Phase 4.2 SHIPPED — Wave 0+1+2 全 ship 2026-05-18` + community infra artifact (MAINTAINER-ONBOARDING EXPAND + 3 NEW .github/ + 4 NEW ISSUE_TEMPLATE + README badge+footer) + single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE (NO push per CLAUDE.md commit safety; user controls)
  3. **R-3 mitigation explicit 2-clock disambiguation note** add to L23 (per PATTERNS § 5 R-3 + RESEARCH § 7.3):
     ```
     **Note (D-04 HYBRID 2-clock disambiguation R-3 mitigation)**: 6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID — SEPARATE from v0.4.0 internal ship timeline; v0.4.0 ROADMAP 2-3 周 covers Phase 4.1 + 4.2 + 4.3 INTERNAL ship verified 1-day each; external 6-month organic clock runs Phase 4.3 close through v0.5/v1.0).
     ```
  4. Verify post-续编 STATE.md line count ≤150L (W0.2 flip path) OR ≤200L (W0.2 defer path); reviewer cross-check W0.2 conditional decision tree outcome per T0.2 Resolved block
  5. Run biome preempt: `pnpm exec biome check --write` (only .ts/.js/.mjs touched if any; STATE.md is .md — biome NOT scope, harmless idempotent — run anyway per project memory 5-recurrence terminus续延 discipline)
  6. **Recommended commit msg** (sister Phase 4.1 W2 T2.1 pattern延袭):
     - Subject: `docs(phase-4.2-w2): T2.1 — STATE.md 续编 Phase 4.2 SHIPPED event log + 当前位置 v0.4.0 2/3 PROGRESS + L23 R-3 2-clock disambiguation note (combined post-W0.1 D2 cadence iter 3 archive baseline)`
     - Body: Append 16th entry to 已完成 phase ship 历史: Phase 4.2 shipped ✅ (2026-05-18) — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors (4 D-decisions activated 闭环 + W0 backlog 1 项 #BA conditional + community infra publish). 当前位置 update: GSD phase chain prepend Phase 4.2 SHIPPED marker (preserve Phase 3.4 + Phase 4.1 SHIPPED literal STATE_POSITION_RE anchors); 当前里程碑 v0.4.0 1/3 → 2/3 PROGRESS (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister v0.3.0 cadence延袭); 下一 phase Phase 4.3 plan-phase 启动 prep (v0.4.0 milestone close R8.1 + R8.4 + v1.0-RC). **R-3 mitigation L23 2-clock disambiguation note added**: 6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID — SEPARATE from v0.4.0 internal ship timeline; v0.4.0 ROADMAP 2-3 周 covers Phase 4.1+4.2+4.3 INTERNAL ship verified 1-day each; external 6-month organic clock runs Phase 4.3 close through v0.5/v1.0). Sister Phase 4.1 W2 T2.1 cadence subset (combined with T0.1 W0.1 D2 cadence iter 3 archive baseline per sister § 8.2 institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal). Post-续编 STATE.md ≤150L (W0.2 flip path) OR ≤200L (W0.2 defer path) per T0.2 Resolved block.
  7. **Update Resolved (T2.1)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/STATE.md` post-续编 + `node scripts/check-state-archive-stale.mjs` exit code with ENFORCE=true + SIZE_LIMIT outcome)
- **acceptance_criteria**:
  - `grep -q "Phase 4.2 shipped\|Phase-4.2-SHIPPED" .planning/STATE.md` exit 0 (event log entry)
  - `grep -q "v0.4.0.*2/3\|v0.4.0 2/3" .planning/STATE.md` exit 0 (milestone block updated)
  - `grep -q "\\*\\*Phase 3\\.4 SHIPPED\\*\\*\\|\\*\\*Phase 4\\.1 SHIPPED\\*\\*\\|\\*\\*Phase 4\\.2 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (preserve STATE_POSITION_RE anchors for D-04 COLLAPSE freshness gate)
  - `grep -q "6-month external\|6 month external\|organic clock per D-04" .planning/STATE.md` exit 0 (R-3 mitigation L23 explicit 2-clock note)
  - `wc -l .planning/STATE.md` ≤ 150 (W0.2 flip path) OR ≤ 200 (W0.2 defer path; per T0.2 Resolved outcome)
  - `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (W0.1 ENFORCE=true Phase 4.1 already shipped + SIZE_LIMIT outcome per W0.2; CRITICAL: post-续编 PASS)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (freshness gate post-续编 — STATE_POSITION_RE OR-fallback)
- **decision_source**: sister Phase 4.1 W2 T2.1 STATE.md 续编 pattern cadence subset (Phase 4.2 community-infra publish narrower — combined with T0.1 per sister § 8.2 + R-3 mitigation L23 2-clock disambiguation explicit) + RESEARCH § 9.1 W2.T2.1 verbatim + PATTERNS § 1 row 8 + § 4 (~95% reuse mapping)

---

### T2.2 — .planning/RETROSPECTIVE.md 续编 Phase 4.2 milestone retrospective entry 7-section (sister Phase 4.1 W2 T2.2 6-section + bonus Next Phase Prep Notes = 7-section format 100% reuse) + receive W0.1 D2 auto-archive Phase 4.0+4.1 narrative section (already shipped at T0.1; this T2.2 adds Phase 4.2 7-section on top)

- **files_modified**:
  - `.planning/RETROSPECTIVE.md` (MODIFY append Phase 4.2 milestone retrospective entry 7-section ~+30-35L; ALREADY accepted W0.1 D2 auto-archive `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section at T0.1; this T2.2 adds Phase 4.2 retro on top)
- **read_first**:
  - `.planning/RETROSPECTIVE.md` tail 200 lines (verify Phase 4.1 retro 6-section + bonus Next Phase Prep Notes = 7-section pattern + sister Phase 2.4 retro 318L gold-standard reference + ARCHIVED FROM STATE — Phase 4.0+4.1 section from T0.1)
  - `.planning/phase-4.2/RESEARCH.md` § 9.1 W2.T2.2 (RETROSPECTIVE 续编 7-section pattern verbatim sister Phase 4.1 cadence)
  - `.planning/phase-4.2/PATTERNS.md` § 1 row 9 + § 4 (T2.2 mapping reuse ~92% Phase 4.1 6-section + bonus Next Phase Prep Notes = 7-section format 1:1 replicate)
- **action**:
  1. Append Phase 4.2 milestone retrospective entry covering 7-section sister Phase 4.1 W2 T2.2 + Phase 3.3 W2 T2.7 format:
     - **§ What worked**:
       - D-01 EXPAND 50L stub additive preserve 0-rewrite-risk (sister Karpathy "preserve existing v0.1 stub content acceptable baseline" minor wording polish only per R-1 mitigation)
       - D-02 90-day issue+PR sister GitHub default convention (actions/stale@v10 verified current per R2 § 2 finding correction; CONTEXT D-02 @v9 reference OUTDATED — R2 caught this critical drift)
       - D-03 single tier $1+ Karpathy YAGNI 反"pricing-design overhead"诱惑 (Sponsors dashboard tier definition lives separately per § 4.3; FUNDING.yml only points to account)
       - D-04 HYBRID 2-clock reconcile pattern用于 external-dependency phase (institutionalized for v0.5+ external-dependency phases; sister T3 DEFERRED #BB resolve)
       - W0.1 D2 cadence iter 3 stable 3rd-iter institutionalize terminus signal pattern ≥3-iter (sister 5-recurrence terminus heuristic — pattern stable beyond 2nd-iter Phase 4.1 W0.3)
     - **§ What was inefficient**:
       - 3 NEW .github/ first-time community-infra surface ~42% weighted avg W1 reuse vs Phase 4.1 W1 ~60% (first community-infra publication phase in project history — FUNDING.yml + stale.yml + ISSUE_TEMPLATE all NEW surface ~30-55% reuse only)
       - MAINTAINER-ONBOARDING EXPAND content quality balance (R-1 mitigation minor wording polish allowed within ADDITIVE EXPAND scope — required judgment call on which 6+2 existing sections needed v0.1 → v0.4 activated update)
     - **§ Patterns established**:
       - 8-phase 连续 deferred-items → next phase W0 一次根治 cadence延袭 (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2 = 8 phase consecutive 一次根治 cadence)
       - D2 cadence 3rd-iter fires institutionalize confirm ≥3-iter terminus per sister 5-recurrence terminus heuristic (Phase 3.4 W2 T2.2 1st-implementation + Phase 4.1 W0.3 2nd-iter + Phase 4.2 W0.1 3rd-iter terminus stable signal)
       - R-4 cadence consistency mitigation pattern (section header literal preserves "Phase 4.0+4.1" per sister cadence affirm L640 even though Phase 4.0 absent — disambiguated in content body footer)
     - **§ Cost patterns**:
       - Phase 4.2 内部 phase 1 day cadence延袭 (T3 external dependency = co-maintainer 招募 6-month 真正 clock SEPARATE per D-04 HYBRID — DOES NOT count v0.4.0 ship timeline)
       - **Internal infra ship clock**: 1 phase/day verified Phase 4.1 + Phase 4.2 (≤1 day track record sister cadence consecutive)
       - **External co-maintainer organic clock**: 6-month organic — OPENS post-v0.4.0 close runs through v0.5/v1.0 (NOT counted v0.4.0 ship timeline per R-3 mitigation 2-clock literal phrases enforcement)
     - **§ Key lessons**:
       - (i) D-01 ADDITIVE EXPAND > FULL REWRITE when stub content quality acceptable (0-day overhead + preserve audit history; sister Karpathy "preserve existing baseline" precedent)
       - (ii) D-03 single tier $1+ Karpathy YAGNI > multi-tier pre-v1.0 (pricing-design overhead要 community signal — NOT data pre-launch; Sponsors dashboard tier definition separate per § 4.3)
       - (iii) D-04 HYBRID 2-clock reconcile pattern用于 external-dependency phase (sister T3 cadence resolution after Phase 4.1 raise — institutionalized for v0.5+ external-dependency phases per RETROSPECTIVE Next Phase Prep Notes carry-forward heuristic)
       - (iv) U1 Sponsors account external prereq capture lesson (ship config forward-compatible per RESEARCH § 17.2 U1 — NOT block on bureaucracy; DOGFOOD Axis C verifies infra NOT button render; DEFERRED #BE registered IF user NOT activated by ship)
       - (v) R2 § 2 finding correction critical (actions/stale@v10 NOT @v9 per CONTEXT outdated reference — Wave A R2 fresh research caught upstream drift; institutionalize "verify upstream schema currency via [VERIFIED] tag in research phase NOT assume CONTEXT reference current")
     - **§ Cross-milestone trends**:
       - v0.4.0 第 2 phase 续延 Phase 4.1 同日 1-day cadence延袭 (sister 5-phase consecutive 1-day ship cadence从 Phase 3.4 起 5-day streak)
       - W0.1 D2 cadence iter 3 verify stable ≥3-iter terminus signal pattern (sister 5-recurrence terminus heuristic — pattern stable institutionalize standard)
       - 8-phase consecutive deferred-items absorb cadence 一次根治 pattern stable
     - **§ Next Phase Prep Notes (bonus 7th section sister Phase 4.1 W2 T2.2 cadence延袭)**:
       - Phase 4.3 = v1.0-RC close phase + v0.4.0 milestone close phase
       - Anchor requirements: R8.1 audit log (路由透明度日志) + R8.4 公开 ADR 全集 + v1.0-RC 收尾
       - Ship cadence: triple tag close cadence per sister v0.3.0 close (3 alpha tags + final milestone tag) — Phase 4.3 = adr-NNNN-accepted (IF new ADR) + v0.4.0-alpha.3-audit + 🎯 v0.4.0 milestone close triple-push
       - Milestone close: 3-file archive triplet sister v0.3.0 close pattern (.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md inaugurate)
       - DEFERRED carry-forward Phase 4.3 W0: #BA conditional FLIP OR DEFER outcome (per § 8.2 decision tree) + #AH path traversal regex hardening + #BC v0.5+ benchmark expand evaluation + #BD regex 2-pass validation + #BE Sponsors account activation external prereq (IF user NOT activated by Phase 4.2 ship) + #BF CODEOWNERS .github/** defer
  2. **Already accepted W0.1 D2 auto-archive per T0.1** (Phase 4.0+4.1 narrative section moved STATE → RETRO per D2 cadence 3rd-iter as `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section); reviewer cross-check section present post-T0.1
  3. Run biome preempt (.md not biome scope; harmless idempotent run)
  4. **Recommended commit msg**:
     - Subject: `docs(phase-4.2-w2): T2.2 — RETROSPECTIVE.md 续编 Phase 4.2 milestone retrospective 7-section (sister Phase 4.1 W2 T2.2 6-section + bonus Next Phase Prep Notes = 7-section format 100% reuse)`
     - Body: 7-section retro per sister cadence: § What worked (D-01~D-04 all activated 闭环 + W0.1 D2 cadence iter 3 stable 3rd-iter terminus signal) + § What was inefficient (3 NEW .github/ first-time community-infra surface ~42% weighted avg W1 reuse drag + MAINTAINER-ONBOARDING content quality judgment) + § Patterns established (8-phase consecutive deferred-items → next phase W0 一次根治 cadence + D2 cadence 3rd-iter terminus stable ≥3-iter + R-4 cadence consistency mitigation pattern) + § Cost patterns (内部 phase 1 day cadence; **Internal infra ship clock** + **External co-maintainer organic clock** both literal phrases per R-3 mitigation enforcement) + § Key lessons (5 lessons D-01 + D-03 + D-04 + U1 + R2 finding rationale) + § Cross-milestone trends (v0.4.0 2nd phase 续延 Phase 4.1 同日 1-day cadence sister 5-phase consecutive streak; D2 iter 3 terminus signal) + § Next Phase Prep Notes (Phase 4.3 v1.0-RC close phase R8.1 audit log + R8.4 ADR 全集 + milestone close 3-file archive triplet + 🎯 v0.4.0 triple tag + DEFERRED carry-forward). W0.1 D2 cadence iter 3 auto-archive `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section already accepted at T0.1 (Phase 4.1 narrative verbatim relocated STATE.md → RETROSPECTIVE.md per D2 standing process 3rd-iter terminus stable signal beyond 2nd-iter Phase 4.1 W0.3 + R-4 cadence consistency mitigation Phase 4.0 absence disambiguation).
  5. **Update Resolved (T2.2)** block at task_plan.md top with outcome (PENDING → 实占 values: `wc -l .planning/RETROSPECTIVE.md` post-续编 + 7-section grep verify)
- **acceptance_criteria**:
  - `grep -q "Phase 4.2" .planning/RETROSPECTIVE.md` exit 0
  - `grep -c "^### §\|^## §\|^### \\*\\*§\|What worked\|Patterns established\|Key lessons\|Cross-milestone\|Next Phase Prep Notes\|Cost patterns" .planning/RETROSPECTIVE.md` ≥ 7 (7-section retro pattern)
  - `grep -q "What worked\|Patterns established\|Key lessons\|Cross-milestone trends" .planning/RETROSPECTIVE.md` exit 0 (sister Phase 4.1 7-section format)
  - `grep -q "Internal infra ship clock" .planning/RETROSPECTIVE.md` exit 0 (R-3 mitigation 2-clock literal phrase #1)
  - `grep -q "External co-maintainer organic clock" .planning/RETROSPECTIVE.md` exit 0 (R-3 mitigation 2-clock literal phrase #2)
  - `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1" .planning/RETROSPECTIVE.md` exit 0 (W0.1 D2 cadence iter 3 archive section from T0.1 present — terminus signal stable 3rd-iter)
  - `grep -q "Next Phase Prep Notes" .planning/RETROSPECTIVE.md` exit 0 (bonus 7th section sister Phase 4.1 W2 T2.2 cadence)
- **decision_source**: sister Phase 4.1 W2 T2.2 RETROSPECTIVE.md 6-section + bonus Next Phase Prep Notes = 7-section format + sister Phase 2.4 retro 318L gold-standard reference + RESEARCH § 9.1 W2.T2.2 + PATTERNS § 1 row 9 + § 4 (~92% reuse) + R-3 mitigation 2-clock literal phrases enforcement per RESEARCH § 7.3

---

### T2.3 — .planning/ROADMAP.md Phase 4.2 ✅ SHIPPED + v0.4.0 milestone 2/3 PROGRESS marker + L185 inline D-04 HYBRID 2-clock reconcile note R-3 mitigation (sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭; NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)

- **files_modified**:
  - `.planning/ROADMAP.md` (MODIFY L216-218 area Phase 4.2 entry add ✅ SHIPPED 2026-05-18 marker + L185 v0.4.0 milestone PROGRESS update 1/3 → 2/3 + L185 inline 2-clock reconcile note R-3 mitigation + Phase 4.3 next phase kickoff reference)
- **read_first**:
  - `.planning/ROADMAP.md` L185-225 (verify v0.4.0 milestone block + L216-218 Phase 4.2 entry + sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal pattern + Phase 4.1 ✅ SHIPPED L210-215 sister entry format)
- **action**:
  1. Mark Phase 4.2 entry (L216-218 area) as ✅ SHIPPED (2026-05-18) + brief outcome summary (sister Phase 4.1 L210-215 verbose 5-bullet format延袭):
     ```
     - **Phase 4.2: co-maintainer onboarding + stale-bot + GitHub Sponsors** ✅ SHIPPED (2026-05-18)
       - co-maintainer 招募窗口启动 + 90 天 stale-bot 上线 + Sponsors 启用 → docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive (preserve 6+2 sections + ADD 6 NEW A-F) + .github/workflows/stale.yml NEW ~45L D-02 actions/stale@v10 (R2 § 2 finding correction NOT @v9) 60+30 split issue+PR + .github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml + config.yml 4 NEW yml form-based per planner Discretion #3 + .github/FUNDING.yml NEW D-03 single tier $1+ Karpathy YAGNI + README L8 Sponsors badge + L190-192 footer EXPAND planner Discretion #1 TOP + FOOTER both
       - 验收: R8.2 "外部新人 30 分钟可跑通 dev 环境" ✅ + R8.3 "stale-bot 自动关闭 90 天无活动 issue + issue 模板使用率 ≥ 80%" ✅ (blank_issues_enabled false 100% adoption defender) + R8.5 "Sponsors 链接公开 + 可接受捐赠" ✅ (user manual prereq Sponsors account activation external — FALLBACK ship forward-compatible per RESEARCH § 17.2 U1)
       - W0 backlog 1 项 #BA conditional: D1 SIZE_LIMIT round 2 tighten 200→150 {FLIP DEFERRED #BA RESOLVED via W0.1 D2 cadence iter 3 trim STATE ≤140L pre-verified / OR DEFER #BA carry Phase 4.3 W0} per § 8.2 decision tree; W0.1 D2 cadence iter 3 institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal (sister M2 backlog discharge pattern stable beyond Phase 4.1 W0.3 2nd-iter)
     ```
  2. Update v0.4.0 milestone progress at section header (currently L185 `## v0.4.0 — dogfooding benchmark + 稳定期（2-3 周） — **1/3 PROGRESS** (Phase 4.1 SHIPPED 2026-05-18)`):
     - Update inline progress marker: `## v0.4.0 — dogfooding benchmark + 稳定期 (2-3 周) — **2/3 PROGRESS** (Phase 4.1 SHIPPED 2026-05-18 + Phase 4.2 SHIPPED 2026-05-18)`
     - NOTE: NO `SHIPPED ARCHIVED` marker yet (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 reserved for milestone close = Phase 4.3 ship)
  3. Add L185 inline D-04 HYBRID 2-clock reconcile note R-3 mitigation per RESEARCH § 7.2 + PATTERNS § 5 R-3:
     ```
     > **Note (D-04 HYBRID 2-clock reconcile R-3 mitigation)**: 2-3 周 internal ship clock 已验证 Phase 4.1 + 4.2 ≤1 day each (sister 1-phase/day cadence延袭); external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5/v1.0 (NOT counted in v0.4.0 ship timeline; sister T3 DEFERRED #BB resolve via HYBRID 2-clock LOCK).
     ```
  4. Add Phase 4.3 next phase kickoff reference IF not already present (R8.1 audit log + R8.4 ADR 全集 + v1.0-RC close + milestone close 3-file archive triplet per CONTEXT carry):
     ```
     - **Phase 4.3: v1.0-RC close + milestone close** — discuss-phase 启动 prep (R8.1 audit log 路由透明度日志 + R8.4 公开 ADR 全集 + v1.0-RC 收尾 + 🎯 v0.4.0 milestone close 3-file archive triplet sister v0.3.0 close cadence延袭)
     ```
  5. **Recommended commit msg**:
     - Subject: `docs(phase-4.2-w2): T2.3 — ROADMAP.md Phase 4.2 ✅ SHIPPED + v0.4.0 milestone 2/3 PROGRESS + L185 inline R-3 2-clock reconcile note (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister v0.3.0 close cadence延袭)`
     - Body: L216-218 Phase 4.2 entry mark ✅ SHIPPED 2026-05-18 + brief outcome summary (4 D-decisions activated 闭环 + R8.2 + R8.3 + R8.5 acceptance bar satisfied + W0 backlog 1 项 #BA conditional + community infra publish). v0.4.0 milestone progress 1/3 → 2/3 PROGRESS (sister L130 v0.3.0 progress pattern延袭). **R-3 mitigation L185 inline 2-clock reconcile note added**: 2-3 周 internal ship clock 已验证 Phase 4.1 + 4.2 ≤1 day each (sister 1-phase/day cadence延袭); external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5/v1.0 (NOT counted in v0.4.0 ship timeline). Phase 4.3 next phase discuss-phase 启动 prep reference added (R8.1 audit log + R8.4 ADR 全集 + v1.0-RC 收尾 + 🎯 v0.4.0 milestone close 3-file archive triplet). NO `SHIPPED ARCHIVED` marker (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 reserved for milestone close = Phase 4.3 ship per sister cadence延袭). Sister Phase 4.1 W2 T2.3 1:1 replicate with content swap.
- **acceptance_criteria**:
  - `grep -q "Phase 4.2.*✅ SHIPPED\|Phase 4.2.*SHIPPED.*2026-05-18\|Phase 4.2 shipped ✅" .planning/ROADMAP.md` exit 0
  - `grep -q "v0.4.0.*2/3\|v0.4.0 2/3" .planning/ROADMAP.md` exit 0
  - `! grep -q "v0.4.0.*SHIPPED ARCHIVED" .planning/ROADMAP.md` exit 0 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)
  - `grep -q "Phase 4.3" .planning/ROADMAP.md` exit 0 (next phase reference)
  - `grep -q "D-04 HYBRID\|2-clock\|internal ship clock\|organic clock" .planning/ROADMAP.md` exit 0 (R-3 mitigation L185 inline 2-clock note)
- **decision_source**: sister Phase 4.1 W2 T2.3 ROADMAP.md 续编 pattern + sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭 + RESEARCH § 7.2 + PATTERNS § 1 row 10 + § 4 + § 5 R-3 mitigation L185 inline 2-clock reconcile note explicit

---

### T2.4 — README.md L9 Status freshness + v0.4.0 2/3 marker + Phase 4.2 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭; FRONT_MATTER_DOCS transparency gate; W1 T1.4 L8 Sponsors badge + L190-192 footer EXPAND already shipped at W1)

- **files_modified**:
  - `README.md` (MODIFY L9 Status freshness header update Phase 4.2 SHIPPED + v0.4.0 2/3 + L48 area MILESTONE row v0.4.0 1/3 → 2/3 + add Phase 4.2 entry to shipped phase list; NOTE W1 T1.4 already shipped L8 Sponsors badge + L190-192 footer EXPAND — this T2.4 only adds W2 STATUS_MARKER updates on top)
- **read_first**:
  - `README.md` L1-60 (verify L9 Status header + L48 MILESTONE row pattern post-Phase 4.1 ship; sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path)
  - `README.md` L188-201 (verify post-W1 T1.4 footer Sponsor section EXPAND state + Sponsors badge L8 preserved)
- **action**:
  1. Update L9 Status freshness header to reflect Phase 4.2 SHIPPED + v0.4.0 2/3 (sister Phase 4.1 W2 STATUS_MARKER path pattern):
     ```
     > **Status:** 🎯 **v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED 2026-05-16** ... · 🎯 **v0.3.0 MILESTONE 4/4 SHIPPED & ARCHIVED 2026-05-17** ... · **v0.4.0 MILESTONE 2/3 PROGRESS** (Phase 4.1 + 4.2 SHIPPED 2026-05-18; Phase 4.3 pending; NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister v0.3.0 close cadence延袭) · **Phase 4.2 SHIPPED 2026-05-18** — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors (docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive + .github/workflows/stale.yml NEW D-02 actions/stale@v10 R2 finding correction + .github/ISSUE_TEMPLATE/ 4 NEW yml form-based + .github/FUNDING.yml NEW D-03 single tier $1+ + README L8 Sponsors badge + L190-192 footer EXPAND + W0.1 D2 cadence iter 3 institutionalize 3rd-iter terminus stable signal + W0.2 conditional SIZE_LIMIT outcome). Next: Phase 4.3 v1.0-RC close + 🎯 v0.4.0 milestone close.
     ```
  2. Update L48 area MILESTONE row v0.4.0 progress 1/3 → 2/3 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 literal cadence延袭):
     ```
     - **v0.4.0 MILESTONE 2/3 PROGRESS** 🚧（Phase 4.1 + 4.2 SHIPPED 2026-05-18; Phase 4.3 pending; NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭; progress 16/17 = 94.1%; PATTERNS § 5 R-5 mitigation NO ADR 0018 + NO ci.yml A7 iter + NO triple tag Phase 4.2 = community infra publish NOT architectural decision NOT milestone close; single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only NO push pending user approval; next: Phase 4.3 v1.0-RC close + 🎯 v0.4.0 milestone close）
     ```
  3. Add Phase 4.2 entry to shipped phase list (sister Phase 4.1 + 3.4 + 3.3 + 3.2 + 3.1 row pattern延袭):
     ```
     - **Phase 4.2 shipped** ✅ (2026-05-18 — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors; docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive (preserve 6+2 sections + ADD 6 NEW A-F + R8.2 "30 分钟可跑通 dev 环境" 验收 satisfied) + .github/workflows/stale.yml NEW ~45L D-02 actions/stale@v10 (R2 § 2 finding correction NOT @v9 outdated) 60+30 split 90-day issue+PR + .github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml + config.yml 4 NEW yml form-based per planner Discretion #3 (R8.3 80% adoption defender blank_issues_enabled false) + .github/FUNDING.yml NEW D-03 single tier $1+ Karpathy YAGNI + README L8 Sponsors badge + L190-192 footer EXPAND planner Discretion #1 TOP + FOOTER both (R8.5 acceptance satisfied; user manual prereq Sponsors account activation external — FALLBACK forward-compatible) + W0 backlog 1 项 conditional #BA D1 SIZE_LIMIT round 2 tighten 200→150 {FLIP DEFERRED #BA RESOLVED OR DEFER #BA carry Phase 4.3 W0} per § 8.2 decision tree + W0.1 D2 cadence iter 3 institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal sister M2 backlog discharge + 4 D-decisions activated 闭环 D-01 EXPAND additive + D-02 90-day issue+PR @v10 + D-03 single tier $1+ + D-04 HYBRID 2-clock process-level + PATTERNS § 5 R-5 mitigation 3 NO 守门 NO ADR 0018 + NO ci.yml A7 iter + NO triple tag single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭 reserves milestone close for Phase 4.3); F1-F8 8/8 acceptance bar; STRIDE 7-node threats mitigated per `<threats_open>` PLAN.md block; v0.4.1→ tests delta TBD (community-infra publish phase NO src code change; 0 NEW tests; W0.2 IF FLIP path 1-line .mjs config flip regression covered by existing check-state-archive-stale tests); STATE.md post-W0.1 + W2 续编 ≤150L (W0.2 flip) OR ≤200L (W0.2 defer); v0.4.0 milestone 2/3 PROGRESS）
     ```
  4. **Recommended commit msg**:
     - Subject: `docs(phase-4.2-w2): T2.4 — README.md L9 Status freshness Phase 4.2 SHIPPED + v0.4.0 2/3 + Phase 4.2 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭)`
     - Body: L9 Status header update + L48 area MILESTONE row v0.4.0 1/3 → 2/3 (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close) + shipped phase list append Phase 4.2 entry (sister Phase 4.1 + 3.4 + 3.3 + 3.2 + 3.1 row pattern延袭). W1 T1.4 already shipped L8 Sponsors badge + L190-192 footer EXPAND at W1 (this T2.4 only adds W2 STATUS_MARKER updates on top). Freshness gate node scripts/check-transparency-verdicts.mjs exit 0 post-MODIFY (STATE_POSITION_RE OR-fallback matches Phase 4.2 SHIPPED literal). Sister Phase 4.1 W2 T2.4 1:1 replicate with content swap. README total ≤ 200L hard cap maintained (W1 T1.4 footer EXPAND + W2 T2.4 STATUS_MARKER delta within budget; mitigation condense IF breach).
- **acceptance_criteria**:
  - `grep -q "Phase 4.2" README.md` exit 0
  - `grep -q "v0.4.0.*2/3\|v0.4.0 2/3" README.md` exit 0
  - `! grep -q "v0.4.0.*SHIPPED ARCHIVED" README.md` exit 0 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)
  - `grep -q "Phase 4.2 SHIPPED" README.md` exit 0 (L9 Status freshness)
  - `grep -q "sponsors/easyinplay" README.md` exit 0 (W1 T1.4 badge + footer preserved)
  - `wc -l README.md` ≤ 200 (Karpathy hard sister 6-phase 连续 hold; mitigation condense IF breach)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (freshness gate post-MODIFY pass — STATE_POSITION_RE OR-fallback for Phase 4.2 SHIPPED literal)
- **decision_source**: sister Phase 4.1 W2 T2.4 STATUS_MARKER path + 5-recurrence terminus D-04 COLLAPSE pattern延袭 + PATTERNS § 1 row 11 + § 4 (~98% reuse) + RESEARCH § 9.1 W2.T2.4 + W1 T1.4 already shipped badge + footer combined deliverable (NOT touch this T2.4)

---

### T2.5 — PROJECT-SPEC.md L3 Status header add Phase 4.2 SHIPPED literal + L6 下一步 Phase 4.3 candidate (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)

- **files_modified**:
  - `PROJECT-SPEC.md` (MODIFY L3 Status header add Phase 4.2 SHIPPED literal sister Phase 4.1 W2 T2.5 pattern + L6 下一步 Phase 4.3 candidate update)
- **read_first**:
  - `PROJECT-SPEC.md` L1-15 (verify L3 Status header structure post-Phase 4.1 ship + L6 下一步 area pattern)
- **action**:
  1. Update L3 Status header add Phase 4.2 SHIPPED literal (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern):
     ```
     > Status: Phase 4.2 SHIPPED ✅ (2026-05-18 — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors); previous: Phase 4.1 SHIPPED ✅ (2026-05-18 — dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor); Phase 3.4 SHIPPED ✅ (2026-05-17 — routing 命中率 ≥ 85% 验收 + token budget doctor 8th check + v0.3.0 milestone close)
     ```
  2. Update L6 下一步 area Phase 4.3 candidate (sister Phase 4.1 W2 T2.5 L6 下一步 update pattern):
     ```
     > 下一步: Phase 4.3 plan-phase 启动 prep (v0.4.0 milestone close + R8.1 audit log + R8.4 公开 ADR 全集 + v1.0-RC 收尾 + 🎯 v0.4.0 milestone close 3-file archive triplet sister v0.3.0 close cadence延袭)
     ```
  3. **Recommended commit msg**:
     - Subject: `docs(phase-4.2-w2): T2.5 — PROJECT-SPEC.md L3 Status header Phase 4.2 SHIPPED literal + L6 下一步 Phase 4.3 (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)`
     - Body: L3 Status header add Phase 4.2 SHIPPED literal (preserve previous: Phase 4.1 + Phase 3.4 SHIPPED for context) + L6 下一步 Phase 4.3 plan-phase 启动 prep candidate (v0.4.0 milestone close + R8.1 + R8.4 + v1.0-RC + 🎯 v0.4.0 close 3-file archive triplet). Freshness gate node scripts/check-transparency-verdicts.mjs exit 0 post-MODIFY (FRONT_MATTER_DOCS transparency gate pass). Sister Phase 4.1 W2 T2.5 1:1 replicate.
- **acceptance_criteria**:
  - `grep -q "Phase 4.2" PROJECT-SPEC.md` exit 0
  - `grep -q "Phase 4.3" PROJECT-SPEC.md` exit 0 (L6 下一步 reference)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (FRONT_MATTER_DOCS transparency gate pass)
- **decision_source**: sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭 + PATTERNS § 1 row 12 + § 4 (~98% reuse)

---

### T2.6 — ci.yml VERIFY 0 diff sneak-block守门 (sister Phase 4.1 W2 T2.6 reuse — verify-only NO commit; Phase 4.2 NO ADR added → no A7 iter; NO ci.yml step insert for stale.yml is SEPARATE new workflow file)

- **files_modified**: NONE (verify-only task; NO commit)
- **read_first**:
  - `.github/workflows/ci.yml` (by Read — verify post-W0 + post-W1 + post-W2 状态 unchanged 0 diff; sister Phase 4.1 W2 T2.6 baseline)
  - `.planning/phase-4.2/RESEARCH.md` § 11 (A7 守恒 verify post-Phase 4.2 ship verbatim + ci.yml UNCHANGED rationale)
  - `.planning/phase-4.2/PATTERNS.md` § 3 "NO ADR 0018 + NO ci.yml A7 iter + NO triple tag" 3 NO 守门 cluster
- **action**:
  1. **ci.yml VERIFY 0 diff sneak-block** (sister Phase 4.1 W2 T2.6 cadence延袭):
     ```bash
     git diff HEAD -- .github/workflows/ci.yml
     # Expected: empty output (Phase 4.2 NO ci.yml edit; community infra publish NOT architectural decision NOT requiring A7 iter)
     ```
  2. **Verify .github/workflows/stale.yml is SEPARATE new workflow file NOT ci.yml step insert** (sister Phase 4.1 cadence延袭 sneak-block):
     ```bash
     # Verify stale.yml is separate file
     test -f .github/workflows/stale.yml && echo "stale.yml SEPARATE file present"
     # Verify NO stale step insert in ci.yml
     grep -c "stale\|FUNDING\|sponsors" .github/workflows/ci.yml
     # Expected: 0 (NO stale/FUNDING/sponsors references in ci.yml — they live in separate stale.yml + FUNDING.yml files)
     ```
  3. **A7 守恒 verify** (sister Phase 4.1 W2 T2.6 cadence延袭; ADR 0001-0017 main body 0 diff post-Phase 4.2):
     ```bash
     for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017; do
       diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null)
       if [ -n "$diff_out" ]; then
         echo "FAIL: ADR ${n} main body changed since adr-${n}-accepted tag"
         exit 1
       fi
     done
     echo "A7 ✅ ADR 0001-0017 main body unchanged post-Phase-4.2"
     ```
  4. **PATTERNS § 3 3 NO 守门 verify** (sister Phase 4.1 cadence延袭):
     - NO ADR 0018: `git diff --name-only HEAD~10 HEAD docs/adr/` returns 0 new files (Phase 4.2 = community infra publish NOT architectural decision per sister Phase 4.1 cadence延袭; R8.4 ADR 全集 deferred Phase 4.3 per Deferred Ideas)
     - NO ci.yml A7 iter: `git diff HEAD -- .github/workflows/ci.yml | wc -l` == 0 (no NEW ADR → no A7 step iter required)
     - NO triple tag: verified at T2.7 (single baseline tag `v0.4.0-alpha.2-community` LOCAL only; NO `adr-0018-accepted` + NO `🎯 v0.4.0` milestone close tag)
  5. **NO commit** for T2.6 (verify-only task — outputs documented in DOGFOOD-T2.X.md W2 T2.7)
  6. **IF any verify FAILS**: escalate to planner + investigate; do NOT proceed to T2.7 until ci.yml diff 0 + A7 守恒 PASS
- **acceptance_criteria**:
  - `git diff HEAD -- .github/workflows/ci.yml | wc -l` == 0 (T2.6 verify 0 diff sneak-block — NO A7 iter Phase 4.2)
  - `grep -c "stale\|FUNDING\|sponsors" .github/workflows/ci.yml` == 0 (sister Phase 4.1 cadence延袭 sneak-block; stale.yml is SEPARATE new workflow file)
  - A7 loop ADR 0001-0017 all `git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md"` empty (main body 0 diff post-Phase-4.2)
  - `git diff --name-only HEAD~10 HEAD docs/adr/` returns 0 new files (NO ADR 0018 sneak — R-5 mitigation)
- **decision_source**: sister Phase 4.1 W2 T2.6 ci.yml VERIFY 0 diff sneak-block reuse + RESEARCH § 11 A7 守恒 verify post-Phase 4.2 verbatim + PATTERNS § 3 3 NO 守门 cluster (NO ADR 0018 + NO ci.yml A7 iter + NO triple tag) + PATTERNS § 5 R-5 mitigation

---

### T2.7 — .planning/phase-4.2/DOGFOOD-T2.X.md NEW ~55-60L PASS 3/3 axes (sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse; 3-axis empirical evidence) + Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push per CLAUDE.md commit safety; sister Phase 4.1 single-baseline pattern延袭 — Phase 4.2 NOT milestone close = 1 tag only per PATTERNS § 5 R-5 mitigation)

- **files_modified**:
  - `.planning/phase-4.2/DOGFOOD-T2.X.md` (NEW ~55-60L per RESEARCH § 13 + sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse; 3-axis empirical evidence + Date/Verdict header + Aggregate verification + Disposition)
  - git tags (no file change; single tag creation LOCAL only; NO push pending user explicit request)
- **read_first**:
  - `.planning/phase-4.1/DOGFOOD-T2.X.md` entire (sister 3-axis DOGFOOD format model + PASS verdict shape)
  - `docs/MAINTAINER-ONBOARDING.md` post-T1.1 (Axis A verify source — wc -l ≥100 ≤150 + 6 NEW section literal)
  - `.github/workflows/stale.yml` + `.github/FUNDING.yml` + `.github/ISSUE_TEMPLATE/*.yml` post-T1.2 + T1.3 + T1.4 (Axis B verify source — NEW infra cluster 5 files actions/stale@v10 + blank_issues_enabled false + github: easyinplay)
  - `README.md` post-W1 T1.4 + W2 T2.4 (Axis C verify source — Sponsors badge L8 + footer 2-cross-link)
  - `.planning/STATE.md` post-W2 T2.1 (Axis C verify source — L23 2-clock disambiguation note R-3 mitigation)
  - `.planning/RETROSPECTIVE.md` post-W2 T2.2 (Axis C verify source — § Cost patterns 2-clock literal phrases R-3 mitigation)
- **action**:
  1. Create NEW file `.planning/phase-4.2/DOGFOOD-T2.X.md` ~55-60L 3-axis empirical evidence per sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse:
     - **Header** (~6L): title + Date 2026-05-18 + Phase 4.2 v0.4.0 milestone 2/3 PROGRESS + Anchors R8.2 + R8.3 + R8.5 + Verdict **PASS** (3/3 dogfood axes verified, miss: none)
     - **Axis A — docs/MAINTAINER-ONBOARDING.md EXPAND verify D-01 LOCKED ADDITIVE** (~14L):
       - Setup: D-01 LOCKED ADDITIVE EXPAND preserve 6+2 sections verbatim + ADD 6 NEW sections A-F per § 2.2 ordering; R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境" satisfied via hybrid narrative + commands
       - Action: `wc -l docs/MAINTAINER-ONBOARDING.md` ≥100 ≤150 + `grep -c "^## " docs/MAINTAINER-ONBOARDING.md` ≥ 12 + grep 6 NEW section literal
       - Acceptance: ≤150L Karpathy hard + 6 NEW section + 8 existing preserved + reference CONTRIBUTING.md NOT duplicate (D-01 sneak #3 守门)
       - Status: ✅ PASS
     - **Axis B — .github/ NEW infra cluster verify D-02 + D-03 + supporting infra** (~16L):
       - Setup: 5 NEW .github/ files first-time community-infra surface — FUNDING.yml D-03 single tier + workflows/stale.yml D-02 60+30 split 90-day issue+PR actions/stale@v10 (R2 § 2 finding correction NOT @v9) + 4 NEW ISSUE_TEMPLATE yml form-based D-03 supporting infra per planner Discretion #3 + config.yml blank_issues_enabled false R8.3 80% adoption defender
       - Action: `test -f .github/FUNDING.yml + grep '^github: easyinplay' + test -f .github/workflows/stale.yml + grep 'actions/stale@v10' + grep -E 'days-before-(issue|pr)-(stale|close)' wc -l == 4 + ls .github/ISSUE_TEMPLATE/*.yml | wc -l == 4 + grep 'blank_issues_enabled: false' config.yml`
       - Acceptance: 5 NEW files (1 FUNDING + 1 stale.yml + 4 ISSUE_TEMPLATE) actions/stale@v10 pinned R2 finding correction + 60+30 split issue+PR + STRIDE E + D mitigation
       - Status: ✅ PASS
     - **Axis C — README Sponsors badge + footer + D-04 HYBRID 2-clock process-level verify R-3 mitigation + T2.6 ci.yml VERIFY 0 diff** (~16L):
       - Setup: README L8 Sponsors badge + L190-192 footer EXPAND planner Discretion #1 TOP + FOOTER both; D-04 HYBRID 2-clock process-level verification (STATE.md L23 + RETROSPECTIVE § Cost patterns both literal phrases per R-3 mitigation); T2.6 ci.yml VERIFY 0 diff sneak-block (sister Phase 4.1 reuse — NO A7 iter Phase 4.2 = community infra publish NOT architectural decision)
       - Action: `grep 'img.shields.io/github/sponsors/easyinplay' README.md + grep -c 'sponsors/easyinplay' README.md ≥ 2 + STATE.md grep '6-month external\|organic clock' + RETROSPECTIVE grep 'Internal infra ship clock' + 'External co-maintainer organic clock' + git diff HEAD .github/workflows/ci.yml | wc -l == 0 + grep -c 'stale|FUNDING|sponsors' .github/workflows/ci.yml == 0`
       - Acceptance: badge present + footer 2-cross-link + 2-clock literal phrases both present STATE + RETRO + ci.yml 0 diff verify
       - **Note (Axis C external prereq R8.5)**: Sponsor button render on repo page https://github.com/easyinplay/harnessed REQUIRES user manual Sponsors account activation at https://github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state). Phase 4.2 ships config + Axis C verifies infra NOT button render. FALLBACK accepted per RESEARCH § 17.2 U1 — ship forward-compatible; DEFERRED #BE registered IF user NOT activated by Phase 4.2 ship.
       - Status: ✅ PASS
     - **Aggregate verification** (~6L):
       - R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境": ✅ Axis A
       - R8.3 acceptance "stale-bot 自动关闭 90 天无活动 issue + issue 模板使用率 ≥ 80%": ✅ Axis B (blank_issues_enabled false 100% adoption defender)
       - R8.5 acceptance "Sponsors 链接公开 + 可接受捐赠": ✅ Axis B + Axis C (infra verified; button render external prereq U1 fallback accepted)
       - W0.1 D2 cadence iter 3 institutionalize verify M2 backlog discharge 3rd-iter terminus stable signal ≥3-iter: ✅ Axis C
       - T2.6 ci.yml VERIFY 0 diff sneak-block: ✅ (NO A7 iter Phase 4.2)
     - **Disposition** (~6L):
       - ✅ T2.7 dogfood PASS 3/3 axes verified miss: none
       - ✅ R8.2 + R8.3 + R8.5 acceptance criteria 全 verified
       - ✅ Phase 4.2 ship-readiness 4 D-decisions 全 activated 闭环 (D-01 EXPAND + D-02 @v10 + D-03 single tier + D-04 HYBRID 2-clock process-level)
       - ✅ DEFERRED #BA conditional {FLIP RESOLVED OR DEFER carry Phase 4.3 W0} per § 8.2 decision tree; #BB ✅ pre-RESOLVED discuss-phase HYBRID 2-clock D-04
       - ✅ PATTERNS § 5 R-5 mitigation 3 NO 守门 (NO ADR 0018 + NO ci.yml A7 iter + NO triple tag — single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only)
       - ✅ v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭)
       - **Note**: Phase 4.2 = v0.4.0 milestone 2nd phase = R8.2 + R8.3 + R8.5 anchors; R8.1 audit log + R8.4 公开 ADR 全集 + v1.0-RC 收尾 → Phase 4.3 explicit out-of-scope per CONTEXT Deferred Ideas; single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push).
  2. Karpathy hard limit verify: `wc -l .planning/phase-4.2/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 4.1 DOGFOOD-T2.X.md 58L precedent)
  3. **PRE-TAG VERIFY GATES** (all must pass before tag creation):
     - All preceding W2 tasks T2.1-T2.6 complete
     - Full test suite green: `pnpm test 2>&1 | tail -5 | grep -E "Tests.*passed|0 failed"` exit 0 (Phase 4.2 community-infra publish phase — 0 NEW tests expected; existing tests unchanged)
     - DOGFOOD-T2.X.md PASS 3/3 axes verified per step 1
     - Freshness gate post-W2: `node scripts/check-transparency-verdicts.mjs` exit 0
     - W0.1 ENFORCE=true + W0.2 SIZE_LIMIT outcome post-W2: `node scripts/check-state-archive-stale.mjs` exit 0
     - All Karpathy hard caps verified: MAINTAINER-ONBOARDING ≤150L + stale.yml ≤60L + FUNDING.yml ≤8L + ISSUE_TEMPLATE per-file ≤80L + DOGFOOD-T2.X.md ≤60L + README ≤200L + STATE.md ≤150L (W0.2 flip) OR ≤200L (W0.2 defer)
  4. **Tag baseline single tag LOCAL CREATE only** (sister Phase 4.1 single-baseline cadence延袭 — Phase 4.2 NOT milestone close + NO ADR 0018 baseline + NO 🎯 v0.4.0 milestone close per PATTERNS § 5 R-5 mitigation single baseline tag only):
     ```bash
     git tag -a v0.4.0-alpha.2-community -m "Phase 4.2 SHIPPED (co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors; docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive + .github/workflows/stale.yml NEW D-02 actions/stale@v10 R2 finding correction 60+30 split issue+PR + .github/ISSUE_TEMPLATE/ 4 NEW yml form-based + .github/FUNDING.yml NEW D-03 single tier + README L8 Sponsors badge + L190-192 footer EXPAND + W0 backlog 1 项 #BA conditional W0.1 D2 cadence iter 3 institutionalize 3rd-iter terminus stable signal + W0.2 SIZE_LIMIT FLIP DEFERRED #BA RESOLVED OR DEFER carry Phase 4.3); v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭)"
     ```
  5. **DO NOT PUSH WITHOUT USER EXPLICIT APPROVAL** per CLAUDE.md commit safety protocol (NEVER push without user explicit request; user controls all commit + tag push):
     - Wait for user explicit `git push origin v0.4.0-alpha.2-community` request OR `git push origin --tags` request
     - Warn user if force-push requested on tags pointing to main
     - Sister H1 lesson learned (Phase 3.4 ship sister review): narrative-vs-state mismatch root cause = commit was made BEFORE user PP approval; **Anti-pattern note**: post-push narrative sync mandatory if push happens
  6. **NO triple tag** (Phase 4.2 NOT milestone close): NO `adr-0018-accepted` (no NEW ADR Phase 4.2 per CONTEXT scope = community infra publication NOT architectural decision) + NO `🎯 v0.4.0` milestone close tag (reserved Phase 4.3 close per sister v0.3.0 close cadence延袭 — 3 alpha tags + final milestone tag triple-push)
  7. **Recommended commit msg** (DOGFOOD-T2.X.md commit only — tag annotation NO commit):
     - Subject: `docs(phase-4.2-w2): T2.7 — DOGFOOD-T2.X.md NEW ~55-60L PASS 3/3 axes verified miss: none (sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse) + single baseline tag v0.4.0-alpha.2-community LOCAL CREATE (NO push)`
     - Body: 3-axis empirical evidence per sister DOGFOOD pattern延袭: Axis A docs/MAINTAINER-ONBOARDING.md EXPAND 100-150L D-01 LOCKED ADDITIVE + 6 NEW section literal verify + cross-link CONTRIBUTING.md NOT duplicate (D-01 sneak #3 守门) + Axis B .github/ NEW infra cluster — FUNDING.yml + stale.yml actions/stale@v10 R2 finding correction + 60+30 split issue+PR + 4 NEW ISSUE_TEMPLATE yml form-based + blank_issues_enabled false R8.3 80% adoption defender + STRIDE E + D mitigation + Axis C README L8 Sponsors badge + L190-192 footer EXPAND + D-04 HYBRID 2-clock process-level verify STATE.md L23 + RETROSPECTIVE § Cost patterns both literal phrases R-3 mitigation + T2.6 ci.yml VERIFY 0 diff sneak-block (NO A7 iter). Aggregate verification: R8.2 + R8.3 + R8.5 satisfied + 4 D-decisions activated 闭环 + DEFERRED #BA conditional FLIP RESOLVED OR DEFER carry Phase 4.3 W0 + #BB ✅ pre-RESOLVED discuss-phase + W0.1 D2 cadence iter 3 institutionalize 3rd-iter terminus stable ≥3-iter pattern signal. **External prereq note Axis C** (R8.5 Sponsors button render): user manual Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state) — Phase 4.2 ships config + Axis C verifies infra NOT button render; FALLBACK accepted per RESEARCH § 17.2 U1 ship forward-compatible. Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push pending user explicit approval per CLAUDE.md commit safety; user controls all commit + tag push); NO triple tag per PATTERNS § 5 R-5 mitigation (NO adr-0018-accepted no NEW ADR + NO 🎯 v0.4.0 milestone close tag reserved Phase 4.3). v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED).
  8. **Update Resolved (T2.7)** block at task_plan.md top with outcome (PENDING → 实占 values: `git tag --list 'v0.4.0-alpha.2-community' | wc -l` == 1 + `git ls-remote origin refs/tags/v0.4.0-alpha.2-community` empty pre-user-push)
- **acceptance_criteria**:
  - `test -f .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0
  - `wc -l .planning/phase-4.2/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 4.1 DOGFOOD 58L precedent)
  - `grep -q "PASS" .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0
  - `grep -q "Axis A\|docs/MAINTAINER-ONBOARDING.md" .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0 (Axis A MAINTAINER-ONBOARDING EXPAND)
  - `grep -q "Axis B\|.github/\|stale.yml\|FUNDING.yml\|ISSUE_TEMPLATE" .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0 (Axis B .github/ infra cluster)
  - `grep -q "Axis C\|Sponsors\|D-04 HYBRID\|2-clock\|ci.yml" .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0 (Axis C Sponsors + 2-clock + ci.yml VERIFY)
  - `grep -q "DEFERRED #BA\|#BE" .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0 (DEFERRED resolve / carry evidence + external prereq note)
  - `git tag --list 'v0.4.0-alpha.2-community' | wc -l` == 1 (single baseline tag LOCAL created)
  - `! git tag --list 'adr-0018-accepted' | head -1` exit 0 OR `git tag --list 'adr-0018-accepted' | wc -l` == 0 (NO NEW ADR Phase 4.2 — R-5 mitigation)
  - `git ls-remote origin refs/tags/v0.4.0-alpha.2-community` returns empty (NO push verify — user controls)
- **decision_source**: sister Phase 4.1 DOGFOOD-T2.X.md 58L 3-axis format + Phase 3.4 + 3.3 DOGFOOD precedent 100% reuse + RESEARCH § 13 3-axis empirical evidence + PATTERNS § 1 row 13 + § 4 (~85% reuse) + sister Phase 4.1 W2 T2.7 single-baseline cadence延袭 (Phase 4.2 NOT milestone close per CONTEXT § Discretion #4 explicit + PATTERNS § 5 R-5) + CLAUDE.md commit safety NEVER push without user explicit request

---

## Wave 2 done

All 7 atomic tasks complete (5 commit + 1 verify-only T2.6 NO commit + 1 DOGFOOD+tag combined T2.7). Plan Phase 4.2 W2 ship-criteria all satisfied per PLAN.md Wave 2 success_criteria block.

**Phase 4.2 SHIPPED 完成**: R8.2 + R8.3 + R8.5 community infra anchor (docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive + .github/workflows/stale.yml NEW D-02 actions/stale@v10 R2 finding correction 60+30 split issue+PR + .github/ISSUE_TEMPLATE/ 4 NEW yml form-based D-03 supporting infra + .github/FUNDING.yml NEW D-03 single tier + README L8 Sponsors badge + L190-192 footer EXPAND) + W0 backlog 1 项 conditional (#BA D1 SIZE_LIMIT round 2 tighten {FLIP RESOLVED OR DEFER carry Phase 4.3 W0} per § 8.2 decision tree) + W0.1 D2 cadence iter 3 institutionalize verify 3rd-iter terminus stable signal ≥3-iter pattern + 4 D-decisions activated 闭环 + 5-doc 续编 (STATE + RETROSPECTIVE + ROADMAP + README + PROJECT-SPEC) + ci.yml VERIFY 0 diff sneak-block (NO A7 iter) + DOGFOOD PASS 3/3 axes + single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE (NO push per CLAUDE.md commit safety; user controls).

**v0.4.0 milestone PROGRESS**: 1/3 → 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭).

**Next**: Phase 4.3 discuss-phase 启动 prep (v0.4.0 milestone close + R8.1 audit log + R8.4 公开 ADR 全集 + v1.0-RC 收尾 + 🎯 v0.4.0 milestone close 3-file archive triplet sister v0.3.0 close cadence延袭 + triple tag close cadence per sister v0.3.0).

> **DEFERRED carry items**:
> - **DEFERRED #AH** (Phase 3.4 own carry — STILL Phase 4.0+ unchanged): W0.4 path traversal regex hardening → Phase 4.0+ W0 (conditional on real attack surface arrival)
> - **DEFERRED #BA** ⚠️ CONDITIONAL Phase 4.2 W0 T0.2 — FLIP PATH RESOLVED 2026-05-18 OR DEFER PATH carry-forward Phase 4.3 W0 LOW priority defensive (per § 8.2 decision tree)
> - **DEFERRED #BB** ✅ pre-RESOLVED Phase 4.2 discuss-phase (HYBRID 2-clock LOCKED D-04)
> - **DEFERRED #BC** (Phase 4.1 own carry — v0.5+ benchmark expand evaluation, STILL): IF dogfood reveals miss case → re-evaluate; currently 30/30 100% no signal
> - **DEFERRED #BD** (Phase 4.1 own carry, iter 2 lesson, STILL): Regex 2-pass validation pattern
> - **DEFERRED #BE** (Phase 4.2 own carry — Sponsors account activation external prereq IF user NOT activated by ship): FUNDING.yml + badge ship forward-compatible per RESEARCH § 17.2 U1
> - **DEFERRED #BF** (Phase 4.2 own carry — CODEOWNERS .github/** defer SR-6 preempt): defer v0.4.3+ if real attack surface arrives
