import type { LabInput, RetryLimit, SideEffects, TaskShape } from '../../src/domain'

/** Exhaustive finite input space; no randomized seeds or external fixtures. */
export function allConfigurations(): LabInput[] {
  const result: LabInput[] = []
  for (const taskShape of ['fixed', 'open'] as TaskShape[])
    for (const sideEffects of ['none', 'reversible', 'irreversible'] as SideEffects[])
      for (const retrieval of [false, true])
        for (const resumable of [false, true])
          for (const parallel of [false, true])
            for (const maxRetries of [0, 1, 2, 3] as RetryLimit[])
              result.push({ taskShape, sideEffects, retrieval, resumable, parallel, maxRetries })
  return result
}
