import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/ThemeContext'

export function ThemeToggle() {
  const { dark, toggle } = useTheme()
  const trackBg = dark ? '#374151' : '#e5e7eb'
  const knobBg = '#ffffff'
  const iconColor = dark ? '#374151' : '#9ca3af'

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel="Toggle dark mode"
      style={{
        width: 56,
        height: 30,
        borderRadius: 999,
        backgroundColor: trackBg,
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: knobBg,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX: dark ? 26 : 0 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Ionicons name={dark ? 'moon' : 'sunny'} size={14} color={iconColor} />
      </View>
    </Pressable>
  )
}
