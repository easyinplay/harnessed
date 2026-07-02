// v4.15.1 T2 — nativeTest: `test -f|-d <path>` 链的零 shell 原生求值。
//
// 本仓 verify/idempotent 的主形态是 test-chain(`test -f A || test -f B`),
// 4.15.0 前 Windows 上必须借 bash;WSL stub 环境全灭(用户 dogfood)。原生求值
// 用 fs 直判,跨 OS 零 shell。文法保守:含管道/重定向/变量/glob/引号/其他命令
// 一律返回 null(交回 spawn 路径)。

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { evalTestChain } from '../../src/installers/lib/nativeTest.js'

const tmp = mkdtempSync(join(tmpdir(), 'harnessed-nativetest-'))
const fileA = join(tmp, 'a.md')
const dirB = join(tmp, 'sub')
writeFileSync(fileA, 'x')
mkdirSync(dirB)
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

// Forward-slash form (manifests always use ~/ + forward slashes).
const fileAFwd = fileA.replace(/\\/g, '/')
const dirBFwd = dirB.replace(/\\/g, '/')

describe('evalTestChain (v4.15.1 T2)', () => {
  it('test -f <existing file> → true', () => {
    expect(evalTestChain(`test -f ${fileAFwd}`)).toBe(true)
  })

  it('test -f <missing> → false', () => {
    expect(evalTestChain(`test -f ${fileAFwd}.nope`)).toBe(false)
  })

  it('test -d distinguishes dirs from files', () => {
    expect(evalTestChain(`test -d ${dirBFwd}`)).toBe(true)
    expect(evalTestChain(`test -d ${fileAFwd}`)).toBe(false)
    expect(evalTestChain(`test -f ${dirBFwd}`)).toBe(false)
  })

  it('|| chain short-circuits left to right', () => {
    expect(evalTestChain(`test -f ${fileAFwd}.nope || test -f ${fileAFwd}`)).toBe(true)
    expect(evalTestChain(`test -f ${fileAFwd}.a || test -f ${fileAFwd}.b`)).toBe(false)
  })

  it('&& chain requires both', () => {
    expect(evalTestChain(`test -f ${fileAFwd} && test -d ${dirBFwd}`)).toBe(true)
    expect(evalTestChain(`test -f ${fileAFwd} && test -d ${dirBFwd}.nope`)).toBe(false)
  })

  it('expands ~/ against the injected home', () => {
    expect(evalTestChain('test -f ~/a.md', tmp)).toBe(true)
    expect(evalTestChain('test -d ~/sub', tmp)).toBe(true)
    expect(evalTestChain('test -f ~/missing.md', tmp)).toBe(false)
  })

  it('real manifest shapes parse (dual-path verify from mattpocock/design-taste)', () => {
    expect(
      evalTestChain(
        'test -f ~/.claude/skills/diagnose/SKILL.md || test -f ~/.agents/skills/diagnose/SKILL.md',
        tmp, // neither exists under tmp home → false, but it PARSED (not null)
      ),
    ).toBe(false)
  })

  it('returns null for anything outside the strict grammar (falls back to shell)', () => {
    for (const cmd of [
      'grep -q foo bar',
      'ls ~/.codex/skills | grep -q gstack-',
      'test -f a > /dev/null',
      'test -x ~/bin/tool', // unsupported flag
      'test -f "quoted path"',
      'test -f ~/a*.md', // glob
      'test -f $HOME/a.md', // variable
      'test -f a; test -f b', // separator
      'command -v ctx7',
      'test -f', // missing operand
      '',
    ]) {
      expect(evalTestChain(cmd, tmp)).toBeNull()
    }
  })
})
