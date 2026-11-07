import { Badge } from '@/shared/ui/Badge.jsx'

/** Exam pattern as factual chips: questions, sections, duration, negative marking.
 * @param {{ exam: import('@/contracts/student.js').Exam }} props
 */
export function PatternChips({ exam }) {
  const hours = exam.durationMinutes % 60 === 0 ? `${exam.durationMinutes / 60} hrs` : `${exam.durationMinutes} min`
  const chips = [
    `${exam.questionCount} Q`,
    `${exam.sectionCount} ${exam.sectionCount === 1 ? 'section' : 'sections'}`,
    hours,
    exam.negativeMarks > 0 ? `−${exam.negativeMarks} negative` : 'no negative',
  ]
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Exam pattern">
      {chips.map((chip) => (
        <li key={chip}><Badge tone="neutral" variant="outline" mono shape="none">{chip}</Badge></li>
      ))}
    </ul>
  )
}
