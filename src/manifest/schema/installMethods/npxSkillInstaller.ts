// install.method = npx-skill-installer per ADR 0001 type×method matrix.
// Required: cmd, idempotent_check, npm_version.

import { Type } from '@sinclair/typebox'

export const NpxSkillInstaller = Type.Object(
  {
    method: Type.Literal('npx-skill-installer'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    npm_version: Type.String({ minLength: 1 }),
    idempotent_check: Type.String({ minLength: 1 }),
    // 4.23.0 (issue #3 req 5) — skill names this pack copies into the flat
    // ~/.claude/skills namespace; enables pre-install collision warnings against
    // shipped workflow names + post-install undeclared-name drift detection.
    installs_skills: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  },
  { additionalProperties: false },
)
