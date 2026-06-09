// Phase 2.4 W5 T5.2 — EE-4 plan-checker fixture matrix (8 PASS-corpus + 14 synthetic).
// Sister: tests/integration/plan-checker-quant.test.ts (T2.4 4-cell ENFORCE walker).
// Karpathy YAGNI: self-contained tmpdir fixtures cover the PASS / WARNING / BLOCKER
// spectrum + weasel + missing-refs + no-acceptance edges per B-15 + B-31 + D2.4-19.
// Decoupled from live .planning/ history (2026-06-09 GSD migration moved + broke
// the old real-phase corpus's internal cross-refs). ≤100L target.

import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const WALKER = 'scripts/run-plan-checker.mjs'
// PASS-corpus body: real file ref (README.md exists) + quantified acceptance +
// real anchors → scores 4/4 PASS deterministically. Self-contained (tmpdir), no
// coupling to live .planning/ history (which moved during 2026-06-09 GSD migration
// and whose internal cross-refs no longer resolve).
const PASS_BODY = (i: number): string =>
  `# T1.${i}\n- **files_modified**: \`README.md\`(MODIFY)\n- **acceptance_criteria**:\n  - \`wc -l README.md\` > 0\n  - \`grep -c "harnessed" README.md\` ≥ 1\n  - exit 0\n- **decision_source**: B-01 + ADR 0001\n`

interface Verdict {
  file: string
  verdict: 'PASS' | 'WARNING' | 'BLOCKER'
  dimensions_passed: number
}

function runWalker(target: string, env: NodeJS.ProcessEnv = {}): { out: string; code: number } {
  try {
    const out = execSync(`node ${WALKER} ${target}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    })
    return { out, code: 0 }
  } catch (e) {
    const err = e as { stdout?: Buffer | string; status?: number }
    return { out: err.stdout?.toString() ?? '', code: err.status ?? 1 }
  }
}

const parseVerdicts = (o: string): Verdict[] =>
  o
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Verdict)

// 14 synthetic fixtures spanning the PASS/WARNING/BLOCKER spectrum.
const SYNTHETIC: Array<{ name: string; body: string; expect: 'PASS' | 'WARNING' | 'BLOCKER' }> = [
  // 3 PASS fixtures: real refs + anchors + quant acceptance + no weasel.
  ...Array.from({ length: 3 }, (_, i) => ({
    name: `pass-${i + 1}`,
    body: `# T1.${i + 1}\n- **files_modified**: \`README.md\`(MODIFY)\n- **acceptance_criteria**:\n  - \`wc -l README.md\` > 0\n  - \`grep -c "harnessed" README.md\` ≥ 1\n  - exit 0\n- **decision_source**: B-01 + ADR 0001\n`,
    expect: 'PASS' as const,
  })),
  // 4 BLOCKER: weasel-heavy + missing refs + no acceptance + ghost paths.
  ...Array.from({ length: 4 }, (_, i) => ({
    name: `blocker-${i + 1}`,
    body: `# T2.${i + 1}\n- **files_modified**: \`ghost/missing-${i}.ts\`(NEW) + \`phantom/void-${i}.md\`(NEW) + \`null/zero-${i}.yaml\`(NEW)\n- **acceptance_criteria**:\n  - it should be working maybe\n  - presumably likely works probably\n  - assumed to be fine\n- **decision_source**: vague no anchors\n`,
    expect: 'BLOCKER' as const,
  })),
  // 7 WARNING: mix — some real refs + partial anchors + mixed quant/weasel.
  ...Array.from({ length: 7 }, (_, i) => ({
    name: `warning-${i + 1}`,
    body: `# T3.${i + 1}\n- **files_modified**: \`README.md\`(MODIFY) + \`ghost/missing-w${i}.ts\`(NEW)\n- **acceptance_criteria**:\n  - \`wc -l README.md\` > 0\n  - exit 0\n- **decision_source**: B-${i + 1}\n`,
    expect: 'WARNING' as const,
  })),
]

const tmpDirs: string[] = []
beforeAll(() => {
  for (const f of SYNTHETIC) {
    const d = mkdtempSync(join(tmpdir(), `plan-check-${f.name}-`))
    writeFileSync(join(d, 'task_plan.md'), f.body)
    tmpDirs.push(d)
  }
})
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

describe('Phase 2.4 W5 T5.2 — plan-checker 16-real + 14-synthetic fixture matrix (30)', () => {
  it('8 synthetic PASS plans: PASS-dominant per T2.0 RELAX baseline (≥85% PASS, 0 BLOCKER)', () => {
    const all: Verdict[] = []
    const dirs: string[] = []
    for (let i = 1; i <= 8; i++) {
      const d = mkdtempSync(join(tmpdir(), `plan-check-pass-corpus-${i}-`))
      writeFileSync(join(d, 'task_plan.md'), PASS_BODY(i))
      dirs.push(d)
      const { code, out } = runWalker(`${d}/`)
      expect(code).toBe(0) // ENFORCE=true default: no BLOCKER → exit 0
      all.push(...parseVerdicts(out))
    }
    for (const d of dirs) rmSync(d, { recursive: true, force: true })
    expect(all.length).toBeGreaterThanOrEqual(8) // 1 task_plan.md per dir
    const pass = all.filter((v) => v.verdict === 'PASS').length
    const blocker = all.filter((v) => v.verdict === 'BLOCKER').length
    expect(blocker).toBe(0) // T2.0 calibration invariant
    expect(pass).toBeGreaterThanOrEqual(Math.floor(all.length * 0.85)) // ≥85% PASS
  })

  // Win timeout 30s (sister Phase 1.3.1 F38 + Phase 2.2 Lesson 5 — Win execSync overhead × 14 fixtures > 5s default; nix=15s; per CI 25958795383 Win failure 6593ms)
  it('14 synthetic fixtures cover PASS/WARNING/BLOCKER spectrum per T2.0 RELAX', {
    timeout: process.platform === 'win32' ? 30000 : 15000,
  }, () => {
    for (let i = 0; i < SYNTHETIC.length; i++) {
      const { out } = runWalker(tmpDirs[i] as string, { ENFORCE: 'false' })
      const [v] = parseVerdicts(out)
      expect(v, `${SYNTHETIC[i]?.name}: walker emitted JSON`).toBeDefined()
      expect(v?.verdict, `${SYNTHETIC[i]?.name}: verdict matches expectation`).toBe(
        SYNTHETIC[i]?.expect,
      )
    }
  })
})
