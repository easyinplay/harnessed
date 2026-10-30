# Phase 79 Findings

- Phase 78 already exposes structured component statuses, so repair can be
  fail-closed without parsing installer logs.
- The deterministic result must remain the source of truth. Agent output only
  supplies an attempted repair and a request to rerun verification.
- `--repair --yes --json` is the stable headless contract for a workflow that
  has already obtained user confirmation. A bare `--repair` never executes an
  agent.
- Windows command resolution must reuse `planWindowsSpawn`; invoking a `.cmd`
  shim through an unescaped shell would recreate the command-injection issue
  fixed by Phase 78.
- MCP trust and credential handling remain outside Phase 79. A repair that
  needs either must stop and report the blocker.
