<script setup lang="ts">
import ConstraintsPanel from './components/ConstraintsPanel.vue'
import BlueprintPanel from './components/BlueprintPanel.vue'
import SimulationPanel from './components/SimulationPanel.vue'
import AppIcon from './components/AppIcon.vue'
import { useLab } from './ui/useLab'
import { sources } from './ui/i18n'
const { input, locale, theme, storageState, blueprint, fault, result, notice, t, updateInput, reset, run, exportPlan } = useLab()
</script>
<template>
  <a class="skip-link" href="#workbench">{{ t.skip }}</a>
  <header class="app-header"><div class="brand"><svg class="brand-mark" width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="6" /><path d="m11 11 9 9 9-9M20 20l-9 9m9-9 9 9" /><circle cx="11" cy="11" r="3"/><circle cx="29" cy="11" r="3"/><circle cx="20" cy="20" r="3"/><circle cx="11" cy="29" r="3"/><circle cx="29" cy="29" r="3"/></svg><span>Agent Architecture Lab</span></div><div class="header-controls"><div class="language-choice" role="group" :aria-label="t.language"><button :aria-pressed="locale === 'en'" lang="en" @click="locale = 'en'">EN</button><span aria-hidden="true">/</span><button :aria-pressed="locale === 'zh'" lang="zh-CN" @click="locale = 'zh'">中文</button></div><label class="theme-control"><span class="sr-only">{{ t.theme }}</span><select v-model="theme" data-testid="theme"><option value="light">{{ t.light }}</option><option value="dark">{{ t.dark }}</option><option value="system">{{ t.system }}</option></select></label></div></header>
  <main>
    <div class="intro"><div><h1>{{ t.title }}</h1><p>{{ t.subtitle }}</p></div><button class="button export-button" @click="exportPlan"><AppIcon name="export" />{{ t.export }}</button></div>
    <div v-if="storageState !== 'ok'" class="storage-notice" role="status">{{ storageState === 'invalid' ? t.savedInvalid : t.storageUnavailable }}</div>
    <p :class="notice === 'exported' || notice === 'exportFailed' ? 'action-notice' : 'sr-only'" role="status" aria-live="polite">{{ notice ? t[notice] : '' }}</p>
    <div id="workbench" class="workbench"><ConstraintsPanel :input="input" :locale="locale" @update="updateInput" @reset="reset" /><BlueprintPanel :blueprint="blueprint" :locale="locale" /><SimulationPanel :blueprint="blueprint" :fault="fault" :result="result" :locale="locale" @fault="fault = $event" @run="run" /></div>
    <div class="footnote"><p>{{ t.footer }}</p><div><a href="#method">{{ t.how }}</a><a href="#sources">{{ t.sources }}</a></div></div>
    <section class="reference-section" :aria-label="t.how"><details id="method"><summary>{{ t.how }}</summary><h2>{{ t.method }}</h2><p>{{ t.methodText }}</p><p>{{ t.methodLimits }}</p></details><details id="sources"><summary>{{ t.sources }}</summary><p>{{ t.sourceNote }}</p><ul><li v-for="source in sources" :key="source.url"><a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} <span aria-hidden="true">↗</span></a></li></ul></details></section>
  </main>
</template>
