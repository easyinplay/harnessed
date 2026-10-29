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

import { existsSync } from 'node:fs'
import { access, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getAssetsRoot } from '../../platform/assetsRoot.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import {
  detectPlatform,
  getSettingsPath,
  getSkillsDir,
  harnessSkillsDirs,
} from '../../platform/platform.js'
import { binaryOnPath, extractVerifyBinary } from './binaryProbe.js'
import { codexHookPluginId } from './codexHookPlugin.js'
import { isCodexPluginInstalled } from './codexPlugins.js'
import { parseGitCloneDest } from './gitCloneArgs.js'
import { detectCcHookInstalled } from './hookEntry.js'
import { isMcpServerRegistered, isPluginRegistered } from './readClaudeConfig.js'
import { spawnCmd } from './spawn.js'
import type { InstallContext } from './types.js'

const IDEMPOTENT_CHECK_TIMEOUT_MS = 10_000

// Extract the installed skill dir name from `npx ... skills add <owner/repo> ...`.
// v4.13.0 — an explicit `--skill <name>` / `-s <name>` flag wins over the repo
// segment: the skills CLI installs into `~/.../skills/<skill-name>/`, NOT
// `<repo>/` (design-taste-frontend regression: repo segment `taste-skill` made
// idempotent probe + real-path verify look at a dir that never exists).
// `--skill '*'` wildcard is ignored (multi-skill pack → repo-segment fallback).
export function extractSkillName(cmd: string, fallback: string): string {
  const flag = cmd.match(/(?:^|\s)(?:--skill|-s)\s+['"]?([^\s'"]+)['"]?/)
  if (flag?.[1] && flag[1] !== '*') return flag[1]
  const m = cmd.match(/\bskills(?:@\S+)?\s+add\s+(\S+)/i)
  if (!m?.[1]) return fallback
  const seg = m[1].split('/')
  return seg[seg.length - 1] ?? fallback
}

// Extract clone target directory from a git-clone-with-setup cmd.
// Pattern: `git clone [flags] <url> <dest>`. Returns expanded absolute path.
function extractGitCloneTarget(cmd: string, context?: HostInstallContext): string | null {
  const dest = parseGitCloneDest(cmd)?.raw
  if (!dest) return null
  if (dest.startsWith('~/')) return join(context?.userHome ?? homedir(), dest.slice(2))
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
 *  When ANY listed indicator has a readable SKILL.md file, consider the pack
 *  installed. Sister `ctx7→context7` plugin-name aliasing pattern.
 *  - `gsd` installs 70+ `gsd-<name>/` skill dirs (no single `gsd/` folder)
 *  - `mattpocock-skills` installs individual skill dirs (`tdd/`, ...)
 *    (extractSkillName from `npx ... skills add mattpocock/skills` yields
 *    `skills` which never exists)
 *  v4.16.0 — upstream mattpocock/skills renamed `diagnose` → `diagnosing-bugs`
 *  and dropped `zoom-out` (verified 2026-07-03). Legacy `diagnose` stays in the
 *  list: pre-rename machines still carry it and remain legitimately installed
 *  (OR-probe — a superset is cheap and never false-negative).
 */
const INSTALLED_INDICATORS: Record<string, string[]> = {
  gsd: ['gsd-progress', 'gsd-plan-phase'],
  'mattpocock-skills': ['tdd', 'diagnosing-bugs', 'grill-with-docs', 'diagnose'],
}

function extractSingleSkillSelection(cmd: string): string | undefined {
  const selections = [
    ...cmd.matchAll(
      /(?:^|\s)(?:--skill|-s)\s+['"]?([a-zA-Z0-9][a-zA-Z0-9._-]*)['"]?(?=\s+-|\s*$)/g,
    ),
  ]
  const selectionFlags = [...cmd.matchAll(/(?:^|\s)(?:--skill|-s)(?:\s|=)/g)]
  return selections.length === 1 && selectionFlags.length === 1 ? selections[0]?.[1] : undefined
}

export function npxActiveTargetNames(
  cmd: string,
  manifestName: string,
  installsSkills?: readonly string[],
): readonly string[] {
  const selectedSkill = extractSingleSkillSelection(cmd)
  if (selectedSkill) return [selectedSkill]
  const indicators = INSTALLED_INDICATORS[manifestName]
  if (indicators?.length) return [...indicators]
  if (installsSkills?.length === 1 && installsSkills[0]) return [installsSkills[0]]
  return [extractSkillName(cmd, manifestName)]
}

function skillProbeDirs(context?: HostInstallContext): string[] {
  if (context)
    return [
      ...new Set(
        context.hostId === 'codex'
          ? [context.platform.skillsDir, join(context.nativeHome, 'skills')]
          : [join(context.nativeHome, 'skills'), join(context.userHome, '.agents', 'skills')],
      ),
    ]
  const platform = detectPlatform()
  return platform.id === 'codex'
    ? [getSkillsDir(), join(platform.homeDir, 'skills')]
    : harnessSkillsDirs()
}

/** v4.13.0 — indicator sub-skill probe across ALL harness skills dirs.
 *  Pre-4.13.0 only getSkillsDir() (~/.claude/skills) was checked; the skills
 *  CLI's --global installs land in ~/.agents/skills, so already-installed packs
 *  were re-installed every setup run ("总是检测不到" user dogfood). */
async function indicatorPresent(name: string, context?: HostInstallContext): Promise<boolean> {
  const indicators = INSTALLED_INDICATORS[name]
  if (!indicators) return false
  for (const skillsDir of skillProbeDirs(context)) {
    for (const ind of indicators) {
      try {
        const skillMd = join(skillsDir, ind, 'SKILL.md')
        if (!(await stat(skillMd)).isFile()) continue
        await readFile(skillMd, 'utf8')
        return true
      } catch {
        /* try next indicator */
      }
    }
  }
  return false
}

/** v4.13.0 — shared npx-skill presence probe: indicator sub-skills first, then
 *  `<skillsDir>/<extractSkillName(cmd)>/SKILL.md` across both harness dirs.
 *  Consumed by detectNative AND npxSkillInstaller's post-install real-path
 *  verify (single source of truth — pre-4.13.0 the installer probed one
 *  hardcoded ~/.claude/skills path and failed packs that install elsewhere). */
export async function detectSkillPresence(
  cmd: string,
  name: string,
  context?: HostInstallContext,
  installsSkills?: readonly string[],
): Promise<boolean> {
  if (!extractSingleSkillSelection(cmd) && INSTALLED_INDICATORS[name]?.length) {
    return indicatorPresent(name, context)
  }
  const targetNames = npxActiveTargetNames(cmd, name, installsSkills)
  for (const skillsDir of skillProbeDirs(context)) {
    for (const targetName of targetNames) {
      try {
        await access(join(skillsDir, targetName, 'SKILL.md'))
        return true
      } catch {
        /* try next */
      }
    }
  }
  return false
}

async function detectNative(ctx: InstallContext): Promise<boolean> {
  const method = ctx.manifest.spec.install.method
  const cmd = ctx.manifest.spec.install.cmd
  const name = ctx.manifest.metadata.name

  // v3.9.18 — check indicator sub-skills first (skill packs that don't install
  // a single dir matching `name`). Cross-method since the pack format varies.
  // v4.13.0 — probes all harness skills dirs (see indicatorPresent).
  if (method !== 'npx-skill-installer' && (await indicatorPresent(name, ctx.hostContext)))
    return true

  // v4.14.0 — native MCP registration probe (platform-aware: claude JSON map /
  // codex `codex mcp list --json` via isMcpServerRegistered). Only-if-registered
  // short-circuit — absence still falls through to the supplementary plugin
  // probe + shell fallback (some MCP tools are ALSO installed as CC plugins).
  if (method === 'mcp-stdio-add' || method === 'mcp-http-add') {
    try {
      if (
        await (ctx.hostContext
          ? isMcpServerRegistered(name, ctx.hostContext)
          : isMcpServerRegistered(name))
      )
        return true
    } catch {
      /* unreadable config → fall through */
    }
  }

  if (method === 'cc-plugin-marketplace') {
    // `install` (claude) or `add` (codex; `(?!marketplace)` skips `plugin marketplace add`).
    const m = cmd.match(/plugin\s+(?:install|add)\s+(?!marketplace\b)(\S+)/i)
    const pluginName = m?.[1] ?? name
    try {
      return await (ctx.hostContext
        ? isPluginRegistered(pluginName, ctx.hostContext)
        : isPluginRegistered(pluginName))
    } catch {
      return false
    }
  }

  if (method === 'npx-skill-installer') {
    if (!extractSingleSkillSelection(cmd) && INSTALLED_INDICATORS[name]?.length) {
      if (await indicatorPresent(name, ctx.hostContext)) return true
    } else {
      const targetNames = npxActiveTargetNames(cmd, name, ctx.manifest.spec.install.installs_skills)
      // Claude keeps cross-host compatibility; Codex probes only shared + legacy roots.
      for (const skillsDir of skillProbeDirs(ctx.hostContext)) {
        for (const targetName of targetNames) {
          try {
            await access(join(skillsDir, targetName, 'SKILL.md'))
            return true
          } catch {
            /* try next */
          }
        }
      }
    }
  }

  if (method === 'git-clone-with-setup') {
    const target = extractGitCloneTarget(cmd, ctx.hostContext)
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
    // v4.16.1 T1 — global CLI binaries: PATH probe first (ctx7 dogfood: installed
    // via L4 rescue yet every later setup re-skipped it level-flag-missing and
    // re-prompted — the skillDir probe below is meaningless for npm -g CLIs, and
    // the shell `command -v` fallback can't run under cmd.exe).
    const bin = extractVerifyBinary(ctx.manifest.spec.verify?.cmd, name)
    if (bin && binaryOnPath(bin)) return true
    const skillDir = join(
      ctx.hostContext
        ? ctx.hostContext.hostId === 'claude'
          ? join(ctx.hostContext.nativeHome, 'skills')
          : ctx.hostContext.platform.skillsDir
        : getSkillsDir(),
      name,
    )
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
      if (
        await (ctx.hostContext ? isPluginRegistered(pn, ctx.hostContext) : isPluginRegistered(pn))
      )
        return true
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

  const installCfg = ctx.manifest.spec.install
  // CLI presence is authoritative on PATH, never in a same-name skill/plugin.
  // npm-distributed skill packs (e.g. GSD with a test-based verify) keep their probes.
  if (
    installCfg.method === 'npm-cli' &&
    (ctx.manifest.spec.component_type === 'cli-binary' ||
      extractVerifyBinary(ctx.manifest.spec.verify?.cmd, '') !== null)
  ) {
    const bin = extractVerifyBinary(
      ctx.manifest.spec.component_type === 'cli-binary' ? undefined : ctx.manifest.spec.verify?.cmd,
      ctx.manifest.metadata.name,
    )
    return bin !== null && binaryOnPath(bin)
  }
  // Codex MCP registration is authoritative; legacy fallbacks can match Claude installs.
  if (
    (installCfg.method === 'mcp-stdio-add' || installCfg.method === 'mcp-http-add') &&
    (ctx.hostContext?.hostId ?? detectPlatform().id) === 'codex'
  ) {
    try {
      return await (ctx.hostContext
        ? isMcpServerRegistered(ctx.manifest.metadata.name, ctx.hostContext)
        : isMcpServerRegistered(ctx.manifest.metadata.name))
    } catch {
      return false
    }
  }

  // v4.20.0 hotfix — cc-hook-add is AUTHORITATIVE (no shell-grep fallback):
  // the legacy `grep -q <marker> settings.json` matches broken flat/relative
  // entries too, which made setup/optional-offer skip exactly the installs that
  // need the self-heal migration (dogfood: perturn-inject malformed entry).
  if (installCfg.method === 'cc-hook-add') {
    // v16.0 Phase 64 (R6) — codex: the hook is the local plugin
    // harnessed-<name>@harnessed-local; `codex plugin list` is the authority.
    if ((ctx.hostContext?.hostId ?? detectPlatform().id) === 'codex')
      return ctx.hostContext
        ? isCodexPluginInstalled(codexHookPluginId(ctx.manifest.metadata.name), ctx.hostContext)
        : isCodexPluginInstalled(codexHookPluginId(ctx.manifest.metadata.name))
    // v16.0 Phase 63 — null settings path → not installed; never probe config.toml.
    const settingsPath = ctx.hostContext
      ? join(ctx.hostContext.nativeHome, 'settings.json')
      : getSettingsPath()
    let raw: string | null = null
    if (settingsPath !== null) {
      try {
        raw = await readFile(settingsPath, 'utf8')
      } catch {
        raw = null
      }
    }
    return detectCcHookInstalled(
      raw,
      installCfg.hook_event,
      installCfg.hook_command,
      installCfg.hook_matcher,
      {
        assetsRoot: getAssetsRoot,
        exists: existsSync,
      },
    )
  }

  // v3.9.9 — native detection first (Windows compat: cmd.exe /c can't run
  // `/plugin list`, `test`, `grep -q`, etc. that appear in idempotent_checks).
  const native = await detectNative(ctx)
  if (
    installCfg.method === 'cc-plugin-marketplace' &&
    (ctx.hostContext?.hostId ?? detectPlatform().id) === 'claude'
  )
    return native
  if (native) return true

  // Fallback: shell spawn (legacy idempotent_check manifest field).
  const idempotentCmd = ctx.manifest.spec.install.idempotent_check
  if (typeof idempotentCmd !== 'string' || idempotentCmd.length === 0) {
    return false
  }

  // A Claude-bearing fallback cannot prove that a missing Codex skill is installed.
  if (
    (installCfg.method === 'npx-skill-installer' ||
      Object.hasOwn(INSTALLED_INDICATORS, ctx.manifest.metadata.name)) &&
    (ctx.hostContext?.hostId ?? detectPlatform().id) === 'codex' &&
    /\bclaude\b/i.test(idempotentCmd)
  ) {
    return false
  }

  const r = await spawnCmd(ctx, idempotentCmd, [], IDEMPOTENT_CHECK_TIMEOUT_MS)
  if (!('exitCode' in r)) return false
  return r.exitCode === 0
}
