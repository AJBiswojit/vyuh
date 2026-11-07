import { CalendarClock, FileText, Timer } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Card, EmptyState, ErrorState, Skeleton, Tabs, Tab, TabList, TabPanel } from '@/shared/ui'
import { Button } from '@/shared/ui/Button.jsx'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useStudentHome } from '../hooks/useStudentHome.js'

/**
 * Student papers. One query (the student's snapshot) is reused rather than a
 * second endpoint: the papers a student can see are derived from the same
 * composed payload the overview reads, so the two screens cannot disagree.
 *
 * Three states per paper — scheduled, open, evaluated — and the empty tab says
 * what would fill it.
 */
export function StudentPapersPage() {
  useDocumentTitle('Papers')
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentHome(undefined)

  const papers = data ? [data.nextTest, data.resume].filter(Boolean) : []

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Papers"
        description="Everything scheduled, open and evaluated this term. A paper you have started keeps its own clock until it is submitted."
      />

      {isPending ? (
        <div className="border border-line bg-surface-raised p-5" role="status" aria-busy="true">
          <span className="sr-only">Loading papers</span>
          <div aria-hidden="true" className="space-y-4">
            <Skeleton.Line className="w-40" />
            <Skeleton.Block className="h-16 w-full" />
            <Skeleton.Block className="h-16 w-full" />
          </div>
        </div>
      ) : isError ? (
        <ErrorState
          code="E_PAPERS"
          title="Your papers could not load"
          description={
            /** @type {any} */ (error)?.message ??
            'The paper list failed to return. Nothing was changed. Try again, and if it keeps failing the academic office can confirm your enrolment.'
          }
          action={
            <Button variant="secondary" onClick={() => refetch()} loading={isRefetching}>
              Try again
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="scheduled">
          <TabList aria-label="Papers by state">
            <Tab value="scheduled" count={papers.filter((p) => p.status === 'scheduled').length}>
              Scheduled
            </Tab>
            <Tab value="open" count={papers.filter((p) => p.status === 'live').length}>
              Open
            </Tab>
            <Tab value="evaluated" count={data?.lastReport ? 1 : 0}>
              Evaluated
            </Tab>
          </TabList>

          <TabPanel value="scheduled" className="pt-5">
            {papers.filter((paper) => paper.status === 'scheduled').length === 0 ? (
              <EmptyState
                icon={<FileText strokeWidth={1.5} />}
                title="Nothing scheduled"
                description="Papers appear here once faculty publish them. Your batch timetable lists the next reporting time."
                code="0 papers"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {papers
                  .filter((paper) => paper.status === 'scheduled')
                  .map((paper) => (
                    <li key={paper.id}>
                      <Card
                        as="article"
                        eyebrow={`${paper.kind} · ${paper.track}`}
                        title={paper.title}
                        action={<Badge tone="ember" variant="outline" shape="none">Scheduled</Badge>}
                      >
                        <dl className="flex flex-wrap gap-x-8 gap-y-3">
                          <div>
                            <dt className="rule-label">Starts</dt>
                            <dd className="mt-1 flex items-center gap-1.5 font-mono text-2xs tabular-nums text-heading">
                              <CalendarClock className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
                              {paper.scheduledFor ? formatDateTime(paper.scheduledFor) : '—'}
                            </dd>
                            <dd className="mt-0.5 text-2xs text-faint">
                              {paper.scheduledFor ? formatRelative(paper.scheduledFor) : ''}
                            </dd>
                          </div>
                          <div>
                            <dt className="rule-label">Pattern</dt>
                            <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">
                              {paper.questionCount} questions · {paper.maxMarks} marks
                            </dd>
                          </div>
                          <div>
                            <dt className="rule-label">Duration</dt>
                            <dd className="mt-1 flex items-center gap-1.5 font-mono text-2xs tabular-nums text-heading">
                              <Timer className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
                              {paper.durationMinutes} min
                            </dd>
                          </div>
                        </dl>
                      </Card>
                    </li>
                  ))}
              </ul>
            )}
          </TabPanel>

          <TabPanel value="open" className="pt-5">
            {papers.filter((paper) => paper.status === 'live').length === 0 ? (
              <EmptyState
                title="No paper is open"
                description="An open paper stays resumable until its window closes. When one opens, it appears here and on your overview."
                code="0 open"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {papers
                  .filter((paper) => paper.status === 'live')
                  .map((paper) => (
                    <li key={paper.id}>
                      <Card
                        as="article"
                        eyebrow={`${paper.kind} · open now`}
                        title={paper.title}
                        action={<Badge tone="info" shape="circle" variant="solid">Live</Badge>}
                        footer={
                          <p className="text-2xs text-muted">
                            Answers save every two seconds while the timer runs.
                          </p>
                        }
                      >
                        <Button variant="primary">Resume paper</Button>
                      </Card>
                    </li>
                  ))}
              </ul>
            )}
          </TabPanel>

          <TabPanel value="evaluated" className="pt-5">
            {data?.lastReport ? (
              <Card
                eyebrow="Evaluated · Full Syllabus Mock 03"
                title="Score report"
                action={<Badge tone="answer" shape="square" variant="soft">Published</Badge>}
              >
                <p className="flex items-baseline gap-1.5">
                  <span className="font-display text-xl leading-none text-heading">{data.lastReport.score}</span>
                  <span className="font-mono text-sm tabular-nums text-faint">/ {data.lastReport.maxMarks}</span>
                </p>
                <p className="mt-2 text-2xs text-muted">
                  {data.lastReport.percentile.toFixed(1)} percentile · rank {data.lastReport.rank} of{' '}
                  {data.lastReport.cohortSize}
                </p>
              </Card>
            ) : (
              <EmptyState
                title="No evaluated papers yet"
                description="Objective papers evaluate on submit. A report appears here within fifteen minutes of the window closing."
                code="0 evaluated"
              />
            )}
          </TabPanel>
        </Tabs>
      )}
    </>
  )
}
