# Phase 4.1: dogfooding benchmark 数据采集 + 公开格式定义 — Research

**Researched**: 2026-05-18
**Domain**: v0.4.0 milestone 1st phase — dogfooding benchmark 公开 (R8.1) + 反"数据美化诱惑" FULL disclosure + e2e 上游升级 TEXT LOG zero-dep + W0 backlog 5 项 carry-forward absorb + sister Phase 3.x 5-phase 连续 cadence
**Confidence**: HIGH (15/18 sections HIGH); MEDIUM (§ 7 conditional W0.5 SIZE_LIMIT flip projection, § 12 e2e manifest pick rationale, § 17 task count estimation)

## § 0 Scope note + sources

Wave A R2 research output, consumed by gsd-planner (Wave B). 4 D-decisions LOCKED in `.planning/phase-4.1/4.1-CONTEXT.md` (D-01 REUSE Phase 3.4 SAMPLES.md 30-row REAL HISTORICAL / D-02 FULL per-task disclosure / D-03 TEXT LOG zero-dep / D-04 MANUAL on-demand benchmark CI) — research only covers (a) D-01~D-04 implementation paths within locked decision boundaries, (b) sister-pattern reuse from Phase 3.4 ship + Phase 2.1 transparency gate cadence + Phase 2.4 v0.2.0 close template, (c) W0 backlog 5 项 absorb recipes (W0.1 D3 ENFORCE flip + W0.3 D2 cadence iter 2 + W0.2 conditional D1 SIZE_LIMIT 200→150 round 2), (d) docs/benchmarks/v0.4.md size budget + 7→8-9 col forward-compat schema, (e) CONTRIBUTING-BENCHMARK.md placement options, (f) e2e upstream manifest pick rationale, (g) sister Phase 3.4 W2 T2.X ship cadence reuse for Phase 4.1 W2.

**Sneak-block守门**: research does NOT propose alternatives to D-01~D-04 LOCKED decisions (no new SAMPLES.md mining proposals, no asciinema fallback discussion, no cron CI proposals, no aggregate-only format proposals).

**Source manifest** (all verified file:line + git show this session):
- `.planning/phase-4.1/{4.1-KICKOFF.md L1-78, 4.1-CONTEXT.md L1-128}` — 4 D-decisions LOCKED + 5 W0 backlog absorb + Discretion + Deferred 全 verbatim
- `.planning/phase-3.4/{RESEARCH.md L1-1094 chunked, SAMPLES.md L1-73, PATTERNS.md L1-200 chunked, deferred-items.md L1-50}` — sister 18-section gold-standard + 30-row REAL HISTORICAL frozen data + 17 target analog mapping + W0 carry-forward source
- `.planning/STATE.md L1-148` — 148L post-Phase 3.4 ship; current state assess (W0.3 D2 cadence iter 2 trim target)
- `.planning/ROADMAP.md L185-225` — v0.4.0 milestone scope verbatim + 拒绝清单
- `.planning/REQUIREMENTS.md L297-302` — R8.1 验收 verbatim
- `scripts/check-state-archive-stale.mjs L1-55` — W0.1 ENFORCE flip target (`ENFORCE = false` L10 → flip `true`)
- `scripts/check-transparency-verdicts.mjs L1-130` — sister ENFORCE flip Pattern (Phase 2.1 W3 warn-only round 1 → Phase 2.2 W0 T0.6 ENFORCE=true cadence; L12 `const ENFORCE = true` verbatim)
- `tests/routing/phase-3.4-routing-hit-rate.test.ts L1-183` — sister routing harness consumer of SAMPLES.md (verify 30-row 7-col schema forward-compat for benchmark column expansion)
- `.github/workflows/ci.yml L1-200` — ci.yml step ordering (T4 CI ordering bug spike target: build BEFORE test post-554b82b hotfix verified; verify `validate:schema` 依赖 `build:schema` 顺序)
- `CONTRIBUTING.md L1-200` — existing CONTRIBUTING for fold-in option vs NEW separate file
- `docs/` directory listing — 4 existing docs (AGENT-DEFINITION-FACTORY-CONTRACT.md, INSTALLER-CONTRACT.md, MAINTAINER-ONBOARDING.md, TRANSPARENCY-VERDICT-CHECKLIST.md) + adr/ + benchmarks/ (empty .gitkeep only)
- `manifests/{tools,skill-packs}/*.yaml` — 16 manifests listed for e2e demo pick (ctx7.yaml, gstack.yaml, tavily-mcp.yaml top 3 candidates per CONTEXT § Discretion)

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 SampleSrc REUSE** (30 sample sourcing): Phase 4.1 benchmark = direct copy + repurpose `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL matrix; **NO new mining** (EXPAND/MIX REJECTED). Consumer: `docs/benchmarks/v0.4.md` reads 30 row directly from SAMPLES.md (single SoT). Sneak-block: planner/executor MUST NOT add synthetic miss cases beyond 30 row; MUST NOT re-mine git log for new samples; benchmark consumer reads from SAMPLES.md not duplicate.
- **D-02 DisclosureLevel FULL** (per-task disclosure granularity): `docs/benchmarks/v0.4.md` per-task disclosure FULL — 每 task 1 section 含: (a) 原始 prompt verbatim / (b) routing decision (tier + skill + rationale) / (c) actual command executed / (d) hit/miss verdict / (e) miss recovery path (current 30/30 100% → recovery_path 全 N/A 但 schema 保留 column for v0.5+ miss case)。HYBRID + AGGREGATE-only REJECTED. Sneak-block: planner/executor MUST publish raw prompt verbatim NOT sanitized; MUST publish actual decision_rules.yaml routing path; MUST NOT suppress miss cases.
- **D-03 e2eRecording TEXT LOG** (上游升级 e2e recording format): plain `.log` text file (e.g., `docs/benchmarks/v0.4-upgrade-e2e.log`) — text-only diff + console output capture; **NO asciinema cast / NO mp4/gif** (REJECTED). 4-section template per log: pre-upgrade state + upgrade command + diff output + post-upgrade state. Sneak-block: planner/executor MUST NOT add asciinema npm dep; MUST NOT commit binary mp4/gif/png files >100KB.
- **D-04 BenchmarkCI MANUAL** (drift detection cadence): MANUAL on-demand (human re-runs benchmark script when SAMPLES expand); **NO weekly cron / NO per-PR full benchmark** (REJECTED). Sister Phase 3.4 routing harness `tests/routing/phase-3.4-routing-hit-rate.test.ts` 已 per-PR gate via `pnpm test` step (post-554b82b CI hotfix). Sneak-block: planner/executor MUST NOT add `.github/workflows/benchmark.yml` cron file; MUST NOT add benchmark step to existing `ci.yml`.

### Claude's Discretion

- `docs/benchmarks/v0.4.md` size budget: ≤400L hard cap (per CONTEXT L89 estimate 300-350L for FULL D-02 30 row × ~10L per row + header + footer summary); planner verify estimate against actual section template (§ 10 hard estimate)
- benchmark schema column count: Phase 3.4 SAMPLES.md = 7 col routing harness format; benchmark public format expand to 8-9 col adding `task_description_human_readable` + `actual_command_run` + `manual_review_verdict` + `recovery_path`; planner verify 7→8-9 col expansion forward-compat with SAMPLES.md frozen 30-row (§ 2)
- W0.3 D2 cadence iter 2 task scope: mechanical trim verbatim sister Phase 3.4 W2 T2.2 pattern reuse (RECOMMENDED) vs. additional cadence formalization checklist doc (over-engineering risk; YAGNI defer) — § 8 recommendation = mechanical trim only
- benchmark MANUAL re-run instructions placement: `docs/CONTRIBUTING-BENCHMARK.md` NEW (≤30L) vs. fold into existing `CONTRIBUTING.md` vs. inline in `docs/benchmarks/v0.4.md` header — § 11 recommendation = separate NEW ≤30L (Karpathy single-purpose doc; fold-in option pollutes CONTRIBUTING.md core 200L)
- e2e upgrade target manifest selection: ctx7 / gstack / tavily-mcp — § 12 recommendation = ctx7 + gstack (2 manifests, single-file npm + multi-step git-clone-with-setup covering both install_method 多样性)

### Deferred Ideas (OUT OF SCOPE)

- plan-feature 真接 gsd-* spawn dogfood → Phase 4.2 or v0.5
- co-maintainer 招募窗口启动 → Phase 4.2 (R8.2)
- stale-bot + issue templates → Phase 4.2 (R8.3)
- 路由透明度日志 `.harnessed/audit.log` → Phase 4.3 (R9.2 + R8.4)
- 公开 ADR 全集补齐 → Phase 4.3 (R8.4)
- GitHub Sponsors 启用 → Phase 4.2 (R8.5)
- v1.0-RC 收尾 → Phase 4.3
- 跨 harness implementation → v0.5+
- 云端 manifest registry → v1.0+
- benchmark CI cron / per-PR gate → REJECTED D-04 (re-evaluate only if SAMPLES.md churn > monthly)
- asciinema cast / mp4 e2e recording → REJECTED D-03 (re-evaluate only if text log 反馈 需要视觉验证 external)
- EXPAND new mining samples → REJECTED D-01 (re-evaluate only if Phase 4.1 dogfood reveals miss case not covered by current 30)

---

## Project Constraints (from CLAUDE.md)

- **路由路径优先级**: gstack (决策层) > GSD (orchestration) > superpowers (子任务执行) > planning-with-files (持久化) > karpathy 心法 (编码) > ralph-loop (交付) — Phase 4.1 是 GSD plan-phase 路径 (discuss → plan → execute → verify)
- **karpathy 4 心法 always-on**: Think Before Coding / Simplicity First (YAGNI) / Surgical Changes / Goal-Driven
- **hard limit ≤200L per file** (B-06 + B-26 + sister 5-phase 连续 hold)
- **biome preempt MANDATORY before commit** (MEMORY `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3) — Phase 4.1 是 docs-heavy phase 但仍有 `.mjs` script touch (W0.1 ENFORCE flip) + 可能 `package.json` / `tests/*.ts` touch → biome preempt 必跑
- **CLAUDE.md is read-only by harnessed installer** (D-02 SKILL-ONLY post-Phase 2.3) — Phase 4.1 不动 CLAUDE.md
- **web search routing**: Tavily MCP (默认) / Exa MCP (语义/学术/批量 URL)
- **ctx7 for library docs**: 本 phase 不调外部 library docs (纯 dogfood + docs + script flip — zero new dep)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R8.1 | dogfooding benchmark 公开 — 30 真实任务 + 路由决策 + 命中正误 + 上游升级 e2e → `docs/benchmarks/v0.4.md`; 验收 "原始数据公开，任何人可复现" | § 2 D-01 SAMPLES.md → v0.4.md mapping + § 3 D-02 FULL per-task section template + § 4 D-03 TEXT LOG 4-section template + § 5 D-04 CONTRIBUTING-BENCHMARK.md ≤30L reproducibility instructions + § 10 v0.4.md size budget ≤400L |
| ROADMAP L185-225 v0.4.0 scope | v0.4.0 必含 6 项: R8.1 (本 phase) + R8.2 + R8.3 + R8.4 + 路由透明度日志 + R8.5 — Phase 4.1 anchor R8.1 only | § 0 scope note: Phase 4.1 仅 R8.1; R8.2-R8.5 + 透明度日志 → Phase 4.2/4.3 explicit out-of-scope per CONTEXT Deferred |
| ROADMAP L222 "数据美化诱惑" 风险 | 原始 prompt + 决策 + 命中正误必须公开 | D-02 FULL per-task disclosure (raw prompt verbatim + decision_rules.yaml routing path + hit/miss verdict + recovery path schema column reserved) — sneak-block 守门 planner/executor MUST NOT sanitize/paraphrase/suppress |
| W0 carry-forward (sister Phase 3.4 deferred-items.md L13-21) | 5 项 W0 prereq backlog absorb (DEFERRED #AF D3 ENFORCE flip + sister M2 D2 cadence iter 2 + DEFERRED #AE+#AH path traversal + DEFERRED #AG D1 round 2 SIZE_LIMIT tighten) | § 6 W0.1 D3 ENFORCE flip recipe (sister Phase 2.1 cadence) + § 7 W0.2 conditional D1 SIZE_LIMIT 200→150 + § 8 W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative + § 9 T4 CI ordering spike (folded into W0.3 sub-task per CONTEXT) |
| Karpathy hard limit (B-06 + B-26) | ≤200L per file 5-phase 连续 hold | § 10 (docs/benchmarks/v0.4.md ≤400L is docs not src; Karpathy docs precedent ADR ≤250L + SAMPLES ≤200L 范围) + § 11 (CONTRIBUTING-BENCHMARK.md ≤30L) + § 6.4 (scripts/check-state-archive-stale.mjs ENFORCE flip = 1-line change, file remains 54L ≤60L target) |
| biome preempt (MEMORY) | 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 | § 15 mandatory pre-commit `pnpm exec biome check --write` for any `.ts/.js/.mjs/.json` touch (Phase 4.1 W0.1 ENFORCE flip is `.mjs` touch → must run) |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 30-row benchmark public data publication (REAL HISTORICAL dogfood) | docs-governance (`docs/benchmarks/v0.4.md` FULL D-02 per-task disclosure) | source-of-truth (`.planning/phase-3.4/SAMPLES.md` 30-row frozen, single SoT D-01) | Phase 3.4 SAMPLES.md 100% routing PASS dogfood already verified; v0.4.md is public-readable rendering of SAMPLES.md + decision_rules.yaml routing path verbatim — NO new mining (D-01 sneak-block); single SoT prevents drift between public benchmark and routing test fixture |
| e2e upstream upgrade text log (zero-dep grep-able recording) | docs-governance (`docs/benchmarks/v0.4-upgrade-e2e.log` plain text) | manual capture (4-section template: pre-state / upgrade cmd / diff / post-state) | D-03 sister Karpathy zero-dep precedent (asciinema needs npm devDep REJECTED); text-only is cross-OS portable + git diff friendly; planner picks 1-2 representative manifests (ctx7 + gstack recommended) for demo upgrade flow |
| Benchmark drift detection (manual cadence) | docs-governance (`docs/CONTRIBUTING-BENCHMARK.md` ≤30L reproducibility instructions) | existing CI (`tests/routing/phase-3.4-routing-hit-rate.test.ts` per-PR gate via `pnpm test`) | D-04 MANUAL: SAMPLES.md frozen (no drift源); per-PR routing.test.ts already covers regression; benchmark public format = static publish artifact, manual re-run when SAMPLES expand; NO `.github/workflows/benchmark.yml` cron (sneak-block) |
| W0.1 D3 ENFORCE flip (STATE.md archive cadence enforcement) | tool-script (`scripts/check-state-archive-stale.mjs` L10 `ENFORCE = false` → `true` 1-line) | CI gate (existing ci.yml step `node scripts/check-state-archive-stale.mjs` already wired Phase 3.4) | Sister Phase 2.1 transparency verdict-marker gate cadence (`scripts/check-transparency-verdicts.mjs` L12 `const ENFORCE = true`; Phase 2.1 W3 ship `false` → Phase 2.2 W0 T0.6 flip `true` 1-phase round 1 cadence verified); pre-flight verify STATE.md ≤200L 当前 = 148L 已绿 → flip safe |
| W0.3 D2 cadence iter 2 (Phase 3.3+3.4 narrative trim) | docs-governance (`.planning/STATE.md` trim to ≤140L expected post-trim) | RETROSPECTIVE.md absorb (Phase 3.3+3.4 narrative → § ARCHIVED FROM STATE — Phase 3.3+3.4 subsection) | Sister Phase 3.4 W2 T2.2 first-implementation (Phase 3.1+3.2 narrative archived) verbatim 2nd cadence test — verifies D2 standing process really fires beyond first-implementation; W2 ship-time T2.N task per CONTEXT W0.3 = HIGH priority |
| T4 CI ordering bug spike | tool-script (verify `ci.yml` step ordering integrity) | folded into W0.3 sub-task (30 min spike per CONTEXT L83) | Post-554b82b hotfix verified `build BEFORE test` ordering correct; spike target = `validate:schema` 依赖 `build:schema` 正确 sequenced + check 其他 step ordering for similar latent (§ 9) |
| v0.4.0-alpha.1-benchmark baseline tag (Phase 4.1 W2 ship) | git tag (sister Phase 3.4 W2 T2.7 baseline tag iterate cadence) | A7 守恒 hold (ADR 0001-0017 main body 0 diff post-ship — Phase 4.1 NO new ADR per benchmark = docs phase) | Sister Phase 3.4 ship tag cadence: per-phase milestone tag `v0.3.0-alpha.4-routing`. Phase 4.1 derived: `v0.4.0-alpha.1-benchmark` (CONTEXT L70 explicit); A7 verify ADR 0001-0017 0 diff post-Phase-4.1 ship (§ 14) |

---

## § 1 Baseline verify (docs/benchmarks/ empty + Phase 3.4 SAMPLES.md 73L 30-row 7-col)

**Confidence: HIGH** — `ls docs/benchmarks/` returns `.gitkeep` only (0 .md files); `wc -l .planning/phase-3.4/SAMPLES.md` = **73L** (本 session bash 直证); SAMPLES.md § 2 truth table = 30 row × 7 col format (verified L32-63 verbatim).

### 1.1 docs/benchmarks/ baseline state

```
docs/benchmarks/
└── .gitkeep   (0 bytes; placeholder only, Phase 1.X seed)
```

**Action**: Phase 4.1 W1 creates `docs/benchmarks/v0.4.md` (main artifact, ~300-400L) + `docs/benchmarks/v0.4-upgrade-e2e.log` (1-2 file per representative manifest, ~50-100L each per pre/cmd/diff/post 4-section). Existing `.gitkeep` 删 OR 保留 (Karpathy YAGNI — 保留 1-line .gitkeep harmless).

### 1.2 Phase 3.4 SAMPLES.md 73L 30-row 7-col schema (D-01 source-of-truth)

7-col header (verified L32 verbatim):
```
| #  | task_id | model_expected | task_type | description (≤120 chars) | source_commit | expected_decision (yaml inline) |
```

Distribution verified L34-63: 10 haiku (T01-T10) + 10 sonnet (T11-T20) + 10 opus (T21-T30) ✅. Per-row source_commit non-empty (D-01 sneak-block 守门 Phase 3.4 W0.5 already enforced). Frozen marker L65-73 explicit: "execute-phase 不允许改样本 (R3 lock)".

### 1.3 Routing harness consumer verify (forward-compat check)

`tests/routing/phase-3.4-routing-hit-rate.test.ts` L48 `SAMPLES_PATH = '.planning/phase-3.4/SAMPLES.md'` + L56-57 row regex parses exactly 7 cols (`(0[1-9]|[12][0-9]|30)\s*\|\s*(T\d{2})\s*\|\s*(haiku|sonnet|opus)\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*\`([0-9a-f]{7,10})\`\s*\|\s*\`(\{[^`]+\})\`\s*\|`).

**Forward-compat constraint**: SAMPLES.md 30-row 7-col schema is **frozen by D-01** (R3 lock from Phase 3.4) AND consumed by phase-3.4-routing-hit-rate.test.ts. Phase 4.1 benchmark MUST NOT mutate SAMPLES.md to add public-facing columns (would break test parser). Instead: `docs/benchmarks/v0.4.md` is a **rendered view** of SAMPLES.md + decision_rules.yaml + actual_command_run (manually derived per-task at Phase 4.1 W1 time) + manual_review_verdict ("hit" for 30/30 100% per Phase 3.4 W1 T1.6 result).

[HIGH — bash ls verified empty docs/benchmarks/; bash wc -l SAMPLES.md = 73L; bash grep -c '^| 0' SAMPLES.md = 30; test parser regex 7-col forward-compat verified L56-57]

---

## § 2 D-01 implementation: SAMPLES.md → docs/benchmarks/v0.4.md mapping (7→8-9 col forward-compat)

**Confidence: HIGH** — D-01 LOCKED REUSE; mapping path derived from SAMPLES.md + decision_rules.yaml + routing test result + planner Discretion #2 column expansion.

### 2.1 Mapping table (per-row transformation)

| SAMPLES.md col | docs/benchmarks/v0.4.md col | Source | Forward-compat |
|----------------|------------------------------|--------|----------------|
| `#` | `#` | direct copy | ✅ |
| `task_id` | `task_id` | direct copy | ✅ |
| `model_expected` | `tier` | direct rename (haiku/sonnet/opus → reader-friendly) | ✅ |
| `task_type` | `task_type` | direct copy | ✅ |
| `description (≤120 chars)` | `task_description_human_readable` (D-02 expansion) | expand: SAMPLES.md description (terse engineering-internal) → human-readable full sentence (planner manually expands at W1 time) | Planner adds; SAMPLES.md not mutated |
| `source_commit` | `source_commit` | direct copy (with git URL hyperlink in markdown) | ✅ |
| `expected_decision (yaml inline)` | `routing_decision` (rule_id + tier + skill + rationale) | derive: parse yaml inline → manually trace `routing/decision_rules.yaml` v2 12 rules + 5 engineering sub-rules + 23 招式 → render rule_id + tier (Haiku/Sonnet/Opus) + skill (e.g., `karpathy-baseline`, `engineering-execute-tdd`) + rationale string | Planner derives; SAMPLES.md not mutated |
| (NEW D-02) | `actual_command_run` | derive: from source_commit `git show <sha> --stat` → infer command (e.g., `vi .planning/phase-3.4/SAMPLES.md`) | Planner adds; manual derivation |
| (NEW D-02) | `manual_review_verdict` | 'hit' for 30/30 100% per Phase 3.4 W1 T1.6 routing harness PASS | Planner copies from routing test result |
| (NEW D-02) | `recovery_path` | 'N/A (hit)' for 30/30 100%; schema reserved for v0.5+ miss cases per D-02 sneak-block | Planner adds explicit 'N/A' to defend schema reservation |

### 2.2 Column count expansion (7 → 9-10 cols)

Phase 3.4 SAMPLES.md 7 cols → docs/benchmarks/v0.4.md **9 cols** (Karpathy YAGNI hard cap): `#` + `task_id` + `tier` + `task_type` + `description` + `source_commit` + `routing_decision` + `actual_command_run` + `manual_review_verdict` + `recovery_path` = 10 cols if all NEW added.

Per CONTEXT § Discretion L90 estimate "8-9 col", planner recommended: **drop `task_type` AND `tier`** from public table view (keep in source SAMPLES.md but redundant in v0.4.md when `routing_decision` includes tier already). Final = **8 cols**: `#` + `task_id` + `task_description_human_readable` + `source_commit` + `routing_decision` + `actual_command_run` + `manual_review_verdict` + `recovery_path` ✅ (sister Discretion target).

### 2.3 Single SoT enforcement (sneak-block守门)

Per D-01 sneak-block: `docs/benchmarks/v0.4.md` MUST reference SAMPLES.md as source ("Source data: `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL mining 302 commits Phase 3.4 W0.5") and MUST NOT duplicate SAMPLES.md data verbatim — instead, render derived/expanded view + cross-link.

**Anti-drift gate**: planner adds 1-line manual reminder in v0.4.md header — "If SAMPLES.md updated, re-render this file manually per CONTRIBUTING-BENCHMARK.md (D-04 MANUAL cadence)." No automated drift check (D-04 sneak-block: no `.github/workflows/benchmark.yml`).

[HIGH — SAMPLES.md 7-col schema verified verbatim; column expansion derivation grounded in routing test result + decision_rules.yaml v2 production rules; sneak-block守门 explicit per CONTEXT D-01]

---

## § 3 D-02 FULL disclosure format design (per-task section template)

**Confidence: HIGH** — D-02 LOCKED FULL; format derived from "raw prompt + decision + verdict + recovery" 5-element verbatim per CONTEXT L30.

### 3.1 Per-task section template (~10L per task estimate × 30 task = ~300L core body)

Sister 5-element format per D-02 (CONTEXT L30 verbatim "(a) 原始 prompt verbatim / (b) routing decision / (c) actual command / (d) hit/miss verdict / (e) miss recovery path"):

```markdown
### T01 (haiku / chore) — single-file dir scaffold

**Raw prompt** (verbatim from `.planning/phase-3.2/task_plan.md` W0 T0.4 — Phase 3.4 SAMPLES.md row 01):
> tests/manifest + tests/manifest/schema dirs setup (sister Phase 3.2 W0 T0.4 pattern)

**Routing decision** (from `routing/decision_rules.yaml` v2 12-rule + 5 engineering sub-rule):
- Rule matched: **none** (router=B fallback per SAMPLES.md L34 expected_decision `{router: B, reason: 'single-file dir scaffold chore'}`)
- Tier: **Haiku** (single-file mechanical edit)
- Skill: **karpathy-baseline** (default trivial chore handler)

**Actual command executed** (per git show `43ce181 --stat`):
```bash
git commit -m "chore(phase-3.4-w0): T0.4 — tests/manifest + tests/manifest/schema dirs setup"
```

**Manual review verdict**: ✅ **hit** (router=B actual matches router=B expected; per `tests/routing/phase-3.4-routing-hit-rate.test.ts` 30/30 PASS)

**Miss recovery path**: N/A (hit — schema reserved for v0.5+ miss case per D-02 sneak-block)

---
```

### 3.2 Section count + size estimate (~300L core body)

- Per-task section: ~10L markdown (5 element labels + content + separator)
- 30 task × ~10L = **~300L core body**
- Plus header (size 30L + TL;DR table) + footer summary (per-tier breakdown + total accuracy + 反"美化"声明 + Source links) ~50L
- **Total estimate ≈ 350L** ≤ 400L hard cap (CONTEXT § Discretion L89) ✅

### 3.3 Sneak-block守门 enforcement (CONTEXT D-02 verbatim)

| Sneak-block | Enforcement mechanism |
|-------------|----------------------|
| MUST publish raw prompt (NOT sanitized/paraphrased) | Planner verbatim copy from source (SAMPLES.md description OR task_plan.md original task line); reviewer grep check "verbatim from `.planning/phase-3.X/task_plan.md`" attribution in every T## section |
| MUST publish actual decision_rules.yaml routing path (rule_id + tier + skill) | Planner manually trace routing/decision_rules.yaml v2 per row; rule_id field explicit (e.g., `engineering-execute-tdd`, OR explicit `none (router=B fallback)`) |
| MUST NOT suppress miss cases | Recovery_path column explicit 'N/A (hit)' for 30/30; schema reservation documented in footer ("For v0.5+ miss cases, this column will capture concrete recovery steps") |

### 3.4 反"美化诱惑" 风险 footer (ROADMAP L222 anchor)

Footer template (~10L):

```markdown
## 反"数据美化诱惑" 声明 (per ROADMAP L222 v0.4.0 风险)

本 benchmark 公开**原始 prompt + 路由决策 + 命中正误**, 不删/不改/不重新挑选 sample。

- 数据源: `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL mining 302 commits Phase 3.4 W0.5
- 路由测试 fixture (single SoT 一致): `tests/routing/phase-3.4-routing-hit-rate.test.ts` 30/30 PASS
- 失败案例占比: 0/30 (当前 routing 100%); v0.5+ 若 SAMPLES expand 含 miss case, recovery_path 列必填
- 任何人可复现: `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` (per-PR CI green) + manual benchmark re-render per `docs/CONTRIBUTING-BENCHMARK.md`
```

[HIGH — 5-element format verbatim from CONTEXT D-02; size estimate arithmetic 10L × 30 + 50L margin; sneak-block 3 enforcement mechanisms grounded in CONTEXT守门 spec]

---

## § 4 D-03 TEXT LOG format (4-section template + target manifest selection)

**Confidence: HIGH** — D-03 LOCKED TEXT LOG; 4-section template per CONTEXT L53 verbatim.

### 4.1 4-section template per `docs/benchmarks/v0.4-upgrade-e2e.log` (per manifest)

```log
=== Pre-upgrade state ===
Date: 2026-05-18
Manifest: ctx7
Current pinned version: 0.4.0 (from versions/0.3.0-known-good.yaml)
Doctor 8-check result: 8/8 pass (including 8th check token budget)
Routing test fixture: 30/30 PASS (tests/routing/phase-3.4-routing-hit-rate.test.ts)

=== Upgrade command ===
$ harnessed install ctx7 --version 0.4.1
[installer output verbatim, line-by-line]

=== Diff output ===
[git diff --stat output verbatim]
[before/after install manifest version diff]

=== Post-upgrade state ===
Date: 2026-05-18 (~5 min after upgrade)
Manifest: ctx7
New pinned version: 0.4.1
Doctor 8-check result: 8/8 pass
Routing test fixture: 30/30 PASS (no regression)
e2e smoke test: `npx ctx7@0.4.1 library "react"` returns valid JSON ✅
```

### 4.2 Target manifest selection rationale (planner Discretion #5)

CONTEXT § Discretion L93 candidates: ctx7 / gstack / tavily-mcp. Recommendation: **ctx7 + gstack** (2 manifests covering install_method 多样性):

| Manifest | install_method | Why representative | Estimated log size |
|----------|---------------|--------------------|--------------------|
| **ctx7** | `npm-cli` (per `manifests/tools/ctx7.yaml`) | Single-file npm dep, fast upgrade, deterministic version pinning, popular library docs lookup tool (recent v0.4.0 ship 验证 npm-cli upgrade path) | ~50-80L per log (compact diff) |
| **gstack** | `git-clone-with-setup` (per `manifests/skill-packs/gstack.yaml` L22 `git_ref` SHA-pinned) | Multi-step git clone + setup script, covers git_ref SHA upgrade flow (~74895062 SHA mentioned Phase 3.4 RESEARCH § 7.1), tests git-pinned upstream cadence | ~80-100L per log (multi-step) |

**Skip tavily-mcp** for v0.4.0 round 1 — `mcp-stdio-add` install_method already covered by Phase 2.2/2.3 install dogfood; adding 3rd manifest = +50L docs bloat for marginal value; planner can add tavily-mcp in v0.5+ if external feedback requests.

### 4.3 Sneak-block守门 enforcement (CONTEXT D-03 verbatim)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT add asciinema npm dep | Pre-commit grep gate `grep -q "asciinema" package.json && echo FAIL && exit 1` (planner adds W0/W1 verify step) |
| MUST NOT commit binary mp4/gif/png files >100KB | git pre-commit check: `git ls-files docs/benchmarks/ | xargs -I{} test $(wc -c < {}) -lt 102400` — defer to manual review if not gated; OR `file docs/benchmarks/*` returns "ASCII text" only |
| MUST capture 4 sections per log | Reviewer grep: `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` = 4 per log file (Pre / Upgrade / Diff / Post) |

[HIGH — 4-section template verbatim from CONTEXT D-03; 2-manifest pick grounded in install_method 多样性 covering Phase 4.1 main install method spectrum]

---

## § 5 D-04 MANUAL CI: CONTRIBUTING-BENCHMARK.md ≤30L OR fold into CONTRIBUTING.md

**Confidence: HIGH** — D-04 LOCKED MANUAL; CONTRIBUTING.md L1-200 verified present + currently 8 sections (Prerequisites + Setup + Win Workaround + 常用命令 table + Commit format + ADR rules + ...).

### 5.1 Placement options + recommendation

| Option | Pro | Con | Verdict |
|--------|-----|-----|---------|
| (a) `docs/CONTRIBUTING-BENCHMARK.md` NEW ≤30L | Karpathy single-purpose doc; clear discoverability; matches D-04 CONTEXT L67 explicit name | +1 NEW doc file | **RECOMMENDED** ✅ |
| (b) Fold into existing `CONTRIBUTING.md` | Reduce doc fragmentation | Pollutes 200L core CONTRIBUTING.md (currently dev setup + commit + ADR rules; benchmark re-run = different audience) | NOT recommended |
| (c) Inline header in `docs/benchmarks/v0.4.md` | Co-location with benchmark itself | Adds ~30L to already 350L estimate v0.4.md → ~380L still ≤400L cap but tighter | NOT recommended (v0.4.md is read-only artifact, not how-to) |

### 5.2 CONTRIBUTING-BENCHMARK.md ≤30L content recipe (NEW)

```markdown
# Benchmark Re-run Instructions

> Phase 4.1 R8.1 dogfooding benchmark — manual cadence per D-04 (NO CI cron / NO per-PR full benchmark).

## When to re-run

Re-run benchmark and update `docs/benchmarks/vN.M.md` ONLY when:
1. `.planning/phase-3.4/SAMPLES.md` expands beyond 30-row (currently frozen)
2. `routing/decision_rules.yaml` rule version bumps (v2 → v3+)
3. New harnessed milestone (v0.5+, v0.6+) ships and benchmark public format needs refresh

## How to re-run

```bash
# 1. Verify SAMPLES.md unchanged or note expansion
git log --oneline .planning/phase-3.4/SAMPLES.md

# 2. Run routing harness (must pass 30/30 OR document new tier breakdown)
corepack pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts

# 3. Manually re-render docs/benchmarks/vN.M.md per row
#    Source: SAMPLES.md + decision_rules.yaml + routing test result
#    Format: 5-element per-task disclosure (raw prompt + decision + cmd + verdict + recovery)
#    Size: ≤400L total per file

# 4. Capture 1-2 upgrade e2e logs (text-only, 4-section)
#    Target: docs/benchmarks/vN.M-upgrade-e2e.log
```

## Acceptance

- `docs/benchmarks/vN.M.md` includes all SAMPLES.md rows verbatim-linked
- Per-task `routing_decision` traces to `routing/decision_rules.yaml` rule_id
- `manual_review_verdict` matches `tests/routing/phase-3.4-routing-hit-rate.test.ts` result
```

LOC count: ~28L (with headers) ≤ 30L target ✅.

### 5.3 Sneak-block守门 enforcement (CONTEXT D-04 verbatim)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT add `.github/workflows/benchmark.yml` cron | Reviewer grep: `ls .github/workflows/ | grep -c benchmark` = 0 post-Phase-4.1 ship |
| MUST NOT add benchmark step to existing `ci.yml` | Reviewer grep: `grep -c "benchmark" .github/workflows/ci.yml` = 0 NEW additions (existing routing test step covers per-PR) |
| SHOULD add `docs/CONTRIBUTING-BENCHMARK.md` ≤30L | `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 |

[HIGH — fold-in option evaluated against CONTRIBUTING.md L1-200 verbatim; recommended separate ≤30L grounded in Karpathy single-purpose principle; sneak-block 3 enforcement grep gates explicit]

---

## § 6 W0.1 D3 ENFORCE flip recipe (sister Phase 2.1 transparency gate cadence)

**Confidence: HIGH** — sister `scripts/check-transparency-verdicts.mjs` L12 `const ENFORCE = true` verbatim verified; Phase 2.1 W3 warn-only round 1 → Phase 2.2 W0 T0.6 ENFORCE=true 1-phase cadence verified.

### 6.1 1-line change recipe (CONTEXT W0.2 absorb FIRST TASK)

`scripts/check-state-archive-stale.mjs` L10 current state:

```javascript
const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF
```

Phase 4.1 W0.1 flip (1-line edit):

```javascript
const ENFORCE = true // Phase 4.1 W0.1 flip — sister Phase 2.1 transparency gate cadence (1-phase warn-only round 1 → ENFORCE round 2)
```

LOC delta: 0 (1-line value flip, no LOC change). File total: **54L** (verified bash) unchanged ≤60L target ✅.

### 6.2 Pre-flight verify (STATE.md must satisfy 3 rules before flip)

Per ENFORCE flip CADENCE — flip MUST be safe (no violation triggers CI fail post-flip):

| Rule | Current state (148L STATE.md) | Pass? |
|------|-------------------------------|-------|
| Rule 1: STATE.md ≤200L (SIZE_LIMIT) | 148L ≤ 200L | ✅ |
| Rule 2: `关键决议 ship 总结` section count ≤ 1 | grep `^##.*关键决议.*ship.*总结` STATE.md = 0 matches (post-Phase 3.4 D-04 COLLAPSE moved sections out) | ✅ |
| Rule 3: W-N errata / sister review M[1-9] 修正 literal 禁字面 | grep `W-[1-9]\s+errata\|sister\s+review\s+M[1-9]\s+修正` STATE.md = 0 matches (post-Phase 3.4 W0.1 D1 single-SoT institutionalize) | ✅ |

**All 3 rules currently green** — flip is safe (no breaking CI on flip commit). Pre-flight task: planner W0 first task = `node scripts/check-state-archive-stale.mjs` returns 0 violations BEFORE flip commit.

### 6.3 Sister Phase 2.1 transparency gate ENFORCE flip cadence (verbatim verified)

- Phase 2.1 T1.7 ship 2026-05-15 — `ENFORCE = false` round 1 (warn-only)
- Phase 2.2 W0 T0.6 ship 2026-05-15 — `ENFORCE = true` flip (1-phase warn-only round 1 → ENFORCE round 2; commit history verified)

Phase 4.1 W0.1 D3 mirror: round 1 ship Phase 3.4 W0.1 (2026-05-17) — flip Phase 4.1 W0.1 (2026-05-18, 1-phase cadence). Same cadence verbatim verified.

### 6.4 Test coverage (existing fixture already covers)

Phase 3.4 W1 already added `tests/scripts/check-state-archive-stale.test.ts` (per Phase 3.4 RESEARCH § 10.3 W0.5 test gap list). Phase 4.1 W0.1 reuses fixture; no NEW test needed for ENFORCE flip itself (fixture asserts rule logic, not ENFORCE flag — flag is runtime behavior verified by integration: CI green = flip safe).

**Optional NEW assertion**: planner may add 1 fixture `tests/scripts/check-state-archive-stale-enforce.test.ts` asserting `ENFORCE === true` post-flip (defensive against accidental revert). LOC delta: ~10L test. Karpathy YAGNI — defer unless requested.

### 6.5 Sneak-block守门 (W0.1 absorb)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT flip ENFORCE if pre-flight violations exist | Pre-flight task `node scripts/check-state-archive-stale.mjs` returns 0 violations BEFORE flip commit (planner W0.1 sub-step) |
| MUST run as W0 FIRST TASK (sister cadence) | Planner orders W0.1 = task #1 in Wave 0 (sister CONTEXT L77 "W0.1 FIRST TASK 必修") |
| MUST NOT add additional rules beyond 3 existing | scripts/check-state-archive-stale.mjs structure unchanged Phase 4.1 (only L10 flip); rule additions deferred Phase 4.2+ |

[HIGH — sister Phase 2.1 transparency gate ENFORCE flip cadence verbatim verified L12; pre-flight 3 rules all green per current STATE.md 148L + 0/0 matches grep; sneak-block守门 3 explicit enforcement gates]

---

## § 7 W0.2 (conditional) D1 round 2 SIZE_LIMIT 200→150 conditional flip rationale

**Confidence: MEDIUM** — conditional on W0.3 D2 cadence trim outcome (STATE.md post-trim ≤140L expected per CONTEXT L79 conditional spec).

### 7.1 Conditional logic (CONTEXT L79 verbatim)

> "W0.5 conditional — flip D3 SIZE_LIMIT 200→150 if W0.3 D2 cadence trim outcome holds STATE ≤140L; otherwise defer"

Decision tree:

```
W0.3 trim Phase 3.3+3.4 narrative → STATE.md post-trim wc -l
├── ≤ 140L → flip D3 SIZE_LIMIT 200→150 ✅ (10L headroom; safe round 2)
├── 141-150L → defer flip (insufficient headroom; sister DEFERRED #AG carry-forward Phase 4.2+ W0)
└── > 150L → flip blocked + investigate Wave 0 trim sufficient? (re-evaluate D2 cadence pattern adequacy)
```

### 7.2 Estimated post-trim STATE.md size (W0.3 outcome projection)

Pre-trim: STATE.md = 148L (current).

Trim targets (W0.3 D2 cadence iter 2 scope):
- Phase 3.3 SHIPPED narrative (currently in `当前位置` L22 long inline + 关键决策 L110-117 5 rows) → archive to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 subsection
- Phase 3.4 SHIPPED narrative (currently in `当前位置` L22 long inline + 关键决策 L110-115 5 rows) → archive

Estimated trim delta: ~15-20L removed from STATE.md (5-10 关键决策 rows + 1 long inline当前位置 condense to 2-3L).

Post-trim STATE.md estimate: **148 - 18 = ~130L** ⇒ ≤140L ✅ ⇒ **W0.2 flip safe**.

### 7.3 1-line flip recipe (conditional execution)

`scripts/check-state-archive-stale.mjs` L12 current:

```javascript
const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG
```

W0.2 flip:

```javascript
const SIZE_LIMIT = 150 // Phase 4.1 W0.2 round 2 tighten — sister DEFERRED #AG resolve (W0.3 trim outcome STATE post-trim ≤140L verified pre-flip)
```

### 7.4 Sneak-block守门 (conditional execution)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST verify STATE.md ≤140L post-W0.3 trim BEFORE flip | Pre-flight `wc -l .planning/STATE.md` ≤ 140 (planner W0.2 sub-step gate) |
| MUST defer flip if post-trim ≥141L (defensive) | Planner conditional: skip W0.2 task + register DEFERRED #AG carry-forward Phase 4.2 W0 |
| MUST NOT skip W0.3 trim to game W0.2 condition | W0.3 trim is HIGH priority standing process (D2 cadence iter 2 verifies institutionalization); skipping trim to avoid SIZE_LIMIT pressure undermines D2 |

[MEDIUM — conditional outcome depends on actual W0.3 trim line-count post-edit; ~130L projection grounded in 148L baseline minus ~18L estimated trim scope; flip recipe 1-line surgical]

---

## § 8 W0.3 D2 cadence iter 2 task: trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md (sister W2 T2.2 verbatim pattern)

**Confidence: HIGH** — sister Phase 3.4 W2 T2.2 verbatim pattern verified (Phase 3.1+3.2 narrative archived 2026-05-17 first-implementation); 2nd cadence test is mechanical reuse.

### 8.1 Sister Phase 3.4 W2 T2.2 pattern (first-implementation, 2026-05-17)

Per STATE.md L6 verbatim:
> "Phase 3.4 W2 T2.2 (D2 ship-time T6.N first-implementation, 2026-05-17): Phase 3.1 + 3.2 narrative (prev-prev-phase) trimmed from STATE → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 (1st cadence implementation per D2 standing process). STATE.md keeps Phase 3.3 + 3.4 SHIPPED narrative only."

Mechanism (sister T2.2 actual mechanical operations):
1. Identify prev-prev-phase narrative in STATE.md (currently Phase 3.1+3.2 narrative archived; iter 2 = Phase 3.3+3.4)
2. Cut + paste to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase N+N+1 subsection
3. Replace in-place STATE.md location with HTML-comment archive marker pointer (verified L27 sister format: `<!-- Phase 3.1 + 3.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 (...) -->`)
4. Verify line count post-trim + run `node scripts/check-state-archive-stale.mjs` returns 0 violations

### 8.2 Phase 4.1 W0.3 (W2 ship-time) iter 2 application

Phase 4.1 W2 T2.N task = "trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2nd cadence iter per D2 standing process)":

Trim targets in STATE.md (per current 148L state):
- `当前位置` block (L22-23) — Phase 3.3 + Phase 3.4 long inline narratives → condense to 1-line pointers ("Phase 3.X SHIPPED, see RETROSPECTIVE archive")
- `关键决策记录` (L107-117) — Phase 3.4 D-01/D-02/D-03/D-04 rows + W0.1 STRATEGIC row (5 rows) AND Phase 3.3 D-04 + schemaVersion 13-surface (2 rows) → archive to RETROSPECTIVE
- `已完成 phase ship 历史` (L40-43) — keep Phase 3.4 SHIPPED + Phase 3.3 SHIPPED rows (recent 2 keep; older 12 already pointers/refs)

Estimated trim delta: ~15-20L removed; post-trim STATE.md ≈ 130L (per § 7.2 projection).

### 8.3 RETROSPECTIVE.md absorb section structure (sister verbatim)

Per sister Phase 3.4 W2 T2.2 implementation, RETROSPECTIVE.md gains new subsection:

```markdown
## ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2, 2026-05-18)

### Phase 3.3 SHIPPED narrative (archived from STATE.md `当前位置` + 关键决策)
[verbatim content from STATE.md]

### Phase 3.4 SHIPPED narrative (archived from STATE.md `当前位置` + 关键决策)
[verbatim content from STATE.md]
```

LOC delta: +20-25L added to RETROSPECTIVE.md (≈ trimmed lines from STATE.md verbatim relocation).

### 8.4 Scope discipline (CONTEXT § Discretion L91 verbatim)

Recommendation: **mechanical trim verbatim sister Phase 3.4 W2 T2.2 pattern reuse** (planner Discretion #3 RECOMMENDED).

NOT recommended: additional cadence formalization checklist doc (over-engineering risk; YAGNI defer to Phase 4.2 if D2 cadence iter 3 reveals systemic issue).

### 8.5 Sneak-block守门 (W0.3 absorb)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST verbatim relocate (no content rewriting) | Planner copy-paste mechanical, NOT paraphrase; RETROSPECTIVE preserves original wording for historical audit fidelity |
| MUST leave HTML-comment pointer in STATE.md trim site | Sister verified L27 format `<!-- ... archived to RETROSPECTIVE.md § ARCHIVED FROM STATE ... -->`; reviewer grep verifies pointer present |
| MUST fire at W2 ship-time (NOT W0 or W1) | D2 is **ship-time standing process** (sister T6.N cadence) — planner orders W0.3 as W2 task, NOT W0 |
| MUST verify check-state-archive-stale.mjs returns 0 post-trim | Pre-commit `node scripts/check-state-archive-stale.mjs` 0 violations (especially if W0.2 flipped SIZE_LIMIT=150L) |

[HIGH — sister Phase 3.4 W2 T2.2 verbatim pattern verified L6 STATE.md + L27 HTML-comment archive marker; mechanical trim scope grounded in current 148L STATE.md + recent 2-phase narrative inventory; sneak-block 4 enforcement gates]

---

## § 9 T4 CI ordering bug spike (30 min, folded into W0.3)

**Confidence: HIGH** — Post-554b82b CI hotfix verified `build BEFORE test` ordering correct (`.github/workflows/ci.yml` L125-126 explicit `pnpm build` precedes `pnpm test`); spike target = other latent step ordering bugs.

### 9.1 554b82b hotfix verification (regression-prevented)

Per ci.yml L122-126 verbatim:
```yaml
# Phase 3.4 CI hotfix (2026-05-17) — build BEFORE test so dist/cli.mjs
# exists for integration tests added at Phase 3.3 W2 T2.3 (commit 245955b):
# install-aliases / install-known-good / install-silent-redirect all spawn
# `node dist/cli.mjs`. Pre-hotfix: 3-OS test step failed `Cannot find
# module dist/cli.mjs` because build was sequenced AFTER test.
- run: corepack pnpm build
- run: corepack pnpm test
```

**Verified safe**: pre-test integration suite (post-Phase 3.3 W2 T2.3) requires `dist/cli.mjs` from build; ordering now correct.

### 9.2 Spike target — other step ordering for similar latent bugs

Per CONTEXT § T4 L83 verbatim: "fold into W0.3 sub-task (e.g., verify `pnpm validate:schema` 依赖 `pnpm build:schema` ordering 正确 + check 其他 step ordering)".

Check 1: `validate:schema` depends on `build:schema` (ci.yml L165+167):

```yaml
- run: corepack pnpm build:schema
# Phase 2.3 Wave 0 T0.4 — M1 schema regen drift gate (Phase 2.2 RETROSPECTIVE)
- name: Schema regen gate (Phase 2.3 Wave 0 M1)
  run: |
    git diff --exit-code schemas/ || { ... }
# ...
- run: corepack pnpm validate:schema
- run: node ./dist/cli.mjs --version
```

Verified: `build:schema` (L165) **precedes** `validate:schema` (later in pipeline) ✅. Order correct.

Check 2: Are there other steps depending on dist/ or schemas/ that come BEFORE their build?

Per ci.yml scan (L120-190):
- `pnpm typecheck` (L120) — doesn't depend on dist/ ✅
- `pnpm lint` (L121) — doesn't depend on dist/ ✅
- `pnpm build` (L125) — produces dist/
- `pnpm test` (L126) — consumes dist/ ✅ (post-554b82b verified)
- `ralph-loop Win sentinel` (L134) — consumes dist/ if invoked? Verify per pattern — runs `pnpm test --` (specific suite) → also consumes dist/ ✅ (already after build)
- `pnpm build:schema` (L165) — produces schemas/
- `Schema regen gate` (L168) — consumes schemas/ ✅ (after build:schema)
- `validate:schema` (L186) — consumes schemas/ ✅ (after build:schema)
- `node ./dist/cli.mjs --version` (L187) — consumes dist/ ✅ (after build)

**All ordering verified correct**. T4 spike outcome: **No latent ordering bugs found**; defensive verify complete.

### 9.3 Spike documentation (folded into W0.3 PLAN.md section, ≤10L)

Recommended planner W0.3 sub-step deliverable:
```markdown
### W0.3 T4 spike outcome — CI step ordering verify (~10L)

- 554b82b hotfix verified safe (build BEFORE test ordering correct ci.yml L125-126)
- `validate:schema` depends on `build:schema` verified order correct (L165 → L186)
- Other dist/schemas consumers (typecheck/lint/ralph-loop sentinel) verified order
- **No latent ordering bugs found** — T4 spike complete, no Phase 4.1+ follow-up needed
```

### 9.4 Sneak-block守门

| Sneak-block | Enforcement |
|-------------|------------|
| MUST cap spike at 30 min | Planner W0.3 sub-task time-box (CONTEXT T4 L83 explicit "30 min spike") |
| MUST document outcome inline PLAN.md (NOT separate spike doc) | Karpathy YAGNI single-purpose; spike outcome ≤10L fits in W0.3 task summary section |
| MUST flag if NEW bug found (escalate to W0/W1 fix task) | If spike reveals real bug, planner ADD W0.6 fix task; current outcome = no bug → no escalation |

[HIGH — ci.yml L120-190 step-by-step ordering verified; build/test/build:schema/validate:schema dependency graph green; sister 554b82b hotfix verified as defensive completed; spike outcome = no latent bug found]

---

## § 10 `docs/benchmarks/v0.4.md` size budget (~350L estimate; ≤400L hard cap)

**Confidence: HIGH** — size arithmetic grounded in § 3.1 template (10L per task × 30 + header/footer).

### 10.1 Hard estimate breakdown

| Section | LOC estimate | Source |
|---------|--------------|--------|
| YAML frontmatter (version + verification date + source links + author + license) | ~10L | sister Phase 3.4 SAMPLES.md L1-7 + sister adr frontmatter pattern |
| TL;DR header (size 30 + 30/30 100% PASS + 反"美化"声明 1-line + source SAMPLES.md cross-link) | ~20L | sister Phase 2.4 v0.2.0-MILESTONE-AUDIT.md TL;DR 5-paragraph pattern |
| § 1 Benchmark scope + acceptance bar (R8.1 verbatim + sister Phase 3.4 routing harness 30/30 PASS) | ~25L | per R8.1 + ROADMAP L201-206 acceptance bar references |
| § 2 Per-task disclosure (30 task × 10L each per § 3.1 template) | ~300L | § 3.1 5-element template × 30 verbatim |
| § 3 Per-tier breakdown summary (Sonnet 100% / Haiku 100% / Opus 100% per Phase 3.4 W1 T1.6 result) | ~15L | sister Phase 3.4 routing test result L160-165 console.log table |
| § 4 反"数据美化诱惑" 声明 (footer per § 3.4) | ~10L | § 3.4 template verbatim |
| § 5 Source attribution + reproducibility links (SAMPLES.md + routing test + CONTRIBUTING-BENCHMARK.md cross-refs) | ~10L | sister adr pattern footer |
| § 6 Upgrade e2e log cross-link (docs/benchmarks/v0.4-upgrade-e2e.log + ctx7 + gstack pointers) | ~10L | § 4.1 + § 4.2 cross-ref |

**Total estimate: ~400L** — at hard cap ceiling. **Mitigation if estimate breaches**:
- Drop per-task `description` column (keep in SAMPLES.md only; v0.4.md routes reader to SAMPLES.md for terse description) → saves ~1L × 30 = 30L
- Compress 5-element labels (drop blank lines between elements; ✓ tightens per-task to 8L) → saves 2L × 30 = 60L
- Aggregate 30 task into table view + appendix verbose-format (table = 5L × 30 = 150L; appendix = on-demand expansion) → saves ~150L, but sacrifices D-02 FULL disclosure ergonomics

**Recommendation**: stick with 10L per-task verbose template (D-02 FULL spirit); cap at ~400L hard limit; if breaches, drop description column first (lowest D-02 disclosure value); aggregate-only REJECTED per D-02 sneak-block.

### 10.2 Karpathy precedent for docs files (no strict ≤200L for docs)

- sister adr 0014/0015/0016/0017 hard limit ≤250L (per Phase 3.4 RESEARCH § 9 W2.T2.1 ADR pattern)
- sister `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` = 16k bytes (~400L)
- sister `docs/INSTALLER-CONTRACT.md` = 11k bytes (~290L)

→ **docs/benchmarks/v0.4.md ≤400L is within sister docs precedent range** ✅ (NOT subject to ≤200L src hard limit).

### 10.3 Sneak-block守门

| Sneak-block | Enforcement |
|-------------|------------|
| MUST cap ≤400L hard (CONTEXT § Discretion L89) | Pre-commit `wc -l docs/benchmarks/v0.4.md` ≤ 400 (planner W1 verify gate) |
| MUST NOT exceed via verbose padding (D-02 FULL ≠ padding) | Reviewer cross-check: each section serves FULL disclosure element (raw prompt / decision / cmd / verdict / recovery); no filler |
| MUST cross-link SAMPLES.md as source (single SoT D-01) | grep `SAMPLES.md` docs/benchmarks/v0.4.md ≥ 2 occurrences (header + § 5 attribution) |

[HIGH — size arithmetic 10L × 30 + 100L margin = ~400L; sister docs precedent range verified verbatim; mitigation hierarchy explicit]

---

## § 11 `docs/CONTRIBUTING-BENCHMARK.md` ≤30L content (manual re-run instructions + sample expansion process)

**Confidence: HIGH** — content recipe per § 5.2 verbatim ≤30L target.

### 11.1 ≤30L content template (verbatim per § 5.2)

See § 5.2 template (~28L with headers). Final post-write `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 verified pre-commit.

### 11.2 Cross-references from CONTRIBUTING-BENCHMARK.md

Required cross-links (per D-04 spec):
- → `.planning/phase-3.4/SAMPLES.md` (source data)
- → `routing/decision_rules.yaml` (rule trace)
- → `tests/routing/phase-3.4-routing-hit-rate.test.ts` (verification fixture)
- → `docs/benchmarks/v0.4.md` (consumer artifact)
- → `docs/benchmarks/v0.4-upgrade-e2e.log` (e2e companion artifact)

LOC for cross-refs: ~5L (embedded in "How to re-run" + "Acceptance" sections). Fits within 30L cap.

### 11.3 Sister CONTRIBUTING.md format consistency (planner check)

`CONTRIBUTING.md` (existing 200L) uses:
- H1 title
- Blockquote intro (italic 1-line)
- H2 section headers
- Code fenced bash commands
- Tables for command reference

CONTRIBUTING-BENCHMARK.md MUST match format for consistency (per § 5.2 template demonstrates this consistency).

### 11.4 Sneak-block守门

| Sneak-block | Enforcement |
|-------------|------------|
| MUST cap ≤30L (CONTEXT D-04 L67 explicit) | Pre-commit `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 |
| MUST cite manual re-run command verbatim | Code fenced `corepack pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` present |
| MUST link to SAMPLES.md source | Markdown link `[SAMPLES.md](../.planning/phase-3.4/SAMPLES.md)` present |

[HIGH — content recipe ≤30L verified per § 5.2 template; cross-refs scoped to D-04 mandate; sister CONTRIBUTING.md format consistency verified]

---

## § 12 e2e upgrade target manifest pick rationale (1-2 representative manifests)

**Confidence: MEDIUM** — picks grounded in install_method 多样性 + manifest availability; actual upgrade e2e run depends on real upstream version bump availability at W1 execution time.

### 12.1 Recommended picks (per § 4.2 verbatim)

**Pick 1: ctx7** (install_method = `npm-cli`)
- Single-file npm dep, fast upgrade, deterministic version pinning
- Recent v0.4.x release available (per ctx7 ecosystem) for real upgrade demo
- Estimated log size: ~50-80L

**Pick 2: gstack** (install_method = `git-clone-with-setup`, git_ref SHA-pinned)
- Multi-step git clone + setup script
- Covers git_ref SHA upgrade flow (sister Phase 3.4 RESEARCH § 7.1 SHA `74895062fb8a3acbf9f66cd088a83359aaaa56cd`)
- Estimated log size: ~80-100L

### 12.2 Skip rationale: tavily-mcp (defer to v0.5+)

- install_method = `mcp-stdio-add` (already covered Phase 2.2/2.3 install dogfood)
- Adding 3rd manifest = +50L docs bloat, marginal value
- Planner can add tavily-mcp in v0.5+ benchmark if external user feedback requests visibility into `mcp-stdio-add` upgrade path

### 12.3 Skip rationale: superpowers / claude-agent-sdk

- superpowers = `git-clone-with-setup` (duplicates gstack install method coverage)
- claude-agent-sdk = pinned `0.3.142` exact (Phase 2.2 lock) — version bump cadence is monthly+, may not have v0.4.x available at W1 execution time

### 12.4 Sneak-block守门

| Sneak-block | Enforcement |
|-------------|------------|
| MUST capture 2 manifests max (Karpathy YAGNI cap) | Reviewer count: `ls docs/benchmarks/*.log` = 1-2 files |
| MUST satisfy install_method 多样性 (no duplicate methods) | Reviewer check: pick set spans ≥2 install_method (recommended ctx7=npm-cli + gstack=git-clone-with-setup ✅) |
| MUST be text-only ≤100KB (D-03 sneak-block) | `wc -c docs/benchmarks/*.log` per file ≤ 100000 (~100KB) |

[MEDIUM — picks grounded in install_method coverage + Phase 3.4 manifest registry; actual W1 upgrade availability needs verification at execution time]

---

## § 13 Sister Phase 3.4 W2 T2.X ship cadence reuse (Phase 4.1 W2 milestone delivery)

**Confidence: HIGH** — sister Phase 3.4 W2 T2.1-T2.11 verbatim ship cadence pattern verified per `.planning/phase-3.4/PATTERNS.md` § 1 row 11-16 + RESEARCH § 9.3.

### 13.1 Phase 4.1 W2 ship task ordering (sister Phase 3.4 W2 cadence reuse)

| Task | Sister Phase 3.4 W2 | Phase 4.1 W2 description |
|------|---------------------|--------------------------|
| W2.T2.1 | T2.1 ADR 0017 NEW 9 章节 errata | **N/A — Phase 4.1 NO new ADR** (benchmark = docs phase; ADR 0018 deferred Phase 4.3 per Deferred Ideas); A7 守恒 ADR 0001-0017 unchanged this phase |
| W2.T2.2 | T2.2 ci.yml A7 iter `1-0016` → `1-0017` | **N/A — no ADR add Phase 4.1**; ci.yml unchanged for A7 step; alternative: ci.yml MAY be touched if T4 spike (§ 9) finds latent bug, but spike outcome = no bug → no ci.yml edit |
| W2.T2.3 | T2.3 STATE.md + RETROSPECTIVE.md 续编 (Phase 3.4 ship event + W0.1 D2 first ship-time implementation — trim Phase 3.1 + 3.2 narrative → RETROSPECTIVE archive section) | **W2.T2.3** STATE.md + RETROSPECTIVE.md 续编 (Phase 4.1 ship event + W0.3 D2 cadence iter 2 implementation — trim Phase 3.3 + 3.4 narrative → RETROSPECTIVE archive section) ← per § 8 |
| W2.T2.4 | T2.4 ROADMAP.md Phase 3.4 ✅ SHIPPED mark + v0.3.0 100% PROGRESS | **W2.T2.4** ROADMAP.md Phase 4.1 ✅ SHIPPED mark + v0.4.0 1/3 PROGRESS (Phase 4.1 of 3 phases) |
| W2.T2.5 | T2.5 README.md L46-56 sync shipped phase count (Phase 3.4 + v0.3.0 milestone shipped row add) | **W2.T2.5** README.md sync Phase 4.1 shipped row add (Phase 4.1 shipped row insert; total phase count 14 → 15; v0.4.0 0/3 → 1/3) |
| W2.T2.6 | T2.6 PROJECT-SPEC.md Status: header update + sister markers | **W2.T2.6** PROJECT-SPEC.md Status: header update Phase 4.1 SHIPPED |
| W2.T2.7 | T2.7 baseline tag `adr-0017-accepted` + per-phase milestone tag `v0.3.0-alpha.4-routing` triple push | **W2.T2.7** baseline tag `v0.4.0-alpha.1-benchmark` push (CONTEXT explicit; NO adr-NNNN-accepted tag this phase since no NEW ADR) |
| W2.T2.8 | T2.8 🎯 milestone tag `v0.3.0` triple push (v0.2.0 sister) | **N/A — Phase 4.1 is v0.4.0 milestone 1st phase, NOT close phase**; 🎯 v0.4.0 milestone tag only on Phase 4.3 ship |
| W2.T2.9 | T2.9 milestone archive `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS}.md` | **N/A — milestone archive only at v0.4.0 close phase (Phase 4.3)**; Phase 4.1 doesn't archive |
| W2.T2.10 | T2.10 `.planning/v0.3.0-MILESTONE-AUDIT.md` 6-section audit write | **N/A — milestone audit only at v0.4.0 close phase (Phase 4.3)** |
| W2.T2.X DOGFOOD | T2.11 DOGFOOD-T2.11.md PASS N/N miss: none | **W2.T2.X DOGFOOD-T2.X.md** PASS N/N miss: none (sister Phase 3.3 T2.8 + Phase 3.4 T2.11 DOGFOOD format) — verify v0.4.md ≤400L + e2e log 4-section + CONTRIBUTING-BENCHMARK ≤30L + ENFORCE flip safe (post-W0.3 trim) + manual benchmark re-run dry test |

### 13.2 Phase 4.1 W2 task count

**Sister Phase 3.4 W2 = 11 task** (with milestone close 4 close-only tasks T2.7-T2.10).
**Phase 4.1 W2 = ~6 task** (no NEW ADR + no milestone close; only docs sync + ship tag + dogfood).

Task ordering: T2.3 STATE/RETRO 续编 + W0.3 D2 cadence iter 2 trim (combined per § 8.2) → T2.4 ROADMAP mark → T2.5 README sync → T2.6 PROJECT-SPEC Status → T2.7 baseline tag push → T2.X DOGFOOD verify.

### 13.3 Sneak-block守门 (Phase 4.1 W2 ship discipline)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT add NEW ADR Phase 4.1 (R8.4 ADR 全集 deferred Phase 4.3) | Reviewer grep: `git diff --name-only HEAD~10 HEAD docs/adr/` returns 0 new files Phase 4.1 W2 |
| MUST NOT archive milestone (v0.4.0 close = Phase 4.3) | Reviewer check: `.planning/milestones/v0.4.0-*.md` NOT created Phase 4.1 W2 |
| MUST hold A7 守恒 (ADR 0001-0017 0 diff) | sister T2.7 W2 ship-time verify `git diff adr-0017-accepted -- docs/adr/0017-*.md` 0 diff (§ 14) |
| MUST tag baseline `v0.4.0-alpha.1-benchmark` per CONTEXT L70 explicit | `git tag -l 'v0.4.0-alpha.1-benchmark'` = 1 post-Phase-4.1-ship |

[HIGH — sister Phase 3.4 W2 T2.1-T2.11 verbatim cadence verified RESEARCH § 9.3 + PATTERNS § 1; Phase 4.1 task subset derivation grounded in "no new ADR + no milestone close" scope; tag naming per CONTEXT L70 explicit]

---

## § 14 A7 守恒 verify post-Phase-4.1 ship (ADR 0001-0017 main body 0 diff hold)

**Confidence: HIGH** — A7 守恒 mechanism verified via ci.yml L65-100 explicit step.

### 14.1 A7 mechanism (ci.yml L65-100)

ci.yml step "A7 acceptance bar — ADR 0001-0017 main body 守恒" iterates over baseline tags `adr-0001-accepted` through `adr-0017-accepted` and runs `git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md"`; any non-empty diff = `::error::` + exit 1.

### 14.2 Phase 4.1 W2 ship-time A7 verify (sister T2.7 pattern)

Phase 4.1 is **R8.1 dogfooding benchmark = docs phase**, NOT adding new ADR (per § 13.1 W2.T2.1 N/A). A7 守恒 verification:

```bash
# Pre-Phase-4.1-ship verify (manual run)
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  if [ -n "$diff_out" ]; then
    echo "FAIL: ADR ${n} main body changed since adr-${n}-accepted tag"
    echo "$diff_out"
    exit 1
  fi
done
echo "A7 ✅ ADR 0001-0017 main body unchanged post-Phase-4.1"
```

**Expected outcome**: 0 diff (Phase 4.1 docs phase doesn't touch `docs/adr/*.md`).

### 14.3 Sneak-block守门 (A7 hold)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT modify any existing ADR main body | Pre-commit grep: `git diff --name-only HEAD~10 HEAD docs/adr/*-*.md` = 0 modified existing ADRs |
| MUST NOT add new ADR Phase 4.1 (R8.4 deferred) | Reviewer check: `git diff --name-only HEAD~10 HEAD docs/adr/` = 0 new files |
| MUST verify A7 green in CI post-Phase-4.1-ship | CI run `A7 acceptance bar` step returns "A7 ✅ ADR 0001-0017 main body unchanged" |

### 14.4 No A7 iter (ADR count unchanged Phase 4.1)

Sister Phase 3.4 W2 T2.2 incremented `ADR 0001-0016` → `ADR 0001-0017` in ci.yml (5 sed-replace sites). Phase 4.1 W2 = **no A7 iter** (no NEW ADR added). ci.yml A7 step remains `ADR 0001-0017` unchanged.

[HIGH — A7 mechanism verbatim from ci.yml L65-100; Phase 4.1 = docs phase NO ADR touch → 0 diff expected; no ci.yml A7 iter needed]

---

## § 15 biome preempt MANDATORY before commits (sister memory feedback_biome-preempt.md 3 CI-red recurrences)

**Confidence: HIGH** — MEMORY `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 verified; established preempt cadence.

### 15.1 Mandatory preempt command (per memory)

Before ANY commit touching `.ts/.js/.mjs/.json`:

```bash
pnpm exec biome check --write
```

Phase 4.1 touch surface:
- W0.1 `scripts/check-state-archive-stale.mjs` (`.mjs` 1-line flip) → biome preempt ✅
- W1 NEW `docs/CONTRIBUTING-BENCHMARK.md` (`.md` — not biome scope, but lint table) — biome NOT needed for .md
- W1 NEW `docs/benchmarks/v0.4.md` (`.md`) — biome NOT needed
- W1 NEW `docs/benchmarks/v0.4-upgrade-e2e.log` (`.log`) — biome NOT needed
- W2 docs sync (STATE/ROADMAP/README/PROJECT-SPEC `.md`) — biome NOT needed
- Optional W0.1 `tests/scripts/check-state-archive-stale-enforce.test.ts` (`.ts`) — biome preempt ✅ if added

### 15.2 Pre-commit gate verification

```bash
# Mandatory before EVERY commit (per CLAUDE.md MEMORY)
pnpm exec biome check --write
# Then commit normally
git commit -m "..."
```

### 15.3 Sneak-block守门

| Sneak-block | Enforcement |
|-------------|------------|
| MUST run biome preempt before any .ts/.js/.mjs/.json touch | Planner W0.1/W1 task explicit "biome preempt" sub-step |
| MUST NOT skip biome preempt under time pressure | sister 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 — memory institutionalized; planner reminds executor at task spawn |
| MUST verify biome PASS in CI as fallback gate | ci.yml L121 `pnpm lint` step catches any missed preempt |

[HIGH — MEMORY `feedback_biome-preempt.md` cited 3 CI-red recurrences verbatim; preempt cadence institutionalized; Phase 4.1 touch surface enumerated explicit]

---

## § 16 STRIDE threat model placeholders for PLAN.md frontmatter

**Confidence: HIGH** — sister Phase 3.4 RESEARCH § 10.4 STRIDE pattern verbatim verified + Phase 4.1 docs-phase narrow attack surface.

### 16.1 STRIDE nodes for Phase 4.1 (benchmark = docs phase)

| Threat | STRIDE | Mitigation | Phase 4.1 specifc? |
|--------|--------|-----------|--------------------|
| benchmark "美化" suppression (planner removes miss cases for vanity stat) | Tampering (governance) | D-02 FULL disclosure sneak-block (raw prompt + decision + verdict verbatim; recovery_path column reserved for miss); single SoT D-01 (SAMPLES.md is frozen, can't selectively omit) | ✅ Phase 4.1 new |
| benchmark drift (SAMPLES.md mutated post-publish, v0.4.md not re-rendered) | Tampering | D-04 MANUAL cadence + CONTRIBUTING-BENCHMARK.md ≤30L explicit re-run procedure; SAMPLES.md frozen by Phase 3.4 R3 lock | ✅ Phase 4.1 new |
| e2e log binary file injection (mp4/gif >100KB committed bypassing intent) | DoS (repo bloat) | D-03 sneak-block `git ls-files docs/benchmarks/ | xargs wc -c` < 100KB per file + `file` returns "ASCII text" | ✅ Phase 4.1 new |
| asciinema npm dep sneak-add | Supply-chain | D-03 sneak-block `grep -q "asciinema" package.json` returns false; CI green | ✅ Phase 4.1 new |
| benchmark CI cron sneak-add (REJECTED D-04) | Resource exhaustion (CI minutes) | D-04 sneak-block `ls .github/workflows/ | grep -c benchmark` = 0 | ✅ Phase 4.1 new |
| W0.1 ENFORCE flip when STATE.md violations exist (would break CI on flip) | DoS (CI red) | Pre-flight § 6.2 3 rules verify green before flip; sister Phase 2.1 cadence pattern verified | ✅ Phase 4.1 new |
| W0.3 D2 trim losing audit content (paraphrasing instead of verbatim relocation) | Tampering (history integrity) | § 8.5 sneak-block: MUST verbatim relocate; reviewer diff RETROSPECTIVE additions = STATE.md deletions 1:1 | ✅ Phase 4.1 new |

### 16.2 PLAN.md frontmatter STRIDE template (planner Wave B consumes)

```yaml
threat_model:
  - threat: benchmark "美化" suppression
    stride: T (Tampering governance)
    mitigation: D-02 FULL disclosure sneak-block (raw prompt + decision + verdict verbatim)
  - threat: benchmark drift (SAMPLES vs v0.4.md mismatch)
    stride: T (Tampering)
    mitigation: D-04 MANUAL cadence + CONTRIBUTING-BENCHMARK ≤30L explicit re-run
  - threat: binary file injection (mp4/gif >100KB)
    stride: D (DoS repo bloat)
    mitigation: D-03 sneak-block file size + ASCII check
  - threat: asciinema dep sneak-add
    stride: S (Supply-chain)
    mitigation: D-03 sneak-block grep package.json
  - threat: CI cron sneak-add
    stride: D (Resource exhaustion)
    mitigation: D-04 sneak-block ls .github/workflows/
  - threat: W0.1 ENFORCE flip premature
    stride: D (CI red)
    mitigation: § 6.2 pre-flight 3 rules verify green
  - threat: W0.3 trim history integrity loss
    stride: T (history paraphrasing)
    mitigation: § 8.5 sneak-block verbatim relocation reviewer diff 1:1
```

[HIGH — STRIDE 7 nodes grounded in Phase 4.1 actual attack surface (docs phase narrow); each node tied to D-decision or W0 task sneak-block守门; planner consumes frontmatter Wave B]

---

## § 17 Estimated task count + atomic commit count per wave

**Confidence: MEDIUM** — task count grounded in sister Phase 3.4 24 atomic; Phase 4.1 narrower scope (docs phase, no NEW ADR, no NEW src code beyond W0.1 1-line flip + optional 1 test).

### 17.1 Wave breakdown (sister Phase 3.4 W0-W2 3-wave topology)

| Wave | Scope | Tasks | LOC delta est | Tests delta |
|------|-------|-------|--------------|-------------|
| **W0** backlog 2-3 项 absorb (HIGH first) | W0.1 D3 ENFORCE flip (1-line `.mjs` edit + biome preempt + pre-flight verify) + W0.2 (CONDITIONAL on W0.3 outcome — D1 SIZE_LIMIT 200→150 1-line flip if STATE post-trim ≤140L) + optional T4 CI ordering spike outcome doc (folded into W0.3 sub-step ≤10L) | 2-3 atomic | +0L (only value flips in `.mjs`) + ~10L docs (T4 spike outcome) | 0 NEW (existing tests/scripts/check-state-archive-stale.test.ts covers; optional +1 ENFORCE assert ~10L) |
| **W1** main scope benchmark format definition + data采集 | T1.1 docs/benchmarks/v0.4.md NEW ~350L (header + § 2 30 per-task FULL D-02 + footer 反"美化"声明) + T1.2 docs/benchmarks/v0.4-upgrade-e2e.log NEW (ctx7) ~70L + T1.3 docs/benchmarks/v0.4-upgrade-e2e.log NEW (gstack, OR combined into single file with 2 manifest sections) ~90L + T1.4 docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L + T1.5 verify v0.4.md FULL disclosure sneak-block 守门 (planner manual review pass) + T1.6 ctx7 actual upgrade run + log capture + T1.7 gstack actual upgrade run + log capture | 5-7 atomic | ~+350L v0.4.md + ~+160L e2e log + ~+30L CONTRIBUTING-BENCHMARK + ~+0L src | 0 NEW (benchmark = docs phase; routing test reused) |
| **W2** ship cadence (sister Phase 3.4 W2 T2.3-T2.7+T2.X) | T2.3 STATE.md + RETROSPECTIVE.md 续编 (Phase 4.1 ship event + W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative) + T2.4 ROADMAP.md Phase 4.1 ✅ SHIPPED mark + v0.4.0 1/3 PROGRESS + T2.5 README.md sync (phase count 14→15) + T2.6 PROJECT-SPEC.md Status header update + T2.7 baseline tag `v0.4.0-alpha.1-benchmark` push + T2.X DOGFOOD-T2.X.md PASS verify | 6 atomic | ~+30L STATE delta (post-trim) + ~+20L RETROSPECTIVE append + ~+10L ROADMAP/README/PROJECT-SPEC | 0 NEW (docs sync) |

### 17.2 Total wave breakdown

- **3 wave** (sister Phase 3.4 3 wave; Phase 4.1 narrower scope)
- **13-16 atomic task** (sister Phase 3.4 24 atomic; Phase 4.1 ≈ 60% scope due to docs-only)
- **~+580L docs delta** (350 + 160 + 30 + 40)
- **~+0L src delta** (W0.1 1-line value flip; optional +10L test)
- **0 NEW src test fixture** (docs phase; existing routing test reused)
- **0 NEW ADR** (R8.4 deferred Phase 4.3)
- **0 milestone close** (v0.4.0 close = Phase 4.3)
- **1 baseline tag** (`v0.4.0-alpha.1-benchmark`)

### 17.3 Wave 依赖 graph

```
W0 (HIGH first 必修) ─┬─> W1 (benchmark format + data采集 + e2e logs)
                       │
                       ├─> (W0.1 ENFORCE flip unblocks W2 STATE trim with ENFORCE=true gate)
                       │
                       └─> W2 (ship cadence)
                             │
                             ├─> W0.3 D2 cadence iter 2 trim (combined into T2.3 STATE/RETRO 续编)
                             ├─> W0.2 CONDITIONAL D1 SIZE_LIMIT flip (post-trim STATE ≤140L verify gate)
                             └─> W1 must full-suite green (existing routing test 30/30 PASS) before W2 dogfood verify
```

W0 是 2-3 atomic independent. W1 是 5-7 atomic partial DAG (T1.1 v0.4.md NEW first → T1.2/T1.3 e2e logs 并行 → T1.4 CONTRIBUTING-BENCHMARK 并行 → T1.5/T1.6/T1.7 manual verify + actual upgrade run sequential). W2 是 6 atomic sequential (STATE/RETRO trim first → ROADMAP/README/PROJECT-SPEC sync → tag push → DOGFOOD verify).

### 17.4 Estimated total time

Per KICKOFF § 5 estimate:
- W0 absorb: ~1-2 hours
- W1 main scope: ~4-6 hours
- W2 ship: ~2-3 hours
- **Total: ~1 day (sister Phase 3.x cadence; 1 phase/day applicable internal phase)**

[MEDIUM — task count grounded in sister Phase 3.4 24 atomic + Phase 4.1 docs-only narrower scope (60% factor); ~13-16 task estimate accounts for W1 5-7 atomic flex (combined vs split T1.2+T1.3 e2e logs); time estimate matches KICKOFF § 5 1-day cadence]

---

## § 18 Known unknowns (spike outcomes to fill in plan-phase verification)

**Confidence: HIGH** — list grounded in CONTEXT § Discretion + W0 absorb plan + sister cadence verification points.

### 18.1 Spike outcomes resolved this RESEARCH

| # | Question | Resolution |
|---|----------|-----------|
| 1 | docs/benchmarks/ baseline state? | § 1.1 — empty `.gitkeep` only; v0.4.md is NEW file |
| 2 | Phase 3.4 SAMPLES.md current size + schema? | § 1.2 — 73L 30-row 7-col verified verbatim |
| 3 | Routing test parser forward-compat for benchmark col expansion? | § 1.3 + § 2.1 — SAMPLES.md frozen; v0.4.md is rendered view (no mutation) |
| 4 | D-02 FULL per-task section size estimate? | § 3.1 + § 10.1 — ~10L per task × 30 + 50L margin = ~350-400L ≤ 400L cap |
| 5 | D-03 e2e log 4-section template content? | § 4.1 — verbatim template per CONTEXT L53 4-section |
| 6 | e2e target manifest pick (ctx7 / gstack / tavily)? | § 4.2 + § 12 — ctx7 + gstack (install_method 多样性 covering npm-cli + git-clone-with-setup) |
| 7 | CONTRIBUTING-BENCHMARK.md placement? | § 5.1 — separate NEW ≤30L (fold-in pollutes 200L CONTRIBUTING.md) |
| 8 | W0.1 ENFORCE flip safety (pre-flight)? | § 6.2 — all 3 rules currently green (148L ≤ 200L + 0 关键决议 sections + 0 errata literals) → flip safe |
| 9 | W0.2 conditional D1 SIZE_LIMIT flip projection? | § 7.2 — STATE post-trim ≈ 130L ≤ 140L expected → flip safe |
| 10 | W0.3 D2 cadence iter 2 mechanical pattern? | § 8.1-8.3 — sister Phase 3.4 W2 T2.2 verbatim pattern reuse |
| 11 | T4 CI ordering spike outcome? | § 9.2 — no latent ordering bugs found (build/test, build:schema/validate:schema, ralph-loop sentinel all verified ordered correct) |
| 12 | v0.4.md size budget? | § 10 — ≤400L hard cap; ~350L estimate; mitigation drop description col first if breach |
| 13 | A7 守恒 post-Phase 4.1? | § 14 — 0 diff expected (docs phase no ADR touch); no ci.yml A7 iter (ADR count unchanged) |
| 14 | STRIDE threat model nodes? | § 16 — 7 nodes grounded in Phase 4.1 attack surface; planner Wave B consumes frontmatter |
| 15 | Wave topology + task count? | § 17 — 3 wave (W0-W2), 13-16 atomic, ~1 day |
| 16 | Phase 4.1 W2 task count vs sister Phase 3.4 24? | § 13.2 — 6 task (no NEW ADR + no milestone close → ~25% W2 task subset) |
| 17 | biome preempt scope? | § 15.1 — W0.1 `.mjs` flip + optional W0.1 `.ts` test = 2 sites max |
| 18 | Phase 4.1 baseline tag literal? | § 13.1 W2.T2.7 + CONTEXT L70 explicit — `v0.4.0-alpha.1-benchmark` |

### 18.2 Remaining unknowns (planner Wave B verifies at execution time)

| # | Question | Resolve at | Risk if Wrong |
|---|----------|-----------|---------------|
| U1 | ctx7 actual v0.4.x latest version availability (for upgrade demo at W1 execution) | W1 T1.6 execution time | LOW — if no v0.4.x available, downgrade demo to v0.3.x→v0.3.y patch bump; e2e log format unchanged |
| U2 | gstack actual git_ref SHA availability for upgrade (Phase 3.4 RESEARCH cited SHA `74895062`) | W1 T1.7 execution time | LOW — fallback: pick any 2 SHAs in gstack history for "from SHA A → to SHA B" demo |
| U3 | docs/benchmarks/v0.4.md actual size post-write (estimate ~350L; cap ≤400L) | W1 T1.1 post-write verify | MEDIUM — if breach, apply § 10.1 mitigation hierarchy (drop description col first) |
| U4 | STATE.md post-W0.3-trim actual size (estimate ~130L; W0.2 flip condition ≤140L) | W2 T2.3 post-trim verify | MEDIUM — if 141-150L, defer W0.2 flip per § 7.1 decision tree |
| U5 | Phase 4.1 ship single-day achievability (sister Phase 3.x 1 phase/day cadence) | Phase 4.1 ship completion 2026-05-18 | MEDIUM — internal phase no external dep; if W1 e2e logs slow due to actual upgrade run latency, split close to next day acceptable |
| U6 | Planner choice: separate T1.2+T1.3 e2e logs OR combined single file? | W1 T1.2/T1.3 task split | LOW — both viable; combined = 1 file with 2 manifest sections ~160L; split = 2 files ~70L+90L. Sister precedent none; planner Discretion |

### 18.3 No blockers identified

No blocking unknowns; all 6 remaining unknowns are LOW/MEDIUM risk with viable fallback paths. Planner can proceed to Wave B with high confidence.

[HIGH — 18 resolved + 6 remaining unknowns explicit; no blockers]

---

## § 19 Assumptions Log

> Claims tagged `[ASSUMED]` in this research (planner + discuss-phase 需 user confirm before execution):

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ctx7 has v0.4.x latest version available for upgrade demo at Phase 4.1 W1 execution time | § 4.2 + § 12.1 + § 18 U1 | LOW — fallback to v0.3.x patch bump (e2e log format unchanged) |
| A2 | gstack git_ref SHA `74895062fb8a3acbf9f66cd088a83359aaaa56cd` (Phase 3.4 RESEARCH § 7.1) still valid + has newer SHA available for upgrade demo | § 4.2 + § 12.1 + § 18 U2 | LOW — fallback to any 2 SHAs in gstack history |
| A3 | STATE.md post-W0.3-trim ≈ 130L (W0.2 flip condition ≤140L) | § 7.2 + § 18 U4 | MEDIUM — if 141-150L, defer W0.2 flip per § 7.1 decision tree |
| A4 | docs/benchmarks/v0.4.md ≤400L achievable with FULL D-02 disclosure (estimate ~350L) | § 10.1 + § 18 U3 | MEDIUM — if breach, drop description col first (§ 10.1 mitigation hierarchy) |
| A5 | Phase 4.1 ship single-day achievable per sister Phase 3.x 1 phase/day cadence | § 17.4 + § 18 U5 | MEDIUM — internal phase no external dep; if e2e logs slow, split next day |

**All other claims verified or sister-cited** — 5 ASSUMED tags. Verifications:
- docs/benchmarks/ empty: bash ls 直证
- SAMPLES.md 73L 30-row 7-col: bash wc -l + bash grep + L32 verbatim
- Routing test parser 7-col: file L48 + L56-57 verbatim
- D-02 5-element template: CONTEXT L30 verbatim
- D-03 4-section template: CONTEXT L53 verbatim
- D-04 sneak-block 3 rules: CONTEXT L65-67 verbatim
- W0.1 D3 ENFORCE flip cadence: sister `check-transparency-verdicts.mjs` L12 verbatim + Phase 2.1→2.2 1-phase cadence verified
- W0.3 D2 mechanical pattern: STATE.md L6 verbatim + L27 HTML-comment archive marker
- A7 mechanism: ci.yml L65-100 verbatim
- biome preempt cadence: CLAUDE.md MEMORY feedback_biome-preempt.md cited 3 CI-red recurrences

---

## § 20 Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All TypeScript code | ✓ | ≥22 (Phase 2.4 doctor.ts + package.json engines.node >=22.0.0) | — |
| corepack | pnpm invocation | ✓ | (Node 22 bundled) | — |
| pnpm | install + test | ✓ | (packageManager: pnpm@10.12.0) | — |
| TypeScript | tsc + vitest transform | ✓ | ^5.6.0 (devDep) | — |
| vitest | test runner | ✓ | ^4.0.0 (devDep) | — |
| @sinclair/typebox | schema | ✓ | ^0.34.49 | — |
| yaml | known-good.yaml + decision_rules.yaml parse | ✓ | ^2.9.0 | — |
| commander | CLI flag parsing | ✓ | ^13.0.0 | — |
| @anthropic-ai/claude-agent-sdk | routing.dispatch | ✓ | 0.3.142 exact | — |
| git | tag push + git diff | ✓ | (verified bash) | — |
| biome | preempt lint before commit | ✓ | ^2.0.0 | — |
| **ctx7** | W1 T1.6 e2e upgrade demo | ✓ (via npm; manifests/tools/ctx7.yaml registered) | latest npm fetch | downgrade demo to v0.3.x patch bump |
| **gstack** | W1 T1.7 e2e upgrade demo | ✓ (via git-clone-with-setup; manifests/skill-packs/gstack.yaml registered) | git SHA pinned | pick any 2 SHAs in gstack history |

**Missing dependencies with no fallback**: None.
**Missing dependencies with fallback**: ctx7 latest version + gstack newer SHA (both LOW risk per § 18 U1+U2).

Phase 4.1 is purely Node + TypeScript + existing devDeps — **no new dependency needed** (sister Phase 3.2/3.3/3.4 zero-dep cadence延续; D-03 sneak-block also enforces no asciinema npm dep).

---

## § 21 Sources

### Primary (HIGH confidence)

- `.planning/phase-4.1/4.1-CONTEXT.md` L1-128 — 4 D-decisions LOCKED + W0 5 项 backlog absorb plan + Discretion + Deferred verbatim
- `.planning/phase-4.1/4.1-KICKOFF.md` L1-78 — Phase scope + sister carry-forward + 4-question batch context
- `.planning/phase-3.4/SAMPLES.md` L1-73 — 30-row REAL HISTORICAL 7-col frozen schema (D-01 source-of-truth)
- `.planning/phase-3.4/RESEARCH.md` L1-1094 (chunked) — sister 18-section gold-standard format reference
- `.planning/phase-3.4/PATTERNS.md` L1-200 (chunked) — 17-target analog mapping (sister Phase 4.1 plan-checker target reference)
- `.planning/phase-3.4/deferred-items.md` L1-50 — W0 5 项 carry-forward source (W0.1-W0.5 + sister M+T tier)
- `.planning/STATE.md` L1-148 — current state 148L (W0.3 trim target source)
- `.planning/ROADMAP.md` L185-225 — v0.4.0 milestone scope verbatim + 拒绝清单
- `.planning/REQUIREMENTS.md` L297-302 — R8.1 验收 verbatim
- `scripts/check-state-archive-stale.mjs` L1-54 — W0.1 ENFORCE flip target (L10 `ENFORCE = false`) + W0.2 SIZE_LIMIT flip target (L12 `SIZE_LIMIT = 200`)
- `scripts/check-transparency-verdicts.mjs` L1-130 — sister ENFORCE flip cadence (L12 `ENFORCE = true`) + Phase 2.1→2.2 1-phase precedent
- `tests/routing/phase-3.4-routing-hit-rate.test.ts` L1-183 — routing harness SAMPLES.md consumer (L48 SAMPLES_PATH + L56-57 parser regex 7-col forward-compat verified)
- `.github/workflows/ci.yml` L1-200 — step ordering (post-554b82b L122-126 build BEFORE test) + A7 守恒 step L65-100 + 3 transparency/state-archive/provenance gates
- `CONTRIBUTING.md` L1-200 — existing CONTRIBUTING for fold-in option (recommend separate per § 5.1)
- `package.json` L1-94 — Node ≥22 + dep manifest verified
- `manifests/{tools,skill-packs}/*.yaml` — 16 manifests listed; ctx7 + gstack picked for § 4.2 + § 12

### Secondary (MEDIUM-HIGH confidence)

- sister Phase 3.4 W2 T2.1-T2.11 ship cadence (verbatim from Phase 3.4 RESEARCH § 9.3 + PATTERNS § 1) — Phase 4.1 W2 task derivation
- Phase 3.4 W1 T1.6 routing harness 30/30 PASS result (verified `tests/routing/phase-3.4-routing-hit-rate.test.ts` L176-181 hard gates) — § 2.2 manual_review_verdict source
- sister Phase 2.1 transparency verdict-marker gate Phase 2.2 W0 T0.6 ENFORCE flip — § 6.3 1-phase cadence precedent
- sister Phase 3.4 W2 T2.2 first-implementation D2 cadence (STATE.md L6 verbatim) — § 8.1 mechanical pattern reuse
- CLAUDE.md MEMORY `feedback_biome-preempt.md` 3 CI-red recurrences — § 15.1 mandatory preempt cadence
- ROADMAP L222 "数据美化诱惑" 风险 — § 3.4 footer 反"美化"声明 anchor

### Tertiary (MEDIUM confidence — projection/未 spike)

- v0.4.md size ~350L estimate (§ 10.1) — arithmetic 10L × 30 + 100L margin; actual W1 write verifies
- STATE.md post-W0.3-trim ≈ 130L (§ 7.2 + § 8.2) — projection grounded in 148L baseline minus ~18L trim scope
- Phase 4.1 W2 task count ~6 (§ 13.2 + § 17.1) — derived from sister Phase 3.4 24 task subset excluding no-new-ADR + no-milestone-close
- ctx7 v0.4.x availability + gstack newer SHA (§ 18 U1+U2) — assumed; verified at W1 execution
- Phase 4.1 ship single-day achievability (§ 17.4 + § 18 U5) — sister Phase 3.x 1 phase/day evidence

---

## § 22 Metadata

**Confidence breakdown**:
- § 1 Baseline verify: HIGH — bash + grep direct verify
- § 2 D-01 mapping: HIGH — SAMPLES.md schema verbatim + decision_rules.yaml routing path derivation grounded
- § 3 D-02 FULL template: HIGH — 5-element format verbatim from CONTEXT D-02 + size arithmetic
- § 4 D-03 TEXT LOG: HIGH — 4-section template verbatim from CONTEXT D-03 + manifest pick install_method 多样性 grounded
- § 5 D-04 CONTRIBUTING-BENCHMARK: HIGH — fold-in option evaluated against CONTRIBUTING.md L1-200 verbatim
- § 6 W0.1 ENFORCE flip: HIGH — sister `check-transparency-verdicts.mjs` L12 verbatim + pre-flight 3 rules green verified
- § 7 W0.2 conditional D1 SIZE_LIMIT: MEDIUM — projection-based STATE post-trim ≈ 130L
- § 8 W0.3 D2 cadence iter 2: HIGH — sister Phase 3.4 W2 T2.2 verbatim pattern + STATE.md L6 + L27 HTML-comment marker verified
- § 9 T4 CI ordering spike: HIGH — ci.yml L120-190 step-by-step ordering verified; no bug found
- § 10 v0.4.md size budget: HIGH — arithmetic + sister docs precedent (adr ≤250L + AGENT-DEFINITION ~400L) range
- § 11 CONTRIBUTING-BENCHMARK ≤30L: HIGH — content recipe per § 5.2 ≤30L grounded
- § 12 e2e manifest pick rationale: MEDIUM — picks grounded in install_method coverage; actual upgrade availability needs W1 verify
- § 13 W2 ship cadence: HIGH — sister Phase 3.4 W2 T2.1-T2.11 verbatim subset reuse
- § 14 A7 守恒: HIGH — ci.yml L65-100 mechanism verbatim + 0 diff expected for docs phase
- § 15 biome preempt: HIGH — MEMORY 3 CI-red recurrences cited + touch surface enumerated
- § 16 STRIDE threat model: HIGH — 7 nodes grounded in Phase 4.1 actual surface (docs phase narrow)
- § 17 Wave topology + task count: MEDIUM — 13-16 atomic estimate grounded in sister Phase 3.4 60% scope factor
- § 18 Known unknowns: HIGH — 18 resolved + 6 remaining LOW/MEDIUM with viable fallbacks; no blockers

**Research date**: 2026-05-18
**Valid until**: ~2026-08-18 (Phase 4.1 ship + v0.4.0 milestone window; sister cadence stable within 1-quarter)

---

## RESEARCH COMPLETE
