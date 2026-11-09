import { ArrowUpRight, BellRing, ClipboardCheck, Info, Radio, RotateCcw, Settings2, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Dialog } from '@/shared/ui'
import { ConfirmAction } from '@/features/faculty/components/ConfirmAction.jsx'
import { ChatModeration, QuestionQueue } from '@/features/faculty/components/HostPanels.jsx'
import { SessionSetup } from './SessionSetup.jsx'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import { cn } from '@/shared/lib/cn.js'

/**
 * Level 3 — "More options". Advanced class tools and records, kept one clearly
 * labelled click away so an everyday teacher is never shown a broadcasting
 * control panel. Nothing here is removed; it is simply out of the way until
 * it is needed.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import('@/contracts/faculty.js').HostConsole} props.host   Attendance-linked host console.
 * @param {() => void} props.onTriggerAttention
 * @param {boolean} props.attentionPending
 * @param {(messageId: string) => void} props.onHideChat
 * @param {boolean} props.hidePending
 * @param {(questionId: string) => void} props.onApproveQuestion
 * @param {boolean} props.approvePending
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot|null} props.snapshot  Null when the demo classroom is unavailable.
 * @param {any} props.view
 * @param {(type:string,payload?:Object)=>void} [props.send]
 * @param {() => void} [props.onResetStudio]
 */
export function AdvancedOptionsDialog({
  open, onClose,
  host, onTriggerAttention, attentionPending,
  onHideChat, hidePending, onApproveQuestion, approvePending,
  snapshot, view, send, onResetStudio,
}) {
  const session = host.session
  const check = host.attentionCheck
  const live = host.live
  const studioStatus = snapshot?.status ?? null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="More options"
      description="Advanced class tools and records. During an ordinary class you will not need to open this."
    >
      <div className="flex max-h-[68vh] flex-col gap-5 overflow-y-auto">

        <Section icon={<ClipboardCheck strokeWidth={1.5} aria-hidden="true" />} title="Attendance" hint="Who was in the room, and one-tap attention checks. Final when the class ends.">
          <dl className="grid grid-cols-4 gap-2">
            <MeterCell label="Present" value={host.counts.present} tone="answer" />
            <MeterCell label="Idle" value={host.counts.idle} />
            <MeterCell label="Left" value={host.counts.left} />
            <MeterCell label="Muted" value={host.counts.muted} />
          </dl>
          <p className="text-2xs text-muted">Attendance threshold {session.attendanceThresholdPercent}% · recorded against the session register.</p>
          <Link to="/faculty/attendance" className="inline-flex min-h-9 items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press">
            Open the attendance register
            <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <div className="mt-1 border-t border-line pt-3">
            {check ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-[560] text-heading">Attention check running</p>
                <p className="font-mono text-2xs tabular-nums text-muted">{check.responded} of {check.issued} answered · closes {formatRelative(check.expiresAt)}</p>
                <p className="text-2xs leading-relaxed text-muted">A missed check is logged against the student&apos;s attention average, not their attendance.</p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" icon={<BellRing />} loading={attentionPending} disabled={!live} onClick={onTriggerAttention}>
                  Send attention check
                </Button>
                {!live ? <span className="text-2xs text-faint">Available while the class is live.</span> : null}
              </div>
            )}
          </div>
        </Section>

        <Section icon={<EyeOff strokeWidth={1.5} aria-hidden="true" />} title="Moderation" hint="Hide messages and clear the report queue. Students keep working; the log keeps the record.">
          <ChatModeration chat={host.chat} hiddenIds={host.hiddenChatIds} busy={hidePending} onHide={onHideChat} />
          <QuestionQueue queue={host.queue} busy={approvePending} onApprove={onApproveQuestion} />
          <p className="text-2xs text-muted">To mute a student, use the Students tab and the class roster.</p>
        </Section>

        <Section icon={<Settings2 strokeWidth={1.5} aria-hidden="true" />} title="Class setup" hint="Optional — sensible defaults are already in place.">
          {snapshot && send ? (
            <SessionSetup setup={snapshot.setup} status={studioStatus ?? 'scheduled'} send={send} />
          ) : (
            <p className="text-2xs text-muted">The demo classroom is not available for this session, so there is no setup to edit. The class still runs with the timetable defaults.</p>
          )}
        </Section>

        <Section icon={<Radio strokeWidth={1.5} aria-hidden="true" />} title="Recording & media" hint="Simulated controls — nothing is captured, stored or transmitted.">
          <p className="text-2xs leading-relaxed text-muted">
            The microphone, camera, screen share and recording chips on the stage only record mock events. When you are ready to reset the demo classroom for a fresh practice run, clear it here — the class report and attendance are not affected.
          </p>
          {onResetStudio ? (
            <ConfirmAction
              title="Reset the demo classroom?"
              description="Every recorded demo event — messages, questions, polls, whiteboard strokes and the live flag — is cleared and the seeded classroom is restored."
              detail="The attendance-linked class report keeps its own record; only the shared demo state is reset."
              confirmLabel="Reset demo classroom"
              cancelLabel="Keep it as is"
              tone="danger"
              onConfirm={onResetStudio}
            >
              {(openConfirm) => (
                <Button variant="danger" size="sm" icon={<RotateCcw />} onClick={openConfirm}>
                  Reset demo classroom
                </Button>
              )}
            </ConfirmAction>
          ) : null}
        </Section>

        <Section icon={<Info strokeWidth={1.5} aria-hidden="true" />} title="About this class" hint="Where things stand — plainly, with no jargon.">
          <dl className="grid grid-cols-2 gap-3">
            <Fact label="Scheduled" value={formatDateTime(session.startsAt)} />
            <Fact label="Started" value={host.startedAt ? formatDateTime(host.startedAt) : 'Not yet'} />
            <Fact label="Ended" value={host.endedAt ? formatDateTime(host.endedAt) : '—'} />
            <Fact label="Mode" value={session.mode === 'interactive' ? 'Interactive — students can speak' : 'Broadcast — students watch and chat'} />
            <Fact label="Resources" value={session.resourcesAttached ? 'Attached' : 'None'} />
            <Fact label="Students on roster" value={String(host.participants.length)} />
          </dl>
          {view && view.roomLog.length > 0 ? (
            <div className="border-t border-line pt-3">
              <p className="rule-label">Demo classroom log</p>
              <ul className="mt-1.5 flex max-h-40 flex-col gap-1.5 overflow-y-auto" aria-label="Demo classroom log">
                {view.roomLog.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex gap-2 text-2xs leading-relaxed">
                    <span className="shrink-0 font-mono tabular-nums text-faint">{formatRelative(entry.at)}</span>
                    <span className="text-body">{entry.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {host.feed.length > 0 ? (
            <div className="border-t border-line pt-3">
              <p className="rule-label">Class report log</p>
              <ul className="mt-1.5 flex max-h-40 flex-col gap-1.5 overflow-y-auto" aria-label="Class report log">
                {host.feed.slice(0, 8).map((event) => (
                  <li key={event.id} className="flex gap-2 text-2xs leading-relaxed">
                    <span className="shrink-0 font-mono tabular-nums text-faint">{formatRelative(event.at)}</span>
                    <span className="text-body">{event.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      </div>
    </Dialog>
  )
}

/** @param {{ icon: React.ReactNode, title: string, hint: string, children: React.ReactNode }} props */
function Section({ icon, title, hint, children }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <div className="flex items-start gap-2 border-b border-line pb-2">
        <span className="mt-0.5 text-heading">{icon}</span>
        <div className="min-w-0">
          <h3 className="text-xs font-[560] tracking-tight text-heading">{title}</h3>
          <p className="mt-0.5 text-2xs leading-relaxed text-muted">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/** @param {{ label: string, value: number, tone?: 'answer' }} props */
function MeterCell({ label, value, tone }) {
  return (
    <div className="rounded-sm border border-line bg-surface p-2">
      <dt className="rule-label">{label}</dt>
      <dd className={cn('mt-1 font-mono text-base tabular-nums leading-none', tone === 'answer' ? 'text-answer-fg' : 'text-heading')}>{value}</dd>
    </div>
  )
}

/** @param {{ label: string, value: string }} props */
function Fact({ label, value }) {
  return (
    <div>
      <dt className="rule-label">{label}</dt>
      <dd className="mt-1 text-2xs leading-snug text-heading">{value}</dd>
    </div>
  )
}

