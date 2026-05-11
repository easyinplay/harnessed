# schemas/ — 可独立 publish 的 JSON Schema artifact

`schemas/` 包含 harnessed 编译输出的**标准 JSON Schema 文件**，与 npm 包一起 publish 让社区在 IDE 中直接校验自己的 manifest / workflow / routing 文件。

## 文件（v0.1 phase 1.1 起）

- `manifest.v1.schema.json` — manifest schema（编译自 `src/manifest/schema/index.ts` TypeBox 定义）
- `workflows.v1.schema.json` — phases schema（v0.3）
- `routing.v1.schema.json` — B+C routing schema（v0.1 phase 1.4）

## 使用（社区作者）

在自己的 manifest yaml 文件顶部加一行：

```yaml
# yaml-language-server: $schema=https://harnessed.dev/schemas/manifest.v1.schema.json
```

VS Code redhat.vscode-yaml 插件会自动启用补全 + 实时校验。

## 编译

```bash
pnpm run build:schema   # 调用 scripts/build-schema.ts
```

输出 `schemas/manifest.v1.schema.json`，由 CI 跑 `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` 验证产物自身合规。

## 关联

- 源 schema：`src/manifest/schema/`（TypeBox 定义）
- 决策依据：`docs/adr/0001-manifest-schema-v1.md`
- 校验器：Ajv 8.17 + TypeBox 0.34 LTS（见 GA-1）
