---
phase: 2
version: 3.5.0
title: Option 1-Lite — Signal-Driven Agent Teams Escalation
status: ready-for-review
created: 2026-05-25
depends_on: Phase 1 (private-file sweep, landed eb60722)
sister_cadence: v3.4.4 Phase 1-6
estimated_loc: ~130-180 LOC source + ~70 LOC test
estimated_commits: 4 (one per wave)
---

# v3.5.0 Phase 2 — Option 1-Lite Signal-Driven Agent Teams Escalation

## Goal (one sentence)

让 spawned-via-SDK subagent 在执行任务时**识别** Agent Teams 升级触发条件 (parallelism-gate.yaml 5 fires_when),通过 structured output `needs_teams_escalation: true + escalation_reason` 把信号反向上报给 harnessed runtime,由 runtime 输出 stderr hint 让**用户**在主 Claude Code session 手动开 team。

## Why (background — spike result)

Phase 2 SPEC 写作前的 SDK spike (2026-05-25) 揭示:

- **`sdkSpawn.ts:54`**: `allowedTools` hardcode `['Read', 'Edit', 'Write', 'Grep', 'Glob', 'Bash', 'Task']`,不含 Team APIs
- **`sdk-tools.d.ts:11-36`**: SDK v0.3.142 `ToolInputSchemas` union 完整列举工具入参,**根本没有** `TeamCreateInput` / `TeamDeleteInput` / `SendMessageInput`
- **`sdk.d.ts:5542-5549`**: 只有 `TeammateIdleHookInput`(hook 接收信号,不是 callable tool)

结论:**spawned-via-SDK subagent 看不到 TeamCreate 工具**,prompt 注入"自己调 TeamCreate"会让它 hallucinate 失败。原 Option 1 假设(spawned Claude self-execute Team API)不成立。

Option 1-Lite 是诚实降级:**spawned subagent 只负责识别 + 上报**,**用户/主 session** 负责实际开 team。harnessed runtime 在中间做信号 plumbing。

## Architecture (one diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│ 主 Claude Code session (user's session, has TeamCreate)         │
│   ↓ user invokes `/auto "X"` or `/task-auto "X"`                │
│ harnessed CLI → runWorkflow → _dispatchSkillStub                │
│   ↓ buildAgentDef (NEW: inject 5-trigger natural-lang rules)    │
│   ↓ sdkSpawn → SDK query()                                       │
│ ┌───────────────────────────────────────────────┐               │
│ │ spawned subagent (no Team APIs available)     │               │
│ │  ↓ executes phase task                         │               │
│ │  ↓ if detects any of 5 triggers fire:          │               │
│ │    structured_output:                          │               │
│ │      status: COMPLETE                          │               │
│ │      needs_teams_escalation: true   ←── NEW    │               │
│ │      escalation_reason: "trigger X: ..."       │               │
│ └───────────────────────────────────────────────┘               │
│   ↓ envelope returned                                            │
│ _dispatchSkillStub parses → DispatchStubResult.needsTeamsEscalation│
│   ↓ runWorkflow detects → console.error(stderr) escalation hint │
│ user reads stderr → manually invokes TeamCreate (per discretion)│
└─────────────────────────────────────────────────────────────────┘
```

## Scope

### In-scope (Phase 2)

| File | Change | Wave |
|---|---|---|
| `src/workflow/lib/completionSchema.ts` | Add `needs_teams_escalation` + `escalation_reason` to schema + types | Wave 1 |
| `src/workflow/run.ts` (`buildAgentDef`) | Inject 5-trigger natural-language rules via `criticalSystemReminder_EXPERIMENTAL` | Wave 1 |
| `src/workflow/run.ts` (`DispatchStubResult` + `_dispatchSkillStub.fn`) | Propagate escalation signal from envelope | Wave 2 |
| `src/workflow/run.ts` (`runWorkflow` main loop) | Print stderr escalation hint when `r.needsTeamsEscalation === true` | Wave 2 |
| `tests/workflow/sdk-spawn.test.ts` | New cell — envelope with `needs_teams_escalation` round-trip | Wave 3 |
| `tests/cli/run.test.ts` | New cells — buildAgentDef prompt content + dispatchSkillStub escalation propagation + stderr hint | Wave 3 |
| Reality check + i18n + CHANGELOG section | Wave 4 |

### Out-of-scope (NOT Phase 2)

- **Real Team API invocation by spawned subagent** — physically impossible with SDK v0.3.142 (see spike). Defer until SDK exposes `TeamCreateInput` to `ToolInputSchemas`.
- **Filing GitHub issue with Anthropic SDK team** — separate task post-ship.
- **Auto-detection of `subagent_context_overflow`** — spawned Claude has no programmatic access to token usage. Treated like other 4 triggers (LLM self-judgment).
- **CHANGELOG version bump + npm publish** — Phase 3 scope.
- **Phase 1 P0 sweep** — already landed (eb60722).

---

## Design details

### D1. COMPLETION_SCHEMA extension

`src/workflow/lib/completionSchema.ts:14-23` current:

```ts
export const COMPLETION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    phase: { type: 'string', enum: ['01-clarify', '02-code', '03-test', '04-deliver'] },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'phase'],
} as const
```

**Change**:

```ts
export const COMPLETION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    phase: { type: 'string', enum: ['01-clarify', '02-code', '03-test', '04-deliver'] },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
    // v3.5.0 Phase 2 — Option 1-Lite signal-driven Agent Teams escalation.
    // spawned subagent SHOULD set this when any of parallelism-gate.yaml 5
    // upgrade triggers fire. harnessed runtime propagates to stderr hint;
    // user opens team in main Claude Code session.
    needs_teams_escalation: { type: 'boolean' },
    escalation_reason: { type: 'string' },
  },
  required: ['status', 'phase'],
} as const
```

**`SdkResultEnvelope` (L28-35) update**:

```ts
export interface SdkResultEnvelope {
  subtype?: string
  structured_output?: {
    status?: CompletionStatus
    needs_teams_escalation?: boolean
    escalation_reason?: string
  }
  text?: string
  result?: string
}
```

**Decision rationale**:
- `optional` (NOT required) — spawned Claude can omit when no trigger fires; absent = `false`
- `boolean + string` — simplest schema, no enum/list (5 triggers in `escalation_reason` free text via natural language)
- Both fields under `structured_output` to follow existing PRIMARY signal path (SDK json_schema-enforced)

### D2. `buildAgentDef` injection — `criticalSystemReminder_EXPERIMENTAL`

`src/workflow/run.ts:76-109` current returns AgentDefinition with `description` + `prompt` + optional `model`. Path uses `injectFactoryInternalFields` (sdkReconcile.ts L42-58) which already emits `## CRITICAL\n${def.criticalSystemReminder_EXPERIMENTAL}` to prompt.

**Change**: append `criticalSystemReminder_EXPERIMENTAL` field with the 5-trigger natural-language rules (hardcoded constant, NOT loaded from yaml — keeps Phase 2 deterministic and dependency-free).

```ts
// v3.5.0 Phase 2 — Option 1-Lite escalation rules injected via
// criticalSystemReminder_EXPERIMENTAL (already piped through sdkReconcile.ts
// L54-56 into spawned subagent prompt). Self-contained natural-language
// transcription of workflows/judgments/parallelism-gate.yaml agent-teams-upgrade
// fires_when. Spawned subagent CANNOT itself call TeamCreate (SDK v0.3.142 does
// not expose Team APIs); it ONLY signals via structured_output.needs_teams_escalation.
const ESCALATION_RULES = `If during this task you detect ANY of the following 5 conditions, set \`needs_teams_escalation: true\` in your structured output and fill \`escalation_reason\` with the trigger name + one-sentence specifics. These are signals to the human user in the main Claude Code session — do NOT attempt to call TeamCreate/SendMessage/TeamDelete yourself (those tools are not available to you).

Five triggers (any one suffices):

1. **teammate_send_message_needed** — the task requires two or more subagents to exchange messages mid-task (e.g., reconciling API contract proposals across frontend and backend), not just fan-out + report.

2. **subagent_context_overflow** — your context budget is filling and a separate subagent is needed to take over a portion of the work.

3. **shared_task_list** — multiple subagents need to coordinate self-assignment from a shared task list (not pre-partitioned work).

4. **opposing_hypothesis_debate** — the task requires two subagents to defend opposing hypotheses to a lead arbiter (e.g., root-cause debugging where two competing theories need separate evidence-gathering).

5. **fullstack_three_way** — the task is a synchronized fullstack push (frontend + backend + tests) requiring API contract alignment across three roles simultaneously.

If none of the five apply, omit \`needs_teams_escalation\` (defaults to false) and proceed normally.`

function buildAgentDef(
  skillName: string,
  rolePrompts?: Record<string, RolePrompt>,
  workflowName?: string,
  modelTierOverride?: string,
): AgentDefinition {
  const rp = rolePrompts?.[skillName] ?? (workflowName ? rolePrompts?.[workflowName] : undefined)
  if (!rp) {
    return {
      description: `harnessed workflow phase: ${skillName}`,
      prompt: `You are executing the '${skillName}' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.`,
      criticalSystemReminder_EXPERIMENTAL: ESCALATION_RULES,  // NEW
      ...(modelTierOverride ? { model: modelTierOverride } : {}),
    } as AgentDefinition
  }
  // ... existing checklist + prompt assembly unchanged ...
  return {
    description: rp.description,
    prompt,
    criticalSystemReminder_EXPERIMENTAL: ESCALATION_RULES,  // NEW
    ...(modelTierOverride ? { model: modelTierOverride } : {}),
  } as AgentDefinition
}
```

**Decision rationale**:
- Use existing `criticalSystemReminder_EXPERIMENTAL` field (already piped) — no new injection point
- Hardcoded const at module scope — NOT loaded from yaml (cached, deterministic, no async io)
- Single block of natural language, not 5 separate fields — keeps prompt cohesive
- Explicit "do NOT attempt to call TeamCreate yourself" — pre-empts hallucination
- Applied to BOTH code paths (rolePrompt found OR fallback stub) — uniform escalation availability

**Prompt budget impact**: ESCALATION_RULES ≈ 1300 chars ≈ 320 tokens. Acceptable overhead per spawned subagent (current rolePrompt body 400-600 tokens; ESCALATION_RULES adds ~50% but is one-shot per spawn).

### D3. `DispatchStubResult` + `_dispatchSkillStub.fn` propagation

`src/workflow/run.ts:53-59` current:

```ts
export interface DispatchStubResult {
  status: 'ok' | 'fail'
  output: string
  decision?: string
  target?: 'chat' | 'file' | 'commit-message'
  triggers_commit?: boolean
}
```

**Change** — add 2 fields:

```ts
export interface DispatchStubResult {
  status: 'ok' | 'fail'
  output: string
  decision?: string
  target?: 'chat' | 'file' | 'commit-message'
  triggers_commit?: boolean
  // v3.5.0 Phase 2 — Option 1-Lite escalation signal from spawned subagent.
  // When true, runWorkflow emits stderr hint suggesting user open Agent Teams
  // in main Claude Code session.
  needsTeamsEscalation?: boolean
  escalationReason?: string
}
```

`_dispatchSkillStub.fn` parsing (L217-229) update:

```ts
const env = JSON.parse(envelopeJson) as {
  structured_output?: {
    status?: string
    needs_teams_escalation?: boolean
    escalation_reason?: string
  }
  text?: string
  result?: string
  subtype?: string
}
const status: 'ok' | 'fail' = /* unchanged */
const escalation = env.structured_output?.needs_teams_escalation === true
return {
  status,
  output: env.text ?? env.result ?? '',
  ...(env.structured_output?.status ? { decision: env.structured_output.status } : {}),
  ...(escalation
    ? {
        needsTeamsEscalation: true,
        ...(env.structured_output?.escalation_reason
          ? { escalationReason: env.structured_output.escalation_reason }
          : {}),
      }
    : {}),
}
```

### D4. `runWorkflow` main loop — stderr escalation hint

`src/workflow/run.ts:367-372` current (after `_dispatchSkillStub.fn` call):

```ts
const r = await _dispatchSkillStub.fn(skillName, ph, { /* opts */ })
if (r.status !== 'ok') {
  return { status: 'failed', phasesRun: i, lastPhaseId: ph.id }
}
```

**Change** — add escalation hint emission after the status check, before `after-output` hook:

```ts
const r = await _dispatchSkillStub.fn(skillName, ph, { /* opts */ })
if (r.status !== 'ok') {
  return { status: 'failed', phasesRun: i, lastPhaseId: ph.id }
}

// v3.5.0 Phase 2 — Option 1-Lite escalation hint to user. spawned subagent
// signaled one of 5 parallelism-gate.yaml agent-teams-upgrade triggers fired.
// User in main Claude Code session decides whether to open Agent Teams
// (TeamCreate not available to spawned subagents via SDK v0.3.142).
if (r.needsTeamsEscalation === true) {
  const reason = r.escalationReason ?? 'unspecified trigger'
  console.error(
    `⚠️ phase ${ph.id} suggests Agent Teams escalation — ${reason}. ` +
      'Consider opening a team in your main Claude Code session (TeamCreate) ' +
      'if continuing this work benefits from teammate coordination. ' +
      'See workflows/judgments/parallelism-gate.yaml for the 5 upgrade triggers.',
  )
}
```

**Decision rationale**:
- `console.error` (stderr) NOT `console.log` (stdout) — Next: hint already uses stderr (run.ts) for the same reason: doesn't pollute stdout consumed by downstream tools
- Non-blocking — escalation is informational; phase still proceeds normally
- One-line single-paragraph hint — matches existing Next: hint style
- i18n: Use `t()` from `src/i18n/index.ts` if Phase 2 SPEC reviewer wants i18n parity (default: English-only since escalation is power-user feature; **OPEN: i18n decision left to spec reviewer**)

### D5. i18n consideration (OPEN — spec reviewer decides)

Existing `run.ts` `console.warn` / `console.error` calls (e.g., L262, L294, L317) use raw English strings (no i18n). The `Next:` hint also uses raw English. Consistent path: **keep ESCALATION hint English-only**.

Counterargument: this is user-facing stderr message visible at every escalation. If `HARNESSED_USER_LANG=zh-Hans` user prefers Chinese, hint should match.

**Default proposal**: English-only for Phase 2; add i18n key in v3.6 if user complaint. Faster ship + matches surrounding code style.

**Alternative (if reviewer prefers)**: add `i18n/locales/en.json` + `zh-Hans.json` keys `workflow.teams_escalation_hint` with `{reason}` placeholder.

### D6. SDK schema compliance (verify hypothesis)

Hypothesis: SDK v0.3.142 `query({ options: { outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA }}})` will pass the (modified) schema down to spawned subagent which then populates `structured_output` with `needs_teams_escalation` when applicable.

**Risk**: SDK may silently drop unknown schema properties or may not pass extended schema to subagent. Verified empirically in Wave 4 by running an integration test that asserts envelope round-trip.

**Mitigation**: Treat absent fields as `false` (`env.structured_output?.needs_teams_escalation === true` strict comparison). If SDK never populates, no false positives; escalation silently inactive.

---

## Wave 切分 (4 commits)

### Wave 1 — Schema + `buildAgentDef` injection
- **Files**: `src/workflow/lib/completionSchema.ts` + `src/workflow/run.ts` (buildAgentDef + ESCALATION_RULES const)
- **LOC**: ~60 source (schema +6, types +4, ESCALATION_RULES +30, buildAgentDef +2 per path × 2 paths = +4)
- **Test**: NONE (Wave 3 covers integration tests; unit test for schema shape optional — can add to Wave 1 if karpathy TDD opt-in)
- **Build gate**: `pnpm build` 0 red (TS types must compile with new schema fields)
- **Commit**: `feat(workflow): v3.5.0 Phase 2 Wave 1 — COMPLETION_SCHEMA + buildAgentDef inject 5-trigger escalation rules`

### Wave 2 — Propagation + stderr hint
- **Files**: `src/workflow/run.ts` (`DispatchStubResult` + `_dispatchSkillStub.fn` parse + `runWorkflow` stderr emit)
- **LOC**: ~30 source (+2 interface fields, +8 parse logic, +10 stderr emit)
- **Test**: NONE (Wave 3 covers integration)
- **Build gate**: `pnpm build` 0 red
- **Commit**: `feat(workflow): v3.5.0 Phase 2 Wave 2 — DispatchStubResult propagation + stderr escalation hint`

### Wave 3 — Tests
- **Files**: `tests/workflow/sdk-spawn.test.ts` (1 new cell) + `tests/cli/run.test.ts` (3-4 new cells)
- **LOC**: ~70 test
- **Cells**:
  1. `sdk-spawn.test.ts`: envelope JSON with `needs_teams_escalation: true + escalation_reason` round-trip (mock SDKResultMessage with extended structured_output)
  2. `run.test.ts`: `buildAgentDef` returns `criticalSystemReminder_EXPERIMENTAL` containing ESCALATION_RULES (string contains check on 5 trigger names)
  3. `run.test.ts`: `_dispatchSkillStub.fn` populates `needsTeamsEscalation: true` when envelope has the field
  4. `run.test.ts`: `_dispatchSkillStub.fn` omits `needsTeamsEscalation` when envelope absent (default off)
  5. `run.test.ts`: `runWorkflow` emits stderr hint containing `escalation_reason` when stub returns escalation (vi.spyOn console.error)
- **Test gate**: `corepack pnpm test` 1087+ pass (baseline maintained + 5 new cells = 1092)
- **Commit**: `test(workflow): v3.5.0 Phase 2 Wave 3 — escalation schema + buildAgentDef + dispatch + stderr coverage`

### Wave 4 — Reality check + CHANGELOG section
- **Step 1**: `pnpm build` 0 red
- **Step 2**: `corepack pnpm test` 1092 pass / 5 skip / 1 todo
- **Step 3**: `pnpm pack --dry-run` tarball size delta acceptable (`du -h harnessed-3.5.0.tgz` before/after compare)
- **Step 4**: dry-run integration — invoke `harnessed run task-deliver --task "test escalation hint" --dry-run` — confirm envelope shape includes new fields in JSON output (NB: dry-run prints envelope without spawning SDK, so this is schema-shape-only verification)
- **Step 5**: Add CHANGELOG.md v3.5.0 (Unreleased) section "Phase 2 — Option 1-Lite signal escalation" (one paragraph + 5 trigger list)
- **Commit**: `docs(changelog): v3.5.0 Phase 2 — Option 1-Lite signal-driven Agent Teams escalation`

---

## 灰区 (实施 subagent 遇到必须 STATUS: NEEDS_CLARIFICATION)

1. **D5 i18n decision**: spec proposes English-only. If reviewer wants i18n, switch path BEFORE Wave 2 (changes the `console.error` line to `t('workflow.teams_escalation_hint', { reason })`)
2. **TS strict mode complaint on optional field nesting** (e.g., `env.structured_output?.needs_teams_escalation === true` with strict null check): if subagent hits TS red on Wave 1/2, return with the exact compiler error
3. **SDK json_schema rejects extended schema** (Wave 4 dry-run fails with SDK throwing on extra fields): immediate return — escalation 字段需要 SDK 兼容,如不兼容 Option 1-Lite 死,需另想方案
4. **Wave 3 vi.spyOn console.error 在 vitest 里失败** (might require setup hooks): return with the test output, do NOT skip the cell
5. **`criticalSystemReminder_EXPERIMENTAL` 字段被 SDK 拒绝** (sdkReconcile.ts 注入但 SDK 不识别): unlikely since v3.4.4 已使用此字段,但若 Wave 4 dry-run 看到 SDK 警告 ABOUT this field, return
6. **任何 Wave 后 `pnpm build` 红** (TS coupling 出现意外): 返回, do NOT fix-forward

---

## Sister 文件参考

- `D:/GitCode/harnessed/.planning/v3.5.0/PHASE-1-SPEC.md` — Phase 1 sister cadence (done)
- `D:/GitCode/harnessed/.planning/v3.4.4/PHASE-2-SPEC.md` — v3 dispatch arm sister
- `D:/GitCode/harnessed/src/workflow/lib/completionSchema.ts` — Wave 1 主目标
- `D:/GitCode/harnessed/src/workflow/lib/sdkReconcile.ts` — `injectFactoryInternalFields` 已 pipe `criticalSystemReminder_EXPERIMENTAL` L54-56
- `D:/GitCode/harnessed/src/workflow/run.ts` — Wave 1-2 主目标
- `D:/GitCode/harnessed/workflows/judgments/parallelism-gate.yaml` — 5 trigger 文本源(自然语言版 hardcode 到 ESCALATION_RULES const)
- `D:/GitCode/harnessed/tests/workflow/sdk-spawn.test.ts` — Wave 3 sibling pattern
- `D:/GitCode/harnessed/tests/cli/run.test.ts` — Wave 3 sibling pattern

---

## Acceptance criteria (Phase 2 完成判据)

- [ ] Wave 1 commit landed: schema fields added + buildAgentDef injects ESCALATION_RULES into both code paths
- [ ] Wave 2 commit landed: DispatchStubResult extended + parse propagation + stderr emit
- [ ] Wave 3 commit landed: 5 new test cells (1 sdk-spawn + 4 run.test)
- [ ] Wave 4 commit landed: CHANGELOG section + reality check pass
- [ ] `pnpm build` 0 red
- [ ] `corepack pnpm test` ≥1092 pass (baseline 1087 + 5 new)
- [ ] Dry-run `harnessed run task-deliver --task X --dry-run` emits envelope JSON containing new schema field placeholders (or at minimum the gateContext shape unchanged for backward compat)
- [ ] Spawning a real subagent (Wave 4 manual smoke test) prints stderr escalation hint when prompt-driven trigger fires (e.g., task "design API contract with frontend+backend+tests" should fire `fullstack_three_way`)

完成后状态: ready for Phase 3 (verify + ship) spec review。

---

## Risk + rollback

- **Risk 1**: SDK silently drops unknown schema properties → escalation never fires (silent inactive)
  - **Mitigation**: Wave 4 manual smoke test with explicit fullstack task verifies real LLM populates field
  - **Fallback**: If SDK incompatible, document limitation in CHANGELOG and ship Phase 1 + Phase 3 only (escalation as no-op feature pending SDK upgrade)
- **Risk 2**: ESCALATION_RULES prompt overhead (320 tokens) bloat per-spawn
  - **Mitigation**: 320 tokens is ~5% of typical 5000-token spawn budget; acceptable
- **Risk 3**: spawned Claude over-triggers escalation (false positives)
  - **Mitigation**: Rules require explicit detection, not heuristic; trust LLM judgment; user can ignore stderr hints
- **Risk 4**: Coupling breaks downstream tests (1087 baseline drops)
  - **Mitigation**: Wave 3 specifically adds coverage; Wave 4 hard gate `pnpm test ≥1092 pass`

- **Rollback**: 4 atomic commits; `git revert <hash>` per wave if any wave breaks. Phase 1 (private-file sweep) and Phase 3 (ship) are independent of Phase 2 (escalation feature is additive, not refactor).

---

*Spec written 2026-05-25 by main session per v3.4.4 sister cadence + SDK spike + Option 1-Lite降级方案.*
*Approval gate: user review this spec → ack → spawn implementation subagent.*
