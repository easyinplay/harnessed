import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'

let root: string
const SCRIPT = resolve('scripts/check-workflow-schema.mjs')

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'capabilities-host-schema-'))
  mkdirSync(join(root, 'workflows'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

function document(by_host?: unknown) {
  return {
    schema_version: 'harnessed.capabilities.v1',
    capabilities: {
      'planning-with-files': {
        impl: 'claude-code-plugin',
        cmd: '/plan',
        since: 'v2.0',
        category: 'tool-plugin',
        install_type: 'plugin',
        plugin_id: 'planning-with-files',
        ...(by_host === undefined ? {} : { by_host }),
      },
    },
  }
}

describe('host-specific presence metadata in TypeBox and the standalone schema mirror', () => {
  it.each([
    ['legacy top-level contract', undefined, true],
    [
      'Codex user-skill override',
      {
        codex: {
          cmd: '$planning-with-files',
          install_type: 'user-skill',
          skill_dir: 'planning-with-files',
        },
      },
      true,
    ],
    [
      'same presence type shapes as top-level',
      {
        codex: { install_type: ['plugin', 'user-skill'], skill_dir: 'planning-with-files' },
      },
      true,
    ],
    ['unknown host', { typo: { install_type: 'user-skill' } }, false],
    ['unknown install type', { codex: { install_type: 'npm' } }, false],
    ['empty install type array', { codex: { install_type: [] } }, false],
    ['non-string skill dir', { codex: { skill_dir: 42 } }, false],
    ['undeclared override metadata', { codex: { plugin_id: 'unneeded-field' } }, false],
  ])('%s', (_name, by_host, valid) => {
    const doc = document(by_host)
    expect(Value.Check(Capabilities, doc)).toBe(valid)
    writeFileSync(join(root, 'workflows', 'capabilities.yaml'), JSON.stringify(doc))
    const result = spawnSync(process.execPath, [SCRIPT], {
      encoding: 'utf8',
      env: { ...process.env, HARNESSED_CHECK_ROOT: root },
    })
    expect(result.status, result.stderr).toBe(valid ? 0 : 1)
    if (valid) expect(result.stdout).toContain('Workflow schema validation passed')
    else expect(result.stderr).toContain('capabilities.yaml')
  })
})
