#!/usr/bin/env node
// Real installed binaries/state only. Retains scratch; never installs or reads config/auth.
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const installed = 'C:/Users/easyi/AppData/Local/harnessed/bin/harnessed.exe'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
// An item-level `error` is a diagnostic, not a model tool invocation. Event-level
// error/turn.failed still fails the live turn; successful outputs remain mandatory.
const nonToolTypes = ['reasoning', 'agent_message', 'error']
if (process.argv[2] === '--review-recorded') {
  const dir = resolve(process.argv[3] ?? '')
  const allowed = join(root, '.planning/phases/68-installed-codex-acceptance')
  assert(
    dir.startsWith(`${allowed}\\`) || dir.startsWith(`${allowed}/`),
    'Review path outside owned evidence',
    'experiment_error',
  )
  const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'))
  const original = read('report.json')
  const injection = read('injection-observation.json')
  const role = read('role-observation.json')
  const command = (name) => original.commands.find((entry) => entry.label === name)
  for (const label of ['codex-hook-turn', 'codex-role-turn']) {
    assert(
      command(label)?.code === 0 && !command(label).timedOut,
      `${label}: recorded execution failed`,
    )
  }
  assert(
    injection.matched && injection.expected === original.workflow.sub,
    'Recorded sentinel mismatch',
  )
  assert(
    injection.toolTypes.every((type) => nonToolTypes.includes(type)),
    'Recorded model tool use',
  )
  assert(
    !readFileSync(join(dir, 'injection-prompt.txt'), 'utf8').includes(injection.expected),
    'Sentinel in prompt',
  )
  assert(
    role.finalMatched &&
      role.itemTypes.every((type) => [...nonToolTypes, 'collab_tool_call'].includes(type)),
    'Recorded role turn invalid',
  )
  assert(
    role.calls.length === 3 &&
      ['spawn_agent', 'wait', 'close_agent'].every((tool) =>
        role.calls.some(
          (call) => call.tool === tool && call.status === 'completed' && call.receivers === 1,
        ),
      ),
    'Recorded role lifecycle invalid',
  )
  assert(
    [
      'checkpoint-negative-promise',
      'checkpoint-positive-promise-and-close',
      'installed-doc-guard-json-deny',
    ].every((name) =>
      original.checks.some((entry) => entry.name === name && entry.status === 'pass'),
    ),
    'Recorded CLI checks failed',
  )
  const review = {
    status: 'pass_with_evidence_limitations',
    execution: 'offline review only; no additional model turns',
    originalScriptExit: original.status === 'pass' ? 0 : 1,
    reviewedAt: new Date().toISOString(),
    sourceReportSha256: createHash('sha256')
      .update(readFileSync(join(dir, 'report.json')))
      .digest('hex'),
    injection: {
      matched: true,
      actualReply: injection.expected,
      modelToolCalls: 0,
      diagnosticItems: injection.toolTypes.length,
    },
    role: {
      requestedAgentType: role.requestedAgentType,
      calls: role.calls,
      diagnosticItems: role.itemTypes.filter((type) => type === 'error').length,
    },
    limitations: [
      'Original run failed due to diagnostic-item/tool-item misclassification; original report preserved.',
      'Codex JSON omits agent_type: exact role is requested by prompt, not independently exposed in spawn events.',
      'Diagnostic messages were not persisted to avoid leaking local MCP/auth details.',
    ],
  }
  writeFileSync(join(dir, 'review.json'), `${JSON.stringify(review, null, 2)}\n`)
  console.log(
    `[installed-acceptance] RECORDED REVIEW PASS (not a new live run): ${join(dir, 'review.json')}`,
  )
  process.exit(0)
}
assert(
  process.argv.length === 2,
  'Usage: installed-acceptance.mjs [--review-recorded <evidence-dir>]',
  'experiment_error',
)
const id = randomUUID()
const scratch = mkdtempSync(join(tmpdir(), 'harnessed-installed-acceptance-'))
const evidence = join(root, '.planning/phases/68-installed-codex-acceptance', id)
mkdirSync(evidence, { recursive: true })
const env = { ...process.env, HARNESSED_PLATFORM: 'codex', HARNESSED_USER_LANG: 'zh-Hans' }
for (const key of Object.keys(env)) {
  if (
    /^(CODEX_(SESSION_ID|THREAD_ID)|THREAD_ID|CLAUDE_CODE_SESSION_ID|HARNESSED_ROOT_OVERRIDE)$/i.test(
      key,
    )
  )
    delete env[key]
}
const statePath = join(homedir(), '.codex/harnessed/workflows.json')
const report = { id, installed, scratch, evidence, commands: [], checks: [] }
const log = (text) => console.log(`[installed-acceptance] ${text}`)
const hash = (text) => createHash('sha256').update(text).digest('hex')
const save = () =>
  writeFileSync(join(evidence, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
function assert(ok, message, kind = 'product_defect') {
  if (!ok) throw Object.assign(new Error(message), { kind })
}

async function run(label, exe, args, cwd, input = '', timeout = 30_000) {
  const started = Date.now()
  const child = spawn(exe, args, { cwd, env, shell: false, windowsHide: true })
  let stdout = ''
  let stderr = ''
  let timedOut = false
  let spawnError = null
  let killer = null
  const timer = setTimeout(() => {
    timedOut = true
    if (process.platform === 'win32' && child.pid) {
      killer = new Promise((done) => {
        const kill = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        })
        kill.once('error', () => {
          child.kill()
          done()
        })
        kill.once('close', () => {
          child.kill()
          done()
        })
      })
    } else child.kill('SIGKILL')
  }, timeout)
  child.stdout.setEncoding('utf8').on('data', (data) => {
    stdout += data
  })
  child.stderr.setEncoding('utf8').on('data', (data) => {
    stderr += data
  })
  child.once('error', (error) => {
    spawnError = error.code
  })
  child.stdin.on('error', () => {})
  child.stdin.end(input)
  const result = await new Promise((done) =>
    child.once('close', (code, signal) => done({ code, signal })),
  )
  clearTimeout(timer)
  await killer
  // Do not persist raw model streams: local MCP/auth diagnostics can be sensitive.
  report.commands.push({
    label,
    ...result,
    timedOut,
    spawnError,
    durationMs: Date.now() - started,
    stdoutSha256: hash(stdout),
    stderrSha256: hash(stderr),
  })
  save()
  log(`${label}: exit=${result.code} timeout=${timedOut} duration=${Date.now() - started}ms`)
  assert(!spawnError, `${label}: ${spawnError}`, 'experiment_error')
  assert(!timedOut, `${label}: timeout`, 'environment_or_timeout')
  return { ...result, stdout, stderr }
}
const cli = (label, args, cwd, input) => run(label, installed, args, cwd, input)
function exit(result, expected, label) {
  assert(result.code === expected, `${label}: expected exit ${expected}, got ${result.code}`)
}
async function check(name, fn) {
  try {
    const details = await fn()
    report.checks.push({ name, status: 'pass', details })
    log(`PASS ${name}`)
  } catch (error) {
    report.checks.push({
      name,
      status: 'fail',
      kind: error.kind ?? 'experiment_error',
      message: error.message,
    })
    log(`FAIL ${name}: ${error.kind ?? 'experiment_error'}: ${error.message}`)
  }
  save()
}
function slot(cwd) {
  if (!existsSync(statePath)) return null
  const key = process.platform === 'win32' ? resolve(cwd).toLowerCase() : resolve(cwd)
  return JSON.parse(readFileSync(statePath, 'utf8')).workflows?.[key] ?? null
}
async function repo(name) {
  const cwd = join(scratch, name)
  mkdirSync(cwd)
  exit(await run(`git-init-${name}`, 'git', ['init', '--quiet', cwd], scratch), 0, 'git init')
  assert(!slot(cwd), 'Random scratch slot collision', 'experiment_error')
  return cwd
}
function turn(result, label) {
  exit(result, 0, label)
  const events = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
  const items = events.filter((event) => event.type === 'item.completed').map((event) => event.item)
  assert(
    events.some((event) => event.type === 'turn.completed'),
    `${label}: no turn.completed`,
  )
  assert(
    !events.some((event) => ['error', 'turn.failed'].includes(event.type)),
    `${label}: error event`,
  )
  return {
    items,
    final: items
      .filter((item) => item.type === 'agent_message')
      .at(-1)
      ?.text?.trim(),
  }
}

log(`Command: node scripts/codex-live/installed-acceptance.mjs`)
log(`Evidence: ${evidence}`)
log(`Scratch retained: ${scratch}`)
let workflow
let closed = false
async function finish() {
  assert(workflow && slot(workflow.cwd), 'Workflow was not seeded', 'experiment_error')
  const file = join(workflow.cwd, 'completion.txt')
  writeFileSync(file, '<promise>COMPLETE</promise>\n')
  const result = await cli(
    'checkpoint-COMPLETE',
    ['checkpoint', 'complete', workflow.sub, '--result-file', file],
    workflow.cwd,
  )
  exit(result, 0, 'positive promise')
  const current = slot(workflow.cwd)
  const sub = current?.sub_progress?.find((entry) => entry.sub === workflow.sub)
  assert(current?.status === 'complete' && sub?.status === 'done', 'Workflow not complete')
  closed = true
  assert(sub.evidence_status === 'none_declared', 'Expected none_declared (not artifact verified)')
  assert(sub.completion_claim === 'complete', 'Completion claim not recorded')
  const next = await cli('next-complete', ['next'], workflow.cwd)
  exit(next, 2, 'next complete')
  return {
    status: current.status,
    sub,
    nextExit: next.code,
    artifactEvidence: 'none_declared, not verified',
  }
}

try {
  const version = await cli('harnessed-version', ['--version'], scratch)
  exit(version, 0, 'harnessed version')
  assert(version.stdout.trim() === '4.49.1', 'Requires installed 4.49.1', 'environment_error')
  const codex = await run('codex-version', 'codex', ['--version'], scratch)
  exit(codex, 0, 'codex version')
  assert(
    /^codex-cli 0\.163\.\d+\s*$/.test(codex.stdout),
    'Requires codex-cli 0.163',
    'environment_error',
  )
  report.versions = { harnessed: version.stdout.trim(), codex: codex.stdout.trim() }
  assert(
    env.HARNESSED_OFF !== '1' && !env.HARNESSED_ALLOW_LONG_STATE,
    'Inherited exemption invalidates acceptance',
    'experiment_error',
  )
  const cwd = await repo('workflow')
  workflow = { cwd, master: `acceptance-${id}`, sub: `sentinel-${randomUUID()}` }
  report.workflow = workflow

  await check('checkpoint-negative-promise', async () => {
    const plan = {
      master: workflow.master,
      fire: [{ sub: workflow.sub, order: 1, mode: 'serial' }],
      skip: [],
    }
    exit(
      await cli(
        'checkpoint-start',
        ['checkpoint', 'start', workflow.master, '--plan', JSON.stringify(plan)],
        cwd,
      ),
      0,
      'checkpoint start',
    )
    assert(slot(cwd)?.sub_progress?.[0]?.status === 'pending', 'Random bare-key slot not seeded')
    const next = await cli('next-pending', ['next'], cwd)
    exit(next, 0, 'next pending')
    assert(next.stdout.includes(`SUB: ${workflow.sub}`), 'CLI next did not return sentinel')
    const rejected = await cli(
      'checkpoint-NOT_COMPLETE',
      ['checkpoint', 'complete', workflow.sub, '--result', 'NOT_COMPLETE'],
      cwd,
    )
    exit(rejected, 1, 'negative promise')
    assert(rejected.stderr.includes('completion promise not met'), 'Rejected for wrong reason')
    const after = slot(cwd)
    assert(
      after.status === 'active' && after.sub_progress?.[0]?.status === 'pending',
      'Rejected promise changed ledger to done',
    )
    return { exitCode: rejected.code, status: after.status, sub: after.sub_progress[0] }
  })

  await check('fresh-UserPromptSubmit-zero-tools-injection', async () => {
    assert(
      slot(cwd)?.sub_progress?.[0]?.status === 'pending',
      'Injection prerequisite missing',
      'experiment_error',
    )
    const prompt = [
      'Read-only installed-hook acceptance observation, not an execution task.',
      'Do not call any tools, spawn agents, inspect files, or read workflow state files.',
      'Use only the UserPromptSubmit hook context already attached to this turn.',
      'From its <workflow-state> block, return exactly the value on the next: line.',
      'Output only that value. No quotes, markdown, explanation, or completion promise.',
      'If no workflow-state is attached, output NO_WORKFLOW_CONTEXT. Do not guess.',
    ].join('\n')
    assert(!prompt.includes(workflow.sub), 'Sentinel leaked into prompt', 'experiment_error')
    writeFileSync(join(evidence, 'injection-prompt.txt'), `${prompt}\n`)
    const result = await run(
      'codex-hook-turn',
      'codex',
      ['exec', '--ephemeral', '--json', '--sandbox', 'read-only', '-C', cwd, '-'],
      cwd,
      prompt,
      180_000,
    )
    const observed = turn(result, 'hook turn')
    const toolTypes = observed.items
      .filter((item) => !nonToolTypes.includes(item.type))
      .map((item) => item.type)
    const details = {
      expected: workflow.sub,
      matched: observed.final === workflow.sub,
      replySha256: hash(observed.final ?? ''),
      toolTypes,
      diagnosticItems: observed.items.filter((item) => item.type === 'error').length,
    }
    writeFileSync(
      join(evidence, 'injection-observation.json'),
      `${JSON.stringify(details, null, 2)}\n`,
    )
    assert(toolTypes.length === 0, 'Model used tools: injection proof invalid', 'experiment_error')
    assert(details.matched, 'Model did not return hook-only sentinel')
    return {
      ...details,
      actualReply: observed.final,
      promptContainsSentinel: false,
      sandbox: 'read-only',
    }
  })

  await check('checkpoint-positive-promise-and-close', finish)

  await check('installed-doc-guard-json-deny', async () => {
    const guardCwd = await repo('doc-guard')
    mkdirSync(join(guardCwd, '.planning'))
    writeFileSync(
      join(guardCwd, '.planning/STATE.md'),
      `${Array.from({ length: 101 }, (_, i) => `line ${i + 1}`).join('\n')}\n`,
    )
    const payload = (command) =>
      JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd: guardCwd })
    const denied = await cli(
      'check-docs-deny',
      ['check-docs', '--hook', '--platform', 'codex'],
      guardCwd,
      payload('git commit -m acceptance-never-executed'),
    )
    exit(denied, 0, 'codex JSON deny transport')
    const verdict = JSON.parse(denied.stdout).hookSpecificOutput
    assert(
      verdict?.hookEventName === 'PreToolUse' && verdict.permissionDecision === 'deny',
      'Missing JSON deny',
    )
    assert(verdict.permissionDecisionReason.includes('state-digest-line-limit'), 'Wrong deny rule')
    const allowed = await cli(
      'check-docs-noncommit',
      ['check-docs', '--hook', '--platform', 'codex'],
      guardCwd,
      payload('git status --short'),
    )
    exit(allowed, 0, 'noncommit control')
    assert(!allowed.stdout.trim(), 'Noncommit should not be gated')
    return {
      exitCode: denied.code,
      decision: verdict.permissionDecision,
      rule: 'state-digest-line-limit',
      stateLines: 101,
      noncommitControl: 'pass',
      commitExecuted: false,
    }
  })

  await check('installed-harnessed-task-code-spawn', async () => {
    const roleCwd = await repo('role')
    const prompt = [
      'Installed role reachability acceptance only. Do not implement code or change files.',
      'Use spawn_agent exactly once with agent_type="harnessed-task-code".',
      'The child message must say: Read-only observation only. Do not call tools, edit files, or run commands. Reply exactly ROLE_READ_ONLY_REACHED.',
      'Wait for the child, close it, then reply exactly ROLE_READ_ONLY_REACHED.',
      'Do not fall back to another agent_type, shell command, or uninstalled role.',
      'Do not use any shell, file, browser, MCP, or network tools in the parent turn.',
    ].join('\n')
    writeFileSync(join(evidence, 'role-prompt.txt'), `${prompt}\n`)
    const result = await run(
      'codex-role-turn',
      'codex',
      ['exec', '--ephemeral', '--json', '-C', roleCwd, '-'],
      roleCwd,
      prompt,
      180_000,
    )
    const observed = turn(result, 'role turn')
    const calls = observed.items.filter((item) => item.type === 'collab_tool_call')
    const spawns = calls.filter((item) => item.tool === 'spawn_agent')
    // Retain the event schema, not arbitrary prompts/messages or thread contents.
    const details = {
      requestedAgentType: 'harnessed-task-code',
      itemTypes: observed.items.map((item) => item.type),
      callFields: calls.map((item) => Object.keys(item)),
      calls: calls.map((item) => ({
        tool: item.tool,
        status: item.status,
        receivers: item.receiver_thread_ids?.length,
      })),
      roleNameInEvents: JSON.stringify(spawns).includes('harnessed-task-code'),
      roleTypeEvidence: 'Requested exact type; Codex JSON does not expose agent_type',
      finalMatched: observed.final === 'ROLE_READ_ONLY_REACHED',
      sandbox: 'inherited default',
    }
    writeFileSync(join(evidence, 'role-observation.json'), `${JSON.stringify(details, null, 2)}\n`)
    assert(spawns.length === 1, 'Expected exactly one collab spawn_agent')
    assert(
      spawns[0].status === 'completed' && spawns[0].receiver_thread_ids?.length === 1,
      'Role spawn did not complete',
    )
    assert(
      calls.some((item) => item.tool === 'wait' && item.status === 'completed'),
      'Child not awaited',
    )
    assert(
      calls.some((item) => item.tool === 'close_agent' && item.status === 'completed'),
      'Child not closed',
    )
    assert(
      observed.items.every((item) => [...nonToolTypes, 'collab_tool_call'].includes(item.type)),
      'Role probe used prohibited tools',
      'experiment_error',
    )
    assert(details.finalMatched, 'Role marker missing')
    return details
  })
} catch (error) {
  report.checks.push({
    name: 'preflight',
    status: 'fail',
    kind: error.kind ?? 'experiment_error',
    message: error.message,
  })
  log(`FAIL preflight: ${error.kind ?? 'experiment_error'}: ${error.message}`)
} finally {
  if (workflow && !closed && slot(workflow.cwd))
    await check('finally-close-own-scratch-workflow', finish)
  report.status = report.checks.every((entry) => entry.status === 'pass') ? 'pass' : 'fail'
  report.finishedAt = new Date().toISOString()
  save()
  log(
    `RESULT ${report.status.toUpperCase()} ${report.checks.filter((entry) => entry.status === 'pass').length}/${report.checks.length}`,
  )
  log(`Report: ${join(evidence, 'report.json')}`)
  log(`Scratch retained without deletion: ${scratch}`)
  process.exitCode = report.status === 'pass' ? 0 : 1
}
