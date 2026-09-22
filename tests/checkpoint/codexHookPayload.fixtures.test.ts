// v16.0 Phase 64 T9 — REAL codex hook stdin payloads (captured on codex-cli 0.154,
// sanitized: ids / paths / model / prompt text are placeholders, env dropped) drive
// the hook-side input parsing, so a codex payload-shape change shows up as a
// fixture diff rather than as a hook that silently stops finding its session.
// Fixture drift is only worth re-capturing on a codex MINOR bump — the
// `pnpm test:codex-live` script flags that (scripts/codex-live/run.mjs).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sessionIdFromPayload } from '../../src/checkpoint/hookHost.js'
import { shouldGateForHookPayload } from '../../src/cli/checkDocs.js'

const DIR = join(process.cwd(), 'tests', 'fixtures', 'codex-hooks', '0.154')
const load = (name: string): string => readFileSync(join(DIR, name), 'utf8')
const SID = '019a0000-0000-7000-8000-000000000001'

// The CC-compatible common fields (design doc 「Phase 1 第 0 步实测结果」).
const COMMON = [
  'session_id',
  'transcript_path',
  'cwd',
  'hook_event_name',
  'model',
  'permission_mode',
]

describe('codex 0.154 hook payload fixtures', () => {
  it.each([
    ['SessionStart.json', ['source']],
    ['UserPromptSubmit.json', ['turn_id', 'prompt']],
    ['PreToolUse.Bash.json', ['turn_id', 'tool_name', 'tool_input', 'tool_use_id']],
    [
      'PostToolUse.Bash.json',
      ['turn_id', 'tool_name', 'tool_input', 'tool_response', 'tool_use_id'],
    ],
  ])('%s carries the CC-shaped field set', (name, extra) => {
    const p = JSON.parse(load(name)) as Record<string, unknown>
    expect(Object.keys(p).sort()).toEqual([...COMMON, ...extra].sort())
  })

  it('every event: session_id is what the inject hook keys the session slot on', () => {
    for (const name of ['SessionStart.json', 'UserPromptSubmit.json', 'PreToolUse.Bash.json']) {
      expect(sessionIdFromPayload(load(name))).toBe(SID)
    }
  })

  it('PreToolUse: codex names its shell tool `Bash` — the doc gate recognizes the shape', () => {
    const bash = JSON.parse(load('PreToolUse.Bash.json')) as {
      tool_name: string
      tool_input: { command: string }
    }
    expect(bash.tool_name).toBe('Bash')
    // the captured command is not a commit → no gate
    expect(shouldGateForHookPayload(load('PreToolUse.Bash.json'))).toBe(false)
    // the same real payload carrying a commit → gate
    const commit = { ...bash, tool_input: { ...bash.tool_input, command: 'git commit -m "x"' } }
    expect(shouldGateForHookPayload(JSON.stringify(commit))).toBe(true)
  })

  it('PreToolUse for a non-shell tool never gates', () => {
    expect(shouldGateForHookPayload(load('PreToolUse.other-tool.json'))).toBe(false)
  })
})
