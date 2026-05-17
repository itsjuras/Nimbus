import { View, Text, ScrollView, Pressable } from 'react-native'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCrewMember } from '../../../hooks/useCrew'
import { useJobs } from '../../../hooks/useJobs'
import { useClients } from '../../../hooks/useClients'
import { StatusChip } from '../../../components/ui/StatusChip'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { dark } = useTheme()

  const { data: member, isLoading } = useCrewMember(id ?? '')
  const { data: jobs } = useJobs()
  const { data: clients } = useClients()
  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  if (isLoading) return <LoadingSpinner />
  if (!member) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ padding: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: mutedColor }}>← Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: mutedColor, fontSize: 14 }}>← Crew</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: dark ? '#1f2937' : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22, color: mutedColor, fontWeight: '600' }}>
              {member.fullName[0]?.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
              {member.fullName}
            </Text>
            <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, textTransform: 'uppercase' }}>
              {member.role}
            </Text>
          </View>
        </View>

        {member.phone != null && (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 4 }}>PHONE</Text>
            <Text style={{ fontSize: 14, color: textColor }}>{member.phone}</Text>
          </View>
        )}

        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
          Assigned Jobs
        </Text>

        {(jobs ?? []).length === 0 ? (
          <Text style={{ color: mutedColor, textAlign: 'center', paddingVertical: 20 }}>No jobs found</Text>
        ) : (
          (jobs ?? [])
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
            .slice(0, 20)
            .map((job) => (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(owner)/jobs/${job.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor,
                  padding: 14,
                  marginBottom: 10,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                })}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                    {clientMap.get(job.clientId) ?? '—'}
                  </Text>
                  <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                    {new Date(job.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <StatusChip status={job.status} />
              </Pressable>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
