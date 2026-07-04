// B2 (v4.20.0) — 资产 bundle 生成器(bun-compile 分发路线 Phase 2;task_plan D1)。
//
// `bun build --compile` 产物里 import.meta.url 指向 bunfs,包根资产
// (workflows/ manifests/ …)不存在(spike + B1)。B2 的解法:构建期把资产集
// 编成单个 JSON bundle(本模块)嵌进二进制,首跑解包(sister unpackAssets.ts)
// 到 <stateRoot>/assets/<version>/ — 即 getAssetsRoot() compiled 分支解析的
// 同一路径。
//
// 格式(D1 锁定):{ schema, version, fileCount, files: { <posix relPath>: base64 } }。
// 零新依赖(否 tar/zip);资产 ~2MB 文本,base64 一次性驻留可接受(karpathy
// simplicity)。生成物 src/compile/assets-bundle.gen.json 走 .gitignore,
// 仅 scripts/build-binary.mjs(bun 执行)写、仅 src/compile/entry.ts 读 —
// tsup/npm 渠道零接触。

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** 资产目录集 — 与 B1 消费点迁移清单(_phase-b1-assets-seam/progress.md D3 表)
 *  对齐:workflows/manifests/messages/routing/config-templates/schemas 为运行时
 *  读取面;bin/ 为 perturn-inject hook 的脚本载体(D6 已知限制:hook 仍需 node)。 */
export const ASSET_DIRS = [
  'workflows',
  'manifests',
  'messages',
  'routing',
  'config-templates',
  'schemas',
  'bin',
] as const

/** 顶层单文件资产:CHANGELOG.md 是 update.ts 的运行时读取面(B1 清单)。 */
export const ASSET_FILES = ['CHANGELOG.md'] as const

export interface AssetsBundle {
  schema: 'harnessed.assets-bundle.v1'
  version: string
  fileCount: number
  /** posix relPath → base64 content(跨平台;写盘侧负责分隔符转换)。 */
  files: Record<string, string>
}

function walkDir(absDir: string, relDir: string, out: Record<string, string>): void {
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const abs = join(absDir, entry.name)
    const rel = relDir === '' ? entry.name : `${relDir}/${entry.name}`
    if (entry.isDirectory()) {
      walkDir(abs, rel, out)
    } else if (entry.isFile()) {
      out[rel] = readFileSync(abs).toString('base64')
    }
    // symlink/other: 资产树内不存在(git 管控的普通文件);出现即静默跳过。
  }
}

/**
 * 枚举 packageRoot 下的资产集 → v1 bundle。缺席目录静默跳过(routing/ 等在
 * 精简 checkout 下可缺),但 workflows/ 必须在场 — 它是解包完成度的 presence
 * probe(computeAssetsRoot / unpackAssets 同一判据),缺了整个机制不成立。
 */
export function collectAssets(packageRoot: string, version: string): AssetsBundle {
  const files: Record<string, string> = {}
  for (const dir of ASSET_DIRS) {
    const abs = join(packageRoot, dir)
    try {
      if (!statSync(abs).isDirectory()) continue
    } catch {
      continue // absent dir — skip
    }
    walkDir(abs, dir, files)
  }
  for (const f of ASSET_FILES) {
    try {
      files[f] = readFileSync(join(packageRoot, f)).toString('base64')
    } catch {
      /* absent top-level file — skip */
    }
  }
  if (!Object.keys(files).some((k) => k.startsWith('workflows/'))) {
    throw new Error(
      `collectAssets: no files under workflows/ in ${packageRoot} — the workflows dir is the unpack presence probe; refusing to build an unusable bundle`,
    )
  }
  return {
    schema: 'harnessed.assets-bundle.v1',
    version,
    fileCount: Object.keys(files).length,
    files,
  }
}
