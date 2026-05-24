#!/usr/bin/env node
// v3.4.4 — Rewrite each workflows/<stage>/<sub>/SKILL.md to the v3.4.4
// single-path invocation section (sister src/cli/lib/generateCommands.ts L91+
// commands/<x>.md schema). The body always invokes the workflow runtime via
// `echo "$ARGUMENTS" | harnessed run <name> --task-stdin` — no SlashCommand
// vapor, no Task-spawn fallback that bypassed disciplines+judgments+masters.
//
// Idempotent via NEW v3.4.4 marker:
//   - V3_4_4_MARKER present  → skip
//   - V3_4_3_MARKER present  → strip + re-insert v3.4.4 section
//   - neither                → insert v3.4.4 section per Pattern A/B placement
//
// Skips legacy v2 dirs (plan-feature / execute-task / verify-work) — they emit
// the deprecation block at scan time.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const WORKFLOWS = join(REPO_ROOT, 'workflows')

const DEPRECATED = new Set(['plan-feature', 'execute-task', 'verify-work'])

const V3_4_3_MARKER = '<!-- v3.4.3-dual-path-invocation -->'
const V3_4_4_MARKER = '<!-- harnessed-generated:v3.4.4 -->'

function flatNameFor(stageDir, subDir) {
  if (subDir == null) return stageDir
  if (subDir === 'auto') return stageDir
  return `${stageDir}-${subDir}`
}

async function listAllSkills() {
  const out = []
  const stageEntries = (await readdir(WORKFLOWS)).sort()
  for (const entry of stageEntries) {
    if (DEPRECATED.has(entry)) continue
    const stagePath = join(WORKFLOWS, entry)
    let s
    try {
      s = await stat(stagePath)
    } catch {
      continue
    }
    if (!s.isDirectory()) continue

    // Flat top-level (research / retro / auto)?
    try {
      await stat(join(stagePath, 'SKILL.md'))
      out.push({
        flatName: entry,
        skillPath: join(stagePath, 'SKILL.md'),
        isMaster: entry === 'auto',
      })
      continue
    } catch {
      // fallthrough to nested
    }

    // Nested 2-level
    const subEntries = (await readdir(stagePath)).sort()
    for (const sub of subEntries) {
      const subPath = join(stagePath, sub)
      let ss
      try {
        ss = await stat(subPath)
      } catch {
        continue
      }
      if (!ss.isDirectory()) continue
      try {
        await stat(join(subPath, 'SKILL.md'))
        out.push({
          flatName: flatNameFor(entry, sub),
          skillPath: join(subPath, 'SKILL.md'),
          isMaster: sub === 'auto',
        })
      } catch {}
    }
  }
  return out
}

async function loadRolePrompts() {
  const yamlText = await readFile(join(WORKFLOWS, 'role-prompts.yaml'), 'utf8')
  const doc = parseYaml(yamlText)
  return doc?.prompts ?? {}
}

function buildSection(name, _prompt) {
  // v3.4.4 single-path schema — sister src/cli/lib/generateCommands.ts. Both
  // commands/<x>.md and skills/<x>/SKILL.md invoke the same Bash command so the
  // workflow runtime (src/workflow/run.ts) executes either path identically.
  const stagedNote =
    name === 'auto'
      ? '\n- For stage-by-stage review, append `--staged` (pauses between stages for user review).'
      : ''
  return [
    '## How to invoke',
    '',
    'Use the Bash tool to run:',
    '',
    '```bash',
    `echo "$ARGUMENTS" | harnessed run ${name} --task-stdin`,
    '```',
    '',
    `If \`$ARGUMENTS\` is empty, run \`harnessed run ${name}\` (no stdin pipe).`,
    '',
    'After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.',
    stagedNote ? stagedNote.trimStart() : '',
    '',
    V3_4_4_MARKER,
    '',
  ]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === '')) // collapse leading double-blank from empty stagedNote
    .join('\n')
}

// Lazy `+?` body (NOT `*?`) so `$` end-of-line anchor with `/m` doesn't
// short-circuit at the immediate next-line position (regex bug fix 2026-05-24
// — `*?` plus `(?=\n## |$)/m` was matching zero-length right after the heading
// because `/m` makes `$` match end-of-every-line, including the empty line
// directly under the heading).
const CLI_INVOCATION_RX = /^## CLI invocation\n[\s\S]+?(?=\n## )/m
const HOW_TO_INVOKE_RX = /^## How to invoke\n[\s\S]+?(?=\n## )/m
const FORWARD_LOOKING_RX = /^## Forward-looking note\n[\s\S]+?(?=\n## )/m

async function rewriteOne({ flatName, skillPath, isMaster: _isMaster }, prompts) {
  let body = await readFile(skillPath, 'utf8')
  if (body.includes(V3_4_4_MARKER)) {
    return { name: flatName, action: 'skipped-already-v3.4.4' }
  }
  const prompt = prompts[flatName]
  if (!prompt) {
    return { name: flatName, action: 'no-role-prompt-entry' }
  }
  let changed = false

  // Pattern A: drop CLI invocation block
  if (CLI_INVOCATION_RX.test(body)) {
    body = body.replace(CLI_INVOCATION_RX, '')
    changed = true
  }

  // Also strip vapor "- CLI: `harnessed <x> ...`" lines from `## Invocation`
  // master/standalone bullet lists (e.g. workflows/auto, workflows/research,
  // workflows/<stage>/auto). The matching slash command lines are real and stay.
  const vaporCliBulletRx = /^- CLI: `harnessed [^`]+`\n/gm
  if (vaporCliBulletRx.test(body)) {
    body = body.replace(vaporCliBulletRx, '')
    changed = true
  }

  // Frontmatter description vapor — "Triggered by harnessed CLI `harnessed
  // <x> ...` or slash command" → "Triggered by slash command". The slash
  // command form is real (commands/<x>.md is generated); the CLI form was vapor.
  const frontmatterVaporRx = /Triggered by harnessed CLI `harnessed [^`]+` or slash command/g
  if (frontmatterVaporRx.test(body)) {
    body = body.replace(frontmatterVaporRx, 'Triggered by slash command')
    changed = true
  }
  // Drop redundant "## Forward-looking note" block (task-* sub-workflows) — its
  // value is now subsumed by the v3.4.4 single-path section.
  if (FORWARD_LOOKING_RX.test(body)) {
    body = body.replace(FORWARD_LOOKING_RX, '')
    changed = true
  }

  // v3.4.4 — also strip the v3.4.3 marker if present so the body is clean
  // before re-inserting the new section. Idempotent on re-run.
  if (body.includes(V3_4_3_MARKER)) {
    body = body.replace(V3_4_3_MARKER, '')
    changed = true
  }

  const newSection = buildSection(flatName, prompt)

  if (HOW_TO_INVOKE_RX.test(body)) {
    body = body.replace(HOW_TO_INVOKE_RX, newSection.trimEnd() + '\n')
    changed = true
  } else {
    // Pattern B (masters / standalone): insert before `## References` if
    // present, otherwise append at EOF.
    if (/^## References\b/m.test(body)) {
      body = body.replace(/^## References\b/m, newSection.trimEnd() + '\n\n## References')
    } else {
      body = body.trimEnd() + '\n\n' + newSection
    }
    changed = true
  }

  // Collapse 3+ blank lines (cosmetic — sed-style cleanup after CLI block removal)
  body = body.replace(/\n{3,}/g, '\n\n')

  if (!changed) return { name: flatName, action: 'no-change' }
  await writeFile(skillPath, body, 'utf8')
  return { name: flatName, action: 'rewritten' }
}

async function main() {
  const prompts = await loadRolePrompts()
  const skills = await listAllSkills()
  const results = []
  for (const s of skills) {
    results.push(await rewriteOne(s, prompts))
  }
  for (const r of results) console.log(`  ${r.action.padEnd(28)} ${r.name}`)
  const written = results.filter((r) => r.action === 'rewritten').length
  console.log(`\nrewrote ${written}/${results.length} SKILL.md files`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
