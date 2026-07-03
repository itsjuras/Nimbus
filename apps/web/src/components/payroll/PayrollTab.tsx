import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePayrollPreview, useRunPayroll, usePayrollRuns } from '../../hooks/usePayroll'
import type { PayrollRun, PayrollRunStatus } from '@nimbus/shared'

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const RUN_BADGE: Record<PayrollRunStatus, string> = {
  funding: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  paying: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  paid: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  failed: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
}

const RUN_LABEL: Record<PayrollRunStatus, string> = {
  funding: 'Debiting bank',
  paying: 'Sending',
  paid: 'Paid',
  failed: 'Failed',
}

export function PayrollTab({ from, to }: { from: string; to: string }) {
  // Wage entries use date-only periods; trim the ISO timestamps down
  const fromDate = from.slice(0, 10)
  const toDate = to.slice(0, 10)

  const { data: preview, isLoading: previewLoading } = usePayrollPreview(fromDate, toDate)
  const { data: runs = [] } = usePayrollRuns()
  const runPayroll = useRunPayroll()
  const [confirming, setConfirming] = useState(false)

  const ready = Boolean(preview?.onboardingComplete && preview?.companyBankSaved)
  const payable = preview?.payableCents ?? 0
  const linesWithoutBank = preview?.lines.filter((l) => !l.hasBank) ?? []

  async function handleRun() {
    try {
      await runPayroll.mutateAsync({ from: fromDate, to: toDate })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Unpaid wages preview */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Unpaid Wages
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            {formatDate(from)} – {formatDate(to)}
          </p>
        </div>

        {previewLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : !preview || preview.lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 normal-case tracking-normal">
              No unpaid wages this period. Wages logged on job completion show up here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {preview.lines.map((line, i) => (
              <div
                key={line.profileId}
                className={`flex items-center justify-between gap-4 px-5 py-4 ${
                  i < preview.lines.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal truncate">
                    {line.profileName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                    {line.entryCount} wage {line.entryCount === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                    {formatMoney(line.totalCents)}
                  </span>
                  {line.hasBank ? (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      Bank ✓
                    </span>
                  ) : (
                    <Link
                      to={`/owner/crew/${line.profileId}`}
                      className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 hover:underline"
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      No bank
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Footer: setup warnings + pay button */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 space-y-3">
              {!preview.onboardingComplete && (
                <p className="text-xs text-amber-700 dark:text-amber-300 normal-case tracking-normal">
                  Business verification required before running payroll —{' '}
                  <Link to="/owner/settings" className="underline">finish it in Settings</Link>.
                </p>
              )}
              {!preview.companyBankSaved && (
                <p className="text-xs text-amber-700 dark:text-amber-300 normal-case tracking-normal">
                  No payroll bank account on file —{' '}
                  <Link to="/owner/settings" className="underline">add one in Settings</Link>.
                </p>
              )}
              {linesWithoutBank.length > 0 && payable > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 normal-case tracking-normal">
                  {linesWithoutBank.length} crew member{linesWithoutBank.length === 1 ? '' : 's'} without bank details will be skipped and stay unpaid.
                </p>
              )}

              {runPayroll.error instanceof Error && (
                <p className="text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">{runPayroll.error.message}</p>
              )}

              {confirming ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRun}
                    disabled={runPayroll.isPending}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {runPayroll.isPending ? 'Sending…' : `Confirm — debit ${formatMoney(payable)}`}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={runPayroll.isPending}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 normal-case tracking-normal"
                  >
                    Cancel
                  </button>
                  <p className="w-full text-[11px] text-gray-400 dark:text-gray-500 normal-case tracking-normal">
                    By confirming you authorize Nimbus to debit your bank account for {formatMoney(payable)}. Crew are paid by direct deposit once the debit clears (typically 2–5 business days).
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  disabled={!ready || payable === 0}
                  className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  Run Payroll · {formatMoney(payable)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Run history */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Payroll History
        </h2>
        {runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 normal-case tracking-normal">No payroll runs yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RunCard({ run }: { run: PayrollRun }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
            {formatDate(run.periodFrom)} – {formatDate(run.periodTo)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            {run.items.length} crew · run {formatDate(run.createdAt)}
            {run.failureMessage && ` · ${run.failureMessage}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
            {formatMoney(run.totalCents)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RUN_BADGE[run.status]}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {RUN_LABEL[run.status]}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {run.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal truncate">
                  {item.profileName ?? 'Unknown'}
                </p>
                {item.failureMessage && (
                  <p className="text-xs text-red-500 dark:text-red-400 normal-case tracking-normal">{item.failureMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                  {formatMoney(item.amountCents)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'paid'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : item.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
