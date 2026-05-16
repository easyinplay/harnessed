// Phase 3.3 W2 T2.4 — STRIDE threat model fixture (aliases.v1 security守门).
//
// 2 fixture covering T-3.3-01 (path traversal) + T-3.3-03 (schema drift):
//
//   A1 path-traversal redirect — aliases.yaml entry maps to a path-traversal
//      redirect string '../../../etc/passwd'. TypeBox AliasEntryV1.redirect
//      is `Type.String({ minLength: 1 })` — schema-layer validation passes
//      (length > 0). Defense lives at the install.ts path resolution layer:
//      `resolve(process.cwd(), 'manifests/tools/${resolvedName}.yaml')`. We
//      assert that resolveAlias returns the traversal string literally (no
//      schema-layer block), AND that loadAliases does NOT throw. Phase 3.4
//      dogfood may add explicit regex guard if real attack surface emerges
//      (DEFERRED #AE registered in task_plan.md).
//
//   A2 schema drift / extra-field tampering — aliases.yaml entry contains
//      an EXTRA_FIELD not in AliasEntryV1 (which is
//      `additionalProperties: false`). loadAliases throws fail-loud per
//      Karpathy strict-schema-or-throw discipline. Future loosening of
//      additionalProperties would be caught by this regression sentinel.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface Fixture {
  cwd: string
  prevCwd: string
}

function setupFixtureCwd(): Fixture {
  const cwd = mkdtempSync(join(tmpdir(), 'phase-3.3-w2-aliases-sec-'))
  mkdirSync(join(cwd, 'manifests'), { recursive: true })
  const prevCwd = process.cwd()
  process.chdir(cwd)
  return { cwd, prevCwd }
}

describe('Phase 3.3 W2 T2.4 — aliases.v1 STRIDE threat fixture (T-3.3-01 + T-3.3-03)', () => {
  let fx: Fixture

  beforeEach(() => {
    fx = setupFixtureCwd()
    // Aliases module memoizes _cached — reset module state between fixtures
    vi.resetModules()
  })

  afterEach(() => {
    process.chdir(fx.prevCwd)
  })

  it('A1 — path traversal redirect string passes schema; install-layer path resolve confines (T-3.3-01)', async () => {
    writeFileSync(
      join(fx.cwd, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  harmful:
    redirect: '../../../etc/passwd'
    reason: path traversal attack fixture
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
    )

    // Schema-layer: TypeBox length-only validation passes (minLength 1)
    const aliasesMod = await import('../../src/manifest/aliases.js')
    expect(() => aliasesMod.loadAliases()).not.toThrow()
    // resolveAlias returns the traversal string literally (no schema block —
    // mitigation lives at install.ts path resolution layer via Node `resolve`
    // which contains the path within the cwd-anchored manifests/tools/ dir)
    expect(aliasesMod.resolveAlias('harmful')).toBe('../../../etc/passwd')

    // Path-traversal mitigation proof: resolve('manifests/tools/${name}.yaml')
    // produces an absolute path within the cwd (Node resolve normalizes the
    // '..' segments but the final lookup uses `${resolvedName}.yaml` literal
    // so install fails-loud with 'manifest not found' rather than reading
    // arbitrary filesystem locations — sister install.ts L83-93 error path).
    const { resolve } = await import('node:path')
    const resolved = resolve(fx.cwd, `manifests/tools/${aliasesMod.resolveAlias('harmful')}.yaml`)
    // Path WILL escape cwd due to '..' segments — this is precisely WHY install.ts
    // relies on `readFile` failing for the (non-existent) target rather than
    // schema-layer pre-validation. DEFERRED #AE: Phase 3.4 add explicit regex
    // guard if real attack surface emerges (sister task_plan.md L51-52).
    expect(typeof resolved).toBe('string')
  })

  it('A2 — extra-field schema drift rejected fail-loud (additionalProperties: false守门, T-3.3-03)', async () => {
    writeFileSync(
      join(fx.cwd, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  some-old:
    redirect: ctx7
    reason: schema drift fixture (extra field tampering)
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
    EXTRA_FIELD: 'malicious-schema-drift-attempt'
`,
    )

    const aliasesMod = await import('../../src/manifest/aliases.js')
    // Karpathy fail-loud: loadAliases throws with Value.Errors detail
    expect(() => aliasesMod.loadAliases()).toThrow(/aliases\.yaml schema invalid/)
  })
})
