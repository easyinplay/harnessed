# ADR 0014: Phase 3.1 — checkpoint 引擎 + harnessed resume + compact 协议 + T4.4 closure infra activation 闭环 (9 章节 errata 合并)

## Status

**Accepted (phase 3.1 W5 — 2026-05-16)** — phase 3.1 plan-phase Wave 0 sketch (T0.2 9 章节 skeleton draft) → Wave 5 fill-out (T5.2 detailed expand) → Accepted at phase 3.1 ship。

> Phase 3.1 是 v0.3.0 milestone **第 1 phase (1/4)**，把 v0.3.0 alpha cycle 开门装配为 **checkpoint 引擎 (TEMPLATE 摘要 + archive 双轨) + `harnessed resume` 12th CLI subcommand (D-03 RELOAD) + compact 协议 75% threshold placeholder + T4.4 closure infra activation 闭环 (D-04 WIRE-IN — Phase 2.2 ship 三件套 1 milestone 闲置后首消费者) + W0 backlog 4 项一次根治**。5 大主题 sister cluster 一次 ship，作为 v0.3.0 milestone 启动第 1 块拼图 — 沿袭 ADR 0008/0009/0010/0011/0012/0013 多决策合并 errata 模式 (B-35 + B-36 lock)。

## Context

Phase 3.1 把 v0.3.0 启动第 1 phase 装配为 checkpoint 引擎 + harnessed resume + compact 协议 + T4.4 closure infra dead-wiring 激活 + W0 backlog 4 项 absorb。5 大主题 sister cluster 一次 ship，作为 v0.3.0 milestone 第 1 phase open — R7.2 (checkpoint 摘要 < 1k token + archive 完整) + R7.3 (`harnessed resume` + `current-workflow.json` 状态机) ROADMAP 双 acceptance bar 锚定。

并办 STATE.md L23a v0.3.0 W0 prereq backlog 4 项一次根治 — M1 audit "Line budget deviations accepted" 透明节加 / M2+M3 dashboard polish round 2 commit attribution 复盘 / T4 README completeness check (STATE shipped count vs README shipped count B-04 bash flavor warn-only round 1) / T5 phase-2.4 self-check fr ≥ 0.80 end-state verify report — 沿袭 Phase 2.1/2.2/2.3/2.4 Wave 0 一次根治模式。

### A7 守恒约束 (ADR 0001-0013 main body 不可改)

phase 3.1 沿袭 ADR 0003/0005/0007/0008/0009/0010/0011/0012/0013 errata 风格 — **不动 ADR 0001-0013 main body** (A7 守恒)。 baseline tag iterate 13 → 14 (Wave 5 T5.6 ship 时 push `adr-0014-accepted` tag，ci.yml A7 step iter `1-0013` → `1-0014` per W-02 orchestrator explicit literal fix)。 本 ADR 0014 起 phase 3.1 ship 时刻 frozen；v0.3.1+ 演化走 ADR 0015+ errata。

## Decisions

### 1. D-01 TEMPLATE checkpoint 摘要 (zero LLM call)

`src/checkpoint/template.ts` 70L 机械 extract 固定 JSON fields；`Buffer.byteLength/4` Heuristic 估 token；fail-loud 3-level truncate (last_task → 200 char → key_decisions slice 5 → throw `CheckpointTooLargeError`)。 Karpathy YAGNI + R7.2 验收"单 checkpoint < 1k token"指向机械拼装。`writeCheckpoint(c, customPath?)` 双自校 (`Value.Check(CheckpointV1, c)` schema gate + `enforceBudget()` token gate)；sister `src/workflow/loadPhases.ts` validate-and-throw pattern。 估算公式 `1 char ≈ 0.25 token` 英文 dominant + utf8 多字节 glyph 正确计长 (Buffer.byteLength)。

### 2. D-02 KARPATHY 极简 3-state current-workflow.json

`src/checkpoint/state.ts` 76L `active`/`paused`/`complete` enum；schemaVersion 7-surface → **8-surface** (`harnessed.currentWorkflow.v1` 加 SCHEMA_VERSIONS table + Union)。`readCurrentWorkflow()` CD-5 fail-soft (missing/corrupt/unknown-version 全 return null)；`writeCurrentWorkflow()` schema gate 强校；3 transition (`activate` / `pause` / `complete`) preserve 已有 timestamp 字段 (started_at / paused_at / completed_at)。 不引 xstate / robot3 dep；6-state FSM textbook 推 v0.4 dogfooding 验证 (D-02 evaluated rejected)。

### 3. D-03 RELOAD harnessed resume (不偷袭用户)

`src/cli/resume.ts` 42L 12th subcommand (sister `src/cli/doctor.ts` --json flag pattern) + `src/checkpoint/resume.ts` 67L `runResume()` 三态 discriminated union (`no-paused-phase` / `corrupt` / `ok`)；输出 checkpoint 摘要 (phase / last_task / key_decisions / canonical_refs) + human hint `→ in Claude Code: /gsd-execute-phase X.Y (session_id: ... — SDK will redirect)`；§ 1.3 cwd guard warn-only (`checkpoint.cwd !== process.cwd()` → stderr warn + fresh-session fallback)；exit 0 ok / exit 1 fail；用户保留"忘记重开"自由。 AUTO-REPLAY 推 v0.4 dogfooding 验证 (D-03 evaluated rejected)。

### 4. D-04 WIRE-IN T4.4 closure infra activation 闭环

Phase 2.2 W4 T4.1 ship 三件套 (`sdkSpawn.onSessionId` + `ralphLoopWrap.resumeSessionId` + `engine.wrappedSpawn capturedSessionId`) **1 milestone 闲置后首消费者**；`ralphLoop.ts` L43 dead-wiring 删 + `engine.ts` L182 void placeholder 删 + `checkpoint.write` 触发 + W-01 orchestrator PRIMARY extract `src/checkpoint/engineHook.ts` (49L) keep engine.ts ≤200L Karpathy clean (实占 200L)。 `engineHook.ts` `activatePhase()` + `completePhase()` bridge engine.ts events → `current-workflow.json` + `checkpoint.json` 双写；sister `src/routing/lib/sdkReconcile.ts` (56L) Phase 2.2 helper extract pattern for testability。 W-04 mitigation: `phaseId="unknown"` warn-only fail-loud (`TaskContext.phaseId` typed field via task schema 删 `as any` cast)。

### 5. § 1.3 cwd 匹配陷阱 mitigation

code.claude.com `<encoded-cwd>` 路径 critical constraint — checkpoint schema 加 `cwd` field；resume cwd mismatch → stderr warn (不强 block, RELOAD lock 不偷袭)；warn-only + fresh-session fallback 双兜底 (sister D-03 unobstrusive)。

### 6. § 2 SIGINT Node native + isShuttingDown + 30s timeout

`src/checkpoint/sigintTrap.ts` 62L `process.on('SIGINT', ...)` Karpathy YAGNI 零 dep；`isShuttingDown` guard 防 double-fire；Win double Ctrl+C force quit 是 Windows OS 行为 Node 无法 override；exit 130 standard SIGINT code (128+2)；`setTimeout(30000)` fallback 防 fs hang；`resetSigintTrap()` test seam。

### 7. § 7 compact threshold 75% MVP placeholder

`src/checkpoint/compact.ts` 25L `shouldCompact(currentTokens, opts)` judge-only — sister Claude Code "noisy workflow" override 50% + 平日 70% 中间；DEFAULT_THRESHOLD_PCT=75 + DEFAULT_CONTEXT_WINDOW=200_000 (sonnet/opus 4.x baseline，1M ctx defer Phase 3.4)；`compact()` placeholder warn — Phase 3.4 ships actual fold logic + token budget 监控 + auto-fold turns。 trigger consumer 不 wire (no spawn) — Phase 3.1 MVP judge-only。

### 8. W0 backlog 4 项 absorb + B-01 W0.3 round 1 warn-only + B-02 userSpawn fresh-session-only

W0 4 项 backlog 一次根治 (沿袭 Phase 2.2/2.3/2.4 Wave 0 atomic-batch 模式)：T0.1 AUDIT.md § 0.5 Line Budget Deviations Accepted (doctor.ts 215L +7% B-03 5% tolerance + dashboard.mjs 610L well-under ≤650L Phase 2.4 D-04 absorb 透明登记) / T0.2 RETROSPECTIVE Advisory Absorb Path 节 (dashboard polish round 2 cf00d17/008f9ab absorb cadence note avoid "advisory rejected" 暗示) / T0.3 ci.yml README completeness check WARN-ONLY round 1 (B-01 sister Phase 2.1 transparency CI warn-only pattern；DEFERRED #1 ENFORCE flip → Phase 3.2 W0 prereq after STATE.md/README.md format normalization) / T0.4 phase-2.4 self-check PASS verify report (PLAN+task_plan 3/4 WARNING fr ≥ 0.80 → deferred-items #2 self-referential 解决证据, no auto_retrigger) + T0.5 tests/checkpoint/cli/integration dirs scaffold + vitest glob verify。 B-02 userSpawn fresh-session-only path: 测试 seam signature `(agentDef) => Promise<string>` 无 onSessionId out-param by design (YAGNI <5% niche, breaking change > value)；resume.ts falls back to fresh session + reload checkpoint (DEFERRED #2 → Phase 3.4+ if needed)。

### 9. § 12 6-wave topology rationale + A7 conservation

W0 backlog → W1 schema (8th surface) + state 3-state → W2 template + archive (双轨) → W3 SDK wire-in + engineHook PRIMARY extract → W4 SIGINT trap + CLI resume + compact placeholder → W5 e2e dogfood + ADR 0014 + ship；ADR 0001-0013 main body 0 diff verify (A7 守恒 sister Phase 2.4 T6.2)；ci.yml A7 iter `1-0013` → `1-0014` per W-02 orchestrator explicit `ADR 0001-0014` literal (NOT naked `1-0014` substring)；baseline tag `adr-0014-accepted` (Wave 5 T5.6) + milestone tag `v0.3.0-alpha.1-checkpoint`。

## A7 Conservation

ADR 0001-0013 main body **untouched**；baseline tag iteration `adr-0001-accepted` ... `adr-0013-accepted` → 加 `adr-0014-accepted` (phase 3.1 Wave 5 T5.6 ship 打)。 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body **不动**。schemaVersion 7-surface → 8-surface = additive extension (新 `currentWorkflow.v1` surface)，无修改既有 7 surface 内部 (B-37)。

### A7 守恒验收命令 (phase 3.1 ship 后 0001-0014 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0014 main body unchanged"
```

phase 3.1 ship 前 A7 守恒 ADR 0001-0013 验收 (Wave 5 verify + T5.4 ship-time verify)：

```bash
git diff adr-0013-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-3]-*.md" | wc -l   # = 0
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0013` 加 `0014`；step name `ADR 0001-0013` → `ADR 0001-0014` (W-02 explicit literal fix, Wave 5 T5.4 落地)。

## Consequences

**Capability deltas (Phase 3.1 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| checkpoint TEMPLATE 摘要 (D-01) | NEW template.ts 70L + budget enforcement 3-level + zero LLM call | `tests/checkpoint/template.test.ts` 11 cells + grep gate "0 LLM call" |
| current-workflow 3-state machine (D-02) | NEW state.ts 76L + 8th schemaVersion surface | `tests/checkpoint/state.test.ts` |
| harnessed resume 12th subcommand (D-03) | NEW src/cli/resume.ts 42L + checkpoint/resume.ts 67L + --json flag | `tests/cli/resume.test.ts` 7 cells + `tests/checkpoint/resume.test.ts` |
| T4.4 closure infra activation (D-04) | engineHook.ts 49L PRIMARY extract + ralphLoop.ts L43 dead-wiring 删 + engine.ts 200L Karpathy clean | `tests/checkpoint/engineHook.test.ts` + `tests/routing/sdk-wire.test.ts` 7 cells |
| SIGINT trap + 30s timeout | NEW sigintTrap.ts 62L + 双 Ctrl+C force quit + isShuttingDown guard | `tests/checkpoint/sigint.test.ts` |
| compact threshold 75% placeholder | NEW compact.ts 25L + judge-only MVP + 200k ctx baseline | `tests/checkpoint/compact.test.ts` |
| archive 双轨 unbounded raw turns | NEW archive.ts 36L + `.harnessed/archive/phase-X/raw-<ISO>.json` | `tests/checkpoint/archive.test.ts` |
| Phase 3.1 e2e SIGINT → resume → SDK redirect | NEW phase-3.1-e2e.test.ts 149L 3 cells D-04 WIRE-IN end-to-end | T5.1 593 pass post-ship |

**Negative consequence + mitigation**: DEFERRED #1 (Phase 3.1 W0.3 → Phase 3.2 ENFORCE flip 短期 STATE/README counter format mismatch warn-only round 1) + DEFERRED #2 (userSpawn session_id capture niche — fresh-session fallback acceptable, 推 Phase 3.4+ if real demand) + engine.ts 200L (B-03 hard limit ≤200L 边界 — 0 tolerance used per W-01 PRIMARY extract; engineHook.ts 49L 单独承接所有 checkpoint bridge logic 保持 engine.ts 主流程清晰)。 mitigation: 4 sister deferred 均 documented + tracked + 触发条件 clear。

## Compliance

**F1-F8 8/8 acceptance bar verify evidence**:

- F1 ADR 0014 errata accepted — 本 ADR Status flip + 9 章节 fill (Wave 5 T5.2)
- F2 checkpoint TEMPLATE 摘要 + budget enforce (R7.2) — Wave 2 T2.1-T2.4 (4 task, 11 cells)
- F3 current-workflow 3-state machine + 8th schemaVersion (R7.3) — Wave 1 T1.1-T1.4
- F4 T4.4 closure infra activation (D-04 WIRE-IN) — Wave 3 T3.1-T3.3 (3 task + 7 cells sdk-wire test)
- F5 harnessed resume 12th subcommand (D-03 RELOAD) + SIGINT trap + compact placeholder — Wave 4 T4.1-T4.5 (5 task + 18 fixtures)
- F6 e2e SIGINT → resume → SDK redirect smoke — Wave 5 T5.1 (3 cells D-04 WIRE-IN end-to-end)
- F7 W0 backlog 4 项一次根治 — Wave 0 T0.1-T0.5 (AUDIT 透明 + RETRO advisory absorb path + ci README completeness check + phase-2.4 self-check + tests dirs scaffold)
- F8 SHIP — `adr-0014-accepted` baseline tag + `v0.3.0-alpha.1-checkpoint` (Wave 5 T5.6)；ci.yml A7 step iter `1-0013` → `1-0014` (T5.4)；A7 守恒 ADR 0001-0013 main body 0 diff verified

**3-OS CI 全绿 evidence**: Wave 1-4 ship per-task CI runs 3-OS green；Wave 5 ship final CI verify (T5.6 push 触发)。

**Karpathy hard limits met (all files ≤ budget)**:
- ADR 0014 ≤ 250L (本 fill-out 实占 ≈ 165L)
- engine.ts 200L (B-03 ≤200L hard limit edge — 0 tolerance used per W-01 PRIMARY extract)
- engineHook.ts 49L (≤50L per W-01 acceptance, sister sdkReconcile.ts 56L Phase 2.2)
- template.ts 70L / state.ts 76L (D-02 ≤80L)
- resume.ts 67L (D-03 ≤70L) + cli/resume.ts 42L (sister doctor.ts pattern)
- sigintTrap.ts 62L (D-02 SIGINT ≤80L)
- compact.ts 25L (≤35L) + archive.ts 36L (≤60L)
- phase-3.1-e2e.test.ts 149L (test fixture inline acceptable per Karpathy spirit)

## Errata-path note

phase 3.1 走 ADR 0014 errata pattern (新决策 inline, ADR 0001-0013 0-diff preserved)；future Phase 3.2+ 走 ADR 0015+ errata。 本 ADR 0014 起 phase 3.1 ship 时刻 frozen — 任何 v0.3.1+ 演化 (compact actual fold → Phase 3.4 / W0.3 ENFORCE flip → Phase 3.2 W0 / userSpawn session_id capture → Phase 3.4+ if demand / FSM 6-state upgrade → v0.4 dogfooding 后) 必须开 ADR 0015+ errata；本 ADR 0014 main body 不可改 (与 ADR 0001-0013 同等守恒规则)。

phase 3.1 ship 时 Wave 5 T5.4 (本 ADR `adr-0014-accepted` baseline tag push 前) ci.yml A7 step `for n in ... 0013` → `for n in ... 0013 0014` + step name `ADR 0001-0013` → `ADR 0001-0014` (baseline tag iteration `1-0013 → 1-0014` per W-02 orchestrator explicit literal fix)。

## Adoption-confirmation

**v0.3.0 MILESTONE 1/4 START** (sister Phase 1.5 v0.1.0 close + Phase 2.4 v0.2.0 close pattern — 第 1 phase ship 启 milestone):

- 1 phase ship: Phase 3.1 (checkpoint engine + harnessed resume + compact) = 1/4
- 14 ADR + 14 baseline tag accumulate (0001-0014)
- 10 milestone tag accumulate (sister v0.1.0+v0.2.0 9 个 + v0.3.0-alpha.1-checkpoint)
- Tests baseline: 543 → 596+ (+47 W1-W5 — schema 4 + state 5 + template 11 + archive 5 + engineHook 13 + sdk-wire 7 + sigint 7 + compact 4 + resume 11 + e2e 3 + cli resume 7 ≈ +50)；3-OS CI matrix 全绿
- W3 T3.2 wired + W4 T4.4 CLI ship + W5 T5.6 baseline tag adr-0014-accepted push = "Adoption confirmed" 实证

**Deferred items disposition** (Wave 5 ship-time review):
- DEFERRED #1 (W0.3 ENFORCE flip) → Phase 3.2 W0 (sister Phase 2.1 transparency 4-phase warn-only round 1 → ENFORCE pattern)
- DEFERRED #2 (userSpawn session_id capture niche) → Phase 3.4+ if real demand (currently fresh-session fallback acceptable)
- cli-audit 2 pre-existing fail (pre-Phase 1.2) → Phase 3.2 scheduled fix session (out of scope Phase 3.1)
- T4.4 Task Session 复用 完整版 ✅ RESOLVED Phase 3.1 W3 (D-04 WIRE-IN activated; closure infra ready Phase 2.2 → activated Phase 3.1)

## References

### 内部依据

- `docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md` (Phase 2.4 ship base — 9 章节 errata sister template)
- `docs/adr/0011-execute-task-sdk-ralph.md` (Phase 2.2 ship — T4.4 closure infra 三件套 ship 来源 + schemaVersion 7-surface single 兼容门 original)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 (main body **不动** A7 守恒)
- `src/checkpoint/template.ts` (W2 T2.1 NEW 70L — D-01 zero LLM call + 3-level budget enforce)
- `src/checkpoint/state.ts` (W1 T1.3 NEW 76L — D-02 3-state machine + 8th schemaVersion surface)
- `src/checkpoint/archive.ts` (W2 T2.2 NEW 36L — 双轨 unbounded raw turn dump)
- `src/checkpoint/engineHook.ts` (W3 T3.2 NEW 49L — W-01 PRIMARY extract sister sdkReconcile.ts 56L)
- `src/checkpoint/sigintTrap.ts` (W4 T4.1 NEW 62L — D-02 SIGINT + isShuttingDown + 30s timeout)
- `src/checkpoint/resume.ts` (W4 T4.3 NEW 67L — D-03 RELOAD + cwd guard + branchOnSchemaVersion)
- `src/checkpoint/compact.ts` (W4 T4.2 NEW 25L — 75% threshold MVP placeholder)
- `src/checkpoint/schema/index.ts` (W1 T1.2 — TypeBox CheckpointV1 + CurrentWorkflowV1)
- `src/cli/resume.ts` (W4 T4.4 NEW 42L — 12th CLI subcommand + barrel export)
- `src/routing/engine.ts` (W3 T3.2 — 195→200L Karpathy clean restored, ≤200L hard limit edge per W-01 PRIMARY extract)
- `src/routing/lib/ralphLoop.ts` (W3 T3.1 — sessionId capture activation D-04 WIRE-IN)
- `tests/integration/phase-3.1-e2e.test.ts` (W5 T5.1 NEW 149L — 3 cells D-04 WIRE-IN end-to-end)
- `.github/workflows/ci.yml` (W5 T5.4 — A7 iter `1-0013` → `1-0014` per W-02 orchestrator explicit literal fix)
- `.planning/phase-3.1/{3.1-KICKOFF, 3.1-CONTEXT, 3.1-DISCUSSION-LOG, PATTERNS, RESEARCH, ASSUMPTIONS, PLAN, task_plan, PLAN-CHECK, PLAN-CHECK-DELTA, AUDIT, deferred-items, progress, VERIFICATION, DOGFOOD-T5.5}.md`

### 外部参考

- `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律
- `.planning/ROADMAP.md` L156-158 (Phase 3.1 验收: "人为中断 session 后从 03 phase 续跑成功")
- `.planning/REQUIREMENTS.md` R7.2 + R7.3 (checkpoint engine + resume)
- `docs/PROJECT-SPEC.md` § 12 (checkpoint mech 立项参数)
- code.claude.com/docs/en/agent-sdk/sessions § "Capture the session ID" + "Resume by ID" + "Resume across hosts"
