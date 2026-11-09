// Phase 85 — the force pass grants system scope to the OFFICIAL global-npm
// upgrade path only.
//
// `npm install -g <pkg>` is the host's own upgrade command for a globally
// installed CLI; it writes into the package-name-scoped npm global prefix, so
// it needs no ownership proof. The force pass (the user explicitly asked to
// update the already-installed components) may therefore run it WITHOUT the
// L4 `--system` consent gate.
//
// Every other component keeps the normal gate — including a npm-cli manifest
// whose cmd is NOT a global install (`npx --yes pkg@latest`), and including the
// normal (non-force) pass.
//
// The decision is taken on the EFFECTIVE install method + cmd (the resolved
// component plan), so a host override cannot smuggle a different command past
// the check.
//
// Only runInstall is mocked; the manifest files are REAL (written to a tmp
// dir) so the validation + plan resolution under test are the real ones.

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
  resolveForHarness: (manifest: unknown) => ({ manifest, gate: null }),
}))

import { runStepBInstall } from '../../src/cli/lib/setup-helpers.js'
import { runInstall } from '../../src/installers/index.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

const runInstallMock = vi.mocked(runInstall)

let home: string
let manifestDir: string

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'force-scope-'))
  manifestDir = join(home, 'manifests')
  await mkdir(manifestDir, { recursive: true })
  runInstallMock.mockReset().mockResolvedValue({ ok: true } as never)
})

afterEach(async () => {
  await rm(home, { recursive: true, force: true })
})

async function writeManifest(name: string, yaml: string): Promise<string> {
  const path = join(manifestDir, `${name}.yaml`)
  await writeFile(path, yaml, 'utf8')
  return path
}

function header(name: string, description: string): string {
  return `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: ${name}
  display_name: ${name}
  description: ${description}
  upstream:
    source: example/${name}
    homepage: https://example.com
    repository: https://github.com/example/${name}.git
    license: MIT
    notice: fixture
spec:
`
}

const HEALTH = `  upstream_health:
    stability: stable
    last_check: "2026-11-09"
    last_known_good_version: "1.0.0"
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

/** npm-cli, official global install (`npm install -g <pkg>`). */
const GLOBAL_NPM_YAML = `${header('ctx7', 'fixture')}  type: cli-npm
  component_type: cli-binary
  category: search
  install_type: npm
  install:
    method: npm-cli
    cmd: "npm install -g ctx7"
    npm_version: ^0.5.0
    idempotent_check: "command -v ctx7"
  verify:
    cmd: "ctx7 --version"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "npm uninstall -g ctx7"
${HEALTH}`

/** npm-cli, but NOT a global install — the L4 gate still applies. */
const NON_GLOBAL_NPM_YAML = `${header('localtool', 'fixture')}  type: cli-npm
  component_type: cli-binary
  category: search
  install_type: npm
  install:
    method: npm-cli
    cmd: "npx --yes localtool@latest"
    npm_version: ^1.0.0
    idempotent_check: "test -f marker"
  verify:
    cmd: "localtool --version"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "true"
${HEALTH}`

/** npx-skill-installer — never a global npm install. */
const SKILL_PACK_YAML = `${header('demo-pack', 'fixture')}  type: cc-skill-pack
  component_type: command
  category: engineering
  install_type: skill
  install:
    method: npx-skill-installer
    cmd: "npx --yes skills@latest add example/demo-pack --copy --global --yes"
    npm_version: ^1.0.0
    idempotent_check: "test -f marker"
  verify:
    cmd: "true"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "true"
${HEALTH}`

/**
 * Base declaration is a skill pack; the CODEX host override installs a global
 * npm package. The EFFECTIVE method + cmd decide the scope grant.
 */
const CODEX_OVERRIDE_YAML = `${header('override-pack', 'fixture')}  type: cc-skill-pack
  component_type: command
  category: engineering
  install_type: skill
  install:
    method: npx-skill-installer
    cmd: "npx --yes skills@latest add example/override-pack --copy --global --yes"
    npm_version: ^1.0.0
    idempotent_check: "test -f marker"
  verify:
    cmd: "true"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "true"
  harness_overrides:
    codex:
      install:
        method: npm-cli
        cmd: "npm install -g override-tool"
        npm_version: ^1.0.0
        idempotent_check: "command -v override-tool"
${HEALTH}`

function claudeContext() {
  return createHostInstallContext(claudeDescriptor(home), {
    os: process.platform,
    userHome: home,
    nativeHome: join(home, '.claude'),
  })
}

function codexContext() {
  return createHostInstallContext(codexDescriptor(home), {
    os: process.platform,
    userHome: home,
    nativeHome: join(home, '.codex'),
  })
}

function scopeOf(call: unknown[] | undefined): boolean | undefined {
  return (call?.[1] as { system?: boolean } | undefined)?.system
}

describe('runStepBInstall — force-pass system scope', () => {
  it('a global npm install runs with system scope in the force pass', async () => {
    const path = await writeManifest('ctx7', GLOBAL_NPM_YAML)

    const result = await runStepBInstall([path], {
      hostContext: claudeContext(),
      updateInstalled: true,
      forceSystemScope: true,
    })

    expect(result.failed).toEqual([])
    expect(result.installed).toEqual(['ctx7'])
    expect(runInstallMock).toHaveBeenCalledTimes(1)
    expect(scopeOf(runInstallMock.mock.calls[0])).toBe(true)
  })

  it('an npx-skill-installer component keeps the normal scope gate', async () => {
    const path = await writeManifest('demo-pack', SKILL_PACK_YAML)

    const result = await runStepBInstall([path], {
      hostContext: claudeContext(),
      updateInstalled: true,
      forceSystemScope: true,
    })

    expect(result.failed).toEqual([])
    expect(runInstallMock).toHaveBeenCalledTimes(1)
    expect(scopeOf(runInstallMock.mock.calls[0])).toBe(false)
  })

  it('a npm-cli component whose cmd is not a global install keeps the normal scope gate', async () => {
    const path = await writeManifest('localtool', NON_GLOBAL_NPM_YAML)

    const result = await runStepBInstall([path], {
      hostContext: claudeContext(),
      updateInstalled: true,
      forceSystemScope: true,
    })

    expect(result.failed).toEqual([])
    expect(runInstallMock).toHaveBeenCalledTimes(1)
    expect(scopeOf(runInstallMock.mock.calls[0])).toBe(false)
  })

  it('the normal pass does not grant system scope to a global npm install', async () => {
    const path = await writeManifest('ctx7', GLOBAL_NPM_YAML)

    const result = await runStepBInstall([path], {
      hostContext: claudeContext(),
      updateInstalled: true,
    })

    expect(result.failed).toEqual([])
    expect(scopeOf(runInstallMock.mock.calls[0])).toBe(false)
  })

  it('the EFFECTIVE (host-override) method decides, not the base declaration', async () => {
    const path = await writeManifest('override-pack', CODEX_OVERRIDE_YAML)

    const result = await runStepBInstall([path], {
      hostContext: codexContext(),
      updateInstalled: true,
      forceSystemScope: true,
    })

    expect(result.failed).toEqual([])
    expect(runInstallMock).toHaveBeenCalledTimes(1)
    expect(scopeOf(runInstallMock.mock.calls[0])).toBe(true)
  })

  it('a host override without a global npm cmd keeps the normal scope gate', async () => {
    const path = await writeManifest('override-pack', CODEX_OVERRIDE_YAML)

    const result = await runStepBInstall([path], {
      hostContext: claudeContext(),
      updateInstalled: true,
      forceSystemScope: true,
    })

    expect(result.failed).toEqual([])
    expect(runInstallMock).toHaveBeenCalledTimes(1)
    expect(scopeOf(runInstallMock.mock.calls[0])).toBe(false)
  })
})
