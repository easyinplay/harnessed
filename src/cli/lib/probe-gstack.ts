// src/cli/lib/probe-gstack.ts — Phase 3.2 W1 T1.4 — D-01 PROBE PRIMARY helper
// (sister Phase 2.4 W3 origin-check.ts sister-share extract pattern for Karpathy
// ≤200L 守门 — keeps doctor.ts ≤200L). Probes 4 outcome branches: gstack-only
// (pass) / bare-only (pass) / both (ambiguous, fail+fix) / neither (fail+install).
// Win shell flavor sister doctor.ts L80 checkJq pattern (process.platform switch).
//
// v4.15.1 — 5th branch: filesystem probe of the gstack skills install
// (harnessed's own manifest git-clones into <skillsDir>/gstack/). gstack is a
// skills pack, NOT a PATH binary — on machines where no wrapper commands are on
// PATH the old check emitted a false FAIL with a bogus `npm i -g @gstack/cli`
// hint (that package does not exist; user dogfood v4.15.0). The fix hint now
// points at `harnessed setup`.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { harnessSkillsDirs } from '../../installers/lib/platform.js'

export type GstackPrefix = 'gstack-' | ''

export interface ProbeResult {
  status: 'pass' | 'fail'
  prefix?: GstackPrefix
  detail: string
  fix?: string
}

/** v4.15.1 — injectable fs probe (tests pin it; default = real existsSync). */
export interface ProbeGstackDeps {
  exists: (p: string) => boolean
}

function probeOne(cmd: string): boolean {
  // sister doctor.ts L80 checkJq pattern: Node spawnSync 不继承 shell context,
  // 跨 Win-shell 唯一稳路径 (RESEARCH § 1.2 verified).
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, [cmd], { encoding: 'utf8' })
  return r.status === 0 && (r.stdout?.trim().length ?? 0) > 0
}

/** v4.15.1 — gstack skills-dir probe: current layout (root-level skill dirs,
 *  office-hours/SKILL.md) + pre-rename layout (skills/office-hours.md). */
function gstackSkillsDirInstalled(exists: (p: string) => boolean): string | null {
  for (const dir of harnessSkillsDirs()) {
    const root = join(dir, 'gstack')
    if (
      exists(join(root, 'office-hours', 'SKILL.md')) ||
      exists(join(root, 'skills', 'office-hours.md'))
    ) {
      return root
    }
  }
  return null
}

/** Probe PATH for gstack command prefix. 4 outcome branches per D-01 LOCKED
 *  (RESEARCH § 1.4 message table verbatim — Karpathy fail-loud discipline) +
 *  v4.15.1 filesystem 5th branch before the 'neither' fail. */
export function probeGstackPrefix(deps?: Partial<ProbeGstackDeps>): ProbeResult {
  const exists =
    deps?.exists ??
    ((p: string) => {
      try {
        return existsSync(p)
      } catch {
        return false
      }
    })
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
  // v4.15.1 — neither wrapper on PATH, but the skills pack itself may be
  // installed (harnessed manifest clones into <skillsDir>/gstack/).
  const skillsRoot = gstackSkillsDirInstalled(exists)
  if (skillsRoot !== null) {
    return {
      status: 'pass',
      prefix: '',
      detail: `gstack skills dir found (${skillsRoot})`,
    }
  }
  return {
    status: 'fail',
    detail: 'neither gstack-office-hours nor office-hours found in PATH, and no gstack skills dir',
    fix: 'install gstack: run `harnessed setup` (git-clones gstack into ~/.claude/skills/gstack) — see https://github.com/garrytan/gstack',
  }
}
