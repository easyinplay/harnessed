// Phase 2.4 W1 T1.1 — sister-share helper for doctor #5 (warn mode) +
// audit (hard-fail mode allowFork=false). Karpathy hard limit ≤80L per B-38.
// Source: RESEARCH § 1.2.5 + § 4.1.1 + D2.4-3.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface OriginCheckResult {
  status: 'pass' | 'warn' | 'fail'
  detail: string
  fix?: string
}

export interface OriginCheckOptions {
  /** true = doctor (warn on drift — fork 合法), false = audit (fail on drift — tamper) */
  allowFork?: boolean
}

/** Normalize a git remote URL — strip protocol prefix, trailing .git, ssh `:` → `/`. */
function normalizeUrl(s: string): string {
  return s
    .trim()
    .replace(/^(https?:\/\/|git@github\.com:|ssh:\/\/git@github\.com\/)/, '')
    .replace(/\.git$/, '')
    .replace(':', '/')
    .replace(/\/$/, '')
    .toLowerCase()
}

/**
 * Verify `git remote get-url origin` matches expected URL from `package.json#repository.url`.
 * doctor uses allowFork=true (warn); audit uses allowFork=false (fail).
 */
export function checkOrigin(
  cwd: string = process.cwd(),
  opts: OriginCheckOptions = {},
): OriginCheckResult {
  const allowFork = opts.allowFork ?? true
  // 1. Read expected URL from package.json `repository.url` SSOT.
  let expected: string | null = null
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      repository?: string | { url?: string }
    }
    expected = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url ?? null)
  } catch {
    // package.json missing 是合法 case (npm 全局装 / detached run).
  }
  if (!expected) {
    return {
      status: 'warn',
      detail: 'package.json has no repository.url field',
      fix: 'add `repository` field to package.json',
    }
  }
  // 2. Read actual git remote origin URL.
  const r = spawnSync('git', ['config', '--get', 'remote.origin.url'], {
    cwd,
    encoding: 'utf8',
  })
  if (r.status !== 0) {
    return {
      status: 'warn',
      detail: 'no git remote origin (detached / non-clone)',
      fix: 'git remote add origin <expected-url>',
    }
  }
  const actual = r.stdout.trim()
  if (normalizeUrl(actual) === normalizeUrl(expected)) {
    return { status: 'pass', detail: actual }
  }
  // 4. Drift: warn for doctor (fork 合法), fail for audit (tamper detection).
  return {
    status: allowFork ? 'warn' : 'fail',
    detail: `origin '${actual}' ≠ expected '${expected}'`,
    fix: allowFork
      ? 'verify intentional fork; if not, `git remote set-url origin <expected>`'
      : 'origin URL drift — possible tamper, `git remote set-url origin <expected>` to restore',
  }
}
