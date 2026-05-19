# harnessed Metrics Snapshot

> Post-v1.0 GA user adoption + community health monitoring baseline (sister Paranoid Review M2 absorb 2026-05-22)
> 6-month organic clock 期间 weekly snapshot — co-maintainer recruit signal monitor
> 触发 maintenance-only mode evaluate at ~2026-11 organic clock close per ADR 0020 D-04 HYBRID

---

## Snapshot 维护规则

- 每周 1 次 weekly snapshot (建议周日 EOW UTC)
- 数据来源: npm registry / GitHub API / npmjs.com sponsors page
- 格式: 表格 append-only (NOT 覆盖 — 历史趋势 tracking)
- 6-month organic clock 期间 (2026-05-22 ~ 2026-11) 重点关注 co-maintainer recruit signal

---

## Metrics 维度

### Adoption (npm)
- `npm downloads` — 周下载量 (来源: `npm view harnessed downloads.weekly` OR https://npm-stat.com/charts.html?package=harnessed)
- `npm versions` — 发布版本数 (cumulative)
- `latest` dist-tag 当前指向

### Community (GitHub)
- `Stars` — repo star count
- `Forks` — fork count
- `Watchers` — watch count
- `Open issues` — 当前 open issue 数
- `Open PRs` — 当前 open PR 数
- `Contributors` — unique contributor count (含 author)

### Sustainability (Sponsors)
- `Sponsors` — 当前活跃 sponsor 数
- `Tier breakdown` — 各 tier 人数 (currently $1+ single tier per D-03 Phase 4.2)

### Co-maintainer recruit signal
- `Maintainer inquiry` — collaboration inquiry 数 (issue / DM / discord)
- `Active co-maintainer` — 0 / 1 / 2+ (current state)
- `Bus factor` — 1 (single maintainer baseline; target ≥ 2 by 2026-11)

---

## Weekly snapshots

### 2026-05-22 (v1.0 GA launch baseline)

| Dimension | Value |
| ---- | ---- |
| npm downloads (weekly) | 0 (just launched) |
| npm versions | 1 (1.0.0) |
| latest dist-tag | 1.0.0 |
| Stars | TBD (verify) |
| Forks | TBD |
| Open issues | TBD |
| Sponsors | TBD |
| Active co-maintainer | 0 |
| Bus factor | 1 |

> 备注: 首发 baseline。后续每周 EOW UTC append new row,趋势 tracking。

---

## 信号阈值 (organic clock evaluate ~2026-11)

| 信号 | 触发条件 | 决策 |
| ---- | ---- | ---- |
| 🟢 健康 | 月 downloads ≥ 100 + stars ≥ 20 + 1+ external PR merged | continued active development |
| 🟡 观察 | downloads 周稳定但 stars / contributor 增长慢 | continued maintenance + 加强 outreach |
| 🔴 maintenance-only | 6 month 0 external PR + 0 active co-maintainer + downloads < 10 | switch maintenance-only mode per ROADMAP v1.0+ |

---

## 数据采集 helper commands

```bash
# npm downloads weekly
curl -s https://api.npmjs.org/downloads/range/last-week/harnessed | jq '.downloads | map(.downloads) | add'

# GitHub stars + forks + open issues
gh api repos/easyinplay/harnessed --jq '{stars: .stargazers_count, forks: .forks_count, watchers: .watchers_count, open_issues: .open_issues_count}'

# Sponsors (manual UI check)
# https://github.com/sponsors/easyinplay/dashboard

# Open PRs count
gh pr list --state open --limit 999 | wc -l
```

---

## 文档链接

- ROADMAP v1.0+ chapter (organic clock window + maintenance-only mode trigger): [.planning/ROADMAP.md](../.planning/ROADMAP.md)
- ADR 0020 D-04 HYBRID 2-clock (organic clock 分离 internal ship clock): [docs/adr/0020-hybrid-2-clock.md](./adr/0020-hybrid-2-clock.md)
- MAINTAINER-ONBOARDING (co-maintainer recruit signal): [docs/MAINTAINER-ONBOARDING.md](./MAINTAINER-ONBOARDING.md)
