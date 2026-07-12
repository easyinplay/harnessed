// 4.27.0 (B3 Slice 1, T1 / D6) — `harnessed inject-state`: the compiled-binary
// form of the perturn UserPromptSubmit hook. Parity by construction: dynamic-
// imports the SAME bin/harnessed-inject-state.mjs the npm-mode hook runs with
// node — package root on npm, unpacked assets on compiled (B2 bundles bin/).
// Binary users' hooks call `"<binary>" inject-state` (hookEntry compiled
// routing) so the hook no longer needs a host node at all.
//
// Hook fail-soft contract: a missing/broken script injects nothing and exits 0
// — a per-turn hook must never break the user's prompt.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Command } from 'commander'
import { getAssetsRoot } from './lib/assetsRoot.js'

export function registerInjectState(program: Command): void {
  program
    .command('inject-state')
    .description('(internal) per-turn <workflow-state> hook output — used by the perturn hook')
    .action(async () => {
      try {
        const mjs = join(getAssetsRoot(), 'bin', 'harnessed-inject-state.mjs')
        if (!existsSync(mjs)) return
        await import(pathToFileURL(mjs).href)
      } catch {
        // inject nothing — never break the prompt
      }
    })
}
