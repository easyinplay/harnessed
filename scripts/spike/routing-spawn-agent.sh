#!/usr/bin/env bash
# Phase 1.4 T2.1 spike — main-process query() API 实证 (D1.4-1 R1+R2 P0 Step 1 / D-10 probe).
# 5 step 一次性实测; 不入 CI; 产出 record .planning/phase-1.4/SPIKE-REPORT.md.
# Win caveat: claude headless 卡 → F40-Win finding (W-4 沿袭 phase 1.3 F36-Win).
# Usage: chmod +x scripts/spike/routing-spawn-agent.sh && ./scripts/spike/routing-spawn-agent.sh
set -uo pipefail
TIMEOUT="${SPIKE_TIMEOUT:-60}"; TOKEN="COMPLETE"
TBIN=$(command -v timeout || command -v gtimeout || true)
run_t() { if [ -n "${TBIN}" ]; then "${TBIN}" "${TIMEOUT}s" "$@"; else "$@"; fi; }
now_ms() { date +%s%3N 2>/dev/null || python3 -c 'import time;print(int(time.time()*1000))'; }
step() { printf "[spike] %-50s %-12s %5dms — %s\n" "$1" "$2" "$3" "$4"; echo "$1|$2|$3|$4" >>/tmp/spike-result.csv; }
echo "=== Phase 1.4 T2.1 spike — main-process query() API 实证 ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ) | Platform: $(uname -s)/$(uname -r 2>/dev/null||echo unknown)"
: >/tmp/spike-result.csv
if ! command -v claude >/dev/null 2>&1; then
  for L in "Step 1 plugin CLI" "Step 2 mcp list" "Step 3 verbatim COMPLETE" "Step 4 ralph-loop flag" "Step 5 skills fs scan"; do step "${L}" SKIP 0 "claude CLI not in PATH"; done
else
  echo "claude --version: $(claude --version 2>&1 | head -1)"
  T0=$(now_ms); OUT=$(run_t claude plugin --help 2>&1 || echo X); T1=$(now_ms)
  if echo "${OUT}"|grep -qE "install|uninstall|list"; then step "Step 1 plugin CLI subcommand" PASS $((T1-T0)) "plugin --help 含 install/uninstall/list (RESEARCH § 1.1 confirmed)"
  else step "Step 1 plugin CLI subcommand" FAIL $((T1-T0)) "plugin --help 未含 install/uninstall/list"; fi
  T0=$(now_ms); run_t claude mcp list >/tmp/spike-s2.log 2>&1; RC=$?; T1=$(now_ms)
  if [ ${RC} -eq 0 ]; then LC=$(wc -l </tmp/spike-s2.log|tr -d ' '); step "Step 2 mcp list idempotent_check" PASS $((T1-T0)) "mcp list ${LC} 行 — grep -q 路径可靠"
  else step "Step 2 mcp list idempotent_check" FAIL $((T1-T0)) "mcp list rc=${RC} (RESEARCH § 1.2 reload bug fallback 边界)"; fi
  T0=$(now_ms); OUT=$(run_t claude -p 'Output exactly the single uppercase word COMPLETE on its own line and nothing else.' 2>&1 || echo __FAIL__); T1=$(now_ms); echo "${OUT}" >/tmp/spike-s3.log
  if echo "${OUT}"|grep -qE "^${TOKEN}\$"; then step "Step 3 claude -p verbatim COMPLETE" PASS $((T1-T0)) "verbatim '${TOKEN}' 单行回流 — F33 P1 mitigation FEASIBLE"
  elif [ "${OUT}" = "__FAIL__" ] || [ -z "${OUT}" ]; then step "Step 3 claude -p verbatim COMPLETE" FAIL $((T1-T0)) "claude -p timeout/exit≠0 — Win Git Bash 风险 (F40-Win)"
  elif echo "${OUT}"|grep -q "${TOKEN}"; then step "Step 3 claude -p verbatim COMPLETE" NEEDS_TWEAK $((T1-T0)) "含 '${TOKEN}' 非单行 — main prompt 必须 enforce (D-18)"
  else step "Step 3 claude -p verbatim COMPLETE" NEEDS_TWEAK $((T1-T0)) "未含 '${TOKEN}' — prompt 需调强 / model 倾 summarize"; fi
  T0=$(now_ms); HELP=$(run_t claude --help 2>&1 || echo ""); T1=$(now_ms)
  if echo "${HELP}"|grep -qE "completion-promise|max-iterations"; then step "Step 4 ralph-loop flag double cap" PASS $((T1-T0)) "--help 含 --completion-promise/--max-iterations (built-in)"
  else step "Step 4 ralph-loop flag double cap" NEEDS_TWEAK $((T1-T0)) "无 flag (需 /ralph-loop slash) — D1.4-3 自实装 ≤50L 路径 confirmed"; fi
  T0=$(now_ms); SD="${HOME}/.claude/skills"
  if [ -d "${SD}" ]; then SC=$(ls -1 "${SD}" 2>/dev/null|wc -l|tr -d ' '); SL=$(ls -1 "${SD}" 2>/dev/null|head -5|tr '\n' ','|sed 's/,$//'); T1=$(now_ms)
    if [ "${SC}" -gt 0 ]; then step "Step 5 skills filesystem scan" PASS $((T1-T0)) "${SD} 含 ${SC} skill (e.g. ${SL}) — reload bypass FEASIBLE"
    else step "Step 5 skills filesystem scan" NEEDS_TWEAK $((T1-T0)) "${SD} 空 — 需 install 后 spawn fresh subagent 验证"; fi
  else T1=$(now_ms); step "Step 5 skills filesystem scan" SKIP $((T1-T0)) "${SD} 不存在 — claude CLI 未初始化 user-scope skill"; fi
fi
echo ""; echo "=== Verbatim COMPLETE feasibility verdict ==="
S3=$(grep '^Step 3' /tmp/spike-result.csv | cut -d'|' -f2)
case "${S3}" in
  PASS) echo "  → FEASIBLE (Step 3 verbatim 回流 confirmed)";;
  NEEDS_TWEAK) echo "  → NEEDS_TWEAK (含 ${TOKEN} 但需 main system prompt enforce — D-18 path)";;
  FAIL) echo "  → BLOCKED (Step 3 headless 不可用 — F40-Win finding)";;
  *) echo "  → UNVERIFIED (claude CLI not available — record skip rationale)";;
esac
echo "=== Result CSV: /tmp/spike-result.csv ==="
