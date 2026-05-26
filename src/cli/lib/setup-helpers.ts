// Phase v2.0-2.6 W0 close cleanup — Karpathy ≤200L split for src/cli/setup.ts (CK deferred).
// Sister Phase 3.4 W1 doctor.ts inline shrink + origin-check.ts sister-share extract pattern.
// Extracts: (1) Agent Teams warn UX, (2) workflow SKILL.md scan, (3) Step B parallel install.
//
// Phase v3.0-3.3 T3.3.W0.12 — nested 2-level scan returning NestedWorkflow[] so
// callers can flatten slash-cmd name + know master vs sub-stage. Scan logic lives
// in ./scan-nested.ts (karpathy ≤200L split).
//
// v3.6.1 — removed renderDeprecationBlock re-export + ScanResult.deprecated field.

import { readFile } from 'node:fs/promises'
import { runInstall } from '../../installers/index.js'
import type { InstallOpts } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'
import { checkAgentTeams } from './checkAgentTeams.js'
import type { ScanResult } from './scan-nested.js'
import { scanWorkflowsNested } from './scan-nested.js'

export type { NestedWorkflow, ScanResult } from './scan-nested.js'

// v3.9.5 — removed stale PHASE_21 deferred-method set. Per src/installers/index.ts
// L1-2 ("All 6 methods are now runtime-ready"), all installer dispatchers
// (ccPluginMarketplace / gitCloneWithSetup / npxSkillInstaller / mcpHttpAdd /
// mcpStdioAdd / npmCli) are fully implemented. The PHASE_21 short-circuit was
// v1.0.2 placeholder code never cleaned up; in v3.9.0 dogfood it caused 12+
// manifests to be reported as "skipped (deferred phase 2.1)" when in fact
// users either already had them installed or could install via the live
// dispatcher. Now manifests run through runInstall verbatim — installer's
// own idempotent_check decides already-installed vs install-now.

/**
 * Phase v2.0-2.3 W1.1: Agent Teams env probe (non-blocking warn).
 * Per Q-AUDIT-5b + R20.11 acceptance e + PLAN-ENG-REVIEW § Section 5 [LOW]:
 * Warn-only if missing — parallelism-gate runtime degrades to subagent fan-out
 * when Agent Teams CC env flag is off (session-scoped tolerance policy).
 */
export async function warnIfAgentTeamsMissing(): Promise<void> {
  const r = await checkAgentTeams()
  if (r.status !== 'missing') return
  console.warn('\n⚠️  Agent Teams 未启用 — parallelism-gate 升级路径不可用')
  console.warn('   修复: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1')
  console.warn(
    '   说明: harnessed v3.0 三层栈方法论 parallelism-gate 升级路径需 CC 2.1.133+ Agent Teams enable',
  )
  console.warn(
    '   不阻塞 setup,后续 parallelism-gate workflow phase 触发时自动降级 subagent fan-out\n',
  )
  // NOT exit — non-blocking per R20.11 acceptance a
}

/** v3.0 nested 2-level scan — returns NestedWorkflow[]. */
export async function scanWorkflowsWithSkill(
  workflowsDir: string,
  entries: string[],
): Promise<ScanResult> {
  return scanWorkflowsNested(workflowsDir, entries)
}

export interface StepBResult {
  installed: string[]
  alreadyInstalled: string[]
  // v3.9.8 — skipped now carries reason (e.g. "level-flag-missing: ctx7 npm-cli L4
  // requires --system flag"). Previously skipped was `string[]` and the print
  // line read "[B] skipped <name>" with no explanation.
  skipped: { name: string; reason: string }[]
  failed: string[]
  elapsedMs: number
}

/** Step B: parallel install-base auto-glob chain via Promise.allSettled (v1.0.3 T1.1).
 *  v3.9.6 — `runOpts.updateInstalled` (optional) forces re-install for plugins
 *  whose idempotent_check would otherwise short-circuit; MCP installers ignore
 *  the flag (sister mcpStdioAdd / mcpHttpAdd — config never overwritten). */
export async function runStepBInstall(
  manifestPaths: string[],
  runOpts: { updateInstalled?: boolean; quiet?: boolean } = {},
): Promise<StepBResult> {
  const opts: InstallOpts = {
    apply: true,
    dryRun: false,
    system: false,
    nonInteractive: true,
    fullDiff: false,
    color: 'auto',
    updateInstalled: runOpts.updateInstalled === true,
    quiet: runOpts.quiet === true,
  }
  const start = Date.now()
  const settled = await Promise.allSettled(
    manifestPaths.map(async (path) => {
      let yamlSrc: string
      try {
        yamlSrc = await readFile(path, 'utf8')
      } catch (e) {
        return { status: 'failed' as const, name: path, reason: `read: ${(e as Error).message}` }
      }
      const v = validateManifestFile(yamlSrc, path)
      if (!v.ok) {
        return {
          status: 'failed' as const,
          name: path,
          reason: `validate: ${v.errors[0]?.message ?? 'unknown'}`,
        }
      }
      const name = v.manifest.metadata.name
      const r = await runInstall(v.manifest, opts)
      if ('aborted' in r) return { status: 'skipped' as const, name, reason: r.reason }
      if (r.ok && 'alreadyInstalled' in r && r.alreadyInstalled)
        return { status: 'already-installed' as const, name }
      if (r.ok) return { status: 'installed' as const, name }
      return { status: 'failed' as const, name, reason: r.error.message }
    }),
  )

  const installed: string[] = []
  const alreadyInstalled: string[] = []
  const skipped: { name: string; reason: string }[] = []
  const failed: string[] = []
  for (const s of settled) {
    const v =
      s.status === 'fulfilled'
        ? s.value
        : {
            status: 'failed' as const,
            name: '?',
            reason: String((s as PromiseRejectedResult).reason),
          }
    if (v.status === 'installed') installed.push(v.name)
    else if (v.status === 'already-installed') alreadyInstalled.push(v.name)
    else if (v.status === 'skipped') {
      const skipReason =
        (v as { status: 'skipped'; name: string; reason?: string }).reason ?? 'unknown'
      skipped.push({ name: v.name, reason: skipReason })
    } else
      failed.push(`${v.name}: ${(v as { status: 'failed'; name: string; reason: string }).reason}`)
  }
  return { installed, alreadyInstalled, skipped, failed, elapsedMs: Date.now() - start }
}
