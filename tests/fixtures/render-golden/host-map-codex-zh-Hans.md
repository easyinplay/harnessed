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
| `team` | `Agent Teams` | 多 agent 编队(多次 `spawn_agent`) |
| `teammate` | `teammate` | `agent` |

Caveats — these hold for the whole artifact:

- `request_user_input` —— TODO(未验证):该工具在上游确实存在(`codex-rs/core/src/tools/handlers/request_user_input{,_spec}.rs`),但**本机是否默认启用未实测**。`codex features list` 里的 `default_mode_request_user_input` 是某个模式的 flag,不是该工具自身的开关。若澄清 round-trip 不可用,**不要猜** —— 停下并输出 `STATUS: NEEDS_CLARIFICATION` + 问题列表。
- Codex user-skill 映射:从 `~/.agents/skills/planning-with-files/SKILL.md` 读取 `planning-with-files`,调用 `$planning-with-files`;从 `~/.agents/skills/ui-ux-pro-max/SKILL.md` 读取 `ui-ux-pro-max`,调用 `$ui-ux-pro-max`。规划产物保持相同:`task_plan.md`、`progress.md`、`findings.md`。本宿主上,旧正文中 planning-with-files `/plan` 的引用和这两项组件的 Claude Code plugin 要求均按其 Codex user-skill 映射解释;绝不能为 planning-with-files 调用 harnessed 的 `/plan` master,否则会递归。
- 仍 unsupported 的 Claude Code plugin 组件:`code-review` 和 `code-simplifier` 没有声明 Codex 安装映射,在本宿主上仍不可用。请记录 skip,不要自行找等价物替代。
- codex agent 生命周期 —— 是否 session-scoped、session 退出是否自动回收、能否嵌套 spawn,**三者全部未实测**。本产物不对它们作任何断言。请对每个 spawn 出来的 agent **显式**调 `close_agent`,不要依赖任何你没有亲自观察过的清理行为。
<!-- harnessed:host-map:end -->