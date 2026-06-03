// src/checkpoint/atomicWrite.ts — crash-safe file writes (v4.1.3).
//
// Plain writeFile/writeFileSync over a live file leaves a half-written/corrupt
// file if the process crashes or loses power mid-write. For the harness state
// singletons (current-workflow.json, checkpoint envelopes, archive dumps) a
// corrupt write is data loss the resume path can't recover. Write to a sibling
// `<path>.tmp` first, then rename — rename is atomic on the same filesystem, so
// a reader sees either the old file or the complete new one, never a partial.

import { renameSync, writeFileSync } from 'node:fs'
import { rename, writeFile } from 'node:fs/promises'

/** Async atomic write: temp file → rename. */
export async function writeFileAtomic(path: string, data: string): Promise<void> {
  const tmp = `${path}.tmp`
  await writeFile(tmp, data, 'utf8')
  await rename(tmp, path)
}

/** Sync atomic write: temp file → rename. */
export function writeFileSyncAtomic(path: string, data: string): void {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, data, 'utf8')
  renameSync(tmp, path)
}
