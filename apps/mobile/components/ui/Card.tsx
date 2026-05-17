import { View, useColorScheme } from 'react-native'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children }: CardProps) {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  return (
    <View
      style={{
        backgroundColor: dark ? '#111827' : '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: dark ? '#1f2937' : '#e5e7eb',
        padding: 16,
      }}
    >
      {children}
    </View>
  )
}
