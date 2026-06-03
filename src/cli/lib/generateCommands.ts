// v3.4.4 — Generate ~/.claude/commands/<x>.md from workflows/role-prompts.yaml.
//
// SCHEMA EVOLUTION:
//   v3.4.3 — dual-path body (SlashCommand "Preferred path" + Task-spawn
//     "Fallback path"). Both paths sidestepped the workflow runtime entirely;
//     the disciplines + judgments + master orchestration in src/workflow/ never
//     fired. SlashCommand path was also vapor when no upstream was installed.
//   v3.4.4 — single-path body that ALWAYS invokes the workflow runtime via
//     `harnessed run <name>` (Bash). This wires `~/.claude/commands/<x>.md`
//     to src/workflow/run.ts (the real orchestrator) instead of bypassing it.
//
// MARKER-BASED OVERWRITE (Option 2):
//   Each generated file emits `<!-- harnessed-generated:v3.4.x -->` as its
//   trailing marker. `writeAllCommands` overwrites files containing either
//   that marker OR the v3.4.3 dual-path signature; truly user-authored files
//   (with neither) are preserved with a warning. This lets `harnessed setup`
//   upgrade stale v3.4.3-generated files in place without clobbering customs.
//
// Karpathy simplicity: pure functions, single yaml load, ≤250 LOC, no new deps.

import { existsSync, readFileSync as nodeReadFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
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

/** Load and parse `<workflowsDir>/role-prompts.yaml`. Tolerant of missing file. */
export async function loadRolePrompts(workflowsDir: string): Promise<Record<string, RolePrompt>> {
  const path = join(workflowsDir, 'role-prompts.yaml')
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }
  const doc = parseYaml(raw) as RolePromptsDoc | null
  return doc?.prompts ?? {}
}

/** v3.9.26 Option A — commands whose work is pure clarification requiring user
 *  dialogue. Headless SDK subagents cannot ask the user questions (brainstorming
 *  degenerates into self-Q&A), so these run entirely in the main CC session.
 *  Per user CLAUDE.md 铁律: "澄清必须在主 session 完成后再下放". */
const INTERACTIVE_COMMANDS = new Set([
  'discuss',
  'discuss-strategic',
  'discuss-phase',
  'discuss-subtask',
  'task-clarify',
])

/** v3.9.26 Option A — commands that need interactive clarification FIRST, then
 *  spawn execution stages via `harnessed run` with `--skip-sub clarify`. */
const HYBRID_COMMANDS = new Set(['auto', 'task'])

const MARKER = `<!-- harnessed-generated:v3.4.4 -->`

/** Interactive body — main-session clarification, never spawn. */
function buildInteractiveBody(name: string, prompt: RolePrompt): string {
  return [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    `## How to run (interactive — in THIS session)`,
    ``,
    `Clarification requires real user dialogue. Spawned subagents cannot ask the user questions, so run this stage directly in this session — do NOT spawn \`harnessed run ${name}\`.`,
    ``,
    `1. Evaluate the clarification criteria for "$ARGUMENTS":`,
    `   - Strategic layer: new feature / new milestone / unclear business scope → run gstack \`/office-hours\` + \`/plan-ceo-review\``,
    `   - Phase layer: ≥2 open implementation decisions / unclear cross-phase API contract → run GSD \`/gsd-discuss-phase\``,
    `   - Subtask layer: ≥2 distinct approaches / core algorithm / API contract design / high error cost → run superpowers brainstorming`,
    `2. For each layer that fires, hold the dialogue with the user (use AskUserQuestion for option-style decisions). Lock every open decision.`,
    `3. Skip layers that don't fire — state which were skipped and why (transparent skip).`,
    `4. Persist locked decisions to \`.planning/\` via planning-with-files (\`findings.md\` / \`task_plan.md\`).`,
    ``,
    `Output: a locked spec the execution stages can consume without further user input.`,
    ``,
    `## Notes`,
    ``,
    `- This file is generated by \`harnessed setup\`. Re-run \`harnessed setup\` after a harnessed upgrade to refresh.`,
    `- The downstream execution command (\`/plan\` → \`/task\` → \`/verify\`) embeds the locked spec in its task text.`,
    ``,
    MARKER,
    ``,
  ].join('\n')
}

/** Hybrid body — interactive clarification first, then spawn execution chain. */
function buildHybridBody(name: string, prompt: RolePrompt): string {
  const chain =
    name === 'auto'
      ? [
          `3. Then run the execution stages in order via the Bash tool (each stage's output informs the next):`,
          ``,
          '```bash',
          `echo "<locked spec + $ARGUMENTS>" | harnessed run plan --task-stdin`,
          `echo "<locked spec + plan output>" | harnessed run task --task-stdin --skip-sub clarify`,
          `echo "<locked spec + task output>" | harnessed run verify --task-stdin`,
          `echo "<summary of all stages>" | harnessed run retro --task-stdin`,
          '```',
          ``,
          `   Do NOT run \`harnessed run auto\` — that would re-spawn the discuss stage headlessly, defeating the interactive clarification you just did.`,
          `   \`--skip-sub clarify\` tells the task master that clarification is already done.`,
        ]
      : [
          `3. Then spawn the execution subs via the Bash tool:`,
          ``,
          '```bash',
          `echo "<locked spec + $ARGUMENTS>" | harnessed run task --task-stdin --skip-sub clarify`,
          '```',
          ``,
          `   \`--skip-sub clarify\` tells the task master that clarification is already done in this session.`,
        ]
  return [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    `## How to run (hybrid — clarify in THIS session, then spawn execution)`,
    ``,
    `1. FIRST clarify interactively in this session (spawned subagents cannot ask the user questions):`,
    `   - Evaluate the subtask clarification criteria for "$ARGUMENTS": ≥2 distinct approaches / core algorithm / API contract design / high error cost → brainstorm with the user (AskUserQuestion for option-style decisions) and lock every open decision.`,
    `   - If criteria don't fire (CRUD / known pattern / single obvious implementation), skip with a one-line transparent declaration.`,
    `2. Embed the locked decisions into the task text passed downstream.`,
    ...chain,
    ``,
    `## Notes`,
    ``,
    `- This file is generated by \`harnessed setup\`. Re-run \`harnessed setup\` after a harnessed upgrade to refresh.`,
    `- Execution stages (code / test / deliver / verify) spawn headless subagents — appropriate since they need no user dialogue.`,
    ``,
    MARKER,
    ``,
  ].join('\n')
}

/** Spawn body — v3.4.4 single-path `harnessed run` invocation (unchanged). */
function buildSpawnBody(name: string, prompt: RolePrompt): string {
  const stagedNote =
    name === 'auto'
      ? '\n- For stage-by-stage review, append `--staged` (pauses between stages for user review).'
      : ''
  return [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    `## How to invoke`,
    ``,
    `Use the Bash tool to run:`,
    ``,
    '```bash',
    `echo "$ARGUMENTS" | harnessed run ${name} --task-stdin`,
    '```',
    ``,
    `If \`$ARGUMENTS\` is empty (slash command invoked with no args), run \`harnessed run ${name}\` (no stdin pipe).`,
    ``,
    `After completion, the Bash output prints a \`Next:\` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.`,
    ``,
    `## Notes`,
    ``,
    `- This file is generated by \`harnessed setup\` v3.4.4+. Re-run \`harnessed setup\` after a harnessed upgrade to refresh.`,
    `- The sister \`~/.claude/skills/${name}/SKILL.md\` is the Skill-tool entry point (Claude loads it when triggers match \`trigger_phrases:\`). Both files invoke the same \`harnessed run ${name}\` Bash command.${stagedNote}`,
    `- Workflow runtime: \`src/workflow/run.ts\` walks \`workflows/${nameToYamlHintPath(name)}\` with disciplines + judgments + master orchestration applied per the yaml \`delegates_to[]\` + \`gate\` clauses.`,
    ``,
    MARKER,
    ``,
  ].join('\n')
}

/**
 * Build `~/.claude/commands/<name>.md` content for a single workflow.
 *
 * v3.4.4 — Single-path body: ALWAYS invoke `harnessed run <name>` via the Bash
 * tool. The shell pipe `echo "$ARGUMENTS" | harnessed run <name> --task-stdin`
 * avoids shell-escape pain on user-supplied requirements containing quotes /
 * `$` / backticks; if `$ARGUMENTS` is empty the no-stdin variant runs.
 *
 * v3.9.26 Option A — three body types:
 *   INTERACTIVE (discuss family + task-clarify): main-session dialogue, never spawn
 *   HYBRID (auto / task): interactive clarify first, then spawn with --skip-sub
 *   SPAWN (everything else): v3.4.4 single-path body unchanged
 *
 * The 5-arg signature (capabilities + installedPlugins + installedUserSkills)
 * is preserved for forward compatibility but no longer renders `{{ capabilities
 * .<x>.cmd }}` placeholders — the v3.4.4 body has no placeholders.
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
  } else if (HYBRID_COMMANDS.has(name)) {
    body = buildHybridBody(name, prompt)
  } else {
    body = buildSpawnBody(name, prompt)
  }

  // v3.4.4 — no `{{ capabilities.<x>.cmd }}` placeholder in body, so renderSkillBody
  // is not invoked and warnings are always empty (signature retained for back-compat).
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
  if (['discuss', 'plan', 'task', 'verify'].includes(name)) return `${name}/auto/workflow.yaml`
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
const HARNESSED_MARKER_RX = /<!--\s*harnessed-generated:v3\.4\.\d+\s*-->/

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
