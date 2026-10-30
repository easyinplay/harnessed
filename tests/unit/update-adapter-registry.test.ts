import { describe, expect, it, vi } from 'vitest'
import {
  executeRegisteredUpdate,
  getUpdateAdapter,
  updateAdapterRegistry,
} from '../../src/cli/lib/updateAdapters/registry.js'
import type {
  UpdateAdapterPlan,
  UpdateObservation,
} from '../../src/cli/lib/updateAdapters/types.js'
import { buildUpdateResult, type UpdateResult } from '../../src/cli/lib/updateResult.js'

const plan = (componentId: string): UpdateAdapterPlan => ({
  componentId,
  mode: 'apply',
  host: 'codex',
  runtime: 'node',
  scope: 'global',
  cwd: process.cwd(),
})

describe('typed update adapter registry', () => {
  it('registers GSD and returns structured unsupported for other components', async () => {
    expect(getUpdateAdapter('gsd')).toBe(updateAdapterRegistry.gsd)

    const verifyRuntime = vi.fn()
    const result = await executeRegisteredUpdate(plan('ctx7'), {
      observe: vi.fn(
        async (): Promise<UpdateObservation> => ({ kind: 'unknown', reasonCode: 'unused' }),
      ),
      install: vi.fn(),
      verifyRuntime,
    })

    expect(result).toMatchObject<Partial<UpdateResult>>({ status: 'partial' })
    expect(result.components).toEqual([
      expect.objectContaining({
        id: 'ctx7',
        status: 'unsupported',
        reasonCode: 'adapter-not-reviewed',
        verified: false,
      }),
    ])
    expect(verifyRuntime).not.toHaveBeenCalled()
  })

  it('uses the updateResult contract for unsupported output', async () => {
    const result = await executeRegisteredUpdate(plan('planning-with-files'), {
      observe: vi.fn(),
      install: vi.fn(),
      verifyRuntime: vi.fn(),
    })

    expect(
      buildUpdateResult({ ...plan('planning-with-files'), components: result.components }),
    ).toEqual(result)
  })
})
