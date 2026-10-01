<script setup lang="ts">
import { computed } from 'vue'
import type { Blueprint, BlueprintNode } from '../domain'
import { checklistLabels, explanations, messages, nodeLabels, patterns } from '../ui/i18n'
import type { Locale } from '../ui/i18n'
import AppIcon from './AppIcon.vue'
const props = defineProps<{ blueprint: Blueprint; locale: Locale }>()
const rows = computed(() => {
  const result: BlueprintNode[][] = []
  for (const node of props.blueprint.nodes) {
    if (node.id === 'work-b') result[result.length - 1]!.push(node)
    else result.push([node])
  }
  return result
})
const activeChecklist = computed(() => props.blueprint.checklist.filter(item => item.state !== 'not_needed'))
</script>
<template>
  <section class="blueprint panel" aria-labelledby="blueprint-title">
    <div class="panel-heading blueprint-heading"><h2 id="blueprint-title"><span>02</span> {{ messages[locale].blueprint }}</h2><p class="pattern-name">{{ patterns[locale][blueprint.pattern] }}</p></div>
    <div class="workflow-canvas">
      <ol class="workflow" :aria-label="messages[locale].blueprint">
        <li v-for="(row, index) in rows" :key="row[0]!.id" class="workflow-row" :class="{ parallel: row.length > 1 }">
          <div class="node-row"><div v-for="node in row" :key="node.id" class="workflow-node" :class="`node-${node.kind}`" :data-node="node.id"><AppIcon :name="node.kind" :size="22" /><span>{{ nodeLabels[locale][node.code] }}</span></div></div>
          <AppIcon v-if="index < rows.length - 1" class="connector" name="arrow" :size="20" />
        </li>
      </ol>
      <p v-if="blueprint.input.parallel" class="canvas-note">{{ messages[locale].parallelNote }}</p>
    </div>
    <div class="reason-strip"><AppIcon name="info" /><div><h3>{{ messages[locale].why }}</h3><p>{{ explanations[locale][blueprint.explanation[0]!] }}</p><details class="reason-details"><summary>{{ messages[locale].how }}</summary><ul><li v-for="code in blueprint.explanation.slice(1)" :key="code">{{ explanations[locale][code] }}</li></ul></details></div></div>
    <div class="readiness"><h3>{{ messages[locale].checklist }}</h3><p class="muted caption">{{ messages[locale].checklistHelp }}</p><ul class="checklist"><li v-for="item in activeChecklist" :key="item.code"><AppIcon :name="item.state === 'enabled' ? 'check' : 'info'" :size="16" /><span>{{ checklistLabels[locale][item.code] }}<small>{{ messages[locale][item.state] }}</small></span></li></ul></div>
  </section>
</template>
