// Phase 1.2 cli subcommand `audit` per ASSUMPTIONS B4 候选 1 + R2.3 + phase-1.1.1 M1 second-line check.
//
// Phase 1.2 scope: manifest 内自一致性校验 only. We do NOT call git remote
// get-url against installed copies — that requires already-installed
// upstreams + network access, deferred to phase 2.4 (real audit per ASSUMPTIONS
// B4 + ROADMAP). Schema-level checks (git_ref pattern, signed_by pattern,
// repository format) are mostly enforced by Ajv + phase 1.1.1 M1 hotfix; this
// audit is a second-line defense against schema drift / placeholder values
// slipping through.

import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { validateManifestFile } from '../manifest/validate.js'
// Phase 2.4 W4 T4.1 — runtime-layer helpers (B-28 + B-29 + D2.4-16 + D2.4-17).
import {
  auditInstallCmdIntegrity,
  auditOriginIntegrity,
  auditProvenance,
} from './lib/audit-helpers.js'

const REPO_URL_PATTERN = /^https:\/\/[^\s]+\.git$/
const SIGNED_BY_PLACEHOLDERS = new Set(['unsigned', 'todo', 'placeholder', 'tbd', 'unknown'])
const FORBIDDEN_GIT_REFS = new Set(['HEAD', 'main', 'master'])

// Phase 2.4 W4 T4.1 — exported for sister-share with src/cli/lib/audit-helpers.ts
// (3 runtime-layer helpers reuse same finding shape; karpathy YAGNI no audit-types.ts).
export interface AuditFinding {
  manifest: string
  level: 'warn' | 'error'
  field: string
  detail: string
}

async function auditOne(yamlPath: string): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = []
  const src = await readFile(yamlPath, 'utf8')
  const v = validateManifestFile(src, yamlPath)
  if (!v.ok) {
    return v.errors.map((e) => ({
      manifest: yamlPath,
      level: 'error' as const,
      field: e.path,
      detail: e.message,
    }))
  }
  const m = v.manifest

  // 1. repository URL shape — must be https + .git suffix.
  const repo = m.metadata.upstream.repository
  if (!REPO_URL_PATTERN.test(repo)) {
    findings.push({
      manifest: yamlPath,
      level: 'warn',
      field: '/metadata/upstream/repository',
      detail: `repository '${repo}' should be https://...git`,
    })
  }

  // 2. signed_by must not be a placeholder.
  const sig = m.spec.signed_by
  if (SIGNED_BY_PLACEHOLDERS.has(sig.toLowerCase())) {
    findings.push({
      manifest: yamlPath,
      level: 'warn',
      field: '/spec/signed_by',
      detail: `signed_by '${sig}' looks like a placeholder`,
    })
  }

  // 3. git_ref second-line check — schema enforces SHA(7-40 hex)|SemVer pattern (M1
  // hotfix); audit catches the rare "schema bypass" case, which is impossible today
  // but cheap insurance against future migrations.
  const install = m.spec.install
  if ('git_ref' in install && typeof install.git_ref === 'string') {
    if (FORBIDDEN_GIT_REFS.has(install.git_ref)) {
      findings.push({
        manifest: yamlPath,
        level: 'error',
        field: '/spec/install/git_ref',
        detail: `git_ref '${install.git_ref}' is a moving ref (HEAD/main/master) — pin to SHA or tag`,
      })
    }
  }
  return findings
}

export function registerAudit(program: Command): void {
  program
    .command('audit')
    .description('Second-line manifest self-consistency audit (manifest + runtime layers)')
    .option(
      '--skip-runtime',
      'skip runtime-layer checks (origin tamper / provenance) — manifest only',
    )
    .action(async (opts: { skipRuntime?: boolean }) => {
      const root = process.cwd()
      const dirs = ['manifests/tools', 'manifests/skill-packs']
      const yamls: string[] = []
      for (const d of dirs) {
        try {
          const entries = await readdir(join(root, d))
          for (const f of entries) if (f.endsWith('.yaml')) yamls.push(resolve(root, d, f))
        } catch {
          // dir absent — skip silently (project may not have all categories)
        }
      }
      yamls.sort()

      // Manifest-layer findings (Phase 1.2 ship — schema drift / placeholders / moving refs).
      const findings: AuditFinding[] = []
      const validManifests: Array<{
        path: string
        m: import('../manifest/schema/types.js').Manifest
      }> = []
      for (const y of yamls) {
        const src = await readFile(y, 'utf8')
        const v = validateManifestFile(src, y)
        if (v.ok) validManifests.push({ path: y, m: v.manifest })
        findings.push(...(await auditOne(y)))
      }

      // Phase 2.4 W4 T4.1 — runtime-layer findings per B-28 + B-29 + R2:
      //  1. origin URL tamper (hard-fail mode via shared checkOrigin helper)
      //  2. install.cmd shell-injection + npm-pkg-vs-upstream cross-check
      //  3. provenance gate (delegates to scripts/check-provenance.mjs)
      // --skip-runtime escape hatch for offline / pre-init env (B-29 carve-out).
      if (!opts.skipRuntime) {
        findings.push(...auditOriginIntegrity(root))
        for (const { m } of validManifests) findings.push(...auditInstallCmdIntegrity(m))
        findings.push(...auditProvenance())
      }

      const byManifest = new Map<string, AuditFinding[]>()
      for (const f of findings) {
        const arr = byManifest.get(f.manifest) ?? []
        arr.push(f)
        byManifest.set(f.manifest, arr)
      }
      let errorCount = 0
      for (const y of yamls) {
        const fs = byManifest.get(y) ?? []
        if (fs.length === 0) {
          console.log(`✓ ${y}`)
        } else {
          for (const f of fs) {
            const mark = f.level === 'error' ? '✗' : '⚠'
            console.log(`${mark} ${y}\n    ${f.field}: ${f.detail}`)
            if (f.level === 'error') errorCount++
          }
        }
      }
      // Phase 2.4 W4: emit runtime-layer findings (manifest key = 'project' or m.metadata.name).
      for (const [mname, fs] of byManifest) {
        if (yamls.includes(mname)) continue // manifest-layer already printed above
        for (const f of fs) {
          const mark = f.level === 'error' ? '✗' : '⚠'
          console.log(`${mark} [${mname}] ${f.field}: ${f.detail}`)
          if (f.level === 'error') errorCount++
        }
      }
      console.log(
        `\naudited ${yamls.length} manifest${yamls.length === 1 ? '' : 's'} — ${findings.length} finding${findings.length === 1 ? '' : 's'} (${errorCount} error${errorCount === 1 ? '' : 's'})`,
      )
      process.exit(errorCount > 0 ? 1 : 0)
    })
}
