import { useEffect, useMemo, useState } from 'react'
import { Dialog, Select } from '@/shared/ui'
import { useAddQuestionToAnyExam, useFacultyExams } from '../hooks/useFaculty.js'

/**
 * "Add to exam" from the preview pane. The dialog lists only papers that are
 * still editable — a live or completed paper is not offered, so the action
 * cannot fail after the reader has chosen it.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import('@/contracts/faculty.js').BankQuestion | null} props.question
 * @param {(examTitle: string, sectionName: string) => void} [props.onAdded]
 */
export function AddToExamDialog({ open, onClose, question, onAdded }) {
  const exams = useFacultyExams()
  const add = useAddQuestionToAnyExam()
  const editable = useMemo(() => {
    const rank = { draft: 0, pending_approval: 1, approved: 2, scheduled: 3 }
    return (exams.data ?? [])
      .filter((exam) => exam.status !== 'completed' && exam.status !== 'live')
      .sort((left, right) => (rank[left.status] ?? 9) - (rank[right.status] ?? 9))
  }, [exams.data])
  const [examId, setExamId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [error, setError] = useState('')

  const selectedExam = editable.find((exam) => exam.id === examId) ?? null

  useEffect(() => {
    if (!open) {
      setExamId('')
      setSectionId('')
      setError('')
      return
    }
    if (editable.length > 0 && !examId) {
      setExamId(editable[0].id)
      setSectionId(editable[0].sections[0]?.id ?? '')
    }
  }, [open, editable, examId])

  useEffect(() => {
    if (selectedExam) setSectionId(selectedExam.sections[0]?.id ?? '')
  }, [examId, selectedExam])

  if (!question) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add this question to a paper"
      description={`${question.code} · ${question.topicName}`}
      confirmLabel="Add to paper"
      cancelLabel="Cancel"
      busy={add.isPending}
      onConfirm={() => {
        if (!examId || !sectionId) {
          setError('Choose a paper and a section.')
          return
        }
        add.mutate(
          { examId, sectionId, questionId: question.id },
          {
            onSuccess: () => {
              const section = selectedExam?.sections.find((item) => item.id === sectionId)
              onAdded?.(selectedExam?.title ?? 'the paper', section?.name ?? 'the section')
              onClose()
            },
            onError: (/** @type {Error} */ mutationError) => setError(mutationError.message),
          },
        )
      }}
    >
      {editable.length === 0 ? (
        <p className="text-xs leading-relaxed text-muted">
          No editable paper exists yet. Create one on the Exams screen — a draft appears there immediately — and come back to add this question.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="Paper"
            value={examId}
            onChange={(event) => setExamId(event.target.value)}
            options={editable.map((exam) => ({
              value: exam.id,
              label: `${exam.title} · ${exam.status.replace('_', ' ')}`,
            }))}
            hint="Only drafts, papers awaiting approval and scheduled papers can change."
          />
          <Select
            label="Section"
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            options={(selectedExam?.sections ?? []).map((section) => ({
              value: section.id,
              label: `${section.name} · ${section.questionIds.length} questions`,
            }))}
            hint="The palette preview updates as soon as the question lands."
          />
          {error ? <p role="alert" className="text-xs text-danger-fg">{error}</p> : null}
        </div>
      )}
    </Dialog>
  )
}
