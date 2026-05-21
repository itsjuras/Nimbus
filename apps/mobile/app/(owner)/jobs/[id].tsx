import { ScrollView, View, Text, Pressable } from 'react-native'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJob, useUpdateJob } from '../../../hooks/useJobs'
import { StatusChip } from '../../../components/ui/StatusChip'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Feather } from '@expo/vector-icons'
import type { JobStatus } from '@nimbus/shared'

const STATUS_TRANSITIONS: { from: JobStatus; to: JobStatus; label: string }[] = [
  { from: 'in_progress', to: 'missed', label: 'Mark Missed' },
  { from: 'scheduled', to: 'missed', label: 'Mark Missed' },
]

export default function OwnerJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { dark } = useTheme()

  const { data: job, isLoading } = useJob(id ?? '')
  const updateJob = useUpdateJob(id ?? '')

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  if (isLoading) return <LoadingSpinner />
  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ padding: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: mutedColor, marginBottom: 16 }}>← Back</Text>
          </Pressable>
          <Text style={{ color: mutedColor }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const completedCount = job.checklistItems.filter((i) => i.completed).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: mutedColor, fontSize: 14 }}>← Jobs</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold', flex: 1, marginRight: 8 }}>
            {job.clientName}
          </Text>
          <StatusChip status={job.status} />
        </View>

        <Text style={{ color: mutedColor, fontSize: 13, marginBottom: 20 }}>
          {new Date(job.scheduledAt).toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>

        {/* Checklist Progress */}
        {job.checklistItems.length > 0 && (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
              Checklist
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: mutedColor }}>{completedCount} of {job.checklistItems.length} done</Text>
              <Text style={{ fontSize: 13, color: mutedColor }}>
                {job.checklistItems.length > 0 ? Math.round((completedCount / job.checklistItems.length) * 100) : 0}%
              </Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: dark ? '#1f2937' : '#f3f4f6' }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: dark ? '#f9fafb' : '#111827',
                  width: `${job.checklistItems.length > 0 ? Math.round((completedCount / job.checklistItems.length) * 100) : 0}%`,
                }}
              />
            </View>
            {job.checklistItems.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: dark ? '#1f2937' : '#f3f4f6',
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 14, color: item.completed ? mutedColor : textColor }}>
                  {item.completed ? '✓' : '○'}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: item.completed ? mutedColor : textColor,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </Text>
                {item.requiresPhoto && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="camera" size={13} color={item.photos.length > 0 ? mutedColor : '#ef4444'} />
                    {item.photos.length > 0 && (
                      <Text style={{ fontSize: 11, color: mutedColor }}>{item.photos.length}</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Crew */}
        {job.crew.length > 0 && (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
              Assigned Crew
            </Text>
            {job.crew.map((member) => (
              <View key={member.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: dark ? '#1f2937' : '#f3f4f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, color: mutedColor }}>{member.fullName[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{member.fullName}</Text>
                  <Text style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {member.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {job.notes != null && (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
              Notes
            </Text>
            <Text style={{ fontSize: 14, color: textColor, lineHeight: 22 }}>{job.notes}</Text>
          </View>
        )}

        {/* Status actions */}
        {STATUS_TRANSITIONS.filter((t) => t.from === job.status).map(({ to, label }) => (
          <Pressable
            key={to}
            onPress={() => updateJob.mutate({ status: to })}
            disabled={updateJob.isPending}
          >
            <View
              style={{
                borderWidth: 1,
                borderColor: mutedColor,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: 'center',
                marginBottom: 10,
                backgroundColor: 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor }}>{label}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
