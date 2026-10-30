<!-- generated-by: gsd-doc-writer -->
# Phase 78 Verification: Deterministic Update Closure

Date: 2026-10-30. Status: complete locally, 8/8 tasks. Not committed, pushed, tagged or published.

## Goal and Evidence Scope

Close the deterministic update loop for harnessed and the reviewed GSD adapter, expose `/harnessed-update` on Claude Code and Codex, and deliver a default cache-only, fail-soft SessionStart reminder without weakening provenance, ownership or explicit host trust.

This receipt records the supplied final implementation, gate, smoke and review evidence. The documentation-only closeout does not rerun build, Vitest, lint or live acceptance; its own check is the planning-scoped `git diff --check`. Architecture and task scope remain in [ARCHITECTURE.md](ARCHITECTURE.md) and [task_plan.md](task_plan.md).

## Repaired Acceptance

| Contract | Final acceptance |
| --- | --- |
| Fresh-runtime closure | P1 launches verified absolute-path P2 rather than resolving through PATH; self-update failure prevents third-party mutation, and handoff failure cannot report complete success. |
| Serialized target | Target-global locking covers P1/P2 even across host roots; a competing updater reports busy before mutation, and the lock is released after the operation. Continuation identity and one-time nonce remain enforced. |
| Package target binding | npm mutation binds the proven executable, canonical package target, cwd/env and explicit prefix. Unproven or mismatched targets fail closed. This manager-subprocess coverage is mock/isolated-fixture evidence, not a live global npm replacement. |
| Reviewed third parties | GSD identity/version and post-update runtime verification authorize its adapter only. Missing components are not installed; unsupported, offline, retained and partial states cannot masquerade as a completed update. |
| Honest trust result | A verified GSD update may coexist with a retained reminder whose `reasonCode` is `hook-trust-pending`; the envelope then remains `partial`, exit `1`. Trust is never implicitly accepted. |
| Reminder startup | Claude/Codex SessionStart foreground is cache-only, performs zero network calls and is fail-soft. Compiled dispatch precedes asset extraction/migration; persistent opt-out and host-specific roots remain respected. |
| Workflow and process contract | `/harnessed-update` invokes `harnessed update --all --json`; one JSON envelope and meaningful exit codes survive child diagnostics. Claude skill delivery does not recreate legacy command duplication; Codex retains its host-native surface. |
| Scope boundary | No generic shell updater, automatic repair, privilege expansion or cross-component transaction claim. Bun apply intentionally fails closed; Phase 79 agent repair remains deferred. |

## Final Local Gates

| Gate | Recorded result |
| --- | --- |
| Build (`corepack pnpm build`) | PASS; existing build warnings remain, not a warning-free build. |
| Final full Vitest | PASS: 394 passed files / 4 skipped files; 5029 passed tests / 43 skipped tests / 1 todo. |
| Lint (`corepack pnpm lint`) | PASS, exit `0`, with 18 pre-existing warnings. |
| Schema | PASS. |
| Docs | PASS. |
| Diff | PASS; planning-scoped check rerun for this documentation closeout. |

The final full-suite result above supersedes intermediate focused totals. Skipped files/tests and the todo are not counted as passed. These local gates do not establish exact-source CI or release readiness on other operating systems.

## Real Smoke Evidence

### Isolated Codex GSD Transition

- Real isolated Codex installation transitioned from `1.18.0` to `1.19.0`; this is not the fixture-only transition from the planning baseline.
- The GSD component reported `status: updated`, `before: 1.18.0`, `after: 1.19.0`, `verified: true` after runtime identity verification.
- The reminder was `retained` with `reasonCode: hook-trust-pending`; top-level `status: partial`, exit `1` correctly preserved the unresolved trust boundary.
- This proves a positive third-party update without claiming the entire operation succeeded or that Codex trust was automatically granted.

### Windows Compiled Continuation

- Compiled P1/P2 smoke passed using an absolute executable path containing spaces.
- A concurrent updater targeting the same executable was refused as target-global busy; lock release was verified.
- This is local Windows compiled continuation evidence, not an actual release signature/download exercise or other-OS acceptance.

### Live SessionStart

- Claude Code and Codex live SessionStart acceptance passed 29 checks, including zero foreground network calls.
- Codex trust-pending and trust-accepted cases were exercised separately; pending trust remains visible and is not converted into an accepted/verified hook state.

## Review Closure

- The initial security review's 5 findings and the initial code-review findings were fixed.
- The subsequent 2 P2 findings were fixed.
- Follow-up security review reported 0 CRITICAL, 0 HIGH and 0 MEDIUM findings.
- Final code-review findings were fixed before recording the final full-suite result. No unresolved review finding is carried as a Phase 78 local-completion blocker.

These are recorded review outcomes, not a new review run by this documentation task or a claim of zero residual security risk.

## Limits and Publication Boundary

- npm target-binding coverage uses mocks/isolated fixtures for the real manager subprocess; this round did not replace an actual global npm installation.
- Bun apply intentionally remains fail-closed (`package-target-unproven`), with no inferred global layout or npm fallback.
- CI, other-OS live acceptance and actual release signature download/verification were not run this round. Historical release evidence is not reused as Phase 78 execution evidence.
- Build passed with existing warnings; lint passed with 18 pre-existing warnings.
- Latest published npm remains `5.0.4`; `package.json` is candidate `5.0.5`, not published. Phase 75's historical pushed-main candidate is distinct from these uncommitted Phase 78 changes.
- Phase 78 is locally complete only: no commit, push, tag or publish was performed for it. Phase 79 restricted agent repair remains deferred and is not implemented or activated by this closeout.
