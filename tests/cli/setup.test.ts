// v1.0.3 T1.2 — cell 6: parallel install smoke (Promise.allSettled concurrent; all 3 manifests fire).
// v1.0.2 T1.5 — TDD: setup CLI subcommand tests (UX redesign; one-shot onboarding).
// Phase v3.0-3.3 T3.3.W0.12 — extend to NestedWorkflow[] + v2 deprecation block.
// Covers: smoke, --dry-run preview, default immediate install (Step A + Step B chain),
//         flat workflows (research/retro v3 keep), install-base chain integration smoke.
// vi.mock fs/promises + installers + validate to avoid real filesystem / network calls.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  cp: vi.fn(),
}))

vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
}))

vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: vi.fn(),
}))

import { cp, readdir, readFile, stat } from 'node:fs/promises'
import { Command } from 'commander'
import { registerSetup } from '../../src/cli/setup.js'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const readdirMock = vi.mocked(readdir)
const statMock = vi.mocked(stat)
const cpMock = vi.mocked(cp)
const readFileMock = vi.mocked(readFile)
const runInstallMock = vi.mocked(runInstall)
const validateManifestFileMock = vi.mocked(validateManifestFile)

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerSetup(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}

/** Stat mock that treats any path as dir, and SKILL.md as a file at top-level workflows. */
function makeStatMock(withSkillMd: string[], _legacy?: string[]) {
  return async (p: unknown) => {
    const path = String(p)
    if (path.includes('SKILL.md')) {
      // Only top-level workflows/<name>/SKILL.md considered present (flat path A)
      const workflow = withSkillMd.find(
        (w) => path.includes(`${w}/SKILL.md`) || path.includes(`${w}\\SKILL.md`),
      )
      if (workflow) return { isDirectory: () => false } as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    }
    return { isDirectory: () => true } as never
  }
}

/** readdir mock that only returns entries for the top-level workflows dir (not nested children). */
function makeWorkflowsReaddir(topEntries: string[], extras: Record<string, string[]> = {}) {
  return async (p: unknown) => {
    const ps = String(p).replace(/\\/g, '/')
    // Top-level workflows dir — strip trailing slash, compare basename
    const trimmed = ps.replace(/\/+$/, '')
    if (trimmed.endsWith('/workflows')) return topEntries as never
    for (const [key, val] of Object.entries(extras)) {
      if (trimmed.includes(key)) return val as never
    }
    return [] as never
  }
}

/** Mock a successful manifest result for install-base chain */
function makeValidManifest(name: string) {
  return {
    ok: true,
    errors: [],
    manifest: {
      metadata: { name },
      spec: { install: { method: 'copy-file' } },
    },
  }
}

describe('cli/setup — v1.0.2 T1.5 (one-shot onboarding: Step A workflows + Step B install-base)', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    statMock.mockReset()
    cpMock.mockReset()
    readFileMock.mockReset()
    runInstallMock.mockReset()
    validateManifestFileMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  // Cell 1: smoke — command registered; no workflows → exit 2
  it('cell 1 — smoke: setup command registered; no SKILL.md workflows → exit 2', async () => {
    readdirMock.mockImplementation(async (p: unknown) => {
      if (String(p).includes('workflows')) return [] as never
      return [] as never
    })
    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(2)
    expect(stdout).toContain('nothing to install')
  })

  // Cell 2: --dry-run → preview output, cp NOT called, exits 0
  it('cell 2 — --dry-run: preview output, cp NOT called, exit 0', async () => {
    readdirMock.mockImplementation(makeWorkflowsReaddir(['research', 'retro']))
    statMock.mockImplementation(makeStatMock(['research', 'retro']))
    const { code, stdout } = await runCli(['setup', '--dry-run'])
    expect(code).toBe(0)
    expect(stdout).toContain('[dry-run]')
    expect(stdout).toContain('research')
    expect(stdout).toContain('without --dry-run')
    expect(cpMock).not.toHaveBeenCalled()
    expect(runInstallMock).not.toHaveBeenCalled()
  })

  // Cell 3: default (no flags) → immediate install; Step A cp called + Step B chain invoked
  it('cell 3 — default mode (no flags): Step A cp + Step B install-base chain, exit 0', async () => {
    readdirMock.mockImplementation(
      makeWorkflowsReaddir(['research'], { 'skill-packs': ['gsd.yaml'], tools: ['ctx7.yaml'] }),
    )
    statMock.mockImplementation(makeStatMock(['research']))
    cpMock.mockResolvedValue(undefined)
    readFileMock.mockResolvedValue('yaml-content' as never)
    validateManifestFileMock
      .mockReturnValueOnce(makeValidManifest('ctx7') as never)
      .mockReturnValueOnce(makeValidManifest('gsd') as never)
    runInstallMock.mockResolvedValue({ ok: true } as never)

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    // Step A
    expect(cpMock).toHaveBeenCalledOnce()
    expect(stdout).toContain('Step A complete: 1 workflow skill(s)')
    // Step B
    expect(runInstallMock).toHaveBeenCalledTimes(2)
    expect(stdout).toContain('Step B complete: 2 manifest(s) installed')
    expect(stdout).toContain('setup complete: 1 workflow skill(s) + 2 base manifest(s)')
  })

  // Cell 4 (v3.0-3.3 T3.3.W0.12): both flat keep dirs (research + retro) installed
  it('cell 4 — flat keep dirs (research + retro) both installed', async () => {
    readdirMock.mockImplementation(makeWorkflowsReaddir(['research', 'retro']))
    statMock.mockImplementation(makeStatMock(['research', 'retro']))
    cpMock.mockResolvedValue(undefined)
    readFileMock.mockResolvedValue('yaml-content' as never)
    validateManifestFileMock.mockReturnValue({
      ok: true,
      errors: [],
      manifest: { metadata: { name: 'x' }, spec: { install: { method: 'copy-file' } } },
    } as never)
    runInstallMock.mockResolvedValue({ ok: true } as never)

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(cpMock).toHaveBeenCalledTimes(2)
    expect(stdout).toContain('research')
    expect(stdout).toContain('retro')
    expect(stdout).toContain('Step A complete: 2 workflow skill(s)')
  })

  // Cell 5: install-base chain smoke — skipped deferred methods not counted as failures
  it('cell 5 — install-base chain: deferred phase-2.1 methods skipped (not failed)', async () => {
    readdirMock.mockImplementation(
      makeWorkflowsReaddir(['research'], { tools: ['npx-skill.yaml', 'ctx7.yaml'] }),
    )
    statMock.mockImplementation(makeStatMock(['research']))
    cpMock.mockResolvedValue(undefined)
    readFileMock.mockResolvedValue('yaml-content' as never)
    validateManifestFileMock
      .mockReturnValueOnce({
        ok: true,
        errors: [],
        manifest: {
          metadata: { name: 'npx-skill' },
          spec: { install: { method: 'npx-skill-installer' } },
        },
      } as never)
      .mockReturnValueOnce(makeValidManifest('ctx7') as never)
    runInstallMock.mockResolvedValue({ ok: true } as never)

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    // npx-skill-installer is deferred → skipped, ctx7 installed
    expect(runInstallMock).toHaveBeenCalledTimes(1)
    expect(stdout).toContain('1 manifest(s) installed / 0 already-installed / 1 skipped')
    expect(stdout).toContain('[B] skipped            npx-skill')
    expect(stdout).toContain('[B] installed          ctx7')
  })

  // Cell 7 (v1.0.4 T1.5): already-installed MCP servers → classified separately, NOT failed
  // Simulates runInstall returning { ok: true, alreadyInstalled: true } for an MCP server
  // that was already registered in .mcp.json (ADR 0004 idempotent contract).
  it('cell 7 — already-installed: MCP server already in .mcp.json → not failed, hint shown', async () => {
    readdirMock.mockImplementation(
      makeWorkflowsReaddir(['research'], { tools: ['tavily-mcp.yaml', 'ctx7.yaml'] }),
    )
    statMock.mockImplementation(makeStatMock(['research']))
    cpMock.mockResolvedValue(undefined)
    readFileMock.mockResolvedValue('yaml-content' as never)
    validateManifestFileMock
      .mockReturnValueOnce(makeValidManifest('tavily-mcp') as never)
      .mockReturnValueOnce(makeValidManifest('ctx7') as never)
    // tavily-mcp already installed → idempotent ok; ctx7 freshly installed
    runInstallMock
      .mockResolvedValueOnce({ ok: true, alreadyInstalled: true, backupId: 'bk1' } as never)
      .mockResolvedValueOnce({ ok: true, backupId: 'bk2', appliedFiles: [] } as never)

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    // Step B summary shows 1 installed + 1 already-installed, 0 failed
    expect(stdout).toContain('1 manifest(s) installed / 1 already-installed')
    expect(stdout).toContain('0 failed')
    // already-installed line uses correct label (not "failed")
    expect(stdout).toContain('[B] already-installed  tavily-mcp')
    // Post-setup /mcp hint shown
    expect(stdout).toContain('Run `/mcp` in Claude Code')
    // Not classified as failure
    expect(stdout).not.toContain('[B] failed')
  })

  // Cell 6: parallel install smoke — 3 manifests all fire concurrently via Promise.allSettled
  it('cell 6 — parallel smoke: 3 manifests all installed concurrently, [parallel Xs] in summary', async () => {
    readdirMock.mockImplementation(
      makeWorkflowsReaddir(['research'], { tools: ['a.yaml', 'b.yaml', 'c.yaml'] }),
    )
    statMock.mockImplementation(makeStatMock(['research']))
    cpMock.mockResolvedValue(undefined)
    readFileMock.mockResolvedValue('yaml-content' as never)
    validateManifestFileMock
      .mockReturnValueOnce(makeValidManifest('tool-a') as never)
      .mockReturnValueOnce(makeValidManifest('tool-b') as never)
      .mockReturnValueOnce(makeValidManifest('tool-c') as never)
    runInstallMock.mockResolvedValue({ ok: true } as never)

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    // All 3 manifests installed via parallel Promise.allSettled
    expect(runInstallMock).toHaveBeenCalledTimes(3)
    expect(stdout).toContain(
      'Step B complete: 3 manifest(s) installed / 0 already-installed / 0 skipped / 0 failed',
    )
    // Parallel timing tag present in summary line
    expect(stdout).toContain('[parallel ')
    expect(stdout).toContain('setup complete: 1 workflow skill(s) + 3 base manifest(s)')
  })
})
