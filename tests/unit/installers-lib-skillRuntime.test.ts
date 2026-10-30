import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { executeRegisteredUpdate } from '../../src/cli/lib/updateAdapters/registry.js'
import {
  observeGsdRuntimeIdentity,
  verifyGsdRuntimeIntegrity,
  verifySkillRuntime,
} from '../../src/installers/lib/skillRuntime.js'
import type { InstallContext } from '../../src/installers/lib/types.js'
import { validateManifestFile } from '../../src/manifest/validate.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { descriptorFor } from '../../src/platform/platform.js'

const roots: string[] = []
const runtimeIdentityPayload = { packageName: '@opengsd/gsd-core', version: '1.18.0' }

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture(
  output: string,
  hostId: 'claude' | 'codex' = 'codex',
): Promise<InstallContext> {
  const root = await mkdtemp(join(tmpdir(), 'harnessed-gsd-runtime-'))
  roots.push(root)
  const nativeHome = join(root, `.${hostId}`)
  await mkdir(join(nativeHome, 'gsd-core', 'bin'), { recursive: true })
  await writeFile(
    join(nativeHome, 'gsd-core', 'bin', 'gsd-tools.cjs'),
    `console.log(${JSON.stringify(output)})\n`,
  )
  const manifestPath = new URL('../../manifests/skill-packs/gsd.yaml', import.meta.url)
  const validated = validateManifestFile(
    await readFile(manifestPath, 'utf8'),
    manifestPath.pathname,
  )
  if (!validated.ok) throw new Error('Invalid GSD fixture manifest')
  validated.manifest.spec.install.env = { CODEX_HOME: nativeHome, CLAUDE_CONFIG_DIR: nativeHome }
  return {
    cwd: root,
    level: 'L1',
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
    hostContext: createHostInstallContext(descriptorFor(hostId, root), {
      os: process.platform,
      userHome: root,
      nativeHome,
    }),
    manifest: validated.manifest,
  }
}

function runtimeFiles(ctx: InstallContext): string[] {
  const home = ctx.hostContext?.nativeHome ?? ''
  return [
    join(home, 'skills', 'gsd-plan-phase', 'SKILL.md'),
    ...['discuss-phase', 'plan-phase', 'execute-phase', 'verify-work', 'progress'].map((phase) =>
      join(home, 'gsd-core', 'workflows', `${phase}.md`),
    ),
    join(home, 'gsd-core', 'references', 'ui-brand.md'),
    ...['phase-researcher', 'planner', 'plan-checker', 'executor', 'verifier'].map((role) =>
      join(home, 'agents', `gsd-${role}.${ctx.hostContext?.hostId === 'codex' ? 'toml' : 'md'}`),
    ),
  ]
}

async function completeRuntime(ctx: InstallContext): Promise<void> {
  for (const path of runtimeFiles(ctx)) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, 'installed runtime resource\n')
  }
}

describe('GSD update runtime integrity', () => {
  it.each([
    'claude',
    'codex',
  ] as const)('verifies the complete %s runtime without mutation even in dry-run', async (hostId) => {
    const ctx = await fixture(JSON.stringify(runtimeIdentityPayload), hostId)
    await completeRuntime(ctx)
    ctx.opts.dryRun = true
    const files = [
      ...runtimeFiles(ctx),
      join(ctx.hostContext?.nativeHome ?? '', 'gsd-core', 'bin', 'gsd-tools.cjs'),
    ]
    const before = await Promise.all(files.map((path) => readFile(path, 'utf8')))

    await expect(verifyGsdRuntimeIntegrity(ctx)).resolves.toEqual({ ok: true })
    expect(await Promise.all(files.map((path) => readFile(path, 'utf8')))).toEqual(before)
  })

  it.each(
    Array.from({ length: 12 }, (_, index) => index),
  )('rejects missing required runtime asset %i even when identity remains valid', async (index) => {
    const ctx = await fixture(JSON.stringify(runtimeIdentityPayload))
    await completeRuntime(ctx)
    const path = runtimeFiles(ctx)[index]
    if (!path) throw new Error('Missing runtime fixture asset')
    await rm(path)

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({ kind: 'known' })
    await expect(verifyGsdRuntimeIntegrity(ctx)).resolves.toMatchObject({
      ok: false,
      reasonCode: 'skill-runtime-incomplete',
    })
  })

  it.each(['empty', 'directory'] as const)('rejects an %s runtime asset', async (kind) => {
    const ctx = await fixture(JSON.stringify(runtimeIdentityPayload))
    await completeRuntime(ctx)
    const path = join(ctx.hostContext?.nativeHome ?? '', 'gsd-core', 'workflows', 'plan-phase.md')
    if (kind === 'empty') await writeFile(path, '')
    else {
      await rm(path)
      await mkdir(path)
    }

    await expect(verifyGsdRuntimeIntegrity(ctx)).resolves.toMatchObject({
      ok: false,
      reasonCode: 'skill-runtime-incomplete',
    })
  })

  it('does not verify without captured host context', async () => {
    const ctx = await fixture(JSON.stringify(runtimeIdentityPayload))
    await completeRuntime(ctx)
    delete ctx.hostContext

    await expect(verifyGsdRuntimeIntegrity(ctx)).resolves.toMatchObject({
      ok: false,
      reasonCode: 'unknown-host',
    })
  })

  it.each([
    ['current', '1.18.0', true],
    ['updated', '1.19.0', true],
    ['retained', '1.18.0', false],
  ] as const)('rejects %s after installer deletes an asset but leaves a valid identity shim', async (_status, version, installed) => {
    const ctx = await fixture(JSON.stringify(runtimeIdentityPayload))
    await completeRuntime(ctx)
    const home = ctx.hostContext?.nativeHome ?? ''
    const result = await executeRegisteredUpdate(
      {
        componentId: 'gsd',
        mode: 'apply',
        host: 'codex',
        runtime: 'node',
        scope: 'global',
        cwd: ctx.cwd,
      },
      {
        observe: () => observeGsdRuntimeIdentity(ctx),
        verifyRuntime: () => verifyGsdRuntimeIntegrity(ctx),
        install: async () => {
          await rm(join(home, 'gsd-core', 'workflows', 'execute-phase.md'))
          await writeFile(
            join(home, 'gsd-core', 'bin', 'gsd-tools.cjs'),
            `console.log(${JSON.stringify(JSON.stringify({ ...runtimeIdentityPayload, version }))})\n`,
          )
          return installed ? { ok: true } : { ok: false, message: 'partial installer failure' }
        },
      },
    )

    expect(result.status).toBe('failed')
    expect(result.components[0]).toMatchObject({
      status: 'failed',
      before: '1.18.0',
      after: version,
      verified: false,
      reasonCode: 'skill-runtime-incomplete',
    })
  })
})

describe('GSD skill runtime identity', () => {
  it.each([
    'claude',
    'codex',
  ] as const)('accepts the upstream package/version payload using captured %s installation evidence', async (hostId) => {
    const ctx = await fixture(JSON.stringify(runtimeIdentityPayload), hostId)

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toEqual({
      kind: 'known',
      identity: { ...runtimeIdentityPayload, host: hostId, scope: 'global' },
      evidence: join(ctx.hostContext?.nativeHome ?? '', 'gsd-core', 'bin', 'gsd-tools.cjs'),
    })
  })

  it('uses captured host and target rather than optional upstream host/scope fields', async () => {
    const ctx = await fixture(
      JSON.stringify({ ...runtimeIdentityPayload, host: 'claude', scope: 'project' }),
    )

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({
      kind: 'known',
      identity: { ...runtimeIdentityPayload, host: 'codex', scope: 'global' },
    })
  })

  it('does not accept payload host/scope as a substitute for captured context', async () => {
    const ctx = await fixture(
      JSON.stringify({ ...runtimeIdentityPayload, host: 'codex', scope: 'global' }),
    )
    delete ctx.hostContext

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({
      kind: 'unknown',
      reasonCode: 'unknown-host',
    })
  })

  it('rejects a wrong package even at the captured global installation target', async () => {
    const ctx = await fixture(
      JSON.stringify({ ...runtimeIdentityPayload, packageName: 'get-shit-done-cc' }),
    )

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({
      kind: 'unknown',
      reasonCode: 'wrong-package',
    })
  })

  it('does not prove global scope for a runtime redirected outside the installation target', async () => {
    const ctx = await fixture(
      JSON.stringify({ ...runtimeIdentityPayload, host: 'codex', scope: 'global' }),
    )
    const nativeHome = ctx.hostContext?.nativeHome ?? ''
    const projectRuntime = join(ctx.cwd, 'project-runtime')
    await mkdir(join(projectRuntime, 'bin'), { recursive: true })
    await writeFile(
      join(projectRuntime, 'bin', 'gsd-tools.cjs'),
      `console.log(${JSON.stringify(JSON.stringify(runtimeIdentityPayload))})\n`,
    )
    await rm(join(nativeHome, 'gsd-core'), { recursive: true })
    await symlink(projectRuntime, join(nativeHome, 'gsd-core'), 'junction')

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({
      kind: 'unknown',
      reasonCode: 'unproven-scope',
    })
  })

  it('exposes structured package, version, host and scope evidence', async () => {
    const ctx = await fixture(
      JSON.stringify({
        packageName: '@opengsd/gsd-core',
        version: '1.18.0',
        host: 'codex',
        scope: 'global',
      }),
    )

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({
      kind: 'known',
      identity: {
        packageName: '@opengsd/gsd-core',
        version: '1.18.0',
        host: 'codex',
        scope: 'global',
      },
    })
  })

  it('returns a structured missing observation and keeps verify failure behavior', async () => {
    const ctx = await fixture('')
    await rm(join(ctx.hostContext?.nativeHome ?? '', 'gsd-core', 'bin', 'gsd-tools.cjs'))

    await expect(observeGsdRuntimeIdentity(ctx)).resolves.toMatchObject({
      kind: 'not-installed',
      reasonCode: 'runtime-missing',
    })
    await expect(verifySkillRuntime(ctx)).resolves.toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'skill-runtime-incomplete' },
    })
  })
})
