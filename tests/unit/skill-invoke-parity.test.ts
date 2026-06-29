// issue #1 + issue #2 anti-drift guard for SKILL "How to invoke" sections.
//
// issue #1 (negative invariant): no SKILL.md / SKILL.zh-Hans.md may instruct the
// deprecated `harnessed run <name>` invocation. `harnessed run` is the CI/headless
// path (in-process nested SDK spawn that hangs inside Claude Code); SKILL files
// must drive the CC-native `/<name>` flow instead. The pattern matches the ACTUAL
// footgun (piped or `--task-stdin`), NOT the cautionary "Do NOT pipe to
// `harnessed run <name>`" prose the CC-native section legitimately contains.
//
// issue #2 (positive invariant — Trellis-style): the injected SKILL is the thing
// the agent reads when a `/auto`-style command fires, so its "How to invoke"
// section must carry the EXECUTABLE state-machine steps inline, not a cross-file
// pointer. Per body type (orchestrator / execution / interactive — same sets as
// src/cli/lib/generateCommands.ts) the section must contain the corresponding
// engine tokens so a freestyle re-derivation cannot silently bypass the engine
// (no ledger / no evidence guard / no recovery). en AND zh both enforced.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const WORKFLOWS = resolve(process.cwd(), 'workflows')
const FOOTGUN = /(\|\s*harnessed run [a-z][\w-]*|harnessed run [a-z][\w-]* --task-stdin)/

// Same membership sets as generateCommands.ts (INTERACTIVE_COMMANDS /
// ORCHESTRATOR_COMMANDS) — everything else is EXECUTION.
const INTERACTIVE = new Set([
  'discuss',
  'discuss-strategic',
  'discuss-phase',
  'discuss-subtask',
  'task-clarify',
])
const ORCHESTRATOR = new Set(['auto', 'plan', 'task', 'verify', 'ship'])

/** Engine tokens that MUST appear inline in the invoke section, per body type. */
const REQUIRED_TOKENS: Record<string, string[]> = {
  orchestrator: [
    'harnessed gates',
    'harnessed checkpoint start',
    'harnessed prompt',
    'harnessed checkpoint complete',
    'harnessed status --recover',
  ],
  execution: ['harnessed prompt', 'harnessed checkpoint complete'],
  interactive: [],
}

const MARKER_RX = /<!--\s*harnessed-generated:v\d+\.\d+\.\d+\s*-->/

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

/** Map a posix-relative SKILL path → flatName (mirrors flatNameFor in the script). */
function flatNameFor(relPath: string): string {
  const parts = relPath.split('/')
  parts.pop() // drop SKILL*.md filename
  if (parts.length === 1) return parts[0] ?? ''
  const stage = parts[0] ?? ''
  const sub = parts[1] ?? ''
  return sub === 'auto' ? stage : `${stage}-${sub}`
}

function bodyType(name: string): 'orchestrator' | 'execution' | 'interactive' {
  if (INTERACTIVE.has(name)) return 'interactive'
  if (ORCHESTRATOR.has(name)) return 'orchestrator'
  return 'execution'
}

/** Extract the invoke section by anchoring on the harnessed marker: the `## `
 *  heading preceding the marker → the next `## ` heading (or EOF). Returns null
 *  when no marker is present (= no inlined invoke section). */
function invokeSection(content: string): string | null {
  const mm = MARKER_RX.exec(content)
  if (!mm) return null
  const headings = [...content.matchAll(/^## .*$/gm)]
  let start = -1
  let end = content.length
  for (const h of headings) {
    if ((h.index ?? 0) <= mm.index) start = h.index ?? 0
    else {
      end = h.index ?? content.length
      break
    }
  }
  if (start < 0) return null
  return content.slice(start, end)
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

describe('SKILL invoke inlining — executable state machine present (issue #2)', () => {
  const files = collectSkillFiles(WORKFLOWS)

  for (const file of files) {
    const rel = file.slice(WORKFLOWS.length + 1).replace(/\\/g, '/')
    const name = flatNameFor(rel)
    const type = bodyType(name)

    it(`${rel} (${type}) — invoke section is inlined with the marker`, () => {
      const content = readFileSync(file, 'utf8')
      const section = invokeSection(content)
      expect(section, `no marker-anchored invoke section in ${rel}`).not.toBeNull()
      expect((section as string).trim().length).toBeGreaterThan(0)
    })

    it(`${rel} (${type}) — carries the required engine tokens inline`, () => {
      const content = readFileSync(file, 'utf8')
      const section = invokeSection(content) ?? ''
      for (const token of REQUIRED_TOKENS[type] ?? []) {
        expect(
          section.includes(token),
          `${rel} (${type}) invoke section missing engine token "${token}"`,
        ).toBe(true)
      }
      if (type === 'interactive') {
        // No engine tokens required, but it must still drive clarification.
        expect(
          /clarif|澄清/i.test(section),
          `${rel} (interactive) invoke section lacks clarification semantics`,
        ).toBe(true)
      }
    })
  }
})
