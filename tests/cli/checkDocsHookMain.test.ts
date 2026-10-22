// v16 Codex hot-path hardening — the Codex plugin shim must be able to run
// check-docs without loading the full dist/cli.mjs graph. This tests the REAL
// generated hook artifact at the same argv/stdin/exit-code surface Codex uses.

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_MAX_STATE_LINES } from '../../src/cli/checkDocs.js'

const BIN = join(process.cwd(), 'bin', 'harnessed-check-docs.mjs')
const COMMIT = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git commit -m x' } })
let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'check-docs-hook-bin-'))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function seedHalt() {
  mkdirSync(join(root, '.planning'), { recursive: true })
  const lines = DEFAULT_MAX_STATE_LINES + 3
  writeFileSync(
    join(root, '.planning', 'STATE.md'),
    Array.from({ length: lines }, (_, i) => `L${i}`).join('\n'),
  )
  return lines
}

function run(args: string[], input = COMMIT) {
  return execFileSync('node', [BIN, 'check-docs', ...args], {
    input,
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

describe('bin/harnessed-check-docs.mjs', () => {
  it('codex halt → exit 0 and JSON deny on stdout', () => {
    const lines = seedHalt()
    const out = run(['--hook', '--cwd', root, '--platform', 'codex'])
    const parsed = JSON.parse(out)
    expect(parsed.hookSpecificOutput.permissionDecision).toBe('deny')
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toContain(String(lines))
  })

  it('non-commit payload → silent pass', () => {
    const out = run(
      ['--hook', '--cwd', root, '--platform', 'codex'],
      JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git status' } }),
    )
    expect(out).toBe('')
  })

  it('without --platform keeps the CC hook exit-2 contract', () => {
    seedHalt()
    let err = ''
    try {
      run(['--hook', '--cwd', root])
      throw new Error('expected exit 2')
    } catch (e) {
      const r = e as { status?: number; stderr?: string }
      expect(r.status).toBe(2)
      err = r.stderr ?? ''
    }
    expect(err).toContain('STATE')
  })
})
