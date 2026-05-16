// src/manifest/schema/known-good.v1.ts — Phase 3.3 W1 T1.3 (D-03 YAML manifest 13th surface).
// Sister Phase 3.2 W1 T1.3 (governance.ts) + sister T1.2 aliases.v1.ts shape.
// YAML manifest rejected JSON (项目未用 npm-lock + yaml convention) + Embed-in-
// manifest (跨 manifest agg 难, R7.6 "harnessed 版本冻结一组" scope mismatch).
// Manifest-domain colocation: src/manifest/schema/. install_method 字符串非 enum
// (Karpathy YAGNI 防 schema drift 加耦 — Phase 2.X 6 install method 可能继续扩;
// sister spec.ts InstallType union 仅作 doc reference 不强 link).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const PinnedUpstream = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    version: Type.String({ minLength: 1 }),
    install_method: Type.String({ minLength: 1 }), // npm-cli / mcp-stdio-add / etc per Phase 2.X
  },
  { additionalProperties: false },
)

export const KnownGoodV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.knownGood), // 'harnessed.known-good.v1'
    harnessed_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }), // semver strict
    e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), // ISO date pattern
    upstreams: Type.Array(PinnedUpstream),
  },
  { additionalProperties: false },
)

export type PinnedUpstreamType = Static<typeof PinnedUpstream>
export type KnownGoodV1Type = Static<typeof KnownGoodV1>
