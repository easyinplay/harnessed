# AgentDefinition Factory Contract (v1, frozen at phase 1.3 ship)

> **Status**: Draft v1 — frozen at phase 1.3 ship time
> **Source of Truth**: phase 1.3 RESEARCH.md § 4 (P0-4) + ASSUMPTIONS § B P0-4 (D1.3-6) + R1 PATTERNS D-12
> **Owners**: phase 1.4 routing engine implementation team
> **Verified Against**: code.claude.com/docs/en/agent-sdk/subagents (fetched 2026-05-12)
> **Migration Path**: Any v2 evolution (字段 add / signature change / error path 改) MUST go through ADR 0008+ errata path (A7 守恒 mode — 不动 v1 main body)

---

## § 1 Why this contract

phase 1.4 routing engine v1 implementation depends on a stable AgentDefinition factory pattern. Prior to phase 1.3, sister review M5 finding (phase 1.2.5) flagged that:

1. RESEARCH-1 § 3.1 inheritance table cited 7 fields; **5 fields missing** (`disallowedTools` / `memory` / `maxTurns` / `background` / `effort`) — incomplete contract = phase 1.4 plan-checker actionability gap.
2. No factory function signature documented — phase 1.4 implementation could pick any signature, breaking 1:1 alignment with this contract.
3. Error handling paths (skill-not-installed / no-COMPLETE / spawn-fail / verbatim-COMPLETE risk) not enumerated — phase 1.4 runtime might silently fail.
4. ralph-loop integration semantics (`--completion-promise "COMPLETE"` + `--max-iterations 20` + factory-internal `maxTurns × 50`) not normative.

This contract closes those gaps. **D-12 lock**: phase 1.3 ships **draft only** (no factory implementation code) —守 phase 1.3 / 1.4 边界. phase 1.4 plan-checker will use this document as V1 BLOCKER acceptance bar.

---

## § 2 AgentDefinition 12-field schema (12 字段 complete)

The 12 fields are imported from `@anthropic-ai/claude-agent-sdk` `AgentDefinition` type. Verified against code.claude.com 2026-05-12 fetch.

### § 2.1 Required (2 fields)

| Field | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | ✅ | Natural-language description of when to use this agent. Used by main agent to decide spawn-or-not (when `Agent` tool is available). |
| `prompt` | `string` | ✅ | The agent's system prompt — defines role, behavior, tone, output contract (e.g., "must end with verbatim COMPLETE token"). |

### § 2.2 Optional (10 fields)

| Field | Type | Description |
|---|---|---|
| `tools` | `string[]` | Array of allowed tool names (e.g., `["Read", "Grep", "Glob"]`). **Omitted = inherit ALL tools from main agent**. Subagents must NOT include `Agent` (no recursive spawn — phase 1.2.5 RESEARCH-1 § 1.1 Fact D / hard ceiling). |
| `disallowedTools` | `string[]` | Tool names to remove from the agent's tool set (e.g., `["Skill(playwright-cli)"]` for testing-category perf/a11y/memory tasks where playwright-cli is forbidden by CLAUDE.md routing rule). Applied AFTER `tools` filter. |
| `model` | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit' \| string` | Model override per agent. `'inherit'` = use main agent's model. Useful for cost/perf trade-off (opus for complex reasoning, haiku for cheap classification). |
| `skills` | `string[]` | **List of skill names to preload into agent's context at startup. Unlisted skills remain invocable through Skill tool**. **CRITICAL**: skills must be installed in `~/.claude/skills/` BEFORE spawn — main process is responsible (see § 4 / § 5 path 1). |
| `mcpServers` | `(string \| object)[]` | MCP servers available to this agent — by name (referencing main config) or inline config object. |
| `memory` | `'user' \| 'project' \| 'local'` | Memory source for this agent. `'user'` = user-level CLAUDE.md / `'project'` = project-level CLAUDE.md / `'local'` = local-only memory. |
| `maxTurns` | `number` | Maximum agentic turns (LLM round-trips) before agent stops. Acts as hard upper bound; recommended `50` (see § 6 ralph-loop integration). |
| `background` | `boolean` | Run agent as non-blocking background task. Main agent does not await result; suitable for fire-and-forget side tasks. |
| `effort` | `'low' \| 'medium' \| 'high' \| 'xhigh' \| 'max' \| number` | Reasoning effort level. Higher = more thinking tokens consumed; trade-off vs cost. |
| `permissionMode` | `'default' \| 'acceptEdits' \| 'bypassPermissions' \| 'plan'` | Permission mode for tool execution within this agent. **Distinct from main agent's `permissionMode`** — subagent isolation table (RESEARCH-1 § 1.1) confirms each agent has its own permission scope. |

### § 2.3 What's intentionally NOT included

- `agents` field — subagents CANNOT spawn their own subagents (RESEARCH-1 § 1.1 Fact D). Hard ceiling.
- `cwd` / `env` — no per-agent shell context override; inherited from main agent process.

---

## § 3 Factory function signature (normative)

```typescript
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk'

/** Decision output from routing engine arbitrate (phase 1.3 T3.2 src/routing/decisionRules.ts) */
interface ArbitrateResult {
  matched_rule_id: string | null
  primary_expert: string | null
  secondary_expert: string | null
  category: 'meta' | 'engineering' | 'design' | 'content' | 'testing' | 'search'
  forbidden_skills?: string[]    // 来自 decision_rules.yaml rules.decision.forbidden
  complexity?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
}

/** Task context — user query + override signals + run-time hints */
interface TaskContext {
  task: string                     // user task description (verbatim)
  override_keywords: string[]      // 命中的 override_signals (e.g., ["做出风格"])
  task_type?: 'ui-design' | 'pptx' | 'perf' | 'a11y' | 'memory-leak' | 'e2e' | 'search' | 'meta' | string
  cwd?: string                     // 任务执行根目录 (用于 memory='project' resolution)
}

/** Caller-provided overrides (test harness, A/B routing experiments) */
interface AgentDefinitionOpts {
  modelOverride?: AgentDefinition['model']
  permissionModeOverride?: AgentDefinition['permissionMode']
  effortOverride?: AgentDefinition['effort']
  maxTurnsOverride?: number
}

/**
 * harnessed AgentDefinition factory — phase 1.4 routing engine entry point.
 *
 * Pure function (no side effects, no spawn). Returns AgentDefinition shape
 * suitable for `query({ options: { agents: { name: factory(...) } } })` API.
 *
 * Async because § 5 path 1 (skill-not-installed fail-fast) requires fs.access
 * check on `~/.claude/skills/<name>/SKILL.md`.
 */
export type AgentFactory = (
  task: TaskContext,
  decision: ArbitrateResult,
  opts: AgentDefinitionOpts,
) => Promise<AgentDefinition>
```

**Rationale**:
- `Promise<AgentDefinition>` (not sync) — fail-fast skill check needs fs I/O
- `task` first (most variable) → `decision` (router output) → `opts` (caller overrides last)
- No exception variant in return type; errors thrown as typed `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` (caught by main agent — see § 5)

---

## § 4 `skills` field semantics (normative)

`skills: string[]` carries **skill name references** (e.g., `["ui-ux-pro-max", "design-taste-frontend"]`). The Claude Code runtime contract:

1. **Pre-install responsibility**: main process (orchestrator) MUST install all skills in `~/.claude/skills/<name>/SKILL.md` BEFORE the `query()` call that spawns this agent. Reference: phase 1.3 `harnessed install-base` 子命令 + per-manifest `install` block.
2. **Startup injection**: at agent spawn time, Claude Code reads each `~/.claude/skills/<name>/SKILL.md` and injects content into the agent's startup context — same as main agent's auto-loaded skills. Unlisted skills remain invocable via the `Skill` tool but are not preloaded.
3. **Fail-fast contract** (harnessed factory ADDS over Anthropic's contract): if any name in `skills` lacks `~/.claude/skills/<name>/SKILL.md`, the factory throws `SkillNotInstalledError(name)` BEFORE returning AgentDefinition. Rationale: silent fallback (CC behavior with missing skill is undefined — may startup-fail OR may degrade silently) makes user diagnosis hard. Fail-fast + actionable hint (`run 'harnessed install-base --apply' or 'harnessed install <name> --apply'`) is the safer default.

---

## § 5 Error handling paths (4 paths)

### § 5.1 Path 1 — skill not installed (fail-fast)

**Trigger**: factory called with `decision.primary_expert = "ui-ux-pro-max"` but `~/.claude/skills/ui-ux-pro-max/SKILL.md` missing.

**Behavior**: throw `SkillNotInstalledError(name)` BEFORE returning AgentDefinition. Main agent SHOULD catch this and either:
- (a) trigger install flow (`harnessed install <name> --apply --non-interactive`) + retry, OR
- (b) abort with actionable hint to user.

**Anti-pattern (rejected)**: silent fallback — drop skill from `skills` array, spawn anyway. Rejected because CC startup behavior with missing skill is unspecified, and silent skill-drop hides routing errors from user.

### § 5.2 Path 2 — subagent final message no-COMPLETE (ralph-loop retry)

**Trigger**: subagent returns final message but does NOT contain verbatim `COMPLETE` token. F33 mitigation (RESEARCH-1 § 6) — main agent MUST detect verbatim string match (not summarized).

**Behavior**:
- Main agent main system prompt MUST instruct: "When delegating via Agent tool, do NOT summarize subagent final message; pass verbatim back."
- After Agent tool return, main agent MUST grep verbatim `COMPLETE` in subagent final message string.
- If absent → ralph-loop retry: factory called AGAIN with augmented `task.task` ("previous attempt did not produce COMPLETE; please fix X and emit COMPLETE token") + `opts.maxTurnsOverride` decremented.
- Ralph-loop external `--max-iterations 20` cap. After 20 retries → main agent writes `progress.md` BLOCKED finding + escalates to human.

**Anti-pattern (rejected)**: trust subagent's "looks done" final message without verbatim check — silent quality drift.

### § 5.3 Path 3 — spawn fail (transient error)

**Trigger**: `query({ agents: { name: factory(...) } })` throws (network / model rate limit / timeout / SDK internal error).

**Behavior**: NOT factory's responsibility — factory is pure (sync inputs → AgentDefinition). Main agent runtime handles spawn fail with backoff retry / fallback to lower-priority rule / supervisor escalation. **Out of scope for phase 1.3 contract** (phase 1.4 routing engine runtime spec).

### § 5.4 Path 4 — verbatim COMPLETE summarize risk (F33 mitigation)

**Trigger**: subagent IS producing COMPLETE in its actual final message, BUT main agent's prompt is summarizing rather than passing verbatim → false negative on grep check (Path 2 wrongly retries forever).

**Behavior**: main agent system prompt explicit instruction (mandatory):
> "When invoking Agent tool, pass the subagent's final message string verbatim to the user-visible output and to ralph-loop COMPLETE-detection. Do NOT summarize, paraphrase, or add prefixes/suffixes."

This instruction is part of phase 1.4 main-agent prompt template, NOT factory's concern. But contract documents the risk.

---

## § 6 ralph-loop integration

phase 1.3 contract aligns AgentDefinition.maxTurns with CLAUDE.md ralph-loop convention:

- **External wrapper**: `ralph-loop --completion-promise "COMPLETE" --max-iterations 20 ...`
  - `completion-promise "COMPLETE"` → ralph-loop greps verbatim COMPLETE in each iteration's final output.
  - `max-iterations 20` → ralph-loop external cap on retries.
- **Internal AgentDefinition.maxTurns**: factory sets `maxTurns: opts.maxTurnsOverride ?? 50` as **per-spawn** internal cap (LLM round-trips per single Agent tool call). Each ralph-loop iteration spawns a fresh subagent with maxTurns = 50.
- **Combined effective cap**: `20 iterations × 50 turns = 1000 total turns` worst case before BLOCKED finding raised.

---

## § 7 phase 1.4 implementation roadmap + W-5 consumption interface contract

### § 7.1 Roadmap

phase 1.4 (routing engine v1) implementation MUST 1:1 mirror this contract:

1. `src/routing/agentFactory.ts` — implements `AgentFactory` signature from § 3.
2. `tests/unit/routing-agentFactory.test.ts` — covers all 4 error paths from § 5 + 12-field shape from § 2 + skills fail-fast + factory pure-ness.
3. `src/routing/index.ts` — wires `arbitrate` (phase 1.3 T3.2) → `agentFactory` → main agent `query({ agents: ... })`.

### § 7.2 W-5 consumption interface contract (V1 BLOCKER bar)

**phase 1.4 plan-checker MUST use this contract as V1 BLOCKER acceptance bar**:

- Any phase 1.4 task touching AgentDefinition factory implementation MUST cite this contract version (v1, frozen at phase 1.3 ship time) in its acceptance bar.
- phase 1.4 execute-phase code MUST 1:1 correspond to:
  - § 2 12 fields (no field omission, no extra fields not in contract)
  - § 3 factory signature (Promise<AgentDefinition>, parameter order, types)
  - § 5 4 error handling paths (all 4 implemented + tested)
- Any field omission OR signature deviation OR error path missing = **phase 1.4 plan-checker MUST reject** the plan.

### § 7.3 v2 evolution path (frozen v1; v2 must go through ADR errata)

This contract is **frozen at phase 1.3 ship time as v1**. Any v2 evolution (字段 add / signature change / error path 改) MUST:

1. Land via ADR 0008+ errata path (A7 守恒 mode — 不动 v1 main body).
2. Bump contract header `Status: Draft v1` → `Draft v2` only AFTER ADR accepted + `adr-NNNN-accepted` baseline tag created.
3. phase 1.4 / 1.5 implementations targeting v2 MUST cite the new ADR + bump version in their acceptance bar.

---

## § 8 References

- code.claude.com/docs/en/agent-sdk/subagents (fetched 2026-05-12) — 12-field schema source of truth
- code.claude.com/docs/en/agent-sdk/typescript — TypeScript reference for `AgentDefinition`
- phase 1.3 RESEARCH.md § 4 (P0-4) — 12-field discovery + factory pattern source
- phase 1.3 ASSUMPTIONS.md § B P0-4 (D1.3-6) — D-12 lock (draft-only at phase 1.3)
- phase 1.3 PATTERNS.md R1 D-12 — phase 1.3 / 1.4 边界守
- phase 1.2.5 RESEARCH-1 § 1.1 — subagent isolation table + Fact D (no recursive spawn)
- phase 1.2.5 RESEARCH-1 § 6 — F33 verbatim COMPLETE mitigation rationale
- phase 1.3 progress.md F36 — ui-ux-pro-max install path (skills fail-fast 实证 first-class fixture)
- CLAUDE.md § ralph-loop — `--completion-promise "COMPLETE" --max-iterations 20` convention
- ADR 0001 § "字段拒绝清单" — security gate (factory output cmd field 不允许 `${...}` / `$(...)` / backtick)
- ADR 0007 — manifest schema 3-field errata (category + install_type + decision_rules — phase 1.3 ship)

---

## § Errata Log v1.1 (2026-05-14 — phase 1.5 ADR 0009 § Decision Errata 1)

> **A7 守恒**: contract main body (§ 1-8) is **frozen v1 — 0 lines changed**. This
> Errata Log is an additive section appended at phase 1.5 ship, following the
> same pattern as ADR 0003 (install method count 5 → 6) / ADR 0005
> (marketplace_source schema 补完) / ADR 0008 (routing engine v1 errata). v2
> evolution still requires a fresh ADR 0010+ errata per § 7.3.

### Errata 1 — D1.4-2 contract v1.1 (12 → 14 字段)

The official Claude Agent SDK `AgentDefinition` schema carries **2 fields beyond
the 12 documented in § 2** (surfaced during phase 1.4 ADR 0008 § Decision 3).
phase 1.5 T5.3 implements them additively:

| # | 字段 | 类型 | 必填 | 稳定性 | 用途 |
|---|------|------|------|--------|------|
| 13 | `initialPrompt` | `string` | No | **Stable** (2026-05) | Auto-submitted as the first user turn when a plugin agent runs as the main-thread agent (plugin `settings.json` `agent: <name>` upgrade scenario only). |
| 14 | `criticalSystemReminder_EXPERIMENTAL` | `string` | No | **Experimental** | Critical reminder injected into the system prompt. The `_EXPERIMENTAL` suffix signals the **field name itself may change without a semver bump** — monitor `code.claude.com/docs/en/agent-sdk/typescript` release notes. The suffix is preserved verbatim in code (NOT stripped). |

**W-5 V1 BLOCKER 守恒**: the drift detector enum (`AGENT_DEFINITION_FIELDS` in
`src/routing/agentDefinition.ts`) is sync-extended 12 → 14 enum values. Any
add/remove still triggers an ADR 0009+ errata + matching test cell
(`routing-engine.test.ts` cell 13 / `routing-agentDefinition.test.ts` cell 1).

**Additive guarantee**: v1 字段 1-12 semantics are unchanged (still frozen). Both
new fields are optional, so existing factory call sites are not broken — this is
a purely additive errata (same mode as ADR 0003 / ADR 0005).

**Source**: ADR 0009 § Decision Errata 1 + `.planning/phase-1.5/RESEARCH.md` § 4.1
+ `.planning/phase-1.5/ASSUMPTIONS.md` D1.5-4 sub-item 1 +
`code.claude.com/docs/en/agent-sdk/typescript` (fetched 2026-05-13).
