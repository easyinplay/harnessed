// Phase 5.2 W1 T1.1 — UninstallOpts + UninstallContext + UninstallResult + Uninstaller types.
// Sister: src/installers/lib/types.ts symmetric pattern.

import type { Manifest } from '../../manifest/schema/types.js'

export interface UninstallOpts {
  apply: boolean // false = dry-run by default per ADR 0004 contract 1
  dryRun: boolean // explicit dry-run flag
  yes: boolean // skip interactive confirm (CI / scripts)
}

export interface UninstallContext {
  manifest: Manifest
  opts: UninstallOpts
  cwd: string
}

export type UninstallResult =
  | { ok: true; removedPaths: string[] }
  | { ok: false; phase: 'preflight' | 'spawn' | 'verify'; error: string }
  | { aborted: true; reason: 'dry-run' | 'user-cancel' }

export type Uninstaller = (ctx: UninstallContext) => Promise<UninstallResult>

// Re-export Manifest for downstream convenience.
export type { Manifest }
