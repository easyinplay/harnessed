# harnessed REQUIREMENTS

> 功能需求清单（每条带唯一 ID + 来源 + 版本 + 验收标准）
> 来源：PROJECT-SPEC v2、WORKFLOWS-MVP v2、research/SUMMARY.md（4/4 HIGH）
> 最后更新：2026-05-15（v0.1.0 milestone audit reconciliation — ADR 0006 架构修订 re-scope 回填；详 `.planning/v0.1.0-MILESTONE-AUDIT.md` § 5）

> **ADR 0006 re-scope 说明**：phase 1.2.5 架构修订把项目从"装配主义包管理器"重定位为"完整三层栈方法论的可执行 engine"。部分 v0.1 原始需求的实现形态因此变更 —— ROADMAP 已 v3 重排，本文件 traceability 表同步回填（R2.1 re-scoped / R4.3+R4.4 superseded / R4.1 adjusted / R1.3+R3.4 partial）。

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

### R1.2 4 种 type 支持（6 种 install method 子枚举 — 见 ADR-0003 errata）
- **描述**：4 type 不变（`cc-plugin` / `cc-skill-pack` / `mcp-server` / `cli-binary`），每 type 内 install.method 支持 6 种子方法
- **来源**：SUMMARY § 二 冲突 2 决议 + ADR 0003 errata（mcp-stdio-add / mcp-http-add 拆为独立 method）
- **版本**：v0.1（其中 cli-npm + mcp-stdio Day 1）；v0.2（cc-plugin-marketplace + npx-skill / git-clone-with-setup）
- **验收**：6 种 method 全部覆盖 9 个 MVP 上游（其中 mcp-http-add 是 schema-only placeholder，phase 1.2+ 接真上游）

### R1.3 DAG resolver Day 1
- **描述**：install engine 不是 sequential，是先解析全图再拓扑排序；循环依赖 schema 校验阶段拒绝
- **来源**：R04 § 失败模式 4（brew bundle issue #21416） + P0#4
- **版本**：v0.1
- **验收**：人为构造循环依赖 manifest 时立即 reject；并行 install 顺序符合拓扑序
- **状态（v0.1.0 audit）**：⚠️ **Partial** — phase 1.5 ship `src/routing/dag.ts` 142L Kahn iterative + cycle detect（E_DAG_CYCLE）+ 14 unit cell，wired into `engine.route` 签名。**推 phase 2.x 完成**：(1) manifest `depends_on` / `install_after` 字段（spec.ts 暂无）；(2) production caller（`install-base` 当前用 alphabetical glob 非拓扑序，无代码传 `opts.dagNodes`）；(3) 循环依赖 reject 当前在 `resolveDag` 运行时，REQ 原文要求的 schema 校验阶段 reject 待 `depends_on` 字段落地后实装。触发条件：phase 2.2 execute-task workflow 出现真实多 manifest 依赖图。

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
- **状态（v0.1.0 audit）**：🔄 **Re-scoped by ADR 0006** — 单体 `harnessed setup` 命令拆分为 `harnessed install-base`（一键装齐 base profile 10 manifest，D-9）+ per-installer dry-run / explicit confirm / `.harnessed-backup/` 写入（ADR 0004 INSTALLER-CONTRACT.md 6 契约）。能力已 v0.1 ship（dry-run default + diff + 4-Level confirm + rollback 1 命令），命令形态变更。原"启动自检自身版本"未单独实装为命令 — 推 phase 2.4 doctor 完整版（version staleness check 与 6-month upstream stale check 一起做）。

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

### R2.4.1 doctor 健康检查主流程 MIN 5 check（v0.2 — Phase 2.4 D-01）
- **描述**：`harnessed doctor` MIN 5 check（Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL 校验）+ `--json` flag CI 友好输出 + status 三档（pass/warn/fail）exit policy；weekly cron / upstream_health / uninstall 4 步 fallback DEFER v0.3+ 评估
- **来源**：ROADMAP L113-114 + .planning/phase-2.4/ASSUMPTIONS B-01~B-07 + 2.4-CONTEXT D-01
- **版本**：v0.2
- **验收**：`harnessed doctor --json | jq '.summary'` 输出 pass/warn/fail；5 check 全 method 独立；warn exit 0 / fail exit 1
- **状态**：In Progress (Phase 2.4 W1)

### R2.4.2 EE-4 plan-checker 4 维量化阈值 schema（v0.2 — Phase 2.4 D-02）
- **描述**：`routing/plan-review-schema.yaml` NEW yaml-only SSOT 4 维（file_references_verified / reference_sources_real / concrete_acceptance / business_logic_assumptions）+ `scripts/run-plan-checker.mjs` walker + `.claude/agents/gsd-plan-checker.md` project-local override 量化输出节；BLOCKER auto-rerun DOWN-SCOPE 为 CI fail + manual rerun（auto-spawn 推 v0.3.0）
- **来源**：.planning/intel/omc-comparison.md L74-82 + L286 EE-4 PENDING + ASSUMPTIONS B-08~B-15
- **版本**：v0.2
- **验收**：`node scripts/run-plan-checker.mjs .planning/phase-X.Y/` 输出 4 维 score + verdict（PASS / WARNING / BLOCKER）+ BLOCKER 时 `::error::` annotation + exit 1
- **状态**：In Progress (Phase 2.4 W2)

### R2.4.3 README CI counter integrity gate B 路径（v0.2 — Phase 2.4 D-03）
- **描述**：`.github/workflows/ci.yml` 加 ~15L yaml step 三计数一致才 PASS（line-start + bold 精度 grep regex 排除 enumeration line 命中）+ Wave 0 pre-flight FIX README drift 后才 push；H3 root-cause-class 第 3 次复发根治
- **来源**：.planning/STATE.md H3 backlog + ASSUMPTIONS B-16 + B-17 + 2.4-CONTEXT D-03
- **版本**：v0.2
- **验收**：CI step 三计数 grep -cE 精度匹配（`^- \*\*Phase 2\.[1-9] shipped\*\* ✅` + `^- \*\*Acceptance bar [A-Z]1-[A-Z]8 8/8 \(Phase 2\.[1-9]\)\*\* ✅` + L44 N/4 counter numerator）；mismatch → exit 1
- **状态**：In Progress (Phase 2.4 W0)

### R2.4.4 Dashboard C 路径 SessionStart hook auto-install（v0.2 — Phase 2.4 D-04 § 3.1）
- **描述**：`src/installers/ccHookAdd.ts` NEW 7th installer（sister mcp-stdio-add / mcp-http-add naming）+ 3 处 schema enum 加（InstallType +'hook' / TypeEnum +'cc-hook' / install.method +'cc-hook-add'）+ `manifests/cc-hooks/dashboard-autospawn.yaml` 第一 fixture；JSON deep-merge 进 `~/.claude/settings.json` hooks 块 + idempotent + backup + verify
- **来源**：.planning/intel/dashboard-handoff-2026-05-16.md § 3.1 + ASSUMPTIONS B-20~B-22
- **版本**：v0.2
- **验收**：`harnessed install dashboard-autospawn --dry-run` exit 0；`harnessed uninstall dashboard-autospawn` 干净清理；3 处 enum grep count 全命中
- **状态**：In Progress (Phase 2.4 W3)

### R2.4.5 Dashboard C 路径 STATE.md SSE watcher（v0.2 — Phase 2.4 D-04 § 3.2）
- **描述**：`scripts/dashboard.mjs` +~50L `fs.watch('.planning/STATE.md')` + debounce 500ms + SSE `/events` endpoint（zero-dep — text/event-stream HTTP 内建 + EventSource 浏览器原生 reconnect）替 WebSocket；localhost-only bind `127.0.0.1` 防外部连接
- **来源**：.planning/intel/dashboard-handoff-2026-05-16.md § 3.2 + ASSUMPTIONS B-23 + B-24 + B-27
- **版本**：v0.2
- **验收**：SSE `/events` stream 含 `state-changed` event；client 用 EventSource 替 polling；零 npm dep import；localhost-only bind verify
- **状态**：In Progress (Phase 2.4 W3)

### R2.4.6 Dashboard C 路径 多项目支持（v0.2 — Phase 2.4 D-04 § 3.3）
- **描述**：`scripts/dashboard.mjs` +~80L `/api/projects` endpoint 读 `~/.claude/harnessed-projects.json` 配置 + 左栏 project selector + URL routing `?project=<path>` + `history.pushState` no-reload；首次创建 auto-init（默认 cwd as first project）
- **来源**：.planning/intel/dashboard-handoff-2026-05-16.md § 3.3 + ASSUMPTIONS B-25
- **版本**：v0.2
- **验收**：`/api/projects` 返回 JSON list；client dropdown 切换 project 无 reload；auto-init from cwd
- **状态**：In Progress (Phase 2.4 W3)

### R2.4.7 ralph-loop Windows 兼容 sentinel（v0.2 — Phase 2.4 F5 / R5.3 extension）
- **描述**：`tests/routing/ralph-loop-win-sentinel.test.ts` NEW 5 fixture（simple-complete / multi-iter / max-iter-exceeded / subagent-spawn-mock / timeout）+ CI matrix `if: runner.os == 'Windows'` + `shell: bash`；anti-redo discipline NOT 30 sample（Phase 2.3 sister 不重做）
- **来源**：ROADMAP L115 + ASSUMPTIONS B-30 + 2.4-CONTEXT D2.4-18
- **版本**：v0.2
- **验收**：Win matrix 跑 5 fixture 全 pass；subagent-spawn fixture mock（real CC SDK 需 ANTHROPIC_API_KEY OOS）
- **状态**：In Progress (Phase 2.4 W4)

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
- **状态（v0.1.0 audit）**：⚠️ **Partial** — phase 1.4 routing engine 选源 OK（research workflow E2E dry-run 路径完整），但 segment-by-source merge 模块依赖真实 spawn 输出 —— 随 F40-2 `@anthropic-ai/claude-agent-sdk` deps 一起 deferred v0.2+（phase 2.2 execute-task workflow + ralph-loop full integration 时实装真实 `query()` spawn）。

---

## R4. Routing 引擎 B+C 混合（v0.1 起）

### R4.1 routing/*.md SSOT schema
- **描述**：B 层（skill description）+ C 层（UserPromptSubmit hook）共享同一份 yaml frontmatter；CI 校验 routing schema 合法性
- **来源**：SPEC § 9
- **版本**：v0.1
- **验收**：改一处两层同步生效；schema validator 单测全绿
- **状态（v0.1.0 audit）**：🔧 **Adjusted by ADR 0006** — SSOT 形态从 `routing/*.md` + B/C 双层 yaml frontmatter 改为 `routing/decision_rules.yaml` v2 单一 SSOT（main-process-driven routing engine 消费，D1.2.5-3）。CI 校验仍在（Ajv-validated loader + schema unit test 全绿）。"改一处两层同步生效"的双层语义被 main-process engine 单一编排取代 —— B/C 双层不再适用。

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
- **状态（v0.1.0 audit）**：🔄 **Superseded by ADR 0006** — C 层 UserPromptSubmit hook 机制被 **main-process-driven routing engine 取代**（D1.2.5-3 — subagent 不能动态 install/reload skill，路由必须主进程跑）。"hook 失败降级回 B 层" 的语义由 routing engine 三层兜底取代：L1 keyword arbitrate → L2 semanticRouter（v0.1 stub）→ L3 fallback_supervisor LLM（`src/routing/engine.ts`）。hook 子系统不再是 v0.1 范围。

### R4.4 hook 安全约束（重写）
- **描述**：routing/*.md 配置纯 yaml/md；harnessed 自带的 hook 脚本严格审计 + install 时 print 全文 + 不调任意 shell（Node.js 内置 fs/child_process 受控调用）；1-key uninstall 完全清理（settings.json hook entry + script files）
- **来源**：SPEC § 8.3 修订（SUMMARY § 二 冲突 3 决议） + R03 § 5.4
- **版本**：v0.1
- **验收**：install 时 100% print hook 代码；uninstall 后 settings.json + script files 零残留
- **状态（v0.1.0 audit）**：🔄 **Superseded by ADR 0006** — 同 R4.3，main-process-driven routing engine 取代 hook 机制，harnessed 不再 ship 自带 hook 脚本，hook 安全审计/print/uninstall 不适用。security gate 由 phase 1.1.1 H7 `checkCmdString` shell-escape 过滤 + ADR 0004 installer 6 契约（dry-run + diff + confirm + no-silent-failure）承接（R9.3 satisfied）。

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

## R20. v2.0 Architecture Refactor (workflow runtime-load + capability abstraction + gate yaml-eval)

> **Trigger**: v1.0.0~v1.0.4 ship 暴露 fundamental flaw — workflow.yaml 是 build-artifact NOT runtime config; 上游 / Claude Code 平台 / 优秀新组件升级时每次调整需 1-2 day full npm release cycle (user catch 2026-05-22 post v1.0.4 ship)
>
> **Decision (user authorized 2026-05-22)**: 跳 v1.0.5 incremental → 直接 v2.0 大重构;post-refactor workflow 调整 time = 5 min user edit yaml + immediate effect (NOT npm release cycle)

### R20.1 workflow.yaml runtime-load
- **描述**：`~/.harnessed/workflows/<name>/workflow.yaml` user-editable;harnessed runtime reload on invocation;NOT bundled into binary
- **版本**：v2.0
- **验收**：用户改 ~/.harnessed/workflows/plan-feature/workflow.yaml 后 next /plan-feature slash 立即生效 NO build / NO publish

### R20.2 capability abstraction
- **描述**：workflow.yaml uses abstract `capability: governance-gate` NOT 字面 `gstack /office-hours`;`~/.harnessed/capabilities.yaml` maps abstract → concrete (user 可改 swap upstream)
- **版本**：v2.0
- **验收**：用户改 capabilities.yaml swap `governance-gate: <other-tool> /<other-cmd>` 后 workflow 自动消费新 upstream NO yaml edit

### R20.3 gate yaml-eval grammar
- **描述**：phase 可声明 conditional `gate: phase.type == 'new_feature' AND open_decisions >= 2`;lightweight expr-eval lib (jsep / expr-eval / 自写 mini-parser)
- **版本**：v2.0
- **验收**：simple bug fix scenario phase.type='bug_fix' → gstack 战略层 phase 自动 skip + 透明声明 (sister CLAUDE.md "拿不准 → 跳过" 铁律)

### R20.4 CLAUDE.md 判据 yaml registry
- **描述**：harnessed startup parse user CLAUDE.md "三层判据" 节 → emit `~/.harnessed/rules/judgment.yaml`;workflow gate eval consume judgment.yaml
- **版本**：v2.0
- **验收**：用户改 CLAUDE.md 三层判据 → harnessed setup --reload 后 workflow gate eval 反映新判据

### R20.5 upstream capability dynamic discovery
- **描述**：`harnessed doctor` invokes `claude --help` / `gstack /commands` / `gsd --version` 探测上游 commands;emit `~/.harnessed/capabilities.discovered.yaml`
- **版本**：v2.0
- **验收**：上游升级 (gstack 改命令名) 后 doctor 自动 detect + warn user capabilities.yaml 需更新

### R20.6 manifest user-dir hot-reload
- **描述**：`~/.harnessed/manifests/` user-editable;`harnessed install <name>` 优先 user-dir → fallback npm package canonical;支持 add new manifest 不需 PR
- **版本**：v2.0
- **验收**：用户写 ~/.harnessed/manifests/tools/my-custom.yaml → harnessed install my-custom 可用

### R20.7 NEW workflows ship
- **描述**：`workflows/research/` (Tavily/Exa/ctx7 多源调研 v1.0 ROADMAP 承诺) + `workflows/verify-work/` (Stage ④ verify composition: gsd-verify-work + code-review + gstack/review + code-simplifier)
- **版本**：v2.0
- **验收**：harnessed setup 后 `/research` + `/verify-work` slash commands 可用

### R20.8 mattpocock 招式 in-workflow routing
- **描述**：workflow.yaml phase 可声明 `mattpocock_skills: ['/zoom-out', '/diagnose']` → 运行时 trigger;sister Phase 1.5 routing engine 100% accuracy + 23 routing rules 真正消费
- **版本**：v2.0
- **验收**：execute-task phase 03 conditional trigger `/diagnose` if error encountered

### R20.9 BREAKING CHANGES migration
- **描述**：workflow.yaml schema v1 → v2;old v1.x yaml 可 work via compat shim 1 minor cycle (v2.0 + v2.1) then deprecate;`harnessed migrate v1→v2` cli helper
- **版本**：v2.0
- **验收**：v1.x 用户 npm install -g harnessed@2.0 后 旧 workflow.yaml 仍 work (compat shim) + `harnessed migrate` 1-step upgrade

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

> **v0.1.0 milestone audit reconciliation（2026-05-15）** — v0.1 需求状态回填，详 `.planning/v0.1.0-MILESTONE-AUDIT.md`。
> Status 取值：`Done` / `Partial`（部分实装 + 推后续 phase）/ `Re-scoped`（ADR 0006 形态变更，能力已 ship）/ `Superseded`（ADR 0006 机制取代，不再适用）/ `Adjusted`（ADR 0006 形态调整）/ `Pending` / `Locked`。

| Req | Milestone | Status | 备注（v0.1.0 audit） |
|-----|-----------|--------|---------------------|
| R1.1 schema v1 冻结 | v0.1 | ✅ Done | ADR 0001 baseline-tag + CI A7 守恒（phase 1.1） |
| R1.2 4 type + 6 method | v0.1 / v0.2 | ✅ Done (v0.1 portion) | cli-npm + mcp-stdio real，4 placeholder → phase 2.1（phase 1.2） |
| R1.3 DAG resolver | v0.1 → 2.x | ⚠️ Partial | Kahn + cycle detect + 14 cell ship；depends_on 字段 + production caller + schema-层 reject 推 phase 2.x（phase 1.5） |
| R1.4 严格 schema 校验 | v0.1 | ✅ Done | additionalProperties:false + Ajv strict + negative tests（phase 1.1） |
| R2.1 setup 自检 | v0.1 → 2.4 | 🔄 Re-scoped (ADR 0006) | 拆分为 install-base + per-installer dry-run/confirm/backup；version staleness check 推 phase 2.4 doctor 完整版 |
| R2.2 doctor health | v0.1 / v0.2 | ✅ Done (v0.1 basics) | Node≥22 + MCP scope + jq + Win bash 4 check（phase 1.2）；完整版 phase 2.4 |
| R2.3 audit | v0.2 | Pending | — |
| R2.4 audit log | v0.4 | Pending | — |
| R3.1 多源调研路由 | v0.1 | ✅ Done (v0.1 dry-run) | research.ts → routing engine；real spawn deferred v0.2+（phase 1.4） |
| R3.2 MCP --scope project | v0.1 | ✅ Done | mcpStdioAdd.ts hardcode + doctor 检查（phase 1.2） |
| R3.3 Windows npx cmd /c | v0.1 | ✅ Done | spawn.ts win32 分支（phase 1.2） |
| R3.4 多源合并策略 v1 | v0.1 → v0.2 | ⚠️ Partial | 选源 OK；segment-by-source merge 随 F40-2 SDK dep deferred v0.2+ |
| R4.1 routing SSOT | v0.1 | 🔧 Adjusted (ADR 0006) | SSOT 改为 decision_rules.yaml v2 单一 SSOT；B/C 双层被 main-process engine 取代 |
| R4.2 命中率 ≥ 85% 验收 | v0.3 | Pending | phase 3.4（30 sample × 多 model × stability） |
| R4.3 hook 降级 | v0.1 | 🔄 Superseded (ADR 0006) | main-process-driven routing engine 三层兜底取代 hook 降级机制（D1.2.5-3） |
| R4.4 hook 安全 | v0.1 | 🔄 Superseded (ADR 0006) | 同 R4.3；security gate 由 checkCmdString + ADR 0004 installer 6 契约承接 |
| R5.1-R5.2 cross-OS | v0.1 | ✅ Done | CI 三平台全绿 + spawn.ts platform 分支（phase 1.1+） |
| R5.3 ralph Win | v0.2 | Pending | phase 2.4 |
| R6.1-R6.5 execute-task | v0.2 | Pending | — |
| R7.1-R7.6 plan-feature + checkpoint | v0.3 | Pending | — |
| R8.1-R8.5 稳定期 | v0.4 | ✅ Done | Phase 4.1+4.2+4.3 ship 2026-05-18~19 — benchmark public + community infra + audit log NEW infra + ADR 全集 20 ADRs + Sponsors |
| R10.1 audit log --filter consumer | v0.5 | Pending | Phase 5.1 — `harnessed audit log --filter <jq>` CLI subcommand consume `.harnessed/audit.log` JSONL producer |
| R10.2 state.ts concurrent write lock | v0.5 | Pending | Phase 5.1 — #BU carry — lockfile / wx exclusive create 保护 writeCurrentWorkflow + engineHook |
| R10.3 harnessed uninstall command | v0.5 | Pending | Phase 5.2 — #BV carry — per-method uninstall handler (7 install method 反向) |
| R10.4 path traversal regex hardening | v0.5 | Pending | Phase 5.2 — #AH carry — resolveAlias + manifest path regex extend 5+ attack vectors |
| R9.1 单 maintainer 缓解 | v0.1 起持续 | ✅ Done (v0.1) / Ongoing | YAML 数据格式 + 9 ADR baseline-tag + CI A7 + signed_by |
| R9.2 透明度 | v0.1 起持续 | ✅ Done (v0.1) / Ongoing | matched_rule 打印 + ADR for 非常规决策 + 无静默 skip |
| R9.3 安全 | v0.1 起持续 | ✅ Done (v0.1) / Ongoing | install dry-run + diff + confirm + checkCmdString + license whitelist |
| R9.4 上游 breaking change | v0.1 起持续 | ✅ Done (v0.1 basics) / Ongoing | upstream_health 字段；weekly cron + aliases 推 v0.3/v0.4 |
| R9.5 范围蔓延防御 | v0.1 起持续 | ✅ Done (v0.1) / Ongoing | RX.1-RX.6 reject list locked + workflow 数量约束 |
| RX.1-RX.6 拒绝清单 | 全周期 | 🔒 Locked | — |

**v0.1.0 milestone 结算**：20 个 v0.1-tagged 需求 — 14 Done + 2 Partial（R1.3/R3.4，推后续 phase）+ 2 Superseded（R4.3/R4.4，ADR 0006 取代）+ 1 Re-scoped（R2.1，ADR 0006 形态变更）+ 1 Adjusted（R4.1，ADR 0006 形态调整）。无遗留"忘做"缺口 — Partial/Re-scoped/Superseded/Adjusted 均有明确去向。
