# Phase 88 — SUMMARY: scoped JSON backups

## Committed + pushed — not published (commits `ce2de35` + `9f10531` on main; CI `42637178399` verified success 9/9 on `9f10531`)

**Problem.** `backup()` byte-copied every file the install plan mutates. For
JSON settings files (`~/.claude/settings.json`) that copied unrelated `env`
credentials into the backup dir, and `rollback` restored the entire old file —
clobbering keys the install never touched, including post-install user edits.

**Fix.** When a `DiffPlan` entry's `oldText` and `newText` both parse as JSON
objects (not arrays/scalars), the backup stores a scoped diff payload —
`{version:1, changes:[{path, existed, value?}]}` recording OLD values only —
instead of the whole file. Rollback applies those changes onto the CURRENT
target JSON, reverting exactly the managed paths and preserving every other
key. Recursive object diff; arrays/scalars/type transitions atomic; unchanged
objects emit zero changes.

**Fail-closed rules.** Stale plan (disk ≠ oldText) refuses with
`backup-stale-plan`; unsafe JSON numbers (non-finite, integers >2^53-1)
refuse at backup and restore; malformed/inconsistent metadata (wrong
discriminator, missing/non-hex `payloadSha1`, sentinel+subtree combos,
payloadSha1 on non-subtree entries, unknown kinds, duplicate subtree
targets, malformed/overlapping change paths) aborts Pass1 before any
write/unlink/rm; missing/non-object current parents refuse. `__proto__`/
`constructor`/`prototype` are literal data via own-property checks +
`Object.defineProperty`.

**Released-reader safety.** Subtree entries carry
`sha1: 'json-subtree-v1'` (non-hex discriminator, exported constant
`SUBTREE_ENTRY_SHA1`) + `payloadSha1` with the real digest. Proven against
the actual v5.0.15 binary: rollback exits 1 on checksum mismatch with zero
mutations on a mixed subtree+byte+sentinel snapshot. See findings.md and
VERIFICATION.md.

**Confidentiality.** Unrelated secrets never enter snapshots; values of keys
the install actually changed are still recorded (required for fidelity —
snapshots remain sensitive; no auto-cleanup). Legacy byte backups unchanged.

## Files

- `src/installers/lib/jsonSubtree.ts` — NEW: shared pure helpers
- `src/installers/lib/backup.ts` — kind/payloadSha1, subtree emit, stale+numeric gates, shared write block
- `src/cli/rollback.ts` — entry-contract validation, payloadSha1 verify, subtree restore, numeric gates
- `tests/unit/installers-lib-backup.test.ts`, `cli-rollback.test.ts` — extended
- `tests/unit/backup-rollback-json-roundtrip.test.ts` — NEW real-fs roundtrip
- `CHANGELOG.md` — Unreleased entry (behavior + compat limitation)
- `.planning/STATE.md`, `.planning/ROADMAP.md` — pointer lines

## Evidence

`evidence/` dir + `VERIFICATION.md` gate table. Full suite green: 5697
passed / 43 skipped / 1 todo, exit 0.
