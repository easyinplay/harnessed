# Phase 2.4: doctor 完整版 + EE-4 ABSORB + dashboard C 路径 + README CI gate + ralph-loop Win sentinel — Pattern Map

> **Mapped**: 2026-05-16
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 12 NEW / MODIFIED targets (per KICKOFF § 4 R1 + D-01~D-04)
> **Analogs found**: 11 / 12 (~91%; 1 target fresh — WebSocket lib choice D-WP-5)
> **Anti-stall**: 14 tool uses pre-Write (1× Read batch ×4 + 1× Read batch ×4 + 1× Read batch ×4 + 1× Glob batch ×2 + 1× Read batch ×2)
> **Style**: 沿袭 phase 2.3 PATTERNS.md (§ 1 table + § 2 concrete excerpts + § 3 D-WP-* + § 4 reuse summary + § 5 path dependency)

---

## § 1 NEW / MODIFIED Targets → Existing Analog Mapping

| # | New / Modified Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|----------------------|------|-----------|----------------|---------|---------------|
| 1 | `src/cli/doctor.ts` ~38L → ~150L (MODIFIED, D-01 MIN 5 check) | CLI controller | request-response (commander → checks[] → stdout/exit) | 现 `src/cli/doctor.ts` L1-152 (4 check baseline — Node/MCP scope/jq/Win bash flavor 已 ship) | **~85%** | **COPY** `CheckResult` interface L21-26 + `checkNodeVersion()` / `checkMcpScope()` / `checkJq()` / `checkWinBash()` 4 method 不动 + `registerDoctor()` L129-152 调用模式;**ADAPT** 加 5th check `checkOriginUrl()` (新 ~25L) + 升级 `CheckResult` 加 `status: 'pass'\|'warn'\|'fail'` 替代 `ok: boolean` (per D-01 hint § 1.2 F2) + 加 `--json` flag 输出 JSON;Karpathy hard limit ≤200L 强制 — `checkOriginUrl` 抽 helper 进 `src/cli/lib/origin-check.ts` ~20L 共享 audit (Integration Point sister) |
| 2 | `src/cli/lib/origin-check.ts` (NEW, D-01 #5 + audit 完整版 共享 helper) | utility / pure fn | request-response (cwd + manifest → CheckResult) | `src/cli/doctor.ts` L99-127 `checkWinBash()` (spawnSync probe pattern) + `src/cli/audit.ts` L42-50 REPO_URL_PATTERN regex helper | **~70%** | **COPY** `spawnSync('git', ['config', '--get', 'remote.origin.url'])` 模式(参 doctor.ts L116 `spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME']`));**COPY** audit.ts L42-43 `REPO_URL_PATTERN` regex 校验;**ADAPT** 新 logic — parse cwd manifest yaml `metadata.upstream.repository` vs `git config --get remote.origin.url` 比对;tampered → `{ status: 'fail', message: 'origin drift', fix: 'git remote set-url origin <expected>' }` |
| 3 | `routing/plan-review-schema.yaml` (NEW, D-02 EE-4 4 维 SSOT) | config / schema | declarative (yaml → TypeBox runtime validate → checker consume) | `routing/decision_rules.yaml` v2 顶层 schema shape (Phase 1.5 ship + Phase 2.3 三 category 段) + `intel/omc-comparison.md` L74-82 omo Metis/Momus 原型 | **~60%** | **COPY** yaml top-level `apiVersion` / `kind` / `metadata` / `spec` 框架 (沿袭 decision_rules.yaml 范式);**ADAPT** 4 维 keys 全新 — `thresholds.{file_references_verified: 1.0, reference_sources_real: 0.8, concrete_acceptance: 0.9, business_logic_assumptions: 0}` + `scoring.{pass_threshold: 4, warning_threshold: 3, blocker_threshold: 2}` (D-02 hint § 1.2 F3);yaml 单一 SSOT (D-02 Hard Constraint #5),不与 decision_rules.yaml 合并 |
| 4 | `scripts/run-plan-checker.mjs` (NEW, D-02 CI step) | CI script | batch (cli arg → glob phase dir → yaml schema apply → JSON output) | `scripts/check-transparency-verdicts.mjs` (96L, walker + violation array + ENFORCE flag + exit code) + `scripts/check-provenance.mjs` (71L, walker + JSON validator + exit code) | **~75%** | **COPY** walker pattern L29-36 + violation array + ENFORCE=true exit 1 模式 (W3 round 1 警示沿袭);**ADAPT** 输入 = `.planning/phase-X.Y/task_plan.md + PLAN.md` (走 grep file references + reference sources count + acceptance bar regex 命中数);输出 = `plan-check.json` (4 维 score + verdict 三档);BLOCKER (≤2/4) exit 1 强制 plan-phase 重跑 |
| 5 | `~/.claude/agents/gsd-plan-checker` agent prompt ~30L 量化输出节 (MODIFIED, D-02) | agent prompt | declarative (markdown agent definition) | gsd-plan-checker agent (全局 `~/.claude/agents/`) — 现 BLOCKER/WARNING/SUGGESTION 三档 (Phase 2.2/2.3 PLAN-CHECK.md verdict 模式实证) | **~50%** | **ADAPT-mostly** — 加新 ~30L 节 `## EE-4 4 维量化输出` 读 `routing/plan-review-schema.yaml` threshold + 输出 4 维 score + BLOCKER 三档 (4/4 PASS / 3/4 WARNING / ≤2/4 BLOCKER);沿袭现有三档 verdict 模式 (Phase 2.3 PLAN-CHECK.md `APPROVED WITH CONDITIONS (0 BLOCKER / 4 WARNING / 5 SUGGESTION)` 风格);agent 不动 main body — additive 节追加 |
| 6 | `src/installers/cc-hook-installer.ts` (NEW, D-04 3.1, ~30L → ≤100L Karpathy hard limit) | service (installer) | request-response (manifest → fs.writeFile hook config → result) | `src/installers/npxSkillInstaller.ts` (217L, Phase 2.1 6/6 ship — 最近似形态: 也用 `homedir()/.claude/` 目标路径 + real-path verify + L2 confirm + DiffPlan) | **~70%** | **COPY** installer skeleton L65-78 (dispatch-mismatch guard) + L79-85 preflight + L131-145 DiffPlan + L147-152 L2 confirm + L154-155 backup + L160-172 spawn-or-fs + L174-193 real-path verify + L215-216 updateInstalled + uninstall pair;**ADAPT** target path `homedir()/.claude/settings.json` (hook 块 merge JSON not file write) + skip spawn (纯 JSON parse + mutate + write) + verify = `JSON.parse(settings).hooks.SessionStart` 含 manifest declared cmd;沿袭 6 installer Level mapping (L3 — `~/.claude.json` user-config 同档) |
| 7 | `src/installers/index.ts` 加第 7 dispatch entry (MODIFIED, D-04 3.1) | dispatch / registry | declarative (Record dispatch table) | 现 `src/installers/index.ts` L27-34 `installers: Record<...>` 6 entries + `levelOf()` switch L36-49 | **~95%** | **COPY-mostly** — additive: import `installCcHook` + dispatch entry `'cc-hook': installCcHook` + `levelOf` switch case `'cc-hook': return 'L3'` (沿袭 `mcp-stdio-add`/`mcp-http-add`/`cc-plugin-marketplace` 同 L3 user-config — ~/.claude/settings.json 写入);6 → 7 method dispatch table 升级,A7 守恒 — additive only 不动旧 entry |
| 8 | `src/manifest/schema/spec.ts` 加 `install_type: 'cc-hook'` enum 项 + `src/manifest/schema/installMethods/ccHook.ts` (NEW) (MODIFIED, D-04 3.1) | schema | declarative (TypeBox enum extension) | 现 `spec.ts` L106-111 `InstallType` Union 4 enum (skill/mcp/npm/git) + `installMethods/index.ts` L20-27 6-branch `discriminator: { propertyName: 'method' }` oneOf pattern + 现 6 `installMethods/<name>.ts` 文件 | **~90%** | **COPY** TypeBox `Type.Union([...])` 加项 + `installMethods/ccHook.ts` 复刻 `npxSkillInstaller.ts` schema shape (NpxSkillInstaller TypeBox object 含 method literal + cmd + idempotent_check + git_ref/optional);**ADAPT** `InstallType` 加 `Type.Literal('cc-hook')` (5 enum); `installMethods/ccHook.ts` `method: Type.Literal('cc-hook')` + ccHook-specific field (hook_event: SessionStart/UserPromptSubmit/... enum + matcher: string regex);`installMethods/index.ts` `branches` array 7th entry |
| 9 | `scripts/dashboard.mjs` 加 STATE.md watcher + WebSocket push ~50L (MODIFIED, D-04 3.2) | service (dashboard server) | event-driven (fs.watch event → debounce → ws broadcast) | 现 `scripts/dashboard.mjs` L435-445 `watchedPaths()` (现 polling /mtime 路径列表) + L186-224 `pageDashboard()` shell + L406-429 client-side polling `setInterval(poll, 2000)` 模式 | **~65%** | **COPY** `watchedPaths()` L435-445 path list (复用);**ADAPT** 替 polling → push: 加 `import { watch } from 'node:fs'` (D-04 hint § 1.2 F4) + debounce 500ms + WebSocket server (port 47180 share OR 47181 sidecar — D-WP-5 决);client SHELL HTML L406-429 改 `setInterval` 为 `new WebSocket('ws://localhost:<port>')` + onmessage → dot.classList.add('changed');沿袭现 dot UI L401-402 + auto-refresh 逻辑 |
| 10 | `scripts/dashboard.mjs` 加多项目 nav + URL routing ~80L (MODIFIED, D-04 3.3) | service (dashboard server) | request-response (HTTP /api/projects → JSON + client route) | 现 `scripts/dashboard.mjs` L447-473 `createServer` + `/page/<name>` routing pattern + L389-405 nav HTML L390-400 (现 7 entry hardcoded list) | **~60%** | **COPY** route handler shape L447-473 (路由 dispatch);**ADAPT** 加 `/api/projects` endpoint (read `~/.claude/harnessed-projects.json` → JSON list) + `/api/project/<id>/STATE` endpoint (per-project STATE.md content);加左栏 nav 渲染项目列表 (上方 `<h1>harnessed</h1>` 加 project select dropdown OR sidebar separate column);client-side `?project=<path>` URL routing — `history.pushState` no-reload (复用现 `loadPage()` L409-414 模式扩展为 `loadProject()`);现 PORT 47180 不动 (沿袭 idempotent probe L496-505) |
| 11 | `.github/workflows/ci.yml` 加 README CI counter gate ~15L step (MODIFIED, D-03 B 路径) | CI gate | batch (bash grep counts + comparison) | 现 `ci.yml` L120-125 schema regen gate (15L) + L132-138 schemaVersion consumer gate (Phase 2.3 W0 T1.2) + L86-87 transparency verdict gate (single-line script invoke) | **~90%** | **COPY** step shape `- name: <human> ... run: <bash 多行>` + bash exit 1 on mismatch 模式 (L132-138 grep + count + condition exit 1 直接 analog);**ADAPT** D-03 exact yaml block per CONTEXT.md hint L65-75 — `SHIPPED=$(grep -cE "Phase 2\.[0-9]+ shipped" README.md)` + `BARS=$(grep -cE "Acceptance bar [A-Z][0-9]" README.md)` + `L44=$(sed -n '44p' README.md ...)` + 三计数 if 比对 exit 1;regex pattern planner 实占 (sample README 行格式后 lock) |
| 12 | `.github/workflows/ci.yml` 加 ralph-loop Win sentinel step + audit 完整版 step (MODIFIED, F5) | CI gate | batch | 现 `ci.yml` L100-103 `Provenance gate (Win pwsh sentinel, Phase 2.3 Wave 0 T1.3)` (Win-only invoke pattern — `if: runner.os == 'Windows'` + `shell: pwsh`) + L153-203 installer integration H4 dual-layer (real spawn dry-run 模式) | **~85%** | **COPY** L100-103 Win-only `if: runner.os == 'Windows'` + ralph-loop 5-fixture sample MIN scope (R2-3 research 决);**ADAPT** audit 完整版 — `corepack pnpm test:e2e:audit` 跑 origin URL 校验 + 模拟 fork (audit.ts 扩 + `src/cli/lib/origin-check.ts` 共享 helper);沿袭 L165-181 `ok_or_dryrun` 函数 (exit 0 OR 2 容忍) |

---

## § 2 Per-target Concrete Code Excerpts

### 2.1 `src/cli/doctor.ts` ~38L → ~150L — analog: 现 doctor.ts L1-152 (4 check baseline)

**COPY 现 4 check 主流程** (`doctor.ts` L129-152,registerDoctor + results 累积 + exit code):

```ts
export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Minimal preflight checks (Node / MCP scope / jq / Win bash flavor / origin URL)')  // ← ADAPT 加 origin URL
    .option('--json', 'output JSON instead of human-readable')   // ← ADD (D-01 hint F2)
    .action(async (opts) => {
      const results: CheckResult[] = [
        checkNodeVersion(),
        await checkMcpScope(),
        checkJq(),
        checkWinBash(),
        await checkOriginUrl(),                                  // ← ADD 5th check
      ]
      // ... 沿袭 L140-150 print loop, 加 --json 分支
      // CheckResult `ok: boolean` → `status: 'pass' | 'warn' | 'fail'` 升级 (per F2)
      process.exit(results.some(r => r.status === 'fail') ? 1 : 0)
    })
}
```

**ADAPT `CheckResult` 升级 status enum** (现 doctor.ts L21-26 — bool ok 改 3 状态):

```ts
// 现状 L21-26:
interface CheckResult { name: string; ok: boolean; detail: string; fix?: string }

// Phase 2.4 升级:
interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'                              // ← D-01 hint F2
  message: string                                                // ← rename detail
  fix?: string
}
```

**NEW `checkOriginUrl()` skeleton** (~25L,抽 helper 进 `src/cli/lib/origin-check.ts`):

```ts
async function checkOriginUrl(): Promise<CheckResult> {
  const { checkOrigin } = await import('./lib/origin-check.js')
  return checkOrigin(process.cwd())                              // ← 沿袭 doctor 现 5 check 各 independent method 模式
}
```

### 2.2 `src/cli/lib/origin-check.ts` (NEW) — analog: doctor.ts L99-127 (spawnSync probe) + audit.ts L42-50 (regex 校验)

**COPY spawnSync 模式** (`doctor.ts` L116 — `spawnSync('bash', ['-c', '...'])` 套式 + L82 `where`/`which` finder):

```ts
// src/cli/lib/origin-check.ts (~20L,sister to doctor #5 + audit 完整版 共享)
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
// import { parse } from 'yaml'  // 复用 manifest/validate.ts 现有 yaml dep (无新 dep)

export async function checkOrigin(cwd: string): Promise<CheckResult> {
  // 1. git remote origin URL (沿袭 doctor.ts L116 spawnSync probe pattern)
  const r = spawnSync('git', ['config', '--get', 'remote.origin.url'], { cwd, encoding: 'utf8' })
  if (r.status !== 0) {
    return { name: 'origin URL', status: 'warn', message: 'no git remote', fix: 'git remote add origin <expected-url>' }
  }
  const actualUrl = r.stdout.trim()
  // 2. parse cwd manifest yaml metadata.upstream.repository (沿袭 audit.ts L42 REPO_URL_PATTERN)
  const expected = await readExpectedUpstream(cwd)               // ← 抽 helper
  if (!expected || actualUrl === expected) return { name: 'origin URL', status: 'pass', message: actualUrl }
  return { name: 'origin URL', status: 'fail', message: `drift: ${actualUrl} ≠ ${expected}`, fix: `git remote set-url origin ${expected}` }
}
```

### 2.3 `routing/plan-review-schema.yaml` (NEW) — analog: `routing/decision_rules.yaml` 顶层框架 + intel L74-82

**ADAPT 4 维 SSOT** (D-02 + CONTEXT.md hint § Specific Ideas L196-207 原型):

```yaml
# yaml-language-server: $schema=../schemas/plan-review.v1.schema.json  # D-WP-2 决是否生成
apiVersion: harnessed/v1
kind: PlanReview                                                 # ← 新 kind (decision_rules.yaml 是 DecisionRules)
metadata:
  name: ee-4-plan-review-schema
  version: 1
  source: intel/omc-comparison.md L74-82                         # ← omo Metis/Momus 原型
spec:
  thresholds:
    file_references_verified: 1.0      # 100% — plan 提及 file path 100% grep 命中真实文件
    reference_sources_real: 0.8        # ≥80% — intel/ADR/RETRO/CONTEXT 引用 ≥80% 真实存在
    concrete_acceptance: 0.9           # ≥90% — acceptance bar 含可量化 signal (行数/exit/regex)
    business_logic_assumptions: 0      # exact 0 — 无 "assumed X behaves like Y" 臆测
  scoring:
    pass_threshold: 4                  # 4/4 维达标 → PASS
    warning_threshold: 3               # 3/4 → WARNING
    blocker_threshold: 2               # ≤2/4 → BLOCKER 强制 plan-phase 重跑
```

### 2.4 `scripts/run-plan-checker.mjs` (NEW) — analog: `check-transparency-verdicts.mjs` walker L29-36 + ENFORCE pattern L12+L93

**COPY walker + violation array + exit code** (现 `check-transparency-verdicts.mjs` L29-95):

```js
#!/usr/bin/env node
// Phase 2.4 W2 — EE-4 plan-checker quantitative gate (ADR plan-phase 实占 § Decision).
// 沿袭 check-transparency-verdicts.mjs walker (Phase 2.1 T1.7 ship) + check-provenance.mjs JSON validator pattern (Phase 2.2 T4.0 ship).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ENFORCE = true                                            // 沿袭 W3 ENFORCE 模式 (transparency L12, provenance L11)
const SCHEMA = parseYaml(readFileSync('routing/plan-review-schema.yaml', 'utf8'))

function walk(dir, out = []) {                                   // ← COPY transparency L29-36
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/task_plan\.md$|PLAN\.md$/.test(name)) out.push(p)
  }
  return out
}

// ... 4 维 score 计算 (grep file refs / count source refs / regex acceptance / 臆测 keyword 检) ...

if (verdict === 'BLOCKER') {                                    // ← ≤2/4 BLOCKER 强制重跑
  console.error(`::error::plan-check BLOCKER (${score}/4)`)
  process.exit(ENFORCE ? 1 : 0)
}
```

### 2.5 `src/installers/cc-hook-installer.ts` (NEW ≤100L) — analog: `npxSkillInstaller.ts` (217L)

**COPY installer skeleton** (`npxSkillInstaller.ts` L65-78 dispatch guard + L79-85 preflight + L131-145 DiffPlan + L147-152 L2 confirm + L174-193 real-path verify):

```ts
// src/installers/cc-hook-installer.ts (Karpathy hard limit ≤100L per KICKOFF § 3 #8)
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { preflight } from './lib/preflight.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, Installer, InstallResult } from './lib/types.js'

export const installCcHook: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook') {                            // ← COPY npxSkillInstaller L67-78 dispatch-mismatch guard
    return { ok: false, phase: 'preflight', error: { /* ... */ keyword: 'dispatch-mismatch' } }
  }
  const pre = preflight(ctx)
  if (!pre.ok) { /* ← COPY L79-85 */ }
  // Target: ~/.claude/settings.json hooks block merge (NOT new file write — JSON merge)
  const settingsPath = join(homedir(), '.claude', 'settings.json')
  const existing = await readFile(settingsPath, 'utf8').catch(() => '{}')
  const settings = JSON.parse(existing)
  // ... merge SessionStart / UserPromptSubmit / etc. hooks block per manifest ...
  const plan: DiffPlan = { files: [{ target: settingsPath, scope: 'HOME', oldText: existing, newText: JSON.stringify(merged, null, 2) }] }
  process.stdout.write(renderDiff(plan, ctx))
  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })   // ← L3 (用户 config), 沿袭 mcp-stdio-add 同档
  if (!conf.proceed) return { aborted: true, reason: 'user-cancel' }
  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }
  await writeFile(settingsPath, plan.files[0].newText)
  // verify (real JSON parse, npxSkillInstaller L174-193 real-path 模式)
  const verifyJson = JSON.parse(await readFile(settingsPath, 'utf8'))
  if (!verifyJson.hooks?.SessionStart) {
    return { ok: false, phase: 'verify', backupId: bk.backupId, error: { /* keyword: 'verify-failed' */ } }
  }
  await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, '', '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [settingsPath] }
}
```

### 2.6 `src/installers/index.ts` 加第 7 dispatch (MODIFIED) — analog: 现 L27-49

**COPY-additive** (现 `src/installers/index.ts` L27-49 dispatch + levelOf,新增 entry 不动旧):

```ts
import { installCcHook } from './ccHookInstaller.js'              // ← ADD
// ... 现 6 import 不动 ...

export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'npm-cli': installNpmCli,
  'mcp-stdio-add': installMcpStdioAdd,
  'cc-plugin-marketplace': installCcPluginMarketplace,
  'git-clone-with-setup': installGitCloneWithSetup,
  'npx-skill-installer': installNpxSkillInstaller,
  'mcp-http-add': installMcpHttpAdd,
  'cc-hook': installCcHook,                                       // ← ADD 7th entry
}

function levelOf(manifest: Manifest): Level {
  const method = manifest.spec.install.method
  switch (method) {
    case 'mcp-stdio-add':
    case 'mcp-http-add':
    case 'cc-plugin-marketplace':
    case 'cc-hook':                                               // ← ADD 沿袭 L3 user-config (~/.claude/settings.json)
      return 'L3'
    case 'git-clone-with-setup':
    case 'npx-skill-installer':
      return 'L2'
    case 'npm-cli':
      return 'L4'
  }
}
```

### 2.7 `src/manifest/schema/spec.ts` enum 升级 + `installMethods/ccHook.ts` (NEW) — analog: L106-111 InstallType + installMethods/index.ts L20-27

**ADAPT InstallType enum** (现 spec.ts L106-111):

```ts
const InstallType = Type.Union([
  Type.Literal('skill'),
  Type.Literal('mcp'),
  Type.Literal('npm'),
  Type.Literal('git'),
  Type.Literal('cc-hook'),                                        // ← ADD (additive, A7 守恒)
])
```

**NEW `installMethods/ccHook.ts`** (复刻 `npxSkillInstaller.ts` schema shape):

```ts
import { Type } from '@sinclair/typebox'
export const CcHook = Type.Object({
  method: Type.Literal('cc-hook'),
  cmd: Type.String({ minLength: 1 }),                            // 沿袭 6 method 共通字段
  hook_event: Type.Union([
    Type.Literal('SessionStart'),
    Type.Literal('UserPromptSubmit'),
    Type.Literal('PreToolUse'),
    Type.Literal('PostToolUse'),                                  // CC hooks 内建 4 event (manifest 实占由 plan-phase)
  ]),
  matcher: Type.Optional(Type.String()),                          // CC hooks matcher regex (e.g. "startup|resume")
  idempotent_check: Type.String({ minLength: 1 }),
}, { additionalProperties: false })
```

**ADAPT `installMethods/index.ts` branches L20-27** 加 7th entry:

```ts
const branches = [
  CcPluginMarketplace, GitCloneWithSetup, NpxSkillInstaller,
  NpmCli, McpStdioAdd, McpHttpAdd,
  CcHook,                                                         // ← ADD 7th branch
] as const
```

### 2.8 `scripts/dashboard.mjs` 加 STATE.md watcher + WebSocket — analog: 现 L435-445 watchedPaths + L406-429 client polling

**ADAPT 现 polling → push** (现 client side L422-427 `setInterval(poll, 2000)` 替换为 WebSocket onmessage):

```js
// scripts/dashboard.mjs 加 ~50L (server-side):
import { watch } from 'node:fs'
// D-WP-5: WebSocket 库选择 — node 内建 `ws` package vs raw http upgrade. Karpathy 无新 dep 倾向 raw.
// 候选 a: `import { WebSocketServer } from 'ws'` (新 dep, 简洁 ~5L)
// 候选 b: raw http upgrade handler (无新 dep, ~30L 手写 frame parse)
// → R2-1 fresh research OR planner 决 (默认 a 若 ws 已是间接 dep,否则 b)

let debounceTimer = null
const clients = new Set()                                         // WebSocket client set
for (const p of watchedPaths()) {                                 // ← COPY 现 L435-445 path list
  watch(p, () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      for (const c of clients) c.send(JSON.stringify({ type: 'state-changed', mtime: Date.now() }))
    }, 500)                                                       // debounce 500ms per D-04 hint § 1.2 F4
  })
}
// HTTP upgrade handler (raw OR ws.handleUpgrade)
server.on('upgrade', (req, socket, head) => { /* ... */ clients.add(ws) })

// Client side (SHELL HTML L406-429 改):
// 现: setInterval(poll, 2000)
// 改: const ws = new WebSocket(`ws://${location.host}`)
//     ws.onmessage = (e) => { dot.classList.add('changed'); t.textContent='文件有更新, 点击 ⟳ 刷新' }
```

### 2.9 `scripts/dashboard.mjs` 加多项目 nav + URL routing — analog: 现 L447-473 createServer + L390-400 nav HTML

**ADAPT 加 /api/projects endpoint + client route**:

```js
// scripts/dashboard.mjs 加 ~80L:
// 1. server side — 加 endpoint
if (url === '/api/projects') {
  const cfg = JSON.parse(readFileSync(join(homedir(), '.claude', 'harnessed-projects.json'), 'utf8').catch(() => '[]'))
  res.writeHead(200, { 'content-type': 'application/json' })
  return res.end(JSON.stringify(cfg))
}
if (url.startsWith('/api/project/')) { /* per-project STATE read */ }

// 2. client side — 加 dropdown + URL route
// 沿袭 现 L409-414 loadPage() 模式扩展:
async function loadProject(path) {                                // 新增, history.pushState no-reload
  history.pushState({}, '', `?project=${encodeURIComponent(path)}`)
  // re-fetch all panels with new project root
}
window.addEventListener('popstate', () => { /* re-render from URL */ })

// 3. nav HTML L390-400 — 上方加 project selector:
// 现: <h1>harnessed</h1><div class="v">STATE · read-only</div>
// 加: <select id="proj-sel" onchange="loadProject(this.value)"><option>...</option></select>
```

### 2.10 `.github/workflows/ci.yml` README CI counter gate — analog: L120-138 schema/schemaVersion gate

**COPY step shape + bash exit-1-on-mismatch** (现 `ci.yml` L132-138 schemaVersion consumer gate 直接 analog):

```yaml
# Phase 2.4 Wave 0 D-03 (B 路径) — README counter integrity gate.
# 沿袭 Phase 2.3 W0 T1.2 schemaVersion gate (L132-138) bash + exit 1 模式.
- name: README counter integrity gate (Phase 2.4 Wave 0 D-03)
  run: |
    SHIPPED=$(grep -cE "Phase 2\.[0-9]+ shipped" README.md)
    BARS=$(grep -cE "Acceptance bar [A-Z][0-9]" README.md)
    L44=$(sed -n '44p' README.md | grep -oE '[0-9]+/4' | head -1 | cut -d/ -f1)
    if [ "$SHIPPED" != "$BARS" ] || [ "$SHIPPED" != "$L44" ]; then
      echo "::error::README counter drift: shipped=$SHIPPED bars=$BARS L44=$L44"
      exit 1
    fi
```

### 2.11 `.github/workflows/ci.yml` ralph-loop Win sentinel — analog: L100-103 Provenance Win pwsh sentinel

**COPY Win-only invoke 模式** (现 `ci.yml` L100-103):

```yaml
# Phase 2.4 F5 — ralph-loop Win matrix sentinel (ROADMAP L115 验收兑现).
# 沿袭 Phase 2.3 W0 T1.3 Provenance Win pwsh sentinel (L100-103) pattern.
- name: ralph-loop Win sentinel (Phase 2.4 F5, MIN 5 fixture)
  if: runner.os == 'Windows'
  shell: bash                                                     # ← 沿袭 doctor.ts 验过 Git Bash 路径
  run: corepack pnpm test:e2e:ralph-loop:win-sentinel             # ← R2-3 fresh research 决具体 fixture 数
```

### 2.12 `scripts/run-plan-checker.mjs` CI step

```yaml
# Phase 2.4 W2 D-02 — EE-4 plan-checker quantitative gate.
- name: EE-4 plan-checker (Phase 2.4 W2 D-02)
  run: |
    for phase_dir in .planning/phase-*/; do
      node scripts/run-plan-checker.mjs "$phase_dir" > "${phase_dir}plan-check.json" || {
        echo "::error::plan-check BLOCKER at $phase_dir"
        exit 1
      }
    done
```

---

## § 3 Working Proposals (D-WP-*) — Patterns Phase 2.4 May Need NEW (No Strong Analog)

### D-WP-1: `scripts/dashboard.mjs` ~611L post-absorb — split modular OR maintain single-file?

**Context**: 现 481L baseline + Phase 2.4 增量 (~130L: 50L watcher + 80L 多项目) ≈ **~611L total**。 已超 Karpathy hard limit 类比 (engine.ts ≤200L, agentDefinition.ts ≤200L);但 dashboard.mjs 历史一直 single-file (Phase 2.2 ship 0b4e76d + Phase 2.3 161621c polish 均无 split signal)。

**Options**:
- **a) Maintain single-file 611L** — 沿袭 dashboard.mjs 历史模式 (HTML SHELL inline + md() inline 全在 1 file),Karpathy "minimal viable" 倾向。 代价: 单文件 611L 接近读写阻碍。
- **b) Split modular `scripts/dashboard/{server.mjs, watcher.mjs, multi-project.mjs}`** — 拆 3 子文件 + 主 dashboard.mjs entry 50L (orchestrator 模式);Phase 2.1 6 installer split per-file 模式 sister。 代价: dashboard 历史 single-file 模式破,新结构开销。
- **c) Split partial `scripts/dashboard.mjs` (核心) + `scripts/dashboard-watcher.mjs` (新增)** — 只把新增 watcher + 多项目子模块抽出,主文件不动 (~531L 主 + ~80L 子)。 折衷 a+b。

**Recommendation**: planner 决,**默认 c** (新增隔离不破主文件 + 不超 hard limit) OR **b** (彻底 modular,与 phase 2.1 installer split 模式对齐)。

### D-WP-2: `plan-review-schema.yaml` schema location — regen JSON schema OR yaml-only?

**Context**: 现 `routing/decision_rules.yaml` v2 是 yaml-only (无 JSON schema regen);`src/manifest/schema/spec.ts` 是 TypeBox → `schemas/manifest.v1.schema.json` regen (ci.yml L120-125 schema regen drift gate)。 `plan-review-schema.yaml` 走哪条路?

**Options**:
- **a) yaml-only SSOT** — 沿袭 decision_rules.yaml 模式,无 JSON schema regen,run-plan-checker.mjs 直接 `parse yaml + runtime validate`。 代价: 无 schema fragment IDE 提示,无 ci regen drift gate。
- **b) TypeBox + regen → `schemas/plan-review.v1.schema.json`** — 沿袭 manifest schema 模式,加 `src/routing/planReviewSchema.ts` TypeBox + `corepack pnpm build:schema` 加 regen target + ci.yml schema regen gate 自动覆盖。 代价: ~50L 额外 TypeBox + build script 加 target。

**Recommendation**: **默认 a** (Karpathy YAGNI — yaml 单一 SSOT 配 D-02 Hard Constraint #5);**升级 b** 若 plan-checker schema 后续频繁演化 (Phase 2.5+) 才动。

### D-WP-3: `doctor.ts` ~150L — split `src/cli/doctor/*.ts` per-check modular OR single-file?

**Context**: 现 `doctor.ts` 152L (4 check single-file);Phase 2.4 扩 ~150L 加 5th check + `--json` flag → 总 ~180L 仍 ≤200L hard limit。 是否预先 split?

**Options**:
- **a) 维持 single-file ~180L** — Karpathy YAGNI,5 check 不复杂,hard limit ≤200L 不破。
- **b) Split `src/cli/doctor/{node-check.ts, mcp-check.ts, jq-check.ts, win-bash-check.ts, origin-check.ts}` + `doctor.ts` (50L orchestrator)** — 6 file 拆分,与 installer per-file 模式对齐。 代价: 新结构破坏单文件历史。

**Recommendation**: **默认 a** (hard limit 未破,Karpathy "Don't split until pain" — Phase 2.4 ship 后 v0.3+ weekly cron / upstream_health 加新 check 才评估 split);origin-check 抽 `src/cli/lib/origin-check.ts` 因为 sister to audit 共享 (§ 1 row 2),非 split signal。

### D-WP-4: `cc-hook-installer.ts` 文件名 vs `cc-hook-add.ts` 命名约定

**Context**: Phase 2.1 6 installer 文件名 = method name + `Installer.ts` 后缀 (`ccPluginMarketplace.ts` 无 `Installer` 后缀, `npxSkillInstaller.ts` 有 `Installer` 后缀, `mcpHttpAdd.ts` `mcpStdioAdd.ts` `npmCli.ts` 无后缀, `gitCloneWithSetup.ts` 无后缀) — **历史不一致**。 7th 走哪?

**Options**:
- **a) `ccHookInstaller.ts`** — 沿袭 `npxSkillInstaller.ts` (近 Phase 2.1 ship 同形态最近邻)
- **b) `ccHookAdd.ts`** — 沿袭 `mcpStdioAdd.ts`/`mcpHttpAdd.ts` add 命令模式 (CC hooks 走 settings.json merge,概念上接近 mcp-add)
- **c) `ccHook.ts`** — 沿袭 `npmCli.ts`/`gitCloneWithSetup.ts`/`ccPluginMarketplace.ts` 无后缀 majority 模式 (6 file 中 4 file 无后缀)

**Recommendation**: **默认 c** (majority pattern, 4/6 无后缀;dispatch table 区分明确 method key);planner 决最终命名。 同步 § 2.6 import 路径调整。

### D-WP-5: WebSocket push 实现 — `ws` npm package vs raw http upgrade

**Context**: dashboard.mjs 当前 "Zero external deps (only node built-ins)" (注释 L11) — 加 ws 破现 promise。 raw upgrade 手写 frame parse ~30L 接受度?

**Options**:
- **a) `import { WebSocketServer } from 'ws'`** — 新 dep ~5L 代码,简洁;破 "zero external deps" promise。
- **b) Raw http upgrade + frame parse 手写** — 沿袭 zero-dep promise (与现 dashboard.mjs 风格一致),~30L 手写代码 (RFC 6455 frame encode/decode)。
- **c) Server-Sent Events (SSE) 替 WebSocket** — 单向 server→client 推送,native EventSource API,zero-dep,代码 ~10L (沿袭 现 `/mtime` endpoint 模式扩展)。 SSE 完全满足 D-04 3.2 需求 (server 推 client,client 不需推 server)。

**Recommendation**: **默认 c** (SSE — zero-dep + 完美 fit 需求 + 简洁 ~10L);b 备选 (若 SSE 浏览器兼容性顾虑);a 最后选 (破 zero-dep promise 需 ADR justify)。 R2-1 fresh research 验 SSE 浏览器兼容 (Edge/Chrome/Firefox 全支持,IE 不支持但 dashboard 用户面无 IE)。

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| `src/cli/doctor.ts` 扩展 | **~85%** | 4 check 全保留 + 加 5th + status enum 升级 |
| `src/cli/lib/origin-check.ts` NEW | **~70%** | spawnSync 模式 + audit.ts regex 模板复用 |
| `routing/plan-review-schema.yaml` NEW | **~60%** | yaml 框架沿袭 decision_rules.yaml + intel 原型 |
| `scripts/run-plan-checker.mjs` NEW | **~75%** | walker + ENFORCE 模式直接 copy |
| gsd-plan-checker prompt 修改 | **~50%** | additive ~30L 量化输出节 |
| `src/installers/cc-hook-installer.ts` NEW | **~70%** | npxSkillInstaller skeleton 复刻 + L3 confirm + JSON merge |
| `src/installers/index.ts` 加 7th entry | **~95%** | additive dispatch 表 + levelOf switch case |
| `src/manifest/schema/spec.ts` + `installMethods/ccHook.ts` | **~90%** | InstallType enum 加项 + npxSkillInstaller schema 复刻 |
| `scripts/dashboard.mjs` watcher + WS push | **~65%** | watchedPaths 复用 + polling → push 改造 |
| `scripts/dashboard.mjs` 多项目 + URL route | **~60%** | route dispatch + nav HTML 扩展 |
| `.github/workflows/ci.yml` README counter | **~90%** | bash exit-1 模式直接 analog |
| `.github/workflows/ci.yml` ralph-loop Win + audit | **~85%** | Win-only `if: runner.os == 'Windows'` 直接 analog |

**总 reuse %**: **~76%** (12 target average,加权 7 NEW + 5 MODIFIED;略低于 Phase 2.3 ~86% — 因 dashboard C 路径 3.2/3.3 为重大功能扩展非纯复刻,plan-review-schema.yaml + run-plan-checker.mjs 为新 SSOT 路径)。

**对比 Phase 2.3**: 86% (extension category MVP 多为 manifest 模板复刻);Phase 2.4 ~76% 反映末 phase 复杂度 (dashboard 重构 + 新 ADR 类型 + 新 SSOT yaml)。 仍属高 reuse,因 6 installer + check-transparency-verdicts walker 模板成熟。

---

## § 5 Path Dependency (Wave A Fresh Research 必须覆盖)

R2 RESEARCH 必须覆盖 3 项 (D-01~D-04 主决议已锁,R2 聚焦 D-WP-5 + 实测调用):

1. **D-WP-5 WebSocket 实现 a/b/c 决** (§ 3 above) — R2-1 fresh research 验 SSE 浏览器兼容 + 推荐 c (默认) OR b (备选);影响 dashboard.mjs ~50L 实现 + zero-dep promise 维持。 KICKOFF § 4 R2-1 wave 拓扑细化 sister 议题。

2. **EE-4 plan-review-schema 量化阈值实测候选** (KICKOFF § 4 R2-2) — 跑 1-2 现存 plan (如 `phase-2.3/task_plan.md`) 出 baseline 分布;若现存 plan 普遍 ≤2/4 → 阈值过严需放宽。 影响 § 2.3 yaml `thresholds.{file_references_verified, reference_sources_real, concrete_acceptance}` 数值 calibrate。

3. **ralph-loop Win 兼容验收 sentinel scope** (KICKOFF § 4 R2-3) — Phase 2.2 已部分覆盖;Phase 2.4 完整 sentinel scope = MIN 1 spawn vs 完整 30 sample? 推 MIN 5 fixture sample (CONTEXT.md `Claude's Discretion` 已倾向)。 影响 § 2.11 `test:e2e:ralph-loop:win-sentinel` 实现 + ci.yml step。

**额外 R1 PATTERNS 输出 (本文档已覆盖)**:
- `cc-hook-installer.ts` 文件名 D-WP-4 → planner 决 (推 c — `ccHook.ts`)
- `dashboard.mjs` modular split D-WP-1 → planner 决 (推 c — 部分 split)
- `plan-review-schema.yaml` schema regen D-WP-2 → planner 决 (推 a — yaml-only)
- `doctor.ts` split D-WP-3 → planner 决 (推 a — single-file ≤200L)
- `cc-hook` installer hook target path 跨平台 (~/.claude/settings.json vs ~/.config/claude/settings.json) — R1 推 `~/.claude/settings.json` 沿袭现 dashboard.mjs L17-22 注释 wiring 示例,跨平台 `homedir()/.claude/` (npxSkillInstaller L133 同模式)

**Wave A R1+R2 并行可行性**: ✅ R1 (本文档) 与 R2 (3 项 fresh research) 完全独立 — R1 mapping analog reuse %,R2 实测 baseline + 浏览器兼容 + sentinel scope。 Wave B planner 同时消费 R1+R2 输出生成 PLAN.md。

---

**phase 2.4 PATTERNS.md complete** — Wave B (ASSUMPTIONS + PLAN + task_plan) 启动准备;Wave A R2 RESEARCH 并行进行中。
