// Acceptance tests for the NEW --median feature. These are intentionally RED
// until the feature is implemented (see task.md). Do not modify this file.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('stats.mjs exports median() — odd count picks the middle value', async () => {
  const { median } = await import('../src/stats.mjs')
  assert.equal(typeof median, 'function', 'median must be exported from src/stats.mjs')
  assert.equal(median([9, 1, 5]), 5)
})

test('median() with an even count averages the two middle values', async () => {
  const { median } = await import('../src/stats.mjs')
  assert.equal(median([4, 1, 9, 7, 3, 5]), 4.5)
})

test('median() sorts numerically, not lexicographically', async () => {
  const { median } = await import('../src/stats.mjs')
  assert.equal(median([100, 2, 30]), 30)
})

test('CLI accepts --median and reports it alongside other stats', () => {
  const out = execFileSync(
    'node',
    [join(root, 'src', 'cli.mjs'), join(root, 'data.csv'), '--median', '--min'],
    {
      encoding: 'utf8',
    },
  )
  assert.deepEqual(JSON.parse(out.trim()), { median: 4.5, min: 1 })
})
