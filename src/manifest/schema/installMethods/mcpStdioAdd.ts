// install.method = mcp-stdio-add per ADR 0001 type×method matrix (mcp-npm only).
// Required: cmd, idempotent_check, npm_version.
// Note: cmd should invoke `claude mcp add --scope project ...` (R3.2),
// but schema only validates structure — actual cmd template is per-manifest.

import { Type } from '@sinclair/typebox'

export const McpStdioAdd = Type.Object(
  {
    method: Type.Literal('mcp-stdio-add'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    npm_version: Type.String({ minLength: 1 }),
    idempotent_check: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)
