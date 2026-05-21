import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const { dark } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const bg = dark ? '#030712' : '#f9fafb'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#111827' : '#ffffff'
  const cardBg = dark ? '#111827' : '#ffffff'

  const canSubmit = !loading && !!email && !!password

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 52 }}>
            <Image
              source={require('../../assets/NimbusSymbolLogo.png')}
              style={{ width: 110, height: 110, resizeMode: 'contain', marginBottom: 8 }}
            />
            <Image
              source={require('../../assets/NimbusTextLogo.png')}
              style={{ width: 200, height: 46, resizeMode: 'contain', tintColor: textColor }}
            />
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={{
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: textColor,
                }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                autoComplete="current-password"
                style={{
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: textColor,
                }}
              />
            </View>

            {error != null && (
              <View style={{ backgroundColor: dark ? '#1f2937' : '#f3f4f6', borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 13, color: dark ? '#9ca3af' : '#374151' }}>{error}</Text>
              </View>
            )}

            <Pressable onPress={handleLogin} disabled={!canSubmit}>
              <View
                style={{
                  backgroundColor: canSubmit ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 4,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading && (
                  <ActivityIndicator size="small" color={canSubmit ? (dark ? '#111827' : '#ffffff') : mutedColor} />
                )}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    letterSpacing: 1,
                    color: canSubmit ? (dark ? '#111827' : '#ffffff') : mutedColor,
                    fontFamily: 'IBMPlexMono_700Bold',
                  }}
                >
                  {loading ? 'SIGNING IN…' : 'SIGN IN'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
