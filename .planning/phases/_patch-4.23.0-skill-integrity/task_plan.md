# task_plan — 4.23.0 skill 完整性防线(issue #3 严重 + #2 残余 + #3 secondary)

status: ready-to-execute
issue #3(用户实锤自查):harnessed setup 自伤 — Step A 装 28 workflows 在先,Step B 的 skill-pack
(mattpocock `research` / gstack `retro`)在后,扁平 `~/.claude/skills/` last-writer-wins 静默覆盖;
pack 内容无声明(grep manifests 无 research)、无冲突检测、无完整性校验;slash 命令照常存在但引擎
全旁路(no intent / no ledger / no evidence guard),失败与成功不可区分。今日实际冲突集 = {research,
retro},但防线须一般化(pack 上游随时加名字)。外部写入者(skills CLI / gstack setup 脚本)不可拦截
→ 防线只能是 harnessed 侧的 事后校验 + 自愈 + 声明化。
TDD: T1-T4 先测。

## 锁定决策
- D1 排序反转:setup 的 Step A(workflows 安装)移到 Step B(packs)**之后** — harnessed 引擎面
  最后落笔,天然赢得 last-writer;Step A.5/A.6(render/commands)随迁。
- D2 完整性校验三入口(issue req 1):
  - 共享模块 `skillIntegrity.ts`:对 28 个 shipped workflow,校验安装侧 SKILL.md 的
    `harnessed-generated` marker + 与 bundled 源的 sha256(hash 抓保留 marker 的手改);
    三态 ok / foreign(无 marker)/ drifted(有 marker hash 不符)。
  - `harnessed setup` 末尾:全量校验,foreign/drifted → **自愈重装该 workflow** + 醒目报告
    (列出疑似肇事 pack:对照 D3 的声明清单反查);
  - `doctor` 新检查(warn,列名 + fix = 重跑 setup);`status --recover` 顶部同报(引擎面被
    篡改时恢复指引必须先可见)。
- D3 pack 内容声明(issue req 5):skill-pack manifests 增可选 `spec.install.installs_skills: [...]`
  (静态清单,来自上游实测);安装器 post-install 将实际落盘的新 skill 名与声明 diff,未声明的新名
  → warn(检测上游演进);与 harnessed workflow 名集求交 → **安装前预警冲突**(装完 D2 自愈兜底)。
  mattpocock/gstack/gsd/planning-with-files/ui-ux/design-taste/karpathy 七 manifest 按已知上游填清单
  (不求完备,求已知冲突显性)。
- D4 staleness 升级(issue req 3):injectState/bin — mid-flight workflow 的 ledger 无 checkpoint
  活动超阈值(started_at/最后变更 > 24h)→ 措辞升级("stale since <date> — 可能已被旁路;
  `harnessed status --recover` 或 `checkpoint fail` 收尾"),与新鲜 in-flight 视觉区分。
- D5 delivery-contract 文档(issue secondary,req 4):research SKILL(en/zh)spawn 步骤注明
  blocking-Agent 契约 + named/background 必须 file-write 或 SendMessage(to main);role-prompts
  review-team checklist 加 delivery contract 行;teams cleanup 措辞改 "TeamDelete 为权威清理,
  shutdown_request 尽力而为"(en/zh + ralph-loop 相关行)。
- D6 issue #2 残余:核验 auto master SKILL.md 现状 — 4.21/4.22 已内联 step 0 + intent + lite;
  若可执行序列仍以指针形式依赖 commands/auto.md,按其建议 1 加硬前置行("执行前必须 Read 并逐步
  执行 commands/auto.md 的 state-machine;禁止凭理念 freestyle")— 最小改动,不搬正文。
- D7 issues 收尾:两 issue 各回复修复说明(引用版本/commit),#2 关闭(4.21/4.22+本次 D6 覆盖),
  #3 关闭(req 1/2/3/5/6 全覆盖;req "harnessed ignore <name>" 机制按 YAGNI 不做并说明)。

## T1 skillIntegrity 模块 + setup 自愈 [新 lib + setup.ts]
## T2 Step A 后置排序 [setup.ts](D1;既有 setup 测试断言顺序者更新并记录)
## T3 installs_skills 声明 + post-install diff/冲突预警 [schema(可选字段)+ 7 manifests + installers]
   (涉 typebox schema → 必须 build && build:schema 并提交 schemas/,memory 规则)
## T4 staleness 升级 [injectState.ts + bin 双端 parity]
## T5 delivery-contract + D6 文档面 [research SKILL en/zh + role-prompts en/zh + auto SKILL]
## T7 (追加) setup 显示 guard-conflict 警告 [setup.ts]
用户 dogfood:重装 setup 全程看不到 4.22.2 设计 — auto-install 只列带 install_commands 的 warn。
setup 末尾显式打印 checkGuardConflict warn 态(含无豁免口分支的解释行)。

## T8 (追加,REVISED 用户拍板) GateGuard 豁免只保留 env 通道
上游调研实证:最新 ECC(HEAD 4092795)新增 `GATEGUARD_EXEMPT_GLOBS` env 豁免口;
.gateguard.yml 仍为 pip gateguard-ai 专属;最新 ECC 仍无文件名类拦截 pattern。
- 三态:ecc 新版(已装 hook 能力探测含 EXEMPT_GLOBS)→ mergeSettingsEnvKey 写
  `env.GATEGUARD_EXEMPT_GLOBS=".planning/**"`(幂等/confirm 默认 Yes/备份/codex 平台门);
  ecc 旧版 → setup+doctor 提示升级 ecc(+ ECC_GATEGUARD=off 备选);无 GateGuard → pass。
- **4.22.2 的 yml 通道整体移除**(supersede,单一通道降复杂度;CHANGELOG 4.23.0 注明);
  exempt-gateguard CLI 命令名保留、行为换 env 通道。

## T6 收尾:vitest 全量 + tsc + pnpm lint(全域,勿 tail 掩蔽)+ build:schema drift 检查 + gates;
   CHANGELOG `## [4.23.0]` + bump + progress.md;commit 即 push;两 issue 回复+关闭(D7);tag 等确认。
