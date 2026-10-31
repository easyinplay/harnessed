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
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { withSettingsTransactionLock } from '../cli/lib/settingsTransactionLock.js'
import { atomicWrite } from '../cli/lib/settingsWriter.js'
import { checkCmdString } from '../manifest/security.js'
import { getAssetsRoot, isCompiledRuntime } from '../platform/assetsRoot.js'
import { detectPlatform, getSettingsPath } from '../platform/platform.js'
import { installCodexHook } from './codexHookAdd.js'
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
import { preflight } from './lib/preflight.js'
import { recordObservedInstall, updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer, InstallResult } from './lib/types.js'

interface Settings {
  hooks?: Record<string, AnyHookEntry[]>
  [k: string]: unknown
}

type PreparedHookSettings =
  | { ok: false; result: InstallResult }
  | {
      ok: true
      existing: string | null
      resolvedCmd: string
      desired: boolean
      plan: DiffPlan
    }

async function prepareHookSettings(
  ctx: Parameters<Installer>[0],
  settingsPath: string,
): Promise<PreparedHookSettings> {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook-add') {
    return {
      ok: false,
      result: {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/spec/install/method',
          `dispatch bug: ${install.method}`,
          'dispatch-mismatch',
        ),
      },
    }
  }
  let existing: string | null
  try {
    existing = await readFile(settingsPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      return {
        ok: false,
        result: {
          ok: false,
          phase: 'preflight',
          error: err(
            ctx,
            '/',
            `read settings.json failed: ${(error as Error).message}`,
            'settings-json-malformed',
          ),
        },
      }
    }
    existing = null
  }
  let settings: Settings
  try {
    settings = JSON.parse(existing ?? '{}') as Settings
  } catch (error) {
    return {
      ok: false,
      result: {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/',
          `malformed settings.json: ${(error as Error).message.slice(0, 200)}`,
          'settings-json-malformed',
        ),
      },
    }
  }
  if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) {
    return {
      ok: false,
      result: {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/',
          `malformed settings.json: top-level value must be a JSON object, got ${
            settings === null ? 'null' : Array.isArray(settings) ? 'array' : typeof settings
          }`,
          'settings-json-malformed',
        ),
      },
    }
  }
  if (
    settings.hooks !== undefined &&
    (settings.hooks === null || typeof settings.hooks !== 'object' || Array.isArray(settings.hooks))
  ) {
    return {
      ok: false,
      result: {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/',
          'malformed settings.json: hooks must be a JSON object',
          'settings-json-malformed',
        ),
      },
    }
  }
  settings.hooks = settings.hooks ?? {}
  const cmdDeps = {
    assetsRoot: getAssetsRoot,
    exists: existsSync,
    compiledExecPath: () => (isCompiledRuntime() ? process.execPath : null),
  }
  const resolvedCmd = resolveHookCommand(install.hook_command, cmdDeps)
  const marker = hookScriptMarker(install.hook_command)
  const arr = settings.hooks[install.hook_event] ?? []
  if (!Array.isArray(arr)) {
    return {
      ok: false,
      result: {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/',
          `malformed settings.json: hooks.${install.hook_event} must be an array`,
          'settings-json-malformed',
        ),
      },
    }
  }
  const ours = arr.filter((entry) =>
    entryMatchesRegistration(entry, install.hook_command, resolvedCmd, marker),
  )
  const desired =
    ours.length === 1 && isDesiredHookEntry(ours[0] ?? {}, install.hook_matcher, resolvedCmd)
  const others = arr.filter(
    (entry) => !entryMatchesRegistration(entry, install.hook_command, resolvedCmd, marker),
  )
  settings.hooks[install.hook_event] = [
    ...others,
    desiredHookEntry(install.hook_matcher, resolvedCmd),
  ]
  const newText = `${JSON.stringify(settings, null, 2)}\n`
  return {
    ok: true,
    existing,
    resolvedCmd,
    desired,
    plan: { files: [{ target: settingsPath, scope: 'HOME', oldText: existing ?? '', newText }] },
  }
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

  // v16.0 Phase 64 (ADR 0041) — codex has no settings.json hooks surface: the hook
  // ships as a local codex plugin instead (codexHookAdd.ts).
  if ((ctx.hostContext?.hostId ?? detectPlatform().id) === 'codex') return installCodexHook(ctx)
  const settingsPath = ctx.hostContext
    ? join(ctx.hostContext.nativeHome, 'settings.json')
    : getSettingsPath()
  // v16.0 Phase 63 — no JSON settings file on this (non-claude, non-codex) platform.
  if (settingsPath === null) return { aborted: true, reason: 'platform-mismatch' }
  const ev = install.hook_event
  const cmd = install.hook_command
  // Defense in depth: validate() now screens hook_command, but a manifest can reach
  // an installer without passing through it, and this string is persisted into
  // settings.json and executed by Claude Code on every matching event. Sister
  // re-screen: the H2 arg check in ccPluginMarketplace / mcpStdioAdd.
  const cmdViolation = checkCmdString(cmd)
  if (cmdViolation) {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/hook_command',
        `shell escape detected in hook_command: ${cmdViolation.label} (${cmdViolation.hint})`,
        'security-gate-bypass',
      ),
    }
  }
  // v4.20.0 — authoritative command resolution + CC-schema entry shape + self-heal.
  // 4.27.0 (B3 T1 / D6) — compiled binaries register `"<binary>" inject-state`
  // (the hook calls the binary itself; no host node needed).
  const preview = await prepareHookSettings(ctx, settingsPath)
  if (!preview.ok) return preview.result
  if (preview.desired) {
    let result: InstallResult | null
    try {
      result = await withSettingsTransactionLock(ctx.hostContext, async () => {
        const current = await prepareHookSettings(ctx, settingsPath)
        if (!current.ok) return current.result
        return current.desired
          ? ({ ok: true, alreadyInstalled: true, backupId: 'idempotent-skip' } as const)
          : null
      })
    } catch (error) {
      return {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/',
          `settings transaction lock failed: ${(error as Error).message}`,
          'settings-write-failed',
        ),
      }
    }
    if (result !== null) {
      if ('ok' in result && result.ok && ctx.opts.apply && !ctx.opts.dryRun) {
        await recordObservedInstall(
          ctx.cwd,
          ctx.manifest.metadata.name,
          '',
          '',
          ...(ctx.hostContext ? [ctx.hostContext] : []),
        )
      }
      return result
    }
  }
  if (!ctx.opts.quiet) process.stdout.write(renderDiff(preview.plan, ctx))

  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  let transaction: InstallResult
  try {
    transaction = await withSettingsTransactionLock(ctx.hostContext, async () => {
      const current = await prepareHookSettings(ctx, settingsPath)
      if (!current.ok) return current.result
      if (current.desired) return { ok: true, alreadyInstalled: true, backupId: 'idempotent-skip' }
      const bk = await backup(current.plan, ctx)
      if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error } as const
      const writeError = await atomicWrite(settingsPath, current.plan.files[0]?.newText ?? '')
      if (writeError) {
        return {
          ok: false,
          phase: 'spawn',
          backupId: bk.backupId,
          error: err(ctx, '/', writeError, 'settings-write-failed'),
        } as const
      }
      let verify: Settings
      try {
        verify = JSON.parse(await readFile(settingsPath, 'utf8')) as Settings
      } catch (error) {
        return {
          ok: false,
          phase: 'verify',
          backupId: bk.backupId,
          error: err(
            ctx,
            '/spec/install/hook_command',
            `verify re-read fail: ${(error as Error).message.slice(0, 200)}`,
            'verify-failed',
          ),
        } as const
      }
      if (
        !verify.hooks?.[ev]?.some((entry) =>
          isDesiredHookEntry(entry, install.hook_matcher, current.resolvedCmd),
        )
      ) {
        return {
          ok: false,
          phase: 'verify',
          backupId: bk.backupId,
          error: err(
            ctx,
            '/spec/install/hook_command',
            `hook '${current.resolvedCmd.slice(0, 80)}' missing in hooks.${ev}[] after write`,
            'verify-failed',
          ),
        } as const
      }
      return { ok: true, backupId: bk.backupId, appliedFiles: [settingsPath] }
    })
  } catch (error) {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/',
        `settings transaction lock failed: ${(error as Error).message}`,
        'settings-write-failed',
      ),
    }
  }
  if (!('ok' in transaction) || !transaction.ok) return transaction

  await updateInstalled(
    ctx.cwd,
    ctx.manifest.metadata.name,
    '',
    '',
    ...(ctx.hostContext ? [ctx.hostContext] : []),
  )
  return transaction
}
