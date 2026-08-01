// src/checkpoint/codegraphInit.ts — first-time CodeGraph index bootstrap.
//
// Hung on the WORKFLOW-complete transition of the `task` master (see
// src/cli/checkpoint.ts runCheckpointComplete, right after the
// `completePhase({ transitionWorkflowComplete: allResolved })` call). Deliberately
// engine-side rather than SKILL prose: a step the model must remember to run is the
// exact failure mode this repo keeps re-fixing.
//
// Contract (all four are load-bearing):
//   1. `codegraph` not on PATH → COMPLETELY silent. Absence of an opt-in tool is
//      never a nag (same standing contract as workflows/task/code/SKILL.md's
//      "No `.codegraph/` → skip this (no install nag)").
//   2. `.codegraph/` already present → do nothing. Upstream's watcher auto-syncs the
//      index on every file change, so a periodic re-index would be redundant work.
//      This is a FIRST-TIME bootstrap only.
//   3. Never blocks. The indexer is detach-spawned with stdio ignored and unref'd;
//      `checkpoint complete` neither waits for it nor fails on it. Every failure
//      path here degrades to at most one stderr note.
//   4. Re-entrancy-safe ACROSS PROCESSES. Two `checkpoint complete` runs in quick
//      succession are two separate CLI processes and both would still see no
//      `.codegraph/`, so an in-process flag is not enough — the launch slot is
//      claimed with an exclusive-create sentinel under the harness state root.

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { binaryOnPath } from '../installers/lib/binaryProbe.js'
import { harnessedSubdir } from '../platform/harnessedRoot.js'

export type CodegraphInitOutcome =
  /** `.codegraph/` already exists — the watcher keeps it fresh; nothing to do. */
  | 'index-present'
  /** `codegraph` is not installed — silent, no nag. */
  | 'no-binary'
  /** Another completion already claimed the launch slot. */
  | 'already-claimed'
  /** The detach-spawn itself threw (fail-soft: noted, never rethrown). */
  | 'launch-failed'
  | 'launched'

export interface CodegraphInitDeps {
  cwd: string
  hasIndex(cwd: string): boolean
  hasBinary(): boolean
  /** Claim the one-shot launch slot; false = someone else already has it. */
  claim(cwd: string): boolean
  /** Detach-spawn `codegraph init`. MUST return immediately. */
  launch(cwd: string): void
  note(msg: string): void
}

/** A crashed indexer must not block the bootstrap forever — a claim older than
 *  this is re-claimable. Generous: a cold full index of a large repo is minutes. */
const STALE_CLAIM_MS = 30 * 60_000

function claimPath(cwd: string): string {
  const key = createHash('sha1').update(resolve(cwd)).digest('hex').slice(0, 16)
  return join(harnessedSubdir('codegraph-init'), `${key}.claim`)
}

/** Exclusive-create sentinel = the cross-process launch lock. `wx` fails when the
 *  file exists, which is precisely "someone else got here first". */
function realClaim(cwd: string): boolean {
  const path = claimPath(cwd)
  const stamp = new Date().toISOString()
  try {
    mkdirSync(dirname(path), { recursive: true })
  } catch {
    return false
  }
  try {
    writeFileSync(path, stamp, { flag: 'wx' })
    return true
  } catch {
    try {
      if (Date.now() - statSync(path).mtimeMs < STALE_CLAIM_MS) return false
      writeFileSync(path, stamp)
      return true
    } catch {
      return false
    }
  }
}

function realLaunch(cwd: string): void {
  // `spawn` can be undefined under a partial `node:child_process` factory mock
  // (sister: installers/lib/binaryProbe.ts realRun).
  if (typeof spawn !== 'function') return
  const win = process.platform === 'win32'
  // Windows: `codegraph` on PATH is a .cmd shim that CreateProcess cannot exec
  // directly, so it goes through cmd.exe /c — argv-mode, NOT `shell: true` (which
  // concatenates instead of escaping and trips Node 22's DEP0190). Sister:
  // src/uninstallers/npmCli.ts:34.
  // POSIX: `detached` puts it in its own process group, so the CLI's exit (or a
  // Ctrl-C to the CLI's group) never takes the indexer down with it.
  const child = win
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'codegraph', 'init'], {
        cwd,
        stdio: 'ignore',
        windowsHide: true,
      })
    : spawn('codegraph', ['init'], { cwd, stdio: 'ignore', detached: true })
  // ENOENT / EACCES arrive asynchronously as an 'error' event; unhandled it would
  // become an uncaught exception AFTER this function returned.
  child.on('error', () => {})
  child.unref()
}

export type IgnoreOutcome = 'already' | 'appended' | 'created' | 'error'

const IGNORE_LINE = '.codegraph/'

function ignoresCodegraph(body: string): boolean {
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '' || line.startsWith('#') || line.startsWith('!')) continue
    if (line.replace(/^\//, '').replace(/\/$/, '') === '.codegraph') return true
  }
  return false
}

/** Ensure `.codegraph/` is git-ignored. The index is a SQLite DB
 *  (`.codegraph/codegraph.db`) and upstream's `codegraph init` does NOT add the
 *  directory to `.gitignore`, so an unignored one gets swept into the next
 *  `git add -A`. APPEND-ONLY: an existing ignore file is never rewritten or
 *  reordered; a missing one is created with just this line. */
export function ensureCodegraphIgnored(cwd: string): IgnoreOutcome {
  const path = join(cwd, '.gitignore')
  try {
    if (!existsSync(path)) {
      writeFileSync(path, `${IGNORE_LINE}\n`)
      return 'created'
    }
    const body = readFileSync(path, 'utf8')
    if (ignoresCodegraph(body)) return 'already'
    appendFileSync(path, `${body.endsWith('\n') || body === '' ? '' : '\n'}${IGNORE_LINE}\n`)
    return 'appended'
  } catch {
    return 'error'
  }
}

/** First-time-only, background, fail-soft CodeGraph bootstrap. Returns the outcome
 *  for tests/callers; NEVER throws, never blocks, never exits non-zero. */
export function maybeInitCodeGraph(
  overrides: Partial<CodegraphInitDeps> = {},
): CodegraphInitOutcome {
  const cwd = overrides.cwd ?? process.cwd()
  const hasIndex = overrides.hasIndex ?? ((c: string) => existsSync(join(c, '.codegraph')))
  const hasBinary = overrides.hasBinary ?? (() => binaryOnPath('codegraph'))
  const claim = overrides.claim ?? realClaim
  const launch = overrides.launch ?? realLaunch
  const note =
    overrides.note ??
    ((m: string) => {
      console.error(m)
    })

  // Index first: it is a single existsSync, so the already-indexed common case
  // never pays for the PATH probe's subprocess.
  if (hasIndex(cwd)) return 'index-present'
  if (!hasBinary()) return 'no-binary'
  if (!claim(cwd)) return 'already-claimed'

  try {
    launch(cwd)
  } catch (e) {
    note(`[harnessed] codegraph init could not be started (ignored): ${(e as Error).message}`)
    return 'launch-failed'
  }
  note(
    `[harnessed] codegraph init started in the background for ${cwd} — the next task gets a semantic index (first-time only; upstream's watcher keeps it fresh).`,
  )
  const ignored = ensureCodegraphIgnored(cwd)
  if (ignored === 'appended' || ignored === 'created') {
    note(
      `[harnessed] appended \`${IGNORE_LINE}\` to ${join(cwd, '.gitignore')} — the index is a SQLite DB, and an unignored one gets swept into the next \`git add -A\`.`,
    )
  }
  return 'launched'
}
