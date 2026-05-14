# Phase 1.5 — Deferred Items (out-of-scope discoveries)

> Logged by gsd-executor during batch 2 (Wave 2+3). These are NOT fixed in this
> batch — they are pre-existing or unrelated to the current task scope.

## D-OOS-1 — `.omc/` runtime state files fail `biome check .`

- **Found during:** batch 2 Wave 3 acceptance gate (`pnpm lint` / `biome check .`).
- **Issue:** `npx biome check .` reports formatter errors in `.omc/**/*.json`
  (OMC orchestration tooling runtime state — `project-memory.json`,
  `sessions/*.json`, `state/**/*.json`, etc.). These files are untracked
  (`git status` shows `?? .omc/`) and are not produced by the harnessed codebase.
- **Why out of scope:** not touched by batch 2; not part of `src/` or `scripts/`;
  pre-existing tooling artifact. All 7 batch-2 files
  (`src/routing/dag.ts`, `semanticRouter.ts`, `lib/embedding.ts`, `engine.ts`,
  `decisionRules.ts`, `index.ts`, `scripts/migrate-decision-rules-v1-to-v2.mjs`)
  pass `biome check` cleanly.
- **Suggested fix (future):** add `.omc/` to `.gitignore` and/or a biome
  `files.ignore` entry so `pnpm lint` is not polluted by tooling state. Defer to
  a maintenance pass or a sister patch — not a routing-layer concern.
