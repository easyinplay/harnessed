# Phase 83 Task Plan: Open Issues #34-#37 + Local Duplicate Slash Command

Date: 2026-11-01. Status: in progress.

## Goal

Fix the four newly filed binary-channel defects (#34 download host, #35 stale workflow skills
after self-update, #36 hook path not rewritten after assets gc, #37 ELOCKED aborts setup) and
remove the local duplicate `/retro` slash command, whose second entry is a stale
`~/.claude/commands/retro.md` left behind by the v3.4.4 command-file era.

## Verified facts (measured before planning)

- Local install is the **compiled binary channel** (`AppData/Local/harnessed/bin/harnessed.exe`).
  Version re-measured on 2026-11-02: **5.0.7** (an earlier note in this file said 4.49.2 — that was
  stale; the binary was updated to 5.0.7 on 2026-11-01 23:10, next to a `harnessed.exe.bak-4.43.0`).
  npm latest is also 5.0.7.
- `~/.claude/commands/` held **26** files, every one carrying `<!-- harnessed-generated:v3.4.4 -->`.
  All 26 names also exist as harnessed workflow skills under `~/.claude/skills/<name>/`.
  Claude Code registers both surfaces, so every one of them is a duplicate slash command.
  `/retro` in the screenshot is exactly this pair: `skills/retro/SKILL.md` (row 1) and
  `commands/retro.md` (row 2, tagged `(user)`).
- The cleanup that removes those files (`src/cli/lib/legacyCommandCleanup.ts`, added 2026-10-30 in
  `b1efa54`) only runs from `harnessed setup` / the update refresh — and the compiled binary's
  self-update never triggered it (that is issue #35), which is why the stale files survived every
  upgrade.
- `refreshOwnedUpdate()` (`src/cli/lib/refreshOwnedUpdate.ts`) already does all three repairs the
  duplicate needs: refresh workflow skills, re-register owned hooks, and delete legacy Claude
  command files. It is wired only into the **npm** channel continuation
  (`updateCoordinator.ts:616`), never into the compiled binary path.
- `entryMatchesRegistration` matches a hook path by `assets/` prefix + `bin/harnessed-<id>.mjs`
  suffix, ignoring the version segment (`hookEntry.ts:100`), so re-registering an owned hook
  already rewrites a stale `assets/<old>/bin/...` entry into the current form.
- Issue #34 network claim is host-dependent: `api.github.com`, `github.com` and the npm registry
  all answered 200 from this host at 2026-11-01. The fix is still right (metadata and asset should
  share one reachable host), but the "necessarily fails" wording is not reproducible here.

## Workstreams (disjoint file ownership)

| W | Issue | Owns | Acceptance |
| --- | --- | --- | --- |
| W1 | #34 | `src/cli/lib/selfUpdateBinary.ts`, `tests/cli/lib/selfUpdateBinary.test.ts` | Asset download uses the `api.github.com` asset endpoint (`Accept: application/octet-stream`, follows the 302 to `release-assets.githubusercontent.com`); sha256 and `.sig` resolve as their own assets; download retries with backoff; failure message names the resolved version, the attempted URLs, and both exits (`npm i -g harnessed@latest`, `HARNESSED_UPDATE_SOURCE_DIR=<dir>`) |
| W2 | #35 | `src/cli/update.ts`, `src/cli.ts`, new `src/cli/lib/ownedRefresh.ts`, owned tests | After a successful compiled self-update, the **new** binary refreshes workflow skills, re-registers owned hooks, and deletes stale legacy command files; failure is fail-soft with an explicit `harnessed setup` next step |
| W3 | #36 | `src/cli/gc.ts`, `src/cli/lib/check-stale-hooks.ts`, `src/installers/lib/harnessedHookTeardown.ts`, `src/installers/ccHookAdd.ts`, `src/cli/lib/refreshOwnedUpdate.ts`, owned tests | `gc` keeps an `assets/<ver>` directory that `settings.json` still references; a stale first-party hook registration is migrated (collapsed into the single current entry) instead of duplicated; doctor suggests re-registering the hook instead of uninstalling harnessed |
| W4 | #37 | `src/installers/lib/installOwnershipLock.ts`, `src/installers/index.ts`, `src/cli/setup.ts`, owned tests | Lock contention retries with backoff; a component that only lost the lock race is reported as a retryable warning and does not make `setup` exit 1 |

## Execution order

1. W1 and W4 are independent of each other and of W2/W3.
2. W2 depends on nothing in W1/W3/W4 but must not edit `src/cli/gc.ts` or `check-stale-hooks.ts`.
3. Integration verification runs in the main session: typecheck, Biome, focused vitest, then the
   full suite, then the ten `scripts/check-*.mjs` gates.
4. Commit, push, CI conclusion, and issue closure are separate steps that need explicit user
   confirmation for the release/tag.

## Non-goals

- No new CLI surface beyond the hidden internal refresh command W2 needs.
- No change to the npm channel's refresh wiring (it already works).
- No hand-editing of the user's `~/.claude` files. The local cleanup was done with the repo's OWN
  ownership rule (`shouldOverwriteFile` + `removeLegacyClaudeCommands`), not by hand, and every
  removed file was copied to `~/.claude/harnessed/backups/legacy-commands-20261102/` first.

## Acceptance criteria

1. Focused regression tests exist for each of the four defects and fail before the fix.
2. `corepack pnpm exec tsc --noEmit` exits 0, `biome check` exits 0 on changed files.
3. Full `vitest run` is green against the 5,273-test baseline.
4. All ten `scripts/check-*.mjs` gates exit 0.
5. 3-OS CI `conclusion=success` on the pushed commit (checked by `headSha`).
