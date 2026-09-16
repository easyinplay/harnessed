// Harness state root for the hook bins, dependency-free.
//
// The hook bins (bin/harnessed-inject-state.mjs, the Stop hook) are bundled hot
// paths and deliberately do not import src/platform/platform.ts. They used to
// resolve the root as HARNESSED_ROOT_OVERRIDE else `~/.claude/harnessed`, while
// the CLI resolves it through detectPlatform(), which ALSO honours
// HARNESSED_PLATFORM, the `.platform` pin and the auto-probe. With a codex pin
// the CLI wrote the ledger under ~/.codex/harnessed and the hooks read
// ~/.claude/harnessed: injection went silently empty.
//
// This replicates detectPlatform()'s precedence for the one field the hooks need
// (stateRoot). tests/checkpoint/hookStateRoot.test.ts pins the two together.

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export function hookStateRoot(home: string = homedir()): string {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== undefined && override !== '') return override

  const claudeHome = join(home, '.claude')
  const codexHome = join(home, '.codex')
  const rootOf = (id: string): string | null =>
    id === 'claude'
      ? join(claudeHome, 'harnessed')
      : id === 'codex'
        ? join(codexHome, 'harnessed')
        : null

  const env = process.env.HARNESSED_PLATFORM
  if (env !== undefined && env !== '') {
    const r = rootOf(env)
    if (r) return r
  }

  try {
    const r = rootOf(readFileSync(join(claudeHome, 'harnessed', '.platform'), 'utf8').trim())
    if (r) return r
  } catch {
    // no pin
  }

  try {
    if (existsSync(claudeHome)) return join(claudeHome, 'harnessed')
    if (existsSync(codexHome)) return join(codexHome, 'harnessed')
  } catch {
    // probe unavailable → claude default
  }
  return join(claudeHome, 'harnessed')
}
