import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AgentRepairResult, RepairRequest } from '../../../src/cli/lib/agentRepair.js'
import type { OwnershipAdoptionDependencies } from '../../../src/cli/lib/ownershipAdoption.js'
import type { DeclaredOwnership } from '../../../src/installers/lib/ownershipContract.js'
import type { Manifest } from '../../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../../src/platform/platform.js'

const homes: string[] = []

export function ownershipManifest(name: string): Manifest {
  return {
    metadata: { name, upstream: { source: `@fixture/${name}` } },
    spec: {
      type: 'cli-npm',
      component_type: 'command',
      install_type: 'npm',
      install: { method: 'npm-cli', cmd: `npx ${name}` },
      ownership: {
        resources: [
          {
            root: 'platform-skills',
            kind: 'directory',
            selector: { prefix: `${name}-` },
            marker: { path: 'SKILL.md', contains: name },
          },
        ],
      },
    },
  } as unknown as Manifest
}

export function nonOwnershipManifest(name: string): Manifest {
  const manifest = ownershipManifest(name)
  delete (manifest.spec as unknown as { ownership?: unknown }).ownership
  return manifest
}

export async function adoptionFixture(host: 'claude' | 'codex' = 'claude', ids = ['gsd']) {
  const home = await mkdtemp(join(tmpdir(), 'harnessed-adoption-'))
  homes.push(home)
  const descriptor = host === 'codex' ? codexDescriptor(home) : claudeDescriptor(home)
  const context = createHostInstallContext(descriptor, {
    os: process.platform,
    userHome: home,
    nativeHome: host === 'codex' ? join(home, '.custom-codex') : descriptor.homeDir,
  })
  const request: RepairRequest = {
    host,
    runtime: 'node',
    components: ids.map((id) => ({ id, status: 'retained', reasonCode: 'fixture' })),
    deterministicResult: {} as RepairRequest['deterministicResult'],
    authorization: {
      confirmed: true,
      mode: 'explicit-yes',
      components: ids,
      grantedAt: new Date().toISOString(),
    },
    hostRoot: context.nativeHome,
    allowedRoots: [context.nativeHome],
  }
  return { home, context, request }
}

export function repairResult(
  status: AgentRepairResult['status'],
  verified = false,
  components = ['gsd'],
  execution: AgentRepairResult['execution'] = 'claude',
): AgentRepairResult {
  return {
    requested: true,
    authorized: true,
    components,
    execution,
    status,
    verified,
    reasonCode: verified ? null : 'fixture',
  }
}

export function declaredOwnership(
  root: string,
  entries: Array<[string, 'file' | 'directory']>,
): DeclaredOwnership {
  const resources = entries.map(([name, kind]) => ({ path: join(root, name), root, kind }))
  return { resources, roots: [root], paths: resources.map(({ path }) => path) }
}

export function adoptionDependencies(
  manifests: Manifest[],
  discover: OwnershipAdoptionDependencies['discover'],
  writeReceipt: NonNullable<OwnershipAdoptionDependencies['writeReceipt']> = async () => undefined,
): OwnershipAdoptionDependencies {
  return {
    loadManifests: async () => manifests,
    discover,
    writeReceipt,
    withLock: async (_context, work) => work(),
  }
}

export async function cleanupAdoptionFixtures(): Promise<void> {
  await Promise.all(homes.splice(0).map((home) => rm(home, { recursive: true, force: true })))
}
