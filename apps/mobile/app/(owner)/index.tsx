import { ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLiveJobs } from '../../hooks/useLiveJobs'
import { useClients } from '../../hooks/useClients'
import { JobCard } from '../../components/jobs/JobCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'
import type { JobStatus } from '@nimbus/shared'

const COLUMNS: { status: JobStatus; label: string }[] = [
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
  { status: 'missed', label: 'Missed' },
]

export default function DashboardScreen() {
  const { data: jobs, isLoading } = useLiveJobs()
  const { data: clients } = useClients()
  const router = useRouter()
  const { dark } = useTheme()

  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const byStatus = (status: JobStatus) =>
    (jobs ?? [])
      .filter((j) => j.status === status)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const today = new Date().toDateString()
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const todayCount = (jobs ?? []).filter((j) => new Date(j.scheduledAt).toDateString() === today).length
  const liveCount = byStatus('in_progress').length
  const weekCount = (jobs ?? []).filter((j) => j.status === 'completed' && new Date(j.scheduledAt).getTime() >= weekAgo).length
  const clientCount = clients?.length ?? 0

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: textColor,
              letterSpacing: 1,
              fontFamily: 'IBMPlexMono_700Bold',
            }}
          >
            DASHBOARD
          </Text>
          <ThemeToggle />
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {[
            { label: "Today's Jobs", value: todayCount },
            { label: 'Live Now', value: liveCount },
            { label: 'Done This Week', value: weekCount },
            { label: 'Clients', value: clientCount },
          ].map(({ label, value }) => (
            <View
              key={label}
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 0.5, marginBottom: 4 }}>
                {label.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: textColor }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Kanban columns */}
        {COLUMNS.map(({ status, label }) => {
          const columnJobs = byStatus(status)
          return (
            <View key={status} style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1.5,
                    color: mutedColor,
                    textTransform: 'uppercase',
                    fontFamily: 'IBMPlexMono_700Bold',
                  }}
                >
                  {label}
                </Text>
                <View
                  style={{
                    backgroundColor: dark ? '#1f2937' : '#f3f4f6',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor }}>
                    {columnJobs.length}
                  </Text>
                </View>
              </View>

              {columnJobs.length === 0 ? (
                <Text style={{ fontSize: 13, color: dark ? '#374151' : '#d1d5db', textAlign: 'center', paddingVertical: 20 }}>
                  No jobs
                </Text>
              ) : (
                columnJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    clientName={clientMap.get(job.clientId) ?? '—'}
                    onPress={() => router.push(`/(owner)/jobs/${job.id}`)}
                  />
                ))
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
