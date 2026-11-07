import { useState } from 'react'
import { Bookmark, MessageCircleQuestion, Search } from 'lucide-react'
import { Button, EmptyState, Input, Tab, TabList, TabPanel, Tabs } from '@/shared/ui'
import { formatClock } from '@/shared/lib/format.js'
import { activeTranscriptIndex } from '@/shared/lib/learningMath.js'
import { cn } from '@/shared/lib/cn.js'

/**
 * Beside-video notes, bookmarks and searchable transcript. The active line is
 * derived from the same currentTime the player renders, so it cannot drift by
 * more than the segment containing the playhead.
 * @param {{ recording: import('@/contracts/learning.js').RecordingDetail, currentTime: number, onSeek: (time:number)=>void, onAddNote: (text:string)=>void, onAddBookmark: ()=>void, onDoubt: ()=>void, noteBusy?: boolean, bookmarkBusy?: boolean }} props
 */
export function RecordingSidePanel({ recording, currentTime, onSeek, onAddNote, onAddBookmark, onDoubt, noteBusy, bookmarkBusy }) {
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')
  const activeIndex = activeTranscriptIndex(recording.transcript, currentTime)
  const q = query.trim().toLowerCase()
  const lines = recording.transcript.map((segment, index) => ({ ...segment, index })).filter((segment) => !q || segment.text.toLowerCase().includes(q))
  return (
    <Tabs defaultValue="notes" className="flex flex-col rounded-md border border-line bg-surface-raised">
      <TabList aria-label="Recording panel" className="px-2 pt-1">
        <Tab value="notes" count={recording.playback.notes.length}>Notes</Tab>
        <Tab value="bookmarks" count={recording.playback.bookmarks.length}>Bookmarks</Tab>
        <Tab value="transcript">Transcript</Tab>
      </TabList>
      <TabPanel value="notes" className="space-y-4 p-4">
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (!note.trim()) return; onAddNote(note); setNote('') }}>
          <label htmlFor="recording-note" className="text-xs font-[560] text-heading">Note at <span className="font-mono tabular-nums">{formatClock(currentTime)}</span></label>
          <textarea id="recording-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} placeholder="Capture the step, not just the answer…" className="w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-xs text-heading placeholder:text-faint" />
          <Button type="submit" variant="secondary" size="sm" loading={noteBusy} disabled={!note.trim()}>Save note</Button>
        </form>
        {recording.playback.notes.length === 0 ? <EmptyState title="No notes yet" description="Pause on a step and write the reason it works." /> : (
          <ul className="space-y-3">
            {recording.playback.notes.map((item) => (
              <li key={item.id} className="rounded-sm border border-line p-3">
                <button type="button" onClick={() => onSeek(item.timeSeconds)} className="font-mono text-2xs tabular-nums text-info-fg underline-offset-2 hover:underline">{formatClock(item.timeSeconds)}</button>
                <p className="mt-1 text-xs leading-relaxed text-body">{item.text}</p>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>
      <TabPanel value="bookmarks" className="space-y-4 p-4">
        <Button variant="secondary" size="sm" onClick={onAddBookmark} loading={bookmarkBusy} icon={<Bookmark strokeWidth={1.5} />}>Bookmark {formatClock(currentTime)}</Button>
        {recording.playback.bookmarks.length === 0 ? <EmptyState title="No bookmarks yet" description="Mark a moment you want to revisit before practice." /> : (
          <ul className="space-y-2">
            {recording.playback.bookmarks.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onSeek(item.timeSeconds)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-sm border border-line px-3 py-2 text-left hover:border-line-strong">
                  <span className="text-xs text-body">{item.label}</span>
                  <span className="shrink-0 font-mono text-2xs tabular-nums text-info-fg">{formatClock(item.timeSeconds)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>
      <TabPanel value="transcript" className="space-y-3 p-4">
        <Input label="Search transcript" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. moment arm" icon={<Search strokeWidth={1.5} />} />
        <p className="text-2xs text-faint" role="status">{lines.length} of {recording.transcript.length} lines · current line follows the video</p>
        <ol aria-label="Transcript" className="scroll-region max-h-96 space-y-1 overflow-y-auto" tabIndex={0}>
          {lines.map((segment) => {
            const active = segment.index === activeIndex
            return (
              <li key={segment.id}>
                <button type="button" onClick={() => onSeek(segment.startSeconds)} aria-current={active ? 'true' : undefined} data-active={active ? 'true' : undefined} className={cn('flex w-full gap-3 rounded-sm border-l-2 px-3 py-2 text-left transition-colors', active ? 'border-l-info bg-surface-sunken' : 'border-l-transparent hover:bg-surface-sunken')}>
                  <span className="shrink-0 font-mono text-2xs tabular-nums text-faint">{formatClock(segment.startSeconds)}</span>
                  <span className={cn('text-xs leading-relaxed', active ? 'font-[560] text-heading' : 'text-body')}>{segment.text}</span>
                </button>
              </li>
            )
          })}
        </ol>
        {lines.length === 0 ? <EmptyState title="No matching lines" description="Try a shorter phrase from the lecture." /> : null}
      </TabPanel>
      <div className="border-t border-line p-3">
        <Button variant="ghost" size="sm" onClick={onDoubt} icon={<MessageCircleQuestion strokeWidth={1.5} />}>Doubt at {formatClock(currentTime)}</Button>
      </div>
    </Tabs>
  )
}
