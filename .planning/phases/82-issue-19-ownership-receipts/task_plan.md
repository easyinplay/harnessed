# Issue #19 Skill Ownership Receipt Plan

Status: COMPLETE

## Goal
Fix GSD and mattpocock ownership receipts without claiming unverified user resources or restoring prefix-based uninstall deletion.

## Phases
- [complete] Audit manifests, installer branches, receipt schema, and concurrent diffs
- [complete] Fix fresh receipt, quarantine, and empty-receipt blockers
- [complete] Add non-adoption and real-manifest lifecycle regression tests
- [complete] Add confirmed-repair-only legacy adoption
- [complete] Run requested focused validation
- [complete] Review the final ownership-scoped diff
- [complete] Close Phase 82 review findings
- [complete] Close final uninstall lock and receipt-parent findings
- [complete] Run full suite, coverage, build, schema, and lint

## Owned Files
- `manifests/skill-packs/gsd.yaml`
- `manifests/skill-packs/mattpocock-skills.yaml`
- `src/installers/lib/skillOwnershipReceipt.ts`
- `src/installers/npmCli.ts`
- `src/installers/npxSkillInstaller.ts`
- `src/manifest/schema/spec.ts`
- `schemas/manifest.v1.schema.json`
- Related installer and receipt tests

## Acceptance Criteria
- Fresh GSD install receipts every path proven newly created by the current install, including validated dynamic `gsd-*` skills, `gsd-core/`, and host agent/command resources.
- Ordinary setup/update never grants destructive ownership to preexisting resources.
- Already-installed and legacy-fingerprint paths never create an ownership receipt outside exact component-scoped confirmed repair.
- Confirmed repair snapshots legacy resources before agent execution and commits only the verified pre/post intersection afterward.
- Uninstall consumes only the receipt.
- Real-manifest fresh GSD and mattpocock lifecycles exercise the production receipt writer; pre-existing resources remain excluded.
- Focused tests, Biome, typecheck, and diff-check pass, or unrelated failures are documented.

## Execution
- Implementation is delegated to Codex subagent `01a18e24-0c16-7ce2-93dd-6573674b6966` in the shared workspace.
- If GSD dynamic resources cannot be proven without prefix trust, stop with `STATUS: NEEDS_CLARIFICATION` and declaration/marker options.

## Errors
- Root planning files changed concurrently after inspection. This task uses a phase-local plan to avoid overwriting another worker.
- PowerShell piped the first `apply_patch` payload as UTF-16, so the patch tool rejected it before changing files. Switched to a Bash heredoc.
- The required real manifest contract cannot be represented by the current schema: `SpecSchema` is `additionalProperties: false`, and no existing field can encode expected roots, selectors, kinds, and markers. The delegated ownership list does not authorize `src/manifest/schema/spec.ts`, generated schema artifacts, or schema tests. A temporary schema expansion and its RED tests were fully removed.
- An earlier `corepack pnpm typecheck` attempt was blocked by concurrent syntax errors in `tests/unit/package-publish-contract.test.ts`; the final run passed after those unrelated edits settled.
- A PowerShell pipe encoded the first review-plan patch as UTF-16; `apply_patch` rejected it before changing files. Switched to a UTF-8 Git Bash heredoc.
- The first final-closure patch used a stale assertion anchor and changed no files. Split the patch into current-file atomic edits.
- Full Biome reports one pre-existing warning in `src/cli/facts.ts:134`; scoped ownership files are clean and Biome exits zero.
- The first final-review patch used stale assertion context and was rejected before changing files; split it into current-context atomic patches.
- Scoped Biome found one implicit `any` on the new bigint `lstat` result; annotate it as `BigIntStats`.

## Review Closure Acceptance

- Ownership-managed `current` components with missing, legacy, or corrupt receipts enter only exact `update --all|--upstreams --repair --yes` scope.
- Ordinary setup and update never adopt preexisting resources.
- Receipt writes without `spec.ownership` accept only exact `installs_skills` declarations, never arbitrary direct children.
- Receipt-only teardown is supported only with a non-empty ownership declaration.
- Install snapshot, external writer, and receipt commit share one host ownership lock.
- Adoption writer failure restores every receipt; rollback failure has a distinct result and never reports `completed`.
- The four reviewer regression files, ownership-focused tests, full suite, coverage, build, schema validation, Biome, and `git diff --check` pass.

## Clarification Resolution

The parent authorized the schema surface and necessary ownership helper splits. Prefix
matching remains discovery-only; every receipt path must also match a declared root and marker.

The legacy adoption design is now locked to the existing confirmed repair path. The parent
process snapshots preexisting marker-valid candidates before agent execution, commits only the
pre/post intersection after deterministic verification, and derives roots and manifest identity
from the effective component plan rather than agent output.

## Final Informational Acceptance

- Receipt-only uninstall holds the host ownership lock from receipt read through quarantine finalization.
- A deterministic regression proves fresh install cannot enter while uninstall is inside the receipt transaction.
- `skill-ownership` parent I/O rejects symlink, junction, reparse redirect, and identity replacement.
- Writer, reader, remover, adoption snapshot, and adoption restore share one parent identity helper.
- External redirect targets are never written or deleted on POSIX or Windows.

Status: COMPLETE
