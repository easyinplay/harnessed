// 4.30.0 (issue #6) — `harnessed stop-hook`: the compiled-binary form of the
// mode-B auto-recovery Stop hook. Parity by construction: dynamic-imports the
// SAME bin/harnessed-stop-hook.mjs the npm-mode hook runs with node — package
// root on npm, unpacked assets on compiled (B2 bundles bin/). Binary users' hooks
// call `"<binary>" stop-hook` (hookEntry compiled routing) so the Stop hook needs
// no host node. Fail-soft: a missing/broken script does nothing and exits 0 — a
// Stop hook must never wedge a normal turn end.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Command } from 'commander'
import { getAssetsRoot } from './lib/assetsRoot.js'

export function registerStopHook(program: Command): void {
  program
    .command('stop-hook')
    .description('(internal) Stop hook — auto-recovers mode-B tool-call corruption (issue #6)')
    .action(async () => {
      try {
        const mjs = join(getAssetsRoot(), 'bin', 'harnessed-stop-hook.mjs')
        if (!existsSync(mjs)) return
        await import(pathToFileURL(mjs).href)
      } catch {
        // do nothing — never wedge a turn end
      }
    })
}
