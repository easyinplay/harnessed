// v4.16.1 T1 — npm-cli 组件的 PATH 二进制探测(ctx7 dogfood:L4 rescue 装好后,
// 每次 setup 仍 level-flag-missing + 重复 L4 prompt — 旧 npm-cli 原生检测只查
// ~/.claude/skills/<name>,对全局 CLI 无意义)。
//
// Covers:
//   - extractVerifyBinary: verify cmd 首 token(`ctx7 --version` → ctx7)
//   - extractVerifyBinary: POSIX builtin / runtime token(test/npx/node…)→ 回退 name
//   - extractVerifyBinary: 非 bare token(路径/变量)且 fallback 也非 bare → null
//   - binaryOnPath: DI 注入 run,命中/未命中/探测不可用(null)三态

import { describe, expect, it } from 'vitest'
import { binaryOnPath, extractVerifyBinary } from '../../src/installers/lib/binaryProbe.js'

describe('extractVerifyBinary (v4.16.1 T1)', () => {
  it('takes the verify cmd first token for plain CLI verifies', () => {
    expect(extractVerifyBinary('ctx7 --version', 'ctx7')).toBe('ctx7')
  })

  it('rejects POSIX builtins (test-chain verifies) and falls back to the manifest name', () => {
    expect(extractVerifyBinary('test -f ~/.claude/skills/gsd-plan-phase/SKILL.md', 'gsd')).toBe(
      'gsd',
    )
  })

  it('rejects runtime launchers (npx/node/npm) and falls back to the manifest name', () => {
    expect(extractVerifyBinary('npx @opengsd/gsd-core@latest --help', 'gsd')).toBe('gsd')
  })

  it('returns null when neither token nor fallback is a bare binary word', () => {
    expect(extractVerifyBinary('~/bin/tool --version', 'some/name')).toBe(null)
  })

  it('returns fallback when verify cmd is undefined', () => {
    expect(extractVerifyBinary(undefined, 'ctx7')).toBe('ctx7')
  })
})

describe('binaryOnPath (v4.16.1 T1)', () => {
  it('true when the finder reports a hit', () => {
    expect(
      binaryOnPath('ctx7', {
        platform: 'win32',
        run: () => ({ status: 0, stdout: 'C:\\Users\\u\\AppData\\Roaming\\npm\\ctx7.cmd\n' }),
      }),
    ).toBe(true)
  })

  it('false when the finder misses (non-zero exit)', () => {
    expect(
      binaryOnPath('ctx7', { platform: 'linux', run: () => ({ status: 1, stdout: '' }) }),
    ).toBe(false)
  })

  it('false when the finder hits but prints nothing (defensive)', () => {
    expect(
      binaryOnPath('ctx7', { platform: 'darwin', run: () => ({ status: 0, stdout: '  ' }) }),
    ).toBe(false)
  })

  it('false when the probe is unavailable (partial child_process mock → null)', () => {
    expect(binaryOnPath('ctx7', { platform: 'win32', run: () => null })).toBe(false)
  })
})
