# Phase 1.1 Kickoff Prompt

> 给"另一个 CC 会话"的冷启动指令。
> 用户从这份文件**复制 §「Paste 给 CC」节内容**贴到新 CC 第一条消息即可。
> 此模板可被 wave 2 / 3 / 4 启动时复用（修改 phase 编号即可）。

---

## Paste 给 CC（从下面 ── 之间复制）

──────────────────────────────────────────────────────────────────

**Cold start：你刚加入一个进行中的项目。**

### 项目定位

- **项目**：harnessed — AI coding harness 生态的「装配主义包管理器」。不 vendor 上游，靠 manifest 装依赖、用 composition skill 编织流程。
- **项目根**：`D:\GitCode\harnessed`（Node.js + TypeScript + pnpm 10）
- **当前里程碑**：v0.1.0（manifest 引擎 + research workflow，1-2 周）
- **当前任务**：进入 GSD `/gsd-execute-phase 1.1`，执行 47 个原子子任务

### 第一步：读这些文件建立 baseline（按顺序）

1. `D:\GitCode\harnessed\.planning\STATE.md` — 当前位置 SSOT
2. `D:\GitCode\harnessed\.planning\phase-1.1\PLAN.md` — 339 行完整规划
3. `D:\GitCode\harnessed\.planning\phase-1.1\task_plan.md` — 1528 行，**47 原子子任务，是你的主 worklist**
4. `D:\GitCode\harnessed\.planning\phase-1.1\progress.md` — 进度 + Findings tracker（你执行时要追加）
5. `D:\GitCode\harnessed\.planning\phase-1.1\PLAN-CHECK.md` — plan-checker 验收报告（V1-V5）
6. `D:\GitCode\harnessed\.planning\phase-1.1\ASSUMPTIONS.md` — 5 项 callout（C2/C3/C6/B7/B9）
7. `D:\GitCode\harnessed\docs\adr\0001-manifest-schema-v1.md` — schema 冻结，**不可 inline 改主体**
8. `D:\GitCode\harnessed\docs\adr\0002-repo-structure-toolchain-v0.1.md` — toolchain（pnpm 10 + tsup + ESM + vitest 4 + commander + biome 2）

### Phase 1.1 现状（plan-checker verdict ⚠️ APPROVED WITH CONDITIONS）

✅ **已 patch 完成（不要再讨论）**：
- V1 BLOCKER `5→6 install method`：PLAN.md L86/201/227/339 + task_plan.md L1270（18 illegal = 24-6 legal）全部已修

⚠️ **执行中顺手 fix（minor，不阻塞）**：
- V4 A4 验收命令改 `gh run view <run-id> --json jobs --jq '.jobs[] | select(.conclusion != "success")' | wc -l` 输出 0
- V4 A8 验收命令改 `git ls-files --eol "*.yaml" "*.json" "*.md" | grep -v 'lf/lf' | wc -l` 输出 0
- V5 在 task_plan.md T7.1 显式标注 "前置依赖 T5.1"

### 执行风格分两段

**Wave 1（T1 + T2，~10 子任务）— 机械加速段**
- T1 创建 22+ 目录骨架、`.gitattributes`、`.gitignore`、vendor/ENTRY-CRITERIA.md 占位
- T2 配 toolchain（`package.json` / `tsconfig.json` / `biome.json` / `vitest.config.ts` / `tsup.config.ts`）
- **跳过 superpowers brainstorm**——目录结构和 toolchain 都已在 ADR 0001/0002 锁死，无设计决策空间
- **ralph-loop 简化**：每 task 直接执行+commit，不用 `/ralph-loop` 包裹
- 目标：1-2 小时内 wave 1 完成，仓库可跑 `pnpm install && pnpm typecheck`

**Wave 2+（T3 起 — 严格走完整流程）**
- T3 (manifest schema TypeBox) / T4 (Ajv validator) / T8 (≥ 50 测试) 是设计密集 + 业务核心
- **每个子任务必须用 superpowers brainstorming**（设计澄清、方案对比）
- **TDD 强制**（schema validator 是核心业务逻辑，按 CLAUDE.md 规则强制开启）
- **mattpocock 招式按需召唤**：`/grill-with-docs`（schema 字段语义不清时）/ `/zoom-out`（陌生模块）/ `/diagnose`（排错）
- **每子任务 `/ralph-loop` 兜底交付**，completion-promise = "COMPLETE"，max-iterations = 20
- T7.10 反哺如发现 schema 字段不足 → **必须出 ADR 0003 errata，禁止 inline 改 ADR 0001**

### 硬约束（违反即 STOP）

1. **schema 冻结**：T7.10 是 phase 1.1 唯一允许"修订 schema"的窗口，必须走 ADR 0003 errata。T8 测试矩阵在 ADR 0003 accepted 之前 STOP。
2. **A7 验收**：phase 1.1 结束前 `git tag adr-0001-accepted`，A7 改写为 `git diff adr-0001-accepted -- docs/adr/0001-*.md` exit 0。
3. **不允许静默跳过降级**：上游不可用 / fallback / 异常 → 必须写到 progress.md § B（Findings），重大事项升级 ADR 0003 errata。
4. **不要 work around**：PLAN/task_plan 描述与代码现实冲突时 STOP，写 finding 到 § B，等用户 approve 修订路径。
5. **out-of-scope 严守**：phase 1.1 不做 installer 实装 / DAG resolver / cross-OS npx wrapper / setup-doctor 命令 / 真实 install 9 上游 — 这些是 phase 1.2-1.4。
6. **范围蔓延零容忍**：feature request 必须三问：是否在 task_plan？是否在 acceptance bar？是否新增 ADR？三问任一为否 → 拒绝并 log 到 § B。

### 执行节奏（每子任务）

```
1. 读 task_plan.md 找下一个未勾选 task
2. （wave 2+ 才需要）superpowers brainstorm 设计澄清
3. （wave 2+ 才需要）TDD 写测试 → 实现 → refactor
4. 执行 task 描述的「文件 / 命令」
5. 验证 task 描述的「验收」全部 ✅
6. atomic commit：`phase-1.1: T<N>.<M> <action>` 格式
7. 勾选 task_plan.md 该 task 的 [ ] → [x]
8. 追加 progress.md § A.4：`YYYY-MM-DD | T<N>.<M> | <result> | <commit-shorthash>`
9. 同步更新 progress.md § A.2 acceptance bar 状态（如涉及）
10. （wave 2+ 才需要）`/ralph-loop` 兜底确认 COMPLETE
```

### Session 中断恢复

```bash
cd /d/GitCode/harnessed

# 1. 读 .planning/STATE.md → 当前位置
# 2. 读 .planning/phase-1.1/progress.md § A.4 → 最后一行确认上一 task
# 3. 读 .planning/phase-1.1/progress.md § B → 检查 open blocker
# 4. 读 .planning/phase-1.1/task_plan.md → 找下一个未勾选 task
# 5. 继续执行
```

### 工具链 doctor（开始前 30 秒确认）

```bash
node --version         # 期望 v22.x（ADR 0002）
pnpm --version         # 期望 10.x
git --version
which jq               # T8 测试矩阵会用
```

缺失任何一项 → 先安装 → 再启动 execute。

### 启动命令

确认上面 baseline 都读完后：

```
/gsd-execute-phase 1.1
```

GSD plugin 接管 wave-based 编排，按 `task_plan.md` 顺序执行，每完成一个 task 同步 `progress.md`。

──────────────────────────────────────────────────────────────────

## 复用此模板（wave 2 / 3 / 4）

启动后续 wave 时复制本文件到 `phase-X.X/KICKOFF-PROMPT.md`，修改：

1. **第一段「项目定位」** 的"当前里程碑/任务" → 新 phase
2. **「读这些文件」** 的路径 → 新 phase 目录
3. **「Phase 现状」** → 新 plan-check verdict
4. **「执行风格分两段」** → 新 wave 的机械段 vs 设计密集段划分
5. **「硬约束」** → 新 phase 的 ADR 引用（如 v0.2 引 ADR 0003+）
6. **「启动命令」** → `/gsd-execute-phase X.X`

模板核心结构（cold start brief / baseline 读单 / 当前现状 / 执行风格 / 硬约束 / 节奏 / 恢复 / doctor / 启动命令）跨 phase 通用，不要改。
