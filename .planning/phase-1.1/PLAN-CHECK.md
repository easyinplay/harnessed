# Phase 1.1 Plan Check

> Verifier: gsd-plan-checker (Opus 4.7)
> Date: 2026-05-11
> Inputs: PLAN.md (339 L) + task_plan.md (1528 L, 47 sub-tasks) + ROADMAP.md (Phase 1.1) + ADR 0001 + ASSUMPTIONS.md (5 callouts)

## Verdict

⚠️ **APPROVED WITH CONDITIONS**

PLAN 整体结构、依赖图、acceptance bar、callout 覆盖均健康，可以进入 execute。但存在 **1 个必须先 patch 的内部一致性问题**（V1，install method 计数 5 vs 6），以及 **3 个建议在执行启动前 5 分钟内修复的小瑕疵**（V4 acceptance 复现命令、V2 部分 callout 显式 traceability）。Phase goal（schema v1 冻结 + 4 层骨架 + ≥50 测试 + ctx7 真实 manifest pass + 三平台 CI 全绿）的所有硬验收均有具体 task / 命令对应，不存在范围越界。

---

## V1. Install method 5 vs 6（一致性 BLOCKER — 必须先 patch）

**事实核对（基于 ADR 0001 line 64-66 + line 108-113 矩阵）**：

ADR 0001 实际枚举的 `install.method` 值有 **6 种**：
1. `cc-plugin-marketplace`
2. `git-clone-with-setup`
3. `npx-skill-installer`
4. `npm-cli`（含 `npx` fallback）
5. `mcp-stdio-add`
6. `mcp-http-add`

但以下文档说"5 种"：
- PROJECT-SPEC v2.1 § 2 (ADR 0001 Context line 14)
- ROADMAP.md line 51 (`5 种 installer 中的 3 个`)、line 124 (`5 种 installer 全部覆盖 9 个上游`)
- PLAN.md line 86 (T3.4 description: "5 个 install method 差异化 schema") **— 同一行 file 路径却列出 6 个文件**（自相矛盾）
- PLAN.md line 201、227、339 重复"5 install methods / 5 个 install method"

**结论**：ADR 0001 的真实矩阵就是 6 种 method（mcp-stdio-add 与 mcp-http-add 是两个独立 method，对应 MCP 的 stdio / http transport，schema 上字段差异 = git_ref 不需要 / npm_version 必填语义可能不同）。"5 种" 是 SPEC v2.0→v2.1 patch 时漏改的旧数字 + 把两种 mcp transport 合并的口语化表述。

**必修建议（执行 phase 1.1 前 5 分钟）**：

1. **PLAN.md line 86 改写**：T3.4 名称改为"6 个 install method 差异化 schema"，与 file 路径数一致。
2. **PLAN.md line 201 / 227 / 339** 同步改 6。
3. **ADR 0001 line 14**："5 种异构 install method" → "6 种异构 install method（cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / npm-cli / mcp-stdio-add / mcp-http-add）"。
4. **PROJECT-SPEC § 2** + **ROADMAP line 51 / 124** 同步改 6（这两个文件不属于 phase 1.1 task，但 phase 1.1 T7.10 反哺机制可顺手 patch；建议作为 ADR 0003 errata 的最小补丁）。

**为何是 BLOCKER 而非 warning**：T3.4 验收条件是"每个 method 必填字段差异化"，5 vs 6 的语义不同会让 executor 在写第 6 个文件时纠结"这是不是 scope creep"。先 patch，再 execute。

---

## V2. ASSUMPTIONS 5 项 callout 覆盖

| Callout | 内容 | 对应 task | 状态 | 备注 |
|---------|------|-----------|------|------|
| **C2** | 9 上游 manifest dry-run 验证 schema 充分性 | T7.1-T7.10 | ✅ | T7.10 显式包含"反哺 ADR"逻辑（PLAN.md line 130 + task_plan.md line 1211-1221）— 即使 9 上游全 pass 也要 log finding。覆盖完整。 |
| **C3** | `.gitattributes` 强制 LF Day 1 落地 | T1.2 | ✅ | task_plan.md line 58-92 给出完整 `.gitattributes` 模板 + 验收命令 `git ls-files --eol`（A8）。 |
| **C6** | ≥ 50 测试 + ctx7 真实 manifest pass（schema 表达充分性 ≠ 仅拒绝） | T8.1（ctx7 正向）+ T8.8（≥ 50）+ A1 + A2 | ✅ | 测试矩阵分解 17+14+4+5+5+benchmark+workflow+routing ≈ 50+，自然达成。 |
| **B7** | `manifests/SCHEMA.md`（ROADMAP 漏列） | T6.1 | ✅ | task_plan.md line 1045-1060 明确"实现视图 + 9 上游路径占位 + 链接 ADR 0001 + schema 文件"。 |
| **B9 + GA-1 + GA-2** | TS strict / Ajv / 单包布局 | T2.2 / T4.1 / `package.json` 单包 | ✅ | authority_documents 显式引用 GA-1/GA-2，决策已落地为 ADR 0002。 |

**未发现遗漏 callout**。

**轻微改进建议（非 BLOCKER）**：T7.10 的"反哺 ADR"逻辑当前依赖 executor 主观判断"是否需要新 ADR"。建议在 task_plan.md T7.10 acceptance 加一条机械规则："如 9 上游中 ≥ 1 个需要 schema 加字段才能合法 → 必须出 ADR 0003 errata；如全 pass → 强制 log 1 行到 progress.md § B（不接受静默跳过）"— 当前 PLAN.md line 130 已写"如全 pass → log 一条 finding 即可"，task_plan.md line 1221 也写了，已经满足。✅

---

## V3. Out-of-scope 越界检查

grep `task_plan.md` 关键词：`installer.*实装` / `DAG resolver` / `setup 命令` / `doctor 命令` / `cmd /c` / `research workflow.*端到端` / `cross-OS.*matrix`

**结果**：**0 命中**，无越界。

PLAN.md § 4.2 显式列出 6 项 out-of-scope（installer 实装 → 1.2 / DAG → 1.3 / cross-OS npx wrapper → 1.2 / setup-doctor → 1.3 / 真实 install 命令执行 → 1.2+ / 9 上游精确填字段 → 1.2），与 ROADMAP line 76-84 phase 1.2-1.4 划分严格匹配。

T9.1 (`ci.yml` 三平台) 看似涉嫌 cross-OS，但实际只是 typecheck/lint/test/build 的 CI 守门，不包含 phase 1.2 才有的"真实 install 9 上游 + npx cmd /c wrapper 测试"。属于 Day 1 落地的 acceptance bar A4，不算越界。✅

---

## V4. 验收可执行性

| Bar | 复现命令 | 可执行？ | 备注 |
|-----|---------|---------|------|
| A1 ≥ 50 测试 | `pnpm test` 输出 | ✅ |  |
| A2 ctx7 manifest pass | T7.9 fixture 在 T8.1 中绿 | ✅ | 隐含命令：`pnpm test -- manifest-validate.positive` |
| A3 非法 reject + 行号精准 | T8.2-T8.5 ≥ 35 测试 | ✅ |  |
| A4 三平台 CI | GitHub Actions UI 三 job 全绿 | ⚠️ | "UI 截图 / log" 不算单 command；建议补：`gh run view <run-id> --json jobs --jq '.jobs[] \| select(.conclusion != "success")' \| wc -l` 输出 0 |
| A5 ajv strict 自校验 | `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` | ✅ |  |
| A6 benchmark < 100ms | T8.6 vitest bench < 50ms | ✅ |  |
| A7 ADR 不被改 | `git diff <tag> -- docs/adr/0001-*.md docs/adr/0002-*.md` | ✅ | 但 V1 的 patch 例外 — 必须在 phase 1.1 *起点* 之前 patch，或者通过新出 ADR 0003 errata 处理 |
| A8 LF | `git ls-files --eol manifests/*.yaml` | ⚠️ | T7 完成前 manifests/ 还没有 yaml；建议改成 `git ls-files --eol "*.yaml" "*.json" "*.md" \| grep -v lf/lf` 输出 0 |

**结论**：A4 / A8 验收命令应该改成机械可判定的 single-command。这是 minor warning，不阻塞执行。

---

## V5. 依赖图正确性

抽样核对 task_plan.md 子任务依赖：

- **T6.1 (manifests/SCHEMA.md)**：PLAN.md line 107 标"依赖 T1，可与 T3-T5 并行"。✅ 正确 — manifests/SCHEMA.md 是文档+ADR 0001 链接 + 9 上游路径占位表，不依赖 schema 实装代码。
- **T7 (9 上游 dry-run) 依赖 T4 (validator)**：PLAN.md § 2 T7 标题 "依赖 T4 完成 validator"。✅ 必要且充分。
- **T7.10 → T8 顺序**：PLAN.md 依赖图 line 213 "T7.10 → T8.* 测试矩阵"；task_plan.md 中 T8.1 acceptance 引用 T7 fixture，正确。✅
- **T10 verify 依赖全部**：PLAN.md line 156 "依赖全部"，T10.1 跑 `pnpm typecheck && lint && test:coverage && build && validate-schemas` 一条龙，覆盖 A1-A6。✅
- **关键路径**：T1.1 → T2.1 → T2.6 → T3.1...T3.5 → T4.1...T4.4 → T5.1 → T7.* → T7.10 → T8.* → T9.1 → T10.1...T10.4 ≈ 14 步 sequential，与 PLAN.md line 232-234 一致，无循环依赖、无 forward reference。✅

**单一关注点**：T5.1 (`build-schema.ts` TypeBox → JSON Schema) 与 T7 (9 dry-run) 的关系不明朗。如果 T7 直接用 TS validator (T4)，则 T5 与 T7 可并行；如果 T7 用 publish 出来的 `schemas/manifest.v1.schema.json` + 外部 ajv，则 T5 必须先于 T7。PLAN.md line 207-211 暗示 T5 在 T7 之前（关键路径），保守正确，但 task_plan.md 没在 T7.1 显式声明依赖 T5.1。**建议**：execute 时按 PLAN.md 关键路径顺序，T5.1 先于 T7.1。

---

## 必修 fix（执行 phase 1.1 前 5 分钟内做完）

1. **V1 修正**：把 PLAN.md / ADR 0001 / SPEC § 2 / ROADMAP 中的 "5 种 install method" 全部 patch 成 "6 种"（mcp-stdio-add 与 mcp-http-add 算独立 method）。最小修正：仅改 PLAN.md line 86 + line 201 + line 227 + line 339。ADR / SPEC / ROADMAP 推迟到 T7.10 一并出 ADR 0003 errata。

## 可选 fix（不阻塞，建议执行中顺手处理）

1. **V4 改进**：A4 / A8 acceptance bar 加机械可判定的 single-command（见 V4 表格）。
2. **V5 显化**：在 task_plan.md T7.1 acceptance 加 "前置依赖 T5.1 已生成 schemas/manifest.v1.schema.json" 的明示。
3. PLAN.md § 7 接口契约表中应补 ADR 0003 (potential errata) 作为 phase 1.2 输入候选。

## 给 execute-phase 的 callout

1. **schema 冻结纪律**：T7.10 是 phase 1.1 唯一允许"修订 ADR 0001"的窗口。如 9 上游 dry-run 触发新增字段，必须出 ADR 0003 errata，不能 inline 改 ADR 0001。STOP T8 直到 errata accepted。
2. **install method 数 = 6**：T3.4 写 6 个 file（不是 5），T8.3 矩阵非法组合数也按 6 method × 4 type = 24 - 6 legal (per ADR 0001 矩阵) = **18 illegal**，而非 PLAN.md T8.3 / task_plan.md 当前写的 14。**这是 V1 的连锁影响 — execute 时必须重算并扩充测试 fixture**。
3. **A7 验收锁 schema**：phase 1.1 结束前必须 `git tag adr-0001-accepted` 并把 A7 改写成 `git diff adr-0001-accepted -- docs/adr/0001-manifest-schema-v1.md` exit 0（仅允许通过 ADR 0003 反哺，不允许 inline 改 ADR 0001）。

