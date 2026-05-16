// Phase 2.4 W3 T3.1 — install method 7/7: cc-hook-add (D-04 § 3.1 + R2.4.4 +
// B-20/B-21/B-22). Sister: npxSkillInstaller (L2 HOME write, real-path verify).
// L3 tier (~/.claude/settings.json is shared user-scope state — sister mcp-stdio).
// Deep-merges settings.hooks[event][] (NEVER overwrite). Idempotent on duplicate
// (matching command+matcher → skip with appliedFiles:[]). R7 verify: re-read +
// .some() grep (writeFile exit ≠ filesystem truth — sister npx-skill-installer C6).

import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { preflight } from './lib/preflight.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, InstallError, Installer } from './lib/types.js'

function err(ctx: InstallContext, path: string, message: string, keyword: string): InstallError {
  return { file: ctx.manifest.metadata.name, path, message, line: null, column: null, keyword }
}

interface Settings {
  hooks?: Record<string, { matcher?: string; command: string }[]>
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

  const settingsPath = join(homedir(), '.claude', 'settings.json')
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
  settings.hooks[ev] = settings.hooks[ev] ?? []
  if (settings.hooks[ev].some((h) => h.command === cmd && h.matcher === matcher)) {
    return { ok: true, backupId: 'idempotent-skip', appliedFiles: [] }
  }
  settings.hooks[ev].push({ matcher, command: cmd })
  const newText = `${JSON.stringify(settings, null, 2)}\n`
  const plan: DiffPlan = {
    files: [{ target: settingsPath, scope: 'HOME', oldText: existing ?? '', newText }],
  }
  process.stdout.write(renderDiff(plan, ctx))

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
  if (!verify.hooks?.[ev]?.some((h) => h.command === cmd)) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/hook_command',
        `hook '${cmd.slice(0, 80)}' missing in hooks.${ev}[] after write`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, '', '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [settingsPath] }
}
