// 4.25.0 (intel B3 / D3 — doctor fail-surface audit, principle locked):
// doctor `status: 'fail'` is reserved for "harnessed itself cannot work"
// (broken runtime / broken shipped assets). Fuzzy environment findings are
// 'warn' at most (R2.4.1 "warn ≠ fail" + comet 0.3.5 downgrade principle —
// ambiguous findings must never be rounded up to a red doctor).
//
// 2026-07-11 audit of every src/cli/lib/check-*.ts 'fail' emission:
//   check-builtin.ts   checkNodeVersion — node < 22: runtime requirement   ✓ compliant
//   check-builtin.ts   checkWinBash ×2 — WSL-stub-only / no bash on PATH:
//                      "harnessed verify/install cmds cannot run"          ✓ compliant
//   check-deprecations aliases.yaml load error — our own shipped asset
//                      corrupt (broken install)                            ✓ compliant
//
// This test inventories the fail sites at source level (spawning each broken
// environment per check would need per-OS fixtures — source audit is the
// honest, cheap lock). Adding a NEW `status: 'fail'` emission requires
// updating the allowlist below WITH a justification comment.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const LIB_DIR = join(process.cwd(), 'src', 'cli', 'lib')

/** file → expected number of `status: 'fail'` emissions (audited 2026-07-11). */
const FAIL_ALLOWLIST: Record<string, number> = {
  'check-builtin.ts': 3, // node<22 (1) + WSL-stub / no-bash (2) — harnessed cannot run
  'check-deprecations.ts': 1, // bundled aliases.yaml unreadable — broken install
}

describe('doctor fail-surface (intel B3 / D3, 4.25.0)', () => {
  it("every `status: 'fail'` emission in check-*.ts is on the audited allowlist", () => {
    const found: Record<string, number> = {}
    for (const f of readdirSync(LIB_DIR)) {
      if (!/^check-.*\.ts$/.test(f)) continue
      const src = readFileSync(join(LIB_DIR, f), 'utf8')
      const n = (src.match(/status: 'fail'/g) ?? []).length
      if (n > 0) found[f] = n
    }
    expect(found).toEqual(FAIL_ALLOWLIST)
  })
})
