// src/platform/stateRoot.ts — Phase 84 / T10 / R15: the ONE state-root
// derivation.
//
// Before this module there were THREE derivations of "where does harnessed
// keep its state for this host":
//
//   1. the hook/worker entrypoint (`src/compile/updateReminderEntrypoint.ts`)
//      — `HARNESSED_ROOT_OVERRIDE || join(nativeHome, 'harnessed')`
//   2. the CLI platform layer (`src/platform/platform.ts` `detectPlatform()`)
//      — honours `HARNESSED_ROOT_OVERRIDE`
//   3. the codex hook registration (`src/installers/codexHookAdd.ts`)
//      — `context.platform.stateRoot`, which does NOT honour the override
//
// Without an override all three agree. WITH an override the CLI honoured it
// and the codex path did not → the writer wrote root A while the reader read
// root B → "the user turned auto-update on and it never fires", with no
// error anywhere.
//
// One function, five consumers:
//   1. `src/compile/updateReminderEntrypoint.ts` (the hook + the worker)
//   2. `src/installers/codexHookAdd.ts` (the codex hook command literal)
//   3. `src/cli/lib/refreshOwnedUpdate.ts` (the owned-state refresh)
//   4. `src/cli/autoUpdateCmd.ts` (the public `harnessed auto-update` command)
//   5. the background worker, through the entrypoint's runtime
//
// Known divergence that cannot be removed, only exposed: `CLAUDE_CONFIG_DIR`
// / `CODEX_HOME` can differ between the terminal process and the session
// process → the roots differ. The `harnessed auto-update` command prints the
// host and every path it touched, so a mismatch is visible instead of silent.

import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

export type StateRootHostId = 'claude' | 'codex'

/**
 * The canonical state root of one host.
 *
 * `HARNESSED_ROOT_OVERRIDE` wins over everything: it is an explicit
 * instruction, and it must move EVERY consumer together — that is the whole
 * point of this module.
 */
export function canonicalStateRoot(hostId: StateRootHostId): string {
  const override = process.env.HARNESSED_ROOT_OVERRIDE?.trim()
  if (override) return resolve(override)
  const nativeHome =
    hostId === 'codex'
      ? process.env.CODEX_HOME?.trim() || join(homedir(), '.codex')
      : process.env.CLAUDE_CONFIG_DIR?.trim() || join(homedir(), '.claude')
  return resolve(join(nativeHome, 'harnessed'))
}
