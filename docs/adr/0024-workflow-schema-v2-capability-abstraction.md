# ADR-0024: Workflow Schema v2 + Capability Abstraction (D-01 + D-02 + D-09)

## Status

**Accepted (phase v2.0-2.6 — 2026-05-20)** — v2.0 milestone Phase 2.3 W0.1 ship (capabilities.yaml baseline) + Phase 2.4 W0.1 ship (WorkflowSchemaV2) + Phase 2.4 W1 ship (4 workflow.yaml v2) 完成后 Phase 2.6 W0 backfill。

> Phase v2.0-2.1 discuss-phase LOCKED 16 D-decision 中 D-01 (Pure bundled distribution) + D-02 (capability abstraction flat yaml map) + D-09 (mattpocock capability route by condition) 的合并 ADR — 沿袭 ADR 0008 / 0009 / 0010 / 0011 多决策合并 errata 模式。

## Context

v1.0.0~v1.0.4 ship 暴露 fundamental architectural flaw — `workflows/<name>/workflow.yaml` 是 **build-artifact** 形态：上游 (gstack / GSD / superpowers / mattpocock / Claude Code) 升级时, 每次调整 slash cmd / capability / phase 编排需 **1-2 day full npm release cycle**。User catch 2026-05-22 post v1.0.4 ship 即时识别该缺陷, authorize 跳过 v1.0.5 incremental → 直接 v2.0 大重构 1-2 week target window 2026-05-22~2026-06-05。

v2.0 milestone 核心 reframe (Phase v2.0-2.1 2026-05-20)：**项目最终目的 = maintainer 三层栈方法论 ship 给其他 user via bundled defaults**, NOT parse 其他 user 的 CLAUDE.md。其他 user `npm install -g harnessed@2.0 && harnessed setup --apply` 后立即享用 maintainer 三层栈完整流程, 无需 customize yaml。

本 ADR 覆盖 v2.0 architecture refactor 三个相关联决策线 (D-01 Pure bundled distribution + D-02 capability abstraction + D-09 mattpocock capability route by condition), 合并入单 ADR — 沿袭 phase 1.4 / 2.2 多决策合并模式。schemaVersion `harnessed.workflow.v2` 是 sister ADR 0011 § 7 schemaVersion 单一兼容门 7-surface 集合的 8th surface (per `src/types/schemaVersion.ts` post-2.4 W0 extension)。

### A7 守恒约束 (ADR 0001-0023 main body 不可改)

phase v2.0-2.6 沿袭 ADR 0003 / 0005 / 0007 / 0008 / 0009 / 0010 / 0011 / 0018 errata 风格 — **不动 ADR 0001-0023 main body** (A7 守恒)。Pure bundled distribution 推广 (D-01) 不影响 ADR 0001 manifest schema v1 main body — manifest schema 与 workflow schema namespace 独立, manifest v1 byte-identical 保留。

## Decisions

### 1. Pure bundled distribution (D-01 — Q1 RESET 2026-05-20)

**Decision: workflow.yaml + capabilities.yaml + judgments/ 全部 ship 在 npm package `<packageRoot>/workflows/` readonly。End-user share-only — NO user override yaml, NO `~/.harnessed/` user-dir 概念。**

**Pure bundled 三铁律**:

1. **Single SoT in npm package** — `<packageRoot>/workflows/<name>/workflow.yaml` + `<packageRoot>/workflows/capabilities.yaml` + `<packageRoot>/workflows/judgments/*.yaml` 全部 readonly bundled in npm package。`src/cli/lib/packagePath.ts` `getPackageRoot()` resolver (v1.0.1 ship) 是唯一解析路径, 不引入 user-dir fallback。
2. **End-user 不 override** — `harnessed --help` / `--version` 不暴露 user-dir override flag。`harnessed setup --apply` 仅装 bundled defaults, NOT copy yaml 到 user-dir。
3. **Maintainer schema iteration 走 ADR + npm patch release** — 上游 cmd rename / capability add / phase 编排调整 = 改 `<packageRoot>/workflows/*.yaml` + ADR 0024+ + `pnpm exec biome check --write` + commit + tag + publish.yml (OIDC + sigstore provenance) 2-3 day SLA cycle。

**Trade-off accepted** (user explicit accept Q1 RESET A): maintainer accepts ~2-3 day patch release cadence per upstream / capability adjustment 作为代价, 换取 end-user 零 customize 享用 maintainer 三层栈完整流程。预计上游升级 cadence ~ 1-2/周, patch release 成本可接受 (sister Phase 5.x patch release rhythm 已 institutionalize per ADR 0021 / 0022)。

**Drop scope**: R20.6 manifest user-dir hot-reload **DROPPED from v2.0 scope** per D-06 (Pure bundled supersede — user-dir 概念不存在则 hot-reload 没有 SoT 可监听; future v2.x escape hatch 候选)。`harnessed migrate v1→v2` CLI helper 不写 (D-05 YAGNI, end-user 无 user yaml 可 migrate)。

### 2. Capability abstraction — flat yaml map (D-02 — Q2 RESET 2026-05-20)

**Decision: `<packageRoot>/workflows/capabilities.yaml` 是扁平 yaml map, schema = `capability_name → {impl, cmd, since, description, fires_when, [aliases, requires, sdk_ref, outputs, plugin_path]}`。workflow.yaml v2 引用 `{{ capabilities.<name>.cmd }}` 模板插值 runtime 解析。**

**Schema example** (sister `workflows/capabilities.yaml` Phase 2.3 W0.1 SHIPPED 414L, schema_version: harnessed.capabilities.v1):

```yaml
schema_version: harnessed.capabilities.v1
capabilities:
  ralph-loop:
    impl: bundled-skill
    cmd: ralph-loop
    since: v2.0
    description: Sub-task completion gate (verbatim COMPLETE; max-iterations fallback)
    sdk_ref: src/routing/lib/ralphLoop.ts
    fires_when:
      - subtask.completion_required == true

  grill-with-docs:
    impl: mattpocock-skills
    cmd: /grill-with-docs
    since: v2.0
    description: 规格澄清 with docs (fires when phase.spec_ambiguous == true)
    fires_when:
      - phase.spec_ambiguous == true
```

**Entry 5 buckets (total 39 entry)** baseline shipped 2026-05-20:

| Bucket | Count | Source |
|--------|-------|--------|
| 1. mattpocock 12 高频招式 | 12 | D-09 + RESEARCH § 2.1 (grill-with-docs / zoom-out / diagnose / caveman / grill-me / tdd / to-prd / to-issues / improve-codebase-architecture / code-review / code-simplifier / investigate) |
| 2. special-purpose tools | 15 | D-14 + RESEARCH § 2.2 (ui-ux-pro-max / frontend-design / playwright-cli / playwright-test / webapp-testing / chrome-devtools-mcp / ctx7 / tavily-mcp / exa-mcp / gsd-discuss-phase / gsd-plan-phase / gsd-review / gsd-debug / gsd-progress / gsd-verify-work) |
| 3. gstack 治理关卡 | 6 | D-12 + CLAUDE.md "gstack 治理关卡" (gstack-office-hours / gstack-plan-ceo-review / gstack-review / gstack-qa / gstack-cso / gstack-design-review) |
| 4. 核心 capability | 4 | D-10 + D-13 + D-15 Q-AUDIT-5a (tdd / planning-with-files / ralph-loop / superpowers-brainstorming) |
| 5. Agent Teams | 3 | D-11 + Q-AUDIT-5b (agent-teams-create / agent-teams-send-message / agent-teams-shutdown) |

**Upstream cmd rename 案例处理路径** — maintainer 改 capabilities.yaml entry 一处 (e.g., `cmd: /office-hours` → `cmd: /strategy-gate`) 后, 全 4 workflows (plan-feature / execute-task / research / verify-work) 通过 `{{ capabilities.gstack-office-hours.cmd }}` 模板插值自动消费新 cmd — **NO workflow.yaml edit needed**。

**TypeBox schema validate** — `src/workflow/schema/workflow.ts` WorkflowSchemaV2 (86L Phase 2.4 W0.1 SHIPPED) + `src/types/schemaVersion.ts` SCHEMA_VERSIONS.workflow = `harnessed.workflow.v2` 是单一兼容门 (sister ADR 0011 § 7 schemaVersion 单一兼容门 rule 1 "Consumer 必须 branch-on-version")。

**Reject paths** (Q2 RESET 决策时拒绝): 嵌套 yaml (学习成本) / JS plugin (Pure bundled 不兼容 dynamic import) / dynamic decoration (D-07 static manifest discipline 拒绝)。Flat yaml = 最小学习成本 + TypeBox schema validate 直接 + Pure bundled readonly 适配。

### 3. mattpocock capability route by condition (D-09 — Q8 2026-05-20)

**Decision: workflow.yaml v2 phase 声明 conditional invoke mattpocock skill via `on:` syntax + `if:` expression (expr-eval npm dep)。机器化 CLAUDE.md 句型判据 (spec_ambiguous → /grill-with-docs / unfamiliar_module → /zoom-out / test_fail → /diagnose / token_tight → /caveman)。**

**Schema example** (sister `workflows/execute-task/workflow.yaml` v2 phase 02-code):

```yaml
phases:
  - id: 02-code
    upstream: superpowers
    model: sonnet
    capability: '{{ capabilities.ralph-loop.cmd }}'
    on:
      - if: 'phase.spec_ambiguous == true'
        invoke: '{{ capabilities.grill-with-docs.cmd }}'
      - if: 'subtask.unfamiliar_module == true'
        invoke: '{{ capabilities.zoom-out.cmd }}'
      - if: 'subtask.test_fail == true'
        invoke: '{{ capabilities.diagnose.cmd }}'
      - if: 'subtask.token_tight == true'
        invoke: '{{ capabilities.caveman.cmd }}'
```

**`on:` clause schema** (sister `src/workflow/schema/workflow.ts` L29-36 OnClause):

```typescript
const OnClause = Type.Object({
  if: Type.String(),                          // expr-eval expression OR judgments ref
  invoke: Type.Optional(Type.String()),       // '{{ capabilities.<name>.cmd }}' template
  action: Type.Optional(OnAction),            // 'skip' | 'invoke'
}, { additionalProperties: false })
```

**expr-eval npm dep** (D-03, ~5KB MIT 4M weekly downloads — RESEARCH § 9.2 size correction: unpackedSize 实测 145.6 KB / bundle ~30-40 KB / gzip ~10-15 KB; runtime impact < 1ms node CLI 启动) — 不自写 mini-parser (YAGNI + 安全审计成本); 不用 jsep (parser-only 需自己 eval AST 增加 ~100L)。

**12 mattpocock 招式 baseline subset 策略** — capabilities.yaml v2.0 wire 高频 12 招式 (sister Phase 1.5 + 3.4 routing 实证 30 sample 集合), 非全 23 — 后续 patch release 扩展, 沿袭 ADR per upstream upgrade pattern (D-07)。剩 11 招式 (e.g., /retro, /ship 等) 推 v2.x patch release。

**workflow engine pre-resolves 4-level ref** — `gate: judgments.<file>.<gate>.fires` 由 `src/workflow/judgmentResolver.ts` (Phase 2.3 ship) 在 expr-eval 求值前预 resolve (split 4 层 → read `judgments/<file>.yaml` → resolve `triggers.<gate>.fires_when` → 输出 resolved expression string → pass to expr-eval Parser)。

## A7 Conservation

ADR 0001-0023 main body **untouched** — baseline tag iteration `adr-0001-accepted` ... `adr-0023-accepted` → 加 `adr-0024-accepted` (Phase v2.0-2.6 W1 T2.6.W1.2 ship 时刻打)。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动** — 与 workflow schema namespace 独立。`docs/INSTALLER-CONTRACT.md` main body **不动**。

### A7 守恒验收命令 (phase v2.0-2.6 ship 后 0001-0024 iterate)

```bash
git diff adr-0001-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/00[1-2][0-9]-*.md" | wc -l   # = 0 (A7 守恒)
```

### CI A7 step

`.github/workflows/ci.yml` A7 step iter 0023 → 0024 (Wave 1 T2.6.W1.2 落地 single extend NOT retroactive); step name `ADR 0001-0023` → `ADR 0001-0024` (baseline tag iteration 23 → 24)。本 ADR 后续 0025-0029 各自 single extend (sister Phase 5.x patch release pattern), NOT batch retroactive 修改 A7 step。

### Errata-path note

phase v2.0-2.6 ship 时 Wave 1 T2.6.W1.2 打 `adr-0024-accepted` baseline tag (本 ADR main body 自 Draft → Accepted 时刻 0 diff stable)。push 后 CI A7 step 实测 24 ADR baseline tag 全绿。任一非空 diff 即 fail。

本 ADR 0024 起 phase v2.0-2.6 ship 时刻 frozen — 任何 v2.0.1+ 演化 (workflow schema v3 / capabilities.yaml 字段扩展 / mattpocock route 新 招式 wire / Pure bundled 升级到 hybrid 模式) 必须开 ADR 0030+ errata; 本 ADR 0024 main body 不可改 (与 ADR 0001-0023 同等守恒规则)。

## Consequences

### Positive

- **上游升级 cadence 缩短**: 1-2 day full npm release cycle (v1.x) → 2-3 day patch release cycle (v2.0+); maintainer 改 capabilities.yaml entry 一处, 全 workflows 自动消费。
- **End-user 零 customize**: `npm install -g harnessed@2.0 && harnessed setup --apply` 一行装齐 maintainer 三层栈完整流程, 无需写 CLAUDE.md prose。
- **Capability swap NO workflow.yaml edit**: 上游 cmd rename 案例 (e.g., gstack `/office-hours` → `/strategy-gate`) 改 capabilities.yaml 一处, 4 workflows 透传新 cmd。
- **Schema validate 直接**: TypeBox WorkflowSchemaV2 + `schema_version: harnessed.workflow.v2` 单一兼容门 (sister ADR 0011 § 7 rule 1 branch-on-version)。
- **Audit trail 完整**: 上游升级走 ADR 0025+ + npm patch release, A7 conservation gate 保护 main body 永久守恒。

### Negative

- **Initial migration cost** — 3 v1 workflow.yaml (plan-feature / execute-task / research) → v2 schema 重构 (Phase 2.4 W1 已 ship, ~300L delta total)。
- **Consumer cascade adapt** — `src/workflow/loadPhases.ts` v1 reader → loadWorkflow.ts v2 reader 重构 (sister Phase 2.3 W0.2 ship); CLI consumer (execute-task.ts / plan-feature.ts) signature 调整。
- **Capability abstraction 学习成本** — maintainer 写 workflow.yaml 时需 reference capabilities.yaml entry name (NOT 字面 slash cmd), 新 maintainer onboarding 需 read capabilities.yaml 全集 39 entry。
- **expr-eval bundle size** — node CLI bundle +145.6 KB unpacked (~30-40 KB gzip), 但 startup impact < 1ms 不阻塞 (RESEARCH § 9.2 MED finding)。

### Neutral

- **schema_version literal harnessed.workflow.v2** — sister ADR 0011 § 7 7-surface 集合 + capabilities.v1 + workflow.v2 = 9th + 10th surface registration (Phase 2.4 W0 schemaVersion.ts extension)。
- **Pure bundled 拒绝 user override** — 部分 power user 可能希望 customize, 但 v2.0 scope 明确不支持 (D-01); future v2.x 可考虑 `harnessed --dev` maintainer hot-reload escape hatch (DROPPED from v2.0 per D-06)。
- **`on:` syntax + expr-eval** — workflow.yaml 表达式语法引入 (sister CLAUDE.md `if:` 句型机器化), runtime expr-eval AST 求值需 phase fact context inject builder (planner Wave A 调研 ship)。

## Compliance

- **PROJECT-SPEC § 8.1 manifest schema 变更必须 ADR** — 本 ADR 0024 满足 (workflow schema v2 = manifest 相关 schema)。
- **PROJECT-SPEC § 1 + § 5 14 项 LOCKED 决策** — 不冲突 (workflow schema v2 是新增 surface, 不修改既有 manifest schema v1)。
- **RX.4 manifest 动态求值禁止** — expr-eval 仅作用于 workflow.yaml `if:` / `gate:` 字段, 不作用于 manifest spec.ts, 不违反 RX.4。
- **R20.1 + R20.2 + R20.8 + R20.9 acceptance** — Phase 2.3 + 2.4 ship 已满足 (capabilities.yaml 39 entry + WorkflowSchemaV2 86L + 4 workflows v2)。

## Errata-path note

phase v2.0-2.6 ship 后, 任何 workflow schema v2 字段调整 (e.g., 新增 `parallelism:` 字段已在 v2.0 baseline / 后续 `compaction:` 字段 / capabilities.yaml entry add or schema field add) 必须开 ADR 0030+ errata, 不动本 ADR main body。Pure bundled distribution 模式升级到 hybrid (允许 user override) 需独立 ADR 评估 (D-06 R20.6 escape hatch revisit 触发条件)。

**Errata 占位**: 本 ADR 0024 main body frozen 2026-05-20 Phase v2.0-2.6 ship 时刻, 初始 errata 节点为空。

## Implementation Status

**SHIPPED 2026-05-20** — 分 3 Wave 落地:

- **Phase v2.0-2.3 W0.1** (capabilities.yaml baseline 39 entry / 414L) — D-02 + D-09 capability abstraction core data + mattpocock 12 招式 wire
- **Phase v2.0-2.4 W0.1** (WorkflowSchemaV2 TypeBox 86L) — D-01 + D-02 + D-09 schema validate gate + schema_version `harnessed.workflow.v2` surface registration
- **Phase v2.0-2.4 W1** (4 workflows v2 — plan-feature / execute-task / research / verify-work) — D-01 Pure bundled distribution + D-09 mattpocock `on:` syntax 实装

**Verification** (Phase v2.0-2.5 dogfood test pending): 端到端 4-stage 三层栈完整 dogfood — 1 个真实 phase 跑完 Discuss → Plan → Execute → Verify 4 stage + 16 R20.x 全部触发 (per Phase v2.0-2.5 scope)。

## References

### 内部依据

- `docs/adr/0011-execute-task-sdk-ralph.md` § 7 SchemaVersion 单一兼容门 (capability+gate pattern 起源 hint; harnessed.workflow.v2 是 7-surface 集合 8th extension)
- `docs/adr/0023-npm-publish-release-process.md` (sister npm patch release cycle pattern; v2.0+ 2-3 day SLA reference)
- `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` § D-01 (Pure bundled) + D-02 (capability abstraction) + D-09 (mattpocock route) + Q-AUDIT amend reframe
- `.planning/phase-v2.0-2.1/2.1-DISCUSSION-LOG.md` Q1 RESET / Q2 RESET / Q8 transcript
- `.planning/phase-v2.0-2.2/RESEARCH.md` § 9.2 expr-eval size correction MED finding + § 2.1 mattpocock 12 高频招式 baseline + § 2.2 special-purpose 13 entry
- `.planning/phase-v2.0-2.2/PLAN.md` L547-561 T2.6.W0.1 spec + Phase 2.3/2.4 Wave 分布
- `.planning/REQUIREMENTS.md` § R20.1 (workflows bundled SoT + Pure bundled) + § R20.2 (capability abstraction flat yaml map) + § R20.8 (mattpocock in-workflow capability routing) + § R20.9 (BREAKING CHANGES migration scope release notes only)
- `src/workflow/schema/workflow.ts` 86L (Phase 2.4 W0.1 NEW — WorkflowSchemaV2 + WorkflowPhaseV2 + OnClause + FallbackMaxIterationsExceeded)
- `src/types/schemaVersion.ts` (Phase 2.2 T2.0 ship 68L + Phase 2.4 W0 extension — SCHEMA_VERSIONS.workflow `harnessed.workflow.v2` + capabilities `harnessed.capabilities.v1`)
- `src/workflow/judgmentResolver.ts` ~60L (Phase 2.3 W0.4 ship — workflow engine 4-level ref pre-resolve before expr-eval)
- `src/cli/lib/packagePath.ts` (v1.0.1 ship 80L — `getPackageRoot()` resolver Pure bundled 解析基础)
- `workflows/capabilities.yaml` 414L (Phase 2.3 W0.1 NEW — 39 entry baseline 5 bucket schema_version harnessed.capabilities.v1)
- `workflows/plan-feature/workflow.yaml` v2 (Phase 2.4 W1 ship — 5-phase v1 → v2 schema 升级)
- `workflows/execute-task/workflow.yaml` v2 (Phase 2.4 W1 ship — 4-phase v1 → v2 schema 升级 + `on:` syntax 实装)
- `workflows/research/workflow.yaml` v2 (Phase 2.4 W1 ship — NEW Stage ① Discuss multi-source fan-out)
- `workflows/verify-work/workflow.yaml` v2 (Phase 2.4 W1 ship — NEW Stage ④ Verify 7+ phase serial + parallel)
- `package.json` (v2.0.0 major bump + `expr-eval` dep ~145.6 KB unpacked)

### 外部参考

- `expr-eval` npm package (~5KB MIT, 4M weekly downloads — D-03 npm dep 选型; RESEARCH § 9.2 size 校正 unpackedSize 145.6 KB / bundle ~30-40 KB / gzip ~10-15 KB / startup impact < 1ms)
- `~/.claude/CLAUDE.md` (user global 三层栈方法论原型, judgment.yaml + capabilities.yaml 机器化对象)
- `docs/WORKFLOW.md` (harnessed v0.4 4-stage gap analysis + 4 workflows v0.5+ 完整自动化路线图 — v2.0 ship 后实现路线图全部 ship)
