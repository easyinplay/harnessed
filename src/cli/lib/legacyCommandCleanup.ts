import { join } from 'node:path'

const HARNESSED_MARKER_RX = /<!--\s*harnessed-generated:v\d+\.\d+\.\d+\s*-->/

const V3_4_3_SIGNATURE_SUB_RX =
  /\*\*Preferred path\*\*[\s\S]*use the SlashCommand tool[\s\S]*\*\*Fallback path\*\*[\s\S]*use the Task tool to spawn/

const V3_4_3_SIGNATURE_MASTER_RX = /\*\*Preferred path\*\*[\s\S]*dispatch to the per-sub-workflow/

/** True only for command files carrying a harnessed marker or known legacy signature. */
export function shouldOverwriteFile(content: string): boolean {
  return (
    HARNESSED_MARKER_RX.test(content) ||
    V3_4_3_SIGNATURE_SUB_RX.test(content) ||
    V3_4_3_SIGNATURE_MASTER_RX.test(content)
  )
}

/** Remove only legacy Claude command files that harnessed can prove it owns. */
export interface LegacyCommandCleanupResult {
  removed: string[]
  skipped: string[]
  warnings: string[]
}

interface LegacyCommandCleanupDeps {
  readdir(path: string): Promise<string[]>
  readFile(path: string, encoding: 'utf8'): Promise<string>
  unlink(path: string): Promise<void>
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function removeLegacyClaudeCommands(
  commandsDir: string,
  deps?: LegacyCommandCleanupDeps,
): Promise<LegacyCommandCleanupResult> {
  const fs = deps ?? (await import('node:fs/promises'))
  const result: LegacyCommandCleanupResult = { removed: [], skipped: [], warnings: [] }
  let entries: string[]
  try {
    entries = await fs.readdir(commandsDir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      result.warnings.push(`${commandsDir}: directory read failed (${errorMessage(error)})`)
    }
    return result
  }
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    const path = join(commandsDir, entry)
    let content: string
    try {
      content = await fs.readFile(path, 'utf8')
    } catch (error) {
      result.skipped.push(path)
      result.warnings.push(`${path}: read failed (${errorMessage(error)})`)
      continue
    }
    if (!shouldOverwriteFile(content)) {
      result.skipped.push(path)
      continue
    }
    try {
      await fs.unlink(path)
      result.removed.push(path)
    } catch (error) {
      result.skipped.push(path)
      result.warnings.push(`${path}: remove failed (${errorMessage(error)})`)
    }
  }
  return result
}
