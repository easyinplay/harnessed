// Phase 5.2 W1 T1.2 — uninstall method 4/7: cc-plugin-marketplace.
// BDL T1.0: `claude plugin uninstall <plugin>@<marketplace>` (scope defaults user).
// parseCmd inline — single caller, YAGNI per RESEARCH § 7 Q2.
// Reuses runArgs from installers/lib/runClaudeArgs.ts (#BF Phase 5.1 W0).

import { runArgs } from '../installers/lib/runClaudeArgs.js'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

// sister src/installers/ccPluginMarketplace.ts parseCmd — extract pluginAtMkt only.
function extractPluginAtMkt(cmd: string): string | null {
  const m = cmd.match(/(?:\/?plugin)\s+install\s+(\S+)/i)
  if (!m || m[1] === undefined) return null
  const pluginAtMkt = m[1].replace(/[;&]+$/, '')
  return pluginAtMkt.includes('@') ? pluginAtMkt : null
}

export const uninstallCcPluginMarketplace: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-plugin-marketplace') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  const pluginAtMkt = extractPluginAtMkt(install.cmd)
  if (!pluginAtMkt) {
    return {
      ok: false,
      phase: 'preflight',
      error: `cc-plugin-marketplace cmd missing plugin install <plugin>@<marketplace>: '${install.cmd.slice(0, 80)}'`,
    }
  }

  const r = await runArgs(['plugin', 'uninstall', pluginAtMkt], ctx.cwd)
  if (r.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      error: `claude plugin uninstall exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`,
    }
  }
  return { ok: true, removedPaths: [pluginAtMkt] }
}
