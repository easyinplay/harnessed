#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated

// src/checkpoint/stopHookMain.ts
import { createHash } from "node:crypto";
import {
  existsSync as existsSync2,
  mkdirSync,
  readFileSync as readFileSync2,
  writeFileSync,
} from 'node:fs'
import { join as join2 } from 'node:path'

// src/platform/ablation.ts
function isAblated(env = process.env) {
  return env.HARNESSED_OFF === '1'
}

// src/platform/platform.ts
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
function claudeDescriptor(home = homedir()) {
  const claudeHome = join(home, '.claude')
  return {
    id: 'claude',
    homeDir: claudeHome,
    stateRoot: join(claudeHome, 'harnessed'),
    settingsPath: join(claudeHome, 'settings.json'),
    skillsDir: join(claudeHome, 'skills'),
    commandsDir: join(claudeHome, 'commands'),
    pluginsRegistry: join(claudeHome, 'plugins', 'installed_plugins.json'),
    // mcpConfigPath is a SIBLING of `.claude` (`<home>/.claude.json`), based on
    // the same home base — not a child of homeDir.
    mcpConfigPath: join(home, '.claude.json'),
    // claude writes its env keys into JSON settings.json (capability present).
    supportsEnvKeyWrite: true,
    // Claude Code exposes the active session id to Bash-invoked CLI + hooks.
    sessionIdEnv: 'CLAUDE_CODE_SESSION_ID',
  }
}
function codexDescriptor(home = homedir()) {
  const codexHome = join(home, '.codex')
  const configToml = join(codexHome, 'config.toml')
  return {
    id: 'codex',
    homeDir: codexHome,
    stateRoot: join(codexHome, 'harnessed'),
    settingsPath: null,
    // SHARED convention dir, NOT <homeDir>/skills.
    skillsDir: join(home, '.agents', 'skills'),
    commandsDir: join(codexHome, 'prompts'),
    pluginsRegistry: null,
    mcpConfigPath: configToml,
    supportsEnvKeyWrite: false,
    // Measured on codex-cli 0.154: codex shells carry it, equal to hook session_id.
    sessionIdEnv: 'CODEX_SESSION_ID',
  }
}
function descriptorById(id, home) {
  if (id === 'claude') return claudeDescriptor(home)
  if (id === 'codex') return codexDescriptor(home)
  return void 0
}
function detectPlatform(home = homedir()) {
  const resolved = resolveHost(home)
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== void 0 && override !== '') return { ...resolved, stateRoot: override }
  return resolved
}
function resolveHost(home) {
  const base = claudeDescriptor(home)
  const envPlatform = process.env.HARNESSED_PLATFORM
  if (envPlatform !== void 0 && envPlatform !== '') {
    const d = descriptorById(envPlatform, home)
    if (d) return d
  }
  const inClaude = Boolean(process.env.CLAUDE_CODE_SESSION_ID?.trim())
  const inCodex = Boolean(process.env.CODEX_SESSION_ID?.trim())
  if (inClaude !== inCodex) return inClaude ? base : codexDescriptor(home)
  for (const pinRoot of [codexDescriptor(home).stateRoot, base.stateRoot]) {
    try {
      const d = descriptorById(readFileSync(join(pinRoot, '.platform'), 'utf8').trim(), home)
      if (d) return d
    } catch {}
  }
  try {
    if (existsSync(base.homeDir)) return base
    const codex = codexDescriptor(home)
    if (existsSync(codex.homeDir)) return codex
  } catch {}
  return base
}

// src/checkpoint/modeBDetect.ts
var TAIL_WINDOW = 200
var INVOKE_RE = /<invoke name="/g
var PARAM_RE = /<parameter name="/g
function stripCode(s) {
  return s.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
}
function lastIndexOfRe(s, re) {
  let last = -1
  re.lastIndex = 0
  for (let m = re.exec(s); m !== null; m = re.exec(s)) last = m.index
  return last
}
function detectModeB(content) {
  if (!Array.isArray(content) || content.length === 0) return false
  if (content.some((b) => b && b.type === 'tool_use')) return false
  const text = content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
  if (text.length === 0) return false
  const stripped = stripCode(text)
  if (stripped.length === 0) return false
  const invokeAt = lastIndexOfRe(stripped, INVOKE_RE)
  const paramAt = lastIndexOfRe(stripped, PARAM_RE)
  if (invokeAt < 0 || paramAt < 0) return false
  const lastTag = Math.max(invokeAt, paramAt)
  return stripped.length - lastTag <= TAIL_WINDOW
}

// src/checkpoint/stopHookMain.ts
var MAX_RETRIES = 2
function stateRoot() {
  return detectPlatform().stateRoot
}
function messageSig(content) {
  const text = content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}
function lastAssistantContent(transcriptPath) {
  try {
    if (!transcriptPath || !existsSync2(transcriptPath)) return null
    const buf = readFileSync2(transcriptPath)
    const slice = buf.length > 262144 ? buf.subarray(buf.length - 262144) : buf
    const lines = slice.toString('utf8').split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = (lines[i] ?? '').trim()
      if (!line) continue
      let obj
      try {
        obj = JSON.parse(line)
      } catch {
        continue
      }
      if (obj && obj.type === 'assistant') {
        const content = obj.message?.content ?? obj.content
        return Array.isArray(content) ? content : null
      }
    }
  } catch {}
  return null
}
function retryStore(sessionId) {
  const id = createHash('sha256')
    .update(String(sessionId ?? 'nosession'))
    .digest('hex')
    .slice(0, 16)
  return join2(stateRoot(), 'stop-hook-retries', `${id}.json`)
}
function readRetry(path) {
  try {
    if (!existsSync2(path)) return { sig: '', count: 0 }
    const j = JSON.parse(readFileSync2(path, 'utf8'))
    return { sig: typeof j.sig === 'string' ? j.sig : '', count: Number(j.count) || 0 }
  } catch {
    return { sig: '', count: 0 }
  }
}
function writeRetry(path, sig, count) {
  try {
    mkdirSync(join2(path, '..'), { recursive: true })
    writeFileSync(path, JSON.stringify({ sig, count }), 'utf8')
    return true
  } catch {
    return false
  }
}
function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    if (process.stdin.isTTY) return resolve('')
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => {
      data += c
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
    setTimeout(() => resolve(data), 2e3).unref?.()
  })
}
async function main() {
  if (isAblated()) return
  const raw = await readStdin()
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return
  }
  if (payload.stop_hook_active === true) return
  const content = lastAssistantContent(payload.transcript_path)
  if (!content || !detectModeB(content)) return
  const sig = messageSig(content)
  const store = retryStore(payload.session_id)
  const prev = readRetry(store)
  const count = prev.sig === sig ? prev.count : 0
  if (count >= MAX_RETRIES) return
  const saved = writeRetry(store, sig, count + 1)
  if (!saved) return
  process.stdout.write(
    `${JSON.stringify({
      decision: 'block',
      reason:
        'MODE-B tool corruption detected: your previous message emitted a tool call as plain text (the opening delimiter was mis-sampled to a garbage word). Re-emit that exact same tool call now as a real tool call \u2014 content unchanged.',
    })}
`,
  )
}
main().catch(() => {})
