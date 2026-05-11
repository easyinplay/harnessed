#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('harnessed')
  .description('AI coding harness package manager + composition orchestrator')
  .version('0.1.0-alpha.1')

program.parse(process.argv)
