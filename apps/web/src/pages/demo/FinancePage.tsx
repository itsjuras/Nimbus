import { useState } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { useTheme } from '../../hooks/useTheme'

type Period = 'this_month' | 'last_month' | 'this_year' | 'all_time'
type Tab = 'expenses' | 'wages'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
]

const SUMMARY: Record<Period, { revenue: number; supplies: number; wages: number }> = {
  this_month: { revenue: 398000, supplies: 18400, wages: 64000 },
  last_month: { revenue: 421000, supplies: 22100, wages: 68500 },
  this_year:  { revenue: 2840000, supplies: 143000, wages: 487000 },
  all_time:   { revenue: 5620000, supplies: 291000, wages: 934000 },
}

type ExpenseStatus = 'pending' | 'approved' | 'rejected'

interface DemoExpense {
  id: string
  description: string
  amountCents: number
  category: string
  status: ExpenseStatus
  submittedBy: string
  date: string
}

interface DemoWage {
  id: string
  profileName: string
  payType: 'hourly' | 'per_job'
  totalCents: number
  date: string
  note: string
}

const EXPENSES: DemoExpense[] = [
  { id: 'e1', description: 'Cleaning supplies — Costco', amountCents: 8400,  category: 'supplies', status: 'pending',  submittedBy: 'Tom Harris',    date: 'May 28, 2026' },
  { id: 'e2', description: 'Mop heads × 6',              amountCents: 3200,  category: 'supplies', status: 'pending',  submittedBy: 'Maria Santos',  date: 'May 27, 2026' },
  { id: 'e3', description: 'Industrial vacuums × 2',     amountCents: 6800,  category: 'equipment',status: 'approved', submittedBy: 'James Okafor',  date: 'May 20, 2026' },
  { id: 'e4', description: 'Disinfectant spray × 12',    amountCents: 4200,  category: 'supplies', status: 'approved', submittedBy: 'Tom Harris',    date: 'May 15, 2026' },
  { id: 'e5', description: 'Fuel — work van',            amountCents: 9100,  category: 'transport',status: 'rejected', submittedBy: 'Maria Santos',  date: 'May 10, 2026' },
]

const WAGES: DemoWage[] = [
  { id: 'w1', profileName: 'Tom Harris',   payType: 'per_job', totalCents: 12000, date: 'May 28, 2026', note: 'Apex Financial — evening clean' },
  { id: 'w2', profileName: 'Maria Santos', payType: 'hourly',  totalCents: 9600,  date: 'May 27, 2026', note: '4 hrs @ $24/hr' },
  { id: 'w3', profileName: 'James Okafor', payType: 'per_job', totalCents: 15000, date: 'May 25, 2026', note: 'Metro Fitness — deep clean' },
  { id: 'w4', profileName: 'Tom Harris',   payType: 'hourly',  totalCents: 14400, date: 'May 22, 2026', note: '6 hrs @ $24/hr' },
  { id: 'w5', profileName: 'Maria Santos', payType: 'per_job', totalCents: 12000, date: 'May 20, 2026', note: 'Riverside School — standard clean' },
]

function fmt(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const STATUS_BADGE: Record<ExpenseStatus, string> = {
  pending:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

export default function DemoFinancePage() {
  const { theme, toggle } = useTheme()
  const [period, setPeriod] = useState<Period>('this_month')
  const [tab, setTab] = useState<Tab>('expenses')
  const [expenses, setExpenses] = useState(EXPENSES)

  const summary = SUMMARY[period]!
  const profit = summary.revenue - summary.supplies - summary.wages

  function approve(id: string) {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: 'approved' } : e))
  }
  function reject(id: string) {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: 'rejected' } : e))
  }

  const pending  = expenses.filter((e) => e.status === 'pending')
  const reviewed = expenses.filter((e) => e.status !== 'pending')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <button onClick={toggle} aria-label="Toggle dark mode" className={`relative flex h-8 w-16 shrink-0 items-center rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <span className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-9' : 'translate-x-1'}`}>
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
              period === p.value
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Revenue',       value: summary.revenue,   color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Supply Costs',  value: summary.supplies,  color: 'text-red-600 dark:text-red-400' },
          { label: 'Wages',         value: summary.wages,     color: 'text-red-600 dark:text-red-400' },
          { label: 'Profit',        value: profit,            color: profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 w-fit">
        {(['expenses', 'wages'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === t
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'expenses' ? (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Pending approval ({pending.length})</p>
              <div className="space-y-2">
                {pending.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal truncate">{e.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{e.submittedBy} · {e.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(e.amountCents)}</span>
                      <button onClick={() => approve(e.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-700 transition-colors">Approve</button>
                      <button onClick={() => reject(e.id)}  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Reviewed</p>
              <div className="space-y-2">
                {reviewed.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal truncate">{e.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{e.submittedBy} · {e.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(e.amountCents)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest ${STATUS_BADGE[e.status]}`}>{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-3 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">Wages are logged automatically when jobs are completed.</p>
          {WAGES.map((w) => (
            <div key={w.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{w.profileName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{w.note} · {w.date}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{fmt(w.totalCents)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
