import { ActivityIndicator, View } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

export function LoadingSpinner() {
  const { dark } = useTheme()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
      <ActivityIndicator size="large" color={dark ? '#f9fafb' : '#111827'} />
    </View>
  )
}
