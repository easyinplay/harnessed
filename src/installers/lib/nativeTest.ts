// v4.15.1 T2 — `test -f|-d|-e <path>` 链的零 shell 原生求值(防御层)。
//
// 本仓 verify / idempotent_check 的主形态是 test-chain
// (`test -f A || test -f B`)。4.15.0 前 Windows 上它们必须借 bash;当 PATH 上的
// bash 是 WSL stub 时全灭(v4.15.1 根因,sister resolveBash.ts)。且 idempotent
// fallback 不带 posixShell → cmd.exe 根本没有 `test`(v3.9.9 已述)。原生求值用
// fs 直判:跨 OS、零 shell、零超时风险 — 文件系统本来就是这些检查的唯一权威。
//
// 文法保守(不匹配 → null → 调用方回落 spawn 路径):
//   chain   := clause ((`||` | `&&`) clause)*
//   clause  := `test` (-f|-d|-e) path
//   path    := 无引号、无 shell 元字符的单 token,可 `~/` 开头
// 含管道 / 重定向 / 变量 / glob / 其他命令的一律 null。

import { statSync } from 'node:fs'
import { homedir } from 'node:os'

const CLAUSE_RE = /^test\s+-(f|d|e)\s+(\S+)$/
// Shell metacharacters that would change meaning under a real shell — a path
// containing any of these is NOT safe to evaluate natively. Dash / dot /
// underscore stay allowed (design-taste-frontend, .claude, SKILL.md). The
// backtick and $ reject substitution; * ? [ ] reject globs; quotes reject
// quoted paths (our manifests never quote).
const UNSAFE_PATH_RE = /[|&;<>()*?"'`$={}[\]]/

function evalClause(clause: string, home: string): boolean | null {
  const m = clause.match(CLAUSE_RE)
  if (!m?.[1] || !m[2]) return null
  const flag = m[1]
  let p = m[2]
  if (UNSAFE_PATH_RE.test(p)) return null
  if (p === '~') p = home
  else if (p.startsWith('~/')) p = `${home}/${p.slice(2)}`
  else if (p.startsWith('~')) return null // ~user expansion unsupported
  try {
    const st = statSync(p)
    if (flag === 'f') return st.isFile()
    if (flag === 'd') return st.isDirectory()
    return true // -e: exists (any kind)
  } catch {
    return false
  }
}

/**
 * Evaluate a pure test-chain natively. Returns:
 *   true / false — the chain parsed and evaluated (shell exit 0 / 1 equivalent)
 *   null         — cmd is NOT a pure test-chain; caller must spawn a real shell
 */
export function evalTestChain(cmd: string, home: string = homedir()): boolean | null {
  const trimmed = cmd.trim()
  if (trimmed.length === 0 || !trimmed.startsWith('test ')) return null
  // Split into clauses, keeping the operators. A stray single `|` / `&` never
  // splits (they are rejected later by the per-clause grammar gate).
  const parts = trimmed.split(/\s*(\|\||&&)\s*/)
  // parts = [clause, op, clause, op, clause, ...] — must be odd length.
  if (parts.length % 2 === 0) return null

  let acc: boolean | null = null
  let pendingOp: '||' | '&&' | null = null
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? ''
    if (i % 2 === 1) {
      pendingOp = part as '||' | '&&'
      continue
    }
    // Every clause is grammar-gated even when a shell would have skipped it via
    // short-circuit — an unparseable clause anywhere disqualifies the whole cmd.
    const v = evalClause(part, home)
    if (v === null) return null
    if (acc === null) {
      acc = v
    } else if (pendingOp === '||') {
      acc = acc || v
    } else {
      acc = acc && v
    }
  }
  return acc
}
