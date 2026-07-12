# progress — 4.22.2 GateGuard 豁免 consented auto-fix

- [x] T1 `.gateguard.yml` 探测 + 幂等追加器 — 新 `src/cli/lib/guard-exemption.ts`:
  `findGateguardYml`(cwd 优先 → home;fail-soft)、`planExemption`(文本级:已含 skip /
  `ignore_paths:` 头后插入 / EOF 追加节;EOL LF/CRLF 检测保留;保守 skip:注释中出现
  glob 也 skip — warn 类修复,过度跳过是安全方向)、`applyExemption`(备份先行,备份失败
  即拒绝写入;原子 tmp+rename)、`previewLines`(精确 diff 行 + 目标 + 备份家)、
  `refusalLines`(D3 醒目块:verify 5 个 report 具名 + subagent 无 fact-retry 后果 +
  手动命令 + doctor 持续警告声明)、`runExemptionFlow`(共享编排:no-yml/already/
  applied/declined/advised/error 六态)。
- [x] T2 doctor 升级 — `checkGuardConflict(deps?, exemption?)` 变体分型:
  yml 未豁免 → warn + `install_commands: ['harnessed exempt-gateguard']`(auto-install
  confirm 流,initialValue: true = D1 默认 Yes);yml 已豁免 → **pass**(唠叨与冲突同灭);
  无 yml → 4.22.1 通用 warn 不变。新 CLI `src/cli/exempt-gateguard.ts`(24th 注册;
  invocation = consent,仍打印 diff + 备份;exit 1 仅写入错误)。
- [x] T3 checkpoint start 接线 — 变体分型流:TTY → clack confirm 默认 Yes,拒绝 →
  refusalLines 醒目块;非 TTY → 预览 + 手动命令(绝不无人值守修改);已豁免静默;
  no-yml → 4.22.1 通用警告保留。全 stderr、全 fail-soft。
- [x] T4 收尾 — CHANGELOG `## [4.22.2]`(Edit 写入,ANSI 0)+ package.json 4.22.2。

## 验证
- TDD:guard-exemption.test.ts 先红(模块缺失收集失败)→ 16/16;check-guard-conflict
  +3 cells、checkpoint-start +3 cells、exempt-gateguard CLI 3 cells → 四文件 37/37。
- 全量 vitest / tsc / biome / build / scripts/check-*.mjs 见主 session 验收记录。

## 被更新的既有断言
- 无删改 — check-guard-conflict.test.ts 与 checkpoint-start-skeleton.test.ts 均为追加
  cells;既有 "active 时通用警告" cell 因 no-yml 路径保留原文案而无需改动。

## 设计记录
- checkpoint-start 测试对 guard-exemption 只 mock `findGateguardYml`(importOriginal
  spread),apply/preview 走真实实现 + 真实 tmp fs — "未经同意绝不写盘"在磁盘层面被
  断言,非仅行为 spy。
- doctor 的豁免探测 fail-soft 回落通用 warn(探测异常不会把 warn 变 pass — 保守方向)。
- backup 落 `harnessedSubdir('backups')`,与 settingsWriter 的 settings.json 备份同家
  (用户找 harnessed 动过的所有配置只需看一处)。
