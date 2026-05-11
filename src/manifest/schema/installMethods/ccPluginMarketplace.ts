// install.method = cc-plugin-marketplace per ADR 0001 type×method matrix.
// Required: cmd, idempotent_check, git_ref.

import { Type } from '@sinclair/typebox'

export const CcPluginMarketplace = Type.Object(
  {
    method: Type.Literal('cc-plugin-marketplace'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    git_ref: Type.String({ minLength: 1 }),
    idempotent_check: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)
