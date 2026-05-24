// src/cli/run.ts — v3.4.4 Phase 1 α CLI wire
//
// Wires src/workflow/run.ts (the 4 master + 24 sub workflow runtime) into a
// real subcommand so `~/.claude/commands/<name>.md` can invoke it via Bash.
// Replaces the v3.4.3 dual-path body (SlashCommand vapor + Task-spawn fallback
// that bypassed disciplines + judgments + master orchestration).
//
// Phase 1 keeps _dispatchSkillStub.fn from src/workflow/run.ts — actual SDK
// spawn lands in Phase 2 (extract src/routing/lib/sdkSpawn.ts → src/workflow/
// lib/sdkSpawn.ts). `--dry-run` here means "validate the yaml + walk the
// workflow runtime + exit 0 without invoking the stub" so users can verify
// wiring before Phase 2 lands.

import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { runWorkflow } from '../workflow/run.js'
import { getPackageRoot } from './lib/packagePath.js'

interface RawOpts {
  task?: string
  taskStdin?: boolean
  maxIterations?: number
  model?: 'haiku' | 'sonnet' | 'opus'
  dryRun?: boolean
  staged?: boolean
  list?: boolean
}

const PACKAGE_ROOT = getPackageRoot()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

export function registerRun(program: Command): void {
  program
    .command('run')
    .description(
      'Run a harnessed workflow (master orchestrator or sub-workflow). Slash commands invoke via this subcommand.',
    )
    .argument('[name]', 'workflow name (e.g. discuss, verify-paranoid, research, auto)')
    .option('--task <text>', 'task description (passed as workflow gateContext.task)')
    .option('--task-stdin', 'read task description from stdin until EOF (avoids shell-escape)')
    .option(
      '--max-iterations <n>',
      'ralph-loop max iter (default 20; honored Phase 3 onward)',
      (v) => parseInt(v, 10),
    )
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .option(
      '--dry-run',
      'validate yaml load + walk runtime without spawning (Phase 1 default for verification)',
    )
    .option('--staged', '/auto super-master: pause between stages for user review')
    .option('--list', 'print all known workflow names and exit')
    .action(async (name: string | undefined, raw: RawOpts) => {
      if (raw.list) {
        const names = await listWorkflowNames(WORKFLOWS_DIR)
        for (const n of names) console.log(n)
        process.exit(0)
      }
      if (!name) {
        console.error('error: workflow name required (or pass --list to enumerate)')
        process.exit(2)
      }

      // Resolve task input — flag > stdin > empty
      let task = ''
      if (typeof raw.task === 'string') {
        task = raw.task
      } else if (raw.taskStdin) {
        task = await readStdinToEnd()
      }

      // Resolve workflow yaml path — 3-tier lookup matches workflows/ layout
      const yamlPath = await resolveWorkflowYaml(name, WORKFLOWS_DIR)
      if (!yamlPath) {
        console.error(
          `error: workflow '${name}' not found under workflows/. Run \`harnessed run --list\` to enumerate.`,
        )
        process.exit(2)
      }

      const gateContext: Record<string, unknown> = {
        task,
        ...(raw.model ? { modelOverride: raw.model } : {}),
        ...(raw.maxIterations ? { maxIterations: raw.maxIterations } : {}),
        ...(raw.staged ? { staged: true } : {}),
      }

      if (raw.dryRun) {
        console.log(JSON.stringify({ workflow: name, yamlPath, gateContext }, null, 2))
        process.exit(0)
      }

      let result: Awaited<ReturnType<typeof runWorkflow>>
      try {
        result = await runWorkflow(yamlPath, {}, { packageRoot: PACKAGE_ROOT, gateContext })
      } catch (err) {
        console.error(`error: workflow runtime failed — ${(err as Error).message}`)
        process.exit(1)
        return
      }
      // Print stage-complete + Next: hint (Phase 1 stub; Phase 5 real impl).
      // Kept OUTSIDE the try/catch so a test harness that mocks `process.exit`
      // to throw doesn't trip the runtime-failed branch (process.exit normally
      // terminates; only in tests does it surface as a throwable).
      const hint = await getNextHint(name)
      process.stderr.write(`[stage ${name} ${result.status}]\n`)
      if (hint) {
        process.stderr.write(`Next stage: harnessed run ${hint}\n(In Claude Code: /${hint})\n`)
      }
      process.exit(result.status === 'failed' ? 1 : 0)
    })
}

/** 3-tier lookup matches workflows/ layout:
 *    1. workflows/<name>/workflow.yaml             (research, retro, auto top-level)
 *    2. workflows/<name>/auto/workflow.yaml        (4 stage-masters: discuss/plan/task/verify)
 *    3. workflows/<stage>/<sub>/workflow.yaml      (24 subs; <name> = '<stage>-<sub>' OR '<sub>')
 *
 * Sub names by convention flatten to `<stage>-<sub>` (e.g. 'verify-paranoid'
 * → workflows/verify/paranoid/workflow.yaml). Split on the FIRST dash to
 * derive (stage, sub). If `<name>` has no dash, only tiers 1 + 2 apply.
 */
export async function resolveWorkflowYaml(
  name: string,
  workflowsDir: string,
): Promise<string | null> {
  // Tier 1: top-level standalone
  const tier1 = join(workflowsDir, name, 'workflow.yaml')
  if (existsSync(tier1)) return tier1
  // Tier 2: stage-master auto
  const tier2 = join(workflowsDir, name, 'auto', 'workflow.yaml')
  if (existsSync(tier2)) return tier2
  // Tier 3: split on first dash
  const dashIdx = name.indexOf('-')
  if (dashIdx > 0) {
    const stage = name.slice(0, dashIdx)
    const sub = name.slice(dashIdx + 1)
    const tier3 = join(workflowsDir, stage, sub, 'workflow.yaml')
    if (existsSync(tier3)) return tier3
  }
  return null
}

export async function listWorkflowNames(workflowsDir: string): Promise<string[]> {
  const names: string[] = []
  const entries = await readdir(workflowsDir)
  for (const e of entries.sort()) {
    const p = join(workflowsDir, e)
    const s = await stat(p).catch(() => null)
    if (!s?.isDirectory()) continue
    // Tier 1: top-level workflow.yaml
    if (await fileExists(join(p, 'workflow.yaml'))) {
      names.push(e)
      continue
    }
    // Tier 2: stage with auto/workflow.yaml → list `<stage>` + subs
    if (await fileExists(join(p, 'auto', 'workflow.yaml'))) {
      names.push(e)
      const subs = await readdir(p).catch(() => [])
      for (const sub of subs.sort()) {
        if (sub === 'auto') continue
        if (await fileExists(join(p, sub, 'workflow.yaml'))) {
          names.push(`${e}-${sub}`)
        }
      }
    }
  }
  return names
}

async function fileExists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false)
}

async function readStdinToEnd(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}

/** Phase 1 stub — Phase 5 reads workflows/auto/workflow.yaml delegates_to[]
 *  and returns the next sub name in order. Returns null when no `auto`
 *  context applies (e.g. sub invoked directly, not via /auto). */
export async function getNextHint(_workflowName: string): Promise<string | null> {
  return null
}
