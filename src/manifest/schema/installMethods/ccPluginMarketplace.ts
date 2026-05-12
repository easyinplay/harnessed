// install.method = cc-plugin-marketplace per ADR 0001 type×method matrix.
// Required: cmd, idempotent_check, git_ref.
//
// Phase 1.1.1 hotfix M1 — git_ref pattern enforces SHA (7-40 hex) or SemVer
// tag, rejecting branch names like HEAD/main/master that would silently
// drift. ADR 0001 § "版本锁哲学" requires reproducible installs.
//
// Phase 1.2 ADR 0005 errata — `marketplace_source` optional field for
// third-party marketplaces (e.g. OthmanAdi/planning-with-files which is NOT
// in claude-plugins-official). v0.1 only `source: github`. Official upstream
// can omit; phase 2.1 cc-plugin-marketplace installer will consume this
// field structurally instead of parsing the cmd string.

import { Type } from '@sinclair/typebox'

const GIT_REF_PATTERN = '^([a-f0-9]{7,40}|v?\\d+\\.\\d+\\.\\d+([.-][\\w.-]+)?)$'
const REPO_PATTERN = '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'

export const CcPluginMarketplace = Type.Object(
  {
    method: Type.Literal('cc-plugin-marketplace'),
    cmd: Type.String({ minLength: 1 }),
    cwd: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(Type.String(), Type.String())),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    git_ref: Type.String({ minLength: 1, pattern: GIT_REF_PATTERN }),
    idempotent_check: Type.String({ minLength: 1 }),
    // ADR 0005 — third-party marketplace structured metadata (optional).
    marketplace_source: Type.Optional(
      Type.Object(
        {
          source: Type.Literal('github'),
          repo: Type.String({ pattern: REPO_PATTERN, minLength: 3 }),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
)
