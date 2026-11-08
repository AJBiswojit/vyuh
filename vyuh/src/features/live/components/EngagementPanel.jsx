import { useState } from 'react'
import { ArrowUp, Bookmark, Check, EyeOff, Hand, Plus, Send, Volume2, VolumeX } from 'lucide-react'
import { Badge, Button, EmptyState, Input, Tab, TabList, TabPanel, Tabs } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { ProvenanceBadge } from './ProvenanceBadge.jsx'

/** @param {{ title: string, description: string }} props */
function PanelEmpty({ title, description }) {
  return <EmptyState size="inline" title={title} description={description} />
}

/**
 * Shared engagement rail. Works in both themes because it uses theme-aware
 * design tokens. Faculty gets moderation actions; Students get participation
 * actions. Every button writes a recorded mock event — there are no decorative
 * controls.
 * @param {Object} props
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot} props.snapshot
 * @param {any} props.view
 * @param {(type:string,payload?:Object,options?:Object)=>void} props.send
 * @param {'faculty'|'student'} props.role
 * @param {string} props.activeTab
 * @param {(tab:string)=>void} props.onTabChange
 * @param {any} props.metadata
 * @param {import('@/contracts/liveStudio.js').StudioQuestion[]} [props.questions]
 *   Moderated question list for Students. Faculty always sees the full queue.
 */
export function EngagementPanel({ snapshot, view, send, role, activeTab, onTabChange, metadata, questions }) {
  const faculty = role === 'faculty'
  /* R12: Students see only approved/visible questions; Faculty retains the
     pending queue and its Approve action. */
  const questionList = faculty ? snapshot.questions : (questions ?? view.visibleQuestions ?? [])
  const [chatBody, setChatBody] = useState('')
  const [questionBody, setQuestionBody] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState('Yes, No, Not sure')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceDetail, setResourceDetail] = useState('')

  const lines = faculty ? snapshot.chat : view.visibleChat
  const provenanceLabels = view.provenanceLabels ?? {}

  /** @param {string} name */
  const simulated = (name) => ({ simulateAs: `${name} (simulated participant)`, detail: `${name} (labelled seeded-participant simulation).` })

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex min-h-0 flex-col">
      {/* R14: the legacy LiveRail already has a "Chat" tab on the Student page.
          Give this rail its own unambiguous name in both roles. */}
      <TabList aria-label={faculty ? 'Studio engagement' : 'Shared classroom engagement'} className="shrink-0">
        <Tab value="chat" count={lines.length}>{faculty ? 'Studio chat' : 'Shared chat'}</Tab>
        <Tab value="questions" count={questionList.length}>Q&amp;A</Tab>
        <Tab value="participants" count={snapshot.participants.length}>Participants</Tab>
        <Tab value="polls" count={snapshot.polls.length}>Polls</Tab>
        <Tab value="resources" count={snapshot.resources.length}>Resources</Tab>
      </TabList>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <TabPanel value="chat" className="flex flex-col gap-3">
          <div role="log" aria-label={faculty ? 'Studio session chat' : 'Shared classroom chat'} className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {lines.length === 0 ? <PanelEmpty title="No messages yet" description="Send the first recorded mock message below." /> : lines.map((line) => (
              <article key={line.id} className={cn('rounded-sm border border-line bg-surface-raised p-2.5', line.hidden && 'border-dashed')}>
                <header className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-[560] text-heading">{line.author}</span>
                  <ProvenanceBadge provenance={line.source === 'seeded' ? 'seeded_demo' : 'recorded_event'} labels={provenanceLabels} />
                  {line.pinned ? <Badge tone="ember" variant="soft">Pinned</Badge> : null}
                  {line.hidden ? <Badge tone="danger" variant="soft">Hidden</Badge> : null}
                </header>
                <p className="mt-1.5 text-xs leading-relaxed text-body">{line.body}</p>
                {faculty ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" icon={<Bookmark />} onClick={() => send('chat_pinned', { id: line.id })}>{line.pinned ? 'Unpin' : 'Pin'}</Button>
                    <Button variant="ghost" size="sm" icon={<EyeOff />} onClick={() => send('chat_hidden', { id: line.id })}>{line.hidden ? 'Show' : 'Hide'}</Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <form className="flex flex-col gap-2" onSubmit={(event) => {
            event.preventDefault()
            const body = chatBody.trim()
            if (!body) return
            send('chat_sent', { body })
            setChatBody('')
          }}>
            <Input label={faculty ? 'Faculty message' : 'Shared classroom message'} value={chatBody} onChange={(event) => setChatBody(event.target.value)} maxLength={500} placeholder="Write a message" />
            <Button type="submit" variant="secondary" size="sm" icon={<Send />} disabled={!chatBody.trim()}>Send message</Button>
          </form>
        </TabPanel>

        <TabPanel value="questions" className="flex flex-col gap-3">
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {questionList.length === 0 ? <PanelEmpty title={faculty ? 'No questions' : 'No approved questions yet'} description={faculty ? 'Submitted questions appear here for the Faculty.' : 'Faculty-approved questions appear here after moderation.'} /> : questionList.map((question) => (
              <article key={question.id} className="rounded-sm border border-line bg-surface-raised p-2.5">
                <header className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-[560] text-heading">{question.author}</span>
                  <ProvenanceBadge provenance={question.source === 'seeded' ? 'seeded_demo' : 'recorded_event'} labels={provenanceLabels} />
                  <Badge tone={question.status === 'approved' ? 'answer' : 'review'} variant="soft">{question.status === 'approved' ? 'Faculty approved' : 'Awaiting approval'}</Badge>
                </header>
                <p className="mt-1.5 text-xs leading-relaxed text-body">{question.body}</p>
                <p className="mt-1.5 font-mono text-2xs tabular-nums text-muted">
                  {question.seedUpvotes} seeded upvotes · {question.voterIds.length} recorded votes
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" icon={<ArrowUp />} onClick={() => send('question_upvoted', { id: question.id })}>Upvote</Button>
                  {faculty && question.status === 'pending' ? (
                    <Button variant="ghost" size="sm" icon={<Check />} onClick={() => send('question_approved', { id: question.id })}>Approve</Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <form className="flex flex-col gap-2" onSubmit={(event) => {
            event.preventDefault()
            const body = questionBody.trim()
            if (!body) return
            send('question_added', { body })
            setQuestionBody('')
          }}>
            <Input label="Your question" value={questionBody} onChange={(event) => setQuestionBody(event.target.value)} maxLength={500} placeholder="Ask about this session" />
            <Button type="submit" variant="secondary" size="sm" icon={<Plus />} disabled={!questionBody.trim()}>Submit question</Button>
            {!faculty ? (
              <p className="text-2xs leading-relaxed text-muted">Your submission is a recorded mock event and appears here once Faculty approves it.</p>
            ) : null}
          </form>
        </TabPanel>

        <TabPanel value="participants" className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {faculty ? (
              <Button variant="ghost" size="sm" icon={<Plus />} onClick={() => send('participant_joined', { participantId: `sim-${snapshot.events.length + 1}`, name: 'Simulated Seat' }, simulated('Simulated Seat'))}>Add simulated participant</Button>
            ) : (
              /* R18: ONE participation-control group lives in the labelled
                 "Your participation" region of StudentClassroom. Duplicating
                 the same buttons here broke getByRole selectors and confused
                 assistive technology. */
              <p className="text-2xs leading-relaxed text-muted">Join, leave and hand controls are in the "Your participation" panel beside the stage.</p>
            )}
          </div>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {snapshot.participants.length === 0 ? <PanelEmpty title="No participants" description="Seeded demo rows and mock joins appear here." /> : snapshot.participants.map((person) => (
              <article key={person.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface-raised p-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-line-strong font-mono text-2xs text-heading">{person.initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-[560] text-heading">{person.name}</p>
                  <p className="text-2xs text-muted">{person.state}{person.handRaised ? ' · hand raised' : ''}{person.muted ? ' · muted' : ''}</p>
                </div>
                <ProvenanceBadge provenance={person.source === 'seeded' ? 'seeded_demo' : 'recorded_event'} labels={provenanceLabels} />
                {faculty ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" icon={person.muted ? <VolumeX /> : <Volume2 />} onClick={() => send('participant_muted', { participantId: person.id, muted: !person.muted }, simulated(person.name))}>{person.muted ? 'Unmute' : 'Mute'}</Button>
                    <Button variant="ghost" size="sm" icon={<Hand />} onClick={() => send(person.handRaised ? 'hand_lowered' : 'hand_raised', { participantId: person.id }, simulated(person.name))}>{person.handRaised ? 'Lower' : 'Raise'}</Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </TabPanel>

        <TabPanel value="polls" className="flex flex-col gap-3">
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {snapshot.polls.length === 0 ? <PanelEmpty title="No polls yet" description="Create a poll with the form below. Responses come only from recorded votes." /> : snapshot.polls.map((poll) => {
              const voted = poll.voterIds.includes(faculty ? 'Faculty' : 'You')
              const total = poll.options.reduce((sum, option) => sum + option.votes, 0)
              return (
                <article key={poll.id} className="rounded-sm border border-line bg-surface-raised p-2.5">
                  <header className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-[560] text-heading">{poll.question}</p>
                    <Badge tone={poll.status === 'open' ? 'answer' : 'neutral'} variant="soft">{poll.status === 'open' ? 'Open' : 'Closed'}</Badge>
                  </header>
                  <p className="mt-1 font-mono text-2xs tabular-nums text-muted">{total} recorded vote{total === 1 ? '' : 's'} · no participation percentage claimed</p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {poll.options.map((option) => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        size="sm"
                        disabled={poll.status !== 'open' || voted}
                        className="justify-between"
                        onClick={() => send('poll_voted', { pollId: poll.id, optionId: option.id })}
                      >
                        <span>{option.label}</span>
                        <span className="font-mono tabular-nums">{option.votes}</span>
                      </Button>
                    ))}
                  </div>
                  {voted ? <p className="mt-1.5 text-2xs text-muted">Your recorded response is saved for this prototype session.</p> : null}
                  {faculty && poll.status === 'open' ? <Button variant="ghost" size="sm" className="mt-2" onClick={() => send('poll_closed', { pollId: poll.id })}>Close poll</Button> : null}
                </article>
              )
            })}
          </div>
          {faculty ? (
            <form className="flex flex-col gap-2 border-t border-line pt-3" onSubmit={(event) => {
              event.preventDefault()
              const question = pollQuestion.trim()
              const options = pollOptions.split(',').map((value) => value.trim()).filter(Boolean)
              if (!question || options.length < 2) return
              send('poll_created', { question, options })
              setPollQuestion(''); setPollOptions('Yes, No, Not sure')
            }}>
              <Input label="Poll question" value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} maxLength={200} />
              <Input label="Options (comma separated)" value={pollOptions} onChange={(event) => setPollOptions(event.target.value)} maxLength={400} hint="At least two options; results start at zero." />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="secondary" size="sm" icon={<Plus />} disabled={!pollQuestion.trim()}>Create poll</Button>
                {(metadata?.pollTemplates ?? []).slice(0, 2).map((template) => (
                  <Button key={template.question} variant="ghost" size="sm" onClick={() => send('poll_created', { question: template.question, options: template.options })}>Use demo template: {template.question.slice(0, 24)}…</Button>
                ))}
              </div>
            </form>
          ) : null}
        </TabPanel>

        <TabPanel value="resources" className="flex flex-col gap-3">
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {snapshot.resources.length === 0 ? <PanelEmpty title="No resources" description="Seeded resources and Faculty additions appear here." /> : snapshot.resources.map((resource) => (
              <article key={resource.id} className="rounded-sm border border-line bg-surface-raised p-2.5">
                <header className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-[560] text-heading">{resource.title}</p>
                  <Badge tone="info" variant="soft">{resource.kind}</Badge>
                  <ProvenanceBadge provenance={resource.source === 'seeded' ? 'seeded_demo' : 'recorded_event'} labels={provenanceLabels} />
                </header>
                <p className="mt-1.5 text-2xs leading-relaxed text-muted">{resource.detail}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => send('resource_opened', { id: resource.id })}>Open resource (mock)</Button>
                  <span className="font-mono text-2xs tabular-nums text-muted">{resource.opens} recorded opens</span>
                </div>
              </article>
            ))}
          </div>
          {faculty ? (
            <form className="flex flex-col gap-2 border-t border-line pt-3" onSubmit={(event) => {
              event.preventDefault()
              const title = resourceTitle.trim()
              if (!title) return
              send('resource_added', { title, kind: 'Link', detail: resourceDetail.trim() || 'Faculty-added prototype resource.' })
              setResourceTitle(''); setResourceDetail('')
            }}>
              <Input label="Resource title" value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} maxLength={120} />
              <Input label="Short description" value={resourceDetail} onChange={(event) => setResourceDetail(event.target.value)} maxLength={240} />
              <Button type="submit" variant="secondary" size="sm" icon={<Plus />} disabled={!resourceTitle.trim()}>Add resource</Button>
            </form>
          ) : null}
        </TabPanel>
      </div>
    </Tabs>
  )
}
