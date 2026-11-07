import { useId, useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { Badge, Button, EmptyState, Input, Sheet } from '@/shared/ui'

/**
 * Add questions to one section. The sheet filters to the section's subject by
 * default — a Physics section should not offer Chemistry — and keeps a running
 * count so the reader knows when the blueprint is covered.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import('@/contracts/faculty.js').BankQuestion[]} props.items
 * @param {string} [props.subjectId]
 * @param {string} props.sectionName
 * @param {string[]} props.excludedIds
 * @param {(questionId: string) => void} props.onAdd
 * @param {boolean} [props.busy]
 */
export function BankPicker({ open, onClose, items, subjectId, sectionName, excludedIds, onAdd, busy = false }) {
  const [search, setSearch] = useState('')
  const [onlySubject, setOnlySubject] = useState(true)
  const searchId = useId()

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items
      .filter((item) => (onlySubject && subjectId ? item.subjectId === subjectId : true))
      .filter((item) =>
        term.length === 0
          ? true
          : `${item.code} ${item.topicName} ${item.subtopic} ${item.body} ${item.tags.join(' ')}`.toLowerCase().includes(term),
      )
      .slice(0, 80)
  }, [items, onlySubject, subjectId, search])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="lg"
      title={`Add questions · ${sectionName}`}
      description="Adding is immediate. Removing a question from a paper asks first."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-2xs tabular-nums text-faint">{excludedIds.length} already in this section</p>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Input
            id={searchId}
            label="Find in the bank"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            icon={<Search strokeWidth={1.5} />}
            placeholder="Code, topic, tag or words from the stem"
          />
          <label className="flex min-h-[var(--spacing-touch)] items-center gap-2 text-2xs text-muted">
            <input
              type="checkbox"
              checked={onlySubject}
              onChange={(event) => setOnlySubject(event.target.checked)}
              className="size-4 accent-[var(--color-ember)]"
            />
            Only this section&apos;s subject
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            code="0 MATCHES"
            title="Nothing in the bank matches"
            description="Clear the search, or write the item on the bank screen. A saved question is available here immediately."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line" data-testid="bank-picker">
            {rows.map((item) => {
              const added = excludedIds.includes(item.id)
              return (
                <li key={item.id} className="flex items-start gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-2xs tabular-nums text-faint">{item.code}</span>
                      <Badge tone="neutral" variant="outline" shape="none">{DIFFICULTY[item.difficulty]}</Badge>
                      <Badge tone="idle" variant="outline" shape="none">{KIND[item.kind]}</Badge>
                      {item.usageCount > 0 ? <span className="font-mono text-2xs text-faint">used {item.usageCount}×</span> : null}
                    </span>
                    <span className="mt-1 block truncate text-2xs text-body">{item.topicName} · {item.subtopic}</span>
                    <span className="mt-0.5 block truncate text-2xs text-faint">{item.body}</span>
                  </span>
                  <span className="shrink-0">
                    {added ? (
                      <span className="inline-flex min-h-9 items-center gap-1 text-2xs font-[560] text-answer-fg">
                        <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                        In paper
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus strokeWidth={1.8} />}
                        disabled={busy}
                        onClick={() => onAdd(item.id)}
                      >
                        Add
                      </Button>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Sheet>
  )
}

const DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const KIND = { single: 'Single', multi: 'Multi', numerical: 'Numerical', subjective: 'Subjective', image: 'Image' }
