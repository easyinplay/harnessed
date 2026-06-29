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
const OLD_MARKER = '<!-- harnessed-generated:v4.9.2 -->'
const NEW_MARKER = '<!-- harnessed-generated:v4.9.3 -->'

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

// ── ORCHESTRATOR (auto/plan/task/verify) — mirrors buildOrchestratorBody ──────

function orchestratorEn(name) {
  const step1 =
    name === 'auto'
      ? `1. FIRST run the discuss stage interactively in THIS session (spawned subagents cannot ask the user questions). Evaluate strategic / phase / subtask clarification criteria for "$ARGUMENTS"; dialogue with the user (AskUserQuestion) for each layer that fires, lock decisions, transparent-skip the rest. Produce a locked spec.`
      : `1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first (AskUserQuestion) and lock decisions; otherwise transparent-skip. Produce a locked spec.`
  const step6tail = name === 'auto' ? ' Then run the `retro` stage to capture lessons.' : ''
  return [
    '## How to invoke',
    '',
    'The numbered sequence below **is** the state machine — execute it step by step with Bash.',
    'Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine',
    '(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain',
    '(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,',
    '`harnessed checkpoint` records the ledger); YOU spawn with CC-native Task / Agent tools.',
    '',
    `Do NOT pipe to \`harnessed run ${name}\` — that is the CI/headless path (in-process SDK spawn`,
    'that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).',
    '',
    step1,
    `2. Bash: \`harnessed gates ${name} --task "<locked spec>" --skip-sub clarify\` → parse the JSON \`{fire, skip, parallelism}\`. This is the plan SoT (no spawn). Keep the verbatim JSON.`,
    `3. Bash: \`harnessed checkpoint start ${name} --plan '<the verbatim gates JSON from step 2>'\` → seeds the per-sub ledger so \`harnessed status --recover\` can re-orient you after compaction.`,
    '4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team (`TeamCreate` → `Agent(name, team_name, …)` per sub with its `harnessed prompt <sub>` prompt → coordinate via `SendMessage` → `SendMessage shutdown_request` + `TeamDelete`). Still checkpoint each sub (`complete` / `fail`) as below.',
    '5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):',
    '   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan \'<json>\'` → repeat this loop for ITS fired subs.',
    '   - **Else (leaf sub):**',
    '     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.',
    '     b. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations).',
    '     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.',
    '     d. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it, or pass `--force` only to deliberately override.',
    '     e. If the sub cannot reach COMPLETE (max_iterations exhausted / unrecoverable error): Bash `harnessed checkpoint fail <sub> --summary "<why>"`, then STOP and report to the user.',
    `6. After all fired subs are \`done\` (or recorded \`failed\`), Bash \`harnessed status --recover\` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.${step6tail}`,
    '',
    '**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.',
    '',
    NEW_MARKER,
  ].join('\n')
}

function orchestratorZh(name) {
  const step1 =
    name === 'auto'
      ? `1. 先在**本 session** 交互式跑 discuss 阶段(spawned subagent 无法向用户提问):对 "$ARGUMENTS" 评估 strategic / phase / subtask 澄清判据,对每个 fire 的层用 AskUserQuestion 与用户对话锁决策,其余透明 skip。产出 locked spec。`
      : `1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清(AskUserQuestion)并锁决策;否则透明 skip。产出 locked spec。`
  const step6tail = name === 'auto' ? ' 然后跑 `retro` 阶段沉淀 lessons。' : ''
  return [
    '## 如何调用',
    '',
    '下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套',
    '等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是',
    '编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,',
    '`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。',
    '',
    `**不要** pipe 到 \`harnessed run ${name}\` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞`,
    'session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。',
    '',
    step1,
    `2. Bash: \`harnessed gates ${name} --task "<locked spec>" --skip-sub clarify\` → 解析 JSON \`{fire, skip, parallelism}\`。这是 plan SoT(不 spawn)。保留 verbatim JSON。`,
    `3. Bash: \`harnessed checkpoint start ${name} --plan '<step 2 的 verbatim gates JSON>'\` → seed per-sub ledger,让 \`harnessed status --recover\` 能在 compaction 后给你重新定位。`,
    '4. 若 `parallelism.escalate_to_teams === true`:读 `~/.claude/rules/agent-teams.md`,然后把 fired subs 作为 Agent Team 驱动(`TeamCreate` → 每个 sub `Agent(name, team_name, …)` + 其 `harnessed prompt <sub>` prompt → 用 `SendMessage` 协调 → `SendMessage shutdown_request` + `TeamDelete`)。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。',
    '5. 否则,对 `order` 里每个 fired sub(serial 串行、parallel 并发):',
    '   - **若该项 `is_master: true`**(本身是 stage master —— 如 `/auto` fire `plan`/`task`/`verify`):**不要**直接 prompt+spawn。RECURSE:跑该 master 自己的 `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan \'<json>\'` → 对它的 fired subs 重复本循环。',
    '   - **否则(leaf sub):**',
    '     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → 解析 `{prompt, max_iterations, model}`。',
    '     b. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。',
    '     c. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn 同一 sub。',
    '     d. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它,或仅在刻意覆盖时传 `--force`。',
    '     e. 若 sub 无法达到 COMPLETE(max_iterations 耗尽 / 不可恢复错误):Bash `harnessed checkpoint fail <sub> --summary "<why>"`,然后 STOP 并向用户报告。',
    `6. 所有 fired subs \`done\`(或记录 \`failed\`)后,Bash \`harnessed status --recover\` 确认 ledger,并向用户报告 per-sub fired/skipped/done/failed 摘要。${step6tail}`,
    '',
    '**若丢失上下文(compaction / resume):** 先跑 `harnessed status --recover` —— 它读 ledger 并打印「你在这里,下一步是什么」,让你从第一个 `pending` sub 续跑而非重启。若 ledger 为空,重跑 step 2-3。',
    '',
    NEW_MARKER,
  ].join('\n')
}

// ── EXECUTION (everything else) — mirrors buildExecutionBody ──────────────────

function executionEn(name) {
  return [
    '## How to invoke',
    '',
    'The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise',
    'an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no',
    'evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a',
    'CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).',
    '',
    `Do NOT pipe to \`harnessed run ${name}\` — that is the CI/headless path (in-process SDK spawn`,
    'that blocks the session inside Claude Code).',
    '',
    `1. Bash: \`harnessed prompt ${name} --task "$ARGUMENTS" --json\` → parse \`{prompt, max_iterations, model}\`.`,
    '2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations).',
    '3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.',
    `4. On \`<promise>COMPLETE</promise>\`: Bash \`harnessed checkpoint complete ${name} --summary "<one-line>"\`. The evidence guard runs here (fail-CLOSED): if a declared \`artifacts_expected\` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.`,
    '',
    NEW_MARKER,
  ].join('\n')
}

function executionZh(name) {
  return [
    '## 如何调用',
    '',
    '下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:',
    'freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用',
    'CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。',
    '',
    `**不要** pipe 到 \`harnessed run ${name}\` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude`,
    'Code 内部会阻塞 session)。',
    '',
    `1. Bash: \`harnessed prompt ${name} --task "$ARGUMENTS" --json\` → 解析 \`{prompt, max_iterations, model}\`。`,
    '2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,自循环:spawn → 检查 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。',
    '3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。',
    `4. 命中 \`<promise>COMPLETE</promise>\`:Bash \`harnessed checkpoint complete ${name} --summary "<one-line>"\`。evidence guard 在此运行(fail-CLOSED):若声明的 \`artifacts_expected\` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。`,
    '',
    NEW_MARKER,
  ].join('\n')
}

// ── INTERACTIVE (discuss family + task-clarify) — mirrors buildInteractiveBody ─

function interactiveEn(_name) {
  return [
    '## How to invoke',
    '',
    'Clarification needs real user dialogue, so run this stage directly in THIS session — do NOT',
    'spawn it, and do NOT improvise: follow these steps so the locked spec is persisted for the',
    'execution stages.',
    '',
    '1. Evaluate the clarification criteria for "$ARGUMENTS":',
    '   - **Strategic** — new feature / milestone / unclear business scope → gstack `/office-hours` + `/plan-ceo-review`',
    '   - **Phase** — ≥2 open implementation decisions / unclear cross-phase API contract → GSD `/gsd-discuss-phase`',
    '   - **Subtask** — ≥2 distinct approaches / core algorithm / API contract design / high error cost → superpowers brainstorming',
    '2. For each layer that fires, hold the dialogue with the user (use AskUserQuestion for option-style decisions) and lock every open decision.',
    "3. Transparent-skip layers that don't fire — state which were skipped and why.",
    '4. Persist the locked decisions to `.planning/` via planning-with-files (`findings.md` / `task_plan.md`).',
    '',
    'Output: a locked spec the execution stages (`/plan` → `/task` → `/verify`) consume without further user input.',
    '',
    NEW_MARKER,
  ].join('\n')
}

function interactiveZh(_name) {
  return [
    '## 如何调用',
    '',
    '澄清需要真实用户对话,所以本阶段直接在**本 session** 跑 —— **不要** spawn,也**不要**自行演绎:',
    '按以下步骤走,把 locked spec 持久化给执行阶段。',
    '',
    '1. 对 "$ARGUMENTS" 评估澄清判据:',
    '   - **战略层** —— 新功能 / 新 milestone / 商业 scope 不清 → gstack `/office-hours` + `/plan-ceo-review`',
    '   - **Phase 层** —— ≥2 个 open implementation decision / 跨 phase API contract 不清 → GSD `/gsd-discuss-phase`',
    '   - **子任务层** —— ≥2 个不同方案 / 核心算法 / API contract 设计 / 高错误成本 → superpowers brainstorming',
    '2. 对每个 fire 的层与用户对话(option 型决策用 AskUserQuestion),锁定每个 open decision。',
    '3. 不 fire 的层透明 skip —— 说明哪些被 skip 及原因。',
    '4. 把 locked 决策持久化到 `.planning/`(planning-with-files 的 `findings.md` / `task_plan.md`)。',
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
