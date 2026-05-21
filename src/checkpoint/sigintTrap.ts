// Phase 3.1 W4 T4.1 — SIGINT trap (D-02 Karpathy YAGNI — Node native zero-dep per RESEARCH § 2.1-2.3).
// isShuttingDown guard prevents double-fire; 2nd Ctrl+C force quits (OS behavior Node cannot override).
// 30s timeout fallback for async checkpoint hangs. Standard SIGINT exit code 128+2 = 130.
// v3.0.3 — archive path routed through `getHarnessedRoot()` SoT (sister engineHook).
import { join } from 'node:path'
import { harnessedSubdir } from '../installers/lib/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { pause } from './state.js'
import { writeCheckpoint } from './template.js'

let isShuttingDown = false

type ActiveCtx = { phase: string; sessionId?: string; lastTask: string }

export function registerSigintTrap(getActiveContext: () => ActiveCtx | null): void {
  process.on('SIGINT', () => {
    if (isShuttingDown) {
      console.error('\n[harnessed] force quit (2nd Ctrl+C) — checkpoint may be incomplete')
      process.exit(130)
    }
    isShuttingDown = true
    console.error('\n[harnessed] SIGINT — writing checkpoint (Ctrl+C again to force quit)...')
    const ctx = getActiveContext()
    if (!ctx) return process.exit(130)
    const t = setTimeout(() => {
      console.error('[harnessed] checkpoint write timeout — force exit')
      process.exit(130)
    }, 30000)
    Promise.all([
      Promise.resolve().then(() => writeCheckpoint(buildPausedCheckpoint(ctx))),
      pause(),
    ])
      .then(() => {
        clearTimeout(t)
        console.error('[harnessed] checkpoint written. Run `harnessed resume` to continue.')
        process.exit(130)
      })
      .catch((err) => {
        clearTimeout(t)
        console.error('[harnessed] checkpoint write failed:', err)
        process.exit(1)
      })
  })
}

function buildPausedCheckpoint(ctx: ActiveCtx) {
  return {
    schemaVersion: SCHEMA_VERSIONS.checkpoint,
    phase: ctx.phase,
    status: 'paused' as const,
    last_task: ctx.lastTask,
    key_decisions: [],
    canonical_refs: [],
    ...(ctx.sessionId ? { session_id: ctx.sessionId } : {}),
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
    archive_path: `${join(harnessedSubdir('archive'), `phase-${ctx.phase}`)}/`,
  }
}

/** Reset flag (for tests). */
export function resetSigintTrap(): void {
  isShuttingDown = false
}
