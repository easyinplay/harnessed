// v4.15.1 T1 — Windows Git-Bash 显式解析(WSL stub 根因修复)。
//
// 用户 dogfood(v4.15.0, Windows):PATH 上的 `bash` 是 C:\Windows\System32\bash.exe
// — WSL stub(且无发行版:exit 1 + CP936 报错走 stdout)。4.14 起所有 posixShell
// spawn 走 `spawn('bash')` 打到它 → 二级 verify / ctx7 verify / force-update refresh
// 全灭(组件实际装成功;doctor checkWinBash 检出但 setup 不消费)。
//
// 解析顺序(healthy 机器行为尽量 byte-compatible):
//   1. env HARNESSED_BASH — 显式覆盖,verbatim 信任
//   2. PATH 首个 bash 若非 WSL — 与 pre-4.15.1 `spawn('bash')` 等价(健康机器零变化)
//   3. `where git` 派生 <gitroot>\bin\bash.exe / usr\bin\bash.exe
//   4. 标准安装位置(Program Files / (x86) / ProgramW6432 / LOCALAPPDATA\Programs)
//   5. PATH 后续任一非 WSL 项
//   6. PATH 只有 WSL stub → path null + reason 'wsl-only'(拒绝 spawn WSL,fail-loud)
//   7. 完全探测不到(无 bash / child_process 被 mock)→ 字面 'bash' 回退
//      (等价 pre-4.15.1 行为:spawn ENOENT → 既有 bash-missing 错误路径)
//
// 独立新模块(不塞 spawn.ts / check-builtin.ts):既有测试对 node:child_process 的
// factory mock 只提供 spawn,本模块的 spawnSync 调用必须 try/catch 容忍 undefined
// (memory 教训 mock-export-gap-extract-module 的同类风险)。结果 memoize(spawnCmd
// 热路径,每次 verify 都 `where` 会拖慢 setup);测试用 resetBashResolutionCache 隔离。

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface BashResolution {
  /** Absolute bash path, literal 'bash' (legacy fallback), or null (refused). */
  path: string | null
  source: 'env' | 'path' | 'git-derived' | 'standard-location' | 'path-fallback'
  /** Set when path === null. 'wsl-only' = PATH has only the WSL stub. */
  reason?: 'wsl-only' | 'not-applicable'
  /** PATH-first bash when it is a WSL stub (diagnostic — doctor checkWinBash warn). */
  wslOnPath?: string
}

/** Injectable probes — production defaults read the real system; tests inject. */
export interface ResolveBashDeps {
  platform: NodeJS.Platform
  env: Record<string, string | undefined>
  /** `where <name>` result lines (already trimmed, empty array = not found / unavailable). */
  where: (name: string) => string[]
  exists: (p: string) => boolean
}

const WSL_STUB_RE = /[\\/]windows[\\/](system32|sysnative|syswow64)[\\/]bash\.exe$/i

function realWhere(name: string): string[] {
  try {
    // spawnSync may be undefined under partial `node:child_process` factory mocks
    // (most installer tests only stub `spawn`) — degrade to "unavailable".
    if (typeof spawnSync !== 'function') return []
    const r = spawnSync('where', [name], { encoding: 'utf8' })
    if (!r || r.status !== 0) return []
    return (r.stdout ?? '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  } catch {
    return []
  }
}

function realExists(p: string): boolean {
  try {
    return existsSync(p)
  } catch {
    return false
  }
}

function defaultDeps(): ResolveBashDeps {
  return {
    platform: process.platform,
    env: process.env,
    where: realWhere,
    exists: realExists,
  }
}

let cache: BashResolution | null = null

/** Reset the memoized resolution (tests). Pass `next` to pin a fake resolution. */
export function resetBashResolutionCache(next?: BashResolution): void {
  cache = next ?? null
}

export function resolveBash(deps?: Partial<ResolveBashDeps>): BashResolution {
  if (cache) return cache
  cache = compute({ ...defaultDeps(), ...deps })
  return cache
}

function compute(d: ResolveBashDeps): BashResolution {
  if (d.platform !== 'win32') {
    // Non-Windows callers never reach the bash branch (POSIX uses /bin/sh).
    return { path: null, source: 'path', reason: 'not-applicable' }
  }

  // 1. Explicit override.
  const envBash = d.env.HARNESSED_BASH
  if (envBash && envBash.trim().length > 0) {
    return { path: envBash.trim(), source: 'env' }
  }

  const pathLines = d.where('bash')
  const first = pathLines[0]
  const wslOnPath = first && WSL_STUB_RE.test(first) ? first : undefined

  // 2. PATH-first bash, when not the WSL stub — byte-compatible with pre-4.15.1.
  if (first && !WSL_STUB_RE.test(first)) {
    return { path: first, source: 'path' }
  }

  // 3. Derive from git.exe location (Git for Windows ships bash next to git).
  const gitFirst = d.where('git')[0]
  if (gitFirst && /git\.exe$/i.test(gitFirst)) {
    const root = dirname(dirname(gitFirst))
    for (const cand of [join(root, 'bin', 'bash.exe'), join(root, 'usr', 'bin', 'bash.exe')]) {
      if (d.exists(cand)) return { path: cand, source: 'git-derived', wslOnPath }
    }
  }

  // 4. Standard Git for Windows install locations.
  const bases = [
    d.env.ProgramFiles,
    d.env.ProgramW6432,
    d.env['ProgramFiles(x86)'],
    d.env.LOCALAPPDATA ? join(d.env.LOCALAPPDATA, 'Programs') : undefined,
  ]
  for (const base of bases) {
    if (!base) continue
    for (const cand of [
      join(base, 'Git', 'bin', 'bash.exe'),
      join(base, 'Git', 'usr', 'bin', 'bash.exe'),
    ]) {
      if (d.exists(cand)) return { path: cand, source: 'standard-location', wslOnPath }
    }
  }

  // 5. Any later non-WSL PATH entry.
  const laterNonWsl = pathLines.find((l) => !WSL_STUB_RE.test(l))
  if (laterNonWsl) return { path: laterNonWsl, source: 'path', wslOnPath }

  // 6. PATH has ONLY the WSL stub → refuse (spawning it can never work: `~` is the
  //    Linux home, and distro-less stubs exit 1 with a CP936 error on stdout).
  if (pathLines.length > 0) {
    return { path: null, source: 'path', reason: 'wsl-only', wslOnPath: first }
  }

  // 7. Nothing knowable — legacy literal fallback preserves the pre-4.15.1
  //    ENOENT → 'bash-missing' error path (also keeps partially-mocked tests inert).
  return { path: 'bash', source: 'path-fallback' }
}
