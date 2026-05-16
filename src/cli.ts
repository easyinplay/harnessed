#!/usr/bin/env node
import { Command } from 'commander'
import { registerAudit } from './cli/audit.js'
import { registerBackupList } from './cli/backup-list.js'
import { registerDoctor } from './cli/doctor.js'
import { registerExecuteTask } from './cli/execute-task.js'
import { registerGc } from './cli/gc.js'
import { registerInstall } from './cli/install.js'
import { registerInstallBase } from './cli/install-base.js'
import { registerManifestAdd } from './cli/manifest-add.js'
import { registerResearch } from './cli/research.js'
import { registerResume } from './cli/resume.js'
import { registerRollback } from './cli/rollback.js'
import { registerStatus } from './cli/status.js'

const program = new Command()

program
  .name('harnessed')
  .description('AI coding harness package manager + composition orchestrator')
  .version('0.1.0-alpha.2-installer-runtime')

// 12 subcommands per ADR 0004 + 0007 + 0008 + 0011 + 0012 + 0014 draft
// (execute-task added in phase 2.2 — B-28 独立子命令;
//  manifest-add added in phase 2.3 W3 T3.2 — EE-5 5Q merge gate, D-03 BOTH 双闸 L1;
//  resume added in phase 3.1 W4 T4.4 — R7.3 D-03 RELOAD checkpoint reload).
registerInstall(program)
registerInstallBase(program)
registerResearch(program)
registerExecuteTask(program)
registerManifestAdd(program)
registerDoctor(program)
registerAudit(program)
registerRollback(program)
registerStatus(program)
registerBackupList(program)
registerGc(program)
registerResume(program) // Phase 3.1 W4 T4.4 — 12th subcommand (R7.3 D-03 RELOAD)

program.parse(process.argv)
