import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Button, EmptyState, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useBankQuestions, useDeleteQuestion } from '../hooks/useFaculty.js'
import { BankFilterBar } from '../components/BankFilterBar.jsx'
import { QuestionTable } from '../components/QuestionTable.jsx'
import { QuestionPreview } from '../components/QuestionPreview.jsx'
import { ConfirmAction } from '../components/ConfirmAction.jsx'
import { AddToExamDialog } from '../components/AddToExamDialog.jsx'

const PAGE_SIZE = 25

/**
 * The bank. Dense on purpose: the filters are a bar across the top, the list is a
 * ledger, and the right pane is the question as a candidate would read it. Picking
 * a row changes the pane without leaving the search, which is the whole reason a
 * split view exists here.
 */
export function FacultyBankPage() {
  useDocumentTitle('Question bank')
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState({ search: '', subjectId: '', topicId: '', difficulty: 'all', kind: 'all', source: 'all' })
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const query = useMemo(
    () => ({
      search: filter.search.trim() || undefined,
      subjectId: filter.subjectId || undefined,
      topicId: filter.topicId || undefined,
      difficulty: filter.difficulty,
      kind: filter.kind,
      source: filter.source,
      page,
      pageSize: PAGE_SIZE,
    }),
    [filter, page],
  )

  const bank = useBankQuestions(query)
  const remove = useDeleteQuestion()
  const items = bank.data?.items ?? []
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null

  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    if (items.length > 0 && !items.some((item) => item.id === selectedId)) setSelectedId(items[0].id)
  }, [items, selectedId])

  const changeFilter = (patch) => setFilter((current) => ({ ...current, ...patch }))

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Question bank"
        title="Question bank"
        description="Every item this faculty has authored or imported, with the difficulty and discrimination the last sitting measured. Filter in the bar; read the item on the right."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{bank.data?.total ?? '—'} items match</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{bank.data?.facets.subjects.length ?? 0} subjects</span>
          </>
        }
        actions={
          <Link
            to="/faculty/bank/new"
            className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-ember bg-ember px-4 text-xs font-[560] tracking-tight text-on-ember hover:border-ember-press hover:bg-ember-press"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            New question
          </Link>
        }
      />

      <BankFilterBar
        value={filter}
        onChange={changeFilter}
        facets={bank.data?.facets}
        total={bank.data?.total ?? 0}
        loading={bank.isFetching}
      />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          {bank.isPending ? (
            <div className="space-y-2" role="status" aria-busy="true">
              <span className="sr-only">Loading the bank</span>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <Skeleton.Block key={index} className="h-12 rounded-sm" />
              ))}
            </div>
          ) : bank.isError ? (
            <ErrorState
              code="E_BANK"
              title="The bank did not load"
              description={/** @type {Error} */ (bank.error)?.message ?? 'Nothing was changed. Try again.'}
              action={<Button variant="secondary" onClick={() => bank.refetch()} loading={bank.isFetching}>Try again</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState
              code="0 ITEMS"
              title="No question matches those filters"
              description="Clear a filter, or write the item this paper is missing. A saved question appears here immediately and can be added to any draft."
              action={<Link to="/faculty/bank/new" className="inline-flex min-h-[var(--spacing-touch)] items-center rounded-sm border border-line px-4 text-xs font-[560] text-heading hover:border-line-strong">Write a question</Link>}
            />
          ) : (
            <div className="overflow-hidden rounded-sm border border-line bg-surface-raised">
              <QuestionTable items={items} selectedId={selected?.id ?? ''} onSelect={(question) => setSelectedId(question.id)} />
              <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
                <p className="font-mono text-2xs tabular-nums text-faint">
                  Page {bank.data?.page} of {bank.data?.totalPages} · {bank.data?.total} items
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((current) => Math.min(bank.data?.totalPages ?? 1, current + 1))}
                    disabled={page >= (bank.data?.totalPages ?? 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-[calc(var(--spacing-topbar)+1rem)] lg:self-start">
          {selected ? (
            <div className="rounded-sm border border-line bg-surface-raised">
              <QuestionPreview
                question={selected}
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
                      Add to exam
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/faculty/bank/${selected.id}`)}>
                      Edit
                    </Button>
                    <ConfirmAction
                      title="Delete this question?"
                      description="It leaves the bank for every paper that has not used it. A paper already holding it keeps the id and reports the question as missing until you replace it."
                      detail={`${selected.code} · ${selected.topicName}`}
                      confirmLabel="Delete question"
                      busy={remove.isPending}
                      onConfirm={() =>
                        remove.mutate(selected.id, {
                          onSuccess: () => {
                            toast.show({ title: 'Question deleted', description: selected.code, tone: 'neutral' })
                            setSelectedId('')
                          },
                          onError: (/** @type {Error} */ error) => toast.error('Not deleted', error.message),
                        })
                      }
                    >
                      {(open) => (
                        <Button variant="danger" size="sm" icon={<Trash2 strokeWidth={1.5} />} onClick={open}>
                          Delete
                        </Button>
                      )}
                    </ConfirmAction>
                  </>
                }
              />
              {selected.usageCount > 0 ? (
                <p className="flex items-center gap-2 border-t border-line px-4 py-2 text-2xs text-muted">
                  <ShieldAlert className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  Used in {selected.usageCount} {selected.usageCount === 1 ? 'paper' : 'papers'}. Deleting is blocked while a draft still holds it.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-line-strong p-6 text-center text-2xs text-muted">
              Select a row to read the question as the candidate will.
            </div>
          )}
        </aside>
      </div>

      <AddToExamDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        question={selected}
        onAdded={(title, section) => toast.success('Added to the paper', `${selected?.code} → ${title} · ${section}`)}
      />
    </>
  )
}
