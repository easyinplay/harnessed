import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { resolveCapabilityCmd } from '../../src/cli/lib/capabilityResolver.js'
import { resolveBash } from '../../src/installers/lib/resolveBash.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const homes: string[] = []
const helper = `import argparse, sys
assert sys.flags.isolated and sys.flags.dont_write_bytecode and sys.flags.no_site
parser = argparse.ArgumentParser(description="Run command with one or more servers")
parser.add_argument("--server", action="append", required=True)
parser.add_argument("--port", action="append", type=int, required=True)
parser.add_argument("--timeout", type=int, default=30)
parser.parse_args()
raise RuntimeError("Only --help is permitted during verification")
`

afterEach(() => {
  for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true })
})

function manifest() {
  const file = resolve('manifests/tools/webapp-testing.yaml')
  const result = validateManifestFile(readFileSync(file, 'utf8'), file)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.manifest
}

function home() {
  const root = mkdtempSync(join(tmpdir(), 'harnessed webapp contract '))
  homes.push(root)
  return root
}

function put(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
}

function snapshot(root: string) {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const path = join(entry.parentPath, entry.name)
        return [path, readFileSync(path, 'utf8')]
      }),
  )
}

function verify(root: string, env: NodeJS.ProcessEnv = {}) {
  const shell = process.platform === 'win32' ? resolveBash().path : '/bin/sh'
  if (!shell) throw new Error('A working POSIX shell is required')
  const result = spawnSync(shell, ['-c', manifest().spec.verify.cmd], {
    cwd: root,
    env: {
      ...process.env,
      HOME: root,
      USERPROFILE: root,
      HARNESSED_PLATFORM: 'claude',
      CODEX_HOME: '',
      ...env,
    },
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (result.error) throw result.error
  return result
}

describe('Anthropic webapp-testing skill runtime contract', () => {
  it('declares an independent L2 skill with official license provenance and no project installs', () => {
    const { metadata, spec } = manifest()
    expect(metadata.upstream).toMatchObject({
      repository: 'https://github.com/anthropics/skills.git',
      license: 'anthropics-official',
      license_source: 'anthropics-official',
    })
    expect(spec).toMatchObject({
      type: 'cc-skill-pack',
      component_type: 'command',
      category: 'testing',
      install_type: 'skill',
      install: {
        method: 'npx-skill-installer',
        installs_skills: ['webapp-testing'],
        cmd: 'npx --yes skills@latest add anthropics/skills --skill webapp-testing --copy --global -y',
      },
    })
    expect(metadata.upstream.notice).toContain('project-level dependency')
    expect(spec.install.cmd).not.toMatch(/\bpip\b|@playwright\/test/)
  })

  it('maps the real skill provider for both hosts, without accepting gstack as its presence', () => {
    const entry = parse(readFileSync(resolve('workflows/capabilities.yaml'), 'utf8')).capabilities[
      'webapp-testing'
    ]
    expect(entry).toMatchObject({
      impl: 'user-skill',
      install_type: 'user-skill',
      skill_dir: 'webapp-testing',
      category: 'tool-bundled-skill',
      cmd: '/webapp-testing',
    })
    for (const host of ['claude', 'codex'] as const) {
      expect(resolveCapabilityCmd(entry, new Set(), new Set(['gstack']), host).warning).toBeTruthy()
      const result = resolveCapabilityCmd(entry, new Set(), new Set(['webapp-testing']), host)
      expect(result.warning).toBeUndefined()
      expect(result.renderedCmd).toBe(host === 'codex' ? '$webapp-testing' : '/webapp-testing')
    }
    expect(entry.description).toContain('project-level dependency')
  })

  it.each([
    '.agents/skills',
    '.codex/skills',
    '.claude/skills',
  ])('reads same-root resources and runs only isolated helper --help under %s', (directory) => {
    const root = home()
    const skill = join(root, directory, 'webapp-testing')
    put(join(skill, 'SKILL.md'), '# Webapp testing\n')
    put(join(skill, 'scripts/with_server.py'), helper)
    put(join(root, 'package.json'), '{"private":true}\n')
    const before = snapshot(root)
    const result = verify(root)
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('Run command with one or more servers')
    expect(result.stdout).toContain('--server')
    expect(snapshot(root)).toEqual(before)
  })

  it('does not accept a Claude-only payload for active Codex', () => {
    const root = home()
    const skill = join(root, '.claude/skills/webapp-testing')
    put(join(skill, 'SKILL.md'), '# Claude-only skill\n')
    put(join(skill, 'scripts/with_server.py'), helper)
    const result = verify(root, { HARNESSED_PLATFORM: 'codex' })
    expect(result.status, result.stdout).not.toBe(0)
    expect(result.stderr).toContain('webapp-testing SKILL.md is missing')
  })

  it.each([
    'codex',
    '',
  ])('accepts a complete custom CODEX_HOME legacy payload with platform=%s', (platform) => {
    const root = home()
    const codexHome = join(root, 'custom codex home')
    const skill = join(codexHome, 'skills/webapp-testing')
    put(join(skill, 'SKILL.md'), '# Custom Codex skill\n')
    put(join(skill, 'scripts/with_server.py'), helper)
    const before = snapshot(root)
    const result = verify(root, { HARNESSED_PLATFORM: platform, CODEX_HOME: codexHome })
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('Run command with one or more servers')
    expect(snapshot(root)).toEqual(before)
  })

  it('rejects resources split across different roots', () => {
    const root = home()
    put(join(root, '.agents/skills/webapp-testing/SKILL.md'), '# Skill\n')
    put(join(root, '.codex/skills/webapp-testing/scripts/with_server.py'), helper)
    expect(verify(root).status).not.toBe(0)
  })

  it.each(['SKILL.md', 'scripts/with_server.py'])('rejects a missing or empty %s', (resource) => {
    const root = home()
    const skill = join(root, '.agents/skills/webapp-testing')
    put(join(skill, 'SKILL.md'), '# Skill\n')
    put(join(skill, 'scripts/with_server.py'), helper)
    rmSync(join(skill, resource))
    expect(verify(root).status).not.toBe(0)
    put(join(skill, resource), '')
    expect(verify(root).status).not.toBe(0)
  })

  it('preserves a failing helper exit code instead of accepting installed SKILL.md', () => {
    const root = home()
    const skill = join(root, '.agents/skills/webapp-testing')
    put(join(skill, 'SKILL.md'), '# Skill\n')
    put(join(skill, 'scripts/with_server.py'), 'raise SystemExit(37)\n')
    expect(verify(root).status).toBe(37)
  })

  it('rejects a helper returning zero without the expected help output', () => {
    const root = home()
    const skill = join(root, '.agents/skills/webapp-testing')
    put(join(skill, 'SKILL.md'), '# Skill\n')
    put(join(skill, 'scripts/with_server.py'), 'print("not helper usage")\n')
    expect(verify(root).status).not.toBe(0)
  })
})
