// Phase 5.2 W1 T1.2 — uninstaller dispatch table.
// Sister: src/installers/index.ts symmetric pattern.
// D-01 LOCKED: per-method 7 files (no levelOf() — uninstall has no L4 --system gate).

import { uninstallCcHookAdd } from './ccHookAdd.js'
import { uninstallCcPluginMarketplace } from './ccPluginMarketplace.js'
import { uninstallGitCloneWithSetup } from './gitCloneWithSetup.js'
import { hasDeclaredUninstall, runDeclaredTeardown } from './lib/declaredTeardown.js'
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

/** C1 (issue #9) — methods whose per-method inverse reverse-engineers teardown
 *  from `spec.install` and gets it WRONG for real manifests: npm-cli misdetects
 *  `npx --yes … --global` as ephemeral and no-ops (gsd → 71 skill dirs left);
 *  git-clone / npx-skill parse the install dest and rm the wrong path
 *  (ui-ux-pro-max self-cleaning clone → rm of an already-gone cache dir, real
 *  skill untouched). For these the schema-REQUIRED declared `spec.uninstall`
 *  (cmd + cleanup_paths) is the authoritative teardown, so we honor it.
 *
 *  The structural methods stay on their per-method uninstaller: cc-hook-add's
 *  teardown is settings.json JSON surgery its declared cmd (`"true"`) cannot
 *  express; cc-plugin-marketplace / mcp-*-add carry platform gating and a
 *  declared cmd that merely mirrors the per-method inverse anyway. */
const DECLARED_TEARDOWN_METHODS: ReadonlySet<Manifest['spec']['install']['method']> = new Set([
  'npm-cli',
  'git-clone-with-setup',
  'npx-skill-installer',
])

export async function runUninstall(
  manifest: Manifest,
  opts: UninstallOpts,
): Promise<UninstallResult> {
  const ctx = { manifest, opts, cwd: process.cwd() }
  const method = manifest.spec.install.method
  if (DECLARED_TEARDOWN_METHODS.has(method) && hasDeclaredUninstall(ctx)) {
    return runDeclaredTeardown(ctx)
  }
  const uninstaller = uninstallers[method]
  return uninstaller(ctx)
}
