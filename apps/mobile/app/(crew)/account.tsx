import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TimeOffRequest {
  id: string
  startDate: string
  endDate: string
  reason: string | null
  status: 'pending' | 'approved' | 'denied'
}

interface AvailabilityDay {
  dayOfWeek: number
  available: boolean
}

export default function AccountScreen() {
  const { profile, signOut } = useAuth()
  const queryClient = useQueryClient()
  const { dark } = useTheme()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#f3f4f6'

  const { data: timeOffRequests } = useQuery({
    queryKey: ['time-off'],
    queryFn: () => api.get<TimeOffRequest[]>('/api/v1/time-off'),
    enabled: !!profile,
  })

  const { data: availability } = useQuery({
    queryKey: ['availability'],
    queryFn: () => api.get<AvailabilityDay[]>('/api/v1/availability'),
    enabled: !!profile,
  })

  const submitTimeOff = useMutation({
    mutationFn: () =>
      api.post('/api/v1/time-off', { startDate, endDate, reason: reason || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off'] })
      setStartDate('')
      setEndDate('')
      setReason('')
    },
  })

  const toggleAvailability = useMutation({
    mutationFn: ({ dayOfWeek, available }: { dayOfWeek: number; available: boolean }) =>
      api.post('/api/v1/availability', { dayOfWeek, available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability'] }),
  })

  const availabilityMap = new Map((availability ?? []).map((a) => [a.dayOfWeek, a.available]))

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: dark ? '#1f2937' : '#f3f4f6', text: mutedColor },
    approved: { bg: dark ? '#374151' : '#e5e7eb', text: dark ? '#d1d5db' : '#374151' },
    denied: { bg: dark ? '#1f2937' : '#fef2f2', text: dark ? '#6b7280' : '#dc2626' },
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
            ACCOUNT
          </Text>
          <ThemeToggle />
        </View>
        {profile != null && (
          <Text style={{ fontSize: 14, color: mutedColor, marginBottom: 24 }}>{profile.fullName}</Text>
        )}

        {/* Weekly Availability */}
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
          Weekly Availability
        </Text>
        <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, marginBottom: 24, overflow: 'hidden' }}>
          {DAYS.map((day, i) => {
            const available = availabilityMap.get(i) ?? true
            return (
              <View
                key={day}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: i < DAYS.length - 1 ? 1 : 0,
                  borderBottomColor: borderColor,
                }}
              >
                <Text style={{ fontSize: 14, color: textColor, fontWeight: '500' }}>{day}</Text>
                <Switch
                  value={available}
                  onValueChange={(val) => toggleAvailability.mutate({ dayOfWeek: i, available: val })}
                  trackColor={{ false: dark ? '#374151' : '#d1d5db', true: dark ? '#d1d5db' : '#374151' }}
                  thumbColor={available ? (dark ? '#f9fafb' : '#111827') : (dark ? '#6b7280' : '#9ca3af')}
                />
              </View>
            )
          })}
        </View>

        {/* Time Off Request */}
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
          Request Time Off
        </Text>
        <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 24, gap: 12 }}>
          <View>
            <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>START DATE (YYYY-MM-DD)</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2025-06-01"
              placeholderTextColor={mutedColor}
              style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: textColor }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>END DATE (YYYY-MM-DD)</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2025-06-05"
              placeholderTextColor={mutedColor}
              style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: textColor }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>REASON (OPTIONAL)</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Vacation, appointment, etc."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: textColor, minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>
          <Pressable
            onPress={() => submitTimeOff.mutate()}
            disabled={!startDate || !endDate || submitTimeOff.isPending}
            style={({ pressed }) => ({
              backgroundColor: !startDate || !endDate ? (dark ? '#1f2937' : '#e5e7eb') : (dark ? '#f9fafb' : '#111827'),
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: !startDate || !endDate ? mutedColor : (dark ? '#111827' : '#ffffff') }}>
              {submitTimeOff.isPending ? 'Submitting…' : 'Submit Request'}
            </Text>
          </Pressable>
        </View>

        {/* Past Requests */}
        {(timeOffRequests ?? []).length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
              My Requests
            </Text>
            {(timeOffRequests ?? []).map((req) => {
              const chip = statusColors[req.status] ?? statusColors['pending']!
              return (
                <View
                  key={req.id}
                  style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 14, marginBottom: 10 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {req.startDate} — {req.endDate}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: chip.bg }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: chip.text }}>
                        {req.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {req.reason != null && (
                    <Text style={{ fontSize: 13, color: mutedColor, marginTop: 4 }}>{req.reason}</Text>
                  )}
                </View>
              )
            })}
            <View style={{ marginBottom: 16 }} />
          </>
        )}

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
