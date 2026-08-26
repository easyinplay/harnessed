// 4.38.0 — git-clone-with-setup uninstall used to `rm -rf` the clone target
// unconditionally. gstack / ui-ux-pro-max / ecc all install that way, and all
// three are skill packs a user plausibly edits in place; the edits vanished with
// no warning. Trellis shipped the same guard ("guard uninstall against deleting
// uncommitted user data") after users lost work.
//
// Direction: refuse only on a POSITIVE dirty signal. An unreadable/absent git
// makes the state unknown, and an uninstall that cannot be completed without git
// would be worse than the risk (ADR-0029 fail-soft for operational faults).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hasUncommittedWork } from '../../src/uninstallers/gitCloneWithSetup.js'

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], {
    cwd,
    stdio: 'pipe',
  })

describe('hasUncommittedWork', { timeout: 30_000 }, () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'unin-dirty-'))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('clean clone → false (safe to delete)', () => {
    git(tmp, 'init', '-q')
    writeFileSync(join(tmp, 'a.txt'), 'x')
    git(tmp, 'add', '-A')
    git(tmp, 'commit', '-qm', 'init')
    expect(hasUncommittedWork(tmp)).toBe(false)
  })

  it('modified tracked file → true (refuse)', () => {
    git(tmp, 'init', '-q')
    writeFileSync(join(tmp, 'a.txt'), 'x')
    git(tmp, 'add', '-A')
    git(tmp, 'commit', '-qm', 'init')
    writeFileSync(join(tmp, 'a.txt'), 'edited by the user')
    expect(hasUncommittedWork(tmp)).toBe(true)
  })

  it('untracked file → true (a hand-added skill counts as user work)', () => {
    git(tmp, 'init', '-q')
    writeFileSync(join(tmp, 'a.txt'), 'x')
    git(tmp, 'add', '-A')
    git(tmp, 'commit', '-qm', 'init')
    writeFileSync(join(tmp, 'mine.md'), 'notes')
    expect(hasUncommittedWork(tmp)).toBe(true)
  })

  it('not a git worktree → null (unknown, do not block)', () => {
    mkdirSync(join(tmp, 'plain'), { recursive: true })
    expect(hasUncommittedWork(join(tmp, 'plain'))).toBeNull()
  })

  // The ancestor-walk bug this guard was rewritten around: a child of a repo is
  // not itself a clone root, and asking git from inside it reports the PARENT's
  // dirt. Deterministic here — the parent is dirty on purpose.
  it('non-repo child of a DIRTY repo → null (never inherits the parent state)', () => {
    git(tmp, 'init', '-q')
    writeFileSync(join(tmp, 'dirty.txt'), 'parent has uncommitted work')
    mkdirSync(join(tmp, 'child'), { recursive: true })
    expect(hasUncommittedWork(join(tmp, 'child'))).toBeNull()
    expect(hasUncommittedWork(tmp)).toBe(true)
  })

  it('missing directory → null (nothing to protect)', () => {
    expect(hasUncommittedWork(join(tmp, 'gone'))).toBeNull()
    expect(existsSync(join(tmp, 'gone'))).toBe(false)
  })
})
