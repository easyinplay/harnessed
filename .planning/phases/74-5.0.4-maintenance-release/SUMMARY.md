# Phase 74 Summary

Date: 2026-10-29 (Asia/Shanghai). Status: complete; npm-5.0.4 published and verified.

## Delivered

- Released the explicit force-update repair: structured `update-unsupported` becomes `kept-existing` only after read-only active-host presence and runtime-health probes pass for `--system --non-interactive --update-installed`. Fresh, shared-only, unhealthy and other failures remain fatal.
- Released Claude Code npx shared-only skill materialization into the active native root, including `CLAUDE_CONFIG_DIR` verification. Provenance, dry-run no-write behavior, Codex shared/native roots and multi-pack indicators remain enforced.
- Closed Phase 74 and synchronized the release receipt, plan/progress/findings and global STATE/ROADMAP/REQUIREMENTS to latest shipped 5.0.4. No new runtime mode, host, schema or state format was introduced.

## Verification And Publication

- Carried-forward implementation handoff: focused 161/161; typecheck, focused Biome and diff-check passed; both review rounds reported closed. No new review is claimed by this closeout.
- Candidate acceptance: focused `install-aliases` 3/3; full Vitest 374 files, 4546 passed, 11 skipped, 1 todo; build, typecheck, lint and diff-check passed. Lint retained 16 existing warnings.
- Pre-publication `node dist/cli.mjs release-preflight` passed all four checks: `CHANGELOG has [5.0.4]`, `package version 5.0.4`, `tracked working tree clean` and `v5.0.4 tag absent`; result `release-ready`, as confirmed by the release owner. The tag-absent check describes the state before tagging.
- The first parallel test/build run caused 3 fixture failures when build cleaned `dist/cli.mjs`; serial reruns were green. This was tool concurrency interference, not a product regression.
- Published commit `c9a3dc3aba151901e4854b38b25ea8e3344b0e43`; CI `40810930373` 9/9 success. Annotated `v5.0.4`, tag object `301a0f75e61dce275ec8a834dece89fecab4e654`, peels to that commit. Publish `40811493097` 4/4 success.
- npm version/latest both 5.0.4; a real npm install added 117 packages and CLI printed 5.0.4. Stable GitHub release was published 2026-10-29 with 9 assets; three-platform SHA256 and Ed25519 checks all passed. Exact npm integrity/shasum and binary hashes/sizes are in the release receipt.
- Windows executable printed 5.0.4 and unpacked 167 assets into the retained acceptance root's `state/assets/5.0.4` directory.
- Documentation closeout matched 26 exact receipt evidence markers and resolved all 30 relative Markdown links across the eight authorized files; STATE is 98 lines and all six phase plan tasks are complete.

## Limits

- Acceptance root `C:/Users/easyi/AppData/Local/Temp/harnessed-504-accept-20261029-main` remains retained; cleanup is not claimed.
- Website browser verification was not run and website propagation is not claimed.
- Publication and candidate acceptance facts are supplied verified evidence. Documentation closeout checks local commit/tag identity, retained asset-directory presence and documentation consistency only; it does not recreate the tag, repeat publication or rerun runtime acceptance. Closeout docs will be committed and pushed separately.

Evidence: [release receipt](../../releases/5.0.4.md), [task plan](task_plan.md), [progress](progress.md) and [findings](findings.md).
