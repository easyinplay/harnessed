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

## v0.1.0 — manifest 引擎 + research workflow ✅ SHIPPED 2026-05-15

> **里程碑已归档** — 6/6 phase 完成（1.1 / 1.2 / 1.2.5 / 1.3 / 1.4 / 1.5）。完整 phase 详情 + milestone summary + key decisions 见 **[`.planning/milestones/v0.1.0-ROADMAP.md`](milestones/v0.1.0-ROADMAP.md)**;需求结算见 **[`.planning/milestones/v0.1.0-REQUIREMENTS.md`](milestones/v0.1.0-REQUIREMENTS.md)**;审计见 **[`.planning/v0.1.0-MILESTONE-AUDIT.md`](v0.1.0-MILESTONE-AUDIT.md)**(passed, post-reconciliation)。

**交付**:manifest schema v1 frozen + main-process-driven routing engine v1 + DAG resolver(Kahn)+ Semantic Router L2 stub + research workflow E2E + base profile installer + engineering 23 招式 phase routing schema。9 ADR + 9 baseline tag(A7 守恒)+ 318+3 tests + CI 三平台全绿。ADR 0006 wedge 重定位:"装配主义包管理器" → "完整三层栈方法论的可执行 engine"。

<details>
<summary>6 phase 一行索引</summary>

- **Phase 1.1** repo 骨架 + manifest schema v1 frozen + ADR 0001-0003 — ✅ 2026-05-12
- **Phase 1.2** cli-npm + mcp-stdio installer + CLI 子命令骨架 + ADR 0004-0005 — ✅ 2026-05-12(含 1.2.1 hotfix)
- **Phase 1.2.5** Architecture revision(ADR 0006 wedge 重定位 + ROADMAP v3 重排)— ✅ 2026-05-12(INSERTED)
- **Phase 1.3** base profile + categorization schema + decision_rules.yaml v1 + ADR 0007 — ✅ 2026-05-13(含 1.3.1 hotfix)
- **Phase 1.4** routing engine v1 + research workflow E2E + 30 sample + ADR 0008 — ✅ 2026-05-13
- **Phase 1.5** DAG resolver + Semantic Router L2 stub + engineering 23 招式 phase routing + ADR 0009 — ✅ 2026-05-14(含 1.5.1 sister review remediation)

</details>

---

## v0.2.0 — Sub-task Loop + Extension Installers ✅ SHIPPED 2026-05-16

> 🎯 **v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED** (2026-05-16) — Phase 2.1 + Phase 2.2 ship 2026-05-15；Phase 2.3 + Phase 2.4 ship 2026-05-16；4 ADR (0010-0013) + 4 baseline tag + 5 milestone tag accumulate (v0.2.0-alpha.1-installers + alpha.2-execute-task + alpha.3-extension-mvp + alpha.4-doctor + 🎯 **v0.2.0** 大 tag)；543+4 tests；archive `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` + audit `.planning/v0.2.0-MILESTONE-AUDIT.md`。next: v0.3.0 plan-feature workflow + checkpoint discuss-phase 启动。



> **phase 2.0 prereq notes（phase 1.5 ship 后 explicit 启动 prereq — T8.4）**
> phase 2.0 plan-phase 启动**直接消费 phase 1.5 输出**，无需重做。phase 1.5 ship 后 frozen 的 **8 接口契约**（`.planning/phase-1.5/PLAN.md` § 4 1:1）：
> 1. `resolveDag(nodes: DagNode[]) → DagResolveResult`（`src/routing/dag.ts` 142L）— Kahn 拓扑排序三态 union
> 2. `semanticRouter.match(prompt, threshold=0.85) → Promise<SemanticMatchResult>`（`src/routing/semanticRouter.ts` 81L）— v0.1 stub，v0.2+ 仅替换 stub body 不改 contract
> 3. `SemanticMatchResult` type — `{ matched, rule, confidence }` 三态 narrow
> 4. `engine.route` 升级（`src/routing/engine.ts`）— arbitrate 前插 resolveDag + 后兜底 semanticRouter.match；保留 fallback_supervisor 三层兜底
> 5. `decision_rules.yaml v2 mattpocock_phases:` 段 schema — 4 phase × skills array + triggers array
> 6. `AgentDefinition` v1.1 14 字段（`src/routing/agentDefinition.ts` 191L）— + `initialPrompt`（Stable）+ `criticalSystemReminder_EXPERIMENTAL`（Experimental）
> 7. `ManifestSpec` 升级（`src/manifest/schema/spec.ts`）— TypeBox `Type.Union` 4-value phase enum + `Type.Object` triggers（**项目用 TypeBox 不是 zod**）
> 8. `<promise>COMPLETE</promise>` XML wrapper 协议（`src/routing/systemPrompt.ts` 53L + `src/routing/lib/promiseExtract.ts` 32L）— phase 2.1+ `--add-plugin ralph-wiggum` 1:1 顺滑切换
>
> **8 支柱 100% capture verify 完成** — A1' engineering 5 rules / A5' mattpocock_phases / A7' triggers semantic L2 stub 三项静态 schema + verify roadmap 全部 ship 本 phase（A1' / A5' / A7' v0.1 全部 CLOSED）；A7' v0.2+ 真实 embedding kNN 推 phase 2.x。
> **phase 2.0 entry**：execute-task workflow 主线 + ralph-loop full integration + 4 placeholder installer 实装。

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

## v0.3.0 — plan-feature workflow + checkpoint ✅ SHIPPED 2026-05-17

> 🎯 **v0.3.0 MILESTONE 4/4 SHIPPED & ARCHIVED** (2026-05-17) — Phase 3.1 + Phase 3.2 ship 2026-05-16~17；Phase 3.3 + Phase 3.4 ship 2026-05-17；4 ADR (0014-0017) + 4 baseline tag + 5 milestone tag accumulate (v0.3.0-alpha.1-checkpoint + alpha.2-plan-feature + alpha.3-aliases-known-good + alpha.4-routing + 🎯 **v0.3.0** 大 tag)；660+→701+ tests (+41 W1) → 543+→701+ (+158 milestone cumulative)；archive `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` 3-file triplet (MILESTONE-AUDIT.md inaugurate at milestones/ subdir vs sister v0.2.0 inline)。next: v0.4.0 dogfooding benchmark + co-maintainer 招募 + ADR 全集 + 路由审计日志 discuss-phase 启动。



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

- **Phase 3.1：checkpoint 引擎 + harnessed resume + compact 协议** ✅ SHIPPED 2026-05-16
  - 摘要 < 1k token；archive 完整；`current-workflow.json` 状态机
  - 验收：人为中断 session 后从 03 phase 续跑成功 ✅ (DOGFOOD-T5.5.md)
  - ship 总结：6 Waves W0-W5 全 ship 27+ atomic commits；checkpoint TEMPLATE 摘要 (zero LLM call) + archive 双轨 + harnessed resume 12th CLI + compact 75% placeholder + T4.4 closure infra activation 闭环 (D-04 WIRE-IN 实证)；engine.ts 195→200L Karpathy clean ≤200L restored (W-01 PRIMARY extract engineHook.ts 49L)；0 `as any` cast (W-04)；ADR 0014 9 章节 errata accepted；tests 543→596 (+53)；14 ADR + 14 baseline tag；F1-F8 8/8
- **Phase 3.2：gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装** ✅ SHIPPED 2026-05-17
  - 三选一探测；`invokes` 字段插值；governance 层 pause + on_veto
  - 验收：用户 gstack 装哪种前缀都能跑通
- **Phase 3.3：aliases.yaml + deprecation marker + known-good 版本组合** ✅ SHIPPED 2026-05-17
  - manifest 重定向；doctor warning；release 流程冻结 known-good lock
  - 验收：模拟上游改名场景 install 通过 ✅ (T2.1 install-aliases.test.ts 3 fixture R7.5 + T2.2 install-known-good.test.ts 2 fixture R7.6)
  - ship 总结：3 Waves W0-W2 全 ship 16+ atomic commits；aliases.yaml RICH 5-field redirect (D-01 schema 12th surface) + DOCTOR-ONLY-WARN install 安静 (D-02 1-line resolveAlias surgical + doctor 7th check 人读 audit) + known-good YAML manifest lazy-load 版本 lock (D-03 schema 13th surface) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 (b) LOCKED) + Wave 0 backlog 3 项一次根治；ADR 0016 9 章节 errata accepted；tests 623→659+ (+36)；16 ADR + 16 baseline tag；schemaVersion 11→13 surface；manifest-domain colocation 3rd consumer 闭环 (Phase 3.1 checkpoint-domain + Phase 3.2 workflow-domain + Phase 3.3 manifest-domain)；F1-F8 8/8
- **Phase 3.4：路由命中率 ≥ 85% 验收 + token budget 监控** ✅ SHIPPED 2026-05-17
  - 30 样本（Haiku/Sonnet/Opus 各 ≥ 8）；description 总 token 近似算法 + 阈值告警 ✅ DONE
  - 验收：实测命中率达标 + token 监控仪表落地 ✅ (30/30 = 100% 远超 ≥85% bar 15% headroom; per-tier Sonnet/Haiku/Opus 100/100/100 all exceed lower bounds)
  - ship 总结：3 Waves W0-W2 全 ship 12+ atomic commits；30 sample REAL HISTORICAL dogfood (D-01 + D-02 RUN ENGINE per-sample routing.arbitrate dispatch zero mock; tests/routing/phase-3.4-routing-hit-rate.test.ts 30/30 100%) + token budget doctor 8th check (D-03 Buffer.byteLength /4 zero-dep estimateTokens + D-04 DOCTOR-ONLY-WARN status='warn' ≠ fail; check-token-budget.ts 48L PRIMARY helper 4th family member sister Phase 3.1+3.2+3.3 precedent延袭; doctor.ts 195→199L ≤200L Karpathy clean B-03 NOT invoked) + W0.1 STRATEGIC institutionalize 4 D-decisions D1-D4 (D1 single-SoT trim + D2 ship-time T6.N cadence + D3 3-rules gate warn-only round 1 + D4 ship-process integrate) + W0 backlog 5 项一次根治 (W0.2 install.ts pkg.version Path A DEFERRED #AD resolve + W0.3 versions/0.3.0-known-good.yaml 8 real entries DEFERRED #AC resolve + W0.4 path traversal spike DEFER Phase 4.0 DEFERRED #AE registered + W0.5 SAMPLES.md 30-row REAL HISTORICAL mining)；F1-F8 8/8；ADR 0017 9 章节 errata accepted；17 ADR + 17 baseline tag；660→701+ tests (+41)；triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0 pushed to origin 2026-05-17 (CI run 25992781663 3-OS green post-hotfix 554b82b)
  - **DEFERRED carry-forward to Phase 4.0+**: #AE path traversal regex hardening + #AF D3 gate ENFORCE flip (Phase 3.5 OR v0.4.0 W0 first task) + #AG D1 STATE.md ≤150L tighten (v0.4.0+) + #AH (same as #AE)

### 关键风险

- ⚠️ **长链路 context 爆炸**（plan-feature 4 上游产出 30k+ token）→ checkpoint 分层 + 强制 compact，后续 phase 只读 checkpoint 不读 archive
- ⚠️ **gstack 命令前缀漂移**（用户可配置）→ workflow 模板不能硬编码，必须插值
- ⚠️ **路由命中率不达标 / Haiku 差距大** → token budget 调优 + B 层 description 重写 + C 层 hook 触发增强

---

## v0.4.0 — dogfooding benchmark + 稳定期 (2 days) — 🎯 **SHIPPED & ARCHIVED 2026-05-19** (Phase 4.1+4.2+4.3 全 ship 3/3; sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭)

> **Note (D-04 HYBRID 2-clock reconcile R-3 mitigation)**: 2-3 周 internal ship clock 已验证 Phase 4.1 + 4.2 ≤1 day each (sister 1-phase/day cadence延袭); external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5/v1.0 (NOT counted in v0.4.0 ship timeline; sister T3 DEFERRED #BB resolve via HYBRID 2-clock LOCK).

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

- **Phase 4.1：dogfooding benchmark 数据采集 + 公开格式定义** ✅ SHIPPED (2026-05-18)
  - 30 任务执行 + 命中率统计 + 上游升级 e2e 录像/日志 → docs/benchmarks/v0.4.md NEW 302L D-02 FULL per-task disclosure 30/30 100% (sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE D-01 single SoT 0-day overhead) + docs/benchmarks/v0.4-upgrade-e2e.log NEW 122L D-03 TEXT LOG zero-dep 4-section × 2 manifests (ctx7 npm-cli + gstack git-clone-with-setup planner Discretion #5 install_method 多样性) + docs/CONTRIBUTING-BENCHMARK.md NEW 30L D-04 MANUAL re-run instructions (sister Karpathy YAGNI > weekly cron; 0 CI infra; sister Phase 3.4 D-02 install path 安静 一致 NOT 不足)
  - 验收: docs/benchmarks/v0.4.md review-ready ✅ (4 D-decisions activated 闭环 D-01 REUSE + D-02 FULL + D-03 TEXT LOG + D-04 MANUAL + 4 sneak blocks守门 + R8.1 acceptance "原始数据公开任何人可复现" satisfied per CONTRIBUTING-BENCHMARK + Phase 3.4 routing harness 30/30 PASS verbatim cite + 反"美化"声明 footer anchored ROADMAP L222)
  - W0 backlog 3 项一次根治: W0.1 D3 ENFORCE flip warn-only round 1 → ENFORCE round 2 (DEFERRED #AF ✅ RESOLVED; sister Phase 2.1 → 2.2 1-phase cadence延袭) + W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md (sister Phase 3.4 W2 T2.2 1st-implementation → 2nd-iter institutionalize verify M2 backlog discharge pattern stable) + W0.5 conditional D1 SIZE_LIMIT round 2 tighten 200→150 DEFERRED #BA carry-forward Phase 4.2 W0 LOW priority (post-W0.3 STATE 143L insufficient ≥10L headroom threshold per § 7.1 decision tree DEFER path active)
  - PATTERNS § 5 risk #3 mitigation 3 NO 守门: NO ADR 0018 (pure dogfood publication NOT architectural decision) + NO ci.yml A7 iter (0 diff verified T2.6) + NO triple tag (single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only; sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭 reserves milestone close tags for Phase 4.3)
  - DEFERRED carry-forward Phase 4.2+: #BA SIZE_LIMIT tighten + #BB T3 1 phase/day cadence assessment (external dependency phase risk surface 真正 fires) + #BC v0.5+ benchmark expand evaluation + #BD regex 2-pass validation pattern lock + #AH path traversal regex hardening
- **Phase 4.2：co-maintainer onboarding 文档 + GitHub Sponsors + stale-bot** ✅ SHIPPED (2026-05-18)
  - co-maintainer 招募窗口启动 + 90 天 stale-bot 上线 + Sponsors 启用 → docs/MAINTAINER-ONBOARDING.md EXPAND 50L → 111L D-01 LOCKED additive (preserve 6+2 sections + ADD 6 NEW A-F) + .github/workflows/stale.yml NEW 52L D-02 actions/stale@v10 (R2 § 2 finding correction NOT @v9) 60+30 split issue+PR + .github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml + config.yml 4 NEW yml form-based per planner Discretion #3 + .github/FUNDING.yml NEW 3L D-03 single tier $1+ Karpathy YAGNI + README L8 Sponsors badge + L190-194 footer EXPAND planner Discretion #1 TOP + FOOTER both
  - 验收: R8.2 "外部新人 30 分钟可跑通 dev 环境" ✅ + R8.3 "stale-bot 自动关闭 90 天无活动 issue + issue 模板使用率 ≥ 80%" ✅ (blank_issues_enabled false 100% adoption defender) + R8.5 "Sponsors 链接公开 + 可接受捐赠" ✅ (user manual prereq Sponsors account activation external — FALLBACK ship forward-compatible per RESEARCH § 17.2 U1)
  - W0 backlog 1 项 #BA conditional: D1 SIZE_LIMIT round 2 tighten 200→150 DEFER path active per § 8.2 decision tree (post-T0.1 STATE 150L insufficient ≥10L headroom; carry-forward Phase 4.3 W0 LOW priority; 2-phase consecutive DEFER decision sister Phase 4.1 W0.5 cadence延袭)
  - W0.1 D2 cadence iter 3 institutionalize verify 3rd-iter terminus stable signal ≥3-iter pattern (sister M2 backlog discharge pattern stable beyond Phase 4.1 W0.3 2nd-iter; sister 5-recurrence terminus heuristic confirmed)
  - PATTERNS § 5 R-5 mitigation 3 NO 守门: NO ADR 0018 (pure community-infra publish NOT architectural decision) + NO ci.yml A7 iter (0 diff verified T2.6) + NO triple tag (single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only; sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭 reserves milestone close tags for Phase 4.3); 4 D-decisions activated 闭环 D-01 EXPAND additive + D-02 @v10 90-day issue+PR + D-03 single tier $1+ + D-04 HYBRID 2-clock process-level
- **Phase 4.3：R8.1 audit log + R8.4 ADR backfill + CHANGELOG + 🎯 v0.4.0 milestone close** ✅ SHIPPED (2026-05-19)
  - R8.1 NEW infra: src/audit/log.ts NEW 66L D-01 LOCKED JSONL append-only + 12-field AuditRecordSchema TypeBox + src/audit/hook.ts NEW 34L PRIMARY helper 5th family member + src/routing/engine.ts MODIFY surgical 5L comment shrink + 4 emitAudit call sites (1 success + 3 spawn-err) post-MODIFY 200L EXACT ≤200L Karpathy hard limit HIGH RISK R-1 MITIGATED + tests/audit/{log,hook}.test.ts 11 fixtures (8+3) cells; D-02 NEW forward-only NOT backfill (sister D-04 STATE COLLAPSE 5-recurrence terminus 教训守 single-SoT discipline cross-ref ADR 0019)
  - R8.4 ADR backfill: ADR 0018 NEW 218L 9-section PRIMARY anchor (R8.1 audit log architecture) + ADR 0019 NEW 47L 5-section backfill (Phase 3.3 D-04 STATE dual-SoT COLLAPSE pattern) + ADR 0020 NEW 38L 5-section backfill (Phase 4.2 D-04 HYBRID 2-clock disambiguation) + docs/adr/README.md MODIFY +12 entries 0009-0020 catchup (bonus 0009-0017 gap fix per RESEARCH key finding #4 low-effort high-transparency value); final 20 ADRs 远超 R8.4 验收 "至少 5 份" bar; A7 守恒 ADR 0001-0017 main body 0 diff verified
  - v1.0-RC: CHANGELOG.md NEW 41L Keep-a-Changelog format manual init (D-04 LOCK NOT Conventional Changelog auto-gen YAGNI); ci.yml A7 step iter 0017→0018 (4 surgical edits; STRICT ordering BEFORE adr-0018-accepted tag per STRIDE T-4.3-07)
  - 🎯 v0.4.0 milestone close: 3-file archive triplet `.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` sister v0.3.0 close cadence延袭 (MILESTONE-AUDIT 含 sister #BO § 7 R-5 mitigation Cadence Patterns 节 explain Phase 4.1+4.2 R-5 publish-only vs Phase 4.3 ARCHITECTURAL meta-disambiguation per M-01 PhaseClass LOCK); triple tag LOCAL CREATE adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0 (NO push per CLAUDE.md commit safety; user controls)
  - W0 backlog 2 项一次根治: W0.1 D2 cadence iter 4 REINFORCE trim Phase 4.2 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (sister Phase 4.2 W0.1 3rd-iter terminus → Phase 4.3 W0.1 4th-iter REINFORCE pattern stable signal beyond ≥3-iter; sister 5-recurrence terminus heuristic confirmed pattern stable beyond founder-effort) + W0.2 D1 SIZE_LIMIT 200→175 round 2 RELAX FLIP (DEFERRED #BA ✅ RESOLVED — sister Phase 4.1 W0.5 + Phase 4.2 W0.2 2-iter defer chain resolved per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA" decision; 25L tighten + 17L safety headroom)
  - PATTERNS § 5 R-5 mitigation NOT invoked Phase 4.3 (ARCHITECTURAL phase class M-01 LOCK NOT publish-only sister Phase 4.1+4.2 mode); full ship cadence applies ADR 0018 + ci.yml A7 iter + triple tag (sister v0.3.0 close cadence延袭, NOT Phase 4.1+4.2 single-baseline-only)
  - DEFERRED resolved Phase 4.3: #BA ✅ (W0.2 FLIP) + #BO ✅ (W2 T2.13 § 7 R-5 rationale 节) + #BP ✅ (discuss-phase M-01 LOCK) + #BT ✅ (commit c52f44e doctor Promise.all pre-discharge); DEFERRED carry-forward v0.5+: #BU state lock LOW + #BV uninstall command + #BC/#BD/#BE/#BF/#BN + #AH path traversal regex hardening; DEFERRED PERMANENT: #1/#BL sdkSpawn `as any` + #5/#BM AgentDef SDK 耦合 (ADR 0009 F40-2 documented gap)
  - Tests baseline: 709 → 720+ (+11 NEW fixtures W1 T1.4+T1.5; existing routing tests 0 regression including T0.2 sister test fix `250L > 200L → 250L > 175L` baseline update)

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
