// Numeric stats over an array of finite numbers. Every function validates its
// input the same way: non-empty array of finite numbers, otherwise throw.

function assertNumbers(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('expected a non-empty array of numbers')
  }
  for (const v of values) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new Error(`not a finite number: ${v}`)
    }
  }
}

export function sum(values) {
  assertNumbers(values)
  return values.reduce((a, b) => a + b, 0)
}

export function mean(values) {
  assertNumbers(values)
  return sum(values) / values.length
}

export function min(values) {
  assertNumbers(values)
  return Math.min(...values)
}

export function max(values) {
  assertNumbers(values)
  return Math.max(...values)
}
