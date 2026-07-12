#!/usr/bin/env bun
// B2 (v4.20.0) — 单文件二进制构建管线(task_plan D3)。必须用 bun 运行:
//   bun scripts/build-binary.mjs [--target <bun-target>] [--outfile <path>]
// 步骤:collectAssets(仓库根资产集)→ 写 src/compile/assets-bundle.gen.json
// (.gitignore 生成物)→ `bun build --compile src/compile/entry.ts` → dist-bin/。
// npm 渠道(tsup dist)零接触;本脚本 import TS 源(bun 原生转译),不依赖 dist。

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// bun 转译 TS import;若误用 node 运行,此 import 即报错(fail-fast 提示见 catch 下方)。
import { collectAssets } from '../src/compile/bundleAssets.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const args = process.argv.slice(2)
const argOf = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined
}
const target = argOf('--target') // e.g. bun-linux-x64;缺省 = 宿主(CI 各 OS 原生编译,D4)
const platTag =
  target?.replace(/^bun-/, '') ??
  `${{ win32: 'windows', darwin: 'darwin', linux: 'linux' }[process.platform] ?? process.platform}-${process.arch}`
const ext = platTag.startsWith('windows') ? '.exe' : ''
const outfile = argOf('--outfile') ?? join(root, 'dist-bin', `harnessed-${platTag}${ext}`)

// 1. bundle 生成(version 一致性:bundle.version === package.json.version,
//    entry 解包目标与 assetsRoot 的 pkg.version 构造必然对齐)。
const bundle = collectAssets(root, pkg.version)
const genPath = join(root, 'src', 'compile', 'assets-bundle.gen.json')
writeFileSync(genPath, JSON.stringify(bundle))
console.error(
  `[build-binary] bundle: ${bundle.fileCount} file(s), ${(statSync(genPath).size / 1024 / 1024).toFixed(1)} MB → ${genPath}`,
)

// 2. bun build --compile
mkdirSync(dirname(outfile), { recursive: true })
const buildArgs = [
  'build',
  '--compile',
  join(root, 'src', 'compile', 'entry.ts'),
  '--outfile',
  outfile,
  ...(target ? [`--target=${target}`] : []),
]
const r = spawnSync(process.execPath, buildArgs, { cwd: root, stdio: 'inherit' })
if (r.status !== 0) {
  console.error(`[build-binary] bun build --compile exited ${r.status ?? 'null'}`)
  process.exit(r.status ?? 1)
}
console.error(
  `[build-binary] ok: ${outfile} (${(statSync(outfile).size / 1024 / 1024).toFixed(0)} MB, v${pkg.version})`,
)

// 3. per-asset .sha256(4.27.0 B3 T3 — 冻结契约:update 端完整性校验数据源)。
//    sha256sum 兼容格式 `<hex>  <filename>`;每个 matrix job 只写自己的资产,
//    规避单一 SUMS 文件被 3 并行 job 互相 --clobber 的竞态;publish.yml 的
//    `dist-bin/harnessed-*` glob 顺带上传本文件,管线零改动。
const hex = createHash('sha256').update(readFileSync(outfile)).digest('hex')
writeFileSync(`${outfile}.sha256`, `${hex}  ${basename(outfile)}\n`)
console.error(`[build-binary] sha256: ${outfile}.sha256`)
