/** All of this module models a design. It never runs an agent or an external action. */
export type TaskShape = 'fixed' | 'open'
export type SideEffects = 'none' | 'reversible' | 'irreversible'
export type RetryLimit = 0 | 1 | 2 | 3

export interface LabInput {
  taskShape: TaskShape
  sideEffects: SideEffects
  retrieval: boolean
  resumable: boolean
  parallel: boolean
  /** Retries after the initial attempt, never total attempts. */
  maxRetries: RetryLimit
}

export type Pattern = 'pipeline' | 'router' | 'orchestrator'
export type NodeId = 'input' | 'plan' | 'route' | 'retrieve' | 'work' | 'work-a' | 'work-b' | 'validate' | 'checkpoint' | 'approval' | 'action' | 'output'
export type NodeKind = 'input' | 'plan' | 'route' | 'retrieve' | 'work' | 'validate' | 'checkpoint' | 'approval' | 'action' | 'output'
export type NodeCode = 'receive_input' | 'plan_bounded_work' | 'route_independent_work' | 'retrieve_context' | 'perform_work' | 'perform_branch_a' | 'perform_branch_b' | 'validate_output' | 'save_checkpoint' | 'require_approval' | 'perform_reversible_action' | 'perform_irreversible_action' | 'return_output'

export interface BlueprintNode {
  id: NodeId
  kind: NodeKind
  code: NodeCode
}

export interface BlueprintEdge {
  from: NodeId
  to: NodeId
}

export type ExplanationCode = 'fixed_sequence' | 'independent_branches' | 'dynamic_decomposition' | 'retrieve_before_work' | 'validate_before_effects' | 'approval_before_irreversible' | 'checkpoint_before_effects' | 'bounded_retry_budget' | 'no_automatic_retries' | 'simulation_only'
export type ChecklistCode = 'input_contract' | 'output_validation' | 'bounded_retries' | 'human_approval' | 'checkpointing' | 'idempotent_actions' | 'tool_allowlist' | 'observability' | 'parallel_join' | 'iteration_budget' | 'retrieval_provenance'
export type ChecklistState = 'enabled' | 'recommended' | 'not_needed'

export interface ChecklistItem {
  code: ChecklistCode
  state: ChecklistState
}

export interface Blueprint {
  version: 1
  input: LabInput
  pattern: Pattern
  /** Topological order. Parallel branches are serialized only for trace display. */
  nodes: BlueprintNode[]
  edges: BlueprintEdge[]
  explanation: ExplanationCode[]
  checklist: ChecklistItem[]
}

export type Fault = 'none' | 'timeout' | 'invalid_output' | 'approval_denied'
export type EventStatus = 'ok' | 'retry' | 'blocked' | 'failed' | 'skipped'
export type EventCode = 'step_completed' | 'input_validated' | 'plan_created' | 'branches_routed' | 'context_retrieved' | 'work_completed' | 'output_validated' | 'checkpoint_saved' | 'approval_granted_simulated' | 'action_simulated' | 'output_returned' | 'timeout_retry' | 'timeout_exhausted' | 'invalid_output_retry' | 'invalid_output_exhausted' | 'approval_denied' | 'upstream_stopped' | 'fault_not_applicable'

export interface SimulationEvent {
  nodeId: NodeId
  status: EventStatus
  code: EventCode
  /** One-based attempt; retries are additional attempts. */
  attempt?: number
}

export interface SimulationResult {
  events: SimulationEvent[]
  finalState: 'completed' | 'blocked' | 'failed'
  /** A simulated checkpoint, never a durable execution checkpoint. */
  checkpointAvailable: boolean
}

export type ValidationCode = 'invalid_object' | 'unknown_field' | 'missing_field' | 'invalid_value' | 'invalid_json' | 'too_large' | 'unsupported_version'
export interface ValidationIssue {
  field: string
  code: ValidationCode
}
export type ParseResult = { ok: true; value: LabInput } | { ok: false; errors: ValidationIssue[] }
