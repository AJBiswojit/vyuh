/**
 * Phase 5 result-sheet contracts. Every read model here is produced by the
 * analysis service from mock analysis data or a stored submission; components
 * never invent scores, counts, cohort values, or chart points.
 *
 * @typedef {import('./exam.js').ExamQuestion} ExamQuestion
 * @typedef {import('./exam.js').Confidence} Confidence
 * @typedef {import('./exam.js').MarkingScheme} MarkingScheme
 * @typedef {import('./assessment.js').TrendPoint} TrendPoint
 *
 * @typedef {'correct'|'wrong'|'skipped'} AnalysisOutcome
 * @typedef {'conceptual'|'careless'|'time_pressure'|'misread'|'guess'} MistakeCategory
 * @typedef {'all'|'correct'|'wrong'|'skipped'|'confident'|'lucky'} LedgerFilter
 *
 * @typedef {Object} MistakeDefinition
 * @property {MistakeCategory} id
 * @property {string} label
 * @property {string} advice
 *
 * @typedef {Object} ResponseDistribution
 * @property {string} key
 * @property {string} label
 * @property {number} count
 * @property {number} percent
 * @property {boolean} correct
 * @property {boolean} selectedByStudent
 *
 * @typedef {Object} QuestionAnalysis
 * @property {string} id
 * @property {number} number
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} subjectId
 * @property {string} topicId
 * @property {string} topicName
 * @property {ExamQuestion} question
 * @property {string[]} studentAnswer
 * @property {string[]} correctAnswer
 * @property {AnalysisOutcome} outcome
 * @property {Confidence | null} confidence
 * @property {boolean} confidentMistake
 * @property {boolean} luckyGuess
 * @property {MistakeCategory | null} mistakeCategory
 * @property {string} mistakeLabel
 * @property {number} marksDelta
 * @property {number} timeSpentSeconds
 * @property {number} cohortAverageSeconds
 * @property {number} cohortMedianSeconds
 * @property {number} difficultyIndex
 * @property {ResponseDistribution[]} responseDistribution
 * @property {string} explanation
 *
 * @typedef {Object} PacingPoint
 * @property {number} questionNumber
 * @property {string} questionId
 * @property {number} studentSeconds
 * @property {number} cohortAverageSeconds
 * @property {number} cohortMedianSeconds
 * @property {[number, number]} cohortBand
 * @property {'rushed'|'stalled'|null} flag
 *
 * @typedef {Object} AttemptVisit
 * @property {number} sequence
 * @property {string} questionId
 * @property {number} questionNumber
 * @property {string} sectionName
 * @property {string} enteredAt
 * @property {number} durationSeconds
 *
 * @typedef {Object} MistakeDnaSlice
 * @property {MistakeCategory} id
 * @property {string} label
 * @property {number} count
 * @property {number} percent
 * @property {string} advice
 *
 * @typedef {Object} HeatmapCell
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} topicId
 * @property {string} topicName
 * @property {number} attempted
 * @property {number} correct
 * @property {number} accuracy
 *
 * @typedef {Object} WhatIfSummary
 * @property {number} actualScore
 * @property {number} scoreWithoutNegative
 * @property {number} difference
 * @property {number} wrongCount
 * @property {number} negativeMarksLost
 *
 * @typedef {Object} AnalysisCost
 * @property {number} negativeMarksLost
 * @property {number} timeOnWrongSeconds
 * @property {number} confidentMistakes
 *
 * @typedef {Object} AnalysisSummary
 * @property {number} score
 * @property {number} maxMarks
 * @property {number} rank
 * @property {number} cohortSize
 * @property {number} percentile
 * @property {number} accuracy
 * @property {number} attempted
 * @property {number} correct
 * @property {number} wrong
 * @property {number} skipped
 * @property {number} durationSeconds
 * @property {AnalysisCost} cost
 *
 * @typedef {Object} AnalysisTrendPoint
 * @property {string} label
 * @property {string} date
 * @property {string} track
 * @property {number} score
 * @property {number} maxMarks
 * @property {number} scorePercent
 * @property {number} percentile
 * @property {number} cohortAveragePercent
 *
 * @typedef {Object} AnalysisDetails
 * @property {AnalysisSummary} summary
 * @property {QuestionAnalysis[]} questions
 * @property {PacingPoint[]} pacing
 * @property {AttemptVisit[]} path
 * @property {MistakeDnaSlice[]} mistakeDna
 * @property {MistakeCategory | null} dominantMistake
 * @property {string} mistakeAdvice
 * @property {HeatmapCell[]} heatmap
 * @property {WhatIfSummary} whatIf
 * @property {AnalysisTrendPoint[]} attemptTrend
 * @property {MarkingScheme} markingScheme
 *
 * @typedef {Object} ReleasePolicy
 * @property {boolean} released
 * @property {string | null} releaseAt
 * @property {string} serverNow
 * @property {number} offsetMs
 * @property {string} rule
 *
 * @typedef {Object} ExamScoreSummary
 * @property {number} score
 * @property {number} maxMarks
 * @property {number} percentile
 * @property {number} accuracy
 * @property {string} submittedAt
 * @property {{ subjectId: string, subjectName: string, scored: number, max: number, accuracy: number }[]} subjects
 *
 * @typedef {Object} ExamAnalysis
 * @property {string} examId
 * @property {string} examTitle
 * @property {string} attemptId
 * @property {string} studentId
 * @property {string} candidateName
 * @property {string} rollNumber
 * @property {string} submittedAt
 * @property {'fixture'|'submission'|'unpublished'} source
 * @property {ReleasePolicy} release
 * @property {AnalysisDetails | null} details
 * @property {string | null} notice                  Plain-words reason when no question-level sheet exists.
 * @property {ExamScoreSummary | null} scoreSummary   Real seeded attempt summary; never invented here.
 *
 * @typedef {Object} TopicRevisionQuestion
 * @property {string} id
 * @property {number} number
 * @property {string} body
 * @property {string[]} correctAnswer
 * @property {string} explanation
 *
 * @typedef {Object} TopicRevision
 * @property {string} topicId
 * @property {string} topicName
 * @property {string} subjectName
 * @property {number} mastery
 * @property {number} weightage
 * @property {string} advice
 * @property {TopicRevisionQuestion[]} questions
 */
export {}
