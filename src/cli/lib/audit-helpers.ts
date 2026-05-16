// Phase 2.4 W4 T4.1 — audit runtime-layer helpers per B-28 + B-29 + R2.
// 3 helpers: origin tamper (sister-share w/ allowFork=false), install.cmd
// shell-injection + npm-pkg-vs-upstream cross-check, provenance gate.
// Karpathy budget: ≤64L (B-29 target ≤50 + biome multi-line format carve-out
// sister doctor.ts B-03 5%-tolerance pattern; semantically MIN — 3 helpers +
// 1 `finding()` constructor, biome auto-expands long single-line returns).
import { spawnSync } from 'node:child_process'
import type { Manifest } from '../../manifest/schema/types.js'
import type { AuditFinding } from '../audit.js'
import { checkOrigin } from './origin-check.js'

// Phase 2.4 W4 T4.1 — refined per real-world manifest survey: planner spec
// originally COMMAND_SEPARATORS = /[;&|`$]/ flagged legitimate multi-step
// installs (cp && cd; mkdir; etc.). Tighten to actual shell-eval injection
// markers aligned with src/manifest/security.ts gate (Phase 1.1.1 hotfix B1):
// $(...) command substitution / ${...} var expansion / backtick legacy substitution.
// Bare `$` followed by non-{( (e.g. `$PATH` literal in echo) is NOT injection.
// Rule 1 deviation per executor — see SUMMARY § Deviations.
const SHELL_EVAL_MARKERS = /\$\(|\$\{|`/
const NPM_PKG_RE = /npm(?:\s+install\b|\s+i\b)(?:\s+(?:-g|--global))?\s+(\S+)/

const finding = (
  manifest: string,
  level: 'warn' | 'error',
  field: string,
  detail: string,
): AuditFinding => ({ manifest, level, field, detail })

export function auditOriginIntegrity(cwd: string): AuditFinding[] {
  const r = checkOrigin(cwd, { allowFork: false }) // B-28 hard-fail mode (vs doctor allowFork=true)
  if (r.status === 'pass') return []
  return [
    finding('project', r.status === 'fail' ? 'error' : 'warn', '/git/remote/origin', r.detail),
  ]
}

export function auditInstallCmdIntegrity(m: Manifest): AuditFinding[] {
  const out: AuditFinding[] = []
  const cmd = (m.spec.install as { cmd?: string }).cmd ?? ''
  if (SHELL_EVAL_MARKERS.test(cmd)) {
    out.push(
      finding(
        m.metadata.name,
        'error',
        '/spec/install/cmd',
        'install.cmd contains shell-eval marker $(/${/backtick (injection risk)',
      ),
    )
  }
  const upstream = m.metadata.upstream?.repository ?? ''
  const npmMatch = cmd.match(NPM_PKG_RE)
  if (npmMatch?.[1] && upstream.includes('github.com/')) {
    const declared = upstream.split('/').pop()?.replace('.git', '')
    if (declared && npmMatch[1] !== declared) {
      out.push(
        finding(
          m.metadata.name,
          'warn',
          '/spec/install/cmd',
          `install.cmd npm pkg '${npmMatch[1]}' ≠ upstream '${declared}'`,
        ),
      )
    }
  }
  return out
}

export function auditProvenance(): AuditFinding[] {
  const r = spawnSync('node', ['scripts/check-provenance.mjs'], { encoding: 'utf8' })
  if (r.status === 0) return []
  const detail = (r.stderr || r.stdout || '').trim().slice(0, 200)
  return [finding('project', 'error', '/.harnessed/provenance', detail)]
}
