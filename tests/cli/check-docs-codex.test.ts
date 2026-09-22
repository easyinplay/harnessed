// v16.0 Phase 64 T2 — `check-docs --hook --platform codex`: the PreToolUse verdict
// in codex's JSON form.
//
// codex honours exit 2 + stderr as a PreToolUse block (codex-rs hooks
// events/pre_tool_use.rs) — but on Windows it runs hook commands through
// `pwsh -NoProfile -Command`, and pwsh reports exit 1 for ANY failing native
// command (tests/installers/codexHookShell.contract.test.ts). Exit 1 is a mere
// "hook exited with code 1" error in codex, so the gate would silently stop
// blocking. Under --platform codex the verdict is therefore carried on stdout with
// exit 0, which every shell preserves:
//   halt → {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",…}}
//   warn → {"systemMessage": …}   (a codex Warning entry, not a failure)
//   pass → nothing

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  codexHookOutput,
  DEFAULT_MAX_STATE_LINES,
  registerCheckDocs,
} from '../../src/cli/checkDocs.js'

describe('codexHookOutput (pure)', () => {
  it('halt → permissionDecision deny with the reason', () => {
    expect(JSON.parse(codexHookOutput(2, ['✗ STATE too long']) ?? '')).toEqual({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: '✗ STATE too long',
      },
    })
  })
  it('warn → systemMessage', () => {
    expect(JSON.parse(codexHookOutput(1, ['⚠ a', '⚠ b']) ?? '')).toEqual({
      systemMessage: '⚠ a\n⚠ b',
    })
  })
  it('pass → null (print nothing)', () => {
    expect(codexHookOutput(0, [])).toBeNull()
  })
})

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

let tmpRoot: string
const realStdin = Object.getOwnPropertyDescriptor(process, 'stdin')

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-docs-codex-'))
})
afterEach(() => {
  vi.restoreAllMocks()
  if (realStdin) Object.defineProperty(process, 'stdin', realStdin)
  rmSync(tmpRoot, { recursive: true, force: true })
})

async function runHook(argv: string[], payload: string) {
  Object.defineProperty(process, 'stdin', {
    value: Readable.from([Buffer.from(payload)]),
    configurable: true,
  })
  let out = ''
  let err = ''
  vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  vi.spyOn(process.stdout, 'write').mockImplementation((c: string | Uint8Array) => {
    out += String(c)
    return true
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    out += `${a.join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    err += `${a.join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckDocs(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  }
  return { code, out, err }
}

const COMMIT = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git commit -m x' } })

describe('check-docs --hook --platform codex', () => {
  it('halt → exit 0 + JSON deny on stdout (survives pwsh)', async () => {
    mkdirSync(join(tmpRoot, '.planning'), { recursive: true })
    const over = DEFAULT_MAX_STATE_LINES + 3
    writeFileSync(
      join(tmpRoot, '.planning', 'STATE.md'),
      Array.from({ length: over }, (_, i) => `L${i}`).join('\n'),
    )
    const r = await runHook(
      ['check-docs', '--hook', '--cwd', tmpRoot, '--platform', 'codex'],
      COMMIT,
    )
    expect(r.code).toBe(0)
    const parsed = JSON.parse(r.out)
    expect(parsed.hookSpecificOutput.permissionDecision).toBe('deny')
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toContain(String(over))
  })

  it('clean tree → exit 0, nothing on stdout', async () => {
    const r = await runHook(
      ['check-docs', '--hook', '--cwd', tmpRoot, '--platform', 'codex'],
      COMMIT,
    )
    expect(r.code).toBe(0)
    expect(r.out).toBe('')
  })

  it('without --platform the CC contract is unchanged: halt → exit 2 + stderr', async () => {
    mkdirSync(join(tmpRoot, '.planning'), { recursive: true })
    writeFileSync(
      join(tmpRoot, '.planning', 'STATE.md'),
      Array.from({ length: DEFAULT_MAX_STATE_LINES + 3 }, (_, i) => `L${i}`).join('\n'),
    )
    const r = await runHook(['check-docs', '--hook', '--cwd', tmpRoot], COMMIT)
    expect(r.code).toBe(2)
    expect(r.err).toContain('STATE')
  })
})
