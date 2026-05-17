import { View, Text, ScrollView, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMyJobs } from '../../hooks/useCrewJobs'
import { useClients } from '../../hooks/useClients'
import { JobCard } from '../../components/jobs/JobCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'

export default function CrewHomeScreen() {
  const { data: jobs, isLoading } = useMyJobs()
  const { data: clients } = useClients()
  const router = useRouter()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const today = new Date().toDateString()
  const now = Date.now()

  const todayJobs = (jobs ?? []).filter(
    (j) => new Date(j.scheduledAt).toDateString() === today && j.status !== 'completed' && j.status !== 'missed',
  )
  const upcoming = (jobs ?? [])
    .filter((j) => new Date(j.scheduledAt).getTime() > now && new Date(j.scheduledAt).toDateString() !== today)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 10)

  const bg = dark ? '#030712' : '#f9fafb'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold', marginBottom: 24 }}>
          MY SHIFTS
        </Text>

        {/* Today */}
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
          Today
        </Text>

        {todayJobs.length === 0 ? (
          <View style={{ paddingVertical: 20, marginBottom: 24 }}>
            <Text style={{ color: dark ? '#374151' : '#d1d5db', textAlign: 'center' }}>No shifts today</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            {todayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                clientName={clientMap.get(job.clientId) ?? '—'}
                onPress={() => router.push(`/(crew)/jobs/${job.id}`)}
              />
            ))}
          </View>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
              Upcoming
            </Text>
            {upcoming.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                clientName={clientMap.get(job.clientId) ?? '—'}
                onPress={() => router.push(`/(crew)/jobs/${job.id}`)}
              />
            ))}
          </>
        )}

        {todayJobs.length === 0 && upcoming.length === 0 && (
          <EmptyState message="No upcoming shifts" />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
