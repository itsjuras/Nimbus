import { View } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children }: CardProps) {
  const { dark } = useTheme()

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
