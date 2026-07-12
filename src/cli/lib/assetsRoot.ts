// B1 (v4.19.0) — 资产解析 seam(bun-compile 分发路线 Phase 1;spike:
// .planning/phases/_spike-bun-compile/findings.md)。
//
// 问题:getPackageRoot() 基于 import.meta.url;`bun build --compile` 产物里
// import.meta.url 指向 bun 虚拟文件系统(bunfs),包根不存在 → workflows/ /
// manifests/ / messages/ 等运行时资产全部落空(spike 实测:异地 cwd 下 exe 跑
// setup → workflows_not_found)。
//
// seam 语义(v9.0 PlatformDescriptor 同款打法 — Phase 1 建缝零行为变化):
//   1. env HARNESSED_ASSETS_OVERRIDE — 显式覆盖,verbatim 信任(测试/逃生)
//   2. compiled 运行时(bunfs 前缀)→ <stateRoot>/assets/<version>/ ;资产缺失
//      不 throw(调用方现有 missing-file 错误路径更友好),改一次性 console.error
//      警告 — 解包数据源属 Phase 2(编译管线),本 phase 该目录只会由人工/测试铺设
//   3. 默认(npm 全局装 / 本地 dev / vitest)→ 严格等于 getPackageRoot(),
//      现有全量测试即等价性回归网
//
// 独立新模块(不并入 packagePath.ts):packagePath 有既有 vi.mock 消费面,加导出
// 会炸 factory mock(memory 教训 mock-export-gap-extract-module)。
// version 经 json-import 内嵌(tsup 打包;compiled 模式下 --version 可用即此机制)。

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import pkg from '../../../package.json' with { type: 'json' }
import { detectPlatform } from '../../installers/lib/platform.js'
import { getPackageRoot } from './packagePath.js'

/** bunfs 虚拟根前缀(spike 实测两形:unix `/$bunfs/`、Windows `B:/~BUN/`)。
 *  统一斜杠后做子串匹配,不依赖宿主分隔符(3-OS CI)。 */
const BUNFS_MARKERS = ['/$bunfs/', '/~bun/'] as const

/** Injectable deps — 生产默认读真实系统;测试注入。
 *  stateRoot 是 thunk:仅 compiled 分支才求值 — detectPlatform() 在部分 mock 了
 *  node:fs 的既有测试环境(gates / setup-locale 等)会抛,npm 路径不得触碰它。 */
export interface AssetsRootDeps {
  env: Record<string, string | undefined>
  /** 本模块的 import.meta.url(compiled 检测输入)。 */
  moduleUrl: string
  exists: (p: string) => boolean
  stateRoot: () => string
  packageRoot: string
  version: string
}

export type AssetsRootSource = 'override' | 'compiled' | 'package'

export interface AssetsRootResolution {
  root: string
  source: AssetsRootSource
  /** compiled 且资产目录缺失(fail-loud 由 getAssetsRoot 的一次性警告 + 调用方
   *  既有 missing-file 路径共同承担;Phase 2 解包管线就位前恒为 true)。 */
  compiledAssetsMissing: boolean
}

/** 4.27.0 (B3 Slice 1) — runtime-level compiled predicate,单一 SoT seam:
 *  update.ts 模式分流 / hookEntry compiled 路由 / check-update 数据源分流共用。
 *  纯包装 isCompiledModuleUrl(本模块 import.meta.url);url 参数仅供测试注入。 */
export function isCompiledRuntime(url: string = import.meta.url): boolean {
  return isCompiledModuleUrl(url)
}

export function isCompiledModuleUrl(url: string): boolean {
  // bun 的 import.meta.url 会把 `~` 百分号编码(实测:file:///B:/%7EBUN/root/cli.exe)
  // — 先 decode 再匹配;decode 失败(畸形 URI)按原文匹配。
  let s = url
  try {
    s = decodeURIComponent(url)
  } catch {
    /* malformed escape — match raw */
  }
  const normalized = s.replace(/\\/g, '/').toLowerCase()
  return BUNFS_MARKERS.some((m) => normalized.includes(m))
}

/** 纯函数解析(deps 注入,单测目标)。 */
export function computeAssetsRoot(d: AssetsRootDeps): AssetsRootResolution {
  const override = d.env.HARNESSED_ASSETS_OVERRIDE
  if (override && override.trim().length > 0) {
    return { root: override.trim(), source: 'override', compiledAssetsMissing: false }
  }
  if (isCompiledModuleUrl(d.moduleUrl)) {
    const root = join(d.stateRoot(), 'assets', d.version) // = compiledAssetsDir(注入形)
    // workflows/ 是资产集的必然成员 — 以它的存在代表解包完成。
    const present = d.exists(join(root, 'workflows'))
    return { root, source: 'compiled', compiledAssetsMissing: !present }
  }
  return { root: d.packageRoot, source: 'package', compiledAssetsMissing: false }
}

/** B2 — compiled 资产目标目录(单一 SoT:computeAssetsRoot compiled 分支与
 *  compile/entry.ts 的首跑解包写入同一路径;entry 复用本导出而非复制构造)。 */
export function compiledAssetsDir(version: string): string {
  return join(detectPlatform().stateRoot, 'assets', version)
}

function realDeps(): AssetsRootDeps {
  return {
    env: process.env,
    moduleUrl: import.meta.url,
    exists: (p) => {
      try {
        return existsSync(p)
      } catch {
        return false
      }
    },
    stateRoot: () => detectPlatform().stateRoot,
    packageRoot: getPackageRoot(),
    version: pkg.version,
  }
}

let warnedMissing = false

/**
 * 运行时资产根(workflows/ manifests/ messages/ routing/ config-templates/ …)。
 * npm/dev 模式下严格 === getPackageRoot()(D1 等价性铁律)。
 */
export function getAssetsRoot(): string {
  const r = computeAssetsRoot(realDeps())
  if (r.source === 'compiled' && r.compiledAssetsMissing && !warnedMissing) {
    warnedMissing = true
    console.error(
      `warning: compiled harnessed binary but bundled assets are not unpacked at ${r.root} — ` +
        `asset-dependent commands (setup / run / prompt / install) will fail. ` +
        `Reinstall the binary, or use the npm distribution (npm i -g harnessed). ` +
        `(asset unpack pipeline lands in a later release — B1 seam)`,
    )
  }
  return r.root
}
