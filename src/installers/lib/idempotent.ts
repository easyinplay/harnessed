// v3.9.6 — Shared idempotent_check helper for non-MCP installers.
//
// Background: each manifest declares `spec.install.idempotent_check` (shell
// command, e.g. `test -d ~/.claude/skills/gsd`). Before v3.9.6 only mcpStdioAdd
// honored idempotency (via stderr "already exists" string match); npmCli /
// npxSkillInstaller / gitCloneWithSetup / ccPluginMarketplace ran their install
// commands unconditionally — so `harnessed setup` reported "installed" every
// time even for already-installed packages (user dogfood: gsd reinstalled
// every run).
//
// This helper runs `idempotent_check` as a pre-install probe; exit 0 → return
// `{ alreadyInstalled: true }`, caller short-circuits with `{ ok: true,
// alreadyInstalled: true }`. Exit non-zero or check missing → return
// `{ alreadyInstalled: false }`, caller proceeds with full install.
//
// `opts.updateInstalled` bypass: when true, skip idempotent probe entirely
// (force re-install). Setup prompts user for this flag before Step B; MCP
// installers (mcpStdioAdd / mcpHttpAdd) do NOT consume this helper — their
// existing stderr "already exists" path respects user MCP config unconditionally.

import { spawnCmd } from './spawn.js'
import type { InstallContext } from './types.js'

const IDEMPOTENT_CHECK_TIMEOUT_MS = 10_000

/** Probe whether the manifest is already installed via `idempotent_check`.
 *  Returns true when the check exits 0 AND `opts.updateInstalled` is not set.
 *  Returns false when: check missing / check non-zero / `updateInstalled=true`
 *  (force re-install). */
export async function isAlreadyInstalled(ctx: InstallContext): Promise<boolean> {
  // Force re-install bypass — user opted into update via setup prompt or
  // `--update-installed` flag. Skip the probe, fall through to real install.
  if (ctx.opts.updateInstalled === true) return false

  const idempotentCmd = ctx.manifest.spec.install.idempotent_check
  if (typeof idempotentCmd !== 'string' || idempotentCmd.length === 0) {
    // Manifest didn't declare an idempotent_check — fall through to install
    // (sister pre-v3.9.6 behavior; only manifests with the field benefit).
    return false
  }

  const r = await spawnCmd(ctx, idempotentCmd, [], IDEMPOTENT_CHECK_TIMEOUT_MS)
  if (!('exitCode' in r)) {
    // spawn error / timeout — treat as not-installed (run install) per ADR 0029
    // fail-soft (install path has its own error handling; probe should not
    // block the install attempt).
    return false
  }
  return r.exitCode === 0
}
