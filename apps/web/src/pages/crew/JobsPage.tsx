import { Link } from 'react-router-dom'
import { useMyJobs } from '../../hooks/useCrewJobs'
import type { Job, JobStatus } from '@nimbus/shared'

const STATUS_STYLE: Record<JobStatus, { badge: string; label: string }> = {
  scheduled: { badge: 'bg-gray-100 text-gray-600', label: 'Scheduled' },
  in_progress: { badge: 'bg-gray-900 text-white', label: 'In Progress' },
  completed: { badge: 'bg-gray-100 text-gray-900', label: 'Completed' },
  missed: { badge: 'bg-gray-100 text-gray-400', label: 'Missed' },
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function JobCard({ job }: { job: Job }) {
  const style = STATUS_STYLE[job.status]
  const date = new Date(job.scheduledAt)

  return (
    <Link
      to={`/crew/jobs/${job.id}`}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{job.clientName ?? '—'}</p>
        <p className="mt-0.5 text-sm text-gray-500">
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!isToday(job.scheduledAt) && ` · ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </p>
      </div>
      <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>
        {style.label}
      </span>
    </Link>
  )
}

export default function CrewJobsPage() {
  const { data: jobs, isLoading } = useMyJobs()

  const activeJobs = jobs?.filter((j) => j.status === 'in_progress') ?? []
  const todayJobs = jobs?.filter((j) => j.status === 'scheduled' && isToday(j.scheduledAt)) ?? []
  const upcomingJobs =
    jobs?.filter((j) => j.status === 'scheduled' && !isToday(j.scheduledAt)) ?? []
  const pastJobs = jobs?.filter((j) => j.status === 'completed' || j.status === 'missed') ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {jobs?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No jobs assigned to you yet.</p>
        </div>
      )}

      {activeJobs.length > 0 && (
        <Section title="In Progress">
          {activeJobs.map((job) => <JobCard key={job.id} job={job} />)}
        </Section>
      )}

      {todayJobs.length > 0 && (
        <Section title="Today">
          {todayJobs.map((job) => <JobCard key={job.id} job={job} />)}
        </Section>
      )}

      {upcomingJobs.length > 0 && (
        <Section title="Upcoming">
          {upcomingJobs.map((job) => <JobCard key={job.id} job={job} />)}
        </Section>
      )}

      {pastJobs.length > 0 && (
        <Section title="Recent">
          {pastJobs.slice(0, 5).map((job) => <JobCard key={job.id} job={job} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
