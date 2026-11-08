# Findings

- Upstream `open-gsd/gsd-core#1355` is CLOSED with the fix shipped in GSD
  1.18.0: background spawn plus explicit result collection from the agent
  output file, plus a read-only `teams-status` detector. The re-parenting
  behavior itself is a claude-code defect and is NOT fixed upstream.
- harnessed's SDK path (`harnessed run` -> Agent SDK `query()`) can never form a
  team, so it is structurally immune to #1355. The exposed surface is the
  CC-native slash-command path, where the MAIN session spawns and waits.
- harnessed's prose already says the right thing (`delivery_contract_note`: a
  named/background teammate's final message is discarded; write findings to a
  file or SendMessage them to the lead). What is missing is the deterministic
  half: a bounded, machine-checkable wait over that file. Prose alone is not a
  liveness guarantee.
- `harnessed gates` has no teams-status input: `parallelism.escalate_to_teams`
  is a pure function of the judgment gate plus the headless guard. On a
  machine with agent-teams ON (the default after `harnessed setup`), the
  orchestrator is told to escalate to teammate mode with no signal that the
  known claude-code re-parenting defect is active.
- `harnessed setup` auto-enables the agent-teams env key. That makes the
  exposure the DEFAULT state for every Claude Code user of harnessed, which is
  the opposite of what upstream GSD advises for its own workflows.
- GSD 1.18.0's own guard (`resolveTeamsStatus` + a stderr warning before the
  first spawn) is the exact precedent: a read-only, pure, env-injected probe
  plus one warning surface, with zero behavior change when the flag is off.
- Claude Code was consulted twice, on two model tiers of the same endpoint. The
  flash-mapped tier said "(c) both, (a) load-bearing, (b) defense-in-depth".
  The default tier (glm-5.3) picked "(a)" and rejected (b) explicitly: the
  completion truth source must move to an artifact the orchestrator owns
  (bounded wait; timeout degrades into the existing checkpoint/fail path), the
  notification is demoted to a fast-path wake-up, and the teams-status probe is
  cheap defense-in-depth. Its reason for rejecting (b) matches the shipped
  scoping exactly: setup auto-enables the env key, so "refuse teammate mode
  while agent-teams is on" is permanently true, makes teammate escalation
  unreachable on every default install (SendMessage, shared task list,
  multi-specialist teams all lost), and fixes no robustness.
- Cost of (b): the 4-specialist Pattern C team (`verify-multispec`) and any
  SendMessage-based cross-questioning flow depend on real teammates. Disabling
  teammate mode therefore disables that capability, so (b) must be a
  fail-closed, explicit, reversible decision rather than a silent downgrade.
- The literal (b) as Claude Code phrased it (never escalate to teammate mode
  while agent-teams is on) would disable the shipped Pattern C team on every
  machine, because `harnessed setup` auto-enables the env key. The shipped
  scoping keeps the capability and removes the HANG instead: team escalation is
  refused when the capability is absent, and when it is present the completion
  signal is the result file with a bounded wait, so a mis-routed notification
  can no longer stall the orchestrator. This is recorded as a deliberate
  deviation from the literal wording, with the reason.
- The re-render of the SKILL invoke sections exposed a pre-existing drift:
  `workflows/auto/SKILL.md` carried a hand-edited nested-ledger clause that the
  builder never had. Folding it back into the builder (instead of letting the
  marker bump silently delete it) is the script's own SoT discipline.
- `docs/host-contract.md` §4.3 measures cell lengths in UTF-8 BYTES, not
  characters: all 23 rows match the byte reading and 18 of them differ from the
  character reading. The table was resynced on the byte convention.
