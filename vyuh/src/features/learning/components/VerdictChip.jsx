import { CheckCircle2, CircleDot, MinusCircle } from 'lucide-react'
import { Badge } from '@/shared/ui'

const shapes = { Present: CheckCircle2, Partial: CircleDot, Absent: MinusCircle }
const tones = /** @type {const} */ ({ Present: 'answer', Partial: 'review', Absent: 'danger' })

/** Shape + label, never colour alone. @param {{ verdict: 'Present'|'Partial'|'Absent', percent?: number }} props */
export function VerdictChip({ verdict, percent }) {
  const Icon = shapes[verdict]
  return (
    <Badge tone={tones[verdict]} variant="outline" className="gap-1.5">
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      {verdict}{typeof percent === 'number' ? <span className="font-mono tabular-nums">· {percent}%</span> : null}
    </Badge>
  )
}
