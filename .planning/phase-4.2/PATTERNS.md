# Phase 4.2: co-maintainer onboarding + stale-bot + GitHub Sponsors — Pattern Map

> **Mapped**: 2026-05-18
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 13 NEW / MODIFY targets (per 4.2-CONTEXT 4 D-decisions + W0 backlog 1 项 conditional + W2 ship 6-doc cluster; NO ADR 0018 + NO A7 iter ci.yml this phase per CONTEXT scope = community infra publish NOT architectural decision)
> **Analogs found**: 13 / 13 (100% — sister Phase 4.1 14/14 + Phase 3.4 17/17 cadence延袭; W0+W2 cluster ≥95% reuse sister Phase 4.1 W2 verbatim 1:1 replicate; W1 main scope 3 NEW `.github/` infra files first-time surface ~30-55% reuse only — first community-infra publication phase in project history)
> **Style**: 沿袭 Phase 4.1 PATTERNS.md (386L 14 targets ~85% reuse 100% template reuse format; § 1 table + § 2 concrete excerpts + § 3 cross-cutting D-decisions守门 + § 4 reuse summary + § 5 path dependency)
> **Verified line counts (Bash 2026-05-18)**: STATE.md=151L (W0.5 conditional flip target post-D2 iter 3 trim) / RETROSPECTIVE.md=703L / README.md=196L / PROJECT-SPEC.md=447L / ROADMAP.md=373L / docs/MAINTAINER-ONBOARDING.md=50L (D-01 EXPAND target) / CONTRIBUTING.md=root-exists (sister dev-setup precedent NOT to duplicate) / .github/workflows/ci.yml=309L (T2.6 verify 0 diff NO A7 iter target) / Phase 4.1 DOGFOOD-T2.X.md=58L (DOGFOOD template) / .github/ISSUE_TEMPLATE/ + .github/FUNDING.yml + .github/workflows/stale.yml = NONE EXISTS (Phase 4.2 W1 inaugurates `.github/` community-infra NEW surface)

---

## § 1 NEW / MODIFY Targets → Existing Analog Mapping

| # | Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|--------|------|-----------|----------------|---------|---------------|
| **W0 prereq backlog (1 项 conditional carry-forward; 4 项 DEFER unchanged)** ||||||||
| 1 | `.planning/STATE.md` W0.1 D2 cadence iter 3 trim (Phase 4.0+4.1 narrative → RETROSPECTIVE.md) — sister CONTEXT § Open Q L60 "Phase 4.0 narrative AND/OR Phase 4.1 narrative" disambiguation: Phase 4.0 DOES NOT EXIST per Bash `ls .planning/phase-4.0` exit non-zero — therefore prev-prev-phase trim target = Phase 4.1 only (single-phase narrative archive, NOT 2-phase like sister Phase 3.4 W2 T2.2 + Phase 4.1 W0 T0.1 archive cadences) | docs / process | declarative | `.planning/phase-4.1/task_plan.md` W0 T0.1 (Phase 4.1 D2 cadence iter 2 archive Phase 3.3+3.4 narrative — 2nd-iter institutionalize verify M2 backlog discharge) + `.planning/STATE.md` L42 `<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md ... 2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 -->` archive comment pattern | **~92%** | **COPY-mechanical** Phase 4.1 W0 T0.1 archive sub-step 1:1 replicate with target swap: identify Phase 4.1 entry (L22+L43 area) in STATE.md → move verbatim to `.planning/RETROSPECTIVE.md` new section `## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0 D2 cadence iter 3, 2026-05-18)`; **NOTE Phase 4.0 absence disambiguation**: section header still says "Phase 4.0+4.1" per sister Phase 4.1 W0 T0.1 cadence affirm L640 "Next § ARCHIVED FROM STATE — Phase 4.0+4.1 will be created by Phase 4.2 ship-time per D2 standing process cadence iter 3" — header literal preserved for cadence consistency even though Phase 4.0 doesn't exist (Phase 4.0 was Phase 3.4→Phase 4.1 numeric skip, NOT a real phase); content section reflects Phase 4.1 only; **Acceptance**: `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1\|ARCHIVED FROM STATE — Phase 4.1" .planning/RETROSPECTIVE.md` exit 0 + `wc -l .planning/STATE.md` ≤ 200L baseline + `node scripts/check-state-archive-stale.mjs` exit 0 (W0.1 ENFORCE=true round 2 MUST pass post-archive — pre-flight verify per Phase 4.1 path-dep precedent) |
| 2 | `scripts/check-state-archive-stale.mjs` W0.2 conditional D1 SIZE_LIMIT 200→150 flip (DEFERRED #BA carry-forward) | CI gate / utility | batch (1-line config flip) | `scripts/check-state-archive-stale.mjs` L12 `SIZE_LIMIT = 200` current + Phase 4.1 W0.5 conditional D1 round 2 tighten DEFER path active (post-W0.3 STATE 143L→151L insufficient ≥10L headroom threshold) + sister Phase 2.2 W0 transparency gate ENFORCE=true flip 1-line cadence延袭 | **~95%** | **CONDITIONAL ADAPT** per CONTEXT W0 #BA: (a) IF W0.1 D2 iter 3 trim outcome holds STATE ≤140L → flip `SIZE_LIMIT = 200` → `SIZE_LIMIT = 150` 1-line surgical (sister Phase 4.1 W0.1 ENFORCE flip same-file delta pattern); (b) OTHERWISE DEFER → carry-forward Phase 4.3 W0 (sister Phase 4.1 W0.5 DEFER path precedent); **Path-dep STRICT**: W0.1 D2 iter 3 archive MUST ship FIRST (creates STATE ≤140L headroom) → W0.2 SIZE_LIMIT flip only if headroom verified; **Acceptance** if (a) path: `grep -q "SIZE_LIMIT = 150" scripts/check-state-archive-stale.mjs` exit 0 + `node scripts/check-state-archive-stale.mjs` exit 0 + `wc -l .planning/STATE.md` ≤ 150 |
| **W1 main scope (5 项 — Phase 4.2 anchors R8.2 + R8.3 + R8.5)** ||||||||
| 3 | `docs/MAINTAINER-ONBOARDING.md` D-01 EXPAND 50L → 100-150L production-ready (R8.2 anchor — "外部新人 30 分钟可跑通 dev 环境") | docs (process) | declarative (markdown narrative + commands hybrid) | 现 `docs/MAINTAINER-ONBOARDING.md` 50L v0.1 stub (additive expand preserve existing content per D-01 LOCKED) + `CONTRIBUTING.md` root (existing dev-setup precedent — Prerequisites + Setup + Windows Workaround) + `docs/INSTALLER-CONTRACT.md` (sister docs/ category structural reference) | **~70%** | **ADDITIVE EXPAND** per D-01 LOCKED sneak block "NO split into multiple files (single ONBOARDING.md SoT); NO checklist-only format (lose narrative context for 新人)" — preserve existing 50L verbatim (目标 / 招募窗口 / Co-maintainer 角色定位 / 必读文档 / v0.4 启动前 TODO / 风险 / References) + add 5-6 NEW sections covering R8.2 30-min quickstart spec: (a) §「Dev environment setup」 (Node ≥22 + corepack + clone + install + first test cycle — reference CONTRIBUTING.md NOT duplicate per Karpathy DRY; ~15L); (b) §「Commit conventions」 (Conventional Commits format + Karpathy ≤200L hard + biome preempt warning + 5-recurrence terminus 续 reference — ~10L); (c) §「ADR review checklist」 (9 章节 errata format + sister A7 守恒 ADR 0001-0017 main body 0 diff + REQ-ID anchor + sister Phase 3.4 W2 T2.7 iter 1-0017 cadence延袭 — ~15L); (d) §「Cross-OS CI maintenance」 (.github/workflows/ci.yml ubuntu+macos+windows matrix + Win sentinel fixture + RESEARCH-guided port=0 ephemeral pattern + sister Phase 2.4 W4 Win 3-tier 8s waitFor — ~15L); (e) §「Manifest schema 守门」 (ADR 0001 v1 frozen + ADR 0007 errata + schemaVersion 13-surface registry + colocation domain rule — ~10L); (f) §「Upstream drift monitoring」 (versions/<harnessed-ver>-known-good.yaml lazy lock per Phase 3.3 D-03 + sister manifest churn signal heuristics — ~10L); **D-01 sneak block守门**: (1) NO split into multiple files (single SoT); (2) NO checklist-only format (lose narrative context — hybrid commands + narrative required); (3) NO redundant copy from CONTRIBUTING.md (reference link only per Karpathy DRY); **Karpathy hard limit ≤150L doc clean per CLAUDE.md** (50L stub + ~75-95L new sections = ~125-145L well within ≤150 hard); **Acceptance**: `wc -l docs/MAINTAINER-ONBOARDING.md` ≥ 100 AND ≤ 150 + `grep -c "^## " docs/MAINTAINER-ONBOARDING.md` ≥ 10 (preserve 7 + add 5-6) + `grep -q "Dev environment\|Commit conventions\|ADR review\|Cross-OS CI\|manifest schema\|Upstream drift" docs/MAINTAINER-ONBOARDING.md` (R8.2 6-section coverage check) |
| 4 | `.github/FUNDING.yml` NEW (~5-8L D-03 LOCKED single tier $1+ minimal Karpathy YAGNI — R8.5 anchor "Sponsors 链接公开 + 可接受捐赠") | config (GitHub native) | declarative | NO `.github/FUNDING.yml` exists (Bash verified — first GitHub Sponsors config in project history) + sister minimal-surface config pattern: `versions/0.3.0-known-good.yaml` 8-entry single-line config (Phase 3.3 W1 T0.4 YAML lazy load pattern) + `.gitignore` root single-key declarative pattern | **~30%** | **NEW surface — no direct project analog** (community-infra `.github/` first-time inhabitant); pattern source = GitHub Sponsors official schema (`github: <username>` single-key minimal config; multi-key support for patreon/open_collective/custom DEFER per D-03 sneak block "NO multi-tier pricing definition pre-v1.0"); **ADAPT** per D-03 LOCKED single-line config: `github: easyinplay` (project memory `currentDate` confirmed user GitHub handle `easyinplay@gmail.com` → username inferred `easyinplay`); **D-03 sneak block守门**: (1) NO multi-tier 3-level ($5/$25/$100) pricing definition (Patreon-style pricing-design overhead); (2) NO link-only no-tier (违反 "可接受捐赠" verb literal); (3) NO `custom:` array URL (sister Karpathy YAGNI — defer until community signal post-launch); **Karpathy YAGNI hard**: ≤8L total (key-value 1-line + 4-7L header comment explaining D-03 LOCKED rationale + Phase 4.2 ship reference); **Acceptance**: `test -f .github/FUNDING.yml` exit 0 + `grep -q "^github: easyinplay" .github/FUNDING.yml` exit 0 + `wc -l .github/FUNDING.yml` ≤ 8 + `node -e "import('js-yaml').then(y=>console.log(y.load(require('fs').readFileSync('.github/FUNDING.yml','utf8'))))"` valid YAML parse |
| 5 | `.github/workflows/stale.yml` NEW (~40-60L D-02 LOCKED 90-day issue+PR auto-close — R8.3 anchor "stale-bot 自动关闭 90 天无活动 issue") | CI workflow (GitHub native) | event-driven (cron schedule + stale-action invoke) | NO `.github/workflows/stale.yml` exists (Bash verified — first community stale-bot config in project history) + sister `.github/workflows/ci.yml` 309L (GitHub Action workflow structural precedent — name/on/jobs/steps schema) + `.github/workflows/perf-bench.yml` 1339-byte (sister 短 workflow precedent — Phase 2.3 M3 perf gate nightly cron) | **~55%** | **NEW surface — partial reuse from ci.yml + perf-bench.yml structural template**: pattern source = official `actions/stale@v10` GitHub Action (most widely deployed stale-bot config — Karpathy "use what 90% projects use" 默认); **ADAPT** per D-02 LOCKED: (a) trigger `on: schedule: cron: '0 0 * * *'` (daily 00:00 UTC per CONTEXT § Open Q L57 default — fast feedback) OR `'0 0 * * 1'` (weekly Monday — defer to planner Discretion if cron cost concern; daily default lock); (b) job `stale:` `runs-on: ubuntu-latest` `permissions: issues: write + pull-requests: write` (minimal scope per Karpathy least-privilege); (c) step `uses: actions/stale@v10` (pin major version per A7 守恒 spirit but NOT main-body — workflow files NOT subject to A7) `with:` `days-before-stale: 60` (warning at day 60 per CONTEXT D-02 progressive escalation) `days-before-close: 30` (close at day 90 = 60+30 per R8.3 spec verbatim) `stale-issue-message: "..."` (friendly + reference docs/MAINTAINER-ONBOARDING.md for revival path) `stale-pr-message: "..."` (per D-02 issue+PR scope LOCK) `stale-issue-label: 'stale'` + `stale-pr-label: 'stale'` `exempt-issue-labels: 'pinned,security,good-first-issue'` (sister Karpathy "good first issue" 标签清单 ≥5 per MAINTAINER-ONBOARDING.md L38 v0.4 TODO) `exempt-pr-labels: 'pinned,security'` (PR exemption symmetric); **D-02 sneak block守门**: (1) NO 60-day stricter total (risks 埋没 new contributor issues); (2) NO 120-day lenient total (违 R8.3 90-day spec); (3) BOTH issue + PR scope (NOT issue-only — avoid zombie PRs); **Karpathy YAGNI**: ≤60L total (workflow boilerplate ~15L + actions/stale@v10 with-block ~25L + header comment ~10L); **Acceptance**: `test -f .github/workflows/stale.yml` exit 0 + `grep -q "actions/stale@v10" .github/workflows/stale.yml` exit 0 + `grep -q "days-before-stale: 60" .github/workflows/stale.yml` exit 0 + `grep -q "days-before-close: 30" .github/workflows/stale.yml` exit 0 + `wc -l .github/workflows/stale.yml` ≤ 60 + GitHub Action lint pass (warmup dry-run on next PR) |
| 6 | `.github/ISSUE_TEMPLATE/{bug,feature,question}.yml` NEW × 3 files (~30-50L each = ~90-150L total D-03 supporting infra — R8.3 anchor "issue templates" sister `stale-bot + issue templates` pair convention) | config (GitHub native) | declarative (yml form-based) | NO `.github/ISSUE_TEMPLATE/` exists (Bash verified — first issue template dir in project history) + sister CONTEXT § Open Q L58 "*.yml form-based modern preferred for structured user input GitHub native" lock + `CONTRIBUTING.md` root (existing structural reference for "manifest 提交" + "findings 文档化" — sister contributor-facing docs cluster) | **~40%** | **NEW surface — partial reuse from CONTRIBUTING.md structure + GitHub yml form schema**: pattern source = GitHub official Issue Forms schema (yml-based form `name: + description: + labels: + body: [- type: markdown/input/textarea/dropdown]` structure); planner Discretion CONTEXT § Open Q L58 LOCK = yml form-based (NOT classical .md) for structured input (3 fields per template: description + reproduction + environment); **ADAPT** 3 templates per CONTEXT § scope R8.3 verbatim — (a) `bug.yml` ~30-40L (title prefix "[BUG]" + steps to reproduce textarea + expected vs actual + environment dropdown (Node ver / OS) + harnessed version input + label `bug` auto-apply + assignees-empty); (b) `feature.yml` ~30-40L (title prefix "[FEAT]" + motivation textarea + proposed API/UX textarea + alternatives considered + label `enhancement` auto-apply + Karpathy YAGNI tip in header markdown — "请先确认非 v1.0+ DEFER 议题 per ROADMAP § v1.0 前拒绝清单"); (c) `question.yml` ~25-30L (title prefix "[Q]" + question body textarea + checked docs/MAINTAINER-ONBOARDING + CONTRIBUTING references + label `question` auto-apply + redirect to GitHub Discussions if applicable per Karpathy "use the right venue"); **D-03 supporting infra sneak block守门**: (1) yml form-based NOT classical .md (CONTEXT § Open Q L58 lock); (2) 3 templates (bug + feature + question) NOT 5+ (Karpathy YAGNI — defer good-first-issue + security templates v0.5+ if signal); (3) auto-apply labels REQUIRED (workflow integration with stale.yml exempt-labels — `pinned` + `security` + `good-first-issue` need pre-existing labels via repo settings post-merge); **Karpathy hard limit ≤150L total** (3 templates × ~40-50L each); **Acceptance**: `test -d .github/ISSUE_TEMPLATE` exit 0 + `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` = 3 + `grep -l "labels:" .github/ISSUE_TEMPLATE/*.yml | wc -l` = 3 (auto-label all 3) + GitHub Issue Forms schema validation (warmup on first issue post-merge) |
| 7 | `README.md` Sponsors badge insertion + Phase 4.2 ship coverage (CONTEXT § Open Q L56 site choice planner Discretion — recommend top header next to L6 License + L7 Status badges per minimal-surface convention) | docs | declarative | `README.md` L6 `[![License: Apache-2.0]...](./LICENSE)` + L7 `[![Status]...](./.planning/ROADMAP.md)` badge cluster precedent (2-badge group) + `.planning/phase-4.1/task_plan.md` W2 T2.4 README L9 STATUS_MARKER 续编 pattern延袭 | **~85%** | **REUSE BADGE CLUSTER** + ADAPT NEW Sponsors badge inserted at L8 (next to existing 2-badge cluster — minimal surface convention per Karpathy DRY): `[![GitHub Sponsors](https://img.shields.io/github/sponsors/easyinplay?label=Sponsor&logo=GitHub)](https://github.com/sponsors/easyinplay)` (shields.io standard sponsors badge — auto-pulls count from FUNDING.yml github: key — zero maintenance per Karpathy YAGNI); **NO footer Sponsors section** (CONTEXT § Open Q L56 site choice — top header more discoverable + minimal surface; defer footer expansion v0.5+ if community signal); **W2 Phase 4.2 ship 续编** also REUSE sister Phase 4.1 W2 T2.4 STATUS_MARKER path延袭 (L9 status freshness + Phase 4.2 row append + v0.4.0 2/3 PROGRESS marker NOT yet 3/3 ARCHIVED — reserved Phase 4.3); **Acceptance**: `grep -q "sponsors/easyinplay" README.md` + `grep -q "Phase 4.2" README.md` + `grep -q "v0.4.0.*2/3" README.md` + `node scripts/check-transparency-verdicts.mjs` exit 0 (FRONT_MATTER_DOCS freshness gate post-MODIFY pass) |
| **W2 ship (6 项 — sister Phase 4.1 W2 6-doc cluster延袭; NO ADR 0018 + NO A7 iter ci.yml + NO triple tag — single baseline tag `v0.4.0-alpha.2-community`)** ||||||||
| 8 | `.planning/STATE.md` 续编 Phase 4.2 SHIPPED event log + 当前位置 块 v0.4.0 2/3 PROGRESS + W0.1 D2 cadence iter 3 trim Phase 4.1 → RETROSPECTIVE | docs | declarative | `.planning/phase-4.1/task_plan.md` W2 T2.1 (sister Phase 4.1 W2 STATE.md 续编 + 当前位置 update + W0 D2 ship-time T6.N cadence 2nd-iter) + `.planning/STATE.md` L22-43 current state | **~95%** | **COPY-mechanical** Phase 4.1 W2 T2.1 全 4-step structure 1:1 replicate with content swap: (1) append 已完成 phase ship 历史 17th entry: `Phase 4.2 SHIPPED ✅ (2026-05-18) — co-maintainer onboarding + stale-bot + GitHub Sponsors (docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 + .github/FUNDING.yml NEW D-03 single tier + .github/workflows/stale.yml NEW D-02 90-day issue+PR + .github/ISSUE_TEMPLATE/{bug,feature,question}.yml NEW × 3 + README Sponsors badge insertion + W0.1 D2 cadence iter 3 institutionalize Phase 4.1 → RETROSPECTIVE + W0.2 conditional SIZE_LIMIT 200→150 #BA RESOLVED OR DEFER #BA→Phase 4.3 W0) + v0.4.0 milestone 2/3 PROGRESS (next: Phase 4.3 audit log + ADR 全集 + v1.0-RC close)`; (2) update 当前位置 block: GSD phase chain prepend Phase 4.2 SHIPPED marker; 当前里程碑 update v0.4.0 milestone 2/3 (next Phase 4.3); 状态 Phase 4.2 SHIPPED + Wave 0+1+2 ship + baseline tag v0.4.0-alpha.2-community; (3) W0.1 D2 ship-time T6.N cadence 3rd-IMPLEMENTATION (verify D2 stable 3-iter beyond 2-iter M2 backlog discharge): Move Phase 4.1 entry verbatim to `.planning/RETROSPECTIVE.md` new section `## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0 D2 cadence iter 3, 2026-05-18)` — section header preserves "Phase 4.0+4.1" literal per sister Phase 4.1 W0 T0.1 cadence affirm L640 (Phase 4.0 absence disambiguated in section body, NOT header); (4) Verify post-archive STATE.md ≤ (150 if W0.2 flip path else 200); **Acceptance** sister Phase 4.1 W2 T2.1 mirror: `grep -q "Phase-4.2-SHIPPED" .planning/STATE.md` + `grep -q "v0.4.0-2/3\|v0.4.0 2/3" .planning/STATE.md` + `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1\|ARCHIVED FROM STATE — Phase 4.1" .planning/RETROSPECTIVE.md` + `wc -l .planning/STATE.md` ≤ (150 if W0.2 flip else 200) + `node scripts/check-transparency-verdicts.mjs` exit 0 + `node scripts/check-state-archive-stale.mjs` exit 0 |
| 9 | `.planning/RETROSPECTIVE.md` 续编 Phase 4.2 milestone retrospective entry 7-section + receive W0.1 D2 auto-archive Phase 4.0+4.1 narrative | docs | declarative | `.planning/phase-4.1/task_plan.md` W2 T2.2 (sister Phase 4.1 W2 RETROSPECTIVE.md 续编 6-section + bonus Next Phase Prep Notes 7-section + receive D2 archive) + `.planning/RETROSPECTIVE.md` 703L current state | **~92%** | **COPY-mechanical** Phase 4.1 W2 T2.2 全 6-section + bonus Next Phase Prep Notes = 7-section format 1:1 replicate with content swap: (1) § What worked: D-01 EXPAND 50L stub additive preserve 0-rewrite-risk + D-02 90-day issue+PR sister GitHub default convention 默认 + D-03 single tier $1+ Karpathy YAGNI 反"pricing-design overhead" 诱惑 + D-04 HYBRID 2-week internal + 6-month organic external 双时钟 reconcile + W0.1 D2 cadence iter 3 stable (M2 discharge pattern 第 3 次 fires institutionalize confirm); (2) § What was inefficient: 3 NEW `.github/` files first-time inhabitant ~30-55% reuse 主导 W1 ~50% weighted avg (sister Phase 4.1 70% benchmark publish first-time surface 类似 cost); (3) § Patterns established: 8-phase 连续 deferred-items → next phase W0 一次根治 cadence 长效 (Phase 3.3 → 3.4 → 4.1 → 4.2 = 4 phase consecutive) + D2 cadence 第 3 次 fires (1st Phase 3.4 + 2nd Phase 4.1 + 3rd Phase 4.2 = stable institutionalize ≥3-iter); (4) § Cost patterns: Phase 4.2 内部 phase 1 day cadence延袭 (T3 external dependency = co-maintainer 招募 6-month 真正 clock separate per D-04 HYBRID — DOES NOT count v0.4.0 ship timeline); (5) § Key lessons: (i) D-01 ADDITIVE EXPAND > FULL REWRITE when stub content quality acceptable (0-day overhead + preserve audit history); (ii) D-03 single tier $1+ Karpathy YAGNI > multi-tier pre-v1.0 (pricing-design overhead要 community signal — NOT data pre-launch); (iii) D-04 HYBRID 2-clock reconcile pattern 用于 external-dependency phase (sister T3 cadence resolution after Phase 4.1 raise — institutionalized for v0.5+ external dependency phases); (6) § Cross-milestone trends: v0.4.0 第 2 phase 续延 v0.3.0 + Phase 4.1 同日 cadence延袭 (sister 5-phase consecutive 1-day ship cadence从 Phase 3.4 起 4-day streak); W0.1 D2 cadence iter 3 verify stable (≥3-iter pattern terminus signal — sister 5-recurrence terminus 类似 institutionalize 标准); (7) § Next Phase Prep Notes (Phase 4.1 W2 T2.2 bonus 7-section延袭): Phase 4.3 = v1.0-RC close phase R8.1 audit log + R8.4 ADR 全集 + milestone close 3-file archive triplet + 🎯 v0.4.0 milestone close triple tag (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0 sister v0.3.0 close cadence延袭); **Receive W0.1 D2 auto-archive**: accept Phase 4.0+4.1 narrative section moved STATE → RETRO per D2 cadence 3rd-iter as `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section; **Acceptance** sister Phase 4.1 W2 T2.2 mirror: `grep -q Phase-4.2 .planning/RETROSPECTIVE.md` + 7 NEW sections + `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1\|ARCHIVED FROM STATE — Phase 4.1" .planning/RETROSPECTIVE.md` exit 0 |
| 10 | `.planning/ROADMAP.md` Phase 4.2 ✅ SHIPPED + v0.4.0 milestone 2/3 progress marker (sister L185 v0.4.0 progress + L216 Phase 4.2 entry update; NOT yet 3/3 ARCHIVED) | docs | declarative | `.planning/phase-4.1/task_plan.md` W2 T2.3 (sister Phase 4.1 W2 ROADMAP.md 续编 + Phase X.Y ✅ SHIPPED marker + milestone progress update) + `.planning/ROADMAP.md` L216-218 Phase 4.2 entry pre-shipped state | **~98%** | **COPY-mechanical** Phase 4.1 W2 T2.3 1:1 replicate with content swap: (1) Mark Phase 4.2 entry L216-218 area as `✅ SHIPPED (2026-05-18)` + brief outcome summary (sister Phase 4.1 L210-215 verbose 5-bullet format延袭); (2) Update v0.4.0 milestone progress L185 (currently 1/3 → 2/3 post-Phase-4.2-ship; sister L130 v0.3.0 progress pattern延袭 — note v0.4.0 NOT yet ARCHIVED until Phase 4.3 close); (3) Add Phase 4.3 next phase kickoff reference (R8.1 audit log + R8.4 ADR 全集 + v1.0-RC close per CONTEXT carry — already L219-221); **NO new ARCHIVED marker** (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED reserved for milestone close = Phase 4.3 ship per sister v0.3.0 close cadence); **Acceptance**: `grep -q "Phase 4.2.*✅ SHIPPED" .planning/ROADMAP.md` + `grep -q "v0.4.0.*2/3" .planning/ROADMAP.md` exit 0 |
| 11 | `README.md` L9 Status freshness + Phase 4.2 row append + v0.4.0 2/3 marker (FRONT_MATTER_DOCS transparency gate; Sponsors badge insertion combined with target #7 W1) | docs | declarative | `.planning/phase-4.1/task_plan.md` W2 T2.4 (sister Phase 4.1 W2 README.md L9 Status + L48 MILESTONE row + shipped phase list append) + `README.md` 196L current state | **~98%** | **COPY-mechanical** Phase 4.1 W2 T2.4 1:1 replicate (combined with target #7 W1 Sponsors badge insertion — single commit deliverable): (1) Update L9 Status freshness header to reflect Phase 4.2 SHIPPED + v0.4.0 2/3 (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭 — preserve single SoT L9 freshness pattern); (2) Update L48 area v0.4.0 status row 1/3 → 2/3 (NOT yet 3/3 SHIPPED ARCHIVED — reserved Phase 4.3 close); (3) Add Phase 4.2 entry to shipped phase list (sister Phase 4.1+3.4+3.3+3.2+3.1 row pattern延袭); (4) Sponsors badge L8 insertion (combined target #7 deliverable); **Acceptance**: `grep -q "Phase 4.2" README.md` + `grep -q "v0.4.0.*2/3" README.md` + `grep -q "sponsors/easyinplay" README.md` + `node scripts/check-transparency-verdicts.mjs` exit 0 (freshness gate post-MODIFY pass — STATE_POSITION_RE OR-fallback for Phase 4.2 SHIPPED literal) |
| 12 | `PROJECT-SPEC.md` L3 Status header add Phase 4.2 SHIPPED literal (FRONT_MATTER_DOCS transparency gate) | docs | declarative | `.planning/phase-4.1/task_plan.md` W2 T2.5 (sister Phase 4.1 W2 PROJECT-SPEC.md L3 Status header sister Phase 3.3 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern) + `PROJECT-SPEC.md` 447L current state | **~98%** | **COPY-mechanical** Phase 4.1 W2 T2.5 1:1 replicate: Add Phase 4.2 SHIPPED literal to L3 Status header (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS pattern延袭) + 下一步 update L6 area to Phase 4.3 candidate; **Acceptance**: `grep -q "Phase 4.2" PROJECT-SPEC.md` + `node scripts/check-transparency-verdicts.mjs` exit 0 (FRONT_MATTER_DOCS transparency gate pass) |
| 13 | `.planning/phase-4.2/DOGFOOD-T2.X.md` NEW (~30-60L PASS N/N axes — sister Phase 4.1+3.4+3.3 DOGFOOD-T2.X format) + ci.yml T2.6 verify 0 diff (NO A7 iter) + baseline tag `v0.4.0-alpha.2-community` single push (NO ADR 0018 + NO 🎯 v0.4.0 — milestone tag reserved Phase 4.3 close) | docs (dogfood log) + git tag | declarative + git op | `.planning/phase-4.1/DOGFOOD-T2.X.md` 58L 3-axis empirical evidence format (Date + Verdict + 3 Axis sections + Aggregate + Disposition + ci.yml T2.6 verify 0 diff sister 守门) + Phase 4.1 PATTERNS.md row 14 DOGFOOD-T2.X.md sister mapping + Phase 4.1 W2 T2.7 single-tag push pattern (sister Phase 4.1 single baseline tag — Phase 4.2 NO milestone close = 1 tag only) | **~85%** | **COPY** sister Phase 4.1 DOGFOOD-T2.X.md 58L format 1:1 with axes ADAPT: (Axis A) `docs/MAINTAINER-ONBOARDING.md` EXPAND verify (D-01) — `wc -l docs/MAINTAINER-ONBOARDING.md` ≥100 ≤150 + 6-section presence (Dev environment / Commit conventions / ADR review / Cross-OS CI / Manifest schema / Upstream drift) + preserve existing 7-section verbatim; (Axis B) `.github/` NEW infra cluster verify (D-02 + D-03 + supporting infra) — `test -f .github/FUNDING.yml` + `grep -q "github: easyinplay" .github/FUNDING.yml` + `test -f .github/workflows/stale.yml` + `grep -q "actions/stale@v10\|days-before-stale: 60\|days-before-close: 30" .github/workflows/stale.yml` + `ls .github/ISSUE_TEMPLATE/*.yml | wc -l = 3` + README Sponsors badge `grep -q "sponsors/easyinplay" README.md`; (Axis C) W0.1 D2 cadence iter 3 institutionalize + W0.2 conditional SIZE_LIMIT flip OR DEFER verify — `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1\|ARCHIVED FROM STATE — Phase 4.1" .planning/RETROSPECTIVE.md` exit 0 (D2 cadence iter 3 M2 backlog discharge 3rd-iter pattern stable beyond 2-iter institutionalize verify) + `grep -q "SIZE_LIMIT = 150\|SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` (record flip OR DEFER outcome) + `node scripts/check-state-archive-stale.mjs` exit 0; **T2.6 ci.yml VERIFY 0 diff (sister Phase 4.1 守门 reuse)**: `git diff HEAD .github/workflows/ci.yml | wc -l = 0` + `grep -c "stale\|FUNDING\|sponsors" .github/workflows/ci.yml = 0` (NO A7 iter Phase 4.2 = community infra publish NOT architectural decision; ci.yml unchanged — `.github/workflows/stale.yml` is a SEPARATE new workflow file, NOT a ci.yml step insert); **baseline tag** Phase 4.2 W2 ship-time push `v0.4.0-alpha.2-community` single tag (NO ADR 0018 baseline tag — Phase 4.2 has NO new ADR per CONTEXT scope; NO 🎯 v0.4.0 milestone close tag — reserved Phase 4.3 close per sister v0.3.0 close cadence延袭); **Karpathy hard limit ≤60L** sister DOGFOOD 长度; **Acceptance**: `git tag -l "v0.4.0-alpha.2-community"` exit 0 + `git ls-remote origin refs/tags/v0.4.0-alpha.2-community` returns SHA (push origin verify per sister H1 lesson learned — push immediately AFTER user PP approval to avoid narrative-vs-state mismatch) |

---

## § 2 Per-target Concrete Code Excerpts (5 most critical — W1 NEW surface 3 `.github/` files + D-01 EXPAND + DOGFOOD)

### 2.1 `docs/MAINTAINER-ONBOARDING.md` D-01 ADDITIVE EXPAND 50L → 100-150L — analog: 50L stub + CONTRIBUTING.md root precedent

**ADDITIVE EXPAND** per D-01 LOCKED preserve existing 50L verbatim + insert 5-6 NEW sections after L33 (before § 风险) and before L47 (before § References). Sister Karpathy DRY pattern — reference CONTRIBUTING.md NOT duplicate:

```markdown
# 现 docs/MAINTAINER-ONBOARDING.md (50L v0.1 stub — preserve verbatim):
[L1-50 verbatim — 目标 / 招募窗口 / Co-maintainer 角色定位 / 必读文档 / v0.4 启动前 TODO / 风险 / References]

# Phase 4.2 W1 EXPAND insert after L33 "v0.4 启动前 TODO" before L41 "## 风险":

## Dev environment setup (30-min quickstart per R8.2)

详见 [CONTRIBUTING.md](../CONTRIBUTING.md) § Prerequisites + § Setup — 关键 checkpoint:

1. Node ≥ 22.0.0 (`engines.node` 强制) + Git
2. `corepack enable` (Windows ACL EPERM 用 prepare 模式 fallback per CONTRIBUTING § Windows Workaround)
3. `corepack pnpm install --frozen-lockfile` + `corepack pnpm test` (first cycle ≤ 5 min on M2/Ryzen-class)
4. `node ./dist/cli.mjs --version` (smoke test post-build)

## Commit conventions

- Conventional Commits format (`type(scope): summary` — sister Phase 1.X+ all commits遵循)
- Karpathy ≤200L hard / ≤150L docs hard (sister B-06 + B-26 + Phase 3.4 D-04 explicit "no B-03 5% tolerance")
- **Biome preempt before commit** (project memory `feedback_biome-preempt.md` — 3 CI-red recurrences terminus): `pnpm exec biome check --write` MANDATORY before TS/JS commits

## ADR review checklist

- 9 章节 errata format (sister ADR 0001-0017 main body 0 diff per A7 守恒)
- REQ-ID anchor (sister Phase 3.4 W2 T2.7 iter 1-0017 cadence)
- Decision Lock + Sneak-block clauses + Rationale (sister Phase X.Y CONTEXT.md D-decisions 模板)

## Cross-OS CI maintenance

- `.github/workflows/ci.yml` matrix: ubuntu-latest + macos-latest + windows-latest
- Windows-specific: bash flavor sentinel (sister Phase 2.4 W4 ralph-loop Win sentinel) + RESEARCH-guided `net.createServer({port:0})` ephemeral port (sister Phase 3.3 W0.2 dashboard-sse fix)
- 3-tier 8s waitFor pattern (sister Phase 2.4 W4 Win 3-tier 8s precedent)

## Manifest schema 守门

- ADR 0001 v1 frozen + ADR 0007 errata extension (categorization 3-field)
- schemaVersion 13-surface registry (sister Phase 3.3 W0.3 manifest-domain colocation 3rd consumer 闭环)
- Colocation domain rule: "schemas go where primary consumer lives" — checkpoint-domain (Phase 3.1) + workflow-domain (Phase 3.2) + manifest-domain (Phase 3.3)

## Upstream drift monitoring

- `versions/<harnessed-ver>-known-good.yaml` lazy lock per Phase 3.3 D-03 (8-entry sample shipped v0.3.0)
- Manifest churn signal heuristics: NEW install_method introduction + breaking semver bump in upstream package.json
```

**D-01 sneak block守门 (3-clause LOCKED)**:
1. NO split into multiple files (single ONBOARDING.md SoT — sister CONTRIBUTING.md+PROJECT-SPEC.md 1-file precedent)
2. NO checklist-only format (lose narrative context for 新人 — hybrid commands + narrative REQUIRED per R8.2 30-min quickstart spec)
3. NO redundant copy from CONTRIBUTING.md (reference link only per Karpathy DRY — Dev environment section delegates to existing CONTRIBUTING § Prerequisites + § Setup)

**Karpathy hard limit ≤150L** (50L stub + ~75-95L new sections = ~125-145L well within ≤150 hard cap per CLAUDE.md docs convention).

### 2.2 `.github/FUNDING.yml` NEW D-03 single tier $1+ minimal Karpathy YAGNI

**NEW surface** — pattern source = GitHub Sponsors official schema (https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository):

```yaml
# .github/FUNDING.yml
# Phase 4.2 W1 D-03 LOCKED: single tier $1+ minimal Karpathy YAGNI
# Defer multi-tier pricing (3-level $5/$25/$100) to v0.5+ pending community signal
# Defer custom: URL array to v0.5+ pending alternative funding venue signal

github: easyinplay
```

**D-03 sneak block守门 (3-clause LOCKED)**:
1. NO multi-tier 3-level ($5/$25/$100) pricing definition (Patreon-style pricing-design overhead pre-v1.0)
2. NO link-only no-tier (违反 "可接受捐赠" verb literal — R8.5 acceptance requires actionable sponsor button)
3. NO `custom:` array URL (sister Karpathy YAGNI — defer until community signal post-launch)

**Karpathy YAGNI hard** ≤8L (1-key value + 3-7L header comment explaining D-03 LOCKED rationale).

### 2.3 `.github/workflows/stale.yml` NEW D-02 90-day issue+PR auto-close

**NEW surface** — pattern source = official `actions/stale@v10` (most widely deployed stale-bot GitHub Action — Karpathy "use what 90% projects use" 默认):

```yaml
# .github/workflows/stale.yml
# Phase 4.2 W1 D-02 LOCKED: 90-day issue+PR auto-close (warning day 60 + close day 90 = 60+30 per R8.3 spec)
# BOTH scope per D-02 sneak block (NOT issue-only — avoid zombie PRs blocking maintainer attention)
# Cron daily 00:00 UTC per CONTEXT § Open Q L57 default (fast feedback over weekly)

name: stale

on:
  schedule:
    - cron: '0 0 * * *'  # daily 00:00 UTC
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
          days-before-stale: 60
          days-before-close: 30
          stale-issue-message: |
            This issue has been automatically marked as stale because it has not had
            recent activity. It will be closed in 30 days if no further activity occurs.
            Reactivation: comment with status update OR reference docs/MAINTAINER-ONBOARDING.md
            for revival path. Apologies for any inconvenience.
          stale-pr-message: |
            This PR has been automatically marked as stale because it has not had
            recent activity. It will be closed in 30 days if no further activity occurs.
            Reactivation: rebase + comment with status update.
          stale-issue-label: 'stale'
          stale-pr-label: 'stale'
          exempt-issue-labels: 'pinned,security,good-first-issue'
          exempt-pr-labels: 'pinned,security'
          close-issue-message: |
            Closed due to inactivity. Reopen anytime with new context.
          close-pr-message: |
            Closed due to inactivity. Reopen anytime with rebased branch.
```

**D-02 sneak block守门 (3-clause LOCKED)**:
1. NO 60-day stricter total (risks 埋没 new contributor issues; T3 external dependency 不利)
2. NO 120-day lenient total (违 R8.3 90-day spec)
3. BOTH issue + PR scope (NOT issue-only — avoid zombie PRs blocking maintainer attention)

**Karpathy YAGNI hard** ≤60L (workflow boilerplate ~12L + actions/stale@v10 with-block ~30L + header comment ~8L + close messages ~10L = ~60L).

### 2.4 `.github/ISSUE_TEMPLATE/bug.yml` NEW (sister feature.yml + question.yml 3-template cluster)

**NEW surface** — pattern source = GitHub Issue Forms schema (https://docs.github.com/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms):

```yaml
# .github/ISSUE_TEMPLATE/bug.yml
# Phase 4.2 W1 D-03 supporting infra: yml form-based modern (CONTEXT § Open Q L58 lock)
# 3-template cluster: bug + feature + question (Karpathy YAGNI — defer good-first-issue + security v0.5+)

name: Bug report
description: Report a defect in harnessed (installer / router / checkpoint / doctor / CLI)
title: "[BUG] "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        请先检查 [docs/MAINTAINER-ONBOARDING.md](../docs/MAINTAINER-ONBOARDING.md) §
        Dev environment setup 是否覆盖你的场景。Cross-OS issues see § Cross-OS CI maintenance.
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: Minimal repro recipe — commands run + observed output + expected output
      placeholder: |
        1. `harnessed install ctx7 --dry-run`
        2. observed: [paste output]
        3. expected: [paste expected]
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Node version + OS + harnessed version (`node ./dist/cli.mjs --version`)
      placeholder: |
        Node: v22.x.x
        OS: Windows 11 / macOS 14 / Ubuntu 22.04
        harnessed: 0.x.x
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Relevant logs / stack traces (optional)
      render: shell
```

**Sister `feature.yml` skeleton** (~35L same structure with title prefix `[FEAT]` + label `enhancement` + motivation/proposed-api/alternatives 3-textarea + header markdown Karpathy YAGNI tip "请先确认非 v1.0+ DEFER 议题 per ROADMAP § v1.0 前拒绝清单").

**Sister `question.yml` skeleton** (~25-30L same structure with title prefix `[Q]` + label `question` + question-body textarea + checked-docs checkboxes referencing MAINTAINER-ONBOARDING + CONTRIBUTING + redirect-to-Discussions markdown if applicable).

**D-03 supporting infra sneak block守门 (3-clause)**:
1. yml form-based NOT classical .md (CONTEXT § Open Q L58 lock)
2. 3 templates (bug + feature + question) NOT 5+ (Karpathy YAGNI — defer good-first-issue + security templates v0.5+ if signal)
3. auto-apply labels REQUIRED (workflow integration with stale.yml exempt-labels — `pinned` + `security` + `good-first-issue` pre-existing labels via repo settings post-merge)

**Karpathy hard limit ≤150L total** (3 templates × ~40-50L each).

### 2.5 `.planning/phase-4.2/DOGFOOD-T2.X.md` NEW (sister Phase 4.1 58L 3-axis format 1:1 with axes ADAPT)

**COPY sister Phase 4.1 DOGFOOD-T2.X.md 58L 3-axis format 1:1 with axes ADAPT**:

```markdown
# Phase 4.2 T2.7 — Dogfood Report (3-axis empirical evidence: docs/MAINTAINER-ONBOARDING EXPAND D-01 + .github/ NEW infra cluster D-02+D-03 + W0.1 D2 cadence iter 3 + W0.2 conditional SIZE_LIMIT flip OR DEFER)

**Date**: 2026-05-18
**Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

## Axis A — docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L (D-01 LOCKED ADDITIVE)

**Setup**: D-01 LOCKED ADDITIVE EXPAND preserve existing 50L verbatim + 5-6 NEW sections (Dev environment / Commit conventions / ADR review / Cross-OS CI / Manifest schema / Upstream drift); R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境" satisfied via hybrid narrative + commands.
**Action**: `wc -l docs/MAINTAINER-ONBOARDING.md` ≥100 ≤150 + `grep -c "^## " docs/MAINTAINER-ONBOARDING.md` ≥10 (preserve 7 + add 5-6) + `grep -q "Dev environment\|Commit conventions\|ADR review\|Cross-OS CI\|manifest schema\|Upstream drift" docs/MAINTAINER-ONBOARDING.md`.
**Acceptance**: ≤150L Karpathy hard + 6-section NEW + 7-section preserved + reference CONTRIBUTING.md NOT duplicate (D-01 sneak #3 守门).
**Status**: ✅ PASS

## Axis B — .github/ NEW infra cluster verify (D-02 90-day issue+PR + D-03 single tier $1+ + supporting infra 3 issue templates)

**Setup**: 3 NEW `.github/` files first-time community infra surface — FUNDING.yml D-03 single tier + workflows/stale.yml D-02 90-day issue+PR (actions/stale@v10 day 60 warning + day 90 close = 60+30 per R8.3 spec) + ISSUE_TEMPLATE/{bug,feature,question}.yml 3-template cluster (D-03 supporting infra yml form-based per CONTEXT L58); README L8 Sponsors badge shields.io standard auto-pulls from FUNDING.yml.
**Action**: `test -f .github/FUNDING.yml` + `grep -q "github: easyinplay" .github/FUNDING.yml` + `test -f .github/workflows/stale.yml` + `grep -q "actions/stale@v10" .github/workflows/stale.yml` + `grep -q "days-before-stale: 60" .github/workflows/stale.yml` + `grep -q "days-before-close: 30" .github/workflows/stale.yml` + `ls .github/ISSUE_TEMPLATE/*.yml | wc -l = 3` + `grep -q "sponsors/easyinplay" README.md`.
**Acceptance**: 5 NEW files (1 FUNDING + 1 workflows/stale + 3 ISSUE_TEMPLATE) + 1 MODIFY (README badge) + R8.5 + R8.3 acceptance criteria satisfied per CONTEXT D-02 + D-03 LOCKED.
**Status**: ✅ PASS

## Axis C — W0.1 D2 cadence iter 3 institutionalize (Phase 4.0+4.1 → RETROSPECTIVE) + W0.2 conditional SIZE_LIMIT flip OR DEFER outcome

**Setup**: W0 backlog 1 项 conditional STRICT path dep W0.1 → W0.2: T0.1 W0.1 D2 cadence iter 3 trim Phase 4.1 narrative (Phase 4.0 absent per Bash verify) → RETROSPECTIVE.md `## § ARCHIVED FROM STATE — Phase 4.0+4.1` section (sister M2 backlog discharge institutionalize verify 3rd-iter pattern stable beyond 2-iter) + T0.2 W0.2 CONDITIONAL D1 SIZE_LIMIT 200→150 FLIP path (if post-T0.1 STATE ≤140L verify) OR DEFER #BA→Phase 4.3 W0 (sister Phase 4.1 W0.5 DEFER path precedent if STATE >140L insufficient ≥10L headroom).
**Action**: `node scripts/check-state-archive-stale.mjs` (exit 0 with ENFORCE=true round 2 post-T0.1) + `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1\|ARCHIVED FROM STATE — Phase 4.1" .planning/RETROSPECTIVE.md` (PASS) + `wc -l .planning/STATE.md` (≤200L baseline or ≤150L W0.2 flip) + `grep -q "SIZE_LIMIT = 150\|SIZE_LIMIT = 200" scripts/check-state-archive-stale.mjs` (record outcome).
**Acceptance**: ENFORCE=true gate exit 0 PASS post-archive (3 rules: STATE ≤(150 OR 200) + 0 关键决议 ship 总结 + 0 W-N errata literals) + RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 4.0+4.1 section present (D2 cadence iter 3 institutionalize 3rd-iter pattern terminus signal ≥3-iter) + W0.2 outcome recorded.
**Status**: ✅ PASS

## Aggregate verification

- **R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境"**: ✅ Axis A (~125-145L hybrid narrative + commands + reference CONTRIBUTING.md NOT duplicate)
- **R8.3 acceptance "stale-bot 自动关闭 90 天无活动 issue"**: ✅ Axis B (.github/workflows/stale.yml D-02 90-day issue+PR + 3 issue templates supporting infra)
- **R8.5 acceptance "Sponsors 链接公开 + 可接受捐赠"**: ✅ Axis B (.github/FUNDING.yml D-03 single tier $1+ + README Sponsors badge insertion)
- **W0.1 D2 cadence iter 3 M2 backlog discharge institutionalize**: ✅ Axis C (RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 4.0+4.1 section + W0.1 ENFORCE=true gate post-archive PASS — pattern stable 3rd-iter ≥3-iter terminus signal)
- **T2.6 ci.yml VERIFY 0 diff (sister Phase 4.1 守门 reuse)**: ✅ `git diff HEAD .github/workflows/ci.yml | wc -l = 0` + `grep -c "stale\|FUNDING\|sponsors" .github/workflows/ci.yml = 0` + `.github/workflows/stale.yml` is SEPARATE new workflow file NOT ci.yml step insert (NO A7 iter Phase 4.2 = community infra publish NOT architectural decision)
- **Full test suite gate**: ✅ TBD post-W2 vitest direct invoke (sister W0+W1 NOT code changes — test count expected unchanged or +0-2 cells if `.github/` config validation tests added planner Discretion DROP per YAGNI)

## Disposition

- ✅ T2.7 dogfood PASS 3/3 axes verified
- ✅ R8.2 + R8.3 + R8.5 acceptance criteria 全 verified (3 REQ-ID confirmed)
- ✅ Phase 4.2 ship-readiness 4 D-decisions 全 activated 闭环 (D-01 EXPAND additive / D-02 90-day issue+PR / D-03 single tier $1+ / D-04 HYBRID 2-clock — D-04 verified at process-level NOT artifact-level since 6-month external clock organic)
- ✅ DEFERRED #BA conditional resolved (FLIP OR DEFER path recorded per W0.2 outcome)
- ✅ DEFERRED #BB ✅ pre-resolved at discuss-phase (HYBRID 2-clock LOCKED — Axis C verify D-04 process semantics)
- ✅ W0 backlog 1 项 + W0.1 D2 cadence iter 3 M2 backlog discharge institutionalize verify pattern stable 3rd-iter ≥3-iter terminus signal
- ✅ PATTERNS § 5 risk #3 mitigation活用 3 NO 守门 (NO ADR 0018 + NO ci.yml A7 iter + NO triple tag — single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only)
- ✅ v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭)

**Note**: Phase 4.2 = v0.4.0 milestone 2nd phase = R8.2 + R8.3 + R8.5 anchors; R8.1 audit log + R8.4 公开 ADR 全集 + v1.0-RC 收尾 → Phase 4.3 explicit out-of-scope per CONTEXT Deferred Ideas; single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push).
```

**Karpathy hard limit ≤60L** sister Phase 4.1 DOGFOOD 58L precedent (current sketch ~65L overflow — planner Wave B compress aggregate footer or split into separate aggregate section if rigid).

---

## § 3 Cross-cutting Patterns (D-decisions + Karpathy 守门)

### D-01 ADDITIVE EXPAND > FULL REWRITE (50L stub preservation discipline)

- **Sneak block** (3-clause守门 per CONTEXT L17):
  - planner / executor MUST preserve existing 50L verbatim (NO rewrite from scratch — audit history continuity)
  - planner / executor MUST NOT split into multiple files (single ONBOARDING.md SoT — sister CONTRIBUTING.md+PROJECT-SPEC.md 1-file precedent)
  - planner / executor MUST NOT use checklist-only format (lose narrative context for 新人 — R8.2 30-min quickstart spec requires hybrid commands + narrative)
- **Sister precedent**: Karpathy DRY "reference don't duplicate" — Dev environment section delegates to CONTRIBUTING.md NOT recopy; sister Phase 3.3 D-04 5-recurrence terminus COLLAPSE pattern "consolidate before further extend".
- **Karpathy hard limit ≤150L docs** per CLAUDE.md (50L stub + ~75-95L expansion = ~125-145L well within ≤150 hard).

### D-02 90-day issue+PR stale-bot (防御 60-stricter / 120-lenient / issue-only sneak)

- **Sneak block** (3-clause守门 per CONTEXT L24):
  - planner / executor MUST NOT use 60-day stricter total (risks 埋没 new contributor issues; T3 external dependency 不利)
  - planner / executor MUST NOT use 120-day lenient total (违 R8.3 90-day spec)
  - planner / executor MUST cover BOTH issue + PR (NOT issue-only — avoid zombie PRs blocking maintainer attention)
- **Sister precedent**: GitHub default convention `actions/stale@v10` default schedule + balanced for low-volume project; Karpathy "use what 90% projects use" 默认.
- **Workflow integration**: `exempt-issue-labels: 'pinned,security,good-first-issue'` ties to MAINTAINER-ONBOARDING.md L38 v0.4 TODO "good first issue 标签清单 ≥ 5" — pre-existing label setup REQUIRED via repo settings post-merge.

### D-03 single tier $1+ Sponsors + 3-template issue forms (防御 multi-tier / no-tier / classical-md sneak)

- **Sneak block FUNDING.yml** (3-clause守门 per CONTEXT L31):
  - planner / executor MUST NOT define multi-tier 3-level ($5/$25/$100) pricing (Patreon-style pricing-design overhead pre-v1.0)
  - planner / executor MUST NOT use link-only no-tier (违反 "可接受捐赠" verb literal — R8.5 acceptance requires actionable sponsor button)
  - planner / executor MUST NOT add `custom:` array URL (sister Karpathy YAGNI — defer until community signal post-launch)
- **Sneak block ISSUE_TEMPLATE/** (3-clause守门 per CONTEXT § Open Q L58):
  - planner / executor MUST use yml form-based (NOT classical .md)
  - planner / executor MUST create exactly 3 templates (bug + feature + question) NOT 5+ (Karpathy YAGNI defer good-first-issue + security v0.5+)
  - planner / executor MUST auto-apply labels (workflow integration with stale.yml exempt-labels)
- **Sister precedent**: Karpathy "use the right venue" — question.yml redirect to GitHub Discussions if applicable; feature.yml header markdown Karpathy YAGNI tip "请先确认非 v1.0+ DEFER 议题 per ROADMAP § v1.0 前拒绝清单".

### D-04 HYBRID 2-clock internal launch + 6-month organic external (process-level invariant)

- **Sneak block** (3-clause守门 per CONTEXT L37):
  - planner / executor MUST NOT use FROZEN 6-month total (violates ROADMAP 2-3 周 v0.4.0 total internal cadence)
  - planner / executor MUST NOT use ACCELERATED "招到 1 个外部 PR within 2 weeks" (忽视 T3 external time 不可控)
  - planner / executor MUST treat 6-month co-maintainer recruitment as SEPARATE clock NOT counted in v0.4.0 ship timeline
- **Verification at process-level NOT artifact-level**: D-04 doesn't produce artifact file — verified via STATE.md L23-24 update language "v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close)" + RETROSPECTIVE.md § Cost patterns L4 "Phase 4.2 内部 phase 1 day cadence延袭 (T3 external dependency = co-maintainer 招募 6-month 真正 clock separate per D-04 HYBRID — DOES NOT count v0.4.0 ship timeline)".
- **Sister precedent**: Karpathy "ship fast even if external" + R9.1 单 maintainer 36%/年掉队率 mitigation 长期工程 NOT short-term sprint.

### W0.1 D2 cadence iter 3 institutionalize (M2 backlog discharge 3rd-iter pattern stable signal)

- **Sneak block**: NOT skip D2 cadence even though Phase 4.0 doesn't exist — section header preserves "Phase 4.0+4.1" literal per sister Phase 4.1 W0 T0.1 cadence affirm L640 "Next § ARCHIVED FROM STATE — Phase 4.0+4.1 will be created by Phase 4.2 ship-time per D2 standing process cadence iter 3" (header literal preserved for cadence consistency); content section reflects Phase 4.1 only (single-phase narrative archive due to Phase 4.0 absence).
- **Sister cadence**: D2 cadence Phase 3.4 W2 T2.2 1st-implementation → Phase 4.1 W0 T0.1 2nd-iter institutionalize verify → Phase 4.2 W0 T0.1 3rd-iter pattern terminus stable signal (≥3-iter institutionalize standard per sister 5-recurrence terminus signal heuristic).

### W0.2 conditional SIZE_LIMIT 200→150 flip (防御 over-tighten brittle — DEFERRED #BA carry)

- **Sneak block**: NOT tighten `SIZE_LIMIT = 200 → 150` until W0.1 archive outcome verified STATE.md ≤140L (sister Phase 4.1 W0.5 DEFER path precedent if STATE >140L insufficient ≥10L headroom threshold per § 7.1 decision tree).
- **Conditional path**: per CONTEXT W0 #BA conditional — if W0.1 outcome holds STATE ≤140L → flip; otherwise DEFER → carry-forward Phase 4.3 W0 (LOW priority).
- **Sister cadence**: Phase 4.1 W0.5 DEFER path active precedent (post-W0.3 STATE 143-151L exceeded ≥10L headroom threshold DEFER); Phase 4.2 W0.2 evaluates same heuristic with W0.1 D2 iter 3 archive outcome.

### Karpathy hard limit ≤150L docs / ≤200L source (CLAUDE.md global)

- **`docs/MAINTAINER-ONBOARDING.md` ≤150L hard** per CLAUDE.md docs convention (50L stub + ~75-95L D-01 expansion = ~125-145L well within).
- **`.github/FUNDING.yml` ≤8L hard** per D-03 Karpathy YAGNI (1-key value + 3-7L comment).
- **`.github/workflows/stale.yml` ≤60L hard** per D-02 Karpathy YAGNI (boilerplate + with-block + close messages).
- **`.github/ISSUE_TEMPLATE/{bug,feature,question}.yml` ≤150L total hard** per D-03 supporting infra (3 templates × ~40-50L each).
- **`.planning/phase-4.2/DOGFOOD-T2.X.md` ≤60L hard** sister Phase 4.1 DOGFOOD 58L precedent (current sketch ~65L — planner Wave B compress aggregate footer).
- **`.planning/STATE.md` W0.2 conditional ≤150L OR ≤200L** (sister Phase 4.1 round 1 151L baseline post-W0.3 archive).

### biome preempt + ralph-loop discipline (5-recurrence terminus 续 — Phase 4.2 zero TS/JS source surface)

- Phase 4.2 main surface = docs (markdown) + 3 NEW yaml/yml files (`.github/FUNDING.yml` + `.github/workflows/stale.yml` + `.github/ISSUE_TEMPLATE/*.yml`) + 1 conditional 1-line scripts/*.mjs MODIFY (W0.2 conditional SIZE_LIMIT 200→150 IF FLIP path) — ZERO TS source change.
- Biome preempt fires ONLY IF W0.2 FLIP path active (scripts/check-state-archive-stale.mjs touch) — sister project memory `feedback_biome-preempt.md` user lock (3 CI-red recurrence terminus): `pnpm exec biome check --write` MANDATORY before commit IF W0.2 FLIP path.
- Yaml/yml files NOT subject to biome (only TS/JS) — GitHub Action lint validation occurs at PR-time on next push.

### NO ADR 0018 + NO ci.yml A7 iter + NO triple tag (Phase 4.2 = community infra publish NOT architectural decision)

- **Sister Phase 4.1 PATTERNS § 5 risk #3 mitigation reuse**: Phase 4.2 = pure community infra publish surface — NOT architectural decision (no new schemaVersion / no new domain colocation / no new install_method / no new helper extraction); NO new ADR required.
- **ci.yml T2.6 VERIFY 0 diff守门** (sister Phase 4.1 reuse): `git diff HEAD .github/workflows/ci.yml | wc -l = 0` + `grep -c "stale\|FUNDING\|sponsors" .github/workflows/ci.yml = 0` — `.github/workflows/stale.yml` is SEPARATE new workflow file NOT ci.yml step insert; ci.yml untouched.
- **NO triple tag**: Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push pending user approval per CLAUDE.md commit safety); NO `adr-0018-accepted` tag (no ADR) + NO 🎯 `v0.4.0` milestone close tag (reserved Phase 4.3 close per sister v0.3.0 close cadence延袭 3 alpha tags + final milestone tag triple-push).

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| **W0 prereq backlog (1 项 conditional)** | | |
| `.planning/STATE.md` W0.1 D2 cadence iter 3 trim (Phase 4.1 → RETROSPECTIVE) | **~92%** | Phase 4.1 W0 T0.1 1:1 replicate with target swap; Phase 4.0 absence disambiguation (section header preserves "Phase 4.0+4.1" literal per sister L640 cadence affirm, content single-phase Phase 4.1) |
| `scripts/check-state-archive-stale.mjs` W0.2 conditional SIZE_LIMIT 200→150 flip (DEFERRED #BA) | **~95%** | Phase 4.1 W0.5 conditional path 1:1 reuse (FLIP OR DEFER decision tree per § 7.1) + sister Phase 2.2 W0 transparency gate 1-line flip cadence |
| **W1 main scope (5 项 — Phase 4.2 anchors R8.2 + R8.3 + R8.5)** | | |
| `docs/MAINTAINER-ONBOARDING.md` D-01 EXPAND 50L → 100-150L | **~70%** | 50L stub preserve verbatim + reference CONTRIBUTING.md existing dev-setup (Karpathy DRY) + 5-6 NEW sections ADAPT R8.2 spec (sister Phase 4.1 docs/benchmarks/v0.4.md 70% NEW expansion pattern类似) |
| `.github/FUNDING.yml` NEW D-03 single tier $1+ | **~30%** | NEW surface — first community-infra `.github/` file in project history; pattern source GitHub Sponsors official schema; 1-key value config (smallest reuse % in phase) |
| `.github/workflows/stale.yml` NEW D-02 90-day issue+PR | **~55%** | NEW surface — partial reuse from `.github/workflows/ci.yml` + `.github/workflows/perf-bench.yml` structural template (name/on/jobs/steps schema) + actions/stale@v10 official with-block pattern (Karpathy default) |
| `.github/ISSUE_TEMPLATE/{bug,feature,question}.yml` NEW × 3 | **~40%** | NEW surface — partial reuse from `CONTRIBUTING.md` structural contributor-facing docs cluster + GitHub Issue Forms schema yml form-based modern (CONTEXT § Open Q L58 lock) |
| `README.md` L8 Sponsors badge + Phase 4.2 STATUS_MARKER (combined target #7 W1 + target #11 W2) | **~85%** | REUSE existing L6+L7 badge cluster (2-badge group) + INSERT shields.io standard Sponsors badge L8 + sister Phase 4.1 W2 T2.4 STATUS_MARKER path延袭 |
| **W2 ship (6 项 — sister Phase 4.1 W2 cluster延袭; NO ADR 0018 + NO A7 iter ci.yml + NO triple tag)** | | |
| `.planning/STATE.md` 续编 Phase 4.2 SHIPPED + W0.1 D2 archive | **~95%** | Phase 4.1 W2 T2.1 1:1 replicate with content swap (Phase 4.2 entry + v0.4.0 2/3 + Phase 4.1 archive Phase 4.0+4.1 section header literal) |
| `.planning/RETROSPECTIVE.md` 续编 Phase 4.2 7-section + receive D2 archive | **~92%** | Phase 4.1 W2 T2.2 6-section + bonus Next Phase Prep Notes = 7-section format 1:1 replicate with content swap |
| `.planning/ROADMAP.md` Phase 4.2 ✅ SHIPPED + v0.4.0 2/3 marker | **~98%** | Phase 4.1 W2 T2.3 1:1 replicate (v0.4.0 progress 1/3→2/3; NO ARCHIVED until Phase 4.3 close) |
| `README.md` L9 Status + Phase 4.2 row + v0.4.0 2/3 (combined with W1 #7 Sponsors badge) | **~98%** | Phase 4.1 W2 T2.4 1:1 replicate STATUS_MARKER path延袭 |
| `PROJECT-SPEC.md` L3 Status Phase 4.2 SHIPPED literal | **~98%** | Phase 4.1 W2 T2.5 1:1 replicate FRONT_MATTER_DOCS gate延袭 |
| `.planning/phase-4.2/DOGFOOD-T2.X.md` NEW + ci.yml T2.6 verify 0 diff + single tag push | **~85%** | Phase 4.1 DOGFOOD-T2.X.md 58L 3-axis format 1:1 with axes ADAPT (D-01 EXPAND axis + .github/ NEW infra cluster axis + W0.1+W0.2 institutionalize+conditional axis); single tag NOT triple (NO ADR 0018 + NO 🎯 v0.4.0 until Phase 4.3 close) |

**总 reuse %**: **~78%** (13 target weighted average; sister Phase 4.1 ~85% + Phase 3.4 ~83% + Phase 3.3 100% + Phase 2.4 ~76% — Phase 4.2 78% slightly below Phase 4.1 85% due to 3 NEW `.github/` first-time community-infra surface drag ~30-55% reuse)

- **拉高因素**: 6 sister direct copy ≥95% reuse (W0.1 D2 iter 3 + 5-doc 续编 W2 cluster all sister Phase 4.1 W2 T2.1-T2.5 verbatim 1:1 replicate; W0.2 conditional SIZE_LIMIT flip 95% sister cadence延袭)
- **拉低因素**: W1 main scope 3 NEW `.github/` first-time community-infra surface (FUNDING.yml 30% + ISSUE_TEMPLATE 40% + stale.yml 55%) = ~42% weighted avg W1 main scope vs Phase 4.1 W1 ~60% (Phase 4.2 has 3 NEW surface vs Phase 4.1 had 2 NEW + 3 partial-reuse)
- **NO拉低**: W2 ship cluster 高度复用 sister Phase 4.1 cadence (5-doc 续编 + DOGFOOD + tag pattern全 ≥85%); NO new ADR + NO A7 iter ci.yml this phase = 0 architectural surface change Phase 4.2 = pure community infra publish

**对比 Phase 4.1**: 14 target ~85% / Phase 4.2 13 target ~78% — Phase 4.2 lower target count due NO ADR + NO new src/ surface code (Phase 4.2 = community infra phase NOT code phase like Phase 4.1 which had 1-line scripts/*.mjs MODIFY + e2e log capture); reuse % 7-point lower vs Phase 4.1 due 3 NEW `.github/` files first-time community-infra surface (vs Phase 4.1 = 1 NEW `docs/benchmarks/` surface with sister SAMPLES.md frame reuse)

---

## § 5 Path Dependency (Wave A R1 → Wave B planner → Wave C execute) + Latent Risk Surface

### Path Dependency

```
W0.1 D2 cadence iter 3 (Phase 4.0+4.1 narrative → RETROSPECTIVE)  ──┐
                  │                                                  │
                  ▼ (path dep — W0.1 archive REDUCES STATE size, gates W0.2 SIZE_LIMIT flip)
                                                                     │
W0.2 conditional SIZE_LIMIT 200→150 flip (IF STATE ≤140 post-W0.1) ─┤
                  │ (path dep — IF STATE >140 → DEFER #BA → Phase 4.3 W0)
                                                                     │
                  ├──► W1 main scope (5 项 docs/community infra — Phase 4.2 anchors R8.2 + R8.3 + R8.5)
                  │     ├── docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L (D-01 LOCKED additive)
                  │     ├── .github/FUNDING.yml NEW ≤8L (D-03 single tier)
                  │     ├── .github/workflows/stale.yml NEW ≤60L (D-02 90-day issue+PR)
                  │     ├── .github/ISSUE_TEMPLATE/{bug,feature,question}.yml NEW × 3 (~120-150L total)
                  │     └── README L8 Sponsors badge insertion (combined with W2 #11 STATUS_MARKER)
                  │              │
                  │              ▼
                  └──► W2 ship (6 项 — NO ADR 0018 + NO A7 iter ci.yml + NO 🎯 v0.4.0 until Phase 4.3)
                         ├── STATE.md 续编 Phase 4.2 SHIPPED + W0.1 D2 archive sub-step (T2.1 sister)
                         ├── RETROSPECTIVE.md 续编 Phase 4.2 7-section + receive D2 archive (T2.2 sister)
                         ├── ROADMAP.md Phase 4.2 ✅ SHIPPED + v0.4.0 2/3 marker (T2.3 sister)
                         ├── README.md L9 Status + Phase 4.2 row + v0.4.0 2/3 (T2.4 sister combined Sponsors badge)
                         ├── PROJECT-SPEC.md L3 Status Phase 4.2 SHIPPED literal (T2.5 sister)
                         └── DOGFOOD-T2.X.md NEW + ci.yml T2.6 verify 0 diff + baseline tag v0.4.0-alpha.2-community single push
```

**Critical path** (W0.1 → W0.2 → W1 → W2): W0.1 D2 archive REDUCES STATE.md size FIRST (creates W0.2 SIZE_LIMIT flip headroom); W0.2 conditional flip only IF post-archive STATE ≤140L (≥10L headroom threshold per § 7.1 decision tree); W1 NEW community infra publish (Phase 4.2 main scope 5 项); W2 ship cluster CLOSES with 5-doc 续编 + DOGFOOD + single baseline tag push (NO triple tag).

**Wave A R1+R2 并行可行性**: ✅ R1 (本文档 PATTERNS.md) 与 R2 (RESEARCH.md fresh research) 独立 — R1 mapping analog reuse %, R2 验 (a) actions/stale@v10 official schema verify (vs older v8/v7 deprecation) + (b) GitHub Issue Forms yml schema verify (current schema vs deprecated .md classical) + (c) GitHub Sponsors single-key `github:` vs multi-key custom verify + (d) ROADMAP L185 v0.4.0 timeline reconcile with D-04 HYBRID 2-clock (internal 1-day cadence vs 6-month organic external). Wave B planner 同时消费 R1+R2 输出生成 PLAN.md.

### Latent Risks Surfaced (5 risks — planner Wave B mitigation reference)

1. **R-1 D-01 50L stub EXPAND content quality risk (Phase 4.2 main expansion target)**: existing 50L stub from Phase 1.x is "v0.1 placeholder" quality (per stub L2 explicit "Status：占位文档(v0.1) — 实际启用于 v0.4 co-maintainer 招募窗口"); R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境" requires production-ready 5-6 NEW sections quality bar; risk = D-01 sneak block #1 "preserve existing 50L verbatim" may force-preserve sub-optimal v0.1 phrasing in §「目标」+ §「招募窗口」+ §「Co-maintainer 角色定位」. **Mitigation**: planner Wave B verify v0.1 stub quality acceptable for production-ready; if rephrase needed, document as "minor wording polish allowed within D-01 ADDITIVE EXPAND scope NOT full rewrite" (per CONTEXT § Open Q L59 planner Discretion — verify v0.1 stub quality + decide section reorder).

2. **R-2 NEW `.github/` surface no project precedent (first community-infra inhabitant)**: 3 NEW `.github/` files (FUNDING.yml + workflows/stale.yml + ISSUE_TEMPLATE/×3) are first-time inhabitants of `.github/` community-infra surface (only `.github/workflows/ci.yml` + `.github/workflows/perf-bench.yml` exist pre-Phase-4.2 — both CI workflows NOT community templates); risk = schema validation surface untested in this project (GitHub Issue Forms schema may evolve + actions/stale@v10 may deprecate v10); Wave B research RESEARCH.md should verify current GitHub schemas via ctx7 OR official docs (per CLAUDE.md ctx7 routing rule for library/tool/SDK queries). **Mitigation**: planner Wave B RESEARCH.md R2 task = verify actions/stale@v10 + GitHub Issue Forms yml schema + GitHub Sponsors FUNDING.yml schema all current as of 2026-05-18; sneak block守门 catch schema drift.

3. **R-3 D-04 HYBRID 2-clock semantics in ship docs (process-level invariant verify)**: D-04 HYBRID 2-week internal launch + 6-month organic external clock does NOT produce artifact file — verified via STATE.md L23-24 + RETROSPECTIVE.md § Cost patterns language only; risk = ship docs may inadvertently conflate "Phase 4.2 ship completes 6-month external clock start" or "v0.4.0 milestone close requires external PR within 6-month"; both would violate D-04 sneak blocks. **Mitigation**: planner Wave B PLAN.md W2 T2.2 + T2.3 explicit language template "v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister L130 v0.3.0 cadence延袭); 6-month co-maintainer 招募 external clock is SEPARATE from v0.4.0 ship timeline per D-04 HYBRID" — explicit 2-clock reconcile language MUST appear in STATE.md 当前里程碑 row + RETROSPECTIVE.md § Cost patterns L4.

4. **R-4 Phase 4.0 absence in D2 cadence section header (cadence consistency vs literal accuracy tension)**: D2 cadence sister Phase 4.1 W0 T0.1 cadence affirm L640 explicitly states "Next § ARCHIVED FROM STATE — Phase 4.0+4.1 will be created by Phase 4.2 ship-time per D2 standing process cadence iter 3" — but Phase 4.0 doesn't exist (Phase numbering skip from Phase 3.4 → Phase 4.1, NOT a real ship); risk = section header "Phase 4.0+4.1" literal preserves cadence consistency但 misleads readers Phase 4.0 was a real phase. **Mitigation**: PATTERNS.md row 1 + Concrete Code Excerpt 2.X explicit "section header literal preserved for cadence consistency, content reflects Phase 4.1 only" disambiguation; PLAN.md W0 T0.1 + W2 T2.1 should include explicit footer note "Phase 4.0 was a numeric placeholder NOT a real shipped phase; Phase 4.1 narrative archived solo per single-phase iter 3 archive" — preserves D2 cadence pattern naming convention without literal accuracy compromise.

5. **R-5 W0.2 SIZE_LIMIT flip outcome unpredictable at plan-phase time (path dep uncertainty)**: W0.2 conditional flip path depends on W0.1 D2 archive outcome (STATE post-archive ≤140L OR >140L); plan-phase cannot pre-determine outcome (depends on Phase 4.1 narrative size in STATE.md L43 verbose 5-bullet format); risk = PLAN.md cannot lock FLIP vs DEFER path at plan-phase. **Mitigation**: planner Wave B PLAN.md W0 T0.2 split into 2 sub-paths (FLIP path 1-line `SIZE_LIMIT = 150` swap + DEFER path #BA carry-forward Phase 4.3 W0); execute-phase chooses path at W0.1 outcome verify time (sister Phase 4.1 W0.5 conditional path executed DEFER — sister precedent).

---

## PATTERN MAPPING COMPLETE
