import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { describe, expect, it } from 'vitest'
import { registerAdvance } from '../../src/cli/advance.js'
import { registerAgentsMd } from '../../src/cli/agents-md.js'
import { registerAudit } from '../../src/cli/audit.js'
import { registerAuditLog } from '../../src/cli/audit-log.js'
import { registerBackupList } from '../../src/cli/backup-list.js'
import { registerCheckDocs } from '../../src/cli/checkDocs.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'
import { registerCompact } from '../../src/cli/compact-cmd.js'
import { registerDoctor } from '../../src/cli/doctor.js'
import { registerEval } from '../../src/cli/evalCmd.js'
import { registerExemptGateguard } from '../../src/cli/exempt-gateguard.js'
import { registerFacts } from '../../src/cli/facts.js'
import { registerGates } from '../../src/cli/gates.js'
import { registerGc } from '../../src/cli/gc.js'
import { registerInjectState } from '../../src/cli/injectStateCmd.js'
import { registerInstall } from '../../src/cli/install.js'
import { registerInstallBase } from '../../src/cli/install-base.js'
import { registerLearn } from '../../src/cli/learn.js'
import { registerManifestAdd } from '../../src/cli/manifest-add.js'
import { registerNext } from '../../src/cli/next.js'
import { registerPrompt } from '../../src/cli/prompt.js'
import { registerReject } from '../../src/cli/reject.js'
import { registerReleasePreflight } from '../../src/cli/release-preflight.js'
import { registerResearch } from '../../src/cli/research.js'
import { registerResume } from '../../src/cli/resume.js'
import { registerRetro } from '../../src/cli/retro.js'
import { registerRollback } from '../../src/cli/rollback.js'
import { registerRun } from '../../src/cli/run.js'
import { registerSetup } from '../../src/cli/setup.js'
import { registerStatus } from '../../src/cli/status.js'
import { registerStopHook } from '../../src/cli/stopHookCmd.js'
import { registerUninstall } from '../../src/cli/uninstall.js'
import { registerUpdate } from '../../src/cli/update.js'
import { registerWorkflows } from '../../src/cli/workflows.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(resolve(root, path), 'utf8').replaceAll('\r\n', '\n')
const registrars = {
  registerAdvance,
  registerAgentsMd,
  registerAudit,
  registerAuditLog,
  registerBackupList,
  registerCheckDocs,
  registerCheckpoint,
  registerCompact,
  registerDoctor,
  registerEval,
  registerExemptGateguard,
  registerFacts,
  registerGates,
  registerGc,
  registerInjectState,
  registerInstall,
  registerInstallBase,
  registerLearn,
  registerManifestAdd,
  registerNext,
  registerPrompt,
  registerReject,
  registerReleasePreflight,
  registerResearch,
  registerResume,
  registerRetro,
  registerRollback,
  registerRun,
  registerSetup,
  registerStatus,
  registerStopHook,
  registerUninstall,
  registerUpdate,
  registerWorkflows,
} satisfies Record<string, (program: Command) => void>

const registeredNames = [
  ...read('src/cli.ts').matchAll(/^\s*(register[A-Za-z]+)\(program\)/gm),
].map((match) => match[1] as keyof typeof registrars)

const program = new Command()
for (const name of registeredNames) registrars[name](program)

function commandPaths(command: Command, parent: string[] = []): string[] {
  return command.commands.flatMap((child) => {
    const path = [...parent, child.name()]
    return [path.join(' '), ...commandPaths(child, path)]
  })
}

const internalTopLevel = new Set(['help', 'inject-state', 'stop-hook'])
const paths = commandPaths(program).filter(
  (path) => !internalTopLevel.has(path.split(' ')[0] ?? ''),
)
const publicTopLevel = new Set(paths.filter((path) => !path.includes(' ')))
const readmes = readdirSync(root).filter((file) => /^README(?:-[\w-]+)?\.md$/.test(file))
const inlineCommandReference = /`harnessed[ \t]+([a-z][a-z0-9-]*)\b[^`]*`/g
const plainCommandReference =
  /(?:\b(?:run|execute|invoke|use|retry|call)\s+|(?:运行|执行|调用|使用|重试)\s*)harnessed\s+([a-z][a-z0-9-]*)\b/gi
const shellCommandReference = /(?:^|\s)harnessed\s+([a-z][a-z0-9-]*)\b/g

function documentedTopLevel(file: string): Set<string> {
  const commands = [...read(file).matchAll(/^\| `harnessed ([^`]+)` \|/gm)]
  return new Set(commands.map((match) => match[1]?.trim().split(/\s+/)[0] ?? ''))
}

function referencedHarnessedCommands(text: string): Set<string> {
  const commands = new Set<string>()
  for (const match of text.matchAll(inlineCommandReference)) commands.add(match[1] ?? '')

  let fenced = false
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      continue
    }
    const reference = fenced ? shellCommandReference : plainCommandReference
    for (const match of line.matchAll(reference)) commands.add(match[1] ?? '')
  }
  return commands
}

function invalidHarnessedReferences(source: string, text: string): string[] {
  const invalid: string[] = []
  for (const command of referencedHarnessedCommands(text)) {
    if (!publicTopLevel.has(command)) invalid.push(`${source}: harnessed ${command}`)
  }
  return invalid
}

describe('CLI documentation surface contract', () => {
  it('constructs the same registrar set used by src/cli.ts', () => {
    expect(new Set(registeredNames)).toEqual(new Set(Object.keys(registrars)))
  })

  it('documents every public top-level command in every README locale', () => {
    expect(publicTopLevel.size).toBe(32)
    expect(readmes).toHaveLength(11)
    for (const file of readmes) expect(documentedTopLevel(file), file).toEqual(publicTopLevel)
  })

  it('recognizes nested command paths without exposing internal commands', () => {
    expect(paths).toContain('backup list')
    expect(paths).toContain('eval record')
    expect(paths).not.toContain('help')
    expect(paths).not.toContain('inject-state')
    expect(paths).not.toContain('stop-hook')
  })

  it('keeps workflow harnessed references on registered public commands', () => {
    const skillFiles = readdirSync(resolve(root, 'workflows'), { recursive: true })
      .map(String)
      .filter((file) => /(?:^|[\\/])SKILL(?:\.zh-Hans)?\.md$/.test(file))
    const invalid: string[] = []
    for (const file of skillFiles) {
      const text = read(resolve('workflows', file))
      invalid.push(...invalidHarnessedReferences(file, text))
    }
    expect(invalid).toEqual([])
  })

  it('rejects an unquoted reference to a command outside the public CLI surface', () => {
    const fixture = 'tests/fixtures/cli-surface/invalid-command.md'
    expect(invalidHarnessedReferences(fixture, read(fixture))).toEqual([
      `${fixture}: harnessed definitely-not-a-command`,
    ])
  })
})
