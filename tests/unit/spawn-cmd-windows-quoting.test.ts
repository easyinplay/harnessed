// Windows cmd.exe quoting — regression coverage for the no-extra-args spawn path.
//
// libuv quotes every argv element that contains whitespace or a quote with
// MSVCRT rules before the command line reaches CreateProcess:
//
//   cmd.exe /c npm install -g "@playwright/cli@^0.1.22"
//
// becomes
//
//   cmd.exe /c "npm install -g \"@playwright/cli@^0.1.22\""
//
// cmd.exe has no backslash escape, so the escaped quotes reach the program as
// LITERAL quotes and npm sees a doubled package name
// (""@playwright/cli@^0.1.22"") -> EINVALIDPACKAGENAME.
//
// The fix: when cmd.exe is launched WITHOUT extra args, the cmd string must be
// delivered verbatim (`windowsVerbatimArguments: true`) so cmd's own parser
// owns the quotes. The extra-args path (cli/lib/updateCoordinator.ts update
// install) keeps libuv's argv escaping on purpose — its arguments depend on
// that escaping to survive the cmd.exe boundary.
//
// Platform-independent: the host platform is forced to win32 and the assertion
// is made on the EFFECTIVE Windows command line libuv would build. The
// end-to-end proof lives in tests/integration/spawn-cmd-windows-quoting.test.ts.

import { EventEmitter } from 'node:events'
import { homedir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:child_process')>()
  return { ...original, spawn: vi.fn() }
})

import { spawn } from 'node:child_process'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const spawnMock = vi.mocked(spawn)

const OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: true,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}

function ctx(cmd: string): InstallContext {
  return {
    manifest: {
      apiVersion: 'harnessed/v1',
      kind: 'Manifest',
      metadata: { name: 'win-quoting' },
      spec: {
        type: 'cli-npm',
        component_type: 'cli-binary',
        install: { method: 'npm-cli', cmd, npm_version: '^1.0.0' },
        verify: { cmd: 'true' },
      },
    } as unknown as Manifest,
    opts: OPTS,
    level: 'L4',
    cwd: process.cwd(),
  }
}

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => FakeChild['stdout'] }
  stderr: EventEmitter & { setEncoding: (e: string) => FakeChild['stderr'] }
  kill: (sig: NodeJS.Signals) => void
}

function makeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => child.emit('close', 0))
  return child
}

/** Mirror libuv's Windows argv quoting (uv's quote_cmd_arg): an argument that
 *  contains whitespace or a quote is wrapped in double quotes and its inner
 *  quotes are backslash-escaped. */
function libuvQuoteArg(arg: string): string {
  if (arg.length > 0 && !/[\s"]/.test(arg)) return arg
  return `"${arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, '$1$1')}"`
}

/** The command line libuv hands to CreateProcess for the recorded spawn call. */
function effectiveCommandLine(call: [string, string[], Record<string, unknown>]): string {
  const [file, args, options] = call
  const verbatim = options.windowsVerbatimArguments === true
  return [file, ...(verbatim ? args : args.map(libuvQuoteArg))].join(' ')
}

function lastCall(): [string, string[], Record<string, unknown>] {
  const call = spawnMock.mock.calls.at(-1)
  if (!call) throw new Error('spawn was never called')
  return call as unknown as [string, string[], Record<string, unknown>]
}

describe('spawnCmd Windows cmd.exe quoting', () => {
  const realPlatform = process.platform
  function forcePlatform(value: NodeJS.Platform): void {
    Object.defineProperty(process, 'platform', { value, configurable: true })
  }

  beforeEach(() => {
    forcePlatform('win32')
    spawnMock.mockReset()
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: realPlatform, configurable: true })
  })

  it('delivers the cmd string to cmd.exe verbatim when no extra args are passed', async () => {
    const cmd =
      'npm install -g "@playwright/cli@^0.1.22" && playwright-cli install-browser chromium'
    spawnMock.mockReturnValueOnce(makeChild() as unknown as ReturnType<typeof spawn>)

    await spawnCmd(ctx(cmd), cmd, [], 5000)

    const call = lastCall()
    expect(call[0]).toBe('cmd.exe')
    expect(call[1]).toEqual(['/c', cmd])
    expect(call[2].windowsVerbatimArguments).toBe(true)

    // The effective Windows command line carries the manifest quotes as-is —
    // no backslash escaping, so cmd.exe's own parser hands npm the intact
    // package specifier.
    const line = effectiveCommandLine(call)
    expect(line).toBe(`cmd.exe /c ${cmd}`)
    expect(line).toContain('"@playwright/cli@^0.1.22"')
    expect(line).not.toContain('\\"')
  })

  it('keeps libuv argv escaping when extra args are passed (update install path)', async () => {
    const cmd = 'npm install -g'
    const args = ['@playwright/cli@^0.1.22']
    spawnMock.mockReturnValueOnce(makeChild() as unknown as ReturnType<typeof spawn>)

    await spawnCmd(ctx(cmd), cmd, args, 5000)

    const call = lastCall()
    expect(call[0]).toBe('cmd.exe')
    expect(call[1]).toEqual(['/c', cmd, ...args])
    expect(call[2].windowsVerbatimArguments).not.toBe(true)
  })

  it('still expands ~ before the verbatim handoff', async () => {
    const cmd = 'mkdir ~/.claude/skills/demo'
    spawnMock.mockReturnValueOnce(makeChild() as unknown as ReturnType<typeof spawn>)

    await spawnCmd(ctx(cmd), cmd, [], 5000)

    const home = homedir().replace(/\\/g, '/')
    expect(lastCall()[1]?.[1]).toBe(`mkdir ${home}/.claude/skills/demo`)
  })

  it('leaves the POSIX shell path unchanged', async () => {
    forcePlatform('linux')
    spawnMock.mockReturnValueOnce(makeChild() as unknown as ReturnType<typeof spawn>)

    await spawnCmd(ctx('echo hello'), 'echo hello', [], 5000)

    const call = lastCall()
    expect(call[0]).toBe('/bin/sh')
    expect(call[1]).toEqual(['-c', 'echo hello'])
    expect(call[2].windowsVerbatimArguments).toBeUndefined()
  })
})
