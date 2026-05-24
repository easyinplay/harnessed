// Phase 2.2 Wave 2 T2.5 — unit tests for src/routing/lib/sdkReconcile.ts.
// Locks contract v1.2: 14-字段 AgentDefinition → SDK 5-字段 input +
// prompt-inject 9 字段. PATTERNS § 2.3 inline correction (T1.1 evidence).

import { describe, expect, it } from 'vitest'
import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'
import {
  injectFactoryInternalFields,
  toSdkAgentDefinition,
} from '../../src/workflow/lib/sdkReconcile.js'

const fullDef: AgentDefinition = {
  description: 'test agent',
  prompt: 'core prompt body',
  tools: ['Read', 'Grep'],
  disallowedTools: ['Skill(off)'],
  model: 'sonnet',
  skills: ['brainstorming', 'tdd'],
  mcpServers: { 'gh-cli': {} },
  memory: 'project',
  maxTurns: 50,
  background: false,
  effort: 'medium',
  permissionMode: 'default',
  initialPrompt: 'first user turn',
  criticalSystemReminder_EXPERIMENTAL: 'CRITICAL note',
}

describe('toSdkAgentDefinition — 14 → 5 字段 unpack (T1.1 SDK input layer)', () => {
  it('returns exactly 5 SDK-input keys when all optional fields present', () => {
    const sdk = toSdkAgentDefinition(fullDef)
    const keys = Object.keys(sdk).sort()
    expect(keys).toEqual(['description', 'disallowedTools', 'model', 'prompt', 'tools'])
  })

  it('strips tools/disallowedTools/model when absent (only required: description + prompt)', () => {
    const minimal: AgentDefinition = { description: 'd', prompt: 'p' }
    const sdk = toSdkAgentDefinition(minimal)
    expect(Object.keys(sdk).sort()).toEqual(['description', 'prompt'])
  })

  it('passes through values 1:1 with no transformation', () => {
    const sdk = toSdkAgentDefinition(fullDef)
    expect(sdk.description).toBe('test agent')
    expect(sdk.prompt).toBe('core prompt body')
    expect(sdk.tools).toEqual(['Read', 'Grep'])
    expect(sdk.disallowedTools).toEqual(['Skill(off)'])
    expect(sdk.model).toBe('sonnet')
  })

  it('does NOT carry any of the 9 prompt-inject fields (skills/memory/maxTurns/...)', () => {
    const sdk = toSdkAgentDefinition(fullDef)
    expect(sdk).not.toHaveProperty('skills')
    expect(sdk).not.toHaveProperty('memory')
    expect(sdk).not.toHaveProperty('maxTurns')
    expect(sdk).not.toHaveProperty('background')
    expect(sdk).not.toHaveProperty('effort')
    expect(sdk).not.toHaveProperty('permissionMode')
    expect(sdk).not.toHaveProperty('mcpServers')
    expect(sdk).not.toHaveProperty('initialPrompt')
    expect(sdk).not.toHaveProperty('criticalSystemReminder_EXPERIMENTAL')
  })
})

describe('injectFactoryInternalFields — 9 字段 prompt augmentation', () => {
  it('injects all 9 fields when present (section header per field)', () => {
    const augmented = injectFactoryInternalFields(fullDef, 'BASE')
    expect(augmented).toContain('BASE')
    expect(augmented).toContain('## Available skills')
    expect(augmented).toContain('brainstorming')
    expect(augmented).toContain('## MCP servers')
    expect(augmented).toContain('gh-cli')
    expect(augmented).toContain('## Memory')
    expect(augmented).toContain('project')
    expect(augmented).toContain('## Turn budget')
    expect(augmented).toContain('50 turns max.')
    expect(augmented).toContain('## Effort')
    expect(augmented).toContain('medium')
    expect(augmented).toContain('## Permission mode')
    expect(augmented).toContain('default')
    expect(augmented).toContain('## Initial prompt')
    expect(augmented).toContain('first user turn')
    expect(augmented).toContain('## CRITICAL')
    expect(augmented).toContain('CRITICAL note')
  })

  it('preserves basePrompt as the first section (KARPATHY prepend pattern)', () => {
    const augmented = injectFactoryInternalFields(fullDef, 'BASE_PROMPT_FIRST')
    expect(augmented.startsWith('BASE_PROMPT_FIRST')).toBe(true)
  })

  it('emits ONLY basePrompt when no optional fields are set', () => {
    const minimal: AgentDefinition = { description: 'd', prompt: 'p' }
    const augmented = injectFactoryInternalFields(minimal, 'BASE')
    expect(augmented).toBe('BASE')
  })

  it('partial injection — only present fields appear (mcpServers + memory absent)', () => {
    const partial: AgentDefinition = {
      description: 'd',
      prompt: 'p',
      skills: ['tdd'],
      maxTurns: 10,
    }
    const augmented = injectFactoryInternalFields(partial, 'BASE')
    expect(augmented).toContain('## Available skills')
    expect(augmented).toContain('## Turn budget')
    expect(augmented).not.toContain('## MCP servers')
    expect(augmented).not.toContain('## Memory')
    expect(augmented).not.toContain('## CRITICAL')
  })

  it('skips mcpServers section when object is empty (Object.keys length 0)', () => {
    const def: AgentDefinition = { description: 'd', prompt: 'p', mcpServers: {} }
    const augmented = injectFactoryInternalFields(def, 'BASE')
    expect(augmented).not.toContain('## MCP servers')
  })
})
