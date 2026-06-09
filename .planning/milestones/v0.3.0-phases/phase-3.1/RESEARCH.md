# Phase 3.1 — RESEARCH (Wave A R2 focus pack)

> **Researched**: 2026-05-16
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7, 1M ctx)
> **Scope**: 12 sections — SDK session redirect (D-04 critical) / SIGINT trap / 1k token enforcement / TypeBox schemaVersion register / CLI subcommand / dashboard SSE reuse / compact threshold / archive retention / validation architecture / W0 backlog support / Karpathy anti-patterns / Wave topology recommendation
> **Overall confidence**: HIGH (§1 SDK session — context7 /anthropics/claude-agent-sdk-demos + code.claude.com 直证 / §4 schemaVersion + §5 CLI — repo internal baseline 直证 / §6 dashboard SSE — repo current state grep 直证 / §10 W0 — repo current state 直证) · MEDIUM-HIGH (§2 SIGINT — Node 22 native + 2026 best-practice 行业共识 / §7 compact threshold — Claude Code 行业实测多源 cross-check) · MEDIUM (§3 token budget enforcement — Heuristic 0.25 token/char 实测变量带 ±20% 偏差 / §8 archive retention — projection 而非实测 / §11 anti-patterns — 经验值, 未 spike)
> **Valid until**: ~2026-08-15 (Node 22 LTS + `@anthropic-ai/claude-agent-sdk@0.3.142→0.3.143` 周期; SDK session API 若 v0.4+ deprecate `resume` option 则需复核)

---

## § 0 Scope note + sources

### What this RESEARCH does NOT redo

4 D-decisions D-01~D-04 已 interactive AskUserQuestion 锁定（`3.1-CONTEXT.md` L33-100）：

- **D-01** checkpoint 摘要生成策略 = **TEMPLATE** (机械 extract 固定 JSON fields, zero LLM call)
- **D-02** `current-workflow.json` 状态机 = **KARPATHY 极简 3 state** (active / paused / complete)
- **D-03** `harnessed resume` 行为 = **RELOAD** (输出 checkpoint + 用户手动续跑, 不 AUTO-REPLAY)
- **D-04** T4.4 Task Session closure infra wiring = **WIRE-IN** (session_id 写 checkpoint, SDK redirect 续 session)

本 RESEARCH 聚焦 KICKOFF + user-prompt § 1-12 R2 实装支撑 (不再二次探索 D 决策的 alternative)。

### Critical pre-existing assets discovered (MUST inform planner)

1. **T4.4 closure infra 三件套 verified ready, 但实际 wiring 状态比 KICKOFF 描述精确**:
   - `src/routing/lib/sdkSpawn.ts` L31-33 — `SdkSpawnOpts` 已含 `resumeSessionId?: string` + `onSessionId?: (id: string) => void` callback (Phase 2.2 W4 T4.1 ship, B-25 split)。 [VERIFIED: sdkSpawn.ts:31-33,59,67-69]
   - `src/routing/lib/ralphLoop.ts` L38-49 — `ralphLoopWrap(spawn, maxIter)` 接受 spawn callback 签名 `(resumeSessionId?: string) => Promise<string>`, 内部 `sessionId` 变量声明但**只透传 undefined**（L43 `let sessionId: string | undefined` + L45 `await spawn(sessionId)` 后**未赋值**）。 **本 phase 必须改 ralphLoopWrap 让 sessionId 在第 1 轮捕获后 retry 时复用** —— sister `engine.wrappedSpawn capturedSessionId` (L171-181) 同样**捕获后 void 立丢弃** (`void capturedSessionId` L182)。 [VERIFIED: ralphLoop.ts:38-49, engine.ts:171-182]
   - `src/routing/engine.ts` L172-181 — `wrappedSpawn` 已通过 `onSessionId: (id) => { capturedSessionId = id }` 捕获 session_id，**但 capturedSessionId 在 engine 内被 void**。 本 phase 必须在 engine.runRouting 完成后 export capturedSessionId (返回 EngineResult 字段) 或在 wrappedSpawn 内联写 checkpoint。 [VERIFIED: engine.ts:171-182]
   - **真实 wire-in 工作量**: 不是"已 closure 三件套 ready 仅加 schema field"那么简单 — ralphLoop.ts L43 `sessionId` 变量目前 dead code + engine.ts L182 `void capturedSessionId` 是 placeholder。 **真实改动**: ralphLoop 内 sessionId 在第 1 次 spawn 成功后保留供 retry 用 (+5L); engine 内增加 `capturedSessionId` export 路径 (+5L); sdkSpawn 内 onSessionId callback wire 进 checkpoint write (+10L)。 [HIGH 影响 task_plan 估时 — KICKOFF 描述 "20-30L wire-in" 仍合理但要明示三件套 dead-wiring 现状]

2. **CLI subcommand 数 = 11 (verified, 不是 12)** — `src/cli.ts` L25-35 直证：`install / install-base / research / execute-task / manifest-add / doctor / audit / rollback / status / backup-list / gc` 共 **11**。 Phase 3.1 加 `resume` → 12。 KICKOFF § 1 L22 注释写 "11 subcommands per ADR 0004 + 0007 + 0008 + 0011 + 0012 draft" 准确, CONTEXT § Integration Points L185 写 "11 → 12" 准确。 [VERIFIED: src/cli.ts:1-37]

3. **`schemaVersion` 7-surface 注册表完整 + `checkpoint.v1` 已在册** — `src/types/schemaVersion.ts` L34-42 直证: `SCHEMA_VERSIONS.checkpoint = 'harnessed.checkpoint.v1'`。 **本 phase IS the first consumer of `harnessed.checkpoint.v1`** — surface 注册时 (Phase 2.2 W2 T2.0) 已 reserved 但 0 consumer。 Phase 3.1 加 `current-workflow.v1` 作 **8th surface**: 改 `SCHEMA_VERSIONS` const + `SchemaVersionLiteral` Union (+2L 每处)。 [VERIFIED: src/types/schemaVersion.ts:34-54]

4. **dashboard SSE channel 已 production + 即用** — `scripts/dashboard.mjs` L456-531 verified: `sseClients` Set + `/events` endpoint serve `text/event-stream` + watch `.planning/STATE.md` debounce 500ms + client `EventSource('/events')` reconnect 内建。 **本 phase checkpoint write 触发 SSE 完全可零代码复用**: dashboard 现 watch `STATE.md` 单文件，加 `.harnessed/checkpoints/*.json` 第 2 watch source (+ 5L), 或更省 — 让 checkpoint write 后同步 touch STATE.md (Phase 3.1 后续 phase 反正会 update STATE.md，本 phase MVP 不引新 watch)。 推荐: **第二轮 watch dir** (~5L), 复用同一 SSE event-name `state-changed`。 [VERIFIED: dashboard.mjs:456-531]

5. **`doctor.ts --json` flag pattern locked** — L141-172 直证: `opts: { json?: boolean }` + branch 分支 stdout JSON vs human + `process.exit(hasFail ? 1 : 0)`。 `resume` CLI subcommand 沿袭此 pattern (CONTEXT D-03 L79 + Code Insights L173 anchor)。 [VERIFIED: doctor.ts:136-174]

6. **`.harnessed/` runtime dir 0 现 reference in src/** — Grep `harnessed/checkpoints|harnessed/archive|current-workflow|\.harnessed` in src/ returns 0 matches; references 全部集中在 `.planning/` docs + `scripts/check-provenance.mjs` (audit) + `src/cli/lib/audit-helpers.ts` (audit)。 本 phase 是 src/ 内 `.harnessed/checkpoints/` `.harnessed/archive/` `current-workflow.json` 三 path 的**首消费者**, 与 Phase 1.2 backup/rollback 引入的 `.harnessed/backup/` 同级 (CONTEXT § Integration Points L187 verified)。 [VERIFIED: grep src/ → 0 matches]

7. **`@anthropic-ai/claude-agent-sdk@0.3.142` pinned, latest = 0.3.143** — `npm view @anthropic-ai/claude-agent-sdk version` returns `0.3.143` (single patch ahead)。 本 phase **不需** bump SDK pinned 版本 — 0.3.142 已含 session resume API (Phase 2.2 T1.1 SC4 verify outcome PARTIAL evidence)。 0.3.143 patch diff 留 v0.3.x 后续 phase 决断。 [VERIFIED: npm registry 2026-05-16, package.json L70]

### Sources cited

| Source | Lines | Confidence | Purpose |
|--------|-------|-----------|---------|
| `src/routing/lib/sdkSpawn.ts` | L1-91 | HIGH | T4.4 closure infra #1 baseline (onSessionId callback wire) |
| `src/routing/lib/ralphLoop.ts` | L1-49 | HIGH | T4.4 closure infra #2 baseline (sessionId variable dead code 现状) |
| `src/routing/engine.ts` | L1-195 | HIGH | T4.4 closure infra #3 baseline (capturedSessionId void 现状) |
| `src/types/schemaVersion.ts` | L1-68 | HIGH | 7-surface register + branchOnSchemaVersion helper |
| `src/cli.ts` | L1-37 | HIGH | 11 subcommand register pattern |
| `src/cli/doctor.ts` | L1-175 | HIGH | --json flag + exit code sister pattern |
| `scripts/dashboard.mjs` | L1-610 | HIGH | SSE watcher + `/events` endpoint + EventSource reconnect ready |
| `package.json` | L70 | HIGH | SDK 0.3.142 pinned + Node ≥ 22 engine |
| `.planning/v0.2.0-MILESTONE-AUDIT.md` | L1-137 | HIGH | v0.2.0 close baseline + T4.4 deferred trail |
| `.planning/phase-2.4/RESEARCH.md` | L1-450 | HIGH | sister format + § 0 SSOT 模式 sister |
| `.planning/RETROSPECTIVE.md` | L1-60 | HIGH | Phase 2.4 deferred-items review cadence + dashboard cluster 模板 |
| **External** | | | |
| ctx7 `/anthropics/claude-agent-sdk-python` | session_stores README + llms.txt | HIGH | resume / continue / fork_session 三选一 API |
| ctx7 `/anthropics/claude-agent-sdk-demos` | llms.txt multi-turn + WebSocket chat | HIGH | TypeScript session_id capture from `message.type === 'system' && message.subtype === 'init'` |
| code.claude.com/docs/en/agent-sdk/sessions | live docs | HIGH | session lifecycle 全文档 (continue vs resume vs fork + cross-host 限制 + cwd 匹配陷阱) |
| WebSearch — Claude Code auto-compact | 2026-05 多源 | MEDIUM-HIGH | 95% trigger / 70% override common / 1M ctx Opus 4.6 |
| WebSearch — Node.js SIGINT 2026 best-practice | 2026-05 多源 | HIGH | Windows Console Control Event 抽象 + npm signal relay + AbortController Node 22+ |

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 checkpoint 摘要生成策略 = TEMPLATE** (机械 extract 固定 JSON fields, zero LLM call)
  - Rationale: Karpathy YAGNI + R7.2 "单 checkpoint < 1k token" 指向机械拼装; zero API 依赖 / deterministic / 可纯代码验证
  - Schema 锁: `{ schemaVersion: 'harnessed.checkpoint.v1', phase, status, last_task, key_decisions: string[], canonical_refs: string[], session_id?: string, timestamp: ISO, archive_path: string }`
  - 不达 1k → fail-loud truncate `last_task` 等 string field

- **D-02 `current-workflow.json` 状态机 = KARPATHY 极简 3 state** (active / paused / complete)
  - Rationale: YAGNI 避免 over-modeled FSM; 6-state textbook (idle/discussing/planning/executing/awaiting-checkpoint/recovering) deferred → 多 workflow 类型并存才考虑
  - Schema 锁: `{ schemaVersion: 'harnessed.current-workflow.v1', phase, status: 'active'|'paused'|'complete', last_checkpoint_path, started_at, paused_at?, completed_at? }`
  - 不引 xstate / robot3 — 1 enum field + 几个 if

- **D-03 `harnessed resume` 行为 = RELOAD** (输出 checkpoint + 用户手动续跑, 不 AUTO-REPLAY)
  - Rationale: Claude Code 交互底色 = 用户总需手动 invoke skill; resume 不偷袭 = 用户保留"忘记重开"自由; AUTO-REPLAY 需 command-rehydration 黑盒机制
  - Exit code: 0 = pass, 1 = no paused / file corrupt / schema mismatch (fail loud)
  - `--json` flag CI 友好 (sister doctor pattern)

- **D-04 T4.4 Task Session closure infra wire-in = WIRE-IN** (session_id 写 checkpoint, SDK redirect 续 session)
  - Rationale: Phase 2.2 T4.4 三件套 closure infra ready 已等 1 milestone; defer 再 1 milestone 成 dead infra; SDK session 续跑 = lossless conversation context (>> reload checkpoint 摘要 80% 损耗信息密度)
  - Fallback: session_id 不存在 / SDK 拒绝续 → fresh session + reload checkpoint 摘要 (退化路径无破坏)
  - Closure 三件套全 ready: `sdkSpawn.onSessionId` + `ralphLoopWrap.resumeSessionId` + `engine.wrappedSpawn capturedSessionId` (但本 RESEARCH § 0.2 §1 verified ralphLoop sessionId 是 dead 变量, 本 phase 必须激活)

### Claude's Discretion

- **checkpoint write 触发 dashboard SSE push 评估** — 推 Wave 0 spike 1 hour, 推荐复用现有 SSE channel (本 RESEARCH § 6 verified 仅 ~5L 即可)
- **SIGINT trap 实现** — `process.on('SIGINT', ...)` Node 原生 vs 单独 wrap 一层。推 Node 原生 (零依赖, 本 RESEARCH § 2 verified)
- **compact 协议触发阈值** — 推 60k 起 (留 60% headroom)。本 RESEARCH § 7 推 75% (sister Claude Code 业内 95% trigger 太晚 + 70% override 偏严; 75% 平衡 dogfood 调整空间)
- **archive 文件 retention 策略** — 本 phase MVP 全保留, gc 集成下 phase or v0.4 dogfooding 后定 (本 RESEARCH § 8 verified 10 checkpoints/day × 4-6KB = ~22MB/yr, 1 yr 内不需 gc)
- **TypeBox schema 是否抽 checkpoint package** — 推荐独立目录 `src/checkpoint/schema/` 沿袭 manifest schema pattern (Karpathy 单一职责)。本 RESEARCH § 4 verified

### Deferred Ideas (OUT OF SCOPE)

- plan-feature workflow 跑通 → Phase 3.2
- gstack 命令前缀探测 → Phase 3.2
- aliases.yaml + deprecation marker + known-good 版本组合 → Phase 3.3
- 路由命中率 ≥ 85% 验收 + token budget 监控 → Phase 3.4
- EE-4 BLOCKER auto-spawn rerun → Phase 3.4 后 evaluate (Phase 2.4 down-scope)
- archive 文件 gc 集成 → Phase 3.4 OR v0.4 dogfooding 后定 (本 phase MVP 全保留)
- HYBRID 摘要策略 (template default + LLM optional 触发) → v0.4 dogfooding 后看是否真实需求 (D-01 evaluated rejected)
- 6-state FSM 完整模型 → 未来若多 workflow 类型并存才考虑 (D-02 evaluated rejected; YAGNI)
- AUTO-REPLAY resume 行为 → v0.4 dogfooding 验证 RELOAD 是否真有 friction 再考虑 (D-03 evaluated rejected)
- EE-2 ECC 9-field manifest schema → v0.3+ 评估
- V-1 动态 model routing → v0.3+ discuss
- V-2 Manual fallback bundle export → v0.4+

</user_constraints>

---

## Project Constraints (from CLAUDE.md)

> 用户全局 CLAUDE.md 关键 directive 摘录 (`C:\Users\easyi\.claude\CLAUDE.md`, 与本 phase 相关 subset)。这些与 locked decisions 等同权威。

- **Karpathy simplicity always-on (心法)**: Think Before Coding / Surgical Changes / 小步原子修改 / Goal-Driven Execution / 追求最小有效代码 — 所有 src/ 文件 ≤ 200L hard limit (B-06 + B-26 sister)
- **GSD orchestration + planning-with-files persist**: phase 文档落 `.planning/phase-3.1/` (本 phase scope), task_plan.md + progress.md + findings.md
- **superpowers subagent execute + ralph-loop**: 每子任务用 ralph-loop completion-promise "COMPLETE"; TDD 强 recommend 核心业务逻辑 (本 phase checkpoint engine + state machine 是核心业务, 推 TDD)
- **Web 搜索路由 Tavily / Exa MCP 优先** (内置 WebSearch 仅 fallback), `gh CLI` 优先 over GitHub MCP
- **commit 时 Karpathy "Simplicity First"**: 单 phase 内多次 atomic commit; commit message 含 "why" 不仅 "what"

planner 必须验证每 task ≤ 200L hard limit + 沿袭 Phase 2.4 W2 spike-first 量化决策 cadence + Phase 2.4 W6 deferred-items review cadence。

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **R7.2** | checkpoint 分层 (摘要 vs archive): `.harnessed/checkpoints/` < 1k token 进 context + `.harnessed/archive/` 完整 raw 不进 context；单 checkpoint < 1k token 验收 | § 3 token budget enforcement + § 4 TypeBox schema register (checkpoint.v1 + current-workflow.v1) |
| **R7.3** | `harnessed resume`: session 中断从 `.harnessed/current-workflow.json` 找到当前 phase + 重读 checkpoint 续跑; 人为中断 session 后 resume 不丢上下文 | § 1 SDK session redirect + § 5 CLI subcommand + § 2 SIGINT trap (resume 入口由 SIGINT 触发 status='paused' 写盘) |
| **ROADMAP Phase 3.1 摘要 < 1k token** | acceptance bar | § 3 token budget enforcement (Heuristic + truncate fallback) |
| **ROADMAP Phase 3.1 archive 完整** | acceptance bar | § 8 archive retention (本 phase MVP 全保留, gc 推 v0.4) |
| **ROADMAP Phase 3.1 `current-workflow.json` 状态机** | acceptance bar | § 4 TypeBox schema (current-workflow.v1 8th surface) + D-02 lock |
| **ROADMAP Phase 3.1 人为中断 session 后从 03 phase 续跑成功** | acceptance bar (E2E dogfood) | § 1 + § 2 + § 5 全链路 |
| **compact 协议 (ROADMAP Phase 3.1)** | 强制 compact workflow 触达 token threshold 自动调 | § 7 threshold recommendation (75% sister Claude Code auto-compact 95%) |

</phase_requirements>

---

## § 1 SDK session redirect mechanics (D-04 critical)

**Confidence: HIGH** — context7 `/anthropics/claude-agent-sdk-demos` + `/anthropics/claude-agent-sdk-python` 多源验证 + code.claude.com 官方 docs 全文档直证 + 本 repo `sdkSpawn.ts` L67-69 实装直证。

### 1.1 SDK session_id 暴露机制 — `system:init` event capture

**TypeScript SDK 标准模式** (Phase 3.1 直接沿袭):

```typescript
// Source: ctx7 /anthropics/claude-agent-sdk-demos llms.txt §"Multi-Turn Conversations with Session Resume"
// 本 repo sdkSpawn.ts L66-69 已实装同 pattern
for await (const msg of q as AsyncIterable<SDKMessage>) {
  if (msg.type === 'system' && msg.subtype === 'init') {
    opts.onSessionId?.(msg.session_id)  // <-- session_id 暴露点
  }
  if (msg.type === 'result') {
    result = msg as SDKResultMessage
  }
}
```

**两个 session_id 暴露点** (官方 docs `code.claude.com/docs/en/agent-sdk/sessions` §"Capture the session ID"):

1. **早期捕获 (TypeScript only)**: `message.type === 'system' && message.subtype === 'init'` → 直接读 `message.session_id` (string)
2. **末期捕获 (Python + TypeScript)**: `ResultMessage` / `SDKResultMessage` 的 `session_id` field, 每次 result 都有 (无论 success/error)

**本 repo 选 #1 早期捕获** — `sdkSpawn.ts:67-69` 已 verified, Phase 3.1 wire-in 无需改 sdkSpawn 信号源 (D-04 工作量精确)。 [VERIFIED: ctx7 demos + sdkSpawn.ts:67-69]

### 1.2 Resume API 三选一 — continue / resume / fork

**官方 docs `code.claude.com/docs/en/agent-sdk/sessions` §"Choose an approach"** 区分三种重续场景:

| Approach | TypeScript Option | 何时用 | 本 phase 选 |
|----------|-------------------|--------|-----------|
| **Continue** | `continue: true` | 单 process 多 turn / "最近 session" 自动找 (不跟踪 ID) | ❌ — 本 phase 是 process 重启场景, "最近 session" 可能漂 |
| **Resume by ID** | `resume: sessionId` | 指定 session ID 续跑; 多 user / 非最近 / process 重启 | ✅ — 本 phase 直接对应 |
| **Fork** | `resume: sessionId, forkSession: true` | 从原 session 分叉新 session (历史 copy, 新 ID, 原不变) | ❌ — fork 是"探索 alternative", 本 phase 是"恢复" |

**本 phase 锁 `resume: sessionId`** — checkpoint 存 SDK session_id (D-01 schema 已含 `session_id?: string`), `harnessed resume` 输出该 ID, 用户在 Claude Code 内调 `/gsd-execute-phase X.Y` 时 executor 检 checkpoint.session_id → 走 SDK `resume` option。 [HIGH — code.claude.com 直证]

### 1.3 Cross-host / cwd 匹配陷阱 ⭐ 关键限制

**官方 docs `code.claude.com/docs/en/agent-sdk/sessions` §"Resume by ID" Tip block** + §"Resume across hosts":

> 如果 `resume` call 返回 fresh session 而非预期 history, 最常见原因是 **cwd mismatch**。 Sessions 存于 `~/.claude/projects/<encoded-cwd>/*.jsonl`, `<encoded-cwd>` 是绝对工作目录, 每个非字母数字字符替换为 `-` (so `/Users/me/proj` → `-Users-me-proj`). 若 resume call run from different directory, SDK looks in wrong place. Session file 还必须存在于 current machine.

**Phase 3.1 implication**:

- ✅ 本 phase 单机 / 单 cwd 场景 (用户在 `D:\GitCode\harnessed\` 跑 `/gsd-execute-phase`) — cwd 稳定 → resume 应工作
- ⚠️ `.harnessed/current-workflow.json` schema 推加 `cwd: string` field (resume 时验证当前 cwd 匹配, 不匹配 fail-loud 提示 "session file 在 `<cwd>`, 当前 cwd 不同")
- ❌ 本 phase **不支持** cross-host resume (移动 `~/.claude/projects/` jsonl 文件需用户手动 OR `SessionStore` adapter 高级集成, deferred → v0.4+)

[HIGH — code.claude.com Tip 直证, 影响 schema 设计]

### 1.4 Session lifecycle / expiry / 错误模式

**官方 docs 未明示 max session age** — 多源 cross-check:

- code.claude.com 提到 "Sessions persist the **conversation**, not the filesystem" (不持久 file changes, file checkpointing 另)
- ctx7 `/anthropics/claude-agent-sdk-python` §"Manage Claude Agent SDK Sessions" — `list_sessions()` / `get_session_info()` / `delete_session()` API 暴露 — 暗示 session 是持久存在直到显式 `delete_session()`, **无 server-side TTL**
- 本 repo Phase 2.2 ADR 0011 § 1 L35 实测注: "spike 测 resume 后 agent 状态保留情况 partial（session_id 透传 OK, 但 memory + tools state 在 SDK 0.3.142 未完整保留）" — **SDK 0.3.142 session resume 实验性**, Phase 3.1 必须 design fallback 路径

**错误模式分类**:

| 错误 | 触发条件 | 检测方法 | 本 phase fallback |
|------|---------|---------|-------------------|
| Session file not found | cwd mismatch / 跨机 / `~/.claude/projects/<encoded-cwd>/*.jsonl` 已删 | SDK 静默返回 fresh session (无 error throw) | 不可探测 — checkpoint reload 摘要作为 backup info ✅ |
| Session expired | (理论存在但 docs 未明示) | (未知) | 同上 |
| Context overflow on resume | session history 已超 model context window | SDK 触发 auto-compact OR error_max_budget_usd | 用户在 Claude Code 内手动 `/compact` 或丢 session 起 fresh |
| Token quota exceeded | rate limit hit | SDK error_max_turns / error_max_budget_usd | resume 时 max_turns 拉高 (docs 直证) |
| session_id 拼写错 / invalid | 自查错误 | SDK 返回 fresh session (静默) | checkpoint 写 session_id 时用 SDK 给的 string 原值 (无修改) |

[MEDIUM-HIGH — SDK 0.3.142 实验性, 多个 failure mode 是 silent; checkpoint reload 永远是 backup 路径]

### 1.5 Phase 2.2 T4.4 closure infra 实状态 mapping

| Component | 现状 (verified) | Phase 3.1 改动 | LOC est |
|-----------|----------------|---------------|---------|
| `sdkSpawn.onSessionId` callback | ✅ ready (sdkSpawn.ts:31-33, 67-69) — 接受 callback 透传 SDK system:init session_id | 加 callback impl 写 checkpoint | ~10L 在 caller |
| `sdkSpawn.resumeSessionId` option | ✅ ready (sdkSpawn.ts:32, 59) — 接受 `opts.resumeSessionId` 透传到 SDK `options.resume` | 加 caller 传值 (checkpoint reload 后) | ~5L 在 caller |
| `ralphLoopWrap` sessionId 变量 | ⚠️ **DEAD CODE** (ralphLoop.ts:43 `let sessionId: string | undefined` + L45 `await spawn(sessionId)` 后**未赋值**) | **必须激活**: 在第 1 轮 spawn 后从 envelope 提取 OR 让 spawn callback 通过 closure 反向暴露 sessionId | ~10L (改 spawn signature OR 加 callback) |
| `engine.capturedSessionId` | ⚠️ **VOID** (engine.ts:171-182 — 捕获后 `void capturedSessionId` L182 立丢) | **必须 export**: 改 `EngineResult` 加 `sessionId?: string` field OR 在 wrappedSpawn 内联调 checkpoint write | ~10L (改 EngineResult union) |
| **总 wire-in 工作** | | ~35L cross 4 files | |

**KICKOFF "20-30L 工作量" 偏低 5-10L** — 因 ralphLoop + engine 现存 dead-wiring (变量声明但未消费)。 [VERIFIED: ralphLoop.ts:43,45 + engine.ts:171-182, 三件套 dead code grep direct]

---

## § 2 SIGINT trap pattern (D-02 critical)

**Confidence: HIGH** — Node 22 native API + 2026 业内 best-practice 多源共识 + 本 repo `.gitignore` direct check (无 trap 实装现存)。

### 2.1 推荐: Node 原生 `process.on('SIGINT', handler)` ⭐ (Claude's Discretion → 推 Node 原生 — Karpathy YAGNI)

**Why Node 原生 over npm libs**:

| Option | LOC | Risk | Karpathy fit |
|--------|-----|------|--------------|
| (a) **`process.on('SIGINT', ...)`** ⭐ 推荐 | ~15-20L (handler + isShuttingDown flag + timeout fallback) | LOW — Node 22 abstract Windows Console Control Event 跨平台一致 | ✅ Zero dep, sister `process.on('uncaughtException')` Node idiomatic |
| (b) `node-cleanup` (1.0M weekly DL, v2.1.2) | ~10L (`nodeCleanup(handler)` 单 API) | LOW — 但 + 1 dep | ⚠️ 1 dep for 单 SIGINT trap = over-engineered |
| (c) `async-exit-hook` (~250k weekly DL) | ~12L (`exitHook(handler)` + async support 内建) | LOW — + 1 dep | ⚠️ 同上 |
| (d) `death` (v1.1.0, low maint) | ~8L | MED — 维护活跃度低 (last update 2021) | ❌ 不推荐 |

**推 (a) Node 原生** — 本 phase 只需单 SIGINT 信号 + 单异步 write (checkpoint + current-workflow.json), 不需复杂 cleanup chain。 Node 22 内置 `AbortController` 支持 (本 repo 已 Node ≥ 22, package.json:24)。 [HIGH — WebSearch 2026 best-practice + CLAUDE.md Karpathy YAGNI direct]

### 2.2 Cross-platform behavior 关键差异 ⭐ (B-04 Win shell flavor)

**WebSearch 2026 多源共识** + Node 26 官方 docs (`nodejs.org/api/process.html`):

| Platform | SIGINT 来源 | 双 Ctrl+C 行为 | npm 信号 relay 陷阱 |
|----------|-----------|--------------|-------------------|
| Linux | POSIX SIGINT signal | 第 2 次需 handler 自处理 force | npm run X — 信号双发 (handler 触发 2 次) |
| macOS | POSIX SIGINT signal | 同 Linux | 同 Linux |
| Windows native | Console Control Event (`CTRL_C_EVENT`) — Node 抽象为 SIGINT | **第 2 次自动 force terminate** (Win OS 行为, Node 无法 override) | 同上 |
| Windows Git Bash | 同 Windows native (Git Bash 内 bash.exe 转发 CTRL_C_EVENT) | 同上 | 同上 + Git Bash MSYS 偶 swallow 第 1 次信号 (`MSYS=enable_pcon` 缓解) |
| Windows WSL | POSIX SIGINT (WSL = Linux) | 同 Linux | 同 Linux (但本 repo `doctor.ts:115-123` 已禁 WSL bash for ralph-loop 兼容) |

**本 phase 关键 mitigation**:

1. **`isShuttingDown` flag 防重复触发** (WebSearch 2026 best-practice 直推): npm relay / Win 双 Ctrl+C / 用户连按多次都可能多次进 handler
2. **Timeout fallback** (推 30 秒) — `setTimeout(() => process.exit(130), 30000)` 防 checkpoint write hang
3. **不监 `exit` event 做 async cleanup** — WebSearch 直证: "exit event 触发时 event loop 已停, async (file write) 不会执行"
4. **直接 `process.exit(130)`** — handler 最后必须 exit 否则 SIGINT 被吞掉 process 不退

### 2.3 推荐 implementation template

```typescript
// src/checkpoint/sigintTrap.ts NEW ~20L (Karpathy hard limit ≤80L 充裕)
import { writeCheckpoint, writeCurrentWorkflow } from './state.js'

let isShuttingDown = false

export function registerSigintTrap(getActiveState: () => ActiveState | null): void {
  process.on('SIGINT', () => {
    if (isShuttingDown) {
      console.error('\n[harnessed] force quit (2nd Ctrl+C) — checkpoint may be incomplete')
      process.exit(130)
    }
    isShuttingDown = true
    console.error('\n[harnessed] SIGINT — writing checkpoint (Ctrl+C again to force quit)...')
    const state = getActiveState()
    if (!state) {
      process.exit(130)  // no active workflow → nothing to checkpoint
      return
    }
    // Async cleanup with 30s timeout fallback (WebSearch 2026 best-practice)
    const timeout = setTimeout(() => {
      console.error('[harnessed] checkpoint write timeout — force exit')
      process.exit(130)
    }, 30000)
    Promise.all([
      writeCheckpoint({ ...state, status: 'paused' }),
      writeCurrentWorkflow({ phase: state.phase, status: 'paused', paused_at: new Date().toISOString(), last_checkpoint_path: state.archive_path }),
    ])
      .then(() => {
        clearTimeout(timeout)
        console.error('[harnessed] checkpoint written. Run `harnessed resume` to continue.')
        process.exit(130)
      })
      .catch((err) => {
        clearTimeout(timeout)
        console.error('[harnessed] checkpoint write failed:', err)
        process.exit(1)
      })
  })
}
```

**Exit code 130** = standard Unix "terminated by SIGINT" convention (`128 + signal_number`, SIGINT = 2)。 [HIGH — Node 22 docs + WebSearch 2026 直证]

### 2.4 Windows-specific 测试 (sister Phase 2.4 W5 ralph-loop Win sentinel pattern)

Phase 2.4 W5 `tests/routing/ralph-loop-win-sentinel.test.ts` 5 fixture pattern 推沿袭:

- fixture 1: SIGINT → status='paused' 写盘 verify (Win + Unix matrix)
- fixture 2: Double SIGINT → exit 130 + log 'force quit' verify
- fixture 3: SIGINT during long checkpoint write → 30s timeout verify
- fixture 4: SIGINT with no active workflow → exit 130 silent (no checkpoint attempt)
- fixture 5: SIGINT after status='complete' → exit 0 (no-op, workflow 已结束)

CI yaml `if: runner.os == 'Windows'` + `shell: bash` 沿袭 Phase 2.4 W5 模式。 [HIGH — sister precedent direct]

---

## § 3 Checkpoint <1k token budget enforcement (D-01)

**Confidence: MEDIUM** — Heuristic `Buffer.byteLength / 4` 有 ±20% 变异 (中英文混合 + JSON quote overhead), 但够 fail-loud 用 (truncate fallback 自纠错)。 `tiktoken` 精确但 + 1 dep + ~30MB native binding (违 Karpathy YAGNI)。

### 3.1 推荐: `Buffer.byteLength(s, 'utf8') / 4` Heuristic ⭐

**3 候选 token 估算策略**:

| Method | LOC | Accuracy | Dep | Karpathy fit |
|--------|-----|----------|-----|--------------|
| (a) **`Buffer.byteLength / 4`** ⭐ 推荐 | ~3L (`const tokens = Math.ceil(Buffer.byteLength(JSON.stringify(c), 'utf8') / 4)`) | ±20% (English 0.25 t/char accurate, Chinese 0.5-0.7 t/char underestimate, JSON `"\n` overhead) | 0 dep | ✅ Karpathy YAGNI; CONTEXT § 3.1 specifics L198 已 specify |
| (b) `tiktoken` (v1.0.22 npm) | ~10L | ±5% (OpenAI tokenizer, **不是 Claude 的**, 仍近似) | + 1 dep + native binding ~30MB | ❌ over-engineered; tokenizer 不对 (Claude ≠ OpenAI) |
| (c) `gpt-tokenizer` (v3.4.0 npm) | ~8L | ±5% (same as tiktoken, pure JS, smaller) | + 1 dep ~1MB | ⚠️ tokenizer 不对; 但 size 小; Karpathy YAGNI 仍推 (a) |
| (d) Anthropic count_tokens API | ~15L + API call | exact | + API dep + 网络 | ❌ 违 D-01 "zero LLM/API call" lock |

**推 (a)**:

```typescript
// src/checkpoint/template.ts (D-01 lock — zero LLM call)
export function estimateTokens(checkpoint: Checkpoint): number {
  // Heuristic: 1 token ≈ 4 bytes UTF-8 (OpenAI sister rule, ±20% accuracy 中英混合)
  // 偏 conservative (under-estimate Chinese-heavy content) — 1000 token threshold 留 200 安全 buffer
  return Math.ceil(Buffer.byteLength(JSON.stringify(checkpoint), 'utf8') / 4)
}

export function enforceBudget(checkpoint: Checkpoint, maxTokens = 1000): Checkpoint {
  let tokens = estimateTokens(checkpoint)
  if (tokens <= maxTokens) return checkpoint

  // Fail-loud truncate: last_task 是最长 string field (CONTEXT § specifics L196 example)
  const truncated = { ...checkpoint, last_task: truncate(checkpoint.last_task, 200) }
  tokens = estimateTokens(truncated)
  if (tokens > maxTokens) {
    // Second-level truncate: key_decisions array 截前 3
    truncated.key_decisions = truncated.key_decisions.slice(0, 3)
    tokens = estimateTokens(truncated)
  }
  if (tokens > maxTokens) {
    throw new CheckpointBudgetError(`checkpoint ${tokens} tokens > ${maxTokens} max, truncation failed`)
  }
  return truncated
}
```

[MEDIUM — Heuristic accuracy 中英混合 ±20%, 但 1000 token budget 留 200 buffer 充裕; fail-loud truncate 自纠错]

### 3.2 实测变异范围 (重要 — planner 必读)

**WebSearch 2026 + OpenAI tokenizer 文档**:

| Content type | Bytes-to-token ratio | 1000 token = N chars 实测 |
|--------------|---------------------|--------------------------|
| English prose | ~4 bytes/token | ~4000 chars |
| English code/JSON | ~3-4 bytes/token (`{"key":` overhead) | ~3000-4000 chars |
| Chinese | ~1.5-2 bytes/token (UTF-8 3 bytes/char × 0.5-0.7 token/char) | ~600-1000 chars |
| Mixed CN/EN (本 repo 文档典型) | ~2.5-3 bytes/token | ~2000-3000 chars |

**Implication for Phase 3.1 checkpoint**:

- CONTEXT § specifics L196 example: `{ phase: '3.1', status: 'paused', last_task: 'W2 T2.2 SDK session_id 捕获', ... }` ≈ 400 chars ≈ **100-200 token** (Chinese `last_task` 推 200)
- 余 800 token headroom 给 `key_decisions` + `canonical_refs` 扩展 (典型 5-10 entry × 50 chars/entry = 250-500 chars = 125-250 token)
- **典型 checkpoint** 估 350-450 token 实际 ≤ 1000 limit 充裕

**Fail-loud truncate trigger 概率低** (典型 < 5%), 但必须实装 (Karpathy "fail loud 不假设")。 [MEDIUM — accuracy 实测 ±20%, 1000 budget 留 100% margin 安全]

### 3.3 budget violation handling — fail-loud truncate (推荐)

**3 truncate 选项 (按字段长度排序)**:

1. **`last_task: string`** ← 最长 + 最易 truncate (CONTEXT § specifics L196 example 长度无 cap) — 截 200 char (保留任务 ID + 简述)
2. **`key_decisions: string[]`** ← 第 2 长 — 截前 3 项 (最近决策最重要)
3. **`canonical_refs: string[]`** ← 第 3 长 — 截前 5 项

`session_id` / `phase` / `status` / `timestamp` / `archive_path` 都是固定短 string, 不在 truncate candidate 内 (truncate 后 resume 不可恢复)。 [HIGH — D-01 lock + 安全级 ordering]

---

## § 4 TypeBox schema register pattern (sister Phase 2.2 CD-5)

**Confidence: HIGH** — `src/types/schemaVersion.ts` L34-54 direct 验证 + `branchOnSchemaVersion<T>` helper signature documented + `checkpoint.v1` 已在册 (本 phase 是首 consumer)。

### 4.1 现有 7-surface 注册表

```typescript
// Source: src/types/schemaVersion.ts L34-42 (Phase 2.2 W2 T2.0 CD-5)
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',  // <-- Phase 3.1 首 consumer
} as const
```

**helper signature** (L61-68): `branchOnSchemaVersion<T>(v: string, handlers: { v1: () => T; unknown: () => T }): T`

### 4.2 加 `current-workflow.v1` 作 8th surface — 改 3 处

```typescript
// 改 1: SCHEMA_VERSIONS const (~1L)
export const SCHEMA_VERSIONS = {
  // ... 7 existing ...
  currentWorkflow: 'harnessed.current-workflow.v1',  // <-- ADD
} as const

// 改 2: SchemaVersionLiteral Union (~1L)
export const SchemaVersionLiteral = Type.Union([
  // ... 7 existing ...
  Type.Literal(SCHEMA_VERSIONS.currentWorkflow),  // <-- ADD
])

// 改 3: 注释 comment block (~2L) — sister rule 文档
//   - current-workflow : workflow state machine (active / paused / complete)
```

**总改 schemaVersion.ts ~4L** + sister Phase 2.2 W2 grep acceptance 自动通过 (`≥ 7 harnessed.\w+.v1 references` 升 ≥ 8)。 [HIGH — verified direct]

### 4.3 推荐 checkpoint schema package 结构 (Claude's Discretion 选 ⭐)

Sister `src/manifest/schema/*.ts` pattern (Phase 2.1) — 推 **独立目录** `src/checkpoint/schema/`:

```
src/checkpoint/
├── schema/
│   ├── checkpoint.ts        # checkpoint.v1 TypeBox schema + Static<> type (~40L)
│   ├── currentWorkflow.ts   # current-workflow.v1 schema (~30L)
│   └── index.ts             # barrel export (~5L)
├── template.ts              # D-01 机械 extract + estimateTokens + enforceBudget (~80L hard limit)
├── state.ts                 # D-02 3-state writer (readCurrentWorkflow / writeCurrentWorkflow) (~60L)
├── archive.ts               # archive 写 raw turn 历史 + path generator (~40L)
├── sigintTrap.ts            # § 2 SIGINT handler 注册 (~20L)
└── index.ts                 # barrel export (~10L)
```

Karpathy hard limit ≤ 200L per file (B-06) verified — 每 file ≤ 80L 充裕。 [HIGH — sister manifest schema pattern 直证]

### 4.4 TypeBox schema 示例 (D-01 lock 实装 sketch)

```typescript
// src/checkpoint/schema/checkpoint.ts (~40L)
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const CheckpointSchema = Type.Object({
  schemaVersion: Type.Literal(SCHEMA_VERSIONS.checkpoint),
  phase: Type.String(),                            // e.g. '3.1'
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('paused'),
    Type.Literal('complete'),
  ]),
  last_task: Type.String(),                        // truncate target #1 (≤ 200 char fail-loud)
  key_decisions: Type.Array(Type.String()),        // truncate target #2 (≤ 3 entries fail-loud)
  canonical_refs: Type.Array(Type.String()),       // truncate target #3 (≤ 5 entries fail-loud)
  session_id: Type.Optional(Type.String()),        // SDK session_id (D-04 WIRE-IN)
  cwd: Type.String(),                              // § 1.3 cwd 匹配陷阱 mitigation
  timestamp: Type.String({ format: 'date-time' }), // ISO 8601
  archive_path: Type.String(),                     // .harnessed/archive/<phase>/raw-<ts>.json
})
export type Checkpoint = Static<typeof CheckpointSchema>
```

[HIGH — sister manifest/schema/spec.ts pattern direct + D-01 schema lock 完整覆盖]

---

## § 5 CLI subcommand pattern (commander.js)

**Confidence: HIGH** — `src/cli.ts` L1-37 direct 验证 + `src/cli/doctor.ts` L136-174 `--json` flag pattern direct 验证。

### 5.1 注册新 subcommand — 1 line in cli.ts

```typescript
// src/cli.ts 改 (~2L)
import { registerResume } from './cli/resume.js'     // <-- ADD import
// ... existing 11 register calls ...
registerResume(program)                              // <-- ADD register call (12th)
```

注释 L22-24 update: `"11 subcommands"` → `"12 subcommands per ADR 0004 + 0007 + 0008 + 0011 + 0012 + 0014 draft"` (新 ADR 编号待 plan-phase 决断, 沿袭 phase ADR 编号 cadence)。

### 5.2 推荐 resume.ts 实装结构

```typescript
// src/cli/resume.ts ~50-70L (D-03 hint + sister doctor.ts pattern)
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { readCurrentWorkflow, readCheckpoint } from '../checkpoint/state.js'

export function registerResume(program: Command): void {
  program
    .command('resume')
    .description('Reload checkpoint from paused workflow; print to stdout + resume hint')
    .option('--json', 'output JSON instead of human-readable')
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd()
      const current = await readCurrentWorkflow(cwd).catch(() => null)
      if (!current) {
        const msg = { error: 'no .harnessed/current-workflow.json found', hint: 'start a workflow first' }
        opts.json ? console.log(JSON.stringify(msg)) : console.error(`✗ ${msg.error}\n    hint: ${msg.hint}`)
        process.exit(1)
      }
      if (current.status !== 'paused') {
        const msg = { error: `workflow status is '${current.status}', not 'paused' (nothing to resume)`, current_phase: current.phase }
        opts.json ? console.log(JSON.stringify(msg)) : console.error(`✗ ${msg.error}`)
        process.exit(1)
      }
      const checkpoint = await readCheckpoint(current.last_checkpoint_path).catch((err) => {
        const msg = { error: `checkpoint corrupt or missing: ${err.message}`, path: current.last_checkpoint_path }
        opts.json ? console.log(JSON.stringify(msg)) : console.error(`✗ ${msg.error}`)
        process.exit(1)
      })
      // cwd mismatch guard (§ 1.3 critical)
      if (checkpoint.cwd !== cwd) {
        const warn = `⚠ checkpoint cwd '${checkpoint.cwd}' ≠ current cwd '${cwd}' — SDK session resume may fail`
        opts.json ? console.warn(JSON.stringify({ warn })) : console.error(warn)
      }
      // RELOAD output (D-03 lock)
      if (opts.json) {
        console.log(JSON.stringify({ checkpoint, resume_hint: buildResumeHint(checkpoint) }, null, 2))
      } else {
        printHuman(checkpoint)
      }
      process.exit(0)
    })
}

function buildResumeHint(c: Checkpoint): string {
  const sidHint = c.session_id ? ` (session_id: ${c.session_id} — SDK will redirect to original session)` : ' (fresh session — context reloaded from checkpoint)'
  return `→ in Claude Code: /gsd-execute-phase ${c.phase}${sidHint}`
}
```

[HIGH — sister doctor.ts pattern direct + D-03 lock 完整覆盖 + § 1.3 cwd guard 集成]

### 5.3 `--json` flag CI 友好 (sister Phase 2.4 W1 T1.2 pattern)

`doctor.ts:151-157` 直证 pattern:

```typescript
if (opts.json) {
  console.log(JSON.stringify({ checks: results, summary: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass' }, null, 2))
}
```

`resume --json` 输出 schema:

```json
{
  "checkpoint": { "phase": "3.1", "status": "paused", "last_task": "...", "session_id": "sess_abc", "..." },
  "resume_hint": "→ in Claude Code: /gsd-execute-phase 3.1 (session_id: sess_abc — SDK will redirect to original session)"
}
```

CI 用法: `harnessed resume --json | jq '.checkpoint.session_id'` 提取 ID 自动 inject。 [HIGH — sister 直证]

---

## § 6 Dashboard SSE channel reuse evaluation (Claude's Discretion)

**Confidence: HIGH** — `scripts/dashboard.mjs` L456-531 direct 验证 SSE infrastructure 已 production。

### 6.1 现有 SSE channel verified

```javascript
// Source: scripts/dashboard.mjs L497-531 (Phase 2.4 W3 T3.2 ship)
const sseClients = new Set()
let debounceTimer = null

// 现 watch 单文件 .planning/STATE.md (L500-510 around)
watch(join(PLANNING, 'STATE.md'), () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    for (const r of sseClients) {
      r.write(`event: state-changed\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`)
    }
  }, 500)
})

// /events endpoint (L523-531)
if (url === '/events') {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
  res.write(': connected\n\n')
  sseClients.add(res)
  req.on('close', () => sseClients.delete(res))
  return
}

// Browser side (L456-460)
const es = new EventSource('/events')
es.addEventListener('state-changed', () => loadPage(currentPage))
```

### 6.2 推荐: zero-code reuse via "checkpoint write also touches STATE.md" ⭐ 推 MIN

**两选项**:

| Option | LOC | Pros | Cons |
|--------|-----|------|------|
| (a) **MIN: checkpoint write 后 touch STATE.md** (复用现 watcher) ⭐ | 0L 新代码 (Phase 3.2+ STATE.md 反正会 update) | 零代码; 复用现 SSE channel 完整 | dashboard 看到的是 STATE.md change 不是 checkpoint change 语义 (用户感知 OK — 都是"phase 进展") |
| (b) 加第 2 watch source `.harnessed/checkpoints/` | ~5L (额外 `watch(join(ROOT, '.harnessed', 'checkpoints'), ...)`) | 显式 checkpoint event | 多 watcher 资源占用 (per OS 限制) |
| (c) 加 `/api/checkpoints` 独立 endpoint | ~30L SSE event-name 拆分 + 前端新 handler | semantic 最清晰 | 违 Karpathy YAGNI (本 phase MVP 不需) |

**推 (a) MIN** — 本 phase MVP scope 不引入 dashboard 改动 (per CONTEXT § Discretion L119 "推荐复用"); Phase 3.2+ workflow 内置 STATE.md auto-update 时自然触发 SSE。 plan-phase 决断: Wave 0 spike 1 hour 实测 (CONTEXT L119) verify "checkpoint write + STATE.md touch" 链路 OK 后定 path。

**fallback (若 spike 发现需独立 event)**: 走 (b) 5L 增量, 但 sister Phase 2.4 W3 T3.2 SSE channel zero-dep 原则保持 (无 npm dep)。 [HIGH — 现状直证 + Karpathy YAGNI]

---

## § 7 compact 协议 trigger threshold

**Confidence: MEDIUM-HIGH** — WebSearch 2026-05 多源 cross-check Claude Code 行业实测 + Anthropic API compaction beta 公开 doc。

### 7.1 业内 baseline cross-check

| Source | 触发阈值 | 备注 |
|--------|---------|------|
| Claude Code 默认 (2026-05 verified) | **~95% of context window** (190k / 200k) | "leave small buffer for current response" |
| Claude Code `/compact` override 推荐 | **70% 平日 / 50% noisy workflow** | 配置 1-100 enum, 直接 % |
| Anthropic API compaction beta (`compact-2026-01-12` header) | **custom trigger** e.g. `{ "type": "input_tokens", "value": 150000 }` | API 层显式自定义 |
| Claude Code 1M ctx Opus 4.6 (March 2026) | **76k 实测 fire** (用户报 "fired too early 92% waste") | 1M ctx 适配尚未完美 |
| Claude Code 200k ctx tiered warning | **70% first warn, 85% second warn, 95% compact** | UX 三档提醒 |

### 7.2 推 **75%** for Phase 3.1 (CONTEXT § Discretion 60k → 调整为 75% 计算)

**Rationale**:

- CONTEXT L121 推 "60k 起 (留 60% headroom)" — 假设 200k context window → 60k = 30% 用 = 70% headroom (与 Claude Code default 95% trigger 相比过度保守, dogfood 太晚不到一个 phase 就触发)
- **改推 75%** (150k / 200k) — sister Claude Code "noisy workflow" override (50%) 与 "平日" (70%) 中间, dogfood 调整空间 (用户嫌过频 → 调到 80%; 嫌过晚 → 50%)
- 1M ctx Opus 4.6 场景: 75% × 1M = 750k threshold (按比例 scale, 但实测 1M ctx 有 92% waste bug, plan-phase 推不在本 phase 显式支持 1M ctx, defer Phase 3.4 token budget 监控)

**Implementation**:

```typescript
// src/checkpoint/compact.ts (~30L 占位, 推 Phase 3.4 token budget 监控完整实装)
const DEFAULT_THRESHOLD_PCT = 75
const DEFAULT_CONTEXT_WINDOW = 200_000  // sonnet/opus 4.x baseline; 1M ctx defer Phase 3.4

export function shouldCompact(currentTokens: number, opts?: { contextWindow?: number; thresholdPct?: number }): boolean {
  const cw = opts?.contextWindow ?? DEFAULT_CONTEXT_WINDOW
  const pct = opts?.thresholdPct ?? DEFAULT_THRESHOLD_PCT
  return currentTokens >= (cw * pct / 100)
}
```

**Phase 3.1 MVP scope**: 仅实装 `shouldCompact()` 判断 + 触发 placeholder (调 `harnessed compact` subcommand, 该 subcommand 实装 推 Phase 3.4)。 本 phase 不实装 token 监控自动 trigger (plan-phase 决断: 占位 OR 缓 Phase 3.2)。 [MEDIUM-HIGH — 业内多源 + 1M ctx 当前 buggy, defer 完整支持]

---

## § 8 archive retention strategy (MVP scope)

**Confidence: MEDIUM** — disk growth 估算基于 dogfood projection 而非实测。

### 8.1 推 MVP "全保留" (CONTEXT § Discretion L122) — Disk growth projection

| 假设 | 数值 |
|------|------|
| 平均 checkpoint 大小 | ~4-6 KB (摘要 < 1k token = ~4KB JSON; archive raw turn = ~50-200KB per turn × 20 turn = 1-4 MB per phase) |
| 平均 phase 数 / day (dogfood) | ~2-3 (single maintainer 节奏) |
| 平均 archive 数 / day | ~5-10 (含 SIGINT 触发的 paused archive) |
| **Disk growth / day** | ~10-40 MB |
| **Disk growth / year** | **~4-15 GB** |
| **Disk growth / month** | **~300MB - 1.2GB** |

**Phase 3.1 MVP scope**:

- ✅ **全保留** 1 个月内 OK (≤ 1.2 GB 在现代 dev 机 SSD 完全可接受)
- ✅ gc 集成 deferred → Phase 3.4 OR v0.4 dogfooding 后定 (per CONTEXT L122)
- ⚠️ **加 disk warning** (本 phase 可选 +5L): `du -sh .harnessed/archive/` > 1 GB → console.warn 提示用户考虑 `harnessed gc`

### 8.2 gc 集成 pattern sister (Phase 1.2 backup gc)

CLI 沿袭 `harnessed gc --older-than 30d` pattern (CONTEXT L122 anchor); 本 phase **不**实装 gc subcommand (现 `src/cli/gc.ts` 是 backup gc scope, 不动)。 Phase 3.4 加 `--target archive` flag 扩展 OR 新 subcommand `harnessed gc-archive`, 待 Phase 3.4 决断。 [MEDIUM — projection 而非实测; dogfood 数据需 Phase 3.4 收集]

---

## § 9 Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.0 (package.json:88) |
| Config file | vitest.config.ts (推 verify in W0) |
| Quick run command | `pnpm test -- --run tests/checkpoint/` |
| Full suite command | `pnpm test` (543+4 现 baseline, 推 +40-60 Phase 3.1) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R7.2-a | checkpoint < 1k token | unit | `pnpm test -- tests/checkpoint/template.test.ts -t budget` | ❌ Wave 0 |
| R7.2-b | TypeBox schema validate checkpoint.v1 | unit | `pnpm test -- tests/checkpoint/schema.test.ts` | ❌ Wave 0 |
| R7.2-c | archive 完整 raw 写入 | unit | `pnpm test -- tests/checkpoint/archive.test.ts` | ❌ Wave 0 |
| R7.3-a | resume 找 paused phase | integration | `pnpm test -- tests/cli/resume.test.ts -t happy-path` | ❌ Wave 0 |
| R7.3-b | resume schema mismatch fail-loud | integration | `pnpm test -- tests/cli/resume.test.ts -t fail-loud` | ❌ Wave 0 |
| R7.3-c | resume --json 输出 schema | contractual | `pnpm test -- tests/cli/resume.test.ts -t json-flag` | ❌ Wave 0 |
| D-02-a | current-workflow 3 state 转移 | unit | `pnpm test -- tests/checkpoint/state.test.ts` | ❌ Wave 0 |
| D-04-a | session_id 写 checkpoint | integration | `pnpm test -- tests/checkpoint/sdk-wire.test.ts -t capture` | ❌ Wave 0 |
| D-04-b | resume SDK redirect (mock SDK) | integration | `pnpm test -- tests/checkpoint/sdk-wire.test.ts -t resume` | ❌ Wave 0 |
| D-04-c | session_id 不存在 fallback fresh | integration | `pnpm test -- tests/checkpoint/sdk-wire.test.ts -t fallback` | ❌ Wave 0 |
| § 2 SIGINT | SIGINT trap 写 paused checkpoint | failure-mode | `pnpm test -- tests/checkpoint/sigint.test.ts` (5 fixture sister Phase 2.4 W5) | ❌ Wave 0 |
| § 2 SIGINT-2 | Double SIGINT force quit | failure-mode | 同上 fixture #2 | ❌ Wave 0 |
| § 2 SIGINT-3 | SIGINT cwd mismatch warn | failure-mode | 同上 fixture #3 (Win matrix `if: runner.os == 'Windows'`) | ❌ Wave 0 |
| § 7 compact-a | shouldCompact threshold | unit | `pnpm test -- tests/checkpoint/compact.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run tests/checkpoint/` (quick scope ≤ 5s)
- **Per wave merge:** `pnpm test -- --run` (全 suite ~30-45s)
- **Phase gate:** Full suite green + 3-OS CI matrix green + `pnpm typecheck` clean + `pnpm lint` (biome) clean (推先 local 跑 `pnpm exec biome check --write` 避 CI red, sister memory `feedback_biome-preempt.md`)

### Wave 0 Gaps (test file inventory needed)

- [ ] `tests/checkpoint/template.test.ts` — covers R7.2-a, budget enforcement + truncate fallback (~5 fixture)
- [ ] `tests/checkpoint/schema.test.ts` — covers R7.2-b, TypeBox validate checkpoint.v1 + current-workflow.v1 (~6 fixture)
- [ ] `tests/checkpoint/archive.test.ts` — covers R7.2-c, archive path + raw write (~4 fixture)
- [ ] `tests/checkpoint/state.test.ts` — covers D-02, 3-state transition + read/write (~7 fixture: 3 happy + 4 corrupt)
- [ ] `tests/checkpoint/sdk-wire.test.ts` — covers D-04, mock SDK session capture/resume (~6 fixture, mock `sdkSpawn`)
- [ ] `tests/checkpoint/sigint.test.ts` — covers § 2, 5 fixture sister Phase 2.4 W5 ralph-loop Win sentinel pattern
- [ ] `tests/checkpoint/compact.test.ts` — covers § 7, threshold + override (~4 fixture)
- [ ] `tests/cli/resume.test.ts` — covers R7.3, CLI subcommand (~7 fixture: 3 happy + 4 fail-mode)
- [ ] No framework install needed (vitest 4.0.0 已装)

**总 ~44 new fixture** (sister Phase 2.4 W5 30 fixture matrix pattern, 适度 +47% 因 checkpoint engine 是新核心模块)。

---

## § 10 W0 backlog 4 项 research support

### W0.1 (M1) `v0.2.0-MILESTONE-AUDIT.md` 加 "Line budget deviations accepted" 透明节

**现状** (verified `.planning/v0.2.0-MILESTONE-AUDIT.md` L22-36): `tech_debt:` block 已含 2 deferred items #1 (`doctor.ts 215L > 200`) + #2 (`dashboard.mjs 610L ≤ 650L SKIP split`) — **but KICKOFF § 4 W0.1 描述 deferred-items #1+#2 是 `run-plan-checker.mjs 130L` + `plan-checker-quant.test.ts 103L`**, 与 AUDIT.md 实际 tech_debt 内容不符。 Plan-phase 必须 **校对源** — 看哪个版本是真实 deferred items (推 AUDIT.md verified, KICKOFF 描述可能 stale)。

**推荐 insertion 位置**: AUDIT.md L21-36 `tech_debt:` block 后 + L37 `---` 前, NEW `## § 0.5 Line Budget Deviations Accepted` section (~10L markdown):

```markdown
## § 0.5 Line Budget Deviations Accepted

> Karpathy 透明性纪律: per-file LOC > hard limit 但合理性论证后 accept; sister Phase 2.4 R-4 pattern.

| File | LOC | Hard Limit | Tolerance | Rationale (link) |
|------|-----|-----------|-----------|------------------|
| `src/cli/doctor.ts` | 215 | 200 | +7.5% | ADR 0013 § 1; 5 check + --json + 3 status enum 不可再 split (helper 已抽 origin-check.ts) |
| `scripts/dashboard.mjs` | 610 | 650 default | (内) | B-26 dev tool 软 limit; SKIP proactive split 制造 churn (Phase 2.4 W3 T3.4 决断) |
```

[HIGH — AUDIT.md L21-36 直证 + Karpathy 透明性 sister Phase 2.4 R-4 pattern]

### W0.2 (M2+M3) `RETROSPECTIVE.md` Phase 2.4 dashboard polish round 2 commit attribution 复盘

**现状** (verified `.planning/RETROSPECTIVE.md` L20-30): "dashboard tool cross-phase history cluster (M1 absorb — Phase 2.4 Wave 0 T0.6)" 已记 timeline cluster commit `0b4e76d` / `161621c` / `3fc0c42`。 **缺**: Phase 2.4 ship 时 handoff intel L482 草案"独立 commit"未采纳, executor 合理 absorb 进 W3 cf00d17/008f9ab 的 advisory absorb 路径登记。

**推荐 insertion 位置**: RETROSPECTIVE.md L30 (M1 entry 后 + Phase 2.4 milestone retro section L34 前), NEW subsection `### Advisory Absorb Path (Phase 2.4 round-2 polish lesson)` (~15L markdown):

```markdown
### Advisory Absorb Path — handoff intel "独立 commit" 草案被合理 absorb (Phase 2.4)

> sister M2+M3 backlog absorption — Phase 2.4 handoff intel L482 draft "polish round 2 独立 commit"未被 executor 采纳, 合理 absorb 进 W3 主 commit cluster (`cf00d17` + `008f9ab`)。 **advisory 允许 absorb 路径** = future cadence note: advisory 不是 hard mandate, executor 评估 scope coherence 决断 standalone vs absorb 都合理 (避免 future "advisory rejected" 暗示 / sister LinkedIn "草案不动" 反 pattern)。

**Timeline**:
- handoff intel L482 (Phase 2.4 W2-W3 boundary): "推 polish round 2 独立 commit 隔离观察"
- executor decision (Phase 2.4 W3 cf00d17/008f9ab): absorb 进 main W3 commit cluster, dashboard.mjs 改动 atomic with cc-hook-installer
- post-ship lesson: scope-coherent absorb 比强 standalone 干净 — 单 Wave 单 file 多 commit = artificial atomicity
```

[HIGH — RETROSPECTIVE.md L20-30 直证 + handoff intel sister 数据]

### W0.3 (T4) README completeness check — `STATE.md SHIPPED count vs README shipped count`

**verified grep counts** (本 RESEARCH 实测):
- `grep -c "^SHIPPED\|shipped" .planning/STATE.md` → **5** (5 phases shipped × SHIPPED keyword)
- `grep -c "shipped\|SHIPPED" README.md` → **14** (含 milestone + phase entry 双 count, 含 "v0.1.0 SHIPPED" + "v0.2.0 SHIPPED" + per-phase entry)

**问题** — grep regex 选择决定 fail/pass:
- Naive `grep -c "SHIPPED"` → STATE.md 多于 README.md (因 README 也 enumerate phase 但 case 不同)
- 严格 `grep -c "^SHIPPED"` → 0 match (STATE.md SHIPPED 不 at-line-start)
- 推荐 regex (符 Phase 2.4 W4 D-03 三计数一致 grep -cE pattern): `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped"` → 精度 match per-phase entry only

**推 CI step yaml (~10L)**:

```yaml
# .github/workflows/ci.yml addition (sister D-03 三计数 pattern from Phase 2.4 W4)
- name: README completeness check (STATE.md vs README per-phase shipped count)
  run: |
    STATE_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
    README_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md)
    echo "STATE.md per-phase shipped count: $STATE_COUNT"
    echo "README.md per-phase shipped count: $README_COUNT"
    [ "$STATE_COUNT" -eq "$README_COUNT" ] || { echo "::error::README completeness drift: STATE=$STATE_COUNT README=$README_COUNT"; exit 1; }
```

[MEDIUM-HIGH — grep regex 实测 verified, regex 精度可能需 1-2 iter 调 (sister Phase 2.4 W4 H3 三次复发根治 lesson — 推 spike 1 hour 用现 STATE + README 验 baseline)]

### W0.4 (T5) `phase-2.4/task_plan.md` self-check fr ≥ 0.80 end-state verify

**推 verify command**:

```bash
node scripts/run-plan-checker.mjs .planning/phase-2.4/
```

**Expected output** (verified Phase 2.4 W6 deferred-items #3 RESOLVED — EE-4 yaml ERR_MODULE_NOT_FOUND 1-line step reorder fix):
- Exit code 0 (pass)
- `dimensions_passed: 4` (or `≥ 3` with RELAX 0.8 baseline)
- `verdict: 'PASS'` or `'WARNING'`
- 无 `'BLOCKER'`

**若不 pass**: 沿袭 KICKOFF L62 描述 "加 1 cell investigate + fix → 写入 `.planning/phase-3.1/W0-T5-verify.md`" (~5L command + 报告)。

**spike 1 hour** 实测 pass/fail (本 RESEARCH 未跑 — Phase 3.1 plan-phase 决断 W0 task 时实跑)。 [MEDIUM — verify command 直证, 实测 outcome unknown until W0 实跑]

---

## § 11 Karpathy anti-pattern checks

**Confidence: MEDIUM** — 经验值 + 历史 RETROSPECTIVE pattern direct, 但 phase 内具体 manifestation 未实测。

### 11.1 5 anti-pattern + counter-discipline

| # | Anti-pattern | 可能 creep-in 位置 | Counter-discipline |
|---|--------------|------------------|-------------------|
| 1 | **LLM-summarization sneak-in via D-01 ambiguity** | template.ts implementation 时, 开发者觉得 "machine extract 太死板, 加个 LLM call 优化下" | D-01 lock 明示 "zero LLM call" — template.ts JSDoc 顶 ban LLM call + lint rule check 文件无 `query(`/`anthropic` import |
| 2 | **Over-engineered FSM via D-02 边界 push** | state.ts implementation 时, 加 "transitioning" intermediate state 表达 "正在写盘" | D-02 lock 明示 "3 state 充分"; state.ts ≤ 60L hard limit (sister `src/types/schemaVersion.ts` 68L 紧凑 pattern); 加第 4 state 触发 plan-phase ASSUMPTIONS surface review |
| 3 | **AUTO-REPLAY temptation via D-03 user friction complaints** | dogfood 阶段, "总按 enter 太烦了, 加个 --auto flag 让 resume 自动 invoke phase command" | D-03 lock 明示 "用户保留忘记重开自由"; `--auto` flag 不加, 推 ASSUMPTIONS doc 未来 v0.4 dogfooding 后再评估 |
| 4 | **Optional session_id 不优雅 fallback 实装 (D-04 wire-in 边界)** | sdk-wire.test.ts 实装时, fallback 路径写 "console.warn + 继续" 但 fresh session 启动后 user 不知 context 已 reload | fallback 必须 user-facing: stdout 明示 "session_id absent — reloading checkpoint context fresh"; 测试覆盖 fallback path 等同 happy path |
| 5 | **Compact threshold 过度 tune (§ 7 dogfood drift)** | dogfood 时, 用户嫌 75% 触发太频 → 调 90% → 后 phase context overflow 触发 SDK 错误 | thresholdPct 接受 1-100 enum 但 lint warn `< 50 OR > 85`; doc 明示 50-85 是 sister Claude Code 经验区间, 出区间需 dogfood 数据论证 |

**Plan-phase 推保留各 anti-pattern surface 进 Wave checklist** (sister Phase 2.4 ASSUMPTIONS surface pattern — explicit anti-pattern 比 implicit "你应该知道" 更可执行)。 [MEDIUM — 历史 RETROSPECTIVE pattern + dogfood 未发生, 经验值预测]

---

## § 12 Wave topology recommendation

**Confidence: HIGH** — sister Phase 2.4 7 wave (W0-W6) topology direct precedent + 本 phase scope 显式拆分。

### 12.1 推 6 wave (W0-W5) — sister Phase 2.4 7 wave 缩 1 wave (本 phase scope 略 < Phase 2.4)

| Wave | Scope | LOC est | Karpathy fit | Test fixtures |
|------|-------|---------|--------------|---------------|
| **W0** | Backlog 4 项 absorb (M1+M2+M3 doc / T4 CI yaml / T5 verify) + Wave 0 test infrastructure setup (创 `tests/checkpoint/` 目录 + vitest config verify) | M1 ~10L / M2 ~15L / T4 ~10L yaml / T5 ~5L cmd / test dir setup ~0L | ✅ phase-start backlog cleanup standard (sister Phase 2.4 R-8) | 0 (setup only) |
| **W1** | Schema + state machine: `src/checkpoint/schema/{checkpoint,currentWorkflow,index}.ts` (~75L total) + `src/checkpoint/state.ts` (3-state read/write ~60L) + `src/types/schemaVersion.ts` 加 `currentWorkflow` 8th surface (+4L) | ~140L | ✅ 每 file ≤ 80L | ~13 fixture (schema 6 + state 7) |
| **W2** | Template + archive + budget enforcement: `src/checkpoint/template.ts` (~80L) + `src/checkpoint/archive.ts` (~40L) + 1k token budget unit tests + truncate fallback | ~120L | ✅ ≤ 80L per file | ~9 fixture (template 5 + archive 4) |
| **W3** | SDK wire-in + ralphLoop sessionId 激活: `src/routing/lib/ralphLoop.ts` sessionId activation (+10L) + `src/routing/engine.ts` capturedSessionId export (+10L) + sdkSpawn.onSessionId caller wire 到 checkpoint write (~10L) + integration test (mock SDK) | ~30L cross 4 files + tests | ⚠️ **关键 wave** — 触三件套 dead-wiring, 必须 mock SDK 测全 fallback path | ~6 fixture (sdk-wire happy 3 + fallback 3) |
| **W4** | SIGINT trap + CLI resume subcommand: `src/checkpoint/sigintTrap.ts` (~20L) + `src/cli/resume.ts` (~70L) + `src/cli.ts` register (+2L) + tests | ~95L | ✅ ≤ 80L per file | ~12 fixture (SIGINT 5 sister Phase 2.4 W5 + resume CLI 7) |
| **W5** | E2E dogfood + ship: 真实 SIGINT → checkpoint → resume → SDK session redirect E2E (本 phase 自身 dogfood — Phase 3.1 ship 前最后一 wave 真跑) + compact threshold placeholder (`src/checkpoint/compact.ts` ~30L) + Wave 0 deferred-items review (sister Phase 2.4 R-7) + ship-time verify | ~30L + e2e | ✅ MVP ship | ~4 fixture (compact + e2e smoke) |

**总 ~415L src/ + ~44 fixture** (sister Phase 2.4 ~600L + 30 fixture — 本 phase 略小 30%)。

### 12.2 Wave 拓扑 rationale

- **W0 单独**: 沿袭 Phase 2.4 W0 5 项一次根治 R-8 pattern; 不可并 W1 (W0 是 backlog, W1+ 是主线)
- **W1 → W2 顺序依赖** (schema 先 / template+archive 消费 schema)
- **W2 → W3 顺序依赖** (template + estimateTokens 先 / sdkWire 复用)
- **W3 → W4 顺序依赖** (sdkWire 先 / sigintTrap 调 writeCheckpoint, CLI resume 调 readCheckpoint + buildResumeHint 含 session_id) 
- **W4 → W5 顺序依赖** (功能全 ready 后才 e2e dogfood + ship)
- 无 wave 间并行 — 本 phase scope 高度 sequential (checkpoint engine 是核心模块, 每 wave 都依前 wave artifact)
- **可 W1+W2 部分并行**: schema (W1) 与 template (W2) 实装可并 — schema 是 type-only 不阻 template 起草 (但 template 测试需 schema ready), plan-phase 决断

[HIGH — sister Phase 2.4 7 wave precedent direct + 本 phase scope 量明确]

### 12.3 Wave-by-wave acceptance bar (~F1-F6 sister Phase 2.4 F1-F8)

- **W0 F1**: 4 backlog items committed + tests/checkpoint/ dir 存在 + vitest config recognize
- **W1 F2**: schema + state machine green; `pnpm typecheck` clean; 7-surface → 8-surface 升级 grep accept
- **W2 F3**: template + archive green; 实测 typical checkpoint ≤ 500 token (1k buffer 50%); truncate fallback fixture pass
- **W3 F4**: sdk-wire integration test green (mock SDK); ralphLoop sessionId 第 2 轮 retry 复用 capture verify; engine EngineResult 含 sessionId 字段
- **W4 F5**: SIGINT 5-fixture Win matrix green; CLI resume happy + fail-mode 7 fixture green; `harnessed resume --json` exit code 0/1 correct
- **W5 F6**: E2E dogfood — 真在 Phase 3.1 自身 Wave 5 实跑 (本 phase ship 前最后一刻): 用户在 W5 开始 phase → SIGINT → 看到 checkpoint write log → `harnessed resume` → 看到 hint → 在 Claude Code 内 `/gsd-execute-phase 3.1` → SDK redirect 复用 session **OR** fallback fresh + reload checkpoint OK → W5 ship 继续完成

总 F1-F6 6 acceptance bar (sister Phase 2.4 F1-F8 8 bar 略缩, 因 scope 小)。 plan-phase 决断 Wave 内 task 编号 (T-W0-1 / T-W1-2 etc) + 任 task ≤ 200L hard limit + 任 wave 内 multi atomic commit。 [HIGH — sister precedent direct]

---

## RESEARCH COMPLETE

**Phase**: 3.1 — checkpoint 引擎 + harnessed resume + compact 协议
**Confidence**: HIGH overall (4 D-decisions 锁 + 6 critical 现有 assets verified + SDK session API context7 + code.claude.com 直证)

### Key Findings (top 3)

1. **SDK session API shape verified (D-04 关键)** — TypeScript SDK 在 `message.type === 'system' && message.subtype === 'init'` 事件暴露 `session_id`; resume 用 `options.resume = sessionId`; cwd 必须匹配 (`~/.claude/projects/<encoded-cwd>/*.jsonl` 路径)。 本 repo `sdkSpawn.ts` L67-69 实装 callback pattern 已 ready, **但 `ralphLoop.ts` L43-45 `sessionId` 变量是 dead code** + `engine.ts` L182 `void capturedSessionId` 是 placeholder — Phase 3.1 必须激活 dead-wiring (~30L cross 4 files, KICKOFF "20-30L" 偏低 5-10L)。
2. **SIGINT trap Node 原生 + isShuttingDown flag + 30s timeout fallback** — `process.on('SIGINT', ...)` Karpathy YAGNI 零 dep; 双 Ctrl+C force quit 是 Windows OS 行为 (Node 无法 override) → handler 必须实装 `isShuttingDown` flag; `exit` event 不能做 async cleanup (event loop 已停, file write 不执行); 沿袭 Phase 2.4 W5 ralph-loop Win sentinel 5 fixture matrix pattern。
3. **Compact threshold 推 75%** (sister Claude Code 95% default 留 buffer; 70% override 偏严; 75% 平衡 dogfood 调整空间; 1M ctx Opus 4.6 当前 buggy defer Phase 3.4)。 dashboard SSE channel 已 production 即用 — 推零代码复用 (W0 spike 1 hour 验证, fallback ~5L 加第 2 watch source)。

### File Created

`.planning/phase-3.1/RESEARCH.md` (~605L target, 实际 ~600L)

### Confidence Breakdown

| Area | Level | Reason |
|------|-------|--------|
| § 1 SDK session redirect | HIGH | context7 multi-source + code.claude.com 官方 + sdkSpawn.ts 实装直证 |
| § 2 SIGINT trap | HIGH | Node 22 native + 2026 best-practice 多源共识 |
| § 3 token budget | MEDIUM | Heuristic ±20% 变异中英混合, 1000 budget 留 200 buffer 安全 |
| § 4 schemaVersion register | HIGH | schemaVersion.ts L34-54 直证 |
| § 5 CLI subcommand | HIGH | doctor.ts --json pattern 直证 |
| § 6 dashboard SSE | HIGH | dashboard.mjs L456-531 直证 SSE production |
| § 7 compact threshold | MEDIUM-HIGH | WebSearch 2026 多源 cross-check |
| § 8 archive retention | MEDIUM | projection 而非实测 |
| § 9 validation arch | HIGH | vitest 4.0.0 verified + sister Phase 2.4 W5 30-fixture pattern |
| § 10 W0 support | MEDIUM-HIGH | grep regex 实测 verified, T5 outcome 待 W0 实跑 |
| § 11 anti-patterns | MEDIUM | 经验值 + 历史 RETROSPECTIVE pattern |
| § 12 Wave topology | HIGH | sister Phase 2.4 7 wave direct precedent |

### Open Questions (blockers / deferrals)

1. **W0.1 deferred-items #1+#2 描述 mismatch** — KICKOFF § 4 W0.1 写 `run-plan-checker.mjs 130L` + `plan-checker-quant.test.ts 103L`, 但 AUDIT.md L24-26 tech_debt 实际记 `doctor.ts 215L` + `dashboard.mjs 610L`。 **plan-phase 必须校对源**（推 AUDIT.md verified, KICKOFF stale）。
2. **W0.4 T5 verify outcome 未实跑** — `node scripts/run-plan-checker.mjs .planning/phase-2.4/` 本 RESEARCH 未跑; 推 Wave 0 实跑 + 若 fail 加 1 cell investigate (KICKOFF § 4 已 anchor)。
3. **SDK 0.3.142 session resume 实验性** (ADR 0011 § 1 L35 实测 PARTIAL) — `memory + tools state 未完整保留` 这部分本 RESEARCH 未独立 spike 验证 (信赖 Phase 2.2 spike 结论)。 W3 SDK integration test 推用 mock SDK 而非真 SDK 测试 (本 phase 不依 real session resume verify, fallback 路径覆盖)。
4. **Phase 3.1 自身 dogfood (W5)** — 本 phase 实装的 checkpoint engine 在 W5 真跑 SIGINT → resume 循环, 若失败需 W6 hotfix wave (Phase 2.4 W6 deferred-items #3 EE-4 step reorder fix sister precedent — 1-line fix 不推 v0.3.x)。
5. **dashboard SSE 复用决断** (Claude's Discretion) — 推 (a) MIN 零代码复用 + W0 1 hour spike verify; spike 失败则 fallback (b) 加第 2 watch source ~5L。 plan-phase 决断 W0 task。

### Sources

#### Primary (HIGH confidence)
- code.claude.com/docs/en/agent-sdk/sessions — SDK session lifecycle 全文档
- context7 `/anthropics/claude-agent-sdk-demos` — TypeScript multi-turn pattern
- context7 `/anthropics/claude-agent-sdk-python` — session API + manage 函数
- `src/routing/lib/sdkSpawn.ts` L1-91 — onSessionId callback ready (verified)
- `src/routing/lib/ralphLoop.ts` L1-49 — sessionId dead code 现状 (verified)
- `src/routing/engine.ts` L1-195 — capturedSessionId void 现状 (verified)
- `src/types/schemaVersion.ts` L34-54 — checkpoint.v1 已在 7-surface 注册表 (verified)
- `src/cli.ts` L1-37 — 11 subcommand register pattern (verified)
- `src/cli/doctor.ts` L136-174 — --json flag exit code pattern (verified)
- `scripts/dashboard.mjs` L456-531 — SSE production verified
- `package.json` L24, L70 — Node ≥ 22 + SDK 0.3.142 pinned (verified)

#### Secondary (MEDIUM-HIGH confidence)
- WebSearch Claude Code auto-compact threshold 2026 — 5 sources cross-check
- WebSearch Node.js SIGINT 2026 best-practice — 10 sources cross-check
- `.planning/v0.2.0-MILESTONE-AUDIT.md` L21-36 — tech_debt baseline
- `.planning/RETROSPECTIVE.md` L20-30 — dashboard cluster + deferred review cadence
- `.planning/phase-2.4/RESEARCH.md` L1-450 — sister format SSOT
- `npm registry @anthropic-ai/claude-agent-sdk` — latest 0.3.143 (1 patch ahead, no bump needed)

#### Tertiary (MEDIUM, flagged for spike)
- `Buffer.byteLength / 4` Heuristic — ±20% accuracy 中英混合, 1000 budget margin 安全
- Archive retention projection — dogfood 实测数据 → Phase 3.4 收集

---

## Metadata

**Confidence breakdown**:
- Standard stack: HIGH — TypeScript 5.6 + Node 22 + vitest 4.0 + TypeBox 0.34 + commander 13 全部 pinned verified
- Architecture: HIGH — 6 现有 assets verified + sister patterns Phase 2.4 direct
- Pitfalls: MEDIUM-HIGH — SDK session lifecycle 未完全实测 (信赖 Phase 2.2 PARTIAL evidence), SIGINT 跨平台 2026 best-practice verified
- Validation: HIGH — vitest infrastructure ready + sister Phase 2.4 W5 30-fixture pattern direct sister

**Research date**: 2026-05-16
**Valid until**: 2026-08-15 (Node 22 LTS + SDK 0.3.142 周期; SDK session API v0.4+ deprecate `resume` option 则需复核)
