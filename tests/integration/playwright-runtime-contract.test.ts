import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveBash } from '../../src/installers/lib/resolveBash.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const roots: string[] = []
const title = 'harnessed-playwright-runtime'

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function loadManifest(name: string) {
  const path = join(process.cwd(), 'manifests/tools', name)
  const result = validateManifestFile(readFileSync(path, 'utf8'), path)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.manifest
}

function shellPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^([A-Za-z]):/, (_, drive: string) => `/${drive.toLowerCase()}`)
}

function quote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

interface Call {
  command: string
  session?: string
  args: string[]
}

// Only the external CLI is substituted; the manifest runs in a real POSIX shell.
const stub = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const sessionArg = args.find(arg => arg.startsWith('-s='));
const session = sessionArg?.slice(3);
const command = args.find(arg => ['--version', 'open', 'run-code', 'eval', 'close'].includes(arg)) ?? 'unknown';
fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ command, session, args }) + '\n');
if (command === '--version') {
  console.log(process.env.STUB_VERSION ?? '0.1.22');
  process.exit(0);
}
if (!/^harnessed-playwright-verify-\d+$/.test(session ?? '')) process.exit(90);
const state = path.join(process.env.STUB_ROOT, session + '.session');
if (command === 'open') {
  if (args[args.indexOf('--browser') + 1] !== 'chromium') process.exit(91);
  fs.writeFileSync(state, 'open');
  process.exit(Number(process.env.STUB_OPEN_EXIT ?? 0));
}
if (command === 'close') {
  fs.rmSync(state, { force: true });
  process.exit(Number(process.env.STUB_CLOSE_EXIT ?? 0));
}
if (!fs.existsSync(state)) process.exit(92);
if (process.env.STUB_RENDER_EXIT) process.exit(Number(process.env.STUB_RENDER_EXIT));
if (process.env.STUB_RENDER_ERROR) {
  console.log('### Error\nError: render failed');
  process.exit(0);
}
(async () => {
  let html = '';
  const page = {
    setContent: async value => { html = value; },
    title: async () => process.env.STUB_TITLE ?? html.match(/<title>([^<]+)<\/title>/)?.[1],
  };
  const code = args[args.indexOf(command) + 1];
  const result = await new Function('return (' + code + ')')()(page);
  if (!html.includes('<h1>Runtime ready</h1>')) process.exit(93);
  console.log('### Result\n' + JSON.stringify(result));
})().catch(error => { console.error(error); process.exit(94); });
`

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'harnessed playwright contract '))
  roots.push(root)
  const script = join(root, 'stub.cjs')
  const cli = join(root, 'playwright-cli')
  const log = join(root, 'calls.jsonl')
  const unrelated = join(root, 'user-work.session')
  writeFileSync(script, stub)
  writeFileSync(
    cli,
    `#!/bin/sh\nexec ${quote(shellPath(process.execPath))} ${quote(shellPath(script))} "$@"\n`,
  )
  chmodSync(cli, 0o755)
  writeFileSync(unrelated, 'keep')
  return { root, log, unrelated }
}

function run(cmd: string, f: ReturnType<typeof fixture>, env: NodeJS.ProcessEnv = {}) {
  const shell = process.platform === 'win32' ? resolveBash().path : '/bin/sh'
  if (!shell) throw new Error('A working POSIX shell is required for runtime contracts')
  const result = spawnSync(shell, ['-c', `PATH=${quote(shellPath(f.root))}:"$PATH"\n${cmd}`], {
    cwd: f.root,
    env: { ...process.env, ...env, STUB_LOG: f.log, STUB_ROOT: f.root },
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (result.error) throw result.error
  const calls: Call[] = existsSync(f.log)
    ? readFileSync(f.log, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
    : []
  return { ...result, calls }
}

describe('Playwright runtime manifest contract', () => {
  it('keeps the L2 browser automation skill separate from the test runner', () => {
    const { metadata, spec } = loadManifest('playwright-test.yaml')
    expect(metadata.name).toBe('playwright-test')
    expect(metadata.display_name).toBe('Playwright CLI Browser Automation Skill')
    expect(metadata.description).toContain('browser automation skill')
    expect(metadata.description).toContain('not the @playwright/test test runner')
    expect(metadata.upstream.notice).toContain('microsoft/playwright-cli')
    expect(spec.install_type).toBe('skill')
    expect(spec.install.method).toBe('npx-skill-installer')
    expect(spec.install.cmd).toBe(
      'npx --yes skills@latest add microsoft/playwright-cli --copy --global -y',
    )
  })

  it('provides a schema-valid pinned L4 runtime without shared-cache removal', () => {
    const { metadata, spec } = loadManifest('playwright-cli.yaml')
    expect(metadata.name).toBe('playwright-cli')
    expect(spec).toMatchObject({
      type: 'cli-npm',
      component_type: 'cli-binary',
      category: 'testing',
      install_type: 'npm',
      install: {
        method: 'npm-cli',
        npm_version: '0.1.22',
        cmd: 'npm install -g @playwright/cli@0.1.22 && playwright-cli install-browser chromium',
      },
      uninstall: { cmd: 'npm uninstall -g @playwright/cli' },
    })
    expect(spec.uninstall?.cleanup_paths).toBeUndefined()
    expect(spec.verify.timeout_ms).toBeGreaterThanOrEqual(60_000)
  })

  it('accepts the exact installed version without launching during idempotence', () => {
    const cmd = loadManifest('playwright-cli.yaml').spec.install.idempotent_check
    expect(cmd).toBeTypeOf('string')
    const result = run(cmd ?? '', fixture())
    expect(result.status, result.stderr).toBe(0)
    expect(result.calls.map((call) => call.command)).toEqual(['--version'])
  })

  it.each([
    ['successful render', {}, 0],
    ['open failure', { STUB_OPEN_EXIT: '23' }, 23],
    ['render failure', { STUB_RENDER_EXIT: '31' }, 31],
    ['render error with exit zero', { STUB_RENDER_ERROR: '1' }, 1],
    ['wrong title', { STUB_TITLE: 'wrong-title' }, 1],
    ['title substring', { STUB_TITLE: 'harnessed-playwright-runtime-extra' }, 1],
    ['cleanup failure', { STUB_CLOSE_EXIT: '57' }, 57],
    ['open and cleanup failure', { STUB_OPEN_EXIT: '23', STUB_CLOSE_EXIT: '57' }, 23],
    ['render and cleanup failure', { STUB_RENDER_EXIT: '31', STUB_CLOSE_EXIT: '57' }, 31],
  ] as const)('handles %s and closes only its session', (_, env, status) => {
    const f = fixture()
    const result = run(loadManifest('playwright-cli.yaml').spec.verify.cmd, f, env)
    expect(result.status, result.stderr).toBe(status)
    const calls = result.calls.filter((call) => call.command !== '--version')
    expect(calls.map((call) => call.command)).toEqual(
      'STUB_OPEN_EXIT' in env ? ['open', 'close'] : ['open', 'run-code', 'close'],
    )
    expect(calls[0]?.session).toMatch(/harnessed-playwright-verify-\d+$/)
    expect(new Set(calls.map((call) => call.session)).size).toBe(1)
    expect(readdirSync(f.root).filter((name) => name.endsWith('.session'))).toEqual([
      'user-work.session',
    ])
    expect(readFileSync(f.unrelated, 'utf8')).toBe('keep')
    expect(
      readdirSync(f.root).filter((name) => name.startsWith('harnessed-playwright-verify-')),
    ).toEqual([])
    if (status === 0) expect(result.stdout).toContain(JSON.stringify(title))
  })

  it('gives each shell a unique PID-based session', () => {
    const cmd = loadManifest('playwright-cli.yaml').spec.verify.cmd
    const sessions = [fixture(), fixture()].map((f) => {
      const result = run(cmd, f)
      expect(result.status, result.stderr).toBe(0)
      return result.calls.find((call) => call.command === 'open')?.session
    })
    expect(sessions[0]).toMatch(/harnessed-playwright-verify-\d+$/)
    expect(sessions[1]).not.toBe(sessions[0])
  })

  it.each([
    '0.1.21',
    '0.1.220',
    '0.1.22-beta',
  ])('rejects version %s before opening a browser', (version) => {
    const spec = loadManifest('playwright-cli.yaml').spec
    for (const cmd of [spec.verify.cmd, spec.install.idempotent_check]) {
      expect(cmd).toBeTypeOf('string')
      const result = run(cmd ?? '', fixture(), { STUB_VERSION: version })
      expect(result.status, result.stderr).not.toBe(0)
      expect(result.calls.map((call) => call.command)).toEqual(['--version'])
    }
  })
})
