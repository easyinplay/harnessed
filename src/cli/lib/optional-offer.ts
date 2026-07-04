// v4.18.0 — setup optional-tier offer(用户指示: setup 能装 codegraph)。
//
// manifests/optional/(codegraph / ecc / perturn-inject)per Phase 18 D2 特意不进
// Step B 的 auto-glob(opt-in 锁定)——但 pre-4.18.0 setup 没有任何入口,唯一路径是
// 用户自己知道 `harnessed install <name>`(三层解析 install.ts:72 已通,却无人引导)。
// 本模块在 setup 收尾前 offer:已装跳过、未装项一屏 p.multiselect 勾选
// (initialValues [] + required:false — 默认全不选、直接回车即全不装,opt-in 语义;
// v4.18.0 multiselect 增强,替代初版逐项 confirm 循环)、勾中即单 manifest runInstall,
// 执行前逐项回显 `$ <cmd>`(informed consent 不降级 — 勾选屏 hint 只放 description)。
// 非交互(CI / 管道)只打一行 advisory,不 prompt。
//
// Own module (not a setup-helpers export): tests/cli/setup-*.test.ts factory-mock
// setup-helpers.js; adding an export there breaks every factory (memory lesson
// "mock-export-gap-extract-module"). setup.ts loads this lazily, sister l4-rescue.
//
// IMPL NOTE (system:true only for npm-cli): confirmAt 只在 L4 消费 opts.system;
// npm-cli 的 detectLevel 对 codegraph 的 `npm i -g` 缩写不匹配 `npm install -g`
// 正则、落 "safest default" L4 分支 — 行为正确(全局装就是 L4)。这里的 confirm
// 就是 L4 的显式 opt-in,故 npm-cli → system:true + nonInteractive:true(不二次
// prompt);其余 method(cc-plugin / cc-hook)不消费 system,传 false 保持语义精确。

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { runInstall } from '../../installers/index.js'
import { isAlreadyInstalled } from '../../installers/lib/idempotent.js'
import type { InstallContext, InstallOpts, Manifest } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'

export interface OptionalOfferResult {
  installed: string[]
  alreadyInstalled: string[]
  skipped: string[]
  failed: { name: string; reason: string }[]
}

/** Read-only probe opts for the isAlreadyInstalled detector (sister
 *  makeIdempotentProbe — detection must run for real, no force-update bypass). */
const PROBE_OPTS: InstallOpts = {
  apply: false,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: 'auto',
  updateInstalled: false,
  quiet: true,
}

/** Keep multiselect hints one-line — long manifest descriptions wrap the picker. */
function truncateHint(desc: string): string {
  return desc.length > 80 ? `${desc.slice(0, 80)}…` : desc
}

async function loadOptionalManifests(optionalDir: string): Promise<Manifest[]> {
  let entries: string[]
  try {
    entries = await readdir(optionalDir)
  } catch {
    return [] // no optional tier in this distribution — silently nothing to offer
  }
  const out: Manifest[] = []
  for (const f of entries.sort()) {
    if (!f.endsWith('.yaml')) continue
    try {
      const v = validateManifestFile(await readFile(join(optionalDir, f), 'utf8'), f)
      if (v.ok) out.push(v.manifest)
    } catch {
      /* unreadable catalog entry → not offerable; doctor/CI own manifest hygiene */
    }
  }
  return out
}

/** Offer the optional-tier manifests at the end of `harnessed setup`.
 *  interactive:false (non-TTY / --non-interactive) → one advisory line, no prompts. */
export async function runOptionalOffer(
  optionalDir: string,
  offerOpts: { interactive: boolean },
): Promise<OptionalOfferResult> {
  const out: OptionalOfferResult = { installed: [], alreadyInstalled: [], skipped: [], failed: [] }
  const manifests = await loadOptionalManifests(optionalDir)
  if (manifests.length === 0) return out

  const pending: Manifest[] = []
  for (const manifest of manifests) {
    const ctx: InstallContext = { manifest, opts: PROBE_OPTS, level: 'L2', cwd: process.cwd() }
    let present = false
    try {
      present = await isAlreadyInstalled(ctx)
    } catch {
      present = false
    }
    if (present) out.alreadyInstalled.push(manifest.metadata.name)
    else pending.push(manifest)
  }
  if (pending.length === 0) return out

  if (!offerOpts.interactive) {
    // Advisory only — CI / piped stdin cannot answer prompts.
    const names = pending.map((m) => m.metadata.name)
    console.log(
      `\n${names.length} optional component(s) available (opt-in, not part of base setup) — install with \`harnessed install <name>\`: ${names.join(', ')}`,
    )
    out.skipped.push(...names)
    return out
  }

  console.log(
    `\n${pending.length} optional component(s) available (opt-in — none selected by default):`,
  )
  const ans = await p.multiselect({
    message:
      'Select optional components to install (space to toggle, enter to continue — empty = install nothing)',
    options: pending.map((m) => ({
      value: m.metadata.name,
      label: m.metadata.display_name ?? m.metadata.name,
      hint: truncateHint(m.metadata.description),
    })),
    initialValues: [],
    required: false,
  })
  if (p.isCancel(ans)) {
    out.skipped.push(...pending.map((m) => m.metadata.name))
    return out
  }
  const chosen = new Set(ans as string[])
  for (const manifest of pending) {
    const name = manifest.metadata.name
    if (!chosen.has(name)) {
      out.skipped.push(name)
      continue
    }
    // informed consent — echo the exact command about to run for this selection.
    console.log(`\n  ${name}: $ ${manifest.spec.install.cmd}`)
    const opts: InstallOpts = {
      ...PROBE_OPTS,
      apply: true,
      // see IMPL NOTE header — this confirm IS the L4 opt-in for npm-cli globals.
      system: manifest.spec.install.method === 'npm-cli',
    }
    const r = await runInstall(manifest, opts)
    if ('aborted' in r) {
      out.skipped.push(name)
      console.log(`  ↷ skipped ${name} (${r.reason})`)
    } else if (r.ok) {
      out.installed.push(name)
      console.log(`  ✓ installed ${name}`)
      if (name === 'codegraph') {
        // Upstream two-step semantics: install wires the MCP server only; the
        // per-project index is a separate `codegraph init` (sister doctor hint).
        console.log('    run `codegraph init` in each project to build its index')
      }
    } else {
      out.failed.push({ name, reason: r.error.message })
      console.error(`  ✗ failed ${name}: ${r.error.message}`)
    }
  }
  return out
}
