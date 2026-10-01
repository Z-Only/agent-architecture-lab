<script setup lang="ts">
withDefaults(defineProps<{ name?: string; size?: number }>(), { name: 'work', size: 20 })
const paths: Record<string, string> = {
  input: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  plan: 'M7 3h10v18H7zM10 7h4M10 11h4M10 15h4',
  route: 'M12 3v6M5 21v-8h14v8M12 9v4',
  retrieve: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h3',
  work: 'M9 3h6l1 4 4 1v7l-4 1-1 5H9l-1-5-4-1V8l4-1zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  validate: 'M9 12l2 2 4-5M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  checkpoint: 'M4 6c0-5 16-5 16 0s-16 5-16 0v12c0 5 16 5 16 0V6M4 12c0 5 16 5 16 0',
  approval: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  action: 'M13 2 4 14h7l-1 8 10-13h-8z',
  output: 'M5 22V3c5-5 9 5 15 0v11c-6 5-10-5-15 0',
  export: 'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',
  run: 'm8 5 11 7-11 7z',
  check: 'm5 12 4 4L19 6',
  arrow: 'M12 3v16m-5-5 5 5 5-5',
  info: 'M12 10v7m0-11v1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name]" /></svg></template>
