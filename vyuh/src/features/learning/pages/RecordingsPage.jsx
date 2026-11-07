import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Play, Search } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Button, EmptyState, ErrorState, Input, Select, Skeleton } from '@/shared/ui'
import { formatClock, formatDate } from '@/shared/lib/format.js'
import { useLearningStudentId, useRecordingLibrary } from '../hooks/useLearning.js'

/** Ledger/grid library with persisted progress strips. */
export function RecordingsPage() {
  useDocumentTitle('Recordings')
  const studentId = useLearningStudentId()
  const query = useRecordingLibrary(studentId)
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('all')
  const all = query.data ?? []
  const subjects = [...new Set(all.map((item) => item.subjectName))]
  const q = search.trim().toLowerCase()
  const items = all.filter((item) => (subject === 'all' || item.subjectName === subject) && (!q || `${item.title} ${item.chapterName} ${item.facultyName}`.toLowerCase().includes(q)))
  return (
    <div>
      <PageHeader eyebrow="Learning · Recordings" title="Recordings" description="Resume where you stopped, jump by chapter, search the transcript, and turn the lecture into practice." actions={<div className="flex gap-1" role="group" aria-label="Library layout"><Button variant="ghost" size="sm" aria-pressed={view === 'grid'} onClick={() => setView('grid')} icon={<LayoutGrid strokeWidth={1.5} />}>Grid</Button><Button variant="ghost" size="sm" aria-pressed={view === 'ledger'} onClick={() => setView('ledger')} icon={<List strokeWidth={1.5} />}>Ledger</Button></div>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <Input label="Search recordings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, chapter or faculty" icon={<Search strokeWidth={1.5} />} />
        <Select label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} options={[{ value: 'all', label: 'All subjects' }, ...subjects.map((name) => ({ value: name, label: name }))]} />
      </div>
      {query.isPending ? <Skeleton.Region label="Loading recordings"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Skeleton.Block className="h-64" /><Skeleton.Block className="h-64" /><Skeleton.Block className="h-64" /></div></Skeleton.Region> : query.isError ? <ErrorState title="Recordings could not load" description={query.error.message} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : items.length === 0 ? <EmptyState size="panel" title="No recordings match" description="Clear the search or choose another subject." /> : view === 'grid' ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col overflow-hidden rounded-md border border-line bg-surface-raised">
              <Link to={`/student/recordings/${item.id}`} className="group block">
                <img src={item.posterUrl} alt="" className="aspect-video w-full object-cover" />
                <div className="h-1.5 bg-surface-sunken" role="progressbar" aria-valuenow={item.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} watched`}><span className="block h-full bg-ember" style={{ width: `${item.progressPercent}%` }} /></div>
                <div className="p-4">
                  <p className="rule-label">{item.subjectName} · {formatClock(item.durationSeconds)}</p>
                  <h2 className="mt-2 text-sm font-[560] leading-snug text-heading group-hover:underline">{item.title}</h2>
                  <p className="mt-1 text-2xs text-muted">{item.facultyName} · {item.batchName}</p>
                  <p className="mt-3 font-mono text-2xs tabular-nums text-faint">{item.progressPercent}% watched · resume {formatClock(item.playback.positionSeconds)}</p>
                </div>
              </Link>
              <div className="mt-auto border-t border-line p-3"><Link to={`/student/recordings/${item.id}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90"><Play className="size-4" strokeWidth={1.5} aria-hidden="true" />{item.playback.ended ? 'Rewatch' : item.progressPercent > 0 ? 'Continue watching' : 'Start watching'}</Link></div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface-raised">
          <table className="w-full min-w-[48rem] text-left text-xs">
            <caption className="sr-only">Recording ledger</caption>
            <thead><tr className="border-b border-line text-2xs uppercase tracking-widest text-faint"><th scope="col" className="p-3 font-normal">Lecture</th><th scope="col" className="p-3 font-normal">Subject</th><th scope="col" className="p-3 font-normal">Progress</th><th scope="col" className="p-3 font-normal">Published</th><th scope="col" className="p-3 font-normal"><span className="sr-only">Open</span></th></tr></thead>
            <tbody>{items.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <th scope="row" className="p-3 font-[560] text-heading"><Link to={`/student/recordings/${item.id}`} className="hover:underline">{item.title}</Link><span className="mt-0.5 block text-2xs font-normal text-muted">{item.facultyName}</span></th>
                <td className="p-3 text-body">{item.subjectName}</td>
                <td className="p-3"><div className="w-36"><div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={item.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} watched`}><span className="block h-full bg-ember" style={{ width: `${item.progressPercent}%` }} /></div><p className="mt-1 font-mono text-2xs tabular-nums text-faint">{item.progressPercent}% · {formatClock(item.playback.positionSeconds)}</p></div></td>
                <td className="p-3 font-mono text-2xs text-muted">{formatDate(item.publishedAt)}</td>
                <td className="p-3"><Link to={`/student/recordings/${item.id}`} className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-3 text-2xs font-[560] text-heading hover:border-heading">Open</Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
