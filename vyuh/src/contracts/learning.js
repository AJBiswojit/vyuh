/**
 * Phase 6 contracts: live presence, recordings, doubts and study rooms.
 * Runtime media is mocked; attendance arithmetic, persistence and event ordering
 * are real. Services own every write; components only render these payloads.
 *
 * @typedef {Object} AttendancePolicy
 * @property {number} thresholdPercent          Present verdict starts here (75).
 * @property {number} graceMinutes              Late minutes excluded from the denominator.
 * @property {number} attentionReward           Points restored by “Still here”.
 * @property {number} attentionPenalty          Points lost when a check expires.
 * @property {number} checkMinMinutes
 * @property {number} checkMaxMinutes
 * @property {number} responseWindowSeconds
 *
 * @typedef {Object} AttentionResponse
 * @property {string} checkId
 * @property {'answered'|'missed'} outcome
 * @property {string} at                        ISO datetime.
 * @property {number} delta                     Signed attention-score change.
 *
 * @typedef {Object} LiveAttendanceState
 * @property {string} sessionId
 * @property {string} studentId
 * @property {string} joinedAt
 * @property {string|null} leftAt
 * @property {boolean} connected
 * @property {boolean} visible                    Tab visibility gates time credit.
 * @property {string} lastTickAt                  Wall-clock anchor for the next delta.
 * @property {number} eligibleSeconds           Session time after grace, capped at duration.
 * @property {number} attendedSeconds           Visible time credited to the student.
 * @property {number} attentionScore            0–100; seeded by the demo, then event-driven.
 * @property {number} presencePercent           Time coverage × attention score, rounded.
 * @property {'Present'|'Partial'|'Absent'} verdict
 * @property {number} lastDelta                 Most recent signed score change, for the tick.
 * @property {AttentionResponse[]} responses
 * @property {string|null} activeCheckId
 * @property {string} updatedAt
 *
 * @typedef {Object} AttendanceRecord
 * @property {string} sessionId
 * @property {string} title
 * @property {string} subjectName
 * @property {string} batchName
 * @property {string} date
 * @property {number} presencePercent
 * @property {'Present'|'Partial'|'Absent'} verdict
 * @property {number} attendedMinutes
 * @property {number} eligibleMinutes
 * @property {boolean} live                     True when derived from the active register.
 *
 * @typedef {Object} AttendanceReport
 * @property {string} studentId
 * @property {string} periodLabel
 * @property {AttendancePolicy} policy
 * @property {AttendanceRecord[]} sessions      Newest first.
 * @property {import('./student.js').AttendanceSummary} summary
 * @property {boolean} defaulter
 * @property {string} explanation               Plain-words threshold and grace rule.
 *
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} author
 * @property {'student'|'faculty'|'system'} role
 * @property {string} body
 * @property {string} sentAt
 *
 * @typedef {Object} QueueQuestion
 * @property {string} id
 * @property {string} sessionId
 * @property {string} author
 * @property {string} studentId
 * @property {string} body
 * @property {'pending'|'approved'} status
 * @property {number} upvotes
 * @property {boolean} votedByMe
 * @property {string} createdAt
 * @property {string|null} approvedAt
 *
 * @typedef {Object} AttentionChallenge
 * @property {string} id
 * @property {string} issuedAt
 * @property {string} expiresAt
 * @property {number} windowSeconds
 *
 * @typedef {Object} LiveRoom
 * @property {import('./live.js').LiveSession} session
 * @property {AttendancePolicy} policy
 * @property {ChatMessage[]} chat
 * @property {QueueQuestion[]} queue
 * @property {LiveAttendanceState|null} attendance
 * @property {string|null} recordingId
 *
 * @typedef {Object} PlaybackBookmark
 * @property {string} id
 * @property {number} timeSeconds
 * @property {string} label
 * @property {string} createdAt
 *
 * @typedef {Object} PlaybackNote
 * @property {string} id
 * @property {number} timeSeconds
 * @property {string} text
 * @property {string} createdAt
 *
 * @typedef {Object} PlaybackState
 * @property {string} recordingId
 * @property {number} positionSeconds           Resume point; seeking may move it backwards.
 * @property {number} watchedThroughSeconds     Monotonic natural-playback high-water mark.
 * @property {number} durationSeconds
 * @property {number} progressPercent
 * @property {number} speed
 * @property {boolean} ended                    Set only by the media `ended` event.
 * @property {string[]} completedChapterIds
 * @property {PlaybackBookmark[]} bookmarks
 * @property {PlaybackNote[]} notes
 * @property {string} lastWatchedAt
 *
 * @typedef {Object} RecordingChapter
 * @property {string} id
 * @property {string} title
 * @property {number} startSeconds
 * @property {number} endSeconds
 *
 * @typedef {Object} TranscriptSegment
 * @property {string} id
 * @property {number} startSeconds
 * @property {number} endSeconds
 * @property {string} text
 *
 * @typedef {Object} PracticeQuestion
 * @property {string} id
 * @property {string} prompt
 * @property {{ key: string, text: string }[]} options
 * @property {string} correctKey
 * @property {string} explanation
 *
 * @typedef {Object} PracticeQuiz
 * @property {string} id
 * @property {string} title
 * @property {PracticeQuestion[]} questions     Exactly three.
 *
 * @typedef {Object} QuizResult
 * @property {string} quizId
 * @property {number} score
 * @property {number} total
 * @property {Record<string,string>} answers
 * @property {string[]} correctQuestionIds
 * @property {string} submittedAt
 *
 * @typedef {Object} RecordingDetail
 * @property {string} id
 * @property {string} title
 * @property {string} chapterName
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} facultyName
 * @property {string} batchName
 * @property {string} description
 * @property {string} mediaUrl
 * @property {string} captionsUrl
 * @property {string} posterUrl
 * @property {number} durationSeconds
 * @property {number} durationMinutes           Legacy dashboard read model, rounded up.
 * @property {number} progressPercent
 * @property {string} lastWatchedAt
 * @property {string} publishedAt
 * @property {RecordingChapter[]} chapters
 * @property {TranscriptSegment[]} transcript
 * @property {PracticeQuiz} quiz
 * @property {PlaybackState} playback
 * @property {QuizResult|null} quizResult
 *
 * @typedef {Object} DoubtMessage
 * @property {string} id
 * @property {string} author
 * @property {'student'|'faculty'} role
 * @property {string} body
 * @property {string} createdAt
 *
 * @typedef {Object} DoubtThreadDetail
 * @property {string} id
 * @property {string} title
 * @property {'open'|'answered'} status
 * @property {string} subjectName
 * @property {string|null} recordingId
 * @property {string|null} recordingTitle
 * @property {number|null} timeSeconds
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {DoubtMessage[]} messages
 *
 * @typedef {Object} StudyParticipant
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {'studying'|'speaking'|'away'} presence
 * @property {boolean} isSelf
 *
 * @typedef {Object} StudyRoomDetail
 * @property {string} id
 * @property {string} name
 * @property {'interactive'} mode
 * @property {string} topic
 * @property {string} subjectName
 * @property {string} batchName
 * @property {number} peerCount
 * @property {number} capacity
 * @property {number} focusMinutes
 * @property {boolean} joined
 * @property {StudyParticipant[]} participants
 *
 * @typedef {Object} PlaybackInput
 * @property {number} positionSeconds
 * @property {number} speed
 * @property {number} watchedThroughSeconds
 * @property {boolean} ended
 * @property {string[]} [completedChapterIds]   Chapters crossed by natural playback.
 *
 * @typedef {Object} CreateDoubtInput
 * @property {string} studentId
 * @property {string} title
 * @property {string} body
 * @property {string|null} recordingId
 * @property {number|null} timeSeconds
 *
 * @typedef {{type:'chat',message:ChatMessage}|{type:'presence',attendance:LiveAttendanceState}|{type:'attention-challenge',challenge:AttentionChallenge}|{type:'attention-resolved',checkId:string}|{type:'question',question:QueueQuestion}|{type:'room-presence',room:StudyRoomDetail}} LearningEvent
 */

export {}
