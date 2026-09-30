// v16.0 Phase 66 T5 — the check × host matrix: pure summarise + render.
//
// Kept OUT of doctor.ts so the shape is testable without dispatching 48 real
// checks. Two contracts live here:
//   - `summarise` — `skipped` is neither a pass nor a fail, so it can never flip
//     the summary NOR the exit code (the whole point of promoting it out of the
//     fake-`pass` it used to wear).
//   - `renderMatrix` — one row per check, one column per host, `n/a` for a cell
//     the registry never declared. A `skipped` CELL is therefore a drift signal:
//     the registry claimed a host that the check itself rejects.

import { describe, expect, it } from 'vitest'
import {
  type DoctorMatrix,
  NOT_APPLICABLE,
  renderMatrix,
  summarise,
} from '../../src/cli/lib/doctor-matrix.js'

const fixture: DoctorMatrix = {
  hosts: ['claude', 'codex'],
  checks: [
    {
      name: 'node ≥ 22',
      hosts: ['claude', 'codex'],
      cells: {
        claude: { status: 'pass', message: 'node 22.14.0' },
        codex: { status: 'pass', message: 'node 22.14.0' },
      },
    },
    {
      name: 'mcp scope',
      hosts: ['claude'],
      cells: {
        claude: { status: 'warn', message: 'no MCP servers', fix: 'run setup' },
        codex: null,
      },
    },
    {
      name: 'codex hook plugins',
      hosts: ['codex'],
      cells: { claude: null, codex: { status: 'fail', message: 'untrusted' } },
    },
  ],
  summary: { claude: 'warn', codex: 'fail' },
}

describe('cli/lib/doctor-matrix — summarise', () => {
  it('cell 1 — all pass → pass', () => {
    expect(summarise([{ status: 'pass' }, { status: 'pass' }])).toBe('pass')
  })

  it('cell 2 — skipped never flips the summary (pass + skipped → pass)', () => {
    expect(summarise([{ status: 'pass' }, { status: 'skipped' }])).toBe('pass')
    expect(summarise([{ status: 'skipped' }])).toBe('pass')
  })

  it('cell 3 — any warn → warn; any fail wins over warn', () => {
    expect(summarise([{ status: 'pass' }, { status: 'warn' }, { status: 'skipped' }])).toBe('warn')
    expect(summarise([{ status: 'warn' }, { status: 'fail' }])).toBe('fail')
  })

  it('cell 4 — an empty run is a pass (nothing applied to this host)', () => {
    expect(summarise([])).toBe('pass')
  })
})

describe('cli/lib/doctor-matrix — renderMatrix', () => {
  // The legend is the caller's string (doctor.ts resolves `doctor.matrix.legend`
  // from messages/*.json) and owns its own leading blank line.
  const LEGEND = `\n${NOT_APPLICABLE} = not declared for that host, so it was not run`
  const out = renderMatrix(fixture, LEGEND)
  const lines = out.split('\n')

  it('cell 5 — header names the check column and every host column, in order', () => {
    expect(lines[0]).toMatch(/^check\s+claude\s+codex$/)
    expect(lines[1]).toMatch(/^-+\s+-+\s+-+$/)
  })

  it('cell 6 — one row per check, carrying that host cell status', () => {
    const row = (name: string) => lines.find((l) => l.startsWith(name)) ?? ''
    expect(row('node ≥ 22')).toMatch(/^node ≥ 22\s+pass\s+pass$/)
    expect(row('mcp scope')).toMatch(/^mcp scope\s+warn\s+n\/a$/)
    expect(row('codex hook plugins')).toMatch(/^codex hook plugins\s+n\/a\s+fail$/)
  })

  it('cell 7 — a per-host summary row closes the table', () => {
    expect(lines.find((l) => l.startsWith('summary'))).toMatch(/^summary\s+warn\s+fail$/)
  })

  it('cell 8 — columns are aligned: every data row starts its host columns at the same offset', () => {
    const rows = lines.filter((l) => /^(check|node|mcp|codex hook|summary)/.test(l))
    const offsets = rows.map((l) => l.search(/\S+$/))
    expect(new Set(offsets).size).toBe(1)
  })

  it('cell 9 — the caller-supplied legend closes the output verbatim, after a blank line', () => {
    expect(lines.at(-1)).toBe(LEGEND.slice(1))
    expect(lines.at(-2)).toBe('')
  })

  it('cell 10 — no trailing whitespace on any line (padding is trimmed)', () => {
    for (const l of lines) expect(l).toBe(l.trimEnd())
  })
})
