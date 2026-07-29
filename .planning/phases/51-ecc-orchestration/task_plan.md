# task_plan — Phase 51 ECC skills 编排:语言感知 verify 路由 + 降级链基建

status: **DOWNGRADED to Approach A, delivered 4.32.23**(2026-07-29 用户裁决)
> T0 代理实测(findings F8)判 TS 面专家无优势 → 用户选「降级 Approach A + 修真 bug」。
> 下方 D1-D8 与 T1-T5 是**未采纳的 B 方案原文**,保留作为回补蓝图(触发条件:用户 rust/go 手测显示专家有语言特有发现,见 TODOS「ECC 语言专家路由是否补机器层」)。
> 实际交付见本目录 `progress.md` 的 4.32.23 节。
上游:design doc APPROVED(`~/.gstack/projects/easyinplay-harnessed/easyi-main-design-20260729-204154.md`,四层审毕 D1-D16)
实证:本目录 `findings.md` F1-F7(ECC 上游三面实拉 / alias 消费链 / 注入链 / expr-eval spike)
版本:4.33.0(minor,新增运行时路由行为)

## 锁定决策(6 个 Open Question 全裁 + 2 条因实证改判)

- **D1 调用面 = agent 面**(OQ1)。上游实拉推翻「skill vs agent」二分:语言 review **skill 面根本不存在**,`ecc:<lang>-review` 是 **command 薄壳**(正文 "Invokes the `<lang>-reviewer` agent")。取 agent 面理由:覆盖无缺口(11 语言 vs command 12 个但缺 typescript/java/swift/php/csharp/fsharp)、命名统一 `<lang>-reviewer`、build-resolver **只有 agent 面**(取 command 面会导致 review/build 两套调用面不一致)。代价:改现有 seeds 名 + `tests/workflow/ecc-wiring.test.ts:82-91` 断言。
- **D2 单火机制 = prompt 侧 alias 解析,零新 judgment yaml**(OQ2,**改判交付物 4:撤销**)。实证:capability 级 `fires_when` **从不被任何 TS 求值**(F4),design doc 假定的 fires_when 路由是死路;真实唯一运行时消费点是 `src/cli/prompt.ts:79-81` `buildToolsSection` 的 `caps[tool]?.cmd`。一个 tool 只出一个 cmd,single-fire(ADR-0034)天然成立。`workflows/judgments/verify-routing.yaml` 不建。
- **D3 语言判定不进 expr-eval**(OQ3,**改判**)。既然 fires_when 不参与,语言集合由 TS resolver 在 prompt 构建时从 git diff 直接推导,不引入 `subtask.languages` fact、不改 gateContext/SubtaskShape。expr-eval spike 结论(候选 a `'rust' in subtask.languages`)与第三类 fail-soft 缺口留档 findings F7,不在本 phase 动。
- **D4 resolver 输出 = 单值 cmd(CC 侧)**(OQ4)。codex 不消费 `harnessed prompt` 注入链,doctor 的 codex 列 display-only(OV#4 原判维持)。
- **D5 首发覆盖 4 语言**:python / rust / go(既有 seeds)+ **typescript**(harnessed 自身语言,唯一可本仓 dogfood 的)。build 侧 rust / go + 通用 `build-error-resolver` 兜底(上游**无** `python-build-resolver`)。扩语言 = 纯 yaml 追加,零 TS 改动。
- **D6 generic tier 不新建资产**(OQ6):base entry 自身即链尾(`code-review` → `/code-review`,`gsd-debug` → `/gsd-debug`),无 ecc 时原样输出,无需独立 role-prompt 文件。doctor 展示层级 = **info**(与 4.32.22 check-ecc 的 pass-informational 一致,缺 ecc 非 warn)。
- **D7 alias 标注只加 `language`,不加 `requires`**(简化 D14):`impl: ecc` 已经是 presence key,再加 `requires: ecc` 是同一事实两处表达。理由写进 ADR;将来出现非 ecc 的 presence-gated alias 再引入。
- **D8 链尾不变式载体** = `scripts/check-workflow-schema.mjs` Step 1 通过分支(`:306-308`,已持有 `capParsed.capabilities`):任何 entry 只要有带 `language` 的 alias,其 base `impl` 必须 != `ecc`。落这里因为它是 capabilities.yaml 唯一 CI 硬失败 gate,C1/C2/C3/K9 契约同住(一事实一个家)。

## 顺手修的真 bug(实证发现,非 scope creep)

- `gsd-debug` 的三个 ecc alias(`workflows/capabilities.yaml:342-344`)`ecc:rust-build` / `ecc:go-build` / `ecc:build-fix` —— **上游三个名全不存在**。真名 `rust-build-resolver` / `go-build-resolver` / `build-error-resolver`。
- `capabilities.yaml:138-141` 注释承诺的 `runtime/priority.yaml` 仲裁器不存在(仓内只有 `workflows/disciplines/priority.yaml`,不做 alias 选择)。本 phase 正是该承诺的兑现,注释须改写为指向真实机制。

## 任务

### T0 代理实测(kill/降级闸,先跑,结论进 progress.md)
本仓无 rust/go 代码,用 **typescript 代理**:对同一份真实 diff 并行跑 `ecc:typescript-reviewer` 与通用 code review,比对专家是否揪出通用漏掉的语言特有问题。判据(design doc Assignment):无肉眼可见优势 → 砍 Phase;仅边际 → 降级 prose 级 Approach A。用户的 rust/go 手测(15 min)仍为独立第二锚点,不阻塞本 T0。

### T1 结构化 probe 抽取(TDD 红先行)
- **新模块** `src/cli/lib/ecc-probe.ts`(**不得**加导出到 `check-ecc.ts` —— 该模块被 `vi.mock` factory 模拟,加导出会让 mocker 拿到 undefined,见 memory `feedback_mock-export-gap-extract-module`)。
- `probeEcc(deps)` 返回结构化态:注册键 `"ecc@ecc"`(值是**数组**)→ 取 `installPath` / `version`;enable 读 `~/.claude/settings.json` 的 `enabledPlugins["ecc@ecc"]`(installed_plugins.json **无** enable 字段);**agent 级命中检测**(OV#5 双层防漂移)= 以 active `installPath` 为根查 `agents/<name>.md` 是否存在。
- 错误表(D10 硬要求,不得 swallow-and-continue):JSON parse 失败 / 文件缺失 / 注册↔cache 分歧 → 一律**视为未安装 + doctor 可见 warn**,每类错误有具名分支与单测。
- `check-ecc.ts` 改为消费 probe(人读 `CheckResult` 不变,保 4.32.22 行为)。

### T2 语言推导器(TDD 红先行)
- `src/cli/lib/detect-languages.ts`:纯函数 `mapExtensionsToLanguages(files): Map<language, count>`(可单测,零 IO)+ `detectChangedLanguages(deps)` 注入 git 调用(`git diff --name-only` + `--cached`)。
- 主导语言 = 文件数最多者;并列 → 按 yaml alias 顺序定序(确定性)。git 失败 / 空 diff → 空集(→ 走 base cmd,fail-soft 方向安全)。

### T3 alias 解析 + 注入接线(TDD 红先行)
- schema:`AliasShape`(`src/workflow/schema/capabilities.ts:31-37`)加 `language: Type.Optional(Type.String())`;CI 镜像 `scripts/check-workflow-schema.mjs:49-52` 同步。**typebox 改动 → `pnpm build && pnpm build:schema` 并提交 `schemas/`**(铁律)。
- `src/cli/lib/resolve-capability-alias.ts`:`resolveAliasCmd(entry, languages, eccPresent)` → cmd。规则:`!eccPresent` → base cmd;否则取 `impl==='ecc' && language ∈ languages` 的主导语言 alias;无命中 → base cmd。
- 接线 `src/cli/prompt.ts:79-81`:仅当该 entry 存在带 `language` 的 alias 时才触发 probe + git 探测(懒执行,避免每次 prompt 都 spawn git);整体 try/catch fail-soft 到 base cmd(与既有 `buildToolsSection` 的 fail-soft 语义一致)。
- capabilities.yaml 改名 + 加标注(code-review 4 条 / gsd-debug rust+go+通用兜底);同步 `tests/workflow/ecc-wiring.test.ts:82-91` 断言;改写 `:138-141` stale 注释。

### T4 gate + doctor + ADR
- `scripts/check-workflow-schema.mjs` 加 D8 链尾不变式断言 + `tests/scripts/check-workflow-schema.test.ts` 覆盖(正例 + 反例)。
- doctor:resolved 路由表(哪些语言 → ecc 专家 / 哪些 → fallback),info 级;codex 列标 display-only。i18n(en + zh)双语文案。
- `docs/adr/00NN-ecc-language-routing.md`:记 D1-D8 + 为什么不是 fires_when(F4 实证)+ 为什么不建 verify-routing.yaml + 链尾不变式 + probe 错误语义。

### T5 收尾
biome 全量 → tsc → `node scripts/check-workflow-schema.mjs` + 其余 gate → vitest `--no-file-parallelism`(权威)→ CHANGELOG 4.33.0 + bump → progress/findings 回填 → commit 即 push;tag 等用户确认。

## 验收(design doc Success Criteria 对齐)

- 装 ecc:verify 阶段 TS/python/rust/go 改动的 tools 段输出对应 `ecc:<lang>-reviewer`,同一 verify 不出现通用 + 专家双审。
- 未装 ecc:同样改动输出 `/code-review`,无报错无硬依赖(降级链铁律)。
- 链尾不变式进 CI gate;resolver/probe/deriver 单测覆盖 presence × 语言 × 多语言并列组合。
- 后续场景接入成本(OV#6 可证伪):build-fix slice 接入 diff ≤ 50 行且不触碰 `src/`(本 phase 的 gsd-debug alias 改名已预留)。
- CI 3-OS 绿;i18n parity ×3;en-default byte-identical。
