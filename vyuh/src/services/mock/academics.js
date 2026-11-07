import { batches, chapters, subjects, simulate } from '../../mock-data/index.js'
import { notFound } from './errors.js'

/** @typedef {import('../types.js').AcademicService} AcademicService */

/** @type {AcademicService} */
export const academicService = {
  listBatches(query = {}) {
    return simulate(() => {
      const search = (query.search ?? '').trim().toLowerCase()
      const filtered = batches.filter((batch) => {
        if (!search) return true
        return (
          batch.name.toLowerCase().includes(search) ||
          batch.facultyLead.toLowerCase().includes(search) ||
          batch.track.toLowerCase().includes(search)
        )
      })

      const page = Math.max(1, query.page ?? 1)
      const pageSize = Math.max(1, query.pageSize ?? 10)
      const ordered = query.order === 'asc' ? [...filtered].reverse() : filtered
      const total = ordered.length

      return {
        items: ordered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    })
  },

  getBatch(batchId) {
    return simulate(() => {
      const batch = batches.find((candidate) => candidate.id === batchId)
      if (!batch) throw notFound('batch')
      return {
        ...batch,
        subjects: batch.subjectIds
          .map((id) => subjects.find((subject) => subject.id === id))
          .filter(Boolean),
        chapters: chapters.filter((chapter) => batch.subjectIds.includes(chapter.subjectId)),
      }
    })
  },

  listSubjects() {
    return simulate(() => subjects)
  },
}
