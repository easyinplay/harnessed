// src/cli/lib/autoUpdateHandover.ts — Phase 84 / T6: the handover to the NEW
// binary.
//
// After the compiled binary swapped itself, the OLD binary owns the OLD
// assets and the NEW binary owns the NEW ones. Only the new binary can
// install the new workflow skills and re-register the owned hooks — so the
// old binary hands that work over by spawning the binary that now sits at the
// exec path with the internal `--internal-owned-refresh` flag.
//
// Two things travel with that spawn:
//
//   1. the ABSOLUTE path of the status file, as an environment variable
//      (R17). The new binary must NOT derive the path itself: the worker's
//      state root and the CLI's state root are only the same when both resolve
//      the canonical root, and a derived path that lands one directory over
//      makes the update notice silently disappear.
//   2. nothing else — the new binary fills in the notice itself.
//
// The module is fail-soft by contract: the swap already succeeded, so a
// handover problem must never undo it. It reports `{ ok: false, error }` and
// the caller records that on top of the successful update.

import type { spawn } from 'node:child_process'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { writeAutoUpdateNotice } from './autoUpdateNotice.js'
import { AUTO_UPDATE_STATUS_PATH_ENV } from './autoUpdateStatus.js'
import { spawnOwnedRefresh } from './ownedRefresh.js'

export { AUTO_UPDATE_STATUS_PATH_ENV }

export interface AutoUpdateHandoverInput {
  /** The version that was replaced. */
  from: string
  /** The version that is now installed. */
  to: string
  /** The ABSOLUTE path of the status file the new binary must write into. */
  statusPath: string
}

export interface AutoUpdateHandoverResult {
  ok: boolean
  error?: string
}

export interface AutoUpdateHandoverDeps {
  context: HostInstallContext
  /** The executable to spawn — the NEW binary at the exec path. */
  execPath: string
  /** Test seam: the child process implementation. */
  spawn?: typeof spawn
  /** Test seam: the handover implementation itself. */
  spawnOwnedRefresh?: typeof spawnOwnedRefresh
}

/**
 * Hand the owned-state refresh to the binary at `execPath`.
 *
 * Never throws: the caller must still be able to report a successful update.
 */
export async function handoverAutoUpdate(
  input: AutoUpdateHandoverInput,
  deps: AutoUpdateHandoverDeps,
): Promise<AutoUpdateHandoverResult> {
  const { from, statusPath } = input
  // Record the `from` version BEFORE the spawn (R17): if the new binary dies
  // before it can write the notice, the status file still shows what was
  // replaced — and a half-written notice stays pending instead of claiming a
  // version change that never happened.
  try {
    const { readAutoUpdateNotice } = await import('./autoUpdateNotice.js')
    const notice = readAutoUpdateNotice(statusPath)
    if (notice) writeAutoUpdateNotice(statusPath, { ...notice, from })
  } catch {
    // A status file we cannot read is not a reason to skip the handover.
  }

  const previous = process.env[AUTO_UPDATE_STATUS_PATH_ENV]
  process.env[AUTO_UPDATE_STATUS_PATH_ENV] = statusPath
  try {
    const execPath = deps.execPath
    const context = deps.context
    const spawnImpl = deps.spawnOwnedRefresh ?? spawnOwnedRefresh
    const refresh = await spawnImpl(execPath, context, { spawn: deps.spawn })
    return refresh.ok ? { ok: true } : { ok: false, error: refresh.error }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  } finally {
    // The env var is a handover detail — it must not leak into the parent
    // process (the worker lives on, and a stale path would point a later
    // spawn at a stale status file).
    if (previous === undefined) delete process.env[AUTO_UPDATE_STATUS_PATH_ENV]
    else process.env[AUTO_UPDATE_STATUS_PATH_ENV] = previous
  }
}
