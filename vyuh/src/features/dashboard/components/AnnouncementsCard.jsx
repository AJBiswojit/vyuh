import { Megaphone } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { formatRelative } from '@/shared/lib/format.js'

/**
 * Notices, newest first. Scope is stated as a word, not a colour. Bodies are
 * clamped to three lines so the card cannot grow unbounded; the full text is a
 * Phase 3 detail route.
 *
 * @param {{ items: import('../../../contracts/dashboard.js').Announcement[] }} props
 */
export function AnnouncementsCard({ items }) {
  return (
    <Card
      eyebrow="Notices"
      title="From the institute"
      action={
        <span className="flex items-center gap-1.5 font-mono text-2xs tabular-nums text-faint">
          <Megaphone className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          {items.length}
        </span>
      }
    >
      {items.length === 0 ? (
        <div className="border-l-2 border-l-line-strong pl-3">
          <p className="text-sm text-heading">Nothing new.</p>
          <p className="mt-1 text-xs text-muted">Notices from the academic office appear here as they publish.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id} className="group">
              <div className="flex items-center gap-2">
                <Badge tone="neutral" variant="outline" className="uppercase">
                  {item.scope}
                </Badge>
                <span className="font-mono text-2xs tabular-nums text-faint">{formatRelative(item.publishedAt)}</span>
              </div>
              <p className="mt-1.5 text-xs font-[560] leading-snug tracking-tight text-heading">{item.title}</p>
              <p className="mt-1 line-clamp-3 text-2xs leading-relaxed text-muted">{item.body}</p>
              <p className="mt-1 text-2xs text-faint">{item.author}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
