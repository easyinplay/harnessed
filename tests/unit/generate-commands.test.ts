// v3.4.3 — unit tests for src/cli/lib/generateCommands.ts.
//
// Cells:
//   1-3  : loadRolePrompts (parses real file, tolerates missing, ignores junk)
//   4-7  : generateCommandFile sub-workflow shape (preferred path + fallback
//          role-prompt + capability placeholder rendered + master variant)
//   8-12 : writeAllCommands integration (writes new file, skips existing user
//          file, skips when role-prompt missing, surface write errors)

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { writeFile as writeFileAsync } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CapabilityMap } from '../../src/cli/lib/capabilityResolver.js'
import {
  generateCommandFile,
  loadRolePrompts,
  type RolePrompt,
  writeAllCommands,
} from '../../src/cli/lib/generateCommands.js'

let tmpRoot: string

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'harnessed-gencmd-'))
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

const SUB_PROMPT: RolePrompt = {
  primary_cap: 'gstack-review',
  specialist: 'Paranoid Staff Engineer',
  responsibility: 'Review the diff for security and reliability defects.',
  checklist: ['SQL injection', 'Race conditions', 'Type coercion'],
  severity: 'CRITICAL / INFO',
  description: 'Pre-landing Paranoid Staff Engineer review.',
}

const MASTER_PROMPT: RolePrompt = {
  primary_cap: '',
  specialist: 'Stage 4 verify dispatcher',
  responsibility: 'Dispatch the verify stage sub-workflows in order.',
  checklist: [],
  severity: 'per-sub fire/skip',
  description: 'Stage 4 verify master.',
  is_master: true,
}

const CAPS: CapabilityMap = {
  'gstack-review': {
    cmd: '/review',
    install_type: 'user-skill',
    skill_dir: 'gstack',
  },
  'code-review': {
    cmd: '/code-review',
    install_type: 'plugin',
    plugin_id: 'code-review',
  },
}

describe('loadRolePrompts — yaml registry parse', () => {
  it('cell 1 — parses a well-formed registry into a name-keyed record', async () => {
    const wfDir = join(tmpRoot, 'workflows')
    mkdirSync(wfDir, { recursive: true })
    writeFileSync(
      join(wfDir, 'role-prompts.yaml'),
      `schema_version: harnessed.role-prompts.v1
prompts:
  verify-paranoid:
    primary_cap: gstack-review
    specialist: Paranoid Staff Engineer
    responsibility: Review the diff.
    checklist:
      - SQL safety
      - Concurrency
    severity: CRITICAL / INFO
    description: Pre-landing review.
`,
      'utf8',
    )
    const prompts = await loadRolePrompts(wfDir)
    const entry = prompts['verify-paranoid']
    expect(entry).toBeDefined()
    expect(entry?.primary_cap).toBe('gstack-review')
    expect(entry?.checklist).toEqual(['SQL safety', 'Concurrency'])
  })

  it('cell 2 — missing role-prompts.yaml → empty record (non-blocking)', async () => {
    const prompts = await loadRolePrompts(tmpRoot)
    expect(prompts).toEqual({})
  })

  it('cell 3 — yaml with no `prompts:` top-key → empty record', async () => {
    writeFileSync(join(tmpRoot, 'role-prompts.yaml'), 'schema_version: x\nfoo: bar\n', 'utf8')
    const prompts = await loadRolePrompts(tmpRoot)
    expect(prompts).toEqual({})
  })
})

describe('generateCommandFile — content shape', () => {
  it('cell 4 — sub-workflow body has both preferred + fallback paths', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(['code-review']),
      new Set(['gstack']),
    )
    expect(content).toMatch(/^---\ndescription: .+\n---\n/)
    expect(content).toMatch(/# \/verify-paranoid/)
    expect(content).toMatch(/\*\*Preferred path\*\*/)
    expect(content).toMatch(/\*\*Fallback path\*\*/)
    expect(content).toMatch(/Paranoid Staff Engineer/)
    expect(content).toMatch(/Review checklist/)
    expect(content).toMatch(/SQL injection/)
  })

  it('cell 5 — capability placeholder resolves to cmd (user-skill installed → no warn)', () => {
    const { content, warnings } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(['gstack']),
    )
    // primary_cap=gstack-review → skill_dir=gstack present → cmd=/review verbatim
    expect(content).toContain('`/review`')
    expect(warnings).toEqual([])
  })

  it('cell 6 — capability placeholder + missing user-skill backing emits warning', () => {
    const { content, warnings } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(), // gstack user-skill NOT installed
    )
    // cmd is still bare (resolver never mutates), warning surfaces install hint
    expect(content).toContain('`/review`')
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0]).toMatch(/user-skill/)
    expect(warnings[0]).toMatch(/gstack/)
  })

  it('cell 7 — master prompt body has dispatcher language, no role-prompt checklist', () => {
    const { content } = generateCommandFile('verify', MASTER_PROMPT, CAPS, new Set(), new Set())
    expect(content).toMatch(/# \/verify/)
    expect(content).toMatch(/master orchestrator/)
    expect(content).toMatch(/per-sub-workflow slash commands/)
    // Master fallback does NOT spawn Task with a checklist
    expect(content).not.toMatch(/Review checklist/)
    expect(content).not.toMatch(/SQL injection/)
  })
})

describe('writeAllCommands — directory integration', () => {
  it('cell 8 — writes a new commands/<x>.md for each named workflow with a role-prompt entry', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const r = await writeAllCommands(
      ['verify-paranoid'],
      commandsDir,
      { 'verify-paranoid': SUB_PROMPT },
      CAPS,
      new Set(),
      new Set(['gstack']),
      async (p, c) => writeFileAsync(p, c, 'utf8'),
    )
    expect(r.results[0]?.written).toBe(true)
    expect(existsSync(join(commandsDir, 'verify-paranoid.md'))).toBe(true)
    const body = readFileSync(join(commandsDir, 'verify-paranoid.md'), 'utf8')
    expect(body).toMatch(/Paranoid Staff Engineer/)
  })

  it('cell 9 — skips when ~/.claude/commands/<x>.md already exists (additive only)', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const targetPath = join(commandsDir, 'verify-paranoid.md')
    // Simulate a user-authored command file that must NOT be overwritten.
    writeFileSync(targetPath, '# user-authored — do not overwrite\n', 'utf8')

    const r = await writeAllCommands(
      ['verify-paranoid'],
      commandsDir,
      { 'verify-paranoid': SUB_PROMPT },
      CAPS,
      new Set(),
      new Set(['gstack']),
      async (p, c) => writeFileAsync(p, c, 'utf8'),
    )
    expect(r.results[0]?.written).toBe(false)
    expect(r.results[0]?.warning).toMatch(/already exists/)
    const body = readFileSync(targetPath, 'utf8')
    expect(body).toBe('# user-authored — do not overwrite\n')
  })

  it('cell 10 — skips with warning when role-prompts.yaml lacks the entry', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const r = await writeAllCommands(
      ['unknown-workflow'],
      commandsDir,
      {}, // empty registry
      CAPS,
      new Set(),
      new Set(),
      async (p, c) => writeFileAsync(p, c, 'utf8'),
    )
    expect(r.results[0]?.written).toBe(false)
    expect(r.results[0]?.warning).toMatch(/role-prompts\.yaml/)
    expect(existsSync(join(commandsDir, 'unknown-workflow.md'))).toBe(false)
  })

  it('cell 11 — bubbles writer errors through into result.warning (graceful)', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const r = await writeAllCommands(
      ['verify-paranoid'],
      commandsDir,
      { 'verify-paranoid': SUB_PROMPT },
      CAPS,
      new Set(),
      new Set(['gstack']),
      async () => {
        throw new Error('disk full')
      },
    )
    expect(r.results[0]?.written).toBe(false)
    expect(r.results[0]?.warning).toMatch(/disk full/)
  })

  it('cell 12 — bare filename naming (no `harnessed-` prefix) — `/verify-paranoid` not `/harnessed-verify-paranoid`', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    await writeAllCommands(
      ['verify-paranoid', 'task-deliver'],
      commandsDir,
      {
        'verify-paranoid': SUB_PROMPT,
        'task-deliver': { ...SUB_PROMPT, specialist: 'Completion enforcer' },
      },
      CAPS,
      new Set(),
      new Set(['gstack']),
      async (p, c) => writeFileAsync(p, c, 'utf8'),
    )
    expect(existsSync(join(commandsDir, 'verify-paranoid.md'))).toBe(true)
    expect(existsSync(join(commandsDir, 'task-deliver.md'))).toBe(true)
    // Should NOT pollute namespace with prefix variants
    expect(existsSync(join(commandsDir, 'harnessed-verify-paranoid.md'))).toBe(false)
  })
})
