# harnessed REQUIREMENTS

> 功能需求清单（每条带唯一 ID + 来源 + 版本 + 验收标准）
> 来源：PROJECT-SPEC v2、WORKFLOWS-MVP v2、research/SUMMARY.md（4/4 HIGH）
> 最后更新：2026-05-11

---

## 命名约定

- **R{N}.{M}**：R 开头 + 大类编号 + 小项编号
- **大类（R1-R9）**：按里程碑或关注点分组
- **来源**：标注 SPEC § 章节 / WORKFLOWS § 章节 / research RNN 编号
- **版本**：v0.1 / v0.2 / v0.3 / v0.4 / v1.0+
- **状态**：Pending / In Progress / Done

---

## R1. Manifest 引擎（v0.1）

### R1.1 manifest schema v1 冻结
- **描述**：manifest schema v1 在第一行 installer 代码前必须 tag 锁定，后续改 schema 走 ADR 流程
- **必填字段**：
  - `apiVersion: harnessed/v1`（仿 K8s CRD，R04 P0）
  - `name`、`type`（4 type 之一）
  - `install`（含 method 子枚举：cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / cli-npm-or-npx / mcp-stdio-add / mcp-http-add）
  - `verify`（健康检查命令或文件路径）
  - `license`（whitelist：MIT / Apache-2.0 / BSD-3-Clause / ISC / 0BSD）
  - `notice`（安装时显示的关键提示）
  - `upstream_health: { stability, last_check, fallback_action }`（R04 P0）
  - `signed_by: <maintainer github username>`（R04 P0）
  - `component_type`（command / behavior-rule / mcp-tool / cli-binary，R02 § 6）
- **可选字段**：`mutually_exclusive_with[]`（v0.2 dogfooding 时观察）、`deprecation_marker`（v0.3 启用）
- **来源**：SPEC § 8.1 + R03 § 6.5 + R04 P0
- **版本**：v0.1
- **验收**：JSON Schema validator 单测 100% 覆盖；任意非法 manifest 立即 reject 不进入运行时

### R1.2 4 种 type 支持（5 种 install method 子枚举）
- **描述**：4 type 不变（`cc-plugin` / `cc-skill-pack` / `mcp-server` / `cli-binary`），每 type 内 install.method 支持 5 种子方法
- **来源**：SUMMARY § 二 冲突 2 决议
- **版本**：v0.1（其中 cli-npm + mcp-stdio Day 1）；v0.2（cc-plugin-marketplace + npx-skill / git-clone-with-setup）
- **验收**：5 种 method 全部覆盖 9 个 MVP 上游

### R1.3 DAG resolver Day 1
- **描述**：install engine 不是 sequential，是先解析全图再拓扑排序；循环依赖 schema 校验阶段拒绝
- **来源**：R04 § 失败模式 4（brew bundle issue #21416） + P0#4
- **版本**：v0.1
- **验收**：人为构造循环依赖 manifest 时立即 reject；并行 install 顺序符合拓扑序

### R1.4 schema 严格 JSON Schema 校验
- **描述**：学 Kubeconform `-strict` 模式，未声明字段 / 类型不匹配立即 fail
- **来源**：R04 P0#7
- **版本**：v0.1
- **验收**：CI 校验任意 schema 偏差不进 main

---

## R2. Setup / Doctor / Audit 命令（v0.1 → v0.2）

### R2.1 `harnessed setup` 启动自检
- **描述**：每次执行 setup 时检查自身版本，老旧时建议 `npx harnessed@latest`；改用户文件前 dry-run + explicit confirm + 写入 `.harnessed-backup/`
- **来源**：SPEC § 8.4 + R04 P0#5（CRA 装机即过期反面教材）
- **版本**：v0.1
- **验收**：30 秒内完成；零静默改文件；rollback 1 命令完成

### R2.2 `harnessed doctor` health check
- **描述**：检查 Node 版本、MCP scope、上游 git origin URL 未篡改、6 月无 commit 上游标 stale；Windows 环境额外检查 jq + bash（Git Bash 路径）
- **来源**：R04 P1#8 + R02 § 7 红旗 + R03 红旗 6
- **版本**：v0.1（基础）→ v0.2（Windows + stale + audit 集成）
- **验收**：每个失败项给出可复制粘贴的修复命令；weekly cron 自动跑

### R2.3 `harnessed audit` 命令
- **描述**：检查上游 git origin URL 未被替换为恶意 fork；输出审计报告
- **来源**：R04 P1#10
- **版本**：v0.2
- **验收**：模拟 origin 篡改场景立即报警

### R2.4 路由透明度 audit log
- **描述**：每次路由决策追加到 `.harnessed/audit.log`（来源 routing 文件 + 备选 + 实际命令）
- **来源**：R01 § 7 + SPEC § 3 透明度优先
- **版本**：v0.4
- **验收**：用户可 grep 排错；100% 决策可追溯

---

## R3. Research workflow（v0.1）

### R3.1 多源调研路由
- **描述**：根据查询类型自动选 Tavily / Exa / ctx7；分支策略走 `routing/search.md` SSOT
- **来源**：WORKFLOWS § Workflow 1
- **版本**：v0.1
- **验收**：30 真实查询样本 ≥ 85% 命中（v0.1 内部基线）

### R3.2 MCP installer 强制 `--scope project`
- **描述**：避开 v2.1.122 user scope bug；所有 mcpServers 修改走 `claude mcp add/remove` CLI 而非直接编辑 `~/.claude.json`
- **来源**：R03 § 3.3 红旗 1 + § 3.4 issue #15797
- **版本**：v0.1
- **验收**：installer 内单测覆盖；用户 ~/.claude.json 不被直接修改

### R3.3 Windows native npx 自动注入 `cmd /c`
- **描述**：跨平台兼容性硬要求
- **来源**：R03 § 3.7
- **版本**：v0.1
- **验收**：Windows native CI 矩阵全绿（不依赖 WSL）

### R3.4 多源合并策略 v1
- **描述**：v0.1 简单按来源分段展示，不做 dedup；v0.2+ 基于 URL hash 去重
- **来源**：WORKFLOWS § 1 设计决策
- **版本**：v0.1（v0.2 升级）
- **验收**：用户可见每个来源独立段落；命令实际执行透明

---

## R4. Routing 引擎 B+C 混合（v0.1 起）

### R4.1 routing/*.md SSOT schema
- **描述**：B 层（skill description）+ C 层（UserPromptSubmit hook）共享同一份 yaml frontmatter；CI 校验 routing schema 合法性
- **来源**：SPEC § 9
- **版本**：v0.1
- **验收**：改一处两层同步生效；schema validator 单测全绿

### R4.2 路由命中率 ≥ 85% 验收
- **描述**：30 真实任务样本（Haiku/Sonnet/Opus 各 ≥ 8） + token budget 监控（skill description 总和 ≤ 1% context window）
- **来源**：SPEC § 5.1 修订 + R03 § 2.4
- **版本**：v0.3
- **验收**：实测命中率 ≥ 85%；Haiku 不低于 84%

### R4.3 hook 失败降级
- **描述**：hook 失败时降级回 B 层 soft_hint，不阻塞用户；都失败时直接问用户
- **来源**：SPEC § 9 + § 8.5
- **版本**：v0.1
- **验收**：模拟 hook fail 场景不阻塞；显式告知降级原因

### R4.4 hook 安全约束（重写）
- **描述**：routing/*.md 配置纯 yaml/md；harnessed 自带的 hook 脚本严格审计 + install 时 print 全文 + 不调任意 shell（Node.js 内置 fs/child_process 受控调用）；1-key uninstall 完全清理（settings.json hook entry + script files）
- **来源**：SPEC § 8.3 修订（SUMMARY § 二 冲突 3 决议） + R03 § 5.4
- **版本**：v0.1
- **验收**：install 时 100% print hook 代码；uninstall 后 settings.json + script files 零残留

---

## R5. Cross-OS 支持（v0.1 起）

### R5.1 CI 矩阵 macOS + Linux + Windows native
- **描述**：Day 1 启用三平台矩阵，红了必须修不允许 disable
- **来源**：SPEC § 11 修订（R03 红旗 6 + R04 P0）
- **版本**：v0.1
- **验收**：所有 PR 必须三平台全绿

### R5.2 npx 跨平台 wrapper
- **描述**：Windows native 自动注入 `cmd /c`
- **来源**：R03 § 3.7
- **版本**：v0.1
- **验收**：Windows CI npx 调用零失败

### R5.3 ralph-loop Windows 兼容
- **描述**：doctor 检查 jq + bash（Git Bash 而非 WSL 路径）；workflow 模板强制 `--max-iterations`（issue #1429 兜底）
- **来源**：R02 § 7 红旗 + R03 红旗 6 + WORKFLOWS § Workflow 2 设计决策
- **版本**：v0.2
- **验收**：Windows native CI ralph-loop 完整链路通过

---

## R6. Execute-task workflow（v0.2）

### R6.1 5-phase 流水
- **描述**：clarify（superpowers brainstorming）→ code（karpathy-skills 心法）→ test（条件 TDD）→ deliver（ralph-loop COMPLETE）→ pause human review
- **来源**：WORKFLOWS § Workflow 2
- **版本**：v0.2
- **验收**：30 样本子任务（UI / backend / algorithm 各 10）全跑通

### R6.2 karpathy-skills 作为 behavior-rule 实装
- **描述**：CLAUDE.md 注入策略 + 多源 merge 规则（harnessed / 用户私有 / 项目级）+ override 优先级 + 一键关闭
- **来源**：R02 § 6
- **版本**：v0.2
- **验收**：用户 CLAUDE.md 不被破坏；卸载完全清理；merge 顺序文档化

### R6.3 mattpocock 按需召唤
- **描述**：`routing/execute.md` 定义触发关键词（"陌生模块"→zoom-out, "排错"→diagnose, "澄清规格"→grill-with-docs）；用户也可手动调用
- **来源**：WORKFLOWS § Workflow 2 设计决策
- **版本**：v0.2
- **验收**：触发关键词命中率 ≥ 80%（子目标）

### R6.4 ralph-loop 模板分类型
- **描述**：completion criteria 模板按任务类型分（`templates/ralph-criteria/{ui,backend,algorithm}.md`），v0.2 内置 3 个；强制 `--max-iterations`
- **来源**：WORKFLOWS § Workflow 2 设计决策 + R02 issue #1429
- **版本**：v0.2
- **验收**：3 模板单测覆盖；max-iterations 在 schema 中 required

### R6.5 plugin 卸载 4 步 fallback
- **描述**：`claude plugin uninstall --prune` + 4 步 fallback（CLI / 手动清 settings.json / 删 plugin 目录 / 重启 CC）
- **来源**：R03 § 1.3 issue #52456
- **版本**：v0.2
- **验收**：模拟 TUI 卸载失败场景仍能完整清理

---

## R7. Plan-feature workflow + checkpoint（v0.3）

### R7.1 5-phase 流水（reference implementation）
- **描述**：gstack-decision（governance）→ brainstorm（execution，UI 任务时 +ui-ux-pro-max）→ gsd-discuss（orchestration）→ gsd-plan → persist（planning-with-files）
- **来源**：WORKFLOWS § Workflow 3 + SPEC § 10 reference
- **版本**：v0.3
- **验收**：30 plan-feature 真实场景全跑通；CEO veto 时 halt_workflow 不再续

### R7.2 checkpoint 分层（摘要 vs archive）
- **描述**：`.harnessed/checkpoints/`（摘要 < 1k token，进 context）+ `.harnessed/archive/`（完整原始产出，不进 context，仅供回溯）
- **来源**：SPEC § 12
- **版本**：v0.3
- **验收**：单 checkpoint < 1k token；后续 phase 只读 checkpoint 不读 archive

### R7.3 `harnessed resume`
- **描述**：session 中断时从 `.harnessed/current-workflow.json` 找到当前 phase，重读 checkpoint 续跑
- **来源**：SPEC § 12 + WORKFLOWS § 跨 workflow 共享设计 4
- **版本**：v0.3
- **验收**：人为中断 session 后 resume 不丢上下文

### R7.4 gstack 命令前缀探测
- **描述**：doctor 探测三选一（默认 `/office-hours` / `--no-prefix` / `--prefix gstack-`）写入 `.harnessed/config.json`；workflow `invokes` 字段变量插值
- **来源**：R02 § 1 + WORKFLOWS § Workflow 3 设计决策
- **版本**：v0.3
- **验收**：用户三种前缀场景任一都跑通

### R7.5 manifest deprecation marker + aliases.yaml
- **描述**：上游改名时 `manifests/aliases.yaml` 重定向；deprecation_marker 字段在 doctor / install 阶段显式提示
- **来源**：R04 P2#12 + #13
- **版本**：v0.3
- **验收**：模拟上游改名场景 install 通过 + 提示

### R7.6 "known good" 版本组合
- **描述**：每个 harnessed 版本冻结一组通过 e2e 的上游版本 lock
- **来源**：R04 P1#9
- **版本**：v0.3
- **验收**：`harnessed install --known-good` reproducible

---

## R8. Dogfooding + 稳定期（v0.4）

### R8.1 dogfooding benchmark 公开
- **描述**：30 真实任务 + 路由决策 + 命中正误 + 上游升级 e2e → `docs/benchmarks/v0.4.md`
- **来源**：R01 § 9 + SPEC § 11 v0.4 验证目标
- **版本**：v0.4
- **验收**：原始数据公开，任何人可复现

### R8.2 co-maintainer 招募窗口
- **描述**：6 月窗口 + `docs/MAINTAINER-ONBOARDING.md`；外部新人 30 分钟可跑通 dev 环境
- **来源**：SPEC § 5.6 + R04 § 失败模式 3
- **版本**：v0.4
- **验收**：窗口期内至少 1 个外部 PR merge

### R8.3 stale-bot + issue templates
- **描述**：GitHub Action stale workflow 自动关闭 90 天无活动 issue；issue/PR 模板标准化
- **来源**：R04 P2#14
- **版本**：v0.4
- **验收**：stale-bot 上线；issue 模板使用率 ≥ 80%

### R8.4 公开 ADR 全集
- **描述**：所有非常规决策写 ADR 入仓（schema / 不 vendor / B+C 混合 / aliases / known-good 至少 5 份）
- **来源**：R04 P2#15
- **版本**：v0.4
- **验收**：`docs/adr/` ≥ 5 份；index.md 列出全集

### R8.5 GitHub Sponsors 启用
- **描述**：Sponsors page + README badge
- **来源**：SPEC § 5.6
- **版本**：v0.4
- **验收**：Sponsors 链接公开 + 可接受捐赠

---

## R9. 长期非功能需求

### R9.1 单 maintainer 年掉队率缓解
- **描述**：降低 fork 成本（schema 数据格式 + ADR 公开）+ CI 自动化（不依赖人工 vigilance）+ dogfooding 内在动力 + `signed_by` 字段
- **来源**：R04 § 失败模式 3（Avelino 论文 36%/年） + SUMMARY § 互补 5
- **版本**：v0.1 起持续
- **验收**：所有自动化指标 weekly CI 跑；fork 后 30 分钟可跑 dev 环境

### R9.2 透明度（路由 + ADR + 降级）
- **描述**：每次路由决策可见输出（来源 routing 文件 + 备选 + 实际命令）；所有非常规决策走 ADR；上游不可用 fallback 时显式告知，禁止静默 skip
- **来源**：SPEC § 3 + § 8.5 + R01 § 7
- **版本**：v0.1 起持续
- **验收**：路由决策 100% 可追溯；降级零静默

### R9.3 安全（hook 审计 / supply chain）
- **描述**：hook 严格审计 + install 时 print 全文 + 1-key uninstall；install 默认 dry-run + diff 预览 + explicit confirm；vendor/ 准入 license whitelist + 体积 ≤ 500KB
- **来源**：SPEC § 8.2 + § 8.3 + § 8.4
- **版本**：v0.1 起持续
- **验收**：hook 安装零隐藏代码；vendor/ CI 体积监控；MCP 修改走 CLI 不直接编辑配置文件

### R9.4 上游 breaking change 缓解
- **描述**：manifest.lock.yaml 4 类策略 + weekly CI 跑 critical path e2e + `harnessed upgrade` 输出 changelog diff + explicit confirm；upstream_health 字段 + deprecation marker + aliases.yaml
- **来源**：SPEC § 5.5 + § 7 修订 + R04 § 失败模式 1 + 6
- **版本**：v0.1（基础）→ v0.3（aliases / deprecation）→ v0.4（持续 weekly）
- **验收**：weekly CI 失败时自动开 issue 不动 lock；upgrade 路径 100% explicit

### R9.5 范围蔓延防御
- **描述**：v1.0 前 freeze workflow 数量为 3；feature request 三问（这是 packaging 还是 PM 问题？/ 上游能解决吗？/ 一次性 escape hatch 够不够？）
- **来源**：R04 § 失败模式 10（brew bundle / LangChain） + SUMMARY § 六 新增风险
- **版本**：v0.1 起持续
- **验收**：v1.0 前 workflow 数量保持 3；非必要 feature 全部 reject

---

## 拒绝清单（v1.0 前明确不做）

| ID | 不做的事 | 来源 |
|----|---------|------|
| RX.1 | 在 v1.0 前加新 workflow type | SUMMARY § 五 拒绝清单 + R04 P3 |
| RX.2 | wrap 上游 API（不写 `harnessed.invokeBrainstorming()` 二次抽象） | 同上 |
| RX.3 | 云端 manifest registry | 同上 |
| RX.4 | manifest 动态求值 / shell escape（`${shell command}` / `eval` / `!ruby/regexp`） | 同上 |
| RX.5 | 在 v0.5 前实现跨 harness | 同上 |
| RX.6 | 可视化 dashboard | 同上 |

---

## Traceability（需求 → 里程碑）

| Req | Milestone | Status |
|-----|-----------|--------|
| R1.1 schema v1 冻结 | v0.1 | Pending |
| R1.2 4 type + 5 method | v0.1 / v0.2 | Pending |
| R1.3 DAG resolver | v0.1 | Pending |
| R1.4 严格 schema 校验 | v0.1 | Pending |
| R2.1 setup 自检 | v0.1 | Pending |
| R2.2 doctor health | v0.1 / v0.2 | Pending |
| R2.3 audit | v0.2 | Pending |
| R2.4 audit log | v0.4 | Pending |
| R3.1-R3.4 research | v0.1 | Pending |
| R4.1 routing SSOT | v0.1 | Pending |
| R4.2 命中率 ≥ 85% 验收 | v0.3 | Pending |
| R4.3 hook 降级 | v0.1 | Pending |
| R4.4 hook 安全 | v0.1 | Pending |
| R5.1-R5.2 cross-OS | v0.1 | Pending |
| R5.3 ralph Win | v0.2 | Pending |
| R6.1-R6.5 execute-task | v0.2 | Pending |
| R7.1-R7.6 plan-feature + checkpoint | v0.3 | Pending |
| R8.1-R8.5 稳定期 | v0.4 | Pending |
| R9.1-R9.5 长期 NFR | v0.1 起持续 | Pending |
| RX.1-RX.6 拒绝清单 | 全周期 | Locked |
