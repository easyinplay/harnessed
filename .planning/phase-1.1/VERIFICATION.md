# Phase 1.1 Verification (Reproduction Guide)

> **Purpose**：让任何 reviewer / fork 能本地复现 phase 1.1 的 8 acceptance bar 验收
> **Tag baseline**：`v0.1.0-alpha.1-schema-frozen`（local tag — 见 T10.3）
> **Created**：2026-05-12（batch 6 collapse）

## Prerequisites

- Node.js ≥ 22.0.0
- Git（Windows: Git Bash 推荐）
- 5 分钟 + 干净仓库（`git status` clean）

## Setup

```bash
git clone <repo-url>
cd harnessed
git checkout v0.1.0-alpha.1-schema-frozen   # phase 1.1 milestone tag
corepack enable
corepack pnpm install --frozen-lockfile
```

如 Windows ACL 报错，参考 [CONTRIBUTING.md](../../CONTRIBUTING.md) "Windows Workaround"。

## Acceptance Bar A1-A8 复现

### A1: `pnpm test` ≥ 50 测试 passed

```bash
corepack pnpm test
# 期望（phase 1.1 baseline）：Test Files 10 passed, Tests 71 passed
# 期望（phase 1.1.1 hotfix 后）：Test Files 12 passed, Tests 89 passed (+B1 9 + B2/M1 9)
```

### A2: ctx7 manifest 在正向测试中 pass

```bash
corepack pnpm test -- --reporter=verbose 2>&1 | grep ctx7
# 期望：ctx7.yaml validates ✓
```

或 fixture-driven 自动 cover：A1 全绿 = A2 全绿（ctx7 在 fixture-driven test 中）。

### A3: ≥ 35 个负向测试 + 行号 assertion 全绿

```bash
corepack pnpm test -- --reporter=verbose 2>&1 | grep -E "(required|discriminator|type-error|unknown-field|line-mapping)" | grep -v PASS | wc -l
# 期望：56+ 负向 tests（14 required + 17 discriminator + 7 type-error + 7 unknown-field + 5 line-mapping + 6 errors = 56）
```

### A4: GitHub Actions mac/linux/win × Node 22 全绿 ✅

**已实证 2026-05-12**：[run 25686045249](https://github.com/easyinplay/harnessed/actions/runs/25686045249) @ commit `92b355c` — ubuntu 27s ✅ / macos 21s ✅ / windows 43s ✅。

**异步**：CI 在 push 后由 `.github/workflows/ci.yml` 触发。后续验证：

```bash
gh run list -R easyinplay/harnessed --limit 1
```

> **F18 注**：首次 run 25685166326 windows 失败 perf gate（59.22ms / 50ms）— GitHub Actions windows-latest 是 cloud VM ~3× 慢于 local。修复方案 platform-aware threshold（`tests/integration/manifest-validate.perf.test.ts`：CI win 100ms / 其他 50ms）。详见 `progress.md § B F18`。

本地 dry-run 跨 OS 等价性：

```bash
corepack pnpm typecheck && \
corepack pnpm lint && \
corepack pnpm test && \
corepack pnpm build && \
corepack pnpm build:schema && \
corepack pnpm validate:schema && \
node ./dist/cli.mjs --version
```

每条命令必须 exit 0。CI runner 跑同样命令。

### A5: schema artifact Ajv 2020 strict 编译 exit 0

```bash
corepack pnpm build:schema && corepack pnpm validate:schema
# 期望：[validate-schema] OK — schemas/manifest.v1.schema.json is a valid JSON Schema (Ajv 8 strict + discriminator)
```

### A6: vitest bench 100 manifest < 50ms

```bash
corepack pnpm bench
# 期望：mean ~22ms（baseline 21.7ms / 22.2ms / 22.7ms）
```

CI-enforced gate：`tests/integration/manifest-validate.perf.test.ts` 阈值 < 50ms。

### A7: ADR 0001/0002 main body 未被 phase 1.1 修改

```bash
git log --oneline -- docs/adr/0001-manifest-schema-v1.md docs/adr/0002-repo-structure-toolchain-v0.1.md
# 期望：1 commit (initial skeleton)，无后续改动
```

或对比 baseline tag（**phase 1.1.1 hotfix H2 已自动化进 CI**：`.github/workflows/ci.yml` "A7 acceptance bar — ADR 0001/0002 main body 守恒" step 自动跑 `git diff adr-0001-accepted -- docs/adr/0001-*.md docs/adr/0002-*.md`，非空 diff 失败 CI；本地手动跑等价命令）：

```bash
git diff adr-0001-accepted -- docs/adr/0001-manifest-schema-v1.md
# 期望：empty diff
```

### A8: manifests/*.yaml 全部 LF

```bash
git ls-files --eol "manifests/*.yaml" | awk '$1 != "i/lf"' | wc -l
# 期望：0
```

## 已知 Findings 索引

完整 finding narratives 见 [progress.md § B](./progress.md#section-b--findings--decision-log)。

| ID | 主题 | Resolution |
| -- | ---- | ---------- |
| F1 | corepack ACL on Windows + .gitkeep | ✅ Workaround in CONTRIBUTING.md |
| F2 | Biome 2.4 schema breaking | ✅ `biome migrate --write` |
| F3 | `pnpm run typecheck` shell shim issue | ✅ tsc 直调 |
| F4 | tsup `.mjs` 后缀 | ✅ `outExtension` 配置 |
| F5 | deferred deps to batch 2 | ✅ karpathy simplicity |
| F6 | batch 1.5 收尾无意外 | ✅ N/A |
| F7 | A8 验收命令 V4 fix | ✅ `awk '$1 != "i/lf"'` |
| F8 | TypeBox Union discriminator → Ajv 不兼容 | ✅ hand-rolled oneOf |
| F9 | verbatimModuleSyntax CJS interop | ✅ namespace + .default |
| F10 | type×method matrix Rule 2 | ✅ allOf in ManifestSchema |
| F11 | Ajv 2020 entry 必要性 | ✅ `ajv/dist/2020.js` |
| F12 | biome JSON formatter conflict | ✅ ignore schemas/*.schema.json |
| F13 | routing/SCHEMA.md 200 行约束 | ✅ 199 行 (compress) |
| F14 | T7.10 verdict — schema v1 sufficient | ✅ no errata needed |
| F15 | matrix illegal count 17 vs 18 | ✅ 17 implemented (24 - 7 legal) |
| F16 | T8.4/T8.5/T8.7 redefined | ✅ deferred-items table |
| F17 | Phase 1.1 ship narrative | ✅ 7/8 acceptance bar; A4 ⏳ pending CI |
| F18 | CI windows-latest cloud VM ~3× slower | ✅ platform-aware threshold (100ms CI win / 50ms 其他) |
| F19 | Phase 1.1.1 hotfix (paranoid review 9 项) | ✅ B1+B2+M1+H1-H7 shipped; ADR 0001/0002 不动 |
| F20 | cc-plugin-marketplace REPL slash-command headless 机制 | ⏳ deferred to phase 1.2 plan-phase |
| F21 | git_ref schema pattern (M1) | ✅ ccPluginMarketplace + gitCloneWithSetup pattern enforced |
| F22 | SECURITY.md vulnerability disclosure (H7) | ✅ 52 lines, 2 channels, SLA |

## Phase 1.2 Prerequisites + How to Reproduce

下一阶段（v0.1 phase 1.2 — cli-npm + mcp-stdio installer + setup/doctor 命令）依赖 schema v1 frozen + 10 dry-run manifests（含 ctx7 / tavily-mcp / exa-mcp 三个 install 目标）+ validator 公开 API + schema artifact + CI matrix config。✅ A4 已通过 CI run 25686045249 实证（2026-05-12）。

```bash
git clone <repo-url> harnessed-repro && cd harnessed-repro
corepack enable && corepack pnpm install --frozen-lockfile
corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test \
  && corepack pnpm build && corepack pnpm build:schema \
  && corepack pnpm validate:schema && corepack pnpm bench \
  && node ./dist/cli.mjs --version
# 全绿 = phase 1.1 复现成功
```
