// Windows-only end-to-end proof that a quoted argument survives the cmd.exe
// boundary.
//
// Before the fix, libuv's MSVCRT quoting escaped the manifest quotes
// (`npm install -g "@playwright/cli@^0.1.22"` reached cmd.exe as
// `npm install -g \"@playwright/cli@^0.1.22\"`), cmd.exe has no backslash
// escape, and the program received doubled quotes — npm answered
// EINVALIDPACKAGENAME.
//
// Skipped on non-Windows hosts: the behavior under test is cmd.exe's.

import { describe, expect, it } from 'vitest'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const isWindows = process.platform === 'win32'

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

async function run(cmd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await spawnCmd(ctx(cmd), cmd, [], 30_000)
  if (!('stdout' in result)) {
    throw new Error(`spawn failed: ${JSON.stringify(result)}`)
  }
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode }
}

describe.skipIf(!isWindows)('spawnCmd on Windows', () => {
  it('hands a quoted argument to the program without escaping it', async () => {
    // `cd . &&` keeps the command line from starting with a quote — cmd.exe's
    // /c strips the outer quotes of a line that begins with one, which would
    // split the executable path at its first space.
    const cmd = `cd . && "${process.execPath}" -p "1+1"`
    const result = await run(cmd)

    expect(result.exitCode).toBe(0)
    // node received `1+1` as source, not as the literal string "1+1".
    expect(result.stdout.trim()).toBe('2')
  })

  it('keeps a quoted package specifier intact, caret included', async () => {
    const cmd = 'echo "@playwright/cli@^0.1.22"'
    const result = await run(cmd)

    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('"@playwright/cli@^0.1.22"')
    expect(result.stdout).not.toContain('\\"')
  })

  it('still executes both sides of a && chain', async () => {
    const cmd = 'echo "a b" && echo done'
    const result = await run(cmd)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('"a b"')
    expect(result.stdout).toContain('done')
  })
})
