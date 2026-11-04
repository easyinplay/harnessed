// Issue #35 — after a compiled-binary self-update, the owned state (workflow
// skills, harness-owned hooks, legacy Claude command files) must be re-synced
// from the NEW version's assets.
//
// Root cause: `refreshOwnedUpdate()` already performs all three repairs, but it
// was wired only into the npm channel's `--update-continuation` handover. The
// plain `harnessed update` path for a compiled binary stopped after the binary
// swap and printed "restart so the new version + hooks take effect" — the
// skills on disk stayed at the old version, and the stale v3.4.4-era
// `~/.claude/commands/*.md` files were never removed (that is the duplicate
// `/retro` the user saw: a command file AND a skill with the same name).
//
// The refresh must run in the NEW binary: it owns the NEW assets
// (`<stateRoot>/assets/<newVersion>`), the OLD one owns the OLD assets. So the
// OLD binary hands the work over by spawning the binary that now sits at
// `execPath` with the internal `--internal-owned-refresh` flag.
//
// Fail-soft by contract: the binary swap already succeeded and must not be
// undone by a refresh problem. A failed handover is reported with an explicit
// `harnessed setup` next step instead of a stack trace.

import { spawn } from 'node:child_process'
import pkg from '../../../package.json' with { type: 'json' }
import { killProcessTree } from '../../installers/lib/killTree.js'
import { withHostInstallEnv } from '../../installers/lib/runClaudeArgs.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { AUTO_UPDATE_STATUS_PATH_ENV } from './autoUpdateStatus.js'
import { OWNED_REFRESH_FLAG } from './ownedRefreshFlag.js'

/** How long the handover may take before it is abandoned (fail-soft). */
const OWNED_REFRESH_TIMEOUT_MS = 180_000

export interface OwnedRefreshOutcome {
  ok: boolean
  updated: string[]
  failed: string[]
}

/**
 * Run the owned-state refresh in the CURRENT binary.
 *
 * `getAssetsRoot()` decides which version's assets are refreshed, so this is
 * only correct inside the binary that owns the version you want installed.
 */
export async function refreshOwnedState(context: HostInstallContext): Promise<OwnedRefreshOutcome> {
  const { refreshOwnedUpdate } = await import('./refreshOwnedUpdate.js')
  const components = await refreshOwnedUpdate(context)
  return {
    ok: !components.some((component) => component.status === 'failed'),
    updated: components.filter((component) => component.status === 'updated').map((c) => c.id),
    failed: components.filter((component) => component.status === 'failed').map((c) => c.id),
  }
}

/**
 * The internal entry point the new binary is spawned with.
 *
 * Exit code 0 = every owned component refreshed; 1 = at least one failed (the
 * caller prints the `harnessed setup` remedy).
 */
export async function runOwnedRefreshEntry(): Promise<number> {
  const { captureHostInstallContext } = await import('../../platform/hostInstallContext.js')
  const context = captureHostInstallContext()
  const outcome = await refreshOwnedState(context)
  writeAutoUpdateNoticeForNewBinary(context)
  if (outcome.ok) {
    console.log(
      `[harnessed] owned state refreshed (${outcome.updated.length} component(s): ${outcome.updated.join(', ')})`,
    )
    return 0
  }
  console.warn(
    `[harnessed] owned state refresh incomplete (${outcome.failed.join(', ')}) — run 'harnessed setup' to finish`,
  )
  return 1
}

/**
 * Write the "you were updated" notice — the user-facing half of the automatic
 * update (D11 / R14 / R16).
 *
 * ONLY the new binary can do this: it owns the NEW assets, so it is the only
 * process that can excerpt the CHANGELOG section of the version it just
 * installed. The old binary's assets are the old ones.
 *
 * The status file's path travels in the environment (R17): the new binary must
 * NOT derive it, or the notice lands in another root and silently disappears.
 * Without that env var there is nothing to write into (an ordinary
 * `harnessed update` has no auto-update notice to publish).
 *
 * Fail-soft: the swap already succeeded — a notice problem must never turn a
 * successful update into a failed one.
 */
export async function writeAutoUpdateNoticeForNewBinary(
  context: HostInstallContext,
): Promise<void> {
  const statusPath = process.env[AUTO_UPDATE_STATUS_PATH_ENV]
  if (!statusPath) return
  try {
    const [{ readAutoUpdateNotice, writeAutoUpdateNotice }, { changelogSection }] =
      await Promise.all([import('./autoUpdateNotice.js'), import('./changelogSection.js')])
    const version = pkg.version
    const previous = readAutoUpdateNotice(statusPath)
    writeAutoUpdateNotice(statusPath, {
      // The `from` version was recorded by the OLD binary before the spawn.
      from: previous?.from ?? '',
      to: version,
      changelog: changelogSection(version) ?? '',
      restart: context.hostId === 'codex' ? 'Codex' : 'Claude Code',
      at: Date.now(),
      consumedAt: 0,
    })
  } catch {
    /* fail-soft — see the doc comment */
  }
}

export interface OwnedRefreshSpawnResult {
  ok: boolean
  exitCode: number | null
  error?: string
}

export interface OwnedRefreshSpawnDeps {
  spawn?: typeof spawn
}

/**
 * Hand the owned-state refresh to the binary at `execPath` (the NEW binary
 * after a self-update swap).
 *
 * Never throws: the caller must still be able to report a successful update.
 */
export async function spawnOwnedRefresh(
  execPath: string,
  context: HostInstallContext,
  deps: OwnedRefreshSpawnDeps = {},
  timeoutMs: number = OWNED_REFRESH_TIMEOUT_MS,
): Promise<OwnedRefreshSpawnResult> {
  const spawnImpl = deps.spawn ?? spawn
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>
    try {
      child = spawnImpl(execPath, [OWNED_REFRESH_FLAG], {
        env: withHostInstallEnv(process.env, context),
        // stdout is dropped on purpose: the handover's result is the exit code,
        // and the parent owns the user-facing line. Keeping the child's stdout
        // empty also means an abrupt child exit cannot truncate a half-written
        // summary. stderr stays inherited so a failed refresh explains itself.
        stdio: ['ignore', 'ignore', 'inherit'],
        windowsHide: true,
        shell: false,
      })
    } catch (error) {
      resolve({
        ok: false,
        exitCode: null,
        error: error instanceof Error ? error.message : String(error),
      })
      return
    }
    const timer = setTimeout(() => {
      try {
        killProcessTree(child)
      } catch {
        /* the child is already gone — the timeout verdict stands */
      }
      resolve({ ok: false, exitCode: null, error: `timed out after ${timeoutMs}ms` })
    }, timeoutMs)
    child.on('error', (error: Error) => {
      clearTimeout(timer)
      resolve({ ok: false, exitCode: null, error: error.message })
    })
    child.on('close', (code: number | null) => {
      clearTimeout(timer)
      resolve({ ok: code === 0, exitCode: code })
    })
  })
}
