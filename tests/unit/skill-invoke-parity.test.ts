// issue #1 anti-drift guard — no SKILL.md / SKILL.zh-Hans.md may instruct the
// deprecated `harnessed run <name>` invocation in its "How to invoke" section.
// `harnessed run` is the CI/headless path (in-process nested SDK spawn that hangs
// inside Claude Code); SKILL files must drive the CC-native `/<name>` slash
// command instead. This test is the durable parity guard that prevents the v4.0
// command-vs-SKILL drift (which caused issue #1) from recurring: if someone
// re-adds a `| harnessed run` invocation to a SKILL file, this fails.
//
// The pattern matches the ACTUAL footgun invocation (piped or `--task-stdin`),
// NOT the cautionary "Do NOT pipe to `harnessed run <name>`" prose the CC-native
// section legitimately contains.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const WORKFLOWS = resolve(process.cwd(), 'workflows')
const FOOTGUN = /(\|\s*harnessed run [a-z][\w-]*|harnessed run [a-z][\w-]* --task-stdin)/

function collectSkillFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      collectSkillFiles(p, out)
    } else if (entry === 'SKILL.md' || entry === 'SKILL.zh-Hans.md') {
      out.push(p)
    }
  }
  return out
}

describe('SKILL invoke parity — no `harnessed run` footgun (issue #1)', () => {
  const files = collectSkillFiles(WORKFLOWS)

  it('discovers a non-trivial set of SKILL files', () => {
    expect(files.length).toBeGreaterThanOrEqual(40)
  })

  for (const file of files) {
    const rel = file.slice(WORKFLOWS.length + 1).replace(/\\/g, '/')
    it(`${rel} — no piped/--task-stdin \`harnessed run\` invocation`, () => {
      const content = readFileSync(file, 'utf8')
      const m = FOOTGUN.exec(content)
      expect(m, m ? `found footgun invocation: "${m[0]}"` : '').toBeNull()
    })
  }
})
