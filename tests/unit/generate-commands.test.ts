// v3.4.4 — unit tests for src/cli/lib/generateCommands.ts.
//
// Cells:
//   1-3   : loadRolePrompts (parses real file, tolerates missing, ignores junk)
//   4-7   : generateCommandFile content shape (v3.4.4 single-path body — Bash
//           harnessed run invocation, marker present, frontmatter argument-hint,
//           master vs sub variant)
//   8-12  : writeAllCommands integration (writes new file, skips user-authored,
//           skips when role-prompt missing, surface write errors, no-prefix
//           filename convention)
//   13-20 : v3.4.4 NEW — single-path body assertions (run --task-stdin present,
//           marker present, SlashCommand/Task vapor absent) + marker-based
//           overwrite (v3.4.4 marker overwritten, v3.4.3 signature overwritten,
//           user-authored preserved) + argument-hint frontmatter master/sub.

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
  shouldOverwriteFile,
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

describe('generateCommandFile — v3.4.4 single-path body shape', () => {
  it('cell 4 — sub-workflow body has frontmatter + heading + description', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(['code-review']),
      new Set(['gstack']),
    )
    expect(content).toMatch(/^---\ndescription: .+\nargument-hint: .+\n---\n/)
    expect(content).toMatch(/# \/verify-paranoid/)
    expect(content).toContain(SUB_PROMPT.description)
    expect(content).toMatch(/## How to invoke/)
  })

  it('cell 5 — v3.4.4 body contains the single `harnessed run <name> --task-stdin` Bash invocation', () => {
    const { content, warnings } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(['gstack']),
    )
    expect(content).toContain('harnessed run verify-paranoid --task-stdin')
    expect(content).toContain('Use the Bash tool to run')
    expect(warnings).toEqual([])
  })

  it('cell 6 — no warnings emitted even when upstream user-skill backing is absent (v3.4.4 body has no placeholders)', () => {
    const { content, warnings } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(), // gstack user-skill NOT installed — but v3.4.4 body doesn't render {{ cap }} so no warning
    )
    expect(warnings).toEqual([])
    expect(content).toContain('harnessed run verify-paranoid --task-stdin')
  })

  it('cell 7 — master prompt body has same single-path shape (no special master variant)', () => {
    const { content } = generateCommandFile('verify', MASTER_PROMPT, CAPS, new Set(), new Set())
    expect(content).toMatch(/# \/verify/)
    expect(content).toContain('harnessed run verify --task-stdin')
    // No dispatcher-only fallback section in v3.4.4 — runtime dispatches.
    expect(content).not.toMatch(/SlashCommand tool/)
    expect(content).not.toMatch(/Task tool to spawn/)
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
    expect(body).toContain('harnessed run verify-paranoid --task-stdin')
  })

  it('cell 9 — preserves user-authored file (no harnessed marker, no v3.4.3 signature)', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const targetPath = join(commandsDir, 'verify-paranoid.md')
    // Simulate a user-authored command file with neither marker nor v3.4.3 shape.
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
    expect(r.results[0]?.warning).toMatch(/user-authored/)
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

describe('v3.4.4 NEW — single-path body + marker-based overwrite (cells 13-20)', () => {
  it('cell 13 — new body contains `harnessed run <name> --task-stdin` Bash invocation', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(),
    )
    expect(content).toContain('harnessed run verify-paranoid --task-stdin')
  })

  it('cell 14 — new body contains v3.4.4 marker as trailing comment', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(),
    )
    expect(content).toContain('<!-- harnessed-generated:v3.4.4 -->')
  })

  it('cell 15 — new body does NOT contain SlashCommand vapor', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(),
    )
    expect(content).not.toContain('SlashCommand tool to run')
    expect(content).not.toContain('Preferred path')
  })

  it('cell 16 — new body does NOT contain Task-spawn fallback', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(),
    )
    expect(content).not.toContain('Task tool to spawn')
    expect(content).not.toContain('Fallback path')
  })

  it('cell 17 — writeAllCommands overwrites file containing v3.4.4 marker', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const targetPath = join(commandsDir, 'verify-paranoid.md')
    // Seed with old harnessed content carrying v3.4.4 marker.
    writeFileSync(
      targetPath,
      `# /verify-paranoid\n\nstale content\n\n<!-- harnessed-generated:v3.4.4 -->\n`,
      'utf8',
    )

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
    const body = readFileSync(targetPath, 'utf8')
    expect(body).toContain('harnessed run verify-paranoid --task-stdin')
    expect(body).not.toContain('stale content')
  })

  it('cell 18 — writeAllCommands overwrites file matching v3.4.3 dual-path signature', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const targetPath = join(commandsDir, 'verify-paranoid.md')
    // Seed with the v3.4.3 dual-path body shape (no marker, has two-signal signature).
    writeFileSync(
      targetPath,
      `# /verify-paranoid\n\n## How to invoke\n\n**Preferred path** (when the upstream specialist is installed): use the SlashCommand tool to run \`/review\` — the upstream specialist takes over.\n\n**Fallback path** (when the upstream isn't installed): use the Task tool to spawn a general-purpose subagent with this prompt:\n\n> You are a Paranoid Staff Engineer.\n`,
      'utf8',
    )

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
    const body = readFileSync(targetPath, 'utf8')
    expect(body).toContain('harnessed run verify-paranoid --task-stdin')
    expect(body).not.toContain('SlashCommand tool')
  })

  it('cell 19 — writeAllCommands preserves user-authored file (neither marker nor signature)', async () => {
    const commandsDir = join(tmpRoot, 'commands')
    mkdirSync(commandsDir, { recursive: true })
    const targetPath = join(commandsDir, 'verify-paranoid.md')
    writeFileSync(targetPath, '# my custom command\nhello\n', 'utf8')

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
    expect(r.results[0]?.warning).toMatch(/user-authored/)
    expect(readFileSync(targetPath, 'utf8')).toBe('# my custom command\nhello\n')
  })

  it('cell 20 — argument-hint frontmatter — sub gets `[requirement text or omit]`, master gets `[task description]`', () => {
    const sub = generateCommandFile('verify-paranoid', SUB_PROMPT, CAPS, new Set(), new Set())
    const master = generateCommandFile('verify', MASTER_PROMPT, CAPS, new Set(), new Set())
    expect(sub.content).toMatch(/argument-hint: "\[requirement text or omit\]"/)
    expect(master.content).toMatch(/argument-hint: "\[task description\]"/)
  })

  it('cell 20b — shouldOverwriteFile detects both marker variants + rejects user-authored', () => {
    expect(shouldOverwriteFile('foo\n<!-- harnessed-generated:v3.4.4 -->\nbar')).toBe(true)
    expect(shouldOverwriteFile('foo\n<!-- harnessed-generated:v3.4.5 -->\nbar')).toBe(true)
    expect(
      shouldOverwriteFile(
        '**Preferred path** use the SlashCommand tool to run /x\n**Fallback path** use the Task tool to spawn',
      ),
    ).toBe(true)
    expect(shouldOverwriteFile('# my custom\nnothing harnessed here')).toBe(false)
  })

  it('cell 20c — shouldOverwriteFile detects v3.4.3 master/standalone dispatcher variant', () => {
    // Verbatim sample from v3.4.3-generated ~/.claude/commands/auto.md L10
    // (was misclassified as user-authored pre-fix because SUB_RX required
    // "use the SlashCommand tool" which master variant lacks).
    const masterBody =
      '## How to invoke\n\n**Preferred path** (master orchestrator): dispatch to the per-sub-workflow slash commands in the order this stage prescribes.\n\n**Fallback path** (when no slash command from the sub-list resolves): run each missing sub-workflow inline.'
    expect(shouldOverwriteFile(masterBody)).toBe(true)
    // Hybrid /research variant: master-preferred + sub-fallback wording
    const researchBody =
      '**Preferred path** (master orchestrator): dispatch to the per-sub-workflow slash commands\n**Fallback path**: use the Task tool to spawn'
    expect(shouldOverwriteFile(researchBody)).toBe(true)
    // Negative: user file mentioning "Preferred path" but no dispatcher signature
    expect(shouldOverwriteFile('**Preferred path**: read the docs first')).toBe(false)
  })
})

describe('v3.9.26 Option A — interactive vs hybrid vs spawn command bodies (cells 21-26)', () => {
  const DISCUSS_MASTER_PROMPT: RolePrompt = {
    primary_cap: '',
    specialist: 'Stage 1 discuss dispatcher',
    responsibility: 'Run 3-layer clarification.',
    checklist: [],
    severity: 'per-sub fire/skip',
    description: 'Stage 1 discuss master.',
    is_master: true,
  }
  const AUTO_PROMPT: RolePrompt = {
    primary_cap: '',
    specialist: 'Super-master dispatcher',
    responsibility: 'Run 6-stage chain.',
    checklist: [],
    severity: 'per-stage',
    description: 'Super-master auto.',
    is_master: true,
  }
  const TASK_MASTER_PROMPT: RolePrompt = {
    primary_cap: '',
    specialist: 'Stage 3 task dispatcher',
    responsibility: 'Run 4-sub task chain.',
    checklist: [],
    severity: 'per-sub',
    description: 'Stage 3 task master.',
    is_master: true,
  }

  it('cell 21 — interactive command (discuss) → body instructs main-session dialogue, NO harnessed run spawn', () => {
    const { content } = generateCommandFile(
      'discuss',
      DISCUSS_MASTER_PROMPT,
      CAPS,
      new Set(),
      new Set(),
    )
    // Must instruct interactive clarification in THIS session
    expect(content).toMatch(/in (THIS|this) session/i)
    expect(content).toMatch(/AskUserQuestion|ask the user|dialogue/i)
    // Must NOT contain the spawn invocation for itself
    expect(content).not.toContain('harnessed run discuss --task-stdin')
  })

  it('cell 22 — interactive command (task-clarify) → same main-session instruction', () => {
    const { content } = generateCommandFile('task-clarify', SUB_PROMPT, CAPS, new Set(), new Set())
    expect(content).toMatch(/in (THIS|this) session/i)
    expect(content).not.toContain('harnessed run task-clarify --task-stdin')
  })

  it('cell 23 — hybrid command (auto) → interactive discuss FIRST + harnessed run chain with --skip-sub', () => {
    const { content } = generateCommandFile('auto', AUTO_PROMPT, CAPS, new Set(), new Set())
    // Step 1: interactive clarification
    expect(content).toMatch(/in (THIS|this) session/i)
    // Step 2: chain of harnessed run per execution stage with --skip-sub on task
    expect(content).toContain('harnessed run plan --task-stdin')
    expect(content).toContain('harnessed run task --task-stdin --skip-sub clarify')
    expect(content).toContain('harnessed run verify --task-stdin')
    expect(content).toContain('harnessed run retro --task-stdin')
    // Must NOT spawn the auto super-master itself (that would re-spawn headless discuss)
    expect(content).not.toContain('harnessed run auto --task-stdin')
  })

  it('cell 24 — hybrid command (task) → interactive clarify first + --skip-sub clarify spawn', () => {
    const { content } = generateCommandFile('task', TASK_MASTER_PROMPT, CAPS, new Set(), new Set())
    expect(content).toMatch(/in (THIS|this) session/i)
    expect(content).toContain('harnessed run task --task-stdin --skip-sub clarify')
  })

  it('cell 25 — spawn command (verify-paranoid) → unchanged v3.4.4 single-path body', () => {
    const { content } = generateCommandFile(
      'verify-paranoid',
      SUB_PROMPT,
      CAPS,
      new Set(),
      new Set(),
    )
    expect(content).toContain('harnessed run verify-paranoid --task-stdin')
    expect(content).not.toMatch(/in THIS session/)
  })

  it('cell 26 — spawn command (research) → unchanged', () => {
    const { content } = generateCommandFile('research', SUB_PROMPT, CAPS, new Set(), new Set())
    expect(content).toContain('harnessed run research --task-stdin')
  })

  it('cell 27 — all three body types carry the harnessed-generated marker (overwrite-safe)', () => {
    for (const [name, prompt] of [
      ['discuss', DISCUSS_MASTER_PROMPT],
      ['auto', AUTO_PROMPT],
      ['verify-paranoid', SUB_PROMPT],
    ] as const) {
      const { content } = generateCommandFile(name, prompt, CAPS, new Set(), new Set())
      expect(shouldOverwriteFile(content), `${name} body must carry marker`).toBe(true)
    }
  })
})
