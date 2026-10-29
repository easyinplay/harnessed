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
import { join } from 'node:path'
import { runInstall } from '../../installers/index.js'
import {
  effectiveInstallMethod,
  installGroupForPlan,
  type ResolvedComponentPlan,
  resolveComponentPlan,
} from '../../installers/lib/componentPlan.js'
import { isAlreadyInstalled, npxActiveTargetNames } from '../../installers/lib/idempotent.js'
import type { InstallContext, InstallOpts, Manifest } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'
import { detectPlatform } from '../../platform/platform.js'
import type { ScanResult } from '../../workflow/scan-nested.js'
import { scanWorkflowsNested } from '../../workflow/scan-nested.js'
import { checkAgentTeams } from './checkAgentTeams.js'

export type { NestedWorkflow, ScanResult } from '../../workflow/scan-nested.js'

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
  // v4.14.0 — Agent Teams is a Claude Code concept (CC 2.1.178+ env flag; 2.1.178 removed the explicit create/delete-team tools; harnessed drives only the implicit teammate-spawn API); on
  // any other harness platform the warning + `claude config set` remediation
  // are meaningless noise → silent no-op.
  if (detectPlatform().id !== 'claude') return
  const r = await checkAgentTeams()
  if (r.status !== 'missing') return
  console.warn('\n⚠️  Agent Teams 未启用 — parallelism-gate 升级路径不可用')
  console.warn('   修复: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1')
  console.warn(
    '   说明: harnessed v3.0 三层栈方法论 parallelism-gate 升级路径需 CC 2.1.178+ Agent Teams enable',
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
  failureKeywords?: Record<string, string>
  elapsedMs: number
  // v3.9.21 — per-manifest display group for grouped output in setup display.
  // Map<name, 'mcp-tool' | 'cli-binary' | 'command'>; missing entries display as 'other'.
  // 4.32.22 — buckets derive from the EFFECTIVE install.method (harness override
  // applied), NOT spec.component_type: the group communicates the install
  // CHANNEL (mcpServers config vs plugin/skill vs global CLI), and force-update
  // exclusion follows the same channel (MCP installers ignore the flag). A
  // cc-plugin-marketplace manifest with component_type=mcp-tool (e.g. the
  // 4.32.21-era chrome-devtools form) belongs under "Commands & Skills",
  // where force-update DOES apply.
  componentTypes: Record<string, string>
  // Patch 4.10.1 Fix C — force-update refresh failures whose component is still
  // present on disk (prior version retained). Rendered as a WARN bucket, not an
  // error: "kept existing — refresh failed, prior version retained". Only ever
  // populated by the force-update second pass after reclassifyForceUpdateFailures.
  // v4.15.2 T3 — carries the underlying failure reason (pre-4.15.2 the reason was
  // swallowed by reclassification; user dogfood could not diagnose WHY mattpocock
  // refresh failed).
  keptExisting?: { name: string; reason: string }[]
}

/** v4.13.0 — per-manifest completion event for live setup progress output.
 *  `done` is the count of finished manifests (1-based) at emission time. */
export interface StepBProgressEvent {
  done: number
  total: number
  name: string
  status: 'installed' | 'already-installed' | 'skipped' | 'failed'
}

type StepBEntry =
  | { status: 'installed' | 'already-installed'; name: string }
  | { status: 'skipped' | 'failed'; name: string; reason: string }

/** MCP installers spawn `claude mcp add --scope user`, which read-modify-writes
 *  the WHOLE ~/.claude.json. Running them concurrently is a lost-update race:
 *  the last writer wins and clobbers the other servers' entries (v4.13.0 user
 *  dogfood: tavily survived, chrome-devtools-mcp + exa-mcp verify-failed with
 *  "file may have been overwritten"). These methods must be serialized. */
const MCP_METHODS = new Set(['mcp-stdio-add', 'mcp-http-add'])

/** 4.32.22 — display/exclusion bucket by install CHANNEL (effective method):
 *  mcp-stdio-add / mcp-http-add → 'mcp-tool' (mcpServers config; force-update
 *  excluded); cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer /
 *  cc-hook-add → 'command'; npm-cli → 'cli-binary'; anything else → 'other'. */
export function installGroupOf(
  manifest: Manifest,
  context: HostInstallContext = captureHostInstallContext(),
): string {
  return installGroupForPlan(resolveComponentPlan(manifest, context, 'install'))
}

/** Step B: parallel install-base auto-glob chain via Promise.allSettled (v1.0.3 T1.1).
 *  v3.9.6 — `runOpts.updateInstalled` (optional) forces re-install for plugins
 *  whose idempotent_check would otherwise short-circuit; MCP installers ignore
 *  the flag (sister mcpStdioAdd / mcpHttpAdd — config never overwritten).
 *  v4.13.0 — MCP manifests (MCP_METHODS) run SEQUENTIALLY in their own chain
 *  (shared ~/.claude.json writer race); all other manifests keep full
 *  Promise.allSettled parallelism. The two groups run concurrently with each
 *  other. `runOpts.onProgress` fires once per finished manifest. */
export async function runStepBInstall(
  manifestPaths: string[],
  runOpts: {
    hostContext?: HostInstallContext
    updateInstalled?: boolean
    system?: boolean
    quiet?: boolean
    onProgress?: (ev: StepBProgressEvent) => void
  } = {},
): Promise<StepBResult> {
  const hostContext = runOpts.hostContext ?? captureHostInstallContext()
  const opts: InstallOpts = {
    apply: true,
    dryRun: false,
    system: runOpts.system === true,
    nonInteractive: true,
    fullDiff: false,
    color: 'auto',
    updateInstalled: runOpts.updateInstalled === true,
    quiet: runOpts.quiet === true,
  }
  const start = Date.now()
  const componentTypes: Record<string, string> = {}
  const failureKeywords: Record<string, string> = {}
  const total = manifestPaths.length
  let done = 0
  const emit = (entry: StepBEntry): StepBEntry => {
    done += 1
    try {
      runOpts.onProgress?.({ done, total, name: entry.name, status: entry.status })
    } catch {
      /* progress printer must never break the install chain */
    }
    return entry
  }

  // Pre-read + validate ALL manifests first (fast, local I/O) so we can
  // partition by install method before any installer spawns.
  const invalid: StepBEntry[] = []
  const valid: Array<{ manifest: Manifest; plan: ResolvedComponentPlan }> = []
  for (const path of manifestPaths) {
    let yamlSrc: string
    try {
      yamlSrc = await readFile(path, 'utf8')
    } catch (e) {
      invalid.push(emit({ status: 'failed', name: path, reason: `read: ${(e as Error).message}` }))
      continue
    }
    const v = validateManifestFile(yamlSrc, path)
    if (!v.ok) {
      invalid.push(
        emit({
          status: 'failed',
          name: path,
          reason: `validate: ${v.errors[0]?.message ?? 'unknown'}`,
        }),
      )
      continue
    }
    const plan = resolveComponentPlan(v.manifest, hostContext, 'install')
    componentTypes[v.manifest.metadata.name] = installGroupForPlan(plan)
    valid.push({ manifest: v.manifest, plan })
  }

  const runOne = async (manifest: Manifest): Promise<StepBEntry> => {
    const name = manifest.metadata.name
    try {
      const r = await runInstall(manifest, opts, hostContext)
      if ('aborted' in r) {
        // v4.14.0 — bare 'harness-mismatch' tells the user nothing; expand to a
        // self-explanatory skip note (platform id from the active descriptor).
        // v4.16.2 — L4 flag-missing under FORCE-update gets an explanatory
        // display reason: force bypasses the idempotent probe, so an already-
        // installed L4 tool (ctx7) hits the --system gate every force pass and
        // the bare 'level-flag-missing' read as a recurring failure (dogfood
        // v4.16.1). The NORMAL pass keeps the literal string — l4-rescue
        // filters on `reason === 'level-flag-missing'` (first pass only).
        const reason =
          r.reason === 'harness-mismatch'
            ? `harness-mismatch — claude-only install method (no ${hostContext.hostId} equivalent)`
            : r.reason === 'level-flag-missing' && runOpts.updateInstalled === true
              ? `L4 system-scope — excluded from force-update; update manually: \`${manifest.spec.install.cmd}\``
              : r.reason
        return emit({ status: 'skipped', name, reason })
      }
      if (r.ok && 'alreadyInstalled' in r && r.alreadyInstalled)
        return emit({ status: 'already-installed', name })
      if (r.ok) return emit({ status: 'installed', name })
      if (r.error.keyword) failureKeywords[name] = r.error.keyword
      return emit({ status: 'failed', name, reason: r.error.message })
    } catch (e) {
      return emit({ status: 'failed', name, reason: String(e) })
    }
  }

  // 4.32.23 — partition on the EFFECTIVE method (same resolver as installGroupOf
  // above). Reading the raw spec.install.method here let a codex harness-override
  // into an MCP method land in the parallel group while being displayed as an
  // MCP bucket — the v4.13.0 shared-config lost-update race, silently reopened.
  const mcp = valid.filter((v) => MCP_METHODS.has(effectiveInstallMethod(v.plan)))
  const rest = valid.filter((v) => !MCP_METHODS.has(effectiveInstallMethod(v.plan)))
  const runMcpSerial = async (): Promise<StepBEntry[]> => {
    const out: StepBEntry[] = []
    for (const { manifest } of mcp) out.push(await runOne(manifest))
    return out
  }
  const [mcpEntries, restSettled] = await Promise.all([
    runMcpSerial(),
    Promise.allSettled(rest.map(({ manifest }) => runOne(manifest))),
  ])
  const restEntries: StepBEntry[] = restSettled.map((s) =>
    s.status === 'fulfilled'
      ? s.value
      : { status: 'failed', name: '?', reason: String((s as PromiseRejectedResult).reason) },
  )

  const installed: string[] = []
  const alreadyInstalled: string[] = []
  const skipped: { name: string; reason: string }[] = []
  const failed: string[] = []
  for (const v of [...invalid, ...mcpEntries, ...restEntries]) {
    if (v.status === 'installed') installed.push(v.name)
    else if (v.status === 'already-installed') alreadyInstalled.push(v.name)
    else if (v.status === 'skipped') skipped.push({ name: v.name, reason: v.reason })
    else if (v.status === 'failed') failed.push(`${v.name}: ${v.reason}`)
  }
  return {
    installed,
    alreadyInstalled,
    skipped,
    failed,
    failureKeywords,
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
  /** Components whose refresh failed but whose prior install survives.
   *  v4.15.2 — reason preserved for the summary table (was: bare names, which
   *  swallowed the diagnosis; user dogfood could not tell WHY a refresh failed). */
  keptExisting: { name: string; reason: string }[]
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
  const keptExisting: { name: string; reason: string }[] = []
  for (const entry of forcePass.failed) {
    const m = entry.match(/^([^:]+):\s*(.*)$/s)
    const name = (m?.[1] ?? entry).trim()
    if (priorlyInstalled.has(name)) {
      if (forcePass.failureKeywords?.[name] === 'update-unsupported') {
        keptExisting.push({ name, reason: m?.[2]?.trim() ?? '' })
        continue
      }
      let present = false
      try {
        present = await probe(name)
      } catch {
        present = false
      }
      if (present) {
        keptExisting.push({ name, reason: m?.[2]?.trim() ?? '' })
        continue
      }
    }
    failed.push(entry)
  }
  return { failed, keptExisting }
}

/** Read-only retained-version probe for setup's force-update fail-soft.
 *  Resolve the active harness before checking presence AND runtime health.
 *  Unknown, gated, unreadable or unhealthy components stay genuine failures. */
export async function makeIdempotentProbe(
  manifestPaths: string[],
  context: HostInstallContext = captureHostInstallContext(),
): Promise<(name: string) => Promise<boolean>> {
  const byName = new Map<
    string,
    {
      manifest: Manifest
      hostContext: HostInstallContext
    }
  >()
  for (const path of manifestPaths) {
    try {
      const yamlSrc = await readFile(path, 'utf8')
      const v = validateManifestFile(yamlSrc, path)
      if (v.ok) {
        const plan = resolveComponentPlan(v.manifest, context, 'inspect')
        if (plan.status === 'supported') {
          byName.set(plan.componentId, {
            manifest: structuredClone(plan.manifest) as Manifest,
            hostContext: plan.context,
          })
        }
      }
    } catch {
      /* unreadable manifest → name simply absent from map → probe false */
    }
  }
  return async (name: string): Promise<boolean> => {
    const selected = byName.get(name)
    if (!selected) return false
    const { manifest, hostContext } = selected
    if (manifest.spec.install.method === 'npx-skill-installer') {
      const install = manifest.spec.install
      const targets = npxActiveTargetNames(
        install.cmd,
        manifest.metadata.name,
        install.installs_skills,
      )
      const roots =
        hostContext.hostId === 'claude'
          ? [join(hostContext.nativeHome, 'skills')]
          : [hostContext.platform.skillsDir, join(hostContext.nativeHome, 'skills')]
      let activeSkillReadable = false
      for (const root of roots) {
        for (const target of targets) {
          try {
            await readFile(join(root, target, 'SKILL.md'), 'utf8')
            activeSkillReadable = true
            break
          } catch {}
        }
        if (activeSkillReadable) break
      }
      if (!activeSkillReadable) return false
    }
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
    const ctx: InstallContext = { manifest, opts, level: 'L2', cwd: process.cwd(), hostContext }
    try {
      if (!(await isAlreadyInstalled(ctx))) return false
      const { verifyInstalled } = await import('../../installers/lib/verifyInstalled.js')
      return (await verifyInstalled(ctx)) === null
    } catch {
      return false
    }
  }
}
