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
})

for (const file of readmes) {
  test(`${file}: binary before optional Bun before npm, with runtime boundaries`, () => {
    const install = installPrefix(read(file))
    const binary = install.indexOf('install.sh | bash')
    const bun = install.indexOf('bun install -g harnessed')
    const npm = install.indexOf('npm install -g harnessed')
    assert.ok(binary >= 0 && binary < bun && bun < npm, file)
    assert.ok(install.includes('Node.js >= 22'), file)
    assert.ok(install.includes('Node/npm'), file)
    assert.ok(install.includes('Python'), file)
    assert.ok(install.slice(0, bun).includes('runtime'), `${file}: embedded binary runtime`)
    assert.ok(install.includes('Windows PowerShell 5.x'), file)
    assert.ok(install.includes('PowerShell 7+'), file)
  })

  test(`${file}: Bun has one install/setup block and one short explicit-runner caveat`, () => {
    const install = installPrefix(read(file))
    const blocks = [...install.matchAll(/```(?:bash|powershell|sh|text)\n([\s\S]*?)```/g)]
    const chain = 'bun install -g harnessed && bun run --bun harnessed setup'
    const bunBlock = blocks.find(([, block]) => block.includes('bun install -g harnessed'))
    assert.equal(bunBlock?.[1].trim(), chain, `${file}: first Bun block is install + setup`)
    assert.equal(blocks.length, 4, `${file}: two binary blocks and one per package channel`)
    assert.doesNotMatch(install, /--platform(?:\s+|=)auto\b/)
    assert.doesNotMatch(install, /--package-manager bun/)
    assert.ok(install.includes('npm install -g harnessed && harnessed setup'), file)
    const setupBlocks = blocks.filter(([, block]) =>
      block.includes('bun run --bun harnessed setup'),
    )
    assert.equal(setupBlocks.length, 1, `${file}: only the default setup chain`)
    const bunStart = install.indexOf('bun install -g harnessed')
    const npmHeading = install.indexOf('\n**', bunStart)
    const bun = install.slice(bunStart, npmHeading)
    const caveat = bun.slice(bun.indexOf('```') + 3).trim()
    assert.equal(caveat.split(/\n\s*\n/).length, 1, `${file}: one caveat paragraph`)
    for (const token of ['`bun run --bun harnessed`', '`harnessed`', 'shim', 'Node.js']) {
      assert.ok(caveat.includes(token), `${file}: ${token}`)
    }
    assert.ok(caveat.length <= 240, `${file}: concise runner caveat`)
    assert.doesNotMatch(bun, /--platform|bun add -g|bun remove -g|--version|doctor|@latest/)
    assert.doesNotMatch(
      install.slice(0, install.indexOf('bun install -g harnessed')),
      /^harnessed setup/m,
    )
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
    assert.ok(install.includes('bun install -g harnessed && bun run --bun harnessed setup'))
    assert.ok(install.includes('npm install -g harnessed && harnessed setup'))
    assert.match(install, /neither external Node\.js nor Bun|不需要外部 Node\.js 或 Bun/)
    assert.match(install, /Bun is not required for this channel|此渠道不需要 Bun/)
  }
})

test('README is the installation source without a separate AI guide', () => {
  assert.equal(existsSync(resolve(root, 'INSTALL-WITH-AI.md')), false)
})

test('all READMEs drop the AI-install promotion but retain the unrelated Agent Teams tip', () => {
  for (const file of readmes) {
    const text = read(file)
    assert.doesNotMatch(text, /INSTALL-WITH-AI\.md|Install harnessed for me following the guide/)
    const install = installPrefix(text)
    assert.ok(install.includes('> [!TIP]'), file)
    assert.ok(install.includes('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'), file)
    assert.ok(install.includes('~/.claude/settings.json'), file)
  }
})

test('README links and CONTRIBUTING runtime-section links resolve', () => {
  for (const file of [...readmes, 'CONTRIBUTING.md']) {
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
