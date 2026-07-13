import assert from 'node:assert/strict'
import { test } from 'node:test'
import { max, mean, min, sum } from '../src/stats.mjs'

test('sum/mean/min/max on a simple series', () => {
  const v = [4, 1, 9, 7, 3, 5]
  assert.equal(sum(v), 29)
  assert.ok(Math.abs(mean(v) - 29 / 6) < 1e-12)
  assert.equal(min(v), 1)
  assert.equal(max(v), 9)
})

test('rejects empty input and non-numbers', () => {
  assert.throws(() => mean([]), /non-empty/)
  assert.throws(() => min(['x']), /not a finite number/)
})
