// v16.0 Phase 66 T1 — role-prompts → `<CODEX_HOME>/agents/harnessed-<sub>.toml`.
//
// Contract measured on codex-cli 0.155.1 (findings F1 + F8):
//   - codex DISCOVERS agent roles by scanning `<CODEX_HOME>/agents/` — that path
//     never touches config.toml, so it stays inside the v16.0 hard boundary.
//   - the role `name` comes from the FILE CONTENT, not the filename, and a
//     duplicate `name` is skipped + warned about → every harnessed role carries
//     the `harnessed-` prefix so it cannot collide with the 33 GSD roles.
//   - `description` is REQUIRED (codex rejects a role without one).
//   - `developer_instructions` really reaches the spawned sub-agent's context
//     (T0.4 probe: a role asking for an `ECHO-7742` suffix got it back).
//
// The generator is split pure/impure on purpose: `buildCodexAgentRole` is a
// string function (golden-testable), `writeCodexAgentRoles` /
// `discoverCodexAgentRoleFiles` are the only parts that touch the filesystem.

import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadHostPrimitives, renderHostPrimitives } from '../../src/cli/lib/hostPrimitives.js'
import { renderRolePromptsForHost } from '../../src/cli/lib/rolePromptHostRender.js'
import {
  buildCodexAgentRole,
  buildCodexAgentRoles,
  CODEX_AGENT_ROLE_MARKER,
  CODEX_AGENT_ROLE_PREFIX,
  codexAgentRoleName,
  codexAgentsDir,
  discoverCodexAgentRoleFiles,
  isHarnessedAgentRoleFileName,
  tomlBasicString,
  tomlMultilineString,
  writeCodexAgentRoles,
} from '../../src/installers/lib/codexAgentRoles.js'
import { loadRolePrompts, type RolePrompt } from '../../src/workflow/rolePrompts.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')

function rp(over: Partial<RolePrompt> = {}): RolePrompt {
  return {
    primary_cap: 'demo-cap',
    specialist: 'Demo specialist',
    responsibility: 'Do the demo job.\n',
    checklist: ['First item', 'Second item'],
    severity: 'blocker / major / minor',
    description: 'Demo role description.',
    ...over,
  }
}

// ── A minimal reader for the three top-level keys we emit. Not a general TOML
//    parser — it only has to prove that what we escaped comes back unchanged. ──
function readEmittedToml(toml: string): Record<string, string> {
  const out: Record<string, string> = {}
  let rest = toml
  while (rest.length > 0) {
    const m = /^(?:#[^\n]*\n|\n)*([a-z_]+) = /.exec(rest)
    if (!m?.[1]) break
    const key = m[1]
    rest = rest.slice(m[0].length)
    if (rest.startsWith("'''")) {
      const end = rest.indexOf("'''", 3)
      out[key] = rest.slice(4, end) // 3 delimiter chars + the trimmed first newline
      rest = rest.slice(end + 3)
    } else if (rest.startsWith('"""')) {
      let i = 4
      let acc = ''
      for (; i < rest.length; i++) {
        if (rest[i] === '\\') {
          acc += rest[i + 1]
          i++
          continue
        }
        if (rest.startsWith('"""', i)) break
        acc += rest[i]
      }
      out[key] = acc
      rest = rest.slice(i + 3)
    } else if (rest.startsWith('"')) {
      let i = 1
      let acc = ''
      for (; i < rest.length; i++) {
        if (rest[i] === '\\') {
          const n = rest[i + 1]
          acc += n === 'n' ? '\n' : n === 't' ? '\t' : n
          i++
          continue
        }
        if (rest[i] === '"') break
        acc += rest[i]
      }
      out[key] = acc
      rest = rest.slice(i + 1)
    } else break
    rest = rest.replace(/^\n/, '')
  }
  return out
}

describe('naming — the anti-collision prefix (F1: a duplicate name is skipped + warned)', () => {
  it('prefixes the role name and the filename', () => {
    const role = buildCodexAgentRole('verify-paranoid', rp())
    expect(role.roleName).toBe('harnessed-verify-paranoid')
    expect(role.fileName).toBe('harnessed-verify-paranoid.toml')
    expect(codexAgentRoleName('task-code')).toBe(`${CODEX_AGENT_ROLE_PREFIX}task-code`)
  })

  it('rejects a sub name that could escape the agents dir', () => {
    expect(() => buildCodexAgentRole('../evil', rp())).toThrow()
    expect(() => buildCodexAgentRole('a/b', rp())).toThrow()
    expect(() => buildCodexAgentRole('', rp())).toThrow()
  })

  it('claims only prefixed .toml filenames', () => {
    expect(isHarnessedAgentRoleFileName('harnessed-task-code.toml')).toBe(true)
    expect(isHarnessedAgentRoleFileName('gsd-planner.toml')).toBe(false)
    expect(isHarnessedAgentRoleFileName('harnessed-task-code.md')).toBe(false)
  })

  it('codexAgentsDir is <CODEX_HOME>/agents', () => {
    expect(codexAgentsDir(join('x', '.codex'))).toBe(join('x', '.codex', 'agents'))
  })
})

describe('buildCodexAgentRole — the emitted file (golden)', () => {
  it('emits marker + description + developer_instructions + name', () => {
    const role = buildCodexAgentRole('demo-sub', rp())
    expect(role.toml).toBe(
      `${CODEX_AGENT_ROLE_MARKER} — codex agent role for the \`demo-sub\` sub-workflow.\n` +
        '# Source: workflows/role-prompts.yaml. Rewritten by every `harnessed setup`; do not edit.\n' +
        'description = "Demo role description."\n' +
        "developer_instructions = '''\n" +
        'You are a Demo specialist.\n' +
        '\n' +
        'Do the demo job.\n' +
        '\n' +
        '\n' +
        'Checklist:\n' +
        '  1. First item\n' +
        '  2. Second item\n' +
        '\n' +
        'Severity scale: blocker / major / minor\n' +
        '\n' +
        "Emit a structured COMPLETE signal when done.'''\n" +
        'name = "harnessed-demo-sub"\n',
    )
  })

  it('reuses buildAgentDef — the body is the spawn prompt, not a second assembly', async () => {
    const { buildAgentDef } = await import('../../src/workflow/run.js')
    const p = rp()
    const role = buildCodexAgentRole('demo-sub', p)
    expect(readEmittedToml(role.toml).developer_instructions).toBe(
      buildAgentDef('demo-sub', { 'demo-sub': p }).prompt,
    )
  })

  it('never emits an empty description (codex rejects a role without one)', () => {
    for (const bad of ['', '   ', undefined as unknown as string]) {
      const role = buildCodexAgentRole('demo-sub', rp({ description: bad }))
      const parsed = readEmittedToml(role.toml)
      expect(parsed.description?.trim().length).toBeGreaterThan(0)
      expect(parsed.description).toContain('demo-sub')
    }
  })
})

describe('TOML escaping', () => {
  it('escapes quotes and backslashes in a single-line string', () => {
    expect(tomlBasicString('a "b" c\\d')).toBe('"a \\"b\\" c\\\\d"')
    expect(tomlBasicString('line1\nline2\tx')).toBe('"line1\\nline2\\tx"')
  })

  it("uses a ''' literal block when the body is safe", () => {
    expect(tomlMultilineString('plain "quoted" \\ body')).toBe("'''\nplain \"quoted\" \\ body'''")
  })

  it('falls back to an escaped """ block when the body contains \'\'\'', () => {
    const body = "before ''' after"
    const out = tomlMultilineString(body)
    expect(out.startsWith('"""\n')).toBe(true)
    expect(out.endsWith('"""')).toBe(true)
    expect(readEmittedToml(`k = ${out}\n`).k).toBe(body)
  })

  it("falls back when the body ends with an apostrophe (''''' would be unparseable)", () => {
    const out = tomlMultilineString("trailing'")
    expect(out.startsWith('"""\n')).toBe(true)
    expect(readEmittedToml(`k = ${out}\n`).k).toBe("trailing'")
  })

  it("round-trips a role whose prompt contains ''' and quotes", () => {
    const role = buildCodexAgentRole(
      'demo-sub',
      rp({ responsibility: `Use ''' fences and "quotes" and a \\ backslash.` }),
    )
    const parsed = readEmittedToml(role.toml)
    expect(parsed.developer_instructions).toContain(
      `Use ''' fences and "quotes" and a \\ backslash.`,
    )
    expect(parsed.name).toBe('harnessed-demo-sub')
  })

  it('drops control characters and normalizes CRLF', () => {
    const parsed = readEmittedToml(
      buildCodexAgentRole('demo-sub', rp({ responsibility: 'a\r\nb\u0007c' })).toml,
    )
    expect(parsed.developer_instructions).toContain('a\nbc')
    expect(parsed.developer_instructions).not.toContain('\r')
  })
})

describe('buildCodexAgentRoles — registry sweep', () => {
  it('skips masters (pure dispatchers, not spawn targets) and honors the sub filter', () => {
    const prompts: Record<string, RolePrompt> = {
      verify: rp({ is_master: true, checklist: [] }),
      'verify-qa': rp(),
      'task-code': rp(),
      'not-installed': rp(),
    }
    const roles = buildCodexAgentRoles(prompts, ['verify', 'verify-qa', 'task-code'])
    expect(roles.map((r) => r.roleName)).toEqual(['harnessed-task-code', 'harnessed-verify-qa'])
  })

  it('skips an unusable key instead of throwing the whole sweep away', () => {
    const roles = buildCodexAgentRoles({ '../evil': rp(), good: rp() })
    expect(roles.map((r) => r.roleName)).toEqual(['harnessed-good'])
  })
})

describe('host render — the codex column reaches the toml (requirement 3)', () => {
  it('leaves no {{ host.* }} placeholder and speaks codex, not Claude Code', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR, 'en')
    const rendered = await renderRolePromptsForHost(prompts, {
      workflowsDir: WORKFLOWS_DIR,
      host: 'codex',
      locale: 'en',
    })
    // `description` is the one field renderRolePromptsForHost holds back (it is
    // raw yaml frontmatter on the commands surface) — here it is prose codex
    // reads, so this surface renders it explicitly.
    const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'en' })
    const roles = buildCodexAgentRoles(rendered, undefined, {
      renderDescription: (b) => renderHostPrimitives(b, { host: 'codex', table }),
    })
    expect(roles.length).toBeGreaterThan(0)
    for (const role of roles) expect(role.toml).not.toContain('{{ host.')

    const deliver = roles.find((r) => r.roleName === 'harnessed-task-deliver')
    expect(readEmittedToml(deliver?.toml ?? '').description).toContain('multi-agent formation')

    const multispec = roles.find((r) => r.roleName === 'harnessed-verify-multispec')
    expect(multispec).toBeDefined()
    const body = readEmittedToml(multispec?.toml ?? '').developer_instructions ?? ''
    // host-primitives.yaml codex column: spawn_subagent → `spawn_agent`,
    // send_message → `send_input`, team.singular → `multi-agent formation`.
    expect(body).toContain('spawn_agent')
    expect(body).toContain('send_input')
    expect(body).toContain('multi-agent formation')
    expect(body).not.toContain('SendMessage')
  })

  it('an UNRENDERED registry would have leaked the placeholders (negative control)', async () => {
    const roles = buildCodexAgentRoles(await loadRolePrompts(WORKFLOWS_DIR, 'en'))
    expect(roles.some((r) => r.toml.includes('{{ host.'))).toBe(true)
  })
})

describe('install / uninstall round trip — never touch a foreign role', () => {
  const dirs: string[] = []
  afterEach(async () => {
    for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true })
  })
  async function tmp(): Promise<string> {
    const d = await mkdtemp(join(tmpdir(), 'harnessed-codex-agents-'))
    dirs.push(d)
    return d
  }

  it('writes, discovers and removes only its own files', async () => {
    const home = await tmp()
    const agents = codexAgentsDir(home)
    await mkdir(agents, { recursive: true })
    await writeFile(join(agents, 'gsd-planner.toml'), 'name = "gsd-planner"\n', 'utf8')

    const roles = buildCodexAgentRoles({ 'task-code': rp(), 'verify-qa': rp() })
    const written = await writeCodexAgentRoles(agents, roles)
    expect(written.written).toHaveLength(2)
    expect(written.skipped).toEqual([])
    expect((await readdir(agents)).sort()).toEqual([
      'gsd-planner.toml',
      'harnessed-task-code.toml',
      'harnessed-verify-qa.toml',
    ])

    // Idempotent: a second pass overwrites its own files and still writes 2.
    expect((await writeCodexAgentRoles(agents, roles)).written).toHaveLength(2)

    const found = await discoverCodexAgentRoleFiles(agents)
    expect(found.map((f) => f.replace(`${agents}\\`, '').replace(`${agents}/`, ''))).toEqual([
      'harnessed-task-code.toml',
      'harnessed-verify-qa.toml',
    ])
    for (const f of found) await rm(f, { force: true })
    expect(await readdir(agents)).toEqual(['gsd-planner.toml'])
  })

  it('creates the agents dir when codex has never made one', async () => {
    const agents = codexAgentsDir(await tmp())
    await writeCodexAgentRoles(agents, buildCodexAgentRoles({ 'task-code': rp() }))
    expect(await readdir(agents)).toEqual(['harnessed-task-code.toml'])
  })

  it('refuses to overwrite a prefixed file that is not harnessed-owned', async () => {
    const agents = codexAgentsDir(await tmp())
    await mkdir(agents, { recursive: true })
    const foreign = join(agents, 'harnessed-task-code.toml')
    await writeFile(foreign, 'name = "harnessed-task-code"\n# hand written\n', 'utf8')

    const r = await writeCodexAgentRoles(agents, buildCodexAgentRoles({ 'task-code': rp() }))
    expect(r.written).toEqual([])
    expect(r.skipped).toHaveLength(1)
    expect(await readFile(foreign, 'utf8')).toContain('# hand written')
    expect(await discoverCodexAgentRoleFiles(agents)).toEqual([])
  })

  it('discovering a missing dir is empty, not an error', async () => {
    expect(await discoverCodexAgentRoleFiles(join(await tmp(), 'nope', 'agents'))).toEqual([])
  })
})
