// v4.16.1 T3 — bun 依赖显性化(gstack dogfood 真因)。
//
// 上游 garrytan/gstack 的 `setup` 脚本第一个检查即 `command -v bun`,缺失
// exit 1 — "Error: bun is required but not installed." 在 stderr 尾部,曾被
// 头部截取裁掉(同版 T2 修复)。bun 只是 gstack 的构建依赖(browse binary),
// 非 harnessed 核心 → warn-only(B-06 warn ≠ fail),sister checkJq 模式:
// win/darwin 提供可静默的 install_commands 进 setup 末 auto-install;linux 官方
// 路径是 `curl … | bash`(远程脚本管道),不做自动执行,只给 fix 文案。

import { spawnSync } from 'node:child_process'
import type { CheckResult } from './check-builtin.js'

/** Injectable probe — production default reads the real system; tests inject. */
export interface CheckBunDeps {
  platform: NodeJS.Platform
  /** `where|which bun` result; null = probe unavailable (partial mock / spawn error). */
  run: (finder: string) => { status: number | null; stdout: string } | null
}

function realRun(finder: string): { status: number | null; stdout: string } | null {
  try {
    // spawnSync may be undefined under partial `node:child_process` factory mocks.
    if (typeof spawnSync !== 'function') return null
    const r = spawnSync(finder, ['bun'], { encoding: 'utf8' })
    if (!r || r.error) return null
    return { status: r.status, stdout: r.stdout ?? '' }
  } catch {
    return null
  }
}

export function checkBun(deps?: Partial<CheckBunDeps>): CheckResult {
  const platform = deps?.platform ?? process.platform
  const run = deps?.run ?? realRun
  const finder = platform === 'win32' ? 'where' : 'which'
  const r = run(finder)
  if (r && r.status === 0 && r.stdout.trim().length > 0) {
    return {
      name: 'bun present',
      status: 'pass',
      message: r.stdout.split(/\r?\n/)[0]?.trim() ?? 'bun found',
    }
  }
  const missing: CheckResult = {
    name: 'bun present',
    status: 'warn',
    message:
      'bun not found in PATH — gstack setup builds its browse binary with bun (gstack refresh will fail without it)',
  }
  if (platform === 'win32') {
    return {
      ...missing,
      fix: 'winget install Oven-sh.Bun',
      install_commands: ['winget install Oven-sh.Bun'],
    }
  }
  if (platform === 'darwin') {
    return {
      ...missing,
      fix: 'brew install oven-sh/bun/bun',
      install_commands: ['brew install oven-sh/bun/bun'],
    }
  }
  // linux — official path pipes a remote script; surfaced as text only (never auto-run).
  return {
    ...missing,
    fix: 'see https://bun.sh/docs/installation (curl -fsSL https://bun.sh/install | bash — review the script first)',
  }
}
