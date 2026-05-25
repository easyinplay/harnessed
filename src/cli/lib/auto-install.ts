// v3.9.0 P4 — Plugin auto-install dispatcher invoked at end of `harnessed setup`.
//
// Reverses v3.6.0 Phase 2 SPEC NO-auto-install decision: instead of printing
// `fix:` hints for user to copy-paste, prompt user with Clack confirm() for each
// missing plugin, then spawn `claude plugin install <name>` on consent.
//
// Default: opt-in (user is prompted unless --non-interactive or --no-auto-install).
// Escape hatches:
//   --non-interactive   → skip prompts, restore v3.8.x advisory-only behavior
//   --no-auto-install   → opt out explicitly even in interactive mode
//
// Risk mitigations (from v3.7+ BACKLOG P4 risk analysis):
//   - Permissions:    `claude plugin install` is user-scope (~/.claude/plugins/),
//                     no sudo required
//   - Cross-platform: Node spawnSync handles win32/macOS/Linux; rely on
//                     `claude` CLI being on PATH (verified at preflight via
//                     `claude --version` indirectly through doctor exit code)
//   - Trust boundary: explicit Clack confirm prompt per plugin = user consent
//                     gate before spawn

import { spawnSync } from 'node:child_process'
import * as p from '@clack/prompts'
import { CHECKS, type CheckResult } from './doctor-registry.js'

export interface AutoInstallOpts {
  /** Skip all interactive prompts (CI / scripts). When true, falls back to
   *  advisory-only behavior — equivalent to v3.8.x setup output. */
  nonInteractive: boolean
  /** Master opt-out flag — even in interactive mode, skip all install attempts. */
  autoInstall: boolean
}

export interface AutoInstallResult {
  installed: string[]
  skipped: string[]
  failed: { name: string; reason: string }[]
}

/** Extract `<plugin-name>` from a doctor `fix:` string. Matches the literal
 *  `claude plugin install <name>` token (the token can appear mid-sentence or
 *  inside backticks; pattern is permissive). Returns null if no match. */
export function extractPluginName(fix: string): string | null {
  const m = fix.match(/claude\s+plugin\s+install\s+([\w@\-/.]+)/)
  return m?.[1] ?? null
}

/** Run all doctor checks, prompt user for each installable warn entry, spawn
 *  `claude plugin install` on consent. Returns counts for setup summary line. */
export async function runAutoInstall(opts: AutoInstallOpts): Promise<AutoInstallResult> {
  const out: AutoInstallResult = { installed: [], skipped: [], failed: [] }

  if (!opts.autoInstall) {
    return out // explicit opt-out — short-circuit
  }

  // Re-run doctor checks (mostly cached I/O — file reads + spawnSync('where')).
  const results: CheckResult[] = await Promise.all(CHECKS.map((c) => c()))

  // Filter: warn-status entries whose fix string is `claude plugin install <X>`.
  const installables = results
    .filter((r) => r.status === 'warn' && typeof r.fix === 'string')
    .map((r) => ({ check: r, plugin: extractPluginName(r.fix ?? '') }))
    .filter((entry): entry is { check: CheckResult; plugin: string } => entry.plugin !== null)

  if (installables.length === 0) {
    return out
  }

  console.log(
    `\n💡 ${installables.length} optional plugin(s) missing — harnessed can install them now:`,
  )

  for (const { check, plugin } of installables) {
    if (opts.nonInteractive) {
      // CI mode — skip prompt, leave advisory hint visible from earlier doctor output.
      out.skipped.push(plugin)
      continue
    }

    const ans = await p.confirm({
      message: `Install "${plugin}" via \`claude plugin install\`? (${check.name})`,
      initialValue: true,
    })
    if (p.isCancel(ans) || ans !== true) {
      out.skipped.push(plugin)
      continue
    }

    // stdio: 'inherit' so user sees progress bar / verbose log from claude CLI.
    // Failure detected via exit code (status !== 0); stderr already on user's terminal.
    const r = spawnSync('claude', ['plugin', 'install', plugin], {
      encoding: 'utf8',
      stdio: 'inherit',
    })
    if (r.status === 0) {
      out.installed.push(plugin)
      console.log(`  ✓ installed ${plugin}`)
    } else {
      const reason =
        r.error !== undefined
          ? `spawn error: ${r.error.message}`
          : `exit code ${r.status ?? '<unknown>'}`
      out.failed.push({ name: plugin, reason })
      console.error(`  ✗ failed ${plugin} — ${reason}`)
    }
  }

  // Summary line for setup output.
  console.log(
    `\nAuto-install summary: ${out.installed.length} installed / ${out.skipped.length} skipped / ${out.failed.length} failed`,
  )

  return out
}
