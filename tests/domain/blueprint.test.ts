import { describe, expect, test } from 'vitest'
import { DEFAULT_INPUT, buildBlueprint, parseSavedBlueprint, serializeLabInput } from '../../src/domain'
import type { LabInput, NodeId } from '../../src/domain'
import { allConfigurations } from './fixtures'

describe('architecture heuristic', () => {
  test('uses the simplest fixed sequence by default', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT })
    expect(blueprint.pattern).toBe('pipeline')
    expect(blueprint.nodes.map(node => node.id)).toEqual(['input', 'retrieve', 'work', 'validate', 'output'])
    expect(blueprint.explanation).toEqual(['fixed_sequence', 'retrieve_before_work', 'validate_before_effects', 'bounded_retry_budget', 'simulation_only'])
  })

  test('represents fixed independent work using a fan-out router and join', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT, retrieval: false, parallel: true })
    expect(blueprint.pattern).toBe('router')
    expect(blueprint.edges).toEqual([
      { from: 'input', to: 'route' },
      { from: 'route', to: 'work-a' }, { from: 'route', to: 'work-b' },
      { from: 'work-a', to: 'validate' }, { from: 'work-b', to: 'validate' },
      { from: 'validate', to: 'output' },
    ])
    expect(blueprint.explanation).toContain('independent_branches')
  })

  test('chooses bounded decomposition for open tasks with optional parallel branches', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT, taskShape: 'open', parallel: true })
    expect(blueprint.pattern).toBe('orchestrator')
    expect(blueprint.nodes.some(node => node.kind === 'plan')).toBe(true)
    expect(blueprint.explanation).toContain('dynamic_decomposition')
    expect(blueprint.explanation).toContain('independent_branches')
  })

  test('separates modeled controls from recommendations to implement', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT, taskShape: 'open', sideEffects: 'irreversible', maxRetries: 0 })
    const state = Object.fromEntries(blueprint.checklist.map(item => [item.code, item.state]))
    expect(state.human_approval).toBe('enabled')
    expect(state.checkpointing).toBe('recommended')
    expect(state.idempotent_actions).toBe('recommended')
    expect(state.iteration_budget).toBe('recommended')
    expect(state.observability).toBe('recommended')
    expect(state.bounded_retries).toBe('enabled')
    expect(blueprint.explanation).toContain('no_automatic_retries')
  })

  test('does not retain or mutate the caller input', () => {
    const input: LabInput = { ...DEFAULT_INPUT }
    const blueprint = buildBlueprint(input)
    input.sideEffects = 'irreversible'
    expect(blueprint.input.sideEffects).toBe('none')
    blueprint.input.parallel = true
    expect(DEFAULT_INPUT.parallel).toBe(false)
  })
})

describe('exhaustive configuration properties', () => {
  test('covers all 192 configurations with deterministic connected acyclic safe graphs', () => {
    const configs = allConfigurations()
    expect(configs.length).toBe(192)
    for (const input of configs) {
      const blueprint = buildBlueprint(input)
      expect(buildBlueprint(input)).toEqual(blueprint)
      expect(parseSavedBlueprint(serializeLabInput(input))).toEqual({ ok: true, value: input })
      expect(blueprint.pattern).toBe(input.taskShape === 'open' ? 'orchestrator' : input.parallel ? 'router' : 'pipeline')
      const ids = blueprint.nodes.map(node => node.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids[0]).toBe('input')
      expect(ids.at(-1)).toBe('output')
      expect(new Set(blueprint.explanation).size).toBe(blueprint.explanation.length)
      expect(new Set(blueprint.checklist.map(item => item.code)).size).toBe(blueprint.checklist.length)
      const reached = new Set<NodeId>(['input'])
      for (const edge of blueprint.edges) {
        expect(ids).toContain(edge.from)
        expect(ids).toContain(edge.to)
        expect(ids.indexOf(edge.from)).toBeLessThan(ids.indexOf(edge.to))
        expect(reached.has(edge.from)).toBe(true)
        reached.add(edge.to)
      }
      expect(reached.size).toBe(ids.length)
      expect(ids.includes('retrieve')).toBe(input.retrieval)
      expect(ids.includes('checkpoint')).toBe(input.resumable)
      expect(ids.includes('action')).toBe(input.sideEffects !== 'none')
      expect(ids.includes('approval')).toBe(input.sideEffects === 'irreversible')
      expect(blueprint.nodes.filter(node => node.kind === 'work').length).toBe(input.parallel ? 2 : 1)
      if (input.sideEffects !== 'none') {
        expect(ids.indexOf('validate')).toBeLessThan(ids.indexOf('action'))
        if (input.resumable) expect(ids.indexOf('checkpoint')).toBeLessThan(ids.indexOf('action'))
      }
      if (input.sideEffects === 'irreversible') {
        expect(blueprint.edges.filter(edge => edge.to === 'action')).toEqual([{ from: 'approval', to: 'action' }])
        expect(ids.indexOf('validate')).toBeLessThan(ids.indexOf('approval'))
      }
    }
  })
})
