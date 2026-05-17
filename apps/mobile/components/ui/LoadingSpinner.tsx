import { ActivityIndicator, View, useColorScheme } from 'react-native'

export function LoadingSpinner() {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
      <ActivityIndicator size="large" color={dark ? '#f9fafb' : '#111827'} />
    </View>
  )
}
