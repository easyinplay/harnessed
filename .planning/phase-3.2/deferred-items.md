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
