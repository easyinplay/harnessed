# Update Dry-Run Safety Evidence

Date: 2026-10-25. Scope: Phase 71 T3, confirmed 5.x package-update safety fix.

## Root Cause and Contract

The package-update flow already exits before self-installation when behind and
`--dry-run` is set. For current/ahead versions, the common guard was restricted to
`manager === 'bun'`. Default npm and explicit npm could therefore reach
`installBaseProfile({ apply: true, dryRun: false, ... })` with `--dry-run` plus
`--upstreams` or `--all`, under either Node or Bun runtime.

The fix removes only the manager restriction from that common dry-run guard.
Package dry-run must never invoke self-installation or upstream installation.
Default npm selection, explicit manager-specific version queries, normal updates,
and compiled-binary behavior remain unchanged. No updater redesign is included.

## Test Coverage

- Replace the single current-version Bun upstream dry-run test with 24 cases:
  Node/Bun runtime x default npm/explicit npm/explicit Bun x current/ahead x
  `--upstreams`/`--all`.
- Each case asserts successful exit, the selected version query only, no generic
  diagnostic version query, no package self-installation, no binary update or
  rollback, no upstream installer, and the read-only upstream preview.
- Add 12 positive current-version upstream cases across both runtime probes,
  all three manager selections and both flags. Each asserts exactly one upstream
  install with the unchanged real-update options, including `apply: true` and
  `dryRun: false`.
- Expand the existing behind-version normal upstream test to both flags and
  assert both self-installation and upstream installation occur exactly once.
- Preserve the existing behind-version dry-run tests rather than adding a
  redundant matrix; strengthen the npm case with a zero-upstream-install assertion.

## Bounded RED/GREEN Evidence

All commands use already-installed local tooling. No package installation,
registry request or real updater invocation is used for reproduction.

1. RED before editing production source:
   `./node_modules/.bin/vitest.cmd run tests/cli/update.test.ts --reporter=dot`
   exited 1: **16 failed, 53 passed, 69 total**. Every failure was a default or
   explicit npm current/ahead dry-run case whose upstream installer was called
   once with `apply: true` and `dryRun: false`. All explicit Bun cases passed.
2. GREEN after the one-line source fix: the same complete updater-file command
   exited 0: **69 passed**.
3. Related version checks:
   `./node_modules/.bin/vitest.cmd run tests/cli/version-check.test.ts tests/cli/version-check-bun.test.ts --reporter=dot`
   exited 0: **27 passed across 2 files**.
4. Types: `./node_modules/.bin/tsc.cmd --noEmit --incremental false` exited 0.
   Incremental cache output was disabled to avoid writing outside ownership.
5. The first targeted Biome check reported one formatting-only line-wrap issue
   in the new parameterized normal-update test. The layout was corrected without
   changing assertions. The final targeted check and rerun are recorded below.

Final scoped receipt after the formatting correction:

- `./node_modules/.bin/vitest.cmd run tests/cli/update.test.ts tests/cli/version-check.test.ts tests/cli/version-check-bun.test.ts --reporter=dot`:
  exit 0, **96 passed across 3 files** (69 updater, 7 version-check,
  20 version-check-bun).
- `./node_modules/.bin/tsc.cmd --noEmit --incremental false`: exit 0.
- `./node_modules/.bin/biome.cmd check src/cli/update.ts tests/cli/update.test.ts`:
  exit 0, **Checked 2 files**, no fixes applied.
- `git diff --check -- src/cli/update.ts tests/cli/update.test.ts`: exit 0.

The recorded RED ran before any production edit. There was no second RED run,
no source rollback, and no further source change during the formatting correction.
The production diff remains exactly one condition: remove `manager === 'bun' &&`.

## Ownership and Limits

Changed paths are limited to `src/cli/update.ts`, `tests/cli/update.test.ts`, and
this new evidence document. Existing unrelated changes are preserved.

The CLI is real, but process spawning, version-query results, binary updater and
upstream installation are mocked. Node/Bun runtime coverage uses the existing
`process.versions.bun` test seam under the Node-hosted Vitest run; it does not
claim a separate native Bun executable test. The existing compiled-flow tests
remain in the updater file, but compiled behavior was not changed. No new
unknown/unavailable-version matrix is claimed.

No native `ralph-loop` is available. Execution is explicitly bounded to at most
3 correction/verification rounds: round 1 is the production guard fix; round 2
is the formatting-only correction. Completion requires all requested scoped
checks to pass, not merely exhaustion of that bound.

No real installs, network probes, user-config changes, version bumps, tags,
publication, commits, pushes, full-suite runs or builds are performed. Main owns
integration and build verification. No website or other planning files are edited.
