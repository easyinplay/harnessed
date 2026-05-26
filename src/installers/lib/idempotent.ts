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
 *  Returns true when the check exits 0 AND (for non-MCP installers)
 *  `opts.updateInstalled` is not set.
 *
 *  `opts.honorUpdateFlag` (default true): when false, the
 *  `ctx.opts.updateInstalled` bypass is IGNORED — i.e. the probe always
 *  short-circuits if the check passes. MCP installers (mcpStdioAdd /
 *  mcpHttpAdd) call with `honorUpdateFlag: false` per Cat G design — user
 *  config (`~/.claude.json.mcpServers`) is never re-modified by force-update
 *  to avoid overwriting hand-tuned MCP entries (v3.9.6 dogfood concern). */
export async function isAlreadyInstalled(
  ctx: InstallContext,
  opts: { honorUpdateFlag?: boolean } = {},
): Promise<boolean> {
  const honorUpdateFlag = opts.honorUpdateFlag !== false
  if (honorUpdateFlag && ctx.opts.updateInstalled === true) return false

  // v3.9.8 — dry-run bypasses the probe so the install-path preview (diff
  // render + spawn-args contract) is exercisable by tests / users running
  // `--dry-run`. Real install behavior unchanged (probe runs when apply:true).
  if (ctx.opts.dryRun) return false

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
