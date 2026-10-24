# Phase 70 Execution Evidence

## 2026-10-24 Start

- User approved starting and explicitly removed the redundant 60-second quickstart from the target site design.
- Original working tree contains unrelated untracked notes/scripts. Website repository was clean at discovery. No destructive cleanup or global installation change is part of this phase.
- Native gstack office-hours preamble reached `SKILL_START_PROTO: 1` and an upgrade notice, then remained unfinished. Verified owned bash process tree was terminated; its exec session ended exit 1. No native governance success is claimed.
- Unmodified source build passed; compiled baseline built with 167 asset files, version 4.49.2, approximately 114 MiB. It is a local test artifact, not a replacement global installation.
- Diagnostic-only isolated Node CPU profiles: --version 371 ms and inject-state 316 ms in this run, both exit 0. SDK and ESM loader frames appear in both. These two instrumented observations are not the final repeated benchmark or a performance acceptance claim.
- Disjoint workers: website repository implementation; runtime benchmark/channel scripts and tests; lazy host-spawner imports and tests. Main owns integration, baselines, planning, browser evidence and release decisions.

## Optional Bun Route Probe

- Installed the currently published 4.49.2 package with Bun 1.4.4 into an owned temporary global/cache/bin/HOME, not the real global prefix. No user configuration or credentials were read.
- With PATH limited to that temporary bin, the Bun executable directory and Windows system directories (no system Node entry), `bun run --bun harnessed --version` returned 4.49.2 and `setup --platform codex --dry-run` exited 0 with 29 workflow previews.
- This proves package discovery and explicit Bun invocation for these two read-only surfaces only. It does not prove real upstream installation, hook activation, doctor readiness or package-manager-aware update.
- Source audit found package hooks hard-code Node and update defaults to npm. A bounded worker now owns explicit Bun hook mode plus explicit update package-manager selection, preserving default Node/npm and compiled command/trust bytes. Package-manager identity must not be inferred solely from runtime choice.

## Repeated Before Baseline

Raw report: [benchmark-before.json](./benchmark-before.json). Local Windows x64; 12 samples per command, one trial, serial channels; entry artifacts were built before production changes. RSS is unsupported, not guessed. First invocation includes a fresh isolated state/HOME but is not an OS-cold filesystem measurement.

| Command | Node/npm p50 / p95 ms | Bun compiled p50 / p95 ms | Explicit Bun p50 / p95 ms |
| --- | --- | --- | --- |
| version | 295.1 / 362.1 | 166.2 / 232.3 | 154.6 / 310.4 |
| gates | 332.4 / 383.6 | 151.0 / 194.3 | 180.6 / 205.7 |
| prompt | 332.2 / 403.5 | 209.9 / 222.6 | 230.8 / 323.2 |
| checkpoint intent | 293.4 / 333.5 | 140.3 / 182.0 | 222.0 / 255.8 |
| status recover | 303.5 / 549.6 | 151.8 / 194.0 | 232.6 / 274.6 |

All selected observations exited 0. Fresh first invocations were 270.9 ms Node, 1224.3 ms compiled and 639.4 ms explicit Bun in this run. These were preliminary diagnostic observations, not the final acceptance baseline. The harness subsequently gained isolated repo/home sentinels and a UTF-8 output-budget repair, so the raw report is recaptured with the frozen harness before building the candidate. Final values and hashes belong in VERIFICATION.md. Background editing/focused tests were possible; treat single-machine/single-trial deltas as local evidence, not universal guarantees.

## Independent Review And Corrections

- A read-only reviewer identified that delaying the local sdkSpawn wrapper alone does not prevent an external SDK static import being hoisted by the current single-file bundle. The corrected patch dynamically imports the SDK at the query call boundary, with an esbuild product-boundary RED/GREEN test and error-identity checks. The worker reports 19 files/210 focused tests and typecheck pass; main integration is still pending.
- The benchmark originally bounded raw buffers but invalid/truncated UTF-8 could expand returned text beyond its budget. The corrected harness bounds decoded text at complete character boundaries and reports both raw and returned bytes. New tests include invalid UTF-8, truncated multibyte text, grandchild cleanup and Windows killTree failure reporting. The worker reports 18/18 tests pass.
- Final benchmark harness SHA-256: `31c3eed9086e89c8eb23013b4871ad5587398da6d833a0f5649e1c101b8f7da8`. No performance candidate was rebuilt until the baseline recapture finished.

## Website Acceptance In Progress

- Website worker reports 37/37 logic tests and a 121-page production build. Scoped checks pass; full formatting/typecheck limitations are recorded in the site verification handoff, not suppressed.
- Initial real Chromium interaction checks covered install tabs, host selection, keyboard navigation, clipboard success/denial feedback and 390px/1440px overflow. No page errors occurred and no old 60-second heading remained.
- The initial requested English route was redirected by the existing browser-language detection, so that run is not English coverage. Final QA will pin locale and assert document language.
- Visual inspection found the new anchor heading could sit under the sticky navigation; a scoped scroll-margin fix is in progress. Dev-toolbar screenshots are not final production evidence.
- The first dev launch guessed an obsolete Astro entry path and failed without serving; the next used package.json.bin, started successfully and was stopped with Astro's managed dev command. Final screenshots use a production preview, not the failed launch.

## Integrated Candidate Checks

- Candidate source build/typecheck and local compiled build passed at version 4.49.2 (a test candidate, not a new release). The real npm bundle now contains a dynamic SDK import at the actual query boundary, not a top-level SDK import.
- The frozen before/after harness completed all selected command samples successfully. Raw files retain both positive and negative p95 changes; summary and evidence hashes will be recorded at final verification.
- Real channel smoke passed all three paths: Node/npm with Bun/Bunx removed from PATH, compiled with external Node/Bun removed, and explicit Bun with Node removed. Each executed seven core/install steps and two owned hooks with behavior assertions. This is controlled-PATH evidence, not an OS sandbox or upstream readiness claim.
- A public-registry `update --check --package-manager bun` probe exited 0 and reported 4.49.2/current without installing. A later independent review found the hard-coded public lookup could disagree with a configured installation registry; the lookup implementation is being corrected and this probe is not final update acceptance.
- The full serialized suite was intentionally cancelled during review-driven source changes; no partial run is counted as a pass. It must be restarted after the final registry patch freezes.
- Documentation contracts passed 19/19. The initial full lint found only new JSON evidence formatting and documentation-test formatting/import order errors; scoped Biome fixes were applied without touching unrelated warnings.
- Production browser report in the site repository now pins English locale and asserts EN/ZH document languages. Four desktop/mobile cases pass; sticky headings clear the 100px navigation. A GitHub 503 case retains four consistent 4.49.2 labels, and Windows OS selection is verified. Mock 5.0.0 values in the success case are test data, not a release claim.

## First Candidate CI

- Candidate `5feac89` was pushed. CI `40010192023` passed the Linux/macOS binary jobs, all three installer jobs and the Linux main test job at first inspection; Windows/macOS main tests were still progressing.
- Windows binary smoke failed before launching any channel: Git Bash `command -v bun` supplied an extensionless path, and Node realpath correctly rejected the nonexistent Windows file. The workflow now asks Bun for its actual `process.execPath` instead of guessing an extension or weakening validation. Product runtime logic is unchanged.
- The corrected workflow invocation was executed through local Git Bash: all three channel/owned-hook results passed. This is local Windows evidence; the follow-up remote run remains required.
- The read-only release preflight passed changelog, version, tracked git cleanliness and tag absence after the candidate commit. It is not publication permission, final CI success or a native governance receipt.

## Runtime Candidate CI Complete

- `40010192023` finished 8/9; all three main platform tests passed. Only the Windows binary path lookup failed.
- Follow-up commit `a7a93d3979b8ac31b4069c56521bc3fb377898c3` passed CI `40011089288`: 9/9 completed successfully, including Windows runtime-channel smoke. The owned `gh run watch` session exited 0.
- The only remaining intentional background service is the website production preview on port 4322. All workers and test/watch exec sessions ended.
- User approval for substituting the incomplete native gstack gate is still awaited. No version tag, npm release, global binary replacement or site deployment was performed.

## Follow-Up Website Layout And Setup Defaults

- User moved tabbed install commands back to the original Hero location and the workflow/progress-resume module after WhyCards. The old lower 60-second block must remain absent.
- User requested combined install/setup for Bun and npm, without appending setup to standalone installer commands. Follow-up clarified that `--platform` must not appear mandatory.
- Source confirmation: setup registers platform as optional and defaults to the existing resolver. The 4-file host/setup suite passed 73 tests; no CLI detection logic was changed for the website revision.
- Built CLI isolation checks also passed without any platform argument or host environment selection: a fresh Claude-only home previewed `.claude/skills`, and a fresh Codex-only home previewed `.agents/skills`; both exited 0. These are setup dry-run checks, not live upstream installation claims.
- A bounded website worker owns the component split, centralized default command changes and regression tests. Host selection in the workflow module must not force platform arguments in the install command.
- The revised site now passes 56 tests and a 121-page build. Eight main-session browser cases (EN/ZH, desktop through 320x640) verify Hero installation, WhyCards then the two-action module, combined package setup without required platform flags, no binary duplicate setup, clipboard/keyboard behavior and explicit Bun continuation. Source/records remain local; no publication gate was changed.

## Website Deployment And README Merge

- User explicitly authorized the separate website deployment and README Bun chain merge. This supersedes the website hold, not the CLI 5.0.0 publication gate.
- Website source `daa0e2bb469a3195e44914dc4fc777ac74c89021` was pushed; Cloudflare build `8918041d-d261-4d77-a3c6-d22505dcbaae` completed successfully. Real public EN/ZH desktop/mobile and installation documentation checks pass with no network mocks; GitHub API200 returns consistent v4.49.2 labels/links.
- Public copy was made compatible with the existing stable CLI before pushing: native Bun updates and the 4.x hook Node prerequisite replace an unconditional unreleased updater flag.
- Fresh site tests81, build121, scoped checks and four production browser cases pass. README merging across 11 files passes30 contracts. Exact source/check IDs, screenshots and remaining limits: `.planning/releases/site-2026-10-24.md`.
- No CLI tag, npm publication, global installation replacement or native security-policy change was performed. Managed deployment monitoring and browser processes ended normally.

## Continuation After Website Closure

- Latest source `338b4be` CI `40060190611` completed success, 9/9. Fresh README contracts30 and whole-repository lint pass; mechanical preflight passes4 checks. Remote v5.0.0 tag remains absent and stable latest remains4.49.2.
- Re-ran the opt-in installed gstack lease test: it confirms the expected real exit3 blocker remains, not readiness. No native policy or shared lock change was attempted.
- Bun-hosted existing isolated-only Codex harness completed16/16 with native registration/trust/removal in temporary HOME; no model turn or real config touched. Inner cleanup warning was followed by successful outer cleanup and an absent-root check. Npm-mode shell timing was not relabeled Bun-mode timing.
- Exact evidence and limitations: RESUME-AUDIT.md. Native governance substitution is still an explicit user decision, not inferred from continuation.

## Authorized Publication

- The user's explicit publication request accepted the documented independent reviews and real verification for this CLI release only. Native gstack remains blocked; no lock bypass or native security-policy change was made.
- Final source `047cdacf925fdff5f848df0a6d04b6fadf5eac2a` passed CI `40087428094`. Fresh isolated preflight passed4/4; remote tag and public npm5.0.0 were absent before mutation.
- Pushed `v5.0.0` once to the verified source. Publish `40100043369` passed4/4, including npm and all three binary jobs. GitHub release is public/stable with nine assets; release notes are English.
- Downloaded binary/package and live website evidence is maintained in `.planning/releases/5.0.0.md`. No duplicate publication or real PATH installation replacement was performed.
