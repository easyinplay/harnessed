# Phase 1 Spec — v3.4.4 α CLI wire

> **Scope**: Land the `harnessed run <name>` subcommand that wires the dead `src/workflow/` runtime to slash commands, rewrite the 24 `~/.claude/commands/*.md` + 24 `workflows/<stage>/<sub>/SKILL.md` body templates to a single-path "invoke via Bash" schema, and gate command-file overwrite on a v3.4.4 marker so existing v3.4.3 dual-path generated files upgrade without clobbering true user customizations.
>
> **Out of scope (deferred to later phases)**: replacing `_dispatchSkillStub.fn` (Phase 2), wiring ralph-loop (Phase 3), migrating `research` + `execute-task` to `harnessed run` (Phase 4), real `getNextHint` implementation (Phase 5), deletion of `src/routing/` (Phase 6).

---

## Goal

After Phase 1 ships:

1. `harnessed run <name> [--task <text> | --task-stdin] [--max-iterations <n>] [--model <m>] [--dry-run] [--staged] [--list]` is a real subcommand on `bin/harnessed.js`.
2. The 24 `~/.claude/commands/*.md` files (and their 24 `workflows/<stage>/<sub>/SKILL.md` sources) tell Claude Code: *"Use the Bash tool to run `echo "$ARGUMENTS" | harnessed run <name> --task-stdin`"* — single path, no SlashCommand vapor, no Task-spawn fallback that bypasses the workflow runtime.
3. `harnessed setup` upgrades stale v3.4.3-generated command files in place by detecting the `<!-- harnessed-generated:v3.4.x -->` marker, but leaves any genuinely user-authored command file untouched.
4. Workflow loads + exits cleanly under `--dry-run`. Real spawn still emits `<stub for X>` per `_dispatchSkillStub.fn` — Phase 2 work.

Effort estimate: **3-5h** (sister HANDOFF-v3.4.4.md). Risk: low (additive subcommand + body template rewrite + tests).

---

## Files (file-by-file)

### NEW: `src/cli/run.ts` (~150 LOC)

Sister pattern: `src/cli/research.ts` (96 LOC) + `src/cli/execute-task.ts` (157 LOC) — same commander registration, same exit-code mapping (`0 OK / 1 runtime fail / 2 usage`).

```ts
// src/cli/run.ts — v3.4.4 Phase 1 α CLI wire
//
// Wires src/workflow/run.ts (the 4 master + 24 sub workflow runtime) into a
// real subcommand so `~/.claude/commands/<name>.md` can invoke it via Bash.
// Replaces the v3.4.3 dual-path body (SlashCommand vapor + Task-spawn fallback
// that bypassed disciplines + judgments + master orchestration).
//
// Phase 1 keeps _dispatchSkillStub.fn from src/workflow/run.ts — actual SDK
// spawn lands in Phase 2 (extract src/routing/lib/sdkSpawn.ts → src/workflow/
// lib/sdkSpawn.ts). `--dry-run` here means "validate the yaml + walk the
// workflow runtime + exit 0 without invoking the stub" so users can verify
// wiring before Phase 2 lands.

import { readFile } from 'node:fs/promises'
import { dirname, join, resolve as pathResolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Command } from 'commander'
import { runWorkflow } from '../workflow/run.js'

interface RawOpts {
  task?: string
  taskStdin?: boolean
  maxIterations?: number
  model?: 'haiku' | 'sonnet' | 'opus'
  dryRun?: boolean
  staged?: boolean
  list?: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = pathResolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

export function registerRun(program: Command): void {
  program
    .command('run')
    .description(
      'Run a harnessed workflow (master orchestrator or sub-workflow). Slash commands invoke via this subcommand.',
    )
    .argument('[name]', 'workflow name (e.g. discuss, verify-paranoid, research, auto)')
    .option('--task <text>', 'task description (passed as workflow gateContext.task)')
    .option('--task-stdin', 'read task description from stdin until EOF (avoids shell-escape)')
    .option('--max-iterations <n>', 'ralph-loop max iter (default 20; honored Phase 3+)', (v) =>
      parseInt(v, 10),
    )
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .option('--dry-run', 'validate yaml load + walk runtime without spawning (Phase 1 default for verification)')
    .option('--staged', '/auto super-master: pause between stages for user review')
    .option('--list', 'print all known workflow names and exit')
    .action(async (name: string | undefined, raw: RawOpts) => {
      if (raw.list) {
        const names = await listWorkflowNames(WORKFLOWS_DIR)
        for (const n of names) console.log(n)
        process.exit(0)
      }
      if (!name) {
        console.error('error: workflow name required (or pass --list to enumerate)')
        process.exit(2)
      }

      // Resolve task input — flag > stdin > empty
      let task = ''
      if (typeof raw.task === 'string') {
        task = raw.task
      } else if (raw.taskStdin) {
        task = await readStdinToEnd()
      }

      // Resolve workflow yaml path — 3-tier lookup matches workflows/ layout
      const yamlPath = await resolveWorkflowYaml(name, WORKFLOWS_DIR)
      if (!yamlPath) {
        console.error(
          `error: workflow '${name}' not found under workflows/. Run \`harnessed run --list\` to enumerate.`,
        )
        process.exit(2)
      }

      const gateContext: Record<string, unknown> = {
        task,
        ...(raw.model ? { modelOverride: raw.model } : {}),
        ...(raw.maxIterations ? { maxIterations: raw.maxIterations } : {}),
        ...(raw.staged ? { staged: true } : {}),
      }

      if (raw.dryRun) {
        console.log(JSON.stringify({ workflow: name, yamlPath, gateContext }, null, 2))
        process.exit(0)
      }

      try {
        const result = await runWorkflow(yamlPath, {}, { packageRoot: PACKAGE_ROOT, gateContext })
        // Print stage-complete + Next: hint (Phase 1 stub; Phase 5 real impl)
        const hint = await getNextHint(name)
        process.stderr.write(`[stage ${name} ${result.status}]\n`)
        if (hint) {
          process.stderr.write(`Next stage: harnessed run ${hint}\n(In Claude Code: /${hint})\n`)
        }
        process.exit(result.status === 'failed' ? 1 : 0)
      } catch (err) {
        console.error(`error: workflow runtime failed — ${(err as Error).message}`)
        process.exit(1)
      }
    })
}

/** 3-tier lookup matches workflows/ layout:
 *    1. workflows/<name>/workflow.yaml             (research, retro, auto top-level)
 *    2. workflows/<name>/auto/workflow.yaml        (4 stage-masters: discuss/plan/task/verify)
 *    3. workflows/<stage>/<sub>/workflow.yaml      (24 subs; <name> = '<stage>-<sub>' OR '<sub>')
 *
 * Sub names by convention flatten to `<stage>-<sub>` (e.g. 'verify-paranoid'
 * → workflows/verify/paranoid/workflow.yaml). Split on the FIRST dash to
 * derive (stage, sub). If `<name>` has no dash, only tiers 1 + 2 apply.
 */
async function resolveWorkflowYaml(name: string, workflowsDir: string): Promise<string | null> {
  const { existsSync } = await import('node:fs')
  // Tier 1: top-level standalone
  const tier1 = join(workflowsDir, name, 'workflow.yaml')
  if (existsSync(tier1)) return tier1
  // Tier 2: stage-master auto
  const tier2 = join(workflowsDir, name, 'auto', 'workflow.yaml')
  if (existsSync(tier2)) return tier2
  // Tier 3: split on first dash
  const dashIdx = name.indexOf('-')
  if (dashIdx > 0) {
    const stage = name.slice(0, dashIdx)
    const sub = name.slice(dashIdx + 1)
    const tier3 = join(workflowsDir, stage, sub, 'workflow.yaml')
    if (existsSync(tier3)) return tier3
  }
  return null
}

async function listWorkflowNames(workflowsDir: string): Promise<string[]> {
  const { readdir, stat } = await import('node:fs/promises')
  const names: string[] = []
  const entries = await readdir(workflowsDir)
  for (const e of entries.sort()) {
    const p = join(workflowsDir, e)
    const s = await stat(p).catch(() => null)
    if (!s?.isDirectory()) continue
    // Tier 1: top-level workflow.yaml
    if (await fileExists(join(p, 'workflow.yaml'))) {
      names.push(e)
      continue
    }
    // Tier 2: stage with auto/workflow.yaml → list `<stage>` + subs
    if (await fileExists(join(p, 'auto', 'workflow.yaml'))) {
      names.push(e)
      const subs = await readdir(p).catch(() => [])
      for (const sub of subs.sort()) {
        if (sub === 'auto') continue
        if (await fileExists(join(p, sub, 'workflow.yaml'))) {
          names.push(`${e}-${sub}`)
        }
      }
    }
  }
  return names
}

async function fileExists(path: string): Promise<boolean> {
  const { stat } = await import('node:fs/promises')
  return stat(path)
    .then(() => true)
    .catch(() => false)
}

async function readStdinToEnd(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}

/** Phase 1 stub — Phase 5 reads workflows/auto/workflow.yaml delegates_to[]
 *  and returns the next sub name in order. Returns null when no `auto`
 *  context applies (e.g. sub invoked directly, not via /auto). */
async function getNextHint(_workflowName: string): Promise<string | null> {
  return null
}
```

**Interface contracts**:
- `gateContext.task` — populated, consumed by gate expressions (e.g. `phase.is_complex_architecture` resolves against task description in later phases; Phase 1 just passes it through).
- `gateContext.modelOverride` / `maxIterations` / `staged` — additive keys; `runWorkflow` already shallow-clones gateContext (`src/workflow/run.ts:61`) so no mutation risk.
- Exit codes: `0` success (including paused-veto), `1` runtime exception or `result.status === 'failed'`, `2` usage error (missing name, unknown workflow, invalid arg).

---

### MODIFY: `src/cli.ts` (+3 LOC)

Diff:

```diff
 import { registerResearch } from './cli/research.js'
 import { registerResume } from './cli/resume.js'
 import { registerRollback } from './cli/rollback.js'
+import { registerRun } from './cli/run.js'
 import { registerSetup } from './cli/setup.js'
 ...
 registerSetup(program) // v1.0.1 T1.5 — 15th subcommand (one-time onboarding workflows/*/SKILL.md → ~/.claude/skills/)
+registerRun(program) // v3.4.4 T1 — 16th subcommand (α CLI wire; replaces dead SlashCommand vapor in commands/<x>.md)
```

Place `registerRun` LAST so the subcommand list stays in chronological-add order (sister comment style).

---

### MODIFY: `src/cli/lib/generateCommands.ts` (~80 LOC delta)

Two changes:

**(a) Rewrite the body template** (lines 91-165) to emit the v3.4.4 single-path schema:

```ts
export function generateCommandFile(
  name: string,
  prompt: RolePrompt,
  capabilities: CapabilityMap, // kept for future use; v3.4.4 body doesn't render {{ }}
  installedPlugins: Set<string>,
  installedUserSkills: Set<string>,
): { content: string; warnings: string[] } {
  const isMaster = prompt.is_master === true
  const argHint = isMaster ? '[task description]' : '[requirement text or omit]'
  const stagedNote = name === 'auto'
    ? '\n- For stage-by-stage review, append `--staged` (pauses between stages).'
    : ''

  const body = [
    `# /${name}`,
    ``,
    prompt.description,
    ``,
    `## How to invoke`,
    ``,
    `Use the Bash tool to run:`,
    ``,
    '```bash',
    `echo "$ARGUMENTS" | harnessed run ${name} --task-stdin`,
    '```',
    ``,
    `If \`$ARGUMENTS\` is empty (slash command invoked with no args), run \`harnessed run ${name}\` (no stdin pipe).`,
    ``,
    `After completion, the Bash output prints a \`Next:\` hint suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.`,
    ``,
    `## Notes`,
    ``,
    `- This file is generated by \`harnessed setup\` v3.4.4+. Re-run \`harnessed setup\` after a harnessed upgrade to refresh.`,
    `- The sister \`~/.claude/skills/${name}/SKILL.md\` is the Skill-tool entry point (Claude loads it when triggers match \`trigger_phrases:\`). Both files invoke the same \`harnessed run ${name}\` Bash command.${stagedNote}`,
    `- Workflow runtime: \`src/workflow/run.ts\` walks \`workflows/${nameToYamlHintPath(name)}\` with disciplines + judgments + master orchestration applied per the yaml \`delegates_to[]\` + \`gate\` clauses.`,
    ``,
    `<!-- harnessed-generated:v3.4.4 -->`,
    ``,
  ].join('\n')

  // capabilities + installedPlugins/Skills no longer rendered in v3.4.4 body
  // (the placeholder is dead — no `{{ capabilities.<x>.cmd }}` in new schema).
  // Returned warnings stays empty for forward compat; signature unchanged.
  const warnings: string[] = []

  const frontmatter = [
    '---',
    `description: ${JSON.stringify(prompt.description)}`,
    `argument-hint: ${JSON.stringify(argHint)}`,
    '---',
    '',
  ].join('\n')

  return { content: frontmatter + body, warnings }
}

/** Helper for the Notes section — returns the relative workflows/ path
 *  matching the 3-tier resolveWorkflowYaml lookup in src/cli/run.ts. */
function nameToYamlHintPath(name: string): string {
  if (['auto', 'research', 'retro'].includes(name)) return `${name}/workflow.yaml`
  if (['discuss', 'plan', 'task', 'verify'].includes(name)) return `${name}/auto/workflow.yaml`
  const dashIdx = name.indexOf('-')
  if (dashIdx > 0) {
    return `${name.slice(0, dashIdx)}/${name.slice(dashIdx + 1)}/workflow.yaml`
  }
  return `${name}/workflow.yaml`
}
```

**(b) Replace `writeAllCommands`** (lines 172-229) — marker-based overwrite (option 2 from the requirements):

```ts
/** v3.4.4 marker — every command file generated by this tool emits this trailing
 *  comment as the last non-blank body line. `harnessed setup` overwrites any file
 *  containing this marker (or the older v3.4.3 dual-path signature) and preserves
 *  files with neither (true user-authored). */
const HARNESSED_MARKER_RX = /<!--\s*harnessed-generated:v3\.4\.\d+\s*-->/
/** Detect the v3.4.3 dual-path body shape — overwrite even though it has no
 *  marker because it shipped before markers existed. Two-signal AND so we don't
 *  false-positive on user files that happen to mention SlashCommand. */
const V3_4_3_SIGNATURE_RX =
  /\*\*Preferred path\*\*[\s\S]*use the SlashCommand tool[\s\S]*\*\*Fallback path\*\*[\s\S]*use the Task tool to spawn/

function shouldOverwriteFile(content: string): boolean {
  return HARNESSED_MARKER_RX.test(content) || V3_4_3_SIGNATURE_RX.test(content)
}

export async function writeAllCommands(
  slashNames: string[],
  commandsDir: string,
  rolePrompts: Record<string, RolePrompt>,
  capabilities: CapabilityMap,
  installedPlugins: Set<string>,
  installedUserSkills: Set<string>,
  writer: (path: string, content: string) => Promise<void>,
  fileExists: (path: string) => boolean = existsSync,
  readFileSync: (path: string) => string = (p) =>
    // dynamic require keeps the existing 8-arg signature backwards-compatible
    // for callers that don't inject (sister Pattern J DI).
    require('node:fs').readFileSync(p, 'utf8'),
): Promise<{ results: CommandWriteResult[]; warnings: string[] }> {
  const results: CommandWriteResult[] = []
  const aggregatedWarnings = new Set<string>()

  for (const name of slashNames) {
    const path = join(commandsDir, `${name}.md`)
    const prompt = rolePrompts[name]
    if (!prompt) {
      results.push({
        name,
        path,
        written: false,
        warning: `no role-prompts.yaml entry for '${name}' — skipping commands/${name}.md generation`,
      })
      aggregatedWarnings.add(`role-prompts.yaml missing entry for '${name}'`)
      continue
    }

    // v3.4.4 — marker-based overwrite. Skip ONLY when file exists AND is user-authored
    // (i.e. neither harnessed marker nor v3.4.3 dual-path signature present).
    if (fileExists(path)) {
      let existing = ''
      try {
        existing = readFileSync(path)
      } catch {
        existing = ''
      }
      if (!shouldOverwriteFile(existing)) {
        results.push({
          name,
          path,
          written: false,
          warning: `commands/${name}.md is user-authored (no harnessed marker) — leaving unchanged. Delete the file to force regenerate.`,
        })
        continue
      }
      // Else: file is harnessed-generated (v3.4.3 or older v3.4.4) → overwrite
    }

    const { content, warnings } = generateCommandFile(
      name,
      prompt,
      capabilities,
      installedPlugins,
      installedUserSkills,
    )
    try {
      await writer(path, content)
      results.push({ name, path, written: true })
    } catch (e) {
      results.push({
        name,
        path,
        written: false,
        warning: `write failed for commands/${name}.md: ${(e as Error).message}`,
      })
    }
    for (const w of warnings) aggregatedWarnings.add(w)
  }
  return { results, warnings: [...aggregatedWarnings] }
}
```

**Backward-compat note**: the 9-arg signature stays compatible because `readFileSync` has a default value. Callers in `src/cli/setup.ts` continue to pass 8 args unchanged.

---

### MODIFY: `scripts/rewrite-skill-invoke-sections.mjs` (~60 LOC delta)

Same body schema as `generateCommands.ts`, idempotent via new marker. Detect old `V3_4_3_MARKER` AND new `V3_4_4_MARKER`; only skip if `V3_4_4_MARKER` present.

Diff:

```diff
-const V3_4_3_MARKER = '<!-- v3.4.3-dual-path-invocation -->'
+const V3_4_3_MARKER = '<!-- v3.4.3-dual-path-invocation -->'
+const V3_4_4_MARKER = '<!-- harnessed-generated:v3.4.4 -->'

 function buildSection(name, prompt) {
-  const isMaster = prompt.is_master === true
-  const primaryRef = prompt.primary_cap ? `\`{{ capabilities.${prompt.primary_cap}.cmd }}\`` : ''
-  const preferred = primaryRef ? ... : ...
-  const fallback = isMaster ? ... : [...].join('\n')
-  return [V3_4_3_MARKER, '## How to invoke', '', preferred, '', fallback, '', `(Sister …)`, ''].join('\n')
+  // v3.4.4 single-path schema — sister generateCommands.ts L91-165.
+  const stagedNote = name === 'auto'
+    ? '\n- For stage-by-stage review, append `--staged` (pauses between stages).'
+    : ''
+  return [
+    '## How to invoke',
+    '',
+    'Use the Bash tool to run:',
+    '',
+    '```bash',
+    `echo "$ARGUMENTS" | harnessed run ${name} --task-stdin`,
+    '```',
+    '',
+    `If \`$ARGUMENTS\` is empty, run \`harnessed run ${name}\` (no stdin pipe).`,
+    '',
+    'After completion, the Bash output prints a `Next:` hint suggesting the next stage. Decide whether to invoke based on conversation context.',
+    `${stagedNote}`,
+    '',
+    V3_4_4_MARKER,
+    '',
+  ].join('\n')
 }

 async function rewriteOne({ flatName, skillPath, isMaster }, prompts) {
   let body = await readFile(skillPath, 'utf8')
-  if (body.includes(V3_4_3_MARKER)) {
-    return { name: flatName, action: 'skipped-already-v3.4.3' }
+  if (body.includes(V3_4_4_MARKER)) {
+    return { name: flatName, action: 'skipped-already-v3.4.4' }
   }
   const prompt = prompts[flatName]
   if (!prompt) return { name: flatName, action: 'no-role-prompt-entry' }
   let changed = false

-  if (CLI_INVOCATION_RX.test(body)) { body = body.replace(CLI_INVOCATION_RX, ''); changed = true }
-  ... existing strip blocks unchanged ...
+  if (CLI_INVOCATION_RX.test(body)) { body = body.replace(CLI_INVOCATION_RX, ''); changed = true }
+  ... existing strip blocks unchanged ...
+
+  // v3.4.4 — also strip the v3.4.3 marker if present so the body is clean
+  // before re-inserting the new section.
+  if (body.includes(V3_4_3_MARKER)) {
+    body = body.replace(V3_4_3_MARKER, '')
+    changed = true
+  }

   const newSection = buildSection(flatName, prompt)
   if (HOW_TO_INVOKE_RX.test(body)) { body = body.replace(HOW_TO_INVOKE_RX, newSection.trimEnd() + '\n'); changed = true }
   else { ... existing Pattern B insert unchanged ... }
   body = body.replace(/\n{3,}/g, '\n\n')
   if (!changed) return { name: flatName, action: 'no-change' }
   await writeFile(skillPath, body, 'utf8')
   return { name: flatName, action: 'rewritten' }
 }
```

After the script change, run `node scripts/rewrite-skill-invoke-sections.mjs` once to regenerate all 24 `workflows/*/SKILL.md` source files. Commit the regenerated `.md` files alongside the script change (Commit 3 below).

---

### MODIFY: `README.md` — Operational Commands + Flags table (2 row additions)

Locate the table around L370-396 (Operational Commands + Flags sections per HANDOFF). Insertions:

**Operational Commands table — add row** (after `setup` row):

```diff
 | `harnessed setup`             | One-time onboarding — copies 24 sub-workflow SKILL.md + writes 24 commands/*.md |
+| `harnessed run <name>`        | Run a workflow (master orchestrator or sub). Slash commands invoke via this subcommand. |
```

**Flags table — add 2 rows** (under the `run` subcommand-specific flag block or appended to the global flags section):

```diff
+| `--task <text>`               | `run` — task description (passed as workflow `gateContext.task`)               |
+| `--task-stdin`                | `run` — read task description from stdin until EOF (avoids shell-escape on quotes/$/`)|
```

**Out of Phase 1 README scope** (deferred):
- Quick Start post-stage hint walkthrough → Phase 5
- Removing routing-engine reference (if present) → Phase 6

---

### MODIFY: 9 translation READMEs — verbatim-translated same 2 rows

Files (path-list per HANDOFF):
- `README-cn.md` (Simplified Chinese)
- `README-tw.md` (Traditional Chinese)
- `README-ja.md` (Japanese)
- `README-ko.md` (Korean)
- `README-pt-BR.md` (Brazilian Portuguese)
- `README-tr.md` (Turkish)
- `README-ru.md` (Russian)
- `README-vi.md` (Vietnamese)
- `README-th.md` (Thai)

Pattern for each: locate the equivalent Operational Commands + Flags table (each translation mirrors English structure) and add the same 2 rows with the translated description text. Keep the column-1 command/flag string **verbatim English** (e.g. `harnessed run <name>` / `--task <text>` / `--task-stdin` per CLAUDE.md "强制保留英文原文" rule). Only column-2 (description) translates.

Reference Chinese row (sister `README-cn.md` style):

```diff
+| `harnessed run <name>`        | 运行某个 workflow (master orchestrator 或 sub)。slash command 通过此子命令调用。 |
+...
+| `--task <text>`               | `run` 子命令 — 任务描述 (传入 workflow `gateContext.task`) |
+| `--task-stdin`                | `run` 子命令 — 从 stdin 读任务描述直到 EOF (避免 shell 转义引号/$/`) |
```

---

### NEW: `tests/cli/run.test.ts` (~150 LOC)

Sister pattern: `tests/cli/execute-task.test.ts` (Pattern J mock + `runCli` helper). Test cells:

| # | Cell | Assertion |
|---|------|-----------|
| 1 | Registers `run` subcommand on Command instance | `program.commands.map(c => c.name())` includes `'run'` |
| 2 | `--list` exits 0 + prints workflow names (one per line) | stdout includes `auto`, `discuss`, `verify-paranoid`; exit 0 |
| 3 | Missing `name` (no --list) → exit 2 + usage error on stderr | exit 2; stderr matches `/workflow name required/` |
| 4 | Unknown name → exit 2 + "not found" stderr | `harnessed run nope` → exit 2; stderr matches `/not found/` |
| 5 | Name resolution tier 1 (top-level standalone) → resolves `workflows/research/workflow.yaml` | mock `runWorkflow`, assert it received that yamlPath |
| 6 | Name resolution tier 2 (stage-master) → resolves `workflows/discuss/auto/workflow.yaml` | same assert pattern for `discuss` |
| 7 | Name resolution tier 3 (sub) → resolves `workflows/verify/paranoid/workflow.yaml` | same assert pattern for `verify-paranoid` |
| 8 | `--task "hello"` → `gateContext.task === 'hello'` | mock runWorkflow, capture opts arg |
| 9 | `--task-stdin` reads stdin → `gateContext.task === '<piped text>'` | mock `process.stdin` async-iter to yield 'piped'; capture |
| 10 | Neither `--task` nor `--task-stdin` → `gateContext.task === ''` | default empty string |
| 11 | `--dry-run` exits 0 + prints JSON envelope + does NOT call `runWorkflow` | spy not called; stdout has `workflow`, `yamlPath`, `gateContext` keys |
| 12 | `--max-iterations 5 --model haiku --staged` → gateContext carries `{ maxIterations: 5, modelOverride: 'haiku', staged: true }` | capture opts arg |
| 13 | `runWorkflow` returns `{ status: 'failed' }` → exit 1 | mock returns failed; assert exit code |
| 14 | `runWorkflow` returns `{ status: 'complete' }` → exit 0 + stderr has `[stage <name> complete]` | mock returns complete; assert stderr line |
| 15 | `runWorkflow` throws → exit 1 + stderr has `runtime failed` | mock throws Error('boom'); assert stderr |

Mocking shape:

```ts
vi.mock('../../src/workflow/run.js', () => ({
  runWorkflow: vi.fn(async () => ({ status: 'complete', phasesRun: 0 })),
}))
import { registerRun } from '../../src/cli/run.js'
import { runWorkflow } from '../../src/workflow/run.js'
```

Reuse the `runCli` helper + `ExitError` pattern from `tests/cli/execute-task.test.ts` L45-90.

---

### NEW: `tests/integration/cli-run-e2e.test.ts` (~80 LOC)

E2E spawn of the built CLI (sister pattern: `tests/integration/phase-2.3-e2e.test.ts` if present). Skip on CI if the build step hasn't run.

Scenarios:

1. **Dry-run loads yaml**: `node bin/harnessed.js run verify-simplify --dry-run` exits 0; stdout parsable JSON with `workflow: 'verify-simplify'` and `yamlPath` ending in `workflows/verify/simplify/workflow.yaml`.
2. **List enumeration**: `node bin/harnessed.js run --list` exits 0; stdout contains `auto`, `discuss`, `discuss-strategic`, `verify-paranoid`, `verify-simplify`, `research`, `retro` (≥24 lines).
3. **Stdin pipe**: spawn child process `echo "test requirement" | node bin/harnessed.js run verify-simplify --task-stdin --dry-run`; stdout JSON `gateContext.task === 'test requirement'`. (Skip on Windows if shell pipe semantics differ — see Open verifications below.)
4. **Live runtime walks workflow**: `node bin/harnessed.js run verify-simplify` (no --dry-run, no Phase 2 spawn yet — stub returns `<stub for X>`); exit 0; stderr contains `[stage verify-simplify complete]`. Asserts the wire reaches the runtime + the stub returns ok.

Use `execaNode` or `child_process.spawnSync` (whichever the repo already uses for integration tests).

---

### MODIFY: `tests/unit/generate-commands.test.ts` (~50 LOC delta)

Update snapshots + add marker tests. The 12 existing cells stay; **update the body assertions** to match new schema.

Add new cells:

| # | Cell | Assertion |
|---|------|-----------|
| 13 | New body contains `harnessed run <name> --task-stdin` Bash invocation | generated content `.includes('harnessed run verify-paranoid --task-stdin')` |
| 14 | New body contains v3.4.4 marker as trailing comment | generated content `.includes('<!-- harnessed-generated:v3.4.4 -->')` |
| 15 | New body does NOT contain SlashCommand vapor | `.not.toContain('SlashCommand tool to run')` |
| 16 | New body does NOT contain Task-spawn fallback | `.not.toContain('Task tool to spawn')` |
| 17 | `writeAllCommands` overwrites file with v3.4.4 marker | seed `tmpRoot/commands/x.md` with marker + new mock content; assert written=true |
| 18 | `writeAllCommands` overwrites file matching v3.4.3 dual-path signature | seed with verbatim L8-41 from current `verify-paranoid.md`; assert written=true |
| 19 | `writeAllCommands` preserves user-authored file (no marker, no signature) | seed with `# my custom command\nhello`; assert written=false + warning matches `/user-authored/` |
| 20 | `argument-hint` frontmatter present for sub (`[requirement text or omit]`) and for master (`[task description]`) | parse frontmatter; check field |

---

### NO CHANGE NEEDED

- `package.json` — `commander ^13.0.0` already present (verified `grep`).
- `bin/harnessed.js` — already wired to `src/cli.ts` (existing entry; new subcommand registers via `registerRun`).
- `src/workflow/run.ts` — `runWorkflow` signature accepts opts already (`{ packageRoot, gateContext }`); no change.

---

## Backwards compat decision

**Selected: Option 2 — marker-based overwrite** (per HANDOFF recommendation).

### Marker format

Inserted as the last non-blank line of the body (before trailing newline):

```
<!-- harnessed-generated:v3.4.4 -->
```

Pattern future-proofs the version: `\<!--\s*harnessed-generated:v3\.4\.\d+\s*-->` matches any v3.4.x marker so subsequent patches that bump the body schema can re-overwrite without losing the property.

### v3.4.3 detection (grep signature)

The v3.4.3 dual-path body has no marker, but its shape is highly distinctive. Use a two-signal AND-regex to avoid false positives on user files that happen to mention "SlashCommand":

```regex
/\*\*Preferred path\*\*[\s\S]*use the SlashCommand tool[\s\S]*\*\*Fallback path\*\*[\s\S]*use the Task tool to spawn/
```

Both phrases must appear, in order, with the bold-Preferred-path / bold-Fallback-path scaffolding. Sample matched against current `~/.claude/commands/verify-paranoid.md` L10-12:

```
**Preferred path** (when the upstream specialist is installed): use the SlashCommand tool to run `/review` — the upstream specialist takes over.
**Fallback path** (when the upstream isn't installed or returns no result): use the Task tool to spawn a general-purpose subagent with this prompt:
```

### Overwrite decision matrix

| File state | Action | Log |
|------------|--------|-----|
| File absent | Write fresh | `wrote commands/<x>.md` |
| Has v3.4.4 marker | Overwrite (re-render in case role-prompts.yaml changed) | `regenerated commands/<x>.md (v3.4.4)` |
| Matches v3.4.3 dual-path signature | Overwrite (upgrade) | `upgraded commands/<x>.md from v3.4.3 → v3.4.4` |
| Neither marker nor signature → user-authored | **Skip**, warn | `commands/<x>.md is user-authored — leaving unchanged. Delete the file to force regenerate.` |

User escape hatch: if a user wants to fully re-customize, they delete the file and rerun `harnessed setup` (or pin their copy without the marker and harnessed leaves it alone).

---

## Test plan (commands to run)

Execute in this order before each commit:

```bash
# Lint + format (CLAUDE.md project memory: 3 CI-red recurrences if skipped)
pnpm exec biome check --write

# Unit + integration tests (all green; ~15 new cells across run.test.ts +
# generate-commands.test.ts + cli-run-e2e.test.ts)
pnpm test

# Manual verification — dev machine
node bin/harnessed.js run --list                                       # ≥24 names
node bin/harnessed.js run verify-simplify --dry-run                    # exits 0, JSON to stdout
node bin/harnessed.js run discuss --dry-run                            # tier-2 resolution
echo "test requirement" | node bin/harnessed.js run verify-simplify --task-stdin --dry-run
# ↑ verifies stdin path on Git Bash MSYS2; gateContext.task === 'test requirement'

# Manual verify generated commands files
harnessed setup                                                        # re-run; warns nothing
cat ~/.claude/commands/verify-paranoid.md                              # new schema; marker present
grep -c "harnessed run verify-paranoid --task-stdin" ~/.claude/commands/verify-paranoid.md  # → 1
grep -c "SlashCommand tool" ~/.claude/commands/verify-paranoid.md      # → 0

# Sanity-check user-authored preservation
echo "# my custom" > ~/.claude/commands/test-custom.md
harnessed setup                                                        # warn-skip, no overwrite
cat ~/.claude/commands/test-custom.md                                  # unchanged
rm ~/.claude/commands/test-custom.md                                   # cleanup

# Sanity-check live workflow runtime walks (Phase 1 — still hits stub)
node bin/harnessed.js run verify-simplify                              # exits 0; stderr has [stage verify-simplify complete]
```

---

## Atomic commit plan (recommended split)

Per CLAUDE.md "小步原子修改". 5 commits, each independently revertable:

| # | Files | Commit message (style: sister recent commits) |
|---|-------|------------------------------------------------|
| 1 | `src/cli/run.ts` (new) + `src/cli.ts` (register) + `tests/cli/run.test.ts` (new) | `feat(cli): v3.4.4 add \`harnessed run <name>\` subcommand wiring src/workflow runtime to slash commands` |
| 2 | `src/cli/lib/generateCommands.ts` (body template + marker overwrite) + `tests/unit/generate-commands.test.ts` (snapshot + marker tests) | `feat(setup): v3.4.4 commands/<x>.md single-path body + marker-based upgrade overwrite` |
| 3 | `scripts/rewrite-skill-invoke-sections.mjs` + 24 regenerated `workflows/*/SKILL.md` files | `feat(workflows): v3.4.4 regenerate 24 SKILL.md to single-path harnessed run schema` |
| 4 | `README.md` + 9 translation READMEs | `docs(readme): v3.4.4 add \`harnessed run\` to commands + flags tables (10 languages)` |
| 5 | `tests/integration/cli-run-e2e.test.ts` (new) | `test(integration): v3.4.4 E2E spawn of \`harnessed run\` (dry-run / list / stdin / live)` |

After all 5 commits: `pnpm test && pnpm exec biome check && git log --oneline -5` should show all 5 green.

---

## Open verifications before implement

These were flagged during the read-only audit and need a 1-line manual check before Phase 1 implementation starts:

1. **Windows Git Bash MSYS2 stdin pipe semantics** (Phase 1 hard dep):

   ```bash
   echo "test requirement" | node bin/harnessed.js run verify-simplify --task-stdin --dry-run
   # Expected: stdout JSON with gateContext.task === "test requirement"
   ```

   If MSYS2 chokes (encoding mismatch / pipe buffering / line-ending differences), fallback design: drop `--task-stdin` and require `--task` only. Document as known platform constraint.

2. **`src/routing-engine/` directory existence** (HANDOFF said "audit unsure"):
   - **Confirmed during this audit**: `ls /d/GitCode/harnessed/src/routing-engine/` returns only `.gitkeep` (0-byte file). The directory exists but is empty. Phase 6 deletion target is just the directory itself (plus `.gitkeep`) — no real code to remove. Confirmed against `find /d/GitCode/harnessed/src/routing-engine -type f` (only `.gitkeep`).

3. **`commander` stdin reading capability** (Phase 1 hard dep):
   - **Confirmed during this audit**: `commander ^13.0.0` (per `package.json`). Stdin reading is done via Node's `process.stdin` async-iterable (not a commander feature). No extra dep needed; `for await (const chunk of process.stdin)` is supported since Node 12. Project requires Node 22 (CLAUDE.md stack line), so unconditionally safe.

4. **`tests/scripts/rewrite-skill-invoke-sections.test.ts` existence** (HANDOFF said "if exists"):
   - **Confirmed during this audit**: `tests/scripts/` exists with 4 test files (`check-state-archive-stale.test.ts`, `check-workflow-schema.test.ts`, `dashboard-multi-project.test.ts`, `dashboard-sse.test.ts`). **No** `rewrite-skill-invoke-sections.test.ts`. Phase 1 does not need to create one (the script is idempotent + the regenerated `.md` files diff in Commit 3 is the verification); a future hardening phase could add it but it's not blocking.

5. **`tests/integration/` directory** — confirmed exists with 17 existing tests including `phase-2.3-e2e.test.ts` / `phase-2.4-e2e.test.ts` patterns to mirror. No new infra needed.

---

## NOT in Phase 1 (deferred to later phases — flagged so reviewer doesn't expect them)

| Phase | Deferred work |
|-------|---------------|
| 2 | Replace `_dispatchSkillStub.fn` in `src/workflow/run.ts:34` with shared `src/workflow/lib/sdkSpawn.ts` (extract from `src/routing/lib/sdkSpawn.ts` 91 LOC). Until then, `harnessed run <x>` (non-dry-run) returns `<stub for X>` from each phase. |
| 3 | Wire ralph-loop wrapper into the workflow runtime (extract `src/routing/lib/ralphLoop.ts` 54 LOC → `src/workflow/lib/ralphLoop.ts`). |
| 4 | Migrate `research` + `execute-task` subcommands to use new `harnessed run`. Path A for execute-task: write new v3 `workflows/execute-task/workflow.yaml`; subcommands kept as thin aliases forwarding to `harnessed run`. |
| 5 | Real `getNextHint` implementation in `src/cli/run.ts` — read `workflows/auto/workflow.yaml` `delegates_to[]`, find next sub by `order`, print to stderr. Phase 1 has the stub returning `null` so the wiring is in place. |
| 6 | Delete `src/routing/` (1,389 LOC) + `src/routing-engine/.gitkeep` + `tests/routing/` + `tests/integration/routing-*`. |

---

## Spec-as-contract checklist (for downstream gsd-executor)

A fresh agent reading this spec should be able to implement Phase 1 without reasking architectural questions. Pre-implementation sanity:

- [ ] All file paths above are absolute or repo-rooted (no ambiguity).
- [ ] Interface signatures provided for new public exports (`registerRun`, `resolveWorkflowYaml`, `listWorkflowNames`, `getNextHint`, `shouldOverwriteFile`).
- [ ] All test cells enumerated with explicit assertions (15 + 8 + 4 = 27 cells across 3 test files).
- [ ] Marker format + grep signature + decision matrix locked.
- [ ] Commit split is independently revertable + each green-on-CI.
- [ ] Manual-verify commands provided for the 3 risk areas (stdin / overwrite / runtime walk).

---

*Phase 1 Spec — harnessed v3.4.4*
*Authored: 2026-05-24*
*Status: draft — pending user review + gsd-executor handoff*
