// Phase 3.4 W1 T1.5 — check-state-archive-stale.mjs 3-rule warn-only gate test
// (3 cells). Sister scripts/check-transparency-verdicts.mjs test pattern + tmpdir
// isolation. ENFORCE=false round 1 — all 3 rule violations exit 0 (warn-only) per
// DEFERRED #AF (Phase 3.5 OR v0.4.0 flip ENFORCE=true).

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

let tmpRoot: string
const SCRIPT = join(process.cwd(), 'scripts', 'check-state-archive-stale.mjs')

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'state-archive-'))
  mkdirSync(join(tmpRoot, '.planning'), { recursive: true })
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

function writeStateMd(content: string): void {
  writeFileSync(join(tmpRoot, '.planning', 'STATE.md'), content, 'utf8')
}

function runScript(): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: tmpRoot, encoding: 'utf8' })
  return { code: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

describe('check-state-archive-stale.mjs — D3 3-rule ENFORCE round 2 + SIZE_LIMIT=175 round 2 RELAX (Phase 4.3 W0.2 #BA resolve)', () => {
  it('1. compliant STATE.md ≤175L + no violations → exit 0 + stdout "compliant"', () => {
    // 150L compliant fixture, no key-decisions sections, no W-N errata literals
    const lines = ['# STATE.md', '## Current Position', 'Phase 3.4 in progress']
    for (let i = 0; i < 147; i++) lines.push(`- item ${i}`)
    writeStateMd(lines.join('\n'))
    const r = runScript()
    expect(r.code).toBe(0)
    expect(r.stdout).toMatch(/within archive cadence limits/)
  })

  it('2. Rule 1 violation — STATE.md 250L > 165L → exit 1 (ENFORCE round 2 + SIZE_LIMIT=165) + stderr "Rule 1 (size)"', () => {
    // 250L STATE.md to trigger Rule 1 (size) violation
    const lines = ['# STATE.md', '## Current Position']
    for (let i = 0; i < 248; i++) lines.push(`- line ${i}`)
    writeStateMd(lines.join('\n'))
    const r = runScript()
    expect(r.code).toBe(1) // ENFORCE round 2 + SIZE_LIMIT=165 round 3 tighten (Phase 5.1 W0 T0.2 #BA resolve)
    expect(r.stderr).toMatch(/Rule 1 \(size\)/)
    expect(r.stderr).toMatch(/250L > 165L/)
  })

  it('3. Rule 3 violation — historical "W-1 errata" literal → exit 1 (ENFORCE round 2) + stderr "Rule 3 (errata)"', () => {
    writeStateMd(
      [
        '# STATE.md',
        '## Current Position',
        'Phase 3.4 in progress',
        '- W-1 errata: historical commentary that should live in RETROSPECTIVE',
      ].join('\n'),
    )
    const r = runScript()
    expect(r.code).toBe(1) // ENFORCE round 2 active per Phase 4.1 W0 T0.2 c83d79c
    expect(r.stderr).toMatch(/Rule 3 \(errata\)/)
  })
})
