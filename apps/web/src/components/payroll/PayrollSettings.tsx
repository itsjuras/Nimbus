import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SaveCompanyBankSchema, type SaveCompanyBankRequest } from '@nimbus/shared'
import { useConnectStatus, useStartOnboarding, useSaveCompanyBank } from '../../hooks/usePayroll'

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'
const sectionLabel = 'text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'
const fieldLabel = 'mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'
const hint = 'mt-1 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal'

export function PayrollSettings() {
  const { data: status, isLoading } = useConnectStatus()
  const startOnboarding = useStartOnboarding()
  const saveBank = useSaveCompanyBank()
  const [editingBank, setEditingBank] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaveCompanyBankRequest>({
    resolver: zodResolver(SaveCompanyBankSchema),
    defaultValues: { accountType: 'checking' },
  })

  async function handleConnect() {
    const { url } = await startOnboarding.mutateAsync()
    window.location.href = url
  }

  async function onSaveBank(data: SaveCompanyBankRequest) {
    await saveBank.mutateAsync(data)
    reset()
    setEditingBank(false)
  }

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-6">
      <h2 className={sectionLabel}>Payments &amp; payroll</h2>

      {/* Step 1: Stripe Connect identity verification */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
              Business verification
            </p>
            <p className={hint}>
              One-time identity check with Stripe, required before Nimbus can move money on your behalf.
            </p>
          </div>
          {status?.onboardingComplete ? (
            <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Verified
            </span>
          ) : (
            <button
              onClick={handleConnect}
              disabled={startOnboarding.isPending}
              className="shrink-0 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              {startOnboarding.isPending
                ? 'Opening…'
                : status?.connected
                  ? 'Resume verification'
                  : 'Start verification'}
            </button>
          )}
        </div>
        {startOnboarding.error instanceof Error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">
            {startOnboarding.error.message}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Step 2: company funding bank */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
              Payroll bank account
            </p>
            <p className={hint}>The account payroll is paid from. Debited each time you run payroll.</p>
          </div>
          {status?.companyBankLast4 && !editingBank && (
            <button
              onClick={() => setEditingBank(true)}
              className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 normal-case tracking-normal"
            >
              Replace
            </button>
          )}
        </div>

        {status?.companyBankLast4 && !editingBank ? (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
            {status.companyBankName ?? 'Bank account'} ····{status.companyBankLast4}
            <span className="ml-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Connected
            </span>
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSaveBank)} className="mt-4 space-y-4">
            <div>
              <label className={fieldLabel}>Account holder name</label>
              <input {...register('accountHolderName')} placeholder="Acme Cleaning LLC" className={inputClass} />
              {errors.accountHolderName && <p className={hint}>{errors.accountHolderName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel}>Routing number</label>
                <input {...register('routingNumber')} inputMode="numeric" placeholder="110000000" className={inputClass} />
                {errors.routingNumber && <p className={hint}>{errors.routingNumber.message}</p>}
              </div>
              <div>
                <label className={fieldLabel}>Account number</label>
                <input {...register('accountNumber')} inputMode="numeric" placeholder="000123456789" className={inputClass} />
                {errors.accountNumber && <p className={hint}>{errors.accountNumber.message}</p>}
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Account type</label>
              <select {...register('accountType')} className={inputClass}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            {saveBank.error instanceof Error && (
              <p className="text-xs text-red-600 dark:text-red-400 normal-case tracking-normal">{saveBank.error.message}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                {isSubmitting ? 'Saving…' : 'Save bank account'}
              </button>
              {editingBank && (
                <button
                  type="button"
                  onClick={() => { reset(); setEditingBank(false) }}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <p className={hint}>
              Account details are sent directly to Stripe and never stored by Nimbus.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
