// Windows harness-CLI spawn planning (src/installers/lib/winSpawn.ts).
//
// The old `spawn('cmd.exe', ['/c', bin, ...args])` let cmd.exe re-parse every
// unquoted `& | < > ^ %`: `&` in an MCP URL became a command separator, and the
// shipped args `tavily-mcp@^0.2.0` / `exa-mcp-server@^3.2.0` silently lost their
// caret, turning a semver range into an exact pin on every Windows install.
//
// The decisive cells run through a REAL cmd.exe against a real .cmd shim that
// forwards `%*` — the exact double-parse path that makes this hard. They skip
// off Windows; the pure planning cells run everywhere.

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  escapeArgument,
  planWindowsSpawn,
  resolveWindowsBin,
} from '../../src/installers/lib/winSpawn.js'

describe('planWindowsSpawn — pure planning', () => {
  it('an .exe is spawned DIRECTLY, never through cmd.exe', () => {
    const p = planWindowsSpawn('claude', ['mcp', 'add', 'x@^1.0.0'], 'C:\\bin\\claude.exe')
    expect(p.command).toBe('C:\\bin\\claude.exe')
    expect(p.args).toEqual(['mcp', 'add', 'x@^1.0.0'])
    expect(p.verbatim).toBe(false)
  })

  it('a .cmd shim goes through cmd.exe /d /s /c with verbatim, escaped args', () => {
    const p = planWindowsSpawn('claude', ['a&b'], 'C:\\npm\\claude.cmd')
    expect(p.command).toBe('cmd.exe')
    expect(p.args.slice(0, 3)).toEqual(['/d', '/s', '/c'])
    expect(p.verbatim).toBe(true)
    // the & is caret-escaped, never bare
    expect(p.args[3]).not.toMatch(/[^^]&/)
  })

  it('unresolvable bin spawns the bare name so the ENOENT "not installed" path still fires', () => {
    expect(planWindowsSpawn('codex', ['plugin', 'list'], null)).toEqual({
      command: 'codex',
      args: ['plugin', 'list'],
      verbatim: false,
    })
  })

  it('resolveWindowsBin walks PATH dirs in order, PATHEXT in order within each', () => {
    const files = new Set(['D:\\b\\claude.CMD', 'D:\\a\\claude.EXE'])
    const got = resolveWindowsBin('claude', { PATH: 'D:\\a;D:\\b', PATHEXT: '.EXE;.CMD' }, (p) =>
      files.has(p),
    )
    expect(got).toBe('D:\\a\\claude.EXE')
  })

  it('escapeArgument always quotes', () => {
    expect(escapeArgument('plain', false).startsWith('^"')).toBe(true)
  })
})

describe.skipIf(process.platform !== 'win32')('real cmd.exe + .cmd shim round-trip', () => {
  // A shim shaped like npm's: forwards %* to node, which prints the argv it got.
  function makeShim(): string {
    const dir = mkdtempSync(join(tmpdir(), 'winspawn-'))
    const shim = join(dir, 'echoargs.cmd')
    writeFileSync(
      shim,
      `@echo off\r\n"${process.execPath}" -e "console.log(JSON.stringify(process.argv.slice(1)))" %*\r\n`,
      'utf8',
    )
    return shim
  }

  function run(shim: string, args: string[]): { argv: string[] | null; raw: string } {
    const plan = planWindowsSpawn('echoargs', args, shim)
    const r = spawnSync(plan.command, plan.args, {
      encoding: 'utf8',
      windowsHide: true,
      windowsVerbatimArguments: plan.verbatim,
    })
    const raw = `${r.stdout ?? ''}${r.stderr ?? ''}`
    const line = (r.stdout ?? '').trim().split(/\r?\n/).pop() ?? ''
    try {
      return { argv: JSON.parse(line) as string[], raw }
    } catch {
      return { argv: null, raw }
    }
  }

  it.each([
    ['semver caret (shipped tavily/exa arg)', 'tavily-mcp@^0.2.0'],
    ['ampersand in a URL query', 'https://host/mcp?token=a&b=2'],
    ['pipe and redirects', 'a|b<c>d'],
    ['percent pair', '%PATH%'],
    ['spaces', 'with space'],
    ['quote', 'say "hi"'],
  ])('%s arrives byte-identical', (_label, arg) => {
    const { argv, raw } = run(makeShim(), [arg])
    expect(argv, raw).toEqual([arg])
  })

  it('an injection attempt stays ONE literal argument and runs nothing', () => {
    const marker = join(tmpdir(), `winspawn-pwned-${process.pid}.txt`)
    const attack = `x&echo pwned>${marker}`
    const { argv } = run(makeShim(), [attack])
    expect(argv).toEqual([attack])
    expect(() =>
      execFileSync('cmd.exe', ['/d', '/c', `type "${marker}"`], { stdio: 'pipe' }),
    ).toThrow()
  })

  it('the OLD shape really did mangle the caret (so the cells above are not vacuous)', () => {
    const shim = makeShim()
    const r = spawnSync('cmd.exe', ['/c', shim, 'tavily-mcp@^0.2.0'], { encoding: 'utf8' })
    const argv = JSON.parse((r.stdout ?? '').trim().split(/\r?\n/).pop() ?? '[]')
    expect(argv).not.toEqual(['tavily-mcp@^0.2.0'])
  })
})
