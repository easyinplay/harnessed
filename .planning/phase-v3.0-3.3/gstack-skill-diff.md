# gstack 33 Optional Diff Dry-Run — T3.3.W1.1 (K1 Mitigation)

**Date**: 2026-05-21
**Owner**: yaml-teammate
**Scope**: 33 gstack optional capabilities.yaml entries (W0.2 ship) vs 实际 gstack plugin install dirs
**Sister evidence pattern**: Wave C plan-check 验证 diff 文档存在 + 不匹配 entry 标 `since: v3.x` defer

---

## Methodology

1. Read all `impl: gstack` entries from `workflows/capabilities.yaml`
2. List subdirectories under `~/.claude/skills/gstack/`
3. Match by `cmd` (stripped of leading `/`) → installed skill dir name
4. Categorize: matched / missing
5. Missing entries → 标 `since: v3.x` defer + record rationale

---

## Results Summary

| Metric | Count |
|---|---|
| Total `impl: gstack` entries in capabilities.yaml | 44 |
| Matched (cmd ↔ installed skill dir) | 40 |
| Missing (entry exists but skill dir absent in gstack/) | 4 |

**Match rate**: 40/44 = 90.9%

---

## Matched Entries (40)

### gstack 6 core (v2 SHIPPED, all matched)

| Entry name | gstack skill dir |
|---|---|
| gstack-office-hours | office-hours |
| gstack-plan-ceo-review | plan-ceo-review |
| gstack-review | review |
| gstack-qa | qa |
| gstack-cso | cso |
| gstack-design-review | design-review |

### gstack 33 optional W0.2 NEW (32 matched, 1 missing)

| Entry name | gstack skill dir | Status |
|---|---|---|
| autoplan | autoplan | matched |
| codex | codex | matched |
| design-shotgun | design-shotgun | matched |
| design-html | design-html | matched |
| design-consultation | design-consultation | matched |
| plan-design-review | plan-design-review | matched |
| plan-devex-review | plan-devex-review | matched |
| plan-eng-review | plan-eng-review | matched |
| plan-tune | plan-tune | matched |
| context-save | context-save | matched |
| context-restore | context-restore | matched |
| qa-only | qa-only | matched |
| devex-review | devex-review | matched |
| benchmark | benchmark | matched |
| browse | browse | matched |
| open-gstack-browser | open-gstack-browser | matched |
| connect-chrome | — | **MISSING** |
| setup-browser-cookies | setup-browser-cookies | matched |
| ship | ship | matched |
| land-and-deploy | land-and-deploy | matched |
| setup-deploy | setup-deploy | matched |
| setup-gbrain | setup-gbrain | matched |
| canary | canary | matched |
| document-release | document-release | matched |
| document-generate | document-generate | matched |
| careful | careful | matched |
| guard | guard | matched |
| freeze | freeze | matched |
| unfreeze | unfreeze | matched |
| gstack-upgrade | gstack-upgrade | matched |
| learn | learn | matched |
| health | health | matched |
| make-pdf | make-pdf | matched |

### 2 alias suffix `-gstack` (both matched)

| Entry name | gstack skill dir |
|---|---|
| retro-gstack | retro |
| investigate-gstack | investigate |

---

## Missing Entries (4) — Analysis & Resolution

### M-1: `connect-chrome` (W0.2 NEW, IS gstack-scoped)

- **Status**: gstack skill dir 不存在 (sister project CLAUDE.md L82 列出 `/connect-chrome` 但 plugin 当前未 ship)
- **Resolution**: 标 `since: v3.x` defer per PLAN.md L389 (K1 mitigation soft-warn)
- **Action**: 在 `workflows/capabilities.yaml` patch `connect-chrome.since` → `v3.x`
- **Rationale**: 用户调用 `/connect-chrome` 时, runtime engine will surface "unknown slash cmd" warning, NOT silent broken; entry register-only spirit (D-12)

### M-2 / M-3 / M-4: pre-existing impl mismatch (NOT W0.2 scope)

以下 3 entry 是 v2 SHIPPED 时已存在的 `impl: gstack` 标记, 但实际 skill 不在 gstack/ subdir 下:

| Entry | Actual install location | True impl |
|---|---|---|
| ui-ux-pro-max | `~/.claude/skills/ui-ux-pro-max/` | claude-code-plugin (separate plugin, NOT gstack) |
| frontend-design | (separate plugin per project CLAUDE.md skills list `frontend-design:frontend-design`) | claude-code-plugin |
| webapp-testing | (bundled in document-skills + example-skills + frontend-design per skills list) | claude-code-plugin |

- **Status**: Pre-existing v2 misclassification (NOT introduced by W0.2 — sister Phase 2.2 ship cadence)
- **Resolution**: **OUT OF SCOPE for W1.1**; defer to v3.x patch (separate K-issue concern, impl field correction)
- **Risk**: 用户调用时 cmd 仍然 routable (Claude Code 平台 global skill discovery), 不会 break, 仅 impl 字段语义不准确
- **Recommendation**: 后续 phase 单独 audit + correct `impl: claude-code-plugin` (含 plugin_path 字段)

---

## Patch Applied to capabilities.yaml

仅 1 entry patch (M-1): `connect-chrome.since` v3.0 → v3.x

```diff
-  connect-chrome:
-    impl: gstack
-    cmd: /connect-chrome
-    since: v3.0
+  connect-chrome:
+    impl: gstack
+    cmd: /connect-chrome
+    since: v3.x
     category: tool-slash-cmd
     description: 连接现有 Chrome 实例 (用于 Chrome extension 测试)
     fires_when:
       - subtask.needs_chrome_extension == true
```

3 pre-existing entries (M-2/M-3/M-4) NOT patched — out of W1.1 scope。

---

## Acceptance (per PLAN L388-391)

1. **Output `.planning/phase-v3.0-3.3/gstack-skill-diff.md` 记录 33 entry vs 实际 gstack plugin install list** ✓
2. **不匹配 entry 在 capabilities.yaml 标注 `since: v3.x`** ✓ (`connect-chrome` patched)
3. **Wave C plan-check 验证此 diff 文档 exist** ✓ (relative path `.planning/phase-v3.0-3.3/gstack-skill-diff.md` per Wave C L-2 advisory)

---

## Cross-References

- `.planning/phase-v3.0-3.2/PLAN.md` § T3.3.W1.1 (acceptance source)
- `~/.claude/skills/gstack/` (install root, verified 2026-05-21)
- `workflows/capabilities.yaml` (44 `impl: gstack` entries, post-W0.2 ship cb2337c)
- Sister Phase 2.3 W0.6 ci.yml gate (check-workflow-schema.mjs validates capabilities.yaml schema, NOT install presence)
