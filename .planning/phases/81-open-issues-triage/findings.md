# Phase 81 Findings

## Live Issue Baseline

On 2026-10-31, `gh issue list --repo easyinplay/harnessed --state open` returned #14-#33 as Open. Phase 81 scopes only the newly reported #28-#33; #14-#27 remain Phase 80 local changes pending commit, push, CI, and remote closure.

## Initial Signals

- #28 reports asymmetric first-party hook identity matching between install and teardown.
- #29 reports cross-host `.platform` pin corruption during explicit `setup --platform`.
- #30 reports install/uninstall asymmetry for global npm components and Playwright Chromium cache.
- #31 reports non-atomic `settings.json` writes.
- #32 reports lost parallel checkpoint completion due to a global lock and short retry policy.
- #33 reports a missing machine-readable failed checkpoint state and incorrect resume success.

## Final Dispositions

- #28 `confirmed-fixed`: unified hook identity trusts only the captured `assetsRoot`, standard compiled transport, and bare-token or trusted-relative forms; third-party exact-basename paths remain untouched. Windows drive and UNC paths case-fold, while POSIX paths require exact case.
- #29 `confirmed-fixed`: explicit platform setup writes only the selected host pin.
- #30 `non-issue`: CodeGraph's upstream uninstall owns its global package; Playwright's browser cache is shared and has no safe component-specific uninstall operation in the pinned CLI.
- #31 `confirmed-fixed`: all three settings mutation paths use atomic temp-file plus rename semantics, and temporary files are cleaned on failure.
- #32 `confirmed-fixed`: the shared-file RMW design requires the shared lock, so bounded retries and a real contention regression test are the correct repair.
- #33 `confirmed-fixed`: checkpoint failure is machine-readable and legacy `FAILED:` envelopes remain compatible.
- #14 `confirmed-fixed`: backups and the state root survive unified uninstall.
- #15 `confirmed-fixed`: captured host context now controls legacy migration, setup, and teardown roots.
- #16 `confirmed-fixed`; its narrower `prepublishOnly` requirement is `non-issue` because `prepack` covers both packing and publishing.

## Final Review Repairs

- Nested replay recomputes `nested_expansion.start` after preceding sibling expansion, so the root ledger and replay remain matched.
- Publish prints the immutable commit SHA after the initial tag checkout, and binary jobs checkout that SHA.
- The exact official GSD Codex uninstall command can dispatch only through the strict identity/upstream/install/uninstall/empty-cleanup allowlist; any override remains fail-closed.
- Final read-only review found and fixed POSIX case-sensitive path comparison: only Windows drive and UNC forms case-fold, while POSIX paths compare exact case. Added POSIX case-variant, Windows drive, and UNC regressions; the focused gate passed 5 files / 85 tests.

No commit, push, CI run, issue closure, tag, or release was performed. GitHub #14-#33 remain Open.

## Phase 82 Decision Note

An attempt was made to use Claude Code to decide whether Phase 82 should remain, but the local custom model route did not respond. Phase 82 remains unchanged and no decision was made.

## Tooling Notes

- GitHub API access is currently working through `gh`; issue bodies are cached under `.tmp/issue-28.json` through `.tmp/issue-33.json` and remain untracked diagnostics.
- The requested `C:/Users/easyi/.codex/rules/web-search.md` file does not exist in this environment, so the failed read will not be retried. The single-URL and `gh` paths are sufficient for this issue triage.
