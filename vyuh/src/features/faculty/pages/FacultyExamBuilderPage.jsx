import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Button, Card, Checkbox, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useBatches } from '@/features/batches/hooks/useBatches.js'
import {
  useBankQuestions,
  useDeleteExam,
  useExamPreview,
  useFacultyExam,
  useExamQuestionMutation,
  useSaveExam,
  useSetExamStatus,
} from '../hooks/useFaculty.js'
import { ExamStatusBadge, isEditable } from '../components/ExamStatusBadge.jsx'
import { ExamSectionEditor } from '../components/ExamSectionEditor.jsx'
import { PalettePreview } from '../components/PalettePreview.jsx'
import { BankPicker } from '../components/BankPicker.jsx'
import { ConfirmAction } from '../components/ConfirmAction.jsx'

/**
 * The builder. Left: the paper's structure and rules. Right: the palette the
 * candidate will meet, live. The two panes read from one draft, so a section that
 * ends on an odd number is visible while it is being built rather than after it
 * is published.
 *
 * Question edits are committed before they are applied: adding a question first
 * saves the draft sections, then inserts. That ordering is what keeps a local
 * rename from reverting the question that was just added.
 */
export function FacultyExamBuilderPage() {
  const { examId = '' } = useParams()
  useDocumentTitle('Exam builder')
  const navigate = useNavigate()
  const toast = useToast()

  const exam = useFacultyExam(examId)
  const preview = useExamPreview(examId)
  const save = useSaveExam(examId)
  const { add, remove } = useExamQuestionMutation(examId)
  const setStatus = useSetExamStatus(examId)
  const discard = useDeleteExam()
  const bank = useBankQuestions({ pageSize: 100 })
  const batches = useBatches({ pageSize: 20 })

  const [draft, setDraft] = useState(/** @type {import('@/contracts/faculty.js').FacultyExam | null} */ (null))
  const [pickerSectionId, setPickerSectionId] = useState('')

  useEffect(() => {
    if (!exam.data) return
    setDraft((current) =>
      current && current.id === exam.data.id ? { ...current, ...exam.data, sections: current.sections } : exam.data,
    )
  }, [exam.data])

  const bankMap = useMemo(() => new Map((bank.data?.items ?? []).map((item) => [item.id, item])), [bank.data])
  const subjectOptions = (bank.data?.facets.subjects ?? []).map((subject) => ({ value: subject.value, label: subject.label }))
  const pickerSection = draft?.sections.find((section) => section.id === pickerSectionId) ?? null
  const dirty = draft && exam.data ? isDirty(draft, exam.data) : false
  const editable = draft ? isEditable(draft.status) : false
  const action = draft ? primaryAction(draft) : null

  /** Persist the local draft and return the stored exam. */
  const commit = async () => {
    if (!draft) return null
    return save.mutateAsync({
      sections: draft.sections,
      durationMinutes: draft.durationMinutes,
      scheduleStart: draft.scheduleStart,
      scheduleEnd: draft.scheduleEnd,
      resultReleaseRule: draft.resultReleaseRule,
      resultReleaseAt: draft.resultReleaseAt,
      integrityMode: draft.integrityMode,
      integrity: draft.integrity,
      instructions: draft.instructions,
      batchId: draft.batchId,
      batchName: draft.batchName,
    })
  }

  const handleAdd = async (questionId) => {
    if (!pickerSection) return
    try {
      if (dirty) await commit()
      const saved = await add.mutateAsync({ sectionId: pickerSection.id, questionId })
      setDraft(saved)
      toast.success('Question added', `${bankMap.get(questionId)?.code ?? questionId} → ${pickerSection.name}`)
    } catch (/** @type {any} */ error) {
      toast.error('Not added', error.message)
    }
  }

  const handleRemove = async (sectionId, questionId, number) => {
    try {
      if (dirty) await commit()
      const saved = await remove.mutateAsync({ sectionId, questionId })
      setDraft(saved)
      toast.show({ title: 'Removed from the paper', description: `Question ${number} is back in the bank only.`, tone: 'neutral' })
    } catch (/** @type {any} */ error) {
      toast.error('Not removed', error.message)
    }
  }

  if (exam.isPending || !draft) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading the paper</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-9 w-[min(30rem,80%)]" />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton.Block className="h-80 rounded-sm" />
          <Skeleton.Block className="h-80 rounded-sm" />
        </div>
      </div>
    )
  }

  if (exam.isError) {
    return (
      <ErrorState
        code="E_EXAM"
        title="That paper is not here"
        description={/** @type {Error} */ (exam.error)?.message ?? 'It may have been deleted. The exams screen lists everything this seat owns.'}
        action={<Button variant="secondary" onClick={() => navigate('/faculty/exams')}>Back to exams</Button>}
      />
    )
  }

  const set = (patch) => setDraft((current) => (current ? { ...current, ...patch } : current))
  const setSection = (sectionId, patch) =>
    setDraft((current) =>
      current ? { ...current, sections: current.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)) } : current,
    )

  return (
    <>
      <PageHeader
        eyebrow={`Faculty workspace · ${draft.presetLabel} paper`}
        title={draft.title}
        description={`${draft.batchName} · ${draft.totalQuestions} questions · ${draft.totalMarks} marks · ${draft.durationMinutes} minutes. ${
          editable ? 'Structure and rules save to this draft.' : 'A paper in this state is read-only; its analysis stays available.'
        }`}
        meta={
          <>
            <ExamStatusBadge status={draft.status} />
            <span className="font-mono text-2xs tabular-nums text-muted">updated {formatDateTime(draft.updatedAt)}</span>
            {dirty ? <span className="font-mono text-2xs text-review-fg">unsaved changes</span> : null}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={commit} loading={save.isPending} disabled={!dirty || !editable}>
              Save changes
            </Button>
            {action ? (
              <Button
                variant="primary"
                loading={setStatus.isPending}
                disabled={action.disabled}
                onClick={async () => {
                  try {
                    if (dirty) await commit()
                    const saved = await setStatus.mutateAsync(action.status)
                    setDraft(saved)
                    toast.success(action.done, `${saved.title} is now ${saved.status.replace('_', ' ')}.`)
                    if (action.status === 'live') navigate(`/faculty/exams/${examId}/monitor`)
                  } catch (/** @type {any} */ error) {
                    toast.error('Status not changed', error.message)
                  }
                }}
              >
                {action.label}
              </Button>
            ) : null}
          </>
        }
      />

      {!editable ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-surface-sunken px-3 py-2.5">
          <p className="text-2xs text-muted">
            {draft.status === 'live'
              ? 'This sitting is live. The paper cannot change until it ends.'
              : 'This sitting is complete. Scores and item analysis are read-only.'}
          </p>
          <Link
            to={draft.status === 'live' ? `/faculty/exams/${examId}/monitor` : `/faculty/analysis?exam=${encodeURIComponent(examId)}`}
            className="inline-flex min-h-9 items-center text-2xs font-[560] text-heading hover:text-ember-press"
          >
            {draft.status === 'live' ? 'Open the monitor' : 'Open the analysis'}
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm tracking-tight text-heading">Sections</h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus strokeWidth={1.5} />}
              disabled={!editable}
              onClick={() =>
                set({
                  sections: [
                    ...draft.sections,
                    {
                      id: `sec-new-${Date.now().toString(36)}`,
                      name: `Section ${draft.sections.length + 1}`,
                      subjectId: draft.sections[0]?.subjectId ?? 'sub-phy',
                      marksPerQuestion: draft.sections[0]?.marksPerQuestion ?? 4,
                      negativeMarks: draft.sections[0]?.negativeMarks ?? 1,
                      timeLimitMinutes: 0,
                      questionIds: [],
                    },
                  ],
                })
              }
            >
              Add section
            </Button>
          </div>

          {draft.sections.length === 0 ? (
            <p className="rounded-sm border border-dashed border-line-strong px-4 py-8 text-center text-2xs text-muted">
              This pattern starts with no sections. Add one, then add questions from the bank.
            </p>
          ) : (
            draft.sections.map((section, index) => (
              <div key={section.id} className="flex flex-col gap-1.5">
                <ExamSectionEditor
                  section={section}
                  index={index}
                  bank={bankMap}
                  subjectOptions={subjectOptions}
                  locked={!editable}
                  onChange={(patch) => setSection(section.id, patch)}
                  onRemoveQuestion={(questionId) => handleRemove(section.id, questionId, section.questionIds.indexOf(questionId) + 1)}
                  onOpenPicker={() => setPickerSectionId(section.id)}
                />
                {draft.sections.length > 1 && editable ? (
                  <div className="flex justify-end">
                    <ConfirmAction
                      title={`Remove ${section.name}?`}
                      description="The section and the questions placed in it leave the paper. The questions themselves stay in the bank."
                      detail={`${section.questionIds.length} questions in this section`}
                      confirmLabel="Remove section"
                      onConfirm={() => set({ sections: draft.sections.filter((item) => item.id !== section.id) })}
                    >
                      {(open) => (
                        <Button variant="ghost" size="sm" icon={<Trash2 strokeWidth={1.5} />} onClick={open}>
                          Remove section
                        </Button>
                      )}
                    </ConfirmAction>
                  </div>
                ) : null}
              </div>
            ))
          )}

          <Card eyebrow="Rules" title="Clock, window and release">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Duration (minutes)"
                type="number"
                min={10}
                value={draft.durationMinutes}
                disabled={!editable}
                onChange={(event) => set({ durationMinutes: Number(event.target.value) })}
              />
              <Select
                label="Batch"
                value={draft.batchId}
                disabled={!editable}
                onChange={(event) => {
                  const chosen = (batches.data?.items ?? []).find((batch) => batch.id === event.target.value)
                  set({ batchId: event.target.value, batchName: chosen?.name ?? draft.batchName })
                }}
                options={(batches.data?.items ?? []).map((batch) => ({ value: batch.id, label: batch.name }))}
                hint="Whoever sits the paper is on this roster."
              />
              <Input
                label="Window opens"
                type="datetime-local"
                value={toLocalInput(draft.scheduleStart)}
                disabled={!editable}
                onChange={(event) => set({ scheduleStart: fromLocalInput(event.target.value) })}
              />
              <Input
                label="Window closes"
                type="datetime-local"
                value={toLocalInput(draft.scheduleEnd)}
                disabled={!editable}
                onChange={(event) => set({ scheduleEnd: fromLocalInput(event.target.value) })}
                error={draft.scheduleStart && draft.scheduleEnd && Date.parse(draft.scheduleEnd) <= Date.parse(draft.scheduleStart) ? 'The window must close after it opens.' : undefined}
              />
              <Select
                label="Result release"
                value={draft.resultReleaseRule}
                disabled={!editable}
                onChange={(event) =>
                  set({
                    resultReleaseRule: /** @type {any} */ (event.target.value),
                    resultReleaseAt: event.target.value === 'scheduled' ? draft.resultReleaseAt : null,
                  })
                }
                options={[
                  { value: 'immediate', label: 'Immediately on submit' },
                  { value: 'after_window', label: 'After the window closes' },
                  { value: 'scheduled', label: 'At a set time' },
                  { value: 'manual', label: 'Manual release' },
                ]}
                hint="Students see nothing until this fires."
              />
              {draft.resultReleaseRule === 'scheduled' ? (
                <Input
                  label="Release at"
                  type="datetime-local"
                  value={toLocalInput(draft.resultReleaseAt)}
                  disabled={!editable}
                  onChange={(event) => set({ resultReleaseAt: fromLocalInput(event.target.value) })}
                />
              ) : null}
            </div>
          </Card>

          <Card eyebrow="Paper" title="Disposal">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-2xs leading-relaxed text-muted">
                Deleting removes the paper and its questions from this seat. Questions stay in the bank. A sitting that is live cannot be deleted.
              </p>
              <ConfirmAction
                title="Delete this paper?"
                description="The draft, its sections and its schedule disappear. Students never see it; questions stay in the bank and any completed sitting keeps its analysis."
                detail={`${draft.title} · ${draft.totalQuestions} questions`}
                confirmLabel="Delete paper"
                busy={discard.isPending}
                onConfirm={() =>
                  discard.mutate(examId, {
                    onSuccess: () => {
                      toast.show({ title: 'Paper deleted', description: draft.title, tone: 'neutral' })
                      navigate('/faculty/exams')
                    },
                    onError: (/** @type {Error} */ error) => toast.error('Not deleted', error.message),
                  })
                }
              >
                {(open) => (
                  <Button variant="danger" size="sm" icon={<Trash2 strokeWidth={1.5} />} onClick={open} disabled={draft.status === 'live'}>
                    Delete paper
                  </Button>
                )}
              </ConfirmAction>
            </div>
          </Card>

          <Card eyebrow="Integrity" title="What the sitting enforces">
            <div className="flex flex-col gap-4">
              <Select
                label="Mode"
                value={draft.integrityMode}
                disabled={!editable}
                onChange={(event) => set({ integrityMode: /** @type {any} */ (event.target.value), integrity: INTEGRITY_PRESETS[event.target.value] ?? draft.integrity })}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'strict', label: 'Strict' },
                  { value: 'open_book', label: 'Open book' },
                ]}
                hint="Choosing a mode sets the switches below; each switch can still be changed."
              />
              <fieldset className="grid gap-2 sm:grid-cols-2">
                <legend className="sr-only">Integrity switches</legend>
                {INTEGRITY_SWITCHES.map((item) => (
                  <Checkbox
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    checked={Boolean(draft.integrity[item.key])}
                    disabled={!editable}
                    onChange={(event) => set({ integrity: { ...draft.integrity, [item.key]: event.target.checked } })}
                  />
                ))}
              </fieldset>
              <div className="flex flex-col gap-2">
                <label htmlFor="exam-instructions" className="text-xs font-[560] tracking-tight text-heading">
                  Instructions shown before the paper
                </label>
                <textarea
                  id="exam-instructions"
                  value={draft.instructions}
                  disabled={!editable}
                  onChange={(event) => set({ instructions: event.target.value })}
                  rows={3}
                  placeholder="Calculator allowed. Rough sheets are collected at the end."
                  className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:bg-surface-sunken"
                />
              </div>
            </div>
          </Card>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-[calc(var(--spacing-topbar)+1rem)] xl:self-start">
          {preview.data ? (
            <Card eyebrow="Candidate view" title="What the hall will see">
              <PalettePreview
                preview={preview.data}
                compact
                onRemove={
                  editable
                    ? (questionId, sectionId, number) => handleRemove(sectionId, questionId, number)
                    : undefined
                }
              />
              <div className="mt-4 border-t border-line pt-3">
                <p className="rule-label">Approval</p>
                <p className="mt-2 text-2xs leading-relaxed text-muted">
                  {draft.status === 'draft'
                    ? 'Send the paper for approval once the outline is covered. The academic office returns it as approved or with a note.'
                    : draft.reviewNote ?? 'The academic office owns the approval step. A scheduled paper starts itself at the window.'}
                </p>
                {draft.submittedAt ? (
                  <p className="mt-2 font-mono text-2xs tabular-nums text-faint">Submitted {formatDateTime(draft.submittedAt)}</p>
                ) : null}
              </div>
            </Card>
          ) : (
            <Skeleton.Block className="h-96 rounded-sm" />
          )}
        </aside>
      </div>

      {pickerSection ? (
        <BankPicker
          open={Boolean(pickerSectionId)}
          onClose={() => setPickerSectionId('')}
          items={bank.data?.items ?? []}
          subjectId={pickerSection.subjectId}
          sectionName={pickerSection.name}
          excludedIds={pickerSection.questionIds}
          onAdd={handleAdd}
          busy={add.isPending || save.isPending}
        />
      ) : null}
    </>
  )
}

/** @param {import('@/contracts/faculty.js').FacultyExam} draft */
function primaryAction(draft) {
  if (draft.status === 'draft') {
    return { label: 'Send for approval', status: /** @type {const} */ ('pending_approval'), disabled: draft.totalQuestions === 0, done: 'Sent for approval' }
  }
  if (draft.status === 'pending_approval') {
    return { label: 'Mark approved', status: /** @type {const} */ ('approved'), disabled: false, done: 'Paper approved' }
  }
  if (draft.status === 'approved') {
    return { label: 'Mark scheduled', status: /** @type {const} */ ('scheduled'), disabled: false, done: 'Paper scheduled' }
  }
  if (draft.status === 'scheduled') {
    return { label: 'Start the sitting', status: /** @type {const} */ ('live'), disabled: false, done: 'Sitting started' }
  }
  return null
}

const INTEGRITY_SWITCHES = [
  { key: 'webcam', label: 'Webcam proctoring', description: 'Capture a frame every 60 seconds.' },
  { key: 'tabLock', label: 'Lock to one tab', description: 'Leaving the hall is logged and reported.' },
  { key: 'copyBlock', label: 'Block copy and paste', description: 'The stem cannot leave the window.' },
  { key: 'ipLock', label: 'One device per candidate', description: 'A second connection ends the first.' },
  { key: 'questionShuffle', label: 'Shuffle question order', description: 'Palette numbering stays stable per candidate.' },
  { key: 'optionShuffle', label: 'Shuffle options', description: 'Keys are remapped per candidate.' },
]

const INTEGRITY_PRESETS = {
  standard: { webcam: false, tabLock: true, copyBlock: true, ipLock: false, questionShuffle: true, optionShuffle: false },
  strict: { webcam: true, tabLock: true, copyBlock: true, ipLock: true, questionShuffle: true, optionShuffle: true },
  open_book: { webcam: false, tabLock: false, copyBlock: false, ipLock: false, questionShuffle: false, optionShuffle: false },
}

/** @param {string|null} iso */
function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (/** @type {number} */ value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** @param {string} value */
function fromLocalInput(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** @param {import('@/contracts/faculty.js').FacultyExam} draft @param {import('@/contracts/faculty.js').FacultyExam} stored */
function isDirty(draft, stored) {
  const pick = (/** @type {any} */ exam) => ({
    sections: exam.sections,
    durationMinutes: exam.durationMinutes,
    scheduleStart: exam.scheduleStart,
    scheduleEnd: exam.scheduleEnd,
    resultReleaseRule: exam.resultReleaseRule,
    resultReleaseAt: exam.resultReleaseAt,
    integrityMode: exam.integrityMode,
    integrity: exam.integrity,
    instructions: exam.instructions,
    batchId: exam.batchId,
  })
  return JSON.stringify(pick(draft)) !== JSON.stringify(pick(stored))
}
