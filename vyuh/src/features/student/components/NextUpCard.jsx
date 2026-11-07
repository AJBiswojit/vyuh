import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Checkbox } from '@/shared/ui/Checkbox.jsx'
import { formatDateTime } from '@/shared/lib/format.js'
import { PatternChips } from './PatternChips.jsx'
import { ExamCountdown } from './ExamCountdown.jsx'

/**
 * Next up: pattern chips, isolated countdown, pre-exam checklist and the hall
 * button. The button unlocks at the scheduled start time and opens exam detail,
 * the first step of the Phase 4 exam flow.
 * @param {{ exam: import('@/contracts/student.js').Exam }} props
 */
export function NextUpCard({ exam }) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(() => Boolean(exam.scheduledFor && new Date(exam.scheduledFor).getTime() <= Date.now()))
  const [checks, setChecks] = useState({ camera: false, network: false, instructions: false })
  const onReady = useCallback(() => setReady(true), [])
  const checked = Object.values(checks).filter(Boolean).length

  return (
    <Card eyebrow="Next up" title={exam.title} wrapTitle action={<Badge tone="info" variant="outline" shape="circle">Scheduled</Badge>}
      footer={<p className="flex items-center gap-1.5 text-2xs text-faint"><CalendarClock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Starts {exam.scheduledFor ? formatDateTime(exam.scheduledFor) : 'on release'} · reporting 15 min before</p>}>
      <div className="flex flex-col gap-5">
        <PatternChips exam={exam} />
        <div className="rounded-sm border border-line bg-surface-sunken px-4 py-3">
          <p className="rule-label mb-2">Countdown to start</p>
          <ExamCountdown target={exam.scheduledFor} onReady={onReady} />
        </div>
        <fieldset className="rounded-sm border border-line px-4 py-3">
          <legend className="px-1 font-mono text-2xs uppercase tracking-widest text-faint">Pre-exam checklist · {checked}/3</legend>
          <div className="flex flex-col gap-3">
            <Checkbox label="Camera checked" description="Frame your face and desk before the hall opens." checked={checks.camera} onChange={(event) => setChecks((value) => ({ ...value, camera: event.target.checked }))} />
            <Checkbox label="Network stable" description="Run the connection check from the hall panel." checked={checks.network} onChange={(event) => setChecks((value) => ({ ...value, network: event.target.checked }))} />
            <Checkbox label="Instructions read" description="Pattern, marking and submit rules are understood." checked={checks.instructions} onChange={(event) => setChecks((value) => ({ ...value, instructions: event.target.checked }))} />
          </div>
        </fieldset>
        <Button variant="primary" size="lg" full disabled={!ready} trailingIcon={<ArrowRight strokeWidth={1.5} />} onClick={() => navigate(`/student/exams/${encodeURIComponent(exam.id)}`)}>
          {ready ? 'Enter exam hall' : 'Enter exam hall at start time'}
        </Button>
      </div>
    </Card>
  )
}
