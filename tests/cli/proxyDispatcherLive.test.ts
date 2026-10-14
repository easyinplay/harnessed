// 证明 dispatcher **真的**拦住了 global fetch —— 不 mock。
//
// `proxyDispatcher.test.ts` 用注入的假 undici 验接线逻辑;那证明不了「代理真生效」。
// 这一条跑真的 `undici`、真的 `setGlobalDispatcher`、真的 `fetch`,并断言请求被导向了
// 代理地址而不是目标主机。
//
// 为什么不需要外网:代理指向 **127.0.0.1 上一个死端口**。dispatcher 生效 → 连那个死端口
// 失败(本机行为,确定);没生效 → 会去连 example.com(需要外网)。所以断言落在
// 「错误里出现 127.0.0.1 / 该端口 / ECONNREFUSED」—— 只有被导向代理才可能出现这些。
//
// 这条测试也是我自己纠错的产物:先前拿 `update --check` 配 dead port 跑出了「够不到 npm」,
// 我差点据此宣布代理已生效 —— 实际那条路是子进程 `npm view`,代理由 **npm 自己**处理,
// 跟本改动无关。真出网的两处(binary 下载 / GitHub API)当时一处还没接。

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  __resetProxyDispatcherForTests,
  ensureProxyDispatcher,
} from '../../src/cli/lib/proxyDispatcher.js'

// 一个几乎不可能有人监听的端口(9 = discard,通常关闭)
const DEAD = 'http://127.0.0.1:9'
const KEYS = ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'NO_PROXY']
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
  __resetProxyDispatcherForTests()
})

afterEach(async () => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  // 把全局 dispatcher 复位,免得污染同进程里后续的测试文件
  try {
    const spec = 'undici'
    const { setGlobalDispatcher, Agent } = (await import(spec)) as {
      setGlobalDispatcher: (d: unknown) => void
      Agent: new () => unknown
    }
    setGlobalDispatcher(new Agent())
  } catch {
    /* undici 不在 → 本文件的用例也不会跑到需要复位的地方 */
  }
  __resetProxyDispatcherForTests()
})

describe('ensureProxyDispatcher — 真 undici、真 global fetch', () => {
  it('装上之后 http 请求被导向代理地址(而非目标主机)', async () => {
    process.env.HTTP_PROXY = DEAD
    expect(await ensureProxyDispatcher()).toBe('installed')

    let err: unknown
    try {
      await fetch('http://example.com', { signal: AbortSignal.timeout(8000) })
    } catch (e) {
      err = e
    }
    expect(err, 'fetch 应当失败 —— 成功说明它绕过了代理直连').toBeDefined()
    // 把 cause 链拼起来找证据:undici 把底层 connect 错误放在 cause 上
    const chain: string[] = []
    for (let e: unknown = err, i = 0; e && i < 5; i++) {
      const o = e as { message?: string; code?: string; cause?: unknown }
      chain.push(`${o.code ?? ''} ${o.message ?? ''}`)
      e = o.cause
    }
    const joined = chain.join(' | ')
    expect(
      /127\.0\.0\.1|ECONNREFUSED|:9\b/.test(joined),
      `错误里应能看出它去连了代理 ${DEAD};实际链路:${joined}`,
    ).toBe(true)
  })

  it('NO_PROXY 命中的主机绕过代理 —— 证明装的是 Env 版而非无条件代理', async () => {
    // 这条区分「装了 EnvHttpProxyAgent」和「把一切都塞进代理」。NO_PROXY 命中时
    // 请求直连,所以**不会**出现连 127.0.0.1:9 的痕迹。
    process.env.HTTP_PROXY = DEAD
    process.env.NO_PROXY = 'localhost,127.0.0.1'
    expect(await ensureProxyDispatcher()).toBe('installed')

    let err: unknown
    try {
      // 目标本身是 127.0.0.1 上另一个死端口:被 NO_PROXY 排除 → 直连 → 连它自己失败,
      // 而不是去连代理端口 9。
      await fetch('http://127.0.0.1:10', { signal: AbortSignal.timeout(8000) })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    const o = err as { message?: string; cause?: { message?: string; port?: number } }
    const joined = `${o.message ?? ''} | ${o.cause?.message ?? ''} | ${o.cause?.port ?? ''}`
    expect(joined).not.toMatch(/\b9\b(?!\d)/)
  })
})
