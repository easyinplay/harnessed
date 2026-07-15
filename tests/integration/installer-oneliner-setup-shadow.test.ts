// 4.32.1 — one-line installer text contract: consent-gated auto-setup + shadow
// guard. Regression trap for the dogfood bug where a fresh binary install left
// `harnessed setup` as a manual step, so it ran a *different* harnessed already
// on PATH (npm-global shadow) and reported a stale version ("版本不一样").
//
// No spawn harness exists for install.ps1 / install.sh (only the manual
// HARNESSED_INSTALLER_SOURCE_DIR rehearsal seam); these are text-content
// assertions guarding that the two fixes stay present and parity-matched across
// both installers. Deleting either fix (or letting the two scripts drift) fails
// here rather than silently shipping the regression.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const ps1 = readFileSync(join(REPO_ROOT, 'install.ps1'), 'utf8')
const sh = readFileSync(join(REPO_ROOT, 'install.sh'), 'utf8')

describe('one-line installer: consent-gated auto-setup', () => {
  it('install.ps1 runs setup by absolute path (not a bare `harnessed`)', () => {
    // & $BinPath setup — guarantees the freshly-installed build runs its setup.
    expect(ps1).toMatch(/&\s+\$BinPath\s+setup/)
    // gated behind the shared interactivity flag, not unconditional.
    expect(ps1).toMatch(/if\s*\(\$interactive\)/)
  })

  it('install.sh runs setup by absolute path, reading consent from /dev/tty', () => {
    expect(sh).toMatch(/"\$BIN_PATH"\s+setup/)
    // curl|bash occupies stdin with the script — prompt must read the terminal.
    expect(sh).toMatch(/<\s*\/dev\/tty/)
  })
})

describe('one-line installer: shadow guard', () => {
  it('install.ps1 detects a different harnessed shadowing the new binary', () => {
    expect(ps1).toMatch(/Get-Command\s+harnessed/)
    expect(ps1).toMatch(/\$existing\.Source\s+-ne\s+\$BinPath/)
    expect(ps1).toMatch(/npm uninstall -g harnessed/)
  })

  it('install.sh detects a different harnessed shadowing the new binary', () => {
    expect(sh).toMatch(/command -v harnessed/)
    expect(sh).toMatch(/"\$EXISTING"\s+!=\s+"\$BIN_PATH"/)
    expect(sh).toMatch(/npm uninstall -g harnessed/)
  })
})
