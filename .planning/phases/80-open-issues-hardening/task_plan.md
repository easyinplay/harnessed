# Phase 80 Task Plan: Open Issues Hardening

Date: 2026-10-30. Planning, implementation, and local verification status: complete. External CI, commit/push, release, and issue closure remain pending.

## Goal

Resolve the open issue set #12-#27 through a verified v5.0.5 baseline for #12/#13 plus six bounded Phase 80 workstreams for #14-#27, without weakening ownership, failure, checkpoint, gate, CI, or CLI documentation contracts.

Issues #12 and #13 have implementation fixes in the v5.0.5 candidate baseline, but GitHub still lists them as Open on 2026-10-30. They remain baseline verification context rather than new Phase 80 implementation scope.

## Scope

| Workstream | Issues | Locked direction |
| --- | --- | --- |
| W1 Uninstall safety | #14, #15, #18, #19 | Preserve backups and user-owned settings; resolve active host roots consistently; legacy skill receipt handling is fail-closed |
| W2 Package/setup | #16, #17, #20 | Ship complete npm assets, share binary hook command resolution, and make real setup write failures exit 1 |
| W3 Checkpoint ownership | #22, #23, #24 | Flat root ledger expansion; owner-scoped checkpoint paths; cwd mismatch remains warn-only |
| W4 Orchestrator/gate | #25, #26 | `--staged` only controls serial stage pauses; gate fields require declared schema and producers |
| W5 CI | #21 | Small structural split with explicit hard/advisory gate semantics |
| W6 CLI docs | #27 | Document only registered CLI forms and add drift detection |

## Non-Goals

- Do not duplicate the existing #12/#13 baseline implementation; retain their remote Open state until pushed evidence is available.
- Do not close #14-#27 from planning evidence alone.
- Do not introduce a new installer framework, nested checkpoint schema, generalized workflow scheduler, or broad CI rewrite.
- Do not change release, tag, publish, or issue state as part of Phase 80 planning.

## Dependency Order

1. Freeze ownership and failure contracts in focused tests before implementation.
2. Implement W1 before relying on uninstall acceptance or package cleanup evidence.
3. Implement W2 independently of checkpoint changes, then run setup/package acceptance.
4. Implement W3 before W4 because orchestrator completion and retry behavior consume the root ledger.
5. Implement W4 after the checkpoint contract is stable.
6. Implement W5 as a small extraction of structural checks after required test commands are known.
7. Implement W6 and the cross-surface drift guard before final documentation verification.
8. Run focused, full local, and applicable CI/real-host verification before issue-by-issue closure review.

## W1: Uninstall Safety

Issues: #14, #15, #18, #19.

Likely files: `src/cli/uninstall.ts`, `src/cli/lib/settingsWriter.ts`, `src/platform/hostInstallContext.ts`, `src/platform/platform.ts`, `src/platform/harnessedRoot.ts`, `src/installers/declaredTeardown.ts`, `manifests/skill-packs/*.yaml`, and focused uninstall/installer tests.

- [x] Preserve setup backups and rollback evidence when uninstall removes runtime state (#14).
- [x] Delete skills, commands, settings, state, and migration targets through the same `CLAUDE_CONFIG_DIR` / `CODEX_HOME` aware host resolver used by setup (#15).
- [x] Record env-key ownership and remove only values written by harnessed; preserve pre-existing user values (#18).
- [x] Derive pack cleanup from owned install receipts and declared installed skills instead of nonexistent parent directories (#19).
- [x] Treat missing or ambiguous legacy skill receipts as fail-closed: retain the path, report the unresolved ownership, and return a partial/non-success result rather than recursively deleting by name.

Acceptance:

- Backups survive uninstall and remain usable by backup/rollback commands.
- Custom Claude and Codex homes uninstall the selected host only.
- User-owned env keys and unowned same-name skill directories survive.
- mattpocock-skills and GSD cleanup either removes every receipt-owned skill or reports an honest partial failure.

## W2: Package And Setup

Issues: #16, #17, #20.

Likely files: `package.json`, package contract tests, `src/installers/lib/idempotent.ts`, `src/installers/lib/hookEntry.ts`, `src/cli/setup.ts`, `src/cli/lib/generateCommands.ts`, `src/cli/lib/settingsWriter.ts`, and binary/npm setup tests.

- [x] Include `CHANGELOG.md` in the npm tarball and add a publish-time build guard so a clean clone cannot produce a package without `dist/` (#16).
- [x] Share compiled hook command resolution between installation and idempotency detection (#17).
- [x] Consume env and command generation results instead of dropping write warnings (#20).
- [x] Classify actual read/backup/write/render failures that prevent requested setup state as real setup failures and exit 1; keep explicitly advisory notices distinguishable from write failures.

Acceptance:

- `npm pack --dry-run` from a clean built fixture contains runtime entrypoints and `CHANGELOG.md`.
- Repeated standalone-binary setup reports the installed hook as already installed and does not rewrite settings.
- JSON/settings/command write failures are visible in text and JSON output and produce exit 1 with no success claim.

## W3: Checkpoint Ownership

Issues: #22, #23, #24.

Likely files: `src/checkpoint/state.ts`, `src/checkpoint/ledger.ts`, `src/checkpoint/injectState.ts`, `src/checkpoint/workflowStore.ts`, `src/checkpoint/engineHook.ts`, `src/checkpoint/template.ts`, `src/checkpoint/resume.ts`, `src/workflow/run.ts`, schemas, and checkpoint/workflow tests.

- [x] Replace nested master activation that overwrites the active record with flat root ledger expansion: append the nested master's actionable subs to the owning workflow ledger and preserve the root owner/status (#22).
- [x] Represent spawn failure in the ledger with visible reason and bounded retry accounting so deterministic failures cannot remain an infinite pending instruction (#23).
- [x] Derive checkpoint and archive paths from the same owner/repo key used by the workflow store (#24).
- [x] Keep checkpoint `cwd` mismatch warn-only. Owner-scoped lookup prevents cross-owner loading; the warning still permits intentional relocation/fresh-session fallback.

Acceptance:

- `auto -> plan` preserves one root owner, all prior entries, and cannot complete until the expanded root ledger is resolved.
- Repeated spawn failures become visible to the injected state and trigger the existing bounded loop policy.
- Two repositories writing the same phase produce distinct checkpoint/archive paths and resume their own envelope.
- A same-owner relocated checkout emits a cwd warning without being rejected solely for path drift.

## W4: Orchestrator And Gate

Issues: #25, #26.

Likely files: `src/cli/run.ts`, `src/workflow/run.ts`, `src/workflow/masterOrchestrator.ts`, `src/workflow/masterOrchestrator-helpers.ts`, phase/gate schemas, `workflows/judgments/*.yaml`, `workflows/capabilities.yaml`, and orchestrator/gate tests.

- [x] Wire `--staged` to `pauseBetweenStages` only for serial stage boundaries; it must not implicitly enable pre-flight, research, or unrelated gate behavior (#25).
- [x] Decide and test the independent producer path for pre-flight understanding/complexity inputs, or remove unreachable routing claims instead of coupling them to `--staged` (#25).
- [x] Add `requires_spec` and `builds_ai_system` to the declared phase contract with explicit producers/defaults (#26).
- [x] Add a structural guard that every referenced `phase.<field>` exists in the schema and gate context.

Acceptance:

- Serial `run --staged` pauses once between eligible stages; non-staged and non-serial paths do not pause.
- Headless and interactive pre-flight behavior is explicit and independently tested.
- Both gate fields can be true through a supported producer path and fire their intended rules.
- Unknown phase field references fail the structural test.

## W5: CI

Issue: #21.

Likely files: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `.github/workflows/perf-bench.yml`, `.github/workflows/stale.yml`, `package.json`, `vitest.config.ts`, small `scripts/ci/*` structural checks, and workflow contract tests.

- [x] Make coverage thresholds execute in CI and define the authoritative command.
- [x] Make lint warning policy explicit and enforceable without silently accepting warning growth.
- [x] Validate ADR baselines independently so one missing tag cannot disable all conservation checks.
- [x] Classify deferred-items, plan-checker, and perf checks as hard or permanently advisory; remove contradictory settings.
- [x] Add bounded job timeouts and SHA-pin the remaining mutable action reference.
- [x] Use a small structural split: extract narrow reusable check scripts/contract tests while keeping workflow topology recognizable.

Acceptance:

- Negative fixtures prove each hard gate makes CI fail for its own violation.
- Advisory gates are named and reported as advisory, not presented as hard gates.
- Workflow contract tests cover timeouts, action pins, coverage, lint policy, and per-ADR behavior.

## W6: CLI Documentation

Issue: #27.

Likely files: affected `workflows/**/SKILL.md`, workflow generation sources if applicable, and CLI/docs contract tests.

- [x] Replace nonexistent top-level command claims with registered forms such as slash commands or `harnessed run <workflow>`.
- [x] Update the canonical source rather than only generated mirrors.
- [x] Add a guard that extracts documented `harnessed <cmd>` forms and compares them with registered commands/approved `run` forms.

Acceptance:

- All 11 reported stale command claims are removed or replaced with executable forms.
- The guard fails on a fixture that documents an unregistered top-level command.

## Verification Matrix

| Layer | Required evidence |
| --- | --- |
| Focused | Per-workstream unit/contract tests, including negative ownership and failure fixtures |
| Package/setup | Clean-clone pack dry-run, npm fixture, standalone-binary repeated setup, write-failure exit checks |
| Checkpoint | Nested master, repeated spawn failure, two-repo collision, relocated cwd warning fixtures |
| Orchestrator/gate | Serial staged pause, independent pre-flight, true/false gate field paths, schema-reference scan |
| CI/docs | Workflow structural contract tests and documented-command registry scan |
| Full local | Build, typecheck, lint policy, full serial Vitest, docs/schema/diff checks required by touched surfaces |
| External | Observe applicable GitHub CI and real-host/package acceptance before claiming those environments pass |

## Issue Closure Policy

- #12-#27 remain open until their own acceptance evidence is recorded remotely.
- Passing a neighboring workstream does not close an issue by association.
- Planning, code review, or local unit tests alone do not prove CI, npm packaging, standalone binary, custom-home, multi-repo, or real-host behavior.
- Close an issue only after the implementation is merged/pushed as required by repository policy and the issue-specific verification has been observed.
- Any unverified platform or publication statement must remain explicitly unclaimed.
