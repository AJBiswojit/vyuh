/**
 * Phase 7 contracts: the teaching workspace. A question bank, a paper builder,
 * a live exam monitor, item analysis, class hosting, recordings, attendance and
 * a doubt inbox — all faculty-scoped, all fed by the same service boundary.
 *
 * @typedef {import('./academic.js').Subject} Subject
 * @typedef {import('./assessment.js').QuestionState} QuestionState
 * @typedef {import('./learning.js').ChatMessage} ChatMessage
 * @typedef {import('./learning.js').QueueQuestion} QueueQuestion
 * @typedef {import('./live.js').LiveSession} LiveSession
 */

/** @typedef {'single'|'multi'|'numerical'|'subjective'|'image'} QuestionKind */
/** @typedef {'easy'|'medium'|'hard'} Difficulty */
/** @typedef {'remember'|'understand'|'apply'|'analyse'|'evaluate'|'create'} BloomLevel */
/** @typedef {'authored'|'imported'|'previous_year'|'coaching'} QuestionSource */
/** @typedef {'published'|'draft'|'retired'} QuestionStatus */

/**
 * @typedef {Object} BankOption
 * @property {string} key        A, B, C, D.
 * @property {string} body       Text, with inline LaTeX in $…$.
 * @property {string} [imageUrl] Present for image-based options.
 */

/**
 * @typedef {Object} BankQuestion
 * @property {string} id
 * @property {string} code                 Human code, e.g. PHY-ROT-0142.
 * @property {QuestionKind} kind
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} topicId
 * @property {string} topicName
 * @property {string} subtopic
 * @property {Difficulty} difficulty
 * @property {BloomLevel} bloom
 * @property {QuestionSource} source
 * @property {string} body                 Prompt, with inline/display LaTeX.
 * @property {BankOption[]} options        Empty for numerical/subjective.
 * @property {string[]} correctOptions     Keys; multi-correct may hold several.
 * @property {number|null} correctNumeric
 * @property {number} numericTolerance
 * @property {string|null} unit
 * @property {string} explanation          Shown to faculty and after release.
 * @property {string[]} tags
 * @property {number} marks
 * @property {number} negativeMarks
 * @property {QuestionStatus} status
 * @property {string} authorName
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} usageCount           Papers that already use it.
 * @property {string|null} [imageUrl]
 * @property {{ attempts: number, correctPercent: number, difficultyIndex: number, discrimination: number } | null} analysis
 */

/**
 * @typedef {Object} BankQuery
 * @property {string} [search]
 * @property {string} [subjectId]
 * @property {string} [topicId]
 * @property {Difficulty|'all'} [difficulty]
 * @property {QuestionKind|'all'} [kind]
 * @property {QuestionSource|'all'} [source]
 * @property {number} [page]
 * @property {number} [pageSize]
 */

/**
 * @typedef {Object} BankFacets
 * @property {{ value: string, label: string, count: number }[]} subjects
 * @property {{ value: string, label: string, count: number, subjectId: string }[]} topics
 * @property {{ value: string, label: string, count: number }[]} difficulties
 * @property {{ value: string, label: string, count: number }[]} kinds
 * @property {{ value: string, label: string, count: number }[]} sources
 */

/**
 * @typedef {Object} BankPage
 * @property {BankQuestion[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {BankFacets} facets
 */

/**
 * `topicId` and `subtopic` are chosen, but a new subtopic may be typed into the
 * editor — the bank then grows a facet for it.
 * @typedef {Object} QuestionInput
 * @property {QuestionKind} kind
 * @property {string} subjectId
 * @property {string} topicId
 * @property {string} subtopic
 * @property {Difficulty} difficulty
 * @property {BloomLevel} bloom
 * @property {QuestionSource} source
 * @property {string} body
 * @property {BankOption[]} options
 * @property {string[]} correctOptions
 * @property {number|null} correctNumeric
 * @property {number} numericTolerance
 * @property {string|null} unit
 * @property {string} explanation
 * @property {string[]} tags
 * @property {number} marks
 * @property {number} negativeMarks
 * @property {string|null} [imageUrl]
 */

/** @typedef {'NEET'|'JEE_MAIN'|'JEE_ADVANCED'|'GATE'|'CUSTOM'} ExamPatternId */
/** @typedef {'draft'|'pending_approval'|'approved'|'scheduled'|'live'|'completed'} FacultyExamStatus */
/** @typedef {'immediate'|'after_window'|'scheduled'|'manual'} ResultReleaseRule */
/** @typedef {'standard'|'strict'|'open_book'} IntegrityMode */

/**
 * @typedef {Object} ExamSectionDraft
 * @property {string} id
 * @property {string} name
 * @property {string} subjectId
 * @property {number} marksPerQuestion
 * @property {number} negativeMarks
 * @property {number} timeLimitMinutes       0 = no section limit.
 * @property {string[]} questionIds
 */

/**
 * @typedef {Object} ExamIntegrity
 * @property {boolean} webcam
 * @property {boolean} tabLock
 * @property {boolean} copyBlock
 * @property {boolean} ipLock
 * @property {boolean} questionShuffle
 * @property {boolean} optionShuffle
 */

/**
 * @typedef {Object} FacultyExam
 * @property {string} id
 * @property {string} title
 * @property {ExamPatternId} preset
 * @property {string} presetLabel
 * @property {string} ownerId
 * @property {string} ownerName
 * @property {string} batchId
 * @property {string} batchName
 * @property {FacultyExamStatus} status
 * @property {ExamSectionDraft[]} sections
 * @property {number} durationMinutes
 * @property {string|null} scheduleStart
 * @property {string|null} scheduleEnd
 * @property {ResultReleaseRule} resultReleaseRule
 * @property {string|null} resultReleaseAt
 * @property {IntegrityMode} integrityMode
 * @property {ExamIntegrity} integrity
 * @property {string} instructions
 * @property {number} totalQuestions
 * @property {number} totalMarks
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} [submittedAt]
 * @property {string|null} [approvedAt]
 * @property {string} [reviewNote]
 */

/**
 * @typedef {Object} ExamPattern
 * @property {ExamPatternId} id
 * @property {string} label
 * @property {string} description
 * @property {number} durationMinutes
 * @property {number} marksPerQuestion
 * @property {number} negativeMarks
 * @property {{ name: string, subjectId: string, count: number, timeLimitMinutes: number }[]} sections
 */

/**
 * One palette cell as the student will see it. The preview groups cells by
 * section so faculty can judge the balance before publishing.
 * @typedef {Object} PaletteCell
 * @property {string} questionId
 * @property {number} number
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} subjectName
 * @property {QuestionState} state     Always `not_visited` in a preview.
 * @property {boolean} missing         True when the question id is not in the bank.
 */

/**
 * @typedef {Object} ExamPreview
 * @property {string} examId
 * @property {string} title
 * @property {{ id: string, name: string, cells: PaletteCell[] }[]} sections
 * @property {number} totalQuestions
 * @property {number} totalMarks
 * @property {number} durationMinutes
 * @property {number} sectionTimeTotal
 * @property {string[]} warnings
 * @property {Record<string, number>} bySubject
 */

/** @typedef {'not_started'|'in_progress'|'answered'|'review'|'submitted'|'disconnected'} MonitorStudentStatus */

/**
 * @typedef {Object} MonitorStudent
 * @property {string} id
 * @property {string} name
 * @property {string} rollNumber
 * @property {string} initials
 * @property {MonitorStudentStatus} status
 * @property {number} answeredCount
 * @property {number} reviewCount
 * @property {number} total
 * @property {number} integrityFlags
 * @property {string[]} integrityNotes
 * @property {string} lastSeenAt
 * @property {number} progressPercent
 */

/**
 * @typedef {Object} MonitorEvent
 * @property {string} id
 * @property {string} at
 * @property {'join'|'answer'|'review'|'submit'|'integrity'|'disconnect'|'reconnect'} type
 * @property {string} studentId
 * @property {string} studentName
 * @property {string} label
 * @property {string} [note]
 */

/**
 * @typedef {Object} MonitorSnapshot
 * @property {string} examId
 * @property {string} examTitle
 * @property {string} batchName
 * @property {string} startedAt
 * @property {string} endsAt
 * @property {number} totalQuestions
 * @property {{ total: number, notStarted: number, inProgress: number, submitted: number, disconnected: number, flagged: number, answers: number }} counts
 * @property {{ submitted: number, total: number, percent: number }} progress
 * @property {MonitorStudent[]} students
 * @property {MonitorEvent[]} feed          Newest first, capped.
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ItemPoint
 * @property {string} questionId
 * @property {number} number
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} topicId
 * @property {string} topicName
 * @property {string} body
 * @property {number} difficultyIndex     Proportion correct, 0–1.
 * @property {number} discrimination      Upper-third minus lower-third, −1–1.
 * @property {number} attempts
 * @property {number} strongPercent
 * @property {number} weakPercent
 * @property {boolean} flagged
 * @property {string|null} flagReason
 * @property {boolean} faulty
 */

/**
 * @typedef {Object} WeakTopic
 * @property {string} topicId
 * @property {string} topicName
 * @property {string} subjectName
 * @property {number} accuracy
 * @property {number} itemCount
 * @property {number} studentsAffected
 * @property {{ title: string, minutes: number, resources: ({ label: string, href: string } | { label: string })[] }} reteach
 */

/**
 * @typedef {Object} ScoreImpactRow
 * @property {string} studentId
 * @property {string} name
 * @property {string} rollNumber
 * @property {number} before
 * @property {number} after
 * @property {number} delta
 */

/**
 * @typedef {Object} ItemAnalysis
 * @property {string} examId
 * @property {string} examTitle
 * @property {string} batchName
 * @property {number} cohortSize
 * @property {number} maxMarks
 * @property {ItemPoint[]} points
 * @property {{ meanDifficulty: number, meanDiscrimination: number, flaggedCount: number, faultyCount: number, reliability: number }} summary
 * @property {WeakTopic[]} weakTopics
 * @property {string[]} faultyQuestionIds
 * @property {ScoreImpactRow[]} scoreImpact
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FacultyClass
 * @property {string} id
 * @property {string} title
 * @property {'interactive'|'broadcast'} mode
 * @property {string} batchId
 * @property {string} batchName
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} facultyId
 * @property {string} facultyName
 * @property {string} startsAt
 * @property {number} durationMinutes
 * @property {number} attendanceThresholdPercent
 * @property {'scheduled'|'live'|'ended'|'cancelled'} status
 * @property {string} mediaUrl
 * @property {string} recordingId
 * @property {boolean} resourcesAttached
 */

/**
 * @typedef {Object} ClassInput
 * @property {string} title
 * @property {'interactive'|'broadcast'} mode
 * @property {string} batchId
 * @property {string} subjectId
 * @property {string} startsAt
 * @property {number} durationMinutes
 * @property {number} attendanceThresholdPercent
 * @property {boolean} resourcesAttached
 */

/**
 * @typedef {Object} HostParticipant
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {'present'|'idle'|'hand_raised'|'left'} state
 * @property {number} attentionScore
 * @property {boolean} muted
 * @property {string} lastSeenAt
 */

/**
 * @typedef {Object} HostEvent
 * @property {string} id
 * @property {string} at
 * @property {'presence'|'chat'|'queue'|'attention'|'host'} type
 * @property {string} label
 * @property {string} [studentId]
 * @property {string} [detail]
 */

/**
 * @typedef {Object} HostConsole
 * @property {FacultyClass} session
 * @property {string|null} startedAt
 * @property {string|null} endedAt
 * @property {boolean} live
 * @property {HostParticipant[]} participants
 * @property {{ present: number, idle: number, left: number, muted: number, handRaised: number, attentionOnTime: number, attentionMissed: number }} counts
 * @property {ChatMessage[]} chat
 * @property {string[]} hiddenChatIds
 * @property {QueueQuestion[]} queue
 * @property {{ id: string, issuedAt: string, expiresAt: string, responded: number, issued: number } | null} attentionCheck
 * @property {HostEvent[]} feed
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} RecordingChapterDraft
 * @property {string} id
 * @property {string} title
 * @property {number} startSeconds
 */

/**
 * @typedef {Object} FacultyRecording
 * @property {string} id
 * @property {string} title
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} topicName
 * @property {string} batchName
 * @property {string} fileName
 * @property {number} sizeBytes
 * @property {number} durationSeconds
 * @property {number} uploadProgress           0–100. 100 when ready.
 * @property {'uploading'|'processing'|'ready'} uploadState
 * @property {number} trimStartSeconds
 * @property {number} trimEndSeconds
 * @property {RecordingChapterDraft[]} chapters
 * @property {{ at: number, text: string }[]} transcript
 * @property {boolean} published
 * @property {string} ownerName
 * @property {string} updatedAt
 * @property {string} mediaUrl
 */

/**
 * @typedef {Object} RecordingInput
 * @property {string} title
 * @property {string} subjectId
 * @property {string} topicName
 * @property {string} batchId
 * @property {string} fileName
 * @property {number} sizeBytes
 * @property {number} durationSeconds
 */

/**
 * @typedef {Object} AttendanceRow
 * @property {string} studentId
 * @property {string} name
 * @property {string} rollNumber
 * @property {string} batchId
 * @property {string} batchName
 * @property {number} sessionsHeld
 * @property {number} present
 * @property {number} percent
 * @property {number} attentionAverage
 * @property {string} lastPresentAt
 * @property {boolean} defaulter
 */

/**
 * @typedef {Object} AttendanceExport
 * @property {string} fileName
 * @property {string} csv
 * @property {string} generatedAt
 * @property {number} rows
 */

/**
 * @typedef {Object} AttendanceReport
 * @property {string} periodLabel
 * @property {number} thresholdPercent
 * @property {string} batchId
 * @property {string} batchName
 * @property {AttendanceRow[]} rows
 * @property {{ students: number, defaulters: number, averagePercent: number, sessionsHeld: number }} summary
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FacultyDoubtMessage
 * @property {string} id
 * @property {string} author
 * @property {'student'|'faculty'} role
 * @property {string} body
 * @property {string} createdAt
 */

/**
 * @typedef {Object} FacultyDoubt
 * @property {string} id
 * @property {string} studentId
 * @property {string} studentName
 * @property {string} initials
 * @property {string} batchName
 * @property {string} subjectName
 * @property {string} topicName
 * @property {string} title
 * @property {string} body
 * @property {'open'|'answered'|'resolved'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {FacultyDoubtMessage[]} messages
 * @property {{ recordingId: string, recordingTitle: string, timeSeconds: number | null } | null} timestampLink
 * @property {number} waitingMinutes
 */

/**
 * @typedef {Object} ReplyTemplate
 * @property {string} id
 * @property {string} label
 * @property {string} body
 */

/**
 * @typedef {Object} FacultyDashboard
 * @property {string} facultyId
 * @property {string} facultyName
 * @property {string} termLabel
 * @property {{ id: string, title: string, subjectName: string, batchName: string, mode: 'interactive'|'broadcast', startsAt: string, durationMinutes: number, status: 'live'|'scheduled'|'ended', roomPath: string, attendanceThresholdPercent: number }[]} todayClasses
 * @property {{ id: string, studentName: string, title: string, subjectName: string, waitingMinutes: number, threadPath: string, status: 'open'|'answered' }[]} pendingDoubts
 * @property {{ id: string, examId: string, title: string, batchName: string, kind: 'approval'|'review', submittedAt: string, questionCount: number, note: string, builderPath: string }[]} approvals
 * @property {{ batchId: string, batchName: string, students: number, activeToday: number, attendancePercent: number, masteryPercent: number, atRisk: number, trend: { label: string, value: number }[], topWeakTopic: string }} cohort
 * @property {{ examId: string, title: string, batchName: string, startedAt: string, endsAt: string, submitted: number, total: number } | null} liveExam
 * @property {{ bankQuestions: number, drafts: number, scheduled: number, awaitingApproval: number, recordingsUnpublished: number, openDoubts: number }} stats
 */

export {}
