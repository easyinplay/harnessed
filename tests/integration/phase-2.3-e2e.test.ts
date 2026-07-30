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
    // 4.32.22 final — chrome-devtools-mcp lives on as an optional fallback
    // (manifests/optional/, either/or with ecc bonus tier), no longer a tools/
    // Wave 1 base manifest. Wave 1 base survivors + the optional fallback.
    const wave1 = [
      'manifests/skill-packs/design-taste-frontend.yaml',
      'manifests/tools/playwright-test.yaml',
      'manifests/optional/chrome-devtools-mcp.yaml',
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

  // 4.34.x (T2.7) — Link 5 INVERTED. It used to assert the upstream
  // `karpathy-skills` manifest shipped alongside the local SKILL.md. That plugin
  // is now dropped: the karpathy heuristics were already fully internalized as
  // workflows/disciplines/karpathy.yaml (referenced by every workflow's
  // `disciplines_applied`, injected via buildDisciplinesSection), and the repo
  // had zero call sites for the upstream slash command. The cell now guards the
  // REMOVAL — the manifest must stay gone and the bundled discipline must
  // remain the (self-contained) carrier.
  it('Link 5 — karpathy internalized: upstream manifest dropped, bundled discipline carries it', () => {
    const manifestYaml = join(ROOT, 'manifests', 'skill-packs', 'karpathy-skills.yaml')
    expect(
      existsSync(manifestYaml),
      'karpathy-skills.yaml must stay deleted (T2.7 — plugin was redundant)',
    ).toBe(false)

    const discipline = join(ROOT, 'workflows', 'disciplines', 'karpathy.yaml')
    expect(existsSync(discipline), 'bundled karpathy discipline is the replacement').toBe(true)
    const yaml = readFileSync(discipline, 'utf8')
    // the 2 rules added as the precondition for dropping the plugin
    expect(yaml).toMatch(/id:\s*trust-internal-code/)
    expect(yaml).toMatch(/id:\s*no-comments-default/)
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
