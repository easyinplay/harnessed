// Phase 5.1 W0 T0.3 — extract err() helper (#BG MED carry-forward 4-phase discharge).
// Identical 3-line function existed in 7 installer files:
//   ccHookAdd.ts L18 + ccPluginMarketplace.ts L40 + gitCloneWithSetup.ts L43
//   mcpHttpAdd.ts L38 + mcpStdioAdd.ts L31 + npmCli.ts L35 + npxSkillInstaller.ts L49
// Extracted here to eliminate 7-way duplication.

import type { InstallContext, InstallError } from './types.js'

export function err(
  ctx: InstallContext,
  path: string,
  message: string,
  keyword: string,
): InstallError {
  return { file: ctx.manifest.metadata.name, path, message, line: null, column: null, keyword }
}
