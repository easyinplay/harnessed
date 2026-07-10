// 4.23.0 (T8) — GateGuard exemption via the upstream env channel (consented,
// default YES). SUPERSEDES the 4.22.2 `.gateguard.yml` text-append channel.
//
// Upstream research (affaan-m/ECC HEAD 4092795, 2026-07-10): the current
// gateguard-fact-force.js hook honors `GATEGUARD_EXEMPT_GLOBS` — a comma-
// separated glob list; a normalized-path match skips fact-forcing for
// Edit/Write/MultiEdit. That makes the harness settings env (`settings.json` →
// `env.GATEGUARD_EXEMPT_GLOBS`) the sanctioned exemption surface for the ecc
// variant harnessed users actually run. The 4.22.2 yml channel targeted the
// pip `gateguard-ai` package — not the observed user base — and carrying both
// channels doubled every consumer's branching; user decision 2026-07-10:
// single channel, env only, yml machinery removed.
//
// Carried-over decisions (2026-07-05 D1-D6, still binding):
//   - confirm DEFAULT YES; refusal must be LOUD (3 consequences + manual cmd).
//   - never mutate settings without a backup (mergeSettingsEnvKey does backup +
//     atomic tmp/rename); print the exact env change BEFORE consent.
//   - fail-soft everywhere: this is a warn-class fix riding on setup/start.
//
// Own module (not new exports on check-guard-conflict.ts): checkpoint tests
// factory-mock that sibling with importOriginal; a fresh module keeps both
// mockable independently (mock-export-gap 教训). Callers pass this module's
// exports INTO runExemptionFlow's deps so factory mocks intercept them.

import { readFile as fsReadFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  detectPlatform,
  getPluginsRegistry,
  getSettingsPath,
} from '../../installers/lib/platform.js'
import { type MergeOutcome, mergeSettingsEnvKey } from './settingsWriter.js'

export const PLANNING_GLOB = '.planning/**'
export const MANUAL_FIX_CMD = 'harnessed exempt-gateguard'
export const EXEMPT_ENV_KEY = 'GATEGUARD_EXEMPT_GLOBS'
/** Verified against `claude plugin update --help` (2026-07-10). */
export const ECC_UPGRADE_CMD = 'claude plugin update ecc'

// ── capability probe ─────────────────────────────────────────────────────────

export type ExemptCapability = 'env-supported' | 'legacy'

export interface ProbeDeps {
  /** Plugin registry path (`installed_plugins.json`), or null (codex). */
  registryPath: () => string | null
  readFile: (p: string) => Promise<string>
}

function defaultProbeDeps(): ProbeDeps {
  return {
    registryPath: () => getPluginsRegistry(),
    readFile: (p) => fsReadFile(p, 'utf8'),
  }
}

/** Does the INSTALLED ecc GateGuard hook understand GATEGUARD_EXEMPT_GLOBS?
 *  Locates every registered ecc install (registry v2 `installPath`) and greps
 *  its `scripts/hooks/gateguard-fact-force.js` for the env-key literal. Old ecc
 *  (≤2026-05) predates the env channel entirely. Conservative fail-soft: any
 *  unlocatable/unreadable surface → 'legacy' (advise upgrade, never write an
 *  env key the resident hook would silently ignore). */
export async function probeExemptCapability(
  deps: Partial<ProbeDeps> = {},
): Promise<ExemptCapability> {
  const d = { ...defaultProbeDeps(), ...deps }
  try {
    const registry = d.registryPath()
    if (registry === null) return 'legacy'
    const parsed = JSON.parse(await d.readFile(registry)) as {
      plugins?: Record<string, Array<{ installPath?: string }>>
    }
    const plugins = parsed.plugins ?? {}
    for (const key of Object.keys(plugins)) {
      if (key.split('@')[0] !== 'ecc') continue
      for (const entry of plugins[key] ?? []) {
        if (!entry.installPath) continue
        const hook = join(entry.installPath, 'scripts', 'hooks', 'gateguard-fact-force.js')
        try {
          if ((await d.readFile(hook)).includes(EXEMPT_ENV_KEY)) return 'env-supported'
        } catch {
          // hook file absent in this install → keep scanning
        }
      }
    }
    return 'legacy'
  } catch {
    return 'legacy'
  }
}

// ── env value planner (idempotent comma-list append) ─────────────────────────

export function splitGlobs(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

export interface EnvPlan {
  action: 'skip' | 'set'
  /** The full new env value (absent for 'skip'). */
  value?: string
}

/** `.planning/**` already listed → skip; otherwise append to the existing
 *  comma list (or start one). Existing entries survive verbatim. */
export function planEnvExemption(existing: string | undefined): EnvPlan {
  const globs = splitGlobs(existing)
  if (globs.includes(PLANNING_GLOB)) return { action: 'skip' }
  return { action: 'set', value: [...globs, PLANNING_GLOB].join(',') }
}

// ── current-state reader ─────────────────────────────────────────────────────

export interface ReadEnvDeps {
  readSettings: () => Promise<string | null>
}

/** Current persisted `env.GATEGUARD_EXEMPT_GLOBS` from settings.json, or
 *  undefined (absent file / malformed JSON / key not set). Fail-soft. */
export async function readCurrentEnvValue(
  deps: Partial<ReadEnvDeps> = {},
): Promise<string | undefined> {
  const readSettings =
    deps.readSettings ??
    (async () => {
      try {
        return await fsReadFile(getSettingsPath(), 'utf8')
      } catch {
        return null
      }
    })
  try {
    const raw = await readSettings()
    if (raw === null) return undefined
    const parsed = JSON.parse(raw) as { env?: Record<string, unknown> }
    const v = parsed.env?.[EXEMPT_ENV_KEY]
    return typeof v === 'string' && v.length > 0 ? v : undefined
  } catch {
    return undefined
  }
}

// ── apply (settingsWriter: backup-first, atomic) ─────────────────────────────

/** Persist the planned value through the shared settings env-key writer
 *  (3-case create/idempotent/backup+merge; atomic tmp+rename). skipIfPresent
 *  re-checks the glob list at write time — a concurrent writer that already
 *  added `.planning/**` turns this into a no-op instead of a clobber. */
export async function applyEnvExemption(value: string): Promise<MergeOutcome> {
  return mergeSettingsEnvKey(EXEMPT_ENV_KEY, value, {
    skipIfPresent: (existing) => splitGlobs(existing).includes(PLANNING_GLOB),
  })
}

// ── presentation ─────────────────────────────────────────────────────────────

/** Pre-consent transparency block: exact env change + target + backup home. */
export function previewLines(existing: string | undefined, newValue: string): string[] {
  const change =
    existing === undefined
      ? `  + env.${EXEMPT_ENV_KEY} = "${newValue}"`
      : `  ~ env.${EXEMPT_ENV_KEY}: "${existing}" → "${newValue}"`
  return [
    `[harnessed] GateGuard ↔ evidence-guard conflict — sanctioned fix available:`,
    `  file:   ${getSettingsPath()}`,
    change,
    `  backup: settings.json.<timestamp>.bak under the harnessed backups dir (written first)`,
  ]
}

/** D3 — the LOUD refusal block (also reused as non-interactive advice tail). */
export function refusalLines(): string[] {
  return [
    '',
    '⚠️  GateGuard exemption NOT applied — the dual-guard conflict remains:',
    '  • verify-stage artifacts (code-review-report.md, qa-report.md, security-audit-report.md,',
    '    paranoid-review-report.md, multispec-review-report.md) will be blocked at Write',
    '  • subagents have no fact-retry channel — they will rename artifacts and every',
    '    `checkpoint complete` will fail-closed block on the missing contract names',
    `  • fix anytime: \`${MANUAL_FIX_CMD}\` (or set ${EXEMPT_ENV_KEY}="${PLANNING_GLOB}" in your`,
    '    harness settings env yourself)',
    '  harnessed doctor will keep warning until this is resolved.',
    '',
  ]
}

/** Legacy-ecc advice (probe found no GATEGUARD_EXEMPT_GLOBS support installed). */
export function upgradeAdviceLines(): string[] {
  return [
    `[harnessed] your installed ecc GateGuard predates ${EXEMPT_ENV_KEY} exemption support.`,
    `  upgrade first: \`${ECC_UPGRADE_CMD}\` (restart required), then re-run \`${MANUAL_FIX_CMD}\`.`,
    '  interim: set ECC_GATEGUARD=off for harnessed-orchestrated sessions.',
  ]
}

// ── orchestrator (shared by `checkpoint start` pre-check and the CLI command) ─

export interface FlowDeps {
  probe: () => Promise<ExemptCapability>
  readEnvValue: () => Promise<string | undefined>
  merge: (value: string) => Promise<MergeOutcome>
  /** Platform gate — codex config is TOML; CC env keys are meaningless there. */
  supportsEnvWrite: () => boolean
  print: (line: string) => void
  /** Interactive consent (default YES at the prompt layer). Absent = non-interactive. */
  confirm?: () => Promise<boolean>
}

export type FlowResult =
  | 'not-capable'
  | 'unsupported-platform'
  | 'already'
  | 'applied'
  | 'declined'
  | 'advised'
  | 'error'

export async function runExemptionFlow(deps: Partial<FlowDeps> = {}): Promise<FlowResult> {
  const d: FlowDeps = {
    probe: () => probeExemptCapability(),
    readEnvValue: () => readCurrentEnvValue(),
    merge: (value) => applyEnvExemption(value),
    supportsEnvWrite: () => detectPlatform().supportsEnvKeyWrite,
    print: (line) => console.error(line),
    ...deps,
  }
  try {
    // Caller prints the collision context for 'not-capable' (flow stays silent
    // so the CLI and the checkpoint pre-check can word it for their surface).
    if ((await d.probe()) !== 'env-supported') return 'not-capable'

    if (!d.supportsEnvWrite()) {
      d.print(
        `[harnessed] this platform's config is not JSON-env writable — export ` +
          `${EXEMPT_ENV_KEY}="${PLANNING_GLOB}" in your shell environment instead.`,
      )
      return 'unsupported-platform'
    }

    const existing = await d.readEnvValue()
    const plan = planEnvExemption(existing)
    if (plan.action === 'skip') return 'already'

    for (const line of previewLines(existing, plan.value ?? '')) d.print(line)

    if (!d.confirm) {
      // Non-interactive caller: advise, never mutate without live consent.
      d.print(`  non-interactive session — run \`${MANUAL_FIX_CMD}\` to apply this fix.`)
      return 'advised'
    }

    const yes = await d.confirm()
    if (!yes) {
      for (const line of refusalLines()) d.print(line)
      return 'declined'
    }

    const r = await d.merge(plan.value ?? '')
    if (r.outcome === 'created' || r.outcome === 'merged') {
      const backup = r.outcome === 'merged' ? ` (backup: ${r.backupPath})` : ''
      d.print(
        `✓ [harnessed] set ${EXEMPT_ENV_KEY}="${plan.value}" in ${r.path}${backup} — ` +
          'restart the harness session to pick it up.',
      )
      return 'applied'
    }
    if (r.outcome === 'already') return 'already'
    d.print(`⚠️ [harnessed] exemption failed: ${r.message} — apply manually: \`${MANUAL_FIX_CMD}\``)
    return 'error'
  } catch (err) {
    d.print(`⚠️ [harnessed] exemption flow error: ${(err as Error).message}`)
    return 'error'
  }
}
