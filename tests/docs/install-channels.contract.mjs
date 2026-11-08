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

test('all 10 READMEs retain the same ten-language navigation and local targets', () => {
  assert.equal(readmes.length, 10)
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

// The install section documents one channel only: the standalone binary.
// The npm / bun channels still exist in the product (install scripts, npm
// publish, `harnessed update` self-update), but the READMEs must not advertise
// them, so the section must not name an install-manager command.
for (const file of readmes) {
  test(`${file}: binary-only install channel with upstream runtime boundaries`, () => {
    const install = installPrefix(read(file))
    assert.ok(install.includes('install.sh | bash'), file)
    assert.ok(install.includes('install.ps1 | iex'), file)
    // Upstream components may still need Node/npm, Git, Bun, Python or browser
    // libraries, so the boundary sentence stays even though the install channel
    // is binary-only. Every locale keeps the literal tokens 'Node/npm',
    // 'Python' and 'runtime' (measured across all 10 locales).
    for (const token of ['Node/npm', 'Python', 'runtime']) {
      assert.ok(install.includes(token), `${file}: ${token}`)
    }
    for (const token of [
      'bun install -g harnessed',
      'npm install -g harnessed',
      'Windows PowerShell 5.x',
      'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
    ]) {
      assert.ok(!install.includes(token), `${file}: ${token} must be absent`)
    }
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

test('README is the installation source without a separate AI guide', () => {
  assert.equal(existsSync(resolve(root, 'INSTALL-WITH-AI.md')), false)
})

test('all READMEs drop the AI-install promotion', () => {
  for (const file of readmes) {
    const text = read(file)
    assert.doesNotMatch(text, /INSTALL-WITH-AI\.md|Install harnessed for me following the guide/)
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
