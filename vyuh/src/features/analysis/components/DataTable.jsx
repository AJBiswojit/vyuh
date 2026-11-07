import { cn } from '@/shared/lib/cn.js'

/**
 * Screen-reader-friendly twin of a chart. It receives the exact rows plotted.
 * @param {{ caption: string, columns: { key: string, label: string, align?: 'left'|'right', format?: (value: any, row: any) => string }[], rows: Record<string, any>[], className?: string }} props
 */
export function DataTable({ caption, columns, rows, className }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead><tr className="border-b border-line">{columns.map((column) => <th key={column.key} scope="col" className={cn('rule-label py-2 pr-3 font-normal last:pr-0', column.align === 'right' && 'text-right')}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={columns.length} className="py-4 text-muted">No data.</td></tr> : rows.map((row, index) => (
            <tr key={row.id ?? row.questionId ?? row.label ?? index} className="border-b border-line last:border-0">
              {columns.map((column) => <td key={column.key} className={cn('py-2 pr-3 font-mono tabular-nums text-body last:pr-0', column.align === 'right' && 'text-right')}>{column.format ? column.format(row[column.key], row) : String(row[column.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
