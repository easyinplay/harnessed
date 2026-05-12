#!/usr/bin/env node
import { Command } from 'commander'
import { registerAudit } from './cli/audit.js'
import { registerBackupList } from './cli/backup-list.js'
import { registerDoctor } from './cli/doctor.js'
import { registerGc } from './cli/gc.js'
import { registerInstall } from './cli/install.js'
import { registerRollback } from './cli/rollback.js'
import { registerStatus } from './cli/status.js'

const program = new Command()

program
  .name('harnessed')
  .description('AI coding harness package manager + composition orchestrator')
  .version('0.1.0-alpha.2-installer-runtime')

// 7 subcommands per ADR 0004 + F31 followup 1 (gc included — ADR 0004 § Consequences Negative #3)
registerInstall(program)
registerDoctor(program)
registerAudit(program)
registerRollback(program)
registerStatus(program)
registerBackupList(program)
registerGc(program)

program.parse(process.argv)
