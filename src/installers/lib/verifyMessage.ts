// v4.15.1 T3 — verify 失败消息统一格式。
//
// 用户 dogfood(v4.15.0):失败行显示 "manifest verify cmd exit 1 ≠ expected 0: "
// — 悬空冒号 + 空 reason(WSL stub 的报错走 stdout,旧格式只截 stderr)。统一为:
//   verify failed (exit N ≠ expected M): `<cmd ≤80>` — <stderr|stdout ≤160|(no output)>

export function formatVerifyFail(
  cmd: string,
  exitCode: number,
  expected: number,
  stdout: string,
  stderr: string,
): string {
  const cmdPart = cmd.length > 80 ? `${cmd.slice(0, 80)}…` : cmd
  const tail = stderr.trim().slice(0, 160) || stdout.trim().slice(0, 160) || '(no output)'
  return `verify failed (exit ${exitCode} ≠ expected ${expected}): \`${cmdPart}\` — ${tail}`
}
