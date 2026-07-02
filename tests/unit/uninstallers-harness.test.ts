// v4.14.0 T5 — uninstall 侧 cross-harness 对齐:
//   - mcp remove: bin 按 detectPlatform().id 选择 (claude | codex)
//   - cc-plugin uninstall: 非 claude 平台 → ok:false preflight (claude-only)
//   - npx-skill uninstall: skillDir 走 getSkillsDir()(codex → ~/.agents/skills)

import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
const rmMock = vi.fn(async (_p: string, _o?: unknown) => undefined)
vi.mock('node:fs/promises', () => ({
  rm: (p: string, o?: unknown) => rmMock(p, o),
  readFile: vi.fn(async () => {
    const e = new Error('ENOENT') as NodeJS.ErrnoException
    e.code = 'ENOENT'
    throw e
  }),
  writeFile: vi.fn(async () => undefined),
}))

import { spawn } from 'node:child_process'
import type { Manifest } from '../../src/manifest/schema/types.js'
import { uninstallCcPluginMarketplace } from '../../src/uninstallers/ccPluginMarketplace.js'
import type { UninstallContext } from '../../src/uninstallers/lib/types.js'
import { uninstallMcpStdioAdd } from '../../src/uninstallers/mcpStdioAdd.js'
import { uninstallNpxSkillInstaller } from '../../src/uninstallers/npxSkillInstaller.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(exitCode: number): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => child.emit('close', exitCode))
  return child
}

function mcpManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'tavily-mcp',
      display_name: 'x',
      description: 'x',
      upstream: {
        source: 'tavily-mcp',
        homepage: 'https://e.com',
        repository: 'https://github.com/e/x.git',
        license: 'MIT',
        notice: 'x',
      },
    },
    spec: {
      type: 'mcp-npm',
      component_type: 'mcp-tool',
      install: {
        method: 'mcp-stdio-add',
        cmd: 'claude mcp add tavily-mcp -- npx --yes tavily-mcp@1',
        npm_version: '^1.0.0',
        idempotent_check: 'x',
      },
      verify: { cmd: 'x', timeout_ms: 5000 },
      uninstall: { cmd: 'claude mcp remove tavily-mcp' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1',
        fallback_action: 'warn',
      },
      signed_by: 'x',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function uctx(manifest: Manifest): UninstallContext {
  return { manifest, opts: { apply: true, dryRun: false, yes: true }, cwd: '/tmp/proj' }
}

describe('uninstallers — cross-harness (v4.14.0)', () => {
  beforeEach(() => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    spawnMock.mockReset()
    rmMock.mockReset()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("mcp remove on codex spawns 'codex mcp remove <name>'", async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    spawnMock.mockImplementation(() => makeChild(0) as unknown as ReturnType<typeof spawn>)
    const r = await uninstallMcpStdioAdd(uctx(mcpManifest()))
    expect(r).toMatchObject({ ok: true })
    const flat = spawnMock.mock.calls
      .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
      .join('\n')
    expect(flat).toContain('codex')
    expect(flat).not.toContain('claude')
    expect(flat).toContain('mcp remove tavily-mcp')
  })

  it("mcp remove on claude spawns 'claude mcp remove <name>' (regression)", async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    spawnMock.mockImplementation(() => makeChild(0) as unknown as ReturnType<typeof spawn>)
    const r = await uninstallMcpStdioAdd(uctx(mcpManifest()))
    expect(r).toMatchObject({ ok: true })
    const flat = spawnMock.mock.calls
      .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
      .join('\n')
    expect(flat).toContain('claude')
    expect(flat).not.toContain('codex')
  })

  it('cc-plugin uninstall on codex → ok:false preflight (claude-only method)', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const m = mcpManifest()
    ;(m.spec.install as { method: string }).method = 'cc-plugin-marketplace'
    ;(m.spec.install as { cmd: string }).cmd =
      'claude plugin marketplace add a/b && claude plugin install x@y'
    const r = await uninstallCcPluginMarketplace(uctx(m))
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
    if ('error' in r && typeof r.error === 'string') {
      expect(r.error).toContain('claude-only')
    }
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('npx-skill uninstall removes from the platform skills dir (codex → ~/.agents/skills)', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const m = mcpManifest()
    ;(m.spec.install as { method: string }).method = 'npx-skill-installer'
    ;(m.spec.install as { cmd: string }).cmd =
      'npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy'
    const r = await uninstallNpxSkillInstaller(uctx(m))
    expect(r).toMatchObject({ ok: true })
    const removed = rmMock.mock.calls.map((c) => String(c[0]).replace(/\\/g, '/'))
    expect(removed.some((p) => p.includes('.agents/skills/design-taste-frontend'))).toBe(true)
    expect(removed.some((p) => p.includes('.claude'))).toBe(false)
  })
})
