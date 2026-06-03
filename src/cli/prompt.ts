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
import { buildAgentDef } from '../workflow/run.js'
import { loadRolePrompts } from './lib/generateCommands.js'
import { getPackageRoot } from './lib/packagePath.js'

const DEFAULT_MAX_ITERATIONS = 20
const DEFAULT_MODEL = 'sonnet'
const DEFAULT_SPECIALIST = 'Implementation Engineer'

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

      const def = buildAgentDef(sub, rolePrompts, undefined, undefined, undefined)
      const body = def.prompt

      const taskSection =
        typeof raw.task === 'string' && raw.task.length > 0 ? `## Task\n${raw.task}\n\n` : ''

      const fullPrompt = `${taskSection}${body}\n${PROTOCOLS}`

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
        return
      }

      console.log(fullPrompt)
      process.exit(0)
    })
}
