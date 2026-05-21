// v3.3.1 hotfix — auto-enable Agent Teams in ~/.claude/settings.json during `harnessed setup`.
// Sister checkAgentTeams.ts (Phase 2.3 W0.5 SHIPPED): mirror probe logic but WRITE-side.
// Q-AUDIT-5b LOCKED: schema is root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
// NOT nested `experimental.*`.
//
// Behavior (3 case + non-destructive merge):
//   (a) file 不存在 → create with `{env: {CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"}}`
//   (b) file 存在 + env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1" → idempotent no-op
//   (c) file 存在 + 缺 key OR key !== "1" → backup original + merge add/update key
//
// Backup goes to `~/.claude/harnessed/backups/settings.json.{ISO-ts}.bak` (sister v3.0.3
// getHarnessedRoot pattern via harnessedSubdir). Atomic write via tmpPath + rename.
// Any error → warn + skip (sister fallback 铁律 1 透明声明), NOT throw — non-blocking setup.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { harnessedSubdir } from '../../installers/lib/harnessedRoot.js'

export type EnableResult =
  | { status: 'created'; path: string }
  | { status: 'already-enabled'; path: string }
  | { status: 'enabled'; path: string; backupPath: string }
  | { status: 'warn'; message: string }

function settingsPath(): string {
  return resolve(homedir(), '.claude', 'settings.json')
}

export async function enableAgentTeamsInSettings(): Promise<EnableResult> {
  const path = settingsPath()
  let raw: string | undefined
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      return { status: 'warn', message: `read ${path} failed: ${(err as Error).message}` }
    }
    // Case (a): file does not exist → create fresh.
    return createFreshSettings(path)
  }

  let data: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { status: 'warn', message: `${path} is not a JSON object` }
    }
    data = parsed as Record<string, unknown>
  } catch (err) {
    return { status: 'warn', message: `${path} malformed JSON: ${(err as Error).message}` }
  }

  const env = (data.env ?? {}) as Record<string, unknown>
  if (env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1') {
    return { status: 'already-enabled', path } // Case (b): idempotent.
  }

  // Case (c): backup original + merge add/update key (non-destructive).
  const backupPath = await backupOriginal(raw)
  if (backupPath.status === 'warn') return backupPath

  data.env = { ...env, CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' }
  const writeErr = await atomicWrite(path, `${JSON.stringify(data, null, 2)}\n`)
  if (writeErr) return { status: 'warn', message: writeErr }

  return { status: 'enabled', path, backupPath: backupPath.path }
}

async function createFreshSettings(path: string): Promise<EnableResult> {
  const data = { env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }
  try {
    await mkdir(join(homedir(), '.claude'), { recursive: true })
  } catch (err) {
    return { status: 'warn', message: `mkdir ~/.claude failed: ${(err as Error).message}` }
  }
  const writeErr = await atomicWrite(path, `${JSON.stringify(data, null, 2)}\n`)
  if (writeErr) return { status: 'warn', message: writeErr }
  return { status: 'created', path }
}

async function backupOriginal(
  raw: string,
): Promise<{ status: 'ok'; path: string } | { status: 'warn'; message: string }> {
  const backupRoot = harnessedSubdir('backups')
  const ts = new Date().toISOString().replace(/:/g, '-')
  const backupPath = join(backupRoot, `settings.json.${ts}.bak`)
  try {
    await mkdir(backupRoot, { recursive: true })
    await writeFile(backupPath, raw, 'utf8')
    return { status: 'ok', path: backupPath }
  } catch (err) {
    return { status: 'warn', message: `backup ${backupPath} failed: ${(err as Error).message}` }
  }
}

async function atomicWrite(path: string, content: string): Promise<string | undefined> {
  const tmpPath = `${path}.tmp-${process.pid}-${Date.now()}`
  try {
    await writeFile(tmpPath, content, 'utf8')
    await rename(tmpPath, path)
    return undefined
  } catch (err) {
    return `write ${path} failed: ${(err as Error).message}`
  }
}
