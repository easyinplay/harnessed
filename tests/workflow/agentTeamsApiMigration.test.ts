// T2.4 guard — Agent Teams instruction surface must target the CURRENT platform API.
//
// Upstream fact (verified 2026-07-30 against https://code.claude.com/docs/en/agent-teams,
// "This page describes agent teams as of v2.1.178 … Claude used the `TeamCreate` and
// `TeamDelete` tools to set it up and remove it. Both tools no longer exist."):
//   - a team forms implicitly when the FIRST teammate is spawned (main session = lead);
//     there is no create step and no create tool
//   - the `team_name` input on the Agent tool "is accepted but ignored" (session-derived name)
//   - teardown = the lead asks a teammate to shut down BY NAME; the teammate approves
//     (graceful exit) or rejects with an explanation
//   - "The team's shared directories are cleaned up automatically when the session ends,
//     so there's no separate cleanup step" — no TeamDelete equivalent exists
//   - one team per session; no nested teams (a teammate cannot spawn teammates)
//
// Why a guard: a MUST-in-finally contract naming a tool that no longer exists is worse
// than no contract — the model either stalls or invents a substitute. This test pins the
// negative invariant (no dead-tool literal on the live instruction surface) plus the
// positive shape of the two migrated capability entries.
//
// Sister FORBIDDEN-literal pattern: tests/workflow/ecc-wiring.test.ts.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(process.cwd())
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

/** Tools deleted upstream in CC v2.1.178 — must not appear as an instruction. */
const FORBIDDEN = ['TeamCreate', 'TeamDelete']

/** Live instruction surface: what a model actually reads / what generates it. */
const SCAN_DIRS = ['workflows', 'src', 'scripts']
const SCAN_FILES = ['docs/WORKFLOW.md']
const SCAN_EXT = ['.ts', '.mjs', '.md', '.yaml', '.yml']

/** Historical records — immutable by doc discipline, deliberately NOT rewritten:
 *  CHANGELOG.md / docs/adr/** / .planning/** / docs/evidence/** are outside SCAN_DIRS
 *  already; this set covers files that live INSIDE the scanned dirs. */
const HISTORICAL: string[] = []

/** Files that name a deleted tool ONLY to document the migration itself — "CC 2.1.178+
 *  删除了 TeamCreate" is the opposite of instructing a model to call it. Asserted below:
 *  every occurrence sits next to explicit deletion language, so a live instruction
 *  ("call TeamCreate") cannot hide behind this allowlist. */
const MIGRATION_NOTES = ['workflows/capabilities.yaml', 'scripts/rewrite-skill-invoke-sections.mjs']

/** Deletion language that turns a mention into an erratum. */
const DELETION_LANGUAGE = /删除|无等价工具|no longer exist|DELETED|not exposed/i

/** Files carrying the dead literal that are OUTSIDE the T2.4 mandate's write scope.
 *  Each is a genuine leftover, not a false positive — drop the entry (and fix the file)
 *  in the follow-up slice that owns it. */
// 4.34.0 — both former entries are now clean and therefore scanned like everything
// else: `src/cli/lib/generateCommands.ts` (the sibling generator for
// ~/.claude/commands/<name>.md — the surface a user actually reads, migrated in
// lockstep with the SKILL step 4) and `src/workflow/lib/completionSchema.ts` (stale
// comment). Leaving the generator on the old API would have shipped a live
// contradiction: SKILL.md saying "no create tool" while the generated command file
// said "call TeamCreate". Keep this list empty unless a genuine leftover appears.
const OUT_OF_MANDATE: string[] = []

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (SCAN_EXT.some((e) => entry.endsWith(e))) out.push(p)
  }
  return out
}

function scanTargets(): string[] {
  const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)))
  files.push(...SCAN_FILES.map((f) => join(ROOT, f)))
  const skip = new Set([...HISTORICAL, ...OUT_OF_MANDATE, ...MIGRATION_NOTES])
  return files
    .map((f) => f.slice(ROOT.length + 1).replace(/\\/g, '/'))
    .filter((rel) => !skip.has(rel))
}

describe('Agent Teams API migration — deleted tools absent from the live surface', () => {
  const targets = scanTargets()

  it('scans a non-trivial surface', () => {
    expect(targets.length).toBeGreaterThan(200)
  })

  it('no TeamCreate / TeamDelete literal in workflows/ src/ scripts/ docs/WORKFLOW.md', () => {
    const hits: string[] = []
    for (const rel of targets) {
      const body = read(rel)
      for (const bad of FORBIDDEN) {
        if (body.includes(bad)) {
          const line = body.split('\n').findIndex((l) => l.includes(bad)) + 1
          hits.push(`${rel}:${line} — ${bad}`)
        }
      }
    }
    expect(hits, `deleted-tool literals still present:\n${hits.join('\n')}`).toEqual([])
  })

  it('migration-note files mention the dead tools only as errata', () => {
    for (const rel of MIGRATION_NOTES) {
      const lines = read(rel).split('\n')
      for (const [i, line] of lines.entries()) {
        if (!FORBIDDEN.some((bad) => line.includes(bad))) continue
        // the mention itself, or the line right above it (wrapped prose), must negate it
        const window = [lines[i - 1] ?? '', line, lines[i + 1] ?? ''].join('\n')
        expect(
          DELETION_LANGUAGE.test(window),
          `${rel}:${i + 1} names a deleted tool without saying it is gone — reads as an instruction`,
        ).toBe(true)
      }
    }
  })

  it('the out-of-mandate allowlist stays minimal and every entry still needs the fix', () => {
    // If an entry no longer contains the literal, delete it from OUT_OF_MANDATE.
    for (const rel of OUT_OF_MANDATE) {
      const body = read(rel)
      expect(
        FORBIDDEN.some((bad) => body.includes(bad)),
        `${rel} is clean now — remove it from OUT_OF_MANDATE`,
      ).toBe(true)
    }
    expect(OUT_OF_MANDATE.length).toBeLessThanOrEqual(3)
  })
})

describe('capabilities.yaml — agent-platform entries carry the new semantics', () => {
  const caps = (
    parseYaml(read('workflows/capabilities.yaml')) as {
      capabilities: Record<
        string,
        { cmd: string; description?: string; requires?: { cc_version?: string } }
      >
    }
  ).capabilities

  it('agent-teams-create describes a teammate SPAWN, not a create tool', () => {
    const e = caps['agent-teams-create']
    expect(e).toBeTruthy()
    // The mechanism is the Agent tool with a background teammate spawn; the team forms
    // implicitly. `cmd` is rendered as "Invoke `<cmd>`" by src/cli/prompt.ts, so it must
    // read as a real invocable call shape.
    expect(e?.cmd).toContain('Agent(')
    expect(e?.cmd).toContain('run_in_background')
    expect(e?.cmd).not.toContain('TeamCreate')
    // description must state the implicit formation so the model does not hunt for a
    // create step, and must warn that team_name is ignored.
    expect(e?.description ?? '').toMatch(/implicit|first teammate|无建团|隐式/i)
    expect(e?.description ?? '').toMatch(/team_name/)
  })

  it('agent-teams-shutdown is a by-name shutdown request, not a delete tool', () => {
    const e = caps['agent-teams-shutdown']
    expect(e).toBeTruthy()
    expect(e?.cmd).not.toContain('TeamDelete')
    expect(e?.cmd).toMatch(/shut down/i)
    expect(e?.cmd).toMatch(/teammate/i)
    // auto-cleanup on session exit must be stated, else the model re-invents a teardown step
    expect(e?.description ?? '').toMatch(/session (exit|end)|session 退出|自动清理/i)
  })

  it('both migrated entries declare the CC >=2.1.178 floor', () => {
    expect(caps['agent-teams-create']?.requires?.cc_version).toBe('>=2.1.178')
    expect(caps['agent-teams-shutdown']?.requires?.cc_version).toBe('>=2.1.178')
  })

  it('agent-teams-send-message is untouched (SendMessage still exists)', () => {
    expect(caps['agent-teams-send-message']?.cmd).toBe('SendMessage')
  })
})

describe('role-prompts — teardown authority is bilingually consistent', () => {
  const en = read('workflows/role-prompts.yaml')
  const zh = read('workflows/role-prompts.zh-Hans.yaml')

  it('en no longer claims a tool is "the authoritative teardown"', () => {
    expect(en).not.toMatch(/authoritative teardown/i)
    expect(en).not.toMatch(/TeamDelete is authoritative/i)
  })

  it('en states by-name shutdown + automatic session-exit cleanup', () => {
    expect(en).toMatch(/by name/i)
    expect(en).toMatch(/automatic|automatically/i)
  })

  it('zh mirror states the same two facts', () => {
    expect(zh).toMatch(/按名/)
    expect(zh).toMatch(/自动/)
  })

  it('neither locale names a deleted tool', () => {
    for (const bad of FORBIDDEN) {
      expect(en).not.toContain(bad)
      expect(zh).not.toContain(bad)
    }
  })
})

describe('auto SKILL — teardown contract survives the migration (issue #7 lineage)', () => {
  it('en step 4 keeps an unconditional teardown discipline in the new API shape', () => {
    const s = read('workflows/auto/SKILL.md')
    expect(s).toMatch(/shut down/i)
    expect(s).toMatch(/by name/i)
    expect(s).toMatch(/finally|regardless|even if/i)
    expect(s).toMatch(/orphan|leak|hang/i)
    expect(s).toMatch(/headless/i)
  })

  it('zh mirror keeps the same discipline', () => {
    const s = read('workflows/auto/SKILL.zh-Hans.md')
    expect(s).toMatch(/按名/)
    expect(s).toMatch(/无论|即使/)
    expect(s).toMatch(/孤儿|挂起|泄漏/)
    expect(s).toContain('headless')
  })
})
