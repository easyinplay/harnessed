// src/cli/prompt.ts — `harnessed prompt <sub> [--task <text>] [--json]`.
//
// Outputs a spawn-ready prompt for a sub-workflow (role prompt body + checklist
// + completion/clarification protocols). NO spawning — just prints text the CC
// main session feeds into its native Task tool.
//
// v4.0 core addition: appends two protocols (completion COMPLETE + clarification
// NEEDS_CLARIFICATION gray-area回流) so spawned subagents follow the CLAUDE.md
// 铁律 "遇到 gray area 必须返回 STATUS: NEEDS_CLARIFICATION".
//
// Reuses buildAgentDef from src/workflow/run.ts (role-prompt body + conservative
// fallback for subs not in role-prompts.yaml). Fallback subs still get the two
// protocols, so unknown <sub> works (exit 0). Only hard error: missing workflows
// dir (role-prompts.yaml unreadable is non-fatal → empty registry → fallback).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { parse as parseYaml } from 'yaml'
import { getLocale, type SupportedLocale } from '../i18n/index.js'
import { resolveLocaleYaml } from '../i18n/localeYaml.js'
import { buildAgentDef } from '../workflow/run.js'
import { loadRolePrompts } from './lib/generateCommands.js'
import { getPackageRoot } from './lib/packagePath.js'
import { resolveWorkflowYaml } from './run.js'

const DEFAULT_MAX_ITERATIONS = 20
const DEFAULT_MODEL = 'sonnet'
const DEFAULT_SPECIALIST = 'Implementation Engineer'

/** v4.0.1 — language discipline injection. The `language` discipline
 *  (workflows/disciplines/language.yaml) says output follows env.HARNESSED_USER_LANG
 *  (set by `harnessed setup` Step D). v4.0 spawns CC-native subagents via this
 *  prompt, so the language directive must be IN the prompt — nothing else wires
 *  it in. Without it, spawned subagents (and the prompt's own tone) default to
 *  English even when the user configured zh-Hans. */
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  'zh-Hans': '简体中文 (Simplified Chinese)',
  'zh-CN': '简体中文 (Simplified Chinese)',
  'zh-Hant': '繁體中文 (Traditional Chinese)',
  'zh-TW': '繁體中文 (Traditional Chinese)',
}

/** v4.1 — Tools section. Reads the sub's workflow.yaml `tools_available[]`, maps
 *  each to its capabilities.yaml `cmd`, and emits a MANDATORY invocation block.
 *  Without this, the spawned subagent only sees the role-prompt's soft prose
 *  ("persist via planning-with-files") and improvises — skipping the actual
 *  /gsd-plan-phase + /plan slash commands + GSD doc artifacts. Fail-soft: any
 *  read/parse miss → empty string (prompt still works, just without the block). */
/** v4.1.2 — shared preamble for the tools + disciplines sections: resolve the
 *  sub's workflow.yaml, read+parse it, return one declared array field (or []).
 *  Fail-soft → [] (caller emits no section). */
async function loadSubArrayField(
  sub: string,
  packageRoot: string,
  field: string,
): Promise<string[]> {
  const subYaml = await resolveWorkflowYaml(sub, resolve(packageRoot, 'workflows'))
  if (!subYaml) return []
  const wf = parseYaml(await readFile(subYaml, 'utf8')) as Record<string, unknown> | null
  const v = wf?.[field]
  return Array.isArray(v) ? (v as string[]) : []
}

async function buildToolsSection(sub: string, packageRoot: string): Promise<string> {
  try {
    const workflowsDir = resolve(packageRoot, 'workflows')
    const tools = await loadSubArrayField(sub, packageRoot, 'tools_available')
    if (tools.length === 0) return ''

    const capRaw = await readFile(resolve(workflowsDir, 'capabilities.yaml'), 'utf8')
    const capDoc = parseYaml(capRaw) as {
      capabilities?: Record<string, { cmd?: string; impl?: string }>
    } | null
    const caps = capDoc?.capabilities ?? {}
    const lines: string[] = []
    for (const tool of tools) {
      const cmd = caps[tool]?.cmd
      const impl = caps[tool]?.impl
      lines.push(cmd ? `- Invoke \`${cmd}\` (${tool}${impl ? `, ${impl}` : ''})` : `- ${tool}`)
    }
    if (lines.length === 0) return ''
    return `\n## Tools — invoke these (not optional)\nThis workflow's SoT declares the following upstream tools. Actually invoke them as part of your work — do NOT improvise a lightweight substitute. Persist artifacts in the upstream's native format (e.g. planning-with-files → \`task_plan.md\` / \`progress.md\` / \`findings.md\`; GSD → \`PLAN.md\` / \`STATE.md\`).\n${lines.join('\n')}\n`
  } catch {
    return ''
  }
}

/** v4.1.1 — Disciplines section. Reads the sub's workflow.yaml
 *  `disciplines_applied[]`, then each `disciplines/<name>.yaml` rule list, and
 *  emits a compact always-on directive block. Same flatten bug as tools: the 6
 *  L0 disciplines (karpathy 心法 / output-style / operational / priority /
 *  protocols / language) are declared in the yaml SoT but v4.0 never injected
 *  them into the spawn prompt, so subagents ignored ≤200 LOC / surgical /
 *  biome-preempt / BLUF / commit-safety. `language` is skipped here (handled by
 *  buildLanguageSection from env.HARNESSED_USER_LANG). Fail-soft → empty. */
export async function buildDisciplinesSection(
  sub: string,
  packageRoot: string,
  locale: SupportedLocale = getLocale(),
): Promise<string> {
  try {
    const workflowsDir = resolve(packageRoot, 'workflows')
    const disciplinesDir = resolve(workflowsDir, 'disciplines')
    const applied = await loadSubArrayField(sub, packageRoot, 'disciplines_applied')
    // language handled separately; skip to avoid duplicate directive.
    const names = applied.filter((d) => d !== 'language')
    if (names.length === 0) return ''

    const blocks: string[] = []
    for (const name of names) {
      try {
        const dRaw = await readFile(resolveLocaleYaml(disciplinesDir, name, locale), 'utf8')
        const dDoc = parseYaml(dRaw) as { rules?: { description?: string }[] } | null
        const rules = Array.isArray(dDoc?.rules) ? dDoc.rules : []
        const descs = rules
          .map((r) => (typeof r.description === 'string' ? r.description.trim() : ''))
          .filter((s) => s.length > 0)
          .map((s) => `  - ${s.replace(/\s+/g, ' ')}`)
        if (descs.length > 0) blocks.push(`- **${name}**:\n${descs.join('\n')}`)
      } catch {
        /* skip unreadable discipline */
      }
    }
    if (blocks.length === 0) return ''
    return `\n## Disciplines (always-on — L0 substrate)\nFollow these behavioral disciplines while doing the work:\n${blocks.join('\n')}\n`
  } catch {
    return ''
  }
}

/** Build the `## Language` section from env.HARNESSED_USER_LANG. Empty string
 *  when unset (subagent then mirrors the user's conversation language naturally). */
function buildLanguageSection(): string {
  const code = process.env.HARNESSED_USER_LANG
  if (!code) return ''
  const name = LANG_NAMES[code] ?? code
  return `\n## Language\nRespond in ${name}. Keep code, commands, file/identifier/API names, error messages, stack traces, URLs, commit hashes, and version numbers in their original form (do not translate or transliterate them).\n`
}

const PROTOCOLS = `
## Completion protocol
When done emit: <promise>COMPLETE</promise>

## Clarification protocol
If you hit a gray area you cannot decide (≥2 reasonable options, missing key context, ambiguous requirement), do NOT self-decide. Emit:
STATUS: NEEDS_CLARIFICATION
1. <question>
2. <question>
The main session will relay these to the user and re-spawn you with answers.
`

interface RawOpts {
  task?: string
  json?: boolean
}

/** Resolve max_iterations from workflows/defaults.yaml `ralph_max_iterations[sub]`.
 *  Structure is `ralph_max_iterations.<workflow>.<phase>` (per-phase object). For
 *  this CLI we look up `ralph_max_iterations[sub]`: if it's a plain number use it;
 *  if it's an object (the per-phase shape) take any numeric value; else default 20.
 *  Any read/parse failure → default 20 (fail-soft, never blocks prompt output). */
async function resolveMaxIterations(sub: string, packageRoot: string): Promise<number> {
  try {
    const path = resolve(packageRoot, 'workflows', 'defaults.yaml')
    const raw = await readFile(path, 'utf8')
    const doc = parseYaml(raw) as { ralph_max_iterations?: Record<string, unknown> } | null
    const entry = doc?.ralph_max_iterations?.[sub]
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      return entry
    }
    if (entry && typeof entry === 'object') {
      for (const v of Object.values(entry as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          return v
        }
      }
    }
    return DEFAULT_MAX_ITERATIONS
  } catch {
    return DEFAULT_MAX_ITERATIONS
  }
}

export function registerPrompt(program: Command): void {
  program
    .command('prompt')
    .description(
      'Print a spawn-ready prompt for a sub-workflow (role + checklist + protocols, no spawn).',
    )
    .argument('<sub>', 'sub-workflow name (e.g. task-code, verify-paranoid)')
    .option('--task <text>', 'task description prepended as a ## Task section')
    .option('--json', 'emit JSON {prompt, max_iterations, model, specialist} instead of text')
    .action(async (sub: string, raw: RawOpts) => {
      const packageRoot = getPackageRoot()
      const workflowsDir = resolve(packageRoot, 'workflows')

      // Missing workflows dir is the only hard error (role-prompts.yaml unreadable
      // is non-fatal → loadRolePrompts returns {} → buildAgentDef fallback path).
      const rolePrompts = await loadRolePrompts(workflowsDir)

      const def = buildAgentDef(sub, rolePrompts)
      const body = def.prompt

      const taskSection =
        typeof raw.task === 'string' && raw.task.length > 0 ? `## Task\n${raw.task}\n\n` : ''

      const toolsSection = await buildToolsSection(sub, packageRoot)
      const disciplinesSection = await buildDisciplinesSection(sub, packageRoot)
      const fullPrompt = `${taskSection}${body}\n${toolsSection}${disciplinesSection}${PROTOCOLS}${buildLanguageSection()}`

      if (raw.json) {
        const maxIterations = await resolveMaxIterations(sub, packageRoot)
        const rp = rolePrompts[sub]
        const model = def.model ?? DEFAULT_MODEL
        const specialist = rp?.specialist ?? DEFAULT_SPECIALIST
        console.log(
          JSON.stringify({
            prompt: fullPrompt,
            max_iterations: maxIterations,
            model,
            specialist,
          }),
        )
        process.exit(0)
      }

      console.log(fullPrompt)
      process.exit(0)
    })
}
