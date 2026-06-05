---
phase: 3
version: 3.6.0
title: Clarification runtime detection — user-override + transparent skip
status: ready-for-review
created: 2026-05-25
depends_on: independent (不阻塞 Phase 1/2)
sister_cadence: v3.5.0 Phase 2 (ESCALATION_RULES inject pattern) + v3.4.4 (judgmentResolver expr-eval pipeline)
estimated_loc: ~120-170 src + ~60-80 test
estimated_commits: 4
---

# v3.6.0 Phase 3 — Clarification runtime detection

## Goal (one sentence)

把用户原话中明示 trigger 关键词("先 brainstorm" / "跑 office-hours" / "架构审查")的**用户覆盖判据**机器化(bypass expression evaluation 直接 fires=true),同时通过 discipline inject "拿不准 → 倾向跳过 + 透明声明" 行为给 spawned subagent(让它在 gate context 字段缺失/默认时 graceful skip,不静默执行)。

## Why (background)

`audit-harnessed-vs-user-rules-2026-05-25.md` 标定 P0b 为 "澄清运行时检测",对应 user CLAUDE.md L35-38 "Fallback 三条铁律":

> - 拿不准 → 倾向跳过,但在响应里**透明声明**: "这次跳过了 X, 因为 Y. 如果你认为需要请明说"
> - 用户明示 → 覆盖判据 (用户说 "先 brainstorm" / "跑 office-hours" / "讨论一下" 时无条件激活)
> - **链式互不前置**: 跳过战略层 ≠ 必须跳过 phase 层

当前实现 (`workflows/judgments/fallback.yaml`) 已经 declarative 描述 3 条规则,但**没有 runtime mechanism**:
- ✓ 链式互不前置 — 已 mechanized(3 个 gate yaml 互相独立 evaluate)
- ❌ 用户明示覆盖 — 没有 keyword → trigger mapping
- ❌ 拿不准透明声明 — 没有 discipline inject 给 spawned subagent

## Scope

### In-scope

| Sub-feature | 描述 | 实施层 |
|---|---|---|
| **3a. User-override mapping** | `workflows/judgments/user-overrides.yaml` (NEW) — keyword → trigger gate refs lookup table | yaml schema + judgmentResolver bypass + CLI keyword extraction |
| **3b. Transparent skip discipline** | spawned subagent 收到 prompt 含 "low-confidence → skip + transparent explanation" rule | `disciplines/operational.yaml` 加 rule + buildAgentDef inject(sister v3.5.0 Phase 2 ESCALATION_RULES) |

### Out-of-scope

- **NLP-based 用户 intent 理解** — 仅 substring keyword match(deterministic,不 LLM judgment;LLM judgment 留 Phase 4+ 的 Agent Teams 防呆思路)
- **跨语言 keyword 库** — 仅中英 2 语言 (sister `disciplines/language.yaml` 用户场景);其他语言留 v3.7+ empirical
- **历史 user message 累积** — 仅当前 task description / CLI args 中 keywords;不跨 session 累积(无 state)
- **chain-isolation 铁律 mechanism 改动** — 已 mechanized,Phase 3 不动

---

## Design details

### D1. `workflows/judgments/user-overrides.yaml` (NEW)

**Schema** (`harnessed.user-overrides.v1`):

```yaml
# v3.6.0 Phase 3 — user-override keyword → trigger gate refs lookup
# (P0b 上半,Audit § fallback 三条铁律 "用户明示 → 覆盖判据" mechanism)
#
# Runtime: CLI extracts keywords from user task description, matches against
# `keywords` substring patterns, collects matched `triggers[]` into
# gateContext.user_overrides[]. judgmentResolver pre-checks user_overrides[]
# before expression evaluation — if gateRef in user_overrides → fires=true bypass.

schema_version: harnessed.user-overrides.v1

overrides:
  - id: brainstorm
    keywords:
      - "先 brainstorm"
      - "brainstorm 一下"
      - "讨论一下"
      - "先想想"
      - "先讨论"
      - "brainstorm first"
      - "let's brainstorm"
    triggers:
      - judgments.subtask-gate.brainstorming.fires
      - judgments.stage-routing.discuss-subtask-delegate.fires

  - id: strategic-review
    keywords:
      - "跑 office-hours"
      - "office-hours"
      - "找 CEO"
      - "战略层"
      - "战略评估"
      - "plan-ceo-review"
    triggers:
      - judgments.strategic-gate.office-hours.fires
      - judgments.strategic-gate.plan-ceo-review.fires
      - judgments.stage-routing.discuss-strategic-delegate.fires

  - id: arch-review
    keywords:
      - "架构审查"
      - "plan-eng-review"
      - "复杂架构"
      - "engineering review"
    triggers:
      - judgments.architecture-gate.plan-eng-review.fires

  - id: phase-discuss
    keywords:
      - "phase 澄清"
      - "灰色澄清"
      - "discuss-phase"
      - "gsd-discuss-phase"
    triggers:
      - judgments.phase-gate.gray-areas.fires
      - judgments.stage-routing.discuss-phase-delegate.fires

  - id: paranoid-review
    keywords:
      - "关键模块"
      - "paranoid review"
      - "/review"
      - "staff engineer review"
    triggers:
      - judgments.stage-routing.verify-paranoid-critical.fires

  - id: tdd
    keywords:
      - "强制 TDD"
      - "TDD first"
      - "red-green-refactor"
      - "test first"
    triggers:
      - judgments.tdd-gate.tdd-strongly-suggested.fires
```

**Note**: trigger gate refs 必须真实存在(eg `judgments.subtask-gate.brainstorming.fires`)— Wave 4 reality check 跑 cross-validation 确保所有 trigger refs 在对应 yaml 真有 entry。

**LOC**: ~80 yaml (6 overrides × 8-12 lines each)

### D2. `judgmentResolver.ts` user-override bypass

**Change** (在 L42-46 函数入口,expression eval 之前):

```typescript
export async function resolveJudgmentGate(
  gateRef: string,
  context: Record<string, unknown>,
  packageRoot: string,
): Promise<boolean> {
  // v3.6.0 Phase 3 — user-override bypass (P0b 上半,Audit § fallback 三条铁律
  // "用户明示 → 覆盖判据"). CLI fills gateContext.user_overrides[] from task
  // description keyword match against workflows/judgments/user-overrides.yaml.
  // If gateRef present → fires=true bypass expression evaluation.
  const userOverrides = context.user_overrides as string[] | undefined
  if (userOverrides?.includes(gateRef)) {
    return true
  }

  // ... existing 4-part parsing + yaml load + eval (unchanged) ...
}
```

**LOC**: +6 src (1 import 已有 / 6 行 user-override check)

### D3. CLI keyword extraction — `src/cli/lib/extract-user-overrides.ts` (NEW)

**API**:

```typescript
export interface UserOverrideEntry {
  id: string
  keywords: string[]
  triggers: string[]
}

export async function loadUserOverrides(packageRoot: string): Promise<UserOverrideEntry[]>

export function extractMatchedTriggers(
  userText: string,
  overrides: UserOverrideEntry[],
): string[]  // returns all matched trigger gate refs (deduped)
```

**Match algorithm**: case-insensitive substring match(全语言 unified)。一个 user text 可能 match 多个 override entries → triggers union dedupe。

**Empty input → empty result**(no-op,不影响现有 behavior)。

**LOC**: ~50 src

### D4. `src/cli/run.ts` integration

CLI 入口在 `src/cli/run.ts` 接收 `--task <text>` 或 stdin。修改:

```typescript
// v3.6.0 Phase 3 — user-override extraction (P0b 上半)
const overrides = await loadUserOverrides(packageRoot)
const matchedTriggers = extractMatchedTriggers(userTaskText, overrides)
if (matchedTriggers.length > 0) {
  console.error(
    `ℹ user-override detected: ${matchedTriggers.length} trigger(s) ` +
      `forced fires=true via keyword match (${matchedTriggers.join(', ')})`,
  )
  gateContext.user_overrides = matchedTriggers
}
```

**LOC**: +10-15 src

### D5. `disciplines/operational.yaml` — transparent-skip rule (3b)

**Add new rule** to `operational.yaml`:

```yaml
  - id: transparent-skip-on-low-confidence
    description: |
      When a phase gate condition cannot be confidently evaluated (e.g.
      expected context fields missing, default-valued, or contradictory),
      prefer skip + transparent explanation over silent execution.
      Verbatim format: "这次跳过了 <phase>, 因为 <reason>. 如果你认为
      需要请明说" / English: "Skipped <phase> because <reason>. Tell me
      if you actually need it."
    enforcement: warn
    trigger: gate_evaluation_low_confidence
    check_method: prompt-inject
```

**LOC**: +14 yaml

### D6. `buildAgentDef` inject — extend `ESCALATION_RULES` const (or NEW const)

`src/workflow/run.ts` 当前 `ESCALATION_RULES` (v3.5.0 Phase 2 ship) inject 5-trigger escalation rules。Phase 3 加新 const `TRANSPARENT_SKIP_RULES` inject 到 same `criticalSystemReminder_EXPERIMENTAL` 字段(append after ESCALATION_RULES):

```typescript
// v3.6.0 Phase 3 — Transparent-skip rule injection (P0b 下半). Spawned subagent
// follows fallback 三条铁律 "拿不准 → 倾向跳过 + 透明声明" instead of silent
// execution when gate context is ambiguous.
const TRANSPARENT_SKIP_RULES = `When you encounter a phase gate or routing decision where the input context is missing key fields, default-valued, or contradictory, do NOT proceed silently. Instead, skip the phase and emit a one-line transparent explanation:

  "Skipped <phase>, because <reason>. Tell me if you actually need it."
  (中文: "这次跳过了 <phase>, 因为 <reason>. 如果你认为需要请明说.")

This applies to: strategic-layer review skip / phase-layer clarification skip / subtask-brainstorming skip / TDD enforcement skip / Agent Teams escalation skip. Chain-isolation rule: skipping one layer does NOT mandate skipping subsequent layers — each layer is independently evaluated.`

// In buildAgentDef body:
const criticalReminder = `${ESCALATION_RULES}\n\n${TRANSPARENT_SKIP_RULES}`
return {
  ...
  criticalSystemReminder_EXPERIMENTAL: criticalReminder,
  ...
}
```

**LOC**: +20 src

---

## Wave 切分 (4 commits)

### Wave 1 — yaml schema + user-overrides.yaml + judgmentResolver bypass
- **Files**:
  - `workflows/judgments/user-overrides.yaml` (NEW)
  - `src/workflow/schema/judgment.ts` (extend with new `UserOverridesFile` schema)
  - `src/workflow/judgmentResolver.ts` (+6 lines user-override bypass)
- **LOC**: ~100 (~80 yaml + ~15 schema + ~6 resolver)
- **Build gate**: `corepack pnpm build` 0 红
- **Commit**: `feat(judgments): v3.6.0 Phase 3 Wave 1 — user-overrides.yaml + judgmentResolver bypass (P0b 上半)`

### Wave 2 — CLI keyword extraction + integration
- **Files**:
  - `src/cli/lib/extract-user-overrides.ts` (NEW)
  - `src/cli/run.ts` (+10-15 lines integration)
- **LOC**: ~60 src
- **Build gate**: `corepack pnpm build` 0 红
- **Commit**: `feat(cli): v3.6.0 Phase 3 Wave 2 — extract user-override keywords + inject into gateContext`

### Wave 3 — Transparent-skip discipline + buildAgentDef inject
- **Files**:
  - `workflows/disciplines/operational.yaml` (+14 lines new rule)
  - `src/workflow/run.ts` (TRANSPARENT_SKIP_RULES const + buildAgentDef append)
- **LOC**: ~35 src/yaml
- **Build gate**: `corepack pnpm build` 0 红
- **Commit**: `feat(workflow): v3.6.0 Phase 3 Wave 3 — transparent-skip discipline + buildAgentDef inject (P0b 下半)`

### Wave 4 — Tests + Reality check + CHANGELOG
- **Files**:
  - `tests/workflow/user-override-resolver.test.ts` (NEW) — 4-5 cells: bypass when matched / fall-through when not matched / empty user_overrides no-op / multi-trigger union dedupe
  - `tests/cli/lib/extract-user-overrides.test.ts` (NEW) — 3-4 cells: substring match cases / case-insensitive / empty input
  - `tests/workflow/run.test.ts` (update) — 1-2 cells: buildAgentDef includes TRANSPARENT_SKIP_RULES in criticalSystemReminder
- **LOC**: ~70-90 test
- **Reality check**:
  - `pnpm build` 0 红
  - `pnpm test` ≥baseline + 8-10 new cells
  - Cross-validation: all trigger gate refs in user-overrides.yaml exist in target yaml (Wave 4 script: parse user-overrides + cross-check `gateRef in <judgments/file>.yaml.triggers` — 灰区 #1 protocol if any missing)
  - 加 CHANGELOG v3.6.0 Phase 3 section
- **Commit**: `test+docs: v3.6.0 Phase 3 Wave 4 — user-override + transparent-skip coverage + CHANGELOG`

---

## 灰区 (实施 subagent 遇到必须 STATUS: NEEDS_CLARIFICATION)

1. **user-overrides.yaml 中某 trigger gate ref 在目标 yaml 不存在**(cross-validation 失败)→ return,问是修 user-overrides.yaml 还是修目标 yaml(可能 trigger 命名 drift)
2. **`judgments.architecture-gate.plan-eng-review.fires` 这个 gate ref 当前 yaml schema 不在**(已有 yaml 是 `strategic-gate` / `phase-gate` / `subtask-gate` / `tdd-gate` / `fallback` / `parallelism-gate` / `web-*-routing`)→ return,问是 1) 删除 user-overrides arch-review 条目还是 2) Phase 3 顺便创建 `architecture-gate.yaml`(scope creep)
3. **trigger gate refs 命名 inconsistency**:user-overrides.yaml 用 `judgments.X.Y.fires` 4-part format,但 `judgmentResolver.ts` 验证 4-part,需要确认 gate ref 真实命名(可能 sub-workflow gate ref 是 `judgments.stage-routing.X.fires` 而不是 `judgments.subtask-gate.brainstorming.fires`)→ return + 列实际 gate ref 命名
4. **`ESCALATION_RULES` const 与 `TRANSPARENT_SKIP_RULES` 合并后 prompt 太长**(v3.5.0 ship 320 tokens + Phase 3 ~150 tokens = ~470 tokens/spawn,占 spawn budget 较多)→ return,问是接受 overhead 还是 conditional inject(只在 ambiguous phase context 时 inject)
5. **`disciplines/operational.yaml` schema 不接受 check_method: prompt-inject**(可能 enum 限制)→ return + 列 schema 实际允许的 check_method 值
6. **`src/cli/run.ts` 当前 task description 解析逻辑不暴露 `userTaskText` 变量**(可能 stdin 路径与 CLI flag 路径分离)→ return + 列实际入口函数与变量名
7. **任何 Wave 后 `pnpm build` 红 / `pnpm test` 红** → 立即 return,**不 fix-forward**

---

## Sister 文件参考

- `D:/GitCode/harnessed/src/workflow/judgmentResolver.ts` — Wave 1 主目标
- `D:/GitCode/harnessed/src/workflow/schema/judgment.ts` — schema extend target
- `D:/GitCode/harnessed/workflows/judgments/fallback.yaml` — sister yaml schema(`rules` vs `triggers`)
- `D:/GitCode/harnessed/src/cli/run.ts` — Wave 2 integration target
- `D:/GitCode/harnessed/src/workflow/run.ts` L72-86 — `ESCALATION_RULES` v3.5.0 Phase 2 sister pattern(Wave 3 append)

---

## Acceptance criteria

- [ ] Wave 1: user-overrides.yaml + schema + judgmentResolver bypass landed
- [ ] Wave 2: extract-user-overrides.ts + CLI integration landed
- [ ] Wave 3: operational.yaml + buildAgentDef TRANSPARENT_SKIP_RULES landed
- [ ] Wave 4: tests ≥+8 cells pass + reality check 0 红 + CHANGELOG section
- [ ] Cross-validation: all 6 override entries × 1-3 triggers each → all gate refs exist in target judgments yaml
- [ ] User CLI invocation with "先 brainstorm" in task → stderr ℹ message + spawned phase 强制 fires=true
- [ ] Spawned subagent prompt contains BOTH ESCALATION_RULES + TRANSPARENT_SKIP_RULES verbatim

---

## Risk + rollback

- **Risk 1**: keyword false-positive trigger override(user 说 "我不想 brainstorm" → 仍 match "brainstorm" → 错误 override)
  - **Mitigation**: keyword 选择 specific phrases ("先 brainstorm" 比 "brainstorm" 单词更精确);v3.7+ 加 negation detection
- **Risk 2**: `TRANSPARENT_SKIP_RULES` prompt overhead bloats spawn cost
  - **Mitigation**: 灰区 #4 协议;v3.7+ conditional inject(只在 phase gate eval throw 时 inject)
- **Risk 3**: yaml schema breaking change 影响现有 judgmentResolver 测试
  - **Mitigation**: 灰区 #1-3 协议;Wave 1 schema extend additive only(新 `UserOverridesFile` schema 独立 export,不修 `JudgmentTriggersFile`)
- **Risk 4**: cross-validation 发现现有 yaml 缺少 trigger entry(命名 drift)
  - **Mitigation**: 灰区 #2-3 协议;不应在 Phase 3 内 scope creep 修 trigger naming

- **Rollback**: 4 atomic commits;Wave 1 + Wave 3 各自独立产生功能,Wave 2 + Wave 4 是集成 + 验证。任何 Wave fail 可单独 revert,不影响其他 Wave 已 landed 功能。

---

*Spec written 2026-05-25 by main session per v3.5.0 sister cadence + Phase 1/2 SPEC pattern.*
*Approval gate: user review this spec → ack → spawn implementation subagent.*
