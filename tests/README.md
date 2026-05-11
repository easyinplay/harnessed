# tests/ — 测试组织

## 结构

- `unit/` — 单元测试（manifest validator / routing engine / installer adapter / etc.）
- `integration/` — 集成测试（多模块协同；v0.2+ 起 e2e setup/install/doctor 流程）
- `fixtures/` — 测试数据
  - `manifests/valid/` — 9 个真实上游的合法 manifest（T7.1-T7.9）
  - `manifests/invalid/` — 故意写错的 manifest（漏字段 / type×method 不匹配 / 未知字段 / 行号回归）
  - `workflows/{valid,invalid}/` — phases schema 测试 fixture（v0.3）
  - `routing/{valid,invalid}/` — B+C routing schema 测试 fixture（v0.1 phase 1.4）

## 命名规则

- 单元测试：`<module-name>.test.ts`（如 `manifest-validate.test.ts`）
- 矩阵测试：`<module-name>.matrix.test.ts`（如 `manifest-validate.matrix.test.ts`）
- benchmark：`<module-name>.bench.ts`（vitest bench 模式）

## 验收（phase 1.1 acceptance bar）

- ≥ 50 tests passed（A1）
- ctx7 真实 manifest 在正向测试中 pass（A2）
- ≥ 35 个负向测试 + 行号 assertion 全绿（A3）
- vitest bench 100 manifest < 50ms（A6）

详见 `.planning/phase-1.1/PLAN.md` § 4.1 acceptance bar。
