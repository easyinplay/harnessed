import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

describe('workflows/defaults.yaml', () => {
  const defaults = parseYaml(
    readFileSync(resolve(__dirname, '../../workflows/defaults.yaml'), 'utf8'),
  ) as {
    schema_version: string
    ralph_max_iterations: Record<string, Record<string, number>>
    hard_upper_limit: number
  }

  it('schema_version literal match', () => {
    expect(defaults.schema_version).toBe('harnessed.defaults.v1')
  })

  it('ralph_max_iterations workflow buckets present', () => {
    const workflows = Object.keys(defaults.ralph_max_iterations)
    expect(workflows).toContain('research')
    expect(workflows).toContain('retro')
  })

  it('all values within 1-100 hard upper limit', () => {
    for (const wf of Object.values(defaults.ralph_max_iterations)) {
      for (const value of Object.values(wf)) {
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(defaults.hard_upper_limit)
      }
    }
  })
})
