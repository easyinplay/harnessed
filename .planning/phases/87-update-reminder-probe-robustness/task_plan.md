# Phase 87 — Update Reminder Probe Robustness (GSD parity for the version check)

Status: COMPLETE

## Goal
Make the SessionStart update reminder answer "is there a newer harnessed?" reliably
on every install channel, so a single network hiccup cannot silence it for a day.

## Verified Facts (2026-11-09)
- The reminder's version probe runs in the DETACHED worker only. The foreground
  SessionStart path reads the local cache and never touches the network
  (`src/cli/updateReminderHookMain.ts`). That property must not change.
- The cache is already written atomically (tmp file + rename) and bounded to 16 KB
  (`src/cli/lib/updateReminderCache.ts`). No change needed there.
- The binary channel's probe hits `api.github.com/repos/.../releases/latest` with
  NO timeout of its own, NO proxy dispatch, and NO second source
  (`src/compile/updateReminderEntrypoint.ts`). The repo's own rule for outbound
  GitHub calls is `ensureProxyDispatcher()` first (`src/cli/lib/update-check-cache.ts`).
- MEASURED on the maintainer's box: `api.github.com` 200 in 1.7 s, `registry.npmjs.org`
  200 in 0.79 s, and the local cache was `state:'unknown', latest:null` while npm
  already had 5.0.13 and the installed binary was 5.0.12. One failed fetch therefore
  erased a known "behind" fact and the reminder went silent.
- GitHub's anonymous releases API allows 60 requests/hour per IP, so a shared IP
  can be rate-limited into permanent silence.
- `publish.yml` runs `npm publish` BEFORE `gh release create`, so the npm version
  can lead the GitHub release by 1-3 minutes. GitHub stays primary because the
  GitHub release is the authoritative source for the downloadable binary assets;
  npm is the fallback, and that window is transient, retryable and self-explaining.

## Decisions
- D1 — Version probe for the binary channel: GitHub releases first (with proxy
  dispatch and a short timeout), npm registry HTTP as fallback. No `npm view`
  subprocess: the binary channel must not require npm to be installed.
- D2 — A failed probe must NOT erase a known "behind" fact. The cache keeps the
  last successful observation and marks it `stale`, with a short (1 h) retry
  instead of the 24 h TTL. Only a host that never succeeded writes
  `unknown/latest:null` with the existing 1 h backoff.
- D3 — Probe failures are classified (`github-rate-limited`, `github-timeout`,
  `github-unavailable`, `npm-unavailable`, `invalid-version`) and recorded in the
  cache for diagnosis only. The value set is closed; no free-form strings.
- D4 — The printed reminder keeps its `Harnessed update available: ` prefix and
  stays one line, but a `stale` record says so (last known).

## Rejected
- Absolute path in the codex plugin hook command (Claude Code's first answer).
  MEASURED: no single literal satisfies cmd + pwsh + sh. A quoted first token is
  a pwsh ParserError, an unquoted one breaks on a path with a space, and `&`
  breaks cmd and sh. The repo's three-shell contract test
  (`tests/installers/codexHookShell.contract.test.ts`) exists for exactly this.
  Claude Code withdrew the recommendation after the measurement. The bare PATH
  token stays: the plugin hook was observed firing, and the residual gap is a
  stale inherited PATH in a GUI-launched codex, which is an environment problem,
  not a literal problem.
- Switching to GSD's native `~/.codex/hooks.json` shape. ADR 0041 owns that
  boundary on purpose; harnessed writes only into its own local plugin marketplace.

## Tasks
1. T1 — Version probe module: GitHub-first with proxy dispatch, npm registry
   fallback, per-source timeouts, classified failure reasons.
2. T2 — Cache: `stale` (retained observation) and `lastError` (closed value set)
   fields, with `parseCache` validation and `shouldRefreshReminder` honoring the
   short retry.
3. T3 — Worker: on probe failure keep the last known observation when there is
   one; keep the existing `unknown` + 1 h backoff when there is not.
4. T4 — Hook: print the reminder for a `stale` record, marked as last known.
5. T5 — Tests for every branch, then a clean-worktree build + full test run.