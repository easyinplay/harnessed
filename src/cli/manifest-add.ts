// Phase 2.3 W3 T3.1 — `harnessed manifest-add` EE-5 5Q merge gate (D-03 BOTH).
// Sister: execute-task.ts + research.ts; H1 gate. Storage: Path A sibling
// manifests/<category>/<name>.ee5-answers.json (S2 fix — no provenance schema bump).
import { writeFileSync } from 'node:fs'
import { stdin, stdout } from 'node:process'
import * as readline from 'node:readline/promises'
import type { Command } from 'commander'
import { validateNonInteractiveFlags } from './lib/validateFlags.js'

const QA: readonly { q: string; f: string }[] = [
  { q: '① 是真 reusable surface 还是临时 wrapper?', f: 'q1_reusable_surface' },
  { q: '② 上游名字 fit 项目 shape 吗? 有现有命名冲突吗?', f: 'q2_name_fit' },
  { q: '③ 与已装配组件有 overlap surface 吗?', f: 'q3_overlap' },
  { q: '④ 是 import 概念 (可控) 还是 import 别人产品身份 (高耦合)?', f: 'q4_concept_vs_identity' },
  { q: '⑤ user 不知 upstream 还能理解该装配吗?', f: 'q5_user_understanding' },
] as const

interface RawOpts {
  category?: string
  name?: string
  apply?: boolean
  dryRun?: boolean
  nonInteractive?: boolean
}

function basename(upstream: string): string {
  return (upstream.split('/').pop() ?? upstream).replace(/\.git$/, '')
}

export function registerManifestAdd(program: Command): void {
  program
    .command('manifest-add <upstream>')
    .description(
      'Add a new upstream adapter (EE-5 5-question merge gate; immediate by default — use --dry-run for preview)',
    )
    .option('--category <cat>', 'manifest category (skill-packs | tools)', 'skill-packs')
    .option('--name <name>', 'short adapter name (defaults to <upstream> basename)')
    .option(
      '--apply',
      '(deprecated; kept for backward compat — manifest-add persists immediately by default)',
    )
    .option('--dry-run', 'preview only — do not write JSON (opt-in for advanced users)')
    .option('--non-interactive', 'CI/scripts — requires --apply or --dry-run; WARN-only dry-run')
    .action(async (upstream: string, raw: RawOpts) => {
      validateNonInteractiveFlags(raw, 'manifest-add <upstream>')
      const name = raw.name ?? basename(upstream)
      const category = raw.category ?? 'skill-packs'
      const outPath = `manifests/${category}/${name}.ee5-answers.json`
      if (raw.nonInteractive) {
        console.warn(
          '[ee-5-gate] WARN: --non-interactive skips 5-question prompt (D-03 dry-run-only). plan-phase hard reject still applies.',
        )
        console.log(`[manifest-add] dry-run preview for upstream: ${upstream} → ${outPath}`)
        process.exit(0)
      }
      const rl = readline.createInterface({ input: stdin, output: stdout })
      const payload: Record<string, string> = {
        upstream,
        created_at: new Date().toISOString(),
        author: process.env.USER ?? process.env.USERNAME ?? 'unknown',
      }
      for (const { q, f } of QA) {
        const a = (await rl.question(`${q}\n> `)).trim()
        if (!a) {
          console.error('error: EE-5 gate requires non-empty answer')
          rl.close()
          process.exit(1)
        }
        payload[f] = a
      }
      rl.close()
      // v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
      const dryRun = raw.dryRun === true
      if (!dryRun) {
        writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
        console.log(`[manifest-add] EE-5 gate passed; wrote ${outPath}`)
      } else {
        console.log(`[manifest-add] EE-5 gate passed (dry-run); would write ${outPath}`)
        console.log(JSON.stringify(payload, null, 2))
      }
      process.exit(0)
    })
}
