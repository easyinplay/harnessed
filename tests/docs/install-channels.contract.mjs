// Run with: node --test tests/docs/install-channels.contract.mjs
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (file) => readFileSync(resolve(root, file), 'utf8').replaceAll('\r\n', '\n')
const readmes = readdirSync(root).filter((file) => /^README(?:-[\w-]+)?\.md$/.test(file))
const english = read('README.md')
const guide = read('INSTALL-WITH-AI.md')
const installPrefix = (text) => text.slice(0, text.indexOf('\n## ', text.indexOf('\n## ') + 1))
const firstMinutes = (text) => text.split('\n## ')[2]

test('all 11 READMEs retain the same ten-language navigation and local targets', () => {
  assert.equal(readmes.length, 11)
  const navigation = (text) => text.split('\n')[4]
  const labels = (text) =>
    navigation(text)
      .replaceAll(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replaceAll('**', '')
  for (const file of readmes) {
    assert.equal(labels(read(file)), labels(english), file)
    const links = [...navigation(read(file)).matchAll(/\]\(\.\/(README[^)]+)\)/g)]
    assert.equal(links.length, 9, file)
    for (const [, target] of links) assert.ok(existsSync(resolve(root, target)), target)
  }
})

test('English compatibility mirror differs only by its compatibility note', () => {
  const note = '> Compatibility mirror of the canonical English [README.md](./README.md).\n\n'
  assert.ok(read('README-en.md').includes(note))
  assert.equal(read('README-en.md').replace(note, ''), english)
})

test('Bun is a secondary recommendation and remains optional in every locale', () => {
  const labels = {
    'README.md': 'Via Bun (secondary recommendation; optional)',
    'README-en.md': 'Via Bun (secondary recommendation; optional)',
    'README-zh.md': '次要推荐; 可选',
    'README-tw.md': '次要推薦; 可選',
    'README-ja.md': '第 2 の推奨手段; 任意',
    'README-ko.md': '보조 권장 경로; 선택 사항',
    'README-pt-BR.md': 'recomendação secundária; opcional',
    'README-tr.md': 'ikinci öneri; isteğe bağlı',
    'README-ru.md': 'второй рекомендуемый вариант; необязательно',
    'README-vi.md': 'khuyến nghị thứ hai; tùy chọn',
    'README-th.md': 'คำแนะนำลำดับที่สอง; ไม่บังคับ',
  }
  for (const file of readmes) {
    const heading = installPrefix(read(file))
      .split('\n')
      .find((line) => /^\*\*[^\n]*Bun/.test(line))
    assert.ok(heading?.includes(labels[file]), `${file}: secondary and optional label`)
  }
  assert.ok(guide.includes('Bun (次要推荐; 可选)'))
})

for (const file of readmes) {
  test(`${file}: binary before Bun before npm, with explicit Bun commands`, () => {
    const install = installPrefix(read(file))
    const binary = install.indexOf('install.sh | bash')
    const bun = install.indexOf('bun install -g harnessed')
    const npm = install.indexOf('npm install -g harnessed')
    assert.ok(binary >= 0 && binary < bun && bun < npm, file)
    for (const command of [
      'bun add -g harnessed',
      'bun run --bun harnessed --version',
      'bun run --bun harnessed setup --platform codex',
      'bun run --bun harnessed doctor --host codex',
      'bun run --bun harnessed update --package-manager bun',
    ])
      assert.ok(install.includes(command), `${file}: ${command}`)
    assert.ok(install.includes('Node.js >= 22'), file)
    assert.ok(install.includes('Node/npm'), file)
    assert.ok(install.includes('Python'), file)
    assert.ok(install.includes('shim'), file)
    assert.ok(install.includes('claude'), file)
  })
}

test('First 5 Minutes distinguishes Claude Code and Codex prompts from shell commands', () => {
  for (const file of readmes) {
    const text = firstMinutes(read(file))
    for (const token of [
      'Claude Code',
      'Codex',
      '/auto "',
      '$auto "',
      'shell',
      'bun run --bun harnessed',
    ]) {
      assert.ok(text.includes(token), `${file}: ${token}`)
    }
    for (const [, block] of text.matchAll(/```(?:bash|powershell|sh)\n([\s\S]*?)```/g)) {
      assert.doesNotMatch(block, /^(?:\/auto|\$auto)\s/m, file)
    }
  }
})

test('English and Chinese keep runtime requirements independent from the install manager', () => {
  for (const file of ['README.md', 'README-zh.md']) {
    const install = installPrefix(read(file))
    assert.ok(install.includes('bun run --bun harnessed setup --platform <host>'))
    for (const token of ['runtime', 'shebang', 'install manager']) {
      assert.ok(install.includes(token), `${file}: ${token}`)
    }
    assert.match(install, /neither external Node\.js nor Bun|不需要外部 Node\.js 或 Bun/)
    assert.match(install, /Bun is not required for this channel|此渠道不需要 Bun/)
    assert.match(install, /package updates keep the npm default|package 更新保留 npm 默认语义/)
  }
})

test('AI guide keeps the five-step binary/package-alternative/setup/doctor/skills flow', () => {
  assert.deepEqual(
    [...guide.matchAll(/^(\d+)\. \*\*/gm)].map((match) => Number(match[1])),
    [1, 2, 3, 4, 5],
  )
  const steps = guide.split(/^\d+\. \*\*/m).slice(1)
  assert.ok(steps[0].includes('install.sh | bash'))
  assert.ok(steps[0].includes('跳过步骤 3'))
  assert.ok(steps[0].includes('转步骤 2'))
  assert.ok(
    steps[1].indexOf('bun install -g harnessed') < steps[1].indexOf('npm install -g harnessed'),
  )
  assert.ok(steps[1].includes('二选一'))
  assert.ok(steps[2].includes('bun run --bun harnessed setup --platform <host>'))
  assert.ok(
    steps[2].includes('bun run --bun harnessed setup --platform codex --system --non-interactive'),
  )
  assert.ok(steps[3].includes('bun run --bun harnessed doctor --host codex'))
  assert.ok(steps[4].includes('~/.agents/skills/'))
  assert.ok(steps[4].includes('~/.codex/skills/'))
})

test('AI guide preserves consent, package-manager defaults, and explicit user removal', () => {
  for (const token of [
    '先取得批准',
    '不要自动卸载旧安装',
    '不得自动卸载',
    '不能只为让检查通过而扩大授权',
    '不得把缺失依赖或未验证步骤记为成功',
    'bun remove -g harnessed',
    'npm i -g harnessed@latest',
    'bun run --bun harnessed update --package-manager bun',
    '/auto "<需求>"',
    '$auto "<需求>"',
  ])
    assert.ok(guide.includes(token), token)
})

test('README/guide links and CONTRIBUTING runtime-section links resolve', () => {
  for (const file of [...readmes, 'INSTALL-WITH-AI.md', 'CONTRIBUTING.md']) {
    // Existing contributor history links are outside this installation-doc contract.
    const text =
      file === 'CONTRIBUTING.md'
        ? read(file).split('### Runtime ')[1]?.split('\n## Setup')[0]
        : read(file)
    assert.ok(text, `${file}: scoped content exists`)
    for (const [, target] of text.matchAll(/\]\((\.\/?[^\s)#]+)(?:#[^)]*)?\)/g)) {
      assert.ok(existsSync(resolve(root, decodeURIComponent(target))), `${file}: ${target}`)
    }
    for (const [, target] of text.matchAll(/src="(\.\/[^"#]+)"/g)) {
      assert.ok(existsSync(resolve(root, target)), `${file}: ${target}`)
    }
  }
})
