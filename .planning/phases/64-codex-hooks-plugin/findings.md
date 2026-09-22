# Phase 64 findings(预记,开工时 refine)

- **F1 hook 侧必须显式传宿主**:codex hook 进程的 env 是 app-server 父进程快照,**不含 `CODEX_*`**(实测);
  若 codex 从 CC 终端启动,快照里还带 `CLAUDE_CODE_SESSION_ID` → Phase 63 的 env 嗅探会判 claude。
  故插件 hooks.json 的命令字面量必须带 `--platform codex`(或 shim 设 `HARNESSED_PLATFORM=codex` 再转发)。
  CLI 侧(codex shell 内)两种 env 并存时判歧义落 pin,符合 ADR 0040。
