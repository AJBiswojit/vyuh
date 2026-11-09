import { useEffect, useRef, useState } from 'react'
import { ArrowUp, BarChart3, BookOpen, Plus, Send } from 'lucide-react'
import { Badge, Button, EmptyState, Sheet, Tab, TabList, TabPanel, Tabs, useToast } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatDateTime } from '@/shared/lib/format.js'

/**
 * The student side of the conversation — one list, one input, one Send action.
 * Chat and Questions are the only tabs; polls and resources stay one tap away
 * behind clearly labelled buttons that open a side panel. No moderation
 * controls appear here.
 *
 * Unread counts: the tab shows how many chat messages / approved questions
 * arrived since the student last looked at that tab. Counts disappear once
 * the tab is opened.
 *
 * @param {Object} props
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot|null} props.snapshot
 * @param {any} props.view
 * @param {boolean} props.studioAvailable
 * @param {(type: string, payload?: Object) => void} props.participate  Sends a mock event, auto-joining the shared classroom first if needed.
 * @param {React.ReactNode} props.pollsPanel    <PollsPanel student/> element, mounted inside the Polls sheet.
 * @param {React.ReactNode} props.resourcesPanel  <ResourcesPanel student/> element, mounted inside the Resources sheet.
 */
export function ClassroomInteractionPanel({ snapshot, view, studioAvailable, participate, pollsPanel, resourcesPanel }) {
  const [tab, setTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [question, setQuestion] = useState('')
  const [pollsOpen, setPollsOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [seen, setSeen] = useState(/** @type {{ chat: number, questions: number } | null} */ (null))
  const logRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const toast = useToast()

  const lines = view?.visibleChat ?? []
  const approved = view?.visibleQuestions ?? []
  const ownQuestions = (snapshot?.questions ?? []).filter((item) => item.author === 'You').slice(-3).reverse()
  const openPolls = (snapshot?.polls ?? []).filter((poll) => poll.status === 'open').length
  const resourceCount = snapshot?.resources.length ?? 0

  // Baseline: the first time content lands, nothing counts as unread.
  useEffect(() => {
    if (seen === null && snapshot) setSeen({ chat: lines.length, questions: approved.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, snapshot])

  const baseline = seen ?? { chat: lines.length, questions: approved.length }
  const unreadChat = tab === 'chat' ? 0 : Math.max(0, lines.length - baseline.chat)
  const unreadQuestions = tab === 'questions' ? 0 : Math.max(0, approved.length - baseline.questions)

  useEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [lines.length])

  function changeTab(next) {
    setTab(next)
    setSeen((previous) => ({
      chat: lines.length,
      questions: approved.length,
      ...(previous ?? {}),
      [next]: next === 'chat' ? lines.length : approved.length,
    }))
  }

  function submitChat(event) {
    event.preventDefault()
    const body = message.trim()
    if (!body) return
    participate('chat_sent', { body })
    setMessage('')
  }

  function submitQuestion(event) {
    event.preventDefault()
    const body = question.trim()
    if (!body) return
    participate('question_added', { body })
    setQuestion('')
    toast.show({ title: 'Question sent to faculty', description: 'It appears in your list now and in the class Q&A once faculty approves it.', tone: 'success' })
  }

  if (!studioAvailable) {
    return (
      <section aria-label="Classroom conversation" className="flex min-h-[22rem] flex-col items-center justify-center rounded-md border border-line bg-surface-raised p-6 text-center">
        <EmptyState
          size="panel"
          title="Class chat is not open for this session"
          description="The shared classroom runs for the Physics · Torque & Equilibrium demo class. In every other session, participation happens in the room itself — attendance is still automatic."
        />
      </section>
    )
  }

  return (
    <section aria-label="Classroom conversation" className="flex min-h-[26rem] min-w-0 flex-col rounded-md border border-line bg-surface-raised">
      <Tabs value={tab} onValueChange={changeTab} className="flex min-h-0 flex-1 flex-col">
        <TabList aria-label="Class conversation" className="shrink-0 px-2 pt-1">
          <Tab value="chat" count={unreadChat > 0 ? unreadChat : undefined}>Chat</Tab>
          <Tab value="questions" count={unreadQuestions > 0 ? unreadQuestions : undefined}>Questions</Tab>
        </TabList>

        <TabPanel value="chat" className="flex min-h-0 flex-1 flex-col">
          <div ref={logRef} role="log" aria-label="Class chat" aria-live="polite" tabIndex={0} className="scroll-region min-h-40 max-h-80 flex-1 space-y-3 overflow-y-auto p-3 focus-visible:outline-2">
            {lines.length === 0 ? (
              <EmptyState size="inline" title="No messages yet" description="Be the first to say hello — messages appear here for the whole class." />
            ) : lines.map((line) => (
              <article key={line.id} className="text-xs">
                <p className="flex items-baseline justify-between gap-2">
                  <span className={line.role === 'faculty' ? 'font-[560] text-heading' : line.author === 'You' ? 'font-[560] text-ember-press' : 'font-[560] text-body'}>{line.author}{line.author === 'You' ? ' (you)' : ''}</span>
                  <time className="shrink-0 font-mono text-2xs text-faint" dateTime={line.sentAt}>{formatDateTime(line.sentAt)}</time>
                </p>
                <p className="mt-0.5 leading-relaxed text-body">{line.body}</p>
                {line.pinned ? <Badge tone="ember" variant="soft" className="mt-1">Pinned by faculty</Badge> : null}
              </article>
            ))}
          </div>
          <form onSubmit={submitChat} className="flex items-center gap-2 border-t border-line p-3">
            <label className="sr-only" htmlFor="student-chat-input">Message the class</label>
            <input
              id="student-chat-input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder="Message the class…"
              className="min-h-11 min-w-0 flex-1 rounded-sm border border-line-strong bg-surface px-3 text-xs text-heading placeholder:text-faint"
            />
            <Button type="submit" variant="secondary" size="sm" loading={false} disabled={!message.trim()} icon={<Send strokeWidth={1.5} />}>Send</Button>
          </form>
        </TabPanel>

        <TabPanel value="questions" className="flex min-h-0 flex-1 flex-col">
          <div role="region" aria-label="Questions" tabIndex={0} className="scroll-region min-h-40 max-h-80 flex-1 space-y-3 overflow-y-auto p-3 focus-visible:outline-2">
            {ownQuestions.length > 0 ? (
              <section aria-label="Your questions" className="rounded-sm border border-line bg-surface p-2.5">
                <p className="rule-label">Your questions</p>
                <ul className="mt-2 space-y-2">
                  {ownQuestions.map((item) => (
                    <li key={item.id} className="text-xs">
                      <p className="leading-relaxed text-body">{item.body}</p>
                      <span className="mt-1 inline-block"><Badge tone={item.status === 'approved' ? 'answer' : 'review'} variant="soft">{item.status === 'approved' ? 'Faculty approved' : 'Waiting for faculty'}</Badge></span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {approved.length === 0 && ownQuestions.length === 0 ? (
              <EmptyState size="inline" title="No approved questions yet" description="Ask anything — faculty reads every submission. Approved questions appear here for the whole class." />
            ) : approved.map((item) => (
              <article key={item.id} className="rounded-sm border border-line bg-surface p-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs leading-relaxed text-body">{item.body}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={item.voterIds.includes('You')}
                    aria-label={`Upvote question: ${item.body}`}
                    onClick={() => participate('question_upvoted', { id: item.id })}
                    icon={<ArrowUp strokeWidth={1.5} />}
                    className="shrink-0 font-mono tabular-nums"
                  >
                    {item.seedUpvotes + item.voterIds.length}
                  </Button>
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-faint">
                  <span>{item.author}</span>
                  <Badge tone="answer" variant="soft">Faculty approved</Badge>
                </p>
              </article>
            ))}
          </div>
          <form onSubmit={submitQuestion} className="border-t border-line p-3">
            <label className="sr-only" htmlFor="student-question-input">Ask the faculty</label>
            <div className="flex items-end gap-2">
              <textarea
                id="student-question-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Ask a question…"
                className="min-h-11 w-full min-w-0 resize-none rounded-sm border border-line-strong bg-surface px-3 py-2 text-xs text-heading placeholder:text-faint"
              />
              <Button type="submit" variant="secondary" size="sm" disabled={!question.trim()} icon={<Plus strokeWidth={1.5} />}>Ask</Button>
            </div>
            <p className="mt-1.5 text-2xs leading-relaxed text-muted">Faculty reads every question. Yours appears in the class Q&amp;A once approved.</p>
          </form>
        </TabPanel>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
        <p className="text-2xs text-muted">Simulated class data — demo only</p>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" icon={<BarChart3 strokeWidth={1.5} />} onClick={() => setPollsOpen(true)} aria-haspopup="dialog">
            Polls{openPolls > 0 ? ` (${openPolls} open)` : ''}
          </Button>
          <Button variant="ghost" size="sm" icon={<BookOpen strokeWidth={1.5} />} onClick={() => setResourcesOpen(true)} aria-haspopup="dialog">
            Resources ({resourceCount})
          </Button>
        </div>
      </div>

      <Sheet open={pollsOpen} onClose={() => setPollsOpen(false)} title="Class polls" description="Vote with one tap — results are recorded mock votes, never a participation percentage." side="right" size="md">
        {pollsPanel}
      </Sheet>
      <Sheet open={resourcesOpen} onClose={() => setResourcesOpen(false)} title="Class resources" description="References for this class — opening one records a mock action." side="right" size="md">
        {resourcesPanel}
      </Sheet>
    </section>
  )
}
