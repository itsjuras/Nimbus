import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useClients, useCreateClient } from '../../../hooks/useClients'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { useTheme } from '../../../contexts/ThemeContext'

export default function ClientsScreen() {
  const { data: clients, isLoading } = useClients()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { dark } = useTheme()

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#f3f4f6'

  const filtered = (clients ?? []).filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.address ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
            CLIENTS
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => setShowModal(true)}>
              <View
                style={{
                  backgroundColor: dark ? '#f9fafb' : '#111827',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>
                  ADD CLIENT
                </Text>
              </View>
            </Pressable>
            <ThemeToggle />
          </View>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search clients…"
          placeholderTextColor={mutedColor}
          style={{
            backgroundColor: inputBg,
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
            color: textColor,
          }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="No clients found" />
      ) : (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        {filtered.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            dark={dark}
            cardBg={cardBg}
            textColor={textColor}
            mutedColor={mutedColor}
            borderColor={borderColor}
            onPress={() => router.push(`/(owner)/clients/${client.id}`)}
          />
        ))}
      </ScrollView>
      )}

      <AddClientModal visible={showModal} onClose={() => setShowModal(false)} dark={dark} />
    </SafeAreaView>
  )
}

function ClientCard({
  client, dark, cardBg, textColor, mutedColor, borderColor, onPress,
}: {
  client: { id: string; name: string; address: string | null }
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
      <Animated.View
        style={{
          backgroundColor: cardBg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: 20,
          paddingVertical: 18,
          alignItems: 'center',
          transform: [{ scale }],
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>
          {client.name}
        </Text>
        {client.address != null && (
          <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center' }} numberOfLines={1}>
            {client.address}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  )
}

function AddClientModal({ visible, onClose, dark }: { visible: boolean; onClose: () => void; dark: boolean }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const createClient = useCreateClient()

  const cardBg = dark ? '#030712' : '#f9fafb'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#ffffff'

  function reset() {
    setName('')
    setAddress('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setNotes('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!name.trim()) return
    try {
      await createClient.mutateAsync({
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      handleClose()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add client.')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: cardBg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
        >
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={{ fontSize: 15, color: mutedColor }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
            ADD CLIENT
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Field label="Name" dark={dark}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Client name"
              placeholderTextColor={mutedColor}
              style={inputStyle(dark, inputBg, borderColor, textColor)}
            />
          </Field>

          <Field label="Address" dark={dark}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St"
              placeholderTextColor={mutedColor}
              style={inputStyle(dark, inputBg, borderColor, textColor)}
            />
          </Field>

          <Field label="Contact Name" dark={dark}>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="Jane Smith"
              placeholderTextColor={mutedColor}
              style={inputStyle(dark, inputBg, borderColor, textColor)}
            />
          </Field>

          <Field label="Contact Email" dark={dark}>
            <TextInput
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="jane@company.com"
              placeholderTextColor={mutedColor}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle(dark, inputBg, borderColor, textColor)}
            />
          </Field>

          <Field label="Contact Phone" dark={dark}>
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={mutedColor}
              keyboardType="phone-pad"
              style={inputStyle(dark, inputBg, borderColor, textColor)}
            />
          </Field>

          <Field label="Notes" dark={dark}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes…"
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
              style={[inputStyle(dark, inputBg, borderColor, textColor), { minHeight: 80, textAlignVertical: 'top' }]}
            />
          </Field>

          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim() || createClient.isPending}
            style={{
              backgroundColor: name.trim() ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: name.trim() ? (dark ? '#111827' : '#ffffff') : mutedColor }}>
              {createClient.isPending ? 'Adding…' : 'Add Client'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}

function Field({ label, dark, children }: { label: string; dark: boolean; children: React.ReactNode }) {
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {children}
    </View>
  )
}

function inputStyle(dark: boolean, inputBg: string, borderColor: string, textColor: string) {
  return {
    backgroundColor: inputBg,
    borderWidth: 1,
    borderColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: textColor,
  }
}
