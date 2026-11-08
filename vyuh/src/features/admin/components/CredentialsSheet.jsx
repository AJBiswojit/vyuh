import { useEffect, useRef, useState } from 'react'
import { Clipboard, Download, ShieldAlert } from 'lucide-react'
import { Button, IconButton, Sheet, useToast } from '@/shared/ui'
import {
  CREDENTIAL_CSV_FILE_NAME,
  CREDENTIAL_SECURITY_NOTICE,
} from '@/contracts/admin.js'
import { useMarkCredentialsShown } from '../hooks/useAdminOps.js'

import { buildCredentialCsv } from '../lib/credentialCsv.js'

/**
 * BATCH 3 (U-1 / U-2) — ONE-TIME CREDENTIALS SHEET.
 *
 * The rows live ONLY in the caller's component-local state and in this sheet.
 * Nothing is written to localStorage, the session, the query cache, a URL, the
 * console, analytics or the audit ledger. Closing the sheet clears the caller's
 * state and resets the originating mutation, so the values cannot be retrieved
 * again; a new temporary password must be issued instead.
 *
 * The CSV is produced client-side from the current transient rows and handed to
 * the browser as a Blob. The application cannot erase that downloaded file, and
 * never claims that it can. Clipboard writes happen only on an explicit,
 * per-value user click, and clipboard values are never logged or audited.
 *
 * @param {Object} props
 * @param {import('@/contracts/admin.js').CredentialSheetRow[]} props.rows
 * @param {() => void} props.onClose
 */
export function CredentialsSheet({ rows, onClose }) {
  const toast = useToast()
  const markShown = useMarkCredentialsShown()
  const [copied, setCopied] = useState(/** @type {string | null} */ (null))
  const signature = rows.map((row) => row.instituteId).join('|')
  const marked = useRef(/** @type {string | null} */ (null))
  /** BATCH 3.1 (WS7): object URLs are released after the download starts, not
   *  synchronously inside the click; any still-pending URL is revoked on
   *  unmount so a navigation cannot leave a live Blob reference behind. */
  const pendingUrls = useRef(/** @type {string[]} */ ([]))

  const releaseUrl = (/** @type {string} */ url) => {
    if (!pendingUrls.current.includes(url)) return
    pendingUrls.current = pendingUrls.current.filter((item) => item !== url)
    URL.revokeObjectURL(url)
  }

  useEffect(() => () => {
    for (const pending of pendingUrls.current.slice()) releaseUrl(pending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* R-11 / WS2: close clears ALL transient sheet state (including the "Copied"
     marker). No credential value is ever stored in `copied` — only a key. */
  useEffect(() => {
    if (signature) return
    setCopied(null)
    marked.current = null
  }, [signature])

  /* Metadata only: record that the sheet was displayed, NEVER the values. */
  useEffect(() => {
    if (!signature || marked.current === signature) return
    marked.current = signature
    markShown.mutate({ accountKeys: rows.map((row) => row.instituteId) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  /** Explicit per-value copy. No automatic copying, no clipboard logging. */
  const copyValue = async (row, field, value) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      setCopied(`${row.instituteId}:${field}`)
      toast.success('Copied', `${field === 'instituteId' ? 'Institute ID' : 'Temporary password'} copied for ${row.name}. Deliver it securely.`)
    } catch {
      toast.error('Could not copy', 'Use the field to copy the value manually, then close this sheet only after delivering it.')
    }
  }

  /** Client-side only. The downloaded file is outside the application's control. */
  const downloadCsv = () => {
    try {
      const csv = buildCredentialCsv(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      pendingUrls.current.push(url)
      const link = document.createElement('a')
      link.href = url
      link.download = CREDENTIAL_CSV_FILE_NAME
      document.body.append(link)
      link.click()
      link.remove()
      /* One task turn is enough for the browser to take its Blob reference.
         No arbitrary multi-second delay; unmount cleanup is the backstop. */
      window.setTimeout(() => releaseUrl(url), 0)
      toast.success('CSV downloaded', `${CREDENTIAL_CSV_FILE_NAME} is in your Downloads folder. The application cannot erase it.`)
    } catch {
      toast.error('Download failed', 'Copy each value instead, then close this sheet only after delivering it.')
    }
  }

  return (
    <Sheet
      open={rows.length > 0}
      onClose={onClose}
      title="One-time sign-in credentials"
      description={`${rows.length} account${rows.length === 1 ? '' : 's'} · shown once and cannot be retrieved later`}
      side="right"
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" icon={<Download strokeWidth={1.5} />} onClick={downloadCsv}>
            Download CSV
          </Button>
          <Button variant="ghost" onClick={onClose}>
            I have delivered these credentials
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div role="alert" className="flex gap-3 rounded-sm border border-danger/40 bg-danger/5 p-4">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger-fg" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-2xs leading-relaxed text-body">{CREDENTIAL_SECURITY_NOTICE}</p>
        </div>

        <p className="text-2xs leading-relaxed text-muted">
          Downloading writes <span className="font-mono">{CREDENTIAL_CSV_FILE_NAME}</span> to this device. It contains plaintext
          temporary passwords; the app cannot clear your clipboard or erase that file. There is no credential column in the
          uploaded import template and no way to look these values up again.
        </p>

        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">One-time credentials for newly created accounts</caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken">
                <th scope="col" className="rule-label px-3 py-2.5 font-normal">Name</th>
                <th scope="col" className="rule-label px-3 py-2.5 font-normal">Role</th>
                <th scope="col" className="rule-label px-3 py-2.5 font-normal">Institute ID</th>
                <th scope="col" className="rule-label px-3 py-2.5 font-normal">Temporary password</th>
                <th scope="col" className="rule-label px-3 py-2.5 font-normal">Batch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.instituteId} data-testid="credential-row" className="border-b border-line align-top last:border-0">
                  <td className="px-3 py-3 font-[560] text-heading">{row.name}</td>
                  <td className="px-3 py-3 text-body">{row.role === 'faculty' ? 'Faculty' : 'Student'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-2xs text-heading">{row.instituteId}</code>
                      <IconButton
                        icon={<Clipboard strokeWidth={1.5} />}
                        label={`Copy Institute ID for ${row.name}`}
                        onClick={() => copyValue(row, 'instituteId', row.instituteId)}
                      />
                    </div>
                    {copied === `${row.instituteId}:instituteId` ? <span data-testid="copied-marker" className="mt-1 block text-2xs text-muted">Copied</span> : null}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-2xs text-heading">{row.temporaryPassword}</code>
                      <IconButton
                        icon={<Clipboard strokeWidth={1.5} />}
                        label={`Copy temporary password for ${row.name}`}
                        onClick={() => copyValue(row, 'temporaryPassword', row.temporaryPassword)}
                      />
                    </div>
                    {copied === `${row.instituteId}:temporaryPassword` ? <span data-testid="copied-marker" className="mt-1 block text-2xs text-muted">Copied</span> : null}
                  </td>
                  <td className="px-3 py-3 text-2xs text-muted">{row.batchName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-2xs leading-relaxed text-muted">
          Prototype notice: passwords are stored as salted SHA-256 digests for this mock only. This is not
          production-grade credential security. Every account must change its temporary password at first sign-in.
        </p>
      </div>
    </Sheet>
  )
}
