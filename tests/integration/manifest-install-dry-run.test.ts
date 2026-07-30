// Phase 2.3 T1.6 — install dry-run e2e for the 5 NEW Wave 1 adapter manifests.
//
// Acceptance bar (task_plan.md L575-579):
//   - 5 NEW manifest 全 `harnessed install <name> --dry-run --apply` exit 0
//     OR aborted: user-cancel (dry-run-only path returns aborted before mutation)
//   - install cmd preview 含正确 method (git-clone-with-setup / npx-skill-installer
//     / mcp-stdio-add)
//   - 0 实际副作用 (no mutation to ~/.claude/skills/ or .mcp.json under sandbox cwd)
//
// Strategy: load each manifest from disk via validateManifestFile (proves schema
// valid), then dispatch through runInstall in dry-run mode (apply: false). We
// assert each installer returns either { ok: true } (no-op preview) OR
// { aborted: true, reason: 'user-cancel' } — both indicate that:
//   1. Schema validation passed
//   2. Installer dispatch table routed to the correct method
//   3. Preflight / cmd parsing / arg construction succeeded
//   4. No spawn was invoked (apply: false short-circuits the actual install)
//
// We do NOT mock spawn here — the dry-run path in each installer is designed
// to short-circuit before spawning. This is an integration test that exercises
// the real dispatch + real schema validate + real preflight + real diff render.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runInstall } from '../../src/installers/index.js'
import type { InstallOpts } from '../../src/installers/lib/types.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

interface DryRunCase {
  name: string
  yamlPath: string
  expectedMethod:
    | 'git-clone-with-setup'
    | 'npx-skill-installer'
    | 'mcp-stdio-add'
    | 'mcp-http-add'
    | 'cc-plugin-marketplace'
    | 'npm-cli'
}

// 5 NEW adapters from Phase 2.3 Wave 1 (T1.1-T1.5).
// Each row asserts: (a) schema valid (b) installer dispatch to expected method
// (c) dry-run path returns ok/aborted (no spawn, no side-effects).
const CASES: DryRunCase[] = [
  {
    // v4.11 — anthropic frontend-design (git-clone) swapped for design-taste-frontend
    // (Leonxlnx/taste-skill, npx-skill-installer cross-agent anti-slop).
    name: 'design-taste-frontend',
    yamlPath: 'manifests/skill-packs/design-taste-frontend.yaml',
    expectedMethod: 'npx-skill-installer',
  },
  {
    name: 'playwright-test',
    yamlPath: 'manifests/tools/playwright-test.yaml',
    expectedMethod: 'npx-skill-installer',
  },
  // 4.32.22 final — chrome-devtools-mcp back as an OPTIONAL fallback manifest
  // (manifests/optional/, mcp-stdio-add @^1.6.0): either/or with ecc (bonus
  // tier; ECC bundles the same-name connector — doctor's `ecc` check warns on
  // dual-install). Restores dry-run dispatch coverage for the manifest.
  {
    name: 'chrome-devtools-mcp',
    yamlPath: 'manifests/optional/chrome-devtools-mcp.yaml',
    expectedMethod: 'mcp-stdio-add',
  },
  {
    name: 'ui-ux-pro-max',
    yamlPath: 'manifests/skill-packs/ui-ux-pro-max.yaml',
    // Originally git-clone-with-setup (midwayjs/midway v4-next self-pack);
    // 4.32.21 migrated to cc-plugin-marketplace — official
    // nextlevelbuilder/ui-ux-pro-max-skill plugin supersedes the git self-pack
    // (kills the dual-load of plugin skill + user-skill copy).
    expectedMethod: 'cc-plugin-marketplace',
  },
  // Phase 2.3 W6 DI-1 hotfix — karpathy-skills.yaml schema-only validation
  // moved to dedicated test below (not in 5-manifest dry-run dispatch list).
  // Reason: karpathy's install.cmd is local `cp -R skills/karpathy-baseline` (no
  // actual git clone — sourced via repo-local file system), but gitCloneWithSetup
  // installer's preflight (gitRevParseHead) parses cmd for `git clone <url> <dest>`
  // and rejects custom cmds. Schema-level fix (DI-1) preserved; full installer-
  // level support requires a NEW `local-copy` install_type/method (deferred v0.2.4+).
]

const DRY_RUN_OPTS: InstallOpts = {
  apply: false,
  dryRun: true,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}

describe('Phase 2.3 Wave 1 — 5 NEW adapter manifest install dry-run e2e', () => {
  for (const c of CASES) {
    it(`${c.name} — schema valid + dispatch ${c.expectedMethod} + dry-run no-mutation`, async () => {
      // (1) Schema validate
      const yamlPath = resolve(process.cwd(), c.yamlPath)
      const yamlSrc = readFileSync(yamlPath, 'utf8')
      const v = validateManifestFile(yamlSrc, c.yamlPath)
      expect(v.ok, `${c.name} schema validate must pass`).toBe(true)
      if (!v.ok) return

      // (2) Manifest reports the expected install method
      expect(v.manifest.spec.install.method).toBe(c.expectedMethod)

      // (3) Dispatch through runInstall in dry-run mode — must not throw.
      // Result shape:
      //   - { ok: true } : installer recognized no-op (some methods return ok
      //                    on dry-run after diff render without prompting)
      //   - { aborted: true, reason: 'user-cancel' } : confirmAt() returned
      //                    abort because we passed apply: false + nonInteractive
      //   - { ok: false, ... } : preflight / parsing failure (should NOT happen
      //                    for valid manifests with resolved URLs)
      const result = await runInstall(v.manifest, DRY_RUN_OPTS)

      // Accept either ok-true (npx-skill-installer dry-run returns ok after diff)
      // or aborted-user-cancel (other installers prompt then abort with no --apply).
      const accepted =
        ('ok' in result && result.ok === true) || ('aborted' in result && result.aborted === true)

      if (!accepted) {
        // ok: false case — emit diagnostic to surface the real failure
        const errMsg =
          'error' in result
            ? `${result.error.path}: ${result.error.message}`
            : JSON.stringify(result)
        expect.fail(`${c.name} dry-run failed: ${errMsg}`)
      }
      expect(accepted).toBe(true)
    })
  }

  it('all 5 manifests share Wave 1 category invariants (design | content | testing)', () => {
    const categories = CASES.map((c) => {
      const yamlSrc = readFileSync(resolve(process.cwd(), c.yamlPath), 'utf8')
      const v = validateManifestFile(yamlSrc, c.yamlPath)
      if (!v.ok) throw new Error(`${c.name} schema fail`)
      return { name: c.name, category: v.manifest.spec.category }
    })

    // Phase 2.3 Wave 1 acceptance: each manifest lands in one of the 3 extension
    // categories (design / content / testing). No engineering / search leakage.
    const allowed = new Set(['design', 'content', 'testing'])
    for (const c of categories) {
      expect(
        allowed.has(c.category),
        `${c.name} category=${c.category} must be in ${[...allowed].join('|')}`,
      ).toBe(true)
    }

    // Distribution sanity: design >= 1, testing >= 1 (playwright + the restored
    // chrome-devtools optional-fallback case, both category testing).
    const dist: Record<string, number> = {}
    for (const c of categories) dist[c.category] = (dist[c.category] ?? 0) + 1
    expect(dist.design ?? 0).toBeGreaterThanOrEqual(1)
    expect(dist.testing ?? 0).toBeGreaterThanOrEqual(1)
  })

  // 4.34.x (T2.7) — the karpathy-skills schema sentinel is GONE with its
  // manifest. The plugin was redundant: the heuristics live in
  // workflows/disciplines/karpathy.yaml (all 28 workflows reference it via
  // `disciplines_applied`) and the repo never invoked the upstream slash
  // command. What survives is a removal guard so the dependency can't creep
  // back in unnoticed; the discipline-side contract is covered by
  // tests/workflow/karpathy-discipline.test.ts.
  it('karpathy-skills — upstream manifest stays removed (T2.7 dependency drop)', () => {
    expect(existsSync(resolve(process.cwd(), 'manifests/skill-packs/karpathy-skills.yaml'))).toBe(
      false,
    )
  })
})
