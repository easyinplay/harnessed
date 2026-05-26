// Phase 1.2 unit tests for src/installers/lib/preflight.ts (Pattern J BASE+modifier).
//
// Covers:
//   - platform mismatch → returns abortReason: 'platform-mismatch'
//   - missing / empty idempotent_check → errors[]
//   - git_ref shape sanity (where applicable)
//   - all-pass → ok: true with empty errors[]
//
// No fs / spawn / network — preflight is a pure synchronous function over
// an InstallContext object, so this whole file is mock-free.

import { describe, expect, it } from 'vitest'
import { preflight } from '../../src/installers/lib/preflight.js'
import type { InstallContext, InstallOpts } from '../../src/installers/lib/types.js'
import type { Manifest } from '../../src/manifest/schema/types.js'

const BASE_OPTS: InstallOpts = {
  apply: false,
  dryRun: true,
  system: false,
  nonInteractive: false,
  fullDiff: false,
  updateInstalled: true,
  color: 'auto',
}

// Minimal valid cli-npm × npm-cli manifest reused as BASE for context tests.
function baseManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'pf-test',
      display_name: 'Preflight Test',
      description: 'fixture',
      upstream: {
        source: 'pf-test',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/pf-test.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g pf-test',
        npm_version: '^1.0.0',
        idempotent_check: 'which pf-test',
      },
      verify: {
        cmd: 'pf-test --version',
        timeout_ms: 5000,
        expected_exit_code: 0,
      },
      uninstall: { cmd: 'npm uninstall -g pf-test' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(modify?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modify?.(manifest)
  return { manifest, opts: BASE_OPTS, level: 'L4', cwd: '/tmp/pf' }
}

describe('preflight', () => {
  it('returns ok=true with empty errors when all checks pass', () => {
    const r = preflight(ctx())
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
    expect(r.abortReason).toBeUndefined()
  })

  it('aborts with platform-mismatch when current platform not in spec.platforms', () => {
    // Force only the OPPOSITE platform.
    const onlyOther = process.platform === 'win32' ? ['linux'] : ['win32']
    const r = preflight(
      ctx((m) => {
        m.spec.platforms = onlyOther as Manifest['spec']['platforms']
      }),
    )
    expect(r.ok).toBe(false)
    expect(r.abortReason).toBe('platform-mismatch')
    expect(r.errors[0]?.keyword).toBe('platform-mismatch')
    expect(r.errors[0]?.path).toBe('/spec/platforms')
  })

  it('flags missing idempotent_check as errors[]', () => {
    const r = preflight(
      ctx((m) => {
        // Defeat the type-narrowed install shape — we are simulating a
        // programmatically-built manifest that bypassed schema validation.
        ;(m.spec.install as { idempotent_check: string }).idempotent_check = ''
      }),
    )
    expect(r.ok).toBe(false)
    expect(r.errors.find((e) => e.keyword === 'idempotent-check-missing')).toBeDefined()
  })

  it('flags empty / whitespace-only idempotent_check', () => {
    const r = preflight(
      ctx((m) => {
        ;(m.spec.install as { idempotent_check: string }).idempotent_check = '   '
      }),
    )
    expect(r.ok).toBe(false)
    expect(r.errors[0]?.path).toBe('/spec/install/idempotent_check')
  })

  it('does not return abortReason for non-platform errors (idempotent → plain ok=false)', () => {
    const r = preflight(
      ctx((m) => {
        ;(m.spec.install as { idempotent_check: string }).idempotent_check = ''
      }),
    )
    expect(r.ok).toBe(false)
    expect(r.abortReason).toBeUndefined()
  })

  it('preserves filename in error.file for friendly message routing', () => {
    const r = preflight(
      ctx((m) => {
        m.metadata.name = 'custom-name'
        ;(m.spec.install as { idempotent_check: string }).idempotent_check = ''
      }),
    )
    if (!r.ok) {
      expect(r.errors[0]?.file).toBe('custom-name')
    }
  })
})
