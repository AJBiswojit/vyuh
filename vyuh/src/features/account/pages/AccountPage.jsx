import { Check, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Card } from '@/shared/ui/Card.jsx'
import { useTheme } from '@/app/providers/ThemeProvider.jsx'
import { useLogout } from '@/features/auth/hooks/useSession.js'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { useUiStore } from '@/shared/store/uiStore.js'
import { roleLabel } from '@/shared/lib/roles.js'
import { isMockMode } from '@/shared/lib/services.js'
import { cn } from '@/shared/lib/cn.js'

/**
 * Account and preferences. Theme and density are the only settings this build
 * exposes, and both are client state persisted to localStorage — no network
 * round trip for a preference.
 */
export function AccountPage() {
  useDocumentTitle('Account')
  const user = useSessionStore((state) => state.user)
  const { mode, setMode } = useTheme()
  const { logout, isPending: loggingOut } = useLogout()
  const density = useUiStore((state) => state.density)
  const setDensity = useUiStore((state) => state.setDensity)

  const themes = [
    { key: 'light', label: 'Paper', description: 'Ink text on paper surfaces', icon: Sun },
    { key: 'dark', label: 'Ink', description: 'Paper text on ink surfaces', icon: Moon },
  ]

  return (
    <>
      <PageHeader
        eyebrow={roleLabel(user?.role ?? 'student')}
        title="Account and preferences"
        description="Identity comes from the academic office and cannot be edited here. Appearance is yours."
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card eyebrow="Identity" title={user?.name ?? '—'}>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="rule-label">Institute email</dt>
              <dd className="mt-1 break-all text-xs text-heading">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="rule-label">Role</dt>
              <dd className="mt-1">
                <Badge tone="neutral" variant="outline" className="uppercase">{roleLabel(user?.role ?? 'student')}</Badge>
              </dd>
            </div>
            <div>
              <dt className="rule-label">Joined</dt>
              <dd className="mt-1 font-mono text-xs tabular-nums text-heading">{user?.joinedAt ?? '—'}</dd>
            </div>
            <div>
              <dt className="rule-label">Centre</dt>
              <dd className="mt-1 text-xs text-heading">Jaydev Vihar, Bhubaneswar</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-line pt-4 text-2xs leading-relaxed text-faint">
            A name or email change is made by the academic office so that marks and certificates stay attached to
            one record. Phone +91 674 250 1180, Monday to Saturday.
          </p>
        </Card>

        <div className="flex flex-col gap-5">
          <Card eyebrow="Appearance" title="Theme">
            <div className="grid grid-cols-2 gap-2">
              {themes.map((option) => {
                const active = mode === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setMode(option.key)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-[5.5rem] flex-col items-start gap-2 rounded-sm border p-3 text-left transition-colors',
                      active ? 'border-ember bg-ember-wash' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <option.icon className={cn('size-4', active ? 'text-ember-press' : 'text-muted')} strokeWidth={1.5} aria-hidden="true" />
                      {active ? <Check className="size-3.5 text-ember-press" strokeWidth={2} aria-hidden="true" /> : null}
                    </span>
                    <span className={cn('text-xs font-[560]', active ? 'text-ember-press' : 'text-heading')}>{option.label}</span>
                    <span className="text-2xs leading-snug text-muted">{option.description}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card eyebrow="Reading" title="Density">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Layout density">
              {[
                { key: 'comfortable', label: 'Comfortable' },
                { key: 'compact', label: 'Compact' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDensity(/** @type {any} */ (option.key))}
                  aria-pressed={density === option.key}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-3 text-xs transition-colors',
                    density === option.key ? 'border-heading text-heading' : 'border-line text-muted hover:border-line-strong',
                  )}
                >
                  <Monitor className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-2xs text-faint">
              Compact tightens list rows to 40px. Body text never drops below 14px, and exam keypad targets stay 56px.
            </p>
          </Card>

          <Card eyebrow="Session" title="Sign out of this device">
            <p className="text-xs leading-relaxed text-muted">
              {isMockMode
                ? 'This demo keeps your session in this browser for eight hours. Signing out clears it immediately and returns to the landing page.'
                : 'Signing out ends this session on this browser. Papers in progress keep their server-side clock and can be resumed from another device.'}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              icon={<LogOut strokeWidth={1.5} />}
              onClick={() => logout()}
              loading={loggingOut}
            >
              Sign out
            </Button>
          </Card>
        </div>
      </div>
    </>
  )
}
