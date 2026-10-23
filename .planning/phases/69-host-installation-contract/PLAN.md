---
phase: 69-host-installation-contract
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: false
status: draft
requirements: [HIC-01, HIC-02, HIC-03, HIC-04, HIC-05, HIC-06, HIC-07]
---

# Phase 69 Implementation Plan

Planning artifact only. No task below has been implemented or verified. The user approved preparing this plan, not live migration or publication.

## Start Gate

- Detailed DESIGN.md approved.
- REVIEW.md findings resolved or explicitly dispositioned.
- Required native architecture gate is not represented as passed while gstack lease is blocked; resolve governance before implementation.
- Existing CLI/build/test baseline recorded at execution time; do not copy the previous test count into a completion claim.
- Keep unrelated worktree files and installed host configurations untouched.

## Task 1: Characterize Both Host Lifecycles

Files: new tests/integration/host-installation-lifecycle.test.ts; tests/unit/installers-harness-overrides.test.ts; tests/unit/uninstallers-harness.test.ts; tests/installers/platform-golden.test.ts.

Dependencies: start gate. No production behavior change.

- Capture effective install/verify blocks and dispatch/group decisions for representative global CLI, shared skill, native plugin, MCP and first-party hook manifests.
- Prove that a Codex uninstall cannot execute a base Claude cleanup; capture unsupported behavior where an inverse contract is absent.
- Add mixed-host/custom-home/explicit-empty fixtures and dry-run mutation spies. Preserve existing Claude golden coverage.
- Observe regression RED for the actual lifecycle gaps; do not make an unsafe legacy behavior the required desired result.

Acceptance: fixtures isolate HOME/USERPROFILE and secrets, and fail when install/group/verify/uninstall interpret different host contracts. No real installations, deletions or native trust writes.

## Task 2: Add Shared Context And Pure Plan Resolver

Planned new files: src/platform/hostInstallContext.ts; src/installers/lib/componentPlan.ts; corresponding unit tests. Integration files: src/installers/index.ts; src/cli/lib/setup-helpers.ts.

Dependencies: Task 1.

- Reuse implemented HostId/PlatformDescriptor and existing precedence. Resolve context once; store only safe host/path selection inputs.
- Derive effective manifest and per-operation support in one pure resolver. Keep current wholesale override semantics and a resolveForHarness compatibility wrapper.
- Pass the fixed context into every enabled mutation/native target and state/receipt write; inner helpers must not reselect host/root from ambient env. Preserve the actual-target locking and serialization behavior.
- Replace setup's duplicated effectiveInstallMethod interpretation with the same plan-derived value; preserve groups and serialization.
- Keep result formatting and package channels stable. Avoid imports into heavily factory-mocked modules when an independent module provides the shared boundary.

Acceptance: resolver performs zero side effects, does not mutate input manifests, and all migrated consumers agree. No new persisted state or generic adapter plugin framework.

## Task 3: Close Explicit Host Teardown

Files: src/manifest/schema/spec.ts; src/manifest/security.ts; schemas/manifest.v1.schema.json; manifests/SCHEMA.md; relevant manifests/{tools,skill-packs,optional}/*.yaml; src/uninstallers/index.ts and necessary native per-method teardown modules; teardown/schema/security tests.

Dependencies: Task 2. Any native plugin removal or filesystem cleanup remains fixture-only during development.

- Add optional Codex uninstall replacement with existing Uninstall schema. Wire command and cleanup-path security screening, including host override paths, in the same slice.
- Before enabling any teardown mutation, pin its cleanup, native CLI and state/receipt targets to the Task 2 context; do not postpone this to Task 4.
- Audit the shipped Codex overrides; supply a tested teardown or explicit unsupported-operation, never inherit a Claude delete by default.
- Add the small evaluated component/host neutral-teardown policy in componentPlan.ts, bound to reviewed cmd and cleanup_paths; a missing/changed audit is unsupported. Cover an audited neutral CLI positive, GSD npm-cli negative and an unaudited-component negative.
- Reuse native CLI operations for structural plugin/MCP/hook teardown with exact IDs and namespace safeguards.
- Retain confirmation, canonical confinement and existing applicable user-data protections; no ambient directory discovery grants delete ownership.
- Regenerate schema and run schema-consumer/security tests before any caller enables the new operation.

Acceptance: Codex-only fixtures cannot touch Claude paths/config/receipts; unknown teardown fails before side effects; existing host-neutral CLI teardown and valid Claude behavior remain intact.

## Task 4: Migrate Observation And Native Host Operations

Files: src/installers/lib/idempotent.ts; verifyInstalled.ts; codexPlugins.ts; codexMcpServers.ts; src/cli/lib/setup-helpers.ts; relevant doctor checks; optional thin host facade modules only when consumed by two paths.

Dependencies: Tasks 2-3.

- Pass the selected context through migrated probes and native operations rather than redetecting another host.
- Preserve qualified plugin ID, installed/enabled/trust evidence and source distinction. Do not automatically enable, repair or trust.
- Let update --upstreams continue using runInstall; do not build a parallel updater. External or unknown management source receives explicit policy treatment.
- Cover manifest/channel drift, manually installed shared skills and observed-only state receipts. Current declarations/version receipts are not historical ownership; conflict/unknown evidence cannot authorize destructive takeover or a success receipt rewrite.
- Preserve verification environment allowlist, native serialization, gstack failure evidence, and registration/authentication distinction.

Acceptance: healthy existing installs are verified without reinstall; disabled/wrong-marketplace/unknown/runtime-incomplete fixtures never become ready; pending trust and unsupported remain visible.

## Task 5: Add Bidirectional Owned-Artifact Contracts

Files: src/cli/lib/renderSkillTemplates.ts; generateCommands.ts; rolePromptHostRender.ts; src/installers/lib/codexAgentRoles.ts; codexHookPlugin.ts; new shared artifact enumeration only if production writers consume it; new tests/integration/host-owned-artifacts.test.ts and existing render goldens.

Dependencies: Tasks 2-4.

- Enumerate only harnessed-owned workflow/command/role/wrapper outputs, with explicit optional exceptions.
- Compare declaration-to-write and write-to-declaration, including rendered bytes for both hosts/locales and repeated setup.
- Reuse skillIntegrity/skillBackup and existing markers. Do not introduce a second hash/backup system or infer ownership of arbitrary upstream output.

Acceptance: unlisted writes and missing declared writes fail tests; user content keeps its established backup/refusal behavior; no accidental host primitive drift.

## Task 6: Integrate And Verify Before Delivery

Files: Phase 69 verification/progress documents, docs/host-contract.md, relevant installation reference, CHANGELOG.md. Do not bump a version or push a tag without separate user authorization.

Dependencies: Tasks 1-5.

- Run build, scoped and full serialized tests, lint, schema regeneration/consumer gates, host primitive and locale parity, and production eval.
- Test npm and compiled assets outside repository cwd with isolated homes; check versioned manifests and neutral spawn behavior.
- Run scoped native host acceptance only in explicitly authorized disposable environments. Keep real-machine cleanup/ownership scenarios simulated unless approved.
- Report fixtures, native evidence, blocked prerequisites and unmeasured behavior separately. No gstack/auth/trust bypass for a green summary.
- Update REQUIREMENTS/STATE/progress and produce VERIFICATION.md only from fresh evidence.

Acceptance: all planned mandatory fixture gates pass; native gaps are explicit; no wrong-host mutation, double execution or silent takeover; no unsupported component is called operational.

## Delivery And Rollback

Use separate atomic commits by slice, each pushed per repository policy. A failed slice stops before the next mutation path is enabled. Rollback is code reversion plus existing supported backup restoration, not a bulk delete or reset of user agent homes. Keep old wrappers only while required callers remain, then remove duplicate resolution with coverage.

Review scope after each slice. Newly discovered questions about ownership, unsafe inverse operations or configuration authority return NEEDS_CLARIFICATION rather than unilateral expansion.
