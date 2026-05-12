# Phase 1.3 PLAN — Base Profile + Categorization Schema + decision_rules.yaml v1

> **Phase**: v0.1.0 Phase 1.3
> **Goal**: 把 phase 1.2.5 lock 的 categorization schema + decision_rules YAML 落地到代码 + manifest，为 phase 1.4 routing engine v1 实装铺路
> **状态**: ✅ Wave B.2 完成（plan-phase 蓝图 ready）
> **execute-phase 工作量**: 3-5 工作日（v3 ROADMAP § Phase 1.3 行）

---

## § 1 Goal & Scope

### 1.1 Goal

落地 categorization schema + decision_rules.yaml v1 + base profile install + AgentDefinition factory contract — 让 phase 1.4 routing engine v1 实装时**只需读 schema + YAML + contract 即可启动**，不再修订 wedge。

### 1.2 In Scope

- **Schema layer 落地**: ADR 0007 errata + manifest schema 加 3 字段 + tests (B1-B3)
- **decision_rules.yaml v1 落地**: 6 category × ≥ 12 rules MVP + Priority arbitrate logic (B4)
- **Base profile install**: `harnessed install-base` 独立子命令 (B5)
- **ui-ux-pro-max install path 实测**: 路径 B 主推 + 路径 A specimen (B6)
- **AgentDefinition factory contract draft**: 12 字段完整版 (B7 — 仅 draft，不实装代码)
- **A7 守恒持续 + ci.yml A7 step iterate 1-7** (B8)

### 1.3 Out of Scope（推 phase 1.4+）

- Routing engine 主流程实装（main-process-driven `claude plugin install` + `/reload-plugins` + AgentDefinition factory invoke）— phase 1.4 范围
- 6 category × decision rules **实际 routing execute**（phase 1.3 仅 schema + YAML + 仲裁 logic 代码 unit）— phase 1.4 集成
- Semantic Router L2（embedding kNN）+ DAG resolver — phase 1.5 范围
- decision_rules COLLECT / RULE_ORDER 等其他 DMN hit policy — phase 1.4+ 评估
- decision_rules cmd-shape 字段（如 cmd / args）+ 配套 security gate 扩展 — phase 1.4 ADR 0008 评估

---

## § 2 7-Wave 拓扑

```
Wave 0 (前置, 30 min)
  T1.1 ADR 0007 errata 起草 (手工编辑) → tag adr-0007-accepted
  T1.2 ci.yml A7 step iterate 1-6 → 1-7

         │
         ▼

Wave 1 (Schema 实装, 60-90 min)
  T2.1 src/manifest/schema/spec.ts 加 3 字段 (category/install_type/decision_rules)
  T2.2 corepack pnpm build:schema (artifact 重新生成)
  T2.3 3 个 unit test 文件 (manifest-validate.{category,install-type,decision-rules}.test.ts)
       tests 202+1 → ≥ 215+1 (+12 cell)

         │
         ▼

Wave 2 (decision_rules.yaml v1 + arbitrate logic, 90 min)
  T3.1 .planning/decision_rules.yaml v1 起草 (6 category × ≥ 12 rules)
  T3.2 src/routing/decisionRules.ts (parse + Ajv validate + < 50 行 arbitrate)
  T3.3 unit tests for decisionRules (≥ 8 cell)

         │
         ▼

Wave 3 (Base profile install, 60-90 min)
  T4.1 src/cli/install-base.ts (独立子命令 D-9 + D-11 三态输出)
  T4.2 src/cli.ts wire registerInstallBase (8 个 register fn 之一)
  T4.3 tests/unit/cli-install-base.test.ts (≥ 5 cell)

         │
         ▼

Wave 4 (ui-ux-pro-max install path 实测, 30 min)
  T5.1 scripts/probe/ui-ux-pro-max-install.sh (shell probe — 不入 CI)
  T5.2 manifests/skill-packs/ui-ux-pro-max.yaml (视实测决定 install method:
       路径 A 通过 → cc-plugin-marketplace + marketplace_source / 路径 B → git-clone-with-setup)
  T5.3 progress.md F36 finding (实测结果记录)

         │
         ▼

Wave 5 (AgentDefinition factory contract draft, 45 min)
  T6.1 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md ≥ 150 行
       - 12 字段完整 schema (含 disallowedTools / memory / maxTurns / background / effort)
       - factory function signature + AgentDefinition shape
       - skills 字段 fail-fast 路径 (主进程预 install)
       - no-COMPLETE 路径 (ralph-loop retry × 20 + maxTurns × 50)
       - F33 verbatim COMPLETE mitigation 段

         │
         ▼

Wave 6 (Cross-OS CI verify, push verify)
  T7.1 push origin → CI 三平台全绿 + A7 step iterate 1-7 verify
  T7.2 如 CI red → hotfix batch (类 phase 1.2.1 hotfix 模式)

         │
         ▼

Wave 7 (Docs + ship, 60 min)
  T8.1 update STATE.md phase 1.3 SHIPPED + 进度 3/16 phases 18.75%
  T8.2 update VERIFICATION.md (B1-B8 复现命令清单 ≥ 100 行)
  T8.3 main agent decide push tag v0.1.0-alpha.3-base-profile (or 留 phase 1.4 ship 一起)
```

---

## § 3 任务表（detail in task_plan.md）

| Wave | Task ID 范围 | task 数 | 关键产出 |
|---|---|---|---|
| 0 | T1.1-T1.2 | 2 | ADR 0007 + adr-0007-accepted tag + ci.yml A7 iter 1-7 |
| 1 | T2.1-T2.3 | 3 | spec.ts 加 3 字段 + 3 unit test 文件 (+12 cell) |
| 2 | T3.1-T3.3 | 3 | decision_rules.yaml v1 + decisionRules.ts arbitrate + tests (+8 cell) |
| 3 | T4.1-T4.3 | 3 | install-base.ts + wire + cli-install-base.test (+5 cell) |
| 4 | T5.1-T5.3 | 3 | shell probe + ui-ux-pro-max manifest + finding F36 |
| 5 | T6.1 | 1 | AgentDefinition factory contract draft |
| 6 | T7.1-T7.2 | 2 | CI verify + 可能 hotfix |
| 7 | T8.1-T8.3 | 3 | STATE.md / VERIFICATION.md / push tag 决策 |

**总 task 数**: 20 atomic（含 Wave 6 的可选 hotfix）+ 内部分子文件（T2.3 / T3.3 / T4.3 各含多文件）

---

## § 4 接口契约（phase 1.4 prereq）

phase 1.4 routing engine v1 实装时需要的契约 — phase 1.3 必须 ship 这些：

| 契约 | phase 1.3 ship | phase 1.4 消费 |
|---|---|---|
| `manifest.spec.category: 'meta' \| 'engineering' \| 'design' \| 'content' \| 'testing' \| 'search'` | T2.1 spec.ts | routing engine category match |
| `manifest.spec.install_type: 'skill' \| 'mcp' \| 'npm' \| 'git'` | T2.1 spec.ts | routing engine 选择 install adapter |
| `manifest.spec.decision_rules: { trigger?, default_expert?, arbitration_rule?, override_signals?[] }` | T2.1 spec.ts | routing engine arbitrate input |
| `.planning/decision_rules.yaml` v1 schema | T3.1 + T3.2 | routing engine load + parse |
| `arbitrate(rules, taskContext): Rule \| null` (Priority Hit Policy) | T3.2 src/routing/decisionRules.ts | routing engine L1 router |
| `harnessed install-base` 命令 | T4.1 + T4.2 | 用户 setup 入口 |
| `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 12 字段 schema | T6.1 | phase 1.4 factory implementation reference |

---

## § 5 风险登记（来自 ASSUMPTIONS § E）

| ID | 风险 | 级别 | mitigation |
|---|---|---|---|
| **R1** | TypeBox 嵌套 robust 性（array of object）| M | T2.3 unit tests 含 nested array+object reject case + 借鉴 phase 1.1 marketplace_source pattern |
| **R2** | A7 守恒不慎修改 ADR 0001 main body | H | CI A7 step 自动 enforce + commit 前 paranoid check `git diff adr-0001-accepted -- docs/adr/0001-*.md` |
| **R3** | yaml schema v1→v2 migration 路径 | M | decision_rules.yaml `version: 1` 字段 reserved + phase 1.4+ migration script |
| **R4** | security gate 与 schema 设计协调 | M (mitigated) | D1.3-X "decision_rules v1 不含 cmd-shape 字段" + phase 1.4 ADR 0008 评估扩展 |
| **R5** | install-base 对 phase 2.1 placeholder method 处理 | L (locked) | D-11 三态输出 (installed/skipped/failed)；deferred ≠ failure |
| **R6** | vercel-labs/skills issue #373 路径 A 阻塞 | H | T5.1 shell probe 验证 + T5.2 路径 B git-clone-with-setup adapter 兜底 (D1.3-5 lock) |
| **R7** | Cross-OS CI 三平台兼容（Win shell probe）| L | shell probe 用 bash + cross-OS 兼容写法（参 phase 1.1.1 H4 mock-claude-cli.sh 模式）|
| **R8** | AgentDefinition factory contract draft 不实装代码 误推迟 phase 1.4 | L | D-12 lock — 仅 draft 文档；phase 1.4 plan-phase 启动时直接消费 |

---

## § 6 接受标准（goal-backward verify）

phase 1.3 ship 必须证明：

1. **B1** ADR 0007 accepted + adr-0007-accepted tag pushed + 6 baseline tag iterate verified（CI A7 step 实测全绿 7 ADR）
2. **B2** `corepack pnpm validate:schema` 通过 + manifest 含 3 新字段（category / install_type / decision_rules）
3. **B3** `corepack pnpm test` 三平台全绿 + tests ≥ 215+1 skipped
4. **B4** `.planning/decision_rules.yaml` 通过 Ajv strict validate + arbitrate function 单测覆盖（≥ 8 cell）
5. **B5** `node ./dist/cli.mjs install-base --help` 显示子命令 + dry-run 输出 10 base manifest install plan + skipped 4 phase-2.1 placeholder
6. **B6** ui-ux-pro-max install path 实测结果 logged 到 `progress.md` § B F36 + `manifests/skill-packs/ui-ux-pro-max.yaml` 创建（视实测 install method 决定）
7. **B7** `wc -l docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` ≥ 150 + grep "12 字段\|disallowedTools\|memory\|maxTurns\|background\|effort\|skills.*string\[\]" 全 hit
8. **B8** CI run 三平台 success + A7 step iterate 1-7 全绿 + ADR 0001-0006 main body diff 0

---

## § 7 Wave Acceptance Checkpoint

| Wave | 完成验收子集 |
|---|---|
| Wave 0 | adr-0007-accepted tag 打 + ci.yml A7 step 1-7 + commits 干净 |
| Wave 1 | typecheck/lint/test 全绿 + tests ≥ 215+1 + schema artifact 重新生成 |
| Wave 2 | decision_rules.yaml v1 schema validate 通过 + arbitrate function 单测 ≥ 8 cell + tests ≥ 223+1 |
| Wave 3 | `harnessed install-base --help` 输出含子命令 + tests ≥ 228+1 |
| Wave 4 | shell probe 跑通（Mac/Linux 至少 1 平台）+ ui-ux-pro-max manifest + F36 finding logged |
| Wave 5 | AgentDefinition factory contract draft ≥ 150 行 + 12 字段 grep hit |
| Wave 6 | CI 三平台 success + A7 iterate 1-7 实测全绿 |
| Wave 7 | STATE.md/VERIFICATION.md update + B1-B8 8/8 ✅ |

---

## § 8 Phase 1.3 vs phase 1.4 边界（重申）

phase 1.3 = **schema layer + base profile + 数据准备**（manifest 加字段 / decision_rules.yaml 落地 / install-base 命令 / contract draft）

phase 1.4 = **engine layer + execution**（main-process-driven routing engine 实装 + AgentDefinition factory invoke + 6 category × decision rules **执行** + research workflow E2E）

**phase 1.3 不实装 routing engine**。
