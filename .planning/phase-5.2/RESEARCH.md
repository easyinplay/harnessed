# Phase 5.2 — Research

**Researched:** 2026-05-19
**Domain:** R10.3 `harnessed uninstall` CLI subcommand (7 per-method uninstallers) + R10.4 path traversal regex hardening (5 attack vectors)
**Confidence:** HIGH (codebase verified throughout; all patterns confirmed against live source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01 DispatchArch: per-method 7 NEW `src/uninstallers/*.ts` (sister `installers/` pattern symmetric延袭)
- D-02 EphemeralSemantic: no-op + warn user; detect via `spec.install.cmd` includes `"npx --yes"` / `"npx -y"` → exit 0 + warn message
- D-03 AttackVectorScope: 5 vector minimal MVP (Unix `../`, Win `..\`, null byte, URL-encoded, double-encoded)
- D-04 HardeningScope: `resolveAlias()` + manifest path 2 sites minimal (user-controlled inputs only)
- D-05 DryRunFlag: `--dry-run` default ON; `--apply` explicit (sister install ADR 0004 contract 1延袭)
- D-06 ConfirmPrompt: interactive `y/N` default No + `--yes` bypass for CI (sister install `--non-interactive --apply` double-flag延袭)
- D-07 BackupOption: NO `--keep-backup` flag; use `harnessed backup` independent workflow
- D-08 ErrorMessageSafety: generic `"path traversal attempt detected"` — NOT leak attempted path
- M-01 PhaseClass: ARCHITECTURAL — full ship cadence (ADR 0022 + ci.yml A7 iter 0021→0022 + tag)

### Claude's Discretion

- `src/uninstallers/index.ts` dispatch table naming (vs consolidate)
- Uninstaller TDD coverage 10-14 cells (7 method × edge case)
- R10.4 5 RegExp pre-compile site (`src/manifest/security.ts` co-locate vs NEW `src/manifest/lib/path-guard.ts`)
- PathTraversalError class location
- ADR 0022 outline sister 0021 9-section format延袭
- ci.yml A7 step iter 0021→0022
- W0 sub-batch #BH validateFlags.ts + #BI dry-run abstract ABSORB boundary
- STATE.md ≤150L verify post-W0.1

### Deferred Ideas (OUT OF SCOPE)

- Comprehensive 10+ attack vectors — v0.6+ if signal
- regex + path.resolve() double-defense — v0.6+ if signal
- Reverse-by-install ledger — REJECT permanent
- `--keep-backup` flag — REJECT
- Uninstall undo / time-machine — v0.7+ if signal
- Comprehensive fs.* full API audit — v0.6+ supply-chain
- Error message path echo back — REJECT permanent CSO veto
- `#BJ` `#BK` Phase 4.2 LOW cosmetic — Phase 5.3+ defer
</user_constraints>

---

## Summary

Phase 5.2 delivers two independent but companion capabilities: R10.3 the `harnessed uninstall <name>` CLI subcommand (14th registered subcommand in `src/cli.ts`), and R10.4 path traversal regex hardening at the two user-controlled path input sites. Both are verified against the live codebase — all sister patterns cited here exist and are readable by implementers without further discovery work.

R10.3 requires 7 new `src/uninstallers/*.ts` files (each ≤30L per Karpathy ≤200L budget) + `src/uninstallers/index.ts` dispatch table (~20L) + `src/cli/uninstall.ts` CLI register (~120L). The 7 uninstallers are strict functional inverses of the existing 7 installers: `npmCli` → `npm uninstall`; `mcpStdioAdd`/`mcpHttpAdd` → `claude mcp remove`; `ccPluginMarketplace` → `claude plugin uninstall`; `gitCloneWithSetup`/`npxSkillInstaller` → `fs.rm` recursive; `ccHookAdd` → reverse JSON deep-merge of `~/.claude/settings.json`. The ephemeral detect (D-02) checks `spec.install.cmd` contains `npx --yes` or `npx -y` before dispatch.

R10.4 requires a NEW `src/manifest/lib/path-guard.ts` (~25L) extract that pre-compiles 5 RegExp constants at module load and exports a `guardPath(input: string): void` function throwing `PathTraversalError`. Two integration sites: `resolveAlias()` in `src/manifest/aliases.ts` + the `resolve(process.cwd(), 'manifests/tools/${name}.yaml')` call in `src/cli/install.ts` L82 and the new `src/cli/uninstall.ts`. W0 sub-batch #BH (validateFlags extract) and #BI (dry-run pattern abstract) are recommended ABSORB targets for Wave 0 given Phase 5.2 adds a 5th CLI file with the same H1 gate pattern.

**Primary recommendation:** Implement Wave 0 (#BH/#BI absorb) → Wave 1 (R10.3: 7 uninstallers + index + CLI + TDD) → Wave 2 (R10.4: path-guard.ts + integration + ADR 0022 + A7 + DOGFOOD + ship). Each wave is independently committable; Wave 0 reduces Wave 1 duplication.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| R10.3 uninstall dispatch | CLI (`src/cli/uninstall.ts`) | Uninstaller layer (`src/uninstallers/`) | CLI owns flag parsing + H1 gate; uninstaller layer owns method logic |
| R10.3 7 method uninstall operations | Uninstaller layer (`src/uninstallers/*.ts`) | OS / Claude CC API | Each method owns its inverse; no logic in CLI |
| R10.3 dry-run preview | CLI (default path) | Uninstaller layer | CLI short-circuits before dispatch if `!apply` |
| R10.3 ephemeral detect | Uninstaller layer (`npmCli.ts` logic) | Manifest (`spec.install.cmd` read) | Method-layer responsibility — only `npmCli` uninstaller needs it; `npxSkillInstaller` is always real |
| R10.3 interactive confirm | CLI (`@clack/prompts` via `confirmAt` sister) | — | UX boundary; sister install pattern |
| R10.4 path-guard | Manifest lib (`src/manifest/lib/path-guard.ts` NEW) | CLI callers | Reusable across install + uninstall + audit-log paths |
| R10.4 integration site 1 | `src/manifest/aliases.ts` `resolveAlias()` | path-guard lib | User-controlled name → alias lookup |
| R10.4 integration site 2 | `src/cli/install.ts` L82 + `src/cli/uninstall.ts` NEW | path-guard lib | User-controlled `<name>` → manifest path |
| ADR 0022 | Docs layer | — | Architectural decision anchor; 0021 9-section format延袭 |
| ci.yml A7 iter | CI layer | — | Single extend 0021→0022; NO main body diff existing |

---

## § 1 — 8 D-Decisions Implementation Paths

### D-01 DispatchArch: 7 NEW `src/uninstallers/*.ts`

**Sister reference:** `src/installers/index.ts` L28-37 [VERIFIED: codebase]

```typescript
// src/uninstallers/index.ts — sister installers/index.ts symmetric (~20L)
// [VERIFIED: src/installers/index.ts L28-37 pattern]
import { uninstallCcHookAdd } from './ccHookAdd.js'
import { uninstallCcPluginMarketplace } from './ccPluginMarketplace.js'
import { uninstallGitCloneWithSetup } from './gitCloneWithSetup.js'
import { uninstallMcpHttpAdd } from './mcpHttpAdd.js'
import { uninstallMcpStdioAdd } from './mcpStdioAdd.js'
import { uninstallNpmCli } from './npmCli.js'
import { uninstallNpxSkillInstaller } from './npxSkillInstaller.js'
import type { Manifest } from '../installers/lib/types.js'

export type Uninstaller = (ctx: UninstallContext) => Promise<UninstallResult>

export const uninstallers: Record<Manifest['spec']['install']['method'], Uninstaller> = {
  'npm-cli': uninstallNpmCli,
  'mcp-stdio-add': uninstallMcpStdioAdd,
  'cc-plugin-marketplace': uninstallCcPluginMarketplace,
  'git-clone-with-setup': uninstallGitCloneWithSetup,
  'npx-skill-installer': uninstallNpxSkillInstaller,
  'mcp-http-add': uninstallMcpHttpAdd,
  'cc-hook-add': uninstallCcHookAdd,
}

export async function runUninstall(manifest: Manifest, opts: UninstallOpts): Promise<UninstallResult> {
  return uninstallers[manifest.spec.install.method]({ manifest, opts, cwd: process.cwd() })
}
```

**`levelOf()` not needed for uninstall** — uninstall confirm threshold can default to single `y/N` prompt (destructive = always confirm regardless of level; no L1/L2/L3/L4 stratification needed for removal). [ASSUMED: lower confirm bar for uninstall vs install; planner can override]

**New types needed** in `src/uninstallers/lib/types.ts` (~30L):

```typescript
// src/uninstallers/lib/types.ts — NEW (~30L)
export interface UninstallOpts {
  apply: boolean    // false = dry-run default (D-05)
  dryRun: boolean
  yes: boolean      // skip interactive prompt (D-06 CI flag)
}
export interface UninstallContext {
  manifest: Manifest
  opts: UninstallOpts
  cwd: string
}
export type UninstallResult =
  | { ok: true; removedPaths: string[] }
  | { ok: false; phase: 'preflight' | 'spawn' | 'verify'; error: string; suggest?: string }
  | { aborted: true; reason: 'user-cancel' | 'ephemeral' | 'dry-run' }
```

### D-02 EphemeralSemantic: no-op + warn

**Detection pattern** [VERIFIED: src/installers/npmCli.ts L26-27 — `detectLevel` uses regex on `install.cmd`]:

```typescript
// src/uninstallers/npmCli.ts — ephemeral detect (~5L of ~30L budget)
function isEphemeral(cmd: string): boolean {
  return /\bnpx\s+(--yes|-y)\b/.test(cmd)
}

// In uninstallNpmCli:
if (isEphemeral(install.cmd)) {
  console.warn(
    `ephemeral install: nothing to uninstall ('${manifest.metadata.name}' uses 'npx --yes' ` +
    `runtime-only invocation; no persistent install to remove)`,
  )
  return { aborted: true, reason: 'ephemeral' }
}
```

**Note:** `npxSkillInstaller` manifests use `npx` + `skills@...` in cmd but they DO write persistent files to `~/.claude/skills/<name>/` — they are NOT ephemeral. Only `npm-cli` method installer needs this check. [VERIFIED: src/installers/npxSkillInstaller.ts L56-208 — real `fs.access` verify proves files written]

### D-03 + D-04 path traversal — see §3

### D-05 DryRunFlag: `--dry-run` default ON

**Sister pattern** [VERIFIED: src/cli/install.ts L56-88]:
- `harnessed install <name>` defaults dry-run; `--apply` executes
- `harnessed uninstall <name>` mirrors: default dry-run preview; `--apply` executes

```typescript
// src/cli/uninstall.ts action() preamble — dry-run default
const isDryRun = !raw.apply || raw.dryRun === true
if (isDryRun) {
  console.log(`[dry-run] would uninstall '${name}' via method '${v.manifest.spec.install.method}'`)
  console.log('  run with --apply to execute')
  process.exit(0)
}
```

### D-06 ConfirmPrompt: `--yes` bypass

**Sister pattern** [VERIFIED: src/cli/install.ts L68-74 H1 gate]:
- uninstall uses `--yes` (not `--non-interactive`) because there is no `--apply`/`--dry-run` ambiguity here
- H1 gate: `--yes` without `--apply` → still dry-run (safe default)

```typescript
// H1 gate for uninstall (simpler than install — only 1 interactive flag)
if (raw.yes && !raw.apply && !raw.dryRun) {
  console.error(
    'error: --yes requires --apply to execute uninstall\n' +
    "  fix:  'harnessed uninstall <name> --yes --apply'",
  )
  process.exit(2)
}
```

Interactive confirm (when `--apply` and NOT `--yes`) uses `@clack/prompts` [VERIFIED: src/installers/npmCli.ts L64 `p.select`]:

```typescript
import * as p from '@clack/prompts'

if (raw.apply && !raw.yes) {
  const confirmed = await p.confirm({
    message: `Uninstall '${name}'? This cannot be undone.`,
    initialValue: false,  // default No per D-06
  })
  if (p.isCancel(confirmed) || !confirmed) {
    process.exit(2)
  }
}
```

### D-07 BackupOption: NO `--keep-backup`

No implementation needed. `harnessed backup` is the independent workflow. [VERIFIED: src/cli/backup.ts exists]

### D-08 ErrorMessageSafety: generic PathTraversalError

See §3 for implementation. Error message does NOT echo user input.

---

## § 2 — R10.3 7 Uninstaller Concrete API Examples

### 2.1 npmCli: `npm uninstall <pkg>` OR ephemeral no-op

```typescript
// src/uninstallers/npmCli.ts (~30L) [VERIFIED: sister src/installers/npmCli.ts]
import { err } from '../installers/lib/err.js'
import { runArgs } from '../installers/lib/runClaudeArgs.js'  // reuse #BF extract

export const uninstallNpmCli: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'npm-cli') return dispatchMismatch(ctx, 'npm-cli')
  if (isEphemeral(install.cmd)) {
    console.warn(`ephemeral install: nothing to uninstall ('${ctx.manifest.metadata.name}' uses npx --yes)`)
    return { aborted: true, reason: 'ephemeral' }
  }
  const pkgName = ctx.manifest.metadata.upstream.source
  // npm uninstall: strip -g for local; add -g for L4 global
  const isGlobal = /\bnpm\s+install\s+-g\b/.test(install.cmd)
  const args = isGlobal
    ? ['npm', 'uninstall', '-g', pkgName]
    : ['npm', 'uninstall', pkgName]
  // spawn npm directly (not via runArgs — runArgs prefixes 'claude')
  // use spawnCmd pattern from lib/spawn.ts sister
  // ... (cross-OS npm call ~5 lines using spawn from node:child_process)
  return { ok: true, removedPaths: [] }
}
```

**Note:** `runClaudeArgs.ts` (`runArgs`) prefixes `claude` — do NOT use for npm. Use a fresh `spawn` call or extract a `runCmd(args)` helper (different from `runArgs`). [VERIFIED: src/installers/lib/runClaudeArgs.ts L26-27 — always prepends `claude`]

### 2.2 mcpStdioAdd + mcpHttpAdd: `claude mcp remove <name>`

Both methods use `claude mcp remove` — identical uninstall operation. [VERIFIED: sister mcpStdioAdd uses `claude mcp add`; mcp remove is the inverse]

```typescript
// src/uninstallers/mcpStdioAdd.ts (~20L) — reuses runArgs (prefixes claude)
import { runArgs } from '../installers/lib/runClaudeArgs.js'

export const uninstallMcpStdioAdd: Uninstaller = async (ctx) => {
  const name = ctx.manifest.metadata.name
  const r = await runArgs(['mcp', 'remove', name, '--scope', 'project'], ctx.cwd)
  if (r.exitCode !== 0) {
    return { ok: false, phase: 'spawn', error: `claude mcp remove exited ${r.exitCode}: ${r.stderr.slice(0, 200)}` }
  }
  return { ok: true, removedPaths: [] }
}
// mcpHttpAdd.ts: identical body — same claude mcp remove command
```

**runArgs cross-OS** [VERIFIED: src/installers/lib/runClaudeArgs.ts L24-27]:
- Win: `spawn('cmd.exe', ['/c', 'claude', 'mcp', 'remove', name, '--scope', 'project'])`
- Unix: `spawn('claude', ['mcp', 'remove', name, '--scope', 'project'], { shell: false })`

### 2.3 ccPluginMarketplace: `claude plugin uninstall <slug>`

```typescript
// src/uninstallers/ccPluginMarketplace.ts (~20L)
export const uninstallCcPluginMarketplace: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  // parse plugin slug from manifest cmd (sister parseCmd in installer)
  const slugMatch = install.cmd.match(/plugin\s+install\s+(\S+)/i)
  const pluginAtMkt = slugMatch?.[1] ?? ctx.manifest.metadata.name
  const r = await runArgs(['plugin', 'uninstall', pluginAtMkt], ctx.cwd)
  if (r.exitCode !== 0) {
    return { ok: false, phase: 'spawn', error: `claude plugin uninstall exited ${r.exitCode}` }
  }
  return { ok: true, removedPaths: [] }
}
```

### 2.4 gitCloneWithSetup: `fs.rm` recursive on target path

**Target path extraction** [VERIFIED: src/installers/gitCloneWithSetup.ts L70-98 `extractCloneTarget()`]:

```typescript
// src/uninstallers/gitCloneWithSetup.ts (~30L)
import { rm } from 'node:fs/promises'
// reuse extractCloneTarget — consider exporting from installers/gitCloneWithSetup.ts
// OR inline the 15-line helper (sister Karpathy YAGNI — single caller)

export const uninstallGitCloneWithSetup: Uninstaller = async (ctx) => {
  const cloneTarget = extractCloneTarget(ctx.manifest.spec.install.cmd)
  if (!cloneTarget) {
    return { ok: false, phase: 'preflight', error: 'cannot determine clone target from manifest cmd' }
  }
  // Cross-OS recursive removal — Node.js fs.rm with recursive+force (Node 14.14+)
  await rm(cloneTarget, { recursive: true, force: true })
  return { ok: true, removedPaths: [cloneTarget] }
}
```

**Cross-OS `fs.rm` pattern** [ASSUMED: Node.js 14.14+ API; project uses Node 22 per Phase 5.1 RESEARCH verified]:

```typescript
// Node.js fs.rm — cross-OS recursive directory removal
// Works on Win32 (NTFS), macOS, Linux without shell invocation
import { rm } from 'node:fs/promises'
await rm(targetPath, { recursive: true, force: true })
// `force: true` — no error if path does not exist (idempotent)
// `recursive: true` — removes directories and all contents
```

**`extractCloneTarget` reuse strategy:** The function is 28L in `gitCloneWithSetup.ts` L70-98. Two options:
1. Export it from the installer (slight installer/uninstaller coupling)
2. Duplicate it in the uninstaller (YAGNI: single caller, ≤30L budget preserved)

Recommend option 2 (duplicate) — keeps each file independent, avoids circular dependency risk, stays within 30L budget. [ASSUMED: budget fits; verify line count during execute]

### 2.5 npxSkillInstaller: `fs.rm` on `~/.claude/skills/<name>`

```typescript
// src/uninstallers/npxSkillInstaller.ts (~20L)
import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const uninstallNpxSkillInstaller: Uninstaller = async (ctx) => {
  const skillName = extractSkillName(ctx.manifest.spec.install.cmd, ctx.manifest.metadata.name)
  const skillDir = join(homedir(), '.claude', 'skills', skillName)
  await rm(skillDir, { recursive: true, force: true })
  // verify removal
  // fs.access would throw — catch means success
  return { ok: true, removedPaths: [skillDir] }
}
```

### 2.6 ccHookAdd: reverse JSON deep-merge from `~/.claude/settings.json`

This is the most complex uninstaller — must find and remove the specific hook entry matching `hook_event + hook_command + hook_matcher` without disturbing other hooks. [VERIFIED: src/installers/ccHookAdd.ts L69-77 shows push pattern; inverse = filter out]

```typescript
// src/uninstallers/ccHookAdd.ts (~30L)
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const uninstallCcHookAdd: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook-add') return dispatchMismatch(ctx)
  const settingsPath = join(homedir(), '.claude', 'settings.json')
  let raw: string
  try { raw = await readFile(settingsPath, 'utf8') } catch {
    // settings.json absent = hook never installed; idempotent success
    return { ok: true, removedPaths: [] }
  }
  const settings = JSON.parse(raw) as { hooks?: Record<string, { matcher?: string; command: string }[]>; [k: string]: unknown }
  const ev = install.hook_event
  const cmd = install.hook_command
  const matcher = install.hook_matcher
  if (!settings.hooks?.[ev]) return { ok: true, removedPaths: [] }  // already gone
  // Filter OUT the specific entry (inverse of ccHookAdd push)
  settings.hooks[ev] = settings.hooks[ev].filter(h => !(h.command === cmd && h.matcher === matcher))
  if (settings.hooks[ev].length === 0) delete settings.hooks[ev]
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`)
  return { ok: true, removedPaths: [settingsPath] }
}
```

**Install schema fields used** [VERIFIED: src/installers/ccHookAdd.ts L70-72 — `install.hook_event`, `install.hook_matcher`, `install.hook_command`]:
- `install.hook_event` — e.g. `"PreToolUse"`
- `install.hook_command` — full command string
- `install.hook_matcher` — optional tool matcher

### 2.7 `src/cli/uninstall.ts` template (~120L)

**Sister:** `src/cli/install.ts` 145L [VERIFIED]

```typescript
// src/cli/uninstall.ts — Phase 5.2 R10.3 NEW (~120L ≤200L Karpathy)
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import * as p from '@clack/prompts'
import { guardPath } from '../manifest/lib/path-guard.js'  // R10.4 NEW
import { runUninstall } from '../uninstallers/index.js'
import { validateManifestFile } from '../manifest/validate.js'

interface RawOpts {
  apply?: boolean
  dryRun?: boolean
  yes?: boolean
}

export function registerUninstall(program: Command): void {
  program
    .command('uninstall <name>')
    .description('Uninstall a tool (dry-run by default — pass --apply to execute)')
    .option('--apply', 'execute the uninstall (default: dry-run preview only)')
    .option('--dry-run', 'force dry-run (overrides --apply if both set)')
    .option('--yes', 'skip interactive confirmation (CI/scripts — requires --apply)')
    .action(async (name: string, raw: RawOpts) => {
      // H1 gate — sister install.ts L68-74 [VERIFIED: src/cli/install.ts L68-74]
      if (raw.yes && !raw.apply && !raw.dryRun) {
        console.error(
          'error: --yes requires --apply to execute\n' +
          "  fix:  'harnessed uninstall <name> --yes --apply'",
        )
        process.exit(2)
      }
      // R10.4 path guard — user-controlled name (D-04 hardening site 2)
      guardPath(name)  // throws PathTraversalError on attack vector
      const { resolveAlias } = await import('../manifest/aliases.js')
      // resolveAlias itself also calls guardPath internally (D-04 site 1)
      const resolvedName = resolveAlias(name) ?? name
      const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
      // ... readFile + validateManifestFile + runUninstall ...
    })
}
```

**Register as 14th subcommand** in `src/cli.ts` [VERIFIED: src/cli.ts L36 currently 13th = `registerAuditLog`]:
```typescript
import { registerUninstall } from './cli/uninstall.js'
registerUninstall(program)  // Phase 5.2 R10.3 — 14th subcommand
```

---

## § 3 — R10.4 Path Traversal: 5 Regex Patterns + Integration Sites

### 3.1 5 Pre-compiled RegExp constants

**Sister pattern** [VERIFIED: src/manifest/security.ts L38-56 — `PATTERNS` array pre-compiled at module load]:

```typescript
// src/manifest/lib/path-guard.ts — Phase 5.2 R10.4 NEW (~25L)
// [VERIFIED: sister src/cli/audit-log.ts REDACT_PATTERNS module-level pre-compile pattern]
// [VERIFIED: D-03 LOCKED 5 vectors CONTEXT.md L66-71]

const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//,          // (1) Unix dot-dot-slash: ../../etc/passwd
  /\.\.\\/,          // (2) Win backslash dot-dot: ..\..\ windows\system32
  /\x00/,            // (3) Null byte injection: legit/path\x00attack
  /%2[eE]%2[eE]/,    // (4) URL-encoded dot-dot: %2e%2e%2fetc
  /%25[2][eE]%25[2][eE]/, // (5) Double-encoded: %252e%252e%252f
]

export class PathTraversalError extends Error {
  constructor() {
    // D-08: generic message — NOT echo attempted path
    super('path traversal attempt detected')
    this.name = 'PathTraversalError'
    Object.setPrototypeOf(this, PathTraversalError.prototype)
  }
}

/** Guard a user-supplied path string against the 5 OWASP A1 traversal vectors.
 *  Throws PathTraversalError on first match. Safe: does not include input in message.
 */
export function guardPath(input: string): void {
  for (const re of PATH_TRAVERSAL_PATTERNS) {
    if (re.test(input)) throw new PathTraversalError()
  }
}
```

**Module-level pre-compile** [VERIFIED: `src/manifest/security.ts` L38-56 PATTERNS array + `src/cli/audit-log.ts` REDACT_PATTERNS module-level]:
- Array declared at top-level — compiled once when module loads
- NOT inside `guardPath()` body (no per-call recompile)
- NOT `new RegExp(string)` at call site (no string construction overhead)

**Pattern notes:**
1. `/\.\.\//` — catches `../../etc/passwd`, `../etc/passwd`
2. `/\.\.\\/` — catches `..\windows\system32`, `..\..\ ` (Win only but harmless on Unix)
3. `/\x00/` — catches null-byte injection `legit/path\x00attack.yaml`
4. `/%2[eE]%2[eE]/` — catches `%2e%2e%2fetc`, `%2E%2E%2Fetc` (case-insensitive dot-dot)
5. `/%25[2][eE]%25[2][eE]/` — catches `%252e%252e%252f` (double URL-encoded; decode→`%2e%2e%2f`→`../../`)

### 3.2 Integration Site 1: `resolveAlias()` in `src/manifest/aliases.ts`

**Current code** [VERIFIED: src/manifest/aliases.ts L36-38]:
```typescript
export function resolveAlias(name: string): string | null {
  return loadAliases()?.aliases?.[name]?.redirect ?? null
}
```

**After R10.4 hardening:**
```typescript
import { guardPath } from './lib/path-guard.js'

export function resolveAlias(name: string): string | null {
  guardPath(name)  // R10.4 — throws PathTraversalError on attack vector
  return loadAliases()?.aliases?.[name]?.redirect ?? null
}
```

**Why here:** `name` comes from CLI user input (`harnessed install <name>` / `harnessed uninstall <name>`). A crafted alias entry `../../etc/passwd` would pass through yaml.parse and become a key lookup — catching it at `resolveAlias()` protects both install and uninstall paths transitively. [VERIFIED: src/cli/install.ts L79-81 calls `resolveAlias(name)`]

### 3.3 Integration Site 2: manifest path resolution in CLI files

**Current code** [VERIFIED: src/cli/install.ts L82]:
```typescript
const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
```

**Pattern:** `resolveAlias()` already calls `guardPath(name)` at site 1, so by the time `resolvedName` is computed, the original name has been screened. However, `resolvedName = resolveAlias(name) ?? name` — if `resolveAlias` returns non-null, the REDIRECT value (from aliases.yaml) is used. The redirect value is NOT screened by `guardPath(name)` (which screens the input name, not the resolved redirect).

**Recommendation:** Screen `resolvedName` after alias resolution in both `install.ts` and `uninstall.ts`:
```typescript
const resolvedName = resolveAlias(name) ?? name
guardPath(resolvedName)  // screen resolved alias redirect too (D-04 defense-in-depth)
```

This is a 1-line addition to `install.ts` L81 + same in `uninstall.ts`. [ASSUMED: alias redirect could itself contain traversal; recommend guarding both; planner can confirm]

### 3.4 PathTraversalError placement

**Recommend:** Co-locate in `src/manifest/lib/path-guard.ts` (NEW extract) — NOT in `src/manifest/security.ts`. Rationale: security.ts is currently shell-escape detection for manifest field validation (AST-based); path-guard.ts is a different security concern (user-input path validation for CLI). Keeping them separate:
- Follows Karpathy isolation principle
- path-guard.ts is importable by both `manifest/aliases.ts` AND `cli/uninstall.ts` without coupling CLI to manifest/security.ts
- `src/manifest/security.ts` already has `checkCmdString` + `checkSecurityViolations` — adding path traversal concerns would push it toward a grab-bag security module

### 3.5 TDD coverage for R10.4

**Sister:** `tests/manifest/aliases-security.test.ts` exists [VERIFIED: ls tests/manifest/] — confirms test infra for manifest security.

**New file:** `tests/manifest/path-guard.test.ts`

| Cell | Input | Expected |
|------|-------|----------|
| 1 | `../../etc/passwd` | throws PathTraversalError |
| 2 | `..\windows\system32` | throws PathTraversalError |
| 3 | `legit/path\x00attack` | throws PathTraversalError |
| 4 | `%2e%2e%2fetc` | throws PathTraversalError |
| 5 | `%252e%252e%252f` | throws PathTraversalError |
| 6 | error.message does NOT contain `../../etc/passwd` | D-08 verify |
| 7 | `manifests/tools/ctx7.yaml` | passes (no throw) |
| 8 | `ctx7` | passes (valid simple name) |

---

## § 4 — W0 Sub-batch #BH validateFlags + #BI dry-run abstract ABSORB Analysis

### #BH H1 gate duplication across 5+ CLI files

**Verified duplicate pattern** [VERIFIED: grep `nonInteractive.*apply.*dryRun` src/cli/]:

| File | Line | Duplicate block |
|------|------|----------------|
| `src/cli/install.ts` | L68-74 | `if (raw.nonInteractive && !raw.apply && !raw.dryRun)` |
| `src/cli/install-base.ts` | L51-56 | identical pattern |
| `src/cli/research.ts` | L37-43 | identical pattern |
| `src/cli/manifest-add.ts` | L39-41 | identical (shorter error msg) |
| `src/cli/execute-task.ts` | L39-43 | identical pattern |
| `src/cli/uninstall.ts` (NEW) | — | would add 6th occurrence (different flag: `--yes` vs `--non-interactive`) |

**Extract to:** `src/cli/lib/validateFlags.ts` NEW (~25L)

```typescript
// src/cli/lib/validateFlags.ts — Phase 5.2 W0 #BH NEW (~25L)
export function validateNonInteractiveFlags(
  nonInteractive: boolean | undefined,
  apply: boolean | undefined,
  dryRun: boolean | undefined,
  cmdName: string,
): void {
  if (nonInteractive && !apply && !dryRun) {
    console.error(
      `error: --non-interactive requires --apply or --dry-run\n` +
      `  fix:  'harnessed ${cmdName} --non-interactive --dry-run' or '--apply'`,
    )
    process.exit(2)
  }
}
```

**Files to update:** 5 existing CLI files (remove 3-5L each) + 1 new uninstall.ts (uses from creation). Net: -15L across 5 files + +25L new file = +10L total. Karpathy: positive (reduces future divergence risk). [ASSUMED: exact line counts; verify during W0 execute]

**Note for `uninstall.ts`:** The H1 gate for uninstall uses `--yes` + `--apply` (not `--non-interactive`). The `validateNonInteractiveFlags` helper may need a second export for the `--yes`/`--apply` variant OR `uninstall.ts` keeps its gate inline (1 occurrence only = YAGNI for a helper). Recommend: keep uninstall gate inline; extract only the `--non-interactive` pattern (5 files). [ASSUMED: planner decision]

### #BI dry-run/abort/result pattern across installer files

**Verified duplicate pattern** [VERIFIED: grep `opts.dryRun.*aborted.*user-cancel` src/installers/]:

| File | Line | Duplicate |
|------|------|-----------|
| `src/installers/npmCli.ts` | L87-88 | `if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }` |
| `src/installers/mcpStdioAdd.ts` | L120 | identical |
| `src/installers/mcpHttpAdd.ts` | L219 | identical |
| `src/installers/ccPluginMarketplace.ts` | L160 | identical |
| `src/installers/gitCloneWithSetup.ts` | L180 | identical |
| `src/installers/npxSkillInstaller.ts` | L143 | identical |
| `src/installers/ccHookAdd.ts` | L89 | identical |

**7-way duplicate** (all 7 installers). For uninstallers, the dry-run gate is at the CLI layer (D-05 default preview), so uninstaller files themselves may not need this pattern — the CLI handles it before dispatch.

**Recommended extract:** `src/installers/lib/runOrPreview.ts` NEW (~30L) OR simply leave as-is (1-liner per file, low maintenance cost). Given Phase 5.2 W0 already absorbs #BH, also absorbing #BI in the same wave is feasible:

```typescript
// Option A: inline helper in each file (current state — 1 line each, fine)
// Option B: src/installers/lib/runOrPreview.ts — wraps dry-run check + confirm + backup + spawn
// Option C: document as acceptable pattern (sister codebase consistency)
```

**Recommendation:** ABSORB #BI as a **documentation comment standardization** only — add `// ADR 0004 contract 1 dry-run gate` comment to each occurrence rather than extracting a 1-line helper. The extract would be called 7 times for a 1-line function — marginal improvement. Contrast with #BH (3-5 line blocks = clearer dedup win). Planner may decide otherwise. [ASSUMED: planner discretion; recommend light-touch for #BI]

---

## § 5 — ADR 0022 Outline + ci.yml A7 iter 0021→0022

### ADR 0022 outline (sister ADR 0021 9-section format)

**File:** `docs/adr/0022-uninstall-command-path-traversal-hardening.md`

**Estimated:** ≤200L (sister ADR 0021 175L)

```
# ADR 0022: Phase 5.2 — R10.3 harnessed uninstall + R10.4 path traversal hardening

## Status
Accepted (phase 5.2 W2 — 2026-05-21)

## Context
R10.3 gap: Phase 5.1 shipped R10.1 audit-log + R10.2 write lock (#BV carry-forward 3rd cycle).
Users can install tools but cannot uninstall — asymmetric CLI.
R10.4 gap: #AH path traversal regex hardening carry-forward from Phase 3.4 — 2 user-controlled
path input sites (resolveAlias + manifest path resolve) lack attack vector screening.

## Decisions
### D-01 DispatchArch — per-method 7 NEW src/uninstallers/*.ts (HIGH deliberate)
### D-02 EphemeralSemantic — no-op + warn exit 0 (HIGH deliberate)
### D-03 AttackVectorScope — 5 vector minimal MVP OWASP A1 (HIGH CSO deliberate)
### D-04 HardeningScope — resolveAlias + manifest path 2 sites (HIGH deliberate)
### D-05 DryRunFlag — --dry-run default ON per ADR 0004 contract 1 (MED batch)
### D-06 ConfirmPrompt — --yes bypass interactive y/N (MED batch)
### D-07 BackupOption — NO --keep-backup; use harnessed backup (LOW batch)
### D-08 ErrorMessageSafety — generic message NOT leak attempted path (LOW CSO batch)

## Consequences
+ R10.3: harnessed uninstall CLI 14th subcommand; 7 per-method inverses
+ R10.4: PathTraversalError + 5 patterns guards 2 user-input sites
- src/manifest/lib/path-guard.ts NEW dep for resolveAlias (minor coupling)

## Cross-references
ADR 0018 (routing audit log producer)
ADR 0019 (STATE COLLAPSE SoT pattern — uninstall reads manifest yaml only, no ledger)
ADR 0020 (HYBRID 2-clock)
ADR 0021 (state lock + audit consumer; sister Phase 5.1)
ADR 0004 (installer strictness — dry-run default contract 1延袭)
```

### ci.yml A7 iter 0021→0022

**Current state** [VERIFIED: .github/workflows/ci.yml L87-112]:
- Step name: `A7 acceptance bar — ADR 0001-0021 main body 守恒`
- Two `for n in` loops, both ending with `0021`
- Pattern confirmed by Phase 5.1 retroactive iter (ADR 0019/0020/0021 added in T2.8)

**Phase 5.2 change** — single extend (NOT retroactive — Phase 5.1 already did retroactive):

```yaml
# Before: for n in 0001 0002 ... 0021; do
# After:  for n in 0001 0002 ... 0021 0022; do
# Step name: ADR 0001-0021 → ADR 0001-0022
```

**Both loop occurrences** (L90 + L101) must be updated — same as Phase 5.1 pattern. Step name at L87.

**Tag required:** `adr-0022-accepted` LOCAL CREATE (user push) + `v0.5.0-alpha.2-uninstall-security` triple tag (sister Phase 5.1 `v0.5.0-alpha.1-audit-lock` cadence).

**Pre-condition:** Phase 5.2 MUST NOT modify main body of ADR 0001-0021. Only add ADR 0022. A7 verifies 0022 after tag creation. [VERIFIED: ci.yml L91-95 missing-tag skip logic — if tag absent, A7 skips silently; must push tag before merge]

---

## § 6 — Risk Matrix

| # | Risk | Severity | Probability | Mitigation |
|---|------|----------|-------------|------------|
| R-1 | `claude mcp remove` exit code semantics on CC CLI v2.x — wrong exit code mapping misleads verify | HIGH | MED | Research: mcpStdioAdd verify already uses grep pipe pattern [VERIFIED]. Uninstall: if `claude mcp remove` exits 0 when entry doesn't exist (idempotent), no problem. If exits 1 on "not found", treat as success (already removed). Add explicit exit-code mapping in uninstaller |
| R-2 | `fs.rm` cross-OS Win behavior — NTFS locked files (e.g. git index) during rm -rf | MED | LOW | Node.js `fs.rm({ force: true })` on Win32: sets `ERROR_ACCESS_DENIED` behavior; in practice `.git` locks are not held unless another process is active. Add `maxRetries: 3` option to `fs.rm` for transient lock |
| R-3 | `extractCloneTarget` duplication in uninstaller diverges from installer's parser over time | MED | LOW | Both files parse same `git clone` cmd shape; add a comment pointing to sister. Actual divergence risk: LOW — manifest cmd shapes are stable (schema-validated). If ever refactored, extract to `src/installers/lib/gitCloneTarget.ts` |
| R-4 | W0 sub-batch #BH scope creep — 5-file touch increases blast radius for Wave 0 | MED | MED | Mitigation: #BH is purely import-addition + call-site replacement; no logic change. Biome preempt required post-edit. Run full test suite after W0. Mark as ABSORB-optional if timeline tight |
| R-5 | PATH_TRAVERSAL_PATTERNS regex (5) introduces per-call overhead vs. single compiled test | LOW | LOW | Patterns are pre-compiled at module load (not per-call). 5 regex tests per call = ~0.1μs. CLI path: called once per `harnessed install/uninstall` invocation. No perf concern |

---

## § 7 — Open Questions for Planner (Wave B)

1. **`extractCloneTarget` sharing strategy**
   - What we know: 28L function in `gitCloneWithSetup.ts`; used in uninstaller for same cmd parsing
   - What's unclear: export from installer = coupling; duplicate = drift risk
   - Recommendation: duplicate in uninstaller + add `// sister src/installers/gitCloneWithSetup.ts extractCloneTarget` comment; refactor to shared lib if 3rd caller appears (YAGNI)

2. **`extractSkillName` sharing** (same issue as above for `npxSkillInstaller` uninstaller)
   - Recommendation: same approach — duplicate + comment

3. **UninstallContext types location**
   - What's unclear: `src/uninstallers/lib/types.ts` NEW vs reuse `src/installers/lib/types.ts` with union
   - Recommendation: NEW `src/uninstallers/lib/types.ts` (~30L) — clean separation; uninstall doesn't need `DiffPlan` / `DiffFile` / `backup` machinery from installers

4. **`--yes` vs `--non-interactive` flag name**
   - D-06 CONTEXT.md says `--yes` for uninstall bypass
   - sister install uses `--non-interactive` 
   - What's unclear: should consistency trump brevity here?
   - Recommendation: use `--yes` (destructive ops conventionally use `--yes`; `rm -rf`-style UX familiarity); document inconsistency in ADR 0022

5. **guardPath placement in `install.ts` vs only in `resolveAlias()`**
   - What we know: `resolveAlias()` screens input `name`; redirect alias value is NOT screened
   - Recommendation: add `guardPath(resolvedName)` after L81 in `install.ts` + matching line in new `uninstall.ts` — 1 extra line per CLI file, defense-in-depth

6. **TDD for 7 uninstallers — mock strategy**
   - What we know: existing tests use vitest + real file system (see `tests/manifest/aliases-security.test.ts`)
   - What's unclear: mock `spawn` for `runArgs` calls (mcp remove / plugin uninstall) vs integration tests
   - Recommendation: unit-test the ephemeral detect + dispatch guard; integration-test the fs.rm operations with temp dirs; mock `runArgs` in tests via `vi.mock('../installers/lib/runClaudeArgs.js', ...)`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-OS recursive directory removal | Custom `rm -rf` shell string via spawn | `fs.rm(path, { recursive: true, force: true })` (Node.js built-in) | Shell quoting edge cases on Win32; Node.js fs.rm is cross-OS, no shell needed |
| Claude CC CLI invocation (mcp remove / plugin uninstall) | Custom spawn wrapper | `runArgs()` from `src/installers/lib/runClaudeArgs.ts` (Phase 5.1 #BF extract) [VERIFIED: codebase] | Already handles Win cmd.exe /c shim + timeout + stderr capture |
| Path traversal detection | Custom string contains check | Pre-compiled `PATH_TRAVERSAL_PATTERNS` RegExp array | Edge cases (null byte, double-encoding, Win backslash); sister `REDACT_PATTERNS` pattern already established |
| Interactive confirm prompt | Custom readline | `@clack/prompts` p.confirm [VERIFIED: src/installers/npmCli.ts L64] | Already installed; consistent UX with install flow |
| H1 gate flag validation | Inline per-file | `src/cli/lib/validateFlags.ts` (#BH W0 extract) | 5+ existing files have identical block; extract eliminates divergence |

---

## Common Pitfalls

### Pitfall 1: `runArgs` used for npm commands
**What goes wrong:** `runArgs(['npm', 'uninstall', 'pkg'])` would execute `claude npm uninstall pkg` (prepends `claude`).
**How to avoid:** `runArgs` is for Claude CC CLI only [VERIFIED: runClaudeArgs.ts L26-27]. For npm/fs operations, use direct `spawn` or `fs.rm`.

### Pitfall 2: ephemeral check applied to all methods
**What goes wrong:** Only `npm-cli` needs ephemeral detection. `npxSkillInstaller` uses `npx` in its cmd but DOES write persistent files — it is NOT ephemeral.
**How to avoid:** Implement ephemeral check only in `src/uninstallers/npmCli.ts`. Other uninstallers proceed to removal unconditionally. [VERIFIED: npxSkillInstaller.ts writes to `~/.claude/skills/`]

### Pitfall 3: dry-run default causes confusing no-op
**What goes wrong:** User runs `harnessed uninstall ctx7` and sees no output / no confirmation that dry-run ran.
**How to avoid:** CLI must print a clear dry-run preview message before exiting 0. Example: `[dry-run] would uninstall 'ctx7' (method: npm-cli); run with --apply to execute`.

### Pitfall 4: guardPath called inside hot loop
**What goes wrong:** `guardPath` called inside a tight loop (e.g. validating all manifests) incurs repeated per-call regex testing.
**How to avoid:** `guardPath` is designed for CLI entry points (called once per invocation). Do NOT use it inside loop-based manifest validators — the module-level compile is still fast, but intent is CLI boundary protection.

### Pitfall 5: PATH_TRAVERSAL_PATTERNS pattern 2 on Unix
**What goes wrong:** `/\.\.\\/` fires on a Unix path that legitimately contains `..\\` (rare but possible in test fixtures).
**How to avoid:** On Unix, backslash in paths is unusual. The guard is designed to be conservative (false-positive is safe = user gets an error they can understand). This is acceptable per D-03 5-vector MVP scope. [ASSUMED: no legitimate Unix paths use `..\\`; confirm if issues arise]

### Pitfall 6: Biome lint on new files
**What goes wrong:** CI fails on import order / formatting violations in new files.
**How to avoid:** Run `pnpm exec biome check --write` before every TS/JS commit. [VERIFIED: project memory `feedback_biome-preempt.md`]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (project standard) [VERIFIED: tests/ directory] |
| Config file | `vitest.config.ts` or `vite.config.ts` |
| Quick run | `pnpm test` |
| Full suite | `pnpm test` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Command | File |
|-----|----------|-----------|---------|------|
| R10.3-ephemeral | `npm-cli` ephemeral detect → no-op + warn exit 0 | unit | `pnpm test tests/cli/uninstall.test.ts` | Wave 0 gap |
| R10.3-dry-run | default dry-run preview no execute | unit | same | Wave 0 gap |
| R10.3-yes-apply | `--yes --apply` skips prompt executes | unit | same | Wave 0 gap |
| R10.3-dispatch | 7 method dispatch to correct uninstaller | unit | same | Wave 0 gap |
| R10.3-ccHook-inverse | ccHookAdd inverse removes only matching entry | unit | `pnpm test tests/uninstallers/ccHookAdd.test.ts` | Wave 0 gap |
| R10.3-fs-rm | gitCloneWithSetup + npxSkill fs.rm removes dir | integration | same + temp dir | Wave 0 gap |
| R10.4-patterns | 5 regex patterns catch 5 attack vectors | unit | `pnpm test tests/manifest/path-guard.test.ts` | Wave 0 gap |
| R10.4-safe-msg | PathTraversalError message does NOT contain input | unit | same | Wave 0 gap |
| R10.4-valid-passthrough | valid path `ctx7` passes guard | unit | same | Wave 0 gap |

### Wave 0 Gaps
- [ ] `tests/cli/uninstall.test.ts` — R10.3 CLI TDD (RED first per CLAUDE.md TDD rule)
- [ ] `tests/uninstallers/ccHookAdd.test.ts` — ccHookAdd inverse merge TDD
- [ ] `tests/manifest/path-guard.test.ts` — R10.4 5 pattern matrix TDD (8 cells)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js `fs.rm` | gitCloneWithSetup + npxSkill uninstallers | ✓ | Node 22 (project standard) | — |
| Claude CC CLI (`claude` binary) | mcp-stdio / mcp-http / cc-plugin uninstallers | ✓ (assumed — install tests pass) | v2.x | Error hint: install claude |
| `@clack/prompts` | interactive confirm in uninstall.ts | ✓ | already in deps [VERIFIED: npmCli.ts imports] | — |
| `proper-lockfile` | (not needed for uninstall) | ✓ | 4.1.2 — Phase 5.1 shipped | — |
| `pnpm` | test + build | ✓ | 10.12.0 [VERIFIED: Phase 5.1 RESEARCH] | — |

**No missing dependencies.** All required runtime deps are already installed.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `claude mcp remove <name> --scope project` is the correct inverse of `claude mcp add --scope project` | § 2.2 | Wrong command → mcp not removed; fix = check CC CLI docs or test against live CC |
| A2 | `claude plugin uninstall <slug>` is the correct CC CLI command (not `plugin remove`) | § 2.3 | Wrong command → plugin not removed; fix = verify `claude plugin --help` |
| A3 | `extractCloneTarget` duplication in uninstaller stays in sync with installer parser | § 2.4 | Parser diverges → wrong target path; fix = export from shared lib |
| A4 | `install.hook_event`, `install.hook_command`, `install.hook_matcher` are accessible on the manifest spec for cc-hook-add method | § 2.6 | Compile error; fix = check manifest schema TypeScript types |
| A5 | `--yes` (not `--non-interactive`) is the right flag name for uninstall CI bypass | § D-06 | UX inconsistency only (no runtime error); fix = rename flag |
| A6 | Alias redirect values from aliases.yaml are not already screened by `resolveAlias()` | § 3.3 | Double-screen (harmless but redundant) |
| A7 | `levelOf()` from installers/index.ts is not needed for uninstall dispatch | § D-01 | If uninstallers need level awareness, add `levelOf` analog; currently LOW risk |

---

## Sources

### Primary (HIGH confidence — VERIFIED from codebase)
- `src/installers/index.ts` — dispatch table pattern, levelOf(), 7 installer method keys [VERIFIED]
- `src/cli/install.ts` — CLI register template, H1 gate L68-74, manifest path L82, resolveAlias call L79-81 [VERIFIED]
- `src/manifest/security.ts` — PATTERNS array module-level pre-compile, `checkCmdString`, `checkSecurityViolations` [VERIFIED]
- `src/manifest/aliases.ts` — `resolveAlias()` signature, `loadAliases()` pattern [VERIFIED]
- `src/installers/lib/runClaudeArgs.ts` — `runArgs` signature + Win/Unix cross-OS pattern [VERIFIED]
- `src/installers/lib/err.ts` — `err()` helper signature [VERIFIED]
- `src/installers/lib/types.ts` — `InstallOpts`, `InstallContext`, `InstallResult`, `Installer`, `DiffPlan` types [VERIFIED]
- `src/installers/npmCli.ts` — ephemeral detection via `detectLevel`, dry-run gate, `@clack/prompts` confirm [VERIFIED]
- `src/installers/ccHookAdd.ts` — deep-merge install pattern (inverse for uninstall) [VERIFIED]
- `src/installers/gitCloneWithSetup.ts` — `extractCloneTarget()` 28L parser [VERIFIED]
- `src/installers/mcpStdioAdd.ts` — `runArgs` usage, cross-OS verify shell pattern [VERIFIED]
- `src/installers/ccPluginMarketplace.ts` — `runArgs` usage, pluginAtMkt parse [VERIFIED]
- `src/installers/npxSkillInstaller.ts` — `extractSkillName`, `~/.claude/skills/` path, NOT ephemeral [VERIFIED]
- `src/cli.ts` — subcommand registration, 13 current subcommands [VERIFIED]
- `.github/workflows/ci.yml` L87-112 — A7 step current state (loops 0001-0021) [VERIFIED]
- `docs/adr/0021-state-lock-and-audit-consumer.md` — 9-section ADR format template [VERIFIED]
- `.planning/phase-5.2/5.2-CONTEXT.md` — 8 D-decisions verbatim [VERIFIED]
- `tests/manifest/` directory — aliases-security.test.ts exists (path-guard test infra pattern) [VERIFIED]
- Grep audit of H1 gate pattern across 5 CLI files [VERIFIED]
- Grep audit of `opts.dryRun` 1-liner pattern across 7 installer files [VERIFIED]

### Secondary (MEDIUM confidence)
- Node.js `fs.rm` API cross-OS behavior — documented in Node.js 14.14+ release notes [CITED: training knowledge; Node 22 project confirmed]
- `@clack/prompts` `p.confirm()` API — [CITED: training knowledge; confirmed via npmCli.ts usage]

### Tertiary (LOW confidence / ASSUMED)
- `claude mcp remove` and `claude plugin uninstall` exact CLI command syntax (A1, A2) — [ASSUMED: inferred from install counterparts; verify against CC CLI `--help`]

---

## Metadata

**Confidence breakdown:**
- R10.3 uninstaller patterns: HIGH — all 7 sister installer files verified; types confirmed; dispatch table pattern confirmed
- R10.4 regex patterns: HIGH — 5 patterns from D-03 CONTEXT.md verbatim; module-level pre-compile verified in security.ts
- #BH/#BI absorb analysis: HIGH — 5-file H1 gate grep verified; 7-file dryRun 1-liner grep verified
- Claude CC CLI commands (mcp remove / plugin uninstall): LOW — inferred from installers; not verified against live CC CLI

**Research date:** 2026-05-19
**Valid until:** 2026-05-26 (7 days — active development; CC CLI command syntax should be verified early in Wave 1)
