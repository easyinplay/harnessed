# Setup Runtime Dependency Audit

Date: 2026-10-23. Continuation of installed Codex acceptance, not a new release.

## Acceptance Contract

An installed skill or registration is not sufficient evidence that its executable capability works. Setup must distinguish skill content, required helper resources, executable runtime, browser launch, and external authentication or approval.

## Confirmed Defects

| Surface | Finding | Regression Target |
| --- | --- | --- |
| Playwright | Base manifest installs only skill content, not CLI or browser | Independent L4 CLI/browser installation and launch verification |
| Existing installations | npm, git, and npx skill installers return before manifest verification | Broken existing payload must not receive an installed receipt |
| gstack Codex | Minimal runtime copy omits node_modules required by browser helper | Verify installed root, not the source checkout; absent-only runtime bridge |
| GSD | Skill indicator alone does not prove workflow, CLI shim, and required role resources | Remove required resources independently and reject incomplete installation |
| planning/UI | Copied skill helper paths and payload resources are not validated | Native helper entrypoints plus executable/data checks |
| ctx7 | A context7 plugin registration can substitute for the CLI PATH check | Plugin-only fixture cannot prove ctx7 CLI readiness |
| L4 rescue | Approved install failures are discarded by setup | Failure retains cause and yields nonzero exit; declined install stays skipped |
| MCP doctor | Registration/key presence is conflated with availability | Disabled and unprobed authentication/approval must not appear available |
| planning doctor | Any version-like cache entry is treated as a usable payload | Empty/non-directory entries cannot pass |
| Python E2E provider | webapp-testing is declared as gstack-bundled, but no such skill/helper is installed | Correct upstream provider and distinguish project-level Python dependencies |

## Machine Evidence Before Fixes

- `Get-Command playwright-cli` returned no executable.
- Source gstack commit: `514fbfdc9799376edfd2536f60659501a48ead64`.
- `bash ./setup --host codex --no-browser` succeeded; 56 Codex skill files readable.
- Installed root had browser executable/helper but lacked root node_modules and package manifest.
- An absent-path-only junction from the installed runtime to source node_modules produced `BROWSER_OK node 151.0.7922.34`. This local repair alone does not fix harnessed setup.
- GSD runtime files and ctx7 CLI currently exist on this machine. Their defects are acceptance gaps, not claims of current local absence.
- Exa 401 and Codex Tavily approval refusal remain separate external blockers. No credentials were read and no policy was changed.
- Baseline `node dist/cli.mjs doctor --host codex --json` exited 0 with warnings. Its gstack content check passed using `~/.claude/skills/gstack`, demonstrating a further cross-host evidence mismatch; a Codex verdict must not borrow the Claude installation.

## Verification

- L4 worker regression: 171 tests passed across 15 files; TypeScript and scoped Biome passed. Main-session verification and independent review pending.
- Main-session source build passed. The real `install playwright-cli --system --non-interactive` returned `already-installed playwright-cli@0.1.22` after the new verifier, without reinstalling.
- Main-session GSD and planning installer probes passed. The initial UI stack probe correctly exposed an empty-result query rather than missing files; the probe query is being corrected before final verification.
- A real gstack review preamble eventually exited 0 but reported no workflow lease. Two independent empty-directory probes reproduced lease exit 3, and the dangling token primitive failed with `No such file or directory`. This is not evidence of a live lock holder.
- Upstream main `4a98e407e60e6581748b3835e387a870cff55265` / `1.91.181.0` retains byte-identical lease/start scripts. A bounded fail-closed readiness gate is being added rather than changing ACL, MSYS or the lease protocol.
- Full serial regression before the final environment-hardening follow-up: 352 files passed, 3906 tests passed, 6 skipped, 1 todo. Production eval passed 14/14; lint exited 0 with the same 17 baseline warnings.
- Real source setup: `node dist/cli.mjs setup --platform codex --system --non-interactive --no-auto-install`; 0 installed / 12 already-installed / 0 skipped / 1 failed in 11.7 seconds, exit 1. The only failed manifest was gstack's lease gate; all 29 workflows, 26 command files and 20 roles were generated. MCP manifest verification is registration evidence, not authenticated-query acceptance.
- The development Windows binary built with 167 bundled assets. An isolated HOME/USERPROFILE/CODEX_HOME outside the repository resolved the new Playwright manifest in preview mode (expected exit 2) and all 29 workflows in setup dry-run (exit 0). The official PATH binary and its asset cache were not replaced.
- Claude golden changes are limited to verify-qa in the two locales, caused by the corrected executable and webapp provider. Codex host-map snapshots add the two native helper-path notes; no unrelated expectations were rewritten.
- Background audit at 09:29-09:34 found no unfinished fullsuite/setup. A separate Claude Code session (PID 22148, started 2026-10-22 21:30 from Warp) was spawning hooks; it was not terminated. Delay was also caused by repeated review rounds and one worker's prolonged preparation, not a one-hour test process.
- Final environment hardening uses a verify-only exact allowlist, rejects provider/auth/npm tokens and startup hooks from both parent and manifest overrides, preserves native shell policy, and deduplicates Windows key casing. Default installation subprocesses are unchanged. Explicit empty CODEX_HOME now matches the upstream default-home behavior.
- Final post-change build passed; full regression: 353 files passed / 3 skipped, 3918 tests passed / 6 skipped / 1 todo. Production eval passed 14/14. Lint exited 0 with the same 17 baseline warnings. Host-primitives, workflow schema, YAML parity and diff checks passed.
- Final post-change real setup again returned 0 installed / 12 already-installed / 0 skipped / 1 failed in 17.5 seconds, exit 1. The sole failure remains the independently reproduced upstream gstack lease primitive. All local test/setup sessions and subagents finished; the separate Claude session and MCP services were left alone.
- Harnessed-side audit and fixes are complete, but complete upstream workflow acceptance remains blocked by gstack and the separately recorded authentication/approval limits. No new tag or package version was published; the official PATH binary remains 4.49.1.
