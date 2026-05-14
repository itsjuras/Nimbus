import { useState } from 'react'
import { INVOICES, getClient, formatCents, type InvoiceStatus } from './_data'

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-gray-200 text-gray-700',
  paid: 'bg-gray-900 text-white',
  void: 'bg-gray-100 text-gray-400',
}

export default function DemoInvoicesPage() {
  const [invoices, setInvoices] = useState(INVOICES)

  function sendInvoice(id: string) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'sent' as InvoiceStatus } : inv)),
    )
  }

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountCents, 0)

  const totalOutstanding = invoices
    .filter((i) => i.status === 'sent')
    .reduce((sum, i) => sum + i.amountCents, 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          disabled
          title="Not available in demo"
          className="cursor-not-allowed rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white opacity-50"
        >
          New invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total paid</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCents(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCents(totalOutstanding)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total invoices</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Due</th>
              <th className="px-6 py-3">Line items</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((invoice) => {
              const client = getClient(invoice.clientId)
              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{client?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-700">{formatCents(invoice.amountCents)}</td>
                  <td className="px-6 py-4 text-gray-500">{invoice.dueDate}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <ul className="space-y-0.5">
                      {invoice.lineItems.map((li, i) => (
                        <li key={i} className="text-xs">
                          {li.description}
                          {li.quantity > 1 && (
                            <span className="ml-1 text-gray-400">×{li.quantity}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[invoice.status]}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => sendInvoice(invoice.id)}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        Send
                      </button>
                    )}
                    {invoice.status === 'sent' && (
                      <span className="text-xs text-gray-400">Awaiting payment</span>
                    )}
                    {invoice.status === 'paid' && (
                      <span className="text-xs text-gray-400">Paid</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
