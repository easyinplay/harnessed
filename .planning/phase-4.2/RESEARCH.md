# Phase 4.2: co-maintainer onboarding + stale-bot + GitHub Sponsors — Research

**Researched**: 2026-05-18
**Domain**: v0.4.0 milestone 2nd phase — R8.2 co-maintainer 招募 onboarding 文档 (EXPAND existing 50L stub → 100-150L production) + R8.3 stale-bot 90-day auto-close + issue templates standardization + R8.5 GitHub Sponsors 启用 (FUNDING.yml + README badge) + 6-phase 连续 sister cadence 7th iter + W0 backlog 1 项 #BA D1 SIZE_LIMIT round 2 conditional re-evaluate
**Confidence**: HIGH (15/18 sections HIGH); MEDIUM (§ 7 conditional W0.1 SIZE_LIMIT flip projection; § 11 STRIDE narrow docs/infra threat surface; § 12 single-day ship plausibility extrapolation)

---

## § 0 Scope note + sources

Wave A R2 research output, consumed by gsd-planner (Wave B). 4 D-decisions LOCKED in `.planning/phase-4.2/4.2-CONTEXT.md` (D-01 OnboardScope EXPAND existing 50L stub → 100-150L production-ready / D-02 StaleBotPolicy 90-day default + issue+PR scope / D-03 SponsorsTier Single tier $1+ minimal Karpathy YAGNI / D-04 CadenceExpect HYBRID 2-week internal launch + 6-month organic external clock) — research only covers (a) D-01~D-04 implementation paths within locked decision boundaries, (b) sister-pattern reuse from Phase 4.1 W2 ship cadence (sister precedent 1-day track record), (c) W0 backlog #BA conditional D1 SIZE_LIMIT 200→150 round 2 re-evaluate post-D2 iter 3 trim outcome, (d) NEW surface area scoping (4 NEW files in `.github/`: ISSUE_TEMPLATE/bug.yml + feature.yml + question.yml + workflows/stale.yml + 1 NEW `.github/FUNDING.yml` + 1 EXPAND `docs/MAINTAINER-ONBOARDING.md` 50L → 100-150L + README badge + footer Sponsors section update), (e) verified GitHub current schemas (FUNDING.yml field list / ISSUE_TEMPLATE form-based YAML / actions/stale@v10 cron + inputs), (f) sister Phase 4.1 W2 7-task subset reuse for Phase 4.2 W2.

**Sneak-block守门**: research does NOT propose alternatives to D-01~D-04 LOCKED decisions (no multi-tier Sponsors pricing, no 60-day or 120-day stale, no ONBOARDING split into multiple files, no FROZEN or ACCELERATED cadence). Research does NOT propose NEW ADR Phase 4.2 (pure community infra publication NOT architectural decision per PATTERNS § 5 risk #3 mitigation — sister Phase 4.1 cadence延袭 NO ADR 0018 + NO ci.yml A7 iter + NO triple tag single baseline tag).

**Source manifest** (all verified file:line + bash this session):
- `.planning/phase-4.2/{4.2-KICKOFF.md L1-77, 4.2-CONTEXT.md L1-84}` — 4 D-decisions LOCKED + W0 backlog #BA-#BD-#AH carry-forward + Discretion + Deferred verbatim
- `.planning/phase-4.1/RESEARCH.md L1-1114` (chunked) — sister 22-section template (100% format reuse target) + W2 ship 7-task cadence + DOGFOOD-T2.X.md 58L 3-axis format
- `.planning/phase-4.1/PLAN.md + task_plan.md` (referenced via STATE.md + ROADMAP.md sister cadence verification)
- `.planning/REQUIREMENTS.md L303-307 (R8.2) + L309-313 (R8.3) + L321-325 (R8.5)` — anchor 3 requirements verbatim
- `docs/MAINTAINER-ONBOARDING.md L1-50` — existing v0.1 stub (D-01 EXPAND target; preservation scope)
- `README.md L1-196` — Status line L9 + v0.4.0 status block L46-49 + Sponsor section L190-192 (badge insertion + footer update sites)
- `CONTRIBUTING.md L1-200` — sister Karpathy ≤200L precedent + existing dev setup + commit/ADR rules (cross-link target from EXPAND ONBOARDING)
- `.planning/STATE.md L1-151` — current state 151L (Phase 4.2 W0.1 #BA conditional D1 SIZE_LIMIT 200→150 baseline)
- `.planning/ROADMAP.md L185-228 (v0.4.0 milestone scope)` — Phase 4.2 拆分 L216-218 verbatim
- `PROJECT-SPEC.md L1-447 (L1-40 verified)` — Status header sister update site (sister Phase 4.1 T2.5 PROJECT-SPEC.md L3 update precedent)
- `.github/workflows/ci.yml L1-309` — A7 守恒 step preservation verify (Phase 4.2 T2.6 ci.yml verify 0 diff target; NO A7 iter since NO new ADR)
- `.github/workflows/perf-bench.yml` (existing 1339 bytes — nightly cron precedent for stale.yml cron pattern reference)
- bash inventory: `.github/` has ONLY `workflows/` (ci.yml + perf-bench.yml) — NO `ISSUE_TEMPLATE/` dir, NO `FUNDING.yml` (4 NEW files Phase 4.2 W1 create)
- [CITED: docs.github.com/sponsors] FUNDING.yml path `.github/FUNDING.yml` + 12 platform key list + `github: USERNAME` minimum example + supports single user OR list up to 4
- [CITED: docs.github.com/communities] ISSUE_TEMPLATE/*.yml form-based schema (name + description + body with type/attributes/validations) + config.yml (blank_issues_enabled + contact_links) + 5 body types (markdown / textarea / input / dropdown / checkboxes)
- [VERIFIED: github.com/actions/stale README] `actions/stale@v10` current major version (v10.2.0 Feb 2026); `days-before-issue-stale` + `days-before-issue-close` + `stale-issue-label` + `stale-issue-message` + `close-issue-message` + `exempt-issue-labels` inputs; default `cron: '30 1 * * *'` daily 1:30 UTC; operations-per-run default 30

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 OnboardScope EXPAND existing 50L stub → 100-150L production-ready**: `docs/MAINTAINER-ONBOARDING.md` v0.1 stub (50L from Phase 1.x) → EXPAND additive (preserve existing content; ADD sections for dev environment setup / commit conventions / ADR review checklist / cross-OS CI maintenance / manifest schema 守门 / upstream drift monitoring / 30-min quickstart). **Hard cap: 150L** (sister Karpathy minimal surface + 6-month window doc stability). Sneak-block: NO split into multiple files (single ONBOARDING.md SoT; sister 1-file precedent CONTRIBUTING.md + PROJECT-SPEC.md); NO checklist-only format (lose narrative context for 新人). Rationale: R8.2 验收 "外部新人 30 分钟可跑通 dev 环境" needs narrative + commands hybrid.

- **D-02 StaleBotPolicy 90-day default + issue+PR scope**: `.github/workflows/stale.yml` NEW with `actions/stale@v10` recipe; days-before-issue-stale = 90 (R8.3 spec verbatim); days-before-issue-close = 90 (90-day window — mark stale at day 60, close at day 90 per CONTEXT D-02 L22-23). Scope: BOTH issue + PR (max coverage; PR stale handling = avoid zombie PRs blocking maintainer attention). Sneak-block: NO 60-day stricter (risks 埋没 new contributor issues; T3 external dependency 不利); NO 120-day lenient (违 R8.3 90-day spec). Rationale: GitHub default convention + balanced for low-volume project.

- **D-03 SponsorsTier Single tier $1+ minimal Karpathy YAGNI**: `.github/FUNDING.yml` NEW with `github: easyinplay` single-line config (per CONTEXT D-03 L28); NO multi-tier pricing definition in repo (Sponsors page itself may have tier pricing — defer all pricing-design to v0.5+ if community signal arrives). Sneak-block: NO multi-tier 3-level ($5/$25/$100) pre-v1.0 (Patreon-style pricing-design overhead); NO link-only no-tier (violates "可接受捐赠" verb literal). Rationale: Karpathy YAGNI + R8.5 minimal verifiable requirement satisfied + pricing tier requires community signal (no data pre-launch).

- **D-04 CadenceExpect HYBRID 2-week internal launch + 6-month organic external clock**: Phase 4.2 ship cadence = internal infra (1 phase/day applies; sister Phase 4.1 ≤1 day track record); 6-month co-maintainer recruitment window = SEPARATE clock (organic, NOT counted in v0.4.0 ship timeline). v0.4.0 ROADMAP timeline reconciliation: 2-3 周 total per ROADMAP L185 covers Phase 4.1 + 4.2 + 4.3 INTERNAL ship; external 6-month window opens AFTER v0.4.0 ship, runs through v0.5/v1.0. Sneak-block: NO fully FROZEN 6-month (violates ROADMAP 2-3 周 v0.4.0 total); NO ACCELERATED expect "招到 1 个外部 PR within 2 weeks" (忽视 T3 external time 不可控). Rationale: sister Karpathy "ship fast even if external" + R9.1 单 maintainer 36%/年掉队率 mitigation 长期工程 NOT short-term sprint.

### Claude's Discretion

- **README badge insertion site**: top header `Sponsors` badge OR footer Sponsors section append (planner Discretion #1 — § 5 recommendation = footer L190-192 section EXPAND + minimal `Sponsor` badge to existing L6-7 badge block; rationale: keep top header signal density low, footer Sponsors section already exists as natural anchor)
- **`.github/workflows/stale.yml` cron schedule**: daily 00:00 UTC vs weekly Monday 00:00 UTC vs `actions/stale` default `30 1 * * *` daily 1:30 UTC (planner Discretion #2 — § 4 recommendation = daily 1:30 UTC reuse actions/stale default; rationale: action README documents this pattern; off-peak GitHub Actions queue; weekly = slower stale signal)
- **issue template format**: `.md` classical OR `.yml` form-based modern (planner Discretion #3 — § 6 recommendation = `.yml` form-based; rationale: structured user input, GitHub native schema, validations support, per docs.github.com/communities current best practice 2026)
- **Phase 4.2 ship single baseline tag name**: `v0.4.0-alpha.2-community` recommended (covers all 3 anchors R8.2 + R8.3 + R8.5; sister Phase 4.1 `v0.4.0-alpha.1-benchmark` pattern延袭; § 14)
- **Existing 50L stub content preservation strategy**: full rewrite vs additive expand (D-01 LOCK additive; § 3.4 recommendation = section reorder preserve all 6 existing sections + ADD 5-7 NEW sections; v0.1 stub quality acceptable as baseline)
- **W0.1 D2 iter 3 trim scope**: Phase 4.0 narrative AND/OR Phase 4.1 narrative → RETROSPECTIVE (planner Discretion #6 — § 8 recommendation = Phase 4.0 N/A NEVER EXISTED, Phase 4.1 narrative → RETROSPECTIVE as iter 3; rationale: at Phase 4.2 ship time, prev-prev-phase = Phase 4.1 only since v0.4.0 milestone has 3 phases 4.1+4.2+4.3 — sister D2 cadence definition "prev-prev-phase narrative" applies to Phase 4.1)

### Deferred Ideas (OUT OF SCOPE)

- Multi-tier Sponsors pricing (defer until community signal post-launch)
- co-maintainer 招募窗口 actual recruiting (organic external clock per D-04 HYBRID; runs through v0.5)
- ONBOARDING-QUICKSTART split (over-engineering pre-v1.0; sister 1-file precedent CONTRIBUTING.md)
- 60-day stale stricter / 120-day stale lenient (违 R8.3 spec)
- ACCELERATED 2-week external PR expect (ignores T3 reality)
- FROZEN 6-month (违 ROADMAP 2-3 周 v0.4.0 internal cadence)
- 路由透明度日志 audit.log (R9.2) / 公开 ADR 全集 (R8.4) / v1.0-RC 收尾 → Phase 4.3
- plan-feature 真接 gsd-* spawn dogfood → v0.5+
- 跨 harness pre-v0.5 / 云端 registry v1.0+ / 可视化 dashboard / 动态 eval / wrap 上游 API / NEW workflow type → 全部 v1.0 前拒绝清单

---

## Project Constraints (from CLAUDE.md)

- **路由路径优先级**: gstack (决策层) > GSD (orchestration) > superpowers (子任务执行) > planning-with-files (持久化) > karpathy 心法 (编码) > ralph-loop (交付) — Phase 4.2 是 GSD plan-phase 路径 (discuss → plan → execute → verify); pure docs + infra phase = no superpowers brainstorming子任务级 trigger needed
- **karpathy 4 心法 always-on**: Think Before Coding / Simplicity First (YAGNI) / Surgical Changes / Goal-Driven — Phase 4.2 = high YAGNI risk (community infra easy to over-engineer Sponsors tier / stale message verbosity / issue template field count)
- **hard limit ≤200L per file** (B-06 + B-26 + sister 6-phase 连续 hold) — Phase 4.2 touch files: MAINTAINER-ONBOARDING.md ≤150L D-01 hard cap (docs convention sister CLAUDE.md ≤150L); STATE.md target ≤140L post-W0.1 trim if #BA flip path; README.md 196L approaches 200L cap (badge add + footer expand may add 3-5L → tight but safe)
- **biome preempt MANDATORY before commit** (MEMORY `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3) — Phase 4.2 touch surface: `.yml` files + `.md` files only; **biome scope = .ts/.js/.mjs/.json — NO `.yml` `.md` coverage**; § 10 documents this no-op expectation
- **CLAUDE.md is read-only by harnessed installer** (D-02 SKILL-ONLY post-Phase 2.3) — Phase 4.2 不动 CLAUDE.md
- **web search routing**: Tavily MCP (默认) / Exa MCP (语义/学术/批量 URL) — this RESEARCH used WebFetch fallback for docs.github.com + actions/stale README (Context7 has no actions/stale entry); future Phase 4.2 execution can use Tavily if upstream stale-bot config changes needed
- **ctx7 for library docs**: actions/stale not in Context7 registry (verified bash); fallback to GitHub README + docs.github.com [CITED]

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R8.2 | co-maintainer 招募窗口 — 6 月窗口 + `docs/MAINTAINER-ONBOARDING.md`; 外部新人 30 分钟可跑通 dev 环境 | § 3 D-01 EXPAND template + § 3.4 7-section expand recipe + § 3.5 30-min quickstart hardware/software/clone-to-test-pass walk-through; SoT preserve existing 6-section + ADD 5-7 NEW section delta = ~80-100L over 50L baseline = 130-150L total |
| R8.3 | stale-bot + issue templates — GitHub Action stale workflow 自动关闭 90 天无活动 issue; issue/PR 模板标准化; 验收 stale-bot 上线 + issue 模板使用率 ≥ 80% | § 4 D-02 `.github/workflows/stale.yml` actions/stale@v10 recipe verbatim + § 6 ISSUE_TEMPLATE 3-template (bug.yml + feature.yml + question.yml) + config.yml blank_issues_enabled false + contact_links pointing to MAINTAINER-ONBOARDING; 80% adoption is post-launch metric (Phase 4.2 only ships the infrastructure, adoption tracked v0.5+) |
| R8.5 | GitHub Sponsors 启用 — Sponsors page + README badge; 验收 Sponsors 链接公开 + 可接受捐赠 | § 5 D-03 `.github/FUNDING.yml` `github: easyinplay` 1-line config + § 5.2 README footer Sponsor section EXPAND + § 5.3 badge add to L6-7 badge block; verified Sponsors page existence is **prereq user manual action** outside Phase 4.2 scope (planner add note "user manually enables Sponsors at github.com/sponsors/easyinplay before ship") |
| ROADMAP L185-228 v0.4.0 scope | v0.4.0 必含 6 项: R8.1 (Phase 4.1 ✅) + R8.2 + R8.3 + R8.4 + 路由透明度日志 + R8.5 — Phase 4.2 anchor R8.2 + R8.3 + R8.5; R8.4 + 路由透明度日志 → Phase 4.3 | § 0 scope note: Phase 4.2 anchors R8.2/R8.3/R8.5 only; R8.4 ADR 全集 + 路由审计日志 → Phase 4.3 explicit out-of-scope per CONTEXT Deferred |
| W0 carry-forward (Phase 4.1 deferred-items.md) | #BA D1 SIZE_LIMIT 200→150 round 2 conditional re-evaluate + #BB ✅ RESOLVED D-04 + #BC defer no signal + #BD ADVISORY + #AH defer conditional | § 7 W0.1 #BA conditional flip mechanics: post-Phase-4.1 ship STATE 151L → D2 iter 3 trim Phase 4.1 narrative → verify ≤140L → FLIP D1 SIZE_LIMIT 200→150 / else DEFER #BA carry Phase 4.3 |
| Karpathy hard limit (B-06 + B-26) | ≤200L per file 6-phase 连续 hold | § 3.2 MAINTAINER-ONBOARDING ≤150L docs convention (sister CLAUDE.md docs convention); § 7.3 STATE.md post-trim ~135-140L; § 5.3 README badge add 1-2L delta (current 196L → 198L safe); § 6.2 issue template each ~30-50L individual file |
| biome preempt (MEMORY) | 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 | § 10 Phase 4.2 touch surface = `.yml + .md` ONLY (NO .ts/.js/.mjs/.json) → biome preempt no-op for Phase 4.2; documented to prevent confusion. If sister review surfaces a `.ts` fix mid-phase, biome preempt fires per existing cadence |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Co-maintainer onboarding documentation (R8.2 EXPAND 50L → 100-150L) | docs-governance (`docs/MAINTAINER-ONBOARDING.md` EXPAND additive) | cross-link consumer (`CONTRIBUTING.md` dev setup + `PROJECT-SPEC.md` § 5.6 商业模式 + ROADMAP.md v0.4.0 scope) | D-01 EXPAND additive: existing 50L v0.1 stub preserves all 6 sections (目标 / 招募窗口 / Co-maintainer 角色定位 / 必读文档 / TODO / 风险), Phase 4.2 ADDS 5-7 NEW sections (dev environment setup / commit conventions / ADR review checklist / cross-OS CI maintenance / manifest schema 守门 / upstream drift monitoring / 30-min quickstart). Hard cap 150L sister docs convention. Single SoT (no split). |
| Stale-bot automation (R8.3 90-day issue+PR auto-close) | tool-script (`.github/workflows/stale.yml` NEW; actions/stale@v10 recipe) | manual operation (per-repo enabled via .github/workflows scan; default cron `30 1 * * *` daily) | D-02 90-day default + issue+PR scope per CONTEXT D-02 L22-23; actions/stale@v10 verified current ([VERIFIED: github.com/actions/stale README v10.2.0 Feb 2026]); planner Discretion = daily cron 1:30 UTC reuses action default; exempt-issue-labels supports "pinned,security" defensive list |
| Issue template standardization (R8.3 issue/PR 模板) | tool-script (`.github/ISSUE_TEMPLATE/bug.yml + feature.yml + question.yml + config.yml` NEW form-based) | docs cross-link (config.yml `contact_links` points to MAINTAINER-ONBOARDING for general questions) | D-02 implicit (CONTEXT D-02 covers stale-bot + R8.3 spec includes "issue templates standardization"); planner Discretion = .yml form-based per [CITED: docs.github.com/communities] 2026 best practice; 5 body types (markdown/textarea/input/dropdown/checkboxes); config.yml `blank_issues_enabled: false` enforces template usage (R8.3 80% adoption verb) |
| GitHub Sponsors enable (R8.5 Sponsors link + README badge) | tool-script (`.github/FUNDING.yml` NEW 1-line `github: easyinplay`) | docs cross-link (`README.md` L6-7 badge insertion + L190-192 Sponsor footer section EXPAND) | D-03 single tier $1+ Karpathy YAGNI; `.github/FUNDING.yml` path verified [CITED: docs.github.com/sponsors]; minimum syntax `github: USERNAME` (string OR list up to 4 — single user sufficient per D-03 sneak-block); prereq: user manually approves Sponsors account at github.com/sponsors/easyinplay BEFORE Phase 4.2 ship (Phase 4.2 ships config; account activation = external user action) |
| W0.1 #BA conditional D1 SIZE_LIMIT 200→150 round 2 (sister Phase 4.1 W0.5 path dep) | tool-script (`scripts/check-state-archive-stale.mjs` L12 `SIZE_LIMIT = 200` → `150` if STATE ≤140L post-trim) | docs-governance (STATE.md trim Phase 4.1 narrative → RETROSPECTIVE absorb section iter 3) | Sister Phase 4.1 W0.5 DEFER path active (#BA carry-forward Phase 4.2 W0); decision tree: STATE post-W0.1 trim ≤140L → FLIP; 141-150L → DEFER #BA carry Phase 4.3; >150L → investigate. Pre-W0.1 baseline STATE 151L; trim Phase 4.1 narrative removes 5 关键决策 rows + condense 当前位置 → estimated ~135-140L → flip safe HIGH confidence |
| Phase 4.2 W2 ship cadence (sister Phase 4.1 W2 7-task subset reuse) | git tag (`v0.4.0-alpha.2-community` single baseline tag LOCAL CREATE only NO push) | A7 守恒 hold (ADR 0001-0017 0 diff post-ship — Phase 4.2 NO NEW ADR per pure community infra publication NOT architectural decision) | Sister Phase 4.1 W2 = 7-task baseline (T2.1 STATE + T2.2 RETRO + T2.3 ROADMAP + T2.4 README + T2.5 PROJECT-SPEC + T2.6 ci.yml verify 0 diff + T2.7 DOGFOOD). Phase 4.2 W2 = sister 7-task verbatim subset reuse (sister Phase 4.1 SHIPPED 2026-05-18 cadence延袭 W2 7 atomic commits one-day track record verified). NO ADR 0018 + NO triple tag (single baseline tag) — sister Phase 4.1 PATTERNS § 5 risk #3 mitigation延袭 |

---

## § 1 Baseline verify (`.github/` inventory + existing 50L stub + sister precedents)

**Confidence: HIGH** — `ls .github/` returns only `workflows/` (ci.yml + perf-bench.yml); NO `ISSUE_TEMPLATE/` dir; NO `FUNDING.yml` (本 session bash 直证); `wc -l docs/MAINTAINER-ONBOARDING.md` = **50L** exact; `wc -l .planning/STATE.md` = **151L** baseline.

### 1.1 `.github/` directory baseline state

```
.github/
└── workflows/
    ├── ci.yml          (19599 bytes, 309L; A7 守恒 + 3 transparency gates)
    └── perf-bench.yml  (1339 bytes; nightly cron precedent)
```

**Phase 4.2 W1 NEW files** (4 NEW + 1 OPTIONAL config):
1. `.github/FUNDING.yml` NEW 1L `github: easyinplay` (D-03)
2. `.github/workflows/stale.yml` NEW ~30-40L (D-02 actions/stale@v10 recipe)
3. `.github/ISSUE_TEMPLATE/bug.yml` NEW ~50-60L (form-based with steps to reproduce + expected/actual + env)
4. `.github/ISSUE_TEMPLATE/feature.yml` NEW ~40-50L (form-based with problem + proposal + alternatives)
5. `.github/ISSUE_TEMPLATE/question.yml` NEW ~30-40L (form-based + contact_links redirect priority)
6. `.github/ISSUE_TEMPLATE/config.yml` NEW ~10-15L OPTIONAL (blank_issues_enabled: false + contact_links → MAINTAINER-ONBOARDING + GitHub Discussions if enabled)

**Total NEW surface**: 4 files mandatory + 1-2 optional + 1 EXPAND (MAINTAINER-ONBOARDING.md) + README badge edit + STATE.md trim per W0.1.

### 1.2 `docs/MAINTAINER-ONBOARDING.md` baseline (50L v0.1 stub from Phase 1.x)

Existing 6-section structure (verified L1-50 verbatim):
1. **Status** (L1-4): v0.1 occupied doc marker + decision source ROADMAP + R04 P0#3
2. **目标** (L6-8): bus factor ≥ 1.5 + 6-month window + at least 1 external PR merge
3. **招募窗口** (L10-14): 启动 v0.4 ship / 时长 6 月 / 退出 maintenance-only
4. **Co-maintainer 角色定位** (L16-20): commit access + first responsibility (cross-OS CI + manifest schema + upstream drift) + 入门承诺 (30 分钟 + 1 PR)
5. **必读文档** (L22-31): 8 doc list (PROJECT-SPEC + WORKFLOWS-MVP + ADR 0001/0002/0003 + CONTRIBUTING + ROADMAP + STATE)
6. **v0.4 启动前 TODO** (L33-39): 5 TODO items (Sponsors / stale-bot / issue template / good-first-issue / 招募贴文)
7. **风险** (L41-45): 3 awareness items (Avelino 36% / 上游漂移 / 招不到 fallback)
8. **References** (L47-49): PROJECT-SPEC § 5.6 + R04 P0#3 + Avelino paper URL

**D-01 EXPAND additive scope** (preserve all 6+2 sections, ADD 5-7 NEW sections):

NEW sections to add per R8.2 verbatim "外部新人 30 分钟可跑通 dev 环境":
- **A. Dev Environment 30-min Quickstart** (~15-20L) — clone → corepack enable → pnpm install → pnpm test pass walk-through, cross-OS (Win Bash ACL workaround) cross-link CONTRIBUTING.md
- **B. Commit Convention Reference** (~10L) — phase-N.M T<N>.<M> format + sister taskpath cross-link CONTRIBUTING.md
- **C. ADR Review Checklist** (~15L) — co-maintainer ADR PR review 5-point list (9-章节 errata format + A7 守恒 baseline tag + status flow + cross-ref ADR 0005 errata precedent + biome preempt before commit)
- **D. Cross-OS CI Maintenance Playbook** (~10L) — when CI red on Win-only, debugging playbook (sister Phase 3.4 build-before-test hotfix 554b82b)
- **E. Manifest Schema 守门 SOP** (~10L) — when reviewing manifest PRs, schema fixture-driven verify + ADR errata path (cross-link ADR 0001 + 0003)
- **F. Upstream Drift Monitoring** (~10L) — weekly check `harnessed doctor` + monthly upstream version diff review + escalation when upstream stops shipping

**Section count post-expand**: 8 existing + 6 NEW = 14 sections. LOC delta: 50L → ~120-140L (well under 150L cap). Karpathy YAGNI: drop section if redundant; current 6 NEW each addresses distinct R8.2 verb (dev env / commit / ADR / CI / schema / upstream).

### 1.3 STATE.md baseline (151L post-Phase 4.1 ship)

Per STATE.md L1-151 verified bash:
- Phase 4.1 narrative (L22-26 当前位置 long inline + L43-49 关键决策记录 5+ rows + L36 各里程碑进度 + L116-122 关键决议 archive marker) — D2 cadence iter 3 trim target
- W0.1 #BA pre-flight: SIZE_LIMIT current = 200; post-trim STATE estimated ~135-140L; flip safe if ≤140L

### 1.4 sister Phase 4.1 W2 ship cadence verified (7-task baseline)

Per recent commit log (verified `git log df3265f bfce4a3 dbb4d93 3581ea3 271e78e ...` shown in env):
- T2.1 STATE.md update (Phase 4.1 ship event)
- T2.2 RETROSPECTIVE.md append (271e78e — Phase 4.1 milestone retrospective 7-section + Next Phase Prep Notes)
- T2.3 ROADMAP.md Phase 4.1 ✅ SHIPPED + v0.4.0 milestone 1/3 PROGRESS (3581ea3)
- T2.4 README.md L9 Status freshness Phase 4.1 SHIPPED + v0.4.0 MILESTONE 1/3 + Phase 4.1 row append (dbb4d93)
- T2.5 PROJECT-SPEC.md L3 Status header Phase 4.1 SHIPPED literal + L6 下一步 Phase 4.2 (bfce4a3)
- T2.6 ci.yml VERIFY 0 diff + T2.7 DOGFOOD-T2.X.md NEW 58L PASS 3/3 axes verified miss: none (df3265f)

**Phase 4.2 W2 reuse**: verbatim sister 7-task subset (no NEW ADR + no milestone close). Tag name `v0.4.0-alpha.2-community` (CONTEXT § Discretion #4 explicit recommendation).

[HIGH — bash ls .github/ + wc -l verified; sister Phase 4.1 W2 7-task cadence verified via recent commit log gitStatus; baseline STATE 151L + 50L stub exact]

---

## § 2 D-01 implementation: MAINTAINER-ONBOARDING.md 50L → 100-150L EXPAND (additive preserve)

**Confidence: HIGH** — D-01 LOCKED EXPAND additive; existing 50L stub structure verified verbatim § 1.2; ADD section recipe derived from R8.2 verb literal.

### 2.1 Section preservation map (existing 6+2 sections KEEP verbatim)

| Existing § | LOC | Phase 4.2 disposition |
|------------|-----|----------------------|
| Status (L1-4) | 4L | KEEP verbatim — frontmatter v0.1 stub marker (update version "v0.1" → "v0.4 activated") |
| 目标 (L6-8) | 3L | KEEP verbatim |
| 招募窗口 (L10-14) | 5L | KEEP verbatim (启动 v0.4 ship is now actual, not future) |
| Co-maintainer 角色定位 (L16-20) | 5L | KEEP verbatim |
| 必读文档 (L22-31) | 10L | KEEP + UPDATE: ADR list 0001/0002/0003 → add 0014-0017 cross-link (sister Phase 3.x ADR addition) + add DOGFOOD docs cross-link |
| v0.4 启动前 TODO (L33-39) | 7L | UPDATE: 5 TODO items → check off Sponsors ✓ + stale-bot ✓ + issue template ✓ (all delivered Phase 4.2 W1); good-first-issue + 招募贴文 remain organic external clock items per D-04 HYBRID |
| 风险 (L41-45) | 5L | KEEP verbatim |
| References (L47-49) | 3L | KEEP verbatim |

**Preservation total**: ~42L existing core (excluding `## sections` separators ~8L overhead = 50L baseline matches).

### 2.2 NEW section ADD recipe (Phase 4.2 W1 EXPAND target)

| NEW § | Position | LOC est | Anchor source |
|-------|----------|---------|---------------|
| A. Dev Environment 30-min Quickstart | After 必读文档 (L31) — new L32 | ~18L | R8.2 验收 verbatim "外部新人 30 分钟可跑通 dev 环境"; cross-link CONTRIBUTING.md Setup + Win Workaround |
| B. Commit Convention Reference | After A | ~10L | CONTRIBUTING.md Commit Message 格式 cross-link; phase-N.M T<N>.<M> format example |
| C. ADR Review Checklist | After B | ~15L | CONTRIBUTING.md ADR 写作规则 cross-link + ADR 0005 errata precedent; 5-point review checklist (status flow / 9-章节 format / A7 守恒 baseline tag / cross-ref / biome preempt) |
| D. Cross-OS CI Maintenance Playbook | After C | ~10L | sister Phase 3.4 build-before-test hotfix 554b82b precedent (ci.yml L122-126 comment block verbatim cross-link); 3-step debug (CI matrix red → reproduce locally Win cmd → fix forward strategy) |
| E. Manifest Schema 守门 SOP | After D | ~10L | manifests/SCHEMA.md cross-link + ADR 0001 manifest schema + ADR 0003 method count errata; fixture-driven verify command `corepack pnpm test -- --filter manifest-validate` |
| F. Upstream Drift Monitoring | After E | ~12L | `harnessed doctor` 8-check cross-link + monthly version diff procedure + Phase 4.1 v0.4-upgrade-e2e.log template precedent + escalation when upstream stops shipping |

**NEW LOC delta**: ~75L (18+10+15+10+10+12 = 75L). Combined post-expand: 50L existing + 75L NEW = **~125L** ≤ 150L hard cap ✅.

### 2.3 Section order rationale (Karpathy reader-flow)

```
Status → 目标 → 招募窗口 → 角色定位 → 必读文档
  └─> [NEW: Dev Quickstart 30-min] (immediately actionable)
  └─> [NEW: Commit Convention]
  └─> [NEW: ADR Review Checklist]
  └─> [NEW: Cross-OS CI Playbook]
  └─> [NEW: Manifest Schema SOP]
  └─> [NEW: Upstream Drift Monitoring]
→ v0.4 启动前 TODO (UPDATE checked items) → 风险 → References
```

Rationale: existing sections frame *why* (目标 + 招募窗口 + 角色定位); NEW sections provide *how* (operational SOPs); existing footer (TODO + 风险 + References) wraps with status + caveats. Sister CONTRIBUTING.md L1-200 follows same pattern (Prerequisites → Setup → 常用命令 → Commit → ADR → Manifest → Findings).

### 2.4 Sneak-block守门 enforcement (CONTEXT D-01 verbatim)

| Sneak-block | Enforcement mechanism |
|-------------|----------------------|
| MUST NOT split into multiple files (single ONBOARDING.md SoT) | Pre-commit grep: `ls docs/ONBOARDING*` returns ONLY `MAINTAINER-ONBOARDING.md` (no `ONBOARDING-QUICKSTART.md` etc.); planner W1 single-file edit |
| MUST NOT use checklist-only format (lose narrative for 新人) | Reviewer check: section count ≥ 8 with prose paragraphs (not bare `- [ ]` lists only); existing 8 sections + 6 NEW = 14 sections narrative-rich |
| MUST cap ≤ 150L hard | Pre-commit `wc -l docs/MAINTAINER-ONBOARDING.md` ≤ 150 (planner W1 verify gate); mitigation if breach: drop section F (lowest acceptance value — drift monitoring is monthly check vs Dev Quickstart 30-min essential) |
| MUST preserve existing 6+2 sections verbatim (additive expand, not rewrite) | Reviewer diff: `git diff docs/MAINTAINER-ONBOARDING.md` shows existing sections L1-50 unchanged or minimally updated (TODO check-off only); NEW sections appended between 必读文档 and TODO |

[HIGH — existing 50L stub structure verified verbatim § 1.2; ADD section recipe grounded in R8.2 acceptance verb + CONTRIBUTING.md sister cross-link; section ordering follows sister CONTRIBUTING reader-flow pattern]

---

## § 3 D-02 implementation: `.github/workflows/stale.yml` actions/stale@v10 recipe verbatim

**Confidence: HIGH** — D-02 LOCKED 90-day + issue+PR scope; actions/stale@v10 verified current [VERIFIED: github.com/actions/stale README v10.2.0 Feb 2026].

### 3.1 stale.yml verbatim recipe (Phase 4.2 W1 NEW ~35L)

```yaml
# .github/workflows/stale.yml
# Phase 4.2 R8.3 — stale-bot 90-day auto-close issue + PR
# D-02 LOCKED: 90-day default, issue+PR scope, mark-stale-at-60 + close-at-90 semantic
# actions/stale@v10 verified current (v10.2.0 Feb 2026)

name: 'Close stale issues and PRs'

on:
  schedule:
    # Daily 1:30 UTC (actions/stale recommended off-peak cron)
    - cron: '30 1 * * *'
  workflow_dispatch:  # manual trigger for testing

permissions:
  issues: write
  pull-requests: write

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v10
        with:
          # 90-day total window per R8.3 spec verbatim
          # Mark stale at day 60 (warning), close 30 days later at day 90
          days-before-issue-stale: 60
          days-before-issue-close: 30
          days-before-pr-stale: 60
          days-before-pr-close: 30

          stale-issue-label: 'stale'
          stale-pr-label: 'stale'

          stale-issue-message: |
            This issue has been automatically marked as stale because it has not had recent activity.
            It will be closed in 30 days if no further activity occurs. Thank you for your contributions.
          close-issue-message: |
            This issue was closed because it has been stale for 90 days with no activity.
            Reopen if still relevant — bus factor ≥ 1.5 means we welcome external triage.
          stale-pr-message: |
            This pull request has been automatically marked as stale because it has not had recent activity.
            It will be closed in 30 days if no further activity occurs.
          close-pr-message: |
            This PR was closed because it has been stale for 90 days with no activity.

          # Defensive exemptions
          exempt-issue-labels: 'pinned,security,good first issue,help wanted'
          exempt-pr-labels: 'pinned,security,blocked'

          # Rate limit defense (default 30; raise if backlog grows)
          operations-per-run: 30
```

**Total LOC**: ~45L (with comments + blank lines for readability).

### 3.2 D-02 semantic decision: 60+30 split vs 90+0 single-stage

CONTEXT D-02 L22-23 verbatim: "auto-close action: mark stale at day 60 (warning) → close at day 90 (R8.3 spec)". This is **60+30 split**:
- `days-before-issue-stale: 60` (day 60 = mark stale + send warning comment)
- `days-before-issue-close: 30` (30 more days = day 90 close)
- **Net 90-day total** matches R8.3 spec "90 天无活动" verb literal

Alternative `days-before-issue-stale: 90 + days-before-issue-close: 0` = immediate close on day 90 (no warning grace) — REJECTED implicitly by D-02 verb "warning"; planner sticks with 60+30 split.

### 3.3 Cron schedule decision (planner Discretion #2)

Recommendation: `cron: '30 1 * * *'` daily 1:30 UTC (actions/stale README default). Alternatives:
- `cron: '0 0 * * *'` daily 00:00 UTC — high GitHub Actions queue contention (popular)
- `cron: '0 0 * * 1'` weekly Monday 00:00 UTC — slower stale signal (7-day delay max), but lower API quota usage

Daily 1:30 UTC reuse-default is Karpathy YAGNI sane default; switch to weekly only if API quota becomes issue (current repo low-volume so quota non-issue).

### 3.4 Sneak-block守门 enforcement (CONTEXT D-02 verbatim)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST be 90-day total (NOT 60-day stricter, NOT 120-day lenient) | Reviewer grep: `grep -E 'days-before-(issue\|pr)-(stale\|close)' .github/workflows/stale.yml` returns exactly `60` + `30` (split 90-day total); fail if any value < 60 or > 90 |
| MUST cover BOTH issue + PR (sneak-block: NOT issue-only) | Reviewer grep: `grep -c 'days-before-pr' .github/workflows/stale.yml` ≥ 2 (pr-stale + pr-close both present) |
| MUST pin to `actions/stale@v10` (not floating `@v9` or `@main`) | Reviewer grep: `grep 'actions/stale@v' .github/workflows/stale.yml` returns `@v10` exact (NOT `@v9` outdated per CONTEXT, NOT `@main` floating risk) |
| MUST include `exempt-issue-labels` defensive list | Reviewer grep: `grep 'exempt-issue-labels' .github/workflows/stale.yml` returns line containing 'pinned' + 'security' (per actions/stale README recommendation) |

[HIGH — actions/stale@v10 verified [VERIFIED: github.com/actions/stale README]; 60+30 split derivation grounded in CONTEXT D-02 verbatim "mark stale at day 60 → close at day 90"; cron + exempt-labels follow action default conventions]

---

## § 4 D-03 implementation: `.github/FUNDING.yml` + README badge insertion

**Confidence: HIGH** — D-03 LOCKED single tier $1+ + `github: easyinplay`; FUNDING.yml path verified [CITED: docs.github.com/sponsors].

### 4.1 FUNDING.yml verbatim recipe (Phase 4.2 W1 NEW 1L)

```yaml
# .github/FUNDING.yml
# Phase 4.2 R8.5 — GitHub Sponsors enable, single tier Karpathy YAGNI
github: easyinplay
```

**Total LOC**: 1 directive line + 2 comment lines = ~3L total. **Minimum sufficient** per [CITED: docs.github.com/sponsors] "The minimum example for a single GitHub Sponsor is `github: USERNAME`".

### 4.2 Prerequisite: GitHub Sponsors account activation (USER MANUAL action)

[CITED: docs.github.com/sponsors] does NOT explicitly state whether the GitHub Sponsors account must be approved before the Sponsor button displays — but the practical reality from GitHub UX is:
- User must visit `https://github.com/sponsors/easyinplay/dashboard` and complete Sponsors onboarding (bank/payout setup, tier definition, profile bio)
- Sponsors account moves through states: Setup In Progress → Pending Approval → Active
- Once Active, the `.github/FUNDING.yml` `github: easyinplay` reference activates the "Sponsor" button on the repo page

**Phase 4.2 ships the config file; account activation = external user action**. Planner adds explicit note to PLAN.md + DOGFOOD-T2.X.md axis C verify step: "Verify Sponsors button renders on repo page post-ship (requires Sponsors account Active state — user manual prerequisite outside Phase 4.2 scope)."

**Fallback**: If user has NOT yet completed Sponsors onboarding by Phase 4.2 ship time, FUNDING.yml is committed (forward-compatible) but Sponsor button shows nothing until account activates. This is **acceptable Karpathy YAGNI**: ship the infra, don't block on external bureaucracy.

### 4.3 D-03 single-tier vs multi-tier sneak-block

[ASSUMED] Sponsors tier definition lives in the Sponsors dashboard UI (github.com/sponsors/easyinplay/dashboard), NOT in repo `.github/FUNDING.yml`. The `.github/FUNDING.yml` only points to the Sponsors account; tier pricing is configured separately in the dashboard.

This means D-03 sneak-block "NO multi-tier 3-level ($5/$25/$100)" applies to the **dashboard tier definition** action (not the `.github/FUNDING.yml` config). Planner adds reminder: "When configuring Sponsors dashboard tier, use single $1+ minimal tier; defer multi-tier to v0.5+ if community signal." This is documentation-only; not a `.github/` config concern.

### 4.4 Sneak-block守门 enforcement (CONTEXT D-03 verbatim)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST be `github: easyinplay` single-line config (single user, NOT list) | Reviewer grep: `wc -l .github/FUNDING.yml` ≤ 5 (1 directive + 2-3 comment); `grep -c '^github:' .github/FUNDING.yml` = 1; no `[user1, user2]` list syntax |
| MUST NOT add multi-tier pricing to repo config (deferred to Sponsors dashboard UI) | Reviewer grep: `grep -E '(patreon\|open_collective\|ko_fi\|tier)' .github/FUNDING.yml` = 0 (only `github` key per D-03) |
| MUST update README badge + footer Sponsors section | Reviewer grep: `grep -c '\[Sponsor' README.md` ≥ 1 (badge OR footer); README L190-192 Sponsor section EXPANDED with FUNDING.yml link + Sponsors page URL |

[HIGH — FUNDING.yml minimum syntax [CITED: docs.github.com/sponsors] verbatim verified; user manual prereq grounded in GitHub Sponsors onboarding UX (Pending Approval → Active state); tier definition location separation prevents config sneak-add]

---

## § 5 README badge insertion + footer Sponsors section EXPAND (planner Discretion #1)

**Confidence: HIGH** — README.md L1-196 verified; existing Sponsor footer section L190-192 minimal (3L stub).

### 5.1 Badge insertion site (Discretion #1 recommendation: TOP + FOOTER both)

Current README.md L6-7 badge block:
```markdown
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)
```

Phase 4.2 W1 ADD (1L delta):
```markdown
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
```

**Badge URL pattern**: `https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor` — shields.io built-in dynamic count badge, no service integration needed.

**LOC delta**: +1L badge line. README total 196 → 197L ≤ 200L hard cap ✅.

### 5.2 Footer Sponsors section EXPAND (L190-192 current → ~6L post-expand)

Current (L190-192):
```markdown
## Sponsor / Co-maintainer

GitHub Sponsors 启用 + co-maintainer 招募窗口在 v0.4 开启（参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)）。
```

Phase 4.2 W1 EXPAND (+3-4L delta):
```markdown
## Sponsor / Co-maintainer

GitHub Sponsors **已启用** (Phase 4.2 SHIPPED v0.4.0) — [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay) 或直接访问 [github.com/sponsors/easyinplay](https://github.com/sponsors/easyinplay).

Co-maintainer 6 月招募窗口已开启 — 完整入门指引参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)（30 分钟可跑通 dev 环境 per R8.2 验收）.

stale-bot 已上线 — 90 天无活动 issue/PR 自动关闭 (`.github/workflows/stale.yml`); issue 模板见 `.github/ISSUE_TEMPLATE/`。
```

**LOC delta**: 3L → 7L = +4L. Combined README total 196 → 200-201L approaches cap; planner Discretion: if README hits 201L, condense footer 7L → 6L by merging Sponsor badge link inline.

### 5.3 Discretion #1 rationale: TOP + FOOTER both

| Site | Pro | Con | Verdict |
|------|-----|-----|---------|
| TOP badge ONLY | High visibility at first scroll | Sponsor badge buries License + Status which are project-identity badges | Add 1 badge to top, NOT remove License/Status |
| FOOTER Sponsors section ONLY | Natural anchor exists L190-192 | Buried below FAQ + 文档导航 + License — low conversion | KEEP + EXPAND |
| **TOP + FOOTER both** | Top discovery + footer detail | +5L total README | **RECOMMENDED** ✅ — sister GitHub OSS convention (shields.io badge top + footer Sponsor section); Phase 4.2 docs phase docs heavy = low LOC pressure |

### 5.4 Sneak-block守门 (Discretion #1 enforcement)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT break existing License + Status badge L6-7 | Reviewer diff: L6-7 unchanged; Sponsor badge appended L8 |
| MUST preserve existing Sponsor footer section L190-192 (not rewrite) | Reviewer diff: section header `## Sponsor / Co-maintainer` unchanged; content expanded additively |
| MUST cap README ≤ 200L hard (sister 6-phase 连续 hold) | Pre-commit `wc -l README.md` ≤ 200; mitigation if 201L: condense footer 7L → 6L |
| MUST cross-link FUNDING.yml + Sponsors URL + MAINTAINER-ONBOARDING + stale.yml + ISSUE_TEMPLATE | Reviewer grep: footer section contains all 5 references (FUNDING.yml indirectly via badge; Sponsors URL; MAINTAINER-ONBOARDING; stale.yml; ISSUE_TEMPLATE) |

[HIGH — shields.io badge URL pattern standard OSS convention; existing L190-192 expansion delta calculated exact; ≤200L hard cap mitigation hierarchy explicit]

---

## § 6 ISSUE_TEMPLATE form-based YAML 3-template (planner Discretion #3)

**Confidence: HIGH** — [CITED: docs.github.com/communities] form-based YAML schema verified; 3-template subset (bug + feature + question) minimum sufficient per R8.3 verb "issue/PR 模板标准化".

### 6.1 Template selection: 3-template + config.yml

| File | Purpose | Form fields | LOC est |
|------|---------|-------------|---------|
| `01-bug.yml` | Bug reports | title prefix + reproduce steps + expected/actual + env (OS/Node ver) + harnessed version + decision_rules.yaml routing | ~55L |
| `02-feature.yml` | Feature requests | problem statement + proposal + alternatives considered + R9.5 三问 (packaging vs PM / upstream solvable / one-time escape hatch) | ~45L |
| `03-question.yml` | Questions / usage help | question text + what was tried + cross-link to MAINTAINER-ONBOARDING | ~35L |
| `config.yml` | Template chooser config | `blank_issues_enabled: false` + 1-2 contact_links (Discussions if enabled OR README FAQ link) | ~12L |

**Total**: 4 files × ~37L avg = ~150L NEW surface across `.github/ISSUE_TEMPLATE/`.

**Filename prefix 01-/02-/03-**: per [CITED: docs.github.com/communities] "Filenames are sorted alphanumerically. Prefix names with numbers to control display sequence in the template chooser." Bug first (most common) → Feature → Question.

### 6.2 Bug template verbatim recipe (`01-bug.yml`)

```yaml
# .github/ISSUE_TEMPLATE/01-bug.yml
# Phase 4.2 R8.3 — issue template standardization (bug form)
# Form-based YAML per docs.github.com/communities 2026 best practice

name: Bug Report
description: Report a bug in harnessed CLI, workflows, or manifests
title: "[Bug]: "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out a bug report.
        For questions, see [docs/MAINTAINER-ONBOARDING.md](../../docs/MAINTAINER-ONBOARDING.md).

  - type: input
    id: harnessed-version
    attributes:
      label: harnessed version
      description: Output of `harnessed --version`
      placeholder: e.g., 0.4.0
    validations:
      required: true

  - type: dropdown
    id: os
    attributes:
      label: Operating System
      options:
        - Windows
        - macOS
        - Linux (Ubuntu/Debian)
        - Linux (other)
        - WSL2
    validations:
      required: true

  - type: input
    id: node-version
    attributes:
      label: Node.js version
      description: Output of `node --version` (must be ≥ 22)
      placeholder: e.g., 22.11.0
    validations:
      required: true

  - type: textarea
    id: reproduce
    attributes:
      label: Steps to reproduce
      description: Minimal reproduction steps
      placeholder: |
        1. Run `harnessed install ctx7`
        2. ...
        3. Observe error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual behavior
      description: Include error messages, stack traces, harnessed doctor output
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: Additional context
      description: routing decision context, harnessed doctor output, audit.log relevant entries (v0.4.3+)
```

**LOC**: ~60L total. Cross-OS dropdown + Node version validation + harnessed --version capture = quality bug reports without 重 friction.

### 6.3 Feature template verbatim recipe (`02-feature.yml`)

```yaml
# .github/ISSUE_TEMPLATE/02-feature.yml
# Phase 4.2 R8.3 — issue template standardization (feature request form)
# R9.5 三问 embedded to defend 范围蔓延

name: Feature Request
description: Request a new capability in harnessed
title: "[Feature]: "
labels: ["enhancement", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Before submitting, please check R9.5 范围蔓延防御 三问 below.
        See [.planning/ROADMAP.md](../../.planning/ROADMAP.md) for v1.0 拒绝清单.

  - type: textarea
    id: problem
    attributes:
      label: Problem statement
      description: What user pain are you trying to solve?
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: Proposed solution
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: What other approaches did you evaluate?

  - type: checkboxes
    id: r95-triage
    attributes:
      label: R9.5 范围蔓延防御 三问 (required)
      options:
        - label: This is a packaging/automation problem (NOT a project management problem solvable in docs)
          required: true
        - label: This cannot be solved by an upstream library (NOT a wrap of upstream API)
          required: true
        - label: A one-time escape hatch is NOT sufficient (this requires structural support)
          required: true
```

**LOC**: ~40L. R9.5 三问 checkboxes prevent "ship workflow X" requests that violate v1.0 拒绝清单.

### 6.4 Question template verbatim recipe (`03-question.yml`)

```yaml
# .github/ISSUE_TEMPLATE/03-question.yml
# Phase 4.2 R8.3 — issue template standardization (question form)

name: Question
description: Ask a question about harnessed usage
title: "[Question]: "
labels: ["question"]
body:
  - type: markdown
    attributes:
      value: |
        For getting started, see [docs/MAINTAINER-ONBOARDING.md](../../docs/MAINTAINER-ONBOARDING.md) 30-min Quickstart first.

  - type: textarea
    id: question
    attributes:
      label: Question
    validations:
      required: true

  - type: textarea
    id: tried
    attributes:
      label: What have you tried?
      description: Commands run, docs read, error messages seen

  - type: input
    id: harnessed-version
    attributes:
      label: harnessed version (if applicable)
      placeholder: e.g., 0.4.0
```

**LOC**: ~30L.

### 6.5 config.yml verbatim recipe

```yaml
# .github/ISSUE_TEMPLATE/config.yml
# Phase 4.2 R8.3 — template chooser config

blank_issues_enabled: false

contact_links:
  - name: Documentation (Onboarding + 30-min Quickstart)
    url: https://github.com/easyinplay/harnessed/blob/main/docs/MAINTAINER-ONBOARDING.md
    about: New contributor? Start here for dev environment setup and onboarding.

  - name: Roadmap + v1.0 拒绝清单
    url: https://github.com/easyinplay/harnessed/blob/main/.planning/ROADMAP.md
    about: Check the roadmap and 拒绝清单 before requesting new workflow types or wrappers.
```

**LOC**: ~12L. `blank_issues_enabled: false` enforces template usage (R8.3 80% adoption metric defender).

### 6.6 Sneak-block守门 enforcement (planner Discretion #3 + R8.3 verb)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST use `.yml` form-based (NOT `.md` classical) | Reviewer grep: `ls .github/ISSUE_TEMPLATE/*.md` = 0 files; `ls .github/ISSUE_TEMPLATE/*.yml` ≥ 3 files |
| MUST disable blank issues (R8.3 80% adoption defender) | Reviewer grep: `grep 'blank_issues_enabled: false' .github/ISSUE_TEMPLATE/config.yml` = 1 match |
| MUST cap each template ≤ 80L (Karpathy YAGNI; long forms = friction) | Pre-commit `wc -l .github/ISSUE_TEMPLATE/*.yml` per file ≤ 80 |
| MUST include cross-link to MAINTAINER-ONBOARDING in config.yml contact_links | Reviewer grep: `grep 'MAINTAINER-ONBOARDING' .github/ISSUE_TEMPLATE/config.yml` ≥ 1 match |

[HIGH — form-based YAML schema [CITED: docs.github.com/communities]; 3-template + config = standard GitHub OSS pattern; LOC per file ≤ 80 enforces YAGNI; R9.5 三问 checkboxes defend 范围蔓延 sister ROADMAP L227 verb]

---

## § 7 D-04 CadenceExpect implementation: two-clock semantic documentation

**Confidence: HIGH** — D-04 LOCKED HYBRID 2-week internal + 6-month organic external; documentation sites enumerated.

### 7.1 Two-clock semantic explanation

**Internal infra ship clock** (1 phase/day, sister Phase 4.1 ≤1 day track record):
- Phase 4.1 SHIPPED 2026-05-18 (1 day internal)
- Phase 4.2 SHIPPED 2026-05-18 target (1 day internal)
- Phase 4.3 SHIPPED 2026-05-19 target (1 day internal)
- **v0.4.0 milestone ship**: 2-3 days total (per ROADMAP L185 "2-3 周" upper bound but actually trending faster)

**External co-maintainer organic clock** (6 months, separate from milestone ship):
- Opens AFTER v0.4.0 ship (Phase 4.3 close 2026-05-19 target)
- Runs through 2026-11-19 (~6 months)
- Acceptance: ≥ 1 external PR merge during window
- Exit path: if 0 PR by 2026-11-19 → maintenance-only mode (no false pretense; per existing 50L stub § 招募窗口 verbatim)

### 7.2 Documentation reflection sites (planner W2 docs sync targets)

| Doc | Where to reflect | Reflection content |
|-----|------------------|-------------------|
| STATE.md | L23 "下一 phase" line | "下一 phase: Phase 4.3 plan-phase 启动 (v0.4.0 milestone close + R8.4 ADR 全集 + 路由透明度日志); 6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID)" |
| RETROSPECTIVE.md | Phase 4.2 milestone retrospective section | Two-clock semantic narrative: "Internal infra ship clock 1 phase/day verified Phase 4.1 + Phase 4.2; External co-maintainer recruitment 6-month organic clock OPENS post-v0.4.0 close; T3 risk surface explicit DEFERRED #BB ✅ RESOLVED via D-04 LOCK" |
| ROADMAP.md | v0.4.0 milestone description L185 | Add inline note: "(2-3 周 internal ship clock 已验证 Phase 4.1+4.2 ≤1 day each; external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5)" |
| MAINTAINER-ONBOARDING.md | § 招募窗口 existing section L10-14 UPDATE | Update "启动: v0.4 ship 时正式发布" → "启动: v0.4.0 ship 2026-05-19 (Phase 4.3 close); 6-month organic external clock; v0.4.1 milestone tag at 6-month window close" |

### 7.3 Sneak-block守门 enforcement (CONTEXT D-04 verbatim)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT fully FROZEN 6-month (违 ROADMAP 2-3 周 internal cadence) | Reviewer grep STATE.md/ROADMAP.md: ship cadence still 1 phase/day verbatim; no "6 月 freeze" literal |
| MUST NOT ACCELERATED 2-week external PR expect (忽视 T3) | Reviewer grep RETROSPECTIVE: "external PR expect" frame as 6-month organic window NOT 2-week target |
| MUST document BOTH clocks separately (T3 transparency) | RETROSPECTIVE Phase 4.2 section contains both literal phrases: "Internal infra ship clock" + "External co-maintainer organic clock" |

[HIGH — two-clock semantic verbatim derived from CONTEXT D-04 + R9.1 36% 掉队率 long-term framing; 4 documentation sites enumerated explicit per sister Phase 4.1 W2 5-doc sync precedent + 1 ONBOARDING update site]

---

## § 8 W0.1 #BA conditional D1 SIZE_LIMIT 200→150 round 2 re-evaluate

**Confidence: HIGH** — sister Phase 4.1 W0.5 DEFER path active (post-Phase 4.1 ship STATE 151L did NOT meet ≤140L threshold per W0.5 § 7.1 decision tree); Phase 4.2 W0.1 D2 cadence iter 3 trim verify if STATE post-trim ≤140L.

### 8.1 #BA carry-forward context (sister Phase 4.1 W0.5 DEFER path)

Per CONTEXT § W0 backlog L43 verbatim:
> "#BA Phase 4.1 W0 T0.3 DEFER D1 SIZE_LIMIT 200→150 round 2 tighten → **W0.1 FIRST TASK conditional** — post-Phase-4.1 ship STATE 151L; D2 cadence iter 3 trim Phase 4.0/4.1 narrative → RETROSPECTIVE; verify post-trim ≤140L → FLIP SIZE_LIMIT 200→150 / else DEFER #BA carry Phase 4.3+"

Note: CONTEXT mentions "Phase 4.0/4.1 narrative" but **Phase 4.0 NEVER EXISTED** (v0.3.0 closed Phase 3.4 → v0.4.0 opened Phase 4.1; no Phase 4.0). Trim scope = Phase 4.1 narrative ONLY. Planner Discretion #6 codifies this clarification.

### 8.2 Decision tree (W0.1 conditional execution)

```
W0.1 D2 iter 3 trim Phase 4.1 narrative → STATE.md post-trim wc -l
├── ≤ 140L → FLIP D1 SIZE_LIMIT 200→150 ✅ (≥10L headroom; safe round 2)
├── 141-150L → DEFER flip (insufficient headroom; #BA carry-forward Phase 4.3 W0)
└── > 150L → FLIP blocked + investigate Wave 0 trim sufficient? (re-evaluate D2 cadence pattern adequacy)
```

### 8.3 Estimated post-trim STATE.md size (W0.1 outcome projection)

Pre-trim: STATE.md = 151L (current verified bash).

Trim targets (W0.1 D2 cadence iter 3 scope; Phase 4.1 narrative only):
- `当前位置` block (L22-23) — Phase 4.1 long inline narrative → condense to 2-3L pointer ("Phase 4.1 SHIPPED 2026-05-18, see RETROSPECTIVE archive")
- `已完成 phase ship 历史` (L43) — keep Phase 4.1 row 1-line + archive marker for verbose narrative
- `各里程碑进度` L36 — keep table row 1-line, archive verbose status detail
- 关键决策记录 (L116-122) — Phase 4.1 D-01/D-02/D-03/D-04 rows + W0.1 STRATEGIC row if applicable → archive to RETROSPECTIVE

Estimated trim delta: ~12-18L removed from STATE.md (4-6 关键决策 rows + 1 long inline当前位置 + 各里程碑 row condense to 2-3L).

Post-trim STATE.md estimate: **151 - 14 = ~137L** ⇒ ≤140L ✅ ⇒ **W0.1 #BA flip safe HIGH confidence**.

### 8.4 1-line flip recipe (conditional execution)

`scripts/check-state-archive-stale.mjs` L12 current (per sister Phase 4.1 RESEARCH § 7.3 verbatim):

```javascript
const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry
```

W0.1 flip (if post-trim STATE ≤140L):

```javascript
const SIZE_LIMIT = 150 // Phase 4.2 W0.1 round 2 tighten — sister DEFERRED #BA resolve (W0.1 trim outcome STATE post-trim ≤140L verified pre-flip; Phase 4.1 W0.5 DEFER path resolved)
```

LOC delta: 0 (1-line value flip).

### 8.5 Pre-flight verify (3 rules must satisfy BEFORE flip)

Per sister Phase 4.1 RESEARCH § 6.2 verbatim — flip MUST be safe (no violation triggers CI fail post-flip):

| Rule | Pre-flight target | Pass condition |
|------|-------------------|----------------|
| Rule 1: STATE.md ≤ SIZE_LIMIT post-flip | ≤150L | post-trim ≤140L → ≤150L PASS |
| Rule 2: `关键决议 ship 总结` section count ≤ 1 | grep `^##.*关键决议.*ship.*总结` STATE.md | 0 matches expected (post-Phase 3.4 D-04 COLLAPSE precedent) |
| Rule 3: W-N errata / sister review M[1-9] 修正 literal 禁字面 | grep `W-[1-9]\s+errata\|sister\s+review\s+M[1-9]\s+修正` STATE.md | 0 matches expected (post-Phase 3.4 W0.1 D1 single-SoT institutionalize precedent) |

**Pre-flight gate**: planner W0.1 first sub-step = `node scripts/check-state-archive-stale.mjs` returns 0 violations BEFORE flip commit (defensive against accidental CI break).

### 8.6 Sneak-block守门 (W0.1 absorb)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST verify STATE.md ≤140L post-trim BEFORE flip | Pre-flight `wc -l .planning/STATE.md` ≤ 140 (planner W0.1 sub-step gate) |
| MUST defer flip if post-trim ≥141L (defensive #BA carry Phase 4.3) | Planner conditional: skip flip task + register DEFERRED #BA carry-forward Phase 4.3 W0 |
| MUST NOT skip W0.1 trim to game flip condition | W0.1 D2 cadence iter 3 trim is HIGH priority standing process (sister Phase 4.1 W0.3 iter 2 cadence延袭); skipping trim to avoid SIZE_LIMIT pressure undermines D2 |
| MUST fire as W0 FIRST TASK (sister CONTEXT L43 verbatim) | Planner orders W0.1 = task #1 in Wave 0 |

[HIGH — sister Phase 4.1 W0.2+W0.3 + Phase 3.4 W0.1 STRATEGIC cadence verified verbatim; pre-flight 3 rules grounded in sister Phase 4.1 RESEARCH § 6.2 verbatim; ~137L post-trim projection grounded in 151L baseline minus ~14L estimated trim scope]

---

## § 9 W2 ship cadence: sister Phase 4.1 W2 7-task subset reuse

**Confidence: HIGH** — sister Phase 4.1 W2 7-task verbatim cadence verified via recent commit log (df3265f / bfce4a3 / dbb4d93 / 3581ea3 / 271e78e visible in env gitStatus).

### 9.1 Phase 4.2 W2 ship task ordering (sister Phase 4.1 W2 verbatim subset reuse)

| Task | Sister Phase 4.1 W2 | Phase 4.2 W2 description |
|------|---------------------|--------------------------|
| W2.T2.1 | T2.1 STATE.md update (Phase 4.1 ship event) | **W2.T2.1** STATE.md update Phase 4.2 ship event + W0.1 D2 iter 3 trim Phase 4.1 narrative → RETROSPECTIVE + L23 下一 phase pointer Phase 4.3 |
| W2.T2.2 | T2.2 RETROSPECTIVE.md append (271e78e Phase 4.1 milestone 7-section + Next Phase Prep Notes) | **W2.T2.2** RETROSPECTIVE.md append Phase 4.2 milestone retrospective 7-section (sister format reuse) + § ARCHIVED FROM STATE — Phase 4.1 (W0.1 D2 cadence iter 3 absorb) + Next Phase Prep Notes Phase 4.3 |
| W2.T2.3 | T2.3 ROADMAP.md Phase 4.1 ✅ SHIPPED + v0.4.0 1/3 PROGRESS (3581ea3) | **W2.T2.3** ROADMAP.md Phase 4.2 ✅ SHIPPED + v0.4.0 milestone 2/3 PROGRESS (NOT 3/3 ARCHIVED — reserved Phase 4.3 close per sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭) |
| W2.T2.4 | T2.4 README.md L9 Status + L46-49 v0.4.0 status + Phase 4.1 row append (dbb4d93) | **W2.T2.4** README.md L9 Status freshness Phase 4.2 SHIPPED + v0.4.0 MILESTONE 2/3 PROGRESS + Phase 4.2 row append + L6-7 Sponsor badge add + L190-192 Sponsor footer EXPAND (per § 5) |
| W2.T2.5 | T2.5 PROJECT-SPEC.md L3 Status header + L6 下一步 (bfce4a3) | **W2.T2.5** PROJECT-SPEC.md L3 Status header Phase 4.2 SHIPPED literal + L6 下一步 Phase 4.3 |
| W2.T2.6 | T2.6 ci.yml VERIFY 0 diff sneak-block (df3265f) | **W2.T2.6** ci.yml VERIFY 0 diff sneak-block守门 (Phase 4.2 NO ADR added → no A7 iter; sister Phase 4.1 cadence延袭) |
| W2.T2.7 | T2.7 DOGFOOD-T2.X.md NEW 58L PASS 3/3 axes (df3265f) | **W2.T2.7** DOGFOOD-T2.X.md NEW ~55-60L PASS 3/3 axes (per § 13 axis recipe); 3-axis (A onboarding 100-150L EXPAND verify + B stale.yml workflow lints + C Sponsors badge link integrity) |
| W2.T2.8 baseline tag | (sister T2.7 included tag push step) | **W2.T2.8** single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push pending user explicit approval per CLAUDE.md commit safety; sister Phase 4.1 `v0.4.0-alpha.1-benchmark` LOCAL-only cadence延袭) |

### 9.2 Phase 4.2 W2 task count

**Sister Phase 4.1 W2 = 7 task** (6 atomic commits + 1 verify-only T2.6).
**Phase 4.2 W2 = 7-8 task** (sister 7 + 1 baseline tag step explicit; verify-only T2.6 still 0 commit).

**Net atomic commits W2**: 6 (T2.1-T2.5 + T2.7 DOGFOOD) + 1 baseline tag step = 6-7 atomic per W2.

### 9.3 Sneak-block守门 (Phase 4.2 W2 ship discipline)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT add NEW ADR Phase 4.2 (pure community infra publication NOT architectural decision; sister Phase 4.1 PATTERNS § 5 risk #3 mitigation延袭) | Reviewer grep: `git diff --name-only HEAD~10 HEAD docs/adr/` returns 0 new files Phase 4.2 W2 |
| MUST NOT archive milestone (v0.4.0 close = Phase 4.3) | Reviewer check: `.planning/milestones/v0.4.0-*.md` NOT created Phase 4.2 W2 |
| MUST hold A7 守恒 (ADR 0001-0017 0 diff) | T2.6 W2 ship-time verify `git diff adr-0017-accepted -- docs/adr/0017-*.md` 0 diff (§ 11) |
| MUST tag baseline `v0.4.0-alpha.2-community` LOCAL only NO push per CLAUDE.md commit safety | `git tag -l 'v0.4.0-alpha.2-community'` = 1 LOCAL post-Phase-4.2-ship; `git push origin v0.4.0-alpha.2-community` NOT executed without user approval |
| MUST NOT triple tag (no milestone close + no adr-NNNN-accepted) | Reviewer count: only 1 NEW tag `v0.4.0-alpha.2-community`; 0 triple tag push (sister Phase 4.1 single-baseline cadence延袭) |

[HIGH — sister Phase 4.1 W2 7-task verbatim cadence verified via gitStatus commit log (5 most recent commits all Phase 4.1 W2 visible); Phase 4.2 task derivation grounded in "no NEW ADR + no milestone close" subset; tag naming per CONTEXT § Discretion #4 explicit]

---

## § 10 biome preempt scope analysis (Phase 4.2 = no-op for non-TS surface)

**Confidence: HIGH** — Phase 4.2 touch surface = `.yml` + `.md` files only; biome scope = `.ts/.js/.mjs/.json`; no overlap.

### 10.1 Phase 4.2 touch surface enumeration

| File | Extension | biome scope? | biome preempt needed? |
|------|-----------|--------------|----------------------|
| `.github/FUNDING.yml` (NEW) | .yml | NO | NO |
| `.github/workflows/stale.yml` (NEW) | .yml | NO | NO |
| `.github/ISSUE_TEMPLATE/*.yml` (4 NEW) | .yml | NO | NO |
| `docs/MAINTAINER-ONBOARDING.md` (EXPAND) | .md | NO | NO |
| `README.md` (edit L6-7 + L190-192) | .md | NO | NO |
| `STATE.md` (W0.1 trim) | .md | NO | NO |
| `RETROSPECTIVE.md` (W2.T2.2 append) | .md | NO | NO |
| `ROADMAP.md` (W2.T2.3 mark) | .md | NO | NO |
| `PROJECT-SPEC.md` (W2.T2.5 L3 + L6) | .md | NO | NO |
| `scripts/check-state-archive-stale.mjs` (W0.1 conditional flip IF #BA path) | .mjs | YES | **YES if W0.1 flip path taken** |
| `.planning/phase-4.2/DOGFOOD-T2.X.md` (NEW) | .md | NO | NO |

### 10.2 Conditional biome preempt expectation

**If W0.1 #BA flip path taken** (post-trim STATE ≤140L): biome preempt MANDATORY before W0.1 commit per MEMORY `feedback_biome-preempt.md` 3 CI-red recurrences institutionalize.

**If W0.1 #BA DEFER path taken** (post-trim STATE 141-150L): NO `.mjs` edit → NO biome preempt needed for Phase 4.2 (entire phase = .yml + .md only, biome no-op).

### 10.3 Sneak-block守门

| Sneak-block | Enforcement |
|-------------|------------|
| MUST run biome preempt IF W0.1 flip path taken | Planner W0.1 conditional sub-step: "biome preempt before scripts/check-state-archive-stale.mjs commit IF flip path active" |
| MUST NOT skip biome under time pressure if .mjs touched | sister MEMORY 3 CI-red recurrences cited; planner reminds executor at W0.1 task spawn |
| MUST verify biome PASS in CI as fallback gate | ci.yml `pnpm lint` step catches any missed preempt (Phase 4.2 NO ci.yml edit so existing gate preserved) |

[HIGH — touch surface enumerated per W0/W1/W2 task inventory; biome scope verified against .biome.json convention (.ts/.js/.mjs/.json); conditional flip path explicit]

---

## § 11 A7 守恒 verify post-Phase 4.2 ship (ADR 0001-0017 main body 0 diff hold)

**Confidence: HIGH** — Phase 4.2 NO ADR added (pure community infra publication NOT architectural decision per sister Phase 4.1 cadence延袭).

### 11.1 A7 mechanism reuse (ci.yml unchanged Phase 4.2)

Per sister Phase 4.1 RESEARCH § 14.1 verbatim verified: ci.yml L65-100 step "A7 acceptance bar — ADR 0001-0017 main body 守恒" iterates over baseline tags `adr-0001-accepted` through `adr-0017-accepted` and runs `git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md"`; any non-empty diff = `::error::` + exit 1.

Phase 4.2 = NO ADR added → ci.yml A7 step UNCHANGED (still iterates 0001-0017; NO ADR 0018 reference).

### 11.2 Phase 4.2 W2 ship-time A7 verify (T2.6 verify-only task)

Per sister Phase 4.1 W2 T2.6 cadence (df3265f) — ci.yml VERIFY 0 diff sneak-block:

```bash
# Phase 4.2 W2 T2.6 verify (sister pattern)
git diff HEAD -- .github/workflows/ci.yml | wc -l
# Expected: 0 (Phase 4.2 NO ci.yml edit)

# A7 守恒 verify (sister T2.6 cadence)
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  if [ -n "$diff_out" ]; then
    echo "FAIL: ADR ${n} main body changed since adr-${n}-accepted tag"
    exit 1
  fi
done
echo "A7 ✅ ADR 0001-0017 main body unchanged post-Phase-4.2"
```

**Expected outcome**: 0 diff (Phase 4.2 docs/infra phase doesn't touch `docs/adr/*.md` or ci.yml).

### 11.3 Sneak-block守门 (A7 hold + NO ADR + NO ci.yml iter)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST NOT modify any existing ADR main body | Reviewer grep: `git diff --name-only HEAD~10 HEAD docs/adr/*-*.md` = 0 modified existing ADRs |
| MUST NOT add new ADR Phase 4.2 (R8.4 deferred Phase 4.3) | Reviewer check: `git diff --name-only HEAD~10 HEAD docs/adr/` = 0 new files |
| MUST NOT touch ci.yml Phase 4.2 (no A7 iter since no NEW ADR; sister Phase 4.1 T2.6 verify 0 diff cadence延袭) | T2.6 verify: `git diff HEAD -- .github/workflows/ci.yml` returns 0 lines |
| MUST verify A7 green in CI post-Phase-4.2-ship | CI run `A7 acceptance bar` step returns "A7 ✅ ADR 0001-0017 main body unchanged" |

[HIGH — A7 mechanism sister verbatim reuse; Phase 4.2 NO ADR + NO ci.yml touch → 0 diff expected; sister Phase 4.1 T2.6 verify-only pattern延袭]

---

## § 12 STRIDE threat model 7-node (Phase 4.2 docs/infra narrow attack surface)

**Confidence: MEDIUM** — Phase 4.2 attack surface narrow (community-facing docs + GitHub Actions config); 7 nodes grounded in actual surface; STRIDE compliance with sister Phase 4.1 RESEARCH § 16 7-node template.

### 12.1 STRIDE nodes for Phase 4.2

| # | Threat | STRIDE | Mitigation | Phase 4.2 specific? |
|---|--------|--------|-----------|---------------------|
| T1 | `.github/FUNDING.yml` repo permission tamper (attacker PR adding their own `github: attacker` key) | Spoofing (S) | Branch protection on main + CODEOWNERS rule for `.github/**`; reviewer must approve FUNDING.yml changes; verify `github:` key matches `easyinplay` post-merge | ✅ Phase 4.2 new |
| T2 | Issue template form-based YAML injection (attacker submits malformed YAML breaking template chooser) | Tampering (T) | GitHub server-side validates ISSUE_TEMPLATE YAML on PR; CI doesn't need separate gate (GitHub native); reviewer manual verify rendered template via PR preview | ✅ Phase 4.2 new |
| T3 | Sponsors transparency repudiation (sponsor claims donation, account denies receipt) | Repudiation (R) | GitHub Sponsors built-in receipt + transaction log (Sponsors dashboard); no harnessed-side mitigation needed (GitHub trusted infra); public Sponsors page lists active sponsors | ✅ Phase 4.2 new |
| T4 | Information Disclosure via issue template (PII leak in bug report) | Information Disclosure (I) | Bug template explicit "DO NOT include API keys/credentials" warning in markdown intro; sister CLAUDE.md MEMORY pattern延袭; reviewer triage scrub before label | ✅ Phase 4.2 new |
| T5 | Stale-bot DoS (attacker spams 1000 stale issues to trigger 1000 close operations → API rate limit exhaustion) | Denial of Service (D) | `operations-per-run: 30` actions/stale default rate limit; `exempt-issue-labels: pinned,security` prevents bulk-close of important issues; daily cron amortizes load | ✅ Phase 4.2 new |
| T6 | Elevation of Privilege via stale-bot permissions (stale workflow has `issues: write` + `pull-requests: write` — broader than needed) | Elevation (E) | `permissions:` block in stale.yml scoped to ONLY `issues: write` + `pull-requests: write` (NOT `contents: write` or `actions: write`); GitHub minimal-perms convention | ✅ Phase 4.2 new |
| T7 | Compliance (R8.2 + R8.3 + R8.5 acceptance verify gaps) | Compliance (C — meta-STRIDE) | DOGFOOD-T2.X.md 3-axis verify (per § 13): Axis A MAINTAINER-ONBOARDING 100-150L EXPAND + Axis B stale.yml workflow lints + Axis C Sponsors badge link integrity | ✅ Phase 4.2 new |

### 12.2 PLAN.md frontmatter STRIDE template (planner Wave B consumes)

```yaml
threat_model:
  - threat: FUNDING.yml repo permission tamper
    stride: S (Spoofing)
    mitigation: Branch protection + CODEOWNERS `.github/**` rule + reviewer verify github key matches easyinplay
  - threat: Issue template YAML injection
    stride: T (Tampering)
    mitigation: GitHub server-side ISSUE_TEMPLATE YAML validation + reviewer PR preview check
  - threat: Sponsors transparency repudiation
    stride: R (Repudiation)
    mitigation: GitHub Sponsors built-in receipt log; no harnessed-side mitigation needed
  - threat: Information disclosure via issue template (PII leak)
    stride: I (Info Disclosure)
    mitigation: bug.yml markdown intro explicit "DO NOT include credentials" warning + reviewer triage scrub
  - threat: Stale-bot bulk-close DoS
    stride: D (Denial of Service)
    mitigation: operations-per-run 30 default + exempt-issue-labels pinned/security defensive
  - threat: Stale-bot permissions over-scope
    stride: E (Elevation)
    mitigation: permissions block scoped issues:write + pull-requests:write only (NOT contents/actions)
  - threat: R8.2/R8.3/R8.5 acceptance gaps
    stride: C (Compliance meta)
    mitigation: DOGFOOD-T2.X.md 3-axis verify A (onboarding 100-150L) + B (stale.yml lints) + C (Sponsors badge link)
```

[MEDIUM — 7 nodes grounded in Phase 4.2 narrow attack surface (community docs + GitHub Actions config); each node tied to D-decision or W0/W1 task sneak-block守门; STRIDE classification follows sister Phase 4.1 § 16 pattern]

---

## § 13 DOGFOOD-T2.X.md 3-axis verify recipe (sister Phase 4.1 58L format reuse)

**Confidence: HIGH** — sister Phase 4.1 DOGFOOD-T2.X.md 58L 3-axis format verified via recent commit df3265f.

### 13.1 3-axis verify scope (Phase 4.2 anchor R8.2 + R8.3 + R8.5 each = 1 axis)

| Axis | Scope | Verify command/check | Pass criterion |
|------|-------|---------------------|----------------|
| **Axis A** — R8.2 MAINTAINER-ONBOARDING EXPAND verify | `wc -l docs/MAINTAINER-ONBOARDING.md` ≤ 150 + ≥ 100; section count ≥ 12 (8 existing + 4-6 NEW) | bash `wc -l + grep -c '^##' docs/MAINTAINER-ONBOARDING.md` | LOC 100-150 ✅ + section count ≥ 12 ✅ |
| **Axis B** — R8.3 stale.yml + issue templates verify | stale.yml YAML valid + actions/stale@v10 pin + 60+30 split semantic + 3 issue templates present + config.yml blank_issues_enabled false | bash `yq eval '.jobs.stale.steps[0].uses' .github/workflows/stale.yml` returns `actions/stale@v10`; `ls .github/ISSUE_TEMPLATE/*.yml \| wc -l` ≥ 4 (3 templates + 1 config); `grep 'blank_issues_enabled: false' .github/ISSUE_TEMPLATE/config.yml` matches | All checks pass ✅ |
| **Axis C** — R8.5 Sponsors badge + FUNDING.yml verify | FUNDING.yml exists + `github: easyinplay` 1-line; README badge URL valid + footer Sponsors section updated | bash `cat .github/FUNDING.yml \| grep '^github: easyinplay'` matches; `grep 'img.shields.io/github/sponsors/easyinplay' README.md` matches; `grep 'sponsors/easyinplay' README.md` ≥ 2 (badge + footer) | All checks pass ✅; **Note**: Sponsor button render on repo page requires user manual Sponsors account activation (external prereq, NOT Phase 4.2 verify) |

### 13.2 DOGFOOD-T2.X.md template (sister 58L format reuse)

```markdown
# Phase 4.2 DOGFOOD-T2.X (Wave 2 ship-time verify)

**Date**: 2026-05-18 (or actual Phase 4.2 ship date)
**Phase**: 4.2 (v0.4.0 milestone 2/3 PROGRESS)
**Anchors**: R8.2 + R8.3 + R8.5
**Verdict**: PASS 3/3 axes verified miss: none

---

## Axis A — R8.2 MAINTAINER-ONBOARDING.md EXPAND verify

**Bash check**:
```bash
wc -l docs/MAINTAINER-ONBOARDING.md
# Expected: 100-150 (D-01 hard cap; baseline 50L → +75L NEW sections)

grep -c '^## ' docs/MAINTAINER-ONBOARDING.md
# Expected: ≥ 12 (8 existing + 4-6 NEW)
```

**Outcome**: LOC = {actual}L ✅ in [100, 150]; section count = {actual} ≥ 12 ✅

**Sister-block守门 verify**:
- Single file (no ONBOARDING-QUICKSTART.md split) ✅
- Narrative + commands hybrid (not checklist-only) ✅
- Existing 8 sections preserved (additive expand verified via git diff) ✅

---

## Axis B — R8.3 stale.yml + issue templates verify

**Bash check**:
```bash
# stale.yml validation
test -f .github/workflows/stale.yml && echo "stale.yml present"
grep 'actions/stale@v10' .github/workflows/stale.yml
grep -E 'days-before-(issue|pr)-(stale|close)' .github/workflows/stale.yml | wc -l
# Expected: 4 (issue-stale + issue-close + pr-stale + pr-close)

# issue templates
ls .github/ISSUE_TEMPLATE/*.yml | wc -l
# Expected: ≥ 4 (3 templates + config.yml)
grep 'blank_issues_enabled: false' .github/ISSUE_TEMPLATE/config.yml
```

**Outcome**: stale.yml actions/stale@v10 pinned ✅; 60+30 split semantic ✅; 4 template files present ✅; blank_issues_enabled false ✅

---

## Axis C — R8.5 Sponsors badge + FUNDING.yml verify

**Bash check**:
```bash
# FUNDING.yml validation
cat .github/FUNDING.yml | grep '^github: easyinplay'
wc -l .github/FUNDING.yml
# Expected: ≤ 5 (1 directive + 2-3 comment per D-03 sneak-block)

# README badge + footer
grep 'img.shields.io/github/sponsors/easyinplay' README.md
grep -c 'sponsors/easyinplay' README.md
# Expected: ≥ 2 (badge L8 + footer L190+)
```

**Outcome**: FUNDING.yml `github: easyinplay` 1-line ✅; README badge URL valid ✅; footer Sponsors section EXPANDED ✅

**Note** (Axis C external prereq): Sponsor button render on https://github.com/easyinplay/harnessed page REQUIRES user manual Sponsors account activation at https://github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state). Phase 4.2 ships config; account activation = external user action OUTSIDE Phase 4.2 scope.

---

## Verdict

**PASS 3/3 axes verified miss: none**

D-01 + D-02 + D-03 + D-04 all activated; sneak-block守门 verified per axis; R8.2 + R8.3 + R8.5 acceptance bar满足 per axis check commands.

Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE pending user push approval per CLAUDE.md commit safety.
```

**LOC estimate**: ~55-60L (sister Phase 4.1 58L cadence).

[HIGH — sister Phase 4.1 DOGFOOD-T2.X.md 58L 3-axis format verbatim verified via gitStatus commit df3265f; Phase 4.2 3-axis derivation grounded in R8.2 + R8.3 + R8.5 anchor 1:1 mapping; external prereq note (Sponsors account activation) explicit per § 4.2]

---

## § 14 Phase 4.2 single-day ship plausibility (sister Phase 4.1 ≤1 day track record)

**Confidence: MEDIUM** — extrapolation from sister Phase 4.1 single-day ship (verified gitStatus) + Phase 4.2 scope ~50% smaller (3 NEW yml + 1 docs EXPAND + W0.1 conditional flip vs Phase 4.1 4 NEW + 4 W0 backlog).

### 14.1 Scope comparison Phase 4.1 vs Phase 4.2

| Dimension | Phase 4.1 | Phase 4.2 |
|-----------|-----------|-----------|
| W0 task count | 3 (W0.1 ENFORCE flip + W0.3 D2 iter 2 + W0.5 conditional D1) | 1-2 (W0.1 conditional D1 #BA only; W0.3 D2 iter 3 is W2 ship-time NOT W0) |
| W1 NEW files | 3 (v0.4.md 302L + e2e log 122L + CONTRIBUTING-BENCHMARK 30L) | 4-5 (FUNDING.yml + stale.yml + 3 ISSUE_TEMPLATE + 1 config.yml = 5-6 files) but each ≤ 60L (smaller per-file) |
| W1 docs EXPAND | 0 | 1 (MAINTAINER-ONBOARDING 50→125L) |
| W1 LOC delta NEW | ~454L | ~225L (35+50+55+40+30+12 = 222L mandatory + 75L EXPAND = ~300L total but multi-file fragmented vs Phase 4.1 monolithic 302L benchmark) |
| W2 ship cadence | 7-task | 7-8 task (sister + 1 baseline tag step) |
| W2 commits | 6 atomic | 6-7 atomic |
| NEW source code | 1-line `.mjs` flip (W0.1 conditional) | 1-line `.mjs` flip (W0.1 conditional IF flip path) OR 0-line (IF DEFER path) |
| NEW tests | 0 (docs phase) | 0 (docs/infra phase) |
| External dependencies | 0 (zero-dep e2e log) | 0 (actions/stale@v10 is GitHub Actions; no npm dep) |

### 14.2 Time estimate per Phase 4.2 wave

- W0 absorb: ~30-45 min (sister Phase 4.1 W0 ~1-2h; Phase 4.2 W0 narrower)
- W1 main scope: ~2-3 hours
  - MAINTAINER-ONBOARDING EXPAND ~45-60 min (~75L NEW prose, cross-link verify)
  - 4 ISSUE_TEMPLATE files ~45 min (~150L total YAML mostly boilerplate)
  - stale.yml ~15 min (verbatim recipe from § 3.1)
  - FUNDING.yml ~5 min (1L config + 2L comment)
  - README badge + footer ~15 min
- W2 ship: ~1-2 hours (sister 7-task verbatim subset reuse)
- **Total: ~4-6 hours = single-day ship HIGH plausibility**

### 14.3 Confidence boundary

| Confidence | Condition |
|-----------|-----------|
| HIGH single-day | All 4 D-decisions execute without ambiguity (sister cadence cleanly reused) + #BA conditional resolves cleanly (flip OR defer) + no upstream actions/stale@v10 breaking changes |
| MEDIUM single-day | Sponsors account activation user prereq not blocking (Axis C verify accepts external prereq deferral); if user not activated by ship time, T2.7 DOGFOOD passes with note |
| LOW single-day | Unlikely: only if MAINTAINER-ONBOARDING EXPAND requires multi-iteration prose review OR multi-tier Sponsors decision reopens mid-phase |

[MEDIUM — sister Phase 4.1 1-day track record verified gitStatus; Phase 4.2 scope smaller per § 14.1 dimension comparison; user prereq Sponsors account activation is sole MEDIUM-risk uncertainty (Axis C external)]

---

## § 15 Sister review preempt analysis (likely Phase 4.2 post-ship sister concerns)

**Confidence: MEDIUM** — extrapolation from sister Phase 4.1 sister-review pattern + Phase 4.2 specific subjective surfaces.

### 15.1 Likely sister review concerns (preempt mitigation in PLAN.md)

| # | Concern | Pre-empt mitigation |
|---|---------|--------------------|
| SR-1 | **MAINTAINER-ONBOARDING.md content quality (subjective)** — sister may critique "30-min quickstart steps too terse" or "ADR review checklist 5 points insufficient" | Planner Discretion: include explicit prose paragraphs per NEW section (not bare bullet lists); cite sister CONTRIBUTING.md L156-166 "How to add a doctor check" pattern as proof-of-narrative-rich precedent |
| SR-2 | **stale.yml first 90-day fire date narrative timing** — sister may ask "when does first stale fire? Today + 90 days?" | Planner pre-empt: PLAN.md include explicit note "First stale fire = Phase 4.2 ship date + 90 days (no existing 90-day-old issues at ship time per repo audit; first stale issue earliest 2026-08-16)" |
| SR-3 | **Sponsors landing page user manual prereq accountability** — sister may critique "Phase 4.2 ships config but Sponsor button doesn't render; not real ship" | Planner pre-empt: DOGFOOD-T2.X.md Axis C explicit external prereq note (per § 13 + § 4.2); RETROSPECTIVE notes "Sponsors infra SHIPPED Phase 4.2; account activation tracked separately in user TODO list" |
| SR-4 | **Issue template field over-specification** — sister may critique "bug.yml 60L too long for first-time contributor" | Planner pre-empt: each template ≤ 80L hard cap (per § 6.6 sneak-block); justify 60L bug.yml = OS + Node + version + reproduce + expected + actual + context = 7 essential fields × ~8L = 56L (acceptable) |
| SR-5 | **W0.1 #BA flip OR defer decision rationale transparency** — sister may ask "why did flip happen?" or "why did defer happen?" | Planner pre-empt: W0.1 commit message explicit "Phase 4.2 W0.1 #BA {FLIP|DEFER}: post-trim STATE {actual}L {≤140 → flip safe / 141-150 → defer #BA carry Phase 4.3}" |
| SR-6 | **CODEOWNERS for .github/ permission tamper STRIDE T1** — sister may ask "did Phase 4.2 add CODEOWNERS for .github/**?" | Planner pre-empt: NO — Phase 4.2 D-decisions don't include CODEOWNERS; defer to v0.4.3+ if real attack surface arrives (sister #AH defer pattern延袭); STRIDE T1 mitigation = branch protection on main (already in place per repo settings) |

### 15.2 Sneak-block守门 (preempt institutionalize)

| Sneak-block | Enforcement |
|-------------|------------|
| MUST address SR-1 with prose paragraphs not bare bullets | EXPAND sections have ≥ 1 prose intro paragraph per NEW section |
| MUST address SR-2 with explicit first-fire date | PLAN.md timeline section includes "First stale fire: ship_date + 90" |
| MUST address SR-3 with external prereq note | DOGFOOD Axis C + RETROSPECTIVE + STATE.md L23 下一 phase line all explicit |
| MUST address SR-4 with ≤ 80L per template | § 6.6 enforcement |
| MUST address SR-5 with conditional commit message clarity | W0.1 commit message template fixed |
| MUST address SR-6 with explicit defer note (not silent omission) | RETROSPECTIVE notes "CODEOWNERS deferred v0.4.3+ if attack surface arrives" |

[MEDIUM — extrapolation from sister review patterns; subjective concerns SR-1 + SR-4 are unavoidable LOW-risk subjective surfaces; SR-2 + SR-3 + SR-5 + SR-6 are objective and pre-emptable]

---

## § 16 Wave topology + task count estimate

**Confidence: MEDIUM** — task count grounded in sister Phase 4.1 14-task baseline + Phase 4.2 scope similar-or-smaller per § 14.1.

### 16.1 Wave breakdown (sister Phase 4.1 W0-W2 3-wave topology)

| Wave | Scope | Tasks | LOC delta est | Tests delta |
|------|-------|-------|--------------|-------------|
| **W0** backlog 1 项 absorb (conditional flip) | W0.1 #BA D1 SIZE_LIMIT 200→150 conditional flip (post-W2 trim outcome verify; could also be folded into W2 T2.1 STATE trim) | 0-1 atomic conditional | +0L (1-line value flip IF flip path; 0 IF defer path) | 0 NEW |
| **W1** main scope: 4-5 NEW .github/ files + 1 EXPAND MAINTAINER-ONBOARDING + README badge | T1.1 .github/FUNDING.yml NEW 3L + T1.2 .github/workflows/stale.yml NEW 45L + T1.3 .github/ISSUE_TEMPLATE/01-bug.yml NEW 60L + T1.4 .github/ISSUE_TEMPLATE/02-feature.yml NEW 40L + T1.5 .github/ISSUE_TEMPLATE/03-question.yml NEW 30L + T1.6 .github/ISSUE_TEMPLATE/config.yml NEW 12L + T1.7 docs/MAINTAINER-ONBOARDING.md EXPAND 50→125L (+75L) + T1.8 README.md L6-7 badge + L190-192 footer EXPAND (+4-5L) | 8 atomic | ~+265L NEW (3+45+60+40+30+12+75+5) | 0 NEW (docs/infra phase) |
| **W2** ship cadence (sister Phase 4.1 W2 7-task verbatim subset reuse) | T2.1 STATE.md update + W0.1 D2 iter 3 trim Phase 4.1 narrative + T2.2 RETROSPECTIVE.md append (Phase 4.2 milestone retrospective + § ARCHIVED FROM STATE — Phase 4.1) + T2.3 ROADMAP.md Phase 4.2 ✅ + 2/3 PROGRESS + T2.4 README.md L9 Status + Phase 4.2 row append + T2.5 PROJECT-SPEC.md L3 + L6 + T2.6 ci.yml VERIFY 0 diff sneak-block + T2.7 DOGFOOD-T2.X.md NEW 55-60L + T2.8 baseline tag `v0.4.0-alpha.2-community` LOCAL | 7-8 atomic (T2.6 verify-only NO commit; net 6-7 atomic commits) | ~+15-25L STATE delta (post-trim) + ~+30L RETROSPECTIVE append + ~+10-15L ROADMAP/README/PROJECT-SPEC + ~+60L DOGFOOD NEW | 0 NEW (docs sync) |

### 16.2 Total wave breakdown

- **3 wave** (sister Phase 4.1 3 wave 延续)
- **9-12 atomic task** (sister Phase 4.1 14 atomic; Phase 4.2 ≈ 65-85% scope per § 14.1)
- **~+340-380L docs+infra delta** (W1 ~265L NEW + W2 ~75L docs sync + DOGFOOD ~60L)
- **~+0L src delta** (W0.1 1-line value flip IF conditional flip; 0 IF DEFER path)
- **0 NEW src test fixture** (docs/infra phase)
- **0 NEW ADR** (R8.4 deferred Phase 4.3)
- **0 milestone close** (v0.4.0 close = Phase 4.3)
- **1 baseline tag** (`v0.4.0-alpha.2-community` LOCAL only NO push)

### 16.3 Wave 依赖 graph

```
W2.T2.1 STATE trim (W0.1 D2 cadence iter 3) ─┬─> W0.1 #BA conditional flip verify (≤140L)
                                              │
W0 (optional 1 atomic) ─────────────────────> │
                                              │
W1 (independent of W0; 8 atomic partial DAG) ─┤
   T1.1 FUNDING.yml (1 atomic standalone)     │
   T1.2 stale.yml (1 atomic standalone)       │
   T1.3-T1.6 ISSUE_TEMPLATE 4 files (parallel)│
   T1.7 ONBOARDING EXPAND (cross-link cite)   │
   T1.8 README badge + footer (deps T1.1+T1.7)│
                                              ▼
                                            W2 ship (7-8 atomic sequential)
                                              │
                                              ├─> W2.T2.1 STATE trim + 下一 phase pointer
                                              ├─> W2.T2.2 RETROSPECTIVE append
                                              ├─> W2.T2.3-T2.5 ROADMAP/README/PROJECT-SPEC sync
                                              ├─> W2.T2.6 ci.yml verify 0 diff
                                              ├─> W2.T2.7 DOGFOOD-T2.X.md verify 3/3 axes
                                              └─> W2.T2.8 baseline tag LOCAL
```

W0 is 0-1 atomic conditional (could fold into W2.T2.1). W1 is 8 atomic partial DAG (mostly parallelizable; T1.7 + T1.8 cross-link deps T1.1-T1.6). W2 is 7-8 atomic sequential per sister Phase 4.1 cadence.

### 16.4 Estimated total time

Per KICKOFF § 5 estimate + § 14.2 refinement:
- W0 absorb: ~15-30 min (W0.1 #BA conditional flip + pre-flight 3-rule verify)
- W1 main scope: ~2-3 hours
- W2 ship: ~1-2 hours
- **Total: ~4-6 hours = 0.5-1 day sister Phase 4.1 cadence延袭 (1 phase/day internal infra applicable)**

[MEDIUM — task count grounded in sister Phase 4.1 14 atomic + Phase 4.2 65-85% scope factor; 9-12 task estimate accounts for W1 file count variance (4-6 .github/ files) + W2 sister verbatim subset; time estimate matches sister Phase 4.1 1-day cadence延袭]

---

## § 17 Known unknowns + fallback strategies

**Confidence: HIGH** — list grounded in CONTEXT § Open implementation questions + W0 absorb plan + sister cadence verification points + external prereq surface.

### 17.1 Spike outcomes resolved this RESEARCH

| # | Question | Resolution |
|---|----------|-----------|
| 1 | `.github/` directory baseline state? | § 1.1 — `workflows/ci.yml + perf-bench.yml` only; ISSUE_TEMPLATE/ + FUNDING.yml NEW |
| 2 | MAINTAINER-ONBOARDING.md current size + section count? | § 1.2 — 50L 8-section verified verbatim |
| 3 | STATE.md current size for W0.1 baseline? | § 1.3 — 151L (#BA conditional flip pre-trim baseline) |
| 4 | actions/stale current major version? | § 0 + § 3.1 — v10 ([VERIFIED: github.com/actions/stale README v10.2.0 Feb 2026]); CONTEXT v9 reference outdated |
| 5 | FUNDING.yml path + syntax? | § 4.1 — `.github/FUNDING.yml` [CITED: docs.github.com/sponsors]; `github: USERNAME` minimum example |
| 6 | ISSUE_TEMPLATE form-based YAML schema? | § 6.1-6.5 — [CITED: docs.github.com/communities] 5 body types + config.yml + filename prefix ordering |
| 7 | README badge URL pattern? | § 5.1 — `https://img.shields.io/github/sponsors/{username}?logo=github&label=Sponsor` standard shields.io |
| 8 | stale.yml 60+30 vs 90+0 split semantic? | § 3.2 — 60+30 split per CONTEXT D-02 "mark stale at day 60 → close at day 90" verbatim |
| 9 | W0.1 #BA flip safety (pre-flight)? | § 8.5 — 3 rules check sister pattern延袭; pre-flight defensive gate |
| 10 | W0.1 post-trim STATE projection? | § 8.3 — ~137L (151L baseline - ~14L Phase 4.1 narrative trim) ≤140L → flip safe HIGH confidence |
| 11 | W2 ship cadence sister reuse? | § 9 — sister Phase 4.1 W2 7-task verbatim subset reuse; verified via gitStatus commit log |
| 12 | A7 守恒 post-Phase 4.2? | § 11 — 0 diff expected (docs/infra phase no ADR touch); no ci.yml A7 iter |
| 13 | STRIDE threat model nodes? | § 12 — 7 nodes grounded in Phase 4.2 attack surface (docs/infra narrow) |
| 14 | DOGFOOD 3-axis recipe? | § 13 — Axis A onboarding + Axis B stale.yml/templates + Axis C Sponsors badge |
| 15 | Wave topology + task count? | § 16 — 3 wave (W0-W2), 9-12 atomic, ~4-6 hours single-day |
| 16 | Phase 4.2 baseline tag literal? | § 9.1 W2.T2.8 + CONTEXT § Discretion #4 — `v0.4.0-alpha.2-community` |
| 17 | biome preempt scope? | § 10 — Phase 4.2 .yml + .md only → no-op for non-TS; conditional ONLY if W0.1 .mjs flip path taken |
| 18 | Single-day ship plausibility? | § 14 — MEDIUM (sister 1-day track + Phase 4.2 65-85% scope); HIGH if user prereq Sponsors account active |

### 17.2 Remaining unknowns (planner Wave B verifies at execution time)

| # | Question | Resolve at | Risk if Wrong | Fallback strategy |
|---|----------|-----------|---------------|-------------------|
| U1 | GitHub Sponsors account `easyinplay` Active state at Phase 4.2 ship time | Phase 4.2 ship verify | MEDIUM — if Pending Approval, Sponsor button won't render but FUNDING.yml committed forward-compatible | FALLBACK: ship FUNDING.yml + README badge + footer; DOGFOOD Axis C verifies infra (NOT button render); note external prereq in RETROSPECTIVE + STATE.md L23 user TODO |
| U2 | MAINTAINER-ONBOARDING EXPAND actual size post-write (estimate ~125L; cap ≤ 150L) | W1 T1.7 post-write verify | MEDIUM — if breach 150L, drop section F (Upstream Drift Monitoring) first (lowest acceptance value per § 2.2) | FALLBACK: drop section F → ~113L; OR drop section E (Manifest Schema SOP) → ~115L; keep A+B+C+D essential R8.2 verbs |
| U3 | STATE.md post-W0.1-trim actual size (estimate ~137L; flip condition ≤140L) | W2.T2.1 post-trim verify | MEDIUM — if 141-150L, DEFER W0.1 #BA flip per § 8.2 decision tree → carry Phase 4.3 W0 | FALLBACK: DEFER explicit + RETROSPECTIVE note "#BA carry-forward Phase 4.3 W0 LOW priority; Phase 4.2 SIZE_LIMIT 200 unchanged" |
| U4 | actions/stale@v10 cron timing observed first fire | Post-Phase-4.2 ship + 90 days (~2026-08-16) | LOW — no current 90-day-old issues; first fire = ship_date + 90 | FALLBACK: workflow_dispatch trigger allows manual test pre-90-day; OR adjust cron if first fire surfaces unexpected behavior |
| U5 | Issue template adoption rate (R8.3 80% target) | Post-Phase-4.2 ship + first external issue arrival | LOW — adoption is post-launch metric, NOT Phase 4.2 ship verify; metric tracked v0.5+ | FALLBACK: blank_issues_enabled: false in config.yml enforces template usage 100% (R8.3 80% defensively over-achieved by default) |
| U6 | Phase 4.2 ship single-day achievability | Phase 4.2 ship completion | MEDIUM — internal phase no external dep; if W1 file count slow (5 NEW yml + 1 EXPAND), split close to next day acceptable | FALLBACK: sister Phase 4.1 cadence延袭 ≤1 day; if breach, W1 split T1.1-T1.6 stand-alone (yml) + T1.7-T1.8 EXPAND/README batch follow-up |
| U7 | CODEOWNERS .github/** rule defer decision | Sister review post-ship surface | LOW — STRIDE T1 (FUNDING.yml repo tamper) currently mitigated by branch protection only; CODEOWNERS adds explicit reviewer | FALLBACK: defer to v0.4.3+ if real attack surface arrives; sister #AH defer pattern延袭 |

### 17.3 No blockers identified

No blocking unknowns; all 7 remaining unknowns are LOW/MEDIUM risk with viable fallback paths. Planner can proceed to Wave B with high confidence; user prereq Sponsors account activation (U1) is sole external surface but does NOT block infra ship.

[HIGH — 18 resolved + 7 remaining unknowns explicit; 3 highest-risk: U1 (Sponsors account activation external prereq) / U2 (ONBOARDING 150L cap) / U3 (STATE.md post-trim ≤140L flip condition); 3 fallback strategies pre-documented per remaining unknown]

---

## § 18 Assumptions Log

> Claims tagged `[ASSUMED]` in this research (planner + discuss-phase 需 user confirm before execution):

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub Sponsors account `easyinplay` exists or will be created/activated by user before Phase 4.2 ship time | § 4.2 + § 17 U1 | MEDIUM — FALLBACK: ship FUNDING.yml + badge anyway (forward-compatible); DOGFOOD Axis C verifies infra not button render; STATE.md L23 user TODO list captures activation as external action |
| A2 | Sponsors tier pricing lives in Sponsors dashboard UI (NOT in `.github/FUNDING.yml`) per § 4.3 | § 4.3 | LOW — if FUNDING.yml allows tier directives, planner discovers at W1 T1.1 and adjusts (current [CITED: docs.github.com/sponsors] examples show ONLY platform key, no tier syntax — assumption likely correct) |
| A3 | MAINTAINER-ONBOARDING EXPAND ~125L achievable preserving 8 existing sections + adding 6 NEW (estimate 50L + 75L = 125L) | § 2.2 + § 17 U2 | MEDIUM — if breach, drop section F first (Upstream Drift Monitoring lowest value); cap mitigation hierarchy explicit |
| A4 | STATE.md post-W0.1-trim ≈ 137L (≤140L flip safe) | § 8.3 + § 17 U3 | MEDIUM — if 141-150L, DEFER #BA flip → carry Phase 4.3; ~14L trim delta estimate grounded in Phase 4.1 narrative inventory; actual depends on RETROSPECTIVE absorb format |
| A5 | actions/stale@v10 stable through Phase 4.2 execution time (no breaking changes between v10.2.0 Feb 2026 and 2026-05-18 ship) | § 3.1 + § 17 U6 | LOW — GitHub Actions stale-bot mature; v10 major stable; if @v10 deprecated mid-phase, pin to @v10.2.0 explicit version |
| A6 | Phase 4.2 single-day ship achievable per sister Phase 4.1 ≤1 day cadence延袭 | § 14 + § 16.4 + § 17 U6 | MEDIUM — sister track record verified; Phase 4.2 scope smaller; SHipping infra W1 5 files + EXPAND fragmented vs Phase 4.1 monolithic — if slow, split acceptable |
| A7 | "Phase 4.0 NEVER EXISTED" clarification correct (v0.3.0 closed Phase 3.4 → v0.4.0 opened Phase 4.1 directly) | § 8.1 + Discretion #6 | LOW — verified ROADMAP L185-220 phase listing (no Phase 4.0 row); STATE.md L22-50 phase ship history (Phase 4.1 follows Phase 3.4 directly) |
| A8 | sister Phase 4.1 DOGFOOD-T2.X.md is 58L 3-axis format (per env gitStatus commit df3265f description) | § 13 | LOW — RESEARCH-source confidence; if format diverges, planner adapts 3-axis to actual sister L count without semantic change |

**All other claims verified or sister-cited** — 8 ASSUMED tags. Verifications:
- `.github/` directory inventory: bash ls 直证
- MAINTAINER-ONBOARDING.md 50L 8-section: bash wc -l + grep + L1-50 verbatim
- STATE.md 151L: bash wc -l 直证
- actions/stale@v10 current: [VERIFIED: github.com/actions/stale README]
- FUNDING.yml path + syntax: [CITED: docs.github.com/sponsors] verbatim
- ISSUE_TEMPLATE form-based YAML schema: [CITED: docs.github.com/communities] verbatim
- sister Phase 4.1 W2 7-task cadence: gitStatus commit log df3265f / bfce4a3 / dbb4d93 / 3581ea3 / 271e78e verbatim
- D-01~D-04 LOCKED decisions: CONTEXT.md L10-37 verbatim
- W0 backlog #BA-#BD-#AH carry-forward: CONTEXT.md L41-49 verbatim
- Sponsors dashboard tier separation: § 4.3 [ASSUMED — high-confidence inference from docs.github.com structure]

---

## § 19 Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | scripts/check-state-archive-stale.mjs (W0.1 conditional flip) | ✓ | ≥22 (package.json engines.node >=22.0.0) | — |
| pnpm | (no NEW Phase 4.2 pnpm action; existing CI lint gate fallback) | ✓ | 10.12.0 (packageManager) | — |
| git | tag local create + git diff verify | ✓ | bash verified | — |
| biome | preempt lint IF W0.1 .mjs flip path taken | ✓ | ^2.0.0 | — |
| **GitHub Sponsors account `easyinplay`** | R8.5 Sponsor button render on repo page (external prereq) | ⚠️ external (user-controlled) | (TBD user-side) | FALLBACK: ship FUNDING.yml + badge anyway (forward-compatible); DOGFOOD Axis C verifies config not button render; account activation = external user manual action OUTSIDE Phase 4.2 scope |
| **actions/stale@v10** | R8.3 stale-bot workflow | ✓ (GitHub Actions registry; no install) | v10.2.0 (Feb 2026 [VERIFIED]) | FALLBACK: pin to @v10.2.0 explicit if @v10 floating concern; older @v9 also works but CONTEXT explicit @v9 outdated |
| **GitHub Issue Forms feature** | R8.3 .github/ISSUE_TEMPLATE/*.yml form-based | ✓ (GitHub-native feature, generally available since 2022) | n/a | FALLBACK: revert to .md classical format if forms feature regression (unlikely) |
| **GitHub Sponsor button + FUNDING.yml feature** | R8.5 Sponsor button on repo page | ✓ (GitHub-native feature, GA since 2019) | n/a | — |

**Missing dependencies with no fallback**: None.
**Missing dependencies with viable fallback**: GitHub Sponsors account activation (user manual external action; ship infra forward-compatible).

Phase 4.2 is purely docs + GitHub native infra — **no NEW npm dep + no NEW Node-side code** (sister Phase 4.1 zero-dep cadence延续; D-decisions don't introduce build deps). All dependencies GitHub-platform-native (Sponsors / Issue Forms / Actions).

---

## § 20 Sources

### Primary (HIGH confidence)

- `.planning/phase-4.2/4.2-CONTEXT.md` L1-84 — 4 D-decisions LOCKED + W0 backlog + Discretion + Deferred verbatim
- `.planning/phase-4.2/4.2-KICKOFF.md` L1-77 — Phase scope + sister carry-forward + 4-question batch context
- `.planning/phase-4.1/RESEARCH.md` L1-1114 (chunked) — sister 22-section gold-standard template (100% format reuse target)
- `.planning/REQUIREMENTS.md` L303-307 (R8.2) + L309-313 (R8.3) + L321-325 (R8.5) — anchor 3 requirements verbatim
- `docs/MAINTAINER-ONBOARDING.md` L1-50 — existing v0.1 stub (D-01 EXPAND target preservation source-of-truth)
- `README.md` L1-196 — Status line L9 + badge block L6-7 + v0.4.0 status block L46-49 + Sponsor footer L190-192 verbatim
- `CONTRIBUTING.md` L1-200 — sister Karpathy ≤200L precedent + dev setup + commit/ADR rules (cross-link target from EXPAND ONBOARDING)
- `.planning/STATE.md` L1-151 — current state 151L (Phase 4.2 W0.1 #BA conditional baseline)
- `.planning/ROADMAP.md` L185-228 — v0.4.0 milestone scope verbatim + Phase 4.2 拆分 L216-218
- `PROJECT-SPEC.md` L1-40 (L3 Status header + L6 下一步 lines) — sister T2.5 docs sync site verified
- `.github/workflows/ci.yml` L1-309 — A7 守恒 step + 3 transparency/state-archive/provenance gates (T2.6 verify 0 diff target)
- `.github/workflows/perf-bench.yml` — nightly cron precedent for stale.yml cron pattern
- bash `ls -la .github/` 直证 NEW surface area (NO ISSUE_TEMPLATE/ + NO FUNDING.yml)
- gitStatus commit log df3265f / bfce4a3 / dbb4d93 / 3581ea3 / 271e78e — sister Phase 4.1 W2 7-task cadence verbatim verified

### Secondary (HIGH confidence — external authoritative)

- [CITED: docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository] FUNDING.yml path `.github/FUNDING.yml` + 12 platform key list + `github: USERNAME` minimum syntax + list-of-4 user support
- [CITED: docs.github.com/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository] ISSUE_TEMPLATE form-based YAML schema (name/description/body) + config.yml (blank_issues_enabled + contact_links) + 5 body types + filename prefix ordering
- [VERIFIED: github.com/actions/stale README] actions/stale@v10 current major (v10.2.0 Feb 2026) + days-before-issue-stale/close + stale-issue-message/close-issue-message + exempt-issue-labels + default cron `30 1 * * *` + operations-per-run 30 default

### Tertiary (MEDIUM confidence — projection/未 spike)

- MAINTAINER-ONBOARDING EXPAND ~125L estimate (§ 2.2) — arithmetic 50L baseline + 6 NEW × ~12L avg = ~125L; actual W1 write verifies
- STATE.md post-W0.1-trim ≈ 137L (§ 8.3) — projection grounded in 151L baseline minus ~14L Phase 4.1 narrative trim scope
- Phase 4.2 W1 task count 8 atomic (§ 16.1) — derived from sister Phase 4.1 5-7 W1 task subset adjusted for 4-6 NEW files
- Phase 4.2 ship single-day achievability (§ 14 + § 16.4) — sister Phase 4.1 1-day track record extrapolation
- Sponsors dashboard tier separation (§ 4.3) — inferred from docs.github.com FUNDING.yml example structure (only platform key shown, no tier directives in YAML examples)
- STRIDE 7-node Phase 4.2 attack surface (§ 12) — sister Phase 4.1 § 16 7-node pattern adapted to community-facing surface

---

## § 21 Metadata

**Confidence breakdown**:
- § 1 Baseline verify: HIGH — bash + grep direct verify
- § 2 D-01 EXPAND mapping: HIGH — existing 50L stub structure verbatim verified + R8.2 verb anchor + section count arithmetic
- § 3 D-02 stale.yml recipe: HIGH — actions/stale@v10 [VERIFIED] + 60+30 split CONTEXT D-02 verbatim
- § 4 D-03 FUNDING.yml: HIGH — [CITED: docs.github.com/sponsors] + user prereq external surface note
- § 5 README badge: HIGH — shields.io standard URL + L190-192 footer EXPAND delta arithmetic
- § 6 ISSUE_TEMPLATE: HIGH — [CITED: docs.github.com/communities] form-based YAML schema + 3-template selection rationale + R9.5 三问 checkboxes anchor
- § 7 D-04 two-clock: HIGH — CONTEXT D-04 verbatim derivation + 4 documentation site mapping
- § 8 W0.1 #BA conditional: HIGH — sister Phase 4.1 W0.5 DEFER path active + pre-flight 3-rule verify + decision tree explicit
- § 9 W2 ship cadence: HIGH — sister Phase 4.1 W2 7-task verbatim verified via gitStatus
- § 10 biome preempt: HIGH — touch surface enumerated; .yml + .md outside biome scope; conditional .mjs flip path explicit
- § 11 A7 守恒: HIGH — sister mechanism verbatim reuse; 0 diff expected docs/infra phase
- § 12 STRIDE 7-node: MEDIUM — narrow attack surface (community docs + Actions config); 7 nodes adapted from sister § 16 pattern
- § 13 DOGFOOD-T2.X.md: HIGH — sister Phase 4.1 58L 3-axis format verified via gitStatus df3265f
- § 14 Single-day plausibility: MEDIUM — sister track record extrapolation + scope comparison
- § 15 Sister review preempt: MEDIUM — extrapolation; subjective SR-1 + SR-4 unavoidable LOW-risk
- § 16 Wave topology: MEDIUM — sister 14-task baseline × 65-85% Phase 4.2 scope factor
- § 17 Known unknowns: HIGH — 18 resolved + 7 remaining LOW/MEDIUM with viable fallbacks; no blockers
- § 18 Assumptions log: HIGH — 8 ASSUMED tags explicit; mitigation/fallback per assumption

**Research date**: 2026-05-18
**Valid until**: ~2026-08-18 (Phase 4.2 ship + v0.4.0 milestone window; sister cadence stable within 1-quarter; actions/stale@v10 stable; GitHub Sponsors + Issue Forms features GA stable)

---

## RESEARCH COMPLETE
