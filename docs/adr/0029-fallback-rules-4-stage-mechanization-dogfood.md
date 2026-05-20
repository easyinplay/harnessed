# ADR 0029: Fallback 3 铁律 Runtime + 4-stage 机器化 Final (R20.16 + Phase 2.5 Dogfood Evidence)

## Status

**Accepted** — phase v2.0-2.6 W0 T2.6.W0.6 (2026-05-20). v2.0 milestone final ADR — sister ADR 0023 v1.0 close pattern (本 ADR 是 v2.0 Architecture Refactor scope LOCK 收口 ADR; ADR 0024-0028 已落, 0029 closes the architectural scope)。

## Date

2026-05-20

## Context

`~/.claude/CLAUDE.md` 「澄清/审查触发判据」节末尾 3 条 **Fallback 三条铁律** verbatim source:

> - **拿不准 → 倾向跳过**, 但在响应里**透明声明**: "这次跳过了 X, 因为 Y。如果你认为需要请明说"。
> - **用户明示 → 覆盖判据**: 用户说"先 brainstorm" / "跑 office-hours" / "讨论一下"时无条件激活。
> - **链式互不前置**: 跳过战略层 ≠ 必须跳过 phase 层; 每层独立判断 (防止"上层没跑下层不敢跑"的死板)。

3 条铁律是 prose-form maintainer SoT —— 人类阅读 SoT, 但 workflow runtime 需机器化 anchor 才能在 evalGate 失败 / user 输入命中 override signal / 三层 gate 互相独立时正确分流。Phase 2.1 D-16 (Q-AUDIT-3 annotation "judgment 单个 → 类似 rule 分类") 把 judgment.yaml single-file 拆为 `judgments/` 目录 multi-file 分类 (sister `~/.claude/rules/*.md` pattern); `fallback.yaml` 作 fallback 3 铁律独立 file 落地, 与其他 5 file (`strategic-gate` / `phase-gate` / `subtask-gate` / `parallelism-gate` / `tdd-gate`) 共享目录但 **schema shape 完全不同** — 5 file 用 `triggers` + `fires_when`/`skips_when` 字段, fallback 用 `rules` root key + 3 字段 (`fallback_action` + `override_signal` + `chain_isolation`)。这是 D-16 derived dual-schema discriminated union 设计的 runtime 落地。

并且 v2.0 milestone 在 Phase 2.5 W1-W5 5-cycle 端到端 dogfood verify (46 NEW fixture, R8.1 sister benchmark "内在动力" 实证), W4 Cycle 4 单 cycle 验 fallback 3 铁律完整 schema + runtime + dual-schema routing; W5 Cycle 5 aggregate 5-axis 16 R20.x backward 触发 trace 全集; 1 production bug (uppercase `OR`/`AND` runtime fail) catch + fix 实证 dogfood-first methodology 不是 cosmetic cost。

## Decisions

### 1. `judgments/fallback.yaml` schema 3 rule (R20.16 + D-16)

`workflows/judgments/fallback.yaml` 35L `rules` root key (Phase 2.3 W0.2 SHIPPED), 3 rule entry verbatim 编码 CLAUDE.md 3 铁律:

**铁律 1 — `uncertain-skip-transparently`**:

```yaml
uncertain-skip-transparently:
  description: |
    铁律 1 — 拿不准 → 跳过 + 透明声明。
  fallback_action: skip_with_transparency
  message_template: "⚠️ 跳过 {gate_name}, 因为 {reason}。如认为需要请明示。"
```

Workflow runtime 在 `evalGate()` throw `GateEvalError` OR `resolveJudgmentGate()` throw `TriggerNotFoundError` 时, engine catch path 触发 substitute (`message_template.replace('{gate_name}', ...).replace('{reason}', ...)`) → console.warn emit `⚠️ message` 给用户 NOT 静默跳过 (sister CLAUDE.md "在响应里透明声明" 句型 verbatim 对齐)。

**铁律 2 — `user-explicit-override`**:

```yaml
user-explicit-override:
  override_signal:
    - "先 brainstorm"
    - "跑 office-hours"
    - "讨论一下"
    - "office-hours"
    - "brainstorm"
    - "深度调研"
```

Workflow runtime 词法匹配 user input (`signals.some((sig) => userInput.includes(sig))`), 命中任一 signal 强制 invoke target gate 即使 `fires_when==false` / `skips_when==true` — 用户明示无条件覆盖判据。6 string verbatim 来源 CLAUDE.md "用户明示" 句型 + Phase 2.1 D-16 verbatim 抄写 (3 string 来自原句 + 3 string 补强 alias)。

**铁律 3 — `chain-isolation`**:

```yaml
chain-isolation:
  chain_isolation: true
  description: |
    每层独立判断 (防"上层没跑下层不敢跑"的死板)。
```

`chain_isolation: true` 编码 default behavior — judgmentResolver 每 resolve call 互相独立 (无 parent-child 继承), 跳过战略层 (strategic-gate fires=false) ≠ Phase 层必跳 (phase-gate 独立 eval)。Sister judgmentResolver 实装天然满足: 每 `resolve(ref)` call 是独立 fs.readFile + parseYaml + Value.Check + expr-eval evalGate, 无 cross-layer state share。

### 2. Dual-schema routing (Q-AUDIT-5c errata)

`fallback.yaml` 顶级 key `rules` 与其余 5 trigger file 顶级 key `triggers` shape 完全不同 — TypeBox `JudgmentRulesFile` + `JudgmentTriggersFile` discriminated union, `judgmentResolver` 在 readFile parse 后用 `fileName === 'fallback'` 分流 schema validation。Phase 2.3 W0.6 ship dual-schema 设计 (W0.4 SHIPPED judgmentResolver.ts 98L 4 层 ref split + W0.6 SHIPPED TypeBox dual-schema)。

## Consequences

### Positive

- **CLAUDE.md fallback 铁律 SoT-from-prose 机器化**: 3 prose-form 铁律 → 3 yaml rule + 6 verbatim override_signal + chain_isolation flag, workflow runtime 可直接 evalGate / catch / 词法 match
- **chain-isolation 默认 satisfied**: judgmentResolver 每 resolve call 独立 = no-op implementation cost (架构层面天然支持, yaml flag 仅显式声明意图)
- **override_signal 词法 explicit**: 6 string array `includes()` zero-config 中文 UTF-16 match, NOT regex NOT NLP — surgical scope per Karpathy simplicity
- **dual-schema routing 一处隔离**: `fileName === 'fallback'` 分流, 其余 5 file 走 triggers schema 统一路径, 维护成本最小

### Negative

- **dual-schema discriminated union complexity**: `JudgmentRulesFile` + `JudgmentTriggersFile` 两套 TypeBox schema 维护, 任一字段增减需双 file 同步审视。Trade-off accepted: 替代方案 single schema with `oneOf` JSON Schema 表达力够但 TypeBox 错误信息不友好 (Q-AUDIT-5c 决定路径)

### Neutral

- **Phase 2.5 dogfood-first 实证 methodology value**: 46 NEW fixture × 5 cycle 在 v2.0 GA 前 catch 1 production bug (uppercase OR/AND runtime fail, T5.5 Axis 5), 修复后 baseline 通过 — R8.1 sister benchmark "dogfooding 内在动力" 不是 cosmetic, 是 fail-late 防线 (5-bug-class taxonomy: case-sensitive operator drift 属 type 4 yaml-runtime divergence)

## References

### 内部依据

- `~/.claude/CLAUDE.md` 「澄清/审查触发判据」节 末尾 "Fallback 三条铁律" verbatim source (3 prose 句, lines 35-38)
- `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` § D-16 (judgments/ multi-file 分类 + fallback 3 字段 schema verbatim 设计)
- `.planning/REQUIREMENTS.md` § R20.16 (judgments/fallback.yaml 3 铁律字段扩充 — 验收 a-f 6 项)
- `.planning/REQUIREMENTS.md` § R20.4 (judgments/ multi-file 分类 — 6 file 列表含 fallback)
- `workflows/judgments/fallback.yaml` 35L (Phase 2.3 W0.2 SHIPPED — 3 rule entry verbatim)
- `src/workflow/schema/judgment.ts` (Phase 2.3 W0.6 SHIPPED — JudgmentRulesFile + JudgmentTriggersFile dual-schema discriminated union)
- `src/workflow/judgmentResolver.ts` 98L (Phase 2.3 W0.4 SHIPPED — 4 层 ref split + dual-schema routing per fileName)
- `.planning/phase-v2.0-2.2/DOGFOOD-T5.4.md` (Phase 2.5 W4 Cycle 4 — Scenario C F10-F15 6 fixture fallback 3 铁律 runtime verify)
- `.planning/phase-v2.0-2.2/DOGFOOD-T5.5-AGGREGATE.md` (Phase 2.5 W5 Cycle 5 — 5-axis aggregate final 180L, R20.16 dogfood-verified inline)
- `docs/adr/0026-*.md` (judgments/ multi-file + expr-eval + judgmentResolver — dual-schema cross-link 起点)

### 外部依据

- `expr-eval@2.0.2` (MIT, zero-dep) Parser singleton — gate yaml-eval grammar 运行时
- `~/.claude/rules/*.md` multi-file pattern reference (D-16 sister borrowing — judgments/ 6 file 分类 sister)

## Implementation status

**SHIPPED** as of 2026-05-20:

- ✅ Phase 2.3 W0.2 — `workflows/judgments/fallback.yaml` 35L 3 rule entry SHIPPED (commit Phase 2.3 W0 batch)
- ✅ Phase 2.3 W0.4 — `src/workflow/judgmentResolver.ts` 98L SHIPPED (dual-schema routing per fileName === 'fallback')
- ✅ Phase 2.3 W0.6 — `src/workflow/schema/judgment.ts` JudgmentRulesFile + JudgmentTriggersFile dual-schema SHIPPED
- ✅ Phase 2.5 W4 Cycle 4 — DOGFOOD-T5.4.md Scenario C F10-F15 6 fixture 全 PASS (schema + 3 字段 + 6 verbatim override_signal + chain-isolation 独立 eval 实证 + TriggerNotFoundError throw path)
- ✅ Phase 2.5 W5 Cycle 5 — DOGFOOD-T5.5-AGGREGATE.md Axis 1 R20.16 row + Axis 4 fallback 3 铁律 runtime + 6 override_signal verbatim section all-checked

**Pending engine wiring (v2.x patch release scope)**: 铁律 1 完整 `engine catch → message_template.substitute → console.warn ⚠️` lifecycle 在当前 workflow engine 仅在 routing 阶段实装 — 完整 substitute 路径留给 v2.x patch (Phase 2.5 W4 Cycle 4 已记录 deferred 性质 + yaml 层 rule 字段语义正确性已验证)。

## 4-stage 机器化 close summary (v2.0 final ADR)

本 ADR 是 v2.0 Architecture Refactor scope LOCK 收口 ADR (sister ADR 0023 v1.0 close pattern), cross-link 5 sister ADR + Phase 2.5 dogfood evidence 完整闭合 4-stage machine 化:

### Stage ① Discuss
- `workflows/research/` NEW 2-phase (Tavily + Exa + ctx7 fan-out + GSD discuss synth) — **ADR 0027** (research + verify-work NEW workflows + planning-with-files plugin reframe errata)
- `judgments/strategic-gate.yaml` + `phase-gate.yaml` + `subtask-gate.yaml` 三层独立 gate — **ADR 0026** (judgments multi-file + expr-eval + judgmentResolver dual-schema)

### Stage ② Plan
- `workflows/plan-feature/` v2 upgraded + 05-persist phase `/plan` 真接 — **ADR 0024** (workflow schema v2 + capability abstraction) + **ADR 0027** errata (Q-AUDIT-5a planning-with-files Claude Code plugin reframe NOT npm SDK)

### Stage ③ Execute
- `workflows/execute-task/` v2 upgraded + ralph-loop completion-promise + tdd-gate + mattpocock route — **ADR 0024** (workflow schema v2) + **ADR 0028** (ralph-loop 真接 + TDD + Agent Teams 路由 + Q-AUDIT-5b settings.json schema fix errata)

### Stage ④ Verify
- `workflows/verify-work/` NEW 9-phase (gsd-verify-work + gsd-progress 必跑 + code-review 并行 + gstack /review 强制 + 可选 3 + code-simplifier 末尾 + Pattern C 4-specialist Agent Team conditional 升级) — **ADR 0027** (verify-work NEW workflow) + **ADR 0028** (Pattern C 升级 OR-chain)

### Cross-stage
- `capabilities.yaml` 39 entry (37 baseline + 2 NS resolved per Phase 2.4 retro) — **ADR 0025** (capabilities.yaml v2.0 baseline + static manifest discipline)
- `judgments/` 6 file (parallelism + tdd + fallback + strategic-gate + phase-gate + subtask-gate) — **ADR 0026** (multi-file 分类)
- **fallback 3 铁律 runtime + dual-schema routing — 本 ADR 0029** (R20.16 + 4-stage close)

### Dogfood evidence
- **46 NEW fixture × 5 cycle** Phase 2.5 W1-W5 端到端: W1 5 (R20.11 parallelism-gate) + W2 6 (R20.12 verify-work 9-phase + R20.11/14) + W3 20 (R20.10 ralph-loop + R20.13 tdd-gate + R20.15 plugin reframe) + W4 15 (R20.8 mattpocock + R20.14 special-purpose + R20.16 fallback 3 铁律) + W5 aggregate 5-axis (DOGFOOD-T5.5-AGGREGATE.md 180L)
- **13/15 active R20.x dogfood-verified inline** (R20.5 + R20.9 operational deferred Phase 2.6 close ship; R20.6 DROPPED)
- **1 production bug caught + fixed** (uppercase OR/AND runtime fail T5.5 Axis 5 — R8.1 sister benchmark "内在动力" 实证)
- **Pattern A real-use first-time** (Phase 2.4 W1 Team 1 phase24-w1-execute-team 3 teammate + 4 SendMessage round-trip) + **Pattern C composition** (verify-work 09-agent-team-multispecialist runtime evalGate 3 branch verified)

### v2.0 Architecture Refactor scope LOCKED ✅
**16 D-decision + 3 Q-AUDIT-5 schema fix** 全 实装 verified: 13 D-decision dogfood-verified inline (D-01~D-04, D-08~D-16) + D-05 + D-07 operational deferred Phase 2.6 + D-15 reframe Q-AUDIT-5a verbatim verify + Q-AUDIT-5b/5c errata schema fix inline。v2.0 scope LOCK 收口, Phase 2.6 W1 ship cadence (CHANGELOG + package.json + ci.yml A7 step iter + README + RETROSPECTIVE) + W2 milestone close (triple LOCAL CREATE tag v2.0.0-alpha.1 + v2.0.0-rc.1 + 🎯 v2.0.0) + W3 publish (user approval gated) 路径 clear。

## A7 Conservation

ADR 0001-0028 main body **untouched** — 本 ADR 0029 仅 ADD, 不修改任一 sister ADR。`adr-0029-accepted` baseline tag 在 Phase 2.6 W0 batch commit 后 LOCAL CREATE (sister ADR 0024-0028 同 batch tag pattern)。ci.yml A7 step `for n in 0001 ... 0028` loop 加 `0029` (Phase 2.6 W1 落地)。本 ADR 0029 起 v2.0 ship 时刻 frozen — 任何 v2.x+ 演化 (fallback engine wiring substitute / dual-schema rule type 扩展 / chain-isolation 显式 cross-layer audit) 必须开 ADR 0030+ errata; 本 ADR 0029 main body 不可改 (与 ADR 0001-0028 同等守恒规则)。
