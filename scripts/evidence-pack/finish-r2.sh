#!/usr/bin/env bash
# Idempotent r2 finisher: wait for clean result.json OR cap at ~35min total,
# then kill any lingering evidence claude and salvage acceptance from the
# newest harnessed workspace. Safe to run alongside any prior watchdog.
RES=D:/GitCode/harnessed/scripts/evidence-pack/runs/compound-recurring-todos-harnessed-r2.result.json
for i in $(seq 1 35); do
  [ -f "$RES" ] && { echo "[finish] result.json exists (clean finish)"; break; }
  alive=$(tasklist /FI "IMAGENAME eq claude.exe" 2>/dev/null | grep -c claude.exe)
  [ "$alive" = "0" ] && { echo "[finish] no claude alive, no result — wedge died or killed"; break; }
  sleep 60
done
if [ ! -f "$RES" ]; then
  echo "[finish] cap/exit reached — killing leftover evidence claude"
  for pid in $(wmic process where "name='claude.exe'" get processid 2>/dev/null | grep -o "[0-9]*"); do
    taskkill //PID "$pid" //T //F >/dev/null 2>&1 && echo "[finish] killed $pid"
  done
  ws=$(ls -dt /c/Users/easyi/AppData/Local/Temp/evidence-compound-recurring-todos-harnessed-* 2>/dev/null | head -1)
  echo "[finish] salvage ws: $ws"
  if [ -n "$ws" ] && [ -d "$ws" ]; then
    cd "$ws" && node acceptance.mjs 2>&1 | grep '"passRate"' | tail -1
  fi
fi
echo "[finish] DONE"
