// Kill a spawned installer process AND everything it started.
//
// `child.kill('SIGKILL')` terminates only the direct child. Every installer
// spawn goes through a shell (cmd.exe / Git Bash / /bin/sh) or a .cmd shim, so
// the direct child is the shell and the real work (npm, git, claude) is its
// child. On a timeout that work survived as an orphan and kept writing
// ~/.claude/skills/ and ~/.claude.json while setup moved on to the next
// installer (reproduced on Windows 11: the grandchild outlived the kill;
// `taskkill /T /F` removed it).

import { type ChildProcess, spawnSync } from 'node:child_process'

/** Descendant pids of `pid`, parents before children. POSIX only (`pgrep -P`,
 *  present on Linux procps and macOS); empty when pgrep is unavailable. */
function descendantsOf(pid: number): number[] {
  const r = spawnSync('pgrep', ['-P', String(pid)], { encoding: 'utf8', timeout: 2_000 })
  if (r.status !== 0 || typeof r.stdout !== 'string') return []
  const out: number[] = []
  for (const tok of r.stdout.split(/\s+/)) {
    const child = Number(tok)
    if (Number.isInteger(child) && child > 0) out.push(child, ...descendantsOf(child))
  }
  return out
}

export function killProcessTree(child: ChildProcess): void {
  const pid = child.pid
  if (pid === undefined) {
    child.kill('SIGKILL')
    return
  }
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
      timeout: 5_000,
    })
    if (r.status === 0) return
    child.kill('SIGKILL')
    return
  }
  // Snapshot the tree first, then kill the root so a shell cannot start the next
  // command of an `a && b` chain, then the snapshot.
  const tree = descendantsOf(pid)
  child.kill('SIGKILL')
  for (const d of tree) {
    try {
      process.kill(d, 'SIGKILL')
    } catch {
      // already gone
    }
  }
}
