import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { parse } from 'yaml'

it('keeps browser CLI dispatch separate from the project-level TypeScript runner', () => {
  const { capabilities } = parse(readFileSync(resolve('workflows/capabilities.yaml'), 'utf8'))
  expect(capabilities['playwright-cli']).toMatchObject({
    cmd: 'playwright-cli',
    category: 'tool-bundled-skill',
  })
  expect(capabilities['playwright-test']).toMatchObject({
    cmd: '@playwright/test',
    category: 'tool-plugin',
  })
  expect(capabilities['playwright-test'].description).toContain('project-level dependency')
  const row = readFileSync(resolve('docs/WORKFLOW.md'), 'utf8')
    .split('\n')
    .find((line) => line.startsWith('| `playwright-test` |'))
  expect(row).toBe('| `playwright-test` | npm-cli | `@playwright/test` | project-level package |')
})
