# Phase 69: Host Installation Contract

Date: 2026-10-23. Status: planning only; implementation not started.

## Authorized Direction

The user accepted gradual consolidation of the existing shared engine with thin host adapters, then explicitly withdrew direct replacement of the installation approach. The first stage supports Claude Code and Codex only. The latest instruction authorizes the next design/planning step, not live installation migration or publication.

## Inputs

- Research: ../../research/host-installation-patterns.md.
- Baseline: main at 47704e6; published package remains 4.49.2.
- Existing mechanisms: PlatformDescriptor, resolveForHarness, seven method dispatchers, manifest overrides, host rendering, skill hash ledger, backup-before-overwrite and native CLI registration.
- Existing constraints: ADR 0040 host precedence; ADR 0041 native Codex plugin/trust and credential boundaries; schema-consumer gate; explicit L4 and hook-trust consent.

## Scope

Specify one resolved host/component contract for installation lifecycle consumers, a minimal additive host teardown declaration, a thin adapter boundary and owned-artifact verification. Define ordered implementation slices with concrete files and acceptance criteria.

## Non-Goals

- Replacing existing installers, package channels, state roots or backup/overwrite policy.
- Adding other agent CLIs, a plugin framework or a new persistent ownership database.
- Repairing upstream gstack locking, migrating code-review/code-simplifier, or copying upstream implementations.
- Reading or backing up config.toml/auth.json/provider credentials; changing native symlink, sandbox or trust policy.
- Installing, uninstalling, migrating or enabling components on the real machine during planning.

## Governance And Evidence

Strategic discovery is skipped because this is scoped technical consolidation of an existing system, not a new product direction. Architectural review is required. The known gstack native lease blocker must not be bypassed or called a passing native plan-eng-review gate. Static design review can inform this draft but is recorded separately and cannot certify the native workflow.

The phase remains draft until the detailed contract is approved and execution governance is resolved. No SUMMARY or implementation verification exists.

## Outputs

- DESIGN.md: proposed contracts, boundaries and compatibility decisions.
- PLAN.md: dependency-ordered implementation slices, not completed tasks.
- VALIDATION.md: planned acceptance matrix, distinguishing fixtures from live evidence.
- REVIEW.md: static architecture findings and their disposition, with native gate status explicit.
