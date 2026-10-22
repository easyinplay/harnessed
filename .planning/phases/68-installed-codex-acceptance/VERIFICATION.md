# Installed Codex Acceptance

Date: 2026-10-23 (Asia/Shanghai)

## Scope and boundaries
- Real installed standalone harnessed.exe 4.49.1 and codex-cli 0.163.0 on Windows.
- Preserved standalone installation channel; retained 4.43.0 rollback backup.
- Existing skill contents were backed up by setup before replacement. Acceptance scripts did not read or manually back up credential-bearing files; configuration writes used the official CLI/installers.
- Source fixes in this phase are a development snapshot, not a newly published version or a silent replacement of the installed binary.

## Installed dependencies
| Component | Evidence | Result |
|---|---|---|
| harnessed | PATH --version = 4.49.1 | PASS |
| workflow skills | 29/29 install-time hashes match | PASS |
| agent roles | 20 harnessed role files generated | PRESENT |
| first-party hooks | Three installed, enabled and trusted | PASS |
| superpowers | superpowers@openai-api-curated installed/enabled | REGISTERED |
| GSD | Reinstalled official 1.18.0; 72/72 readable shared skills; runtime-identity returns 1.18.0 | PASS structural/CLI checks |
| ctx7 | 0.8.1; real library query returned results | PASS |
| mattpocock-skills | 22/22 declared skill files readable | PASS structural checks |
| ui-ux-pro-max | Installed search.py returned products.csv results | PASS helper check |
| planning-with-files | SKILL.md and scripts readable; capability/source mapping repaired separately | PRESENT |
| design-taste-frontend | Declared skill file readable | PRESENT |
| playwright-test | playwright-cli skill readable; executable not on PATH | SKILL ONLY; browser runtime unverified |
| Tavily MCP | Registered/enabled; initialization, tools/list, and a real SDK search succeeded | SERVER PASS; Codex headless call requires approval |
| Exa MCP | Registered/enabled; initialization and tools/list succeeded; real web_search_exa returned 401 | BLOCKED: EXA_API_KEY authentication |
| gstack | New Codex setup failed at staged Windows directory rename; old installation remains | PARTIAL; not accepted as complete |

## Real behavior checks
- Command: node scripts/codex-live/installed-acceptance.mjs
- Exit 0, RESULT PASS 5/5; report: ee12e278-c437-4a60-88b5-d19534c56a79/report.json.
- Fresh model turn returned a random injected next sentinel absent from the user prompt, with zero model tool calls.
- Invalid completion promise exited 1 and retained pending state. Valid promise exited 0 and completed the scratch workflow.
- Successful completion recorded none_declared evidence, not verified artifacts.
- The installed doc gate denied a 101-line STATE and passed a non-commit control.
- Fresh model turn completed spawn/wait/close requested as harnessed-task-code. Exact role name is not exposed in Codex JSON events; role identity is not independently asserted.
- Additional real-host negative test: Codex attempted git commit once in a scratch repo; PreToolUse blocked it with state-digest-line-limit, and git rev-parse confirmed no commit was created.
- Installed gates task with explicit single-command facts skipped clarify/test and fired code/deliver as expected; installed prompt contains Language and no unresolved template.

## Defects fixed in source
- Host-aware update/rollback/npm restart messages.
- Codex MCP registration is authoritative; no Claude fallback for missing Codex servers.
- Skill-pack indicators require readable SKILL.md files, not empty directories.
- GSD Codex verification accepts current shared and legacy Codex layouts.
- Base-install failures produce setup exit 1 after all recovery/tail work.
- Codex missing-key setup hints no longer refer to Claude JSON settings.
- planning-with-files/ui-ux-pro-max presence and commands follow their existing Codex skill installation contract.
- Codex skill invocation uses `$planning-with-files` / `$ui-ux-pro-max`; the Claude commands remain unchanged.

## Remaining limitations
- Exa search returned 401 requiring EXA_API_KEY. Configure it locally before repeating that search acceptance. No keys were copied from another harness or printed.
- Tavily SDK search returned results despite no TAVILY_API_KEY in this process env. Its credential source was not investigated. The probe now reports keys not visible to this check rather than asserting all queries must fail.
- Codex app-server mcpServerStatus/list saw both servers and tools with toolsError=null. A fresh headless Tavily call was blocked by approval policy never: MCP tool call requires approval, but approval policy is never. No approval or sandbox settings were disabled.
- gstack upstream Windows installation remains partial; no ACL changes or user-skill deletion were used to hide the failure.
- GSD upstream installer warns of 80 remaining .claude references in 42 assets; this was not represented as full GSD workflow acceptance.
- Codex warns that disable_response_storage is unrecognized. User configuration was not automatically edited to suppress it.
- The existing source-only Codex fixes require a future release before the installed binary includes them.

## Source regression verification
- Full suite: 344 files passed / three skipped; 3567 tests passed / five skipped / one todo.
- build, lint, build:schema, workflow schema, host-primitives gate, skill i18n parity, and production eval 14/14 passed.
- Lint retains 17 baseline warnings, with no errors.
- Claude rendering golden files were not changed; Codex-only golden changes encode explicit skill mappings.
