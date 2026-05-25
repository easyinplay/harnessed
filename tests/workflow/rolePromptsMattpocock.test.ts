// v3.6.0 Phase 1 Wave 3 — assert mattpocock methodology presence in the
// shipped workflows/role-prompts.yaml for the 3 enriched sub-workflow entries
// (task-clarify / task-code / discuss-subtask).
//
// Pattern: read the production yaml via loadRolePrompts(PACKAGE_ROOT/workflows)
// (sister tests/workflow/disciplineLoader.test.ts uses the same PACKAGE_ROOT
// = process.cwd() pattern for shipped-yaml fixtures).
//
// These cells are the regression guard for license + methodology integrity:
// if a future maintainer rewrites role-prompts.yaml and accidentally drops
// the mattpocock paraphrase or the attribution comment, CI fails here.
//
// Source pin (must match THIRD-PARTY-NOTICES.md + .planning/v3.6.0/mattpocock-source/SHA.txt):
//   https://github.com/mattpocock/skills @ b8be62ffacb0118fa3eaa29a0923c87c8c11985c

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRolePrompts } from '../../src/cli/lib/generateCommands.js'

const PACKAGE_ROOT = process.cwd()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')
const YAML_PATH = join(WORKFLOWS_DIR, 'role-prompts.yaml')

describe('role-prompts.yaml — mattpocock methodology inline (v3.6.0 Phase 1)', () => {
  it('cell 1 — task-clarify responsibility contains grill-with-docs methodology keywords', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    const entry = prompts['task-clarify']
    expect(entry).toBeDefined()
    const r = entry?.responsibility ?? ''
    // Attribution comment + 3 core methodology phrases (paraphrased)
    expect(r).toContain('grill-with-docs methodology paraphrased from mattpocock/skills')
    expect(r).toContain('CONTEXT.md')
    expect(r).toContain('terminology')
    expect(r).toContain('ADR')
  })

  it('cell 2 — task-clarify checklist contains 4 grill-with-docs items', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    const checklist = prompts['task-clarify']?.checklist ?? []
    // checklist length grew from 6 → 10 (4 new grill-with-docs items)
    expect(checklist.length).toBeGreaterThanOrEqual(10)
    const joined = checklist.join('\n')
    expect(joined).toMatch(/Cross-reference.*CONTEXT\.md/i)
    expect(joined).toMatch(/Sharpen vague/i)
    expect(joined).toMatch(/ADR delta inline/i)
    expect(joined).toMatch(/doc-diff/i)
  })

  it('cell 3 — task-code checklist contains zoom-out + improve-arch methodology items', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    const checklist = prompts['task-code']?.checklist ?? []
    // checklist length grew from 7 → 12 (1 zoom-out + 4 improve-arch items)
    expect(checklist.length).toBeGreaterThanOrEqual(12)
    const joined = checklist.join('\n')
    // zoom-out methodology phrase
    expect(joined).toMatch(/zoom-out:.*layer of abstraction/i)
    expect(joined).toMatch(/CONTEXT\.md domain glossary/i)
    // improve-codebase-architecture methodology phrases
    expect(joined).toMatch(/improve-arch.*deepening opportunities/i)
    expect(joined).toMatch(/deletion test/i)
    expect(joined).toMatch(/shallow/i)
    expect(joined).toMatch(/before\/after report/i)
  })

  it('cell 4 — discuss-subtask responsibility contains grill-me methodology keywords', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    const r = prompts['discuss-subtask']?.responsibility ?? ''
    expect(r).toContain('grill-me methodology paraphrased from mattpocock/skills')
    expect(r).toMatch(/relentlessly/i)
    expect(r).toMatch(/ONE at a time/i)
    expect(r).toMatch(/explore the codebase/i)
  })

  it('cell 5 — yaml header carries the mattpocock attribution comment block', () => {
    // loadRolePrompts strips comments (they're not in the parsed schema), so
    // check the raw file contents for the attribution + SHA pin. This is the
    // license-compliance regression guard.
    const raw = readFileSync(YAML_PATH, 'utf8')
    expect(raw).toContain('Upstream attributions (v3.6.0 Phase 1)')
    expect(raw).toContain('https://github.com/mattpocock/skills')
    expect(raw).toContain('b8be62ffacb0118fa3eaa29a0923c87c8c11985c')
    expect(raw).toContain('MIT License')
    expect(raw).toContain('THIRD-PARTY-NOTICES.md')
  })
})
