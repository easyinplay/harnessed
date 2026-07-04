// v1.0.3 T1.1 — Step B serial → parallel Promise.allSettled (~75% speedup; 16 manifests 30-50s → 5-10s).
// v1.0.2 T1.3+T1.4 — cli subcommand `setup` full one-shot onboarding (UX redesign post-v1.0.1).
// Phase v2.0-2.6 W0 close cleanup — Karpathy ≤200L split: helpers moved to ./lib/setup-helpers.ts (CK deferred).
//
// IMPL NOTE (immediate-install default + --dry-run opt-in, non-expert UX):
// `harnessed setup` executes immediately by default (non-expert UX; v1.0.2 user feedback).
// `--dry-run` flag opt-in for advanced preview. Sister install.ts pattern REVERSED.
// Step A: copies each workflows/<name>/ dir with SKILL.md to ~/.claude/skills/<name>/.
// Step B: chains install-base auto-glob (installs all manifests/{tools,skill-packs}/*.yaml).
// Workflows without SKILL.md are skipped in Step A.
//
// Exit codes:
//   0 → at least 1 workflow installed + base manifests processed
//   1 → fs.cp failed
//   2 → no SKILL.md workflows found (nothing to install)

import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { getLocale, t } from '../i18n/index.js'
import { detectPlatform, getCommandsDir, getSkillsDir } from '../installers/lib/platform.js'
import { readInstalledPlugins, readInstalledUserSkills } from './lib/capabilityResolver.js'
import { enableAgentTeamsInSettings } from './lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from './lib/enableUserLangInSettings.js'
import { loadRolePrompts, writeAllCommands } from './lib/generateCommands.js'
import { getPackageRoot } from './lib/packagePath.js'
import { loadCapabilities, renderAllSkills } from './lib/renderSkillTemplates.js'
import {
  makeIdempotentProbe,
  reclassifyForceUpdateFailures,
  runStepBInstall,
  type StepBResult,
  scanWorkflowsWithSkill,
  warnIfAgentTeamsMissing,
} from './lib/setup-helpers.js'
import { printSetupVersionBanner } from './lib/version-banner.js'

interface RawOpts {
  dryRun?: boolean
  userLang?: string
  platform?: string // Phase C / D5 — target harness platform (claude | codex)
  nonInteractive?: boolean
  autoInstall?: boolean // v3.9.0 P4 — commander `--no-auto-install` flag flips this to false
  updateInstalled?: boolean // v3.9.6 — force re-install for already-installed plugins (excludes MCP)
}

/** Known platform ids accepted by `setup --platform <id>`. */
const KNOWN_PLATFORMS = ['claude', 'codex'] as const

/**
 * Phase C / D5: apply `setup --platform <id>`. Validates the id, sets
 * `process.env.HARNESSED_PLATFORM` for the run (so the resolver-backed
 * getSkillsDir/getCommandsDir/getHarnessedRoot route to the chosen platform),
 * and persists a `.platform` pin at the now-resolved stateRoot. Invalid id →
 * error + exit(1). Pin-write failure is non-blocking (warn) — env is already set
 * so the run still routes correctly.
 */
async function applyPlatformOption(platform: string): Promise<void> {
  if (!(KNOWN_PLATFORMS as readonly string[]).includes(platform)) {
    console.error(
      `--platform: unknown id '${platform}' (expected one of: ${KNOWN_PLATFORMS.join(' | ')})`,
    )
    process.exit(1)
  }
  process.env.HARNESSED_PLATFORM = platform
  // detectPlatform now resolves to the chosen platform → its stateRoot is the
  // pin's home (codex pin lives in ~/.codex/harnessed, claude in ~/.claude/harnessed).
  const stateRoot = detectPlatform().stateRoot
  try {
    await mkdir(stateRoot, { recursive: true })
    await writeFile(join(stateRoot, '.platform'), platform, 'utf8')
  } catch (e) {
    console.warn(`  [--platform] could not persist .platform pin (${(e as Error).message})`)
  }
}

async function listBaseManifests(pkgRoot: string): Promise<string[]> {
  const out: string[] = []
  for (const d of ['manifests/tools', 'manifests/skill-packs']) {
    try {
      const entries = await readdir(resolve(pkgRoot, d))
      for (const f of entries.sort()) if (f.endsWith('.yaml')) out.push(resolve(pkgRoot, d, f))
    } catch {}
  }
  return out
}

/** v3.9.21 — grouped output by component_type. Order: MCP servers →
 *  Commands & Skills → CLI Tools → Other. Within each group, status order
 *  is: failed → installed → skipped → already-installed (highlight changes).
 *  v4.13.0 — table rendering: glyph + status | component | note columns, name
 *  column width computed per group, notes truncated (user UX feedback:
 *  "检查结果类的能否用表格或者列表输出"). Exported for direct unit testing. */
export function printGrouped(b: StepBResult, prefix = ''): void {
  const GROUP_LABELS: Record<string, string> = {
    'mcp-tool': 'MCP servers',
    command: 'Commands & Skills',
    'cli-binary': 'CLI tools',
    other: 'Other',
  }
  const GROUP_ORDER = ['mcp-tool', 'command', 'cli-binary', 'other']
  const NOTE_MAX = 100
  const GLYPHS: Record<string, string> = {
    failed: '✗',
    installed: '✓',
    skipped: '↷',
    'already-installed': '○',
    'kept-existing': '⚠',
  }
  const groupOf = (n: string): string => b.componentTypes[n] ?? 'other'
  // v4.16.0 T4 — `full` carries the untruncated reason for the post-table
  // detail block (dogfood v4.15.2: the note truncation ate exactly the
  // diagnostic part of gstack / mattpocock refresh failures).
  type Entry = { status: string; name: string; note?: string; full?: string }
  const buckets: Record<string, Entry[]> = {}
  const push = (group: string, entry: Entry): void => {
    if (!buckets[group]) buckets[group] = []
    buckets[group].push(entry)
  }
  for (const n of b.failed) {
    // failed entries arrive verbatim as "<name>: <reason>" — split into columns.
    const m = n.match(/^([^:]+):\s*(.*)$/s)
    push(groupOf(m?.[1] ?? n), { status: 'failed', name: m?.[1] ?? n, note: m?.[2], full: m?.[2] })
  }
  for (const n of b.installed) push(groupOf(n), { status: 'installed', name: n })
  for (const s of b.skipped)
    push(groupOf(s.name), { status: 'skipped', name: s.name, note: s.reason })
  for (const n of b.alreadyInstalled) push(groupOf(n), { status: 'already-installed', name: n })
  // Patch 4.10.1 Fix C — kept-existing: refresh failed but prior version retained.
  // Rendered as a WARN row (not error red) — component is still usable.
  // v4.15.2 T3 — note surfaces the underlying failure reason (previously swallowed
  // by reclassification; user dogfood could not diagnose refresh fails).
  for (const k of b.keptExisting ?? []) {
    const why = k.reason ? `refresh failed: ${k.reason.slice(0, 90)}` : 'refresh failed'
    push(groupOf(k.name), {
      status: 'kept-existing',
      name: k.name,
      note: `${why} — prior version retained`,
      full: k.reason,
    })
  }

  for (const g of GROUP_ORDER) {
    const entries = buckets[g]
    if (!entries || entries.length === 0) continue
    console.log(`\n  ${prefix}${GROUP_LABELS[g] ?? g} (${entries.length})`)
    const nameW = Math.max(...entries.map((e) => e.name.length), 'component'.length)
    // v4.15.1 — render rows first so the separator matches the REAL widest row
    // (the previous fixed `+24` estimate under/overshot with long failure notes).
    const rows = entries.map((e) => {
      const note = e.note && e.note.length > NOTE_MAX ? `${e.note.slice(0, NOTE_MAX)}…` : e.note
      const line = `    ${GLYPHS[e.status] ?? ' '} ${e.status.padEnd(18)} ${e.name.padEnd(nameW)}${note ? `  ${note}` : ''}`
      return { status: e.status, line }
    })
    const sepW = Math.max(...rows.map((r) => r.line.length)) - 4
    console.log(`    ${'—'.repeat(sepW)}`)
    for (const r of rows) {
      if (r.status === 'failed') console.error(r.line)
      else if (r.status === 'kept-existing') console.warn(r.line)
      else console.log(r.line)
    }
    // v4.16.0 T4 — full-reason detail block: any failed / kept-existing entry
    // whose reason outgrew the note column gets an untruncated (capped 400)
    // line after the table, on the same stream as its row.
    // v4.16.1 T2 — dead-zone fix: the old `full.length <= NOTE_MAX` gate
    // suppressed the ↳ block for 90-100 char reasons whose note WAS truncated
    // (kept-existing notes embed only `full.slice(0, 90)` inside a decorated
    // string — gstack dogfood v4.16.0). Print whenever the rendered note does
    // not carry the complete reason.
    for (const e of entries) {
      if (!e.full) continue
      const shownNote = (e.note ?? '').slice(0, NOTE_MAX)
      if (shownNote.includes(e.full)) continue
      const full = e.full.length > 400 ? `${e.full.slice(0, 400)}…` : e.full
      const line = `      ↳ ${e.name}: ${full}`
      if (e.status === 'failed') console.error(line)
      else console.warn(line)
    }
  }
}

export function registerSetup(program: Command): void {
  program
    .command('setup')
    .description(
      'One-shot onboarding: install workflow skills + base manifests to ~/.claude/ (immediate by default — use --dry-run for preview)',
    )
    .option('--dry-run', 'preview only — do not write to disk (opt-in for advanced users)')
    .option(
      '--user-lang <code>',
      'override detected OS locale for env.HARNESSED_USER_LANG (en | zh-Hans / zh-CN / zh-TW)',
    )
    // Phase C / D5 — target a specific harness platform (claude | codex). Sets
    // HARNESSED_PLATFORM for the run + persists a `.platform` pin so subsequent
    // runs resolve the same platform. Default: auto-detect (claude-first).
    .option('--platform <id>', 'target harness platform (claude | codex); default: auto-detect')
    // v3.9.0 P4 — auto-install third-party plugins via Clack confirm prompt
    // (default opt-in). `--non-interactive` skips prompts for CI/scripts;
    // `--no-auto-install` keeps v3.8.x advisory-only behavior.
    .option('--non-interactive', 'skip all confirm prompts (CI / scripted setup)')
    .option('--no-auto-install', 'do not prompt to auto-install missing plugins (advisory only)')
    // v3.9.6 — force re-install for already-installed third-party plugins
    // (skip idempotent_check probe). MCP installers ignore this flag —
    // existing mcpServers config is never overwritten unconditionally.
    .option(
      '--update-installed',
      'force re-install already-installed plugins (excludes MCP servers); default: skip if installed',
    )
    .action(async (raw: RawOpts) => {
      // Version banner FIRST — print this build's version + an npm-latest check so
      // users know exactly which harnessed ran (a stale log was mistaken for a
      // new-version regression). Fail-soft + timeout-bounded (offline → null,
      // never blocks). Printed in --dry-run too — version is wanted regardless of
      // mode. Extracted to ./lib/version-banner.js so the setup-helpers mock in
      // setup-locale/setup-platform tests needn't carry this export.
      await printSetupVersionBanner()

      const dryRun = raw.dryRun === true
      // Phase C / D5 — apply --platform FIRST so all resolver-backed paths below
      // (skills/commands/state) route to the chosen platform for this run.
      if (raw.platform !== undefined) await applyPlatformOption(raw.platform)
      const pkgRoot = getPackageRoot()
      const workflowsDir = resolve(pkgRoot, 'workflows')
      const skillsBase = getSkillsDir()

      // Agent Teams env probe (non-blocking warn) — sister R20.11 acceptance e.
      await warnIfAgentTeamsMissing()

      // ── Step A: workflow SKILL.md scan ──────────────────────────────────────
      let entries: string[]
      try {
        entries = await readdir(workflowsDir)
      } catch {
        console.error(t('setup.workflows_not_found', { path: workflowsDir }))
        process.exit(1)
      }

      const { workflows: toInstall } = await scanWorkflowsWithSkill(workflowsDir, entries)

      if (toInstall.length === 0) {
        console.log(t('setup.nothing_to_install'))
        process.exit(2)
      }

      if (dryRun) {
        console.log(t('setup.dry_run.header', { count: toInstall.length, path: skillsBase }))
        for (const wf of toInstall) {
          const masterTag = wf.isMaster ? ' (master)' : ''
          console.log(`  ${wf.name}  →  ${join(skillsBase, wf.name)}${masterTag}`)
        }
        console.log(t('setup.dry_run.run_hint'))
        process.exit(0)
      }

      let skillsInstalled = 0
      for (const wf of toInstall) {
        const src = join(workflowsDir, wf.relPath)
        const dst = join(skillsBase, wf.name)
        try {
          await cp(src, dst, { recursive: true, force: true })
          skillsInstalled++
        } catch (e) {
          console.error(t('setup.copy_failed', { name: wf.name, message: (e as Error).message }))
          process.exit(1)
        }
      }

      console.log(t('setup.step_a_complete', { count: skillsInstalled, path: skillsBase }))

      // ── Step A.5: Render `{{ capabilities.<name>.cmd }}` placeholders ───────
      // v3.4.1 hotfix — sub-workflow SKILL.md files contain Jinja-style template
      // refs that were never substituted at install time; end users saw literal
      // `{{ capabilities.gstack-review.cmd }}` strings in installed skills so
      // `/verify-paranoid` (and 20+ siblings) never invoked the real plugin cmd.
      // Resolver reads ~/.claude/plugins/installed_plugins.json + capabilities.yaml,
      // renders to namespaced form (`/gstack:review`) when plugin installed, OR
      // leaves bare cmd + emits warning when plugin missing. Non-blocking — any
      // unexpected error reduces to per-skill warn-and-continue (sister fallback
      // 铁律 1).
      const skillNames = toInstall.map((wf) => wf.name)
      // Phase 29 — resolve locale ONCE and thread it into the render loop so the
      // dest SKILL.md carries the locale-correct body. `--lang` is a global flag
      // pre-parsed in src/cli.ts (→ setLocale) BEFORE this action runs, so
      // getLocale() already reflects it; en → byte-identical to pre-29 behavior.
      const rendered = await renderAllSkills(
        skillNames,
        skillsBase,
        workflowsDir,
        undefined,
        getLocale(),
      )
      // (Step A.5 render count suppressed — internal detail)
      if (rendered.aggregatedWarnings.length > 0) {
        console.warn(t('setup.step_a_render.warnings_header'))
        for (const w of rendered.aggregatedWarnings) {
          console.warn(`    - ${w}`)
        }
      }

      // ── Step A.6: Generate ~/.claude/commands/<x>.md (v3.4.3) ───────────────
      // v3.4.3 — SKILL.md alone does NOT register a slash command. Claude Code
      // platform-level slash commands require `~/.claude/commands/<x>.md`
      // (filename = slash name; YAML frontmatter + body = prompt). This step
      // writes one per installed sub-workflow, with a dual-path body: preferred
      // (upstream slash cmd) + fallback (Task-spawn self-contained role prompt
      // adapted from gstack expert prompts). Skip + warn if user already has
      // a same-named commands/ file (additive only — never overwrite).
      const commandsBase = getCommandsDir()
      try {
        await mkdir(commandsBase, { recursive: true })
      } catch (e) {
        console.warn(
          `  [A.6] could not create ${commandsBase} — skipping commands/ generation (${(e as Error).message})`,
        )
      }
      let capabilitiesMap = {}
      try {
        capabilitiesMap = await loadCapabilities(workflowsDir)
      } catch (e) {
        console.warn(
          `  [A.6] capabilities.yaml unreadable — skipping commands/ generation (${(e as Error).message})`,
        )
      }
      const rolePrompts = await loadRolePrompts(workflowsDir)
      const installedPlugins = readInstalledPlugins()
      const installedUserSkills = readInstalledUserSkills()
      const cmdResult = await writeAllCommands(
        skillNames,
        commandsBase,
        rolePrompts,
        capabilitiesMap,
        installedPlugins,
        installedUserSkills,
        async (p, c) => writeFile(p, c, 'utf8'),
      )
      const writtenCount = cmdResult.results.filter((r) => r.written).length
      const skippedCount = cmdResult.results.filter((r) => !r.written && r.warning).length
      if (writtenCount > 0 || skippedCount > 0) {
        console.log(`  generated ${writtenCount} commands/<x>.md file(s) (${skippedCount} skipped)`)
      }

      // ── Step C: Agent Teams auto-enable ────────────────────────────────
      await enableAgentTeamsInSettings()
      await enableUserLangInSettings(raw.userLang)

      // ── Step B: install-base auto-glob chain (parallel) ─────────────────────
      // v3.9.7 — flow corrected per user UX feedback. First pass: default
      // (updateInstalled=false) — idempotent_check probes short-circuit
      // already-installed entries. AFTER summary prints, prompt user with
      // the concrete already-installed list so they can decide informed.
      // CLI flag `--update-installed` skips the prompt and forces from the
      // first pass (CI / scripted use).
      const manifestPaths = await listBaseManifests(pkgRoot)
      const forceFirstPass = raw.updateInstalled === true
      // v4.13.0 — live progress lines (user UX feedback: Step B was silent for
      // its whole runtime and read as a hang). One line per finished component;
      // works on non-TTY too (plain console.log, no spinner dependency).
      const progressPrinter = (ev: {
        done: number
        total: number
        name: string
        status: string
      }): void => {
        console.log(`  [${ev.done}/${ev.total}] ${ev.status} ${ev.name}`)
      }
      console.log(
        `\ninstalling ${manifestPaths.length} upstream components (MCP serialized, rest parallel)...`,
      )
      const b = await runStepBInstall(manifestPaths, {
        updateInstalled: forceFirstPass,
        quiet: true,
        onProgress: progressPrinter,
      })
      const stepBMs = (b.elapsedMs / 1000).toFixed(1)
      console.log(
        t('setup.step_b_complete', {
          installed: b.installed.length,
          already: b.alreadyInstalled.length,
          skipped: b.skipped.length,
          failed: b.failed.length,
          seconds: stepBMs,
        }),
      )
      printGrouped(b)

      // v3.9.7 — Post-summary force-update prompt. Shows concrete list of
      // already-installed third-party plugins so user can make informed
      // decision. MCP installers (mcpStdioAdd / mcpHttpAdd) ignore the
      // updateInstalled flag — existing mcpServers config is never
      // overwritten by force-update.
      if (
        !forceFirstPass &&
        !dryRun &&
        raw.nonInteractive !== true &&
        b.alreadyInstalled.length > 0
      ) {
        const isTty = process.stdin.isTTY === true && process.stdout.isTTY === true
        if (isTty) {
          const { confirm, isCancel } = await import('@clack/prompts')
          const ans = await confirm({
            message: `Update ${b.alreadyInstalled.length} already-installed plugin(s) listed above? (MCP servers excluded — they ignore force-update)`,
            initialValue: false,
          })
          if (!isCancel(ans) && ans === true) {
            // Second pass: force-update path. runInstall sees
            // opts.updateInstalled=true → bypasses idempotent_check probe →
            // runs install command. MCP installers ignore the flag per design.
            // v4.15.1 — symmetric progress header (first pass has one; the
            // second pass previously started dumping [n/m] lines with no lead-in).
            console.log(`\nforce-updating ${b.alreadyInstalled.length} plugin(s)...`)
            const b2 = await runStepBInstall(manifestPaths, {
              updateInstalled: true,
              quiet: true,
              onProgress: progressPrinter,
            })
            // Patch 4.10.1 Fix C — fail-soft reclassification (comet ensureOpenSpecCli):
            // a refresh that failed but whose component is still on disk is NOT a
            // failure — the prior version is retained. Move failed→keptExisting when
            // the idempotent_check probe still passes for a previously-installed comp.
            const probe = await makeIdempotentProbe(manifestPaths)
            const reclass = await reclassifyForceUpdateFailures(b, b2, probe)
            b2.failed = reclass.failed
            b2.keptExisting = reclass.keptExisting
            const stepB2Ms = (b2.elapsedMs / 1000).toFixed(1)
            console.log(
              `\nForce-update pass complete: ${b2.installed.length} installed / ${b2.keptExisting.length} kept-existing / ${b2.alreadyInstalled.length} still-already-installed (MCP) / ${b2.skipped.length} skipped / ${b2.failed.length} failed [parallel ${stepB2Ms}s]`,
            )
            printGrouped(b2, '[force-update] ')
            if (b2.keptExisting.length > 0) {
              console.warn(
                `\n  ${b2.keptExisting.length} plugin(s) kept their existing version — refresh failed but the prior install is still usable. Re-run \`harnessed setup\` later to retry the update.`,
              )
            }
          }
        }
      }

      // v4.13.0 — L4 rescue: Step B is nonInteractive so L4 manifests (global
      // npm installs, e.g. ctx7) skip with level-flag-missing every run. Offer
      // an interactive opt-in here (TTY only; dynamic import mirrors the
      // runAutoInstall pattern so setup tests need no new mock exports).
      if (
        !dryRun &&
        raw.nonInteractive !== true &&
        b.skipped.some((s) => s.reason === 'level-flag-missing')
      ) {
        const isTty = process.stdin.isTTY === true && process.stdout.isTTY === true
        if (isTty) {
          const { runL4Rescue } = await import('./lib/l4-rescue.js')
          await runL4Rescue(manifestPaths, b.skipped)
        }
      }

      // v4.18.0 — optional-tier offer (manifests/optional/: codegraph / ecc /
      // perturn-inject). Phase 18 D2 keeps optional/ out of Step B's auto-glob
      // (opt-in locked); pre-4.18.0 setup gave the tier NO surface at all — it
      // was only reachable by users who already knew `harnessed install <name>`.
      // Interactive → per-component confirm (default No); non-TTY → one advisory
      // line. Dynamic import mirrors l4-rescue (setup-tests mock-factory safety).
      if (!dryRun) {
        const optIsTty = process.stdin.isTTY === true && process.stdout.isTTY === true
        const { runOptionalOffer } = await import('./lib/optional-offer.js')
        await runOptionalOffer(resolve(pkgRoot, 'manifests', 'optional'), {
          interactive: optIsTty && raw.nonInteractive !== true,
        })
      }

      // v4.15.1 — honest failure trailer: a long grouped table scrolls the
      // failed rows away; restate the count + retry path right before the
      // "setup complete" line so a failed setup never reads as fully green.
      if (b.failed.length > 0) {
        console.error(
          `\n${b.failed.length} component(s) failed — see the notes in the tables above; re-run \`harnessed setup\` to retry, or run \`harnessed doctor\` for environment diagnostics.`,
        )
      }
      console.log(
        t('setup.complete', {
          skills: skillsInstalled,
          manifests: b.installed.length + b.alreadyInstalled.length,
        }),
      )
      if (b.alreadyInstalled.length > 0 || b.installed.length > 0) {
        // v4.14.0 — hint follows the active platform ("/mcp in Claude Code" is
        // meaningless on codex; there the check is `codex mcp list`).
        console.log(t(detectPlatform().id === 'codex' ? 'setup.mcp_hint_codex' : 'setup.mcp_hint'))
      }

      // ── Phase v2.0-2.3 W1.1: Pure bundled distribution highlight (D-01) ───
      // workflows live in <packageRoot>/workflows/ — share-only readonly,
      // NOT user-dir override (~/.harnessed/ NOT used per D-01 LOCKED).
      console.log(t('setup.bundled_summary'))
      console.log(t('setup.bundled_location'))
      // v3.8.0 P3 — advisory doctor hint (NO auto-invoke to avoid CLI subprocess
      // complexity + scope creep; user opts in by running `harnessed doctor`).
      console.log(t('setup.doctor_hint'))

      // v3.9.0 P4 — auto-install missing third-party plugins (default opt-in,
      // confirm prompt per plugin). Skips on --non-interactive, --no-auto-install,
      // dry-run path (no side effects per Phase 1 dry-run contract), or non-TTY
      // stdin (CI / piped invocation — can't prompt anyway, fall back to advisory).
      if (!dryRun) {
        const isTty = process.stdin.isTTY === true && process.stdout.isTTY === true
        const { runAutoInstall } = await import('./lib/auto-install.js')
        await runAutoInstall({
          nonInteractive: raw.nonInteractive === true || !isTty,
          autoInstall: raw.autoInstall !== false, // commander default = true; --no-auto-install flips
        })
      }
      process.exit(0)
    })
}
