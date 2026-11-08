import { describe, expect, it } from 'vitest'
import {
  resolveStudioSession, assertCompatible, legacyFacultySessionIds, legacyStudentSessionIds,
} from '../../src/services/mock/liveStudioCompatibility.js'
import {
  facultyClasses, liveSessions, CANONICAL_STUDIO_SESSION_ID, STUDIO_SCENES, STUDIO_TOOLS,
  MIRROR_NOTICE, PROTOTYPE_NOTICE,
} from '../../src/mock-data/index.js'

describe('VYUH LIVE STUDIO — canonical session ownership', () => {
  it('recognizes only ses-rot-b as the shared Faculty/Student demo session', () => {
    expect(CANONICAL_STUDIO_SESSION_ID).toBe('ses-rot-b')
    const canonical = resolveStudioSession(CANONICAL_STUDIO_SESSION_ID)
    expect(canonical.compatible).toBe(true)
    expect(canonical.metadata.sessionId).toBe('ses-rot-b')
  })

  it('never silently maps another id onto the canonical session', () => {
    for (const id of ['ses-chem-b', 'ses-org-m', 'cls-optics-2', 'cls-elec-4', 'ses-rot-rec', '', null, undefined, '  ses-rot-b-alias  ']) {
      const result = resolveStudioSession(id)
      expect(result.compatible).toBe(false)
      expect(result.metadata).toBeNull()
      expect(result.reason.length).toBeGreaterThan(20)
    }
  })

  it('preserves every legacy Faculty and Student id untouched', () => {
    expect(legacyFacultySessionIds()).toEqual(['cls-optics-2', 'cls-current-3', 'cls-elec-4', 'cls-modern-5'])
    expect(legacyStudentSessionIds()).toEqual(['ses-chem-b', 'ses-org-m', 'ses-int-c', 'ses-elec-r', 'ses-rot-rec'])
    expect(facultyClasses).toHaveLength(5)
    expect(liveSessions).toHaveLength(6)
  })

  it('verifies matching title, batch, status and media across both fixtures', () => {
    const faculty = facultyClasses.find((item) => item.id === CANONICAL_STUDIO_SESSION_ID)
    const student = liveSessions.find((item) => item.id === CANONICAL_STUDIO_SESSION_ID)
    expect(faculty.title).toBe(student.title)
    expect(faculty.batchId).toBe(student.batchId)
    expect(faculty.status).toBe(student.status)
    expect(faculty.mediaUrl).toBe(student.mediaUrl)
    expect(resolveStudioSession(CANONICAL_STUDIO_SESSION_ID).compatible).toBe(true)
  })

  it('assertCompatible throws a fail-closed 404 for every non-canonical id', () => {
    for (const id of ['ses-chem-b', 'cls-modern-5', '']) {
      let thrown = null
      try { assertCompatible(id) } catch (error) { thrown = error }
      expect(thrown).toBeTruthy()
      expect(thrown.code).toBe('studio_session_unavailable')
      expect(thrown.status).toBe(404)
    }
    expect(() => assertCompatible(CANONICAL_STUDIO_SESSION_ID)).not.toThrow()
  })

  it('exposes five scenes, six tools and the exact notices through metadata', () => {
    const metadata = resolveStudioSession(CANONICAL_STUDIO_SESSION_ID).metadata
    expect(metadata.scenes).toHaveLength(5)
    expect(metadata.scenes.map((scene) => scene.id)).toEqual(STUDIO_SCENES.map((scene) => scene.id))
    expect(metadata.tools).toHaveLength(STUDIO_TOOLS.length)
    expect(metadata.provenanceLabels.recorded_event).toBe('Recorded mock events')
    expect(metadata.provenanceLabels.seeded_demo).toBe('Seeded demo data')
    expect(metadata.provenanceLabels.unavailable).toBe('Unavailable')
    expect(metadata.prototypeNotice).toBe(PROTOTYPE_NOTICE)
    expect(metadata.mirrorNotice).toBe(MIRROR_NOTICE)
  })

  it('does not modify any existing fixture while resolving', () => {
    const before = JSON.stringify({ facultyClasses, liveSessions })
    resolveStudioSession(CANONICAL_STUDIO_SESSION_ID)
    resolveStudioSession('ses-chem-b')
    expect(JSON.stringify({ facultyClasses, liveSessions })).toBe(before)
  })
})
