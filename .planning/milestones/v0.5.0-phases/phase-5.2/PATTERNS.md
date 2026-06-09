# Phase 5.2: R10.3 uninstall + R10.4 path traversal — Pattern Map

**Mapped:** 2026-05-19
**Files analyzed:** 20 new/modified files + 2 W0 extract candidates
**Analogs found:** 20 / 20 (all files have strong sister analogs)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/cli/uninstall.ts` | CLI subcommand | request-response | `src/cli/install.ts` (145L) | exact |
| `src/uninstallers/index.ts` | dispatch table | request-response | `src/installers/index.ts` (60L) | exact |
| `src/uninstallers/npmCli.ts` | uninstaller | request-response | `src/installers/npmCli.ts` (127L) | exact-inverse |
| `src/uninstallers/mcpStdioAdd.ts` | uninstaller | request-response | `src/installers/mcpStdioAdd.ts` (197L) | exact-inverse |
| `src/uninstallers/mcpHttpAdd.ts` | uninstaller | request-response | `src/installers/mcpHttpAdd.ts` (295L) | exact-inverse |
| `src/uninstallers/ccPluginMarketplace.ts` | uninstaller | request-response | `src/installers/ccPluginMarketplace.ts` (246L) | exact-inverse |
| `src/uninstallers/gitCloneWithSetup.ts` | uninstaller | file-I/O | `src/installers/gitCloneWithSetup.ts` (254L) | exact-inverse |
| `src/uninstallers/npxSkillInstaller.ts` | uninstaller | file-I/O | `src/installers/npxSkillInstaller.ts` (208L) | exact-inverse |
| `src/uninstallers/ccHookAdd.ts` | uninstaller | file-I/O | `src/installers/ccHookAdd.ts` (128L) | exact-inverse |
| `tests/cli/uninstall.test.ts` | test | request-response | `tests/cli/audit-log.test.ts` (242L) | role-match |
| `src/manifest/lib/path-guard.ts` | utility/security | transform | `src/cli/audit-log.ts` D-04 section (L17-29) | role-match |
| `tests/manifest/path-guard.test.ts` | test | transform | `tests/audit/log.test.ts` (Phase 4.3 sanitize) | role-match |
| `docs/adr/0022-uninstall-and-path-traversal.md` | doc | — | `docs/adr/0021-state-lock-and-audit-consumer.md` (174L) | exact format |
| `src/manifest/security.ts` (MODIFY) | utility/security | transform | self (200L existing) | modify-only |
| `src/manifest/aliases.ts` resolveAlias (MODIFY) | utility | transform | self (47L existing) | modify-only |
| `src/cli/install.ts` L82 (MODIFY) | CLI subcommand | request-response | self (145L) | modify-only |
| `src/cli/audit-log.ts` (MODIFY) | CLI subcommand | request-response | self (163L) | modify-only |
| `src/cli.ts` main entry (MODIFY) | entry point | — | self (43L) | modify-only |
| `docs/adr/README.md` (MODIFY) | doc | — | self (67L) | modify-only |
| `.github/workflows/ci.yml` A7 step (MODIFY) | CI config | — | self A7 step L87-112 | modify-only |
| `src/cli/lib/validateFlags.ts` NEW (#BH W0) | utility | transform | `src/cli/install.ts` L67-74 + `src/cli/install-base.ts` L51-54 | extract |
| `src/uninstallers/lib/runOrPreview.ts` NEW (#BI W0) | utility | transform | dry-run block pattern in `src/installers/npmCli.ts` L87-88 + `src/installers/mcpStdioAdd.ts` L120 | extract |

---

## Pattern Assignments

### `src/cli/uninstall.ts` (CLI subcommand, request-response)

**Analog:** `src/cli/install.ts` (145L)
**Reuse %:** ~90% — invert command name, add `--yes` confirm prompt (D-06), adapt ephemeral exit-0 warn (D-02), drop `--system`/`--known-good`/`--full-diff` flags
**Estimate:** ≤130L — PASS Karpathy ≤200L

**Imports pattern** (`src/cli/install.ts` L23-33):
```typescript
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import pkg from '../../package.json' with { type: 'json' }
import { runInstall } from '../installers/index.js'
import type { InstallError, InstallOpts } from '../installers/lib/types.js'
import { validateManifestFile } from '../manifest/validate.js'
```
For uninstall.ts: swap `runInstall` → `runUninstall`, `InstallOpts` → `UninstallOpts`, add `checkPathSafe` import from `../manifest/lib/path-guard.js`.

**RawOpts interface pattern** (`src/cli/install.ts` L35-43):
```typescript
interface RawOpts {
  apply?: boolean
  dryRun?: boolean
  nonInteractive?: boolean
  // uninstall adds:
  yes?: boolean   // D-06 --yes bypass confirm prompt
}
```

**H1 pre-action gate pattern** (`src/cli/install.ts` L67-74):
```typescript
if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
  console.error(
    'error: --non-interactive requires an explicit --apply or --dry-run flag\n' +
      "  fix:  re-run as 'harnessed uninstall <name> --non-interactive --dry-run' or '--apply'",
  )
  process.exit(2)
}
```

**Path guard invocation pattern** — inject at install.ts L82 equivalent:
```typescript
// R10.4: check before resolve (D-04 hardening site 2)
import { checkPathSafe } from '../manifest/lib/path-guard.js'
checkPathSafe(resolvedName)  // throws PathTraversalError → catch + exit 1
```

**Exit code mapping** (`src/cli/install.ts` L130-143):
```typescript
if ('aborted' in result) {
  console.error(`aborted: ${result.reason}`)
  process.exit(2)
}
if (result.ok) {
  console.log(`uninstalled ${v.manifest.metadata.name}`)
  process.exit(0)
}
console.error(formatError(result.error))
process.exit(1)
```

**Ephemeral exit-0 warn** (NEW for D-02 — no analog, use this shape):
```typescript
// D-02: ephemeral detection before runUninstall dispatch
const cmd = v.manifest.spec.install.cmd ?? ''
if (/\bnpx\s+(--yes|-y)\b/.test(cmd)) {
  console.warn(
    `ephemeral install: nothing to uninstall ('${resolvedName}' uses 'npx --yes' ` +
    `runtime-only invocation; no persistent install to remove)`,
  )
  process.exit(0)
}
```

---

### `src/uninstallers/index.ts` (dispatch table, request-response)

**Analog:** `src/installers/index.ts` (60L)
**Reuse %:** ~85% — same Record<method, Uninstaller> shape; drop `levelOf()` (uninstall has no L4 --system gate); keep same 7 method keys
**Estimate:** ≤30L — PASS

**Full analog** (`src/installers/index.ts` L19-60):
```typescript
export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'npm-cli': installNpmCli,
  'mcp-stdio-add': installMcpStdioAdd,
  // ... 7 total
}

export async function runInstall(manifest: Manifest, opts: InstallOpts): Promise<InstallResult> {
  const installer = installers[manifest.spec.install.method]
  return installer({ manifest, opts, level: levelOf(manifest), cwd: process.cwd() })
}
```
For uninstall: `runUninstall(manifest, opts)` — omit `level` parameter (uninstall does not gate on level; D-01 per-method dispatch handles all cases directly).

---

### `src/uninstallers/npmCli.ts` (uninstaller, request-response)

**Analog:** `src/installers/npmCli.ts` (127L)
**Reuse %:** ~60% — same method-discriminator + preflight structure; inverse: `npm uninstall <pkg>` instead of install; drop backup/diff/confirm/verify; add ephemeral no-op (D-02 already caught by cli/uninstall.ts before dispatch)
**Estimate:** ≤30L — PASS

**Method discriminator pattern** (`src/installers/npmCli.ts` L31-44):
```typescript
export const installNpmCli: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'npm-cli') {
    return {
      ok: false, phase: 'preflight',
      error: err(ctx, '/spec/install/method', `dispatch bug: ${install.method}`, 'dispatch-mismatch'),
    }
  }
```
For uninstall: `export const uninstallNpmCli: Uninstaller = async (ctx) => { ... if (install.method !== 'npm-cli') ...`

**spawnCmd reuse** (`src/installers/npmCli.ts` L91-104) — uninstall swaps cmd:
```typescript
// installer: spawnCmd(ctx, install.cmd, [])
// uninstaller: derive pkg from install.cmd, build `npm uninstall <pkg>`
const pkgMatch = install.cmd.match(/\bnpm\s+install(?:\s+-g)?\s+(\S+)/)
const pkg = pkgMatch?.[1] ?? ctx.manifest.metadata.upstream.source
const sp = await spawnCmd(ctx, `npm uninstall ${pkg}`, [])
```

---

### `src/uninstallers/mcpStdioAdd.ts` (uninstaller, request-response)

**Analog:** `src/installers/mcpStdioAdd.ts` (197L)
**Reuse %:** ~50% — same discriminator + runArgs pattern; inverse: `claude mcp remove <name>` instead of `claude mcp add ...`; drop H2 arg-screen loop (remove takes only name); drop backup/diff/verify
**Estimate:** ≤25L — PASS

**runArgs pattern** (`src/installers/mcpStdioAdd.ts` L125):
```typescript
const r = await runArgs(addArgs, install.cwd ?? ctx.cwd)
```
For uninstall:
```typescript
import { runArgs } from '../installers/lib/runClaudeArgs.js'
const r = await runArgs(['mcp', 'remove', name], ctx.cwd)
if (r.exitCode !== 0) {
  return { ok: false, phase: 'spawn', error: err(ctx, '/spec/install/cmd',
    `claude mcp remove exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`, 'uninstall-failed') }
}
return { ok: true, appliedFiles: [] }
```

---

### `src/uninstallers/mcpHttpAdd.ts` (uninstaller, request-response)

**Analog:** `src/installers/mcpHttpAdd.ts` (295L)
**Reuse %:** ~50% — same CC remove cmd as mcpStdioAdd uninstaller; `claude mcp remove <name>` is transport-agnostic; identical shape to mcpStdioAdd uninstaller
**Estimate:** ≤25L — PASS

Identical to `src/uninstallers/mcpStdioAdd.ts` pattern — discriminator checks `'mcp-http-add'`, same `runArgs(['mcp', 'remove', name], ctx.cwd)`.

---

### `src/uninstallers/ccPluginMarketplace.ts` (uninstaller, request-response)

**Analog:** `src/installers/ccPluginMarketplace.ts` (246L)
**Reuse %:** ~55% — reuse `parseCmd()` helper to extract `pluginAtMkt` from manifest cmd; inverse: `claude plugin uninstall <plugin>@<marketplace>` instead of install
**Estimate:** ≤30L — PASS

**parseCmd reuse + inverse spawn** (`src/installers/ccPluginMarketplace.ts` L55-68, L177):
```typescript
// Reuse parseCmd() extracted or copy inline (≤15L; too small for lib)
const parsed = parseCmd(install.cmd)
if (!parsed) { /* same preflight error shape */ }
const r = await runArgs(['plugin', 'uninstall', parsed.pluginAtMkt], ctx.cwd)
```

---

### `src/uninstallers/gitCloneWithSetup.ts` (uninstaller, file-I/O)

**Analog:** `src/installers/gitCloneWithSetup.ts` (254L)
**Reuse %:** ~45% — reuse `extractCloneTarget()` helper to get the path; inverse: `fs.rm(cloneTarget, { recursive: true, force: true })` instead of git clone
**Estimate:** ≤35L — PASS

**extractCloneTarget reuse + fs.rm** (`src/installers/gitCloneWithSetup.ts` L70-98):
```typescript
import { rm } from 'node:fs/promises'
// Reuse extractCloneTarget() (copy inline or import)
const cloneTarget = extractCloneTarget(install.cmd)
if (!cloneTarget) { /* same preflight error shape */ }

// Cross-OS: fs.rm is Node.js native — no shell, no Win/Unix difference
await rm(cloneTarget, { recursive: true, force: true })
return { ok: true, appliedFiles: [] }
```
**Win compat note:** `fs.rm({ recursive: true, force: true })` is cross-platform in Node 22. No shell exec needed. This eliminates the `rm -rf` Win/Unix divergence risk.

---

### `src/uninstallers/npxSkillInstaller.ts` (uninstaller, file-I/O)

**Analog:** `src/installers/npxSkillInstaller.ts` (208L)
**Reuse %:** ~50% — reuse `extractSkillName()` + `homedir()` path computation; inverse: `fs.rm(skillDir, { recursive: true, force: true })`
**Estimate:** ≤30L — PASS

**extractSkillName + fs.rm pattern** (`src/installers/npxSkillInstaller.ts` L47-54, L124):
```typescript
import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
// Reuse extractSkillName() inline
const skillSegment = extractSkillName(install.cmd, ctx.manifest.metadata.name)
const skillDir = join(homedir(), '.claude', 'skills', skillSegment)
await rm(skillDir, { recursive: true, force: true })
return { ok: true, appliedFiles: [] }
```

---

### `src/uninstallers/ccHookAdd.ts` (uninstaller, file-I/O)

**Analog:** `src/installers/ccHookAdd.ts` (128L) — most complex uninstaller
**Reuse %:** ~70% — same read/parse/write settings.json pattern; inverse: remove the specific hook entry from `settings.hooks[ev][]` instead of push; keep idempotent-skip for already-absent
**Estimate:** ≤40L — PASS

**Settings read/parse/write pattern** (`src/installers/ccHookAdd.ts` L46-93):
```typescript
// Full analog structure — copy and invert the mutation:
const existing = await readFile(settingsPath, 'utf8').catch(() => null)
const settings: Settings = JSON.parse(existing ?? '{}') as Settings
settings.hooks = settings.hooks ?? {}
const ev = install.hook_event
const cmd = install.hook_command
const matcher = install.hook_matcher
settings.hooks[ev] = settings.hooks[ev] ?? []

// INVERSE: filter OUT the matching entry (instead of push)
const before = settings.hooks[ev].length
settings.hooks[ev] = settings.hooks[ev].filter(
  (h) => !(h.command === cmd && h.matcher === matcher)
)
if (settings.hooks[ev].length === before) {
  // Already absent — idempotent skip (mirrors install idempotent-skip)
  return { ok: true, backupId: 'idempotent-skip', appliedFiles: [] }
}
const newText = `${JSON.stringify(settings, null, 2)}\n`
await writeFile(settingsPath, newText)

// R7 verify: re-read + assert entry IS gone
const verify = JSON.parse(await readFile(settingsPath, 'utf8')) as Settings
if (verify.hooks?.[ev]?.some((h) => h.command === cmd)) {
  return { ok: false, phase: 'verify', error: err(..., 'verify-failed') }
}
return { ok: true, appliedFiles: [settingsPath] }
```

---

### `tests/cli/uninstall.test.ts` (test, request-response)

**Analog:** `tests/cli/audit-log.test.ts` (242L)
**Reuse %:** ~85% — identical vi.mock boilerplate, ExitError class, runCli helper; swap mocked modules (spawn + fs) and subject import
**Estimate:** 10-14 cells, ≤180L — PASS

**vi.mock + ExitError + runCli pattern** (`tests/cli/audit-log.test.ts` L6-47):
```typescript
vi.mock('node:child_process', () => ({ spawn: vi.fn(), spawnSync: vi.fn() }))
vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(), rm: vi.fn(), writeFile: vi.fn() }))

class ExitError extends Error {
  constructor(public code: number) { super(`exit(${code})`) }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = '', stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?) => { throw new ExitError(typeof c === 'number' ? c : 0) })
  vi.spyOn(console, 'log').mockImplementation((...a) => { stdout += `${a.map(String).join(' ')}\n` })
  vi.spyOn(console, 'error').mockImplementation((...a) => { stderr += `${a.map(String).join(' ')}\n` })
  const program = new Command().exitOverride()
  registerUninstall(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}
```

**Recommended test cell matrix** (10 cells):
- cell 1: H1 gate — `--non-interactive` without `--apply`/`--dry-run` → exit 2
- cell 2: manifest not found → exit 1 + error message
- cell 3: dry-run default (no --apply) → preview output, no rm called, exit 2 (aborted)
- cell 4: `--apply` on ephemeral (npx --yes cmd) → exit 0 + warn message (D-02)
- cell 5: `--apply` git-clone-with-setup → `fs.rm` called with correct path, exit 0
- cell 6: `--apply` npx-skill-installer → `fs.rm` called with `~/.claude/skills/<name>`, exit 0
- cell 7: `--apply` mcp-stdio-add → `runArgs(['mcp','remove',name])` called, exit 0
- cell 8: `--apply --yes` skips confirm prompt, exit 0
- cell 9: runArgs spawn error → exit 1 + error message
- cell 10 (optional): path traversal in name → PathTraversalError → exit 1

---

### `src/manifest/lib/path-guard.ts` (utility/security, transform)

**Analog:** `src/cli/audit-log.ts` D-04 section (L17-29) — module-level pre-compiled RegExp + reducer function pattern
**Reuse %:** ~80% — same pre-compile-at-module-load pattern; same `Array<[RegExp, string]>` shape adapted to `RegExp[]` + throw instead of replace
**Estimate:** ≤50L — PASS

**Pre-compile pattern** (`src/cli/audit-log.ts` L17-29):
```typescript
// D-04: pre-compile at module load (NOT inside loop per PLAN sneak-block).
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key=[REDACTED]'],
  // ...5 total
]
function redact(s: string): string {
  return REDACT_PATTERNS.reduce((acc, [re, rep]) => acc.replace(re, rep), s)
}
```

**path-guard.ts shape** (adapt same pattern):
```typescript
// R10.4 D-03: 5 OWASP path traversal vectors — pre-compile at module load.
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//,           // Unix dot-dot: ../etc/passwd
  /\.\.\\/,           // Windows back-dot: ..\windows\system32
  /\x00/,             // Null byte injection: path\0attack
  /%2[eE]%2[eE]/,     // URL-encoded dot-dot: %2e%2e%2f
  /%25[2][eE]%25[2][eE]/, // Double-encoded: %252e%252e%252f
]

export class PathTraversalError extends Error {
  constructor() {
    // D-08: generic message, NOT echo back user input (CSO veto)
    super('path traversal attempt detected')
    this.name = 'PathTraversalError'
  }
}

export function checkPathSafe(path: string): void {
  for (const re of PATH_TRAVERSAL_PATTERNS) {
    if (re.test(path)) throw new PathTraversalError()
  }
}
```
**PathTraversalError class location:** co-locate in `path-guard.ts` (NOT new errors.ts — YAGNI per D-03 CONTEXT.md open question recommendation).

---

### `tests/manifest/path-guard.test.ts` (test, transform)

**Analog:** `tests/audit/log.test.ts` Phase 4.3 sanitize pattern (vi.mock node:fs, fixture-matrix style)
**Reuse %:** ~60% — similar describe/it matrix; no vi.mock needed (pure function); pattern matrix cells
**Estimate:** 7-9 cells, ≤120L — PASS

**Recommended test cell matrix** (8 cells):
- cell 1: Unix dot-dot `../../etc/passwd` → throws PathTraversalError
- cell 2: Windows back-dot `..\windows\system32` → throws PathTraversalError
- cell 3: Null byte `path\x00attack` → throws PathTraversalError
- cell 4: URL-encoded `%2e%2e%2fetc` → throws PathTraversalError
- cell 5: Double-encoded `%252e%252e%252f` → throws PathTraversalError
- cell 6: Safe path `gstack` → does NOT throw (negative control)
- cell 7: Safe path `my-tool_v2` → does NOT throw (negative control)
- cell 8 (D-08): PathTraversalError message does NOT contain user input string (`../../etc/passwd` not in message)

---

### `docs/adr/0022-uninstall-and-path-traversal.md` (doc)

**Analog:** `docs/adr/0021-state-lock-and-audit-consumer.md` (174L) — 9-section format
**Reuse %:** ~95% — copy section headings verbatim; adapt content for R10.3+R10.4
**Estimate:** ≤180L — PASS

**9-section format** (from ADR 0021):
1. `## Status` — `Accepted (phase 5.2 ...)`
2. `## Context` — R10.3 + R10.4 spec verbatim + why now
3. `## Decisions` — D-01 through D-08 (copy structure, adapt content)
4. `§ M-01 PhaseClass ARCHITECTURAL LOCK`
5. `## A7 Conservation` — iter 0021 → 0022 bash snippet
6. `### CI A7 step` — 0021 → 0022 change description
7. `## Consequences` — capability deltas table
8. `## Compliance` — F1-FN acceptance bar
9. `## References` — internal + external

---

### `src/manifest/security.ts` (MODIFY +~5L)

**Current state:** 164L, `checkSecurityViolations()` + `checkCmdString()` + 3-pattern PATTERNS array
**Change:** Add `import { checkPathSafe } from './lib/path-guard.js'` + re-export OR just note that path-guard.ts is a NEW sibling file. Integration is a +3L import at call sites (not in security.ts itself — see D-04 recommendation to keep path-guard.ts separate for Karpathy isolation).

**Pattern for callers** — inject at `src/manifest/aliases.ts` L36 (`resolveAlias`):
```typescript
export function resolveAlias(name: string): string | null {
  // R10.4 D-04 hardening site 1 — check before yaml lookup
  import { checkPathSafe } from './lib/path-guard.js'
  checkPathSafe(name)  // throws PathTraversalError on traversal attempt
  return loadAliases()?.aliases?.[name]?.redirect ?? null
}
```
Note: import must be moved to top of file (static import), not inline.

---

### `src/cli.ts` (MODIFY +~2L)

**Current state:** 43L, 13 subcommands registered
**Pattern** (`src/cli.ts` L36):
```typescript
registerAuditLog(program) // Phase 5.1 W1 T1.3 — 13th subcommand
// ADD:
registerUninstall(program) // Phase 5.2 W1 — 14th subcommand (R10.3)
```
Import line: `import { registerUninstall } from './cli/uninstall.js'`

---

### `.github/workflows/ci.yml` A7 step (MODIFY +~1L)

**Current state** (ci.yml L87-112):
- Step name: `A7 acceptance bar — ADR 0001-0021 main body 守恒`
- Loop: `for n in 0001 ... 0021` (appears on 2 lines: L90 missing-tags loop + L101 diff loop)

**Change pattern** (sister Phase 5.1 W2 T2.8):
- L87: `ADR 0001-0021` → `ADR 0001-0022`
- L90: append `0022` to the for-loop
- L101: append `0022` to the second for-loop
- L112: echo string update: `ADR 0001-0021` → `ADR 0001-0022`

---

### `docs/adr/README.md` (MODIFY +~6L)

**Current state:** 67L, index table ends at 0021
**Pattern** (existing table rows L60-62):
```markdown
| [0021](./0021-state-lock-and-audit-consumer.md) | Phase 5.1 — R10.2 state.ts concurrent write lock ... | Accepted | 2026-05-19 |
```
**Add:**
```markdown
| [0022](./0022-uninstall-and-path-traversal.md) | Phase 5.2 — R10.3 `harnessed uninstall` CLI (7-method dispatch) + R10.4 path traversal 5-vector regex hardening | Accepted | 2026-05-19 |
```

---

## W0 Extract Candidates

### `src/cli/lib/validateFlags.ts` NEW (#BH)

**Source duplications** (5 sites):
- `src/cli/install.ts` L67-74
- `src/cli/install-base.ts` L51-54
- `src/cli/manifest-add.ts` L39-41
- `src/cli/uninstall.ts` NEW (will add same block)

**Proposed extract:**
```typescript
// src/cli/lib/validateFlags.ts ≤30L
export function validateNonInteractiveFlags(
  raw: { nonInteractive?: boolean; apply?: boolean; dryRun?: boolean },
  commandName: string,
): void {
  if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
    console.error(
      `error: --non-interactive requires an explicit --apply or --dry-run flag\n` +
      `  fix:  re-run as 'harnessed ${commandName} --non-interactive --dry-run' or '--apply'`,
    )
    process.exit(2)
  }
}
```
**Call sites:** replace 4-line inline block in install.ts, install-base.ts, manifest-add.ts, uninstall.ts with `validateNonInteractiveFlags(raw, 'uninstall')`.

### `src/uninstallers/lib/runOrPreview.ts` NEW (#BI)

**Source duplications** — dry-run short-circuit block:
- `src/installers/npmCli.ts` L87-88: `if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }`
- `src/installers/mcpStdioAdd.ts` L120: same
- `src/installers/gitCloneWithSetup.ts` L180: same
- All 7 uninstallers will add the same pattern

**Note:** The dry-run pattern in uninstallers is simpler than installers (no diff/confirm loop). Recommend a lightweight helper only if ≥4 uninstallers share exact same abort-result shape. Planner discretion per sister #BQ Wave B.

---

## Shared Patterns

### Error Construction
**Source:** `src/installers/lib/err.ts` (16L)
**Apply to:** All 7 uninstaller files
```typescript
import { err } from '../installers/lib/err.js'
// err(ctx, '/spec/install/method', 'dispatch bug: ...', 'dispatch-mismatch')
```
**Note:** `err.ts` is in `src/installers/lib/` — uninstallers import cross-directory. If this feels wrong, copy to `src/uninstallers/lib/err.ts` (3L re-export). YAGNI: just import from installers/lib.

### Cross-OS Spawn
**Source:** `src/installers/lib/runClaudeArgs.ts` (45L)
**Apply to:** `mcpStdioAdd.ts`, `mcpHttpAdd.ts`, `ccPluginMarketplace.ts` uninstallers
```typescript
import { runArgs } from '../installers/lib/runClaudeArgs.js'
// Win: routes through cmd.exe /c; Unix: direct spawn, shell:false
const r = await runArgs(['mcp', 'remove', name], ctx.cwd)
```

### Path-Guard Integration
**Source:** `src/manifest/lib/path-guard.ts` (NEW, ≤50L)
**Apply to:** `src/manifest/aliases.ts` resolveAlias + `src/cli/install.ts` L82 + `src/cli/uninstall.ts` + `src/cli/audit-log.ts`
```typescript
import { checkPathSafe } from '../manifest/lib/path-guard.js'
checkPathSafe(name)  // before any fs/yaml operation on user input
```

### Method Discriminator Guard
**Source:** All 7 installer files (identical shape)
**Apply to:** All 7 uninstaller files
```typescript
if (install.method !== '<method-name>') {
  return {
    ok: false, phase: 'preflight',
    error: err(ctx, '/spec/install/method', `dispatch bug: ${install.method}`, 'dispatch-mismatch'),
  }
}
```

### fs.rm Cross-OS Pattern
**Source:** Node 22 built-in — no analog in current codebase
**Apply to:** `gitCloneWithSetup.ts` + `npxSkillInstaller.ts` uninstallers
```typescript
import { rm } from 'node:fs/promises'
await rm(targetPath, { recursive: true, force: true })
// Cross-OS: Node 22 fs.rm is Win+Unix safe. force:true = no-op if already absent.
```
**Risk mitigation:** `force: true` makes the operation idempotent (no error if already removed). No shell needed — eliminates `rm -rf` Win compat concern entirely.

---

## No Analog Found

All files have close analogs. No entries.

---

## Size Estimate Table (Karpathy ≤200L hard limit)

| File | Analog Size | Reuse % | New Logic | Estimate | ≤200L |
|---|---|---|---|---|---|
| `src/cli/uninstall.ts` | 145L | 90% | ephemeral warn + --yes flag | ≤130L | PASS |
| `src/uninstallers/index.ts` | 60L | 85% | drop levelOf | ≤30L | PASS |
| `src/uninstallers/npmCli.ts` | 127L | 60% | inverse cmd | ≤30L | PASS |
| `src/uninstallers/mcpStdioAdd.ts` | 197L | 50% | `mcp remove` only | ≤25L | PASS |
| `src/uninstallers/mcpHttpAdd.ts` | 295L | 50% | same as stdio | ≤25L | PASS |
| `src/uninstallers/ccPluginMarketplace.ts` | 246L | 55% | parseCmd + plugin uninstall | ≤30L | PASS |
| `src/uninstallers/gitCloneWithSetup.ts` | 254L | 45% | extractCloneTarget + fs.rm | ≤35L | PASS |
| `src/uninstallers/npxSkillInstaller.ts` | 208L | 50% | extractSkillName + fs.rm | ≤30L | PASS |
| `src/uninstallers/ccHookAdd.ts` | 128L | 70% | filter-out inverse + verify | ≤40L | PASS |
| `tests/cli/uninstall.test.ts` | 242L | 85% | 10-cell matrix | ≤180L | PASS |
| `src/manifest/lib/path-guard.ts` | — | 80% redact pattern | 5 RegExp + error class + fn | ≤50L | PASS |
| `tests/manifest/path-guard.test.ts` | — | 60% fixture pattern | 8-cell matrix | ≤120L | PASS |
| `docs/adr/0022-uninstall-and-path-traversal.md` | 174L | 95% | R10.3+R10.4 content | ≤180L | PASS |
| `src/cli/lib/validateFlags.ts` (#BH) | — | extract | 1 function | ≤30L | PASS |
| `src/uninstallers/lib/runOrPreview.ts` (#BI) | — | extract | 1 helper | ≤40L | PASS |

---

## Risk Mitigations

### Risk 1: 7-file pattern monotony (W1 Wave B sub-batch)
Per sister #BQ, planner should assign uninstallers as a single Wave B sub-batch with explicit "copy discriminator + inverse cmd + err helper" template. Each file is ≤35L so the risk is low mechanical error, not complexity. Recommended execution order: ccHookAdd last (most complex JSON mutation); npmCli + mcpStdioAdd + mcpHttpAdd first (simplest spawns).

### Risk 2: Win compat for `rm -rf` in gitCloneWithSetup + npxSkillInstaller uninstallers
**Mitigation:** Use `import { rm } from 'node:fs/promises'` with `{ recursive: true, force: true }` — Node 22 cross-platform, no shell. Eliminates Win CMD vs Unix sh divergence entirely. No `child_process.spawn('rm', ...)` or `rimraf` dep needed.

### Risk 3: W0 sub-batch #BH + #BI ABSORB boundary (planner discretion)
`validateFlags.ts` (#BH) is a clear 4-site extraction with identical code blocks — recommend ABSORB in W0 to benefit uninstall.ts immediately. `runOrPreview.ts` (#BI) has lower ROI for Phase 5.2 (uninstallers are simpler than installers, no diff/confirm loop) — recommend DEFER to Phase 5.3 unless planner sees ≥4 identical blocks during Wave B implementation.

---

## Metadata

**Analog search scope:** `src/cli/`, `src/installers/`, `src/installers/lib/`, `src/manifest/`, `tests/cli/`, `tests/audit/`, `docs/adr/`, `.github/workflows/`
**Files scanned:** 22 source files read + ci.yml A7 section
**Pattern extraction date:** 2026-05-19
