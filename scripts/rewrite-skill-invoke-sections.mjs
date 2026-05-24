#!/usr/bin/env node
// v3.4.3 — Rewrite each workflows/<stage>/<sub>/SKILL.md to v3.4.3 dual-path
// invocation section. Idempotent: detects the new marker and skips if present.
//
// Two source patterns to normalize:
//   PATTERN A (16 sub-workflows): has both `## CLI invocation` (vapor) +
//     `## How to invoke` (v3.4.2 single-line). Delete CLI invocation; replace
//     How to invoke with v3.4.3 dual-path block from role-prompts.yaml.
//   PATTERN B (4 stage-masters + research + retro have `## Invocation` bullet
//     list instead). Append a `## How to invoke (v3.4.3)` section AFTER it,
//     do NOT delete the existing Invocation list (it documents shell + slash).
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

function buildSection(name, prompt) {
  const isMaster = prompt.is_master === true
  const primaryRef = prompt.primary_cap ? `\`{{ capabilities.${prompt.primary_cap}.cmd }}\`` : ''

  const preferred = primaryRef
    ? `**Preferred path** (when the upstream specialist is installed): use the SlashCommand tool to run ${primaryRef} — the upstream specialist takes over.`
    : `**Preferred path** (master orchestrator): dispatch to the per-sub-workflow slash commands in the order this stage prescribes. Each sub command lives at \`~/.claude/commands/<sub-name>.md\` with its own dual-path fallback.`

  const checklist = prompt.checklist.length
    ? prompt.checklist.map((item, i) => `> ${i + 1}. ${item}`).join('\n>\n')
    : '> (Master orchestrator — dispatches to per-sub-workflow slash commands; the per-sub SKILL.md carries the role-prompt fallback.)'

  const fallback = isMaster
    ? `**Fallback path** (when no slash command from the sub-list resolves): run each missing sub-workflow inline using its own role prompt from \`~/.claude/skills/<sub-name>/SKILL.md\`. Do NOT skip stages silently — each sub either runs or is logged as "skipped: <reason>".`
    : [
        `**Fallback path** (when the upstream isn't installed or returns no result): use the Task tool to spawn a general-purpose subagent with this prompt:`,
        ``,
        `> You are a **${prompt.specialist}**.`,
        `>`,
        `> **Mission**: ${prompt.responsibility.trim().replace(/\n/g, ' ')}`,
        `>`,
        `> **Default-suspect mode**: assume the change is broken / risky / incomplete until proven otherwise. Cite \`file:line\` for every finding; do not generalize.`,
        `>`,
        `> **Review checklist**:`,
        checklist,
        `>`,
        `> **Output format**: structured report with severity-classified findings (${prompt.severity}). One finding per line: \`[severity] file:line — problem (one sentence); fix: suggested change\`. If no findings, say so explicitly. No preamble, no end-of-report summary.`,
        ``,
        `(Role prompt is self-contained — works even when the upstream \`${prompt.primary_cap || 'specialist'}\` user-skill / plugin isn't installed.)`,
      ].join('\n')

  return [
    V3_4_3_MARKER,
    '## How to invoke',
    '',
    preferred,
    '',
    fallback,
    '',
    `(Sister \`~/.claude/commands/${name}.md\` is also generated by \`harnessed setup\` so \`/${name}\` is a real platform slash command — both files carry the same dual-path instruction. Previous v3.4.x \`harnessed ${name} --apply\` CLI claims are removed; that subcommand was never implemented.)`,
    '',
  ].join('\n')
}

// Lazy `+?` body (NOT `*?`) so `$` end-of-line anchor with `/m` doesn't
// short-circuit at the immediate next-line position (regex bug fix 2026-05-24
// — `*?` plus `(?=\n## |$)/m` was matching zero-length right after the heading
// because `/m` makes `$` match end-of-every-line, including the empty line
// directly under the heading).
const CLI_INVOCATION_RX = /^## CLI invocation\n[\s\S]+?(?=\n## )/m
const HOW_TO_INVOKE_RX = /^## How to invoke\n[\s\S]+?(?=\n## )/m
const FORWARD_LOOKING_RX = /^## Forward-looking note\n[\s\S]+?(?=\n## )/m

async function rewriteOne({ flatName, skillPath, isMaster }, prompts) {
  let body = await readFile(skillPath, 'utf8')
  if (body.includes(V3_4_3_MARKER)) {
    return { name: flatName, action: 'skipped-already-v3.4.3' }
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
  // value is now subsumed by the v3.4.3 dual-path section.
  if (FORWARD_LOOKING_RX.test(body)) {
    body = body.replace(FORWARD_LOOKING_RX, '')
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
