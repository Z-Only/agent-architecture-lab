import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildBlueprint, DEFAULT_INPUT, simulate } from '../../src/domain'
import { createPlan, downloadPlan } from '../../src/ui/export'
afterEach(() => vi.restoreAllMocks())
describe('real downloadable plan', () => {
  it('exports configuration, reasoning, honest limitations, checklist and primary sources', () => {
    const blueprint = buildBlueprint(DEFAULT_INPUT)
    const text = createPlan(blueprint, 'en', 'none', null)
    expect(text).toContain('"taskShape"')
    expect(text).toContain('not live LLM execution')
    expect(text).toContain('https://www.anthropic.com/engineering/building-effective-agents')
    expect(text).toContain('Choose a fault')
    expect(createPlan(blueprint, 'en', 'none', simulate(blueprint))).toContain('Inject a fault: No fault')
    expect(createPlan(blueprint, 'zh', 'timeout', simulate(blueprint, 'timeout'))).toContain('工具超时')
    expect(createPlan(blueprint, 'en', 'invalid_output', simulate(blueprint, 'invalid_output'))).toContain('Attempt 1')
  })
  it('creates the file, clicks the link and revokes the temporary URL', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:plan')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { expect(this.download).toBe('agent-architecture-plan.md'); expect(this.href).toBe('blob:plan') })
    downloadPlan('# Plan')
    expect(create.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:plan')
    expect(document.querySelector('a[download]')).toBeNull()
  })
  it('cleans up if the browser rejects the click', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:failed')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('download blocked') })
    expect(() => downloadPlan('Plan')).toThrow('download blocked')
    expect(revoke).toHaveBeenCalledWith('blob:failed')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
