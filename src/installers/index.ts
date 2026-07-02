// Phase 1.2 → 2.1 installer dispatch table.
//
// Phase 1.2 shipped 2 of 6 install methods: npm-cli + mcp-stdio-add.
// Phase 2.1 unblocks the remaining 4 (cc-plugin-marketplace / git-clone-with-setup /
// npx-skill-installer / mcp-http-add). All 6 methods are now runtime-ready —
// the phase21 placeholder const has been removed. See PATTERNS § 4 + ADR 0010 errata.
//
// Level mapping per ADR 0004 § 4 (4-level confirm strictness):
//   L1: harnessed-local writes only      → npx ephemeral
//   L2: per-user (~/.claude/skills/)     → git-clone / npx-skill / npm local
//   L3: user-config (~/.claude.json /    → cc-plugin-marketplace / mcp-stdio /
//       .mcp.json / hooks)                  mcp-http
//   L4: system PATH / global binary      → npm install -g
//
// npm-cli's level is dynamic (npmCli.ts re-detects from cmd string); we default
// to L4 here as the safest pre-confirmation seed — npmCli may downgrade to L1
// after the dry-run preview when cmd uses npx.

import { installCcHookAdd } from './ccHookAdd.js'
import { installCcPluginMarketplace } from './ccPluginMarketplace.js'
import { installGitCloneWithSetup } from './gitCloneWithSetup.js'
import { detectPlatform } from './lib/platform.js'
import type { Installer, InstallOpts, InstallResult, Level, Manifest } from './lib/types.js'
import { installMcpHttpAdd } from './mcpHttpAdd.js'
import { installMcpStdioAdd } from './mcpStdioAdd.js'
import { installNpmCli } from './npmCli.js'
import { installNpxSkillInstaller } from './npxSkillInstaller.js'

export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'npm-cli': installNpmCli,
  'mcp-stdio-add': installMcpStdioAdd,
  'cc-plugin-marketplace': installCcPluginMarketplace,
  'git-clone-with-setup': installGitCloneWithSetup,
  'npx-skill-installer': installNpxSkillInstaller,
  'mcp-http-add': installMcpHttpAdd,
  // Phase 2.4 W3 T3.1 (D-04 § 3.1) — 7th installer.
  'cc-hook-add': installCcHookAdd,
}

function levelOf(manifest: Manifest): Level {
  const method = manifest.spec.install.method
  switch (method) {
    case 'mcp-stdio-add':
    case 'mcp-http-add':
    case 'cc-plugin-marketplace':
    case 'cc-hook-add':
      // ~/.claude/settings.json is shared user-scope state (L3 tier sister
      // mcp-stdio CC #54803 "shared user state" warning).
      return 'L3'
    case 'git-clone-with-setup':
    case 'npx-skill-installer':
      return 'L2'
    case 'npm-cli':
      return 'L4'
  }
}

// v4.14.0 T3 — methods with NO non-claude install path unless the manifest
// carries a harness override (claude plugin marketplace / settings hooks are
// CC infrastructure; ralph-loop & gstack intentionally have no codex override).
const CLAUDE_ONLY_METHODS: ReadonlySet<string> = new Set(['cc-plugin-marketplace', 'cc-hook-add'])

/** v4.14.0 T3 — resolve the effective manifest for the ACTIVE harness platform.
 *  claude → verbatim. Other platforms: `spec.harness_overrides.<id>` present →
 *  install (and verify, when given) replaced wholesale; absent + claude-only
 *  method → 'harness-mismatch' gate. Exported for setup/tests. */
export function resolveForHarness(
  manifest: Manifest,
): { manifest: Manifest; gate: null } | { manifest: Manifest; gate: InstallResult } {
  const platform = detectPlatform()
  if (platform.id === 'claude') return { manifest, gate: null }
  const override = platform.id === 'codex' ? manifest.spec.harness_overrides?.codex : undefined
  if (override) {
    const spec = {
      ...manifest.spec,
      install: override.install,
      verify: override.verify ?? manifest.spec.verify,
    }
    return { manifest: { ...manifest, spec }, gate: null }
  }
  if (CLAUDE_ONLY_METHODS.has(manifest.spec.install.method)) {
    return { manifest, gate: { aborted: true, reason: 'harness-mismatch' } }
  }
  return { manifest, gate: null }
}

export async function runInstall(manifest: Manifest, opts: InstallOpts): Promise<InstallResult> {
  const resolved = resolveForHarness(manifest)
  if (resolved.gate) return resolved.gate
  const effective = resolved.manifest
  const installer = installers[effective.spec.install.method]
  return installer({ manifest: effective, opts, level: levelOf(effective), cwd: process.cwd() })
}
