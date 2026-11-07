import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Send } from 'lucide-react'
import { Badge, Button, Tab, TabList, TabPanel, Tabs } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib/format.js'

/**
 * Chat + question queue. Messages and approvals arrive through the service
 * subscription; this component only renders the folded cache.
 * @param {{ chat: import('@/contracts/learning.js').ChatMessage[], queue: import('@/contracts/learning.js').QueueQuestion[], onSendChat: (body:string)=>void, onAsk: (body:string)=>void, onUpvote: (id:string)=>void, chatBusy?: boolean, askBusy?: boolean, upvotingId?: string|null }} props
 */
export function LiveRail({ chat, queue, onSendChat, onAsk, onUpvote, chatBusy, askBusy, upvotingId }) {
  const [message, setMessage] = useState('')
  const [question, setQuestion] = useState('')
  const logRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  useEffect(() => { const node = logRef.current; if (node) node.scrollTop = node.scrollHeight }, [chat.length])
  const sorted = [...queue].sort((a, b) => (a.status === b.status ? b.upvotes - a.upvotes : a.status === 'approved' ? -1 : 1))
  return (
    <Tabs defaultValue="chat" className="flex min-h-[28rem] flex-col rounded-md border border-line bg-surface-raised">
      <TabList aria-label="Live room rail" className="px-2 pt-1">
        <Tab value="chat" count={chat.length}>Chat</Tab>
        <Tab value="queue" count={queue.length}>Question queue</Tab>
      </TabList>
      <TabPanel value="chat" className="flex min-h-0 flex-1 flex-col p-0">
        <div ref={logRef} role="log" aria-label="Class chat" aria-live="polite" className="scroll-region max-h-96 min-h-64 flex-1 overflow-y-auto p-4" tabIndex={0}>
          <ul className="space-y-3">
          {chat.map((item) => (
            <li key={item.id} className="text-xs">
              <p className="flex items-baseline justify-between gap-2"><span className={item.role === 'faculty' ? 'font-[560] text-heading' : 'font-[560] text-body'}>{item.author}</span><time className="font-mono text-2xs text-faint" dateTime={item.sentAt}>{formatDateTime(item.sentAt)}</time></p>
              <p className="mt-1 leading-relaxed text-body">{item.body}</p>
            </li>
          ))}
          </ul>
        </div>
        <form className="flex items-end gap-2 border-t border-line p-3" onSubmit={(event) => { event.preventDefault(); if (!message.trim()) return; onSendChat(message); setMessage('') }}>
          <label className="sr-only" htmlFor="live-chat-input">Message the class</label>
          <input id="live-chat-input" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Message the class…" className="min-h-11 min-w-0 flex-1 rounded-sm border border-line-strong bg-surface px-3 text-xs text-heading placeholder:text-faint" />
          <Button type="submit" variant="secondary" size="sm" loading={chatBusy} disabled={!message.trim()} icon={<Send strokeWidth={1.5} />}>Send</Button>
        </form>
      </TabPanel>
      <TabPanel value="queue" className="flex min-h-0 flex-1 flex-col p-0">
        <ul aria-label="Question queue" className="scroll-region max-h-96 min-h-64 flex-1 space-y-3 overflow-y-auto p-4" tabIndex={0}>
          {sorted.map((item) => (
            <li key={item.id} className="rounded-sm border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs leading-relaxed text-body">{item.body}</p>
                <Button variant="ghost" size="sm" aria-pressed={item.votedByMe} loading={upvotingId === item.id} onClick={() => onUpvote(item.id)} icon={<ArrowUp strokeWidth={1.5} />} className="shrink-0 font-mono tabular-nums"><span className="sr-only">Upvote question: {item.body}</span>{item.upvotes}</Button>
              </div>
              <p className="mt-2 flex items-center justify-between gap-2 text-2xs text-faint"><span>{item.author}</span><Badge tone={item.status === 'approved' ? 'answer' : 'review'} variant="outline">{item.status === 'approved' ? 'Faculty approved' : 'Waiting for faculty'}</Badge></p>
            </li>
          ))}
        </ul>
        <form className="space-y-2 border-t border-line p-3" onSubmit={(event) => { event.preventDefault(); if (!question.trim()) return; onAsk(question); setQuestion('') }}>
          <label className="sr-only" htmlFor="live-question-input">Ask the faculty</label>
          <textarea id="live-question-input" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} rows={2} placeholder="Ask a question…" className="w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-xs text-heading placeholder:text-faint" />
          <Button type="submit" variant="secondary" size="sm" loading={askBusy} disabled={!question.trim()}>Add to queue</Button>
        </form>
      </TabPanel>
    </Tabs>
  )
}
