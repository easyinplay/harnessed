// 4.38.0 — doctor probe for a HALF-INSTALLED per-turn injection.
//
// `perturn-inject` (UserPromptSubmit) skips re-emitting <project-context> while
// its hash is unchanged; `perturn-inject-invalidate` (SessionStart) drops that
// delta cache whenever the conversation loses the earlier copy — compact
// compresses it away, clear wipes it, resume rebuilds from the record. Without
// the second half the skip keeps firing on behalf of content that is already
// gone, for up to HARNESSED_INJECT_REFRESH_TURNS-1 turns (default 10).
//
// They cannot be one manifest: cc-hook-add registers exactly one hook per
// manifest and the manifest schema has no dependency field. So the pairing is
// only enforceable here, and only as advice.
//
// Warn, never fail: the half-installed state is the pre-4.38.0 behaviour, not a
// broken one — degraded context freshness, not a health blocker. Reads nothing
// but settings.json, and swallows every parse surprise (a doctor check that
// throws rejects doctor.ts's Promise.all and discards every OTHER check).

import { readFileSync } from 'node:fs'
import { entryCommands } from '../../installers/lib/hookEntry.js'
import { getSettingsPath } from '../../platform/platform.js'
import type { CheckResult } from './check-builtin.js'

export interface InjectInvalidateDeps {
  settingsPath: string
  readText: (p: string) => string | null
}

const NAME = 'per-turn inject pairing'

/** Every command string registered under one hook event, null-safe. */
function commandsFor(hooks: Record<string, unknown> | undefined, event: string): string[] {
  const arr = hooks?.[event]
  if (!Array.isArray(arr)) return []
  return arr.flatMap((e) => entryCommands(e as never))
}

export function checkInjectInvalidate(deps?: Partial<InjectInvalidateDeps>): CheckResult {
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

  const raw = readText(settingsPath)
  if (raw === null) return { name: NAME, status: 'pass', message: 'no settings.json' }

  let hooks: Record<string, unknown> | undefined
  try {
    const data = JSON.parse(raw) as { hooks?: Record<string, unknown> }
    hooks = data.hooks && typeof data.hooks === 'object' ? data.hooks : undefined
  } catch {
    return { name: NAME, status: 'pass', message: 'settings.json unreadable — skipped' }
  }

  // Identity is the `inject-state` marker, shared by the npm form
  // (`node …/harnessed-inject-state.mjs`) and the compiled form
  // (`"<binary>" inject-state`) — see hookEntry.COMPILED_HOOK_IDENTITIES.
  const isInject = (c: string) => c.includes('inject-state')
  const perTurn = commandsFor(hooks, 'UserPromptSubmit').some(isInject)
  if (!perTurn) {
    return { name: NAME, status: 'pass', message: 'per-turn injection not installed' }
  }
  const paired = commandsFor(hooks, 'SessionStart').some(
    (c) => isInject(c) && c.includes('--invalidate'),
  )
  if (paired) {
    return { name: NAME, status: 'pass', message: 'per-turn injection + SessionStart invalidation' }
  }
  return {
    name: NAME,
    status: 'warn',
    message:
      'perturn-inject is installed without its SessionStart invalidation half — after a compact/clear the delta cache keeps skipping <project-context> for up to HARNESSED_INJECT_REFRESH_TURNS turns',
    fix: 'harnessed install perturn-inject-invalidate',
  }
}
