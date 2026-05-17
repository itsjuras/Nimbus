import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'
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

  const bg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#f9fafb'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: textColor,
              letterSpacing: 2,
              fontFamily: 'IBMPlexMono_700Bold',
            }}
          >
            NIMBUS
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: mutedColor }}>
            Sign in to your account
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.5,
                color: mutedColor,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
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
                fontSize: 16,
                color: textColor,
              }}
            />
          </View>

          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.5,
                color: mutedColor,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
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
                fontSize: 16,
                color: textColor,
              }}
            />
          </View>

          {error != null && (
            <View
              style={{
                backgroundColor: dark ? '#1f2937' : '#f3f4f6',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: dark ? '#9ca3af' : '#374151' }}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={loading || !email || !password}
            style={({ pressed }) => ({
              backgroundColor:
                loading || !email || !password ? (dark ? '#1f2937' : '#e5e7eb') : dark ? '#f9fafb' : '#111827',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
              opacity: pressed ? 0.85 : 1,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            })}
          >
            {loading && (
              <ActivityIndicator
                size="small"
                color={loading || !email || !password ? '#9ca3af' : dark ? '#111827' : '#ffffff'}
              />
            )}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 0.5,
                color:
                  loading || !email || !password ? (dark ? '#4b5563' : '#9ca3af') : dark ? '#111827' : '#ffffff',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
