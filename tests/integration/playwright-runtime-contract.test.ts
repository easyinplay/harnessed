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
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveBash } from '../../src/installers/lib/resolveBash.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const roots: string[] = []

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
  args: string[]
  noUpdateNotifier?: string
}

// Only the external CLI is substituted; the manifest runs in a real POSIX shell.
const stub = String.raw`
const fs = require('node:fs');
const args = process.argv.slice(2);
const command = args[0];
fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ command, args, noUpdateNotifier: process.env.NO_UPDATE_NOTIFIER }) + '\n');
if (command === '--version') {
  console.log(process.env.STUB_VERSION ?? '0.1.22');
  process.exit(Number(process.env.STUB_VERSION_EXIT ?? 0));
}
if (JSON.stringify(args) === JSON.stringify(['install-browser', 'chromium', '--dry-run'])) {
  console.log(process.env.STUB_DRY_RUN ?? 'Chrome for Testing 155.0 (playwright chromium v1247)\n  Install location: /cache/chromium-1247\n  Download url: https://example.invalid/chromium.zip');
  process.exit(Number(process.env.STUB_DRY_EXIT ?? 0));
}
if (JSON.stringify(args) === JSON.stringify(['install-browser', 'chromium', '--list'])) {
  console.log(process.env.STUB_LIST ?? 'Playwright version: 1.64.0\n  Browsers:\n    /cache/chromium-1247\n  References:\n    /global/node_modules/@playwright/cli/node_modules/playwright-core');
  process.exit(Number(process.env.STUB_LIST_EXIT ?? 0));
}
console.error('Browser/daemon startup or download is forbidden');
process.exit(23);
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
    join(root, 'playwright-cli.cmd'),
    `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`,
  )
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
  const path = `${quote(shellPath(f.root))}:${quote(shellPath(dirname(process.execPath)))}:/usr/bin:/bin`
  const result = spawnSync(shell, ['-c', `PATH=${path}\n${cmd}`], {
    cwd: f.root,
    env: { ...process.env, ...env, STUB_LOG: f.log },
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
    ['valid browser metadata', {}, 0],
    ['dry-run failure', { STUB_DRY_EXIT: '31' }, 31],
    ['list failure', { STUB_LIST_EXIT: '57' }, 57],
    ['version failure', { STUB_VERSION_EXIT: '19' }, 19],
    [
      'dry-run error with exit zero',
      { STUB_DRY_RUN: '### Error\nInstall location: /cache/chromium-1247' },
      1,
    ],
    [
      'list error with exit zero',
      { STUB_LIST: '### Error\n/global/node_modules/@playwright/cli' },
      1,
    ],
    ['empty dry-run', { STUB_DRY_RUN: '' }, 1],
    [
      'wrong browser metadata',
      {
        STUB_DRY_RUN:
          'Firefox (playwright firefox v1500)\n  Install location: /cache/firefox\n  Download url: https://example.invalid/firefox.zip',
      },
      1,
    ],
    ['empty list', { STUB_LIST: '' }, 1],
    [
      'list metadata without a version header',
      {
        STUB_LIST:
          'Browsers:\n    /cache/chromium-1247\n  References:\n    /global/node_modules/@playwright/cli/node_modules/playwright-core',
      },
      1,
    ],
    [
      'header preamble cannot satisfy a later unrelated block',
      {
        STUB_LIST:
          'Browsers:\n    /cache/chromium-1247\nReferences:\n    /global/node_modules/@playwright/cli/node_modules/playwright-core\n\nPlaywright version: 1.64.0\n  Browsers:\n    /cache/firefox-1500\n  References:\n    /project/node_modules/playwright-core',
      },
      1,
    ],
    [
      'project-only browser reference',
      {
        STUB_LIST:
          'Playwright version: 1.64.0\n  Browsers:\n    /cache/chromium-1247\n  References:\n    /project/node_modules/playwright-core',
      },
      1,
    ],
    [
      'CLI name substring',
      {
        STUB_LIST:
          'Playwright version: 1.64.0\n  Browsers:\n    /cache/chromium-1247\n  References:\n    /global/node_modules/@playwright/cliff/node_modules/playwright-core',
      },
      1,
    ],
    [
      'no Chromium browser',
      {
        STUB_LIST:
          'Playwright version: 1.64.0\n  Browsers:\n    /cache/firefox-1500\n  References:\n    /global/node_modules/@playwright/cli/node_modules/playwright-core',
      },
      1,
    ],
    [
      'unrelated browser block',
      {
        STUB_LIST:
          'Playwright version: 1.63.0\n  Browsers:\n    /cache/chromium-1247\n  References:\n    /project/node_modules/playwright-core\n\nPlaywright version: 1.64.0\n  Browsers:\n    /cache/firefox-1500\n  References:\n    /global/node_modules/@playwright/cli/node_modules/playwright-core',
      },
      1,
    ],
    [
      'Windows paths and CRLF',
      {
        STUB_LIST:
          'Playwright version: 1.64.0\r\n  Browsers:\r\n    C:\\Browser cache\\chromium-1247\r\n  References:\r\n    C:\\Global npm\\node_modules\\@playwright\\cli\\node_modules\\playwright-core',
      },
      0,
    ],
  ] as const)('handles %s without starting, downloading or changing browsers', (_, env, status) => {
    const f = fixture()
    const before = readdirSync(f.root).map((name) => [
      name,
      readFileSync(join(f.root, name), 'utf8'),
    ])
    const result = run(loadManifest('playwright-cli.yaml').spec.verify.cmd, f, env)
    expect(result.status, result.stderr).toBe(status)
    const expected = [['--version']]
    if (!('STUB_VERSION_EXIT' in env)) {
      expected.push(['install-browser', 'chromium', '--dry-run'])
      if (!('STUB_DRY_EXIT' in env || 'STUB_DRY_RUN' in env))
        expected.push(['install-browser', 'chromium', '--list'])
    }
    expect(result.calls.map((call) => call.args)).toEqual(expected)
    expect(result.calls.map((call) => call.noUpdateNotifier)).toEqual(expected.map(() => '1'))
    expect(readFileSync(f.unrelated, 'utf8')).toBe('keep')
    expect(
      readdirSync(f.root)
        .filter((name) => name !== 'calls.jsonl')
        .map((name) => [name, readFileSync(join(f.root, name), 'utf8')]),
    ).toEqual(before)
  })

  it('fails when the fixture PATH has no CLI shim', () => {
    const f = fixture()
    rmSync(join(f.root, 'playwright-cli'))
    rmSync(join(f.root, 'playwright-cli.cmd'))
    const result = run(loadManifest('playwright-cli.yaml').spec.verify.cmd, f)
    expect(result.status, result.stderr).not.toBe(0)
    expect(result.calls).toEqual([])
  })

  it.each([
    '0.1.21',
    '0.1.220',
    '0.1.22-beta',
  ])('rejects version %s before browser metadata checks', (version) => {
    const spec = loadManifest('playwright-cli.yaml').spec
    for (const cmd of [spec.verify.cmd, spec.install.idempotent_check]) {
      expect(cmd).toBeTypeOf('string')
      const result = run(cmd ?? '', fixture(), { STUB_VERSION: version })
      expect(result.status, result.stderr).not.toBe(0)
      expect(result.calls.map((call) => call.command)).toEqual(['--version'])
    }
  })
})
