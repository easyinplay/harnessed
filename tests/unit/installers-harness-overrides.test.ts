// v4.14.0 T3 REVISED — spec.harness_overrides.codex: schema 接受 + runInstall
// dispatch 前按平台合并 + 无 override 的 claude-only method 兜底 harness-mismatch。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveForHarness } from '../../src/installers/index.js'
import type { Manifest } from '../../src/installers/lib/types.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

function pwfManifest(withOverride: boolean): Manifest {
  const m = {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'planning-with-files',
      display_name: 'x',
      description: 'x',
      upstream: {
        source: 'planning-with-files',
        homepage: 'https://e.com',
        repository: 'https://github.com/e/x.git',
        license: 'MIT',
        notice: 'x',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'command',
      category: 'engineering',
      install_type: 'skill',
      install: {
        method: 'cc-plugin-marketplace',
        cmd: '/plugin marketplace add OthmanAdi/planning-with-files && /plugin install planning-with-files@planning-with-files',
        git_ref: 'v2.37.0',
        idempotent_check: '/plugin list | grep -q planning-with-files',
      },
      verify: { cmd: '/plugin list | grep -q planning-with-files', timeout_ms: 5000 },
      uninstall: { cmd: '/plugin uninstall planning-with-files@planning-with-files' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-11',
        last_known_good_version: '2.37.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
  if (withOverride) {
    ;(m.spec as { harness_overrides?: unknown }).harness_overrides = {
      codex: {
        install: {
          method: 'npx-skill-installer',
          cmd: 'npx --yes skills@latest add OthmanAdi/planning-with-files --copy -y',
          npm_version: '^1.5.7',
          idempotent_check: 'test -d ~/.agents/skills/planning-with-files',
        },
        verify: { cmd: 'test -f ~/.agents/skills/planning-with-files/SKILL.md', timeout_ms: 5000 },
      },
    }
  }
  return m
}

describe('resolveForHarness (v4.14.0)', () => {
  beforeEach(() => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('claude → manifest verbatim, no gate', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const m = pwfManifest(true)
    const r = resolveForHarness(m)
    expect(r.gate).toBeNull()
    expect(r.manifest).toBe(m)
    expect(r.manifest.spec.install.method).toBe('cc-plugin-marketplace')
  })

  it('codex + override → install AND verify replaced wholesale', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = resolveForHarness(pwfManifest(true))
    expect(r.gate).toBeNull()
    expect(r.manifest.spec.install.method).toBe('npx-skill-installer')
    expect(r.manifest.spec.install.cmd).toContain('skills@latest add OthmanAdi')
    expect(r.manifest.spec.verify.cmd).toContain('~/.agents/skills/planning-with-files')
  })

  it("codex + NO override + claude-only method → gate aborted 'harness-mismatch'", () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = resolveForHarness(pwfManifest(false))
    expect(r.gate).toMatchObject({ aborted: true, reason: 'harness-mismatch' })
  })

  it('codex + NO override + platform-neutral method → passthrough (no gate)', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const m = pwfManifest(false)
    ;(m.spec as { type: string }).type = 'cli-npm'
    ;(m.spec.install as unknown as { method: string; cmd: string; npm_version: string }).method =
      'npm-cli'
    const r = resolveForHarness(m)
    expect(r.gate).toBeNull()
    expect(r.manifest).toBe(m)
  })
})

describe('harness_overrides schema (v4.14.0)', () => {
  const BASE_YAML = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: superpowers
  display_name: superpowers
  description: fixture
  upstream:
    source: superpowers
    homepage: https://github.com/obra/superpowers
    repository: https://github.com/obra/superpowers.git
    license: MIT
    notice: fixture
spec:
  type: cc-plugin
  component_type: command
  category: engineering
  install_type: skill
  install:
    method: cc-plugin-marketplace
    cmd: "/plugin marketplace add obra/superpowers-marketplace && /plugin install superpowers@superpowers-marketplace"
    git_ref: v6.0.3
    idempotent_check: "/plugin list | grep -q superpowers"
  verify:
    cmd: "/plugin list | grep -q superpowers"
    timeout_ms: 5000
  uninstall:
    cmd: "/plugin uninstall superpowers@superpowers-marketplace"
  HARNESS_BLOCK
  upstream_health:
    stability: stable
    last_check: "2026-06-30"
    last_known_good_version: 6.0.3
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

  it('accepts a valid codex override block', () => {
    const yaml = BASE_YAML.replace(
      '  HARNESS_BLOCK',
      [
        '  harness_overrides:',
        '    codex:',
        '      install:',
        '        method: cc-plugin-marketplace',
        '        cmd: "codex plugin add superpowers@openai-curated"',
        '        git_ref: v6.0.3',
        '        idempotent_check: "codex plugin list | grep -q superpowers"',
        '      verify:',
        '        cmd: "codex plugin list | grep -q superpowers"',
        '        timeout_ms: 15000',
      ].join('\n'),
    )
    const v = validateManifestFile(yaml, 'superpowers.yaml')
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.manifest.spec.harness_overrides?.codex?.install.method).toBe('cc-plugin-marketplace')
    }
  })

  it('rejects unknown keys inside harness_overrides', () => {
    const yaml = BASE_YAML.replace(
      '  HARNESS_BLOCK',
      ['  harness_overrides:', '    cursor:', '      install:', '        method: npm-cli'].join(
        '\n',
      ),
    )
    const v = validateManifestFile(yaml, 'superpowers.yaml')
    expect(v.ok).toBe(false)
  })

  it('manifest without harness_overrides still validates (A7 additive 守恒)', () => {
    const yaml = BASE_YAML.replace('  HARNESS_BLOCK\n', '')
    const v = validateManifestFile(yaml, 'superpowers.yaml')
    expect(v.ok).toBe(true)
  })
})

// v4.14.0 — 全量真实 manifest schema 校验 sweep(harness_overrides 落地的 5 个
// manifest + 其余全部;此前只有点名校验,schema 演进缺全量回归网)。
describe('all real manifests validate (v4.14.0 sweep)', () => {
  it('every manifests/{tools,skill-packs}/*.yaml passes validateManifestFile', async () => {
    const { readFile, readdir } = await import('node:fs/promises')
    const { resolve } = await import('node:path')
    const dirs = ['manifests/tools', 'manifests/skill-packs']
    let count = 0
    for (const d of dirs) {
      const entries = await readdir(resolve(process.cwd(), d))
      for (const f of entries.filter((e) => e.endsWith('.yaml'))) {
        const p = resolve(process.cwd(), d, f)
        const v = validateManifestFile(await readFile(p, 'utf8'), p)
        expect(v.ok, `${d}/${f}: ${v.ok ? '' : JSON.stringify(v.errors[0])}`).toBe(true)
        count += 1
      }
    }
    expect(count).toBeGreaterThanOrEqual(13)
  })
})
