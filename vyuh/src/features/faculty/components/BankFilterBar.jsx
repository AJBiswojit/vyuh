import { Search, X } from 'lucide-react'
import { Button, Input, Select } from '@/shared/ui'

/**
 * The bank's filter bar. It sits above the ledger rather than beside it: a
 * faculty member scans rows top-down, and a left rail of filters would steal the
 * width the question text needs.
 *
 * Every control is labelled, the count is announced, and "Clear" only appears
 * when something is actually filtered — a reset button that can be pressed
 * without effect teaches the reader nothing.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').BankQuery} props.value
 * @param {(next: import('@/contracts/faculty.js').BankQuery) => void} props.onChange
 * @param {import('@/contracts/faculty.js').BankFacets} [props.facets]
 * @param {number} [props.total]
 * @param {boolean} [props.loading]
 * @param {React.ReactNode} [props.action]
 */
export function BankFilterBar({ value, onChange, facets, total, loading = false, action }) {
  const set = (patch) => onChange({ ...value, page: 1, ...patch })
  const active =
    Boolean(value.search) ||
    Boolean(value.subjectId) ||
    Boolean(value.topicId) ||
    (value.difficulty && value.difficulty !== 'all') ||
    (value.kind && value.kind !== 'all') ||
    (value.source && value.source !== 'all')

  const toOptions = (items, allLabel) => [
    { value: 'all', label: allLabel },
    ...(items ?? []).map((item) => ({ value: item.value, label: `${item.label} (${item.count})` })),
  ]

  const topics = (facets?.topics ?? []).filter((topic) => !value.subjectId || topic.subjectId === value.subjectId)

  return (
    <div className="border-y border-line bg-surface-raised">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <Input
            label="Search the bank"
            placeholder="Body text, code, topic or tag"
            value={value.search ?? ''}
            onChange={(event) => set({ search: event.target.value })}
            icon={<Search strokeWidth={1.5} />}
            className="min-w-0"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[46rem] lg:grid-cols-5">
          <Select
            label="Subject"
            value={value.subjectId ?? 'all'}
            onChange={(event) => set({ subjectId: event.target.value === 'all' ? '' : event.target.value, topicId: '' })}
            options={[{ value: 'all', label: 'All subjects' }, ...(facets?.subjects ?? []).map((subject) => ({ value: subject.value, label: `${subject.label} (${subject.count})` }))]}
          />
          <Select
            label="Topic"
            value={value.topicId ?? 'all'}
            onChange={(event) => set({ topicId: event.target.value === 'all' ? '' : event.target.value })}
            options={[{ value: 'all', label: 'All topics' }, ...topics.map((topic) => ({ value: topic.value, label: `${topic.label} (${topic.count})` }))]}
          />
          <Select
            label="Difficulty"
            value={value.difficulty ?? 'all'}
            onChange={(event) => set({ difficulty: /** @type {any} */ (event.target.value) })}
            options={toOptions(facets?.difficulties, 'Any difficulty')}
          />
          <Select
            label="Type"
            value={value.kind ?? 'all'}
            onChange={(event) => set({ kind: /** @type {any} */ (event.target.value) })}
            options={toOptions(facets?.kinds, 'Any type')}
          />
          <Select
            label="Source"
            value={value.source ?? 'all'}
            onChange={(event) => set({ source: /** @type {any} */ (event.target.value) })}
            options={toOptions(facets?.sources, 'Any source')}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2">
        <p className="font-mono text-2xs tabular-nums text-muted" aria-live="polite">
          {loading ? 'Filtering…' : `${total ?? 0} questions match`}
        </p>
        <div className="flex items-center gap-2">
          {active ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<X strokeWidth={1.5} />}
              onClick={() => onChange({ search: '', subjectId: '', topicId: '', difficulty: 'all', kind: 'all', source: 'all', page: 1 })}
            >
              Clear filters
            </Button>
          ) : null}
          {action}
        </div>
      </div>
    </div>
  )
}
