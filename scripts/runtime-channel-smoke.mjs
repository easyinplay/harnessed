#!/usr/bin/env node
// Only first-party hook installs into mkdtemp homes; never installs upstreams.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { delimiter, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CASES,
  channelsFor,
  cleanupFixture,
  createFixture,
  runCommand,
  runMain,
  succeeded,
} from './benchmark-runtime.mjs'

export function parseOwnedHook(command, identity, channel) {
  const normalized = command.replace(/\\/g, '/')
  if (!['stop-hook', 'inject-state', 'check-docs'].includes(identity))
    throw new Error('Not an owned smoke hook')
  const tail = identity === 'check-docs' ? ['--hook'] : []
  const suffix = tail.length ? ` ${tail.join(' ')}` : ''
  if (channel.id === 'bun-compiled') {
    if (normalized !== `"${channel.executable.replace(/\\/g, '/')}" ${identity}${suffix}`)
      throw new Error(`Unexpected compiled ${identity} registration: ${command}`)
    return { executable: channel.executable, args: [identity, ...tail] }
  }
  if (channel.id === 'node-npm' && identity === 'check-docs') {
    if (command !== 'harnessed check-docs --hook')
      throw new Error('Unexpected npm check-docs registration')
    return { executable: 'harnessed', args: ['check-docs', '--hook'] }
  }
  const script = join(channel.packageRoot, 'bin', `harnessed-${identity}.mjs`)
  const runtime = channel.id === 'bun-explicit' ? 'bun' : 'node'
  if (!isAbsolute(script) || normalized !== `${runtime} "${script.replace(/\\/g, '/')}"${suffix}`)
    throw new Error(`Unexpected ${channel.id} ${identity} registration: ${command}`)
  return { executable: runtime, args: [script, ...tail] }
}

export async function createRuntimeTraps(
  fixture,
  blocked,
  nodeExecutable = process.execPath,
  bunExecutable = null,
) {
  const tools = join(fixture.root, 'tools')
  mkdirSync(tools)
  const logPath = join(fixture.root, 'runtime-traps.log')
  writeFileSync(logPath, '')
  const windows = process.platform === 'win32'
  // Remove entire runtime-bearing PATH entries so a direct spawn cannot skip a
  // Windows .cmd trap and resolve a later .exe. Keep the remaining system tools.
  const retained = (fixture.env.PATH ?? '').split(delimiter).filter((dir) => {
    if (!dir || !isAbsolute(dir)) return false
    return (
      !windows ||
      !['node', 'nodejs', 'bun', 'bunx'].some((name) => existsSync(join(dir, `${name}.exe`)))
    )
  })
  fixture.env.PATH = [tools, ...retained].join(delimiter)
  fixture.env.RUNTIME_TRAP_LOG = logPath
  for (const name of blocked) {
    if (!['node', 'bun', 'bunx', 'nodejs'].includes(name)) throw new Error('Invalid trap runtime')
    const text = windows
      ? `@echo off\r\necho ${name}>>"%RUNTIME_TRAP_LOG%"\r\nexit /b 97\r\n`
      : `#!/bin/sh\nprintf '%s\\n' '${name}' >> "$RUNTIME_TRAP_LOG"\nexit 97\n`
    writeFileSync(join(tools, `${name}${windows ? '.cmd' : ''}`), text, { mode: 0o755 })
  }
  // npm hook registrations intentionally use bare `node`, not the benchmark
  // driver's absolute path. Supply only the approved runtime in controlled PATH.
  if (!blocked.includes('node'))
    copyFileSync(nodeExecutable, join(tools, windows ? 'node.exe' : 'node'))
  if (bunExecutable && !blocked.includes('bun'))
    copyFileSync(bunExecutable, join(tools, windows ? 'bun.exe' : 'bun'))
  const probes = blocked.map((name) =>
    windows
      ? {
          name,
          executable:
            fixture.env.ComSpec ??
            fixture.env.COMSPEC ??
            join(fixture.env.SystemRoot ?? fixture.env.SYSTEMROOT, 'System32', 'cmd.exe'),
          args: ['/d', '/c', `${name} --version`],
        }
      : { name, executable: name, args: ['--version'] },
  )
  return {
    logPath,
    tools,
    probes,
    policy: windows
      ? 'runtime-bearing PATH entries removed; .cmd probes cover shell lookups only; missing runtime .exe attempts can fail without logging; owned paths must succeed; empty log does not prove zero attempts'
      : 'executable traps precede original PATH; system tools retained',
  }
}

function registration(settings, event) {
  const groups = settings.hooks?.[event]
  if (
    !Array.isArray(groups) ||
    groups.length !== 1 ||
    groups[0].command !== undefined ||
    !Array.isArray(groups[0].hooks) ||
    groups[0].hooks.length !== 1 ||
    groups[0].hooks[0].type !== 'command'
  )
    throw new Error(`Invalid ${event} nested hook registration`)
  const command = groups[0].hooks[0].command
  if (typeof command !== 'string') throw new Error(`Missing ${event} command`)
  return command
}

function requireSuccess(result, label) {
  if (!succeeded(result)) throw new Error(`${label} failed: ${JSON.stringify(result)}`)
}

export async function smokeChannel(channel, options) {
  const fixture = createFixture()
  const steps = []
  const hooks = []
  let failure = null
  let trapInfo = null
  try {
    const blocked =
      channel.id === 'bun-compiled'
        ? ['bun', 'bunx', 'node', 'nodejs']
        : channel.id === 'bun-explicit'
          ? ['node', 'nodejs', 'bunx']
          : ['bun', 'bunx']
    const traps = await createRuntimeTraps(fixture, blocked, options.node, options.bun)
    trapInfo = { blocked, policy: traps.policy, probes: [] }
    for (const probe of traps.probes) {
      const result = await runCommand(probe.executable, probe.args, fixture, options)
      trapInfo.probes.push({ name: probe.name, ...result })
      if (result.exitCode !== 97 || result.timedOut || result.outputLimitExceeded)
        throw new Error(`Runtime trap did not intercept ${probe.name}`)
    }
    writeFileSync(traps.logPath, '')
    const run = async (label, args) => {
      const result = await runCommand(
        channel.executable,
        [...channel.prefix, ...args],
        fixture,
        options,
      )
      steps.push({ label, args, ...result })
      requireSuccess(result, label)
      return result
    }
    for (const entry of CASES) {
      const result = await run(entry.id, entry.args)
      if (entry.id === 'version' && !/^\d+\.\d+\.\d+/m.test(result.stdout))
        throw new Error('Missing version output')
      if (entry.id === 'gates') {
        const plan = JSON.parse(result.stdout)
        if (plan.master !== 'task' || !Array.isArray(plan.fire) || !Array.isArray(plan.skip))
          throw new Error('Invalid gates plan')
      }
      if (entry.id === 'prompt') {
        const prompt = JSON.parse(result.stdout)
        if (typeof prompt.prompt !== 'string' || !prompt.prompt.includes('Inspect a local fixture'))
          throw new Error('Invalid prompt output')
      }
    }
    await run('install-stop-hook', ['install', 'stop-hook-recover', '--non-interactive'])
    await run('install-inject-hook', ['install', 'perturn-inject', '--non-interactive'])
    const settings = JSON.parse(
      readFileSync(join(fixture.home, '.claude', 'settings.json'), 'utf8'),
    )
    for (const [event, identity] of [
      ['Stop', 'stop-hook'],
      ['UserPromptSubmit', 'inject-state'],
    ]) {
      const command = registration(settings, event)
      const invocation = parseOwnedHook(command, identity, channel)
      const transcript = join(fixture.root, 'transcript.jsonl')
      writeFileSync(
        transcript,
        `${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: '<invoke name="read"><parameter name="path">fixture</parameter></invoke>' }] } })}\n`,
      )
      const stdin = JSON.stringify({
        session_id: 'runtime-smoke',
        cwd: fixture.cwd,
        transcript_path: transcript,
      })
      const result = await runCommand(invocation.executable, invocation.args, fixture, {
        ...options,
        stdin,
      })
      hooks.push({ event, identity, command, invocation, result })
      requireSuccess(result, identity)
      if (identity === 'stop-hook') {
        if (JSON.parse(result.stdout).decision !== 'block')
          throw new Error('Stop hook did not detect corrupt tool text')
        // A real state-root write, not the hook's fail-soft empty success path.
        const retries = join(fixture.state, 'stop-hook-retries')
        if (
          !existsSync(retries) ||
          !readdirSync(retries).some(
            (f) => JSON.parse(readFileSync(join(retries, f), 'utf8')).count === 1,
          )
        )
          throw new Error('Stop hook ignored isolated state root')
        const second = await runCommand(invocation.executable, invocation.args, fixture, {
          ...options,
          stdin,
        })
        const third = await runCommand(invocation.executable, invocation.args, fixture, {
          ...options,
          stdin,
        })
        hooks.at(-1).retryResults = [second, third]
        requireSuccess(second, 'Stop retry')
        requireSuccess(third, 'Stop retry cap')
        if (JSON.parse(second.stdout).decision !== 'block' || third.stdout.trim() !== '')
          throw new Error('Stop retry cap did not persist')
      } else if (!result.stdout.includes('<workflow-intent>') || !result.stdout.includes('/task')) {
        throw new Error('Inject hook did not read the checkpoint intent')
      }
    }
    trapInfo.unexpectedCalls = readFileSync(traps.logPath, 'utf8')
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
    if (trapInfo.unexpectedCalls.length) throw new Error('A channel attempted a blocked runtime')
  } catch (error) {
    failure = error.message
  } finally {
    cleanupFixture(fixture)
  }
  return {
    channel: channel.id,
    ok: failure === null,
    error: failure,
    fixture: { root: fixture.root, cleanup: 'completed' },
    traps: trapInfo,
    steps,
    hooks,
  }
}

export async function smoke(options) {
  const results = []
  for (const channel of channelsFor(options)) results.push(await smokeChannel(channel, options))
  return {
    schemaVersion: 1,
    kind: 'runtime-channel-smoke',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    results,
    scope:
      'core commands + real owned hook install/registration/execution; no upstream install, model, network probe or global writes',
    limitations: [
      'PATH absence/traps do not sandbox absolute executable paths or OS networking',
      'unexpectedCalls records observed trap hits only; on Windows missing .exe attempts need not hit .cmd traps, so an empty log does not prove zero attempts',
      'Upstream tools may require their own Node/Bun/git/bash; not certified here',
      'Claude settings hook surface tested; Codex plugin registration/trust not exercised',
    ],
    ok: results.every((r) => r.ok),
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runMain('runtime-channel-smoke', smoke)
