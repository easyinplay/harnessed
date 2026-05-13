# harnessed ROADMAP

> 状态：✅ 立项已完成（gstack /autoplan 三关卡 + 4 researcher + synthesizer + roadmapper）
> 日期：2026-05-11
> 输入来源：`PROJECT-SPEC.md` v2、`WORKFLOWS-MVP.md` v2、`research/SUMMARY.md`（4/4 HIGH 置信）
> Granularity：standard（4 milestones × 3-5 phases = 共 17 phases — v3 重排后含 phase 1.2.5 + 1.5）

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
2. **6 种 installer 中的 3 个**（research workflow 实际用到，详见 ADR-0003 errata）
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

> **v3 重排（ADR 0006 phase 1.2.5 wedge 重定位 后）** — 详 `.planning/phase-1.2.5/ASSUMPTIONS.md` § E

- **Phase 1.1：repo 骨架 + manifest schema v1 frozen + ADR 0001** ✅ SHIPPED 2026-05-12
- **Phase 1.2：cli-npm + mcp-stdio installer + setup/doctor 命令骨架** ✅ SHIPPED 2026-05-12 (含 phase 1.2.1 hotfix B5')
- **Phase 1.2.5：Architecture revision discuss-phase** ✅ SHIPPED 2026-05-12
  - 8 支柱 100% capture lock + 5 P0 决策 lock + ADR 0006 起草 + ROADMAP v3 重排
  - 不动已 ship 代码 (A7 守恒)；准备 phase 1.3 implementation
- **Phase 1.3：Base profile + Categorization schema + decision_rules.yaml v1**（v3 重排）✅ SHIPPED 2026-05-13
  - 新 ADR 0007 errata：manifest schema 加 `category` + `decision_rules` + `install_type` 字段（A7 守恒不动 0001）✅
  - `harnessed install-base` **独立子命令** (D-9 — 不加 --base flag) 一键装齐 base profile (10 固定 manifest) ✅
  - `routing/decision_rules.yaml` v1 schema 落地 (DMN Priority Hit Policy, 12 rules) ✅
  - ui-ux-pro-max install path 实测 (D1.2.5-11) ✅ PATH_A+B 双 OK
  - 验收：B1-B8 8/8 acceptance bar；ADR 0006/0007 baseline tag 加入 A7 守恒 iterate ✅；CI run 25790126213 三平台全绿
- **Phase 1.4：Routing engine v1 实装 + research workflow E2E**（v3 重排）✅ SHIPPED 2026-05-13
  - main-process-driven routing engine (D1.2.5-3) — `src/routing/engine.ts` 170L Pattern N (主流程编排) ✅
  - AgentDefinition factory 1:1 对应 contract v1 12 字段 (`src/routing/agentDefinition.ts` 148L + 4 typed error class + 4 心法 prepend D1.4-14) ✅
  - systemPrompt verbatim COMPLETE (`src/routing/systemPrompt.ts` 43L Pattern O + D-18 1:1 contract § 5.4 + F33 P1 mitigation) ✅
  - 5 category × decision rules MVP execute (design / content / testing / search / meta) — engineering category v1 占位 0 rules 走 fallback_supervisor (R6 mitigation, 推 phase 1.5) ✅
  - L1 关键词路由 (DMN Priority Hit Policy) + fallback_supervisor LLM L2 兜底 ✅
  - research workflow E2E (`src/cli/research.ts` 93L + 9th register fn + integration test +3 mock cell + 1 real-spawn skipIf) ✅
  - 30 真实查询样本路由命中率 **100.0% (30/30)** ≥ 85% v0.1 内部基线（per-category 全 5/5；4 F42 fallthrough corrected — phase 3.4 v0.3.0 完整命中率验收推 phase 3.4） ✅
  - 验收：C1-C8 8/8 acceptance bar；ADR 累积 7→8 (0008 errata 含 H1a perf transparency reference + M1 yaml path migration 官方化 + R6 engineering category 推 phase 1.5)；CI run 25804037789 @ 8f56514 三平台全绿；A7 step iter 1-8 全 8 ADR 守恒
- **Phase 1.5：DAG resolver + Semantic Router 语义增强 + engineering category routing + mattpocock 23 招式 phase routing**（v3 重排 + phase 1.4 ship 后扩展）⏳ NEXT
  - DAG resolver + 拓扑排序（原 phase 1.3）
  - Semantic Router L2 升级（embedding kNN）
  - 高频 workflow 模式编码（D1.2.5-4 P0-4 渐进策略）
  - **phase 1.4 ship 后新增**: engineering category routing rules (R6 mitigation — 完成 8 支柱 A1' / A5' enforcement) + mattpocock 23 招式 phase routing schema (discuss/plan/execute/verify 分阶段调度)
  - **phase 1.4 ship 后评估候选** (推 phase 1.5 evaluation window): D1.4-2 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata (走 ADR 0009 errata) / F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入 (视 query() 真实调用频率) / F42 array semantic match 升级 (R5 array fallthrough → match 行为)
  - 验收：循环依赖 schema 阶段 reject；Semantic Router 能识别 "做出风格" 等 phrase；engineering 5/5 命中精确 phase routing

### 关键风险（v3 update）

- ⚠️ **DAG resolver 推迟到 phase 1.5**：v3 重排后 phase 1.3 不再含 DAG（base profile 安装顺序明确，不需拓扑），但 phase 1.5 + Semantic Router 升级一起做时必须实装（守 R04 失败模式 4 brew bundle 教训）
- ⚠️ **schema 冻结仓促**：第一行 installer 代码前必须冻结，后续改 schema = 全 manifest 迁移 — phase 1.3 加 `category` / `decision_rules` / `install_type` 字段走 ADR 0007 errata（A7 守恒不动 0001）；phase 1.4 routing engine 实装走 ADR 0008 errata（A7 守恒不动 0001-0007）；phase 1.5 候选 ADR 0009 errata 加 `initialPrompt` / `criticalSystemReminder_EXPERIMENTAL` 2 新字段（D1.4-2 评估）
- ⚠️ **Windows native 被遗忘**：默认开发在 Mac，CI 红了直接 disable Windows 是常见反模式 → 红了必须修，不允许 disable（phase 1.2.1 hotfix 已实证 B5' 修复；phase 1.4 CI run 25804037789 三平台全绿实证 ✅）
- ✅ **Routing engine 三红旗（来自 phase 1.2.5 RESEARCH-1）已实证**（phase 1.4 ship 验收）：
  - ✅ P0 (resolved): subagent 不能嵌套 — phase 1.4 routing engine main-process-driven 已 ship (D1.2.5-3 + D1.4-1 spike 实证)
  - ✅ P1 (resolved): `/reload-plugins` skill bug — phase 1.4 实装时设计 install 后 fresh subagent invoke + filesystem scan + sleep retry idempotent_check + RestartRequiredError 兜底 (R2 mitigation 已 ship)
  - ✅ P1 (resolved): subagent final message summarize 风险 — phase 1.4 systemPrompt.ts D-18 1:1 对齐 contract § 5.4 + verbatim COMPLETE marker 强制 (F33 P1 mitigation 已 ship)

---

## v0.2.0 — Sub-task Loop + Extension Installers（v3 重排，3-4 周）

### Goal

打通子任务级编排（execute-task workflow + ralph-loop full integration），实装 4 个 phase-2.1 placeholder installer，落地 design / content / testing 3 个 extension category 真实候选，doctor health check + audit 完整版。

### 必含项（v3 重排 — ADR 0006 § 6 + ASSUMPTIONS § E lock）

1. **4 个 phase-2.1 placeholder installer 实装**（cc-plugin-marketplace + git-clone-with-setup + npx-skill-installer + mcp-http-add — 详 ADR 0003 errata + ADR 0007 errata install_type 字段）
2. **execute-task workflow + ralph-loop 完整集成**（WORKFLOWS § 2 + 主流程 routing engine 调用 ralph-loop wrap "...COMPLETE" --completion-promise）
3. **design / content / testing category extension installer + decision rule 实测**:
   - design: ui-ux-pro-max install adapter (D1.2.5-11 — 视 phase 1.3 实测结果决定 install path) + frontend-design
   - content: anthropics/skills pptx/docx/xlsx/pdf + baoyu-skills (license None warn — D1.2.5-10)
   - testing: webapp-testing + playwright-cli + chrome-devtools-mcp
4. **doctor health check 完整版**（R04 P1#8）: 6 月无 commit 上游标 stale + weekly cron + ralph-loop Win 兼容 (jq + Git Bash)
5. **audit 完整版**（R04 P1#10）: git origin URL 篡改 + signed_by 校验 + plugin uninstall 4 步 fallback (R03 § 1.3)
6. **karpathy-skills behavior-rule 实装**（R02 § 6）: CLAUDE.md 注入策略 + 多源 merge 规则 + override 优先级
7. **6 install method 全覆盖 10 上游**（v0.1 base 7 个 + extension 部分覆盖）

### 验收标准

1. 用户跑 `/harnessed:execute-task "实现 X 功能"`，自动经过 brainstorming → karpathy 心法 always-on → 按需召唤 mattpocock 招式 → 条件 TDD → ralph-loop 交付 COMPLETE，每子任务 verbatim COMPLETE 回流主流程。
2. design / content / testing category 各能 demo 一个 task（UI 设计 / PPT 生成 / E2E 测试）routing 命中 + auto-install + invoke。
3. Windows 用户 `harnessed doctor` 立刻指出缺 jq / bash 不是 Git Bash 时给出修复命令；ralph-loop 即使上游 `--completion-promise` 失效也因 `--max-iterations` 兜底不会无限循环。
4. `harnessed audit` 检测上游被替换为恶意 fork（git origin 改名）时立即报警；4 步 fallback uninstall 100% 清理。
5. 6 个月无 commit 的上游被 doctor 标 stale；karpathy CLAUDE.md 行为规范注入后多源 merge 顺序清晰可关闭。

### Phase 拆分（v3 重排）

- **Phase 2.1：4 phase-2.1 placeholder installer 实装**
  - cc-plugin-marketplace (anthropics + ui-ux-pro-max + frontend-design 系) + git-clone-with-setup + npx-skill-installer + mcp-http-add
  - install_type 字段 enforcement（D1.2.5-12）
  - 验收：6 install method 全部覆盖 + ui-ux-pro-max install path 实测 (D1.2.5-11) 通过
- **Phase 2.2：execute-task workflow + ralph-loop full integration + 主流程 routing engine 调用**
  - 主进程 spawn subagent 时自动 ralph-loop wrap "...COMPLETE" --completion-promise
  - main agent system prompt 强制 verbatim COMPLETE marker（F33 P1 mitigation）
  - 验收：30 子任务样本 ralph-loop COMPLETE 检测 100% 准确（不被主 summarize 误吞）
- **Phase 2.3：design / content / testing extension category MVP**
  - 3 category × 真实候选 install adapter + decision rule 实测
  - karpathy-skills behavior-rule 注入引擎 + CLAUDE.md merge
  - 验收：30 category-specific 样本 routing 命中 ≥ 85%（含 override "做出风格" 等 anchor）
- **Phase 2.4：doctor health check + audit 完整版 + ralph-loop Win 兼容**
  - jq / Git Bash 探测；upstream_health weekly cron；origin URL 校验；plugin uninstall 4 步 fallback
  - 验收：Windows native CI 跑过 ralph-loop 完整链路；audit 检测出 origin 篡改 + 模拟恶意 fork

### 关键风险

- ⚠️ **ralph-loop completion-promise 不可靠**（issue #1429）→ schema 强制 max_iterations required + main agent system prompt verbatim COMPLETE
- ⚠️ **Windows 上 jq + bash 未声明依赖**（R02 红旗）→ doctor 不通过则拒绝执行
- ⚠️ **karpathy behavior-rule 与用户私有 CLAUDE.md 冲突** → 必须有清晰 merge 顺序 + 一键关闭
- ⚠️ **ui-ux-pro-max install adapter 可能需自维护**（D1.2.5-11）→ 视 phase 1.3 实测结果，必要时 phase 2.1 提供 fork-and-mirror 方案

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

## Phase 之间的依赖图（v3 重排）

```
v0.1.0 Foundation (3-5 周, v3 扩大范围)
  ┌─────────────────────────────────────────────────┐
  │ P1.1 schema + ADR 0001-0002 ✅ SHIPPED         │
  │       │                                         │
  │       ▼                                         │
  │ P1.2 cli-npm + mcp-stdio + cross-OS CI ✅      │
  │      SHIPPED (含 1.2.1 hotfix)                  │
  │       │                                         │
  │       ▼                                         │
  │ P1.2.5 architecture wedge revision (ADR 0006)  │
  │      ✅ SHIPPED 2026-05-12                      │
  │       │                                         │
  │       ▼                                         │
  │ P1.3 base profile + categorization schema      │
  │      (ADR 0007 errata) + ui-ux-pro-max install │
  │      path 实测 + decision_rules.yaml v1        │
  │      + AgentDefinition factory contract draft  │
  │      ✅ SHIPPED 2026-05-13                      │
  │       │                                         │
  │       ▼                                         │
  │ P1.4 routing engine v1 + research workflow E2E │
  │      (main-process-driven; 5 category × 12      │
  │      decision rules MVP execute; verbatim       │
  │      COMPLETE; 30 sample 100.0% hit ≥ 85%       │
  │      v0.1 内部基线)                              │
  │      ✅ SHIPPED 2026-05-13                      │
  │       │                                         │
  │       ▼                                         │
  │ P1.5 DAG resolver + Semantic Router v2 升级    │
  │      + engineering category routing rules +    │
  │      mattpocock 23 招式 phase routing schema   │
  │      (循环依赖检测 + embedding kNN + 8 支柱     │
  │       A1'/A5' enforcement R6 mitigation)        │
  └─────────────────────┬───────────────────────────┘
                        │
                        ▼
v0.2.0 Sub-task Loop + Extension Installers (3-4 周, v3 重排)
  ┌─────────────────────────────────────────────────┐
  │ P2.1 4 phase-2.1 placeholder installer 实装    │
  │      (cc-plugin-marketplace + git-clone-with-  │
  │       setup + npx-skill-installer + mcp-http)  │
  │       │                                         │
  │       ▼                                         │
  │ P2.2 execute-task workflow + ralph-loop full   │
  │      integration (主流程 routing engine 调用    │
  │      ralph-loop wrap + verbatim COMPLETE 回流) │
  │       │                                         │
  │       ▼                                         │
  │ P2.3 design/content/testing extension category │
  │      MVP + karpathy behavior-rule 注入 +       │
  │      30 category-specific 样本 routing ≥ 85%   │
  │       │                                         │
  │       ▼                                         │
  │ P2.4 doctor health check + audit + ralph-loop  │
  │      Win 兼容 (jq / Git Bash / weekly cron /   │
  │      4 步 fallback uninstall)                   │
  └─────────────────────┬───────────────────────────┘
                        │
                        ▼
v0.3.0 Long-chain (3-4 周)
  ┌─────────────────────────────────────────────────┐
  │ P3.1 plan-feature workflow + checkpoint engine │
  │      + harnessed resume                         │
  │       │                                         │
  │       ▼                                         │
  │ P3.2 gstack 前缀探测 + workflow 变量插值 +     │
  │      governance gates (pause + on_veto)        │
  │       │                                         │
  │       ▼                                         │
  │ P3.3 aliases + deprecation marker +            │
  │      known-good 版本组合                        │
  │       │                                         │
  │       ▼                                         │
  │ P3.4 routing 命中率 ≥ 85% acceptance (含       │
  │      Semantic Router v2 验证 + token budget)   │
  └─────────────────────┬───────────────────────────┘
                        │
                        ▼
v0.4.0 Stabilize (2-3 周)
  ┌─────────────────────────────────────────────────┐
  │ P4.1 dogfooding benchmark 公开                  │
  │       │                                         │
  │       ▼                                         │
  │ P4.2 co-maintainer + Sponsors + stale-bot      │
  │       │                                         │
  │       ▼                                         │
  │ P4.3 routing audit log + ADR 全集 + v1.0-RC    │
  └─────────────────────────────────────────────────┘

并行机会：
- P1.1 ↔ P1.2 schema 与 CI 骨架 (已 happened ✅)
- P2.2 (execute-task) ↔ P2.3 (extension category) 在 P2.1 完成后可并行
- P4.1 benchmark ↔ P4.2 onboarding 文档可并行

依赖硬要求：
- 所有 v0.2 phase 依赖 v0.1 categorization schema (P1.3) + routing engine v1 (P1.4)
- v0.3 plan-feature 依赖 v0.2 execute-task (workflow phase chaining)
- v0.4 benchmark 依赖 P3.4 命中率验收完成
- v0.1 P1.5 (Semantic Router v2) 必须先于 v0.3 P3.4 (命中率验收前提)
```

---

## 下一步

1. ⏳ 用户 review SUMMARY § 三/四 提议的 6 项 spec 修订（PROJECT-SPEC + WORKFLOWS-MVP），approve 后批量 patch
2. ⏳ 起草 `docs/adr/0001-manifest-schema-v1.md`（v0.1 phase 1.1 关键产出）
3. ⏳ 进入 GSD `/gsd-discuss-phase 1`（v0.1.0 phase 1.1 — repo 骨架 + schema frozen）
