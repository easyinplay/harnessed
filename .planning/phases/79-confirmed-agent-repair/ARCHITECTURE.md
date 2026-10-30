# Phase 79 Architecture: Confirmed Agent Repair

Status: implemented locally, not released.

## Goal

Allow a user-confirmed repair pass for deterministic third-party update failures
without weakening Phase 78 result semantics, host boundaries, provenance checks,
or trust policy.

## Flow

```text
harnessed update --all
  -> deterministic update result
  -> collect reviewed failed/unsupported/retained components
  -> show bounded repair proposal
  -> explicit confirmation for exact component ids
  -> claude -p or codex exec with shell disabled
  -> deterministic verifier check
  -> preserve original result + independent agentRepair summary
```

The default update path never starts an agent. `--repair` without explicit
authorization is denied. `--non-interactive` requires `--repair --yes`.

## Security Contract

- Repair scope is the intersection of the deterministic result and the fixed
  reviewed component allowlist.
- Authorization is bound to the sorted component ids and an issuance timestamp.
- `claude -p` and `codex exec` receive parameterized argv, `shell:false`, a
  bounded cwd, a filtered environment, an output cap, and a wall-clock timeout.
- The runner does not grant plugin or MCP trust, read credentials, expand host
  roots, or accept arbitrary manifest commands.
- Agent output is never success authority. Each repair ends with the existing
  deterministic verifier; the original component result remains unchanged.

## Result Contract

`UpdateResult.agentRepair` is optional and independent from `components`.
Possible statuses are `not-requested`, `not-authorized`, `deferred`, `failed`,
`verification-failed`, and `completed`. `completed` is meaningful only when
`verified=true`; the top-level deterministic status is not rewritten.
