# Phase 1.2 Pattern Mapping

> 用途：把 phase 1.2 即将创建的 13+ 新文件 1:1 映射到现有 `src/manifest/*` 已实装 pattern，
> 让 plan-phase 拆 task 时能直接说"T-X 写 src/installers/lib/spawn.ts，模仿 src/manifest/security.ts (pre-pass + path walking + 不抛异常返回 collected errors)"。

## 元数据

- 分析日期: 2026-05-12
- 分析者: gsd-pattern-mapper（Opus 4.7，read-only）
- 输入实证文件:
  - `src/manifest/{validate,security,errors}.ts` — pattern 来源主体
  - `src/manifest/schema/{index,types,spec,metadata}.ts` + `schema/installMethods/*.ts`（6 个）
  - `src/schemas/index.ts` — 公共 re-export 风格
  - `src/{index,cli}.ts` — 当前 entry 仅占位
  - `src/{installers,cli,doctor,checkpoint,routing-engine}/` — 全部空目录
  - `tests/unit/manifest-validate.{fixtures,security,errors,line-mapping}.test.ts`
  - `tests/integration/manifest-validate.perf.test.ts`
  - `tests/fixtures/manifests/valid/*.yaml`（10 个 fixture 自动 glob）
- 决策上游:
  - ADR 0004 6 硬契约
  - GRAY-AREA-2 advisor 推荐 A3 plain function + helper（vite/astro 同栈）+ picocolors + jsdiff + @clack/prompts
  - ASSUMPTIONS.md A3 / B1 / B6（推迟 cc-plugin-marketplace 到 phase 2.1，phase 1.2 实装范围 = npm-cli + mcp-stdio-add 两 method）

---

## 一、现有 patterns 归纳（src/ 实装调研）

### Pattern A: TypeBox schema definition（Type.Object + additionalProperties: false + Type.Union literal）

- **代表文件**: `src/manifest/schema/installMethods/npmCli.ts`（17 行）/ `mcpStdioAdd.ts`（19 行）/ `metadata.ts`（38 行）
- **特征**:
  - `Type.Object({...}, { additionalProperties: false })` 是默认结尾参数
  - Discriminator 字段用 `Type.Literal('npm-cli')` 而非 enum
  - Optional 字段用 `Type.Optional(Type.String())` 包裹
  - 单文件单导出（`export const NpmCli = ...`），无逻辑代码
- **规模**: 15-40 行/文件
- **Phase 1.2 适用**: phase 1.2 不写新 schema（matrix 已 frozen），但 InstallContext / InstallResult 类型可借用 TypeBox `Static<typeof S>` 风格（见 Pattern B）

### Pattern B: Module-level singleton + lazy compile（Ajv 编译昂贵的资源）

- **代表文件**: `src/manifest/validate.ts` L24-L42
- **特征**:
  - 模块顶层 `const ajv = addFormats(new Ajv({...}))` 一次创建实例
  - `let _compiled: ... | null = null` 模块级 mutable cache
  - `function getValidator() { if (!_compiled) { _compiled = ajv.compile(...) }; return _compiled }`
  - 第一次 validate 调用时 lazy compile（避免 cold start 影响 import 时间）
- **规模**: ~20 行（含 cache + getter）
- **Phase 1.2 适用**:
  - **直接复用** `getValidator()` —— installer preflight 阶段调 `validateManifestFile()` 复用 phase 1.1 已编译的 Ajv 单例，零重复成本
  - **同形复制**: `src/installers/lib/spawn.ts` 若需要缓存"用户系统 PATH 中的 npm/claude binary 路径"可用同 lazy + module-level 模式
  - `src/installers/lib/diff.ts` 若 jsdiff 需要预热（Node 22 V8 inline cache），同模式

### Pattern C: Discriminated `Result` 而非 throw（ok/errors 二选一返回）

- **代表文件**: `src/manifest/validate.ts` L46-L48 + L50-L80
- **特征**:
  ```ts
  export type ValidateResult =
    | { ok: true; manifest: Manifest }
    | { ok: false; errors: ValidationError[] }
  export function validateManifestFile(...): ValidateResult { ... }
  ```
  - 失败路径**收集所有错误**返回（`allErrors: true` Ajv flag + security gate 不 short-circuit），不 short-circuit
  - **不抛异常**（unhandled error 是真 bug，validation 失败是正常业务路径）
  - 调用方 `if (!result.ok)` narrow 到 errors 分支
- **规模**: type 定义 ~3 行，function 体 ~30 行
- **Phase 1.2 适用**: **几乎所有 installer surface 必须复刻**
  - `src/installers/lib/types.ts` 定义：
    ```ts
    export type InstallResult =
      | { ok: true; backupId: string; appliedFiles: string[] }
      | { ok: false; phase: 'preflight' | 'dry-run' | 'confirm' | 'spawn' | 'verify'; error: ValidationError }
      | { aborted: true; reason: 'user-cancel' | 'level-flag-missing' }
    ```
  - `src/installers/{npmCli,mcpStdioAdd}.ts` 返回 InstallResult，**不抛**（contract 6 "no silent failure" 要求显式 status）
  - `src/cli/install.ts` 对 InstallResult 做 narrow + 退出码映射

### Pattern D: Pre-pass before main validation（security gate 风格）

- **代表文件**: `src/manifest/security.ts` 完整文件 + `src/manifest/validate.ts` L61-L67 调用点
- **特征**:
  - 主 validation pipeline 之前插入一个**专用早期检查**
  - Pre-pass 文件顶部 ~25 行注释明确说明"为什么不能合到主 pipeline"（B1 hotfix：让用户先看到安全错误，不是结构错误）
  - 走**显式 path 列表**而非通用 AST 递归（surgical：`['spec', 'install', 'cmd']` 等四个硬编码路径）
  - 用 `doc.getIn(path, true)` 拿 yaml 节点 + `LineCounter` 反查 line 号
  - 收集 errors 数组返回（不 short-circuit），caller 根据 length > 0 决定是否进下一步
- **规模**: ~145 行（含详细注释）
- **Phase 1.2 适用**:
  - **`src/installers/lib/preflight.ts`** 完全复刻该结构 —— 顶部注释说明"为什么 preflight 不合到 spawn"（让用户先看到 platform 不支持 / git_ref invalid，不是 spawn 报错）
  - **`src/installers/lib/spawn.ts`** 在 child_process.exec 前必须**第二次调** `checkSecurityViolations`（installer 收到的 manifest 可能跳过了 schema 校验，如 phase 1.4 routing 直接传字符串），defense-in-depth
  - **path 硬编码**风格沿用：preflight 检查的是固定字段集（platform / npm_version / idempotent_check 等），不做通用 AST 遍历

### Pattern E: Friendly error mapping（统一 ValidationError 形状）

- **代表文件**: `src/manifest/errors.ts` L9-L16 type + L67-L104 mapper
- **特征**:
  ```ts
  export interface ValidationError {
    file: string; path: string; message: string;
    line: number | null; column: number | null;
    keyword: string  // 'required' | 'additionalProperties' | 'security' | 'yaml-parse' | ...
  }
  ```
  - 所有错误源（Ajv / yaml parse / security gate）**先归一到这一个形状**再返回
  - `keyword` 字段是错误"类别 tag"，调用方据此分流
  - line/col 是 nullable —— 没有源位置信息时 null（required-missing 字段无 yaml 节点）
- **规模**: type 定义 ~8 行，mapper 函数 ~50 行
- **Phase 1.2 适用**: **复用**（不新建 InstallError 类型）
  - 扩展 `keyword` 取值集合：phase 1.2 加 `'preflight' | 'spawn' | 'rollback' | 'mcp-cli' | 'platform-mismatch' | 'idempotent-check-failed'`
  - `path` 字段在 installer context 改为指向"修改的目标文件"如 `~/.claude.json` 而非 manifest JSON pointer
  - 新加可选字段（向后兼容）`suggest?: string`（"executable fix command"，ADR 0004 契约 6 要求） + `installer?: 'npm-cli' | 'mcp-stdio-add' | ...`
  - 这层扩展放 `src/installers/lib/types.ts` 通过 `interface InstallError extends ValidationError`，避免污染 manifest layer

### Pattern F: Re-export Static<typeof S> 让外部用类型（schema 是 SSOT）

- **代表文件**: `src/manifest/schema/types.ts`（11 行）
- **特征**:
  ```ts
  import type { Static } from '@sinclair/typebox'
  import type { ManifestBase } from './index.js'
  export type { Static }
  export type Manifest = Static<typeof ManifestBase>
  ```
  - schema 是 SSOT，types 只是从 schema 派生
  - 外部 import `Manifest` 而非自己写 interface
- **Phase 1.2 适用**:
  - `src/installers/lib/types.ts` **不写 schema**（installer 内部类型不需要 runtime 校验），但同样**集中 type 导出** + **从 manifest types re-export `Manifest`** 让 installer files 一处 import
  - `src/cli/*.ts` 从 `src/installers/lib/types.ts` import 所有 install 相关类型，避免散乱

### Pattern G: Public re-export（barrel index）

- **代表文件**: `src/schemas/index.ts`（7 行）+ `src/manifest/schema/index.ts` L68-L74 展开运算符
- **特征**:
  - 顶层 barrel 文件 `index.ts` 做 named re-export
  - 注释说明"为什么导出"（`harnessed/schemas` package.json exports field 的 entry point）
  - 含 `SCHEMA_VERSION` 等同源常量
- **Phase 1.2 适用**:
  - `src/installers/index.ts` —— GRAY-AREA-2 已给出骨架（dispatch table + `runInstall` orchestrator）
  - `src/cli/index.ts` —— 6 子命令的 commander 注册中心（被 `src/cli.ts` 顶层 import）

### Pattern H: 跨进程依赖的 IMPL NOTE 注释（Rule 1 / F8 风格）

- **代表文件**: `src/manifest/validate.ts` L7-L12 + `src/manifest/schema/installMethods/index.ts` L5-L10
- **特征**: 任何"看似多余但实际为绕一个外部 lib bug / interop 坑"的代码，必须在文件顶部用 `// IMPL NOTE (Rule 1 / FN):` 标记，引用 phase-1.1 progress.md 的 finding 编号
- **Phase 1.2 适用**: **强制沿用**
  - `src/installers/lib/spawn.ts` Win cmd.exe vs sh 包装 → IMPL NOTE 引用 R03 § 3.7
  - `src/installers/lib/diff.ts` `stripTrailingCr: true` → IMPL NOTE 引用 ASSUMPTIONS.md C3
  - `src/installers/mcpStdioAdd.ts` 强制 `--scope project` → IMPL NOTE 引用 R03 § 3.3 红旗 1（CC issue #54803）
  - `src/cli/install.ts` picocolors `isColorSupported` 守 isTTY-undefined-on-git-bash → IMPL NOTE 引用 GRAY-AREA-2 § B.1 跨 OS 红旗 1（nodejs/node#39673）

### Pattern I: 测试 fixture 自动 glob + 每文件单独 it()（fixture-driven）

- **代表文件**: `tests/unit/manifest-validate.fixtures.test.ts` L9-L16 + L19-L33
- **特征**:
  - `readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.yaml'))` 自动收集所有 fixture
  - `for (const file of yamlFiles)` 每文件生成独立 `it(...)`，单 fixture 失败不淹其他
  - 注释明确"adding upstream = drop yaml here，no test boilerplate" —— karpathy simplicity
  - 失败时 `console.error(file, errors)` 让 CI log 显示**哪个** fixture 哪个**字段**坏
- **Phase 1.2 适用**:
  - `tests/integration/installer-contract.test.ts` —— ADR 0004 6 contract × 2 method (npm-cli + mcp-stdio-add) = **12 cell** matrix（不是 36，phase 1.2 只装 2 method）
  - 用类似的 nested loop：`for (const method of [...]) for (const contract of [...]) it(\`\${method} satisfies contract \${contract}\`, ...)`
  - **每个 contract 是 fixture-driven**：drop manifest fixture in `tests/fixtures/installers/<method>/<contract>.yaml` → contract test auto-registers
- **规模**: ~30-50 行测试主体（不含 fixtures）

### Pattern J: 共享 BASE template + with*() 修改器（negative-case 测试）

- **代表文件**: `tests/unit/manifest-validate.security.test.ts` L24-L75 + `manifest-validate.errors.test.ts` L5-L50
- **特征**:
  - 文件顶部一份**最小有效 manifest** 字符串常量 `BASE`
  - `withInstallCmd(cmd)` / `withVerifyCmd(...)` / `withCleanupPath(...)` 等 helper 用 `BASE.replace(...)` 生成 mutated yaml
  - 每 it() 只改一个字段，失败定位精准
  - assertion 走 helper `expectError(yaml, predicate, label)`（errors.test.ts L40-L50）
- **Phase 1.2 适用**:
  - `tests/unit/installers-npmCli.test.ts` 用 BASE manifest（cli-npm × npm-cli）+ `withGlobalFlag()` / `withNpxFallback()` / `withFailingIdempotentCheck()` 等 modifier
  - `tests/unit/installers-lib-confirm.test.ts` 用 mocked Clack `confirm()` + level fixture（L1/L2/L3/L4）共享 base prompt context

### Pattern K: Performance threshold gate（`it()` 而非 bench）

- **代表文件**: `tests/integration/manifest-validate.perf.test.ts` 全文 65 行
- **特征**:
  - 用 regular `it()` + `performance.now()` 不依赖 vitest bench
  - 平台感知阈值（CI win 100ms / 其余 50ms） + best-of-N 减少 GC 抖动
  - 注释引用 finding 编号（F18）+ 说明为什么 GITHUB_ACTIONS 而非通用 CI env
- **Phase 1.2 适用（可选 / phase 2.4 再加）**:
  - 若 phase 1.2 想加 installer perf gate（dry-run 应 < 500ms 单 manifest），同模式
  - **建议 phase 1.2 不加**（karpathy YAGNI；installer 性能尚未成为 phase 1.2 acceptance bar）

---

## 二、Phase 1.2 新文件 → 现有 pattern 映射

### Lib helpers（共享基础，6 个）

| 新文件 | 最近 analog | 复用 pattern | 调整建议 |
|--------|-----------|-----------|---------|
| `src/installers/lib/types.ts` | `src/manifest/schema/types.ts` + `src/manifest/errors.ts` | F (re-export) + C (Result discriminator) + E (extend ValidationError) | re-export Manifest + 定义 InstallContext / InstallResult / InstallError extends ValidationError + Level 字面 union ('L1'\|'L2'\|'L3'\|'L4') |
| `src/installers/lib/preflight.ts` | `src/manifest/security.ts` | D (pre-pass) + C (return errors[]) + H (IMPL NOTE) | 检查清单：(a) `manifest.spec.platforms` 包含当前 process.platform（ASSUMPTIONS A6）；(b) git_ref valid 时 git ls-remote 探测；(c) idempotent_check cmd shape 校验；不递归 AST，硬编码 path |
| `src/installers/lib/diff.ts` | `src/manifest/errors.ts` (utility 函数风格) | B (lazy module-level) + H (IMPL NOTE for stripTrailingCr CRLF C3) | 单一导出 `renderDiff(plan: DiffPlan): string`；内部 jsdiff `createPatch(...)` 包裹；按行 split 后 picocolors 染色；> 200 行折叠（ADR 0004 § 2）；isTTY 检测交给 picocolors `isColorSupported`（不要自己 isTTY） |
| `src/installers/lib/confirm.ts` | `src/manifest/security.ts` (path-列举风格) | C (Result discriminator) + H (IMPL NOTE) | `confirmAt(level: Level, ctx): Promise<{ proceed: true } \| { proceed: false; reason: 'user-cancel' \| 'flag-missing' }>`；L1 用 `note()`，L2/L3 用 `confirm()`，L4 检查 ctx.opts.system flag；**所有 await 后 isCancel(ans) 守卫**（GRAY-AREA-2 § B.3 真实风险） |
| `src/installers/lib/backup.ts` | `src/manifest/validate.ts` (orchestrator 风格 — multi-step + 早返回) | B (lazy timestamp dir creation) + C (Result) + H (IMPL NOTE for CRLF C3) | `backup(plan): Promise<{ ok: true; backupId: string } \| { ok: false; error: InstallError }>`；ISO-timestamp dir + metadata.json 含 sha1 + **per-file eol: 'lf'\|'crlf' 字段**（ASSUMPTIONS C3 mitigation） |
| `src/installers/lib/spawn.ts` | `src/manifest/security.ts` (D pre-pass) + `src/manifest/validate.ts` (orchestrator) | D (再 call security.ts before exec — defense-in-depth) + C (Result) + H | exec 前**重跑 `checkSecurityViolations`** + Win `cmd.exe /c` vs Unix `/bin/sh -c` 分支（IMPL NOTE: R03 § 3.7）+ timeout/env/cwd 转发 + 把 child stderr/stdout 收集到 InstallResult |

### Installer methods（phase 1.2 实装 2 个 — 推迟 cc-plugin-marketplace 到 phase 2.1，per ASSUMPTIONS B6）

| 新文件 | 最近 analog | 复用 pattern | 调整建议 |
|--------|-----------|-----------|---------|
| `src/installers/npmCli.ts` | `src/manifest/schema/installMethods/npmCli.ts`（同名 schema 文件，~17 行）+ `src/manifest/validate.ts`（orchestrator） | C (Result) + 调用 lib/* helpers 一行一句 | 30-50 行 plain async function（GRAY-AREA-2 骨架 L100-L116）；声明 Level: L4 if global / L1 if npx fallback（ASSUMPTIONS B3 候选 1：拒 L4 → 自动 L1 npx + 显式告知）；调 `preflight → planDryRun → renderDiff → confirmAt → backup → spawnCmd → verify` |
| `src/installers/mcpStdioAdd.ts` | `src/manifest/schema/installMethods/mcpStdioAdd.ts` + `npmCli.ts`（同 lib 调用顺序） | C + H (IMPL NOTE: 强制 `--scope project` per CC #54803 — ADR 0004 契约 5) | 30-50 行；声明 Level: L3；**不调通用 spawn.ts 路径**，直接 spawn `claude mcp add --scope project --transport stdio NAME -- npx --yes ...`（ADR 0004 § 5 + GRAY-AREA-2 议题 A 表格 d 列）；idempotent_check 走 `claude mcp list \| grep -q NAME` 而非 JSON parse（ASSUMPTIONS C2 mitigation） |
| `src/installers/index.ts` | `src/schemas/index.ts`（7 行 barrel）+ `src/manifest/schema/installMethods/index.ts`（discriminator dispatcher） | G (barrel) + GRAY-AREA-2 骨架 L78-L98 | dispatch table `Record<Method, Installer>` 仅含 2 entry（其余 4 method `() => { throw new Error('phase 2.1') }` placeholder 或干脆不挂载，phase 2.1 加 entry）+ `runInstall(manifest, opts)` orchestrator |

### CLI commands（5 个）

| 新文件 | 最近 analog | 复用 pattern | 调整建议 |
|--------|-----------|-----------|---------|
| `src/cli/install.ts` | `src/cli.ts`（commander entry，10 行占位） | C (call runInstall + narrow result + exit code) + H (commander flag IMPL NOTE re ADR 0004 双 flag --non-interactive --apply) | commander subcommand 注册 + flags `--apply` `--dry-run` `--system` `--non-interactive` `--full-diff` `--no-color`；narrow InstallResult → exit code（ok=0 / aborted=2 / error=1） |
| `src/cli/doctor.ts` | `src/manifest/validate.ts`（orchestrator 风格） | C + I (fixture-driven check list 自动 glob) + H | 检查清单 4 项（ASSUMPTIONS B4 候选 1）：Node ≥ 22、MCP --scope project 探测（解析 .mcp.json）、jq 存在、Win bash 路径（Git Bash vs WSL detect — ASSUMPTIONS C4 mitigation 用 `WSL_DISTRO_NAME` 探测）；每项独立 `CheckResult`，最后 aggregate report |
| `src/cli/audit.ts` | `src/manifest/validate.ts`（orchestrator）+ `src/manifest/security.ts`（path 列举风格） | C + I (auto-glob manifests/tools/*.yaml) | 9 上游（phase 1.2 ship 时 = 10 — 已含 ctx7/tavily/exa/ralph-loop/superpowers/gsd/gstack/karpathy-skills/mattpocock-skills/planning-with-files）；遍历 manifests/tools/*.yaml → parse → spawn `git remote get-url origin` 在已 install 副本 → 比对 `metadata.upstream.repository` |
| `src/cli/rollback.ts` | `src/manifest/validate.ts`（orchestrator）| C + B (lazy load metadata.json + sha1) + H (CRLF preservation IMPL NOTE C3) | 读 `.harnessed-backup/<ts>/metadata.json` → 反向遍历 files[] → 还原（注意 eol 字段保持原 CRLF/LF — ASSUMPTIONS C3） |
| `src/cli/status.ts` | `src/manifest/validate.ts`（orchestrator）| C + I (auto-glob `.harnessed/state.json`) | 读 `.harnessed/state.json` → 显示已装清单 + 版本 + 最后 install 时间；ADR 0004 契约 6 要求显示 partial-install 状态 |

### Tests（unit + integration）

| 新文件 | 最近 analog | 复用 pattern | 调整建议 |
|--------|-----------|-----------|---------|
| `tests/integration/installer-contract.test.ts` | `tests/unit/manifest-validate.fixtures.test.ts`（自动 glob）+ `tests/unit/manifest-validate.security.test.ts`（BASE + with* 修改器）| I + J | nested loop 6 contract × 2 method = 12 cell；fixtures dir `tests/fixtures/installers/<method>/<contract>.yaml`；用 `vi.mock('child_process')` 隔离真实 spawn（C6 mitigation）+ 一个 final `it.skipIf(!CI) — real-spawn` 仅 phase 1.2 final acceptance run |
| `tests/unit/installers-lib-{preflight,diff,confirm,backup,spawn}.test.ts` | `tests/unit/manifest-validate.security.test.ts`（BASE + 修改器）| J | 每 lib 一文件，BASE InstallContext + with* 修改器；mock @clack/prompts (`vi.mock('@clack/prompts')`) for confirm.ts；mock fs for backup.ts |
| `tests/unit/installers-{npmCli,mcpStdioAdd}.test.ts` | `tests/unit/manifest-validate.fixtures.test.ts` + J | I + J + C (assert InstallResult shape) | BASE manifest（cli-npm × npm-cli / mcp-npm × mcp-stdio-add）+ vi.mock spawn → assert InstallResult shape |

---

## 三、不复用已有 pattern 的部分（必须新建）

1. **CLI dry-run UX layer** —— `src/manifest/*` 是纯 library，无 user-facing 输出（除 console.error in fixtures.test.ts）。phase 1.2 是项目首次写 user-facing CLI 输出（ADR 0004 契约 1+2）。**新建参考栈**：picocolors `isColorSupported` + jsdiff `createPatch({ stripTrailingCr: true })` + @clack/prompts `note/confirm/spinner/group/isCancel`（GRAY-AREA-2 § B.1-B.3 已锁定）。**没有现有 analog**。
2. **Backup 文件操作 + sha1 校验** —— `src/manifest/*` 不写文件（schema 只读 yaml）。phase 1.2 第一次需要 `node:fs/promises` 写 + `node:crypto` sha1（ADR 0004 § 3 metadata schema）。**没有现有 analog**。
3. **跨进程 spawn + 跨 OS shell wrapping** —— 同上，phase 1.2 第一次 spawn 子进程（`node:child_process` `exec` 或更安全的 `execFile`）。Windows 的 `cmd.exe /c` vs Unix `/bin/sh -c` 包装（GRAY-AREA-2 跨 OS 红旗 3）**没有 analog**，但可参考 manifest cmd 字段已被 B1 security gate 守过，spawn 层只需要再核一次 + 路径分隔。
4. **MCP CLI 输出 grep 解析** —— `claude mcp list` 输出格式不稳定（ASSUMPTIONS C2），policy = "仅依赖 exit code 不解析 stdout"。**约束新建**于 `src/installers/mcpStdioAdd.ts`。
5. **`.harnessed/state.json` 读写**（status / rollback / audit 共享） —— 单源 schema 建议写在 `src/installers/lib/state.ts`（**新加 lib helper**，原 6 个 helper 之外）；类型定义放 `src/installers/lib/types.ts`，沿用 Pattern A TypeBox 风格 + Pattern B singleton（如果 schema 很简单可直接 plain interface 不走 TypeBox）。

---

## 四、对 plan-phase 的具体输入

### 4.1 Task 命名建议（与 GA-2 advisor 提议对齐 + 调整为 phase 1.2 范围 = 2 method）

> **重要**：以下编号沿用 GA-2 § "Task 拆分建议" 的 T-2.X 命名（保持 advisor 文档可追溯），plan-phase 实际 task ID 用 GSD 标准 T-1.2.X 即可。

| Plan-phase Task ID | GA-2 ID | 内容 | 关联 pattern | 行数预估 |
|--------------------|---------|------|-------------|----------|
| **T-1.2.1** | T-2.1 | 写 `src/installers/lib/types.ts` — InstallContext / InstallResult / InstallError extends ValidationError / Level | A (TypeBox) + C + E + F | ~50 |
| **T-1.2.2** | T-2.6 | 写 `src/installers/lib/spawn.ts` — Win cmd.exe vs sh + B1 二次 security check + timeout | D + C + H | ~90 |
| **T-1.2.3** | T-2.2 | 写 `src/installers/lib/preflight.ts` — platform / npm_version / git_ref check | D + C | ~80 |
| **T-1.2.4** | T-2.3 | 写 `src/installers/lib/diff.ts` — jsdiff `createPatch` + picocolors + 200L 折叠 | B + H | ~60 |
| **T-1.2.5** | T-2.4 | 写 `src/installers/lib/confirm.ts` — Clack 4-level + isCancel 守卫 | C + H | ~70 |
| **T-1.2.6** | T-2.5 | 写 `src/installers/lib/backup.ts` — ISO-ts dir + metadata.json + sha1 + eol 字段 | C + B + H (CRLF) | ~120 |
| **T-1.2.7** | (新) | 写 `src/installers/lib/state.ts` — `.harnessed/state.json` schema + 读写 | A (lite) + C | ~50 |
| **T-1.2.8** | T-2.7a | 写 `src/installers/npmCli.ts` — L4/L1 fallback 路径 | C + 调用 lib/* | ~50 |
| **T-1.2.9** | T-2.7b | 写 `src/installers/mcpStdioAdd.ts` — L3 + 强制 --scope project + claude mcp list grep idempotent | C + H + 跳通用 spawn | ~50 |
| **T-1.2.10** | T-2.8 | 写 `src/installers/index.ts` — 2-method dispatch + runInstall orchestrator | G | ~40 |
| **T-1.2.11** | T-2.9 | 改 `src/cli.ts` + 写 `src/cli/install.ts` — commander subcommand + 5 flag | C (narrow Result → exit code) + H | ~80 |
| **T-1.2.12** | (新) | 写 `src/cli/doctor.ts` — 4 项最小 check（Node / MCP scope / jq / Win bash） | C + I | ~80 |
| **T-1.2.13** | (新) | 写 `src/cli/audit.ts` — 10 上游 git origin URL 比对 | C + I (auto-glob) | ~60 |
| **T-1.2.14** | T-2.12 | 写 `src/cli/rollback.ts` + `src/cli/status.ts` + `src/cli/backup-list.ts`（gc --older-than 30d 推 phase 2.4） | C + B + H (eol) | ~100 |
| **T-1.2.15** | T-2.10 | 写 `tests/integration/installer-contract.test.ts` — 6 contract × 2 method = 12 cell | I + J | ~250 |
| **T-1.2.16** | T-2.11 | 写 `tests/unit/installers-*.test.ts` — 8-10 个 unit test 文件 | J | ~400 |
| **T-1.2.17** | T-2.13 | 写 `docs/INSTALLER-CONTRACT.md` 用户视角 + FAQ | — | ~150 |

预估 production TS：~870 行；测试：~650 行；docs：~150 行。**phase 1.1 实测 phase 1.2 总规模约 1700 lines**，与 GA-2 估 1080 行 production 一致（含 doctor/audit/state.ts/rollback 这 4 个 phase 1.1 advisor 未细化但 ROADMAP 必含的 surface）。

### 4.2 File 创建顺序（依赖拓扑）

1. **L0 类型基座**: `src/installers/lib/types.ts` (T-1.2.1)
2. **L1 纯函数 helpers** (并行): `lib/spawn.ts` (T-1.2.2) → `lib/preflight.ts` (T-1.2.3) → `lib/diff.ts` (T-1.2.4) → `lib/confirm.ts` (T-1.2.5) → `lib/backup.ts` (T-1.2.6) → `lib/state.ts` (T-1.2.7)
3. **L2 method 实装** (并行): `installers/npmCli.ts` (T-1.2.8) + `installers/mcpStdioAdd.ts` (T-1.2.9)
4. **L3 dispatcher**: `installers/index.ts` (T-1.2.10)
5. **L4 CLI subcommands** (并行): `cli/install.ts` (T-1.2.11) + `cli/doctor.ts` (T-1.2.12) + `cli/audit.ts` (T-1.2.13) + `cli/rollback.ts/status.ts/backup-list.ts` (T-1.2.14)
6. **L5 顶层 wire**: 改 `src/cli.ts` 把 `cli/*` 子命令挂载到 commander root
7. **L6 tests**（边写边测优先 — TDD optional per CLAUDE.md 心法；安全 / spawn 强制 TDD；UI prompt 可后置）: T-1.2.15 + T-1.2.16
8. **L7 docs**: T-1.2.17

**关键 wave 切割建议**: T-1.2.1 → T-1.2.2 (B1 集成) 串行（spawn 是 hot path，先固化）；其后 lib helpers (T-1.2.3 ~ T-1.2.7) 5 个可并行 5 wave；method 文件 (T-1.2.8 + T-1.2.9) 并行；CLI 4 个文件并行。

### 4.3 关键 reuse 决策（plan-phase 第 1 天必锁）

- **D-1: 复用 ValidationError 类型 + 扩展 keyword 取值集合**（不新建 InstallError 类）
  - 理由：installer 错误最终也走"path / message / line / column"四元组；新增 `installer?: Method` 和 `suggest?: string` 选填字段就够（TypeScript 结构性兼容，不破坏 phase 1.1 callsites）
  - 反对方案（拒绝）：新建 InstallError class + extends Error → 抛异常风格；与 Pattern C ok/errors discriminator 冲突
- **D-2: 不复用 yaml CST line mapping**（installer 不需要源位置）
  - 理由：installer 操作的是用户系统状态文件（~/.claude.json / .mcp.json），不是 yaml manifest；preflight 失败时 path 字段填 manifest JSON pointer 即可（反查 manifest 仍可调用 phase 1.1 line mapping）
- **D-3: 复用 Ajv module-level singleton + 同模式新加 spawn cache**
  - phase 1.2 不重新初始化 Ajv（直接 import validateManifestFile from '../manifest/validate.js'）
  - `src/installers/lib/spawn.ts` 用同 lazy 模式缓存"用户机器上 npm/claude binary 解析后的绝对路径"（避免每个 install call 都 which 一遍）
- **D-4: 不复用 TypeBox + Ajv 给 installer 内部类型** — installer 内部类型纯 TS interface 即可（无 runtime 校验需求；karpathy YAGNI）
  - 例外：`.harnessed/state.json` 落盘时若想做 schema 校验，可走 TypeBox + Ajv 同 phase 1.1 风格 —— 但 phase 1.2 建议先用 plain interface + JSON.parse + try/catch（YAGNI；phase 2.1 加更多 method 再视情况升级）
- **D-5: 复用 fixture-driven 测试模式 + BASE template + with* modifier**（pattern I + J 全套）
  - 12-cell contract test 用嵌套 for-loop 自动展开
  - 每 lib unit test 用一份 BASE InstallContext + 5-10 个 modifier helper
- **D-6: 复用 H 风格 IMPL NOTE 注释（4 处必有）**
  - `lib/spawn.ts` Win cmd.exe wrapping（R03 § 3.7）
  - `lib/diff.ts` stripTrailingCr CRLF（C3）
  - `installers/mcpStdioAdd.ts` --scope project（CC issue #54803）
  - `cli/install.ts` picocolors isColorSupported 优于 process.stdout.isTTY（nodejs/node#39673）

### 4.4 Phase 1.2 不做的部分（避免 scope creep — ASSUMPTIONS § "Out of Phase 1.2 scope" 已列）

- 4 个剩余 install method (cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / mcp-http-add) → phase 2.1
- karpathy CLAUDE.md merge 引擎 → phase 2.2（B5 候选 2）
- 6 月 stale 检测 + weekly cron + GitHub API token → phase 2.4（B4 候选 1）
- 完整 .harnessed/{audit.log, current-workflow.json, checkpoints/} → phase 1.4 / 3.1（B7 候选 1：仅落 backup/ + state.json）
- DAG resolver / harnessed-router / research workflow → phase 1.3 / 1.4

---

## 五、对 plan-phase 的非 task 输入

- **Acceptance bar pattern**：phase 1.1 用 A1-A8 8 项硬指标（progress.md § A）+ VERIFICATION.md 复现指南。phase 1.2 沿用结构，建议 7 项（ASSUMPTIONS § "Phase 1.2 验收标准 hard bar" 已列）。
- **Cross-OS CI 已就绪**：扩展 ci.yml 加 installer integration test job（不新建 workflow — ASSUMPTIONS A5）。
- **A7 守恒 step** 沿用：phase 1.2 任何 schema 字段缺口 → ADR 0005+ errata，不动 ADR 0001 main body（ASSUMPTIONS A8）。
- **finding 编号续接**：phase 1.1 结束在 F22；phase 1.2 从 F23 开始。
- **新风险（C2 / C3 / C6）必须在第 1 天 task 设计时纳入** —— 不是事后补救：
  - C2（claude mcp 输出格式）→ T-1.2.9 mcpStdioAdd.ts 设计为 exit-code only + idempotent 用 grep -q
  - C3（CRLF/LF）→ T-1.2.6 backup.ts metadata.json 加 eol 字段 + T-1.2.4 diff.ts stripTrailingCr=true
  - C6（test isolation）→ T-1.2.15 contract test 用 vi.mock('child_process') + 单独 final acceptance run 用真 spawn + tmpdir
