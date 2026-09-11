// Phase 60 — the master kill switch, HARNESSED_OFF=1.
//
// Three layers, because each can break independently:
//   1. the predicate itself (exact "1", never truthiness)
//   2. the doctor probe that keeps an ablated machine from looking broken
//   3. the SHIPPED bin bundle — bin/*.mjs is a committed esbuild artifact, so a
//      gate present in src/ but missing from the bundle would ship broken while
//      every source-level test stayed green
//
// The bin cell uses the `--invalidate` path because its effect is observable
// with nothing but a directory: without the switch the inject cache is deleted,
// with it the cache must survive. That makes the "silent" assertion falsifiable
// rather than vacuous.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkAblation } from '../../src/cli/lib/check-ablation.js'
import { ABLATION_ENV, isAblated } from '../../src/platform/ablation.js'

describe('isAblated', () => {
  it('exactly "1" ablates', () => {
    expect(isAblated({ HARNESSED_OFF: '1' })).toBe(true)
  })

  it.each([
    '0',
    'true',
    'yes',
    'on',
    '',
    ' 1',
    '1 ',
  ])('does NOT ablate on %j — truthiness must never stand in for the switch', (v) => {
    expect(isAblated({ HARNESSED_OFF: v })).toBe(false)
  })

  it('unset does not ablate', () => {
    expect(isAblated({})).toBe(false)
  })

  it('ABLATION_ENV names the variable the predicate reads', () => {
    expect(isAblated({ [ABLATION_ENV]: '1' })).toBe(true)
  })
})

describe('checkAblation (doctor)', () => {
  it('switch off → pass', () => {
    const r = checkAblation({})
    expect(r.status).toBe('pass')
    expect(r.message).toBe('active')
  })

  it('switch on → warn naming the variable and how to undo it', () => {
    const r = checkAblation({ HARNESSED_OFF: '1' })
    expect(r.status).toBe('warn')
    expect(r.message).toContain('HARNESSED_OFF=1')
    expect(r.fix).toContain('unset HARNESSED_OFF')
  })

  it('warn, never fail — an intentionally ablated machine is not unhealthy', () => {
    expect(checkAblation({ HARNESSED_OFF: '1' }).status).not.toBe('fail')
  })
})

describe('bin/harnessed-inject-state.mjs — shipped bundle honors the switch', () => {
  const BIN = join(process.cwd(), 'bin', 'harnessed-inject-state.mjs')

  /** A state root holding a non-empty inject-cache dir. */
  function rootWithCache(): string {
    const root = mkdtempSync(join(tmpdir(), 'ablate-'))
    const cache = join(root, 'inject-cache')
    mkdirSync(cache, { recursive: true })
    writeFileSync(join(cache, 'entry.json'), '{}', 'utf8')
    return root
  }

  function runInvalidate(root: string, extraEnv: Record<string, string> = {}): void {
    execFileSync('node', [BIN, '--invalidate'], {
      encoding: 'utf8',
      env: { ...process.env, HARNESSED_ROOT_OVERRIDE: root, ...extraEnv },
    })
  }

  it('without the switch, --invalidate drops the inject cache (baseline)', () => {
    const root = rootWithCache()
    runInvalidate(root)
    expect(existsSync(join(root, 'inject-cache'))).toBe(false)
  })

  it('HARNESSED_OFF=1 → --invalidate touches nothing', () => {
    const root = rootWithCache()
    runInvalidate(root, { HARNESSED_OFF: '1' })
    expect(existsSync(join(root, 'inject-cache'))).toBe(true)
  })
})
