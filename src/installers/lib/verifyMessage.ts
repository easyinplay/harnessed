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
 *  pre-4.15.2 doctor sanitizer contract). */
export function sanitizeOutputTail(raw: string, cap = 160): string {
  const firstNonEmpty = raw.split(/\r?\n/).find((l) => l.trim().length > 0) ?? ''
  const printable = firstNonEmpty.replace(/[^\x20-\x7E]/g, '').trim()
  return printable.length > 0 ? printable.slice(0, cap) : '(unreadable output)'
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
  const tail = rawTail.length > 0 ? sanitizeOutputTail(rawTail) : '(no output)'
  return `verify failed (exit ${exitCode} ≠ expected ${expected}): \`${cmdPart}\` — ${tail}`
}
