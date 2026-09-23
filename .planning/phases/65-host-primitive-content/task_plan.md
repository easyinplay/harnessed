# Phase 65 — 正文宿主原语化(v16.0 / 2,minor)

SPEC:`.planning/specs/2026-09-22-codex-host-parity-v16.md` §「Phase 65」(唯一真相源)
+ 本文件「开工细化」(对 SPEC 的落地修正,依据 `findings.md` 的 F1-F8 实测)。
Status: planned (2026-09-24)

## 开工细化(对 SPEC 的修正,逐条给理由)

- **R1 占位语法改为 `{{ host.<primitive> }}` / `{{ host.<primitive>.<variant> }}`**(SPEC 原写
  `{{spawn_subagent:cc-native}}`)。理由:与既有 `{{ capabilities.<x>.cmd }}` 同族,可直接复用
  `renderSkillBody`(F2)与 `check-skill-i18n-parity` 的占位符集合检查(F7),不新造模板引擎。
  写法纯 ASCII,en 与 zh 文件中**逐字相同**。
- **R2 渲染表 = `workflows/host-primitives.yaml` + `workflows/host-primitives.zh-Hans.yaml`**,
  沿用既有 `<base>.<locale>.yaml` i18n 约定,自动落进 `check-yaml-i18n-parity` 的作用面
  (该门需扩展以识别新结构,见 T7)。
- **R3 粒度自适应,单一机制**:表值既可是短语(`Task / Agent tool`)也可是整段(YAML block scalar)。
  **不引入条件块语法**。C 类「事实在另一宿主不成立」的段落整段入表(F6)。
- **R4 映射小节仅 codex 渲染插入**:`<!-- harnessed:host-map:start -->` … `<!-- harnessed:host-map:end -->`,
  内容为本宿主原语对照(F4 表)+ 一行宿主标记(缓解 F3 的 `~/.agents/skills` 跨工具可见性)。
  **claude 渲染一个字节都不插**,保逐字节金标。
- **R5 B 类不占位符化**:`capabilities.yaml` 的 `impl` / `cmd` 是能力注册事实,改为补 codex 侧条目
  (`impl: codex-platform`,`cmd: spawn_agent` 等),由 `capabilityResolver` 按宿主选。
  **不在本 phase 修** codex `pluginsRegistry: null` 导致的 plugin 类能力全告警(F8,记 TODO)。
- **R6 S2(生成的命令体)纳入范围**:`generateCommands.ts` 按 descriptor 分支产出宿主正文;
  claude 输出**逐字节不变**(golden 锁)。理由见 F1——不做则 phase 目标不闭合。
- **R7 96 处模板句走生成器**:`scripts/rewrite-skill-invoke-sections.mjs` 的 builder 改一次再重跑,
  禁止手改已渲染的 invoke 段(该脚本 `:26-28` 的既有纪律)。
- **R8 codex 文本只用已验证事实**(F4):工具名与参数取自上游 spec;**不写** codex agent 的生命周期承诺
  (未实测)。需要生命周期表述处,改写为不依赖该事实的说法。
- **R9 既有内容门同步**:`tests/unit/skill-invoke-parity.test.ts` 的 `REQUIRED_TOKENS` / `FOOTGUN`
  在占位符化后会失配,必须同步更新(F7),否则本 phase 第一次改动就红。

## 任务(TDD,顺序;T1-T3 是前置,T4 起可分工)

| T | 内容 | 主要文件 | 验收 |
|---|---|---|---|
| T1 | **逐处分类台账**:236 处按 A/B/C 三类标注,列出每处的文件:行、类别、归属占位符或整段 key;产出 `inventory.md` | `.planning/phases/65-*/inventory.md`(NEW) | 计数对账 = 236,无未分类项 |
| T2 | 渲染表 + 解析器:`host-primitives.yaml`(+ zh)、`resolveHostPrimitives()`、占位符替换纯函数(未知 key → 构建期报错,不静默留原文) | `workflows/host-primitives*.yaml`(NEW), `src/cli/lib/hostPrimitives.ts`(NEW) | 单测:命中 / 未知 key 报错 / 变体回退 / locale 选择 |
| T3 | 接入 S1 渲染点(与 capabilities 替换同一处,次序固定并测试) | `src/cli/lib/renderSkillTemplates.ts`, `capabilityResolver.ts` | 单测 + **claude 渲染逐字节金标**(en 与 zh-Hans 各一) |
| T4 | A 类改写:非模板句的散落术语 | `workflows/**/SKILL*.md` | 门绿 + 金标绿 |
| T5 | 模板句改写走生成器(R7):改 builder → 重跑 → diff 复核 96 处 | `scripts/rewrite-skill-invoke-sections.mjs` | 重跑幂等;金标绿 |
| T6 | C 类整段变体入表并替换 | 表 + `workflows/**` | 金标绿;codex 侧无未验证事实断言 |
| T7 | B 类:`capabilities.yaml` 补 codex 条目 + `capabilityResolver` 按宿主选;扩展 `check-yaml-i18n-parity` 识别新表结构 | `workflows/capabilities.yaml`, `src/cli/lib/capabilityResolver.ts`, `scripts/check-yaml-i18n-parity.mjs` | 单测 + 门绿 |
| T8 | S3 运行时 prompt 组装接入宿主原语(role-prompts 10 处 / judgments 5 处的对应面) | `src/cli/prompt.ts`, `src/workflow/run.ts` | 单测:claude 组装结果逐字节不变;codex 组装结果无 CC 原语 token |
| T9 | S2 commands 按宿主分支(R6) | `src/cli/lib/generateCommands.ts` | **claude 产物逐字节金标** + codex 产物路径正确(`~/.agents/skills` / 无 `~/.claude/rules`) |
| T10 | 映射小节生成(R4) | `src/cli/lib/hostPrimitives.ts` | 标记成对;claude 不插;区间内容快照 |
| T11 | 新门 `scripts/check-host-primitives.mjs` + `.d.mts` + `ci.yml` step + 单测;allowlist(B 类注册表条目、映射小节区间) | `scripts/`, `.github/workflows/ci.yml`, `tests/scripts/` | 门在当前树绿;故意插一个 CC token 会红 |
| T12 | 同步既有内容门(R9)与 i18n 占位符集合检查(把 `host.*` 纳入 `check-skill-i18n-parity`) | `tests/unit/skill-invoke-parity.test.ts`, `scripts/check-skill-i18n-parity.mjs` | 单测 |
| T13 | eval golden 覆盖 codex 渲染(至少 1 个 scenario)+ CHANGELOG + SUMMARY | `fixtures/eval/`, `CHANGELOG.md` | `pnpm eval` 绿 |

## 验收(phase 级)

- [ ] `tsc --noEmit` 0;biome 绿;9 个既有 `check-*.mjs` + 新门全绿
- [ ] **claude 侧逐字节金标**:S1 渲染产物(en / zh)、S2 命令体 —— 改写前后零差异
- [ ] codex 渲染产物在映射小节区间外**零 CC 原语 token**(新门断言)
- [ ] `check-skill-i18n-parity` / `check-yaml-i18n-parity` 绿(占位符集合含 `host.*`)
- [ ] 本机 vitest 相关文件绿;CI 三 OS 绿
- [ ] codex 正文不含未验证的 codex 行为断言(R8,人工复核 C 类整段)
- [ ] CHANGELOG `[Unreleased]` + SUMMARY + STATE 指针

## 不做(明确排除)

- codex `pluginsRegistry: null` 的 plugin 能力告警(F8)→ TODOS
- codex `HARNESSED_USER_LANG` 不可写导致的语言指令缺失(F8)→ TODOS
- 废弃 `~/.codex/prompts` 交付面(F5)
- codex agent 生命周期实测(F4)→ 若 Phase 66 需要再测
