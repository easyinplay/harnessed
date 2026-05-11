# harnessed ROADMAP

> 状态：✅ 立项已完成（gstack /autoplan 三关卡 + 4 researcher + synthesizer + roadmapper）
> 日期：2026-05-11
> 输入来源：`PROJECT-SPEC.md` v2、`WORKFLOWS-MVP.md` v2、`research/SUMMARY.md`（4/4 HIGH 置信）
> Granularity：standard（4 milestones × 3-5 phases = 共 16 phases）

---

## 项目目标 / 成功标准

**harnessed** 是 AI coding harness 生态的「装配主义包管理器 + composition orchestrator」——不 vendor 上游代码，通过 manifest 描述 + composition skill 编排，把 ECC / Superpowers / GSD / gstack 等异构上游组件按需装配成可执行 workflow。

### v1.0 成功标准（v0.4.0 ship 前必达）

1. **3 个 MVP workflow 全部跑通**：`research`（v0.1）、`execute-task`（v0.2）、`plan-feature`（v0.3），各自验收标准独立达成。
2. **路由命中率 ≥ 85%**：B+C 混合路由在 30 个真实任务样本（覆盖 Haiku/Sonnet/Opus 各 ≥ 8）上达成。
3. **Cross-OS 100% 通过**：macOS / Linux / Windows native（不是 WSL）CI 矩阵全绿。
4. **dogfooding benchmark 公开**：`docs/benchmarks/` 30 任务 + 命中率 + 上游升级 e2e 数据。
5. **bus factor ≥ 1.5**：6 个月 co-maintainer 招募窗口启动；GitHub Sponsors 开通。
6. **零 vendor 漂移**：上游代码从未进仓库（vendor/ 仅在严格准入门槛下例外）。

---

## 里程碑总览（v0.1 → v0.4）

| 版本 | 周期 | 主要交付 | 验收标准（高阶） | 关键风险 |
|------|------|---------|----------------|---------|
| **v0.1.0** | 1-2 周 | manifest 引擎 + setup/doctor + research workflow | 4 type 中 3 个 installer + research 跑通 + cross-OS Day 1 + ADR 0001 | 拓扑解析缺失（DAG 必须 Day 1） |
| **v0.2.0** | 2-3 周 | execute-task workflow + ralph-loop + 剩 2 type installer | execute-task 跑通 + Windows ralph-loop fix + doctor health check + audit | ralph-loop Windows 下 jq+bash 兼容；karpathy behavior-rule merge |
| **v0.3.0** | 3-4 周 | plan-feature workflow + checkpoint + 路由命中率验收 | plan-feature 跑通 + checkpoint 分层 + 30 样本 ≥ 85% + gstack 前缀探测 | 长链路 context 腐烂；gstack 命令前缀漂移 |
| **v0.4.0** | 2-3 周 | dogfooding benchmark + 稳定期 + co-maintainer 招募 | benchmark 公开 + stale-bot + ADR 全集 + 路由审计日志 + Sponsors | 单 maintainer 倦怠（学术 36%/年） |

**总工期 ~10-12 周**（单人保守估，每 3-4 周一次社区反馈窗口）。

---

## v0.1.0 — manifest 引擎 + research workflow（1-2 周）

### Goal

把 manifest schema 冻结住、把 3 个 installer + DAG resolver + research workflow 端到端跑通；从 Day 1 守住 cross-OS 与 schema 严格校验。

### 必含项（直接采纳 SUMMARY § 五 v0.1.0 MUST 9 项）

1. **manifest schema v1 冻结**（SPEC § 8.1 + R03 § 6.5 + R04 P0）
   - 加 `apiVersion: harnessed/v1`（仿 K8s CRD）
   - 加 `upstream_health: { stability, last_check, fallback_action }`
   - 加 `signed_by: <maintainer github username>`
   - 4 type 共有/分支字段全部 frozen，schema 改动后必须走 ADR
2. **5 种 installer 中的 3 个**（research workflow 实际用到）
   - `cli-npm`（ctx7，覆盖 npm_global + npx fallback）
   - `mcp-stdio-add`（Tavily, Exa）
   - 内置 `harnessed-router` 引擎
3. **DAG resolver 从 Day 1**（R04 P0#4）：先解析全图再拓扑排序；循环依赖 schema 校验拒绝
4. **research workflow 跑通**（WORKFLOWS § 1）：30 个真实查询样本验证
5. **第一份 ADR**：`docs/adr/0001-manifest-schema-v1.md`（R04 P0#6）
6. **`harnessed setup` 启动自检自身版本**（R04 P0#5；提示 `npx@latest`）
7. **routing schema 严格 JSON Schema 校验**（学 Kubeconform `-strict`，R04 P0#7）
8. **Cross-OS 测试 Day 1 启用**（R03 红旗 6 + R04 P0）：CI 矩阵 macOS + Linux + Windows native；npx 自动注入 `cmd /c` wrapper
9. **MCP installer 强制 `--scope project`**（R03 § 3.3，避开 v2.1.122 user scope bug）

### 验收标准（goal-backward 观察清单）

1. 用户在干净的 Mac/Linux/Windows 上 `npx harnessed@latest setup`，30 秒内完成 + 显式 confirm + 写入 `.harnessed/`，零交互错误。
2. `harnessed install research` 通过 DAG 顺序装好 Tavily + Exa + ctx7，过程中每步 print 实际命令、错误时 print 降级原因，无静默 skip。
3. `harnessed doctor` 检测出 Node 版本/MCP scope/上游 git origin 篡改，给出可复制粘贴的修复命令。
4. `/harnessed:research "Next.js app router 在 v15 怎么用"` 自动路由到 ctx7，30 样本命中率 ≥ 85%（v0.1 内部抽样验证）。
5. CI 三平台全绿；schema 任何字段缺失/类型错误立即 fail（不进入运行时）。

### Phase 拆分

- **Phase 1.1：repo 骨架 + manifest schema v1 frozen + ADR 0001**
  - 仓库 4 层目录、`workflows/SCHEMA.md`、`routing/SCHEMA.md`、JSON Schema 文件、`docs/adr/0001-manifest-schema-v1.md`
  - 验收：schema validator 单测全绿；任意非法 manifest 被 reject
- **Phase 1.2：cross-OS CI Day 1 + cli-npm + mcp-stdio installer**
  - GitHub Actions 矩阵（mac/linux/win-native）；npx `cmd /c` wrapper；`installers/cli-npm.ts` + `installers/mcp-stdio.ts`；`--scope project` 强制
  - 验收：3 平台 install Tavily+Exa+ctx7 idempotent + dry-run 通过
- **Phase 1.3：DAG resolver + harnessed-router 引擎 + setup/doctor 命令**
  - 拓扑排序、循环依赖检测、显式降级输出、`harnessed setup` 自版本检查、`.harnessed-backup/` rollback
  - 验收：人为构造循环依赖时 schema 阶段 reject；setup 改文件前 100% explicit confirm
- **Phase 1.4：research workflow 端到端 + routing/search.md**
  - `/harnessed:research` SKILL.md + `routing/search.md` SSOT；分支 ctx7/tavily/exa/parallel；checkpoint 写入
  - 验收：30 真实查询样本 ≥ 85% 命中（v0.1 内部基线，v0.4 重测公开）

### 关键风险

- ⚠️ **DAG resolver 临时绕过的诱惑**：早期上游少时 sequential 也能 work，会拖到 v0.3 才补 → 强制 Day 1 实装（R04 失败模式 4，brew bundle 案）
- ⚠️ **schema 冻结仓促**：第一行 installer 代码前必须冻结，后续改 schema = 全 manifest 迁移（SPEC § 8.1）
- ⚠️ **Windows native 被遗忘**：默认开发在 Mac，CI 红了直接 disable Windows 是常见反模式 → 红了必须修，不允许 disable

---

## v0.2.0 — execute-task workflow + ralph-loop（2-3 周）

### Goal

把子任务级编排（高频场景）打透，补齐剩余 2 种 installer，落实 karpathy-skills 的 behavior-rule 注入语义，引入 doctor health check 与 audit。

### 必含项（直接采纳 SUMMARY § 五 v0.2.0 MUST 7 项）

1. **剩下 2 种 installer**
   - `cc-plugin-marketplace`（superpowers, ralph-loop）
   - `npx-skill-installer` / `git-clone-with-setup`（mattpocock-skills, karpathy-skills, gstack）
2. **execute-task workflow 跑通**（WORKFLOWS § 2）
3. **ralph-loop Windows fix**：doctor 检查 jq + bash（Git Bash 路径）；workflow 模板强制 `--max-iterations`（issue #1429 兜底）
4. **`harnessed doctor` health check**（R04 P1#8）：6 月无 commit 上游标 stale + weekly cron
5. **`harnessed audit` 命令**（R04 P1#10）：检查上游 git origin URL 未被篡改
6. **karpathy-skills 作为 behavior-rule 实装**（R02 § 6）：CLAUDE.md 注入策略 + 多源 merge 规则
7. **plugin 卸载强制 CLI 不走 TUI**（R03 § 1.3 issue #52456）：`claude plugin uninstall --prune` + 4 步 fallback

### 验收标准

1. 用户跑 `/harnessed:execute-task "实现 X 功能"`，自动经过 brainstorming → karpathy 心法编码（按需召唤 mattpocock）→ 条件 TDD → ralph-loop 交付 COMPLETE，5 步全产出 checkpoint。
2. Windows 用户 `harnessed doctor` 立刻指出缺 jq / bash 不是 Git Bash 时给出修复命令；ralph-loop 即使上游 `--completion-promise` 失效也因 `--max-iterations` 兜底不会无限循环。
3. `harnessed audit` 检测上游被替换为恶意 fork（git origin 改名）时立即报警。
4. 6 个月无 commit 的上游被 doctor 标 stale，提示用户切换 fallback 或冻结当前版本。
5. karpathy CLAUDE.md 行为规范注入后，多源（用户私有 + harnessed 默认）有清晰 merge 顺序，用户可关闭。

### Phase 拆分

- **Phase 2.1：cc-plugin-marketplace + npx-skill / git-clone-with-setup installer**
  - 4 步 fallback uninstall；component_type 区分（command / behavior-rule / mcp-tool / cli-binary）
  - 验收：5 种 installer 全部覆盖 9 个上游
- **Phase 2.2：karpathy-skills behavior-rule 注入引擎 + CLAUDE.md merge**
  - 显式标注 source（harnessed/private/project）+ override 优先级
  - 验收：用户 CLAUDE.md 不被破坏；卸载完全清理
- **Phase 2.3：execute-task workflow + routing/execute.md + mattpocock 按需召唤**
  - on_demand_invoke 触发引擎；TDD 条件触发
  - 验收：30 样本子任务流水跑通（含 UI / backend / algorithm 三类）
- **Phase 2.4：ralph-loop Windows 兼容 + doctor health check + audit 命令**
  - jq / Git Bash 探测；upstream_health weekly cron；origin URL 校验
  - 验收：Windows native CI 跑过 ralph-loop 完整链路；audit 检测出 origin 篡改

### 关键风险

- ⚠️ **ralph-loop completion-promise 不可靠**（issue #1429）→ schema 强制 max_iterations required
- ⚠️ **Windows 上 jq + bash 未声明依赖**（R02 红旗）→ doctor 不通过则拒绝执行
- ⚠️ **karpathy behavior-rule 与用户私有 CLAUDE.md 冲突** → 必须有清晰 merge 顺序 + 一键关闭

---

## v0.3.0 — plan-feature workflow + checkpoint（3-4 周）

### Goal

打通最长链路 workflow（governance → orchestration → execution 三层栈），落实 checkpoint 分层、gstack 前缀探测、aliases 重定向；正式跑路由命中率 ≥ 85% 验收。

### 必含项（直接采纳 SUMMARY § 五 v0.3.0 MUST 7 项）

1. **plan-feature workflow 跑通**（WORKFLOWS § 3）
2. **checkpoint 机制**（SPEC § 12）：摘要 vs archive 分层 + `harnessed resume` + 强制 compact 协议
3. **B+C 路由实测命中率 ≥ 85%**：30 样本覆盖 Haiku/Sonnet/Opus 各 ≥ 8；token budget 监控（skill description 总和 ≤ 1% context window）
4. **gstack 命令前缀探测**（R02 § 1）：doctor 探测三选一（默认 / `--no-prefix` / `--prefix gstack-`）写入 `.harnessed/config.json`，workflow 引擎读取插值
5. **manifest deprecation marker**（R04 P2#12）
6. **`manifests/aliases.yaml`**（R04 P2#13）：上游改名重定向表
7. **"known good" 版本组合**（R04 P1#9）：每个 harnessed 版本冻结一组通过 e2e 的上游版本

### 验收标准

1. 用户跑 `/harnessed:plan-feature "X 新功能"`，5 phase 全部经过 pause + human review，session 中断后 `harnessed resume` 从最近 checkpoint 继续，不丢上下文。
2. 30 真实任务样本（model 分布达标）路由命中率 ≥ 85%；Sonnet 100% / Haiku ≥ 84% 复现。
3. 任一上游改名（如 GSD-2），`aliases.yaml` 重定向后 install 仍然通过；deprecation marker 在 doctor / install 阶段显式提示。
4. `harnessed install --known-good` 装出当前版本经 e2e 验证的上游组合；reproducible 安装。
5. CEO veto 时 plan-feature 立即 halt_workflow 不再继续；checkpoint 文件保留供后续重跑。

### Phase 拆分

- **Phase 3.1：checkpoint 引擎 + harnessed resume + compact 协议**
  - 摘要 < 1k token；archive 完整；`current-workflow.json` 状态机
  - 验收：人为中断 session 后从 03 phase 续跑成功
- **Phase 3.2：gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装**
  - 三选一探测；`invokes` 字段插值；governance 层 pause + on_veto
  - 验收：用户 gstack 装哪种前缀都能跑通
- **Phase 3.3：aliases.yaml + deprecation marker + known-good 版本组合**
  - manifest 重定向；doctor warning；release 流程冻结 known-good lock
  - 验收：模拟上游改名场景 install 通过
- **Phase 3.4：路由命中率 ≥ 85% 验收 + token budget 监控**
  - 30 样本（Haiku/Sonnet/Opus 各 ≥ 8）；description 总 token 近似算法 + 阈值告警
  - 验收：实测命中率达标 + token 监控仪表落地

### 关键风险

- ⚠️ **长链路 context 爆炸**（plan-feature 4 上游产出 30k+ token）→ checkpoint 分层 + 强制 compact，后续 phase 只读 checkpoint 不读 archive
- ⚠️ **gstack 命令前缀漂移**（用户可配置）→ workflow 模板不能硬编码，必须插值
- ⚠️ **路由命中率不达标 / Haiku 差距大** → token budget 调优 + B 层 description 重写 + C 层 hook 触发增强

---

## v0.4.0 — dogfooding benchmark + 稳定期（2-3 周）

### Goal

公开 benchmark 数据建立可信度；启动 co-maintainer 招募；落实路由透明度日志与 ADR 全集；为 v1.0 进入稳定期。

### 必含项（直接采纳 SUMMARY § 五 v0.4.0 MUST 6 项）

1. **dogfooding benchmark 公开发布**（R01 § 9）：30 真实任务 + 命中率数据 + 上游升级 e2e → `docs/benchmarks/`
2. **co-maintainer 招募窗口启动**（SPEC § 5.6 + R04 失败模式 3）：6 月窗口 + `docs/MAINTAINER-ONBOARDING.md`
3. **stale-bot + issue templates**（R04 P2#14）
4. **公开 ADR 全集**（R04 P2#15）：所有非常规决策 ADR 入仓
5. **路由透明度日志**（R01 § 7）：`.harnessed/audit.log`
6. **GitHub Sponsors 启用**（SPEC § 5.6）

### 验收标准

1. `docs/benchmarks/v0.4.md` 公开，含 30 任务原始 prompt + 路由决策 + 命中正误 + 上游升级 e2e；任何人可复现。
2. `docs/MAINTAINER-ONBOARDING.md` 给出明确入门路径；6 月窗口期内至少 1 个外部 PR 被 merge。
3. `.harnessed/audit.log` 记录每次路由决策（来源 routing 文件 + 备选 + 实际命令），用户可 grep 排错。
4. 仓库根 `docs/adr/` 至少 5 份 ADR（schema / 不 vendor / B+C 混合 / aliases / known-good）。
5. GitHub Sponsors 链接公开 + README badge；stale-bot 自动关闭 90 天无活动 issue。

### Phase 拆分

- **Phase 4.1：dogfooding benchmark 数据采集 + 公开格式定义**
  - 30 任务执行 + 命中率统计 + 上游升级 e2e 录像/日志
  - 验收：`docs/benchmarks/v0.4.md` review-ready
- **Phase 4.2：co-maintainer onboarding 文档 + GitHub Sponsors + stale-bot**
  - MAINTAINER-ONBOARDING + Sponsors page + GH Action stale workflow
  - 验收：外部新人 30 分钟可跑通 dev 环境
- **Phase 4.3：路由透明度日志 + ADR 全集补齐 + v1.0-RC 收尾**
  - `.harnessed/audit.log` schema + 全部历史决策回填 ADR + RELEASE NOTES
  - 验收：路由决策 100% 可追溯；ADR 至少 5 份

### 关键风险

- ⚠️ **dogfooding 数据"美化"诱惑** → 原始 prompt + 决策 + 命中正误必须公开，命中率失败案例不删
- ⚠️ **co-maintainer 招不到**（学术 36%/年掉队率）→ 6 月窗口结束直接进入 maintenance-only，不假装有人
- ⚠️ **范围蔓延**（社区会要 ship/qa/verify-uat workflow）→ v1.0 前 freeze workflow 数量为 3，feature request 三问

---

## v1.0 前 拒绝清单（直接采纳 SUMMARY § 五 末尾 6 项）

- ❌ **不在 v1.0 前加新 workflow type**（坚守 3 个：research / execute-task / plan-feature）
- ❌ **不 wrap 上游 API**（不写 `harnessed.invokeBrainstorming()` 这类二次抽象）
- ❌ **不做"云端 manifest registry"**（v1.0+ 再考虑）
- ❌ **不支持 manifest 里的动态求值 / shell escape**（`${shell command}` / `eval` / `!ruby/regexp` 全禁）
- ❌ **不在 v0.5 前实现跨 harness**（先把 CC 一条线打透；schema 留接口注释即可）
- ❌ **不做可视化 dashboard**（v1.0+ 再考虑）

---

## 关键决策（直接引用 SPEC § 1 + § 5 已锁定）

| 决策 | 锁定值 | 锁定来源 |
|------|-------|---------|
| 项目名 | `harnessed` | SPEC § 1 |
| License | Apache-2.0 | SPEC § 1（v2 升级） |
| 实现语言 | Node.js + TypeScript | SPEC § 1 |
| 集成模型 | 方案 Z（Composition Skill，不 vendor） | SPEC § 1 |
| 命名空间 | `/harnessed:*` 完整前缀 | SPEC § 5.2 |
| 路由机制 | B+C 混合（B description + C UserPromptSubmit hook） | SPEC § 5.1 + R03 实证 |
| 路由命中率验收 | 30 样本（Haiku/Sonnet/Opus 各 ≥ 8）≥ 85% | SPEC § 5.1 + R03 |
| 跨 harness | 架构保留，CC 先行；不在 v0.5 前实现 | SPEC § 5.3 |
| 发布渠道 | npm + Claude Code marketplace 双轨 | SPEC § 5.4 |
| 上游版本锁 | 4 类策略 + manifest.lock.yaml + weekly CI | SPEC § 5.5 |
| 商业模式 | GitHub Sponsors only（MVP）；6 月 co-maintainer 窗口 | SPEC § 5.6 |
| Hook 体系 | routing/*.md 纯 yaml/md；harnessed 自带 hook 严格审计 + install 时 print 全文 + 1-key uninstall | SPEC § 8.3 修订（R03 重写） |
| MCP 修改 | 必须用 `claude mcp add/remove` CLI（不直接编辑 ~/.claude.json） | SPEC § 8.4 新增（R03） |
| Cross-OS 测试时机 | v0.1 Day 1（不是 v0.4） | SPEC § 11 修订（R03 + R04） |

---

## Phase 之间的依赖图

```
                                  ┌─────────────────────────────┐
                                  │  v0.1.0 Foundation          │
                                  │                             │
                                  │  P1.1 schema + ADR ─────────┐│
                                  │       │                     ││
                                  │       ▼                     ││
                                  │  P1.2 cross-OS CI +         ││
                                  │       cli-npm + mcp-stdio   ││
                                  │       │                     ││
                                  │       ▼                     ││
                                  │  P1.3 DAG + setup/doctor    ││
                                  │       │                     ││
                                  │       ▼                     ││
                                  │  P1.4 research workflow ────┘│
                                  └────────────┬────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────────┐
                                  │  v0.2.0 Sub-task Loop       │
                                  │                             │
                                  │  P2.1 cc-plugin + git-clone │
                                  │       │                     │
                                  │       ▼                     │
                                  │  P2.2 karpathy behavior     │
                                  │       │                     │
                                  │       ▼                     │
                                  │  P2.3 execute-task + routing│
                                  │       │                     │
                                  │       ▼                     │
                                  │  P2.4 ralph Win + doctor    │
                                  │       + audit               │
                                  └────────────┬────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────────┐
                                  │  v0.3.0 Long-chain          │
                                  │                             │
                                  │  P3.1 checkpoint + resume   │
                                  │       │                     │
                                  │       ▼                     │
                                  │  P3.2 gstack prefix +       │
                                  │       plan-feature ref      │
                                  │       │                     │
                                  │       ▼                     │
                                  │  P3.3 aliases + known-good  │
                                  │       │                     │
                                  │       ▼                     │
                                  │  P3.4 routing ≥85% acceptance│
                                  └────────────┬────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────────┐
                                  │  v0.4.0 Stabilize           │
                                  │                             │
                                  │  P4.1 benchmark 公开        │
                                  │       │                     │
                                  │       ▼                     │
                                  │  P4.2 co-maintainer + Sponsors│
                                  │       │                     │
                                  │       ▼                     │
                                  │  P4.3 audit log + ADR 全集  │
                                  └─────────────────────────────┘

并行机会：
- P1.1 + P1.2 schema 与 CI 骨架 可前 1-2 天并行
- P2.2 (karpathy behavior) 与 P2.3 (execute-task workflow) 在 P2.1 完成后可并行
- P4.1 benchmark 数据采集 与 P4.2 onboarding 文档 可并行
依赖硬要求：
- 所有 v0.2 phase 依赖 v0.1 schema + DAG resolver
- v0.3 checkpoint 必须先于 plan-feature 实装（P3.1 先于 P3.2）
- v0.4 benchmark 必须晚于 P3.4（命中率验收）
```

---

## 下一步

1. ⏳ 用户 review SUMMARY § 三/四 提议的 6 项 spec 修订（PROJECT-SPEC + WORKFLOWS-MVP），approve 后批量 patch
2. ⏳ 起草 `docs/adr/0001-manifest-schema-v1.md`（v0.1 phase 1.1 关键产出）
3. ⏳ 进入 GSD `/gsd-discuss-phase 1`（v0.1.0 phase 1.1 — repo 骨架 + schema frozen）
