// issue #8 — doctor self-heal probe for orphaned harnessed hooks.
//
// After the harnessed package is removed (npm uninstall -g, or any teardown that
// skipped hook cleanup), ~/.claude/settings.json can retain Stop /
// UserPromptSubmit registrations pointing at a now-deleted bin/*.mjs. Claude
// Code then errors `node:internal/modules/cjs/loader … MODULE_NOT_FOUND` on
// EVERY prompt / Stop. This check flags those stale entries (warn-only) and
// points at `harnessed uninstall` (which now strips them) or a manual edit.
//
// Warn, never fail: a stale hook is annoying, not a harnessed-health blocker,
// and doctor may run on a machine where the user WANTS a manual fix. Only
// ABSOLUTE script paths that authoritatively do not exist are reported —
// harnessedStaleHookPaths skips bare/relative tokens to avoid false positives.

import { existsSync, readFileSync } from 'node:fs'
import { harnessedStaleHookPaths } from '../../installers/lib/harnessedHookTeardown.js'
import { getSettingsPath } from '../../installers/lib/platform.js'
import type { CheckResult } from './check-builtin.js'

export interface StaleHooksDeps {
  settingsPath: string
  readText: (p: string) => string | null
  exists: (p: string) => boolean
}

const NAME = 'stale hooks'

export function checkStaleHooks(deps?: Partial<StaleHooksDeps>): CheckResult {
  const settingsPath = deps?.settingsPath ?? getSettingsPath()
  const readText =
    deps?.readText ??
    ((p: string) => {
      try {
        return readFileSync(p, 'utf8')
      } catch {
        return null
      }
    })
  const exists = deps?.exists ?? existsSync

  const raw = readText(settingsPath)
  if (raw === null) return { name: NAME, status: 'pass', message: 'no settings.json' }

  let data: { hooks?: Record<string, unknown[]> }
  try {
    data = JSON.parse(raw) as typeof data
  } catch {
    return { name: NAME, status: 'pass', message: 'settings.json unreadable — skipped' }
  }
  const hooks = data.hooks
  if (!hooks || typeof hooks !== 'object') {
    return { name: NAME, status: 'pass', message: 'no hooks registered' }
  }

  const stale = harnessedStaleHookPaths(hooks as never, exists)
  if (stale.length === 0) {
    return { name: NAME, status: 'pass', message: 'no orphaned harnessed hooks' }
  }
  const list = stale.map((s) => `${s.event} → ${s.path}`).join('; ')
  return {
    name: NAME,
    status: 'warn',
    message: `${stale.length} harnessed hook(s) point at a deleted script — Claude Code errors MODULE_NOT_FOUND every prompt (${list})`,
    fix: `run 'harnessed uninstall' to strip them, or delete the matching Stop/UserPromptSubmit entries from ${settingsPath}`,
  }
}
