# Phase 78: Deterministic Update Closure

Date: 2026-10-30. Planning status: complete. Implementation: complete locally. Progress: 8/8. No Phase 78 commit/push/tag/publish.

## Objective

Ship deterministic self/upstream update closure, `/harnessed-update`, and a default fail-soft SessionStart reminder without weakening existing provenance, ownership or host trust boundaries.

## Dependency Graph

```text
T1 result contract
 |\
 | +--> T2 adapter registry + GSD adapter
 +----> T3 P1/P2 continuation
 +----> T4 reminder cache + worker
          |
          +--> T5 hook delivery/default opt-out
T1,T2,T3,T5 --> T6 CLI coordinator wiring
T1,T6       --> T7 workflow skill + host integration
T1-T7       --> T8 broad verification/docs/planning sync
```

T2, T3 and T4 may execute in parallel after T1 because their production write sets are disjoint. T5 depends on T4. T6 owns shared CLI wiring and runs after the lower-level slices.

## Tasks

### T1. Structured update result contract

Status: complete. Write set:

- `src/cli/lib/updateResult.ts` (new)
- `tests/unit/update-result.test.ts` (new)

RED: tests require the versioned envelope, component states, deterministic top-level status reduction, exit-code mapping and JSON-safe fatal errors. GREEN: implement pure types/builders only; no process exit, filesystem or network.

Acceptance: `retained` and `unsupported` cannot reduce to complete success; unknown versions serialize as `null`; stdout envelope can be parsed without log stripping.

Verify: `corepack pnpm exec vitest run tests/unit/update-result.test.ts`.

### T2. Typed adapter registry and reviewed GSD adapter

Status: complete. Depends on T1. Parallel group A. Write set:

- `src/cli/lib/updateAdapters/types.ts` (new)
- `src/cli/lib/updateAdapters/registry.ts` (new)
- `src/cli/lib/updateAdapters/gsd.ts` (new)
- `src/installers/lib/skillRuntime.ts`
- `tests/unit/update-adapter-registry.test.ts` (new)
- `tests/unit/update-adapter-gsd.test.ts` (new)
- `tests/unit/installers-lib-skillRuntime.test.ts`

RED: unsupported components return structured `unsupported`; GSD refuses wrong package identity, unknown host, missing runtime and unproven scope; dry-run produces a reviewed action without mutation; apply invokes the host-specific upstream installer and verifies the post-update identity/version. GREEN: expose a structured GSD identity observation and implement the explicit GSD adapter. Do not reuse generic `npm-cli` update behavior or infer commands from manifest strings.

Acceptance: both Claude and Codex flags are tested; a missing GSD install is `not-installed` and is not installed; failure with a still-valid prior runtime becomes `retained`; at least one positive version transition is proven with fixtures.

Verify: `corepack pnpm exec vitest run tests/unit/update-adapter-registry.test.ts tests/unit/update-adapter-gsd.test.ts tests/unit/installers-lib-skillRuntime.test.ts`.

### T3. Fresh-runtime P1 to P2 continuation

Status: complete. Depends on T1. Parallel group A. Write set:

- `src/cli/lib/updateContinuation.ts` (new)
- `src/cli/lib/updateLock.ts` (new)
- `src/cli/lib/selfUpdateBinary.ts`
- `tests/unit/update-continuation.test.ts` (new)
- `tests/unit/update-lock.test.ts` (new)
- `tests/cli/lib/selfUpdateBinary.test.ts`

RED: tests require absolute-path P2 launch, protocol/version validation, whitelist-only continuation data, no third-party work after self-update failure, closure even when self is already current, and explicit partial failure when handoff fails after replacement. Lock tests require one P1 owner per resolved executable/package target, lock retention while P2 runs, busy refusal for a second updater, bounded stale recovery, one-time continuation nonce validation and release after success/failure/interruption. Include Windows paths with spaces and compiled binary replacement fixtures. GREEN: add lock and continuation planning/spawn seams while preserving signature/hash/swap/backup behavior.

Acceptance: P1 never resolves P2 by PATH and never reads new assets in the old runtime; old assets remain until P2 completes; validation and execution remain serialized against the same target; package-manager and compiled channels expose the same continuation result shape.

Verify: `corepack pnpm exec vitest run tests/unit/update-continuation.test.ts tests/unit/update-lock.test.ts tests/cli/lib/selfUpdateBinary.test.ts`.

### T4. Versioned reminder cache and detached refresh worker

Status: complete. Depends on T1. Parallel group A. Write set:

- `src/cli/lib/updateReminderCache.ts` (new)
- `src/cli/updateReminderHookMain.ts` (new)
- `src/cli/updateReminderWorkerMain.ts` (new)
- `tests/unit/update-reminder-cache.test.ts` (new)
- `tests/cli/update-reminder-hook.test.ts` (new)

RED: foreground hook performs zero network calls, prints only for valid behind cache, silently exits for current/ahead/unknown/corrupt/oversized/disabled state, and starts at most one detached worker for stale/missing cache. Worker tests require 24h TTL, atomic rename, single-flight and retry backoff. GREEN: split cache read from refresh; do not call the existing fetch-on-miss resolver from the foreground hook.

Acceptance: every hook path exits `0`; offline startup does not block or repeatedly spawn; cache cannot authorize updates.

Verify: `corepack pnpm exec vitest run tests/unit/update-reminder-cache.test.ts tests/cli/update-reminder-hook.test.ts`.

### T5. Default hook delivery with persistent opt-out

Status: complete. Depends on T4. Write set:

- `manifests/cc-hooks/update-reminder.yaml` (new)
- `src/installers/lib/hookEntry.ts`
- `src/installers/lib/codexHookPlugin.ts`
- `src/compile/entry.ts`
- `src/compile/updateReminderEntrypoint.ts` (new)
- `scripts/build-hooks.mjs`
- `bin/harnessed-update-reminder.mjs` (generated)
- `bin/harnessed-update-reminder-worker.mjs` (generated)
- `tests/installers/ccHookAdd.test.ts`
- `tests/installers/codexHookAdd.test.ts`
- `tests/installers/codexHookPlugin.test.ts`
- `tests/compile/update-reminder-entry.test.ts` (new)

RED: reminder identity coexists with inject-state invalidation, is idempotent, respects custom native homes, uses Codex local-plugin trust, and never edits global Codex trust/config directly. Compiled-entry tests require the internal reminder operation to dispatch before asset extraction and migration, including missing/unwritable asset roots, with no filesystem mutation and exit `0`. GREEN: register a distinct portable/host-aware hook identity, add a dependency-light pre-assets compiled dispatch, and bundle both entry points.

Default installation and opt-out wiring are owned by T6; this task only provides the installable hook contract.

Verify: `corepack pnpm exec vitest run tests/installers/ccHookAdd.test.ts tests/installers/codexHookAdd.test.ts tests/installers/codexHookPlugin.test.ts tests/compile/update-reminder-entry.test.ts && corepack pnpm build:hooks`.

### T6. Coordinator and CLI wiring

Status: complete. Depends on T1, T2, T3 and T5. Write set:

- `src/cli/lib/updateCoordinator.ts` (new)
- `src/cli/update.ts`
- `src/cli/setup.ts`
- `src/cli/install-base.ts`
- `src/cli.ts`
- `tests/cli/update.test.ts`
- `tests/cli/update-json.test.ts` (new)
- `tests/integration/update-cli-process.test.ts` (new)
- `tests/cli/setup-update-reminder.test.ts` (new)

RED: `--json`, `--platform`, `--non-interactive` and hidden continuation mode obey the envelope/exit contract; `--all` runs through fresh P2; upstream failures make exit `1`; unsupported produces `partial`; self-update failure stops adapters; setup installs the reminder by default and persists `--no-update-reminder`; reruns do not reset opt-out. The real built CLI process test covers invalid arguments, fatal exceptions, P2 spawn failure and noisy child output, proving stdout contains one complete envelope and exit codes remain `1/2`. GREEN: move orchestration out of the command action, capture one host context, include the specific default hook manifest without glob-installing all `manifests/cc-hooks`, and keep human output backward-compatible when `--json` is absent.

Acceptance: no missing third-party component is installed; no agent code is reachable; `--check` and `--dry-run` make no target mutation; child logs stay on stderr in JSON mode.

Verify: `corepack pnpm build && corepack pnpm exec vitest run tests/cli/update.test.ts tests/cli/update-json.test.ts tests/cli/setup-update-reminder.test.ts tests/integration/update-cli-process.test.ts`.

### T7. `/harnessed-update` workflow and host acceptance

Status: complete. Depends on T1 and T6. Write set:

- `workflows/harnessed-update/workflow.yaml` (new)
- `workflows/harnessed-update/SKILL.md` (new)
- `workflows/harnessed-update/SKILL.zh-Hans.md` (new)
- `workflows/role-prompts.yaml`
- `workflows/role-prompts.zh-Hans.yaml`
- `tests/workflow/harnessed-update.test.ts` (new)
- `tests/cli/setup-host-context.test.ts`
- `.github/workflows/ci.yml`

RED: workflow invokes `harnessed update --all --json`, displays preview/confirmation/results, stops for restart/continuation failure, and never attempts agent repair. Claude installs only the skill surface after issue #13; Codex retains prompt generation. CI workflow-count assertion increases from 29 to 30. GREEN: add the flat workflow and bilingual prompt entries using existing host primitives.

Acceptance: no Claude `commands/<x>.md` is recreated; Codex prompt/skill roots remain host-correct; unsupported/retained results are explained without claiming success.

Verify: focused workflow/setup tests plus skill i18n, host primitive and invoke-section gates.

### T8. Integration, review, docs and planning synchronization

Status: complete locally. Depends on T1-T7. Write set is assigned only after implementation review to avoid conflicting with Phase 76/77. Expected surfaces:

- `README.md`, `README-zh.md`, `README-en.md` when user-facing commands require documentation
- `.planning/phases/78-deterministic-update-closure/{task_plan.md,findings.md,progress.md,VERIFICATION.md}`
- `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` during final synchronized ownership pass

Run focused tests first, then typecheck, generated hook drift, schema/docs/skill parity gates, full Vitest, lint and `git diff --check`. Execute independent code review, gstack `/review`, security review of update/hook boundaries, and simplification. Perform isolated Claude/Codex acceptance and Windows compiled continuation smoke. Record release blockers explicitly; do not tag or publish without fresh authorization.

The release evidence must include an isolated real GSD transition from a fixed older published version A to a fixed newer published version B under temporary `HOME`/`CLAUDE_CONFIG_DIR`/`CODEX_HOME`. Record host, exact installer arguments, `before`, `target`, `after`, runtime identity and verifier output. Fixture-only transitions do not satisfy this blocker.

## Goal-Backward Acceptance

- `/harnessed-update` exists on both hosts without reviving Claude command duplication.
- self-update and third-party work never continue in the replaced runtime.
- GSD is the only positive third-party adapter in Phase 78; every other unproven component is explicit `unsupported`.
- reminders are default, cache-only in foreground, fail-soft, host-correct and persistently disableable.
- JSON output and exit codes make partial/failure/retained states machine-readable.
- existing ownership, trust, signature and no-missing-install protections remain enforced.
- Phase 79 has structured failure input but no Phase 79 agent code ships here.

## Local Closeout (2026-10-30)

All tasks T1-T8 are complete locally. [VERIFICATION.md](VERIFICATION.md) records repaired acceptance, final gates, real smoke, review closure and limits; [SUMMARY.md](SUMMARY.md) is the phase-close anchor. Build/schema/docs/diff passed; final full Vitest: 394 passed files / 4 skipped files, 5029 passed tests / 43 skipped tests / 1 todo; lint exit `0` with 18 pre-existing warnings. Existing build warnings remain.

Real isolated Codex GSD `1.18.0` to `1.19.0` was `updated`, `verified: true`; reminder `retained` / `hook-trust-pending` correctly left top-level `partial`, exit `1`. Windows compiled absolute-path P1/P2 with spaces, target-global busy and lock release passed. Claude/Codex live SessionStart passed 29 checks with zero foreground network and pending/accepted trust cases. Initial 5 security findings and code findings, subsequent 2 P2 findings and final code-review findings were fixed; follow-up security: 0 CRITICAL/HIGH/MEDIUM.

npm manager-subprocess target binding remains mock/isolated-fixture evidence; Bun apply intentionally fails closed. CI, other OS and actual release signature download were not executed this round. Latest published npm remains `5.0.4`; package candidate `5.0.5` is unpublished. No Phase 78 commit/push/tag/publish; Phase 79 agent repair remains deferred.

## Boundaries

- Preserve all existing Phase 76/77 changes and unrelated untracked files.
- No manifest update schema, arbitrary shell update, auto trust, automatic repair, cross-host update or publication.
- Use TDD red-green-refactor for coordinator, continuation, cache and adapter core logic.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| First planning agents produced only a skeleton or stalled | 3 | Main orchestrator completed the planning artifacts, then requires an independent plan-checker before implementation. |
| multi_agent implementation workers stalled without writes | 4 | Switched T1 implementation to an isolated Codex task; RED/GREEN completed with 38 focused tests passing. |
