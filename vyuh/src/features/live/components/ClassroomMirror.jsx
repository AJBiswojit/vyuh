import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Hand, MessageSquare, MinusCircle, Plus, Users } from 'lucide-react'
import { Badge, Button, EmptyState, Select } from '@/shared/ui'
import { ProvenanceBadge } from './ProvenanceBadge.jsx'

/**
 * Faculty Classroom Mirror. A DISTINCT collapsible light pane inside the dark
 * Studio. It reads the same shared state as the real Student Classroom but is
 * explicitly a simulation: the permanent label is rendered even when collapsed,
 * and every simulated action is tagged with a labelled seeded participant.
 * It never claims a Student account is signed in.
 * @param {Object} props
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot} props.snapshot
 * @param {any} props.view
 * @param {any} props.metadata
 * @param {(type:string,payload?:Object,options?:Object)=>void} props.send
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 */
export function ClassroomMirror({ snapshot, view, metadata, send, open, onToggle }) {
  const seeded = snapshot.participants.filter((person) => person.source === 'seeded')
  const [selected, setSelected] = useState(seeded[0]?.id ?? '')
  const person = seeded.find((item) => item.id === selected) ?? seeded[0] ?? null
  const openPoll = snapshot.polls.find((poll) => poll.status === 'open') ?? null
  const labels = view.provenanceLabels ?? {}

  /** @param {string} detail */
  const simulated = (detail) => ({ simulateAs: person ? `${person.name} (simulated participant)` : 'Simulated participant', detail: `${detail} (labelled seeded-participant simulation).` })

  return (
    <section data-theme="light" data-testid="classroom-mirror" className="flex flex-col gap-3 rounded-sm border border-line bg-surface p-3 text-body">
      <header className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="rule-label">Classroom Mirror</p>
          {/* Permanent simulation label: always visible, collapsed or expanded. */}
          <p className="mt-1 flex items-start gap-1.5 text-2xs font-[560] leading-relaxed text-heading">
            <Users className="mt-px size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {metadata?.mirrorNotice ?? 'Simulated student view — no Student account is signed in'}
          </p>
        </div>
        <Badge tone="review" variant="soft">Simulation</Badge>
        <Button variant="ghost" size="sm" icon={open ? <MinusCircle /> : <ChevronDown />} onClick={onToggle} aria-expanded={open}>
          {open ? 'Collapse mirror' : 'Expand mirror'}
        </Button>
      </header>

      {!open ? (
        <p className="text-2xs leading-relaxed text-muted">Collapsed. Shared scene: {view.activeSceneLabel}. The simulation label above remains visible.</p>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3 border-t border-line pt-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-sm border border-line bg-surface-raised p-2.5">
              <p className="rule-label">Scene</p>
              <p className="mt-1 text-xs font-[560] text-heading">{view.activeSceneLabel}</p>
              <p className="mt-1 text-2xs text-muted">Synced from the shared classroom state.</p>
            </div>
            <div className="rounded-sm border border-line bg-surface-raised p-2.5">
              <p className="rule-label">Chat</p>
              <p className="mt-1 font-mono text-xs tabular-nums text-heading">{view.visibleChat.length} visible lines</p>
              <p className="mt-1 truncate text-2xs text-muted">{view.visibleChat.at(-1)?.body ?? 'No messages yet'}</p>
            </div>
            <div className="rounded-sm border border-line bg-surface-raised p-2.5">
              <p className="rule-label">Questions</p>
              <p className="mt-1 font-mono text-xs tabular-nums text-heading">{snapshot.questions.length} in queue</p>
              <p className="mt-1 text-2xs text-muted">{view.pendingQuestions?.length ?? 0} awaiting Faculty approval</p>
            </div>
            <div className="rounded-sm border border-line bg-surface-raised p-2.5">
              <p className="rule-label">Polls · resources · roster</p>
              <p className="mt-1 truncate text-2xs text-heading">
                {snapshot.polls.length} polls · {snapshot.resources.length} resources · {snapshot.participants.length} roster rows
              </p>
              <ProvenanceBadge provenance="seeded_demo" labels={labels} className="mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-sm border border-line-strong bg-surface-sunken p-3">
            <p className="text-xs font-[560] text-heading">Seeded-participant simulation</p>
            <p className="text-2xs leading-relaxed text-muted">Actions below are labelled simulations in the shared state — not a real Student login, not verified engagement.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                label="Simulated seeded participant"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                options={seeded.map((item) => ({ value: item.id, label: `${item.name} (seeded demo)` }))}
              />
              <div className="flex flex-wrap content-start gap-2">
                <Button variant="secondary" size="sm" icon={<Plus />} disabled={!person} onClick={() => send('participant_joined', { participantId: `sim-${person.id}`, name: person.name }, simulated(`${person.name} joined`))}>Simulate join</Button>
                <Button variant="ghost" size="sm" icon={<MessageSquare />} disabled={!person} onClick={() => send('chat_sent', { body: 'Could you repeat the torque equation?' }, simulated(`${person.name} posted a message`))}>Simulate chat</Button>
                <Button variant="ghost" size="sm" icon={<Hand />} disabled={!person} onClick={() => send('hand_raised', { participantId: `sim-${person.id}` }, simulated(`${person.name} raised a hand`))}>Simulate hand</Button>
                <Button variant="ghost" size="sm" disabled={!person} onClick={() => send('question_added', { body: 'Could we see one more worked example?' }, simulated(`${person.name} asked a question`))}>Simulate question</Button>
                <Button variant="ghost" size="sm" disabled={!person || !openPoll} onClick={() => send('poll_voted', { pollId: openPoll.id, optionId: openPoll.options[0].id }, simulated(`${person.name} answered a poll`))}>Simulate poll vote</Button>
              </div>
            </div>
          </div>

          {view.visibleChat.length === 0 ? (
            <EmptyState size="inline" title="No shared messages" description="Faculty and simulated participant messages appear here." />
          ) : (
            <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto" aria-label="Shared chat in the mirror">
              {view.visibleChat.slice(-6).map((line) => (
                <li key={line.id} className="rounded-sm border border-line bg-surface-raised px-2 py-1.5 text-2xs leading-relaxed">
                  <span className="font-[560] text-heading">{line.author}: </span>
                  <span className="text-body">{line.body}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </section>
  )
}
