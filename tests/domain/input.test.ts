import { describe, expect, test } from 'vitest'
import { DEFAULT_INPUT, MAX_IMPORT_LENGTH, buildBlueprint, parseLabInput, parseSavedBlueprint, requireLabInput, serializeLabInput } from '../../src/domain'
import type { LabInput } from '../../src/domain'

describe('validated configuration boundary', () => {
  test('defaults are frozen, valid, and copied on parse', () => {
    expect(Object.isFrozen(DEFAULT_INPUT)).toBe(true)
    const parsed = parseLabInput(DEFAULT_INPUT)
    expect(parsed).toEqual({ ok: true, value: DEFAULT_INPUT })
    if (parsed.ok) {
      expect(parsed.value).not.toBe(DEFAULT_INPUT)
      parsed.value.parallel = true
      expect(DEFAULT_INPUT.parallel).toBe(false)
    }
  })

  test.each([null, undefined, [], 'x', 1, true, new Date(), new Map(), () => 1])('rejects non-record %p', value => {
    expect(parseLabInput(value)).toEqual({ ok: false, errors: [{ field: '$', code: 'invalid_object' }] })
  })

  test('accepts a complete null-prototype data record', () => {
    expect(parseLabInput(Object.assign(Object.create(null), DEFAULT_INPUT))).toEqual({ ok: true, value: DEFAULT_INPUT })
  })

  test('reports every missing field in stable order', () => {
    const result = parseLabInput({})
    expect(result).toEqual({ ok: false, errors: Object.keys(DEFAULT_INPUT).map(field => ({ field, code: 'missing_field' })) })
  })

  test.each([
    ['taskShape', 'pipeline'], ['taskShape', null], ['sideEffects', 'safe'],
    ['retrieval', 'false'], ['resumable', 1], ['parallel', null],
    ['maxRetries', -1], ['maxRetries', 4], ['maxRetries', 1.5],
    ['maxRetries', NaN], ['maxRetries', Infinity], ['maxRetries', '2'],
    ['maxRetries', null], ['maxRetries', undefined],
  ])('rejects invalid %s value %p', (field, value) => {
    expect(parseLabInput({ ...DEFAULT_INPUT, [field as string]: value })).toEqual({ ok: false, errors: [{ field, code: 'invalid_value' }] })
  })

  test('rejects unknown fields without reflecting their contents', () => {
    expect(parseLabInput({ ...DEFAULT_INPUT, '<script>': 'anything' })).toEqual({ ok: false, errors: [{ field: '$', code: 'unknown_field' }] })
    expect(parseLabInput(JSON.parse(`{"__proto__":{},${JSON.stringify(DEFAULT_INPUT).slice(1)}`)).ok).toBe(false)
  })

  test('requires own properties rather than inheriting defaults', () => {
    expect(parseLabInput(Object.create(DEFAULT_INPUT)).ok).toBe(false)
  })

  test('accepts every integer retry bound including zero', () => {
    for (const maxRetries of [0, 1, 2, 3]) expect(parseLabInput({ ...DEFAULT_INPUT, maxRetries }).ok).toBe(true)
  })

  test('rejects partial or invalid input at every public construction boundary', () => {
    expect(() => requireLabInput({})).toThrow('taskShape:missing_field')
    expect(() => buildBlueprint({} as LabInput)).toThrow(TypeError)
    expect(() => serializeLabInput({ ...DEFAULT_INPUT, maxRetries: 5 } as unknown as LabInput)).toThrow(TypeError)
  })
})

describe('versioned saved configurations', () => {
  test('round-trips without storing graph, trace, outputs, credentials or telemetry', () => {
    const text = serializeLabInput({ ...DEFAULT_INPUT })
    expect(Object.keys(JSON.parse(text))).toEqual(['version', 'input'])
    expect(parseSavedBlueprint(text)).toEqual({ ok: true, value: DEFAULT_INPUT })
    expect(serializeLabInput({ ...DEFAULT_INPUT })).toBe(text)
  })

  test.each(['', '{', 'undefined', '/* comment */{}'])('rejects invalid JSON %p', text => {
    expect(parseSavedBlueprint(text)).toEqual({ ok: false, errors: [{ field: '$', code: 'invalid_json' }] })
  })

  test('runtime type checks the text argument', () => {
    expect(parseSavedBlueprint(null as unknown as string)).toEqual({ ok: false, errors: [{ field: '$', code: 'invalid_json' }] })
  })

  test.each(['null', '[]', '1', 'true', '"text"'])('rejects non-record JSON %p', text => {
    expect(parseSavedBlueprint(text)).toEqual({ ok: false, errors: [{ field: '$', code: 'invalid_object' }] })
  })

  test.each([{}, { version: 2 }, { version: '1' }, { version: null }])('rejects unsupported or missing version %p', saved => {
    expect(parseSavedBlueprint(JSON.stringify(saved))).toEqual({ ok: false, errors: [{ field: 'version', code: 'unsupported_version' }] })
  })

  test('requires input and rejects unknown envelope fields', () => {
    expect(parseSavedBlueprint('{"version":1}')).toEqual({ ok: false, errors: [{ field: 'input', code: 'missing_field' }] })
    expect(parseSavedBlueprint(JSON.stringify({ version: 1, input: DEFAULT_INPUT, graph: [] }))).toEqual({ ok: false, errors: [{ field: '$', code: 'unknown_field' }] })
    expect(parseSavedBlueprint('{"version":1,"input":null}')).toEqual({ ok: false, errors: [{ field: '$', code: 'invalid_object' }] })
  })

  test('enforces the exact import-size boundary', () => {
    const valid = serializeLabInput({ ...DEFAULT_INPUT })
    expect(parseSavedBlueprint(valid.padEnd(MAX_IMPORT_LENGTH, ' ')).ok).toBe(true)
    expect(parseSavedBlueprint(valid.padEnd(MAX_IMPORT_LENGTH + 1, ' '))).toEqual({ ok: false, errors: [{ field: '$', code: 'too_large' }] })
  })
})
