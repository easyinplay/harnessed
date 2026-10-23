# Phase 70 Verification

Date: 2026-10-24. Candidate package version: 5.0.0. Not yet published.

## Local Gates

| Check | Evidence | Result |
| --- | --- | --- |
| Build / TypeScript | `corepack pnpm build`, final 5.0.0 source | Pass |
| Full serialized Vitest | 373 files passed, 3 skipped; 4432 tests passed, 11 skipped, 1 todo; 304.47 seconds | Pass before the final test-fixture-only npm config separation |
| Post-fixture focused regression | runtime harness, product SDK boundary and dispatch imports: 3 files / 32 tests | Pass |
| Documentation contracts | `corepack pnpm test:docs`: 19/19 | Pass |
| Production eval | built CLI, 14 pass / 0 fail / 0 error / no updated goldens | Pass |
| Manifest schema | Ajv strict validation | Pass |
| Schema consumers | 204 declared fields; no unevaluated field; existing shape-only/exempt declarations explicit | Pass |
| Workflow / host / locale contracts | workflow schema, host primitives, SKILL and YAML parity scripts | Pass |
| Lint | full Biome, exit 0; 16 warnings retained, no suppression/config relaxation | Pass before the final fixture/evidence formatting; final precommit check required |
| Windows binary | Bun compile, 167 bundled assets, 5.0.0 | Pass |
| Runtime channel smoke | [runtime-channel-smoke.json](./runtime-channel-smoke.json) | Three channels pass |
| Real packed npm acceptance | [packed-runtime-acceptance.json](./packed-runtime-acceptance.json); 182 files, 1,198,608 bytes, installed in owned temporary prefix | Three channels pass |
| Remote CI | Must run on the exact pushed candidate | Pending |

The first fullsuite during source review was cancelled and is not counted. The final 4432-pass run includes the registry-selection fix and version 5.0.0. A subsequent six-line test-harness correction gives npm distinct empty user/global config files; the production package did not change after the fullsuite. Targeted tests and the real packed-package acceptance cover that correction; remote CI will cover the final tree.

## Runtime Independence And Scope

Both source-built and genuinely packed npm paths were exercised with controlled PATH entries. Each channel ran seven command/install steps, installed two first-party Claude hooks into an owned home, and verified injection output plus Stop-hook block/retry/state behavior.

| Channel | Removed / Trapped Runtime Names | Outcome |
| --- | --- | --- |
| Node/npm | bun, bunx | Pass |
| Compiled binary | node, nodejs, bun, bunx | Pass |
| Explicit Bun | node, nodejs, bunx | Pass |

PATH checks are not an OS sandbox. Empty trap logs do not prove zero attempted absolute-path executions. The evidence is that the controlled paths and actual required hook outcomes succeeded. No real upstream installation, model call, host security-policy change or global CLI replacement was performed. Codex command/trust/teardown and real shim behavior have unit/contract coverage; new Bun-mode native Codex plugin activation is not certified by the Claude-hook smoke.

The isolated Bun global resolution probe used published 4.49.2. Final candidate 5.0.0 additionally passed a real `update --check --package-manager bun` query via native `bun info`: installed 5.0.0, latest 4.49.2, status ahead. No update was installed. npm and Bun queries now delegate registry/config handling to the explicitly selected manager; no auth configuration is read by a new parser.

## Performance Evidence

Reports: [before](./benchmark-before.json), [after](./benchmark-after.json). Windows x64, Node v24.22.1, Bun 1.4.4; 12 samples per command/channel, one serial trial. Each observation starts a fresh process; one warmup per command and isolated channel HOME/state. First invocation includes asset bootstrap where applicable but is not an OS-cold filesystem test. RSS is explicitly unsupported.

| Channel / Command | Before p50 / p95 ms | After p50 / p95 ms |
| --- | --- | --- |
| Node: version | 256.1 / 282.9 | 223.7 / 243.3 |
| Node: gates | 267.5 / 304.5 | 242.9 / 283.2 |
| Node: prompt | 309.3 / 336.4 | 281.5 / 333.2 |
| Node: checkpoint intent | 284.7 / 323.7 | 257.9 / 279.8 |
| Node: status recover | 296.6 / 345.0 | 270.3 / 293.8 |
| Compiled: version | 114.5 / 169.8 | 91.6 / 97.1 |
| Compiled: gates | 125.6 / 133.0 | 110.2 / 118.4 |
| Compiled: prompt | 158.9 / 164.3 | 141.7 / 175.1 |
| Compiled: checkpoint intent | 133.1 / 135.5 | 122.7 / 139.4 |
| Compiled: status recover | 141.7 / 171.9 | 123.1 / 163.0 |
| Bun: version | 169.3 / 191.4 | 115.9 / 153.7 |
| Bun: gates | 190.3 / 247.6 | 141.9 / 227.5 |
| Bun: prompt | 221.5 / 251.4 | 172.5 / 202.9 |
| Bun: checkpoint intent | 200.2 / 241.5 | 151.8 / 205.2 |
| Bun: status recover | 205.7 / 261.8 | 154.8 / 193.4 |

Local p50 reductions are about 9-13% Node, 8-20% compiled and 22-32% explicit Bun. Two compiled p95 values increased; do not hide them or generalize this single-machine trial to all users, total workflow time, token cost or memory. Earlier diagnostic tables in EXECUTION are not the final measurements.

Both measured reports used harness SHA-256 `31c3eed9086e89c8eb23013b4871ad5587398da6d833a0f5649e1c101b8f7da8`. After measurement, the npm pack probe exposed the empty-config alias issue; final harness SHA-256 is `bd909fd3f5c6aec660df02a4060383bd7346d8064412012d41c6726235d5e436`. This correction affects npm subprocess configuration outside the measured core-command workload; the performance reports have not been silently recaptured or relabeled as using the changed hash.

Candidate artifact SHA-256 values at measurement/acceptance:

- Node CLI: `007bedcc91f56a6631b9e4416b7d8b35d203fc3902623f2fbfbeff0369670b99`.
- Windows candidate: `d086b522db54179ca7310301fd0cf6ebb9b13eadb909650f6d0bf166d9946ebc`.
- Windows baseline: `fb95fe6493c279e0057bbd54518083bbcde9f6290d1c2bb08fcaff97eb329ba3`.
- Packed npm integrity is recorded in the package acceptance JSON; it is not the future registry publication integrity.

## Website

Separate repository: `D:/GitCode/harnessed-site`. Final local build produces 121 pages; 42/42 tests pass. One Quickstart appears immediately after Hero; the old lower 60-second block and duplicate Hero install command are removed. Stable GitHub metadata drives shared version/link surfaces, with 4-second fetch bounds, 15-minute cache and fallback.

Production-preview Chromium checks cover English and Simplified Chinese at 1440x1000 and 390x844: locale assertions, one three-step region, four tabs, keyboard selection, host-specific prompts/setup, explicit Bun status/resume, real clipboard success plus simulated denial, no horizontal overflow and no sticky-header heading obstruction. GitHub failure falls back to four consistent stable labels. A valid-but-tampered expired 999.0.0 cache is corrected by successful API data and persisted; later locale navigation uses the corrected fresh cache with one API request.

Evidence lives in the site repository under `.planning/npm-onboarding/browser-verification.json` and `screenshots/`. Mock 5.0.0 and 4.49.3 releases are test data, not publication evidence. Preview: `http://127.0.0.1:4322/`. No website commit, push or production deployment is claimed here.

Existing site checks remain explicit: full formatting reports pre-existing differences in untouched files; Astro's configured typecheck lacks @astrojs/check, and standalone tsc reports existing Starlight dependency type conflicts. Scoped changed-file checks and production build pass without weakening configuration.

## Governance And Release Gate

Independent static reviews found and corrected SDK import hoisting, UTF-8 output-budget expansion, registry-source mismatch and non-healing high cache versions. These are not native gstack execution receipts.

Native gstack startup did not complete; native office-hours/CEO/architecture/review gates are not marked passed. The main session asked the user whether the documented static reviews and real verification may substitute for this release. Until that decision and final CI/preflight, do not push a version tag, publish npm or deploy the new site against the old stable package. Existing upstream gstack/MCP readiness limitations remain unchanged.
