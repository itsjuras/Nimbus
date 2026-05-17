import { View, Text, ScrollView, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMyJobs } from '../../../hooks/useCrewJobs'
import { useClients } from '../../../hooks/useClients'
import { JobCard } from '../../../components/jobs/JobCard'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function CrewJobsScreen() {
  const { data: jobs, isLoading } = useMyJobs()
  const { data: clients } = useClients()
  const router = useRouter()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const sorted = (jobs ?? []).sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )

  const bg = dark ? '#030712' : '#f9fafb'
  const textColor = dark ? '#f9fafb' : '#111827'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
          MY JOBS
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : sorted.length === 0 ? (
        <EmptyState message="No jobs assigned to you" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {sorted.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              clientName={clientMap.get(job.clientId) ?? '—'}
              onPress={() => router.push(`/(crew)/jobs/${job.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
