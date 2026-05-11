// T8.6 — Benchmark: validating 100 manifests under 50ms.
// Acceptance bar A6: vitest `bench` (microbench) of 100 strict validations
// must complete in < 50ms mean (50% headroom on the GA-1 SLA of 100ms).
//
// We pre-load every fixture once and shuffle through them inside the bench
// loop so JIT warmup, file IO, and Ajv lazy-compile happen outside the timer.
// The Ajv compiled validator is a single per-process instance (lazy compiled
// on first call), so iteration N=2..100 is what we actually measure.

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const FIXTURE_DIR = resolve('tests/fixtures/manifests/valid')

// Load all valid fixtures once at module scope so file IO is excluded
// from the bench timing.
const fixtures: Array<{ name: string; source: string }> = readdirSync(FIXTURE_DIR)
  .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
  .map((name) => ({ name, source: readFileSync(resolve(FIXTURE_DIR, name), 'utf8') }))

// Pre-warm the Ajv compiled validator + ensure every fixture validates.
for (const f of fixtures) {
  const r = validateManifestFile(f.source, f.name)
  if (!r.ok) {
    throw new Error(
      `bench precondition violated: fixture ${f.name} failed validation: ${JSON.stringify(r.errors)}`,
    )
  }
}

describe('validateManifestFile bench (T8.6 — A6 acceptance bar)', () => {
  // 100 validations per iteration. vitest bench reports time per iteration,
  // so a passing run = mean < 50ms / iteration. The CI-enforced threshold
  // assertion lives in the companion `*.test.ts` file (vitest bench does not
  // fail on threshold by itself).
  bench(
    'validate 100 manifests (strict, ajv compiled, 10 fixtures × 10 round-trips)',
    () => {
      for (let i = 0; i < 100; i++) {
        const f = fixtures[i % fixtures.length]
        if (!f) throw new Error('no fixture')
        validateManifestFile(f.source, f.name)
      }
    },
    {
      // 1s timing window keeps run-time bounded on slow CI workers while
      // still giving stable mean.
      time: 1000,
      iterations: 50,
      warmupIterations: 5,
      warmupTime: 200,
    },
  )
})
