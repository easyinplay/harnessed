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
import { isAlreadyInstalled } from '../../installers/lib/idempotent.js'
import type { InstallContext, InstallOpts, Manifest } from '../../installers/lib/types.js'
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
  // v3.9.21 — per-manifest component_type for grouped output in setup display.
  // Map<name, 'mcp-tool' | 'cli-binary' | 'command'>; missing entries display as 'other'.
  componentTypes: Record<string, string>
  // Patch 4.10.1 Fix C — force-update refresh failures whose component is still
  // present on disk (prior version retained). Rendered as a WARN bucket, not an
  // error: "kept existing — refresh failed, prior version retained". Only ever
  // populated by the force-update second pass after reclassifyForceUpdateFailures.
  keptExisting?: string[]
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
  const componentTypes: Record<string, string> = {}
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
      componentTypes[name] = v.manifest.spec.component_type
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
  return {
    installed,
    alreadyInstalled,
    skipped,
    failed,
    elapsedMs: Date.now() - start,
    componentTypes,
  }
}

// ── Patch 4.10.1 Fix C — force-update fail-soft (comet ensureOpenSpecCli) ──────
//
// A force-update second pass re-runs install for already-installed plugins. If a
// refresh fails BUT the component is still present on disk, reporting it as
// `failed` is misleading — the prior working version is retained. comet's
// `ensureOpenSpecCli` principle: an UPGRADE failure is not fatal; fall back to
// the existing install + warn. We reclassify such entries `failed → keptExisting`.
//
// `failed` entries are verbatim `"<name>: <reason>"` strings (runStepBInstall
// format); `alreadyInstalled` entries are bare names from the FIRST pass (the
// set of components that existed before force-update touched them).

export interface ForceUpdateReclassification {
  /** Remaining genuine failures, verbatim `"<name>: <reason>"` form. */
  failed: string[]
  /** Bare component names whose refresh failed but whose prior install survives. */
  keptExisting: string[]
}

/** Pure (probe-injected) reclassification. For each force-pass failure that was
 *  already-installed before the pass, run `probe(name)`: still present → move to
 *  keptExisting; absent (or probe throws) → keep as failed (honest). Failures
 *  for components NOT previously installed (fresh-install failures) are never
 *  probed — they stay failed. */
export async function reclassifyForceUpdateFailures(
  firstPass: StepBResult,
  forcePass: StepBResult,
  probe: (name: string) => Promise<boolean>,
): Promise<ForceUpdateReclassification> {
  const priorlyInstalled = new Set(firstPass.alreadyInstalled)
  const failed: string[] = []
  const keptExisting: string[] = []
  for (const entry of forcePass.failed) {
    const name = (entry.match(/^([^:]+):/)?.[1] ?? entry).trim()
    if (priorlyInstalled.has(name)) {
      let present = false
      try {
        present = await probe(name)
      } catch {
        present = false
      }
      if (present) {
        keptExisting.push(name)
        continue
      }
    }
    failed.push(entry)
  }
  return { failed, keptExisting }
}

/** Build the real idempotent_check probe used by setup's force-update fail-soft.
 *  Pre-validates the manifest set into a name→Manifest map, then returns a probe
 *  that runs the shared `isAlreadyInstalled` detector (native fs / plugin-registry
 *  first, shell idempotent_check fallback). `honorUpdateFlag` is left default —
 *  opts.updateInstalled is false here, so detection runs for real. Unknown names
 *  or read/validate failures resolve to `false` (treated as absent → stays failed). */
export async function makeIdempotentProbe(
  manifestPaths: string[],
): Promise<(name: string) => Promise<boolean>> {
  const byName = new Map<string, Manifest>()
  for (const path of manifestPaths) {
    try {
      const yamlSrc = await readFile(path, 'utf8')
      const v = validateManifestFile(yamlSrc, path)
      if (v.ok) byName.set(v.manifest.metadata.name, v.manifest)
    } catch {
      /* unreadable manifest → name simply absent from map → probe false */
    }
  }
  return async (name: string): Promise<boolean> => {
    const manifest = byName.get(name)
    if (!manifest) return false
    const opts: InstallOpts = {
      apply: false,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: 'auto',
      updateInstalled: false,
      quiet: true,
    }
    const ctx: InstallContext = { manifest, opts, level: 'L2', cwd: process.cwd() }
    try {
      return await isAlreadyInstalled(ctx)
    } catch {
      return false
    }
  }
}
