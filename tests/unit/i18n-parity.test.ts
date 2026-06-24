// Phase 32 T32.1 — messages/en.json ↔ messages/zh-Hans.json key parity.
// Pins full key-set equality so a future en addition forces a zh translation
// (and a stale zh-only key is caught). Reads the real shipped JSON, not fixtures.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? flattenKeys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

function load(name: string): Record<string, unknown> {
  const p = fileURLToPath(new URL(`../../messages/${name}`, import.meta.url))
  return JSON.parse(readFileSync(p, 'utf8'))
}

describe('messages en↔zh-Hans key parity', () => {
  const enKeys = new Set(flattenKeys(load('en.json')))
  const zhKeys = new Set(flattenKeys(load('zh-Hans.json')))

  it('zh-Hans has every en key (no missing)', () => {
    const missing = [...enKeys].filter((k) => !zhKeys.has(k)).sort()
    expect(missing).toEqual([])
  })

  it('zh-Hans has no key absent from en (no extra/stale)', () => {
    const extra = [...zhKeys].filter((k) => !enKeys.has(k)).sort()
    expect(extra).toEqual([])
  })

  it('key counts match', () => {
    expect(zhKeys.size).toBe(enKeys.size)
  })
})
