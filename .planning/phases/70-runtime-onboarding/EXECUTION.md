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
