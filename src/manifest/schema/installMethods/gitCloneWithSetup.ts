// install.method = git-clone-with-setup per ADR 0001 type×method matrix.
// Required: cmd, idempotent_check, git_ref.
//
// Phase 1.1.1 hotfix M1 — git_ref pattern enforces SHA (7-40 hex) or SemVer
// tag, rejecting branch names like HEAD/main/master that would silently
// drift. ADR 0001 § "版本锁哲学" requires reproducible installs.

import { Type } from '@sinclair/typebox'

const GIT_REF_PATTERN = '^([a-f0-9]{7,40}|v?\\d+\\.\\d+\\.\\d+([.-][\\w.-]+)?)$'

export const GitCloneWithSetup = Type.Object(
  {
    method: Type.Literal('git-clone-with-setup'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    git_ref: Type.String({ minLength: 1, pattern: GIT_REF_PATTERN }),
    idempotent_check: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)
