import { describe, expect, it } from 'vitest'
import { assessScale } from '../../src/checkpoint/scale.js'

describe('assessScale', () => {
  it('light when all metrics under threshold', () => {
    expect(assessScale({ changedFiles: 5, firedSubs: 4, requirements: 3 })).toBe('light')
  })
  it('full when changedFiles > 5', () => {
    expect(assessScale({ changedFiles: 6, firedSubs: 0, requirements: 0 })).toBe('full')
  })
  it('full when firedSubs > 4', () => {
    expect(assessScale({ changedFiles: 0, firedSubs: 5, requirements: 0 })).toBe('full')
  })
  it('full when requirements > 3', () => {
    expect(assessScale({ changedFiles: 0, firedSubs: 0, requirements: 4 })).toBe('full')
  })
  it('light when everything is zero (all signals absent)', () => {
    expect(assessScale({ changedFiles: 0, firedSubs: 0, requirements: 0 })).toBe('light')
  })
})
