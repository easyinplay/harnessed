// install.method discriminated union per ADR 0001 type×method matrix.
// 6 methods: cc-plugin-marketplace, git-clone-with-setup, npx-skill-installer,
//            npm-cli, mcp-stdio-add, mcp-http-add.
//
// IMPL NOTE (Rule 1 / F8): TypeBox's Type.Union(..., { discriminator })
// emits `anyOf` + lacks `type: "object"` + `required: ["method"]`, but Ajv
// `discriminator: true` strict mode requires `oneOf` + `type: "object"` +
// `required: ["method"]`. We hand-build the discriminator-compatible shape
// here so Ajv accepts it. The inferred TypeScript type still tracks via
// Static<>; Ajv accepts hand-rolled JSON Schema objects with no DX cost.

import { type Static, Type } from '@sinclair/typebox'
import { CcPluginMarketplace } from './ccPluginMarketplace.js'
import { GitCloneWithSetup } from './gitCloneWithSetup.js'
import { McpHttpAdd } from './mcpHttpAdd.js'
import { McpStdioAdd } from './mcpStdioAdd.js'
import { NpmCli } from './npmCli.js'
import { NpxSkillInstaller } from './npxSkillInstaller.js'

const branches = [
  CcPluginMarketplace,
  GitCloneWithSetup,
  NpxSkillInstaller,
  NpmCli,
  McpStdioAdd,
  McpHttpAdd,
] as const

// Hand-built JSON Schema that Ajv `discriminator: true` strict mode accepts.
// Strict mode also requires `properties.method` declared at the discriminator
// level (else `strictRequired` complains that `method` is required but undefined
// at this object scope). Per-branch `additionalProperties: false` is preserved
// (each TypeBox object already sets it).
export const InstallSchema = {
  type: 'object',
  discriminator: { propertyName: 'method' },
  required: ['method'],
  properties: {
    method: { type: 'string' },
  },
  oneOf: branches as unknown as object[],
} as const

// Re-derive the TS type via TypeBox's regular Union (this is unused at runtime
// but gives downstream consumers a typed `Manifest['spec']['install']`).
const InstallUnion = Type.Union([...branches])
export type Install = Static<typeof InstallUnion>
