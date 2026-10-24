# README 安装区精简

## 状态

- [x] 先更新文档契约并验证 RED。
- [x] 精简根目录全部 11 份 `README*.md`。
- [x] 删除 `INSTALL-WITH-AI.md` 及 README 中的链接、推广和复制 prompt。
- [x] 定向文档测试、Biome、改动边界检查通过。

## 范围与决定

仅修改根目录 11 份 `README*.md`、`tests/docs/install-channels.contract.mjs`、删除的 `INSTALL-WITH-AI.md` 和本记录。不修改其他代码、规划文件、历史记录或 CHANGELOG；website 文档由并行工作单元负责。

Bun 安装链保持 `bun install -g harnessed && bun run --bun harnessed setup`，仍标为次要推荐、可选。后面只保留一句显式 runner 提醒：`For later Bun commands, use bun run --bun harnessed; the bare harnessed shim may still invoke Node.js.` 各 locale 使用对应翻译。

移除自动宿主检测的长解释、等价安装写法、维护命令块、手动宿主覆盖块、更新和卸载说明，以及“三渠道选一、成功后不重复 setup”的额外段落。保留二进制自身与上游依赖的区别、原有二进制 setup 同意/失败处理说明、npm 的 Node.js >= 22 要求和无需 Bun 的边界、原有 PowerShell 5.x 提示。

`README.md` 仍是英文 canonical；`README-en.md` 除原有 mirror note 外保持一致。First 5 Minutes、所有后续章节和独立 Agent Teams TIP 均与修改前一致。原先混在 Bun 长段落中的二进制 setup 说明移至对应二进制渠道下，npm 无需 Bun 的说明保留在 npm 渠道下。

## 验证证据

RED：先调整契约，保留旧文档，运行 `node --test --test-reporter=tap tests/docs/install-channels.contract.mjs`，结果为 `tests 30`、`pass 17`、`fail 13`。失败对应 11 份 README 的冗余 Bun 代码块、尚未删除的独立指南和 AI 安装推广。

GREEN：运行 `node --test tests/docs/install-channels.contract.mjs`，结果为 `tests 30`、`pass 30`、`fail 0`。契约继续覆盖 11 份 README 的导航、渠道顺序、Bun 可选标签、安装链与精简 runner 提醒、binary/npm 运行时边界、PowerShell 提示、宿主 prompt 与 shell 命令区分、链接和资源存在性。

运行 `./node_modules/.bin/biome.cmd check tests/docs/install-channels.contract.mjs`，结果为 `Checked 1 file`、`No fixes applied`，退出码 0。运行 scoped `git diff --check`，退出码 0。

另以 `git show HEAD:<README>` 对照工作区，11/11 份 README 的 First 5 Minutes 及后续章节、Agent Teams TIP 内容一致（仅统一换行后比较）。非历史引用扫描仅剩契约测试中的防回归断言，没有 README 或配置继续链接已删除指南。

原生 `ralph-loop` 不可用；采用最多 3 轮定向执行/验证，第一轮达到 GREEN。未运行全量测试或 build，未执行 commit、push、版本变更、tag、publish、全局安装或依赖修改。
