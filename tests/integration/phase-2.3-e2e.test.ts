// Phase 2.3 Wave 5 T5.3 — end-to-end 全链路 smoke test.
//
// v3.4.4 Phase 6 Wave 3b — trimmed from 5-link to 4-link smoke after
// src/routing/ deletion (Link 3 + Link 4 cells removed; their target modules
// loadDecisionRules + arbitrateWithRedirect died with the routing engine).
// Surviving cells (4 routing-agnostic): manifest install / EE-5 CLI / karpathy
// SKILL-ONLY / Cross-link compose. Phase 2.3 archeology: original 5-link list
// was — (1) manifest install dry-run, (2) EE-5 CLI gate, (3) routing 30-sample
// loadDecisionRules [DELETED v3.4.4 P6], (4) arbitrate-redirect [DELETED v3.4.4
// P6], (5) karpathy SKILL-ONLY ship.
//
// task_plan.md L1199-1209 — verifies remaining 4 链路 全 ship + import-resolves
// + minimal API contract smoke. Each link has its own dedicated test file:
//   1. manifest install dry-run — tests/integration/manifest-install-dry-run.test.ts
//   2. EE-5 CLI gate           — tests/cli/manifest-add-ee5.test.ts
//   5. karpathy SKILL.md ship  — skills/karpathy-baseline/SKILL.md (50L D-02)
//
// T5.3 is the CROSS-LINK smoke verify: each artifact loadable + minimal compose
// (e.g. EE-5 CLI registers in same Command tree as install CLI). karpathy
// YAGNI: 1 test per link verifying artifact presence + contract surface, NOT
// re-running per-link unit/integration suites.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from 'commander'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

describe('Phase 2.3 e2e 4-link smoke (Wave 5 T5.3; Link 3+4 deleted v3.4.4 P6)', () => {
  it('Link 1 — manifest install dry-run: 5 NEW Wave 1 manifests on disk + schema-valid loadable', async () => {
    const { validateManifestFile } = await import('../../src/manifest/validate.js')
    const wave1 = [
      'manifests/skill-packs/frontend-design.yaml',
      'manifests/skill-packs/anthropics-skills-pptx.yaml',
      'manifests/skill-packs/anthropics-skills-slide-deck.yaml',
      'manifests/tools/playwright-test.yaml',
      'manifests/tools/chrome-devtools-mcp.yaml',
    ]
    for (const p of wave1) {
      const abs = join(ROOT, p)
      expect(existsSync(abs), `${p} must exist (Wave 1 T1.1-T1.5 ship)`).toBe(true)
      const v = validateManifestFile(readFileSync(abs, 'utf8'), abs)
      expect(v.ok, `${p} must schema-validate`).toBe(true)
    }
  })

  it('Link 2 — EE-5 CLI: registerManifestAdd attaches manifest-add subcommand', async () => {
    const { registerManifestAdd } = await import('../../src/cli/manifest-add.js')
    const program = new Command()
    registerManifestAdd(program)
    const cmd = program.commands.find((c) => c.name() === 'manifest-add')
    expect(cmd).toBeDefined()
    expect(cmd?.description()).toContain('EE-5')
  })

  // Link 3 (routing 30-sample loadDecisionRules) + Link 4 (arbitrate-redirect
  // arbitrateWithRedirect) DELETED v3.4.4 Phase 6 Wave 3b — both modules died
  // with src/routing/ deletion. Archeology preserved in git history; resurrect
  // via git revert of Phase 6 Wave 3a commit + this cell deletion if needed.

  it('Link 5 — karpathy SKILL-ONLY: SKILL.md + manifest co-shipped + D-02 SKILL-ONLY surface', () => {
    // T5.3 verifies ship-artifact reality of all 5 links. Phase 2.3 W6 DI-1
    // hotfix applied — karpathy-skills.yaml now schema-valid (git_ref pinned to
    // 40-hex schema-compliant placeholder + install_type: git per ADR 0007 1:N
    // closure for git-clone-with-setup method). Full schema validation now
    // possible (see tests/integration/manifest-install-dry-run.test.ts
    // "karpathy-skills schema-only regression sentinel" for the dedicated
    // schema-validate sentinel).
    //
    // Note: install.cmd still uses local `cp -R skills/karpathy-baseline ~/.claude/`
    // — git_ref + git-clone-with-setup are semantic placeholders for the local-copy
    // install path (no actual git fetch). Full installer-level local-copy support
    // deferred to v0.2.4+ (new `local-copy` install_type/method).
    const skillMd = join(ROOT, 'skills', 'karpathy-baseline', 'SKILL.md')
    const manifestYaml = join(ROOT, 'manifests', 'skill-packs', 'karpathy-skills.yaml')
    expect(existsSync(skillMd), 'karpathy-baseline/SKILL.md ship (T2.3 0ccb58d)').toBe(true)
    expect(existsSync(manifestYaml), 'karpathy-skills.yaml REWRITE (T2.4 b97677d)').toBe(true)
    // D-02 SKILL-ONLY surface verify (raw yaml string contains markers — preserves
    // the SKILL-ONLY ship-artifact reality check; install_type post-DI-1 = `git`):
    const yaml = readFileSync(manifestYaml, 'utf8')
    expect(yaml).toMatch(/install_type:\s*git/) // DI-1 hotfix Phase 2.3 W6
    expect(yaml).toMatch(/skills\/karpathy-baseline/)
    expect(yaml).toMatch(/strip-claude-md-section\.mjs/) // D-02 migration cleanup step
  })

  it('Cross-link compose: EE-5 + install CLI register on same Command tree without collision', async () => {
    const { registerManifestAdd } = await import('../../src/cli/manifest-add.js')
    const program = new Command()
    registerManifestAdd(program)
    // Smoke: registering manifest-add must not break subsequent .command() adds
    program.command('install <name>').description('smoke install')
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('manifest-add')
    expect(names).toContain('install')
  })
})
