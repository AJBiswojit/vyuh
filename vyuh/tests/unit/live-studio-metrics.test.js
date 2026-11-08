import { describe, expect, it } from 'vitest'
import { buildSessionSummary } from '../../src/services/mock/liveStudioMetrics.js'
import { createInitialState, reduce } from '../../src/services/mock/liveStudioReducer.js'
import { CANONICAL_STUDIO_SESSION_ID, PROTOTYPE_NOTICE } from '../../src/mock-data/index.js'

const AT = Date.parse('2026-11-07T10:00:00.000Z')
let counter = 0
/** @param {any} state @param {string} type @param {Object} [payload] @param {string} [at] @param {string} [kind] */
function apply(state, type, payload = {}, at = new Date(AT).toISOString(), kind = 'faculty') {
  counter += 1
  return {
    ...reduce(state, {
      id: `metric-${counter}`, type, at, actor: { kind, id: kind, label: kind === 'faculty' ? 'Faculty' : 'You' }, detail: type, payload,
    }),
    events: [...state.events, { id: `metric-${counter}`, type, at, actor: { kind, id: kind, label: kind === 'faculty' ? 'Faculty' : 'You' }, detail: type, payload }],
  }
}

/** Attach the lifecycle timestamps the state engine would have written. */
function withLifecycle(state, startedAt, endedAt) {
  return { ...state, startedAt, endedAt }
}

function fresh() { return createInitialState({ sessionId: CANONICAL_STUDIO_SESSION_ID, at: new Date(AT).toISOString() }) }

describe('VYUH LIVE STUDIO — provenance-aware metrics', () => {
  it('reports the exact persistent prototype notice', () => {
    expect(buildSessionSummary(fresh()).notice).toBe(PROTOTYPE_NOTICE)
  })

  it('reports Unavailable for duration, attendance and poll responses before any events', () => {
    const summary = buildSessionSummary(fresh(), { now: AT })
    for (const key of ['duration', 'attendance_view', 'poll_responses']) {
      const metric = summary.metrics.find((item) => item.key === key)
      expect(metric.available).toBe(false)
      expect(metric.display).toBe('Unavailable')
      expect(metric.provenance).toBe('unavailable')
    }
    expect(summary.completion).toBe('not_started')
  })

  it('labels every metric with an allowed provenance', () => {
    const summary = buildSessionSummary(fresh(), { now: AT })
    expect(summary.metrics.length).toBeGreaterThanOrEqual(10)
    for (const metric of summary.metrics) {
      expect(['recorded_event', 'seeded_demo', 'unavailable']).toContain(metric.provenance)
      expect(metric.note.length).toBeGreaterThan(10)
      expect(metric.provenanceLabel.length).toBeGreaterThan(0)
    }
  })

  it('keeps seeded demo rows separate from recorded mock events', () => {
    let state = fresh()
    state = apply(state, 'chat_sent', { body: 'Recorded line' }, new Date(AT).toISOString(), 'student')
    state = apply(state, 'question_added', { body: 'Recorded question' }, new Date(AT).toISOString(), 'student')
    const summary = buildSessionSummary(state, { now: AT + 60_000 })
    expect(summary.metrics.find((item) => item.key === 'chat_recorded').display).toBe('1')
    expect(summary.metrics.find((item) => item.key === 'chat_seeded').provenance).toBe('seeded_demo')
    expect(summary.metrics.find((item) => item.key === 'questions_recorded').display).toBe('1')
    expect(summary.metrics.find((item) => item.key === 'questions_seeded').provenance).toBe('seeded_demo')
  })

  it('uses recorded lifecycle timestamps for duration and completion', () => {
    const start = new Date(AT).toISOString()
    const end = new Date(AT + 120_000).toISOString()
    let state = apply(fresh(), 'session_started', {}, start)
    state = apply(state, 'session_ended', {}, end)
    state = withLifecycle(state, start, end)
    const summary = buildSessionSummary(state, { now: AT + 600_000 })
    expect(summary.completion).toBe('ended')
    expect(summary.metrics.find((item) => item.key === 'duration').display).toBe('2m 0s')
    expect(summary.metrics.find((item) => item.key === 'duration').provenance).toBe('recorded_event')
  })

  it('counts poll responses only from recorded votes', () => {
    let state = apply(fresh(), 'poll_created', { question: 'Ready?', options: ['Yes', 'No'] })
    const poll = state.polls[0]
    state = apply(state, 'poll_voted', { pollId: poll.id, optionId: poll.options[0].id }, new Date(AT).toISOString(), 'student')
    const summary = buildSessionSummary(state, { now: AT })
    const metric = summary.metrics.find((item) => item.key === 'poll_responses')
    expect(metric.display).toContain('1 recorded vote')
    expect(metric.display).not.toContain('%')
    expect(metric.note).toContain('No participation percentage')
  })

  it('never fabricates verified attendance, percentages or scores', () => {
    const summary = buildSessionSummary(fresh(), { now: AT })
    const serialized = JSON.stringify(summary.metrics)
    expect(serialized).not.toContain('Verified attendance results')
    expect(serialized).not.toContain('engagement %')
    expect(summary.metrics.find((item) => item.key === 'seeded_roster').note).toContain('Not verified')
    expect(summary.metrics.find((item) => item.key === 'mock_joins').display).toBe('0')
  })

  it('includes a caller-supplied attendance view only with its explicit provenance', () => {
    const labelled = { value: '84% (seeded register)', provenance: 'seeded_demo', note: 'Seeded mock attendance register. Not verified.' }
    const metric = buildSessionSummary(fresh(), { now: AT, attendance: labelled }).metrics.find((item) => item.key === 'attendance_view')
    expect(metric.display).toBe('84% (seeded register)')
    expect(metric.provenance).toBe('seeded_demo')
    expect(metric.provenanceLabel).toBe('Seeded demo data')
    expect(metric.available).toBe(true)
  })

  /* ── Acceptance remediation R11: provenance validation ──────────────────── */

  it('R11 downgrades an unknown attendance provenance to Unavailable', () => {
    const metric = buildSessionSummary(fresh(), {
      now: AT,
      attendance: { value: '99% (made up)', provenance: 'verified_magic', note: 'Unsupported tag.' },
    }).metrics.find((item) => item.key === 'attendance_view')
    expect(metric.provenance).toBe('unavailable')
    expect(metric.provenanceLabel).toBe('Unavailable')
    expect(metric.display).toBe('Unavailable')
    expect(metric.available).toBe(false)
    expect(metric.note).toContain('no attendance')
  })

  it('R11 never presents seeded or simulated attendance as recorded mock events', () => {
    const metric = buildSessionSummary(fresh(), {
      now: AT,
      attendance: { value: 'Simulated presence 84% (Present)', provenance: 'recorded_event', note: 'Wrong label.' },
    }).metrics.find((item) => item.key === 'attendance_view')
    expect(metric.provenance).not.toBe('recorded_event')
    expect(metric.provenance).toBe('unavailable')
    expect(metric.display).toBe('Unavailable')
    expect(metric.available).toBe(false)
  })

  it('R11 gives every metric a defined provenance label even with a bad tag', () => {
    const summary = buildSessionSummary(fresh(), {
      now: AT,
      attendance: { value: 'x', provenance: null, note: 'null tag' },
    })
    for (const metric of summary.metrics) {
      expect(['recorded_event', 'seeded_demo', 'unavailable']).toContain(metric.provenance)
      expect(typeof metric.provenanceLabel).toBe('string')
      expect(metric.provenanceLabel.length).toBeGreaterThan(0)
    }
  })

  it('separates simulated joins from real mock joins', () => {
    let state = fresh()
    state = apply(state, 'participant_joined', { participantId: 'real-1', name: 'You' }, new Date(AT).toISOString(), 'student')
    state = apply(state, 'participant_joined', { participantId: 'sim-1', name: 'Demo Seat' }, new Date(AT).toISOString(), 'simulated')
    const summary = buildSessionSummary(state, { now: AT })
    expect(summary.metrics.find((item) => item.key === 'mock_joins').display).toBe('1')
    expect(summary.metrics.find((item) => item.key === 'simulated_joins').display).toBe('1')
  })
})
