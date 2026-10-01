import type { LabInput, ParseResult, ValidationIssue } from './types'

export const DEFAULT_INPUT: Readonly<LabInput> = Object.freeze({
  taskShape: 'fixed',
  sideEffects: 'none',
  retrieval: true,
  resumable: false,
  parallel: false,
  maxRetries: 2,
})

export const MAX_IMPORT_LENGTH = 4096
const fields = ['taskShape', 'sideEffects', 'retrieval', 'resumable', 'parallel', 'maxRetries'] as const
const has = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key)

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Strict schema: imports cannot smuggle arbitrary settings or executable content. */
export function parseLabInput(value: unknown): ParseResult {
  if (!isRecord(value)) return { ok: false, errors: [{ field: '$', code: 'invalid_object' }] }
  const errors: ValidationIssue[] = []
  if (Object.keys(value).some(key => !fields.includes(key as typeof fields[number]))) {
    errors.push({ field: '$', code: 'unknown_field' })
  }
  for (const field of fields) {
    if (!has(value, field)) {
      errors.push({ field, code: 'missing_field' })
      continue
    }
    const entry = value[field]
    const valid = field === 'taskShape'
      ? entry === 'fixed' || entry === 'open'
      : field === 'sideEffects'
        ? entry === 'none' || entry === 'reversible' || entry === 'irreversible'
        : field === 'maxRetries'
          ? typeof entry === 'number' && Number.isInteger(entry) && entry >= 0 && entry <= 3
          : typeof entry === 'boolean'
    if (!valid) errors.push({ field, code: 'invalid_value' })
  }
  if (errors.length) return { ok: false, errors }
  // Construct a clean copy in stable key order instead of retaining the source.
  return {
    ok: true,
    value: {
      taskShape: value.taskShape as LabInput['taskShape'],
      sideEffects: value.sideEffects as LabInput['sideEffects'],
      retrieval: value.retrieval as boolean,
      resumable: value.resumable as boolean,
      parallel: value.parallel as boolean,
      maxRetries: value.maxRetries as LabInput['maxRetries'],
    },
  }
}

/** Parse only a versioned configuration, not a claimed execution or untrusted graph. */
export function parseSavedBlueprint(text: string): ParseResult {
  if (typeof text !== 'string') return { ok: false, errors: [{ field: '$', code: 'invalid_json' }] }
  if (text.length > MAX_IMPORT_LENGTH) return { ok: false, errors: [{ field: '$', code: 'too_large' }] }
  let saved: unknown
  try {
    saved = JSON.parse(text)
  } catch {
    return { ok: false, errors: [{ field: '$', code: 'invalid_json' }] }
  }
  if (!isRecord(saved)) return { ok: false, errors: [{ field: '$', code: 'invalid_object' }] }
  if (saved.version !== 1) return { ok: false, errors: [{ field: 'version', code: 'unsupported_version' }] }
  if (Object.keys(saved).some(key => key !== 'version' && key !== 'input')) {
    return { ok: false, errors: [{ field: '$', code: 'unknown_field' }] }
  }
  if (!has(saved, 'input')) return { ok: false, errors: [{ field: 'input', code: 'missing_field' }] }
  return parseLabInput(saved.input)
}

export function requireLabInput(value: unknown): LabInput {
  const parsed = parseLabInput(value)
  if (!parsed.ok) throw new TypeError(`Invalid lab input: ${parsed.errors.map(error => `${error.field}:${error.code}`).join(', ')}`)
  return parsed.value
}

export function serializeLabInput(input: LabInput): string {
  return JSON.stringify({ version: 1, input: requireLabInput(input) }, null, 2)
}
