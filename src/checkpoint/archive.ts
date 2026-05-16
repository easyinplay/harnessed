// Phase 3.1 W2 T2.2 — checkpoint archive: raw turn-history dump (unbounded).
//
// Companion to `template.ts` (budget-enforced checkpoint envelope). Archive is
// the "raw memory" side of the 双轨 (dual-track) design from R § 2 R7.2:
//   - checkpoint.json     : ≤ 1k token, budget-enforced, REQUIRED for resume
//   - archive/raw-*.json  : unbounded raw turns, for retrospective/debug ONLY
//
// Archive is NEVER fed back into context (no consumer path beyond manual
// inspection); hence no token budget — only checkpoint.json is enforced.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export class ArchiveWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArchiveWriteError'
  }
}

/** Write raw turn history archive (NOT for context reload — for retrospective only).
 *  Path: .harnessed/archive/phase-<X.Y>/raw-<ISO-ts>.json
 *  Unbounded size — only checkpoint.json is budget-enforced (template.ts). */
export function writeArchive(phase: string, rawTurns: unknown[]): string {
  if (!phase || typeof phase !== 'string') {
    throw new ArchiveWriteError('phase must be a non-empty string')
  }
  if (!Array.isArray(rawTurns)) {
    throw new ArchiveWriteError('rawTurns must be an array')
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const path = `.harnessed/archive/phase-${phase}/raw-${timestamp}.json`
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(rawTurns, null, 2), 'utf8')
  return path
}
