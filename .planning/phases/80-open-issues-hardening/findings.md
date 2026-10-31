# Phase 80 Findings

Date: 2026-10-30. These are planning findings, not implementation verification.

## Issue Baseline

- GitHub lists #12-#27 as Open on 2026-10-30. #12/#13 have fixes in the v5.0.5 candidate baseline; #14-#27 are implemented and locally verified in Phase 80.
- No issue in that range is remotely closed by this local task because commit, push, and GitHub CI evidence remain pending.

## Workstream Map

- Uninstall safety: #14, #15, #18, #19.
- Package/setup: #16, #17, #20.
- Checkpoint ownership: #22, #23, #24.
- Orchestrator/gate: #25, #26.
- CI: #21.
- CLI docs: #27.

## Locked Decisions

- Legacy skill receipt handling is fail-closed. An absent or ambiguous ownership receipt cannot authorize recursive deletion by skill name.
- Real setup write failures exit 1. A requested state that could not be read, backed up, rendered, or written cannot end with a success claim.
- Nested stage masters use flat root ledger expansion. They do not replace the root workflow envelope with a child ledger.
- Checkpoint and archive paths are owner-scoped. `cwd` drift remains warn-only so intentional relocation can use the existing fallback path.
- `--staged` only enables serial pauses between stages. It is not a proxy for pre-flight or research gate activation.
- CI uses a small structural split: narrow scripts and contract tests, not a broad workflow redesign.

## Planning Risks

- Uninstall changes can destroy user data if ownership is inferred from names, prefixes, or current manifests instead of receipts.
- Custom host roots and legacy migration paths can diverge unless setup, uninstall, detection, and migration share one resolver.
- Flat ledger expansion changes completion and retry semantics; schema compatibility and recovery fixtures are required before implementation is considered safe.
- Owner-scoped checkpoint paths prevent cross-repo collisions, but cwd equality is not a durable ownership identity and therefore remains diagnostic only.
- CI hardening can create noisy failures if warnings and advisory checks are promoted without an explicit baseline and negative fixtures.
- CLI documentation may be generated from canonical sources; editing only installed/generated copies would leave drift in place.

## Verification Findings

- Local implementation now covers #12-#27 when the existing v5.0.5 baseline for #12/#13 is included. The issue closure boundary remains commit/push plus applicable CI evidence.
- Security review found destructive-path risks beyond the original issue text; the final implementation rejects symlink/junction targets, rechecks canonical paths before deletion, and never deletes unowned same-name skills.
- Settings and skill receipts are fail-closed and bound to the active host/component. Settings writes roll back on receipt failure; skill receipts bind manifest identity and installed tree content.
- Full local test and coverage gates pass. Production eval scenarios pass and owner-hash paths normalize deterministically.
- GitHub API access returned EOF during the final live issue-list query, so no new issue-state claim is made from that failed query.

## Evidence Boundary

- No Phase 80 commit, push, tag, publication, GitHub CI observation, or issue closure has been performed in this task.
- Local success does not claim Windows/WSL/Claude Code real-host acceptance beyond the exercised fixtures and subprocess tests.
