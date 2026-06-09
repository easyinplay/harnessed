# Phase 4.1: dogfooding benchmark 数据采集 + 公开格式定义 — Pattern Map

> **Mapped**: 2026-05-18
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 14 NEW / MODIFY targets (per 4.1-CONTEXT 4 D-decisions + W0 backlog 3 项 absorbed + W2 ship 6-doc cluster; NO ADR 0018 + NO A7 iter ci.yml this phase per CONTEXT scope = dogfood publication NOT architectural decision)
> **Analogs found**: 14 / 14 (100% — sister Phase 3.4 17/17 100% cadence延袭; sister Phase 2.3 SAMPLES.md REAL HISTORICAL D-01 source + Phase 3.3 sister gate ENFORCE flip + Phase 3.4 W0.1 D2 cadence first-implementation iter 2 + Phase 3.4 W2 5-doc 续编 + Phase 3.3 DOGFOOD-T2.8 全覆盖)
> **Style**: 沿袭 Phase 3.4 PATTERNS.md (391L 17 targets 100% analog hit; § 1 table + § 2 concrete excerpts + § 3 cross-cutting + § 4 reuse summary + § 5 path dependency)
> **Verified line counts (Bash 2026-05-18)**: STATE.md=148L (W0.5 conditional tighten 150L flip target) / docs/benchmarks/=empty (.gitkeep only — Phase 4.1 W1 inaugurates docs/benchmarks/v0.4.md NEW surface) / check-state-archive-stale.mjs=54L ENFORCE=false (W0.1 D3 flip target) / Phase 3.4 SAMPLES.md=10686 bytes 73L (D-01 single SoT — REUSE NOT copy)

---

## § 1 NEW / MODIFY Targets → Existing Analog Mapping

| # | Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|--------|------|-----------|----------------|---------|---------------|
| **W0 prereq backlog (3 项 absorbed; 2 项 DEFER unchanged)** ||||||||
| 1 | `scripts/check-state-archive-stale.mjs` W0.1 MODIFY 1-line ENFORCE=false → true flip (DEFERRED #AF) | CI gate / utility | batch (read STATE.md → 3 rules check → exit 0/1) | 现 `scripts/check-state-archive-stale.mjs` L10 `const ENFORCE = false` + `scripts/check-transparency-verdicts.mjs` L12 `const ENFORCE = true` (sister Phase 2.1 W3 warn-only round 1 ship → Phase 2.2 W0 ENFORCE=true flip cadence precedent — 1-phase cadence延袭) | **~98%** | **COPY-mechanical** sister Phase 2.2 transparency gate flip 1-line literal: L10 `const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF` → `const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED)`; **Acceptance**: `grep -q "ENFORCE = true" scripts/check-state-archive-stale.mjs` exit 0 + `node scripts/check-state-archive-stale.mjs` exit 0 (STATE.md 148L ≤ 200L 当前 ENFORCE round 2 仍 pass — verify pre-flip baseline ≤200L); **Pre-flight守门**: STATE.md size MUST be ≤200L (current 148L OK) AND 0 Rule 2 violation AND 0 Rule 3 violation BEFORE flip — if not, fix violations first per CONTEXT W0.5 conditional |
| 2 | `.planning/STATE.md` W0.5 conditional D1 round 2 trim ≤150L (DEFERRED #AG — flip D3 SIZE_LIMIT 200→150 if W0.3 outcome holds STATE ≤140L) | docs | declarative (delete + restructure) | 现 `.planning/STATE.md` 148L post-Phase-3.4-W0.1 trim (Phase 3.4 723L → 148L round 1 已 done) + Phase 3.4 PATTERNS.md row 2 W0.1 D1 trim massive-restructure precedent | **~85%** | **CONDITIONAL ADAPT** per CONTEXT W0.5: (a) IF W0.3 D2 cadence iter 2 trim outcome holds STATE ≤140L → flip `SIZE_LIMIT = 200` to `SIZE_LIMIT = 150` in `scripts/check-state-archive-stale.mjs` L12 (1-line sister W0.1 ENFORCE flip same-file delta); (b) OTHERWISE DEFER → carry forward Phase 4.2 W0 (LOW priority); **NOTE** distinction from Phase 3.4 W0.1: Phase 3.4 = 723→148 massive (-79%); Phase 4.1 = optional 148→≤140 micro-trim if W0.3 archive helps (~5-8L delta); **Acceptance** if (a) path: `wc -l .planning/STATE.md` ≤ 150 + `grep -q "SIZE_LIMIT = 150" scripts/check-state-archive-stale.mjs` exit 0 + `node scripts/check-state-archive-stale.mjs` exit 0 |
| 3 | W0.3 D2 cadence iter 2 ship-time T2.2 step "trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md" sub-step (DEFERRED M2 sister verify D2 standing process fires) | process / docs | declarative | `.planning/phase-3.4/task_plan.md` L885-906 T2.2 STATE.md 续编 step 3 "W0.1 D2 ship-time T6.N cadence FIRST-IMPLEMENTATION" (Phase 3.4 W2 T2.2 archived Phase 3.1+3.2 narrative to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 section — sister precedent 1st iter) | **~95%** | **COPY-mechanical** Phase 3.4 W2 T2.2 step 3 verbatim with target swap: identify Phase 3.3 + Phase 3.4 entries in `.planning/STATE.md` 已完成 phase ship 历史 section (prev-prev-phase beyond Phase 3.4 + Phase 4.1 = Phase 3.3 + Phase 3.4 trim target this iter) → move verbatim to `.planning/RETROSPECTIVE.md` new section `## § ARCHIVED FROM STATE — Phase 3.3+3.4 (3rd ship-time T6.N implementation per Phase 3.4 W0.1 D2 cadence; institutionalize 2nd iter verify per Phase 4.1 W0.3 M2)`; **Acceptance** sister Phase 3.4 acceptance criteria L901 mirror: `grep -q "Phase-3.3-SHIPPED\|Phase-3.4-SHIPPED" .planning/RETROSPECTIVE.md` exit 0 (Phase 3.3+3.4 narrative archived to RETROSPECTIVE per D2 cadence 2nd iter); **VERIFY institutionalization**: D2 fires beyond 1st-implementation — pattern stable not first-time effort (Sister M2 backlog discharge) |
| **W1 main scope (5 项 — Phase 4.1 anchor R8.1)** ||||||||
| 4 | `docs/benchmarks/v0.4.md` NEW (~300-400L D-02 FULL per-task disclosure — Phase 4.1 main artifact) | docs (public benchmark) | declarative (markdown table + per-task sections) | `.planning/phase-3.4/SAMPLES.md` 73L 30-row REAL HISTORICAL truth table (D-01 single SoT input) + `.planning/phase-3.4/DOGFOOD-T2.X.md` 55L 3-axis empirical evidence format (sister verdict + 4-section structure) + Phase 3.4 PATTERNS.md row 6 SAMPLES.md § 1+2+3 frame | **~70%** | **REUSE FRAME** Phase 3.4 SAMPLES.md § 1+2+3 section structure (Selection Rationale + Sample Truth Table + Frozen Marker) + DOGFOOD-T2.X.md verdict header format; **ADAPT** per D-02 FULL per-task disclosure expansion: (a) header section frozen-status marker + reproducibility instructions inline; (b) § 1 Selection Rationale REUSE Phase 3.4 SAMPLES § 1.1+1.2+1.3 verbatim 30-row REAL HISTORICAL distribution 10 Haiku trivial / 10 Sonnet medium / 10 Opus complex per D-01 single SoT lock; (c) § 2 expanded per-task FULL sections — each of 30 row gets 1 subsection containing: (1) raw_prompt verbatim (sister D-02 sneak block "NOT sanitized/paraphrased") / (2) routing_decision (tier + skill + rule_id from production routing/decision_rules.yaml — D-02 sneak block "actual decision_rules.yaml routing path") / (3) actual_command_executed / (4) hit_miss_verdict (current 30/30 all HIT per Phase 3.4 W1 T1.6 100/100/100) / (5) recovery_path (N/A 30/30 但 schema 保留 column for v0.5+ miss case per D-02 sneak block "NOT suppress miss cases"); (d) § 3 Aggregate footer 1-line summary `30/30 = 100% hit; per-tier Haiku 10/10 / Sonnet 10/10 / Opus 10/10` (HYBRID inline NOT separate aggregate header per D-02 rationale "HYBRID +1 section overhead 微 over-engineering"); (e) § 4 Frozen marker sister SAMPLES.md § 3 cherry-pick 防御 + ADR-needed-to-amend; **D-01 sneak block**: 30 row content 100% from Phase 3.4 SAMPLES.md SoT — planner / executor MUST NOT add synthetic miss cases OR re-mine git log; **D-02 sneak block**: raw_prompt verbatim + actual decision_rules.yaml path + recovery_path schema retained even when N/A; **Karpathy hard limit ≤400L per planner Discretion #1** (30 row × ~10L per row FULL section = ~300L + header/footer ~50-80L = ~350-400L acceptable); **planner Discretion #2** column schema forward-compat verify (Phase 3.4 SAMPLES.md 7-col → benchmark public 8-9 col expansion adds task_description_human_readable + actual_command_run + manual_review_verdict + recovery_path; SAMPLES.md frozen 30-row data MUST be losslessly projectable to expanded schema) |
| 5 | `docs/benchmarks/v0.4-upgrade-e2e.log` NEW (~50-150L plain text 4-section log — D-03 TEXT LOG) | docs (e2e recording) | file-I/O (text capture) | NO direct in-repo analog (Phase 4.1 inaugurates `docs/benchmarks/` NEW surface per D-03 TEXT LOG zero-dep; sister precedent = `.harnessed/sessions/<id>.txt` plain text turn-dump from Phase 3.1 checkpoint TEMPLATE pattern + `tests/cli/install-aliases.test.ts` spawn capture pattern) | **~50%** | **NEW surface — no direct analog** but pattern-source from sister Phase 3.1 checkpoint TEMPLATE plain-text turn-dump (zero LLM call mechanical capture) + sister Phase 3.3 W2 T2.X install-aliases spawn pattern (real upgrade command capture); **ADAPT** per D-03 4-section structure CONTEXT § decisions L53 verbatim: (1) pre-upgrade state (e.g., `cat versions/0.3.0-known-good.yaml` head 10L OR `harnessed install ctx7 --dry-run --non-interactive` output) / (2) upgrade command (e.g., `pnpm add -D @anthropic-ai/claude-agent-sdk@latest && harnessed install gsd --known-good`) / (3) diff output (e.g., `git diff package.json pnpm-lock.yaml versions/0.3.0-known-good.yaml`) / (4) post-upgrade state (re-run install command + verify version bumped); **D-03 sneak block**: NO asciinema npm dep (zero-dep precedent sister Phase 3.1 D-01 enforceBudget /4 + Phase 3.4 D-03 Buffer.byteLength /4) + NO binary mp4/gif/png files >100KB (text grep-able + cross-OS portable + git diff friendly); **planner Discretion #5** e2e upgrade target manifest selection: planner choose 1-2 representative manifests from versions/0.3.0-known-good.yaml 8 real entries (ctx7 / gstack / tavily-mcp / claude-agent-sdk per CONTEXT hint — pick 1-2 demo upgrade flow 3-5 step text log per manifest); **Karpathy hard limit**: ≤150L per file (4 section × ~20-40L each = ~100-150L acceptable; text < 50KB sister D-03 rationale) |
| 6 | `docs/CONTRIBUTING-BENCHMARK.md` NEW (~30L per CONTEXT D-04 sneak block instruction — manual re-run instructions) | docs (process) | declarative | NO `docs/CONTRIBUTING*.md` exists (Glob verified) — sister precedent = `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` referenced by `scripts/check-transparency-verdicts.mjs` L127 (companion contributor doc for gate script) + sister `.planning/RETROSPECTIVE.md` 587L process doc | **~60%** | **ADAPT-NEW** per CONTEXT D-04 sneak block L67 verbatim "≤30L manual re-run instructions" — 6-section ultra-minimal structure: (1) Purpose (manual on-demand re-run trigger 时机 — SAMPLES.md churn OR routing/decision_rules.yaml v3 OR upstream major version bump) / (2) Pre-flight (ensure pnpm install + pnpm build clean + dist/cli.mjs exists per Phase 3.4 CI hotfix 554b82b lesson) / (3) Step 1 routing harness re-run (`pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` — verify 30/30 hit rate maintained) / (4) Step 2 e2e upgrade log re-capture (`docs/benchmarks/v0.4-upgrade-e2e.log` 4-section per D-03 — pick 1-2 manifest from versions/0.3.0-known-good.yaml + run upgrade cycle) / (5) Step 3 update `docs/benchmarks/v0.4.md` if any hit/miss verdict changed (D-02 NO suppress miss cases) / (6) Step 4 commit + push (NO CI gate per D-04 MANUAL — sister Phase 3.4 D-02 DOCTOR-ONLY-WARN 安静 一致); **D-04 sneak block**: MUST NOT add `.github/workflows/benchmark.yml` cron file + MUST NOT add benchmark step to existing `ci.yml` (Karpathy YAGNI 0 infra cost); **Karpathy hard limit ≤30L hard** per CONTEXT explicit; **Alt**: planner Discretion #4 fold into existing `CONTRIBUTING.md` (NOT exists per Glob — recommend NEW separate file per CONTEXT default lock + minimal surface; if separate file 8 nested header lines bloat → inline header in `docs/benchmarks/v0.4.md` § header section instead per planner discretion) |
| 7 | `scripts/run-benchmark.mjs` NEW (~40-60L optional manual re-run wrapper) OR FOLD into CONTRIBUTING-BENCHMARK.md inline 5-line invocation (planner discretion) | utility (scripts) | request-response (spawn pnpm test + cat output to docs) | `scripts/check-transparency-verdicts.mjs` L9-44 (130L sister gate utility) + `scripts/check-state-archive-stale.mjs` 54L (sister W0.1 short utility) + `scripts/check-deferred-items.mjs` (sister W3 warn-only pattern延袭) | **~70%** | **OPTIONAL ADAPT — recommend FOLD** (Karpathy YAGNI per CONTEXT D-04 MANUAL on-demand): inline 5-line `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts > docs/benchmarks/v0.4-run-$(date -I).log` into CONTRIBUTING-BENCHMARK.md step 1 — NO separate script file unless planner Discretion #3 over-engineering trim flag; **IF planner chooses separate script path**: COPY sister `scripts/check-deferred-items.mjs` skeleton (header comment + import readFileSync + parse SAMPLES.md → spawn vitest → tee output → exit 0); **Karpathy YAGNI override**: if FOLD path chosen → THIS TARGET DROPPED (target count 14 → 13; reuse % rolls up to ~71% weighted avg vs ~70% with target retained); **decision deferred to planner Wave B** per CONTEXT § Claude's Discretion #4 |
| 8 | `tests/benchmark/benchmark-format.test.ts` NEW (~30-50L benchmark schema/format gate) OR planner discretion DROP per Karpathy YAGNI | unit test | request-response (read benchmark md → assert sections + column count) | `tests/scripts/check-state-archive-stale.test.ts` (Phase 3.4 W1 T1.5 sister NEW gate test 3-rules verify pattern) + `tests/routing/samples-30.test.ts` L44-62 markdown table parser pattern | **~75%** | **CONDITIONAL ADAPT — recommend DROP per YAGNI** (Phase 4.1 = dogfood publish NOT new gate infra; sister D-04 MANUAL cadence rationale "0 infra cost" carries to test gate too); **IF planner chooses test path** (defensive verify benchmark format integrity): COPY sister `tests/scripts/check-state-archive-stale.test.ts` 3-fixture skeleton — fixture 1: `docs/benchmarks/v0.4.md` has 30 task sections (`grep -c "^### Task " docs/benchmarks/v0.4.md` = 30); fixture 2: each task section has raw_prompt + routing_decision + hit_verdict fields (D-02 FULL disclosure schema); fixture 3: aggregate footer shows 30/30 OR ≥26/30 (D-02 sister Phase 3.4 hard gate ≥85% threshold reuse — NOT new threshold); **Karpathy hard limit ≤50L if path taken**; **Alt**: rely on plain markdown lint + manual review (CONTEXT § Discretion #4 acceptance — recommend DROP per minimum-viable benchmark publish surface) |
| **W2 ship (6 项 — sister Phase 3.4 W2 5-doc 续编 cadence + DOGFOOD + tag; NO ADR 0018 + NO A7 iter ci.yml per CONTEXT scope = dogfood publish NOT architectural decision)** ||||||||
| 9 | `.planning/STATE.md` 续编 Phase 4.1 SHIPPED event log + 当前位置 块 v0.4.0 1/3 SHIPPED + W0.3 D2 cadence 2nd-iter trim Phase 3.3+3.4 → RETROSPECTIVE | docs | declarative | `.planning/phase-3.4/task_plan.md` L885-906 T2.2 sister Phase 3.4 W2 T2.2 (STATE.md 续编 + 当前位置 update + W0.1 D2 ship-time T6.N first-implementation) | **~98%** | **COPY-mechanical** Phase 3.4 W2 T2.2 全 4-step structure 1:1 replicate with content swap: (1) append 已完成 phase ship 历史 16th entry: `Phase 4.1 SHIPPED ✅ (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 (docs/benchmarks/v0.4.md NEW 30-task FULL per-task disclosure D-02 + docs/benchmarks/v0.4-upgrade-e2e.log NEW D-03 TEXT LOG zero-dep + W0 backlog 3 项一次根治 W0.1 D3 ENFORCE flip + W0.3 D2 iter 2 + W0.5 conditional D1 round 2) + v0.4.0 milestone 1/3 SHIPPED (next: Phase 4.2 co-maintainer onboarding R8.2-R8.5)`; (2) update 当前位置 block: GSD phase chain prepend Phase 4.1 SHIPPED marker; 当前里程碑 update v0.4.0 milestone 1/3 (next Phase 4.2); 状态 Phase 4.1 SHIPPED + Wave 0+1+2 ship + baseline tag v0.4.0-alpha.1-benchmark; (3) W0.3 D2 ship-time T6.N cadence 2nd-IMPLEMENTATION (verify D2 institutionalized per M2 backlog discharge): Move Phase 3.3 + Phase 3.4 entry verbatim to `.planning/RETROSPECTIVE.md` new section `## § ARCHIVED FROM STATE — Phase 3.3+3.4 (3rd ship-time T6.N implementation per Phase 3.4 W0.1 D2 cadence)`; (4) Verify post-archive STATE.md ≤200L (W0.5 conditional flip 150L if ≤140 post-archive); **Acceptance** sister Phase 3.4 W2 T2.2 acceptance criteria mirror: `grep -q "Phase-4.1-SHIPPED" .planning/STATE.md` + `grep -q "v0.4.0-1/3\|v0.4.0 1/3 SHIPPED" .planning/STATE.md` + `grep -q "Phase-3.3-SHIPPED\|Phase-3.4-SHIPPED" .planning/RETROSPECTIVE.md` + `wc -l .planning/STATE.md` ≤ (150 if W0.5 flip else 200) + `node scripts/check-transparency-verdicts.mjs` exit 0 + `node scripts/check-state-archive-stale.mjs` exit 0 (Phase 4.1 W0.1 ENFORCE=true flip MUST pass post-archive) |
| 10 | `.planning/RETROSPECTIVE.md` 续编 Phase 4.1 milestone retrospective entry 6-section + receive W0.3 D2 auto-archive Phase 3.3+3.4 narrative section | docs | declarative | `.planning/phase-3.4/task_plan.md` L909-930 T2.3 sister Phase 3.4 W2 T2.3 (RETROSPECTIVE.md 续编 6-section pattern + receive D2 archive) + `.planning/RETROSPECTIVE.md` 587L current state | **~95%** | **COPY-mechanical** Phase 3.4 W2 T2.3 全 6-section format 1:1 replicate with content swap: (1) § What worked: D-01 REUSE Phase 3.4 SAMPLES.md 0 day overhead + D-02 FULL per-task disclosure 反"数据美化"诱惑 + D-03 TEXT LOG zero-dep sister Karpathy precedent + D-04 MANUAL 0 infra; (2) § What was inefficient: docs/benchmarks/v0.4.md 30-task FULL section authoring ~300L manual transcription effort (raw_prompt verbatim NO sanitize per D-02 sneak block discipline); (3) § Patterns established: 7-phase 连续 deferred-items → next phase W0 一次根治 cadence + D2 D1+D2+D3 institutionalize 2nd-iter verify (M2 backlog discharge — pattern stable) + benchmark publish artifact 30-row REAL HISTORICAL single SoT REUSE (D-01 NOT re-mine); (4) § Cost patterns: Phase 4.1 内部 phase 1 day cadence延袭 (T3 risk surface Phase 4.2 co-maintainer 外部依赖); (5) § Key lessons: (i) D-01 single SoT REUSE > EXPAND fresh mining (0 day overhead + 一致性 + frozen lock — sister cherry-pick 防御); (ii) D-02 FULL per-task 反"美化"诱惑兜底 (30/30 100% 不需 EXPAND fake-miss-cases); (iii) D-04 MANUAL cadence sister Karpathy YAGNI > weekly cron (sister Phase 3.4 D-02 install path 安静 一致 不增 CI 表面); (6) § Cross-milestone trends: v0.4.0 第 1 phase 续延 v0.3.0 close 1-day cadence (sister 4-phase consecutive 1-day ship cadence延袭); W0.3 D2 cadence iter 2 verify (sister M2 backlog discharge); **Receive W0.3 D2 auto-archive**: accept Phase 3.3+3.4 narrative section moved STATE → RETRO per D2 cadence 2nd-iter as `## § ARCHIVED FROM STATE — Phase 3.3+3.4` section; **Acceptance** sister Phase 3.4 W2 T2.3 acceptance L924-928 mirror: `grep -q Phase-4.1 .planning/RETROSPECTIVE.md` + 6 NEW sections + `grep -q "ARCHIVED-FROM-STATE-Phase-3.3\|ARCHIVED-FROM-STATE-Phase-3.4" .planning/RETROSPECTIVE.md` exit 0 |
| 11 | `.planning/ROADMAP.md` Phase 4.1 ✅ SHIPPED + v0.4.0 milestone 1/3 progress marker (sister L130 v0.3.0 progress pattern; NOT yet 3/3 ARCHIVED) | docs | declarative | `.planning/phase-3.4/task_plan.md` L933-946 T2.4 sister Phase 3.4 W2 T2.4 (ROADMAP.md 续编 + Phase X.Y ✅ SHIPPED marker + milestone progress update) + `.planning/ROADMAP.md` L210-212 Phase 4.1 entry pre-shipped state | **~98%** | **COPY-mechanical** Phase 3.4 W2 T2.4 1:1 replicate with content swap: (1) Mark Phase 4.1 entry L210-212 area as `✅ SHIPPED (2026-05-18)` + brief outcome summary; (2) Update v0.4.0 milestone progress (currently 0/3 → 1/3 post-Phase-4.1-ship; sister L130 v0.3.0 progress pattern延袭 — note v0.4.0 NOT yet ARCHIVED until Phase 4.3 close); (3) Add Phase 4.2 next phase kickoff reference (R8.2 co-maintainer 招募 per CONTEXT carry); **NO new ARCHIVED marker** (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED reserved for milestone close = Phase 4.3 ship); **Acceptance**: `grep -q "Phase 4.1.*✅ SHIPPED" .planning/ROADMAP.md` + `grep -q "v0.4.0.*1/3" .planning/ROADMAP.md` exit 0 |
| 12 | `README.md` L9 Status freshness + Phase 4.1 row append + v0.4.0 1/3 marker (FRONT_MATTER_DOCS transparency gate) | docs | declarative | `.planning/phase-3.4/task_plan.md` L950-963 T2.5 sister Phase 3.4 W2 T2.5 (README.md L9 Status + L44 MILESTONE row + shipped phase list append) + `README.md` 192L current state | **~98%** | **COPY-mechanical** Phase 3.4 W2 T2.5 1:1 replicate: (1) Update L9 Status freshness header to reflect Phase 4.1 SHIPPED + v0.4.0 1/3 (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭); (2) Update L44 area MILESTONE row v0.4.0 0/3 → 1/3 (NOT yet 3/3 SHIPPED ARCHIVED — reserved Phase 4.3 close); (3) Add Phase 4.1 entry to shipped phase list (sister Phase 3.4+3.3+3.2+3.1 row pattern延袭); **Acceptance**: `grep -q "Phase 4.1" README.md` + `grep -q "v0.4.0.*1/3" README.md` + `node scripts/check-transparency-verdicts.mjs` exit 0 (freshness gate post-MODIFY pass — STATE_POSITION_RE OR-fallback for Phase 4.1 SHIPPED literal) |
| 13 | `PROJECT-SPEC.md` L3 Status header add Phase 4.1 SHIPPED literal (FRONT_MATTER_DOCS transparency gate) | docs | declarative | `.planning/phase-3.4/task_plan.md` L967-977 T2.6 sister Phase 3.4 W2 T2.6 (PROJECT-SPEC.md L3 Status header sister Phase 3.3 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern) + `PROJECT-SPEC.md` 447L current state | **~98%** | **COPY-mechanical** Phase 3.4 W2 T2.6 1:1 replicate: Add Phase 4.1 SHIPPED literal to L3 Status header (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS pattern延袭); **Acceptance**: `grep -q "Phase 4.1" PROJECT-SPEC.md` + `node scripts/check-transparency-verdicts.mjs` exit 0 (FRONT_MATTER_DOCS transparency gate pass) |
| 14 | `.planning/phase-4.1/DOGFOOD-T2.X.md` NEW (~30-60L PASS N/N axes — sister Phase 3.3+3.4 DOGFOOD-T2.X format) + baseline tag `v0.4.0-alpha.1-benchmark` single push (NO ADR 0018 + NO 🎯 v0.4.0 — milestone tag reserved Phase 4.3 close) | docs (dogfood log) + git tag | declarative + git op | `.planning/phase-3.4/DOGFOOD-T2.X.md` 55L 3-axis empirical evidence format (Date + Verdict + 3 Axis sections + Aggregate + Disposition) + Phase 3.4 PATTERNS.md row 15 DOGFOOD-T2.X.md sister mapping + Phase 3.4 W2 T2.12 single-tag push pattern (subset of sister v0.2.0 close triple-tag — Phase 4.1 NO milestone close = 1 tag only) | **~85%** | **COPY** sister Phase 3.4 DOGFOOD-T2.X.md 55L format 1:1 with axes ADAPT: (Axis A) `docs/benchmarks/v0.4.md` NEW 30-task FULL per-task disclosure (D-02) — verify 30 section count + each section has 5-field schema (raw_prompt + routing_decision + actual_command + hit_verdict + recovery_path); (Axis B) `docs/benchmarks/v0.4-upgrade-e2e.log` NEW 4-section text log (D-03) — verify 4 sections (pre-state + upgrade command + diff + post-state) + plain text grep-able cross-OS; (Axis C) W0.1 D3 ENFORCE flip + W0.3 D2 cadence iter 2 verify — `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (was warn-only round 1 Phase 3.4 ship → ENFORCE round 2 Phase 4.1 W0.1) + `grep -q "ARCHIVED-FROM-STATE-Phase-3.3\|ARCHIVED-FROM-STATE-Phase-3.4" .planning/RETROSPECTIVE.md` exit 0 (W0.3 D2 cadence 2nd-iter institutionalized); **baseline tag** Phase 4.1 W2 ship-time push `v0.4.0-alpha.1-benchmark` single tag (NO ADR 0018 baseline tag — Phase 4.1 has NO new ADR per CONTEXT scope; NO 🎯 v0.4.0 milestone close tag — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭); **Karpathy hard limit ≤60L** sister DOGFOOD 长度; **Acceptance**: `git tag -l "v0.4.0-alpha.1-benchmark"` exit 0 + `git ls-remote origin refs/tags/v0.4.0-alpha.1-benchmark` returns SHA (push origin verify per sister H1 lesson learned — push immediately AFTER user PP approval to avoid narrative-vs-state mismatch) |

---

## § 2 Per-target Concrete Code Excerpts (5 most critical)

### 2.1 `scripts/check-state-archive-stale.mjs` W0.1 MODIFY 1-line ENFORCE flip — analog: sister Phase 2.2 W0 transparency gate ENFORCE=true flip cadence

**COPY-mechanical 1-line literal swap** (sister Phase 2.1 W3 warn-only round 1 ship → Phase 2.2 W0 ENFORCE=true 1-phase cadence延袭 → Phase 3.4 W0.1 state-archive ENFORCE=false ship → Phase 4.1 W0.1 ENFORCE=true flip = identical cadence; DEFERRED #AF RESOLVED):

```js
// 现 scripts/check-state-archive-stale.mjs L10 (Phase 3.4 W0.1 ship round 1 warn-only):
const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF

// Phase 4.1 W0.1 flip round 2 (sister Phase 2.2 W0 transparency gate cadence延袭, DEFERRED #AF RESOLVED):
const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)
```

**Pre-flight守门** (W0.1 ENFORCE=true flip safety): MANDATORY pre-flight verify CURRENT STATE.md passes ALL 3 rules with `ENFORCE=true` simulation BEFORE flipping. Run:

```bash
# Pre-flight dry-run: temp local sed swap → run gate → verify exit 0 → revert if fail
sed 's/const ENFORCE = false/const ENFORCE = true/' scripts/check-state-archive-stale.mjs | node /dev/stdin
# Expected: '[state-archive-stale] STATE.md within archive cadence limits.' exit 0
# If exit 1: fix STATE.md violations FIRST (W0.3 D2 cadence iter 2 archive Phase 3.3+3.4 narrative) before W0.1 flip
```

If pre-flight fails: W0.3 D2 cadence iter 2 (row 3 above) MUST ship FIRST as W0.1 prerequisite (path dependency: W0.3 → W0.1 → W0.5 conditional).

### 2.2 `.planning/STATE.md` W0.3 D2 cadence iter 2 sub-step — analog: Phase 3.4 W2 T2.2 step 3 W0.1 D2 first-implementation

**COPY-mechanical Phase 3.4 W2 T2.2 step 3 verbatim with target swap** (Phase 3.4 = 1st iter Phase 3.1+3.2 archive; Phase 4.1 = 2nd iter Phase 3.3+3.4 archive — sister M2 verify D2 institutionalized beyond first-time effort):

```markdown
# 现 Phase 3.4 W2 T2.2 step 3 (first-implementation, sister .planning/phase-3.4/task_plan.md L896):

3. W0.1 D2 ship-time T6.N cadence FIRST-IMPLEMENTATION (institutionalize per Phase 3.4+ onward):
   - Identify Phase 3.1 + Phase 3.2 entries in 已完成 phase ship 历史 section (prev-prev-phase beyond last 2 = Phase 3.3 + Phase 3.4)
   - Move Phase 3.1 + Phase 3.2 entry verbatim to .planning/RETROSPECTIVE.md new section
   - ## § ARCHIVED FROM STATE — Phase 3.1+3.2 (2nd ship-time T6.N implementation per Phase 3.4 W0.1 D2 cadence)
   - Verify post-archive STATE.md still ≤200L

# Phase 4.1 W2 T2.2 step 3 (2nd-implementation, sister M2 verify D2 institutionalized):

3. W0.3 D2 ship-time T6.N cadence 2nd-IMPLEMENTATION (verify D2 standing process fires beyond 1st iter per M2 backlog discharge):
   - Identify Phase 3.3 + Phase 3.4 entries in 已完成 phase ship 历史 section (prev-prev-phase beyond last 2 = Phase 3.4 + Phase 4.1 = Phase 3.3 + Phase 3.4 trim target this iter)
   - Move Phase 3.3 + Phase 3.4 entry verbatim to .planning/RETROSPECTIVE.md new section
   - ## § ARCHIVED FROM STATE — Phase 3.3+3.4 (3rd ship-time T6.N implementation per Phase 3.4 W0.1 D2 cadence; 2nd-iter institutionalize verify per Phase 4.1 W0.3 M2 discharge)
   - Verify post-archive STATE.md ≤ (150 if W0.5 conditional flip path else 200)
```

**Acceptance criteria** (mirror Phase 3.4 W2 T2.2 L898-904):
- `grep -q "Phase-4.1-SHIPPED" .planning/STATE.md` exit 0
- `grep -q "v0.4.0-1/3\|v0.4.0 1/3" .planning/STATE.md` exit 0
- `grep -q "Phase-3.3-SHIPPED\|Phase-3.4-SHIPPED" .planning/RETROSPECTIVE.md` exit 0 (W0.3 D2 cadence 2nd-iter)
- `wc -l .planning/STATE.md` ≤ (150 if W0.5 flip else 200)
- `node scripts/check-transparency-verdicts.mjs` exit 0
- `node scripts/check-state-archive-stale.mjs` exit 0 (CRITICAL: W0.1 ENFORCE=true MUST pass post-archive)

### 2.3 `docs/benchmarks/v0.4.md` NEW (~300-400L D-02 FULL per-task disclosure) — analog: `.planning/phase-3.4/SAMPLES.md` § 1+2+3 frame + `.planning/phase-3.4/DOGFOOD-T2.X.md` verdict header

**REUSE Phase 3.4 SAMPLES.md frame + EXPAND D-02 FULL per-task sections** (D-01 30-row REAL HISTORICAL single SoT NOT re-mined per CONTEXT sneak block; D-02 raw_prompt verbatim NOT sanitized per CONTEXT sneak block):

```markdown
# Dogfooding Benchmark v0.4.0 — Routing Accuracy + Upstream Upgrade E2E

> **Status**: published 2026-05-18 / **reproducibility**: any reader can re-run via `docs/CONTRIBUTING-BENCHMARK.md` instructions
> **Anchor**: R8.1 dogfooding benchmark 公开 (v0.4.0 milestone 1st phase deliverable)
> **Sample source (D-01 LOCKED)**: REUSE `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL (10 Haiku trivial + 10 Sonnet medium + 10 Opus complex; per-row source_commit MANDATORY)
> **Disclosure level (D-02 LOCKED)**: FULL per-task — raw prompt + routing decision + actual command + hit/miss verdict + recovery path (current 30/30 全 HIT; recovery_path schema retained for v0.5+ miss case)
> **Recording (D-03 LOCKED)**: companion plain text log `docs/benchmarks/v0.4-upgrade-e2e.log` 4-section (pre-state + upgrade command + diff + post-state)
> **CI policy (D-04 LOCKED)**: MANUAL on-demand re-run (per CONTRIBUTING-BENCHMARK.md); NO weekly cron / NO per-PR full benchmark (sister Phase 3.4 routing harness already gates per-PR via `pnpm test`)

## § 1 Selection Rationale (D-01 REUSE Phase 3.4 SAMPLES.md verbatim — single SoT)

[REUSE Phase 3.4 SAMPLES.md § 1.1 + § 1.2 + § 1.3 verbatim — 3-paragraph block 来源约束 + 分布 + Anti-cherry-pick declaration]

## § 2 Per-Task FULL Disclosure (D-02 LOCKED — 30 sections, schema-stable forward-compat to v0.5+ miss case)

### Task T01 (haiku — chore)

- **raw_prompt**: "tests/manifest + tests/manifest/schema dirs setup (sister Phase 3.2 W0 T0.4 pattern)" (verbatim — D-02 sneak block "NOT sanitized/paraphrased")
- **routing_decision**: tier=B (Sonnet sub-agent), skill=chore-trivial, rule_id=priority-100-single-file-edit (actual `routing/decision_rules.yaml` v2 12-rule priority hit — D-02 sneak block "actual decision_rules.yaml routing path")
- **actual_command_executed**: `claude --resume <session-id>` (Sonnet sub-agent Task tool dispatch)
- **hit_verdict**: ✅ HIT (expected B, actual B — per `tests/routing/phase-3.4-routing-hit-rate.test.ts` T01 cell pass)
- **recovery_path**: N/A (HIT; schema retained for v0.5+ miss case per D-02 sneak block "NOT suppress miss cases")
- **source_commit**: `43ce181`

### Task T02 (haiku — chore)

[... 29 more task sections same 6-field schema, ~10L each = ~300L total ...]

### Task T30 (opus — fix)

- **raw_prompt**: "README counter gate CI failure — L44 加 '完成' literal + ci.yml regex 兼容 post-close" (verbatim)
- **routing_decision**: tier=A (Opus primary), skill=multi-file-cross-cutting, rule_id=priority-50-multi-file-architectural
- **actual_command_executed**: `claude --model claude-opus-4-7-1m` (Opus primary direct)
- **hit_verdict**: ✅ HIT
- **recovery_path**: N/A
- **source_commit**: `b6a0feb`

## § 3 Aggregate Summary (HYBRID inline footer per D-02 — NO separate aggregate header)

- **Total**: 30/30 = 100% (远超 ≥85% bar 15% headroom)
- **Per-tier breakdown**:
  - Haiku: 10/10 = 100% (远超 ROADMAP R7 ≥84% lower bound)
  - Sonnet: 10/10 = 100% (perfection expected per Phase 3.4 Plan 02 W1 harness)
  - Opus: 10/10 = 100% (远超 derived middle bar ≥80% per Phase 3.4 RESEARCH § 4.4 A4 ASSUMED LOW risk)
- **Verdict**: PASS R4.2 + R8.1 (公开 review-ready; reproducible per CONTRIBUTING-BENCHMARK.md)

## § 4 Frozen Marker (sister Phase 3.4 SAMPLES.md § 3 cherry-pick 防御 + D-01 single SoT lock)

- benchmark v0.4.md 30-row content frozen at Phase 4.1 ship 2026-05-18; ADR-needed-to-amend (Phase 4.2+ if SAMPLES.md churn OR routing/decision_rules.yaml v3)
- D-04 MANUAL re-run cadence: SAMPLES.md churn OR routing/decision_rules.yaml v3 OR upstream major version bump → human re-runs per CONTRIBUTING-BENCHMARK.md
```

### 2.4 `docs/benchmarks/v0.4-upgrade-e2e.log` NEW (~50-150L plain text 4-section log — D-03 TEXT LOG zero-dep)

**ADAPT-NEW** sister Phase 3.1 checkpoint TEMPLATE plain-text turn-dump pattern + sister Phase 3.3 install-aliases spawn capture pattern (D-03 sneak block: NO asciinema npm dep + NO mp4/gif/png > 100KB):

```
# Dogfooding Benchmark v0.4.0 — Upstream Upgrade E2E Recording
# Recorded: 2026-05-18 / D-03 LOCKED TEXT LOG (sister Karpathy zero-dep precedent)
# Target manifest: ctx7 (planner Discretion #5 — pick 1-2 representative from versions/0.3.0-known-good.yaml 8 entries)

## § 1 Pre-Upgrade State

$ harnessed install ctx7 --dry-run --non-interactive
[manifest] reading manifests/tools/ctx7.yaml
[manifest] resolved name: ctx7 (no alias)
[install-method] npm-cli @upstash/context7-mcp@1.0.18
[dry-run] would invoke: npm install -g @upstash/context7-mcp@1.0.18
[dry-run] would write: ~/.mcp.json (stdio entry "ctx7")
[exit 2] dry-run sentinel

## § 2 Upgrade Command Executed

$ pnpm add -D @upstash/context7-mcp@latest
$ harnessed install ctx7 --known-good --dry-run --non-interactive
[manifest] reading manifests/tools/ctx7.yaml
[known-good] reading versions/0.3.0-known-good.yaml
[known-good] pinned override: @upstash/context7-mcp@1.0.21 (was @1.0.18)
[install-method] npm-cli @upstash/context7-mcp@1.0.21 (pinned via --known-good)
[dry-run] would invoke: npm install -g @upstash/context7-mcp@1.0.21
[exit 2] dry-run sentinel

## § 3 Diff Output (git diff verbatim)

$ git diff versions/0.3.0-known-good.yaml
--- a/versions/0.3.0-known-good.yaml
+++ b/versions/0.3.0-known-good.yaml
@@ -3,5 +3,5 @@ upstreams:
   - name: ctx7
-    version: '1.0.18'
+    version: '1.0.21'
     install_method: npm-cli

## § 4 Post-Upgrade State Verification

$ harnessed install ctx7 --known-good --dry-run --non-interactive
[known-good] pinned override: @upstash/context7-mcp@1.0.21 (matches)
[dry-run] would invoke: npm install -g @upstash/context7-mcp@1.0.21
[exit 2] dry-run sentinel

# E2E verified: known-good lock mechanism propagates upstream version bump correctly.
# Re-record this log per docs/CONTRIBUTING-BENCHMARK.md step 2 when versions/<ver>-known-good.yaml updates.
```

**Karpathy hard limit ≤150L** (4 section × ~20-40L each = ~100-150L acceptable; current sketch ~70L sample for 1 manifest; planner Discretion #5 may add 2nd manifest ctx7+gstack doubling to ~140L still ≤150L hard).

### 2.5 `docs/CONTRIBUTING-BENCHMARK.md` NEW (≤30L per CONTEXT D-04 sneak block — manual re-run instructions)

**ADAPT-NEW** ultra-minimal 6-section structure per CONTEXT D-04 sneak block L67 verbatim "≤30L manual re-run instructions" (Karpathy YAGNI 0 infra cost; sister Phase 3.4 D-02 DOCTOR-ONLY-WARN 安静 一致):

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

## Step 1 — Routing harness re-run

```bash
pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts
# Expected: 30/30 = 100% hit rate maintained
```

## Step 2 — E2E upgrade log re-capture

```bash
# Pick 1-2 manifest from versions/0.3.0-known-good.yaml
harnessed install ctx7 --known-good --dry-run --non-interactive 2>&1 | tee -a docs/benchmarks/v0.4-upgrade-e2e.log
# 4 section: pre-state + upgrade command + diff + post-state per D-03
```

## Step 3 — Update docs/benchmarks/v0.4.md if any hit/miss verdict changed

D-02 sneak block: NOT suppress miss cases; recovery_path column MUST be filled if miss.

## Step 4 — Commit + push

NO CI gate fires (D-04 MANUAL); commit + push directly to main.
```

**Karpathy hard limit ≤30L hard** per CONTEXT (current sketch ~30L — exact match); **planner Discretion #4** alternative = fold into `docs/benchmarks/v0.4.md` § header section if separate file 8 nested header bloat — recommend separate file per CONTEXT default lock.

---

## § 3 Cross-cutting Patterns (D-decisions + Karpathy 守门)

### D-01 REUSE Phase 3.4 SAMPLES.md (防御 EXPAND/MIX/synthetic sneak)

- **Sneak block**: planner / executor MUST NOT add synthetic miss cases beyond Phase 3.4 SAMPLES 30 row OR re-mine git log for new samples (CONTEXT § decisions L22-25).
- **Source consumer**: `docs/benchmarks/v0.4.md` reads 30 row content directly from `.planning/phase-3.4/SAMPLES.md` (single SoT; NO drift between routing test fixture + public benchmark — sister Phase 3.4 R3 frozen lock 一致).
- **Pre-flight verify**: benchmark v0.4.md § 2 task count MUST = 30 (sister SAMPLES.md frozen 30-row) + each task's source_commit field MUST match SAMPLES.md row (regression-test via `tests/benchmark/benchmark-format.test.ts` IF planner enables that target row 8).
- **Frozen marker**: sister Phase 3.4 SAMPLES.md § 3 cherry-pick 防御 + ADR-needed-to-amend extended to benchmark v0.4.md § 4.

### D-02 FULL per-task disclosure (防御 AGGREGATE-only / sanitize sneak)

- **Sneak block** (3 守门 per CONTEXT L37-39):
  - planner / executor MUST publish raw prompt (NOT sanitized/paraphrased)
  - planner / executor MUST publish actual decision_rules.yaml routing path (rule_id + tier + skill)
  - planner / executor MUST NOT suppress miss cases (current 30/30 但 schema 保留 recovery_path column for v0.5+ transparency)
- **Sister precedent**: R9.2 透明度 sister Karpathy "路由决策 100% 可追溯" + 反 ROADMAP L222 "数据美化诱惑" 风险.
- **Schema forward-compat** (planner Discretion #2): Phase 3.4 SAMPLES.md 7-col → benchmark public 8-9 col (add task_description_human_readable + actual_command_run + manual_review_verdict + recovery_path) — SAMPLES.md frozen 30-row data MUST be losslessly projectable.

### D-03 TEXT LOG plain `.log` (防御 asciinema / mp4/gif sneak)

- **Sneak block** (3 守门 per CONTEXT L51-53):
  - planner / executor MUST NOT add asciinema npm dep (违 zero-dep precedent sister Phase 3.1 D-01 enforceBudget /4 + Phase 3.4 D-03 Buffer.byteLength /4)
  - planner / executor MUST NOT commit binary mp4/gif/png files >100KB (git diff hostile)
  - planner / executor MUST capture 4-section text log (pre-upgrade state + upgrade command + diff output + post-upgrade state)
- **Sister precedent**: sister Phase 3.1 checkpoint TEMPLATE plain-text turn-dump (zero LLM call mechanical capture) + sister Karpathy zero-dep precedent.

### D-04 MANUAL on-demand BenchmarkCI (防御 weekly cron / per-PR sneak)

- **Sneak block** (3 守门 per CONTEXT L64-67):
  - planner / executor MUST NOT add `.github/workflows/benchmark.yml` cron file
  - planner / executor MUST NOT add benchmark step to existing `ci.yml` (no new step inserted post-L143 `check-deferred-items.mjs` block)
  - planner SHOULD add `docs/CONTRIBUTING-BENCHMARK.md` ≤30L (default lock per CONTEXT)
- **Sister cadence**: Phase 3.4 routing harness `tests/routing/phase-3.4-routing-hit-rate.test.ts` 已 per-PR gate via `pnpm test` (post-554b82b CI hotfix 保障) — benchmark CI 重复 redundant.
- **Karpathy YAGNI**: 0 infra cost (no new GitHub Action workflow file); benchmark = static publish artifact NOT live CI dashboard.

### W0.1 ENFORCE flip safety (防御 unsafe flip cherry-pick)

- **Sneak block**: NOT flip `ENFORCE=true` until pre-flight dry-run with `ENFORCE=true` simulation passes exit 0; W0.3 D2 cadence iter 2 MUST ship FIRST as W0.1 prerequisite (path dependency W0.3 → W0.1 → W0.5).
- **Sister cadence**: Phase 2.2 W0 transparency gate ENFORCE flip 1-phase cadence延袭 (Phase 2.1 W3 warn-only ship → Phase 2.2 W0 ENFORCE=true flip = identical cadence Phase 3.4 W0.1 ship → Phase 4.1 W0.1 flip).

### W0.5 conditional D1 round 2 tighten (防御 over-tighten brittle)

- **Sneak block**: NOT tighten `SIZE_LIMIT = 200 → 150` until W0.3 archive outcome verified STATE.md ≤140L (sister Phase 3.4 W0.1 round 1 ≤200L precedent established headroom; round 2 ≤150L only if ≥10L headroom maintained post-archive).
- **Conditional path**: per CONTEXT W0.5 conditional — if W0.3 outcome holds STATE ≤140L → flip; otherwise DEFER Phase 4.2 W0 (LOW priority).

### Karpathy hard limit ≤200L/file (B-06 + B-26 — Phase 4.1 budget verify)

- **`docs/benchmarks/v0.4.md` ≤400L hard** per planner Discretion #1 (30 row × ~10L FULL section = ~300L + header/footer ~50-80L = ~350-400L acceptable; expand from ≤200L sister artifact precedent because D-02 FULL per-task disclosure necessarily expands beyond table-only).
- **`docs/benchmarks/v0.4-upgrade-e2e.log` ≤150L hard** (4 section × ~20-40L each; D-03 TEXT LOG < 50KB cross-OS portable).
- **`docs/CONTRIBUTING-BENCHMARK.md` ≤30L hard** per CONTEXT D-04 explicit lock.
- **`.planning/phase-4.1/DOGFOOD-T2.X.md` ≤60L hard** sister Phase 3.4 DOGFOOD 55L precedent.
- **`scripts/check-state-archive-stale.mjs` MODIFY**: 54L → 54L (1-line literal swap zero size delta).
- **`.planning/STATE.md` W0.5 conditional ≤150L OR ≤200L** (sister Phase 3.4 round 1 148L baseline).

### biome preempt + ralph-loop discipline (5-recurrence terminus 续 — Phase 4.1 minimal source code surface)

- Phase 4.1 main surface = docs (markdown) + 1-line scripts/*.mjs MODIFY — minimal TS/JS code change; biome preempt only fires IF planner enables target row 7 `scripts/run-benchmark.mjs` NEW OR target row 8 `tests/benchmark/benchmark-format.test.ts` NEW (both recommended DROP per YAGNI).
- IF row 7/8 enabled: `pnpm exec biome check --write` before commit MANDATORY per project memory `feedback_biome-preempt.md` user lock (3 CI-red recurrence terminus).

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| **W0 prereq backlog (3 项 absorbed)** | | |
| `scripts/check-state-archive-stale.mjs` W0.1 MODIFY (1-line ENFORCE flip) | **~98%** | sister Phase 2.2 W0 transparency gate ENFORCE=true flip cadence 1-line literal swap |
| `.planning/STATE.md` W0.5 conditional D1 round 2 trim ≤150L | **~85%** | Phase 3.4 W0.1 D1 trim massive-restructure precedent + 1-line SIZE_LIMIT swap if conditional path |
| W0.3 D2 cadence iter 2 ship-time T2.2 sub-step | **~95%** | Phase 3.4 W2 T2.2 step 3 1st-implementation verbatim — target swap Phase 3.1+3.2 → Phase 3.3+3.4 |
| **W1 main scope (5 项)** | | |
| `docs/benchmarks/v0.4.md` NEW ~300-400L | **~70%** | Phase 3.4 SAMPLES.md § 1+2+3 frame reuse + DOGFOOD verdict header + D-02 FULL per-task NEW expansion (30 sections × 6-field schema) |
| `docs/benchmarks/v0.4-upgrade-e2e.log` NEW ~50-150L | **~50%** | NEW surface — sister Phase 3.1 checkpoint TEMPLATE plain-text + Phase 3.3 install-aliases spawn capture pattern源; 4-section structure ADAPT per D-03 |
| `docs/CONTRIBUTING-BENCHMARK.md` NEW ≤30L | **~60%** | NEW surface — sister TRANSPARENCY-VERDICT-CHECKLIST.md companion contributor doc pattern; ultra-minimal 6-section ADAPT |
| `scripts/run-benchmark.mjs` NEW (recommend DROP per YAGNI) | **~70%** | sister check-deferred-items.mjs skeleton IF retained; otherwise dropped (target count 14→13) |
| `tests/benchmark/benchmark-format.test.ts` NEW (recommend DROP per YAGNI) | **~75%** | sister Phase 3.4 W1 T1.5 check-state-archive-stale.test.ts 3-fixture pattern IF retained |
| **W2 ship (6 项 — NO ADR 0018 + NO A7 iter ci.yml this phase)** | | |
| `.planning/STATE.md` 续编 Phase 4.1 SHIPPED + W0.3 D2 archive | **~98%** | Phase 3.4 W2 T2.2 1:1 replicate with content swap (Phase 4.1 entry + v0.4.0 1/3 + Phase 3.3+3.4 archive) |
| `.planning/RETROSPECTIVE.md` 续编 Phase 4.1 6-section + receive D2 archive | **~95%** | Phase 3.4 W2 T2.3 6-section format 1:1 replicate with content swap |
| `.planning/ROADMAP.md` Phase 4.1 ✅ SHIPPED + v0.4.0 1/3 marker | **~98%** | Phase 3.4 W2 T2.4 1:1 replicate (v0.4.0 progress 0/3→1/3; NO ARCHIVED until Phase 4.3 close) |
| `README.md` L9 Status + Phase 4.1 row + v0.4.0 1/3 | **~98%** | Phase 3.4 W2 T2.5 1:1 replicate STATUS_MARKER path延袭 |
| `PROJECT-SPEC.md` L3 Status Phase 4.1 SHIPPED literal | **~98%** | Phase 3.4 W2 T2.6 1:1 replicate FRONT_MATTER_DOCS gate延袭 |
| `.planning/phase-4.1/DOGFOOD-T2.X.md` NEW + single tag push | **~85%** | Phase 3.4 DOGFOOD-T2.X.md 55L 3-axis format 1:1 with axes ADAPT (benchmark v0.4.md axis + e2e log axis + W0.1+W0.3 institutionalize axis); single tag NOT triple (NO ADR 0018 + NO 🎯 v0.4.0 until Phase 4.3 close) |

**总 reuse %**: **~85%** (14 target weighted average; sister Phase 3.3 100% + Phase 3.4 ~83% + Phase 2.4 ~76% range 中等偏上)

- **拉高因素**: 6 sister direct copy ≥95% reuse (W0.3 D2 iter 2 + 5-doc 续编 all sister Phase 3.4 W2 T2.2-T2.6 verbatim 1:1 replicate; W0.1 1-line ENFORCE flip 98%)
- **拉低因素**: W1 docs/benchmarks/v0.4.md 70% (D-02 FULL per-task disclosure expansion NEW surface adds ~150L beyond SAMPLES.md frame) + e2e log 50% (NEW surface no direct analog) + CONTRIBUTING-BENCHMARK 60% (NEW surface)
- **NO拉低**: W2 ship cluster高度复用 sister Phase 3.4 cadence (5-doc 续编 + DOGFOOD + tag pattern全 ≥85%); NO new ADR + NO A7 iter ci.yml this phase = 0 architectural surface change Phase 4.1 = pure dogfood publish

**对比 Phase 3.4**: 17 target 100% / Phase 4.1 14 target ~85% — Phase 4.1 lower target count因 NO ADR + NO new src/ surface code (Phase 4.1 = docs publish phase NOT code phase like Phase 3.4 routing harness + check-token-budget + doctor 8th); reuse 整体 vs Phase 3.4 ~83% 接近 (+2%); 拉高因W2 cadence sister cadence solidified across 4 phase consecutive ship cadence 1:1 replicate

---

## § 5 Path Dependency (Wave A R1 → Wave B planner → Wave C execute)

```
W0.3 D2 cadence iter 2 (Phase 3.3+3.4 narrative → RETROSPECTIVE)  ──┐
                  │                                                  │
                  ▼ (path dep — W0.3 archive REDUCES STATE size, gates W0.1 ENFORCE flip)
                                                                     │
W0.1 D3 ENFORCE flip (false → true; pre-flight verify STATE ≤200L) ──┤
                  │                                                  │
                  ▼ (path dep — W0.1 ENFORCE=true MUST pass post-W0.3 archive)
                                                                     │
W0.5 conditional D1 round 2 tighten (≤200 → ≤150 IF STATE ≤140 ─────┤
                  post-W0.3 archive)                                 │
                                                                     │
                  ├──► W1 main scope (5 项 docs publish — Phase 4.1 anchor R8.1)
                  │     ├── docs/benchmarks/v0.4.md NEW ~300-400L (D-02 FULL per-task + D-01 30-row REUSE)
                  │     ├── docs/benchmarks/v0.4-upgrade-e2e.log NEW ~50-150L (D-03 TEXT LOG 4-section)
                  │     ├── docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L (D-04 MANUAL re-run instructions)
                  │     ├── scripts/run-benchmark.mjs NEW (recommend DROP per YAGNI — fold inline)
                  │     └── tests/benchmark/benchmark-format.test.ts NEW (recommend DROP per YAGNI)
                  │              │
                  │              ▼
                  └──► W2 ship (6 项 — NO ADR 0018 + NO A7 iter ci.yml + NO 🎯 v0.4.0 until Phase 4.3)
                         ├── STATE.md 续编 Phase 4.1 SHIPPED + W0.3 D2 archive sub-step (T2.2 sister)
                         ├── RETROSPECTIVE.md 续编 Phase 4.1 6-section + receive D2 archive (T2.3 sister)
                         ├── ROADMAP.md Phase 4.1 ✅ SHIPPED + v0.4.0 1/3 marker (T2.4 sister)
                         ├── README.md L9 Status + Phase 4.1 row + v0.4.0 1/3 (T2.5 sister)
                         ├── PROJECT-SPEC.md L3 Status Phase 4.1 SHIPPED literal (T2.6 sister)
                         └── DOGFOOD-T2.X.md NEW + baseline tag v0.4.0-alpha.1-benchmark single push
```

**Critical path** (W0.3 → W0.1 → W0.5 → W1 → W2): W0.3 D2 archive REDUCES STATE.md size FIRST (creates ENFORCE=true headroom); W0.1 ENFORCE flip THEN safe (pre-flight verify exit 0); W0.5 conditional tighten only IF post-archive STATE ≤140L; W1 docs publish (Phase 4.1 main scope); W2 ship cluster CLOSES with 5-doc 续编 + DOGFOOD + single baseline tag push.

**Borderline 守门** (W0.1 ENFORCE flip safety): MANDATORY pre-flight dry-run with `ENFORCE=true` simulation BEFORE commit; if exit 1 → W0.3 D2 archive MUST ship FIRST as W0.1 prerequisite (path dependency strict — NOT bypass-able).

**v0.4.0 milestone progress** (Phase 4.1 = 1/3 NOT close): Phase 4.1 = 1st of 3 v0.4.0 phases (Phase 4.2 co-maintainer onboarding R8.2-R8.5 next; Phase 4.3 audit log + ADR 全集 + v1.0-RC last); NO 🎯 v0.4.0 milestone close tag this phase — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭 (3 alpha tags + final milestone tag triple-push).

**Wave A R1+R2 并行可行性**: ✅ R1 (本文档 PATTERNS.md) 与 R2 (RESEARCH.md fresh research) 独立 — R1 mapping analog reuse %, R2 验 (a) routing/decision_rules.yaml v2 rule_id schema export for D-02 disclosure column; (b) versions/0.3.0-known-good.yaml 8 entries actual list verify (planner Discretion #5 manifest selection); (c) Phase 3.4 SAMPLES.md schema 7-col forward-compat to benchmark public 8-9 col (planner Discretion #2 verify lossless projection). Wave B planner 同时消费 R1+R2 输出生成 PLAN.md.

---

## PATTERN MAPPING COMPLETE
