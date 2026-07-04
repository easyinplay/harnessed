// B2 (v4.20.0) — bun-compile 专属入口(task_plan D2)。
//
// `bun build --compile src/compile/entry.ts` 的编译单元:静态 import 构建期生成的
// assets-bundle.gen.json(scripts/build-binary.mjs 产,.gitignore;bun 将其嵌入
// 二进制)→ 首跑解包到 compiledAssetsDir(bundle.version)(= getAssetsRoot()
// compiled 分支解析的同一路径,B1 seam 契约)→ 动态 import 现有 CLI 主入口
// (src/cli.ts 顶层即 parse,行为与 node dist/cli.mjs 一致)。
//
// 本文件被 tsconfig `exclude`(gen.json 仅构建期存在,tsc 会 TS2307;类型保护
// 损失局限于此 30 行,biome 仍覆盖)— tsup/npm 渠道零接触(不在 tsup entry 图)。
// 诊断输出走 stderr:stdout 留给子命令的 --json 消费者。

import { compiledAssetsDir } from '../cli/lib/assetsRoot.js'
// @ts-expect-error — 构建期生成物(.gitignore),tsc 项目已 exclude 本文件,此注释仅为编辑器降噪。
import bundle from './assets-bundle.gen.json' with { type: 'json' }
import { unpackAssets } from './unpackAssets.js'

try {
  const target = compiledAssetsDir(bundle.version)
  const r = unpackAssets(bundle, target)
  if (r.status === 'unpacked') {
    console.error(`harnessed: unpacked ${r.fileCount} bundled asset file(s) to ${target}`)
  }
} catch (e) {
  console.error(
    `harnessed: FATAL — bundled asset unpack failed: ${(e as Error).message}. ` +
      `Asset-dependent commands cannot run from this binary; retry, check disk/permissions, ` +
      `or use the npm distribution (npm i -g harnessed).`,
  )
  process.exit(1)
}

await import('../cli.js')
