// v3.9.0 P4 — Plugin auto-install dispatcher invoked at end of `harnessed setup`.
// v3.9.1 — Replaced hardcoded `claude plugin install <name>` with structured
// CheckResult.install_commands consumed verbatim (4 install patterns in the
// wild: official marketplace `claude plugin install` / 3rd-party marketplace
// 2-step `marketplace add + plugin install` / `claude mcp add --transport ...`
// per-server transport / `npx skills@latest add owner/repo` skill CLI).
//
// Reverses v3.6.0 Phase 2 SPEC NO-auto-install decision per v3.9.0 ship: instead
// of printing `fix:` hints for user to copy-paste, prompt user with Clack
// confirm() per missing check, then spawn each command in install_commands
// sequentially; abort chain on first non-zero exit.
//
// Default: opt-in (user is prompted unless --non-interactive / --no-auto-install
// / non-TTY).
// Escape hatches:
//   --non-interactive   → skip prompts, restore v3.8.x advisory-only behavior
//   --no-auto-install   → opt out explicitly even in interactive mode
//   non-TTY stdin/out   → auto-detect, fall back to advisory

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

/** Run all doctor checks, prompt user for each installable warn entry, spawn
 *  each command in install_commands sequentially on consent. Returns counts
 *  for setup summary line. */
export async function runAutoInstall(opts: AutoInstallOpts): Promise<AutoInstallResult> {
  const out: AutoInstallResult = { installed: [], skipped: [], failed: [] }

  if (!opts.autoInstall) {
    return out // explicit opt-out — short-circuit
  }

  // Re-run doctor checks (mostly cached I/O — file reads + spawnSync('where')).
  const results: CheckResult[] = await Promise.all(CHECKS.map((c) => c()))

  // Filter: warn-status entries with non-empty install_commands array.
  const installables = results.filter(
    (r): r is CheckResult & { install_commands: readonly string[] } =>
      r.status === 'warn' && Array.isArray(r.install_commands) && r.install_commands.length > 0,
  )

  if (installables.length === 0) {
    return out
  }

  console.log(
    `\n💡 ${installables.length} optional check(s) installable — harnessed can run install commands now:`,
  )

  for (const check of installables) {
    const commands = check.install_commands

    if (opts.nonInteractive) {
      // CI mode — skip prompt, leave advisory hint visible from earlier doctor output.
      out.skipped.push(check.name)
      continue
    }

    // Show the full command list to the user BEFORE the confirm — informed consent.
    const preview = commands.map((c) => `    $ ${c}`).join('\n')
    console.log(`\n  ${check.name}:`)
    console.log(preview)

    const ans = await p.confirm({
      message: `Run ${commands.length} install command(s) for "${check.name}"?`,
      initialValue: true,
    })
    if (p.isCancel(ans) || ans !== true) {
      out.skipped.push(check.name)
      continue
    }

    // Run commands sequentially; abort chain on first non-zero exit.
    let chainOk = true
    for (const cmd of commands) {
      const tokens = cmd.split(/\s+/).filter((t) => t.length > 0)
      const exe = tokens[0]
      const args = tokens.slice(1)
      if (exe === undefined) {
        // Defensive — should never happen given install_commands non-empty entries.
        out.failed.push({ name: check.name, reason: `empty command in install_commands` })
        chainOk = false
        break
      }
      const r = spawnSync(exe, args, {
        encoding: 'utf8',
        stdio: 'inherit',
        // Windows needs shell for `.cmd` / `.bat` exes (npx.cmd / claude.cmd
        // shims); Unix is fine either way. Pass-through to OS shell handles
        // PATH resolution + extension lookup.
        shell: true,
      })
      if (r.status !== 0) {
        const reason =
          r.error !== undefined
            ? `spawn error: ${r.error.message}`
            : `exit code ${r.status ?? '<unknown>'} on \`${cmd}\``
        out.failed.push({ name: check.name, reason })
        console.error(`  ✗ failed ${check.name} — ${reason}`)
        chainOk = false
        break
      }
    }
    if (chainOk) {
      out.installed.push(check.name)
      console.log(`  ✓ installed ${check.name}`)
    }
  }

  // Summary line for setup output.
  console.log(
    `\nAuto-install summary: ${out.installed.length} installed / ${out.skipped.length} skipped / ${out.failed.length} failed`,
  )

  return out
}
