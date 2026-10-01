<script setup lang="ts">
import type { LabInput, RetryLimit, SideEffects, TaskShape } from '../domain'
import { messages } from '../ui/i18n'
import type { Locale } from '../ui/i18n'
const props = defineProps<{ input: LabInput; locale: Locale }>()
const emit = defineEmits<{ update: [value: LabInput]; reset: [] }>()
function set<K extends keyof LabInput>(key: K, value: LabInput[K]) { emit('update', { ...props.input, [key]: value }) }
const taskOptions: TaskShape[] = ['fixed', 'open']
const effectOptions: SideEffects[] = ['none', 'reversible', 'irreversible']
const toggles = ['retrieval', 'resumable', 'parallel'] as const
const budgets: RetryLimit[] = [0, 1, 2, 3]
</script>
<template>
  <section class="constraints panel" aria-labelledby="constraints-title">
    <div class="panel-heading"><h2 id="constraints-title"><span>01</span> {{ messages[locale].constraints }}</h2><button class="text-button" @click="emit('reset')">{{ messages[locale].reset }}</button></div>
    <fieldset class="field-group"><legend>{{ messages[locale].taskShape }}</legend><label v-for="value in taskOptions" :key="value" class="radio-choice"><input type="radio" name="taskShape" :value="value" :checked="input.taskShape === value" @change="set('taskShape', value)" /><span><strong>{{ messages[locale][value] }}</strong><small>{{ messages[locale][`${value}Help`] }}</small></span></label></fieldset>
    <fieldset class="field-group"><legend>{{ messages[locale].sideEffects }}</legend><label v-for="value in effectOptions" :key="value" class="radio-choice"><input type="radio" name="sideEffects" :value="value" :checked="input.sideEffects === value" @change="set('sideEffects', value)" /><span><strong>{{ messages[locale][value] }}</strong><small>{{ messages[locale][`${value}Help`] }}</small></span></label></fieldset>
    <div v-for="key in toggles" :key="key" class="toggle-field"><div><label :for="key">{{ messages[locale][key] }}</label><small :id="`${key}-help`">{{ messages[locale][`${key}Help`] }}</small></div><input :id="key" class="switch" type="checkbox" role="switch" :checked="input[key]" :aria-describedby="`${key}-help`" @change="set(key, ($event.target as HTMLInputElement).checked)" /></div>
    <fieldset class="field-group retry-group"><legend>{{ messages[locale].maxRetries }}</legend><div class="segmented"><label v-for="budget in budgets" :key="budget" :class="{ selected: input.maxRetries === budget }"><input type="radio" name="maxRetries" :value="budget" :checked="input.maxRetries === budget" @change="set('maxRetries', budget)" /><span>{{ budget }}</span></label></div><small>{{ messages[locale].retriesHelp }}</small></fieldset>
  </section>
</template>
