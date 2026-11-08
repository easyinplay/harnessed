// src/cli/lib/resultArtifact.ts — Phase 86 transport: the deterministic path a
// spawned sub writes its final result to.
//
// WHY this exists. The CC-native orchestration path (`harnessed prompt` → spawn →
// `harnessed checkpoint complete --result-file <path>`) used to treat the final
// chat message as the completion signal. Under claude-code's agent-teams mode a
// re-parented subagent's completion notification is routed to the parent and never
// reaches the orchestrator (open-gsd/gsd-core#1355), so the completion signal has
// to be an artifact the orchestrator goes and READS — never a notification it hopes
// to receive.
//
// The path is a PURE function of (cwd, session, sub): no clock, no randomness, no
// PID. The orchestrator and the sub therefore agree on the path with no handshake,
// and `harnessed checkpoint complete --result-file` can point at it without the
// caller inventing a name.

import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { activeKey, repoKey } from '../../checkpoint/workflowStore.js'
import { checkSafeSegment } from '../../manifest/lib/path-guard.js'

/** Scope digest length (hex chars). Short enough to stay readable inside a path,
 *  long enough that two sessions of one repo do not collide in practice. */
const SCOPE_HEX_LEN = 8

/** Stand-in for the missing session half of the scope key. `activeKey()` degrades
 *  to the BARE repo key when the host exposes no session id, which would collide
 *  with the repo's single-session slot; the literal keeps the two apart while
 *  staying deterministic (no clock, no randomness). */
const NO_SESSION = 'nosession'

/** 8-hex-char scope digest of the active (repo, session) slot.
 *
 *  The digest input is `activeKey()` — `repoKey::sessionId` — verbatim, so the
 *  scope moves with the ledger slot the checkpoint store already uses. When the
 *  host exposes no session id, `activeKey()` returns the bare repo key and the
 *  missing half is pinned to `nosession` rather than dropped (dropping it would
 *  make the no-session slot indistinguishable from a real one). */
export function resultArtifactScope(cwd: string = process.cwd()): string {
  const base = repoKey(cwd)
  const key = activeKey(cwd)
  const composite = key === base ? `${base}::${NO_SESSION}` : key
  return createHash('sha256').update(composite, 'utf8').digest('hex').slice(0, SCOPE_HEX_LEN)
}

/**
 * Absolute path of the result artifact for `sub`.
 *
 *  `<cwd>/.harnessed/results/<scope>/<sub>.md`
 *
 *  `sub` goes through the existing safe-segment guard first: it is a path segment
 *  built from a CLI argument, and a `../` in it must never escape the results dir.
 */
export function resultArtifactPath(sub: string, cwd: string = process.cwd()): string {
  checkSafeSegment(sub)
  return resolve(cwd, '.harnessed', 'results', resultArtifactScope(cwd), `${sub}.md`)
}
