// Phase 54 T1 — `fires_when` 在 capabilities.yaml 里是个陷阱字段。
//
// judgment 文件里的 `fires_when` 是真求值的(judgmentResolver 读 triggers/rules);
// capabilities.yaml 里同名的那 112 条**没有任何消费者** —— resolver 不读它,
// prompt.ts 只渲染 cmd/impl/aliases。同名异义就是误读的根源。
//
// 修法是改名 `routing_note` 并把 `fires_when` 从 schema 删掉:`additionalProperties:
// false` 让旧名成为构建期错误,门从「维护一张 112 条豁免表」缩成「schema 就是门」。

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'

const wrap = (entry: Record<string, unknown>) => ({
  schema_version: SCHEMA_VERSIONS.capabilities,
  capabilities: { probe: { impl: 'gstack', cmd: '/probe', since: '4.0.0', ...entry } },
})

describe('capabilities schema — fires_when is not a field here (Phase 54 T1)', () => {
  it('a bare entry validates (fixture sanity)', () => {
    expect(Value.Check(Capabilities, wrap({}))).toBe(true)
  })

  it('`routing_note` is the accepted name for the inert routing prose', () => {
    expect(Value.Check(Capabilities, wrap({ routing_note: ["phase.stage == 'verify'"] }))).toBe(
      true,
    )
  })

  it('`fires_when` is REJECTED — writing it back is a build-time error, not a silent no-op', () => {
    expect(Value.Check(Capabilities, wrap({ fires_when: ["phase.stage == 'verify'"] }))).toBe(false)
  })

  it('the shipped workflows/capabilities.yaml carries no fires_when', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const src = readFileSync(join(__dirname, '..', '..', 'workflows', 'capabilities.yaml'), 'utf8')
    const offenders = src.split(String.fromCharCode(10)).filter((l) => /^\s*fires_when\s*:/.test(l))
    expect(offenders).toEqual([])
  })
})
