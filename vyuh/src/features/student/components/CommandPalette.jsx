import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FileText, Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { lockScroll, trapFocus } from '@/shared/lib/focusTrap.js'
import { Kbd } from '@/shared/ui/Kbd.jsx'
import { useExams, useStudentId } from '../hooks/useStudentWorkspace.js'

/**
 * Cmd/Ctrl+K palette. Searches student pages and exams by name. The input is a
 * combobox over a listbox; Arrow keys move the active option and Enter opens it.
 * @param {{ open: boolean, onClose: () => void, pages: Array<{ to: string, label: string, description: string }> }} props
 */
export function CommandPalette({ open, onClose, pages }) {
  const navigate = useNavigate()
  const studentId = useStudentId()
  const { data: exams = [], isPending: examsPending, isError: examsError } = useExams(studentId, { enabled: open })
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const listId = useId()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pageResults = pages
      .filter((page) => !q || `${page.label} ${page.description}`.toLowerCase().includes(q))
      .map((page) => ({ id: `page:${page.to}`, label: page.label, meta: page.description, to: page.to, kind: /** @type {const} */ ('page') }))
    const examResults = exams
      .filter((exam) => !q || exam.title.toLowerCase().includes(q))
      .slice(0, q ? 8 : 3)
      .map((exam) => ({ id: `exam:${exam.id}`, label: exam.title, meta: `${exam.status} · ${exam.questionCount} Q`, to: `/student/exams?exam=${encodeURIComponent(exam.id)}`, kind: /** @type {const} */ ('exam') }))
    return [...pageResults, ...examResults].slice(0, 12)
  }, [pages, exams, query])

  useEffect(() => {
    if (!open) return
    const releaseScroll = lockScroll()
    const releaseFocus = trapFocus(panelRef.current, { onClose, initialFocusRef: inputRef })
    return () => { releaseFocus(); releaseScroll() }
  }, [open, onClose])

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId, query])

  if (!open) return null

  /** @param {number} index */
  function choose(index) {
    const result = results[index]
    if (!result) return
    onClose()
    navigate(result.to)
  }

  /** @param {React.KeyboardEvent<HTMLInputElement>} event */
  function onKeyDown(event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((value) => (value + 1) % Math.max(results.length, 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((value) => (value - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1)) }
    if (event.key === 'Home') { event.preventDefault(); setActive(0) }
    if (event.key === 'End') { event.preventDefault(); setActive(Math.max(0, results.length - 1)) }
    if (event.key === 'Enter') { event.preventDefault(); choose(active) }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-[var(--color-scrim)]" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Command palette" className="relative w-full max-w-xl overflow-hidden rounded-md border border-line bg-surface-raised shadow-[var(--shadow-overlay)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-faint" strokeWidth={1.5} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-label="Search pages and exams"
            autoComplete="off"
            placeholder="Search pages and exams…"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            className="min-h-12 w-full bg-transparent text-sm text-heading outline-none placeholder:text-faint"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Search results" aria-busy={examsPending || undefined} className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((result, index) => (
            <li key={result.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5', index === active ? 'bg-surface-sunken text-heading' : 'text-body')}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-line text-faint" aria-hidden="true">
                {result.kind === 'exam' ? <FileText className="size-4" strokeWidth={1.5} /> : <Search className="size-4" strokeWidth={1.5} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-[560]">{result.label}</span>
                <span className="block truncate text-2xs text-muted">{result.meta}</span>
              </span>
              <span className="font-mono text-2xs uppercase tracking-widest text-faint">{result.kind}</span>
            </li>
          ))}
        </ul>
        {examsPending ? <p role="status" className="border-t border-line px-4 py-3 text-xs text-muted">Loading exams…</p> : examsError ? <p role="status" className="border-t border-line px-4 py-3 text-xs text-muted">Exams could not load. Page search is still available.</p> : results.length === 0 ? <p role="status" className="border-t border-line px-4 py-3 text-xs text-muted">No pages or exams match “{query}”.</p> : null}
        <footer className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-2xs text-faint">
          <span className="flex items-center gap-1.5"><Kbd keys={['↑', '↓']} /> move</span>
          <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
          <span className="ml-auto hidden sm:inline">Pages and exams</span>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
