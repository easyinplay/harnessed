import { spawnSync } from 'node:child_process'
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import { parseGitCloneDest } from '../../src/installers/lib/gitCloneArgs.js'
import { repairGstackCodexRuntimeAfterConfirm } from '../../src/installers/lib/gstackRuntime.js'
import { resolveBash } from '../../src/installers/lib/resolveBash.js'
import { validateManifestFile } from '../../src/manifest/validate.js'
import * as platform from '../../src/platform/platform.js'

const requiredSkills = [
  'gstack',
  'gstack-office-hours',
  'gstack-plan-ceo-review',
  'gstack-plan-eng-review',
  'gstack-review',
  'gstack-qa',
  'gstack-browse',
]
const temporaryRoots: string[] = []

beforeEach(() => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  for (const root of temporaryRoots.splice(0)) await rm(root, { recursive: true, force: true })
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'harnessed-gstack-runtime-'))
  temporaryRoots.push(root)
  const codexHome = join(root, 'custom codex')
  const runtime = join(codexHome, 'skills', 'gstack')
  for (const skill of requiredSkills) {
    const dir = join(codexHome, 'skills', skill)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'SKILL.md'), '# Fixture\n')
  }
  await mkdir(join(runtime, 'bin'))
  await writeFile(
    join(runtime, 'bin', 'gstack-browser-ensure'),
    'test "$#" -eq 1 && test "$1" = "--check" || exit 97\necho BROWSER_UNAVAILABLE_fixture\nexit 23\n',
  )
  return { root, codexHome, runtime }
}

async function manifest() {
  return parse(await readFile('manifests/skill-packs/gstack.yaml', 'utf8'))
}

async function repairFixture() {
  const f = await fixture()
  const sourceDir = join(f.root, 'source checkout')
  await mkdir(join(sourceDir, 'node_modules', 'playwright'), { recursive: true })
  await writeFile(join(sourceDir, 'package.json'), '{"name":"gstack"}')
  await writeFile(join(sourceDir, 'keep.txt'), 'user source edits')
  await writeFile(join(f.runtime, '.source-path'), `${sourceDir}\n`)
  return { ...f, sourceDir, host: 'codex', confirmed: true }
}

function runVerify(cmd: string, codexHome: string) {
  return spawnSync(resolveBash().path ?? 'bash', ['-c', cmd], {
    env: { ...process.env, CODEX_HOME: codexHome },
    encoding: 'utf8',
    timeout: 10_000,
    windowsHide: true,
  })
}

describe('gstack Codex manifest verification', () => {
  it('propagates the installed runtime browser check failure in the actual CODEX_HOME', async () => {
    const { codexHome } = await fixture()
    const cmd = (await manifest()).spec.harness_overrides.codex.verify.cmd
    const result = runVerify(cmd, codexHome)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(23)
    expect(result.stdout).toContain('BROWSER_UNAVAILABLE_fixture')
  })

  it('succeeds only after the installed runtime check and all required skills are present', async () => {
    const { codexHome, runtime } = await fixture()
    await writeFile(
      join(runtime, 'bin', 'gstack-browser-ensure'),
      'test "$#" -eq 1 && test "$1" = "--check" || exit 97\necho BROWSER_OK_fixture\n',
    )
    const cmd = (await manifest()).spec.harness_overrides.codex.verify.cmd
    expect(runVerify(cmd, codexHome).status).toBe(0)
    await rm(join(codexHome, 'skills', 'gstack-plan-eng-review', 'SKILL.md'))
    const result = runVerify(cmd, codexHome)
    expect(result.status).not.toBe(0)
    expect(result.stdout).not.toContain('BROWSER_OK_fixture')
    await mkdir(join(codexHome, 'skills', 'gstack-plan-eng-review', 'SKILL.md'))
    expect(runVerify(cmd, codexHome).status).not.toBe(0)
  })

  it('is schema-valid and leaves browser installation enabled only in confirmed setup', async () => {
    const yaml = await readFile('manifests/skill-packs/gstack.yaml', 'utf8')
    expect(validateManifestFile(yaml, 'gstack.yaml')).toMatchObject({ ok: true })
    const cfg = (await manifest()).spec.harness_overrides.codex
    expect(cfg.install.cmd).not.toContain('rm ')
    expect(cfg.install.cmd).not.toContain('--no-browser')
    expect(cfg.install.git_ref).toBe('514fbfdc9799376edfd2536f60659501a48ead64')
    expect(parseGitCloneDest(cfg.install.cmd)?.raw).toBe('~/gstack')
    expect(cfg.verify.timeout_ms).toBeLessThanOrEqual(60_000)
    expect(cfg.verify.cmd).toContain('--check')
  })

  it('keeps an existing checkout and invokes official setup with only the Codex host', async () => {
    const { root } = await fixture()
    const sourceDir = join(root, 'gstack')
    await mkdir(join(sourceDir, '.git'), { recursive: true })
    await writeFile(join(sourceDir, 'keep.txt'), 'local source changes')
    await writeFile(join(sourceDir, 'setup'), 'printf "%s\\n" "$@"\n')
    const cmd = (await manifest()).spec.harness_overrides.codex.install.cmd
    const result = spawnSync(resolveBash().path ?? 'bash', ['-c', cmd], {
      env: { ...process.env, HOME: root },
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe('--host\ncodex')
    expect(await readFile(join(sourceDir, 'keep.txt'), 'utf8')).toBe('local source changes')
  })

  it('checks out the tested SHA only for a fresh clone before official setup', async () => {
    const { root } = await fixture()
    const template = join(root, 'template')
    await mkdir(join(template, '.git'), { recursive: true })
    await writeFile(join(template, 'setup'), 'echo SETUP\n')
    const cmd = (await manifest()).spec.harness_overrides.codex.install.cmd
    const gitStub =
      'git() { printf "GIT:%s\\n" "$*"; if test "$1" = clone; then cp -R "$HOME/template" "$HOME/gstack"; fi; }; '
    const result = spawnSync(resolveBash().path ?? 'bash', ['-c', gitStub + cmd], {
      env: { ...process.env, HOME: root },
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('checkout --detach 514fbfdc9799376edfd2536f60659501a48ead64')
    expect(result.stdout.indexOf('checkout --detach')).toBeLessThan(result.stdout.indexOf('SETUP'))
  })
})

describe('repairGstackCodexRuntimeAfterConfirm', () => {
  it('links missing runtime dependencies to the expected source only after confirmation', async () => {
    const f = await repairFixture()
    const { runtime, sourceDir } = f
    const result = await repairGstackCodexRuntimeAfterConfirm(f)
    expect(result.status).toBe('created')
    expect((await lstat(join(runtime, 'node_modules'))).isSymbolicLink()).toBe(true)
    expect(await realpath(join(runtime, 'node_modules'))).toBe(
      await realpath(join(sourceDir, 'node_modules')),
    )
    expect(await readFile(join(sourceDir, 'keep.txt'), 'utf8')).toBe('user source edits')
    expect((await repairGstackCodexRuntimeAfterConfirm(f)).status).toBe('unchanged')
  })

  it.each([
    { host: 'codex', confirmed: false },
    { host: 'claude', confirmed: true },
  ])('does not write for $host with confirmed=$confirmed', async (overrides) => {
    const f = await repairFixture()
    expect(await repairGstackCodexRuntimeAfterConfirm({ ...f, ...overrides })).toEqual({
      status: 'skipped',
    })
    await expect(lstat(join(f.runtime, 'node_modules'))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('refuses a host argument that disagrees with the active host', async () => {
    const f = await repairFixture()
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    await expect(repairGstackCodexRuntimeAfterConfirm(f)).rejects.toThrow('active Codex host')
    await expect(lstat(join(f.runtime, 'node_modules'))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('uses CODEX_HOME rather than the shared skills directory when no override is supplied', async () => {
    const { codexHome, ...f } = await repairFixture()
    vi.stubEnv('CODEX_HOME', codexHome)
    expect((await repairGstackCodexRuntimeAfterConfirm(f)).status).toBe('created')
    expect((await lstat(join(f.runtime, 'node_modules'))).isSymbolicLink()).toBe(true)
  })

  it.each([
    { override: '', parent: 'parent custom' },
    { override: undefined, parent: '' },
  ])('uses the default runtime for override=$override and parent=$parent', async ({
    override,
    parent,
  }) => {
    const f = await repairFixture()
    const descriptor = platform.codexDescriptor(f.root)
    await rename(f.codexHome, descriptor.homeDir)
    vi.spyOn(platform, 'detectPlatform').mockReturnValue(descriptor)
    vi.stubEnv('CODEX_HOME', parent ? join(f.root, parent) : '')
    const runtimeRoot = join(descriptor.homeDir, 'skills', 'gstack')
    expect(await repairGstackCodexRuntimeAfterConfirm({ ...f, codexHome: override })).toEqual({
      status: 'created',
      runtimeRoot,
    })
    expect(await realpath(join(runtimeRoot, 'node_modules'))).toBe(
      await realpath(join(f.sourceDir, 'node_modules')),
    )
  })

  it('refuses a different recorded source without modifying the source or runtime', async () => {
    const f = await repairFixture()
    const other = join(f.root, 'other source')
    await mkdir(other)
    await writeFile(join(f.runtime, '.source-path'), `${other}\n`)
    await expect(repairGstackCodexRuntimeAfterConfirm(f)).rejects.toThrow('expected source')
    await expect(lstat(join(f.runtime, 'node_modules'))).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readFile(join(f.sourceDir, 'keep.txt'), 'utf8')).toBe('user source edits')
  })

  it('refuses to repair when the upstream source marker is absent', async () => {
    const f = await repairFixture()
    await rm(join(f.runtime, '.source-path'))
    await expect(repairGstackCodexRuntimeAfterConfirm(f)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(lstat(join(f.runtime, 'node_modules'))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('does not link a source without Playwright dependencies', async () => {
    const f = await repairFixture()
    await rm(join(f.sourceDir, 'node_modules', 'playwright'), { recursive: true })
    await expect(repairGstackCodexRuntimeAfterConfirm(f)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(lstat(join(f.runtime, 'node_modules'))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('preserves an existing real dependency directory byte-for-byte', async () => {
    const f = await repairFixture()
    const target = join(f.runtime, 'node_modules')
    await mkdir(target)
    await writeFile(join(target, 'keep.txt'), 'user runtime dependencies')
    expect((await repairGstackCodexRuntimeAfterConfirm(f)).status).toBe('unchanged')
    expect((await lstat(target)).isSymbolicLink()).toBe(false)
    expect(await readFile(join(target, 'keep.txt'), 'utf8')).toBe('user runtime dependencies')
  })

  it('preserves an existing file and reports the conflict', async () => {
    const f = await repairFixture()
    const target = join(f.runtime, 'node_modules')
    await writeFile(target, 'do not replace')
    await expect(repairGstackCodexRuntimeAfterConfirm(f)).rejects.toThrow('refusing to replace')
    expect(await readFile(target, 'utf8')).toBe('do not replace')
  })

  it.each([
    false,
    true,
  ])('preserves an incorrect dependency link (dangling=%s)', async (dangling) => {
    const f = await repairFixture()
    const other = join(f.root, 'other dependencies')
    if (!dangling) await mkdir(other)
    const target = join(f.runtime, 'node_modules')
    await symlink(other, target, process.platform === 'win32' ? 'junction' : 'dir')
    const original = await readlink(target)
    await expect(repairGstackCodexRuntimeAfterConfirm(f)).rejects.toThrow('refusing to replace')
    expect(await readlink(target)).toBe(original)
    expect(await readFile(join(f.sourceDir, 'keep.txt'), 'utf8')).toBe('user source edits')
  })
})
