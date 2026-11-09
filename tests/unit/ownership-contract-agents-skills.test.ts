// Phase 85 — the `agents-skills` ownership root.
//
// The `skills` CLI installs into ~/.agents/skills by default; the REAL files of
// a host-skills-dir symlink live there. A manifest that declares
// `root: agents-skills` must therefore resolve to <userHome>/.agents/skills —
// NOT the host descriptor's skillsDir (~/.claude/skills).
//
// Discovery is the AUTHORIZATION for a force-update refresh: a declared path is
// discovered only when its marker file matches the declaration. The snapshot is
// the structure-only counterpart ("what is there"), so the two differ exactly
// on the marker check.
//
// Real filesystem under a tmp home (the marker proof IS the code under test);
// nothing here touches the real ~/.claude or the real home.

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  discoverDeclaredOwnership,
  snapshotDeclaredOwnership,
} from '../../src/installers/lib/ownershipContract.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const SKILL_NAME = 'agents-skill'
const MARKER = 'name: agents-skill'

let home: string

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'agents-skills-'))
})

afterEach(async () => {
  await rm(home, { recursive: true, force: true })
})

/** The shared `skills` CLI install root — Phase 85's 5th ownership root. */
function agentsSkillsRoot(): string {
  return join(home, '.agents', 'skills')
}

function manifestWith(markerContains: string): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'agents-pack',
      display_name: 'agents pack',
      description: 'fixture',
      upstream: {
        source: 'example/agents-pack',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/agents-pack.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'command',
      category: 'engineering',
      install_type: 'skill',
      install: {
        method: 'npx-skill-installer',
        cmd: `npx --yes skills@latest add example/agents-pack --copy --global --yes --skill ${SKILL_NAME}`,
        npm_version: '^1.0.0',
        idempotent_check: 'test -f marker',
      },
      verify: { cmd: 'true', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'true', cleanup_paths: [] },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-11-09',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      ownership: {
        resources: [
          {
            root: 'agents-skills',
            kind: 'directory',
            selector: { names: [SKILL_NAME] },
            marker: { path: 'SKILL.md', contains: markerContains },
          },
        ],
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

function ctx(manifest: Manifest): InstallContext {
  return {
    manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      updateInstalled: true,
      quiet: true,
      color: false,
    },
    level: 'L2',
    cwd: join(home, 'proj'),
    hostContext: createHostInstallContext(claudeDescriptor(home), {
      os: process.platform,
      userHome: home,
      // The claude host's native home IS ~/.claude — exactly as on a real machine.
      nativeHome: join(home, '.claude'),
    }),
  }
}

async function seedAgentsSkill(marker: string): Promise<string> {
  const dir = join(agentsSkillsRoot(), SKILL_NAME)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), marker)
  return dir
}

describe('declared ownership — the agents-skills root', () => {
  it('resolves to the shared ~/.agents/skills dir, not the host skills dir', () => {
    expect(agentsSkillsRoot()).not.toBe(claudeDescriptor(home).skillsDir)
  })

  it('discovers the real ~/.agents/skills/<name> directory when the marker matches', async () => {
    const dir = await seedAgentsSkill(`---\n${MARKER}\n---\nbody\n`)

    const discovered = await discoverDeclaredOwnership(ctx(manifestWith(MARKER)))

    expect(discovered.paths).toEqual([dir])
    expect(discovered.roots).toEqual([agentsSkillsRoot()])
    expect(discovered.resources).toEqual([
      { path: dir, root: agentsSkillsRoot(), kind: 'directory' },
    ])
  })

  it('does NOT discover a directory whose marker does not match', async () => {
    await seedAgentsSkill('---\nname: someone-elses-skill\n---\n')

    const discovered = await discoverDeclaredOwnership(ctx(manifestWith(MARKER)))

    expect(discovered.paths).toEqual([])
    expect(discovered.resources).toEqual([])
  })

  it('snapshots the declared path even when the marker mismatches (structure vs proof)', async () => {
    const dir = await seedAgentsSkill('---\nname: someone-elses-skill\n---\n')
    const context = ctx(manifestWith(MARKER))

    const snapshot = await snapshotDeclaredOwnership(context)
    const discovered = await discoverDeclaredOwnership(context)

    expect(snapshot.paths).toEqual([dir])
    expect(discovered.paths).toEqual([])
  })

  it('discovers nothing when the shared skills root does not exist', async () => {
    const discovered = await discoverDeclaredOwnership(ctx(manifestWith(MARKER)))

    expect(discovered.paths).toEqual([])
    expect(discovered.roots).toEqual([agentsSkillsRoot()])
  })
})
