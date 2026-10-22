<!-- harnessed:host-map:start -->
## Host map — codex

harnessed rendered this artifact for the **codex** harness and installed it under `~/.agents/skills`. The workflow prose was authored against Claude Code, so where a step names a tool it names the codex one. Use the table to decode any instruction that still reads as Claude-Code-shaped; do not substitute the Claude Code names back.

| primitive | Claude Code | codex |
| --- | --- | --- |
| `ask_user` | `AskUserQuestion` | `request_user_input` |
| `name` | `Claude Code` | `Codex` |
| `native` | `CC-native` | `codex-native` |
| `planning_command` | `/plan` | `$planning-with-files` |
| `send_message` | `SendMessage` | `send_input` |
| `skills_dir` | `~/.claude/skills` | `~/.agents/skills` |
| `spawn_subagent` | `Task / Agent tool` | `spawn_agent tool` |
| `team` | `Agent Teams` | a multi-agent formation (repeated `spawn_agent`) |
| `teammate` | `teammate` | `agent` |

Caveats — these hold for the whole artifact:

- `request_user_input` — TODO(未验证): the tool exists upstream (`codex-rs/core/src/tools/handlers/request_user_input{,_spec}.rs`), but whether it is enabled on this install was not measured. The `default_mode_request_user_input` entry in `codex features list` is a mode flag, not the tool's own switch. If a clarification round-trip is unavailable, do not guess — stop and report `STATUS: NEEDS_CLARIFICATION` with the questions.
- Codex user-skill mappings — load `planning-with-files` from `~/.agents/skills/planning-with-files/SKILL.md` and invoke `$planning-with-files`; load `ui-ux-pro-max` from `~/.agents/skills/ui-ux-pro-max/SKILL.md` and invoke `$ui-ux-pro-max`. Keep the same planning outputs: `task_plan.md`, `progress.md`, and `findings.md`. On this host, interpret legacy planning-with-files `/plan` references and Claude Code plugin requirements for these two components through their Codex user-skill mappings; never invoke harnessed's `/plan` master for planning-with-files, which would recurse.
- Unsupported Claude Code plugin components — `code-review` and `code-simplifier` have no declared Codex install mapping and remain unavailable on this host. Record the skip rather than substituting an equivalent.
- codex agent lifecycle — session scope, automatic reclamation on session exit, and whether an agent may spawn another are ALL unmeasured. Nothing in this artifact asserts them. Close every agent you spawn with `close_agent` explicitly rather than relying on any cleanup you have not observed.
<!-- harnessed:host-map:end -->