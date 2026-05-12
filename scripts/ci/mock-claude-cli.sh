#!/usr/bin/env bash
# H4 sister review (Wave 6 T5.5): CI mock claude CLI shim.
#
# Verifies harnessed's spawn invocation arguments without depending on a real
# `claude` CLI install on the CI runner. Echoes args to stderr so the CI step
# can grep for the expected invocation pattern; emits canned responses for the
# `claude mcp` subcommands harnessed actually uses (mcp list / add / remove).
#
# Usage (CI step injects this script onto PATH as `claude`):
#   PATH="/tmp/mock-bin:$PATH" node ./dist/cli.mjs install tavily-mcp --dry-run
#
# Note: harnessed's mcpStdioAdd installer aborts before spawning `claude` when
# --dry-run is set, so this shim is exercised only when --apply is added. The
# T5.5 CI step uses --dry-run --non-interactive (per ADR 0004 contract 1) which
# means this shim only logs the install command's invocation surface during
# the diff-preview render, never the spawn itself. That is sufficient: the
# shim's primary value is being on PATH so harnessed's preflight does NOT
# fail with "claude: command not found" on bare CI runners.

echo "[mock-claude] $*" >&2
case "$1 $2" in
  "mcp list")
    echo "tavily-mcp"
    echo "exa-mcp"
    exit 0
    ;;
  "mcp add")
    exit 0
    ;;
  "mcp remove")
    exit 0
    ;;
  *)
    echo "[mock-claude] unsupported subcommand: $1 $2" >&2
    exit 1
    ;;
esac
