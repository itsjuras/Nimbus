import { useRef } from 'react'
import { View, Pressable, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useTheme } from '../../contexts/ThemeContext'

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets()
  const { dark } = useTheme()

  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => {
      if (route.name.includes('[')) return false
      const opts = descriptors[route.key]?.options as
        | { href?: unknown; tabBarButton?: unknown }
        | undefined
      if (opts?.href === null) return false
      if (opts?.tabBarButton !== undefined) return false
      return true
    })

  const scales = useRef(visibleRoutes.map(() => new Animated.Value(1))).current

  function handlePress(slot: number, routeKey: string, routeName: string, isFocused: boolean) {
    Animated.sequence([
      Animated.spring(scales[slot]!, {
        toValue: 0.78,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.spring(scales[slot]!, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 14,
      }),
    ]).start()

    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true })
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName)
    }
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottom + 4,
        left: 32,
        right: 32,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: dark ? 'rgba(17,24,39,0.94)' : 'rgba(255,255,255,0.94)',
          borderRadius: 40,
          paddingVertical: 10,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: dark ? 0.55 : 0.12,
          shadowRadius: 28,
          elevation: 16,
          borderWidth: 0.5,
          borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
        }}
      >
        {visibleRoutes.map(({ route, index }, slot) => {
          const { options } = descriptors[route.key]!
          const isFocused = state.index === index
          const color = isFocused
            ? dark ? '#f9fafb' : '#111827'
            : dark ? '#4b5563' : '#c0c0c0'

          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(slot, route.key, route.name, isFocused)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scales[slot]! }],
                  paddingVertical: 8,
                }}
              >
                {options.tabBarIcon?.({ focused: isFocused, color, size: 26 })}
              </Animated.View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
