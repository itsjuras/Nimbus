import { View, Text, ScrollView, Pressable, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useClients } from '../../../hooks/useClients'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { useTheme } from '../../../contexts/ThemeContext'

export default function ClientsScreen() {
  const { data: clients, isLoading } = useClients()
  const router = useRouter()
  const [search, setSearch] = useState('')
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
          <ThemeToggle />
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
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {filtered.map((client) => (
            <Pressable
              key={client.id}
              onPress={() => router.push(`/(owner)/clients/${client.id}`)}
              style={({ pressed }) => ({
                backgroundColor: cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                padding: 16,
                marginBottom: 10,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{client.name}</Text>
              {client.address != null && (
                <Text style={{ fontSize: 13, color: mutedColor, marginTop: 4 }}>{client.address}</Text>
              )}
              {client.contactName != null && (
                <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{client.contactName}</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
