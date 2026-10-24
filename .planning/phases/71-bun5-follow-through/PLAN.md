# Phase 71: Bun 5.x Compatibility Follow-Through

Date: 2026-10-25. Status: local implementation and production website acceptance complete; final source CI remains a separate check. Continuation of the approved TypeScript/Bun compatibility direction, not a new product mode or release authorization.

## Boundaries

- Standalone remains recommended; optional Bun is secondary; Node/npm does not require external Bun.
- Keep Claude Code and Codex as the two active installation hosts. Preserve upstream readiness, authentication, native trust and ownership boundaries.
- Do not infer installation manager from runtime. Current Bun-managed updates explicitly select `--package-manager bun`.
- No model calls, real user config inspection, global upgrade, tag, npm publication or native gstack workaround. The 5.0.0 governance exception does not extend to future releases.

## Ordered Work

| Task | Files / Owner | Acceptance | Status |
| --- | --- | --- | --- |
| T1 Current-version guidance | Site worker: onboarding dictionary/tests and EN/ZH getting-started docs | Ten homepage locales describe current Bun-owned hook behavior, no obsolete 4.x warning; docs distinguish current updater from legacy upgrade fallback; RED/GREEN and site checks pass | Complete:site0ce60ab pushed;101tests/build121/local4/4 and real production4/4 pass |
| T2 Compatibility audit | Read-only worker: existing runtime/setup/doctor/update paths | Return at most one evidence-backed defect and minimal reproducer; distinguish real backlog from shipped features | Complete: npm-default dry-run can install upstreams when current/ahead; adopt/proxy TODOs are stale |
| T3 Correctness hardening | Worker: src/cli/update.ts and tests/cli/update.test.ts | Manager-neutral dry-run guard; Node/Bun runtime, default/explicit npm and explicit Bun, current/ahead, upstreams/all zero-install assertions; normal updates retained | Verified: RED16 failures; GREEN updater69; main focused156/build pass; no real update invoked |
| T4 Integration and evidence | Main: phase records, source review and bounded actual browser/runtime verification | Fresh tests, build and honest limits; explicit artifact/host evidence, no substituted native-gate claims | Complete locally:4468fullsuite, docs30, focused156, build/lint pass; site production4/4; remote source CI checked after push |
| T5 README simplification | Documentation worker: all11 READMEs, INSTALL-WITH-AI.md and installation contracts | Remove marked advanced maintenance/override clutter and AI guide/promo, keep one runner caveat and essential runtime/install boundaries, verify links and localized parity | Verified: RED13 failures; GREEN30; main docs30 and lint pass |
| T6 Local agent configuration hygiene | Main: Git index, .gitignore and live maintainer link | Remove project .claude/ and root CLAUDE.md from tracking without deleting local copies; no active dangling link | Complete and pushed as dd42ef3 |

The main session owns integration and immediate commit/push under the standing policy. Website production checks are separate from Cloudflare check status. Existing unrelated untracked files and historic evidence are preserved.

## Current Evidence

- Released 5.0.0 already includes explicit Bun first-party hook transport and package-manager selection. Production source: `src/installers/lib/hookEntry.ts`, `src/cli/update.ts`, `src/cli/lib/version-check.ts`.
- The website still requires a 4.x Node hook warning in its tests, so both the visible copy and the obsolete contract must change together.
- The prior site check120899997782 remains in progress at the beginning of this continuation, despite earlier real production acceptance. Its cause is not established; do not label it successful or repeatedly trigger deployments to hide the status.
- Session catchup surfaced an older Claude 4.49.0 publication transcript. Current tracked state and actual 5.0.0 receipts take precedence; that historical transcript does not reopen old work.
- Source control-flow audit found the current/ahead dry-run guard was conditional on Bun manager. Default/explicit npm could call the real base-profile installer despite `--dry-run --upstreams` or `--all`. Reproduction must remain mocked/isolated, not a real global update.
- The user additionally requested deleting the long README Bun maintenance/override section and separate AI installer guide. Keep the combined install/setup commands and one short explicit Bun-runner caveat; README is the single installation entry for people and AI. Preserve historical release/research records rather than rewriting old guide references in their history.
- Further explicit requests removed the project-local agent override and root CLAUDE.md from GitHub's current branch, not history. Both existing local files were retained; root ignore rules match them. The sole live maintainer link was redirected to bundled disciplines. User-level runtime paths remain unchanged.
- Independent static review found no high-confidence regression or newly broken active reference. Adding a full behind-version matrix is a non-blocking suggestion; existing behind npm/Bun dry-run tests remain. This review is not an official native gstack/code-review plugin invocation.
- Main serialized regression finished exit0:373files passed,3skipped;4468tests passed,11skipped,1todo;729.75seconds. Expected fixture stderr included not-a-repository and Windows HOME ownership diagnostics; no safe.directory override or test weakening was applied. Fresh build, docs30, related156 and lint passed;16existing lint warnings remain.
- Real production EN/ZH desktop/mobile acceptance passed4/4, plus two installation pages; exact current copy, owned-hook/upstream boundary and explicit Bun updater were observed. Site check120924433994 still reports in_progress without a completion timestamp; do not label the remote check successful. Separate repository receipts: .planning/npm-onboarding/bun5-production.{md,json}.
