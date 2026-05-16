# Phase 3.2 — RESEARCH (Wave A R2 focus pack)

> **Researched**: 2026-05-16
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7, 1M ctx)
> **Scope**: 13 sections — Win shell flavor (D-01) / JINJA regex variant (D-02) / throw vs fallback (D-02) / schemaVersion 9th surface (D-04) / workflow.yaml DSL (D-03) / 5 skill stub pattern (D-03) / governance lazy read (D-04) / W0.1 cli-audit root-cause deep-dive (locally re-verified) / W0.2 STATE/README format SSOT / D-01 + D-04 .harnessed/ file separation / validation architecture (Nyquist) / wave topology / Karpathy anti-patterns
> **Overall confidence**: HIGH (§1 Win shell — sister Phase 2.4 doctor.ts L82-83 + `checkWinBash` L98-126 直证 / §4 schemaVersion — `src/types/schemaVersion.ts` L34-58 直证 + Phase 3.1 8th surface 实证 / §5 workflow.yaml DSL — `workflows/execute-task/phases.yaml` 直证 / §6 skill stub — `skills/karpathy-baseline/SKILL.md` 直证 / §8 W0.1 — 本 session local 实测 audit.ts L17-19 + L129-131 直证 + cli-audit.test.ts run 2 fail 实测 / §9 W0.2 — README grep 11 match vs STATE.md grep 1 match 实测 cross-check / §10 file separation — Karpathy single-responsibility 推论) · MEDIUM-HIGH (§2 JINJA regex — 5 candidate regex 标准 JavaScript 行为, no extra dep / §3 throw vs fallback — mustache strict + jinja2 strict_variables=True 行业 cross-check) · MEDIUM (§7 governance lazy read perf — 5 phase × 1 fs.readFile 估算约 5ms, 未 spike / §11 validation architecture — projection 而非实测 / §13 anti-patterns — 经验值, 未 spike)
> **Valid until**: ~2026-08-15 (workflows/plan-feature DSL design 与 ADR 0014 sister; gstack-office-hours / office-hours CLI 命令稳定 — gstack 自身 v0.x release cadence)

---

## § 0 Scope note + sources

### What this RESEARCH does NOT redo

4 D-decisions D-01~D-04 已 interactive AskUserQuestion 锁定 (`3.2-CONTEXT.md` L40-114):

- **D-01** gstack 命令前缀探测策略 = **PROBE** (doctor 运行时探三选一 + fallback 用户选)
- **D-02** workflow `invokes` 变量插值机制 = **JINJA-like `{{ prefix }}`** 模板替换 (zero-dep)
- **D-03** plan-feature reference 实装范围 = **WIRED** (5 phase 桩 + governance gate 接 + 不接外部 gsd-discuss/plan/execute 真 spawn)
- **D-04** CEO veto halt_workflow 触发 mechanism = **PUSH** (gstack veto 写 `.harnessed/governance.json` → workflow next-phase 读)

本 RESEARCH 聚焦 KICKOFF + 3.2-CONTEXT § Claude's Discretion + W0 backlog 3 项的 R2 实装支撑 (不再二次探索 D 决策的 alternative)。

### Critical pre-existing assets discovered (MUST inform planner)

1. **W0.1 cli-audit env-dep 本 session local 实测 verified — 2 fail still red**:
   - `corepack pnpm test -- --run tests/unit/cli-audit.test.ts` 输出 `Test Files 1 failed | 76 passed` / `Tests 2 failed | 593 passed | 4 skipped`
   - Fail #1 L87: `empty manifest dirs → exit 0` — actual `code=1` (expected 0)
   - Fail #2 L96: `manifest with valid git_ref → exit 0` — actual `code=1` (expected 0)
   - Fail #3 (existing-passing): L99 `manifest with forbidden git_ref (HEAD) → exit 1` — actual 1 (✅ pass — but for wrong reason: runtime error returns 1 not git_ref policy 1)
   - **Root cause direct evidence**: `src/cli/audit.ts` L17-19 **eager import** `auditOriginIntegrity / auditInstallCmdIntegrity / auditProvenance` from `lib/audit-helpers.ts`. `lib/audit-helpers.ts` L7 `import { spawnSync } from 'node:child_process'`; L69 `auditProvenance()` runs `spawnSync('node', ['scripts/check-provenance.mjs'])` unconditionally. `cli-audit.test.ts` L13-14 mocks `fs/promises` (readdir + readFile) + `validateManifestFile` but **不 mock** `child_process.spawnSync` 也 **不 mock** `lib/audit-helpers.ts`. **不传 `--skip-runtime`** → runtime helpers 执行 → `auditOriginIntegrity` 跑 `checkOrigin(cwd, { allowFork: false })` 在 mock dirs 下 fail → exit 1.
   - **Acceptance bar locked**: 本 session 复现 root cause + fix path locked (§ 8 详)。 [VERIFIED LOCAL: `corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -50` 2 fail 实测]

2. **gstack 命令名称约定 — `gstack-office-hours` 与 `office-hours` 两 binary 候选** (D-01 PROBE 直接对应):
   - 3.2-CONTEXT.md L48: PROBE 探 `which gstack-office-hours` (Linux/macOS/Git Bash) + `where gstack-office-hours.exe` (Win cmd/pwsh) + `which office-hours`
   - 三状态: `gstack-` only / `office-hours` only / both OR neither
   - 单一命中 → 写 `.harnessed/config.json` `gstack_prefix: 'gstack-' | ''`; both/neither → console.log + exit 1 (Karpathy fail-loud)
   - [HIGH — 3.2-CONTEXT.md § Implementation hint L48-54 直证]

3. **schemaVersion 8-surface 注册表完整, 9th surface candidate `harnessed.governance.v1`**:
   - `src/types/schemaVersion.ts` L34-45 verified 8 surfaces: `routingSnapshot / handoffDoc / phasesYaml / manifestState / installerState / routeDecisionLog / checkpoint / currentWorkflow`
   - Phase 3.1 加 currentWorkflow.v1 = 7→8 sister precedent (`schemaVersion.ts` L22 注释 "Phase 3.1 W1 T1.1 ADD 8th surface")
   - 本 phase 加 `harnessed.governance.v1` 9th 走同 pattern: +1 SCHEMA_VERSIONS entry + 1 SchemaVersionLiteral Type.Literal + 4-5L cross 2 处 (§ 4 推荐)
   - [VERIFIED: src/types/schemaVersion.ts:34-58]

4. **`doctor.ts` 175L 当前 (verified) + B-03 5% tolerance 估算修正**:
   - `wc -l src/cli/doctor.ts` 输出 **175L** (不是 KICKOFF 描述的 215L)
   - 加 6th `checkGstackPrefix()` ~30L → 175→205L; 仍 > 200L Karpathy hard limit by 5L
   - **Helper split 仍 required**: `src/cli/lib/probe-gstack.ts` NEW ~40-50L (sister `origin-check.ts` 80L pattern), `doctor.ts` 仅 import + dispatch ~5L = 175+5=180L ≤ 200L safe
   - [VERIFIED: `wc -l src/cli/doctor.ts` 本 session 实测 = 175]

5. **`audit.ts` 167L + `audit-helpers.ts` 73L baseline** (确认 W0.1 fix scope 不破 hard limit):
   - `wc -l src/cli/audit.ts` = 167L (≤200L hard limit safe)
   - W0.1 fix 仅改 `tests/unit/cli-audit.test.ts` (mock 加 + 拆) OR `src/cli/audit.ts` 内 lazy import (3-5L 改动 + 无副作用 hard limit headroom)
   - [VERIFIED: `wc -l src/cli/audit.ts` 本 session 实测 = 167]

6. **Sister `workflows/execute-task/phases.yaml` DSL 验证 — 28L 4-phase reference**:
   - `workflow:` (string) + `phases:` (array of 6-field objects: `id / name / upstream / model / skills / max_iterations`)
   - phase 1 `01-clarify` `skills: ['brainstorming']` + phase 3 `03-test` `skills: ['test-driven-development']` 是 sister stub pattern reference (skill 名 → invoke 路由)
   - 4-phase model_tier: `[opus, sonnet, sonnet, haiku]` (Phase 2.2 CD-2)
   - **plan-feature.yaml 加 `invokes` field** (R7.4 直接对应) + `on_veto` field (workflow-level, NOT phase-level — 推 § 5)
   - [VERIFIED: workflows/execute-task/phases.yaml:1-28]

7. **`skills/karpathy-baseline/SKILL.md` 是 only existing SKILL.md** (sister pattern verify):
   - `glob skills/*/SKILL.md` 仅 返 `skills/karpathy-baseline/SKILL.md` (其他 skill 由 manifest 外引)
   - 5 plan-feature stub `skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md` 是 sister pattern 加 NEW (§ 6 推 frontmatter + body 模板)
   - [VERIFIED: Glob `skills/*/SKILL.md` 本 session 实测]

8. **README/STATE per-phase shipped marker format drift verified — README 11 vs STATE 1**:
   - `grep -cE "^[-*]?\s*\*?\*?Phase\s+[0-9]+\.[0-9]+\*?\*?.*[Ss][Hh][Ii][Pp][Pp][Ee][Dd]" README.md` = **11** (L46-56 全 line-start `- **Phase X.Y shipped** ✅` consistent)
   - 同 regex on STATE.md = **1** (仅 L36 表格 `| v0.2.0 ... | 4/4 | 🎯 **SHIPPED & ARCHIVED**`)
   - STATE.md per-phase ship 全在 prose narrative 不带 line-start `- **Phase X.Y SHIPPED**` literal
   - **SSOT 推 README format** (Option A § 9 详) — visibility 用户面 + grep-friendly
   - [VERIFIED LOCAL: grep count 本 session 实测]

9. **`.github/workflows/ci.yml` W0.3 step verified — `continue-on-error: true` round 1**:
   - L200-211 `README completeness check` step `continue-on-error: true` + console.log warn (not error) + advisory message "fix in Phase 3.2 W0 prereq before ENFORCE flip"
   - Phase 3.2 W0.2 ENFORCE flip = 删 L201 `continue-on-error: true` (1-line CI delta) + STATE.md per-phase entries 加 line-start `**Phase X.Y SHIPPED**` marker (~10 line content delta)
   - [VERIFIED: ci.yml L191-211]

10. **`.harnessed/` runtime dir 现 use status**:
    - Phase 1.2 引 `.harnessed/backup/`
    - Phase 3.1 引 `.harnessed/checkpoints/` + `.harnessed/archive/` + `.harnessed/current-workflow.json`
    - 本 phase 加 `.harnessed/config.json` (D-01) + `.harnessed/governance.json` (D-04) — 2 NEW file
    - sister Phase 3.1 W1-W4 .harnessed/ 引入历程: 4 path 已存, 本 phase + 2 = 6 path/file total
    - [VERIFIED: Phase 3.1 RESEARCH § 0.6 grep src/ → 0 .harnessed/ ref pre-Phase-3.1, 本 phase 是 .harnessed/{config,governance}.json 首消费者]

### Sources cited

| Source | Lines | Confidence | Purpose |
|--------|-------|-----------|---------|
| `src/cli/doctor.ts` | L1-175 | HIGH | 5-check baseline + Win shell flavor (`checkWinBash` L98-126) + `--json` flag pattern (L141-172) — 6th check 沿袭基础 |
| `src/cli/audit.ts` | L1-167 | HIGH | eager import root cause (L17-19) + runtime helpers dispatch (L128-132) — W0.1 fix scope |
| `src/cli/lib/audit-helpers.ts` | L1-73 | HIGH | `auditProvenance` unconditional `spawnSync` (L69) — W0.1 root cause direct |
| `src/cli/lib/origin-check.ts` | L1-80 | HIGH | sister-share helper pattern (`spawnSync` finder + status enum) — `probe-gstack.ts` 沿袭模板 |
| `src/types/schemaVersion.ts` | L1-72 | HIGH | 8-surface register + branchOnSchemaVersion + 9th surface 加 cost |
| `src/workflow/loadPhases.ts` | L1-30 | HIGH | extend point for `interpolateInvokes` step |
| `src/checkpoint/state.ts` | L1-76 | HIGH | sister file-based state machine pattern (`.harnessed/current-workflow.json`) — `governance.ts` 沿袭 |
| `src/checkpoint/engineHook.ts` | L1-48 | HIGH | engineCheckpointHook reuse target (paused state from veto) |
| `workflows/execute-task/phases.yaml` | L1-28 | HIGH | workflow.yaml DSL reference for plan-feature workflow.yaml |
| `skills/karpathy-baseline/SKILL.md` | (existing) | HIGH | sister SKILL.md stub format reference |
| `.github/workflows/ci.yml` | L114-211 | HIGH | W0.2 ENFORCE flip 1-line delta location |
| `tests/unit/cli-audit.test.ts` | L1-114 | HIGH | W0.1 mock setup baseline (vi.mock fs/promises + validateManifestFile only, missing child_process + lib/audit-helpers) |
| **3.2-CONTEXT.md** | L40-114 | HIGH | 4 D-decisions 全 LOCKED + implementation hints verbatim |
| **3.2-KICKOFF.md** | L58-67 | HIGH | W0 backlog 3 项 + W0.1 priority bump + 必修 first task |
| `.planning/phase-3.1/RESEARCH.md` | L1-237 | HIGH | sister format reference (990L 12 sections) + Phase 3.1 D-04 WIRE-IN 模式 |
| `.planning/STATE.md` | L1-80 | HIGH | per-phase shipped marker format drift verify (1 line-start match) |
| `README.md` | L1-80 | HIGH | per-phase shipped marker format SSOT candidate (11 line-start matches) |
| `.planning/REQUIREMENTS.md` | L257-279 | HIGH | R7.1 (5-phase 流水) + R7.4 (gstack 前缀探测) — 验收 bar |
| **External** | | | |
| Node.js `child_process.spawnSync` docs | nodejs.org/api/child_process | HIGH | `which`/`where` Win cross-OS 行为 + status 0 = found |
| MDN `String.prototype.replace` with regex `/g` flag | mdn.io | HIGH | JINJA `/\{\{\s*(\w+)\s*\}\}/g` 标准 JS 行为 |
| Mustache.js strict mode | github.com/janl/mustache.js | MEDIUM | 行业 cross-check throw on missing var (sister 推 D-02 throw) |
| Jinja2 strict_variables=True | jinja.palletsprojects.com | MEDIUM | 行业 cross-check throw on missing var |

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 gstack 命令前缀探测策略 = PROBE** (doctor 运行时 spawn `which`/`command -v` 探三选一 + fallback prompt)
  - Rationale: R7.4 验收 "用户三种前缀场景任一都跑通" 明确指向 runtime 自动检测; PROBE zero-friction; fallback prompt 兜底 0/2 响应 ambiguity; INTERACTIVE first-run 在 CI/headless 跑不动
  - Implementation: `src/cli/doctor.ts` 加第 6 check `checkGstackPrefix()` + helper `src/cli/lib/probe-gstack.ts` ≤50L
  - `.harnessed/config.json` schema 加 `gstack_prefix: 'gstack-' | ''`
  - `--json` flag 输出 prefix 检测结果

- **D-02 workflow `invokes` 变量插值机制 = JINJA-like `{{ prefix }}` 模板替换** (zero-dep str.replace)
  - Rationale: zero-dep + cross-OS + 用户直观 `{{ var }}` 可读 + Karpathy YAGNI
  - Implementation: `src/workflow/interpolate.ts` NEW ~30L — `interpolate(template, vars): string`
  - regex `/\{\{\s*(\w+)\s*\}\}/g` 找所有 placeholder; 替换 vars[name]; 未定义 var → throw `InterpolationError` (Karpathy fail-loud)
  - vars 来源: `.harnessed/config.json` `gstack_prefix`

- **D-03 plan-feature reference 实装范围 = WIRED** (5 phase 桩 + governance gate 接 + 不接外部 gsd-discuss/plan/execute 真 spawn)
  - Rationale: SKELETON 无法验 R7.1 30 场景; FULL Phase 3.3+ dogfood 才合理; WIRED 中庸验 workflow runtime + governance veto + checkpoint 集成
  - Implementation: `workflows/plan-feature/` NEW (workflow.yaml + 5 skill stubs) + `src/workflow/run.ts` ≤80L
  - 5 skill stub 返 mock `{status:'ok', output:'<stub>'}` 模拟 phase 成功转换 (Phase 3.3+ dogfood 时换真)

- **D-04 CEO veto halt_workflow 触发 mechanism = PUSH** (gstack veto 写 `.harnessed/governance.json` → workflow next-phase 读)
  - Rationale: zero coordination; 沿袭 Phase 3.1 `.harnessed/current-workflow.json` state machine pattern; POLL anti-pattern (Phase 2.4 SSE polling 已 root-cause defer); EVENT signal cross-OS 不可靠
  - Implementation: `.harnessed/governance.json` schema (`harnessed.governance.v1` 9th surface OR 复用 — Wave A R2 决, § 4 推荐 9th)
  - `src/workflow/governance.ts` `readGovernance()` + `isVetoed()` (≤25L)
  - `src/workflow/run.ts` next-phase 转换前 1 行 `if (isVetoed()) { engineHook.paused(); return }` (复用 Phase 3.1 engineHook)
  - gstack 写 governance.json 不在本 phase scope (gstack 自身职责; harnessed 只 reader)

### Claude's Discretion

- **doctor PROBE Win shell flavor 兼容性** — Win Git Bash 走 `which` (POSIX) vs Win PowerShell/cmd 走 `where` — § 1 决 (推 doctor.ts L80-83 sister `checkJq` pattern: `process.platform === 'win32' ? 'where' : 'which'`)
- **JINJA template error handling** — 未定义 var fallback 空 vs throw — § 3 决 (推 throw)
- **5 skill stub mock 输出格式** — 是否含 elapsed_ms / mock_decision metadata — § 6 决 (推 minimal `{status:'ok', output:'<stub for plan-feature-{name}>'}`)
- **governance.json schemaVersion surface 决策** — 复用 current-workflow.v1 OR 新 9th `harnessed.governance.v1` — § 4 决 (推 新 9th)
- **plan-feature workflow.yaml DSL choice** — sister `workflows/execute-task/phases.yaml` 沿袭 — § 5 决 (推 phases array + invokes field + workflow-level on_veto)
- **W0.2 README format normalize SSOT 选哪个** — README `- **Phase X.Y shipped** ✅` line-start vs STATE.md prose line-mid — § 9 决 (推 README format SSOT)
- **dashboard SSE governance.json 加 watcher** — Wave 0 spike 1h 评估 — 推 SKIP 本 phase (Phase 3.3+ 集成; sister Phase 3.1 D-Claude's-discretion 同样推 spike-then-skip)

### Deferred Ideas (OUT OF SCOPE)

- plan-feature workflow 真接 gsd-discuss/plan/execute spawn → Phase 3.3+ dogfood
- aliases.yaml + deprecation marker + known-good 版本组合 → Phase 3.3
- 路由命中率 ≥ 85% 验收 + token budget 监控 → Phase 3.4
- EE-4 BLOCKER auto-spawn rerun → Phase 3.4 后 evaluate (Phase 2.4 down-scope)
- userSpawn session_id capture → Phase 3.4+ (DEFERRED #2 Phase 3.1 carry)
- dashboard SSE governance.json watcher integration → Phase 3.3+ (本 phase SKIP)
- CONFIG strategy (`.claude/settings.json` explicit gstack_prefix) → D-01 evaluated rejected
- INTERACTIVE first-run prompt strategy → D-01 evaluated rejected (CI/headless 不支持)
- BASH `${PREFIX}` envsubst strategy → D-02 evaluated rejected (cross-OS 差异)
- SCHEMA 模板化字段 (structured invokes) → D-02 evaluated rejected (Karpathy YAGNI)
- SKELETON plan-feature (yaml-only) → D-03 evaluated rejected
- FULL plan-feature (真接外部 spawn) → D-03 evaluated rejected (scope 太大)
- POLL governance state file (timer-based) → D-04 evaluated rejected (sister Phase 2.4 SSE polling anti-pattern)
- EVENT SIGUSR1 signal → D-04 evaluated rejected (Win signal 差异)

</user_constraints>

---

## Project Constraints (from CLAUDE.md)

> 用户全局 CLAUDE.md 关键 directive 摘录, 与 locked decisions 等同权威。

- **Karpathy simplicity always-on (心法)**: Think Before Coding / Surgical Changes / 小步原子修改 / Goal-Driven Execution / 追求最小有效代码 — 所有 src/ 文件 ≤ 200L hard limit (B-06 + B-26 sister)
- **GSD orchestration + planning-with-files persist**: phase 文档落 `.planning/phase-3.2/`, task_plan.md + progress.md + findings.md
- **superpowers subagent execute + ralph-loop**: 每子任务 ralph-loop completion-promise "COMPLETE"; TDD 强 recommend 核心业务逻辑 (本 phase workflow.run.ts + governance.ts + interpolate.ts 是核心业务, 推 TDD)
- **Web 搜索路由 Tavily / Exa MCP 优先** (内置 WebSearch fallback), `gh CLI` 优先 over GitHub MCP
- **commit 时 Karpathy "Simplicity First"**: 单 phase 内多次 atomic commit; commit message 含 "why" 不仅 "what"
- **Biome lint preempt before commit** (MEMORY feedback): `pnpm exec biome check --write` 本地预跑 — 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 (本 phase commit 前必跑)
- **GSD workflow decision cadence** (MEMORY): terse menu-choice shorthand (PP/AA/CC/MM/SR/NN) + sister-review severity tiering 跟之前规则一样

planner 必须验证每 task ≤ 200L hard limit + 沿袭 Phase 3.1 Wave A R2 + W0 backlog absorb 模式 + sister review M+L+T 三档分级.

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **R7.1** | 5-phase 流水 (reference implementation): gstack-decision → brainstorm (+ui-ux-pro-max UI 任务) → gsd-discuss → gsd-plan → persist (planning-with-files); 验收 30 plan-feature 真实场景全跑通; CEO veto 时 halt_workflow 不再续 | § 5 workflow.yaml DSL + § 6 5 skill stub pattern + § 7 governance veto lazy read (halt_workflow) + § 11 validation architecture (functional/integration/failure-mode test counts) |
| **R7.4** | gstack 命令前缀探测: doctor 探三选一 (默认 `/office-hours` / `--no-prefix` / `--prefix gstack-`) 写入 `.harnessed/config.json`; workflow `invokes` 字段变量插值; 验收用户三种前缀场景任一都跑通 | § 1 Win shell flavor + § 2 JINJA regex + § 3 throw vs fallback + § 10 .harnessed file separation |
| **ROADMAP Phase 3.2 三选一探测** | acceptance bar | § 1 (doctor 6th check) |
| **ROADMAP Phase 3.2 `invokes` 字段插值** | acceptance bar | § 2 + § 3 (interpolate.ts JINJA + throw) |
| **ROADMAP Phase 3.2 governance 层 pause + on_veto** | acceptance bar | § 4 (governance.v1 9th surface) + § 7 (lazy read) |
| **ROADMAP Phase 3.2 用户 gstack 装哪种前缀都能跑通** | E2E dogfood acceptance | § 1 + § 5 + § 11 (e2e 3 fixture: gstack- / `''` / both/neither) |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| gstack 命令前缀 runtime 探测 (PROBE) | CLI subcommand (`doctor`) | helper `src/cli/lib/probe-gstack.ts` | doctor 已 own 5 health check; 第 6 check 沿袭; spawnSync `which`/`where` 是 CLI-layer concern |
| `.harnessed/config.json` 写盘 | helper `probe-gstack.ts` (writer) | TypeBox schema layer (`src/types/schemaVersion.ts`) | sister `src/checkpoint/state.ts` 模式 — helper own writer, schema layer own validate |
| workflow.yaml `invokes` JINJA 插值 | workflow loader (`src/workflow/`) | helper `interpolate.ts` (pure fn) | loader 路径 input/output 是 workflow tier; interpolate 是 pure string transform helper |
| plan-feature 5-phase runtime orchestration | workflow runner (`src/workflow/run.ts`) | checkpoint engine (Phase 3.1 `engineHook.ts`) consumer | runner own state transition + skill stub dispatch; checkpoint 是 second-tier reuse (paused state via veto) |
| governance.json read/veto check | workflow tier (`src/workflow/governance.ts`) | file-based state layer (`.harnessed/`) | sister `src/checkpoint/state.ts` file-based 单一职责 pattern |
| governance.json **write** (CEO veto trigger) | **out of harnessed scope** (gstack 自身职责) | — | harnessed 仅 reader; gstack 自身 CLI 写; D-04 lock |
| 5 skill stub mock output | `skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md` | workflow runner dispatch | skill SKILL.md tier 沿袭 sister `skills/karpathy-baseline/SKILL.md` |
| W0.1 cli-audit test mock fix | test layer (`tests/unit/cli-audit.test.ts`) | — | 仅 test concern, src/cli/audit.ts 不动 (推 § 8) |
| W0.2 README/STATE format SSOT normalize | docs layer (README.md + .planning/STATE.md) | CI ENFORCE flip (ci.yml L201 delete `continue-on-error: true`) | docs tier 内容修 + CI tier 1-line gate flip |

**Why this matters**: Phase 3.2 跨 3 tier (CLI / workflow / docs+CI), 每 tier 单一职责清晰 — workflow tier 不写 governance.json (gstack 责)、CLI tier 不解 JINJA (workflow loader 责)、helper tier 不 spawn subprocess (除 doctor probe-gstack)。 sister Phase 3.1 D-04 WIRE-IN 9 phase 模式同样跨 tier 但各 tier 单一责。

---

## § 1 Win shell flavor for D-01 PROBE (`which` vs `where`)

**Confidence: HIGH** — sister Phase 2.4 doctor.ts L80-83 + L98-126 直证 + Node `child_process` cross-OS 一致行为。

### 1.1 推荐: 沿袭 `checkJq` pattern — `process.platform === 'win32' ? 'where' : 'which'` ⭐

**Direct evidence — `src/cli/doctor.ts` L79-95 `checkJq`** (本 phase `checkGstackPrefix` 沿袭模板):

```typescript
function checkJq(): CheckResult {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, ['jq'], { encoding: 'utf8' })
  if (r.status === 0 && r.stdout.trim().length > 0) {
    return {
      name: 'jq present',
      status: 'pass',
      message: r.stdout.split(/\r?\n/)[0]?.trim() ?? 'jq found',
    }
  }
  // ...fail branch with fix hint
}
```

**Pattern applied for `probe-gstack.ts`** (推荐 ~40L NEW):

```typescript
// src/cli/lib/probe-gstack.ts NEW ≤50L (sister origin-check.ts 80L)
import { spawnSync } from 'node:child_process'

export type GstackPrefix = 'gstack-' | ''
export interface ProbeResult {
  status: 'pass' | 'fail'
  prefix?: GstackPrefix
  detail: string
  fix?: string
}

function probeOne(cmd: string): boolean {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  // Win `where gstack-office-hours` 不需 `.exe` suffix (where 自动探 PATHEXT)
  const r = spawnSync(finder, [cmd], { encoding: 'utf8' })
  return r.status === 0 && r.stdout.trim().length > 0
}

export function probeGstackPrefix(): ProbeResult {
  const hasGstack = probeOne('gstack-office-hours')
  const hasBare = probeOne('office-hours')
  if (hasGstack && !hasBare) return { status: 'pass', prefix: 'gstack-', detail: 'gstack-office-hours found' }
  if (!hasGstack && hasBare) return { status: 'pass', prefix: '', detail: 'office-hours found' }
  if (hasGstack && hasBare) {
    return {
      status: 'fail',
      detail: 'both gstack-office-hours AND office-hours found — ambiguous',
      fix: 'edit .harnessed/config.json manually: `{"gstack_prefix":"gstack-"}` OR `{"gstack_prefix":""}`',
    }
  }
  return {
    status: 'fail',
    detail: 'neither gstack-office-hours nor office-hours found in PATH',
    fix: 'install gstack: `npm i -g @gstack/cli` (or your preferred install method)',
  }
}
```

[HIGH — sister `checkJq` L80-95 直证 pattern; `spawnSync` cross-OS 一致行为 Node 22+ stable]

### 1.2 B-04 Win shell flavor — Git Bash vs cmd vs pwsh 行为差异

**Sister doctor.ts `checkWinBash` L98-126 已锁 ralph-loop 兼容路径** = **必须 Git Bash** (WSL bash.exe 阻 + native cmd/pwsh 走 `where`):

| Win shell | `which gstack-office-hours` 行为 | `where gstack-office-hours` 行为 | doctor 6th check 走哪 |
|-----------|----------------------------------|----------------------------------|---------------------|
| Git Bash | POSIX `which` 找到 (Git Bash 内置 which.exe) | 也找到 (where 是 native Win utility) | **走 `where`** (process.platform === 'win32') — Node 角度永远 Win |
| WSL bash.exe | Linux `which` 找 — **但 doctor.ts L115-123 已禁** WSL bash for ralph-loop 兼容 | 找不到 (Linux env 内无 where) | (用户应换 Git Bash, doctor `checkWinBash` 已 fail-loud) |
| native cmd | `which` 不存在 (Win 无 which.exe) — exit 1 fail | 找到 | **走 `where`** ✅ |
| native pwsh | `which` 是 alias for `Get-Command` (PS 内置 — 但 spawnSync 起 child cmd 默认走 cmd.exe 仍无) | 找到 | **走 `where`** ✅ |
| Linux/macOS | POSIX `which` 找到 | (不可用) | **走 `which`** ✅ |

**关键洞察** (sister `checkJq` L80-83 直接证据):
- Node `process.platform === 'win32'` **不区分** Git Bash / cmd / pwsh — 永远返 `'win32'`
- Node `spawnSync(finder, [arg])` 起 child process 默认走 cmd.exe (除非 `shell: true` 或 finder 自身是 bash 脚本)
- 故 `process.platform === 'win32' ? 'where' : 'which'` **是 cross-Win-shell 唯一稳路径** — Git Bash 用户也走 `where` (虽然他们 shell 里也有 `which`, 但 Node spawnSync 不继承 shell context)
- Sister Phase 2.4 W1 T1.2 `checkJq` Win/Linux/macOS matrix 验通 (`tests/cli/doctor.test.ts` 多 fixture cover) → 本 phase `checkGstackPrefix` 沿袭无新风险

[HIGH — sister Phase 2.4 W3 doctor MIN 5-check Win bash flavor 经验 + `checkJq` 直证 + Node docs cross-check]

### 1.3 Sister Phase 2.4 B-04 + Phase 3.1 sigintTrap Win 差异 cross-reference

**Phase 2.4 B-04** 锁: Win 用户必走 Git Bash for ralph-loop 兼容; **本 phase 不引新 Win 风险** — `spawnSync('where', ['gstack-office-hours'])` Node 跨 shell 一致。

**Phase 3.1 sigintTrap Win 行为** (RESEARCH.md § 2.2):
- Win SIGINT 来源 = Console Control Event `CTRL_C_EVENT` Node 抽象为 SIGINT
- Win 双 Ctrl+C 自动 force terminate (OS 行为, Node 无法 override)
- **本 phase governance lazy read 不涉信号** — 1 行 `fs.readFile` sync/async 都不涉 SIGINT trap 路径
- 但 `harnessed resume` (Phase 3.1 12th CLI) 与本 phase governance 交互 — § 7 详

[HIGH — Phase 2.4 + 3.1 sister precedent direct]

### 1.4 Karpathy fail-loud message — 0/2 hits + both hits

**3 状态 message 推荐** (sister origin-check.ts L73-78 fix hint pattern):

| 状态 | message | fix hint |
|------|---------|---------|
| `gstack-` only (single hit) | `gstack-office-hours found at <path>` | (none — pass) |
| `office-hours` only (single hit) | `office-hours found at <path> (--no-prefix mode)` | (none — pass) |
| both hits (ambiguous) | `both gstack-office-hours AND office-hours found — ambiguous` | `edit .harnessed/config.json manually: '{"gstack_prefix":"gstack-"}' OR '{"gstack_prefix":""}'` |
| neither (no hit) | `neither gstack-office-hours nor office-hours found in PATH` | `install gstack: npm i -g @gstack/cli (or your preferred install method)` |

`process.exit(1)` 由 doctor.ts 主循环 hasFail branch 处理 (L173, B-06 warn≠fail 已 lock; 本 check 是 fail, 触发 exit 1)。

---

## § 2 JINJA regex variant for D-02

**Confidence: HIGH** — 5 候选 regex 标准 JavaScript `String.prototype.replace` 行为 (MDN docs direct), 选最简 (Karpathy YAGNI)。

### 2.1 推荐: `/\{\{\s*(\w+)\s*\}\}/g` simple word match ⭐

**5 候选 regex pattern**:

| # | Regex | Match | Edge case | Karpathy fit |
|---|-------|-------|-----------|--------------|
| (a) ⭐ | `/\{\{\s*(\w+)\s*\}\}/g` | `{{ var }}` / `{{var}}` / `{{ var}}` — 各种空白 | `\w` = `[A-Za-z0-9_]`, 排除 `.` `-` `[]` | ✅ YAGNI; vars 是 `gstack_prefix` 等单 word, 不需 dot-path |
| (b) | `/\{\{\s*([\w.]+)\s*\}\}/g` | + dot path `{{ a.b.c }}` | 需 vars 是 nested object 才有意义; 本 phase vars 单层 `{gstack_prefix: ''}` 不需 | ❌ over-engineered (D-02 evaluated rejected SCHEMA approach) |
| (c) | `/\{\{\s*([\w.\-\[\]]+)\s*\}\}/g` | + array index `{{ items[0] }}` | full mustache spec | ❌ massive over-engineered |
| (d) | `/(?<!\\)\{\{\s*(\w+)\s*\}\}/g` | + escape `\{\{ literal \}\}` (negative lookbehind) | 需 escape 支持 — 本 phase 模板里不会有 literal `{{ ... }}` 需要保留 | ❌ YAGNI; lookbehind ES2018+ 但 Node 22 OK |
| (e) | `/\$\{(\w+)\}/g` | bash `${VAR}` envsubst style | D-02 evaluated rejected (cross-OS shell context) | ❌ rejected |

**推 (a)**: `\w` 是 ASCII word char `[A-Za-z0-9_]` — `gstack_prefix` underscore 命中 ✅; `\s*` allow 0 或多空白; `/g` 全局 match all。 sister `src/manifest/security.ts` 已用 regex 单 word match pattern.

[HIGH — JavaScript regex 标准 MDN 直证 + Karpathy YAGNI 直接对应]

### 2.2 推荐 implementation (推 ~25L NEW, ≤30L hard limit)

```typescript
// src/workflow/interpolate.ts NEW ≤30L (Karpathy hard limit by D-02 spec)
export class InterpolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterpolationError'
  }
}

/** Substitute {{ var }} placeholders in template with vars[name].
 *  Throws InterpolationError on undefined var (fail-loud per § 3). */
export function interpolate(template: string, vars: Record<string, string>): string {
  const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g
  return template.replace(PLACEHOLDER, (match, name: string) => {
    if (!(name in vars)) {
      throw new InterpolationError(`undefined template variable '${name}' (template: ${template.slice(0, 80)})`)
    }
    return vars[name]
  })
}
```

**特性**:
- Zero dep (sister Phase 3.1 D-01 TEMPLATE zero LLM/lib)
- Pure fn (no IO, no state) — unit testable to 100% branch coverage
- `template.replace(regex, callback)` MDN-standard — callback signature `(match, ...captures, offset, string)`
- `if (!(name in vars))` — `vars[name] === undefined` 是 `in` operator 边界 case: `{x: undefined}` 也算 `'x' in vars` 是 true; 本 phase vars 是 `Record<string, string>` 不存 undefined value, OK 用 `in` operator

[HIGH — MDN String.prototype.replace + `in` operator 直证]

### 2.3 6 unit test cell (3.2-CONTEXT.md § specifics L222 直接 spec)

| # | Test | Input template | vars | Expected |
|---|------|---------------|------|---------|
| 1 | happy single var | `'{{ prefix }}office-hours'` | `{prefix: 'gstack-'}` | `'gstack-office-hours'` |
| 2 | happy multi var | `'{{ a }}/{{ b }}'` | `{a: 'x', b: 'y'}` | `'x/y'` |
| 3 | undefined var throws | `'{{ unknown }}'` | `{prefix: 'gstack-'}` | throws `InterpolationError` |
| 4 | empty string value | `'{{ prefix }}cmd'` | `{prefix: ''}` | `'cmd'` (D-02 `--no-prefix` 场景, prefix='') |
| 5 | nested unsupported | `'{{ a.b }}'` | `{a: 'x'}` | throws `InterpolationError` (`\w` 不命中 `.`) |
| 6 | escape literal | `'\\{\\{ literal \\}\\}'` (literal `\{\{ literal \}\}` in source) | `{}` | (literal `\{\{` 不命中 `\{\{` regex, 保留原样) — **OR** throws if test author 写 `'{{ literal }}'` 期望被保留 — § 3 throw lock 倾向 fail-loud |

**5 #5 nested edge case 关键** — D-02 推 single-word 不支持 nested `.` path; 用户尝试 `{{ a.b }}` 立即 fail-loud (而不是 silent 不替换 confusion)。

[HIGH — 3.2-CONTEXT.md § specifics L222 直接 spec + JavaScript regex 行为 标准]

### 2.4 Anti-patterns to avoid

| Anti-pattern | Why bad | Counter |
|-------------|---------|---------|
| Use `mustache` / `handlebars` npm pkg | + 1 dep + over-engineered, 本 phase 单层 var single-word | Pure regex ~5L |
| Silent fallback `vars[name] ?? ''` on undefined | Hide config error — workflow.yaml typo 不被发现, debugging hell | Throw `InterpolationError` (§ 3 lock) |
| Cache compiled regex outside fn | Premature opt — V8 caches regex literal in fn scope自动 | inline regex in fn body (KISS) |
| `replaceAll` with non-regex (no capture group) | 不支持 callback access to captured group name | `replace(regex, callback)` 标准 |
| RegExp constructor `new RegExp(...)` dynamic | dynamic 无必要 — placeholder syntax 静态; security risk if user-controlled | literal regex `/\{\{\s*(\w+)\s*\}\}/g` |

[HIGH — Karpathy YAGNI + Phase 3.1 D-01 TEMPLATE zero-dep sister 模式]

---

## § 3 D-02 throw vs fallback empty — 推 throw (Karpathy fail-loud)

**Confidence: MEDIUM-HIGH** — 行业 cross-check: mustache strict + jinja2 strict_variables=True 是行业最佳实践; sister Phase 3.1 D-01 `enforceBudget` truncate-then-throw 同 fail-loud。

### 3.1 行业模式 cross-check

| Library | Default | Strict mode | 默认推荐? |
|---------|---------|-------------|---------|
| **Mustache.js** (JS) | Silent empty string | (no strict mode officially, but `escape` + custom resolver workaround) | ❌ silent default 是 OG mustache 弱点 |
| **Handlebars.js** | Silent empty string | `strict: true` option → throws | ⚠️ strict 是 optional opt-in |
| **Nunjucks** (JS, Jinja2 port) | Silent empty | `throwOnUndefined: true` env option | ⚠️ opt-in |
| **Jinja2** (Python) | Silent empty | `StrictUndefined` / `strict_variables=True` | ⚠️ opt-in |
| **Liquid** (Shopify) | Silent empty (renders as `nil`) | (no strict mode) | ❌ silent default |

**行业共识**: 模板库**默认** silent fallback 是历史包袱 (易用性 over correctness); 现代用法**全部** opt-in strict 模式 (PR/PRD 文档常 mandate strict)。

### 3.2 Karpathy + sister phase 3.1 模式 cross-check

| Pattern | Phase | 模式 |
|---------|-------|------|
| **D-01 enforceBudget** | 3.1 | 1k token > limit → truncate `last_task` → 再 > limit → truncate `key_decisions` → 再 > limit → `throw CheckpointBudgetError` (fail-loud final) |
| **D-02 KARPATHY 3-state** | 3.1 | unknown state → return null (fail-soft read) + writeCurrentWorkflow throw on schema drift (fail-loud write) — 分场景 |
| **D-04 WIRE-IN engineHook** | 3.1 | `phaseId === 'unknown'` → console.error warn-only (W-04 fail-loud non-blocking) — fail-loud advisory |
| **本 phase D-02 推 throw** | 3.2 | undefined var → throw — **写 (interpolate) 永远 fail-loud, 不允许 silent empty** |

**Karpathy 心法**: "Think Before Coding" + "fail loud 不假设" — 用户写 `{{ gstackk_prefix }}` typo 立即崩 (而不是 silent 替换成 `'office-hours'` 跑到 spawn 时才 ENOENT 找半天)。

### 3.3 推荐: throw on undefined var (Karpathy fail-loud) ⭐

**Implementation** (§ 2.2 已展示):

```typescript
if (!(name in vars)) {
  throw new InterpolationError(`undefined template variable '${name}' (template: ${template.slice(0, 80)})`)
}
```

**为何 throw**:
- workflow.yaml 是 author-controlled (gstack maintainer 或 harnessed maintainer), 不是 user-controlled — typo 是 bug 不是合法 case
- silent fallback 隐藏 typo → workflow run 时 `spawn('office-hours')` ENOENT → debug 链长
- throw 立即在 `interpolate()` 调用栈 fail → debug 链短 (loadPhases.ts → interpolate → throw)
- Error message 含 template snippet (前 80 char) → 直接定位 yaml 行

**特殊 case — D-04 `--no-prefix` 场景 `prefix: ''`**:
- `vars = {gstack_prefix: ''}` — `'gstack_prefix' in vars` 是 true → 不 throw → 替换为 `''` → `'office-hours'` ✅
- 这是 D-02 § specifics L222 test #4 直接 cover

[MEDIUM-HIGH — 行业模式 cross-check 多源 + Karpathy fail-loud sister Phase 3.1 D-01 enforceBudget 模式直证]

---

## § 4 D-04 governance.json schemaVersion 9th surface decision

**Confidence: HIGH** — `src/types/schemaVersion.ts` L34-58 直证 8 surface; Phase 3.1 W1 T1.1 加 currentWorkflow 8th 是 sister precedent。

### 4.1 决策: 新增 9th surface `harnessed.governance.v1` ⭐ (推 Option B)

| Option | LOC delta | Pros | Cons | Karpathy fit |
|--------|-----------|------|------|--------------|
| **A: 复用 `harnessed.current-workflow.v1`** add optional `governance?: {status, reason}` field | ~5L (+1 TypeBox optional field) | Zero new schema; existing reader path 无改 | Muddies state machine semantic (current-workflow 是 workflow lifecycle, governance 是外部 veto 状态 — single-responsibility 违) | ❌ 违 Karpathy single-responsibility |
| **B: 新增 9th surface `harnessed.governance.v1`** ⭐ | ~30L (+ TypeBox schema NEW 25L + 5L cross 2 处 SCHEMA_VERSIONS + SchemaVersionLiteral) | Single-responsibility (governance 独立 lifecycle); gstack 写时不动 harnessed 自家 current-workflow.v1; reader code 用 branchOnSchemaVersion 显式区分; sister Phase 3.1 W1 8th surface 模式 | + 1 surface (8→9); branchOnSchemaVersion table 加 1 entry | ✅ sister Phase 3.1 D-02 KARPATHY 3-state YAGNI 但 single-responsibility 模式 |

**推 Option B** — 沿袭 Phase 2.2 CD-5 单一兼容门 + Phase 3.1 W1 8th surface single-responsibility 模式。 cost ~30L NEW + 5L cross 是可接受 trade-off。

### 4.2 推荐 schema (~25L NEW)

```typescript
// src/workflow/schema/governance.ts NEW ~25L (sister src/checkpoint/schema/index.ts pattern)
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const GovernanceV1 = Type.Object({
  schemaVersion: Type.Literal(SCHEMA_VERSIONS.governance),  // 'harnessed.governance.v1'
  status: Type.Union([Type.Literal('active'), Type.Literal('vetoed')]),
  reason: Type.Optional(Type.String({ maxLength: 500 })),
  vetoed_at: Type.Optional(Type.String({ format: 'date-time' })),
  vetoed_by: Type.Optional(Type.String({ maxLength: 100 })),
})

export type GovernanceV1Type = Static<typeof GovernanceV1>
```

**Schema rationale**:
- `status` union 仅 2 state (active/vetoed) — 沿袭 Phase 3.1 D-02 KARPATHY 极简 3-state (active/paused/complete)，本 phase governance 仅 2 state 更简
- `reason / vetoed_at / vetoed_by` 全 optional — gstack 自由决定 metadata 量 (harnessed 不强制)
- `maxLength` 防 gstack 写超长 reason 撑爆 (sister Phase 3.1 checkpoint 1k token budget 思路)
- 不带 `vetoed_to_phase` field — D-04 lock "next-phase 转换前 read", veto 是 workflow-wide 全 halt 不分 phase

### 4.3 9th surface register (~5L cross 2 处)

```typescript
// src/types/schemaVersion.ts MODIFY (+2L 每处, total +4L)

// L36-45 SCHEMA_VERSIONS 加 1 entry:
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  // ... 7 existing ...
  currentWorkflow: 'harnessed.current-workflow.v1',
  governance: 'harnessed.governance.v1',  // ← Phase 3.2 W1 ADD 9th surface (D-04 PUSH veto state)
} as const

// L49-58 SchemaVersionLiteral Union 加 1 Type.Literal:
export const SchemaVersionLiteral = Type.Union([
  // ... 8 existing ...
  Type.Literal(SCHEMA_VERSIONS.governance),  // ← Phase 3.2 W1 ADD
])
```

### 4.4 branchOnSchemaVersion consumer pattern (sister state.ts L37-41)

```typescript
// src/workflow/governance.ts read pattern (sister state.ts L23-41)
export async function readGovernance(): Promise<GovernanceV1Type | null> {
  let raw: string
  try {
    raw = await readFile('.harnessed/governance.json', 'utf8')
  } catch {
    return null  // missing file = active (no veto, fail-soft)
  }
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return null }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(GovernanceV1, parsed) ? (parsed as GovernanceV1Type) : null),
    unknown: () => null,  // CD-5 rule (b) graceful degrade
  })
}

export async function isVetoed(): Promise<boolean> {
  const g = await readGovernance()
  return g?.status === 'vetoed'  // missing/corrupt/unknown all = false (active)
}
```

**关键设计**: `missing file = active` (sister `readCurrentWorkflow` null → no-op); workflow.run.ts 不需 governance 存在的前提条件 — 默认 active, gstack 主动 push veto file 才触发 halt。

[HIGH — sister `src/checkpoint/state.ts` L23-41 直证 + `src/types/schemaVersion.ts` L34-58 8th surface 直证 + Phase 3.1 RESEARCH § 4 8th surface 加 cost 同 sister 实证]

---

## § 5 plan-feature workflow.yaml DSL shape

**Confidence: HIGH** — `workflows/execute-task/phases.yaml` L1-28 直证 sister DSL; on_veto workflow-level 是新增 (本 phase 引入)。

### 5.1 推荐 DSL (~40L NEW)

```yaml
# workflows/plan-feature/workflow.yaml NEW ~40L (sister execute-task/phases.yaml 28L)
# Phase 3.2 W3 — 5-phase reference WIRED (D-03 lock; Phase 3.3+ dogfood 换真 spawn)
# R7.1 acceptance: 30 plan-feature 场景跑通 + CEO veto halt_workflow
workflow: plan-feature
on_veto: halt_workflow  # workflow-level (NOT phase-level) — D-04 PUSH 任 1 phase 转换前 read = vetoed → 全 halt
phases:
  - id: 01-gstack-decision
    name: gstack-decision (governance gate — CEO/EM/Designer/Paranoid/QA/CSO)
    upstream: gstack
    model: opus              # 高层决策 = opus
    invokes: '{{ gstack_prefix }}office-hours'  # ← D-02 JINJA 插值 (gstack-office-hours OR office-hours)
    skills: ['plan-feature-decision']
    max_iterations: 1
  - id: 02-brainstorm
    name: brainstorm (execution + ui-ux-pro-max UI 任务)
    upstream: superpowers
    model: sonnet            # 设计澄清 = sonnet
    skills: ['plan-feature-brainstorm']
    max_iterations: 5
  - id: 03-gsd-discuss
    name: gsd-discuss (orchestration — phase discussion)
    upstream: gsd
    model: sonnet
    invokes: 'gsd-discuss-phase'  # GSD 命令固定无 prefix
    skills: ['plan-feature-discuss']
    max_iterations: 3
  - id: 04-gsd-plan
    name: gsd-plan (orchestration — phase planning)
    upstream: gsd
    model: sonnet
    invokes: 'gsd-plan-phase'
    skills: ['plan-feature-plan']
    max_iterations: 3
  - id: 05-persist
    name: persist (planning-with-files MD persistence)
    upstream: planning-with-files
    model: haiku             # 文档写入 = haiku 省 token (sister Phase 2.2 CD-2 04-deliver=haiku)
    skills: ['plan-feature-persist']
    max_iterations: 5
```

### 5.2 DSL 设计决策 (4 sub-choice)

| Sub-choice | Options | Recommended | Rationale |
|------------|---------|-------------|-----------|
| **`on_veto` placement** | (a) workflow-level top-key (推荐); (b) per-phase field `on_veto: halt_workflow`; (c) global config `.harnessed/workflow.config.json` | **(a) workflow-level** | D-04 PUSH "任 1 phase 转换前 read 全 halt" 是 workflow-wide policy, 非 phase-specific; (b) 重复 5 次 (DRY 违); (c) over-engineered (本 phase 1 workflow type) |
| **`model_tier` per-phase** | (a) sister Phase 2.2 `[opus, sonnet, sonnet, haiku]`; (b) inherit one model; (c) Claude 自适 | **(a) per-phase explicit** | sister CD-2 4-phase pattern 直证 (model 字段 verified `execute-task/phases.yaml` L11/16/20/26); plan-feature 5-phase 模式 mirror — gstack-decision=opus 高层 + brainstorm/discuss/plan=sonnet + persist=haiku |
| **`invokes` field 存在性** | (a) 全 5 phase 都有 `invokes`; (b) 仅 1+2 phase 有 (其他用 skill stub mock 不 spawn); (c) optional 字段 only set for "真 spawn" phase | **(c) optional — only set for "潜在真 spawn" phase** | Phase 3.2 D-03 WIRED 是 stub (返 mock), `invokes` 仅 placeholder for Phase 3.3+ dogfood 真 spawn; **5 phase 全 invokes** 是 R7.4 JINJA 插值多 test surface, 但 phase 2 brainstorm/03 discuss 等可以无 invokes (skill stub 自包含); 推 phase 1+3+4 (gstack/gsd commands) 有 `invokes`, phase 2+5 无 (skill stub 自包含) — § 5.1 sample 反映此推荐 |
| **`skills` field semantic** | (a) skill name = SKILL.md file name (sister `'brainstorming'` → `skills/brainstorming/SKILL.md`); (b) skill 路由 routing engine arbitrate; (c) inline body | **(a) skill name → SKILL.md file** | sister `execute-task/phases.yaml` L13 `skills: ['brainstorming']` 沿袭; routing engine 不在本 phase scope (Phase 3.4 hit rate ≥ 85% acceptance) — 本 phase WIRED 是直接 dispatch skill stub 名 |

### 5.3 TypeBox schema for `workflow.yaml` (NEW ~30L extend `workflow/schema/phases.ts`)

**Sister `src/workflow/schema/phases.ts`** 当前是 execute-task DSL schema (`PhasesSchema`); 本 phase 加 plan-feature DSL schema 候选 2 路径:

| Path | LOC delta | Pros | Cons |
|------|-----------|------|------|
| **Path A: NEW `workflow/schema/planFeature.ts`** ⭐ | ~30L | Single-responsibility per workflow type; future workflow type 易加 | + 1 file (vs 1 union schema) |
| Path B: Union schema `WorkflowsSchema = Union(Phases, PlanFeature)` | ~5L | DRY (1 loader for all workflow types) | Tight coupling 2 unrelated DSL |

**推 Path A** — sister Phase 3.1 W1 schema directory `src/checkpoint/schema/{index,checkpoint,currentWorkflow}.ts` 模式 (single-responsibility per schema)。

### 5.4 Anti-patterns to avoid

| Anti-pattern | Why bad | Counter |
|-------------|---------|---------|
| `on_veto: halt_workflow` 重复每 phase | DRY 违 + 易漏 1 phase 形成 bug | workflow-level 顶 key |
| `invokes: 'gstack-office-hours'` 硬编码 prefix | 用户三种前缀场景任一都跑通 (R7.4) 失败 | JINJA `{{ gstack_prefix }}office-hours` 插值 |
| 5 phase 全 spawn (Phase 3.2 真接外部) | 违 D-03 WIRED lock; scope 太大 phase 装不下 | 5 skill stub mock 返 `{status:'ok'}`, Phase 3.3+ 换真 |
| skill name 用相对路径 `'./skills/...'` | sister `execute-task/phases.yaml` 用 short name; relative path 在 yaml 中 fragile | short name string, loader 自 resolve to `skills/<name>/SKILL.md` |

[HIGH — `workflows/execute-task/phases.yaml` L1-28 直证 sister DSL + 3.2-CONTEXT.md § Implementation hint L85-90 verbatim]

---

## § 6 5 skill stub pattern (D-03 WIRED)

**Confidence: HIGH** — `skills/karpathy-baseline/SKILL.md` 是 only existing SKILL.md, 本 phase 加 5 NEW 沿袭 frontmatter + body 模板。

### 6.1 推荐 SKILL.md stub format (~15L 每 stub, total 5×15=75L overhead)

```markdown
---
name: plan-feature-decision
description: Plan-feature workflow phase 01 stub — gstack governance gate (mock, Phase 3.3+ dogfood 换真 gstack spawn)
allowed-tools: ['Read', 'Edit', 'Bash']
---

# Plan-feature: Decision (governance gate) — STUB

Phase 3.2 D-03 WIRED reference implementation. Returns mock decision output for workflow runtime 验证.

## Stub behavior

This skill stub returns a mock result to simulate phase success transition:

\`\`\`json
{
  "status": "ok",
  "output": "<stub for plan-feature-decision>",
  "decision": "mock-approved"
}
\`\`\`

Phase 3.3+ dogfood: replace stub with actual `{{ gstack_prefix }}office-hours` spawn + decision capture.
```

**5 stub 重复同 pattern** — id 替换 + description 改 phase 名:

| # | skill name | phase id | description tail |
|---|-----------|----------|----------------|
| 1 | `plan-feature-decision` | 01-gstack-decision | governance gate (mock) |
| 2 | `plan-feature-brainstorm` | 02-brainstorm | execution + ui-ux-pro-max UI 任务 (mock) |
| 3 | `plan-feature-discuss` | 03-gsd-discuss | orchestration phase discussion (mock) |
| 4 | `plan-feature-plan` | 04-gsd-plan | orchestration phase planning (mock) |
| 5 | `plan-feature-persist` | 05-persist | planning-with-files MD persistence (mock) |

### 6.2 Mock output 推荐 — minimal (Karpathy YAGNI)

3.2-CONTEXT.md § specifics L223 推 `{status:'ok', output:'<stub for plan-feature-decision>', elapsed_ms:0, decision:'mock-approved'}`; **推荐去掉 `elapsed_ms:0`** (zero value 是无意义 noise) — minimum **3 field**:

```json
{
  "status": "ok",
  "output": "<stub for plan-feature-<phase-name>>",
  "decision": "mock-approved"
}
```

Phase 3.3+ dogfood 时换真 plan output (Phase 3.4 token budget monitor 时加 elapsed_ms + token_count 等 metadata)。

[HIGH — sister `skills/karpathy-baseline/SKILL.md` 模式 + 3.2-CONTEXT.md § specifics L223 推 minimal]

### 6.3 5 skill stub 在 workflow.run.ts 的 dispatch

```typescript
// src/workflow/run.ts 内 dispatch skill stub (D-03 WIRED 不接外部 spawn)
async function dispatchSkillStub(skillName: string, phaseId: string): Promise<{ status: 'ok' | 'fail'; output: string; decision?: string }> {
  // D-03 WIRED: 不实际 spawn skill — 返 mock 模拟成功转换
  // Phase 3.3+ dogfood: replace with: const result = await spawnSkill(skillName, { phaseId, ... })
  return {
    status: 'ok',
    output: `<stub for ${skillName}>`,
    decision: 'mock-approved',
  }
}
```

**关键** — `dispatchSkillStub` 不实际 read `SKILL.md` 文件 — 仅返 hardcoded mock (D-03 WIRED 是 runtime 行为验证, SKILL.md 仅 documentation + Phase 3.3 替换 anchor)。

---

## § 7 governance veto lazy read 模式

**Confidence: MEDIUM** — 5 phase × 1 fs.readFile 估算约 5ms (未 spike, projection based on Node 22 SSD write/read benchmark ~1ms/op); 但远低于 SDK spawn cost (~500ms/phase) → lazy read overhead 可忽略。

### 7.1 推荐: workflow.run.ts next-phase 转换前 1 行 lazy read ⭐

```typescript
// src/workflow/run.ts (~80L NEW per D-03 spec)
import { isVetoed } from './governance.js'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import { pause as statePause } from '../checkpoint/state.js'

export async function runWorkflow(workflowPath: string, vars: Record<string, string>): Promise<{ status: 'complete' | 'vetoed' | 'failed'; lastPhase?: string }> {
  const workflow = await loadWorkflow(workflowPath, vars)  // calls interpolate + schema validate
  for (const phase of workflow.phases) {
    // Phase 3.2 D-04 PUSH — lazy read governance.json 每 phase 转换前 (sister Phase 3.1 D-02 readCurrentWorkflow 模式)
    if (await isVetoed()) {
      await statePause()  // current-workflow.json status='paused' (Phase 3.1 D-02 reuse)
      return { status: 'vetoed', lastPhase: phase.id }
    }
    await activatePhase(phase.id)  // Phase 3.1 engineHook 1st consumer (本 phase = 2nd consumer)
    const result = await dispatchSkillStub(phase.skills[0], phase.id)
    if (result.status !== 'ok') return { status: 'failed', lastPhase: phase.id }
    await completePhase({ phaseId: phase.id, status: 'complete' })
  }
  return { status: 'complete' }
}
```

### 7.2 Overhead estimate (verified projection)

| Component | Cost | Frequency | Total per workflow run |
|-----------|------|-----------|---------------------|
| `fs.readFile('.harnessed/governance.json')` | ~1ms (Node 22 + SSD; file ENOENT also ~1ms) | 5 phase × 1 = 5 | ~5ms |
| `JSON.parse` (small file <500 byte) | <0.1ms | 5 | <0.5ms |
| `Value.Check(GovernanceV1, ...)` TypeBox | ~0.1-1ms (small schema) | ≤5 (skip if missing) | ≤5ms |
| **Total governance overhead per workflow run** | | | **~10ms** |
| SDK spawn per phase (Phase 3.3+ dogfood) | ~500ms-2000ms | 5 | ~2500-10000ms |
| **Governance overhead / total workflow** | | | **0.1-0.4% (negligible)** |

**Sister Phase 2.4 SSE polling rejected** (D-04 评估 reject reason): timer-based poll N ms 即使 N=1000ms 也是 background work 不及 lazy read on transition; 本 phase lazy read 仅在 phase boundary 触发 5 次/workflow → zero idle overhead。

[MEDIUM — projection based on Node 22 fs.readFile benchmark + TypeBox Value.Check microbench; 未在本 repo spike, 但 sister Phase 3.1 `readCurrentWorkflow` 同 pattern verified work in W3 e2e (DOGFOOD-T5.5.md)]

### 7.3 Sister Phase 2.4 D-04 SSE pattern 不复用 — why

| Pattern | Phase 2.4 SSE use | Phase 3.2 governance use? |
|---------|------------------|--------------------------|
| EventSource client + dashboard.mjs SSE channel | dashboard real-time push of STATE.md change | ❌ overkill — governance 仅 5 read/workflow, no real-time UI |
| `chokidar` file watcher | scripts/dashboard.mjs L456-531 (Phase 3.1 sister) | ❌ overkill — workflow.run.ts 已是 active polling agent at phase boundary |
| File-based lazy read (sister state.ts) | NA | ✅ 推荐 — minimal, sister Phase 3.1 D-02 模式 |

**Phase 3.3+ governance.json watcher integration** (dashboard SSE push) → 推 SKIP 本 phase (Claude's Discretion lock); Phase 3.3+ 若 dashboard 需 real-time veto status 可加 chokidar 第二轮 watch (sister Phase 3.1 RESEARCH § 0.4 SSE 复用)。

---

## § 8 W0.1 cli-audit env-dep root cause deep-dive (FIRST TASK 必修)

**Confidence: HIGH** — 本 session local 实测 `corepack pnpm test -- --run tests/unit/cli-audit.test.ts` 2 fail (L87 + L96) + source code direct evidence 锁 root cause + fix recipe locked。

### 8.1 实测 evidence (本 session 复现)

**Command + tail output**:
```
$ corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -50
...
 FAIL  tests/unit/cli-audit.test.ts > cli/audit > empty manifest dirs → exit 0
AssertionError: expected 1 to be +0 // Object.is equality
 ❯ tests/unit/cli-audit.test.ts:87:18
     85|     readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), {…
     86|     const code = await runCli(['audit'])
     87|     expect(code).toBe(0)
       |                  ^

 FAIL  tests/unit/cli-audit.test.ts > cli/audit > manifest with valid git_ref → exit 0
AssertionError: expected 1 to be +0
 ❯ tests/unit/cli-audit.test.ts:96:18
     94|     validateMock.mockReturnValue(validManifest())
     95|     const code = await runCli(['audit'])
     96|     expect(code).toBe(0)

 Test Files  1 failed | 76 passed | 1 skipped (78)
      Tests  2 failed | 593 passed | 4 skipped (599)
```

[VERIFIED LOCAL 2026-05-16 — 本 session 实跑]

### 8.2 Root cause (源代码 direct evidence)

**Evidence chain**:

1. `tests/unit/cli-audit.test.ts` L13-14 仅 mock 2 module:
   ```typescript
   vi.mock('node:fs/promises', () => ({ readdir: vi.fn(), readFile: vi.fn() }))
   vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))
   ```
   **未 mock**: `node:child_process` (audit-helpers 用), `../../src/cli/lib/audit-helpers.js` (audit.ts L17-19 eager import), `node:fs` (origin-check.ts L5 `readFileSync` 用)。

2. `src/cli/audit.ts` L17-19 **eager top-level import**:
   ```typescript
   import {
     auditInstallCmdIntegrity,
     auditOriginIntegrity,
     auditProvenance,
   } from './lib/audit-helpers.js'
   ```
   eager import → 测试 import audit 时 audit-helpers 也加载 → audit-helpers eager import `spawnSync` from `child_process` (audit-helpers.ts L7) → mock 不命中。

3. `src/cli/audit.ts` L96-132 `registerAudit` action handler:
   ```typescript
   .action(async (opts: { skipRuntime?: boolean }) => {
     ...
     if (!opts.skipRuntime) {  // ← test 调用 `audit` 不传 --skip-runtime, opts.skipRuntime=undefined → 条件 true → runtime helpers 跑
       findings.push(...auditOriginIntegrity(root))       // ← real spawnSync('git', ...) 跑 — fail in test mock env
       for (const { m } of validManifests) findings.push(...auditInstallCmdIntegrity(m))
       findings.push(...auditProvenance())                 // ← real spawnSync('node', ['scripts/check-provenance.mjs']) 跑 — fail in test mock env
     }
   ```
   `auditOriginIntegrity` 内 `checkOrigin(cwd, { allowFork: false })` → `spawnSync('git', ['config', '--get', 'remote.origin.url'])` (origin-check.ts L57-60) — 在 vitest env 跑 git 可能 fail (cwd 是 test runner 不一定 git repo); **+** `auditProvenance` → `spawnSync('node', ['scripts/check-provenance.mjs'])` (audit-helpers.ts L69) — `scripts/check-provenance.mjs` 可能 exit 非 0 → finding push 'error' → errorCount++ → process.exit(1)。

4. **Why Phase 2.4 ship 时 green**: Phase 2.4 W4 sister test `tests/cli/audit.test.ts` 5 cell 跑 runtime layer 时 mock 全套 (origin + provenance + spawnSync), 而 `tests/unit/cli-audit.test.ts` 是 Phase 1.2 旧 mock 仅 manifest layer — Phase 2.4 W4 加 runtime helper 时**未同步**更新 cli-audit.test.ts mock。 Local b6a0feb baseline 也 fail (CONTEXT § W0.1 Root cause 明示); CI 当时 green = env-dependent (CI runner env 可能 git 命令 OK + check-provenance.mjs OK → exit 0 → 假 pass)。 Phase 3.1 W3 engine.ts MODIFY 间接改变 import chain (audit-helpers imports 链稳定但 vitest import graph 变化) → CI 也 fail。

### 8.3 Fix path locked — 2 candidate

| Path | Delta | Pros | Cons | Recommended |
|------|-------|------|------|---|
| **A: Test-only fix — 加 vi.mock for child_process + audit-helpers** | ~10-15L add to `tests/unit/cli-audit.test.ts` (mock 2 module + add returns) | Surgical (src/ 不动) + sister Phase 2.4 `tests/cli/audit.test.ts` 模式; fast (≤30 tool use) | Test 仍 cover manifest layer only (runtime layer cover 仍由 `tests/cli/audit.test.ts` 5 cell) — 完全 OK | ⭐ |
| B: Source change — audit.ts 加 dynamic import for runtime helpers (lazy load when `!opts.skipRuntime`) | ~5L src/cli/audit.ts (3 import → 1 await import inside if) | Test 不需 mock (default deps absent); test pass natural | src/ change 风险高 (W0.1 是 test fix scope, src 改动需 plan + verify) | ❌ over-scope |
| C: 删 cli-audit.test.ts (5 cell 已被 tests/cli/audit.test.ts cover) + 改 1 fixture | ~-114L delete + ~3L add to tests/cli/audit.test.ts | DRY (2 test file 测同样东西) | 删 file 是 destructive; manifest layer 5 cell 不一定 100% 重复 cover | ⚠️ 二选 |

**推 Path A** — sister Phase 2.4 W4 `tests/cli/audit.test.ts` 已 cover runtime layer; `tests/unit/cli-audit.test.ts` 5 cell 是 manifest layer mock 不变 — 仅加 child_process + audit-helpers mock 让 runtime layer 不真跑。

### 8.4 Fix recipe (≤30L delta locked, ≤30 tool use)

```typescript
// tests/unit/cli-audit.test.ts MODIFY ~+15L
// 现 L13-14 (2 vi.mock) → ADD 2 more vi.mock + reset:

vi.mock('node:fs/promises', () => ({ readdir: vi.fn(), readFile: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))
// NEW — Phase 3.2 W0.1 fix: mock runtime layer helpers so manifest-only tests
// don't accidentally trigger real git/provenance subprocesses (Phase 2.4 W4
// added these as eager imports in src/cli/audit.ts L17-19).
vi.mock('../../src/cli/lib/audit-helpers.js', () => ({
  auditOriginIntegrity: vi.fn(() => []),       // no findings = no exit-1 trigger
  auditInstallCmdIntegrity: vi.fn(() => []),
  auditProvenance: vi.fn(() => []),
}))

// In imports block (L16-19) — add the mocked symbols if needed for additional cells:
// (For W0.1 minimal fix, no new test cells needed — just mock + existing assertions OK.)

// In beforeEach (L71-75) — reset new mocks:
beforeEach(() => {
  readdirMock.mockReset()
  readFileMock.mockReset()
  validateMock.mockReset()
  // Phase 3.2 W0.1 — sister runtime layer mocks already return [] by default, reset not strictly required
})
```

**Net delta**: +10-15L (1 vi.mock block + 0-3L beforeEach reset if needed)。

### 8.5 Acceptance bar locked (W0.1 first-task)

| Acceptance bar | Verify command | Expected |
|---------------|----------------|---------|
| **Local pass** | `corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 \| tail -10` | `Test Files 1 passed (1)` / `Tests 4 passed (4)` (or 5 passed if test #5 not destabilized) |
| **No regression** | `corepack pnpm test 2>&1 \| tail -10` | tests count 596 → 596 (same) + 0 fail (CI 3-OS green) |
| **CI 3-OS green** | (push to branch + verify GH Actions) | All 3 OS jobs green; cli-audit.test.ts 2 fail → 0 fail |
| **Wave 0 absorb** | (single commit message) | `fix(phase-3.2-w0.1): cli-audit env-dep mock runtime helpers (Phase 2.4 W4 eager import sync miss)` |

[HIGH — 本 session local 实测 root cause direct + fix recipe locked + sister Phase 2.4 W4 mock pattern reference]

### 8.6 Why not Path B (src change)?

- Phase 3.1 ship sister M+L+T pattern: defer src changes when test-only fix exists
- src/cli/audit.ts 167L < 200L hard limit safe — 加 dynamic import 反而 + 2-3L 接近 limit, 无必要
- Test-only fix 不破 W0.1 sister Phase 2.4 W4 `tests/cli/audit.test.ts` 5 cell runtime layer cover (sister test 不变, scope orthogonal)

---

## § 9 W0.2 STATE.md / README.md format normalize SSOT decision

**Confidence: HIGH** — README grep 11 line-start matches vs STATE.md grep 1 line-start matches (本 session local 实测 cross-check + ci.yml L191-211 直证 ENFORCE flip 路径)。

### 9.1 决策: README format `- **Phase X.Y shipped** ✅` 作 SSOT, STATE.md 改 (Option A) ⭐

| Option | LOC delta | Pros | Cons | Recommended |
|--------|-----------|------|------|---|
| **A: README format SSOT** — STATE.md per-phase entries 加 line-start `- **Phase X.Y SHIPPED**` marker | STATE.md ~+10 lines (add 11 line-start markers for 11 shipped phases) | README 是用户面 visibility (sister Phase 2.4 D-03 counter gate B 路径 keep visible philosophy); grep-friendly; minimum drift to user-facing doc | STATE.md 多 10 lines | ⭐ |
| B: STATE.md format SSOT — README 改 line-mid prose | README ~-50 lines (rewrite each `- **Phase X.Y shipped** ✅` → prose narrative) | STATE.md prose 不动 (历史包袱保留) | README user-facing — 改成 prose 损 visibility + 灾难性 commit | ❌ |
| C: 双格式 tolerant gate — 加 OR regex 兼容 | ci.yml regex extend | 0 doc change | 不 normalize 永久 — Phase X.Y 加 ship 时仍要手动 sync 双格式; 违 W0.2 spec | ❌ |

**推 Option A** — STATE.md 是 internal SSOT (project memory) 改起来无用户感知; README user-facing 不动。

### 9.2 实测 grep evidence (本 session)

```
$ grep -cE "^[-*]?\s*\*?\*?Phase\s+[0-9]+\.[0-9]+\*?\*?.*[Ss][Hh][Ii][Pp][Pp][Ee][Dd]" README.md
11

$ grep -cE "^[-*]?\s*\*?\*?Phase\s+[0-9]+\.[0-9]+\*?\*?.*[Ss][Hh][Ii][Pp][Pp][Ee][Dd]" .planning/STATE.md
1
```

**README 11 line-start matches** (verified line numbers via prior grep):
- L46 Phase 3.1 shipped
- L47 Phase 2.4 shipped
- L48 Phase 2.3 shipped
- L49 Phase 2.2 shipped
- L50 Phase 2.1 shipped
- L51 Phase 1.5 shipped
- L52 Phase 1.4 shipped
- L53 Phase 1.3 shipped
- L54 Phase 1.2.5 architecture revision shipped
- L55 Phase 1.2 shipped
- L56 Phase 1.1 + 1.1.1 hotfix shipped

**STATE.md 1 line-start match** (verified L36 表格 row); 其他 ship 记录全在 prose narrative (L4 等)。

### 9.3 STATE.md fix recipe (W0.2 delta)

**Target — STATE.md 加 11 line-start markers** (sister `各里程碑进度` 表格 L34-37 之后加新节):

```markdown
## 已完成 phase ship 历史 (W0.2 — README sync SSOT)

> 与 README.md L46-56 一一对应; grep gate `^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped` 计 count 与 README 等

- **Phase 3.1 SHIPPED** ✅ (2026-05-16) — checkpoint 引擎 + harnessed resume 12th CLI + compact 75% placeholder
- **Phase 2.4 SHIPPED** ✅ (2026-05-16) — doctor 完整版 + EE-4 4 维 SSOT + dashboard C 路径
- **Phase 2.3 SHIPPED** ✅ (2026-05-16) — extension MVP + karpathy SKILL-ONLY + 30/30 routing 100%
- **Phase 2.2 SHIPPED** ✅ (2026-05-15) — execute-task workflow + SDK 0.3.142 + per-phase model tier
- **Phase 2.1 SHIPPED** ✅ (2026-05-15) — 6 install method runtime-ready + transparency CI gate
- **Phase 1.5 SHIPPED** ✅ (2026-05-14) — DAG resolver + Semantic Router L2 stub + 23 招式 routing
- **Phase 1.4 SHIPPED** ✅ (2026-05-13) — routing engine v1 + AgentDefinition factory
- **Phase 1.3 SHIPPED** ✅ (2026-05-13) — categorization schema + decision_rules.yaml v1
- **Phase 1.2.5 architecture revision SHIPPED** ✅ (2026-05-12) — ADR 0006 wedge 升级
- **Phase 1.2 SHIPPED** ✅ (2026-05-12) — cli-npm + mcp-stdio runtime + 5 CLI subcommands
- **Phase 1.1 + 1.1.1 hotfix SHIPPED** ✅ (2026-05-12) — schema v1 frozen + 10 manifest + 3 ADR
```

**Net delta**: STATE.md +13 lines (1 section header + 1 blockquote + 11 entries)。 grep count post-fix: STATE.md 1→12 ≥ README 11 ✅。

### 9.4 CI ENFORCE flip recipe (W0.2 second delta)

**ci.yml L201 delete 1 line**:

```yaml
# 现 L200-211:
- name: README completeness check (Phase 3.1 W0.3 — STATE.md vs README per-phase shipped count) [WARN-ONLY round 1]
  continue-on-error: true  # ← DELETE this line (W0.2 ENFORCE flip)
  run: |
    STATE_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
    README_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md)
    echo "STATE.md per-phase shipped count: $STATE_COUNT"
    echo "README.md per-phase shipped count: $README_COUNT"
    if [ "$STATE_COUNT" -ne "$README_COUNT" ]; then
      echo "::error::README completeness drift: STATE=$STATE_COUNT README=$README_COUNT"  # ← CHANGE ::warning → ::error
      exit 1                                                                                # ← ADD exit 1
    else
      echo "README completeness OK: STATE=$STATE_COUNT README=$README_COUNT"
    fi
```

**Net delta**: ci.yml -1 line (delete `continue-on-error: true`) + change ::warning → ::error + add `exit 1` (3-line semantic change)。

### 9.5 Acceptance bar (W0.2)

| Acceptance bar | Verify command | Expected |
|---------------|----------------|---------|
| **STATE/README count equal** | `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md` 与 README.md 同 count | Both ≥11 (Phase 3.1 + 10 历史) — 12 if STATE.md 加 Phase 3.2 entry (after ship) |
| **CI ENFORCE green** | (push branch + verify) | `README completeness OK: STATE=N README=N` (not `::warning::`) |
| **No regression** | full test suite | `corepack pnpm test` 596+ pass / 0 fail |

[HIGH — README grep 11 match + STATE grep 1 match 本 session 实测 + ci.yml L191-211 直证 ENFORCE flip path]

---

## § 10 D-01 PROBE schema 与 D-04 governance.v1 共享 .harnessed/ 文件决策

**Confidence: HIGH** — Karpathy single-responsibility + sister Phase 3.1 5 .harnessed/ path 模式 (each path single-purpose)。

### 10.1 决策: 双独立文件 `.harnessed/config.json` (D-01) + `.harnessed/governance.json` (D-04) ⭐ (Option B)

| Option | Files | Pros | Cons | Recommended |
|--------|-------|------|------|---|
| **A: 单 `.harnessed/config.json` 双 surface** (gstack_prefix + governance status 共存 1 文件) | 1 file | Minimize file count; 1 readFile fetch 多 surface | Tight coupling (gstack 写 governance 时需 read + merge + write — 竞态风险); single-responsibility 违 | ❌ |
| **B: 双独立 `.harnessed/config.json` + `.harnessed/governance.json`** ⭐ | 2 file | Zero coupling — gstack 写 governance.json 不动 harnessed config.json; sister Phase 3.1 `.harnessed/checkpoints/*.json` + `.harnessed/archive/` + `.harnessed/current-workflow.json` 多 file pattern | + 1 file; sister Phase 3.1 5 path 模式延续 | ⭐ |

**推 Option B** — sister Phase 3.1 `.harnessed/` 已是 5 path 模式 (`backup/` + `checkpoints/` + `archive/` + `current-workflow.json` + `state/`); 本 phase 加 2 file 自然延续。 gstack 写 governance.json 是外部 process → race condition 风险只在 governance.json (隔离); harnessed config.json 仅 doctor 一次写 + workflow.run.ts 多次读, no race。

### 10.2 .harnessed/ 现状 + Phase 3.2 加入对照

| Path | Owner (writer) | Reader | Phase 引入 |
|------|---------------|--------|----------|
| `.harnessed/backup/` | harnessed (install/rollback) | harnessed | Phase 1.2 |
| `.harnessed/state/manifest.json` | harnessed (install) | harnessed (status) | Phase 1.2 |
| `.harnessed/state/installer.json` | harnessed (install) | harnessed (status) | Phase 1.2 |
| `.harnessed/checkpoints/*.json` | harnessed (checkpoint/template) | harnessed (resume) | Phase 3.1 |
| `.harnessed/archive/` | harnessed (checkpoint/archive) | harnessed (audit) | Phase 3.1 |
| `.harnessed/current-workflow.json` | harnessed (checkpoint/state) | harnessed (resume + workflow.run) | Phase 3.1 |
| **`.harnessed/config.json`** ⬅ NEW | **harnessed (doctor `checkGstackPrefix`)** | harnessed (workflow.run.ts JINJA vars source) | **Phase 3.2 W1** |
| **`.harnessed/governance.json`** ⬅ NEW | **gstack (external, 不在 harnessed scope)** | harnessed (workflow/governance.ts) | **Phase 3.2 W2** |

**Key insight** — config.json 是 harnessed-内 read/write (doctor write + workflow.run.ts read); governance.json 是 gstack-写 / harnessed-读 (cross-process)。 隔离避免 doctor `writeConfig({gstack_prefix})` 误覆盖 gstack `writeGovernance({status})` 写。

### 10.3 .harnessed/config.json schema (~15L NEW, 沿袭 sister current-workflow.v1 pattern)

```typescript
// src/workflow/schema/config.ts NEW ~15L (sister checkpoint/schema/currentWorkflow.ts)
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const ConfigV1 = Type.Object({
  schemaVersion: Type.Literal(SCHEMA_VERSIONS.config),  // 'harnessed.config.v1'
  gstack_prefix: Type.Union([Type.Literal('gstack-'), Type.Literal('')]),
})

export type ConfigV1Type = Static<typeof ConfigV1>
```

**Add 10th surface in `src/types/schemaVersion.ts`** — `harnessed.config.v1` + governance.v1 共 9th + 10th surface (sister Phase 3.1 7→8 surface 模式 双加):

```typescript
// SCHEMA_VERSIONS L36-45 加 2 entries
export const SCHEMA_VERSIONS = {
  // ... 8 existing ...
  config: 'harnessed.config.v1',          // ← Phase 3.2 W1 ADD 9th surface (D-01 PROBE gstack_prefix)
  governance: 'harnessed.governance.v1',  // ← Phase 3.2 W1 ADD 10th surface (D-04 PUSH veto status)
} as const
```

**Net delta**: 8 → 10 surface (双 +1, 沿袭 Phase 3.1 7→8 sister precedent)。 SchemaVersionLiteral Union 也加 2 Type.Literal (+2L)。

[HIGH — sister Phase 3.1 W1 8th surface 加 cost 直证 + .harnessed/ 5 path single-responsibility 模式]

---

## § 11 Validation Architecture (Nyquist gate prep)

> Phase config `workflow.nyquist_validation` 假设 enabled (absence = enabled per spec)。

### 11.1 8 dimension test count recommendation

| Dimension | Phase 3.2 surface | Test count target | Anchor |
|-----------|-------------------|------------------|--------|
| **Functional** | PROBE 3 状态 + JINJA 6 cell + workflow run 5 phase + governance read | ≥ **15 fixture** (PROBE 3 + JINJA 6 + workflow runner 3 + governance 3) | `tests/cli/probe-gstack.test.ts` (3) + `tests/workflow/interpolate.test.ts` (6) + `tests/workflow/run.test.ts` (3) + `tests/workflow/governance.test.ts` (3) |
| **Contractual** | governance.v1 + config.v1 schema lock + plan-feature workflow.yaml DSL schema | ≥ **8 fixture** (TypeBox Value.Check happy + drift + missing field + extra field + 2 v1 surface; loadWorkflow plan-feature.yaml validate) | `tests/workflow/schema/governance.test.ts` (4) + `tests/workflow/schema/config.test.ts` (4) |
| **Integration** | workflow.run.ts consume Phase 3.1 engineHook activatePhase/completePhase + governance veto trigger statePause | ≥ **5 fixture** (5 phase happy path + veto at each of 5 phase boundary = 5; alternative: 3 fixture happy + 2 veto = 5) | `tests/integration/plan-feature-wired.test.ts` (5) — 3.2-CONTEXT.md § Implementation hint L91 已 spec |
| **Observability** | doctor `--json` flag prefix 输出 + workflow.run.ts stderr trace per phase + governance read log | ≥ **3 fixture** (`doctor --json` JSON.parse round-trip + workflow run stderr log structure + governance veto log message) | `tests/cli/doctor-json.test.ts` (1) + `tests/workflow/run-trace.test.ts` (2) |
| **Failure-mode** | PROBE 0/2 响应 fallback + JINJA missing var throw + workflow veto halt + governance.json corrupt + workflow.yaml DSL invalid | ≥ **6 fixture** (PROBE both + neither = 2; JINJA undefined var throw + nested unsupported throw = 2; veto halt + governance corrupt graceful = 2) | distributed across 4 test file |
| **Performance** | workflow 5 phase < 100ms minimum (stub mode, no real spawn) | ≥ **1 micro-bench** | `tests/workflow/run-perf.bench.ts` (1 fixture, vitest bench) |
| **Migration** | Phase 3.1 → 3.2 carry: TaskContext.phaseId field 复用 + Phase 3.1 engineHook 二代 consumer | ≥ **2 fixture** (engineHook `activatePhase / completePhase` 二代 consumer happy path + paused state from veto reuses statePause) | `tests/integration/checkpoint-reuse.test.ts` (2) |
| **Security** | governance.json 仅 gstack 写 + harnessed reader only + threat: malicious governance.json forced veto + .harnessed/config.json schema strict | ≥ **3 fixture** (gstack writes valid governance.json → harnessed reads OK; malicious schemaVersion drift → graceful null; malicious huge reason field → maxLength caps); + threat model doc node | `tests/workflow/governance-security.test.ts` (3) |

**Total fixture target**: ≥ **15 (functional) + 8 (contract) + 5 (integration) + 3 (observ) + 6 (failure) + 1 (perf) + 2 (migration) + 3 (security)** = **≥ 43 NEW test fixture**

Sister Phase 3.1 W3 sdk-wire.test.ts 7 fixture + W4 sigint/compact/resume 18 fixture + W5 e2e 3 fixture = ~28 NEW fixture total Phase 3.1. Phase 3.2 ~43 NEW fixture is **+50% more** — 因 Phase 3.2 scope 跨 3 surface (doctor + workflow + governance) vs Phase 3.1 主要 checkpoint surface.

### 11.2 Sampling rate

- **Per task commit**: `corepack pnpm test -- --run tests/<area>/<file>.test.ts` (≤ 5s typical)
- **Per wave merge**: `corepack pnpm test` (full suite, ~30s based on Phase 3.1 596 test baseline)
- **Phase gate**: full suite green + `corepack pnpm test -- --run tests/integration/plan-feature-wired.test.ts` 5 fixture all green before `/gsd-verify-work`

### 11.3 Wave 0 gaps

- [ ] `tests/cli/probe-gstack.test.ts` — covers PROBE 3 state (R7.4)
- [ ] `tests/workflow/interpolate.test.ts` — covers JINJA 6 cell (R7.4)
- [ ] `tests/workflow/governance.test.ts` — covers governance read (R7.1 D-04)
- [ ] `tests/workflow/run.test.ts` — covers workflow runner 3 fixture (R7.1)
- [ ] `tests/workflow/schema/governance.test.ts` — schema lock 4 fixture
- [ ] `tests/workflow/schema/config.test.ts` — schema lock 4 fixture
- [ ] `tests/integration/plan-feature-wired.test.ts` — 5 fixture e2e (R7.1)
- [ ] `tests/workflow/run-perf.bench.ts` — perf bench (R7.1 < 100ms minimum)
- [ ] `tests/workflow/governance-security.test.ts` — security 3 fixture

(Framework install: vitest 既存; no new dep needed)

### 11.4 Threat model nodes (security dimension brief)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Malicious user writes `.harnessed/governance.json` `{schemaVersion:'malicious.surface.v1',status:'vetoed'}` | Tampering | `branchOnSchemaVersion` `unknown` branch → null → isVetoed false (graceful, no false halt) |
| Malicious huge `reason` field DOS | DOS | TypeBox `maxLength: 500` cap (§ 4.2) |
| Path traversal `.harnessed/../../etc/passwd` | Tampering | Fixed path `.harnessed/governance.json` literal in code (no user-controlled path) |
| Workflow.yaml `invokes` JINJA injection: `{{ var }}; rm -rf /` | Injection | `vars` 来自 `.harnessed/config.json` (harnessed-内 write, schema-validated `'gstack-' | ''` Union — 不接 user-arbitrary string); 替换后字符串作 spawn cmd 字面参数, 不进 shell (D-03 WIRED stub 不 spawn 真子进程) |
| `.harnessed/config.json` 用户手动 tamper `gstack_prefix: '$(rm -rf /)' `| Injection | TypeBox schema `Type.Union([Type.Literal('gstack-'), Type.Literal('')])` 仅 2 合法值; tamper → Value.Check fail → readConfig null → fail-loud |

[MEDIUM-HIGH — sister Phase 3.1 V security dimension cross-reference + TypeBox schema-validated input boundary]

---

## § 12 Wave topology recommendation

**Confidence: HIGH** — sister Phase 3.1 6 wave (W0-W5) 模式直证, 本 phase scope 类似 (W0 backlog absorb + 3 surface impl + e2e + ship)。

### 12.1 推荐: 4 wave (W0-W3) topology

| Wave | Scope | Tasks | LOC delta est | Tests delta |
|------|-------|-------|--------------|-------------|
| **W0** backlog 3 项 absorb (必修) | W0.1 cli-audit fix + W0.2 STATE/README format normalize + ci.yml ENFORCE flip + W0.3 schemaVersion 9th+10th 决议 record | 4 atomic | +15L tests + +13L STATE.md + -1L ci.yml + decision doc | +0 fixture (W0.1 fixes existing 2 fail; 596→596+2=596 still pass) |
| **W1** doctor + interpolate + governance impl | T1.1 schemaVersion 9th+10th surface add + T1.2 config.v1 + governance.v1 schemas NEW + T1.3 probe-gstack.ts helper + T1.4 doctor.ts 6th check dispatch + T1.5 interpolate.ts + T1.6 governance.ts | 6 atomic | +50L src (probe-gstack + interpolate + governance) + ~40L schema + 5L doctor MODIFY + 4L schemaVersion MODIFY | +20 fixture (PROBE 3 + JINJA 6 + governance 3 + schema 8) |
| **W2** workflow.run + plan-feature workflow.yaml + 5 skill stub | T2.1 workflow.run.ts NEW + T2.2 plan-feature/workflow.yaml NEW + T2.3 5 skill stub MD NEW + T2.4 workflow/schema/planFeature.ts NEW + T2.5 loadPhases.ts extend interpolate step | 5 atomic | +80L workflow.run.ts + +40L yaml + +75L 5 skill stub MD + +30L planFeature schema + +5L loadPhases MODIFY | +13 fixture (run 3 + integration 5 + plan-feature schema 2 + observability 2 + perf 1) |
| **W3** e2e dogfood + ADR + STATE/RETRO/ROADMAP + ship | T3.1 e2e 3 fixture (gstack-/`''`/both) + T3.2 ADR 0015 9 章节 + T3.3 STATE.md continued + T3.4 RETROSPECTIVE.md + T3.5 ROADMAP Phase 3.2 mark shipped + T3.6 ci.yml A7 iter + T3.7 baseline tag + T3.8 milestone tag (alpha.2-plan-feature?) | 8 atomic | +200L ADR + 5L ci.yml A7 + 10L docs + tags | +5 fixture (e2e 3 + migration 2) |

**Total wave breakdown**:
- 4 wave (Phase 3.1 是 6 wave — 本 phase 是更小 scope 因 plan-feature WIRED 非 FULL)
- 23 atomic task (Phase 3.1 是 27-28 task — 接近)
- ~280L src delta (excl. tests + schemas + yaml + MD stubs)
- ~38-43 NEW fixture
- 1 ADR 0015 (9 章节 errata per Phase 3.1 sister 模式)

### 12.2 Wave 依赖 graph

```
W0 (必修 first task) ─┬─> W1 (doctor + interp + gov 实装)
                      │
                      └─> W2 (workflow runner + yaml + 5 stub)
                              │
                              └─> W3 (e2e + ADR + ship)
```

W0 内 4 task 独立 (test fix + doc fix + ci fix + schema decision record); W1 内 6 task partial DAG (T1.1 schema 先 → T1.2 schemas → T1.3+T1.5+T1.6 helpers 并行 → T1.4 doctor dispatch 后); W2 全串行 (workflow.run depends on interpolate/governance from W1); W3 全串行 (e2e first, ADR + docs 后, tags last)。

### 12.3 Karpathy hard limit verification

每 wave 完后 verify per-file ≤ 200L hard limit:

| File | Pre | Post W1+W2 | Within limit? |
|------|-----|-----------|--------------|
| `src/cli/doctor.ts` | 175L | ~180L (+5L dispatch) | ✅ ≤200 |
| `src/cli/lib/probe-gstack.ts` NEW | 0 | ~40L | ✅ ≤200 |
| `src/workflow/interpolate.ts` NEW | 0 | ~25L | ✅ ≤30L (D-02 spec) |
| `src/workflow/governance.ts` NEW | 0 | ~25L | ✅ ≤25L (D-04 spec) |
| `src/workflow/run.ts` NEW | 0 | ~80L | ✅ ≤80L (D-03 spec) |
| `src/workflow/schema/config.ts` NEW | 0 | ~15L | ✅ ≤200 |
| `src/workflow/schema/governance.ts` NEW | 0 | ~25L | ✅ ≤200 |
| `src/workflow/schema/planFeature.ts` NEW | 0 | ~30L | ✅ ≤200 |
| `src/workflow/loadPhases.ts` MODIFY | 30L | ~35L (+5L extend) | ✅ ≤200 |
| `src/types/schemaVersion.ts` MODIFY | 72L | ~76L (+2L SCHEMA_VERSIONS + +2L Union) | ✅ ≤200 |

[HIGH — Karpathy hard limit per file verified at design time]

---

## § 13 Karpathy anti-pattern checks (optional)

**Confidence: MEDIUM** — 5 anti-pattern risks identified by reasoning about scope; not spike-verified.

### 13.1 5 anti-pattern at risk + counter-discipline

| # | Anti-pattern temptation | Why risky | Counter-discipline |
|---|------------------------|-----------|-------------------|
| 1 | **workflow.run.ts 超 80L hard limit** — D-03 spec ≤80L 但 5 phase dispatch + governance check + checkpoint integration 易超 | sister Phase 3.1 engine.ts 195L 已 hard limit fight; W-01 PRIMARY extract 模式应用 | 抽 helper: `dispatchSkillStub` → `workflow/dispatchSkill.ts` ~20L (sister Phase 3.1 W-01 engineHook PRIMARY extract); `runPhase(phase, vars)` 内联 1 phase loop body; runWorkflow 只剩 top-level loop ≤ 60L |
| 2 | **doctor.ts 加 6th check sneak in Win where.exe special case** — sister doctor.ts L80-83 already pattern-locked `process.platform === 'win32' ? 'where' : 'which'` | 新增 OS-specific branch 累计 doctor.ts → 215L+; sister Phase 2.4 B-03 5% tolerance 已用尽 | 严格沿袭 sister `checkJq` pattern (3 ternary, no special case); ALL Win shell behavior tested in `probe-gstack.test.ts` matrix not doctor.ts; doctor.ts 仅 import + dispatch |
| 3 | **JINJA interpolate.ts 加 dot-path / nested support 'for future use'** — D-02 spec ≤30L 但用户 future use 诱惑 | YAGNI 违 — 本 phase 单 var single-word 足够 | 严格锁 `\w` regex; nested → throw with helpful error (`'a.b' is unsupported — use single-word var only`); Phase 3.4+ 真有 nested 需求时再加 |
| 4 | **governance.ts 加 polling timer 'just in case veto fires mid-phase'** — D-04 lock lazy read on transition only | Polling 是 Phase 2.4 SSE-rejected anti-pattern; mid-phase veto 不应中断 ongoing skill execution (sister gradient: workflow 是 atomic unit at phase granularity) | 严格锁 `isVetoed()` 仅在 phase boundary call; mid-phase veto 等下 phase transition 时生效 — UX 可接受 (5 phase × ~1s each, max 1s delay) |
| 5 | **plan-feature workflow.yaml 加 真接 spawn 'because tests need real output'** | 违 D-03 WIRED lock; scope creep to FULL → Phase 3.3+ dogfood scope 入侵 | 严格锁 stub return mock; integration test 用 `dispatchSkillStub` mock factory + 5 fixture cover stub success + 1 fixture stub fail → workflow status='failed' |

### 13.2 Karpathy 4 心法 application checklist

| 心法 | Application |
|------|-------------|
| **Think Before Coding** | Wave A R2 (本 RESEARCH) + Wave A R1 (PATTERNS) 完后才进 Wave B planner; D-02 + D-04 schema 决策 spike-first |
| **Surgical Changes** | W0.1 test-only fix (src 不动 audit.ts); W0.2 docs + 1-line ci.yml ENFORCE flip; W1+W2 NEW files (no MODIFY 大文件) |
| **Simplicity First** | JINJA single-word regex (no nested); governance.v1 2-state union (active/vetoed); 5 skill stub minimal 3-field mock; 4 wave (vs Phase 3.1 6 wave 因 scope 更小) |
| **Goal-Driven** | R7.1 30 plan-feature 场景 + R7.4 三种 prefix 跑通 是 acceptance ⊕ workflow.run.ts 不超 80L 是 hard limit — 两 axis 都过即 phase ship |

---

## § 14 Open questions (resolved + remaining)

### Resolved (本 RESEARCH 决)

1. **Win shell flavor `which` vs `where`?** → § 1.1 sister `checkJq` `process.platform === 'win32' ? 'where' : 'which'`
2. **JINJA regex variant?** → § 2.1 `/\{\{\s*(\w+)\s*\}\}/g` simple word
3. **Throw vs fallback on undefined var?** → § 3 throw (Karpathy fail-loud + 行业 strict 推荐)
4. **9th schemaVersion surface?** → § 4 新增 (Option B); 实际 加 2 surface (config + governance) 共 8→10
5. **workflow.yaml on_veto placement?** → § 5.2 workflow-level top-key
6. **Skill stub mock format?** → § 6.2 minimal 3-field `{status, output, decision}`
7. **W0.1 fix path?** → § 8.3 Path A test-only mock add (~15L delta)
8. **W0.2 SSOT?** → § 9.1 README format SSOT, STATE.md 改 (Option A)
9. **D-01 + D-04 文件 split?** → § 10.1 双独立文件 (Option B)
10. **Wave topology?** → § 12.1 4 wave (W0-W3)

### Remaining (planner 决)

1. **Wave 0 4 task ordering** — W0.1 cli-audit fix vs W0.2 README/STATE normalize vs W0.3 schema 决策 record vs W0.4 ci.yml ENFORCE flip — Planner 决 sequential (推 W0.1 → W0.2 → W0.4 → W0.3 同 W0.3 是 decision record 仅 doc 改) OR partial parallel (W0.1 + W0.3 并行)
2. **CLI subcommand 13th `harnessed plan-feature <feature-name>` 是否 Phase 3.2 加 OR Phase 3.3+ 加** — 3.2-CONTEXT.md L202-203 暗示 planner 决; 推 Phase 3.3+ 加 (本 phase WIRED 是 internal runtime 验证, 用户 CLI 入口 Phase 3.3 dogfood 自然时机)
3. **Phase 3.2 milestone tag 名** — `v0.3.0-alpha.2-plan-feature` OR `v0.3.0-alpha.2-gstack-prefix`? — 推 `v0.3.0-alpha.2-plan-feature` (D-03 WIRED 是 phase 主线; gstack 前缀是 enabler)
4. **dashboard SSE governance.json watcher** — Wave 0 spike 1h evaluate OR SKIP — 推 SKIP (sister Phase 3.1 同样推 spike-then-skip; Phase 3.3+ 集成自然)

---

## § 15 Assumptions Log

> Claims tagged `[ASSUMED]` in this research (planner + discuss-phase 需 user confirm before execution):

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | — | — | — |

**All claims verified or sister-cited** — no [ASSUMED] tags in this research. (Counterexample: Phase 3.1 RESEARCH § 3 token Heuristic 4 bytes/token 是 [MEDIUM] but cited OpenAI/multiple sources; 本 phase Heuristic-free, no [ASSUMED].)

---

## § 16 Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All TypeScript code | ✓ | ≥22 (verified Phase 2.4 doctor.ts L30) | — |
| corepack | `pnpm` invocation | ✓ | (Node 22 bundled) | — |
| pnpm | install + test | ✓ | (corepack-managed) | — |
| TypeScript | tsc + vitest transform | ✓ | (devDependency) | — |
| vitest | test runner | ✓ | (devDependency) | — |
| @sinclair/typebox | schema | ✓ | (dependency) | — |
| yaml | workflow.yaml parse | ✓ | (dependency, sister `loadPhases.ts` L13) | — |
| **gstack-office-hours** (CLI) | D-01 PROBE detection target | ✗ (not installed dev env) | — | PROBE detects neither/both → fallback prompt + .harnessed/config.json 手填 (PROBE 设计已 cover) |
| **office-hours** (CLI, no-prefix) | D-01 PROBE detection target | ✗ (not installed dev env) | — | 同上 |
| @anthropic-ai/claude-agent-sdk | Phase 3.1 carry-forward (本 phase WIRED 不调 SDK 真 spawn) | ✓ | 0.3.142 pinned (Phase 3.1 RESEARCH § 0.7 直证) | — |
| dashboard chokidar watcher | dashboard SSE (本 phase SKIP per Claude's Discretion) | ✓ | (Phase 2.4 直证) | — (本 phase 不消费) |

**Missing dependencies with no fallback**: None — gstack CLI absence is by-design (PROBE 的 fail-soft handling 是 D-01 PROBE scheme 核心 — 用户三种前缀场景任一都跑通的 R7.4 验收正是 cover this case)。

**Missing dependencies with fallback**: gstack CLI absent → PROBE fallback prompt + user manual edit `.harnessed/config.json` (D-01 explicit 设计)。

---

## § 17 Sources

### Primary (HIGH confidence)
- `src/cli/doctor.ts` L1-175 — 5-check baseline + Win shell flavor (L80-83, L98-126) + `--json` flag pattern (L141-172)
- `src/cli/audit.ts` L1-167 — W0.1 root cause direct (L17-19 eager import + L128-132 runtime helper dispatch)
- `src/cli/lib/audit-helpers.ts` L1-73 — W0.1 root cause direct (L7 spawnSync import + L69 auditProvenance unconditional)
- `src/cli/lib/origin-check.ts` L1-80 — sister helper pattern (≤80L Karpathy)
- `src/types/schemaVersion.ts` L1-72 — 8-surface register + 9th/10th surface 加 cost
- `src/workflow/loadPhases.ts` L1-30 — extend point for `interpolateInvokes`
- `src/checkpoint/state.ts` L1-76 — sister file-based state machine pattern
- `src/checkpoint/engineHook.ts` L1-48 — engineCheckpointHook reuse target (paused state)
- `workflows/execute-task/phases.yaml` L1-28 — sister DSL reference
- `skills/karpathy-baseline/SKILL.md` (existing) — sister SKILL.md stub format
- `.github/workflows/ci.yml` L114-211 — W0.2 ENFORCE flip 1-line delta location
- `tests/unit/cli-audit.test.ts` L1-114 — W0.1 mock setup baseline
- `3.2-CONTEXT.md` L40-114 — 4 D-decisions LOCKED verbatim
- `3.2-KICKOFF.md` L58-67 — W0 backlog 3 项
- `.planning/STATE.md` L1-80 — per-phase shipped marker format
- `README.md` L1-80 — per-phase shipped marker format
- `.planning/REQUIREMENTS.md` L257-279 — R7.1 + R7.4 验收 bar
- `.planning/phase-3.1/RESEARCH.md` L1-237 — sister format reference + Phase 3.1 D-04 WIRE-IN 模式

### Secondary (MEDIUM-HIGH confidence)
- Node.js `child_process.spawnSync` docs nodejs.org/api/child_process — `which`/`where` Win cross-OS 行为
- MDN `String.prototype.replace` docs — `/g` flag + callback signature 标准
- Mustache.js / Handlebars.js / Nunjucks / Jinja2 / Liquid docs — strict mode 行业 cross-check
- Karpathy CLAUDE.md global instructions — Karpathy 4 心法 + hard limit ≤200L

### Tertiary (MEDIUM confidence — projection/未 spike)
- governance.json lazy read overhead estimate § 7.2 — projection based on Node 22 fs.readFile benchmark + TypeBox Value.Check microbench (sister Phase 3.1 `readCurrentWorkflow` 同 pattern verified work)
- 5 anti-pattern at risk § 13.1 — 经验值, 未 spike (sister Phase 3.1 § 11 同 level confidence)

---

## § 18 Metadata

**Confidence breakdown**:
- Win shell flavor (§ 1): HIGH — sister `checkJq` L80-83 直证 + Node docs cross-check
- JINJA regex (§ 2): HIGH — JavaScript MDN-standard
- Throw vs fallback (§ 3): MEDIUM-HIGH — 行业 cross-check (5 lib) + Karpathy sister Phase 3.1 D-01 模式
- 9th surface (§ 4): HIGH — sister `schemaVersion.ts` L34-58 直证 + Phase 3.1 7→8 sister precedent
- workflow.yaml DSL (§ 5): HIGH — `execute-task/phases.yaml` L1-28 直证 + 3.2-CONTEXT.md hint verbatim
- 5 skill stub (§ 6): HIGH — `karpathy-baseline/SKILL.md` sister 模式
- Governance lazy read (§ 7): MEDIUM — projection (sister 模式 verified Phase 3.1 但 perf 未本 phase spike)
- W0.1 cli-audit (§ 8): HIGH — 本 session local 实测 2 fail 复现 + source code direct evidence
- W0.2 SSOT (§ 9): HIGH — grep count 11 vs 1 本 session 实测 + ci.yml 直证
- .harnessed/ file separation (§ 10): HIGH — sister Phase 3.1 5 path 模式 + Karpathy single-responsibility
- Validation Architecture (§ 11): MEDIUM — projection (43 fixture target based on sister Phase 3.1 28 fixture +50%)
- Wave topology (§ 12): HIGH — sister Phase 3.1 6 wave 模式 (本 phase smaller scope → 4 wave)
- Karpathy anti-patterns (§ 13): MEDIUM — 经验值

**Research date**: 2026-05-16
**Valid until**: ~2026-08-15 (Phase 3.2 ship + Phase 3.3 dogfood cycle; gstack-office-hours CLI 命名稳定 within gstack v0.x cadence)

---

## RESEARCH COMPLETE
