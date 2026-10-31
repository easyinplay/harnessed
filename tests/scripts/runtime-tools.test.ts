import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RuntimeChannel } from '../../scripts/benchmark-runtime.mjs'
import {
  benchmarkChannel,
  cleanupFixture,
  createFixture,
  parseOptions,
  percentile,
  runCommand,
} from '../../scripts/benchmark-runtime.mjs'
import { createRuntimeTraps, parseOwnedHook } from '../../scripts/runtime-channel-smoke.mjs'

const probe = resolve('tests/fixtures/runtime-tools/probe.mjs')
const args = ['--node-cli', probe, '--binary', process.execPath]

describe('isolated fixtures and bounded subprocesses', () => {
  it('does not inherit secrets, configuration, Node preloads or proxy variables', async () => {
    const fixture = createFixture({
      ...process.env,
      ANTHROPIC_API_KEY: 'secret',
      CODEX_HOME: 'outside',
      HARNESSED_ASSETS_OVERRIDE: 'outside',
      NODE_OPTIONS: '--invalid-option',
      HTTPS_PROXY: 'secret',
    })
    try {
      const result = await runCommand(process.execPath, [probe, 'env'], fixture)
      expect(result.exitCode).toBe(0)
      const env = JSON.parse(result.stdout)
      expect(env.HOME).toBe(join(fixture.root, 'home'))
      expect(env.USERPROFILE).toBe(env.HOME)
      expect(env.CODEX_HOME).toBe(join(fixture.root, 'codex'))
      expect(env.HARNESSED_ROOT_OVERRIDE).toBe(join(fixture.root, 'state'))
      expect(env.npm_config_userconfig).not.toBe(env.npm_config_globalconfig)
      expect(existsSync(env.npm_config_userconfig)).toBe(true)
      expect(existsSync(env.npm_config_globalconfig)).toBe(true)
      for (const key of [
        'ANTHROPIC_API_KEY',
        'NODE_OPTIONS',
        'HTTPS_PROXY',
        'HARNESSED_ASSETS_OVERRIDE',
      ])
        expect(env[key]).toBeUndefined()
      expect(fixture.cwd).not.toBe(resolve('.'))
      expect(existsSync(join(fixture.cwd, '.git'))).toBe(true)
      expect(existsSync(join(fixture.home, '.claude'))).toBe(true)
    } finally {
      cleanupFixture(fixture)
    }
    expect(existsSync(fixture.root)).toBe(false)
  })

  it('refuses cleanup of unowned, nested or forged roots', () => {
    const fixture = createFixture()
    try {
      expect(() => cleanupFixture({ root: resolve('.') })).toThrow(/owned|fixture/i)
      expect(() => cleanupFixture({ ...fixture, root: fixture.cwd })).toThrow(/owned|fixture/i)
      expect(() => cleanupFixture({ ...fixture })).toThrow(/owned|fixture/i)
      writeFileSync(join(fixture.root, 'retain'), 'retain')
      expect(readFileSync(join(fixture.root, 'retain'), 'utf8')).toBe('retain')
      expect(lstatSync(fixture.root).isSymbolicLink()).toBe(false)
    } finally {
      cleanupFixture(fixture)
    }
  })

  it('refuses a junction-swapped owned root without touching the target', () => {
    const fixture = createFixture()
    const target = createFixture()
    const sentinel = join(target.cwd, 'retain')
    writeFileSync(sentinel, 'retain')
    rmSync(fixture.root, { recursive: true, force: true })
    try {
      symlinkSync(target.cwd, fixture.root, process.platform === 'win32' ? 'junction' : 'dir')
      expect(() => cleanupFixture(fixture)).toThrow(/unsafe/i)
      expect(readFileSync(sentinel, 'utf8')).toBe('retain')
    } finally {
      if (lstatSync(fixture.root).isSymbolicLink()) unlinkSync(fixture.root)
      mkdirSync(fixture.root, { recursive: true })
      cleanupFixture(fixture)
      cleanupFixture(target)
    }
  })

  it('caps hanging children and output while preserving nonzero exit codes', async () => {
    const fixture = createFixture()
    try {
      const hung = await runCommand(process.execPath, [probe, 'hang'], fixture, {
        timeoutMs: 300,
        maxOutputBytes: 2048,
      })
      expect(hung.timedOut).toBe(true)
      expect(hung.durationMs).toBeLessThan(6000)
      const flood = await runCommand(process.execPath, [probe, 'flood'], fixture, {
        timeoutMs: 5000,
        maxOutputBytes: 1024,
      })
      expect(flood.outputLimitExceeded).toBe(true)
      expect(Buffer.byteLength(flood.stdout) + Buffer.byteLength(flood.stderr)).toBeLessThanOrEqual(
        1024,
      )
      expect((await runCommand(process.execPath, [probe, 'exit'], fixture)).exitCode).toBe(7)
      expect(flood.rssBytes).toBeNull()
      expect(flood.rssStatus).toBe('unsupported')
    } finally {
      cleanupFixture(fixture)
    }
  })

  it.each([
    { mode: 'invalid-utf8', cap: 1024, raw: 1024, limited: true, stdout: '\ufffd'.repeat(341) },
    { mode: 'truncated-utf8', cap: 1, raw: 2, limited: true, stdout: '' },
    { mode: 'mixed-utf8', cap: 1024, raw: 1024, limited: true, stdout: '\ufffd'.repeat(341) },
    { mode: 'split-utf8', cap: 3, raw: 3, limited: false, stdout: '\u20ac' },
  ])('caps decoded UTF-8 across both streams: $mode', async ({
    mode,
    cap,
    raw,
    limited,
    stdout,
  }) => {
    const fixture = createFixture()
    try {
      const result = await runCommand(process.execPath, [probe, mode], fixture, {
        timeoutMs: 5000,
        maxOutputBytes: cap,
      })
      expect(result.stdout).toBe(stdout)
      expect(result.stderr).toBe('')
      expect(
        Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr),
      ).toBeLessThanOrEqual(cap)
      expect(result.rawOutputBytes).toBe(raw)
      expect(result.returnedOutputBytes).toBe(Buffer.byteLength(stdout))
      expect(result.outputLimitExceeded).toBe(limited)
    } finally {
      cleanupFixture(fixture)
    }
  })

  it.skipIf(process.platform !== 'win32')(
    'reaps a timed-out Windows child and its grandchild',
    async () => {
      const fixture = createFixture()
      let childPid: number | undefined
      try {
        const result = await runCommand(process.execPath, [probe, 'grandchild'], fixture, {
          timeoutMs: 2000,
        })
        childPid = JSON.parse(result.stdout).childPid
        if (childPid === undefined) throw new Error('Grandchild did not start')
        const pid = childPid
        expect(result.timedOut).toBe(true)
        expect(result.error).toBeNull()
        expect(() => process.kill(pid, 0)).toThrow()
      } finally {
        if (childPid !== undefined) {
          try {
            process.kill(childPid, 'SIGKILL')
          } catch {}
        }
        cleanupFixture(fixture)
      }
    },
  )

  it.skipIf(process.platform !== 'win32')(
    'reports a failed Windows killTree while still killing the direct child',
    async () => {
      const fixture = createFixture()
      try {
        fixture.env.SystemRoot = join(fixture.root, 'missing-system-root')
        const result = await runCommand(process.execPath, [probe, 'hang'], fixture, {
          timeoutMs: 300,
        })
        expect(result.timedOut).toBe(true)
        expect(result.error).toMatch(/killTree failed/)
        expect(result.durationMs).toBeLessThan(6000)
      } finally {
        cleanupFixture(fixture)
      }
    },
  )

  it('isolates channel/trial state and reports first invocation plus ten real steady samples', async () => {
    const channel: RuntimeChannel = {
      id: 'node-npm',
      executable: process.execPath,
      prefix: [probe],
      artifact: probe,
    }
    const options = parseOptions(args)
    const first = await benchmarkChannel(channel, options, 1)
    const second = await benchmarkChannel(channel, options, 2)
    expect(first.fixture.root).not.toBe(second.fixture.root)
    expect(existsSync(first.fixture.root)).toBe(false)
    expect(first.firstInvocation.exitCode).toBe(0)
    expect(first.artifact.sizeBytes).toBeGreaterThan(0)
    expect(first.ok).toBe(true)
    for (const command of first.commands) {
      expect(command.samples).toHaveLength(10)
      expect(command.exitCodes).toEqual({ '0': 10 })
      expect(command.p50Ms).toBeGreaterThan(0)
      if (command.p50Ms === null) throw new Error('Missing p50 for successful samples')
      expect(command.p95Ms).toBeGreaterThanOrEqual(command.p50Ms)
    }
  }, 60_000)
})

describe('no-external-runtime smoke safeguards', () => {
  it('accepts the approved Bun check-docs bin wrapper but not the old dist transport', () => {
    const packageRoot = resolve('npm root')
    const script = join(packageRoot, 'bin', 'harnessed-check-docs.mjs')
    const channel = { id: 'bun-explicit' as const, packageRoot }
    const binary = resolve('harnessed.exe')
    expect(
      parseOwnedHook(`"${binary.replace(/\\/g, '/')}" check-docs --hook`, 'check-docs', {
        id: 'bun-compiled',
        executable: binary,
      }),
    ).toEqual({ executable: binary, args: ['check-docs', '--hook'] })
    expect(
      parseOwnedHook('harnessed check-docs --hook', 'check-docs', { id: 'node-npm', packageRoot }),
    ).toEqual({ executable: 'harnessed', args: ['check-docs', '--hook'] })
    expect(
      parseOwnedHook(`bun "${script.replace(/\\/g, '/')}" --hook`, 'check-docs', channel),
    ).toEqual({ executable: 'bun', args: [script, '--hook'] })
    expect(() =>
      parseOwnedHook(
        `bun "${join(packageRoot, 'dist', 'cli.mjs')}" check-docs --hook`,
        'check-docs',
        channel,
      ),
    ).toThrow()
    expect(() =>
      parseOwnedHook(`bun "${script}" --hook && echo bad`, 'check-docs', channel),
    ).toThrow()
  })

  it('validates only owned registrations and rejects unexpected commands', () => {
    const npmRoot = resolve('npm root')
    const binary = resolve('harnessed binary.exe')
    expect(
      parseOwnedHook(`node "${join(npmRoot, 'bin', 'harnessed-stop-hook.mjs')}"`, 'stop-hook', {
        id: 'node-npm',
        packageRoot: npmRoot,
      }),
    ).toEqual({ executable: 'node', args: [join(npmRoot, 'bin', 'harnessed-stop-hook.mjs')] })
    expect(
      parseOwnedHook(`"${binary}" inject-state`, 'inject-state', {
        id: 'bun-compiled',
        executable: binary,
      }),
    ).toEqual({ executable: binary, args: ['inject-state'] })
    expect(
      parseOwnedHook(
        `node "${join(npmRoot, 'bin', 'harnessed-stop-hook.mjs').replace(/\\/g, '/')}"`,
        'stop-hook',
        { id: 'node-npm', packageRoot: npmRoot },
      ),
    ).toEqual({ executable: 'node', args: [join(npmRoot, 'bin', 'harnessed-stop-hook.mjs')] })
    expect(
      parseOwnedHook(`"${binary.replace(/\\/g, '/')}" inject-state`, 'inject-state', {
        id: 'bun-compiled',
        executable: binary,
      }),
    ).toEqual({ executable: binary, args: ['inject-state'] })
    expect(
      parseOwnedHook(
        `bun "${join(npmRoot, 'bin', 'harnessed-stop-hook.mjs').replace(/\\/g, '/')}"`,
        'stop-hook',
        { id: 'bun-explicit', packageRoot: npmRoot },
      ),
    ).toEqual({ executable: 'bun', args: [join(npmRoot, 'bin', 'harnessed-stop-hook.mjs')] })
    expect(() =>
      parseOwnedHook(`node "${join(npmRoot, 'bin', 'harnessed-stop-hook.mjs')}"`, 'stop-hook', {
        id: 'bun-explicit',
        packageRoot: npmRoot,
      }),
    ).toThrow()
    for (const command of [
      'bun anything',
      'node relative.mjs',
      `"${binary}" stop-hook && echo bad`,
      `"${binary}" inject-state`,
    ]) {
      expect(() =>
        parseOwnedHook(command, 'stop-hook', { id: 'bun-compiled', executable: binary }),
      ).toThrow()
    }
  })

  it('actively verifies traps while preserving explicit Node and system tools', async () => {
    const fixture = createFixture()
    try {
      const traps = await createRuntimeTraps(fixture, ['bun', 'node'])
      for (const probe of traps.probes)
        expect((await runCommand(probe.executable, probe.args, fixture)).exitCode).toBe(97)
      expect(readFileSync(traps.logPath, 'utf8')).toContain('bun')
      expect(readFileSync(traps.logPath, 'utf8')).toContain('node')
      expect((await runCommand(process.execPath, ['--version'], fixture)).exitCode).toBe(0)
      const tool = process.platform === 'win32' ? 'where.exe' : '/bin/sh'
      const toolArgs = process.platform === 'win32' ? ['cmd.exe'] : ['-c', 'exit 0']
      expect((await runCommand(tool, toolArgs, fixture)).exitCode).toBe(0)
    } finally {
      cleanupFixture(fixture)
    }
  })

  it('returns bounded structured JSON for invalid CLI arguments', async () => {
    const fixture = createFixture()
    try {
      const result = await runCommand(
        process.execPath,
        [resolve('scripts/benchmark-runtime.mjs'), ...args, '--samples', '9'],
        fixture,
      )
      expect(result.exitCode).toBe(1)
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, kind: 'benchmark-runtime' })
      expect(result.stderr).toBe('')
    } finally {
      cleanupFixture(fixture)
    }
  })
})

describe('runtime arguments and statistics', () => {
  it('requires explicit artifacts and refuses unknown, duplicate and missing arguments', () => {
    for (const input of [
      [],
      ['--node-cli', probe],
      [...args, '--oops', '1'],
      [...args, '--samples'],
      [...args, '--binary', process.execPath],
    ]) {
      expect(() => parseOptions(input)).toThrow()
    }
    expect(() =>
      parseOptions(['--node-cli', join(probe, 'missing'), '--binary', process.execPath]),
    ).toThrow()
  })

  it('enforces at least ten samples and bounded budgets', () => {
    for (const input of [
      ['--samples', '9'],
      ['--samples', '10oops'],
      ['--samples', '1.5'],
      ['--timeout-ms', '0'],
      ['--timeout-ms', '120001'],
      ['--max-output-bytes', '0'],
      ['--max-output-bytes', '8388609'],
      ['--trials', '0'],
    ])
      expect(() => parseOptions([...args, ...input])).toThrow()
    expect(parseOptions([...args, '--samples', '12', '--trials', '2']).samples).toBe(12)
    expect(parseOptions(args).samples).toBe(10)
  })

  it('uses nearest-rank percentiles without mutating observations', () => {
    const values = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5]
    expect(percentile(values, 50)).toBe(5)
    expect(percentile(values, 95)).toBe(10)
    expect(values[0]).toBe(10)
    expect(() => percentile([], 50)).toThrow()
    expect(() => percentile([Number.NaN], 50)).toThrow()
    expect(() => percentile([1], 101)).toThrow()
  })
})
