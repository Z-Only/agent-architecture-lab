import { DEFAULT_INPUT, parseSavedBlueprint, serializeLabInput } from '../domain'
import type { LabInput } from '../domain'
import type { Locale, Theme } from './i18n'
export const INPUT_KEY = 'agent-architecture-lab.input.v1'
export const PREFS_KEY = 'agent-architecture-lab.preferences.v1'
export type StorageState = 'ok' | 'invalid' | 'unavailable'
export function readInput(storage: Pick<Storage, 'getItem'>): { input: LabInput; state: StorageState } {
  try {
    const saved = storage.getItem(INPUT_KEY)
    if (saved === null) return { input: { ...DEFAULT_INPUT }, state: 'ok' }
    const result = parseSavedBlueprint(saved)
    return result.ok ? { input: result.value, state: 'ok' } : { input: { ...DEFAULT_INPUT }, state: 'invalid' }
  } catch { return { input: { ...DEFAULT_INPUT }, state: 'unavailable' } }
}
export function writeInput(storage: Pick<Storage, 'setItem'>, input: LabInput): StorageState {
  try { storage.setItem(INPUT_KEY, serializeLabInput(input)); return 'ok' } catch { return 'unavailable' }
}
export function readPreferences(storage: Pick<Storage, 'getItem'>): { locale: Locale; theme: Theme } {
  try {
    const prefs: unknown = JSON.parse(storage.getItem(PREFS_KEY) ?? 'null')
    if (typeof prefs !== 'object' || prefs === null) return { locale: 'en', theme: 'system' }
    const candidate = prefs as Record<string, unknown>
    return { locale: candidate.locale === 'zh' ? 'zh' : 'en', theme: candidate.theme === 'light' || candidate.theme === 'dark' ? candidate.theme : 'system' }
  } catch { return { locale: 'en', theme: 'system' } }
}
export function writePreferences(storage: Pick<Storage, 'setItem'>, locale: Locale, theme: Theme): StorageState {
  try { storage.setItem(PREFS_KEY, JSON.stringify({ locale, theme })); return 'ok' } catch { return 'unavailable' }
}
