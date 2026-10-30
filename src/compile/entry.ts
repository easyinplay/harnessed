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

import pkg from '../../package.json' with { type: 'json' }
import { buildUpdateResult, createUpdateError } from '../cli/lib/updateResult.js'

const entryArgs = process.argv.slice(2)
if (entryArgs.length === 1 && entryArgs[0] === '--internal-update-identity') {
  process.stdout.write(`${pkg.version}\n`)
  process.exit(0)
}

function platformHint(args: string[]): 'claude' | 'codex' | undefined {
  let host: 'claude' | 'codex' | undefined
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--') break
    if (arg !== '--platform' && !arg?.startsWith('--platform=')) continue
    if (host !== undefined) throw new Error('--platform must be specified only once')
    const value = arg === '--platform' ? args[++index] : arg.slice(11)
    if (value !== 'claude' && value !== 'codex') {
      throw new Error('--platform requires claude or codex')
    }
    host = value
  }
  return host
}

function wantsUpdateFailureEnvelope(args: string[]): boolean {
  return (
    args.includes('update') &&
    args.some(
      (arg) =>
        arg === '--json' ||
        arg === '--update-continuation' ||
        arg.startsWith('--update-continuation='),
    )
  )
}

const operation = process.argv[2]
if (operation === 'update-reminder' || operation === 'update-reminder-worker') {
  try {
    const reminder = await import('./updateReminderEntrypoint.js')
    const options = { compiled: true, args: process.argv.slice(3) }
    if (operation === 'update-reminder') await reminder.runUpdateReminderEntrypoint(options)
    else await reminder.runUpdateReminderWorkerEntrypoint(options)
  } catch {}
  process.exit(0)
}

let selectedHost: 'claude' | 'codex' | null = null
try {
  const hint = platformHint(entryArgs)
  if (hint !== undefined) process.env.HARNESSED_PLATFORM = hint
  const ambientHost = process.env.HARNESSED_PLATFORM
  selectedHost = ambientHost === 'claude' || ambientHost === 'codex' ? ambientHost : null
  const { compiledAssetsDir } = await import('../platform/assetsRoot.js')
  const { default: bundle } = await import('./assets-bundle.gen.json', { with: { type: 'json' } })
  const { unpackAssets } = await import('./unpackAssets.js')
  const target = compiledAssetsDir(bundle.version)
  const r = unpackAssets(bundle, target)
  if (r.status === 'unpacked') {
    console.error(`harnessed: unpacked ${r.fileCount} bundled asset file(s) to ${target}`)
  }
} catch (e) {
  if (wantsUpdateFailureEnvelope(entryArgs)) {
    console.log(
      JSON.stringify(
        buildUpdateResult({
          mode: entryArgs.includes('--check')
            ? 'check'
            : entryArgs.includes('--dry-run')
              ? 'dry-run'
              : 'apply',
          host: selectedHost,
          runtime: 'compiled',
          components: [],
          error: createUpdateError(e, 'fatal', 'asset-preflight-failed'),
        }),
      ),
    )
  }
  console.error(
    `harnessed: FATAL — bundled asset unpack failed: ${(e as Error).message}. ` +
      `Asset-dependent commands cannot run from this binary; retry, check disk/permissions, ` +
      `or use the npm distribution (npm i -g harnessed).`,
  )
  process.exit(1)
}

await import('../cli.js')
