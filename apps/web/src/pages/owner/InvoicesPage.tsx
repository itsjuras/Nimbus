import { useState } from 'react'
import { z } from 'zod'
import { SidebarToggle } from '../../components/ui/SidebarToggle'
import { PickerModal, PickerField } from '../../components/ui/PickerModal'
import { DatePickerModal } from '../../components/ui/DatePickerModal'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type InvoiceStatus } from '@nimbus/shared'
import { useInvoices, useCreateInvoice, useSendInvoice } from '../../hooks/useInvoices'
import { useClients } from '../../hooks/useClients'
import { useTheme } from '../../hooks/useTheme'

const CURRENCIES = [
  { id: 'usd', label: 'USD', sublabel: 'US Dollar' },
  { id: 'cad', label: 'CAD', sublabel: 'Canadian Dollar' },
  { id: 'eur', label: 'EUR', sublabel: 'Euro' },
  { id: 'gbp', label: 'GBP', sublabel: 'British Pound' },
  { id: 'aud', label: 'AUD', sublabel: 'Australian Dollar' },
]

// Local form type uses dollar amounts; we convert to cents on submit
const InvoiceFormSchema = z.object({
  clientId: z.string().uuid('Select a client'),
  jobId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  currency: z.string().length(3).default('usd'),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().int().positive('Must be at least 1'),
    unitAmountDollars: z.number().positive('Must be greater than 0'),
  })).min(1, 'Add at least one line item'),
})
type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>

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
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const { data: invoices, isLoading, isError } = useInvoices()
  const { data: clients } = useClients()
  const createInvoice = useCreateInvoice()
  const sendInvoice = useSendInvoice()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: { currency: 'usd', lineItems: [{ description: '', quantity: 1, unitAmountDollars: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })

  const selectedClientId = watch('clientId')
  const selectedCurrency = watch('currency')
  const selectedDueDate = watch('dueDate')
  const lineItemValues = watch('lineItems')
  const selectedClient = clients?.find((c) => c.id === selectedClientId)
  const selectedCurrencyOption = CURRENCIES.find((c) => c.id === selectedCurrency)
  const invoiceTotalCents = lineItemValues.reduce(
    (sum, item) => sum + Math.round((item.quantity || 0) * (item.unitAmountDollars || 0) * 100),
    0,
  )

  async function onSubmit(data: InvoiceFormValues) {
    await createInvoice.mutateAsync({
      clientId: data.clientId,
      ...(data.jobId ? { jobId: data.jobId } : {}),
      ...(data.dueDate ? { dueDate: data.dueDate } : {}),
      currency: data.currency,
      lineItems: data.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitAmountCents: Math.round(item.unitAmountDollars * 100),
      })),
    })
    reset()
    setShowForm(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold uppercase text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200"
          >
            {showForm ? 'Cancel' : 'New invoice'}
          </button>
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

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">New invoice</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <PickerField
              label="Client *"
              placeholder="+ Select client"
              selectedLabel={selectedClient?.name ?? null}
              selectedSublabel={selectedClient?.contactEmail}
              onOpen={() => setShowClientPicker(true)}
              onClear={() => setValue('clientId', '')}
            />
            {errors.clientId && <p className={`sm:col-span-3 -mt-3 ${errorText}`}>{errors.clientId.message}</p>}

            <PickerField
              label="Due date"
              placeholder="+ Set due date"
              selectedLabel={
                selectedDueDate
                  ? new Date(`${selectedDueDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : null
              }
              onOpen={() => setShowDatePicker(true)}
              onClear={() => setValue('dueDate', undefined)}
            />

            <PickerField
              label="Currency"
              placeholder="Select currency"
              selectedLabel={selectedCurrencyOption?.label ?? null}
              selectedSublabel={selectedCurrencyOption?.sublabel}
              onOpen={() => setShowCurrencyPicker(true)}
            />
          </div>

          <PickerModal
            open={showClientPicker}
            onClose={() => setShowClientPicker(false)}
            title="Select client"
            options={(clients ?? []).map((c) => ({ id: c.id, label: c.name, sublabel: c.contactEmail }))}
            onSelect={(id) => setValue('clientId', id, { shouldValidate: true })}
          />

          <PickerModal
            open={showCurrencyPicker}
            onClose={() => setShowCurrencyPicker(false)}
            title="Select currency"
            options={CURRENCIES}
            onSelect={(id) => setValue('currency', id)}
          />

          <DatePickerModal
            open={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            value={selectedDueDate ?? null}
            onSelect={(iso) => { setValue('dueDate', iso); setShowDatePicker(false) }}
            onClear={() => setValue('dueDate', undefined)}
          />

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Line items</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">What the client is being billed for</p>
            </div>
            {errors.lineItems?.root && (
              <p className={`mb-2 ${errorText}`}>{errors.lineItems.root.message}</p>
            )}

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_4.5rem_6rem_6rem_1.5rem] gap-3 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit price</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {fields.map((field, index) => {
                  const item = lineItemValues[index]
                  const lineTotal = Math.round((item?.quantity || 0) * (item?.unitAmountDollars || 0) * 100)
                  return (
                    <div key={field.id} className="grid grid-cols-2 sm:grid-cols-[1fr_4.5rem_6rem_6rem_1.5rem] gap-3 p-3 items-center">
                      <input
                        {...register(`lineItems.${index}.description`)}
                        placeholder="e.g. Weekly office cleaning"
                        className={`${inputClass} col-span-2 sm:col-span-1`}
                      />
                      <div>
                        <p className="mb-1 sm:hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Qty</p>
                        <input
                          {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                          type="number"
                          min="1"
                          placeholder="1"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <p className="mb-1 sm:hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Unit price</p>
                        <input
                          {...register(`lineItems.${index}.unitAmountDollars`, { valueAsNumber: true })}
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:contents">
                        <p className="sm:hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Amount</p>
                        <p className="text-right text-sm font-medium text-gray-700 dark:text-gray-300 normal-case tracking-normal">
                          {(lineTotal / 100).toLocaleString('en-US', { style: 'currency', currency: (selectedCurrency || 'usd').toUpperCase() })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="justify-self-end text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => append({ description: '', quantity: 1, unitAmountDollars: 0 })}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline normal-case tracking-normal"
                >
                  + Add line item
                </button>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">
                  Total: {(invoiceTotalCents / 100).toLocaleString('en-US', { style: 'currency', currency: (selectedCurrency || 'usd').toUpperCase() })}
                </p>
              </div>
            </div>
          </div>

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
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 sm:px-6">Client</th>
                <th className="px-4 py-3 sm:px-6">Amount</th>
                <th className="hidden sm:table-cell px-4 py-3 sm:px-6">Due</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6" />
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
                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal sm:px-6">
                      {client?.name ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300 normal-case tracking-normal sm:px-6">
                      {formatCents(total, invoice.currency)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 text-gray-500 dark:text-gray-400 normal-case tracking-normal sm:px-6">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${STATUS_BADGE[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
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
const errorText = 'text-xs text-gray-600 dark:text-gray-400 normal-case tracking-normal'

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
