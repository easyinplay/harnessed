// Phase v2.0-2.6 W0 close cleanup — Karpathy ≤200L split for src/cli/setup.ts (CK deferred).
// Sister Phase 3.4 W1 doctor.ts inline shrink + origin-check.ts sister-share extract pattern.
// Extracts: (1) Agent Teams warn UX, (2) workflow SKILL.md scan, (3) Step B parallel install.
// No behavior change — pure surgical relocation; existing setup tests must pass unchanged.

import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { runInstall } from '../../installers/index.js'
import type { InstallOpts } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'
import { checkAgentTeams } from './checkAgentTeams.js'

/** Phase 2.1 deferred installer methods — counted as skipped, not failed (D-11). */
const PHASE_21 = new Set([
  'cc-plugin-marketplace',
  'git-clone-with-setup',
  'npx-skill-installer',
  'mcp-http-add',
])

/**
 * Phase v2.0-2.3 W1.1: Agent Teams env probe (non-blocking warn).
 * Per Q-AUDIT-5b + R20.11 acceptance e + PLAN-ENG-REVIEW § Section 5 [LOW]:
 * Warn-only if missing — parallelism-gate runtime degrades to subagent fan-out
 * (sister ~/.claude/rules/agent-teams.md L42 "Session-scoped 容忍策略").
 */
export async function warnIfAgentTeamsMissing(): Promise<void> {
  const r = await checkAgentTeams()
  if (r.status !== 'missing') return
  console.warn('\n⚠️  Agent Teams 未启用 — parallelism-gate 升级路径不可用')
  console.warn('   修复: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1')
  console.warn(
    '   说明: harnessed v2.0 三层栈方法论 parallelism-gate 升级路径需 CC 2.1.133+ Agent Teams enable (sister ~/.claude/rules/agent-teams.md)',
  )
  console.warn(
    '   不阻塞 setup,后续 parallelism-gate workflow phase 触发时自动降级 subagent fan-out\n',
  )
  // NOT exit — non-blocking per R20.11 acceptance a
}

/** Filter workflow entries to those containing SKILL.md (sister Step A scan). */
export async function scanWorkflowsWithSkill(
  workflowsDir: string,
  entries: string[],
): Promise<string[]> {
  const out: string[] = []
  for (const entry of entries.sort()) {
    const src = join(workflowsDir, entry)
    try {
      const s = await stat(src)
      if (!s.isDirectory()) continue
      await stat(join(src, 'SKILL.md')) // throws if missing
      out.push(entry)
    } catch {
      // no SKILL.md — skip
    }
  }
  return out
}

export interface StepBResult {
  installed: string[]
  alreadyInstalled: string[]
  skipped: string[]
  failed: string[]
  elapsedMs: number
}

/** Step B: parallel install-base auto-glob chain via Promise.allSettled (v1.0.3 T1.1). */
export async function runStepBInstall(manifestPaths: string[]): Promise<StepBResult> {
  const opts: InstallOpts = {
    apply: true,
    dryRun: false,
    system: false,
    nonInteractive: true,
    fullDiff: false,
    color: 'auto',
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
      const method = v.manifest.spec.install.method
      if (PHASE_21.has(method)) return { status: 'skipped' as const, name }
      const r = await runInstall(v.manifest, opts)
      if ('aborted' in r) return { status: 'skipped' as const, name }
      if (r.ok && 'alreadyInstalled' in r && r.alreadyInstalled)
        return { status: 'already-installed' as const, name }
      if (r.ok) return { status: 'installed' as const, name }
      return { status: 'failed' as const, name, reason: r.error.message }
    }),
  )

  const installed: string[] = []
  const alreadyInstalled: string[] = []
  const skipped: string[] = []
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
    else if (v.status === 'skipped') skipped.push(v.name)
    else
      failed.push(`${v.name}: ${(v as { status: 'failed'; name: string; reason: string }).reason}`)
  }
  return { installed, alreadyInstalled, skipped, failed, elapsedMs: Date.now() - start }
}
