// Phase 5.2 W1 T1.2 — uninstaller dispatch table.
// Sister: src/installers/index.ts symmetric pattern.
// D-01 LOCKED: per-method 7 files (no levelOf() — uninstall has no L4 --system gate).

import { uninstallCcHookAdd } from './ccHookAdd.js'
import { uninstallCcPluginMarketplace } from './ccPluginMarketplace.js'
import { uninstallGitCloneWithSetup } from './gitCloneWithSetup.js'
import type { Manifest, Uninstaller, UninstallOpts, UninstallResult } from './lib/types.js'
import { uninstallMcpHttpAdd } from './mcpHttpAdd.js'
import { uninstallMcpStdioAdd } from './mcpStdioAdd.js'
import { uninstallNpmCli } from './npmCli.js'
import { uninstallNpxSkillInstaller } from './npxSkillInstaller.js'

export const uninstallers: Record<Manifest['spec']['install']['method'], Uninstaller> = {
  'npm-cli': uninstallNpmCli,
  'mcp-stdio-add': uninstallMcpStdioAdd,
  'mcp-http-add': uninstallMcpHttpAdd,
  'cc-plugin-marketplace': uninstallCcPluginMarketplace,
  'git-clone-with-setup': uninstallGitCloneWithSetup,
  'npx-skill-installer': uninstallNpxSkillInstaller,
  'cc-hook-add': uninstallCcHookAdd,
}

export async function runUninstall(
  manifest: Manifest,
  opts: UninstallOpts,
): Promise<UninstallResult> {
  const uninstaller = uninstallers[manifest.spec.install.method]
  return uninstaller({ manifest, opts, cwd: process.cwd() })
}
