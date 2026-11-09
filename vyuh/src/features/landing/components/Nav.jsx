import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle.jsx'

const INDEX = [
  ['01', 'Idea', '#idea', 'idea'],
  ['02', 'Method', '#method', 'method'],
  ['03', 'Loop', '#loop', 'loop'],
  ['04', 'Principles', '#principles', 'principles'],
]

/**
 * Fixed navbar. Transparent over the hero film; after ~48px of scroll it
 * settles onto the theme surface with a hairline rule and a blur. Left: the
 * MediXO logo lockup. Centre/right: the numbered section index (ember when its
 * section is active — tracked by IntersectionObserver, announced with
 * aria-current). Far right, in order: theme toggle, Sign in, Start.
 * Below 768px the index collapses into a menu; theme toggle and Sign in stay.
 * Links here and in the footer are the only CTAs on the page.
 */
export function Nav({ onJump }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(/** @type {string | null} */ ('idea'))
  const menuRef = useRef(null)
  const toggleButtonRef = useRef(null)

  // Transparent → settled bar. Plain window scroll works under Lenis.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section: whichever labelled section crosses the reading line.
  // When the reader is between sections (stats, coda), no chip is lit.
  useEffect(() => {
    const sections = INDEX.map(([, , , id]) => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return undefined
    const visible = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.target.id) continue
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const current = INDEX.find(([, , , id]) => visible.has(id))
        setActive(current ? current[3] : null)
      },
      // A section owns the reading line while it crosses the middle band.
      { rootMargin: '-42% 0px -52% 0px', threshold: 0 },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  // Escape closes the menu and hands focus back to the button.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Leaving the mobile breakpoint closes the menu.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const onChange = (event) => { if (event.matches) setOpen(false) }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const handleJump = (event) => {
    const href = event.currentTarget.getAttribute('href')
    if (href?.startsWith('#')) {
      event.preventDefault()
      setOpen(false)
      onJump(href)
    }
  }

  return (
    <header data-scrolled={scrolled} className="vyuh-nav fixed inset-x-0 top-0 z-[9]">
      <nav aria-label="Vyuh" className="mx-auto flex max-w-[110rem] items-center justify-between gap-3 px-4 py-2.5 sm:gap-6 sm:px-8 sm:py-3.5">
        {/* Logo lockup — official artwork, unmodified. */}
        <a href="#top" onClick={handleJump} aria-label="Vyuh by MediXO — back to the top" className="group flex shrink-0 items-center gap-2.5 no-underline sm:gap-3">
          <img src="/logo/Vyuh_medixo.svg" alt="" width="40" height="40" className="logo-img h-8 w-8 sm:h-9 sm:w-9" />
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] font-[520] tracking-tight text-[var(--lg-text)] transition-opacity group-hover:opacity-80" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>Vyuh</span>
            <span className="mt-1 block font-mono text-[0.5rem] uppercase leading-none tracking-[0.28em] text-[var(--lg-text-55)]">by MediXO</span>
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {/* Numbered index — desktop/tablet only */}
          <ol className="vyuh-nav-index hidden items-center gap-4 font-mono text-[0.625rem] uppercase tracking-[0.18em] md:flex lg:gap-6">
            {INDEX.map(([num, label, href, id]) => (
              <li key={num}>
                <a href={href} onClick={handleJump} aria-current={active === id ? 'true' : undefined} className="inline-flex items-center gap-2 no-underline">
                  <span className="nav-index-num">{num}</span>
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ol>

          <ThemeToggle />

          <Link to="/login" className="vyuh-nav-link inline-flex font-mono text-[0.625rem] sm:text-[0.6875rem] uppercase tracking-[0.18em] no-underline">
            Sign in
          </Link>
          <Link to="/login" className="vyuh-start-link hidden no-underline md:inline-flex">
            Start
            <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />
          </Link>

          {/* Menu — below md */}
          <button
            ref={toggleButtonRef}
            type="button"
            className="vyuh-nav-link inline-flex h-10 w-10 items-center justify-center md:hidden"
            aria-expanded={open}
            aria-controls="vyuh-mobile-menu"
            aria-label={open ? 'Close section menu' : 'Open section menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.75} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Collapsed index + Start for small screens */}
      {open ? (
        <div ref={menuRef} id="vyuh-mobile-menu" className="vyuh-menu md:hidden">
          <ol className="mx-auto max-w-[110rem] px-4 py-3 sm:px-8">
            {INDEX.map(([num, label, href, id]) => (
              <li key={num} className="border-b border-[var(--lg-hairline)] last:border-b-0">
                <a href={href} onClick={handleJump} aria-current={active === id ? 'true' : undefined} className="flex items-center gap-4 py-3.5 no-underline">
                  <span className="nav-index-num">{num}</span>
                  <span className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-[var(--lg-text-72)]">{label}</span>
                </a>
              </li>
            ))}
            <li>
              <Link to="/login" onClick={() => setOpen(false)} className="flex items-center justify-between py-4 font-mono text-[0.75rem] uppercase tracking-[0.2em] text-[var(--lg-text)] no-underline">
                Start
                <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
            </li>
          </ol>
        </div>
      ) : null}
    </header>
  )
}
