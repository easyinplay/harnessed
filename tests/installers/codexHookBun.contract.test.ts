import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_MAX_STATE_LINES } from '../../src/cli/checkDocs.js'
import { CODEX_HOOK_SHIM } from '../../src/installers/lib/codexHookPlugin.js'

const bun = process.platform === 'win32' ? 'bun.exe' : 'bun'
const hasBun = spawnSync(bun, ['--version'], { stdio: 'ignore', timeout: 5000 }).status === 0
const node = typeof process.versions.bun === 'string' ? 'node' : process.execPath
const packageRoot = resolve('.')
const commit = JSON.stringify({
  tool_name: 'Bash',
  tool_input: { command: 'git commit -m fixture' },
})
let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-bun-shim-'))
  writeFileSync(join(root, 'hook.cjs'), CODEX_HOOK_SHIM)
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function info(assetsRoot: string) {
  writeFileSync(
    join(root, 'install.json'),
    JSON.stringify({ mode: 'bun', assetsRoot, harnessedVersion: '0.0.0-test' }),
  )
}

function run(exe: string, args: string[], input: string) {
  const r = spawnSync(exe, [join(root, 'hook.cjs'), ...args], {
    cwd: root,
    input,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: root,
      USERPROFILE: root,
      PLUGIN_DATA: root,
      HARNESSED_PLATFORM: 'claude',
    },
    timeout: 15_000,
  })
  expect(r.error).toBeUndefined()
  return { status: r.status, stdout: r.stdout, stderr: r.stderr }
}

describe.skipIf(!hasBun)('real Codex shim Node/Bun parity (Bun optional on CI)', () => {
  it.each([
    'codex',
    'claude',
  ])('real check-docs %s preserves permission output and exit code', (host) => {
    info(packageRoot)
    mkdirSync(join(root, '.planning'))
    writeFileSync(
      join(root, '.planning', 'STATE.md'),
      Array.from({ length: DEFAULT_MAX_STATE_LINES + 3 }, (_, i) => `L${i}`).join('\n'),
    )
    const args = [
      'check-docs',
      '--hook',
      '--cwd',
      root,
      ...(host === 'codex' ? ['--platform', 'codex'] : []),
    ]
    const baseline = run(node, args, commit)
    expect(run(bun, args, commit)).toEqual(baseline)
    expect(baseline.status).toBe(host === 'codex' ? 0 : 2)
    if (host === 'codex')
      expect(JSON.parse(baseline.stdout).hookSpecificOutput.permissionDecision).toBe('deny')
    else expect(baseline.stderr).toContain('STATE')
  })

  it('real check-docs non-commit input remains a silent pass', () => {
    info(packageRoot)
    const args = ['check-docs', '--hook', '--cwd', root, '--platform', 'codex']
    const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git status' } })
    expect(run(node, args, input)).toEqual({ status: 0, stdout: '', stderr: '' })
    expect(run(bun, args, input)).toEqual(run(node, args, input))
  })

  it('the fallback CLI entry preserves stdin, argv, stdout, stderr and a nonzero exit', () => {
    const assets = join(root, 'assets with spaces')
    mkdirSync(join(assets, 'dist'), { recursive: true })
    info(assets)
    writeFileSync(
      join(assets, 'dist', 'cli.mjs'),
      `let input = ''; process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk });
process.stdin.on('end', () => { process.stdout.write(JSON.stringify({ input, args: process.argv.slice(2) })); process.stderr.write('fixture-error'); process.exit(3) });
`,
    )
    const args = ['inject-state', '--invalidate', '--platform', 'codex']
    const baseline = run(node, args, commit)
    expect(run(bun, args, commit)).toEqual(baseline)
    expect(baseline.status).toBe(3)
    expect(baseline.stderr).toBe('fixture-error')
    expect(JSON.parse(baseline.stdout)).toEqual({ input: commit, args })
  })

  it('missing install info or a missing target stays fail-soft on both runtimes', () => {
    expect(run(node, ['inject-state'], commit)).toEqual({ status: 0, stdout: '', stderr: '' })
    expect(run(bun, ['inject-state'], commit)).toEqual(run(node, ['inject-state'], commit))
    info(join(root, 'missing-assets'))
    expect(run(bun, ['inject-state'], commit)).toEqual({ status: 0, stdout: '', stderr: '' })
    expect(run(bun, ['inject-state'], commit)).toEqual(run(node, ['inject-state'], commit))
  })
})
