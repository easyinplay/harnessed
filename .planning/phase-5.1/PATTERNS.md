# Phase 5.1: Pattern Map

**Mapped:** 2026-05-19
**Files analyzed:** 12 NEW/MODIFY + 2 W0 sub-batch candidates
**Analogs found:** 14 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/cli/audit-log.ts` | subcommand | request-response (spawn jq) | `src/cli/doctor.ts` (L155-210) | exact |
| `tests/cli/audit-log.test.ts` | test | request-response | `tests/cli/doctor.test.ts` (149L) | exact |
| `tests/checkpoint/state-lock.test.ts` | test | async concurrent | `tests/checkpoint/state.test.ts` (98L) | role-match |
| `docs/adr/0021-state-lock-and-audit-consumer.md` | ADR | n/a | `docs/adr/0018-routing-audit-log.md` (9-section format) | exact |
| `src/checkpoint/state.ts` (MODIFY) | state module | CRUD + lock wrap | self (77L) + `proper-lockfile` API | self-extend |
| `src/checkpoint/engineHook.ts` (MODIFY) | hook | CRUD + lock wrap | `src/checkpoint/engineHook.ts` (48L) | self-extend |
| `src/cli.ts` (MODIFY) | entry | registration | `src/cli.ts` L28-41 register pattern | exact |
| `src/cli/resume.ts` (MODIFY) | subcommand | CRUD + lock | `src/cli/resume.ts` (42L) | self-extend |
| `src/cli/status.ts` (MODIFY) | subcommand | read + display | `src/cli/status.ts` (31L) | self-extend |
| `package.json` (MODIFY) | config | dep add | `package.json` dependencies block | exact |
| `docs/adr/README.md` (MODIFY) | index | append | README.md table L42-62 | exact |
| `.github/workflows/ci.yml` (MODIFY) | CI | A7 iter | ci.yml L82-107 A7 step | exact |
| `src/installers/lib/runClaudeArgs.ts` (NEW, W0) | utility | extract | `src/installers/mcpStdioAdd.ts` L40 + `mcpHttpAdd.ts` L47 | role-match |
| `src/installers/lib/err.ts` (NEW, W0) | utility | extract | `src/installers/mcpStdioAdd.ts` L31-33 | exact (x6 files) |

---

## Pattern Assignments

### `src/cli/audit-log.ts` (subcommand, request-response)

**Analog:** `src/cli/doctor.ts`
**Estimated lines:** ~140-160L (≤200L Karpathy verdict: PASS with ~40-60L headroom)

**Imports pattern** (`src/cli/doctor.ts` lines 1-18):
```typescript
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import type { Command } from 'commander'
// audit-log.ts will use:
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { Command } from 'commander'
import type { AuditRecord } from '../audit/log.js'
```

**RawOpts interface pattern** (`src/cli/doctor.ts` lines 162):
```typescript
// doctor.ts uses inline opts type — copy same inline pattern for audit-log:
.action(async (opts: { filter?: string; tail?: number; head?: number; reverse?: boolean; json?: boolean }) => {
```

**Register + flags pattern** (`src/cli/doctor.ts` lines 155-168):
```typescript
export function registerAuditLog(program: Command): void {
  program
    .command('audit-log')
    .description('Query routing audit log (.harnessed/audit.log) with optional jq filter')
    .option('--filter <expr>', 'jq filter expression (e.g. \'.category=="engineering"\')')
    .option('--tail <n>', 'show N most recent records (default 50)', '50')
    .option('--head <n>', 'show N oldest records')
    .option('--reverse', 'flip output order')
    .option('--json', 'output full 12-field JSON instead of human table')
    .action(async (opts: { ... }) => {
      // H1 gate: validate flags before any I/O (sister doctor.ts pattern)
      const tail = opts.tail ? Number(opts.tail) : 50
      if (Number.isNaN(tail) || tail < 1) {
        console.error('✗ --tail must be a positive integer')
        process.exit(2)
      }
      ...
    })
}
```

**jq spawn pattern** (D-01 LOCKED; `src/cli/doctor.ts` lines 81-95 checkJq() + D-01 spec):
```typescript
// spawn('jq', [filterExpr], { stdio: ['pipe', 'inherit', 'inherit'] })
// write audit.log lines → child.stdin
// child.on('close', (code) => process.exit(code ?? 0))
const child = spawn('jq', [filterExpr], {
  stdio: ['pipe', 'inherit', 'inherit'],
  windowsHide: true,
})
child.stdin.write(filteredLines.join('\n'))
child.stdin.end()
child.on('close', (code) => process.exit(code ?? 0))
```

**Security redact pattern** (D-04 LOCKED — 5 regex patterns, apply before jq/output):
```typescript
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/api_key\s*[=:]\s*\S+/gi, 'api_key=[REDACTED]'],
  [/token\s*[=:]\s*\S+/gi, 'token=[REDACTED]'],
  [/password\s*[=:]\s*\S+/gi, 'password=[REDACTED]'],
  [/Authorization:\s*Bearer\s+\S+/gi, 'Authorization: Bearer [REDACTED]'],
  [/(sk-|pk-|gh_|ghp_|ya29\.|AIza)\S+/g, '[REDACTED]'],
]
function redact(s: string): string {
  return REDACT_PATTERNS.reduce((acc, [re, rep]) => acc.replace(re, rep), s)
}
```

**Exit code pattern** (`src/cli/doctor.ts` line 208; ADR 0004 contract 6):
```typescript
process.exit(hasFail ? 1 : 0)  // audit-log: exit(1) on jq filter error, exit(2) on bad flags
```

**Human table output pattern** (D-02; `src/cli/audit.ts` lines 140-165 two-column format):
```typescript
// 5-column condensed: ts | phase | category | matched_rule_id | outcome
// manual column align — NO cli-table3 (Karpathy YAGNI)
console.log(`${r.ts.slice(0,19)} | ${r.phase.padEnd(6)} | ${r.category.padEnd(11)} | ${(r.matched_rule_id ?? 'null').padEnd(20)} | ${r.outcome}`)
```

---

### `tests/cli/audit-log.test.ts` (test, request-response)

**Analog:** `tests/cli/doctor.test.ts` (149L)
**Estimated lines:** ~120-150L (≤200L verdict: PASS)

**vi.mock header pattern** (`tests/cli/doctor.test.ts` lines 1-29):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn(), spawnSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
// mock audit log read:
vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
```

**ExitError + runCli helper pattern** (`tests/cli/doctor.test.ts` lines 41-64):
```typescript
class ExitError extends Error {
  constructor(public code: number) { super(`exit(${code})`) }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?) => { throw new ExitError(typeof c === 'number' ? c : 0) })
  vi.spyOn(console, 'log').mockImplementation((...a) => { stdout += `${a.map(String).join(' ')}\n` })
  vi.spyOn(console, 'error').mockImplementation((...a) => { stderr += `${a.map(String).join(' ')}\n` })
  const program = new Command().exitOverride()
  registerAuditLog(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}
```

**5-7 fixture cell pattern** (`tests/cli/doctor.test.ts` lines 97-149 cell structure):
```
cell 1 — no audit.log → exit 0 + empty table message
cell 2 — 3 records, no filter → human table 5-column output
cell 3 — --filter '.category=="engineering"' → spawn jq with filter expression
cell 4 — --json flag → full 12-field JSON pretty-print
cell 5 — redact: api_key= in task_excerpt → [REDACTED] in output
cell 6 — redact: Authorization: Bearer token → [REDACTED]
cell 7 — --tail 2 → only 2 most recent records
```

**Redact regex coverage matrix** (D-04 — 5 patterns must each have 1 test cell):
All 5 redact patterns must appear in fixtures (cells 5-6 cover first 4; key-prefix pattern in separate cell).

---

### `tests/checkpoint/state-lock.test.ts` (test, async concurrent)

**Analog:** `tests/checkpoint/state.test.ts` (98L) + new concurrent simulation
**Estimated lines:** ~80-100L (≤200L verdict: PASS with large headroom)

**vi.mock fs/promises pattern** (`tests/checkpoint/state.test.ts` lines 6-17):
```typescript
const fsState = new Map<string, string>()
vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => {
    const v = fsState.get(p)
    if (v === undefined) throw new Error(`ENOENT: ${p}`)
    return v
  },
  writeFile: async (p: string, data: string) => void fsState.set(p, data),
  mkdir: async (p: string) => void mkdirCalls.push(p),
}))
```

**afterEach cleanup pattern** (`tests/checkpoint/state.test.ts` lines 31-35):
```typescript
beforeEach(() => { fsState.clear(); mkdirCalls.length = 0 })
afterEach(() => vi.clearAllMocks())
// For lock tests — also mock proper-lockfile release:
vi.mock('proper-lockfile', () => ({
  lock: vi.fn().mockResolvedValue(vi.fn()), // returns release fn
}))
```

**Concurrent simulation pattern** (NEW — async vitest + setTimeout simulate):
```typescript
it('concurrent write — second caller waits for first release', async () => {
  // Simulate two concurrent writeCurrentWorkflow calls
  // Mock lockfile.lock: first call resolves immediately, second waits 50ms
  let lockHeld = false
  lockMock.mockImplementation(async () => {
    if (lockHeld) await new Promise(r => setTimeout(r, 50))
    lockHeld = true
    return async () => { lockHeld = false }
  })
  const [r1, r2] = await Promise.all([
    activate('5.1', null),
    activate('5.1', null),
  ])
  // Both should complete without throwing
})

it('lock stale — LockHeldError with actionable message', async () => {
  lockMock.mockRejectedValue(new Error('Lock file is already being held'))
  await expect(activate('5.1', null)).rejects.toThrow('another harnessed process')
})
```

---

### `docs/adr/0021-state-lock-and-audit-consumer.md` (ADR, 9-section format)

**Analog:** `docs/adr/0018-routing-audit-log.md` (9-section format)
**Estimated lines:** ~120-160L (≤200L verdict: PASS)

**9-section skeleton** (exact format from ADR 0018 + ADR 0020):
```markdown
# ADR 0021: Phase 5.1 — R10.2 state.ts concurrent write lock (proper-lockfile) + R10.1 audit log --filter CLI consumer

## Status
**Accepted (phase 5.1 W1/W2 — 2026-05-19)**

## Context
[R10.1 + R10.2 spec verbatim; DEFERRED #BU history; single→multi-maintainer unlock]

## Decisions
### 1. D-05 LockImpl — proper-lockfile dir-level lock `.harnessed/.lock`
### 2. D-06 RetryPolicy — bounded 3×exp-backoff + LockHeldError
### 3. D-07 ForceFlag — NO --force + status display lock holder
### 4. D-08 LockScope — dir-level `.harnessed/` (all writes)
### 5. D-01 FilterSyntax — jq subprocess pipe internal invocation
### 6. D-02 OutputFormat — human table default + --json opt-in
### 7. D-03 PaginationFlags — --tail/--head/--reverse MVP 3 flags
### 8. D-04 SecurityRedact — consumer 2nd-layer 5-pattern redact

## A7 Conservation
[ci.yml A7 iter 0018 → 0021; ADR 0001-0020 main body 0 diff]

## Consequences
[Capability delta table; DEFERRED #BV + #AH to Phase 5.2]

## Compliance
[F1-FN acceptance bar per REQUIREMENTS R10.1 + R10.2]

## Errata-path note
[ADR 0021+ for Phase 5.2+ evolution]

## Adoption-confirmation
[ship evidence post-W2]

## References
[D-05 through D-08 + D-01 through D-04 source anchors]
```

**Sister cross-ref section** (ADR 0018 § 5 M-01 pattern):
```markdown
### § M-01 PhaseClass ARCHITECTURAL LOCK
Phase 5.1 = architectural decision phase (R10.1 NEW src/cli/audit-log.ts + R10.2 MODIFY
src/checkpoint/state.ts + NEW dep proper-lockfile) ≠ publish-only. Full ship cadence applies.
```

---

### `src/checkpoint/state.ts` (MODIFY — lock wrap)

**Analog:** self (77L current) + `proper-lockfile` API (D-05 LOCKED)
**Estimated lines post-modify:** ~100-120L (≤200L verdict: PASS)

**Current write pattern** (`src/checkpoint/state.ts` lines 44-51):
```typescript
export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) { ... throw ... }
  await mkdir(dirname(STATE_PATH), { recursive: true })
  await writeFile(STATE_PATH, JSON.stringify(s, null, 2), 'utf8')
}
```

**Target lock-wrap pattern** (D-05 + D-06 LOCKED; `withLock` helper recommended if 3+ sites):
```typescript
import lockfile from 'proper-lockfile'

const LOCK_TARGET = '.harnessed'
const LOCK_OPTS = { stale: 10_000, retries: { retries: 3, factor: 2, minTimeout: 100 } }

export class LockHeldError extends Error {
  constructor() {
    super('another harnessed process holds the lock at .harnessed/.lock — wait or kill stale process (try: harnessed status)')
    this.name = 'LockHeldError'
  }
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock(LOCK_TARGET, LOCK_OPTS)
    return await fn()
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ELOCKED') throw new LockHeldError()
    throw e
  } finally {
    await release?.()
  }
}

export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) { ... }
  await mkdir(dirname(STATE_PATH), { recursive: true })
  await withLock(async () => {
    await writeFile(STATE_PATH, JSON.stringify(s, null, 2), 'utf8')
  })
}
```

**withLock helper extraction decision:** `withLock` applies to ≥3 write sites (state.ts + engineHook.ts activatePhase + engineHook.ts completePhase + resume.ts). Extract as module-level helper in `state.ts` and re-export, or extract to `src/checkpoint/lib/lock.ts` if resume.ts also imports. Planner: recommend single `withLock` in `state.ts` exported; resume.ts imports from `../checkpoint/state.js`.

---

### `src/checkpoint/engineHook.ts` (MODIFY — lock wrap)

**Analog:** self (48L current)
**Estimated lines post-modify:** ~60-70L (≤200L verdict: PASS — well within)

**Current pattern** (`src/checkpoint/engineHook.ts` lines 22-48):
```typescript
export async function activatePhase(phaseId: string): Promise<{ checkpointPath: string }> {
  const checkpointPath = `.harnessed/checkpoints/${phaseId}.json`
  await stateActivate(phaseId, checkpointPath)   // ← this calls writeCurrentWorkflow
  return { checkpointPath }
}
export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> {
  writeCheckpoint({ ... })   // sync — no lock needed (appendFileSync)
  await stateComplete()      // ← this calls writeCurrentWorkflow → lock acquired there
}
```

**Lock propagation note:** Since `stateActivate` and `stateComplete` both call `writeCurrentWorkflow`, and the lock wraps `writeCurrentWorkflow`, engineHook.ts acquires lock **transitively** through state.ts. No direct lockfile import needed in engineHook.ts. Zero net change to engineHook.ts IF lock is wrapped inside writeCurrentWorkflow. Planner verify this design is sufficient vs direct hook-level lock.

---

### `src/cli.ts` (MODIFY — 13th subcommand registration)

**Analog:** `src/cli.ts` lines 1-41 (current 12-subcommand pattern)
**Estimated lines post-modify:** ~43-44L (≤200L verdict: PASS)

**Registration pattern** (`src/cli.ts` lines 4-39):
```typescript
import { registerAuditLog } from './cli/audit-log.js'  // ADD line ~12 (alphabetical insert)

// In body (after registerAudit, line ~34):
registerAuditLog(program)  // Phase 5.1 W1 — 13th subcommand (R10.1 D-01 jq filter consumer)
```

**Naming decision** (CONTEXT.md L139 — top-level `harnessed audit-log` NOT nested under `harnessed audit`):
```typescript
program.command('audit-log')  // NOT program.command('audit').command('log')
// Rationale: manifest yaml audit ≠ routing audit log; separate semantic domains
```

---

### `src/cli/resume.ts` (MODIFY — lock acquire site)

**Analog:** self (42L current)
**Estimated lines post-modify:** ~50-55L (≤200L verdict: PASS)

**Current pattern** (`src/cli/resume.ts` lines 7-41):
```typescript
export function registerResume(program: Command): void {
  program.command('resume')...
  .action(async (opts) => {
    const { runResume } = await import('../checkpoint/resume.js')
    const r = await runResume()   // ← calls readCurrentWorkflow inside
    ...
  })
}
```

**Lock acquire note:** `runResume` reads then potentially writes current-workflow.json. Lock should wrap the read-modify-write sequence inside `runResume` (in `src/checkpoint/resume.ts`), not the CLI shell. Planner: check if `src/checkpoint/resume.ts` calls `writeCurrentWorkflow` — if yes, lock propagates transitively (same as engineHook). If resume only reads, no lock needed in resume path.

---

### `src/cli/status.ts` (MODIFY — lock holder display)

**Analog:** self (31L current)
**Estimated lines post-modify:** ~55-70L (≤200L verdict: PASS)

**Current pattern** (`src/cli/status.ts` lines 13-31):
```typescript
export function registerStatus(program: Command): void {
  program.command('status').description('Show installed upstreams...')
  .action(async () => {
    const state = await readState(process.cwd())
    ...
  })
}
```

**Lock display enhancement** (D-07 LOCKED — display `.harnessed/.lock` holder pid + stale indicator):
```typescript
// Add after existing readState output:
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Read .harnessed/.lock file content (proper-lockfile writes pid + timestamp JSON)
try {
  const lockRaw = await readFile(join(process.cwd(), '.harnessed/.lock'), 'utf8')
  const lock = JSON.parse(lockRaw) as { pid: number; time: number }
  const ageMs = Date.now() - lock.time
  const stale = ageMs > 10_000  // D-05 stale: 10000ms
  console.log(`lock: pid ${lock.pid} (held ${Math.round(ageMs / 1000)}s ago${stale ? ' — STALE' : ''})`)
} catch {
  // No lock file = no active lock, silent
}
```

---

### `package.json` (MODIFY — add proper-lockfile runtime dep)

**Pattern** (current `package.json` lines 69-80 `dependencies` block):
```json
"dependencies": {
  "@anthropic-ai/claude-agent-sdk": "0.3.142",
  "@clack/prompts": "^0.10.1",
  "@sinclair/typebox": "^0.34.49",
  "ajv": "^8.20.0",
  "ajv-errors": "^3.0.0",
  "ajv-formats": "^3.0.1",
  "commander": "^13.0.0",
  "diff": "^9.0.0",
  "picocolors": "^1.1.1",
  "proper-lockfile": "^4.1.2",   // ADD — D-05 LOCKED; runtime dep NOT devDependencies
  "yaml": "^2.9.0"
}
```

**Critical:** `proper-lockfile` goes in `dependencies` (runtime), NOT `devDependencies`. The lock is used in production CLI path (writeCurrentWorkflow + activatePhase + completePhase).

---

### `docs/adr/README.md` (MODIFY — index entry)

**Pattern** (`docs/adr/README.md` lines 59-62 — ADR 0018-0020 entry 6-line format):
```markdown
| [0021](./0021-state-lock-and-audit-consumer.md) | Phase 5.1 — R10.2 state.ts concurrent write lock (proper-lockfile) + R10.1 audit log --filter CLI consumer | Accepted | 2026-05-19 |
```

Append after ADR 0020 entry (line 62). Single-line table row per sister Phase 3.4 single-add cadence.

---

### `.github/workflows/ci.yml` (MODIFY — A7 iter 0018 → 0021)

**Pattern** (`ci.yml` lines 82-107 A7 step):
```bash
# TWO surgical replacements (sister Phase 4.3 W2 T2.4 explicit literal pattern):
# 1. for loop: "0018" → "0018 0019 0020 0021"   (append new ADR numbers)
# 2. step name: "ADR 0001-0018" → "ADR 0001-0021"
```

Exact lines to change (lines 85, 96, 107):
- Line 85: `for n in 0001 ... 0018;` → `for n in 0001 ... 0018 0019 0020 0021;`
- Line 96: same for loop (second occurrence)
- Line 82/107: step name + echo message `ADR 0001-0018` → `ADR 0001-0021`

**Note:** ADR 0019 and 0020 baseline tags do NOT exist yet (they were backfill ADRs with no `adr-0019-accepted` / `adr-0020-accepted` tags per ADR 0018 ship evidence). The A7 loop uses `missing_tags` warning-skip logic (ci.yml lines 91-94) so missing tags are gracefully skipped. Planner: verify whether `adr-0019-accepted` + `adr-0020-accepted` tags need to be created as part of Phase 5.1 ship, or if 0021-only iteration is cleaner.

---

### `src/installers/lib/runClaudeArgs.ts` (NEW, W0 sub-batch #BF)

**Analog:** `src/installers/mcpStdioAdd.ts` L36-57 + `src/installers/mcpHttpAdd.ts` L43-64
**Estimated lines:** ~25-35L (≤200L verdict: PASS — far under)

**Duplicate function to extract** (identical in mcpStdioAdd.ts L40 + mcpHttpAdd.ts L47 + ccPluginMarketplace.ts):
```typescript
// src/installers/lib/runClaudeArgs.ts — extract from 3 duplicates
export interface ProcResult {
  exitCode: number
  stderr: string
}
export function runArgs(claudeArgs: string[], cwd: string, timeoutMs = 15_000): Promise<ProcResult> {
  return new Promise((resolve) => {
    // Win: route through cmd.exe /c because `claude` ships as a .cmd shim.
    // Unix: spawn the binary directly (no shell) — args remain unparsed.
    const isWin = process.platform === 'win32'
    // ... (identical body across 3 files)
  })
}
```

**3 call sites** to update: `mcpStdioAdd.ts`, `mcpHttpAdd.ts`, `ccPluginMarketplace.ts` — replace local `function runArgs` with `import { runArgs } from './lib/runClaudeArgs.js'`.

---

### `src/installers/lib/err.ts` (NEW, W0 sub-batch #BG)

**Analog:** Identical 3-line function in 6 installer files
**Estimated lines:** ~8-10L (≤200L verdict: PASS — far under)

**Duplicate function to extract** (verbatim identical in mcpStdioAdd.ts L31, mcpHttpAdd.ts L38, gitCloneWithSetup.ts L43, npmCli.ts L35, npxSkillInstaller.ts L49, ccHookAdd.ts L18):
```typescript
// src/installers/lib/err.ts — extract from 6 duplicates
import type { InstallContext, InstallError } from './types.js'

export function err(
  ctx: InstallContext,
  path: string,
  message: string,
  keyword: string,
): InstallError {
  return { file: ctx.manifest.metadata.name, path, message, line: null, column: null, keyword }
}
```

**6 call sites** to update: replace local `function err(...)` with `import { err } from './lib/err.js'`.

---

## Shared Patterns

### Lock Helper (`withLock`)
**Source:** NEW — extract to `src/checkpoint/state.ts` (module-level, re-exported)
**Apply to:** `src/checkpoint/state.ts` writeCurrentWorkflow, `src/checkpoint/engineHook.ts` (transitive), `src/cli/resume.ts` (if write path confirmed)
```typescript
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock('.harnessed', { stale: 10_000, retries: { retries: 3, factor: 2, minTimeout: 100 } })
    return await fn()
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ELOCKED') throw new LockHeldError()
    throw e
  } finally {
    await release?.()
  }
}
```

### ExitError + runCli Test Helper
**Source:** `tests/cli/doctor.test.ts` lines 41-64
**Apply to:** `tests/cli/audit-log.test.ts` — 100% copy, change `registerDoctor` → `registerAuditLog`

### Commander Register Function Shape
**Source:** `src/cli/doctor.ts` lines 155-210 + `src/cli/audit.ts` lines 88-167
**Apply to:** `src/cli/audit-log.ts`
```typescript
export function registerAuditLog(program: Command): void {
  program.command('audit-log').description('...').option(...).action(async (opts: {...}) => {
    ...
    process.exit(code)
  })
}
```

### ADR 9-Section Format
**Source:** `docs/adr/0018-routing-audit-log.md` sections Status / Context / Decisions / A7 Conservation / Consequences / Compliance / Errata-path / Adoption-confirmation / References
**Apply to:** `docs/adr/0021-state-lock-and-audit-consumer.md`

### Biome Preempt (project memory)
**Source:** `feedback_biome-preempt.md`
**Apply to:** ALL TS file commits — run `pnpm exec biome check --write` before commit

---

## Karpathy ≤200L Hard Limit Summary

| File | Sister Analog L | New Logic Est. | Total Est. | ≤200L Verdict |
|---|---|---|---|---|
| `src/cli/audit-log.ts` | doctor.ts 210L (≤215L B-03) | ~50L (jq spawn + redact + flags) | ~140-160L | **PASS** |
| `tests/cli/audit-log.test.ts` | doctor.test.ts 149L | ~20L (redact cells) | ~120-150L | **PASS** |
| `tests/checkpoint/state-lock.test.ts` | state.test.ts 98L | ~40L (lock mocks + concurrent cells) | ~80-100L | **PASS** |
| `docs/adr/0021-...md` | ADR 0018 ~219L | ~30L (5.1-specific decisions) | ~120-160L | **PASS** |
| `src/checkpoint/state.ts` | self 77L | ~30L (withLock + LockHeldError) | ~100-120L | **PASS** |
| `src/checkpoint/engineHook.ts` | self 48L | ~0-5L (transitive lock only) | ~48-55L | **PASS** |
| `src/cli.ts` | self 41L | ~2L (1 import + 1 register) | ~43L | **PASS** |
| `src/cli/resume.ts` | self 42L | ~5-10L (lock acquire if needed) | ~50-55L | **PASS** |
| `src/cli/status.ts` | self 31L | ~20-25L (lock display block) | ~55-70L | **PASS** |
| `src/installers/lib/runClaudeArgs.ts` | mcpStdioAdd L40 extract | extract only | ~25-35L | **PASS** |
| `src/installers/lib/err.ts` | 6-file duplicate extract | extract only | ~8-10L | **PASS** |

All files pass ≤200L hard limit. `src/cli/audit-log.ts` is the tightest at ~140-160L — planner must track during implementation.

---

## Risk Mitigations

### Risk #1 — proper-lockfile Win cross-OS (D-05 sneak-block)
`proper-lockfile` has documented Win fallback (uses file existence + O_EXCL where flock unavailable). CI matrix includes `windows-latest` — Phase 5.1 W1 must verify lock acquire/release works on Win runner before W2 ship. Sister Win ACL corepack lesson (CLAUDE.md) = cross-OS file ops always need CI green before ship.

### Risk #2 — W0 sub-batch scope inflation (#BQ Phase 4.3 cadence)
#BF (runClaudeArgs) + #BG (err.ts) are MED-priority atomic refactors. Planner discretion: absorb as Wave B sub-batch (separate from R10.1 + R10.2 primary waves) to avoid scope inflation. Phase 4.3 precedent: W0 backlog absorb as distinct wave tasks with own acceptance bar.

### Risk #3 — audit-log.ts ≤200L budget pressure
~140-160L estimate leaves ~40-60L headroom. If redact (5 patterns) + dual-format logic + 3 pagination flags + jq spawn all land in one file, budget is tight. Mitigation: extract `redact()` helper inline (3-4L), keep format logic minimal (manual column align, no lib), keep jq spawn tight (~15L). If over 180L, extract redact patterns to `src/cli/lib/audit-redact.ts` (sister `src/cli/lib/audit-helpers.ts` Phase 2.4 extract precedent).

---

## No Analog Found

All Phase 5.1 files have close analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `src/cli/`, `src/checkpoint/`, `tests/cli/`, `tests/checkpoint/`, `docs/adr/`, `.github/workflows/`, `src/installers/`
**Files scanned:** 14 source + 4 test + 2 ADR + 1 CI = 21 files read directly
**Pattern extraction date:** 2026-05-19
