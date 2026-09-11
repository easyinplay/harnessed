// 4.30.0 (issue #6) — end-to-end test of bin/harnessed-stop-hook.mjs: feed a
// synthetic Stop-hook stdin payload + transcript JSONL, assert the decision:block
// output on mode-B and silence otherwise. Covers the loop guards (stop_hook_active
// + retry cap) and fail-soft on broken input.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const BIN = join(process.cwd(), 'bin', 'harnessed-stop-hook.mjs')

/** Run the hook with a payload on stdin; returns trimmed stdout.
 *  `extraEnv` lets a cell exercise the Phase 60 kill switch against the SHIPPED
 *  bundle rather than the TS source — bin/*.mjs is an esbuild artifact that is
 *  committed, so a gate present in src but absent from the bundle would ship
 *  broken and every source-level test would still pass. */
function runHook(
  payload: object,
  rootOverride: string,
  extraEnv: Record<string, string> = {},
): string {
  return execFileSync('node', [BIN], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, HARNESSED_ROOT_OVERRIDE: rootOverride, ...extraEnv },
  }).trim()
}

/** Write a transcript JSONL whose LAST assistant row carries `content`. */
function writeTranscript(dir: string, content: unknown): string {
  const p = join(dir, 'transcript.jsonl')
  const rows = [
    { type: 'user', message: { role: 'user', content: 'go' } },
    { type: 'assistant', message: { role: 'assistant', content } },
  ]
  writeFileSync(p, `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`)
  return p
}

const MODE_B = [
  {
    type: 'text',
    text: '做外科修改。\n\ncourt\n<invoke name="Read">\n<parameter name="file_path">/d/x</parameter>',
  },
]

describe('harnessed-stop-hook.mjs (issue #6)', () => {
  it('mode-B message → decision:block with a retry reason', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-'))
    const tp = writeTranscript(dir, MODE_B)
    const out = runHook({ session_id: 's1', transcript_path: tp, stop_hook_active: false }, dir)
    const parsed = JSON.parse(out)
    expect(parsed.decision).toBe('block')
    expect(parsed.reason).toMatch(/MODE-B/)
    expect(parsed.reason).toMatch(/real tool call/i)
  })

  // Phase 60 — the same payload that blocks above must go silent under the
  // master kill switch, or an A/B control arm would still be getting harnessed's
  // recovery turn. Falsifiable by construction: it reuses MODE_B, which cell 1
  // proves does block when the switch is off.
  it('HARNESSED_OFF=1 → silent even on a mode-B message (master kill switch)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-off-'))
    const tp = writeTranscript(dir, MODE_B)
    const out = runHook(
      { session_id: 's-off', transcript_path: tp, stop_hook_active: false },
      dir,
      {
        HARNESSED_OFF: '1',
      },
    )
    expect(out).toBe('')
  })

  it('HARNESSED_OFF=0 is NOT a kill switch — only an exact "1" ablates', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-off0-'))
    const tp = writeTranscript(dir, MODE_B)
    const out = runHook(
      { session_id: 's-off0', transcript_path: tp, stop_hook_active: false },
      dir,
      {
        HARNESSED_OFF: '0',
      },
    )
    expect(JSON.parse(out).decision).toBe('block')
  })

  it('stop_hook_active:true → silent (loop guard 1)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-active-'))
    const tp = writeTranscript(dir, MODE_B)
    const out = runHook({ session_id: 's2', transcript_path: tp, stop_hook_active: true }, dir)
    expect(out).toBe('')
  })

  it('retry cap: 3rd consecutive same-signature turn → silent (loop guard 2)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-cap-'))
    const tp = writeTranscript(dir, MODE_B)
    const p = { session_id: 's3', transcript_path: tp, stop_hook_active: false }
    expect(runHook(p, dir)).not.toBe('') // retry 1 → block
    expect(runHook(p, dir)).not.toBe('') // retry 2 → block
    expect(runHook(p, dir)).toBe('') // cap reached → silent
  })

  it('legitimate structured tool_use turn → silent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-real-'))
    const tp = writeTranscript(dir, [
      { type: 'text', text: 'reading it' },
      { type: 'tool_use', name: 'Read', input: { file_path: '/x' } },
    ])
    const out = runHook({ session_id: 's4', transcript_path: tp, stop_hook_active: false }, dir)
    expect(out).toBe('')
  })

  it('prose mentioning the tags mid-message (not tail) → silent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-prose-'))
    const tp = writeTranscript(dir, [
      {
        type: 'text',
        text:
          'The bug: <invoke name="Bash"> with <parameter name="cmd"> leaks as text. ' +
          'We fix it with a Stop hook. A long explanation follows so the tag sits far from ' +
          'the end and is clearly ongoing discussion, more prose, more prose, more prose, done.',
      },
    ])
    const out = runHook({ session_id: 's5', transcript_path: tp, stop_hook_active: false }, dir)
    expect(out).toBe('')
  })

  it('broken JSON payload → silent (fail-soft)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-bad-'))
    const out = execFileSync('node', [BIN], {
      input: '{not json',
      encoding: 'utf8',
      env: { ...process.env, HARNESSED_ROOT_OVERRIDE: dir },
    }).trim()
    expect(out).toBe('')
  })

  it('missing transcript file → silent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stophook-missing-'))
    const out = runHook(
      { session_id: 's6', transcript_path: join(dir, 'nope.jsonl'), stop_hook_active: false },
      dir,
    )
    expect(out).toBe('')
  })
})
