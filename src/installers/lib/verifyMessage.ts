// v4.15.1 T3 — verify 失败消息统一格式。
//
// 用户 dogfood(v4.15.0):失败行显示 "manifest verify cmd exit 1 ≠ expected 0: "
// — 悬空冒号 + 空 reason(WSL stub 的报错走 stdout,旧格式只截 stderr)。统一为:
//   verify failed (exit N ≠ expected M): `<cmd ≤80>` — <sanitized tail|(no output)>
//
// v4.15.2 T4 — 输出尾巴消毒共享化:WSL stub 的 CP936 报错以 mojibake 原样进过
// 用户的错误消息(ctx7 dogfood);sanitizeOutputTail 与 doctor checkWinBash 共用
// (首个非空行、可打印字符、封顶),外部工具输出不再裸嵌。

/** First non-empty line, printable ASCII only, capped. Deliberately ASCII-only:
 *  the target failure class is CP936 bytes mis-decoded as UTF-8 (WSL stub error)
 *  which lands in CJK/PUA ranges — indistinguishable from legit CJK, so we strip
 *  all non-ASCII rather than embed plausible-looking garbage (matches the
 *  pre-4.15.2 doctor sanitizer contract).
 *  Consumers: doctor checkWinBash (single-line input — head vs tail identical).
 *  For multi-line INSTALL/verify output use sanitizeOutputTailEnd — errors live
 *  at the END of process output, not the start. */
export function sanitizeOutputTail(raw: string, cap = 160): string {
  const firstNonEmpty = raw.split(/\r?\n/).find((l) => l.trim().length > 0) ?? ''
  const printable = firstNonEmpty.replace(/[^\x20-\x7E]/g, '').trim()
  return printable.length > 0 ? printable.slice(0, cap) : '(unreadable output)'
}

/** v4.16.1 T2 — TAIL-biased sanitizer: joins the LAST non-empty printable lines
 *  (newest-last, ` | ` separated) up to `cap`. gstack dogfood: stderr opened
 *  with git's "Cloning into…" progress while the fatal "Error: bun is required"
 *  sat on the final line — the head-biased sanitizer discarded exactly the
 *  diagnostic part. Same ASCII-only contract as sanitizeOutputTail. */
export function sanitizeOutputTailEnd(raw: string, cap = 300): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[^\x20-\x7E]/g, '').trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return '(unreadable output)'
  let out = ''
  for (let i = lines.length - 1; i >= 0; i--) {
    const cand = out ? `${lines[i]} | ${out}` : (lines[i] as string)
    if (cand.length > cap) break
    out = cand
  }
  // Single final line longer than cap: keep its head (the error name/prefix).
  return out || `${(lines[lines.length - 1] as string).slice(0, cap)}…`
}

/** v4.16.0 T5 — install-spawn failure message with the same tail contract as
 *  formatVerifyFail (stderr → stdout fallback → '(no output)'). Kills the
 *  `npx skills add exited 3221226505: ` dangling-colon class (design-taste
 *  dogfood: node hard-crash writes nothing to stderr). */
export function formatSpawnFail(
  label: string,
  exitCode: number,
  stdout: string,
  stderr: string,
): string {
  const rawTail = stderr.trim() || stdout.trim()
  // v4.16.1 T2 — tail-END biased (errors live at the end of process output).
  const tail = rawTail.length > 0 ? sanitizeOutputTailEnd(rawTail, 300) : '(no output)'
  return `${label} exited ${exitCode}: ${tail}`
}

export function formatVerifyFail(
  cmd: string,
  exitCode: number,
  expected: number,
  stdout: string,
  stderr: string,
): string {
  const cmdPart = cmd.length > 80 ? `${cmd.slice(0, 80)}…` : cmd
  const rawTail = stderr.trim() || stdout.trim()
  // v4.16.1 T2 — tail-END biased (same rationale as formatSpawnFail).
  const tail = rawTail.length > 0 ? sanitizeOutputTailEnd(rawTail, 160) : '(no output)'
  return `verify failed (exit ${exitCode} ≠ expected ${expected}): \`${cmdPart}\` — ${tail}`
}
