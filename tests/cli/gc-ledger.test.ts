// v16.0 Phase 67 T7 (F10) — `harnessed gc` wires the ledger prune: reuses
// --older-than / --dry-run, runs even with no backups dir, honours
// HARNESSED_ROOT_OVERRIDE. Pruning rules themselves: tests/checkpoint/pruneSlots.test.ts.

import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerGc } from '../../src/cli/gc.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const DAY = 86_400_000
const PAST = new Date('2020-01-01T00:00:00.000Z')
const ago = (ms: number): string => new Date(Date.now() - ms).toISOString()

let root: string
let ledger: string
let out: string[]

function slot(updated: string, status = 'complete') {
  return {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'p',
    status,
    last_checkpoint_path: null,
    started_at: updated,
    updated_at: updated,
  }
}

function seed(workflows: Record<string, unknown>): void {
  writeFileSync(
    ledger,
    JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.workflowStore, workflows }, null, 2),
    'utf8',
  )
  utimesSync(ledger, PAST, PAST)
}

async function gc(...args: string[]): Promise<void> {
  const program = new Command()
  registerGc(program)
  await program.parseAsync(['gc', ...args], { from: 'user' })
}

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'gc-ledger-')))
  ledger = join(root, 'workflows.json')
  out = []
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', root)
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('CLAUDE_CODE_SESSION_ID', undefined)
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    out.push(a.join(' '))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  rmSync(root, { recursive: true, force: true })
})

describe('harnessed gc — ledger pass', () => {
  it('prunes a stale complete session slot even though there is no backups dir', async () => {
    seed({ '/r::old': slot(ago(40 * DAY)), '/r::new': slot(ago(1 * DAY)) })
    await gc()
    expect(Object.keys(JSON.parse(readFileSync(ledger, 'utf8')).workflows)).toEqual(['/r::new'])
    expect(out.join('\n')).toContain('/r::old')
  })

  it('--older-than is reused: 5d prunes a 10d-old slot that the 30d default keeps', async () => {
    seed({ '/r::mid': slot(ago(10 * DAY)) })
    await gc()
    expect(Object.keys(JSON.parse(readFileSync(ledger, 'utf8')).workflows)).toEqual(['/r::mid'])
    await gc('--older-than', '5d')
    expect(Object.keys(JSON.parse(readFileSync(ledger, 'utf8')).workflows)).toEqual([])
  })

  it('--dry-run lists the plan and writes nothing', async () => {
    seed({ '/r::old': slot(ago(40 * DAY)) })
    const bytes = readFileSync(ledger, 'utf8')
    const mtime = statSync(ledger).mtimeMs
    await gc('--dry-run')
    expect(readFileSync(ledger, 'utf8')).toBe(bytes)
    expect(statSync(ledger).mtimeMs).toBe(mtime)
    expect(out.join('\n')).toContain('/r::old')
  })

  it('never prunes active/paused/bare slots through the CLI either', async () => {
    seed({
      '/r::a': slot(ago(400 * DAY), 'active'),
      '/r::p': slot(ago(400 * DAY), 'paused'),
      '/r': slot(ago(400 * DAY)),
    })
    await gc()
    expect(Object.keys(JSON.parse(readFileSync(ledger, 'utf8')).workflows).sort()).toEqual([
      '/r',
      '/r::a',
      '/r::p',
    ])
  })
})
