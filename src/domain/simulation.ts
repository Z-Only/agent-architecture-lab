import { buildBlueprint } from './blueprint'
import type { Blueprint, EventCode, Fault, NodeKind, SimulationEvent, SimulationResult } from './types'

const successCodes: Record<NodeKind, EventCode> = {
  input: 'input_validated',
  plan: 'plan_created',
  route: 'branches_routed',
  retrieve: 'context_retrieved',
  work: 'work_completed',
  validate: 'output_validated',
  checkpoint: 'checkpoint_saved',
  approval: 'approval_granted_simulated',
  action: 'action_simulated',
  output: 'output_returned',
}

/**
 * Deterministic, finite fault demonstration. No model, network, timer or real action.
 * A selected timeout or invalid-output fault persists through the entire retry budget.
 * Rework is safe because modeled side effects happen only after validation/approval.
 */
export function simulate(blueprint: Blueprint, fault: Fault = 'none'): SimulationResult {
  if (!['none', 'timeout', 'invalid_output', 'approval_denied'].includes(fault)) throw new TypeError('Unknown simulation fault')
  // Rebuild from validated input; callers cannot remove the approval gate by editing a graph.
  const canonical = buildBlueprint(blueprint.input)
  const events: SimulationEvent[] = []
  let finalState: SimulationResult['finalState'] = 'completed'
  let checkpointAvailable = false
  const firstWorker = canonical.nodes.find(node => node.kind === 'work')!

  for (const node of canonical.nodes) {
    if (finalState !== 'completed') {
      events.push({ nodeId: node.id, status: 'skipped', code: 'upstream_stopped' })
      continue
    }
    if (fault === 'timeout' && node.id === firstWorker.id) {
      for (let attempt = 1; attempt <= canonical.input.maxRetries + 1; attempt++) {
        const exhausted = attempt > canonical.input.maxRetries
        events.push({ nodeId: node.id, status: exhausted ? 'failed' : 'retry', code: exhausted ? 'timeout_exhausted' : 'timeout_retry', attempt })
      }
      finalState = 'failed'
      continue
    }
    if (fault === 'invalid_output' && node.kind === 'validate') {
      for (let attempt = 1; attempt <= canonical.input.maxRetries + 1; attempt++) {
        const exhausted = attempt > canonical.input.maxRetries
        events.push({ nodeId: node.id, status: exhausted ? 'failed' : 'retry', code: exhausted ? 'invalid_output_exhausted' : 'invalid_output_retry', attempt })
        if (!exhausted) {
          // Recompute every branch before re-validating their combined result.
          for (const worker of canonical.nodes.filter(candidate => candidate.kind === 'work')) {
            events.push({ nodeId: worker.id, status: 'ok', code: 'work_completed', attempt: attempt + 1 })
          }
        }
      }
      finalState = 'failed'
      continue
    }
    if (fault === 'approval_denied' && node.kind === 'approval') {
      events.push({ nodeId: node.id, status: 'blocked', code: 'approval_denied' })
      finalState = 'blocked'
      continue
    }
    const event: SimulationEvent = { nodeId: node.id, status: 'ok', code: successCodes[node.kind] }
    if (node.kind === 'work' || node.kind === 'validate') event.attempt = 1
    events.push(event)
    if (node.kind === 'checkpoint') checkpointAvailable = true
  }

  if (fault === 'approval_denied' && canonical.input.sideEffects !== 'irreversible') {
    // Informational event: the output succeeded; only the fault was inapplicable.
    events.push({ nodeId: 'output', status: 'ok', code: 'fault_not_applicable' })
  }
  return { events, finalState, checkpointAvailable }
}
