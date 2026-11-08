import { courses, questionSamples, simulate } from '../../mock-data/index.js'
import { demoSessionWorkspace } from './ownWorkspace.js'

/** BATCH 3.2 (F-01 / F-02): parameterless catalogue readers derive identity
 *  ONLY from a valid, matching persisted session. There is no preview context:
 *  a missing / expired / malformed / wrong-role session throws `not_found`,
 *  an issued student has no seeded course/question history, and only a valid
 *  matching demo session sees the fixtures. `isMockMode` is not consulted. */
function fixturesAllowed() { return demoSessionWorkspace('student') }

/** @typedef {import('../types.js').CourseService} CourseService */
/** @typedef {import('../types.js').QuestionService} QuestionService */

/**
 * Course catalogue. Example service kept deliberately small: it shows the shape
 * every other mock service follows — barrel import, simulate(), no mutation.
 * @type {CourseService}
 */
export const courseService = {
  listCourses() {
    return simulate(() => fixturesAllowed() ? courses : [])
  },
}

/**
 * A handful of question fixtures used by the exam runner's first pass. No
 * production demo-preview consumer exists (B3.2 ruling 2).
 * @type {QuestionService}
 */
export const questionService = {
  listSamples(subjectId) {
    return simulate(() => {
      if (!fixturesAllowed()) return []
      return subjectId ? questionSamples.filter((question) => question.subjectId === subjectId) : questionSamples
    })
  },
}
