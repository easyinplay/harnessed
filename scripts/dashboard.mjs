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
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { createConnection } from 'node:net'
import { join } from 'node:path'

const PORT = 47180
const ROOT = process.cwd()
const PLANNING = join(ROOT, '.planning')
const ADR = join(ROOT, 'docs', 'adr')
const NO_OPEN = process.argv.includes('--no-open')

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

// ────────────────────────────────────────────────────────────────────────────
// Pages — each returns an HTML fragment (shell wraps it)
// ────────────────────────────────────────────────────────────────────────────
function pageDashboard() {
  const state = read(join(PLANNING, 'STATE.md'))
  const stateHead = head(state, 35)
  const commits = gitLog(8)
  const phases = listDirs(PLANNING)
  return `
<h2>📊 Dashboard</h2>
<p class="subtitle">最新项目状态（来自 .planning/STATE.md）</p>

<div class="card">
${md(stateHead)}
</div>

<div class="row">
  <div class="stat"><div class="big">${phases.length}</div><div class="lbl">phase 目录</div></div>
  <div class="stat"><div class="big">${listDirs(ADR, '').filter((f) => /^\d{4}-/.test(f)).length}</div><div class="lbl">ADR 文档</div></div>
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
  const phases = listDirs(PLANNING)
  return `<h2>📜 Phase History</h2><p class="subtitle">${phases.length} 个 phase 目录</p>
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
  return `<h2>📚 ADRs</h2><p class="subtitle">${adrs.length} 个 ADR 文档</p>
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
<title>harnessed dashboard</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0d1117;color:#c9d1d9;font-size:14px;line-height:1.6}
.layout{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
.nav{background:#161b22;border-right:1px solid #30363d;padding:18px 0}
.nav h1{font-size:15px;margin:0 18px 18px;color:#58a6ff}
.nav .v{font-size:11px;color:#8b949e;margin:-12px 18px 18px}
.nav a{display:block;padding:10px 18px;color:#c9d1d9;text-decoration:none;border-left:3px solid transparent;cursor:pointer}
.nav a:hover{background:#21262d}
.nav a.active{background:#1f2933;border-left-color:#58a6ff;color:#fff}
.main{padding:24px 32px;max-width:1100px}
h2{margin:0 0 4px;color:#fff;font-size:22px}
h3{color:#fff;margin:18px 0 10px;font-size:17px}
.subtitle{color:#8b949e;margin:0 0 18px;font-size:13px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px 18px;margin:14px 0}
.row{display:flex;gap:14px;margin:14px 0;flex-wrap:wrap}
.stat{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px 22px;flex:1;min-width:140px;text-align:center}
.stat .big{font-size:28px;font-weight:700;color:#58a6ff}
.stat .lbl{font-size:12px;color:#8b949e;margin-top:4px}
.muted{color:#8b949e;font-size:12px}
.badge{display:inline-block;background:#1f2933;border:1px solid #30363d;padding:2px 8px;border-radius:10px;font-size:11px;color:#7ee787}
table{width:100%;border-collapse:collapse;margin:10px 0}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #30363d;font-size:13px;vertical-align:top}
th{background:#1f2933;color:#fff;font-weight:600}
tr:hover td{background:#1f2933}
code{background:#1f2933;padding:1px 5px;border-radius:3px;font-family:Consolas,Monaco,monospace;font-size:12px;color:#79c0ff}
pre{background:#1f2933;padding:12px;border-radius:6px;overflow-x:auto}
pre code{background:none;padding:0;color:#c9d1d9}
blockquote{border-left:3px solid #58a6ff;margin:10px 0;padding:6px 14px;background:#161b22;color:#8b949e}
a{color:#58a6ff;text-decoration:none}a:hover{text-decoration:underline}
hr{border:0;border-top:1px solid #30363d;margin:18px 0}
.top{position:fixed;top:14px;right:18px;display:flex;gap:10px;align-items:center;background:#161b22;border:1px solid #30363d;padding:6px 12px;border-radius:6px;font-size:12px;color:#8b949e}
.dot{width:8px;height:8px;border-radius:50%;background:#7ee787}
.dot.changed{background:#f0883e;animation:p 1s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
ul,ol{padding-left:22px}
</style></head><body>
<div class="top"><span class="dot" id="dot"></span><span id="t">就绪</span><a href="#" onclick="r();return false">⟳ 刷新</a></div>
<div class="layout">
<nav class="nav">
<h1>harnessed</h1>
<div class="v">dashboard · read-only</div>
<a data-p="dashboard" class="active">📊 Dashboard</a>
<a data-p="roadmap">🗺 Roadmap</a>
<a data-p="current">📋 Current Phase</a>
<a data-p="history">📜 Phase History</a>
<a data-p="adrs">📚 ADRs</a>
<a data-p="intel">🔍 Intel & Retro</a>
<a data-p="activity">💬 Activity</a>
</nav>
<main class="main" id="main">loading…</main>
</div>
<script>
let mt0=0
const main=document.getElementById('main'),dot=document.getElementById('dot'),t=document.getElementById('t')
async function loadPage(p){
  for(const a of document.querySelectorAll('.nav a'))a.classList.toggle('active',a.dataset.p===p||a.dataset.p===p.split('-')[0])
  main.innerHTML='loading…'
  const r=await fetch('/page/'+p);main.innerHTML=await r.text()
  window.scrollTo(0,0)
}
window.loadPage=loadPage
for(const a of document.querySelectorAll('.nav a'))a.onclick=e=>{e.preventDefault();loadPage(a.dataset.p)}
async function r(){
  const cur=document.querySelector('.nav a.active')?.dataset.p||'dashboard'
  await loadPage(cur);dot.classList.remove('changed');t.textContent='已刷新 '+new Date().toLocaleTimeString()
  const m=await(await fetch('/mtime')).json();mt0=m.max
}
async function poll(){
  try{const m=await(await fetch('/mtime')).json()
    if(mt0&&m.max>mt0){dot.classList.add('changed');t.textContent='文件有更新，点击 ⟳ 刷新'}
    if(!mt0)mt0=m.max
  }catch{}
}
loadPage('dashboard');setInterval(poll,2000)
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

const server = createServer((req, res) => {
  const url = req.url || '/'
  if (url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(SHELL)
  }
  if (url === '/mtime') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ max: fileMtimes(watchedPaths()) }))
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
  server.listen(PORT, () => {
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
