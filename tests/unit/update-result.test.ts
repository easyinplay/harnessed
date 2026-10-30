import { describe, expect, it } from 'vitest'
import {
  buildUpdateResult,
  createUpdateComponent,
  createUpdateError,
  getUpdateExitCode,
  type UpdateComponentStatus,
} from '../../src/cli/lib/updateResult.js'

const context = { mode: 'apply', host: 'codex', runtime: 'node' } as const

describe('update result contract', () => {
  it.each<{
    states: UpdateComponentStatus[]
    status: string
    code: number
  }>([
    { states: ['current', 'updated', 'not-installed'], status: 'complete', code: 0 },
    { states: ['current'], status: 'complete', code: 0 },
    { states: ['updated'], status: 'complete', code: 0 },
    { states: ['not-installed'], status: 'complete', code: 0 },
    { states: ['planned'], status: 'planned', code: 0 },
    { states: ['planned', 'planned'], status: 'planned', code: 0 },
    { states: ['planned', 'current', 'updated', 'not-installed'], status: 'planned', code: 0 },
    { states: ['unsupported'], status: 'partial', code: 1 },
    { states: ['retained'], status: 'partial', code: 1 },
    { states: ['unsupported', 'retained'], status: 'partial', code: 1 },
    { states: ['planned', 'unsupported'], status: 'partial', code: 1 },
    { states: ['planned', 'retained'], status: 'partial', code: 1 },
    { states: ['failed', 'current'], status: 'partial', code: 1 },
    { states: ['failed', 'updated'], status: 'partial', code: 1 },
    { states: ['failed', 'planned'], status: 'partial', code: 1 },
    { states: ['failed', 'unsupported'], status: 'partial', code: 1 },
    { states: ['failed', 'retained'], status: 'partial', code: 1 },
    { states: ['failed', 'not-installed'], status: 'partial', code: 1 },
    { states: ['failed', 'planned', 'unsupported', 'retained'], status: 'partial', code: 1 },
    { states: ['failed'], status: 'failed', code: 1 },
    { states: ['failed', 'failed'], status: 'failed', code: 1 },
    { states: [], status: 'failed', code: 1 },
  ])('$states => $status / exit $code', ({ states, status, code }) => {
    for (const ordered of [states, [...states].reverse()]) {
      const components = ordered.map((state, index) =>
        createUpdateComponent({ id: `part-${index}`, status: state }),
      )
      const result = buildUpdateResult({ ...context, components })
      expect(result.status).toBe(status)
      expect(getUpdateExitCode(result)).toBe(code)
      if (states.length === 0) expect(result.error?.reasonCode).toBe('no-components')
    }
  })

  it.each(['arguments', 'protocol', 'fatal'] as const)('%s overrides components', (kind) => {
    for (const components of [[], [createUpdateComponent({ id: 'self', status: 'updated' })]]) {
      const cause = new Error('Stopped')
      cause.cause = cause
      Object.assign(cause, { metadata: 1n })
      const error = createUpdateError(cause, kind, 'stopped')
      const result = buildUpdateResult({ ...context, components, error })
      expect(result.status).toBe('failed')
      expect(result.components).toEqual(components)
      expect(getUpdateExitCode(result)).toBe(kind === 'fatal' ? 1 : 2)
      expect(JSON.parse(JSON.stringify(result)).error).toEqual({
        kind,
        reasonCode: 'stopped',
        message: 'Stopped',
      })
    }
  })

  it('emits the exact schema with null unknown versions', () => {
    const result = buildUpdateResult({
      ...context,
      components: [createUpdateComponent({ id: 'gsd', status: 'unsupported' })],
    })
    expect(JSON.parse(JSON.stringify(result))).toEqual({
      schemaVersion: 1,
      operation: 'update',
      ...context,
      status: 'partial',
      components: [
        {
          id: 'gsd',
          status: 'unsupported',
          before: null,
          target: null,
          after: null,
          reasonCode: null,
          verified: false,
          restartRequired: false,
        },
      ],
      warnings: [],
      error: null,
    })
  })

  it('preserves observed versions and verification evidence', () => {
    const component = {
      id: 'self',
      status: 'updated' as const,
      before: '1.0.0',
      target: '2.0.0',
      after: '2.0.0',
      reasonCode: 'verified',
      verified: true,
      restartRequired: true,
    }
    const result = buildUpdateResult({ ...context, components: [component], warnings: ['Restart'] })
    expect(result.components).toEqual([component])
    expect(result.warnings).toEqual(['Restart'])
  })

  it('normalizes explicit unknown versions without dropping observed versions', () => {
    const component = createUpdateComponent({
      id: 'gsd',
      status: 'planned',
      before: null,
      target: '2.0.0',
      after: undefined,
      reasonCode: 'update-available',
      verified: true,
      restartRequired: true,
    })
    expect(JSON.parse(JSON.stringify(component))).toEqual({
      id: 'gsd',
      status: 'planned',
      before: null,
      target: '2.0.0',
      after: null,
      reasonCode: 'update-available',
      verified: true,
      restartRequired: true,
    })
  })

  it.each(['check', 'dry-run', 'apply'] as const)('preserves %s request context', (mode) => {
    const result = buildUpdateResult({
      mode,
      host: 'claude',
      runtime: 'compiled',
      components: [createUpdateComponent({ id: 'self', status: 'current' })],
    })
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({
      schemaVersion: 1,
      operation: 'update',
      mode,
      host: 'claude',
      runtime: 'compiled',
      status: 'complete',
      warnings: [],
      error: null,
    })
  })

  it('preserves a thrown string as a JSON-safe fatal message', () => {
    const result = buildUpdateResult({
      ...context,
      components: [],
      error: createUpdateError('Update interrupted\nretry later'),
    })
    expect(JSON.parse(JSON.stringify(result)).error).toEqual({
      kind: 'fatal',
      reasonCode: 'update-failed',
      message: 'Update interrupted\nretry later',
    })
    expect(result.status).toBe('failed')
    expect(getUpdateExitCode(result)).toBe(1)
  })

  it('normalizes an Error with an unserializable message', () => {
    const cause = Object.assign(new Error('Unsafe message'), { message: 1n })
    const error = createUpdateError(cause)
    expect(error.message).toBe('Unknown update error')
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      kind: 'fatal',
      reasonCode: 'update-failed',
      message: 'Unknown update error',
    })
  })

  it('normalizes an Error whose message cannot be read', () => {
    const cause = new Error('Unsafe message')
    Object.defineProperty(cause, 'message', {
      get() {
        throw new Error('message getter failed')
      },
    })

    expect(createUpdateError(cause)).toEqual({
      kind: 'fatal',
      reasonCode: 'update-failed',
      message: 'Unknown update error',
    })
  })

  it.each([null, undefined, 1n, {}])('serializes unknown thrown value %#', (cause) => {
    const error = createUpdateError(cause)
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      kind: 'fatal',
      reasonCode: 'update-failed',
      message: 'Unknown update error',
    })
  })
})
