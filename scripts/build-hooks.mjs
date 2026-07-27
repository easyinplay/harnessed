#!/usr/bin/env node
// architecture review #5 — generate the self-contained Claude Code hook binaries
// from their TypeScript single-source entries. Each bin/*.mjs is a BUILD ARTIFACT
// (committed like schemas/), NOT hand-maintained: the mode-B detector / per-turn
// injection logic lives in src/checkpoint/*.ts and is esbuild-bundled here so the
// runtime .mjs can never silently drift from the TS it mirrors (the old hazard —
// a 443-line hand-written plain-JS copy welded only by a parity test).
//
// Dep-free by construction: the entries import only node: builtins + dep-light
// sibling modules (no typebox / workflowStore), so the bundle pulls nothing heavy
// and the per-prompt hot path stays fast. esbuild output is deterministic for a
// pinned version + input, so `pnpm build:hooks` + `git diff --exit-code bin/` is a
// drift gate (sister to the schemas/ regen gate).

import { chmodSync } from 'node:fs'
import { build } from 'esbuild'

const HOOKS = [{ entry: 'src/checkpoint/stopHookMain.ts', out: 'bin/harnessed-stop-hook.mjs' }]

for (const { entry, out } of HOOKS) {
  await build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    banner: { js: '#!/usr/bin/env node' },
    legalComments: 'none',
  })
  try {
    chmodSync(out, 0o755)
  } catch {
    // chmod is a no-op / may fail on Windows — the shebang + node invocation still work.
  }
  console.log(`[build-hooks] ${entry} -> ${out}`)
}
