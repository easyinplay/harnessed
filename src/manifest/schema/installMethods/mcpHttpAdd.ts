// install.method = mcp-http-add per ADR 0001 type×method matrix (mcp-npm only).
// Required: cmd, idempotent_check, npm_version.

import { Type } from '@sinclair/typebox'

export const McpHttpAdd = Type.Object(
  {
    method: Type.Literal('mcp-http-add'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    npm_version: Type.String({ minLength: 1 }),
    idempotent_check: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)
