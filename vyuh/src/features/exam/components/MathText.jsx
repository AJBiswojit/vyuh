import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Renders trusted mock question text with inline/display KaTeX segments.
 * @param {{ text: string, className?: string, display?: boolean }} props
 */
export function MathText({ text, className, display = false }) {
  const html = useMemo(() => {
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g)
    return parts.map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$')) return katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true, output: 'htmlAndMathml', strict: 'ignore', trust: false })
      if (part.startsWith('$') && part.endsWith('$')) return katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: display, output: 'htmlAndMathml', strict: 'ignore', trust: false })
      return escapeHtml(part)
    }).join('')
  }, [text, display])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

/** @param {string} value */
function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
