import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, FileCheck2, FileText, SkipForward, Upload, X } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, Checkbox, ErrorState, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { parseCsv } from '@/shared/lib/adminMath.js'
import { useAdminBatches } from '../hooks/useAdmin.js'
import { useCommitImport, useImportPreview, useImportTemplate } from '../hooks/useAdminOps.js'
import { Stepper } from '../components/Stepper.jsx'

const STEPS = [
  { id: 'upload', label: 'Upload', hint: 'Paste the sheet or choose the file the office exported.' },
  { id: 'map', label: 'Map columns', hint: 'Say which column is which. Guessed from the header where possible.' },
  { id: 'validate', label: 'Validation', hint: 'Every row is checked against the roster before anything is written.' },
  { id: 'commit', label: 'Commit', hint: 'Create the accounts and record the import in the audit ledger.' },
]

/**
 * The bulk import wizard. Four steps, one decision each: what arrived, which
 * column is which, which rows are wrong, and commit.
 *
 * Validation is the service's: the preview calls the same function the commit
 * does, so a row the screen calls valid cannot be rejected on save. Invalid rows
 * are editable in place, or skippable — the office always has the option of
 * bringing a name in later rather than blocking the other 300.
 */
export function AdminImportPage() {
  useDocumentTitle('Import accounts')
  const toast = useToast()
  const template = useImportTemplate()
  const batches = useAdminBatches()
  const preview = useImportPreview()
  const commit = useCommitImport()

  const [step, setStep] = useState(1)
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('pasted-sheet.csv')
  const [mapping, setMapping] = useState(/** @type {Record<string,string>} */ ({}))
  const [fixes, setFixes] = useState(/** @type {Record<number, Record<string,string>>} */ ({}))
  const [skipped, setSkipped] = useState(/** @type {number[]} */ ([]))
  const [result, setResult] = useState(/** @type {import('@/contracts/admin.js').ImportCommitResult | null} */ (null))
  const fileId = useId()
  const fileRef = useRef(/** @type {HTMLInputElement | null} */ (null))

  const fields = template.data?.fields ?? []
  const aliases = template.data?.aliases ?? {}
  const samples = template.data?.samples ?? {}
  const batchOptions = (batches.data ?? []).map((batch) => ({ value: batch.name, label: batch.name }))

  const parsed = parseCsv(csv)
  const duplicates = Object.entries(mapping)
    .filter(([, header]) => header)
    .reduce((acc, [field, header]) => {
      const same = Object.entries(mapping).filter(([, candidate]) => candidate === header)
      if (same.length > 1) acc.push({ field, header })
      return acc
    }, /** @type {Array<{ field: string, header: string }>} */ ([]))
  const missingRequired = fields.filter((field) => field.required && !mapping[field.key])
  const mappingReady = missingRequired.length === 0 && duplicates.length === 0

  /** Guess a mapping from the header row. Only fills fields with no answer yet. */
  const autoMap = (headers) => {
    setMapping((current) => {
      const next = { ...current }
      for (const field of fields) {
        if (next[field.key]) continue
        const options = aliases[field.key] ?? []
        const used = Object.values(next)
        const match = headers.find(
          (header) => !used.includes(header) && options.includes(header.trim().toLowerCase().replace(/\s+/g, ' ')),
        )
        next[field.key] = match ?? ''
      }
      return next
    })
  }

  /** @param {{ fileName: string, csv: string }} sample */
  const applySample = (sample) => {
    setCsv(sample.csv)
    setFileName(sample.fileName)
    setFixes({})
    setSkipped([])
    setMapping({})
    autoMap(parseCsv(sample.csv).headers)
    setResult(null)
  }

  /** @param {File | undefined} file */
  const readFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setCsv(text)
      setFileName(file.name)
      setFixes({})
      setSkipped([])
      setMapping({})
      autoMap(parseCsv(text).headers)
      setResult(null)
    }
    reader.readAsText(file)
  }

  const downloadSample = () => {
    if (!template.data) return
    const blob = new Blob([template.data.samples.clean.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = template.data.samples.clean.fileName
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  // Validate whenever the mapping, a fix or a skip changes, while on step three.
  useEffect(() => {
    if (step !== 3 || !csv || !mappingReady) return undefined
    const timer = setTimeout(() => {
      preview.mutate({ csv, mapping, fixes, skipped })
    }, 180)
    return () => clearTimeout(timer)
    // `preview` is a stable mutation object; including it would loop on status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, csv, mapping, fixes, skipped, mappingReady])

  const data = preview.data
  const invalidCount = data?.summary.invalid ?? 0
  const readyCount = data?.summary.ready ?? 0

  const canContinue =
    step === 1 ? parsed.rows.length > 0 :
    step === 2 ? mappingReady && parsed.rows.length > 0 :
    step === 3 ? Boolean(data) && invalidCount === 0 && readyCount > 0 :
    false

  const next = () => {
    if (step === 1) {
      autoMap(parsed.headers)
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
    if (step === 3) setStep(4)
  }

  const back = () => setStep((value) => Math.max(1, value - 1))

  const skipInvalid = () => {
    if (!data) return
    setSkipped((current) => [...new Set([...current, ...data.rows.filter((row) => row.status === 'invalid').map((row) => row.line)])])
  }

  /** @param {number} line @param {string} field @param {string} value */
  const setFix = (line, field, value) => {
    setFixes((current) => ({ ...current, [line]: { ...current[line], [field]: value } }))
  }

  /** @param {number} line @param {boolean} value */
  const toggleSkip = (line, value) => {
    setSkipped((current) => (value ? [...new Set([...current, line])] : current.filter((candidate) => candidate !== line)))
  }

  const doCommit = () => {
    commit.mutate(
      { csv, mapping, fixes, skipped, fileName },
      {
        onSuccess: (payload) => {
          setResult(payload)
          toast.success('Import committed', `${payload.created} accounts created · ${payload.skipped} skipped`)
        },
        onError: (/** @type {Error} */ error) => toast.error('Not committed', error.message),
      },
    )
  }

  if (template.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading the import template</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-10 w-[min(30rem,80%)]" />
        <Skeleton.Block className="h-24" />
      </div>
    )
  }

  if (template.isError) {
    return (
      <ErrorState
        code="E_IMPORT_SETUP"
        title="The import wizard could not start"
        description={/** @type {Error} */ (template.error)?.message ?? 'Try again.'}
        action={<Button variant="secondary" onClick={() => template.refetch()}>Try again</Button>}
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · People"
        title="Import accounts from a CSV"
        description="Bring the office sheet in without retyping it. Nothing is written until you commit, and every row is checked against the existing roster first."
        meta={
          <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-2xs font-[560] text-heading hover:text-ember-press">
            <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Back to user management
          </Link>
        }
        actions={
          <Button variant="secondary" icon={<Download strokeWidth={1.5} />} onClick={downloadSample}>
            Sample CSV
          </Button>
        }
      />

      <Stepper steps={STEPS} current={result ? 4 : step} />

      {result ? (
        <Card eyebrow="Committed" title="The rows are accounts now" data-testid="import-result">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-answer text-on-signal">
              <FileCheck2 className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-[560] tracking-tight text-heading">
                {result.created} account{result.created === 1 ? '' : 's'} created from {fileName}.
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-muted">
                {result.skipped} row{result.skipped === 1 ? '' : 's'} skipped. Each account arrives invited, so the
                person sets their own password on first sign-in. The import is recorded in the audit ledger as
                <span className="font-mono text-heading"> {result.auditId}</span>.
              </p>
              <p className="mt-3 text-2xs leading-relaxed text-body">{result.names.join(' · ')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/admin/users"
                  className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading hover:border-heading"
                >
                  Open user management
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResult(null); setStep(1); setCsv(''); setMapping({}); setFixes({}); setSkipped([]); setFileName('pasted-sheet.csv')
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                >
                  Import another sheet
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {step === 1 ? (
            <Card eyebrow="Step 1" title="What arrived">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="flex flex-col gap-3">
                  <label htmlFor={fileId} className="text-xs font-[560] tracking-tight text-heading">
                    Choose a CSV file
                  </label>
                  <input
                    ref={fileRef}
                    id={fileId}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => readFile(event.target.files?.[0])}
                    className="block w-full cursor-pointer rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs text-body file:mr-3 file:rounded-xs file:border file:border-line-strong file:bg-surface-sunken file:px-3 file:py-1.5 file:text-2xs file:text-heading"
                  />
                  <p className="text-2xs leading-relaxed text-muted">
                    Or paste the sheet below. The first row must be the header; columns can be in any order and the
                    next step maps them.
                  </p>
                  <label htmlFor={`${fileId}-paste`} className="text-xs font-[560] tracking-tight text-heading">
                    CSV content
                  </label>
                  <textarea
                    id={`${fileId}-paste`}
                    value={csv}
                    onChange={(event) => {
                      const text = event.target.value
                      setCsv(text)
                      setMapping({})
                      setFixes({})
                      setSkipped([])
                      autoMap(parseCsv(text).headers)
                    }}
                    rows={10}
                    spellCheck={false}
                    placeholder="Roll number,Full name,Email,Phone,Role,Batch,Joined on"
                    className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 font-mono text-2xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                  />
                  {csv ? (
                    <p className="font-mono text-2xs tabular-nums text-muted" role="status">
                      {parsed.rows.length} data row{parsed.rows.length === 1 ? '' : 's'} · {parsed.headers.length} columns
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3">
                  <p className="rule-label">Or start from a sample</p>
                  {Object.entries(samples).map(([key, sample]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applySample(sample)}
                      className="rounded-sm border border-line bg-surface-sunken px-4 py-3 text-left transition-colors hover:border-heading"
                    >
                      <span className="flex items-center gap-2 text-xs font-[560] tracking-tight text-heading">
                        <FileText className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        {sample.label}
                      </span>
                      <span className="mt-1 block text-2xs leading-relaxed text-muted">{sample.description}</span>
                      <span className="mt-1.5 block font-mono text-2xs text-faint">{sample.fileName}</span>
                    </button>
                  ))}
                  <p className="text-2xs leading-relaxed text-muted">
                    The second sample is deliberately broken: a blank name, a truncated email, a duplicate roll, an
                    unknown batch and a date that does not exist. Use it to see the validation step.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card eyebrow="Step 2" title="Map the columns" footer={
              <p className="text-2xs text-muted">
                Required columns: {fields.filter((field) => field.required).map((field) => field.label).join(', ')}.
                Unmapped optional columns are ignored.
              </p>
            }>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map((field) => (
                  <div key={field.key}>
                    <Select
                      label={`${field.label}${field.required ? ' (required)' : ''}`}
                      value={mapping[field.key] ?? ''}
                      onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                      options={[
                        { value: '', label: 'Not mapped' },
                        ...parsed.headers.map((header) => ({ value: header, label: header })),
                      ]}
                      hint={field.hint}
                    />
                  </div>
                ))}
              </div>

              {missingRequired.length > 0 || duplicates.length > 0 ? (
                <div className="mt-4 rounded-sm border border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_8%,transparent)] px-4 py-3" role="alert">
                  {missingRequired.length > 0 ? (
                    <p className="text-2xs leading-relaxed text-danger-fg">
                      Map a column to {missingRequired.map((field) => field.label).join(', ')} before continuing.
                    </p>
                  ) : null}
                  {duplicates.length > 0 ? (
                    <p className="mt-1 text-2xs leading-relaxed text-danger-fg">
                      {duplicates[0].header} is mapped twice. Each column can feed one field.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5">
                <p className="rule-label mb-2">First three rows, as they arrived</p>
                <div className="overflow-x-auto rounded-sm border border-line">
                  <table className="w-full border-collapse text-left text-2xs">
                    <caption className="sr-only">Raw rows from the uploaded sheet</caption>
                    <thead>
                      <tr className="border-b border-line bg-surface-sunken">
                        {parsed.headers.map((header) => (
                          <th key={header} scope="col" className="rule-label whitespace-nowrap px-3 py-2 font-normal">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 3).map((row) => (
                        <tr key={row.line} className="border-b border-line last:border-0">
                          {parsed.headers.map((header, index) => (
                            <td key={header} className="whitespace-nowrap px-3 py-2 font-mono text-muted">{row.cells[index] || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card
              eyebrow="Step 3"
              title="Validation"
              action={
                invalidCount > 0 ? (
                  <Button variant="secondary" size="sm" icon={<SkipForward strokeWidth={1.5} />} onClick={skipInvalid}>
                    Skip {invalidCount} invalid row{invalidCount === 1 ? '' : 's'}
                  </Button>
                ) : null
              }
              footer={
                <p className="text-2xs text-muted">
                  Fix a cell in place or tick Skip. Nothing is written until the commit step, and the commit uses this
                  same validation.
                </p>
              }
            >
              {preview.isPending && !data ? (
                <div role="status" aria-busy="true" className="space-y-2">
                  <span className="sr-only">Checking rows</span>
                  {[0, 1, 2, 3].map((key) => <Skeleton.Block key={key} className="h-10" />)}
                </div>
              ) : preview.isError ? (
                <ErrorState
                  code="E_IMPORT"
                  title="The rows could not be checked"
                  description={/** @type {Error} */ (preview.error)?.message ?? 'Try again.'}
                  action={<Button variant="secondary" onClick={() => preview.mutate({ csv, mapping, fixes, skipped })}>Check again</Button>}
                />
              ) : data ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3" data-testid="import-summary">
                    <Badge tone="answer" variant="soft" shape="square">{readyCount} ready</Badge>
                    <Badge tone={invalidCount ? 'danger' : 'neutral'} variant="soft" shape={invalidCount ? 'ring' : 'square'}>
                      {invalidCount} with errors
                    </Badge>
                    <Badge tone="idle" variant="soft" shape="hollow">{data.summary.skipped} skipped</Badge>
                    <span className="font-mono text-2xs tabular-nums text-muted">of {data.summary.total} rows</span>
                  </div>

                  <div className="overflow-x-auto rounded-sm border border-line">
                    <table className="w-full border-collapse text-left text-2xs">
                      <caption className="sr-only">Row-level validation results</caption>
                      <thead>
                        <tr className="border-b border-line bg-surface-sunken">
                          <th scope="col" className="rule-label px-3 py-2 font-normal">Row</th>
                          <th scope="col" className="rule-label px-3 py-2 font-normal">Name</th>
                          <th scope="col" className="rule-label px-3 py-2 font-normal">Email</th>
                          <th scope="col" className="rule-label px-3 py-2 font-normal">Batch</th>
                          <th scope="col" className="rule-label px-3 py-2 font-normal">Status</th>
                          <th scope="col" className="rule-label px-3 py-2 font-normal">Skip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map((row) => {
                          const skippedRow = row.status === 'skipped'
                          const errorFields = row.errors.map((error) => error.field)
                          const inlineFields = ['name', 'email', 'batch']
                          const extraErrors = row.errors.filter((error) => !inlineFields.includes(error.field))
                          return (
                            <Fragment key={row.line}>
                              <tr
                                data-testid={`import-row-${row.line}`}
                                className={cn('border-b border-line align-top', skippedRow && 'opacity-60')}
                              >
                                <td className="px-3 py-2 font-mono tabular-nums text-muted">{row.line}</td>
                                <td className="px-3 py-2">
                                  {errorFields.includes('name') ? (
                                    <input
                                      aria-label={`Full name row ${row.line}`}
                                      value={fixes[row.line]?.name ?? row.values.name}
                                      onChange={(event) => setFix(row.line, 'name', event.target.value)}
                                      className="min-h-8 w-40 rounded-xs border border-line-strong bg-surface-raised px-2 text-2xs text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                                    />
                                  ) : (
                                    <span className="text-heading">{row.values.name || '—'}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {errorFields.includes('email') ? (
                                    <input
                                      aria-label={`Email row ${row.line}`}
                                      value={fixes[row.line]?.email ?? row.values.email}
                                      onChange={(event) => setFix(row.line, 'email', event.target.value)}
                                      className="min-h-8 w-52 rounded-xs border border-line-strong bg-surface-raised px-2 font-mono text-2xs text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                                    />
                                  ) : (
                                    <span className="font-mono text-muted">{row.values.email || '—'}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {errorFields.includes('batch') ? (
                                    <Select
                                      label={`Batch row ${row.line}`}
                                      value={fixes[row.line]?.batch ?? row.values.batch}
                                      onChange={(event) => setFix(row.line, 'batch', event.target.value)}
                                      options={[{ value: '', label: 'Choose a batch' }, ...batchOptions]}
                                      className="min-w-48"
                                    />
                                  ) : (
                                    <span className="text-muted">{row.values.batch || '—'}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {skippedRow ? (
                                    <Badge tone="idle" variant="soft" shape="hollow">Skipped</Badge>
                                  ) : row.status === 'ready' ? (
                                    <Badge tone="answer" variant="soft" shape="square">Ready</Badge>
                                  ) : (
                                    <Badge tone="danger" variant="soft" shape="ring">Needs a fix</Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <Checkbox
                                    label={`Skip row ${row.line}`}
                                    checked={skippedRow}
                                    onChange={(event) => toggleSkip(row.line, event.target.checked)}
                                  />
                                </td>
                              </tr>
                              {row.errors.length > 0 ? (
                                <tr data-testid={`import-errors-${row.line}`} className="border-b border-line">
                                  <td />
                                  <td colSpan={5} className="px-3 pb-2">
                                    <ul className="flex flex-col gap-1.5">
                                      {row.errors.map((error) => (
                                        <li key={`${error.field}-${error.message}`} className="flex flex-wrap items-start gap-x-2 gap-y-1 text-2xs leading-relaxed text-danger-fg">
                                          <X className="mt-0.5 size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                                          <span className="min-w-0 flex-1">{error.message}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    {extraErrors.length > 0 ? (
                                      <div className="mt-2 flex flex-wrap items-end gap-2">
                                        {extraErrors.map((error) => {
                                          const field = fields.find((candidate) => candidate.key === error.field)
                                          if (!field) return null
                                          if (field.key === 'role') {
                                            return (
                                              <Select
                                                key={error.field}
                                                label={`${field.label} row ${row.line}`}
                                                value={fixes[row.line]?.role ?? row.values.role}
                                                onChange={(event) => setFix(row.line, 'role', event.target.value)}
                                                options={[{ value: 'student', label: 'Student' }, { value: 'faculty', label: 'Faculty' }]}
                                                className="w-44"
                                              />
                                            )
                                          }
                                          return (
                                            <label key={error.field} className="flex flex-col gap-1">
                                              <span className="text-2xs text-muted">{field.label}</span>
                                              <input
                                                aria-label={`${field.label} row ${row.line}`}
                                                value={fixes[row.line]?.[error.field] ?? row.values[/** @type {'phone'|'rollNumber'|'joinedAt'} */ (error.field)] ?? ''}
                                                onChange={(event) => setFix(row.line, error.field, event.target.value)}
                                                className="min-h-8 w-40 rounded-xs border border-line-strong bg-surface-raised px-2 font-mono text-2xs text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                                              />
                                            </label>
                                          )
                                        })}
                                      </div>
                                    ) : null}
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {invalidCount > 0 ? (
                    <p className="mt-3 flex items-start gap-2 text-2xs leading-relaxed text-review-fg" role="status">
                      <X className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                      {invalidCount} row{invalidCount === 1 ? '' : 's'} cannot be committed yet. Fix the cells or tick
                      Skip, and the check runs again.
                    </p>
                  ) : null}
                </>
              ) : null}
            </Card>
          ) : null}

          {step === 4 && data ? (
            <Card eyebrow="Step 4" title="Commit">
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <p className="rule-label">Accounts to create</p>
                  <p className="mt-2 font-display text-2xl tracking-tight text-heading tabular-nums" data-testid="import-ready-count">{readyCount}</p>
                </div>
                <div>
                  <p className="rule-label">Rows skipped</p>
                  <p className="mt-2 font-display text-2xl tracking-tight text-heading tabular-nums">{data.summary.skipped}</p>
                </div>
                <div>
                  <p className="rule-label">Source file</p>
                  <p className="mt-2 truncate font-mono text-2xs text-heading">{fileName}</p>
                </div>
              </div>
              <ul className="mt-5 flex flex-col gap-1.5 text-2xs leading-relaxed text-muted">
                <li>Every created account starts invited; the person sets a password on first sign-in.</li>
                <li>Roll numbers and emails are checked against the whole roster, not just this sheet.</li>
                <li>The import is appended to the audit ledger with the row counts and the source file.</li>
              </ul>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {step > 1 ? (
                <Button variant="ghost" icon={<ArrowLeft strokeWidth={1.5} />} onClick={back}>
                  Back
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {step === 3 && invalidCount > 0 ? (
                <p className="text-2xs text-muted">Resolve or skip the invalid rows to continue.</p>
              ) : null}
              <Button
                variant="primary"
                icon={step === 4 ? <Upload strokeWidth={1.5} /> : undefined}
                onClick={step === 4 ? doCommit : next}
                loading={step === 4 ? commit.isPending : false}
                disabled={step === 4 ? readyCount === 0 : !canContinue}
              >
                {step === 1 ? 'Map the columns' : step === 2 ? 'Check every row' : step === 3 ? 'Continue to commit' : `Commit ${readyCount} account${readyCount === 1 ? '' : 's'}`}
              </Button>
              {step !== 4 ? (
                <Link to="/admin/users" className="text-2xs font-[560] text-muted hover:text-heading">
                  Cancel
                </Link>
              ) : null}
            </div>
          </div>

          {commit.isError ? (
            <p role="alert" className="text-2xs text-danger-fg">
              {/** @type {Error} */ (commit.error)?.message}
            </p>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {data ? `${readyCount} rows ready, ${invalidCount} with errors.` : ''}
          </p>
        </div>
      )}
    </>
  )
}
