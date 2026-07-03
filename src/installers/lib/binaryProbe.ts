// v4.16.1 T1 — npm-cli 组件的 PATH 二进制探测(ctx7 dogfood 根因)。
//
// L4 rescue 装好 ctx7 后,每次 setup 仍报 level-flag-missing 并重复 L4 prompt:
// idempotent.ts 的 npm-cli 原生检测只查 `<skillsDir>/<name>`(对全局 npm CLI 无意义),
// shell fallback `command -v ctx7` 在 win32 走 cmd.exe 也永远失败。本模块用
// `where <bin>`(win)/`which <bin>`(unix)原生探测,detectNative 的 npm-cli
// 分支优先消费 → 第二次 setup 直接 already-installed,不再进 L4 gate。
//
// 独立新模块(不塞 idempotent.ts 直接 import spawnSync):安装器测试大量
// factory-mock `node:child_process` 且多数只提供 `spawn` — spawnSync 必须
// try/catch 容忍 undefined(sister resolveBash realWhere 模式)。

import { spawnSync } from 'node:child_process'

/** Injectable probes — production defaults read the real system; tests inject. */
export interface BinaryProbeDeps {
  platform: NodeJS.Platform
  /** `where|which <bin>` result; null = probe unavailable (partial mock / spawn error). */
  run: (finder: string, bin: string) => { status: number | null; stdout: string } | null
}

// verify cmd 首 token 若是 shell builtin / coreutil / 运行时启动器,证明不了
// 组件本身在 PATH 上(`test -f …` 的 test、`npx pkg` 的 npx 永远命中)。
const NON_COMPONENT_TOKENS = new Set([
  'test',
  'grep',
  'ls',
  'cat',
  'echo',
  'command',
  'sh',
  'bash',
  '[',
  'npx',
  'npm',
  'node',
  'corepack',
  'pnpm',
  'yarn',
  'bun',
  'git',
  'claude',
  'codex',
])

/** Bare binary word — no paths / variables / quotes (those can't be `where`d). */
const BARE_BIN_RE = /^[A-Za-z0-9][\w.@-]*$/

/** Pick the probe-able binary name for an npm-cli manifest: the verify cmd's
 *  first token (`ctx7 --version` → `ctx7`) when it is a bare non-builtin word,
 *  else the manifest name, else null (no meaningful probe possible). */
export function extractVerifyBinary(
  verifyCmd: string | undefined,
  fallback: string,
): string | null {
  const token = verifyCmd?.trim().split(/\s+/)[0]
  if (token && BARE_BIN_RE.test(token) && !NON_COMPONENT_TOKENS.has(token)) return token
  if (BARE_BIN_RE.test(fallback) && !NON_COMPONENT_TOKENS.has(fallback)) return fallback
  return null
}

function realRun(finder: string, bin: string): { status: number | null; stdout: string } | null {
  try {
    // spawnSync may be undefined under partial `node:child_process` factory mocks.
    if (typeof spawnSync !== 'function') return null
    const r = spawnSync(finder, [bin], { encoding: 'utf8' })
    if (!r || r.error) return null
    return { status: r.status, stdout: r.stdout ?? '' }
  } catch {
    return null
  }
}

/** Is `bin` resolvable on PATH? Probe-unavailable (null) counts as NOT found —
 *  callers fall through to the legacy detection chain (never a false positive). */
export function binaryOnPath(bin: string, deps?: Partial<BinaryProbeDeps>): boolean {
  const platform = deps?.platform ?? process.platform
  const run = deps?.run ?? realRun
  const finder = platform === 'win32' ? 'where' : 'which'
  const r = run(finder, bin)
  if (!r || r.status !== 0) return false
  return r.stdout.trim().length > 0
}
