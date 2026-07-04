// B2 (v4.20.0) — 首跑资产解包器(compiled entry 消费;task_plan D2/D7)。
//
// 目标路径 = getAssetsRoot() compiled 分支解析的 <stateRoot>/assets/<version>/
// (调用方经 compiledAssetsDir() 取得,不复制常量)。判据契约:`<target>/workflows`
// 存在 = 已解包 — 与 computeAssetsRoot 的 presence probe(src/cli/lib/assetsRoot.ts)
// 同一判据。
//
// 原子性(D7):写入 `<target>.unpack-tmp`(同父目录,rename 原子)→ 计数校验
// (written === bundle.fileCount,防截断/损坏 bundle)→ 损坏残留清理 → rename。
// 任何失败:清 tmp 后 throw(调用方 entry fail-loud,B1 的 missing-assets 警告
// 语义保留在 getAssetsRoot)。

import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import type { AssetsBundle } from './bundleAssets.js'

export interface UnpackResult {
  status: 'already' | 'unpacked'
  fileCount: number
}

/**
 * 解包 bundle 到 targetRoot。已解包(workflows presence probe)→ 'already' 跳过;
 * 目标存在但损坏(无 workflows/)→ 整目录替换。
 */
export function unpackAssets(bundle: AssetsBundle, targetRoot: string): UnpackResult {
  if (existsSync(join(targetRoot, 'workflows'))) {
    return { status: 'already', fileCount: bundle.fileCount }
  }

  const tmp = `${targetRoot}.unpack-tmp`
  rmSync(tmp, { recursive: true, force: true }) // 中断残留
  try {
    const tmpResolved = resolve(tmp)
    let written = 0
    for (const [rel, b64] of Object.entries(bundle.files)) {
      // defense-in-depth:bundle 是自产物,但 relPath 逃逸仍硬拒(供应链姿势)。
      const dest = resolve(tmp, ...rel.split('/'))
      if (dest !== tmpResolved && !dest.startsWith(tmpResolved + sep)) {
        throw new Error(`unpackAssets: relPath escapes target ('${rel}') — refusing`)
      }
      mkdirSync(dirname(dest), { recursive: true })
      writeFileSync(dest, Buffer.from(b64, 'base64'))
      written++
    }
    if (written !== bundle.fileCount) {
      throw new Error(
        `unpackAssets: integrity check failed — bundle declares fileCount=${bundle.fileCount} but ${written} file(s) written`,
      )
    }
    mkdirSync(dirname(targetRoot), { recursive: true })
    // 目标存在但探针缺失 = 损坏/中断产物 → 替换(presence probe 已在函数头排除健康目标)。
    rmSync(targetRoot, { recursive: true, force: true })
    renameSync(tmp, targetRoot)
    return { status: 'unpacked', fileCount: written }
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true })
    throw e
  }
}
