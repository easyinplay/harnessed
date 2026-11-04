# Errors & Rescue — Phase 84 自动更新

> 契约见 `CONTEXT.md`。本文件是错误与救援表 + 失败模式登记表。

## Error & Rescue map

| 阶段 | 错误类 | 触发条件 | 处理 | 用户看到 | 测试 |
|---|---|---|---|---|---|
| consent 读取 | 文件损坏 | JSON parse 失败 | fail-closed(自动更新关) | status 显示 `unreadable` | 单测 |
| consent 读取 | 字段类型错 | `autoUpdate` 非 boolean | 当作 false | 同上 | 单测 |
| 根路径 | preferences 写在 A 根、worker 读 B 根 | CLI 与 hook 的 `HARNESSED_ROOT_OVERRIDE` 不同 | 命令打印解析出的路径 | 输出里的路径当场可见 | 单测 |
| 预检 | exec 目录不可写 | `execDirWritable` false | **取锁之前**中止 | status `exec-dir-readonly` | 单测 |
| 锁 | anchor 不可写 | exe 目录只读 → `openSync(anchor,'a')` EACCES | 由预检提前拦下(否则上抛被 worker 的 `catch {}` 吞掉) | status `exec-dir-readonly` | 单测 |
| 锁 | busy | 手动更新在跑 / 另一宿主在跑 | 本轮跳过,不下载 | status `skipped: busy` | 单测 |
| 元数据 | timeout/network/http/parse/publishing | `resolveLatestRelease` 五种 | 阶段化报错,原 binary 不动 | status `reason` + message | 单测(已有形态) |
| 下载 | 停滞 120s | 无数据 | 中止,**保留 `.part`** | 进度显示已收字节 | 单测(已有形态) |
| 下载 | 断线 | 连接重置 | Range 续传(206 追加 / 200 重下 / 起点不符则丢弃重下) | 同上 | 新单测 |
| 下载 | 服务端不支持 Range | 返回 200 | 截断重写 | 同上 | 新单测 |
| 下载 | Content-Range 起点不符 | 206 但起点 ≠ N | 丢弃 `.part` 从 0 重下 | 同上 | 新单测 |
| 校验 | sha256 不符 | 资产被篡改 | 删 `.part`,中止 | status `integrity` | 单测(已有形态) |
| 校验 | ed25519 签名不过 | 签名不匹配 | 删 `.part`,中止 | status `integrity` | 单测(已有形态) |
| 冒烟 | `--version` 不对 | 资产不是目标版本 | **保留 `.part`**(下次直接冒烟) | status `smoke` | 单测(已有形态) |
| 换入 | rename exec→bak 失败 | 文件锁 | 原 binary 不动 | status `swap` | 单测(已有形态) |
| 换入 | temp→exec 失败 | 跨卷/锁 | 回滚 bak→exec | status `swap`(rolled back) | 单测(已有形态) |
| 换入 | temp→exec **且**回滚都失败 | 极端 | **CRITICAL** | status `swap-critical` + restore 指令 + 自动关开关 | 新单测 |
| 交接 | refreshOwnedUpdate 失败 | hooks 装不上 | binary 已是新版,不回滚 | status `handover` + 「跑 setup」 | 单测 |
| 交接 | codex 信任闸门 | `codexHookTrust:'deny'` | hooks 未刷新 | status `handover-trust-pending` | 单测 |
| 公告 | notice 写进另一个 root | 交接没拿到绝对路径 | worker 预写 `from` + env 传路径(R17) | 公告缺失可诊断 | 单测 |
| 公告 | 重复打印 | hook 每次 SessionStart 都跑 | `consumedAt` 一次性消费(R16) | 只打印一次 | 新单测 |
| 公告 | 半成品 notice | 交接失败(新 binary 起不来 / 180s 超时被杀) | notice 保持 pending(`to` 为空),hook 不打印 | 无公告,status 里可见 | 新单测 |
| 状态文件 | 写失败 | 磁盘满 / state root 只读 | 记录不了就至少 stderr 一行(不进 stdout,worker 是 detached 且 stdout 被丢) | stderr 可见 | 单测 |
| preferences | 写失败 | 同上(`auto-update on` / CRITICAL 自动关开关) | 命令报非零退出码并说明原因 | 命令输出可见 | 单测 |
| 通道 | npm 通道 | `channel !== 'binary'` | 只提醒,不替换 | status `skipped: npm channel` | 单测 |
| 限流 | 同版本已完整失败 | 状态文件有记录 | 本轮跳过 | 无(静默 OK) | 单测 |
| 续传 | 有进度中断 | `.part` 有字节 | 不消耗配额,下次续 | 进度可见 | 新单测 |
| 清理 | `.part` 无人回收 | gc 只扫 `.bak-*` | gc 顺带扫 `.part`(R19) | exe 目录不留垃圾 | 新单测 |

## Failure Modes Registry

```
  CODEPATH                       | FAILURE MODE            | RESCUED? | TEST? | USER SEES? | LOGGED?
  -------------------------------|-------------------------|----------|-------|------------|--------
  readUpdateReminderPreferences  | 文件损坏                | Y        | Y     | Y(status)  | Y
  readUpdateReminderPreferences  | 字段类型错              | Y        | Y     | Y(status)  | Y
  resolveReminderRoot            | 写 A 读 B(配置偏差)    | Y        | Y     | Y(路径)    | Y
  execDirWritable                | 目录只读                | Y        | Y     | Y(status)  | Y
  acquireUpdateLock              | anchor 不可写(EACCES)  | Y(预检)  | Y     | Y(status)  | Y
  acquireUpdateLock              | busy                    | Y        | Y     | Y(status)  | Y
  resolveLatestRelease           | timeout/network/http    | Y        | Y     | Y(status)  | Y
  streamAssetToFile              | 停滞                    | Y(续传)  | Y     | Y(进度)    | Y
  streamAssetToFile              | 断线                    | Y(续传)  | Y     | Y(进度)    | Y
  streamAssetToFile              | 206 起点不符            | Y(丢弃)  | Y     | Y(进度)    | Y
  sha256/ed25519 verify          | 篡改                    | Y        | Y     | Y(status)  | Y
  smoke --version                | 资产不是目标版本        | Y        | Y     | Y(status)  | Y
  rename exec→bak                | 文件锁                  | Y        | Y     | Y(status)  | Y
  rename temp→exec + rollback    | 双失败                  | Y        | Y     | Y(CRITICAL)| Y
  spawnOwnedRefresh              | 交接失败                | Y        | Y     | Y(status)  | Y
  refreshOwnedUpdate (codex)     | 信任闸门                | Y        | Y     | Y(status)  | Y
  writeNotice (handover)         | 写错 root               | Y(env)   | Y     | Y(诊断)    | Y
  readNotice (hook)              | 重复消费                | Y(标记)  | Y     | 只打印一次 | Y
  通道判定                       | npm 通道                | Y        | Y     | Y(status)  | Y
  限流判定                       | 同版本重复失败          | Y        | Y     | N(静默 OK) | Y
  gcCompiledArtifacts             | `.part` 未回收          | Y        | Y     | N(静默 OK) | Y
  writeAutoUpdateStatus          | 状态文件写失败          | Y        | Y     | Y(stderr)  | Y
  writePreferences               | preferences 写失败      | Y        | Y     | Y(命令输出)| Y
  readNotice (hook)              | 半成品 notice           | Y(pending)| Y     | N(不打印)  | Y
```

**本表(map)28 类失败路径,registry 25 行** —— 两张表必须同步。
新增失败类必须**先补 map 与 registry 两张表再改代码**:不补表就改码,等于把一条没登记的
失败路径放出去(第一轮评审的 F1 —— 锁 anchor 不可写被 `catch {}` 吞掉 —— 就是这么漏的)。
自评句不写「0 CRITICAL GAP」这种结论式断言,只写覆盖数与「先补两张表」的纪律。
