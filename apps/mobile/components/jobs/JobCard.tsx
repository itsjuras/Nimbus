import { Pressable, Text, View, Animated } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import type { Job, JobStatus } from '@nimbus/shared'

interface JobCardProps {
  job: Job
  clientName: string
  onPress: () => void
}

const STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: 'SCHEDULED',
  in_progress: 'IN PROGRESS',
  completed: 'COMPLETED',
  missed: 'MISSED',
}

function chipStyle(status: JobStatus, dark: boolean) {
  switch (status) {
    case 'scheduled': return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#9ca3af' : '#4b5563' }
    case 'in_progress': return { bg: dark ? '#f9fafb' : '#111827', text: dark ? '#111827' : '#ffffff' }
    case 'completed': return { bg: dark ? '#374151' : '#e5e7eb', text: dark ? '#d1d5db' : '#374151' }
    case 'missed': return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#6b7280' : '#9ca3af' }
  }
}

export function JobCard({ job, clientName, onPress }: JobCardProps) {
  const { dark } = useTheme()
  const scale = new Animated.Value(1)

  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  const scheduled = new Date(job.scheduledAt)
  const isToday = scheduled.toDateString() === new Date().toDateString()
  const dateLabel = isToday
    ? 'Today'
    : scheduled.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeLabel = scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const chip = chipStyle(job.status, dark)

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginBottom: 10 }}>
      <Animated.View style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: 'center',
        transform: [{ scale }],
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6, textAlign: 'center' }}>
          {clientName}
        </Text>
        <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 10 }}>
          {dateLabel} · {timeLabel}
        </Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: chip.bg }}>
          <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: chip.text }}>
            {STATUS_LABELS[job.status]}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  )
}
