// tests/workflow/ecc-wiring.test.ts — guards the ECC Bucket 11 wiring against the
// ADR-0034 de-confliction invariants. Loads the REAL workflows/capabilities.yaml
// (the SoT the bundled distribution ships) and asserts:
//   1. The 10 Bucket 11 additive entries exist (starter-8 domain + cost + hook).
//   2. Their fires_when uses ORTHOGONAL axes (subtask.domain / needs_cost_report /
//      needs_hook_authoring) that NO non-ecc entry fires on — the "zero collision"
//      claim, enforced (ADR-0034 §4).
//   3. ECC per-language reviewers/build-resolvers are ALIASES under verify
//      capabilities (code-review / gsd-debug), NOT standalone Bucket 11 entries —
//      Finding 1 single-fire guard (a parallel entry would triple-fire in verify).
//   4. HARD-EXCLUDED ECC families (checkpoint / recursive-decision-ledger /
//      strategic-compact / context-budget / continuous-learning) appear NOWHERE —
//      the keystone state/ledger/compact/learning engine safety boundary.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

interface Entry {
  impl: string
  cmd: string
  fires_when?: string[]
  aliases?: { impl: string; cmd: string }[]
}
const caps = parseYaml(
  readFileSync(join(__dirname, '..', '..', 'workflows', 'capabilities.yaml'), 'utf8'),
) as { capabilities: Record<string, Entry> }
const entries = caps.capabilities

const BUCKET_11 = [
  'ecc-mcp-server-patterns',
  'ecc-python-patterns',
  'ecc-rust-patterns',
  'ecc-golang-patterns',
  'ecc-postgres-patterns',
  'ecc-docker-patterns',
  'ecc-nextjs-turbopack',
  'ecc-api-design',
  'ecc-cost-tracking',
  'ecc-hookify-rules',
]

describe('ECC Bucket 11 wiring (ADR-0034)', () => {
  it('all 10 additive entries exist with impl: ecc + ecc:<skill> cmd', () => {
    for (const name of BUCKET_11) {
      const e = entries[name]
      expect(e, `${name} missing`).toBeDefined()
      if (!e) continue
      expect(e.impl).toBe('ecc')
      expect(e.cmd).toMatch(/^ecc:/)
    }
  })

  it('Bucket 11 fires_when uses ONLY orthogonal axes (domain/cost/hook) — zero collision', () => {
    const ORTHOGONAL = /^subtask\.(domain ==|needs_cost_report|needs_hook_authoring)/
    for (const name of BUCKET_11) {
      const e = entries[name]
      if (!e) continue
      for (const fw of e.fires_when ?? []) {
        expect(fw, `${name} fires_when off-axis: ${fw}`).toMatch(ORTHOGONAL)
      }
    }
  })

  it('no NON-ecc entry fires on the domain/cost/hook axes (axes are ECC-exclusive)', () => {
    for (const [name, e] of Object.entries(entries)) {
      if (name.startsWith('ecc-')) continue
      for (const fw of e.fires_when ?? []) {
        expect(
          /subtask\.(domain ==|needs_cost_report|needs_hook_authoring)/.test(fw),
          `non-ecc ${name} collides on ECC axis: ${fw}`,
        ).toBe(false)
      }
    }
  })
})

describe('ECC verify-dimension aliases (Finding 1 single-fire guard)', () => {
  it('per-language reviewers are aliases under code-review, NOT standalone entries', () => {
    const aliasCmds = (entries['code-review']?.aliases ?? []).map((a) => a.cmd)
    expect(aliasCmds).toContain('ecc:python-reviewer')
    expect(aliasCmds).toContain('ecc:rust-reviewer')
    // and NOT wired as a parallel top-level capability (would triple-fire in verify)
    expect(entries['ecc-python-reviewer']).toBeUndefined()
    expect(entries['ecc-rust-reviewer']).toBeUndefined()
  })

  it('per-language build-resolvers are aliases under gsd-debug', () => {
    const aliasCmds = (entries['gsd-debug']?.aliases ?? []).map((a) => a.cmd)
    expect(aliasCmds).toContain('ecc:rust-build-resolver')
    expect(aliasCmds).toContain('ecc:go-build-resolver')
    expect(entries['ecc-rust-build-resolver']).toBeUndefined()
  })

  // 4.32.23 — the pre-4.32.23 alias names (`ecc:python-review` command face for
  // reviewers, `ecc:rust-build` / `ecc:go-build` / `ecc:build-fix` for resolvers)
  // did not all exist upstream. Reviewers/resolvers must use the UPSTREAM AGENT
  // FACE, which is uniform and hole-free: `<lang>-reviewer` / `<lang>-build-resolver`
  // (plus the generic `build-error-resolver`). Guards against silent drift back.
  it('every ecc alias uses the upstream agent face (reviewer / resolver suffix)', () => {
    const AGENT_FACE = /^ecc:[a-z0-9-]+-(reviewer|build-resolver|resolver)$/
    for (const [name, e] of Object.entries(entries)) {
      for (const a of e.aliases ?? []) {
        if (a.impl !== 'ecc') continue
        expect(a.cmd, `${name} alias not on the ECC agent face: ${a.cmd}`).toMatch(AGENT_FACE)
      }
    }
  })
})

// 4.32.23 — 降级链铁律 (memory `ecc-positioning`): ECC is BONUS TIER, so every
// entry that carries ECC specialist aliases must have a NON-ecc base impl —
// the base entry IS the chain tail and must work with ECC absent. A base entry
// with `impl: ecc` would make the whole capability a hard ECC dependency.
describe('降级链 chain-tail invariant', () => {
  it('no entry with ecc aliases has an ecc base impl', () => {
    for (const [name, e] of Object.entries(entries)) {
      const hasEccAlias = (e.aliases ?? []).some((a) => a.impl === 'ecc')
      if (!hasEccAlias) continue
      expect(e.impl, `${name} has ecc aliases but its base impl is ecc (no fallback)`).not.toBe(
        'ecc',
      )
    }
  })
})

describe('ECC hard-exclusion safety boundary (Finding 2)', () => {
  // These ECC families collide with harnessed's keystone state/ledger/compact/
  // learning engines and must appear NOWHERE in capabilities.yaml (entry name OR cmd).
  const FORBIDDEN = [
    'checkpoint',
    'save-session',
    'resume-session',
    'recursive-decision-ledger',
    'strategic-compact',
    'context-budget',
    'continuous-learning',
    'instinct-',
  ]
  it('no hard-excluded ECC family is wired (entry name or cmd)', () => {
    const haystack = Object.entries(entries).flatMap(([name, e]) => [
      name,
      e.cmd,
      ...(e.aliases ?? []).map((a) => a.cmd),
    ])
    for (const forbidden of FORBIDDEN) {
      const hit = haystack.find((h) => h.includes(forbidden))
      expect(hit, `hard-excluded family '${forbidden}' wired as: ${hit}`).toBeUndefined()
    }
  })
})
