// Phase v3.0-3.3 W0 T3.3.W0.9 — after-output.ts hook fixture (6).
// Tests BLUF / em-dash / emoji / sycophantic / end-recap heuristic warnings.
// NOTE: v3.0 unit-test only per K5 + D-09 superset commitment (M-3 advisory).

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type OutputHookCtx,
  runAfterOutputHook,
} from '../../../src/discipline/enforcement/after-output.js'
import { _clearDisciplineCache } from '../../../src/workflow/disciplineLoader.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearDisciplineCache()
})

function ctx(overrides: Partial<OutputHookCtx> = {}): OutputHookCtx {
  return {
    responseText: 'Short answer.',
    responseTarget: 'chat',
    userRequestedEmoji: false,
    packageRoot: PACKAGE_ROOT,
    ...overrides,
  }
}

describe('discipline/enforcement/after-output', () => {
  it('1. responseTarget=file → no warnings (chat-only enforcement)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const warns = await runAfterOutputHook(ctx({ responseTarget: 'file' }))
    expect(warns).toEqual([])
  })

  it('2. em-dash detected → warn emitted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const warns = await runAfterOutputHook(ctx({ responseText: 'Hello —— world.' }))
    expect(warns.some((w) => w.includes('em-dash'))).toBe(true)
  })

  it('3. emoji without user request → warn emitted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const warns = await runAfterOutputHook(ctx({ responseText: 'Done. 🎉' }))
    expect(warns.some((w) => w.includes('emoji'))).toBe(true)
  })

  it('4. emoji with userRequestedEmoji=true → no emoji warn', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const warns = await runAfterOutputHook(
      ctx({ responseText: 'Done. 🎉', userRequestedEmoji: true }),
    )
    expect(warns.some((w) => w.includes('emoji'))).toBe(false)
  })

  it('5. sycophantic phrase detected → warn emitted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const warns = await runAfterOutputHook(ctx({ responseText: '好问题! Done.' }))
    expect(warns.some((w) => w.includes('sycophantic'))).toBe(true)
  })

  it('6. end-recap detected → warn emitted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const warns = await runAfterOutputHook(ctx({ responseText: 'Some answer. ## 总结 done.' }))
    expect(warns.some((w) => w.includes('end recap'))).toBe(true)
  })

  it('7. BLUF missing — first sentence > 100 char → warn emitted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const longFirst = 'a'.repeat(150)
    const warns = await runAfterOutputHook(ctx({ responseText: longFirst }))
    expect(warns.some((w) => w.includes('BLUF'))).toBe(true)
  })
})
