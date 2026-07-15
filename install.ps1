# harnessed one-line installer (Windows).
#
#   irm https://raw.githubusercontent.com/easyinplay/harnessed/main/install.ps1 | iex
#
# Contract (frozen public API since 4.27.0, change = major):
#   release asset  harnessed-windows-x64.exe  + per-asset  <asset>.sha256
# Download uses the stable redirect releases/latest/download/<asset>; the GitHub
# API is display-only (version line) and fails soft to "latest".
#
# Layout: installs to %LOCALAPPDATA%\harnessed\bin\harnessed.exe (platform
# convention, D2-rev — NOT $HOME\.harnessed\: that is the harness's LEGACY
# state root and gets renamed away by migrateLegacyHarnessedRoot() on every
# binary boot). PATH: interactive sessions get a consent prompt before an
# idempotent user-scope PATH append; non-interactive (CI / piped) prints a
# self-contained manual instruction instead (locked decision D3).
#
# CI seam: $env:HARNESSED_INSTALLER_SOURCE_DIR copies the asset pair from a
# local directory instead of the network. PowerShell 5.1 compatible.

$ErrorActionPreference = 'Stop'

$Repo = 'easyinplay/harnessed'
$Asset = 'harnessed-windows-x64.exe'
$InstallDir = Join-Path $env:LOCALAPPDATA 'harnessed\bin'
$BinPath = Join-Path $InstallDir 'harnessed.exe'

function Write-Note([string]$Msg) { Write-Host "[harnessed installer] $Msg" }
function Fail([string]$Msg) {
  Write-Host ""
  Write-Host "[harnessed installer] ERROR: $Msg" -ForegroundColor Red
  exit 1
}

if ([Environment]::Is64BitOperatingSystem -eq $false) {
  Fail 'only x64 Windows binaries are published. Use the npm channel instead: npm install -g harnessed'
}

# -- fetch asset pair (network, or local seam for CI rehearsal) --------------
$TmpDir = Join-Path ([IO.Path]::GetTempPath()) ("harnessed-install-" + [Guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null
$TmpBin = Join-Path $TmpDir $Asset
$TmpSha = Join-Path $TmpDir "$Asset.sha256"

try {
  if ($env:HARNESSED_INSTALLER_SOURCE_DIR) {
    Write-Note "local source dir seam active: $env:HARNESSED_INSTALLER_SOURCE_DIR (zero network)"
    $srcBin = Join-Path $env:HARNESSED_INSTALLER_SOURCE_DIR $Asset
    $srcSha = Join-Path $env:HARNESSED_INSTALLER_SOURCE_DIR "$Asset.sha256"
    if (-not (Test-Path $srcBin)) { Fail "asset '$Asset' not found in source dir" }
    if (-not (Test-Path $srcSha)) { Fail "checksum '$Asset.sha256' not found in source dir" }
    Copy-Item $srcBin $TmpBin
    Copy-Item $srcSha $TmpSha
    $Version = '(local rehearsal)'
  } else {
    # TLS 1.2 for PowerShell 5.1 default configs.
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $Version = 'latest'
    try {
      $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -TimeoutSec 5
      if ($rel.tag_name) { $Version = $rel.tag_name }
    } catch { }
    Write-Note "downloading harnessed $Version ($Asset) ..."
    $Base = "https://github.com/$Repo/releases/latest/download"
    try {
      Invoke-WebRequest -Uri "$Base/$Asset" -OutFile $TmpBin -UseBasicParsing
      Invoke-WebRequest -Uri "$Base/$Asset.sha256" -OutFile $TmpSha -UseBasicParsing
    } catch {
      Fail "download failed ($($_.Exception.Message)). Network/proxy issue? npm fallback: npm install -g harnessed"
    }
  }

  # -- verify integrity BEFORE anything touches the install dir --------------
  # .sha256 format is sha256sum-compatible: "<hex>  <filename>"
  $expected = ((Get-Content $TmpSha -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
  $actual = (Get-FileHash -Path $TmpBin -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($expected -ne $actual) {
    Fail "sha256 verification FAILED for $Asset - refusing to install a corrupt/tampered binary"
  }
  Write-Note 'sha256 verified'

  # -- install ----------------------------------------------------------------
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  Move-Item -Path $TmpBin -Destination $BinPath -Force

  # smoke
  $out = & $BinPath --version
  if ($LASTEXITCODE -ne 0) { Fail 'installed binary failed its --version smoke' }
  Write-Note "installed harnessed v$out -> $BinPath"

  # -- interactivity gate (shared by PATH + setup consent) --------------------
  $interactive = [Environment]::UserInteractive -and -not $env:CI

  # -- PATH handling (consent-gated user-scope append; locked decision D3) ----
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  if ($null -eq $userPath) { $userPath = '' }
  $onPath = ($userPath -split ';' | Where-Object { $_ -eq $InstallDir }).Count -gt 0
  if (-not $onPath) {
    $onPath = ($env:Path -split ';' | Where-Object { $_ -eq $InstallDir }).Count -gt 0
  }
  if ($onPath) {
    Write-Note "$InstallDir is already on your PATH"
  } else {
    $consent = $false
    if ($interactive) {
      $answer = Read-Host "[harnessed installer] add $InstallDir to your user PATH? (Y/n)"
      if ($answer -eq '' -or $answer -match '^[Yy]') { $consent = $true }
    }
    if ($consent) {
      $newPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
      [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
      Write-Note 'user PATH updated - restart your terminal to pick it up'
    } else {
      # Self-contained idempotent append — re-reads the live user PATH at run
      # time instead of baking a snapshot of it into the printed command.
      Write-Host ''
      Write-Host "[harnessed installer] add harnessed to your PATH - run this once:"
      Write-Host ''
      Write-Host "  [Environment]::SetEnvironmentVariable('Path', ([Environment]::GetEnvironmentVariable('Path','User').TrimEnd(';') + ';$InstallDir'), 'User')"
      Write-Host ''
    }
  }

  # -- shadow guard: is a *different* harnessed already resolvable on PATH? ----
  # A pre-existing npm-global (or older binary) harnessed earlier on PATH
  # shadows the one we just installed, so a bare `harnessed setup` would run the
  # WRONG build (the "版本不一样" report). $env:Path in this process does not yet
  # include the new dir, so Get-Command resolves whatever shadows it.
  $shadow = $null
  $existing = Get-Command harnessed -ErrorAction SilentlyContinue
  if ($existing -and $existing.Source -and ($existing.Source -ne $BinPath)) {
    $shadow = $existing.Source
  }
  if ($shadow) {
    Write-Host ''
    Write-Host "[harnessed installer] NOTE: another 'harnessed' is earlier on your PATH and will shadow this binary:" -ForegroundColor Yellow
    Write-Host "    $shadow"
    Write-Host "  a bare 'harnessed' keeps running that one. To make this binary win, either:"
    Write-Host "    - remove the other:        npm uninstall -g harnessed"
    Write-Host "    - or invoke by full path:  & '$BinPath'"
  }

  # -- setup: offer to run it now, by absolute path (locked: consent-gated) ----
  # Invoking $BinPath directly guarantees the freshly-installed build runs its
  # own setup — this both delivers a default setup and sidesteps any PATH shadow.
  $ranSetup = $false
  if ($interactive) {
    $answer = Read-Host "[harnessed installer] run 'harnessed setup' now (installs workflow skills + upstream components)? (Y/n)"
    if ($answer -eq '' -or $answer -match '^[Yy]') {
      Write-Note 'running setup...'
      & $BinPath setup
      $ranSetup = $true
    }
  }

  # Shadow-aware hints: after a shadow warning, a bare `harnessed` would run the
  # wrong build, so point the manual commands at the absolute path instead.
  $setupHint = if ($shadow) { "& '$BinPath' setup" } else { 'harnessed setup' }
  $updateHint = if ($shadow) { "& '$BinPath' update" } else { 'harnessed update' }
  if ($ranSetup) {
    Write-Host '[harnessed installer] next step:'
    Write-Host "  $updateHint   # self-update this binary later"
  } else {
    Write-Host '[harnessed installer] next steps:'
    Write-Host "  $setupHint    # install workflow skills + upstream components"
    Write-Host "  $updateHint   # self-update this binary later"
  }
} finally {
  Remove-Item -Recurse -Force $TmpDir -ErrorAction SilentlyContinue
}
