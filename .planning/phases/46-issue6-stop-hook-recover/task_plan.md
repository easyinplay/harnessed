# task_plan — 4.30.0 issue #6:mode-B 工具调用损坏自动恢复 Stop hook

status: ready-to-execute
issue #6(多用户反馈):模型偶发把 tool-call 开启定界符误采样成随机垃圾词(count/court…),
整个 <invoke> 块降级为纯文本 — harness 不识别(非 mode-A malformed,无自动重试),turn 正常
结束,无失败信号,只能用户手动"重试"。issue 自带 12,104-turn 真实 transcript 验证:
tag-in-text 不变量探测器 76/76 真阳、1 假阳(meta 讨论类,end-anchor 门可灭)。
spec 成熟度高,验收标准照单。

## 锁定决策
- D1 探测器(issue 评论区精化版为准):最后一条 assistant 消息 **无 structured tool_use
  block** 且文本内容(剥离 fenced+inline code 后)同时含 `<invoke name="` 与
  `<parameter name="`,且满足 end-anchor/未终止门(tag 位于消息尾部区域,或最后一个
  `<invoke` 之后无 `</invoke>` 闭合)→ mode-B。
- D2 动作:stdout `{"decision":"block","reason":"MODE-B tool corruption detected: your
  previous message emitted a tool call as plain text (the opening delimiter was
  mis-sampled). Re-emit that exact same tool call now as a real tool call — content
  unchanged."}`;其余情况零输出 exit 0。
- D3 循环护栏:respect payload `stop_hook_active`;重试计数落
  `<stateRoot>/stop-hook-retries/<session>.json`(含消息签名 hash,签名变则重置),
  cap = 2;任何内部错误 → 静默 exit 0(fail-soft,绝不卡住正常停止)。
- D4 形态:`bin/harnessed-stop-hook.mjs` 自包含纯 JS(镜像 inject-state 惯例)+
  `harnessed stop-hook` 子命令(compiled 模式 hook 调二进制自身,4.27.0 D6 同款双路由);
  `manifests/optional/stop-hook-recover.yaml`(cc-hook 类型,hook_event: Stop,
  照 perturn-inject 形状;optional 多选 offer 自动收录);hookEntry marker 身份
  `stop-hook` token 双向去重。
- D5 fixtures(验收标准照单):synthetic mode-B transcript(`count\n<invoke name="Bash">…`
  未终止)必须命中;合法 prose 提及 tag(code fence 内 + mid-message 带后续 prose)必须
  不命中;structured tool_use turn 不命中;stop_hook_active+cap 不 block;损坏 JSONL 静默。
- D6 文档:docs/ 或 README 适当位置给 `~/.claude/settings.json` 手动安装 snippet
  (第二台机器场景,issue 验收项);CHANGELOG 4.30.0。
- D7 与用户全局 CLAUDE.md 的"emission 规避"节互补:那是预防(assistant 行为),本 hook
  是自动恢复(mode-B 兜底);issue 回复里说明二者关系。

## T1 测试红先行(探测器纯函数 + hook 端到端 stdin/stdout + fixtures 全套 + 子命令 +
     hookEntry 身份 + manifest schema)
## T2 bin/harnessed-stop-hook.mjs + src/cli 子命令 + 探测器共享逻辑
## T3 manifest + hookEntry/ccHookAdd 接线 + compiled 路由
## T4 docs snippet;T-final 收尾(主 session):全量验证 + CHANGELOG + bump 4.30.0 +
     commit/push + issue #6 回复关闭(Fixes #6)+ tag 等确认。
