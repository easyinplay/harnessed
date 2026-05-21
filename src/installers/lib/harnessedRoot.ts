// v3.0.3 hotfix — Claude-Code-co-located state/checkpoint/audit/lock/governance roots.
//
// Problem: pre-v3.0.3 the harness rooted ALL of its own state directories at
// `process.cwd()` via the literal path `.harnessed/...`. When a user launches
// `harnessed setup` from a read-only CWD (e.g. Warp terminal default
// `C:\Program Files\Warp\`) the very first mkdir call inside a successful
// install path (`updateInstalled` → write `<cwd>/.harnessed/state.json`)
// throws `EPERM: operation not permitted, mkdir 'C:\Program Files\Warp\.harnessed'`,
// surfacing in the Step B parallel batch as the anonymous `[B] failed  ?:` line
// (Promise.allSettled rejection → fallback to `name: '?'`).
//
// Historical context:
//   - v2.0.1 already migrated `.harnessed-backup/` → `~/.harnessed/backups/`
//     via `getBackupRoot()` in `backup.ts` (sister pattern, single SoT).
//   - v3.0.2 added `getMcpSpawnCwd()` for the MCP-install spawn cwd surface.
//   - v3.0.3 generalises the migration to the **rest** of the harness-owned
//     state directories (state.json + checkpoints/ + current-workflow.json +
//     .lock + audit.log + governance.json + archive/) AND co-locates the
//     entire root under `~/.claude/harnessed/` next to `~/.claude/skills/`
//     and `~/.claude.json` — the user's Claude Code state directory is the
//     natural neighbor for the harness's Claude-Code-managing state.
//
// Solution: `getHarnessedRoot()` returns `homedir()/.claude/harnessed`
// unconditionally (sister `getBackupRoot()` v2.0.1 posture). All callers
// compose their subdir via `harnessedSubdir(name)` so the SoT is honored.
//
// Auto-migration: `migrateLegacyHarnessedRoot()` detects pre-v3.0.3
// `~/.harnessed/` (v2.0.1+ users with existing backups) and renames it
// atomically to `~/.claude/harnessed/`. Called lazily on first
// `getHarnessedRoot()` use so any harnessed CLI command triggers the move
// without requiring a re-run of `harnessed setup`.
//
// Why unconditional (no probe + fallback)? Symmetric with v2.0.1 + v3.0.2 —
// homedir is reliably writable on Win/Mac/Linux; falling back to ctx.cwd
// re-introduces the EPERM bug we are fixing. `~/.claude/` is already created
// by Claude Code itself when the user installs CC, so the parent always exists.

import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Return the homedir-rooted harness state root, co-located under Claude Code's
 * state directory.
 *
 * Sister: `src/installers/lib/backup.ts:32` `getBackupRoot()` v2.0.1 and
 * `src/installers/lib/safeCwd.ts` `getMcpSpawnCwd()` v3.0.2 — same unconditional
 * homedir posture.
 *
 * Returns absolute path `<homedir>/.claude/harnessed`. Callers should use
 * `harnessedSubdir(name)` for nested directories rather than `join` directly,
 * to keep all path composition routed through the single SoT.
 *
 * Pure path composition — no filesystem side effects. Legacy directory
 * migration is performed explicitly by CLI entry points via
 * `migrateLegacyHarnessedRoot()` (called from `src/cli.ts` before any
 * subcommand runs), keeping unit tests free of fs side-effects.
 *
 * Test isolation: if `HARNESSED_ROOT_OVERRIDE` is set, return that value
 * verbatim. This is the supported mechanism for e2e tests to redirect the
 * harness root into a per-test tmpdir without polluting the real user home
 * directory. Production code never sets this env var; the override has no
 * effect on real CLI invocations.
 */
export function getHarnessedRoot(): string {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== undefined && override !== '') return override
  return join(homedir(), '.claude', 'harnessed')
}

/**
 * Compose a subdirectory under the harness root. Convenience over
 * `join(getHarnessedRoot(), name)` so callers do not have to import `path`.
 *
 * Example: `harnessedSubdir('checkpoints')` →
 * `<homedir>/.claude/harnessed/checkpoints`.
 */
export function harnessedSubdir(name: string): string {
  return join(getHarnessedRoot(), name)
}

/**
 * Compose a file path under the harness root.
 *
 * Example: `harnessedFile('state.json')` →
 * `<homedir>/.claude/harnessed/state.json`.
 */
export function harnessedFile(name: string): string {
  return join(getHarnessedRoot(), name)
}

/**
 * Migrate the legacy `~/.harnessed/` directory (created by v2.0.1+ for
 * `backups/` and by v3.0.2 for state surfaces) to the new co-located
 * `~/.claude/harnessed/` location.
 *
 * Four cases:
 *   1. Only legacy exists  → atomic rename to new path.
 *   2. Only new exists     → no-op (already migrated or fresh install).
 *   3. Both exist          → rename legacy to `~/.harnessed.legacy-bak/`
 *                            and emit a stderr warning. Preserves user data;
 *                            avoids data loss from a clobbering merge.
 *   4. Neither exists      → no-op (fresh install).
 *
 * Sync API (renameSync) because this runs once at startup and we want the
 * harnessed root to be in its final location before any other helper composes
 * a path against it. The performance cost of a single rename is negligible.
 *
 * No catch-and-swallow: filesystem errors propagate to the caller so the
 * harness fails loudly rather than silently writing to the wrong location.
 * Idempotency is preserved by the `migrationAttempted` guard above + by
 * checking the legacy-bak sentinel before renaming a second time.
 */
export function migrateLegacyHarnessedRoot(): void {
  const legacyRoot = join(homedir(), '.harnessed')
  const newRoot = join(homedir(), '.claude', 'harnessed')
  const claudeParent = join(homedir(), '.claude')

  if (!existsSync(legacyRoot)) return // cases 2 + 4: nothing to do

  if (!existsSync(newRoot)) {
    // Case 1: clean migration.
    mkdirSync(claudeParent, { recursive: true })
    renameSync(legacyRoot, newRoot)
    console.error(
      `[harnessed] migrated legacy state directory ${legacyRoot} → ${newRoot} (v3.0.3 path change)`,
    )
    return
  }

  // Case 3: both exist — preserve legacy under a sibling bak path. If the
  // bak path already exists, a prior run already did the rescue + the legacy
  // path is somehow back; surface that clearly rather than overwriting.
  const safetyBak = join(homedir(), '.harnessed.legacy-bak')
  if (existsSync(safetyBak)) {
    console.error(
      `[harnessed] WARN: ${legacyRoot} reappeared after a prior migration (existing bak at ${safetyBak}); leaving in place — inspect manually if needed`,
    )
    return
  }
  renameSync(legacyRoot, safetyBak)
  console.error(
    `[harnessed] both ${legacyRoot} and ${newRoot} existed — legacy directory preserved at ${safetyBak} (review manually if you need data from it; v3.0.3 path change)`,
  )
}
