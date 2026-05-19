// Phase 5.2 W1 T1.2 — uninstall method 7/7: cc-hook-add.
// Reverse JSON deep-merge: filter matching hook entry from ~/.claude/settings.json.
// Idempotent: settings.json absent or hook not present → ok:true noop.
// Sister: src/installers/ccHookAdd.ts — inverse of install-time merge.

import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

interface Settings {
  hooks?: Record<string, { matcher?: string; command: string }[]>
  [k: string]: unknown
}

export const uninstallCcHookAdd: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook-add') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  const settingsPath = join(homedir(), '.claude', 'settings.json')
  let existing: string
  try {
    existing = await readFile(settingsPath, 'utf8')
  } catch {
    // File absent — hook can't be present, idempotent noop.
    return { ok: true, removedPaths: [] }
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

  const ev = install.hook_event
  const cmd = install.hook_command
  const matcher = install.hook_matcher

  if (!settings.hooks?.[ev]) {
    // Hook event block absent — idempotent noop.
    return { ok: true, removedPaths: [] }
  }

  const before = settings.hooks[ev].length
  settings.hooks[ev] = settings.hooks[ev].filter(
    (h) => !(h.command === cmd && h.matcher === matcher),
  )

  // Clean up empty hook event array.
  if (settings.hooks[ev].length === 0) delete settings.hooks[ev]
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks

  if (settings.hooks?.[ev]?.length === before || before === settings.hooks?.[ev]?.length) {
    // No change — hook was not present, idempotent noop.
  }

  const newText = `${JSON.stringify(settings, null, 2)}\n`
  await writeFile(settingsPath, newText)

  return { ok: true, removedPaths: [settingsPath] }
}
