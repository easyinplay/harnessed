// v16.0 Phase 64 T2 — the per-turn inject bin as a CODEX plugin hook.
//
// Measured (codex-cli 0.154): a codex hook process carries NO CODEX_* env (the
// app-server replays its parent's snapshot), and when codex was launched from a
// Claude Code terminal that snapshot still holds CLAUDE_CODE_SESSION_ID — so the
// ADR 0040 env sniff alone would pick claude. The generated hook command passes
// `--platform codex` explicitly, and the session id comes from the hook's stdin
// payload (`session_id` == the shell's CODEX_SESSION_ID — same key the CLI uses).
// Without the flag the bin must behave exactly as before (CC path byte-identical).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildInjection, DEFAULT_INJECT_BUDGET } from '../../src/checkpoint/injectState.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const BIN = join(process.cwd(), 'bin', 'harnessed-inject-state.mjs')

let tmp: string
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'inject-codexhook-'))
  mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
  mkdirSync(join(tmp, 'home', '.claude', 'harnessed'), { recursive: true })
  mkdirSync(join(tmp, 'home', '.codex', 'harnessed'), { recursive: true })
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

const wf: CurrentWorkflowV1Type = {
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase: 'task',
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-06-12T00:00:00.000Z',
  sub_progress: [{ sub: 'beta', status: 'pending', gate_fired: true }],
}

/** A codex hook process launched from inside a Claude Code terminal. */
function runBin(args: string[], stdin: string): string {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: join(tmp, 'home'),
    USERPROFILE: join(tmp, 'home'),
    CLAUDE_CODE_SESSION_ID: 'cc-parent-session',
  }
  for (const k of ['HARNESSED_ROOT_OVERRIDE', 'HARNESSED_PLATFORM', 'HARNESSED_OFF']) delete env[k]
  for (const k of Object.keys(env)) if (k.startsWith('CODEX_')) delete env[k]
  return execFileSync('node', [BIN, ...args], {
    env,
    input: stdin,
    encoding: 'utf8',
    cwd: join(tmp, 'repo'),
  })
}

describe('inject-state bin under a codex plugin hook (--platform codex)', () => {
  it('--invalidate --platform codex drops the CODEX cache even with CLAUDE_CODE_SESSION_ID inherited', () => {
    const codexCache = join(tmp, 'home', '.codex', 'harnessed', 'inject-cache')
    const claudeCache = join(tmp, 'home', '.claude', 'harnessed', 'inject-cache')
    for (const d of [codexCache, claudeCache]) {
      mkdirSync(d, { recursive: true })
      writeFileSync(join(d, 'entry.json'), '{}')
    }
    runBin(['--invalidate', '--platform', 'codex'], '{"session_id":"s1"}')
    expect(existsSync(codexCache)).toBe(false)
    expect(existsSync(claudeCache)).toBe(true)
  })

  it('UserPromptSubmit: session slot keyed by stdin session_id at the codex stateRoot', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const sessionWf: CurrentWorkflowV1Type = { ...wf, phase: 'verify' }
    writeFileSync(
      join(tmp, 'home', '.codex', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [`${repoRoot}::codex-s1`]: sessionWf, [repoRoot]: wf },
      }),
    )
    const payload = JSON.stringify({
      session_id: 'codex-s1',
      hook_event_name: 'UserPromptSubmit',
      prompt: 'hi',
    })
    const out = runBin(['--platform', 'codex'], payload).trim()
    expect(out).toContain('phase: verify')
    expect(out).toBe(buildInjection(repoRoot, sessionWf, '', DEFAULT_INJECT_BUDGET).trim())
  })

  it('malformed stdin → bare repo slot, never a crash', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    writeFileSync(
      join(tmp, 'home', '.codex', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoRoot]: wf },
      }),
    )
    const out = runBin(['--platform', 'codex'], 'not json').trim()
    expect(out).toContain('phase: task')
  })

  it('without --platform the stdin is not consulted (claude path unchanged)', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    writeFileSync(
      join(tmp, 'home', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: {
          [`${repoRoot}::cc-parent-session`]: { ...wf, phase: 'plan' },
          [`${repoRoot}::from-stdin`]: { ...wf, phase: 'verify' },
        },
      }),
    )
    const out = runBin([], JSON.stringify({ session_id: 'from-stdin' })).trim()
    expect(out).toContain('phase: plan')
  })
})
