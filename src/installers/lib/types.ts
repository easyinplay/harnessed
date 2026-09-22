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
  // v3.9.6 — force re-install for already-installed plugins (skip idempotent_check
  // short-circuit). MCP installers ignore this flag — they always respect existing
  // mcpServers config (per user dogfood concern: re-running `claude mcp add` could
  // overwrite user-tuned MCP entries). Default false.
  updateInstalled?: boolean
  quiet?: boolean
  // v16.0 Phase 64 (R8) — consent to write codex hook trust for harnessed's own
  // hook plugins. 'grant' = --trust-codex-hooks; 'ask' = interactive prompt;
  // 'deny' / absent = never write trust (non-interactive default). Other
  // installers ignore it.
  codexHookTrust?: 'grant' | 'ask' | 'deny'
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
// `ok: true; alreadyInstalled: true` for idempotent skip (ADR 0004 contract —
//   "already-installed = exit 0 + skip"; v1.0.4 MCP idempotent install patch);
// `ok: false` with installer phase + InstallError on failure; `aborted: true`
// for explicit user cancel / level-flag-missing / platform-mismatch.
// v16.0 Phase 64 — `trustPending`: a codex hook plugin installed fine but its hooks
// are NOT trusted yet (no consent / trust RPC unavailable) — codex silently skips
// untrusted hooks, so callers must say so instead of reporting a plain success.
export type InstallResult =
  | { ok: true; backupId: string; appliedFiles: string[]; trustPending?: string }
  | { ok: true; alreadyInstalled: true; backupId: string; trustPending?: string }
  | {
      ok: false
      phase: 'preflight' | 'dry-run' | 'confirm' | 'spawn' | 'verify' | 'rollback'
      error: InstallError
      backupId?: string
    }
  // v4.14.0 — 'harness-mismatch': the active harness platform (detectPlatform)
  // has no install path for this method and the manifest declares no
  // spec.harness_overrides entry for it. Honest skip, never a wrong-platform
  // side effect (e.g. codex setup silently writing ~/.claude.json).
  | {
      aborted: true
      reason: 'user-cancel' | 'level-flag-missing' | 'platform-mismatch' | 'harness-mismatch'
    }

export type Installer = (ctx: InstallContext) => Promise<InstallResult>

// DiffPlan — input shape for lib/diff.ts renderDiff() and lib/backup.ts
// backup(). Per ADR 0004 contract 2 (dry-run plan must be unified-diff
// renderable) + contract 3 (every modified file must be backed up).
//
// `scope` distinguishes home-dir writes (e.g. ~/.claude.json) from project-
// dir writes (e.g. <project>/.mcp.json) so backup.ts can mirror them under
// .harnessed-backup/<id>/HOME/ vs .harnessed-backup/<id>/PROJECT/.
//
// `oldText` may be empty (file does not yet exist — pure-create); `newText`
// may be empty (file is being deleted — pure-delete). Both empty = no-op
// and should not appear in plan.files[].
export interface DiffFile {
  target: string // absolute path on disk that will be written
  scope: 'HOME' | 'PROJECT'
  oldText: string
  newText: string
}

export interface DiffPlan {
  files: DiffFile[]
}

// Re-export Manifest so downstream files only need this single import path.
export type { Manifest }
