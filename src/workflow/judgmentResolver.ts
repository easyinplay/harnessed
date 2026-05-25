// Phase v2.0-2.3 W0 T2.3.W0.4 — judgmentResolver.ts (Q-AUDIT-5c MANDATORY,
// R20.4 acceptance c sub-item, PLAN-ENG-REVIEW Implementation Task #1).
//
// expr-eval Parser 视 `judgments.<file>.<trigger>.<field>` 为 4 层 dot-access
// identifier chain — Parser 不直接支持 file boundary semantics。本模块在
// evalGate 调用前预 resolve 4 层 ref → load `workflows/judgments/<file>.yaml`
// → TypeBox validate → extract trigger.fires_when / skips_when → 交给 evalGate
// (D-03 expr-eval) 求值。
//
// Dual-schema routing per W0.6: fallback.yaml 顶级 key 是 `rules` (3 铁律),
// 其余 5 file 顶级 key 是 `triggers`. fallback rules 无 fires_when/skips_when
// 字段, 不参与 expr eval — gate ref 指向 fallback file 时 fieldName 必走 error
// path (设计意图: fallback 由 runtime 词法匹配, 非 expr eval).
//
// Cache: parsed yaml 文件 module-level Map<fileName, JudgmentTriggersFileT |
// JudgmentRulesFileT> avoid hot-path readFile + parseYaml (perf per PLAN L195).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { evalGate } from './exprBuilder.js'
import {
  JudgmentRulesFile,
  type JudgmentRulesFileT,
  JudgmentTriggersFile,
  type JudgmentTriggersFileT,
} from './schema/judgment.js'

export class TriggerNotFoundError extends Error {
  constructor(
    public readonly trigger: string,
    public readonly fileName: string,
  ) {
    super(`Trigger '${trigger}' not found in judgments/${fileName}.yaml`)
    this.name = 'TriggerNotFoundError'
  }
}

const _fileCache = new Map<string, JudgmentTriggersFileT | JudgmentRulesFileT>()

export async function resolveJudgmentGate(
  gateRef: string,
  context: Record<string, unknown>,
  packageRoot: string,
): Promise<boolean> {
  // v3.6.0 Phase 3 — user-override bypass (P0b 上半, Audit § fallback 三条铁律
  // "用户明示 → 覆盖判据"). CLI (src/cli/run.ts) fills gateContext.user_overrides[]
  // from task description keyword match against workflows/judgments/user-overrides.yaml
  // (loaded by src/cli/lib/extract-user-overrides.ts). When gateRef present in the
  // array → fires=true bypass; expression evaluation skipped. Only the `.fires`
  // field honors the override; `.skips` falls through to normal eval (user
  // override forces fire, not skip).
  const userOverrides = context.user_overrides as string[] | undefined
  if (Array.isArray(userOverrides) && userOverrides.includes(gateRef)) {
    return true
  }

  const parts = gateRef.split('.')
  if (parts.length !== 4 || parts[0] !== 'judgments') {
    throw new Error(`Invalid gate ref: ${gateRef}`)
  }
  const [, fileName, triggerName, fieldName] = parts as [string, string, string, string]

  let parsed = _fileCache.get(fileName)
  if (!parsed) {
    const yamlPath = resolve(packageRoot, 'workflows', 'judgments', `${fileName}.yaml`)
    const raw = await readFile(yamlPath, 'utf8')
    const parsedRaw = parseYaml(raw) as unknown
    const schema = fileName === 'fallback' ? JudgmentRulesFile : JudgmentTriggersFile
    if (!Value.Check(schema, parsedRaw)) {
      const errors = [...Value.Errors(schema, parsedRaw)]
        .slice(0, 3)
        .map((e) => `${e.path} ${e.message}`)
        .join('; ')
      throw new Error(`Invalid judgment file ${fileName}.yaml: ${errors}`)
    }
    parsed = parsedRaw as JudgmentTriggersFileT | JudgmentRulesFileT
    _fileCache.set(fileName, parsed)
  }

  const entries =
    'triggers' in parsed
      ? parsed.triggers
      : (parsed.rules as unknown as Record<string, { fires_when?: string; skips_when?: string }>)
  const trigger = entries[triggerName]
  if (!trigger) {
    throw new TriggerNotFoundError(triggerName, fileName)
  }

  const expr =
    fieldName === 'fires'
      ? trigger.fires_when
      : fieldName === 'skips'
        ? trigger.skips_when
        : undefined
  if (!expr) {
    throw new Error(
      `Field '${fieldName}' has no expression in trigger '${triggerName}' of ${fileName}.yaml`,
    )
  }

  return evalGate(expr, context)
}

// Test-only — clears the parsed-yaml cache so cache-hit / cache-miss fixtures
// stay independent. Production callers should never touch this.
export function _clearJudgmentCache(): void {
  _fileCache.clear()
}
