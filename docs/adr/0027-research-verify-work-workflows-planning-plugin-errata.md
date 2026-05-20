# ADR-0027: NEW research + verify-work Workflows + planning-with-files Plugin Reframe Errata (D-08 + D-12 + Q-AUDIT-5a)

## Status

**Accepted (phase v2.0-2.6 W0 — 2026-05-20 ADR backfill)** — phase v2.0-2.4 W2 实装 ship 后于 phase v2.0-2.6 W0 backfill 至 ADR baseline。Implementation SHIPPED at phase v2.0-2.4 W1.3 (plan-feature v2 + planning-with-files plugin invocation) + W2.1 (research workflow NEW) + W2.2 (verify-work workflow NEW)。

> Phase v2.0 架构重构 4-stage Discuss → Plan → Execute → Verify 完整 workflow 覆盖的 sister ADR — 沿袭 ADR 0011 9-section pattern (phase 2.2 9 决策合并 errata 风格)。本 ADR 合并 3 决策线 (D-08 research workflow NEW + D-12 verify-work full 4-stage scope + Q-AUDIT-5a planning-with-files SDK → plugin terminology drift reframe) + 2 errata bullet。

## Context

Phase v2.0 架构重构核心 mission: harnessed 从 v1.0.4 build-artifact workflow.yaml 升级到 v2.0 runtime composition orchestrator,完整覆盖 CLAUDE.md 4-stage 方法论 (Discuss → Plan → Execute → Verify)。phase v2.0-2.1 discuss-phase LOCKED 16 D-decision 之中 D-08 + D-12 + D-15 三个决策线共同定调 4-stage 完整 workflow 覆盖:

- **D-08 research workflow NEW**: Stage ① Discuss 之前的多源调研 workflow,sister `~/.claude/rules/web-search.md` (Tavily / Exa MCP 路由) + `~/.claude/rules/context7.md` (ctx7 CLI 库 API 文档) 路由规则机器化 — 三源 fan-out + GSD discuss synth aggregate。
- **D-12 verify-work full 4-stage scope (Q-AUDIT-2 amend)**: Stage ④ Verify 完整 workflow,sister CLAUDE.md "Verify 阶段" 章节 verbatim 7-step 列表 (gsd-verify-work + gsd-progress + code-review 多 agent + 关键模块 gstack `/review` 强制 + 可选 `/qa` `/cso` `/design-review` + code-simplifier + 关键发布大重构 PR 升级 4-specialist Agent Team Pattern C 多维度审查)。原 discuss-phase Q-AUDIT-2 amend 前的 scope 简化版仅 3 phase (gsd-verify-work + code-review + code-simplifier),Q-AUDIT-2 amend LOCKED 2026-05-20 verbatim 重定 full 9-phase scope。
- **D-15 planning-with-files Manus-style 持久化** + **Q-AUDIT-5a terminology drift fix**: 原 D-15 acceptance text 写 "真接 planning-with-files SDK call" — phase v2.0-2.4 W1.3 Wave A research 实证 npm registry 404 (`planning-with-files` 不存在 npm package)。实际形态: **Claude Code plugin** (sister GitHub: https://github.com/OthmanAdi/planning-with-files),slash cmd `/plan` invocation,plugin runtime 真生成 3 file 持久化 (task_plan.md + progress.md + findings.md)。Q-AUDIT-5a LOCKED 2026-05-20 reframe path: capabilities.yaml entry `impl: claude-code-plugin` + `cmd: /plan` + `requires.plugin: planning-with-files >=2.2.0` + workflow.yaml `invokes: '/plan'` literal,**拒绝路径** fs.writeFile self-impl + fork repo abstract npm package (Wave A researcher 显式拒绝,sister boring tech reuse plugin-first 原则)。

本 ADR 覆盖 phase v2.0-2.4 W2 + W1.3 ship 3 决策线,合并入单 ADR (沿袭 ADR 0011 9-section + 多决策合并 errata 模式) — 不动 ADR 0001-0026 main body (A7 守恒)。

### A7 守恒约束 (ADR 0001-0026 main body 不可改)

phase v2.0-2.6 W0 沿袭 ADR 0011 / 0024 / 0025 / 0026 errata 风格 — **不动 ADR 0001-0026 main body** (A7 守恒)。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body 不动;`docs/INSTALLER-CONTRACT.md` main body 不动。本 ADR 0027 起 phase v2.0 ship 时刻 frozen,任何 v2.x patch 演化走 ADR 0028+ errata。

## Decisions

### 1. research workflow NEW (D-08)

**workflows/research/workflow.yaml** NEW 19L (phase v2.0-2.4 W2.1 SHIPPED) — 2-phase composition:

| Phase ID | Upstream | Capability | Model | Max Iterations |
|----------|----------|------------|-------|----------------|
| `01-fan-out` | web-search | (generic shape — engine 按 capability route 触发 3 source) | sonnet | `{{ defaults.ralph_max_iterations.research.01-fan-out }}` |
| `02-synth` | gsd | `{{ capabilities.gsd-discuss-phase.cmd }}` | opus | `{{ defaults.ralph_max_iterations.research.02-synth }}` |

**Phase 01-fan-out — 多源 fan-out 设计 (generic shape)**: workflow engine 按 capability route 触发 3 source sequentially (Tavily MCP 默认关键词 / Exa MCP 描述式学术 / ctx7 CLI 库 API 文档),subagent fan-out per `~/.claude/CLAUDE.md` 子任务并行执行机制。**SubtaskType enum 按 generic shape 不按 on[] dispatch by subtype** (避免 SubtaskType cascade) — research-domain-specific subtype (library_api_docs / descriptive_or_academic / keyword_or_news) defer v2.x patch release (详 § Errata bullet 2)。

**Phase 02-synth — GSD discuss synth aggregate**: 多源结果 dedup + reconcile + GSD `/gsd-discuss-phase` format 整合为 phase context document (sister phase 2.1 discuss-phase output `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` 模板)。`parallelism: judgments.parallelism-gate.subagent-default.fires` 默认 subagent fan-out (per CLAUDE.md "子任务并行执行机制" 节)。

**Stage 定位**: Stage ① Discuss 之前 — 调研产出 input 给 Stage ① `/gsd-discuss-phase` 灰色澄清。**sister web-search.md + context7.md routing 机器化**: 不再依赖人类阅读 rule 选择工具,workflow engine 按 capability `fires_when` (subtask.needs_web_search / subtask.needs_library_docs) 自动 route。

### 2. verify-work workflow NEW (D-12 Q-AUDIT-2 amend full 4-stage scope)

**workflows/verify-work/workflow.yaml** NEW 122L (phase v2.0-2.4 W2.2 SHIPPED) — 9-phase composition per CLAUDE.md "Verify 阶段" verbatim:

| Phase ID | Stage | Upstream | Capability | Model | Conditional? |
|----------|-------|----------|------------|-------|--------------|
| `01-gsd-verify-work` | 必跑串行 | gsd | `/gsd-verify-work` | sonnet | NO |
| `02-gsd-progress` | 必跑串行 | gsd | `/gsd-progress` | haiku | NO |
| `03-code-review-parallel` | 并行 fan-out | mattpocock-skills | `/code-review` | sonnet | NO (subagent default) |
| `04-gstack-review-conditional` | 强制 conditional | gstack | `/review` | opus | `phase.is_critical_module == true` |
| `05-qa-conditional` | 可选 conditional | gstack | `/qa` | sonnet | `phase.has_ui_changes == true` |
| `06-cso-conditional` | 可选 conditional | gstack | `/cso` | opus | `phase.has_auth_or_secrets == true` |
| `07-design-review-conditional` | 可选 conditional | gstack | `/design-review` | sonnet | `phase.has_design_changes == true` |
| `08-code-simplifier` | 末尾串行 | mattpocock-skills | `/code-simplifier` | sonnet | NO |
| `09-agent-team-multispecialist` | Agent Team 升级 | claude-platform | `TeamCreate` (Pattern C 4-specialist) | opus | `phase.is_major_release == true OR phase.is_large_refactor == true` |

**9-phase 设计 rationale**:
1. **必跑串行 (01-02)**: gsd-verify-work UAT-driven conversational + gsd-progress 状态同步 (ROADMAP/STATE/REQUIREMENTS) — Stage ④ Verify 起点不可跳过。
2. **并行 fan-out (03)**: code-review multi-agent 高置信度 finding,`parallelism: judgments.parallelism-gate.subagent-default.fires`。
3. **关键模块强制 conditional (04)**: gstack `/review` Paranoid Staff Engineer 视角,sister CLAUDE.md "关键模块 PR 前强制"。**强制 conditional = critical module 必跑,non-critical 可 skip** (D-12 verbatim)。
4. **可选 conditional (05-07)**: `/qa` (UI changes) / `/cso` (auth/secrets) / `/design-review` (design changes) — 按 phase fact context 独立触发,**互相独立 NOT 级联**(Fallback 3 铁律 chain_isolation per R20.16)。
5. **末尾串行 (08)**: code-simplifier 移除重复、多余逻辑 — verify-work 链尾收口。
6. **Agent Team 升级 (09)**: 关键发布 / 大重构 PR 升级 4-specialist Pattern C 多维度审查 (code-review + gstack-review + gstack-cso + gstack-qa 互相质询 NOT fire-and-forget),sister `~/.claude/rules/agent-teams.md` L42-L52 Pattern C 多维度审查。**cleanup mandatory** (SendMessage shutdown_request + TeamDelete) — engine-level wiring NOT yaml v2 schema scope。

**Workflow-level on_veto**: `halt_workflow` (D-04 PUSH 任 1 phase veto → 全 halt) — engine-level wiring NOT yaml v2 root schema strict additionalProperties:false (per T2.4.W0.1 + STRIDE T-2.2-02)。

### 3. planning-with-files plugin invocation reframe (Q-AUDIT-5a LOCKED 2026-05-20)

**Capabilities.yaml entry** (sister capabilities.yaml L331-344 SHIPPED):

```yaml
planning-with-files:
  impl: claude-code-plugin
  cmd: /plan
  since: v2.0
  description: Manus-style persistent markdown planning (Claude Code plugin slash cmd)
  requires:
    plugin: planning-with-files >=2.2.0
  plugin_path: ~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0
  outputs:
    - task_plan.md
    - progress.md
    - findings.md
  fires_when:
    - phase.stage == 'plan' AND phase.requires_persisted_plan == true
```

**plan-feature workflow.yaml 05-persist phase invocation** (sister plan-feature/workflow.yaml L68-81 SHIPPED v2):

```yaml
- id: 05-persist
  name: persist (planning-with-files plugin /plan — Manus-style markdown persistence)
  upstream: planning-with-files
  capability: '{{ capabilities.planning-with-files.cmd }}'
  invokes: '/plan'                                          # literal Claude Code plugin slash cmd
  model: haiku
  on:
    - if: phase.scope_days > 1 or phase.is_critical_module == true
      action: invoke
  artifacts_expected:
    - task_plan.md
    - progress.md
    - findings.md
  max_iterations: '{{ defaults.ralph_max_iterations.plan-feature.05-persist }}'
```

**关键设计**:
- **`impl: claude-code-plugin`** (NOT npm-sdk) — runtime 形态明确为 Claude Code plugin slash cmd invocation。
- **`invokes: '/plan'` literal** — workflow engine 调度时直接 plugin slash cmd 路径,plugin runtime 真生成 3 file 持久化。
- **`requires.plugin: planning-with-files >=2.2.0`** — doctor 入装时 probe plugin version (phase v2.0-2.4 W3 SHIPPED real probe verified v2.34.0 ≥ 2.2.0)。
- **`artifacts_expected: [task_plan.md, progress.md, findings.md]`** — workflow engine ship 后 expected artifacts 在 `.planning/<phase-id>/` 真生成。

**Anti-pattern guard** (verified by `tests/workflow/plan-feature-v2.test.ts`):
- **NO npm SDK call** (yaml syntax 原生不含 `import` / `require`)
- **NO fs.writeFile self-impl** (workflow.yaml grep -E 'fs\.writeFile|writeFile' returns 0)
- **YES `invokes: '/plan'` literal** at 05-persist (plugin slash cmd 真接 path)
- **YES `capability: '{{ capabilities.planning-with-files.cmd }}'`** template ref (resolves to `/plan` via capabilities.yaml)

## A7 Conservation

ADR 0001-0026 main body **untouched**;baseline tag iteration `adr-0001-accepted` ... `adr-0026-accepted` → 加 `adr-0027-accepted` (phase v2.0-2.6 W0.4 ship 打)。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body **不动**;`docs/INSTALLER-CONTRACT.md` main body **不动**。

### A7 守恒验收命令 (phase v2.0-2.6 ship 后 0001-0027 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018 0019 0020 0021 0022 0023 0024 0025 0026 0027; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0027 main body unchanged"
```

### CI A7 step

`.github/workflows/ci.yml` A7 step `for n in 0001 ... 0026` loop 加 `0027`;step name `ADR 0001-0026` → `ADR 0001-0027` (phase v2.0-2.6 W0 落地 — baseline tag iteration `1-26 → 1-27`)。

### Errata-path note

phase v2.0-2.6 W0.4 ship 时打 `adr-0027-accepted` baseline tag (本 ADR main body 自 Draft → Accepted 时刻 0 diff stable)。本 ADR 0027 起 phase v2.0 ship 时刻 frozen — 任何 v2.x+ 演化 (research SubtaskType enum 扩展 / verify-work conditional 新增 / planning-with-files plugin contract 升级) 必须开 ADR 0028+ errata;本 ADR 0027 main body 不可改 (与 ADR 0001-0026 同等守恒规则)。

## Consequences

### Positive

- **4-stage 完整 ship**: Stage ① Discuss (research workflow NEW) + Stage ④ Verify (verify-work workflow NEW) 同步覆盖,sister CLAUDE.md 4-stage 方法论严格遵守。
- **planning-with-files plugin route 正确**: terminology drift fix LOCKED — runtime 形态 = Claude Code plugin slash cmd `/plan` invocation,NOT npm SDK call (npm registry 404 verified),NOT fs.writeFile self-impl (anti-pattern reviewer guard pass)。
- **sister 路由规则机器化**: `~/.claude/rules/web-search.md` (Tavily / Exa 路由) + `context7.md` (ctx7 CLI) + `agent-teams.md` (Pattern C 4-specialist) 从「人类阅读 rule 自行选择工具」升级到「workflow engine 按 capability `fires_when` 自动 route」。

### Negative

- **research SubtaskType enum 扩展 defer v2.x patch**: research-domain-specific subtype (library_api_docs / descriptive_or_academic / keyword_or_news) phase v2.0-2.4 W2.1 implementation 选 generic shape NOT on[] dispatch by subtype (避免 SubtaskType cascade);enum 加入推 v2.x patch release (详 Errata bullet 2)。
- **verify-work 9-phase 复杂度高**: 9-phase composition (2 必跑串行 + 1 并行 fan-out + 1 强制 conditional + 3 可选 conditional + 1 末尾串行 + 1 Agent Team 升级) 测试覆盖成本高 — phase v2.0-2.4 W2.2 实装 5 test cell 覆盖 9-phase schema validate + conditional resolve + on_veto halt_workflow。
- **gsd-plan-phase capability entry 暂未单独**: plan-feature 04-gsd-plan phase 沿袭 v1 literal `invokes: 'gsd-plan-phase'` pattern,gsd-plan-phase capability entry 已加入 capabilities.yaml L215-221 (since v2.0) 但 v2.0 baseline 未阻塞 ship per W1.3 Implementation Tasks #4-#5 scope。

### Neutral

- **capabilities.yaml 4-workflow validate=4**: schema validation 现支持 4 workflow (plan-feature + execute-task + research + verify-work);capabilities.yaml 35 entry 全 wire 到 4 workflow capability template ref。
- **doctor real probe plugin version verified**: phase v2.0-2.4 W3 sister `check-planning-with-files.ts` 真 probe v2.34.0 ≥ 2.2.0 verified;not 与 workflow ship 同步 — doctor pre-flight gate。

## References

### 内部依据

- `docs/adr/0011-execute-task-sdk-ralph.md` § Decisions 9 章节 + § Errata-path note (sister 9-section + 多决策合并 errata 风格 — 本 ADR 沿袭)
- `docs/adr/0024-workflow-yaml-v2-schema-migration.md` (sister workflow.yaml v1 → v2 migration baseline)
- `docs/adr/0025-capabilities-yaml-static-manifest.md` (sister capabilities.yaml 35-entry static manifest baseline)
- `docs/adr/0026-judgment-resolver-expr-eval-multi-file.md` (sister judgments/*.yaml multi-file 6-file pattern baseline)
- `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` § D-08 (research workflow NEW) + § D-12 (verify-work full 4-stage Q-AUDIT-2 amend) + § D-15 (planning-with-files plugin reframe) + § Q-AUDIT-5a (terminology drift fix LOCKED 2026-05-20)
- `.planning/REQUIREMENTS.md` § R20.7 (research workflow 2-phase composition) + § R20.12 (verify-work 9-phase composition) + § R20.15 (planning-with-files plugin invocation NOT npm SDK)
- `workflows/research/workflow.yaml` 19L (phase v2.0-2.4 W2.1 SHIPPED)
- `workflows/verify-work/workflow.yaml` 122L (phase v2.0-2.4 W2.2 SHIPPED)
- `workflows/plan-feature/workflow.yaml` v2 82L (phase v2.0-2.4 W1.3 SHIPPED + Q-AUDIT-5a `invokes: '/plan'` literal)
- `workflows/capabilities.yaml` § planning-with-files entry L331-344 (impl=claude-code-plugin + cmd=/plan + requires.plugin >=2.2.0)
- `tests/workflow/plan-feature-v2.test.ts` (anti-pattern guard NO npm-sdk NO fs.writeFile YES /plan literal)
- `scripts/check-planning-with-files.ts` (doctor real probe v2.34.0 ≥ 2.2.0 verified phase v2.0-2.4 W3)

### 外部参考

- `~/.claude/CLAUDE.md` 4-stage Discuss → Plan → Execute → Verify 方法论 + "Verify 阶段" 章节 verbatim 7-step 列表 (gsd-verify-work + gsd-progress + code-review 多 agent + 关键模块 gstack /review 强制 + 可选 /qa /cso /design-review + code-simplifier + 4-specialist Agent Team 升级)
- `~/.claude/rules/web-search.md` (Tavily / Exa / ctx7 / WebFetch 路由判据 — research workflow 01-fan-out generic shape 设计依据)
- `~/.claude/rules/context7.md` (ctx7 CLI 库 API 文档抓取流程 — research workflow Tavily / Exa / ctx7 三源 fan-out 之 ctx7 源)
- `~/.claude/rules/agent-teams.md` L42-L52 Pattern C 多维度审查 (≥3 specialist 需要互相质询而非 fire-and-forget — verify-work 09-agent-team-multispecialist 设计依据)
- `https://github.com/OthmanAdi/planning-with-files` (sister Claude Code plugin repo — Q-AUDIT-5a reframe runtime 形态确认依据 NOT npm package)

## Implementation Status

**SHIPPED 2026-05-20** at phase v2.0-2.4:
- **W1.3**: plan-feature workflow.yaml v2 + planning-with-files plugin invocation reframe (Q-AUDIT-5a `invokes: '/plan'` literal)
- **W2.1**: workflows/research/workflow.yaml NEW 19L 2-phase composition (fan-out + GSD discuss synth)
- **W2.2**: workflows/verify-work/workflow.yaml NEW 122L 9-phase composition (必跑串行 + 并行 + 强制 conditional + 可选 conditional + 末尾串行 + Agent Team 升级)
- **W3**: scripts/check-planning-with-files.ts real probe v2.34.0 ≥ 2.2.0 verified
- **A7 baseline tag**: `adr-0027-accepted` 在 phase v2.0-2.6 W0.4 ship 时打

## Errata

### 1. planning-with-files SDK → plugin terminology drift fix (Q-AUDIT-5a LOCKED 2026-05-20)

**原 D-15 + R20.15 acceptance text 偏差**: 写 "真接 planning-with-files SDK call" — 不可满足 (phase v2.0-2.4 W1.3 Wave A research 实证 npm registry 404,`planning-with-files` 不存在 npm package)。

**实际形态 verified**:
- **类型**: Claude Code plugin (sister GitHub repo https://github.com/OthmanAdi/planning-with-files)
- **slash cmd**: `/plan`
- **plugin path**: `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0`
- **runtime 产出**: 真生成 3 file (task_plan.md + progress.md + findings.md) 在 `.planning/<phase-id>/`

**Fix path LOCKED**:
- `capabilities.yaml` entry: `{impl: claude-code-plugin, cmd: /plan, requires: {plugin: planning-with-files >=2.2.0}, plugin_path: ~/.claude/plugins/cache/..., outputs: [task_plan.md, progress.md, findings.md]}`
- `workflow.yaml` 05-persist: `invokes: '/plan'` literal + `capability: '{{ capabilities.planning-with-files.cmd }}'` template + `artifacts_expected: [task_plan.md, progress.md, findings.md]`
- doctor pre-flight: `scripts/check-planning-with-files.ts` real probe v2.34.0 ≥ 2.2.0 verified

**拒绝路径** (Wave A researcher 显式拒绝,sister boring tech reuse plugin-first 原则):
- **fs.writeFile self-impl**: workflow engine 不自行写 markdown file — 走 plugin slash cmd invocation,plugin runtime 负责持久化
- **fork repo abstract npm package**: 不为 harnessed 单独 fork sister plugin repo 抽 npm package — boring tech reuse 直接 plugin slash cmd invocation

**sister Phase 1.2.5 SISTER-REVIEW.md 5-recurrence terminology drift pattern recognition**: 此次 SDK → plugin terminology drift 是 phase v2.0 期间第 5 次 sister review 命中的 terminology drift (前 4 次 sister Phase 1.2.5 SISTER-REVIEW.md);Q-AUDIT-5a fix LOCKED 之后 capabilities.yaml `impl` enum 固化 `claude-code-plugin` 为 1st-class value (sister `mcp` / `cli` / `gstack` / `gsd` / `mattpocock-skills` / `superpowers` / `bundled-skill` / `claude-platform` 9-impl enum 之一)。

### 2. research workflow SubtaskType enum extension defer v2.x patch

**phase v2.0-2.4 W2.1 implementation 选择**: research workflow 01-fan-out phase 走 **generic shape** (workflow engine 按 capability route 触发 3 source sequentially),**NOT on[] dispatch by subtype** (避免 SubtaskType cascade)。

**defer 原因**: research-domain-specific SubtaskType enum (library_api_docs / descriptive_or_academic / keyword_or_news) 三 value 加入会触发 SubtaskType cascade — 现有 SubtaskType enum (ui_polish / browser_probe / e2e_test / perf_diagnose / a11y_audit / memory_leak / debug 等 special-purpose tools 13 entry 之 fires_when 引用) 不变形则 capability `fires_when` 表达式无歧义判断;加入 research subtype 后需各 capability `fires_when` 表达式重审 (e.g., subtask.search_type 是 enum 还是 string)。

**Phase 2.4 W2.1 选择 generic shape**: 01-fan-out phase 无 `on:` clause — workflow engine 直接按 capability `fires_when` (subtask.needs_web_search / subtask.needs_library_docs) 自动 route 至 tavily-mcp / exa-mcp / ctx7 三 capability entry,sister capabilities.yaml L191-205 + L183-189 already SHIPPED。

**v2.x patch release roadmap**:
- v2.x patch 加入 SubtaskType enum value `library_api_docs` / `descriptive_or_academic` / `keyword_or_news`
- 各 capability `fires_when` 表达式重审 + judgment-resolver expr-eval validate
- research workflow.yaml 01-fan-out phase 加 `on:` clause dispatch by subtype (e.g., `if: subtask.search_type == 'library_api_docs' → invoke ctx7`)
- 推 ADR 0028+ errata 记录 SubtaskType enum 扩展 + 各 capability `fires_when` 变更
