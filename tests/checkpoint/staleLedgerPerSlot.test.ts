// External review L8 — the STALE-ledger breadcrumb aged the ledger by the mtime of
// workflows.json, a store shared by every repo: any repo's checkpoint write
// refreshed it, so an abandoned ledger in one repo never went STALE while another
// repo was active. The age now comes from the slot's own updated_at stamp.
//
// Drives the SHIPPED bin (bin/harnessed-inject-state.mjs) end to end.

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const made: string[] = []
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
})

function run(updatedAt: string | undefined): string {
  const root = mkdtempSync(join(tmpdir(), 'l8-root-'))
  const repo = mkdtempSync(join(tmpdir(), 'l8-repo-'))
  made.push(root, repo)
  mkdirSync(join(repo, '.git'))
  const slot = {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-01-01T00:00:00.000Z',
    ...(updatedAt ? { updated_at: updatedAt } : {}),
    sub_progress: [{ sub: 'task-code', status: 'pending', gate_fired: true }],
  }
  // Written just now: the FILE is fresh, as it is whenever another repo was active.
  writeFileSync(join(root, 'workflows.json'), JSON.stringify({ workflows: { [repo]: slot } }))
  const env: Record<string, string | undefined> = { ...process.env, HARNESSED_ROOT_OVERRIDE: root }
  delete env.CLAUDE_CODE_SESSION_ID
  delete env.HARNESSED_OFF
  return execFileSync('node', [join(process.cwd(), 'bin', 'harnessed-inject-state.mjs')], {
    cwd: repo,
    encoding: 'utf8',
    env,
  })
}

describe('STALE ledger is judged per slot, not by the shared store mtime (L8)', () => {
  it('slot untouched for 3 days → STALE even though workflows.json was just written', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(run(threeDaysAgo)).toMatch(/STALE state machine/)
  })

  it('slot written a minute ago → live, not STALE', () => {
    const out = run(new Date(Date.now() - 60_000).toISOString())
    expect(out).toMatch(/mid state-machine/)
    expect(out).not.toMatch(/STALE/)
  })

  it('pre-stamp record (no updated_at) falls back to the file mtime', () => {
    expect(run(undefined)).not.toMatch(/STALE/)
  })
})
