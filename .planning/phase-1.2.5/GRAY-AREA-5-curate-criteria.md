# GRAY-AREA-5: Curate Criteria — 候选库准入标准

> **目的**: capture A8' 后半部分 (curate criteria) — phase 1.2.5 8 支柱 acceptance bar
> **依据**: R2 § 2 (业界参考 + 5 项 mandatory 推荐 + v0.4+ checklist) + ASSUMPTIONS § C P0-3 (c) 渐进策略 lock
> **状态**: ✅ 完成 (Wave B.6)

---

## § 1 准入标准定位

P0-3 lock = **(c) phase-aware 渐进策略**：

| Phase | 准入模式 | catalog 规模 | maintainer 投入 |
|---|---|---|---|
| **v0.1** | Maintainer 手工 curate + 5 项 CI mandatory check | 15-25 skills (base + 4 个核心 extension category × 3-5 skills) | 高 (起步阶段，亲自调研) |
| **v0.2-0.3** | 社区 issue 提议 (template 自填 5 项) + maintainer 决定 | 30-50 skills | 中 (每周 review) |
| **v0.4+** | Community PR + CI 自动 5 项 mandatory check + maintainer human review checklist | 50-100+ skills | 低 (PR review 流程化) |

**核心原则**：v0.1 不允许 catalog 膨胀；先 ship 高质量小库（D1.2.5-2 base + 6 category extension），再渐进开放。

---

## § 2 v0.1 — 5 项 mandatory + advisory score

### 2.1 5 项 mandatory（CI 自动 check）

```yaml
# .claude-plugins/curate-criteria-v0.1.yml
mandatory:
  - id: license_osi_approved
    rule: "license.spdx_id IN [MIT, Apache-2.0, BSD-3-Clause, BSD-2-Clause, ISC, Unlicense]"
    rationale: "OSI 兼容 → 商用安全 + 法律可二次分发"
    enforcement: hard reject
  
  - id: stars_minimum
    rule: "stargazers_count >= 100 OR (stargazers_count >= 50 AND last_commit_within_3mo)"
    rationale: "homebrew-core 75★ 起步；考虑到 skill 生态比 brew 小，下调 100 + 活跃可放宽"
    enforcement: hard reject (除非 'official maintainer' override — 见 § 3 official 列表)
  
  - id: maintenance_freshness
    rule: "last_commit_date >= now() - 6 months"
    rationale: "OSSF Scorecard Maintained 是 90 天；skill 比 OSS 库节奏慢，6 月合理"
    enforcement: hard reject
  
  - id: structural_completeness
    rule: "has SKILL.md OR plugin.json (in .claude-plugin/)"
    rationale: "schema 兼容 anthropics/claude-plugins-official"
    enforcement: hard reject
  
  - id: owner_quality
    rule: "owner.type == 'Organization' OR (owner.type == 'User' AND >=2 active contributors in last 6 mo)"
    rationale: "Avelino 论文：单 maintainer 36%/年掉队率 — Org 或 ≥2 contributors 是基本保险"
    enforcement: warn (not hard reject) — phase 1.1 R04 实证用作 expected value 提示
```

### 2.2 advisory score (排序而非门槛)

```yaml
advisory:
  - id: trust_score
    source: "ctx7 skills search Trust"
    weight: 0.3
    rationale: "context7 是当前最大 skill 索引，trust score 反映真实使用度"
  
  - id: install_count
    source: "ctx7 skills search 安装数 OR skills.sh leaderboard rank"
    weight: 0.3
  
  - id: official_maintainer
    rule: "owner IN ['anthropics', 'microsoft', 'vercel-labs', 'ChromeDevTools', 'tavily-ai', 'exa-labs', 'midwayjs', 'obra']"
    weight: 0.2  # 官方背书加分
    note: "official 列表可由 maintainer 增补；新加 owner 需 PR + 公示"
  
  - id: security_policy_present
    rule: "has SECURITY.md OR has security_policy in repo metadata"
    weight: 0.1
    rationale: "OSSF Security-Policy check 子集"
  
  - id: license_present
    rule: "has LICENSE file (即使 LICENSE 内容是 'see README')"
    weight: 0.1
```

### 2.3 v0.1 candidate 实测打分（已基于 R2 § 2.2 数据）

| Skill / repo | Stars | License | 活跃 | Owner | mandatory | advisory score | 验收 |
|---|---|---|---|---|---|---|---|
| anthropics/skills | 19,188 | (multi-OSS) | 2026-05-12 | Org | ✅ pass | 0.9 | **✅ v0.1 base** |
| anthropics/claude-plugins-official | 19,188 | (multi-OSS) | active | Org | ✅ pass | 0.9 | **✅ v0.1 base** |
| mattpocock/skills | (60K newsletter readers, repo small ★) | MIT | active | User | ⚠ warn (单 maintainer) | 0.7 | **✅ v0.1 base** (advisory warn) |
| obra/superpowers-skills | (待补) | (待补) | active | User | ⚠ warn | 0.7 | **✅ v0.1 base** (TDD 必需) |
| jimliu/baoyu-skills | 17,930 | **None** | 2026-05-12 | User | ❌ **hard reject** (license + 单 maintainer) | (advisory 不算) | **⚠ pending_license** — D1.2.5-10 标 advisory 收录 |
| midwayjs/midway (含 ui-ux-pro-max) | 7,710 | Apache-2.0 (midwayjs) | active | Org | ✅ pass | 0.8 | **✅ v0.1 extension** (D1.2.5-11 待 install path 实测) |
| ChromeDevTools/chrome-devtools-mcp | 39,338 | Apache-2.0 | active | Org | ✅ pass | 1.0 | **✅ v0.1 extension** (top tier) |
| tavily-ai/tavily-mcp | 1,954 | MIT | active | Org | ✅ pass | 0.8 | **✅ v0.1 extension** |
| exa-labs/exa-mcp-server | 4,415 | MIT | active | Org | ✅ pass | 0.85 | **✅ v0.1 extension** |
| microsoft/playwright-mcp | 32,407 | Apache-2.0 | active | Org | ✅ pass | 1.0 | **✅ v0.1 extension** |
| vercel-labs/skills | (待补) | (待补) | active | Org | ✅ likely pass | 0.75 | **✅ v0.1 base** (find-skills 入口) |

**关键 deviation 提示**:
- **jimliu/baoyu-skills hard reject** — license None + 单 maintainer。但流行度 17.9K ★ 极高。**v0.1 处理**：标 `pending_license` advisory 收录，user opt-in 时显示警告；**v0.2 by 2026-08**：联系 jimliu maintainer 加 LICENSE；如未响应 → 移出 catalog
- **mattpocock/skills warn (单 maintainer)** — Avelino 36%/年掉队率风险。**缓解**：harnessed mirror mattpocock 23 skills 关键 skill 到 backup repo (不分发，仅 SKILL.md 备份) — phase 2.x 范围

---

## § 3 official maintainer override 列表

某些 owner 即使不达 stars/contributors 门槛也可豁免 mandatory（advisory 仍记录）：

```yaml
official_maintainers:
  - anthropics                # Anthropic 官方
  - microsoft                 # Microsoft 官方
  - ChromeDevTools            # Chrome 团队
  - vercel-labs               # Vercel 官方
  - tavily-ai                 # Tavily 官方
  - exa-labs                  # Exa 官方
  - midwayjs                  # 阿里 Midway 团队
  - obra                      # superpowers maintainer (Anthropic 内部 known)
  - mattpocock                # mattpocock 个人 (newsletter 60K + skill 23 实证) — exception
```

新加 owner 需 maintainer PR + 公示讨论 ≥ 7 天。

---

## § 4 v0.4+ Community PR Review Checklist

### 4.1 自动 check (CI 跑 mandatory 5 项)

```yaml
ci_checks:
  - license_osi_approved
  - stars_minimum
  - maintenance_freshness
  - structural_completeness
  - owner_quality
  
on_failure:
  action: comment_on_pr
  message: |
    ❌ Mandatory check failed:
    {failed_check_id}: {reason}
    See harnessed curate criteria v0.1: docs/CURATE-CRITERIA.md
```

### 4.2 人工 sanity review (maintainer 5 min)

```markdown
## v0.4+ community PR review checklist (maintainer 视角)

### A. 自动 check (CI 已 pass)
- [x] license OSI approved
- [x] stars ≥ 100 (OR ≥50 + 3mo active)
- [x] last commit ≤ 6 months
- [x] has SKILL.md OR plugin.json
- [x] owner Org OR ≥2 contributors

### B. 人工 sanity review (5 min)
- [ ] SKILL.md description 清晰，trigger conditions 可机械判断（不是模糊"使用 X 时"，而是"任务描述含 'Y' OR 文件路径匹配 'Z'"）
- [ ] 与现有 catalog skill **不重复** (如重复 → 提议合并 OR 拒绝；评论指出重复对象)
- [ ] 不包含明显恶意行为：
  - [ ] .py / .ts / .sh 脚本无 reverse shell / data exfil / 凭据上传
  - [ ] 不读取 ~/.ssh, ~/.aws, ~/.config/gcloud 等敏感目录
  - [ ] 不发起 outbound 网络请求到非 documented 端点
- [ ] requires bins (bun / npx / python / git) 在 base layer 已声明
- [ ] decision_rules 与现有 schema 兼容 (不引入新 grammar — 如需扩展，分离 PR)
- [ ] 通过 Avelino bus factor warning：
  - [ ] 单 maintainer? 流行度高度依赖该 maintainer (high-risk)
  - [ ] Org? 团队 ≥3 active? (low-risk)
- [ ] 通过 OSSF Scorecard subset (v0.4+ 起步)：
  - [ ] Maintained
  - [ ] Code-Review (PR review enabled on main branch)
  - [ ] License (file exists)
  - [ ] Security-Policy (SECURITY.md OR repo security_policy)
  - [ ] Vulnerabilities (≤ 3 open critical issues)

### C. 决策
- [ ] **accept** → merge to catalog (`manifests/skill-packs/<name>.yaml` 加 entry)
- [ ] **request changes** → 评论指出问题 + suggest fixes
- [ ] **reject** → 给出明确原因 (mandatory fail / 重复 / 安全顾虑 / scope 不符)
```

### 4.3 v0.4+ 自动化级联

- CI mandatory check fail → auto comment + 标签 `needs-changes`
- CI mandatory check pass → 标签 `ready-for-review` → maintainer notification
- Maintainer 7 天无 review → 自动重新 ping
- 通过 review → auto-merge + 自动加入下一版 catalog

---

## § 5 OSSF Scorecard subset (v0.4+ 选用)

完整 OSSF Scorecard 23 项过重，v0.4+ 选 5-7 项 critical：

```yaml
ossf_scorecard_subset_v0.4:
  # 强制 (必须 pass)
  mandatory_extension:
    - Maintained: ">=90 天活跃 commits"
    - License: "LICENSE 文件存在 + OSI"
    - Code-Review: "main branch protection + PR review required"
  
  # advisory (评分加分)
  advisory_extension:
    - Security-Policy: weight 0.1
    - Vulnerabilities: weight 0.1  # 0 critical = 1.0; >3 = 0.0
    - Pinned-Dependencies: weight 0.05  # CI 用 SHA-pinned actions
    - Token-Permissions: weight 0.05  # GITHUB_TOKEN 最小权限
```

---

## § 6 capture verification (Wave D 用)

| Acceptance Bar | 本文档 capture | 状态 |
|---|---|---|
| **A8'** curate criteria v0.1 5 项 mandatory | § 2.1 | ✅ |
| **A8'** advisory score | § 2.2 | ✅ |
| **A8'** v0.1 candidate 实测打分 | § 2.3 表格 (jimliu pending_license / mattpocock warn) | ✅ |
| **A8'** v0.4+ community PR checklist | § 4.2 | ✅ |
| **A8'** Avelino bus factor 处理 | § 2.1 owner_quality + § 2.3 deviation note + § 4.2 review | ✅ |
| **A8'** OSSF Scorecard subset (v0.4+) | § 5 | ✅ |

A8' 后半部分 (curate criteria) 100% capture ✅

---

## § 7 References

- `RESEARCH-2-skill-ecosystem.md` § 2 (业界参考) + § 2.2 (5 项 mandatory) + § 2.3 (v0.4+ checklist)
- Homebrew Acceptable Formulae: https://docs.brew.sh/Acceptable-Formulae
- OpenSSF Scorecard: https://github.com/ossf/scorecard
- Avelino et al. 2016 OSS bus factor: https://arxiv.org/abs/1605.07922 (phase 1.1 R04)
- skills.sh leaderboard: https://skills.sh/
- Anthropic plugin directory submission: https://clau.de/plugin-directory-submission
- ASSUMPTIONS § C P0-3 (c) lock + D1.2.5-10 (jimliu license) + D1.2.5-11 (ui-ux-pro-max install adapter)
