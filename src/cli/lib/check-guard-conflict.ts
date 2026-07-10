// 4.22.1 T2b/T4 — dual-guard conflict detection (ECC GateGuard × evidence guard).
//
// Dogfood (first compliant /auto run): ECC's GateGuard PreToolUse hook blocks
// Write calls whose filenames match report/findings/summary/analysis patterns.
// The MAIN session can satisfy its fact-forcing retry channel, but SUBAGENTS
// cannot — they get renamed-or-blocked artifacts, so harnessed's evidence-guard
// contract names (findings.md, *-report.md …) can never be produced verbatim,
// and every `checkpoint complete` fail-closed blocks. The verify stage declares
// five *-report.md artifacts, so the collision recurs there.
//
// Detection surface (researched against ecc marketplace hooks/gateguard-fact-force.js):
//   - kill switches: GATEGUARD_DISABLED=1; ECC_GATEGUARD ∈ {off,0,false,disabled}
//     → explicitly OFF regardless of other signals.
//   - active signals (conservative, warn-only consumer):
//       (a) 'gateguard' keyword anywhere in the user settings.json hooks JSON,
//       (b) the ecc plugin registered (it ships + wires the hook by default),
//       (c) ECC_GATEGUARD set to a non-disable value (explicit user opt-in).
//
// Own module (not new exports on check-builtin.ts / checkpoint.ts):
// mock-export-gap 教训 — checkpoint tests factory-mock siblings; a fresh module
// is safely mockable and shares one detection SoT between doctor and
// `checkpoint start`.

import { readFile } from 'node:fs/promises'
import { getSettingsPath } from '../../installers/lib/platform.js'
import { isPluginRegistered } from '../../installers/lib/readClaudeConfig.js'
import type { CheckResult } from './check-builtin.js'

const DISABLE_VALUES = new Set(['off', '0', 'false', 'disabled'])

export interface GuardConflictDeps {
  env: Record<string, string | undefined>
  /** Raw settings.json text, or null when unreadable/absent. */
  readSettings: () => Promise<string | null>
  eccPluginInstalled: () => Promise<boolean>
}

function defaultDeps(): GuardConflictDeps {
  return {
    env: process.env,
    readSettings: async () => {
      try {
        return await readFile(getSettingsPath(), 'utf8')
      } catch {
        return null
      }
    },
    eccPluginInstalled: async () => {
      try {
        return await isPluginRegistered('ecc')
      } catch {
        return false
      }
    },
  }
}

export interface GateGuardDetection {
  active: boolean
  /** Which signal fired ('settings-hooks' | 'ecc-plugin' | 'env') — null when inactive. */
  source: string | null
}

/** Conservative GateGuard-active probe. Fail-soft: any error → inactive. */
export async function detectGateGuardActive(
  deps: Partial<GuardConflictDeps> = {},
): Promise<GateGuardDetection> {
  const d = { ...defaultDeps(), ...deps }
  try {
    const disabled = (d.env.GATEGUARD_DISABLED ?? '').trim() === '1'
    const eccEnv = (d.env.ECC_GATEGUARD ?? '').trim().toLowerCase()
    if (disabled || DISABLE_VALUES.has(eccEnv)) return { active: false, source: null }

    if (eccEnv.length > 0) return { active: true, source: 'env' }

    const settings = await d.readSettings()
    if (settings !== null && /gateguard/i.test(settings)) {
      return { active: true, source: 'settings-hooks' }
    }

    if (await d.eccPluginInstalled()) return { active: true, source: 'ecc-plugin' }

    return { active: false, source: null }
  } catch {
    return { active: false, source: null }
  }
}

/** Shared warning body (checkpoint start stderr + doctor fix hint use the same三选一).
 *  4.23.0 (T8) — env channel only: the 4.22.2 `.gateguard.yml` advice is gone
 *  with the yml machinery (user decision 2026-07-10: single channel). */
export const GUARD_CONFLICT_ADVICE =
  'options (best first): (1) run `harnessed exempt-gateguard` — persists ' +
  'GATEGUARD_EXEMPT_GLOBS=".planning/**" into the harness settings env (backed up first; ' +
  'planning dirs are the legitimate home of findings.md/*-report.md); (2) if your ecc ' +
  'predates GATEGUARD_EXEMPT_GLOBS support, upgrade first: `claude plugin update ecc`; ' +
  '(3) interim: set ECC_GATEGUARD=off for harnessed-orchestrated sessions; do NOT blanket ' +
  '`checkpoint complete --force` — that silently voids the evidence guard.'

/** 4.23.0 (T8) — injectable exemption probe (variant分型 by CAPABILITY, not by
 *  config file): current ecc's gateguard-fact-force.js honors
 *  GATEGUARD_EXEMPT_GLOBS (comma-separated globs, normalized-path match); old
 *  ecc has no exemption surface at all → advise upgrade. */
export interface ExemptionProbeDeps {
  capability: () => Promise<import('./guard-exemption.js').ExemptCapability>
  currentValue: () => Promise<string | undefined>
}

async function defaultExemptionProbe(): Promise<ExemptionProbeDeps> {
  const { probeExemptCapability, readCurrentEnvValue } = await import('./guard-exemption.js')
  return {
    capability: () => probeExemptCapability(),
    currentValue: () => readCurrentEnvValue(),
  }
}

/** Doctor check — warn-only (a co-installed guard is a config choice, not a
 *  fault). Variant-aware: an exempted env (settings or live process env)
 *  resolves to pass (the nag stops exactly when the conflict does, D3); a
 *  capable-but-unexempt install gets the auto-fix channel
 *  (`harnessed exempt-gateguard`, doctor auto-install confirm default YES per
 *  D1); a legacy ecc gets the upgrade advice. */
export async function checkGuardConflict(
  deps: Partial<GuardConflictDeps> = {},
  exemption?: ExemptionProbeDeps,
): Promise<CheckResult> {
  const d = { ...defaultDeps(), ...deps }
  const det = await detectGateGuardActive(deps)
  if (!det.active) {
    return {
      name: 'guard conflict (GateGuard)',
      status: 'pass',
      message: 'ECC GateGuard not detected — no dual-guard filename conflict',
    }
  }

  // Variant probe — fail-soft to the legacy/upgrade warn on any error.
  try {
    const probe = exemption ?? (await defaultExemptionProbe())
    const { PLANNING_GLOB, splitGlobs } = await import('./guard-exemption.js')
    // Exempted already? Check the persisted settings env AND the live process
    // env (a user may export the var globally instead of via settings.json).
    const persisted = await probe.currentValue()
    const live = d.env.GATEGUARD_EXEMPT_GLOBS
    if (splitGlobs(persisted).includes(PLANNING_GLOB) || splitGlobs(live).includes(PLANNING_GLOB)) {
      return {
        name: 'guard conflict (GateGuard)',
        status: 'pass',
        message:
          'GateGuard active but .planning/** is exempted via GATEGUARD_EXEMPT_GLOBS — ' +
          'conflict resolved',
      }
    }
    if ((await probe.capability()) === 'env-supported') {
      return {
        name: 'guard conflict (GateGuard)',
        status: 'warn',
        message:
          `ECC GateGuard appears active (via ${det.source}) — its fact-forcing policy ` +
          'collides with harnessed evidence-guard artifact names (findings.md, ' +
          '*-report.md); a sanctioned env exemption is available (GATEGUARD_EXEMPT_GLOBS)',
        fix: GUARD_CONFLICT_ADVICE,
        install_commands: ['harnessed exempt-gateguard'],
      }
    }
  } catch {
    // fall through to the legacy/upgrade warn
  }

  // Legacy ecc (or unprobeable install): no exemption surface exists in the
  // resident hook — writing the env key would be silently ignored, so the fix
  // is an upgrade, not an auto-write.
  return {
    name: 'guard conflict (GateGuard)',
    status: 'warn',
    message:
      `ECC GateGuard appears active (via ${det.source}) — its filename policy (blocks ` +
      'report/findings/summary/analysis Writes) collides with harnessed evidence-guard ' +
      'artifact names (findings.md, *-report.md); this ecc version predates the ' +
      'GATEGUARD_EXEMPT_GLOBS exemption surface',
    fix:
      'upgrade ecc first: `claude plugin update ecc` (restart required), then run ' +
      '`harnessed exempt-gateguard` to persist the .planning/** exemption; interim: set ' +
      'ECC_GATEGUARD=off for harnessed-orchestrated sessions; do NOT blanket ' +
      '`checkpoint complete --force` — that silently voids the evidence guard.',
  }
}
