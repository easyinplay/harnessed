// External review M15 — on codex the cc-plugin idempotency probe could never
// return true (isPluginRegistered knew only Claude Code's JSON registries). The
// fix read `[plugins."<p>@<m>"]` headers out of ~/.codex/config.toml; v16.0 Phase
// 64 (R6, ADR 0041) moved that probe to `codex plugin list` so harnessed code no
// longer reads config.toml at all — see tests/installers/codexPlugins.test.ts.

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Phase 62 follow-up — host-verified on codex-cli 0.154.0: the preset marketplace
// is `openai-api-curated`; `codex plugin add superpowers@openai-curated` fails with
// "plugin `superpowers` was not found in marketplace `openai-curated`". The shipped
// shell checks must also not match the "not installed" rows `codex plugin list`
// prints for every available plugin.
describe('manifests/tools/superpowers.yaml — codex override matches real codex', () => {
  const LIST_NOT_INSTALLED =
    'superpowers@openai-api-curated                   not installed           C:\\x\\superpowers'
  const LIST_INSTALLED =
    'superpowers@openai-api-curated                   installed, enabled  1dc19589  C:\\x\\superpowers'

  async function codexOverride() {
    const { readFileSync } = await import('node:fs')
    const { validateManifestFile } = await import('../../src/manifest/validate.js')
    const path = join(process.cwd(), 'manifests', 'tools', 'superpowers.yaml')
    const v = validateManifestFile(readFileSync(path, 'utf8'), path)
    if (!v.ok) throw new Error(`superpowers.yaml invalid: ${v.errors[0]?.message}`)
    const codex = v.manifest.spec.harness_overrides?.codex
    if (!codex) throw new Error('no codex override')
    return codex
  }

  /** The ERE inside `... | grep -qE '<re>'` (or a bare `grep -q <word>`). */
  function listPattern(cmd: string): RegExp {
    const quoted = /grep -qE? '([^']+)'/.exec(cmd)
    const bare = /grep -qE? (\S+)\s*$/.exec(cmd)
    const src = quoted?.[1] ?? bare?.[1]
    if (!src) throw new Error(`no list pattern in: ${cmd}`)
    return new RegExp(src)
  }

  it('installs from the marketplace codex actually has', async () => {
    const codex = await codexOverride()
    expect(codex.install.cmd).toBe('codex plugin add superpowers@openai-api-curated')
  })

  it('idempotent_check and verify match an installed row and NOT a "not installed" row', async () => {
    const codex = await codexOverride()
    const checks = [
      (codex.install as { idempotent_check?: string }).idempotent_check,
      codex.verify?.cmd,
    ]
    for (const cmd of checks) {
      expect(cmd).toBeDefined()
      const re = listPattern(cmd as string)
      expect(re.test(LIST_INSTALLED)).toBe(true)
      expect(re.test(LIST_NOT_INSTALLED)).toBe(false)
    }
  })
})
