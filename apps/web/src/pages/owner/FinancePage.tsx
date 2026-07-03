import { useState, useMemo } from 'react'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { Modal } from '../../components/ui/Modal'
import { useFinanceSummary } from '../../hooks/useFinance'
import { useExpenses, useReviewExpense, useDeleteExpense, useCreateExpense } from '../../hooks/useExpenses'
import { useWageEntries, useDeleteWageEntry } from '../../hooks/useWages'
import { useTheme } from '../../hooks/useTheme'
import { PayrollTab } from '../../components/payroll/PayrollTab'
import type { Expense, WageEntry } from '@nimbus/shared'

type Period = 'this_month' | 'last_month' | 'this_year' | 'all_time'
type Tab = 'expenses' | 'wages' | 'payroll'

function getPeriodRange(period: Period): { from: string; to: string; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (period === 'this_month') {
    return {
      from: new Date(y, m, 1).toISOString(),
      to: new Date(y, m + 1, 0, 23, 59, 59).toISOString(),
      label: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
    }
  }
  if (period === 'last_month') {
    const lm = m === 0 ? 11 : m - 1
    const ly = m === 0 ? y - 1 : y
    return {
      from: new Date(ly, lm, 1).toISOString(),
      to: new Date(ly, lm + 1, 0, 23, 59, 59).toISOString(),
      label: new Date(ly, lm, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
    }
  }
  if (period === 'this_year') {
    return {
      from: new Date(y, 0, 1).toISOString(),
      to: new Date(y, 11, 31, 23, 59, 59).toISOString(),
      label: String(y),
    }
  }
  return {
    from: new Date(2020, 0, 1).toISOString(),
    to: new Date(y + 1, 0, 1).toISOString(),
    label: 'All Time',
  }
}

function formatMoney(cents: number) {
  const abs = Math.abs(cents)
  const formatted = (abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return cents < 0 ? `-$${formatted}` : `$${formatted}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FinancePage() {
  const [period, setPeriod] = useState<Period>('this_month')
  const [tab, setTab] = useState<Tab>('expenses')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const { theme, toggle } = useTheme()

  const { from, to, label } = useMemo(() => getPeriodRange(period), [period])

  const { data: summary, isLoading: summaryLoading } = useFinanceSummary(from, to)
  const { data: expenses = [] } = useExpenses()
  const { data: wages = [] } = useWageEntries()
  const reviewExpense = useReviewExpense()
  const deleteExpense = useDeleteExpense()
  const deleteWage = useDeleteWageEntry()

  // Filter to selected period
  const periodExpenses = useMemo(
    () => expenses.filter((e) => e.createdAt >= from && e.createdAt <= to),
    [expenses, from, to],
  )
  const periodWages = useMemo(
    () => wages.filter((w) => w.periodDate + 'T00:00:00.000Z' >= from && w.periodDate + 'T23:59:59.999Z' <= to),
    [wages, from, to],
  )

  const pendingExpenses = periodExpenses.filter((e) => e.status === 'pending')
  const reviewedExpenses = periodExpenses.filter((e) => e.status !== 'pending')

  const PERIODS: { value: Period; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all_time', label: 'All Time' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
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

      {/* Period selector */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              period === p.value
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">{label}</span>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Revenue"
          value={summaryLoading ? null : (summary?.revenueCents ?? 0)}
          color="green"
        />
        <SummaryCard
          label="Supply Costs"
          value={summaryLoading ? null : (summary?.supplyCostsCents ?? 0)}
          color="red"
          negate
        />
        <SummaryCard
          label="Wage Costs"
          value={summaryLoading ? null : (summary?.wageCostsCents ?? 0)}
          color="red"
          negate
        />
        <SummaryCard
          label="Net Profit"
          value={summaryLoading ? null : (summary?.profitCents ?? 0)}
          color={(summary?.profitCents ?? 0) >= 0 ? 'green' : 'red'}
          bold
        />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 max-w-md">
        {(['expenses', 'wages', 'payroll'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === t
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Supply Expenses
            </h2>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Add Expense
            </button>
          </div>

          {pendingExpenses.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Pending Approval ({pendingExpenses.length})
              </p>
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
                {pendingExpenses.map((expense, i) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    showBorder={i < pendingExpenses.length - 1}
                    onApprove={() => reviewExpense.mutate({ id: expense.id, status: 'approved' })}
                    onReject={() => reviewExpense.mutate({ id: expense.id, status: 'rejected' })}
                    onDelete={() => deleteExpense.mutate(expense.id)}
                    isPending
                  />
                ))}
              </div>
            </div>
          )}

          {reviewedExpenses.length === 0 && pendingExpenses.length === 0 ? (
            <EmptyState message="No expenses this period." />
          ) : reviewedExpenses.length > 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {reviewedExpenses.map((expense, i) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  showBorder={i < reviewedExpenses.length - 1}
                  onDelete={() => deleteExpense.mutate(expense.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Wages tab */}
      {tab === 'wages' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Wage Entries
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">Logged from job detail pages</p>
          </div>

          {periodWages.length === 0 ? (
            <EmptyState message="No wage entries this period." />
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {periodWages.map((entry, i) => (
                <WageRow
                  key={entry.id}
                  entry={entry}
                  showBorder={i < periodWages.length - 1}
                  onDelete={() => deleteWage.mutate(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payroll tab */}
      {tab === 'payroll' && <PayrollTab from={from} to={to} />}

      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
      />
    </div>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  negate = false,
  bold = false,
}: {
  label: string
  value: number | null
  color: 'green' | 'red'
  negate?: boolean
  bold?: boolean
}) {
  const display = value === null ? '—' : negate ? formatMoney(-value) : formatMoney(value)
  const colorClass =
    value === null
      ? 'text-gray-400 dark:text-gray-500'
      : color === 'green'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-500 dark:text-red-400'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
        {label}
      </p>
      <p className={`text-2xl font-bold normal-case tracking-normal ${colorClass} ${bold ? 'text-3xl' : ''}`}>
        {display}
      </p>
    </div>
  )
}

// ── Expense row ───────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  showBorder,
  onApprove,
  onReject,
  onDelete,
  isPending = false,
}: {
  expense: Expense
  showBorder: boolean
  onApprove?: () => void
  onReject?: () => void
  onDelete: () => void
  isPending?: boolean
}) {
  const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    approved: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  }

  return (
    <div className={`px-5 py-4 ${showBorder ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal truncate">
            {expense.description}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            {expense.submittedByName ?? 'Unknown'} · {formatDate(expense.createdAt)}
            {expense.category !== 'supplies' && ` · ${expense.category}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
            {formatMoney(expense.amountCents)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge[expense.status] ?? ''}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {expense.status}
          </span>
        </div>
      </div>
      {isPending && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onApprove}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="rounded-lg bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Reject
          </button>
          <button
            onClick={onDelete}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 normal-case tracking-normal"
          >
            Delete
          </button>
        </div>
      )}
      {!isPending && (
        <div className="mt-1 flex justify-end">
          <button
            onClick={onDelete}
            className="text-xs text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 normal-case tracking-normal"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ── Wage row ──────────────────────────────────────────────────────────────────

function WageRow({
  entry,
  showBorder,
  onDelete,
}: {
  entry: WageEntry
  showBorder: boolean
  onDelete: () => void
}) {
  return (
    <div className={`px-5 py-4 ${showBorder ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
            {entry.profileName ?? 'Unknown'}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            {entry.payType === 'hourly'
              ? `${entry.hours ?? '?'} hrs × ${formatMoney(entry.rateCents)}/hr`
              : `Per job · ${formatMoney(entry.rateCents)}`}
            {' · '}{formatDate(entry.periodDate)}
            {entry.notes && ` · ${entry.notes}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
            {formatMoney(entry.totalCents)}
          </span>
          {entry.payrollRunId ? (
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Paid
            </span>
          ) : (
            <button
              onClick={onDelete}
              className="text-xs text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 normal-case tracking-normal"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Expense modal ─────────────────────────────────────────────────────────

function AddExpenseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'supplies' | 'other'>('supplies')
  const createExpense = useCreateExpense()

  function reset() {
    setAmountStr('')
    setDescription('')
    setCategory('supplies')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dollars = parseFloat(amountStr)
    if (!description.trim() || isNaN(dollars) || dollars <= 0) return
    try {
      await createExpense.mutateAsync({
        amountCents: Math.round(dollars * 100),
        description: description.trim(),
        category,
      })
      handleClose()
    } catch {
      // error shown via mutation state
    }
  }

  return (
    <Modal open={visible} onClose={handleClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Amount ($) *">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </Field>
        <Field label="Description *">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cleaning supplies, mop heads…"
            className={inputClass}
          />
        </Field>
        <Field label="Category">
          <div className="flex gap-2">
            {(['supplies', 'other'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 rounded-lg border py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  category === cat
                    ? 'bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-400'
                }`}
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </Field>

        {createExpense.error && (
          <p className="text-sm text-red-600 dark:text-red-400 normal-case tracking-normal">
            {createExpense.error instanceof Error ? createExpense.error.message : 'Failed to add expense'}
          </p>
        )}

        <button
          type="submit"
          disabled={createExpense.isPending || !description.trim() || !amountStr}
          className="w-full rounded-lg bg-gray-900 dark:bg-gray-100 py-2.5 text-sm font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {createExpense.isPending ? 'Saving…' : 'Save Expense'}
        </button>
      </form>
    </Modal>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
      <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">{message}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
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
