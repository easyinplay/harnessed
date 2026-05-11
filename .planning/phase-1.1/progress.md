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

- ⏳ **A1** `pnpm test` ≥ 50 测试 passed
- ⏳ **A2** ctx7 manifest 在正向测试中 pass
- ⏳ **A3** ≥ 35 个负向测试 + 行号 assertion 全绿
- ⏳ **A4** GitHub Actions mac/linux/win × Node 22 全绿
- ⏳ **A5** `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` exit 0
- ⏳ **A6** vitest bench 100 manifest < 50ms
- ⏳ **A7** ADR 0001 / 0002 主体未被 phase 1.1 修改
- ⏳ **A8** `git ls-files --eol manifests/*.yaml` 输出 LF

### A.3 Wave 进度概览

| Wave | 内容 | Tasks | 状态 |
|------|------|-------|------|
| 1 | 仓库骨架与工具链 | T1 + T2 | ✅ 完成（batch 1 = T1.1/1.2/1.3-partial/2.1-2.6 共 9 子任务；batch 1.5 = T1.3 完整 + T1.4 LICENSE/NOTICE + T1.5 per-dir READMEs 共 3 子任务） |
| 2 | Schema 实现与 validator | T3 + T4 | ⏳ 未开始 |
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
