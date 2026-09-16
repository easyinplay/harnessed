// External review M12 — `git clone` <dest> parsing skipped two tokens for every
// flag it did not know, so a value-less flag slid the walk by one: the URL was
// read as <dest>, `git rev-parse HEAD` ran in a directory that does not exist,
// and the D-15 SHA pin check degraded to a warning.

import { describe, expect, it } from 'vitest'
import { isSelfCleaningCloneCmd } from '../../src/installers/gitCloneWithSetup.js'
import { parseGitCloneDest } from '../../src/installers/lib/gitCloneArgs.js'

const URL = 'https://github.com/o/r.git'

describe('parseGitCloneDest', () => {
  it.each([
    [`git clone ${URL} ~/.claude/skills/r`, '~/.claude/skills/r'],
    [`git clone --depth 1 --branch v2 ${URL} ~/d`, '~/d'],
    [`git clone --depth=1 ${URL} ~/d`, '~/d'],
    [`git clone --quiet ${URL} ~/d`, '~/d'],
    [`git clone --single-branch --depth 1 ${URL} ~/d`, '~/d'],
    [`git clone -q --no-checkout --filter blob:none ${URL} ~/d && cd ~/d`, '~/d'],
    [`rm -rf ~/d && git clone --recurse-submodules ${URL} ~/d`, '~/d'],
    [`git clone -- ${URL} ~/d`, '~/d'],
  ])('%s → %s', (cmd, dest) => {
    expect(parseGitCloneDest(cmd)?.raw).toBe(dest)
  })

  it.each([
    ['no clone at all', 'npm i -g x'],
    ['no dest (git would pick a cwd-relative dir)', `git clone ${URL} && cd r`],
    ['unknown flag — refuse to guess rather than slide', `git clone --frobnicate ${URL} ~/d`],
  ])('null: %s', (_why, cmd) => {
    expect(parseGitCloneDest(cmd)).toBeNull()
  })
})

describe('the installer sees the real dest behind value-less flags', () => {
  it('self-cleaning detection finds `rm -rf <dest>` after a `--single-branch --depth 1` clone', () => {
    // Before: `--single-branch` swallowed `--depth`, `1` ended the flag walk, and
    // the URL became <dest> — so the rm of the real dest was never matched.
    const cmd = `git clone --single-branch --depth 1 ${URL} ~/.cache/r && cp -r ~/.cache/r/s ~/s && rm -rf ~/.cache/r`
    expect(isSelfCleaningCloneCmd(cmd)).toBe(true)
  })

  it('same for `--quiet`', () => {
    const cmd = `git clone --quiet ${URL} ~/.cache/r && cp -r ~/.cache/r/s ~/s && rm -rf ~/.cache/r`
    expect(isSelfCleaningCloneCmd(cmd)).toBe(true)
  })
})
