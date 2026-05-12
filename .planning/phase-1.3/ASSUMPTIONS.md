# Phase 1.3 ASSUMPTIONS — Lock Document

> **目的**: phase 1.3 plan-phase SSOT — 8 acceptance bar status + P0 灰色地带 lock + D1.3-1 ~ D1.3-N 决策追溯
> **依据**: KICKOFF.md + RESEARCH.md (R2 4 P0) + PATTERNS.md (R1 D-7 ~ D-12) + ASSUMPTIONS phase 1.2.5 § C/D/E 沿袭
> **状态**: ✅ Wave B.1 完成

---

## § A 8 Acceptance Bar 状态（phase 1.3 ship 前必须 8/8 ✅）

| # | acceptance bar | Capture 文档 | 状态 |
|---|---|---|---|
| **B1** | ADR 0007 errata 起草 + accepted + `adr-0007-accepted` tag | `docs/adr/0007-categorization-schema-errata.md` (W execute T1.1) | ⏳ |
| **B2** | manifest schema 加 3 字段（`category` enum 6 / `install_type` enum 4 / `decision_rules` optional Object）| `src/manifest/schema/spec.ts` 修改（W execute T2.1）— **新 Pattern L spec-level metadata 加法** | ⏳ |
| **B3** | schema unit tests ≥ 12 cell；tests 202+1 skipped → ≥ 215+1 skipped | `tests/unit/manifest-validate.{category,install-type,decision-rules}.test.ts` 3 文件（W execute T2.3）| ⏳ |
| **B4** | `.planning/decision_rules.yaml` v1 + Priority arbitrate logic（≤ 50 行）| `.planning/decision_rules.yaml` + `src/routing/decisionRules.ts`（W execute T3.1+T3.2）| ⏳ |
| **B5** | `harnessed install-base` 独立子命令（D-9 R1 推荐）| `src/cli/install-base.ts` + `src/cli.ts` registerInstallBase（W execute T4.1+T4.2）| ⏳ |
| **B6** | ui-ux-pro-max install path 实测（D1.2.5-11）— shell probe + adapter 兜底 | `scripts/probe/ui-ux-pro-max-install.sh` + `manifests/skill-packs/ui-ux-pro-max.yaml`（W execute T5.x）| ⏳ |
| **B7** | AgentDefinition factory contract draft ≥ 100 行（**12 字段**完整版 — R2 Q4 实证）| `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`（W execute T6.1）| ⏳ |
| **B8** | Cross-OS CI 三平台全绿 + A7 step iterate 1-6 → 1-7（含 ADR 0007）+ ADR 0001-0006 main body 守恒持续 | `.github/workflows/ci.yml`（W execute T1.2 + T7.1）| ⏳ |

---

## § B P0 灰色地带 Lock

| ID | 决策 | Lock | 理由（含 R1/R2 引用）|
|---|---|---|---|
| **P0-1** | DMN YAML 解析库选型 | **复用 yaml + Ajv + TypeBox + 手写 ≤ 50 行 Priority 仲裁** | R2 § 1.2 — DMN-specific Node.js 生态破碎（`@hbtgmbh/dmn-eval-js` 不支持 PRIORITY / `json-rules-engine` 语义不匹配 / n8n 强耦合）；phase 1.1 stack 已 cover 90% pipeline；零 dep 增长。**[ASSUMED]** v1 仅支持 PRIORITY，COLLECT/RULE_ORDER 等推 phase 1.4+ 评估 |
| **P0-2** | TypeBox 嵌套 Object schema 设计 | **每层 Type.Object 独立声明 `additionalProperties: false`**；`Type.Array(Type.Object({...}))` 嵌套 Ajv 8 strict 完全合法 | R2 § 2 — 复用 phase 1.1 `ccPluginMarketplace.ts:29-37` marketplace_source 嵌套实施 pattern（202+1 skipped 测试全绿验证） |
| **P0-3** | ui-ux-pro-max install path 兜底策略 | **路径 B 主推**：`git-clone-with-setup` install method + 锁 v4-next 分支 tip SHA + 子目录拷贝；**路径 A**（`npx skills add tree URL`）作为 v0.1 specimen 测试不进 production catalog | R2 § 3 — gh api 实证 ui-ux-pro-max 只在 v4-next 分支（main 无 .codex/skills 目录）；vercel-labs/skills issue #373 hardcode `/tree/main/` URL update 必破 v4-next 分支 |
| **P0-4** | AgentDefinition factory contract draft 范围 | **12 字段完整版**（含 phase 1.2.5 RESEARCH-1 § 3.1 漏的 `disallowedTools` / `memory` / `maxTurns` / `background` / `effort` 5 字段）+ `skills: string[]` 主进程预 install fail-fast + verbatim COMPLETE F33 mitigation | R2 § 4 — code.claude.com/docs 2026-05-12 fetch 含官方 `createSecurityAgent` factory 完整示例 |

---

## § C R1 PATTERNS D-7 ~ D-12 Lock（沿袭 phase 1.2 D-1 ~ D-6）

| ID | 决策 | 实施位置 | 来源 |
|---|---|---|---|
| **D-7** | 新加 Pattern L "spec-level metadata 字段加法" — 3 字段加在 SpecSchema 顶层（不加在 installMethods/*.ts），与 phase 1.2.5 marketplace_source 的 method-specific 加法**正交** | `src/manifest/schema/spec.ts` | R1 PATTERNS § 1 |
| **D-8** | ADR 0007 走 ADR 0005 errata 路径（不走 ADR 0006 wedge 路径）| `docs/adr/0007-categorization-schema-errata.md` | R1 PATTERNS D-8 |
| **D-9** | B5 走独立 `install-base` 子命令（不在 `install <name>` 上加 `--base` flag — 避免与现有 6 flag + H1 pre-action gate 冲突）| `src/cli/install-base.ts` 新文件 | R1 PATTERNS D-9 |
| **D-10** | B6 ui-ux-pro-max install path 实测**走 shell probe 不写 vitest**（一次性 verify 不入 CI test suite，避免污染）| `scripts/probe/ui-ux-pro-max-install.sh` | R1 PATTERNS D-10 |
| **D-11** | install-base pre-filter 跳过 phase21Placeholder method（cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / mcp-http-add 4 个 phase 2.1 deferred 不装）+ aggregate 总结按 installed/skipped/failed 三态输出（沿袭 INSTALLER-CONTRACT 契约 6 但放宽 "deferred ≠ failure"） | `src/cli/install-base.ts` 内部 logic | R1 PATTERNS D-11 |
| **D-12** | B7 AgentDefinition factory contract **仅 draft 文档不实装代码**（守 phase 1.3/1.4 边界）| `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` | R1 PATTERNS D-12 |

---

## § D Phase 1.3 决策追溯表 D1.3-1 ~ D1.3-12

| 决策 ID | 内容 | 来源 |
|---|---|---|
| **D1.3-1** | phase 1.3 范围 = schema layer（不实装 routing engine 本身 — phase 1.4 工作）| KICKOFF § "Phase 1.3 与 phase 1.4 边界" |
| **D1.3-2** | manifest schema 3 新字段 = category（6 enum）+ install_type（4 enum，**B-2 1:N 闭合**: skill→{cc-plugin-marketplace, npx-skill-installer} / mcp→{mcp-stdio-add, mcp-http-add} / npm→{npm-cli} / git→{git-clone-with-setup}）+ decision_rules（optional Object — **B-1: per-manifest hint，与 .planning/decision_rules.yaml 全局 rule-set 完全独立 schema**）| ADR 0006 § 1 + § 4 + ASSUMPTIONS phase 1.2.5 D1.2.5-12 + PLAN-CHECK B-1/B-2 fix |
| **D1.3-3** | DMN YAML 库选型 = 复用 yaml + Ajv + TypeBox + 手写 < 50 行 Priority 仲裁 | R2 § 1.2 P0-1 lock |
| **D1.3-4** | TypeBox 嵌套 = 每层独立 `additionalProperties: false` + `Type.Array(Type.Object)` 合法 | R2 § 2 P0-2 lock |
| **D1.3-5** | ui-ux-pro-max install path = 路径 B (git-clone-with-setup) 主推 + 路径 A specimen 测试 | R2 § 3.2 P0-3 lock |
| **D1.3-6** | AgentDefinition factory contract draft = 12 字段完整版 + skills fail-fast + verbatim COMPLETE | R2 § 4 P0-4 lock |
| **D1.3-7** | 3 字段加法 Pattern L (spec-level metadata)，与 phase 1.2.5 marketplace_source method-specific 加法正交 | R1 D-7 |
| **D1.3-8** | ADR 0007 走 errata 路径（A7 守恒不动 0001 main body）| R1 D-8 |
| **D1.3-9** | B5 走独立 `install-base` 子命令（不加 `--base` flag）| R1 D-9 |
| **D1.3-10** | B6 走 shell probe 不写 vitest（karpathy YAGNI）| R1 D-10 |
| **D1.3-11** | install-base pre-filter 跳过 4 phase 2.1 placeholder + 三态输出（installed/skipped/failed）| R1 D-11 |
| **D1.3-12** | B7 仅 draft 文档（phase 1.3 不实装 factory 代码 — 守边界）| R1 D-12 |

---

## § E paranoid 风险登记（来自 R1 § 5 + 持续监控）

1. **TypeBox 嵌套 robust 性**（M）— Ajv 8 strict 模式下 `Type.Array(Type.Object({...}))` 已被 phase 1.1 marketplace_source 验证；但 decision_rules 含 array of object（override_signals: [{phrase, use}]）首次实战，**phase 1.3 T2.3 unit tests 必须含 nested array+object reject case**
2. **A7 守恒 paranoid check**（H）— 加 3 字段时 `git diff adr-0001-accepted -- docs/adr/0001-*.md` 必须输出空；任何不慎修改 0001 main body → P0 blocker；CI A7 step 自动 enforce
3. **yaml schema v1→v2 migration 路径**（M）— decision_rules.yaml `version: 1` 字段是 reserved，phase 1.4+ schema 演化时走 migration script + version 字段 bump（参 phase 1.1 manifest apiVersion 模式）
4. **security gate 与 schema 设计协调**（M → 已 mitigated）— 通过 D1.3-X "decision_rules v1 schema 设计上不含 cmd-shape 字段" 缓解，**phase 1.4 ADR 0008 评估扩展 cmd-shape 字段时再扩 security gate**（KICKOFF § 关键约束 3 备案）
5. **install-base 对 placeholder method 处理**（L → 已 lock D-11）— phase 2.1 placeholder 不会被 install-base 触发；输出"deferred (phase 2.1)" 标识，符合 INSTALLER-CONTRACT 契约 6 "no silent failures" 但放宽 "deferred ≠ failure"
6. **vercel-labs/skills issue #373 阻塞**（H）— 路径 A `npx skills add tree URL` 对 v4-next 分支 update 必破；**phase 1.3 必须 D-10 shell probe 验证 + 准备 路径 B git-clone-with-setup adapter 兜底**

---

## § F References

- `KICKOFF.md` (phase 1.3 acceptance bar)
- `RESEARCH.md` (R2 — 4 P0 推荐 + 12 字段 + 路径 B + arbitrate sketch)
- `PATTERNS.md` (R1 — D-7~D-12 + 11 patterns reuse + Pattern L 新加)
- phase-1.2.5 全套 (KICKOFF / ASSUMPTIONS / GRAY-AREA-1~5 / ADR 0006 / RESEARCH-1/2 / SISTER-REVIEW)
- ADR 0001-0006 + 用户笔记 + CLAUDE.md
- 用户硬要求："必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"（phase 1.2.5 已 capture，phase 1.3 是 implementation 阶段必须**继承**8 支柱 100% capture）
