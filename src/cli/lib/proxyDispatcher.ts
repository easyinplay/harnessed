// `harnessed update` 在受限网络下走系统代理。
//
// 实测(2026-10-14,Node v24.20.0 / bun 1.4.3,`HTTP_PROXY=http://127.0.0.1:9` 打 dead port):
//
//   Node,未设 `NODE_USE_ENV_PROXY`   → 代理被**忽略**,直连成功(200)
//   Node + `NODE_USE_ENV_PROXY=1`    → 走代理(连不上 dead port)
//   bun(编译二进制那条)             → **原生生效、默认就认**(ECONNREFUSED)
//
// 于是:
//  * **Node 上代理是 opt-in**。而 `NODE_USE_ENV_PROXY` 是进程**启动时**读的 —— 运行时写
//    `process.env` 已经太晚,harnessed 没法替用户打开它。所以 Node 这条得自己装
//    `undici` 的 `EnvHttpProxyAgent`(它按 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 选路)。
//  * **bun 那条什么都不做**,而且不该做:往编译二进制里塞 `undici` 只会增重,还可能在
//    bun 的 node 兼容层上出意外 —— 而它本来就已经按环境变量走代理了。
//
// 为什么 `undici` 用**变量 specifier** 动态 import:`bun build --compile` 会静态解析看得懂的
// import 并把目标打进二进制。specifier 是变量时它解析不了,于是这条 import 留到运行时 ——
// 而运行时只有 Node 会走到这里(compiled 分支在它之前就 return 了)。
//
// 全程 fail-soft:代理装不上只回落到「直连 + 既有的可操作报错 + npm 渠道兜底」,
// 绝不让「装代理失败」变成「update 失败」。

import { isCompiledRuntime } from '../../platform/assetsRoot.js'

/** `undici` 里本模块用到的那两样。用结构类型,不从 `undici` 导入类型 —— 它是可选依赖。 */
interface UndiciLike {
  EnvHttpProxyAgent?: new () => unknown
  setGlobalDispatcher?: (d: unknown) => void
}

export interface ProxyDispatcherDeps {
  /** 注入点:默认按变量 specifier 动态 import `undici`。 */
  loadUndici?: () => Promise<UndiciLike>
  /** 注入点:默认 `isCompiledRuntime()`。 */
  isCompiled?: () => boolean
}

export type ProxyDispatcherOutcome =
  /** 用户没配代理 —— 不碰全局 dispatcher。 */
  | 'no-proxy-env'
  /** 编译二进制(bun)—— 运行时自己认代理,无需我们插手。 */
  | 'native-runtime'
  /** 本进程已装过。 */
  | 'already'
  /** 刚装上。 */
  | 'installed'
  /** 拿不到可用的 `undici` —— 维持直连,调用方照旧报错即可。 */
  | 'unavailable'

/** 代理相关变量。`NO_PROXY` **不在**其中:它只是排除列表,单独出现时没有代理可走。 */
const PROXY_VARS = ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY'] as const

/** 用户是否真的配了代理(空串 / 纯空白算没配 —— CI 里常把变量置空)。 */
export function hasProxyEnv(): boolean {
  return PROXY_VARS.some((k) => (process.env[k] ?? '').trim() !== '')
}

let installed = false

/** 仅供测试:清掉「本进程已装」标记。 */
export function __resetProxyDispatcherForTests(): void {
  installed = false
}

/**
 * 需要时把 `EnvHttpProxyAgent` 装成全局 dispatcher。幂等,每进程最多装一次。
 *
 * **失败不缓存**:`unavailable` 不置 `installed`,所以偶发失败下次还能再试;
 * 而成功才置位,避免重复装。
 */
export async function ensureProxyDispatcher(
  deps: ProxyDispatcherDeps = {},
): Promise<ProxyDispatcherOutcome> {
  if (installed) return 'already'
  if (!hasProxyEnv()) return 'no-proxy-env'
  const isCompiled = deps.isCompiled ?? (() => isCompiledRuntime())
  if (isCompiled()) return 'native-runtime'

  const load =
    deps.loadUndici ??
    (async () => {
      // 变量 specifier:bun 的打包器静态解析不了,于是不会把 undici 打进二进制。
      const spec = 'undici'
      return (await import(spec)) as UndiciLike
    })
  try {
    const mod = await load()
    const Agent = mod.EnvHttpProxyAgent
    const setGlobalDispatcher = mod.setGlobalDispatcher
    if (typeof Agent !== 'function' || typeof setGlobalDispatcher !== 'function') {
      return 'unavailable'
    }
    setGlobalDispatcher(new Agent())
    installed = true
    return 'installed'
  } catch {
    return 'unavailable'
  }
}
