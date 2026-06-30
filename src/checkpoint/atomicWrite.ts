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

// v4.11.1 — UNIQUE temp suffix per write. A shared `<path>.tmp` races when two
// writers target the same path concurrently (parallel `harnessed setup`
// force-update installers all calling `updateInstalled()` on state.json): both
// write `<path>.tmp`, the first rename moves it, the second rename hits ENOENT.
// pid + a monotonic counter is unique per process+call without Date.now()/random.
// (Last-writer-wins on content is acceptable — state.json is best-effort, per the
// state.ts "data loss over crash" contract — but the ENOENT crash is not.)
let tmpSeq = 0
function tmpName(path: string): string {
  return `${path}.${process.pid}.${++tmpSeq}.tmp`
}

// v4.11.1 — bounded rename retry. Unique tmp names kill the ENOENT collision, but
// on Windows `MoveFileEx` (rename-replace) throws transient EPERM/EACCES/EBUSY
// when concurrent writers contend on the SAME target (a parallel force-update all
// renaming onto state.json). These clear in microseconds, so retry briefly; only
// a persistent failure propagates (state.ts already prefers data-loss over crash).
const TRANSIENT_RENAME = new Set(['EPERM', 'EACCES', 'EBUSY', 'ENOENT'])
const RENAME_RETRIES = 10
const isTransient = (e: unknown): boolean =>
  TRANSIENT_RENAME.has((e as NodeJS.ErrnoException)?.code ?? '')

/** Async atomic write: temp file → rename (transient-contention retry). */
export async function writeFileAtomic(path: string, data: string): Promise<void> {
  const tmp = tmpName(path)
  await writeFile(tmp, data, 'utf8')
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, path)
      return
    } catch (e) {
      if (i >= RENAME_RETRIES || !isTransient(e)) throw e
      await new Promise((r) => setTimeout(r, 10 * (i + 1)))
    }
  }
}

/** Sync atomic write: temp file → rename (transient-contention retry, immediate). */
export function writeFileSyncAtomic(path: string, data: string): void {
  const tmp = tmpName(path)
  writeFileSync(tmp, data, 'utf8')
  for (let i = 0; ; i++) {
    try {
      renameSync(tmp, path)
      return
    } catch (e) {
      if (i >= RENAME_RETRIES || !isTransient(e)) throw e
    }
  }
}
