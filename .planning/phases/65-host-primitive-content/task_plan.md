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

## 台账回来后的裁决(2026-09-24,依据 `inventory.md` 的 4 条 NEEDS_CLARIFICATION)

- **D1 分类规则更正(我原先写错了)**:`A-TPL` 与 `C` 不是互斥子类,而是**正交两轴**——
  「改动手段」(生成器 / 手改)与「粒度」(token / 整段)。生成器 span 内 140 处里有 44 处是 C 语义。
  采纳台账的 `C-TPL` 标法;**后续分工按「面」切,不按类切**,T5/T6 的 44 处重叠随之消失。
- **D2 不渲染面 → 门的 allowlist(文件粒度 + 理由注释),不改措辞**。门要求的「零 CC 原语 token」
  针对**渲染产物**,不是源文件;`judgments/*.yaml` 的 `description`、`workflow.yaml` 的 `name` /
  `description`、被 parser 剥除的行尾注释都进不了模型 prompt(台账已代码实测)。
  **T8 原先「judgments 5 处需接入渲染」的前提作废**,T8 缩小到确实进 prompt 的面。
- **D3 决策编号保留,描述原语化**:`D-11 — Agent Teams 升级…` → `D-11 — {{ host.team }} 升级…`。
  核过 `docs/adr/0028` / `0032` / README:cross-ref 靠编号本身而非全名,改描述不破引用。
  **ADR 正文不动**(CI 有 `adr-NNNN-accepted` 正文守恒门)。这 7 处不进 allowlist。
- **D4 范围扩大(维护者 2026-09-24 拍板:全部纳入)**。SPEC 的 236 处基线只覆盖 9 个工具名 token;
  实测另有 `CC-native` 97 / `teammate` 131 / `AskUserQuestion` 74 / `Claude Code` 64 / `~/.claude/` 13。
  其中 `CC-native Task / Agent tool` 若只换后半句会渲染出 `CC-native spawn_agent tool` 混血句;
  `AskUserQuestion` 在 codex 上不存在(等价物 `request_user_input`,上游有 handler,**但本机默认启用与否未验证**);
  `~/.claude/` 是路径,codex 上不存在。去重后(不少已落在 C 类整段 span 内)预计 450-500 处。

## 任务(按**面**分批;T1-T3 已完成)

| T | 内容 | 主要文件 | 验收 |
|---|---|---|---|
| T1 ✅ | 逐处分类台账(236 处,`inventory.md` 973 行);范围 B 的增量扩写进行中 | `.planning/phases/65-*/inventory.md` | 对账 236 ✓;A 142 / B 27 / C 60 / 待裁 7 → 已裁 |
| T2 ✅ | 渲染表 + 解析器(未知 key / 未知 variant / 缺宿主文本一律抛错) | `src/cli/lib/hostPrimitives.ts`, `workflows/host-primitives*.yaml` | 26 测试;commit `4427aa2` |
| T3 ✅ | 接入 S1 渲染点(次序 capabilities → host)+ **claude 逐字节金标**(en 91 条 / zh 62 条) | `renderSkillTemplates.ts`, `tests/fixtures/render-golden/` | 53 测试;mutation 验证有效;commit `4427aa2` |
| **批 A** | 生成器面:改 6 个 builder + 5 对常量 → 重跑覆盖 span 内 140+ 处 | `scripts/rewrite-skill-invoke-sections.mjs` | 重跑幂等;**claude 金标零差异** |
| **批 B** | inline 面:span 外的 SKILL 正文(A-INLINE 28 + C-INLINE 10 + 范围 B 新增) | `workflows/**/SKILL*.md` | 金标零差异;顺手消除 `deliver/SKILL.md:28-29` 的折行假阳性 |
| **批 C** | yaml 面:`capabilities.yaml` 补 codex 条目(3 capability × impl/cmd)+ `capabilityResolver` 按宿主选 + 扩展 `check-yaml-i18n-parity` 识别 `primitives:` 深层结构 | `workflows/capabilities.yaml`, `capabilityResolver.ts`, `scripts/check-yaml-i18n-parity.mjs` | 单测 + 门绿 |
| **批 D** | S2 命令体按宿主分支(6 处正文字面量);**与批 A 的 `TEAMS_STEP_*` 有 lockstep 关系,须共用同一 key 值**(台账核实中) | `src/cli/lib/generateCommands.ts` | claude 产物逐字节金标 + codex 产物不引用 `~/.claude/*` |
| T8 | S3 运行时 prompt 组装:只处理**确实进 prompt** 的面(D2 后缩小) | `src/cli/prompt.ts`, `src/workflow/run.ts` | claude 组装逐字节不变;codex 组装无 CC 原语 |
| T10 | 映射小节生成(R4) | `src/cli/lib/hostPrimitives.ts` | 标记成对;claude 不插;区间内容快照 |
| T11 | 新门 `scripts/check-host-primitives.mjs` + `.d.mts` + `ci.yml` step + 单测;allowlist = 不渲染面(文件粒度,D2)+ 映射小节区间 | `scripts/`, `.github/workflows/ci.yml`, `tests/scripts/` | 门在当前树绿;故意插一个 CC token 会红 |
| T12 | 同步既有内容门(R9)与 i18n 占位符集合检查(把 `host.*` 纳入 `check-skill-i18n-parity`)。**既有门断言的是源文件原文**,占位符化后会失配 → 改为断言 **claude 渲染后的文本**(语义不变),候选:`skill-invoke-parity`、`headlessTeardown`(`:24-43` 断言 `shut down` / `按名` / `session-scoped`)、`deferrableRelay`(经查与 CC 原语无关,大概率不受影响)、`severityDiscipline`、`rolePromptsMattpocock` | `tests/unit/skill-invoke-parity.test.ts`, `tests/workflow/*.test.ts`, `scripts/check-skill-i18n-parity.mjs` | 单测;改写前先跑这批测试记录基线 |
| T13 | eval golden 覆盖 codex 渲染(至少 1 个 scenario)+ CHANGELOG + SUMMARY | `fixtures/eval/`, `CHANGELOG.md` | `pnpm eval` 绿 |

### 批次排序(文件归属互斥,避免并发写同文件)

- **批 A → 批 B 必须串行**:重跑生成器会整体重写每个 `SKILL*.md`,与批 B 的 inline 编辑写同一批文件。
- **批 C / 批 D 可与批 A 并行**(yaml 面与 TS 面互不相交)。
- **批 D 依赖批 A 的 key 值**(lockstep 文本),两者的 `host.*` key 必须同值 —— 由词表统一供给,不各写各的。
- T10 / T11 / T8 在改写全部落地后做(门要在终态绿)。

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
- codex agent 生命周期实测(F4)→ 若 Phase 66 需要再测;在此之前 codex 侧正文一律写 `TODO(未验证)`,
  不断言 session 作用域 / 自动清理 / 能否嵌套
- `request_user_input` 在本机是否默认启用(未验证)→ codex 侧给工具名但不断言「一定可用」
- ADR 正文(D3)—— 一个字都不动
