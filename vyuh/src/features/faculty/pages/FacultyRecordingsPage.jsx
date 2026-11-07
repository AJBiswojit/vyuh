import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Film, Upload } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDuration, formatRelative } from '@/shared/lib/format.js'
import { useBatches } from '@/features/batches/hooks/useBatches.js'
import { useBankQuestions } from '../hooks/useFaculty.js'
import { useCreateRecording, useFacultyRecordings } from '../hooks/useFacultyLive.js'

/**
 * The recording library. Uploads start here and finish in the editor, which is
 * where trim, chapters and the transcript live — a half-uploaded file is a row,
 * not a modal that blocks the page.
 */
export function FacultyRecordingsPage() {
  useDocumentTitle('Recordings')
  const toast = useToast()
  const navigate = useNavigate()
  const recordings = useFacultyRecordings()
  const batches = useBatches({ pageSize: 20 })
  const facets = useBankQuestions({ pageSize: 1 })
  const create = useCreateRecording()
  const [form, setForm] = useState({ title: '', subjectId: 'sub-phy', topicName: '', batchId: 'bat-prayas-m', fileName: 'rotational-dynamics-lecture.mp4' })
  const [error, setError] = useState('')

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))
  const items = recordings.data ?? []
  const unpublished = items.filter((item) => !item.published).length

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Recordings"
        title="Recordings"
        description="Every lecture this seat has uploaded, with its trim, chapters and caption track. An unpublished recording is invisible to students; publishing is a separate decision from uploading."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{items.length} in the library</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">{unpublished} unpublished</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {recordings.isPending ? (
            <div className="space-y-2" role="status" aria-busy="true">
              <span className="sr-only">Loading recordings</span>
              {[0, 1, 2, 3].map((index) => <Skeleton.Block key={index} className="h-16 rounded-sm" />)}
            </div>
          ) : recordings.isError ? (
            <ErrorState
              code="E_RECORDINGS"
              title="The library did not load"
              description={/** @type {Error} */ (recordings.error)?.message ?? 'Nothing was changed. Try again.'}
              action={<Button variant="secondary" onClick={() => recordings.refetch()} loading={recordings.isFetching}>Try again</Button>}
            />
          ) : (
            <div className="overflow-hidden rounded-sm border border-line bg-surface-raised">
              <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                <h2 className="text-xs font-[560] tracking-tight text-heading">Library</h2>
                <span className="font-mono text-2xs tabular-nums text-faint">newest first</span>
              </header>
              <ul className="divide-y divide-line" data-testid="recording-list">
                {items.map((recording) => (
                  <li key={recording.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-sm border border-line bg-surface-sunken">
                      <Film className="size-4 text-muted" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link to={`/faculty/recordings/${recording.id}`} className="block truncate text-xs font-[560] tracking-tight text-heading hover:text-ember-press">
                        {recording.title}
                      </Link>
                      <span className="mt-0.5 block truncate text-2xs text-muted">
                        {recording.subjectName} · {recording.topicName} · {recording.batchName}
                      </span>
                      <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">
                        {formatDuration(recording.durationSeconds)} · {recording.chapters.length} chapters · edited {formatRelative(recording.updatedAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {recording.uploadState !== 'ready' ? (
                        <Badge tone="review" variant="soft" shape="diamond">{recording.uploadState === 'uploading' ? 'Uploading' : 'Processing'}</Badge>
                      ) : recording.published ? (
                        <Badge tone="answer" variant="soft" shape="square">Published</Badge>
                      ) : (
                        <Badge tone="idle" variant="outline" shape="hollow">Unpublished</Badge>
                      )}
                      <Link
                        to={`/faculty/recordings/${recording.id}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-sm border border-line px-2.5 text-2xs font-[560] text-heading hover:border-line-strong"
                      >
                        Edit
                        <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
              {items.length === 0 ? <p className="px-3 py-6 text-center text-2xs text-muted">Nothing uploaded yet. The form on the right starts one.</p> : null}
            </div>
          )}
        </div>

        <Card eyebrow="Upload" title="Add a lecture" action={<Upload className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              setError('')
              create.mutate(
                {
                  title: form.title.trim(),
                  subjectId: form.subjectId,
                  topicName: form.topicName.trim() || 'Unassigned topic',
                  batchId: form.batchId,
                  fileName: form.fileName,
                  sizeBytes: 420_000_000,
                  durationSeconds: 2_880,
                },
                {
                  onSuccess: (recording) => {
                    toast.success('Upload started', `${recording.title} · the transfer runs in the editor.`)
                    set({ title: '', topicName: '' })
                    navigate(`/faculty/recordings/${recording.id}`)
                  },
                  onError: (/** @type {Error} */ mutationError) => setError(mutationError.message),
                },
              )
            }}
          >
            <Input
              label="Title"
              value={form.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="Rotational dynamics — torque and angular momentum"
              hint="Students search by this, so name the topic rather than the date."
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Subject"
                value={form.subjectId}
                onChange={(event) => set({ subjectId: event.target.value })}
                options={(facets.data?.facets.subjects ?? []).map((subject) => ({ value: subject.value, label: subject.label }))}
              />
              <Input label="Topic" value={form.topicName} onChange={(event) => set({ topicName: event.target.value })} placeholder="Rotational Motion" />
            </div>
            <Select
              label="Batch"
              value={form.batchId}
              onChange={(event) => set({ batchId: event.target.value })}
              options={(batches.data?.items ?? []).map((batch) => ({ value: batch.id, label: batch.name }))}
            />
            <Input
              label="File"
              value={form.fileName}
              onChange={(event) => set({ fileName: event.target.value })}
              hint="Mock build: the file name is recorded; the transfer itself is simulated in the editor."
            />
            <div className="rounded-sm bg-surface-sunken px-3 py-2 text-2xs text-muted">
              <p>48:00 · 420 MB · captions generated after upload</p>
              <p className="mt-1">Uploads resume if the tab closes; nothing is published until you say so.</p>
            </div>
            {error ? <p role="alert" className="text-xs text-danger-fg">{error}</p> : null}
            <Button type="submit" variant="primary" loading={create.isPending} disabled={form.title.trim().length < 4}>
              Start upload
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
