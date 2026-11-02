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
import { detectPlatform, getSettingsPath } from '../../platform/platform.js'
import type { CheckResult } from './check-builtin.js'

export interface StaleHooksDeps {
  settingsPath: string
  readText: (p: string) => string | null
  exists: (p: string) => boolean
}

const NAME = 'stale hooks'

/** A versioned assets path (`…/assets/4.32.0/bin/harnessed-stop-hook.mjs`) is a
 *  registration harnessed STILL ships — only its version is stale. Re-running
 *  setup/update re-registers it; `harnessed uninstall` would strip a hook the
 *  user still wants (issue #36). */
const VERSIONED_ASSETS_RE = /\/assets\/[^/]+\//

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

  // v16.0 Phase 63 — codex has no JSON settings file: no hooks registered there.
  // Phase 66 T5 — `skipped`, not a `pass` whose prose says otherwise.
  if (settingsPath === null)
    return {
      name: NAME,
      status: 'skipped',
      message: `no settings file on ${detectPlatform().id} — skipped`,
    }
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

  // Defensive: harnessedStaleHookPaths is null-safe, but a doctor check must
  // NEVER throw (it would reject Promise.all in doctor.ts and discard every
  // other check). Any surprise on a hand-mangled settings.json → skip, not fail.
  let stale: { event: string; path: string }[]
  try {
    stale = harnessedStaleHookPaths(hooks as never, exists)
  } catch {
    return { name: NAME, status: 'pass', message: 'hooks unreadable — skipped' }
  }
  if (stale.length === 0) {
    return { name: NAME, status: 'pass', message: 'no orphaned harnessed hooks' }
  }
  const list = stale.map((s) => `${s.event} → ${s.path}`).join('; ')
  // issue #36 — a version-stale registration is fixed by RE-REGISTERING it, not
  // by uninstalling it (the hook itself is still wanted). A genuinely orphaned
  // entry (the package is gone) keeps the uninstall advice.
  const versioned = stale.filter((s) => VERSIONED_ASSETS_RE.test(s.path.replace(/\\/g, '/')))
  const orphaned = stale.filter((s) => !VERSIONED_ASSETS_RE.test(s.path.replace(/\\/g, '/')))
  const fix =
    versioned.length > 0
      ? `run 'harnessed setup' (or 'harnessed update') to re-register the stale harnessed hook(s) to the current version, or delete the matching Stop/UserPromptSubmit entries from ${settingsPath}${
          orphaned.length > 0
            ? " — entries whose package is gone can also be removed with 'harnessed uninstall'"
            : ''
        }`
      : `run 'harnessed uninstall' to strip them, or delete the matching Stop/UserPromptSubmit entries from ${settingsPath}`
  return {
    name: NAME,
    status: 'warn',
    message: `${stale.length} harnessed hook(s) point at a missing/unresolvable script — Claude Code errors MODULE_NOT_FOUND every prompt (${list})`,
    fix,
  }
}
