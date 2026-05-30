import { useState, useEffect } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useCompanySettings, useUpdateCompanySettings } from '../../hooks/useCompany'
import { useTheme } from '../../hooks/useTheme'

export default function SettingsPage() {
  const { data: settings, isLoading } = useCompanySettings()
  const update = useUpdateCompanySettings()
  const { theme, toggle } = useTheme()

  const [companyName, setCompanyName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName ?? '')
      setReplyToEmail(settings.replyToEmail ?? '')
    }
  }, [settings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    await update.mutateAsync({
      companyName: companyName.trim() || null,
      replyToEmail: replyToEmail.trim() || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={`relative flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow transition-transform duration-300 ${
                theme === 'dark' ? 'translate-x-9' : 'translate-x-1'
              }`}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">

            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-5">
              <h2 className={sectionLabel}>Company</h2>

              <div>
                <label className={fieldLabel}>Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={settings?.name ?? 'Your company name'}
                  className={inputClass}
                />
                <p className={hint}>Shown as the sender name on all outgoing emails.</p>
              </div>

              <div>
                <label className={fieldLabel}>Reply-to email</label>
                <input
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className={inputClass}
                />
                <p className={hint}>
                  When clients hit reply, their response goes here. Use your business email address.
                </p>
              </div>
            </section>

            {update.error instanceof Error && (
              <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">
                {update.error.message}
              </p>
            )}

            {saved && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 normal-case tracking-normal">
                Settings saved.
              </p>
            )}

            <button
              type="submit"
              disabled={update.isPending}
              className="w-full rounded-xl bg-gray-900 dark:bg-gray-100 py-3.5 text-sm font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}

        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className={`${sectionLabel} mb-2`}>Bank account</h2>
          <p className={`${hint} normal-case tracking-normal`}>Bank account details and payment settings — coming soon.</p>
        </section>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'
const sectionLabel = 'text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'
const fieldLabel = 'mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'
const hint = 'mt-1 text-xs text-gray-400 dark:text-gray-500'

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
