import { courses, questionSamples, simulate } from '../../mock-data/index.js'

/** @typedef {import('../types.js').CourseService} CourseService */
/** @typedef {import('../types.js').QuestionService} QuestionService */

/**
 * Course catalogue. Example service kept deliberately small: it shows the shape
 * every other mock service follows — barrel import, simulate(), no mutation.
 * @type {CourseService}
 */
export const courseService = {
  listCourses() {
    return simulate(() => courses)
  },
}

/**
 * A handful of questions, used by the design preview and by the exam runner's
 * first pass. Filtered by subject when asked.
 * @type {QuestionService}
 */
export const questionService = {
  listSamples(subjectId) {
    return simulate(() =>
      subjectId ? questionSamples.filter((question) => question.subjectId === subjectId) : questionSamples,
    )
  },
}
