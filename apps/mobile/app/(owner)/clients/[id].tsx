import { View, Text, ScrollView, Pressable } from 'react-native'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClient } from '../../../hooks/useClients'
import { useJobs } from '../../../hooks/useJobs'
import { StatusChip } from '../../../components/ui/StatusChip'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { dark } = useTheme()

  const { data: client, isLoading } = useClient(id ?? '')
  const { data: jobs } = useJobs()

  const clientJobs = (jobs ?? [])
    .filter((j) => j.clientId === id)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: mutedColor, fontSize: 14 }}>← Clients</Text>
        </Pressable>

        {client != null && (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold', marginBottom: 4 }}>
              {client.name}
            </Text>

            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 20, gap: 10 }}>
              {client.address != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 2 }}>ADDRESS</Text>
                  <Text style={{ fontSize: 14, color: textColor }}>{client.address}</Text>
                </View>
              )}
              {client.contactName != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 2 }}>CONTACT</Text>
                  <Text style={{ fontSize: 14, color: textColor }}>{client.contactName}</Text>
                </View>
              )}
              {client.contactEmail != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 2 }}>EMAIL</Text>
                  <Text style={{ fontSize: 14, color: textColor }}>{client.contactEmail}</Text>
                </View>
              )}
              {client.notes != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 2 }}>NOTES</Text>
                  <Text style={{ fontSize: 14, color: textColor }}>{client.notes}</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
              Job History
            </Text>

            {clientJobs.length === 0 ? (
              <Text style={{ color: mutedColor, textAlign: 'center', paddingVertical: 20 }}>No jobs yet</Text>
            ) : (
              clientJobs.map((job) => (
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
                  <Text style={{ fontSize: 13, color: mutedColor }}>
                    {new Date(job.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <StatusChip status={job.status} />
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
