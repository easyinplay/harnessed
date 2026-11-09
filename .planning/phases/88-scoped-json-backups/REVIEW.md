# Phase 88 — REVIEW record

## Verdict: ACCEPTED for landing (implementation + rework), pending commit/push authorization

Two-axis read-only review (standards + spec) returned **no blocking
requirement/safety defects**. Lead final review accepted the implementation,
the second-round diff, and the real-binary compatibility evidence.

## Review decisions recorded

- **Format discriminator over synthetic guard entry**: per-entry
  `sha1:'json-subtree-v1'` + `payloadSha1` was chosen (smaller surface, no
  file-count/order coupling). Old readers fail closed via their existing
  two-pass sha1 gate — proven live on the released v5.0.15 binary.
- **Numeric fidelity refusal**: JSON numbers `JSON.stringify` cannot
  round-trip (non-finite, integers >2^53-1) refuse at both backup and
  restore rather than silently corrupting. No lossless parser introduced —
  out of scope for this fix.
- **Entry-contract strictness**: inconsistent metadata combinations
  (subtree+sentinel, empty backup path, non-hex payloadSha1, payloadSha1 on
  non-subtree entries, unknown kinds, duplicate subtree targets) refuse
  before any mutation.
- **Same-leaf drift**: intentional — rollback reverts managed paths without
  detecting post-install same-path edits; documented, no invented warnings.

## Accepted limitations (recorded, not fixed — out of scope)

- Restored JSON is **semantically** equal, not byte-format-identical:
  re-serialized with 2-space indent and the recorded EOL convention.
- A no-op subtree payload (zero changes) still re-serializes the file —
  harmless normalization, documented.
- `-0` and number spelling are normalized by `JSON.stringify` (e.g. `1e3`
  → `1000`) — a documented serializer limitation; no lossless parser is
  being built in this fix.
- JSON→non-object / deletion plans keep byte-backup fallback per scope.
- Partial backup directories left behind on mid-backup failure are
  preexisting behavior, unchanged.
- Rollback is not a filesystem transaction: concurrent external edits to a
  target *during* Pass1→Pass2 remain outside the snapshot guarantee
  (Pass1 still guarantees zero mutations on any refusal).
- Old snapshots remain sensitive; no automatic cleanup or rotation without
  user authority.

## Reviewer notes

Reviewers were read-only two-axis passes; no model-identity claims made
(available tooling has no such selector).
