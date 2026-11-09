// Phase 85 — force-update authorization (prove-and-refresh).
//
// f5ca347 made every installer refuse a force-update pass whenever an existing
// target is present; cb990f8 added the declared-ownership machinery but never
// wired an authorization path into those gates, so `harnessed setup`'s
// force-update pass has been a dead end for every skill/plugin/clone component
// since v5.0.0 (maintainer dogfood 2026-11-05: 9/9 refused).
//
// These tests pin the RESTORED semantics: a refresh proceeds when the existing
// footprint is PROVABLY ours, and still refuses when it is not.
//
//   npxSkillInstaller / npmCli  — manifest-declared ownership with every
//                                 existing path passing the marker check
//   ccPluginMarketplace         — the plugin is registered under its QUALIFIED
//                                 name (name@marketplace) in the host registry
//   gitCloneWithSetup           — the existing checkout's git origin matches
//                                 the manifest clone URL
//
// Real filesystem under a tmp home (the marker/origin proofs are the code
// under test); only child_process and @clack/prompts are mocked.

import { EventEmitter } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => 'abort'),
  note: vi.fn(),
  isCancel: fnIsCancel,
  spinner: vi.fn(() => ({ start: () => {}, stop: () => {}, message: () => {} })),
}))
function fnIsCancel() {
  return false
}

import { spawn } from 'node:child_process'
import { installCcPluginMarketplace } from '../../src/installers/ccPluginMarketplace.js'
import { installGitCloneWithSetup } from '../../src/installers/gitCloneWithSetup.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installNpmCli } from '../../src/installers/npmCli.js'
import { installNpxSkillInstaller } from '../../src/installers/npxSkillInstaller.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(exitCode: number): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => child.emit('close', exitCode))
  return child
}

const FORCE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  updateInstalled: true,
  quiet: true,
  color: false,
}

let home: string

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'force-auth-'))
  // A FRESH child per spawn call: the fake emits `close` exactly once, so a
  // shared instance would leave every later spawn waiting on an event that
  // already fired.
  spawnMock
    .mockReset()
    .mockImplementation(() => makeChild(0) as unknown as ReturnType<typeof spawn>)
})

afterEach(async () => {
  await rm(home, { recursive: true, force: true })
})

function hostCtx(): InstallContext['hostContext'] {
  return createHostInstallContext(claudeDescriptor(home), {
    os: process.platform,
    userHome: home,
    // The claude host's native home IS ~/.claude — that is what makes the
    // installer's active skills dir (<nativeHome>/skills) the descriptor's
    // skillsDir, exactly as on a real machine.
    nativeHome: join(home, '.claude'),
  })
}

/**
 * A verify cmd that is TRUE in the fixture: the seeded skill's SKILL.md.
 * `~` expands to the context userHome (the tmp home), so the native
 * test-chain evaluator resolves it without a shell.
 */
const VERIFY_CMD = 'test -f ~/.claude/skills/auth-skill/SKILL.md'

function ctx(manifest: Manifest, opts: Partial<InstallOpts> = {}): InstallContext {
  return {
    manifest,
    opts: { ...FORCE_OPTS, ...opts },
    level: 'L2',
    cwd: join(home, 'proj'),
    hostContext: hostCtx(),
  }
}

function npxManifest(withOwnership: boolean): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'auth-pack',
      display_name: 'auth pack',
      description: 'fixture',
      upstream: {
        source: 'example/auth-pack',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/auth-pack.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'command',
      install: {
        method: 'npx-skill-installer',
        cmd: 'npx --yes skills@latest add example/auth-pack --copy --global --yes',
        npm_version: '^1.0.0',
        idempotent_check: 'test -f marker',
        installs_skills: ['auth-skill'],
      },
      verify: { cmd: VERIFY_CMD, timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'true', cleanup_paths: [] },
      category: 'engineering',
      install_type: 'skill',
      upstream_health: {
        stability: 'stable',
        last_check: '2026-11-05',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      ...(withOwnership
        ? {
            ownership: {
              resources: [
                {
                  root: 'platform-skills',
                  kind: 'directory',
                  selector: { names: ['auth-skill'] },
                  marker: { path: 'SKILL.md', contains: 'name: auth-skill' },
                },
              ],
            },
          }
        : {}),
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

async function seedSkill(name: string, marker: string): Promise<string> {
  const dir = join(claudeDescriptor(home).skillsDir, name)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), marker)
  return dir
}

describe('npxSkillInstaller force-update authorization', () => {
  it('declared + marker-proven existing skill → the refresh command runs', async () => {
    await seedSkill('auth-skill', '---\nname: auth-skill\n---\nbody\n')
    const r = await installNpxSkillInstaller(ctx(npxManifest(true)))
    expect(r).toMatchObject({ ok: true })
    const commands = spawnMock.mock.calls.map((c) => (c[1] as string[]).join(' '))
    expect(commands.some((c) => c.includes('skills@latest add'))).toBe(true)
  })

  it('declared + marker MISMATCH (external look-alike) → refuses, no refresh', async () => {
    await seedSkill('auth-skill', '---\nname: someone-elses-skill\n---\n')
    const r = await installNpxSkillInstaller(ctx(npxManifest(true)))
    expect(r).toMatchObject({ ok: false, error: { keyword: 'update-unsupported' } })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('skills@latest add')),
    ).toBe(false)
  })

  it('undeclared + existing skill → refuses (fail-closed unchanged)', async () => {
    await seedSkill('auth-skill', '---\nname: auth-skill\n---\n')
    const r = await installNpxSkillInstaller(ctx(npxManifest(false)))
    expect(r).toMatchObject({ ok: false, error: { keyword: 'update-unsupported' } })
  })
})

function npmManifest(withOwnership: boolean): Manifest {
  const m = npxManifest(withOwnership)
  const spec = m.spec as Record<string, unknown>
  spec.type = 'cli-npm'
  spec.component_type = 'command'
  spec.install = {
    method: 'npm-cli',
    cmd: 'npm install -g auth-pack@^1.0.0',
    npm_version: '^1.0.0',
    idempotent_check: 'test -f marker',
    installs_skills: ['auth-skill'],
  }
  return m
}

describe('npmCli force-update authorization', () => {
  it('declared + marker-proven existing skill → the official npm command runs', async () => {
    await seedSkill('auth-skill', '---\nname: auth-skill\n---\nbody\n')
    const r = await installNpmCli(ctx(npmManifest(true), { system: true }))
    expect(r).toMatchObject({ ok: true })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('npm install -g')),
    ).toBe(true)
  })

  it('declared + marker mismatch → refuses, no global npm run', async () => {
    await seedSkill('auth-skill', '---\nname: someone-elses-skill\n---\n')
    const r = await installNpmCli(ctx(npmManifest(true), { system: true }))
    expect(r).toMatchObject({ ok: false, error: { keyword: 'update-unsupported' } })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('npm install -g')),
    ).toBe(false)
  })
})

function marketplaceManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'superpowers',
      display_name: 'superpowers',
      description: 'fixture',
      upstream: {
        source: 'obra/superpowers',
        homepage: 'https://example.com',
        repository: 'https://github.com/obra/superpowers.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-plugin',
      component_type: 'command',
      install: {
        method: 'cc-plugin-marketplace',
        cmd: 'claude plugin marketplace add obra/superpowers && claude plugin install superpowers@superpowers-marketplace',
        git_ref: '0123456789abcdef0123456789abcdef01234567',
        idempotent_check: 'test -f marker',
      },
      verify: { cmd: VERIFY_CMD, timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'true', cleanup_paths: [] },
      category: 'engineering',
      install_type: 'plugin',
      upstream_health: {
        stability: 'stable',
        last_check: '2026-11-05',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      marketplace: { owner: 'obra', repo: 'superpowers' },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

async function seedPluginRegistry(entries: Record<string, unknown>): Promise<void> {
  const dir = join(home, '.claude', 'plugins')
  await mkdir(dir, { recursive: true })
  await writeFile(
    join(dir, 'installed_plugins.json'),
    JSON.stringify({ version: 2, plugins: entries }),
  )
  // The registry says "installed"; ~/.claude.json says "enabled". A refresh
  // must preserve the enabled state, so the fixture enables the plugin too.
  await writeFile(
    join(home, '.claude.json'),
    JSON.stringify(
      { enabledPlugins: Object.fromEntries(Object.keys(entries).map((key) => [key, true])) },
      null,
      2,
    ),
  )
}

describe('ccPluginMarketplace force-update authorization', () => {
  it('registered under the QUALIFIED name → the official plugin install runs', async () => {
    await seedSkill('auth-skill', '---\nname: auth-skill\n---\nbody\n')
    await seedPluginRegistry({ 'superpowers@superpowers-marketplace': { version: '1.0.0' } })
    const r = await installCcPluginMarketplace(ctx(marketplaceManifest()))
    expect(r).toMatchObject({ ok: true })
    const commands = spawnMock.mock.calls.map((c) => (c[1] as string[]).join(' '))
    expect(commands.some((c) => c.includes('plugin') && c.includes('install'))).toBe(true)
  })

  it('registered under a DIFFERENT marketplace (bare name only) → refuses', async () => {
    await seedPluginRegistry({ 'superpowers@somewhere-else': { version: '1.0.0' } })
    const r = await installCcPluginMarketplace(ctx(marketplaceManifest()))
    expect(r).toMatchObject({ ok: false, error: { keyword: 'update-unsupported' } })
    expect(spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('install'))).toBe(
      false,
    )
  })
})

function cloneManifest(cmd?: string): Manifest {
  const m = npxManifest(false)
  const spec = m.spec as Record<string, unknown>
  spec.type = 'cli-git'
  spec.install = {
    method: 'git-clone-with-setup',
    cmd: cmd ?? `git clone https://github.com/example/gstack.git ${join(home, 'gstack')}`,
    git_ref: '0123456789abcdef0123456789abcdef01234567',
    idempotent_check: 'test -f marker',
  }
  return m
}

async function seedCheckout(dir: string, originUrl: string): Promise<void> {
  await mkdir(join(dir, '.git'), { recursive: true })
  await writeFile(
    join(dir, '.git', 'config'),
    `[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = ${originUrl}\n`,
  )
}

describe('gitCloneWithSetup force-update authorization', () => {
  it('existing checkout origin matches the manifest URL → the clone command runs', async () => {
    await seedSkill('auth-skill', '---\nname: auth-skill\n---\nbody\n')
    await seedCheckout(join(home, 'gstack'), 'https://github.com/example/gstack.git')
    const r = await installGitCloneWithSetup(ctx(cloneManifest()))
    expect(r).toMatchObject({ ok: true })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('git clone')),
    ).toBe(true)
  })

  it('existing checkout origin MISMATCHES → refuses, no clone over foreign checkout', async () => {
    await seedCheckout(join(home, 'gstack'), 'https://github.com/someone-else/gstack.git')
    const r = await installGitCloneWithSetup(ctx(cloneManifest()))
    expect(r).toMatchObject({ ok: false, error: { keyword: 'update-unsupported' } })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('git clone')),
    ).toBe(false)
  })

  it('pre-clean + in-checkout setup cmd (gstack shape) with a proven origin → refresh runs', async () => {
    await seedSkill('auth-skill', '---\nname: auth-skill\n---\nbody\n')
    const dest = join(home, 'gstack')
    await seedCheckout(dest, 'https://github.com/example/gstack.git')
    const cmd = `rm -rf ${dest} && git clone https://github.com/example/gstack.git ${dest} && cd ${dest} && bash ./setup`
    const r = await installGitCloneWithSetup(ctx(cloneManifest(cmd)))
    expect(r).toMatchObject({ ok: true })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('git clone')),
    ).toBe(true)
  })

  it('cmd that copies its payload into a shared namespace → still refused', async () => {
    const cache = join(home, 'cache')
    const shared = join(home, '.agents', 'skills', 'shared-pack')
    await seedCheckout(cache, 'https://github.com/example/midway.git')
    const cmd = `rm -rf ${cache} && git clone https://github.com/example/midway.git ${cache} && cp -R ${cache}/pack ${shared}`
    const r = await installGitCloneWithSetup(ctx(cloneManifest(cmd)))
    expect(r).toMatchObject({ ok: false, error: { keyword: 'update-unsupported' } })
    expect(
      spawnMock.mock.calls.some((c) => (c[1] as string[]).join(' ').includes('git clone')),
    ).toBe(false)
  })
})
