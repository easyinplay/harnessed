// Phase 56 — `claude plugin install` pins a version into a versioned cache dir
// and never re-resolves it, so the four cc-plugin-marketplace components drift
// behind with no signal anywhere. This check is the only place harnessed compares
// a genuinely DETECTED version (the plugin registry's `version`, read off disk)
// against a recorded one — Phase 55 established that the installer-state layer
// cannot, because every `updateInstalled` caller passes a manifest-declared value.

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkPluginStaleness } from '../../src/cli/lib/check-plugin-staleness.js'

const REGISTRY = '/home/.claude/plugins/installed_plugins.json'
const ASSETS = '/pkg'

/** Minimal cc-plugin-marketplace manifest yaml. */
function manifest(name: string, recorded: string, method = 'cc-plugin-marketplace'): string {
  return [
    'apiVersion: harnessed/v1',
    'kind: Manifest',
    'metadata:',
    `  name: ${name}`,
    'spec:',
    '  install:',
    `    method: ${method}`,
    '  upstream_health:',
    `    last_known_good_version: "${recorded}"`,
  ].join('\n')
}

function registry(entries: Record<string, string>): string {
  const plugins: Record<string, unknown[]> = {}
  for (const [key, version] of Object.entries(entries)) {
    plugins[key] = [{ scope: 'user', installPath: `/cache/${version}`, version }]
  }
  return JSON.stringify({ version: 2, plugins })
}

/** One flat manifests/ dir holding `files`, plus a registry. Paths are built with
 *  `join` so the fixture matches the production walker on Windows too. */
function deps(files: Record<string, string>, registryRaw: string | null) {
  const dir = join(ASSETS, 'manifests')
  const byPath = new Map(Object.entries(files).map(([base, raw]) => [join(dir, base), raw]))
  return {
    assetsRoot: ASSETS,
    registryPath: REGISTRY,
    isDir: (p: string) => p === dir,
    listDir: (p: string) => (p === dir ? Object.keys(files) : null),
    readText: (p: string) => (p === REGISTRY ? registryRaw : (byPath.get(p) ?? null)),
  }
}

describe('checkPluginStaleness', () => {
  it('no plugin registry (codex) → pass, nothing read', () => {
    const r = checkPluginStaleness({
      registryPath: null,
      readText: () => {
        throw new Error('must not read')
      },
    })
    expect(r.status).toBe('pass')
    expect(r.message).toContain('no plugin registry')
  })

  it('unreadable registry → pass (fail-soft, never blocks the other checks)', () => {
    const r = checkPluginStaleness(deps({}, null))
    expect(r.status).toBe('pass')
    expect(r.message).toContain('unreadable')
  })

  it('malformed registry JSON → pass', () => {
    const r = checkPluginStaleness(deps({}, '{not json'))
    expect(r.status).toBe('pass')
    expect(r.message).toContain('unreadable')
  })

  it('installed version behind the record → warn naming both versions', () => {
    const r = checkPluginStaleness(
      deps(
        { 'superpowers.yaml': manifest('superpowers', '6.3.0') },
        registry({ 'superpowers@superpowers-marketplace': '5.1.0' }),
      ),
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('superpowers 5.1.0 → 6.3.0')
    expect(r.fix).toBe('claude plugin update superpowers')
  })

  it('installed version equal to the record → pass', () => {
    const r = checkPluginStaleness(
      deps(
        { 'superpowers.yaml': manifest('superpowers', '6.3.0') },
        registry({ 'superpowers@superpowers-marketplace': '6.3.0' }),
      ),
    )
    expect(r.status).toBe('pass')
    expect(r.message).toContain('1 marketplace plugin(s) current')
  })

  it('installed version AHEAD of the record → pass (the record is what lags)', () => {
    const r = checkPluginStaleness(
      deps(
        { 'superpowers.yaml': manifest('superpowers', '6.3.0') },
        registry({ 'superpowers@superpowers-marketplace': '6.4.0' }),
      ),
    )
    expect(r.status).toBe('pass')
  })

  it('manifest present but plugin not installed → not counted', () => {
    const r = checkPluginStaleness(
      deps({ 'superpowers.yaml': manifest('superpowers', '6.3.0') }, registry({})),
    )
    expect(r.status).toBe('pass')
    expect(r.message).toContain('no marketplace plugins installed')
  })

  it('non-marketplace install method is ignored even when installed', () => {
    const r = checkPluginStaleness(
      deps(
        { 'ctx7.yaml': manifest('ctx7', '0.5.11', 'npm-cli') },
        registry({ 'ctx7@somewhere': '0.4.0' }),
      ),
    )
    expect(r.status).toBe('pass')
    expect(r.message).toContain('no marketplace plugins installed')
  })

  it('zh-Hans sibling is skipped, so a plugin is never double-counted', () => {
    const r = checkPluginStaleness(
      deps(
        {
          'superpowers.yaml': manifest('superpowers', '6.3.0'),
          'superpowers.zh-Hans.yaml': manifest('superpowers', '6.3.0'),
        },
        registry({ 'superpowers@superpowers-marketplace': '5.1.0' }),
      ),
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('1/1 marketplace plugin(s) behind')
  })

  it('several behind at once → all named, fix chains one update per plugin', () => {
    const r = checkPluginStaleness(
      deps(
        {
          'superpowers.yaml': manifest('superpowers', '6.3.0'),
          'ecc.yaml': manifest('ecc', '2.2.1'),
          'ui-ux-pro-max.yaml': manifest('ui-ux-pro-max', '2.15.0'),
        },
        registry({
          'superpowers@superpowers-marketplace': '5.1.0',
          'ecc@ecc': '2.1.0',
          'ui-ux-pro-max@ui-ux-pro-max-skill': '2.15.0',
        }),
      ),
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('2/3 marketplace plugin(s) behind')
    expect(r.message).toContain('superpowers 5.1.0 → 6.3.0')
    expect(r.message).toContain('ecc 2.1.0 → 2.2.1')
    expect(r.message).not.toContain('ui-ux-pro-max')
    expect(r.fix).toBe('claude plugin update superpowers && claude plugin update ecc')
  })

  it('unparseable record version → pass, not a false warn', () => {
    // compareVersions returns 'unknown' for a non-X.Y.Z string (e.g. the gstack
    // 4-segment form or a git sha); unknown must never be reported as behind.
    const r = checkPluginStaleness(
      deps({ 'x.yaml': manifest('x', 'main-3cca18b3') }, registry({ 'x@m': '1.0.0' })),
    )
    expect(r.status).toBe('pass')
  })

  it('malformed manifest yaml is skipped, siblings still checked', () => {
    const r = checkPluginStaleness(
      deps(
        {
          'broken.yaml': 'metadata: [unclosed',
          'superpowers.yaml': manifest('superpowers', '6.3.0'),
        },
        registry({ 'superpowers@superpowers-marketplace': '5.1.0' }),
      ),
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('superpowers 5.1.0 → 6.3.0')
  })
})
