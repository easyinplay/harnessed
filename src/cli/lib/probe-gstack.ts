// src/cli/lib/probe-gstack.ts — Phase 3.2 W1 T1.4 — D-01 PROBE PRIMARY helper
// (sister Phase 2.4 W3 origin-check.ts sister-share extract pattern for Karpathy
// ≤200L 守门 — keeps doctor.ts ≤200L). Probes 4 outcome branches: gstack-only
// (pass) / bare-only (pass) / both (ambiguous, fail+fix) / neither (fail+install).
// Win shell flavor sister doctor.ts L80 checkJq pattern (process.platform switch).
import { spawnSync } from 'node:child_process'

export type GstackPrefix = 'gstack-' | ''

export interface ProbeResult {
  status: 'pass' | 'fail'
  prefix?: GstackPrefix
  detail: string
  fix?: string
}

function probeOne(cmd: string): boolean {
  // sister doctor.ts L80 checkJq pattern: Node spawnSync 不继承 shell context,
  // 跨 Win-shell 唯一稳路径 (RESEARCH § 1.2 verified).
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, [cmd], { encoding: 'utf8' })
  return r.status === 0 && (r.stdout?.trim().length ?? 0) > 0
}

/** Probe PATH for gstack command prefix. 4 outcome branches per D-01 LOCKED
 *  (RESEARCH § 1.4 message table verbatim — Karpathy fail-loud discipline). */
export function probeGstackPrefix(): ProbeResult {
  const hasGstack = probeOne('gstack-office-hours')
  const hasBare = probeOne('office-hours')
  if (hasGstack && !hasBare) {
    return { status: 'pass', prefix: 'gstack-', detail: 'gstack-office-hours found' }
  }
  if (!hasGstack && hasBare) {
    return { status: 'pass', prefix: '', detail: 'office-hours found (--no-prefix mode)' }
  }
  if (hasGstack && hasBare) {
    return {
      status: 'fail',
      detail: 'both gstack-office-hours AND office-hours found — ambiguous',
      fix: 'edit .harnessed/config.json manually: \'{"gstack_prefix":"gstack-"}\' OR \'{"gstack_prefix":""}\'',
    }
  }
  return {
    status: 'fail',
    detail: 'neither gstack-office-hours nor office-hours found in PATH',
    fix: 'install gstack: `npm i -g @gstack/cli` (or your preferred install method)',
  }
}
