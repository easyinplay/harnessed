---
phase: 3
version: 3.8.0
title: P1 Conditional RULES inject — prompt budget optimization
status: ready-for-review
created: 2026-05-25
sister_cadence: v3.6.0 Phase 4 (AGENT_TEAMS_PREVENTION_RULES inject)
estimated_loc: ~50-80 src + ~50-80 test
estimated_commits: 3 (Wave 1 schema + buildAgentDef / Wave 2 yaml declarations / Wave 3 tests + reality)
verified_refs:
  - "src/workflow/run.ts:L136 CRITICAL_SYSTEM_REMINDER const (existing v3.6.0 Phase 4)"
  - "src/workflow/run.ts:L169 buildAgentDef function (existing v3.4.4 Phase 4)"
  - "src/workflow/run.ts:L272 buildAgentDef call site in _dispatchSkillStub (existing)"
  - "src/workflow/schema/workflow.ts:L85-105 WorkflowPhaseV3 schema additionalProperties:false (existing)"
  - "src/workflow/run.ts:L72-86 ESCALATION_RULES const (existing v3.5.0 Phase 2)"
  - "src/workflow/run.ts:L100+ TRANSPARENT_SKIP_RULES + AGENT_TEAMS_PREVENTION_RULES const (existing v3.6.0 Phase 3/4)"
  - "workflows/task/deliver/workflow.yaml (existing)"
  - "workflows/task/test/workflow.yaml (existing)"
  - "workflows/verify/multispec/workflow.yaml (existing)"
---

# v3.8.0 Phase 3 — P1 Conditional RULES inject

## Goal (one sentence)

让 spawned subagent 的 `criticalSystemReminder_EXPERIMENTAL` 字段**按 phase 类型动态构造**(默认 `ESCALATION + TRANSPARENT_SKIP` ≈ 470 tokens;`task/deliver` + `task/test` + `verify/multispec` 等真涉及 Agent Teams escalation 的 phase 额外加 `AGENT_TEAMS_PREVENTION_RULES` ≈ 670 tokens),从 v3.6.0 Phase 4 ship 的 "全部 670 tokens/spawn" 优化到 "平均 ~500 tokens/spawn"(~25% 节省)。

## Why

v3.6.0 Phase 4 ship 时把 3 个 RULES 全部 inject 到 **所有** spawned subagent。但实际 RULES 相关性按 phase 类型差异大:
- `task-deliver` / `verify-multispec` / `task-test`(核心逻辑 / TDD / 多 specialist team)→ Agent Teams escalation 真可能 fire → 全 3 项有意义
- `task-clarify` / `verify-progress` / `discuss-strategic` / `retro` → escalation triggers 几乎不会 fire → `AGENT_TEAMS_PREVENTION_RULES` (~200 tokens) 是 dead weight

v3.7+ BACKLOG.md P1 评估 budget 13% → ~5%(只 inject 通用 2 项)是合理优化。

## Scope

### In-scope (3 wave)

| Component | Change | Wave |
|---|---|---|
| `WorkflowPhaseV3` schema | Add optional `injects_rules: Array(string)` field | Wave 1 |
| `buildAgentDef` signature | Add optional `injectsRules?: string[]` param | Wave 1 |
| `buildAgentDef` body | Dynamic construct `criticalSystemReminder` from injectsRules | Wave 1 |
| `_dispatchSkillStub.fn` | Read `ph.injects_rules` from phase, pass to buildAgentDef | Wave 1 |
| `workflows/task/deliver/workflow.yaml` | Declare `injects_rules: [escalation, transparent-skip, agent-teams-prevention]` | Wave 2 |
| `workflows/task/test/workflow.yaml` | Same | Wave 2 |
| `workflows/verify/multispec/workflow.yaml` | Same | Wave 2 |
| Tests | New cells: default 2 RULES / opt-in 3 RULES / unknown RULES name silent skip | Wave 3 |
| Reality check + CHANGELOG | Dry-run smoke + CHANGELOG section | Wave 3 |

### Out-of-scope

- **Per-capability `requires_rules` registry** — alternative design (capability declares 它 requires 哪些 RULES, buildAgentDef union 所有 phase.invokes_tools 引用的 capability 的 requires_rules)。更精确但复杂度高,defer v3.9+ empirical signal driven
- **Other phases (research / retro / discuss-* / plan-* / verify-progress/qa/security/design/simplify/code-review/paranoid + task-clarify/code)**: 用 default 2 RULES,不显式 declare(避免大规模 yaml touch)
- **RULES 文本本身改动** — 现有 3 const 不动,只改 inject 逻辑

## Design details

### D1. `WorkflowPhaseV3` schema extend — `src/workflow/schema/workflow.ts:L85-105` ✓ existing

**Current** (L85-105):
```typescript
export const WorkflowPhaseV3 = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    // ... 11 existing fields ...
    invokes_tools: Type.Optional(Type.Array(InvokeToolClause)),
  },
  { additionalProperties: false },
)
```

**Change** — add optional field at end:

```typescript
    invokes_tools: Type.Optional(Type.Array(InvokeToolClause)),
    // v3.8.0 P1 — conditional RULES inject. Empty/absent → default
    // ['escalation', 'transparent-skip']. Declare ['agent-teams-prevention']
    // (or 3-item array) on phases that genuinely involve Agent Teams escalation
    // (task-deliver / task-test / verify-multispec). Unknown rule names silently
    // skipped at runtime (forward-compat for future RULES additions).
    injects_rules: Type.Optional(Type.Array(Type.String())),
```

LOC: +3

### D2. `buildAgentDef` extend — `src/workflow/run.ts:L169` ✓ existing

**Current signature** (L169-175 estimated):
```typescript
export function buildAgentDef(
  skillName: string,
  rolePrompts?: Record<string, RolePrompt>,
  workflowName?: string,
  modelTierOverride?: string,
): AgentDefinition
```

**Change**:

```typescript
export function buildAgentDef(
  skillName: string,
  rolePrompts?: Record<string, RolePrompt>,
  workflowName?: string,
  modelTierOverride?: string,
  injectsRules?: readonly string[],
): AgentDefinition
```

**Body change** — instead of using `CRITICAL_SYSTEM_REMINDER` const directly, build per-call:

```typescript
const RULES_MAP: Record<string, string> = {
  'escalation': ESCALATION_RULES,
  'transparent-skip': TRANSPARENT_SKIP_RULES,
  'agent-teams-prevention': AGENT_TEAMS_PREVENTION_RULES,
}

const DEFAULT_RULES = ['escalation', 'transparent-skip'] as const

function buildCriticalReminder(injectsRules?: readonly string[]): string {
  const rules = injectsRules ?? DEFAULT_RULES
  return rules
    .map((name) => RULES_MAP[name])
    .filter((rule): rule is string => rule !== undefined)
    .join('\n\n')
}
```

**Both code paths in buildAgentDef** (L181 + L201 ✓ existing):
```typescript
criticalSystemReminder_EXPERIMENTAL: buildCriticalReminder(injectsRules),
```

`CRITICAL_SYSTEM_REMINDER` const can be **kept** as backward-compat / docs reference, or **removed** (YAGNI — only used at L181/L201 which now go through buildCriticalReminder). Spec proposes **remove** for cleanliness.

LOC: +20 src (RULES_MAP + DEFAULT_RULES const + buildCriticalReminder fn + 2 call site update)

### D3. `_dispatchSkillStub.fn` pass injectsRules — `src/workflow/run.ts:L272` ✓ existing

**Current**:
```typescript
buildAgentDef(skillName, opts?.rolePrompts, opts?.workflowName, opts?.modelTierOverride),
```

**Change** — read `injects_rules` from `phase` param (currently received but not destructured for this field):

```typescript
const injectsRules =
  phase && typeof phase === 'object' && 'injects_rules' in phase && Array.isArray(phase.injects_rules)
    ? (phase.injects_rules as string[])
    : undefined

// Pass to buildAgentDef:
buildAgentDef(
  skillName,
  opts?.rolePrompts,
  opts?.workflowName,
  opts?.modelTierOverride,
  injectsRules,
),
```

LOC: +6

### D4. Yaml declarations — Wave 2

3 workflow.yaml files declare `injects_rules` in their phase entries (each has 1-2 phases typically):

**`workflows/task/deliver/workflow.yaml`** ✓ existing:
```yaml
phases:
  - id: 01-deliver
    ...
    injects_rules: [escalation, transparent-skip, agent-teams-prevention]
  - id: 02-progress-mark
    ...
    # No injects_rules → default 2
```

**`workflows/task/test/workflow.yaml`** ✓ existing:
```yaml
phases:
  - id: 01-test
    ...
    injects_rules: [escalation, transparent-skip, agent-teams-prevention]
```

**`workflows/verify/multispec/workflow.yaml`** ✓ existing — 2 phases (01-team-create + 02-team-cleanup):
```yaml
phases:
  - id: 01-team-create
    ...
    injects_rules: [escalation, transparent-skip, agent-teams-prevention]
  - id: 02-team-cleanup
    ...
    injects_rules: [escalation, transparent-skip, agent-teams-prevention]
```

LOC: ~12 yaml additions

### D5. Tests — Wave 3

`tests/workflow/buildAgentDef.test.ts` (sister v3.6.0 Phase 4 F7/F8) new cells:

- **F9**: `buildAgentDef(skillName)` without `injectsRules` → reminder contains escalation + transparent-skip but NOT agent-teams-prevention
- **F10**: `buildAgentDef(skillName, ..., ['escalation', 'transparent-skip', 'agent-teams-prevention'])` → reminder contains all 3
- **F11**: `buildAgentDef(skillName, ..., ['escalation'])` → reminder contains escalation only (single-rule case)
- **F12**: `buildAgentDef(skillName, ..., ['unknown-rule', 'escalation'])` → reminder contains escalation only (unknown silently skipped, forward-compat)
- **F13**: `_dispatchSkillStub.fn` with mock phase having `injects_rules: [...]` → passes through to buildAgentDef

LOC: ~70-90 test

### D6. Token budget verification

**Default (2 RULES)**: ESCALATION (~320) + TRANSPARENT_SKIP (~150) = **~470 tokens/spawn**
**Opt-in (3 RULES)**: + AGENT_TEAMS_PREVENTION (~200) = **~670 tokens/spawn** (unchanged from v3.6.0 Phase 4)

Weighted average across 24 sub-workflows(估算 3-5 opt-in vs 19-21 default):
- 5 opt-in × 670 + 19 default × 470 = 3350 + 8930 = 12280 / 24 = **~512 tokens/spawn average**

vs. v3.6.0 Phase 4 全 670: **~24% reduction** average.

## Wave 切分

### Wave 1 — schema + buildAgentDef
- **Files**: `src/workflow/schema/workflow.ts` (+3) + `src/workflow/run.ts` (~+26 / -3)
- **Build gate**: `pnpm build` 0 红(TS strict — `injectsRules` param 类型推断)
- **Test gate**: 1117 pass(无 yaml declarations,所有 phase 走 default 2 RULES;预期 v3.6.0 Phase 4 F7/F8 测试可能 fail 因为 chain order assertion 现在缺 AGENT_TEAMS_PREVENTION_RULES — 灰区 protocol if so)
- **Commit**: `feat(workflow): v3.8.0 Phase 3 Wave 1 — schema injects_rules + buildAgentDef dynamic chain`

### Wave 2 — yaml declarations
- **Files**: 3 workflow.yaml (~12 lines total)
- **Build/test gate**: unchanged from Wave 1 baseline
- **Commit**: `feat(workflows): v3.8.0 Phase 3 Wave 2 — declare injects_rules on 3 Agent Teams-aware phases`

### Wave 3 — Tests + Reality + CHANGELOG
- **Files**: `tests/workflow/buildAgentDef.test.ts` (+5 cells ~70-90 LOC) + CHANGELOG (~10 lines)
- **Build/test gate**: ≥1122 pass(1117 baseline + 5 new cells)
- **Reality**: dry-run `node dist/cli.mjs run task-deliver --task X --dry-run` → envelope JSON 含 criticalSystemReminder 含 3 RULES;dry-run `task-clarify` → 含 2 RULES only
- **Commit**: `test+docs: v3.8.0 Phase 3 Wave 3 — conditional inject coverage + CHANGELOG`

## 灰区 (实施 subagent 触发 STATUS: NEEDS_CLARIFICATION)

1. **F7/F8 (v3.6.0 Phase 4) assertion fails** — F7 asserts criticalSystemReminder contains all 3 RULES;F8 asserts chain order ESCALATION → TRANSPARENT_SKIP → AGENT_TEAMS_PREVENTION。Wave 1 后 默认 phase 走 default 2 RULES,F7/F8 测试 buildAgentDef without injectsRules 会 fail。
   - **建议处置 (in SPEC)**: Wave 1 同时 update F7/F8 — call buildAgentDef with explicit `['escalation', 'transparent-skip', 'agent-teams-prevention']` 以维持原 assertion 语义
   - 若 subagent 遇到不符 expectation 的现状 → return 灰区,让主 session 决定 update F7/F8 vs add separate test
2. **`CRITICAL_SYSTEM_REMINDER` const removal** breaks downstream consumers(unlikely 因为 export 但 grep verify) → return 灰区 if 发现 references
3. **`additionalProperties: false`** schema 接受 `injects_rules` after Type.Optional add(应该没问题,additive change)→ return if 意外
4. **Yaml validator parse error** on 3 workflow.yaml(unlikely)→ return
5. **dry-run smoke fail** — task-deliver dry-run envelope 不包含预期 3 RULES → return,verify Wave 2 yaml declarations correct

## Acceptance criteria

- [ ] Wave 1: schema + buildAgentDef + dispatchSkillStub landed,build 0 红,test 1117+ pass
- [ ] Wave 2: 3 yaml files declare injects_rules,build 0 红
- [ ] Wave 3: 5 new tests pass + dry-run smoke verify default vs opt-in inject + CHANGELOG section
- [ ] Token budget verified: task-clarify default 2 RULES,task-deliver opt-in 3 RULES
- [ ] No regression: existing F1-F8 (v3.6.0 Phase 4) tests pass (may need F7/F8 update per 灰区 #1)

## Risk + rollback

- **Risk 1**: Wave 1 breaks F7/F8 sister tests → 灰区 #1 protocol,主 session 裁决
- **Risk 2**: schema additive change breaks v2-schema workflow(plan-feature / verify-work)→ 不会,因为 `injects_rules` 只在 v3 schema 加;v2 schema 不动
- **Risk 3**: LLM 行为 emergent — spawned subagent 在不 inject AGENT_TEAMS_PREVENTION 时可能 reject escalation 信号
  - **Mitigation**: 实际上 escalation signal 不依赖 prevention rules(prevention 只是 cleanup discipline);spawned subagent 仍可正常 set `needs_teams_escalation: true`
  - dry-run smoke 验证

- **Rollback**: 3 atomic commits,可单独 revert。Yaml declarations 可一次 revert 复原 v3.7.0 状态(全部 default 2 RULES;但实际默认是 v3.8.0 行为,因此 revert 后 spawned subagent 缺 AGENT_TEAMS_PREVENTION_RULES — 跟 v3.6.0 Phase 4 ship 前行为一致)

---

*Spec written 2026-05-25 by main session per v3.8.0 P2 checklist applied (verified_refs frontmatter + grep verification before write).*
*Approval gate: user review this spec → ack → main session executes (small enough scope to skip subagent overhead).*
