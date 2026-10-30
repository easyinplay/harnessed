// Phase 21 Wave 1 — release-preflight: the machine-checkable "PR ready != release
// ready" gate. collectPreflight is PURE over injected deps; defaultDeps reads the
// repo READ-ONLY (CHANGELOG, package.json, `git status --porcelain`, `git tag -l`).
// Nothing here mutates git or the remote — ship stops at tag-ready (publish.yml CI
// does the actual publish on tag push).

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'smol-toml'

export interface PreflightDeps {
  changelog: string
  version: string
  versionSource?: string
  versionError?: string
  gitStatus: string // `git status --porcelain` output
  gitTags: string[] // `git tag -l` lines
}

export interface PreflightCheck {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

function isSemVer(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(
      value,
    )
  )
}

function table(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function discoverVersion(
  cwd: string,
  releaseVersion?: string,
): Pick<PreflightDeps, 'version' | 'versionSource' | 'versionError'> {
  if (releaseVersion !== undefined) {
    return {
      version: releaseVersion,
      versionSource: '--release-version',
      versionError: isSemVer(releaseVersion)
        ? undefined
        : '--release-version must be a valid SemVer',
    }
  }

  const candidates: { source: string; version: string }[] = []
  const errors: string[] = []
  const add = (source: string, value: unknown) => {
    if (isSemVer(value)) candidates.push({ source, version: value })
    else errors.push(`${source}: missing, dynamic, workspace-inherited or invalid SemVer`)
  }
  for (const filename of ['package.json', 'pyproject.toml', 'Cargo.toml']) {
    try {
      const content = readFileSync(join(cwd, filename), 'utf8')
      const data = table(filename === 'package.json' ? JSON.parse(content) : parse(content))
      if (filename === 'package.json') add('package.json.version', data.version)
      else if (filename === 'Cargo.toml')
        add('Cargo.toml [package].version', table(data.package).version)
      else {
        const project = table(data.project)
        const dynamic = Array.isArray(project.dynamic) && project.dynamic.includes('version')
        add('pyproject.toml [project].version', dynamic ? undefined : project.version)
        add('pyproject.toml [tool.poetry].version', table(table(data.tool).poetry).version)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        errors.push(`${filename}: unreadable or malformed manifest`)
      }
    }
  }
  if (new Set(candidates.map((candidate) => candidate.version)).size > 1) {
    return {
      version: '',
      versionError: `conflicting release versions: ${candidates.map(({ source, version }) => `${source}=${version}`).join(', ')}`,
    }
  }
  if (candidates[0]) {
    return {
      version: candidates[0].version,
      versionSource: candidates.map((candidate) => candidate.source).join(', '),
    }
  }
  return {
    version: '',
    versionError: `no static valid release version found in package.json, pyproject.toml or Cargo.toml${errors.length ? `: ${errors.join('; ')}` : ''}`,
  }
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
  const validVersion = !deps.versionError && isSemVer(deps.version)

  // Documented if [Unreleased] has entries (pre-cut) OR a section for the current
  // version already exists (post-cut, the form publish.yml reads for release notes).
  const unreleased = unreleasedSection(deps.changelog)
  const hasVersionSection = validVersion && deps.changelog.includes(`## [${deps.version}]`)
  checks.push(
    unreleased.length > 0 || hasVersionSection
      ? {
          name: 'changelog',
          status: 'pass',
          message: hasVersionSection
            ? `CHANGELOG has a [${deps.version}] section`
            : 'CHANGELOG [Unreleased] has entries',
        }
      : {
          name: 'changelog',
          status: 'fail',
          message: 'CHANGELOG [Unreleased] is empty and no version section exists',
          fix: 'document this release under ## [Unreleased] (or ## [<version>]) before shipping',
        },
  )

  checks.push(
    validVersion
      ? {
          name: 'version',
          status: 'pass',
          message: `${deps.versionSource ?? 'release'} version ${deps.version}`,
        }
      : {
          name: 'version',
          status: 'fail',
          message: deps.versionError ?? 'release version missing or malformed',
          fix: 'set a static SemVer in package.json, pyproject.toml or Cargo.toml, or pass --release-version <semver>',
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

  if (!validVersion) {
    checks.push({
      name: 'tag-absent',
      status: 'warn',
      message: 'tag check not run: no valid target release version',
    })
    return checks
  }

  const tag = `v${deps.version}`
  checks.push(
    deps.gitTags.includes(tag)
      ? {
          name: 'tag-absent',
          status: 'fail',
          message: `${tag} already exists`,
          fix: 'choose a new release version in the source manifest or with --release-version <semver>',
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
export function defaultDeps(cwd: string, releaseVersion?: string): PreflightDeps {
  let changelog = ''
  const resolved = discoverVersion(cwd, releaseVersion)
  try {
    changelog = readFileSync(join(cwd, 'CHANGELOG.md'), 'utf8')
  } catch {}
  let gitStatus = ''
  let gitTags: string[] = []
  try {
    // --untracked-files=no: a release gate cares about uncommitted *tracked*
    // changes (those would land in the tag); untracked local scratch does not
    // affect a tag-based release and should not block it.
    gitStatus = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
      cwd,
      encoding: 'utf8',
    })
  } catch {}
  try {
    if (!resolved.versionError && isSemVer(resolved.version)) {
      gitTags = execFileSync('git', ['tag', '-l'], { cwd, encoding: 'utf8' })
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  } catch {}
  return { changelog, ...resolved, gitStatus, gitTags }
}
