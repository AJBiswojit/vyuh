import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

const STYLES = {
  recorded_event: { tone: 'answer', label: 'Recorded mock events' },
  seeded_demo: { tone: 'review', label: 'Seeded demo data' },
  unavailable: { tone: 'neutral', label: 'Unavailable' },
}

/**
 * Short, honest provenance marker. Never colour-only: the label always says
 * where the number came from.
 * @param {{ provenance: string, labels?: Record<string,string>, className?: string }} props
 */
export function ProvenanceBadge({ provenance, labels = {}, className }) {
  const style = STYLES[provenance] ?? STYLES.unavailable
  const label = labels[provenance] ?? style.label
  return (
    <Badge tone={style.tone} variant="soft" shape="dot" className={cn('whitespace-nowrap', className)}>
      {label}
    </Badge>
  )
}
