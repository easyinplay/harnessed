# Mode-B tool-call auto-recovery (Stop hook) — issue #6

Claude Code occasionally mis-samples the tool-call **opening delimiter** into a
random garbage word (observed: `count`, `court`, varies each time). When that
happens the whole `<invoke>…</invoke>` block is emitted as **plain assistant
text** — no tool runs, no error is raised, the turn just ends. The model gets no
failure signal and cannot self-recover; today the only fix is the user manually
typing "retry".

harnessed ships an opt-in **Stop hook** that auto-recovers this. It fires at every
turn end, reads the last assistant message from the transcript, and on detecting
the mode-B signature returns `{"decision":"block", …}` to hand the model one fresh
turn to re-emit the call as a real tool call — no user prompt needed.

## Install (recommended)

Run `harnessed setup` and accept the **Mode-B Tool-Call Auto-Recovery** optional
component. It writes the correct `Stop` hook entry into `~/.claude/settings.json`
(absolute path, correct shape) and self-heals a broken/old entry on re-run.

## Manual install (second machine, no harnessed setup)

Add this to `~/.claude/settings.json` under `hooks.Stop`. Replace
`<ABSOLUTE-PATH-TO>` with the real path to the installed `harnessed` package (find
it with `npm root -g` → `<that>/harnessed/bin/harnessed-stop-hook.mjs`), using
**forward slashes even on Windows** and keeping the quotes:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<ABSOLUTE-PATH-TO>/harnessed/bin/harnessed-stop-hook.mjs\""
          }
        ]
      }
    ]
  }
}
```

Compiled-binary users can instead point the command at the binary itself:
`"<ABSOLUTE-PATH-TO>/harnessed" stop-hook` (no host `node` needed).

## How it decides (detector)

The tags `<invoke name="` / `<parameter name="` only ever exist as a structured
`tool_use` block in normal operation, so their presence in an assistant message's
**text** content is the corruption signal. False-positive gates:

- the turn produced **no** structured `tool_use` block;
- both tags present after stripping fenced/inline **code** (so meta-discussion of
  the tags — like this doc — never matches);
- the last tag is **tail-anchored** (within 200 chars of the message end): real
  mode-B truncates at the tool call, while prose discussion keeps writing after.

Empirically (a real 12,104-turn transcript): 76/76 true positives, the single
false positive was self-referential prose about this very bug and is killed by the
tail-anchor gate.

## Loop guard & limits

- Respects `stop_hook_active` and caps auto-retries at **2** per
  (session, message-signature) — a persistently-corrupting turn can't loop.
- **Post-hoc, not prevention.** The hook auto-recovers *after* a wasted turn; it
  does not stop the mis-sample. Prevention is model-level — the corruption rate
  climbs with context size, so `/compact` or a fresh session remains the lever
  when the rate gets high.
- Fail-soft: any error or non-match exits 0 silently. A Stop hook must never wedge
  a normal turn end.

Related: the `~/.claude/CLAUDE.md` "工具调用 emission 规避" guidance is the
**prevention** side (assistant-behavior nudge); this hook is the **recovery** net
for the residual mode-B cases that slip through.
