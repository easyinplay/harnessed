# v4.0 PLAN — 编排大脑 + Prompt 库

> status: ready-to-execute | 日期: 2026-05-30
> 上游: [ARCHITECTURE-SPEC.md](./ARCHITECTURE-SPEC.md) (D0-D3 locked, 0 open questions)
> 4 Waves / 12 atomic tasks / 预估 ~2.5 天

---

## Wave 1 — 新 CLI ×3（互相独立，可并行）

### T1.1 `harnessed gates` CLI

| 项 | 值 |
|----|----|
| 新文件 | `src/cli/gates.ts` + `tests/cli/gates.test.ts` |
| 改文件 | `src/cli.ts` (注册) |
| 复用 | `resolveJudgmentGate` (judgmentResolver.ts:42 ✓) + masterOrchestrator gate eval 循环逻辑 + `resolveMasterYamlPath` (masterOrchestrator-helpers.ts:25 ✓) |
| TDD | RED 先行 |

**行为**:
```bash
harnessed gates <master> [--task <text>] [--skip-sub <names>] [--context <json>]
```
- 读 `workflows/<master>/auto/workflow.yaml` delegates_to[]（auto 读 `workflows/auto/workflow.yaml`）
- 每个 clause: skip_subs 含 → skip；无 gate → fire；有 gate → resolveJudgmentGate（注入 v3.9.22 默认 context + --context 覆盖）
- 评估 `judgments.parallelism-gate.agent-teams-upgrade.fires` → parallelism 字段
- stdout JSON: `{master, fire: [{sub, order, mode, gate?}], skip: [{sub, reason}], parallelism: {escalate_to_teams, reason}}`
- gate eval 错误 → fail-soft fire（ADR 0029，沿 v3.9.23）

**验收**:
1. `harnessed gates task --task "实现核心算法"` → JSON 含 4 subs in fire[]
2. `harnessed gates task --skip-sub clarify` → clarify 在 skip[]，reason 含 "skip_subs"
3. `harnessed gates verify` → 8 subs 按 gate 评估分布 fire/skip
4. JSON 可被 `JSON.parse` 解析，三键齐全
5. 不存在的 master → exit 1 + stderr

### T1.2 `harnessed prompt` CLI

| 项 | 值 |
|----|----|
| 新文件 | `src/cli/prompt.ts` + `tests/cli/prompt.test.ts` |
| 改文件 | `src/cli.ts` (注册) |
| 复用 | `buildAgentDef` (run.ts ✓) + `loadRolePrompts` (generateCommands.ts:71 ✓) + `loadDisciplinesForPhase` + defaults.yaml |
| TDD | RED 先行 |

**行为**:
```bash
harnessed prompt <sub> [--task <text>] [--json]
```
- 默认: stdout = 完整 prompt 文本（role + checklist + disciplines + task + 2 协议）
- `--json`: `{prompt, max_iterations, model, specialist}` （max_iterations 从 defaults.yaml ✓，model 从 workflow.yaml phase）
- 末尾固定注入 2 协议:
  - COMPLETE promise: "When done emit: <promise>COMPLETE</promise>"
  - NEEDS_CLARIFICATION: "If you hit a gray area you cannot decide: emit STATUS: NEEDS_CLARIFICATION + numbered questions. Do NOT self-decide."

**验收**:
1. `harnessed prompt task-code --task "x"` → 文本含 specialist + checklist + "COMPLETE" + "NEEDS_CLARIFICATION"
2. `--json` → 4 键 JSON，max_iterations 是数字
3. 不存在的 sub → exit 1
4. role-prompts 缺 entry → 保守 fallback prompt（沿 buildAgentDef 现有行为）

### T1.3 `harnessed checkpoint` CLI

| 项 | 值 |
|----|----|
| 新文件 | `src/cli/checkpoint.ts` + `tests/cli/checkpoint.test.ts` |
| 改文件 | `src/cli.ts` (注册) |
| 复用 | `activatePhase` / `completePhase` (checkpoint/engineHook.ts ✓) |
| TDD | RED 先行 |

**行为**:
```bash
harnessed checkpoint start <sub>
harnessed checkpoint complete <sub> [--summary <text>]
harnessed checkpoint fail <sub> [--summary <text>]
```
- 写 `~/.claude/harnessed/checkpoints/<sub>.json` + current-workflow.json（现有机制）

**验收**:
1. `start` → current-workflow.json status=active
2. `complete --summary "done"` → checkpoint json 含 summary
3. 连续 start→complete → status 流转正确

---

## Wave 2 — 命令体模板重写（依赖 W1 完成）

### T2.1 ORCHESTRATOR 模板（5 masters: auto/discuss/plan/task/verify）

| 项 | 值 |
|----|----|
| 改文件 | `src/cli/lib/generateCommands.ts` + `tests/unit/generate-commands.test.ts` |
| TDD | RED 先行 |

**模板结构**（生成的 `commands/<master>.md` 内容）:
```
1. [离 discuss 类 master] 澄清判据 → 主 session AskUserQuestion 对话锁 spec
2. Bash: harnessed gates <master> --task "<spec>" → parse JSON
3. parallelism.escalate_to_teams → 按 ~/.claude/rules/agent-teams.md 走 TeamCreate 路径
4. 否则按 fire[] 顺序，每个 sub:
   a. Bash: harnessed prompt <sub> --task "<spec>" --json → {prompt, max_iterations}
   b. ralph-loop 插件包裹 spawn: /ralph-loop "<prompt>" --max-iterations <N> --completion-promise "COMPLETE"
      (无 ralph-loop 插件 fallback: CC 自己 Task spawn + 检查 COMPLETE + 重试循环)
   c. 输出含 STATUS: NEEDS_CLARIFICATION → AskUserQuestion 转达 → 答案拼 task 重 spawn
   d. COMPLETE → Bash: harnessed checkpoint complete <sub>
5. 汇总报告给用户
```

**验收**:
1. 生成的 auto.md 含 `harnessed gates` + `harnessed prompt` + `/ralph-loop` + `AskUserQuestion` + `TeamCreate` 字样
2. 生成的 task.md 含步骤编号 1-5 + NEEDS_CLARIFICATION 处理指示
3. 不再含 `harnessed run <master> --task-stdin`（旧 spawn 路径）
4. marker 保留（shouldOverwriteFile 通过 ✓）

### T2.2 EXECUTION 模板（execution subs: task-code/test/deliver + verify-* + plan-* + research/retro）

**模板结构**:
```
1. Bash: harnessed prompt <sub> --task "$ARGUMENTS" --json
2. ralph-loop 包裹 CC Task spawn（同 T2.1 4b-4d）
3. NEEDS_CLARIFICATION → 问用户 → 重 spawn
4. COMPLETE → checkpoint
```

**验收**:
1. verify-paranoid.md 含 `harnessed prompt verify-paranoid` + spawn 指示
2. 不含 `harnessed run verify-paranoid`

### T2.3 INTERACTIVE 模板更新（discuss 族 + task-clarify）

v3.9.26 已有。微调: 澄清完成后指向新 ORCHESTRATOR 链（"锁定 spec 后运行 /plan"）。

**验收**: discuss.md 仍为主 session 对话指示，无 spawn。

---

## Wave 3 — CI 模式标注 + 文档（依赖 W2，可与 W2 后半并行）

### T3.1 `harnessed run` CI 模式标注
- `src/cli/run.ts` 顶部 JSDoc + `--help` 描述加 "(CI/headless mode — CC slash commands use native spawn instead)"
- 验收: `harnessed run --help` 含 CI 字样

### T3.2 README 更新（en + 9 语言）
- 新架构图（CC 原生 spawn）+ 新 CLI ×3 表格 + v3→v4 迁移说明（重跑 setup）
- 验收: 10 个 README 的 CLI 命令表含 gates/prompt/checkpoint

### T3.3 docs/WORKFLOW.md 重写
- v4.0 数据流: CC 主 session → gates → 原生 spawn → checkpoint
- 验收: mermaid 图反映新架构

---

## Wave 4 — Dogfood + 发布（依赖 W1-W3 全部）

### T4.1 E2E dogfood
- 本机真实需求跑 `/task`（小需求）验证: gates JSON → prompt → spawn → NEEDS_CLARIFICATION 往返 → checkpoint
- 验收: 完整链路无 manual fix；NEEDS_CLARIFICATION 至少触发一次且往返成功

### T4.2 发布 v4.0.0
- package.json 4.0.0 + CHANGELOG [4.0.0] BREAKING（命令体全部重新生成，用户必须重跑 setup）
- ci.yml 检查 + tag v4.0.0 + npm publish
- 验收: npm latest = 4.0.0；另一台机器 `npm i -g harnessed && harnessed setup` 后 `/task` 走新链路

---

## 依赖图

```
W1 (T1.1 ∥ T1.2 ∥ T1.3) → W2 (T2.1 → T2.2 → T2.3) → W3 (T3.1 ∥ T3.2 ∥ T3.3) → W4 (T4.1 → T4.2)
```

## 执行机制（按用户 CLAUDE.md 子任务并行铁律）

- W1 三个 CLI 互相独立 → **3 个 subagent 并行 fan-out**（各自 TDD: RED → GREEN → biome）
- W2 模板有依赖（T2.1 定模式 → T2.2/T2.3 跟随）→ 串行，主 session 或单 subagent
- W3 文档 → subagent 并行（README 10 语言 1 个 agent，WORKFLOW.md 1 个）
- W4 dogfood → 主 session 驱动（需要用户参与 NEEDS_CLARIFICATION 验证）

## Open Questions

(无)
