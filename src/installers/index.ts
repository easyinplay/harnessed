// Phase 1.2 installer dispatch table.
//
// Phase 1.2 implements 2 of 6 install methods: npm-cli + mcp-stdio-add.
// Phase 2.1 unblocks the remaining 4 (cc-plugin-marketplace / git-clone-with-setup /
// npx-skill-installer / mcp-http-add) — see ROADMAP v0.2.0 + ADR 0005.
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

import type { Installer, InstallOpts, InstallResult, Level, Manifest } from './lib/types.js'
import { installMcpStdioAdd } from './mcpStdioAdd.js'
import { installNpmCli } from './npmCli.js'

const phase21Placeholder: Installer = async (ctx) => ({
  ok: false,
  phase: 'preflight',
  error: {
    file: ctx.manifest.metadata.name,
    path: '/spec/install/method',
    message: `Install method '${ctx.manifest.spec.install.method}' is reserved for phase 2.1 — see ROADMAP v0.2.0 + ADR 0005`,
    line: null,
    column: null,
    keyword: 'phase-deferred',
    suggest: 'wait for v0.2.0 release, or open an issue if blocked',
  },
})

export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'npm-cli': installNpmCli,
  'mcp-stdio-add': installMcpStdioAdd,
  'cc-plugin-marketplace': phase21Placeholder,
  'git-clone-with-setup': phase21Placeholder,
  'npx-skill-installer': phase21Placeholder,
  'mcp-http-add': phase21Placeholder,
}

function levelOf(manifest: Manifest): Level {
  const method = manifest.spec.install.method
  switch (method) {
    case 'mcp-stdio-add':
    case 'mcp-http-add':
    case 'cc-plugin-marketplace':
      return 'L3'
    case 'git-clone-with-setup':
    case 'npx-skill-installer':
      return 'L2'
    case 'npm-cli':
      return 'L4'
  }
}

export async function runInstall(manifest: Manifest, opts: InstallOpts): Promise<InstallResult> {
  const installer = installers[manifest.spec.install.method]
  return installer({ manifest, opts, level: levelOf(manifest), cwd: process.cwd() })
}
