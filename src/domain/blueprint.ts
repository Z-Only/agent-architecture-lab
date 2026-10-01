import { requireLabInput } from './input'
import type { Blueprint, BlueprintNode, ChecklistItem, ExplanationCode, LabInput, NodeId, Pattern } from './types'

/**
 * A small educational decision heuristic, not a claim of a uniquely optimal design.
 * The router here fans out known independent branches; the orchestrator represents
 * task decomposition. Both are deliberately bounded in this static blueprint.
 */
export function buildBlueprint(value: LabInput): Blueprint {
  const input = requireLabInput(value)
  const pattern: Pattern = input.taskShape === 'open' ? 'orchestrator' : input.parallel ? 'router' : 'pipeline'
  const nodes: BlueprintNode[] = [{ id: 'input', kind: 'input', code: 'receive_input' }]
  const edges: Blueprint['edges'] = []
  let frontier: NodeId[] = ['input']
  const append = (node: BlueprintNode): void => {
    nodes.push(node)
    frontier.forEach(from => edges.push({ from, to: node.id }))
    frontier = [node.id]
  }

  if (pattern === 'orchestrator') append({ id: 'plan', kind: 'plan', code: 'plan_bounded_work' })
  if (pattern === 'router') append({ id: 'route', kind: 'route', code: 'route_independent_work' })
  if (input.retrieval) append({ id: 'retrieve', kind: 'retrieve', code: 'retrieve_context' })
  if (input.parallel) {
    nodes.push({ id: 'work-a', kind: 'work', code: 'perform_branch_a' }, { id: 'work-b', kind: 'work', code: 'perform_branch_b' })
    frontier.forEach(from => edges.push({ from, to: 'work-a' }, { from, to: 'work-b' }))
    frontier = ['work-a', 'work-b']
  } else append({ id: 'work', kind: 'work', code: 'perform_work' })
  append({ id: 'validate', kind: 'validate', code: 'validate_output' })
  if (input.resumable) append({ id: 'checkpoint', kind: 'checkpoint', code: 'save_checkpoint' })
  if (input.sideEffects === 'irreversible') append({ id: 'approval', kind: 'approval', code: 'require_approval' })
  if (input.sideEffects !== 'none') {
    append({ id: 'action', kind: 'action', code: input.sideEffects === 'reversible' ? 'perform_reversible_action' : 'perform_irreversible_action' })
  }
  append({ id: 'output', kind: 'output', code: 'return_output' })

  const explanation: ExplanationCode[] = [pattern === 'pipeline' ? 'fixed_sequence' : pattern === 'router' ? 'independent_branches' : 'dynamic_decomposition']
  if (input.parallel && pattern !== 'router') explanation.push('independent_branches')
  if (input.retrieval) explanation.push('retrieve_before_work')
  explanation.push('validate_before_effects')
  if (input.sideEffects === 'irreversible') explanation.push('approval_before_irreversible')
  if (input.resumable) explanation.push('checkpoint_before_effects')
  explanation.push(input.maxRetries > 0 ? 'bounded_retry_budget' : 'no_automatic_retries', 'simulation_only')

  const hasEffects = input.sideEffects !== 'none'
  const checklist: ChecklistItem[] = [
    { code: 'input_contract', state: 'enabled' },
    { code: 'output_validation', state: 'enabled' },
    // Zero retries is itself an enforced bound, not an absence of retry control.
    { code: 'bounded_retries', state: 'enabled' },
    { code: 'human_approval', state: input.sideEffects === 'irreversible' ? 'enabled' : 'not_needed' },
    { code: 'checkpointing', state: input.resumable ? 'enabled' : hasEffects || input.taskShape === 'open' ? 'recommended' : 'not_needed' },
    { code: 'idempotent_actions', state: hasEffects ? 'recommended' : 'not_needed' },
    { code: 'tool_allowlist', state: hasEffects || input.taskShape === 'open' ? 'recommended' : 'not_needed' },
    { code: 'observability', state: 'recommended' },
    { code: 'parallel_join', state: input.parallel ? 'enabled' : 'not_needed' },
    { code: 'iteration_budget', state: input.taskShape === 'open' ? 'recommended' : 'not_needed' },
    { code: 'retrieval_provenance', state: input.retrieval ? 'recommended' : 'not_needed' },
  ]
  return { version: 1, input, pattern, nodes, edges, explanation, checklist }
}
