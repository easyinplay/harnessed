# progress — B2 编译管线(4.20.0)

## 任务状态
- T1 bundle 生成器 — DONE(TDD 先红:模块缺失 2 文件红 → 实现 → 8/8 绿;`src/compile/bundleAssets.ts`)
- T2 首跑解包器 — DONE(同轮 TDD;`src/compile/unpackAssets.ts`:原子 tmp+rename / 计数完整性 /
  损坏目标替换 / relPath 逃逸硬拒 5 用例)
- T3 本机端到端 — DONE(见下)
- T4 i18n 惰性接线 — DONE(`wireMessagesDir` thunk,src/cli.ts 入口注入;B1 击穿的 gates/setup-locale
  文件复跑保持绿:5 文件 38/38)
- T5 CI/发布 yml — DONE(ci.yml `binary-smoke` 3-OS job;publish.yml `binaries` needs:publish +
  gh release upload;oven-sh/setup-bun SHA pin 0c5077e5 = v2.2.0,gh api 解析)
- T6 收尾 — DONE(CHANGELOG 4.20.0 + bump + 本文件)

## T3 端到端摘录(Windows + bun 1.3.14,bump 后 4.20.0 复验)
```
[build-binary] bundle: 157 file(s), 1.1 MB → src\compile\assets-bundle.gen.json
[build-binary] ok: dist-bin\harnessed-windows-x64.exe (97 MB, v4.20.0)
# 异地 cwd:
harnessed: unpacked 157 bundled asset file(s) to C:\Users\easyi\.claude\harnessed\assets\4.20.0
4.20.0                       # --version
28                           # setup --dry-run 的 workflows 行计数
# 二次运行 stderr 无 unpacked 行(幂等)✓
# 哨兵实验(4.19.0 轮):改写解包目录 messages/en.json 某 key → exe 输出 UNPACKED-DIR-SENTINEL
#   → compiled 进程 i18n 确实读解包目录(wired 全链路)✓
```
测试产物已清理(assets/4.19.0、assets/4.20.0、dist-bin/)。

## 关键实现点
- entry 解包目标复用 `compiledAssetsDir()`(assetsRoot 新导出,单一路径 SoT;assetsRoot 无既有
  mock 面,gh 前先 grep 验证过)。
- `src/compile/entry.ts` 单文件 tsconfig exclude(assets-bundle.gen.json 仅构建期存在,tsc TS2307);
  bundleAssets/unpackAssets 全量类型检查内。gen.json + dist-bin/ 已入 .gitignore,package.json
  files 白名单不含二者(核对过)。
- zh 尾行英文疑云排除:node 渠道输出一致 → zh-Hans 表本就缺 `setup.dry_run.run_hint`(部分翻译,
  与本 phase 无关);en fallback 链正常。

## yml 风险标注(首个 tag 发布时验证)
- publish.yml `binaries` job:`needs: publish` 时序、`gh release upload --clobber` 权限
  (顶层 contents:write 已有)、`inputs.mode != 'dist-tag-fix'` 在 tag-push 触发下的空值行为
  (与既有 step 同判式,预期 true)— 均无法本地验证,4.20.0 tag 发布时盯首轮。
- ci.yml binary-smoke:ubuntu/macos 的 bun 编译与冒烟本地未验(仅 Windows 实测),3-OS 首轮 CI 验证。

## 全量验证
- vitest:1879 passed / 0 failed(+12:compile 8 + i18n-wire/compiledAssetsDir 4);bump 后复跑
  两轮全绿。其间一轮出现过 1 例不复现失败(连续两轮复跑消失)— 符合 memory 已记录的
  full-suite 负载抖动模式(flaky-after-crash-orphan-mcp 同类),非回归。
- tsc 0;biome clean(1 warning 为 HEAD 既有);scripts/check-*.mjs 7/7 OK;CHANGELOG ANSI 0。

## 被更新的既有断言
无(全部新增;B1 回归网 gates/setup-locale 显式复跑绿)。

## Follow-up(已在 CHANGELOG Notes)
- D6:perturn-inject hook 需宿主 node(纯二进制用户装该 optional hook 前自备)。
- D7:assets/<旧版本>/ 不自动清理 → doctor/gc 承接。
- Phase 3(未启动):curl 安装器 + 自更新 + npm per-platform 二进制包 + 签名。

## 追加 — cc-hook-add 双重 bug 修复(dogfood 发版拦截,2026-07-04)

来源:用户在另一机器 dogfood 报告 perturn-inject 装出的 settings.json hook 被 CC 判非法
(扁平 `{command}` 缺 `hooks:[{type,command}]` 包装)+ `node bin/harnessed-inject-state.mjs`
相对路径(仅 cwd 恰含该文件时可跑)。

- 新 `src/installers/lib/hookEntry.ts`(独立模块,mock-export-gap 规避):resolveHookCommand
  (相对段基于 getAssetsRoot 绝对化,空格加引号,node 保留 PATH 查找)、desiredHookEntry /
  isDesiredHookEntry(CC schema 形状,matcher 未设省略)、entryMatchesRegistration(marker =
  脚本 basename,识别扁平/嵌套相对/正确三形)、detectCcHookInstalled(authoritative 探测)。
- ccHookAdd installer:自愈迁移(命中条目统一收敛为一条修正条目;幂等 = 恰一条且 deep-equal);
  verify 嵌套形 + 解析后命令。
- isAlreadyInstalled:cc-hook-add 分支 authoritative(不落 shell grep — grep 把坏条目误判已装,
  恰好跳过最需自愈的安装,optional-offer 因此不会再 offer)。
- uninstaller:entryMatchesRegistration 同源匹配,新旧形状均可移除。
- 测试:hookEntry 12 新用例 + installer 7(3 既有断言按新 schema 形状更新:fresh/deep-merge/
  idempotent;新增 migration + matcher 省略/绝对化两 cell);fixture 命令改 scripts/no-such-fixture.mjs
  (原 scripts/dashboard.mjs 在仓库真实存在,解析行为正确命中,fixture 假设错误)。
- 全量 vitest 1893/0;tsc 0;biome clean;gates 7/7。
