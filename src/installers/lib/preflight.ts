// Phase 1.2 first-gate preflight per ADR 0004 contract 1 + Pattern D + C.
//
// Why preflight is its own file (not folded into spawn.ts):
//   We want the user to see "platform mismatch" / "missing idempotent_check"
//   *before* a spawn error fires with a stack trace. spawn.ts is a hot path
//   that should assume invariants already hold; preflight is the cold path
//   that validates those invariants once per install run, in the same spirit
//   as src/manifest/security.ts being separate from validate.ts.
//
// Surgical path-walking (Pattern D): we do NOT recursively traverse the
// manifest AST — every check below targets a hard-coded path. If a future
// schema field needs preflight enforcement, add a clause here, not a generic
// walker (karpathy YAGNI; matches manifest/security.ts cmdPaths style).
//
// Out of scope (deferred to later phases):
//   - `git ls-remote <repo> <git_ref>` real-network probe → phase 2.1
//     (slow + offline-CI-hostile; preflight is a synchronous fast gate)
//   - npm registry reachability probe → phase 2.4 doctor
//   - Network MTU / proxy configuration → out of phase 1.2 scope

import type { InstallContext, InstallError } from './types.js'

const SUPPORTED_PLATFORMS = ['linux', 'darwin', 'win32'] as const
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number]

// Subset of cc-plugin-marketplace + git-clone-with-setup git_ref shape; matches
// the schema regex in src/manifest/schema/installMethods/ccPluginMarketplace.ts.
// Sanity grep only — schema already enforced this if validate.ts ran.
const GIT_REF_SHAPE = /^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+([.-][\w.-]+)?)$/

export interface PreflightOutcome {
  ok: boolean
  errors: InstallError[]
  // Set when ok=false AND a hard-stop reason applies (caller should yield an
  // `aborted` InstallResult instead of a plain `ok:false`).
  abortReason?: 'platform-mismatch'
}

export function preflight(ctx: InstallContext): PreflightOutcome {
  const errors: InstallError[] = []
  const filename = ctx.manifest.metadata.name
  const spec = ctx.manifest.spec
  const install = spec.install

  // 1. Platform whitelist. SUPPORTED_PLATFORMS is the harnessed v0.1
  // surface; any platforms[] entry outside it is a manifest error caught by
  // schema, but we double-check for robustness.
  const current = process.platform as SupportedPlatform
  if (!spec.platforms.includes(current)) {
    errors.push({
      file: filename,
      path: '/spec/platforms',
      message: `current platform '${current}' not in supported list [${spec.platforms.join(', ')}]; manifest declares it does not run here.`,
      line: null,
      column: null,
      keyword: 'platform-mismatch',
      suggest: `add '${current}' to spec.platforms in upstream manifest if the installer is known to work there`,
    })
    return { ok: false, errors, abortReason: 'platform-mismatch' }
  }

  // 2. git_ref shape sanity (only methods that have it).
  if ('git_ref' in install && typeof install.git_ref === 'string') {
    if (!GIT_REF_SHAPE.test(install.git_ref)) {
      errors.push({
        file: filename,
        path: '/spec/install/git_ref',
        message: `git_ref '${install.git_ref}' does not match SHA(7-40 hex) or SemVer shape; schema should have caught this — preflight backstop.`,
        line: null,
        column: null,
        keyword: 'git-ref-shape',
        suggest:
          'pin to a SHA (40 hex) or SemVer tag (e.g. v1.2.3); branch names like main/HEAD are forbidden',
      })
    }
  }

  // 3. idempotent_check non-empty string (all 6 install methods declare it
  // required in schema, but this guards against a programmatically-built
  // manifest that bypassed validate.ts).
  if (
    typeof install.idempotent_check !== 'string' ||
    install.idempotent_check.trim().length === 0
  ) {
    errors.push({
      file: filename,
      path: '/spec/install/idempotent_check',
      message:
        'idempotent_check missing or empty; ADR 0004 contract 1 requires a check command for re-install detection',
      line: null,
      column: null,
      keyword: 'idempotent-check-missing',
      suggest:
        'add a shell cmd that exits 0 iff the package is already installed (e.g. `npm ls -g <pkg>`)',
    })
  }

  return { ok: errors.length === 0, errors }
}
