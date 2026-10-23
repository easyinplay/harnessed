# Phase 69 Static Architecture Review

Date: 2026-10-23. Review round: 1 (single requested round).
Scope: CONTEXT.md, DESIGN.md, PLAN.md; targeted source checks and VALIDATION rows.

## Status

- static_review: completed
- native_gstack_gate: blocked
- native_gstack_gate_execution: notrun
- implementation: false
- design_approval: pending
- recommendation: R1-R3 document revisions recorded below; detailed approval remains pending
- evidence: static only; no tests, live install, native CLI, secrets or credentials

## R1: Pin Context Before Each Mutation Route Is Enabled

Severity: P1. Disposition: resolved_in_documents by main; not implemented or runtime-verified.
Locations: DESIGN.md:31-33,38; PLAN.md:43-48,54,70.
Evidence: src/installers/codexHookAdd.ts:54-56,282 re-resolves env/host;
src/uninstallers/ccHookAdd.ts:35-36 re-detects host;
src/platform/harnessedRoot.ts:72-73 re-detects stateRoot.

Directory-only wording misses fresh env selection. Task 3 enables teardown before
Task 4 context threading; wrapping an ambient-reading helper is insufficient.
Required precise revisions:
- DESIGN section 3: context construction MAY perform existing read-only host/pin
  probes. After construction, host, native/config/skill homes and existing stateRoot
  are authoritative. No downstream re-selection from ambient env, directories or pins.
- Preserve current HARNESSED_ROOT_OVERRIDE precedence and per-helper empty/default
  behavior; do not normalize roots, move state or extend config capabilities.
- DESIGN section 4: only component resolution from validated manifest + snapshot +
  operation is pure: no fs/env reads, spawn, network, mutation or receipt persistence.
- PLAN Tasks 2-3: context-pin each enabled mutation/cleanup/state write/native CLI
  target and applicable lock before enabling that route; do not defer to Task 4.
  Execution env policy stays separate; do not capture full process.env.
- Fixture: change host/home/root-selection env after snapshot; targets and state
  writes remain pinned. Do not require zero fs reads during snapshot construction.

## R2: Make Host-Neutral Audit An Evaluated Policy

Severity: P1. Disposition: resolved_in_documents by main; evaluated policy specified, not implemented.
Locations: DESIGN.md:56,59; PLAN.md:57,62.
Required precise revisions:
- DESIGN section 5 / PLAN Task 3: identify a small reviewed component/host policy
  consumed by the resolver. Missing audit means unsupported, not base fallback.
  Do not infer neutrality from npm-cli, command text, path shape or component name.
- Audit cmd AND cleanup_paths; bind structural teardown to exact native resource
  identity, never ownership of a shared directory. No generic policy framework.
- Fixture: audited neutral global CLI positive; GSD npm-cli negative; unaudited
  component negative. Policy documentation without an evaluated consumer is insufficient.

## R3: Current Manifest Is Not An Installation Receipt

Severity: P1. Disposition: resolved_in_documents by main; historical-source limit specified, not implemented.
Locations: DESIGN.md:40,75-79; PLAN.md:57,72.
Required precise revisions:
- DESIGN section 7: effective blocks/provenance describe current intended behavior,
  not historical source/ref/method/target. Presence/version state is not ownership.
- Before destructive update/uninstall, bind current resource evidence to applicable
  management policy. Conflicting/unknown identity cannot authorize external takeover,
  deletion or a success receipt rewrite; confirmation alone is not ownership evidence.
- PLAN Tasks 3-4: test manifest/channel drift, manually installed shared skills and
  observed-only state. Preserve existing engine namespace backup/overwrite/fail-soft
  behavior; do not replace it with a blanket unknown-file no-overwrite policy.
- An ephemeral derived plan is sufficient for the first slice. No new persisted
  receipt/database or historical migration is required by this review.

## Main-Session Validation Corrections

Disposition: resolved_by_main; saved wording statically checked, not runtime verified.
The main session revised VALIDATION.md:37,51-52,65 during this review. Re-reading
those rows confirms the following scope corrections; no implementation is required.
- H01: read-only probes belong to snapshot construction; component resolver is pure.
- Z01/P03: preserve compiled entry bootstrap. Stage/bootstrap separately, record its
  IO and existing metadata-cache IO, then assert no target mutations against a stable
  dry-run baseline. Do not promise zero whole-process IO or redesign bootstrap.
- A03: retain current engine namespace backup-before-overwrite and fail-soft policy;
  ownership work must not silently introduce a new blanket overwrite prohibition.

## Other Constraint Dispositions

- Schema/security: accepted_as_planned (DESIGN.md:50; PLAN.md:56-60). Keep uninstall
  optional; reuse Uninstall; ship schema, generated schema/docs, cmd/cleanup security
  and actual consumers together. Add nested-path consumption/security tests: the
  field-name scan in scripts/check-schema-consumers.mjs:320 is not liveness proof.
- Scope: accepted_as_planned. Only Claude/Codex; existing engine/dispatchers, roots
  and backup policy. No upstream copying, generic plugin framework, gstack repair
  or code-review/simplifier port is required or authorized by this review.
- Governance: accepted_as_documented. Static completion is not design approval or
  native gate success. R1-R3 require document edits, not accepted runtime risks.
  No additional review round is required here; approval remains a separate decision.

## Main-Session Disposition

2026-10-23: the main session checked the source-backed constraints and revised DESIGN sections 3/4/5/7, PLAN Tasks 2/3/4 and VALIDATION C03/U04/U05. R1-R3 are resolved_in_documents, not implemented or runtime-verified. Mutation routes must be context-pinned before enabling teardown; the neutral-teardown policy is evaluated and declaration-bound; current manifests/observed receipts cannot claim historical ownership. These edits do not make the native gate pass or constitute design approval.
