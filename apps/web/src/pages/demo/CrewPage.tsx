import { CREW, JOBS } from './_data'

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-gray-900 text-white',
  manager: 'bg-gray-200 text-gray-700',
  crew: 'bg-gray-100 text-gray-600',
}

export default function DemoCrewPage() {
  const jobCountFor = (crewId: string) =>
    JOBS.filter((j) => j.crewIds.includes(crewId) && j.status === 'completed').length

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Crew</h1>
        <button
          disabled
          title="Not available in demo"
          className="cursor-not-allowed rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white opacity-50"
        >
          Invite crew
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Jobs completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {CREW.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                      {member.fullName.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{member.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[member.role]}`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{member.phone}</td>
                <td className="px-6 py-4 text-gray-500">{member.email}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">{jobCountFor(member.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
