import { useEffect, useId, useMemo, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Checkbox, IconButton, Input, Select } from '@/shared/ui'
import { ConfirmAction } from './ConfirmAction.jsx'
import { cn } from '@/shared/lib/cn.js'
import { MathText } from '@/features/exam/components/MathText.jsx'
import { useSubtopics } from '../hooks/useFaculty.js'

/**
 * The authoring form. One column of decisions, one column of evidence: every
 * field that can contain LaTeX has a rendering underneath it, so the author sees
 * the candidate's page while typing rather than after saving.
 *
 * The service is the validator. This form's job is to make the service's rules
 * visible before the save is attempted — the readiness list at the bottom is the
 * same checklist, phrased as work remaining.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').BankFacets | undefined} props.facets
 * @param {import('@/contracts/faculty.js').BankQuestion | null} [props.question]
 * @param {(input: import('@/contracts/faculty.js').QuestionInput) => void} props.onSubmit
 * @param {boolean} [props.busy]
 * @param {string} [props.error]
 * @param {() => void} [props.onCancel]
 */
export function QuestionEditorForm({ facets, question = null, onSubmit, busy = false, error, onCancel }) {
  const subjects = facets?.subjects ?? []
  const topics = facets?.topics ?? []
  const [draft, setDraft] = useState(() => initialDraft(question, subjects[0]?.value ?? 'sub-phy', topics))
  const subtopics = useSubtopics(draft.topicId)
  const [tagText, setTagText] = useState(() => (question?.tags ?? []).join(', '))
  const [initial] = useState(() => JSON.stringify(draft))
  const typeId = useId()

  const filteredTopics = useMemo(
    () => topics.filter((topic) => !draft.subjectId || topic.subjectId === draft.subjectId),
    [topics, draft.subjectId],
  )
  const topicOptions = filteredTopics.length > 0 ? filteredTopics : topics
  const problems = readiness(draft)

  const set = (patch) => setDraft((current) => ({ ...current, ...patch }))

  // The facets arrive after the first render. Until a topic is chosen the draft
  // cannot be saved, so seed it from the bank as soon as the facet list lands.
  useEffect(() => {
    if (draft.topicId || topics.length === 0) return undefined
    const first = topics[0]
    setDraft((current) => (current.topicId ? current : { ...current, subjectId: first.subjectId, topicId: first.value }))
    return undefined
  }, [draft.topicId, topics])

  const chooseSubject = (subjectId) => {
    const first = topics.find((topic) => topic.subjectId === subjectId)
    set({ subjectId, topicId: first?.value ?? draft.topicId })
  }

  const setKind = (kind) => {
    const next = { ...draft, kind }
    if (kind === 'single' && next.correctOptions.length > 1) next.correctOptions = next.correctOptions.slice(0, 1)
    if (kind === 'multi' && next.correctOptions.length === 0) next.correctOptions = []
    if (kind === 'numerical' || kind === 'subjective') next.correctOptions = []
    if (kind === 'image') next.options = next.options.length >= 2 ? next.options : defaultOptions()
    setDraft(next)
  }

  const toggleKey = (key) => {
    if (draft.kind === 'multi') {
      const has = draft.correctOptions.includes(key)
      set({ correctOptions: has ? draft.correctOptions.filter((item) => item !== key) : [...draft.correctOptions, key].sort() })
      return
    }
    set({ correctOptions: [key] })
  }

  const updateOption = (index, patch) => {
    set({ options: draft.options.map((option, position) => (position === index ? { ...option, ...patch } : option)) })
  }

  const addOption = () => {
    if (draft.options.length >= 6) return
    const key = ['A', 'B', 'C', 'D', 'E', 'F'][draft.options.length] ?? 'A'
    set({ options: [...draft.options, { key, body: '' }] })
  }

  const removeOption = (index) => {
    const removed = draft.options[index]
    set({
      options: draft.options.filter((_, position) => position !== index),
      correctOptions: draft.correctOptions.filter((key) => key !== removed?.key),
    })
  }

  const parsedTags = tagText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const kindLabel = KINDS.find((item) => item.value === draft.kind)?.label ?? 'Question'

  return (
    <form
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ ...draft, tags: parsedTags })
      }}
    >
      {/* ── Left: the decisions ───────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-[560] tracking-tight text-heading">Question type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" id={typeId}>
            {KINDS.map((kind) => {
              const active = draft.kind === kind.value
              return (
                <button
                  key={kind.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(kind.value)}
                  className={cn(
                    'flex min-h-[var(--spacing-touch)] flex-col items-start gap-0.5 rounded-sm border px-2.5 py-2 text-left transition-colors',
                    active ? 'border-heading bg-surface-sunken' : 'border-line hover:border-line-strong',
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-1 text-2xs font-[560] text-heading">
                    {kind.label}
                    {active ? <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" /> : null}
                  </span>
                  <span className="text-2xs leading-tight text-muted">{kind.hint}</span>
                </button>
              )
            })}
          </div>
          <p className="text-2xs text-muted">{kindLabel} · marking follows the blueprint unless you override it below.</p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Subject"
            value={draft.subjectId}
            onChange={(event) => chooseSubject(event.target.value)}
            options={subjects.map((subject) => ({ value: subject.value, label: `${subject.label} · ${subject.count}` }))}
          />
          <Select
            label="Topic"
            value={draft.topicId}
            onChange={(event) => set({ topicId: event.target.value })}
            options={topicOptions.map((topic) => ({ value: topic.value, label: `${topic.label} · ${topic.count}` }))}
            hint="Drives the blueprint weightage and the item analysis."
          />
          <div className="flex flex-col gap-2">
            <Input
              label="Subtopic"
              value={draft.subtopic}
              onChange={(event) => set({ subtopic: event.target.value })}
              list={`${typeId}-subtopics`}
              hint="Pick an existing one or type a new one; the bank grows a facet for it."
            />
            <datalist id={`${typeId}-subtopics`}>
              {(subtopics.data ?? []).map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
          <Input
            label="Tags"
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
            placeholder="rotational motion, torque, moment of inertia"
            hint="Comma separated. Tags are what a search finds when the title does not."
          />
          <Select
            label="Difficulty"
            value={draft.difficulty}
            onChange={(event) => set({ difficulty: /** @type {any} */ (event.target.value) })}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
          <Select
            label="Bloom level"
            value={draft.bloom}
            onChange={(event) => set({ bloom: /** @type {any} */ (event.target.value) })}
            options={[
              { value: 'remember', label: 'Remember' },
              { value: 'understand', label: 'Understand' },
              { value: 'apply', label: 'Apply' },
              { value: 'analyse', label: 'Analyse' },
              { value: 'evaluate', label: 'Evaluate' },
              { value: 'create', label: 'Create' },
            ]}
          />
          <Select
            label="Source"
            value={draft.source}
            onChange={(event) => set({ source: /** @type {any} */ (event.target.value) })}
            options={[
              { value: 'authored', label: 'Authored' },
              { value: 'imported', label: 'Imported' },
              { value: 'previous_year', label: 'Previous year' },
              { value: 'coaching', label: 'Coaching' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marks"
              type="number"
              min={1}
              max={10}
              value={draft.marks}
              onChange={(event) => set({ marks: Number(event.target.value) })}
            />
            <Input
              label="Negative"
              type="number"
              min={0}
              step={0.25}
              value={draft.negativeMarks}
              onChange={(event) => set({ negativeMarks: Number(event.target.value) })}
              hint="0 for no penalty."
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${typeId}-body`} className="text-xs font-[560] tracking-tight text-heading">
            Question
          </label>
          <textarea
            id={`${typeId}-body`}
            value={draft.body}
            onChange={(event) => set({ body: event.target.value })}
            rows={4}
            placeholder="A uniform disc of mass $M$ and radius $R$ rotates about its centre. Its moment of inertia is…"
            className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          />
          <p className="text-2xs text-muted">Inline maths goes in $…$ and a displayed line in $$…$$.</p>
        </div>

        {draft.kind === 'image' ? (
          <Input
            label="Diagram URL"
            value={draft.imageUrl ?? ''}
            onChange={(event) => set({ imageUrl: event.target.value })}
            placeholder="/media/rotational-dynamics-sample.mp4"
            hint="Mock build: a path under /media. The question preview renders the stem with its diagram slot."
          />
        ) : null}

        {draft.kind === 'single' || draft.kind === 'multi' || draft.kind === 'image' ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-[560] tracking-tight text-heading">
              Options {draft.kind === 'multi' ? '· mark every correct option' : '· mark the correct option'}
            </legend>
            <ol className="flex flex-col gap-2">
              {draft.options.map((option, index) => {
                const correct = draft.correctOptions.includes(option.key)
                return (
                  <li key={option.key} className="flex items-start gap-2 rounded-sm border border-line p-2">
                    <span className="flex w-16 shrink-0 flex-col items-center gap-1 pt-1">
                      <span className="font-mono text-2xs text-faint">{option.key}</span>
                      <Checkbox
                        label={`${option.key} correct`}
                        checked={correct}
                        onChange={() => toggleKey(option.key)}
                        className="[&_label]:sr-only"
                      />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Input
                        label={`Option ${option.key}`}
                        value={option.body}
                        onChange={(event) => updateOption(index, { body: event.target.value })}
                        placeholder={option.key === 'A' ? '$\\frac{1}{2}MR^2$' : 'Option text'}
                      />
                      {draft.kind === 'image' ? (
                        <Input
                          label={`Option ${option.key} image`}
                          value={option.imageUrl ?? ''}
                          onChange={(event) => updateOption(index, { imageUrl: event.target.value })}
                          placeholder="/media/option-a.png"
                        />
                      ) : null}
                    </div>
                    <div className="pt-6">
                      <IconButton
                        icon={<Trash2 strokeWidth={1.5} />}
                        label={`Remove option ${option.key}`}
                        onClick={() => removeOption(index)}
                        disabled={draft.options.length <= 2}
                      />
                    </div>
                  </li>
                )
              })}
            </ol>
            <div>
              <Button variant="ghost" size="sm" icon={<Plus strokeWidth={1.5} />} onClick={addOption} disabled={draft.options.length >= 6}>
                Add option
              </Button>
            </div>
          </fieldset>
        ) : null}

        {draft.kind === 'numerical' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Answer"
              type="number"
              step="any"
              value={draft.correctNumeric ?? ''}
              onChange={(event) => set({ correctNumeric: event.target.value === '' ? null : Number(event.target.value) })}
            />
            <Input
              label="Tolerance"
              type="number"
              step="any"
              min={0}
              value={draft.numericTolerance}
              onChange={(event) => set({ numericTolerance: Number(event.target.value) })}
              hint="Accepted absolute error."
            />
            <Input label="Unit" value={draft.unit ?? ''} onChange={(event) => set({ unit: event.target.value })} placeholder="kg m²" />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor={`${typeId}-explanation`} className="text-xs font-[560] tracking-tight text-heading">
            {draft.kind === 'subjective' ? 'Model answer' : 'Explanation'}
          </label>
          <textarea
            id={`${typeId}-explanation`}
            value={draft.explanation}
            onChange={(event) => set({ explanation: event.target.value })}
            rows={4}
            placeholder="Why the key is right, and where the common wrong turn is."
            className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          />
          <p className="text-2xs text-muted">Shown to students after the result is released, and to evaluators for subjective answers.</p>
        </div>
      </div>

      {/* ── Right: the evidence ───────────────────────────────────── */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-topbar)+1rem)] lg:self-start">
        <section className="rounded-sm border border-line bg-surface-raised p-4">
          <p className="rule-label">Live preview</p>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" variant="outline" shape="none" mono>{kindLabel}</Badge>
              <Badge tone="neutral" variant="outline" shape="none" mono>
                {draft.difficulty} · {draft.bloom}
              </Badge>
              <span className="font-mono text-2xs tabular-nums text-faint">+{draft.marks} / −{draft.negativeMarks}</span>
            </div>
            <div className="text-xs leading-relaxed text-body" data-testid="editor-latex-preview">
              {draft.body.trim() ? <MathText text={draft.body} /> : <span className="text-faint">The stem appears here as the candidate reads it.</span>}
            </div>
            {draft.kind === 'image' && draft.imageUrl ? (
              <div className="grid h-24 place-items-center rounded-sm border border-dashed border-line-strong text-2xs text-faint">
                Diagram slot · {draft.imageUrl}
              </div>
            ) : null}
            {draft.options.length > 0 && (draft.kind === 'single' || draft.kind === 'multi' || draft.kind === 'image') ? (
              <ul className="flex flex-col gap-1.5 border-t border-line pt-2">
                {draft.options.map((option) => {
                  const correct = draft.correctOptions.includes(option.key)
                  return (
                    <li key={option.key} className={cn('flex items-start gap-2 text-2xs leading-relaxed', correct ? 'text-answer-fg' : 'text-muted')}>
                      <span className="mt-0.5 font-mono text-2xs">{option.key}</span>
                      <span className="min-w-0 flex-1">
                        {option.body ? <MathText text={option.body} /> : <span className="text-faint">Empty option</span>}
                        {option.imageUrl ? <span className="mt-0.5 block font-mono text-faint">{option.imageUrl}</span> : null}
                      </span>
                      {correct ? <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.4} aria-label="Correct answer" /> : null}
                    </li>
                  )
                })}
              </ul>
            ) : null}
            {draft.kind === 'numerical' ? (
              <p className="border-t border-line pt-2 text-2xs text-answer-fg">
                Answer {draft.correctNumeric ?? '—'} ± {draft.numericTolerance} {draft.unit ?? ''}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-sm border border-line bg-surface-sunken p-4">
          <p className="rule-label">Ready to save</p>
          {problems.length === 0 ? (
            <p className="mt-2 flex items-start gap-2 text-2xs leading-relaxed text-answer-fg">
              <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
              The bank has everything it needs. Saving makes this available to every paper immediately.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5" data-testid="editor-readiness">
              {problems.map((problem) => (
                <li key={problem} className="text-2xs leading-relaxed text-review-fg">• {problem}</li>
              ))}
            </ul>
          )}
          {error ? <p role="alert" className="mt-3 border-l-2 border-l-danger pl-2 text-2xs text-danger-fg">{error}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary" loading={busy} disabled={problems.length > 0}>
              {question ? 'Save changes' : 'Save to bank'}
            </Button>
            {onCancel ? (
              JSON.stringify(draft) === initial && tagText === (question?.tags ?? []).join(', ') ? (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Discard
                </Button>
              ) : (
                <ConfirmAction
                  title="Discard this draft?"
                  description="Anything typed on this page is lost. Nothing has been written to the bank yet, so no existing question changes."
                  detail={question ? question.code : 'A new question that has not been saved'}
                  confirmLabel="Discard draft"
                  onConfirm={onCancel}
                >
                  {(open) => (
                    <Button type="button" variant="ghost" onClick={open}>
                      Discard
                    </Button>
                  )}
                </ConfirmAction>
              )
            ) : null}
          </div>
        </section>
      </aside>
    </form>
  )
}

const KINDS = [
  { value: 'single', label: 'Single correct', hint: 'One key of four' },
  { value: 'multi', label: 'Multi correct', hint: 'Several keys' },
  { value: 'numerical', label: 'Numerical', hint: 'Value + tolerance' },
  { value: 'subjective', label: 'Subjective', hint: 'Model answer' },
  { value: 'image', label: 'Image based', hint: 'Diagram stem' },
]

/** @returns {{ key: string, body: string, imageUrl?: string }[]} */
function defaultOptions() {
  return ['A', 'B', 'C', 'D'].map((key) => ({ key, body: '' }))
}

/** @param {import('@/contracts/faculty.js').BankQuestion | null} question @param {string} subjectId @param {import('@/contracts/faculty.js').BankFacets['topics']} topics */
function initialDraft(question, subjectId, topics) {
  if (question) {
    return {
      kind: question.kind,
      subjectId: question.subjectId,
      topicId: question.topicId,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      bloom: question.bloom,
      source: question.source,
      body: question.body,
      options: question.options.map((option) => ({ ...option })),
      correctOptions: [...question.correctOptions],
      correctNumeric: question.correctNumeric,
      numericTolerance: question.numericTolerance,
      unit: question.unit,
      explanation: question.explanation,
      tags: [...question.tags],
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      imageUrl: question.imageUrl ?? '',
    }
  }
  const topic = topics.find((item) => item.subjectId === subjectId) ?? topics[0]
  return {
    kind: /** @type {const} */ ('single'),
    subjectId: topic?.subjectId ?? 'sub-phy',
    topicId: topic?.value ?? '',
    subtopic: '',
    difficulty: /** @type {const} */ ('medium'),
    bloom: /** @type {const} */ ('apply'),
    source: /** @type {const} */ ('authored'),
    body: '',
    options: defaultOptions(),
    correctOptions: [],
    correctNumeric: null,
    numericTolerance: 0.01,
    unit: null,
    explanation: '',
    tags: [],
    marks: 4,
    negativeMarks: 1,
    imageUrl: '',
  }
}

/** @param {ReturnType<typeof initialDraft>} draft @returns {string[]} */
function readiness(draft) {
  const problems = []
  if (draft.body.trim().length < 8) problems.push('Write the question — at least one full sentence.')
  if (!draft.topicId) problems.push('Choose a topic so the blueprint can count this item.')
  if (['single', 'multi', 'image'].includes(draft.kind)) {
    if (draft.options.length < 2) problems.push('A choice question needs at least two options.')
    if (draft.options.some((option) => !option.body.trim())) problems.push('Every option needs text.')
    if (draft.correctOptions.length === 0) problems.push('Mark the correct answer.')
    if (draft.kind === 'single' && draft.correctOptions.length > 1) problems.push('A single-correct question takes exactly one answer.')
  }
  if (draft.kind === 'numerical' && (draft.correctNumeric === null || !Number.isFinite(draft.correctNumeric))) {
    problems.push('Enter the numerical answer and its tolerance.')
  }
  if (draft.explanation.trim().length < 8) {
    problems.push(draft.kind === 'subjective' ? 'A subjective question needs a model answer.' : 'Write the explanation students will read.')
  }
  if (draft.marks <= 0) problems.push('Marks must be a positive number.')
  return problems
}
