import { type ChildProcess, spawn as nodeSpawn } from 'node:child_process'
import { relative, resolve } from 'node:path'
import { killProcessTree } from '../../installers/lib/killTree.js'
import { planWindowsSpawn, resolveWindowsBin } from '../../installers/lib/winSpawn.js'
import {
  type AgentRepairResult,
  assertRepairRoots,
  createAgentRepairResult,
  createRepairProposal,
  type RepairRequest,
  validateRepairAuthorization,
} from './agentRepair.js'

export interface AgentRepairRunnerOptions {
  timeoutMs?: number
  spawn?: typeof nodeSpawn
  verify?: (request: RepairRequest) => Promise<boolean>
}

interface SpawnObservation {
  exitCode: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

const MAX_OUTPUT_BYTES = 512 * 1024
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000

export async function runAgentRepair(
  request: RepairRequest,
  options: AgentRepairRunnerOptions = {},
): Promise<AgentRepairResult> {
  const proposal = createRepairProposal(request)
  const authorizationError = validateRepairAuthorization(request.authorization, request.components)
  if (authorizationError)
    return createAgentRepairResult({
      requested: true,
      authorized: false,
      components: proposal.components,
      execution: request.host,
      status: 'not-authorized',
      reasonCode: authorizationError,
      proposal,
    })
  assertRepairRoots(request.hostRoot, request.allowedRoots)

  const prompt = buildRepairPrompt(request)
  const command = request.host === 'claude' ? 'claude' : 'codex'
  const rawArgs =
    request.host === 'claude'
      ? ['-p', prompt, '--output-format', 'json']
      : [
          'exec',
          '--ephemeral',
          '--json',
          '--skip-git-repo-check',
          '--sandbox',
          'workspace-write',
          prompt,
        ]
  const planned =
    process.platform === 'win32'
      ? planWindowsSpawn(command, rawArgs, resolveWindowsBin(command))
      : { command, args: rawArgs }
  let observation: SpawnObservation
  try {
    observation = await spawnAgent(planned.command, planned.args, request.hostRoot, {
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      spawn: options.spawn ?? nodeSpawn,
    })
  } catch (error) {
    return createAgentRepairResult({
      requested: true,
      authorized: true,
      components: proposal.components,
      execution: request.host,
      status: 'failed',
      reasonCode: error instanceof Error ? error.message : 'agent-spawn-failed',
      proposal,
    })
  }
  if (observation.exitCode !== 0 || observation.signal !== null)
    return createAgentRepairResult({
      requested: true,
      authorized: true,
      components: proposal.components,
      execution: request.host,
      status: 'failed',
      reasonCode: `agent-exit-${observation.exitCode ?? observation.signal ?? 'unknown'}`,
      proposal,
    })

  const verified = options.verify ? await options.verify(request) : false
  return createAgentRepairResult({
    requested: true,
    authorized: true,
    components: proposal.components,
    execution: request.host,
    status: verified ? 'completed' : 'verification-failed',
    verified,
    reasonCode: verified ? null : 'post-repair-verification-failed',
    proposal,
  })
}

function buildRepairPrompt(request: RepairRequest): string {
  const components = request.components.map(({ id, status, reasonCode }) => ({
    id,
    status,
    reasonCode,
  }))
  return [
    'You are performing a bounded harnessed third-party component repair.',
    'Repair only the listed components and only their existing host-owned targets.',
    'Do not install unrelated components, read credentials, change trust, or modify MCP trust.',
    'Do not expand the host root or use shell commands assembled from user input.',
    `Host: ${request.host}`,
    `Host root: ${resolve(request.hostRoot)}`,
    `Allowed roots: ${request.allowedRoots.map((root) => resolve(root)).join(', ')}`,
    `Components: ${JSON.stringify(components)}`,
    'When the upstream requires trust or credentials, stop and report the blocker.',
    'After repair, leave a concise machine-readable summary in your final response.',
  ].join('\n')
}

async function spawnAgent(
  command: string,
  args: string[],
  cwd: string,
  options: { timeoutMs: number; spawn: typeof nodeSpawn },
): Promise<SpawnObservation> {
  const child = options.spawn(command, args, {
    cwd,
    env: safeAgentEnvironment(),
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return new Promise((resolveObservation, rejectObservation) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const timer = setTimeout(() => {
      void killProcessTree(child)
      finish({ exitCode: null, signal: 'SIGTERM', stdout, stderr: `${stderr}\nagent-timeout` })
    }, options.timeoutMs)
    timer.unref()
    const append = (target: 'stdout' | 'stderr', chunk: Buffer) => {
      const next = target === 'stdout' ? stdout + chunk.toString() : stderr + chunk.toString()
      if (Buffer.byteLength(next) > MAX_OUTPUT_BYTES) {
        void killProcessTree(child)
        finish({
          exitCode: null,
          signal: 'SIGTERM',
          stdout,
          stderr: `${stderr}\nagent-output-too-large`,
        })
        return
      }
      if (target === 'stdout') stdout = next
      else stderr = next
    }
    const finish = (observation: SpawnObservation) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolveObservation(observation)
    }
    child.stdout?.on('data', (chunk: Buffer) => append('stdout', chunk))
    child.stderr?.on('data', (chunk: Buffer) => append('stderr', chunk))
    child.once('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      rejectObservation(error)
    })
    child.once('close', (exitCode, signal) => finish({ exitCode, signal, stdout, stderr }))
  })
}

function safeAgentEnvironment(): NodeJS.ProcessEnv {
  const blocked = /(key|token|secret|password|credential|authorization|cookie)/i
  const keep =
    /^(PATH|Path|PATHEXT|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|TEMP|TMP|SYSTEMROOT|COMSPEC|CODEX_HOME|CLAUDE_CONFIG_DIR|HARNESSED_[A-Z0-9_]+|NODE_PATH)$/
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => keep.test(key) && !blocked.test(key)),
  )
}

export function isPathWithinRoot(candidate: string, root: string): boolean {
  const relativePath = relative(resolve(root), resolve(candidate))
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.includes(':'))
}

export type { ChildProcess }
