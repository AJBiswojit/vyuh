import { useEffect } from 'react'
import { instituteName } from '@/shared/lib/instituteName.js'

/**
 * @param {string} title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} · ${instituteName()}`
  }, [title])
}
