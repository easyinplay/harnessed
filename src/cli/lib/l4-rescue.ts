// v4.13.0 — L4 post-pass interactive rescue (patch 4.13.0 setup UX; findings.md
// 根因 4). Step B runs installers with `nonInteractive: true, system: false`, so
// L4 manifests (global npm installs, e.g. ctx7) short-circuit at confirmAt with
// `level-flag-missing` on EVERY setup run — there was no interactive path to
// ever install them ("总是检测不到和安装失败" user dogfood). After the grouped
// summary prints, this rescue prompts the user per level-flag-missing skip and,
// on consent, re-runs that single manifest with `system: true` (the explicit
// opt-in the L4 gate wants). `nonInteractive: true` is kept so confirmAt does
// not double-prompt — the Clack confirm HERE is the consent.
//
// Own module (not a setup-helpers export): tests/cli/setup-*.test.ts factory-mock
// setup-helpers.js; adding an export there breaks every factory (memory lesson
// "mock-export-gap-extract-module"). setup.ts loads this lazily inside its
// TTY-gated branch, mirroring the runAutoInstall dynamic-import pattern.

import { readFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { runInstall } from '../../installers/index.js'
import {
  type ResolvedComponentPlan,
  resolveComponentPlan,
} from '../../installers/lib/componentPlan.js'
import type { InstallOpts, Manifest } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'

export interface L4RescueResult {
  installed: string[]
  skipped: string[]
  failed: { name: string; reason: string }[]
  pending?: string[]
  repairCandidates?: string[]
}

export interface L4RescueInput {
  skipped: { name: string; reason: string }[]
  failed: string[]
  failureKeywords?: Record<string, string>
  componentTypes?: Record<string, string>
}

interface L4RescueTarget {
  name: string
  updateInstalled: boolean
}

/** Prompt for + run system-scope installs for Step B skips whose reason is
 *  `level-flag-missing`. Caller guards TTY / --non-interactive / --dry-run. */
export async function runL4Rescue(
  manifestPaths: string[],
  input: L4RescueInput | { name: string; reason: string }[],
  hostContext: HostInstallContext = captureHostInstallContext(),
  options: { interactive?: boolean } = {},
): Promise<L4RescueResult> {
  const legacyInput = Array.isArray(input)
  const out: L4RescueResult = { installed: [], skipped: [], failed: [] }
  const normalized: L4RescueInput = legacyInput ? { skipped: input, failed: [] } : input
  const candidates = new Map<string, L4RescueTarget>()
  for (const entry of normalized.skipped) {
    if (entry.reason === 'level-flag-missing') {
      candidates.set(entry.name, { name: entry.name, updateInstalled: false })
    }
  }
  for (const failure of normalized.failed) {
    const name = failure.split(': ', 1)[0] ?? failure
    if (
      normalized.failureKeywords?.[name] === 'verify-failed' &&
      normalized.componentTypes?.[name] === 'cli-binary'
    ) {
      candidates.set(name, { name, updateInstalled: true })
    }
  }
  if (candidates.size === 0) return out

  // Resolve target manifests by name (re-read is cheap local I/O).
  const byName = new Map<
    string,
    { path: string; rawInstallType: string | undefined; plan: ResolvedComponentPlan }
  >()
  for (const path of manifestPaths) {
    try {
      const v = validateManifestFile(await readFile(path, 'utf8'), path)
      if (v.ok) {
        byName.set(v.manifest.metadata.name, {
          path: path.replaceAll('\\', '/'),
          rawInstallType: v.manifest.spec.install_type,
          plan: resolveComponentPlan(v.manifest, hostContext, 'install'),
        })
      }
    } catch {
      /* unreadable manifest → absent from map → reported as failed below */
    }
  }

  const targets = [...candidates.values()].filter((target) => {
    if (!target.updateInstalled) return true
    const resolved = byName.get(target.name)
    if (!resolved?.path.includes('/manifests/tools/')) return false
    const spec = resolved.plan.manifest.spec
    return (
      resolved.rawInstallType === 'npm' &&
      resolved.plan.status === 'supported' &&
      spec.type === 'cli-npm' &&
      spec.component_type === 'cli-binary' &&
      spec.install_type === 'npm' &&
      spec.install.method === 'npm-cli' &&
      /\bnpm\s+install\s+-g\b/.test(spec.install.cmd)
    )
  })
  if (!legacyInput) {
    out.repairCandidates = targets
      .filter((target) => target.updateInstalled)
      .map((target) => target.name)
    out.pending = targets.map((target) => target.name)
  }
  if (targets.length === 0 || options.interactive === false) return out

  console.log(
    `\n${targets.length} component(s) need a system-wide (L4) install — harnessed can run them now:`,
  )
  for (const t of targets) {
    const resolved = byName.get(t.name)
    if (!resolved) {
      out.failed.push({ name: t.name, reason: 'manifest not found for L4 rescue' })
      continue
    }
    const { plan } = resolved
    if (plan.status === 'unsupported') {
      out.skipped.push(t.name)
      console.log(`  skipped ${t.name} (${plan.reason})`)
      continue
    }
    const manifest = structuredClone(plan.manifest) as Manifest
    console.log(`\n  ${t.name}:`)
    console.log(`    $ ${manifest.spec.install.cmd}`)
    const ans = await p.confirm({
      message: `Run L4 install for "${t.name}"? (system-wide — modifies global PATH)`,
      initialValue: false,
    })
    if (p.isCancel(ans) || ans !== true) {
      out.skipped.push(t.name)
      continue
    }
    const opts: InstallOpts = {
      apply: true,
      dryRun: false,
      system: true, // consent explicitly authorizes retrying the L4-gated component
      nonInteractive: true, // consent already given via the confirm above
      fullDiff: false,
      color: 'auto',
      updateInstalled: t.updateInstalled,
      quiet: true,
    }
    const r = await runInstall(manifest, opts, plan.context)
    if ('aborted' in r) {
      out.skipped.push(t.name)
      console.log(`  ↷ skipped ${t.name} (${r.reason})`)
    } else if (r.ok) {
      out.installed.push(t.name)
      console.log(`  ✓ installed ${t.name}`)
    } else {
      out.failed.push({ name: t.name, reason: r.error.message })
      console.error(`  ✗ failed ${t.name}: ${r.error.message}`)
    }
  }
  return out
}
