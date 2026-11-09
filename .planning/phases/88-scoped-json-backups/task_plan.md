# Phase 88 — Scoped JSON backups (settings safety fix)

Status: complete. Implementation `ce2de35`, docs `9f10531`; CI `42637178399`
verified success (9/9). See `VERIFICATION.md` and `REVIEW.md`.

## Problem

`backup()` byte-copies every file the install plan mutates. For JSON settings
files (e.g. `~/.claude/settings.json` with `env` credentials) that copies
unrelated secrets into `~/.claude/harnessed/backups/` and rollback restores the
entire old file, clobbering keys the install never touched (user edits made
after install).

## Settled design

1. Backup scope = mutation scope. `DiffPlan.files` already carries
   `oldText`/`newText`; when BOTH parse as non-null JSON objects (not arrays),
   emit a `kind: 'json-subtree'` metadata entry whose backup payload is a
   versioned diff document
   `{version:1, changes:[{path:string[], existed:boolean, value?}]}` recording
   OLD values only. No `newText`/whole-JSON anywhere in payload/metadata/logs.
   - Entry `sha1` holds the `json-subtree-v1` discriminator (non-hex, so
     released readers always fail closed); `payloadSha1` holds the actual
     digest of the exact stored payload bytes, and rollback validates
     against that field.
   - Recursive object diff; arrays/scalars/type transitions atomic; unchanged
     objects produce zero changes (never a whole-copy snapshot).
   - Added keys: `{path, existed:false}` (no value). Deleted/changed:
     `{path, existed:true, value:old}`.
   - Own-property-safe, deterministic; `__proto__`/`constructor`/`prototype`
     are literal data — own checks + `Object.defineProperty` writes.
   - If on-disk bytes !== `oldText` for a subtree candidate → structured
     `backup-stale-plan` error before writing that target's payload (never
     silently byte-fallback).
   - Non-JSON files, deletions, sentinels (`created`, `preexisting-dir`)
     keep byte behavior. Absent `kind` = legacy bytes; unknown kinds refuse
     before any mutation.
2. Rollback Pass1 (existing two-pass shape) must read+sha1-verify ALL backups
   AND validate ALL subtree payloads AND compute restored buffers before
   Pass2 mutates:
   - Parse current target as JSON object; missing/unparseable/array/scalar
     root aborts whole rollback.
   - Each change path requires existing plain-object parents; missing/
     non-object parent refuses (no overwriting user-changed ancestors).
   - Leaf: `existed:true` → restore old value; `existed:false` → delete own
     prop. Unrelated current keys untouched. Arrays atomic.
   - Serialize `JSON.stringify(current,null,2)+'\n'` honoring recorded
     `eol` (LF/CRLF). Legacy bytes keep `normalizeEol` path.
   - Duplicate target entries involving a subtree fail closed in Pass1.
   - Unknown version / malformed changes / inconsistent existed+value /
     empty-duplicate-overlapping paths abort before writes.
   - Same-leaf drift: intentionally reverts managed paths WITHOUT detecting
     same-path edits (no post-image hash stored; documented, no invented
     warnings).
   - sha1 is integrity, not auth. No target contents/secrets logged.
3. Confidentiality: unrelated env credentials are not copied into backups.
   Old values of actually-mutated keys remain necessary for fidelity.
   Old snapshots remain sensitive; no auto-deletion or rotation.

## Tasks

- [x] T1 red: extend `tests/unit/installers-lib-backup.test.ts` — subtree
      emit, scope (secret absent, unchanged keys absent), add/delete/scalar/
      array/type-transition/no-op cases, stale-plan refuse, dangerous literal
      keys; existing byte+sentinel tests stay green.
- [x] T2 red: extend `tests/unit/cli-rollback.test.ts` — subtree restore
      preserves untouched keys + user-added secret, removes added path,
      restores deleted path, CRLF serialization, `__proto__` literal safety;
      all Pass1 aborts (bad checksum, bad version/kind, malformed/dup/
      overlap paths, invalid current JSON, missing/scalar parent, duplicate
      target) exit nonzero with ZERO writes/unlinks/rm.
- [x] T3 red: new real-fs `tests/unit/backup-rollback-json-roundtrip.test.ts`
      — backup → mutate → rollback roundtrip via public seams
      (`backup()` + `registerRollback`) with `HARNESSED_ROOT_OVERRIDE` tmpdir,
      fake secrets only.
- [x] T4 impl: `src/installers/lib/jsonSubtree.ts` (pure helpers: parse,
      diff, validate payload, apply changes, own-prop-safe set/delete).
- [x] T5 impl: `backup.ts` `kind?: 'bytes'|'json-subtree'` + subtree emit +
      stale-plan refuse.
- [x] T6 impl: `cli/rollback.ts` shared entry types + Pass1 subtree
      validation/buffer computation + Pass2 unchanged write path.
- [x] T7 gates: vitest narrow files, `biome check --write` changed paths,
      `corepack pnpm typecheck`. Evidence under phase dir `evidence/`.

## Out of scope

- No manifest contract changes, no `src/cli/facts.ts`, no auto-deletion or
  rotation of old backups, no post-image hash.
- Full-suite gate completed — see `VERIFICATION.md` (5697 pass / 0 fail).
