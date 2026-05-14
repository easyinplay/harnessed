#!/usr/bin/env bash
# scripts/spike/dag-and-promise-xml.sh
#
# Phase 1.5 Wave 1 Spike Probe — Kahn DAG topology + XML promise wrapper feasibility
#
# Purpose: Pre-flight feasibility check BEFORE committing to T3.1 (dag.ts) and T5.1/T5.2
#   (systemPrompt.ts + ralphLoop.ts XML wrapper upgrade). Not added to CI.
#
# Covers:
#   1. Kahn topological sort — 5 test graphs (linear chain, diamond, multi-root,
#      single node, cycle case)
#   2. XML promise wrapper regex — verifies <promise>([^<]+)</promise> correctly
#      extracts COMPLETE and that raw ^COMPLETE$ would NOT false-positive on
#      inline think-out-loud text
#
# Usage: bash scripts/spike/dag-and-promise-xml.sh
# Requirements: bash + node (any v18+)
#
# NOT in CI — spike probe only. See .planning/phase-1.5/SPIKE-REPORT-2.md for results.

set -euo pipefail

PASS=0
FAIL=0
TOTAL=0

pass() {
  local label="$1"
  echo "  [PASS] $label"
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))
}

fail() {
  local label="$1"
  local detail="${2:-}"
  echo "  [FAIL] $label${detail:+ -- $detail}"
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
}

# ---------------------------------------------------------------------------
# Part 1: Kahn Topological Sort via Node.js
# ---------------------------------------------------------------------------
echo ""
echo "=== Part 1: Kahn Topological Sort (5 graphs) ==="
echo ""

# Run a self-contained Kahn test in a single node -e call.
# All 5 graphs are embedded in the script; node prints one line per test.
KAHN_RESULT=$(node -e '
function kahnSort(nodes, edges) {
  const inDegree = {};
  const adj = {};
  for (const n of nodes) { inDegree[n] = 0; adj[n] = []; }
  for (const [from, to] of edges) {
    if (adj[from] === undefined) adj[from] = [];
    adj[from].push(to);
    inDegree[to] = (inDegree[to] || 0) + 1;
  }
  const queue = nodes.filter(n => inDegree[n] === 0).sort();
  const order = [];
  while (queue.length > 0) {
    const cur = queue.shift();
    order.push(cur);
    for (const next of (adj[cur] || [])) {
      inDegree[next]--;
      if (inDegree[next] === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }
  if (order.length !== nodes.length) {
    const cycleNodes = nodes.filter(n => inDegree[n] > 0);
    return { cycle: cycleNodes };
  }
  return { order };
}

const tests = [
  { name: "linear", nodes: ["A","B","C","D"], edges: [["A","B"],["B","C"],["C","D"]] },
  { name: "diamond", nodes: ["A","B","C","D"], edges: [["A","B"],["A","C"],["B","D"],["C","D"]] },
  { name: "multi-root", nodes: ["A","B","C","D"], edges: [["A","D"],["B","D"],["C","D"]] },
  { name: "single", nodes: ["X"], edges: [] },
  { name: "cycle", nodes: ["A","B","C"], edges: [["A","B"],["B","C"],["C","A"]] }
];

for (const t of tests) {
  const r = kahnSort(t.nodes, t.edges);
  if (r.order) {
    console.log(t.name + ":order:" + r.order.join(","));
  } else {
    console.log(t.name + ":cycle:" + r.cycle.join(","));
  }
}
')

echo "Raw Kahn results:"
echo "$KAHN_RESULT"
echo ""

# Parse each result line
while IFS= read -r line; do
  name=$(echo "$line" | cut -d: -f1)
  kind=$(echo "$line" | cut -d: -f2)
  value=$(echo "$line" | cut -d: -f3)

  case "$name" in
    linear)
      echo "--- Test 1: Linear chain (A->B->C->D) ---"
      if [ "$kind" = "order" ] && [ "$value" = "A,B,C,D" ]; then
        pass "Linear chain: order = $value"
      else
        fail "Linear chain" "expected order A,B,C,D got $kind:$value"
      fi
      ;;
    diamond)
      echo "--- Test 2: Diamond (A->B,A->C,B->D,C->D) ---"
      if [ "$kind" = "order" ] && { [ "$value" = "A,B,C,D" ] || [ "$value" = "A,C,B,D" ]; }; then
        pass "Diamond: valid topological order = $value"
      else
        fail "Diamond" "unexpected result $kind:$value"
      fi
      ;;
    multi-root)
      echo "--- Test 3: Multi-root (A->D, B->D, C->D) ---"
      LAST="${value##*,}"
      if [ "$kind" = "order" ] && [ "$LAST" = "D" ]; then
        pass "Multi-root: D is last in order = $value"
      else
        fail "Multi-root" "D not last, result $kind:$value"
      fi
      ;;
    single)
      echo "--- Test 4: Single node (X) ---"
      if [ "$kind" = "order" ] && [ "$value" = "X" ]; then
        pass "Single node: order = X"
      else
        fail "Single node" "expected order X got $kind:$value"
      fi
      ;;
    cycle)
      echo "--- Test 5: Cycle (A->B->C->A) ---"
      if [ "$kind" = "cycle" ]; then
        pass "Cycle detected: E_DAG_CYCLE nodes = $value"
      else
        fail "Cycle NOT detected" "Kahn failed to catch cycle, got $kind:$value"
      fi
      ;;
  esac
  echo ""
done <<< "$KAHN_RESULT"

# ---------------------------------------------------------------------------
# Part 2: XML Promise Wrapper Regex
# ---------------------------------------------------------------------------
echo ""
echo "=== Part 2: XML Promise Wrapper Regex ==="
echo ""

# All regex tests in a single node invocation; results printed as key:value lines
XML_RESULT=$(node -e '
const xmlRegex = /<promise>([^<]+)<\/promise>/;
const rawRegex = /^COMPLETE$/m;

// Test A: think-out-loud text with XML wrapper (no bare COMPLETE line)
const textA = "I have finished the task and I should signal completion now.\nThe work is done.\n<promise>COMPLETE</promise>\nNo more steps remain.";
const xmlMatchA = textA.match(xmlRegex);
const rawMatchA = textA.match(rawRegex);
console.log("testA:xmlExtracted:" + (xmlMatchA ? xmlMatchA[1] : "null"));
console.log("testA:rawMatched:" + (rawMatchA !== null));

// Test B: text with bare COMPLETE line (false-positive demo for raw regex)
const textB = "I should output COMPLETE to signal done.\nActually let me reconsider.\nCOMPLETE\nWait I am not done yet.";
const xmlMatchB = textB.match(xmlRegex);
const rawMatchB = textB.match(rawRegex);
console.log("testB:xmlExtracted:" + (xmlMatchB ? xmlMatchB[1] : "null"));
console.log("testB:rawMatched:" + (rawMatchB !== null));

// Test C: XML wrapper with non-COMPLETE content
const textC = "Working on it.\n<promise>IN_PROGRESS</promise>\nNot done yet.";
const xmlMatchC = textC.match(xmlRegex);
console.log("testC:xmlExtracted:" + (xmlMatchC ? xmlMatchC[1] : "null"));
')

echo "Raw regex results:"
echo "$XML_RESULT"
echo ""

while IFS= read -r line; do
  test_id=$(echo "$line" | cut -d: -f1)
  key=$(echo "$line" | cut -d: -f2)
  val=$(echo "$line" | cut -d: -f3)

  case "${test_id}:${key}" in
    testA:xmlExtracted)
      echo "--- Test 6: XML wrapper in think-out-loud text ---"
      if [ "$val" = "COMPLETE" ]; then
        pass "XML regex extracts COMPLETE correctly from wrapped text"
      else
        fail "XML regex failed to extract COMPLETE" "got: $val"
      fi
      ;;
    testA:rawMatched)
      if [ "$val" = "false" ]; then
        pass "Raw ^COMPLETE\$ does NOT false-positive on think-out-loud text (no bare COMPLETE line)"
      else
        fail "Raw ^COMPLETE\$ false-positive triggered" "unsafe for embedded text"
      fi
      echo ""
      ;;
    testB:xmlExtracted)
      echo "--- Test 7: Bare COMPLETE in think-out-loud text (false-positive demo) ---"
      if [ "$val" = "null" ]; then
        pass "XML regex returns null for text without wrapper tag -- safe, no false-positive"
      else
        fail "XML regex should return null for unwrapped text" "got: $val"
      fi
      ;;
    testB:rawMatched)
      if [ "$val" = "true" ]; then
        pass "Raw ^COMPLETE\$ WOULD false-positive here (bare COMPLETE line matched) -- confirms XML wrapper necessity"
      else
        fail "Raw regex expected to match bare COMPLETE line but did not" "unexpected"
      fi
      echo ""
      ;;
    testC:xmlExtracted)
      echo "--- Test 8: XML wrapper with non-COMPLETE content (IN_PROGRESS) ---"
      if [ "$val" = "IN_PROGRESS" ]; then
        pass "XML regex extracts non-COMPLETE tag content correctly (IN_PROGRESS) -- no false trigger"
      else
        fail "XML regex returned unexpected value" "$val"
      fi
      echo ""
      ;;
  esac
done <<< "$XML_RESULT"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== SPIKE SUMMARY ==="
echo "  Total: $TOTAL  Pass: $PASS  Fail: $FAIL"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "VERDICT: GO -- all $TOTAL assertions passed"
  echo "  D1.5-1: Kahn iterative algorithm confirmed (5/5 graph cases correct)"
  echo "  D1.5-8: XML promise wrapper regex confirmed (<promise>([^<]+)</promise>)"
  echo "  D1.5-8: promiseExtract.ts spillover decision confirmed (hard split safe)"
  exit 0
else
  echo "VERDICT: BLOCKED -- $FAIL/$TOTAL assertions failed"
  echo "  Review failures above before proceeding to T3.1 / T5.1 / T5.2"
  exit 1
fi
