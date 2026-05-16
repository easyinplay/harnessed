// install.method = cc-hook-add per ADR 0001 type×method matrix + Phase 2.4 W3 T3.1 (D-04 § 3.1).
//
// IMPL NOTE (Phase 2.4 W3 / R2.4.4): Claude Code SessionStart / UserPromptSubmit /
// PreToolUse / PostToolUse hooks are configured in ~/.claude/settings.json under
// `hooks.<event>[].{matcher, command}` shape. This install method lets a manifest
// register a hook entry idempotently. The hook_command is the bash invocation the
// user wants run on that lifecycle event (e.g. `node scripts/dashboard.mjs --no-open`
// to auto-spawn the dashboard on session start).
//
// Sister: npxSkillInstaller schema (~17L) — same minimal TypeBox shape, no exotic
// fields. `idempotent_check` reused from the 6 sister install methods (preflight
// invariant per src/installers/lib/preflight.ts contract).

import { Type } from '@sinclair/typebox'

const HookEvent = Type.Union([
  Type.Literal('SessionStart'),
  Type.Literal('UserPromptSubmit'),
  Type.Literal('PreToolUse'),
  Type.Literal('PostToolUse'),
])

export const CcHookAdd = Type.Object(
  {
    method: Type.Literal('cc-hook-add'),
    cmd: Type.String({ minLength: 1 }), // audit-trail (the bash invocation registered)
    // cwd/env required by lib/spawn.ts discriminated-union access (sister 6 method
    // shape parity — even though cc-hook-add does not spawn, generic spawn helper
    // expects these fields on the install union).
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    hook_event: HookEvent,
    hook_matcher: Type.Optional(Type.String()),
    hook_command: Type.String({ minLength: 1 }),
    idempotent_check: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)
