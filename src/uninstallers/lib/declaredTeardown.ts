// C1 fix (issue #9) — execute the manifest's DECLARED uninstall contract.
//
// `spec.uninstall` (cmd + cleanup_paths) is schema-REQUIRED
// (src/manifest/schema/spec.ts:205) and security-screened
// (src/manifest/security.ts), yet nothing ever read it: `runUninstall` dispatched
// only to the per-method inverse in src/uninstallers/<method>.ts, which
// reverse-engineered teardown from `spec.install`. For the two most complex
// shipped manifests that produced wrong/no-op removal — `gsd` (npx ephemeral →
// no-op, 71 skill dirs left) and `ui-ux-pro-max` (self-cleaning clone → rm of an
// already-gone cache path, real skill untouched). This module runs the declared
// teardown, which is the canonical path for every validated manifest; the
// per-method inverse is retained only as a defensive fallback for the
// schema-illegal no-declaration case (unvalidated callers).
//
// Security: cleanup_paths are manifest-supplied and about to be `rm`'d, but
// path-guard was never wired to manifest paths (architecture review finding #9).
// Every cleanup_path is canonicalize-then-confined to the $HOME subtree BEFORE
// any side effect — a blocklist alone is insufficient for a delete.

import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, resolve as resolvePath, sep } from 'node:path'
import { DEFAULT_INSTALL_TIMEOUT_MS, spawnCmd } from '../../installers/lib/spawn.js'
import type { InstallContext } from '../../installers/lib/types.js'
import { checkPathSafe } from '../../manifest/lib/path-guard.js'
import { dryRunGate } from './runOrPreview.js'
import type { UninstallContext, UninstallResult } from './types.js'

/** Does the manifest declare a teardown contract? Schema makes this always true
 *  for a validated manifest; guard defensively for unvalidated callers. */
export function hasDeclaredUninstall(ctx: UninstallContext): boolean {
  return ctx.manifest.spec.uninstall != null
}

/** Expand a leading `~` to the OS home dir (POSIX convention; cmd.exe / Node
 *  fs do not expand it). */
function expandTilde(p: string): string {
  if (p === '~') return homedir()
  if (p.startsWith('~/') || p.startsWith('~\\')) return homedir() + p.slice(1)
  return p
}

/**
 * Confine a manifest-supplied cleanup path to the $HOME subtree.
 * Returns the resolved absolute path, or `null` when it resolves to $HOME
 * itself or escapes the $HOME subtree. Throws `PathTraversalError` (via
 * `checkPathSafe`) on the 5 OWASP A1 traversal vectors. Executing `rm` on
 * attacker-influenceable input demands canonicalize-then-confine, not a
 * blocklist alone.
 */
export function confineCleanupPath(raw: string): string | null {
  checkPathSafe(raw) // throws PathTraversalError on ../ , ..\ , NUL, %2e%2e, %252e%252e
  const expanded = expandTilde(raw)
  const abs = isAbsolute(expanded) ? resolvePath(expanded) : resolvePath(homedir(), expanded)
  const home = resolvePath(homedir())
  if (abs === home) return null // never rm $HOME itself
  if (!abs.startsWith(home + sep)) return null // must live under $HOME
  return abs
}

/**
 * Run a manifest's declared uninstall: the declared `cmd` through the shared
 * spawn seam (re-screens shell escapes) followed by $HOME-confined, idempotent
 * removal of `cleanup_paths`.
 *
 * Posture:
 *  - all cleanup_paths are confined BEFORE any side effect — one path escaping
 *    the $HOME subtree hard-fails with zero execution (a broken/hostile manifest
 *    must fail loud, never silently rm outside $HOME);
 *  - the declared cmd is FAIL-SOFT (warn + continue to cleanup_paths) on a
 *    non-zero exit AND on a spawn-seam failure (timeout / missing Git Bash on
 *    Windows / security gate): teardown is best-effort and must be idempotent so
 *    re-uninstall / already-absent targets don't hard-fail (sister to install's
 *    "already exists = success" mirror; fixes the H2 non-idempotent class). For
 *    the real skill-pack manifests the cross-platform `cleanup_paths` fs removal
 *    is the reliable teardown; the `rm -rf …` / `npx --uninstall` cmd is a
 *    best-effort complement that must not sink the whole operation when the host
 *    shell is unavailable.
 */
export async function runDeclaredTeardown(ctx: UninstallContext): Promise<UninstallResult> {
  const u = ctx.manifest.spec.uninstall
  if (!u) return { ok: false, phase: 'preflight', error: 'no declared uninstall contract' }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  // 1. Confine every cleanup_path up front — refuse before any side effect.
  const confined: string[] = []
  for (const raw of u.cleanup_paths ?? []) {
    let abs: string | null
    try {
      abs = confineCleanupPath(raw)
    } catch {
      return {
        ok: false,
        phase: 'preflight',
        error: `refusing to remove cleanup_path (path traversal): ${raw}`,
      }
    }
    if (abs === null) {
      return {
        ok: false,
        phase: 'preflight',
        error: `refusing to remove cleanup_path outside $HOME: ${raw}`,
      }
    }
    confined.push(abs)
  }

  // 2. Run the declared cmd through the shared spawn seam. It only reads
  //    manifest.spec.install (env/cwd), ctx.cwd, and metadata.name — level/opts
  //    are unused, so a synthetic InstallContext is safe here.
  const spawnCtx = {
    manifest: ctx.manifest,
    cwd: ctx.cwd,
    level: 'L1' as const,
    opts: { apply: true, dryRun: false, yes: true },
  } as unknown as InstallContext
  const spawnRes = await spawnCmd(spawnCtx, u.cmd, [], DEFAULT_INSTALL_TIMEOUT_MS, {
    posixShell: true,
  })
  // spawnCmd returns SpawnOk (has `exitCode`) on completion, else an
  // InstallResult failure (security gate / timeout / missing Git Bash).
  // Discriminate on `exitCode`. Either failure mode is best-effort: warn and
  // fall through to the cross-platform cleanup_paths removal.
  const name = ctx.manifest.metadata.name
  if (!('exitCode' in spawnRes)) {
    const msg = 'error' in spawnRes ? spawnRes.error.message : 'unknown spawn failure'
    console.warn(
      `declared uninstall cmd for '${name}' could not run (${msg}); ` +
        'continuing to cleanup_paths (best-effort teardown).',
    )
  } else if (spawnRes.exitCode !== 0) {
    console.warn(
      `declared uninstall cmd for '${name}' exited ${spawnRes.exitCode} ` +
        '(best-effort teardown; continuing to cleanup_paths): ' +
        (spawnRes.stderr || spawnRes.stdout || '(no output)').slice(0, 200),
    )
  }

  // 3. Remove confined paths — force:true makes an already-absent path a no-op
  //    (the ui-ux-pro-max self-cleaning-clone case).
  const removedPaths: string[] = []
  for (const abs of confined) {
    await rm(abs, { recursive: true, force: true, maxRetries: 3 })
    removedPaths.push(abs)
  }

  return { ok: true, removedPaths }
}
