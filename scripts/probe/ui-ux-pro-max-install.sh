#!/usr/bin/env bash
# Phase 1.3 T5.1 — ui-ux-pro-max install path probe (D-10 shell probe).
#
# 目的: 一次性实测 ui-ux-pro-max 安装路径 (D1.3-5 P0-3 lock 路径 B 主推).
# **不入 CI test suite** (D-10 R1 PATTERNS) — 实测产出 record 在
# `.planning/phase-1.3/progress.md` § B F36 finding.
#
# 路径 A (specimen 测试): npx skills add tree URL with branch ref.
#   风险: vercel-labs/skills issue #373 — skills CLI lock file 不存 branch ref;
#   subsequent `npx skills update` will hardcode /tree/main/ → 对 v4-next 必破.
#
# 路径 B (主推, fallback): git clone --depth 1 --branch v4-next + 子目录拷贝.
#   优势: 锁 v4-next tip SHA, 不依赖 skills CLI internal lock 行为.
#
# 输出 (single line): PATH_A_OK / PATH_A_BROKEN_PATH_B_OK / BOTH_BROKEN.
#
# H3c sister patch — 4h timeout escape: 路径 A 阻塞 ≥4h → 立即切路径 B 兜底.
# 本 script 用 timeout 命令 90s 软上限; 超时即归 PATH_A_BROKEN.
#
# 使用方式 (一次性):
#   chmod +x scripts/probe/ui-ux-pro-max-install.sh
#   ./scripts/probe/ui-ux-pro-max-install.sh

set -uo pipefail  # NOT set -e — 路径 A 失败时仍要继续路径 B

SKILL_NAME="ui-ux-pro-max"
SKILL_DIR="${HOME}/.claude/skills/${SKILL_NAME}"
TMP_CLONE="${TMPDIR:-/tmp}/midway-clone-$$"
UPSTREAM="https://github.com/midwayjs/midway"
BRANCH="v4-next"
SUBDIR=".codex/skills/${SKILL_NAME}"
PATH_A_TIMEOUT="${PATH_A_TIMEOUT:-90}"  # seconds; H3c 4h max if rerun manually

PATH_A_OK=0
PATH_B_OK=0
PATH_A_REASON=""
PATH_B_REASON=""

cleanup_skill() {
  if [ -d "${SKILL_DIR}" ]; then
    rm -rf "${SKILL_DIR}"
  fi
}

# ---- Path A: npx skills add tree URL ----
echo "[probe] Path A — npx skills add ${UPSTREAM}/tree/${BRANCH}/${SUBDIR} (timeout ${PATH_A_TIMEOUT}s)"
cleanup_skill
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_PREFIX=("timeout" "${PATH_A_TIMEOUT}s")
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_PREFIX=("gtimeout" "${PATH_A_TIMEOUT}s")
else
  TIMEOUT_PREFIX=()  # macOS without coreutils — fall through; manual ctrl-C if hung.
fi

"${TIMEOUT_PREFIX[@]}" npx --yes skills@latest add "${UPSTREAM}/tree/${BRANCH}/${SUBDIR}" -g -a claude-code -y 2>&1 | tail -20 || true

if [ -f "${SKILL_DIR}/SKILL.md" ]; then
  PATH_A_OK=1
  PATH_A_REASON="SKILL.md present after npx skills add"
else
  PATH_A_REASON="SKILL.md absent — npx skills add did not create ${SKILL_DIR} (likely vercel-labs/skills #373 or env issue)"
fi
echo "[probe] Path A: $([ ${PATH_A_OK} -eq 1 ] && echo OK || echo BROKEN) — ${PATH_A_REASON}"

# ---- Path B: git clone --depth 1 --branch v4-next + 子目录拷贝 ----
echo "[probe] Path B — git clone --depth 1 --branch ${BRANCH} ${UPSTREAM} → ${TMP_CLONE}"
cleanup_skill
rm -rf "${TMP_CLONE}"

if git clone --depth 1 --branch "${BRANCH}" "${UPSTREAM}" "${TMP_CLONE}" >/dev/null 2>&1; then
  if [ -d "${TMP_CLONE}/${SUBDIR}" ]; then
    mkdir -p "$(dirname "${SKILL_DIR}")"
    cp -R "${TMP_CLONE}/${SUBDIR}" "${SKILL_DIR}"
    if [ -f "${SKILL_DIR}/SKILL.md" ]; then
      PATH_B_OK=1
      GIT_REF=$(git -C "${TMP_CLONE}" rev-parse HEAD 2>/dev/null || echo "unknown")
      PATH_B_REASON="git clone + cp -R OK; v4-next tip SHA = ${GIT_REF:0:12}"
    else
      PATH_B_REASON="cp -R completed but SKILL.md absent post-copy"
    fi
  else
    PATH_B_REASON="upstream subdir ${SUBDIR} missing on ${BRANCH} branch"
  fi
  rm -rf "${TMP_CLONE}"
else
  PATH_B_REASON="git clone --depth 1 --branch ${BRANCH} failed (network / branch missing / auth)"
fi
echo "[probe] Path B: $([ ${PATH_B_OK} -eq 1 ] && echo OK || echo BROKEN) — ${PATH_B_REASON}"

# ---- Result classification ----
if [ ${PATH_A_OK} -eq 1 ] && [ ${PATH_B_OK} -eq 1 ]; then
  RESULT="PATH_A_OK"
elif [ ${PATH_A_OK} -eq 0 ] && [ ${PATH_B_OK} -eq 1 ]; then
  RESULT="PATH_A_BROKEN_PATH_B_OK"
elif [ ${PATH_A_OK} -eq 1 ] && [ ${PATH_B_OK} -eq 0 ]; then
  RESULT="PATH_A_OK_PATH_B_BROKEN"  # rare but possible
else
  RESULT="BOTH_BROKEN"
fi

echo ""
echo "============================================="
echo "RESULT: ${RESULT}"
echo "PATH_A: ${PATH_A_REASON}"
echo "PATH_B: ${PATH_B_REASON}"
echo "PLATFORM: $(uname -s) / $(uname -r)"
echo "============================================="
