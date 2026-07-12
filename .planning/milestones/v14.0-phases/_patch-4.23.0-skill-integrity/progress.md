# progress — _patch-4.23.0-skill-integrity

状态:实施完成,验证序列进行中(fork worker,不 commit 不 push,主 session 验收)。

## 任务状态

- T1 完整性校验(hash 台账 + 四态 + 自愈)— DONE(经 coordinator T1 修正重构)
- T2 setup 顺序反转(Step B → Step A)— DONE(cell 3b 顺序断言)
- T3 manifest `installs_skills` 声明 + 安装器 pre/post 审计 + schema — DONE
- T4 staleness(injectState + bin 双端 STALE)— DONE(bin 手跑两态验证通过)
- T5 delivery-contract 文档(research SKILL en/zh + role-prompts en/zh)— DONE
- T6 CHANGELOG/bump/progress — DONE(本文件)
- T7 setup 末尾 guard-conflict 显式打印(三态 TDD)— DONE
- T8 GateGuard env 通道(修订版:env 唯一,yml 通道移除)— DONE
  (初版多通道设计我曾答复 NEEDS_SPLIT;用户拍板修订为单通道后并入)

## 冲突集实测(比 issue #3 报告多一个)

`node dist/cli.mjs setup --dry-run` 实证扁平安装名:

- research ← mattpocock-skills
- retro ← gstack
- **ship ← gstack**(issue 未报告的第三个;gstack 清单含 `ship`,harnessed `ship` 是 master)

## 关键设计决策 / 偏差声明

1. **完整性基准 = 安装时 hash 台账**(`<stateRoot>/skill-hashes.json`),不比 bundled 源
   — Step A.5 渲染(capability cmd + locale)是唯一合法差异,naive 源比较全量误报。
   保证链:bundled 源 → 安装时渲染 → 台账钉住渲染态 sha256 → 第三方改动偏离台账即被抓。
2. **stale 的版本比较对象是 bundled 源的 marker 版本,不是 package.json**
   — 实测源 marker 固定 `v4.9.3`(scripts/rewrite-skill-invoke-sections 一次性打的,
   不随 release 走);按 coordinator 原文"marker < 当前包版本"实现会永久全量误报 stale
   + 每次 setup 空转自愈。偏差已在模块头注释写明。
3. **五态而非四态**:保留原三态的 `missing`(整目录被删,观测上与 foreign/stale 不同,
   自愈路径相同)。coordinator 四态清单未提 missing,判定为疏漏而非删除指令。
4. **降级环境门**:源 SKILL.md 不可读或无 marker → 该名跳过审计(mock fs 测试环境 /
   partial install 不误报;真实 bundle 源全部带 marker,生产不跳)。
5. **culprit 只标 foreign**:tampered/stale/missing 不指控 pack(证据不支持)。
6. **T8 能力探测 fail-soft 方向 = legacy**:探测不到(registry 缺 / hook 不可读)一律
   按旧版处理(建议升级),绝不盲写 resident hook 会忽略的 env key。
7. **ecc 升级命令实证**:`claude plugin update ecc`(`claude plugin update --help` 核验)。
8. **D6(issue #2 建议 1)核验无需改动**:workflows/auto SKILL.md 已含完整内联 1-6 步
   可执行序列 + "Do NOT improvise" 硬前置(4.21/4.22 成果)。

## 被更新的既有断言(逐条理由)

- `tests/cli/doctor.test.ts` cell 0/1/5:16→17(新增第 17 检查 workflow skill integrity);
  加 sister vi.mock(check-skill-integrity 读真实 skills 目录,全局 fs mock 下会审计垃圾)。
- `tests/cli/doctor-fixtures.test.ts`:16→17 + 名称清单加行 + 同款 vi.mock。
- `tests/cli/check-guard-conflict.test.ts` 4.22.2 variant 三 cell → T8 env 通道四 cell
  (capability/currentValue 探针替代 findYml/readFile;yml 通道随机械移除)。
- `tests/cli/lib/guard-exemption.test.ts` 整文件重写(yml planner/apply/find 测试删除,
  换 env planner/probe/flow 测试)— 原因:被测机械整体被 T8 修订替换。
- `tests/cli/exempt-gateguard.test.ts` 整文件重写(真实 fs .gateguard.yml 场景 →
  factory-mock env 通道;避免测试写宿主真实 settings.json)。
- `tests/cli/checkpoint-start-skeleton.test.ts` 4.22.2 describe → env 通道三 cell;
  guard-exemption factory mock 从 findGateguardYml 换成 probe/read/apply 三导出。
- `tests/cli/setup.test.ts`:runCli 增 console.warn 捕获(T7 块走 warn;对既有 cell
  仅是额外捕获,无断言语义变化);新增 cell 3b(顺序)+ T7 describe(三态)。
- `tests/checkpoint/injectState.test.ts`:新增 STALE 两 cell(既有 cell 未动)。

## 新增文件

- src/cli/lib/skillIntegrity.ts(台账 + 审计 + culprit + report SoT)
- src/cli/lib/check-skill-integrity.ts(doctor 第 17 检查)
- src/installers/lib/packSkillAudit.ts(pre/post 安装审计)
- tests/cli/lib/skillIntegrity.test.ts / tests/installers/packSkillAudit.test.ts

## 验证(最终报告补齐 tally)

- bin STALE 两态手跑:FRESH→mid state-machine / 3d→ENGINE: STALE(通过)
- schema regen:schemas/manifest.v1.schema.json 已更新(installs_skills),随本批提交
