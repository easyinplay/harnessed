#!/usr/bin/env node
import { Command } from 'commander'
import pkg from '../package.json' with { type: 'json' }
import { registerAudit } from './cli/audit.js'
import { registerAuditLog } from './cli/audit-log.js'
import { registerBackupList } from './cli/backup-list.js'
import { registerCheckpoint } from './cli/checkpoint.js'
import { registerCompact } from './cli/compact-cmd.js'
import { registerDoctor } from './cli/doctor.js'
import { registerGates } from './cli/gates.js'
import { registerGc } from './cli/gc.js'
import { registerInstall } from './cli/install.js'
import { registerInstallBase } from './cli/install-base.js'
import { registerLearn } from './cli/learn.js'
import { parseBareInvocation, runHere } from './cli/lib/here.js'
import { registerManifestAdd } from './cli/manifest-add.js'
import { registerNext } from './cli/next.js'
import { registerPrompt } from './cli/prompt.js'
import { registerReject } from './cli/reject.js'
import { registerReleasePreflight } from './cli/release-preflight.js'
import { registerResearch } from './cli/research.js'
import { registerResume } from './cli/resume.js'
import { registerRetro } from './cli/retro.js'
import { registerRollback } from './cli/rollback.js'
import { registerRun } from './cli/run.js'
import { registerSetup } from './cli/setup.js'
import { registerStatus } from './cli/status.js'
import { registerUninstall } from './cli/uninstall.js'
import { registerUpdate } from './cli/update.js'
import { registerWorkflows } from './cli/workflows.js'
import { setLocale } from './i18n/index.js'
import { migrateLegacyHarnessedRoot } from './installers/lib/harnessedRoot.js'

// v3.0.3 — migrate any pre-v3.0.3 `~/.harnessed/` to `~/.claude/harnessed/`
// before any subcommand runs. Idempotent on subsequent invocations.
migrateLegacyHarnessedRoot()

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
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason)
  console.error(`error: ${msg}`)
  process.exit(1)
})
process.on('uncaughtException', (err) => {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})

const program = new Command()

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
registerNext(program) // 20th — G2 deterministic next-step contract (NEXT: auto|manual|done)
registerReject(program) // 21st — G7-lite user-rejected terminal sub status
registerCompact(program) // 22nd — Phase 14 compact: summarize+evict resolved ledger entries
registerWorkflows(program) // 23rd — Phase 15 multi-workflow: list in-flight workflows (one per repo)
registerLearn(program) // 24th — Phase 16 learning loop: append a prose learning to .planning/LEARNINGS.md
registerUpdate(program) // 25th — Phase 20 update: self-update + --upstreams + --migration-report
registerReleasePreflight(program) // 26th — Phase 21 ship: read-only release-readiness gate
registerRetro(program) // 27th — Phase 22 retro-reminder reset (--done zeroes the phase counter)

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
  program.parse(process.argv)
}
