import { AlertCircle, Clock } from 'lucide-react'
import { Badge, EmptyState } from '@/shared/ui'
import { ProvenanceBadge } from './ProvenanceBadge.jsx'

/**
 * Honest post-session summary. Every row names its provenance; no verified
 * attendance, participant count, engagement percentage or score is invented.
 * The prototype notice is persistent, not a dismissible toast.
 * @param {{ summary: import('@/contracts/liveStudio.js').StudioSummary|null, snapshot: import('@/contracts/liveStudio.js').StudioSnapshot|null, metadata: any }} props
 */
export function SessionSummary({ summary, snapshot, metadata }) {
  const notice = summary?.notice ?? snapshot?.prototypeNotice ?? metadata?.prototypeNotice ?? ''
  const labels = metadata?.provenanceLabels ?? {}

  return (
    <section aria-labelledby="studio-summary-title" className="flex flex-col gap-3 rounded-sm border border-line bg-surface-raised p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="rule-label">After class</p>
          <h3 id="studio-summary-title" className="mt-1 flex items-center gap-2 text-sm font-[560] tracking-tight text-heading">
            <Clock className="size-4" strokeWidth={1.5} aria-hidden="true" />
            What happened in this class
          </h3>
        </div>
        {summary ? <Badge tone={summary.completion === 'ended' ? 'neutral' : summary.completion === 'live' ? 'answer' : 'review'} variant="soft">{summary.completionLabel}</Badge> : null}
      </header>

      {notice ? (
        <p className="flex items-start gap-2 rounded-sm border border-line-strong bg-surface-sunken px-3 py-2 text-2xs leading-relaxed text-body">
          <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {!summary || summary.metrics.length === 0 ? (
        <EmptyState size="inline" title="Summary not available yet" description="Recorded mock events will populate this summary as the prototype session is used." />
      ) : (
        <dl className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
          {summary.metrics.map((metric) => (
            <div key={metric.key} className="flex flex-col gap-1.5 rounded-sm border border-line bg-surface p-3">
              <dt className="text-2xs font-[560] uppercase tracking-wide text-muted">{metric.label}</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-[560] tracking-tight text-heading">{metric.display}</span>
                <ProvenanceBadge provenance={metric.provenance} labels={labels} />
              </dd>
              <p className="text-2xs leading-relaxed text-muted">{metric.note}</p>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
