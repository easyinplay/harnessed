# Phase 5.1 — Research

**Researched:** 2026-05-19
**Domain:** CLI audit log consumer (jq subprocess, redact, format, pagination) + concurrent file-lock (proper-lockfile)
**Confidence:** HIGH (codebase verified + npm registry + official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 FilterSyntax: jq pipe内嵌 invocation — `child_process.spawn('jq', [filterExpr])` stdio pipe
- D-02 OutputFormat: dual format — default human table 5 cols + `--json` flag opt-in 12-field
- D-03 PaginationFlags: minimal MVP 3 flag — `--tail N` (default 50) + `--head N` + `--reverse`
- D-04 SecurityRedact: consumer 2重 redact 5 patterns + `[REDACTED]` replace
- D-05 LockImpl: `proper-lockfile` npm dep (runtime, NOT devDep)
- D-06 RetryPolicy: `{ retries: 3, factor: 2, minTimeout: 100 }` ~700ms + throw LockHeldError
- D-07 ForceFlag: NO `--force`; `harnessed status` shows lock holder pid + timestamp
- D-08 LockScope: dir-level lock `.harnessed/.lock` via `lockfile.lock('.harnessed', opts)`
- M-01 PhaseClass: ARCHITECTURAL — full ship cadence (ADR 0021 + ci.yml A7 iter + triple tag)

### Claude's Discretion
- W0 sub-batch #BF/#BG ABSORB boundary (Wave B atomic refactor scope, planner discretion)
- `src/cli/audit-log.ts` module path (confirmed: top-level `audit-log` NOT nested under `audit`)
- `harnessed audit-log` top-level subcommand (NOT nested under `harnessed audit`)
- Concurrent write lock sites: which fn families to wrap

### Deferred Ideas (OUT OF SCOPE)
- `--since / --until / --sort` flags → v0.6+
- Operation-level lock (7 fn 各锁自己) → v0.6+
- JSONPath / DSL filter syntax → rejected permanently
- `--force` flag → rejected permanently
- Interactive REPL → v0.6+
- Dashboard / visualization → v1.0+
- #BH/#BI/#BJ/#BK LOW cosmetic items → Phase 5.2+
- #BL/#BM sdkSpawn as any / AgentDef SDK coupling → PERMANENT DEFER (F40-2)
</user_constraints>

---

## Summary

Phase 5.1 delivers two capabilities: R10.1 `harnessed audit-log` CLI consumer that reads the Phase 4.3-shipped JSONL at `.harnessed/audit.log`, and R10.2 concurrent write lock wrapping all `.harnessed/*` write sites via `proper-lockfile`.

R10.1 requires a new `src/cli/audit-log.ts` module (~130-150L) that (1) reads and line-splits the JSONL, (2) applies pagination via slice, (3) applies 5-pattern redact regex over `task_excerpt`, (4) optionally pipes JSONL through `jq` subprocess for `--filter`, and (5) renders either a manual 5-col table or `--json` pretty-print. R10.2 requires adding `proper-lockfile@4.1.2` to `dependencies` and wrapping all async write sites in `checkpoint/` (state.ts `writeCurrentWorkflow`, engineHook.ts `activatePhase`/`completePhase`, template.ts `writeCheckpoint`, archive.ts `writeArchive`) with a single dir-level acquire/release guard.

**Primary recommendation:** Implement `src/cli/audit-log.ts` NEW + `src/checkpoint/lockGuard.ts` NEW (~40L helper) + modify 4 write-site callers. ADR 0021 = 1-page anchor. ci.yml A7 `0018` → `0018 0019 0020 0021`. W0 #BF+#BG ABSORB recommended in Wave B.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| R10.1 audit-log read + render | CLI (src/cli/audit-log.ts) | — | Consumer of JSONL SoT; no engine involvement |
| R10.1 jq filter invoke | CLI subprocess | OS jq binary | doctor 3rd check verifies jq present |
| R10.1 redact 5 patterns | CLI (pre-render) | — | Defense-in-depth; output boundary |
| R10.2 lock acquire/release | Checkpoint layer (lockGuard.ts) | CLI callers | All .harnessed/* writes go through checkpoint layer |
| R10.2 lock holder display | CLI (status.ts enhance) | OS fs.readFile .harnessed/.lock | D-07: UX display of held lock pid/ts |
| W0 #BF runArgs extract | Installer lib (new lib/runClaudeArgs.ts) | 3 installer files | Dedup 3 identical private fns |
| W0 #BG err() extract | Installer lib (new lib/err.ts) | 6-8 installer files | Dedup 6+ identical private fns |

---

## § 1 — 8 D-Decisions Implementation Paths

### D-01 jq subprocess invocation

**Implementation site:** `src/cli/audit-log.ts`

Pattern from `src/cli/doctor.ts:81` — `spawnSync` already used for jq detection. For R10.1 consumer, use async `spawn` with stdio pipe:

```typescript
// Source: codebase doctor.ts L81 checkJq() + Node.js child_process docs [VERIFIED: codebase]
import { spawn } from 'node:child_process'

function pipeToJq(jsonlContent: string, filterExpr: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('jq', ['-c', filterExpr], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d: Buffer) => { out += d.toString() })
    child.stderr.on('data', (d: Buffer) => { err += d.toString() })
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`jq exit ${code}: ${err.trim()}`))
      else resolve(out)
    })
    child.stdin.write(jsonlContent)
    child.stdin.end()
  })
}
```

**jq not found fallback:** `checkJq()` in doctor uses `where`/`which` — same pattern; if jq absent, print error `'jq not found — run: harnessed doctor'` and exit 1. [VERIFIED: src/cli/doctor.ts L79-95]

**Windows path:** On Windows `spawn('jq', ...)` works when jq.exe is on PATH. `shell: false` (default) is safe — jq is a real binary not a .cmd shim. No `cmd.exe` wrapper needed (contrast with `runArgs` in installers which wraps `claude.cmd`). [VERIFIED: codebase mcpStdioAdd.ts L44-47]

**jq -c flag:** Compact output (1 line per record) preserves JSONL format for downstream table rendering.

### D-02 Dual format output

**Implementation:** Manual column align — no `cli-table3` dep (Karpathy YAGNI).

```typescript
// [VERIFIED: codebase doctor.ts human-readable pattern L195-200]
const COLS: Array<keyof AuditRecord> = ['ts', 'phase', 'category', 'matched_rule_id', 'outcome']
const WIDTHS = [24, 10, 14, 22, 12]

function renderTable(records: AuditRecord[]): string {
  const header = COLS.map((c, i) => c.padEnd(WIDTHS[i]!)).join(' | ')
  const sep = WIDTHS.map(w => '-'.repeat(w)).join('-+-')
  const rows = records.map(r =>
    COLS.map((c, i) => String(r[c] ?? '').slice(0, WIDTHS[i]).padEnd(WIDTHS[i]!)).join(' | ')
  )
  return [header, sep, ...rows].join('\n')
}
```

**`--json` output:** `JSON.stringify(record, null, 2)` per record separated by `\n---\n`, or array output for machine piping. Recommend array `[...records]` pretty-printed for `jq .` compat.

### D-03 Pagination 3 flags

**Implementation:** Pure array ops — no streaming needed for typical audit.log sizes.

```typescript
// [VERIFIED: D-03 LOCKED CONTEXT.md L50-57] [ASSUMED: log size manageable in-memory]
function applyPagination(
  lines: string[],
  opts: { tail?: number; head?: number; reverse?: boolean }
): string[] {
  let result = lines.filter(l => l.trim().length > 0)
  if (opts.tail !== undefined) result = result.slice(-opts.tail)
  if (opts.head !== undefined) result = result.slice(0, opts.head)
  if (opts.reverse) result = [...result].reverse()
  return result
}
// default: tail=50 applied before filter (or after? — recommend: paginate AFTER filter for UX)
```

**Flag conflict guard:** if both `--tail` and `--head` provided, `--head` takes precedence (or error). Document in help text.

### D-04 Security redact 5 patterns

**Pre-compiled regex at module load — never inside loop.**

```typescript
// [VERIFIED: D-04 LOCKED CONTEXT.md L60-68; patterns from 5.1-CONTEXT.md § R10.1 D-04]
// TDD REQUIRED: core security boundary per CLAUDE.md "核心业务逻辑强制 TDD"
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  // Pattern 1: api_key= or api_key: <value>
  [/api[_-]?key\s*[:=]\s*\S+/gi, '[REDACTED]'],
  // Pattern 2: token= or token: <value>
  [/\btoken\s*[:=]\s*\S+/gi, '[REDACTED]'],
  // Pattern 3: password= or password: <value>
  [/\bpassword\s*[:=]\s*\S+/gi, '[REDACTED]'],
  // Pattern 4: Authorization: Bearer <token>
  [/Authorization:\s*Bearer\s+\S+/gi, 'Authorization: Bearer [REDACTED]'],
  // Pattern 5: key prefixes sk- pk- gh_ ghp_ ya29. AIza
  [/\b(sk-|pk-|gh_|ghp_|ya29\.|AIza)[A-Za-z0-9_\-]{6,}/g, '[REDACTED]'],
]

export function redactSensitive(text: string): string {
  return REDACT_PATTERNS.reduce((t, [re, sub]) => t.replace(re, sub), text)
}
```

**Apply to:** `task_excerpt` field only (the only free-text field per schema; other 11 fields are structured IDs/enums/timestamps). [VERIFIED: src/audit/log.ts L19 task_excerpt]

**TDD fixtures required (Wave 1):**
- `api_key=abc123` → `api_key=[REDACTED]`
- `token: bearer xxxx` → `token: [REDACTED]`
- `password=hunter2` → `password=[REDACTED]`
- `Authorization: Bearer eyJhbGc...` → `Authorization: Bearer [REDACTED]`
- `sk-1234567890abcdef` → `[REDACTED]`
- `ghp_aBcDeFgHiJkL1234` → `[REDACTED]`
- Clean text passthrough unchanged

### D-05 proper-lockfile API

**Version:** 4.1.2 (latest, confirmed npm registry) [VERIFIED: npm registry]

```typescript
// [CITED: https://github.com/moxystudio/node-proper-lockfile#readme]
import lockfile from 'proper-lockfile'

const LOCK_DIR = '.harnessed'
const LOCK_OPTS = {
  stale: 10_000,        // 10s stale threshold (default)
  retries: {
    retries: 3,
    factor: 2,
    minTimeout: 100,    // 100 + 200 + 400 = ~700ms total (D-06)
  },
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const release = await lockfile.lock(LOCK_DIR, LOCK_OPTS)
  try {
    return await fn()
  } finally {
    await release()
  }
}
```

**Lock file location:** `proper-lockfile` creates `.harnessed.lock` (appends `.lock` to the target path) in the parent directory. Target is the `.harnessed` directory itself, so lockfile = `.harnessed.lock` adjacent to `.harnessed/`. Verify this is gitignored — `.harnessed/` is gitignored but `.harnessed.lock` may not be. **Add `.harnessed.lock` to `.gitignore`.** [VERIFIED: proper-lockfile docs — appends .lock to file arg]

**Alternative:** Use `lockfilePath` option to place lock inside `.harnessed/.lock` explicitly:
```typescript
const LOCK_OPTS = {
  stale: 10_000,
  retries: { retries: 3, factor: 2, minTimeout: 100 },
  lockfilePath: '.harnessed/.lock',   // D-08: explicit path
}
// Then call: lockfile.lock('.harnessed', LOCK_OPTS)
```
This matches D-08 "`.harnessed/.lock`" and keeps the lockfile inside the already-gitignored `.harnessed/` dir. **Recommended.**

**Error thrown on exhausted retries:** `ELOCKED` error with `code: 'ELOCKED'` — catch and re-throw as `LockHeldError`. [CITED: proper-lockfile README error codes]

**Cross-OS:** Uses `mkdir` atomically (works on NTFS, FAT, network FS). No OS flock. Windows-safe. [CITED: proper-lockfile README "atomic mkdir strategy"]

**ESM import:** proper-lockfile exports CommonJS. In ESM context use:
```typescript
import lockfile from 'proper-lockfile'
// or
import { lock, unlock } from 'proper-lockfile'
```
Project is `"type": "module"` [VERIFIED: package.json L4]. Test with tsup build — CJS interop via `createRequire` may be needed if default import fails. [ASSUMED: esm compat; verify during Wave 1 build]

### D-06 Retry policy + LockHeldError

```typescript
// [VERIFIED: D-06 LOCKED CONTEXT.md L87-94]
export class LockHeldError extends Error {
  constructor() {
    super(
      'another harnessed process holds the lock at .harnessed/.lock — ' +
      'wait or kill stale process (try: harnessed status)'
    )
    this.name = 'LockHeldError'
    Object.setPrototypeOf(this, LockHeldError.prototype) // TS class extend Error
  }
}

// In withLock():
} catch (e) {
  if ((e as NodeJS.ErrnoException).code === 'ELOCKED') throw new LockHeldError()
  throw e
}
```

**Total wait math:** 100ms + 200ms + 400ms = 700ms bounded. `factor: 2` doubles each retry. [VERIFIED: D-06 CONTEXT.md L89]

### D-07 Lock holder display in harnessed status

`src/cli/status.ts` current: 31L reads `.harnessed/state.json` installed packages. Enhance to also show lock status.

```typescript
// src/cli/status.ts — enhance action() [VERIFIED: src/cli/status.ts L17-29]
import { readFile } from 'node:fs/promises'

async function getLockInfo(): Promise<{ held: boolean; pid?: number; since?: string }> {
  // proper-lockfile stores a JSON object in the .lock dir (it's a directory, not file)
  // The pid file is at .harnessed/.lock/... — check proper-lockfile internals
  // Simpler: use lockfile.check('.harnessed', { lockfilePath: '.harnessed/.lock' })
  try {
    const held = await lockfile.check('.harnessed', { lockfilePath: '.harnessed/.lock' })
    if (!held) return { held: false }
    // Read mtime of .harnessed/.lock for "since" timestamp
    const stat = await import('node:fs/promises').then(m => m.stat('.harnessed/.lock'))
    return { held: true, since: stat.mtime.toISOString() }
  } catch { return { held: false } }
}
```

**Note:** `proper-lockfile` uses `mkdir` — the lock "file" is actually a directory `.harnessed/.lock/`. It does NOT store PID by default. For PID display, write a PID file inside the lock dir after acquire:

```typescript
// After release = await lockfile.lock(...):
await writeFile('.harnessed/.lock/pid', String(process.pid), 'utf8')
```

Then status reads `.harnessed/.lock/pid`. [ASSUMED: proper-lockfile mkdir internals; verify during execute]

**Simpler alternative:** Display "lock directory exists (held since <mtime>)" without PID — avoids the PID-write complexity. Status enhancement = `lockfile.check()` + `stat()` on the lock dir. [RECOMMENDED for YAGNI — D-07 says "pid + timestamp"; PID write-after-acquire adds 1 line]

### D-08 Dir-level lock — all write sites

**Write sites identified** [VERIFIED: grep src/checkpoint/ src/cli/]:

| File | Line | Function | Write call | Lock required |
|------|------|----------|-----------|---------------|
| `src/checkpoint/state.ts` | 50 | `writeCurrentWorkflow` | `writeFile(STATE_PATH, ...)` | YES — primary target |
| `src/checkpoint/template.ts` | 68 | `writeCheckpoint` | `writeFileSync(path, ...)` | YES — sync write to .harnessed/checkpoints/ |
| `src/checkpoint/archive.ts` | 34 | `writeArchive` | `writeFileSync(path, ...)` | YES — writes .harnessed/archive/ |
| `src/audit/log.ts` | 65 | `emitAuditRecord` | `appendFileSync(AUDIT_PATH, ...)` | NO — append-only JSONL is atomic per PIPE_BUF; lock would serialize all routing decisions (perf regression). D-08 CONTEXT says "所有 .harnessed/* 写" but audit is append-atomic, exempt per ADR 0018 § 1 rationale |

**engineHook.ts:** Calls `stateActivate()` → `writeCurrentWorkflow()` and `writeCheckpoint()`. Lock wraps these indirectly. No direct writeFile in engineHook.ts [VERIFIED: src/checkpoint/engineHook.ts L24, L36-47].

**Recommended approach:** Extract `src/checkpoint/lockGuard.ts` NEW (~40L) containing `withLock()` + `LockHeldError`. Import in callers.

**template.ts + archive.ts are sync writes.** Options:
1. Convert to async — larger blast radius
2. Wrap with sync lock variant (`lockfile.lockSync`) — available per proper-lockfile docs [CITED: proper-lockfile README sync variants]
3. Wrap the async callers (engineHook.ts `completePhase` already async) — let engineHook acquire lock before calling sync writeCheckpoint/writeArchive

**Recommended:** Option 3 — acquire async lock in `engineHook.completePhase` wrapper, then call sync template/archive writes inside. `state.ts:writeCurrentWorkflow` is already async — wrap directly. [ASSUMED: Option 3 is cleanest; verify no test breakage during execute]

---

## § 2 — R10.1 Concrete API Examples

### 2.1 Full audit-log.ts skeleton (~130L estimate)

```typescript
// src/cli/audit-log.ts — Phase 5.1 R10.1 NEW (≤150L Karpathy)
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import type { Command } from 'commander'
import type { AuditRecord } from '../audit/log.js'

const AUDIT_PATH = '.harnessed/audit.log'
const DEFAULT_TAIL = 50

// 5 redact patterns — pre-compiled at module load [VERIFIED: D-04 CONTEXT.md L60-68]
const REDACT: Array<[RegExp, string]> = [ /* see § 1 D-04 */ ]

function redact(text: string): string { /* see § 1 D-04 */ }

function readLines(): string[] {
  try { return readFileSync(AUDIT_PATH, 'utf8').split('\n') }
  catch { return [] }
}

function paginate(lines: string[], opts: { tail?: number; head?: number }): string[] {
  const nonempty = lines.filter(l => l.trim())
  if (opts.tail !== undefined) return nonempty.slice(-opts.tail)
  if (opts.head !== undefined) return nonempty.slice(0, opts.head)
  return nonempty.slice(-DEFAULT_TAIL)
}

function parseRecord(line: string): AuditRecord | null {
  try { return JSON.parse(line) as AuditRecord } catch { return null }
}

function renderTable(records: AuditRecord[]): void { /* 5-col manual align */ }

export function registerAuditLog(program: Command): void {
  program
    .command('audit-log')
    .description('View routing audit log (.harnessed/audit.log)')
    .option('--filter <expr>', 'jq filter expression (requires jq in PATH)')
    .option('--tail <n>', 'show last N records (default 50)', String(DEFAULT_TAIL))
    .option('--head <n>', 'show first N records')
    .option('--reverse', 'reverse output order')
    .option('--json', 'output full JSON records')
    .action(async (opts) => { /* pipeline: read → paginate → jq? → redact → render */ })
}
```

### 2.2 jq subprocess pipeline

```typescript
// Inside action() — jq filter path [VERIFIED: D-01 CONTEXT.md L34-40]
const lines = readLines()
const paged = paginate(lines, { tail: opts.tail ? Number(opts.tail) : undefined,
                                 head: opts.head ? Number(opts.head) : undefined })
const jsonlContent = paged.join('\n')

if (opts.filter) {
  // Pipe JSONL through jq
  const filtered = await pipeToJq(jsonlContent, opts.filter)
  const filteredRecords = filtered.split('\n').filter(Boolean).map(parseRecord).filter(Boolean)
  const redacted = filteredRecords.map(r => ({ ...r, task_excerpt: redact(r!.task_excerpt) }))
  // render...
} else {
  const records = paged.map(parseRecord).filter(Boolean)
  const redacted = records.map(r => ({ ...r, task_excerpt: redact(r!.task_excerpt) }))
  // render...
}
```

**Order of operations:** paginate → jq filter → redact → render. Redact happens last, always, regardless of jq path.

### 2.3 Error paths

- AUDIT_PATH not found → `console.error('no audit log at .harnessed/audit.log — run harnessed first')` + `process.exit(0)` (not an error; empty state)
- jq exit ≠ 0 → `console.error('jq error: ...')` + `process.exit(1)`
- jq not found → doctor hint: `console.error('jq not found — run: harnessed doctor')` + `process.exit(1)`
- Empty log → `console.log('no records')` + `process.exit(0)`

### 2.4 src/cli.ts registration

```typescript
// src/cli.ts — add after registerResume [VERIFIED: src/cli.ts L39]
import { registerAuditLog } from './cli/audit-log.js'
// ...
registerAuditLog(program) // Phase 5.1 R10.1 — 13th subcommand
```

---

## § 3 — R10.2 proper-lockfile Integration

### 3.1 Dependency add

```json
// package.json "dependencies" — NOT devDependencies [VERIFIED: D-05 CONTEXT.md L77]
"proper-lockfile": "^4.1.2"
```

Run `pnpm install` to update `pnpm-lock.yaml`.

### 3.2 lockGuard.ts NEW (~40L)

```typescript
// src/checkpoint/lockGuard.ts — Phase 5.1 R10.2 NEW
// [CITED: proper-lockfile README + VERIFIED: D-05 D-06 D-08 CONTEXT.md]
import lockfile from 'proper-lockfile'
import { mkdir } from 'node:fs/promises'

const LOCK_DIR = '.harnessed'
const LOCK_OPTS = {
  stale: 10_000,
  retries: { retries: 3, factor: 2, minTimeout: 100 },
  lockfilePath: '.harnessed/.lock',
}

export class LockHeldError extends Error {
  constructor() {
    super(
      'another harnessed process holds the lock at .harnessed/.lock — ' +
      'wait or kill stale process (try: harnessed status)'
    )
    this.name = 'LockHeldError'
    Object.setPrototypeOf(this, LockHeldError.prototype)
  }
}

export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await mkdir(LOCK_DIR, { recursive: true }) // ensure dir exists before lock
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock(LOCK_DIR, LOCK_OPTS)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ELOCKED') throw new LockHeldError()
    throw e
  }
  try {
    return await fn()
  } finally {
    await release()
  }
}
```

### 3.3 Wrap sites — minimal blast radius

**`src/checkpoint/state.ts` — `writeCurrentWorkflow` wrap:**

```typescript
// Add import at top:
import { withLock } from './lockGuard.js'

// Wrap existing writeCurrentWorkflow body:
export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) { /* existing validation */ throw ... }
  return withLock(async () => {
    await mkdir(dirname(STATE_PATH), { recursive: true })
    await writeFile(STATE_PATH, JSON.stringify(s, null, 2), 'utf8')
  })
}
```

**`src/checkpoint/engineHook.ts` — `activatePhase` + `completePhase`:**
Both already call `stateActivate`/`stateComplete` which call `writeCurrentWorkflow` (already locked above). `completePhase` also calls `writeCheckpoint` (sync). Since lock is in `writeCurrentWorkflow`, the `writeCheckpoint` call in `completePhase` is NOT inside the lock.

**Recommended fix:** Acquire lock once at the engineHook call site, not per-write:

```typescript
// src/checkpoint/engineHook.ts completePhase — wrap entire operation:
export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> {
  return withLock(async () => {
    writeCheckpoint({ ... })  // sync, inside async lock
    await stateComplete()     // already uses writeCurrentWorkflow; skip inner lock
  })
}
```

This requires removing the inner lock from `writeCurrentWorkflow` OR using a reentrant guard. **Simpler approach:** Keep lock only at engineHook level; `writeCurrentWorkflow` does NOT lock internally (engineHook ensures exclusivity for the compound operation). `writeCurrentWorkflow` used standalone (e.g., from `activate()`) still needs wrapping at call site.

**Resolution:** Two lock sites:
1. `engineHook.ts:activatePhase` — `withLock(() => stateActivate(...))`  
2. `engineHook.ts:completePhase` — `withLock(() => { writeCheckpoint(...); stateComplete() })`

`state.ts:writeCurrentWorkflow` does NOT self-lock (called only via engineHook in practice). [ASSUMED: verify no direct callers of writeCurrentWorkflow outside engineHook in execute phase]

### 3.4 Status display enhancement (D-07)

```typescript
// src/cli/status.ts — add lock section to action() [VERIFIED: src/cli/status.ts L17-29]
import lockfile from 'proper-lockfile'
import { stat } from 'node:fs/promises'

// In action(), append after install listing:
try {
  const isLocked = await lockfile.check('.harnessed', {
    lockfilePath: '.harnessed/.lock',
    stale: 10_000,
  })
  if (isLocked) {
    const s = await stat('.harnessed/.lock')
    console.log(`\nlock: held (since ${s.mtime.toISOString()}) — stale after 10s`)
    console.log('  to release: wait for process to finish or delete .harnessed/.lock')
  } else {
    console.log('\nlock: free')
  }
} catch { /* .harnessed absent = no lock */ }
```

**PID display:** Requires writing `process.pid` into lock dir post-acquire (see D-07 note in § 1). Recommend for Wave 1 but mark LOW priority — `since` timestamp is sufficient for stale detection UX.

### 3.5 Cross-OS vitest concurrent test pattern

```typescript
// tests/checkpoint/lock.test.ts — Phase 5.1 R10.2 TDD [ASSUMED: test file path]
import { describe, it, expect, afterEach } from 'vitest'
import { withLock, LockHeldError } from '../../src/checkpoint/lockGuard.js'
import { mkdir, rm } from 'node:fs/promises'

const TEST_DIR = '.harnessed-test-lock'

afterEach(() => rm(TEST_DIR, { recursive: true, force: true }))

describe('R10.2 concurrent write lock', () => {
  it('serializes two concurrent calls — second waits for first', async () => {
    await mkdir(TEST_DIR, { recursive: true })
    const order: number[] = []
    const p1 = withLock(async () => {
      order.push(1)
      await new Promise(r => setTimeout(r, 50))
      order.push(2)
    })
    // Small delay to ensure p1 acquires first
    await new Promise(r => setTimeout(r, 10))
    const p2 = withLock(async () => { order.push(3) })
    await Promise.all([p1, p2])
    expect(order).toEqual([1, 2, 3])
  })

  it('throws LockHeldError after 3 retries when lock held artificially', async () => {
    // Acquire lock manually, then attempt second acquire
    const release = await import('proper-lockfile').then(lf =>
      lf.default.lock(TEST_DIR, { lockfilePath: `${TEST_DIR}/.lock` })
    )
    try {
      await expect(withLock(async () => {})).rejects.toThrow(LockHeldError)
    } finally {
      await release()
    }
  })
})
```

**Note on test isolation:** Use a separate `.harnessed-test-lock` dir — do NOT use real `.harnessed/` in tests. [ASSUMED: vitest mocking strategy; actual test may need adjustment]

---

## § 4 — W0 Sub-batch #BF + #BG ABSORB Analysis

### #BF runArgs dedup (3-installer duplicate)

**Files with `function runArgs`:** [VERIFIED: grep src/installers/]
- `src/installers/mcpStdioAdd.ts` L40 — identical signature
- `src/installers/mcpHttpAdd.ts` L47 — identical signature  
- `src/installers/ccPluginMarketplace.ts` L49 — identical signature

**Signature (verified):**
```typescript
function runArgs(claudeArgs: string[], cwd: string, timeoutMs = 15_000): Promise<ProcResult>
// Win: spawn('cmd.exe', ['/c', 'claude', ...claudeArgs])
// Unix: spawn('claude', claudeArgs, { shell: false })
```

**Extract to:** `src/installers/lib/runClaudeArgs.ts` NEW (~35L)

**Files affected:** 3 installers (mcpStdioAdd, mcpHttpAdd, ccPluginMarketplace). gitCloneWithSetup and npmCli/npxSkillInstaller do NOT have runArgs.

**Risk:** LOW — pure extract/import, no logic change. Biome lint preempt required post-extract.

### #BG err() dedup (6-8 file duplicate)

**Files with `function err`:** [VERIFIED: grep src/installers/]
- `ccHookAdd.ts` L18
- `ccPluginMarketplace.ts` L40
- `gitCloneWithSetup.ts` L43
- `mcpHttpAdd.ts` L38
- `mcpStdioAdd.ts` L31
- `npmCli.ts` L35
- `npxSkillInstaller.ts` L49
= **7 files** (not 8 — count from grep)

**Signature (verified):**
```typescript
function err(ctx: InstallContext, path: string, message: string, keyword: string): InstallError
```

**Extract to:** `src/installers/lib/err.ts` NEW (~20L)

**Files affected:** 7 installers.

**Risk:** LOW-MED — 7-file import change; Biome check required. Verify `InstallError` / `InstallContext` types are importable from shared location.

### W0 Absorb recommendation

**Recommend:** ABSORB both #BF + #BG in Phase 5.1 Wave B (W0 sub-batch).
- 2 new files: `src/installers/lib/runClaudeArgs.ts` (~35L) + `src/installers/lib/err.ts` (~20L)
- 10 import-line changes across 7 installer files
- Total ≤200L per file constraint respected
- **Rationale:** 4-phase carry-forward; Phase 5.1 NEW installer-adjacent work = minimal context overhead; dedup prevents future divergence
- **Risk:** LOW with Biome preempt + full test suite green gate

---

## § 5 — ADR 0021 Outline + ci.yml A7 iter 0018→0021

### ADR 0021 outline (1-page Karpathy minimal)

**File:** `docs/adr/0021-audit-log-consumer-state-lock.md`

```
# ADR 0021: Phase 5.1 — Audit log consumer CLI + dir-level state write lock

## Status
Accepted (phase 5.1 W2 — 2026-05-20)

## Context
R10.1 gap: Phase 4.3 shipped JSONL producer (ADR 0018) but no CLI consumer = R8.1
half-complete. R10.2 gap: state.ts writeCurrentWorkflow + engineHook writes have no
lock = concurrent `harnessed resume × 2` can corrupt current-workflow.json (#BU
4th-cycle carry-forward).

## Decision
D-01 jq subprocess pipe (zero-new-dep, engineer-familiar, D-08 dir scope).
D-04 CSO defense-in-depth 2-layer redact 5 patterns (producer + consumer boundary).
D-05 proper-lockfile@4.1.2 (5M weekly, atomic mkdir, cross-OS, MIT, 6KB).
D-08 dir-level lock .harnessed/.lock (YAGNI; op-level v0.6+ if signal).

## Consequences
+ R10.1 100% traceable fulfilled (consumer shipped).
+ R10.2 concurrent write race eliminated for v1.0 GA co-maintainer window.
- proper-lockfile supply-chain surface (+1 dep); mitigated by pnpm audit.
- dir-level lock granularity coarse; op-level refine deferred v0.6+.

## Cross-references
ADR 0018 producer (R8.1 JSONL schema).
ADR 0019 STATE COLLAPSE single-SoT.
ADR 0020 HYBRID 2-clock co-maintainer rationale.
D-05 sister Win corepack ACL lesson.
```

### ci.yml A7 step iter 0018 → 0021

**Current A7 step** [VERIFIED: .github/workflows/ci.yml L82-107]:
- Name: `ADR 0001-0018 main body 守恒`
- Loop: `for n in 0001 ... 0018`
- **Two occurrences** of the loop (L85 fetch loop + L96 diff loop)

**Phase 5.1 change** — add `0019 0020 0021` to both loops:
```bash
# Before: for n in 0001 ... 0017 0018; do
# After:  for n in 0001 ... 0017 0018 0019 0020 0021; do
# Step name: ADR 0001-0018 → ADR 0001-0021
```

**Sister precedent:** Phase 4.3 W2 T2.4 changed `1-0017` → `1-0018` (ADR 0018 added). Phase 5.1 adds 0019+0020+0021. ADR 0019+0020 were backfilled in Phase 4.3 but ci.yml A7 was only iterated to 0018 — **A7 currently does NOT check 0019/0020**. Phase 5.1 MUST include 0019+0020 in the iter or they are unprotected. [VERIFIED: ci.yml L85 loop only goes to 0018]

**Also requires:** push baseline tags `adr-0019-accepted`, `adr-0020-accepted`, `adr-0021-accepted` (LOCAL CREATE, user push per CLAUDE.md commit safety).

---

## § 6 — Risk Matrix

| # | Risk | Severity | Probability | Mitigation |
|---|------|----------|-------------|------------|
| R-1 | proper-lockfile ESM/CJS compat with `"type":"module"` tsup build | HIGH | MED | Test import in Wave 1 build; fallback: `createRequire` wrapper ~5L if default import fails |
| R-2 | jq not in PATH on Windows CI | MED | LOW | doctor 3rd check already verifies; CI matrix uses ubuntu/macos/windows runners — add jq install step if needed |
| R-3 | Lock scope too coarse — status.ts `readState()` blocked during write lock | LOW | LOW | readState reads `.harnessed/state.json` (installer state) NOT current-workflow.json; different file, no contention |
| R-4 | audit-log.ts exceeds 150L Karpathy limit | MED | MED | Pagination + redact + jq + render in 150L is tight; extract `redact.ts` helper (~30L) if needed, keeping audit-log.ts as orchestrator |
| R-5 | A7 ci.yml missing 0019/0020 tags causes A7 gate warning-skip | MED | HIGH | ADR 0019+0020 tags not pushed yet → A7 gate warns and skips (see ci.yml L91-93). Phase 5.1 W2 MUST push these tags alongside 0021. |

---

## § 7 — Open Questions for Planner (Wave B Decisions)

1. **Lock re-entrancy in state.ts** — `writeCurrentWorkflow` called both directly (activate/pause/complete) and via engineHook. If lockGuard wraps engineHook AND state.ts independently, double-lock risk. **Planner decide:** lock at engineHook level only, or add re-entrant guard to lockGuard.

2. **template.ts / archive.ts sync writes** — `writeCheckpoint` and `writeArchive` use `writeFileSync`. Wrapping in `withLock(async () => { ... syncFn() })` works but mixes sync/async. **Planner decide:** convert to async (larger change) vs wrap sync in async lock (simple).

3. **Pagination order for jq path** — should `--tail 50` apply BEFORE or AFTER jq filter? Before = faster (smaller input to jq). After = more semantically correct (filter first, then take last 50 matching). **Recommend:** filter first for UX correctness (paginate after filter), but document in help text.

4. **#BF/#BG Wave sequencing** — should W0 sub-batch (#BF+#BG extract) be Wave 0 task or Wave B task? Phase 4.3 precedent: W0 absorb precedes Wave 1 NEW src. **Recommend:** Wave 0 (first), since it modifies installer files that are NOT touched by R10.1/R10.2; no interference.

5. **ADR 0019/0020 baseline tags** — Phase 4.3 ship did NOT push `adr-0019-accepted` / `adr-0020-accepted` tags (only `adr-0018-accepted`). Phase 5.1 must push these in W2. **Planner:** add explicit tasks for tag push (user-triggered per CLAUDE.md commit safety).

6. **`.harnessed.lock` vs `.harnessed/.lock`** — default proper-lockfile creates `{file}.lock` = `.harnessed.lock` in cwd. Using `lockfilePath: '.harnessed/.lock'` places it inside `.harnessed/` (already gitignored). **Recommend `lockfilePath` option; confirm `.harnessed/.lock` doesn't need explicit gitignore entry.**

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-OS file locking | Custom `fs.open(wx)` + retry loop | `proper-lockfile@4.1.2` | Race window + crash leftover + Win ACL (sister corepack lesson) |
| jq filter engine | Custom DSL parser | `spawn('jq', ...)` | Expression power (OR/AND/range) + engineer familiarity + zero new dep |
| Column table layout | `cli-table3` npm dep | Manual `padEnd()` | Karpathy YAGNI; doctor.ts already does manual alignment |
| Retry backoff | Custom timeout loop | `proper-lockfile retries` option (uses `retry` npm internally) | Exponential backoff correctness |

---

## Common Pitfalls

### Pitfall 1: Double lock deadlock
**What goes wrong:** `writeCurrentWorkflow` locks, then `completePhase` tries to lock → deadlock.
**How to avoid:** Lock at ONE level only (engineHook). `writeCurrentWorkflow` does NOT self-lock.

### Pitfall 2: jq filter with multi-line JSONL
**What goes wrong:** Passing all JSONL lines as single stdin chunk, jq errors on empty last line.
**How to avoid:** Filter lines before join: `lines.filter(l => l.trim()).join('\n')`.

### Pitfall 3: Redact applied to parsed object fields
**What goes wrong:** Parsing JSON first then iterating fields misses concatenated/obfuscated patterns.
**How to avoid:** Apply redact to `task_excerpt` string field AFTER parsing, BEFORE render — as implemented in § 1 D-04.

### Pitfall 4: proper-lockfile stale default too aggressive
**What goes wrong:** `stale: 10000` (10s) stale threshold — if a write takes >10s, the lock is considered stale and another process can grab it.
**How to avoid:** 10s is sufficient for `writeFile` JSON operations (typically <100ms). If archive operations grow large, raise stale to 30s in ADR 0021 errata.

### Pitfall 5: Biome lint on new files
**What goes wrong:** CI fails with import order / formatting violations on new files.
**How to avoid:** Run `pnpm exec biome check --write` before each commit (project memory `feedback_biome-preempt.md`). [VERIFIED: project memory]

### Pitfall 6: A7 skip warning masks broken gate
**What goes wrong:** ADR 0019/0020 baseline tags not pushed → A7 gate warns+skips → CI green but A7 effectively disabled for 0019/0020.
**How to avoid:** Push `adr-0019-accepted` + `adr-0020-accepted` tags in Wave 2 before final A7 verify.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.x |
| Config file | `vitest.config.ts` (or `vite.config.ts`) |
| Quick run | `pnpm test` (= `vitest run --passWithNoTests`) |
| Full suite | `pnpm test` (single command; no watch mode in CI) |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Command | File |
|-----|----------|-----------|---------|------|
| R10.1-redact | 5 pattern redact correctness | unit | `pnpm test tests/audit/audit-log.test.ts` | Wave 0 gap |
| R10.1-format | table + json output | unit | `pnpm test tests/cli/audit-log.test.ts` | Wave 0 gap |
| R10.1-paginate | tail/head/reverse | unit | same | Wave 0 gap |
| R10.2-lock-serialize | concurrent writes serialized | integration | `pnpm test tests/checkpoint/lock.test.ts` | Wave 0 gap |
| R10.2-lock-error | LockHeldError after 3 retries | unit | same | Wave 0 gap |
| R10.2-stale | stale lock auto-released | integration | same | Wave 0 gap |

### Wave 0 Gaps
- [ ] `tests/audit/audit-log.test.ts` — R10.1 redact TDD (RED first per CLAUDE.md TDD rule)
- [ ] `tests/checkpoint/lock.test.ts` — R10.2 concurrent lock TDD
- [ ] `tests/cli/audit-log-render.test.ts` — table/json render (optional; integrate with above)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥22 | All | ✓ | v24.15.0 | — |
| jq | R10.1 --filter | ✓ | (in PATH per doctor check pattern) | Error hint: `harnessed doctor` |
| proper-lockfile | R10.2 | Not installed yet | 4.1.2 (latest) | None — required |
| pnpm | Dep install | ✓ | 10.12.0 (packageManager) | — |

**jq on Windows CI:** GitHub Actions Windows runner does not have jq by default. Need to verify CI matrix runner has jq or add install step. doctor.ts `checkJq()` already shows platform-specific install hint. [ASSUMED: needs CI runner check; mitigate in Wave 1]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | proper-lockfile ESM default import works with tsup/`"type":"module"` without createRequire | § 1 D-05, § 3.2 | Build failure; fix = createRequire wrapper ~5L |
| A2 | `lockfilePath: '.harnessed/.lock'` places lockfile at exactly that path | § 1 D-05, § 1 D-07 | Lock directory placement differs; fix = check proper-lockfile source or test |
| A3 | proper-lockfile `.lock` is a DIRECTORY (mkdir strategy), not a file | § 1 D-07 | PID write-after-acquire fails if it's a file; fix = verify in execute |
| A4 | `writeCurrentWorkflow` is not called directly outside engineHook in production code paths | § 3.3 | Double-lock on direct call sites; fix = wrap all call sites |
| A5 | GitHub Actions Windows runner lacks jq by default | § Env Availability | R10.1 test failures on Windows CI; fix = add `winget install jqlang.jq` CI step |
| A6 | audit.log file size is manageable in-memory for readFileSync | § 2.1 | Memory pressure on large audits; fix = streaming read (defer v0.6+) |
| A7 | `tests/checkpoint/resume.test.ts` does not exist (404 on read) | § Validation | Fewer lock tests overlap with resume; no impact on plan |

---

## Sources

### Primary (HIGH confidence)
- `src/audit/log.ts` — 12-field AuditRecord schema, AUDIT_PATH, appendFileSync pattern [VERIFIED]
- `src/checkpoint/state.ts` — writeCurrentWorkflow async writeFile target [VERIFIED]
- `src/checkpoint/engineHook.ts` — activatePhase/completePhase write orchestration [VERIFIED]
- `src/checkpoint/template.ts`, `archive.ts` — sync writeFileSync write sites [VERIFIED]
- `src/cli/doctor.ts` — checkJq spawnSync pattern, sister CLI subcommand structure [VERIFIED]
- `src/cli/status.ts` — status subcommand enhancement target [VERIFIED]
- `src/cli.ts` — subcommand registration site [VERIFIED]
- `src/installers/mcpStdioAdd.ts` — runArgs signature reference for #BF [VERIFIED]
- `.planning/phase-5.1/5.1-CONTEXT.md` — 8 D-decisions verbatim [VERIFIED]
- `.github/workflows/ci.yml` L82-107 — A7 step current state (loops to 0018) [VERIFIED]
- `docs/adr/0018-routing-audit-log.md` — ADR format template, A7 conservation pattern [VERIFIED]
- `npm view proper-lockfile` — version 4.1.2 latest [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- proper-lockfile README — API (lock/unlock/check/options/error codes/atomic mkdir) [CITED: github.com/moxystudio/node-proper-lockfile]
- grep audit of all write sites in src/checkpoint/ + src/cli/ [VERIFIED: codebase grep]
- grep audit of err()/runArgs() across src/installers/ — 7 files for #BG, 3 files for #BF [VERIFIED]

### Tertiary (LOW confidence / ASSUMED)
- ESM/CJS compat of proper-lockfile with tsup build [ASSUMED: A1]
- proper-lockfile mkdir dir internal structure for PID file [ASSUMED: A3]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — proper-lockfile 4.1.2 verified in npm registry; all file patterns verified in codebase
- Architecture: HIGH — all write sites identified by grep; registration pattern verified in src/cli.ts
- Pitfalls: HIGH — D-decisions verified; A7 gap (0019/0020 not in loop) is a concrete VERIFIED finding
- Redact patterns: HIGH — 5 patterns from CONTEXT.md verbatim; regex implementations [ASSUMED] pending TDD verify

**Research date:** 2026-05-19
**Valid until:** 2026-05-26 (7 days — active development)
