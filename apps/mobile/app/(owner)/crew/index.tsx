import { useState } from 'react'
import { View, Text, ScrollView, Pressable, Animated, Modal, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCrewMembers, useInviteCrew } from '../../../hooks/useCrew'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { useTheme } from '../../../contexts/ThemeContext'

export default function CrewScreen() {
  const { data: crew, isLoading } = useCrewMembers()
  const router = useRouter()
  const { dark } = useTheme()
  const [showModal, setShowModal] = useState(false)

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
          CREW
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => setShowModal(true)}>
            <View style={{
              backgroundColor: dark ? '#f9fafb' : '#111827',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>
                ADD CREW MEMBER
              </Text>
            </View>
          </Pressable>
          <ThemeToggle />
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (crew ?? []).length === 0 ? (
        <EmptyState message="No crew members" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
          {(crew ?? []).map((member) => (
            <CrewPill
              key={member.id}
              member={member}
              dark={dark}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
              onPress={() => router.push(`/(owner)/crew/${member.id}`)}
            />
          ))}
        </ScrollView>
      )}

      <AddCrewModal visible={showModal} onClose={() => setShowModal(false)} dark={dark} />
    </SafeAreaView>
  )
}

function CrewPill({
  member, dark, cardBg, textColor, mutedColor, borderColor, onPress,
}: {
  member: { id: string; fullName: string; role: string }
  dark: boolean
  cardBg: string
  textColor: string
  mutedColor: string
  borderColor: string
  onPress: () => void
}) {
  const scale = new Animated.Value(1)

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: 'center',
        transform: [{ scale }],
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>
          {member.fullName}
        </Text>
        <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }} numberOfLines={1}>
          {member.role}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

function AddCrewModal({ visible, onClose, dark }: { visible: boolean; onClose: () => void; dark: boolean }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'crew' | 'manager'>('crew')
  const inviteCrew = useInviteCrew()

  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#ffffff'

  function reset() {
    setFullName('')
    setEmail('')
    setPhone('')
    setRole('crew')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) return
    try {
      await inviteCrew.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
      })
      handleClose()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to invite crew member.')
    }
  }

  const canSubmit = !!fullName.trim() && !!email.trim() && !inviteCrew.isPending

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: dark ? '#030712' : '#f9fafb' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={{ fontSize: 15, color: mutedColor }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
            ADD CREW MEMBER
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {/* Name */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Smith"
              placeholderTextColor={mutedColor}
              style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: textColor }}
            />
          </View>

          {/* Email */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="jane@company.com"
              placeholderTextColor={mutedColor}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: textColor }}
            />
          </View>

          {/* Phone */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>Phone (optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={mutedColor}
              keyboardType="phone-pad"
              style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: textColor }}
            />
          </View>

          {/* Role */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>Role</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['crew', 'manager'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={{
                    flex: 1,
                    backgroundColor: role === r ? (dark ? '#f9fafb' : '#111827') : inputBg,
                    borderWidth: 1,
                    borderColor: role === r ? (dark ? '#f9fafb' : '#111827') : borderColor,
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: role === r ? (dark ? '#111827' : '#ffffff') : mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: canSubmit ? (dark ? '#111827' : '#ffffff') : mutedColor }}>
              {inviteCrew.isPending ? 'Sending Invite…' : 'Send Invite'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}
