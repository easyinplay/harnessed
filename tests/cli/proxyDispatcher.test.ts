// `harnessed update` 在受限网络下走系统代理。
//
// 实测(2026-10-14,本机 Node v24.20.0 / bun 1.4.3)决定了这个设计:
//
//   | 运行时                              | `HTTP_PROXY=http://127.0.0.1:9` 的行为 |
//   |-------------------------------------|----------------------------------------|
//   | Node,未设 `NODE_USE_ENV_PROXY`      | **被忽略** —— 直连成功(200)           |
//   | Node + `NODE_USE_ENV_PROXY=1`       | 走代理(连 dead port 失败)             |
//   | bun(编译二进制那条)                | **原生生效,默认就认**(ECONNREFUSED)  |
//
// 两条推论:
//  1. Node 上代理是 **opt-in**,默认忽略;而 `NODE_USE_ENV_PROXY` 是 Node **启动时**读的,
//     运行时写 `process.env` 太晚 —— harnessed 不能替用户打开它。所以 Node 这条必须自己装
//     dispatcher(`undici` 的 `EnvHttpProxyAgent`)。
//  2. **bun 那条什么都不用做**,而且不该做:在编译二进制里去 import `undici` 只会增重并可能失败。
//     所以 compiled runtime 直接跳过 —— 这也是本文件头一条断言。
//
// 为什么 `undici` 用**变量 specifier** 动态 import:`bun build --compile` 会静态解析
// 能看懂的 import 并把它打进二进制。specifier 是变量时解析不了,于是它留在运行时 ——
// 而运行时只有 Node 会走到那里。配 try/catch:拿不到 `undici` 就维持现状(可操作报错 + npm 渠道兜底),
// 绝不因为代理装不上而让 update 失败。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetProxyDispatcherForTests,
  ensureProxyDispatcher,
  hasProxyEnv,
} from '../../src/cli/lib/proxyDispatcher.js'

const PROXY_KEYS = [
  'HTTP_PROXY',
  'http_proxy',
  'HTTPS_PROXY',
  'https_proxy',
  'ALL_PROXY',
  'NO_PROXY',
]
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of PROXY_KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
  __resetProxyDispatcherForTests()
})

afterEach(() => {
  for (const k of PROXY_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  __resetProxyDispatcherForTests()
})

describe('hasProxyEnv — 只在用户真的配了代理时才动 dispatcher', () => {
  it('无任何代理变量 → false', () => {
    expect(hasProxyEnv()).toBe(false)
  })

  it.each([
    'HTTP_PROXY',
    'http_proxy',
    'HTTPS_PROXY',
    'https_proxy',
    'ALL_PROXY',
  ])('%s 有值 → true', (key) => {
    process.env[key] = 'http://127.0.0.1:8080'
    expect(hasProxyEnv()).toBe(true)
  })

  it('只有 NO_PROXY 不算配了代理', () => {
    // NO_PROXY 是排除列表,单独出现时无代理可用 —— 据此装 dispatcher 是白装。
    process.env.NO_PROXY = 'example.com'
    expect(hasProxyEnv()).toBe(false)
  })

  it('空串 / 纯空白视为未设(常见于 CI 里被清空的变量)', () => {
    process.env.HTTP_PROXY = ''
    expect(hasProxyEnv()).toBe(false)
    process.env.HTTP_PROXY = '   '
    expect(hasProxyEnv()).toBe(false)
  })
})

describe('ensureProxyDispatcher', () => {
  it('没配代理 → 什么都不做,不去 import undici', async () => {
    const load = vi.fn()
    const set = vi.fn()
    const r = await ensureProxyDispatcher({ loadUndici: load, isCompiled: () => false })
    expect(r).toBe('no-proxy-env')
    expect(load).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })

  it('编译二进制 → 跳过(bun 原生认代理,再装只会增重)', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080'
    const load = vi.fn()
    const r = await ensureProxyDispatcher({ loadUndici: load, isCompiled: () => true })
    expect(r).toBe('native-runtime')
    expect(load).not.toHaveBeenCalled()
  })

  it('Node + 配了代理 → 装一次 EnvHttpProxyAgent', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080'
    const setGlobalDispatcher = vi.fn()
    const agent = { marker: 'env-agent' }
    const loadUndici = vi.fn(async () => ({
      EnvHttpProxyAgent: class {
        marker = 'env-agent'
      },
      setGlobalDispatcher,
    }))
    const r = await ensureProxyDispatcher({ loadUndici, isCompiled: () => false })
    expect(r).toBe('installed')
    expect(loadUndici).toHaveBeenCalledTimes(1)
    expect(setGlobalDispatcher).toHaveBeenCalledTimes(1)
    expect(setGlobalDispatcher.mock.calls[0]?.[0]).toMatchObject(agent)
  })

  it('幂等:第二次调用不再 import、不再设置', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080'
    const setGlobalDispatcher = vi.fn()
    const loadUndici = vi.fn(async () => ({
      EnvHttpProxyAgent: class {},
      setGlobalDispatcher,
    }))
    const deps = { loadUndici, isCompiled: () => false }
    expect(await ensureProxyDispatcher(deps)).toBe('installed')
    expect(await ensureProxyDispatcher(deps)).toBe('already')
    expect(loadUndici).toHaveBeenCalledTimes(1)
    expect(setGlobalDispatcher).toHaveBeenCalledTimes(1)
  })

  it('undici 拿不到 → fail-soft,不抛,也不标记成已装', async () => {
    // 代理装不上只该让 update 回到「直连 + 可操作报错」,绝不能让 update 本身失败。
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080'
    const loadUndici = vi.fn(async () => {
      throw new Error('Cannot find module undici')
    })
    const r = await ensureProxyDispatcher({ loadUndici, isCompiled: () => false })
    expect(r).toBe('unavailable')
    // 不缓存失败:万一是偶发,下次仍可重试
    const r2 = await ensureProxyDispatcher({ loadUndici, isCompiled: () => false })
    expect(r2).toBe('unavailable')
    expect(loadUndici).toHaveBeenCalledTimes(2)
  })

  it('undici 在但缺 EnvHttpProxyAgent(老版本)→ 同样 fail-soft', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080'
    const setGlobalDispatcher = vi.fn()
    const loadUndici = vi.fn(async () => ({ setGlobalDispatcher }) as never)
    expect(await ensureProxyDispatcher({ loadUndici, isCompiled: () => false })).toBe('unavailable')
    expect(setGlobalDispatcher).not.toHaveBeenCalled()
  })
})
