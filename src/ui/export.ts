import type { Blueprint, Fault, SimulationResult } from '../domain'
import { checklistLabels, eventLabels, explanations, messages, nodeLabels, patterns, sources } from './i18n'
import type { Locale } from './i18n'
export function createPlan(blueprint: Blueprint, locale: Locale, fault: Fault, result: SimulationResult | null): string {
  const t = messages[locale]
  const lines = ['# Agent Architecture Lab', '', t.footer, '', `## ${t.blueprint}: ${patterns[locale][blueprint.pattern]}`, '', '```json', JSON.stringify(blueprint.input, null, 2), '```', '', ...blueprint.nodes.map((node, index) => `${index + 1}. ${nodeLabels[locale][node.code]}`), '', `## ${t.connections}`, '', ...blueprint.edges.map(edge => `- ${edge.from} → ${edge.to}`), '', `## ${t.why}`, '', ...blueprint.explanation.map(code => `- ${explanations[locale][code]}`), '', `## ${t.checklist}`, '', t.checklistHelp, '', ...blueprint.checklist.map(item => `- ${checklistLabels[locale][item.code]}: ${t[item.state]}`), '', `## ${t.trace}`, '']
  if (result) lines.push(`${t.fault}: ${fault === 'none' ? t.noFault : t[fault]}`, `${t[result.finalState]}`, '', ...result.events.map((event, index) => `${index + 1}. ${eventLabels[locale][event.code]}${event.attempt ? ` (${t.attempt} ${event.attempt})` : ''}`))
  else lines.push(t.traceEmpty)
  lines.push('', `## ${t.how}`, '', t.methodText, '', t.methodLimits, '', `## ${t.sources}`, '', t.sourceNote, '', ...sources.map(source => `- [${source.title}](${source.url})`), '')
  return lines.join('\n')
}
export function downloadPlan(content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'agent-architecture-plan.md'
  document.body.append(link)
  try { link.click() } finally { link.remove(); URL.revokeObjectURL(url) }
}
