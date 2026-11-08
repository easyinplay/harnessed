# Phase 86 — Agent Teams Safe Transport (Issue #19 follow-up / GSD #1355 fusion)

Status: COMPLETE

## Goal
Make harnessed's own multi-agent orchestration robust under claude-code
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`: the completion signal must never depend
solely on a bubbling completion notification, and team escalation must not be
the only liveness mechanism.

## Verified Facts (2026-11-08)
- Upstream `open-gsd/gsd-core#1355` is CLOSED. Root cause is claude-code-side:
  a named subagent can be re-parented under a live teammate, so its completion
  notification routes to the parent and never reaches the orchestrator.
- GSD 1.18.0 (installed locally) already ships the fix pattern: `run_in_background=true`
  plus explicit result collection from the agent output file (`gsd_stall_watch`
  marker detection), plus a read-only `teams-status` detector
  (`resolveTeamsStatus({runtime, env})`).
- harnessed `harnessed run` uses the Claude Agent SDK `query()` path, which never
  spawns teammates and is therefore not exposed to #1355.
- The exposed harnessed surface is the CC-native slash-command path: the MAIN
  Claude session drives `harnessed gates` -> `harnessed prompt` -> spawn ->
  `harnessed checkpoint complete --result-file <path>`.
- harnessed already states the file-based delivery contract in prose
  (`workflows/host-primitives.yaml` `delivery_contract_note`), but there is NO
  deterministic liveness/watchdog primitive: nothing polls the result file, and
  nothing bounds the wait.
- `harnessed gates` sets `parallelism.escalate_to_teams` from the judgment gate
  only. It never consults `checkAgentTeams()`, so a machine with agent-teams ON
  is not distinguished from one with it OFF.
- `harnessed setup` AUTO-ENABLES `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in
  `~/.claude/settings.json` (`enableAgentTeamsInSettings`). On this machine the
  flag is ON, so the #1355 exposure is live by default.
- Claude Code second opinions (two tiers of the same local endpoint, this
  session): the flash-mapped tier said "(c) both — (a) load-bearing, (b)
  defense-in-depth". The default tier (glm-5.3) said "(a)": every background
  agent result must be collected via bounded wait on a persisted artifact, the
  notification demoted to a fast-path wake-up, the teams-status probe is cheap
  defense-in-depth — and (b) must be REJECTED, because setup auto-enables the
  env key so refusing teammate mode while it is on would be permanently true,
  would make teammate escalation unreachable on every default install, and
  would fix no robustness.

## Phases
- [complete] Audit harnessed orchestration surface, GSD 1.18.0 upstream fix, and #1355
- [complete] Add deterministic teams-status surface + bounded result wait
- [complete] Make team escalation agent-teams-aware (fail-closed)
- [complete] Add regression tests
- [complete] Teach the orchestrator the result-file contract in both renderings
- [complete] Re-record claude goldens and sync the host-contract length table
- [complete] Full validation and closeout

## Owned Files
- `src/cli/gates.ts` (parallelism decision + teams awareness)
- `src/cli/lib/checkAgentTeams.ts` (read-only status surface)
- `src/cli/prompt.ts` (result-file contract in the spawn-ready prompt)
- `src/cli/checkpoint.ts` (bounded wait on the result file)
- `workflows/host-primitives.yaml` + `workflows/host-primitives.zh-Hans.yaml`
- `workflows/judgments/parallelism-gate.yaml`
- Focused tests for each touched surface

## Acceptance Criteria
- `harnessed gates` reports the real agent-teams status, and refuses to escalate
  to teammate mode when agent-teams is ON (defense-in-depth per Claude Code).
- A background/teammate sub's completion is provable from a persisted artifact
  (result file) with a bounded wait; a missing artifact yields a deterministic
  fail-closed outcome instead of an unbounded hang.
- The completion notification is a fast-path wake-up, never the sole evidence.
- The ordinary (non-teammate) subagent path keeps working unchanged.
- Focused tests, typecheck, Biome, schema/doc gates, and the full Vitest suite
  pass; unrelated failures are documented.

## Errors
- The local Claude Code endpoint WORKS with the pinned third-party models. The
  `[claude-code:unrecognized_model] {"model":"glm-5.3","query_source":"sdk"}`
  line on stderr is a WARNING, not a failure: the same invocation still answers
  (measured: default, `--model glm-5.3`, `--model opus` and `--model sonnet`
  all returned content). An earlier note in this phase mistook that warning
  for a hard failure and cut the calls off before the answer arrived; the
  endpoint needs 20-60 s, longer for a long question.
- `gh issue list`/`gh issue view` failed earlier with `Post "https://api.github.com/graphql": EOF`;
  `curl.exe` against the REST API worked.

## Clarification Resolution
- Fusion direction is INVERTED from the initial question. harnessed does not
  import GSD's multi-agent orchestrator (harnessed already has its own
  gates/prompt/checkpoint state machine, and GSD's orchestrator lives in an
  upstream skill). What is worth fusing is GSD's TRANSPORT pattern: background
  spawn + explicit artifact collection + bounded wait + read-only teams-status
  probe.
- Claude Code chose (c) both; this matches the fail-closed application trust
  model already used for ownership receipts.
