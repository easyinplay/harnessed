---
phase: 1.1-skeleton-schema-frozen
milestone: v0.1.0
type: execute
status: ready-for-execute
created: 2026-05-11
dependencies: []                     # 首个 phase
unblocks: [phase-1.2-cross-os-ci, phase-1.3-dag-resolver, phase-1.4-research-workflow]
authority_documents:
  - PROJECT-SPEC.md (v2.1, sec 1 / 2 / 4 / 8.1 / 9 / 10 / 11)
  - WORKFLOWS-MVP.md (v2.1)
  - .planning/ROADMAP.md (v0.1.0 Phase 1.1 章节)
  - .planning/REQUIREMENTS.md (R1.1 / R1.2 partial / R1.4 / R4.1 / R5.1)
  - docs/adr/0001-manifest-schema-v1.md (Accepted)
  - docs/adr/0002-repo-structure-toolchain-v0.1.md (Accepted)
  - .planning/phase-1.1/ASSUMPTIONS.md
  - .planning/phase-1.1/GRAY-AREA-1-json-schema.md
  - .planning/phase-1.1/GRAY-AREA-2-repo-structure.md
requirements_addressed:
  - R1.1   # manifest schema v1 冻结（schema 文件 publish 准备 + JSON Schema 校验）
  - R1.4   # JSON Schema strict 校验（Kubeconform -strict 语义）
  - R4.1   # routing/*.md SSOT schema（routing/SCHEMA.md 落地）
  - R5.1   # cross-OS CI 矩阵（Day 1 启用三平台守门）
  # 注：R1.2 4 type × 5 method 矩阵在本 phase 仅落 schema 表达，installer 实装在 phase 1.2
acceptance_high_level:
  - 4 层目录骨架 + 工具链全到位（pnpm typecheck/lint/test/build 三平台全绿）
  - 3 份 SCHEMA.md（manifests/workflows/routing）+ 3 份 JSON Schema 文件全部存在
  - schema validator ≥ 50 测试 + ≥ 1 个真实上游 manifest（ctx7）pass
  - 任意非法 manifest 被 reject + 行号精准定位
  - .gitattributes Day 1 落地（C3 callout）
---

# Phase 1.1 PLAN — repo 骨架 + manifest schema v1 frozen + ADR 0001/0002

> 视角：GSD（项目经理 / phase-level orchestration）
> 范围：v0.1.0 第一个 phase，phase 1.2-1.4 的入口前置
> 完成定义：`task_plan.md` 全部 task checkbox ✅ + acceptance hard bar 全部满足 + STATE.md 标记 phase 1.1 completed

---

## 1. Phase 元数据

| 字段 | 值 |
|------|----|
| Phase ID | 1.1 |
| Phase 名称 | repo 骨架 + manifest schema v1 frozen + ADR 0001 + ADR 0002 |
| 所属里程碑 | v0.1.0（manifest 引擎 + research workflow 入口） |
| 周期估算 | 2.5-3 工作日（基于 ADR 0002 工具链 + ~50 测试 + 9 上游 dry-run） |
| 依赖前置 phase | 无 |
| 后续解锁 phase | 1.2（cross-OS CI + 2 个 installer）、1.3（DAG resolver + setup/doctor）、1.4（research workflow） |
| ADR 落地 | 0001（manifest schema v1）✅、0002（repo structure + toolchain）✅ |
| Decision boundary | 6 项 spec 修订 + GA-1 + GA-2 全部锁定，本 phase 不再 reopen |

---

## 2. 任务拆解（Task Graph）

### T1. 仓库骨架初始化（无依赖 — Day 1 起点）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T1.1** | 创建 4 层目录 | `manifests/{tools,skill-packs}/` `workflows/` `routing/` `config-templates/{hooks/}` `vendor/` `src/{installers,doctor,routing-engine,checkpoint,manifest/schema,manifest/schema/installMethods,cli}/` `tests/{fixtures/manifests/{valid,invalid},unit,integration}/` `docs/{adr,benchmarks}/` `schemas/` `scripts/` `.github/workflows/` | 10+ 目录全部存在 | SPEC § 4 + B7 增补 |
| **T1.2** | 写 `.gitattributes` 强制 yaml/json/md 行尾 LF | `.gitattributes` | Windows checkout 后 yaml/json 是 LF | C3 callout |
| **T1.3** | 写 `.gitignore`（增补）+ `vendor/ENTRY-CRITERIA.md` 占位 | `.gitignore` `vendor/ENTRY-CRITERIA.md` | dist / node_modules / .harnessed 被忽略 | SPEC § 8.2 |
| **T1.4** | 写 LICENSE（Apache-2.0）+ NOTICE（占位） | `LICENSE` `NOTICE` | LICENSE 是完整 Apache-2.0 文本；NOTICE 含 "Not affiliated with Harness Inc." | SPEC § 1 + § 7 风险表 |
| **T1.5** | 各层目录占位 `.gitkeep` + 简短 README placeholder | `manifests/README.md` `workflows/README.md` `routing/README.md` `config-templates/README.md` `vendor/README.md` `schemas/README.md` `tests/README.md` | 每个目录有可读 README ≤ 30 行 | B7 一致性 |

### T2. 工具链初始化（依赖 T1）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T2.1** | 写 `package.json`（直接复制 ADR 0002 模板） | `package.json` | `pnpm -v` 走 corepack 装 10.12.0 成功 | ADR 0002 § 1-2 |
| **T2.2** | 写 `tsconfig.json`（ADR 0002 模板） | `tsconfig.json` | `pnpm typecheck` 0 错误 | ADR 0002 § 3 + B9 |
| **T2.3** | 写 `tsup.config.ts`（ADR 0002 模板） | `tsup.config.ts` | `pnpm build` 产出 `dist/cli.mjs` 含 shebang + 可执行 | ADR 0002 § 3 |
| **T2.4** | 写 `biome.json`（ADR 0002 模板） | `biome.json` | `pnpm lint` 通过 | ADR 0002 § 6 |
| **T2.5** | 写 `vitest.config.ts` | `vitest.config.ts` | `pnpm test` 跑通空白用例 | ADR 0002 § 4 + B3 |
| **T2.6** | 占位 `src/index.ts` `src/cli.ts`（含 shebang）`src/schemas/index.ts` | `src/index.ts` `src/cli.ts` `src/schemas/index.ts` | `pnpm build` 后 `node ./dist/cli.mjs --version` 输出 0.1.0-alpha.1 | ADR 0002 § 3 |

### T3. manifest schema v1 实现（依赖 T2）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T3.1** | TypeBox schema 入口 + apiVersion / kind | `src/manifest/schema/index.ts` `src/manifest/schema/apiVersion.ts` | `Static<typeof ManifestSchema>` 类型成功导出 | ADR 0001 + GA-1 |
| **T3.2** | metadata 子 schema（含 upstream block） | `src/manifest/schema/metadata.ts` | metadata 必填字段全覆盖；SPDX license 用 Type.Union 限定白名单 | ADR 0001 metadata 块 |
| **T3.3** | spec 子 schema 主壳（type / component_type / install / verify / uninstall / upstream_health / signed_by / platforms） | `src/manifest/schema/spec.ts` | type × method 矩阵用 oneOf + discriminator 实现 | ADR 0001 spec 块 + 矩阵表 |
| **T3.4** | 6 个 install method 差异化 schema | `src/manifest/schema/installMethods/{ccPluginMarketplace,gitCloneWithSetup,npxSkillInstaller,npmCli,mcpStdio,mcpHttp}.ts` | 每个 method 必填 git_ref/npm_version 等差异字段 schema 化 | ADR 0001 type×method 矩阵 |
| **T3.5** | reject list 字段约束（additionalProperties:false 全树 + dynamic shell escape detection） | 在 spec.ts / metadata.ts 嵌入 + 注释 | unknown field reject + `${shell command}` / `eval` / `extends` 测试 reject | ADR 0001 拒绝清单 |

### T4. manifest validator 实现（依赖 T3）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T4.1** | Ajv compile + strict mode + discriminator 配置 | `src/manifest/validate.ts` | Ajv 单例 lazy compile，开 `strict: true / allErrors: true / discriminator: true` | GA-1 |
| **T4.2** | yaml CST range → 行号映射 | `src/manifest/errors.ts` | parseDocument + locateLineFromCST 实现；ErrorObject 转友好 `{path, message, line, file}` | GA-1 § 关键代码模式 |
| **T4.3** | `validateManifestFile(yamlSource, filename)` 公开 API | `src/manifest/validate.ts`（同 T4.1） | 返回 `{ok, manifest|errors}` discriminated union | GA-1 |
| **T4.4** | shell escape 自定义检测（pre-Ajv pass） | `src/manifest/validate.ts` 内置 pre-validator | `${...}` `$(...)` `eval` `!ruby/regexp` 触发 reject | ADR 0001 安全约束 + R9.3 |

### T5. JSON Schema artifact publish 准备（依赖 T4）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T5.1** | `scripts/build-schema.ts` 把 TypeBox → 标准 JSON Schema 文件 | `scripts/build-schema.ts` | `pnpm build:schema` 输出 `schemas/manifest.v1.schema.json` | GA-1 § publish |
| **T5.2** | workflow phases JSON Schema | `schemas/workflow.v1.schema.json` | 9 字段（id/layer/upstream/invokes/inputs/outputs/pause?/on_veto?/conditional?）严格校验 | SPEC § 10 + A5 |
| **T5.3** | routing yaml frontmatter JSON Schema | `schemas/routing.v1.schema.json` | 3 块（trigger/hard_route/soft_hint+fallback）严格校验 | SPEC § 9 + R4.1 + A6 |
| **T5.4** | `pnpm validate-schemas`：本地 self-check（`ajv compile --strict=true` 三个 schema 文件） | `scripts/validate-schemas.mjs` | 三 schema 文件均通过 ajv 严格自校验 | GA-1 § CI 集成 |

### T6. SCHEMA.md 三份（依赖 T1，可与 T3-T5 并行）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T6.1** | `manifests/SCHEMA.md`（B7 增补 — ROADMAP 漏列） | `manifests/SCHEMA.md` | 引用 ADR 0001 + 链接 schemas/manifest.v1.schema.json + 9 上游路径占位表 | B7 callout |
| **T6.2** | `workflows/SCHEMA.md`（phases schema 标准定义） | `workflows/SCHEMA.md` | 9 字段表 + plan-feature reference 完整示例 + 链接 schemas/workflow.v1.schema.json | SPEC § 10 |
| **T6.3** | `routing/SCHEMA.md`（B+C 路由 yaml frontmatter） | `routing/SCHEMA.md` | trigger/hard_route/soft_hint+fallback 块 + 完整示例（routing/ui.md style）+ 链接 schemas/routing.v1.schema.json | SPEC § 9 |

### T7. 9 上游 manifest dry-run（C2 mitigation — 依赖 T4 完成 validator）

> 目的：C2 callout 直接缓解。在第一行 installer 代码前用 9 个真实上游验证 schema 字段是否充分。如发现缺字段或语义不清，**必须**在 phase 1.1 内反哺 ADR 0001（出 ADR 0003 errata 或 in-place 增改 v1 — 由 maintainer 决定）。

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T7.1** | 起草 `manifests/skill-packs/gstack.yaml`（git-clone-with-setup, cc-skill-pack, command） | dry-run yaml | validator pass | SPEC § 2 上游 1 |
| **T7.2** | 起草 `manifests/skill-packs/GSD.yaml`（npm-cli, cli-npm, command） | dry-run yaml | validator pass | SPEC § 2 上游 2 |
| **T7.3** | 起草 `manifests/tools/superpowers.yaml`（cc-plugin-marketplace, cc-plugin, command） | dry-run yaml | validator pass | SPEC § 2 上游 3 |
| **T7.4** | 起草 `manifests/skill-packs/planning-with-files.yaml`（cc-plugin-marketplace, cc-skill-pack, command） | dry-run yaml | validator pass | SPEC § 2 上游 4 |
| **T7.5** | 起草 `manifests/skill-packs/mattpocock-skills.yaml`（npx-skill-installer, cc-skill-pack, command） | dry-run yaml | validator pass | SPEC § 2 上游 5 |
| **T7.6** | 起草 `manifests/skill-packs/karpathy-skills.yaml`（npx-skill-installer, cc-skill-pack, **behavior-rule**） | dry-run yaml | validator pass + behavior-rule 语义验证 | SPEC § 2 上游 6 + ADR 0001 component_type |
| **T7.7** | 起草 `manifests/tools/ralph-loop.yaml`（cc-plugin-marketplace, cc-plugin, command） | dry-run yaml | validator pass | SPEC § 2 上游 7 |
| **T7.8** | 起草 `manifests/tools/tavily-mcp.yaml`（mcp-stdio-add, mcp-npm, mcp-tool） | dry-run yaml | validator pass | SPEC § 2 上游 8 |
| **T7.9** | 起草 `manifests/tools/exa-mcp.yaml`（mcp-stdio-add, mcp-npm, mcp-tool）+ `manifests/tools/ctx7.yaml`（npm-cli, cli-npm, cli-binary） | 2 份 dry-run yaml | validator pass + 9 上游全覆盖 | SPEC § 2 上游 9 |
| **T7.10** | 反哺 ADR 0001（如 T7.1-T7.9 任一发现缺字段 → 出 ADR 0003 errata 或 patch 0001；如全 pass → log 一条 finding 即可） | `docs/adr/0003-*.md`（条件性）+ progress.md § B update | 决策回溯清晰；rejection rate ≤ 5%（即 ≤ 1 个 manifest 需要 schema 调整 — 否则视为 schema 严重缺陷需要回 ADR 0001 重做） | C2 callout |

### T8. 测试（依赖 T4 + T6 + T7）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T8.1** | 正向测试：9 上游 manifest 全 pass（fixture 来自 T7） | `tests/fixtures/manifests/valid/*.yaml` + `tests/unit/manifest-validate.positive.test.ts` | 9 个测试全绿 | C6 callout + B6 |
| **T8.2** | 必填字段缺失测试（每个 required field 故意 omit 一次 ≈ 17 测试） | `tests/fixtures/manifests/invalid/missing-*.yaml` + `tests/unit/manifest-validate.required.test.ts` | 17 个测试全绿 + 错误信息含正确 path | B6 |
| **T8.3** | type × method 矩阵非法组合测试（18 illegal combinations — 6 method × 4 type = 24 - 6 legal = 18） | `tests/fixtures/manifests/invalid/invalid-method-*.yaml` + `tests/unit/manifest-validate.matrix.test.ts` | 18 个测试全绿 | ADR 0001 矩阵表 + B6 |
| **T8.4** | reject list 测试（dynamic shell escape / eval / extends / unknown fields = 4 测试） | `tests/fixtures/manifests/invalid/reject-*.yaml` + `tests/unit/manifest-validate.reject.test.ts` | 4 个测试全绿 | ADR 0001 拒绝清单 + R9.3 |
| **T8.5** | SPDX license 非白名单测试 + 行号定位精准测试（≥ 5 个错误行号 assertion） | `tests/unit/manifest-validate.spdx.test.ts` + `tests/unit/manifest-validate.line-number.test.ts` | 行号定位偏差 = 0 行 | GA-1 § yaml CST + B6 |
| **T8.6** | benchmark：100 manifest 串行校验 < 100ms | `tests/integration/benchmark.test.ts`（vitest bench API） | 实测 < 50ms 留 50% 裕度 | GA-1 验收建议 |
| **T8.7** | workflow + routing schema 同等覆盖（少量正负样本） | `tests/fixtures/{workflows,routing}/{valid,invalid}/*.yaml` + 对应 unit test | 每个 schema ≥ 5 正向 + 5 负向 测试 | A5 + A6 + B6 |
| **T8.8** | 总测试数 ≥ 50 + 覆盖率 statement ≥ 80% | `pnpm test:coverage` 报告 | 数量与覆盖率达标 | C6 callout 具体化 |

### T9. CI + Docs 收尾（依赖 T1-T8 大部分）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T9.1** | GitHub Actions 三平台 CI（直接复制 ADR 0002 模板） | `.github/workflows/ci.yml` | mac/linux/win-native × Node 22 全绿（实测）；`fail-fast: false` | ADR 0002 § CI 矩阵 + R5.1 |
| **T9.2** | `.github/workflows/schema-validate.yml`（B5：单 ubuntu-latest 跑 schema-only validation） | `.github/workflows/schema-validate.yml` | PR 触发；schema 偏差立即 fail | B5 |
| **T9.3** | 更新 `README.md`（项目入口 + Apache-2.0 disclaimer + 安装节占位） | `README.md` | 含项目定位 + 链接 SPEC + ADR 索引 + Not affiliated with Harness Inc. | SPEC § 7 风险表 + R8.4 占位 |
| **T9.4** | 写 `CONTRIBUTING.md`（contributor onboarding — `corepack enable` + 命令清单） | `CONTRIBUTING.md` | dev 环境 30 分钟可跑通 | R8.2 占位（v0.4 真验收，但 v0.1 留入口） |
| **T9.5** | 写 `docs/MAINTAINER-ONBOARDING.md` 占位（v0.4 内容，本 phase 仅留 stub） | `docs/MAINTAINER-ONBOARDING.md` | 占位文件标 v0.4 完成 | R8.2 |
| **T9.6** | `docs/adr/README.md` ADR 索引 | `docs/adr/README.md` | 列出 0001 + 0002（+ 可能 0003） | R8.4 占位 |

### T10. Phase 1.1 verify（最后一关 — 依赖全部）

| Task | 名称 | 输出 | 验收 | 决策来源 |
|------|------|------|------|---------|
| **T10.1** | 全栈三平台跑 `pnpm typecheck && pnpm lint && pnpm test:coverage && pnpm build && pnpm validate-schemas` | CI 全绿（GitHub Actions UI 截图 / log） | 三平台都 0 失败 | R5.1 + ADR 0002 § CI 守护 |
| **T10.2** | 写 `.planning/phase-1.1/VERIFICATION.md`（如何 retest） | `.planning/phase-1.1/VERIFICATION.md` | 含全部 acceptance bar 复现命令 | GSD 标准 |
| **T10.3** | 更新 `.planning/STATE.md` 把 phase 1.1 标记 completed + log 关键 finding | `.planning/STATE.md` | phase 1.1 status = done；包含 unblocks 列表 | GSD 标准 |
| **T10.4** | git tag `v0.1.0-alpha.1-schema-frozen`（标记 schema v1 冻结点） | git tag | tag 推送成功 + 标注 ADR 0001 | SPEC § 8.1 schema 冻结纪律 |

---

## 3. 依赖图（ASCII）

```
                    ┌──────────────────────────────────────────────┐
                    │                Phase 1.1                     │
                    └──────────────────────────────────────────────┘

T1.1 dirs ──┬──> T1.2 .gitattributes ──┐
            ├──> T1.3 .gitignore       │
            ├──> T1.4 LICENSE/NOTICE   │
            └──> T1.5 .gitkeep+README ─┤
                                       │
                                       ▼
                                  T2.1 package.json
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                     T2.2 tsconfig  T2.4 biome.json T2.5 vitest.config
                          │            │            │
                          ▼            ▼            ▼
                     T2.3 tsup.config (依赖 T2.2)
                          │
                          ▼
                     T2.6 src/cli.ts skeleton
                          │
                          ▼
            ┌─────────────┴─────────────┐
            ▼                           ▼
       T3.1 schema/index           T6.1-T6.3 SCHEMA.md (并行)
            │                           │
            ▼                           │
       T3.2 metadata.ts                 │
            │                           │
            ▼                           │
       T3.3 spec.ts ──> T3.4 6 install methods ──> T3.5 reject list
            │
            ▼
       T4.1 Ajv validate ──> T4.2 yaml errors ──> T4.3 public API ──> T4.4 shell escape
            │
            ▼
       T5.1 build-schema script ──> T5.2 workflow.v1.schema ──> T5.3 routing.v1.schema ──> T5.4 self-check
            │
            ▼
       T7.1-T7.9 9 上游 dry-run (并行 9 个)
            │
            ▼
       T7.10 反哺 ADR (条件性) ─── 决策 reset point: 如 schema 缺字段 → 先 patch ADR 0001 再继续 T8
            │
            ▼
       T8.1-T8.7 测试矩阵 ──> T8.8 总数 / 覆盖率验收
            │
            ▼
       T9.1 CI ──> T9.2 schema-validate ──> T9.3-T9.6 docs
            │
            ▼
       T10.1 三平台全套 ──> T10.2 VERIFICATION ──> T10.3 STATE.md ──> T10.4 git tag

并行机会:
  - T1.* 5 个子任务全部 sequential 但 < 30 min
  - T2.2 / T2.4 / T2.5 完全独立 (3 路并行)
  - T3.4 6 个 install method schema 内部可并行写
  - T6.1 / T6.2 / T6.3 SCHEMA.md 完全独立
  - T7.1-T7.9 9 个 manifest 独立 (上限并行)
  - T8.1 / T8.2 / T8.3 / T8.4 / T8.5 / T8.6 / T8.7 测试 7 路并行

关键路径 (critical path):
  T1.1 -> T2.1 -> T2.6 -> T3.1 -> T3.2 -> T3.3 -> T3.4 -> T3.5 -> T4.1 -> T4.2 -> T4.3 -> T4.4
       -> T5.1 -> T7.* -> [T7.10 if needed] -> T8.* -> T9.1 -> T10.1 -> T10.4

预计关键路径长度: ~14 步 (sequential), 实际工时 ~2.5-3 工作日 (基于 ADR 0002 工具链 + karpathy surgical 切分)
```

---

## 4. 验收标准（Goal-Backward）

### 4.1 Phase 级硬验收（必须全部 ✅ 才算 phase 1.1 done）

来自 ROADMAP Phase 1.1 + ASSUMPTIONS § 六.2 具体化：

| Bar | 验收命令 / 检查 | 来源 |
|-----|---------------|------|
| **A1** schema validator 单测 ≥ 50 测试 | `pnpm test` 输出 "Tests: ≥ 50 passed" | C6 + B6 |
| **A2** ≥ 1 个真实上游（ctx7）完整 manifest pass | T7.9 ctx7 manifest 在 T8.1 正向测试中 pass | C6 |
| **A3** 任意非法 manifest 被 reject + 行号精准定位 | T8.2-T8.5 共 ≥ 35 负向 / 行号测试全绿 | ROADMAP must-have + C6 |
| **A4** 三平台 `pnpm typecheck && lint && test && build` 全绿 | GitHub Actions UI 显示 mac/linux/win × Node 22 = 3 个 job 全 ✅ | R5.1 + ADR 0002 § CI 守护 |
| **A5** schemas/manifest.v1.schema.json publish-ready | `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` exit 0 | GA-1 § publish + B4 |
| **A6** benchmark：100 manifest < 100ms | T8.6 vitest bench 输出 < 50ms（50% 裕度） | GA-1 |
| **A7** ADR 0001 / 0002 不被本 phase 任意修改 | git diff against tag adr-0001-accepted = 0（仅允许出 ADR 0003 反哺） | SPEC § 8.1 |
| **A8** `.gitattributes` 强制 LF | `git ls-files --eol manifests/*.yaml` 输出 LF | C3 |

### 4.2 Out-of-Scope（明确不做 — 防 scope creep）

来自 ASSUMPTIONS § 六.3：

- ❌ 任何 installer 实装（→ phase 1.2）
- ❌ DAG resolver 实现（→ phase 1.3）
- ❌ Cross-OS CI 矩阵的 npx `cmd /c` wrapper 测试（→ phase 1.2，本 phase 仅落 CI 骨架）
- ❌ `harnessed setup` / `doctor` / `audit` 命令实装（→ phase 1.3）
- ❌ 任何真实 install / verify 命令执行（→ phase 1.2+）
- ❌ 9 上游 manifest **所有字段精准填写** — 本 phase 仅 dry-run 验证 schema 充分性，所有上游 manifest 在 phase 1.2 装 installer 时一并精化

---

## 5. 风险登记（phase 内）

| ID | 风险 | 概率 | 影响 | 缓解 |
|----|------|------|------|------|
| **PR1** | T7 9 上游 dry-run 发现 ADR 0001 缺字段 | 中 | 中 | T7.10 显式纳入 task；如发现缺字段 → STOP T8，先出 ADR 0003 errata（patch）或 inplace v1 update（仅 add field，不 break）。绝不在 phase 1.1 内打破 schema v1 冻结约束 |
| **PR2** | Windows native CI 三平台中第一次跑 fail（CRLF / shebang / pnpm symlink 边界） | 中 | 中 | T1.2 .gitattributes Day 1 落地；ADR 0002 选 tsup 自动 chmod；T10.1 实测前在本地 Windows 跑一遍 |
| **PR3** | TypeBox v0.34 LTS 与 Ajv 8.17 discriminator + oneOf 集成出 corner case | 低 | 中 | GA-1 § 关键代码模式已验证可行（Fastify / Elysia 80M+ 同模式），失败时 fallback 到纯 `*.schema.json` 手写（GA-1 § Fallback） |
| **PR4** | 50+ 测试目标在 2.5 工作日内不可达 | 低 | 中 | 测试矩阵已分解（17 + 14 + 4 + 5 + 5 ≈ 45 + benchmark + line-num + workflow + routing），覆盖 ≥ 50 自然达成 |
| **PR5** | yaml CST `range` → 行号映射在 nested object 失精 | 中 | 中 | GA-1 § 关键代码模式给出 `locateLineFromCST(doc, instancePath)` 实现示意；T8.5 ≥ 5 行号 assertion 直接逼出 bug |
| **PR6** | git autocrlf 在 Windows 已配置过的开发机上 override .gitattributes | 低 | 中 | T1.2 后立即 `git add --renormalize .` 触发一次行尾归一；CONTRIBUTING.md 写明 setup 步骤 |
| **PR7** | T9.1 CI 配置错误导致 GitHub Actions 阶段失败 | 低 | 低 | ADR 0002 § CI 矩阵已是 ready-to-use 模板；先在 fork / branch 跑通再 merge |

---

## 6. 完成定义（Definition of Done — 每个 task 必满足）

每个 task ✅ 必满足以下硬约束（除非 task description 明确豁免）：

1. **代码 / 配置 commit 进 git** — 每个 task 至少 1 个 commit，commit message 格式 `phase-1.1: T<N>.<M> <action> (<reason>)`
2. **本地通过相关命令** — 比如 T2.x 完成后 `pnpm typecheck && pnpm lint` 必须 0 错误
3. **task_plan.md 同步勾选 + progress.md 追加一行**
4. **决策来源标注** — task action / commit message 必须引用对应 ADR / GA / spec § 章节
5. **如发现意外 / 决策修订 → progress.md § B 追加** — 不允许悄悄 work around

Phase 1.1 整体 done 必须满足 § 4.1 全部 8 条 acceptance bar。

---

## 7. 与 phase 1.2-1.4 的接口契约

phase 1.1 deliver 的接口（phase 1.2+ 直接消费，禁止重写）：

| 接口 | 文件 | 消费者 |
|------|------|-------|
| `validateManifestFile(yaml, filename)` | `src/manifest/validate.ts` | phase 1.2 installer 装载 manifest 时入口校验 |
| `Manifest` TS type | `src/manifest/types.ts` | phase 1.2 installer 类型签名；phase 1.3 doctor 反向索引 |
| `schemas/manifest.v1.schema.json` | 仓库根 schemas/ | phase 1.2+ 编辑器 yaml 插件 + 第三方扩展校验 |
| `schemas/workflow.v1.schema.json` | 仓库根 schemas/ | phase 1.4 workflows/research/SKILL.md frontmatter 校验 |
| `schemas/routing.v1.schema.json` | 仓库根 schemas/ | phase 1.4 routing/search.md frontmatter 校验 |
| 4 层目录结构 | repo root | 所有后续 phase |
| `package.json` scripts | 仓库根 | 所有后续 phase 默认走 `pnpm <script>` |
| Ajv + TypeBox + yaml + execa + commander 等 runtime deps | `package.json` | phase 1.2 installer 直接 import |

---

## 8. 下一步

1. ✅ 本 PLAN.md 创建（GSD 视角）
2. ✅ task_plan.md 创建（planning-with-files 主计划，可勾选）
3. ✅ progress.md 初始空跟踪
4. ✅ progress.md § B 初始空发现记录
5. ⏳ **进入 GSD `/gsd-execute-phase 1.1`**：按 task_plan.md 顺序执行；每个子任务用 `/ralph-loop` 包裹保证 COMPLETE
6. ⏳ phase 1.1 done 后 → `/gsd-discuss-phase 1.2`（cross-OS CI + cli-npm + mcp-stdio installer）

---

## 9. 关注点 — 给 plan-checker 的 verify hint

1. **决策回溯链路完整**：每个 task 必引用 ADR 0001/0002 或 GA-1/GA-2 或 SPEC § / ASSUMPTIONS callout — 缺引用即 reject
2. **5 项 ASSUMPTIONS callout 全部覆盖**：
   - GA-1/GA-2 落 ADR ✅（authority_documents 引用 ADR 0001/0002）
   - C2 ✅（T7.1-T7.10）
   - C6 ✅（T8.1 + T8.8 acceptance bar A1/A2）
   - B7 ✅（T6.1）
   - C3 ✅（T1.2）
3. **依赖图无遗漏**：T7.10 是条件性反哺节点，不能跳过 — 即使 9 上游全 pass 也要 log 一条 finding
4. **A1-A8 acceptance bar 必须能用 single command 验证**：避免"测试通过 == 验收"模糊语义
5. **out-of-scope 严格遵守**：任何 installer / DAG / setup 实装 = scope creep，立即拒绝
6. **task 粒度合理性**：T3.4（6 个 install method）颗粒度可在执行期再拆，但 plan 不必预拆（< 30 min/method）
