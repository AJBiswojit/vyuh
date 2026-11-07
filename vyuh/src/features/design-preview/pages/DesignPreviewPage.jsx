import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Download,
  Inbox,
  Info,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Kbd,
  Logo,
  Radio,
  SectionLabel,
  Select,
  Sheet,
  Skeleton,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  ThemeToggle,
  Tooltip,
  useToast,
} from '@/shared/ui'
import { useTheme } from '@/app/providers/ThemeProvider.jsx'
import { cn } from '@/shared/lib/cn.js'
import { formatClock, formatMarks } from '@/shared/lib/format.js'

/**
 * /design-preview — dev-only surface.
 *
 * Renders every token and every primitive twice, side by side: once pinned to
 * light, once pinned to dark. The pinning uses [data-theme], which tokens.css
 * scopes its semantic aliases to, so both columns are real rendered states and
 * not a simulation.
 *
 * This route is the acceptance surface for the design system. If a primitive is
 * not here, it is not finished.
 */

/** Every colour token, in the order the system defines them. */
const PALETTE = [
  { name: 'ink', className: 'bg-ink', note: 'structure · 60%' },
  { name: 'ink-raised', className: 'bg-ink-raised', note: 'panel on ink' },
  { name: 'ink-sunken', className: 'bg-ink-sunken', note: 'well on ink' },
  { name: 'paper', className: 'bg-paper', note: 'surface · 30%' },
  { name: 'paper-raised', className: 'bg-paper-raised', note: 'reading card' },
  { name: 'paper-sunken', className: 'bg-paper-sunken', note: 'recessed' },
  { name: 'ember', className: 'bg-ember', note: 'signal · 10%' },
  { name: 'ember-press', className: 'bg-ember-press', note: 'pressed' },
  { name: 'ember-wash', className: 'bg-ember-wash', note: 'disabled / wash' },
]

const SEMANTIC = [
  { name: 'lichen', fill: 'bg-lichen', fg: 'text-lichen-deep', soft: 'text-lichen-soft', note: 'answered · correct · present' },
  { name: 'marigold', fill: 'bg-marigold', fg: 'text-marigold-deep', soft: 'text-marigold-soft', note: 'review · warning' },
  { name: 'oxblood', fill: 'bg-oxblood', fg: 'text-oxblood-deep', soft: 'text-oxblood-soft', note: 'wrong · absent · danger' },
  { name: 'glacier', fill: 'bg-glacier', fg: 'text-glacier-deep', soft: 'text-glacier-soft', note: 'live · info' },
  { name: 'dust', fill: 'bg-dust', fg: 'text-dust-deep', soft: 'text-dust-soft', note: 'muted · not visited' },
]

const TYPE_SCALE = [
  { token: 'text-2xs', px: '12', role: 'mono labels, chart ticks' },
  { token: 'text-xs', px: '14', role: 'smallest body size' },
  { token: 'text-sm', px: '17.5', role: 'UI body' },
  { token: 'text-base', px: '20', role: 'reading measure, exam question' },
  { token: 'text-lg', px: '25', role: 'card titles' },
  { token: 'text-xl', px: '31', role: 'section heads' },
  { token: 'text-2xl', px: '39', role: 'page titles' },
  { token: 'text-3xl', px: '49', role: 'display' },
]

/** Wraps a specimen in a fixed theme so both columns render truly. */
function ThemePane({ theme, label, children }) {
  return (
    <div data-theme={theme} className="min-w-0 overflow-hidden rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-sunken px-4 py-2.5">
        <p className="rule-label">{label}</p>
        <span className="font-mono text-2xs tabular-nums text-faint">data-theme=&quot;{theme}&quot;</span>
      </div>
      <div className="px-4 py-5 text-body">{children}</div>
    </div>
  )
}

function Specimen({ title, note, children, stacked = false }) {
  return (
    <section className="border-b border-line py-5 last:border-b-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-[580] tracking-tight text-heading">{title}</h3>
        {note ? <p className="text-2xs text-faint">{note}</p> : null}
      </div>
      <div className={stacked ? 'flex flex-col gap-4' : 'flex flex-wrap items-center gap-3'}>{children}</div>
    </section>
  )
}

/** One primitive, rendered in both themes. */
function DualSpecimen({ title, note, render }) {
  return (
    <Specimen title={title} note={note} stacked>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ThemePane theme="light" label="Paper">
          {render('light')}
        </ThemePane>
        <ThemePane theme="dark" label="Ink">
          {render('dark')}
        </ThemePane>
      </div>
    </Specimen>
  )
}

const SELECT_OPTIONS = [
  { value: 'prayas', label: 'Prayas JEE 2027 — Morning' },
  { value: 'aarambh', label: 'Aarambh JEE 2026 — Evening' },
  { value: 'shikhar', label: 'Shikhar Droppers — Full day' },
]

export function DesignPreviewPage() {
  const toast = useToast()
  const { mode, resolved } = useTheme()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [checked, setChecked] = useState(true)

  return (
    <div className="min-h-dvh bg-surface">
      <a href="#preview-main" className="skip-link">
        Skip to the specimen sheet
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--color-surface)_94%,transparent)] backdrop-blur-[2px]">
        <div className="mx-auto flex min-h-[var(--spacing-topbar)] w-full max-w-[90rem] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo to="/" size="sm" />
            <span className="hidden h-4 w-px bg-line-strong sm:block" aria-hidden="true" />
            <p className="rule-label hidden sm:block">Design preview</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-2xs tabular-nums text-faint">
              mode {mode} · painting {resolved}
            </p>
            <ThemeToggle compact />
            <Link to="/" className="text-2xs text-muted hover:text-heading">
              Landing
            </Link>
            <Link to="/sign-in" className="text-2xs text-muted hover:text-heading">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main id="preview-main" tabIndex={-1} className="mx-auto w-full max-w-[90rem] px-4 py-8 outline-none sm:px-6">
        <div className="mb-8 border-b border-line pb-6">
          <p className="rule-label">Foundation · Phase 0</p>
          <h1 className="mt-2 text-2xl leading-tight tracking-tighter">Design system</h1>
          <p className="mt-2 max-w-2xl text-xs text-muted">
            Every token, primitive and state in the product, rendered twice: once pinned to Paper and once to Ink.
            Focus rings are the product&apos;s own — tab through this page to see them at 2px ember on both surfaces.
          </p>
        </div>

        {/* ── Tokens ─────────────────────────────────────────────────── */}
        <h2 className="mb-4 text-lg">Tokens</h2>

        <section className="mb-8 border-b border-line pb-6">
          <SectionLabel className="mb-4">Palette · the only three hues</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PALETTE.map((swatch) => (
              <div key={swatch.name} className="overflow-hidden rounded-sm border border-line">
                <div className={cn('h-16 w-full border-b border-line', swatch.className)} />
                <div className="bg-surface-raised px-3 py-2">
                  <p className="font-mono text-2xs tabular-nums text-heading">--color-{swatch.name}</p>
                  <p className="mt-0.5 text-2xs text-faint">{swatch.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 border-b border-line pb-6">
          <SectionLabel className="mb-4">Semantic · status only, never decoration</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <caption className="sr-only">Semantic colour tokens with their legible text variants</caption>
              <thead>
                <tr>
                  <th scope="col" className="rule-label px-2 py-2 font-normal">Token</th>
                  <th scope="col" className="rule-label px-2 py-2 font-normal">Fill</th>
                  <th scope="col" className="rule-label px-2 py-2 font-normal">On paper</th>
                  <th scope="col" className="rule-label px-2 py-2 font-normal">On ink</th>
                  <th scope="col" className="rule-label px-2 py-2 font-normal">Means</th>
                </tr>
              </thead>
              <tbody>
                {SEMANTIC.map((token) => (
                  <tr key={token.name} className="border-t border-line">
                    <th scope="row" className="px-2 py-2.5 font-mono text-2xs tabular-nums font-normal text-heading">
                      {token.name}
                    </th>
                    <td className="px-2 py-2.5">
                      <span className={cn('inline-block size-5 rounded-xs border border-line', token.fill)} />
                    </td>
                    <td className="px-2 py-2.5">
                      <span data-theme="light" className="rounded-xs bg-paper px-1.5 py-1">
                        <span className={cn('font-mono text-2xs', token.fg)}>{token.name}-deep</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span data-theme="dark" className="rounded-xs bg-ink px-1.5 py-1">
                        <span className={cn('font-mono text-2xs', token.soft)}>{token.name}-soft</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-2xs text-muted">{token.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 border-b border-line pb-6">
          <SectionLabel className="mb-4">Type · ratio 1.25, three families</SectionLabel>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="divide-y divide-line border-y border-line">
              {TYPE_SCALE.map((step) => (
                <div key={step.token} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                  <p className={cn('font-display tracking-tight text-heading', step.token)}>Every paper marked</p>
                  <p className="font-mono text-2xs tabular-nums text-faint">
                    {step.token} · {step.px}px · {step.role}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-sm border border-line bg-surface-raised p-4">
                <p className="rule-label mb-2">Fraunces · display</p>
                <p className="font-display text-lg leading-tight text-heading" style={{ fontVariationSettings: "'wght' 520" }}>
                  Aa 214 / 300
                </p>
                <p className="mt-1 text-2xs text-faint">Headings, large numerals, scores.</p>
              </div>
              <div className="rounded-sm border border-line bg-surface-raised p-4">
                <p className="rule-label mb-2">Bricolage Grotesque · UI and body</p>
                <p className="text-xs leading-relaxed text-body">
                  Objective papers evaluate on submit. Marks, percentile and batch rank publish within fifteen
                  minutes.
                </p>
              </div>
              <div className="rounded-sm border border-line bg-surface-raised p-4">
                <p className="rule-label mb-2">JetBrains Mono · numerals</p>
                <p className="tnum text-sm text-heading">{formatClock(10_380)}</p>
                <p className="tnum mt-1 text-xs text-muted">
                  {formatMarks(214, 300)} · VY-25-0187 · 94.2 pct
                </p>
                <p className="mt-1 text-2xs text-faint">Timer, marks, scores, roll numbers. Always tabular.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 border-b border-line pb-6">
          <SectionLabel className="mb-4">Motion and elevation</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'micro', value: '175ms', use: 'hover, focus, tooltip' },
              { name: 'standard', value: '325ms', use: 'sheets, page entrance' },
              { name: 'expressive', value: '750ms', use: 'hero, score reveal' },
              { name: 'spring', value: '500 / 30', use: 'taps, status change' },
            ].map((motion) => (
              <div key={motion.name} className="rounded-sm border border-line bg-surface-raised p-3">
                <p className="font-mono text-2xs uppercase tracking-widest text-faint">{motion.name}</p>
                <p className="mt-1 font-mono text-xs tabular-nums text-heading">{motion.value}</p>
                <p className="mt-1 text-2xs text-muted">{motion.use}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-md border border-line bg-surface-raised px-4 py-3 shadow-[var(--shadow-float)]">
              <p className="text-2xs text-heading">shadow-float</p>
              <p className="text-2xs text-faint">menus, tooltips, toasts</p>
            </div>
            <div className="rounded-md border border-line bg-surface-raised px-4 py-3 shadow-[var(--shadow-overlay)]">
              <p className="text-2xs text-heading">shadow-overlay</p>
              <p className="text-2xs text-faint">dialogs, sheets</p>
            </div>
            <div className="rounded-md border border-line px-4 py-3">
              <p className="text-2xs text-heading">hairline only</p>
              <p className="text-2xs text-faint">every surface in the page flow</p>
            </div>
          </div>
        </section>

        {/* ── Primitives ─────────────────────────────────────────────── */}
        <h2 className="mb-4 mt-10 text-lg">Primitives</h2>

        <DualSpecimen
          title="Logo"
          note="3×3 grid, one ember cell. Loading walks the lit cell in reading order."
          render={(theme) => (
            <div className="flex flex-wrap items-center gap-6">
              <Logo tone={theme === 'dark' ? 'paper' : 'ink'} size="lg" />
              <Logo tone={theme === 'dark' ? 'paper' : 'ink'} size="md" withName={false} />
              <div className="flex items-center gap-3">
                <Logo tone={theme === 'dark' ? 'paper' : 'ink'} size="md" loading withName={false} />
                <span className="text-2xs text-muted">loading</span>
              </div>
            </div>
          )}
        />

        <DualSpecimen
          title="Button"
          note="primary is ember and may appear once per view. secondary, ghost, danger."
          render={() => (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" icon={<Plus strokeWidth={1.5} />}>
                  Start paper
                </Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger" icon={<Trash2 strokeWidth={1.5} />}>
                  Delete
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="secondary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="lg" trailingIcon={<ArrowRight strokeWidth={1.5} />}>
                  Large with trailing
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" disabled>
                  Disabled primary
                </Button>
                <Button variant="secondary" disabled>
                  Disabled secondary
                </Button>
                <Button variant="primary" loading>
                  Saving
                </Button>
              </div>
            </div>
          )}
        />

        <DualSpecimen
          title="IconButton"
          note="label is required and becomes the accessible name."
          render={() => (
            <div className="flex flex-wrap items-center gap-2">
              <IconButton icon={<Bell strokeWidth={1.5} />} label="Notifications" />
              <IconButton icon={<Search strokeWidth={1.5} />} label="Search" variant="secondary" />
              <IconButton icon={<Check strokeWidth={1.5} />} label="Mark reviewed" pressed />
              <IconButton icon={<X strokeWidth={1.5} />} label="Dismiss" size="sm" />
              <IconButton icon={<Download strokeWidth={1.5} />} label="Download report" variant="inverse" />
              <IconButton icon={<Info strokeWidth={1.5} />} label="Disabled control" disabled />
            </div>
          )}
        />

        <DualSpecimen
          title="Input and Select"
          note="Persistent label, hint, and an error that states what to do. Errors carry a glyph as well as a colour."
          render={() => (
            <div className="flex flex-col gap-4">
              <Input label="Institute email" placeholder="name@vidyutacademy.in" icon={<Search strokeWidth={1.5} />} hint="Student, faculty and office accounts share this field." />
              <Input label="Roll number" defaultValue="VY-25-0187" />
              <Input label="Password" type="password" defaultValue="secret" error="That password does not match this account. Try again, or ask the office to reset it." />
              <Input label="Disabled" placeholder="Not editable here" disabled />
              <Select label="Batch" options={SELECT_OPTIONS} placeholder="Choose a batch" defaultValue="prayas" hint="Changing the batch changes which papers you can sit." />
              <Select label="Track with error" options={SELECT_OPTIONS} placeholder="Choose a track" error="Pick a track before saving." />
            </div>
          )}
        />

        <DualSpecimen
          title="Checkbox and Radio"
          note="A real input under the drawn control: space toggles, the group takes arrow keys."
          render={() => (
            <div className="flex flex-col gap-3">
              <Checkbox
                label="Include evaluated papers"
                description="Turn this off to see only papers still open."
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
              <Checkbox label="Unchecked" />
              <Checkbox label="Indeterminate" indeterminate />
              <Checkbox label="Disabled, checked" checked disabled />
              <fieldset className="mt-2 border-t border-line pt-3">
                <legend className="rule-label mb-2">Marking scheme</legend>
                <div className="flex flex-col gap-2.5">
                  <Radio name="scheme" label="+4 / −1 — JEE Main" defaultChecked />
                  <Radio name="scheme" label="+4 / 0 — NTA foundation" />
                  <Radio name="scheme" label="Variable — JEE Advanced" disabled />
                </div>
              </fieldset>
            </div>
          )}
        />

        <DualSpecimen
          title="Badge"
          note="Every status carries a shape as well as a colour: square, diamond, ring, circle, hollow."
          render={() => (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="answer" shape="square" variant="solid">
                  Answered
                </Badge>
                <Badge tone="review" shape="diamond" variant="solid">
                  Marked
                </Badge>
                <Badge tone="danger" shape="ring" variant="solid">
                  Not answered
                </Badge>
                <Badge tone="info" shape="circle" variant="solid">
                  Live
                </Badge>
                <Badge tone="idle" shape="hollow" variant="solid">
                  Not visited
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="answer" shape="square" variant="soft">
                  Correct
                </Badge>
                <Badge tone="review" shape="diamond" variant="soft">
                  Review
                </Badge>
                <Badge tone="danger" shape="ring" variant="outline">
                  Absent
                </Badge>
                <Badge tone="info" shape="circle" variant="outline">
                  Info
                </Badge>
                <Badge tone="idle" shape="hollow" variant="outline">
                  Muted
                </Badge>
                <Badge tone="ember" shape="none" variant="outline">
                  Primary
                </Badge>
                <Badge tone="neutral" mono shape="none">
                  1,240 received
                </Badge>
              </div>
            </div>
          )}
        />

        <DualSpecimen
          title="Kbd and Tooltip"
          note="A keyboard hint and a supplemental label. A tooltip never replaces a label."
          render={() => (
            <div className="flex flex-wrap items-center gap-5">
              <Kbd>Esc</Kbd>
              <Kbd keys={['⌘', 'K']} />
              <Kbd keys={['Shift', 'Enter']} />
              <Kbd onInk>Tab</Kbd>
              <Tooltip label="Marks publish within 15 minutes of submission">
                <Button variant="secondary" size="sm" icon={<Info strokeWidth={1.5} />}>
                  Why provisional
                </Button>
              </Tooltip>
            </div>
          )}
        />

        <DualSpecimen
          title="Card"
          note="A hairline, not a shadow. Four tones: paper, sunken, ink, bare."
          render={() => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card eyebrow="Paper" title="Full Syllabus Mock 03">
                <p className="text-2xs leading-relaxed text-muted">Raised surface with a hairline border. The default container.</p>
              </Card>
              <Card tone="sunken" eyebrow="Sunken" title="Recessed panel">
                <p className="text-2xs leading-relaxed text-muted">Sits inside a paper surface for list wells and code.</p>
              </Card>
              <Card
                tone="ink"
                eyebrow="Ink"
                title="Structural panel"
                footer={<p className="text-2xs text-(--color-on-ink-faint)">Footer, hairline separated</p>}
              >
                <p className="text-2xs leading-relaxed text-(--color-on-ink)">
                  Paper text on ink. Used for exam headers and the hero.
                </p>
              </Card>
              <Card tone="bare" eyebrow="Bare" title="Grouping only">
                <p className="text-2xs leading-relaxed text-muted">No border, no fill.</p>
              </Card>
            </div>
          )}
        />

        <DualSpecimen
          title="Tabs"
          note="Arrow keys move between tabs. The indicator is a rule, not a pill."
          render={() => (
            <Tabs defaultValue="scheduled">
              <TabList aria-label="Papers">
                <Tab value="scheduled" count={3}>
                  Scheduled
                </Tab>
                <Tab value="open" count={1}>
                  Open
                </Tab>
                <Tab value="evaluated" count={6}>
                  Evaluated
                </Tab>
              </TabList>
              <TabPanel value="scheduled" className="pt-3">
                <p className="text-2xs text-muted">Three papers are scheduled this week, starting 09:00 Saturday.</p>
              </TabPanel>
              <TabPanel value="open" className="pt-3">
                <p className="text-2xs text-muted">Rotational Motion — chapter test closes at 21:00 today.</p>
              </TabPanel>
              <TabPanel value="evaluated" className="pt-3">
                <p className="text-2xs text-muted">Six papers evaluated this term. Best score 214 / 300.</p>
              </TabPanel>
            </Tabs>
          )}
        />

        <DualSpecimen
          title="Skeleton"
          note="Matches the layout it replaces. Static under reduced motion."
          render={() => (
            <div className="flex flex-col gap-4">
              <div className="rounded-sm border border-line p-4">
                <Skeleton.Line className="w-24" />
                <Skeleton.Block className="mt-3 h-6 w-3/5" />
                <Skeleton.Lines lines={3} className="mt-3" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton.Circle className="size-10" />
                <div className="flex-1">
                  <Skeleton.Line className="w-1/3" />
                  <Skeleton.Line className="mt-2 w-1/2" />
                </div>
              </div>
            </div>
          )}
        />

        <DualSpecimen
          title="EmptyState and ErrorState"
          note="Both state what happened and what to do next. No illustrations, no exclamation marks."
          render={() => (
            <div className="flex flex-col gap-4">
              <EmptyState
                icon={<Inbox strokeWidth={1.5} />}
                code="0 papers"
                title="Nothing to sit this week"
                description="Papers appear here once faculty publish them. The next full-syllabus mock is scheduled for 14 November."
                action={
                  <Button variant="secondary" size="sm">
                    See the schedule
                  </Button>
                }
              />
              <ErrorState
                code="E_SNAPSHOT"
                title="Your workspace could not load"
                description="The request failed before it returned. Nothing was changed. Try again, and if it keeps failing the academic office can confirm your enrolment."
                action={
                  <Button variant="secondary" size="sm">
                    Try again
                  </Button>
                }
              />
            </div>
          )}
        />

        <DualSpecimen
          title="ThemeToggle"
          note="Three positions: light, dark, system. Selected state is marked by the raised cell and aria-pressed."
          render={() => (
            <div className="flex flex-wrap items-center gap-4">
              <ThemeToggle />
              <ThemeToggle compact />
              {/* The same control when it sits on Ink: the inverse variant. */}
              <span className="inline-flex items-center rounded-sm bg-ink p-1">
                <ThemeToggle compact onInk />
              </span>
            </div>
          )}
        />

        {/* ── Overlays ───────────────────────────────────────────────── */}
        <h2 className="mb-4 mt-10 text-lg">Overlays</h2>
        <section className="border-b border-line py-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-[580] tracking-tight text-heading">Dialog, Sheet and Toast</h3>
            <p className="text-2xs text-faint">portalled to body · focus trapped · Escape closes · focus returned</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Open dialog
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open sheet
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.success('Paper submitted', 'Marks publish within 15 minutes. You can leave this page.')}
            >
              Success toast
            </Button>
            <Button
              variant="danger"
              onClick={() => toast.error('Submission not saved', 'The connection dropped. Your answers are held locally for two seconds — try again now.')}
            >
              Error toast
            </Button>
          </div>
        </section>

        <section className="py-5">
          <SectionLabel className="mb-4">Anti-patterns · deliberately absent</SectionLabel>
          <ul className="grid grid-cols-1 gap-2 text-2xs text-muted sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Purple or indigo gradients',
              'Glassmorphism on every surface',
              'Rounded cards with identical drop shadows',
              'Three identical cards in a row',
              'Stock photography of students',
              'Pastel dashboard palettes',
              'Emoji as icons',
              'Spinners as the main loading state',
              'Colour as the only status signal',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <X className="mt-0.5 size-3 shrink-0 text-danger-fg" strokeWidth={2} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Submit the paper?"
        description="You have answered 12 of 20 questions. Once submitted, answers cannot be changed."
        confirmLabel="Submit paper"
        onConfirm={() => {
          setDialogOpen(false)
          toast.success('Paper submitted', 'Marks publish within 15 minutes.')
        }}
      >
        <ul className="space-y-1.5">
          <li className="flex items-center justify-between">
            <Badge tone="answer" shape="square" variant="soft">
              Answered
            </Badge>
            <span className="tnum text-2xs text-heading">12</span>
          </li>
          <li className="flex items-center justify-between">
            <Badge tone="review" shape="diamond" variant="soft">
              Marked for review
            </Badge>
            <span className="tnum text-2xs text-heading">3</span>
          </li>
          <li className="flex items-center justify-between">
            <Badge tone="danger" shape="ring" variant="soft">
              Not answered
            </Badge>
            <span className="tnum text-2xs text-heading">5</span>
          </li>
        </ul>
      </Dialog>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Paper palette"
        description="Jump to any question. Shapes mark state, not colour alone."
        footer={
          <Button variant="primary" full onClick={() => setSheetOpen(false)}>
            Return to question 26
          </Button>
        }
      >
        <ol className="grid grid-cols-6 gap-2">
          {Array.from({ length: 24 }).map((_, index) => (
            <li key={index}>
              <button
                type="button"
                className={cn(
                  'grid size-11 place-items-center rounded-xs font-mono text-2xs tabular-nums transition-colors',
                  index < 12
                    ? 'bg-answer text-on-signal'
                    : index < 15
                      ? 'bg-review text-on-signal'
                      : index < 20
                        ? 'border border-danger text-danger-fg'
                        : 'bg-idle text-on-signal',
                )}
                aria-label={`Question ${index + 1}, ${
                  index < 12 ? 'answered' : index < 15 ? 'marked for review' : index < 20 ? 'not answered' : 'not visited'
                }`}
              >
                {index + 1}
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-line pt-3 text-2xs text-muted">
          <ChevronRight className="mr-1 inline size-3" strokeWidth={1.5} aria-hidden="true" />
          Current question 26 is marked with an ember fill in the runner.
        </p>
      </Sheet>
    </div>
  )
}
