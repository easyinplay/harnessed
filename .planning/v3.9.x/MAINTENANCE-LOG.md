# v3.9.x 维护系列 — MAINTENANCE LOG

> Post-v3.0 maintenance series: dogfood 驱动的 bug 修复 + Windows 兼容 + 代码简化。
> 系列范围: v3.9.7 → v3.9.26 (20 releases, 2026-05-24 → 2026-05-30)
> Sister docs: [STATE.md](../STATE.md) · [RETROSPECTIVE.md](../RETROSPECTIVE.md) · [PLAN-interactive-clarification.md](./PLAN-interactive-clarification.md)

---

## 系列概览

| 版本 | 日期 | 提交 | 主题 |
|------|------|------|------|
| v3.9.7 | 2026-05-24 | - | setup 流程修正 (Step B 顺序) |
| v3.9.8 | 2026-05-24 | - | Windows tilde expansion + 4 Cat audit 修复 |
| v3.9.9 | 2026-05-25 | - | 原生 idempotent 检测 (isPluginRegistered + fs.access) |
| v3.9.10 | 2026-05-25 | - | supplementary plugin registry check + ctx7 alias + mattpocock 双路径 |
| v3.9.11 | 2026-05-25 | - | messages/ 加入 npm 包 files 数组 |
| v3.9.12 | 2026-05-25 | - | npm-cli/git-clone fallthrough 修复 + quiet flag 传播 |
| v3.9.13 | 2026-05-25 | - | zh-Hans 统一为英文 + suppress A.5 行 |
| v3.9.14 | 2026-05-25 | - | 跳过无 role prompt 的 legacy skills 的 commands/ 生成 |
| v3.9.15 | 2026-05-26 | - | 删除 legacy SKILL.md (execute-task/plan-feature/verify-work) |
| v3.9.16 | 2026-05-26 | `f749e2e` | 彻底移除 execute-task/plan-feature/verify-work |
| v3.9.17 | 2026-05-27 | `0920a29` | code review fixes + 死代码清理 + comment cleanup |
| v3.9.18 | 2026-05-30 | `a582c84` | 统一卸载命令 `harnessed uninstall` (无参数=移除自身, 上游不动) |
| v3.9.19 | 2026-05-30 | `90f7b58` | INSTALLED_INDICATORS — gsd / mattpocock-skills 多目录布局 idempotent 检测 |
| v3.9.20 | 2026-05-30 | `9310dd0` | mattpocock-skills doctor check indicator 探测 (auto-install 重复提示修复) |
| v3.9.21 | 2026-05-30 | `d8e2cbd` | Step B 输出按 component_type 分组 (MCP servers / Commands & Skills / CLI tools) |
| v3.9.22 | 2026-05-30 | `9bda63e` | 注入 phase.* (15 字段) + subtask.* (17 字段) 默认 gate context |
| v3.9.23 | 2026-05-30 | `c94d365` | masterOrchestrator gate eval 错误 fail-soft fires=true (ADR 0029 对齐) |
| v3.9.24 | 2026-05-30 | `7804aec` | 注入 user_understanding_unclear 默认值 (/auto research gate) |
| v3.9.25 | 2026-05-30 | `0c8414a` | plan/architecture gate ref 修正 + workflow-gate-refs TDD 守门测试 |
| v3.9.26 | 2026-05-30 | `fdcbcfa` | **Option A 架构修复** — 交互式澄清在主 session, 执行阶段 spawn (--skip-sub flag + 三类命令体) |

---

## v3.9.26 — Option A 交互式澄清架构修复

**触发**: 用户 dogfood `/auto` 发现 discuss/clarify 从不与用户对话 — headless SDK subagent 无法提问, brainstorming 退化成自问自答。违反 CLAUDE.md 铁律 "澄清必须在主 session 完成后再下放"。

### 三层修复 (TDD: 每层 RED → GREEN)

| 层 | 文件 | 变更 |
|----|------|------|
| 1. skip filter | `src/workflow/masterOrchestrator.ts` | gateContext.skip_subs[] pre-gate 过滤: 已在主 session 完成的 sub 直接 skip, 不 eval gate (4 tests) |
| 2. CLI flag | `src/cli/run.ts` | `--skip-sub <names>` 逗号分隔 → gateContext.skip_subs[] (2 tests) |
| 3. 命令体三分类 | `src/cli/lib/generateCommands.ts` | INTERACTIVE (discuss 族 + task-clarify): 主 session 对话, 不 spawn / HYBRID (auto, task): 先交互澄清再 spawn --skip-sub clarify / SPAWN (其余): 不变 (7 tests) |

### 升级注意

用户升级后必须重跑 `harnessed setup` 重新生成 `~/.claude/commands/*.md`。

详见 [PLAN-interactive-clarification.md](./PLAN-interactive-clarification.md)。

---

## v3.9.18-25 — 卸载 + 检测 + gate context 系列

- **v3.9.18**: `harnessed uninstall` (无参数) 统一卸载自身文件 (commands / skills / settings env / state dir), 上游组件不动。`--dry-run` 预览。删除 `--yes` flag。
- **v3.9.19-20**: gsd (70+ gsd-* 目录) 和 mattpocock-skills (diagnose/tdd/zoom-out 离散目录) 安装布局与 manifest 名不符 → INSTALLED_INDICATORS 映射表双修复 (idempotent.ts + doctor check)。
- **v3.9.21**: setup Step B 输出按 component_type 分组显示。
- **v3.9.22-25**: gate eval 变量缺失系列修复 — CLI 注入 32+ 默认 context 字段 + master fail-soft 对齐 ADR 0029 + yaml gate ref 规范 + TDD 守门测试 (workflow-gate-refs.test.ts)。

---

## v3.9.17 — code review fixes + 简化

**触发**: gstack `/review` (verify-paranoid) + `/code-simplifier` (verify-simplify)

### 修改

| 类别 | 文件 | 变更 |
|------|------|------|
| **extractSkillName 去重** | `src/installers/lib/idempotent.ts` | `extractSkillName` 改为 `export` |
| | `src/installers/npxSkillInstaller.ts` | 删除本地定义, import from idempotent.js |
| | `src/uninstallers/npxSkillInstaller.ts` | 删除本地定义, import from idempotent.js |
| **gate eval 修复** | `src/cli/run.ts` | `gateContext` 新增 `phase: { stage, is_critical_module: true }`, 从 workflow 名推导 |
| **死代码移除** | `src/cli/lib/validateFlags.ts` | **删除** — `validateNonInteractiveFlags` 为空函数, 0 引用 |
| | `src/cli/manifest-add.ts` | 删除 import + 调用 |
| | `src/cli/research.ts` | 删除 import + 调用 |
| | `src/cli/install-base.ts` | 删除 import + 调用 |
| | `src/cli/install.ts` | 删除 import + 调用 |
| | `src/cli/setup.ts` | `cResult`/`dResult` 未使用变量改为直接 await |
| **注释清理** | `src/types/schemaVersion.ts` | 18→17 surfaces + 删除所有 "Nth surface" 序号 |
| | `src/cli/lib/setup-helpers.ts` | 删除 execute-task/plan-feature/verify-work 引用 |
| | `src/cli/lib/validateFlags.ts` | 5→4 site duplicate |
| | `src/cli/manifest-add.ts` | 删除 "Sister: execute-task.ts" |
| | `src/workflow/schema/phases.ts` | execute-task → task workflow |
| | `src/workflow/loadPhases.ts` | 删除 execute-task/phases.yaml 引用 |
| | `src/workflow/run.ts` | 删除 "escape hatch from execute-task" |
| | `src/checkpoint/schema/checkpoint.v1.ts` | 删除 "execute-task workflow snapshot" |
| | `src/workflow/lib/completionSchema.ts` | 删除 "execute-task chain" |
| **文档更新** | `workflows/README.md` | execute-task→task, plan-feature→plan |
| | `workflows/SCHEMA.md` | §4 用 verify/paranoid v3 替换 plan-feature v0.3; §6-7 更新 |
| **测试 mock 修复** | `tests/unit/installers-mcpStdioAdd.test.ts` | mock 改为 `vi.importActual` spread |
| | `tests/unit/installers-mcpHttpAdd.test.ts` | 同上 |
| | `tests/integration/installer-contract.test.ts` | 同上 |
| | `tests/unit/types-schemaVersion.test.ts` | 18th→17th 注释更新 |

### 验证

- biome: clean (271 files)
- tsc: 0 errors
- vitest: 1040 passed / 5 skipped / 1 todo (131 files)

---

## v3.9.16 — 死代码彻底移除

**触发**: 用户指出 execute-task/plan-feature/verify-work 已被 /task /plan /verify 替代

### 删除

| 类别 | 内容 |
|------|------|
| CLI 代码 | `src/cli/execute-task.ts` (整文件) |
| Schema | `src/workflow/schema/planFeature.ts` (整文件) |
| Workflow yaml | `workflows/execute-task/workflow.yaml` |
| | `workflows/plan-feature/workflow.yaml` |
| | `workflows/verify-work/workflow.yaml` |
| Workflow SKILL.md | `workflows/execute-task/SKILL.md` |
| | `workflows/plan-feature/SKILL.md` |
| | `workflows/verify-work/SKILL.md` |
| 测试文件 | 13 个测试文件 (unit + integration + dogfood) |
| CLI 引用 | `src/cli.ts` — 删除 `registerExecuteTask` import + 调用 |
| Legacy 常量 | `src/cli/lib/scan-nested.ts` — FLAT_LEGACY_KEEP 6→3 |
| Schema 版本 | `src/types/schemaVersion.ts` — 18→17 surfaces (删除 planFeature) |
| Defaults | `workflows/defaults.yaml` — 删除 3 个 legacy ralph_max_iterations 条目 |

### 关联修改

| 文件 | 变更 |
|------|------|
| `tests/unit/types-schemaVersion.test.ts` | 18→17 |
| `tests/cli/setup-helpers.test.ts` | FLAT_LEGACY_KEEP 6→3 |
| `tests/workflow/defaults.test.ts` | 删除 execute-task/plan-feature/verify-work 断言 |
| `tests/unit/installers-npxSkillInstaller.test.ts` | @latest forbidden → allowed |
| `tests/unit/i18n.test.ts` | 中文断言 → 英文 |
| `tests/integration/phase-2.3-e2e.test.ts` | 删除 2 个 manifest 引用 |
| `tests/integration/manifest-install-dry-run.test.ts` | 删除 2 个 test case |

---

## v3.9.7 → v3.9.15 — dogfood 驱动修复序列

### 核心问题: Windows idempotent 检测

**根因**: `spawnCmd` 在 Windows 使用 `cmd.exe /c`, 不支持 Unix 命令 (`test`, `grep -q`, `/plugin list`)。所有 manifest 中的 `idempotent_check` shell probe 在 Windows 上静默失败, 导致已安装组件被报告为 "installed" (重复安装) 或 "failed"。

**解决方案路径**:

1. **v3.9.8** — `spawn.ts` 新增 `expandTildeForWindows()`: Windows `cmd.exe` 不展开 `~`, 导致 `mkdir ~/.claude/...` 失败
2. **v3.9.9** — `idempotent.ts` 新增 `detectNative()`: 每种 install method 的 Node.js 原生检测 (isPluginRegistered / fs.access), 在 shell spawn 之前运行
3. **v3.9.10** — `isPluginRegistered()` 读取 `~/.claude/plugins/installed_plugins.json` (v2 schema); supplementary check 加 `context7` alias; npx-skill-installer 检查 `~/.agents/skills/` 路径
4. **v3.9.12** — 修复 npm-cli 和 git-clone-with-setup 分支的 early return bug (return false 阻止了 supplementary plugin registry check)

### 其他修复

| 版本 | 修复 |
|------|------|
| v3.9.8 | npm publish race condition (concurrency group 改为 shared `publish`) |
| v3.9.9 | `ccPluginMarketplace.ts` install timeout 15s→60s; 移除 @latest 禁止 |
| v3.9.10 | 删除 anthropics-skills-pptx + slide-deck manifests; routing/decision_rules.yaml 更新 |
| v3.9.11 | `package.json` files 数组加入 "messages" (修复 i18n raw key 显示) |
| v3.9.12 | `InstallOpts.quiet` 字段; 7 个 installer 的 renderDiff 加 quiet guard |
| v3.9.13 | `messages/zh-Hans.json` 统一为英文 (用户 Windows 中文环境 auto-detect zh-Hans) |
| v3.9.14 | `writeAllCommands` 前过滤无 role prompt 的 cmdSkillNames |
| v3.9.15 | 删除 3 个 legacy SKILL.md 文件 |

### 未解决问题

- **mattpocock-skills install timeout**: `npx skills@latest add mattpocock/skills --copy --global` 在 60s timeout 内无输出, 疑似 skills CLI 交互式 prompt。deferred for future investigation。

---

## 经验教训

1. **Windows `cmd.exe /c` 不支持 Unix 命令** — `test`, `grep -q`, `plugin list` 等 POSIX shell 命令在 `cmd.exe` 中静默失败 (exit code 1, 非 "command not found")。idempotent 检测不能用 shell spawn, 必须用 Node.js 原生 API。

2. **`npx skills add` 路径不确定** — skills CLI 可能写入 `~/.claude/skills/` 或 `~/.agents/skills/`, 取决于系统配置。检测时必须检查两个路径。

3. **vitest mock 隔离** — `vi.mock` 工厂不 spread `...actual` 时会丢失未显式列出的导出, 导致其他测试文件 import 到 undefined。

4. **语义版本号中的维护系列** — v3.0 GA 后的小版本号 (v3.9.x) 不是 phase-driven 开发, 而是 dogfood → 发现 bug → 修复 → 发布 的快速迭代。每个版本 1-3 个 atomic commit, 不需要完整的 GSD phase cadence。

5. **gstack 治理关卡在维护模式仍有效** — `/verify-paranoid` (gstack /review) 在 v3.9.16→v3.9.17 发现了 extractSkillName 重复、validateNonInteractiveFlags 死代码等问题, 证明即使是维护系列也应保持 verify cadence。
