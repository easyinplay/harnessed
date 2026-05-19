// Phase 5.2 W1 T1.2 — uninstall method 5/7: git-clone-with-setup.
// Node 22 native fs.rm cross-OS (no shell spawn per RESEARCH zero-risk).
// extractCloneTarget inline — sister src/installers/gitCloneWithSetup.ts L70-98 YAGNI.

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

  await rm(cloneTarget, { recursive: true, force: true, maxRetries: 3 })
  return { ok: true, removedPaths: [cloneTarget] }
}
