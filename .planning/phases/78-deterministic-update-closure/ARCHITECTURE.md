# Phase 78 Architecture: Deterministic Update Closure

Date: 2026-10-29. Status: locked. Phase 79 owns agent repair.

## Goal

Deliver a trustworthy update loop for harnessed and reviewed third-party components:

1. `/harnessed-update` gives Claude Code and Codex one interactive entry point.
2. `harnessed update --all --json` is the deterministic execution source of truth.
3. self-update hands off from the old runtime to a verified new runtime before touching assets or third parties.
4. SessionStart shows a fail-soft cached reminder and never performs foreground network or mutation.
5. unsupported or unproven components are reported honestly; Phase 78 never lets an agent bypass ownership or trust boundaries.

## Non-Goals

- No agent SDK, `claude -p`, `codex exec`, or autonomous repair in Phase 78.
- No generic manifest `spec.update` and no arbitrary shell update command.
- No installation of missing third-party components.
- No automatic trust, credential reads, manifest rewriting, or cross-component transaction claim.
- No inference of an update command from `spec.install.cmd`.

## Runtime Boundary

```text
/harnessed-update
  -> harnessed update --all --json
       -> P1: capture host/channel/request and perform self-update
       -> absolute-path P2: verify continuation + executable identity
            -> refresh harnessed-owned workflow/hook artifacts
            -> inspect reviewed component adapters
            -> apply supported updates
            -> deterministic verify
            -> one structured result envelope

SessionStart hook
  -> bounded cache read
  -> emit reminder only when cached state is behind
  -> if stale/missing, spawn detached refresh worker and exit 0
```

P1 must not continue importing old package modules or reading old bundled assets after replacement. P2 is launched through the verified absolute executable or package entry path, never a bare `harnessed` PATH lookup. If self-update fails, third-party mutation does not start. If handoff fails after self-update, the result states that harnessed changed but closure did not complete.

P1 acquires an update lock keyed by the resolved executable/package target before checking or replacing it and holds that lock while P2 runs. P2 accepts only a one-time continuation nonce created by P1 and does not independently compete for the lock. A second updater fails or reports busy before mutation. Stale lock recovery is bounded and tested; validation and execution therefore refer to the same serialized target.

## Update Contracts

Phase 78 uses a code-owned typed registry rather than a new manifest schema. The registry matches a concrete component identity, host, effective manifest declaration, installed evidence, and allowed write target.

```ts
interface UpdateAdapter {
  inspect(plan, deps): Promise<Observation>
  planUpdate(plan, observation): Promise<SupportedAction | UnsupportedAction>
  applyUpdate(action, deps): Promise<ComponentResult>
}
```

`Observation` is `known | opaque | unknown`. A known observation records scheme, value, evidence and observation time. Network failure is unknown, not current. A cached action is never executable authority; the adapter revalidates source identity and target immediately before mutation.

The first reviewed adapter is GSD because it exposes runtime identity (`packageName`, installed version and host runtime), has an upstream-owned deterministic installer, and supports both Claude Code and Codex. The adapter must verify the installed package identity before updating and rerun the runtime identity verifier afterward. Other base components remain unsupported until a separate adapter proves their ownership and version semantics.

## Result Contract

`update --json` writes exactly one JSON object to stdout. Diagnostics and child process output go to stderr. The envelope fields are `schemaVersion`, `operation`, `mode`, `host`, `runtime`, `status`, `components`, `warnings`, and `error`.

Component fields: `id`, `status`, `before`, `target`, `after`, `reasonCode`, `verified`, `restartRequired`. Status values: `current`, `updated`, `planned`, `unsupported`, `failed`, `retained`, `not-installed`. `retained` means the refresh failed but the previous installation still verifies; it is not an update success.

Exit codes: `0` only for a completed requested operation without failed components, `1` for failed or incomplete execution, `2` for invalid arguments/protocol. An unsupported component produces top-level `partial`, not an all-success result.

## Reminder Data Flow

The reminder is installed by default. `setup --no-update-reminder` persists an opt-out under harnessed-owned state; later setup/update runs must preserve it.

The foreground hook reads a size-bounded versioned cache only, performs no network or mutation, emits nothing for current/ahead/unknown/corrupt/disabled state, exits `0` on every failure, and may start a detached refresh worker when cache is missing or stale.

The worker uses a 24-hour TTL, retry backoff, atomic temporary-file rename and a single-flight lock. Cache identity includes host, runtime/channel, source and observation fingerprint. Cache contents are advisory and never authorize mutation.

Claude installs the SessionStart hook through the existing settings merge. Codex installs the first-party local plugin and reports `trustPending` instead of granting trust. The update reminder uses its own hook identity so it cannot overwrite the existing inject-state invalidation hook.

## Early Hook Entry

The compiled binary currently extracts bundled assets before normal CLI dispatch, and the normal CLI may run migrations. The reminder cannot use that path because its foreground contract is zero mutation and exit `0` on every failure.

Phase 78 adds a pre-assets internal hook dispatch in the compiled entry. It recognizes only the fixed update-reminder hook operation and transfers control to a dependency-light entrypoint before asset extraction, migration, command registration or network-capable imports. npm/Bun packages continue to invoke the generated standalone hook bin directly. Tests cover missing/unwritable asset roots and prove the hook still exits `0` without creating files.

## Security Invariants

- Capture one `HostInstallContext` and carry it through P1, P2, adapters and verification.
- Do not install missing third parties or mutate another host root.
- Do not overwrite MCP registrations, user-authored skills, custom commands or unproven shared directories.
- Keep existing signature, hash, backup and provenance refusals intact.
- Spawn parameterized executables with bounded cwd/env/timeouts and process-tree cleanup.
- Serialize P1/P2 with an executable-target update lock and one-time continuation nonce.
- The reminder never waits on the update lock; update and cache locks are independent.
- CI, non-interactive and headless paths contain no agent invocation.

## Phase 79 Seam

Phase 78 records structured deterministic failure evidence. Phase 79 may consume it through a `RepairRequest -> RepairProposal` interface. Phase 79 cannot rewrite Phase 78 results, expand privileges implicitly, or declare success. Every repair ends by rerunning the deterministic verifier.

## Release Blockers

- Prove one real positive third-party update path, selected as GSD.
- Prove Windows compiled P1 to absolute-path P2 continuation.
- Prove Claude SessionStart reminder output and Codex local-plugin trust/output behavior.
- Prove foreground reminder makes zero network calls and remains silent/fail-soft offline.
- Prove unsupported and retained states are not reported as updated.
