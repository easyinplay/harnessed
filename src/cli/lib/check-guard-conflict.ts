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

/** Shared warning body (checkpoint start stderr + doctor fix hint use the same三选一). */
export const GUARD_CONFLICT_ADVICE =
  'options (best first): (1) exempt .planning/ paths in the GateGuard config — planning ' +
  'docs are the legitimate home of findings.md/*-report.md; (2) set ECC_GATEGUARD=off for ' +
  'harnessed-orchestrated sessions; do NOT blanket `checkpoint complete --force` — that ' +
  'silently voids the evidence guard.'

/** Doctor check — warn-only (a co-installed guard is a config choice, not a fault). */
export async function checkGuardConflict(): Promise<CheckResult> {
  const det = await detectGateGuardActive()
  if (!det.active) {
    return {
      name: 'guard conflict (GateGuard)',
      status: 'pass',
      message: 'ECC GateGuard not detected — no dual-guard filename conflict',
    }
  }
  return {
    name: 'guard conflict (GateGuard)',
    status: 'warn',
    message:
      `ECC GateGuard appears active (via ${det.source}) — its filename policy (blocks ` +
      'report/findings/summary/analysis Writes) collides with harnessed evidence-guard ' +
      'artifact names (findings.md, *-report.md); subagents have no fact-retry channel, ' +
      'so `checkpoint complete` will fail-closed block',
    fix: GUARD_CONFLICT_ADVICE,
  }
}
