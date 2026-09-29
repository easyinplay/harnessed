// v16.0 Phase 66 T2 — the wall-clock cap shared by BOTH spawn paths.
//
// Extracted from sdkSpawn.ts (which still re-exports DEFAULT_SPAWN_TIMEOUT_MS so
// nothing importing it has to move) because `codexExecSpawn` needs the same
// budget and must not import sdkSpawn: that module loads
// `@anthropic-ai/claude-agent-sdk` at the top level, which has no business
// being pulled into the codex subprocess path.

/** One hour. A real phase can legitimately run long; the cap exists so a hung
 *  subagent cannot hang a CI job forever (ralph-loop bounds iterations, not time). */
export const DEFAULT_SPAWN_TIMEOUT_MS = 60 * 60 * 1000

/** `HARNESSED_SPAWN_TIMEOUT_MS` when it parses to a non-negative integer, else
 *  the default. 0 disables the cap. */
export function envSpawnTimeoutMs(): number {
  const raw = Number.parseInt(process.env.HARNESSED_SPAWN_TIMEOUT_MS ?? '', 10)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_SPAWN_TIMEOUT_MS
}
