# Phase 3.2 Deferred Items

## #2 — tests/scripts/dashboard-sse.test.ts 4 fixture failures (PRE-EXISTING, port-bound env-dep flaky)

- **Discovered during**: Phase 3.2 W1 T1.8 post-fix full suite verify (2026-05-17)
- **Investigation**: `git stash` + run on clean HEAD `eba6d5c` (pre-T1.8 uncommitted state with W1 T1.1-T1.4 + T1.5 + T1.6 in place) — same 1 file fail / 594 pass → **CONFIRMED PRE-EXISTING**, not caused by Phase 3.2 W1
- **File last modified**: commit `cf00d17` Phase 2.4 W3 T3.2 (dashboard SSE watcher + localhost-only bind, 2026-05-16)
- **Failure pattern**: 4 cells fail
  - cell 1 — `/events` returns SSE handshake `: connected`
  - cell 2 — STATE.md touch fires `event: state-changed` within 2s
  - cell 3 — debounce: 5 rapid touches within 500ms → only 1 event fires
  - cell 4 — B-27 localhost-only bind: 127.0.0.1 works (positive control)
- **Root cause hypothesis**: port-bound test env-dep (port may already be in use locally OR localhost firewall behavior on Win), sister Phase 3.1 `cli-audit env-dep` deferred class (post-Phase-3.1-ship CI red verified env-dependent)
- **Scope decision**: Out-of-scope per executor SCOPE BOUNDARY rule — NOT W1 caused, not Phase 3.2 W1 scope
- **Disposition**: defer to Phase 3.2 W3 (post-ship) OR dedicated `fix(dashboard-sse-test)` patch session
- **Fix path candidates**:
  - (a) Use random ephemeral port + retry helper (sister pattern Node net.createServer with port 0 → returns assigned)
  - (b) Mock the SSE server entirely (vi.mock node:http) — less integration depth but stable
  - (c) Skip dashboard-sse on Win pwsh (sister Phase 2.3 W0 perf gate "moved to nightly cron advisory" pattern)
- **Test count impact**: 594 pass / 1 fail file isolated post-T1.8; same baseline as pre-T1.8 (eba6d5c)
- **CI status**: dashboard-sse pass in CI Linux/macOS per pre-Phase-2.4-ship green runs; likely Win-only or local-env-only flaky

## #3 — tests/workflow/governance.test.ts fixture 3 fail (RESOLVED in W2 by [Rule 1] commit c37ee29)

**STATUS: RESOLVED 2026-05-17 (Phase 3.2 W2 T2.6 discovery → Rule 1 surgical fix)**

Original deferred entry below preserved for traceability. Resolution: commit `c37ee29` `fix(phase-3.2-w2): [Rule 1] governance.v1 vetoed_at format → pattern regex (TypeBox FormatRegistry unregistered)`.

---

- **Discovered during**: Phase 3.2 W2 T2.6 unit test post-write verify (2026-05-17)
- **Investigation**: `git checkout d989c8e` (T1.7 ship commit) `-- tests/workflow/governance.test.ts src/workflow/governance.ts src/workflow/schema/governance.ts` + run isolated → still fails (611 baseline excludes governance fixture 3 — actually 619 - 8 new T2.6 fixtures = 611 matches pre-W2 baseline; counted as passing in original 611 number which appears to have included this fail in the "1 fail file" tally)
- **Failure pattern**: 1 cell fails — fixture 3 "status=vetoed (full metadata) → readGovernance returns record + isVetoed true"; `g?.status` is undefined → `readGovernance` returns null when given full vetoed metadata with `vetoed_at` ISO + `vetoed_by` "CEO"
- **Root cause hypothesis**: TypeBox `format: 'date-time'` requires `FormatRegistry.Set('date-time', ...)` to validate; without registry, `Value.Check` may return false on the format-tagged string (or alternate: schemaVersion branching path miss). Either schema strictness defect OR test fixture schemaVersion mismatch.
- **Scope decision**: Out-of-scope per executor SCOPE BOUNDARY rule — NOT W2 caused (existed at T1.7 ship d989c8e). W2 D-04 PUSH integration uses isVetoed() which returns boolean; fixtures 1+2+4+5 all pass so the `vetoed status: 'vetoed'` happy path works for `isVetoed()` in W2 context.
- **Disposition**: defer to Phase 3.2 W3 OR dedicated `fix(governance-fixture-3)` patch session
- **Fix path candidates**:
  - (a) Register `date-time` format in TypeBox `FormatRegistry` (sister Phase 3.1 pattern if exists)
  - (b) Adjust schema to use `Type.String({ pattern: ISO_DATE_RE })` instead of `format: 'date-time'`
  - (c) Update fixture 3 to send schemaVersion exactly matching SCHEMA_VERSIONS.governance (if test was mis-matched)
- **W2 test count impact**: 619 pass / 1 fail (governance fixture 3) / 4 skipped — 8 new T2.6 unit fixtures all PASS (3 run.test.ts + 3 loadPhases-interpolate.test.ts + 2 planFeature.test.ts)
- **Why not Rule 1 auto-fix**: this is governance.ts schema/test interaction issue not directly caused by W2 changes; would expand W2 scope; deferring per SCOPE BOUNDARY
