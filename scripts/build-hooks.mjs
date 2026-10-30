#!/usr/bin/env node
// architecture review #5 — generate the self-contained hook binaries
// from their TypeScript single-source entries. Each bin/*.mjs is a BUILD ARTIFACT
// (committed like schemas/), NOT hand-maintained: the mode-B detector / per-turn
// injection logic lives in src/checkpoint/*.ts and is esbuild-bundled here so the
// runtime .mjs can never silently drift from the TS it mirrors (the old hazard —
// a 443-line hand-written plain-JS copy welded only by a parity test).
// The Codex check-docs entry is the same discipline: one shared command body,
// a tiny argv adapter, and no full-CLI import on the PreToolUse hot path.
//
// Dep-free by construction: the entries import only node: builtins + dep-light
// sibling modules (no typebox / workflowStore), so the bundle pulls nothing heavy
// and the per-prompt hot path stays fast. esbuild output is deterministic for a
// pinned version + input, so `pnpm build:hooks` + `git diff --exit-code bin/` is a
// drift gate (sister to the schemas/ regen gate).

import { execFileSync } from 'node:child_process'
import { chmodSync } from 'node:fs'
import { build } from 'esbuild'

const HOOKS = [
  { entry: 'src/checkpoint/stopHookMain.ts', out: 'bin/harnessed-stop-hook.mjs' },
  { entry: 'src/checkpoint/injectStateMain.ts', out: 'bin/harnessed-inject-state.mjs' },
  { entry: 'src/cli/checkDocsHookMain.ts', out: 'bin/harnessed-check-docs.mjs' },
  {
    entry: 'src/compile/updateReminderEntrypoint.ts',
    out: 'bin/harnessed-update-reminder.mjs',
    run: 'runUpdateReminderEntrypoint',
  },
  {
    entry: 'src/compile/updateReminderEntrypoint.ts',
    out: 'bin/harnessed-update-reminder-worker.mjs',
    run: 'runUpdateReminderWorkerEntrypoint',
  },
]

for (const { entry, out, run } of HOOKS) {
  await build({
    ...(run
      ? {
          stdin: {
            contents: `import { ${run} } from './${entry}'; await ${run}();`,
            resolveDir: process.cwd(),
            sourcefile: `${out}.entry.ts`,
            loader: 'ts',
          },
        }
      : { entryPoints: [entry] }),
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    banner: {
      // biome file-level suppressions ride IN the artifact (config-protection
      // forbids weakening biome.json): formatting/linting of bin/*.mjs is owned
      // by esbuild + the CI hook drift gate, not by biome.
      js: [
        '#!/usr/bin/env node',
        '// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)',
        '// biome-ignore-all lint: esbuild-generated',
        '// biome-ignore-all assist/source/organizeImports: esbuild-generated',
        ...(run === 'runUpdateReminderWorkerEntrypoint'
          ? [
              "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
            ]
          : []),
      ].join('\n'),
    },
    legalComments: 'none',
  })
  try {
    chmodSync(out, 0o755)
  } catch {
    // chmod is a no-op / may fail on Windows — the shebang + node invocation still work.
  }
  console.log(`[build-hooks] ${entry} -> ${out}`)
}

// CI lint (`biome check .`) covers bin/*.mjs and config-protection forbids
// excluding them in biome.json — so the pipeline formats its own output.
// biome format is deterministic for a pinned version, so the CI hook drift
// gate (build:hooks + git diff) stays byte-exact.
execFileSync(
  'corepack',
  ['pnpm', 'exec', 'biome', 'format', '--write', ...HOOKS.map((h) => h.out)],
  { stdio: 'inherit', shell: process.platform === 'win32' },
)
