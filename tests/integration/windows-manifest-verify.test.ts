import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { InstallContext } from '../../src/installers/lib/types.js'
import { verifyInstalled } from '../../src/installers/lib/verifyInstalled.js'
import { validateManifestFile } from '../../src/manifest/validate.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const roots: string[] = []
const runtimes =
  process.platform === 'win32' && spawnSync('bun', ['--version']).status === 0
    ? ['node', 'bun']
    : ['node']

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(name: string): InstallContext {
  const root = mkdtempSync(join(tmpdir(), 'harnessed installer verify '))
  roots.push(root)
  const file = resolve('manifests/tools', `${name}.yaml`)
  const parsed = validateManifestFile(readFileSync(file, 'utf8'), file)
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors))
  if (process.platform !== 'win32') symlinkSync(process.execPath, join(root, 'node'))
  parsed.manifest.spec.install.env = {
    PATH: process.platform === 'win32' ? root + delimiter + dirname(process.execPath) : root,
  }
  return {
    manifest: parsed.manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: true,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
    level: name === 'playwright-cli' ? 'L4' : 'L2',
    cwd: root,
    hostContext: createHostInstallContext(claudeDescriptor(root), {
      os: process.platform,
      userHome: root,
      neutralSpawnCwd: root,
    }),
  }
}

async function verify(ctx: InstallContext, runtime: string) {
  if (runtime === 'node') return await verifyInstalled(ctx, { neutralCwd: true })
  const file = join(ctx.cwd, 'context.json')
  writeFileSync(file, JSON.stringify(ctx))
  const result = spawnSync(
    'bun',
    [resolve('tests/fixtures/installers/verify-installed.ts'), file],
    {
      encoding: 'utf8',
      timeout: 15_000,
    },
  )
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout)
}

describe('manifest verification through the installer shell', () => {
  it.each(
    runtimes,
  )('verifies webapp-testing without Python or executing the helper (%s)', async (runtime) => {
    const ctx = fixture('webapp-testing')
    const skill = join(ctx.cwd, '.agents/skills/webapp-testing')
    mkdirSync(join(skill, 'scripts'), { recursive: true })
    writeFileSync(join(skill, 'SKILL.md'), '# Webapp testing\n')
    writeFileSync(join(skill, 'scripts/with_server.py'), 'raise RuntimeError("Must not execute")\n')
    for (const binary of ['python', 'python3', 'py']) {
      const probe = spawnSync(binary, ['--version'], {
        cwd: ctx.cwd,
        env: { ...process.env, PATH: ctx.manifest.spec.install.env?.PATH },
      })
      expect(probe.error?.message).toContain('ENOENT')
    }
    const result = await verify(ctx, runtime)
    expect(result, JSON.stringify(result)).toBeNull()
  })

  it.each(
    runtimes.flatMap((runtime) =>
      ['posix', 'windows'].map((pathStyle) => ({ runtime, pathStyle })),
    ),
  )('verifies Playwright metadata without a daemon ($runtime, $pathStyle paths)', async ({
    runtime,
    pathStyle,
  }) => {
    const ctx = fixture('playwright-cli')
    const script = join(ctx.cwd, 'playwright-stub.cjs')
    const reference = [
      'global',
      'node_modules',
      '@playwright',
      'cli',
      'node_modules',
      'playwright-core',
    ].join(pathStyle === 'windows' ? '\\' : '/')
    writeFileSync(
      script,
      `
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const command = args[0];
fs.appendFileSync(path.join(__dirname, 'calls.jsonl'), JSON.stringify({command, args, noUpdateNotifier: process.env.NO_UPDATE_NOTIFIER}) + '\\n');
if (args.some(arg => ['open', 'run-code', 'close'].includes(arg))) process.exit(91);
if (command === '--version') console.log('0.1.22');
else if (JSON.stringify(args) === JSON.stringify(['install-browser', 'chromium', '--dry-run']))
  console.log('Chrome for Testing 155.0 (playwright chromium v1247)\\n  Install location: /cache/chromium-1247');
else if (JSON.stringify(args) === JSON.stringify(['install-browser', 'chromium', '--list']))
  console.log('Playwright version: 1.64.0\\n  Browsers:\\n    /cache/chromium-1247\\n  References:\\n    ' + ${JSON.stringify(reference)});
else { console.error('Browser/daemon startup is forbidden'); process.exitCode = 23; }
`,
    )
    writeFileSync(
      join(ctx.cwd, 'playwright-cli.cmd'),
      `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`,
    )
    const shim = join(ctx.cwd, 'playwright-cli')
    writeFileSync(
      shim,
      `#!/bin/sh\nexec '${process.execPath.replace(/\\/g, '/')}' '${script.replace(/\\/g, '/')}' "$@"\n`,
    )
    chmodSync(shim, 0o755)
    const result = await verify(ctx, runtime)
    expect(result, JSON.stringify(result)).toBeNull()
    const calls = readFileSync(join(ctx.cwd, 'calls.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    expect(calls.map((call) => call.args)).toEqual([
      ['--version'],
      ['install-browser', 'chromium', '--dry-run'],
      ['install-browser', 'chromium', '--list'],
    ])
    expect(calls.map((call) => call.noUpdateNotifier)).toEqual(['1', '1', '1'])
    expect(
      calls.some((call) =>
        call.args.some((arg: string) => ['open', 'run-code', 'close'].includes(arg)),
      ),
    ).toBe(false)
  })
})
