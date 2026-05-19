// Phase 5.2 W1 T1.2 — uninstall method 3/7: mcp-http-add.
// BDL T1.0: `claude mcp remove <name>` transport-agnostic (same cmd as mcpStdioAdd).
// Reuses runArgs from installers/lib/runClaudeArgs.ts (#BF Phase 5.1 W0).

import { runArgs } from '../installers/lib/runClaudeArgs.js'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

export const uninstallMcpHttpAdd: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'mcp-http-add') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  const name = ctx.manifest.metadata.name
  const r = await runArgs(['mcp', 'remove', name], ctx.cwd)
  if (r.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      error: `claude mcp remove exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`,
    }
  }
  return { ok: true, removedPaths: [name] }
}
