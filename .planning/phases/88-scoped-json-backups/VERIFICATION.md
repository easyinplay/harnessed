# Phase 88 — verification evidence

Final pushed source: `0292f3a` (includes `ce2de35` backup fix and the minify
follow-up). CI `42638404206` verified success, all 9 jobs, including Windows
and macOS tests and binary/installer smoke on Windows, Linux, and macOS.
Raw receipt: `evidence/ci-view-42638404206.json`; no tag or release created.

All commands run from repo root, Git Bash. Exit codes captured without pipes.

| Gate | Command | Exit | Evidence |
|---|---|---|---|
| Red (bulk, pre-impl) | `corepack pnpm exec vitest run <3 test files>` | 1 (31 new failures / 24 legacy pass) | `evidence/red.log` |
| Narrow green | same | 0 (70/70) | `evidence/narrow-final.log` |
| Biome | `corepack pnpm exec biome check --write <6 changed TS files>` | 0, clean | `evidence/biome3.log` |
| Typecheck | `corepack pnpm typecheck` | 0 errors | `evidence/typecheck3.log` |
| Build + hooks | `corepack pnpm build` | 0 | `evidence/build.log` |
| bin drift | `git diff --exit-code bin/` | 0 | `evidence/bin-drift.log` |
| Full suite | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 corepack pnpm exec vitest run --no-file-parallelism` | 0 — 452 files passed / 4 skipped, 5697 passed / 43 skipped / 1 todo | `evidence/full-suite.log` |
| Legacy compat | real `harnessed.exe` v5.0.15 rollback on new-format snapshot | exit 1, zero mutations (md5 before==after on all 3 targets) | `evidence/compat-legacy-5.0.15.log`, `compat-before.md5`, `compat-after.md5`, `compat-metadata.json`, `probe-backup.mts` |

Env vars explicitly set: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (known
dev-only dogfood precondition, recorded not persisted), `HARNESSED_ROOT_OVERRIDE`
+ `PROBE_CWD` (compat probe only, temp dirs, removed after run). No user
settings altered, no network, no commits.

Deviations:
- v5.0.15 binary has no `--platform` flag (`error: unknown option`) — the
  compat run dropped it; `HARNESSED_ROOT_OVERRIDE` pinned the state root and
  this machine's default platform is claude. Flag position also tried
  pre-subcommand; same rejection.
- Round-1 tests were written as one bulk red batch (see findings.md honesty
  note), rework defects fixed per-item.

## Script gate battery (post-review, 2026-11-09)

| Gate | Command | Exit | Evidence |
|---|---|---|---|
| Deferred items | `node scripts/check-deferred-items.mjs` | 0 | `evidence/gate-check-deferred-items.log` |
| Host primitives | `node scripts/check-host-primitives.mjs` | 0 | `evidence/gate-check-host-primitives.log` |
| Provenance | `node scripts/check-provenance.mjs` | 0 | `evidence/gate-check-provenance.log` |
| Schema consumers | `node scripts/check-schema-consumers.mjs` | 0 | `evidence/gate-check-schema-consumers.log` |
| Skill i18n parity | `node scripts/check-skill-i18n-parity.mjs` | 0 | `evidence/gate-check-skill-i18n-parity.log` |
| State archive stale | `node scripts/check-state-archive-stale.mjs` | 0 | `evidence/gate-check-state-archive-stale.log` |
| Transparency verdicts | `node scripts/check-transparency-verdicts.mjs` | 0 | `evidence/gate-check-transparency-verdicts.log` |
| Upstream freshness | `node scripts/check-upstream-freshness.mjs` | 0 | `evidence/gate-check-upstream-freshness.log` |
| Workflow schema | `node scripts/check-workflow-schema.mjs` | 0 | `evidence/gate-check-workflow-schema.log` |
| YAML i18n parity | `node scripts/check-yaml-i18n-parity.mjs` | 0 | `evidence/gate-check-yaml-i18n-parity.log` |
| ADR baselines | `node scripts/ci/check-adr-baselines.mjs` | 0 | `evidence/gate-adr-baselines.log` |
| Biome CI gate | `node scripts/ci/check-biome.mjs` | 0 (1 preexisting baseline warning on `src/cli/facts.ts`, warn-only, file untouchable per rule) | `evidence/gate-biome-ci-final.log` |
| Whitespace | `git diff --check` | 0 | `evidence/git-diff-check.log` |

Post-doc fix-ups re-verified: `corepack pnpm exec biome check --write src/installers/lib/backup.ts` exit 0 (`evidence/biome-final.log`); `corepack pnpm typecheck` 0 errors (`evidence/typecheck-final.log`); narrow vitest 70/70 exit 0 (`evidence/narrow-final2.log`). First check-biome run exited 1 on the unformatted evidence file `probe-backup.mts` — formatted, no source change.
