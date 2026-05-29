// v3.9.6 — Shared idempotent_check helper for non-MCP installers.
//
// Background: each manifest declares `spec.install.idempotent_check` (shell
// command, e.g. `test -d ~/.claude/skills/gsd`). Before v3.9.6 only mcpStdioAdd
// honored idempotency (via stderr "already exists" string match); npmCli /
// npxSkillInstaller / gitCloneWithSetup / ccPluginMarketplace ran their install
// commands unconditionally — so `harnessed setup` reported "installed" every
// time even for already-installed packages (user dogfood: gsd reinstalled
// every run).
//
// v3.9.9 — native detection per install method (Windows compat):
// Pre-v3.9.9 `isAlreadyInstalled` spawned the manifest's `idempotent_check`
// shell command via `spawnCmd`, which on Windows routes through `cmd.exe /c`.
// `cmd.exe` does NOT understand `/plugin list` (CC slash command), `test`,
// `grep -q`, or `cp`/`rm` — causing ALL idempotent probes to silently fail
// (exit 1), the installer to run the full install flow, and already-installed
// components to appear as "[B] installed" or "[B] failed" (dogfood v3.9.8).
// Fix: detect installed state natively by install method BEFORE falling back
// to shell spawn. Native detection uses fs.access / isPluginRegistered — pure
// Node.js, cross-OS, no shell dependency.
//
// `opts.updateInstalled` bypass: when true, skip idempotent probe entirely
// (force re-install). Setup prompts user for this flag before Step B; MCP
// installers (mcpStdioAdd / mcpHttpAdd) do NOT consume this helper — their
// existing stderr "already exists" path respects user MCP config unconditionally.

import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { isPluginRegistered } from './readClaudeConfig.js'
import { spawnCmd } from './spawn.js'
import type { InstallContext } from './types.js'

const IDEMPOTENT_CHECK_TIMEOUT_MS = 10_000

// Extract `<owner/repo>` from `npx ... skills add <owner/repo> ...`.
export function extractSkillName(cmd: string, fallback: string): string {
  const m = cmd.match(/\bskills(?:@\S+)?\s+add\s+(\S+)/i)
  if (!m?.[1]) return fallback
  const seg = m[1].split('/')
  return seg[seg.length - 1] ?? fallback
}

// Extract clone target directory from a git-clone-with-setup cmd.
// Pattern: `git clone [flags] <url> <dest>`. Returns expanded absolute path.
function extractGitCloneTarget(cmd: string): string | null {
  const idx = cmd.indexOf('git clone')
  if (idx < 0) return null
  const tail = cmd.slice(idx + 'git clone'.length).trim()
  const tokens = tail.split(/\s+/)
  let i = 0
  while (i < tokens.length && tokens[i]?.startsWith('-')) {
    i += tokens[i]?.includes('=') ? 1 : 2
  }
  const dest = tokens[i + 1]
  if (!dest || dest === '&&' || dest === ';' || dest === '|') return null
  if (dest.startsWith('~/')) return join(homedir(), dest.slice(2))
  if (dest.startsWith('/') || /^[A-Z]:[\\/]/i.test(dest)) return dest
  // relative path — ambiguous, skip native detection
  return null
}

/** Native installed-state detection per install method. Returns true only when
 *  we can confirm the component IS installed via fs or config read. Returns
 *  false when not-installed OR when the method/cmd shape is unparseable
 *  (caller falls back to shell `idempotent_check` spawn).
 *
 *  v3.9.10: always supplement with `isPluginRegistered()` — many components
 *  are installed both as CC plugins AND via other methods (e.g. ctx7 is also
 *  context7@claude-plugins-official). npx-skill-installer now checks both
 *  ~/.claude/skills/ and ~/.agents/skills/ (skills CLI global path). */
/** v3.9.18 — Indicator sub-skill map for skill packs that install multiple
 *  individual skill dirs instead of one folder matching the manifest name.
 *  When ANY listed indicator exists under `~/.claude/skills/`, consider the
 *  pack installed. Sister `ctx7→context7` plugin-name aliasing pattern.
 *  - `gsd` installs 70+ `gsd-<name>/` skill dirs (no single `gsd/` folder)
 *  - `mattpocock-skills` installs `diagnose/`, `tdd/`, `zoom-out/`, etc.
 *    (extractSkillName from `npx ... skills add mattpocock/skills` yields
 *    `skills` which never exists)
 */
const INSTALLED_INDICATORS: Record<string, string[]> = {
  gsd: ['gsd-progress', 'gsd-plan-phase'],
  'mattpocock-skills': ['diagnose', 'tdd', 'zoom-out'],
}

async function detectNative(ctx: InstallContext): Promise<boolean> {
  const method = ctx.manifest.spec.install.method
  const cmd = ctx.manifest.spec.install.cmd
  const name = ctx.manifest.metadata.name

  // v3.9.18 — check indicator sub-skills first (skill packs that don't install
  // a single dir matching `name`). Cross-method since the pack format varies.
  const indicators = INSTALLED_INDICATORS[name]
  if (indicators) {
    for (const ind of indicators) {
      const dir = join(homedir(), '.claude', 'skills', ind)
      try {
        await access(dir)
        return true
      } catch {
        /* try next indicator */
      }
    }
  }

  if (method === 'cc-plugin-marketplace') {
    const m = cmd.match(/(?:claude\s+)?plugin\s+install\s+(\S+)/i)
    const pluginName = m?.[1]?.split('@')[0] ?? name
    try {
      return await isPluginRegistered(pluginName)
    } catch {
      return false
    }
  }

  if (method === 'npx-skill-installer') {
    const skillName = extractSkillName(cmd, name)
    // v3.9.10: skills CLI --copy --global installs to ~/.agents/skills/ by
    // default (with symlinks to CC). Check both paths.
    for (const base of ['.claude', '.agents']) {
      const skillMd = join(homedir(), base, 'skills', skillName, 'SKILL.md')
      try {
        await access(skillMd)
        return true
      } catch {
        /* try next */
      }
    }
  }

  if (method === 'git-clone-with-setup') {
    const target = extractGitCloneTarget(cmd)
    if (target) {
      try {
        await access(target)
        return true
      } catch {
        /* fall through to supplementary */
      }
    }
  }

  if (method === 'npm-cli') {
    const skillDir = join(homedir(), '.claude', 'skills', name)
    try {
      await access(skillDir)
      return true
    } catch {
      /* fall through to supplementary */
    }
  }

  // v3.9.10 — supplementary: always check CC plugin registry. Many components
  // exist both as plugins AND via other install methods (e.g. ctx7 is also
  // context7@claude-plugins-official; mattpocock-skills may have a plugin form).
  // Name aliases for manifests whose plugin name differs from metadata.name.
  const pluginNames = [name]
  if (name === 'ctx7') pluginNames.push('context7')
  for (const pn of pluginNames) {
    try {
      if (await isPluginRegistered(pn)) return true
    } catch {
      /* continue */
    }
  }

  return false
}

/** Probe whether the manifest is already installed.
 *  v3.9.9: native Node.js detection first (per install method), shell
 *  `idempotent_check` spawn as fallback for edge cases. */
export async function isAlreadyInstalled(
  ctx: InstallContext,
  opts: { honorUpdateFlag?: boolean } = {},
): Promise<boolean> {
  const honorUpdateFlag = opts.honorUpdateFlag !== false
  if (honorUpdateFlag && ctx.opts.updateInstalled === true) return false

  // v3.9.8 — dry-run bypasses the probe so the install-path preview (diff
  // render + spawn-args contract) is exercisable by tests / users running
  // `--dry-run`. Real install behavior unchanged (probe runs when apply:true).
  if (ctx.opts.dryRun) return false

  // v3.9.9 — native detection first (Windows compat: cmd.exe /c can't run
  // `/plugin list`, `test`, `grep -q`, etc. that appear in idempotent_checks).
  const native = await detectNative(ctx)
  if (native) return true

  // Fallback: shell spawn (legacy idempotent_check manifest field).
  const idempotentCmd = ctx.manifest.spec.install.idempotent_check
  if (typeof idempotentCmd !== 'string' || idempotentCmd.length === 0) {
    return false
  }

  const r = await spawnCmd(ctx, idempotentCmd, [], IDEMPOTENT_CHECK_TIMEOUT_MS)
  if (!('exitCode' in r)) return false
  return r.exitCode === 0
}
