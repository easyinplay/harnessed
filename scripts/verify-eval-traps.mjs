#!/usr/bin/env node
// scripts/verify-eval-traps.mjs — ONE-SHOT mutation acceptance for the eval
// trap suite (4.31.0 Slice A, E3 ruling: local-only, NOT wired into CI).
//
// Proves the traps actually catch their incidents: for each historical fix
// commit, build a throwaway worktree with the fix REMOVED (git revert
// --no-commit; on conflict fall back to a minimal bug-reintroduction patch —
// checkpoint.ts/gates.ts have been rewritten since, so conflicts are expected
// per the CEO-plan fallback clause), rebuild dist there, run the eval suite
// against the MAIN repo's fixtures, and assert the paired scenarios go RED.
//
// Usage: node scripts/verify-eval-traps.mjs
// Exit 0 = every trap proved effective; non-zero = a trap failed to fire.

import { execSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const MAIN = resolve(import.meta.dirname, '..')
const FIXTURES = join(MAIN, 'fixtures', 'eval')

/** The eval layer itself must come from the CURRENT tree (it may be newer than
 *  HEAD — e.g. uncommitted during Slice A development). Overlaying is harmless
 *  once committed (copies identical files); the MUTATION only ever touches
 *  engine files, never these. */
const EVAL_OVERLAY = ['src/eval', 'src/cli/evalCmd.ts', 'src/cli.ts', 'src/cli/lib/runDeps.ts']

/** Minimal bug-reintroduction patches (fallback when revert conflicts).
 *  Each reproduces the ESSENCE of the pre-fix defect with a surgical edit;
 *  the exact patch text is archived in the phase findings.md as evidence. */
const CASES = [
  {
    fix: '6e244b5',
    label: '4.23.2 — undefined-variable fail-closed + skip-sub alias',
    scenarios: ['issue5-undefined-variable', 'issue5-skip-sub-alias'],
    reintroduce: [
      {
        file: 'src/workflow/exprBuilder.ts',
        // Neuter the discriminator → undefined-variable degrades to the generic
        // eval error → ADR 0029 fail-soft fires the sub again (the incident).
        find: 'export function isUndefinedVariableError(',
        replace:
          'export function isUndefinedVariableError(..._ignored: unknown[]): boolean { return false }\nfunction _unusedIsUndefinedVariableError(',
      },
      {
        file: 'src/workflow/skipSubs.ts',
        // Neuter alias matching → slash-name skips silently miss (the incident).
        find: 'export function matchSkipSub(',
        replace:
          'export function matchSkipSub(requested: Set<string>, sub: string, _master: string): string | null { return requested.has(sub) ? sub : null }\nfunction _unusedMatchSkipSub(',
      },
    ],
  },
  {
    fix: '37605a7',
    label: '4.26.0 — serial-order guard',
    scenarios: ['serial-order-guard'],
    reintroduce: [
      {
        file: 'src/checkpoint/ledger.ts',
        // Neuter the guard → out-of-order completes pass silently (pre-4.26.0).
        find: 'export function findSerialBlockers(',
        replace:
          'export function findSerialBlockers(..._ignored: unknown[]): string[] { return [] }\nfunction _unusedFindSerialBlockers(',
      },
    ],
  },
]

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })
}

let failures = 0
const report = []

for (const c of CASES) {
  const wt = mkdtempSync(join(tmpdir(), 'eval-mutation-'))
  let mode = 'revert'
  try {
    sh(`git worktree add --detach "${wt}" HEAD`, { cwd: MAIN })
    // Share node_modules (pnpm layout resolves within the store just fine for tsup).
    symlinkSync(join(MAIN, 'node_modules'), join(wt, 'node_modules'), 'junction')
    for (const rel of EVAL_OVERLAY) {
      cpSync(join(MAIN, rel), join(wt, rel), { recursive: true, force: true })
    }

    try {
      sh(`git revert --no-commit ${c.fix}`, { cwd: wt })
    } catch {
      try {
        sh('git revert --abort', { cwd: wt })
      } catch {
        /* no revert in progress */
      }
      mode = 'reintroduce-patch'
      for (const p of c.reintroduce) {
        const path = join(wt, p.file)
        const src = readFileSync(path, 'utf8')
        if (!src.includes(p.find)) throw new Error(`reintroduction anchor missing: ${p.file}`)
        writeFileSync(path, src.replace(p.find, p.replace), 'utf8')
      }
    }

    sh('corepack pnpm build', { cwd: wt })

    for (const name of c.scenarios) {
      let red = false
      let out = ''
      try {
        out = sh(`node "${join(wt, 'dist', 'cli.mjs')}" eval --dir "${FIXTURES}" --filter ${name}`)
      } catch (e) {
        out = `${e.stdout ?? ''}${e.stderr ?? ''}`
        red = true
      }
      // Script-level fault (eval command missing / crashed before running the
      // suite) must fail LOUDLY as harness error, not masquerade as a verdict.
      if (/unknown command/i.test(out) || !/pass \d+ \/ fail \d+/.test(out)) {
        throw new Error(`eval harness fault for ${name}: ${out.slice(0, 300)}`)
      }
      const failed = red && /\bFAIL\b|\bERROR\b/.test(out)
      report.push(
        `${failed ? 'TRAP-EFFECTIVE' : 'TRAP-MISSED  '} ${name}  (fix ${c.fix} removed via ${mode})`,
      )
      if (!failed) failures++
    }
  } finally {
    try {
      if (existsSync(join(wt, 'node_modules'))) rmSync(join(wt, 'node_modules'))
    } catch {
      /* junction removal best-effort */
    }
    try {
      sh(`git worktree remove --force "${wt}"`, { cwd: MAIN })
    } catch {
      rmSync(wt, { recursive: true, force: true })
    }
  }
}

console.log('\n=== eval trap mutation acceptance ===')
for (const line of report) console.log(`  ${line}`)
console.log(failures === 0 ? '\nall traps proved effective' : `\n${failures} trap(s) MISSED`)
process.exit(failures === 0 ? 0 : 1)
