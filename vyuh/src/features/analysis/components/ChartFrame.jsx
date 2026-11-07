import { useId, useState } from 'react'
import { Table2, ChartNoAxesColumn } from 'lucide-react'
import { Button, Card } from '@/shared/ui'
import { DataTable } from './DataTable.jsx'

/**
 * Every analysis chart ships with a visible table toggle. The table is fed the
 * same data array as the chart, so the alternative cannot drift.
 * @param {{ title: string, eyebrow?: string, description?: string, table: { caption: string, columns: { key: string, label: string, align?: 'left'|'right', format?: (value: any, row: any) => string }[], rows: Record<string, any>[] }, children: React.ReactNode, className?: string }} props
 */
export function ChartFrame({ title, eyebrow, description, table, children, className }) {
  const [asTable, setAsTable] = useState(false)
  const panelId = useId()
  return (
    <Card eyebrow={eyebrow} title={title} className={className} action={
      <Button variant="ghost" size="sm" aria-pressed={asTable} aria-controls={panelId} onClick={() => setAsTable((value) => !value)} icon={asTable ? <ChartNoAxesColumn strokeWidth={1.5} /> : <Table2 strokeWidth={1.5} />}>
        {asTable ? 'View chart' : 'View as table'}
      </Button>
    }>
      {description ? <p className="mb-4 text-2xs leading-relaxed text-muted">{description}</p> : null}
      <div id={panelId} role="region" aria-label={title}>
        {asTable ? <DataTable caption={table.caption} columns={table.columns} rows={table.rows} /> : children}
      </div>
    </Card>
  )
}
