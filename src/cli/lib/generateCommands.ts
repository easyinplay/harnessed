// Generate ~/.claude/commands/<x>.md from workflows/role-prompts.yaml.
//
// SCHEMA EVOLUTION:
//   v3.4.3 — dual-path body (SlashCommand "Preferred path" + Task-spawn fallback).
//   v3.4.4 — single-path body that piped to `harnessed run <name>` (SDK spawn).
//   v4.0   — orchestration-brain bodies (3 types: INTERACTIVE / ORCHESTRATOR /
//     EXECUTION). Bodies tell the CC main session to drive CC-native subagent
//     spawns via `harnessed gates` + `harnessed prompt` + `harnessed checkpoint`,
//     and explicitly NOT to pipe to `harnessed run` (which is now CI/headless).
//   v4.1   — `harnessed prompt` injects tools_available + disciplines_applied
//     from the yaml SoT; ORCHESTRATOR bodies recurse on `is_master` fired subs.
//
// MARKER-BASED OVERWRITE:
//   Each generated file emits a `<!-- harnessed-generated:vX.Y.Z -->` trailing
//   marker. `writeAllCommands` overwrites files carrying that marker OR the
//   legacy v3.4.3 dual-path signature; truly user-authored files (with neither)
//   are preserved with a warning, so `harnessed setup` re-renders its own files
//   in place without clobbering customs.
//
// Karpathy simplicity: pure functions, single yaml load, no new deps.

import { existsSync, readFileSync as nodeReadFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { getLocale, type SupportedLocale } from '../../i18n/index.js'
import { resolveLocaleYaml } from '../../i18n/localeYaml.js'
import type { CapabilityMap } from './capabilityResolver.js'

/** Per-sub-workflow metadata from `workflows/role-prompts.yaml`. */
export interface RolePrompt {
  /** Capability key whose `.cmd` is the preferred slash command. Empty for masters. */
  primary_cap: string
  /** Title of the expert persona used in the fallback Task-spawn prompt. */
  specialist: string
  /** One-line job description (string with leading verb). */
  responsibility: string
  /** Checklist items (5-10) — skipped for masters (empty array). */
  checklist: string[]
  /** Severity scale label rendered in report-format section. */
  severity: string
  /** YAML frontmatter `description` field for the generated commands/<x>.md. */
  description: string
  /** Master orchestrators are pure dispatchers (no role-prompt fallback). */
  is_master?: boolean
}

/** Full registry shape — `{ prompts: { <slash-name>: RolePrompt, ... } }`. */
interface RolePromptsDoc {
  prompts?: Record<string, RolePrompt>
}

/** Single generated command file (filename + content). */
export interface GeneratedCommand {
  /** Bare filename — e.g. `verify-paranoid.md`. Caller joins with commands dir. */
  filename: string
  /** Full file content (frontmatter + body) ready to write. */
  content: string
}

/** Outcome per attempted write — skip when user's commands/ file already exists. */
export interface CommandWriteResult {
  /** Slash name (e.g. `verify-paranoid`). */
  name: string
  /** Absolute path the file would be / was written to. */
  path: string
  /** True = wrote new file; false = skipped because user file already existed. */
  written: boolean
  /** Warning text when skipped or when role-prompt missing for the workflow. */
  warning?: string
}

/** Load and parse `<workflowsDir>/role-prompts.yaml` (or its locale sibling).
 *  Tolerant of missing file. Phase 33: `locale` (default `getLocale()`) selects
 *  `role-prompts.<locale>.yaml` when present — en serves the byte-identical base. */
export async function loadRolePrompts(
  workflowsDir: string,
  locale: SupportedLocale = getLocale(),
): Promise<Record<string, RolePrompt>> {
  const path = resolveLocaleYaml(workflowsDir, 'role-prompts', locale)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }
  const doc = parseYaml(raw) as RolePromptsDoc | null
  return doc?.prompts ?? {}
}

/** v4.0 — INTERACTIVE: pure clarification requiring user dialogue. Headless
 *  subagents cannot ask the user questions (brainstorming degenerates into
 *  self-Q&A), so these run entirely in the main CC session. Per user CLAUDE.md
 *  铁律: "澄清必须在主 session 完成后再下放". */
const INTERACTIVE_COMMANDS = new Set([
  'discuss',
  'discuss-strategic',
  'discuss-phase',
  'discuss-subtask',
  'task-clarify',
])

/** v4.0 — ORCHESTRATOR: master stages that gate-eval which subs fire, then
 *  drive CC-native subagent spawns (NOT harnessed-run SDK spawn). `auto` also
 *  runs interactive discuss inline first. */
const ORCHESTRATOR_COMMANDS = new Set(['auto', 'plan', 'task', 'verify', 'ship'])

const MARKER = `<!-- harnessed-generated:v3.4.4 -->`

/** v4.0.1 — language directive for the CC main session's own narration +
 *  clarification dialogue. The `language` discipline says output follows
 *  env.HARNESSED_USER_LANG (set by `harnessed setup`). Spawned subagents get
 *  this via `harnessed prompt`; the main session reading this command file needs
 *  it stated here. */
const LANG_DIRECTIVE = `> **Language**: respond to the user in the language set by \`env.HARNESSED_USER_LANG\` (e.g. \`zh-Hans\` → 简体中文, \`en\` → English). If unset, mirror the user's input language. Keep code / commands / identifiers / error messages / URLs verbatim.`

/** Shared spawn-loop snippet (v4.0) — how CC executes ONE sub via native spawn
 *  with prompt from `harnessed prompt`, ralph-loop completion, NEEDS_CLARIFICATION
 *  round-trip, and checkpoint. Reused by ORCHESTRATOR (per-sub) + EXECUTION. */
function spawnLoopSteps(indent: string): string[] {
  const i = indent
  return [
    `${i}a. Bash: \`harnessed prompt <sub> --task "<spec>" --json\` → parse \`{prompt, max_iterations, model}\`.`,
    `${i}b. Spawn a CC-native subagent (Task / Agent tool) with that \`prompt\` and \`model\`. Wrap in the ralph-loop plugin for completion-promise enforcement:`,
    `${i}   \`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"\``,
    `${i}   If the ralph-loop plugin is not installed, self-loop: spawn → check output for \`<promise>COMPLETE</promise>\` → if absent, re-spawn with the prior output appended (up to max_iterations).`,
    `${i}c. If the subagent output contains \`STATUS: NEEDS_CLARIFICATION\` + a question list: STOP. Use AskUserQuestion to relay those exact questions to the user. Append the user's answers to the spec, then re-spawn the same sub. (This is the round-trip headless spawn cannot do.)`,
    `${i}d. On \`<promise>COMPLETE</promise>\`: Bash \`harnessed checkpoint complete <sub> --summary "<one-line>"\`.`,
  ]
}

/** INTERACTIVE body — main-session clarification, never spawn. */
function buildInteractiveBody(name: string, prompt: RolePrompt): string {
  return [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    LANG_DIRECTIVE,
    ``,
    `## How to run (interactive — in THIS session)`,
    ``,
    `Clarification requires real user dialogue. Spawned subagents cannot ask the user questions, so run this stage directly in this session — do NOT spawn it.`,
    ``,
    `1. Evaluate the clarification criteria for "$ARGUMENTS":`,
    `   - Strategic layer: new feature / new milestone / unclear business scope → run gstack \`/office-hours\` + \`/plan-ceo-review\``,
    `   - Phase layer: ≥2 open implementation decisions / unclear cross-phase API contract → run GSD \`/gsd-discuss-phase\``,
    `   - Subtask layer: ≥2 distinct approaches / core algorithm / API contract design / high error cost → run superpowers brainstorming`,
    `2. For each layer that fires, hold the dialogue with the user (use AskUserQuestion for option-style decisions). Lock every open decision.`,
    `3. Skip layers that don't fire — state which were skipped and why (transparent skip).`,
    `4. Persist locked decisions to \`.planning/\` via planning-with-files (\`findings.md\` / \`task_plan.md\`).`,
    ``,
    `Output: a locked spec the execution stages can consume without further user input. Then run \`/plan\` → \`/task\` → \`/verify\` with that spec.`,
    ``,
    `## Notes`,
    ``,
    `- Generated by \`harnessed setup\`. Re-run after a harnessed upgrade to refresh.`,
    ``,
    MARKER,
    ``,
  ].join('\n')
}

/** ORCHESTRATOR body (v4.0; v5.0 state-machine sequence) — gate-eval via
 *  `harnessed gates`, seed the sub-progress ledger via `checkpoint start --plan`,
 *  then drive CC-native subagent spawns per fired sub (or escalate to Agent
 *  Teams), checkpointing each outcome (complete on success / fail on error).
 *
 *  v5.0 Spec 1 (STATE-MACHINE-CORE-DESIGN.md §2/§4, D3) — the body deterministically
 *  emits the orchestration sequence so the main CC session drives the state machine
 *  by following the file, not from memory:
 *    1. `harnessed gates <master> --task` → plan JSON (SoT, no spawn)
 *    2. `harnessed checkpoint start <master> --plan '<gates-json>'` → seed ledger
 *    3. per fired sub: `harnessed prompt` → spawn → `checkpoint complete` (evidence
 *       guard auto-runs) on success / `checkpoint fail` on failure
 *    4. is_master fired subs RECURSE (`harnessed gates <sub>`) instead of spawning
 *    5. `harnessed status --recover` to re-orient after compaction. */
function buildOrchestratorBody(name: string, prompt: RolePrompt): string {
  const autoDiscussStep =
    name === 'auto'
      ? [
          `1. FIRST run the discuss stage interactively in THIS session (spawned subagents cannot ask the user questions). Evaluate strategic / phase / subtask clarification criteria for "$ARGUMENTS"; for each that fires, dialogue with the user (AskUserQuestion) and lock decisions; transparent-skip the rest. Produce a locked spec.`,
        ]
      : [
          `1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first (AskUserQuestion) and lock decisions. Otherwise transparent-skip. Produce a locked spec.`,
        ]
  // v5.0 — the deterministic state-machine spawn loop for ONE leaf sub: prompt →
  // spawn → ralph-loop → NEEDS_CLARIFICATION round-trip → checkpoint complete (on
  // COMPLETE) OR checkpoint fail (on unrecoverable failure). Steps a-c are the
  // shared `spawnLoopSteps` (indented 5sp); the leaf variant overrides step d with
  // the evidence-guard (fail-CLOSED) detail and appends step e (checkpoint fail on
  // unrecoverable failure) — both absent from the simpler EXECUTION body.
  const leafIndent = '     '
  // spawnLoopSteps emits steps a-d as 6 lines (b spans 3: the `b.` line + 2
  // continuations); the first 5 are a + b(×3) + c, which the leaf reuses verbatim.
  const leafSpawnLoop = [
    ...spawnLoopSteps(leafIndent).slice(0, 5),
    `${leafIndent}d. On \`<promise>COMPLETE</promise>\`: Bash \`harnessed checkpoint complete <sub> --summary "<one-line>"\`. The evidence guard runs here (fail-CLOSED): if it exits non-zero because a declared \`artifacts_expected\` file is missing, the sub is NOT done — re-spawn to produce the artifact, or pass \`--force\` only to deliberately override (records \`evidence_status: overridden\`).`,
    `${leafIndent}e. If the sub cannot reach COMPLETE (max_iterations exhausted, unrecoverable error): Bash \`harnessed checkpoint fail <sub> --summary "<why>"\` to flip the ledger entry to \`failed\`, then STOP and report to the user.`,
  ]
  return [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    LANG_DIRECTIVE,
    ``,
    `## How to run (orchestrator — clarify in THIS session, then drive native subagent spawns)`,
    ``,
    `harnessed is the orchestration brain: \`harnessed gates\` tells you which subs fire, \`harnessed prompt\` gives you each sub's spawn-ready prompt, and \`harnessed checkpoint\` records the per-sub state-machine ledger. YOU (the main session) do the spawning with CC-native Task / Agent tools — keeping the session responsive, enabling Agent Teams, and letting clarification round-trips reach the user.`,
    ``,
    `Drive this exact sequence (it is the state machine — follow the file, don't improvise from memory):`,
    ``,
    ...autoDiscussStep,
    `2. Bash: \`harnessed gates ${name} --task "<locked spec>" --skip-sub clarify\` → parse the JSON \`{fire: [{sub, order, mode, is_master}], skip: [{sub, reason}], parallelism: {escalate_to_teams}}\`. This is the plan SoT (no spawn). Keep the verbatim JSON for the next step.`,
    `3. Bash: \`harnessed checkpoint start ${name} --plan '<the verbatim gates JSON from step 2>'\` → seeds the sub-progress ledger in \`current-workflow.json\` (fired subs → \`pending\`, skipped subs → \`skipped\` + reason). This makes \`harnessed status --recover\` able to tell you where you are after compaction.`,
    `4. If \`parallelism.escalate_to_teams === true\`: this stage needs multiple subagents to coordinate (SendMessage / shared contract). Read \`~/.claude/rules/agent-teams.md\`, then \`TeamCreate\` → \`Agent(name, team_name, ...)\` per fired sub (prompt from \`harnessed prompt <sub>\`) → coordinate via SendMessage → \`SendMessage shutdown_request\` + \`TeamDelete\`. Still checkpoint each sub (\`complete\` / \`fail\`) as below.`,
    `5. Otherwise, for each fired sub in \`order\` (serial subs sequentially, parallel subs concurrently via parallel Task calls):`,
    `   - **If the fired entry has \`is_master: true\`** (it is itself a stage master, e.g. \`/auto\` firing \`plan\`/\`task\`/\`verify\`): do NOT prompt+spawn it directly — that would yield a vague dispatcher. RECURSE: run that master's orchestration — \`harnessed gates <sub> --task "<spec>" --skip-sub clarify\` → \`harnessed checkpoint start <sub> --plan '<that JSON>'\` → repeat this whole loop for ITS fired subs. Only leaf subs (no \`is_master\`) reach the spawn loop below.`,
    `   - **Else (leaf sub)** — spawn it, then checkpoint the outcome:`,
    ...leafSpawnLoop,
    `6. After all fired subs are \`done\` (or recorded \`failed\`), Bash \`harnessed status --recover\` to confirm the ledger position (what's done, what's still pending, any evidence drift). Report a per-sub fired/skipped/done/failed summary to the user. ${name === 'auto' ? 'Then run the `retro` stage to capture lessons.' : ''}`,
    ``,
    `**If you lose context (compaction / resume):** run \`harnessed status --recover\` first — it reads the ledger and prints "you are here, this is next" so you can resume the loop at the first \`pending\` sub instead of restarting. If the ledger is empty (no \`--plan\` was seeded), re-run steps 2-3.`,
    ``,
    `Do NOT pipe to \`harnessed run ${name}\` — that is the CI/headless path (SDK spawn, blocks the session, no Agent Teams, no clarification round-trip).`,
    ``,
    `## Notes`,
    ``,
    `- Generated by \`harnessed setup\`. Re-run after a harnessed upgrade to refresh.`,
    `- gate/discipline SoT: \`workflows/${nameToYamlHintPath(name)}\` + \`workflows/judgments/\` — consumed by \`harnessed gates\` + \`harnessed prompt\`.`,
    `- The per-sub ledger + evidence guard live in \`current-workflow.json\` (sole SoT) — written only by \`harnessed checkpoint\`; never edit state files directly.`,
    ``,
    MARKER,
    ``,
  ].join('\n')
}

/** EXECUTION body (v4.0) — single sub: prompt → native spawn → clarify → checkpoint. */
function buildExecutionBody(name: string, prompt: RolePrompt): string {
  return [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    LANG_DIRECTIVE,
    ``,
    `## How to run (execution — native subagent spawn)`,
    ``,
    `harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).`,
    ``,
    ...spawnLoopSteps('').map((s) =>
      s.replace('<sub>', name).replace('--task "<spec>"', '--task "$ARGUMENTS"'),
    ),
    ``,
    `Do NOT pipe to \`harnessed run ${name}\` — that is the CI/headless path (SDK spawn).`,
    ``,
    `## Notes`,
    ``,
    `- Generated by \`harnessed setup\`. Re-run after a harnessed upgrade to refresh.`,
    `- The sister \`~/.claude/skills/${name}/SKILL.md\` is the Skill-tool entry point (Claude loads it when triggers match). gate/discipline SoT: \`workflows/${nameToYamlHintPath(name)}\`.`,
    ``,
    MARKER,
    ``,
  ].join('\n')
}

/**
 * Build `~/.claude/commands/<name>.md` content for a single workflow.
 *
 * v4.0 — harnessed = orchestration brain + prompt library. Three body types:
 *   INTERACTIVE (discuss family + task-clarify): main-session dialogue, never spawn
 *   ORCHESTRATOR (auto / plan / task / verify): `harnessed gates` → CC-native
 *     subagent spawns per fired sub (or Agent Teams escalation) with prompts
 *     from `harnessed prompt`, ralph-loop completion, NEEDS_CLARIFICATION round-trip
 *   EXECUTION (everything else): single sub — `harnessed prompt` → native spawn
 *
 * The CC main session is the executor; harnessed CLIs are秒级 advisors (gates /
 * prompt / checkpoint). Replaces v3.x `harnessed run` SDK-spawn (which blocked
 * the session, bypassed Agent Teams, broke clarification round-trips).
 *
 * The 5-arg signature is preserved for back-compat; no `{{ capabilities }}`
 * placeholders are rendered (warnings always empty).
 */
export function generateCommandFile(
  name: string,
  prompt: RolePrompt,
  _capabilities: CapabilityMap,
  _installedPlugins: Set<string>,
  _installedUserSkills: Set<string>,
): { content: string; warnings: string[] } {
  const isMaster = prompt.is_master === true
  const argHint = isMaster ? '[task description]' : '[requirement text or omit]'

  let body: string
  if (INTERACTIVE_COMMANDS.has(name)) {
    body = buildInteractiveBody(name, prompt)
  } else if (ORCHESTRATOR_COMMANDS.has(name)) {
    body = buildOrchestratorBody(name, prompt)
  } else {
    body = buildExecutionBody(name, prompt)
  }

  const warnings: string[] = []

  const frontmatter = [
    '---',
    `description: ${JSON.stringify(prompt.description)}`,
    `argument-hint: ${JSON.stringify(argHint)}`,
    '---',
    '',
  ].join('\n')

  return { content: frontmatter + body, warnings }
}

/** Returns the relative `workflows/...` path matching the 3-tier
 *  resolveWorkflowYaml lookup in src/cli/run.ts. Used in the Notes section
 *  to hint where the runtime yaml lives. */
function nameToYamlHintPath(name: string): string {
  if (['auto', 'research', 'retro'].includes(name)) return `${name}/workflow.yaml`
  if (['discuss', 'plan', 'task', 'verify', 'ship'].includes(name))
    return `${name}/auto/workflow.yaml`
  const dashIdx = name.indexOf('-')
  if (dashIdx > 0) {
    return `${name.slice(0, dashIdx)}/${name.slice(dashIdx + 1)}/workflow.yaml`
  }
  return `${name}/workflow.yaml`
}

/** v3.4.4 marker — every command file generated by this tool emits this trailing
 *  comment as the last non-blank body line. `harnessed setup` overwrites any file
 *  containing this marker (or the older v3.4.3 dual-path signature) and preserves
 *  files with neither (true user-authored). Pattern is digit-loose so future
 *  v3.4.5+ patches can re-overwrite without losing the property. */
// v4.1.2 — digit-loose across majors so a future marker bump (e.g. v4.x) stays
// self-overwriting instead of being misread as user-authored + skipped on upgrade.
const HARNESSED_MARKER_RX = /<!--\s*harnessed-generated:v\d+\.\d+\.\d+\s*-->/

/** Detect the v3.4.3 dual-path body shape — overwrite even though it has no
 *  marker because it shipped before markers existed. Two-signal AND so we don't
 *  false-positive on user files that happen to mention "SlashCommand". Matches
 *  the sub-workflow variant (preferred=SlashCommand, fallback=Task spawn). */
const V3_4_3_SIGNATURE_SUB_RX =
  /\*\*Preferred path\*\*[\s\S]*use the SlashCommand tool[\s\S]*\*\*Fallback path\*\*[\s\S]*use the Task tool to spawn/

/** Detect the v3.4.3 master/standalone-orchestrator dispatcher variant — bodies
 *  for /auto, /discuss, /plan, /task, /verify, /research used "dispatch to the
 *  per-sub-workflow slash commands" instead of "use the SlashCommand tool", so
 *  V3_4_3_SIGNATURE_SUB_RX missed them and they were misclassified as
 *  user-authored. This phrase is distinctive enough that **Preferred path**
 *  + the literal sub-workflow dispatch sentence is a safe two-signal AND. */
const V3_4_3_SIGNATURE_MASTER_RX = /\*\*Preferred path\*\*[\s\S]*dispatch to the per-sub-workflow/

/** Returns true when the file is harnessed-generated (any version) and may be
 *  safely overwritten by `harnessed setup`. User-authored files (neither marker
 *  nor v3.4.3 signature present) are skipped with a warning. */
export function shouldOverwriteFile(content: string): boolean {
  return (
    HARNESSED_MARKER_RX.test(content) ||
    V3_4_3_SIGNATURE_SUB_RX.test(content) ||
    V3_4_3_SIGNATURE_MASTER_RX.test(content)
  )
}

/**
 * Write all sub-workflow commands files to `<commandsDir>`. v3.4.4 marker-based
 * overwrite: a file is overwritten when it carries the harnessed marker OR
 * matches the v3.4.3 dual-path signature; truly user-authored files (with
 * neither) are skipped with a warning. The 9-arg signature stays backwards-
 * compatible because `fileExists` and `readFileSync` have default values —
 * existing 7-arg callers in setup.ts continue to work.
 */
export async function writeAllCommands(
  slashNames: string[],
  commandsDir: string,
  rolePrompts: Record<string, RolePrompt>,
  capabilities: CapabilityMap,
  installedPlugins: Set<string>,
  installedUserSkills: Set<string>,
  writer: (path: string, content: string) => Promise<void>,
  fileExists: (path: string) => boolean = existsSync,
  readFileSync: (path: string) => string = (p) => nodeReadFileSync(p, 'utf8'),
): Promise<{ results: CommandWriteResult[]; warnings: string[] }> {
  const results: CommandWriteResult[] = []
  const aggregatedWarnings = new Set<string>()

  for (const name of slashNames) {
    const path = join(commandsDir, `${name}.md`)
    const prompt = rolePrompts[name]
    if (!prompt) {
      results.push({
        name,
        path,
        written: false,
        warning: `no role-prompts.yaml entry for '${name}' — skipping commands/${name}.md generation`,
      })
      aggregatedWarnings.add(`role-prompts.yaml missing entry for '${name}'`)
      continue
    }

    // v3.4.4 — marker-based overwrite. Skip ONLY when file exists AND is
    // user-authored (neither harnessed marker nor v3.4.3 dual-path signature
    // present). Harnessed-generated files get re-rendered (in case role-prompts
    // .yaml changed) — that's the upgrade path from v3.4.3 → v3.4.4.
    if (fileExists(path)) {
      let existing = ''
      try {
        existing = readFileSync(path)
      } catch {
        existing = ''
      }
      if (!shouldOverwriteFile(existing)) {
        results.push({
          name,
          path,
          written: false,
          warning: `commands/${name}.md is user-authored (no harnessed marker) — leaving unchanged. Delete the file to force regenerate.`,
        })
        continue
      }
      // Else: harnessed-generated (v3.4.3 or older v3.4.4) → overwrite below.
    }

    const { content, warnings } = generateCommandFile(
      name,
      prompt,
      capabilities,
      installedPlugins,
      installedUserSkills,
    )
    try {
      await writer(path, content)
      results.push({ name, path, written: true })
    } catch (e) {
      results.push({
        name,
        path,
        written: false,
        warning: `write failed for commands/${name}.md: ${(e as Error).message}`,
      })
    }
    for (const w of warnings) aggregatedWarnings.add(w)
  }

  return { results, warnings: [...aggregatedWarnings] }
}
