import { Pressable, Text, ActivityIndicator } from 'react-native'

interface ButtonProps {
  onPress: () => void
  label: string
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ onPress, label, loading, disabled, variant = 'primary' }: ButtonProps) {
  const isDisabled = disabled || loading

  const bgColor =
    variant === 'primary'
      ? isDisabled
        ? '#e5e7eb'
        : '#111827'
      : variant === 'secondary'
      ? '#f3f4f6'
      : 'transparent'

  const textColor =
    variant === 'primary'
      ? isDisabled
        ? '#9ca3af'
        : '#ffffff'
      : '#111827'

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: bgColor,
        opacity: pressed ? 0.85 : 1,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
      })}
    >
      {loading && <ActivityIndicator size="small" color={textColor} />}
      <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </Pressable>
  )
}
