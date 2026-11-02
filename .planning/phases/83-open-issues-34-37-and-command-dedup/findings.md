# Phase 83 Findings

> Plan: `task_plan.md`. Status: `progress.md`.

## F1 — The duplicate `/retro` is harnessed against itself, not gstack against harnessed

The screenshot shows two `/retro` rows. Row 1 is `~/.claude/skills/retro/SKILL.md` (harnessed
workflow skill, description starts "独立的 post-④Verify 回顾工作流"). Row 2 is tagged `(user)` and
is `~/.claude/commands/retro.md`.

`~/.claude/commands/` contains **26** files, all with `<!-- harnessed-generated:v3.4.4 -->`, and
all 26 names have a matching directory under `~/.claude/skills/`. Claude Code registers both
surfaces as slash commands, so all 26 are duplicates, not just `retro`.

gstack's own `retro` lives in `~/.claude/skills/gstack/retro/` and is not part of this pair.

## F2 — Why the stale files survived: the local binary predates the cleanup

`src/cli/lib/legacyCommandCleanup.ts` (removes harness-owned `commands/*.md`) was added
2026-10-30 in `b1efa54`, which is **after** the local 4.49.2 binary. The local host therefore never
ran a version that could delete them. gstack's `retro` is unrelated.

## F3 — The repair already exists, it is just not wired into the binary channel

`refreshOwnedUpdate()` performs exactly the three repairs needed: refresh workflow skills into
`~/.claude/skills`, re-install the owned hook manifests, and call `removeLegacyClaudeCommands`.
It is called from `updateCoordinator.ts:616`, i.e. only in the **npm** channel continuation. The
compiled path in `src/cli/update.ts` (`runCompiledFlow`, `case 'updated'`) prints "restart so the
new version + hooks take effect" and stops.

So #35 and the local duplicate are one defect, not two: the binary channel never re-runs the
owned refresh.

## F4 — Hook re-registration already migrates stale versioned paths

`hookEntry.ts:100` `versionedAssetsIdentity()` matches `<root>/assets/<ANY version>/bin/harnessed-<id>.mjs`
by prefix + suffix, ignoring the version segment. `entryMatchesRegistration` therefore treats a
stale `assets/4.32.0/bin/harnessed-stop-hook.mjs` entry as "ours", and `ccHookAdd` collapses it
into the current resolved command. No new path-rewriting code is needed for #36 item 1.

The remaining #36 work is that `gc` deletes an `assets/<ver>` directory whose `bin/*.mjs` path is
still referenced by `settings.json`, and that doctor's remediation text points at
`harnessed uninstall`, which removes the feature instead of migrating it.

## F5 — Issue #34's network premise is not reproducible on this host

`curl https://api.github.com` → 200, `https://github.com` → 200, `https://registry.npmjs.org` → 200
(2026-11-01). The reporter's network partition is real for them but not here, so the fix must be
justified by host-independence (metadata and asset on one reachable host), not by a local repro.
The API asset endpoint (`asset.url` + `Accept: application/octet-stream`, 302 →
`release-assets.githubusercontent.com`) is the official way to keep both hops on `api.github.com`.

Note: the `.sha256.sig` file is a **separate release asset**, not a suffix of the `.sha256`
asset's URL. The current code derives it as `${shaUrl}.sig`, which only works for the
`browser_download_url` form. Switching to API asset URLs therefore requires resolving the sig as
its own asset entry.

## F6 — ELOCKED comes from a shared lock across 12 parallel components

`withInstallOwnershipLock` (`installOwnershipLock.ts`) locks `<stateRoot>/.ownership.lock` with
`proper-lockfile`, `retries: { retries: 5, minTimeout: 25, maxTimeout: 250 }` — roughly one second
of total budget. `setup` installs 12 components in parallel and the npm/npx installers all take
that one lock, so a slow component can starve the others past the retry budget. The generic
installer catch-all in `src/installers/index.ts:118` then reports it as
`installer threw unexpectedly (ELOCKED)`, which `setup` counts as a hard failure and exits 1.
