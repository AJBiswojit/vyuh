import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PILLARS = [
  {
    index: '01',
    title: 'Real-pattern practice',
    body: 'Sit inside the exam’s exact pressure, pattern and pacing — never a dressed-up quiz.',
  },
  {
    index: '02',
    title: 'Every answer explained',
    body: 'Each response opens into a full reasoning trail — the why, the trap, the general rule.',
  },
  {
    index: '03',
    title: 'Attendance without roll call',
    body: 'Presence read from practice itself — who is engaged and who is drifting, no register required.',
  },
  {
    index: '04',
    title: 'Replay what you missed',
    body: 'Every session can be entered again — pause, question, re-attempt, until the pattern holds.',
  },
]

/**
 * Four disciplines, pinned and released horizontally on desktop (~100vh of
 * vertical scroll per panel, scrubbed), stacked vertically below 768px or when
 * reduced motion is requested. Each panel is a tracked target for a wireframe
 * object drawn by the shared canvas — cube, sphere, torus knot (vermilion),
 * ring — so the object rotation stays honest to scroll progress.
 */
export function Pillars({ motion, reduced, isMobile }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const stacked = reduced || isMobile

  useEffect(() => {
    if (stacked) return undefined
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const track = trackRef.current
    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 0.9,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => { motion.current.pillars = self.progress * (PILLARS.length - 1) },
        },
      })
    }, section)
    return () => ctx.revert()
  }, [stacked, motion])

  return (
    <section
      ref={sectionRef}
      id="method"
      data-lattice-gate="method"
      className="relative overflow-hidden bg-cinema-ink text-cinema-paper"
      aria-label="The method in four disciplines"
    >
      <div className={stacked ? 'px-0 pt-14' : 'flex h-[100svh] flex-col pt-20'}>
        <div className="flex items-end justify-between gap-6 px-5 sm:px-8">
          <div>
            <p className="section-eyebrow text-cinema-paper/50">02 — Method</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.6vw,3.6rem)] font-[480] leading-[0.98] tracking-tight text-cinema-paper">
              Four disciplines,
              <br />
              one formation.
            </h2>
          </div>
          <p className="hidden max-w-[30ch] pb-1 text-right font-mono text-[0.6875rem] leading-relaxed text-cinema-paper/45 md:block">
            CUBE · SPHERE · TORUS KNOT · RING — objects turn with the scroll
          </p>
        </div>

        <div
          ref={trackRef}
          className={stacked ? 'mt-10 flex flex-col' : 'pillar-track mt-2 flex h-full w-max'}
        >
          {PILLARS.map((pillar) => (
            <article
              key={pillar.index}
              data-pillar-panel
              className={`relative flex shrink-0 flex-col justify-between border-t border-hairline-on-ink px-5 pb-14 pt-8 sm:px-8 ${
                stacked ? 'min-h-[78svh] border-l-0' : 'h-full w-screen border-l first:border-l-0'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[0.625rem] uppercase tracking-widest text-cinema-paper/50">
                  P.{pillar.index} <span className="opacity-50">/ 04</span>
                </p>
                <p
                  aria-hidden="true"
                  className="font-display text-[clamp(4.5rem,10vw,8rem)] font-[380] leading-none text-cinema-paper/[0.07]"
                >
                  {pillar.index}
                </p>
              </div>
              <div className="relative z-[1] max-w-[38ch]">
                <h3 className="font-display text-[clamp(1.9rem,3.6vw,3.1rem)] font-[480] leading-[1.02] tracking-tight text-cinema-paper">
                  {pillar.title}
                </h3>
                <p className="mt-5 text-base leading-relaxed text-cinema-paper/72">
                  {pillar.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
