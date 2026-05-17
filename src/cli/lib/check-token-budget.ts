// Phase 3.4 W1 T1.1 — D-03 BUFFER /4 + D-04 DOCTOR WARN PRIMARY helper. Sister
// Phase 3.3 W1 T1.6 check-deprecations.ts 43L. Scans ~/.claude/skills + repo
// skills/ SKILL.md frontmatter description tokens via Phase 3.1 D-01
// estimateTokens (Buffer.byteLength /4 zero-dep heuristic). Karpathy ≤40L hard.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { estimateTokens } from '../../checkpoint/template.js'
import type { CheckResult } from './check-deprecations.js'

const CONTEXT_WINDOW_TOKENS = 200_000
const TOTAL_THRESHOLD = 2_000 // 1% of 200k
const PER_SKILL_THRESHOLD = 5_000

function scanSkillsDir(root: string): { name: string; tokens: number }[] {
  if (!existsSync(root)) return []
  return readdirSync(root).flatMap((name) => {
    const md = join(root, name, 'SKILL.md')
    if (!existsSync(md)) return []
    const fm = readFileSync(md, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
    const desc = fm.match(/^description:\s*(.+)$/m)?.[1] ?? ''
    return [{ name, tokens: estimateTokens(desc) }]
  })
}

export function checkTokenBudget(): CheckResult {
  const roots = [join(homedir(), '.claude', 'skills'), join(process.cwd(), 'skills')]
  const items = roots.flatMap(scanSkillsDir)
  const total = items.reduce((s, i) => s + i.tokens, 0)
  const over = items.filter((i) => i.tokens > PER_SKILL_THRESHOLD).length
  if (total <= TOTAL_THRESHOLD && over === 0) {
    const msg = `${items.length} skill(s) total ${total} tokens (under 1% / 2000 threshold)`
    return { name: 'token budget', status: 'pass', message: msg }
  }
  const top = [...items]
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 3)
    .map((t) => `${t.name}:${t.tokens}`)
    .join(', ')
  const pct = ((total / CONTEXT_WINDOW_TOKENS) * 100).toFixed(2)
  const message = `${items.length} skill(s) total ${total} tokens (${pct}% of 200000) — top: ${top}`
  return {
    name: 'token budget',
    status: 'warn',
    message,
    fix: 'shorten verbose skill descriptions OR review per-skill > 5000 tokens',
  }
}
