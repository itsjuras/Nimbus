import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateInvoiceSchema, type CreateInvoiceRequest, type InvoiceStatus } from '@nimbus/shared'
import { useInvoices, useCreateInvoice, useSendInvoice } from '../../hooks/useInvoices'
import { useClients } from '../../hooks/useClients'
import { useTheme } from '../../hooks/useTheme'

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  sent: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  paid: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  void: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function InvoicesPage() {
  const { theme, toggle } = useTheme()
  const [showForm, setShowForm] = useState(false)
  const { data: invoices, isLoading, isError } = useInvoices()
  const { data: clients } = useClients()
  const createInvoice = useCreateInvoice()
  const sendInvoice = useSendInvoice()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceRequest>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: { currency: 'usd', lineItems: [{ description: '', quantity: 1, unitAmountCents: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })

  async function onSubmit(data: CreateInvoiceRequest) {
    await createInvoice.mutateAsync(data)
    reset()
    setShowForm(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
          >
            {showForm ? 'Cancel' : 'New invoice'}
          </button>
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

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">New invoice</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Client *" error={errors.clientId?.message}>
              <select {...register('clientId')} className={inputClass}>
                <option value="">Select a client…</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Due date" error={errors.dueDate?.message}>
              <input {...register('dueDate')} type="datetime-local" className={inputClass} />
            </Field>

            <Field label="Currency" error={errors.currency?.message}>
              <select {...register('currency')} className={inputClass}>
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
                <option value="aud">AUD</option>
                <option value="cad">CAD</option>
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Line items</h3>
            {errors.lineItems?.root && (
              <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal">{errors.lineItems.root.message}</p>
            )}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3">
                  <input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="Description"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className={`${inputClass} w-20`}
                  />
                  <input
                    {...register(`lineItems.${index}.unitAmountCents`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Amount (cents)"
                    className={`${inputClass} w-36`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unitAmountCents: 0 })}
              className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal"
            >
              + Add line item
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">
            Enter amounts in cents — e.g. $150.00 = 15000
          </p>

          {createInvoice.error && (
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 normal-case tracking-normal">
              {createInvoice.error instanceof Error ? createInvoice.error.message : 'Failed to create invoice'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create invoice'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent" />
        </div>
      ) : isError || invoices?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">No invoices yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {invoices?.map((invoice) => {
                const client = clients?.find((c) => c.id === invoice.clientId)
                const total = invoice.lineItems.reduce(
                  (sum, item) => sum + item.quantity * item.unitAmountCents,
                  0,
                )
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                      {client?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 normal-case tracking-normal">
                      {formatCents(total, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${STATUS_BADGE[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => sendInvoice.mutate(invoice.id)}
                          disabled={sendInvoice.isPending}
                          className="mr-3 font-medium text-gray-900 dark:text-gray-100 hover:underline disabled:opacity-50"
                        >
                          Send
                        </button>
                      )}
                      {invoice.stripeInvoiceUrl && (
                        <a
                          href={invoice.stripeInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-gray-900 dark:text-gray-100 hover:underline"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm normal-case tracking-normal text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error: string | undefined
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal">{error}</p>}
    </div>
  )
}

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
