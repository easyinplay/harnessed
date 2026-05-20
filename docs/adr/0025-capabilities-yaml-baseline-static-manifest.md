# ADR-0025: capabilities.yaml v2.0 Baseline + Static Manifest Discipline (D-07 + D-14)

## Status

**Accepted (Phase v2.0-2.3 W0.1 — 2026-05-20)** — Phase v2.0-2.1 discuss-phase LOCK (D-07 + D-14) → Phase v2.0-2.3 W0.1 capabilities.yaml SHIPPED → Phase v2.0-2.6 W0.2 ADR backfill (本 ADR)。沿袭 sister ADR 0011 9-section + errata pattern。

## Date

2026-05-20

## Context

Phase v2.0 milestone (Pure bundled SoT + 三层栈判据机器化) 把 v1.0.4 ship 后 user catch 的 fundamental architectural flaw (workflow.yaml = build-artifact NOT runtime config) 通过 8 项 R20.x architectural refactor 修复, ship v2.0.0 major version。

**核心 reframe** (2026-05-20 user 仲裁 Q1 RESET): 项目最终目的 = maintainer 三层栈方法论 ship 给其他 user via bundled defaults, NOT parse 其他 user 的 CLAUDE.md。Pure bundled 模式 (sister ADR 0024) requires workflow.yaml `{{ capabilities.<name>.cmd }}` 模板插值的 capability lookup map 作为 SoT。

**Two design rejection rationale**:

1. **Dynamic introspection rejected (Q6 D-07)**: scan `~/.claude/skills/*` 自动发现 capability — 脱位风险高 (upstream rename slash cmd 静默破 workflow), ADR audit trail 失效 (capability change 无版本控制), A7 conservation gate 失效 (capabilities.yaml 不可锁定 invariant)。
2. **Single-domain capability set rejected (Q-AUDIT-3 D-14)**: 原 D-09 仅 12 mattpocock 招式 — 不覆盖 special-purpose tools (UI/E2E/web search/library docs 等 13+ entry per `~/.claude/rules/web-*.md` 子任务级 routing)。

**实施约束**: capabilities.yaml v2.0 baseline 必须 maintainer-curated static yaml + 每次上游升级走 ADR 0026+ + npm patch release 2-3 day cycle (sister Phase 5.x patch release rhythm 已 institutionalize)。

### A7 守恒约束 (ADR 0001-0024 main body 不可改)

Phase v2.0-2.6 沿袭 ADR 0001-0024 errata-only 风格。本 ADR 0025 起 Phase v2.0 ship 时刻 frozen; v2.0.1+ 演化走 ADR 0026+ errata。

## Decisions

### 1. capabilities.yaml v2.0 baseline static yaml (D-07)

`<packageRoot>/workflows/capabilities.yaml` = maintainer-curated static yaml map (flat schema per R20.2 + D-02):

```yaml
schema_version: harnessed.capabilities.v1
capabilities:
  <capability_name>:
    impl: <component-vendor>
    cmd: <slash-cmd | npm-cli-name | mcp-tool-name>
    since: <semver>
    description: <one-liner>
    fires_when: [<expr-eval expressions>]
    [aliases: [...]]
    [requires: {...}]
```

**TypeBox schema validate** + Pure bundled readonly 适配。end-user 不可改 (per R20.1 + D-01)。

### 2. v2.0 baseline 35 entry, 5 bucket 分类 (D-07 + D-14)

Phase v2.0-2.3 W0.1 ship `workflows/capabilities.yaml` 实测 wc + entry count:

| Bucket | Count | Source | Examples |
|--------|-------|--------|----------|
| **1. mattpocock 高频招式** | 11 | D-09 + RESEARCH § 2.1 | grill-with-docs / zoom-out / diagnose / caveman / grill-me / to-prd / to-issues / improve-codebase-architecture / code-review / code-simplifier / investigate |
| **2. special-purpose tools** | 15 | D-14 + RESEARCH § 2.2 + `~/.claude/rules/web-*.md` | ui-ux-pro-max / frontend-design / playwright-cli / playwright-test / webapp-testing / chrome-devtools-mcp / ctx7 / tavily-mcp / exa-mcp / gsd-discuss-phase / gsd-plan-phase / gsd-review / gsd-debug / gsd-progress / gsd-verify-work |
| **3. gstack 治理关卡** | 6 | D-12 + CLAUDE.md "gstack 治理关卡" | gstack-office-hours / gstack-plan-ceo-review / gstack-review / gstack-qa / gstack-cso / gstack-design-review |
| **4. 核心 capability** | 4 | D-10 + D-13 + D-15 + Q-AUDIT-5a | tdd (superpowers + mattpocock alias) / planning-with-files (Q-AUDIT-5a claude-code-plugin reframe) / ralph-loop (SDK wrapper) / superpowers-brainstorming |
| **5. Agent Teams** | 3 | D-11 + Q-AUDIT-5b schema fix | agent-teams-create / agent-teams-send-message / agent-teams-shutdown |
| **Total** | **39** | — | schema_version: `harnessed.capabilities.v1` |

**Note** (count reconciliation): prompt 注 39 与 yaml 注释 "5, total 35" 不一致 — yaml 注释 stale (mattpocock 注 12 实测 11 + special-purpose 注 13 实测 15 含 gsd-discuss-phase + gsd-plan-phase + gsd-verify-work)。实际 entry count = 11 + 15 + 6 + 4 + 3 = 39。yaml 顶端注释推 Phase v2.0-2.6 errata fix。

### 3. Static manifest discipline + ADR per upstream upgrade (D-07)

**Rejected: dynamic introspection** (scan `~/.claude/skills/*`):

| 拒绝理由 | Detail |
|----------|--------|
| 脱位风险高 | Upstream rename slash cmd → 静默破 workflow (NO compile-time error) |
| ADR audit 失效 | capability change 无版本控制 trace |
| A7 conservation gate 失效 | capabilities.yaml 不可锁定 invariant |
| Test fixture 不稳定 | dogfood test 依赖 `~/.claude/skills/` 实际状态 |

**Accepted: static manifest + ADR per upgrade**:

| Pattern element | Detail |
|-----------------|--------|
| Cadence | ~1-2 上游升级/week (gstack / GSD / superpowers / karpathy / mattpocock / Claude Code) |
| ADR template | ADR 0026+ 含 "capability entry add/change" 字段 (sister ADR 0010 installer schema extension errata pattern) |
| Release cycle | npm patch release 2-3 day cycle (sister Phase 5.x patch rhythm) |
| Workflow.yaml diff | 上游 cmd rename → 改 capabilities.yaml entry 一处 + 全 workflows 自动消费 (NO workflow.yaml edit) |
| A7 守恒 | `ci.yml` A7 step 守恒 capabilities.yaml schema invariant (NOT entries — entries iterate per ADR) |

### 4. Special-purpose tools 13+ routing 机器化 (D-14)

实测 15 entry 覆盖 sister `~/.claude/rules/*.md` 子任务级 routing rules 机器化:

- **UI 主方案 / 补充**: ui-ux-pro-max / frontend-design (per `web-design.md` L5 + L11)
- **浏览器探查 / E2E**: playwright-cli (Bash 一行 AI 实时) / playwright-test (TS) / webapp-testing (Python 后端联动) (per `web-testing.md` L8-L11 三层职责矩阵)
- **非功能性诊断**: chrome-devtools-mcp (perf/a11y/memory leak per `web-testing.md` L45)
- **库 API 文档**: ctx7 (per `context7.md`)
- **Web 搜索**: tavily-mcp (默认) / exa-mcp (描述式/学术) (per `web-search.md` L17-L24)
- **GSD ops**: gsd-discuss-phase / gsd-plan-phase / gsd-review / gsd-debug / gsd-progress / gsd-verify-work

workflow.yaml phase 通过 `on:` syntax conditional invoke (sister D-09 mattpocock pattern 扩展)。

## Consequences

### Positive

| Benefit | Detail |
|---------|--------|
| ADR audit trail 保留 | 每个 capability add/change/rename trace 至 ADR 0026+ |
| A7 conservation gate 工作 | schema_version `harnessed.capabilities.v1` 锁定 schema invariant |
| 上游 cmd rename single-point fix | 改 capabilities.yaml entry 一处 → 全 workflows 自动消费 |
| 子任务级 routing 机器化 | 子任务 phase fact 注入 + expr-eval 求值 → 自动 invoke special-purpose tool |
| Pure bundled 一致性 | end-user `npm install -g harnessed@2.0` 即得 maintainer 三层栈完整 routing |

### Negative

| Cost | Detail |
|------|--------|
| 上游 frequent change → maintainer attention | ~1-2 upstream upgrades/week → ~1-2 ADR + patch release/week |
| capabilities.yaml manual maintenance | NO 自动 sync mechanism — maintainer 手动追上游 |
| Schema migration cost (v1 → v2) | 沿袭 ADR 0011 § 7 SchemaVersion 规则: 新字段必须 nested (避 v2 bump 失控) |

### Neutral

| Item | Detail |
|------|--------|
| schema_version literal | `harnessed.capabilities.v1` (sister Phase 2.2 schemaVersion 7 surface convention 第 8 surface) |
| 实际 entry count 39 vs yaml 注 35 | yaml 注释推 v2.0.1 errata fix (本 ADR § Decision 2 已 reconcile) |

## References

### 内部依据

- `PROJECT-SPEC.md` § 8.1 (ADR 触发条件)
- `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` § D-07 (Q6 static manifest + ADR per upstream upgrade) + § D-14 (Q-AUDIT-3 special-purpose tools 13+ routing 扩充)
- `.planning/phase-v2.0-2.1/2.1-DISCUSSION-LOG.md` Q6 + Q-AUDIT-3 alternatives
- `.planning/REQUIREMENTS.md` § R20.5 (upstream capability discovery static manifest) + § R20.14 (special-purpose tools routing 扩充)
- `workflows/capabilities.yaml` (Phase v2.0-2.3 W0.1 SHIPPED — 39 entry: 11 + 15 + 6 + 4 + 3)
- `docs/adr/0011-execute-task-sdk-ralph.md` § 7 SchemaVersion 单一兼容门 (sister 9-section + errata pattern 起点)
- `docs/adr/0024-pure-bundled-distribution.md` (Pure bundled mode SoT 决定 capabilities.yaml lookup map 必要性 — Phase v2.0-2.6 W0.1 ship)
- `.planning/phase-v2.0-2.2/RESEARCH.md` § 2.1 mattpocock baseline + § 2.2 special-purpose baseline + § 1.2 expr-eval grammar errata

### 外部参考

- `~/.claude/rules/web-design.md` L5 (ui-ux-pro-max 默认主方案) + L11 (frontend-design 补充)
- `~/.claude/rules/web-testing.md` L8-L11 (playwright-cli / @playwright/test / webapp-testing 三层职责矩阵) + L45 (chrome-devtools-mcp 非功能性诊断)
- `~/.claude/rules/web-search.md` L17-L24 (Tavily 默认 / Exa 描述式 + 学术)
- `~/.claude/rules/context7.md` (ctx7 CLI 库 API 文档抓取)
- `~/.claude/rules/agent-teams.md` L7 (CC 2.1.133+ + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` prereq)
- `~/.claude/CLAUDE.md` § "gstack 治理关卡" (6 entry 触发条件 + 强制/可选标记)

## Implementation Status

**SHIPPED 2026-05-20 Phase v2.0-2.3 W0.1** — `workflows/capabilities.yaml` 39 entry (11 + 15 + 6 + 4 + 3, schema_version `harnessed.capabilities.v1`)。Phase v2.0-2.3 W0.1 NS resolved 后加 `gsd-discuss-phase` + `gsd-plan-phase` 2 entry (15 special-purpose total; yaml 注释推 Phase v2.0-2.6 errata fix)。

A7 baseline tag `adr-0025-accepted` 待 Phase v2.0-2.6 Wave 2 ship 时打 (per task_plan.md 计划)。

## Errata

### E-1 (Phase v2.0-2.6 W0.2 backfill): expr-eval 2.0.2 keyword case-sensitivity

**Surface**: Phase v2.0-2.5 Wave 2 dogfood-first 触发 (3 处 uppercase OR/AND runtime fail) — inline fix。

**Issue**: `.planning/phase-v2.0-2.2/RESEARCH.md` § 1.2 documented `expr-eval` 2.0.2 keyword `AND` / `OR` uppercase + lowercase 等价。**实测 2.0.2 仅 accept lowercase** — uppercase 触发 runtime parse error。

**Impact**: 8 yaml expression keyword (capabilities.yaml `fires_when` + judgments/*.yaml `fires_when`/`skips_when` + workflow.yaml `gate`) 必须全部 lowercase `and`/`or`/`not`。

**Resolution**:

- Phase v2.0-2.5 Wave 2 inline fix 3 处 uppercase (verify-work/workflow.yaml + execute-task/phases.yaml)
- 全 capabilities.yaml `fires_when` 已 lowercase (实测 9 处 `AND` keyword 在 `grill-me` / `frontend-design` / `gstack-plan-ceo-review` / `gstack-qa` / `gstack-cso` / `gstack-design-review` / `gsd-review` / `playwright-test` / `webapp-testing` / `exa-mcp` / `code-simplifier` / `planning-with-files` entries 实际为 lowercase `and` — RESEARCH 文档与 yaml 实装一致 lowercase)
- Future capability schema 字段 `fires_when` / `skips_when` / `gate` 必 lowercase grammar (TypeBox schema validate regex 加约束 — 推 ADR 0026 judgments resolver schema lock)

**Backfill rationale**: Phase v2.0-2.5 W2 dogfood-first caught 真实 runtime bug — RESEARCH.md baseline 文档错误 (uppercase 文档存在 → 实测 lowercase only)。本 errata codify "expr-eval 2.0.2 keyword lowercase only" rule, 防止后续 maintainer copy-paste uppercase 复发。

### Errata-path note

本 ADR 0025 起 Phase v2.0 ship 时刻 frozen (sister ADR 0011 frozen pattern)。任何 v2.0.1+ 演化 (新 capability bucket / schema v2 bump / dynamic discovery 重评估) 必须开 ADR 0026+ errata; 本 ADR 0025 main body 不可改 (与 ADR 0001-0024 同等守恒规则)。
