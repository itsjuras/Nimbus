import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateInvoiceSchema, type CreateInvoiceRequest, type InvoiceStatus } from '@nimbus/shared'
import { useInvoices, useCreateInvoice, useSendInvoice } from '../../hooks/useInvoices'
import { useClients } from '../../hooks/useClients'

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-gray-200 text-gray-700',
  paid: 'bg-gray-900 text-white',
  void: 'bg-gray-100 text-gray-400',
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function InvoicesPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: invoices, isLoading } = useInvoices()
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
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : 'New invoice'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900">New invoice</h2>

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
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Line items</h3>
            {errors.lineItems?.root && (
              <p className="mb-2 text-xs text-gray-600">{errors.lineItems.root.message}</p>
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
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unitAmountCents: 0 })}
              className="mt-3 text-sm font-medium text-gray-900 hover:underline"
            >
              + Add line item
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Enter amounts in cents — e.g. $150.00 = 15000
          </p>

          {createInvoice.error && (
            <p className="mt-3 text-sm text-gray-700">
              {createInvoice.error instanceof Error ? createInvoice.error.message : 'Failed to create invoice'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create invoice'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : invoices?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No invoices yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices?.map((invoice) => {
                const client = clients?.find((c) => c.id === invoice.clientId)
                const total = invoice.lineItems.reduce(
                  (sum, item) => sum + item.quantity * item.unitAmountCents,
                  0,
                )
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {client?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {formatCents(total, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => sendInvoice.mutate(invoice.id)}
                          disabled={sendInvoice.isPending}
                          className="mr-3 font-medium text-gray-900 hover:underline disabled:opacity-50"
                        >
                          Send
                        </button>
                      )}
                      {invoice.stripeInvoiceUrl && (
                        <a
                          href={invoice.stripeInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:underline"
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
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200'

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
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-gray-600">{error}</p>}
    </div>
  )
}
