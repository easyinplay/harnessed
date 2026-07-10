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
  writeFile: vi.fn(),
  rename: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
}))

vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: vi.fn(),
}))

import { cp, readdir, readFile, stat } from 'node:fs/promises'
import { Command } from 'commander'
import { printGrouped, registerSetup } from '../../src/cli/setup.js'
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
  // 4.23.0 T7 — the setup-end guard-conflict block prints via console.warn.
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
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
    expect(stdout).toContain('Step A: 1 workflow')
    // Step B
    expect(runInstallMock).toHaveBeenCalledTimes(2)
    expect(stdout).toContain('Upstream components: 2 installed')
    expect(stdout).toContain('setup complete — 1 workflows + 2 base manifests')
  })

  // Cell 3b (4.23.0 issue #3 / T2, TDD): ORDER INVERSION — Step B (packs) must
  // run BEFORE Step A (workflow cp). The packs copy upstream skills into the
  // same flat ~/.claude/skills namespace; installing the engine workflows LAST
  // makes harnessed the last writer for its own names (research/retro/ship were
  // the observed clobber set). Order-sensitive assertion, recorded reason: this
  // inverts the original A→B sequence on purpose.
  it('cell 3b — Step B (runInstall) completes BEFORE the first Step A workflow cp', async () => {
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

    const { code } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(runInstallMock).toHaveBeenCalledTimes(2)
    expect(cpMock).toHaveBeenCalled()
    const lastInstall = Math.max(...runInstallMock.mock.invocationCallOrder)
    const firstCp = Math.min(...cpMock.mock.invocationCallOrder)
    expect(lastInstall).toBeLessThan(firstCp)
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
    expect(stdout).toContain('Step A: 2 workflow')
  })

  // Cell 5 (v3.9.5): install-base chain — all install methods now dispatch through
  // runInstall (PHASE_21 deferred set removed). Sister cli-install-base.test cell 5.
  it('cell 5 — install-base chain: all install methods now dispatch through runInstall (v3.9.5)', async () => {
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

    const { code, stdout } = await runCli(['setup', '--no-auto-install'])
    expect(code).toBe(0)
    // v3.9.5 — both manifests dispatch (was 1 only when npx-skill-installer
    // short-circuited as deferred phase 2.1).
    expect(runInstallMock).toHaveBeenCalledTimes(2)
    expect(stdout).toContain('2 installed / 0 already-installed / 0 skipped')
    // v3.9.21 — grouped output by component_type. Names appear without [B] prefix.
    expect(stdout).toContain('installed')
    expect(stdout).toContain('npx-skill')
    expect(stdout).toContain('ctx7')
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
    expect(stdout).toContain('1 installed / 1 already-installed')
    expect(stdout).toContain('0 failed')
    // v3.9.21 — grouped output. already-installed status line includes the name.
    expect(stdout).toContain('already-installed')
    expect(stdout).toContain('tavily-mcp')
    // Post-setup /mcp hint shown
    expect(stdout).toContain('Run /mcp in Claude Code')
    // Not classified as failure (no "failed" status line for any name)
    expect(stdout).not.toMatch(/^\s*failed\s+/m)
  })

  // Cell 8 (v3.3.1 hotfix): Step C — Agent Teams auto-enable wired in setup
  it('cell 8 — Step C: Agent Teams auto-enable runs silently (v3.9.12 output suppressed)', async () => {
    readdirMock.mockImplementation(makeWorkflowsReaddir(['research']))
    statMock.mockImplementation(makeStatMock(['research']))
    cpMock.mockResolvedValue(undefined)
    // Path-conditional readFile mock: settings.json returns already-enabled JSON,
    // manifests return 'yaml-content' string. Step C/D run internally but output
    // is suppressed — verify setup still completes and Step A/B emit normally.
    readFileMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('settings.json')) {
        return JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }) as never
      }
      return 'yaml-content' as never
    })
    validateManifestFileMock.mockReturnValue(makeValidManifest('ctx7') as never)
    runInstallMock.mockResolvedValue({ ok: true } as never)

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    // Step A still ran before Step C
    expect(stdout).toContain('Step A:')
    // Step B still ran after Step C (sequence: A → C → B)
    expect(stdout).toContain('Upstream components:')
  })

  // Cell 9 (v4.13.0): printGrouped table rendering — glyph + aligned columns +
  // failed reason split into the note column (user UX feedback: 表格输出).
  it('cell 9 — printGrouped renders aligned table columns with glyphs + notes', () => {
    let stdout = ''
    let stderr = ''
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      stdout += `${a.map(String).join(' ')}\n`
    })
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
      stderr += `${a.map(String).join(' ')}\n`
    })
    printGrouped({
      installed: ['tavily-mcp'],
      alreadyInstalled: ['superpowers'],
      skipped: [{ name: 'ctx7', reason: 'level-flag-missing' }],
      failed: ['exa-mcp: verify: not found in mcpServers map'],
      elapsedMs: 0,
      componentTypes: {
        'tavily-mcp': 'mcp-tool',
        'exa-mcp': 'mcp-tool',
        superpowers: 'command',
        ctx7: 'cli-binary',
      },
    })
    // Group headers with counts
    expect(stdout).toContain('MCP servers (2)')
    expect(stdout).toContain('Commands & Skills (1)')
    expect(stdout).toContain('CLI tools (1)')
    // Glyph + status + name columns
    expect(stdout).toMatch(/✓ installed\s+tavily-mcp/)
    expect(stdout).toMatch(/○ already-installed\s+superpowers/)
    // Skip reason lands in the note column
    expect(stdout).toMatch(/↷ skipped\s+ctx7\s+level-flag-missing/)
    // Failed rows go to stderr with reason split out of the name
    expect(stderr).toMatch(/✗ failed\s+exa-mcp\s+verify: not found/)
  })

  // Cell 9b (v4.16.0 T4): long failed / kept-existing reasons get a full-text
  // block after the table (the 90/100-char note truncation ate the diagnostic
  // part of gstack / mattpocock refresh failures in user dogfood v4.15.2).
  it('cell 9b — printGrouped emits full-reason lines for truncated failed/kept-existing notes', () => {
    let stderr = ''
    let warnOut = ''
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
      stderr += `${a.map(String).join(' ')}\n`
    })
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
      warnOut += `${a.map(String).join(' ')}\n`
    })
    const longFail = `verify failed (exit 1): ${'x'.repeat(120)}TAIL-F`
    const longKept = `git-clone-with-setup cmd exited 1: ${'y'.repeat(120)}TAIL-K`
    printGrouped({
      installed: [],
      alreadyInstalled: [],
      skipped: [],
      failed: [`exa-mcp: ${longFail}`],
      keptExisting: [{ name: 'gstack', reason: longKept }],
      elapsedMs: 0,
      componentTypes: { 'exa-mcp': 'mcp-tool', gstack: 'command' },
    })
    // Table note stays truncated…
    expect(stderr).toContain('…')
    // …but the full reason (incl. the tail beyond the truncation point) follows.
    expect(stderr).toContain('TAIL-F')
    expect(stderr).toMatch(/↳ exa-mcp:/)
    expect(warnOut).toContain('TAIL-K')
    expect(warnOut).toMatch(/↳ gstack:/)
  })

  // Cell 9c (v4.16.1 T2): dead-zone fix — a kept-existing reason of 90-100 chars
  // rendered a truncated note (the 90-char slice inside the decorated string) but
  // the ↳ block was suppressed by the old `full.length <= NOTE_MAX` gate
  // (gstack dogfood v4.16.0: reason ~95 chars → note ends with … yet no detail).
  it('cell 9c — printGrouped emits the ↳ block when the note truncates a 90-100 char reason', () => {
    let warnOut = ''
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
      warnOut += `${a.map(String).join(' ')}\n`
    })
    // 95 chars: inside the 90 (note slice) .. 100 (old gate) dead zone.
    const reason = `git-clone-with-setup cmd exited 1: ${'z'.repeat(54)}DEADZONE`
    expect(reason.length).toBeGreaterThan(90)
    expect(reason.length).toBeLessThanOrEqual(100)
    printGrouped({
      installed: [],
      alreadyInstalled: [],
      skipped: [],
      failed: [],
      keptExisting: [{ name: 'gstack', reason }],
      elapsedMs: 0,
      componentTypes: { gstack: 'command' },
    })
    expect(warnOut).toMatch(/↳ gstack:/)
    expect(warnOut).toContain('DEADZONE')
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
      'Upstream components: 3 installed / 0 already-installed / 0 skipped / 0 failed',
    )
    // Parallel timing tag present in summary line
    expect(stdout).toContain('[0.0s]')
    expect(stdout).toContain('setup complete — 1 workflows + 3 base manifests')
  })
})

// 4.23.0 T7 — explicit GateGuard conflict surface at setup end (TDD three-state).
// Dogfood: after a full reinstall the 4.22.x guard-conflict work was invisible
// (auto-install only lists warn checks WITH install_commands). Setup now prints
// the doctor check verbatim: warn → message + fix (variant-aware per T8);
// pass/inactive → silent. Fail-soft: a throwing check never breaks setup.
describe('cli/setup — 4.23.0 T7 (GateGuard conflict surface at setup end)', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    statMock.mockReset()
    cpMock.mockReset()
    readFileMock.mockReset()
    runInstallMock.mockReset()
    validateManifestFileMock.mockReset()
    readdirMock.mockImplementation(makeWorkflowsReaddir(['research']))
    statMock.mockImplementation(makeStatMock(['research']))
    cpMock.mockResolvedValue(undefined)
    readFileMock.mockResolvedValue('yaml-content' as never)
    runInstallMock.mockResolvedValue({ ok: true } as never)
  })
  afterEach(() => {
    delete process.env.ECC_GATEGUARD
    vi.restoreAllMocks()
  })

  it('T7a — active + env-capable ecc → warn block with the auto-fix advice', async () => {
    process.env.ECC_GATEGUARD = 'on'
    // registry names an ecc install whose hook understands GATEGUARD_EXEMPT_GLOBS
    readFileMock.mockImplementation(async (p: unknown) => {
      const path = String(p).replace(/\\/g, '/')
      if (path.includes('installed_plugins.json')) {
        return JSON.stringify({
          version: 2,
          plugins: { 'ecc@ecc': [{ installPath: '/plug/ecc/2.1.0' }] },
        }) as never
      }
      if (path.includes('gateguard-fact-force.js')) {
        return 'const g = process.env.GATEGUARD_EXEMPT_GLOBS' as never
      }
      return 'yaml-content' as never
    })
    const { code, stderr } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(stderr).toContain('guard conflict (GateGuard)')
    expect(stderr).toContain('fix:')
    expect(stderr).toContain('harnessed exempt-gateguard')
  })

  it('T7b — active + legacy ecc (probe miss) → warn advises the ecc upgrade', async () => {
    process.env.ECC_GATEGUARD = 'on'
    // default 'yaml-content' reads → registry unparseable → capability legacy
    const { code, stderr } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(stderr).toContain('guard conflict (GateGuard)')
    expect(stderr).toContain('claude plugin update ecc')
  })

  it('T7c — GateGuard inactive → setup end stays silent about guard conflict', async () => {
    const { code, stderr } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(stderr).not.toContain('guard conflict (GateGuard)')
  })
})
