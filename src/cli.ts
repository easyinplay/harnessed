#!/usr/bin/env node
import { Command } from 'commander'
import { registerAudit } from './cli/audit.js'
import { registerBackupList } from './cli/backup-list.js'
import { registerDoctor } from './cli/doctor.js'
import { registerGc } from './cli/gc.js'
import { registerInstall } from './cli/install.js'
import { registerInstallBase } from './cli/install-base.js'
import { registerRollback } from './cli/rollback.js'
import { registerStatus } from './cli/status.js'

const program = new Command()

program
  .name('harnessed')
  .description('AI coding harness package manager + composition orchestrator')
  .version('0.1.0-alpha.2-installer-runtime')

// 8 subcommands per ADR 0004 + ADR 0007 (install-base added in phase 1.3 — D-9 独立子命令).
registerInstall(program)
registerInstallBase(program)
registerDoctor(program)
registerAudit(program)
registerRollback(program)
registerStatus(program)
registerBackupList(program)
registerGc(program)

program.parse(process.argv)
