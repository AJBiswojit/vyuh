import { ReceiptIndianRupee } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Card, EmptyState } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'

/**
 * Fees and enrolment records. Money is the one place where a wrong number is
 * worse than no number, so this screen states its scope before it states totals.
 */
export function AdminFeesPage() {
  useDocumentTitle('Fees')

  return (
    <>
      <PageHeader
        eyebrow="Academic office"
        title="Fees and enrolment"
        description="Instalment records by batch, with what is due, what is overdue and what has been waived. Read-only in this build."
      />

      <Card tone="paper" eyebrow="Phase 0" title="Records are scaffolded, not reconciled">
        <div className="space-y-3 text-sm leading-relaxed text-body">
          <p>
            Each enrolment will hold a fee plan, its instalments and the receipt trail. Until reconciliation is
            wired, this page deliberately shows no totals — a wrong figure here would be acted on.
          </p>
          <p className="text-muted">
            The academic office keeps the current ledger at Jaydev Vihar; office@vidyutacademy.in.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="idle" shape="dot">
            Read-only
          </Badge>
          <Badge tone="neutral" shape="none" mono>
            1,240 enrolments this term
          </Badge>
        </div>
      </Card>

      <div className="mt-5">
        <EmptyState
          icon={<ReceiptIndianRupee strokeWidth={1.5} />}
          code="0 RECORDS IMPORTED"
          title="No ledger has been imported for this term"
          description="Batches appear here once the office imports the term's ledger. Nothing is lost meanwhile; the records live in the office's own system."
          action={null}
        />
      </div>
    </>
  )
}
