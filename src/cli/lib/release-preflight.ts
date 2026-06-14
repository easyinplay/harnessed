// Phase 21 Wave 1 — release-preflight: the machine-checkable "PR ready != release
// ready" gate. collectPreflight is PURE over injected deps; defaultDeps reads the
// repo READ-ONLY (CHANGELOG, package.json, `git status --porcelain`, `git tag -l`).
// Nothing here mutates git or the remote — ship stops at tag-ready (publish.yml CI
// does the actual publish on tag push).

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface PreflightDeps {
  changelog: string
  version: string
  gitStatus: string // `git status --porcelain` output
  gitTags: string[] // `git tag -l` lines
}

export interface PreflightCheck {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

/** Content of the `## [Unreleased]` section (up to the next `## ` heading). */
function unreleasedSection(changelog: string): string {
  const start = changelog.indexOf('## [Unreleased]')
  if (start < 0) return ''
  const after = changelog.slice(start + '## [Unreleased]'.length)
  const next = after.indexOf('\n## ')
  return (next >= 0 ? after.slice(0, next) : after).trim()
}

/** Pure — the read-only release-readiness checks. */
export function collectPreflight(deps: PreflightDeps): PreflightCheck[] {
  const checks: PreflightCheck[] = []

  const unreleased = unreleasedSection(deps.changelog)
  checks.push(
    unreleased.length > 0
      ? { name: 'changelog', status: 'pass', message: 'CHANGELOG [Unreleased] has entries' }
      : {
          name: 'changelog',
          status: 'fail',
          message: 'CHANGELOG [Unreleased] is empty',
          fix: 'document this release under ## [Unreleased] before shipping',
        },
  )

  checks.push(
    /^\d+\.\d+\.\d+/.test(deps.version)
      ? { name: 'version', status: 'pass', message: `package.json version ${deps.version}` }
      : {
          name: 'version',
          status: 'fail',
          message: 'package.json version missing or malformed',
          fix: 'set a valid semver in package.json',
        },
  )

  checks.push(
    deps.gitStatus.trim() === ''
      ? { name: 'git-clean', status: 'pass', message: 'working tree clean' }
      : {
          name: 'git-clean',
          status: 'fail',
          message: 'working tree has uncommitted changes',
          fix: 'commit or stash before releasing',
        },
  )

  const tag = `v${deps.version}`
  checks.push(
    deps.gitTags.includes(tag)
      ? {
          name: 'tag-absent',
          status: 'fail',
          message: `${tag} already exists`,
          fix: 'bump package.json — this version is already tagged',
        }
      : { name: 'tag-absent', status: 'pass', message: `${tag} not yet tagged` },
  )

  return checks
}

export function anyFailed(checks: PreflightCheck[]): boolean {
  return checks.some((c) => c.status === 'fail')
}

/** Read-only repo state. Fail-soft: unreadable inputs degrade to empty, which the
 *  checks surface as a failure rather than crashing. */
export function defaultDeps(cwd: string): PreflightDeps {
  let changelog = ''
  let version = ''
  try {
    changelog = readFileSync(join(cwd, 'CHANGELOG.md'), 'utf8')
  } catch {}
  try {
    version = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).version ?? ''
  } catch {}
  let gitStatus = ''
  let gitTags: string[] = []
  try {
    gitStatus = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
  } catch {}
  try {
    gitTags = execFileSync('git', ['tag', '-l'], { cwd, encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {}
  return { changelog, version, gitStatus, gitTags }
}
