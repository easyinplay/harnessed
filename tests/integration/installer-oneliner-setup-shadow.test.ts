// 4.32.1 — one-line installer text contract: consent-gated auto-setup + shadow
// guard. Regression trap for the dogfood bug where a fresh binary install left
// `harnessed setup` as a manual step, so it ran a *different* harnessed already
// on PATH (npm-global shadow) and reported a stale version ("版本不一样").
//
// Execution fixtures below use the existing local-source seam. Only the native
// binary boundary is mocked on Windows; install, checksum and cleanup are real.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const ps1 = readFileSync(join(REPO_ROOT, 'install.ps1'), 'utf8')
const sh = readFileSync(join(REPO_ROOT, 'install.sh'), 'utf8')

const windows = process.platform === 'win32'
const roots: string[] = []
const psQuote = (value: string) => `'${value.replaceAll("'", "''")}'`

function fixture(asset: string, content: string) {
  const root = mkdtempSync(join(tmpdir(), 'installer-oneliner-'))
  roots.push(root)
  const home = join(root, "user's home")
  const source = join(root, 'release')
  const scratch = join(root, 'scratch')
  for (const dir of [home, source, scratch]) mkdirSync(dir, { recursive: true })
  writeFileSync(join(source, asset), content)
  const hash = createHash('sha256').update(content).digest('hex')
  writeFileSync(join(source, `${asset}.sha256`), `${hash}  ${asset}\n`)
  const bin = windows
    ? join(home, 'harnessed', 'bin', 'harnessed.exe')
    : join(home, '.local', 'bin', 'harnessed')
  return { root, home, source, scratch, bin, log: join(root, 'calls.log') }
}

function assertInstalledAndClean(f: ReturnType<typeof fixture>, setup: boolean) {
  expect(existsSync(f.bin)).toBe(true)
  expect(readdirSync(f.scratch)).toEqual([])
  expect(readFileSync(f.log, 'utf8').trim().split(/\r?\n/)).toEqual(
    setup ? ['--version', 'setup'] : ['--version'],
  )
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

describe.skipIf(!windows)('PowerShell installer execution', () => {
  function run(
    engine: string,
    code: number,
    mode = 'accept',
    caught = false,
    nativeErrors = false,
  ) {
    const f = fixture('harnessed-windows-x64.exe', 'local native boundary fixture')
    const wrapper = join(f.root, 'wrapper.ps1')
    writeFileSync(
      wrapper,
      `
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Utility') -Force
$PSNativeCommandUseErrorActionPreference = $${nativeErrors}
function Read-Host([string]$Prompt) {
  if ($env:INSTALLER_TEST_MODE -eq 'ci') { throw 'unexpected consent prompt' }
  if ($Prompt -like '*user PATH*' -or $env:INSTALLER_TEST_MODE -eq 'decline') { return 'n' }
  return 'y'
}
Set-Item -Path ('Function:' + ${psQuote(f.bin)}) -Value {
  param($Command)
  Add-Content -LiteralPath $env:INSTALLER_TEST_LOG -Value $Command
  $global:LASTEXITCODE = 0
  if ($Command -eq '--version') { return '99.0.0' }
  if ($Command -ne 'setup') { throw 'unexpected native command' }
  $global:LASTEXITCODE = [int]$env:INSTALLER_TEST_CODE
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'base gstack fail 1'
    if ($PSNativeCommandUseErrorActionPreference) { throw 'simulated native error preference' }
  }
}
${caught ? 'try {' : ''}
Get-Content -Raw ${psQuote(join(REPO_ROOT, 'install.ps1'))} | Invoke-Expression
${caught ? '} catch { Write-Host "CAUGHT_SETUP_CODE=$LASTEXITCODE"; Write-Host "HOST_ALIVE"; exit $LASTEXITCODE }' : ''}
Write-Host 'INSTALLER_RETURNED_SUCCESS'
`,
    )
    const result = spawnSync(engine, ['-NoProfile', '-File', wrapper], {
      encoding: 'utf8',
      timeout: 15_000,
      env: {
        ...process.env,
        CI: mode === 'ci' ? '1' : '',
        LOCALAPPDATA: f.home,
        TEMP: f.scratch,
        TMP: f.scratch,
        PSModulePath:
          engine === 'powershell.exe'
            ? join(
                process.env.SystemRoot ?? 'C:\\Windows',
                'System32',
                'WindowsPowerShell',
                'v1.0',
                'Modules',
              )
            : process.env.PSModulePath,
        HARNESSED_INSTALLER_SOURCE_DIR: f.source,
        INSTALLER_TEST_LOG: f.log,
        INSTALLER_TEST_CODE: String(code),
        INSTALLER_TEST_MODE: mode,
      },
    })
    expect(result.error).toBeUndefined()
    return { f, status: result.status, output: result.stdout + result.stderr }
  }

  for (const engine of ['powershell.exe', 'pwsh']) {
    describe(engine, () => {
      it.each([1, 23])('propagates setup exit %i without successful next steps', (code) => {
        const { f, status, output } = run(engine, code)
        expect(status, output).not.toBe(0)
        expect(output).toContain('installed harnessed v99.0.0')
        expect(output).toContain(`setup failed (exit code ${code})`)
        expect(output).toContain(`& ${psQuote(f.bin)} setup`)
        expect(output).not.toContain('[harnessed installer] next step')
        expect(output).not.toContain('INSTALLER_RETURNED_SUCCESS')
        assertInstalledAndClean(f, true)
      })

      it.each([
        false,
        true,
      ])('preserves the original code in a catchable IEX failure (native errors: %s)', (nativeErrors) => {
        const { f, status, output } = run(engine, 23, 'accept', true, nativeErrors)
        expect(status, output).toBe(23)
        expect(output).toContain('CAUGHT_SETUP_CODE=23')
        expect(output).toContain('HOST_ALIVE')
        expect(output).toContain('setup failed (exit code 23)')
        expect(output).toContain(`& ${psQuote(f.bin)} setup`)
        expect(output).not.toContain('[harnessed installer] next step')
        assertInstalledAndClean(f, true)
      })

      it.each([
        'accept',
        'ci',
        'decline',
      ])('preserves successful setup and consent behavior: %s', (mode) => {
        const { f, status, output } = run(engine, 0, mode)
        expect(status, output).toBe(0)
        expect(output).toContain(
          mode === 'accept'
            ? '[harnessed installer] next step:'
            : '[harnessed installer] next steps:',
        )
        expect(output).not.toContain('setup failed')
        assertInstalledAndClean(f, mode === 'accept')
      })
    })
  }
})

describe.skipIf(windows)('Unix installer execution', () => {
  function run(code: number, mode = 'accept') {
    const result = spawnSync(
      process.execPath,
      [join(REPO_ROOT, 'tests/scripts/installer-unix-setup-fixture.mjs'), String(code), mode],
      {
        encoding: 'utf8',
        timeout: 20_000,
      },
    )
    expect(result.error).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(0)
  }

  it.each([1, 23])('preserves failed setup exit %i with an absolute retry', (code) => {
    run(code)
  })

  it.each([
    'accept',
    'ci',
    'decline',
  ])('preserves successful setup and consent behavior: %s', (mode) => {
    run(0, mode)
  })
})

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
