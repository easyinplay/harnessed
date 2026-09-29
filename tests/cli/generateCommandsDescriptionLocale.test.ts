// v16.0 Phase 65 tail — `prompt.description` renders off a SECOND, locale-matched table.
//
// Why two tables on this surface at all: the command BODY is an English template
// literal, so it must render off the `en` host-primitives table — the zh sibling
// localizes e.g. `spawn_subagent.plural` to `Task / Agent 工具`, which would splice
// Chinese into an English sentence. But `description` is the one field that comes
// from the LOCALIZED `role-prompts.<locale>.yaml`, so rendering it off the en table
// would do the mirror-image damage: an English codex gloss inside a Chinese sentence.
//
// These cells lock the wiring, not the wording: that `descriptionTable` is actually
// consulted for `description` and NOT for the body, and that omitting it reproduces
// the single-table behaviour every pre-Phase-65 caller had (which is what keeps the
// claude byte goldens in `tests/fixtures/render-golden/commands-claude-*.json` valid).

import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  type CommandRenderOptions,
  generateCommandFile,
} from '../../src/cli/lib/generateCommands.js'
import {
  type HostPrimitiveTable,
  loadHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import type { RolePrompt } from '../../src/workflow/rolePrompts.js'

// The body template references many primitives, so both tables start from the REAL
// en table and only override `team` — the one primitive these fixtures read. That
// also keeps the test honest: it proves the two tables are consulted separately, not
// that a hand-built stub happens to be wired in.
let REAL: HostPrimitiveTable

function tableWith(claudeText: string, codexText: string): HostPrimitiveTable {
  return { ...REAL, team: { default: { claude: claudeText, codex: codexText } } }
}

let BODY_TABLE: HostPrimitiveTable
let DESC_TABLE: HostPrimitiveTable

beforeAll(async () => {
  REAL = await loadHostPrimitives({
    workflowsDir: resolve(process.cwd(), 'workflows'),
    locale: 'en',
  })
  BODY_TABLE = tableWith('BODY_CLAUDE', 'BODY_CODEX')
  DESC_TABLE = tableWith('DESC_CLAUDE', 'DESC_CODEX')
})

/** An EXECUTION-shaped prompt whose description carries a host placeholder. */
const PROMPT: RolePrompt = {
  primary_cap: '',
  specialist: 'Test Engineer',
  responsibility: 'do the thing',
  checklist: ['step one'],
  severity: 'P0/P1/P2',
  description: 'escalate to {{ host.team }} when needed',
}

function render(name: string, hostRender?: CommandRenderOptions): string {
  return generateCommandFile(name, PROMPT, {}, new Set(), new Set(), hostRender).content
}

describe('generateCommandFile — description renders off the locale-matched table', () => {
  it('cell 1 — description takes descriptionTable, body keeps the en table', () => {
    const content = render('task-test', {
      host: 'claude',
      table: BODY_TABLE,
      descriptionTable: DESC_TABLE,
    })
    // Both the frontmatter `description:` line and the body's opening paragraph come
    // from prompt.description, so BOTH must show the description table's text.
    expect(content).toContain('description: "escalate to DESC_CLAUDE when needed"')
    expect(content).toContain('escalate to DESC_CLAUDE when needed')
    expect(content).not.toContain('BODY_CLAUDE')
  })

  it('cell 2 — the host column is honoured on the description table too', () => {
    const content = render('task-test', {
      host: 'codex',
      table: BODY_TABLE,
      descriptionTable: DESC_TABLE,
    })
    expect(content).toContain('escalate to DESC_CODEX when needed')
    expect(content).not.toContain('DESC_CLAUDE')
  })

  it('cell 3 — omitting descriptionTable falls back to the body table (pre-65 behaviour)', () => {
    const content = render('task-test', { host: 'claude', table: BODY_TABLE })
    expect(content).toContain('escalate to BODY_CLAUDE when needed')
  })

  it('cell 4 — frontmatter stays valid YAML after rendering (quoted, single line)', () => {
    const multiWord = tableWith('a multi-agent formation (repeated `spawn_agent`)', 'codex-side')
    const content = render('task-test', {
      host: 'claude',
      table: BODY_TABLE,
      descriptionTable: multiWord,
    })
    const line = content.split('\n').find((l) => l.startsWith('description: '))
    expect(line).toBeDefined()
    // JSON.stringify escaping is what makes backticks/parens/colons safe here.
    expect(line).toBe(
      'description: "escalate to a multi-agent formation (repeated `spawn_agent`) when needed"',
    )
  })

  it('cell 5 — an unresolvable placeholder in description throws (strict, like the body)', () => {
    const bad: RolePrompt = { ...PROMPT, description: 'see {{ host.nope }}' }
    expect(() =>
      generateCommandFile('task-test', bad, {}, new Set(), new Set(), {
        host: 'claude',
        table: BODY_TABLE,
        descriptionTable: DESC_TABLE,
      }),
    ).toThrow(/nope/)
  })
})
