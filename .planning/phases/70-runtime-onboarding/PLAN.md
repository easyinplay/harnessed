# Phase 70: Runtime Efficiency And Website Onboarding

Target release: public npm/GitHub `5.0.0`.
Status: Scope approved by the user; execution started 2026-10-24. Publication remains gated on verification and explicit accounting for unresolved governance limits.
Scope source: [approved brief](../../research/npm-5.0-runtime-onboarding-brief.md).

## Locked Design

- Keep TypeScript as the primary language, pnpm/Vitest as the development toolchain, and the existing methodology/state/security contracts.
- Standalone binary is recommended and bundles its runtime. Bun is an explicitly selected secondary route. npm keeps supported Node.js behavior without external Bun.
- Optimize measured initialization, not the whole workflow architecture. Initial CPU profiles of the unmodified CLI show the Claude SDK loading even for `--version` and inject-state. Defer host spawner imports until that host is actually selected; retain injected dependency behavior and every existing option/error boundary.
- Website work stays in the separate `D:/GitCode/harnessed-site` repository. Follow-up user layout: tabbed install commands return inside Hero, while workflow start and progress/resume form one module immediately after WhyCards. Remove the old 60-second presentation and retain one `#quickstart` recovery/start anchor.
- Installation tabs remain standalone macOS/Linux, standalone Windows, Bun and npm. Binary scripts retain their own setup prompt; Bun/npm show a combined install-and-setup command using default CLI auto-detection. `--platform` remains an optional documented override. Workflow agent selection affects prompt syntax, not an implicitly forced installation target; preserve ten-language support and explicit Bun continuation.
- GitHub stable release metadata is shared by all visible versions/links. Use existing static-site build/browser patterns, bounded fetches, caching and last-known-good fallback; no client token or new backend is required. Old release-specific highlights must not be relabeled by a newer badge.
- No Rust rewrite, schema migration, automatic Bun installation, live upstream repair or security-policy change.

## Ordered Tasks And Ownership

| Task | Owner / Write Scope | Acceptance | Status |
| --- | --- | --- | --- |
| T1 Baseline and channel harness | benchmark worker: new scripts/runtime test files; main executes builds/measurements | Isolated state, bounded subprocesses, reproducible before/after latency and artifact metadata; unsupported RSS explicit | Verified locally and three-platform CI |
| T2 Lazy host imports | runtime worker: spawnDispatch and related tests | RED/GREEN; injected spawners do not load real implementations; host/options/errors unchanged; measured benefit or revert | Local build/bundle tests/measurement complete |
| T3 Optional Bun lifecycle | Bun worker owns runtime/hooks/update/hints | Verified invocation/update/hook route, Node/npm never shells out to Bun; standalone first-party paths need neither external runtime | Local source/packed smoke and registry fix pass; native Codex activation not certified |
| T4 Website onboarding/version | website worker owns site source/tests/docs | No old 60-second section; responsive accessible tabs/copy/host flow; stable release loading/failure/cache tests; English/Chinese docs aligned | Independently authorized and deployed; Cloudflare/live checks pass; see website receipt |
| T5 Integration and review | main plus independent reviewers | Build, schemas, lint, full serialized regression, eval, runtime channel smoke and real desktop/mobile browser evidence | Runtime candidate verified; CI 9/9 |
| T6 Release 5.0.0 | main only after gates | English CHANGELOG/logs, CI on three platforms, preflight, tag once, registry and signed binary assets verified; website deployment checked separately | Awaiting explicit native-gstack substitution decision; not published |

Do not concurrently rebuild dist while the baseline measurement is being captured. Workers must not commit, push or publish; the main session handles atomic commits and immediate pushes under the standing policy. Preserve unrelated untracked files.

## Verification Matrix

- Node/npm with external Bun absent: metadata, orchestration commands and first-party hooks, expected exit/error behavior and unchanged generated host artifacts.
- Compiled product with external Node/Bun absent: same core boundaries, bootstrap versus subsequent invocation, owned hook transport and local update rehearsal. Upstream tool requirements are separate and must remain visible.
- Explicit Bun runtime: the actual installed command resolves under Bun; setup/doctor/updates/hooks do not accidentally inherit a Node-only command. Do not infer installation manager solely from the selected runtime.
- Both hosts: isolated preview/install artifacts and selected state roots; no user credentials/config inspection, no real upstream installation/uninstall or unapproved cleanup.
- Site: English and Chinese plus locale structure checks; desktop/mobile screenshots, keyboard tab navigation, clipboard feedback, exactly one onboarding region; GitHub success/failure/stale/prerelease cases.
- Performance: identical inputs/sample counts before and after; report p50/p95, bootstrap time and sizes. Do not equate CPU samples with wall-clock improvement or claim an unmeasured RSS/token benefit.

## Governance And Tool Limits

The user confirmed the proposed direction and removal of the old 60-second section. Native gstack office-hours startup was attempted in this session; it printed protocol/update information but did not finish and was terminated using its verified owned process tree. It is incomplete, not a passed office-hours/CEO/architecture gate. Do not substitute this plan or static source review as an official successful execution. Track this limitation at release review.

The scope/value review is restricted to the user's existing requirements: reduce local initialization cost and installation friction without changing workflow methodology. The plan deliberately avoids a second runtime/state engine and measures changes before acceptance. A broader startup rewrite, new server infrastructure or permission/ownership redesign must return for clarification.

No native ralph-loop tool is exposed in this session. Bounded worker iteration, explicit acceptance checks and COMPLETE reports are used as execution evidence; they are not labeled a native plugin invocation.
