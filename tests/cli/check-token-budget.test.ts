// Phase 3.4 W1 T1.3 — check-token-budget.ts PRIMARY helper functional fixtures
// (5 cells). Sister Phase 3.3 W1 T1.12 check-deprecations.test.ts 5-fixture
// pattern 100% reuse + tmpdir cwd switch + vi.resetModules per-fixture isolation.
// estimateTokens NOT mocked — uses real Buffer.byteLength /4 per D-03 sister
// Phase 3.1 D-01 precedent zero-dep verify.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origCwd: string
let origHome: string | undefined

beforeEach(() => {
  origCwd = process.cwd()
  origHome = process.env.HOME
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-tb-'))
  // Redirect homedir() lookup to tmp via HOME env (Node.js os.homedir() reads HOME first)
  mkdirSync(join(tmpRoot, 'home', '.claude', 'skills'), { recursive: true })
  mkdirSync(join(tmpRoot, 'cwd', 'skills'), { recursive: true })
  process.env.HOME = join(tmpRoot, 'home')
  process.env.USERPROFILE = join(tmpRoot, 'home') // Windows homedir fallback
  process.chdir(join(tmpRoot, 'cwd'))
  vi.resetModules()
})

afterEach(() => {
  process.chdir(origCwd)
  if (origHome === undefined) delete process.env.HOME
  else process.env.HOME = origHome
  rmSync(tmpRoot, { recursive: true, force: true })
})

function writeSkill(root: 'home' | 'cwd', name: string, description: string): void {
  const skillsRoot =
    root === 'home' ? join(tmpRoot, 'home', '.claude', 'skills') : join(tmpRoot, 'cwd', 'skills')
  mkdirSync(join(skillsRoot, name), { recursive: true })
  writeFileSync(
    join(skillsRoot, name, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\nbody\n`,
    'utf8',
  )
}

describe('checkTokenBudget — D-03 BUFFER /4 + D-04 DOCTOR WARN (T1.3 fixtures 1-5)', () => {
  it('1. skills/ dirs missing → status=pass + message contains 0 tokens', async () => {
    // Remove both skills dirs so existsSync returns false at both roots
    rmSync(join(tmpRoot, 'home', '.claude', 'skills'), { recursive: true, force: true })
    rmSync(join(tmpRoot, 'cwd', 'skills'), { recursive: true, force: true })
    const { checkTokenBudget } = await import('../../src/cli/lib/check-token-budget.js')
    const r = checkTokenBudget()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/0 tokens/)
  })

  it('2. 1 skill ~100 chars → status=pass + total ≤ 2000', async () => {
    writeSkill('home', 'skill-a', 'A'.repeat(100))
    const { checkTokenBudget } = await import('../../src/cli/lib/check-token-budget.js')
    const r = checkTokenBudget()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/under 1% \/ 2000 threshold/)
  })

  it('3. 50 skills × 100 chars → status=pass under threshold', async () => {
    // 50 skills × 100 chars desc = ~5000 bytes / 4 = ~1250 tokens (under 2000)
    for (let i = 0; i < 50; i++) writeSkill('home', `skill-${i}`, 'X'.repeat(100))
    const { checkTokenBudget } = await import('../../src/cli/lib/check-token-budget.js')
    const r = checkTokenBudget()
    expect(r.status).toBe('pass')
  })

  it('4. 50 skills × 200 chars → status=warn + per-skill top + % of 200000 format', async () => {
    // 50 × 200 chars desc = 10000 bytes / 4 = 2500 tokens (over 2000 threshold)
    for (let i = 0; i < 50; i++) writeSkill('home', `skill-${i}`, 'Y'.repeat(200))
    const { checkTokenBudget } = await import('../../src/cli/lib/check-token-budget.js')
    const r = checkTokenBudget()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/% of 200000/)
    expect(r.message).toMatch(/top:/)
    expect(r.fix).toMatch(/shorten verbose|per-skill > 5000/)
  })

  it('5. 1 skill with 25000 char description (>5000 token per-skill) → status=warn + D-04 lock', async () => {
    // 25000 chars / 4 = 6250 tokens > 5000 PER_SKILL_THRESHOLD
    writeSkill('home', 'huge-skill', 'Z'.repeat(25000))
    const { checkTokenBudget } = await import('../../src/cli/lib/check-token-budget.js')
    const r = checkTokenBudget()
    expect(r.status).toBe('warn') // D-04 literal verify — NEVER 'fail'
    expect(['pass', 'warn']).toContain(r.status)
    expect(r.message).toMatch(/huge-skill/)
  })
})
