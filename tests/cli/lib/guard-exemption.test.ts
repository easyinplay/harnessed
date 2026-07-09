// 4.22.2 T1/T3 — GateGuard `.gateguard.yml` exemption auto-fix (TDD red-first).
//
// gateguard-ai (full package) documents `ignore_paths` in `.gateguard.yml`
// (upstream README). harnessed offers a consented auto-fix appending
// `.planning/**` — default YES (user decision 2026-07-05: narrow scope,
// backed-up, the only config where both guards work as designed), refusal path
// must be LOUD (3 concrete consequences + the exact manual command).
//
// Text-level append only (4.16.0 messages-json lesson: never re-serialize a
// user-owned config wholesale — comments and formatting must survive).

import { describe, expect, it, vi } from 'vitest'
import {
  applyExemption,
  findGateguardYml,
  MANUAL_FIX_CMD,
  PLANNING_GLOB,
  planExemption,
  refusalLines,
  runExemptionFlow,
} from '../../../src/cli/lib/guard-exemption.js'

describe('planExemption (idempotent text-level append)', () => {
  it('skip when .planning/** already present', () => {
    const raw = 'enabled: true\nignore_paths:\n  - ".venv/**"\n  - ".planning/**"\n'
    expect(planExemption(raw).action).toBe('skip')
  })

  it('skip on single-quoted existing entry', () => {
    const raw = "ignore_paths:\n  - '.planning/**'\n"
    expect(planExemption(raw).action).toBe('skip')
  })

  it('append-entry right after an existing ignore_paths header, preserving comments', () => {
    const raw =
      '# my config\nenabled: true\n\nignore_paths:\n  # deps\n  - ".venv/**"\n  - "node_modules/**"\n'
    const plan = planExemption(raw)
    expect(plan.action).toBe('append-entry')
    const text = plan.newText ?? ''
    // inserted immediately after the header line (list order is semantically free)
    expect(text).toContain(`ignore_paths:\n  - "${PLANNING_GLOB}"\n  # deps\n`)
    // untouched surroundings survive verbatim
    expect(text).toContain('# my config\nenabled: true\n')
    expect(text).toContain('  - "node_modules/**"\n')
  })

  it('append-section at EOF when no ignore_paths exists', () => {
    const raw = 'enabled: true\ngates:\n  read_before_edit: true\n'
    const plan = planExemption(raw)
    expect(plan.action).toBe('append-section')
    expect(plan.newText).toBe(`${raw}\nignore_paths:\n  - "${PLANNING_GLOB}"\n`)
  })

  it('preserves CRLF line endings when the file uses them', () => {
    const raw = 'enabled: true\r\nignore_paths:\r\n  - ".venv/**"\r\n'
    const plan = planExemption(raw)
    expect(plan.action).toBe('append-entry')
    expect(plan.newText).toContain(`ignore_paths:\r\n  - "${PLANNING_GLOB}"\r\n`)
    expect(plan.newText).not.toMatch(/[^\r]\n/)
  })
})

describe('findGateguardYml (cwd first, then home)', () => {
  const deps = (existing: string[]) => ({
    cwd: '/proj',
    home: '/home/u',
    exists: async (p: string) => existing.includes(p.replace(/\\/g, '/')),
  })

  it('cwd wins over home', async () => {
    const p = await findGateguardYml(deps(['/proj/.gateguard.yml', '/home/u/.gateguard.yml']))
    expect((p ?? '').replace(/\\/g, '/')).toBe('/proj/.gateguard.yml')
  })

  it('falls back to home', async () => {
    const p = await findGateguardYml(deps(['/home/u/.gateguard.yml']))
    expect((p ?? '').replace(/\\/g, '/')).toBe('/home/u/.gateguard.yml')
  })

  it('null when neither exists', async () => {
    expect(await findGateguardYml(deps([]))).toBeNull()
  })
})

describe('refusalLines (D3 — loud decline)', () => {
  it('carries the three concrete consequences and the exact manual command', () => {
    const block = refusalLines().join('\n')
    expect(block).toMatch(/⚠/)
    expect(block).toMatch(/qa-report\.md/) // verify-stage artifacts named concretely
    expect(block).toMatch(/subagent/i) // no fact-retry channel consequence
    expect(block).toContain(MANUAL_FIX_CMD) // exact manual fix command
    expect(block).toMatch(/doctor/) // doctor keeps warning until resolved
  })
})

describe('applyExemption (backup first, append only)', () => {
  const mkDeps = (raw: string) => {
    const writes: Array<{ path: string; text: string }> = []
    const backups: string[] = []
    return {
      writes,
      backups,
      deps: {
        readFile: async () => raw,
        writeFile: async (p: string, text: string) => {
          writes.push({ path: p, text })
        },
        backup: async (_raw: string) => {
          backups.push('B')
          return { status: 'ok' as const, path: '/backups/gateguard.yml.bak' }
        },
      },
    }
  }

  it('applies: backup happens before write, file gets the appended glob', async () => {
    const h = mkDeps('ignore_paths:\n  - ".venv/**"\n')
    const r = await applyExemption('/proj/.gateguard.yml', h.deps)
    expect(r.status).toBe('applied')
    expect(h.backups.length).toBe(1)
    expect(h.writes.length).toBe(1)
    expect(h.writes[0]?.text).toContain(PLANNING_GLOB)
    if (r.status === 'applied') expect(r.backupPath).toBe('/backups/gateguard.yml.bak')
  })

  it('already: no backup, no write', async () => {
    const h = mkDeps(`ignore_paths:\n  - "${PLANNING_GLOB}"\n`)
    const r = await applyExemption('/proj/.gateguard.yml', h.deps)
    expect(r.status).toBe('already')
    expect(h.backups.length).toBe(0)
    expect(h.writes.length).toBe(0)
  })
})

describe('runExemptionFlow (interactive confirm default YES)', () => {
  const flowDeps = (raw: string) => {
    const printed: string[] = []
    const writes: string[] = []
    return {
      printed,
      writes,
      deps: {
        findYml: async () => '/proj/.gateguard.yml',
        readFile: async () => raw,
        writeFile: async (_p: string, text: string) => {
          writes.push(text)
        },
        backup: async () => ({ status: 'ok' as const, path: '/b/gg.bak' }),
        print: (line: string) => {
          printed.push(line)
        },
      },
    }
  }

  it('confirm=yes → applied; preview shows exact diff line + target + backup before consent', async () => {
    const h = flowDeps('enabled: true\n')
    const confirm = vi.fn(async () => true)
    const r = await runExemptionFlow({ confirm, ...h.deps })
    expect(r).toBe('applied')
    expect(confirm).toHaveBeenCalledOnce()
    const beforeConsent = h.printed.join('\n')
    expect(beforeConsent).toContain(`+   - "${PLANNING_GLOB}"`)
    expect(beforeConsent).toContain('/proj/.gateguard.yml')
    expect(h.writes.length).toBe(1)
  })

  it('confirm=no → declined + loud refusal block printed, nothing written', async () => {
    const h = flowDeps('enabled: true\n')
    const r = await runExemptionFlow({ confirm: async () => false, ...h.deps })
    expect(r).toBe('declined')
    expect(h.writes.length).toBe(0)
    expect(h.printed.join('\n')).toContain(MANUAL_FIX_CMD)
  })

  it('no confirm fn (non-interactive) → advises manual command, nothing written', async () => {
    const h = flowDeps('enabled: true\n')
    const r = await runExemptionFlow({ ...h.deps })
    expect(r).toBe('advised')
    expect(h.writes.length).toBe(0)
    expect(h.printed.join('\n')).toContain(MANUAL_FIX_CMD)
  })

  it('already exempt → already, quiet (no refusal block)', async () => {
    const h = flowDeps(`ignore_paths:\n  - "${PLANNING_GLOB}"\n`)
    const r = await runExemptionFlow({ confirm: async () => true, ...h.deps })
    expect(r).toBe('already')
    expect(h.writes.length).toBe(0)
  })

  it('no yml found → no-yml (caller falls back to variant wording)', async () => {
    const printed: string[] = []
    const r = await runExemptionFlow({
      findYml: async () => null,
      readFile: async () => '',
      writeFile: async () => {},
      backup: async () => ({ status: 'ok' as const, path: '' }),
      print: (l: string) => {
        printed.push(l)
      },
    })
    expect(r).toBe('no-yml')
  })
})
