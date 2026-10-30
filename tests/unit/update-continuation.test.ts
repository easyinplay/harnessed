import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  type ContinuationRunOptions,
  createUpdateContinuation,
  decodeUpdateContinuation,
  encodeUpdateContinuation,
  launchUpdateContinuation,
  runUpdatePhaseOne,
  UPDATE_CONTINUATION_PROTOCOL_VERSION,
} from '../../src/cli/lib/updateContinuation.js'

describe('update continuation protocol', () => {
  const languageFixture = () =>
    createUpdateContinuation({
      nonce: 'l'.repeat(32),
      targetKey: 'target-key',
      channel: 'package',
      mode: 'apply',
      host: 'codex',
      runtime: 'node',
      scope: 'all',
      nonInteractive: true,
      json: true,
      createdAt: 123,
    })

  it.each(['en', 'zh-Hans'] as const)('round-trips the canonical %s locale', (lang) => {
    const continuation = createUpdateContinuation({ ...languageFixture(), lang })
    expect(decodeUpdateContinuation(encodeUpdateContinuation(continuation))).toMatchObject({ lang })
  })

  it('decodes older payloads without a locale', () => {
    const encoded = Buffer.from(JSON.stringify(languageFixture())).toString('base64url')
    expect(decodeUpdateContinuation(encoded)).not.toHaveProperty('lang')
  })

  it.each(
    [null, {}, [], 'zh-CN', 'fr', ''].map((lang) => ({ lang })),
  )('rejects noncanonical wire locale $lang', ({ lang }) => {
    const encoded = Buffer.from(JSON.stringify({ ...languageFixture(), lang })).toString(
      'base64url',
    )
    expect(() => decodeUpdateContinuation(encoded)).toThrow(/locale/i)
  })

  it('serializes only the approved continuation fields', () => {
    const continuation = createUpdateContinuation({
      nonce: 'a'.repeat(32),
      targetKey: 'target-key',
      channel: 'compiled',
      mode: 'apply',
      host: 'codex',
      runtime: 'compiled',
      scope: 'all',
      nonInteractive: true,
      json: true,
      createdAt: 123,
      arbitraryCommand: 'Remove-Item -Recurse C:\\',
    } as never)

    expect(continuation).toEqual({
      protocol: 'harnessed-update-continuation',
      protocolVersion: UPDATE_CONTINUATION_PROTOCOL_VERSION,
      nonce: 'a'.repeat(32),
      targetKey: 'target-key',
      channel: 'compiled',
      mode: 'apply',
      host: 'codex',
      runtime: 'compiled',
      scope: 'all',
      nonInteractive: true,
      json: true,
      createdAt: 123,
    })
    expect('arbitraryCommand' in continuation).toBe(false)
  })

  it('rejects unknown fields and protocol mismatches', () => {
    const valid = createUpdateContinuation({
      nonce: 'b'.repeat(32),
      targetKey: 'target-key',
      channel: 'package',
      mode: 'check',
      host: 'claude',
      runtime: 'node',
      scope: 'self',
      nonInteractive: false,
      json: true,
      createdAt: 456,
    })

    const encodedUnknown = Buffer.from(JSON.stringify({ ...valid, command: 'whoami' })).toString(
      'base64url',
    )
    expect(() => decodeUpdateContinuation(encodedUnknown)).toThrow(/unknown field/i)

    const encodedWrongVersion = Buffer.from(
      JSON.stringify({ ...valid, protocolVersion: 999 }),
    ).toString('base64url')
    expect(() => decodeUpdateContinuation(encodedWrongVersion)).toThrow(/protocol version/i)
  })
})

describe('launchUpdateContinuation', () => {
  it.each([
    'compiled',
    'package',
  ] as const)('pins explicit locale in shell-free %s argv', async (channel) => {
    const run = vi.fn(async (_file: string, _args: string[], _options: ContinuationRunOptions) => ({
      exitCode: 0,
      signal: null,
    }))
    const continuation = createUpdateContinuation({
      nonce: 'l'.repeat(32),
      targetKey: 'target-key',
      channel,
      mode: 'apply',
      host: 'codex',
      runtime: channel === 'compiled' ? 'compiled' : 'node',
      scope: 'all',
      nonInteractive: true,
      json: true,
      createdAt: 123,
      lang: 'zh-Hans',
    })
    await launchUpdateContinuation(
      {
        executablePath: 'C:\\Program Files\\Harnessed\\runtime.exe',
        ...(channel === 'package' ? { entryPath: 'C:\\Harnessed\\cli.mjs' } : {}),
        continuation,
        env: { HARNESSED_LANG: 'en' },
      },
      { run },
    )
    const [, args, options] = run.mock.calls[0] ?? []
    expect(args).toEqual([
      ...(channel === 'package' ? ['C:\\Harnessed\\cli.mjs'] : []),
      '--lang',
      'zh-Hans',
      'update',
      '--update-continuation',
      expect.any(String),
    ])
    expect(decodeUpdateContinuation(args?.at(-1) ?? '').lang).toBe('zh-Hans')
    expect(options?.shell).toBe(false)
  })

  it('launches a compiled P2 by absolute Windows path without shell parsing', async () => {
    const run = vi.fn(
      async (_executable: string, _args: string[], _options: ContinuationRunOptions) => ({
        exitCode: 0,
        signal: null,
      }),
    )
    const continuation = createUpdateContinuation({
      nonce: 'c'.repeat(32),
      targetKey: 'target-key',
      channel: 'compiled',
      mode: 'apply',
      host: 'codex',
      runtime: 'compiled',
      scope: 'all',
      nonInteractive: true,
      json: true,
      createdAt: 789,
    })

    const result = await launchUpdateContinuation(
      {
        executablePath: 'C:\\Program Files\\Harnessed\\harnessed.exe',
        continuation,
      },
      { run },
    )

    expect(result).toEqual({ status: 'completed', exitCode: 0 })
    expect(run).toHaveBeenCalledOnce()
    const [executable, args, options] = run.mock.calls[0] ?? []
    expect(executable).toBe('C:\\Program Files\\Harnessed\\harnessed.exe')
    expect(args?.slice(0, 2)).toEqual(['update', '--update-continuation'])
    expect(decodeUpdateContinuation(args?.[2] ?? '')).toEqual(continuation)
    expect(options).toMatchObject({ shell: false, windowsHide: true })
  })

  it('launches a package P2 through absolute runtime and entry paths with the same result shape', async () => {
    const run = vi.fn(
      async (_executable: string, _args: string[], _options: ContinuationRunOptions) => ({
        exitCode: 7,
        signal: null,
      }),
    )
    const continuation = createUpdateContinuation({
      nonce: 'd'.repeat(32),
      targetKey: 'target-key',
      channel: 'package',
      mode: 'apply',
      host: null,
      runtime: 'node',
      scope: 'self',
      nonInteractive: true,
      json: true,
      createdAt: 999,
    })

    const result = await launchUpdateContinuation(
      {
        executablePath: 'C:\\Program Files\\nodejs\\node.exe',
        entryPath:
          'C:\\Users\\Example User\\AppData\\Roaming\\npm\\node_modules\\harnessed\\dist\\cli.mjs',
        continuation,
      },
      { run },
    )

    expect(result).toEqual({ status: 'failed', reason: 'child-exit', exitCode: 7, signal: null })
    const [, args] = run.mock.calls[0] ?? []
    expect(args?.[0]).toBe(
      'C:\\Users\\Example User\\AppData\\Roaming\\npm\\node_modules\\harnessed\\dist\\cli.mjs',
    )
    expect(args?.slice(1, 3)).toEqual(['update', '--update-continuation'])
  })

  it('refuses relative P2 paths before spawning', async () => {
    const run = vi.fn(
      async (_executable: string, _args: string[], _options: ContinuationRunOptions) => ({
        exitCode: 0,
        signal: null,
      }),
    )
    const continuation = createUpdateContinuation({
      nonce: 'e'.repeat(32),
      targetKey: 'target-key',
      channel: 'compiled',
      mode: 'apply',
      host: 'codex',
      runtime: 'compiled',
      scope: 'all',
      nonInteractive: true,
      json: true,
      createdAt: 1000,
    })

    await expect(
      launchUpdateContinuation({ executablePath: 'harnessed', continuation }, { run }),
    ).rejects.toThrow(/absolute/i)
    expect(run).not.toHaveBeenCalled()
  })
})

describe('runUpdatePhaseOne', () => {
  it('does not launch P2 after self-update failure', async () => {
    const root = await mkdtemp(join(tmpdir(), 'harnessed-update-p1-'))
    const launch = vi.fn()
    const result = await runUpdatePhaseOne({
      lock: { stateRoot: root, target: 'C:\\Harnessed\\harnessed.exe' },
      continuation: {
        channel: 'compiled',
        mode: 'apply',
        host: 'codex',
        runtime: 'compiled',
        scope: 'all',
        nonInteractive: true,
        json: true,
      },
      updateSelf: async () => ({ status: 'failed', reason: 'signature-invalid' }),
      launch,
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'self-update-failed',
      selfUpdate: { status: 'failed', reason: 'signature-invalid' },
    })
    expect(launch).not.toHaveBeenCalled()
  })

  it('launches P2 even when self is already current', async () => {
    const root = await mkdtemp(join(tmpdir(), 'harnessed-update-p1-'))
    const launch = vi.fn(async () => ({ status: 'completed', exitCode: 0 }) as const)
    const result = await runUpdatePhaseOne({
      lock: { stateRoot: root, target: 'C:\\Harnessed\\harnessed.exe' },
      continuation: {
        channel: 'compiled',
        mode: 'apply',
        host: 'codex',
        runtime: 'compiled',
        scope: 'all',
        nonInteractive: true,
        json: true,
      },
      updateSelf: async () => ({ status: 'current', version: '5.0.5' }),
      launch,
    })

    expect(result.status).toBe('complete')
    expect(launch).toHaveBeenCalledOnce()
  })

  it('reports partial when replacement succeeds but P2 handoff fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'harnessed-update-p1-'))
    const order: string[] = []
    const result = await runUpdatePhaseOne({
      lock: { stateRoot: root, target: 'C:\\Harnessed\\harnessed.exe' },
      continuation: {
        channel: 'compiled',
        mode: 'apply',
        host: 'codex',
        runtime: 'compiled',
        scope: 'all',
        nonInteractive: true,
        json: true,
      },
      updateSelf: async () => ({ status: 'updated', from: '5.0.4', to: '5.0.5' }),
      launch: async () => {
        order.push('launch-finished')
        return { status: 'failed', reason: 'spawn-failed', exitCode: null, signal: null }
      },
      finalizeSelfUpdate: async () => {
        order.push('finalized')
      },
    })

    expect(result.status).toBe('partial')
    expect(order).toEqual(['launch-finished', 'finalized'])
  })
})
