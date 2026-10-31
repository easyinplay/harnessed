#!/usr/bin/env node
import { join } from 'node:path'
import pkg from '../package.json' with { type: 'json' }

const entryArgs = process.argv.slice(2)
if (entryArgs.length === 1 && entryArgs[0] === '--internal-update-identity') {
  process.stdout.write(`${pkg.version}\n`)
  process.exit(0)
}

const { Command } = await import('commander')
const { migrateRepoKeyCase } = await import('./checkpoint/workflowStore.js')
const { registerAdvance } = await import('./cli/advance.js')
const { registerAgentsMd } = await import('./cli/agents-md.js')
const { registerAudit } = await import('./cli/audit.js')
const { registerAuditLog } = await import('./cli/audit-log.js')
const { registerBackupList } = await import('./cli/backup-list.js')
const { registerCheckDocs } = await import('./cli/checkDocs.js')
const { registerCheckpoint } = await import('./cli/checkpoint.js')
const { registerCompact } = await import('./cli/compact-cmd.js')
const { registerDoctor } = await import('./cli/doctor.js')
const { registerEval } = await import('./cli/evalCmd.js')
const { registerExemptGateguard } = await import('./cli/exempt-gateguard.js')
const { registerFacts } = await import('./cli/facts.js')
const { registerGates } = await import('./cli/gates.js')
const { registerGc } = await import('./cli/gc.js')
const { registerInjectState } = await import('./cli/injectStateCmd.js')
const { registerInstall } = await import('./cli/install.js')
const { registerInstallBase } = await import('./cli/install-base.js')
const { registerLearn } = await import('./cli/learn.js')
const { formatFatalEnvelope, wantsJsonEnvelope } = await import('./cli/lib/fatalError.js')
const { parseBareInvocation, runHere } = await import('./cli/lib/here.js')
const { emitUpdateResult, hasWrittenUpdateEnvelope, updateFailureResult, wantsUpdateEnvelope } =
  await import('./cli/lib/updateCoordinator.js')
const { registerManifestAdd } = await import('./cli/manifest-add.js')
const { registerNext } = await import('./cli/next.js')
const { registerPrompt } = await import('./cli/prompt.js')
const { registerReject } = await import('./cli/reject.js')
const { registerReleasePreflight } = await import('./cli/release-preflight.js')
const { registerResearch } = await import('./cli/research.js')
const { registerResume } = await import('./cli/resume.js')
const { registerRetro } = await import('./cli/retro.js')
const { registerRollback } = await import('./cli/rollback.js')
const { registerRun } = await import('./cli/run.js')
const { registerSetup } = await import('./cli/setup.js')
const { registerStatus } = await import('./cli/status.js')
const { registerStopHook } = await import('./cli/stopHookCmd.js')
const { registerUninstall } = await import('./cli/uninstall.js')
const { registerUpdate } = await import('./cli/update.js')
const { registerWorkflows } = await import('./cli/workflows.js')
const { setLocale, wireMessagesDir } = await import('./i18n/index.js')
const { getAssetsRoot } = await import('./platform/assetsRoot.js')
const { captureHostInstallContext } = await import('./platform/hostInstallContext.js')
const { migrateLegacyHarnessedRoot } = await import('./platform/harnessedRoot.js')

// B2 (v4.20.0, D5) — messages/ 的 assetsRoot 接线,惰性注入(thunk 到首次 t()
// 才求值)。只在真 CLI 进程入口 wire — vitest 的 setupFiles 预加载 i18n 时不经
// 此文件,B1 的 mock 时序教训(击穿 gates/setup-locale 17 测试)由此规避。
// npm 模式下 getAssetsRoot() === packageRoot → 与既有候选等价;compiled 模式
// 指向解包目录 → zh-Hans 从 <stateRoot>/assets/<ver>/messages/ 可读。
wireMessagesDir(() => join(getAssetsRoot(), 'messages'))

// v3.0.3 — migrate any pre-v3.0.3 `~/.harnessed/` to `~/.claude/harnessed/`
// before any subcommand runs. Idempotent on subsequent invocations.
const updateInvocation = entryArgs.includes('update')

function explicitPlatform(args: string[]): string | undefined {
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--') return undefined
    if (arg === '--platform') return args[index + 1]
    if (arg?.startsWith('--platform=')) return arg.slice('--platform='.length)
  }
  return undefined
}

// v3.4.0 — pre-parse `--lang` flag so subcommand action handlers see the
// correct locale before they emit any t()-wrapped strings. Commander parses
// global flags eagerly via `program.parse`, but the lazy detect inside
// `getLocale()` would otherwise resolve to env/Intl on first t() call before
// the flag handler ran. Scanning argv here mirrors gnu getopt convention.
const argv = process.argv
for (let i = 2; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--lang' && i + 1 < argv.length) {
    setLocale(argv[i + 1])
    break
  }
  if (a?.startsWith('--lang=')) {
    setLocale(a.slice('--lang='.length))
    break
  }
}

// P1-2 (v5.0 Spec 1) — commander async `.action()` handlers (checkpoint / status /
// resume / run / gates) have no top-level try/catch, so a rejected promise
// (LockHeldError, fs faults, …) would surface as an unhandled rejection and crash
// with a v8 stack dump + non-deterministic exit code. A single global handler at the
// process root converts any escaped rejection/exception into a clean `error: …` line
// + exit 1. This is preferred over per-action try/catch (which would entangle with
// the `process.exit`-mocked CLI unit tests that import each `register*` in isolation
// against their own Command instance — this file is never imported by those tests).
// 4.32.15 (#10) — when the invocation asked for --json, ALSO print a single-line
// {error:{message}} envelope to stdout so machine consumers (driver loops, hooks)
// parsing stdout can surface WHY instead of seeing exit 1 with empty stdout.
const fatal = (msg: string): never => {
  if (wantsUpdateEnvelope(process.argv)) {
    if (!hasWrittenUpdateEnvelope()) emitUpdateResult(updateFailureResult(msg), true)
  } else if (wantsJsonEnvelope(process.argv)) console.log(formatFatalEnvelope(msg))
  console.error(`error: ${msg}`)
  process.exit(1)
}
process.on('unhandledRejection', (reason) => {
  fatal(reason instanceof Error ? reason.message : String(reason))
})
process.on('uncaughtException', (err) => {
  fatal(err instanceof Error ? err.message : String(err))
})

// v16.0 Phase 67 T1 — fold pre-existing ledger keys to canonical case before any
// subcommand runs (sibling of migrateLegacyHarnessedRoot above; placed AFTER the
// handlers so nothing escapes as a raw unhandled rejection). Lock-free + silent
// when there is nothing to do, so the idle cost is one small read on win32 and
// zero elsewhere. Fail-SOFT: a concurrent lock holder (per-turn inject hook, a
// parallel `checkpoint complete`) must not break the invocation — the migration
// is idempotent and simply retries on the next run.
if (!updateInvocation) {
  const hostId = explicitPlatform(entryArgs)
  migrateLegacyHarnessedRoot(captureHostInstallContext(hostId === undefined ? {} : { hostId }))
  await migrateRepoKeyCase().catch((e: unknown) => {
    console.error(
      `[harnessed] WARN: repo-key case migration deferred: ${e instanceof Error ? e.message : String(e)}`,
    )
  })
}

const program = new Command()
if (wantsUpdateEnvelope(process.argv)) program.exitOverride()

program
  .name('harnessed')
  .description('AI coding harness package manager + composition orchestrator')
  .version(pkg.version)
  .option('--lang <code>', 'output language: en | zh (auto-detect from $LANG / Intl if absent)')

// 12 subcommands per ADR 0004 + 0007 + 0008 + 0011 + 0012 + 0014 draft
// (manifest-add added in phase 2.3 W3 T3.2 — EE-5 5Q merge gate, D-03 BOTH 双闸 L1;
//  resume added in phase 3.1 W4 T4.4 — R7.3 D-03 RELOAD checkpoint reload).
registerInstall(program)
registerInstallBase(program)
registerResearch(program)
registerManifestAdd(program)
registerDoctor(program)
registerAudit(program)
registerAuditLog(program) // Phase 5.1 W1 T1.3 — 13th subcommand (R10.1 D-01 jq filter consumer)
registerRollback(program)
registerStatus(program)
registerBackupList(program)
registerGc(program)
registerResume(program) // Phase 3.1 W4 T4.4 — 12th subcommand (R7.3 D-03 RELOAD)
registerUninstall(program) // Phase 5.2 W1 T1.1 — 14th subcommand (R10.3 D-01 7-method dispatch)
registerSetup(program) // v1.0.1 T1.5 — 15th subcommand (one-time onboarding workflows/*/SKILL.md → ~/.claude/skills/)
registerRun(program) // v3.4.4 T1 — 16th subcommand (α CLI wire; replaces dead SlashCommand vapor in commands/<x>.md)
// v4.0 W1 — orchestration-brain CLIs (CC main session calls these; no spawn):
registerGates(program) // 17th — gate eval JSON (which subs fire for a master)
registerPrompt(program) // 18th — spawn-ready prompt text/json for a sub
registerCheckpoint(program) // 19th — record sub start/complete/fail to checkpoints/
registerNext(program) // 20th — G2 deterministic next-step contract (NEXT: auto|manual|done) + v12.0 D3 cross-unit forward continuation
registerAdvance(program) // v12.0 Phase 38 D4 — `harnessed advance` cross-phase act (gated, print-only)
registerReject(program) // 21st — G7-lite user-rejected terminal sub status
registerCompact(program) // 22nd — Phase 14 compact: summarize+evict resolved ledger entries
registerWorkflows(program) // 23rd — Phase 15 multi-workflow: list in-flight workflows (one per repo)
registerExemptGateguard(program) // 4.22.2 — dual-guard conflict fix channel (doctor auto-install consumes it)
registerAgentsMd(program) // v16.0 post-close — opt-in AGENTS.md block (codex session-start contract)
registerLearn(program) // 24th — Phase 16 learning loop: append a prose learning to .planning/LEARNINGS.md
registerUpdate(program) // 25th — Phase 20 update: self-update + --upstreams + --migration-report
registerReleasePreflight(program) // 26th — Phase 21 ship: read-only release-readiness gate
registerRetro(program) // 27th — Phase 22 retro-reminder reset (--done zeroes the phase counter)
registerInjectState(program) // 28th — 4.27.0 B3 D6: perturn hook via the binary itself (no host node)
registerStopHook(program) // 29th — 4.30.0 issue #6: mode-B tool-call corruption auto-recovery Stop hook
registerEval(program) // 30th — 4.31.0 eval Slice A: orchestrator-behavior regression trap suite
registerCheckDocs(program) // 31st — T2.5: doc-discipline gate that actually SHIPS (scripts/ is not in `files`)
registerFacts(program) // 32nd — T2.1: gate-fact production chain (feeds `gates --context-file`)

// v8.0 Phase 24 — zero-arg `harnessed` you-are-here entry (comet `/comet` analog).
// D3 explicit bare-invocation detection BEFORE program.parse: ONLY `[]` / `['--json']`
// (after the pre-parsed `--lang` pair) dispatch the dashboard; everything else
// (subcommand / --help / --version / unknown) falls through to commander unchanged,
// so `harnessed bogus` still errors. runHere is read-only + exits 0; any rejection
// surfaces via the global unhandledRejection handler above.
const bare = parseBareInvocation(process.argv.slice(2))
if (bare.here) {
  void runHere({ json: bare.json })
} else {
  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    if (wantsUpdateEnvelope(process.argv) && !hasWrittenUpdateEnvelope()) {
      const code = (error as { code?: string }).code
      if (code === 'commander.helpDisplayed' || code === 'commander.version') process.exitCode = 0
      else
        emitUpdateResult(
          updateFailureResult(error, code?.startsWith('commander.') ? 'arguments' : 'fatal'),
          true,
        )
    } else throw error
  }
}
