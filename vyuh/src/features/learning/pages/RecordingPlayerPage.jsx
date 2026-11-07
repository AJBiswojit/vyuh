import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { ErrorState, Skeleton, useToast } from '@/shared/ui'
import { formatClock } from '@/shared/lib/format.js'
import { ChapterRail } from '../components/ChapterRail.jsx'
import { DoubtDialog } from '../components/DoubtDialog.jsx'
import { LectureToPractice } from '../components/LectureToPractice.jsx'
import { RecordingPlayer } from '../components/RecordingPlayer.jsx'
import { RecordingSidePanel } from '../components/RecordingSidePanel.jsx'
import { useAddBookmark, useAddNote, useCreateDoubt, useLearningStudentId, useRecording, useSubmitQuiz } from '../hooks/useLearning.js'
import { useVideoPlayback } from '../hooks/useVideoPlayback.js'

/** Player route wrapper so the media hook always receives a loaded recording. */
export function RecordingPlayerPage() {
  useDocumentTitle('Recording')
  const { recordingId = '' } = useParams()
  const studentId = useLearningStudentId()
  const [params] = useSearchParams()
  const rawTime = params.get('t')
  const deepLinkTime = rawTime !== null && Number.isFinite(Number(rawTime)) ? Math.max(0, Number(rawTime)) : null
  const query = useRecording(recordingId, studentId)
  if (query.isPending) return <Skeleton.Region label="Loading recording"><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"><Skeleton.Block className="aspect-video" /><Skeleton.Block className="h-96" /></div></Skeleton.Region>
  if (query.isError || !query.data) return <ErrorState title="Recording could not load" description={query.error?.message ?? 'This recording is not available.'} action={<Link to="/student/recordings" className="inline-flex min-h-11 items-center rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse">Back to library</Link>} />
  return <RecordingPlayerView recording={query.data} studentId={studentId} deepLinkTime={deepLinkTime} />
}

/** @param {{ recording: import('@/contracts/learning.js').RecordingDetail, studentId: string, deepLinkTime: number|null }} props */
function RecordingPlayerView({ recording, studentId, deepLinkTime }) {
  const playback = useVideoPlayback(recording, studentId, deepLinkTime)
  const bookmark = useAddBookmark(recording.id, studentId)
  const note = useAddNote(recording.id, studentId)
  const quiz = useSubmitQuiz(recording.id, studentId)
  const createDoubt = useCreateDoubt(studentId)
  const navigate = useNavigate()
  const toast = useToast()
  const [doubtOpen, setDoubtOpen] = useState(false)
  const currentChapter = recording.chapters.find((chapter) => playback.currentTime >= chapter.startSeconds && playback.currentTime < chapter.endSeconds)
  function addBookmark() {
    bookmark.mutate({ timeSeconds: playback.currentTime, label: currentChapter?.title ?? `Moment at ${formatClock(playback.currentTime)}` }, { onSuccess: () => toast.show({ title: 'Bookmark saved', description: `At ${formatClock(playback.currentTime)}.`, tone: 'success' }), onError: (error) => toast.show({ title: 'Bookmark not saved', description: error.message, tone: 'danger' }) })
  }
  return (
    <div>
      <PageHeader eyebrow="Recording" title={recording.title} description={recording.description} meta={<><Link to="/student/recordings" className="inline-flex items-center gap-1.5 text-2xs text-muted hover:text-heading"><ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Library</Link><span className="text-2xs text-muted">{recording.facultyName} · {recording.batchName}</span><span role="status" className="inline-flex items-center gap-1 font-mono text-2xs text-faint">{playback.saving ? 'Saving…' : playback.savedAt ? <><Check className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Resume saved</> : `Resume ${formatClock(recording.playback.positionSeconds)}`}</span></>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <RecordingPlayer recording={recording} playback={playback} onBookmark={addBookmark} bookmarkBusy={bookmark.isPending} />
          <ChapterRail chapters={recording.chapters} completedIds={playback.completedChapterIds} currentTime={playback.currentTime} onSeek={playback.seek} />
          {playback.ended ? <LectureToPractice quiz={recording.quiz} result={recording.quizResult} busy={quiz.isPending} onSubmit={(answers) => quiz.mutate(answers, { onError: (error) => toast.show({ title: 'Practice not submitted', description: error.message, tone: 'danger' }) })} /> : <p className="rounded-sm border border-line bg-surface-sunken px-4 py-3 text-2xs leading-relaxed text-muted">The three-question Lecture to Practice check unlocks when the video reaches its end. Seeking ahead does not complete chapters.</p>}
        </div>
        <RecordingSidePanel recording={recording} currentTime={playback.currentTime} onSeek={playback.seek} noteBusy={note.isPending} bookmarkBusy={bookmark.isPending}
          onAddNote={(text) => note.mutate({ timeSeconds: playback.currentTime, text }, { onSuccess: () => toast.show({ title: 'Note saved', description: `Attached to ${formatClock(playback.currentTime)}.`, tone: 'success' }), onError: (error) => toast.show({ title: 'Note not saved', description: error.message, tone: 'danger' }) })}
          onAddBookmark={addBookmark} onDoubt={() => setDoubtOpen(true)} />
      </div>
      <DoubtDialog open={doubtOpen} onClose={() => setDoubtOpen(false)} recordingTitle={recording.title} timeSeconds={playback.currentTime} busy={createDoubt.isPending} error={createDoubt.error?.message ?? null}
        onSubmit={({ title, body }) => createDoubt.mutate({ title, body, recordingId: recording.id, timeSeconds: playback.currentTime }, { onSuccess: (doubt) => { setDoubtOpen(false); toast.show({ title: 'Doubt posted', description: 'The timestamp is attached to your thread.', tone: 'success' }); navigate(`/student/doubts/${doubt.id}`) }, onError: (error) => toast.show({ title: 'Doubt not posted', description: error.message, tone: 'danger' }) })} />
    </div>
  )
}
