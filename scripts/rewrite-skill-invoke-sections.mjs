#!/usr/bin/env node
// issue #1 — Rewrite each workflows/<...>/SKILL.md (+ SKILL.zh-Hans.md sibling)
// "How to invoke" / "如何调用" section to the CC-NATIVE invocation.
//
// History: the v3.4.4 version of this script hard-coded
//   `echo "$ARGUMENTS" | harnessed run <name> --task-stdin`
// as the invocation body. The v4.0 architecture migration rewrote the SIBLING
// `~/.claude/commands/<name>.md` generator (src/cli/lib/generateCommands.ts) to
// CC-native orchestration (`harnessed gates` → `harnessed prompt` → CC-native
// subagent spawn → `harnessed checkpoint`) and explicitly NOT `harnessed run`
// (which is now CI/headless only — it does an in-process nested SDK spawn that
// blocks the session, bypasses Agent Teams, and HANGS when invoked from inside a
// Claude Code session). But the SKILL.md "How to invoke" sections were never
// migrated — they kept pointing at `harnessed run`, so Skill-tool triggers drove
// the deprecated, broken path. This is the root cause of issue #1.
//
// This script is the SoT for the SKILL invoke section. Re-run it after editing
// `buildSection*` to re-render all SKILL files. Idempotent via the v4 marker.
//
// Skips legacy v2 dirs (plan-feature / execute-task / verify-work).
//
// SoT DISCIPLINE (learned the hard way at v4.10.0): between v4.9.3 and v4.10.0 five
// features were hand-edited into the rendered SKILL files WITHOUT being folded back
// here (intent banner / native `/goal` gate fallback / research delivery contract /
// auto deferrable-relay + lite path / discuss new-project bootstrap). The marker was
// never bumped, so the drift stayed invisible — and the next legitimate bump would
// have silently deleted all five. They are reconciled below. Never hand-edit a
// rendered invoke section: change the builder here and re-run.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const WORKFLOWS = join(REPO_ROOT, 'workflows')

const DEPRECATED = new Set(['plan-feature', 'execute-task', 'verify-work'])

// Bump on every content change so re-runs detect "already migrated" vs "needs
// rewrite". Digit-loose `v\d+\.\d+\.\d+` per generateCommands.ts marker regex.
// Skip-current keys off NEW_MARKER only, so a previous-marker section (v4.9.2)
// is always re-rendered to the current shape.
//
// MARKER vs THE BYTE GOLDEN (v16.0 Phase 65 ruling). The marker string is part of
// the rendered artifact, so bumping it moves every hash in
// tests/fixtures/render-golden/claude-*.json — it collides head-on with the
// "rewriting prose into `{{ host.* }}` leaves the claude artifact byte-identical"
// invariant. The marker version is NOT user-visible wording. When a bump is
// genuinely needed, re-recording the claude golden is allowed, but the SAME commit
// must prove by diff that NOTHING except the marker line changed — otherwise the
// re-record is hiding a regression. Phase 65 deliberately does NOT bump: it only
// moved host-specific prose behind placeholders that restore the identical bytes,
// so the marker's discriminating power has no reason to change.
const OLD_MARKER = '<!-- harnessed-generated:v4.11.0 -->'
const NEW_MARKER = '<!-- harnessed-generated:v4.12.0 -->'

// issue #2 — body-type sets MUST mirror generateCommands.ts so the inlined SKILL
// invoke section carries the SAME deterministic engine sequence as the sibling
// `~/.claude/commands/<name>.md` (the injected SKILL is what the agent reads when
// a `/auto`-style trigger fires; a cross-file pointer let it freestyle and bypass
// the engine — no ledger / no evidence guard / no recovery).
const INTERACTIVE = new Set([
  'discuss',
  'discuss-strategic',
  'discuss-phase',
  'discuss-subtask',
  'task-clarify',
])
const ORCHESTRATOR = new Set(['auto', 'plan', 'task', 'verify', 'ship'])

/** orchestrator (auto/plan/task/verify) | execution (the rest) | interactive
 *  (discuss family + task-clarify). Same partition as generateCommands.ts. */
function bodyType(name) {
  if (INTERACTIVE.has(name)) return 'interactive'
  if (ORCHESTRATOR.has(name)) return 'orchestrator'
  return 'execution'
}

// Locale → body file + section builder. The invoke section is located by the
// harnessed MARKER it contains (heading-variant agnostic across locales), or — for
// SKILL files that never had an invoke section (ship/*) — appended at EOF.
const LOCALES = {
  en: { file: 'SKILL.md', build: buildSectionEn },
  'zh-Hans': { file: 'SKILL.zh-Hans.md', build: buildSectionZh },
}

function buildSectionEn(name) {
  const t = bodyType(name)
  if (t === 'orchestrator') return orchestratorEn(name)
  if (t === 'interactive') return interactiveEn(name)
  return executionEn(name)
}

function buildSectionZh(name) {
  const t = bodyType(name)
  if (t === 'orchestrator') return orchestratorZh(name)
  if (t === 'interactive') return interactiveZh(name)
  return executionZh(name)
}

// ── Shared fragments ─────────────────────────────────────────────────────────
//
// `harnessed checkpoint intent <name>` banner (orchestrator + execution only —
// interactive stages never seed a ledger). The blockquote differs by body type
// because the resolving steps differ (2-3 seed vs prompt→spawn→complete).

function intentBannerEn(name, kind) {
  const tail =
    kind === 'orchestrator'
      ? 'steps 2-3 below seed the ledger, and a per-turn `<workflow-intent>` reminder persists until they run.'
      : 'the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.'
  return [
    `!\`harnessed checkpoint intent ${name}\``,
    '',
    `> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: ${tail}`,
    '',
  ]
}

function intentBannerZh(name, kind) {
  const tail =
    kind === 'orchestrator'
      ? '下方 step 2-3 完成 ledger seed 前,每 turn 会持续注入 `<workflow-intent>` 提醒。'
      : '按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。'
  return [
    `!\`harnessed checkpoint intent ${name}\``,
    '',
    `> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:${tail}`,
    '',
  ]
}

// 4.36.0 (ADR 0039, supersedes ADR 0036) — the spawn + completion-gate step,
// shared by the orchestrator leaf step 5b and the execution step 2.
//
// History: this used to be a 3-tier degradation chain — upstream `/ralph-loop`
// plugin → native `/goal` → hand-rolled self-loop. 4.35.0 internalized the
// guarantee (`harnessed checkpoint complete` verifies the declared artifacts +
// the TDD boundary + the verbatim promise; `harnessed checkpoint fail` emits the
// three stop reasons BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP). Those two
// commands supply exactly what `--max-iterations` + `--completion-promise` used
// to, on harnessed's own live path — so the chain collapses to one tier with no
// availability question. Keep the three bullets AND the "any one means stop"
// rule in every rendering: they are the contract, not decoration.

function spawnLoopEn(indent, sub, tail = '') {
  const b = `${indent}   - `
  const lines = [
    `Spawn a {{ host.native }} subagent ({{ host.spawn_subagent }}) with that \`prompt\` and \`model\`, then drive delivery with harnessed's own completion gate:`,
    `${b}on return, write the subagent's final output to a file and run \`harnessed checkpoint complete ${sub} --result-file <path>\` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim \`<promise>COMPLETE</promise>\`.`,
    `${b}if it blocks, run \`harnessed checkpoint fail ${sub} --failing-tests <n>\` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.`,
    `${b}respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.`,
  ]
  if (tail) lines.push(`${b}${tail}`)
  return lines.join('\n')
}

function spawnLoopZh(indent, sub, tail = '') {
  const b = `${indent}   - `
  const lines = [
    `用 {{ host.native }} subagent({{ host.spawn_subagent.zh_tool }})以该 \`prompt\` + \`model\` spawn,然后用 harnessed 自己的完成闸门驱动交付:`,
    `${b}subagent 返回后,把它的最终输出写入文件,跑 \`harnessed checkpoint complete ${sub} --result-file <path>\` —— 该命令对声明的产物、TDD boundary、逐字 \`<promise>COMPLETE</promise>\` 三者 fail-closed。`,
    `${b}若被拦下,跑 \`harnessed checkpoint fail ${sub} --failing-tests <n>\` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。`,
    `${b}**仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。`,
  ]
  if (tail) lines.push(`${b}${tail}`)
  return lines.join('\n')
}

// v16.0 Phase 65 batch A — the host-specific WHOLE-PARAGRAPH fragments below are
// no longer literal here. They are `{{ host.<primitive>[.<variant>] }}`
// placeholders resolved at install time from workflows/host-primitives.yaml (+ its
// `.zh-Hans` sibling) by src/cli/lib/renderSkillTemplates.ts. The `claude` column
// of that table holds the exact bytes these constants used to emit, so the Claude
// Code artifact is unchanged; the `codex` column drops the Claude-only claims
// instead of re-asserting them for a harness where they were never measured.
//
// EDIT THE TABLE, NOT THIS FILE, for the wording — and re-run this script only to
// propagate a placeholder/structure change. Same SoT discipline as the header:
// never hand-edit a rendered section.
//
// `research` only: its whole deliverable is the subagent's text, so the blocking
// vs background delivery contract is load-bearing there.
const DELIVERY_CONTRACT_EN = '{{ host.delivery_contract_note }}'

const DELIVERY_CONTRACT_ZH = '{{ host.delivery_contract_note }}'

// Formation step 4. On Claude Code this is the Agent Teams step against the CC
// v2.1.178+ API (`TeamCreate` / `TeamDelete` were DELETED upstream — the team
// forms implicitly on the first teammate spawn, `team_name` is accepted but
// ignored, teardown is a by-name shutdown request). `.skill` is the SKILL-surface
// variant; generateCommands.ts owns the sibling `.command` variant, which is
// deliberately NOT the same text (see inventory.md § "批 A / 批 D").
const TEAMS_STEP_EN = '{{ host.teams_step_note.skill }}'

const TEAMS_STEP_ZH = '{{ host.teams_step_note.skill }}'

// auto-only sub-bullets (issue #7 lineage): the teardown discipline restated for
// the new API + the headless prohibition. ONE table cell carries BOTH bullets
// (joined with `\n`, 3 leading spaces preserved), so the array stays 1 entry.
const TEAMS_TEARDOWN_EN = ['{{ host.teams_teardown_note }}']

const TEAMS_TEARDOWN_ZH = ['{{ host.teams_teardown_note }}']

// T2.1 — the gate-fact production step. Without it the gates below evaluate
// against generic defaults (audit S2: every judgement-call fact was pinned to its
// firing side and NO workflow ever passed --context, so the criteria had zero
// discriminating power — "always fire" wearing a criteria costume). This step is
// where the locked spec turns into the facts the gates actually read.
function factsStepEn(name) {
  return `1b. Bash: \`harnessed facts ${name} --out .harnessed-facts.json\` → it lists ONLY the facts this stage’s gates actually read: deterministic ones already filled (change size / files touched / stage, from git), judgement calls left \`null\` with a one-line hint of what to judge. Edit the file and replace each \`null\` in \`facts\` with your honest answer from the locked spec — leave one null only if you genuinely cannot judge it (it then falls back to the built-in default). Do NOT skip this step and do NOT invent facts the command did not ask for.`
}

function factsStepZh(name) {
  return `1b. Bash: \`harnessed facts ${name} --out .harnessed-facts.json\` → 它只列出**本阶段 gate 真正读取**的 fact:能确定性推导的已填好(改动行数 / 触及文件数 / stage,来自 git),判断题留 \`null\` 并附一行说明。编辑该文件,把 \`facts\` 里每个 \`null\` 按 locked spec 换成你的真实判断 —— 只有确实无法判断时才留 null(此时回退内置默认值)。**不要**跳过本步,也**不要**自行编造命令没问的 fact。`
}

// ── ORCHESTRATOR (auto/plan/task/verify/ship) — mirrors buildOrchestratorBody ──

function orchestratorEn(name) {
  const isAuto = name === 'auto'
  const step1 = isAuto
    ? `1. FIRST run the discuss stage interactively in THIS session (spawned subagents cannot ask the user questions). Evaluate strategic / phase / subtask clarification criteria for "$ARGUMENTS"; dialogue with the user ({{ host.ask_user }}) for each layer that fires, lock decisions, transparent-skip the rest. After locking blocking decisions, relay the deferrable set to the user in a single batched {{ host.ask_user }} with each agent-recommended default pre-selected — deferrable defers scheduling, not user authority; only skip an item if the user explicitly defers it again. Produce a locked spec.`
    : `1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first ({{ host.ask_user }}) and lock decisions; otherwise transparent-skip. Produce a locked spec.`
  const step2tail = isAuto
    ? ' For a small self-contained task (single-file / single-page class), the sanctioned lite path is adding `--skip-sub verify --skip-sub retro` (repeatable / comma-separated) — skipped subs are still recorded in the ledger with reasons; lite ≠ freestyle (the ledger/evidence IS the difference).'
    : ''
  const step6tail = isAuto ? ' Then run the `retro` stage to capture lessons.' : ''
  return [
    '## How to invoke',
    '',
    ...intentBannerEn(name, 'orchestrator'),
    'The numbered sequence below **is** the state machine — execute it step by step with Bash.',
    'Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine',
    '(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain',
    '(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,',
    '`harnessed checkpoint` records the ledger); YOU spawn with {{ host.native }} {{ host.spawn_subagent.plural }}.',
    '',
    `Do NOT pipe to \`harnessed run ${name}\` — that is the CI/headless path ({{ host.harnessed_run_warning_note.orchestrator_tail }}`,
    '',
    step1,
    factsStepEn(name),
    `2. Bash: \`harnessed gates ${name} --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss\` → parse the JSON \`{fire, skip, parallelism}\`. This is the plan SoT (no spawn). Keep the verbatim JSON.${step2tail}`,
    `3. Bash: \`harnessed checkpoint start ${name} --plan '<the verbatim gates JSON from step 2>'\` → seeds the per-sub ledger so \`harnessed status --recover\` can re-orient you after compaction.`,
    TEAMS_STEP_EN,
    ...(isAuto ? TEAMS_TEARDOWN_EN : []),
    '5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):',
    '   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed facts <sub> --out .harnessed-facts.json` (fill the nulls) → `harnessed gates <sub> --task "<spec>" --context-file .harnessed-facts.json --skip-sub discuss` → `harnessed checkpoint start <sub> --plan \'<json>\'` → repeat this loop for ITS fired subs.',
    '   - **Else (leaf sub):**',
    '     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.',
    `     b. ${spawnLoopEn('     ', '<sub>')}`,
    '     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via {{ host.ask_user }}, append the answers to the spec, then re-spawn the same sub.',
    '     d. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete <sub> --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. On a non-zero exit the sub is NOT done — re-spawn to close the gap, or pass `--force` only to deliberately override (records `evidence_status=overridden`, an audited override rather than a silent pass).',
    '     e. If the complete gate blocked: Bash `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt (omit the flag when the sub has no tests — the evidence-artifact digest is the fallback progress metric). It prints `BUDGET-EXHAUSTED` (attempts spent vs `workflows/defaults.yaml ralph_max_iterations`), `NO-PROGRESS` (no improvement for N consecutive attempts) or `BREAK-LOOP` (this sub failed >= the threshold) once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope, fix the blocker, or escalate to the user, and report it.',
    `6. After all fired subs are \`done\` (or recorded \`failed\`), Bash \`harnessed status --recover\` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.${step6tail}`,
    '',
    '**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.',
    '',
    NEW_MARKER,
  ].join('\n')
}

function orchestratorZh(name) {
  const isAuto = name === 'auto'
  const step1 = isAuto
    ? `1. 先在**本 session** 交互式跑 discuss 阶段(spawned subagent 无法向用户提问):对 "$ARGUMENTS" 评估 strategic / phase / subtask 澄清判据,对每个 fire 的层用 {{ host.ask_user }} 与用户对话锁决策,其余透明 skip。blocking 集锁定后,把 deferrable 集以单轮批量 {{ host.ask_user }} 转达给用户(各项 agent 推荐默认值预选)—— deferrable 推迟的是排期,不是用户决策权;仅当用户明确再次推迟才可跳过该项。产出 locked spec。`
    : `1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清({{ host.ask_user }})并锁决策;否则透明 skip。产出 locked spec。`
  const step2tail = isAuto
    ? '自包含小任务(单文件/单页面级)的合规轻量路径:追加 `--skip-sub verify --skip-sub retro`(可重复/逗号分隔)——被 skip 的 sub 仍带原因进 ledger;lite ≠ freestyle(差别就在 ledger/evidence)。'
    : ''
  const step6tail = isAuto ? ' 然后跑 `retro` 阶段沉淀 lessons。' : ''
  return [
    '## 如何调用',
    '',
    ...intentBannerZh(name, 'orchestrator'),
    '下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套',
    '等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是',
    '编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,',
    '`harnessed checkpoint` 记录 ledger);**你**(主 session)用 {{ host.native }} {{ host.spawn_subagent.zh_tool }}做 spawn。',
    '',
    `**不要** pipe 到 \`harnessed run ${name}\` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.orchestrator_tail }}`,
    '',
    step1,
    factsStepZh(name),
    `2. Bash: \`harnessed gates ${name} --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss\` → 解析 JSON \`{fire, skip, parallelism}\`。这是 plan SoT(不 spawn)。保留 verbatim JSON。${step2tail}`,
    `3. Bash: \`harnessed checkpoint start ${name} --plan '<step 2 的 verbatim gates JSON>'\` → seed per-sub ledger,让 \`harnessed status --recover\` 能在 compaction 后给你重新定位。`,
    TEAMS_STEP_ZH,
    ...(isAuto ? TEAMS_TEARDOWN_ZH : []),
    '5. 否则,对 `order` 里每个 fired sub(serial 串行、parallel 并发):',
    '   - **若该项 `is_master: true`**(本身是 stage master —— 如 `/auto` fire `plan`/`task`/`verify`):**不要**直接 prompt+spawn。RECURSE:跑该 master 自己的 `harnessed facts <sub> --out .harnessed-facts.json`(填完 null)→ `harnessed gates <sub> --task "<spec>" --context-file .harnessed-facts.json --skip-sub discuss` → `harnessed checkpoint start <sub> --plan \'<json>\'` → 对它的 fired subs 重复本循环。',
    '   - **否则(leaf sub):**',
    '     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → 解析 `{prompt, max_iterations, model}`。',
    `     b. ${spawnLoopZh('     ', '<sub>')}`,
    '     c. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 {{ host.ask_user }} 原样转达,把答案 append 进 spec,再重 spawn 同一 sub。',
    '     d. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete <sub> --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。exit 非零即表示该 sub **未** done —— 重 spawn 补齐,或仅在刻意覆盖时传 `--force`(记录 `evidence_status=overridden`,是可审计的覆盖而非静默放行)。',
    '     e. 若 complete 闸门拦下:Bash `harnessed checkpoint fail <sub> --failing-tests <n>` 记录本次尝试(该 sub 无测试时省略该 flag —— 回退用证据产物摘要作进展度量)。命中停机条件时它会打印 `BUDGET-EXHAUSTED`(已用尝试次数 vs `workflows/defaults.yaml ralph_max_iterations`)、`NO-PROGRESS`(连续 N 次无进展)或 `BREAK-LOOP`(该 sub 失败次数达阈值)。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛范围、修掉阻塞点或上报用户,并说明情况。',
    `6. 所有 fired subs \`done\`(或记录 \`failed\`)后,Bash \`harnessed status --recover\` 确认 ledger,并向用户报告 per-sub fired/skipped/done/failed 摘要。${step6tail}`,
    '',
    '**若丢失上下文(compaction / resume):** 先跑 `harnessed status --recover` —— 它读 ledger 并打印「你在这里,下一步是什么」,让你从第一个 `pending` sub 续跑而非重启。若 ledger 为空,重跑 step 2-3。',
    '',
    NEW_MARKER,
  ].join('\n')
}

// ── EXECUTION (everything else) — mirrors buildExecutionBody ──────────────────

function executionEn(name) {
  const tail = name === 'research' ? DELIVERY_CONTRACT_EN : ''
  return [
    '## How to invoke',
    '',
    ...intentBannerEn(name, 'execution'),
    'The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise',
    'an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no',
    'evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a',
    '{{ host.native }} {{ host.spawn_subagent }} (keeps the session responsive + lets clarification round-trips reach the user).',
    '',
    `Do NOT pipe to \`harnessed run ${name}\` — that is the CI/headless path ({{ host.harnessed_run_warning_note.execution_tail }}`,
    '',
    `1. Bash: \`harnessed prompt ${name} --task "$ARGUMENTS" --json\` → parse \`{prompt, max_iterations, model}\`.`,
    `2. ${spawnLoopEn('', name, tail)}`,
    '3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via {{ host.ask_user }}, append the answers to the spec, then re-spawn the same sub.',
    `4. On \`<promise>COMPLETE</promise>\`: write the subagent’s final output to a file, then Bash \`harnessed checkpoint complete ${name} --result-file <path> --summary "<one-line>"\`. Fail-CLOSED — it blocks unless every declared \`artifacts_expected\` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim \`<promise>COMPLETE</promise>\` (or a structured COMPLETE status). \`--result <text>\` is the inline variant; \`--result-file\` wins and is quoting-safe on Windows. \`--force\` records an audited override (\`evidence_status=overridden\`) — it does not silently pass.`,
    `5. If the complete gate blocked: Bash \`harnessed checkpoint fail ${name} --failing-tests <n>\` to record the attempt. It prints \`BUDGET-EXHAUSTED\` / \`NO-PROGRESS\` / \`BREAK-LOOP\` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.`,
    '',
    NEW_MARKER,
  ].join('\n')
}

function executionZh(name) {
  const tail = name === 'research' ? DELIVERY_CONTRACT_ZH : ''
  return [
    '## 如何调用',
    '',
    ...intentBannerZh(name, 'execution'),
    '下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:',
    'freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用',
    '{{ host.native }} {{ host.spawn_subagent.zh_tool }} spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。',
    '',
    `**不要** pipe 到 \`harnessed run ${name}\` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.execution_tail }}`,
    '',
    `1. Bash: \`harnessed prompt ${name} --task "$ARGUMENTS" --json\` → 解析 \`{prompt, max_iterations, model}\`。`,
    `2. ${spawnLoopZh('', name, tail)}`,
    '3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 {{ host.ask_user }} 原样转达,把答案 append 进 spec,再重 spawn。',
    `4. 命中 \`<promise>COMPLETE</promise>\`:把 subagent 最终输出写入文件,再 Bash \`harnessed checkpoint complete ${name} --result-file <path> --summary "<one-line>"\`。fail-CLOSED —— 除非声明的 \`artifacts_expected\` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 \`<promise>COMPLETE</promise>\`(或结构化 COMPLETE 状态),否则拦下。\`--result <text>\` 是内联变体;\`--result-file\` 优先且在 Windows 上引号安全。\`--force\` 记录可审计的覆盖(\`evidence_status=overridden\`),不是静默放行。`,
    `5. 若 complete 闸门拦下:Bash \`harnessed checkpoint fail ${name} --failing-tests <n>\` 记录本次尝试。命中停机条件时会打印 \`BUDGET-EXHAUSTED\` / \`NO-PROGRESS\` / \`BREAK-LOOP\`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。`,
    '',
    NEW_MARKER,
  ].join('\n')
}

// ── INTERACTIVE (discuss family + task-clarify) — mirrors buildInteractiveBody ─
//
// `discuss` (the stage master) additionally owns the new-project bootstrap and
// the deferrable-relay contract; the 4 leaf clarification subs stay lean.

function interactiveEn(name) {
  const isMaster = name === 'discuss'
  const step0 = isMaster
    ? [
        '0. **New-project bootstrap** — if `.planning/ROADMAP.md` does not exist: invoke `/gsd-new-project` when that skill is available; otherwise create the minimal skeleton before continuing (then phase dirs follow `.planning/phases/<NN>-<slug>/`):',
        '   - `ROADMAP.md`: `# Roadmap` + one table row per phase: `| 01 | <slug> | <one-line goal> | in-progress |`',
        '   - `STATE.md`: `# STATE (digest — keep <100 lines)` + `current: phase 01-<slug> / stage discuss` + `next: <action>`',
        '   - `REQUIREMENTS.md`: `# Requirements` + numbered rows `- R1: <verifiable acceptance criterion>`',
      ]
    : []
  const step2 = isMaster
    ? '2. For each layer that fires, hold the dialogue with the user (use {{ host.ask_user }} for option-style decisions) and lock every open decision. After locking blocking decisions, relay the deferrable set to the user in a single batched {{ host.ask_user }} with each agent-recommended default pre-selected — only skip an item if the user explicitly defers it again; a deferrable item is never resolved without the user seeing it.'
    : '2. For each layer that fires, hold the dialogue with the user (use {{ host.ask_user }} for option-style decisions) and lock every open decision.'
  const step4 = isMaster
    ? '4. Persist the locked decisions to `.planning/phases/<NN>-<slug>/` via planning-with-files (`findings.md` / `task_plan.md`; NN = two-digit, one above the highest existing phase dir).'
    : '4. Persist the locked decisions to `.planning/` via planning-with-files (`findings.md` / `task_plan.md`).'
  return [
    '## How to invoke',
    '',
    'Clarification needs real user dialogue, so run this stage directly in THIS session — do NOT',
    'spawn it, and do NOT improvise: follow these steps so the locked spec is persisted for the',
    'execution stages.',
    '',
    ...step0,
    '1. Evaluate the clarification criteria for "$ARGUMENTS":',
    '   - **Strategic** — new feature / milestone / unclear business scope → gstack `/office-hours` + `/plan-ceo-review`',
    '   - **Phase** — ≥2 open implementation decisions / unclear cross-phase API contract → GSD `/gsd-discuss-phase`',
    '   - **Subtask** — ≥2 distinct approaches / core algorithm / API contract design / high error cost → superpowers brainstorming',
    step2,
    "3. Transparent-skip layers that don't fire — state which were skipped and why.",
    step4,
    '',
    'Output: a locked spec the execution stages (`/plan` → `/task` → `/verify`) consume without further user input.',
    '',
    NEW_MARKER,
  ].join('\n')
}

function interactiveZh(name) {
  const isMaster = name === 'discuss'
  const step0 = isMaster
    ? [
        '0. **新项目引导** —— 若 `.planning/ROADMAP.md` 不存在:`/gsd-new-project` skill 可用则先调用它;不可用则先创建最小骨架再继续(后续 phase 目录遵循 `.planning/phases/<NN>-<slug>/`):',
        '   - `ROADMAP.md`:`# Roadmap` + 每 phase 一行表:`| 01 | <slug> | <一行目标> | in-progress |`',
        '   - `STATE.md`:`# STATE (digest — 保持 <100 行)` + `current: phase 01-<slug> / stage discuss` + `next: <动作>`',
        '   - `REQUIREMENTS.md`:`# Requirements` + 编号行 `- R1: <可验证的验收标准>`',
      ]
    : []
  const step2 = isMaster
    ? '2. 对每个 fire 的层与用户对话(option 型决策用 {{ host.ask_user }}),锁定每个 open decision。blocking 集锁定后,把 deferrable 集以单轮批量 {{ host.ask_user }} 转达给用户(各项 agent 推荐默认值预选)—— 仅当用户明确再次推迟才可跳过该项;deferrable 项绝不允许在用户未见的情况下被 resolve。'
    : '2. 对每个 fire 的层与用户对话(option 型决策用 {{ host.ask_user }}),锁定每个 open decision。'
  const step4 = isMaster
    ? '4. 把 locked 决策持久化到 `.planning/phases/<NN>-<slug>/`(planning-with-files 的 `findings.md` / `task_plan.md`;NN = 两位数,取现有最大 phase 目录号 + 1)。'
    : '4. 把 locked 决策持久化到 `.planning/`(planning-with-files 的 `findings.md` / `task_plan.md`)。'
  return [
    '## 如何调用',
    '',
    '澄清需要真实用户对话,所以本阶段直接在**本 session** 跑 —— **不要** spawn,也**不要**自行演绎:',
    '按以下步骤走,把 locked spec 持久化给执行阶段。',
    '',
    ...step0,
    '1. 对 "$ARGUMENTS" 评估澄清判据:',
    '   - **战略层** —— 新功能 / 新 milestone / 商业 scope 不清 → gstack `/office-hours` + `/plan-ceo-review`',
    '   - **Phase 层** —— ≥2 个 open implementation decision / 跨 phase API contract 不清 → GSD `/gsd-discuss-phase`',
    '   - **子任务层** —— ≥2 个不同方案 / 核心算法 / API contract 设计 / 高错误成本 → superpowers brainstorming',
    step2,
    '3. 不 fire 的层透明 skip —— 说明哪些被 skip 及原因。',
    step4,
    '',
    '产出:一份 locked spec,执行阶段(`/plan` → `/task` → `/verify`)无需再问用户即可消费。',
    '',
    NEW_MARKER,
  ].join('\n')
}

/** Flat name (e.g. 'verify-paranoid') — masters/standalone flatten subDir 'auto'. */
function flatNameFor(stageDir, subDir) {
  if (subDir == null) return stageDir
  if (subDir === 'auto') return stageDir
  return `${stageDir}-${subDir}`
}

/** Enumerate every skill dir (flat top-level + nested 2-level). */
async function listAllSkillDirs() {
  const out = []
  for (const entry of (await readdir(WORKFLOWS)).sort()) {
    if (DEPRECATED.has(entry)) continue
    const stagePath = join(WORKFLOWS, entry)
    let s
    try {
      s = await stat(stagePath)
    } catch {
      continue
    }
    if (!s.isDirectory()) continue
    // Flat top-level (research / retro / auto)?
    try {
      await stat(join(stagePath, 'SKILL.md'))
      out.push({ flatName: entry, dir: stagePath })
      continue
    } catch {
      // nested
    }
    for (const sub of (await readdir(stagePath)).sort()) {
      const subPath = join(stagePath, sub)
      let ss
      try {
        ss = await stat(subPath)
      } catch {
        continue
      }
      if (!ss.isDirectory()) continue
      try {
        await stat(join(subPath, 'SKILL.md'))
        out.push({ flatName: flatNameFor(entry, sub), dir: subPath })
      } catch {}
    }
  }
  return out
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The ACTUAL footgun invocation — a piped `| harnessed run <name>` or a
 *  `harnessed run <name> --task-stdin`. Deliberately NOT a bare `harnessed run
 *  <name>` so it does NOT match the cautionary "Do NOT pipe to `harnessed run
 *  <name>`" prose the CC-native section itself contains (idempotency). The same
 *  pattern backs the anti-drift parity test. */
function footgunRegex(name) {
  const n = escapeRegex(name)
  return new RegExp(`(\\|\\s*harnessed run ${n}|harnessed run ${n} --task-stdin)`)
}

/** Any harnessed-generated marker (digit-loose, locale-agnostic). The marker sits
 *  INSIDE the invoke section, so it is the most reliable anchor across the ≥3
 *  inconsistent invoke headings (`## How to invoke` / `## 如何调用`). */
const ANY_MARKER_RX = /<!--\s*harnessed-generated:v\d+\.\d+\.\d+\s*-->/

/** Exact invoke heading per locale — fallback anchor when a file has no marker but
 *  does carry a real invoke section. Deliberately excludes the separate
 *  `## Invocation` / `## 调用方式` section (that is the command-name section, not
 *  the executable invoke section). */
const INVOKE_HEADINGS = {
  en: ['## How to invoke'],
  'zh-Hans': ['## 如何调用'],
}

/** Replace (or, for SKILL files that never had one, append) the invoke section
 *  with the inlined state-machine section. Anchors on the harnessed MARKER first
 *  (heading-variant agnostic); else on the exact invoke heading; else appends at
 *  EOF (ship/* had no invoke section pre-issue-#2). The footgun anchor is gone —
 *  issue #1 removed every footgun, so clean files are the norm now. Never returns
 *  null. Idempotent: re-runs land on the same marker-anchored span. */
function replaceInvokeSection(body, locale, name) {
  const section = LOCALES[locale].build(name)
  const headings = [...body.matchAll(/^## .*$/gm)]
  let start = -1
  let next = body.length

  const mm = ANY_MARKER_RX.exec(body)
  if (mm) {
    for (const h of headings) {
      if (h.index <= mm.index) start = h.index
      else {
        next = h.index
        break
      }
    }
  } else {
    const wanted = INVOKE_HEADINGS[locale]
    const hi = headings.findIndex((h) => wanted.some((t) => h[0] === t || h[0].startsWith(`${t} `)))
    if (hi >= 0) {
      start = headings[hi].index
      next = hi + 1 < headings.length ? headings[hi + 1].index : body.length
    }
  }

  if (start < 0) {
    // No invoke section at all (e.g. ship/*) — append one at EOF.
    return `${body.replace(/\s*$/, '')}\n\n${section}\n`
  }
  const atEof = next === body.length
  // Keep one blank line before the next heading (or a trailing newline at EOF).
  const replacement = atEof ? `${section}\n` : `${section}\n\n`
  return body.slice(0, start) + replacement + body.slice(next)
}

async function rewriteFile(dir, locale, name) {
  const { file } = LOCALES[locale]
  const path = join(dir, file)
  let body
  try {
    body = await readFile(path, 'utf8')
  } catch {
    return { name, locale, action: 'absent' }
  }
  if (body.includes(NEW_MARKER) && !footgunRegex(name).test(body))
    return { name, locale, action: 'skip-current' }
  const replaced = replaceInvokeSection(body, locale, name)
  if (replaced == null) return { name, locale, action: 'no-footgun' }
  let next = replaced
  // Drop any stale old marker that lingered outside the replaced span.
  if (next.includes(OLD_MARKER)) next = next.replace(`${OLD_MARKER}\n`, '').replace(OLD_MARKER, '')
  next = next.replace(/\n{3,}/g, '\n\n')
  if (next === body) return { name, locale, action: 'no-change' }
  await writeFile(path, next, 'utf8')
  return { name, locale, action: 'rewritten' }
}

async function main() {
  const dirs = await listAllSkillDirs()
  const results = []
  for (const { flatName, dir } of dirs) {
    for (const locale of Object.keys(LOCALES)) {
      results.push(await rewriteFile(dir, locale, flatName))
    }
  }
  for (const r of results) console.log(`  ${r.action.padEnd(20)} ${r.locale.padEnd(8)} ${r.name}`)
  const written = results.filter((r) => r.action === 'rewritten').length
  console.log(`\nrewrote ${written}/${results.length} SKILL files`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
