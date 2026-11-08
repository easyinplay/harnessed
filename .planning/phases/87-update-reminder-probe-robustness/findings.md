# Findings

## Why the reminder went silent (the defect this phase fixes)
The cache is the only thing the SessionStart hook reads, and the worker is the
only thing that writes it. Before this phase the worker had exactly two
outcomes: a version, or nothing. A version became `behind` / `current` /
`ahead`; nothing became `unknown` with `latest: null`. `unknown` was a
terminal state for the cache: `shouldRefreshReminder` only re-probed it after
its one hour backoff, and the hook printed nothing for `unknown`. So a single
failed probe deleted a known "there is a newer version" fact and replaced it
with silence.

## The probe was the fragile part
The binary channel asked `api.github.com/repos/easyinplay/harnessed/releases/latest`
and nothing else. Measured on the maintainer's box (2026-11-09): `api.github.com`
answered in 1.7 s, `github.com` itself timed out after 20 s, `registry.npmjs.org`
answered in 0.79 s. The probe also had no timeout of its own (it leaned on the
worker's 8 s race), and unlike every other outbound GitHub call in this repo
(`src/cli/lib/update-check-cache.ts`) it did not call `ensureProxyDispatcher()`
first, so on a proxy-only network it could not go out at all.

The local cache on that machine was `state:'unknown', latest:null` while npm
already had 5.0.13 and the installed binary was 5.0.12. The reminder was
suppressing a true and useful fact.

## Why GitHub stays primary and npm is only the fallback
`publish.yml` runs `npm publish` BEFORE `gh release create`, so for 1-3 minutes
the npm version can lead the GitHub release tag. A fallback hit on such a
version points the reminder at a release whose binary assets do not exist yet.
That window is transient, retryable and self-explaining, and it is strictly
better than knowing nothing. GitHub stays primary because the GitHub release is
the authoritative source for the assets that `harnessed update` downloads.
The fallback is plain HTTP to the npm registry, NOT `npm view`: a binary
channel machine may not have npm installed, and `npm view` would follow npm's
own registry configuration.

## Why the absolute path in the codex hook command was rejected
Claude Code's first answer recommended writing the binary's absolute path into
the codex plugin's hooks.json. MEASURED on this box, no single literal works
across the three shells the repo's contract test exercises (cmd, pwsh, sh):

| form | cmd | pwsh | sh |
| unquoted absolute path, no space | OK | OK | OK |
| unquoted absolute path, with a space | FAIL | FAIL | FAIL |
| quoted absolute path | OK | FAIL (ParserError on a quoted first token) | OK |
| pwsh call operator `& "..."` | FAIL (`&` is a cmd separator) | OK | FAIL (`&` backgrounds) |

ADR 0041 measured that codex runs hook commands through the user's shell, and
`tests/installers/codexHookShell.contract.test.ts` requires the generated
command to work in cmd + pwsh + sh. Claude Code withdrew the recommendation
after the measurement. The bare PATH token stays: the plugin hook was observed
firing on this machine, and the residual gap is a stale inherited PATH in a
GUI-launched codex, which is an environment problem rather than a literal one.

## Cache compatibility
The cache is a local file, not a cross-version protocol, but the parse is strict
(a self-inconsistent record reads as null, so the next run re-probes). Two
fields were added:
- `stale?: true` — the `latest` comes from an EARLIER successful observation.
  Written only when true, never as `false`.
- `lastError?: ReminderProbeFailure` — a CLOSED set of five values
  (`github-rate-limited`, `github-timeout`, `github-unavailable`,
  `npm-unavailable`, `invalid-version`). Closed on purpose: no URL, stack
  trace or proxy credential can reach the cache file.

Old cache files (no `stale`) still parse. A new stale record read by an older
binary is rejected whole (its `retryAfter` is non-zero and its state is not
`unknown`), which is safe: the worst case is one extra probe, never a false
reminder.

## The foreground path stays offline
The SessionStart hook reads the cache and spawns the detached worker; it never
fetches. The probe module is imported dynamically inside the worker's
`observe`, so the foreground bundle does not even contain the probe code
(verified: `registry.npmjs.org` and `x-ratelimit-remaining` are absent from
`bin/harnessed-update-reminder.mjs` and present in the worker bundle).

## A retained observation does not drive the automatic update
A stale version may already be outdated, and the automatic update downloads
from the same source that just failed. The retained version is therefore used
for the reminder text only; replacing the binary still requires a fresh
observation.