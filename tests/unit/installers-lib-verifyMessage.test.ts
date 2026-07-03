// v4.15.1 T3 — verify 失败消息统一格式(空 stderr 悬空冒号根因:WSL stub 报错走 stdout)。
// v4.16.0 T5 — formatSpawnFail:install spawn 阶段错误同样 stdout 兜底
// (design-taste dogfood:"npx skills add exited 3221226505: " 空尾)。

import { describe, expect, it } from 'vitest'
import { formatSpawnFail, formatVerifyFail } from '../../src/installers/lib/verifyMessage.js'

describe('formatVerifyFail (v4.15.1 T3)', () => {
  it('includes cmd + stderr tail', () => {
    const m = formatVerifyFail('test -f ~/x', 1, 0, '', 'boom happened')
    expect(m).toBe('verify failed (exit 1 ≠ expected 0): `test -f ~/x` — boom happened')
  })

  it('falls back to stdout when stderr is empty (WSL stub writes errors to stdout)', () => {
    const m = formatVerifyFail('ctx7 --version', 1, 0, 'no distro installed', '')
    expect(m).toContain('— no distro installed')
  })

  it('never dangles a colon: both streams empty → (no output)', () => {
    const m = formatVerifyFail('test -f ~/x', 1, 0, '', '   ')
    expect(m).toContain('— (no output)')
    expect(m.endsWith(': ')).toBe(false)
  })

  it('truncates long cmds at 80 chars with ellipsis', () => {
    const long = `test -f ${'a'.repeat(100)}`
    const m = formatVerifyFail(long, 2, 0, '', 'e')
    expect(m).toContain('…')
    expect(m).toContain('exit 2 ≠ expected 0')
  })
})

describe('formatSpawnFail (v4.16.0 T5)', () => {
  it('stderr present → label + exit + sanitized stderr tail', () => {
    expect(formatSpawnFail('npx skills add', 1, '', 'npm ERR boom')).toBe(
      'npx skills add exited 1: npm ERR boom',
    )
  })

  it('stderr empty → stdout fallback (WSL/npx crashes write stdout or nothing)', () => {
    expect(formatSpawnFail('git-clone-with-setup cmd', 1, 'setup: bun not found', '')).toContain(
      'setup: bun not found',
    )
  })

  it('both empty → (no output), no dangling colon', () => {
    const m = formatSpawnFail('npx skills add', 3221226505, '', '')
    expect(m).toBe('npx skills add exited 3221226505: (no output)')
  })
})
