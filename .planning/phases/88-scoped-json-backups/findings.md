# Phase 88 — findings

## Context verified (pre-implementation)

- `backup(plan, ctx)` in `src/installers/lib/backup.ts`: iterates
  `plan.files`, reads on-disk bytes, mirrors under
  `<backupRoot>/<id>/<SCOPE>/<rel>` via `mirrorPath()`, writes
  `metadata.json` with `{target, backup, sha1, eol, sentinel?}` entries.
  Sentinels: `created` (ENOENT + oldText==='') and `preexisting-dir` (EISDIR).
- `registerRollback` in `src/cli/rollback.ts`: already two-pass (v4.1.3) —
  Pass1 reads+sha1s every backup into planned ops, Pass2 writes/unlinks/rm.
  Duplicates `BackupFileEntry`/`BackupMetadata` interfaces locally; imports
  `getBackupRoot` from backup.ts (so importing the entry types too is minimal).
- `HARNESSED_ROOT_OVERRIDE` env redirects `detectPlatform().stateRoot`;
  `getBackupRoot()` composes `harnessedSubdir('backups')` under it → real-fs
  roundtrip tests can stay inside a tmpdir.
- i18n: rollback messages live in `messages/en.json` + `zh-Hans.json`; new
  error strings will use plain `console.error` literals (rollback.ts already
  mixes both) to avoid i18n-parity churn.
- Root has untracked diagnostic files (task_plan.md, findings.md, etc. at
  repo root) — left untouched per handoff.

## Assumptions made (within settled design)

- `kind` omitted on byte entries (design: "absent = legacy bytes"); metadata
  for byte backups stays byte-identical to today.
- Rollback treats explicit `kind:'bytes'` same as absent; any other value
  fails closed.
- `existed:false` change whose leaf is already absent in current JSON →
  no-op success (delete of missing key is the desired end state).
- Stale-plan error keyword: `backup-stale-plan` (structured InstallError,
  no byte-fallback).
- Subtree payload stored at the same mirror path a byte backup would use.

## Rework round (lead review) — decisions folded in

### Format safety for released readers (accepted)

Per-entry sha1 discriminator chosen over a synthetic guard entry (smaller, no
file-count/order coupling): `kind:'json-subtree'` entries store
`sha1: SUBTREE_ENTRY_SHA1` (`'json-subtree-v1'`, deliberately non-hex so no
digest can ever equal it) plus `payloadSha1` holding the real payload digest.
A released rollback sha1-verifies every backup before mutating (its two-pass
shape was verified at HEAD and exercised live below), so it always aborts on
scoped snapshots instead of byte-writing diff JSON into the target — same
contract as restic repository versioning, where an old client must refuse a
newer repo format
(https://restic.readthedocs.io/en/stable/045_working_with_repos.html).
New reader requires: exact discriminator, `/^[a-f0-9]{40}$/` payloadSha1,
non-empty backup, no sentinel; non-subtree entries carrying `payloadSha1` are
rejected too. Unguarded sha1-only subtree snapshots are refused (none shipped).

Execution evidence (real released binary, no mocks): bundled a snapshot via
the new `backup()` (esbuild → node), then ran the installed
`harnessed.exe` **v5.0.15** with `HARNESSED_ROOT_OVERRIDE` on a wholly
temporary fixture mixing subtree + byte + created-sentinel entries. Result:
`rollback exit=1` with `backup checksum mismatch ... expected json-subtree`;
md5 of all three targets identical before/after — zero mutations. Logs:
`evidence/compat-legacy-5.0.15.log`, `compat-before.md5`/`compat-after.md5`,
`compat-metadata.json`, producer `probe-backup.mts`. Deviation: v5.0.15 has
no `--platform` flag (commander: `unknown option`) — ran without it; the
state root was pinned by the override and this machine's default platform is
claude anyway. Regression pins: `SUBTREE_ENTRY_SHA1` asserted non-40-hex in
the backup test (legacy-reader contract) + entry-combination rejections in
the rollback tests.

### Numeric fidelity refusal (accepted)

`JSON.parse` lossy numbers can't survive the restore re-serialization:
`1e400` → `Infinity` → stringifies as `null`; integers > `2^53-1` silently
round. Both backup (old+new plan images) and restore (payload old values +
entire current tree — untouched keys included, since the whole file is
re-serialized) fail closed with a structured error instead of corrupting
user data or falling back to byte copies. Own-property-safe traversal in
`containsUnsafeJsonNumber`; no new parser or dependency.

### Confidentiality clarification

Unrelated secrets (e.g. `env` credentials at paths the plan never touched)
are never copied into scoped snapshots. Values of keys the install actually
modified or deleted ARE still recorded — that fidelity is the point — so
old snapshots may remain sensitive; there is still no automatic deletion or
rotation without user authority. Legacy whole-file byte backups are
unchanged for every non-JSON/deletion/sentinel case.

### TDD process honesty

Round 1 wrote the new-test batch in one pass (bulk red: 31 new failures,
24 legacy green — `evidence/red.log`) rather than strict per-slice
red-green; the rework defects were then fixed with targeted tests per item.
Recorded per lead request rather than claiming strict vertical TDD.
