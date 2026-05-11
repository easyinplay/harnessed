// install.method discriminated union per ADR 0001 type×method matrix.
// Uses TypeBox Type.Union with Ajv discriminator option (set on validator side).
// 6 methods: cc-plugin-marketplace, git-clone-with-setup, npx-skill-installer,
//            npm-cli, mcp-stdio-add, mcp-http-add.

import { Type } from '@sinclair/typebox'
import { CcPluginMarketplace } from './ccPluginMarketplace.js'
import { GitCloneWithSetup } from './gitCloneWithSetup.js'
import { McpHttpAdd } from './mcpHttpAdd.js'
import { McpStdioAdd } from './mcpStdioAdd.js'
import { NpmCli } from './npmCli.js'
import { NpxSkillInstaller } from './npxSkillInstaller.js'

export const InstallSchema = Type.Union(
  [
    CcPluginMarketplace,
    GitCloneWithSetup,
    NpxSkillInstaller,
    NpmCli,
    McpStdioAdd,
    McpHttpAdd,
  ],
  { discriminator: { propertyName: 'method' } },
)
