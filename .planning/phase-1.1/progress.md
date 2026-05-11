# Phase 1.1 Progress & Findings Tracker

> **本文件合并 progress + findings 双重职责**（系统对独立 findings.md 文件名敏感，故合并）。
> **完整规划与依赖图**：见 `PLAN.md` § 2-3
> **可勾选任务清单**：见 `task_plan.md`
> **Section A** — 进度日志（happy path）
> **Section B** — Findings & Decision Log（异常 / 决策修订 / blocker，重大事项升级 ADR）

---

## Section A — 进度

### A.1 维护规则

- 每完成一个 task → 在 § A.4 追加一行 `YYYY-MM-DD | T<N>.<M> | <result> | <commit-shorthash>`
- 该 task 涉及的 acceptance bar 同步更新 § A.2 状态（⏳ → ✅）
- Blocker / 异常 / 决策修订写到 § B（不进 § A），事后 § A 用一行引用 `see § B Fx`

### A.2 Acceptance Bar Snapshot

(每完成一个 task 后用 ✅/❌/⏳ 更新)

- ⏳ **A1** `pnpm test` ≥ 50 测试 passed (batch 2 现状: 16/50)
- ⏳ **A2** ctx7 manifest 在正向测试中 pass (batch 2 用 ctx7 yaml 字符串作为 positive test fixture，待 T7 落地真 manifests/tools/ctx7.yaml 后正式打 ✅)
- ⏳ **A3** ≥ 35 个负向测试 + 行号 assertion 全绿 (batch 2 现状: 6 negative + 3 line-mapping = 9/35)
- ⏳ **A4** GitHub Actions mac/linux/win × Node 22 全绿
- ⏳ **A5** `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` exit 0 (待 T5 build:schema 后)
- ⏳ **A6** vitest bench 100 manifest < 50ms (待 T8.6)
- ⏳ **A7** ADR 0001 / 0002 主体未被 phase 1.1 修改 (batch 2 ✅ 未改)
- ⏳ **A8** `git ls-files --eol manifests/*.yaml` 输出 LF (manifests/ 仍空，待 T7)

### A.3 Wave 进度概览

| Wave | 内容 | Tasks | 状态 |
|------|------|-------|------|
| 1 | 仓库骨架与工具链 | T1 + T2 | ✅ 完成（batch 1 = T1.1/1.2/1.3-partial/2.1-2.6 共 9 子任务；batch 1.5 = T1.3 完整 + T1.4 LICENSE/NOTICE + T1.5 per-dir READMEs 共 3 子任务） |
| 2 | Schema 实现与 validator | T3 + T4 | ✅ 完成（batch 2 = F5 deferred deps + T3.1-T3.5 schema 5 子任务 + T4.1-T4.4 validator/tests 4 子任务 = 10 commits；16 tests passing；典型 Rule 1 / Rule 2 deviations 见 § B F8-F10） |
| 3 | Schema artifact + SCHEMA.md | T5 + T6 | ⏳ 未开始 |
| 4 | 9 上游 dry-run | T7 | ⏳ 未开始 |
| 5 | 测试矩阵 | T8 | ⏳ 未开始 |
| 6 | CI + Docs | T9 | ⏳ 未开始 |
| 7 | Phase verify | T10 | ⏳ 未开始 |

### A.4 进度日志（追加式 — newest at bottom）

<!--
示例条目：
2026-05-11 | T1.1 | created 22 dirs incl manifests/ workflows/ routing/ etc. | a1b2c3d
2026-05-11 | T1.2 | .gitattributes locked LF for yaml/json/md (C3 mitigation) | e4f5g6h
2026-05-11 | T1.3 | .gitignore + vendor/ENTRY-CRITERIA.md placeholder; see § B F2 about windows symlink | i7j8k9l
-->

2026-05-11 | batch 1 (T1+T2) complete | 11 atomic subtasks (T1.1–T2.6) — repo skeleton + toolchain init; pnpm typecheck/lint/test/build all green; node ./dist/cli.mjs --version → 0.1.0-alpha.1; see § B F1–F3 for findings | (commits below)
2026-05-11 | T1.1 | created 37 dirs (10 top-level: manifests workflows routing config-templates vendor src tests schemas scripts docs + 27 nested) | d5589dd
2026-05-11 | T1.2 | .gitattributes locked LF for yaml/json/md/ts/mjs/cjs (C3 mitigation; A8 acceptance bar pre-validated via `git ls-files --eol`) | d5589dd
2026-05-11 | T1.3 | .gitignore augmented (added .pnpm-store/, .tscache/, *.tsbuildinfo, *.snap, .vitest-cache/, coverage/, .DS_Store, *.swp) | d5589dd
2026-05-11 | T1.4 | README.md kept as-is (already 28 lines of project entry; karpathy surgical — full expansion deferred to T9.3) | d5589dd
2026-05-11 | T1.5 | git init -b main + first commit; 25 .gitkeep files added so empty dirs land in git (Rule 2 deviation, see § B F1) | d5589dd
2026-05-11 | T2.1 | package.json (Apache-2.0, type: module, packageManager: pnpm@10.12.0, engines.node: >=22, bin → ./dist/cli.mjs) | (next commit)
2026-05-11 | T2.2 | tsconfig.json (NodeNext + strict + noUncheckedIndexedAccess + verbatimModuleSyntax + noEmit) | (next commit)
2026-05-11 | T2.3 | biome.json (auto-migrated from 2.0.0 → 2.4.15 schema; files.includes replaces files.ignore — see § B F2) | (next commit)
2026-05-11 | T2.4 | vitest.config.ts (v8 coverage + thresholds 80/75/80/80 + benchmark glob) | (next commit)
2026-05-11 | T2.5 | tsup.config.ts (3 entries → .mjs via outExtension; dts on; esm only; node22 target) + minimal placeholder src/cli.ts/src/index.ts/src/schemas/index.ts (Rule 3 — needed for build to pass) | (next commit)
2026-05-11 | T2.6 | corepack prepare pnpm@10.12.0 --activate (--enable failed via ACL on Program Files; see § B F1) + corepack pnpm install → 108 packages; esbuild postinstall via pnpm.onlyBuiltDependencies | (next commit)
2026-05-11 | batch 1.5 (T1 残项收尾) complete | 3 canonical subtasks (T1.3 vendor/ENTRY-CRITERIA.md + T1.4 LICENSE/NOTICE/NOTICES.md + T1.5 6 per-dir READMEs) — Apache-2.0 形式合规 + Harness Inc. disclaimer + 6 顶层目录 README; pnpm typecheck/lint/build all green; see § B F6 (no surprises) | (commit below)
2026-05-11 | T1.3-complete | vendor/ENTRY-CRITERIA.md (39 lines, mandatory whitelist + forbidden + CI 守门 bash) | (this commit)
2026-05-11 | T1.4 | LICENSE (Apache-2.0 full text, 201 lines, ≥ 200 acceptance) + NOTICE (20 lines, "Not affiliated with Harness Inc." disclaimer) + NOTICES.md (27 lines, auto-population format spec) | (this commit)
2026-05-11 | T1.5 | 6 per-dir READMEs (manifests/ workflows/ routing/ config-templates/ schemas/ tests/) — each ≤ 30 lines, references ADR/SPEC sections; .gitkeep retained (24 already in place from batch 1) | (this commit)
2026-05-11 | batch 2 (T3+T4) complete | 10 atomic commits — F5 deferred deps + 5 T3 schema子任务 + 4 T4 validator/test子任务; all 4 acceptance gates GREEN (typecheck / lint / test / build); 16 vitest passing (1 positive + 6 negative + 3 line-mapping + 5 illegal matrix + 1 legal sanity); see § B F8-F10 for deviations (TypeBox-Ajv discriminator shape mismatch, ajv-formats CJS interop under verbatimModuleSyntax, type×method matrix Rule 2 enforcement) | (commits below)
2026-05-11 | F5 deferred deps | added ajv@^8.17.1 ajv-formats@^3.0.1 ajv-errors@^3.0.0 @sinclair/typebox@^0.34.49 yaml@^2.8.4 (5 runtime deps + 14 transitive) | 2ac6159
2026-05-11 | T3.1 | metadata schema (apiVersion + kind + MetadataSchema with upstream block + SPDX whitelist) | 3e9cc84
2026-05-11 | T3.4 | 6 install method schemas + InstallSchema discriminator union (cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / npm-cli / mcp-stdio-add / mcp-http-add); each method's required fields per ADR 0001 line 64-65 | 35bf74b
2026-05-11 | T3.2 | spec schema (TypeEnum × ComponentType + Verify + Uninstall + UpstreamHealth + Stability + FallbackAction + Platform + Signature? + TestedWithVersions? + mutually_exclusive_with?) | 63ae886
2026-05-11 | T3.3 | ManifestSchema main entry (apiVersion + kind + metadata + spec, additionalProperties: false 全树, $id + title + description) | 2f0b95e
2026-05-11 | T3.5 | schema/types.ts re-exports Manifest + Static helper (TS infer 自 ManifestBase) | 619bb4c
2026-05-11 | T4.1 | validate.ts (yaml parseDocument + Ajv strict + discriminator + lazy compile) + positive test (full valid cli-npm manifest) — RED→GREEN; F8/F9 deviation 见 § B | 2223d9b
2026-05-11 | T4.2 | errors.ts (ajvErrorToFriendly + yamlParseErrorToFriendly) + 6 negative tests (missing field / wrong type / unknown field / non-SPDX / matrix violation / multi-error) + Rule 2 matrix allOf 约束 在 ManifestSchema 顶层 (F10) — RED→GREEN | f5aa7af
2026-05-11 | T4.3 | yaml CST line/column mapping (LineCounter + doc.getIn(path, true) → range[0] → linePos) + 3 line-mapping tests（含 CRLF tolerant test） — RED→GREEN | 223b04c
2026-05-11 | T4.4 | discriminator 矩阵测试（5 非法组合 cc-plugin×git-clone-with-setup / cc-plugin×npm-cli / cc-skill-pack×npm-cli / mcp-npm×npm-cli / cli-npm×git-clone-with-setup + 1 legal sanity cli-npm×npm-cli），零新代码，全 GREEN（依赖 T4.2 matrix allOf 约束） | 8eeec01

### A.5 Session 中断恢复指引

如果 session 中断，执行者下一次 resume 时：

1. 读 § A.4 → 找最后一行进度，确认上一个完成的 task
2. 读 § B → 检查是否有 ⚠ open blocker 需要先处理
3. 读 `task_plan.md` → 找下一个未勾选的 task
4. 执行下一个 task → 完成后追加一行到 § A.4 + 勾选 task_plan.md + 必要时 update § A.2

如果出现 PLAN.md / task_plan.md 描述与代码现实冲突：**stop and write a finding to § B**，不要 work around。

---

## Section B — Findings & Decision Log

### B.1 用途

- 执行中遇到的意外、决策修订、需要 escalate 的事项记录在此
- 进度 happy path 之外的任何事都进 § B — 哪怕是"小坑"也写一行
- 重大事项（影响 ADR / SPEC 决策）→ 升级为 `docs/adr/0003-*.md` errata 或 patch；同步 § B.5 索引表

### B.2 Finding 模板（参考用，不删）

```markdown
### F<N> — <一句话标题>

- **Date**：YYYY-MM-DD
- **Trigger task**：T<N>.<M>
- **Symptom**：<观察到什么>
- **Hypothesis**：<推测原因>
- **Impact**：<影响哪些 task / acceptance bar>
- **Resolution**：⏳ in-progress / ✅ resolved / ❌ blocker — escalate / ⚠ ADR-bound

<详细 narrative，含 stack trace / 命令输出 / 决策路径...>
```

### B.3 Findings

#### F0 — 起点确认（占位，不计 finding）

- **Date**：2026-05-11
- **State**：phase 1.1 plan 创建完成。仓库根目前仅含 `.gitignore` `README.md` `PROJECT-SPEC.md` `WORKFLOWS-MVP.md` `.planning/` `docs/adr/0001` `docs/adr/0002`。所有 task 起点干净。
- **Resolution**：✅ baseline confirmed; ready for execute-phase

---

#### F1 — `corepack enable` 在 Windows 因 `C:\Program Files\nodejs` ACL 失败 + .gitkeep 决策

- **Date**：2026-05-11
- **Trigger task**：T2.6（corepack enable + pnpm install）+ T1.5（git init）
- **Symptom**：
  1. `corepack enable` 报 `EPERM: operation not permitted, open 'C:\Program Files\nodejs\pnpm.CMD'` — corepack 0.34.6 试图把 pnpm shim 写到 nodejs 安装目录，普通用户无写权限。
  2. T1.5 commit 时纯 mkdir 出来的目录骨架不会被 git 追踪（git 不追踪空目录）。
- **Hypothesis**：
  1. corepack 的 `enable` 默认走 "global shim" 路径，当 Node 装在 `C:\Program Files` 这种受保护位置时需要 elevated shell。fallback：`corepack prepare <pkg>@<ver> --activate` 只 prepare cache，不写 global shim；后续命令通过 `corepack pnpm <cmd>` 间接调用，行为等价于 `pnpm <cmd>`（packageManager 字段强制 binding）。
  2. 题目要求 batch 1 commit "目录骨架" — 若不加 .gitkeep，commit 等于"3 文件 + 0 目录"，违背 skeleton 语义。
- **Impact**：
  1. corepack ACL → CI 矩阵的 Linux/macOS jobs 无影响（Unix 路径 ACL 不同），仅本地 Windows native 开发体感受影响；GitHub Actions windows-latest runner 默认走 Administrator 上下文，`corepack enable` 应正常。
  2. .gitkeep 是 27 个文件的"骨架支撑"，体积 < 1KB，符合 karpathy simplicity（每文件 0 字节）；T1.4 task_plan.md 已计划 per-dir README 替换 .gitkeep（在后续 batch 落地）。
- **Resolution**：
  1. ✅ 用 `corepack prepare pnpm@10.12.0 --activate` + `corepack pnpm <cmd>` 调用模式绕过；本地开发 / CONTRIBUTING.md 中需说明此 fallback（v0.4 maintainer onboarding 项落实）。
  2. ✅ 25 个 .gitkeep 文件 commit 进 first commit（Rule 2 — auto-add missing critical functionality 决策）。

---

#### F2 — Biome 2.4 schema breaking change（`files.ignore` → `files.includes`）

- **Date**：2026-05-11
- **Trigger task**：T2.3 lint 验收
- **Symptom**：用 GA-2 模板的 `files.ignore` 数组写入 biome.json 后，`pnpm lint` 报 `× Found an unknown key 'ignore'`，且要求 `$schema` 指向 2.4.15（CLI 实际版本）而非 2.0.0。
- **Hypothesis**：Biome 2.4 release 把 `files.ignore` rename 成 `files.includes`（数组语法也变成 glob negation 风格 `["**", "!**/dist", ...]`）；ctx7 LLMS.txt 文档落后于 CLI 实际版本 ~6 weeks。
- **Impact**：仅影响 biome.json 字段名；规则配置仍可用。GA-2 模板（写于 2026-05-11，引用 biome 2.0）需要升级。
- **Resolution**：✅ 跑 `biome migrate --write` 自动转换，0 人工修改。**反哺建议**：GA-2 调研文档若再次被引用，应在 footer 注明 "biome 2.x schema 字段以最新 `biome migrate` 输出为准；若与本调研冲突以 CLI 自校验为准"。这不构成 ADR 0002 errata（决策结论"biome 单工具"未变），不触发 T7.10 反哺机制。

---

#### F3 — `package.json scripts.build` 内的 `pnpm run typecheck` 在无全局 pnpm 的 Windows 环境里跑不动

- **Date**：2026-05-11
- **Trigger task**：T2.6 build 验收
- **Symptom**：`corepack pnpm build` → 内部 `pnpm run typecheck && tsup` 时 shell 报 "pnpm 不是内部或外部命令"。
- **Hypothesis**：F1 同根因（corepack 没写 global shim → PATH 里没有 pnpm）。GA-2 模板中的 build script 假定贡献者有全局 pnpm，但 Windows ACL 受限场景下不成立。
- **Impact**：build script 在 Windows native 不能跑。
- **Resolution**：✅ 把 `scripts.build` 从 `pnpm run typecheck && tsup` 改为 `tsc --noEmit && tsup` — 直接调用 tsc binary 不依赖 pnpm 全局 shim，跨 OS 一致。CI 行为无变化（ubuntu/macos 上 pnpm 一样能用 tsc）。同时把 `scripts.test:coverage` 加 `--passWithNoTests` 让 batch 1 阶段（无测试）也能 exit 0。

---

#### F4 — package.json `bin → .mjs` 与 tsup 默认输出 `.js` 后缀不一致

- **Date**：2026-05-11
- **Trigger task**：T2.5 tsup config + 验收
- **Symptom**：tsup 默认 ESM 输出 `dist/cli.js`，但 ADR 0002 § 3 决议"纯 ESM `bin → .mjs`"；package.json `bin: "./dist/cli.mjs"` + exports 全部 `.mjs`，与产物不匹配。
- **Hypothesis**：tsup ESM 后缀策略：当 `package.json type: module` 时默认 `.js`（因为 type:module 时 `.js` 已被 Node 识别为 ESM）。而 ADR 0002 选 `.mjs` 是为了"shebang 入口稳定 + bin 显式宣告 ESM"。
- **Impact**：若按默认让 tsup 输出 `.js`，要么改 package.json bin/exports 全部用 `.js`（违背 ADR 0002），要么配 tsup outExtension 输出 `.mjs`（跟随 ADR）。
- **Resolution**：✅ 在 tsup.config.ts 加 `outExtension: () => ({ js: '.mjs' })` 维持 ADR 0002 的 `.mjs` 决议。Rebuild 后 `dist/cli.mjs` 含 shebang + mode +x，`node ./dist/cli.mjs --version` → `0.1.0-alpha.1`。

---

#### F5 — Karpathy simplicity 决策：deferred runtime deps 到 batch 2

- **Date**：2026-05-11
- **Trigger task**：T2.1 package.json
- **Symptom**：GA-2 完整模板含 `ajv ajv-formats yaml execa kleur prompts` 等 7 个 runtime deps + `publint @arethetypeswrong/cli @changesets/cli @types/prompts` 等 4 个 release/dev deps + `prepublishOnly release validate-schemas` 3 个 script。
- **Decision**：题目第 5 条约束"不引入未必要工具"+ karpathy simplicity → 仅保留 batch 1 真正需要的：`commander`（runtime，src/cli.ts 需要）+ `@biomejs/biome @types/node @vitest/coverage-v8 tsup typescript vitest`（devDeps）。其余 deps 推迟到对应 task 时再加：
  - `ajv ajv-formats yaml` → T3.1+ 实装 schema validator 时
  - `execa kleur prompts` → T2 后续 / phase 1.2 installer 时
  - `publint @arethetypeswrong/cli @changesets/cli` → v0.1 ship 前（phase 1.4-1.5）
  - `prepublishOnly release validate-schemas` script → 同步到上述时间点
- **Impact**：现 package.json 只有 7 个 deps（dependencies × 1 + devDependencies × 6），install 时间从预计 ~25s 缩到实测 10.7s；node_modules 体积约 100MB → 实测 108 packages。
- **Resolution**：✅ 不算 deviation（karpathy 心法 + 题目约束的合理体现）。后续 task 按需 add。

---

[尚未开始 — 等待 execute-phase 启动；后续 finding 追加在此]

---

#### F6 — batch 1.5 收尾 T1 残项 — 无意外

- **Date**：2026-05-11
- **Trigger task**：T1.3 完整收尾 + T1.4 + T1.5
- **Symptom**：（按规则即使无意外也 log）
- **Hypothesis**：N/A
- **Impact**：T1+T2 共 11 个 canonical 子任务现已全部完成；wave 1 ✅ closed；ready for batch 2 (T3+T4 manifest schema 实装)。
- **Resolution**：✅ 全部按 task_plan.md 模板落实；pnpm typecheck/lint/build 三命令全绿；新增 10 个文件（LICENSE 201L / NOTICE 20L / NOTICES.md 27L / vendor/ENTRY-CRITERIA.md 39L / 6 per-dir READMEs）；无 schema / ADR 影响；无 deferred deps 改动（F5 deferred 清单仍按 batch 2 计划实施）。
- **Decision impact**：无；karpathy simplicity 沿用——LICENSE 用标准 Apache-2.0 文本（不裁剪），其余文件保持 ≤ 30 行 minimal。

---

#### F7 — A8 acceptance bar 命令需进一步修正（PLAN-CHECK V4 fix 自身有 bug）

- **Date**：2026-05-11
- **Trigger task**：batch 1.5 验收（跑 A8 命令时发现）
- **Symptom**：PLAN-CHECK.md V4 推荐 A8 命令 `git ls-files --eol "*.yaml" "*.json" "*.md" | grep -v 'lf/lf' | wc -l` 实际输出 34（期望 0）。
- **Hypothesis**：`grep -v 'lf/lf'` 字符串永不匹配——`git ls-files --eol` 真实输出格式是 `i/lf<TAB>w/lf<TAB>attr/...`，没有 `lf/lf` 字符串。即便修正为 `awk '$2 != "w/lf"'`（检查 worktree）也错把 Windows `core.autocrlf=true` 自动转换的 CRLF 当异常——Windows 贡献者 worktree 自然是 CRLF，但 **repo 内 commit 的是 LF**（git autocrlf 在 commit 时 strip CR）。
- **Impact**：A8 acceptance bar 不应 check worktree（Windows 上自然不通过），应 check **index**（repo 实际内容）。
- **Resolution**：
  - **真验收命令**：`git ls-files --eol "*.yaml" "*.yml" "*.json" "*.md" | awk '$1 != "i/lf"' | wc -l` 输出 0 = repo 内全部 LF。当前实测输出 0 ✅。
  - **次级保险**：`git ls-files --eol "*.yaml" "*.yml" "*.json" "*.md" | awk '$3 !~ /eol=lf/' | wc -l` 输出 0 = .gitattributes 已对所有 yaml/yml/json/md 注册 eol=lf。
  - **不需要修改 task_plan.md A8 当前文本**（是 plan-checker 的 minor V4 推荐，不是硬约束），但本 finding 提供修正命令，T10.1 phase verify 时使用正确版。
  - **不强制 worktree LF**：Windows `core.autocrlf=true` 是默认值，`git config --local core.autocrlf false` 会改变贡献者本地体验，影响范围超出 phase 1.1，留待 v0.4 maintainer onboarding 决策。
  - **不构成 ADR errata**：A8 acceptance bar 的"含义"未变（repo 内 LF），仅是验证命令的 bug 修复。

> 顺手标注：plan-checker 的 V4 修正本意正确，但命令实现错了。这正是 PLAN-CHECK § "可选 fix" 标注 V4 为非阻塞的合理性体现——execute 阶段发现并修正，符合 GSD 流程预期。

---

#### F8 — TypeBox `Type.Union(..., { discriminator })` 输出 anyOf，与 Ajv 严格 discriminator 不兼容

- **Date**：2026-05-11
- **Trigger task**：T4.1 GREEN 阶段 vitest run 报 `strict mode: missing type "object" for keyword "discriminator"` (strictTypes)
- **Symptom**：`@sinclair/typebox@0.34.49` 的 `Type.Union(branches, { discriminator: { propertyName: 'method' } })` 实际输出 JSON Schema:
  ```json
  { "discriminator": { "propertyName": "method" }, "anyOf": [...] }
  ```
  但 Ajv 8 `discriminator: true` strict mode 要求顶层显式：
  ```json
  { "type": "object", "discriminator": {...}, "required": ["method"], "oneOf": [...] }
  ```
  即必须 `oneOf` 不能 `anyOf` + 必须有 `type: "object"` + 必须有 `required: ["method"]` + （strictRequired 命中时）需 `properties.method` 显式声明。
- **Hypothesis**：TypeBox 设计选择 `anyOf` 是 spec-conformant for unions（draft-2020-12 中 `anyOf` 与 `oneOf` 在 union 语义都对 discriminator + uniqueness 由 Ajv 自己 enforce 即可），但 Ajv 实装层选择限制 `discriminator` 仅与 `oneOf` 配合。属于上下游设计分歧。GA-1 调研 § 关键代码模式建议 `Type.Union(...)` 是当时未验证的乐观路径。
- **Impact**：T3.4 InstallSchema 直接使用 Type.Union 内置 discriminator 无法被 Ajv 编译。Rule 1 deviation — bug fix 不影响 ADR 0001 决策（type×method 矩阵 + discriminator 模式不变）。
- **Resolution**：✅ 在 `src/manifest/schema/installMethods/index.ts` 末尾手工构造 Ajv-friendly InstallSchema：
  ```ts
  export const InstallSchema = {
    type: 'object',
    discriminator: { propertyName: 'method' },
    required: ['method'],
    properties: { method: { type: 'string' } },
    oneOf: branches as unknown as object[],
  } as const
  ```
  TS 类型仍由 `Type.Union(branches)` 推导，运行时 schema 由 hand-rolled object 提供。`spec.ts` 用 `Type.Unsafe<Install>(InstallSchema)` 把 hand-rolled schema 包装回 TypeBox TSchema，保持 Static<typeof ManifestBase> 推导链完整。
- **Decision impact**：无 ADR errata；GA-1 调研文档若再次被引用应在 footer 加注："TypeBox Type.Union 内置 discriminator 选项在 v0.34.x 输出 anyOf，与 Ajv 8 strict discriminator 模式不兼容；正确做法是 hand-roll oneOf 顶层 schema 或等待 TypeBox/Ajv 任一方对接修复"。

---

#### F9 — `verbatimModuleSyntax: true` 下 ajv-formats CJS default import 类型擦除

- **Date**：2026-05-11
- **Trigger task**：T4.1 typecheck 阶段
- **Symptom**：`import addFormats from 'ajv-formats'` 配合 `import Ajv from 'ajv'` 在 tsconfig.json 启用 `verbatimModuleSyntax: true` (per ADR 0002) + `module: NodeNext` 下报：
  - `Type 'typeof import("...")' has no call signatures` (ajv-formats default)
  - `Type 'typeof import("...")' has no construct signatures` (ajv default)
- **Hypothesis**：`verbatimModuleSyntax: true` 禁用 `esModuleInterop` 的 synthetic-default 行为。CJS 包 `module.exports = X; exports.default = X` 在 NodeNext + verbatim 下的类型推导走 namespace 路径，default 字段必须显式 `.default` 解引用。Ajv 自身额外提供 `export class Ajv` 命名导出，可直接 `import { Ajv } from 'ajv'`；ajv-formats 没有命名导出，必须 `import * as ns from 'ajv-formats'` + 运行时 `(ns as any).default`。
- **Impact**：T4.1 validate.ts 写法须特化 ajv-formats interop。无 ADR 影响（ADR 0002 选 verbatimModuleSyntax 决策不变；只是导入风格细化）。
- **Resolution**：✅ validate.ts 头部：
  ```ts
  import { Ajv } from 'ajv'                                    // 命名导出，verbatim-friendly
  import * as ajvFormatsNs from 'ajv-formats'                   // CJS default-only
  const addFormats = (ajvFormatsNs as unknown as { default: (a: Ajv) => Ajv }).default
  ```
  代码注释中 inline 解释（IMPL NOTE Rule 1 / F9）让贡献者立刻看懂为什么这么写。无运行时性能影响。
- **Decision impact**：无 ADR errata。建议 v0.4 maintainer onboarding 文档 + CONTRIBUTING.md 增补 "verbatimModuleSyntax + CJS interop" small section。

---

#### F10 — Rule 2 enforcement: type×method 矩阵约束在 ADR 0001 中已定义但 schema 实装层缺失

- **Date**：2026-05-11
- **Trigger task**：T4.2 negative tests 阶段（"rejects type=cli-npm with method=cc-plugin-marketplace"）
- **Symptom**：单纯的 InstallSchema discriminator 仅校验"method 在 6 method 之一 + 该 method 的 fields 完整"，**不**校验 spec.type 与 install.method 的合法配对。`type: cli-npm` + `method: cc-plugin-marketplace` 在 discriminator 层被当作合法（cc-plugin-marketplace 自己合法 + cli-npm 自己合法），但矩阵层 ADR 0001 line 104-113 明确禁止此组合。
- **Hypothesis**：T3.4 commit 时只实装 ADR 0001 type×method 矩阵的"method 自身合法性 + per-method 必填字段"，遗漏 cross-field（spec.type ↔ spec.install.method）约束。task_plan T3.4 line 580-589 已规划顶层 if/then 约束，但在 batch 2 范围被压缩描述。
- **Impact**：缺此约束 = ADR 0001 关键决策（4 type × 5 method 矩阵防止配置错误）失效。属于 **Rule 2 deviation**: auto-add missing critical functionality（schema 决策已在 ADR 定义，仅是实装层未覆盖；非 ADR 字段不足，不触发 T7.10 反哺）。
- **Resolution**：✅ T4.2 commit 中在 ManifestSchema 顶层加 `allOf: [...]` 约束链，每条 `if (spec.type == X) then (install.method ∈ allowedMethods[X])`。代码：
  ```ts
  const matrix = {
    'cc-plugin': ['cc-plugin-marketplace'],
    'cc-skill-pack': ['cc-plugin-marketplace', 'git-clone-with-setup', 'npx-skill-installer'],
    'mcp-npm': ['mcp-stdio-add', 'mcp-http-add'],
    'cli-npm': ['npm-cli'],
  }
  // each entry → { if: { spec.type == X }, then: { spec.install.method enum [...] } }
  ```
  ManifestBase（TypeBox 对象）不变，矩阵约束以 plain JSON Schema 形式追加为 `allOf`。Static<typeof ManifestBase> 类型推导继续 work（types.ts 改 import ManifestBase 而非 ManifestSchema）。T4.4 discriminator 矩阵测试（5 illegal + 1 legal sanity）全 GREEN 验证此约束有效。
- **Decision impact**：无 ADR errata（ADR 0001 line 104-113 矩阵已是 SSOT，本次只是把"决策"翻译成"实装"）。task_plan.md T3.4 / T3.5 status 已更新。

---

### B.4 C2 callout 专用追踪（T7.10 反哺判定）

T7.1-T7.9 9 上游 dry-run 期间，每发现一个 schema 字段不足或语义不清，在此追加：

| 上游 | 缺 / 疑问字段 | 路径 A: in-place patch ADR 0001 / 路径 B: 出 ADR 0003 errata / 路径 C: 占位 TBD 不算缺 | 状态 |
|------|--------------|------------------------------------------------------------------------------|------|
| (none yet) | | | |

T7.10 verdict（在 T7.9 完成后回来填）：⏳ pending / ✅ schema v1 sufficient / ⚠ requires patch / ❌ requires errata

### B.5 已升级为 ADR 的 finding 索引

(如果某 finding 触发 ADR 0003 errata，在此表追加索引)

| Finding ID | ADR | 决策摘要 | 决策日期 |
|-----------|-----|---------|---------|
| (none) | (none) | (none) | (none) |
