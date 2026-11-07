import { Check, EyeOff, Hand, MicOff, Mic, VolumeX } from 'lucide-react'
import { Badge, Button, Card, EmptyState } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatRelative } from '@/shared/lib/format.js'
import { ConfirmAction } from './ConfirmAction.jsx'

/**
 * Participant list with presence. Muting is a reversible control, not a
 * destructive one, so it acts immediately and its label flips to "Unmute"; the
 * row keeps the muted mark so the state is visible after the click.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').HostParticipant[]} props.participants
 * @param {(studentId: string, muted: boolean) => void} props.onToggleMute
 * @param {boolean} [props.busy]
 */
export function ParticipantList({ participants, onToggleMute, busy = false }) {
  return (
    <Card
      eyebrow="Presence"
      title="In the room"
      action={<span className="font-mono text-2xs tabular-nums text-faint">{participants.length} seats</span>}
    >
      <ul className="flex max-h-[26rem] flex-col divide-y divide-line overflow-y-auto" data-testid="host-participants">
        {participants.map((participant) => (
          <li key={participant.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span
              className={cn(
                'inline-flex size-2 shrink-0 rounded-full',
                participant.state === 'present' ? 'bg-answer' : participant.state === 'idle' ? 'bg-review' : participant.state === 'hand_raised' ? 'bg-review' : 'bg-idle',
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-2xs font-[560] text-heading">{participant.name}</span>
                {participant.state === 'hand_raised' ? <Hand className="size-3.5 shrink-0 text-review-fg" strokeWidth={1.75} aria-label="Hand raised" /> : null}
                {participant.muted ? <VolumeX className="size-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-label="Muted" /> : null}
              </span>
              <span className="mt-0.5 block text-2xs text-faint">
                {PRESENCE_LABELS[participant.state]} · attention {participant.attentionScore} · seen {formatRelative(participant.lastSeenAt)}
              </span>
            </span>
            <ConfirmAction
              title={participant.muted ? `Unmute ${participant.name}?` : `Mute ${participant.name}?`}
              description={
                participant.muted
                  ? 'Their microphone reopens for the rest of the session. The room is told the mute was lifted.'
                  : 'Their microphone closes for the rest of the session. They can still type in the chat.'
              }
              detail={`${participant.name} · ${PRESENCE_LABELS[participant.state]}`}
              confirmLabel={participant.muted ? 'Unmute participant' : 'Mute participant'}
              tone={participant.muted ? 'neutral' : 'danger'}
              busy={busy}
              onConfirm={() => onToggleMute(participant.id, !participant.muted)}
            >
              {(open) => (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={participant.muted ? <Mic strokeWidth={1.5} /> : <MicOff strokeWidth={1.5} />}
                  onClick={open}
                  disabled={busy || participant.state === 'left'}
                >
                  {participant.muted ? 'Unmute' : 'Mute'}
                </Button>
              )}
            </ConfirmAction>
          </li>
        ))}
      </ul>
    </Card>
  )
}

const PRESENCE_LABELS = {
  present: 'Present',
  idle: 'Idle',
  hand_raised: 'Hand raised',
  left: 'Left',
}

/**
 * Chat moderation. Hiding a message changes what the room sees, so it asks for
 * confirmation and states exactly what will disappear.
 *
 * @param {Object} props
 * @param {import('@/contracts/learning.js').ChatMessage[]} props.chat
 * @param {string[]} props.hiddenIds
 * @param {(messageId: string) => void} props.onHide
 * @param {boolean} [props.busy]
 */
export function ChatModeration({ chat, hiddenIds, onHide, busy = false }) {
  return (
    <Card eyebrow="Moderation" title="Chat" action={<span className="font-mono text-2xs tabular-nums text-faint">{hiddenIds.length} hidden</span>}>
      {chat.length === 0 ? (
        <EmptyState code="NO CHAT YET" title="The room is quiet" description="Messages appear here as students type. Hiding one removes it from the room instantly." />
      ) : (
        <ul className="flex max-h-[22rem] flex-col divide-y divide-line overflow-y-auto" data-testid="host-chat">
          {chat.map((message) => {
            const hidden = hiddenIds.includes(message.id)
            return (
              <li key={message.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1">
                  <span className="block text-2xs text-body">
                    <span className="font-[560] text-heading">{message.author}</span>
                    <span className="ml-1.5 text-faint">{formatRelative(message.sentAt)}</span>
                  </span>
                  <span className={cn('mt-0.5 block text-2xs leading-relaxed', hidden ? 'text-faint line-through' : 'text-muted')}>{message.body}</span>
                </span>
                {hidden ? (
                  <Badge tone="idle" variant="outline" shape="hollow">Hidden</Badge>
                ) : (
                  <ConfirmAction
                    title="Hide this message from the room?"
                    description={`${message.author}'s message will disappear for every participant. The log keeps it for the session report.`}
                    confirmLabel="Hide message"
                    onConfirm={() => onHide(message.id)}
                    busy={busy}
                  >
                    {(open) => (
                      <Button variant="ghost" size="sm" icon={<EyeOff strokeWidth={1.5} />} onClick={open}>
                        Hide
                      </Button>
                    )}
                  </ConfirmAction>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/**
 * The question queue. Approval is additive — nothing is destroyed — so it is one
 * click, and the approved state is shown inline.
 *
 * @param {Object} props
 * @param {import('@/contracts/learning.js').QueueQuestion[]} props.queue
 * @param {(questionId: string) => void} props.onApprove
 * @param {boolean} [props.busy]
 */
export function QuestionQueue({ queue, onApprove, busy = false }) {
  const pending = queue.filter((question) => question.status === 'pending')
  return (
    <Card eyebrow="Question queue" title="Waiting on you" action={<span className="font-mono text-2xs tabular-nums text-faint">{pending.length} pending</span>}>
      {queue.length === 0 ? (
        <EmptyState code="QUEUE EMPTY" title="No questions yet" description="Students submit questions here; approving one puts it on screen for the room." />
      ) : (
        <ol className="flex max-h-[22rem] flex-col divide-y divide-line overflow-y-auto" data-testid="host-queue">
          {queue.map((question) => (
            <li key={question.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
              <span className="min-w-0 flex-1">
                <span className="block text-2xs leading-relaxed text-body">{question.body}</span>
                <span className="mt-0.5 block text-2xs text-faint">
                  {question.author} · {question.upvotes} upvotes · {formatRelative(question.createdAt)}
                </span>
              </span>
              {question.status === 'approved' ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-[560] text-answer-fg">
                  <Check className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                  On screen
                </span>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => onApprove(question.id)} disabled={busy}>
                  Approve
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
