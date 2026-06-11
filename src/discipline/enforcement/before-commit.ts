// src/discipline/enforcement/before-commit.ts — Phase v3.0-3.3 W0 T3.3.W0.9 (R30.9).
// Hook trigger: git commit / push cmd dispatch 前;ralph-loop / subagent / 主 session 全走此 hook.
// Reads operational.yaml rule[id=biome-preempt + no-push-without-approval + no-skip-hooks]
// → enforce halt OR auto-fix per yaml enforcement field.
//
// Sister src/routing/lib/fallbackHandlers.ts ≤80L split pattern.

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface CommitHookCtx {
  changedFiles: readonly string[]
  cmdArgs: readonly string[]
  packageRoot: string
  cmdType: 'git-commit' | 'git-push'
  /** Whether user has explicitly approved the operation (push gate). */
  hasUserApproval: boolean
}

const TS_JS_RE = /\.(ts|tsx|js|mjs)$/

export async function runBeforeCommitHook(ctx: CommitHookCtx): Promise<void> {
  const d = await loadDiscipline('operational', ctx.packageRoot)

  // Rule: biome-preempt — auto-fix if TS/JS files in commit
  if (ctx.cmdType === 'git-commit' && ctx.changedFiles.some((f) => TS_JS_RE.test(f))) {
    const rule = d.rules.find((r) => r.id === 'biome-preempt')
    if (rule?.auto_fix_cmd) {
      console.warn('⚠️ biome preempt — running auto-fix before commit')
      execSync(rule.auto_fix_cmd, { cwd: ctx.packageRoot, stdio: 'inherit' })
    }
  }

  // Rule: no-skip-hooks — halt if --no-verify present (no user override at hook level
  // — D-09 LOCKED, only main session bypass via user explicit cmd line invoke)
  if (ctx.cmdArgs.includes('--no-verify')) {
    console.error('❌ no-skip-hooks violated: --no-verify forbidden')
    process.exit(2)
  }

  // Rule: no-push-without-approval — halt if push + no approval
  if (ctx.cmdType === 'git-push' && !ctx.hasUserApproval) {
    console.error('❌ no-push-without-approval: user explicit approval required')
    process.exit(2)
  }

  // doc-discipline: state-digest-line-limit — halt if STATE.md exceeds 100-line digest limit.
  // Lazy-load: only load the doc-discipline yaml when STATE.md is in the commit (avoids
  // loading on non-doc commits). Basename 'doc-discipline' → workflows/disciplines/doc-discipline.yaml.
  if (ctx.changedFiles.some((f) => f.includes('.planning/STATE.md'))) {
    const docD = await loadDiscipline('doc-discipline', ctx.packageRoot)
    const rule = docD.rules.find((r) => r.id === 'state-digest-line-limit')
    if (rule?.enforcement === 'halt') {
      if (process.env.HARNESSED_ALLOW_LONG_STATE) {
        console.warn(
          '⚠️ doc-discipline: state-digest-line-limit override active (HARNESSED_ALLOW_LONG_STATE)',
        )
      } else {
        const content = readFileSync(resolve(ctx.packageRoot, '.planning/STATE.md'), 'utf8')
        const lines = content.split(/\r?\n/)
        const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
        if (lineCount > 100) {
          console.error(
            `❌ doc-discipline: STATE.md exceeds 100-line digest limit (current: ${lineCount} lines). Set HARNESSED_ALLOW_LONG_STATE=1 to override.`,
          )
          process.exit(2)
        }
      }
    }
  }
}
