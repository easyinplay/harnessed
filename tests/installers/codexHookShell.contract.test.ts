// v16.0 Phase 64 T1 — three-shell contract: the GENERATED codex hook command
// really runs through cmd / pwsh / sh (codex hands hook commands to the user's
// shell — measured: pwsh on the maintainer's Windows box — after expanding
// `${PLUGIN_ROOT}`). Exercises the whole npm-mode chain: shell → node → shim
// (hook.cjs) → install.json from $PLUGIN_DATA → first-party entry, with stdin,
// argv and exit code passed through; and the binary-mode bare `harnessed` PATH
// lookup. A shell that is not installed on this runner is skipped, not faked
// (Windows CI has cmd + pwsh + Git-Bash sh; Linux/macOS have sh, usually pwsh).

import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CODEX_HOOK_SHIM, codexHookCommand } from '../../src/installers/lib/codexHookPlugin.js'

type Shell = {
  name: string
  run: (cmd: string) => { bin: string; args: string[]; verbatim?: boolean }
}

const SHELLS: Shell[] = [
  {
    name: 'cmd',
    run: (cmd) => ({ bin: 'cmd.exe', args: ['/d', '/s', '/c', `"${cmd}"`], verbatim: true }),
  },
  {
    name: 'pwsh',
    run: (cmd) => ({ bin: 'pwsh', args: ['-NoProfile', '-NonInteractive', '-Command', cmd] }),
  },
  { name: 'sh', run: (cmd) => ({ bin: 'sh', args: ['-c', cmd] }) },
]

function available(s: Shell): boolean {
  if (s.name === 'cmd' && process.platform !== 'win32') return false
  const probe = s.run('exit 0')
  const r = spawnSync(probe.bin, probe.args, {
    windowsVerbatimArguments: probe.verbatim,
    stdio: 'ignore',
    timeout: 20_000,
  })
  return r.status === 0
}

// The fake first-party entries echo what reached them, so the assertion is on the
// chain's plumbing, not on harnessed behavior.
const ECHO = (exitCode: number) => `let d='';process.stdin.setEncoding('utf8');
process.stdin.on('data',c=>{d+=c});process.stdin.on('end',()=>{
process.stdout.write(JSON.stringify({argv:process.argv.slice(2),stdin:d}));process.exit(${exitCode})})
`

let root: string
let pluginRoot: string
let dataDir: string
let pathDir: string

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-codex-shell-'))
  // A space in the plugin root proves the quoting (Windows user dirs often have one).
  pluginRoot = join(root, 'plugin root')
  dataDir = join(root, 'data')
  const assets = join(root, 'assets')
  pathDir = join(root, 'pathbin')
  for (const d of [pluginRoot, dataDir, join(assets, 'bin'), join(assets, 'dist'), pathDir])
    mkdirSync(d, { recursive: true })
  writeFileSync(join(pluginRoot, 'hook.cjs'), CODEX_HOOK_SHIM)
  writeFileSync(
    join(dataDir, 'install.json'),
    JSON.stringify({ mode: 'npm', assetsRoot: assets, harnessedVersion: '0.0.0-test' }),
  )
  writeFileSync(join(assets, 'bin', 'harnessed-inject-state.mjs'), ECHO(0))
  writeFileSync(join(assets, 'dist', 'cli.mjs'), ECHO(3))
  // binary mode: a `harnessed` on PATH (cmd/pwsh resolve harnessed.cmd; sh the script)
  writeFileSync(join(pathDir, 'harnessed.mjs'), ECHO(0))
  writeFileSync(join(pathDir, 'harnessed.cmd'), '@node "%~dp0harnessed.mjs" %*\r\n')
  writeFileSync(
    join(pathDir, 'harnessed'),
    '#!/bin/sh\nexec node "$(dirname "$0")/harnessed.mjs" "$@"\n',
  )
  chmodSync(join(pathDir, 'harnessed'), 0o755)
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

const PAYLOAD = JSON.stringify({ session_id: 'sid-1', hook_event_name: 'UserPromptSubmit' })

function exec(shell: Shell, cmd: string, env: Record<string, string | undefined>) {
  const p = shell.run(cmd)
  return spawnSync(p.bin, p.args, {
    input: PAYLOAD,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    windowsVerbatimArguments: p.verbatim,
    timeout: 30_000,
  })
}

/** What codex does before handing the command to the shell. */
const expand = (literal: string) => literal.replaceAll('${PLUGIN_ROOT}', pluginRoot)

describe.each(SHELLS)('codex hook command through $name', (shell) => {
  const ok = available(shell)

  it.skipIf(!ok)('npm inject-state: shim → bin entry, argv + stdin through, exit 0', () => {
    const cmd = expand(codexHookCommand({ id: 'inject-state', args: ['--invalidate'] }, 'npm'))
    const r = exec(shell, cmd, { PLUGIN_DATA: dataDir })
    expect(r.stderr).toBe('')
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout)).toEqual({
      argv: ['inject-state', '--invalidate', '--platform', 'codex'],
      stdin: PAYLOAD,
    })
  })

  // The exit code survives cmd and sh, but NOT pwsh: `pwsh -Command` reports 1 for
  // any failing last command. codex uses exactly that invocation on Windows
  // (codex-rs core/src/shell.rs derive_exec_args), which is why no codex-facing
  // harnessed hook may signal through an exit code — check-docs answers with the
  // JSON permissionDecision form under --platform codex (tests/cli/check-docs-codex).
  it.skipIf(!ok)(
    'npm check-docs: shim → CLI entry; exit code passthrough (pwsh collapses to 1)',
    () => {
      const cmd = expand(codexHookCommand({ id: 'check-docs', args: ['--hook'] }, 'npm'))
      const r = exec(shell, cmd, { PLUGIN_DATA: dataDir })
      // pwsh 7.x measured 1; accept 3 too should a future pwsh start passing it through.
      if (shell.name === 'pwsh') expect([1, 3]).toContain(r.status)
      else expect(r.status).toBe(3)
      expect(JSON.parse(r.stdout)).toEqual({
        argv: ['check-docs', '--hook', '--platform', 'codex'],
        stdin: PAYLOAD,
      })
    },
  )

  it.skipIf(!ok)('npm shim without install info → silent exit 0 (fail-soft)', () => {
    const cmd = expand(codexHookCommand({ id: 'inject-state', args: [] }, 'npm'))
    const r = exec(shell, cmd, { PLUGIN_DATA: join(root, 'nowhere') })
    expect(r.status).toBe(0)
    expect(r.stdout).toBe('')
  })

  it.skipIf(!ok)('binary mode: bare `harnessed` resolves on PATH', () => {
    const cmd = codexHookCommand({ id: 'inject-state', args: [] }, 'binary')
    const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH'
    const r = exec(shell, cmd, { [pathKey]: `${pathDir}${delimiter}${process.env[pathKey] ?? ''}` })
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout)).toEqual({
      argv: ['inject-state', '--platform', 'codex'],
      stdin: PAYLOAD,
    })
  })
})
