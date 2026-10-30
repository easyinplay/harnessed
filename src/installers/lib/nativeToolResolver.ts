import {
  accessSync,
  closeSync,
  constants,
  existsSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

interface ToolContext {
  platform?: NodeJS.Platform
  env?: NodeJS.ProcessEnv
  cwd?: string
}

interface ToolResolution {
  path: string | null
  windows: boolean
  needsNode: boolean
}

const NODE_TOOLS = new Set(['node', 'npm', 'npx', 'corepack', 'pnpm', 'yarn'])
const NODE_GUIDANCE =
  'Install Linux-native Node.js 22+ inside Linux/WSL (for example with nvm), then ensure its bin directory precedes Windows entries on PATH and rerun harnessed setup. No PATH changes or automatic Node installation were made.'

function launcherHeader(path: string): string {
  let fd: number | undefined
  try {
    fd = openSync(path, 'r')
    const buffer = Buffer.alloc(4096)
    return buffer.subarray(0, readSync(fd, buffer, 0, buffer.length, 0)).toString('utf8')
  } catch {
    return ''
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

export function isWindowsToolPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/')
  if (/\.(?:cmd|bat|exe)$/i.test(normalized) || /^[a-z]:\//i.test(normalized)) return true
  if (/\/AppData\/Roaming\/npm\//i.test(normalized)) return true
  if (
    /^\/mnt\/[a-z]\//i.test(normalized) &&
    /\/(?:nodejs|node_modules\/npm|AppData\/Local\/(?:nvm|fnm)|nvm(?:-windows)?)(?:\/|$)/i.test(
      normalized,
    )
  )
    return true
  const directory = dirname(path)
  if (existsSync(join(directory, 'node.exe'))) return true
  if (existsSync(`${path}.cmd`) && existsSync(`${path}.ps1`)) return true
  const header = launcherHeader(path)
  return header.startsWith('MZ') || /(?:[/$"']node\.exe|\$basedir\/node\$exe)/i.test(header)
}

export function resolveNativeTool(binary: string, context: ToolContext = {}): ToolResolution {
  const platform = context.platform ?? process.platform
  if (platform !== 'linux') return { path: binary, windows: false, needsNode: false }
  const cwd = context.cwd ?? process.cwd()
  const env = context.env ?? process.env
  const candidates = binary.includes('/')
    ? [resolve(cwd, binary)]
    : (env.PATH ?? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin')
        .split(':')
        .map((directory) => resolve(cwd, directory || '.', binary))
  for (const path of candidates) {
    try {
      if (!statSync(path).isFile()) continue
      accessSync(path, constants.X_OK)
      const target = realpathSync(path)
      return {
        path,
        windows: isWindowsToolPath(path) || isWindowsToolPath(target),
        needsNode:
          NODE_TOOLS.has(basename(binary)) || /^#![^\n]*\bnode\b/.test(launcherHeader(target)),
      }
    } catch {}
  }
  return { path: null, windows: false, needsNode: NODE_TOOLS.has(basename(binary)) }
}

export class NativeToolError extends Error {
  constructor(
    message: string,
    readonly keyword: 'native-tool-windows' | 'native-runtime-missing',
  ) {
    super(message)
  }
}

export function requireNativeTool(binary: string, context: ToolContext = {}): string | null {
  const tool = resolveNativeTool(binary, context)
  if (tool.windows) {
    throw new NativeToolError(
      `Linux/WSL cannot use Windows launcher for ${binary}: ${tool.path}. ${NODE_GUIDANCE}`,
      'native-tool-windows',
    )
  }
  if (tool.needsNode && tool.path === null) {
    throw new NativeToolError(
      `Missing Linux-native runtime/tool: ${binary}. ${NODE_GUIDANCE}`,
      'native-runtime-missing',
    )
  }
  if (tool.needsNode && basename(binary) !== 'node') requireNativeTool('node', context)
  return tool.path
}

function shellWords(command: string): { raw: string; word: string }[] {
  return (
    command.match(
      /#[^\n]*|\d*[<>]+|(?:[^\s"'\\;&|()<>]+|"(?:\\.|[^"\\])*"|'[^']*'|\\.)+|[;&|()\n]/g,
    ) ?? []
  ).map((raw) => ({
    raw,
    word: raw.replace(/"((?:\\.|[^"\\])*)"|'([^']*)'|\\(.)/g, (_match, double, single, escaped) =>
      double !== undefined ? double.replace(/\\(["\\$`])/g, '$1') : (single ?? escaped),
    ),
  }))
}

export function checkNativeCommand(command: string, context: ToolContext = {}): void {
  if ((context.platform ?? process.platform) !== 'linux') return
  const words = shellWords(command)
  let commandStart = true
  let baseContext = context
  let effectiveContext = context
  const prefixes = new Set([
    'if',
    'then',
    'elif',
    'else',
    'while',
    'until',
    'do',
    '!',
    'exec',
    'command',
    '{',
    '}',
  ])
  for (let index = 0; index < words.length; index++) {
    const { raw, word } = words[index] ?? { raw: '', word: '' }
    if (raw.startsWith('#')) continue
    if (/^[;&|()\n]$/.test(raw)) {
      if (commandStart) baseContext = effectiveContext
      commandStart = true
      effectiveContext = baseContext
      continue
    }
    if (/^\d*[<>]+$/.test(raw)) {
      index++
      continue
    }
    if (!commandStart) continue
    if (prefixes.has(raw)) {
      if (word === 'command' && words[index + 1]?.word === '--') index++
      continue
    }
    const assignment = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s.exec(word)
    if (assignment?.[1]) {
      effectiveContext = {
        ...effectiveContext,
        env: { ...(effectiveContext.env ?? process.env), [assignment[1]]: assignment[2] },
      }
      continue
    }
    requireNativeTool(word, effectiveContext)
    if (basename(word) === 'env') {
      while (words[index + 1]?.word.startsWith('-')) {
        const flag = words[++index]?.word
        if (flag === '-u' || flag === '--unset') {
          const key = words[++index]?.word
          const env = { ...(effectiveContext.env ?? process.env) }
          if (key) delete env[key]
          effectiveContext = { ...effectiveContext, env }
        } else if (flag === '-i' || flag === '--ignore-environment') {
          effectiveContext = { ...effectiveContext, env: {} }
        }
      }
      continue
    }
    if (['sh', 'bash', 'dash'].includes(basename(word))) {
      const flag = words[index + 1]?.word
      const script = words[index + 2]?.word
      if (flag?.startsWith('-') && flag.includes('c') && script)
        checkNativeCommand(script, effectiveContext)
    }
    commandStart = false
  }
}
