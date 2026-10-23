# Phase 69 Execution Ledger

## Authorization

2026-10-23: the user explicitly confirmed approval of DESIGN.md, the six-task PLAN.md, and use of the completed static architecture review as this phase's execution prerequisite. Native gstack gate remains blocked/notrun; this is not a claim that it passed. No publication, native security change or destructive real-machine test is authorized.

## Workspace And Boundaries

Use the existing shared checkout under the repository's standing main/commit-and-push collaboration policy. No suitable managed worktree was present. Keep unrelated untracked files untouched; all executable tests use isolated homes and mocked external mutation boundaries.

Ruling: preserve the shared method engine and existing package/configuration policy. First characterize public lifecycle behavior, then add pure resolution. A captured context alone does not certify that downstream native operations are pinned; mutation paths need explicit context threading before new teardown is enabled. No global environment swapping or implicit async-context workaround.

## Task Status

| Task | Status | Evidence |
| --- | --- | --- |
| 1. Lifecycle characterization | complete | original 19 pass / 2 regression RED now GREEN through the public lifecycle entrypoints |
| 2. Shared context and pure plan | complete_local | pure/context, dispatch/grouping and captured setup targets; final serialized gate passed |
| 3. Host teardown | complete_local | strict schema/security, evaluated policy, per-name CLI preview/context and safe execution consumers verified |
| 4. Observation/native operations | complete_local | fixture-only backend/probe/cache/trust/doctor plumbing; final evidence/ownership regressions passed; no native migration performed |
| 5. Owned-artifact contract | complete_local | real writers consume full declarations; link/context regressions and unchanged byte goldens passed |
| 6. Integrated acceptance | complete_local | fresh build, 4327-test serialized suite, eval 14/14, local channel smoke and fault fixture passed; native live gates deferred |

## Verification

Baseline against 841605a: `corepack pnpm exec vitest run tests/unit/installers-index.test.ts tests/unit/installers-harness-overrides.test.ts tests/unit/cli-setup-helpers-stepb.test.ts tests/unit/cli-setup-idempotent-probe.test.ts tests/unit/uninstallers-harness.test.ts tests/installers/platform-golden.test.ts --no-file-parallelism` passed: 6 files, 62 tests, 9.92 seconds. No implementation requirement is yet complete.

Recovery audit: Task 2 API separates a captured safe host/path snapshot from the pure component declaration resolver. Codex uninstall remains unsupported until the same slice wires schema, screening and actual teardown consumers. The audited neutral CLI exception must match both command and cleanup paths. No real-machine cleanup is permitted.

Main-session verification: `corepack pnpm exec vitest run tests/unit/manifest-codex-uninstall.test.ts tests/unit/platform-host-install-context.test.ts tests/unit/installers-component-plan.test.ts --no-file-parallelism`: 3 files, 52 tests passed in 1.19 seconds. This verifies only the pure/schema boundary, not backend pinning or full phase completion.

User-requested workspace hygiene: enumerated seven zero-byte untracked files at the repository root. PowerShell removal was rejected by execution policy before execution; all seven remain. No workaround, recursive removal, tracked-file removal or fixture cleanup was attempted.

Integration review corrections in progress:
- Preserve captured `HARNESSED_SPAWN_CWD` rather than dropping the existing override; Codex native-home trim/fallback remains compatible.
- Pin child state/spawn routing after env filtering, without expanding the verification secret allowlist.
- Declared host teardown selects intended commands; it does not establish ownership. Unknown explicit shell cleanup and shared-skill deletion remain unsupported. Reviewed neutral commands and existing exact native operations are separate policies.
- An update bypass must not overwrite an existing manual/unknown skill or plugin; no new ownership receipt is introduced. Existing first-party engine repair stays intact.
- Installed/enabled/trusted remain separate; a registry hit cannot override an explicit disabled setting.

Intermediate main-session run during active edits: nine scoped files, 114 passed / 2 failed (hook fixture `hook_command` absent). The teardown worker was asked to keep inverse-only validation out of install/group resolution and fail closed without throwing. An earlier run observed the three expected RED cases for neutral cwd capture and native-home trim before their fixes. These are intermediate evidence, not a final passing suite.

Further main-session evidence: lifecycle/teardown regression now passes (3 files, 57 tests); pure/schema/plumbing regression passes (7 files, 126 tests). Consolidated new integration contracts pass (8 files, 188 tests, 13.97 seconds). `corepack pnpm typecheck` and `corepack pnpm build` passed; the final build must be rerun after the remaining workers freeze their edits. Schema-consumer, JSON Schema validation, host-primitives and both locale-parity gates passed. Full-suite and package-channel gates remain pending.

Conservative teardown disposition: public Codex MCP teardown is unsupported while its observed metadata establishes registration/enablement but not source identity. First-party namespaced hook and individually reviewed neutral CLI policies remain distinct. Do not advertise a source-unproven native MCP removal as operational.

## Integrated Review And Incomplete Gates

- The intermediate first full serialized run exposed eight legacy installer-contract fixture failures because the new read-only `lstat`/`readdir` probes were absent from the old FS mock. The implementation worker reproduced 34 pass / 8 fail, added only absent/empty read mocks, and reran all 42 original assertions successfully. The final rerun is recorded below.
- First whole-repository lint failed only on import ordering/formatting in the new lifecycle regression. Main applied Biome to that one file; a subsequent unmodified `corepack pnpm lint` exited 0 with the existing 17 warnings.
- Independent static review found a workflow destination-link traversal regression and failure to prioritize `hostContext` when the legacy host argument is omitted. Original artifact author is adding RED/GREEN fixtures before refreezing.
- Further review found retained-probe MCP/hook evidence gaps, unresolved trust entries without hashes, a Claude dry-run receipt write, first-party hook teardown ownership/confinement gaps and swallowed neutral npm uninstall failures. These remain open until fresh regressions and fixes are verified. No native-gstack gate is represented as passed.
- Candidate build, npm pack and Windows Bun compile succeeded; the tarball installed 117 dependencies into an isolated prefix with `--offline --ignore-scripts --no-audit --no-fund`. These payloads precede outstanding review fixes and are NOT final package acceptance.

### Invalid Smoke And Residual Fixture

The first PowerShell smoke attempt failed at parse time because `${hostId}` was needed before a colon. The second attempt used `$home`, which collides case-insensitively with PowerShell's readonly `$HOME`. Its non-terminating error left the real home in scope. Main terminated exec session 79331 immediately after observing the diagnostic; this run is invalid and supplies no package acceptance evidence.

Metadata inspection confirmed a newly created `C:\Users\easyi\state\update-check.json` (53 bytes, creation/last-write 2026-10-23 22:33:54 local). No `state/assets` directory was observed. A native PowerShell cleanup limited to the identified generated cache and an empty parent was rejected before execution by tool policy. This generated cache remains, separately from the seven pre-existing root zero-byte files. No alternate deletion tool was used.

Any retry must set terminating error behavior, use an unambiguous fixture-home variable and validate every resolved write target remains below the explicitly created temporary channel root BEFORE creating a directory or cache. Bootstrap/cache IO must remain separate from target-mutation assertions.

Retry protocol validation (candidate binary, not final payload): explicit `fixtureHome`, terminating errors and pre-write absolute-path bounds worked. Compiled Claude and Codex each previewed all 29 workflows in en and zh from a foreign cwd with native-CLI PATH empty; post-bootstrap recursive directory/file/hash snapshots were unchanged. Outstanding implementation review fixes still require rebuilding and repeating channel acceptance.

First full serialized run finished in 296.91 seconds: 365 files passed / 1 failed / 3 skipped; 4204 tests passed / 8 failed / 11 skipped / 1 todo. All failures were the previously reproduced `installer-contract.test.ts` mock omissions; the worker's isolated repair passes all 42 assertions. The suite was loaded before that fixture repair and before final review fixes, so it is intentionally retained as failed intermediate evidence, not relabeled green.

Main-session review-fix verification: workflow/artifact + lifecycle + original installer contracts passed together (3 files, 83 tests, 19.62 seconds). Schema Alias, Windows env casing, safe teardown, observation evidence, setup writes and public lifecycle scopes passed together (6 files, 218 tests, 3.44 seconds). First-party hook removal ownership/confinement, untrust failure and dry-run receipt corrections remain the final active implementation slice.

## Final Local Closure

All implementation agents froze their changes and were closed. Main independently reran native hook/dry-run regressions (2 files, 98 tests) after the final unknown-registration fix. A final per-manifest CLI consistency correction moved statically unsupported teardown policy into the pure resolver and captured one context across preview/confirmation/execution; its author observed RED/GREEN and passed 6 files / 144 tests. The legacy no-name unified uninstaller was not redesigned.

Main rebuilt after that final change, then ran the whole serialized suite: 367 files passed / 3 skipped; 4327 tests passed / 11 skipped / 1 todo in 283.89 seconds. Whole-repository lint passed with 17 existing warnings; final error-only lint passed. Schema generation/validation/consumer, host primitive and both locale-parity gates passed. Production eval passed 14/14 without updating goldens.

Fresh final source, npm-prefix and Windows compiled payloads passed 12 previews (two hosts, two locales, 29 workflows each) from foreign cwd with native CLI PATH empty and fixture homes/native/state roots. Nine selected asset hashes matched source and post-bootstrap directory/file/hash snapshots were unchanged. A new extracted npm package without workflow assets failed with exit 1 and zero workflow previews, without source fallback. No existing asset directory was deleted or moved to create this negative fixture. Payload hashes and explicit evidence limits are in VERIFICATION.md.

All static review findings are closed by regressions and the final gate. Native gstack remains blocked/notrun; native/auth/browser and other-OS live acceptance are not inferred. code-simplifier is unavailable/notrun and was not silently substituted. Version remains 4.49.2; no tag/publication/global installation replacement occurred. Workspace cleanup remains incomplete exactly as recorded above.

Final hygiene correction: two fresh PowerShell scans now report zero root zero-byte files, and Git no longer lists the seven original empty paths. Their removal is not attributed to this agent's rejected commands. The incorrectly generated `C:\Users\easyi\state\update-check.json` still exists at 53 bytes with the same timestamp; that separate cleanup remains blocked. Earlier seven-file observations above are historical, not current state.

## CI Follow-Up After Push

Core commit `f5ca347` was pushed immediately per repository policy. CI `39980176901` passed 8/9 jobs, including both Unix test jobs and all six installer/binary smokes, but Windows tests reproduced an existing PowerShell ANSI-decoding failure also present on the previous `841605a` run. Source line 138 was the only executable non-ASCII line; its punctuation could decode into a quote before the following ampersand instruction.

Main used the approved trivial-edit exception (one production line plus an eight-line test): native parser reproduction produced 7 errors, the new portable ASCII regression was genuinely RED, then replacing that diagnostic punctuation with ASCII produced zero parser errors and 19 passed / 5 platform-skipped installer tests. Biome passed. There was no change to consent, failure exit codes, installation targets or package payload hashes. This is a separate narrow compatibility fix, not a test skip or CI-security workaround. A fresh CI run is required for the follow-up commit.
