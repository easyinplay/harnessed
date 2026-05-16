# Phase 2.4 — ASSUMPTIONS

> **Authored**: 2026-05-16
> **Author**: gsd-planner (Wave B)
> **Sources**: `KICKOFF.md` § 1-6 / `2.4-CONTEXT.md` D-01~D-04 / `2.4-DISCUSSION-LOG.md` audit trail / `PATTERNS.md` D-WP-1~D-WP-5 + 12 file analog mapping / `RESEARCH.md` D2.4-1~D2.4-20 + O1~O7 open questions + § 11 STRIDE / `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律 + L74-82 EE-4 4 维原型 + L286 EE-4 PENDING / `.planning/intel/dashboard-handoff-2026-05-16.md` § 3 C 路径 / `.planning/ROADMAP.md` L113-115 / `.planning/STATE.md` Phase 2.4 Prereq Notes L601+
> **Style**: 沿袭 phase 2.3 ASSUMPTIONS.md (§ A acceptance-bar status + § B lock 合并 + § C risks one-line mitigation + § D references)

---

## § A — F1-F8 Acceptance Bar Status Mapping

| Bar | What it asserts | Source artifact | Status entering plan-phase | Mapped Wave |
|-----|-----------------|-----------------|-----------------------------|-------------|
| **F1** | Wave 0 一次性根治 5 项 STATE.md Phase 2.4 Prereq backlog (H3 README CI counter gate B 路径 ~15L yaml + M1 RETRO dashboard polish round 1 历史 cluster 一句补 + M2 schemaVersion 7 surface land 1 consumer + T3 v0.3.0 backlog 预启动注记 (不 land) + deferred-items review 强化 沿袭 Phase 2.3 T0.8) + 新 ADR draft 5 章节 sketch + ADR 编号实占 (不预占 0013) | `.github/workflows/ci.yml` (README counter gate step) + `.planning/intel/omc-comparison.md` (M2 long-tail consumer) + `.planning/RETROSPECTIVE.md` (M1 entry) + `scripts/check-deferred-items.mjs` (T5 cadence 强化) + `docs/adr/0013-*.md` draft | INFRA partial (Phase 2.3 ship: 6 项 W0 backlog 已根治 + transparency + provenance + perf-bench 已 advisory); 5 项 Phase 2.4 W0 backlog 全 PENDING | **Wave 0** |
| **F2** | doctor 5 check MIN scope ship (D-01) — 现 `src/cli/doctor.ts` **152L** (Phase 1.2 ship 4/5 check 已 production: Node ≥ 22 / MCP scope / jq / Win bash flavor) → 加 5th `checkOriginUrl()` + `--json` flag + `CheckResult.status` 三档 (pass/warn/fail) enum 升级; 总增 ~55-65L → ~210L; origin-check helper 抽 `src/cli/lib/origin-check.ts` (~20L, sister to audit 共享) | `src/cli/doctor.ts` (MODIFY, ~55-65L 增) + `src/cli/lib/origin-check.ts` (NEW ≤80L) + `tests/cli/doctor.test.ts` (NEW ~80L) | INFRA partial (4/5 check production); 5th check + helper + JSON flag 待 | **Wave 1** |
| **F3** | EE-4 plan-checker 量化阈值 ABSORB (D-02) — `routing/plan-review-schema.yaml` NEW 4 维 SSOT (yaml-only per D-WP-2 (a)) + `scripts/run-plan-checker.mjs` NEW (~80L walker 沿袭 check-transparency-verdicts.mjs) + Wave 2 spike 跑 Phase 2.3/2.2 task_plan baseline 校准阈值 + `.claude/agents/gsd-plan-checker.md` project-local override ~30L 量化输出节 (D2.4-7); EE-4 BLOCKER auto-rerun **DOWN-SCOPE** 为 CI fail + manual rerun (O1 surface;auto-spawn v0.3.0 feature) | `routing/plan-review-schema.yaml` (NEW ≤60L) + `scripts/run-plan-checker.mjs` (NEW ~80L) + `.claude/agents/gsd-plan-checker.md` (NEW project-local ~30L) + `tests/integration/plan-checker-quant.test.ts` (NEW ~60L) | NOT started;全新 SSOT 路径 | **Wave 2** |
| **F4** | dashboard C 路径 FULL absorb (D-04) — 3 子功能 Wave 3 内 **并行 3 sub-task** (D2.4-8): 3.1 `src/installers/ccHookAdd.ts` NEW (~80L sister npxSkillInstaller) + dispatch 7th entry + InstallType / TypeEnum / install.method schema 三处 enum 加 (D2.4-15);3.2 `scripts/dashboard.mjs` STATE.md watcher + **SSE 替 WebSocket** (D2.4-9 zero-dep) ~50L 增;3.3 `scripts/dashboard.mjs` 多项目 nav + `~/.claude/harnessed-projects.json` (D2.4-12) ~80L 增;dashboard.mjs 505→636L **27% 超软限** dev tool 不计 hard limit (D2.4-11 + O2 surface) | `src/installers/ccHookAdd.ts` (NEW ≤100L) + `src/installers/index.ts` (MODIFY, +1 dispatch + +1 levelOf case) + `src/manifest/schema/spec.ts` (MODIFY, 3 enum 加项) + `src/manifest/schema/installMethods/ccHookAdd.ts` (NEW ~30L) + `scripts/dashboard.mjs` (MODIFY, +~130L) + `manifests/cc-hooks/dashboard-autospawn.yaml` (NEW ≤40L fixture) | NOT started;3 子功能 file scope 不重叠 (T3.1 NEW installer file;T3.2/T3.3 同 dashboard.mjs 不同函数区) | **Wave 3** |
| **F5** | audit 完整版 (D2.4-16 扩 NOT NEW) + ralph-loop Win 兼容 sentinel (D2.4-18 MIN 5 fixture) — `src/cli/audit.ts` 现 **125L** (Phase 1.2 ship manifest 自一致性) → 加 runtime layer ~80L (origin URL hard-fail + 模拟恶意 fork install.cmd injection check + provenance spawn `scripts/check-provenance.mjs`);超 hard limit 抽 `src/cli/lib/audit-helpers.ts` (~50L);Win sentinel 5 fixture (simple-complete / multi-iter / max-iter / subagent-spawn-mock / timeout) CI `if: runner.os == 'Windows'` 步沿袭 Phase 2.3 W0 T0.6 pattern | `src/cli/audit.ts` (MODIFY, +~80L) + `src/cli/lib/audit-helpers.ts` (NEW ≤50L) + `tests/cli/audit.test.ts` (NEW ~60L) + `tests/routing/ralph-loop-win-sentinel.test.ts` (NEW ~80L) + `.github/workflows/ci.yml` (+Win sentinel step ~10L) | NOT started;audit baseline 125L production;ralph-loop unit test 部分覆盖但 Win matrix 未跑 | **Wave 4** |
| **F6** | 30-sample integration e2e (anti-redo discipline — **不重做** Phase 2.3 30 routing sample) — 30 doctor health check fixture (5 check × 6 模拟环境 scenario: clean Linux / clean Mac / clean Win Git Bash / missing jq / wrong Node / tampered origin URL) + 30 plan-checker fixture (Phase 1.1~2.3 现存 plan 跑 plan-review-schema 实测量化输出) + 全链路 e2e doctor → plan-checker → dashboard 多项目 + SSE watcher | `tests/cli/doctor-fixtures.test.ts` (NEW ~120L) + `tests/integration/plan-checker-fixtures.test.ts` (NEW ~80L) + `tests/integration/phase-2.4-e2e.test.ts` (NEW ~100L) | NOT started | **Wave 5** |
| **F7** | A7 守恒 + 新 ADR errata (编号 plan-phase 实占, **NOT 0013** 写作惯例 — D2.4-20) 覆盖 Phase 2.4 全决策 9 章节 sketch (doctor 5 check MIN + EE-4 plan-review-schema + dashboard C 路径 3 子 + README counter gate + audit 完整版 + cc-hook install_type/installMethod/method 三处 enum + ralph-loop Win sentinel + SSE 替 WebSocket rationale + EE-4 BLOCKER down-scope) | `docs/adr/0013-*.md` (NEW) + ci.yml A7 step iter 1-12 → 1-N + ADR 0001-0012 main body 0 diff verify | NOT started;ADR 0012 = Phase 2.3 ship 起点 | **Wave 6** |
| **F8** | ship + v0.2.0 4/4 close milestone — 3-OS CI 全绿 (Wave 0/2/4 加固 step 全跑 + Win sentinel 跑通) + adr-0013-accepted baseline tag + ci.yml A7 iter 1-12 → 1-N + ADR 0001-0012 main body 0 diff + `v0.2.0-alpha.4-doctor` candidate tag + **`v0.2.0` milestone tag** (大里程碑 — 沿袭 Phase 1.5 v0.1.0 close 模式) + `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` archive + `.planning/v0.2.0-MILESTONE-AUDIT.md` audit + ROADMAP § v0.2.0 全 4 phase ✅ + STATE.md 续编 Phase 2.4 SHIPPED + RETROSPECTIVE.md milestone retrospective + v0.3.0 启动 prereq (T3 backlog + plan-feature workflow + checkpoint cadence) | `ci.yml` + git tag (3 个) + milestone archive 3 files + ROADMAP / STATE / RETROSPECTIVE | NOT started | **Wave 6** |

---

## § B — Consolidated Decision Locks

合并 4 处来源:**CONTEXT D-01~D-04**(discuss-phase 4 锁)+ **RESEARCH D2.4-1~D2.4-20**(researcher 决议 + R2 critical findings)+ **PATTERNS D-WP-1~D-WP-5**(pattern-mapper 提案 → plan-phase 决)+ **intel directive 必上一项**(EE-4 PENDING L74-82 L286 + § 0 SSOT 引用纪律)+ **STATE.md L601+ Phase 2.4 Prereq**。同号但跨来源不同语义统一 → CONTEXT 主、RESEARCH 补、PATTERNS 提案选项。

### B.1 doctor 5 check MIN scope (D-01)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-01** | doctor 主流程 scope = **MIN 5 check** (Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL 校验);weekly cron + plugin uninstall 4 步 fallback **DEFER v0.3+ 评估** (Karpathy YAGNI) | CONTEXT D-01 |
| **B-02** | doctor.ts 实际增量 = **~55-65L** (现 152L → ~210L, **超 hard limit ≤200L ≈ 5%**) — **R2 critical finding 修正 KICKOFF "38L → 150L" stale 数字** (38L 是 Phase 1.2 pre-ship baseline,已 ship 152L 含 4/5 check) | RESEARCH D2.4-1 + § 1.1 actual count |
| **B-03** | doctor.ts split 决策 = **维持 single-file ~210L 容忍 5% 超限** (D-WP-3 (a)) — Karpathy "Don't split until pain";`src/cli/lib/origin-check.ts` 抽 helper 是 sister-share rationale 非 split signal (D2.4-3);v0.3+ 加 weekly cron / upstream_health 时再评估 split | PATTERNS D-WP-3 + RESEARCH D2.4-1 → **PLANNER LOCK** |
| **B-04** | 5 check method exact 实现 (4/5 已 production, 不动): Node = `process.versions.node` 内建 (零 spawn);MCP scope = 双源检 `.mcp.json` + `~/.claude.json` no `mcpServers` (CC #54803 red flag);jq = `where`/`which` + 3 OS fix hint;Win bash flavor = `where bash` + `bash -c 'echo $WSL_DISTRO_NAME'` 探 WSL fork bug (Phase 1.1 finding) | RESEARCH § 1.2.1-1.2.4 (已 production 直证) |
| **B-05** | origin URL check (5th NEW, ~25L) — expected URL 源 = **`package.json` `repository.url` 字段** (SSOT, NOT manifest 第二来源);git remote 比对 + normalize (strip `.git` / `git@`-vs-`https`);fail mode = **`warn` not `fail`** (D2.4-2 — fork 是合法用例);helper 抽 `src/cli/lib/origin-check.ts` ≤80L sister to audit 完整版 共享 | RESEARCH § 1.2.5 + D2.4-2 + D2.4-3 |
| **B-06** | `--json` flag + 三档 (pass/warn/fail) exit policy: warn=exit 0 (advisory), fail=exit 1 (blocking);CI 用 `harnessed doctor --json \| jq '.summary'` 解析 (D2.4-4) | RESEARCH § 1.3 + D2.4-4 |
| **B-07** | `CheckResult` schema 升级 `{ok: boolean, detail}` → `{status: 'pass'\|'warn'\|'fail', message, fix?}` (rename `detail` → `message`, 向后兼容 derive `ok = status === 'pass'`) | RESEARCH § 1.1 schema upgrade + § 1.2.5 fix mode |

### B.2 EE-4 plan-checker quantitative rubric ABSORB (D-02)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-08** | EE-4 timing = **ABSORB-2.4** (Phase 2.4 doctor 完整版 sister cluster 拉入 — doctor 查项目 + audit 查 origin + plan-checker 查 plan,三者 sister "项目级 health check" 语义一致) | CONTEXT D-02 + intel L74-82 + L286 |
| **B-09** | EE-4 schema 形态 = `routing/plan-review-schema.yaml` (NEW ≤60L) 4 维 SSOT — `dimensions.{file_references_verified: 1.0, reference_sources_real: 0.8, concrete_acceptance: 0.9, business_logic_assumptions: 0}` + `scoring.{pass_threshold: 4, warning_threshold: 3, blocker_threshold: 2}` + `verdict_mapping` (PASS / APPROVED WITH CONDITIONS / REJECTED);**NOT vendor 希腊神话 prompt** (D2.4-5;intel L80 直证 不复刻 Metis/Momus 字眼) | RESEARCH § 2.1 + D2.4-5 + intel L80 |
| **B-10** | EE-4 schema location 路径 = **yaml-only SSOT** (D-WP-2 (a)) — NOT TypeBox regen (Karpathy YAGNI);run-plan-checker.mjs 直接 `parseYaml + runtime apply threshold`;无 schema fragment IDE 提示 / 无 ci regen drift gate 是 acceptable trade-off;Phase 2.5+ 若 schema 频繁演化再升级 (b) TypeBox regen | PATTERNS D-WP-2 + D-02 Hard Constraint #5 → **PLANNER LOCK** |
| **B-11** | EE-4 enforcement path = `scripts/run-plan-checker.mjs` NEW (~80L 沿袭 check-transparency-verdicts.mjs walker L29-36 + ENFORCE=true 模式);CI step `for phase_dir in .planning/phase-*/; do node scripts/run-plan-checker.mjs "$phase_dir" > "${phase_dir}plan-check.json" \|\| exit 1; done`;BLOCKER (≤2/4) → process.exit(1) + GHA `::error::` annotation | RESEARCH § 2.4 + PATTERNS § 2.4 + 2.12 |
| **B-12** | EE-4 BLOCKER **auto-rerun plan-phase = DOWN-SCOPE** (D2.4-6 — surface O1) — Phase 2.4 MIN: CI fail + 显式 `::error::` annotation + 用户看到 GHA error → 手动 `/gsd-plan-phase` rerun;**NOT** auto-spawn agent (needs orchestration layer, v0.3.0 feature);KICKOFF § 1.2 F3 "不达标自动触发 plan-phase 重跑" wording **明示 down-scope 到 manual rerun** | RESEARCH § 2.4 + D2.4-6 + O1 |
| **B-13** | gsd-plan-checker 改造路径 = **`.claude/agents/gsd-plan-checker.md` project-local override** (~30L 加 EE-4 量化 JSON 输出节);NOT 改全局 `~/.claude/agents/gsd-plan-checker` (不在 repo scope, 沿袭 D-WP project-local override 模式);Phase 2.4 W2 ship 该 override file (D2.4-7) | RESEARCH § 2.3 + D2.4-7 |
| **B-14** | 4 维 exact 计算 algorithm (Wave 2 plan-phase 实占) — file_references_verified: grep `files_modified:` / `files_created:` lines + `fs.access()` ratio (NEW prefix exempt);reference_sources_real: regex `decision_source:\|see:\|ref:` + `fs.access()` ratio (≥80% 容忍 stale ref);concrete_acceptance: `acceptance_criteria:` blocks regex heuristic (含 `grep -c\|wc -l\|exit \d+\|≤\d+L`) ratio;business_logic_assumptions: regex `assumed\|presumably\|should be\|likely\|probably\|maybe` count (白名单 `assumed (per D-NN)` 不计) | RESEARCH § 2.2.1-2.2.4 |
| **B-15** | EE-4 阈值 baseline 实测 **必在 Wave 2 ship plan-review-schema.yaml 之前 spike** (Wave 2 子 task) — 跑 Phase 2.3/2.2 现存 task_plan.md 出 4 维分布;若 ≥1 plan 落 BLOCKER (≤2/4) 则阈值过严,放宽候选 (e.g. `concrete_acceptance` ≥90% → ≥80%);spike outcome 进 task_plan 顶部 Resolved block (沿袭 Phase 2.3 T0.10 always_active spike Resolved 模式) | RESEARCH § 2.6 + O3 + Phase 2.3 T0.10 sister precedent |

### B.3 README CI counter gate B 路径 (D-03)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-16** | README counter integrity = **B 路径** (Wave 0 加 CI counter gate ~15L yaml step 三计数一致才 PASS) — README 用户面 enumeration 保留 visible (NOT 激进 A 路径删 README 收敛 STATE.md);沿袭 Phase 2.2 T0.4 freshness gate pattern + Phase 2.3 W0 T0.5 schemaVersion grep gate sister | CONTEXT D-03 |
| **B-17** | README counter gate exact yaml regex (planner Wave 0 实占校准当前 README 行格式后 lock):`SHIPPED=$(grep -cE "Phase 2\.[0-9]+ shipped" README.md)` + `BARS=$(grep -cE "Acceptance bar [A-Z][0-9]" README.md)` + `L44=$(sed -n '44p' README.md \| grep -oE '[0-9]+/4' \| head -1 \| cut -d/ -f1)`;三者比对 if 不一致 `exit 1` + `::error::` annotation;**Wave 0 pre-flight calibration**: plan-phase 在 push CI 前 local 跑 grep 校准防第一 push 即红 | CONTEXT D-03 hint L65-75 + RESEARCH § 4.3 + PATTERNS § 2.10 |

### B.4 Dashboard C 路径 FULL absorb (D-04)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-18** | dashboard C 路径 absorb = **FULL** (intel § 3 全 ~160L 进 doctor sister cluster) — heptagent ADD 形态 ancestor prototype;3 子功能强 coupling 拆开失去 sister 语义 | CONTEXT D-04 |
| **B-19** | Wave 3 拓扑 = **3 sub-task 并行** (T3.1 cc-hook installer / T3.2 SSE watcher / T3.3 多项目) — D2.4-8;3 子功能 file scope 不重叠 (T3.1 NEW installer file; T3.2/T3.3 同 dashboard.mjs 但不同函数区);**merge 顺序约束**: T3.2 先 merge (~50L 增量短),T3.3 rebase (~80L 增量) — 沿袭 A7 (assumption 中 surface) | RESEARCH D2.4-8 + A7 |
| **B-20** | 3.1 cc-hook installer naming = **method `cc-hook-add`** (sister `mcp-stdio-add` / `mcp-http-add`);file `src/installers/ccHookAdd.ts` (camelCase sister with `mcpStdioAdd.ts`);**NOT** D-WP-4 (c) `ccHook.ts` (`-add` verb suffix sister precedent 直证 — D2.4-13) | RESEARCH § 3.5.1 + D2.4-13 |
| **B-21** | 3.1 cc-hook installer target path = `~/.claude/settings.json` (single file, `hooks` block deep-merge, idempotent);跨平台 `os.homedir() + '/.claude/settings.json'` (NOT `~/.config/claude/` fallback — CC 未支持 XDG);L3 level (system-config tier sister to mcp-stdio-add / mcp-http-add);closest analog = `npxSkillInstaller.ts` (L2, 217L) ≤100L hard limit (D2.4-14) | RESEARCH § 3.5.2 + § 3.5.3 + D2.4-14 |
| **B-22** | 3.1 schema extension 路径 (**R2 critical finding — KICKOFF "TypeBox enum 加 cc-hook 字段" 不够精确,实际需 3 处 enum 加项**):(a) `InstallType` union +1 `'hook'` → 5 enum;(b) `TypeEnum` union +1 `'cc-hook'` → NEW type (1:1 与 install_type);(c) `install.method` union +1 `'cc-hook-add'` → 7 method;(d) `install` 字段加 3 optional field: `hook_event` (enum SessionStart\|UserPromptSubmit\|PreToolUse\|PostToolUse) / `hook_matcher` (string regex) / `hook_command` (string);(e) NEW `src/manifest/schema/installMethods/ccHookAdd.ts` ~30L (复刻 npxSkillInstaller schema shape) + branches[] 加 7th entry | RESEARCH § 3.5.3 + D2.4-15 + PATTERNS § 2.7 |
| **B-23** | 3.2 STATE.md watcher push 实现 = **SSE 替 WebSocket** (D2.4-9 + D-WP-5 (c)) — zero-dep + 单向 push 完美 fit + 浏览器原生 EventSource API + 自动 reconnect;NOT `ws` npm pkg (破 dashboard.mjs "zero external deps" 原则 L11);NOT raw http upgrade + frame parse (~30L 手 implement WS protocol bug risk MED-HIGH);intel L237 sketch 写 ws 是 default thinking,SSE 是 superior 选 for 单向 server-push | RESEARCH § 3.2.2 + D2.4-9 + PATTERNS D-WP-5 → **PLANNER LOCK** |
| **B-24** | 3.2 `fs.watch` scope = **仅 watch 单文件 `.planning/STATE.md`** (NOT recursive, Win 不稳 — ReadDirectoryChangesW 2-3 fire per save);debounce 500ms 关键 (intel sketch L171 直证);Linux inotify / macOS FSEvents / Win 三平台一致 (D2.4-10) | RESEARCH § 3.2.1 + D2.4-10 |
| **B-25** | 3.3 多项目 config 源 = `~/.claude/harnessed-projects.json` (sister with `~/.claude/{settings,skills,agents}/` 生态 — D2.4-12);URL routing `?project=<path>` + `history.pushState` 无 reload (intel L246-248 sketch);dashboard serve `/api/projects` + `/api/project/<id>/state` endpoint;首次创建 trigger = dashboard 启动检无则 auto-init (默认 cwd as first project — O7 MIN);CLI `--add-project` flag 推 v0.3.0 enhancement | RESEARCH § 3.3 + D2.4-12 + O7 |
| **B-26** | dashboard.mjs split 决策 = **保持单文件 505→636L 27% 超软限** (D2.4-11 + D-WP-1 (a)) — dev tool (scripts/) 不计 Karpathy hard limit ≤200L (那是 src/ 核心代码),sister to `scripts/check-transparency-verdicts.mjs` / `scripts/check-provenance.mjs`;软上限 ~700L (O2 surface — 若用户复审决要 split,Wave 3 末加 T3.4 split sub-task 拆 SHELL HTML 到 `scripts/dashboard/shell.mjs` ≈250L);**Wave 3 T3.4 PARTIAL split sub-task** (per D-WP-1 (c) 折衷推荐): T3.1+T3.2+T3.3 完成后 `wc -l scripts/dashboard.mjs` > 650L 则触发 T3.4 split (mid-wave gate, R8) | RESEARCH § 3.4 + D2.4-11 + D-WP-1 + O2 |
| **B-27** | SSE endpoint security = `localhost-only bind` (现 dashboard L478 默认 `listen(PORT)` 绑 0.0.0.0,**应改 `'127.0.0.1' bind`** — Wave 3 T3.2 显式 sub-step) — 防 SSE endpoint 被恶意 client 大量 connect resource exhaustion (RESEARCH § 11 STRIDE) | RESEARCH § 11 + § 3.2 |

### B.5 audit 完整版 + Win sentinel (F5)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-28** | audit 完整版 = **扩 `src/cli/audit.ts` NOT NEW file** (**R2 critical finding** — KICKOFF § 1 F5 "audit (NEW or 扩 doctor)" wording 校正:audit.ts 已 ship 125L Phase 1.2;Phase 2.4 是 +~80L runtime layer 扩展);现 manifest layer 不动 (schema validation + 3 自一致性 check);加 runtime layer:(a) origin URL hard-fail (allowFork=false, vs doctor warn) 复用 `src/cli/lib/origin-check.ts`;(b) 模拟恶意 fork 检测 (install.cmd 含 shell separator `;&\|`\$\` injection risk + upstream ↔ install.cmd 引 npm pkg / git repo 一致性 cross-check);(c) provenance 完整性 (spawn `node scripts/check-provenance.mjs` 不重 implement) | RESEARCH § 4.1.1-4.1.3 + D2.4-16 + D2.4-17 |
| **B-29** | audit.ts split 决策 = **抽 `src/cli/lib/audit-helpers.ts` ≤50L** (audit.ts 125 → ~210L 超 hard limit 5%,与 doctor.ts split 决策 sister 对齐);audit.ts cli orchestration ~150L under hard limit (D2.4-16) | RESEARCH § 4.1.4 + D2.4-16 |
| **B-30** | ralph-loop Win sentinel scope = **MIN 5 fixture** (D2.4-18 + KICKOFF "5 fixture sample" 校准):simple-complete / multi-iter (3 iter) / max-iter-exceeded / subagent-spawn (Win bash fork test — Phase 1.1 finding 直证) / timeout (SIGKILL parity);**anti-redo discipline** — NOT 30 sample (Phase 2.3 sister 不重做);CI step `if: runner.os == 'Windows'` + `shell: bash` 沿袭 Phase 2.3 W0 T0.6 provenance pwsh sentinel pattern;subagent-spawn fixture = **mock subagent** (O5 — real CC SDK 需 ANTHROPIC_API_KEY, Phase 2.4 OOS 推 v0.3.0 prep T1.1 sister) | RESEARCH § 4.2.2 + D2.4-18 + O5 |
| **B-31** | 30-sample integration scope (F6) = **30 doctor fixture (5 check × 6 env scenario) + 30 plan-checker fixture (Phase 1.1~2.3 现存 plan 实测)** — anti-redo Phase 2.3 30 routing sample (D2.4-19);doctor fixture 6 env scenario: clean Linux / clean Mac / clean Win Git Bash / missing jq / wrong Node / tampered origin URL | KICKOFF § 1.2 F6 + D2.4-19 |

### B.6 Wave 0 prereq backlog 一次根治 (F1)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-32** | Wave 0 处理 = **ALL-W0 5 项** (沿袭 Phase 2.1/2.2/2.3 Wave 0 模式) — H3 README CI counter gate (Wave 0 ship per B-16) + M1 RETRO dashboard polish 历史 cluster 一句补 + M2 schemaVersion 7 surface land 1 consumer (planner 5 候选选 1 最低 friction) + T3 v0.3.0 backlog 预启动注记 (不 land) + deferred-items review 强化 (沿袭 Phase 2.3 T0.8 check-deferred-items.mjs warn-only);**T2 dashboard C-path D-04 absorb 不重复 W0 处理** (Wave 3 ship) | CONTEXT D-07 hint + STATE.md L601+ + KICKOFF § 1.2 F1 |
| **B-33** | M2 schemaVersion long-tail consumer 5 候选选 1 = **`scripts/check-provenance.mjs`** (最低 friction surface — 已 production Phase 2.2 ship,加 1 行 `branchOnSchemaVersion(manifest.schemaVersion, ...)` consumer call 即可);其他 4 候选 (handoff-doc / phases-yaml / installer-state / route-decision-log / checkpoint / agent-definition-factory) v0.3.0+ 逐步扩 — 与 ADR errata § 7 schemaVersion adoption status 同步 (与 Phase 2.3 W0 T0.5 grep gate ≥2 阈值 honest baseline 一致) | RESEARCH § 0 prereq backlog + Phase 2.3 B-29 sister precedent |
| **B-34** | Wave 0 task 排序 = **T0.1 ADR 编号实占 + sed-replace placeholder discipline FIRST** (sister Phase 2.3 T0.1) → T0.2 ADR draft 9 章节 sketch → T0.3 README counter gate (校准 + ship) → T0.4 M2 schemaVersion long-tail land → T0.5 M1 RETRO entry + T3 v0.3.0 prep + deferred-items 强化 (parallel 纯文档) → T0.6 3-OS CI 跑通 gate verify | KICKOFF § 2 + 推理 |

### B.7 ADR & A7 守恒 (F7)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-35** | 新 ADR errata 覆盖 Phase 2.4 全决策 (沿袭 phase 1.4 ADR 0008 + phase 2.2 ADR 0011 + phase 2.3 ADR 0012 多决策合并 errata 模式) — 内部章节 sketch **9 章节**:① doctor 5 check MIN + ~210L 容忍超 5% + origin-check helper sister-share ② EE-4 plan-review-schema.yaml 4 维 SSOT (yaml-only) + run-plan-checker.mjs walker + project-local override agent ③ EE-4 BLOCKER **down-scope** rationale (auto-rerun → manual rerun, v0.3.0 feature) ④ dashboard C 路径 3 子功能 sister cluster + 3 sub-task 并行 ⑤ SSE 替 WebSocket rationale (zero-dep + 单向 push) ⑥ cc-hook installer + 3 处 schema enum 加 (InstallType + TypeEnum + install.method) ⑦ README CI counter gate B 路径 + 三计数一致 ⑧ audit 完整版 扩 audit.ts (not NEW) + helper split + Win sentinel 5 fixture MIN ⑨ Wave 0 backlog 一次根治 (M2 schemaVersion land 1 consumer + B1 plan-check fix grep gate ≥2 → ≥N 阈值 bump if applicable) | CONTEXT D-06 (无,Phase 2.4 新 ADR 错峰) + KICKOFF § 3 Hard Constraint #2 + 推理 |
| **B-36** | **ADR 编号 = plan-phase 实占,绝不预占 `0013`** (intel § 0 + CONTRIBUTING.md 项目级 SSOT 引用纪律 + D2.4-20) — 本 phase 所有文档 (KICKOFF/PATTERNS/RESEARCH/ASSUMPTIONS/PLAN/task_plan/NEW ADR/PLAN-CHECK) 写 `0013` placeholder;**禁写 `ADR 0013`**;T0.1 sed-replace discipline 批量 resolve (Phase 2.1 W1 + Phase 2.3 T0.1 plan-check fix 沿袭) | PATTERNS § 5 + RESEARCH D2.4-20 + KICKOFF § 3 Hard Constraint #2 |
| **B-37** | **A7 守恒持续**:ADR 0001-0012 main body **0 diff** (Phase 2.4 新 ADR 走 errata 路径);ship 时 baseline tag `1-12 → 1-0013`;CI `ci.yml` A7 step iter 同步 (iter 1-12 → 1-N);`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 不动 | KICKOFF § 3 Hard Constraint #1 + #10 |

### B.8 Karpathy Hard Limits & File Split (F2-F5)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-38** | Karpathy 5 hard limit 继承:`engine.ts` ≤200L / `agentDefinition.ts` ≤200L (H3 errata cap) / `systemPrompt.ts` ≤80L / `ralphLoop.ts` ≤50L 主体 / `promiseExtract.ts` ≤50L (本 phase **不动** 这 5 file);新 file hard limit:`doctor.ts` ≤200L 容忍 ~210L 5% 超限 (B-03) / `cc-hook-installer.ts ccHookAdd.ts` ≤100L / `origin-check.ts` ≤80L / `audit.ts` ≤200L (split helper 后 ~150L) / `audit-helpers.ts` ≤50L / `run-plan-checker.mjs` ≤100L / `plan-review-schema.yaml` ≤60L | KICKOFF § 3 Hard Constraint #8 + PATTERNS § 1 |
| **B-39** | dashboard.mjs **soft cap ≤700L** (dev tool, NOT enforced as hard limit per B-26) — 505→636L 27% 超软限 acceptable;若 Wave 3 实测 wc > 650L → 触发 Wave 3 T3.4 PARTIAL split sub-task (D-WP-1 (c) 折衷) | RESEARCH § 3.4 + D-WP-1 + O2 |
| **B-40** | TypeBox not zod — schema 改动用 `@sinclair/typebox` `Type.*`;沿袭 ADR 0010/0011/0012 errata 注释块 fence 模式;新 ADR errata 注释行 `// ADR 0013 errata — <topic> (phase 2.4 W<N> — F<N>)`;3 处 enum 加项 (InstallType + TypeEnum + install.method) 全 TypeBox additive | KICKOFF § 3 Hard Constraint #3 |
| **B-41** | A8 LF line endings — 所有新文件 LF;Win 测试需 Git Bash;新 `plan-review-schema.yaml` + `ccHookAdd.ts` + `origin-check.ts` + `audit-helpers.ts` + `dashboard-autospawn.yaml` fixture + dashboard.mjs 扩展 + `harnessed-projects.json` 全 LF | KICKOFF § 3 Hard Constraint #9 |

### B.9 v0.2.0 milestone close (F8)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-42** | Wave 6 ship 三 tag (沿袭 Phase 1.5 v0.1.0 close 模式):(a) `adr-0013-accepted` baseline tag;(b) `v0.2.0-alpha.4-doctor` candidate tag (v0.2.0 alpha cycle 末 alpha);(c) **`v0.2.0` milestone tag** (大里程碑 — v0.2.0 alpha cycle close,4/4 phase ship 完结) | KICKOFF § 1.2 F8 + Phase 1.5 v0.1.0 close sister precedent |
| **B-43** | v0.2.0 milestone archive 3 files:`.planning/milestones/v0.2.0-ROADMAP.md` (current ROADMAP § v0.2.0 snapshot) + `.planning/milestones/v0.2.0-REQUIREMENTS.md` (REQUIREMENTS.md scope) + `.planning/v0.2.0-MILESTONE-AUDIT.md` (v0.2.0 4 phase 历史 ship 审计 + cumulative metric);ROADMAP § v0.2.0 4 phase 全打 ✅;STATE.md 续编 Phase 2.4 SHIPPED + v0.3.0 启动 prereq | KICKOFF § 1.2 F8 + Phase 1.5 sister precedent |

### B.10 RESOLVED conflict chain notes

- **R2 critical finding 1 (doctor.ts 现 152L 不是 38L)** vs **KICKOFF § 1 "38L → 150L" wording** — **统一**:F2 文案改 "现 152L → ~210L (+~55-65L)";真实增量 ≈ 5th check ~25L + `--json` flag ~15L + status enum 升级 ~10L + 接 helper ~5L;ADR errata 章节 ① wording 同步;sister Phase 2.3 Wave B 调过 KICKOFF wording 先例 (允许)
- **R2 critical finding 2 (audit.ts 已存在 125L)** vs **KICKOFF § 1 F5 "audit (NEW or 扩 doctor)" wording** — **统一**:F5 文案明示 "扩 audit.ts NOT NEW";audit 完整版 = +~80L runtime layer (origin URL hard-fail + 模拟 fork + provenance spawn);split helper `audit-helpers.ts` ≤50L
- **R2 critical finding 3 (dashboard.mjs 现 505L 不是 KICKOFF 推算 ~475L)** — **统一**:Phase 2.4 增量 ~130L 后 ≈ 636L (27% 超软限);D2.4-11 + B-26 + B-39 + O2 surface trade-off,dev tool 不计 hard limit;Wave 3 T3.4 PARTIAL split fallback if `wc -l > 650L`
- **R2 critical finding 4 (STATE.md watcher 推 SSE not WebSocket)** vs **intel L237 / KICKOFF F4 default thinking ws** — **统一**:D2.4-9 + B-23 lock SSE (zero-dep + 单向 push + EventSource);intel L237 写 ws 是 default thinking,SSE 是 superior 选 for 单向 server-push 场景;ADR errata 章节 ⑤ surface rationale
- **R2 critical finding 5 (EE-4 BLOCKER auto-rerun down-scope)** vs **KICKOFF § 1 F3 "不达标自动触发 plan-phase 重跑" wording** — **统一**:D2.4-6 + B-12 + O1 surface down-scope (Phase 2.4 MIN: CI fail + manual rerun, NOT auto-spawn);auto-spawn 推 v0.3.0 orchestration layer feature;ADR errata 章节 ③ surface rationale
- **R2 critical finding 6 (EE-4 4 维阈值 baseline 必 Wave 2 实测)** — **统一**:B-15 lock Wave 2 spike sub-task (跑 Phase 2.3/2.2 task_plan.md baseline);spike outcome 进 task_plan 顶部 Resolved block (沿袭 Phase 2.3 T0.10 always_active spike Resolved 模式);若 ≥1 plan 落 BLOCKER 则阈值放宽 (`concrete_acceptance` 0.9 → 0.8)
- **D-WP-1 (a/b/c) PATTERNS proposal** + **D2.4-11 RESEARCH 推荐 (a)** → **B-26 + B-39 = (a) 默认单文件 + (c) PARTIAL split fallback gate** (原因:dev tool 不计 hard limit + 折衷 trade-off)
- **D-WP-2 (a/b) PATTERNS proposal** + **D-02 Hard Constraint #5** → **B-10 = (a) yaml-only SSOT** (原因:Karpathy YAGNI + 不双源)
- **D-WP-3 (a/b) PATTERNS proposal** + **D2.4-1 RESEARCH** → **B-03 = (a) 维持 single-file** (原因:hard limit 仅超 5% + Karpathy "Don't split until pain")
- **D-WP-4 (a/b/c) PATTERNS proposal** + **D2.4-13 RESEARCH 推荐 (b)** → **B-20 = (b) `cc-hook-add` method + `ccHookAdd.ts` file** (原因:`-add` verb suffix sister `mcp-stdio-add` / `mcp-http-add` 直证)
- **D-WP-5 (a/b/c) PATTERNS proposal** + **D2.4-9 RESEARCH 推荐 (c)** → **B-23 = (c) SSE** (原因:zero-dep + 单向 push 完美 fit + 浏览器原生 EventSource)
- **Q3 cc-hook hook_type field 第 4 字段 (O4 from RESEARCH)** — **MIN scope: 仅 `type: 'command'` (intel dashboard handoff L19 sketch),v0.3+ 评估 inline script type** (Karpathy YAGNI)
- **Q5 subagent-spawn fixture mock vs real SDK (O5 from RESEARCH)** — **mock subagent** (real SDK 需 ANTHROPIC_API_KEY, Phase 2.4 OOS, 推 v0.3.0 prep T1.1 sister)
- **Q6 SSE polling 替换 (O6 from RESEARCH)** — **MIN: SSE 替换 polling 完全** (浏览器 EventSource 内建 reconnect 兜底,Karpathy YAGNI 不双轨)
- **Q7 harnessed-projects.json 首次创建 trigger (O7 from RESEARCH)** — **MIN: dashboard 启动检无则 auto-init** (默认 cwd as first project,CLI `--add-project` 推 v0.3.0)

**No unresolved cross-source conflicts.** All decision chains converge.

---

## § C — Risk Register

| ID | Risk | Severity | Mitigation (one-line) |
|----|------|---------|----------------------|
| **R1** | `doctor.ts` 152→~210L 超 hard limit ≤200L 5% (B-02 + B-03) | LOW | 默认 inline 容忍;若 wc > 215L → fallback split `src/cli/doctor/{node-check,mcp-check,jq-check,win-bash-check,origin-check}.ts` + `doctor.ts` 50L orchestrator (D-WP-3 (b)) — Wave 1 mid-task gate |
| **R2** | `audit.ts` 125→~210L 超 hard limit ≤200L 5% (B-28 + B-29) | LOW | 抽 `src/cli/lib/audit-helpers.ts` ≤50L 默认 ship (NOT fallback) — Wave 4 T4.1 sub-step;audit.ts cli orchestration ~150L under hard limit |
| **R3** | EE-4 4 维 weasel-word grep `assumed\|presumably` 产生 false positive (RESEARCH A3 MED-HIGH) | MEDIUM | Wave 2 spike (B-15) 跑 Phase 2.3/2.2 plan baseline 校准;白名单 `assumed (per D-NN)` / `assumed (locked)` 不计;若 baseline ≥2 false-pos/plan 则 expand 白名单 + lower `concrete_acceptance` 阈值 0.9 → 0.8 |
| **R4** | EE-4 BLOCKER 误触发 spurious CI fail 阻 ship (RESEARCH § 11 STRIDE) | LOW-MEDIUM | B-12 down-scope CI fail + manual rerun 而非 auto-spawn (避免 cascade fail);Wave 2 spike baseline 校准阈值;若 spike 后 ≥1 现存 plan BLOCKER → 阈值放宽 |
| **R5** | dashboard.mjs 505→636L 27% 超软限 (B-26) | LOW | Dev tool 不计 hard limit (sister scripts/check-* 模板成熟);若 Wave 3 实测 wc > 650L → 触发 Wave 3 T3.4 PARTIAL split sub-task 拆 SHELL HTML (~250L) 到 `scripts/dashboard/shell.mjs` (D-WP-1 (c)) |
| **R6** | `fs.watch` Win debounce 500ms 不足吸收 ReadDirectoryChangesW 重复 fire (RESEARCH A2 MEDIUM) | MEDIUM | 仅 watch 单文件 `.planning/STATE.md` (B-24);若 Win 实测 >500ms 间隔重复 fire → 加 content hash check 兜 (mtime+content sha256 二次去重);Wave 3 T3.2 mid-task gate |
| **R7** | `~/.claude/settings.json` JSON deep-merge 破现有 user hooks 块 (RESEARCH A4 MEDIUM) | MEDIUM | cc-hook installer (B-21) 加 idempotent check (matching hook 已存 skip) + backup() before write (sister npxSkillInstaller L154-155) + verify (re-read JSON.parse + grep hook_command present);Wave 3 T3.1 mid-task gate |
| **R8** | Wave 3 T3.2 + T3.3 同改 dashboard.mjs 但函数区不重叠,merge conflict (B-19 + A7) | LOW-MED | git merge convention sister Phase 2.1 多 sub-task 并行先例;T3.2 先 merge (~50L 增量短), T3.3 rebase (~80L);若 conflict → planner 介入手动 reconcile |
| **R9** | cc-hook 7th method 加 3 处 schema enum (B-22) 漏一处 (e.g. `TypeEnum` 忘加 `'cc-hook'`) | LOW | Wave 3 T3.1 acceptance criteria 三处 grep verify (`grep -E "'hook'" src/manifest/schema/spec.ts` + `grep -E "'cc-hook'" src/manifest/schema/spec.ts` + `grep -E "'cc-hook-add'" src/manifest/schema/spec.ts`);TypeBox runtime validate fixture catch |
| **R10** | README counter gate 第一 push 即 CI red (regex 校准不准) (B-17 pre-flight) | LOW | Wave 0 T0.3 pre-flight calibration: plan-phase 在 push CI 前 local 跑 grep 校准当前 README.md 三计数实际值;若 SHIPPED/BARS/L44 当前不一致 → 先修 README 漂移再 ship gate |
| **R11** | ADR 编号实占冲突 (plan-phase 实占 N 时,git 上已有 N — 并发其他 phase 占了) | LOW | T0.1 第一步 `ls docs/adr/` + `max(NNNN) + 1`;solo 开发无并发;沿袭 Phase 2.1 W1 + Phase 2.3 T0.1 sed-replace discipline (B-36) |
| **R12** | `v0.2.0` milestone tag 已存在 (Phase 1.5 v0.1.0 sister 但 v0.2.0 已开 4 phase) | LOW | Wave 6 T6.4 第一步 `git tag --list v0.2.0` 检 — 若不存在则 create;若存在 (e.g. earlier alpha tag occupies) → fallback `v0.2.0-final` or alpha.4-doctor only (planner Wave 6 决) |
| **R13** | Win sentinel subagent-spawn fixture mock 与真实 SDK 行为偏 (B-30 + O5) | LOW-MED | Phase 2.4 MIN: mock subagent (real SDK Phase 2.4 OOS);v0.3.0 prep T1.1 sister 用 real ANTHROPIC_API_KEY 升级 sentinel |

---

## § D — References

### D.1 In-phase 上游产出
- `.planning/phase-2.4/KICKOFF.md` — § 1-6 (F1-F8 + Wave 拓扑 + 10 hard constraint + R1/R2 分工 + 预算 + 边界)
- `.planning/phase-2.4/2.4-CONTEXT.md` — discuss-phase 4 D-决策 D-01~D-04 + canonical refs
- `.planning/phase-2.4/2.4-DISCUSSION-LOG.md` — audit trail
- `.planning/phase-2.4/PATTERNS.md` — 12 file analog mapping + ~76% reuse + 5 D-WP proposals
- `.planning/phase-2.4/RESEARCH.md` — 4 fresh research topics + 20 D2.4-* decision locks + O1-O7 open questions + R2 critical findings

### D.2 Carry-forward 主依据
- `.planning/intel/omc-comparison.md` — L74-82 EE-4 omo Metis + Momus 4 维原型 + L286 EE-4 PENDING Phase 2.4 absorb + § 0 SSOT 引用纪律 + § v0.2.0+ actionable table
- `.planning/intel/dashboard-handoff-2026-05-16.md` § 3 — C 路径主依据 ~160L 全 absorb (3.1 SessionStart hook auto-install + 3.2 STATE.md watcher + 3.3 多项目支持)
- `.planning/ROADMAP.md` L113-115 — Phase 2.4 必含项 5 项 (jq/Git Bash 探测 + weekly cron + origin URL + uninstall 4 步 + Win ralph-loop) + 验收 (Windows native CI + audit origin/恶意 fork)
- `.planning/STATE.md` L601+ — Phase 2.4 Prereq Notes 5 项 (H3 README CI counter / M1 dashboard polish RETRO / M2 schemaVersion long-tail / T2 dashboard C-path D-04 absorb / T3 v0.3.0 prep)
- `.planning/phase-2.3/2.3-CONTEXT.md` D-06 + Deferred Ideas — EE-4 DEFER-2.4 决议依据;ADR 编号 plan-phase 实占 (**不预占 0013**)
- `.planning/phase-2.3/RETROSPECTIVE.md` — Phase 2.3 ship 后 lessons (H3 root-cause-class README counter 第 3 次复发分析 + dashboard polish round 1 cluster)

### D.3 Frozen 接口契约 (本 phase 升级或消费)
- `src/routing/engine.ts` — main-process-driven routing engine + SDK query() + ralph-loop wrap (Phase 2.2 ship;Phase 2.4 不动接口)
- `src/routing/decisionRules.ts` — arbitrate + CD-3 do_not_use_when + if_rejected_use (Phase 2.3 ship;Phase 2.4 不动)
- `src/routing/agentDefinition.ts` — `AgentDefinition` v1.2 contract (Phase 2.2 14 字段 reconcile ship)
- `src/installers/index.ts` — 6 install method dispatch table (Phase 2.1 ship + Phase 2.3 extension category 5 NEW adapter);Phase 2.4 加第 7 method `cc-hook-add`
- `src/routing/lib/ralphLoop.ts` — `ralphLoopWrap` ≤50L wedge (D1.4-3 lock 永久架构;Phase 2.4 Win sentinel 验证不动接口)
- `src/cli/doctor.ts` — 现 152L (Phase 1.2 ship 4/5 check production);Phase 2.4 +~55-65L 5th check + JSON flag + status enum
- `src/cli/audit.ts` — 现 125L (Phase 1.2 ship manifest layer);Phase 2.4 +~80L runtime layer
- `scripts/dashboard.mjs` — 505L baseline (0b4e76d NEW + 161621c polish);Phase 2.4 +~130L C 路径 absorb
- `scripts/check-transparency-verdicts.mjs` — Phase 2.2 T1.7 ENFORCE=true ship + freshness ext;walker pattern 沿袭 `scripts/run-plan-checker.mjs`
- `scripts/check-provenance.mjs` — Phase 2.2 T4.0 ship;Phase 2.4 audit 完整版 spawn 调用 (NOT 重 implement) + M2 schemaVersion long-tail land 1 consumer site (B-33)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` — A7 守恒不动 main body
- `.github/workflows/ci.yml` — 3-OS matrix + transparency + provenance + perf-bench cron + 6 Wave 0 step (Phase 2.3 ship);Phase 2.4 加 README counter gate + Win sentinel step + EE-4 plan-checker step

### D.4 Schema 资源
- `routing/decision_rules.yaml` v2 + 三 category 段 (Phase 2.3 ship;Phase 2.4 不动)
- `src/manifest/schema/spec.ts` — TypeBox manifest schema (Phase 2.4 加 InstallType + TypeEnum + install.method 三处 enum 加 + install 3 optional field)
- 新 `routing/plan-review-schema.yaml` — EE-4 4 维 SSOT (yaml-only per B-10)

### D.5 Milestone refs
- `.planning/v0.1.0-MILESTONE-AUDIT.md` — milestone shipped baseline (v0.1.0 ship Phase 1.5 close 模式)
- `.planning/milestones/v0.1.0-{ROADMAP,REQUIREMENTS}.md` — Phase 1.5 v0.1.0 close 沿袭模板
- `.planning/phase-2.3/SAMPLES.md` — R3 frozen 30 sample selection rationale (本 phase F6 anti-redo 不复用,Phase 2.4 自己出 doctor / plan-checker fixture)

---

*Phase 2.4 ASSUMPTIONS.md complete — § A 8 acceptance bars mapped to 7 Wave / § B 43 lock 全消化 4 来源 (CONTEXT 4 + RESEARCH 20 + PATTERNS 5 + intel 直引 + STATE backlog + KICKOFF + planner inference;0 unresolved conflict;6 R2 critical finding 全 RESOLVED;7 open question O1-O7 全 surface 在 B-lock 或 § C risk)/ § C 13 risk 全 mitigation / § D references full chain.*

*Wave B planner LOCK status: 5 PATTERNS D-WP-* + 20 RESEARCH D2.4-* + 4 CONTEXT D-* + 5 STATE backlog + 7 RESEARCH O1-O7 = **41 sources → 43 B-locks consolidated** (含 inference 推导 7 lock)。 No carry-forward issue to Wave C plan-checker。*
