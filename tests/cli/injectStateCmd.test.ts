// 4.27.0 (B3 Slice 1, T1) — `harnessed inject-state` subcommand. Parity by
// construction: the command dynamic-imports the SAME bin/harnessed-inject-state.mjs
// that the npm-mode hook runs (assets root carries bin/ in both modes — package
// root on npm, unpacked assets on compiled). Missing script → silent no-op
// (hook fail-soft contract: never break a user prompt).

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerInjectState } from '../../src/cli/injectStateCmd.js'

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
    registerInjectState(program)
    await program.parseAsync(['node', 'harnessed', 'inject-state'])
  } finally {
    write.mockRestore()
    delete process.env.HARNESSED_ASSETS_OVERRIDE
  }
  return out
}

describe('harnessed inject-state', () => {
  afterEach(() => {
    delete process.env.HARNESSED_ASSETS_OVERRIDE
  })

  it('executes bin/harnessed-inject-state.mjs from the assets root (parity by construction)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'inject-cmd-'))
    mkdirSync(join(dir, 'bin'), { recursive: true })
    // stub mirrors the real script's contract: write the injection to stdout
    writeFileSync(
      join(dir, 'bin', 'harnessed-inject-state.mjs'),
      'process.stdout.write("STUB_INJECT_OK\\n")\n',
    )
    const out = await run(dir)
    expect(out).toContain('STUB_INJECT_OK')
  })

  it('missing script → silent no-op (never breaks the prompt)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'inject-cmd-empty-'))
    const out = await run(dir)
    expect(out).toBe('')
  })
})
