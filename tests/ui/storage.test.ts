import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUT, serializeLabInput } from '../../src/domain'
import { INPUT_KEY, PREFS_KEY, readInput, readPreferences, writeInput, writePreferences } from '../../src/ui/storage'
function memory(value: string | null = null) { return { getItem: () => value, setItem: (_key: string, next: string) => { value = next } } }
const denied = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
describe('safe browser storage', () => {
  it('loads defaults when no settings exist and validates saved settings', () => {
    expect(readInput(memory())).toEqual({ input: DEFAULT_INPUT, state: 'ok' })
    const custom = { ...DEFAULT_INPUT, maxRetries: 3 as const }
    expect(readInput(memory(serializeLabInput(custom)))).toEqual({ input: custom, state: 'ok' })
    expect(readInput(memory('{oops'))).toEqual({ input: DEFAULT_INPUT, state: 'invalid' })
    expect(readInput(denied)).toEqual({ input: DEFAULT_INPUT, state: 'unavailable' })
  })
  it('saves validated configuration and handles quota errors', () => {
    const storage = memory()
    expect(writeInput(storage, DEFAULT_INPUT)).toBe('ok')
    expect(readInput(storage).input).toEqual(DEFAULT_INPUT)
    expect(writeInput(denied, DEFAULT_INPUT)).toBe('unavailable')
  })
  it('safely defaults and validates preferences', () => {
    for (const raw of [null, '{}', 'null', '1', '{bad', '{"locale":"xx","theme":"hacker"}']) expect(readPreferences(memory(raw))).toEqual({ locale: 'en', theme: 'system' })
    expect(readPreferences(denied)).toEqual({ locale: 'en', theme: 'system' })
    for (const theme of ['light', 'dark', 'system'] as const) {
      const storage = memory()
      expect(writePreferences(storage, 'zh', theme)).toBe('ok')
      expect(readPreferences(storage)).toEqual({ locale: 'zh', theme })
    }
    expect(writePreferences(denied, 'en', 'light')).toBe('unavailable')
    expect(INPUT_KEY).not.toBe(PREFS_KEY)
  })
})
