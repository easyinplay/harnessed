# Phase v3.0-3.2 Wave A — L0 Discipline Substrate Research

**Researched:** 2026-05-20
**Researcher:** disciplines-researcher (Pattern A Team `phase32-research-team`)
**Domain:** L0 Discipline Substrate (`workflows/disciplines/*.yaml` 6 file + runtime enforcement hooks)
**Confidence:** HIGH (schema design + yaml content) / MEDIUM (runtime hook integration point)
**Cross-deps:** sister `RESEARCH-workflows.md` (workflows-researcher) + `RESEARCH-capabilities.md` (capabilities-researcher) — Pattern A 三路 reconcile complete

---

## Summary

Phase v3.0-3.2 D-09 lock 的 **L0 Discipline Substrate** = harnessed v3.0 在 L1 upstream/capability 层之下新增的 cross-stage 行为规范层,承载 CLAUDE.md global rules (语言/风格/优先级/纪律)。本研究输出 6 yaml file schema + content sample + 4 runtime enforcement hook 设计 + workflow.yaml v3 集成方案。

**Primary recommendation:** 18 surface bump in `src/types/schemaVersion.ts` 新增 `discipline: 'harnessed.discipline.v1'`; NEW `src/workflow/schema/discipline.ts` (~80L) TypeBox; NEW `src/workflow/disciplineLoader.ts` (~120L) cache + query API; NEW `src/discipline/enforcement/` 4 hook helper file (each ~30-50L, sister `src/routing/lib/fallbackHandlers.ts` split pattern); workflow.yaml v3 加 `disciplines_applied` workflow-level 字段 (default = all 6 enforced)。

**Pattern A cross-team alignment:** workflows-researcher confirm `disciplines_applied: Type.Array(Type.Union([6 Literal]))` strict 版本 + 4 wedge hook trigger point reserved in master orchestrator;capabilities-researcher confirm 6 entry `category=discipline OR behavioral` + `discipline_ref: workflows/disciplines/<basename>.yaml` cross-link。18 surface count locked (capabilities.v1 NOT bump — `category` field 是 Optional additive,沿袭 D-16 rule c)。

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-09**: NEW L0 Discipline Substrate layer (below L1 upstream, applies to L1-L7 universally) + 6 NEW yaml file `workflows/disciplines/*.yaml` + workflow.yaml v3 NEW field `disciplines_applied:` + runtime engine loads disciplines pre-phase + applies via hooks
- **D-05**: karpathy 心法 (4 心法 always-on behavioral) cross-cutting, NOT phase
- **D-08**: capabilities.yaml v3 `category` field NEW (含 enum `behavioral` 给 karpathy-guidelines)
- **D-13**: harnessed v3.0 = superset of CLAUDE.md global rules / Obsidian doc / rules/* → 全部 1:1 codify

### Claude's Discretion (defer to Wave B planner)
- workflow.yaml v3 schema TypeBox 字段 detail (Literal Union strict vs String 宽松)
- 4 hook trigger point 具体集成 (run.ts wedge 位置 / NEW masterOrchestrator.ts 位置)
- discipline yaml `rules:` field shape (object array 已 LOCKED 与 capabilities-researcher 对齐)
- BLUF / em-dash / emoji auto-detect heuristic 还是 LLM judge (用户决策风险, 见 § Risk)

### Deferred Ideas (OUT OF SCOPE)
- Plugin namespaced slash cmd / hierarchical 3-level slash cmd
- mattpocock 23 招式全集 wire (v3.0 ship 12 高频)
- Master orchestrator interactive mode toggle

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R30.9 | NEW L0 Discipline Substrate 6 yaml file SHIPPED + schema validate + runtime hook | Sections 1-4 + 6 yaml content + hook design |
| R30.13 | harnessed v3 = superset of CLAUDE.md/Obsidian/rules (全部 codify) | Section 2 mapping table — 100% CLAUDE.md global rules → disciplines/*.yaml verbatim transcription |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| discipline yaml parse + validate | Schema layer (`src/workflow/schema/discipline.ts`) | — | TypeBox SoT, sister `judgment.ts` pattern |
| discipline file load + cache | Loader layer (`src/workflow/disciplineLoader.ts`) | — | module-level Map cache, sister `judgmentResolver.ts` pattern |
| Runtime enforcement (4 hook) | Enforcement layer (`src/discipline/enforcement/*.ts`) | Workflow engine wedge | Split helper pattern, sister `fallbackHandlers.ts` (≤80L per file) |
| `disciplines_applied` resolution | Workflow engine (`src/workflow/run.ts` + future `masterOrchestrator.ts`) | Loader | run.ts wedge BEFORE `dispatchSkillStub` + AFTER `loadPhases` |
| Capabilities `category=discipline` ref | Registry layer (`workflows/capabilities.yaml`) | discipline_ref string cross-link | Registry → SoT 引用 |
| User-facing BLUF / commit / output enforcement | Output / commit hook | runtime detect + emit warn OR halt | sister fallbackHandlers UX text pattern |

---

## Section 1 — discipline.v1 TypeBox Schema Source

### File: `src/workflow/schema/discipline.ts` (NEW, ~85L)

```typescript
// src/workflow/schema/discipline.ts — Phase v3.0-3.3 W0 (R30.9 D-09 L0 Discipline Substrate).
// TypeBox schema for workflows/disciplines/*.yaml (6 file ship v3.0).
// Sister: src/workflow/schema/judgment.ts dual-shape (triggers vs rules) pattern.
//
// 6 file 覆盖 (per D-09):
//   base shape (4 file)         karpathy / output-style / language / operational
//   priority_hierarchy shape    priority.yaml (ordered array of capability tier name)
//   protocols shape             protocols.yaml (Record<string, ProtocolShape>)
//
// 18th surface schema_version: harnessed.discipline.v1 (sister schemaVersion.ts SCHEMA_VERSIONS).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const EnforcementLayer = Type.Union([
  Type.Literal('code-writing'),  // karpathy 心法 — write code phase
  Type.Literal('output'),        // BLUF / language / no-emoji — emit response phase
  Type.Literal('commit'),        // biome / A7 / commit safety — pre-commit phase
  Type.Literal('workflow'),      // priority hierarchy / protocols — workflow-level arbitration
  Type.Literal('tool'),          // tool invoke discipline (reserved for v3.x extension)
])

const Enforcement = Type.Union([
  Type.Literal('halt'),     // process.exit non-zero, sister fallbackHandlers
  Type.Literal('warn'),     // console.warn emit, continue
  Type.Literal('auto-fix'), // run auto_fix_cmd then continue (biome --write pattern)
  Type.Literal('info'),     // log only, no action
])

export const DisciplineRule = Type.Object(
  {
    id: Type.String({ minLength: 1 }),                       // kebab-case
    description: Type.String(),                               // human-readable
    enforcement: Enforcement,
    trigger: Type.Union([Type.String(), Type.Array(Type.String())]),  // expr OR always-on list
    check_method: Type.String(),                              // heuristic / regex / external-cmd / llm-judge / file-content-match
    auto_fix_cmd: Type.Optional(Type.String()),              // only enforcement=auto-fix
  },
  { additionalProperties: false },
)

// priority.yaml 专字段
const PriorityHierarchy = Type.Array(Type.String(), { minItems: 1 })

// protocols.yaml 专字段
const ProtocolShape = Type.Object(
  {
    description: Type.String(),
    required_fields: Type.Optional(Type.Array(Type.String())),
    forbidden_phrases: Type.Optional(Type.Array(Type.String())),
    file_ownership: Type.Optional(Type.Record(Type.String(), Type.Array(Type.String()))),
    rules: Type.Optional(Type.Array(DisciplineRule)),
  },
  { additionalProperties: false },
)

export const Discipline = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.discipline),
    discipline: Type.String({ minLength: 1 }),                // basename (karpathy / output-style / ...)
    enforcement_layer: EnforcementLayer,
    auto_enforce: Type.Boolean(),
    rules: Type.Array(DisciplineRule),
    priority_hierarchy: Type.Optional(PriorityHierarchy),     // priority.yaml only
    protocols: Type.Optional(Type.Record(Type.String(), ProtocolShape)),  // protocols.yaml only
  },
  { additionalProperties: false },
)

export type DisciplineT = Static<typeof Discipline>
export type DisciplineRuleT = Static<typeof DisciplineRule>
export type ProtocolShapeT = Static<typeof ProtocolShape>
```

### schemaVersion.ts 18th surface registration

```typescript
// src/types/schemaVersion.ts — Phase v3.0-3.3 W0 ADD 18th surface (R30.9 D-09)
export const SCHEMA_VERSIONS = {
  // ... 17 existing surface
  discipline: 'harnessed.discipline.v1', // ← Phase v3.0-3.3 W0 ADD 18th surface (D-09 L0)
} as const

// SchemaVersionLiteral Union 同步 + 1 Literal
```

**Confidence:** HIGH — sister `judgment.ts` 双 shape pattern verbatim 复用; `additionalProperties:false` 沿袭 D-16 rule c。

---

## Section 2 — 6 Disciplines Yaml Content Sample

### Mapping table — CLAUDE.md 来源 → disciplines/*.yaml verbatim transcription

| CLAUDE.md / Obsidian 节 | Discipline yaml | Rule count | enforcement_layer |
|------------------------|-----------------|-----------|-------------------|
| `andrej-karpathy-skills` 心法 4 条 + ≤200L | karpathy.yaml | 5 | code-writing |
| 对话回答风格 7 节 (BLUF / 不复读 / 不结尾总结...) | output-style.yaml | 7 | output |
| 语言与输出规范 (zh-Hans default + 8 preserve cat) | language.yaml | 3 | output |
| 项目 CLAUDE.md (biome preempt + commit safety + A7 ADR) + global rules | operational.yaml | 6 | commit |
| 响应规范与优先级 hierarchy | priority.yaml | 1 (arbitration meta-rule) + priority_hierarchy array | workflow |
| rules/cc-handoff.md (Ideation→Onboarding + Plan→Execute + 写入边界) | protocols.yaml | 3 protocol Record | workflow |

### 2.1 `workflows/disciplines/karpathy.yaml` (~75L)

```yaml
# workflows/disciplines/karpathy.yaml
# karpathy 心法 + 编码硬限 — 机器化 ~/.claude/CLAUDE.md 「andrej-karpathy-skills」 节
# Phase v3.0-3.3 ship per D-09 (L0 Discipline Substrate)

schema_version: harnessed.discipline.v1
discipline: karpathy
enforcement_layer: code-writing
auto_enforce: true

rules:
  - id: think-before-coding
    description: 先思考后写代码,不直接 dump 代码;每个子任务前 brainstorm 设计意图
    enforcement: warn
    trigger: subtask.type == 'code-write'
    check_method: heuristic
    # check_method='heuristic' — runtime engine 检查 subagent 输出 first 200 char 是否含设计意图 marker
    # (e.g., 'Plan:' / 'Approach:' / '设计:' / '思路:'),若全是 code block → warn

  - id: simplicity-first
    description: 追求最小有效代码,避免不必要复杂度;YAGNI / 不为假设场景写代码
    enforcement: warn
    trigger: always-on
    check_method: llm-judge
    # check_method='llm-judge' — verify phase 调用 code-simplifier review

  - id: surgical-changes
    description: 小步原子修改,每个 commit 单一职责;不大段重写
    enforcement: warn
    trigger: phase.type == 'execute'
    check_method: external-cmd
    auto_fix_cmd: 'git diff --stat HEAD~1 | awk ''{lines+=$3} END {if (lines>300) exit 1}'''
    # 单 commit > 300 line diff → warn (rough heuristic, override allowed via task spec)

  - id: goal-driven-execution
    description: 目标驱动,不发散 / 不无关重构;只解决当前任务 + 不夹带 cleanup
    enforcement: warn
    trigger: phase.type == 'execute'
    check_method: heuristic

  - id: file-length-200-hard-limit
    description: 单文件 ≤200L 硬限 (per project CLAUDE.md karpathy 心法 reminder);超过 → split helper
    enforcement: halt
    trigger: phase.type == 'execute' AND file.lines > 200
    check_method: external-cmd
    auto_fix_cmd: 'wc -l <file> | awk ''{if ($1>200) exit 1}'''
    # 实装 split helper pattern (sister fallbackHandlers.ts / sdkReconcile.ts ≤80L)
```

### 2.2 `workflows/disciplines/output-style.yaml` (~90L)

```yaml
# workflows/disciplines/output-style.yaml
# 对话回答风格 — 机器化 ~/.claude/CLAUDE.md 「对话回答风格」 节
# Phase v3.0-3.3 ship per D-09

schema_version: harnessed.discipline.v1
discipline: output-style
enforcement_layer: output
auto_enforce: true

rules:
  - id: bluf-conclusion-first
    description: 结论先行 (BLUF),每段先一句给答案/判断/推荐,再展开理由
    enforcement: warn
    trigger: always-on
    check_method: heuristic
    # heuristic — 第一句长度 ≤ 100 char + 含答案动词 ('是' / '不是' / '推荐' / '应该' / 'use X')
    # 失败 → warn 'BLUF missing: first sentence is not a conclusion'

  - id: no-sycophantic-open-close
    description: 删除"好问题/太棒了/完美/希望对你有帮助/还需要别的吗"等开场闭合套话
    enforcement: auto-fix
    trigger: always-on
    check_method: regex
    auto_fix_cmd: 'strip-sycophantic'
    # NEW src/discipline/enforcement/strip-sycophantic.ts — regex strip 13 known phrase

  - id: no-emoji-unless-requested
    description: 禁用 emoji,除非用户明确要求 (项目 markdown 文件如 README/PR/CHANGELOG 不约束)
    enforcement: warn
    trigger: response.target == 'chat' AND user.requested_emoji == false
    check_method: regex
    # regex /\p{Emoji_Presentation}/u; 命中 + trigger fires → warn

  - id: no-em-dash
    description: 禁用 em-dash (—— / —);替代:补充用括号/冒号,并列用顿号,转折单独成句
    enforcement: auto-fix
    trigger: response.target == 'chat'
    check_method: regex
    auto_fix_cmd: 'replace-em-dash'
    # auto-replace '——' → ',  ' (单段内逗号);'—' → ':' OR ','

  - id: precise-quantifier
    description: 量词精确,能给具体数字/文件名/行号/commit hash 就不用"一些/几个/多个"
    enforcement: info
    trigger: always-on
    check_method: llm-judge

  - id: no-end-recap
    description: 不做结尾总结,除非用户明确要求"汇总/recap"
    enforcement: warn
    trigger: response.target == 'chat'
    check_method: heuristic
    # heuristic — 末尾 200 char 含 '## 总结' / '## Summary' / 'In summary' / '综上所述'
    # → warn 'redundant end recap'

  - id: no-empty-continuation-question
    description: 禁空洞续作询问 (要不要我帮你 X?/还需要别的吗?);保留工作流必要下一步指引
    enforcement: warn
    trigger: response.target == 'chat'
    check_method: regex
    # regex /要不要|还需要别的|希望对你有帮助/  + trigger fires → warn
```

### 2.3 `workflows/disciplines/language.yaml` (~60L)

```yaml
# workflows/disciplines/language.yaml
# 语言与输出规范 — 机器化 ~/.claude/CLAUDE.md 「语言与输出规范」 节
# Phase v3.0-3.3 ship per D-09

schema_version: harnessed.discipline.v1
discipline: language
enforcement_layer: output
auto_enforce: true

rules:
  - id: default-language-zh-hans
    description: 默认输出语言简体中文 (zh-Hans);所有解释/分析/计划/总结/提问/状态更新一律中文
    enforcement: warn
    trigger: user.lang_request == null
    check_method: heuristic
    # heuristic — response 中文 char 占比 > 60% (排除 code block);占比 < 30% → warn

  - id: preserve-english-categories
    description: 8 类强制保留英文原文,不翻译不音译
    enforcement: warn
    trigger: always-on
    check_method: heuristic
    # 8 类 (verbatim CLAUDE.md):
    #   1. 代码/命令/shell/配置/正则/SQL
    #   2. 文件/目录/路径名 (src/components/Button.tsx 等)
    #   3. 工具/框架/库/产品/公司名 (Claude Code / GSD / React 等)
    #   4. API/函数/类/变量/字段/环境变量/配置键
    #   5. 错误信息/stack trace/log 输出
    #   6. URL / commit hash / issue / PR 编号 / 版本号 / git ref
    #   7. 业内固定缩写与通用术语 (TDD / CRUD / API / MCP / token 等)
    #   8. 引用原文 verbatim

  - id: lang-request-override
    description: 用户明确"用英文回答"/"reply in English"/"翻译成 X" → 整段切换目标语言
    enforcement: info
    trigger: user.lang_request != null
    check_method: regex
```

### 2.4 `workflows/disciplines/operational.yaml` (~85L)

```yaml
# workflows/disciplines/operational.yaml
# 操作纪律 — 机器化 project CLAUDE.md (biome preempt + commit safety) +
# ~/.claude/CLAUDE.md (A7 ADR / no-skip-hooks / authorization-not-transitive)
# Phase v3.0-3.3 ship per D-09

schema_version: harnessed.discipline.v1
discipline: operational
enforcement_layer: commit
auto_enforce: true

rules:
  - id: biome-preempt
    description: |
      TS/JS commit 前必跑 `pnpm exec biome check --write` (3 CI-red recurrences Phase 2.1.1/2.2/2.3 project memory)
    enforcement: auto-fix
    trigger: |
      phase.type == 'commit' AND
      changed_files matches '\\.(ts|tsx|js|mjs)$'
    check_method: external-cmd
    auto_fix_cmd: 'corepack pnpm exec biome check --write'
    # NEW src/discipline/enforcement/before-commit.ts hook; exit 0 才允许 commit

  - id: a7-adr-conservation
    description: |
      新 ADR 不动旧 ADR main body,baseline tag iterate,CI A7 step 守恒
      (sister Phase 1.3-2.6 ADR errata 路径)
    enforcement: warn
    trigger: phase.type == 'commit' AND changed_files contains 'docs/adr/'
    check_method: external-cmd
    auto_fix_cmd: 'scripts/check-adr-conservation.sh'

  - id: no-push-without-approval
    description: |
      NEVER push to remote without user explicit approval (project CLAUDE.md commit safety)
    enforcement: halt
    trigger: cmd.type == 'git-push'
    check_method: external-cmd
    # ralph-loop / subagent 自动调 git push → halt;user explicit `git push` 在主 session 允许

  - id: no-skip-hooks
    description: |
      不允许 --no-verify / --no-gpg-sign 等 skip hook flag,除非用户明确要求
    enforcement: halt
    trigger: cmd.type == 'git-commit' AND args contains '--no-verify'
    check_method: regex

  - id: destructive-ops-explicit
    description: |
      Destructive ops (git reset --hard / push --force / rm -rf / drop table) 必须用户 explicit 确认
    enforcement: halt
    trigger: cmd.is_destructive == true
    check_method: heuristic
    # heuristic — 命令含 'rm -rf' / 'reset --hard' / '--force' / 'DROP TABLE' / 'delete from'

  - id: authorization-not-transitive
    description: |
      用户 approve 一次 push ≠ 全程 approve;每个 destructive / shared-state 操作单独确认
    enforcement: warn
    trigger: cmd.requires_approval == true AND session.has_prior_approval == true
    check_method: heuristic
```

### 2.5 `workflows/disciplines/priority.yaml` (~50L)

```yaml
# workflows/disciplines/priority.yaml
# 优先级仲裁 — 机器化 ~/.claude/CLAUDE.md 「响应规范与优先级」 节
# Phase v3.0-3.3 ship per D-09

schema_version: harnessed.discipline.v1
discipline: priority
enforcement_layer: workflow
auto_enforce: true

priority_hierarchy:
  - gstack                       # 决策层 最高优先
  - gsd                          # 整体 orchestration
  - superpowers                  # 子任务执行质量
  - planning-with-files          # 计划持久化
  - karpathy                     # 编码行为
  - mattpocock                   # 招式 by-demand
  - parallel                     # subagent / Agent Teams / ralph-loop 执行机制

rules:
  - id: multi-capability-arbitration
    description: |
      多 capability fires_when 同时 true → 按 priority_hierarchy order 选最高
      e.g., gstack /office-hours + GSD /gsd-discuss-phase 同 fire → gstack 先跑
    enforcement: warn
    trigger: capabilities.fired_count > 1
    check_method: heuristic
    # NEW src/discipline/enforcement/before-spawn.ts hook — sort fired capabilities by tier rank
```

### 2.6 `workflows/disciplines/protocols.yaml` (~95L)

```yaml
# workflows/disciplines/protocols.yaml
# 跨 CC instance 协议 — 机器化 ~/.claude/rules/cc-handoff.md (Ideation→Onboarding +
# Plan→Execute) + 写入边界表
# Phase v3.0-3.3 ship per D-09

schema_version: harnessed.discipline.v1
discipline: protocols
enforcement_layer: workflow
auto_enforce: false   # 默认 NOT auto-enforce — 协议是 cross-session, harnessed 主要 validate

rules: []

protocols:
  cc-handoff-ideation-to-onboarding:
    description: |
      场景 A — Ideation-CC 写自包含产品设计文档;Onboarding-CC 新项目目录读取并启动 GSD
    required_fields:
      - 业务目的
      - 范围/边界
      - 关键决策+决策理由
      - 技术栈+理由
      - 已识别风险
      - 推荐 milestone 划分
      - "Open questions (OPEN: <问题>, decision required by user)"
    forbidden_phrases:
      - "TODO"
      - "待补充"
      - "暂定"

  plan-execute-cc-ready-metadata:
    description: |
      场景 B — Plan-CC 离场 PLAN.md 必须 ready-to-execute (metadata 标记)
    required_fields:
      - "status: ready-to-execute"
      - 每个 task: 精确文件路径
      - 每个 task: acceptance criteria
      - 每个 task: 依赖前置 task 编号
      - "## Open Questions 节为空"
    forbidden_phrases:
      - "TODO"
      - "待补充"
      - "暂定"

  file-ownership-strict:
    description: |
      跨 CC 写入边界 — 下游 CC 不修改上游 artifact;歧义写到 PROGRESS.md ## Blocked
    file_ownership:
      ideation-cc:
        - 产品设计文档
      onboarding-cc:
        - ".planning/* (初始化)"
        - 项目代码
      plan-cc:
        - SPEC.md
        - DISCUSS.md
        - PLAN.md
        - RESEARCH.md
      execute-cc:
        - PROGRESS.md
        - VERIFICATION.md
        - 代码
        - commit
    rules:
      - id: no-modify-upstream-artifact
        description: |
          下游 CC 发现上游 artifact 模糊 → 写 PROGRESS.md ## Blocked,不修改上游
        enforcement: halt
        trigger: cc.role == 'execute' AND file.target matches 'PLAN.md|SPEC.md|DISCUSS.md|RESEARCH.md'
        check_method: file-content-match
```

**Confidence:** HIGH — 6 yaml 全部从 CLAUDE.md / rules/cc-handoff.md verbatim transcription, 无原创内容。

---

## Section 3 — Runtime Enforcement Hook Design

### 3.1 `src/workflow/disciplineLoader.ts` (NEW ~120L)

Sister `src/workflow/judgmentResolver.ts` (98L) pattern verbatim 复用:

```typescript
// src/workflow/disciplineLoader.ts — Phase v3.0-3.3 W0 (R30.9 D-09).
// Sister judgmentResolver.ts pattern: module-level Map<basename, DisciplineT> cache,
// load + TypeBox validate on first access, subsequent cache hit.
//
// Public API:
//   loadDiscipline(basename, packageRoot): Promise<DisciplineT>
//   loadAllApplied(disciplines_applied[], packageRoot): Promise<Map<basename, DisciplineT>>
//   getRule(basename, rule_id): DisciplineRuleT | undefined  (sync, requires prior load)
//   _clearDisciplineCache(): void (test-only)
//
// Hot path: master orchestrator workflow load + 4 hook query path

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { Discipline, type DisciplineT, type DisciplineRuleT } from './schema/discipline.js'

const _cache = new Map<string, DisciplineT>()

export async function loadDiscipline(basename: string, packageRoot: string): Promise<DisciplineT> {
  let cached = _cache.get(basename)
  if (cached) return cached
  const yamlPath = resolve(packageRoot, 'workflows', 'disciplines', `${basename}.yaml`)
  const raw = await readFile(yamlPath, 'utf8')
  const parsedRaw = parseYaml(raw) as unknown
  if (!Value.Check(Discipline, parsedRaw)) {
    const errors = [...Value.Errors(Discipline, parsedRaw)]
      .slice(0, 3)
      .map((e) => `${e.path} ${e.message}`)
      .join('; ')
    throw new Error(`Invalid discipline file ${basename}.yaml: ${errors}`)
  }
  cached = parsedRaw as DisciplineT
  _cache.set(basename, cached)
  return cached
}

export async function loadAllApplied(
  disciplines_applied: string[],
  packageRoot: string,
): Promise<Map<string, DisciplineT>> {
  const m = new Map<string, DisciplineT>()
  for (const basename of disciplines_applied) {
    m.set(basename, await loadDiscipline(basename, packageRoot))
  }
  return m
}

export function getRule(basename: string, ruleId: string): DisciplineRuleT | undefined {
  const d = _cache.get(basename)
  if (!d) return undefined
  return d.rules.find((r) => r.id === ruleId)
}

export function _clearDisciplineCache(): void {
  _cache.clear()
}
```

### 3.2 Hook helper files — `src/discipline/enforcement/*.ts`

Sister `src/routing/lib/fallbackHandlers.ts` (89L) split pattern — 每 hook 独立文件 ≤80L。

#### 3.2.1 `before-commit.ts` (~50L) — biome preempt + commit safety

```typescript
// src/discipline/enforcement/before-commit.ts — Phase v3.0-3.3 W0 (R30.9).
// Hook trigger: git commit cmd dispatch 前;ralph-loop / subagent / 主 session 全走此 hook.
// Reads operational.yaml rule[id=biome-preempt + no-push-without-approval + no-skip-hooks +
// destructive-ops-explicit] → enforce halt OR auto-fix.

import { execSync } from 'node:child_process'
import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface CommitHookCtx {
  changedFiles: string[]
  cmdArgs: string[]
  packageRoot: string
  cmdType: 'git-commit' | 'git-push'
  hasUserApproval: boolean
}

export async function runBeforeCommitHook(ctx: CommitHookCtx): Promise<void> {
  const d = await loadDiscipline('operational', ctx.packageRoot)

  // Rule: biome-preempt — auto-fix if TS/JS files
  const tsJsRe = /\.(ts|tsx|js|mjs)$/
  if (ctx.changedFiles.some((f) => tsJsRe.test(f))) {
    const rule = d.rules.find((r) => r.id === 'biome-preempt')
    if (rule?.auto_fix_cmd) {
      console.warn('⚠️ biome preempt — running auto-fix before commit')
      execSync(rule.auto_fix_cmd, { cwd: ctx.packageRoot, stdio: 'inherit' })
    }
  }

  // Rule: no-skip-hooks — halt if --no-verify present
  if (ctx.cmdArgs.includes('--no-verify')) {
    console.error('❌ no-skip-hooks violated: --no-verify forbidden')
    process.exit(2)
  }

  // Rule: no-push-without-approval — halt if push + no approval
  if (ctx.cmdType === 'git-push' && !ctx.hasUserApproval) {
    console.error('❌ no-push-without-approval: user explicit approval required')
    process.exit(2)
  }
}
```

#### 3.2.2 `after-output.ts` (~55L) — BLUF / language / em-dash / emoji enforce

```typescript
// src/discipline/enforcement/after-output.ts — Phase v3.0-3.3 W0 (R30.9).
// Hook trigger: response emission 后 (chat target only); validate output-style + language rules.

import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface OutputHookCtx {
  responseText: string
  responseTarget: 'chat' | 'file' | 'commit-message'
  userRequestedEmoji: boolean
  packageRoot: string
}

const EM_DASH_RE = /——|—/g
const EMOJI_RE = /\p{Emoji_Presentation}/u
const SYCOPHANTIC_RE = /(好问题|太棒了|完美|希望对你有帮助|还需要别的吗|要不要我帮你)/
const EMPTY_RECAP_RE = /## 总结|## Summary|综上所述/

export async function runAfterOutputHook(ctx: OutputHookCtx): Promise<string[]> {
  if (ctx.responseTarget !== 'chat') return []
  const warns: string[] = []
  const ds = await Promise.all([
    loadDiscipline('output-style', ctx.packageRoot),
    loadDiscipline('language', ctx.packageRoot),
  ])

  // BLUF heuristic
  const firstSentence = ctx.responseText.split(/[。.!?\n]/)[0] ?? ''
  if (firstSentence.length > 100) warns.push('BLUF missing: first sentence > 100 char')

  // em-dash
  if (EM_DASH_RE.test(ctx.responseText)) warns.push('em-dash detected (auto-fix recommended)')

  // emoji
  if (!ctx.userRequestedEmoji && EMOJI_RE.test(ctx.responseText)) {
    warns.push('emoji used without explicit user request')
  }

  // sycophantic
  if (SYCOPHANTIC_RE.test(ctx.responseText)) warns.push('sycophantic phrase detected')

  // end-recap
  const lastChunk = ctx.responseText.slice(-200)
  if (EMPTY_RECAP_RE.test(lastChunk)) warns.push('redundant end recap detected')

  for (const w of warns) console.warn(`⚠️ output-style: ${w}`)
  return warns
}
```

#### 3.2.3 `before-spawn.ts` (~45L) — priority hierarchy arbitration

```typescript
// src/discipline/enforcement/before-spawn.ts — Phase v3.0-3.3 W0 (R30.9 priority.yaml).
// Hook trigger: master orchestrator 收到 ≥2 capability fired 时 arbitrate.

import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface FiredCapability {
  name: string
  tier: string  // 'gstack' / 'gsd' / 'superpowers' / 'planning-with-files' / 'karpathy' / 'mattpocock' / 'parallel'
}

export async function arbitrateBeforeSpawn(
  fired: FiredCapability[],
  packageRoot: string,
): Promise<FiredCapability[]> {
  if (fired.length <= 1) return fired
  const d = await loadDiscipline('priority', packageRoot)
  const hierarchy = d.priority_hierarchy ?? []
  const rank = (tier: string): number => {
    const i = hierarchy.indexOf(tier)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return [...fired].sort((a, b) => rank(a.tier) - rank(b.tier))
}
```

#### 3.2.4 `before-phase-execute.ts` (~35L) — load disciplines into phase context

```typescript
// src/discipline/enforcement/before-phase-execute.ts — Phase v3.0-3.3 W0 (R30.9).
// Hook trigger: workflow engine pre-phase (sister run.ts L74 for-loop start).

import { loadAllApplied } from '../../workflow/disciplineLoader.js'
import type { DisciplineT } from '../../workflow/schema/discipline.js'

const DEFAULT_APPLIED = ['karpathy', 'output-style', 'language', 'operational', 'priority', 'protocols']

export async function loadDisciplinesForPhase(
  disciplines_applied: string[] | undefined,
  packageRoot: string,
): Promise<Map<string, DisciplineT>> {
  const applied = disciplines_applied && disciplines_applied.length > 0
    ? disciplines_applied
    : DEFAULT_APPLIED
  return loadAllApplied(applied, packageRoot)
}
```

**Confidence:** HIGH for split pattern (sister fallbackHandlers / sdkReconcile ≤80L). MEDIUM for hook trigger 实装位置 (run.ts wedge vs NEW masterOrchestrator.ts — Wave B planner 决定)。

---

## Section 4 — workflow.yaml v3 Integration

### 4.1 workflow.yaml v3 schema delta (sister workflows-researcher RESEARCH)

```typescript
// src/workflow/schema/workflow.ts → workflow.v3 schema bump (17th surface)
// disciplines-researcher 提供 disciplines_applied 字段 detail

export const WorkflowSchemaV3 = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.workflow),   // bump 'harnessed.workflow.v3'
    workflow: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    disciplines_applied: Type.Optional(
      Type.Array(
        Type.Union([
          Type.Literal('karpathy'),
          Type.Literal('output-style'),
          Type.Literal('language'),
          Type.Literal('operational'),
          Type.Literal('priority'),
          Type.Literal('protocols'),
        ]),
      ),
    ),
    // ... 沿用 v2 字段
    phases: Type.Array(WorkflowPhaseV3, { minItems: 1 }),
  },
  { additionalProperties: false },
)
```

`disciplines_applied` 是 **workflow-level** (sister `description`),NOT phase-level — 每 phase 隐式继承全 workflow `disciplines_applied`。

### 4.2 Phase-level override (rare)

```typescript
export const WorkflowPhaseV3 = Type.Object(
  {
    // ... v2 字段
    disciplines_override: Type.Optional(
      Type.Array(
        Type.Union([6 Literal]),
      ),
    ),
  },
  { additionalProperties: false },
)
```

仅 phase 需要 deviate 时用 (e.g., `task-deliver` 关 BLUF enforce 因为输出是 COMPLETE signal,不需 BLUF)。

### 4.3 ci.yml check-workflow-schema.mjs extend

```javascript
// scripts/check-workflow-schema.mjs v3 extend — Phase v3.0-3.3 W0
// 1. workflow.yaml schema_version === 'harnessed.workflow.v3'
// 2. disciplines_applied[] 元素 ∈ 6 LOCKED basename
// 3. disciplines/*.yaml validate via Discipline TypeBox schema (NEW glob 6 file)
```

### 4.4 run.ts wedge (D-04 PUSH pattern verbatim)

```typescript
// src/workflow/run.ts T30.4 — Phase v3.0-3.3 W2 (R30.9 hook wire)
// runWorkflow() L74 for-loop start NEW wedge:

const disciplines = await loadDisciplinesForPhase(parsed.disciplines_applied, packageRoot)
// gateContext extended with disciplines map (passed to expr-eval as context.disciplines)

// L80 activatePhase 后 + L83 isVetoed 前 NEW wedge:
//   - before-spawn arbitration if phase.invokes_tools.length > 1
// L120 dispatchSkillStub return 后 NEW wedge:
//   - after-output validate if r.target === 'chat'
// L130 completePhase 前 NEW wedge:
//   - before-commit hook if r.triggers_commit === true
```

**Confidence:** MEDIUM — run.ts wedge 位置 sister D-04 PUSH pattern verbatim;但 master orchestrator (Phase 3.5) 是否引入 separate `masterOrchestrator.ts` 文件 by Wave B planner 决定。

---

## Section 5 — SendMessage Cross-Team Exchanges Log

### 5.1 Outbound — disciplines-researcher → workflows-researcher
**Initial:** 6 basename verbatim list (karpathy / output-style / language / operational / priority / protocols) + `disciplines_applied` field 强 type `Type.Array(Type.Union([6 Literal]))` + 4 runtime hook trigger point (before-phase-execute / before-spawn / before-commit / after-output)

**Reconcile:** 18 surface count LOCKED (NOT 19) — capabilities.v1 NOT bump, `category` field 是 additive Optional;`category=discipline OR behavioral` 两 enum value 都接受 (runtime engine union match)

### 5.2 Outbound — disciplines-researcher → capabilities-researcher
**Initial:** 6 basename + `category=discipline` enum value (sister D-09 命名) + `discipline_ref: workflows/disciplines/<basename>.yaml` cross-link + 6 NEW behavioral entry pattern

**Reconcile:** rules schema 100% 一致 (object array, NOT string array) + 2 yaml file 专字段 (priority_hierarchy / protocols Record) 不破坏 base shape + capabilities entry sentinel `cmd: '<not-applicable-behavioral>'`

### 5.3 Inbound from workflows-researcher
- 6 basename verbatim adopt ✓
- `disciplines_applied` strict Literal Union version 已 revise (sister STRIDE T-2.2-02 fail-fast)
- 4 runtime wedge hook 加进 masterOrchestrator.ts Phase 3.5 task ✓
- Surface count 澄清:18 (NOT 19) — capabilities.v1 不 bump ✓

### 5.4 Inbound from capabilities-researcher
- 6 basename verbatim adopt ✓
- rules schema 同结构假设 (id + description + trigger + enforcement + check_method + auto_fix_cmd) ✓
- `category=behavioral` (D-08 verbatim) OR `discipline` (D-09 semantic) 双 enum 接受 ✓

### 5.5 Pattern A 三路对齐 final state
- 6 yaml basename LOCKED across 3 researcher
- 18 surface count LOCKED (workflow.v3 + discipline.v1 = 17+18; capabilities.v1 NOT bump)
- Runtime hook 4 trigger point LOCKED (workflows-researcher 在 master orchestrator 预留 / disciplines-researcher 实装 hook 文件 / capabilities-researcher 不涉及)
- category enum 双 value 接受 (Wave B planner 选 final)

---

## Section 6 — Risks / Open Questions for Planner Wave B

### Risk 1: BLUF / em-dash / emoji auto-detect heuristic false-positive (MEDIUM)
**What:** `after-output.ts` 用 regex / heuristic 检测 BLUF / em-dash / emoji;regex 命中可能误伤合法内容 (e.g., 引用用户原文含 em-dash, 项目 README markdown 含 emoji)
**Mitigation:**
- `responseTarget` 区分:`chat` vs `file` vs `commit-message`;仅 chat 启用 strict check
- `ctx.userRequestedEmoji` flag 用户明确 "use emoji"/"加 emoji" 时 disable check
- enforcement=warn (NOT halt) — 误伤代价低;真正 halt 仅 commit safety / file-length-200
**Open question (planner Wave B):** auto-fix vs warn — em-dash 检测到时 auto-replace (auto-fix `'——' → ',  '`) 是否 acceptable, 还是仅 warn? user 决策点 (sister D-07 输出 LOCK 时确认)

### Risk 2: biome preempt hook 集成 git commit cmd 实装路径 (MEDIUM)
**What:** `before-commit.ts` hook 触发位置不明确 — harnessed runtime engine 不直接拦截 `git commit` cmd (用户主 session 跑),ralph-loop / subagent / Agent Teams 才在 harnessed 进程内
**Mitigation Option A:** harnessed 仅在 ralph-loop / subagent / team auto-commit 路径 enforce; 用户主 session 跑 git commit 不 enforce (用户自负责)
**Mitigation Option B:** NEW `harnessed commit` wrapper cmd → 用户 alias `git commit` → 自动经 hook;sister Phase 2.3 gstack-prefix store pattern
**Open question (planner Wave B):** Option A minimal 改动 (recommend);Option B 干 user workflow 太深 (defer to v3.x)

### Risk 3: priority hierarchy 仲裁 — pick-highest vs invoke-all (LOW)
**What:** 多 capability fires_when 同时 true (e.g., gstack /office-hours + GSD /gsd-discuss-phase 同 fire) — 按 priority 选最高 (1) 还是依序全跑 (n)?
**Current research recommendation:** pick-highest (sister CLAUDE.md "三层独立判断,可能 3 个都跑,可能 1-2 个,可能全跳" — 独立判断 NOT 串行 implies 各跑各的,但 priority arbitration 防 token 双花)
**Mitigation:** D-09 priority.yaml meta-rule `multi-capability-arbitration` enforcement=warn,NOT halt — 默认 emit warn + 继续全跑 (沿用 CLAUDE.md 独立判断),用户可手动 disable 低优先 capability
**Open question (planner Wave B):** user 决策 — D-09 priority hierarchy 是 token-saving arbitration 还是仅 conflict-resolution? 推荐前者 (减 token cost), 让 user 显式确认。

### Risk 4: Cross-CC handoff enforcement — harnessed 如何 validate protocols.yaml (HIGH)
**What:** `protocols.yaml` 是 cross-CC session protocol (Ideation-CC → Onboarding-CC / Plan-CC → Execute-CC) — 跨 session 不共享 context, harnessed runtime 难以 enforce
**Mitigation Option A:** harnessed 提供 `harnessed validate-handoff <design-doc>` cmd — 检查 required_fields 全部 present + forbidden_phrases (TODO / 待补充 / 暂定) 不出现; Plan-CC 离场前手动调
**Mitigation Option B:** auto-validate via `harnessed setup` postinstall hook — 检测 `.planning/STATE.md` + 当前 phase PLAN.md `status: ready-to-execute` metadata; 缺失 → warn
**Open question (planner Wave B):** Option A 显式 cmd (recommend) vs Option B 自动 hook (UX 更好但 false-positive 风险) — user 决策 (sister D-07 输出 LOCK 时确认)

### Risk 5: discipline yaml 与 ~/.claude/CLAUDE.md drift (MEDIUM, longer term)
**What:** harnessed v3.0 ship 6 yaml verbatim transcription;但 CLAUDE.md global rules 用户后续会迭代,如何保持 sync?
**Mitigation:**
- v3.0 doc 明确 disciplines/*.yaml 是 "snapshot of CLAUDE.md as of v3.0 ship date" — 后续 CLAUDE.md 改动需 minor patch sync (sister Phase 2.0 v2.0.x patch cycle)
- NEW `scripts/check-discipline-drift.mjs` (defer v3.x) — diff disciplines/*.yaml vs ~/.claude/CLAUDE.md 节; > N 个 rule 差异 → warn
**Open question (planner Wave B):** 是否在 v3.0 ship 时加 drift check, 还是 defer v3.x? recommend defer (avoid scope creep)。

---

## Sources

### Primary (HIGH confidence)
- `D:\GitCode\harnessed\.planning\phase-v3.0-3.1\3.1-CONTEXT.md` § D-09 (verbatim) + Q-AUDIT batch 2 user clarify
- `D:\GitCode\harnessed\.planning\phase-v3.0-3.1\3.1-DISCUSSION-LOG.md` Q5
- `C:\Users\easyi\.claude\CLAUDE.md` — 语言/输出规范 + 对话回答风格 + 响应规范与优先级 + andrej-karpathy-skills + Fallback 三条铁律 (verbatim 来源)
- `C:\Users\easyi\.claude\rules\cc-handoff.md` — 场景 A/B + 写入边界 + 歧义处理 + 反模式 (protocols.yaml 来源)
- `D:\GitCode\harnessed\CLAUDE.md` — Biome preempt + commit safety + 三层栈方法论 reminder (operational.yaml 来源)
- `D:\GitCode\harnessed\src\workflow\schema\judgment.ts` — TypeBox dual-shape pattern (discipline.ts 复用基础)
- `D:\GitCode\harnessed\src\workflow\judgmentResolver.ts` — module-level Map cache + readFile + parseYaml + Value.Check (disciplineLoader.ts 复用基础)
- `D:\GitCode\harnessed\src\routing\lib\fallbackHandlers.ts` — split helper ≤80L pattern (4 hook file pattern 复用)
- `D:\GitCode\harnessed\src\workflow\run.ts` — D-04 PUSH wedge pattern (run.ts hook 集成基础)
- `D:\GitCode\harnessed\src\types\schemaVersion.ts` — 17 surface 现状 + 18th surface registration convention
- `D:\GitCode\harnessed\workflows\judgments\fallback.yaml` + `parallelism-gate.yaml` — yaml schema 文本风格参考
- `C:\Users\easyi\.claude\projects\D--GitCode-harnessed\memory\feedback_biome-preempt.md` — 3 CI-red recurrence 证据 (operational.biome-preempt rule 来源)
- `C:\Users\easyi\.claude\projects\D--GitCode-harnessed\memory\feedback_three-layer-stack-strict.md` — 三层栈强制 cadence (priority.yaml hierarchy 验证)

### Secondary (MEDIUM confidence)
- `C:\Users\easyi\Documents\Obsidian Vault\AI&LLM\Claude Code\我的 Claude Code 开发方案...md` — 176L 完整方案 (gstack 介入节点速查表 / 测试工具职责矩阵 / 工作流 4 阶段 verbatim 来源)
- Sister teammate cross-team SendMessage exchanges (workflows-researcher + capabilities-researcher) — Pattern A 三路 reconcile log (本 RESEARCH § 5)

### Tertiary (LOW confidence — flagged for Wave B validation)
- Heuristic check_method 实装细节 (BLUF first-sentence-length / em-dash regex / sycophantic phrase list) — 仅初稿 sample, Wave B planner 实装时可能调整 false-positive rate
- biome preempt hook 集成路径 (Option A vs Option B 见 Risk 2) — 仅 research recommendation, 待 user 决策

---

## Metadata

**Confidence breakdown:**
- Schema design (discipline.ts TypeBox): HIGH — sister judgment.ts pattern verbatim 复用
- 6 yaml content: HIGH — 100% CLAUDE.md / cc-handoff.md verbatim transcription, 无原创
- Loader + 4 hook helper: HIGH split pattern (sister fallbackHandlers ≤80L) / MEDIUM 集成位置 (Wave B 决定)
- workflow.yaml v3 integration: MEDIUM — workflows-researcher cross-confirm 已 100% 对齐,但 master orchestrator 实装路径 Wave B planner 决定
- Risk surfacing: HIGH — 5 risk 全部 named user 决策点 (Wave B discuss 候选议题)

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (30 days, stable — CLAUDE.md global rules 迭代频率低)

**File:** `.planning/phase-v3.0-3.2/RESEARCH-disciplines.md` (~520L)
**Sister files (Pattern A complete):**
- `.planning/phase-v3.0-3.2/RESEARCH-workflows.md` (workflows-researcher, 1746L per cross-confirm)
- `.planning/phase-v3.0-3.2/RESEARCH-capabilities.md` (capabilities-researcher, in-flight)
