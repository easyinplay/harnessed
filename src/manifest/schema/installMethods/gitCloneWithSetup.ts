// install.method = git-clone-with-setup per ADR 0001 type×method matrix.
// Required: cmd, idempotent_check, git_ref.

import { Type } from '@sinclair/typebox'

export const GitCloneWithSetup = Type.Object(
  {
    method: Type.Literal('git-clone-with-setup'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    git_ref: Type.String({ minLength: 1 }),
    idempotent_check: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)
