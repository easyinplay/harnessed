# task_plan — 4.24.0 intel gap 补齐(五家对照借鉴,用户授权 follow 更优方案)

status: ready-to-execute
来源:.planning/intel/omc-comparison.md § issue #3/#4/#5 三题对照 + 增补 2(OMC/omo/ECC/comet/Trellis
五家实证)。用户指示:补齐 gap,它们方案更优就 follow。战略层 gate 透明跳过(intel 驱动的增量
加固批次,scope 已定义,非新产品方向)。

## 各候选采纳决策(逐条呈报)
- G1 ✅ ADOPT(Trellis backup-before-overwrite):自愈重装覆盖前先备份被覆盖内容。
  现状:setup.ts:555-568 自愈循环直接 `cp force:true` 覆盖 foreign/tampered 目录,内容
  永久丢失(可能是用户手改或第三方 pack 的唯一副本)。基建已有:backup.ts
  `getBackupRoot()` = `~/.harnessed/backups/<ts>/` + metadata + rollback 惯例。
  修法:新轻量 helper(skill 目录树备份,复用 getBackupRoot,目录名 `<ts>-skill-heal`),
  自愈循环逐目录先备份再 cp;heal 汇总行报备份路径。备份失败 → 醒目 warn 后仍 heal
  (引擎完整性优先,该内容本已是 foreign/tampered 态)。
- G2 ✅ ADAPT(comet 装前 unmanaged 检测,拒绝改为备份+警告):Step A(setup.ts:353-363)
  cp 前检测 dst 已存在且非我方原样内容(SKILL.md sha256 ≠ ledger 记录;ledger 无记录或
  无 marker → 保守视为已修改,Trellis "assume modified" 语义)→ 先备份 + 聚合警告行再覆盖。
  不采用 comet 的 throw 拒绝:引擎名按契约归 harnessed(4.23.0 D1 last-writer 设计),
  拒绝会 brick setup;备份+警告保数据又保设计。首装(dst 不存在)与重装未改动(hash 相同)
  零额外开销。
- G3 ✅ ADOPT(comet Red Flags 反驳表):relay 契约加自决借口反驳 — role-prompts
  discuss-phase checklist(en/zh 各 +1 条,条目数保持相等)新增:
  "Red flags — all invalid excuses to skip the relay: 'small change, no confirmation
  needed' / 'the user would probably agree' / 'the recommendation is obvious, adopt
  the default' / 'asking interrupts the flow'. Decision points have no size exception —
  relay anyway."(zh 对应)。deferrableRelay.test.ts 补断言。
- G4 ✅ ADOPT-LIGHT(ECC repair --dry-run 语义):doctor 的 skill-integrity 检查(warn 态)
  输出补 heal 预览措辞 — 列出 "would reinstall: <names>; run `harnessed setup` to heal
  (a backup of the current content is taken first)"。不加新命令(doctor 即 preview 通道,
  setup 即 heal 通道,YAGNI)。
- G5 ⏸ DEFER(OMC ambiguity 量化阈值):把"该不该问"变测量题是方向级设计(阈值定标、
  测量口径、与三层澄清判据的关系),不属于本批次;记入 intel 实施回填表 DEFERRED(v5+ discuss)。
- 不借鉴声明:omo zod strict(我方 schema 校验 + gates 已覆盖同面)/ comet FATAL 全量
  fail-closed(4.23.2 已选分型:配置 fail-closed + 运行时 fail-soft,合成即立场)/
  Trellis 3-way 全套(用户区 preserve-in-place 与引擎完整性契约冲突,取其 backup 精髓即 G1/G2)。

## T1 测试红先行:skill 目录备份 helper / 自愈前备份(含备份失败仍 heal)/ Step A 变更检测
     (hash 同→跳过、hash 异→备份+警告、无 ledger→保守备份、首装→无动作)/ doctor 预览措辞 /
     role-prompts red-flags(en/zh + 条目数相等)
## T2 G1+G2 实现 [新 lib(如 src/cli/lib/skillBackup.ts,独立新模块防 vi.mock 铁律)+ setup.ts 两处接线]
## T3 G3 role-prompts en/zh + deferrableRelay.test 扩展;G4 doctor check 措辞
## T4 收尾:vitest 全量 + tsc + pnpm lint + gates 7/7;CHANGELOG `## [4.24.0]` + bump +
     progress.md + intel 实施回填表(G1-G4 IMPL / G5 DEFERRED);commit 即 push;tag 等确认。
