// Windows-safe spawn planning for the harness CLIs (`claude`, `codex`).
//
// The previous shape was `spawn('cmd.exe', ['/c', bin, ...args])`. libuv quotes
// an argument only when it contains whitespace or a quote, and cmd.exe then
// RE-PARSES the whole line, so every unquoted `& | < > ^ %` became syntax:
//
//   - `&` in an MCP URL query string became a command separator (injection).
//   - `^` is cmd's escape character, so the shipped args `tavily-mcp@^0.2.0` and
//     `exa-mcp-server@^3.2.0` silently lost it — a semver RANGE became an exact
//     pin on every Windows install, with no error anywhere.
//
// The manifest security gate cannot fix this: it screens manifest cmd strings on
// every platform, where `&&` is legitimate. The hazard only exists at this spawn
// boundary, on Windows, so it is fixed here.
//
// Two cases, because they are genuinely different:
//
//   1. The bin resolves to an executable (.exe/.com) — the native Claude Code and
//      Codex installers ship these. Spawn it DIRECTLY, no shell. Arguments go
//      through CreateProcess with MSVCRT quoting and are never re-parsed, so no
//      escaping is needed at all.
//   2. The bin resolves to a .cmd/.bat shim — `npm i -g` installs these. A shim
//      cannot be spawned shell-less (Node's CVE-2024-27980 fix makes that EINVAL),
//      so cmd.exe is unavoidable, and the shim's `%*` re-parses the arguments a
//      SECOND time. Arguments are therefore quoted and caret-escaped twice.
//
// The escaping algorithm is cross-spawn's (MIT, https://github.com/moxystudio/node-cross-spawn,
// lib/util/escape.js), itself based on https://qntm.org/cmd. Ported rather than
// depended on: it is ~20 lines and this is the only call site.

import { existsSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const META = /([()\][%!^"`<>&|;, *?])/g

/** Escape the command token itself (no quoting — cmd resolves it). */
export function escapeCommand(cmd: string): string {
  return cmd.replace(META, '^$1')
}

/** Quote + caret-escape one argument for `cmd.exe /d /s /c`. `doubleEscape` is
 *  required when the target is a .cmd/.bat that forwards `%*`. */
export function escapeArgument(arg: string, doubleEscape: boolean): string {
  let a = `${arg}`
  // backslashes before a quote: double them, then escape the quote
  a = a.replace(/(\\*)"/g, '$1$1\\"')
  // trailing backslashes (they will precede the closing quote): double them
  a = a.replace(/(\\*)$/, '$1$1')
  a = `"${a}"`
  a = a.replace(META, '^$1')
  if (doubleEscape) a = a.replace(META, '^$1')
  return a
}

export interface PathEnv {
  PATH?: string
  Path?: string
  PATHEXT?: string
}

/** Resolve `bin` the way Windows does: each PATH dir in order, each PATHEXT
 *  extension in order within it. Returns the absolute file path, or null. */
export function resolveWindowsBin(
  bin: string,
  env: PathEnv = process.env,
  isFile: (p: string) => boolean = (p) => existsSync(p) && statSync(p).isFile(),
): string | null {
  const dirs = (env.PATH ?? env.Path ?? '').split(';').filter(Boolean)
  const exts = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
  const candidates = extname(bin) ? [''] : exts
  for (const dir of dirs) {
    for (const ext of candidates) {
      const p = join(dir, `${bin}${ext}`)
      if (isFile(p)) return p
    }
  }
  return null
}

export interface SpawnPlan {
  command: string
  args: string[]
  /** true when args are pre-escaped and must reach cmd.exe untouched. */
  verbatim: boolean
}

/** Decide how to spawn `bin args` on Windows. `resolved` is resolveWindowsBin's
 *  result; null (not on PATH) spawns the bare name so the caller's existing
 *  ENOENT → "not installed" message still fires. */
export function planWindowsSpawn(bin: string, args: string[], resolved: string | null): SpawnPlan {
  if (!resolved) return { command: bin, args, verbatim: false }
  const ext = extname(resolved).toLowerCase()
  if (ext !== '.cmd' && ext !== '.bat') {
    return { command: resolved, args, verbatim: false }
  }
  const line = [escapeCommand(resolved), ...args.map((a) => escapeArgument(a, true))].join(' ')
  return { command: 'cmd.exe', args: ['/d', '/s', '/c', `"${line}"`], verbatim: true }
}
