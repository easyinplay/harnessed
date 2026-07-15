#!/usr/bin/env bash
# harnessed one-line installer (macOS / Linux).
#
#   curl -fsSL https://raw.githubusercontent.com/easyinplay/harnessed/main/install.sh | bash
#
# Contract (frozen public API since 4.27.0, change = major):
#   release assets  harnessed-{darwin-arm64,linux-x64}  + per-asset  <asset>.sha256
# Download goes through the stable redirect  releases/latest/download/<asset>
# (no API parsing on the critical path); the GitHub API is only consulted for a
# display-only version line and fails soft to "latest".
#
# Layout: installs to ~/.local/bin/harnessed (platform convention, D2-rev —
# NOT ~/.harnessed/: that is the harness's LEGACY state root and gets renamed
# away by migrateLegacyHarnessedRoot() on every binary boot). On most modern
# distros ~/.local/bin is already on PATH → zero-friction. PATH is NEVER
# auto-edited on unix — we print the exact per-shell snippet instead
# (locked decision D3, minimal invasiveness).
#
# CI seam: HARNESSED_INSTALLER_SOURCE_DIR=<dir> copies the asset pair from a
# local directory instead of the network (same rehearsal philosophy as the
# binary's HARNESSED_UPDATE_SOURCE_DIR). Zero network in CI.
set -euo pipefail

REPO="easyinplay/harnessed"
INSTALL_DIR="${HOME}/.local/bin"

err() { printf '\n[harnessed installer] ERROR: %s\n' "$1" >&2; exit 1; }
note() { printf '[harnessed installer] %s\n' "$1"; }

# ── platform detection ──────────────────────────────────────────────────────
OS=$(uname -s)
ARCH=$(uname -m)
case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64) ASSET="harnessed-linux-x64" ;;
      *) err "unsupported linux arch '$ARCH' (only x86_64 binaries are published). Use the npm channel instead: npm install -g harnessed" ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      arm64) ASSET="harnessed-darwin-arm64" ;;
      *) err "unsupported macOS arch '$ARCH' (only Apple Silicon binaries are published). Use the npm channel instead: npm install -g harnessed" ;;
    esac
    ;;
  MINGW*|MSYS*|CYGWIN*)
    err "this looks like Git Bash / MSYS on Windows. Use the PowerShell installer instead:
  irm https://raw.githubusercontent.com/easyinplay/harnessed/main/install.ps1 | iex"
    ;;
  *) err "unsupported OS '$OS'. Use the npm channel instead: npm install -g harnessed" ;;
esac

# ── sha256 tool (platform-dependent) ────────────────────────────────────────
if command -v sha256sum >/dev/null 2>&1; then
  SHA_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  SHA_CMD="shasum -a 256"
else
  err "neither sha256sum nor shasum found — cannot verify download integrity"
fi

# ── fetch asset pair (network, or local seam for CI rehearsal) ──────────────
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if [ -n "${HARNESSED_INSTALLER_SOURCE_DIR:-}" ]; then
  note "local source dir seam active: $HARNESSED_INSTALLER_SOURCE_DIR (zero network)"
  cp "$HARNESSED_INSTALLER_SOURCE_DIR/$ASSET" "$TMP_DIR/" || err "asset '$ASSET' not found in source dir"
  cp "$HARNESSED_INSTALLER_SOURCE_DIR/$ASSET.sha256" "$TMP_DIR/" || err "checksum '$ASSET.sha256' not found in source dir"
  VERSION="(local rehearsal)"
else
  command -v curl >/dev/null 2>&1 || err "curl is required"
  # Display-only version line — tag_name extraction without jq; fails soft.
  VERSION=$(curl -fsSL --max-time 5 "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null \
    | grep -m1 '"tag_name"' | sed 's/.*"tag_name"[^"]*"\([^"]*\)".*/\1/' || true)
  [ -n "$VERSION" ] || VERSION="latest"
  note "downloading harnessed $VERSION ($ASSET) ..."
  BASE="https://github.com/$REPO/releases/latest/download"
  curl -fSL --retry 2 -o "$TMP_DIR/$ASSET" "$BASE/$ASSET" \
    || err "download failed for $ASSET (network/proxy issue? npm fallback: npm install -g harnessed)"
  curl -fsSL --retry 2 -o "$TMP_DIR/$ASSET.sha256" "$BASE/$ASSET.sha256" \
    || err "download failed for $ASSET.sha256"
fi

# ── verify integrity BEFORE anything touches the install dir ────────────────
( cd "$TMP_DIR" && $SHA_CMD -c "$ASSET.sha256" >/dev/null 2>&1 ) \
  || err "sha256 verification FAILED for $ASSET — refusing to install a corrupt/tampered binary"
note "sha256 verified"

# ── install (temp is verified; only now touch the destination) ──────────────
mkdir -p "$INSTALL_DIR"
BIN_PATH="$INSTALL_DIR/harnessed"
mv -f "$TMP_DIR/$ASSET" "$BIN_PATH"
chmod 755 "$BIN_PATH"

# smoke
OUT=$("$BIN_PATH" --version) || err "installed binary failed its --version smoke"
note "installed harnessed v$OUT → $BIN_PATH"

# ── PATH guidance (print, never edit — locked decision D3) ──────────────────
case ":$PATH:" in
  *":$INSTALL_DIR:"*)
    note "$INSTALL_DIR is already on your PATH"
    ;;
  *)
    SHELL_NAME=$(basename "${SHELL:-sh}")
    case "$SHELL_NAME" in
      zsh) RC="~/.zshrc" ;;
      bash) RC="~/.bashrc" ;;
      fish) RC="~/.config/fish/config.fish" ;;
      *) RC="your shell profile" ;;
    esac
    printf '\n[harnessed installer] add harnessed to your PATH — append this line to %s:\n' "$RC"
    if [ "$SHELL_NAME" = "fish" ]; then
      printf '\n  fish_add_path %s\n\n' "$INSTALL_DIR"
    else
      printf '\n  export PATH="%s:$PATH"\n\n' "$INSTALL_DIR"
    fi
    ;;
esac

# ── shadow guard: is a *different* harnessed already resolvable on PATH? ─────
# A pre-existing npm-global (or older binary) harnessed earlier on PATH shadows
# the one we just installed, so a bare `harnessed setup` would run the WRONG
# build (the "版本不一样" report). ~/.local/bin normally holds the fresh binary,
# so command -v resolves to it unless another dir sits earlier on PATH.
SHADOW=""
if command -v harnessed >/dev/null 2>&1; then
  EXISTING=$(command -v harnessed)
  [ "$EXISTING" != "$BIN_PATH" ] && SHADOW="$EXISTING"
fi
if [ -n "$SHADOW" ]; then
  printf "\n[harnessed installer] NOTE: another 'harnessed' is earlier on your PATH and will shadow this binary:\n"
  printf '    %s\n' "$SHADOW"
  printf "  a bare 'harnessed' keeps running that one. To make this binary win, either:\n"
  printf '    - remove the other:        npm uninstall -g harnessed\n'
  printf '    - or invoke by full path:  %s\n' "$BIN_PATH"
fi

# ── setup: offer to run it now, by absolute path (locked: consent-gated) ─────
# Invoking $BIN_PATH directly guarantees the freshly-installed build runs its
# own setup — this both delivers a default setup and sidesteps any PATH shadow.
# curl|bash feeds the script into stdin, so a prompt must read from /dev/tty.
RAN_SETUP=0
if [ -t 1 ] && [ -r /dev/tty ]; then
  printf "[harnessed installer] run 'harnessed setup' now (installs workflow skills + upstream components)? (Y/n) "
  read -r ANS </dev/tty || ANS=""
  case "$ANS" in
    ''|[Yy]*)
      note "running setup..."
      "$BIN_PATH" setup
      RAN_SETUP=1
      ;;
  esac
fi

# Shadow-aware hints: after a shadow warning, a bare `harnessed` would run the
# wrong build, so point the manual commands at the absolute path instead.
if [ -n "$SHADOW" ]; then
  SETUP_HINT="$BIN_PATH setup"; UPDATE_HINT="$BIN_PATH update"
else
  SETUP_HINT="harnessed setup"; UPDATE_HINT="harnessed update"
fi
if [ "$RAN_SETUP" -eq 1 ]; then
  printf '[harnessed installer] next step:\n'
  printf '  %s   # self-update this binary later\n' "$UPDATE_HINT"
else
  printf '[harnessed installer] next steps:\n'
  printf '  %s    # install workflow skills + upstream components\n' "$SETUP_HINT"
  printf '  %s   # self-update this binary later\n' "$UPDATE_HINT"
fi
