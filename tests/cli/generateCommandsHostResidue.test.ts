// v16.0 post-close — close the S2 hole in the host-residue contract.
//
// `scripts/check-host-primitives.mjs` owns the ONE list of "what counts as a
// Claude-Code-only token" (`CC_TOKENS`) and the one allowlist of legitimate sites
// (`MASKS`). It scans S1 (workflows/**/SKILL.md) and S3 (the runtime-prompt yaml
// fields), and its own header explains why it skips S2, the generated command
// bodies: they are synthesised from TypeScript template literals, so reaching them
// needs a build that dep-light gate deliberately does not take.
//
// The hole was not "S2 is unchecked" — `generateCommandsGolden.test.ts` has a codex
// sanity block. It was that the sanity block hand-picks its tokens (`task_name`,
// `CC-native`, `AskUserQuestion`) on two files (`auto.md`, `verify-paranoid.md`).
// So `CC_TOKENS` was the source of truth for two surfaces out of three: adding a
// token there strengthened S1 and S3 and did nothing for S2 — and S2 is precisely
// where Phase 65 found real defects (bodies naming `~/.claude/rules/agent-teams.md`
// and ordering the model to call `AskUserQuestion`, neither of which exists on codex).
//
// The fix is not to make the gate take a build. It is to make this test CONSUME the
// gate's list, so one edit in one place now covers all three surfaces. The masking
// is the gate's own code (`maskPhrase`, the host-map span markers read out of
// `hostPrimitives.ts`), not a re-implementation that could drift from it.

import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CC_TOKENS,
  hostMapMarkers,
  MASKS,
  maskPhrase,
  scanCcTokens,
} from '../../scripts/check-host-primitives.mjs'
import { generateCommandFile } from '../../src/cli/lib/generateCommands.js'
import { loadHostPrimitives } from '../../src/cli/lib/hostPrimitives.js'
import { loadRolePrompts } from '../../src/workflow/rolePrompts.js'
import { scanWorkflowsNested } from '../../src/workflow/scan-nested.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')

/** Every codex command body setup.ts Step A.6 would write, keyed by file name. */
async function codexBodies(): Promise<Record<string, string>> {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(WORKFLOWS_DIR)
  const { workflows } = await scanWorkflowsNested(WORKFLOWS_DIR, entries)
  const prompts = await loadRolePrompts(WORKFLOWS_DIR, 'en')
  const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'en' })
  const out: Record<string, string> = {}
  for (const w of workflows.map((x) => x.name).sort()) {
    const prompt = prompts[w]
    if (!prompt) continue
    const { content } = generateCommandFile(w, prompt, {}, new Set(), new Set(), {
      host: 'codex',
      table,
    })
    out[`${w}.md`] = content
  }
  return out
}

/** Blank `[from, to)` keeping newlines, so offsets AND line numbers survive —
 *  same semantics as the gate's own private `blank`. */
function blank(text: string, from: number, to: number): string {
  let out = ''
  for (let i = from; i < to; i++) out += text[i] === '\n' ? '\n' : ' '
  return out
}

/** Apply the gate's exemptions: host-map spans wholesale, then each masked phrase.
 *  Blanking (not deleting) keeps offsets intact so reported lines stay truthful. */
function applyGateMasks(text: string): string {
  const { start, end } = hostMapMarkers(REPO_ROOT)
  let out = ''
  let cursor = 0
  for (;;) {
    const a = text.indexOf(start, cursor)
    if (a === -1) break
    const b = text.indexOf(end, a)
    if (b === -1) break
    const stop = b + end.length
    out += text.slice(cursor, a) + blank(text, a, stop)
    cursor = stop
  }
  out += text.slice(cursor)
  for (const m of MASKS) out = maskPhrase(out, m.phrase).text
  return out
}

describe('codex command bodies (S2) — zero Claude-Code residue, judged by the gate list', () => {
  it('no CC_TOKENS survive the codex render, outside the gate allowlist', async () => {
    const bodies = await codexBodies()
    expect(Object.keys(bodies).length).toBeGreaterThan(10)
    const hits: string[] = []
    for (const [file, body] of Object.entries(bodies)) {
      for (const h of scanCcTokens(applyGateMasks(body))) {
        hits.push(`${file}: '${h.token}'`)
      }
    }
    expect(hits, `codex S2 residue (gate token list)\n  ${hits.join('\n  ')}`).toEqual([])
  })

  it('the same scan over the CLAUDE bodies DOES hit — the detector is not inert', async () => {
    // Anti-rot, mirroring the gate's own rule that a zero-hit allowlist entry is
    // itself a violation. A green codex scan is only meaningful if the identical
    // pipeline (mask → scan) fires on text that is supposed to be full of these
    // tokens. The claude column exists to say "SendMessage" / "Task tool", so the
    // claude corpus is the natural positive control: if this ever goes quiet, the
    // codex assertion above has stopped proving anything.
    const { readdir } = await import('node:fs/promises')
    const entries = await readdir(WORKFLOWS_DIR)
    const { workflows } = await scanWorkflowsNested(WORKFLOWS_DIR, entries)
    const prompts = await loadRolePrompts(WORKFLOWS_DIR, 'en')
    let total = 0
    for (const w of workflows.map((x) => x.name).sort()) {
      const prompt = prompts[w]
      if (!prompt) continue
      // 5-arg back-compat call = (claude, packaged en table), the default path.
      const { content } = generateCommandFile(w, prompt, {}, new Set(), new Set())
      total += scanCcTokens(applyGateMasks(content)).length
    }
    expect(total).toBeGreaterThan(0)
  })

  it('the token list it judges against is the gate’s, not a local copy', () => {
    // If this file ever grows its own array, the whole point is lost: the next
    // token added to the gate would again strengthen S1/S3 only. These two are
    // spot-checks that the import resolved to a populated list from the gate.
    expect(CC_TOKENS.length).toBeGreaterThan(5)
    expect(CC_TOKENS).toContain('AskUserQuestion')
  })
})
