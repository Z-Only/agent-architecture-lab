import { computed, ref, watch } from 'vue'
import { buildBlueprint, DEFAULT_INPUT, simulate } from '../domain'
import type { Fault, LabInput, SimulationResult } from '../domain'
import { createPlan, downloadPlan } from './export'
import { messages } from './i18n'
import type { Locale, Theme } from './i18n'
import { readInput, readPreferences, writeInput, writePreferences } from './storage'
export function useLab(storage: Pick<Storage, 'getItem' | 'setItem'> = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) }) {
  const loaded = readInput(storage)
  const prefs = readPreferences(storage)
  const input = ref<LabInput>(loaded.input)
  const locale = ref<Locale>(prefs.locale)
  const theme = ref<Theme>(prefs.theme)
  const storageState = ref(loaded.state)
  const blueprint = computed(() => buildBlueprint(input.value))
  const fault = ref<Fault>('timeout')
  const result = ref<SimulationResult | null>(null)
  const notice = ref<'changed' | 'resetDone' | 'exported' | 'exportFailed' | null>(null)
  const t = computed(() => messages[locale.value])
  const planText = computed(() => createPlan(blueprint.value, locale.value, fault.value, result.value))
  watch(input, value => {
    storageState.value = writeInput(storage, value)
    result.value = null
    notice.value = 'changed'
  }, { deep: true, flush: 'sync' })
  watch([locale, theme], ([lang, appearance]) => {
    if (writePreferences(storage, lang, appearance) === 'unavailable') storageState.value = 'unavailable'
  })
  watch([locale, theme], ([lang, appearance]) => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.dataset.theme = appearance
  }, { immediate: true })
  watch(fault, () => { result.value = null; notice.value = null })
  function updateInput(value: LabInput) { input.value = value }
  function reset() { input.value = { ...DEFAULT_INPUT }; result.value = null; notice.value = 'resetDone' }
  function run() { result.value = simulate(blueprint.value, fault.value); notice.value = null }
  function exportPlan() {
    try { downloadPlan(planText.value); notice.value = 'exported' }
    catch { notice.value = 'exportFailed' }
  }
  return { input, locale, theme, storageState, blueprint, fault, result, notice, t, planText, updateInput, reset, run, exportPlan }
}
