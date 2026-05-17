import { Pressable, Text, View } from 'react-native'
import { StatusChip } from '../ui/StatusChip'
import { useTheme } from '../../contexts/ThemeContext'
import type { Job } from '@nimbus/shared'

interface JobCardProps {
  job: Job
  clientName: string
  onPress: () => void
}

export function JobCard({ job, clientName, onPress }: JobCardProps) {
  const { dark } = useTheme()
  const scheduled = new Date(job.scheduledAt)
  const isToday = scheduled.toDateString() === new Date().toDateString()

  const timeLabel = isToday
    ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : scheduled.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: dark ? '#111827' : '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: dark ? '#1f2937' : '#e5e7eb',
        padding: 16,
        opacity: pressed ? 0.85 : 1,
        marginBottom: 10,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: dark ? '#f9fafb' : '#111827',
            flex: 1,
            marginRight: 8,
          }}
        >
          {clientName}
        </Text>
        <StatusChip status={job.status} />
      </View>

      <Text style={{ marginTop: 6, fontSize: 12, color: dark ? '#6b7280' : '#9ca3af' }}>
        {timeLabel}
      </Text>

      {job.notes != null && job.notes.length > 0 && (
        <Text
          numberOfLines={2}
          style={{ marginTop: 8, fontSize: 12, color: dark ? '#4b5563' : '#9ca3af' }}
        >
          {job.notes}
        </Text>
      )}

      {job.status === 'in_progress' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dark ? '#d1d5db' : '#111827',
            }}
          />
          <Text style={{ fontSize: 12, fontWeight: '500', color: dark ? '#9ca3af' : '#4b5563' }}>
            Live
          </Text>
        </View>
      )}
    </Pressable>
  )
}
