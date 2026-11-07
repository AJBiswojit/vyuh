import { useCallback, useEffect, useState } from 'react'
import { useExamStore } from '../store/examStore.js'

/** Light-mode integrity: count tab switches, block copy/cut/context menu inside
 * the hall, and log fullscreen transitions. No camera or invasive proctoring.
 * @param {string | undefined} attemptId @param {boolean} enabled
 */
export function useExamIntegrity(attemptId, enabled) {
  const logIntegrity = useExamStore((state) => state.logIntegrity)
  const [fullscreen, setFullscreen] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement))
  /** @param {import('@/contracts/exam.js').IntegrityEventType} type */
  const log = useCallback((/** @type {import('@/contracts/exam.js').IntegrityEventType} */ type) => {
    if (!attemptId) return
    const attempt = useExamStore.getState().attempts[attemptId]
    logIntegrity(attemptId, { type, at: new Date().toISOString(), questionId: attempt?.questionIds[attempt.currentIndex] })
  }, [attemptId, logIntegrity])

  useEffect(() => {
    if (!enabled || !attemptId) return
    const onVisibility = () => { if (document.hidden) log('tab_switch') }
    /** @param {Event} event */
    const block = (event) => {
      const type = event.type === 'copy' ? 'copy_blocked' : event.type === 'cut' ? 'cut_blocked' : 'context_menu_blocked'
      event.preventDefault()
      log(type)
    }
    const onFullscreen = () => {
      const active = Boolean(document.fullscreenElement)
      setFullscreen(active)
      log(active ? 'fullscreen_enter' : 'fullscreen_exit')
    }
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('copy', block, true)
    document.addEventListener('cut', block, true)
    document.addEventListener('contextmenu', block, true)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('copy', block, true)
      document.removeEventListener('cut', block, true)
      document.removeEventListener('contextmenu', block, true)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [attemptId, enabled, log])

  const enterFullscreen = useCallback(async () => {
    log('fullscreen_prompt')
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
    } catch { /* browser may deny; the banner stays visible */ }
  }, [log])

  return { fullscreen, enterFullscreen }
}
