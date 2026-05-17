import { useState } from 'react'
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJobs } from '../../../hooks/useJobs'
import { useClients } from '../../../hooks/useClients'
import { JobCard } from '../../../components/jobs/JobCard'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import type { JobStatus } from '@nimbus/shared'

const STATUSES: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
]

export default function JobsScreen() {
  const [filter, setFilter] = useState<JobStatus | 'all'>('all')
  const router = useRouter()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  const { data: jobs, isLoading } = useJobs(filter !== 'all' ? { status: filter } : {})
  const { data: clients } = useClients()
  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const bg = dark ? '#030712' : '#f9fafb'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const chipBg = (active: boolean) => (active ? (dark ? '#f9fafb' : '#111827') : dark ? '#1f2937' : '#f3f4f6')
  const chipText = (active: boolean) => (active ? (dark ? '#111827' : '#ffffff') : mutedColor)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: textColor,
            letterSpacing: 1,
            fontFamily: 'IBMPlexMono_700Bold',
            marginBottom: 16,
          }}
        >
          JOBS
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={{
                backgroundColor: chipBg(filter === value),
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  color: chipText(filter === value),
                }}
              >
                {label.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {(jobs ?? []).length === 0 ? (
            <EmptyState message="No jobs found" />
          ) : (
            (jobs ?? [])
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  clientName={clientMap.get(job.clientId) ?? '—'}
                  onPress={() => router.push(`/(owner)/jobs/${job.id}`)}
                />
              ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
