#!/usr/bin/env node
// Phase 33 T33.5 — en↔zh-Hans yaml sync-guard (CI hard gate, REQ-v100-yaml-i18n).
// Enforces STRUCTURAL PARITY between a `<base>.yaml` and its `<base>.zh-Hans.yaml`
// sibling for the user-facing yaml surfaces (role-prompts.yaml + disciplines/*.yaml).
//
// drift-only semantics: a sibling EXISTS → it MUST be in structural parity with the
// base; a sibling is ABSENT → OK (no must-exist). An orphan `<base>.zh-Hans.yaml`
// (no `<base>.yaml`) IS a violation.
//
// Structural parity = translation-invariant features only (values differ by
// translation; never compares translated prose):
//   1. top-level key set identical
//   2. role-prompts (`prompts:` map): role-key set + per-role field-key set identical
//   3. disciplines (`rules:` list): rule `id` set + per-rule field-key set identical
//
// Unlike the dep-free skill guard (scripts/check-skill-i18n-parity.mjs), this uses
// the `yaml` package for a robust structural parse — so the CI step runs AFTER
// `pnpm install` (sister scripts/check-workflow-schema.mjs), not before. Exports
// `checkYamlI18nParity` so vitest imports the pure fn directly; a hand-written
// sibling .d.mts gives it types (scripts/** is in tsconfig include, allowJs off).
// CLI main() is guarded by an import.meta.url entry check so importing never exits.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse as parseYaml } from 'yaml'

const ZH_SUFFIX = '.zh-Hans.yaml'
const BASE_SUFFIX = '.yaml'

/** Recursively collect every `*.yaml` file under `root`. */
function walkYaml(root, out = []) {
  if (!existsSync(root)) return out
  for (const name of readdirSync(root)) {
    const p = join(root, name)
    if (statSync(p).isDirectory()) walkYaml(p, out)
    else if (name.endsWith(BASE_SUFFIX)) out.push(p)
  }
  return out
}

function setEqual(a, b) {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

function show(set) {
  return `{${[...set].sort().join(',')}}`
}

/** Top-level mapping keys (empty set for non-object / array roots). */
function topKeys(doc) {
  return doc && typeof doc === 'object' && !Array.isArray(doc)
    ? new Set(Object.keys(doc))
    : new Set()
}

/**
 * Check en↔zh-Hans yaml structural parity across `workflowsDir`.
 * @param {string} workflowsDir path to a `workflows/` tree
 * @returns {{ ok: boolean, violations: Array<{file: string, kind: string, detail: string}> }}
 */
export function checkYamlI18nParity(workflowsDir) {
  const violations = []
  for (const file of walkYaml(workflowsDir)) {
    // zh sibling: only used for the orphan check (base drives the parity pass).
    if (file.endsWith(ZH_SUFFIX)) {
      const base = `${file.slice(0, -ZH_SUFFIX.length)}${BASE_SUFFIX}`
      if (!existsSync(base)) {
        violations.push({
          file,
          kind: 'orphan',
          detail: `${ZH_SUFFIX} sibling has no base ${BASE_SUFFIX}`,
        })
      }
      continue
    }

    // base candidate: parity-check only when a zh sibling exists (drift-only).
    const sibling = `${file.slice(0, -BASE_SUFFIX.length)}${ZH_SUFFIX}`
    if (!existsSync(sibling)) continue

    let baseDoc
    let zhDoc
    try {
      baseDoc = parseYaml(readFileSync(file, 'utf8'))
    } catch (e) {
      violations.push({ file, kind: 'parse', detail: `base parse error: ${e.message}` })
      continue
    }
    try {
      zhDoc = parseYaml(readFileSync(sibling, 'utf8'))
    } catch (e) {
      violations.push({ file: sibling, kind: 'parse', detail: `sibling parse error: ${e.message}` })
      continue
    }

    // 1. top-level key set.
    const bk = topKeys(baseDoc)
    const zk = topKeys(zhDoc)
    if (!setEqual(bk, zk)) {
      violations.push({
        file: sibling,
        kind: 'top-keys',
        detail: `top-level keys differ — base=${show(bk)} zh=${show(zk)}`,
      })
    }

    // 2. role-prompts shape (`prompts:` map).
    if (baseDoc?.prompts && typeof baseDoc.prompts === 'object') {
      const br = new Set(Object.keys(baseDoc.prompts))
      const zr = new Set(Object.keys(zhDoc?.prompts ?? {}))
      if (!setEqual(br, zr)) {
        violations.push({
          file: sibling,
          kind: 'role-keys',
          detail: `role keys differ — base=${show(br)} zh=${show(zr)}`,
        })
      }
      for (const role of br) {
        if (!zr.has(role)) continue
        const bf = new Set(Object.keys(baseDoc.prompts[role] ?? {}))
        const zf = new Set(Object.keys(zhDoc.prompts[role] ?? {}))
        if (!setEqual(bf, zf)) {
          violations.push({
            file: sibling,
            kind: 'role-fields',
            detail: `role '${role}' field keys differ — base=${show(bf)} zh=${show(zf)}`,
          })
        }
      }
    }

    // 3. disciplines shape (`rules:` list keyed by `id`).
    if (Array.isArray(baseDoc?.rules)) {
      const baseRules = baseDoc.rules
      const zhRules = Array.isArray(zhDoc?.rules) ? zhDoc.rules : []
      const bids = new Set(baseRules.map((r) => r?.id).filter(Boolean))
      const zids = new Set(zhRules.map((r) => r?.id).filter(Boolean))
      if (!setEqual(bids, zids)) {
        violations.push({
          file: sibling,
          kind: 'rule-ids',
          detail: `rule ids differ — base=${show(bids)} zh=${show(zids)}`,
        })
      }
      for (const r of baseRules) {
        const id = r?.id
        if (!id || !zids.has(id)) continue
        const zr = zhRules.find((x) => x?.id === id)
        const bf = new Set(Object.keys(r))
        const zf = new Set(Object.keys(zr ?? {}))
        if (!setEqual(bf, zf)) {
          violations.push({
            file: sibling,
            kind: 'rule-fields',
            detail: `rule '${id}' field keys differ — base=${show(bf)} zh=${show(zf)}`,
          })
        }
      }
    }
  }
  return { ok: violations.length === 0, violations }
}

// CLI main — guarded so `import` never exits the process (vitest imports the fn).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const here = fileURLToPath(new URL('.', import.meta.url))
  const workflowsDir = join(here, '..', 'workflows')
  const { ok, violations } = checkYamlI18nParity(workflowsDir)
  if (!ok) {
    for (const v of violations) {
      console.error(`::error file=${v.file}::[yaml-i18n-parity] ${v.kind}: ${v.detail}`)
    }
    console.error(
      `[yaml-i18n-parity] ${violations.length} structural-parity violation(s). ` +
        'A <base>.zh-Hans.yaml sibling must match its <base>.yaml in top-level keys, ' +
        'role/rule key sets, and per-entry field presence (drift-only — absence of a ' +
        'sibling is OK).',
    )
    process.exit(1)
  }
  console.log('[yaml-i18n-parity] all en↔zh-Hans yaml pairs in structural parity (drift-only).')
  process.exit(0)
}
