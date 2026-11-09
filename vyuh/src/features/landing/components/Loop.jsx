import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const STEPS = ['Learn', 'Practise', 'Diagnose', 'Remediate']
const R = 126
const CX = 200
const CY = 200
const CIRC = 2 * Math.PI * R
const NODE_ANGLES = [-90, 0, 90, 180] // top, right, bottom, left

/**
 * The loop, drawn as a dial you scrub. Ink section, id="loop", nav 03. The
 * connecting path draws itself (stroke-dashoffset), the four nodes rotate a
 * three-quarter turn, the active node fills vermilion, and its name takes the
 * centre. Node labels counter-rotate so they stay upright at any angle.
 */
export function Loop({ reduced }) {
  const rootRef = useRef(null)
  const pathRef = useRef(null)
  const ringRef = useRef(null)
  const labelRefs = useRef([])
  const nodeRefs = useRef([])
  const centreRef = useRef(null)

  const nodes = useMemo(
    () =>
      NODE_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x = CX + R * Math.cos(rad)
        const y = CY + R * Math.sin(rad)
        const anchors = [
          { dx: 0, dy: -28, anchor: 'middle' },
          { dx: 28, dy: 5, anchor: 'start' },
          { dx: 0, dy: 40, anchor: 'middle' },
          { dx: -28, dy: 5, anchor: 'end' },
        ]
        return { x, y, label: STEPS[i], index: i, ...anchors[i] }
      }),
    [],
  )

  useEffect(() => {
    const path = pathRef.current
    const ring = ringRef.current
    const paint = (progress) => {
      const deg = progress * 270
      path.style.strokeDashoffset = String(CIRC * (1 - progress))
      ring.setAttribute('transform', `rotate(${deg} ${CX} ${CY})`)
      labelRefs.current.forEach((el) => {
        if (el) el.style.transform = `rotate(${-deg}deg)`
      })
      const active = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length + 0.0001))
      nodeRefs.current.forEach((el, i) => el?.classList.toggle('loop-node-active', i === active))
      if (centreRef.current && centreRef.current.textContent !== STEPS[active]) {
        centreRef.current.textContent = STEPS[active]
      }
    }
    if (reduced) {
      paint(1)
      return undefined
    }
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top 74%',
        end: 'bottom 64%',
        scrub: 0.7,
        onUpdate: (self) => paint(self.progress),
        onRefresh: (self) => paint(self.progress),
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={rootRef}
      id="loop"
      className="bg-cinema-ink px-5 py-24 text-cinema-paper sm:px-8 sm:py-32"
      aria-label="The loop — learn, practise, diagnose, remediate"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="section-eyebrow text-cinema-paper/50">03 — Loop</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.6vw,3.6rem)] font-[480] leading-[0.98] tracking-tight text-cinema-paper">
            A closed loop,
            <br />
            <em className="font-[430] italic">deliberately.</em>
          </h2>
          <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-cinema-paper/72">
            Nothing is practised once and abandoned. Every sitting feeds the next:
            what was learned is attempted, what was attempted is diagnosed, and
            what was missed is rebuilt — and the loop closes on itself again.
          </p>
          <ol className="mt-10 space-y-3 font-mono text-[0.6875rem] uppercase tracking-widest text-cinema-paper/55">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="text-cinema-paper/35">0{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <figure className="relative mx-auto w-full max-w-[30rem]">
          <svg viewBox="0 0 400 400" role="img" aria-label="Ring of four stages: Learn, Practise, Diagnose, Remediate" className="w-full">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-hairline-on-ink)" strokeWidth="1" strokeDasharray="2 6" />
            <circle
              ref={pathRef}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="rgb(var(--vyuh-cinema-paper-rgb) / 0.85)"
              strokeWidth="1.5"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
            <g ref={ringRef}>
              {nodes.map((node) => (
                <g key={node.label} ref={(el) => { nodeRefs.current[node.index] = el }} className="loop-node">
                  <circle cx={node.x} cy={node.y} r="15" className="loop-node-disc" fill="var(--color-cinema-ink)" stroke="var(--color-hairline-on-ink-strong)" strokeWidth="1" />
                  <circle cx={node.x} cy={node.y} r="4" className="loop-node-dot" fill="rgb(var(--vyuh-cinema-paper-rgb) / 0.4)" />
                  <text
                    ref={(el) => { labelRefs.current[node.index] = el }}
                    x={node.x + node.dx}
                    y={node.y + node.dy}
                    textAnchor={node.anchor}
                    className="loop-label"
                    fill="rgb(var(--vyuh-cinema-paper-rgb) / 0.66)"
                    style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </g>
          </svg>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-cinema-paper/45">Active step</span>
            <span ref={centreRef} className="mt-2 font-display text-3xl font-[480] tracking-tight text-cinema-paper sm:text-4xl">
              Learn
            </span>
          </div>
        </figure>
      </div>

      <style>{`
        .loop-node-active .loop-node-disc { fill: var(--color-ember); stroke: var(--color-ember); }
        .loop-node-active .loop-node-dot { fill: rgb(var(--vyuh-cinema-ink-rgb)); }
      `}</style>
    </section>
  )
}
