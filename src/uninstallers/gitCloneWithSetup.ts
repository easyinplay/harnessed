// Phase 5.2 W1 T1.2 — uninstall method 5/7: git-clone-with-setup.
// Node 22 native fs.rm cross-OS (no shell spawn per RESEARCH zero-risk).
// extractCloneTarget inline — sister src/installers/gitCloneWithSetup.ts L70-98 YAGNI.

import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

// sister src/installers/gitCloneWithSetup.ts extractCloneTarget — refactor to shared lib if 3rd caller appears.
function extractCloneTarget(cmd: string): string | null {
  const idx = cmd.indexOf('git clone')
  if (idx < 0) return null
  const tail = cmd.slice(idx + 'git clone'.length).trim()
  const tokens = tail.split(/\s+/)
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (t === undefined || !t.startsWith('-')) break
    if (t === '--depth' || t === '--branch' || t === '-b') {
      i += 2
    } else if (t.includes('=')) {
      i += 1
    } else {
      i += 2
    }
  }
  const dest = tokens[i + 1]
  if (!dest || dest === '&&' || dest === ';' || dest === '|') return null
  if (dest.startsWith('~/')) {
    const home = process.env.HOME ?? process.env.USERPROFILE
    if (!home) return null
    return `${home}${dest.slice(1)}`
  }
  return dest
}

/**
 * Does this clone hold work the user would lose? `true` = a positive dirty
 * signal (modified tracked files OR untracked ones — a hand-added skill is user
 * work too), `false` = clean, `null` = UNKNOWN (not a worktree, git absent,
 * directory gone).
 *
 * Only `true` blocks. An uninstall that cannot complete without a working `git`
 * would trade a rare data loss for a common dead end, so unknown proceeds
 * (ADR-0029 fail-soft for operational faults). The realistic case is covered:
 * git was present to make the clone in the first place.
 */
export function hasUncommittedWork(dir: string): boolean | null {
  try {
    // `--show-toplevel`, not `--is-inside-work-tree`: git walks UP from cwd, so a
    // clone target that is NOT a repo still answers "true" whenever any ancestor
    // is one (a home dir under version control, a repo-shaped TMPDIR) — and the
    // porcelain that follows would then report the OUTER repo's dirt and block an
    // unrelated uninstall. Requiring the toplevel to BE this directory pins the
    // question to the clone itself, which is exactly what a clone target is.
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (top === '' || realpathSync(top) !== realpathSync(dir)) return null
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return status.trim().length > 0
  } catch {
    return null
  }
}

export const uninstallGitCloneWithSetup: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'git-clone-with-setup') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  const cloneTarget = extractCloneTarget(install.cmd)
  if (!cloneTarget) {
    return {
      ok: false,
      phase: 'preflight',
      error: `git-clone-with-setup cmd missing parseable 'git clone <url> <dest>': '${install.cmd.slice(0, 80)}'`,
    }
  }

  // 4.38.0 — never silently delete edits the user made inside the clone.
  // Override is an env flag rather than a new UninstallOpts field: same house
  // pattern as doc-discipline-gate's HARNESSED_ALLOW_LONG_STATE, and it keeps
  // the opts type (shared by all 7 uninstallers) untouched.
  if (process.env.HARNESSED_FORCE_UNINSTALL !== '1' && hasUncommittedWork(cloneTarget) === true) {
    return {
      ok: false,
      phase: 'preflight',
      error:
        `'${cloneTarget}' has uncommitted changes — refusing to delete it. ` +
        'Commit or copy the work out first, then re-run; ' +
        'set HARNESSED_FORCE_UNINSTALL=1 to delete it anyway.',
    }
  }

  await rm(cloneTarget, { recursive: true, force: true, maxRetries: 3 })
  return { ok: true, removedPaths: [cloneTarget] }
}
