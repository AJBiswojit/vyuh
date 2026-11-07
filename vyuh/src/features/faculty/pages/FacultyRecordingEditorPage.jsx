import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Trash2, UploadCloud } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, Checkbox, ErrorState, Input, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { formatDuration, formatRelative } from '@/shared/lib/format.js'
import { chapterProblem } from '@/shared/lib/facultyMath.js'
import { useDeleteRecording, useFacultyRecording, useSaveRecording } from '../hooks/useFacultyLive.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'
import { ChapterEditor, TranscriptPreview, TrimHandles } from '../components/RecordingEditors.jsx'

/**
 * The recording editor. The upload is simulated in two stages — transfer, then
 * processing — because a real one cannot be exercised in this build; the trim,
 * chapters and transcript below it are real state that survives a reload.
 *
 * Chapters are validated against the trim window before save, using the same
 * helper the service uses, so the inline warning and a rejected save agree.
 */
export function FacultyRecordingEditorPage() {
  const { recordingId = '' } = useParams()
  useDocumentTitle('Recording editor')
  const navigate = useNavigate()
  const toast = useToast()
  const recording = useFacultyRecording(recordingId)
  const save = useSaveRecording(recordingId)
  const remove = useDeleteRecording()

  const [draft, setDraft] = useState(/** @type {import('@/contracts/faculty.js').FacultyRecording | null} */ (null))
  const [progress, setProgress] = useState(0)
  const finished = useRef(false)

  useEffect(() => {
    if (recording.data) setDraft((current) => (current ? { ...recording.data, chapters: current.chapters } : recording.data))
  }, [recording.data])

  // Mock transfer: a local bar runs to 100, then one write marks the file ready.
  useEffect(() => {
    if (!recording.data || recording.data.uploadState === 'ready') {
      setProgress(100)
      return undefined
    }
    setProgress(0)
    finished.current = false
    const timer = setInterval(() => setProgress((current) => Math.min(100, current + 11)), 600)
    return () => clearInterval(timer)
    // save intentionally omitted: the bar restarts only when the file or its
    // state changes, and the ready write is guarded by `finished`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording.data?.id, recording.data?.uploadState])

  // One write when the bar lands: the service owns the state, the bar is theatre.
  useEffect(() => {
    if (!recording.data || recording.data.uploadState === 'ready' || progress < 100 || finished.current) return
    finished.current = true
    save.mutate(
      { uploadState: 'ready', uploadProgress: 100 },
      { onSuccess: () => toast.success('Upload finished', 'Captions generated. Trim, chapters and publish are unlocked.') },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, recording.data])

  if (recording.isPending || !draft) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading the recording</span>
        <Skeleton.Line className="w-44" />
        <Skeleton.Block className="h-9 w-[min(30rem,80%)]" />
        <Skeleton.Block className="h-72 rounded-sm" />
      </div>
    )
  }

  if (recording.isError) {
    return (
      <ErrorState
        code="E_RECORDING"
        title="That recording is not here"
        description={/** @type {Error} */ (recording.error)?.message ?? 'It may have been deleted. The library lists everything this seat owns.'}
        action={<Button variant="secondary" onClick={() => navigate('/faculty/recordings')}>Back to the library</Button>}
      />
    )
  }

  const ready = draft.uploadState === 'ready'
  const problem = chapterProblem(draft.chapters, draft)
  const publishedProblem = draft.published && problem ? problem : null
  const set = (patch) => setDraft((current) => (current ? { ...current, ...patch } : current))

  return (
    <>
      <PageHeader
        eyebrow={`Faculty workspace · ${draft.subjectName}`}
        title={draft.title}
        description={`${draft.batchName} · ${draft.topicName} · ${formatDuration(draft.durationSeconds)} · ${Math.round(draft.sizeBytes / 1_000_000)} MB. Edited ${formatRelative(draft.updatedAt)}.`}
        meta={
          <>
            {ready ? (
              draft.published ? (
                <Badge tone="answer" variant="soft" shape="square">Published</Badge>
              ) : (
                <Badge tone="idle" variant="outline" shape="hollow">Not published</Badge>
              )
            ) : (
              <Badge tone="review" variant="soft" shape="diamond">{draft.uploadState === 'uploading' ? `Uploading ${progress}%` : 'Processing'}</Badge>
            )}
            <span className="font-mono text-2xs tabular-nums text-muted">{draft.chapters.length} chapters</span>
            <span className="font-mono text-2xs tabular-nums text-muted">{draft.transcript.length} caption lines</span>
          </>
        }
        actions={
          <Button variant="secondary" icon={<ArrowLeft strokeWidth={1.5} />} onClick={() => navigate('/faculty/recordings')}>
            Library
          </Button>
        }
      />

      {!ready ? (
        <Card eyebrow="Upload" title="Transfer in progress">
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-2xs text-muted">
              <UploadCloud className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden="true" />
              {draft.fileName} · {Math.round(draft.sizeBytes / 1_000_000)} MB · this is a simulated transfer
            </p>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
              className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
            >
              <span className="block h-full rounded-full bg-heading transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="font-mono text-2xs tabular-nums text-faint">
              {progress}% · captions are generated after the transfer. Trimming unlocks when it finishes.
            </p>
            <p className="text-2xs text-muted">You can leave this page; the upload continues, and the library shows its state.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card eyebrow="Trim" title="Cut the edges">
              <TrimHandles recording={draft} onChange={(handle, seconds) => set(handle === 'start' ? { trimStartSeconds: seconds } : { trimEndSeconds: seconds })} />
            </Card>

            <Card eyebrow="Chapters" title="Chapter editor">
              <ChapterEditor
                recording={draft}
                chapters={draft.chapters}
                onChange={(chapters) => set({ chapters })}
                disabled={save.isPending}
              />
            </Card>

            <Card eyebrow="Captions" title="Transcript preview" action={<span className="font-mono text-2xs tabular-nums text-faint">{draft.transcript.length} lines</span>}>
              <TranscriptPreview lines={draft.transcript} />
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[calc(var(--spacing-topbar)+1rem)] xl:self-start">
            <Card eyebrow="Preview" title="Player">
              <div className="grid aspect-video place-items-center rounded-sm border border-line bg-ink text-paper">
                <span className="flex flex-col items-center gap-2 text-2xs text-on-ink-muted">
                  <Play className="size-6" strokeWidth={1.5} aria-hidden="true" />
                  Trimmed cut · {formatDuration(draft.trimEndSeconds - draft.trimStartSeconds)}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="rule-label">In</dt>
                  <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{formatDuration(draft.trimStartSeconds)}</dd>
                </div>
                <div>
                  <dt className="rule-label">Out</dt>
                  <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{formatDuration(draft.trimEndSeconds)}</dd>
                </div>
                <div>
                  <dt className="rule-label">Source</dt>
                  <dd className="mt-1 truncate font-mono text-2xs text-heading">{draft.fileName}</dd>
                </div>
                <div>
                  <dt className="rule-label">Owner</dt>
                  <dd className="mt-1 text-2xs text-heading">{draft.ownerName}</dd>
                </div>
              </dl>
            </Card>

            <Card eyebrow="Publish" title="Who can watch">
              <div className="flex flex-col gap-3">
                <Input label="Title" value={draft.title} onChange={(event) => set({ title: event.target.value })} />
                <Checkbox
                  label="Published to students"
                  description="Appears in the batch library at the next page load. Unpublishing removes it again."
                  checked={draft.published}
                  onChange={(event) => set({ published: event.target.checked })}
                />
                <p className={cn('text-2xs', publishedProblem || problem ? 'text-review-fg' : 'text-answer-fg')} role="status">
                  {publishedProblem ?? problem ?? 'Chapters ascend and sit inside the trim window. The cut is ready to publish.'}
                </p>
                <Button
                  variant="primary"
                  loading={save.isPending}
                  disabled={Boolean(publishedProblem || (draft.published && problem))}
                  onClick={() =>
                    save.mutate(
                      {
                        title: draft.title.trim(),
                        trimStartSeconds: draft.trimStartSeconds,
                        trimEndSeconds: draft.trimEndSeconds,
                        chapters: draft.chapters,
                        published: draft.published,
                      },
                      {
                        onSuccess: (saved) => toast.success('Recording saved', saved.published ? 'Students can watch the new cut.' : 'Saved as a draft in the library.'),
                        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
                      },
                    )
                  }
                >
                  {draft.published ? 'Save changes' : 'Save and publish'}
                </Button>
                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  {draft.published ? (
                    <ConfirmAction
                      title="Unpublish this recording?"
                      description="It leaves every student's library immediately. The chapters and transcript are kept, and publishing again restores access."
                      detail={draft.title}
                      confirmLabel="Unpublish"
                      onConfirm={() => {
                        set({ published: false })
                        save.mutate(
                          { published: false },
                          {
                            onSuccess: () => toast.show({ title: 'Unpublished', description: 'Students can no longer open it.', tone: 'neutral' }),
                            onError: (/** @type {Error} */ error) => toast.error('Not unpublished', error.message),
                          },
                        )
                      }}
                    >
                      {(open) => <Button variant="secondary" size="sm" onClick={open}>Unpublish</Button>}
                    </ConfirmAction>
                  ) : null}
                  <ConfirmAction
                    title="Delete this recording?"
                    description="The file, its chapters and its transcript are removed from the library. Papers that reference it lose the link."
                    detail={`${draft.title} · ${formatDuration(draft.durationSeconds)}`}
                    confirmLabel="Delete recording"
                    busy={remove.isPending}
                    onConfirm={() =>
                      remove.mutate(recordingId, {
                        onSuccess: () => {
                          toast.show({ title: 'Recording deleted', description: draft.title, tone: 'neutral' })
                          navigate('/faculty/recordings')
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
                </div>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </>
  )
}
