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

import { homedir } from 'node:os'

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
