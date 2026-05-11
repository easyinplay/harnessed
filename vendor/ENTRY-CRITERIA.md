# vendor/ Entry Criteria

> Source: `PROJECT-SPEC.md` v2.1 § 8.2
> Status: **Locked** — changes require ADR

## Mandatory（同时全部满足才允许进入 `vendor/`）

- **license** ∈ `[MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD]`（whitelist）
- **upstream_archived_or_unmaintained**: `true` — 上游必须已停摆（active 上游应通过 manifest 描述，不入 vendor）
- **vendor_size_max_kb**: `500` — 单个 vendor entry ≤ 500 KB
- **vendor_owner_signed**: `true` — PR 必须由 maintainer 显式签字（不接受匿名贡献）

## Forbidden

- ❌ GPL / AGPL / SSPL 上游（license 不兼容 Apache-2.0）
- ❌ binary 二进制（仅允许 source）
- ❌ 任何含动态求值 / `eval` / shell escape 的代码

## CI 守门

```bash
# 体积监控 — 任意 vendor entry > 500KB 自动 fail
du -ks vendor/*/ 2>/dev/null | awk '$1 > 500 { print "VENDOR SIZE EXCEEDED:", $2; exit 1 }'

# License 校验 — 每个 vendor entry 必须含 LICENSE 文件 + SPDX-License-Identifier
for d in vendor/*/; do
  [ -f "$d/LICENSE" ] || { echo "MISSING LICENSE: $d"; exit 1; }
done
```

## v0.1 状态

`vendor/` 应保持空。任何 PR 增加 vendor 须先 issue 讨论 + maintainer 签字 + 出 ADR。

## References

- `PROJECT-SPEC.md` v2.1 § 8.2（vendor 准入门槛）
- `NOTICES.md`（vendor 与 upstream attribution 入口）
- `docs/adr/`（vendor 例外通过 ADR 记录）
