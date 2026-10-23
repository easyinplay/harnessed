import { describe, expect, it, vi } from 'vitest'
import * as assets from '../../src/platform/assetsRoot.js'
import { isBunRuntime } from '../../src/platform/runtime.js'

describe('isBunRuntime', () => {
  it('does not evaluate the compiled seam on Node, including partial asset mocks', () => {
    const compiled = vi.spyOn(assets, 'isCompiledRuntime').mockImplementation(() => {
      throw new Error('compiled seam must remain lazy on Node')
    })
    try {
      expect(isBunRuntime({ node: '22.0.0' })).toBe(false)
      expect(isBunRuntime({ bun: '' })).toBe(false)
      expect(compiled).not.toHaveBeenCalled()
    } finally {
      compiled.mockRestore()
    }
  })

  it('recognizes only a structured, nonempty Bun version on a package runtime', () => {
    expect(isBunRuntime({ bun: '1.4.4', node: '24.0.0' }, false)).toBe(true)
    expect(isBunRuntime({ node: '24.0.0' }, false)).toBe(false)
    expect(isBunRuntime({ bun: '' }, false)).toBe(false)
    expect(isBunRuntime({ bun: '  ' }, false)).toBe(false)
    expect(isBunRuntime({ bun: '1.4.4' }, true)).toBe(false)
  })
})
