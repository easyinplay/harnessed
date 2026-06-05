// v5.0 Spec 1 (B + F) — `harnessed status --recover` structured recovery render.
//
// Covers ROADMAP Phase 5 success criteria 1-4:
//   1. full ledger render — status markers + evidence_status + `→ next:`
//   2. empty ledger → graceful "no ledger — run gates + start" degrade (D3)
//   3. `none_declared` renders DISTINCTLY from `verified` (never a pass) (D2)
//   4. drift line emitted on sha256 mismatch (warn, not block) (F)
//
// `readCurrentWorkflow` + `detectDrift` are mocked → deterministic, no fs/crypto.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/state.js', () => ({ readCurrentWorkflow: vi.fn() }))
vi.mock('../../src/checkpoint/evidence.js', () => ({ detectDrift: vi.fn() }))
// keep lock/state install reads inert so the non-recover path never touches fs.
vi.mock('../../src/installers/lib/state.js', () => ({ readState: vi.fn() }))

import { Command } from 'commander'
import { detectDrift } from '../../src/checkpoint/evidence.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/index.js'
import { readCurrentWorkflow } from '../../src/checkpoint/state.js'
import { buildRecoverLines, registerStatus } from '../../src/cli/status.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const readWorkflowMock = vi.mocked(readCurrentWorkflow)
const detectDriftMock = vi.mocked(detectDrift)

function wf(sub_progress: SubProgressEntryType[] | undefined) {
  return {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'active' as const,
    last_checkpoint_path: null,
    started_at: '2026-06-05T10:00:00.000Z',
    ...(sub_progress ? { sub_progress } : {}),
  }
}

async function runRecover(): Promise<string> {
  const logs: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((m?: unknown) => {
    logs.push(String(m ?? ''))
  })
  const program = new Command().exitOverride()
  registerStatus(program)
  try {
    await program.parseAsync(['node', 'harnessed', 'status', '--recover'])
  } finally {
    log.mockRestore()
  }
  return logs.join('\n')
}

describe('status --recover (v5.0 Spec 1 B/F)', () => {
  beforeEach(() => {
    readWorkflowMock.mockReset()
    detectDriftMock.mockReset()
    detectDriftMock.mockResolvedValue([])
  })

  it('1. renders every sub with markers + evidence_status + → next', async () => {
    readWorkflowMock.mockResolvedValue(
      wf([
        { sub: 'clarify', status: 'done', gate_fired: true, evidence_status: 'verified' },
        { sub: 'code', status: 'done', gate_fired: true, evidence_status: 'verified' },
        { sub: 'test', status: 'pending', gate_fired: true },
        { sub: 'deliver', status: 'pending', gate_fired: true },
        { sub: 'design', status: 'skipped', gate_fired: false, reason: 'trivial CRUD' },
      ]),
    )
    const out = await runRecover()
    expect(out).toMatch(/workflow: task \(active\)/)
    expect(out).toMatch(/clarify\s+✅ done/)
    expect(out).toMatch(/test\s+⏳ pending/)
    expect(out).toMatch(/design\s+⬜ skipped.*trivial CRUD/)
    // next = first pending = test, arrow on it, and the → next line.
    expect(out).toMatch(/test\s+⏳ pending.*← next/)
    expect(out).toContain('→ next: harnessed prompt test')
  })

  it('2. empty ledger degrades gracefully (D3)', async () => {
    readWorkflowMock.mockResolvedValue(wf(undefined))
    const out = await runRecover()
    expect(out).toContain('no ledger — run gates + start')
    expect(out).not.toMatch(/workflow:/)
  })

  it('2b. null workflow (no current-workflow.json) → same graceful degrade', async () => {
    readWorkflowMock.mockResolvedValue(null)
    const out = await runRecover()
    expect(out).toContain('no ledger — run gates + start')
  })

  it('3. none_declared renders distinctly from verified (never a pass)', async () => {
    readWorkflowMock.mockResolvedValue(
      wf([
        { sub: 'code', status: 'done', gate_fired: true, evidence_status: 'verified' },
        { sub: 'docs', status: 'done', gate_fired: true, evidence_status: 'none_declared' },
        { sub: 'misc', status: 'done', gate_fired: true }, // no posture → none_declared
      ]),
    )
    const out = await runRecover()
    expect(out).toMatch(/code\s+✅ done.*evidence: verified/)
    expect(out).toMatch(/docs\s+✅ done.*evidence: none_declared/)
    expect(out).toMatch(/misc\s+✅ done.*evidence: none_declared/)
    // none_declared must NOT be rendered as "verified".
    const docsLine = out.split('\n').find((l) => l.includes('docs')) ?? ''
    expect(docsLine).not.toContain('verified')
  })

  it('4. drift line emitted on sha256 mismatch (warn, not block)', async () => {
    readWorkflowMock.mockResolvedValue(
      wf([
        {
          sub: 'code',
          status: 'done',
          gate_fired: true,
          evidence_status: 'verified',
          evidence: [{ path: 'progress.md', sha256: 'abc1234deadbeef' }],
        },
      ]),
    )
    detectDriftMock.mockResolvedValue([
      { path: 'progress.md', was: 'abc1234deadbeef', now: 'def5678cafef00d' },
    ])
    const out = await runRecover()
    expect(out).toMatch(/⚠ drift: progress\.md sha256 changed \(was abc1234…, now def5678…\)/)
    // it is a warn, not a block: the normal ledger render still appears.
    expect(out).toMatch(/code\s+✅ done/)
  })

  it('4b. deleted evidence file renders as "missing" now-hash', async () => {
    readWorkflowMock.mockResolvedValue(
      wf([
        {
          sub: 'code',
          status: 'done',
          gate_fired: true,
          evidence: [{ path: 'gone.md', sha256: 'abc1234deadbeef' }],
        },
      ]),
    )
    detectDriftMock.mockResolvedValue([{ path: 'gone.md', was: 'abc1234deadbeef', now: '' }])
    const out = await runRecover()
    expect(out).toMatch(/⚠ drift: gone\.md sha256 changed \(was abc1234…, now missing\)/)
  })

  it('5. all subs resolved → no-pending hint instead of → next', async () => {
    readWorkflowMock.mockResolvedValue(
      wf([
        { sub: 'code', status: 'done', gate_fired: true, evidence_status: 'verified' },
        { sub: 'design', status: 'skipped', gate_fired: false, reason: 'n/a' },
      ]),
    )
    const out = await runRecover()
    expect(out).toContain('→ all subs resolved (no pending work)')
    expect(out).not.toContain('→ next:')
  })

  it('6. overridden evidence_status renders distinctly', async () => {
    const lines = await buildRecoverLines({ phase: 'task', status: 'active', started_at: 't0' }, [
      { sub: 'code', status: 'done', gate_fired: true, evidence_status: 'overridden' },
    ])
    expect(lines.join('\n')).toMatch(/code\s+✅ done.*evidence: overridden \(--force\)/)
  })
})
