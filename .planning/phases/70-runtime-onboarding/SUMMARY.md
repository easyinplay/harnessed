# Phase 70 Summary

Date: 2026-10-24. Status: complete and published as public npm/GitHub 5.0.0.

## Delivered

- Kept TypeScript, pnpm/Vitest and existing host/state/security boundaries. Deferred host spawners and the actual external Claude SDK query import rather than rewriting the runtime.
- Recommended runtime-bundled standalone binaries; retained Node/npm compatibility without external Bun, and added explicit optional Bun hook/update behavior without inferring installation manager from runtime.
- Delivered the website's tabbed installation and separate post-WhyCards workflow/progress module, with GitHub stable-version propagation and bounded cache/fallback behavior. All 11 READMEs use combined Bun installation/setup; English remains canonical.
- Corrected independent-review findings in SDK import hoisting, UTF-8 output budgets, selected-manager registry queries and stale poisoned release caches.

## Acceptance And Publication

- Full serialized regression: 4432 passed; eval: 14/14; resumed README contracts: 30/30; full lint passed. Exact release source `047cdacf925fdff5f848df0a6d04b6fadf5eac2a` passed three-platform CI `40087428094`.
- Source-built and actually packed channel probes verified first-party owned hooks on Node without Bun, compiled without external Node/Bun, and explicit Bun without Node. Bun-hosted isolated Codex registration/trust/removal passed 16/16; full Bun-mode live-model activation was not certified.
- Local Windows 12-sample p50 measurements improved roughly 9-13% Node, 8-20% compiled and 22-32% explicit Bun for five short commands; some p95 observations worsened. No universal workflow, token or RSS benefit is claimed.
- User explicitly authorized the documented independent reviews and real verification as this release's governance substitute. Fresh preflight passed 4/4 before the single `v5.0.0` tag push; publish `40100043369` passed 4/4.
- Public npm latest 5.0.0, actual tarball integrity/temporary dependency installation/version, all nine downloaded release assets, three Ed25519 signatures and actual Windows downloaded execution passed. Fresh live EN/ZH desktop/mobile pages dynamically showed 5.0.0 without a version-only redeploy.

## Limits And Follow-Up

- Native gstack Windows lease remains blocked (exit 3); no native governance pass, security-policy change, lock bypass or upstream readiness claim. The per-release approval does not change future workflow defaults.
- No real PATH upgrade, credential inspection or live upstream setup was performed. Linux/macOS downloads were cryptographically verified, not run locally. Verifier/browser setup failures are retained with their corrected successful runs.
- The user's later screenshot refinement to the installation heading, inline recommendation labels and removed Hero CTA/meta is a separate site-only follow-up, not a new CLI version.

Evidence: [verification](VERIFICATION.md), [resume audit](RESUME-AUDIT.md), [release receipt](../../releases/5.0.0.md), and [independent website deployment](../../releases/site-2026-10-24.md).
