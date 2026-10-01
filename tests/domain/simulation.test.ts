import { describe, expect, test } from 'vitest'
import { DEFAULT_INPUT, buildBlueprint, simulate } from '../../src/domain'
import type { Fault, LabInput } from '../../src/domain'
import { allConfigurations } from './fixtures'

describe('deterministic failure simulation', () => {
  test('successful trace is only a simulation and has no invented outputs or measurements', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT, sideEffects: 'irreversible', resumable: true })
    const result = simulate(blueprint)
    expect(result.finalState).toBe('completed')
    expect(result.checkpointAvailable).toBe(true)
    expect(result.events.every(event => event.status === 'ok')).toBe(true)
    expect(result.events.find(event => event.nodeId === 'approval')?.code).toBe('approval_granted_simulated')
    expect(result.events.find(event => event.nodeId === 'action')?.code).toBe('action_simulated')
    expect(Object.keys(result)).toEqual(['events', 'finalState', 'checkpointAvailable'])
  })

  test('zero retries still makes exactly one attempt', () => {
    const result = simulate(buildBlueprint({ ...DEFAULT_INPUT, maxRetries: 0 }), 'timeout')
    expect(result.events.filter(event => event.nodeId === 'work')).toEqual([{ nodeId: 'work', status: 'failed', code: 'timeout_exhausted', attempt: 1 }])
    expect(result.events.some(event => event.status === 'retry')).toBe(false)
  })

  test('three retries cap total attempts at four with no simulated action', () => {
    const result = simulate(buildBlueprint({ ...DEFAULT_INPUT, maxRetries: 3, sideEffects: 'irreversible' }), 'timeout')
    expect(result.events.filter(event => event.nodeId === 'work').map(event => event.attempt)).toEqual([1, 2, 3, 4])
    expect(result.events.filter(event => event.status === 'retry').length).toBe(3)
    expect(result.events.find(event => event.nodeId === 'action')).toEqual({ nodeId: 'action', status: 'skipped', code: 'upstream_stopped' })
  })

  test('invalid combined outputs regenerate both branches within the retry budget', () => {
    const result = simulate(buildBlueprint({ ...DEFAULT_INPUT, parallel: true, maxRetries: 2 }), 'invalid_output')
    for (const id of ['work-a', 'work-b']) {
      expect(result.events.filter(event => event.nodeId === id).map(event => event.attempt)).toEqual([1, 2, 3])
    }
    expect(result.events.filter(event => event.nodeId === 'validate').map(event => [event.status, event.attempt])).toEqual([['retry', 1], ['retry', 2], ['failed', 3]])
  })

  test('denied approval blocks the action without retrying, with a simulated checkpoint when selected', () => {
    const result = simulate(buildBlueprint({ ...DEFAULT_INPUT, sideEffects: 'irreversible', resumable: true }), 'approval_denied')
    expect(result.finalState).toBe('blocked')
    expect(result.checkpointAvailable).toBe(true)
    expect(result.events.find(event => event.nodeId === 'approval')).toEqual({ nodeId: 'approval', status: 'blocked', code: 'approval_denied' })
    expect(result.events.filter(event => event.nodeId === 'action')).toEqual([{ nodeId: 'action', status: 'skipped', code: 'upstream_stopped' }])
    expect(result.events.filter(event => event.status === 'retry').length).toBe(0)
  })

  test('approval fault is explicitly inapplicable without an approval gate', () => {
    const result = simulate(buildBlueprint({ ...DEFAULT_INPUT }), 'approval_denied')
    expect(result.finalState).toBe('completed')
    expect(result.events.at(-1)).toEqual({ nodeId: 'output', status: 'ok', code: 'fault_not_applicable' })
    expect(result.events.every(event => event.status === 'ok')).toBe(true)
  })

  test('cannot bypass approval by editing a blueprint graph', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT, sideEffects: 'irreversible' })
    blueprint.nodes = blueprint.nodes.filter(node => node.kind !== 'approval')
    blueprint.edges = []
    expect(simulate(blueprint, 'approval_denied').finalState).toBe('blocked')
  })

  test('rejects an unknown fault and invalid blueprint input', () => {
    expect(() => simulate(buildBlueprint({ ...DEFAULT_INPUT }), 'unexpected' as Fault)).toThrow('Unknown simulation fault')
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT })
    blueprint.input = {} as LabInput
    expect(() => simulate(blueprint)).toThrow(TypeError)
  })

  test('does not mutate or retain trace state between runs', () => {
    const blueprint = buildBlueprint({ ...DEFAULT_INPUT, sideEffects: 'irreversible', resumable: true })
    const before = JSON.stringify(blueprint)
    const result = simulate(blueprint, 'approval_denied')
    result.events.length = 0
    expect(simulate(blueprint, 'approval_denied').events.length).toBeGreaterThan(0)
    expect(JSON.stringify(blueprint)).toBe(before)
    expect(simulate(blueprint).finalState).toBe('completed')
  })
})

describe('exhaustive simulation invariants', () => {
  test('all 768 configuration/fault scenarios are deterministic, finite, and fail closed before actions', () => {
    for (const input of allConfigurations()) {
      const blueprint = buildBlueprint(input)
      for (const fault of ['none', 'timeout', 'invalid_output', 'approval_denied'] as Fault[]) {
        const result = simulate(blueprint, fault)
        expect(simulate(blueprint, fault)).toEqual(result)
        const workerCount = input.parallel ? 2 : 1
        const upperBound = blueprint.nodes.length + input.maxRetries * (workerCount + 1) + 1
        expect(result.events.length).toBeLessThanOrEqual(upperBound)
        expect(result.events.every(event => blueprint.nodes.some(node => node.id === event.nodeId))).toBe(true)
        for (const event of result.events) {
          if (event.attempt !== undefined) {
            expect(event.attempt).toBeGreaterThanOrEqual(1)
            expect(event.attempt).toBeLessThanOrEqual(input.maxRetries + 1)
          }
        }
        const failing = fault === 'timeout' || fault === 'invalid_output'
        const denied = fault === 'approval_denied' && input.sideEffects === 'irreversible'
        expect(result.finalState).toBe(failing ? 'failed' : denied ? 'blocked' : 'completed')
        expect(result.checkpointAvailable).toBe(input.resumable && !failing)
        expect(result.events.filter(event => event.status === 'retry').length).toBe(failing ? input.maxRetries : 0)
        if (failing || denied) expect(result.events.some(event => event.code === 'action_simulated')).toBe(false)
        if (failing) expect(result.events.filter(event => event.status === 'failed').length).toBe(1)
        if (input.sideEffects === 'irreversible' && !failing && !denied) {
          expect(result.events.findIndex(event => event.code === 'approval_granted_simulated')).toBeLessThan(result.events.findIndex(event => event.code === 'action_simulated'))
        }
        const stop = result.events.findIndex(event => event.status === 'failed' || event.status === 'blocked')
        if (stop >= 0) expect(result.events.slice(stop + 1).every(event => event.status === 'skipped')).toBe(true)
      }
    }
  })
})
