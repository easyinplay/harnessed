// 4.23.0 (issue #3) — installed-skill integrity audit + self-heal support.
//
// Dogfood forensics (issue #3 + author's follow-up): `harnessed setup` clobbered
// its OWN shipped workflows — Step A installed the 28 workflows first, Step B's
// skill packs (mattpocock's `research`, gstack's `retro`/`ship`) landed
// afterwards in the same flat, unnamespaced `~/.claude/skills/` directory. Last
// writer wins, silently: the slash command still exists and "works", but the
// engine (intent / ledger / fail-closed evidence guard) is never entered —
// failure indistinguishable from success.
//
// Integrity baseline = the INSTALL-TIME HASH LEDGER, not the bundled source.
// The guarantee chain (user decision 2026-07-10, T1 revision):
//   bundled source (engine truth)
//     → install-time render (the ONLY sanctioned divergence: capability-cmd +
//       locale substitutions, Step A.5)
//     → ledger pins the RENDERED state's sha256 (<stateRoot>/skill-hashes.json)
//     → any third-party change afterwards diverges from the ledger and is caught.
// Judging principle: render divergence (installed ≠ source) is LEGAL; ledger
// divergence (installed ≠ what setup last wrote) is NOT. A naive
// hash(installed)==hash(source) comparison would flag every rendered workflow.
//
// Status semantics per shipped workflow:
//   - ok       — installed SKILL.md sha256 matches the ledger entry.
//   - foreign  — no harnessed-generated marker: a pack or hand-rolled skill
//                occupies the engine's name (the issue #3 failure class).
//   - tampered — marker present (same version) but hash ≠ ledger: hand-edited
//                while keeping the marker.
//   - stale    — installed marker version < the BUNDLED SOURCE's marker version
//                (markers are stamped by scripts/rewrite-skill-invoke-sections,
//                NOT per release — comparing against package.json would flag
//                everything forever), or the ledger has no record (pre-4.23.0
//                install / first upgrade): re-run setup; non-accusatory wording.
//   - missing  — no installed SKILL.md at all (kept from the original tri-state;
//                a deleted skill is observably distinct from every other state).
//
// Consumers: setup end-of-run audit + self-heal (re-copy + re-render + ledger
// update), doctor check (warn), status --recover banner. All paths fail-soft —
// an unreadable environment must never break setup/status themselves.

import { createHash } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import pkg from '../../../package.json' with { type: 'json' }
import { harnessedFile } from '../../installers/lib/harnessedRoot.js'

/** Same shape the generated-commands overwrite guard uses; duplicated locally on
 *  purpose — generateCommands.ts is factory-mocked by several setup test suites
 *  (mock-export-gap 教训: adding an export there breaks every factory). */
const HARNESSED_MARKER_RX = /<!--\s*harnessed-generated:v(\d+\.\d+\.\d+)\s*-->/

export type SkillIntegrityStatus = 'ok' | 'foreign' | 'tampered' | 'stale' | 'missing'

export interface SkillIntegrityEntry {
  name: string
  status: SkillIntegrityStatus
  /** Pack that declares this skill name in `installs_skills` (likely culprit). */
  culprit?: string
}

export interface WorkflowRef {
  /** Flat installed name, e.g. 'research' / 'verify-qa'. */
  name: string
  /** Path of the workflow dir relative to <assets>/workflows. */
  relPath: string
}

// ── install-time hash ledger ─────────────────────────────────────────────────

export interface SkillHashRecord {
  sha256: string
  version: string
  rendered_at: string
}

export type SkillHashLedger = Record<string, SkillHashRecord>

export function ledgerPath(): string {
  return harnessedFile('skill-hashes.json')
}

export function sha256Of(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/** Read the ledger; null when absent/corrupt (old install → treat everything
 *  as 'stale' and let the setup self-heal rebuild it — never misreport
 *  'tampered' off a baseline we do not have). */
export async function readHashLedger(path: string = ledgerPath()): Promise<SkillHashLedger | null> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as SkillHashLedger
  } catch {
    return null
  }
}

/** Pin the CURRENT rendered state of each named skill into the ledger
 *  (merge + atomic tmp/rename). Called by setup after Step A + A.5 and after a
 *  self-heal re-render. Fail-soft: an unwritable ledger degrades the audit to
 *  'stale' next run, it never breaks setup. */
export async function recordSkillHashes(
  names: string[],
  skillsBase: string,
  path: string = ledgerPath(),
  version: string = pkg.version,
): Promise<void> {
  try {
    const ledger = (await readHashLedger(path)) ?? {}
    const rendered_at = new Date().toISOString()
    for (const name of names) {
      try {
        const text = await readFile(join(skillsBase, name, 'SKILL.md'), 'utf8')
        if (typeof text !== 'string') continue
        ledger[name] = { sha256: sha256Of(text), version, rendered_at }
      } catch {
        // skill not on disk (partial install) → no ledger entry → 'stale' later
      }
    }
    const tmp = `${path}.tmp-${process.pid}`
    await writeFile(tmp, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8')
    await rename(tmp, path)
  } catch {
    /* fail-soft — see docstring */
  }
}

// ── version compare (3-segment, no prerelease semantics needed) ──────────────

function versionLt(a: string, b: string): boolean {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x !== y) return x < y
  }
  return false
}

// ── audit ────────────────────────────────────────────────────────────────────

export interface AuditOpts {
  /** Injected ledger (tests); default reads <stateRoot>/skill-hashes.json. */
  ledger?: SkillHashLedger | null
}

/**
 * Audit each shipped workflow's installed SKILL.md under `skillsBase` against
 * the install-time hash ledger (see module header for the state semantics).
 *
 * Degraded-environment gate: a workflow whose BUNDLED source SKILL.md (under
 * `workflowsDir`) cannot be read or carries no harnessed-generated marker is
 * skipped entirely — we cannot assert anything about names we cannot see the
 * source of (mocked fs in tests, partial installs). Every real bundled source
 * carries the marker, so production never skips.
 */
export async function auditInstalledSkills(
  workflows: WorkflowRef[],
  skillsBase: string,
  workflowsDir: string,
  opts: AuditOpts = {},
): Promise<SkillIntegrityEntry[]> {
  const ledger = opts.ledger !== undefined ? opts.ledger : await readHashLedger()
  const out: SkillIntegrityEntry[] = []
  for (const wf of workflows) {
    let src: string
    try {
      src = await readFile(join(workflowsDir, wf.relPath, 'SKILL.md'), 'utf8')
    } catch {
      continue
    }
    const srcMarker = typeof src === 'string' ? HARNESSED_MARKER_RX.exec(src) : null
    if (!srcMarker) continue
    const srcVersion = srcMarker[1] ?? '0.0.0'

    let installed: string | null
    try {
      installed = await readFile(join(skillsBase, wf.name, 'SKILL.md'), 'utf8')
    } catch {
      installed = null
    }
    if (installed === null || typeof installed !== 'string') {
      out.push({ name: wf.name, status: 'missing' })
      continue
    }
    const marker = HARNESSED_MARKER_RX.exec(installed)
    if (!marker) {
      out.push({ name: wf.name, status: 'foreign' })
      continue
    }
    const markerVersion = marker[1] ?? '0.0.0'
    if (versionLt(markerVersion, srcVersion)) {
      // Older shipped file still on disk (source marker was since re-stamped)
      // — legitimate pre-upgrade state.
      out.push({ name: wf.name, status: 'stale' })
      continue
    }
    const record = ledger?.[wf.name]
    if (!record) {
      // No baseline (ledger absent or entry never written) → non-accusatory.
      out.push({ name: wf.name, status: 'stale' })
      continue
    }
    out.push({
      name: wf.name,
      status: sha256Of(installed) === record.sha256 ? 'ok' : 'tampered',
    })
  }
  return out
}

/**
 * Build a skill-name → pack-name index from the skill-pack manifests'
 * `spec.install.installs_skills` declarations (issue #3 requested change 5).
 * Fail-soft per manifest: unreadable/undeclared manifests contribute nothing.
 */
export async function buildCulpritIndex(manifestPaths: string[]): Promise<Map<string, string>> {
  const index = new Map<string, string>()
  for (const p of manifestPaths) {
    try {
      const parsed = parseYaml(await readFile(p, 'utf8')) as {
        metadata?: { name?: unknown }
        spec?: { install?: { installs_skills?: unknown } }
      }
      const pack = parsed?.metadata?.name
      const skills = parsed?.spec?.install?.installs_skills
      if (typeof pack !== 'string' || !Array.isArray(skills)) continue
      for (const s of skills) {
        if (typeof s === 'string' && s.length > 0 && !index.has(s)) index.set(s, pack)
      }
    } catch {
      /* fail-soft: skip unreadable manifest */
    }
  }
  return index
}

/** Attach likely-culprit pack names — only 'foreign' names an actual overwriter;
 *  tampered/stale/missing carry no pack attribution (would be an accusation the
 *  evidence does not support). */
export function attachCulprits(
  entries: SkillIntegrityEntry[],
  culpritIndex: Map<string, string>,
): SkillIntegrityEntry[] {
  return entries.map((e) =>
    e.status === 'foreign' ? { ...e, culprit: culpritIndex.get(e.name) ?? e.culprit } : e,
  )
}

/** Doctor fix line — heal PREVIEW (4.24.0 intel gap G4, ECC `repair --dry-run`
 *  semantics adopted light): doctor is the preview channel, setup is the heal
 *  channel; no new command. Names exactly what setup would reinstall and that
 *  the replaced content is backed up first (G1). */
export function healPreviewFix(bad: SkillIntegrityEntry[]): string {
  const names = bad.map((e) => e.name).join(', ')
  return `would reinstall: ${names}; run \`harnessed setup\` to heal (a backup of the current content is taken first, under \`~/.claude/harnessed/backups/\`)`
}

/** Human lines for a non-clean audit (shared by setup / doctor / status). */
export function integrityReportLines(entries: SkillIntegrityEntry[]): string[] {
  const bad = entries.filter((e) => e.status !== 'ok')
  if (bad.length === 0) return []
  const lines = [
    `⚠ ${bad.length} harnessed workflow skill(s) are not the shipped version — the slash command exists but may NOT enter the engine (no intent, no ledger, no evidence guard):`,
  ]
  for (const e of bad) {
    const why =
      e.status === 'foreign'
        ? 'installed SKILL.md is not harnessed-generated'
        : e.status === 'tampered'
          ? 'modified since install (marker kept, content diverged from the install-time hash)'
          : e.status === 'stale'
            ? 'older install / no install-time hash recorded — re-run `harnessed setup` to refresh'
            : 'missing'
    const culprit = e.culprit ? ` — likely overwritten by pack '${e.culprit}'` : ''
    lines.push(`    ${e.name}: ${why}${culprit}`)
  }
  return lines
}
