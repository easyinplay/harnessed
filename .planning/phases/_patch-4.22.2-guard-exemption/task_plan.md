# task_plan — 4.22.2 GateGuard 豁免 consented auto-fix(用户指示:默认 Yes + 拒绝须醒目)

status: pending-4.22.1(依赖其 check-guard-conflict 探测模块)
决策(用户 2026-07-05 拍板):
- D1 默认 **Yes**(修复类 confirm,auto-install 先例):豁免域窄(仅 `.planning/**`)、可逆(备份先行)、
  是双产品共存的唯一正确配置;默认 No = 回车划过 → verify 阶段必然重演五次。
- D2 透明度不降级:confirm 前打印将写入的精确 diff 行(`ignore_paths: + ".planning/**"`)+ 目标文件路径
  + 备份位置;写入 = 幂等追加(已含则 skip),绝不重写整文件。
- D3 拒绝路径必须醒目:用户选 No → 输出高可见块(空行 + ⚠ 行 + 后果三条:verify 5 个 *-report.md 将被拦 /
  subagent 无法满足 evidence 契约将绕道改名 / 手动豁免的确切命令)+ doctor 保持 warn 态持续提醒直到解决
  (不是一次性提示)。
- D4 变体分型(4.22.1 探测模块基础上):
  - `.gateguard.yml` 存在(完整版 gateguard-ai)→ 本 auto-fix 路径(ignore_paths 追加,官方 config 面,
    README 实证)
  - ecc bundled fact-force hook → 不拦文件名(实证),文案改为事实门指引(subagent 撞墙 → 主 session 代答
    或 ECC_GATEGUARD=off),无 auto-fix
  - 未知变体 → warn + 三选一文案(维持 4.22.1)
- D5 入口:doctor auto-install 流(check 检出 → confirm 默认 Yes)+ checkpoint start 预检检出时同一 confirm
  (TTY 下;非 TTY 只 warn)。
- D6 红线:改第三方 guard 配置必须 备份 + 追加式 + 打印 diff;静默修改绝对禁止。

## T1 — .gateguard.yml 探测 + 幂等追加器(yaml 解析复用仓内 yaml 依赖;保留注释风格尽量文本级追加)
## T2 — doctor check 升级 warn→auto-fix(install_commands 或专用 fix 通道,按 auto-install 现有形态)
## T3 — checkpoint start 预检接 confirm(TTY 门)+ D3 拒绝醒目块
## T4 — 收尾:TDD 全程;vitest/tsc/biome/gates;CHANGELOG `## [4.22.2]` + bump + progress.md;
commit 即 push,tag 等确认。
