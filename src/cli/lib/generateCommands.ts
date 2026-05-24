// v3.4.3 — Generate ~/.claude/commands/<x>.md from workflows/role-prompts.yaml.
//
// Background (why v3.4.2 left `/verify-paranoid` etc. non-invocable as a slash
// command): a sub-workflow SKILL.md at `~/.claude/skills/verify-paranoid/SKILL.md`
// is Skill-tool loadable, NOT SlashCommand-tool registered. To actually expose
// `/verify-paranoid` as a real Claude Code slash command the platform requires a
// file at `~/.claude/commands/<x>.md` (filename = slash name, optional YAML
// frontmatter, body = prompt). This module is the writer for those files.
//
// Each command file embeds:
//   - Preferred path: invoke the resolved primary capability slash cmd
//     (`{{ capabilities.<x>.cmd }}` → e.g. `/review`). When the upstream is
//     installed, the platform routes there; when missing, the fallback runs.
//   - Fallback path: self-contained role-prompt for a Task-spawned subagent.
//     Adapted from gstack expert prompts where available. Works even when no
//     upstream is on disk.
//
// Karpathy simplicity: pure functions, single yaml load, ≤200 LOC, no new deps.

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { CapabilityMap } from './capabilityResolver.js'
import { renderSkillBody } from './capabilityResolver.js'

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

/**
 * Build `~/.claude/commands/<name>.md` content for a single sub-workflow.
 *
 * The body is rendered through {@link renderSkillBody} so the `{{ capabilities
 * .<x>.cmd }}` placeholder for `primary_cap` resolves to the live slash command
 * (or stays verbatim if the resolver wants to emit a missing-backing warning,
 * sister SKILL.md rendering behavior).
 */
export function generateCommandFile(
  name: string,
  prompt: RolePrompt,
  capabilities: CapabilityMap,
  installedPlugins: Set<string>,
  installedUserSkills: Set<string>,
): { content: string; warnings: string[] } {
  const isMaster = prompt.is_master === true
  const primaryCmdLine =
    prompt.primary_cap && capabilities[prompt.primary_cap]
      ? `{{ capabilities.${prompt.primary_cap}.cmd }}`
      : ''

  const checklistBlock = prompt.checklist.length
    ? prompt.checklist.map((item, i) => `> ${i + 1}. ${item}`).join('\n>\n')
    : '> (Master orchestrator — dispatches to per-sub-workflow slash commands listed below.)'

  const fallbackPath = isMaster
    ? `**Fallback path** (when no slash command from the sub-list resolves): run each missing sub-workflow inline using its own role prompt (see \`~/.claude/skills/<sub-name>/SKILL.md\` for the per-sub fallback prompt). Do NOT skip stages silently — each sub either runs or is logged as "skipped: <reason>".`
    : [
        `**Fallback path** (when the upstream isn't installed or returns no result): use the Task tool to spawn a general-purpose subagent with this prompt:`,
        ``,
        `> You are a **${prompt.specialist}**.`,
        `>`,
        `> **Mission**: ${prompt.responsibility.trim().replace(/\n/g, ' ')}`,
        `>`,
        `> **Default-suspect mode**: assume the change is broken / risky / incomplete until proven otherwise. Cite \`file:line\` for every finding; do not generalize.`,
        `>`,
        `> **Review checklist**:`,
        checklistBlock,
        `>`,
        `> **Output format**: structured report with severity-classified findings (${prompt.severity}). One finding per line: \`[severity] file:line — problem (one sentence); fix: suggested change\`. If no findings, say so explicitly. No preamble, no end-of-report summary.`,
        ``,
        `(The role prompt is self-contained — works even when the upstream \`${prompt.primary_cap || 'specialist'}\` user-skill / plugin isn't installed.)`,
      ].join('\n')

  const preferredPath = primaryCmdLine
    ? `**Preferred path** (when the upstream specialist is installed): use the SlashCommand tool to run \`${primaryCmdLine}\` — the upstream specialist takes over.`
    : `**Preferred path** (master orchestrator): dispatch to the per-sub-workflow slash commands in the order this stage prescribes. Each sub command is its own \`~/.claude/commands/<sub-name>.md\` and has its own dual-path fallback.`

  const rawBody = [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    `## How to invoke`,
    ``,
    preferredPath,
    ``,
    fallbackPath,
    ``,
    `## Notes`,
    ``,
    `- This file (\`~/.claude/commands/${name}.md\`) is generated by \`harnessed setup\` from \`workflows/role-prompts.yaml\` + \`workflows/<stage>/<sub>/SKILL.md\`. To regenerate after a harnessed upgrade, re-run \`harnessed setup\`.`,
    `- The companion \`~/.claude/skills/${name}/SKILL.md\` is the Skill-tool entry point (Claude loads it when triggers match \`trigger_phrases:\`). Both files carry the same dual-path instruction.`,
    `- If your shell shows a \`⚠️ ... not installed\` warning from \`harnessed setup\` for this command, the upstream is missing on disk — install per the warning, OR rely on the fallback Task-spawn role prompt above (it does not require the upstream).`,
    ``,
  ].join('\n')

  // Render `{{ capabilities.<x>.cmd }}` placeholder via sister resolver.
  const { body, warnings } = renderSkillBody(
    rawBody,
    capabilities,
    installedPlugins,
    installedUserSkills,
  )

  // Frontmatter — `description` only (no allowed-tools restriction so the
  // command can spawn Task / SlashCommand / Read freely).
  const frontmatter = ['---', `description: ${JSON.stringify(prompt.description)}`, '---', ''].join(
    '\n',
  )

  return { content: frontmatter + body, warnings }
}

/**
 * Write all sub-workflow commands files to `<commandsDir>`. Skips per-file when
 * a same-named user file already exists (additive only — never overwrite a
 * user-authored command). Returns per-file outcomes for setup.ts log emission.
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
    if (fileExists(path)) {
      results.push({
        name,
        path,
        written: false,
        warning: `commands/${name}.md already exists — leaving user file unchanged`,
      })
      continue
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
