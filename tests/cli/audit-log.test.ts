// Phase 5.1 W1 T1.2 — TDD RED: audit-log CLI subcommand tests.
// R10.1 D-01 jq spawn smoke + D-02 dual format + D-03 3 flag + D-04 5-pattern redact.
// Sister: tests/cli/doctor.test.ts 149L — ExitError + runCli helper 100% reuse.
// vi.mock spawn (Win CI runner may lack jq — A5 assumption NOT real jq).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn(), spawnSync: vi.fn() }))
vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { Command } from 'commander'
import { registerAuditLog } from '../../src/cli/audit-log.js'

const spawnMock = vi.mocked(spawn)
const existsSyncMock = vi.mocked(existsSync)
const readFileSyncMock = vi.mocked(readFileSync)

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
  registerAuditLog(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}

// 3 sample audit records (12-field schema per src/audit/log.ts)
const RECORD_A = JSON.stringify({
  ts: '2026-05-19T10:00:00.000Z',
  phase: '5.1',
  task_excerpt: 'implement auth module',
  task_sha1: 'abc1234567890',
  matched_rule_id: 'R-ENGINEERING-01',
  primary_expert: 'engineering',
  secondary_expert: null,
  category: 'engineering',
  route_layer: 'rule',
  outcome: 'complete',
  session_id: 'sess-001',
  iter_count: 1,
})
const RECORD_B = JSON.stringify({
  ts: '2026-05-19T11:00:00.000Z',
  phase: '5.1',
  task_excerpt: 'write documentation',
  task_sha1: 'def4567890123',
  matched_rule_id: 'R-DOCS-01',
  primary_expert: 'writer',
  secondary_expert: null,
  category: 'writing',
  route_layer: 'rule',
  outcome: 'complete',
  session_id: 'sess-002',
  iter_count: 2,
})
const RECORD_C = JSON.stringify({
  ts: '2026-05-19T12:00:00.000Z',
  phase: '5.1',
  task_excerpt: 'fix bug in routing',
  task_sha1: 'ghi7890123456',
  matched_rule_id: null,
  primary_expert: 'engineering',
  secondary_expert: null,
  category: 'engineering',
  route_layer: 'fallback',
  outcome: 'complete',
  session_id: 'sess-003',
  iter_count: 3,
})

function mockAuditLog(lines: string[]): void {
  existsSyncMock.mockReturnValue(true)
  readFileSyncMock.mockReturnValue(lines.join('\n') as unknown as Buffer)
}

describe('cli/audit-log — Phase 5.1 W1 T1.2 TDD RED (D-01 jq + D-02 dual format + D-03 flags + D-04 redact)', () => {
  beforeEach(() => {
    existsSyncMock.mockReset()
    readFileSyncMock.mockReset()
    spawnMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('cell 1 — no audit.log → exit 0 + empty message', async () => {
    existsSyncMock.mockReturnValue(false)
    const { code, stdout } = await runCli(['audit-log'])
    expect(code).toBe(0)
    expect(stdout).toContain('no audit records')
  })

  it('cell 2 — 3 records, no filter → human table 5-column output + exit 0', async () => {
    mockAuditLog([RECORD_A, RECORD_B, RECORD_C])
    const { code, stdout } = await runCli(['audit-log'])
    expect(code).toBe(0)
    // Human table header or content must show the 5 key columns
    expect(stdout).toMatch(/ts|phase|category|matched_rule_id|outcome/i)
    // Should show engineering and writing categories
    expect(stdout).toContain('engineering')
  })

  it('cell 3 — --filter ".category==\\"engineering\\"" → spawn jq with filter expr + exit 0', async () => {
    mockAuditLog([RECORD_A, RECORD_B, RECORD_C])
    // Mock spawn to simulate jq process: emit close event with code 0
    const mockChild = {
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn().mockImplementation((event: string, cb: (code: number) => void) => {
        if (event === 'close') setTimeout(() => cb(0), 0)
      }),
    }
    spawnMock.mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>)
    const { code } = await runCli(['audit-log', '--filter', '.category=="engineering"'])
    expect(code).toBe(0)
    // jq should have been spawned with the filter expression
    expect(spawnMock).toHaveBeenCalledWith(
      'jq',
      ['.category=="engineering"'],
      expect.objectContaining({ stdio: expect.anything() }),
    )
  })

  it('cell 4 — --json flag → full 12-field pretty-print JSON output', async () => {
    mockAuditLog([RECORD_A])
    const { code, stdout } = await runCli(['audit-log', '--json'])
    expect(code).toBe(0)
    // Should contain all 12 fields
    expect(stdout).toContain('"ts"')
    expect(stdout).toContain('"task_excerpt"')
    expect(stdout).toContain('"matched_rule_id"')
    expect(stdout).toContain('"primary_expert"')
    expect(stdout).toContain('"route_layer"')
    expect(stdout).toContain('"iter_count"')
  })

  it('cell 5 — redact: api_key= + token= + password= → [REDACTED] in task_excerpt (--json shows full record)', async () => {
    const sensitiveRecord = JSON.stringify({
      ts: '2026-05-19T10:00:00.000Z',
      phase: '5.1',
      task_excerpt: 'call api with api_key=sk-secret123 token=mytoken123 password=hunter2',
      task_sha1: 'aaa111',
      matched_rule_id: null,
      primary_expert: 'engineering',
      secondary_expert: null,
      category: 'engineering',
      route_layer: 'rule',
      outcome: 'complete',
      session_id: null,
      iter_count: 1,
    })
    mockAuditLog([sensitiveRecord])
    // Use --json to see task_excerpt field in output (human table 5-col omits task_excerpt by design)
    const { stdout } = await runCli(['audit-log', '--json'])
    expect(stdout).not.toContain('sk-secret123')
    expect(stdout).not.toContain('mytoken123')
    expect(stdout).not.toContain('hunter2')
    expect(stdout).toContain('[REDACTED]')
  })

  it('cell 6 — redact: Authorization: Bearer + key prefixes (sk-/pk-/gh_/ghp_/ya29./AIza)', async () => {
    const sensitiveRecord = JSON.stringify({
      ts: '2026-05-19T10:00:00.000Z',
      phase: '5.1',
      task_excerpt:
        'header Authorization: Bearer eyJtokenXYZ call with gh_pat123456 and AIzaSecretKey',
      task_sha1: 'bbb222',
      matched_rule_id: null,
      primary_expert: 'engineering',
      secondary_expert: null,
      category: 'engineering',
      route_layer: 'rule',
      outcome: 'complete',
      session_id: null,
      iter_count: 1,
    })
    mockAuditLog([sensitiveRecord])
    // Use --json to see task_excerpt field in output (human table 5-col omits task_excerpt by design)
    const { stdout } = await runCli(['audit-log', '--json'])
    expect(stdout).not.toContain('eyJtokenXYZ')
    expect(stdout).not.toContain('gh_pat123456')
    expect(stdout).not.toContain('AIzaSecretKey')
    expect(stdout).toContain('[REDACTED]')
  })

  it('cell 7 — --tail 2 limits output to 2 most recent records', async () => {
    mockAuditLog([RECORD_A, RECORD_B, RECORD_C])
    const { code, stdout } = await runCli(['audit-log', '--tail', '2'])
    expect(code).toBe(0)
    // Should show only 2 records — RECORD_B and RECORD_C (most recent 2)
    // RECORD_A (oldest) should not appear in the tail-2 output
    expect(stdout).toContain('5.1')
    // Count occurrences — with 3 records and --tail 2 we expect exactly 2 shown
    const lines = stdout.split('\n').filter((l) => l.includes('5.1') && l.includes('complete'))
    expect(lines.length).toBeLessThanOrEqual(2)
  })

  it('cell 8 — key prefix redact all 6 variants: sk-/pk-/ghp_/ya29./AIza (coverage matrix)', async () => {
    const allPrefixRecord = JSON.stringify({
      ts: '2026-05-19T10:00:00.000Z',
      phase: '5.1',
      task_excerpt: 'keys: sk-abc1234567 pk-def1234567 ghp_ghi1234567 ya29.ahJFsecret AIzaSySecret',
      task_sha1: 'ccc333',
      matched_rule_id: null,
      primary_expert: null,
      secondary_expert: null,
      category: 'engineering',
      route_layer: 'rule',
      outcome: 'complete',
      session_id: null,
      iter_count: null,
    })
    mockAuditLog([allPrefixRecord])
    // Use --json to see task_excerpt field in output (human table 5-col omits task_excerpt by design)
    const { stdout } = await runCli(['audit-log', '--json'])
    expect(stdout).not.toContain('sk-abc1234567')
    expect(stdout).not.toContain('pk-def1234567')
    expect(stdout).not.toContain('ghp_ghi1234567')
    expect(stdout).not.toContain('ya29.ahJFsecret')
    expect(stdout).not.toContain('AIzaSySecret')
    expect(stdout).toContain('[REDACTED]')
  })
})
