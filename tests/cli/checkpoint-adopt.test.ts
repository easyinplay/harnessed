// v16.0 Phase 67 T6 — `harnessed checkpoint adopt [--from claude|codex]` CLI wiring
// and message rendering.
//
// TDD: written RED (the action did not exist), driven to GREEN.
//
// The orchestration lives in src/checkpoint/adoptSlot.ts (tested structurally in
// tests/checkpoint/adoptSlot.test.ts); this file pins the CLI surface — the action
// is reachable without the `<sub>` positional, the exit codes, and the exact
// refusal/success wording the maintainer approved during review.
//
// SANDBOXING: the CLI cannot be handed an injected `home`, so the home itself is
// redirected via HOME + USERPROFILE (`os.homedir()` reads one of those on every
// platform) AND the destination state root via HARNESSED_ROOT_OVERRIDE. Both are
// required — see the header of tests/checkpoint/adoptSlot.test.ts.

import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { repoKey, type WorkflowStoreV1Type } from '../../src/checkpoint/workflowStore.js'
import { registerCheckpoint, runCheckpointAdopt } from '../../src/cli/checkpoint.js'
import { captureRunDeps, ExitError } from '../../src/platform/runDeps.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const HOST_ENV = [
  'HARNESSED_ROOT_OVERRIDE',
  'HARNESSED_PLATFORM',
  'CLAUDE_CODE_SESSION_ID',
  'CODEX_SESSION_ID',
] as const

let home: string
let repo: string
let srcRoot: string
let destRoot: string
let key: string
let originalCwd: string

type Store = Omit<WorkflowStoreV1Type, 'schemaVersion'>

function envelope(phase: string, over: Partial<CurrentWorkflowV1Type> = {}): CurrentWorkflowV1Type {
  return {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase,
    status: 'active',
    last_checkpoint_path: '/fake/source-root/checkpoints/phase-7.json',
    started_at: '2026-10-01T00:00:00.000Z',
    ...over,
  }
}

function writeStore(root: string, store: Store): void {
  mkdirSync(root, { recursive: true })
  writeFileSync(
    join(root, 'workflows.json'),
    JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.workflowStore, ...store }, null, 2),
    'utf8',
  )
}

function setUpDestHost(): void {
  const prompts = join(home, '.codex', 'prompts')
  mkdirSync(prompts, { recursive: true })
  writeFileSync(join(prompts, 'task.md'), 'body\n\n<!-- harnessed-generated:v3.4.4 -->\n', 'utf8')
}

beforeEach(() => {
  home = realpathSync(mkdtempSync(join(tmpdir(), 'adoptcli-home-')))
  repo = realpathSync(mkdtempSync(join(tmpdir(), 'adoptcli-repo-')))
  mkdirSync(join(repo, '.git'))
  srcRoot = join(home, '.claude', 'harnessed')
  destRoot = join(home, '.codex', 'harnessed')
  mkdirSync(destRoot, { recursive: true })
  key = repoKey(repo)
  originalCwd = process.cwd()
  process.chdir(repo)

  for (const k of HOST_ENV) vi.stubEnv(k, undefined)
  // os.homedir() reads HOME on posix and USERPROFILE on win32 — stub both.
  vi.stubEnv('HOME', home)
  vi.stubEnv('USERPROFILE', home)
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', destRoot)
  setUpDestHost()
})

afterEach(() => {
  process.chdir(originalCwd)
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
  rmSync(repo, { recursive: true, force: true })
})

interface Captured {
  code: number
  out: string
  err: string
}

async function adopt(from?: string): Promise<Captured> {
  const { deps, stdout, stderr } = captureRunDeps()
  let code = -1
  try {
    await runCheckpointAdopt({ ...(from ? { from } : {}) }, deps)
  } catch (e) {
    if (!(e instanceof ExitError)) throw e
    code = e.code
  }
  return { code, out: stdout.join('\n'), err: stderr.join('\n') }
}

// ── wiring ───────────────────────────────────────────────────────────────────

describe('checkpoint adopt — CLI wiring', () => {
  it('`checkpoint adopt` parses without the <sub> positional', async () => {
    writeStore(srcRoot, { workflows: { [key]: envelope('phase-7') } })
    const logs: string[] = []
    const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.map(String).join(' '))
    })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    const program = new Command().exitOverride()
    registerCheckpoint(program)
    let code = -1
    try {
      await program.parseAsync(['node', 'harnessed', 'checkpoint', 'adopt', '--from', 'claude'])
    } catch (e) {
      if (e instanceof ExitError) code = e.code
      else throw e
    } finally {
      log.mockRestore()
      err.mockRestore()
      exit.mockRestore()
    }
    expect(code).toBe(0)
    expect(logs.join('\n')).toContain('adopted: phase-7')
  })

  it('the other actions still require <sub> and exit 1 without it', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    const program = new Command().exitOverride()
    registerCheckpoint(program)
    let code = -1
    try {
      await program.parseAsync(['node', 'harnessed', 'checkpoint', 'start'])
    } catch (e) {
      if (e instanceof ExitError) code = e.code
      else code = 1
    } finally {
      err.mockRestore()
      exit.mockRestore()
    }
    expect(code).toBe(1)
  })
})

// ── refusal wording ──────────────────────────────────────────────────────────

describe('checkpoint adopt — refusal wording', () => {
  it('D8 same host: names the resolved host, the provenance, and the fix', async () => {
    const r = await adopt('codex')
    expect(r.code).toBe(1)
    expect(r.err).toContain('refused: 本进程被解析为宿主 codex')
    expect(r.err).toContain('依据: HARNESSED_PLATFORM=codex')
    expect(r.err).toContain('--from 与当前宿主相同,无事可做。')
    expect(r.err).toContain(
      '修法: HARNESSED_PLATFORM=claude harnessed checkpoint adopt --from codex',
    )
  })

  it('D8 same host: the 依据 line follows the directory-probe rule, not a hardcoded case', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', undefined)
    mkdirSync(join(home, '.claude'), { recursive: true })
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain('refused: 本进程被解析为宿主 claude')
    expect(r.err).toContain('依据: directory probe (~/.claude 存在,incumbent)')
  })

  it('D8 same host: the 依据 line follows the .platform pin rule', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', undefined)
    writeFileSync(join(destRoot, '.platform'), 'codex\n', 'utf8')
    const r = await adopt('codex')
    expect(r.err).toContain('依据: .platform pin')
    expect(r.err).toContain('~/.codex/harnessed/.platform')
  })

  it('D11 destination slot occupied and active', async () => {
    writeStore(srcRoot, { workflows: { [key]: envelope('phase-7') } })
    writeStore(destRoot, {
      workflows: {
        [key]: envelope('phase-9', {
          sub_progress: [
            { sub: 'a', status: 'done', gate_fired: true },
            { sub: 'b', status: 'done', gate_fired: true },
            { sub: 'c', status: 'done', gate_fired: true },
            { sub: 'd', status: 'pending', gate_fired: true },
            { sub: 'e', status: 'pending', gate_fired: true },
          ],
        }),
      },
    })
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain('refused: 本宿主当前槽位非空')
    expect(r.err).toContain('我的: phase-9 (status:active, 3/5 subs done)')
    expect(r.err).toContain('要接: phase-7 (来自 claude)')
    expect(r.err).toContain('adopt 不覆盖在途账本。先跑:')
    expect(r.err).toContain('harnessed checkpoint complete   # 或 pause')
  })

  it('D14 corrupt source ledger names the path and refuses to repair', async () => {
    mkdirSync(srcRoot, { recursive: true })
    writeFileSync(join(srcRoot, 'workflows.json'), '{ broken', 'utf8')
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain(
      `refused: 源账本在但读不动(JSON 损坏或 schema 不对): ${join(srcRoot, 'workflows.json')}`,
    )
    expect(r.err).toContain('不自动修。备份后检查,或在源宿主重建。')
  })

  it('D14 absent source ledger', async () => {
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain('refused: 源宿主 claude 还没有账本')
  })

  it('T5 destination not set up points at `harnessed setup --platform codex`', async () => {
    rmSync(join(home, '.codex', 'prompts'), { recursive: true, force: true })
    writeStore(srcRoot, { workflows: { [key]: envelope('phase-7') } })
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain('refused: 目标宿主 codex 还没 setup 过')
    expect(r.err).toContain('harnessed setup --platform codex')
  })

  it('unknown --from lists the known host ids', async () => {
    const r = await adopt('gemini')
    expect(r.code).toBe(1)
    expect(r.err).toContain("refused: --from 未知宿主 id 'gemini'")
    expect(r.err).toContain('claude | codex')
  })

  it('zero candidates lists the source ledger keys', async () => {
    writeStore(srcRoot, { workflows: { '/some/other/repo': envelope('elsewhere') } })
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain('refused: 源宿主 claude 的账本里没有这个仓的槽位')
    expect(r.err).toContain('/some/other/repo')
  })

  it('more than one candidate lists them all and never picks', async () => {
    writeStore(srcRoot, {
      workflows: {
        [`${key}::sess-a`]: envelope('phase-a'),
        [`${key}::sess-b`]: envelope('phase-b'),
      },
    })
    const r = await adopt('claude')
    expect(r.code).toBe(1)
    expect(r.err).toContain('2 个候选槽位')
    expect(r.err).toContain(`${key}::sess-a`)
    expect(r.err).toContain(`${key}::sess-b`)
  })
})

// ── success wording ──────────────────────────────────────────────────────────

describe('checkpoint adopt — success wording', () => {
  it('states the phase, the source host, the D12 pointer, the D5 lifetime and the D13 warning', async () => {
    writeStore(srcRoot, { workflows: { [key]: envelope('phase-7') } })
    const r = await adopt('claude')
    expect(r.code).toBe(0)
    expect(r.out).toContain('adopted: phase-7 ← 宿主 claude')
    // D12 — the evidence pointer still aims into the SOURCE root and self-corrects.
    expect(r.out).toContain('/fake/source-root/checkpoints/phase-7.json')
    expect(r.out).toContain('checkpoint complete')
    // D5 — one-session lifetime notice.
    expect(r.out).toContain('接力寿命 = 本会话')
    // D13 — the stale source slot is named, with the command that clears it there.
    expect(r.out).toContain('源槽位仍在、未被改')
    expect(r.out).toContain('HARNESSED_PLATFORM=claude harnessed checkpoint complete phase-7')
    // the invariant this whole design rests on
    expect(r.out).toContain('跨根访问: 只读, 全程未写源根')
    // the superseded preview wording must NOT come back (D12 dropped the copy)
    expect(r.out).not.toContain('证据已随转')
    expect(r.out).not.toContain('指针已改写')
  })

  it('names the archive key when a paused slot was displaced', async () => {
    writeStore(srcRoot, { workflows: { [key]: envelope('phase-7') } })
    writeStore(destRoot, { workflows: { [key]: envelope('phase-6', { status: 'paused' }) } })
    const r = await adopt('claude')
    expect(r.code).toBe(0)
    expect(r.out).toContain(`${key}::displaced-`)
  })

  it('does not mention an archive key when nothing was displaced', async () => {
    writeStore(srcRoot, { workflows: { [key]: envelope('phase-7') } })
    const r = await adopt('claude')
    expect(r.out).not.toContain('::displaced-')
  })

  it('reports the carried retro cadence when the source had one', async () => {
    writeStore(srcRoot, {
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 4 } },
    })
    const r = await adopt('claude')
    expect(r.out).toContain('phases_since_retro=4')
  })
})
