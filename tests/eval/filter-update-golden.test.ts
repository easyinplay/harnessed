// `eval --filter X --update-golden` must only touch X's golden.
//
// The suite loop used to apply --filter to RESULTS: its "cheap pre-filter" had an
// empty body, so every scenario still ran, and runScenarioDir writes the golden
// whenever updateGolden is set. Filtering to one scenario while re-recording
// silently rewrote every golden in the suite — including formatting churn that
// then has to be biome'd back, and any semantic drift in scenarios nobody meant
// to re-record.

import { cpSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runEvalSuite } from '../../src/eval/runner.js'

const SRC = join(process.cwd(), 'fixtures', 'eval')

describe('runEvalSuite — --filter is applied BEFORE a scenario runs', () => {
  it('re-recording one scenario leaves every other golden byte-identical', async () => {
    const suite = mkdtempSync(join(tmpdir(), 'eval-filter-'))
    cpSync(join(SRC, 'serial-order-guard'), join(suite, 'serial-order-guard'), { recursive: true })
    cpSync(join(SRC, 'smoke-gates-verify'), join(suite, 'smoke-gates-verify'), { recursive: true })

    // A sentinel golden that any write would destroy — proves "not written",
    // not merely "written back with the same content".
    const untouched = join(suite, 'smoke-gates-verify', 'golden.json')
    const SENTINEL = '{"sentinel":"must-survive"}\n'
    writeFileSync(untouched, SENTINEL, 'utf8')
    const before = statSync(untouched).mtimeMs

    const result = await runEvalSuite(suite, { filter: 'serial-order-guard', updateGolden: true })

    expect(result.results.map((r) => r.name)).toEqual(['serial-order-guard'])
    expect(readFileSync(untouched, 'utf8')).toBe(SENTINEL)
    expect(statSync(untouched).mtimeMs).toBe(before)
  })

  it('a filter matching only the scenario NAME (not the dir) still selects it', async () => {
    const suite = mkdtempSync(join(tmpdir(), 'eval-filter-name-'))
    // directory name deliberately does not contain the filter string
    cpSync(join(SRC, 'serial-order-guard'), join(suite, 'renamed-dir'), { recursive: true })
    const result = await runEvalSuite(suite, { filter: 'serial-order-guard' })
    expect(result.results).toHaveLength(1)
  })
})
