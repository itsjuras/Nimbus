import { Text, View } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  const { dark } = useTheme()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
      <Text style={{ fontSize: 14, color: dark ? '#4b5563' : '#9ca3af', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  )
}
