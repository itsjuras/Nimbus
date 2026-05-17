import { Text, View, useColorScheme } from 'react-native'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
      <Text style={{ fontSize: 14, color: dark ? '#4b5563' : '#9ca3af', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  )
}
