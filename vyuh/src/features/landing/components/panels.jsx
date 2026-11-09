/**
 * The four product instruments, rendered live as paper documents — never
 * screenshots. All labels, counts and times are placeholders. Each panel
 * carries exactly one ember highlight (the product's current action); panel
 * chrome is hairlines and mono caps, so the ember reads as signal.
 */

export const PANEL_META = [
  { index: '01', label: 'Exam hall', title: 'Real-pattern practice', body: 'Sit inside the exam’s exact pressure, pattern and pacing — never a dressed-up quiz.' },
  { index: '02', label: 'Attempt ledger', title: 'Every answer explained', body: 'Each response opens into a full reasoning trail — the why, the trap, the general rule.' },
  { index: '03', label: 'Presence roster', title: 'Attendance without roll call', body: 'Presence read from practice itself — who is engaged and who is drifting, no register required.' },
  { index: '04', label: 'Replay queue', title: 'Replay what you missed', body: 'Every session can be entered again — pause, question, re-attempt, until the pattern holds.' },
]

const PANEL_FOOT = ['Vyuh · Exam hall', 'Vyuh · Ledger', 'Vyuh · Roster', 'Vyuh · Replay']
const PLACEHOLDER = 'Placeholder data'

function PanelHead({ kicker, right }) {
  return (
    <div className="panel-head">
      <span>{kicker}</span>
      <span aria-hidden="true">{right}</span>
    </div>
  )
}

function PanelFoot({ i }) {
  return (
    <div className="panel-foot">
      <span>{PANEL_FOOT[i]}</span>
      <span className="panel-tag">{PLACEHOLDER}</span>
    </div>
  )
}

/** Panel 01 — the exam hall. 30 tiles; answered ink, marked paper+ember
 *  outline, current ember fill, everything else dashed hairline (TBD). */
export function ExamHallPanel() {
  const answeredMax = 11
  const current = 12 // advance() moves this with scroll
  const marked = new Set([15, 22])
  const tiles = Array.from({ length: 30 }, (_, i) => {
    const n = i + 1
    if (n === current) return { n, kind: 'current' }
    if (i < answeredMax + 1) return { n, kind: 'answered' }
    if (marked.has(n)) return { n, kind: 'marked' }
    return { n, kind: 'tbd' }
  })
  return (
    <div className="panel-card">
      <PanelHead kicker="Hall 2 · Sitting A" right="NEET-PG Pattern" />
      <div className="panel-body">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-sans text-[0.82rem] font-bold leading-tight text-[var(--color-ink)]">Pattern sitting</p>
            <p className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.55)]">Full length · 200 items · lockout pacing</p>
          </div>
          <div className="text-right">
            <p className="tile-timer" data-tile-timer>00:42:17</p>
            <p className="mt-1 font-mono text-[0.42rem] uppercase tracking-[0.2em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.5)]">Remaining</p>
          </div>
        </div>
        <div className="tile-grid" data-tile-grid>
          {tiles.map(({ n, kind }) => (
            <div key={n} data-tile-index={n} className={`tile tile-${kind}`} aria-hidden="true">
              <span>Q{String(n).padStart(2, '0')}</span>
              {kind === 'answered' ? <small><svg viewBox='0 0 10 10' width='8' height='8' aria-hidden='true'><path d='M1.6 5.4 4 7.8 8.4 2.2' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round'/></svg></small> : kind === 'marked' ? <small>M</small> : null}
            </div>
          ))}
        </div>
        <div className="tile-legend">
          <span><i className="legend-dot" style={{ background: 'var(--color-ink)' }} />Answered</span>
          <span><i className="legend-dot" style={{ background: 'var(--color-paper)', border: '1.5px solid var(--color-ember)' }} />Marked</span>
          <span><i className="legend-dot" style={{ background: 'var(--color-ember)' }} />Current</span>
          <span><i className="legend-dot" style={{ border: '1px dashed rgb(var(--vyuh-cinema-ink-rgb)/0.35)' }} />Pending</span>
        </div>
      </div>
      <PanelFoot i={0} />
    </div>
  )
}

/** Panel 02 — the ledger. Placeholder rows; one ember mistake row;
 *  rows stagger in when the panel enters. */
const LEDGER_ROWS = [
  { q: 'Q04', verdict: 'Correct', time: '01:12', kind: 'ok' },
  { q: 'Q07', verdict: 'Correct', time: '00:58', kind: 'ok' },
  { q: 'Q11', verdict: 'Mistake', time: '02:41', kind: 'mistake' },
  { q: 'Q13', verdict: 'Correct', time: '01:05', kind: 'ok' },
  { q: 'Q15', verdict: 'Skipped', time: '00:19', kind: 'dust' },
  { q: 'Q18', verdict: 'Correct', time: '01:33', kind: 'ok' },
]

export function AnalysisLedgerPanel() {
  return (
    <div className="panel-card">
      <PanelHead kicker="Session 07 · Attempt ledger" right="After submit" />
      <div className="panel-body">
        <div>
          <p className="font-sans text-[0.82rem] font-bold leading-tight text-[var(--color-ink)]">Where the sitting bent</p>
          <p className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.55)]">One row per response · newest first</p>
        </div>
        <div className="ledger-row ledger-head" aria-hidden="true">
          <span>Q</span><span>Verdict</span><span>Time</span>
        </div>
        <div data-ledger>
          {LEDGER_ROWS.map((row) => (
            <div key={row.q} className={`ledger-row${row.kind === 'mistake' ? ' ledger-mistake' : ''}`} data-ledger-row>
              <span className="text-[var(--color-ink)]">{row.q}</span>
              <span className={row.kind === 'ok' ? 'verdict-ok' : row.kind === 'mistake' ? 'verdict' : 'verdict-dust'}>
                {row.verdict}
              </span>
              <span className="tabular-nums text-[rgb(var(--vyuh-cinema-ink-rgb)/0.62)]">{row.time}</span>
            </div>
          ))}
        </div>
        <p className="mt-auto rounded-md border border-[rgb(var(--vyuh-cinema-ink-rgb)/0.16)] px-2 py-1.5 font-mono text-[0.5rem] uppercase leading-relaxed tracking-[0.14em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.6)]">
          Q11 — trap: unit conversion skipped · rule filed to your queue
        </p>
      </div>
      <PanelFoot i={1} />
    </div>
  )
}

/** Panel 03 — presence roster. Initials only; pulsing presence dots; one
 *  muted absent row; mono session label. */
const ROSTER = [
  { id: 'AR', meta: '18 resp · last seen 06:41', focus: true },
  { id: 'MK', meta: '15 resp · last seen 06:38', focus: false },
  { id: 'SN', meta: '13 resp · last seen 06:12', focus: false },
  { id: 'RP', meta: '11 resp · last seen 05:54', focus: false },
  { id: 'TD', meta: '09 resp · last seen 05:20', focus: false },
  { id: 'IV', meta: 'absent · 0 responses', focus: false, absent: true },
]

export function AttendanceRosterPanel() {
  return (
    <div className="panel-card">
      <PanelHead kicker="Session 07 · Cardiology revision" right="06:41 elapsed" />
      <div className="panel-body">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-sans text-[0.82rem] font-bold leading-tight text-[var(--color-ink)]">Attendance, read from practice</p>
            <p className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.55)]">No register · presence inferred from attempts</p>
          </div>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.62)]"><span className="text-[var(--color-ink)]">5</span> / 6 active</p>
        </div>
        <div data-roster>
          {ROSTER.map((row) => (
            <div key={row.id} className={`roster-row${row.absent ? ' roster-absent' : ''}`}>
              <span className="roster-avatar" aria-hidden="true">{row.id}</span>
              <span>
                <span className="roster-name block">{row.id} · Student</span>
                <span className="roster-meta mt-0.5 block">{row.meta}</span>
              </span>
              <span className="presence">
                <span className="presence-dot" aria-hidden="true" />
                {row.absent ? 'Absent' : row.focus ? 'Focus' : 'Live'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-auto font-mono text-[0.5rem] uppercase leading-relaxed tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.5)]">
          Drifting readers surface first — <span className="panel-focus">AR is holding the pattern</span> strongest today.
        </p>
      </div>
      <PanelFoot i={2} />
    </div>
  )
}

/** Panel 04 — replay. Recording card + queued-set card, linked by a line
 *  drawn on scroll (stroke-dashoffset). */
export function ReplayQueuePanel() {
  return (
    <div className="panel-card">
      <PanelHead kicker="Session 07 · Replay" right="Enter again" />
      <div className="panel-body">
        <div>
          <p className="font-sans text-[0.82rem] font-bold leading-tight text-[var(--color-ink)]">Nothing is practised once</p>
          <p className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.55)]">Re-enter the sitting · pause · re-attempt</p>
        </div>
        <div className="replay-card" data-replay-card="a">
          <p className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.55)]">Recording</p>
          <p className="mt-1 font-sans text-[0.78rem] font-bold text-[var(--color-ink)]">Session 07 — full length, replayed</p>
          <div className="replay-progress" aria-hidden="true">
            <span data-replay-fill style={{ width: '62%' }} />
            <span className="replay-playhead" style={{ left: '62%' }} />
          </div>
          <div className="replay-chapter">
            <span data-replay-chapter>CH 04 — Neural conduction</span>
            <span className="tabular-nums">24:16 / 39:40</span>
          </div>
        </div>
        <svg className="replay-link" width="120" height="44" viewBox="0 0 120 44" aria-hidden="true">
          <path
            data-replay-link
            d="M 10 2 C 10 24, 110 20, 110 42"
            fill="none"
            stroke="var(--color-ink)" strokeOpacity="0.75"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="140"
            strokeDashoffset="140"
          />
        </svg>
        <div className="replay-card" data-replay-card="b">
          <p className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.55)]">Queued set</p>
          <p className="mt-1 font-sans text-[0.78rem] font-bold text-[var(--color-ink)]">Mistake patterns first</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink)]">14 questions</span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.62)]">~35 min</span>
          </div>
          <p className="mt-1.5 font-mono text-[0.48rem] uppercase leading-relaxed tracking-[0.18em] text-[rgb(var(--vyuh-cinema-ink-rgb)/0.5)]">Built from your last sitting · updates after every replay</p>
        </div>
      </div>
      <PanelFoot i={3} />
    </div>
  )
}

export const PANEL_COMPONENTS = [ExamHallPanel, AnalysisLedgerPanel, AttendanceRosterPanel, ReplayQueuePanel]
