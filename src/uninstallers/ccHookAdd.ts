// Phase 5.2 W1 T1.2 — uninstall method 7/7: cc-hook-add.
// Reverse JSON deep-merge: filter matching hook entry from ~/.claude/settings.json.
// Idempotent: settings.json absent or hook not present → ok:true noop.
// Sister: src/installers/ccHookAdd.ts — inverse of install-time merge.

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { withSettingsTransactionLock } from '../cli/lib/settingsTransactionLock.js'
import { atomicWrite } from '../cli/lib/settingsWriter.js'
import { removeCodexHook } from '../installers/codexHookAdd.js'
import {
  type AnyHookEntry,
  entryMatchesRegistration,
  hookScriptMarker,
  resolveHookCommand,
} from '../installers/lib/hookEntry.js'
import { getAssetsRoot } from '../platform/assetsRoot.js'
import { captureHostInstallContext } from '../platform/hostInstallContext.js'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

interface Settings {
  hooks?: Record<string, AnyHookEntry[]>
  [k: string]: unknown
}

export const uninstallCcHookAdd: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook-add') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  // v16.0 Phase 64 (ADR 0041) — codex: the hook is a local codex plugin.
  const context = ctx.hostContext ?? captureHostInstallContext()
  if (context.hostId === 'codex') {
    const r = await removeCodexHook(ctx.manifest.metadata.name, install.hook_event, context)
    return r.ok
      ? r
      : {
          ok: false,
          phase: 'phase' in r && r.phase === 'preflight' ? 'preflight' : 'spawn',
          error: r.error,
        }
  }
  // v4.14.0 — settings path via descriptor (claude byte-identical).
  const settingsPath =
    context.platform.settingsPath === null ? null : join(context.nativeHome, 'settings.json')
  // v16.0 Phase 63 — no JSON settings file (codex) → no hook can be registered.
  if (settingsPath === null) return { ok: true, removedPaths: [] }
  try {
    return await withSettingsTransactionLock(context, async () => {
      let existing: string
      try {
        existing = await readFile(settingsPath, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return { ok: true, removedPaths: [] }
        }
        return { ok: false, phase: 'preflight', error: (error as Error).message }
      }

      let settings: Settings
      try {
        settings = JSON.parse(existing) as Settings
      } catch (e) {
        return {
          ok: false,
          phase: 'preflight',
          error: `malformed settings.json: ${(e as Error).message.slice(0, 200)}`,
        }
      }
      if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) {
        return { ok: false, phase: 'preflight', error: 'malformed settings.json: expected object' }
      }

      const ev = install.hook_event
      const cmd = install.hook_command
      if (!settings.hooks?.[ev]) return { ok: true, removedPaths: [] }
      if (!Array.isArray(settings.hooks[ev])) {
        return {
          ok: false,
          phase: 'preflight',
          error: `malformed settings.json: hooks.${ev} must be an array`,
        }
      }

      const resolved = resolveHookCommand(cmd, { assetsRoot: getAssetsRoot, exists: existsSync })
      const marker = hookScriptMarker(cmd)
      const before = settings.hooks[ev].length
      settings.hooks[ev] = settings.hooks[ev].filter(
        (hook) => !entryMatchesRegistration(hook, cmd, resolved, marker),
      )
      if (settings.hooks[ev].length === before) return { ok: true, removedPaths: [] }
      if (settings.hooks[ev].length === 0) delete settings.hooks[ev]
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks

      const writeError = await atomicWrite(settingsPath, `${JSON.stringify(settings, null, 2)}\n`)
      if (writeError) return { ok: false, phase: 'spawn', error: writeError }
      return { ok: true, removedPaths: [settingsPath] }
    })
  } catch (error) {
    return {
      ok: false,
      phase: 'preflight',
      error: `settings transaction lock failed: ${(error as Error).message}`,
    }
  }
}
