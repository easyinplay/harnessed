---
phase: 3.1
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  # W0 backlog absorb (4 项, sister Phase 2.4 W0 root-cause cluster)
  - .planning/v0.2.0-MILESTONE-AUDIT.md           # W0.1 — § 0.5 Line Budget Deviations Accepted ~10L (AUDIT actuals: doctor.ts 215L + dashboard.mjs 610L per RESEARCH § 10 校对源 verified)
  - .planning/RETROSPECTIVE.md                    # W0.2 — Advisory Absorb Path 节 ~15L (handoff intel L482 advisory absorb cadence note)
  - .github/workflows/ci.yml                      # W0.3 — README completeness check step ~10L bash (sister Phase 2.4 D-03 counter gate pattern) + W5 ralph-loop sentinel SIGINT step optional
  - .planning/phase-3.1/W0-T5-verify.md           # W0.4 — phase-2.4 self-check verify report (1 cell, ≥0.80 fr verify per RESEARCH § 10)
  # W1 schema + state machine
  - src/types/schemaVersion.ts                    # 7-surface → 8-surface (加 currentWorkflow: 'harnessed.current-workflow.v1') +4L
  - src/checkpoint/schema/checkpoint.v1.ts        # NEW ~50L — TypeBox CheckpointV1 (D-01 schema lock + cwd field per RESEARCH § 1.3)
  - src/checkpoint/schema/currentWorkflow.v1.ts   # NEW ~30L — TypeBox CurrentWorkflowV1 (D-02 3-state)
  - src/checkpoint/schema/index.ts                # NEW ~5L — barrel
  - src/checkpoint/state.ts                       # NEW ~60L — activate/pause/complete 3-state read/write (D-02 KARPATHY)
  - tests/checkpoint/schema.test.ts               # NEW ~80L — TypeBox roundtrip + 8-surface grep + branchOnSchemaVersion 'checkpoint.v1' / 'current-workflow.v1'
  - tests/checkpoint/state.test.ts                # NEW ~80L — 3-state transition (active → paused → complete + timestamps + last_checkpoint_path 同步)
  # W2 template + archive + budget
  - src/checkpoint/template.ts                    # NEW ~80L — writeCheckpoint + estimateTokens (Buffer.byteLength/4) + enforceBudget truncate fallback (D-01 fail-loud)
  - src/checkpoint/archive.ts                     # NEW ~40L — writeArchive raw turn dump to .harnessed/archive/phase-<X.Y>/raw-<ts>.json
  - src/checkpoint/index.ts                       # NEW ~10L — barrel export (template/state/archive/schema)
  - tests/checkpoint/template.test.ts             # NEW ~80L — 5 fixture: happy < 1k / 1k boundary / truncate last_task / truncate key_decisions / fail-loud throw
  - tests/checkpoint/archive.test.ts              # NEW ~60L — 4 fixture: path gen + mkdir recursive + raw JSON write + 1MB stress
  # W3 SDK wire-in + ralphLoop sessionId activation
  - src/routing/lib/ralphLoop.ts                  # MODIFY +5L — activate sessionId capture between iterations (RESEARCH § 1.5 dead-wiring fix)
  - src/routing/agentDefinition.ts                # MODIFY +3L — TaskContext add `phaseId?: string` field (W-04 orchestrator fix path (a) thread phaseId via task schema; eliminates `as any` cast)
  - src/checkpoint/engineHook.ts                  # NEW ≤50L — W-01 orchestrator PRIMARY extract (analog sdkReconcile.ts ≤56L Phase 2.2 helper extract pattern); engine.ts wedge import + 1-2 hook call (engine.ts ≤200L Karpathy hard limit clean)
  - src/routing/engine.ts                         # MODIFY wedge (~10L net) — void capturedSessionId 删 + import engineHook + 1-2 hook call (activatePhase + completePhase) + wrappedSpawn signature extend onSessionIdInner; FINAL ≤200L Karpathy hard limit clean (W-01 + W-04 coordinated)
  - tests/checkpoint/sdk-wire.test.ts             # NEW ~140L — 7 fixture: capture happy / capture-then-resume / no-session fallback / SDK reject session_id fresh fallback / mid-iteration retry sessionId reuse / engineHook.completePhase sessionId verified / **B-02 userSpawn fallback fixture (fresh-session-only no session_id capture)**
  - tests/checkpoint/engineHook.test.ts           # NEW ~40L — 1+ fixture for W-01 PRIMARY extract unit test (activatePhase + completePhase + WARN on phaseId='unknown')
  # W4 SIGINT trap + harnessed resume CLI
  - src/checkpoint/sigintTrap.ts                  # NEW ~25L — process.on('SIGINT') + isShuttingDown + 30s timeout (RESEARCH § 2 Node native YAGNI)
  - src/checkpoint/compact.ts                     # NEW ~30L — shouldCompact 75% placeholder (RESEARCH § 7 推 75%); harnessed compact subcommand 推 Phase 3.4
  - src/checkpoint/resume.ts                      # NEW ~60L — runResume() reads current-workflow.json + checkpoint + cwd guard (§ 1.3) + buildResumeHint
  - src/cli/resume.ts                             # NEW ~40L — registerResume(program) commander shell + --json flag (sister doctor.ts pattern)
  - src/cli.ts                                    # MODIFY +2L — register registerResume (11 → 12 subcommands) + comment update
  - tests/checkpoint/sigint.test.ts               # NEW ~100L — 5 fixture: SIGINT → paused / double SIGINT force quit 130 / no-active workflow silent exit / async write 30s timeout / status=complete no-op
  - tests/cli/resume.test.ts                      # NEW ~90L — 7 fixture: paused happy / no current-workflow exit 1 / status=active exit 1 / checkpoint corrupt exit 1 / cwd mismatch warn / --json schema / session_id present hint
  - tests/checkpoint/compact.test.ts              # NEW ~40L — 4 fixture: under threshold / at threshold / over threshold / custom override 50%
  # W5 e2e dogfood + ship
  - tests/integration/phase-3.1-e2e.test.ts       # NEW ~80L — end-to-end SIGINT → state.paused → harnessed resume CLI → SDK options.resume captured sid (mock SDK sister sdk-spawn.test.ts L158-198 pattern)
  - docs/adr/0014-checkpoint-engine-resume-compact.md  # NEW ~150L — Phase 3.1 ADR errata 9 章节 (Wave 0 sketch → Wave 5 fill)
  - .planning/STATE.md                            # MODIFY — Phase 3.1 SHIPPED 续编 + 当前位置 + v0.3.0 第 1/4 ship + entry #31
  - .planning/RETROSPECTIVE.md                    # MODIFY — Phase 3.1 milestone retrospective (W0 cluster + W3 dead-wiring 激活 + W5 dogfood lessons)
  - .planning/ROADMAP.md                          # MODIFY — Phase 3.1 ✅ + v0.3.0 1/4 进度 + Phase 3.2 启动 prereq

autonomous: true

requirements:
  - R7.2  # checkpoint 分层 (摘要 < 1k token + archive 完整) — REQUIREMENTS L263-267 / ROADMAP L156-158 Phase 3.1 必含
  - R7.3  # harnessed resume — REQUIREMENTS L269-273 / ROADMAP L156-158 acceptance "人为中断 session 后从 03 phase 续跑成功"

# user_setup: 无 — 本 phase 0 external service dependency (纯 local fs + 现有 SDK pinned 0.3.142 已 ready, 不 bump)

must_haves:
  truths:
    - "developer can run `harnessed resume` from any cwd in a paused harnessed workflow and see (a) checkpoint summary (phase/last_task/key_decisions/session_id) (b) human resume hint '→ in Claude Code: /gsd-execute-phase <X.Y>' on stdout; exit 0"
    - "developer can run `harnessed resume --json` and get JSON schema {checkpoint: {...}, resume_hint: string} for CI consumption; exit 0"
    - "developer can run `harnessed resume` when no .harnessed/current-workflow.json exists OR status !== 'paused' OR checkpoint corrupt and see fail-loud error message + exit 1 (D-03 lock)"
    - "developer can press Ctrl+C during a harnessed routing workflow and see (a) checkpoint write log 'SIGINT — writing checkpoint' (b) .harnessed/current-workflow.json status='paused' + paused_at timestamp persisted (c) .harnessed/checkpoints/<phase>.json carries session_id field (when SDK captured one) (d) process exits with code 130"
    - "developer can press Ctrl+C twice (double SIGINT) and see 'force quit' message + immediate exit 130 (no hang waiting for async checkpoint write)"
    - "developer can resume the original SDK session by running `harnessed resume` then in Claude Code `/gsd-execute-phase <X.Y>`; subsequent ralph-loop iterations pass options.resume=<captured-sid> to SDK query() (D-04 WIRE-IN end-to-end verified via mock SDK)"
    - "developer running checkpoint write sees Buffer.byteLength/4 token estimate < 1000 for typical checkpoint (~400-500 token); when over budget, last_task truncated to 200 chars then key_decisions sliced to 3 entries then throws CheckpointTooLargeError (fail-loud)"
    - "developer reading `.harnessed/archive/phase-<X.Y>/raw-<ts>.json` sees complete raw turn history (NOT subject to 1k token budget; archive serves回溯 only, never enters context)"
    - "every new schema (checkpoint.v1 + current-workflow.v1) goes through src/types/schemaVersion.ts SCHEMA_VERSIONS const + SchemaVersionLiteral Union (7 → 8 surface registered); every consume site goes through branchOnSchemaVersion<T>() helper (CD-5 Phase 2.2 single 兼容门)"
    - "Wave 0 4 项 backlog 一次根治: W0.1 AUDIT.md § 0.5 Line Budget Deviations Accepted 节 (per AUDIT actuals not KICKOFF stale) + W0.2 RETROSPECTIVE.md Advisory Absorb Path 节 + W0.3 README completeness CI gate ship (**WARN-ONLY round 1** per B-01 orchestrator fix — continue-on-error: true; ENFORCE flip → Phase 3.2) + W0.4 phase-2.4 self-check ≥0.80 fr verify report"
    - "Phase 3.2 W0 prereq: format-normalize STATE.md `**Phase X.Y SHIPPED**` line-start pattern + README.md `- **Phase X.Y shipped** ✅` pattern so statistics align, THEN flip W0.3 `continue-on-error: false` + restore `::error::` enforce path (DEFERRED #1 close)"
    - "userSpawn branch is fresh-session-only path — no session_id capture; resume.ts falls back to fresh session + reload checkpoint (no SDK redirect). userSpawn signature `(agentDef) => Promise<string>` has no onSessionId out-param by design (YAGNI, <5% niche, breaking change cost > value per B-02 orchestrator fix path (b)). Sister: Phase 2.4 doctor `--json` mode behavior split."
    - "ADR 0014 errata accepted 9 章节 (D-01 TEMPLATE + D-02 KARPATHY 3-state + D-03 RELOAD + D-04 WIRE-IN + § 1.3 cwd guard + § 2 SIGINT Node native + § 7 compact 75% + W0 backlog + § 12 6-wave topology); ADR 0001-0013 main body 0 diff verify (A7 守恒 sister Phase 2.4 T6.2 pattern)"
    - "Phase 3.1 self-dogfood pass: in Wave 5 a real SIGINT → harnessed resume → /gsd-execute-phase 3.1 cycle completes one ralph-loop iteration (acceptance of ROADMAP 'human-interrupted session → resume from 03 phase'); baseline tag adr-0014-accepted + milestone tag v0.3.0-alpha.1-checkpoint pushed"

  artifacts:
    - path: "src/types/schemaVersion.ts"
      provides: "8th surface registered: currentWorkflow = 'harnessed.current-workflow.v1' (sister CD-5 Phase 2.2 W2 T2.0); SCHEMA_VERSIONS const + SchemaVersionLiteral Union + branchOnSchemaVersion<T> helper unchanged signature"
      contains: "currentWorkflow: 'harnessed.current-workflow.v1'"
    - path: "src/checkpoint/schema/checkpoint.v1.ts"
      provides: "TypeBox CheckpointV1 schema (D-01 lock): schemaVersion + phase + status (3-enum) + last_task + key_decisions[] + canonical_refs[] + session_id? + cwd + timestamp ISO + archive_path; Static<typeof> export"
      exports: ["CheckpointV1", "CheckpointV1Type", "CheckpointStatus"]
    - path: "src/checkpoint/schema/currentWorkflow.v1.ts"
      provides: "TypeBox CurrentWorkflowV1 schema (D-02 lock): schemaVersion literal + phase + status: 'active'|'paused'|'complete' + last_checkpoint_path + started_at + paused_at? + completed_at?"
      exports: ["CurrentWorkflowV1", "CurrentWorkflowV1Type", "WorkflowStatus"]
    - path: "src/checkpoint/template.ts"
      provides: "writeCheckpoint(c) Value.Check validate + estimateTokens(c) Buffer.byteLength/4 Heuristic + enforceBudget truncate fallback (last_task → 200 char → key_decisions slice 3 → throw CheckpointTooLargeError); zero LLM call (D-01 lock)"
      exports: ["writeCheckpoint", "estimateTokens", "enforceBudget", "CheckpointTooLargeError"]
    - path: "src/checkpoint/state.ts"
      provides: "3-state read/write (D-02 KARPATHY): activate(phase, checkpointPath) writes active+started_at / pause() reads current → sets paused+paused_at / complete() reads current → sets complete+completed_at; readCurrentWorkflow returns null on schema drift (fresh init fallback)"
      exports: ["activate", "pause", "complete", "readCurrentWorkflow", "writeCurrentWorkflow"]
    - path: "src/checkpoint/archive.ts"
      provides: "writeArchive(phase, rawTurns) → .harnessed/archive/phase-<X.Y>/raw-<ISO-ts>.json; NOT subject to 1k token budget (archive 完整 per R7.2 lock)"
      exports: ["writeArchive"]
    - path: "src/checkpoint/sigintTrap.ts"
      provides: "registerSigintTrap(getActiveState) — process.on('SIGINT') Node native (RESEARCH § 2.1 YAGNI lock) + isShuttingDown flag (RESEARCH § 2.2 npm relay + Win double Ctrl+C mitigation) + 30s setTimeout fallback (file write hang防护) + Promise.all([writeCheckpoint paused, writeCurrentWorkflow paused]) + exit 130 standard SIGINT code"
      exports: ["registerSigintTrap"]
    - path: "src/checkpoint/compact.ts"
      provides: "shouldCompact(currentTokens, opts?) ≥ 75% × 200_000 default (RESEARCH § 7 推 75% sister Claude Code noisy override 50% / 平日 70% 中间); MVP placeholder, harnessed compact subcommand 推 Phase 3.4"
      exports: ["shouldCompact", "DEFAULT_THRESHOLD_PCT", "DEFAULT_CONTEXT_WINDOW"]
    - path: "src/checkpoint/resume.ts"
      provides: "runResume() reads .harnessed/current-workflow.json → branchOnSchemaVersion validate → finds status==='paused' → readCheckpoint(last_checkpoint_path) → branchOnSchemaVersion validate → cwd mismatch warn (§ 1.3 guard) → returns {status: 'no-paused-phase'|'corrupt'|'ok', checkpoint?, warn?}; D-03 RELOAD lock"
      exports: ["runResume"]
    - path: "src/cli/resume.ts"
      provides: "12th CLI subcommand registerResume(program) — commander shell + --json flag (sister doctor.ts L141-172 pattern); delegates to checkpoint/resume.runResume; exit 0=ok, 1=no-paused/corrupt/schema-mismatch (D-03 fail-loud)"
      exports: ["registerResume"]
    - path: "src/checkpoint/index.ts"
      provides: "barrel export for all 7 checkpoint module files (schema/checkpoint.v1, schema/currentWorkflow.v1, template, state, archive, sigintTrap, resume, compact)"
    - path: "src/routing/lib/ralphLoop.ts"
      provides: "sessionId activation between iterations — replace dead `let sessionId: string | undefined` L43 with capture-then-reuse: spawn returns sessionId via callback OR closure attachment so iter 2+ passes captured sessionId to spawn(sessionId)"
      contains: "sessionId = "
    - path: "src/routing/engine.ts"
      provides: "void capturedSessionId placeholder L182 REMOVED; wedge import + 1-2 hook call (engineHook.activatePhase + engineHook.completePhase) per W-01 orchestrator PRIMARY extract; wrappedSpawn signature extend onSessionIdInner propagate to ralphLoop iter 2+; phaseId via task.phaseId (TaskContext schema field per W-04 orchestrator fix path (a) — NO `as any` cast); FINAL ≤200L Karpathy hard limit clean (no B-03 5% tolerance needed)"
      contains: "engineHook"
    - path: "src/checkpoint/engineHook.ts"
      provides: "W-01 orchestrator PRIMARY extract (analog src/routing/lib/sdkReconcile.ts ≤56L Phase 2.2 helper extract pattern, for testability + engine.ts hard limit clean): activatePhase(phaseId) writes initial active + state.activate / completePhase(ctx) writes final complete + state.complete; Karpathy fail-loud WARN on phaseId='unknown' fallback (non-blocking)"
      exports: ["activatePhase", "completePhase", "EngineCheckpointHookCtx"]
    - path: "src/routing/agentDefinition.ts"
      provides: "TaskContext interface +1 field `phaseId?: string` (W-04 orchestrator fix path (a)) with JSDoc: 'Phase identifier (e.g., \"3.1\") for checkpoint paths; falls back to \"unknown\" if not provided.' Eliminates `(matched?.decision as any)?.phase` cast (Karpathy Surgical Changes + type safety)"
      contains: "phaseId"
    - path: ".github/workflows/ci.yml"
      provides: "README completeness check step (W0.3 ~10L bash, sister Phase 2.4 D-03 counter gate pattern); compare STATE.md per-phase shipped count vs README.md per-phase shipped count exit 1 on drift (RESEARCH § 10 W0.3 regex直证)"
    - path: ".planning/v0.2.0-MILESTONE-AUDIT.md"
      provides: "§ 0.5 Line Budget Deviations Accepted 节 ~10L (W0.1 actuals per RESEARCH § 10 校对源: doctor.ts 215L > 200 hard limit 5% tolerance + dashboard.mjs 610L ≤ 650L SKIP split; NOT KICKOFF stale run-plan-checker.mjs / plan-checker-quant.test.ts)"
      contains: "Line Budget Deviations Accepted"
    - path: ".planning/RETROSPECTIVE.md"
      provides: "Advisory Absorb Path 节 (W0.2 ~15L per RESEARCH § 10 W0.2): Phase 2.4 handoff intel L482 dashboard polish round 2 'independent commit' advisory absorbed into W3 main cluster cf00d17/008f9ab as cadence note for future advisory-vs-mandate boundary"
      contains: "Advisory Absorb Path"
    - path: ".planning/phase-3.1/W0-T5-verify.md"
      provides: "phase-2.4/task_plan.md self-check ≥0.80 fr verify report (W0.4 per KICKOFF L62 + RESEARCH § 10 W0.4); 1 cell run `node scripts/run-plan-checker.mjs .planning/phase-2.4/` + capture exit code + dimensions_passed + verdict"
    - path: "docs/adr/0014-checkpoint-engine-resume-compact.md"
      provides: "Phase 3.1 ADR 9 章节 errata (Wave 0 sketch L1-50 → Wave 5 fill L51-150): 1 D-01 TEMPLATE / 2 D-02 KARPATHY 3-state / 3 D-03 RELOAD / 4 D-04 WIRE-IN closure infra 激活 / 5 § 1.3 cwd guard / 6 § 2 SIGINT Node native + isShuttingDown + 30s timeout / 7 § 7 compact 75% threshold MVP / 8 W0 backlog 4 项 absorb / 9 § 12 6-wave topology + A7 conservation iter 1-0013 → 1-0014"
      contains: "## Context"

  key_links:
    - from: "src/cli/resume.ts registerResume action"
      to: "src/checkpoint/resume.ts runResume"
      via: "dynamic import + delegate (sister doctor.ts L130-134 pattern) — `const { runResume } = await import('../checkpoint/resume.js')`"
      pattern: "import.*\\.\\./checkpoint/resume\\.js|runResume"
    - from: "src/checkpoint/resume.ts runResume"
      to: ".harnessed/current-workflow.json"
      via: "readFile + JSON.parse + Value.Check(CurrentWorkflowV1, parsed) (sister loadPhases.ts L23-30 validate pattern)"
      pattern: "current-workflow\\.json|Value\\.Check.*CurrentWorkflow"
    - from: "src/checkpoint/resume.ts runResume"
      to: ".harnessed/checkpoints/<phase>.json"
      via: "via last_checkpoint_path from current-workflow → readFile + Value.Check(CheckpointV1, parsed) + cwd mismatch guard (§ 1.3 lock)"
      pattern: "last_checkpoint_path|Value\\.Check.*CheckpointV1"
    - from: "src/routing/engine.ts wrappedSpawn onSessionId callback"
      to: "src/checkpoint/template.ts writeCheckpoint"
      via: "capturedSessionId === string → writeCheckpoint({ schemaVersion: SCHEMA_VERSIONS.checkpoint, session_id: capturedSessionId, status: 'complete', ... }) on ralphLoopWrap return path (D-04 WIRE-IN end consumer)"
      pattern: "writeCheckpoint.*session_id.*capturedSessionId|capturedSessionId.*writeCheckpoint"
    - from: "src/checkpoint/sigintTrap.ts SIGINT handler"
      to: "src/checkpoint/state.ts pause + src/checkpoint/template.ts writeCheckpoint"
      via: "Promise.all([writeCheckpoint({status:'paused', session_id: capturedSessionId, ...}), writeCurrentWorkflow({status:'paused', paused_at})]) with 30s setTimeout fallback (RESEARCH § 2.3 implementation template)"
      pattern: "process\\.on\\(['\"]SIGINT['\"]|isShuttingDown|Promise\\.all"
    - from: "src/routing/lib/ralphLoop.ts ralphLoopWrap"
      to: "spawn(sessionId) iter 2+ reuse"
      via: "iter 1: sessionId = undefined → spawn returns string envelope; capture sessionId via spawn callback closure (NOT via envelope parse — engine.ts wrappedSpawn onSessionId is the source); iter 2+: spawn(sessionId) passes captured sid to SDK options.resume (RESEARCH § 1.5 dead-wiring 激活)"
      pattern: "sessionId\\s*=|spawn\\(sessionId\\)"
    - from: "src/types/schemaVersion.ts SCHEMA_VERSIONS"
      to: "src/checkpoint/schema/checkpoint.v1.ts CheckpointV1 + currentWorkflow.v1.ts CurrentWorkflowV1"
      via: "Type.Literal(SCHEMA_VERSIONS.checkpoint) + Type.Literal(SCHEMA_VERSIONS.currentWorkflow) — single 兼容门 CD-5 (Phase 2.2 W2 T2.0 sister)"
      pattern: "SCHEMA_VERSIONS\\.(checkpoint|currentWorkflow)"
    - from: ".github/workflows/ci.yml README completeness check step"
      to: ".planning/STATE.md vs README.md per-phase shipped count"
      via: "bash grep -cE '^[-*]?\\s*\\*?\\*?Phase [1-9]\\.[0-9]\\*?\\*?.*[Ss]hipped' both files; exit 1 on drift (B-04 Win shell:bash + sister Phase 2.4 D-03 counter gate consistency + completeness 互补)"
      pattern: "README completeness check|STATE_COUNT.*README_COUNT"
---

<objective>
Phase 3.1 把 **v0.3.0 milestone 第 1 phase** (4 phase 中第 1, infra 底座) 装配为 **checkpoint 引擎 (摘要 + archive 双轨写) + `harnessed resume` 12th CLI subcommand + compact 协议 75% threshold placeholder + Phase 2.2 T4.4 closure infra 三件套 dead-wiring 激活 + W0 backlog 4 项一次根治**。

**核心 4 子功能** (D-01~D-04 + 4 项 W0):

1. **D-01 TEMPLATE checkpoint 摘要 (zero LLM call)** — `src/checkpoint/template.ts` (~80L) 机械 extract 固定 JSON fields: `{schemaVersion, phase, status, last_task, key_decisions[], canonical_refs[], session_id?, cwd, timestamp, archive_path}`; `Buffer.byteLength/4` Heuristic 估 token (RESEARCH § 3.1 verified ±20% accuracy 中英混合, 1000 budget 留 200 buffer 充裕); 超 budget → fail-loud truncate (last_task → 200 char → key_decisions slice 3 → throw CheckpointTooLargeError); zero LLM API dep; archive sibling write `.harnessed/archive/phase-<X.Y>/raw-<ts>.json` 完整 raw turn (NOT subject to budget per R7.2 lock).

2. **D-02 KARPATHY 3-state `current-workflow.json`** — `src/checkpoint/state.ts` (~60L) `active`/`paused`/`complete` enum + activate(phase, checkpointPath) / pause() / complete() transition; schemaVersion 7-surface → 8-surface (`harnessed.current-workflow.v1` 加 `SCHEMA_VERSIONS` const + `SchemaVersionLiteral` Union, sister Phase 2.2 CD-5 single 兼容门); 不引 xstate/robot3 dep — 1 enum field + 几个 if (Karpathy YAGNI lock).

3. **D-03 RELOAD `harnessed resume`** — `src/cli/resume.ts` (~40L) 12th subcommand (sister doctor.ts L141-172 `--json` flag pattern) + `src/checkpoint/resume.ts` (~60L) runResume controller; 输出 checkpoint 摘要 (phase/last_task/key_decisions 5-10 行) + human hint "→ in Claude Code: /gsd-execute-phase <X.Y>"; 不偷袭用户 (用户保留"忘记重开"自由 per D-03 rationale); exit 0=ok / 1=no-paused/corrupt/schema-mismatch (fail-loud); cwd mismatch warn (RESEARCH § 1.3 关键限制 `~/.claude/projects/<encoded-cwd>/*.jsonl` 路径陷阱).

4. **D-04 WIRE-IN T4.4 closure infra 激活** — Phase 2.2 W4 T4.1 ship 三件套 (`sdkSpawn.onSessionId` ready + `ralphLoopWrap.resumeSessionId` ready + `engine.wrappedSpawn capturedSessionId` ready) 1 milestone 闲置 dead infra, 本 phase 首消费者: ralphLoop.ts L43 `let sessionId: string | undefined` dead-wiring 激活 (+5L iter 2+ 复用 captured sid spawn(sessionId)) + engine.ts L182 `void capturedSessionId` 占位删 + 加 checkpoint.write trigger on success/SIGINT (+15L) + checkpoint schema 加 `session_id?: string` field + harnessed resume 输出含 session_id 时 prompt "→ session can be resumed (sid: xxx)"; fallback: session_id 不存在 / SDK 拒绝续 → fresh session + reload checkpoint 摘要 (退化路径 zero破坏 per D-04 fallback lock).

**W0 backlog 4 项 absorb** (沿袭 Phase 2.4 W0 5 项 root-cause cluster pattern, **AUDIT.md actuals NOT KICKOFF stale** per RESEARCH § 10 校对源):
- **W0.1 (M1)**: `v0.2.0-MILESTONE-AUDIT.md` 加 `## § 0.5 Line Budget Deviations Accepted` 节 ~10L — 登记 AUDIT 实际 tech_debt: doctor.ts 215L > 200 hard limit 5% tolerance (合理性论证后 accept) + dashboard.mjs 610L ≤ 650L SKIP split (proactive split trigger 未到)。**绝不**抄 KICKOFF § 4 W0.1 stale 描述 (run-plan-checker.mjs 130L + plan-checker-quant.test.ts 103L) — RESEARCH § 10 verified KICKOFF stale, AUDIT.md verified actuals。
- **W0.2 (M2+M3)**: `RETROSPECTIVE.md` 加 `### Advisory Absorb Path — handoff intel "独立 commit" 草案被合理 absorb (Phase 2.4)` 节 ~15L — 登记 Phase 2.4 W3 cf00d17/008f9ab executor absorb dashboard polish round 2 草案 advisory absorb 路径 cadence note (避免 future "advisory rejected" 暗示)。
- **W0.3 (T4)**: `.github/workflows/ci.yml` 加 README completeness check step ~10L bash — `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped"` STATE.md vs README.md count drift exit 1; sister Phase 2.4 D-03 counter gate consistency + completeness 互补; B-04 Win shell:bash 路径 (RESEARCH § 10 W0.3 verified regex)。
- **W0.4 (T5)**: 一次 verify `node scripts/run-plan-checker.mjs .planning/phase-2.4/` real-run + 写入 `.planning/phase-3.1/W0-T5-verify.md` ~5L command + 报告 (KICKOFF § 4 anchor; deferred-items #2 self-referential 解决证据)。

**Wave 拓扑** (R2 § 12 recommended 6 wave W0-W5, sister Phase 2.4 7 wave 缩 1):

```
Wave 0 — backlog 4 项 absorb + test infra setup (并行 4 sub-tasks)
  ├─ T0.1 W0.1 AUDIT.md § 0.5 (AUDIT actuals)
  ├─ T0.2 W0.2 RETROSPECTIVE.md Advisory Absorb
  ├─ T0.3 W0.3 ci.yml README completeness check
  ├─ T0.4 W0.4 phase-2.4 self-check verify report
  └─ T0.5 tests/checkpoint/ + tests/cli/ + tests/integration/ dirs setup (mkdir -p)
       ↓
Wave 1 — schema + state machine
  ├─ T1.1 src/types/schemaVersion.ts 7-surface → 8-surface (+4L)
  ├─ T1.2 src/checkpoint/schema/{checkpoint.v1, currentWorkflow.v1, index}.ts NEW ~85L
  ├─ T1.3 src/checkpoint/state.ts NEW ~60L (activate/pause/complete 3-state)
  └─ T1.4 tests/checkpoint/schema.test.ts + state.test.ts NEW ~160L (13 fixture)
       ↓
Wave 2 — template + archive + budget enforcement
  ├─ T2.1 src/checkpoint/template.ts NEW ~80L (writeCheckpoint + estimateTokens + enforceBudget)
  ├─ T2.2 src/checkpoint/archive.ts NEW ~40L (writeArchive raw)
  ├─ T2.3 src/checkpoint/index.ts NEW ~10L (barrel)
  └─ T2.4 tests/checkpoint/template.test.ts + archive.test.ts NEW ~140L (9 fixture)
       ↓
Wave 3 — SDK wire-in + ralphLoop sessionId 激活 (T4.4 dead-wiring 首消费者)
  ├─ T3.1 src/routing/lib/ralphLoop.ts MODIFY +5L (sessionId capture 激活)
  ├─ T3.2 src/routing/engine.ts MODIFY +15L (void delete + checkpoint.write trigger)
  └─ T3.3 tests/checkpoint/sdk-wire.test.ts NEW ~100L (6 fixture, mock SDK)
       ↓
Wave 4 — SIGINT trap + harnessed resume CLI + compact placeholder
  ├─ T4.1 src/checkpoint/sigintTrap.ts NEW ~25L (Node native + isShuttingDown + 30s timeout)
  ├─ T4.2 src/checkpoint/compact.ts NEW ~30L (shouldCompact 75% placeholder)
  ├─ T4.3 src/checkpoint/resume.ts NEW ~60L (runResume + cwd guard)
  ├─ T4.4 src/cli/resume.ts NEW ~40L + src/cli.ts MODIFY +2L (11 → 12 subcommand)
  └─ T4.5 tests/checkpoint/sigint.test.ts + compact.test.ts + tests/cli/resume.test.ts NEW ~230L (16 fixture)
       ↓
Wave 5 — e2e dogfood + ship + v0.3.0 alpha.1 close
  ├─ T5.1 tests/integration/phase-3.1-e2e.test.ts NEW ~80L (SIGINT → resume → SDK redirect mock)
  ├─ T5.2 docs/adr/0014-checkpoint-engine-resume-compact.md finalize 9 章节
  ├─ T5.3 .planning/STATE.md + RETROSPECTIVE.md + ROADMAP.md 续编 Phase 3.1 SHIPPED
  ├─ T5.4 A7 守恒 verify (`git diff adr-0013-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-3]-*.md | wc -l == 0`)
  ├─ T5.5 Phase 3.1 dogfood — real SIGINT → harnessed resume → /gsd-execute-phase 3.1 cycle complete one ralph-loop iter (acceptance ROADMAP "human-interrupted session → resume from 03 phase")
  └─ T5.6 baseline tag adr-0014-accepted + milestone tag v0.3.0-alpha.1-checkpoint push
```

**Purpose**: R7.2 (checkpoint 分层 < 1k token + archive 完整) + R7.3 (`harnessed resume` 人为中断 session 续跑不丢上下文) + 4 项 W0 backlog cleanup + Phase 2.2 T4.4 closure infra 1 milestone 闲置后激活 + v0.3.0 milestone 第 1 phase ship。

**Output**: 6 Wave × ~28 atomic task (per task_plan.md) + 单 ADR 0014 errata 9 章节 + `adr-0014-accepted` baseline tag + `v0.3.0-alpha.1-checkpoint` milestone tag。

> **R2 critical findings absorbed** (3 项): (1) ralphLoop.ts L43 + engine.ts L182 dead-wiring 实际工作量 ~30L NOT KICKOFF "20-30L" (RESEARCH § 1.5 verified +5-10L)；(2) checkpoint schema 必加 `cwd` field per RESEARCH § 1.3 cwd 匹配陷阱 critical constraint (resume cwd mismatch → SDK 静默返回 fresh session, 必须 warn user)；(3) W0.1 source-of-truth: AUDIT.md actuals (doctor.ts 215L + dashboard.mjs 610L) NOT KICKOFF stale (run-plan-checker.mjs / plan-checker-quant.test.ts).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phase-3.1/3.1-KICKOFF.md
@.planning/phase-3.1/3.1-CONTEXT.md
@.planning/phase-3.1/PATTERNS.md
@.planning/phase-3.1/RESEARCH.md
@.planning/phase-3.1/task_plan.md
@.planning/v0.2.0-MILESTONE-AUDIT.md
@.planning/RETROSPECTIVE.md

# Frozen interface contracts (本 phase 消费或激活)
@src/types/schemaVersion.ts
@src/routing/engine.ts
@src/routing/lib/ralphLoop.ts
@src/routing/lib/sdkSpawn.ts
@src/cli.ts
@src/cli/doctor.ts
@src/workflow/loadPhases.ts
@src/workflow/schema/phases.ts
@src/manifest/schema/spec.ts
@scripts/dashboard.mjs

# Sister precedent (format gold-standard)
@.planning/phase-2.4/PLAN.md
@.planning/phase-2.4/task_plan.md
@.planning/phase-2.4/2.4-CONTEXT.md

# External docs (D-04 critical)
# code.claude.com/docs/en/agent-sdk/sessions § "Capture the session ID" + "Resume by ID" + "Resume across hosts" Tip block
# context7 /anthropics/claude-agent-sdk-demos llms.txt § "Multi-Turn Conversations with Session Resume"
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From src/types/schemaVersion.ts:
```typescript
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
  // Phase 3.1 ADD: currentWorkflow: 'harnessed.current-workflow.v1'
} as const

export const SchemaVersionLiteral = Type.Union([
  Type.Literal(SCHEMA_VERSIONS.routingSnapshot),
  // ... 7 existing literals ...
  // Phase 3.1 ADD: Type.Literal(SCHEMA_VERSIONS.currentWorkflow)
])

export function branchOnSchemaVersion<T>(
  v: string,
  handlers: { v1: () => T; unknown: () => T }
): T
```

From src/routing/lib/sdkSpawn.ts (T4.4 closure infra ready, ZERO-LINE change per PATTERNS § 1 #13):
```typescript
export interface SdkSpawnOpts {
  expertName: string
  resumeSessionId?: string                          // SDK options.resume (CD-4 closure-ready)
  onSessionId?: (id: string) => void                // SDK system:init session_id callback (T4.4 hook)
}
// L66-69 实装 already:
//   if (msg.type === 'system' && msg.subtype === 'init') opts.onSessionId?.(msg.session_id)
```

From src/routing/lib/ralphLoop.ts (DEAD CODE — L43 + L45 必须激活 per RESEARCH § 1.5):
```typescript
export async function ralphLoopWrap(
  spawn: (resumeSessionId?: string) => Promise<string>,
  maxIter: number,
): Promise<string> {
  let last = ''
  let sessionId: string | undefined         // ← L43 dead var (Phase 3.1 必须激活)
  for (let i = 0; i < maxIter; i++) {
    last = await spawn(sessionId)           // ← L45 always passes undefined (Phase 3.1 必须捕获后复用)
    if (isComplete(last)) return last
  }
  throw new MaxIterationsExceededError(maxIter)
}
```

From src/routing/engine.ts L171-182 (capturedSessionId VOID — placeholder 删 + engineHook wedge call 加 per W-01 + W-04 orchestrator):
```typescript
// Phase 3.1 W-04 orchestrator fix path (a): phaseId via TaskContext schema (no `as any` cast).
// Phase 3.1 W-01 orchestrator PRIMARY: engineHook.ts extracted ≤50L; engine.ts wedge.
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'

let capturedSessionId: string | undefined
const wrappedSpawn = async (resumeSessionId?: string, onSessionIdInner?: (id: string) => void): Promise<string> =>
  userSpawn
    ? userSpawn(agentDef)                            // userSpawn = fresh-session-only (B-02 documented; no session_id capture by design)
    : defaultSpawn(agentDef, {
        expertName,
        ...(resumeSessionId ? { resumeSessionId } : {}),
        onSessionId: (id) => {
          capturedSessionId = id
          onSessionIdInner?.(id)                     // ← propagate to ralphLoop iter 2+ retry capture
        },
      })
// L182 `void capturedSessionId` — REMOVED (Phase 3.1 首消费者 + W-01 wedge)

const phaseId = task.phaseId ?? 'unknown'           // ← W-04 task.phaseId (no `as any`)
await activatePhase(phaseId)                         // ← W-01 hook call
try {
  const result = await ralphLoopWrap(wrappedSpawn, maxIter)
  await completePhase({ phaseId, sessionId: capturedSessionId, status: 'complete' })  // ← W-01 hook call
  return { ok: true, result, matchedRule: matched }
}
```

From src/cli.ts L1-37 (11 → 12 subcommand register pattern):
```typescript
// existing 11 registers: install / install-base / research / execute-task /
// manifest-add / doctor / audit / rollback / status / backup-list / gc
// Phase 3.1 ADD (12th): import { registerResume } from './cli/resume.js'; registerResume(program)
```

From src/cli/doctor.ts L136-174 (sister --json flag pattern for resume.ts):
```typescript
program
  .command('doctor')
  .description(...)
  .option('--json', 'output JSON instead of human-readable')
  .action(async (opts: { json?: boolean }) => {
    // ... checks ...
    if (opts.json) {
      console.log(JSON.stringify({ checks: results, summary: ... }, null, 2))
    }
    process.exit(hasFail ? 1 : 0)
  })
```

From src/workflow/schema/phases.ts (TypeBox + Static<typeof> pattern sister for schema/checkpoint.v1.ts):
```typescript
export const SomeSchema = Type.Object({
  schemaVersion: Type.Literal(SCHEMA_VERSIONS.someName),
  // ...fields...
}, { additionalProperties: false })
export type SomeSchemaType = Static<typeof SomeSchema>
```

From src/workflow/loadPhases.ts L23-30 (Value.Check validate pattern sister for template.ts/state.ts):
```typescript
if (!Value.Check(SomeSchema, parsed)) {
  throw new ValidationError(
    [...Value.Errors(SomeSchema, parsed)].map(e => e.message).join('; ')
  )
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task: Wave 0 — Backlog 4 项 absorb + test dirs setup (5 sub-tasks parallel)</name>
  <files>
    .planning/v0.2.0-MILESTONE-AUDIT.md (W0.1 § 0.5 ~10L),
    .planning/RETROSPECTIVE.md (W0.2 Advisory Absorb Path ~15L),
    .github/workflows/ci.yml (W0.3 README completeness check ~10L bash),
    .planning/phase-3.1/W0-T5-verify.md (W0.4 NEW ~10L verify report),
    tests/checkpoint/ + tests/cli/ + tests/integration/ (mkdir -p)
  </files>
  <action>
    Per task_plan.md T0.1-T0.5 (5 sub-tasks parallel, sister Phase 2.4 W0 cluster):

    **T0.1 W0.1 AUDIT.md § 0.5**: Add `## § 0.5 Line Budget Deviations Accepted` section after AUDIT.md L36 `tech_debt:` block + before L37 `---`. **CRITICAL — use AUDIT.md actuals, NOT KICKOFF § 4 stale** (per RESEARCH § 10 校对源 verified):
    ```markdown
    ## § 0.5 Line Budget Deviations Accepted

    > Karpathy 透明性纪律: per-file LOC > hard limit 但合理性论证后 accept; sister Phase 2.4 R-4 pattern.

    | File | LOC | Hard Limit | Tolerance | Rationale |
    |------|-----|-----------|-----------|-----------|
    | `src/cli/doctor.ts` | 215 | 200 | +7.5% | ADR 0013 § 1; 5 check + --json + 3 status enum 不可再 split (helper 已抽 origin-check.ts) |
    | `scripts/dashboard.mjs` | 610 | 650 default | (内) | B-26 dev tool 软 limit; SKIP proactive split 制造 churn (Phase 2.4 W3 T3.4 决断) |
    ```

    **T0.2 W0.2 RETROSPECTIVE.md Advisory Absorb Path**: Per RESEARCH § 10 W0.2 verbatim insertion at RETROSPECTIVE.md L30 (after M1 entry, before Phase 2.4 milestone retro section L34). Section: `### Advisory Absorb Path — handoff intel "独立 commit" 草案被合理 absorb (Phase 2.4)` with timeline bullets (handoff intel L482 / executor decision Phase 2.4 W3 cf00d17/008f9ab / post-ship lesson).

    **T0.3 W0.3 ci.yml README completeness check**: Add step to `.github/workflows/ci.yml` after existing README counter integrity gate step (find by `grep -n "README counter integrity"`). New step ~10L bash (sister Phase 2.4 D-03 counter gate consistency + completeness 互补 per RESEARCH § 10 W0.3 verified regex):
    ```yaml
    # WARN-ONLY round 1 per orchestrator B-01 decision (sister Phase 2.1 transparency CI warn-only + Phase 2.3 perf nightly cron advisory).
    # ENFORCE flip (continue-on-error → false + ::error::) → Phase 3.2 W0 prereq after STATE.md/README.md format normalization.
    - name: README completeness check (Phase 3.1 W0.3 — STATE.md vs README per-phase shipped count) [WARN-ONLY round 1]
      continue-on-error: true  # ENFORCE=false round 1
      run: |
        STATE_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
        README_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md)
        echo "STATE.md per-phase shipped count: $STATE_COUNT"
        echo "README.md per-phase shipped count: $README_COUNT"
        if [ "$STATE_COUNT" -ne "$README_COUNT" ]; then
          echo "::warning::README completeness drift (advisory, warn-only round 1): STATE=$STATE_COUNT README=$README_COUNT — fix in Phase 3.2 W0 prereq before ENFORCE flip"
        else
          echo "README completeness OK: STATE=$STATE_COUNT README=$README_COUNT"
        fi
    ```
    B-04 Win shell:bash sister pattern + **B-01 orchestrator warn-only round 1 absorb** (sister Phase 2.1 transparency anti-pattern CI gate warn-only + Phase 2.3 perf gate moved to nightly cron advisory).

    **T0.4 W0.4 phase-2.4 self-check verify**: NEW `.planning/phase-3.1/W0-T5-verify.md` ~10L — capture `node scripts/run-plan-checker.mjs .planning/phase-2.4/` real-run output: exit code + per-file `{verdict, dimensions_passed, scores}` JSON lines. If verdict BLOCKER → add investigate cell + fix in same file. Per KICKOFF § 4 T5 + RESEARCH § 10 W0.4.

    **T0.5 test dirs setup**: `mkdir -p tests/checkpoint tests/cli tests/integration` — Wave 1+ NEW test files prerequisite (sister Phase 2.4 W0 T0.5 W1 plan-check fix mkdir pattern).

    Run `pnpm exec biome check --write` before commit (project memory `feedback_biome-preempt.md`).
  </action>
  <verify>
    <automated>
      grep -E "Line Budget Deviations Accepted" .planning/v0.2.0-MILESTONE-AUDIT.md &amp;&amp;
      grep -E "doctor\.ts.*215" .planning/v0.2.0-MILESTONE-AUDIT.md &amp;&amp;
      grep -E "dashboard\.mjs.*610" .planning/v0.2.0-MILESTONE-AUDIT.md &amp;&amp;
      grep -E "Advisory Absorb Path" .planning/RETROSPECTIVE.md &amp;&amp;
      grep -E "cf00d17|008f9ab" .planning/RETROSPECTIVE.md &amp;&amp;
      grep -E "README completeness check" .github/workflows/ci.yml &amp;&amp;
      test -f .planning/phase-3.1/W0-T5-verify.md &amp;&amp;
      test -d tests/checkpoint &amp;&amp; test -d tests/cli &amp;&amp; test -d tests/integration
    </automated>
  </verify>
  <done>
    W0.1 AUDIT § 0.5 节存在含 AUDIT actuals (NOT KICKOFF stale);
    W0.2 RETROSPECTIVE Advisory Absorb Path 节存在引 cf00d17/008f9ab;
    W0.3 ci.yml README completeness check step 存在 (B-04 bash);
    W0.4 W0-T5-verify.md 存在含 run-plan-checker.mjs real-run outcome;
    test dirs 3 个存在 (Wave 1+ NEW test files prerequisite ready).
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task: Wave 1 — schema + state machine (8-surface + 3-state)</name>
  <files>
    src/types/schemaVersion.ts (MODIFY +4L 8th surface),
    src/checkpoint/schema/checkpoint.v1.ts (NEW ~50L),
    src/checkpoint/schema/currentWorkflow.v1.ts (NEW ~30L),
    src/checkpoint/schema/index.ts (NEW ~5L barrel),
    src/checkpoint/state.ts (NEW ~60L 3-state),
    tests/checkpoint/schema.test.ts (NEW ~80L),
    tests/checkpoint/state.test.ts (NEW ~80L)
  </files>
  <behavior>
    - Test 1: SCHEMA_VERSIONS exports `currentWorkflow: 'harnessed.current-workflow.v1'` (grep gate ≥ 8 references)
    - Test 2: branchOnSchemaVersion('harnessed.checkpoint.v1', { v1, unknown }) calls v1 handler
    - Test 3: branchOnSchemaVersion('harnessed.current-workflow.v1', { v1, unknown }) calls v1 handler
    - Test 4: Value.Check(CheckpointV1, { complete valid object }) returns true
    - Test 5: Value.Check(CheckpointV1, { missing required field }) returns false
    - Test 6: Value.Check(CurrentWorkflowV1, { status: 'active', ... }) returns true; status not in 3-enum returns false
    - Test 7: activate(phase, checkpointPath) writes JSON with status='active' + started_at ISO + last_checkpoint_path
    - Test 8: pause() reads current → writes status='paused' + paused_at ISO (started_at preserved)
    - Test 9: complete() reads current → writes status='complete' + completed_at ISO
    - Test 10: readCurrentWorkflow returns null on schema drift (corrupt JSON or schema mismatch)
    - Test 11: writeCurrentWorkflow throws if Value.Check fails (write-side self-validate sister loadPhases pattern)
    - Test 12: state.ts ≤ 80L hard limit verify (`wc -l src/checkpoint/state.ts`)
    - Test 13: schema/*.ts each ≤ 80L hard limit verify
  </behavior>
  <action>
    Per task_plan.md T1.1-T1.4:

    **T1.1 src/types/schemaVersion.ts MODIFY +4L**: Add 8th surface (sister Phase 2.2 CD-5 pattern verbatim):
    ```typescript
    export const SCHEMA_VERSIONS = {
      // ... 7 existing ...
      checkpoint: 'harnessed.checkpoint.v1',
      currentWorkflow: 'harnessed.current-workflow.v1',  // ← Phase 3.1 ADD 8th surface
    } as const

    export const SchemaVersionLiteral = Type.Union([
      // ... 7 existing literals ...
      Type.Literal(SCHEMA_VERSIONS.currentWorkflow),     // ← ADD
    ])
    ```
    Update JSDoc comment block L13-20 to list 8th surface: `current-workflow : workflow state machine (active / paused / complete)`. Grep gate ≥ 7 → ≥ 8 `harnessed.\w+.v1` references (sister Phase 2.2 W2 acceptance auto-bump).

    **T1.2 src/checkpoint/schema/checkpoint.v1.ts NEW ~50L**: Verbatim PATTERNS § 2.1 with cwd field added per RESEARCH § 1.3:
    ```typescript
    import { type Static, Type } from '@sinclair/typebox'
    import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

    export const CheckpointStatus = Type.Union([
      Type.Literal('active'),
      Type.Literal('paused'),
      Type.Literal('complete'),
    ])

    export const CheckpointV1 = Type.Object({
      schemaVersion: Type.Literal(SCHEMA_VERSIONS.checkpoint),
      phase: Type.String({ minLength: 1 }),
      status: CheckpointStatus,
      last_task: Type.String(),
      key_decisions: Type.Array(Type.String()),
      canonical_refs: Type.Array(Type.String()),
      session_id: Type.Optional(Type.String()),       // D-04 WIRE-IN optional
      cwd: Type.String({ minLength: 1 }),             // § 1.3 cwd 匹配陷阱 mitigation
      timestamp: Type.String({ format: 'date-time' }),
      archive_path: Type.String({ minLength: 1 }),
    }, { additionalProperties: false })
    export type CheckpointV1Type = Static<typeof CheckpointV1>
    ```

    **T1.2b src/checkpoint/schema/currentWorkflow.v1.ts NEW ~30L**: Per D-02 hint:
    ```typescript
    import { type Static, Type } from '@sinclair/typebox'
    import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

    export const WorkflowStatus = Type.Union([
      Type.Literal('active'),
      Type.Literal('paused'),
      Type.Literal('complete'),
    ])

    export const CurrentWorkflowV1 = Type.Object({
      schemaVersion: Type.Literal(SCHEMA_VERSIONS.currentWorkflow),
      phase: Type.String({ minLength: 1 }),
      status: WorkflowStatus,
      last_checkpoint_path: Type.String(),
      started_at: Type.String({ format: 'date-time' }),
      paused_at: Type.Optional(Type.String({ format: 'date-time' })),
      completed_at: Type.Optional(Type.String({ format: 'date-time' })),
    }, { additionalProperties: false })
    export type CurrentWorkflowV1Type = Static<typeof CurrentWorkflowV1>
    ```

    **T1.2c src/checkpoint/schema/index.ts NEW ~5L barrel**:
    ```typescript
    export * from './checkpoint.v1.js'
    export * from './currentWorkflow.v1.js'
    ```

    **T1.3 src/checkpoint/state.ts NEW ~60L**: Verbatim PATTERNS § 2.3 with Value.Check validate write-side (sister loadPhases L23-30):
    ```typescript
    import { readFile, writeFile, mkdir } from 'node:fs/promises'
    import { dirname } from 'node:path'
    import { Value } from '@sinclair/typebox/value'
    import { CurrentWorkflowV1, type CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'
    import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'

    const STATE_PATH = '.harnessed/current-workflow.json'

    export async function readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null> {
      try {
        const raw = await readFile(STATE_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        if (!Value.Check(CurrentWorkflowV1, parsed)) return null
        return parsed
      } catch { return null }
    }

    export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
      if (!Value.Check(CurrentWorkflowV1, s)) {
        throw new Error(`current-workflow schema validation failed: ${[...Value.Errors(CurrentWorkflowV1, s)].map(e => e.message).join('; ')}`)
      }
      await mkdir(dirname(STATE_PATH), { recursive: true })
      await writeFile(STATE_PATH, JSON.stringify(s, null, 2))
    }

    export async function activate(phase: string, checkpointPath: string): Promise<void> {
      await writeCurrentWorkflow({
        schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
        phase, status: 'active',
        last_checkpoint_path: checkpointPath,
        started_at: new Date().toISOString(),
      })
    }

    export async function pause(): Promise<void> {
      const s = await readCurrentWorkflow(); if (!s) return
      await writeCurrentWorkflow({ ...s, status: 'paused', paused_at: new Date().toISOString() })
    }

    export async function complete(): Promise<void> {
      const s = await readCurrentWorkflow(); if (!s) return
      await writeCurrentWorkflow({ ...s, status: 'complete', completed_at: new Date().toISOString() })
    }
    ```

    **T1.4 tests/checkpoint/schema.test.ts + state.test.ts NEW ~160L**: 13 fixture per behavior block. Use vitest `vi.mock('node:fs/promises', ...)` sister Phase 2.2 sdk-spawn.test.ts L27-34 pattern for state.test.ts; schema.test.ts uses Value.Check direct without mocks. Run `pnpm exec biome check --write` before commit.
  </action>
  <verify>
    <automated>
      pnpm typecheck &amp;&amp;
      grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts | awk '$1 &gt;= 8' &amp;&amp;
      grep -E "currentWorkflow: 'harnessed\\.current-workflow\\.v1'" src/types/schemaVersion.ts &amp;&amp;
      test $(wc -l &lt; src/checkpoint/state.ts) -le 80 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/schema/checkpoint.v1.ts) -le 80 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/schema/currentWorkflow.v1.ts) -le 80 &amp;&amp;
      pnpm test -- --run tests/checkpoint/schema.test.ts tests/checkpoint/state.test.ts
    </automated>
  </verify>
  <done>
    schemaVersion 7 → 8 surface registered (grep ≥ 8 `harnessed.\w+.v1`);
    branchOnSchemaVersion handles checkpoint.v1 + current-workflow.v1;
    CheckpointV1 + CurrentWorkflowV1 TypeBox schemas valid per D-01 + D-02 lock + cwd field per § 1.3;
    state.ts activate/pause/complete 3-state transition tests 13 fixture all pass;
    Karpathy hard limit ≤ 80L per file verified.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task: Wave 2 — template + archive + 1k token budget enforcement (D-01)</name>
  <files>
    src/checkpoint/template.ts (NEW ~80L),
    src/checkpoint/archive.ts (NEW ~40L),
    src/checkpoint/index.ts (NEW ~10L barrel),
    tests/checkpoint/template.test.ts (NEW ~80L),
    tests/checkpoint/archive.test.ts (NEW ~60L)
  </files>
  <behavior>
    - Test 1: writeCheckpoint({valid CheckpointV1 typical 400-char}) writes JSON to `.harnessed/checkpoints/<phase>.json` + returns {path}
    - Test 2: writeCheckpoint() Value.Check fails on invalid input → throws Error with details
    - Test 3: estimateTokens({checkpoint}) returns Math.ceil(Buffer.byteLength(JSON.stringify(c), 'utf8') / 4)
    - Test 4: enforceBudget({last_task: 'x'.repeat(2000)}) truncates last_task to 200 char then re-checks (RESEARCH § 3.3)
    - Test 5: enforceBudget({last_task short + key_decisions: 100 entries}) slices key_decisions to 3 (2nd-level truncate)
    - Test 6: enforceBudget({truly oversized}) throws CheckpointTooLargeError (fail-loud)
    - Test 7: writeArchive('3.1', { complete raw turns }) writes to `.harnessed/archive/phase-3.1/raw-<ISO-ts>.json`
    - Test 8: writeArchive() creates parent dir recursive (mkdir { recursive: true })
    - Test 9: writeArchive(1MB rawTurns) succeeds (NOT subject to 1k token budget per R7.2 lock)
    - Test 10: src/checkpoint/index.ts barrel exports template + state + archive + schema/{checkpoint.v1, currentWorkflow.v1}
  </behavior>
  <action>
    Per task_plan.md T2.1-T2.4:

    **T2.1 src/checkpoint/template.ts NEW ~80L**: Verbatim PATTERNS § 2.2 with enforceBudget truncate fallback per RESEARCH § 3.3 truncate ordering (last_task → key_decisions slice 3 → throw):
    ```typescript
    import { mkdir, writeFile } from 'node:fs/promises'
    import { dirname, join } from 'node:path'
    import { Value } from '@sinclair/typebox/value'
    import { CheckpointV1, type CheckpointV1Type } from './schema/checkpoint.v1.js'

    export class CheckpointTooLargeError extends Error {
      constructor(public estimatedTokens: number) {
        super(`checkpoint exceeds 1k token budget (estimated ${estimatedTokens})`)
        this.name = 'CheckpointTooLargeError'
      }
    }

    export function estimateTokens(c: CheckpointV1Type): number {
      return Math.ceil(Buffer.byteLength(JSON.stringify(c), 'utf8') / 4)
    }

    export function enforceBudget(c: CheckpointV1Type, maxTokens = 1000): CheckpointV1Type {
      if (estimateTokens(c) <= maxTokens) return c
      // 1st-level: last_task truncate 200 char (RESEARCH § 3.3 ordering)
      let t: CheckpointV1Type = { ...c, last_task: c.last_task.slice(0, 200) }
      if (estimateTokens(t) <= maxTokens) return t
      // 2nd-level: key_decisions slice 3
      t = { ...t, key_decisions: t.key_decisions.slice(0, 3) }
      if (estimateTokens(t) <= maxTokens) return t
      throw new CheckpointTooLargeError(estimateTokens(t))
    }

    export async function writeCheckpoint(c: CheckpointV1Type): Promise<{ path: string }> {
      if (!Value.Check(CheckpointV1, c)) {
        throw new Error(`checkpoint schema validation failed: ${[...Value.Errors(CheckpointV1, c)].map((e) => e.message).join('; ')}`)
      }
      const enforced = enforceBudget(c)
      const path = join('.harnessed', 'checkpoints', `${enforced.phase}.json`)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, JSON.stringify(enforced, null, 2))
      return { path }
    }
    ```

    **T2.2 src/checkpoint/archive.ts NEW ~40L**: Per PATTERNS § 2.2 archive section:
    ```typescript
    import { mkdir, writeFile } from 'node:fs/promises'
    import { dirname, join } from 'node:path'

    export async function writeArchive(phase: string, rawTurns: unknown): Promise<{ path: string }> {
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const path = join('.harnessed', 'archive', `phase-${phase}`, `raw-${ts}.json`)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, JSON.stringify(rawTurns, null, 2))
      return { path }
    }
    ```

    **T2.3 src/checkpoint/index.ts NEW ~10L barrel** (sister manifest schema modular pattern per RESEARCH § 4.3):
    ```typescript
    export * from './schema/index.js'
    export * from './template.js'
    export * from './state.js'
    export * from './archive.js'
    ```

    **T2.4 tests/checkpoint/template.test.ts + archive.test.ts NEW ~140L**: 9 fixture per behavior; use vitest `vi.mock('node:fs/promises', ...)` for filesystem isolation; assert byte-size estimate boundary cases (RESEARCH § 3.2 typical 350-450 token ≤ 1000 充裕). Run `pnpm exec biome check --write` before commit.
  </action>
  <verify>
    <automated>
      pnpm typecheck &amp;&amp;
      test $(wc -l &lt; src/checkpoint/template.ts) -le 80 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/archive.ts) -le 40 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/index.ts) -le 10 &amp;&amp;
      grep -q "CheckpointTooLargeError" src/checkpoint/template.ts &amp;&amp;
      grep -q "Buffer.byteLength" src/checkpoint/template.ts &amp;&amp;
      grep -q "1000" src/checkpoint/template.ts &amp;&amp;
      pnpm test -- --run tests/checkpoint/template.test.ts tests/checkpoint/archive.test.ts
    </automated>
  </verify>
  <done>
    writeCheckpoint Value.Check validate + estimateTokens Heuristic + enforceBudget 2-level truncate fallback + throw CheckpointTooLargeError;
    writeArchive 完整 raw turn (NOT subject to budget per R7.2);
    barrel index.ts exports all 6 module surfaces;
    9 fixture pass (5 template + 4 archive);
    Karpathy hard limit ≤ 80L per file verified.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task: Wave 3 — T4.4 closure infra dead-wiring 激活 (ralphLoop + engine.ts)</name>
  <files>
    src/routing/lib/ralphLoop.ts (MODIFY +5L — sessionId capture between iterations),
    src/routing/agentDefinition.ts (MODIFY +3L — TaskContext add phaseId field per W-04 orchestrator fix path (a)),
    src/checkpoint/engineHook.ts (NEW ≤50L — W-01 orchestrator PRIMARY extract, analog sdkReconcile.ts pattern),
    src/routing/engine.ts (MODIFY wedge — void delete + engineHook import + hook calls + wrappedSpawn signature extend; FINAL ≤200L Karpathy hard limit clean),
    tests/checkpoint/sdk-wire.test.ts (NEW ~140L 7 fixture mock SDK; +1 for B-02 userSpawn fallback fixture)
  </files>
  <behavior>
    - Test 1 (capture happy): SDK system:init session_id 'sess-abc' → onSessionId callback → engine capturedSessionId === 'sess-abc'
    - Test 2 (capture-then-resume mid-loop): iter 1 captures sessionId → iter 2 spawn(sessionId='sess-abc') passes to SDK options.resume
    - Test 3 (no-session fallback): SDK never emits system:init session_id → checkpoint write {session_id: undefined} (Optional field omitted)
    - Test 4 (SDK reject session_id fresh fallback): SDK options.resume returns fresh session (silent) → fallback fresh session (RESEARCH § 1.4 silent error mode)
    - Test 5 (checkpoint.write on success): ralphLoopWrap returns successfully → engine completePhase({status:'complete', sessionId: capturedSessionId}) called before EngineResult return (engineHook.ts PRIMARY per W-01 orchestrator)
    - Test 6 (engineHook PRIMARY verified): assert sessionId reaches checkpoint via engineHook.completePhase path (W-01 orchestrator PRIMARY extract; engine.ts wedge calls hook with phaseId from TaskContext)
    - **Test 7 (B-02 userSpawn fallback fixture)**: userSpawn returning fixed agentDef → capturedSessionId remains undefined + completePhase ctx.sessionId === undefined + checkpoint.session_id field NOT set + resume.ts hits fresh-session reload path (no SDK redirect; resumeHint includes "fresh session — context reloaded from checkpoint"). Documents userSpawn as fresh-session-only path per orchestrator B-02 fix path (b) YAGNI.
  </behavior>
  <action>
    Per task_plan.md T3.1-T3.3 + RESEARCH § 1.5 dead-wiring activation (~30L cross 2 files, KICKOFF "20-30L" 偏低 5-10L per R2 critical finding):

    **T3.1 src/routing/lib/ralphLoop.ts MODIFY +5L**: Activate L43 dead `sessionId` variable. Two options — pick (a) callback approach for cleanest separation:

    Option (a) — extend spawn callback signature with onSessionId out-param (preferred):
    ```typescript
    // Phase 3.1 — sessionId activation (Phase 2.2 dead-wiring 首消费者).
    export async function ralphLoopWrap(
      spawn: (resumeSessionId?: string, onSessionId?: (id: string) => void) => Promise<string>,
      maxIter: number,
    ): Promise<string> {
      let last = ''
      let sessionId: string | undefined
      for (let i = 0; i < maxIter; i++) {
        last = await spawn(sessionId, (id) => { sessionId = id })  // ← capture for next iter
        if (isComplete(last)) return last
      }
      throw new MaxIterationsExceededError(maxIter)
    }
    ```

    If breaking the spawn signature is too disruptive, use Option (b) — return tuple/object from spawn instead. Decide based on engine.ts ergonomics in T3.2. Document choice in inline comment with rationale.

    **T3.2 W-01 + W-04 orchestrator coordinated rewrite — PRIMARY extract + delete `as any`**:

    **Step 1 (NEW src/checkpoint/engineHook.ts ≤50L — W-01 PRIMARY extract, analog sdkReconcile.ts ≤56L Phase 2.2 helper extract pattern)**:
    ```typescript
    // src/checkpoint/engineHook.ts — Phase 3.1 W-01 orchestrator PRIMARY.
    import { writeCheckpoint } from './template.js'
    import { activate, complete as completeWorkflow } from './state.js'
    import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'

    export interface EngineCheckpointHookCtx {
      phaseId: string
      sessionId?: string
      status: 'active' | 'complete'
      lastTask?: string
      keyDecisions?: string[]
      canonicalRefs?: string[]
    }

    export async function activatePhase(phaseId: string): Promise<{ checkpointPath: string }> {
      const checkpointPath = `.harnessed/checkpoints/${phaseId}.json`
      await activate(phaseId, checkpointPath)
      return { checkpointPath }
    }

    export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> {
      if (ctx.phaseId === 'unknown') {
        console.error('[harnessed] WARN engineHook: phaseId="unknown" — checkpoint paths fall back to .harnessed/checkpoints/unknown.json (Karpathy fail-loud non-blocking)')
      }
      await writeCheckpoint({
        schemaVersion: SCHEMA_VERSIONS.checkpoint,
        phase: ctx.phaseId, status: 'complete',
        last_task: ctx.lastTask ?? 'engine.runRouting complete',
        key_decisions: ctx.keyDecisions ?? [],
        canonical_refs: ctx.canonicalRefs ?? [],
        ...(ctx.sessionId ? { session_id: ctx.sessionId } : {}),
        cwd: process.cwd(),
        timestamp: new Date().toISOString(),
        archive_path: `.harnessed/archive/phase-${ctx.phaseId}/`,
      })
      await completeWorkflow()
    }
    ```

    **Step 2 (src/routing/agentDefinition.ts MODIFY +3L — W-04 fix path (a) TaskContext.phaseId field)**:
    ```typescript
    /** User task context (1:1 contract § 3). */
    export interface TaskContext {
      task: string
      override_keywords?: string[]
      task_type?: string
      cwd?: string
      /** Phase identifier (e.g., "3.1") for checkpoint paths; falls back to "unknown" if not provided.
       *  Phase 3.1 W-04 orchestrator fix path (a) — eliminates `(matched?.decision as any)?.phase` cast (Karpathy "Surgical Changes" + type safety). */
      phaseId?: string
    }
    ```

    **Step 3 (src/routing/engine.ts wedge — keep ≤200L Karpathy hard limit clean)**:
    ```typescript
    // Phase 3.1 W-01 orchestrator wedge import (engineHook.ts PRIMARY extract).
    import { activatePhase, completePhase } from '../checkpoint/engineHook.js'

    // L171-181: wrappedSpawn signature extend onSessionIdInner per T3.1 propagate.
    let capturedSessionId: string | undefined
    const wrappedSpawn = async (resumeSessionId?: string, onSessionIdInner?: (id: string) => void): Promise<string> =>
      userSpawn
        ? userSpawn(agentDef)              // userSpawn fresh-session-only path (B-02 documented no session_id capture)
        : defaultSpawn(agentDef, {
            expertName,
            ...(resumeSessionId ? { resumeSessionId } : {}),
            onSessionId: (id) => {
              capturedSessionId = id
              onSessionIdInner?.(id)       // ← propagate to ralphLoop iter 2+ retry capture
            },
          })
    // L182 `void capturedSessionId` — REMOVED (Phase 3.1 首消费者 + W-01 wedge)

    // W-04 orchestrator fix path (a) — phaseId via task.phaseId (TaskContext field; no `as any` cast).
    const phaseId = task.phaseId ?? 'unknown'
    await activatePhase(phaseId)                                         // ← W-01 hook call
    try {
      const result = await ralphLoopWrap(wrappedSpawn, maxIter)
      await completePhase({ phaseId, sessionId: capturedSessionId, status: 'complete' })  // ← W-01 hook call
      return { ok: true, result, matchedRule: matched }
    } catch (error) { /* existing error branches unchanged */ }
    ```

    **Engine.ts wc gate**: FINAL ≤ 200L Karpathy hard limit clean (W-01 orchestrator promote PRIMARY — no B-03 5% tolerance needed; engineHook.ts is PRIMARY extraction NOT fallback split). engineHook.ts ≤ 50L hard limit.

    **userSpawn fresh-session-only documentation (B-02 orchestrator fix path (b))**: Add JSDoc comment above wrappedSpawn signature explaining userSpawn branch is fresh-session-only path with no session_id capture by design (userSpawn signature `(agentDef) => Promise<string>` has no onSessionId out-param; YAGNI per <5% niche + breaking change cost > value). DO NOT extend userSpawn public API. Downstream consumers: when userSpawn returns, completePhase ctx.sessionId === undefined → checkpoint.session_id field NOT set → resume.ts hits fresh-session reload path (no SDK redirect; D-04 fallback lock).

    **T3.3 tests/checkpoint/sdk-wire.test.ts NEW ~100L**: 6 fixture, sister sdk-spawn.test.ts L157-198 `vi.mock('@anthropic-ai/claude-agent-sdk', ...)` + `nextMessages = [{ type: 'system', subtype: 'init', session_id: 'sess-abc' }, { type: 'result', ... }]` pattern. Verify capturedSessionId end-to-end through ralphLoop → engine → checkpoint.write({session_id}). Run `pnpm exec biome check --write` before commit.
  </action>
  <verify>
    <automated>
      pnpm typecheck &amp;&amp;
      ! grep -q "void capturedSessionId" src/routing/engine.ts &amp;&amp;
      ! grep -q "as any" src/routing/engine.ts &amp;&amp;
      grep -qE "engineHook|activatePhase|completePhase" src/routing/engine.ts &amp;&amp;
      grep -q "task.phaseId" src/routing/engine.ts &amp;&amp;
      grep -q "phaseId" src/routing/agentDefinition.ts &amp;&amp;
      grep -q "sessionId = id" src/routing/lib/ralphLoop.ts &amp;&amp;
      test $(wc -l &lt; src/routing/engine.ts) -le 200 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/engineHook.ts) -le 50 &amp;&amp;
      pnpm test -- --run tests/checkpoint/sdk-wire.test.ts tests/checkpoint/engineHook.test.ts
    </automated>
  </verify>
  <done>
    Phase 2.2 T4.4 closure infra 三件套 dead-wiring 全 激活: ralphLoop.ts sessionId 第 1 轮 capture + iter 2+ 复用 (no longer dead); engine.ts void placeholder 删 + engineHook.activatePhase 在 phase start + engineHook.completePhase 在 success path (W-01 orchestrator PRIMARY extract; analog sdkReconcile.ts Phase 2.2 helper pattern); TaskContext.phaseId field 加 (W-04 orchestrator fix path (a) — no `as any` cast); 7 fixture pass (capture happy / capture-then-resume / no-session fallback / SDK reject fresh / engineHook.completePhase success / engineHook PRIMARY verified / **B-02 userSpawn fallback fixture fresh-session-only**);
    **engine.ts ≤ 200L Karpathy hard limit clean** (W-01 orchestrator; no B-03 5% tolerance needed) + engineHook.ts ≤ 50L.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task: Wave 4 — SIGINT trap + harnessed resume CLI + compact placeholder</name>
  <files>
    src/checkpoint/sigintTrap.ts (NEW ~25L),
    src/checkpoint/compact.ts (NEW ~30L),
    src/checkpoint/resume.ts (NEW ~60L),
    src/cli/resume.ts (NEW ~40L),
    src/cli.ts (MODIFY +2L — 11 → 12 subcommand),
    tests/checkpoint/sigint.test.ts (NEW ~100L),
    tests/checkpoint/compact.test.ts (NEW ~40L),
    tests/cli/resume.test.ts (NEW ~90L)
  </files>
  <behavior>
    - Test 1 (SIGINT paused): process.emit('SIGINT') → state.json status='paused' + paused_at + checkpoint.json status='paused' + session_id captured + exit code 130
    - Test 2 (double SIGINT force quit): emit SIGINT twice → 2nd emit logs 'force quit (2nd Ctrl+C)' + immediate exit 130 (no hang)
    - Test 3 (no-active workflow): SIGINT with no current-workflow.json → exit 130 silent (no checkpoint attempt)
    - Test 4 (async write 30s timeout): mock fs.writeFile to hang 35s → setTimeout fires → console.error 'checkpoint write timeout' + exit 130
    - Test 5 (status=complete no-op): SIGINT after status='complete' → exit 0 silent (workflow ended)
    - Test 6 (shouldCompact threshold): shouldCompact(150_001, {contextWindow:200_000, thresholdPct:75}) === true; (149_999, ...) === false
    - Test 7 (shouldCompact custom override): shouldCompact(50_001, {contextWindow:100_000, thresholdPct:50}) === true
    - Test 8 (resume happy): current-workflow status='paused' + checkpoint exists → stdout 'phase: 3.1' + 'last_task: ...' + '→ in Claude Code: /gsd-execute-phase 3.1' + session_id hint + exit 0
    - Test 9 (resume no-current-workflow): no .harnessed/current-workflow.json → stderr 'no paused phase found' + exit 1
    - Test 10 (resume status=active): current-workflow status='active' → stderr 'workflow status is active not paused' + exit 1
    - Test 11 (resume checkpoint corrupt): current-workflow paused + checkpoint.json malformed → stderr 'checkpoint corrupt' + exit 1
    - Test 12 (resume cwd mismatch warn): checkpoint.cwd !== process.cwd() → stderr warn '⚠ checkpoint cwd ... ≠ current cwd ...' + exit 0 (warn but proceed)
    - Test 13 (resume --json schema): --json flag → stdout JSON {checkpoint: {...}, resume_hint: string}
    - Test 14 (resume session_id absent fallback hint): checkpoint.session_id undefined → hint '(fresh session — context reloaded from checkpoint)'
    - Test 15 (cli.ts 12 subcommands registered): grep `register(Install|InstallBase|Research|ExecuteTask|ManifestAdd|Doctor|Audit|Rollback|Status|BackupList|Gc|Resume)` count == 12
    - Test 16: each new file ≤ Karpathy hard limit (sigintTrap ≤ 25, compact ≤ 30, resume.ts ≤ 60, src/cli/resume.ts ≤ 40)
  </behavior>
  <action>
    Per task_plan.md T4.1-T4.5:

    **T4.1 src/checkpoint/sigintTrap.ts NEW ~25L**: Verbatim RESEARCH § 2.3 implementation template (Node native + isShuttingDown + 30s timeout fallback + Promise.all + exit 130):
    ```typescript
    import { writeCheckpoint } from './template.js'
    import { pause, readCurrentWorkflow } from './state.js'
    import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'

    let isShuttingDown = false

    export function registerSigintTrap(getActiveContext: () => { phase: string; sessionId?: string; lastTask: string } | null): void {
      process.on('SIGINT', () => {
        if (isShuttingDown) {
          console.error('\n[harnessed] force quit (2nd Ctrl+C) — checkpoint may be incomplete')
          process.exit(130)
        }
        isShuttingDown = true
        console.error('\n[harnessed] SIGINT — writing checkpoint (Ctrl+C again to force quit)...')
        const ctx = getActiveContext()
        if (!ctx) { process.exit(130); return }
        const timeout = setTimeout(() => {
          console.error('[harnessed] checkpoint write timeout — force exit')
          process.exit(130)
        }, 30000)
        Promise.all([
          writeCheckpoint({
            schemaVersion: SCHEMA_VERSIONS.checkpoint,
            phase: ctx.phase, status: 'paused',
            last_task: ctx.lastTask, key_decisions: [], canonical_refs: [],
            ...(ctx.sessionId ? { session_id: ctx.sessionId } : {}),
            cwd: process.cwd(), timestamp: new Date().toISOString(),
            archive_path: `.harnessed/archive/phase-${ctx.phase}/`,
          }),
          pause(),
        ])
          .then(() => { clearTimeout(timeout); console.error('[harnessed] checkpoint written. Run `harnessed resume` to continue.'); process.exit(130) })
          .catch((err) => { clearTimeout(timeout); console.error('[harnessed] checkpoint write failed:', err); process.exit(1) })
      })
    }
    ```

    **T4.2 src/checkpoint/compact.ts NEW ~30L**: Per RESEARCH § 7 推 75% threshold MVP placeholder:
    ```typescript
    export const DEFAULT_THRESHOLD_PCT = 75
    export const DEFAULT_CONTEXT_WINDOW = 200_000

    export interface CompactOpts { contextWindow?: number; thresholdPct?: number }

    export function shouldCompact(currentTokens: number, opts: CompactOpts = {}): boolean {
      const cw = opts.contextWindow ?? DEFAULT_CONTEXT_WINDOW
      const pct = opts.thresholdPct ?? DEFAULT_THRESHOLD_PCT
      return currentTokens >= (cw * pct / 100)
    }
    // Phase 3.1 MVP: shouldCompact only. `harnessed compact` subcommand 推 Phase 3.4.
    ```

    **T4.3 src/checkpoint/resume.ts NEW ~60L**: Verbatim RESEARCH § 5.2 with cwd guard (§ 1.3) + branchOnSchemaVersion validate (CD-5):
    ```typescript
    import { readFile } from 'node:fs/promises'
    import { Value } from '@sinclair/typebox/value'
    import { readCurrentWorkflow } from './state.js'
    import { CheckpointV1, type CheckpointV1Type } from './schema/checkpoint.v1.js'

    export type ResumeResult =
      | { status: 'no-paused-phase'; error: string }
      | { status: 'corrupt'; error: string; path: string }
      | { status: 'ok'; checkpoint: CheckpointV1Type; cwdWarn?: string; resumeHint: string }

    export async function runResume(): Promise<ResumeResult> {
      const current = await readCurrentWorkflow()
      if (!current) return { status: 'no-paused-phase', error: 'no .harnessed/current-workflow.json found' }
      if (current.status !== 'paused') return { status: 'no-paused-phase', error: `workflow status is '${current.status}', not 'paused'` }
      let raw: string
      try { raw = await readFile(current.last_checkpoint_path, 'utf8') }
      catch (e: any) { return { status: 'corrupt', error: `checkpoint missing: ${e?.message ?? e}`, path: current.last_checkpoint_path } }
      let parsed: unknown
      try { parsed = JSON.parse(raw) }
      catch (e: any) { return { status: 'corrupt', error: `checkpoint JSON parse failed: ${e?.message ?? e}`, path: current.last_checkpoint_path } }
      if (!Value.Check(CheckpointV1, parsed)) {
        return { status: 'corrupt', error: `checkpoint schema validation failed: ${[...Value.Errors(CheckpointV1, parsed)].map(e => e.message).join('; ')}`, path: current.last_checkpoint_path }
      }
      const checkpoint = parsed
      const cwd = process.cwd()
      const cwdWarn = checkpoint.cwd !== cwd ? `⚠ checkpoint cwd '${checkpoint.cwd}' ≠ current cwd '${cwd}' — SDK session resume may fail (§ 1.3)` : undefined
      const sidHint = checkpoint.session_id ? ` (session_id: ${checkpoint.session_id} — SDK will redirect to original session)` : ' (fresh session — context reloaded from checkpoint)'
      const resumeHint = `→ in Claude Code: /gsd-execute-phase ${checkpoint.phase}${sidHint}`
      return { status: 'ok', checkpoint, ...(cwdWarn ? { cwdWarn } : {}), resumeHint }
    }
    ```

    **T4.4 src/cli/resume.ts NEW ~40L** + **cli.ts MODIFY +2L**: Verbatim PATTERNS § 2.4 sister doctor.ts L141-172 --json pattern; cli.ts L3 add `import { registerResume } from './cli/resume.js'`, L22 update comment `12 subcommands`, L36 add `registerResume(program)`:
    ```typescript
    // src/cli/resume.ts NEW ~40L
    import type { Command } from 'commander'

    export function registerResume(program: Command): void {
      program
        .command('resume')
        .description('Reload checkpoint from paused workflow + print resume hint (D-03 RELOAD)')
        .option('--json', 'output JSON instead of human-readable')
        .action(async (opts: { json?: boolean }) => {
          const { runResume } = await import('../checkpoint/resume.js')
          const r = await runResume()
          if (opts.json) { console.log(JSON.stringify(r, null, 2)); process.exit(r.status === 'ok' ? 0 : 1); return }
          if (r.status === 'no-paused-phase') { console.error(`✗ ${r.error}`); process.exit(1) }
          if (r.status === 'corrupt') { console.error(`✗ ${r.error}\n    path: ${r.path}`); process.exit(1) }
          if (r.cwdWarn) console.error(r.cwdWarn)
          console.log(`phase: ${r.checkpoint.phase}`)
          console.log(`last_task: ${r.checkpoint.last_task}`)
          if (r.checkpoint.key_decisions.length) console.log(`key_decisions: ${r.checkpoint.key_decisions.slice(0, 5).join(', ')}`)
          console.log(r.resumeHint)
          process.exit(0)
        })
    }
    ```

    **T4.5 tests NEW ~230L**: 16 fixture across sigint.test.ts (5) + compact.test.ts (4) + resume.test.ts (7). SIGINT tests use `process.emit('SIGINT')` + `vi.spyOn(process, 'exit')`. Cross-OS verify via existing CI matrix (Win Git Bash + macOS + Linux); explicitly note that double-SIGINT force quit fixture mirrors Phase 2.4 W5 ralph-loop Win sentinel cross-OS pattern. Run `pnpm exec biome check --write` before commit.
  </action>
  <verify>
    <automated>
      pnpm typecheck &amp;&amp;
      test $(wc -l &lt; src/checkpoint/sigintTrap.ts) -le 30 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/compact.ts) -le 30 &amp;&amp;
      test $(wc -l &lt; src/checkpoint/resume.ts) -le 70 &amp;&amp;
      test $(wc -l &lt; src/cli/resume.ts) -le 45 &amp;&amp;
      grep -c "register\\w\\+(program)" src/cli.ts | awk '$1 == 12' &amp;&amp;
      grep -q "registerResume" src/cli.ts &amp;&amp;
      pnpm build &amp;&amp;
      pnpm test -- --run tests/checkpoint/sigint.test.ts tests/checkpoint/compact.test.ts tests/cli/resume.test.ts
    </automated>
  </verify>
  <done>
    SIGINT Node native + isShuttingDown + 30s timeout fallback + Promise.all + exit 130;
    shouldCompact 75% threshold (RESEARCH § 7 sister Claude Code 平日 70% / noisy 50% 中间);
    runResume reads state + checkpoint + cwd guard + buildResumeHint;
    harnessed resume CLI 12th subcommand exit 0/1 + --json flag (sister doctor.ts pattern);
    16 fixture pass (5 SIGINT + 4 compact + 7 resume);
    Karpathy hard limit per file verified.
  </done>
</task>

<task type="auto">
  <name>Task: Wave 5 — e2e dogfood + ADR 0014 finalize + ship + v0.3.0 alpha.1 close</name>
  <files>
    tests/integration/phase-3.1-e2e.test.ts (NEW ~80L),
    docs/adr/0014-checkpoint-engine-resume-compact.md (NEW ~150L 9 章节),
    .planning/STATE.md (MODIFY 续编 Phase 3.1 SHIPPED + entry #31),
    .planning/RETROSPECTIVE.md (MODIFY Phase 3.1 milestone retrospective),
    .planning/ROADMAP.md (MODIFY Phase 3.1 ✅ + v0.3.0 1/4 + Phase 3.2 prereq),
    .github/workflows/ci.yml (MODIFY A7 iter 1-0013 → 1-0014)
  </files>
  <action>
    Per task_plan.md T5.1-T5.6 (ship cluster):

    **T5.1 tests/integration/phase-3.1-e2e.test.ts NEW ~80L**: End-to-end SIGINT → state.paused → harnessed resume CLI → SDK options.resume captured sid roundtrip. Sister PATTERNS § 2.8 (sdk-spawn.test.ts § "session_id capture + resume propagation" L158-198 direct analog) with SIGINT mock added:
    ```typescript
    describe('Phase 3.1 e2e — SIGINT → resume → SDK redirect', () => {
      it('SIGINT during ralph-loop → current-workflow paused + checkpoint session_id captured', async () => { /* ... */ })
      it('harnessed resume CLI → outputs session_id hint + exit 0', async () => { /* ... */ })
      it('next runRouting call → SDK options.resume === captured session_id (mock SDK)', async () => { /* ... */ })
    })
    ```

    **T5.2 docs/adr/0014-checkpoint-engine-resume-compact.md NEW ~150L** (Wave 0 sketch ~50L → Wave 5 fill ~100L → Status `Accepted (phase 3.1 W5 — 2026-05-16)`): 9 章节 errata:
    1. D-01 TEMPLATE 摘要 (zero LLM call + Buffer.byteLength/4 Heuristic + truncate fallback)
    2. D-02 KARPATHY 3-state current-workflow.json (active/paused/complete + 8-surface schemaVersion 加 currentWorkflow.v1)
    3. D-03 RELOAD harnessed resume (not AUTO-REPLAY rationale + cwd guard § 1.3)
    4. D-04 WIRE-IN T4.4 closure infra 激活 (ralphLoop.ts dead-wiring + engine.ts void placeholder 删 + 30L cross 2 files)
    5. § 1.3 cwd 匹配陷阱 mitigation (checkpoint schema 加 cwd field + resume cwd mismatch warn)
    6. § 2 SIGINT Node native + isShuttingDown + 30s timeout (Karpathy YAGNI + 跨 OS Win double Ctrl+C force quit)
    7. § 7 compact threshold 75% MVP placeholder (sister Claude Code 平日 70% / noisy 50% 中间; harnessed compact subcommand 推 Phase 3.4)
    8. W0 backlog 4 项 absorb (W0.1 AUDIT § 0.5 + W0.2 RETROSPECTIVE Advisory Absorb + W0.3 README completeness CI + W0.4 phase-2.4 self-check verify)
    9. § 12 6-wave topology rationale + A7 conservation (ADR 0001-0013 main body 0 diff + ci.yml A7 iter 1-0013 → 1-0014 + baseline tag adr-0014-accepted)

    **T5.3 STATE.md + RETROSPECTIVE.md + ROADMAP.md 续编**: STATE.md L24 "下一 phase" 改 "v0.3.0 Phase 3.2"; L26 entry #31 add Phase 3.1 SHIPPED with R7.2 + R7.3 acceptance + 6 Wave summary; ROADMAP.md Phase 3.1 ☐ → ✅; RETROSPECTIVE.md add Phase 3.1 milestone retrospective (W0 cluster + W3 T4.4 dead-wiring 1 milestone 闲置后激活 lessons + W5 dogfood real SIGINT cycle outcome).

    **T5.4 A7 守恒 verify + W-02 orchestrator explicit literal updates** (sister Phase 2.4 W6 T6.2):
    ```bash
    git diff adr-0013-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-3]-*.md" | wc -l
    # Expected: 0 (ADR 0001-0013 main body 0 diff)
    ```
    MODIFY `.github/workflows/ci.yml` per W-02 orchestrator explicit literal (NOT naked `1-0013` substring):
    - L60 step name: `ADR 0001-0013` → `ADR 0001-0014`
    - L85 echo summary: `ADR 0001-0013 main body unchanged` → `ADR 0001-0014 main body unchanged`
    - L63 + L74 `for n in ... 0013; do` loops: append ` 0014` to loop bound
    - L34 + L59 comment chain: append Phase 3.1 ADR 0014 errata note + baseline tag iterate 扩到 14
    - Scope check: `grep -nE "0013" .github/workflows/ci.yml` to catch any other literals; bump as appropriate per orchestrator W-02 rule

    **T5.5 Phase 3.1 dogfood**: REAL SIGINT cycle (本 phase 自己 dogfood acceptance per ROADMAP "人为中断 session 后从 03 phase 续跑成功"):
    ```bash
    # 1. Start a harnessed routing (Phase 3.2 simulate or any working workflow)
    # 2. Press Ctrl+C mid-iteration
    # 3. Verify .harnessed/current-workflow.json status='paused'
    # 4. Run `node ./dist/cli.mjs resume` → see checkpoint summary + hint
    # 5. In Claude Code: /gsd-execute-phase 3.1 (continues from captured session_id)
    # 6. Verify ralph-loop iter resumes via SDK options.resume
    ```
    Capture dogfood output to `.planning/phase-3.1/DOGFOOD-T5.5.md` (success or failure transparency, sister Phase 2.4 W6 deferred-items #3 RESOLVED pattern if dogfood fails → 1-line hotfix or W5 retry).

    **T5.6 baseline tag + milestone tag**:
    ```bash
    git tag adr-0014-accepted
    git tag v0.3.0-alpha.1-checkpoint
    git push origin adr-0014-accepted v0.3.0-alpha.1-checkpoint
    ```

    Run `pnpm exec biome check --write` + full `pnpm test` + `pnpm typecheck` before final commits. CI 3-OS green required.
  </action>
  <verify>
    <automated>
      ls docs/adr/0014-*.md &amp;&amp;
      grep -cE "^### [1-9]\\. " docs/adr/0014-*.md | awk '$1 == 9' &amp;&amp;
      grep -q "Status: Accepted" docs/adr/0014-*.md &amp;&amp;
      test $(git diff adr-0013-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-3]-*.md" | wc -l) -eq 0 &amp;&amp;
      grep -q "Phase 3\\.1 SHIPPED" .planning/STATE.md &amp;&amp;
      grep -q "ADR 0001-0014" .github/workflows/ci.yml &amp;&amp;
      ! grep -q "ADR 0001-0013" .github/workflows/ci.yml &amp;&amp;
      git tag --list 'adr-0014-accepted' | grep -q . &amp;&amp;
      git tag --list 'v0.3.0-alpha.1-checkpoint' | grep -q . &amp;&amp;
      pnpm test -- --run tests/integration/phase-3.1-e2e.test.ts &amp;&amp;
      pnpm test &amp;&amp;
      pnpm typecheck
    </automated>
  </verify>
  <done>
    e2e SIGINT → resume → SDK redirect mock 3 fixture pass;
    ADR 0014 9 章节 errata accepted (Wave 0 sketch → Wave 5 fill, Status Accepted);
    A7 守恒 ADR 0001-0013 main body 0 diff verified (sister Phase 2.4 T6.2 pattern);
    STATE/RETRO/ROADMAP 续编 Phase 3.1 SHIPPED + v0.3.0 1/4 进度;
    ci.yml A7 iter `ADR 0001-0013` → `ADR 0001-0014` explicit (W-02 orchestrator fix);
    baseline tag adr-0014-accepted + milestone tag v0.3.0-alpha.1-checkpoint pushed;
    Phase 3.1 self-dogfood real SIGINT cycle outcome captured to DOGFOOD-T5.5.md;
    CI 3-OS green + 全 test suite green + typecheck clean.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CLI input → harnessed resume | `harnessed resume` 不接受 user-controlled string (无 stdin/argv 注入面); --json flag 仅控制输出 format, no exec |
| .harnessed/current-workflow.json read → resume | JSON read 用户 cwd 下 fs trust; 恶意 JSON content (e.g. ECMAScript prototype pollution) → JSON.parse 内建 safe + TypeBox Value.Check schema 验 + branchOnSchemaVersion 单一兼容门 |
| .harnessed/checkpoints/<phase>.json read → resume + engine | 同上, TypeBox CheckpointV1 schema validate runtime; cwd field guard 防 cross-host session resume (§ 1.3 silent fresh-session bug 防护) |
| .harnessed/archive/ raw turn dump → 用户回溯 | archive 完整 raw 不进 context (R7.2 lock); 用户手 cat 文件查看 — no automatic exec; archive 不被 resume / template consume |
| SIGINT trap → process.exit | Node native process.on('SIGINT') zero-dep; isShuttingDown flag 防 double Ctrl+C race; 30s setTimeout fallback 防 fs hang; exit 130 standard SIGINT code (128+2) |
| SDK options.resume = checkpoint.session_id → claude-agent-sdk query() | session_id 是 SDK 给的 string 原值 (sdkSpawn.ts L67-69 verified 直接透传 msg.session_id); user 不能 inject; SDK 服务端验证 session existence |
| dashboard SSE channel (W0.3 评估) | 本 phase MVP 不动 dashboard (CONTEXT § Discretion 推零代码复用 — STATE.md auto-update 时自然触发 SSE) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-3.1-01 | Tampering | .harnessed/current-workflow.json schema drift 攻击 (恶意 user 改 enum 'paused' → 'super-paused') | mitigate | TypeBox Value.Check 严格 enum (3-state union literal); readCurrentWorkflow 返 null on schema drift → resume "no-paused-phase" exit 1 fail-loud; sister Phase 2.2 loadPhases ValidationError pattern |
| T-3.1-02 | Tampering | .harnessed/checkpoints/<phase>.json schema drift (恶意 session_id 注入) | mitigate | TypeBox CheckpointV1 schema validate + Value.Check; session_id 是 Optional<string> 仅当 SDK 验证存在才 redirect 成功, 否则 SDK 静默返 fresh session (RESEARCH § 1.4) — fallback path 已覆盖 |
| T-3.1-03 | Tampering | checkpoint.cwd mismatch 致 cross-host session resume 静默 fresh (§ 1.3 critical) | mitigate | resume.ts cwd guard: checkpoint.cwd !== process.cwd() → stderr warn '⚠ checkpoint cwd ≠ current cwd — SDK session resume may fail'; 用户 informed 决定继续 OR abort; exit 0 仍 proceed (不强 block, RELOAD lock 不偷袭) |
| T-3.1-04 | DoS | SIGINT handler async checkpoint write hang (恶意 fs lock / mock SDK timeout) | mitigate | 30s setTimeout fallback (RESEARCH § 2.2 best-practice); double Ctrl+C force quit (isShuttingDown flag); exit 130 保证 process exit, no hang permanent |
| T-3.1-05 | Information Disclosure | checkpoint.session_id 暴露 SDK session info via stdout / JSON output | accept | session_id 是 user 自己 SDK session 的 ID, 用户 cwd 下 fs 已可读; --json output 仅本机 stdout, 无外部 leak; sister Phase 2.4 doctor.ts --json pattern accept |
| T-3.1-06 | Repudiation | 多次 SIGINT 后 checkpoint write 历史 audit (用户疑 "上次中断 paused 哪个 task") | mitigate | archive 双轨写每次 SIGINT → `.harnessed/archive/phase-<X.Y>/raw-<ts>.json` 完整 raw + timestamp; current-workflow.json paused_at field 记录最后一次; archive 全保留 MVP (gc 推 Phase 3.4) |
| T-3.1-07 | Elevation of Privilege | harnessed resume CLI 调起 phase command 是否能取 user shell 权 | accept | resume 只 stdout 输出 hint, 用户手动 invoke `/gsd-execute-phase` (D-03 RELOAD lock 不偷袭); 无 exec / spawn; --auto flag NOT 加 (D-03 deferred to v0.4 dogfooding 验证) |
| T-3.1-08 | Tampering | archive 文件被恶意 modify / 删 (回溯证据丢失) | accept | archive 是 user-owned fs, 用户 own 权限决定保护; 本 phase MVP 不加 integrity hash (sister Phase 2.4 audit provenance pattern 可 future 扩); Karpathy YAGNI lock |
| T-3.1-09 | DoS | enforceBudget truncate 失败 → throw CheckpointTooLargeError 中断 phase | mitigate | truncate 2-level fallback (last_task → 200 char → key_decisions slice 3) + 1000 token budget 留 ~50% margin (RESEARCH § 3.2 typical 350-450 token); truncate trigger 概率 < 5%; throw 是 fail-loud Karpathy "不假设" 原则 |
| T-3.1-10 | Tampering | ralphLoop sessionId 第 1 轮 capture 后 iter 2+ reuse 是否被恶意 spawn 篡改 | mitigate | sessionId 是 spawn callback closure 内变量, 单 process 内 trust; 无 cross-process / 网络面; SDK 服务端验证 session ownership (resume by ID 需 session 原 owner) |

**Total**: 10 threats, 8 mitigate / 2 accept; sister Phase 2.4 10-threat register pattern.
</threat_model>

<verification>
## Phase Verification

- **Wave 0** — 4 backlog 项 commit (W0.1 AUDIT § 0.5 + W0.2 RETROSPECTIVE Advisory Absorb + W0.3 ci.yml README completeness + W0.4 W0-T5-verify.md) + test dirs setup + 3-OS CI green
- **Wave 1** — schemaVersion 7 → 8 surface verified (grep ≥ 8) + CheckpointV1 + CurrentWorkflowV1 TypeBox schemas + state.ts 3-state transition + 13 fixture pass + Karpathy hard limit ≤ 80L per file
- **Wave 2** — template.ts writeCheckpoint + estimateTokens + enforceBudget 2-level truncate + archive.ts writeArchive + index.ts barrel + 9 fixture pass + Karpathy ≤ 80L per file
- **Wave 3** — Phase 2.2 T4.4 closure infra 三件套 dead-wiring 全激活 (ralphLoop.ts L43 sessionId capture + engine.ts L182 void delete + checkpoint.write trigger + activate trigger) + 6 fixture pass mock SDK + engine.ts ≤ 215L (B-03 5% tolerance)
- **Wave 4** — SIGINT trap Node native + harnessed resume CLI 12th subcommand + shouldCompact 75% placeholder + 16 fixture pass + cli.ts 12 subcommand verified + Karpathy hard limit per file
- **Wave 5** — e2e SIGINT → resume → SDK redirect 3 fixture + ADR 0014 9 章节 errata accepted + A7 守恒 ADR 0001-0013 main body 0 diff + STATE/RETRO/ROADMAP 续编 + baseline tag adr-0014-accepted + milestone tag v0.3.0-alpha.1-checkpoint + Phase 3.1 self-dogfood real SIGINT cycle + 3-OS CI green
</verification>

<success_criteria>
## Success Criteria

1. **R7.2 verified**: 单 checkpoint < 1k token (estimateTokens ≤ 1000 unit test + typical case 350-450 token); archive 完整 raw turn 写入 `.harnessed/archive/phase-<X.Y>/raw-<ts>.json`; 后续 phase 只读 checkpoint 不读 archive (架构隔离 verified — resume.ts 只 read checkpoint, archive.ts 只 write)
2. **R7.3 verified**: 人为中断 session (SIGINT) → `.harnessed/current-workflow.json` status='paused' 写盘 + `harnessed resume` 输出 checkpoint 摘要 + 用户在 Claude Code 内 `/gsd-execute-phase <X.Y>` 续跑 (D-04 WIRE-IN: SDK options.resume === captured session_id, fallback fresh session 退化路径 verified)
3. **ROADMAP Phase 3.1 acceptance verified**: 摘要 < 1k token + archive 完整 + current-workflow.json 状态机 + 人为中断 session 后从 03 phase 续跑成功 (Wave 5 T5.5 self-dogfood)
4. **D-01~D-04 全 lock 兑现**: D-01 TEMPLATE zero LLM call (template.ts JSDoc verify) + D-02 KARPATHY 3-state (state.ts enum 3 literal verify) + D-03 RELOAD 不偷袭 (resume.ts 仅 stdout 输出, 无 spawn) + D-04 WIRE-IN T4.4 closure infra 三件套 dead-wiring 全 激活
5. **W0 backlog 4 项一次根治**: W0.1 AUDIT § 0.5 (AUDIT actuals NOT KICKOFF stale per RESEARCH § 10) + W0.2 RETROSPECTIVE Advisory Absorb + W0.3 ci.yml README completeness check (B-04 bash) + W0.4 W0-T5-verify.md
6. **Karpathy hard limit 守**: schema/checkpoint.v1.ts ≤ 50L / schema/currentWorkflow.v1.ts ≤ 30L / template.ts ≤ 80L / state.ts ≤ 60L / archive.ts ≤ 40L / sigintTrap.ts ≤ 25L / compact.ts ≤ 30L / resume.ts ≤ 60L / src/cli/resume.ts ≤ 40L; engine.ts ≤ 215L (B-03 5% tolerance)
7. **schemaVersion CD-5 single 兼容门**: 7-surface → 8-surface (grep ≥ 8 `harnessed.\w+.v1`); 所有 consume site 走 branchOnSchemaVersion<T>() helper (no 裸 string 比对)
8. **3-OS CI 全绿** (Win Git Bash + macOS + Linux): 含 W0.3 README completeness check + W3 SDK wire integration + W4 SIGINT cross-OS + W5 e2e + 全 test suite + biome lint + typecheck
9. **ADR 0014 errata accepted 9 章节** (Wave 0 sketch → Wave 5 fill); A7 守恒 ADR 0001-0013 main body 0 diff verified (`git diff adr-0013-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-3]-*.md | wc -l == 0`); ci.yml A7 iter 1-0013 → 1-0014
10. **v0.3.0 milestone 第 1 phase ship**: baseline tag `adr-0014-accepted` + milestone tag `v0.3.0-alpha.1-checkpoint` pushed; STATE.md "下一 phase = v0.3.0 Phase 3.2" + RETROSPECTIVE Phase 3.1 milestone retro + ROADMAP Phase 3.1 ✅; tests ~543 → ~605 (+62 cells across W0-W5); Phase 3.2 启动 prereq 列表 ready
</success_criteria>

<output>
After completion, create `.planning/phase-3.1/3.1-SUMMARY.md` (沿袭 Phase 2.4 SUMMARY 模板) — 含 Phase 3.1 全 ship marker + v0.3.0 alpha.1-checkpoint milestone close note + Phase 3.2 启动 prereq 列表 (plan-feature workflow + gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装).
</output>
