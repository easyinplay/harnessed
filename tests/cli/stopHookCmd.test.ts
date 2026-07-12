// 4.30.0 (issue #6) — `harnessed stop-hook` subcommand. Parity by construction:
// the command dynamic-imports the SAME bin/harnessed-stop-hook.mjs the npm-mode
// hook runs. Missing script → silent no-op (Stop-hook fail-soft contract).

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerStopHook } from '../../src/cli/stopHookCmd.js'

async function run(assetsDir: string): Promise<string> {
  process.env.HARNESSED_ASSETS_OVERRIDE = assetsDir
  let out = ''
  const write = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      out += String(chunk)
      return true
    })
  try {
    const program = new Command()
    program.exitOverride()
    registerStopHook(program)
    await program.parseAsync(['node', 'harnessed', 'stop-hook'])
  } finally {
    write.mockRestore()
    delete process.env.HARNESSED_ASSETS_OVERRIDE
  }
  return out
}

describe('harnessed stop-hook', () => {
  afterEach(() => {
    delete process.env.HARNESSED_ASSETS_OVERRIDE
  })

  it('executes bin/harnessed-stop-hook.mjs from the assets root (parity by construction)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stop-cmd-'))
    mkdirSync(join(dir, 'bin'), { recursive: true })
    writeFileSync(
      join(dir, 'bin', 'harnessed-stop-hook.mjs'),
      'process.stdout.write("STUB_STOP_OK\\n")\n',
    )
    const out = await run(dir)
    expect(out).toContain('STUB_STOP_OK')
  })

  it('missing script → silent no-op (never wedges turn end)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stop-cmd-empty-'))
    const out = await run(dir)
    expect(out).toBe('')
  })
})
