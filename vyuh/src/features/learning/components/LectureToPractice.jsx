import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button, Card, Radio } from '@/shared/ui'

/** Three-question end card. Rendered only after the media has reached its end. @param {{ quiz: import('@/contracts/learning.js').PracticeQuiz, result: import('@/contracts/learning.js').QuizResult|null, onSubmit: (answers:Record<string,string>)=>void, busy?: boolean }} props */
export function LectureToPractice({ quiz, result, onSubmit, busy }) {
  const [answers, setAnswers] = useState(/** @type {Record<string,string>} */ (result?.answers ?? {}))
  const complete = quiz.questions.every((question) => answers[question.id])
  return (
    <Card eyebrow="End of lecture" title={quiz.title} data-testid="lecture-to-practice">
      {result ? (
        <div className="space-y-4" role="status">
          <p className="text-sm font-[560] text-heading">You scored <span className="font-mono tabular-nums">{result.score}/{result.total}</span>.</p>
          <ul className="space-y-3">
            {quiz.questions.map((question) => {
              const correct = result.correctQuestionIds.includes(question.id)
              const Icon = correct ? CheckCircle2 : XCircle
              return (
                <li key={question.id} className="rounded-sm border border-line p-3">
                  <p className="flex items-start gap-2 text-xs font-[560] text-heading"><Icon className={correct ? 'mt-0.5 size-4 shrink-0 text-answer-fg' : 'mt-0.5 size-4 shrink-0 text-danger-fg'} strokeWidth={1.75} aria-hidden="true" />{question.prompt}</p>
                  <p className="mt-1 text-2xs text-muted">Your answer: {result.answers[question.id]} · Correct: {question.correctKey}</p>
                  <p className="mt-1 text-2xs leading-relaxed text-body">{question.explanation}</p>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (complete) onSubmit(answers) }}>
          {quiz.questions.map((question, index) => (
            <fieldset key={question.id} className="space-y-2">
              <legend className="text-xs font-[560] text-heading">{index + 1}. {question.prompt}</legend>
              {question.options.map((option) => (
                <Radio key={option.key} name={question.id} label={`${option.key}. ${option.text}`} value={option.key} checked={answers[question.id] === option.key} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.key }))} />
              ))}
            </fieldset>
          ))}
          <Button type="submit" variant="primary" disabled={!complete} loading={busy}>Check my understanding</Button>
        </form>
      )}
    </Card>
  )
}
