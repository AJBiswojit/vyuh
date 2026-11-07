import { useEffect, useId, useRef, useState } from 'react'
import { Image as ImageIcon, Lock, Palette, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Input, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { useBranding, useSaveBranding } from '../hooks/useAdmin.js'

/**
 * Identity, and the boundary around it. The office owns the name, the short name
 * and the mark; it does not own the palette. The colour card says so with the
 * three tokens themselves rather than a paragraph of brand police.
 */
export function AdminSettingsPage() {
  useDocumentTitle('Branding and settings')
  const branding = useBranding()
  const save = useSaveBranding()
  const toast = useToast()

  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [tagline, setTagline] = useState('')
  const [logoFileName, setLogoFileName] = useState(/** @type {string|null} */ (null))
  const logoInput = useId()
  const fileRef = useRef(/** @type {HTMLInputElement | null} */ (null))

  useEffect(() => {
    if (!branding.data) return
    setName(branding.data.instituteName)
    setShortName(branding.data.shortName)
    setTagline(branding.data.tagline)
    setLogoFileName(branding.data.logoFileName)
  }, [branding.data])

  if (branding.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading settings</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-10 w-[min(26rem,80%)]" />
        <Skeleton.Block className="h-56" />
      </div>
    )
  }

  if (branding.isError) {
    return (
      <ErrorState
        code="E_SETTINGS"
        title="Settings could not load"
        description={/** @type {Error} */ (branding.error)?.message ?? 'Try again.'}
        action={<Button variant="secondary" onClick={() => branding.refetch()} loading={branding.isFetching}>Try again</Button>}
      />
    )
  }

  const data = branding.data
  if (!data) return null

  const dirty =
    name !== data.instituteName ||
    shortName !== data.shortName ||
    tagline !== data.tagline ||
    (logoFileName ?? null) !== (data.logoFileName ?? null)
  const valid = name.trim().length >= 3 && shortName.trim().length > 0
  const mark = (name.trim() || data.logoMark)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const submit = () => {
    save.mutate(
      { instituteName: name, shortName, tagline, logoFileName, logoMark: mark },
      {
        onSuccess: (next) => {
          toast.success('Branding saved', `${next.instituteName} · colour system unchanged`)
          setLogoFileName(next.logoFileName)
        },
        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Settings"
        title="Branding and settings"
        description="The name, the mark and the words the institute is called by across the product. Colours are not editable: the interface uses Vyuh's three-colour system so every centre looks like the same institution."
        meta={<span className="font-mono text-2xs tabular-nums text-muted">Last saved {data.logoUpdatedAt ? formatDateTime(data.logoUpdatedAt) : 'this term'}</span>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          eyebrow="Identity"
          title="Institute name and mark"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-2xs text-muted">
                {dirty ? 'Unsaved changes.' : 'Saved. Every screen that prints the institute name reads this.'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setName(data.instituteName); setShortName(data.shortName); setTagline(data.tagline); setLogoFileName(data.logoFileName)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  disabled={!dirty}
                >
                  Discard
                </Button>
                <Button variant="primary" icon={<Save strokeWidth={1.5} />} onClick={submit} loading={save.isPending} disabled={!dirty || !valid}>
                  Save branding
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Institute name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              hint="Printed on every paper, result sheet and circular."
              error={name.trim().length > 0 && name.trim().length < 3 ? 'At least three characters.' : undefined}
            />
            <Input
              label="Short name"
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              hint="Used in the rail and on tight layouts."
              error={shortName.trim().length === 0 ? 'A short name is required.' : undefined}
            />
            <div className="sm:col-span-2">
              <Input label="Tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} hint="One line under the name on the sign-in screen." />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <div className="flex size-20 items-center justify-center rounded-md border border-line bg-ink font-display text-xl tracking-tight text-paper" aria-hidden="true">
              {mark}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={logoInput} className="text-xs font-[560] tracking-tight text-heading">Institute mark</label>
              <input
                ref={fileRef}
                id={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(event) => setLogoFileName(event.target.files?.[0]?.name ?? logoFileName)}
                className="block w-full cursor-pointer rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs text-body file:mr-3 file:rounded-xs file:border file:border-line-strong file:bg-surface-sunken file:px-3 file:py-1.5 file:text-2xs file:text-heading"
              />
              <p className="text-2xs leading-relaxed text-muted">
                {logoFileName
                  ? `${logoFileName} is recorded. In this build the upload is simulated — the initials above stand in for the mark, and the file is not transferred.`
                  : 'No file chosen. The mark falls back to the institute’s initials. Uploads are simulated in this build.'}
              </p>
              {logoFileName ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 strokeWidth={1.5} />}
                  onClick={() => {
                    setLogoFileName(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="w-fit"
                >
                  Remove the mark
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-sm border border-line bg-surface-sunken px-3 py-2">
            <ImageIcon className="size-3.5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-2xs leading-relaxed text-muted">
              Accepted: PNG, JPEG or SVG. A real build would store the file and serve a dark-mode variant; this one
              records the file name so the flow can be judged.
            </p>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card eyebrow="Locked" title="Colour system" action={<Lock className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
            <p className="text-2xs leading-relaxed text-body">
              Vyuh uses three colours, and only three. Every status is also carried by a shape and a word, so a
              colour-blind candidate reads the same result as everyone else. An institute palette would break that
              guarantee, so the control is present and disabled rather than hidden.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { name: 'Paper', token: 'paper', className: 'bg-paper', usage: 'The page. Warm off-white.' },
                { name: 'Ink', token: 'ink', className: 'bg-ink', usage: 'Structure and type. Deep blue-black.' },
                { name: 'Ember', token: 'ember', className: 'bg-ember', usage: 'The one accent. Actions.' },
              ].map((swatch) => (
                <div key={swatch.token} className="flex items-center gap-3 rounded-sm border border-line px-3 py-2">
                  <span className={`size-8 shrink-0 rounded-sm border border-line-strong ${swatch.className}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-2xs font-[560] text-heading">{swatch.name}</p>
                    <p className="text-2xs text-muted">{swatch.usage}</p>
                  </div>
                  <span className="ml-auto font-mono text-2xs text-faint">{swatch.token}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Select
                label="Institute palette"
                value="vyuh"
                onChange={() => {}}
                disabled
                options={[{ value: 'vyuh', label: 'Vyuh three-colour system · locked' }]}
                hint="A custom palette needs a design review; the control is disabled for every institute."
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="idle" variant="soft" shape="hollow">
                <Lock className="size-3" strokeWidth={2} aria-hidden="true" />
                Locked
              </Badge>
              <Badge tone="neutral" variant="outline" shape="square" mono>tokens.css</Badge>
            </div>
          </Card>

          <Card eyebrow="Also fixed" title="What the office cannot rename" action={<Palette className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />}>
            <ul className="flex flex-col gap-2 text-2xs leading-relaxed text-muted">
              <li>Status shapes — square, diamond, ring, circle and hollow carry meaning, not decoration.</li>
              <li>Type — Fraunces for numerals and headings, the interface sans for everything else.</li>
              <li>Density — the console is measured in ruled rows, not cards-with-shadows.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
