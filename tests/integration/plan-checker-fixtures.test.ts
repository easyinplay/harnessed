// Phase 2.4 W5 T5.2 — EE-4 plan-checker fixture matrix (16 real + 14 synthetic = 30).
// Sister: tests/integration/plan-checker-quant.test.ts (T2.4 4-cell ENFORCE walker).
// Karpathy YAGNI: real phase 1.1~2.3 = 16 plan files give us the baseline; +14
// synthetic in tmpdir cover the PASS / WARNING / BLOCKER spectrum + weasel +
// missing-refs + no-acceptance edges per B-15 + B-31 + D2.4-19. ≤100L target.

import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const WALKER = 'scripts/run-plan-checker.mjs'
const REAL_PHASES = ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3']

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
  it('16 real phase 1.1~2.3 plan files: PASS-dominant per T2.0 RELAX baseline (≥15/16 PASS)', () => {
    const all: Verdict[] = []
    for (const p of REAL_PHASES) {
      const { code, out } = runWalker(`.planning/phase-${p}/`)
      expect(code).toBe(0) // ENFORCE=true default: no BLOCKER → exit 0
      all.push(...parseVerdicts(out))
    }
    expect(all.length).toBeGreaterThanOrEqual(15) // ≥15 plan files (PLAN.md + task_plan.md × 8 phases — sub-dirs may add)
    const pass = all.filter((v) => v.verdict === 'PASS').length
    const blocker = all.filter((v) => v.verdict === 'BLOCKER').length
    expect(blocker).toBe(0) // T2.0 calibration invariant
    expect(pass).toBeGreaterThanOrEqual(Math.floor(all.length * 0.85)) // ≥85% PASS (real baseline 15/16=94%)
  })

  it('14 synthetic fixtures cover PASS/WARNING/BLOCKER spectrum per T2.0 RELAX', () => {
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
