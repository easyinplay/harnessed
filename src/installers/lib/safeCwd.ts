// v3.0.2 hotfix — homedir-rooted spawn cwd for MCP / plugin installers.
//
// Problem: `claude mcp add --scope project <...>` writes `.mcp.json` to the
// spawn cwd. When user launches `harnessed setup` from a read-only directory
// (e.g. PowerShell default CWD `C:\Windows\System32`), the write fails with:
//   `EPERM: operation not permitted, rename 'C:\Windows\System32\.mcp.json.tmp...'`
// blocking all MCP installers (chrome-devtools-mcp / exa-mcp / tavily-mcp).
//
// Solution: sister v2.0.1 `getBackupRoot()` (src/installers/lib/backup.ts:32)
// pattern verbatim — root MCP/plugin spawn cwd at homedir() unconditionally,
// not at process.cwd(). homedir() is reliably writable on Win/Mac/Linux.
// User can still see `.mcp.json` in their home and `claude mcp list` works
// because the registration is keyed by the absolute path Claude Code reads.
//
// Why unconditional (no probe + fallback)? Sister v2.0.1 backup-root migration
// is unconditional — `getBackupRoot()` always returns `~/.harnessed/backups/`,
// regardless of whether ctx.cwd is writable. Symmetric semantics: harness-
// owned writes go under the user's home, not transient terminal CWDs.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { detectPlatform } from './platform.js'

/**
 * Return the homedir-rooted spawn cwd used by `claude mcp add` /
 * `claude plugin install` so that `.mcp.json` / `.claude/settings.json`
 * writes land in a path the user reliably owns. Unconditional — does NOT
 * fall back to ctx.cwd.
 *
 * Sister: `src/installers/lib/backup.ts:32` `getBackupRoot()` v2.0.1.
 */
export function getMcpSpawnCwd(): string {
  return homedir()
}

// v4.20.1 — neutral spawn cwd for npm/npx-based installs (EBADDEVENGINES
// ambient-package.json immunity; sister v3.0.2 getMcpSpawnCwd above).
//
// dogfood v4.20.0: the user ran `harnessed setup` from a home dir whose
// package.json declared `devEngines: { runtime: { name: 'bun', onFail:
// 'download' } }` (bun-generated). `npm exec` walks cwd UPWARD to the nearest
// package.json and hard-fails EBADDEVENGINES (npm only accepts runtime name
// "node") — killing every npx-based install (gsd / playwright-test /
// mattpocock-skills / design-taste-frontend) while git/claude-plugin installs
// passed. Upstream packages declare no devEngines (verified via npm view);
// the pollution is purely ambient. Reproduced locally: any npx dies inside a
// dir carrying such a package.json.
//
// These installs are GLOBAL in nature (-g / --global / --copy) — the cwd has
// no semantic meaning, so we refuse to inherit the user's shell cwd. The
// sentinel package.json is the core of the fix: <stateRoot> lives under the
// user's home, so WITHOUT a sentinel npm's upward walk would still reach the
// polluted ancestor. A minimal name-only manifest terminates the walk.

/** Sentinel content — deliberately WITHOUT devEngines/engines fields. */
const NEUTRAL_SENTINEL = '{\n  "name": "harnessed-neutral-spawn",\n  "private": true\n}\n'

/**
 * Resolve the neutral spawn cwd for npm/npx-based install/verify spawns.
 *
 *   1. env `HARNESSED_SPAWN_CWD` — verbatim override (test hook + user escape
 *      hatch; sister HARNESSED_BASH precedent).
 *   2. `<stateRoot>/.spawn/` — created on demand with the sentinel
 *      package.json (never overwritten if present).
 *   3. `null` on any fs failure — caller falls back to ctx.cwd (fail-open:
 *      preserves pre-4.20.1 behavior instead of blocking installs).
 */
export function getNeutralSpawnCwd(): string | null {
  const override = process.env.HARNESSED_SPAWN_CWD
  if (override !== undefined && override.trim().length > 0) return override.trim()
  try {
    const dir = join(detectPlatform().stateRoot, '.spawn')
    mkdirSync(dir, { recursive: true })
    const sentinel = join(dir, 'package.json')
    if (!existsSync(sentinel)) writeFileSync(sentinel, NEUTRAL_SENTINEL, 'utf8')
    return dir
  } catch {
    return null
  }
}
