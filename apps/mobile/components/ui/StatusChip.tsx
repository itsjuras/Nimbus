import { Text, View } from 'react-native'
import type { JobStatus } from '@nimbus/shared'
import { useTheme } from '../../contexts/ThemeContext'

const LABELS: Record<JobStatus, string> = {
  scheduled: 'SCHEDULED',
  in_progress: 'IN PROGRESS',
  completed: 'COMPLETED',
  missed: 'MISSED',
}

interface StatusChipProps {
  status: JobStatus
}

export function StatusChip({ status }: StatusChipProps) {
  const { dark } = useTheme()

  const styles = chipStyles(status, dark)

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: styles.bg,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1,
          color: styles.text,
        }}
      >
        {LABELS[status]}
      </Text>
    </View>
  )
}

function chipStyles(status: JobStatus, dark: boolean) {
  switch (status) {
    case 'scheduled':
      return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#9ca3af' : '#4b5563' }
    case 'in_progress':
      return { bg: dark ? '#f3f4f6' : '#111827', text: dark ? '#111827' : '#ffffff' }
    case 'completed':
      return { bg: dark ? '#374151' : '#e5e7eb', text: dark ? '#d1d5db' : '#374151' }
    case 'missed':
      return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#6b7280' : '#9ca3af' }
  }
}
