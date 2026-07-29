// v4.13.0 — unit tests for runStepBInstall MCP serialization + onProgress
// (patch 4.13.0 setup UX; findings.md 根因 1 + 5).
//
// Covers:
//   - MCP manifests (mcp-stdio-add / mcp-http-add) run SEQUENTIALLY (max
//     concurrency 1 within the MCP group) — three parallel `claude mcp add
//     --scope user` spawns each rewrite ~/.claude.json → lost update → only the
//     last writer survives (user dogfood: tavily survived, chrome-devtools +
//     exa clobbered → verify-failed).
//   - non-MCP manifests still run in parallel (concurrency > 1 observed).
//   - onProgress fires once per manifest with monotonically increasing done.
//
// Mocks: installers/index runInstall, manifest/validate, node:fs/promises readFile.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async () => 'yaml-content'),
}))
vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
}))
vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: vi.fn(),
}))

import { runStepBInstall } from '../../src/cli/lib/setup-helpers.js'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const runInstallMock = vi.mocked(runInstall)
const validateMock = vi.mocked(validateManifestFile)

function manifestFor(name: string, method: string) {
  return {
    ok: true,
    errors: [],
    manifest: {
      metadata: { name },
      spec: { component_type: 'mcp-tool', install: { method, cmd: `install-${name}` } },
    },
  }
}

/** validate mock keyed by path basename (path itself carries name+method). */
function wireValidate(entries: Record<string, { name: string; method: string }>): void {
  validateMock.mockImplementation(((_src: string, path: string) => {
    const base = path.replace(/\\/g, '/').split('/').pop() ?? path
    const e = entries[base]
    if (!e) throw new Error(`unexpected manifest path ${path}`)
    return manifestFor(e.name, e.method)
  }) as never)
}

/** runInstall mock that tracks concurrent in-flight calls per method group. */
function wireConcurrencyTracker(delayMs = 10) {
  const active = { mcp: 0, other: 0 }
  const maxSeen = { mcp: 0, other: 0 }
  runInstallMock.mockImplementation((async (manifest: {
    spec: { install: { method: string } }
  }) => {
    const isMcp = /^mcp-/.test(manifest.spec.install.method)
    const key = isMcp ? 'mcp' : 'other'
    active[key] += 1
    maxSeen[key] = Math.max(maxSeen[key], active[key])
    await new Promise((r) => setTimeout(r, delayMs))
    active[key] -= 1
    return { ok: true }
  }) as never)
  return maxSeen
}

describe('runStepBInstall — v4.13.0 MCP serialization + onProgress', () => {
  beforeEach(() => {
    runInstallMock.mockReset()
    validateMock.mockReset()
  })

  it('serializes MCP installs (max concurrency 1) while others stay parallel', async () => {
    wireValidate({
      'a.yaml': { name: 'tavily-mcp', method: 'mcp-stdio-add' },
      'b.yaml': { name: 'exa-mcp', method: 'mcp-stdio-add' },
      'c.yaml': { name: 'chrome-devtools-mcp', method: 'mcp-stdio-add' },
      'd.yaml': { name: 'gsd', method: 'cc-plugin-marketplace' },
      'e.yaml': { name: 'superpowers', method: 'cc-plugin-marketplace' },
    })
    const maxSeen = wireConcurrencyTracker()
    const b = await runStepBInstall(['a.yaml', 'b.yaml', 'c.yaml', 'd.yaml', 'e.yaml'], {
      quiet: true,
    })
    expect(b.installed).toHaveLength(5)
    expect(maxSeen.mcp).toBe(1) // MCP group strictly sequential
    expect(maxSeen.other).toBeGreaterThan(1) // non-MCP still parallel
  })

  it('fires onProgress once per manifest with increasing done and correct total', async () => {
    wireValidate({
      'a.yaml': { name: 'tavily-mcp', method: 'mcp-stdio-add' },
      'd.yaml': { name: 'gsd', method: 'cc-plugin-marketplace' },
    })
    wireConcurrencyTracker(1)
    const events: Array<{ done: number; total: number; name: string; status: string }> = []
    const b = await runStepBInstall(['a.yaml', 'd.yaml'], {
      quiet: true,
      onProgress: (ev) => events.push(ev),
    })
    expect(b.installed).toHaveLength(2)
    expect(events).toHaveLength(2)
    expect(events.map((e) => e.done).sort()).toEqual([1, 2])
    expect(events.every((e) => e.total === 2)).toBe(true)
    expect(events.every((e) => e.status === 'installed')).toBe(true)
  })

  // v4.14.0 T3 — aborted 'harness-mismatch' surfaces as a self-explanatory
  // skipped reason (bare 'harness-mismatch' told the user nothing).
  it("maps aborted 'harness-mismatch' to a descriptive skipped reason", async () => {
    wireValidate({
      'k.yaml': { name: 'karpathy-skills', method: 'cc-plugin-marketplace' },
    })
    runInstallMock.mockResolvedValue({ aborted: true, reason: 'harness-mismatch' } as never)
    const b = await runStepBInstall(['k.yaml'], { quiet: true })
    expect(b.skipped).toHaveLength(1)
    expect(b.skipped[0]?.name).toBe('karpathy-skills')
    expect(b.skipped[0]?.reason).toContain('claude-only install method')
  })

  it('classifies statuses and reports failed validation without running install', async () => {
    validateMock.mockImplementation(((_src: string, path: string) => {
      if (path.includes('bad')) {
        return { ok: false, errors: [{ message: 'schema boom' }] }
      }
      return manifestFor('good-tool', 'npm-cli')
    }) as never)
    runInstallMock.mockResolvedValue({ aborted: true, reason: 'level-flag-missing' } as never)
    const b = await runStepBInstall(['bad.yaml', 'good.yaml'], { quiet: true })
    expect(b.failed).toHaveLength(1)
    expect(b.failed[0]).toContain('validate: schema boom')
    expect(b.skipped).toEqual([{ name: 'good-tool', reason: 'level-flag-missing' }])
    expect(runInstallMock).toHaveBeenCalledTimes(1)
  })

  // v4.16.2 T3 — force-update bypasses the idempotent probe, so an already-
  // installed L4 tool (ctx7) hits the --system gate every force pass and used
  // to print the misleading bare 'level-flag-missing'. The FORCE pass gets an
  // explanatory display reason; the normal pass keeps the literal string —
  // l4-rescue filters on `reason === 'level-flag-missing'` (first pass only).
  it('v4.16.2 T3 — L4 flag-missing skip under force-update → explanatory reason with manual hint', async () => {
    wireValidate({ 'ctx7.yaml': { name: 'ctx7', method: 'npm-cli' } })
    runInstallMock.mockResolvedValue({ aborted: true, reason: 'level-flag-missing' } as never)
    const b = await runStepBInstall(['ctx7.yaml'], { quiet: true, updateInstalled: true })
    expect(b.skipped).toHaveLength(1)
    expect(b.skipped[0]?.reason).toContain('excluded from force-update')
    expect(b.skipped[0]?.reason).not.toBe('level-flag-missing')
  })

  it('v4.16.2 T3 — L4 flag-missing skip on the NORMAL pass keeps the literal reason (l4-rescue contract)', async () => {
    wireValidate({ 'ctx7.yaml': { name: 'ctx7', method: 'npm-cli' } })
    runInstallMock.mockResolvedValue({ aborted: true, reason: 'level-flag-missing' } as never)
    const b = await runStepBInstall(['ctx7.yaml'], { quiet: true })
    expect(b.skipped).toEqual([{ name: 'ctx7', reason: 'level-flag-missing' }])
  })

  // 4.32.22 — setup grouping buckets by install.method, NOT component_type.
  // Trigger case (historical: 4.32.21-era chrome-devtools): a manifest with
  // component_type=mcp-tool but install method cc-plugin-marketplace belongs
  // under "Commands & Skills" (plugin channel; force-updatable), not
  // "MCP servers" (mcpServers-config channel; force-update-excluded).
  it('4.32.22 — componentTypes buckets derive from install.method (cc-plugin mcp-tool → command)', async () => {
    // NOTE manifestFor() hardcodes component_type: 'mcp-tool' for ALL entries —
    // exactly the trap: buckets must follow the method anyway.
    wireValidate({
      'a.yaml': { name: 'tavily-mcp', method: 'mcp-stdio-add' },
      'b.yaml': { name: 'some-http-mcp', method: 'mcp-http-add' },
      'c.yaml': { name: 'plugin-shaped-mcp', method: 'cc-plugin-marketplace' },
      'd.yaml': { name: 'gstack', method: 'git-clone-with-setup' },
      'e.yaml': { name: 'planning-with-files', method: 'npx-skill-installer' },
      'f.yaml': { name: 'ctx7', method: 'npm-cli' },
      'g.yaml': { name: 'weird', method: 'copy-file' },
    })
    runInstallMock.mockResolvedValue({ ok: true } as never)
    const b = await runStepBInstall(
      ['a.yaml', 'b.yaml', 'c.yaml', 'd.yaml', 'e.yaml', 'f.yaml', 'g.yaml'],
      { quiet: true },
    )
    expect(b.componentTypes).toEqual({
      'tavily-mcp': 'mcp-tool',
      'some-http-mcp': 'mcp-tool',
      'plugin-shaped-mcp': 'command',
      gstack: 'command',
      'planning-with-files': 'command',
      ctx7: 'cli-binary',
      weird: 'other',
    })
  })

  // 4.32.22 — codex harness override flips the effective method: a synthetic
  // cc-plugin manifest whose harness_overrides.codex declares mcp-stdio-add
  // buckets as 'mcp-tool' on codex even though the base method is
  // cc-plugin-marketplace (the bucket follows the EFFECTIVE install channel).
  it('4.32.22 — bucket follows the harness-override effective method on codex', async () => {
    const origPlatform = process.env.HARNESSED_PLATFORM
    const origRootOverride = process.env.HARNESSED_ROOT_OVERRIDE
    delete process.env.HARNESSED_ROOT_OVERRIDE // takes precedence over HARNESSED_PLATFORM
    process.env.HARNESSED_PLATFORM = 'codex'
    try {
      validateMock.mockImplementation((() => ({
        ok: true,
        errors: [],
        manifest: {
          metadata: { name: 'plugin-with-codex-mcp' },
          spec: {
            component_type: 'mcp-tool',
            install: { method: 'cc-plugin-marketplace', cmd: 'claude plugin install x' },
            harness_overrides: {
              codex: { install: { method: 'mcp-stdio-add', cmd: 'claude mcp add ...' } },
            },
          },
        },
      })) as never)
      runInstallMock.mockResolvedValue({ ok: true } as never)
      const b = await runStepBInstall(['c.yaml'], { quiet: true })
      expect(b.componentTypes).toEqual({ 'plugin-with-codex-mcp': 'mcp-tool' })
    } finally {
      if (origPlatform === undefined) delete process.env.HARNESSED_PLATFORM
      else process.env.HARNESSED_PLATFORM = origPlatform
      if (origRootOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
      else process.env.HARNESSED_ROOT_OVERRIDE = origRootOverride
    }
  })
})
