// T8.6 — Performance threshold gate (companion to manifest-validate.bench.ts).
// vitest `bench()` does not fail on threshold by itself, so we provide a
// regular `test()` that runs in the standard `pnpm test` cycle, performs
// the same workload (100 strict validations), and asserts mean < threshold
// (acceptance bar A6).
//
// We measure with `performance.now()` over `RUNS` iterations and use the
// best-of-N (lowest mean per 100 ops) to dampen GC / OS scheduler jitter.
//
// Threshold is platform-aware: GitHub Actions `windows-latest` runner is a
// shared cloud VM ~3× slower than mac/linux runners (F18). Linux runner can
// also spike past 50ms after schema width grew in phase 1.3 (F38: ubuntu hit
// 50.14ms vs 50ms threshold). Current thresholds:
//   - CI Win (cloud VM): 100ms (F18)
//   - CI Linux/Mac + local dev: 75ms (was 50ms; F38 phase 1.3.1 hotfix —
//     schema 加 3 字段后 baseline ~28ms, 75ms = ~2.6× headroom for runner spike)
// A6 spec relaxed to < 75ms (F38); local 22ms baseline still well under.

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const FIXTURE_DIR = resolve('tests/fixtures/manifests/valid')
const fixtures: Array<{ name: string; source: string }> = readdirSync(FIXTURE_DIR)
  .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
  .map((name) => ({ name, source: readFileSync(resolve(FIXTURE_DIR, name), 'utf8') }))

// Use GITHUB_ACTIONS specifically (not generic CI env) to avoid false
// positives in other CI providers / local IDEs that set CI=true but
// don't have the slow shared-VM Windows runner. Phase 1.1.1 hotfix H6.
const IS_CI_WIN = process.env.GITHUB_ACTIONS === 'true' && process.platform === 'win32'
const THRESHOLD_MS = IS_CI_WIN ? 100 : 75
const RUNS = 5
const OPS_PER_RUN = 100

function runOnce(): number {
  const t0 = performance.now()
  for (let i = 0; i < OPS_PER_RUN; i++) {
    const f = fixtures[i % fixtures.length]
    if (!f) throw new Error('no fixture')
    validateManifestFile(f.source, f.name)
  }
  return performance.now() - t0
}

describe('performance gate (T8.6 — A6 acceptance bar)', () => {
  it(`100 manifest validations complete in < ${THRESHOLD_MS}ms (best-of-${RUNS})${IS_CI_WIN ? ' [CI win cloud VM, F18]' : ''}`, () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(10)
    // Warm up Ajv lazy compile + V8 inline caches.
    for (let i = 0; i < 3; i++) runOnce()

    // Take the best-of-N mean. With ajv compiled + warmed up the variance
    // between runs is small (RME ±2% in the bench harness); best-of-N just
    // protects against an unlucky GC sweep.
    let bestMs = Number.POSITIVE_INFINITY
    for (let i = 0; i < RUNS; i++) {
      const ms = runOnce()
      if (ms < bestMs) bestMs = ms
    }

    expect(
      bestMs,
      `100 manifest validations took ${bestMs.toFixed(2)}ms (threshold ${THRESHOLD_MS}ms${IS_CI_WIN ? ' [CI win cloud VM, F18]' : ''}, A6 acceptance bar). Run vitest bench --run for a full sample.`,
    ).toBeLessThan(THRESHOLD_MS)
  })
})
