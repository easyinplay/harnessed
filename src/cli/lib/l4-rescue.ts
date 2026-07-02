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
import type { InstallOpts, Manifest } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'

export interface L4RescueResult {
  installed: string[]
  skipped: string[]
  failed: { name: string; reason: string }[]
}

/** Prompt for + run system-scope installs for Step B skips whose reason is
 *  `level-flag-missing`. Caller guards TTY / --non-interactive / --dry-run. */
export async function runL4Rescue(
  manifestPaths: string[],
  skipped: { name: string; reason: string }[],
): Promise<L4RescueResult> {
  const out: L4RescueResult = { installed: [], skipped: [], failed: [] }
  const targets = skipped.filter((s) => s.reason === 'level-flag-missing')
  if (targets.length === 0) return out

  // Resolve target manifests by name (re-read is cheap local I/O).
  const byName = new Map<string, Manifest>()
  for (const path of manifestPaths) {
    try {
      const v = validateManifestFile(await readFile(path, 'utf8'), path)
      if (v.ok) byName.set(v.manifest.metadata.name, v.manifest)
    } catch {
      /* unreadable manifest → absent from map → reported as failed below */
    }
  }

  console.log(
    `\n${targets.length} component(s) need a system-wide (L4) install — harnessed can run them now:`,
  )
  for (const t of targets) {
    const manifest = byName.get(t.name)
    if (!manifest) {
      out.failed.push({ name: t.name, reason: 'manifest not found for L4 rescue' })
      continue
    }
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
      system: true, // the explicit L4 opt-in confirmAt requires
      nonInteractive: true, // consent already given via the confirm above
      fullDiff: false,
      color: 'auto',
      updateInstalled: false,
      quiet: true,
    }
    const r = await runInstall(manifest, opts)
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
