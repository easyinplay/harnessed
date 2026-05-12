// Phase 1.2 installer type foundation per ADR 0004 + PATTERNS § D-1.
//
// Single source of truth for InstallContext / InstallOpts / InstallError /
// InstallResult / Installer types. All install methods (npm-cli,
// mcp-stdio-add, ...) and lib helpers (preflight / spawn / diff / confirm /
// backup / state) import from here.
//
// karpathy YAGNI — fields like audit.log / current-workflow are NOT pre-
// reserved (D1.2-7); state/checkpoint files are added in their own phases.
//
// Pattern E: extend ValidationError from manifest layer with installer-
// specific fields (`installer` + `suggest`); reuse the typed Result shape.
// Pattern C: discriminated InstallResult with ok / aborted variants.

import type { ValidationError } from '../../manifest/errors.js'
import type { Manifest } from '../../manifest/schema/types.js'

export type Level = 'L1' | 'L2' | 'L3' | 'L4'

export interface InstallOpts {
  apply: boolean // false = dry-run by default per ADR 0004 contract 1
  dryRun: boolean // explicit dry-run flag (mutually exclusive with apply)
  system: boolean // L4 explicit flag (npm install -g)
  nonInteractive: boolean // CI / scripts: skip prompts
  fullDiff: boolean // expand diffs longer than 200 lines
  color: boolean | 'auto' // 'auto' = picocolors.isColorSupported
}

export interface InstallContext {
  manifest: Manifest
  opts: InstallOpts
  level: Level
  cwd: string // user project root for backup / state writes
}

// Pattern E: extend manifest ValidationError with installer-specific fields.
export interface InstallError extends ValidationError {
  installer?:
    | 'npm-cli'
    | 'mcp-stdio-add'
    | 'cc-plugin-marketplace'
    | 'git-clone-with-setup'
    | 'npx-skill-installer'
    | 'mcp-http-add'
  suggest?: string // executable fix command per ADR 0004 contract 6
}

// Pattern C: discriminated Result. `ok: true` + `appliedFiles[]` on success;
// `ok: false` with installer phase + InstallError on failure; `aborted: true`
// for explicit user cancel / level-flag-missing / platform-mismatch.
export type InstallResult =
  | { ok: true; backupId: string; appliedFiles: string[] }
  | {
      ok: false
      phase: 'preflight' | 'dry-run' | 'confirm' | 'spawn' | 'verify' | 'rollback'
      error: InstallError
      backupId?: string
    }
  | { aborted: true; reason: 'user-cancel' | 'level-flag-missing' | 'platform-mismatch' }

export type Installer = (ctx: InstallContext) => Promise<InstallResult>

// Re-export Manifest so downstream files only need this single import path.
export type { Manifest }
