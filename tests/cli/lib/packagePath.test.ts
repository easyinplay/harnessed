// v1.0.1 T1.1 — Unit tests for getPackageRoot() resolution.
// Verifies the helper returns a path containing package.json (package root).

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPackageRoot } from '../../../src/cli/lib/packagePath.js'

describe('getPackageRoot', () => {
  it('returns a string', () => {
    expect(typeof getPackageRoot()).toBe('string')
  })

  it('resolved path contains package.json (is package root)', () => {
    const root = getPackageRoot()
    expect(existsSync(resolve(root, 'package.json'))).toBe(true)
  })

  it('resolved path contains manifests/ directory', () => {
    const root = getPackageRoot()
    expect(existsSync(resolve(root, 'manifests'))).toBe(true)
  })
})
