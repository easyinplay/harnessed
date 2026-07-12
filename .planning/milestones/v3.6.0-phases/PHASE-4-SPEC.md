---
phase: 4
version: 3.6.0
title: Agent Teams 防呆 cleanup discipline inject
status: ready-for-review
created: 2026-05-25
depends_on: independent (sister Phase 3 RULES inject pattern)
sister_cadence: v3.5.0 Phase 2 ESCALATION_RULES + v3.6.0 Phase 3 TRANSPARENT_SKIP_RULES
estimated_loc: ~50-80 src + ~30-50 test
estimated_commits: 3 (Wave 1 const + inject / Wave 2 tests / Wave 3 reality + CHANGELOG)
---

# v3.6.0 Phase 4 — Agent Teams 防呆 cleanup discipline inject

## Goal (one sentence)

把 `~/.claude/rules/agent-teams.md` 的"防呆清单 4 项"(session-scoped / 必须 cleanup / token 估算 / brief 自包含)机器化为 `AGENT_TEAMS_PREVENTION_RULES` 常量,通过 `buildAgentDef` inject 到 spawned subagent 的 `criticalSystemReminder_EXPERIMENTAL` 字段(追加在 v3.5.0 `ESCALATION_RULES` + v3.6.0 Phase 3 `TRANSPARENT_SKIP_RULES` 之后),让 spawned subagent 在识别 escalation 时同时知道 cleanup discipline。

## Why (background)

`audit-harnessed-vs-user-rules-2026-05-25.md` 标定 P1b 为 "Agent Teams 防呆自动检查",原 audit 报告里描述为 "cleanup automation"。但实际审查 harnessed 架构发现:

- **Agent Teams runtime 不在 harnessed 范围**:Team API (`TeamCreate` / `SendMessage` / `TeamDelete`) 是 Claude Code platform 工具,SDK v0.3.142 `ToolInputSchemas` union 不暴露(v3.5.0 Phase 2 spike 确认)。harnessed runtime 无法直接 enforce cleanup(无 team state access)
- **可 enforce 的是 prompt-level discipline**:spawned subagent + 主 Claude Code session 用户**都**该懂 4 项防呆。spawned subagent inject(本 phase 范围),主 session 用户靠 user CLAUDE.md 自律(harnessed 不能强制)
- **Sister pattern**:v3.5.0 Phase 2 `ESCALATION_RULES` 已经走 inject 路径(spawned subagent identifies + signals,user 实际执行 TeamCreate)。Phase 4 是同 pattern 加一段 inject 文本

## Scope

### In-scope

| Sub-feature | 描述 | 文件 |
|---|---|---|
| `AGENT_TEAMS_PREVENTION_RULES` const | 4 防呆项自然语言版 | `src/workflow/run.ts` (new const) |
| buildAgentDef append | 把新 const 追加到 `criticalSystemReminder_EXPERIMENTAL` 末尾 | `src/workflow/run.ts` (修 buildAgentDef) |
| Tests | 新增 test cell 验证 inject 内容 | `tests/workflow/run.test.ts` (+1-2 cell) |

### Out-of-scope

- **Harnessed runtime 直接 enforce cleanup** — 无 team state access,physical impossible 除非 SDK 升级
- **主 session 用户 enforcement** — 用户 CLAUDE.md 自律,harnessed 不能强制
- **Token estimation runtime calculator** — audit 描述 token 估算公式作为 prevention 项,但 spawned subagent 自己估不准 N_rounds × avg_tokens(没 main session 数据);仅 inject 估算原则,不 inject 计算器
- **`workflows/disciplines/operational.yaml` 加 rule entry** — Phase 3 已经加了 transparent-skip rule;Phase 4 不再扩展 operational.yaml(避免 disciplines 膨胀);用 src code const + inject 直接做

---

## Design details

### D1. `AGENT_TEAMS_PREVENTION_RULES` const

Add new const to `src/workflow/run.ts`(after `ESCALATION_RULES` v3.5.0 Phase 2 / after `TRANSPARENT_SKIP_RULES` v3.6.0 Phase 3,form a series):

```typescript
// v3.6.0 Phase 4 — Agent Teams prevention checklist injection (P1b). Spawned
// subagent doesn't have Team APIs (SDK v0.3.142 doesn't expose them), so this
// is signal/discipline only — when subagent signals escalation via
// needs_teams_escalation, the user/main-session opens the team, and this
// checklist reminds spawned subagent (and by signal propagation, the user)
// of the 4 防呆 rules.
//
// Source: ~/.claude/rules/agent-teams.md "防呆清单" (4 items) — paraphrased
// for prompt injection (NOT verbatim user-private file).
const AGENT_TEAMS_PREVENTION_RULES = `If you signal needs_teams_escalation=true, ALSO advise the user on these 4 Agent Teams prevention rules in your escalation_reason or summary (the user will be the one calling TeamCreate / SendMessage / TeamDelete; remind them upfront):

1. **Session-scoped**: Teams live only in the current Claude Code session. \`/resume\` loses all teammates. Do not treat teams as persistent state — finish team work within one session.

2. **Cleanup mandatory**: Before session ends, send \`SendMessage(to=<teammate>, content="shutdown_request")\` to each teammate, then call \`TeamDelete\`. Orphan teammates consume resources. This is a hard rule, not advisory.

3. **Token cost estimation**: Before creating a team, estimate \`team_cost ≈ N_teammates × N_rounds × avg_tokens_per_round + N_teammates × initial_brief_tokens\`. Compare to subagent fan-out cost (\`≈ N_subagents × (initial_brief + summary_tokens)\`). Only open a team when \`team_cost < 2 × subagent_cost\` — otherwise prefer fan-out.

4. **Brief must be self-contained**: Each teammate launches WITHOUT main-session context. The Agent() prompt must include enough background, file paths, success criteria, and counter-positions so the teammate can work independently. Generic prompts produce shallow output.`
```

**LOC**: ~25 src

### D2. `buildAgentDef` append (extends Phase 3 chain)

After Phase 3 lands `TRANSPARENT_SKIP_RULES`, `buildAgentDef` already does:

```typescript
const criticalReminder = `${ESCALATION_RULES}\n\n${TRANSPARENT_SKIP_RULES}`
```

Phase 4 extends to:

```typescript
const criticalReminder = `${ESCALATION_RULES}\n\n${TRANSPARENT_SKIP_RULES}\n\n${AGENT_TEAMS_PREVENTION_RULES}`
```

Applied to BOTH code paths(rolePrompt found + fallback stub),sister Phase 2 ship pattern。

**LOC**: +2-4 src (depending on how Phase 3 implemented the chain)

### D3. Order rationale

Inject order: `ESCALATION_RULES` → `TRANSPARENT_SKIP_RULES` → `AGENT_TEAMS_PREVENTION_RULES`

- ESCALATION_RULES (识别 5 trigger fires)
- TRANSPARENT_SKIP_RULES (低 confidence 时透明跳过)
- AGENT_TEAMS_PREVENTION_RULES (识别到 escalation 时告诉用户 cleanup discipline)

逻辑顺序:**先识别 → 再判断 confidence → 最后 prevention**。

### D4. Prompt budget impact

- v3.5.0 ESCALATION_RULES: ~320 tokens
- v3.6.0 Phase 3 TRANSPARENT_SKIP_RULES: ~150 tokens
- v3.6.0 Phase 4 AGENT_TEAMS_PREVENTION_RULES: ~200 tokens
- **Total criticalSystemReminder_EXPERIMENTAL**: ~670 tokens/spawn

Phase 2 v3.5.0 SPEC accepted ~320 tokens overhead;Phase 4 + Phase 3 加 ~350 tokens → total ~670 tokens。对 spawned subagent(典型 5000-token budget)~13% overhead,acceptable。

如未来 budget pressure,v3.7+ 候选:conditional inject(只在涉及 multi-spec verify / fullstack-three-way phase 时 inject AGENT_TEAMS_PREVENTION_RULES)。

---

## Wave 切分 (3 commits)

### Wave 1 — const + buildAgentDef append
- **Files**: `src/workflow/run.ts` (+~30 lines: const + buildAgentDef chain extension)
- **LOC**: ~30 src
- **Build gate**: `corepack pnpm build` 0 红
- **Commit**: `feat(workflow): v3.6.0 Phase 4 Wave 1 — AGENT_TEAMS_PREVENTION_RULES inject (P1b)`

### Wave 2 — Tests
- **Files**: `tests/workflow/run.test.ts` (+1-2 new cells)
- **Test cells**:
  1. `buildAgentDef returns criticalSystemReminder_EXPERIMENTAL containing all 4 prevention rules verbatim phrases` (eg "Session-scoped" / "shutdown_request" / "team_cost" / "self-contained")
  2. `buildAgentDef chain order = ESCALATION_RULES → TRANSPARENT_SKIP_RULES → AGENT_TEAMS_PREVENTION_RULES` (assert string substring index 顺序)
- **LOC**: ~30-50 test
- **Test gate**: `corepack pnpm test` ≥ baseline + Phase 1-3 cumulative + 2 Phase 4 cells
- **Commit**: `test(workflow): v3.6.0 Phase 4 Wave 2 — AGENT_TEAMS_PREVENTION_RULES inject coverage`

### Wave 3 — Reality check + CHANGELOG
- **Step 1**: `pnpm build` 0 红
- **Step 2**: `pnpm test` baseline + 全 Phase 1-4 cumulative pass
- **Step 3**: dry-run spawn(任一 verify-multispec sub-workflow)— stderr 输出 envelope JSON 含 critical reminder 字段 verifying 3 RULES blocks present
- **Step 4**: 加 CHANGELOG v3.6.0 Phase 4 section
- **Commit**: `docs(changelog): v3.6.0 Phase 4 — Agent Teams prevention discipline inject (P1b)`

---

## 灰区 (实施 subagent 遇到必须 STATUS: NEEDS_CLARIFICATION)

1. **Phase 3 还没 landed,Phase 4 实施时 `TRANSPARENT_SKIP_RULES` const 不存在** → return,Phase 4 必须 sequential after Phase 3
2. **buildAgentDef chain extension 与 Phase 3 实施的 chain 命名不一致**(e.g. Phase 3 用 `criticalReminder` 还是直接 inline `${...}` template)→ return + 列实际 Phase 3 实施 code
3. **`AGENT_TEAMS_PREVENTION_RULES` 中文版本是否需要**(v3.5.0 ESCALATION_RULES 是 English-only per D5;Phase 3 TRANSPARENT_SKIP_RULES SPEC 给了中英 verbatim format)→ return,问是否 maintain English-only consistency 还是 follow Phase 3 中英 verbatim 模式
4. **prompt budget 超 700 tokens 担心**(if Phase 3 实施时实际 TRANSPARENT_SKIP_RULES 比 SPEC 估的长)→ return,问是接受还是 trim
5. **`tests/workflow/run.test.ts` 文件结构与 SPEC 假设不同**(类似 Phase 2 v3.5.0 灰区:test 文件名可能 `tests/cli/run.test.ts` vs `tests/workflow/run.test.ts`)→ return + 列实际 buildAgentDef 测试文件路径
6. **任何 wave 后 `pnpm build` 红 / `pnpm test` 红** → 立即 return,**不 fix-forward**

---

## Sister 文件参考

- `D:/GitCode/harnessed/src/workflow/run.ts` L72-86 — v3.5.0 Phase 2 `ESCALATION_RULES` const
- `D:/GitCode/harnessed/.planning/v3.5.0/PHASE-2-SPEC.md` — sister inject pattern
- `D:/GitCode/harnessed/.planning/v3.6.0/PHASE-3-SPEC.md` — sister TRANSPARENT_SKIP_RULES (Phase 4 depends on)
- `~/.claude/rules/agent-teams.md` "防呆清单" 节(user 私有源,paraphrase target)

---

## Acceptance criteria

- [ ] Wave 1: `AGENT_TEAMS_PREVENTION_RULES` const added + buildAgentDef chain extension
- [ ] Wave 2: 1-2 new test cells pass + chain order assertion
- [ ] Wave 3: `pnpm build` + `pnpm test` cumulative pass + CHANGELOG Phase 4 section
- [ ] dry-run spawn shows critical reminder contains all 3 RULES blocks (ESCALATION + TRANSPARENT_SKIP + AGENT_TEAMS_PREVENTION) in correct order
- [ ] 4 prevention phrases ("Session-scoped" / "shutdown_request" / "team_cost" / "self-contained") all present verbatim

---

## Risk + rollback

- **Risk 1**: prompt budget bloat
  - **Mitigation**: ~670 token total 仍 acceptable(<15% spawn budget);v3.7+ conditional inject 候选
- **Risk 2**: spawned subagent 不真按 inject 建议执行(LLM 行为不可预测)
  - **Mitigation**: 接受 — inject 是 advisory layer,不是 hard enforcement;用户在 main session 是最终防呆 backstop
- **Risk 3**: Phase 3 chain implementation 与 SPEC 假设不一致导致 Phase 4 集成出 bug
  - **Mitigation**: 灰区 #2 协议;Phase 4 严格 sequential after Phase 3

- **Rollback**: 3 atomic commits;Wave 1 (const + chain) 可单独 revert,Wave 2 (tests) 独立。Phase 3 chain 不受影响(Phase 4 是 additive append)。

---

*Spec written 2026-05-25 by main session per v3.5.0 Phase 2 sister inject pattern.*
*Approval gate: user review this spec → ack → wait Phase 3 land → spawn implementation subagent.*
