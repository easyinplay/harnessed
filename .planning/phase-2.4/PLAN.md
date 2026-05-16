---
phase: 2.4
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  - .github/workflows/ci.yml
  - .planning/intel/omc-comparison.md
  - .planning/RETROSPECTIVE.md
  - .planning/STATE.md
  - .planning/ROADMAP.md
  - docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md
  - README.md  # Wave 0 pre-flight calibration only if drift detected; otherwise unchanged
  - src/cli/doctor.ts
  - src/cli/audit.ts
  - src/cli/lib/origin-check.ts
  - src/cli/lib/audit-helpers.ts
  - src/installers/index.ts
  - src/installers/ccHookAdd.ts
  - src/manifest/schema/spec.ts
  - src/manifest/schema/installMethods/ccHookAdd.ts
  - src/manifest/schema/installMethods/index.ts
  - scripts/run-plan-checker.mjs
  - scripts/dashboard.mjs
  - scripts/check-provenance.mjs  # B-33 schemaVersion long-tail land 1 consumer
  - routing/plan-review-schema.yaml
  - manifests/cc-hooks/dashboard-autospawn.yaml
  - .claude/agents/gsd-plan-checker.md
  - tests/cli/doctor.test.ts
  - tests/cli/doctor-fixtures.test.ts
  - tests/cli/audit.test.ts
  - tests/installers/ccHookAdd.test.ts
  - tests/integration/installer-contract.test.ts
  - tests/integration/plan-checker-fixtures.test.ts
  - tests/integration/plan-checker-quant.test.ts
  - tests/integration/phase-2.4-e2e.test.ts
  - tests/routing/ralph-loop-win-sentinel.test.ts
  - tests/scripts/dashboard-sse.test.ts
  - tests/scripts/dashboard-multi-project.test.ts
  - .planning/milestones/v0.2.0-ROADMAP.md
  - .planning/milestones/v0.2.0-REQUIREMENTS.md
  - .planning/v0.2.0-MILESTONE-AUDIT.md
autonomous: true
requirements:
  - R2.4.1  # doctor health check 5 check MIN (ROADMAP L113-114 — jq/Git Bash 探测 + origin URL 校验 + plugin uninstall 4 步 fallback v0.3+ DEFER)
  - R2.4.2  # audit 完整版 (ROADMAP L115 — audit 检测 origin 篡改 + 模拟恶意 fork)
  - R2.4.3  # ralph-loop Win 兼容 (ROADMAP L115 — Windows native CI 跑过 ralph-loop 完整链路)
  - R2.4.4  # EE-4 plan-checker 量化阈值 ABSORB (intel L74-82 + L286)
  - R2.4.5  # dashboard C 路径 3 子功能 FULL absorb (intel dashboard-handoff § 3)
  - R2.4.6  # README CI counter gate B 路径 (STATE H3 root-cause-class 第 3 次复发根治)
  - R2.4.7  # Wave 0 prereq backlog 一次根治 (STATE L601+ 5 项)
must_haves:
  truths:
    - "developer can run `harnessed doctor` and see 5 check results (Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL) with status per check (pass/warn/fail) and overall summary"
    - "developer can run `harnessed doctor --json` and get JSON output with `{checks: [...], summary: 'pass'|'warn'|'fail'}` for CI consumption"
    - "developer can run `harnessed audit` and detect (a) origin URL drift (hard-fail) + (b) install.cmd shell injection (`;&|\\\\\\\\\\`\\$`) + (c) upstream vs install.cmd npm pkg mismatch + (d) provenance integrity via spawned `node scripts/check-provenance.mjs`"
    - "developer can run `harnessed install dashboard-autospawn` and 装 cc-hook SessionStart hook into `~/.claude/settings.json` (deep-merge, idempotent, backed up)"
    - "developer can `harnessed uninstall dashboard-autospawn` and 干净 remove hook block from `~/.claude/settings.json` (no orphan)"
    - "developer can open dashboard at `http://localhost:47180` and see SSE event-driven STATE.md updates (no 2s polling; EventSource native auto-reconnect)"
    - "developer can switch project in dashboard left-nav dropdown and dashboard re-renders from `~/.claude/harnessed-projects.json` config (URL `?project=<path>` + `history.pushState` no-reload)"
    - "CI runs `node scripts/run-plan-checker.mjs .planning/phase-*/` and outputs `plan-check.json` with 4 维 score + verdict (PASS / APPROVED WITH CONDITIONS / REJECTED); BLOCKER exits 1 with `::error::` annotation; manual `/gsd-plan-phase` rerun required (NOT auto-spawn — v0.3.0 feature)"
    - "CI runs README counter integrity gate and fails if `grep -cE \"Phase 2\\\\.[0-9]+ shipped\"` ≠ `grep -cE \"Acceptance bar [A-Z][0-9]\"` ≠ `sed -n '44p' | grep -oE '[0-9]+/4'`"
    - "Windows native CI matrix step runs `tests/routing/ralph-loop-win-sentinel.test.ts` (5 fixture: simple-complete / multi-iter / max-iter / subagent-spawn-mock / timeout) and passes"
    - "Wave 0 5 项 prereq backlog 一次根治: H3 README CI counter gate ship + M1 RETRO dashboard polish 历史 cluster 一句补 + M2 schemaVersion 7 surface land 1 consumer (`scripts/check-provenance.mjs` per B-33) + T3 v0.3.0 backlog 预启动注记 (NOT land) + deferred-items review 强化 (沿袭 Phase 2.3 T0.8)"
    - "ADR errata 0013 accepted 含 9 章节 (doctor 5 check MIN + EE-4 plan-review-schema + EE-4 BLOCKER down-scope + dashboard C 路径 3 子 + SSE 替 WebSocket + cc-hook 3 处 enum + README counter B 路径 + audit 完整版扩 + Wave 0 backlog); ADR 0001-0012 main body 0 diff; baseline tag 1-12 → 1-0013"
    - "3-OS CI 全绿 (Win Git Bash + macOS + Linux) 含 Wave 0/2/4 加固 step 全跑 + ralph-loop Win sentinel 跑通 + 30 doctor fixture + 30 plan-checker fixture + 全链路 e2e"
    - "v0.2.0 milestone close 完成: `adr-0013-accepted` + `v0.2.0-alpha.4-doctor` + `v0.2.0` milestone tag (大里程碑) + `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` archive + `.planning/v0.2.0-MILESTONE-AUDIT.md` audit + ROADMAP § v0.2.0 4/4 phase ✅ + STATE.md 续编 + v0.3.0 启动 prereq"
  artifacts:
    - path: "docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md"
      provides: "Phase 2.4 单 ADR errata 9 章节 (doctor MIN / EE-4 plan-review-schema / EE-4 BLOCKER down-scope / dashboard C 路径 3 子 / SSE 替 WebSocket / cc-hook 3 处 enum / README counter B 路径 / audit 完整版扩 / Wave 0 backlog 根治)"
      contains: "### 1. doctor 5 check MIN, ### 2. EE-4 plan-review-schema, ### 3. EE-4 BLOCKER down-scope, ### 4. dashboard C 路径, ### 5. SSE 替 WebSocket, ### 6. cc-hook 3 处 enum, ### 7. README counter B 路径, ### 8. audit 完整版扩, ### 9. Wave 0 backlog"
    - path: "src/cli/doctor.ts"
      provides: "5 check MIN ship (Node / MCP scope / jq / Win bash / origin URL) + --json flag + status 三档 enum + Karpathy 容忍 ~210L (5% 超 hard limit per B-03)"
      exports: ["registerDoctor", "CheckResult (upgraded)"]
    - path: "src/cli/lib/origin-check.ts"
      provides: "origin URL helper (doctor #5 warn mode + audit hard-fail mode sister-share) ≤80L"
      exports: ["checkOrigin"]
    - path: "src/cli/audit.ts"
      provides: "完整版 扩 audit.ts (NOT NEW per B-28) +~80L runtime layer — origin URL hard-fail + install.cmd injection regex + upstream-pkg cross-check + provenance spawn"
      exports: ["registerAudit (upgraded)"]
    - path: "src/cli/lib/audit-helpers.ts"
      provides: "audit runtime layer helpers (auditOriginIntegrity + auditInstallCmdIntegrity + auditProvenance) ≤50L split"
      exports: ["auditOriginIntegrity", "auditInstallCmdIntegrity", "auditProvenance"]
    - path: "routing/plan-review-schema.yaml"
      provides: "EE-4 4 维 SSOT (yaml-only per B-10) — dimensions + thresholds + scoring + verdict_mapping ≤60L"
      contains: "file_references_verified, reference_sources_real, concrete_acceptance, business_logic_assumptions"
    - path: "scripts/run-plan-checker.mjs"
      provides: "EE-4 CI walker (沿袭 check-transparency-verdicts.mjs walker L29-36 + ENFORCE 模式) ≤100L — 输出 plan-check.json + BLOCKER exit 1"
    - path: ".claude/agents/gsd-plan-checker.md"
      provides: "project-local override (NOT 全局 ~/.claude/agents/) ~30L 加 EE-4 量化输出节 — 4 维 score + verdict + auto_retrigger_plan_phase: false (manual rerun per B-12)"
    - path: "src/installers/ccHookAdd.ts"
      provides: "7th installer NEW (复刻 npxSkillInstaller skeleton L65-217) ≤100L — JSON deep-merge into ~/.claude/settings.json hooks block + idempotent + backup + verify"
      exports: ["installCcHookAdd", "uninstallCcHookAdd"]
    - path: "src/manifest/schema/spec.ts"
      provides: "3 处 enum 加项 (B-22) — InstallType +'hook' / TypeEnum +'cc-hook' / install.method +'cc-hook-add' + install 3 optional field (hook_event/hook_matcher/hook_command)"
    - path: "src/manifest/schema/installMethods/ccHookAdd.ts"
      provides: "TypeBox cc-hook-add method schema (复刻 npxSkillInstaller schema shape) ~30L"
    - path: "scripts/dashboard.mjs"
      provides: "+~130L C 路径 absorb — SSE watcher (B-23) + 多项目 nav (B-25) + 127.0.0.1 localhost-only bind (B-27);505→636L 超软限 27% 接受 (dev tool per B-26)"
    - path: "manifests/cc-hooks/dashboard-autospawn.yaml"
      provides: "First cc-hook-add fixture (SessionStart hook 触发 dashboard 启动检查 + install dispatch demo) ≤40L"
    - path: "tests/routing/ralph-loop-win-sentinel.test.ts"
      provides: "Win-only sentinel 5 fixture e2e (simple-complete / multi-iter / max-iter / subagent-spawn-mock / timeout) ~80L"
    - path: ".github/workflows/ci.yml"
      provides: "Wave 0 README counter gate step (B-17) + Wave 2 EE-4 plan-checker step (B-11) + Wave 4 Win sentinel step (B-30) + A7 iter 1-12 → 1-0013"
    - path: ".planning/v0.2.0-MILESTONE-AUDIT.md"
      provides: "v0.2.0 4 phase 历史 ship 审计 + cumulative metric (Phase 2.1 + 2.2 + 2.3 + 2.4 ship 路径 + sister review 闭环 + Karpathy hard limit 遵守度) — 沿袭 v0.1.0-MILESTONE-AUDIT.md 模板"
  key_links:
    - from: "src/cli/doctor.ts checkOriginUrl"
      to: "src/cli/lib/origin-check.ts checkOrigin"
      via: "warn mode (fork 合法用例) — `import { checkOrigin } from './lib/origin-check.js'`"
      pattern: "checkOrigin.*allowFork.*true|warn"
    - from: "src/cli/audit.ts auditOriginIntegrity"
      to: "src/cli/lib/origin-check.ts checkOrigin"
      via: "hard-fail mode (audit 不容 fork) — sister-share helper per B-05 + B-28"
      pattern: "checkOrigin.*allowFork.*false|level.*error"
    - from: "scripts/run-plan-checker.mjs"
      to: "routing/plan-review-schema.yaml"
      via: "parseYaml + runtime threshold apply (yaml-only SSOT per B-10) + walker pattern (check-transparency-verdicts.mjs analog)"
      pattern: "parseYaml.*plan-review-schema|thresholds\\.file_references_verified"
    - from: ".claude/agents/gsd-plan-checker.md"
      to: "routing/plan-review-schema.yaml"
      via: "agent prompt 量化输出节 references 4 维 + 三档 mapping (PASS / WARNING / BLOCKER) — auto_retrigger_plan_phase: false per B-12"
      pattern: "EE-4 量化输出|dimensions_passed|auto_retrigger_plan_phase"
    - from: "src/installers/ccHookAdd.ts"
      to: "~/.claude/settings.json hooks block"
      via: "JSON deep-merge + idempotent check + backup() before write + verify (re-read JSON.parse + grep hook_command) — L3 level confirmAt per B-21"
      pattern: "homedir.*\\.claude.*settings\\.json|hooks\\.SessionStart"
    - from: "src/installers/index.ts"
      to: "src/installers/ccHookAdd.ts installCcHookAdd"
      via: "dispatch table +1 entry `'cc-hook-add': installCcHookAdd` + levelOf switch case `'cc-hook-add': return 'L3'` (sister mcp-stdio-add / mcp-http-add / cc-plugin-marketplace)"
      pattern: "'cc-hook-add':\\s*installCcHookAdd|case 'cc-hook-add'"
    - from: "scripts/dashboard.mjs SSE /events endpoint"
      to: "fs.watch('.planning/STATE.md')"
      via: "debounce 500ms (B-24) + EventSource broadcast `event: state-changed` — zero-dep (B-23 + D2.4-9)"
      pattern: "fs\\.watch.*STATE\\.md|text/event-stream"
    - from: "scripts/dashboard.mjs /api/projects endpoint"
      to: "~/.claude/harnessed-projects.json"
      via: "JSON read + serve list + client `history.pushState` ?project=<path> (B-25)"
      pattern: "harnessed-projects\\.json|/api/projects"
    - from: "scripts/check-provenance.mjs (M2 schemaVersion long-tail consumer per B-33)"
      to: "src/types/schemaVersion.ts branchOnSchemaVersion"
      via: "Wave 0 T0.4 加 1 行 consumer call site — sister Phase 2.3 W0 T0.5 grep gate ≥2 阈值 bump if applicable"
      pattern: "branchOnSchemaVersion"
    - from: ".github/workflows/ci.yml README counter integrity gate"
      to: "README.md (Phase 2.X shipped + Acceptance bar [A-Z][0-9] + L44 N/4 counter)"
      via: "三计数 grep -cE + sed -n '44p' + 比对 exit 1 on drift (B-17)"
      pattern: "Phase 2\\\\.\\[0-9\\]\\+ shipped|Acceptance bar"
    - from: ".github/workflows/ci.yml ralph-loop Win sentinel step"
      to: "tests/routing/ralph-loop-win-sentinel.test.ts"
      via: "if: runner.os == 'Windows' + shell: bash + corepack pnpm test (沿袭 Phase 2.3 W0 T0.6 provenance pwsh sentinel pattern)"
      pattern: "runner\\.os == 'Windows'|ralph-loop-win-sentinel"
---

<objective>
Phase 2.4 把 v0.2.0 收尾末 phase 装配为 **`doctor` 健康检查完整版 ship + EE-4 plan-checker 4 维量化阈值 ABSORB + dashboard C 路径 3 子功能 FULL absorb + README CI counter gate B 路径 + ralph-loop Windows native 兼容验收 sentinel + audit 完整版扩**。5 大主题 sister cluster 一次 ship,作为 **v0.2.0 milestone 4/4 close** (v0.2.0 alpha cycle 收官)。

**doctor 完整版 = MIN 5 check** (D-01) — Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL 校验。现 `src/cli/doctor.ts` **152L** (Phase 1.2 ship 4/5 check production,**R2 critical finding 修正 KICKOFF "38L → 150L" stale 数字**) → +~55-65L (5th check ~25L + JSON flag ~15L + status enum 升级 ~10L + helper ~5L) → ~210L (5% 超 hard limit 容忍 per B-03);origin-check 抽 `src/cli/lib/origin-check.ts` ≤80L sister to audit 共享 (B-05)。

**EE-4 ABSORB-2.4** (D-02) — `routing/plan-review-schema.yaml` NEW (yaml-only per B-10) 4 维 SSOT + `scripts/run-plan-checker.mjs` NEW walker + Wave 2 spike baseline 校准阈值 (B-15) + `.claude/agents/gsd-plan-checker.md` project-local override 量化输出节 (B-13)。**BLOCKER auto-rerun DOWN-SCOPE** 为 CI fail + manual rerun (B-12,O1 surface — auto-spawn v0.3.0 feature)。与 doctor + audit sister cluster 语义一致 (项目级 health check 三件套)。

**dashboard C 路径 FULL absorb** (D-04) — intel § 3 全 ~160L 进 doctor sister cluster:**Wave 3 3 sub-task 并行** (B-19):3.1 `src/installers/ccHookAdd.ts` NEW (B-20 sister `mcp-stdio-add` naming, 复刻 npxSkillInstaller) + dispatch 7th + 3 处 schema enum 加 (B-22);3.2 `scripts/dashboard.mjs` STATE.md watcher + **SSE 替 WebSocket** (B-23 zero-dep per D2.4-9);3.3 多项目 nav + `~/.claude/harnessed-projects.json` (B-25);dashboard.mjs 505→636L 超软限 27% 容忍 (B-26 dev tool 不计 hard limit;Wave 3 T3.4 PARTIAL split fallback if wc > 650L)。

**README CI counter gate B 路径** (D-03) — Wave 0 ~15L yaml step 三计数一致才 PASS (B-17 沿袭 Phase 2.2 T0.4 freshness gate pattern + Phase 2.3 W0 T0.5 schemaVersion grep gate sister);H3 root-cause-class README counter 第 3 次复发根治。

**audit 完整版扩** (B-28 + B-29) — `src/cli/audit.ts` 现 **125L** (Phase 1.2 ship,**R2 critical finding 修正 KICKOFF "audit (NEW or 扩)" wording**) → +~80L runtime layer (origin URL hard-fail + install.cmd injection + upstream-pkg cross-check + provenance spawn) → 抽 `src/cli/lib/audit-helpers.ts` ≤50L,audit.ts cli orchestration ~150L under hard limit。

**ralph-loop Win sentinel MIN 5 fixture** (B-30 + D2.4-18) — CI matrix Win-only step 沿袭 Phase 2.3 W0 T0.6 provenance pwsh sentinel pattern;5 fixture (simple-complete / multi-iter / max-iter / subagent-spawn-mock / timeout);**anti-redo discipline** NOT 30 sample (Phase 2.3 sister 不重做)。

**Wave 0 必办 5 项一次根治** (STATE.md L601+, B-32) — H3 README CI counter gate (B-16) / M1 RETRO dashboard polish 历史 cluster 一句补 / M2 schemaVersion 7 surface land 1 consumer (`scripts/check-provenance.mjs` per B-33) / T3 v0.3.0 backlog 预启动注记 (NOT land) / deferred-items review 强化 (沿袭 Phase 2.3 T0.8 check-deferred-items.mjs warn-only)。沿袭 Phase 2.1/2.2/2.3 Wave 0 模式。

**Purpose**: R2.4.1 (doctor 5 check MIN) + R2.4.2 (audit 完整版) + R2.4.3 (ralph-loop Win 兼容) + R2.4.4 (EE-4 plan-checker ABSORB) + R2.4.5 (dashboard C 路径 FULL absorb) + R2.4.6 (README CI counter gate B 路径) + R2.4.7 (Wave 0 prereq backlog 一次根治)。

**Output**: 7 Wave × ~24 atomic task (F1-F8 acceptance bars 全 ship) + 单 ADR errata 9 章节 (实占 N) + `v0.2.0-alpha.4-doctor` candidate tag + `v0.2.0` milestone tag (大里程碑 — v0.2.0 alpha cycle 4/4 close)。

> **R2 critical findings absorbed** (6 项): (1) doctor.ts 现 152L 不是 38L → KICKOFF F2 wording 校正 + B-02 真实增量 ~55-65L;(2) audit.ts 已存 125L → F5 wording "扩 NOT NEW" + B-28;(3) dashboard.mjs 现 505L 不是 ~475L → 增量后 636L 27% 超软限 + B-26 容忍 + T3.4 split fallback gate;(4) STATE.md watcher 推 SSE not WebSocket → B-23 + D2.4-9 锁 SSE zero-dep;(5) EE-4 BLOCKER auto-rerun → CI fail + manual rerun down-scope (B-12 + O1 surface);(6) EE-4 4 维阈值 baseline 必 Wave 2 实测 (B-15 spike sub-task)。
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-2.4/KICKOFF.md
@.planning/phase-2.4/2.4-CONTEXT.md
@.planning/phase-2.4/2.4-DISCUSSION-LOG.md
@.planning/phase-2.4/PATTERNS.md
@.planning/phase-2.4/RESEARCH.md
@.planning/phase-2.4/ASSUMPTIONS.md
@.planning/intel/omc-comparison.md
@.planning/intel/dashboard-handoff-2026-05-16.md
@.planning/phase-2.3/RETROSPECTIVE.md

# Frozen interface contracts (本 phase 升级或消费)
@src/cli/doctor.ts
@src/cli/audit.ts
@src/installers/index.ts
@src/installers/npxSkillInstaller.ts
@src/manifest/schema/spec.ts
@src/manifest/schema/installMethods/index.ts
@scripts/dashboard.mjs
@scripts/check-transparency-verdicts.mjs
@scripts/check-provenance.mjs
@.github/workflows/ci.yml

# Sister precedent
@.planning/phase-2.3/PLAN.md
@.planning/phase-2.3/task_plan.md
@.planning/phase-2.3/ASSUMPTIONS.md
</context>

---

## § 1 Goal & Scope

### 1.1 Goal
doctor 5 check MIN + EE-4 plan-checker 4 维 ABSORB + dashboard C 路径 3 子功能 FULL absorb + README CI counter gate B 路径 + ralph-loop Win sentinel + audit 完整版扩 + Wave 0 5 项一次根治 + v0.2.0 milestone 4/4 close。

### 1.2 In Scope
F1-F8 acceptance bars (详 ASSUMPTIONS § A);7 Wave × ~24 atomic task。

### 1.3 Out of Scope
T4.4 Task Session 复用完整版 (v0.3.0 checkpoint) + T1.1 dual-signal 4-layer real-API integration (v0.3.0 prep) + EE-2 ECC 9-field manifest schema (v0.3+) + EE-1 role-router scoring 中间层 (v0.3+) + CD-1 handoff 四字段完整模板 (v0.3.0 checkpoint) + V-1 动态 model routing (v0.3+) + V-2 Manual fallback bundle export (v0.4+) + intel 第 2 条 resolved_routing 快照冻结 (v0.3+) + plan-feature workflow + checkpoint + 路由命中率验收 + gstack 前缀探测 (v0.3.0 启动) + doctor weekly cron / upstream_health / plugin uninstall 4 步 fallback (v0.3+ 评估) + EE-4 BLOCKER auto-spawn rerun (v0.3.0 orchestration layer feature per B-12) + cc-hook hook_type 第 4 字段 (v0.3+ 评估 per O4) + dashboard CLI --add-project flag (v0.3.0 per O7) — 详 CONTEXT § Deferred + KICKOFF § 1.3。

---

## § 2 Wave 拓扑 (实占)

```
Wave 0 — STATE.md 5 项 prereq backlog 一次根治 + ADR draft (F1)
  ├─ T0.1  ADR 编号实占 (0013, 预期 0013) + ROADMAP latest-shipped token + sed-replace placeholder discipline
  │         (沿袭 Phase 2.3 T0.1 — solo 单线性无并发 + max(NNNN)+1)
  ├─ T0.2  ADR 0013 draft 9 章节 sketch only (Wave 6 详细 fill)
  ├─ T0.3  README CI counter gate B 路径 ship (B-16 + B-17) — Wave 0 pre-flight regex calibration (local grep 校准当前 README) + .github/workflows/ci.yml +~15L yaml step
  ├─ T0.4  M2 schemaVersion 7 surface land 1 consumer (B-33) — scripts/check-provenance.mjs 加 1 行 branchOnSchemaVersion consumer call site
  ├─ T0.5  M1 RETRO dashboard polish 历史 cluster 一句补 + T3 v0.3.0 backlog 预启动注记 + deferred-items review 强化 (parallel 纯文档/script: RETROSPECTIVE.md entry + STATE.md note + scripts/check-deferred-items.mjs cadence 沿袭 Phase 2.3 T0.8)
  └─ T0.6  3-OS CI 跑通 gate verify (Wave 0 全 step 合规)
       ↓
Wave 1 — doctor 5 check 完整版 (F2 — D-01 MIN)  ║  ↓ (并行,无 schema 依赖冲突)  Wave 2 — EE-4 plan-review-schema (F3 — D-02 ABSORB)
  ├─ T1.1  src/cli/lib/origin-check.ts NEW ≤80L  ║  ├─ T2.0  EE-4 阈值 baseline spike (B-15) — 跑 Phase 2.3/2.2 task_plan.md 4 维分布 baseline → Resolved block (沿袭 Phase 2.3 T0.10 always_active spike pattern)
  │  (warn mode for doctor + allowFork param for audit sister-share) ║  ├─ T2.1  routing/plan-review-schema.yaml NEW ≤60L (yaml-only per B-10)
  ├─ T1.2  src/cli/doctor.ts MODIFY +~55-65L  ║  ├─ T2.2  scripts/run-plan-checker.mjs NEW ~80L (walker 沿袭 check-transparency-verdicts.mjs L29-36)
  │  (5th checkOriginUrl + --json flag + status 三档 enum 升级 + 容忍 ~210L per B-03)  ║  ├─ T2.3  .claude/agents/gsd-plan-checker.md NEW project-local override ~30L
  └─ T1.3  tests/cli/doctor.test.ts NEW ~80L  ║  └─ T2.4  CI step + tests/integration/plan-checker-quant.test.ts NEW ~60L
                    ↓                                         ↓
Wave 3 — dashboard C 路径 FULL absorb (F4 — D-04 — 3 sub-task 并行 per B-19)
  ├─ T3.1  src/installers/ccHookAdd.ts NEW ≤100L + dispatch 7th + 3 处 schema enum 加 (B-20 + B-22) + manifests/cc-hooks/dashboard-autospawn.yaml NEW ≤40L fixture
  ├─ T3.2  scripts/dashboard.mjs +~50L SSE watcher (B-23 + B-24 + B-27 localhost bind)
  ├─ T3.3  scripts/dashboard.mjs +~80L 多项目 nav + ~/.claude/harnessed-projects.json (B-25)
  │  ↳ merge 顺序: T3.2 先 merge,T3.3 rebase per B-19
  └─ T3.4  PARTIAL split fallback gate (per B-39 + R5) — IF `wc -l scripts/dashboard.mjs > 650` THEN split SHELL HTML 到 scripts/dashboard/shell.mjs ≈250L (D-WP-1 (c));ELSE SKIP (Resolved block)
       ↓
Wave 4 — audit 完整版扩 + ralph-loop Win sentinel (F5 — D2.4-16 + D2.4-18)
  ├─ T4.1  src/cli/audit.ts +~80L runtime layer + src/cli/lib/audit-helpers.ts NEW ≤50L (B-28 + B-29 split 默认 ship)
  ├─ T4.2  tests/cli/audit.test.ts NEW ~60L (origin drift + install.cmd injection + upstream cross-check + provenance spawn 4 case)
  └─ T4.3  tests/routing/ralph-loop-win-sentinel.test.ts NEW ~80L (5 fixture per B-30) + .github/workflows/ci.yml Win-only step ~10L
       ↓
Wave 5 — 30-sample integration e2e (F6 — D2.4-19 — anti-redo Phase 2.3 30 routing sample)
  ├─ T5.1  tests/cli/doctor-fixtures.test.ts NEW ~120L (30 doctor fixture: 5 check × 6 env scenario per B-31)
  ├─ T5.2  tests/integration/plan-checker-fixtures.test.ts NEW ~80L (30 plan-checker fixture: Phase 1.1~2.3 现存 plan 跑量化)
  └─ T5.3  tests/integration/phase-2.4-e2e.test.ts NEW ~100L (全链路 e2e: doctor → plan-checker → dashboard 多项目 + SSE watcher)
       ↓
Wave 6 — ship + v0.2.0 4/4 close (F7 + F8)
  ├─ T6.1  ADR 0013 finalize 9 章节 (Wave 0 draft → Wave 6 详细 fill) + accepted
  ├─ T6.2  ci.yml A7 step iter 1-12 → 1-0013 + ADR 0001-0012 main body 0 diff verify
  ├─ T6.3  STATE.md 续编 Phase 2.4 SHIPPED + .planning/RETROSPECTIVE.md milestone retrospective (含 deferred items review 跑通 + v0.2.0 alpha cycle close lessons)
  ├─ T6.4  v0.2.0 milestone close (B-42 + B-43) — 3 tag (adr-0013-accepted + v0.2.0-alpha.4-doctor + v0.2.0 milestone) + .planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md archive + .planning/v0.2.0-MILESTONE-AUDIT.md NEW (沿袭 v0.1.0 close 模式)
  └─ T6.5  ROADMAP § v0.2.0 4 phase 全 ✅ + v0.3.0 启动 prereq 列表 (T3 backlog + plan-feature workflow + checkpoint cadence + gstack 前缀探测)
```

**Wave 拓扑约束** (B-19 + 推理):
- **Wave 0 必须最先** (B-32) — 5 项 prereq 不解,后续 wave CI 不稳 (README counter drift / schemaVersion grep gate stale 阻 CI)。
- **Wave 1 (doctor) + Wave 2 (plan-checker) 并行** — 无 schema 依赖冲突 (doctor.ts ≠ plan-review-schema.yaml ≠ run-plan-checker.mjs),file scope 完全独立。
- **Wave 3 (dashboard C 路径) 依赖 Wave 1 完成** — dashboard 启动时 doctor 触发 (heptagent ADD ancestor prototype);3 sub-task 内部并行 (T3.2 先 merge T3.3 rebase per B-19 merge 顺序)。
- **Wave 4 (audit + Win sentinel) 依赖 Wave 1 origin-check helper 复用** (B-05 + B-28 sister-share)。
- **Wave 5 integration 依赖 Wave 1-4 全完成** (e2e 链路需 doctor + plan-checker + dashboard + audit + Win sentinel 全在位)。
- **Wave 6 ship 最后** (F8 v0.2.0 milestone close)。

---

## § 3 Atomic Task Table

详 `task_plan.md`。本节是 summary view。

| Wave | Task Count | Est. Effort | Key Verify |
|------|-----------|-------------|-----------|
| 0 | 6 | ~1d | ADR 编号实占 + README counter gate 跑通 + schemaVersion consumer 加 + RETRO/STATE/deferred 强化 + 3-OS CI 全绿 + ADR draft 9 章节 sketch |
| 1 | 3 | ~1d | doctor.ts ≤210L (5% 超容忍 per B-03) + origin-check.ts ≤80L + doctor.test.ts 5 check pass |
| 2 | 5 | ~1d | EE-4 baseline spike Resolved block + plan-review-schema.yaml ≤60L + run-plan-checker.mjs ≤100L + project-local agent override ~30L + plan-checker-quant.test pass |
| 3 | 4 | ~2d | ccHookAdd.ts ≤100L + 3 处 enum 加 + dispatch 7th + dashboard SSE + 多项目 + dashboard.mjs ≤700L soft cap (T3.4 split fallback if >650L) |
| 4 | 3 | ~1d | audit.ts ≤200L (helper split) + audit-helpers.ts ≤50L + audit.test 4 case + ralph-loop-win-sentinel 5 fixture pass on Win |
| 5 | 3 | ~1d | 30 doctor fixture pass + 30 plan-checker fixture pass + e2e 全链路 pass |
| 6 | 5 | ~1d | 3-OS CI 全绿 + 3 tag exist + ADR 0001-0012 main body diff 0 + adr-0013-accepted + v0.2.0 milestone archive 完成 + ROADMAP 4/4 ✅ |
| **Total** | **29** | **~8d** | F1-F8 全 ship + v0.2.0 alpha cycle close |

---

## § 4 v0.3.0 prereq 接口契约

Phase 2.4 ship 后,v0.3.0 直接消费的接口:

| Consumer | Surface | Locked by Phase 2.4 |
|----------|---------|---------------------|
| v0.3.0 plan-feature workflow | EE-4 plan-review-schema.yaml 4 维 SSOT + run-plan-checker.mjs walker pattern | B-09 + B-10 + B-11 |
| v0.3.0 checkpoint 完整版 | dashboard 多项目 nav + STATE watcher SSE event-driven (cross-project history view) | B-23 + B-25 |
| v0.3.0 checkpoint EE-4 BLOCKER auto-spawn | run-plan-checker.mjs BLOCKER exit 1 → orchestration layer (本 phase down-scope per B-12) | (无 lock — v0.3.0 orchestration layer feature) |
| v0.3+ doctor weekly cron / upstream_health / plugin uninstall 4 步 fallback | doctor.ts 5 check MIN 扩展点 (sister method + CheckResult schema 复用) | B-04 + B-07 |
| v0.3+ 100+ sample × multi-model 路由命中率验收 | Phase 2.4 30 doctor fixture + 30 plan-checker fixture 模式 | B-31 + D2.4-19 |
| v0.3+ cc-hook hook_type 第 4 字段 (script/inline) | cc-hook-add schema extension (3 optional field — hook_event/hook_matcher/hook_command 已 ship) | B-22 (additive extension point) |
| v0.3+ Task Session 复用完整版 | (无 Phase 2.4 lock — closure infra Phase 2.2 ship,Phase 2.3 deferred 未 land) | 无 lock |
| v0.3+ EE-2 ECC 9-field manifest schema | manifest TypeBox schema 3 处 enum 加项 (cc-hook 沿袭) | B-22 sister precedent |

---

## § 5 Risks

详 ASSUMPTIONS § C (R1-R13)。
- **R1** doctor.ts 152→~210L 超 hard limit 5% → LOW;default inline 容忍 + fallback split `src/cli/doctor/*.ts` if wc > 215L
- **R2** audit.ts 125→~210L 超 hard limit 5% → LOW;default ship split `src/cli/lib/audit-helpers.ts` ≤50L
- **R3** EE-4 weasel-word false positive → MEDIUM;Wave 2 spike (T2.0) 校准 + 白名单扩
- **R4** EE-4 BLOCKER 误触发 CI fail 阻 ship → LOW-MED;manual rerun (not auto-spawn) 避免 cascade + spike baseline 校准
- **R5** dashboard.mjs 505→636L 超软限 27% → LOW;dev tool 不计 hard limit + T3.4 PARTIAL split fallback if wc > 650L
- **R6** `fs.watch` Win debounce 500ms 不足 → MEDIUM;单文件 watch + 加 content hash check 二次去重 fallback
- **R7** `~/.claude/settings.json` JSON deep-merge 破 user hooks → MEDIUM;idempotent check + backup + verify
- **R8** Wave 3 T3.2+T3.3 merge conflict → LOW-MED;T3.2 先 merge T3.3 rebase
- **R9** cc-hook 3 处 enum 漏一处 → LOW;Wave 3 T3.1 三处 grep verify acceptance criteria
- **R10** README counter gate 第一 push CI red → LOW;Wave 0 T0.3 pre-flight local grep 校准
- **R11** ADR 编号实占冲突 → LOW;solo 单线性 + sed-replace discipline
- **R12** v0.2.0 milestone tag 已存在 → LOW;Wave 6 T6.4 第一步 `git tag --list 'v0.2.0*'` 检 (glob 兼容 fallback) + S3 fallback decision tree (v0.2.0-final / v0.2.0-extension / destructive delete+re-create per executor judgment);F8 reproduction tag glob 一致 (`v0.2.0*`)
- **R13** Win sentinel subagent-spawn mock 偏真实 SDK → LOW-MED;Phase 2.4 MIN: mock (real SDK v0.3.0 prep T1.1 sister)

**no Wave 1/2 BLOCKER**;**no SSOT 引用纪律 risk** (R11 单线性);**partial Win 兼容** (R7 Wave 3 settings.json Win 跑 + Wave 4 ralph-loop-win-sentinel CI + Wave 6 3-OS CI sentinel)。

---

## § 6 F1-F8 Acceptance Bar (with reproduction commands)

| Bar | Reproduction Command | Pass Criteria |
|-----|----------------------|---------------|
| **F1** | `node scripts/check-transparency-verdicts.mjs && node scripts/check-deferred-items.mjs && grep -E "branchOnSchemaVersion" scripts/check-provenance.mjs && grep -E "README counter integrity gate" .github/workflows/ci.yml && grep -E "dashboard polish round 1" .planning/RETROSPECTIVE.md && grep -E "v0.3.0 prereq" .planning/STATE.md` | transparency exit 0 (Phase 2.2 ship 持续 green);check-deferred-items warn-only exit 0;check-provenance.mjs 含 branchOnSchemaVersion call (M2 consumer land per B-33);ci.yml 含 README counter gate step;RETRO 含 dashboard polish round 1 entry;STATE 含 v0.3.0 prereq 节 |
| **F2** | `wc -l src/cli/doctor.ts src/cli/lib/origin-check.ts && harnessed doctor --json \| jq '.summary' && npm test -- tests/cli/doctor.test.ts` | doctor.ts ≤215L (5% 超容忍, hard fail >215L);origin-check.ts ≤80L;--json 输出 `{summary: 'pass'\|'warn'\|'fail'}`;doctor.test 5 check 全 pass |
| **F3** | `wc -l routing/plan-review-schema.yaml scripts/run-plan-checker.mjs .claude/agents/gsd-plan-checker.md && node scripts/run-plan-checker.mjs .planning/phase-2.3/ > /tmp/plan-check.json && jq '.verdict' /tmp/plan-check.json && npm test -- tests/integration/plan-checker-quant.test.ts && grep "auto_retrigger_plan_phase.*false" .claude/agents/gsd-plan-checker.md` | yaml ≤60L + mjs ≤100L + agent override ~30L;Phase 2.3 plan baseline ≥ "APPROVED WITH CONDITIONS" (per B-15 spike outcome);quant test pass;agent override 明示 manual rerun (NOT auto-spawn per B-12) |
| **F4** | `wc -l src/installers/ccHookAdd.ts scripts/dashboard.mjs && grep "'cc-hook-add'" src/installers/index.ts && grep -E "'hook'\|'cc-hook'\|'cc-hook-add'" src/manifest/schema/spec.ts \| wc -l && harnessed install dashboard-autospawn --dry-run && curl -N http://localhost:47180/events & sleep 1; touch .planning/STATE.md; sleep 1; kill %1 && curl http://localhost:47180/api/projects \| jq '.[].name'` | ccHookAdd.ts ≤100L;dashboard.mjs ≤700L soft cap (T3.4 fallback if >650L per B-26);dispatch 7th 'cc-hook-add' 命中;3 处 enum 加项 grep count == 3;install dry-run exit 0;SSE /events stream 含 `state-changed` event;`/api/projects` 返回 JSON list (含 cwd as default) |
| **F5** | `wc -l src/cli/audit.ts src/cli/lib/audit-helpers.ts && npm test -- tests/cli/audit.test.ts && grep "Win sentinel" .github/workflows/ci.yml && npm test -- tests/routing/ralph-loop-win-sentinel.test.ts` (Win-only) | audit.ts ≤200L (split helper 后);audit-helpers.ts ≤50L;audit.test 4 case (origin drift + install.cmd injection + upstream cross-check + provenance spawn) 全 pass;Win sentinel CI step 存在;Win sentinel 5 fixture 全 pass on Win matrix |
| **F6** | `npm test -- tests/cli/doctor-fixtures.test.ts && npm test -- tests/integration/plan-checker-fixtures.test.ts && npm test -- tests/integration/phase-2.4-e2e.test.ts` | 30 doctor fixture 全 pass (5 check × 6 env scenario per B-31);30 plan-checker fixture 全 pass (Phase 1.1~2.3 plan 跑 4 维量化);e2e 全链路 pass |
| **F7** | `git diff <baseline-1-12>..HEAD -- "docs/adr/0001-*.md" "docs/adr/0002-*.md" ... "docs/adr/0012-*.md" \| wc -l && ls docs/adr/0013-*.md && grep -E "^### [1-9]\\. " docs/adr/0013-*.md \| wc -l` | A7 diff wc == 0;ADR 0013 存在 + 9 章节 |
| **F8** | `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` + `git tag --list 'adr-0013-accepted' 'v0.2.0-alpha.4-doctor' 'v0.2.0*'` + `ls .planning/milestones/v0.2.0-*.md .planning/v0.2.0-MILESTONE-AUDIT.md` + `grep -E "Phase 2\\\\.4 SHIPPED\|v0\\\\.2\\\\.0 4/4" .planning/STATE.md .planning/ROADMAP.md` | CI all-green 3 OS;3 tag 全存在 (含 v0.2.0 主 path OR v0.2.0-final / v0.2.0-extension fallback per S3 + R12 decision tree — tag glob `'v0.2.0*'` 兼容 fallback);v0.2.0 milestone archive 3 files 存在;STATE + ROADMAP 含 ship marker |

---

## § 7 Wave Acceptance Checkpoint Table

| Wave | Checkpoint Type | Gate Check | Action if FAIL |
|------|----------------|-----------|----------------|
| 0 | auto | ADR 编号实占 + sed-replace zero residue + README counter gate local pre-flight + schemaVersion consumer land + 3-OS CI 全绿 | ADR 编号冲突 → max(NNNN)+1 重选;README counter drift → 修 README 后再 push;schemaVersion consumer 漏 → 加补 |
| 1 | auto | doctor.ts ≤215L + origin-check.ts ≤80L + doctor.test 5 check pass | doctor.ts > 215L → R1 fallback split `src/cli/doctor/*.ts`;origin-check 复用接口偏 → 调 signature |
| 2 | auto | spike Resolved block + yaml ≤60L + mjs ≤100L + agent override + quant test pass + **S4 plan-check fix — phase-2.2/2.3 task_plan path verify** (`ls .planning/phase-2.{2,3}/task_plan.md` exit 0) | spike 显 ≥1 plan BLOCKER → R3/R4 阈值放宽 (concrete_acceptance 0.9 → 0.8);agent override 漏 manual rerun anchor → 补;若 multi-plan-NN 模式 → 选 1 baseline OR average score per S4 plan-check fix |
| 3 | auto | ccHookAdd.ts ≤100L + dispatch 7th + 3 处 enum + dashboard.mjs ≤700L + T3.4 fallback if > 650L + install dry-run pass + SSE /events stream pass + /api/projects pass | enum 漏 → R9 三处 grep 补;dashboard.mjs > 650L → R5 T3.4 split SHELL HTML;settings.json merge 破 user hooks → R7 idempotent + backup + verify;Win merge conflict → R8 T3.2 先 merge T3.3 rebase |
| 4 | auto | audit.ts ≤200L (helper split) + audit-helpers.ts ≤50L + audit.test 4 case + Win sentinel 5 fixture pass | audit.ts > 200L 持续 → R2 helper 再 split;Win sentinel timeout fixture fail → R13 mock 调整 |
| 5 | auto | 30 doctor fixture + 30 plan-checker fixture + e2e 全 pass | doctor fixture 某 env scenario fail → 修 check method;plan-checker fixture baseline 漂 → 阈值校准 |
| 6 | auto | 3-OS CI 全绿 + 3 tag exist + ADR 0001-0012 main body diff 0 + v0.2.0 milestone archive 完成 | A7 diff > 0 必 revert 改动到 ADR 0001-0012 main body;v0.2.0 tag 已存 → R12 fallback v0.2.0-final |

---

## § 8 Phase 2.4 vs 2.3 / v0.3.0 boundary

| 维度 | phase 2.3 (ship) | phase 2.4 (本) | v0.3.0 |
|------|------------------|----------------|--------|
| workflow | extension category MVP + karpathy 注入引擎 ✅ | **doctor 完整版 + EE-4 plan-checker absorb + dashboard C 路径 absorb + Win sentinel** | plan-feature workflow + checkpoint |
| schema | decision_rules CD-3 字段 ✅ | plan-review-schema.yaml 4 维 SSOT + install_type/typeEnum/install.method 3 处 enum 加 (cc-hook) | task_session_id field bump |
| ADR | 0012 单一覆盖 Phase 2.3 全决策 ✅ | 新 ADR 0013 errata 9 章节 (**不预占 0013**) | 新 ADR plan-feature |
| installer | 6 method dispatch + extension 5 NEW adapter ✅ | + cc-hook-add 第 7 method (dashboard 3.1 SessionStart hook) | (frozen) |
| skill 注入 | karpathy-baseline SKILL-ONLY ✅ | (不动) | (不动) |
| gate | EE-5 5-question merge gate 双层 ✅ | EE-4 4 维 plan-checker 量化 BLOCKER (manual rerun per B-12) + README CI counter gate B 路径 | 路由命中率验收 ≥ N% + EE-4 auto-spawn rerun |
| doctor | — | **5 check MIN + audit 完整版扩 + ralph-loop Win sentinel** | (frozen, v0.3+ weekly cron + upstream_health + uninstall 4 步) |
| dashboard | 0b4e76d + 161621c polish baseline ✅ | + C 路径 3 子功能 (SessionStart hook + STATE SSE watcher + 多项目) | 多项目跨 phase 历史 view |
| sample 命中 | 30 category-specific routing ≥85% ✅ | 30 doctor fixture + 30 plan-checker fixture (anti-redo Phase 2.3 30 routing per D2.4-19) | 100+ sample × multi-model 验收 |
| milestone | v0.2.0 3/4 ship | **v0.2.0 4/4 close + v0.2.0-alpha.4-doctor + v0.2.0 milestone tag (大里程碑)** | v0.3.0-alpha.1 |

---

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CLI input → doctor / audit | `harnessed doctor --json` + `harnessed audit` 不接受 user-controlled string (无 stdin/argv 注入面);origin URL check 读 git config + package.json `repository.url` (本地 fs trust) |
| manifest yaml → cc-hook installer | `manifests/cc-hooks/dashboard-autospawn.yaml` 含 `install.hook_command` user-controlled (manifest yaml 可 user 改) → TypeBox runtime validate + checkCmdString (audit.ts 跑 injection check per B-28) |
| dashboard SSE endpoint → browser | `/events` `text/event-stream` HTTP body — localhost-only bind (B-27 `127.0.0.1`) 防外部 connect resource exhaustion;前端 EventSource 无 cross-origin 风险 (same-origin) |
| dashboard `/api/projects` → ~/.claude/harnessed-projects.json | JSON read user config 文件 (B-25);恶意 JSON content (e.g. ECMAScript prototype pollution) → JSON.parse 内建 safe + 加 `Object.create(null)` defensive coding |
| cc-hook installer → ~/.claude/settings.json | JSON deep-merge user-level config (B-21);idempotent + backup() before write + verify (re-read JSON.parse + grep hook_command present) |
| run-plan-checker.mjs → plan-review-schema.yaml | yaml read SSOT (B-10);恶意 yaml content (e.g. yaml bomb / billion laughs) → `yaml` npm pkg internal safe-load (no eval) |
| ralph-loop Win sentinel → spawn child process | tests/routing/ralph-loop-win-sentinel.test.ts 5 fixture spawn `ralphLoopWrap` — mock subagent (B-30 + O5) 避 real SDK 需 API key |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-2.4-01 | Tampering | origin URL drift (无声 fork) | mitigate | doctor #5 warn (fork 合法用例 per B-05);audit hard-fail (B-28 — allowFork=false) — sister-share `src/cli/lib/origin-check.ts` 双 mode (`allowFork: boolean`);ROADMAP L115 验收 "audit 检测出 origin 篡改" 兑现 |
| T-2.4-02 | Tampering | 恶意 fork install.cmd shell injection (`;&\|`\$\`) | mitigate | audit `auditInstallCmdIntegrity` COMMAND_SEPARATORS regex (B-28);已部分覆盖 `checkCmdString` (src/manifest/security.ts) 在 installer runtime 跑,audit-time pre-flight 同跑双层防 |
| T-2.4-03 | Tampering | 恶意 fork install.cmd 引 npm pkg ≠ upstream declared | mitigate | audit upstream ↔ install.cmd npm pkg 一致性 cross-check (B-28 + RESEARCH § 4.1.2 `NPM_PKG_RE`);ROADMAP L115 "模拟恶意 fork" 验收兑现 |
| T-2.4-04 | Tampering | cc-hook 写 `~/.claude/settings.json` 破 user 现 hooks 块 | mitigate | B-21 idempotent check (matching hook 已存 skip) + backup() before write (sister npxSkillInstaller L154-155) + verify (re-read JSON.parse + grep hook_command present);Wave 3 T3.1 mid-task gate (R7) |
| T-2.4-05 | Spoofing | dashboard SSE endpoint 被恶意 client 大量 connect | mitigate | B-27 localhost-only bind `127.0.0.1` (NOT 0.0.0.0);RESEARCH § 11 已 anchor;Wave 3 T3.2 显式 sub-step (dashboard.mjs L478 listen 改 `'127.0.0.1'`) |
| T-2.4-06 | DoS | EE-4 BLOCKER 误触发 spurious CI fail 阻 ship | mitigate | B-12 manual rerun (NOT auto-spawn) 避免 cascade fail;B-15 Wave 2 spike baseline 校准阈值;白名单 `assumed (per D-NN)` 防 false-pos (R3 + R4) |
| T-2.4-07 | Tampering | manifest `dashboard-autospawn.yaml` hook_command user-modified inject 恶意 cmd | mitigate | TypeBox runtime validate (B-22 strict enum + additionalProperties: false);audit `auditInstallCmdIntegrity` install-time pre-flight catch;hook_command 进 settings.json hooks block 被 CC 内建 hook gate 进一步 sandbox |
| T-2.4-08 | Information Disclosure | dashboard /api/projects 暴露用户 cwd 路径 (~/.claude/harnessed-projects.json content) | accept | localhost-only bind (B-27) — 同主机 user 已可读 fs;Phase 2.4 dev tool scope;v0.3.0 跨主机 remote dashboard 时再加 auth |
| T-2.4-09 | Repudiation | cc-hook install 历史 audit | mitigate | npxSkillInstaller updateInstalled() provenance 4 字段 (installed_at / installed_by / source_url / install_type) 沿袭 (B-21);uninstall 同步 provenance 撤销 |
| T-2.4-10 | Elevation of Privilege | ralph-loop Win sentinel subagent spawn 取 user shell 权 | accept | mock subagent (B-30 + O5) 不 spawn real CC SDK,Phase 2.4 OOS;v0.3.0 prep T1.1 real SDK 时加 sandbox confirmAt L3 |
</threat_model>

<verification>
## Phase Verification

- **Wave 0** — README counter gate local pre-flight 跑通 + 3-OS CI Wave 0 全 step 全绿 + ADR 编号实占 + sed-replace zero residue
- **Wave 1 + Wave 2** — doctor 5 check + EE-4 plan-checker schema + spike baseline 校准 + 项目-local agent override + unit/integration test 全 pass
- **Wave 3** — cc-hook installer dispatch 7th + 3 处 enum 加 + dashboard SSE + 多项目 + 软限 trade-off Resolved (T3.4 fallback 决断)
- **Wave 4** — audit 完整版扩 + helper split + Win sentinel 5 fixture 全 pass on Win matrix
- **Wave 5** — 30 doctor + 30 plan-checker + e2e 全链路 pass
- **Wave 6** — 3-OS CI 全绿 + 3 tag + ADR 0001-0012 main body 0 diff + v0.2.0 milestone archive 完成 + ROADMAP 4/4 ✅
</verification>

<success_criteria>
## Success Criteria

1. F1-F8 acceptance bar 全 pass (§ 6 reproduction commands 全 PASS)
2. 7 Wave checkpoint 全 PASS (§ 7 table)
3. A7 守恒 — ADR 0001-0012 main body 0 diff;ADR 0013 errata 9 章节 accepted;baseline tag 1-12 → 1-0013;ci.yml A7 iter 同步
4. Karpathy hard limit 守 — `doctor.ts` ≤215L (5% 超容忍);`origin-check.ts` ≤80L;`ccHookAdd.ts` ≤100L;`audit.ts` ≤200L (helper split 后);`audit-helpers.ts` ≤50L;`run-plan-checker.mjs` ≤100L;`plan-review-schema.yaml` ≤60L;`dashboard.mjs` ≤700L soft cap (dev tool,T3.4 fallback if >650L)
5. 3-OS CI 全绿 (Win Git Bash + macOS + Linux) 含 README counter gate + EE-4 plan-checker step + ralph-loop Win sentinel + 30 fixture × 2 + e2e
6. **v0.2.0 milestone close** — `adr-0013-accepted` + `v0.2.0-alpha.4-doctor` + **`v0.2.0`** 3 tag + .planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md archive + .planning/v0.2.0-MILESTONE-AUDIT.md NEW + ROADMAP § v0.2.0 4 phase 全 ✅ + STATE.md Phase 2.4 SHIPPED + v0.3.0 启动 prereq
</success_criteria>

<output>
After completion, create `.planning/phase-2.4/2.4-SUMMARY.md` (沿袭 Phase 2.3 SUMMARY 模板) — 含 Phase 2.4 全 ship marker + v0.2.0 milestone close note + v0.3.0 启动 prereq 列表。
</output>
