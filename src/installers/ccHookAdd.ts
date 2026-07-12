// Phase 2.4 W3 T3.1 — install method 7/7: cc-hook-add (D-04 § 3.1 + R2.4.4 +
// B-20/B-21/B-22). Sister: npxSkillInstaller (L2 HOME write, real-path verify).
// L3 tier (~/.claude/settings.json is shared user-scope state — sister mcp-stdio).
// Deep-merges settings.hooks[event][] (NEVER overwrite). R7 verify: re-read +
// .some() grep (writeFile exit ≠ filesystem truth — sister npx-skill-installer C6).
//
// v4.20.0 hotfix (dogfood, pre-release gate) — DOUBLE bug fixed via lib/hookEntry:
//   1. entry shape: pre-4.20.0 wrote flat { matcher?, command } — Claude Code's
//      settings schema requires { matcher?, hooks: [{ type: 'command', command }] }
//      (flat form fails CC validation on every session).
//   2. path: package-relative script tokens (e.g. `bin/harnessed-inject-state.mjs`)
//      are now resolved to absolute paths against getAssetsRoot() at install time
//      (manifest keeps the portable relative form; installer is authoritative —
//      sister mcpStdioAdd args reconstruction).
// Self-heal migration: ALL entries matching this registration's script (legacy
// flat, hand-fixed nested-but-relative, stale-absolute) are collapsed into ONE
// corrected entry on install — damaged users re-run setup/install and recover.

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { getAssetsRoot, isCompiledRuntime } from '../cli/lib/assetsRoot.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import {
  type AnyHookEntry,
  desiredHookEntry,
  entryMatchesRegistration,
  hookScriptMarker,
  isDesiredHookEntry,
  resolveHookCommand,
} from './lib/hookEntry.js'
import { getSettingsPath } from './lib/platform.js'
import { preflight } from './lib/preflight.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer } from './lib/types.js'

interface Settings {
  hooks?: Record<string, AnyHookEntry[]>
  [k: string]: unknown
}

export const installCcHookAdd: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook-add') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `dispatch bug: ${install.method}`,
        'dispatch-mismatch',
      ),
    }
  }
  const pre = preflight(ctx)
  if (!pre.ok) {
    if (pre.abortReason === 'platform-mismatch')
      return { aborted: true, reason: 'platform-mismatch' }
    const e = pre.errors[0] ?? err(ctx, '/', 'preflight failed', 'preflight')
    return { ok: false, phase: 'preflight', error: e }
  }

  const settingsPath = getSettingsPath()
  // Sentinel `null` ⇒ file does not exist (oldText='' so backup() emits pure-create).
  let existing: string | null
  try {
    existing = await readFile(settingsPath, 'utf8')
  } catch {
    existing = null
  }
  let settings: Settings
  try {
    settings = JSON.parse(existing ?? '{}') as Settings
  } catch (e) {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/',
        `malformed settings.json: ${(e as Error).message.slice(0, 200)}`,
        'settings-json-malformed',
      ),
    }
  }
  settings.hooks = settings.hooks ?? {}
  const ev = install.hook_event
  const matcher = install.hook_matcher
  const cmd = install.hook_command
  // v4.20.0 — authoritative command resolution + CC-schema entry shape + self-heal.
  // 4.27.0 (B3 T1 / D6) — compiled binaries register `"<binary>" inject-state`
  // (the hook calls the binary itself; no host node needed).
  const cmdDeps = {
    assetsRoot: getAssetsRoot,
    exists: existsSync,
    compiledExecPath: () => (isCompiledRuntime() ? process.execPath : null),
  }
  const resolvedCmd = resolveHookCommand(cmd, cmdDeps)
  const marker = hookScriptMarker(cmd)
  const arr = settings.hooks[ev] ?? []
  const ours = arr.filter((e) => entryMatchesRegistration(e, cmd, resolvedCmd, marker))
  if (ours.length === 1 && isDesiredHookEntry(ours[0] ?? {}, matcher, resolvedCmd)) {
    return { ok: true, backupId: 'idempotent-skip', appliedFiles: [] }
  }
  const others = arr.filter((e) => !entryMatchesRegistration(e, cmd, resolvedCmd, marker))
  settings.hooks[ev] = [...others, desiredHookEntry(matcher, resolvedCmd)]
  const newText = `${JSON.stringify(settings, null, 2)}\n`
  const plan: DiffPlan = {
    files: [{ target: settingsPath, scope: 'HOME', oldText: existing ?? '', newText }],
  }
  if (!ctx.opts.quiet) process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }
  await writeFile(settingsPath, newText)

  // R7 — re-read + grep cmd presence; ENOENT/malformed post-write ⇒ verify-failed.
  let verify: Settings
  try {
    verify = JSON.parse(await readFile(settingsPath, 'utf8')) as Settings
  } catch (e) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/hook_command',
        `verify re-read fail: ${(e as Error).message.slice(0, 200)}`,
        'verify-failed',
      ),
    }
  }
  // v4.20.0 — nested-shape verify against the RESOLVED command.
  if (!verify.hooks?.[ev]?.some((e) => isDesiredHookEntry(e, matcher, resolvedCmd))) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/hook_command',
        `hook '${resolvedCmd.slice(0, 80)}' missing in hooks.${ev}[] after write`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, '', '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [settingsPath] }
}
