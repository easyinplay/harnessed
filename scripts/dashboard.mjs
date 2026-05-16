#!/usr/bin/env node
// Lightweight read-only dashboard for harnessed `.planning/` + `docs/adr/` + git activity.
//
// Usage:
//   node scripts/dashboard.mjs              # start + auto-open browser
//   node scripts/dashboard.mjs --no-open    # start without opening browser (for hooks)
//
// If port 47180 already occupied → exit 0 silent (idempotent — safe to call from CC hook).
// Reads files fresh on each request. User edits any tracked file → refresh browser to see update.
//
// Zero external deps (only node built-ins). Inline tiny markdown → HTML.
// Mirrors the superpowers brainstorming shell-pages pattern (single shell + fetched fragments).
//
// CC hook wiring (~/.claude/settings.json or .claude/settings.json):
//   {
//     "hooks": {
//       "SessionStart": [
//         { "matcher": "startup|resume",
//           "hooks": [{ "type": "command",
//                       "command": "node scripts/dashboard.mjs --no-open" }] }
//       ]
//     }
//   }
import { execSync, spawn } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  watch,
  writeFileSync,
} from 'node:fs'
import { createServer } from 'node:http'
import { createConnection } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)
const ROOT = process.cwd()
const PLANNING = join(ROOT, '.planning')
const ADR = join(ROOT, 'docs', 'adr')
const NO_OPEN = process.argv.includes('--no-open')

// Phase 2.4 W3 T3.3 (D-04 § 3.3 + R2.4.6 + B-25 + O7) — multi-project registry.
// ~/.claude/harnessed-projects.json SSOT — auto-init with cwd as first project
// on first dashboard launch (O7 MIN: zero-config; user 显式 add additional projects).
const PROJECTS_CONFIG = join(homedir(), '.claude', 'harnessed-projects.json')

function loadProjects() {
  if (!existsSync(PROJECTS_CONFIG)) {
    mkdirSync(dirname(PROJECTS_CONFIG), { recursive: true })
    const init = {
      schemaVersion: 1,
      projects: [{ name: 'default', path: ROOT, lastAccessed: new Date().toISOString() }],
    }
    writeFileSync(PROJECTS_CONFIG, JSON.stringify(init, null, 2))
    return init
  }
  try {
    return JSON.parse(readFileSync(PROJECTS_CONFIG, 'utf8'))
  } catch {
    return {
      schemaVersion: 1,
      projects: [{ name: 'default', path: ROOT, lastAccessed: new Date().toISOString() }],
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tiny markdown → HTML (headings / tables / code / lists / bold / italic / links)
// ────────────────────────────────────────────────────────────────────────────
function esc(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}
function md(src) {
  const lines = src.split(/\r?\n/)
  const out = []
  let inCode = false
  let codeBuf = []
  let listType = null
  let tableRows = null
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }
  const closeTable = () => {
    if (tableRows) {
      out.push('<table>')
      const [head, , ...body] = tableRows
      out.push('<thead><tr>')
      for (const c of head) out.push(`<th>${inline(c.trim())}</th>`)
      out.push('</tr></thead><tbody>')
      for (const row of body) {
        out.push('<tr>')
        for (const c of row) out.push(`<td>${inline(c.trim())}</td>`)
        out.push('</tr>')
      }
      out.push('</tbody></table>')
      tableRows = null
    }
  }
  for (const ln of lines) {
    if (inCode) {
      if (ln.startsWith('```')) {
        out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`)
        codeBuf = []
        inCode = false
      } else codeBuf.push(ln)
      continue
    }
    if (ln.startsWith('```')) {
      closeList()
      closeTable()
      inCode = true
      continue
    }
    if (/^\s*\|.*\|\s*$/.test(ln)) {
      const cells = ln.trim().slice(1, -1).split('|')
      if (!tableRows) tableRows = []
      tableRows.push(cells)
      continue
    }
    closeTable()
    const h = ln.match(/^(#{1,6})\s+(.+)$/)
    if (h) {
      closeList()
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`)
      continue
    }
    const ul = ln.match(/^[-*]\s+(.+)$/)
    const ol = ln.match(/^\d+\.\s+(.+)$/)
    if (ul || ol) {
      const want = ul ? 'ul' : 'ol'
      if (listType && listType !== want) closeList()
      if (!listType) {
        out.push(`<${want}>`)
        listType = want
      }
      out.push(`<li>${inline((ul || ol)[1])}</li>`)
      continue
    }
    closeList()
    if (ln.startsWith('> ')) {
      out.push(`<blockquote>${inline(ln.slice(2))}</blockquote>`)
      continue
    }
    if (ln.trim() === '---') {
      out.push('<hr/>')
      continue
    }
    if (ln.trim()) out.push(`<p>${inline(ln)}</p>`)
  }
  closeList()
  closeTable()
  return out.join('\n')
}

// ────────────────────────────────────────────────────────────────────────────
// File helpers
// ────────────────────────────────────────────────────────────────────────────
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '')
const head = (s, n) => s.split('\n').slice(0, n).join('\n')

function listDirs(dir, prefix = 'phase-') {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => n.startsWith(prefix))
    .filter((n) => statSync(join(dir, n)).isDirectory())
    .sort()
}

function gitLog(n = 30) {
  try {
    return execSync(`git log --pretty=format:"%h|%ad|%s" --date=short -n ${n}`, {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .map((l) => {
        const [h, d, ...s] = l.split('|')
        return { h, d, s: s.join('|') }
      })
  } catch {
    return []
  }
}

function fileMtimes(paths) {
  return paths
    .filter(existsSync)
    .map((p) => ({ p, m: statSync(p).mtimeMs }))
    .reduce((a, x) => Math.max(a, x.m), 0)
}

// Parse "tests A→B (+N)" or "tests N+M" from STATE.md (first match = latest).
// Returns { current: number, delta: number|null } or null if not found.
function parseTestsStat(state) {
  const m = state.match(/tests?\s+\d+(?:\+\d+)?\s*→\s*(\d+)(?:\+\d+)?\s*\(\+(\d+)\)/i)
  if (m) return { current: Number(m[1]), delta: Number(m[2]) }
  const m2 = state.match(/tests?\s+(\d+)(?:\+\d+)?/i)
  if (m2) return { current: Number(m2[1]), delta: null }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// Pages — each returns an HTML fragment (shell wraps it)
// ────────────────────────────────────────────────────────────────────────────
function pageDashboard() {
  const state = read(join(PLANNING, 'STATE.md'))
  const stateHead = head(state, 35)
  const commits = gitLog(8)
  const phases = listDirs(PLANNING)
  const adrCount = existsSync(ADR)
    ? readdirSync(ADR).filter((f) => /^\d{4}-.*\.md$/.test(f)).length
    : 0
  const tests = parseTestsStat(state)
  const testTrend =
    tests && tests.delta != null ? ` <span class="trend up">↑${tests.delta}</span>` : ''
  const testBig = tests ? `${tests.current}${testTrend}` : '—'
  return `
<h2>📊 STATE</h2>
<p class="subtitle">最新项目状态（来自 .planning/STATE.md）</p>

<div class="card">
${md(stateHead)}
</div>

<div class="row">
  <div class="stat"><div class="big">${phases.length}</div><div class="lbl">phase 目录</div></div>
  <div class="stat"><div class="big">${adrCount}</div><div class="lbl">ADR 文档</div></div>
  <div class="stat"><div class="big">${testBig}</div><div class="lbl">tests 通过</div></div>
  <div class="stat"><div class="big">${commits.length}</div><div class="lbl">最近 commits</div></div>
</div>

<h3>最近 commits</h3>
<table>
<thead><tr><th>SHA</th><th>日期</th><th>说明</th></tr></thead>
<tbody>
${commits.map((c) => `<tr><td><code>${c.h}</code></td><td>${c.d}</td><td>${esc(c.s.slice(0, 120))}${c.s.length > 120 ? '…' : ''}</td></tr>`).join('')}
</tbody>
</table>
`
}

function pageRoadmap() {
  return `<h2>🗺 Roadmap</h2><p class="subtitle">来自 .planning/ROADMAP.md</p><div class="card">${md(read(join(PLANNING, 'ROADMAP.md')))}</div>`
}

function pageCurrentPhase() {
  const phases = listDirs(PLANNING)
  const latest = phases[phases.length - 1]
  if (!latest) return '<h2>无 phase 目录</h2>'
  const dir = join(PLANNING, latest)
  const sections = [
    ['task_plan.md', '📋 Task Plan'],
    ['progress.md', '✅ Progress'],
    ['VERIFICATION.md', '🔍 Verification'],
    ['PLAN-CHECK.md', '🔬 Plan Check'],
    ['KICKOFF.md', '🚀 Kickoff'],
  ]
  return `<h2>📋 当前 Phase: ${latest}</h2><p class="subtitle">${dir}</p>
${sections
  .map(([f, t]) => {
    const c = read(join(dir, f))
    if (!c) return ''
    return `<div class="card"><h3>${t} <span class="muted">(${f})</span></h3>${md(head(c, 80))}${c.split('\n').length > 80 ? `<p class="muted">… 文件共 ${c.split('\n').length} 行，仅显示前 80 行 …</p>` : ''}</div>`
  })
  .join('')}`
}

function pageHistory() {
  const phases = listDirs(PLANNING).slice().reverse()
  return `<h2>📜 Phase History</h2><p class="subtitle">${phases.length} 个 phase 目录（最新在上）</p>
${phases
  .map((p) => {
    const tp = read(join(PLANNING, p, 'task_plan.md'))
    const sum = tp.split('\n').slice(0, 3).join('\n') || '(空)'
    return `<div class="card"><h3>${p}</h3>${md(sum)}<p class="muted"><a href="#" onclick="loadPage('phase-${p}');return false">查看详情</a></p></div>`
  })
  .join('')}`
}

function pagePhase(name) {
  const dir = join(PLANNING, name)
  if (!existsSync(dir)) return `<h2>未找到 ${name}</h2>`
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  return `<h2>${name}</h2><p class="subtitle">${files.length} 个 md 文件</p>
${files
  .map((f) => {
    const c = read(join(dir, f))
    return `<div class="card"><h3>${f}</h3>${md(head(c, 60))}${c.split('\n').length > 60 ? `<p class="muted">… (${c.split('\n').length} 行) …</p>` : ''}</div>`
  })
  .join('')}`
}

function pageADRs() {
  if (!existsSync(ADR)) return '<h2>docs/adr/ 不存在</h2>'
  const adrs = readdirSync(ADR)
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .sort()
    .reverse()
  return `<h2>📚 ADRs</h2><p class="subtitle">${adrs.length} 个 ADR 文档（最新在上）</p>
${adrs
  .map((f) => {
    const c = read(join(ADR, f))
    const title = c.split('\n')[0].replace(/^#\s*/, '')
    const status = (c.match(/^Status:\s*(.+)$/m) || [])[1] || '?'
    const ctxLine = (c.match(/^##?\s*Context\s*\n([^\n]+)/m) || [])[1] || ''
    return `<div class="card"><h3>${esc(title)}</h3><p><strong>Status:</strong> <span class="badge">${esc(status)}</span></p>${ctxLine ? `<p>${esc(ctxLine.slice(0, 200))}</p>` : ''}<p class="muted"><code>${f}</code></p></div>`
  })
  .join('')}`
}

function pageIntel() {
  const intel = join(PLANNING, 'intel')
  const retro = join(PLANNING, 'RETROSPECTIVE.md')
  let html = '<h2>🔍 Intel & Retrospective</h2>'
  if (existsSync(retro))
    html += `<div class="card"><h3>RETROSPECTIVE.md</h3>${md(head(read(retro), 60))}</div>`
  if (existsSync(intel)) {
    for (const f of readdirSync(intel).filter((x) => x.endsWith('.md'))) {
      const c = read(join(intel, f))
      html += `<div class="card"><h3>${f}</h3>${md(head(c, 40))}${c.split('\n').length > 40 ? '<p class="muted">… (truncated) …</p>' : ''}</div>`
    }
  }
  return html
}

function pageActivity() {
  const commits = gitLog(50)
  return `<h2>💬 Recent Activity</h2><p class="subtitle">最近 ${commits.length} 个 commits</p>
<table><thead><tr><th>SHA</th><th>日期</th><th>说明</th></tr></thead><tbody>
${commits.map((c) => `<tr><td><code>${c.h}</code></td><td>${c.d}</td><td>${esc(c.s)}</td></tr>`).join('')}
</tbody></table>`
}

// ────────────────────────────────────────────────────────────────────────────
// Shell HTML
// ────────────────────────────────────────────────────────────────────────────
const SHELL = `<!doctype html>
<html lang="zh-CN" data-theme="dark"><head><meta charset="utf-8"/>
<title>harnessed STATE</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0d1117;color:#c9d1d9;font-size:14px;line-height:1.6}
.layout{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
.nav{background:#0a0d11;border-right:1px solid #30363d;padding:18px 0;position:sticky;top:0;align-self:start;height:100vh;max-height:100vh;overflow-y:auto}
.nav h1{font-size:15px;margin:0 18px 18px;color:#58a6ff}
.nav .v{font-size:11px;color:#8b949e;margin:-12px 18px 18px}
.nav a{display:block;padding:10px 18px;color:#c9d1d9;text-decoration:none;border-left:3px solid transparent;cursor:pointer;transition:background .15s ease}
.nav a:hover{background:#161b22}
.nav a.active{background:#1f2933;border-left-color:#58a6ff;color:#fff}
.main{padding:24px clamp(24px,4vw,48px);max-width:1100px;margin:0 auto;width:100%}
h2{margin:0 0 4px;color:#fff;font-size:22px}
h3{color:#fff;margin:18px 0 10px;font-size:17px}
.subtitle{color:#8b949e;margin:0 0 18px;font-size:13px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px 18px;margin:14px 0;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.4);border-color:#3b434c}
.row{display:flex;gap:14px;margin:14px 0;flex-wrap:wrap}
.stat{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px 22px;flex:1;min-width:140px;text-align:center;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.stat:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.4);border-color:#3b434c}
.stat .big{font-size:28px;font-weight:700;color:#58a6ff}
.stat .lbl{font-size:12px;color:#8b949e;margin-top:4px}
.trend{font-size:14px;font-weight:600;vertical-align:middle;margin-left:4px}
.trend.up{color:#7ee787}
.trend.down{color:#f0883e}
.muted{color:#8b949e;font-size:12px}
.badge{display:inline-block;background:#1f2933;border:1px solid #30363d;padding:2px 8px;border-radius:10px;font-size:11px;color:#7ee787}
table{width:100%;border-collapse:collapse;margin:10px 0}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #30363d;font-size:13px;vertical-align:top}
th{background:#1f2933;color:#fff;font-weight:600}
tr:hover td{background:#1f2933}
code{background:#1f2933;padding:1px 5px;border-radius:3px;font-family:Consolas,Monaco,monospace;font-size:12px;color:#79c0ff}
pre{background:#1f2933;padding:12px;border-radius:6px;overflow-x:auto}
pre code{background:none;padding:0;color:#c9d1d9}
blockquote{border-left:3px solid #58a6ff;margin:10px 0;padding:6px 14px;background:#0d1117;color:#8b949e}
a{color:#58a6ff;text-decoration:none}a:hover{text-decoration:underline}
hr{border:0;border-top:1px solid #30363d;margin:18px 0}
.top{position:sticky;top:0;z-index:10;display:flex;gap:10px;align-items:center;background:rgba(13,17,23,.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid #30363d;border-radius:6px;padding:8px 14px;margin:0 0 14px;font-size:12px;color:#8b949e}
.dot{width:8px;height:8px;border-radius:50%;background:#7ee787}
.dot.changed{background:#f0883e;animation:p 1s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
ul,ol{padding-left:22px}
/* Phycat-Cherry 借鉴 (dark-friendly): typography + heading decorations + blockquote */
body{font-family:-apple-system,Segoe UI,Roboto,"LXGW WenKai","PingFang SC","Microsoft YaHei",sans-serif;word-spacing:1px}
#content>h2:first-child{text-align:center;padding-bottom:14px;position:relative;margin-bottom:6px}
#content>h2:first-child::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:48px;height:4px;border-radius:4px;background:linear-gradient(90deg,#58a6ff,#7ee787);box-shadow:0 0 0 3px rgba(88,166,255,.1)}
.card h1{font-size:1.55rem;text-align:center;margin:0.6em auto 1em;color:#fff;padding-bottom:10px;position:relative;width:fit-content;min-width:120px}
.card h1::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:40px;height:3px;border-radius:3px;background:linear-gradient(90deg,#58a6ff,#7ee787)}
.card h2{font-size:1.25rem;border-bottom:1px solid #30363d;padding-bottom:6px;margin-top:1.4em;color:#fff}
.card h3{position:relative;padding-left:14px;margin-top:1.2em}
.card h3::before{content:'';position:absolute;left:0;top:8px;width:4px;height:18px;background:linear-gradient(180deg,#58a6ff,#7ee787);border-radius:2px}
.card h4{position:relative;padding-left:20px;margin-top:1em;font-size:1rem;color:#e6edf3}
.card h4::before{content:'';position:absolute;left:0;top:7px;width:9px;height:9px;border-radius:50%;background:transparent;border:2px solid #58a6ff;transition:all .2s ease;box-sizing:border-box}
.card h4:hover::before{background:#58a6ff;box-shadow:0 0 0 3px rgba(88,166,255,.2);transform:scale(1.1)}
.card h5{position:relative;padding-left:14px;margin-top:0.8em;font-size:0.95rem;color:#e6edf3}
.card h5::before{content:'▸';position:absolute;left:0;color:#58a6ff;font-size:0.9em}
.card h6{position:relative;padding-left:14px;margin-top:0.8em;font-size:0.9rem;color:#8b949e}
.card h6::before{content:'—';position:absolute;left:0;color:#58a6ff}
.card p{margin:10px 0;line-height:1.75}
.card li{margin:6px 0;line-height:1.7}
.card hr{border:0;height:1px;background:linear-gradient(90deg,transparent,#30363d 30%,#30363d 70%,transparent);margin:24px 0}
.card strong{color:#e6edf3;font-weight:700}
.card blockquote{position:relative;margin:14px 0;padding:12px 16px 12px 40px;border-left:4px solid #58a6ff;border-radius:0 8px 8px 0;background:rgba(88,166,255,.06);color:#c9d1d9}
.card blockquote::before{content:'❝';position:absolute;left:12px;top:6px;font-size:22px;color:#58a6ff;opacity:.6;line-height:1.2;font-family:Georgia,serif}
.card blockquote p,.card blockquote li{margin:6px 0}
</style></head><body>
<div class="layout">
<nav class="nav">
<h1>harnessed</h1>
<div class="v">STATE · read-only</div>
<select id="proj-sel" style="margin:0 18px 14px;width:calc(100% - 36px);background:#1f2933;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:6px 8px;font-size:12px"></select>
<a data-p="dashboard" class="active">📊 STATE</a>
<a data-p="roadmap">🗺 Roadmap</a>
<a data-p="current">📋 Current Phase</a>
<a data-p="history">📜 Phase History</a>
<a data-p="adrs">📚 ADRs</a>
<a data-p="intel">🔍 Intel & Retro</a>
<a data-p="activity">💬 Activity</a>
</nav>
<main class="main">
<div class="top"><span class="dot" id="dot"></span><span id="t">就绪</span><a href="#" onclick="r();return false">⟳ 刷新</a></div>
<div id="content">loading…</div>
</main>
</div>
<script>
let mt0=0
const content=document.getElementById('content'),dot=document.getElementById('dot'),t=document.getElementById('t')
async function loadPage(p){
  for(const a of document.querySelectorAll('.nav a'))a.classList.toggle('active',a.dataset.p===p||a.dataset.p===p.split('-')[0])
  content.innerHTML='loading…'
  const r=await fetch('/page/'+p);content.innerHTML=await r.text()
  window.scrollTo(0,0)
}
window.loadPage=loadPage
for(const a of document.querySelectorAll('.nav a'))a.onclick=e=>{e.preventDefault();loadPage(a.dataset.p)}
async function r(){
  const cur=document.querySelector('.nav a.active')?.dataset.p||'dashboard'
  await loadPage(cur);dot.classList.remove('changed');t.textContent='已刷新 '+new Date().toLocaleTimeString()
}
// T3.2 (D-04 § 3.2 + B-23 + S1) — SSE replaces 2s polling. EventSource reconnects
// automatically; S1 fix: onopen re-fetches current page (reconnect may miss events).
const es=new EventSource('/events')
es.addEventListener('state-changed',()=>{dot.classList.add('changed');t.textContent='文件有更新, 点击 ⟳ 刷新'})
es.onopen=()=>{const cur=document.querySelector('.nav a.active')?.dataset.p;if(cur)loadPage(cur)}
// T3.3 (D-04 § 3.3) — multi-project selector + history.pushState routing
function loadProject(path){
  history.pushState({project:path},'','?project='+encodeURIComponent(path))
  const cur=document.querySelector('.nav a.active')?.dataset.p||'dashboard'
  loadPage(cur)
}
window.addEventListener('popstate',()=>{const cur=document.querySelector('.nav a.active')?.dataset.p||'dashboard';loadPage(cur)})
fetch('/api/projects').then(r=>r.json()).then(cfg=>{
  const sel=document.getElementById('proj-sel');if(!sel)return
  const qs=new URLSearchParams(location.search).get('project')
  cfg.projects.forEach((p,i)=>{const o=new Option(p.name,p.path);if(qs===p.path)o.selected=true;sel.add(o)})
  sel.onchange=()=>loadProject(sel.value)
}).catch(()=>{})
loadPage('dashboard')
</script>
</body></html>`

// ────────────────────────────────────────────────────────────────────────────
// HTTP server
// ────────────────────────────────────────────────────────────────────────────
const watchedPaths = () => {
  const list = []
  for (const f of ['STATE.md', 'ROADMAP.md', 'RETROSPECTIVE.md']) list.push(join(PLANNING, f))
  for (const d of listDirs(PLANNING)) {
    for (const f of readdirSync(join(PLANNING, d)).filter((x) => x.endsWith('.md')))
      list.push(join(PLANNING, d, f))
  }
  if (existsSync(ADR))
    for (const f of readdirSync(ADR).filter((x) => x.endsWith('.md'))) list.push(join(ADR, f))
  return list
}

// Phase 2.4 W3 T3.2 (D-04 § 3.2 + B-23 + B-24 + B-27 + W5 + S1) — SSE watcher
// replaces 2s polling. Zero npm-dep (only node:fs.watch + node built-in SSE).
// B-24: watch STATE.md only (Win recursive watch is unstable).
// B-27: localhost-only bind (defense against resource exhaustion).
const sseClients = new Set()
let debounceTimer = null
try {
  watch(join(PLANNING, 'STATE.md'), () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const msg = `event: state-changed\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
      for (const r of sseClients) {
        try {
          r.write(msg)
        } catch {
          // dead client — `req.on('close')` will splice it
        }
      }
    }, 500)
  })
} catch {
  // STATE.md may not exist yet (fresh project); SSE will silently no-op
}

const server = createServer((req, res) => {
  const url = req.url || '/'
  if (url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(SHELL)
  }
  if (url === '/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    sseClients.add(res)
    req.on('close', () => sseClients.delete(res))
    return
  }
  if (url === '/mtime') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ max: fileMtimes(watchedPaths()) }))
  }
  // T3.3 — /api/projects + /api/project/<id>/state per D-04 § 3.3
  if (url === '/api/projects') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify(loadProjects()))
  }
  const projMatch = url.match(/^\/api\/project\/(\d+)\/state$/)
  if (projMatch) {
    const idx = Number(projMatch[1])
    const cfg = loadProjects()
    const proj = cfg.projects[idx]
    if (!proj) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      return res.end('project not found')
    }
    const statePath = join(proj.path, '.planning', 'STATE.md')
    if (!existsSync(statePath)) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      return res.end('STATE.md not found in project')
    }
    res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' })
    return res.end(readFileSync(statePath, 'utf8'))
  }
  const pageMatch = url.match(/^\/page\/(.+)$/)
  if (pageMatch) {
    const name = decodeURIComponent(pageMatch[1])
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    if (name === 'dashboard') return res.end(pageDashboard())
    if (name === 'roadmap') return res.end(pageRoadmap())
    if (name === 'current') return res.end(pageCurrentPhase())
    if (name === 'history') return res.end(pageHistory())
    if (name === 'adrs') return res.end(pageADRs())
    if (name === 'intel') return res.end(pageIntel())
    if (name === 'activity') return res.end(pageActivity())
    if (name.startsWith('phase-phase-')) return res.end(pagePhase(name.replace('phase-', '')))
    return res.end(`<h2>未知页面 ${esc(name)}</h2>`)
  }
  res.writeHead(404)
  res.end('not found')
})

// Probe port — if occupied, another dashboard is already running, exit 0 silent.
// (Makes this script idempotent + safe to invoke from CC hooks repeatedly.)
function start() {
  // T3.2 (B-27 R5 mitigation) — localhost-only bind. Prevents external clients
  // from connecting to /events and exhausting SSE client set / fs.watch.
  server.listen(PORT, '127.0.0.1', () => {
    const url = `http://localhost:${PORT}`
    console.log(`\n  harnessed dashboard: ${url}\n  (Ctrl+C to stop)\n`)
    if (NO_OPEN) return
    const opener =
      process.platform === 'win32'
        ? { cmd: 'cmd', args: ['/c', 'start', '""', url] }
        : process.platform === 'darwin'
          ? { cmd: 'open', args: [url] }
          : { cmd: 'xdg-open', args: [url] }
    try {
      spawn(opener.cmd, opener.args, { detached: true, stdio: 'ignore' }).unref()
    } catch {
      // best-effort browser open; user can copy url manually
    }
  })
}

const probe = createConnection({ port: PORT, host: '127.0.0.1' })
probe.once('connect', () => {
  probe.end()
  console.log(`dashboard already running on http://localhost:${PORT}`)
  process.exit(0)
})
probe.once('error', () => {
  probe.destroy()
  start()
})
