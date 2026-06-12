# G4 — per-turn workflow-state injection hook

> Manual wiring for the `harnessed-inject-state` breadcrumb hook. (Auto-install via
> `harnessed setup` is a deferred follow-up — harnessed has no self-hook-install flow yet.)

## What it does

`harnessed-inject-state` reads the active workflow state
(`<harnessed-root>/current-workflow.json`, default `~/.claude/harnessed/`) and prints a
`<workflow-state>` breadcrumb:

```
<workflow-state>
phase: task
status: active
next: task-test
BREAK-LOOP: sub 'task-code' failed 3x — stop retrying, run break-loop skill
</workflow-state>
```

Wired as a Claude Code `UserPromptSubmit` hook, this re-injects the current phase, status,
next pending sub, and any loop warnings on every prompt — so the main session never loses
track of where the workflow is after context compaction (the G4 gap borrowed from Trellis
`inject-workflow-state.py`).

When there is no active workflow (or the state file is missing/corrupt), it prints nothing
and exits 0 — silent no-op, mirrors the `readCurrentWorkflow` fail-soft posture.

## Install the binary

Shipped as a `bin` entry in the harnessed package:

```
npm i -g harnessed   # puts `harnessed-inject-state` on PATH
```

## Wire the hook

Add to `~/.claude/settings.json` (global) or `./.claude/settings.json` (project):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "matcher": "", "command": "harnessed-inject-state" }
    ]
  }
}
```

`matcher: ""` runs it on every prompt. The command is the global binary; for a local-only
install, use the absolute path: `node /abs/path/to/bin/harnessed-inject-state.mjs`.

## Test isolation

The entrypoint honors `HARNESSED_ROOT_OVERRIDE` (same as the rest of the state machine), so
tests point it at a temp dir without touching the real `~/.claude/harnessed/`.
