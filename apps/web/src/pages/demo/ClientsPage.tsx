import { Link } from 'react-router-dom'
import { CLIENTS } from './_data'

export default function DemoClientsPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          disabled
          title="Not available in demo"
          className="cursor-not-allowed rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white opacity-50"
        >
          Add client
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {CLIENTS.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link to={`/demo/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {client.contactName}
                  <span className="ml-1 text-gray-400">({client.contactEmail})</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{client.address}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/demo/clients/${client.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
