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
      spec: { component_type: 'mcp-tool', install: { method } },
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
})
