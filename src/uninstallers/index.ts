// Phase 5.2 W1 T1.2 — uninstaller dispatch table.
// Sister: src/installers/index.ts symmetric pattern.
// D-01 LOCKED: per-method 7 files (no levelOf() — uninstall has no L4 --system gate).

import { isReviewedNeutralTeardown, resolveComponentPlan } from '../installers/lib/componentPlan.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../platform/hostInstallContext.js'
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
  context?: HostInstallContext,
): Promise<UninstallResult> {
  let plan: ReturnType<typeof resolveComponentPlan>
  try {
    plan = resolveComponentPlan(manifest, context ?? captureHostInstallContext(), 'uninstall')
  } catch (error) {
    return {
      ok: false,
      phase: 'preflight',
      error: `invalid uninstall contract: ${(error as Error).message}`,
    }
  }
  if (plan.status === 'unsupported') {
    return {
      ok: false,
      phase: 'preflight',
      error: `${plan.reason}: ${plan.detail ?? `no safe ${plan.context.hostId} uninstall contract for '${plan.componentId}'`}`,
    }
  }
  if (opts.apply !== true || opts.dryRun) {
    return { aborted: true, reason: 'dry-run' }
  }
  const ctx = {
    manifest: structuredClone(plan.manifest) as Manifest,
    opts,
    cwd: process.cwd(),
    hostContext: plan.context,
  }
  const method = ctx.manifest.spec.install.method
  const declared =
    plan.sources.uninstall === 'host-override' ||
    (DECLARED_TEARDOWN_METHODS.has(method) && hasDeclaredUninstall(ctx))
  if (ctx.hostContext.hostId === 'codex') {
    // Defense-in-depth: the pure uninstall plan already rejects these cases.
    if (!/^[a-z0-9][a-z0-9-]*$/.test(ctx.manifest.metadata.name)) {
      return {
        ok: false,
        phase: 'preflight',
        error: 'unsupported-operation: invalid native resource identity',
      }
    }
    if (declared && !isReviewedNeutralTeardown(ctx.manifest)) {
      return {
        ok: false,
        phase: 'preflight',
        error:
          'unsupported-operation: explicit uninstall selects a declaration, not reviewed command/cleanup ownership',
      }
    }
    if (!declared && (method === 'mcp-stdio-add' || method === 'mcp-http-add')) {
      return {
        ok: false,
        phase: 'preflight',
        error:
          'unsupported-operation: registration-only metadata cannot establish native MCP source identity for teardown',
      }
    }
  }
  if (declared) {
    return runDeclaredTeardown(ctx)
  }
  const uninstaller = uninstallers[method]
  return uninstaller(ctx)
}
