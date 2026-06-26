// src/cli/run.ts — v3.4.4 Phase 1 α CLI wire
//
// v4.0 STATUS — CI/HEADLESS MODE ONLY. `harnessed run` does an in-process SDK
// spawn of the whole workflow (masters recurse into sub spawns). It blocks the
// caller for the full run, bypasses CC-native Agent Teams, and cannot do
// clarification round-trips (subagents can't ask the user). Therefore the
// `~/.claude/commands/<name>.md` slash commands NO LONGER call `harnessed run` —
// they orchestrate CC-native subagent spawns via `harnessed gates` + `harnessed
// prompt` + `harnessed checkpoint` (see src/cli/lib/generateCommands.ts v4.0).
// `harnessed run` is retained for CI / scripted / headless contexts where there
// is no user to ask and blocking is fine.
//
// Wires src/workflow/run.ts (the 4 master + 24 sub workflow runtime) into a
// real subcommand so CI scripts can invoke it via Bash.
// Replaces the v3.4.3 dual-path body (SlashCommand vapor + Task-spawn fallback
// that bypassed disciplines + judgments + master orchestration).
//
// Phase 1 keeps _dispatchSkillStub.fn from src/workflow/run.ts — actual SDK
// spawn lands in Phase 2 (extract src/routing/lib/sdkSpawn.ts → src/workflow/
// lib/sdkSpawn.ts). `--dry-run` here means "validate the yaml + walk the
// workflow runtime + exit 0 without invoking the stub" so users can verify
// wiring before Phase 2 lands.
//
// Phase v3.4.4 (Phase 5) — real getNextHint implementation: reads
// workflows/auto/workflow.yaml delegates_to[] (lazy module-level cache),
// resolves direct + parent-stage fallback per D-1 Option C, fail-soft per
// ADR 0029 (stderr warn + null on yaml read/parse error).

import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { detectPlatform } from '../installers/lib/platform.js'
import { checkPathSafe } from '../manifest/lib/path-guard.js'
import * as loadPhasesMod from '../workflow/loadPhases.js'
import { runWorkflow } from '../workflow/run.js'
import { extractMatchedTriggers, loadUserOverrides } from './lib/extract-user-overrides.js'
import { buildDefaultGateContext } from './lib/gateContext.js'
import { getPackageRoot } from './lib/packagePath.js'

interface RawOpts {
  task?: string
  taskStdin?: boolean
  maxIterations?: number
  model?: 'haiku' | 'sonnet' | 'opus'
  dryRun?: boolean
  staged?: boolean
  list?: boolean
  // v3.9.26 Option A — comma-separated sub names whose work was already done
  // interactively in the main CC session (e.g. clarify). Master orchestrator
  // skips them without gate eval.
  skipSub?: string
}

const PACKAGE_ROOT = getPackageRoot()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

/** Phase 5 — module-level lazy cache for the 6-stage chain extracted from
 *  workflows/auto/workflow.yaml delegates_to[]. Loaded ONCE per process at
 *  first getNextHint call; `harnessed run` exits after each invocation so
 *  per-process cache lifetime is correct (no invalidation needed). null = not
 *  yet loaded; empty array [] = load attempted but failed (fail-soft —
 *  don't retry). */
let _autoChainCache: string[] | null = null
let _autoChainLoadFailed = false

export function registerRun(program: Command): void {
  program
    .command('run')
    .description(
      'Run a harnessed workflow via in-process SDK spawn (CI/headless mode — blocks, no Agent Teams, no clarification round-trip). Slash commands use CC-native spawn via gates/prompt/checkpoint instead.',
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
    .option(
      '--skip-sub <names>',
      'comma-separated sub names to skip (work already done interactively in main session, e.g. clarify)',
    )
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

      // P0-B — `name` is a user-controlled positional that flows into
      // resolveWorkflowYaml path joins; screen for traversal before any path use.
      try {
        checkPathSafe(name)
      } catch {
        console.error('error: invalid workflow name (path traversal rejected)')
        process.exit(2)
        return
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

      // v3.6.0 Phase 3 Wave 2 — user-override keyword extraction (P0b 上半).
      // Substring match against workflows/judgments/user-overrides.yaml keywords[].
      // Matched trigger gate refs injected into gateContext.user_overrides[]
      // → judgmentResolver bypass (Wave 1 src/workflow/judgmentResolver.ts) →
      // gate fires=true regardless of expr eval. Fail-soft per ADR 0029:
      // loadUserOverrides returns [] on any error; extract returns [] on no
      // matches → no stderr emit, preserves existing behavior.
      const overrides = await loadUserOverrides(PACKAGE_ROOT)
      const matchedTriggers = extractMatchedTriggers(task, overrides)
      if (matchedTriggers.length > 0) {
        console.error(
          `ℹ user-override detected: ${matchedTriggers.length} trigger(s) ` +
            `forced fires=true via keyword match (${matchedTriggers.join(', ')})`,
        )
      }

      // v3.9.22 — full default phase + subtask context. CLI can't infer real
      // context from a free-form task string, so defaults bias toward "treat as
      // important" → safety-net gates (brainstorming / tdd / paranoid) fire by
      // default. Sub-workflow gate expressions (workflows/judgments/*.yaml) all
      // reference phase.* or subtask.* — undefined variable would throw.
      const stage = name.includes('-') ? (name.split('-')[0] ?? '') : name
      // v4.1.2 — shared default gate context (single SoT with src/cli/gates.ts;
      // includes phase.* / subtask.* / user_understanding_unclear + parallelism
      // team-routing facts). Sub-workflow gate exprs reference these — an
      // undefined variable would throw at eval.
      const gateContext: Record<string, unknown> = {
        ...buildDefaultGateContext(task, stage),
        ...(raw.model ? { modelOverride: raw.model } : {}),
        ...(raw.maxIterations ? { maxIterations: raw.maxIterations } : {}),
        ...(raw.staged ? { staged: true } : {}),
        // v3.9.26 Option A — skip subs done interactively in main session.
        ...(typeof raw.skipSub === 'string' && raw.skipSub.length > 0
          ? {
              skip_subs: raw.skipSub
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            }
          : {}),
        ...(matchedTriggers.length > 0 ? { user_overrides: matchedTriggers } : {}),
      }

      if (raw.dryRun) {
        console.log(JSON.stringify({ workflow: name, yamlPath, gateContext }, null, 2))
        process.exit(0)
      }

      // issue #1 — nested-CC guard. `harnessed run` does an in-process SDK spawn
      // (query()) of the whole workflow; invoked from INSIDE a Claude Code session
      // (e.g. via the Bash tool, non-interactive) the nested spawn cannot acquire
      // an execution/auth context and HANGS until timeout, or silently no-ops.
      // The CC-native `/${name}` slash command is the correct path there. Fail-fast
      // with a pointer instead of reproducing the issue's 108s hang. Override with
      // HARNESSED_ALLOW_NESTED=1 (CI / e2e legitimately spawn `harnessed run`).
      if (isNestedHarnessContext()) {
        console.error(
          `error: \`harnessed run\` is the CI/headless path (in-process SDK spawn) and hangs ` +
            `when invoked from inside a Claude Code session. Use the CC-native \`/${name}\` slash ` +
            `command instead — it drives subagent spawns via harnessed gates / prompt / checkpoint ` +
            `(keeps the session responsive, enables Agent Teams, allows clarification round-trips). ` +
            `Set HARNESSED_ALLOW_NESTED=1 to override (CI / testing only).`,
        )
        process.exit(1)
        return
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

/** issue #1 — detect that `harnessed run` is being invoked from inside an AI
 *  harness session subprocess (the footgun: nested in-process SDK spawn hangs).
 *  True ONLY when: no explicit override AND the active platform exposes a session
 *  id env (Phase 35 seam) AND it is set AND stdin is not an interactive TTY (the
 *  Bash-tool / piped case). A human at a real terminal (TTY) or CI (no session
 *  env) is left alone. */
function isNestedHarnessContext(): boolean {
  if (process.env.HARNESSED_ALLOW_NESTED === '1') return false
  const sessEnv = detectPlatform().sessionIdEnv
  if (!sessEnv) return false
  const sid = process.env[sessEnv]?.trim()
  if (!sid) return false
  return !process.stdin.isTTY
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

/** Phase 5 — load workflows/auto/workflow.yaml delegates_to[] sorted by
 *  `order`, return the 6-stage chain as a string[]. Lazy cached at module
 *  level. Fail-soft per ADR 0029: read/parse error → set
 *  _autoChainLoadFailed + emit 1-line stderr warn + return []. */
function loadAutoChain(): string[] {
  if (_autoChainCache !== null) return _autoChainCache
  if (_autoChainLoadFailed) return []
  try {
    const yamlPath = join(WORKFLOWS_DIR, 'auto', 'workflow.yaml')
    const parsed = loadPhasesMod.loadPhases(yamlPath)
    const delegates =
      'delegates_to' in parsed && Array.isArray(parsed.delegates_to) ? parsed.delegates_to : []
    const sorted = [...delegates].sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
      const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
      return ao - bo
    })
    _autoChainCache = sorted.map((d) => d.sub).filter((s): s is string => typeof s === 'string')
    return _autoChainCache
  } catch (err) {
    _autoChainLoadFailed = true
    process.stderr.write(`⚠️ getNextHint failed (${(err as Error).message}); skipping hint.\n`)
    return []
  }
}

/** Phase 5 — return the next stage name in the 6-stage auto chain for the
 *  passed workflowName. Resolution chain (D-1 Option C):
 *    1. Direct: `workflowName` ∈ chain → return next-in-order (or null if last).
 *    2. Parent-stage fallback: split on FIRST dash → parent stage (e.g.
 *       'verify-paranoid' → 'verify') → if parent in chain, return
 *       next-after-parent (or null if parent is last).
 *    3. 'auto' super-master OR unresolvable → null (whole chain runs / no hint).
 *
 *  Cache: loadAutoChain() is lazy (1 load per process). Fail-soft per ADR 0029. */
export async function getNextHint(workflowName: string): Promise<string | null> {
  if (workflowName === 'auto') return null
  const chain = loadAutoChain()
  if (chain.length === 0) return null // load failed or empty delegates
  // Direct lookup
  const directIdx = chain.indexOf(workflowName)
  if (directIdx >= 0) {
    return directIdx + 1 < chain.length ? (chain[directIdx + 1] ?? null) : null
  }
  // Parent-stage fallback (D-1 Option C): split on FIRST dash
  const dashIdx = workflowName.indexOf('-')
  if (dashIdx > 0) {
    const parentStage = workflowName.slice(0, dashIdx)
    const parentIdx = chain.indexOf(parentStage)
    if (parentIdx >= 0) {
      return parentIdx + 1 < chain.length ? (chain[parentIdx + 1] ?? null) : null
    }
  }
  return null
}

/** Phase 5 — test hook: reset module cache so unit tests can verify lazy-load
 *  + fail-soft + re-load paths in isolation. NOT for production use. */
export function _resetAutoChainCache(): void {
  _autoChainCache = null
  _autoChainLoadFailed = false
}
