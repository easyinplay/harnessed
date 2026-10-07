// `harnessed agents-md` —— 写进 `<CODEX_HOME>/AGENTS.md` 的标记区间。
//
// 范围是维护者 2026-10-07 裁定的「只放 harnessed 自己那段」:命令清单 + 宿主原语对照,
// 全部从真相源派生;个人方法论没有机器可读的源,留在标记区间外不碰。
//
// 这个文件要钉的几件事:
//   1. 幂等 —— 反复跑不会越写越长(先剥后插)。
//   2. 标记外的手写内容逐字节不动,这是能碰别人文件的唯一前提。
//   3. 原语表是**嵌**进来的那张(同一个 marker、同一个 yaml 源),不是另造的第二张。
//   4. codex-only,且不存在时**新建**;移除场景不创建空文件。
//   5. 命令清单与 `writeAllCommands` 的集合同源(有 role-prompts 条目的已装 workflow)。

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AGENTS_MD_END,
  AGENTS_MD_START,
  agentsMdPath,
  buildAgentsMdSection,
  insertAgentsMdSection,
  resolveCommandNames,
  runAgentsMd,
  stripAgentsMdSection,
} from '../../src/cli/lib/agentsMd.js'
import { HOST_MAP_END, HOST_MAP_START } from '../../src/cli/lib/hostPrimitives.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')

const TABLE = {
  spawn_subagent: { default: { claude: 'Task tool', codex: 'spawn_agent tool' } },
  team: { default: { claude: 'Agent Teams', codex: 'codex agents' } },
}

const SECTION_OPTS = {
  commands: ['auto', 'plan', 'verify'],
  commandsDir: 'C:\\Users\\x\\.codex\\prompts',
  table: TABLE,
  notes: ['a caveat about plugin components'],
}

describe('buildAgentsMdSection — everything in it has a source', () => {
  it('lists the commands it was given, and says where they live', () => {
    const out = buildAgentsMdSection(SECTION_OPTS)
    expect(out.startsWith(AGENTS_MD_START)).toBe(true)
    expect(out.trimEnd().endsWith(AGENTS_MD_END)).toBe(true)
    expect(out).toContain('- `/auto`')
    expect(out).toContain('- `/plan`')
    expect(out).toContain(SECTION_OPTS.commandsDir)
  })

  it('embeds the EXISTING host-map block rather than a second glossary', () => {
    // The nesting is the point: the table in AGENTS.md is then the same artifact as the
    // one in every rendered SKILL body, off the same yaml. A hand-rolled copy here could
    // drift from that one, which is the whole failure mode this feature exists to end.
    const out = buildAgentsMdSection(SECTION_OPTS)
    expect(out).toContain(HOST_MAP_START)
    expect(out).toContain(HOST_MAP_END)
    expect(out).toContain('spawn_agent tool')
    expect(out).toContain('a caveat about plugin components')
  })

  it('says the block is generated, so a reader knows not to edit inside it', () => {
    expect(buildAgentsMdSection(SECTION_OPTS)).toMatch(/GENERATED/)
  })

  it('no commands installed → says so instead of printing an empty list', () => {
    const out = buildAgentsMdSection({ ...SECTION_OPTS, commands: [] })
    expect(out).toMatch(/none installed/)
    expect(out).toMatch(/harnessed setup/)
  })

  it('carries no localized command descriptions', () => {
    // role-prompts descriptions are locale-sourced while this scaffold is English;
    // splicing a Chinese description into an English sentence is exactly the bug
    // Phase 65 fixed on `prompt.description`. The command files carry their own.
    const out = buildAgentsMdSection(SECTION_OPTS)
    expect(out).toMatch(/frontmatter/)
  })
})

describe('insert / strip — idempotent, and the rest of the file is untouchable', () => {
  const HAND = '# My own AGENTS.md\n\nhand-written prose I care about.\n'

  it('inserting twice yields the same bytes as inserting once', () => {
    const section = buildAgentsMdSection(SECTION_OPTS)
    const once = insertAgentsMdSection(HAND, section)
    const twice = insertAgentsMdSection(once, section)
    expect(twice).toBe(once)
  })

  it('round trip returns the original hand-written content', () => {
    const section = buildAgentsMdSection(SECTION_OPTS)
    const withBlock = insertAgentsMdSection(HAND, section)
    expect(withBlock).toContain('hand-written prose I care about.')
    expect(stripAgentsMdSection(withBlock)).toBe(HAND)
  })

  it('strip is a no-op when there is no block', () => {
    expect(stripAgentsMdSection(HAND)).toBe(HAND)
  })

  it('a half-written block (start marker, no end) is left ALONE, not guessed at', () => {
    // Truncating at a lone start marker would eat the rest of the maintainer's file.
    const broken = `${HAND}${AGENTS_MD_START}\noops, interrupted\n`
    expect(stripAgentsMdSection(broken)).toBe(broken)
  })

  it('an empty file gets just the block, no leading blank lines', () => {
    const section = buildAgentsMdSection(SECTION_OPTS)
    expect(insertAgentsMdSection('', section)).toBe(section)
  })
})

describe('resolveCommandNames — same set writeAllCommands renders', () => {
  it('is non-trivial and every name has a role-prompts entry', async () => {
    const names = await resolveCommandNames(WORKFLOWS_DIR)
    expect(names.length).toBeGreaterThan(10)
    expect([...names]).toEqual([...names].sort())
    const { loadRolePrompts } = await import('../../src/workflow/rolePrompts.js')
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    for (const n of names) expect(prompts[n]).toBeDefined()
  })
})

describe('runAgentsMd — fs behaviour', () => {
  let home: string
  const saved: Record<string, string | undefined> = {}
  const KEYS = ['HARNESSED_PLATFORM', 'HARNESSED_ROOT_OVERRIDE', 'HOME', 'USERPROFILE']

  beforeEach(() => {
    for (const k of KEYS) saved[k] = process.env[k]
    home = mkdtempSync(join(tmpdir(), 'harnessed-agentsmd-'))
    mkdirSync(join(home, '.codex'), { recursive: true })
    vi.stubEnv('HOME', home)
    vi.stubEnv('USERPROFILE', home)
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(home, 'state'))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
    rmSync(home, { recursive: true, force: true })
  })

  it('targets <CODEX_HOME>/AGENTS.md — never CLAUDE.md, never config.toml', () => {
    const p = agentsMdPath().replace(/\\/g, '/')
    expect(p.endsWith('/.codex/AGENTS.md')).toBe(true)
    expect(p).not.toContain('CLAUDE.md')
    expect(p).not.toContain('config.toml')
  })

  it('--dry-run computes the body and writes NOTHING', async () => {
    const writes: string[] = []
    const r = await runAgentsMd({
      workflowsDir: WORKFLOWS_DIR,
      dryRun: true,
      deps: {
        readFile: async () => {
          throw new Error('ENOENT')
        },
        writeFile: async (p) => {
          writes.push(p)
        },
      },
    })
    expect(r.status).toBe('preview')
    if (r.status === 'preview') {
      // Only the SECTION comes back, never the file body. The first cut returned the
      // whole file and the dry-run printed the maintainer's 192 lines of personal
      // instructions into the terminal — noisy, and out of this command's remit.
      expect(r.section).toContain(AGENTS_MD_START)
      expect(r.action).toBe('create')
      expect(r).not.toHaveProperty('body')
    }
    expect(writes).toEqual([])
  })

  it('preview names what it would do: create / append / replace', async () => {
    const section = buildAgentsMdSection(SECTION_OPTS)
    const withBlock = insertAgentsMdSection('# mine\n', section)
    const run = (stored: string | null) =>
      runAgentsMd({
        workflowsDir: WORKFLOWS_DIR,
        dryRun: true,
        deps: {
          readFile: async () => {
            if (stored === null) throw new Error('ENOENT')
            return stored
          },
          writeFile: async () => {
            throw new Error('dry-run must not write')
          },
        },
      })
    expect(await run(null)).toMatchObject({ action: 'create' })
    expect(await run('# mine only\n')).toMatchObject({ action: 'append' })
    expect(await run(withBlock)).toMatchObject({ action: 'replace' })
  })

  it('second run with the file already correct → unchanged, no write', async () => {
    let stored = ''
    const deps = {
      readFile: async () => {
        if (stored === '') throw new Error('ENOENT')
        return stored
      },
      writeFile: async (_p: string, c: string) => {
        stored = c
      },
    }
    const first = await runAgentsMd({ workflowsDir: WORKFLOWS_DIR, deps })
    expect(first.status).toBe('written')
    const second = await runAgentsMd({ workflowsDir: WORKFLOWS_DIR, deps })
    expect(second.status).toBe('unchanged')
  })

  it('--remove on a file without the block → unchanged; on a missing file → absent', async () => {
    const onlyHand = '# mine\n'
    const a = await runAgentsMd({
      workflowsDir: WORKFLOWS_DIR,
      remove: true,
      deps: { readFile: async () => onlyHand, writeFile: async () => undefined },
    })
    expect(a.status).toBe('unchanged')
    const b = await runAgentsMd({
      workflowsDir: WORKFLOWS_DIR,
      remove: true,
      deps: {
        readFile: async () => {
          throw new Error('ENOENT')
        },
        writeFile: async () => {
          throw new Error('must not write')
        },
      },
    })
    expect(b.status).toBe('absent')
  })

  it('write → remove leaves the hand-written part byte-identical', async () => {
    const HAND = '# mine\n\nkeep me exactly.\n'
    let stored = HAND
    const deps = {
      readFile: async () => stored,
      writeFile: async (_p: string, c: string) => {
        stored = c
      },
    }
    await runAgentsMd({ workflowsDir: WORKFLOWS_DIR, deps })
    expect(stored).not.toBe(HAND)
    expect(stored).toContain('keep me exactly.')
    const r = await runAgentsMd({ workflowsDir: WORKFLOWS_DIR, remove: true, deps })
    expect(r.status).toBe('removed')
    expect(stored).toBe(HAND)
  })

  it('writes a real file end to end when no deps are injected', async () => {
    writeFileSync(join(home, '.codex', 'AGENTS.md'), '# real file\n', 'utf8')
    const r = await runAgentsMd({ workflowsDir: WORKFLOWS_DIR })
    expect(r.status).toBe('written')
    const { readFileSync } = await import('node:fs')
    const body = readFileSync(join(home, '.codex', 'AGENTS.md'), 'utf8')
    expect(body).toContain('# real file')
    expect(body).toContain(AGENTS_MD_START)
    expect(body).toContain(HOST_MAP_START)
  })
})
