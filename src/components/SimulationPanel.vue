<script setup lang="ts">
import type { Blueprint, Fault, SimulationResult } from '../domain'
import { eventLabels, messages, nodeLabels } from '../ui/i18n'
import type { Locale } from '../ui/i18n'
import AppIcon from './AppIcon.vue'
defineProps<{ blueprint: Blueprint; fault: Fault; result: SimulationResult | null; locale: Locale }>()
const emit = defineEmits<{ fault: [value: Fault]; run: [] }>()
const faults: Fault[] = ['none', 'timeout', 'invalid_output', 'approval_denied']
</script>
<template>
  <section class="simulation panel" aria-labelledby="simulation-title">
    <div class="panel-heading"><h2 id="simulation-title"><span>03</span> {{ messages[locale].stress }}</h2></div>
    <h3>{{ messages[locale].simulation }}</h3><p class="muted simulation-description">{{ messages[locale].simulationHelp }}</p>
    <label class="select-label" for="fault">{{ messages[locale].fault }}</label><select id="fault" :value="fault" @change="emit('fault', ($event.target as HTMLSelectElement).value as Fault)"><option v-for="value in faults" :key="value" :value="value">{{ value === 'none' ? messages[locale].noFault : messages[locale][value] }}</option></select>
    <button class="button run-button" @click="emit('run')"><AppIcon name="run" :size="18" />{{ messages[locale].run }}</button>
    <div class="trace-heading"><h3>{{ messages[locale].trace }}</h3><span v-if="result" class="outcome" :class="result.finalState" role="status">{{ messages[locale][result.finalState] }}</span></div>
    <ol v-if="result" class="trace"><li v-for="(event, index) in result.events" :key="`${index}-${event.code}`" :class="`trace-${event.status}`"><span class="trace-number">{{ index + 1 }}</span><div><strong>{{ eventLabels[locale][event.code] }}</strong><small>{{ nodeLabels[locale][blueprint.nodes.find(node => node.id === event.nodeId)!.code] }}<span v-if="event.attempt"> · {{ messages[locale].attempt }} {{ event.attempt }}</span></small></div></li></ol>
    <div v-else class="trace-empty"><AppIcon name="route" :size="30" /><p>{{ messages[locale].traceEmpty }}</p><small>{{ messages[locale].traceEmptyHelp }}</small></div>
    <p v-if="result?.checkpointAvailable" class="checkpoint-note"><AppIcon name="checkpoint" :size="16" />{{ messages[locale].checkpoint }}</p>
  </section>
</template>
