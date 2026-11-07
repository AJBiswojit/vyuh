import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useBankQuestion, useBankQuestions, useCreateQuestion, useUpdateQuestion } from '../hooks/useFaculty.js'
import { QuestionEditorForm } from '../components/QuestionEditorForm.jsx'

/**
 * The authoring screen. A new item and an edit share one form: the difference is
 * only whether the save creates or updates, and what the heading says. That is
 * deliberate — editing a question should ask the same questions as writing one.
 */
export function FacultyQuestionEditorPage() {
  const { questionId } = useParams()
  const editing = Boolean(questionId)
  useDocumentTitle(editing ? 'Edit question' : 'New question')
  const navigate = useNavigate()
  const toast = useToast()

  const facets = useBankQuestions({ pageSize: 1 })
  const question = useBankQuestion(questionId ?? '')
  const create = useCreateQuestion()
  const update = useUpdateQuestion(questionId ?? '')
  const busy = create.isPending || update.isPending
  const error = (/** @type {any} */ (create.error) ?? /** @type {any} */ (update.error))?.message

  if (editing && question.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading the question</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-9 w-[min(28rem,80%)]" />
        <Skeleton.Block className="h-64 rounded-sm" />
      </div>
    )
  }

  if (editing && question.isError) {
    return (
      <ErrorState
        code="E_QUESTION"
        title="That question is not in the bank"
        description={/** @type {Error} */ (question.error)?.message ?? 'It may have been deleted. The ledger on the bank screen lists everything this seat can edit.'}
        action={<Button variant="secondary" onClick={() => navigate('/faculty/bank')}>Back to the bank</Button>}
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Question bank"
        title={editing ? 'Edit question' : 'New question'}
        description={
          editing
            ? 'Changes save back to the bank and to every paper that has not been sat. A completed paper keeps the version it was sat with.'
            : 'Write the item once and reuse it across papers. The preview on the right is the candidate page, so maths is checked before it is saved.'
        }
        meta={
          editing && question.data ? (
            <>
              <Badge tone="neutral" variant="outline" shape="none" mono>{question.data.code}</Badge>
              <span className="font-mono text-2xs tabular-nums text-muted">used in {question.data.usageCount} papers</span>
            </>
          ) : (
            <span className="font-mono text-2xs tabular-nums text-muted">Drafts save to this faculty seat only</span>
          )
        }
      />

      <div className="mt-5">
        <QuestionEditorForm
          facets={facets.data?.facets}
          question={question.data ?? null}
          busy={busy}
          error={error}
          onCancel={() => navigate('/faculty/bank')}
          onSubmit={(input) => {
            if (editing) {
              update.mutate(input, {
                onSuccess: (saved) => {
                  toast.success('Question saved', `${saved.code} · ${saved.topicName}`)
                  navigate('/faculty/bank')
                },
              })
              return
            }
            create.mutate(input, {
              onSuccess: (saved) => {
                toast.success('Added to the bank', `${saved.code} is available to every draft now.`)
                navigate('/faculty/bank')
              },
            })
          }}
        />
      </div>
    </>
  )
}
