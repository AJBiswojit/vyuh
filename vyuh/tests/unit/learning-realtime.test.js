import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEventEmitter, createMockClassChannel, randomBetween } from '../../src/mock-data/realtime.js'
import { attendancePolicy } from '../../src/mock-data/attendance.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function channel(overrides = {}) {
  const events = { presence: 0, chat: [], challenges: [], expired: [] }
  let clock = 0
  const instance = createMockClassChannel({
    sessionId: 'ses-test', policy: attendancePolicy, chatScript: [{ author: 'Peer', role: 'student', body: 'Hello' }],
    now: () => clock, random: overrides.random ?? (() => 0),
    onPresenceTick: () => { events.presence += 1 },
    onChat: (message) => events.chat.push(message),
    onAttentionChallenge: (challenge) => events.challenges.push(challenge),
    onAttentionExpired: (id) => events.expired.push(id),
    overrides: { attentionMinSeconds: 480, attentionMaxSeconds: 900, presenceTickSeconds: 5, chatIntervalSeconds: 12, ...overrides },
  })
  return { instance, events, advance: (ms) => { clock += ms; vi.advanceTimersByTime(ms) } }
}

describe('mock realtime policy', () => {
  it('draws an inclusive random interval between 8 and 15 minutes', () => {
    expect(randomBetween(() => 0, 480, 900)).toBe(480)
    expect(randomBetween(() => 0.999999, 480, 900)).toBe(900)
    expect(randomBetween(() => 0.5, 480, 900)).toBe(690)
  })
  it('fires the first check at the random boundary, then expires it after 15 seconds', () => {
    const { instance, events, advance } = channel({ random: () => 0 })
    instance.start()
    advance(479_000)
    expect(events.challenges).toHaveLength(0)
    advance(1_000)
    expect(events.challenges).toHaveLength(1)
    expect(events.challenges[0].windowSeconds).toBe(15)
    advance(14_000)
    expect(events.expired).toHaveLength(0)
    advance(1_000)
    expect(events.expired).toEqual([events.challenges[0].id])
    instance.stop()
  })
  it('honours the upper random bound and never overlaps response windows', () => {
    const { instance, events, advance } = channel({ random: () => 0.999999 })
    instance.start()
    advance(899_000)
    expect(events.challenges).toHaveLength(0)
    advance(1_000)
    expect(events.challenges).toHaveLength(1)
    expect(instance.attentionResolved(events.challenges[0].id)).toBe(true)
    advance(15_000)
    expect(events.expired).toHaveLength(0)
    expect(events.challenges).toHaveLength(1)
    instance.stop()
  })
  it('emits chat and presence ticks through the same channel', () => {
    const { instance, events, advance } = channel()
    instance.start()
    advance(12_000)
    expect(events.presence).toBeGreaterThanOrEqual(2)
    expect(events.chat[0].body).toBe('Hello')
    instance.stop()
  })
  it('clones event payloads and unsubscribes cleanly', () => {
    const emitter = createEventEmitter()
    const seen = []
    const off = emitter.subscribe((event) => seen.push(event))
    const event = { type: 'attention-resolved', checkId: 'check-1' }
    emitter.emit(event)
    event.checkId = 'mutated'
    expect(seen[0].checkId).toBe('check-1')
    off()
    emitter.emit(event)
    expect(seen).toHaveLength(1)
  })
})
